const { SELF_TALK_LINES, BIRTHDAY_LINES } = require('../utils/dialogue-data');
const { randomPick, randomInt, getFineTimePeriod } = require('../utils/helpers');

class SelfTalkSystem {
  constructor(moodSystem, timeBehavior, affinitySystem, memorySystem, bubbleUI) {
    this.moodSys = moodSystem;
    this.timeBehavior = timeBehavior;
    this.affinitySys = affinitySystem;
    this.memorySys = memorySystem;
    this.bubbleUI = bubbleUI;
    this.talkTimer = null;
    this.lastTalkTime = 0;
    this.lastInteractionTime = Date.now();
    this.recentLines = [];
    this.maxRecent = 10;
    this.running = false;
    // 外部注入：检查是否可说话
    this.canTalkCheck = null;
  }

  /**
   * 启动自言自语循环
   */
  start() {
    this.running = true;
    this._scheduleNext();
  }

  /**
   * 停止
   */
  stop() {
    this.running = false;
    if (this.talkTimer) {
      clearTimeout(this.talkTimer);
      this.talkTimer = null;
    }
  }

  /**
   * 更新最后互动时间（由 InteractionSystem 调用）
   */
  recordInteraction() {
    this.lastInteractionTime = Date.now();
  }

  /**
   * 销毁
   */
  destroy() {
    this.stop();
  }

  _scheduleNext() {
    if (!this.running) return;

    const delay = randomInt(60000, 180000); // 60-180秒
    this.talkTimer = setTimeout(() => {
      if (!this.running) return;

      if (this._canTalk()) {
        this._speak();
      }

      this._scheduleNext();
    }, delay);
  }

  _canTalk() {
    // 不在睡觉
    if (this.timeBehavior.getIsSleeping()) return false;
    // 气泡不在输入模式
    if (this.bubbleUI.isInputActive()) return false;
    // 距上次说话超过30秒
    if (Date.now() - this.lastTalkTime < 30000) return false;
    // 距上次用户互动超过60秒
    if (Date.now() - this.lastInteractionTime < 60000) return false;
    // 外部检查（番茄钟等）
    if (this.canTalkCheck && !this.canTalkCheck()) return false;

    return true;
  }

  _speak() {
    const line = this._pickLine();
    if (!line) return;

    const name = this.memorySys.getOwnerName();
    const text = line.replace(/\{name\}/g, name || '你');

    this.bubbleUI.showText(text, 4000);
    this.lastTalkTime = Date.now();
    this._addToRecent(line);
  }

  _pickLine() {
    const mood = this.moodSys.getMoodLevel();
    const period = getFineTimePeriod();
    const affinityLevel = this.affinitySys.getLevel();
    const name = this.memorySys.getOwnerName();
    const days = this.memorySys.getDaysSinceFirstMeeting();

    // 检查生日
    if (this.memorySys.isTodayBirthday()) {
      const birthdayLine = randomPick(BIRTHDAY_LINES);
      return birthdayLine.replace(/\{name\}/g, name || '你');
    }

    // 检查相识里程碑
    const milestones = SELF_TALK_LINES.milestones;
    for (const [day, line] of Object.entries(milestones)) {
      if (days === parseInt(day) && !this.recentLines.includes(line)) {
        return line;
      }
    }

    // 亲密度分级台词池
    if (affinityLevel >= 8 && Math.random() < 0.15 && SELF_TALK_LINES.legend) {
      const line = this._pickFromPool(SELF_TALK_LINES.legend);
      if (line) return line;
    }
    if (affinityLevel >= 7 && Math.random() < 0.20 && SELF_TALK_LINES.soulmate) {
      const line = this._pickFromPool(SELF_TALK_LINES.soulmate);
      if (line) return line;
    }
    if (affinityLevel >= 5 && Math.random() < 0.25 && SELF_TALK_LINES.close_bond) {
      const line = this._pickFromPool(SELF_TALK_LINES.close_bond);
      if (line) return line;
    }
    if (affinityLevel >= 2 && Math.random() < 0.20 && SELF_TALK_LINES.acquaintance) {
      const line = this._pickFromPool(SELF_TALK_LINES.acquaintance);
      if (line) return line;
    }

    // 使用名字的台词 - 概率随亲密度递增
    let nameChance = 0;
    if (affinityLevel >= 8) nameChance = 0.8;
    else if (affinityLevel >= 6) nameChance = 0.6;
    else if (affinityLevel >= 4) nameChance = 0.4;

    if (nameChance > 0 && name && Math.random() < nameChance) {
      return this._pickFromPool(SELF_TALK_LINES.with_name);
    }

    // 50%概率按时段选
    if (Math.random() < 0.5) {
      const timeLines = SELF_TALK_LINES[period];
      if (timeLines && timeLines.length > 0) {
        return this._pickFromPool(timeLines);
      }
    }

    // 按心情选
    let moodPool;
    if (mood >= 4) moodPool = SELF_TALK_LINES.high_mood;
    else if (mood === 3) moodPool = SELF_TALK_LINES.normal_mood;
    else moodPool = SELF_TALK_LINES.low_mood;

    return this._pickFromPool(moodPool);
  }

  _pickFromPool(pool) {
    if (!pool || pool.length === 0) return null;
    const available = pool.filter(l => !this.recentLines.includes(l));
    const finalPool = available.length > 0 ? available : pool;
    return randomPick(finalPool);
  }

  _addToRecent(line) {
    this.recentLines.push(line);
    if (this.recentLines.length > this.maxRecent) {
      this.recentLines.shift();
    }
  }
}

module.exports = SelfTalkSystem;
