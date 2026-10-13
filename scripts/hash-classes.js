const crypto = require('node:crypto');
const acorn = require('acorn');
const cssTree = require('css-tree');
const { parseFragment } = require('parse5');

const CLASS_TOKEN = /[^\t\n\f\r ]+/g;
const SELECTOR_METHODS = new Set(['querySelector', 'querySelectorAll', 'matches', 'closest']);
const CLASS_LIST_METHODS = new Set(['add', 'remove', 'contains', 'toggle', 'replace']);
const MAX_HASH_LENGTH = 8;
const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const INITIAL_LETTERS = BASE62.slice(10);

function encodeClassHash(value, length) {
    const suffixSpace = BASE62.length ** (length - 1);
    let suffix = value % suffixSpace;
    let encoded = '';
    for (let i = 1; i < length; i++) {
        encoded = BASE62[suffix % BASE62.length] + encoded;
        suffix = Math.floor(suffix / BASE62.length);
    }
    // 首位限定为 a-zA-Z，避免 CSS 数字开头的转义；其余位使用完整 Base62
    return INITIAL_LETTERS[Math.floor(value / suffixSpace)] + encoded;
}

function createClassMap(names) {
    const mapping = new Map();
    const used = new Set();
    for (const name of [...new Set(names)].sort()) {
        const length = Math.min(name.length, MAX_HASH_LENGTH);
        const capacity = INITIAL_LETTERS.length * BASE62.length ** (length - 1);
        const hash = crypto.createHash('sha256').update(`bblock:class:${name}`).digest('hex');
        // 使用完整 SHA-256 取模，避免仅截取 32 位而浪费 Base62 的候选空间
        const seed = Number(BigInt(`0x${hash}`) % BigInt(capacity));
        let candidate;
        // 确定性探测整个候选空间；耗尽时明确报错，不能悄悄复用类名
        for (let offset = 0; offset < capacity; offset++) {
            candidate = encodeClassHash((seed + offset) % capacity, length);
            if (!used.has(candidate)) break;
            candidate = undefined;
        }
        if (candidate === undefined) {
            throw new Error(`Cannot hash class "${name}": all ${capacity} Base62 names of length ${length} are taken.`);
        }
        mapping.set(name, candidate);
        used.add(candidate);
    }
    return mapping;
}

function replaceRanges(source, edits) {
    for (const { start, end, value } of edits.sort((a, b) => b.start - a.start)) {
        source = source.slice(0, start) + value + source.slice(end);
    }
    return source;
}

function classSelectors(ast) {
    const selectors = [];
    cssTree.walk(ast, (node) => {
        if (node.type === 'ClassSelector') selectors.push(node);
    });
    return selectors;
}

function parseSelector(value) {
    return cssTree.parse(value, { context: 'selectorList', positions: true });
}

function selectorName(node) {
    return cssTree.ident.decode(node.name);
}

function rewriteSelectors(source, nodes, mapping) {
    return replaceRanges(source, nodes.map((node) => ({
        start: node.loc.start.offset,
        end: node.loc.end.offset,
        value: '.' + mapping.get(selectorName(node))
    })));
}

function memberName(node) {
    if (node?.type !== 'MemberExpression') return undefined;
    return node.computed ? staticString(node.property) : node.property.name;
}

function staticString(node) {
    if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
    if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) {
        return node.quasis[0].value.cooked;
    }
    return undefined;
}

function walkJS(node, visit) {
    if (!node || typeof node.type !== 'string') return;
    visit(node);
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach((child) => walkJS(child, visit));
        else if (value && typeof value === 'object') walkJS(value, visit);
    }
}

// 仅收集 DOM 选择器/类名位置，不能改动 config.cover、事件名或普通文本
function jsClassReferences(js) {
    const references = [];
    const add = (node, selector = false) => {
        const value = staticString(node);
        if (value === undefined) {
            throw new Error(`Class hashing requires a static DOM ${selector ? 'selector' : 'class name'} at JS offset ${node?.start}.`);
        }
        references.push({ node, value, selectors: selector ? classSelectors(parseSelector(value)) : null });
    };
    walkJS(acorn.parse(js, { ecmaVersion: 'latest' }), (node) => {
        if (node.type === 'AssignmentExpression' && memberName(node.left) === 'className') {
            add(node.right);
        }
        if (node.type !== 'CallExpression') return;
        const method = memberName(node.callee);
        if (SELECTOR_METHODS.has(method)) {
            add(node.arguments[0], true);
        } else if (method === 'getElementsByClassName') {
            add(node.arguments[0]);
        } else if (memberName(node.callee.object) === 'classList' && CLASS_LIST_METHODS.has(method)) {
            const count = method === 'replace' ? 2 : ['toggle', 'contains'].includes(method) ? 1 : node.arguments.length;
            node.arguments.slice(0, count).forEach((argument) => add(argument));
        } else if (method === 'setAttribute' && staticString(node.arguments[0]) === 'class') {
            add(node.arguments[1]);
        }
    });
    return references;
}

function htmlClassAttributes(html) {
    const attributes = [];
    const walk = (node) => {
        const attribute = node.attrs?.find((attr) => attr.name === 'class');
        if (attribute) {
            attributes.push({ value: attribute.value, location: node.sourceCodeLocation.attrs.class });
        }
        node.childNodes?.forEach(walk);
        if (node.content) walk(node.content);
    };
    walk(parseFragment(html, { sourceCodeLocationInfo: true }));
    return attributes;
}

function hashClasses({ js, css, html }) {
    const cssSelectors = classSelectors(cssTree.parse(css, { positions: true, parseValue: false }));
    const htmlAttributes = htmlClassAttributes(html);
    const jsReferences = jsClassReferences(js);
    const names = new Set(cssSelectors.map(selectorName));
    const collectTokens = (value) => {
        for (const name of value.match(CLASS_TOKEN) || []) names.add(name);
    };
    htmlAttributes.forEach(({ value }) => collectTokens(value));
    jsReferences.forEach(({ value, selectors }) => {
        if (selectors) selectors.forEach((node) => names.add(selectorName(node)));
        else collectTokens(value);
    });
    const mapping = createClassMap(names);
    const rewriteTokens = (value) => value.replace(CLASS_TOKEN, (name) => mapping.get(name));
    return {
        css: rewriteSelectors(css, cssSelectors, mapping),
        html: replaceRanges(html, htmlAttributes.map(({ value, location }) => ({
            start: location.startOffset,
            end: location.endOffset,
            value: `class="${rewriteTokens(value)}"`
        }))),
        js: replaceRanges(js, jsReferences.map(({ node, value, selectors }) => ({
            start: node.start,
            end: node.end,
            value: JSON.stringify(selectors ? rewriteSelectors(value, selectors, mapping) : rewriteTokens(value))
        }))),
        classMap: Object.fromEntries(mapping)
    };
}

module.exports = { hashClasses, createClassMap };
