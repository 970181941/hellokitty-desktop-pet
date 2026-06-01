const { KEYWORD_RULES, DEFAULT_REPLIES } = require('../utils/dialogue-data');
const { randomPick } = require('../utils/helpers');

class DialogueSystem {
  constructor(animationManager, idleBehavior, bubbleUI, memorySystem, moodSystem, affinitySystem) {
    this.animMgr = animationManager;
    this.idleBehavior = idleBehavior;
    this.bubbleUI = bubbleUI;
    this.memorySys = memorySystem;
    this.moodSys = moodSystem;
    this.affinitySys = affinitySystem;
    this.recentReplies = [];
    this.maxRecent = 5;
    this._resumeTimer = null;

    // AI 对话相关
    this.conversationHistory = [];
    this.maxHistory = 6; // 最多 6 轮对话
    this.isAIAvailable = null; // 缓存 API Key 状态
    this.fallbackCount = 0; // 连续降级计数
  }

  /**
   * 启动对话（显示输入框）
   */
  startConversation() {
    this.bubbleUI.showInput(
      '和 Kitty 说些什么...',
      (text) => this.processInput(text),
      () => {} // 取消时不做事
    );
  }

  /**
   * 处理用户输入（AI 优先，降级到关键词匹配）
   */
  async processInput(text) {
    // 检查 AI 可用性
    if (this.isAIAvailable === null) {
      this.isAIAvailable = await this._checkAIAvailable();
    }

    let reply, gifId;

    if (this.isAIAvailable) {
      // 显示思考状态
      this.idleBehavior.pause();
      this.bubbleUI.showText('Kitty 在想...', 8000);

      // 尝试 AI 对话
      const context = this._getContext();
      const result = await window.petAPI.aiChat(text, context);

      if (result && !result.error) {
        // AI 成功返回
        reply = result.text;
        gifId = result.gifId;
        this.fallbackCount = 0;

        // 更新对话历史
        this._addToHistory(text, reply);
      } else {
        // AI 失败，降级到关键词匹配
        console.log('[DialogueSystem] AI 降级:', result?.error);
        this.fallbackCount++;

        // 根据错误类型提示用户
        if (result?.error === 'invalid_key') {
          this.bubbleUI.showText('API Key 好像不对呢...', 2000);
          this.isAIAvailable = false;
        } else if (result?.error === 'timeout') {
          this.bubbleUI.showText('Kitty 想了想...', 1500);
        }

        // 连续降级 3 次提示
        if (this.fallbackCount >= 3) {
          this.bubbleUI.showText('AI 好像连不上呢，检查一下设置吧~', 3000);
          this.fallbackCount = 0;
        }

        // 降级到关键词匹配
        const fallback = this._matchRule(text);
        reply = fallback.text;
        gifId = fallback.gifId;

        // 替换模板变量
        const name = this.memorySys.getOwnerName() || '你';
        const days = this.memorySys.getDaysSinceFirstMeeting();
        const now = new Date();
        const timeStr = `${now.getHours()}点${String(now.getMinutes()).padStart(2, '0')}分`;

        reply = reply
          .replace(/\{name\}/g, name)
          .replace(/\{days\}/g, days)
          .replace(/\{time\}/g, timeStr);
      }
    } else {
      // AI 不可用，直接使用关键词匹配
      this.idleBehavior.pause();

      const result = this._matchRule(text);
      reply = result.text;
      gifId = result.gifId;

      // 替换模板变量
      const name = this.memorySys.getOwnerName() || '你';
      const days = this.memorySys.getDaysSinceFirstMeeting();
      const now = new Date();
      const timeStr = `${now.getHours()}点${String(now.getMinutes()).padStart(2, '0')}分`;

      reply = reply
        .replace(/\{name\}/g, name)
        .replace(/\{days\}/g, days)
        .replace(/\{time\}/g, timeStr);
    }

    // 显示回复
    this.bubbleUI.showText(reply, 4000);

    // 播放动画
    if (gifId) {
      await this.animMgr.play(gifId, { force: true });
    }

    // 记录最近回复
    this._addToRecent(reply);

    // 恢复闲置（清除上一次的计时器，防止快速连续对话导致提前 resume）
    if (this._resumeTimer) clearTimeout(this._resumeTimer);
    this._resumeTimer = setTimeout(() => {
      this.idleBehavior.resume();
      this._resumeTimer = null;
    }, 4500);
  }

  /**
   * 检查 AI 是否可用
   */
  async _checkAIAvailable() {
    if (!window.petAPI || !window.petAPI.aiGetKeyStatus) return false;
    try {
      return await window.petAPI.aiGetKeyStatus();
    } catch (e) {
      return false;
    }
  }

  /**
   * 构建 AI 上下文
   */
  _getContext() {
    const { MOOD_NAMES } = require('../utils/constants');
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return {
      ownerName: this.memorySys.getOwnerName() || '',
      currentTime: timeStr,
      days: this.memorySys.getDaysSinceFirstMeeting(),
      moodName: MOOD_NAMES[this.moodSys.getMoodLevel()] || '未知',
      moodLevel: this.moodSys.getMoodLevel(),
      affinityLevel: this.affinitySys.getLevelName() || '未知',
      affinityLevelNum: this.affinitySys.getLevel(),
      affinity: this.affinitySys.getAffinity(),
      history: this.conversationHistory,
    };
  }

  /**
   * 添加对话到历史
   */
  _addToHistory(userInput, assistantReply) {
    this.conversationHistory.push(
      { role: 'user', content: userInput },
      { role: 'assistant', content: assistantReply }
    );

    // 超过上限时移除最早的对话
    while (this.conversationHistory.length > this.maxHistory * 2) {
      this.conversationHistory.shift();
      this.conversationHistory.shift();
    }
  }

  /**
   * 清空对话历史
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * 刷新 AI 可用性缓存
   */
  async refreshAIStatus() {
    this.isAIAvailable = await this._checkAIAvailable();
    return this.isAIAvailable;
  }

  /**
   * 匹配关键词规则（降级方案）
   */
  _matchRule(text) {
    const lower = text.toLowerCase();

    for (const rule of KEYWORD_RULES) {
      const matched = rule.keywords.some(kw => lower.includes(kw));
      if (!matched) continue;

      // 检查是否需要主人名字
      if (rule.id === 'owner_identity' || rule.id === 'days_query') {
        if (!this.memorySys.getOwnerName() && rule.fallbackReplies) {
          return {
            text: randomPick(rule.fallbackReplies),
            gifId: rule.fallbackGifId || rule.gifId,
          };
        }
      }

      // 选一个不重复的回复
      let replies = rule.replies;
      const available = replies.filter(r => !this.recentReplies.includes(r));
      const pool = available.length > 0 ? available : replies;

      return {
        text: randomPick(pool),
        gifId: rule.gifId,
      };
    }

    // 无匹配，返回默认回复
    const defaults = DEFAULT_REPLIES.filter(d => !this.recentReplies.includes(d.text));
    const pool = defaults.length > 0 ? defaults : DEFAULT_REPLIES;
    return randomPick(pool);
  }

  _addToRecent(reply) {
    this.recentReplies.push(reply);
    if (this.recentReplies.length > this.maxRecent) {
      this.recentReplies.shift();
    }
  }
}

module.exports = DialogueSystem;
