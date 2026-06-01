const { AFFINITY_LEVELS, AFFINITY_MAX } = require('../utils/constants');
const { getTodayStr, clamp, daysBetween } = require('../utils/helpers');

// 连续登录里程碑奖励
const STREAK_MILESTONES = {
  3: { bonus: 5, message: '连续3天来看Kitty！+5亲密度~' },
  7: { bonus: 15, message: '一周不断！Kitty好感动！+15亲密度！' },
  14: { bonus: 25, message: '两周的约定！谢谢{name}！+25亲密度~' },
  30: { bonus: 50, message: '一个月了！我们的羁绊好深！+50亲密度！' },
  60: { bonus: 80, message: '两个月坚持不断！+80亲密度！' },
  100: { bonus: 150, message: '百日之约！Kitty永远陪着你！+150亲密度！' },
};

class AffinitySystem {
  constructor() {
    this.affinity = 0;
    this.level = 1;
    this.levelName = '初遇';
    this.dailyGains = {};
    this.totalInteractions = 0;

    // 衰减相关
    this.lastInteractionDate = '';
    this.pendingRecovery = false;
    this.recoveryAbsentDays = 0;

    // 连续登录
    this.loginStreakDays = 0;
    this.lastLoginStreakCheck = '';
    this.loginStreakBonusesClaimed = [];
    this.pendingStreakMessage = null;

    // 等级变化监听
    this.levelListeners = [];
  }

  /**
   * 从持久化数据初始化
   */
  init(savedState) {
    if (savedState) {
      this.affinity = savedState.affinity || 0;
      this.dailyGains = savedState.dailyGains || {};
      this.totalInteractions = savedState.totalInteractions || 0;
      this.lastInteractionDate = savedState.lastInteractionDate || '';
      this.loginStreakDays = savedState.loginStreakDays || 0;
      this.lastLoginStreakCheck = savedState.lastLoginStreakCheck || '';
      this.loginStreakBonusesClaimed = savedState.loginStreakBonusesClaimed || [];
    }

    this._updateLevel();

    // 先检查衰减（在每日重置之前）
    this._checkDecay();

    // 再检查每日重置和连续登录
    this._checkDailyReset();
    this._checkLoginStreak();
  }

  /**
   * 获取当前亲密度值
   */
  getAffinity() {
    return this.affinity;
  }

  /**
   * 获取当前等级
   */
  getLevel() {
    return this.level;
  }

  /**
   * 获取等级名称
   */
  getLevelName() {
    return this.levelName;
  }

  /**
   * 获取等级 emoji
   */
  getLevelEmoji() {
    const levelDef = AFFINITY_LEVELS.find(l => l.level === this.level);
    return levelDef ? levelDef.emoji : '🤍';
  }

  /**
   * 是否处于回归状态
   */
  isRecovering() {
    return this.pendingRecovery;
  }

  /**
   * 获取连续登录天数
   */
  getLoginStreak() {
    return this.loginStreakDays;
  }

  /**
   * 获取待显示的连续登录消息
   */
  getPendingStreakMessage() {
    const msg = this.pendingStreakMessage;
    this.pendingStreakMessage = null;
    return msg;
  }

  /**
   * 增加亲密度
   * @param {string} type - 行为类型
   * @returns {{ gain: number, isRecovery: boolean }}
   */
  addAffinity(type) {
    const gains = {
      click: 2,
      feed: 5,
      play: 5,
      heal: 8,
      daily_open: 10,
      chat: 3,
      pomodoro: 5,
      gift: 8,
      hug: 6,
      secret: 3,
    };

    const dailyLimits = {
      click: 100,
      feed: 30,
      play: 30,
      heal: 16,
      daily_open: 10,
      chat: 30,
      pomodoro: 25,
      gift: 16,
      hug: 30,
      secret: 9,
    };

    const gain = gains[type] || 1;
    const limit = dailyLimits[type] || 50;
    const today = getTodayStr();

    if (!this.dailyGains[today]) {
      this.dailyGains[today] = {};
    }

    const todayGain = this.dailyGains[today][type] || 0;
    let actualGain = Math.min(gain, limit - todayGain);

    if (actualGain <= 0) return { gain: 0, isRecovery: false };

    // 回归加成：首次互动双倍
    let isRecovery = false;
    if (this.pendingRecovery) {
      actualGain = actualGain * 2;
      isRecovery = true;
      this.pendingRecovery = false;
    }

    this.affinity = clamp(this.affinity + actualGain, 0, AFFINITY_MAX);
    this.dailyGains[today][type] = todayGain + gain; // 记录原始值用于限制
    this.totalInteractions++;
    this.lastInteractionDate = today;
    this._updateLevel();

    return { gain: actualGain, isRecovery };
  }

