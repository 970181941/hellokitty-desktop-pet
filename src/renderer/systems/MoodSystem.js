const { clamp } = require('../utils/helpers');

class MoodSystem {
  constructor() {
    this.mood = 4; // 默认开心
    this.lastInteractionTime = Date.now();
    this.decayTimer = null;
    this.listeners = [];
  }

  /**
   * 初始化，恢复上次心情并计算离线衰减
   */
  init(savedState) {
    if (savedState && savedState.lastMoodLevel) {
      this.mood = clamp(savedState.lastMoodLevel, 1, 5);
    }

    // 计算离线衰减
    if (savedState && savedState.lastCloseTime) {
      const elapsed = Date.now() - savedState.lastCloseTime;
      const tenMinutes = 10 * 60 * 1000;
      const decayAmount = Math.floor(elapsed / tenMinutes);
      if (decayAmount > 0) {
        this.mood = clamp(this.mood - Math.min(decayAmount, 3), 1, 5);
      }
    }

    this.lastInteractionTime = Date.now();
    this._startDecayTimer();
  }

  /**
   * 获取当前心情等级 1-5
   */
  getMoodLevel() {
    return this.mood;
  }

  /**
   * 改变心情
   * @param {number} delta - 变化量（正数提升，负数降低）
   */
  changeMood(delta) {
    const oldMood = this.mood;
    this.mood = clamp(this.mood + delta, 1, 5);
    if (this.mood !== oldMood) {
      this._notifyListeners(this.mood, oldMood);
    }
  }

  /**
   * 记录一次互动（重置衰减计时器）
   */
  recordInteraction() {
    this.lastInteractionTime = Date.now();
  }

  /**
   * 监听心情变化
   */
  onMoodChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * 销毁定时器
   */
  destroy() {
    if (this.decayTimer) {
      clearInterval(this.decayTimer);
      this.decayTimer = null;
    }
  }

  _startDecayTimer() {
    // 每 60 秒检查一次
    this.decayTimer = setInterval(() => {
      const elapsed = Date.now() - this.lastInteractionTime;
      const tenMinutes = 10 * 60 * 1000;

      if (elapsed > tenMinutes) {
        this.changeMood(-1);
        this.lastInteractionTime = Date.now(); // 重置，下次衰减重新计时
      }
    }, 60 * 1000);
  }

  _notifyListeners(newMood, oldMood) {
    for (const cb of this.listeners) {
      try {
        cb(newMood, oldMood);
      } catch (e) {
        console.error('Mood listener error:', e);
      }
    }
  }
}

module.exports = MoodSystem;
