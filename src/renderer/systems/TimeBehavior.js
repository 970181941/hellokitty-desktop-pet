const { getCurrentTimePeriod, getFineTimePeriod, getGreetingForPeriod } = require('../utils/helpers');

class TimeBehavior {
  constructor(idleBehavior, moodSystem) {
    this.idleBehavior = idleBehavior;
    this.moodSys = moodSystem;
    this.currentPeriod = null;
    this.currentFinePeriod = null;
    this.isSleeping = false;
    this.checkTimer = null;
    this.onWakeUp = null;
    this.onSleep = null;
    this.onFinePeriodChange = null;
    this.onTimeAnnounce = null;
    this.reminderChecker = null;
  }

  start() {
    this.currentPeriod = getCurrentTimePeriod();
    this.currentFinePeriod = getFineTimePeriod();
    this._handlePeriodChange(this.currentPeriod);

    // 每30秒检查时段变化和整点报时
    this.checkTimer = setInterval(() => {
      // 粗粒度时段变化
      const newPeriod = getCurrentTimePeriod();
      if (newPeriod !== this.currentPeriod) {
        const oldPeriod = this.currentPeriod;
        this.currentPeriod = newPeriod;
        this._handlePeriodChange(newPeriod, oldPeriod);
      }

      // 精细时段变化
      const newFinePeriod = getFineTimePeriod();
      if (newFinePeriod !== this.currentFinePeriod) {
        this.currentFinePeriod = newFinePeriod;
        if (this.onFinePeriodChange) {
          this.onFinePeriodChange(newFinePeriod);
        }
      }

      // 整点/半点报时（30%概率）
      const now = new Date();
      const minute = now.getMinutes();
      if ((minute === 0 || minute === 30) && Math.random() < 0.3) {
        if (this.onTimeAnnounce) {
          this.onTimeAnnounce(now.getHours(), minute);
        }
      }

      // 提醒检查
      if (this.reminderChecker) {
        this.reminderChecker();
      }
    }, 30 * 1000);
  }

  getCurrentPeriod() {
    return this.currentPeriod;
  }

  getFinePeriod() {
    return this.currentFinePeriod;
  }

  getIsSleeping() {
    return this.isSleeping;
  }

  wakeUp() {
    if (this.isSleeping) {
      this.isSleeping = false;
      this._hideZzzIndicator();
      this.idleBehavior.resume();
      if (this.onWakeUp) this.onWakeUp();
    }
  }

  forceSleep() {
    if (!this.isSleeping) {
      this.isSleeping = true;
      this._enterSleep();
    }
  }

  setReminderChecker(fn) {
    this.reminderChecker = fn;
  }

  destroy() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  _handlePeriodChange(period, oldPeriod) {
    switch (period) {
      case 'morning':
        if (this.isSleeping) this.wakeUp();
        this._morningGreet();
        break;
      case 'daytime':
        if (this.isSleeping) this.wakeUp();
        break;
      case 'evening':
        if (this.isSleeping) this.wakeUp();
        break;
      case 'night':
        if (!this.isSleeping) this._enterSleepSequence();
        break;
    }
  }

  async _morningGreet() {
    this.idleBehavior.pause();
    await this.idleBehavior.playFromPool('morning_greet', { thenResume: true });
  }

  async _enterSleepSequence() {
    this.idleBehavior.pause();
    await this.idleBehavior.playAnimation('thinking', { thenResume: false });
    await this.idleBehavior.playAnimation('surprised_sit', { thenResume: false });
    this._enterSleep();
  }

  _enterSleep() {
    this.isSleeping = true;
    this._showZzzIndicator();
    this.idleBehavior.playFromPool('night_sleep', { loop: true, thenResume: false });
    if (this.onSleep) this.onSleep();
  }

  _showZzzIndicator() {
    const container = document.getElementById('pet-container');
    const existing = container.querySelector('.zzz-indicator');
    if (existing) existing.remove();
    const zzz = document.createElement('div');
    zzz.className = 'zzz-indicator';
    zzz.textContent = 'Z z z';
    container.appendChild(zzz);
  }

  _hideZzzIndicator() {
    const container = document.getElementById('pet-container');
    const zzz = container.querySelector('.zzz-indicator');
    if (zzz) zzz.remove();
  }
}

module.exports = TimeBehavior;
