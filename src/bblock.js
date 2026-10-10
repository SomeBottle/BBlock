/* BBlock 2.0 Wow~you can really play! - SomeBottle*/

class BBlockPlayer {
	static CONTROLS_SHOW_DELAY = 1000; // 控制面板显示延迟时间，单位为毫秒
	static CONTROLS_RETURN_DELAY = 2000; // 控制面板自动隐藏延迟时间，单位为毫秒

	constructor(element, config) {
		if (element instanceof Element) {
			this.e = element;
			this.config = config;
		} else {
			throw new Error('BBlockPlayer: The first argument must be an Element.');
		}
		this._init();
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
	_checkCSS() {
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
	_tip(message, duration = 1000) {
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

	_init() {
		// 检查 CSS 是否已应用
		this._checkCSS();
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
		this.bgLayerEl = this.wrapperEl.querySelector('.bg-layer');
		this.volumeIconEl = this.wrapperEl.querySelector('.volume-icon');
		this.progressIconEl = this.wrapperEl.querySelector('.progress-icon');
		this.controlsEl = this.wrapperEl.querySelector('.controls');
		this.controlBarEl = this.wrapperEl.querySelector('.controls>.bar');
		this.tipEl = this.wrapperEl.querySelector('.tip');
		BBlockPlayer.style(this.e, { position: 'relative', display: 'inline-block', 'float': this.config.float || 'none' });

		// 状态标记
		this.audioError = false; // 音频是否出错
		this.firstPlay = true; // 是否首次播放
		this.dontShowControls = false; // 是否刚点击了播放按钮，用来防止刚点击播放就 mouseenter 背景了，导致控制面板不久后被展示
		this.volumeControlling = false; // 是否正在进行音量调节
		this.progressControlling = false; // 是否正在进行进度调节
		this.barDragging = false; // 是否正在拖拽控制条
		this.previousMousePos = { x: 0, y: 0 }; // 上一次鼠标位置，用于计算拖拽距离

		// 计时器
		this.controlsShowTimer = null; // 控制面板显示计时器
		this.controlsReturnTimer = null; // 控制面板自动回撤计时器

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
		// 注册控制层展开相关的鼠标事件
		this.bgLayerEl.addEventListener('click', this._bgMouseClickHandler.bind(this));
		if ("PointerEvent" in window) {
			this.pauseEl.addEventListener('pointerenter', this._pauseMouseEnterHandler.bind(this));
			this.bgLayerEl.addEventListener('pointerenter', this._bgMouseEnterHandler.bind(this));
			this.wrapperEl.addEventListener('pointerleave', this._wrapperMouseLeaveHandler.bind(this));
		} else {
			this.pauseEl.addEventListener('mouseenter', this._pauseMouseEnterHandler.bind(this));
			this.bgLayerEl.addEventListener('mouseenter', this._bgMouseEnterHandler.bind(this));
			this.wrapperEl.addEventListener('mouseleave', this._wrapperMouseLeaveHandler.bind(this));
		}
		// 注册控制相关事件
		if ("TouchEvent" in window) {
			this.volumeIconEl.addEventListener('touchstart', this._volumeIconMouseDownHandler.bind(this));
			this.progressIconEl.addEventListener('touchstart', this._progressIconMouseDownHandler.bind(this));
			this.controlsEl.addEventListener('touchstart', this._controlsMouseDownHandler.bind(this));
			window.addEventListener('touchmove', BBlockPlayer.throttle(this._windowMouseMoveHandler.bind(this), 100));
			window.addEventListener('touchend', this._windowMouseUpHandler.bind(this));
		}
		this.volumeIconEl.addEventListener('mousedown', this._volumeIconMouseDownHandler.bind(this));
		this.volumeIconEl.addEventListener('dragstart', this._dragStartHandler.bind(this));
		this.progressIconEl.addEventListener('mousedown', this._progressIconMouseDownHandler.bind(this));
		this.progressIconEl.addEventListener('dragstart', this._dragStartHandler.bind(this));
		this.controlsEl.addEventListener('mousedown', this._controlsMouseDownHandler.bind(this));
		this.controlsEl.addEventListener('dragstart', this._dragStartHandler.bind(this));
		window.addEventListener('mousemove', BBlockPlayer.throttle(this._windowMouseMoveHandler.bind(this), 100));
		window.addEventListener('mouseup', this._windowMouseUpHandler.bind(this));
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
			this._tip('在此点击/悬停可进入拖拽面板', 1500);
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
		// 隐藏控制面板
		this._hideControls();
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
		this._hideControls();
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
		if (!this.coverEl.contains(e.target)) return; // 只在鼠标移入封皮时触发
		// 如果音频出错了，就提示用户
		if (this.audioError) {
			this._tip('音频开小差了 :(');
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
	 * 鼠标移入背景时的处理函数
	 */
	_bgMouseEnterHandler(e) {
		if (!this.bgLayerEl.contains(e.target)) return;
		this._readyToShowControls();
	}

	/**
	 * 鼠标点击背景时的处理函数
	 * 这个处理函数主要是为了防止用户点击播放按钮后，控制面板立即显示
	 */
	_bgMouseClickHandler(e) {
		if (!this.bgLayerEl.contains(e.target)) return;
		// 如果是再次点击，就重置标记位
		// 这样点完播放按钮，控制面板不会立即显示，但是我可以再点击一次来显示控制面板
		this.dontShowControls = false;
		this._readyToShowControls();
	}

	/**
	 * 鼠标移入暂停按钮时的处理函数
	 */
	_pauseMouseEnterHandler(e) {
		if (!this.pauseEl.contains(e.target)) return;
		// 鼠标移入暂停按钮时，不显示控制面板
		this._hideControls();
	}

	/**
	 * 鼠标移出播放器时的处理函数
	 */
	_wrapperMouseLeaveHandler(e) {
		if (!this.wrapperEl.contains(e.target)) return;
		if (this.volumeControlling || this.progressControlling) {
			// 如果正在调节音量或进度，就不隐藏控制面板
			return;
		}
		// 鼠标移出播放器时，隐藏控制面板
		this._hideControls();
	}

	/**
	 * 阻止拖拽事件的默认行为，避免拖拽时出现选中状态
	 * @param {Event} e 事件
	 */
	_dragStartHandler(e) {
		if (!this.wrapperEl.contains(e.target)) return;
		e.preventDefault();
	}

	/**
	 * 鼠标在音量图标上按下时的处理函数
	 * 按下后转换为音量调节控制模式
	 */
	_volumeIconMouseDownHandler(e) {
		if (!this.volumeIconEl.contains(e.target)) return;
		this.volumeControlling = true;
		this.volumeIconEl.classList.add('active-icon');
		this.progressIconEl.classList.add('hidden-icon');
		this.controlBarEl.style.width = `${this.audioEl.volume * 100}%`;
		this._controlsMouseDownHandler(e);
	}

	/**
	 * 鼠标在进度图标上按下时的处理函数
	 * 按下后转换为进度调节控制模式
	 * @param {Event} e 事件
	 * @returns
	 */
	_progressIconMouseDownHandler(e) {
		if (!this.progressIconEl.contains(e.target)) return;
		this.progressControlling = true;
		this.progressIconEl.classList.add('active-icon');
		this.volumeIconEl.classList.add('hidden-icon');
		this.controlBarEl.style.width = `${(this.audioEl.currentTime / this.audioEl.duration) * 100}%`;
		this._controlsMouseDownHandler(e);
	}

	/**
	 * 鼠标在控制层上按下时的处理函数
	 * 只要用户鼠标还在控制层，就算鼠标松开了也可以重新开始拖拽
	 * @param {Event} e 事件
	 * @returns
	 */
	_controlsMouseDownHandler(e) {
		if (!this.wrapperEl.contains(e.target)) return;
		if (!this.volumeControlling && !this.progressControlling) return;
		this.barDragging = true;
		// 开始拖拽时重置一下鼠标位置，避免拖拽时出现跳跃
		this.previousMousePos = this._getMousePos(e);
	}

	/**
	 * 鼠标在窗口上移动时的处理函数
	 * 主要是为了处理音量和进度调节的拖拽操作
	 * @param {Event} e 事件
	 * @returns
	 */
	_windowMouseMoveHandler(e) {
		// 鼠标在面板内移动，重置面板自动隐藏定时器
		if (this.wrapperEl.contains(e.target) && this.controlsReturnTimer !== null) {
			this._setControlsReturnTimer();
		}
		let { x: clientX, y: clientY } = this._getMousePos(e);
		if (!this.barDragging) {
			// 没有在拖拽时，不处理
			this.previousMousePos = { x: clientX, y: clientY };
			// 如果这个时候鼠标移出控制面板，就隐藏面板
			if (!this.wrapperEl.contains(e.target)) {
				this._hideControls();
			}
			return;
		}
		let deltaX = clientX - this.previousMousePos.x;
		if (this.volumeControlling) {
			// 音量调节
			this.audioEl.volume = Math.min(Math.max(this.audioEl.volume + deltaX * 0.01, 0), 1);
			this.controlBarEl.style.width = `${this.audioEl.volume * 100}%`;
		} else if (this.progressControlling) {
			// 进度调节
			const audioDuration = this.audioEl.duration;
			const playerWidth = this.wrapperEl.clientWidth;
			this.audioEl.currentTime = Math.min(Math.max(this.audioEl.currentTime + (audioDuration / playerWidth * deltaX), 0), this.audioEl.duration - 0.01);
			this.controlBarEl.style.width = `${(this.audioEl.currentTime / audioDuration) * 100}%`;
		}
		this.previousMousePos = { x: clientX, y: clientY };
	}

	/**
	 * 获取鼠标位置
	 * @param {MouseEvent|TouchEvent|PointerEvent} e 鼠标事件
	 * @returns {Object} 鼠标位置 {x: number, y: number}
	 */
	_getMousePos(e) {
		if (!(e instanceof MouseEvent) && !("TouchEvent" in window && e instanceof TouchEvent) && !("PointerEvent" in window && e instanceof PointerEvent)) {
			return { x: -1, y: -1 };
		}
		let clientX, clientY;
		if ("touches" in e) {
			if (e.touches.length > 0) {
				clientX = e.touches[0].clientX;
				clientY = e.touches[0].clientY;
			} else if (e.changedTouches.length > 0) {
				clientX = e.changedTouches[0].clientX;
				clientY = e.changedTouches[0].clientY;
			}
		} else {
			clientX = e.clientX;
			clientY = e.clientY;
		}
		return { x: clientX, y: clientY }
	}

	/**
	 * 鼠标在窗口上松开时的处理函数
	 * 主要是为了结束音量和进度调节的拖拽操作
	 * @param {Event} e 事件
	 * @returns
	 */
	_windowMouseUpHandler(e) {
		if (!this.volumeControlling && !this.progressControlling) {
			return;
		}
		// 松开鼠标肯定停止拖拽了
		this.barDragging = false;
		// 如果鼠标在控制面板内松开，就不结束调节状态，用户可能还想继续调节
		if (this.wrapperEl.contains(e.target)) {
			// 设立一个定时器，一段时间没动作就自动隐藏控制面板
			this._setControlsReturnTimer();
			return;
		}
		// 鼠标在控制面板外松开，就结束调节状态
		this.volumeControlling = false;
		this.progressControlling = false;
		this._hideControls();
	}

	/**
	 * 设置控制面板自动回撤的计时器
	 * 这个方法会清除之前的计时器，重新设置一个新的计时器
	 * 计时器时间为 3 秒
	 * @returns
	 */
	_setControlsReturnTimer() {
		if (this.controlsReturnTimer !== null) {
			clearTimeout(this.controlsReturnTimer);
			this.controlsReturnTimer = null;
		}
		this.controlsReturnTimer = setTimeout(() => {
			this._returnControls();
		}, BBlockPlayer.CONTROLS_RETURN_DELAY);
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
			this._tip('播放失败 :(');
			// 播放失败，通常不会有这种情况，因此直接标记为 error
			this._audioErrorHandler();
		});
		this.dontShowControls = true;
	}

	/**
	 * 暂停音频
	 */
	pause() {
		BBlockPlayer.style(this.pauseEl, { opacity: '0', pointerEvents: 'none' });
		BBlockPlayer.waitTransitionEnd(this.pauseEl).then(() => {
			this.wrapperEl.classList.remove('state-playing');
			// 暂停时也隐藏控制面板
			this._hideControls();
		});
		this.audioEl.pause();
	}

	/**
	 * 准备展示控制面板
	 */
	_readyToShowControls() {
		if (this.dontShowControls) {
			// 如果刚点击了播放按钮，就不展示控制面板，避免刚点击播放就 mouseenter 背景了，导致控制面板不久后被展示
			this.dontShowControls = false;
			return;
		}
		if (this.controlsShowTimer !== null) {
			// 如果计时器已经存在
			clearTimeout(this.controlsShowTimer);
			this.controlsShowTimer = null;
		}
		this.controlsShowTimer = setTimeout(() => {
			this.wrapperEl.classList.add('controls-show');
			this.controlsShowTimer = null;
		}, BBlockPlayer.CONTROLS_SHOW_DELAY);
		this._setControlsReturnTimer();
	}

	/**
	 * 回撤到控制面板的上一个状态。目前有调节状态和非调节状态两种状态，位于非调节状态再回撤时，则会关闭面板。
	 * 
	 * 这个主要是搭配 ControlsReturnTimer 使用的，计时器到时间后会调用这个方法来回撤控制面板的状态。
	 */
	_returnControls() {
		if (this.volumeControlling || this.progressControlling) {
			// 如果正在调节音量或进度，就结束调节状态
			this._stopControlling();
			// 再设定一次计时器，准备下一次回撤
			this._setControlsReturnTimer();
		} else {
			// 如果不在调节状态，就隐藏控制面板
			this._hideControls();
		}
	}

	/**
	 * 结束所有控制状态，恢复到非调节状态的控制面板
	 */
	_stopControlling() {
		this.volumeControlling = false;
		this.progressControlling = false;
		this.volumeIconEl.classList.remove('active-icon');
		this.progressIconEl.classList.remove('active-icon');
		this.volumeIconEl.classList.remove('hidden-icon');
		this.progressIconEl.classList.remove('hidden-icon');
		// 拖拽条复位
		this.controlBarEl.style.width = '0%';
	}

	/**
	 * 隐藏控制面板
	 */
	_hideControls() {
		if (this.controlsShowTimer !== null) {
			clearTimeout(this.controlsShowTimer);
			this.controlsShowTimer = null;
		}
		if (this.controlsReturnTimer !== null) {
			clearTimeout(this.controlsReturnTimer);
			this.controlsReturnTimer = null;
		}
		this.wrapperEl.classList.remove('controls-show');
		// 控制状态复位
		this._stopControlling();
		this.dontShowControls = false;
		this.barDragging = false;
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