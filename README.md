# BBlock
![](https://wx4.sinaimg.cn/large/0085ZR6Aly1gde920yccgj3047046mxu)  

🎵 Wow~you can really play! Square Music Player

> 乃博客常备神器  

### 造他就完事了!  
1.在头部引用bblock.(m.).css和bblock.(m.).js  
2.在html内加入类似于以下标签：  
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
|src|音乐的url|必需|
|cover|音乐封面的url|非必需|
|title|音乐标题|非必需|
|artist|音乐创作者|非必需|
|volume|音量|volume∈[0,100]，非必需，默认是100|
|time|刚开始播放的时间点|以秒为单位,非必需|
|loop|是否循环播放|默认不循环，非必需|
|float|就是css内的float样式|非必需|  

