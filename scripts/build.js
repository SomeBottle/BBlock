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
    // 将 CSS 和 HTML 插入到 JS 中 （分别替换 {{CSS}} 和 {{HTML}}，大小写不敏感） ，并进行 JS 精简
    const source = js.replace(/\{\{(CSS|HTML)\}\}/gi, (_, name) => assets[name.toLowerCase()]);
    const result = await minifyJS(source);

    // 将精简后的 JS 写入 dist/bblock.prod.js
    const outputDir = path.join(root, 'dist');
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, 'bblock.prod.js'), result.code + '\n', 'utf8');
    console.log(`Built dist/bblock.prod.js (${Buffer.byteLength(result.code)} bytes)`);
}

build().catch((error) => {
    console.error('Build failed:', error.message);
    process.exitCode = 1;
});
