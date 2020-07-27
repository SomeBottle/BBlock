# BBlock
![](https://wx4.sinaimg.cn/large/0085ZR6Aly1gde920yccgj3047046mxu)  

🎵 Wow~you can really play! Square Music Player

> 乃博客常备神器 Designed for blog.  

## Demo  
[https://bblock.xbottle.top/demo](https://bblock.xbottle.top/demo)  

## 造他就完事了!  
1. 在头部引用bblock.(m.).css,在所有\<bblock\>标签之后引用bblock.(m.).js  
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

   |键key|值value|备注notice|
   |-----|-----|-----|
   |src|音乐的url|必需|
   |cover|音乐封面的url|非必需|
   |title|音乐标题|非必需|
   |artist|音乐创作者|非必需|
   |volume|音量|volume∈[0,100]，非必需，默认是100|
   |time|刚开始播放的时间点|以秒为单位,非必需|
   |loop|是否循环播放|默认不循环，非必需|
   |float|就是css内的float样式|非必需|  

   到底来说，仅一个src值就够了~  

3. 进度调节与音量调节  

   俗话说得好，麻雀虽小五脏俱全。  

   * 鼠标悬停在方块上，会出现五五开的蓝紫块  
   * 拖拽左方的蓝块可以调整播放进度条  
   * 拖拽右方的紫块可以调节音量  
   * 单击左方和右方的块可以看当前的进度或者音量  
   
   示例视频：https://somebottle.gitee.io/bottlecos/bblock0.7.mp4   
   
## 小提示  
如果页面中的播放器没有被唤醒，可以在加载当前页面的js中加入：  
```javascript
bblock.s();  
```

## 感谢  
* [Meting](https://github.com/metowolf/Meting)  
* @[小太](https://github.com/SatoSouta)  
* @[奇趣保罗](https://github.com/Dreamer-Paul)  

## LICENSE
MIT LICENSE.  
