const { ANIMATION_POOLS, GIFS } = require('../utils/constants');
const { formatTime, randomPick } = require('../utils/helpers');

class PomodoroSystem {
  constructor(animationManager, idleBehavior, bubbleUI) {
    this.animMgr = animationManager;
    this.idleBehavior = idleBehavior;
    this.bubbleUI = bubbleUI;

    this.state = 'idle'; // 'idle' | 'working' | 'short_break' | 'long_break'
    this.timeRemaining = 0;
    this.cycleCount = 0;
    this.timerInterval = null;
    this.animTimer = null;

    this.WORK_DURATION = 25 * 60;
    this.SHORT_BREAK = 5 * 60;
    this.LONG_BREAK = 15 * 60;

    this.onTickCallback = null;
    this.onStateChangeCallback = null;
    this.onWorkComplete = null;
  }

  isActive() {
    return this.state !== 'idle';
  }

  /**
   * 开始番茄钟
   */
  start() {
    if (this.isActive()) return;
    this.cycleCount = 0;
    this._startWork();
    this.onStateChangeCallback?.({ active: true, state: this.state, timeRemaining: this.timeRemaining });
  }

  /**
   * 停止番茄钟
   */
  stop() {
    this._clearTimers();
    this.state = 'idle';
    this.bubbleUI.showText('专注结束~ 辛苦了！', 3000);
    this.animMgr.play('nodding', { force: true });
    this.idleBehavior.resume();
    this.onStateChangeCallback?.({ active: false, state: 'idle', timeRemaining: 0 });
  }

  /**
   * 销毁
   */
  destroy() {
    this._clearTimers();
    this.state = 'idle';
  }

  _startWork() {
    this.state = 'working';
    this.timeRemaining = this.WORK_DURATION;
    this.cycleCount++;

    this.idleBehavior.pause();
    this.bubbleUI.showTimer('🍅 专注中', this.timeRemaining);
    this._startWorkAnimation();
    this._startCountdown();
  }

  _startShortBreak() {
    this.state = 'short_break';
    this.timeRemaining = this.SHORT_BREAK;

    this.bubbleUI.showTimer('☕ 休息中', this.timeRemaining);
    this._startBreakAnimation();
    this._startCountdown();

    // 显示休息提示
    setTimeout(() => {
      if (this.state === 'short_break') {
        this.bubbleUI.showText('休息时间~ 起来活动一下！', 3000);
        // 3秒后恢复显示计时器
        setTimeout(() => {
          if (this.state === 'short_break') {
            this.bubbleUI.showTimer('☕ 休息中', this.timeRemaining);
          }
        }, 3500);
      }
    }, 100);
  }

  _startLongBreak() {
    this.state = 'long_break';
    this.timeRemaining = this.LONG_BREAK;

    this.bubbleUI.showTimer('🎉 长休息', this.timeRemaining);
    this._startBreakAnimation();
    this._startCountdown();
  }

  _startCountdown() {
    // 只清除倒计时，不清除动画计时器（animTimer 由动画循环自行管理）
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      if (this.timeRemaining <= 0) {
        this._onPhaseEnd();
        return;
      }

      // 更新计时器显示
      if (this.state === 'working') {
        this.bubbleUI.showTimer('🍅 专注中', this.timeRemaining);
      } else if (this.state === 'short_break') {
        this.bubbleUI.showTimer('☕ 休息中', this.timeRemaining);
      } else if (this.state === 'long_break') {
        this.bubbleUI.showTimer('🎉 长休息', this.timeRemaining);
      }

      this.onTickCallback?.({ state: this.state, timeRemaining: this.timeRemaining });
    }, 1000);
  }

  _onPhaseEnd() {
    this._clearTimers();

    if (this.state === 'working') {
      // 工作阶段完成，触发亲密度奖励
      this.onWorkComplete?.();
      if (this.cycleCount % 4 === 0) {
        this._startLongBreak();
      } else {
        this._startShortBreak();
      }
    } else {
      this._startWork();
    }

    this.onStateChangeCallback?.({ active: true, state: this.state, timeRemaining: this.timeRemaining });
  }

  _startWorkAnimation() {
    // 循环播放安静动画
    const playNext = async () => {
      if (this.state !== 'working') return;
      const gifId = randomPick(ANIMATION_POOLS.pomodoro_work);
      await this.animMgr.play(gifId, { force: true });
      const duration = (GIFS[gifId] && GIFS[gifId].duration) || 5000;
      this.animTimer = setTimeout(playNext, duration);
    };
    playNext();
  }

  _startBreakAnimation() {
    const playNext = async () => {
      if (this.state !== 'short_break' && this.state !== 'long_break') return;
      const gifId = randomPick(ANIMATION_POOLS.pomodoro_break);
      await this.animMgr.play(gifId, { force: true });
      const duration = (GIFS[gifId] && GIFS[gifId].duration) || 5000;
      this.animTimer = setTimeout(playNext, duration);
    };
    playNext();
  }

  _clearTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.animTimer) {
      clearTimeout(this.animTimer);
      this.animTimer = null;
    }
  }
}

module.exports = PomodoroSystem;
