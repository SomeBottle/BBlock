/*BBlock~Wow~you can really play! -SomeBottle*/
var bblock={
	precent:{},/*playbtn's recentstyle*/
	g:function(e,a){
		return e.getElementsByClassName(a)[0];
	},
	s:function(){/*setup*/
		var ps=document.getElementsByTagName('bblock');/*get players*/
		for(var p in ps){
			if(ps[p].innerHTML){
			   var c=JSON.parse(ps[p].innerHTML);
			   c.src ? this.c(ps[p],c) : c=c;/*存在源就开始构造播放器*/
			}
		}
	},
	c:function(e,j){/*construct(element,json)*/
        e.innerHTML='<div class="p"></div><div class="s"></div><div class="ad"><div class="tm"></div><div class="vm"></div></div><div class="ct"><div class="b"></div><div class="t"></div><div class="a"></div></div><audio src="" preload="auto"></audio>';
	    var o=this,audio=e.getElementsByTagName('audio')[0];
		e.style.display='block';
		e.className='bblock';
		j.cover ? e.style.backgroundImage='url('+j.cover+')' :e=e;/*有封面就用封面*/
		'true'==j.loop ? audio.setAttribute('loop','loop') : e=e;/*loop*/
		j.volume ? audio.volume=Number(j.volume)*0.01 : e=e;/*volume*/
		j.float ? e.style.float=j.float : e.style.float='left';/*float*/
		j.time ? audio.currentTime=j.time : e=e;/*time*/
		o.g(e,'t').innerHTML=j.title || '';/*title*/
		o.g(e,'a').innerHTML=j.artist || '';/*artist*/
		audio.src=j.src;/*src*/
		audio.addEventListener('ended',function(){o.ps(e,audio);o.mo(e,audio)},false);/*播放完毕*/
		if(e.clientWidth<=o.g(e,'t').clientWidth) o.g(e,'t').style.animation='7s tloop linear infinite normal';/*看情况开滚动*/
		o.g(e,'p').addEventListener('click',function(){o.p(e,audio)},false);
		o.g(e,'s').addEventListener('click',function(){o.ps(e,audio)},false);/*播放暂停按钮事件*/
		o.g(e,'ad').addEventListener('mouseover',function(){o.ad(e,audio)},false);/*调整器事件*/
		o.g(e,'ad').addEventListener('mouseleave',function(){o.mo(e,audio)},false);/*调整器事件*/
	},
	p:function(e,a){/*Play(element,audio)*/
		var o=this,pbtn=o.g(e,'p'),sbtn=o.g(e,'s'),ct=o.g(e,'ct');
		o.precent=pbtn.style;/*save recent style*/
		function sb(){
			sbtn.style.opacity=1;
			pbtn.style.display='none';
			ct.style.display='none';
			pbtn.removeEventListener('transitionend',sb);
		}
		pbtn.style.height='25px';
		pbtn.style.width='25px';
		pbtn.style.top='100%';
		pbtn.style.left='100%';
		pbtn.style.opacity=0;
		pbtn.style.transform='translate(-100%,-100%)';
		sbtn.style.display='block';
		ct.style.opacity=0;
		pbtn.addEventListener('transitionend',sb);
		a.play();
	},
	ps:function(e,a){/*Pause(element,audio)*/
		var o=this,pbtn=o.g(e,'p'),sbtn=o.g(e,'s'),ct=o.g(e,'ct'),adjusting=e.getAttribute('adstatu');
		pbtn.style.display='block';
		ct.style.display='block';
		function sb(){
			sbtn.style.display='none';
			sbtn.removeEventListener('transitionend',sb);
			pbtn.style=o.precent;
			ct.style.opacity=1;
		}
		sbtn.style.opacity=0;
		sbtn.addEventListener('transitionend',sb);
		a.pause();
	},
	ad:function(e,au){/*adjust(element,audio)*/
	    var o=this;
		if(!au.paused){/*不是暂停状态*/
			e.setAttribute('adflag','true');
			setTimeout(function(){
				var flag=e.getAttribute('adflag');
				if(flag=='true'){
					o.spn(e,au);/*打开面板*/
				}
			},1500);
		}
	},
	mo:function(e,au){/*mousemoveout*/
	    var o=this,tm=o.g(e,'tm'),vm=o.g(e,'vm'),ad=o.g(e,'ad');
		e.setAttribute('adflag','false');
		var opened=e.getAttribute('adstatu');
		if(!au.paused&&opened=='true'){
			this.hpn(e,au);/*关闭面板*/
			e.setAttribute('adstatu','false');
			tm.style.width='50%';
		    vm.style.width='50%';
		}
	},
	spn:function(e,au){/*showpanel(element,audio)*/
	    e.setAttribute('adstatu','true');
		var o=this,tm=o.g(e,'tm'),vm=o.g(e,'vm'),ad=o.g(e,'ad'),tmpcent=0;
		tm.style.display='block';
		vm.style.display='block';
		ad.style.opacity=1;
		tm.onmousedown=function(ev){/*进度拖拽*/
		   var percent=(au.currentTime/au.duration)*100,startm=ev.screenX;
		   tm.style.width=percent+'%';
		   vm.style.width=(100-percent)+'%';
		   window.onmousemove=function(eve){/*拖拽时的样式*/
			   var newm=eve.screenX,dr=(newm-startm)*1.5;
			   pcent=percent+dr;
			   if(pcent<=0){
				   pcent=0;
			   }else if(pcent>=100){
				   pcent=100;
			   }
			   tm.style.width=pcent+'%';
		       vm.style.width=(100-pcent)+'%';
			   au.currentTime=au.duration*pcent*0.01;/*调整播放时间*/
		   }
		}
		vm.onmousedown=function(ev){/*音量拖拽*/
			var percent=(au.volume/1)*100,startm=ev.screenX;
			tm.style.width=(100-percent)+'%';
			vm.style.width=percent+'%';
			window.onmousemove=function(eve){/*拖拽时的样式*/
			   var newm=eve.screenX,dr=(newm-startm)*2;
			   pcent=percent-dr;/*音量调节拖拽的方向相反*/
			   if(pcent<=0){
				   pcent=0;
			   }else if(pcent>=100){
				   pcent=100;
			   }
			   tm.style.width=(100-pcent)+'%';
		       vm.style.width=pcent+'%';
			   au.volume=pcent*0.01;/*调整播放时间*/
		   }
		}
		window.onmouseup=function(){
			window.onmousemove=false;
		}
	},
	hpn:function(e,au){/*hidepanel(element,audio)*/
		var o=this,tm=o.g(e,'tm'),vm=o.g(e,'vm'),ad=o.g(e,'ad');
		ad.style.opacity=0;
		function hide(){
			tm.style.display='none';
		    vm.style.display='none';
			ad.removeEventListener('transitionend',hide);
		}
		ad.addEventListener('transitionend',hide,false);
	}
};
bblock.s();