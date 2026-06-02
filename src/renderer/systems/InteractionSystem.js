const { GIFS, ANIMATION_POOLS } = require('../utils/constants');
const { randomPick } = require('../utils/helpers');
const { SECRET_FACTS } = require('../utils/dialogue-data');

class InteractionSystem {
  constructor(animationManager, moodSystem, affinitySystem, idleBehavior, timeBehavior, extras = {}) {
    this.animMgr = animationManager;
    this.moodSys = moodSystem;
    this.affinitySys = affinitySystem;
    this.idleBehavior = idleBehavior;
    this.timeBehavior = timeBehavior;
    this.dialogueSys = extras.dialogueSystem || null;
    this.pomodoroSys = extras.pomodoroSystem || null;
    this.reminderSys = extras.reminderSystem || null;
    this.memorySys = extras.memorySystem || null;
    this.selfTalkSys = extras.selfTalkSystem || null;
    this.bubbleUI = extras.bubbleUI || null;

    this.clickTimes = [];
    this.lastClickTime = 0;
    this.isAnnoyed = false;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.windowStartX = 0;
    this.windowStartY = 0;
    this.hasMoved = false;

    this.hoverTimer = null;
    this.hideButtonsTimer = null;
    this.hideButtonsDisplayTimer = null;
    this.statusCardTimer = null;
    this.isHovering = false;

    this.onSpeech = null;
    this.saveStateCallback = null;
  }

