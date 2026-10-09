/* BBlock 2.0 Wow~you can really play! - SomeBottle*/

class BBlockPlayer {
	constructor(element, config) {
		if (element instanceof Element) {
			this.e = element;
			this.config = config;
		} else {
			throw new Error('BBlockPlayer: The first argument must be an Element.');
		}
		this.init();
	}

	/**
	 * 设置元素样式的方便方法
	 * @param {HTMLElement|HTMLElement[]} e 待设置样式的元素 / 元素数组
	 * @param {Object} kv 待设置的样式键值对对象
	 */
	static style(e, kv) {
		if (!(e instanceof Array)) {
			e = [e];
		}
		for (let el of e) {
			for (let k in kv) {
				el.style[k] = kv[k];
			}
		}
	}

	/**
	 * 计算孩子溢出父元素的宽度
	 * @param {HTMLElement} parent 父元素
	 * @param {HTMLElement} child 子元素
	 * @returns {number} 溢出宽度，单位为像素
	 */
	static overflowX(parent, child) {
		const parentRect = parent.getBoundingClientRect();
		const childRect = child.getBoundingClientRect();
		return Math.max(0, childRect.right - parentRect.right);
	}

	/**
	 * 节流函数，用于限制函数的执行频率
	 * @param {Function} func 函数
	 * @param {number} wait 等待时间，单位为毫秒
	 * @returns {Function} 节流后的函数
	 */
	static throttle(func, wait) {
		let lastTime = 0;
		return function (...args) {
			const now = Date.now();
			if (now - lastTime >= wait) {
				lastTime = now;
				func.apply(this, args);
			}
		};
	}

	/**
	 * 等待元素的过渡动画结束
	 * @param {HTMLElement} element 元素
	 * @returns {Promise} 返回一个 Promise，当过渡动画结束时 resolve
	 */
	static waitTransitionEnd(element) {
		return new Promise((resolve) => {
			element.addEventListener('transitionend', () => {
				resolve();
			});
		});
	}

	/**
	 * 检查 BBlock CSS 是否应用到页面中
	 */
	checkCSS() {
		let styleEl = document.head.getElementsByClassName('bblock-css')[0];
		if (!styleEl) {
			styleEl = document.createElement('style');
			styleEl.type = 'text/css';
			styleEl.className = 'bblock-css';
			styleEl.innerHTML = `{{CSS}}`;
			document.head.appendChild(styleEl);
		}
	}

	/**
	 * 把一条提示信息的展示加入到队列中
	 * 
	 * @param {string} message 提示信息
	 * @param {number} duration 提示信息显示的时间，单位为毫秒，默认 1000 毫秒
	 */
	tip(message, duration = 1000) {
		const tipEl = this.tipEl;
		this.tipQueue = this.tipQueue.then(() => {
			return new Promise((resolve) => {
				tipEl.textContent = message;
				tipEl.style.opacity = '1';
				setTimeout(() => {
					tipEl.style.opacity = '0';
					setTimeout(resolve, 500); // 等待过渡动画结束后再 resolve
				}, duration);
			});
		});
	}

	init() {
		// 检查 CSS 是否已应用
		this.checkCSS();
		this.e.innerHTML = `{{HTML}}`;
		this.wrapperEl = this.e.querySelector('.bblock-wrapper');
		this.coverEl = this.wrapperEl.querySelector('.cover');
		this.titleEl = this.wrapperEl.querySelector('.title');
		this.artistWrapperEl = this.wrapperEl.querySelector('.artist-wrapper');
		this.artistEl = this.wrapperEl.querySelector('.artist');
		this.playEl = this.wrapperEl.querySelector('.play');
		this.pauseEl = this.wrapperEl.querySelector('.pause');
		this.audioEl = this.wrapperEl.querySelector('audio');
		this.customBgEl = this.wrapperEl.querySelector('.custom-bg');
		this.tipEl = this.wrapperEl.querySelector('.tip');
		BBlockPlayer.style(this.e, { position: 'relative', display: 'inline-block', 'float': this.config.float || 'none' });

		// 状态标记
		this.audioError = false; // 音频是否出错
		this.firstPlay = true; // 是否首次播放

		// 提示语队列
		this.tipQueue = Promise.resolve();

		// 最开始先进入加载状态
		this.wrapperEl.classList.add('state-first-loading');

		// 设置音频源 (src 肯定是有的)
		this.audioEl.src = this.config.src;

		// 设置标题和艺术家信息
		this.titleEl.textContent = this.config.title || '';
		this.artistEl.textContent = this.config.artist || '';

		// 设置封面图片
		if (this.config.cover) {
			BBlockPlayer.style(this.customBgEl, { 'background-image': `url(${this.config.cover})` });
		}

		// 计算溢出宽度
		let [titleOvf, artistOvf] = [BBlockPlayer.overflowX(this.wrapperEl, this.titleEl), BBlockPlayer.overflowX(this.wrapperEl, this.artistEl)];
		// 如果溢出了就添加滚动效果
		if (titleOvf > 0) {
			// 这里 +5px 让视觉上更舒适一些，避免文字紧贴边缘
			this.titleEl.style.setProperty('--overflow-width', `${titleOvf + 5}px`);
			this.titleEl.classList.add('moveAni');
		}
		if (artistOvf > 0) {
			// 艺术家过长时，.artist-scroll 给艺术家这一行两侧添加淡出效果，优化视觉
			this.artistWrapperEl.classList.add('artist-scroll');
			this.artistEl.style.setProperty('--overflow-width', `${artistOvf + 10}px`);
			// .moveTrans 只会在鼠标移动到上面时才会左右滑动
			this.artistEl.classList.add('moveTrans');
		}
		// 注册鼠标事件
		this.playEl.addEventListener('click', this.play.bind(this));
		this.pauseEl.addEventListener('click', this.pause.bind(this));
		// 鼠标移入封皮时的处理主要是用于提醒用户音频出错了，这里节流避免频繁触发
		this.coverEl.addEventListener('mouseenter', BBlockPlayer.throttle(this._coverMouseEnterHandler.bind(this), 2000));
		// 注册音频事件
		this.audioEl.addEventListener('canplay', this._audioCanplayHandler.bind(this));
		this.audioEl.addEventListener('waiting', this._audioWaitHandler.bind(this));
		this.audioEl.addEventListener('play', this._audioPlayHandler.bind(this));
		this.audioEl.addEventListener('pause', this._audioPauseHandler.bind(this));
		this.audioEl.addEventListener('ended', this.pause.bind(this));
		this.audioEl.addEventListener('error', this._audioErrorHandler.bind(this));
		this.audioEl.addEventListener('timeupdate', BBlockPlayer.throttle(this._timeUpdateHandler.bind(this), 100));
	}

