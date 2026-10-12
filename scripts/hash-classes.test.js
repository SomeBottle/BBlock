const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const cssTree = require('css-tree');
const { parseFragment } = require('parse5');
const { hashClasses, createClassMap } = require('./hash-classes');

test('class hashes are deterministic, unique, valid Base62 identifiers and preserve lengths up to 8', () => {
    const names = ['bblock-wrapper', 'cover', 'tip', 'bar', 'play', 'artist', 'moveAni', 'controls', 'a'];
    const mapping = createClassMap(names);
    assert.deepEqual(mapping, createClassMap([...names].reverse()));
    assert.equal(new Set(mapping.values()).size, names.length);
    for (const [original, hashed] of mapping) {
        assert.equal(hashed.length, Math.min(original.length, 8));
        assert.match(hashed, /^[a-zA-Z][0-9a-zA-Z]*$/);
    }
});

test('forced hash collisions resolve deterministically across Base62 digit boundaries', (t) => {
    t.mock.method(crypto, 'createHash', () => ({
        update() { return this; },
        digest() { return '0'.repeat(64); }
    }));
    const names = Array.from({ length: 64 }, (_, i) => `class-${i.toString().padStart(2, '0')}`);
    const mapping = createClassMap(names);
    assert.equal(new Set(mapping.values()).size, names.length);
    assert.deepEqual(mapping, createClassMap([...names].reverse()));
    assert.equal(mapping.get('class-00'), 'a0000000');
    assert.equal(mapping.get('class-61'), 'a000000Z');
    assert.equal(mapping.get('class-62'), 'a0000010');
});

test('collisions at the end of the Base62 space wrap without duplicating a class', (t) => {
    let lastSeed;
    t.mock.method(crypto, 'createHash', () => ({
        update() { return this; },
        digest() { return lastSeed; }
    }));
    for (const [names, length] of [[['bar', 'tip'], 3], [['bblock-wrapper', 'controls'], 8]]) {
        lastSeed = BigInt(52 * 62 ** (length - 1) - 1).toString(16).padStart(64, '0');
        const mapping = createClassMap(names);
        assert.equal(mapping.get(names[0]), 'Z'.repeat(length));
        assert.equal(mapping.get(names[1]), 'a' + '0'.repeat(length - 1));
    }
});

test('short hash exhaustion fails explicitly without exceeding the requested length', () => {
    const names = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'];
    assert.equal(new Set(createClassMap(names).values()).size, 52);
    assert.throws(() => createClassMap([...names, '_']), /all 52 Base62 names of length 1 are taken/);
});

test('CSS, HTML and DOM references agree without changing properties, URLs, events or plain text', () => {
    const result = hashClasses({
        css: '/* .cover */ @media (min-width: 1px) { .bblock-wrapper:is(.cover, .state-playing) > .bar { background: url("/cover.png"); content: ".cover"; opacity: .5 } }',
        html: '<!-- class="cover" --><div CLASS=bblock-wrapper><svg class="cover bar"></svg><template><p class=cover>cover</p></template></div>',
        js: [
            'const config = { cover: "cover.png", title: "cover" };',
            'el.querySelector(`.bblock-wrapper:is(.cover, .state-playing) > .bar`);',
            'el.classList.add("state-playing", "cover");',
            'el.classList.toggle("cover", enabled);',
            'el.classList.replace("cover", "bar");',
            'el.getElementsByClassName("cover bar");',
            'el.className = "cover bar";',
            'el.setAttribute("class", "cover");',
            'el.addEventListener("play", () => config.cover);',
            'output(config, ".cover");'
        ].join('\n')
    });
    const m = result.classMap;
    assert.ok(result.css.includes(`.${m['bblock-wrapper']}:is(.${m.cover}, .${m['state-playing']}) > .${m.bar}`));
    assert.ok(result.css.includes('url("/cover.png")'));
    assert.ok(result.css.includes('content: ".cover"'));
    assert.ok(result.css.includes('opacity: .5'));
    const fragment = parseFragment(result.html);
    const wrapper = fragment.childNodes.find((node) => node.tagName === 'div');
    assert.equal(wrapper.attrs[0].value, m['bblock-wrapper']);
    assert.equal(wrapper.childNodes[0].attrs[0].value, `${m.cover} ${m.bar}`);
    assert.equal(wrapper.childNodes[1].content.childNodes[0].attrs[0].value, m.cover);
    assert.ok(result.html.includes('<!-- class="cover" -->'));
    const calls = [];
    const el = {
        querySelector: (value) => calls.push(value),
        classList: Object.fromEntries(['add', 'toggle', 'replace'].map((method) => [method, (...args) => calls.push(args)])),
        getElementsByClassName: (value) => calls.push(value),
        setAttribute: (name, value) => calls.push([name, value]),
        addEventListener: (name) => calls.push(name)
    };
    let output;
    vm.runInNewContext(result.js, { el, enabled: true, output: (...args) => { output = args; } });
    assert.equal(calls[0], `.${m['bblock-wrapper']}:is(.${m.cover}, .${m['state-playing']}) > .${m.bar}`);
    assert.deepEqual(Array.from(calls[1]), [m['state-playing'], m.cover]);
    assert.deepEqual(Array.from(calls[2]), [m.cover, true]);
    assert.deepEqual(Array.from(calls[3]), [m.cover, m.bar]);
    assert.equal(calls[4], `${m.cover} ${m.bar}`);
    assert.equal(el.className, `${m.cover} ${m.bar}`);
    assert.deepEqual(calls[5], ['class', m.cover]);
    assert.equal(calls[6], 'play');
    assert.equal(output[0].cover, 'cover.png');
    assert.equal(output[0].title, 'cover');
    assert.equal(output[1], '.cover');
});

test('escaped CSS class names and decoded HTML entities use the same mapping', () => {
    const result = hashClasses({ css: '.\\31 cover { color: red }', html: '<p class="1&#99;over"></p>', js: '' });
    assert.ok(result.css.startsWith('.' + result.classMap['1cover']));
    assert.equal(parseFragment(result.html).childNodes[0].attrs[0].value, result.classMap['1cover']);
});

test('dynamic DOM class references fail instead of producing an inconsistent bundle', () => {
    for (const js of ['el.querySelector(selector)', 'el.classList.add(`state-${state}`)', 'el.className = classes']) {
        assert.throws(() => hashClasses({ css: '.cover {}', html: '', js }), /requires a static DOM/);
    }
});

test('all classes in the current player CSS are hashed and its JS remains valid', () => {
    const root = path.resolve(__dirname, '..', 'src');
    const source = Object.fromEntries(['js', 'css', 'html'].map((ext) => [ext, readFileSync(path.join(root, `bblock.${ext}`), 'utf8')]));
    const result = hashClasses(source);
    const originalNames = new Set();
    const hashedNames = new Set();
    cssTree.walk(cssTree.parse(source.css), (node) => {
        if (node.type === 'ClassSelector') originalNames.add(node.name);
    });
    cssTree.walk(cssTree.parse(result.css), (node) => {
        if (node.type === 'ClassSelector') hashedNames.add(node.name);
    });
    assert.deepEqual(hashedNames, new Set([...originalNames].map((name) => result.classMap[name])));
    assert.equal(new Set(Object.values(result.classMap)).size, Object.keys(result.classMap).length);
    assert.ok(result.js.includes('this._config.cover'));
    assert.ok(result.js.includes("addEventListener('play'"));
    assert.ok(result.js.includes('`{{CSS}}`'));
    assert.ok(result.js.includes('`{{HTML}}`'));
    new vm.Script(result.js);
});
