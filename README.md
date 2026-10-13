# BBlock

🎵 Wow~ you can really play! Square Music Player.

> 轻量小巧的音乐播放器，乃博客、个人页面常备神器。

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

BBlock v2.x.x 在兼容 v1.x.x 的构造方式的前提下新增了实例化构造方式：  

```javascript
const player = new BBlockPlayer(element, config);
// 或者
const player = bblock.c(element, config);
```

其中 `element` 为 HTML 元素对象，而 `config` 为配置对象，支持以下字段:  

|键|值|备注|
|-----|-----|-----|
|src|音乐的 URL|必需|
|cover|音乐封面的 URL|非必需|
|title|音乐标题|非必需|
|artist|音乐创作者|非必需|
|volume|音量|取值范围为 0~1，非必需，默认是 1；传入 0 时按默认值处理|
|time|刚开始播放的时间点|以秒为单位，非必需，默认从 0 秒开始|
|loop|是否循环播放|可取布尔值 `true`/`false` 或字符串 `"true"`/`"false"`，非必需，默认不循环|
|float|CSS 的 `float` 样式|非必需，默认是 `none`|
|language|界面语言|可取 `zh-CN`、`zh-TW` 或 `en-US`，非必需，默认是 `zh-CN`|
|progressColor|进度条颜色|CSS 颜色值或 `none`，非必需，默认是 `none`|
|progressOpacity|进度条透明度|取值范围为 0~1，非必需，默认是 0.6；传入 0 时按默认值处理|

### 浏览器使用示例

```html
<div id="my-player"></div>
<script src="bblock.umd.js"></script>
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
   
## 进度调节与音量调节

俗话说得好，麻雀虽小五脏俱全。  

 * 鼠标悬停在方块上，会出现五五开的蓝紫块  
 * 拖拽左方的蓝块可以调整播放进度条  
 * 拖拽右方的紫块可以调节音量  
 * 单击左方和右方的块可以看当前的进度或者音量  

## 感谢  

* @[小太](https://github.com/CatSouta)  
* @[奇趣保罗](https://github.com/Dreamer-Paul)  

## 引用项目及开源协议

本项目使用到了 [Lucide Icons](https://lucide.dev/) 的部分图标，其采用 [ISC License](./LICENSES/lucide.txt) 授权，感谢开源图标的贡献者们！(´ｰ∀ｰ`)  

## LICENSE
MIT LICENSE.  
