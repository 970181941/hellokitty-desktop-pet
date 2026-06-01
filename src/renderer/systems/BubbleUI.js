class BubbleUI {
  constructor() {
    this.container = document.getElementById('bubble-container');
    this.content = document.getElementById('bubble-content');
    this.inputWrap = document.getElementById('bubble-input-wrap');
    this.input = document.getElementById('bubble-input');
    this.timer = document.getElementById('bubble-timer');
    this.hideTimer = null;
    this.currentMode = 'hidden'; // 'hidden' | 'text' | 'input' | 'timer'
    this._onSubmit = null;
    this._onCancel = null;
    this._blurTimeout = null;
  }

  /**
   * 显示文本气泡
   */
  showText(text, duration = 3000) {
    this._clearHideTimer();
    this._switchTo('text');

    this.content.textContent = text;
    // 长文本自动缩小
    if (text.length > 20) {
      this.content.classList.add('small-text');
    } else {
      this.content.classList.remove('small-text');
    }

    if (duration > 0) {
      this.hideTimer = setTimeout(() => this.hide(), duration);
    }
  }

  /**
   * 显示输入框
   */
  showInput(placeholder = '和 Kitty 说些什么...', onSubmit, onCancel) {
    this._clearHideTimer();
    this._switchTo('input');

    this.input.placeholder = placeholder;
    this.input.value = '';
    this._onSubmit = onSubmit;
    this._onCancel = onCancel;

    // 弹入动画
    this.container.classList.add('pop-in');
    setTimeout(() => this.container.classList.remove('pop-in'), 300);

    // 聚焦
    setTimeout(() => this.input.focus(), 100);

    // 事件绑定
    this.input.onkeydown = (e) => {
      if (e.key === 'Enter' && this.input.value.trim()) {
        const value = this.input.value.trim();
        this._switchTo('hidden');
        if (this._onSubmit) this._onSubmit(value);
      } else if (e.key === 'Escape') {
        this._switchTo('hidden');
        if (this._onCancel) this._onCancel();
      }
    };

    this.input.onblur = () => {
      this._blurTimeout = setTimeout(() => {
        if (this.currentMode === 'input') {
          this._switchTo('hidden');
          if (this._onCancel) this._onCancel();
        }
      }, 200);
    };

    this.input.onfocus = () => {
      if (this._blurTimeout) {
        clearTimeout(this._blurTimeout);
        this._blurTimeout = null;
      }
    };
  }

  /**
   * 显示计时器
   */
  showTimer(label, timeRemaining) {
    if (this.currentMode === 'input') return; // 输入模式优先级更高

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (this.currentMode !== 'timer') {
      this._switchTo('timer');
    }

    this.timer.innerHTML = `<span class="timer-label">${label}</span><span class="timer-value">${timeStr}</span>`;
  }

  /**
   * 隐藏气泡
   */
  hide() {
    this._clearHideTimer();
    this._switchTo('hidden');
  }

  /**
   * 是否在输入模式
   */
  isInputActive() {
    return this.currentMode === 'input';
  }

  /**
   * 设置生日主题
   */
  setBirthdayTheme(enabled) {
    if (enabled) {
      this.container.classList.add('birthday-theme');
    } else {
      this.container.classList.remove('birthday-theme');
    }
  }

  _switchTo(mode) {
    this.currentMode = mode;

    // 隐藏所有子层
    this.content.style.display = 'none';
    this.inputWrap.classList.add('hidden');
    this.timer.classList.add('hidden');

    switch (mode) {
      case 'text':
        this.container.classList.remove('hidden');
        this.content.style.display = 'block';
        break;
      case 'input':
        this.container.classList.remove('hidden');
        this.inputWrap.classList.remove('hidden');
        break;
      case 'timer':
        this.container.classList.remove('hidden');
        this.timer.classList.remove('hidden');
        break;
      case 'hidden':
      default:
        this.container.classList.add('hidden');
        this.content.style.display = 'none';
        break;
    }
  }

  _clearHideTimer() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}

module.exports = BubbleUI;
