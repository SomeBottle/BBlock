/*BBlock~Wow~you can really play! -SomeBottle*/
var bblock={precent:{},g:function(a,c){return a.getElementsByClassName(c)[0]},s:function(){var a=document.getElementsByTagName("bblock"),c;for(c in a)if(a[c].innerHTML){var b=JSON.parse(a[c].innerHTML);b.src&&this.c(a[c],b)}},t:function(a,c,b){if(a instanceof Array)for(var d in a)c instanceof Array?a[d].style[c[d]]=b instanceof Array?b[d]:b:a[d].style[c]=b instanceof Array?b[d]:b;else if(c instanceof Array)for(d in c)a.style[c[d]]=b instanceof Array?b[d]:b;else a.style[c]=b},c:function(a,c){a.innerHTML='\x3cp class\x3d"tip"\x3e\u5728\u6b64\u70b9\u51fb/\u60ac\u505c\u53ef\u8fdb\u884c\u8c03\u8282\x3c/p\x3e\x3cdiv class\x3d"p"\x3e\x3c/div\x3e\x3cdiv class\x3d"s"\x3e\x3c/div\x3e\x3cdiv class\x3d"ad"\x3e\x3cp class\x3d"notice"\x3e\u62d6\u62fd\u84dd/\u7d2b\u5757\u4ee5\u8c03\u8282\u8fdb\u5ea6/\u97f3\u91cf\x3c/p\x3e\x3cdiv class\x3d"tm"\x3e\x3c/div\x3e\x3cdiv class\x3d"vm"\x3e\x3c/div\x3e\x3c/div\x3e\x3cdiv class\x3d"ct"\x3e\x3cdiv class\x3d"b"\x3e\x3c/div\x3e\x3cdiv class\x3d"t"\x3e\x3c/div\x3e\x3cdiv class\x3d"a"\x3e\x3c/div\x3e\x3c/div\x3e\x3caudio src\x3d"" preload\x3d"auto"\x3e\x3c/audio\x3e';a.setAttribute("firstplay","true");var b=this,d=a.getElementsByTagName("audio")[0];b.t(a,"display","block");a.className="bblock";c.cover&&(a.style.backgroundImage="url("+c.cover+")");"true"==c.loop&&d.setAttribute("loop","loop");c.volume&&(d.volume=.01*Number(c.volume));c["float"]?a.style["float"]=c["float"]:a.style["float"]="left";c.time&&(d.currentTime=c.time);b.g(a,"t").innerHTML=c.title||"";b.g(a,"a").innerHTML=c.artist||"";d.src=c.src;d.addEventListener("ended",function(){b.ps(a,d);b.mo(a,d)},!1);a.clientWidth<=b.g(a,"t").clientWidth&&(b.g(a,"t").style.animation="7s tloop linear infinite normal");b.g(a,"p").addEventListener("click",function(){b.p(a,d)},!1);b.g(a,"s").addEventListener("click",function(){b.ps(a,d)},!1);b.g(a,"ad").addEventListener("mouseover",function(){b.ad(a,d)},!1);b.g(a,"ad").addEventListener("mouseleave",function(){b.mo(a,d)},!1)},p:function(a,c){var b=this,d=b.g(a,"p"),g=b.g(a,"s"),f=b.g(a,"ct"),e=b.g(a,"tip"),k=a.getAttribute("firstplay");b.precent=d.style;b.t(d,"height width top left opacity transform display".split(" "),["25px","25px","100%","100%",0,"translate(-100%,-100%)","block"]);g.style.display="block";f.style.opacity=0;"true"==k&&(a.setAttribute("firstplay","false"),b.t(e,["display","opacity"],["block",0]));b.anm(d,function(){g.style.opacity=1;b.t([d,f],"display","none");e.style.animation="1.5s flash ease normal";b.anm(e,function(){e.style.display="none"},"animationend")});c.play()},ps:function(a,c){var b=this,d=b.g(a,"p"),g=b.g(a,"s"),f=b.g(a,"ct");a.getAttribute("adstatu");b.t([d,f],"display","block");g.style.opacity=0;b.anm(g,function(){g.style.display="none";d.style=b.precent;f.style.opacity=1});c.pause()},ad:function(a,c){var b=this;c.paused||(a.setAttribute("adflag","true"),setTimeout(function(){"true"==a.getAttribute("adflag")&&b.spn(a,c)},1500))},mo:function(a,c){var b=this.g(a,"tm"),d=this.g(a,"vm");this.g(a,"ad");a.setAttribute("adflag","false");var g=a.getAttribute("adstatu");c.paused||"true"!=g||(this.hpn(a,c),a.setAttribute("adstatu","false"),this.t([b,d],"width","50%"))},spn:function(a,c){a.setAttribute("adstatu","true");var b=this,d=b.g(a,"tm"),g=b.g(a,"vm"),f=b.g(a,"ad"),e=b.g(a,"notice"),k=a.getAttribute("ntstatu");b.t([d,g,e,f],["display","display","opacity","opacity"],["block","block",1,1]);d.onmousedown=function(a){function e(a){a=a.targetTouches?a.targetTouches[0]:a;pcent=h+1.5*(a.screenX-l);0>=pcent?pcent=0:100<=pcent&&(pcent=100);b.t([d,g],"width",[pcent+"%",100-pcent+"%"]);c.currentTime=c.duration*pcent*.01}function f(){window.removeEventListener("mousemove",e);window.removeEventListener("mouseup",f);window.removeEventListener("touchmove",e);window.removeEventListener("touchend",f)}a=a.targetTouches?a.targetTouches[0]:a;var h=c.currentTime/c.duration*100,l=a.screenX;b.t([d,g],"width",[h+"%",100-h+"%"]);window.addEventListener("mousemove",e,!1);window.addEventListener("mouseup",f,!1);window.addEventListener("touchmove",e,!1);window.addEventListener("touchend",f,!1)};d.ontouchstart=d.onmousedown;g.onmousedown=function(a){function e(a){a=a.targetTouches?a.targetTouches[0]:a;pcent=h-2*(a.screenX-k);0>=pcent?pcent=0:100<=pcent&&(pcent=100);b.t([d,g],"width",[100-pcent+"%",pcent+"%"]);c.volume=.01*pcent}function f(){window.removeEventListener("mousemove",e);window.removeEventListener("mouseup",f);window.removeEventListener("touchmove",e);window.removeEventListener("touchend",f)}a=a.targetTouches?a.targetTouches[0]:a;var h=c.volume/1*100,k=a.screenX;b.t([d,g],"width",[100-h+"%",h+"%"]);window.addEventListener("mousemove",e,!1);window.addEventListener("mouseup",f,!1);window.addEventListener("touchmove",e,!1);window.addEventListener("touchend",f,!1)};g.ontouchstart=g.onmousedown;"true"!==k&&(e.style.animation="1.5s flash ease normal",a.setAttribute("ntstatu","true"),e.style.display="block",b.anm(e,function(){e.style.animation="";e.style.display="none"},"animationend"))},hpn:function(a,c){var b=this,d=b.g(a,"tm"),g=b.g(a,"vm"),f=b.g(a,"ad");f.style.opacity=0;a.setAttribute("ntstatu","false");b.anm(f,function(){b.t([d,g],"display","none")})},anm:function(a,c,b){function d(){c();a.removeEventListener(b,d)}b=void 0===b?"transitionend":b;a.addEventListener(b,d,!1)}};bblock.s();