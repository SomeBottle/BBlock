/*BBlock~Wow~you can really play! -SomeBottle*/
var bblock={precent:{},g:function(a,d){return a.getElementsByClassName(d)[0]},s:function(){var a=document.getElementsByTagName("bblock"),d=this;setTimeout(function(){for(var b in a)if(a[b].innerHTML){var c=JSON.parse(a[b].innerHTML);c.src&&d.c(a[b],c)}},500)},t:function(a,d,b){if(a instanceof Array)for(var c in a)d instanceof Array?a[c].style[d[c]]=b instanceof Array?b[c]:b:a[c].style[d]=b instanceof Array?b[c]:b;else if(d instanceof Array)for(c in d)a.style[d[c]]=b instanceof Array?b[c]:b;else a.style[d]=b},c:function(a,d){a.innerHTML='\x3cp class\x3d"tip"\x3e\u5728\u6b64\u70b9\u51fb/\u60ac\u505c\u53ef\u8fdb\u884c\u8c03\u8282\x3c/p\x3e\x3cdiv class\x3d"p"\x3e\x3c/div\x3e\x3cdiv class\x3d"s"\x3e\x3c/div\x3e\x3cdiv class\x3d"ad"\x3e\x3cp class\x3d"notice"\x3e\u62d6\u62fd\u84dd/\u7d2b\u5757\u4ee5\u8c03\u8282\u8fdb\u5ea6/\u97f3\u91cf\x3c/p\x3e\x3cdiv class\x3d"tm"\x3e\x3c/div\x3e\x3cdiv class\x3d"vm"\x3e\x3c/div\x3e\x3c/div\x3e\x3cdiv class\x3d"ct"\x3e\x3cdiv class\x3d"b"\x3e\x3c/div\x3e\x3cdiv class\x3d"t"\x3e\x3c/div\x3e\x3cdiv class\x3d"a"\x3e\x3c/div\x3e\x3c/div\x3e\x3caudio src\x3d"" preload\x3d"auto"\x3e\x3c/audio\x3e';a.setAttribute("firstplay","true");var b=this,c=a.getElementsByTagName("audio")[0];b.t(a,"display","block");a.className="bblock";d.cover&&(a.style.backgroundImage="url("+d.cover+")");"true"==d.loop&&c.setAttribute("loop","loop");d.volume&&(c.volume=.01*Number(d.volume));d["float"]?a.style["float"]=d["float"]:a.style["float"]="left";d.time&&(c.currentTime=d.time);b.g(a,"t").innerHTML=d.title||"";b.g(a,"a").innerHTML=d.artist||"";c.src=d.src;c.addEventListener("ended",function(){b.ps(a,c);b.mo(a,c)},!1);a.clientWidth<=b.g(a,"t").clientWidth&&(b.g(a,"t").style.animation="7s tloop linear infinite normal");b.g(a,"p").addEventListener("click",function(){b.p(a,c)},!1);b.g(a,"s").addEventListener("click",function(){b.ps(a,c)},!1);b.g(a,"ad").addEventListener("mouseover",function(){b.ad(a,c)},!1);b.g(a,"ad").addEventListener("mouseleave",function(){b.mo(a,c)},!1)},p:function(a,d){var b=this,c=b.g(a,"p"),g=b.g(a,"s"),f=b.g(a,"ct"),e=b.g(a,"tip"),k=a.getAttribute("firstplay");b.precent=c.style;b.t(c,"height width top left opacity transform display".split(" "),["25px","25px","100%","100%",0,"translate(-100%,-100%)","block"]);g.style.display="block";f.style.opacity=0;"true"==k&&(a.setAttribute("firstplay","false"),b.t(e,["display","opacity"],["block",0]));b.anm(c,function(){g.style.opacity=1;b.t([c,f],"display","none");e.style.animation="1.5s flash ease normal";b.anm(e,function(){e.style.display="none"},"animationend")});d.play()},ps:function(a,d){var b=this,c=b.g(a,"p"),g=b.g(a,"s"),f=b.g(a,"ct");a.getAttribute("adstatu");b.t([c,f],"display","block");g.style.opacity=0;b.anm(g,function(){g.style.display="none";c.style=b.precent;f.style.opacity=1});d.pause()},ad:function(a,d){var b=this;d.paused||(a.setAttribute("adflag","true"),setTimeout(function(){"true"==a.getAttribute("adflag")&&b.spn(a,d)},1500))},mo:function(a,d){var b=this.g(a,"tm"),c=this.g(a,"vm");this.g(a,"ad");a.setAttribute("adflag","false");var g=a.getAttribute("adstatu");d.paused||"true"!=g||(this.hpn(a,d),a.setAttribute("adstatu","false"),this.t([b,c],"width","50%"))},spn:function(a,d){a.setAttribute("adstatu","true");var b=this,c=b.g(a,"tm"),g=b.g(a,"vm"),f=b.g(a,"ad"),e=b.g(a,"notice"),k=a.getAttribute("ntstatu");b.t([c,g,e,f],["display","display","opacity","opacity"],["block","block",1,1]);c.onmousedown=function(a){function e(a){a=a.targetTouches?a.targetTouches[0]:a;pcent=h+1.5*(a.screenX-l);0>=pcent?pcent=0:100<=pcent&&(pcent=100);b.t([c,g],"width",[pcent+"%",100-pcent+"%"]);d.currentTime=d.duration*pcent*.01}function f(){window.removeEventListener("mousemove",e);window.removeEventListener("mouseup",f);window.removeEventListener("touchmove",e);window.removeEventListener("touchend",f)}a=a.targetTouches?a.targetTouches[0]:a;var h=d.currentTime/d.duration*100,l=a.screenX;b.t([c,g],"width",[h+"%",100-h+"%"]);window.addEventListener("mousemove",e,!1);window.addEventListener("mouseup",f,!1);window.addEventListener("touchmove",e,!1);window.addEventListener("touchend",f,!1)};c.ontouchstart=c.onmousedown;g.onmousedown=function(a){function e(a){a=a.targetTouches?a.targetTouches[0]:a;pcent=h-2*(a.screenX-k);0>=pcent?pcent=0:100<=pcent&&(pcent=100);b.t([c,g],"width",[100-pcent+"%",pcent+"%"]);d.volume=.01*pcent}function f(){window.removeEventListener("mousemove",e);window.removeEventListener("mouseup",f);window.removeEventListener("touchmove",e);window.removeEventListener("touchend",f)}a=a.targetTouches?a.targetTouches[0]:a;var h=d.volume/1*100,k=a.screenX;b.t([c,g],"width",[100-h+"%",h+"%"]);window.addEventListener("mousemove",e,!1);window.addEventListener("mouseup",f,!1);window.addEventListener("touchmove",e,!1);window.addEventListener("touchend",f,!1)};g.ontouchstart=g.onmousedown;"true"!==k&&(e.style.animation="1.5s flash ease normal",a.setAttribute("ntstatu","true"),e.style.display="block",b.anm(e,function(){e.style.animation="";e.style.display="none"},"animationend"))},hpn:function(a,d){var b=this,c=b.g(a,"tm"),g=b.g(a,"vm"),f=b.g(a,"ad");f.style.opacity=0;a.setAttribute("ntstatu","false");b.anm(f,function(){b.t([c,g],"display","none")})},anm:function(a,d,b){function c(){d();a.removeEventListener(b,c)}b=void 0===b?"transitionend":b;a.addEventListener(b,c,!1)}};bblock.s();