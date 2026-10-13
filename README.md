# BBlock

[ [English Version](./README.en.md) ]  

🎵 Wow~ you can really play! Square Music Player.

> 轻量小巧的音乐播放器，乃博客、个人页面常备神器。

* [jsDelivr](https://www.jsdelivr.com/package/npm/bblock)  
<!-- * [npmmirror](https://registry.npmmirror.com/bblock/latest/files)   -->
* [npm](https://www.npmjs.com/package/bblock)  

## Demo  

![screenshot](./images/bblock-preview.png)  

[bblock.js.org/demo](https://bblock.js.org/demo)  

## 造他就完事了!

<details>

<summary>展开查看 v1.x.x 版的造法</summary>

1. 在头部引用 `bblock.(m.).css`, 在所有 `<bblock></bblock>` 标签之后引用 `bblock.(m.).js`。 
2. 在html内加入类似于以下标签：  
   ```html
   <bblock style='display:none'>
		{
			"src":"<musicurl>",
			"cover":"<musiccover>",
			"title":"S.T.A.Y. (Delta Heavy Tribute)",
			"artist":"Delta Heavy / Hans Zimmer",
			"volume":20,
			"time":0,
			"loop":"false",
			"float":"right"
		}
   </bblock>
   ```

   |键|值|备注|
   |-----|-----|-----|
   |src|音乐的 url|必需|
   |cover|音乐封面的 url|非必需|
   |title|音乐标题|非必需|
   |artist|音乐创作者|非必需|
   |volume|音量|volume∈[0,100]，非必需，默认是 100|
   |time|刚开始播放的时间点|以秒为单位,非必需|
   |loop|是否循环播放|默认不循环，非必需|
   |float|就是 css 内的 float 样式|非必需|  

   到底来说，仅一个 src 值就够了~  

3. 手动触发播放器构造：  

   载入 `bblock.(m.).js` 时会默认构造页面中所有 `<bblock></bblock>` 包裹的播放器。如果有特殊情况（比如基于 AJAX 技术的页面）可以执行以下代码以触发这些播放器的构造：  

   ```javascript
   bblock.s();
   ```

---
   
</details>

BBlock v2.x.x **在兼容 v1.x.x 的构造方式的前提下**新增了实例化构造方式：  

```javascript
const player = new BBlockPlayer(element, config);
// 或者
const player = bblock.c(element, config);
```

其中 `element` 为 HTML 元素对象，而 `config` 为配置对象，支持以下字段:  

|键|值|备注|
|-----|-----|-----|
|`src`|音乐的 URL|**必需**|
|`cover`|音乐封面的 URL|非必需|
|`title`|音乐标题|非必需|
|`artist`|音乐创作者|非必需|
|`volume`|音量|非必需。取值范围为 0~1，默认是 1|
|`time`|刚开始播放的时间点|非必需。以秒为单位，默认从 0 秒开始|
|`loop`|是否循环播放|非必需。可取布尔值 `true` / `false`，默认不循环|
|`float`|CSS 的 `float` 样式，控制播放器放置位置|非必需。默认是 `none`|
|`language`|界面语言|非必需。可取 `zh-CN`、`zh-TW` 或 `en-US`，默认是 `zh-CN`|
|`progressColor`|进度条颜色|非必需。CSS 颜色值或 `none`，默认是 `none`，即自适应颜色|
|`progressOpacity`|进度条透明度|非必需。取值范围为 0~1，默认是 0.6|

### 快速入门: 浏览器使用

```html
<div id="my-player"></div>
<script src="https://cdn.jsdelivr.net/npm/bblock@latest/dist/bblock.umd.js"></script>
```

```javascript
const containerEl = document.getElementById('my-player');
const player = new BBlockPlayer(
   containerEl,
   {
      "src":"https://music.163.com/song/media/outer/url?id=3428531701",
      "cover":"https://p1.music.126.net/R6Gm6V1C_abBY3f_XbKIug==/109951173855089233.jpg",
      "title":"ED 记忆管理局2026",
      "artist":"StJimmyL / Ray1-睿壹 / 小欣Xier",
      "loop":"true",
      "float":"right"
   }
)
```

### 作为模块导入使用

```bash
# 安装 bblock 包
npm install bblock
```

```javascript
// import bblock, { BBlockPlayer } from 'bblock.esm.js';
import bblock, { BBlockPlayer } from 'bblock';

const element = document.getElementById('my-player');
const config = {
   src: 'https://music.163.com/song/media/outer/url?id=3428531701',
   title: 'ED 记忆管理局2026',
   artist: 'StJimmyL / Ray1-睿壹 / 小欣Xier'
};

const player = new BBlockPlayer(element, config);
// 也可以使用 bblock.c(element, config) 创建实例
```
   
## 进度调节与音量调节

俗话说得好，麻雀虽小五脏俱全，进度调节和音量调节这两个播放器基本功能还是要有滴 (;ﾟ∀ﾟ)  

对于旧版 (<= v1.4.1)：  

* 鼠标悬停在方块上，会出现五五开的蓝紫块  
* 拖拽左方的蓝块可以调整播放进度条  
* 拖拽右方的紫块可以调节音量  
* 单击左方和右方的块可以看当前的进度或者音量  

对于 v2.x.x:  

* 开始播放后，鼠标悬停在方块上，控制面板会显示：  

   ![BBlock Controls](./images/bblock-controls.png)  

* 拖拽左边的音量图标会进入音量调节模式，而拖拽右边图标会进入播放进度调节模式
* 鼠标移出播放器时控制面板会直接隐藏；如果悬停在播放器中不动，过几秒控制面板也会自动隐藏

## 播放器 API

v2.x.x 的 `BBlockPlayer` 实例提供了一些 API 及可读写属性，下面说明以上方示例中创建的 `player` 为例。  

<details>

<summary>展开查看</summary>

### 方法

|方法|说明|
|-----|-----|
|`player.play()`|开始播放|
|`player.pause()`|暂停播放|
|`player.seek(time)`|跳转到指定时间点，单位为秒|
|`player.reload(deltaConfig = {})`|重新构造播放器，将传入的配置字段覆盖到原配置中（比如传入 `{loop: true, float: "left"}` 就会**在原配置的基础上**把 `loop` 和 `float` 分别改为 `true` 和 `left`）。重载不会变动播放器 ID，但会重置播放状态并清除所有原有事件监听。注意底层 `audioElement` 也会变，如需使用则要重新获取|
|`player.destroy()`|销毁播放器，取消事件监听，恢复容器原来的 HTML 和内联样式|
|`player.on(eventName, callback)`|注册事件监听，详见下文|
|`player.off(eventName, callback)`|移除指定事件的回调，`callback` 需传入注册时的同一个函数引用|
|`player.offAll()`|移除通过 `player.on()` 注册的所有事件监听|

### 属性

|属性|读写|说明|
|-----|-----|-----|
|`player.volume`|可读写|音量，范围为 0~1|
|`player.loop`|可读写|是否循环播放，接受布尔值 `true` / `false`|
|`player.progressColor`|可读写|进度条颜色，接受 CSS 颜色字符串或 `none`（自适应颜色）|
|`player.progressOpacity`|可读写|进度条透明度，范围为 0~1|
|`player.currentTime`|只读|当前播放时间，单位为秒。修改播放进度请使用 `seek()` 方法|
|`player.audioElement`|只读|底层 `HTMLAudioElement`，可用于读取 `duration`、`paused` 等原生属性|
|`player.id`|只读|播放器的唯一 ID，类型为字符串|
|`player.destroyed`|只读|播放器是否已被销毁|

### 全局实例管理

保留全局的 `bblock` 对象是为了和 v1.x.x 版本保持兼容。  

|API|说明|
|-----|-----|
|`bblock.c(element, config)`|创建并返回一个 `BBlockPlayer` 实例|
|`bblock.s()`|扫描页面中的 `<bblock>` 标签，根据其中的 JSON 配置构造播放器，返回本次创建的实例数组。脚本每次执行时会自动扫描一次|
|`bblock.get(id)`|根据 ID 获取当前播放器实例，不存在时返回 `null`|
|`bblock.currentPlayers`|获取当前页面中所有**存在的**播放器，返回由 `[id, player]` 组成的数组|

**注**：播放器元素从当前 DOM 中移除时会自动触发销毁 (`destroy()`)。  

</details>

## 事件绑定

可使用 `player.on(eventName, callback)` 绑定播放器事件，同一事件可以注册多个回调，但同一个函数引用重复注册只会保留一份。事件名称使用小写。

<details>

<summary>展开查看支持的事件</summary>

### 原生音频事件

诸如 `play`, `canplay`, `timeupdate` 一类的原生音频事件如果用 `player.on` 绑定，会直接透传绑定到底层的 `<audio>` 元素上。和直接在 `player.audioElement` 上用 `addEventListener` 绑定事件不同，用 `player.on` 绑定的事件会被自动管理，默认情况下生命周期和播放器生命周期一致。

### 播放器事件

播放器自身会产生一些独特的事件 ( *ˊᵕˋ)σ   

|事件名|回调参数|触发时机|
|-----|-----|-----|
|`controlsshow`|无|控制面板展开时|
|`controlshide`|无|已展开的控制面板隐藏时|
|`volumecontrolstart`|无|进入音量调节状态时 <br> （注意，和 `<audio>` 的 `volumechange` 事件不同，这里是用户按下音量图标后进入音量调节模式时会触发一次，而不是拖拽过程中会一直触发）|
|`volumecontrolend`|无|结束音量调节时（从音量调节页面回到控制面板默认页面时）|
|`progresscontrolstart`|无|进入进度调节状态时（同上，和 `<audio>` 的 `timeupdate` 事件不同）|
|`progresscontrolend`|无|结束进度调节时|
|`tipshow`|`(message, duration)`|提示开始显示时。回调参数分别为提示文本和显示时长（毫秒）|
|`tiphide`|`(message, duration)`|提示开始隐藏时。回调参数与 `tipshow` 相同|
|`destroy`|无|播放器销毁前产生，另外调用 `reload()` 时也会触发|

</details>

## 手动构建

```bash
npm install
npm run build
```

构建产物会输出到 `./dist` 目录下：  

```text
dist/
├── bblock.classes.json
├── bblock.esm.js
└── bblock.umd.js
```

## 感谢  

* @[小太](https://github.com/CatSouta)  
* @[奇趣保罗](https://github.com/Dreamer-Paul)  

## 引用项目及开源协议

本项目使用到了 [Lucide Icons](https://lucide.dev/) 的部分图标，其采用 [ISC License](./LICENSES/lucide.txt) 授权，感谢开源图标的贡献者们！(´ｰ∀ｰ`)  

## LICENSE

Licensed under the MIT License.  

Thanks for using. (￣▽￣)"
