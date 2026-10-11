/* BBlock 2.0 Wow~you can really play! - SomeBottle*/

class BBlockPlayer {
	static bblockId = 0; // 用于生成唯一的播放器 ID
	static CONTROLS_SHOW_DELAY = 1000; // 控制面板显示延迟时间，单位为毫秒
	static CONTROLS_RETURN_DELAY = 2500; // 控制面板自动隐藏延迟时间，单位为毫秒
	/**
	 * 多语言映射表
	 */
	static I18N_MAP = {
		"zh-CN": {
			"audio_first_play": "在此点击/悬停可开启拖拽面板",
			"audio_reload_error": "音频载入失败 :(",
			"audio_play_error": "播放失败 :("
		},
		"zh-TW": {
			"audio_first_play": "在此點擊/懸停可開啟拖曳面板",
			"audio_reload_error": "音訊載入失敗 :(",
			"audio_play_error": "播放失敗 :("
		},
		"en-US": {
			"audio_first_play": "Click/hover here to open the drag panel",
			"audio_reload_error": "Audio failed to load :(",
			"audio_play_error": "Failed to play :("
		}
	};

	constructor(element, config) {
		if (element instanceof Element) {
			this._id = BBlockPlayer.bblockId++;
			this._e = element;
			// 记录原始的 innerHTML 和内联样式，以便在销毁时恢复
			this._previousHtml = element.innerHTML;
			this._previousStyle = element.getAttribute('style') || '';
			this._config = config;
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
	 * @param {string} [propertyName=""] 可选的过渡属性名
	 * @param {number} [duration=500] 可选的兜底过渡持续时间，单位为毫秒
	 * @returns {Promise} 返回一个 Promise，当过渡动画结束时 resolve
	 */
	static waitTransitionEnd(element, propertyName = "", duration = 500) {
		return new Promise((resolve) => {
			let settled = false;
			let fallbackTimer = null;
			const finish = (e) => {
				if (e && (e.target !== element || (propertyName && e.propertyName !== propertyName))) return;
				if (settled) return;
				settled = true;
				if (fallbackTimer !== null) {
					clearTimeout(fallbackTimer);
				}
				element.removeEventListener('transitionend', finish);
				element.removeEventListener('transitioncancel', finish);
				resolve();
			};
			element.addEventListener('transitionend', finish);
			element.addEventListener('transitioncancel', finish);
			// 取决于 CSS 中的过渡时间
			fallbackTimer = setTimeout(finish, duration);
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
		const tipEl = this._tipEl;
		this._tipQueue = this._tipQueue.then(() => {
			return new Promise((resolve) => {
				this._emitEvent('tipshow', message, duration);
				tipEl.textContent = message;
				tipEl.style.opacity = '1';
				setTimeout(() => {
					this._emitEvent('tiphide', message, duration);
					tipEl.style.opacity = '0';
					setTimeout(resolve, 500); // 等待过渡动画结束后再 resolve
				}, duration);
			});
		});
	}

	/**
	 * 获得当前语言下的文本
	 * @param {string} key 键
	 */
	_text(key) {
		// 默认 zh-CN
		const langMap = BBlockPlayer.I18N_MAP[this._config.language || 'zh-CN'] || BBlockPlayer.I18N_MAP['zh-CN'];
		return langMap[key] || '';
	}

	/**
	 * 初始化播放器
	 */
	_init() {
		// 检查 CSS 是否已应用
		this._checkCSS();
		this._e.innerHTML = `{{HTML}}`;
		this._wrapperEl = this._e.querySelector('.bblock-wrapper');
		this._coverEl = this._wrapperEl.querySelector('.cover');
		this._titleEl = this._wrapperEl.querySelector('.title');
		this._artistWrapperEl = this._wrapperEl.querySelector('.artist-wrapper');
		this._artistEl = this._wrapperEl.querySelector('.artist');
		this._playEl = this._wrapperEl.querySelector('.play');
		this._pauseEl = this._wrapperEl.querySelector('.pause');
		this._reloadEl = this._wrapperEl.querySelector('.reload');
		this._audioEl = this._wrapperEl.querySelector('audio');
		this._customBgEl = this._wrapperEl.querySelector('.custom-bg');
		this._edgeSharpCustomBgEl = this._wrapperEl.querySelector('.edge-sharp-custom-bg');
		this._bgLayerEl = this._wrapperEl.querySelector('.bg-layer');
		this._volumeIconEl = this._wrapperEl.querySelector('.volume-icon');
		this._progressIconEl = this._wrapperEl.querySelector('.progress-icon');
		this._controlsEl = this._wrapperEl.querySelector('.controls');
		this._controlBarEl = this._wrapperEl.querySelector('.controls>.bar');
		this._tipEl = this._wrapperEl.querySelector('.tip');
		BBlockPlayer.style(this._e, { position: 'relative', display: 'inline-block', 'float': this._config.float || 'none' });

		// 通过 .on 注册的播放器监听器
		this._listeners = new Map();
		this._customEventAbortController = new AbortController(); // 用于自定义事件的 AbortController

		// 状态标记
		this._audioError = false; // 音频是否出错
		this._audioReloading = false; // 是否在重载音频
		this._firstPlay = true; // 是否首次播放
		this._dontShowControls = false; // 是否刚点击了播放按钮，用来防止刚点击播放就 mouseenter 背景了，导致控制面板不久后被展示
		this._volumeControlling = false; // 是否正在进行音量调节
		this._progressControlling = false; // 是否正在进行进度调节
		this._barDragging = false; // 是否正在拖拽控制条
		this._previousMousePos = { x: 0, y: 0 }; // 上一次鼠标位置，用于计算拖拽距离
		this._playbackTransitionToken = 0; // 播放状态过渡的标记，用于防止频繁操作导致的状态错乱
		this._destroyed = false; // 播放器是否已被销毁

		// 计时器
		this._controlsShowTimer = null; // 控制面板显示计时器
		this._controlsReturnTimer = null; // 控制面板自动回撤计时器

		// 提示语队列
		this._tipQueue = Promise.resolve();

		// 最开始先进入加载状态
		this._wrapperEl.classList.add('state-first-loading');

		// 设置音频源 (src 肯定是有的)
		this._audioEl.src = this._config.src;

		// 设置标题和艺术家信息
		this._titleEl.textContent = this._config.title || '';
		this._artistEl.textContent = this._config.artist || '';

		if (this._config.cover) {
			// 同步设置主背景和中央清晰背景副本的封面图片
			// 这样是为了以较高兼容性实现边缘模糊效果
			BBlockPlayer.style(
				[
					this._customBgEl,
					this._edgeSharpCustomBgEl
				],
				{
					'background-image': `url(${this._config.cover})`
				}
			);
		}

		// 计算溢出宽度
		let [titleOvf, artistOvf] = [BBlockPlayer.overflowX(this._wrapperEl, this._titleEl), BBlockPlayer.overflowX(this._wrapperEl, this._artistEl)];
		// 如果溢出了就添加滚动效果
		if (titleOvf > 0) {
			// 这里 +5px 让视觉上更舒适一些，避免文字紧贴边缘
			this._titleEl.style.setProperty('--overflow-width', `${titleOvf + 5}px`);
			this._titleEl.classList.add('moveAni');
		}
		if (artistOvf > 0) {
			// 艺术家过长时，.artist-scroll 给艺术家这一行两侧添加淡出效果，优化视觉
			this._artistWrapperEl.classList.add('artist-scroll');
			this._artistEl.style.setProperty('--overflow-width', `${artistOvf + 10}px`);
			// .moveTrans 只会在鼠标移动到上面时才会左右滑动
			this._artistEl.classList.add('moveTrans');
		}
		this._eventAbortController = new AbortController();
		const { signal } = this._eventAbortController;
		// 注册鼠标事件
		this._playEl.addEventListener('click', this.play.bind(this), { signal });
		this._pauseEl.addEventListener('click', this.pause.bind(this), { signal });
		this._reloadEl.addEventListener('click', this._reloadClickHandler.bind(this), { signal });
		// 注册音频事件
		this._audioEl.addEventListener('canplay', this._audioCanplayHandler.bind(this), { signal });
		this._audioEl.addEventListener('waiting', this._audioWaitHandler.bind(this), { signal });
		this._audioEl.addEventListener('play', this._audioPlayHandler.bind(this), { signal });
		this._audioEl.addEventListener('pause', this._audioPauseHandler.bind(this), { signal });
		this._audioEl.addEventListener('ended', this.pause.bind(this), { signal });
		this._audioEl.addEventListener('error', this._audioErrorHandler.bind(this), { signal });
		this._audioEl.addEventListener('timeupdate', BBlockPlayer.throttle(this._timeUpdateHandler.bind(this), 100), { signal });
		// 注册控制层展开相关的鼠标事件
		this._bgLayerEl.addEventListener('click', this._bgMouseClickHandler.bind(this), { signal });
		if ("PointerEvent" in window) {
			this._pauseEl.addEventListener('pointerenter', this._pauseMouseEnterHandler.bind(this), { signal });
			this._bgLayerEl.addEventListener('pointerenter', this._bgMouseEnterHandler.bind(this), { signal });
			this._wrapperEl.addEventListener('pointerleave', this._wrapperMouseLeaveHandler.bind(this), { signal });
		} else {
			this._pauseEl.addEventListener('mouseenter', this._pauseMouseEnterHandler.bind(this), { signal });
			this._bgLayerEl.addEventListener('mouseenter', this._bgMouseEnterHandler.bind(this), { signal });
			this._wrapperEl.addEventListener('mouseleave', this._wrapperMouseLeaveHandler.bind(this), { signal });
		}
		// 注册控制相关事件
		if ("TouchEvent" in window) {
			this._volumeIconEl.addEventListener('touchstart', this._volumeIconMouseDownHandler.bind(this), { signal });
			this._progressIconEl.addEventListener('touchstart', this._progressIconMouseDownHandler.bind(this), { signal });
			this._controlsEl.addEventListener('touchstart', this._controlsMouseDownHandler.bind(this), { signal });
			window.addEventListener('touchmove', BBlockPlayer.throttle(this._windowMouseMoveHandler.bind(this), 100), { signal });
			window.addEventListener('touchend', this._windowMouseUpHandler.bind(this), { signal });
		}
		this._volumeIconEl.addEventListener('mousedown', this._volumeIconMouseDownHandler.bind(this), { signal });
		this._volumeIconEl.addEventListener('dragstart', this._dragStartHandler.bind(this), { signal });
		this._progressIconEl.addEventListener('mousedown', this._progressIconMouseDownHandler.bind(this), { signal });
		this._progressIconEl.addEventListener('dragstart', this._dragStartHandler.bind(this), { signal });
		this._controlsEl.addEventListener('mousedown', this._controlsMouseDownHandler.bind(this), { signal });
		this._controlsEl.addEventListener('dragstart', this._dragStartHandler.bind(this), { signal });
		window.addEventListener('mousemove', BBlockPlayer.throttle(this._windowMouseMoveHandler.bind(this), 100), { signal });
		window.addEventListener('mouseup', this._windowMouseUpHandler.bind(this), { signal });
		// 注册到全局播放器列表中
		bblock._currentPlayers[this.id] = this;
		// 启动 Observer 监听播放器元素是否被移除
		this._elObserver = new MutationObserver(() => {
			if (!this._wrapperEl.isConnected) {
				// 如果播放器元素不在文档中，就销毁播放器
				this.destroy();
			}
		});
		this._elObserver.observe(document.body, { childList: true, subtree: true });
	}

	/**
	 * 音频等待时的处理函数
	 * @param {Event} e 事件
	 */
	_audioWaitHandler(e) {
		if (e.target !== this._audioEl) return;
		this._wrapperEl.classList.add('state-loading');
	}

	/**
	 * 音频播放时的处理函数
	 * @param {Event} e 事件
	 * @returns
	 */
	_audioPlayHandler(e) {
		if (e.target !== this._audioEl) return;
		if (this._firstPlay) {
			this._firstPlay = false;
			// 首次播放时展示提示
			this._tip(this._text('audio_first_play'), 1500);
		}
		this._setPlayerPlayingState();
	}

	/**
	 * 设置播放器为播放状态
	 */
	_setPlayerPlayingState() {
		const transitionToken = ++this._playbackTransitionToken;
		this._wrapperEl.classList.add('edge-blur-active');
		this._wrapperEl.classList.add('state-playing');
		BBlockPlayer.waitTransitionEnd(this._playEl, 'opacity').then(() => {
			// transitionToken 发生变化说明这个过程中发生了别的过渡（通常是快速点到了暂停按钮），这个过渡被取消了
			if (transitionToken !== this._playbackTransitionToken) return;
			BBlockPlayer.style(this._pauseEl, { opacity: '1', pointerEvents: 'auto' });
		});
		// 如果音频状态还在载入中，展示加载状态
		if (this._audioEl.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
			this._wrapperEl.classList.add('state-loading');
		}
	}

	/**
	 * 音频暂停时的处理函数
	 * @param {Event} e 事件
	 */
	_audioPauseHandler(e) {
		if (e.target !== this._audioEl) return;
		this._setPlayerPausedState();
	}

	/**
	 * 设置播放器为暂停状态
	 */
	_setPlayerPausedState() {
		// 暂停时移除加载状态
		this._wrapperEl.classList.remove('state-loading');
		// 隐藏控制面板
		this._hideControls();
		const transitionToken = ++this._playbackTransitionToken;
		BBlockPlayer.style(this._pauseEl, { opacity: '0', pointerEvents: 'none' });
		BBlockPlayer.waitTransitionEnd(this._pauseEl, 'opacity').then(() => {
			if (transitionToken !== this._playbackTransitionToken) return;
			this._wrapperEl.classList.remove('edge-blur-active');
			this._wrapperEl.classList.remove('state-playing');
			// 暂停时也隐藏控制面板
			this._hideControls();
		});
	}

	/**
	 * 音频播放出错时的处理函数
	 * @param {Event} e 事件
	 */
	_audioErrorHandler(e) {
		if (e && e.target !== this._audioEl) return;
		this._setPlayerErrorState();
	}

	/**
	 * 设置状态为音频播放出错
	 */
	_setPlayerErrorState() {
		this._playbackTransitionToken++;
		this._audioError = true;
		if (this._audioReloading) {
			// 如果是重载时失败也提示一下
			this._tip(this._text('audio_reload_error'));
			this._audioReloading = false; // 重置重载状态
		}
		this._wrapperEl.classList.add('state-error');
		this._wrapperEl.classList.remove('state-loading');
		this._wrapperEl.classList.remove('state-first-loading');
		this._wrapperEl.classList.remove('edge-blur-active');
		this._hideControls();
	}

	/**
	 * 音频可以播放时的处理函数
	 * @param {Event} e 事件
	 */
	_audioCanplayHandler(e) {
		if (e.target !== this._audioEl) return;
		this._audioReloading = false; // 重置重载状态
		this._wrapperEl.classList.remove('state-loading');
		this._wrapperEl.classList.remove('state-first-loading');
	}

	/**
	 * 音频播放进度更新时的处理函数
	 * @param {Event} e 事件
	 */
	_timeUpdateHandler(e) {
		if (e.target !== this._audioEl) return;
		const progress = this._getProgressPercent();
		if (progress === null) return;
		this._wrapperEl.style.setProperty('--progress', progress);
	}

	/**
	 * 获取当前音频播放进度的百分比
	 * @returns {number|null} 当前播放进度的百分比，如果无法获取则返回 null
	 */
	_getProgressPercent() {
		const audioDuration = this._audioEl.duration;
		const currentTime = this._audioEl.currentTime;
		if (!Number.isFinite(audioDuration) || audioDuration <= 0 || !Number.isFinite(currentTime)) {
			return null;
		}
		return Math.min(Math.max(currentTime / audioDuration * 100, 0), 100);
	}

	/**
	 * 点击重新加载按钮时的处理函数
	 * @param {Event} e 事件
	 */
	_reloadClickHandler(e) {
		if (!this._reloadEl.contains(e.target)) return;
		this._audioError = false;
		this._audioReloading = true; // 标记正在重载
		this._wrapperEl.classList.remove('state-error');
		// 回到最初的载入状态
		this._wrapperEl.classList.add('state-first-loading');
		this._audioEl.load();
	}

	/**
	 * 鼠标移入背景时的处理函数
	 * @param {Event} e 事件
	 */
	_bgMouseEnterHandler(e) {
		if (!this._bgLayerEl.contains(e.target)) return;
		this._readyToShowControls();
	}

	/**
	 * 鼠标点击背景时的处理函数
	 * 这个处理函数主要是为了防止用户点击播放按钮后，控制面板立即显示
	 * @param {Event} e 事件
	 */
	_bgMouseClickHandler(e) {
		if (!this._bgLayerEl.contains(e.target)) return;
		// 如果是再次点击，就重置标记位
		// 这样点完播放按钮，控制面板不会立即显示，但是我可以再点击一次来显示控制面板
		this._dontShowControls = false;
		this._readyToShowControls();
	}

	/**
	 * 鼠标移入暂停按钮时的处理函数
	 * @param {Event} e 事件
	 */
	_pauseMouseEnterHandler(e) {
		if (!this._pauseEl.contains(e.target)) return;
		// 鼠标移入暂停按钮时，不显示控制面板
		this._hideControls();
	}

	/**
	 * 鼠标移出播放器时的处理函数
	 * @param {Event} e 事件
	 */
	_wrapperMouseLeaveHandler(e) {
		if (!this._wrapperEl.contains(e.target)) return;
		if (this._volumeControlling || this._progressControlling) {
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
		if (!this._wrapperEl.contains(e.target)) return;
		e.preventDefault();
	}

	/**
	 * 鼠标在音量图标上按下时的处理函数
	 * 按下后转换为音量调节控制模式
	 * @param {Event} e 事件
	 */
	_volumeIconMouseDownHandler(e) {
		if (!this._volumeIconEl.contains(e.target)) return;
		// 如果是启动了音量控制就激发事件
		if (!this._volumeControlling) {
			this._emitEvent('volumecontrolstart');
		}
		this._volumeControlling = true;
		this._volumeIconEl.classList.add('active-icon');
		this._progressIconEl.classList.add('hidden-icon');
		this._controlBarEl.style.width = `${this._audioEl.volume * 100}%`;
		// 事件会冒泡到 controls 层，由 controls 层统一开始拖拽
	}

	/**
	 * 鼠标在进度图标上按下时的处理函数
	 * 按下后转换为进度调节控制模式
	 * @param {Event} e 事件
	 * @returns
	 */
	_progressIconMouseDownHandler(e) {
		if (!this._progressIconEl.contains(e.target)) return;
		const progress = this._getProgressPercent();
		if (progress === null) return;
		// 如果是启动了进度控制就激发事件
		if (!this._progressControlling) {
			this._emitEvent('progresscontrolstart');
		}
		this._progressControlling = true;
		this._progressIconEl.classList.add('active-icon');
		this._volumeIconEl.classList.add('hidden-icon');
		this._controlBarEl.style.width = `${progress}%`;
		// 事件会冒泡到 controls 层，由 controls 层统一开始拖拽
	}

	/**
	 * 鼠标在控制层上按下时的处理函数
	 * 按下后只要用户鼠标还在控制层，就算鼠标松开了也可以重新开始拖拽
	 * @param {Event} e 事件
	 * @returns
	 */
	_controlsMouseDownHandler(e) {
		if (!this._wrapperEl.contains(e.target)) return;
		if (!this._volumeControlling && !this._progressControlling) return;
		e.stopPropagation();
		this._barDragging = true;
		// 开始拖拽时重置一下鼠标位置，避免拖拽时出现跳跃
		this._previousMousePos = this._getMousePos(e);
		// 重置面板回撤计时器
		this._setControlsReturnTimer();
	}

	/**
	 * 鼠标在窗口上移动时的处理函数
	 * 主要是为了处理音量和进度调节的拖拽操作
	 * @param {Event} e 事件
	 * @returns
	 */
	_windowMouseMoveHandler(e) {
		const insideWrapper = this._isEventInsideWrapper(e);
		// 鼠标在面板内移动，重置面板自动隐藏定时器
		if ((insideWrapper || this._barDragging) && this._controlsReturnTimer !== null) {
			this._setControlsReturnTimer();
		}
		const { x: clientX, y: clientY } = this._getMousePos(e);
		if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
		if (!this._barDragging) {
			// 没有在拖拽时，不处理
			this._previousMousePos = { x: clientX, y: clientY };
			// 如果这个时候鼠标移出控制面板，就隐藏面板
			if (!insideWrapper) {
				this._hideControls();
			}
			return;
		}
		let deltaX = clientX - this._previousMousePos.x;
		if (this._volumeControlling) {
			// 音量调节
			this._audioEl.volume = Math.min(Math.max(this._audioEl.volume + deltaX * 0.01, 0), 1);
			this._controlBarEl.style.width = `${this._audioEl.volume * 100}%`;
		} else if (this._progressControlling) {
			// 进度调节
			const audioDuration = this._audioEl.duration;
			const playerWidth = this._wrapperEl.clientWidth;
			if (!Number.isFinite(audioDuration) || audioDuration <= 0 || playerWidth <= 0) {
				this._stopControlling();
				return;
			}
			const currentTime = Number.isFinite(this._audioEl.currentTime) ? this._audioEl.currentTime : 0;
			const maxTime = audioDuration <= 0.5 ? audioDuration : audioDuration - 0.5;
			this._audioEl.currentTime = Math.min(Math.max(currentTime + (audioDuration / playerWidth * deltaX), 0), maxTime);
			const progress = this._getProgressPercent();
			if (progress !== null) {
				this._controlBarEl.style.width = `${progress}%`;
			}
		}
		this._previousMousePos = { x: clientX, y: clientY };
	}

	/**
	 * 判断事件发生的位置是否在播放器内
	 * @param {Event} e 鼠标或触摸事件
	 * @returns {boolean} 事件位置是否在播放器内
	 */
	_isEventInsideWrapper(e) {
		if (e && ("touches" in e || "changedTouches" in e)) {
			const { x, y } = this._getMousePos(e);
			if (Number.isFinite(x) && Number.isFinite(y)) {
				const rect = this._wrapperEl.getBoundingClientRect();
				return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
			}
		}
		return Boolean(e && this._wrapperEl.contains(e.target));
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
			const touch = e.touches[0] || e.changedTouches[0];
			if (!touch) return { x: -1, y: -1 };
			clientX = touch.clientX;
			clientY = touch.clientY;
		} else {
			clientX = e.clientX;
			clientY = e.clientY;
		}
		return { x: clientX, y: clientY };
	}

	/**
	 * 鼠标在窗口上松开时的处理函数
	 * 主要是为了结束音量和进度调节的拖拽操作
	 * @param {Event} e 事件
	 * @returns
	 */
	_windowMouseUpHandler(e) {
		if (!this._volumeControlling && !this._progressControlling) {
			return;
		}
		// 松开鼠标肯定停止拖拽了
		this._barDragging = false;
		// 如果鼠标在控制面板内松开，就不结束调节状态，用户可能还想继续调节
		if (this._isEventInsideWrapper(e)) {
			// 设立一个定时器，一段时间没动作就自动隐藏面板
			this._setControlsReturnTimer();
			return;
		}
		// 鼠标在控制面板外松开，就结束调节状态
		this._volumeControlling = false;
		this._progressControlling = false;
		this._hideControls();
	}

	/**
	 * 设置控制面板自动回撤的计时器
	 * 这个方法会清除之前的计时器，重新设置一个新的计时器
	 * 计时器时间为 CONTROLS_RETURN_DELAY/1000 秒
	 * @returns
	 */
	_setControlsReturnTimer() {
		if (this._controlsReturnTimer !== null) {
			clearTimeout(this._controlsReturnTimer);
			this._controlsReturnTimer = null;
		}
		this._controlsReturnTimer = setTimeout(() => {
			this._returnControls();
		}, BBlockPlayer.CONTROLS_RETURN_DELAY);
	}

	/**
	 * 播放音频
	 */
	play() {
		this._audioEl.play().catch((err) => {
			console.error('Audio play failed:', err);
			this._tip(this._text('audio_play_error'));
			// 播放失败，通常不会有这种情况，因此直接标记为 error
			this._setPlayerErrorState();
		});
		this._dontShowControls = true;
	}

	/**
	 * 暂停音频
	 */
	pause() {
		this._audioEl.pause();
	}

	/**
	 * 设置音量，范围为 0~1
	 * @param {number} value 音量值，范围为 0~1
	 */
	set volume(value) {
		this._audioEl.volume = Math.min(Math.max(value, 0), 1);
	}

	/**
	 * 获取当前音量，范围为 0~1
	 * @returns {number} 当前音量，范围为 0~1
	 */
	get volume() {
		return this._audioEl.volume;
	}

	/**
	 * 设置播放进度
	 * @param {number} value 播放进度 (秒)
	 */
	seek(value) {
		this._audioEl.currentTime = Math.min(Math.max(value, 0), this._audioEl.duration);
	}

	/**
	 * 获得当前播放进度 (秒)
	 * @returns {number} 当前播放进度 (秒)
	 */
	get currentTime() {
		return this._audioEl.currentTime;
	}

	/**
	 * 获取底层音频元素
	 * @returns {HTMLAudioElement} 底层音频元素
	 */
	get audioElement() {
		return this._audioEl;
	}

	/**
	 * 销毁播放器，恢复原始 HTML
	 */
	destroy() {
		// 销毁前触发 destroy 事件
		this._emitEvent('destroy');
		this._customEventAbortController.abort();
		this._eventAbortController.abort();
		this._e.innerHTML = this._previousHtml;
		this._e.setAttribute('style', this._previousStyle);
		this._destroyed = true;
		// 停止 observer
		this._elObserver.disconnect();
		delete bblock._currentPlayers[this.id];
	}

	/**
	 * 播放器是否已被销毁
	 * @returns {boolean} 播放器是否已被销毁
	 */
	get destroyed() {
		return this._destroyed;
	}

	/**
	 * 重新加载播放器，支持配置更新
	 * @param {Object} deltaConfig 更新的配置 kv
	 */
	reload(deltaConfig = {}) {
		this.destroy();
		this._config = { ...this._config, ...deltaConfig };
		this._init();
	}

	/**
	 * 获得播放器的唯一 ID
	 * @returns {string} 播放器的唯一 ID
	 */
	get id() {
		return this._id.toString();
	}

	/**
	 * 监听播放器事件，同一个事件名可以注册多个回调函数
	 * @param {string} eventName 事件名称
	 * @param {Function} callback 回调函数
	 */
	on(eventName, callback) {
		// 先检查是不是 audio 事件
		if (this._isAudioEvent(eventName)) {
			// 如果是 audio 事件，就直接注册到 audio 元素上，透传
			this._audioEl.addEventListener(eventName, callback, { signal: this._customEventAbortController.signal });
			return;
		}
		if (!this._listeners.has(eventName)) {
			this._listeners.set(eventName, new Set());
		}
		this._listeners.get(eventName).add(callback);
	}

	/**
	 * 取消监听播放器事件
	 * @param {string} eventName 事件名称
	 * @param {Function} callback 回调函数，必须和注册时是同一个引用
	 */
	off(eventName, callback) {
		if (this._isAudioEvent(eventName)) {
			// 如果是 audio 事件，就直接取消注册到 audio 元素上，透传
			this._audioEl.removeEventListener(eventName, callback);
			return;
		}
		if (!this._listeners.has(eventName)) return;
		this._listeners.get(eventName).delete(callback);
	}

	/**
	 * 取消监听所有播放器事件
	 */
	offAll() {
		this._customEventAbortController.abort();
		// abortController 是没法重复使用滴！
		this._customEventAbortController = new AbortController();
		this._listeners.clear();
	}

	/**
	 * 检查是不是 audio 事件
	 * @returns {boolean} 是否是 audio 事件
	 */
	_isAudioEvent(eventName) {
		const prop = 'on' + eventName.toLowerCase();
		return prop in this._audioEl;
	}

	/**
	 * 激发自定义事件
	 * @param {string} eventName 事件名称
	 * @param  {...any} args 事件参数，传递给回调方法
	 */
	_emitEvent(eventName, ...args) {
		if (!this._listeners.has(eventName)) return;
		for (const callback of this._listeners.get(eventName)) {
			try {
				callback(...args);
			} catch (e) {
				console.error(`Error in event listener for ${eventName}:`, e);
			}
		}
	}

	/**
	 * 准备展示控制面板
	 */
	_readyToShowControls() {
		if (this._dontShowControls) {
			// 如果刚点击了播放按钮，就不展示控制面板，避免刚点击播放就 mouseenter 背景了，导致控制面板不久后被展示
			this._dontShowControls = false;
			return;
		}
		if (this._controlsShowTimer !== null) {
			// 如果计时器已经存在
			clearTimeout(this._controlsShowTimer);
			this._controlsShowTimer = null;
		}
		this._controlsShowTimer = setTimeout(() => {
			this._emitEvent('controlsshow');
			this._wrapperEl.classList.add('controls-show');
			this._setControlsReturnTimer();
			this._controlsShowTimer = null;
		}, BBlockPlayer.CONTROLS_SHOW_DELAY);
	}

	/**
	 * 回撤到控制面板的上一个状态。目前有调节状态和非调节状态两种状态，位于非调节状态再回撤时，则会关闭面板。
	 *
	 * 这个主要是搭配 ControlsReturnTimer 使用的，计时器到时间后会调用这个方法来回撤控制面板的状态。
	 */
	_returnControls() {
		if (this._volumeControlling || this._progressControlling) {
			// 如果正在调节音量或进度，就结束调节状态
			this._stopControlling();
			// 再设定一次计时器，准备下一次回撤
			this._setControlsReturnTimer();
		} else {
			// 如果不在调节状态，就隐藏控制面板
			this._hideControls();
			// 这个时候鼠标还在播放内，控制面板隐藏后会再次触发 mouseenter，因此这里要阻止这次触发
			this._dontShowControls = true;
		}
	}

	/**
	 * 结束所有控制状态，恢复到非调节状态的控制面板
	 */
	_stopControlling() {
		// 根据之前的状态决定激发哪个事件
		if (this._volumeControlling) {
			this._emitEvent('volumecontrolend');
		} else if (this._progressControlling) {
			this._emitEvent('progresscontrolend');
		}
		this._volumeControlling = false;
		this._progressControlling = false;
		this._barDragging = false;
		this._volumeIconEl.classList.remove('active-icon');
		this._progressIconEl.classList.remove('active-icon');
		this._volumeIconEl.classList.remove('hidden-icon');
		this._progressIconEl.classList.remove('hidden-icon');
		// 拖拽条复位
		this._controlBarEl.style.width = '0%';
	}

	/**
	 * 隐藏控制面板
	 * 
	 * 注意：本方法在多处被调用，很多时候不是关闭面板，而是抑制面板出现。
	 * 比如在暂停后的页面就靠这个方法抑制控制面板的显示。
	 */
	_hideControls() {
		if (this._controlsShowTimer !== null) {
			clearTimeout(this._controlsShowTimer);
			this._controlsShowTimer = null;
		}
		if (this._controlsReturnTimer !== null) {
			clearTimeout(this._controlsReturnTimer);
			this._controlsReturnTimer = null;
		}
		// 激发事件（仅在控制面板被实际隐藏时激发）
		if (this._wrapperEl.classList.contains('controls-show')) {
			this._emitEvent('controlshide');
			this._wrapperEl.classList.remove('controls-show');
		}
		// 控制状态复位
		this._stopControlling();
		this._dontShowControls = false;
	}
};

const bblock = {
	/**
	 * 存放页面中现存的 BBlockPlayer 实例，key 为播放器的唯一 ID，value 为 BBlockPlayer 实例
	 * @type {Object.<string, BBlockPlayer>}
	 */
	_currentPlayers: {},
	/**
	 * 移除已经被销毁的播放器实例
	 */
	_cleanDestroyedPlayers: function () {
		for (const id in this._currentPlayers) {
			if (this._currentPlayers[id].destroyed) {
				delete this._currentPlayers[id];
			}
		}
	},
	/**
	 * 获取当前页面中所有的 BBlockPlayer 实例
	 * @returns {Array.<[string, BBlockPlayer]>} BBlockPlayer 实例数组
	 */
	get currentPlayers() {
		// 过滤掉已经被销毁的
		this._cleanDestroyedPlayers();
		return Object.entries(this._currentPlayers);
	},
	/**
	 * 根据 ID 获取当前页面中指定的 BBlockPlayer 实例
	 * @param {string} id 播放器的唯一 ID
	 * @returns {BBlockPlayer|null} BBlockPlayer 实例，如果不存在则返回 null
	 */
	get(id) {
		// 一样过滤掉已经被销毁的
		this._cleanDestroyedPlayers();
		return this._currentPlayers[id] || null;
	},
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

if (typeof window !== 'undefined') {
	window.bblock = bblock;
}

if (typeof document !== 'undefined') {
	bblock.s();
}
