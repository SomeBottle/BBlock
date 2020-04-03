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
	t:function(e,k,v){/*setstyle(element,key,value)*/
		if(e instanceof Array){
			for(var i in e){
				k instanceof Array ? (e[i].style[k[i]]=v instanceof Array ? v[i] : v) : (e[i].style[k]=v instanceof Array ? v[i] : v);/*设置样式*/
			}
		}else if(k instanceof Array){
			for(var i in k){
				e.style[k[i]]=v instanceof Array ? v[i] : v;
			}
		}else{
			e.style[k]=v;
		}
	},
	c:function(e,j){/*construct(element,json)*/
        e.innerHTML='<p class="tip">在此点击/悬停可进行调节</p><div class="p"></div><div class="s"></div><div class="ad"><p class="notice">拖拽蓝/紫块以调节进度/音量</p><div class="tm"></div><div class="vm"></div></div><div class="ct"><div class="b"></div><div class="t"></div><div class="a"></div></div><audio src="" preload="auto"></audio>';
		e.setAttribute('firstplay','true');/*首次使用*/
	    var o=this,audio=e.getElementsByTagName('audio')[0];
		o.t(e,'display','block');/*构建时显示播放器*/
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
		o.g(e,'ad').addEventListener('mouseleave',function(){o.mo(e,audio)},false);/*调整器事件，采用mouseleave防止误判*/
	},
	p:function(e,a){/*Play(element,audio)*/
		var o=this,pbtn=o.g(e,'p'),sbtn=o.g(e,'s'),ct=o.g(e,'ct'),tip=o.g(e,'tip'),firstplay=e.getAttribute('firstplay');
		o.precent=pbtn.style;/*save recent style*/
		o.t(pbtn,['height','width','top','left','opacity','transform','display'],['25px','25px','100%','100%',0,'translate(-100%,-100%)','block']);/*播放按钮样式*/
		sbtn.style.display='block';
		ct.style.opacity=0;
		if(firstplay=='true'){/*首次播放闪烁可调节提示,UX++*/
			e.setAttribute('firstplay','false');
			o.t(tip,['display','opacity'],['block',0]);
		}
		o.anm(pbtn,function(){/*显示暂停按钮*/
			sbtn.style.opacity=1;
			o.t([pbtn,ct],'display','none');
			tip.style.animation='1.5s flash ease normal';
			o.anm(tip,function(){
			    tip.style.display='none';
		    },'animationend');
		});
		a.play();
	},
	ps:function(e,a){/*Pause(element,audio)*/
		var o=this,pbtn=o.g(e,'p'),sbtn=o.g(e,'s'),ct=o.g(e,'ct'),adjusting=e.getAttribute('adstatu');
		o.t([pbtn,ct],'display','block');
		sbtn.style.opacity=0;
		o.anm(sbtn,function(){/*显示播放按钮*/
			sbtn.style.display='none';
			pbtn.style=o.precent;
			ct.style.opacity=1;
		});
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
			o.t([tm,vm],'width','50%');/*蓝紫块复原*/
		}
	},
	spn:function(e,au){/*showpanel(element,audio)*/
	    e.setAttribute('adstatu','true');
		var o=this,tm=o.g(e,'tm'),vm=o.g(e,'vm'),ad=o.g(e,'ad'),nt=o.g(e,'notice'),tmpcent=0,ntstatu=e.getAttribute('ntstatu');
		o.t([tm,vm,nt,ad],['display','display','opacity','opacity'],['block','block',1,1]);/*蓝紫块和提示显示*/
		tm.onmousedown=function(ev){/*进度拖拽*/
		   ev=ev.targetTouches ? ev.targetTouches[0] : ev;/*移动端事件适配*/
		   var percent=(au.currentTime/au.duration)*100,startm=ev.screenX;
		   o.t([tm,vm],'width',[percent+'%',(100-percent)+'%']);/*显示当前的蓝块值*/
		   function mousemove(eve){/*拖拽时的样式*/
		       eve=eve.targetTouches ? eve.targetTouches[0] : eve;/*移动端事件适配*/
			   var newm=eve.screenX,dr=(newm-startm)*1.5;
			   pcent=percent+dr;
			   if(pcent<=0){
				   pcent=0;
			   }else if(pcent>=100){
				   pcent=100;
			   }
			   o.t([tm,vm],'width',[pcent+'%',(100-pcent)+'%']);/*拖拽时跟随鼠标*/
			   au.currentTime=au.duration*pcent*0.01;/*调整播放时间*/
		   }
		   function mouseup(){
			   window.removeEventListener('mousemove',mousemove);
		       window.removeEventListener('mouseup',mouseup);
			   window.removeEventListener('touchmove',mousemove);/*移动端事件适配*/
		       window.removeEventListener('touchend',mouseup);
		   }
		   window.addEventListener('mousemove',mousemove,false);
		   window.addEventListener('mouseup',mouseup,false);
		   window.addEventListener('touchmove',mousemove,false);/*移动端事件适配*/
		   window.addEventListener('touchend',mouseup,false);
		}
		tm.ontouchstart=tm.onmousedown;/*移动端事件适配*/
		vm.onmousedown=function(ev){/*音量拖拽*/
		    ev=ev.targetTouches ? ev.targetTouches[0] : ev;/*移动端事件适配*/
			var percent=(au.volume/1)*100,startm=ev.screenX;
			o.t([tm,vm],'width',[(100-percent)+'%',percent+'%']);/*显示当前的紫块值*/
			function mousemove(eve){/*拖拽时的样式*/
			   eve=eve.targetTouches ? eve.targetTouches[0] : eve;/*移动端事件适配*/
			   var newm=eve.screenX,dr=(newm-startm)*2;
			   pcent=percent-dr;/*音量调节拖拽的方向相反*/
			   if(pcent<=0){
				   pcent=0;
			   }else if(pcent>=100){
				   pcent=100;
			   }
			   o.t([tm,vm],'width',[(100-pcent)+'%',pcent+'%']);/*拖拽时跟随鼠标*/
			   au.volume=pcent*0.01;/*调整播放时间*/
		   }
		   function mouseup(){
			   window.removeEventListener('mousemove',mousemove);
		       window.removeEventListener('mouseup',mouseup);
			   window.removeEventListener('touchmove',mousemove);/*移动端事件适配*/
		       window.removeEventListener('touchend',mouseup);
		   }
		   window.addEventListener('mousemove',mousemove,false);
		   window.addEventListener('mouseup',mouseup,false);
		   window.addEventListener('touchmove',mousemove,false);/*移动端事件适配*/
		   window.addEventListener('touchend',mouseup,false);
		}
		vm.ontouchstart=vm.onmousedown;/*移动端事件适配*/
		if(ntstatu!=='true'){/*闪烁一次就行*/
		    nt.style.animation='1.5s flash ease normal';
			e.setAttribute('ntstatu','true');
			nt.style.display='block';
		    o.anm(nt,function(){
			    nt.style.animation='';
			    nt.style.display='none';
		    },'animationend');
		}
	},
	hpn:function(e,au){/*hidepanel(element,audio)*/
		var o=this,tm=o.g(e,'tm'),vm=o.g(e,'vm'),ad=o.g(e,'ad');
		ad.style.opacity=0;
		e.setAttribute('ntstatu','false');
		o.anm(ad,function(){
			o.t([tm,vm],'display','none');/*隐藏蓝紫块实体*/
		});
	},
	anm:function(el,func,ev='transitionend'){/*transition动画检查器(element,function)*/
	    function hide(){
			func();
			el.removeEventListener(ev,hide);
		}
		el.addEventListener(ev,hide,false)
	}
};
bblock.s();