const { ANIMATION_POOLS, MOOD_TO_POOL, GIFS } = require('../utils/constants');
const { randomPick, weightedRandomPick, randomInt } = require('../utils/helpers');

class IdleBehavior {
  constructor(animationManager, moodSystem, affinitySystem) {
    this.animMgr = animationManager;
    this.moodSys = moodSystem;
    this.affinitySys = affinitySystem;
    this.idleTimer = null;
    this.isIdle = true;
    this.recentPlayed = [];
    this.maxRecent = 3;
    this.paused = false;
    this.lastActivityTime = Date.now();
  }

  /**
   * 启动闲置行为循环
   */
  async start() {
    this.isIdle = true;
    // 默认播放比心动画
    await this.animMgr.play('heart_gesture', { force: true });
    this._scheduleNext();
  }

  /**
   * 暂停闲置行为（播放特定动画时）
   */
  pause() {
    this.paused = true;
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * 恢复闲置行为
   */
  async resume() {
    this.paused = false;
    this.isIdle = true;
    // 恢复时回到默认比心动画
    await this.animMgr.play('heart_gesture', { force: true });
    this._scheduleNext();
  }

  /**
   * 播放指定池中的动画（非闲置模式）
   * @param {string} poolName - 动画池名称
   * @param {object} options - { loop: false, thenResume: true }
   */
  async playFromPool(poolName, options = {}) {
    this.pause();

    const pool = ANIMATION_POOLS[poolName];
    if (!pool || pool.length === 0) {
      this.resume();
      return;
    }

    const filtered = this._filterByAffinity(pool);
    const gifId = randomPick(filtered.length > 0 ? filtered : pool);

    if (!gifId) {
      this.resume();
      return;
    }

    const gifInfo = GIFS[gifId];
    await this.animMgr.play(gifId, { force: true });

    if (options.thenResume !== false) {
      const duration = (gifInfo && gifInfo.duration) || 5000;
      setTimeout(() => {
        if (!options.loop) {
          this.resume();
        } else {
          this.playFromPool(poolName, options);
        }
      }, duration);
    }
  }

  /**
   * 播放单个指定动画
   */
  async playAnimation(gifId, options = {}) {
    this.pause();
    const gifInfo = GIFS[gifId];
    await this.animMgr.play(gifId, { force: true });

    if (options.thenResume !== false) {
      const duration = (gifInfo && gifInfo.duration) || 5000;
      setTimeout(() => {
        this.resume();
      }, duration);
    }
  }

  /**
   * 是否暂停中
   */
  isPaused() {
    return this.paused;
  }

  /**
   * 获取上次活动时间
   */
  getLastActivityTime() {
    return this.lastActivityTime;
  }

  /**
   * 销毁定时器
   */
  destroy() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * 内部方法：调度下一个闲置动画
   * 间隔较长（2-5分钟），避免频繁切换，保持默认跳舞动画
   */
  _scheduleNext() {
    if (this.paused) return;

    // 较长的切换间隔，让跳舞动画持续展示
    const minDelay = 120000; // 2分钟
    const maxDelay = 300000; // 5分钟

    const delay = randomInt(minDelay, maxDelay);

    this.idleTimer = setTimeout(() => {
      if (this.paused) return;
      this._playIdleAnimation();
    }, delay);
  }

  /**
   * 选择并播放一个闲置动画
   */
  async _playIdleAnimation() {
    if (this.paused) return;

    const mood = this.moodSys.getMoodLevel();
    const poolName = MOOD_TO_POOL[mood];
    const pool = ANIMATION_POOLS[poolName];

    if (!pool || pool.length === 0) {
      this._scheduleNext();
      return;
    }

    // 亲密度过滤
    const filtered = this._filterByAffinity(pool);

    // 排除最近播放的
    const candidates = (filtered.length > 0 ? filtered : pool).filter(
      id => !this.recentPlayed.includes(id)
    );

    const finalPool = candidates.length > 0 ? candidates : (filtered.length > 0 ? filtered : pool);

    // 彩蛋检测
    const easterEggChance = 0.05 + this.affinitySys.getLevel() * 0.04;
    if (Math.random() < easterEggChance) {
      const easterPool = this._filterByAffinity(ANIMATION_POOLS.easter_eggs);
      if (easterPool.length > 0) {
        const eggGif = randomPick(easterPool);
        if (eggGif) {
          this._addToRecent(eggGif);
          await this.animMgr.play(eggGif, { force: true });
          const gifInfo = GIFS[eggGif];
          const duration = (gifInfo && gifInfo.duration) || 5000;
          setTimeout(() => this._scheduleNext(), duration);
          return;
        }
      }
    }

    // 加权随机选取
    const itemsWithPriority = finalPool.map(id => ({
      id,
      priority: (GIFS[id] && GIFS[id].priority) || 1,
    }));

    const selected = weightedRandomPick(itemsWithPriority);
    if (!selected) {
      this._scheduleNext();
      return;
    }

    this._addToRecent(selected.id);
    await this.animMgr.play(selected.id, { force: true });
    this.lastActivityTime = Date.now();

    this._scheduleNext();
  }

  _filterByAffinity(pool) {
    return pool.filter(id => {
      const gifInfo = GIFS[id];
      if (!gifInfo || !gifInfo.tags) return true;
      for (const tag of gifInfo.tags) {
        const match = tag.match(/^unlock(\d+)$/);
        if (match && !this.affinitySys.isUnlocked(parseInt(match[1]))) return false;
      }
      return true;
    });
  }

  _addToRecent(gifId) {
    this.recentPlayed.push(gifId);
    if (this.recentPlayed.length > this.maxRecent) {
      this.recentPlayed.shift();
    }
  }
}

module.exports = IdleBehavior;
