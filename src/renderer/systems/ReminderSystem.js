const { ANIMATION_POOLS, GIFS } = require('../utils/constants');

class ReminderSystem {
  constructor(memorySystem, animationManager, idleBehavior, bubbleUI) {
    this.memorySys = memorySystem;
    this.animMgr = animationManager;
    this.idleBehavior = idleBehavior;
    this.bubbleUI = bubbleUI;
    this.checkTimer = null;
    this.addingReminder = false;
    this._triggering = false;
  }

  /**
   * 启动提醒检查
   */
  start() {
    // 启动时检查生日
    if (this.memorySys.isTodayBirthday()) {
      setTimeout(() => this._celebrateBirthday(), 3000);
    }

    // 每分钟检查提醒
    this.checkTimer = setInterval(() => {
      this.checkTodayReminders();
    }, 60000);

    // 首次也检查一次
    setTimeout(() => this.checkTodayReminders(), 5000);
  }

  /**
   * 检查今天的提醒
   */
  async checkTodayReminders() {
    if (this._triggering) return; // 防止重入
    const reminders = this.memorySys.getTodayReminders();
    if (reminders.length === 0) return;

    this._triggering = true;
    for (const reminder of reminders) {
      await this._triggerReminder(reminder);
      this.memorySys.markReminderCompleted(reminder.id);
      this._saveState(); // 标记完成后立即保存
    }
    this._triggering = false;
  }

  /**
   * 开始添加提醒的流程
   */
  startAddFlow() {
    if (this.addingReminder) return;
    this.addingReminder = true;

    this.bubbleUI.showInput(
      '提醒日期 (如 12-25 或 2026-01-01)',
      (dateStr) => {
        // 验证日期格式
        if (!this._isValidDate(dateStr)) {
          this.bubbleUI.showText('日期格式不对哦~ 试试 12-25', 3000);
          this.addingReminder = false;
          return;
        }

        // 继续询问内容（保持 addingReminder = true，直到整个流程结束）
        setTimeout(() => {
          this.bubbleUI.showInput(
            '提醒内容是什么？',
            (text) => {
              this.memorySys.addReminder({ date: dateStr, text });
              this.bubbleUI.showText('记住了！到时候 Kitty 会提醒你的~', 3000);
              this.animMgr.play('nodding', { force: true });
              this.addingReminder = false;
              this._saveState();
            },
            () => { this.addingReminder = false; }
          );
        }, 500);
      },
      () => { this.addingReminder = false; }
    );
  }

  /**
   * 销毁
   */
  destroy() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  async _triggerReminder(reminder) {
    this.idleBehavior.pause();

    // 庆祝动画序列
    const celebration = ANIMATION_POOLS.celebration;
    for (const gifId of celebration) {
      await this.animMgr.play(gifId, { force: true });
      const duration = (GIFS[gifId] && GIFS[gifId].duration) || 4000;
      await new Promise(r => setTimeout(r, Math.min(duration, 3000)));
    }

    // 显示提醒内容
    this.bubbleUI.showText(`📅 ${reminder.text}`, 5000);

    setTimeout(() => this.idleBehavior.resume(), 5500);
  }

  async _celebrateBirthday() {
    this.idleBehavior.pause();
    this.bubbleUI.setBirthdayTheme(true);

    // 特殊庆祝序列
    const celebration = ANIMATION_POOLS.celebration;
    for (const gifId of celebration) {
      await this.animMgr.play(gifId, { force: true });
      const duration = (GIFS[gifId] && GIFS[gifId].duration) || 4000;
      await new Promise(r => setTimeout(r, Math.min(duration, 3000)));
    }

    const name = this.memorySys.getOwnerName() || '你';
    this.bubbleUI.showText(`🎂 ${name}生日快乐！！Kitty 祝你天天开心！`, 6000);

    // 关闭主题
    setTimeout(() => {
      this.bubbleUI.setBirthdayTheme(false);
      this.idleBehavior.resume();
    }, 7000);
  }

  _isValidDate(str) {
    // 支持 MM-DD 或 YYYY-MM-DD
    if (/^\d{2}-\d{2}$/.test(str)) {
      const [m, d] = str.split('-').map(Number);
      return m >= 1 && m <= 12 && d >= 1 && d <= 31;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return !isNaN(new Date(str).getTime());
    }
    return false;
  }

  _saveState() {
    // 通过全局 saveState 回调保存
    if (window.petAPI) {
      window.petAPI.saveState(this.memorySys.getState());
    }
  }
}

module.exports = ReminderSystem;