  /**
   * 直接增加亲密度（用于里程碑奖励，不受每日限制）
   */
  addBonusAffinity(amount) {
    this.affinity = clamp(this.affinity + amount, 0, AFFINITY_MAX);
    this._updateLevel();
  }

  /**
   * 检查某个解锁等级是否满足
   */
  isUnlocked(requiredLevel) {
    return this.level >= requiredLevel;
  }

  /**
   * 监听等级变化
   */
  onLevelChange(callback) {
    this.levelListeners.push(callback);
  }

  /**
   * 获取用于持久化的状态
   */
  getState() {
    return {
      affinity: this.affinity,
      dailyGains: this.dailyGains,
      lastActiveDate: getTodayStr(),
      totalInteractions: this.totalInteractions,
      lastInteractionDate: this.lastInteractionDate,
      loginStreakDays: this.loginStreakDays,
      lastLoginStreakCheck: this.lastLoginStreakCheck,
      loginStreakBonusesClaimed: this.loginStreakBonusesClaimed,
    };
  }

  // === 内部方法 ===

  _updateLevel() {
    const oldLevel = this.level;
    for (const levelDef of AFFINITY_LEVELS) {
      if (this.affinity >= levelDef.min && this.affinity <= levelDef.max) {
        this.level = levelDef.level;
        this.levelName = levelDef.name;
        break;
      }
    }
    // 等级提升通知
    if (this.level > oldLevel) {
      this._notifyLevelChange(this.level, oldLevel);
    }
  }

  _notifyLevelChange(newLevel, oldLevel) {
    for (const listener of this.levelListeners) {
      try {
        listener(newLevel, oldLevel);
      } catch (e) {
        console.error('[AffinitySystem] Level change listener error:', e);
      }
    }
  }

  _checkDecay() {
    const today = getTodayStr();
    const lastDate = this.lastInteractionDate || today;

    if (!lastDate || lastDate === today) {
      this.lastInteractionDate = today;
      return;
    }

    const daysAbsent = daysBetween(lastDate, today) - 1;

    if (daysAbsent > 7) {
      const decayDays = daysAbsent - 7;
      const totalDecay = decayDays * 5;

      // 衰减地板：不低于当前等级-1的最低值
      const floorLevel = Math.max(this.level - 1, 1);
      const floorDef = AFFINITY_LEVELS.find(l => l.level === floorLevel);
      const floorValue = floorDef ? floorDef.min : 0;

      this.affinity = Math.max(this.affinity - totalDecay, floorValue);
      this.pendingRecovery = true;
      this.recoveryAbsentDays = daysAbsent;
      this._updateLevel();
    }

    this.lastInteractionDate = today;
  }

  _checkDailyReset() {
    const today = getTodayStr();
    if (this.dailyGains && Object.keys(this.dailyGains).length > 0) {
      const lastDate = Object.keys(this.dailyGains).sort().pop();
      if (lastDate !== today) {
        this.addAffinity('daily_open');
      }
    } else {
      this.addAffinity('daily_open');
    }
  }

  _checkLoginStreak() {
    const today = getTodayStr();

    if (this.lastLoginStreakCheck === today) {
      return; // 今天已经检查过
    }

    if (!this.lastLoginStreakCheck) {
      // 首次
      this.loginStreakDays = 1;
      this.lastLoginStreakCheck = today;
      return;
    }

    // 检查是否连续
    const daysSinceLastCheck = daysBetween(this.lastLoginStreakCheck, today) - 1;

    if (daysSinceLastCheck === 1) {
      // 连续登录
      this.loginStreakDays++;
    } else if (daysSinceLastCheck > 1) {
      // 断签，重置
      this.loginStreakDays = 1;
    }

    this.lastLoginStreakCheck = today;

    // 检查里程碑奖励
    this._checkMilestoneBonus();
  }

  _checkMilestoneBonus() {
    const milestones = Object.keys(STREAK_MILESTONES).map(Number).sort((a, b) => a - b);

    for (const milestone of milestones) {
      if (this.loginStreakDays >= milestone && !this.loginStreakBonusesClaimed.includes(milestone)) {
        const { bonus, message } = STREAK_MILESTONES[milestone];
        this.addBonusAffinity(bonus);
        this.loginStreakBonusesClaimed.push(milestone);
        this.pendingStreakMessage = message;
      }
    }
  }
}

module.exports = AffinitySystem;
module.exports.STREAK_MILESTONES = STREAK_MILESTONES;
