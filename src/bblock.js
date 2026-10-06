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

	init() {
		// 检查 CSS 是否已应用
		this.checkCSS();
		this.e.innerHTML = `{{HTML}}`;
		this.wrapperEl = this.e.querySelector('.bblock-wrapper');
		this.titleEl = this.wrapperEl.querySelector('.title');
		this.artistEl = this.wrapperEl.querySelector('.artist');
		this.playEl = this.wrapperEl.querySelector('.play');
		BBlockPlayer.style(this.e, { position: 'relative', display: 'inline-block', 'float': this.config.float || 'none' });

		// 计算溢出宽度
		let [titleOvf, artistOvf] = [BBlockPlayer.overflowX(this.wrapperEl, this.titleEl), BBlockPlayer.overflowX(this.wrapperEl, this.artistEl)];
		// 如果溢出了就添加滚动效果
		if (titleOvf > 0) {
			// 这里 +5px 让视觉上更舒适一些，避免文字紧贴边缘
			this.titleEl.style.setProperty('--overflow-width', `${titleOvf + 5}px`);
			this.titleEl.classList.add('moveAni');
		}
		if (artistOvf > 0) {
			this.artistEl.style.setProperty('--overflow-width', `${artistOvf}px`);
			this.artistEl.classList.add('moveTrans');
		}
		// 注册点击事件
		this.playEl.addEventListener('click', this.play.bind(this));
	}

	/**
	 * 播放音频
	 */
	play() {
		this.wrapperEl.classList.add('state-playing');
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