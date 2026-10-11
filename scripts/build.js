const { readFile, mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const CleanCSS = require('clean-css');
const { minify: minifyHTML } = require('html-minifier-terser');
const { minify: minifyJS } = require('terser');

// 对反斜杠、反引号、$ 符号和大括号进行转义
function escapeTemplateLiteral(value) {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
}

async function build() {
    const root = path.resolve(__dirname, '..');
    const [js, css, html] = await Promise.all(
        ['bblock.js', 'bblock.css', 'bblock.html'].map((file) =>
            readFile(path.join(root, 'src', file), 'utf8')
        )
    );
    // 精简 CSS 和 HTML
    const minifiedCSS = new CleanCSS({ rebase: false }).minify(css);
    if (minifiedCSS.errors.length) {
        throw new Error(minifiedCSS.errors.join('\n'));
    }
    const minifiedHTML = await minifyHTML(html, {
        collapseWhitespace: true,
        removeComments: true
    });

    const assets = {
        css: escapeTemplateLiteral(minifiedCSS.styles),
        html: escapeTemplateLiteral(minifiedHTML)
    };
    // 将 CSS 和 HTML 插入到 JS 中 （分别替换 {{CSS}} 和 {{HTML}}，大小写不敏感）
    const source = js.replace(/\{\{(CSS|HTML)\}\}/gi, (_, name) => assets[name.toLowerCase()]);
    // 使用 UMD 包装，支持 CommonJS、AMD 和浏览器全局变量
    const umdSource = `(function (root, factory) {
        if (typeof module === 'object' && module.exports) {
            module.exports = factory();
        } else if (typeof define === 'function' && define.amd) {
            define([], factory);
        } else {
            root.bblock = factory();
            root.BBlockPlayer = root.bblock.BBlockPlayer;
        }
    })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
        ${source}
        // 保留 bblock API，同时支持 CommonJS 解构获取 BBlockPlayer
        bblock.BBlockPlayer = BBlockPlayer;
        return bblock;
    });`;
    // 使用 ESM 默认导出 bblock，并具名导出 BBlockPlayer，供 Vite 等工具通过 import 加载
    const esmSource = `${source}\nexport default bblock;\nexport { BBlockPlayer };`;
    const [umdResult, esmResult] = await Promise.all([
        minifyJS(umdSource),
        minifyJS(esmSource, { module: true })
    ]);

    // 将精简后的 UMD 和 ESM 产物写入 dist
    const outputDir = path.join(root, 'dist');
    await mkdir(outputDir, { recursive: true });
    for (const [filename, result] of [
        ['bblock.umd.js', umdResult],
        ['bblock.esm.js', esmResult]
    ]) {
        await writeFile(path.join(outputDir, filename), result.code + '\n', 'utf8');
        console.log(`Built dist/${filename} (${Buffer.byteLength(result.code)} bytes)`);
    }
}

build().catch((error) => {
    console.error('Build failed:', error.message);
    process.exitCode = 1;
});