	/**
	 * 音频等待时的处理函数
	 * @param {Event} e 事件
	 */
	_audioWaitHandler(e) {
		if (e.target !== this.audioEl) return;
		this.wrapperEl.classList.add('state-loading');
	}

	/**
	 * 音频播放时的处理函数
	 * @param {Event} e 事件
	 * @returns 
	 */
	_audioPlayHandler(e) {
		if (e.target !== this.audioEl) return;
		if (this.firstPlay) {
			this.firstPlay = false;
			// 首次播放时展示提示
			this.tip('在此点击/悬停可进行调节', 1500);
		}
		// 如果音频状态还在载入中，展示加载状态
		if (this.audioEl.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
			this.wrapperEl.classList.add('state-loading');
		}
	}

	/**
	 * 音频暂停时的处理函数
	 * @param {Event} e 事件
	 */
	_audioPauseHandler(e) {
		if (e.target !== this.audioEl) return;
		// 暂停时移除加载状态
		this.wrapperEl.classList.remove('state-loading');
	}

	/**
	 * 音频播放出错时的处理函数
	 * @param {Event} e 事件
	 */
	_audioErrorHandler(e) {
		if (e.target !== this.audioEl) return;
		this.audioError = true;
		this.wrapperEl.classList.add('state-error');
		this.wrapperEl.classList.remove('state-loading');
		this.wrapperEl.classList.remove('state-first-loading');
	}

	/**
	 * 音频可以播放时的处理函数
	 * @param {Event} e 事件
	 */
	_audioCanplayHandler(e) {
		if (e.target !== this.audioEl) return;
		this.wrapperEl.classList.remove('state-loading');
		this.wrapperEl.classList.remove('state-first-loading');
	}

	/**
	 * 鼠标移入封皮时的处理函数
	 */
	_coverMouseEnterHandler(e) {
		if (e.target !== this.coverEl) return; // 只在鼠标移入封皮时触发
		// 如果音频出错了，就提示用户
		if (this.audioError) {
			this.tip('音频开小差了 :(');
		}
	}

	/**
	 * 音频播放进度更新时的处理函数
	 */
	_timeUpdateHandler(e) {
		if (e.target !== this.audioEl) return;
		this.wrapperEl.style.setProperty('--progress', (this.audioEl.currentTime / this.audioEl.duration) * 100);
	}

	/**
	 * 播放音频
	 */
	play() {
		this.wrapperEl.classList.add('state-playing');
		BBlockPlayer.waitTransitionEnd(this.playEl).then(() => {
			BBlockPlayer.style(this.pauseEl, { opacity: '1', pointerEvents: 'auto' });
		});
		this.audioEl.play().catch((err) => {
			console.error('Audio play failed:', err);
			this.tip('播放失败 :(');
			// 播放失败，通常不会有这种情况，因此直接标记为 error
			this._audioErrorHandler();
		});
	}

	/**
	 * 暂停音频
	 */
	pause() {
		BBlockPlayer.style(this.pauseEl, { opacity: '0', pointerEvents: 'none' });
		BBlockPlayer.waitTransitionEnd(this.pauseEl).then(() => {
			this.wrapperEl.classList.remove('state-playing');
		});
		this.audioEl.pause();
	}
};

var bblock = {
	/**
	 * 扫描页面中的 <bblock> 标签以构造播放器
	 * 这个方法是为了兼容 v1.x 版本的 bblock
	 * @returns {BBlockPlayer[]} BBlockPlayer 实例数组
	 */
	s: function () {
		const elements = document.getElementsByTagName('bblock');
		const objList = [];
		for (var i in elements) {
			if (elements[i].innerHTML) {
				try {
					let parsed = JSON.parse(elements[i].innerHTML);
					if (parsed.src) {
						// 有播放源就可以构造播放器
						objList.push(new BBlockPlayer(elements[i], parsed));
					}
				} catch (e) { }
			}
		}
		return objList;
	},
	/**
	 * 创建一个 BBlockPlayer 实例
	 * @param {HTMLElement} e HTML 元素，播放器将被创建在该元素中 
	 * @param {Object} config 播放器配置对象
	 * @returns {BBlockPlayer} BBlockPlayer 实例
	 */
	c: function (e, config) {
		return new BBlockPlayer(e, config);
	}
};

bblock.s();