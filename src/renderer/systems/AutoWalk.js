const { GIFS, WINDOW_CONFIG } = require('../utils/constants');
const { randomInt } = require('../utils/helpers');

class AutoWalk {
  constructor(animationManager, idleBehavior) {
    this.animMgr = animationManager;
    this.idleBehavior = idleBehavior;
    this.enabled = false;
    this.walking = false;
    this.direction = 1; // 1=右, -1=左
    this.walkTimer = null;
    this.pauseTimer = null;
    this.speed = 2;
    this.screenWidth = 0;
    this.screenHeight = 0;
    this.windowWidth = WINDOW_CONFIG.width;
    this.windowHeight = WINDOW_CONFIG.height;
  }

  /**
   * 初始化屏幕尺寸
   */
  async init() {
    if (window.petAPI) {
      const size = await window.petAPI.getScreenSize();
      this.screenWidth = size.width;
      this.screenHeight = size.height;
    }
  }

  /**
   * 启用自动行走
   */
  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this._startWalkCycle();
  }

  /**
   * 禁用自动行走
   */
  disable() {
    this.enabled = false;
    this.walking = false;
    if (this.walkTimer) {
      clearInterval(this.walkTimer);
      this.walkTimer = null;
    }
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
    document.getElementById('pet-container').classList.remove('walking');
  }

  /**
   * 切换开关
   */
  toggle() {
    if (this.enabled) this.disable();
    else this.enable();
    return this.enabled;
  }

  /**
   * 是否启用
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * 销毁
   */
  destroy() {
    this.disable();
  }

  async _startWalkCycle() {
    if (!this.enabled) return;

    // 行走一段随机时间
    this.walking = true;
    const container = document.getElementById('pet-container');
    container.classList.add('walking');

    // 开始移动
    this.walkTimer = setInterval(async () => {
      if (!this.enabled || !this.walking) {
        clearInterval(this.walkTimer);
        this.walkTimer = null;
        return;
      }

      await this._moveStep();
    }, 50);

    // 行走 3-8 秒后停下
    const walkDuration = randomInt(3000, 8000);
    setTimeout(() => {
      if (!this.enabled) return;
      this._pauseAndAct();
    }, walkDuration);
  }

  async _moveStep() {
    if (!window.petAPI) return;

    const bounds = await window.petAPI.getWindowBounds();
    if (!bounds) return;

    let newX = bounds.x + this.speed * this.direction;

    // 碰边检测
    if (newX <= 0) {
      newX = 0;
      this.direction = 1;
    } else if (newX >= this.screenWidth - this.windowWidth) {
      newX = this.screenWidth - this.windowWidth;
      this.direction = -1;
    }

    await window.petAPI.setWindowPosition(newX, bounds.y);
  }

  async _pauseAndAct() {
    this.walking = false;
    if (this.walkTimer) {
      clearInterval(this.walkTimer);
      this.walkTimer = null;
    }

    const container = document.getElementById('pet-container');
    container.classList.remove('walking');

    if (!this.enabled) return;

    // 停下来做一个闲置动作
    await this.idleBehavior.playFromPool(
      require('../utils/constants').MOOD_TO_POOL[this.idleBehavior.moodSys.getMoodLevel()] || 'idle_happy',
      { thenResume: false }
    );

    // 暂停 2-5 秒后继续走
    const pauseDuration = randomInt(2000, 5000);
    this.pauseTimer = setTimeout(() => {
      if (this.enabled) {
        this._startWalkCycle();
      }
    }, pauseDuration);
  }
}

module.exports = AutoWalk;