  init() {
    const container = document.getElementById('pet-container');

    container.addEventListener('mousedown', (e) => this._onMouseDown(e));
    container.addEventListener('mousemove', (e) => this._onMouseMove(e));
    container.addEventListener('mouseup', (e) => this._onMouseUp(e));
    container.addEventListener('mouseleave', (e) => {
      this._onMouseLeave();
      this._onMouseUp(e);
    });
    container.addEventListener('contextmenu', (e) => this._onContextMenu(e));
    container.addEventListener('mouseenter', () => this._onMouseEnter());

    if (window.petAPI) {
      window.petAPI.onMenuAction((action) => this._handleMenuAction(action));
    }

    // 快捷聊天栏
    const quickInput = document.getElementById('quick-chat-input');
    const quickSend = document.getElementById('quick-chat-send');
    const quickOpen = document.getElementById('quick-chat-open');

    quickSend.addEventListener('click', (e) => {
      e.stopPropagation();
      this._onQuickChatSend(quickInput);
    });
    quickInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        this._onQuickChatSend(quickInput);
      } else if (e.key === 'Escape') {
        quickInput.value = '';
        quickInput.blur();
      }
    });
    // 阻止输入框内的鼠标事件冒泡到容器（避免拖拽）
    quickInput.addEventListener('mousedown', (e) => e.stopPropagation());
    quickInput.addEventListener('click', (e) => e.stopPropagation());

    quickOpen.addEventListener('click', (e) => {
      e.stopPropagation();
      this._hideQuickChat();
      if (window.petAPI && window.petAPI.openChatWindow) {
        window.petAPI.openChatWindow();
      } else if (this.dialogueSys) {
        this.dialogueSys.startConversation();
      }
    });

    // 状态卡片点击关闭
    document.getElementById('status-card').addEventListener('click', (e) => {
      e.stopPropagation();
      this._hideStatusCard();
    });
  }

  setSpeechCallback(cb) {
    this.onSpeech = cb;
  }

  setSaveStateCallback(cb) {
    this.saveStateCallback = cb;
  }

  // === 鼠标事件处理 ===

  async _onMouseDown(e) {
    if (e.button === 2) return;
    if (e.target.closest('#quick-chat') || e.target.closest('#status-card')) return;

    this.dragStartX = e.screenX;
    this.dragStartY = e.screenY;
    this.hasMoved = false;

    if (window.petAPI) {
      const bounds = await window.petAPI.getWindowBounds();
      if (bounds) {
        this.windowStartX = bounds.x;
        this.windowStartY = bounds.y;
      }
    }
  }

  async _onMouseMove(e) {
    if (this.dragStartX === 0 && this.dragStartY === 0) return;

    const dx = e.screenX - this.dragStartX;
    const dy = e.screenY - this.dragStartY;

    if (!this.isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      this.isDragging = true;
      this.hasMoved = true;
      this._hideQuickChat();

      if (this.timeBehavior.getIsSleeping()) {
        this.timeBehavior.wakeUp();
      }

      this.idleBehavior.pause();
      await this.animMgr.play('surprised_exclaim', { force: true });

      document.getElementById('pet-container').classList.add('dragging');
    }

    if (this.isDragging && window.petAPI) {
      const newX = this.windowStartX + dx;
      const newY = this.windowStartY + dy;
      window.petAPI.setWindowPosition(newX, newY);
    }
  }

  async _onMouseUp(e) {
    const container = document.getElementById('pet-container');
    container.classList.remove('dragging');

    if (this.isDragging) {
      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;

      await this.animMgr.play('surprised_sit', { force: true });

      if (this.saveStateCallback) {
        const bounds = await window.petAPI.getWindowBounds();
        this.saveStateCallback({ windowPosition: { x: bounds.x, y: bounds.y } });
      }

      setTimeout(() => {
        this.idleBehavior.resume();
      }, 2000);

      return;
    }

    const wasClick = this.dragStartX !== 0 || this.dragStartY !== 0;
    this.dragStartX = 0;
    this.dragStartY = 0;

    if (!wasClick || this.hasMoved) return;

    // 双击检测
    const now = Date.now();
    if (now - this.lastClickTime < 300) {
      this.lastClickTime = 0;
      await this._handleDoubleClick(e);
      return;
    }
    this.lastClickTime = now;

    await this._handleClick(e);
  }

  async _handleDoubleClick(e) {
    if (this.selfTalkSys) this.selfTalkSys.recordInteraction();

    if (this.timeBehavior.getIsSleeping()) {
      this.timeBehavior.wakeUp();
      this.moodSys.changeMood(1);
      this.moodSys.recordInteraction();
      this.idleBehavior.pause();
      await this.animMgr.play('starry_eyes', { force: true });
      if (this.onSpeech) this.onSpeech('醒来了~');
      setTimeout(() => this.idleBehavior.resume(), 4000);
      return;
    }

    if (this.dialogueSys) {
      if (window.petAPI && window.petAPI.openChatWindow) {
        window.petAPI.openChatWindow();
      } else {
        this.dialogueSys.startConversation();
      }
    }
  }

  async _handleClick(e) {
    if (this.selfTalkSys) this.selfTalkSys.recordInteraction();

    if (this.timeBehavior.getIsSleeping()) {
      this.timeBehavior.wakeUp();
      this.moodSys.changeMood(1);
      this.moodSys.recordInteraction();
      this.idleBehavior.pause();
      await this.animMgr.play('starry_eyes', { force: true });
      if (this.onSpeech) this.onSpeech('醒来了~');
      setTimeout(() => this.idleBehavior.resume(), 4000);
      return;
    }

    const now = Date.now();
    this.clickTimes.push(now);
    this.clickTimes = this.clickTimes.filter(t => now - t < 3000);

    if (this.clickTimes.length > 5) {
      if (!this.isAnnoyed) {
        this.isAnnoyed = true;
        this.idleBehavior.pause();
        await this.animMgr.play('reject_no', { force: true });
        if (this.onSpeech) this.onSpeech('别点啦！');
        setTimeout(() => {
          this.isAnnoyed = false;
          this.clickTimes = [];
          this.idleBehavior.resume();
        }, 5000);
      }
      return;
    }

    if (this.isAnnoyed) return;

    this.moodSys.changeMood(1);
    this.moodSys.recordInteraction();
    this.affinitySys.addAffinity('click');

    const container = document.getElementById('pet-container');
    const rect = container.getBoundingClientRect();
    const relY = (e.clientY - rect.top) / rect.height;

    let gifId;
    if (relY < 0.35) {
      gifId = randomPick(['happy_hug_bear', 'happy_hands_up', 'nodding']);
      if (this.onSpeech) this.onSpeech(randomPick(['嘿嘿~', '好开心！', '摸摸头~']));
    } else if (relY < 0.7) {
      gifId = randomPick(['nodding', 'ok_bear', 'happy_hug_bear']);
      if (this.onSpeech) this.onSpeech(randomPick(['嗯嗯！', '好的~', '喜欢你！']));
    } else {
      gifId = randomPick(['happy_dance', 'happy_spin', 'happy_hands_up']);
      if (this.onSpeech) this.onSpeech(randomPick(['跳舞！', '转圈圈~', '耶！']));
    }

    this.idleBehavior.pause();
    await this.animMgr.play(gifId, { force: true });
    const gifInfo = GIFS[gifId];
    setTimeout(() => {
      this.idleBehavior.resume();
    }, (gifInfo && gifInfo.duration) || 4000);
  }

  // === 右键菜单 ===

  async _onContextMenu(e) {
    e.preventDefault();

    const affinityLevel = this.affinitySys.getLevel();
    const mood = this.moodSys.getMoodLevel();
    const isSleeping = this.timeBehavior.getIsSleeping();
    const pomodoroActive = this.pomodoroSys ? this.pomodoroSys.isActive() : false;

    const menuItems = [
      { label: '💬 和 Kitty 说话', action: 'talk' },
      { type: 'separator' },
      { label: '🍰 喂食', action: 'feed' },
      { label: '🎮 玩耍', action: 'play' },
      { label: '💊 治疗', action: 'heal', enabled: mood <= 2 },
      { label: '💤 睡觉', action: 'sleep', enabled: !isSleeping },
      { type: 'separator' },
      { label: '🎤 唱歌', action: 'sing', enabled: affinityLevel >= 3 },
      { label: '⛸️ 溜冰', action: 'skate', enabled: affinityLevel >= 3 },
      { label: '🎁 送礼物', action: 'gift', enabled: affinityLevel >= 5 },
      { label: '🤗 抱抱', action: 'hug', enabled: affinityLevel >= 6 },
      { type: 'separator' },
      { label: pomodoroActive ? '⏹ 停止专注' : '🍅 开始专注', action: pomodoroActive ? 'pomodoro_stop' : 'pomodoro_start' },
      { label: '📅 设置提醒', action: 'reminder_add' },
      { type: 'separator' },
      { label: '📊 状态', action: 'status' },
      { label: '💌 秘密', action: 'secret', enabled: affinityLevel >= 8 },
      { label: '🤖 AI 设置', action: 'ai_settings' },
      { type: 'separator' },
      { label: '🚪 退出', action: 'quit' },
    ];

    if (window.petAPI) {
      window.petAPI.showContextMenu(menuItems);
    }
  }

  async _handleMenuAction(action) {
    switch (action) {
      case 'talk':
        if (window.petAPI && window.petAPI.openChatWindow) {
          window.petAPI.openChatWindow();
        } else if (this.dialogueSys) {
          this.dialogueSys.startConversation();
        }
        break;
      case 'feed':
        await this._actionFeed();
        break;
      case 'play':
        await this._actionPlay();
        break;
      case 'heal':
        await this._actionHeal();
        break;
      case 'sleep':
        this._actionSleep();
        break;
      case 'sing':
        await this._actionSing();
        break;
      case 'skate':
        await this._actionSkate();
        break;
      case 'gift':
        await this._actionGift();
        break;
      case 'hug':
        await this._actionHug();
        break;
      case 'secret':
        await this._actionSecret();
        break;
      case 'pomodoro_start':
        if (this.pomodoroSys) this.pomodoroSys.start();
        break;
      case 'pomodoro_stop':
        if (this.pomodoroSys) this.pomodoroSys.stop();
        break;
      case 'reminder_add':
        if (this.reminderSys) this.reminderSys.startAddFlow();
        break;
      case 'status':
        this._actionStatus();
        break;
      case 'ai_settings':
        await this._actionAISettings();
        break;
      case 'quit':
        if (window.petAPI) window.petAPI.quit();
        break;
    }
  }

  async _actionFeed() {
    if (this.selfTalkSys) this.selfTalkSys.recordInteraction();
    if (this.timeBehavior.getIsSleeping()) this.timeBehavior.wakeUp();
    this.moodSys.changeMood(2);
    this.moodSys.recordInteraction();
    this.affinitySys.addAffinity('feed');
    this.idleBehavior.pause();
    await this.idleBehavior.playFromPool('feed_react', { thenResume: true });
    if (this.onSpeech) this.onSpeech('好好吃！谢谢~');
    this._saveAllState();
  }

  async _actionPlay() {
    if (this.selfTalkSys) this.selfTalkSys.recordInteraction();
    if (this.timeBehavior.getIsSleeping()) this.timeBehavior.wakeUp();
    this.moodSys.changeMood(2);
    this.moodSys.recordInteraction();
    this.affinitySys.addAffinity('play');
    await this.idleBehavior.playFromPool('play_react', { thenResume: true });
    if (this.onSpeech) this.onSpeech('好好玩！');
    this._saveAllState();
  }

  async _actionHeal() {
    if (this.selfTalkSys) this.selfTalkSys.recordInteraction();
    if (this.timeBehavior.getIsSleeping()) this.timeBehavior.wakeUp();
    this.moodSys.changeMood(3);
    this.moodSys.recordInteraction();
    this.affinitySys.addAffinity('heal');
    this.idleBehavior.pause();
    await this.idleBehavior.playFromPool('heal_react', { thenResume: true });
    if (this.onSpeech) this.onSpeech('感觉好多了~');
    this._saveAllState();
  }

  _actionSleep() {
    if (this.selfTalkSys) this.selfTalkSys.recordInteraction();
    this.timeBehavior.forceSleep();
    if (this.onSpeech) this.onSpeech('晚安...');
  }

  async _actionSing() {
    if (this.selfTalkSys) this.selfTalkSys.recordInteraction();
    if (this.timeBehavior.getIsSleeping()) this.timeBehavior.wakeUp();
    this.moodSys.changeMood(1);
    this.moodSys.recordInteraction();
    await this.idleBehavior.playFromPool('sing_action', { thenResume: true });
    if (this.onSpeech) this.onSpeech('啦啦啦~');
  }

  async _actionSkate() {
    if (this.selfTalkSys) this.selfTalkSys.recordInteraction();
    if (this.timeBehavior.getIsSleeping()) this.timeBehavior.wakeUp();
    this.moodSys.changeMood(1);
    this.moodSys.recordInteraction();
    await this.idleBehavior.playFromPool('skate_action', { thenResume: true });
    if (this.onSpeech) this.onSpeech('溜冰去！');
  }

  async _actionGift() {
    if (this.selfTalkSys) this.selfTalkSys.recordInteraction();
    if (this.timeBehavior.getIsSleeping()) this.timeBehavior.wakeUp();
    this.moodSys.changeMood(1);
    this.moodSys.recordInteraction();
    this.affinitySys.addAffinity('gift');
    const gifId = randomPick(ANIMATION_POOLS.gift_react);
    this.idleBehavior.pause();
    await this.animMgr.play(gifId, { force: true });
    const gifInfo = GIFS[gifId];
    setTimeout(() => this.idleBehavior.resume(), (gifInfo && gifInfo.duration) || 4000);
    const name = this.memorySys ? this.memorySys.getOwnerName() : '';
    if (this.onSpeech) this.onSpeech(name ? `谢谢${name}的礼物！好喜欢~` : '谢谢你的礼物！好喜欢~');
    this._saveAllState();
  }

  async _actionHug() {
    if (this.selfTalkSys) this.selfTalkSys.recordInteraction();
    if (this.timeBehavior.getIsSleeping()) this.timeBehavior.wakeUp();
    this.moodSys.changeMood(2);
    this.moodSys.recordInteraction();
    this.affinitySys.addAffinity('hug');
    const gifId = randomPick(ANIMATION_POOLS.hug_react);
    this.idleBehavior.pause();
    await this.animMgr.play(gifId, { force: true });
    const gifInfo = GIFS[gifId];
    setTimeout(() => this.idleBehavior.resume(), (gifInfo && gifInfo.duration) || 4000);
    if (this.onSpeech) this.onSpeech('抱抱~ 好温暖！');
    this._saveAllState();
  }

  async _actionSecret() {
    if (this.selfTalkSys) this.selfTalkSys.recordInteraction();
    if (this.timeBehavior.getIsSleeping()) this.timeBehavior.wakeUp();
    this.moodSys.recordInteraction();
    this.affinitySys.addAffinity('secret');
    const gifId = randomPick(ANIMATION_POOLS.secret_react);
    this.idleBehavior.pause();
    await this.animMgr.play(gifId, { force: true });
    const gifInfo = GIFS[gifId];
    setTimeout(() => this.idleBehavior.resume(), (gifInfo && gifInfo.duration) || 4000);
    const fact = randomPick(SECRET_FACTS);
    if (this.onSpeech) this.onSpeech(fact, 5000);
    this._saveAllState();
  }

  _actionStatus() {
    this._showStatusCard();
  }

  async _actionAISettings() {
    if (!window.petAPI || !window.petAPI.aiGetKeyStatus) {
      if (this.onSpeech) this.onSpeech('AI 功能暂不可用~', 3000);
      return;
    }

    const hasKey = await window.petAPI.aiGetKeyStatus();

    if (hasKey) {
      if (this.onSpeech) this.onSpeech('AI 已开启~ 输入新 Key 更换，或按 Esc 取消', 4000);
    } else {
      if (this.onSpeech) this.onSpeech('输入通义千问 API Key 开启 AI 对话~', 4000);
    }

    await new Promise(r => setTimeout(r, 500));

    this.idleBehavior.pause();
    this.bubbleUI.showInput(
      '输入 API Key (sk-...)',
      async (key) => {
        if (!key || !key.trim()) {
          this.bubbleUI.showText('Key 不能为空哦~', 2000);
          this.idleBehavior.resume();
          return;
        }

        key = key.trim();

        await window.petAPI.aiSetKey(key);

        this.bubbleUI.showText('正在验证...', 5000);
        const result = await window.petAPI.aiValidateKey(key);

        if (result.valid) {
          if (this.dialogueSys) {
            await this.dialogueSys.refreshAIStatus();
            this.dialogueSys.clearHistory();
          }
          this.bubbleUI.showText('设置成功！试试和 Kitty 说话吧~', 3000);
          await this.animMgr.play('happy_hands_up', { force: true });
        } else {
          this.bubbleUI.showText('这个 Key 好像不太对呢...', 3000);
          await this.animMgr.play('nervous_cover_mouth', { force: true });
          await window.petAPI.aiSetKey('');
          if (this.dialogueSys) {
            await this.dialogueSys.refreshAIStatus();
          }
        }

        setTimeout(() => this.idleBehavior.resume(), 4000);
      },
      () => {
        this.bubbleUI.showText('好的~ 以后随时可以设置哦！', 2000);
        setTimeout(() => this.idleBehavior.resume(), 2500);
      }
    );
  }

  // === 悬浮交互 ===

  _onMouseEnter() {
    if (this.hideButtonsTimer) {
      clearTimeout(this.hideButtonsTimer);
      this.hideButtonsTimer = null;
    }
    if (this.hideButtonsDisplayTimer) {
      clearTimeout(this.hideButtonsDisplayTimer);
      this.hideButtonsDisplayTimer = null;
    }

    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => {
      if (this.isDragging) return;
      if (this.timeBehavior.getIsSleeping()) return;
      if (this.bubbleUI && this.bubbleUI.isInputActive()) return;
      if (this.pomodoroSys && this.pomodoroSys.isActive()) return;

      this.isHovering = true;
      this._showQuickChat();

      const container = document.getElementById('pet-container');
      container.classList.add('hovering');

      if (!this.idleBehavior.isPaused()) {
        const mood = this.moodSys.getMoodLevel();
        const animId = mood >= 4 ? 'shy_cover_face' : 'peeking';
        this.animMgr.play(animId);
      }
    }, 150);
  }

  _onMouseLeave() {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }

    const container = document.getElementById('pet-container');
    container.classList.remove('hovering');

    // 如果输入框正在聚焦，不隐藏快捷聊天栏
    const quickInput = document.getElementById('quick-chat-input');
    if (quickInput && document.activeElement === quickInput) {
      // 监听失焦后再隐藏
      const onBlur = () => {
        quickInput.removeEventListener('blur', onBlur);
        // 延迟隐藏，给用户重新聚焦的机会
        this.hideButtonsTimer = setTimeout(() => {
          if (document.activeElement !== quickInput) {
            this.isHovering = false;
            this._hideQuickChat();
          }
        }, 300);
      };
      quickInput.addEventListener('blur', onBlur);
      return;
    }

    this.hideButtonsTimer = setTimeout(() => {
      this.isHovering = false;
      this._hideQuickChat();
      if (this.statusCardTimer) {
        this._hideStatusCard();
      }
    }, 200);
  }

  _showQuickChat() {
    const el = document.getElementById('quick-chat');
    el.classList.add('visible');
  }

  _hideQuickChat() {
    const el = document.getElementById('quick-chat');
    el.classList.remove('visible');
    const quickInput = document.getElementById('quick-chat-input');
    if (quickInput && document.activeElement !== quickInput) {
      quickInput.value = '';
    }
  }

  _onQuickChatSend(input) {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.blur();
    this._hideQuickChat();

    const container = document.getElementById('pet-container');
    container.classList.remove('hovering');

    if (this.selfTalkSys) this.selfTalkSys.recordInteraction();

    // 通过 DialogueSystem 处理输入
    if (this.dialogueSys) {
      this.dialogueSys.processInput(text);
    } else if (this.onSpeech) {
      this.onSpeech('Kitty 听到了~', 2000);
    }
  }

  _showStatusCard() {
    const { MOOD_NAMES, AFFINITY_LEVELS } = require('../utils/constants');
    const { getFineTimePeriod, getGreetingForPeriod } = require('../utils/helpers');

    const card = document.getElementById('status-card');

    const ownerName = this.memorySys ? this.memorySys.getOwnerName() : '';
    const days = this.memorySys ? this.memorySys.getDaysSinceFirstMeeting() : 0;
    const moodLevel = this.moodSys.getMoodLevel();
    const moodName = MOOD_NAMES[moodLevel] || '未知';
    const affinityValue = this.affinitySys.getAffinity();
    const affinityLevel = this.affinitySys.getLevel();
    const affinityLevelName = this.affinitySys.getLevelName();

    const currentLevelDef = AFFINITY_LEVELS.find(l => l.level === affinityLevel);
    const nextLevelDef = AFFINITY_LEVELS.find(l => l.level === affinityLevel + 1);
    const affinityMin = currentLevelDef ? currentLevelDef.min : 0;
    const affinityMax = nextLevelDef ? nextLevelDef.min : 1000;
    const affinityProgress = ((affinityValue - affinityMin) / (affinityMax - affinityMin)) * 100;
    const moodProgress = (moodLevel / 5) * 100;

    const period = getFineTimePeriod();
    const greeting = getGreetingForPeriod(period) || '';

    card.querySelector('.owner-name').textContent = ownerName || '新朋友';
    card.querySelector('.days-badge').textContent = days > 0 ? `相识 ${days} 天` : '初次见面';
    card.querySelector('.mood-fill').style.width = `${moodProgress}%`;
    card.querySelector('.mood-value').textContent = moodName;
    card.querySelector('.affinity-fill').style.width = `${Math.min(affinityProgress, 100)}%`;
    card.querySelector('.affinity-value').textContent = affinityLevelName;
    card.querySelector('.greeting-text').textContent = greeting;

    card.classList.remove('hidden');
    card.classList.add('visible');

    this.idleBehavior.pause();

    if (this.statusCardTimer) clearTimeout(this.statusCardTimer);
    this.statusCardTimer = setTimeout(() => {
      this._hideStatusCard();
    }, 5000);
  }

  _hideStatusCard() {
    if (this.statusCardTimer) {
      clearTimeout(this.statusCardTimer);
      this.statusCardTimer = null;
    }
    const card = document.getElementById('status-card');
    card.classList.remove('visible');
    card.classList.add('hidden');
    this.idleBehavior.resume();
  }

  _saveAllState() {
    if (this.saveStateCallback) {
      const state = { ...this.affinitySys.getState() };
      if (this.memorySys) {
        Object.assign(state, this.memorySys.getState());
      }
      this.saveStateCallback(state);
    }
  }
}

module.exports = InteractionSystem;
