const { ANIMATION_POOLS, GIFS } = require('../utils/constants');

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

class WeeklyScheduleSystem {
  constructor(bubbleUI, animMgr, idleBehavior) {
    this.bubbleUI = bubbleUI;
    this.animMgr = animMgr;
    this.idleBehavior = idleBehavior;
    this.schedule = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
    this.checkTimer = null;
    this.lastFiredIds = new Set();
    this._lastDate = '';
    this._triggering = false;
  }

  init(savedState) {
    if (savedState && savedState.weeklySchedule) {
      this.schedule = Object.assign(
        { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
        savedState.weeklySchedule
      );
    }
    // 恢复已触发的 ID（仅当天有效）
    const todayStr = this._todayStr();
    if (savedState && savedState.lastScheduleNotified &&
        savedState.lastScheduleNotified.date === todayStr) {
      this.lastFiredIds = new Set(savedState.lastScheduleNotified.firedIds || []);
      this._lastDate = todayStr;
    } else {
      this.lastFiredIds = new Set();
      this._lastDate = todayStr;
    }
  }

  start() {
    this.checkTimer = setInterval(() => {
      this.checkSchedule();
    }, 30000);
    setTimeout(() => this.checkSchedule(), 5000);
  }

  checkSchedule() {
    if (this._triggering) return;

    const todayStr = this._todayStr();
    if (todayStr !== this._lastDate) {
      this.lastFiredIds = new Set();
      this._lastDate = todayStr;
    }

    const now = new Date();
    const dayKey = DAY_KEYS[now.getDay()];
    const events = this.schedule[dayKey];
    if (!events || events.length === 0) return;

    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const toFire = events.filter(e =>
      e.enabled !== false && e.time === currentHHMM && !this.lastFiredIds.has(e.id)
    );

    if (toFire.length > 0) {
      this._triggering = true;
      (async () => {
        for (const event of toFire) {
          await this._triggerEvent(event);
        }
        this._triggering = false;
      })();
    }
  }

  async _triggerEvent(event) {
    this.lastFiredIds.add(event.id);

    // 通过主进程发送系统通知 + 转发到聊天窗口
    if (window.petAPI && window.petAPI.scheduleNotify) {
      window.petAPI.scheduleNotify({ id: event.id, time: event.time, text: event.text });
    }

    // Kitty 气泡显示
    this.idleBehavior.pause();
    const celebration = ANIMATION_POOLS.celebration;
    if (celebration && celebration.length > 0) {
      for (const gifId of celebration) {
        await this.animMgr.play(gifId, { force: true });
        const duration = (GIFS[gifId] && GIFS[gifId].duration) || 4000;
        await new Promise(r => setTimeout(r, Math.min(duration, 2000)));
      }
    }
    this.bubbleUI.showText(`📅 ${event.text}`, 5000);
    setTimeout(() => this.idleBehavior.resume(), 5500);

    this._saveState();
  }

  getSchedule() {
    return this.schedule;
  }

  setSchedule(newSchedule) {
    this.schedule = Object.assign(
      { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
      newSchedule
    );
    this._saveState();
  }

  getState() {
    return {
      weeklySchedule: this.schedule,
      lastScheduleNotified: {
        date: this._lastDate,
        firedIds: [...this.lastFiredIds],
      },
    };
  }

  destroy() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  _todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  _saveState() {
    if (window.petAPI) {
      window.petAPI.saveState(this.getState());
    }
  }
}

module.exports = WeeklyScheduleSystem;
