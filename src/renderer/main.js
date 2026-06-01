const AnimationManager = require('./systems/AnimationManager');
const MoodSystem = require('./systems/MoodSystem');
const AffinitySystem = require('./systems/AffinitySystem');
const IdleBehavior = require('./systems/IdleBehavior');
const TimeBehavior = require('./systems/TimeBehavior');
const InteractionSystem = require('./systems/InteractionSystem');
const AutoWalk = require('./systems/AutoWalk');
const BubbleUI = require('./systems/BubbleUI');
const MemorySystem = require('./systems/MemorySystem');
const DialogueSystem = require('./systems/DialogueSystem');
const SelfTalkSystem = require('./systems/SelfTalkSystem');
const PomodoroSystem = require('./systems/PomodoroSystem');
const ReminderSystem = require('./systems/ReminderSystem');
const WeeklyScheduleSystem = require('./systems/WeeklyScheduleSystem');
const { ANIMATION_POOLS, MOOD_TO_POOL, GIFS, AFFINITY_LEVELS } = require('./utils/constants');
const { getCurrentTimePeriod, getFineTimePeriod, getGreetingForPeriod, randomPick } = require('./utils/helpers');
const { LEVEL_UP_MESSAGES, RETURN_MESSAGES } = require('./utils/dialogue-data');

// === 全局实例 ===
let animMgr, moodSys, affinitySys, idleBehavior, timeBehavior, interactionSys, autoWalk;
let bubbleUI, memorySys, dialogueSys, selfTalkSys, pomodoroSys, reminderSys, weeklyScheduleSys;

// === 状态保存 ===
async function saveState(data) {
  if (window.petAPI) {
    await window.petAPI.saveState(data);
  }
}

// === 全量保存 ===
function saveAllState() {
  saveState({
    ...affinitySys.getState(),
    ...memorySys.getState(),
    ...weeklyScheduleSys.getState(),
    lastMoodLevel: moodSys.getMoodLevel(),
    autoWalkEnabled: autoWalk.isEnabled(),
  });
}

// === 首次引导流程 ===
async function runOnboarding() {
  // 播放心动动画
  await animMgr.play('starry_eyes', { force: true });
  bubbleUI.showText('你好呀！我是 Kitty~', 3000);

  await new Promise(r => setTimeout(r, 3500));

  bubbleUI.showText('你叫什么名字？', 8000);

  await new Promise(r => setTimeout(r, 1000));

  // 弹出输入框
  await new Promise((resolve) => {
    bubbleUI.showInput(
      '输入你的名字...',
      async (name) => {
        if (name && name.trim()) {
          memorySys.setOwnerName(name.trim());
          await animMgr.play('heart_gesture', { force: true });
          bubbleUI.showText(`${name.trim()}~ 好名字！以后我们就是朋友啦！`, 4000);

          await new Promise(r => setTimeout(r, 4500));

          // 询问生日
          bubbleUI.showText('你的生日是几月几号呀？', 5000);
          await new Promise(r => setTimeout(r, 1000));

          bubbleUI.showInput(
            '格式: MM-DD (如 12-25)，也可以跳过',
            async (birthday) => {
              if (birthday && /^\d{2}-\d{2}$/.test(birthday.trim())) {
                memorySys.setOwnerBirthday(birthday.trim());
                await animMgr.play('happy_hands_up', { force: true });
                bubbleUI.showText('记住了！到时候 Kitty 给你庆祝~', 3000);
              }
              saveAllState();
              resolve();
            },
            () => {
              saveAllState();
              resolve();
            }
          );
        } else {
          resolve();
        }
      },
      () => {
        resolve();
      }
    );
  });
}

// === 初始化 ===
async function init() {
  // 1. 加载持久化状态
  let savedState = {};
  if (window.petAPI) {
    savedState = await window.petAPI.loadState() || {};
  }

  // 2. 初始化核心系统
  animMgr = new AnimationManager();
  moodSys = new MoodSystem();
  affinitySys = new AffinitySystem();
  bubbleUI = new BubbleUI();
  memorySys = new MemorySystem();

  moodSys.init(savedState);
  affinitySys.init(savedState);
  memorySys.init(savedState);

  idleBehavior = new IdleBehavior(animMgr, moodSys, affinitySys);
  timeBehavior = new TimeBehavior(idleBehavior, moodSys);

  // 3. 初始化新系统
  dialogueSys = new DialogueSystem(animMgr, idleBehavior, bubbleUI, memorySys, moodSys, affinitySys);
  selfTalkSys = new SelfTalkSystem(moodSys, timeBehavior, affinitySys, memorySys, bubbleUI);
  pomodoroSys = new PomodoroSystem(animMgr, idleBehavior, bubbleUI);
  reminderSys = new ReminderSystem(memorySys, animMgr, idleBehavior, bubbleUI);
  weeklyScheduleSys = new WeeklyScheduleSystem(bubbleUI, animMgr, idleBehavior);
  weeklyScheduleSys.init(savedState);

  // 4. 初始化交互系统（传入所有新系统）
  interactionSys = new InteractionSystem(animMgr, moodSys, affinitySys, idleBehavior, timeBehavior, {
    dialogueSystem: dialogueSys,
    pomodoroSystem: pomodoroSys,
    reminderSystem: reminderSys,
    memorySystem: memorySys,
    selfTalkSystem: selfTalkSys,
    bubbleUI: bubbleUI,
  });

  autoWalk = new AutoWalk(animMgr, idleBehavior);

  // 5. 预加载 GIF
  const currentPool = MOOD_TO_POOL[moodSys.getMoodLevel()];
  animMgr.preload(ANIMATION_POOLS[currentPool] || []);
  animMgr.preload(['surprised_exclaim', 'surprised_sit', 'reject_no', 'starry_eyes', 'sleeping', 'heart_gesture']);

  // 6. 设置回调
  interactionSys.setSpeechCallback((text, duration) => bubbleUI.showText(text, duration));
  interactionSys.setSaveStateCallback((extraData) => {
    saveState({
      ...affinitySys.getState(),
      ...memorySys.getState(),
      ...weeklyScheduleSys.getState(),
      lastMoodLevel: moodSys.getMoodLevel(),
      autoWalkEnabled: autoWalk.isEnabled(),
      ...(extraData || {}),
    });
  });

  // 7. 时段行为回调
  timeBehavior.onWakeUp = () => {
    const name = memorySys.getOwnerName();
    bubbleUI.showText(`醒来了~ ${name ? name + '，' : ''}早上好！`);
    setTimeout(async () => {
      await animMgr.play('starry_eyes', { force: true });
      setTimeout(() => idleBehavior.resume(), 4000);
    }, 500);
  };

  timeBehavior.onSleep = () => {
    bubbleUI.showText('晚安...zzZ', 5000);
  };

  // 精细时段变化问候
  timeBehavior.onFinePeriodChange = (finePeriod) => {
    if (selfTalkSys) {
      const greeting = getGreetingForPeriod(finePeriod);
      if (greeting) {
        const name = memorySys.getOwnerName();
        const text = name ? `${name}，${greeting}` : greeting;
        // 延迟一点再问候，避免和其他气泡冲突
        setTimeout(() => {
          if (!bubbleUI.isInputActive()) {
            bubbleUI.showText(text, 3000);
          }
        }, 2000);
      }
    }
  };

  // 整点/半点报时
  timeBehavior.onTimeAnnounce = (hour, minute) => {
    if (bubbleUI.isInputActive() || pomodoroSys.isActive()) return;
    const name = memorySys.getOwnerName();
    const minuteStr = minute === 0 ? '整' : '半';
    const text = name
      ? `${name}，现在${hour}点${minuteStr}了~`
      : `现在${hour}点${minuteStr}~`;
    bubbleUI.showText(text, 3000);
  };

  // 提醒检查
  timeBehavior.setReminderChecker(() => {
    reminderSys.checkTodayReminders();
  });

  // 自言自语：番茄钟进行中时不说话
  selfTalkSys.canTalkCheck = () => !pomodoroSys.isActive();

  // 8. 心情变化监听
  moodSys.onMoodChange((newMood) => {
    const newPool = MOOD_TO_POOL[newMood];
    if (newPool) animMgr.preload(ANIMATION_POOLS[newPool] || []);
    saveState({ lastMoodLevel: newMood });
  });

  // 9. 初始化互动系统
  interactionSys.init();

  // 10. 初始化自动行走
  await autoWalk.init();
  if (savedState.autoWalkEnabled) autoWalk.enable();

  // 11. 启动时段检测
  timeBehavior.start();

  // 12. 启动提醒系统
  reminderSys.start();
  weeklyScheduleSys.start();

  // 13. 首次引导 or 正常启动
  if (memorySys.isFirstRun()) {
    await runOnboarding();
    // 启动闲置
    idleBehavior.start();
  } else {
    // 根据时段启动
    const period = getCurrentTimePeriod();
    if (period === 'night') {
      await idleBehavior.playAnimation('thinking', { thenResume: false });
      await idleBehavior.playAnimation('surprised_sit', { thenResume: false });
      timeBehavior.forceSleep();
    } else if (period === 'morning') {
      const name = memorySys.getOwnerName();
      bubbleUI.showText(`${name ? name + '，' : ''}早上好呀！`, 4000);
      await idleBehavior.playFromPool('morning_greet', { thenResume: false });
      setTimeout(() => idleBehavior.start(), 5000);
    } else {
      idleBehavior.start();
    }
  }

  // 14. 启动自言自语
  selfTalkSys.start();

  // 14.5 回归消息 & 连续登录奖励
  if (affinitySys.isRecovering() && !memorySys.isFirstRun()) {
    setTimeout(async () => {
      const name = memorySys.getOwnerName() || '你';
      const msg = randomPick(RETURN_MESSAGES).replace(/\{name\}/g, name);
      bubbleUI.showText(msg, 5000);
      await animMgr.play('starry_eyes', { force: true });
      setTimeout(() => idleBehavior.resume(), 4000);
    }, 3000);
  }

  const streakMsg = affinitySys.getPendingStreakMessage();
  if (streakMsg && !memorySys.isFirstRun()) {
    const name = memorySys.getOwnerName() || '你';
    setTimeout(() => {
      bubbleUI.showText(streakMsg.replace(/\{name\}/g, name), 4000);
    }, affinitySys.isRecovering() ? 8000 : 2000);
  }

  // 15. 定期保存
  setInterval(saveAllState, 30000);

  // 16. 退出前保存
  window.addEventListener('beforeunload', saveAllState);

  // 17. 聊天窗口 IPC 监听
  if (window.petAPI) {
    // 聊天窗口播放 GIF
    window.petAPI.onPlayGif(async (gifId) => {
      idleBehavior.pause();
      await animMgr.play(gifId, { force: true });
      const gifInfo = GIFS[gifId];
      setTimeout(() => idleBehavior.resume(), (gifInfo && gifInfo.duration) || 4000);
    });

    // 响应聊天窗口的 context 请求
    window.petAPI.onRequestContext(() => {
      return dialogueSys._getContext();
    });

    // 同步聊天窗口的对话历史
    window.petAPI.onSyncHistory((data) => {
      dialogueSys._addToHistory(data.userInput, data.assistantReply);
      // 聊天互动增加亲密度（信赖等级以上）
      if (affinitySys.getLevel() >= 4) {
        affinitySys.addAffinity('chat');
      }
    });

    // 聊天窗口动作执行
    window.petAPI.onChatAction(async (action) => {
      // 特殊处理番茄钟：切换开始/停止
      if (action === 'pomodoro') {
        if (pomodoroSys.isActive()) {
          pomodoroSys.stop();
          window.petAPI.pushActionResult({ type: 'info', text: '专注已停止~ 辛苦了！' });
        } else {
          pomodoroSys.start();
          window.petAPI.pushActionResult({ type: 'info', text: '专注开始！加油~' });
        }
        return;
      }

      // 提醒：通过聊天窗口的面板处理，不直接调用 startAddFlow
      if (action === 'reminder') {
        return;
      }

      // 周日程：通过聊天窗口的面板处理
      if (action === 'schedule') {
        return;
      }

      // 状态查询：现在通过面板展示，不在此处理
      if (action === 'status') {
        return;
      }

      // 其他动作：通过 InteractionSystem 处理
      await interactionSys._handleMenuAction(action);

      // 返回动作反馈
      const actionMessages = {
        feed: 'Kitty 吃了好吃的~ 谢谢！',
        play: '好好玩！开心~',
        heal: '感觉好多了~',
        sleep: '晚安...zzZ',
        sing: '啦啦啦~ 好开心！',
        skate: '溜冰去！耶~',
        gift: '谢谢你的礼物！好喜欢~',
        hug: '抱抱~ 好温暖！',
        secret: 'Kitty 告诉你一个小秘密...',
      };
      const msg = actionMessages[action];
      if (msg) {
        window.petAPI.pushActionResult({ type: 'success', text: msg });
      }
    });

    // 番茄钟状态查询
    window.petAPI.onGetPomodoroStatus(() => {
      return {
        active: pomodoroSys.isActive(),
        state: pomodoroSys.state,
        timeRemaining: pomodoroSys.timeRemaining,
      };
    });

    // 提醒添加
    window.petAPI.onChatAddReminder((data) => {
      if (memorySys.addReminder) {
        memorySys.addReminder({ date: data.date, text: data.text });
        saveAllState();
        window.petAPI.pushActionResult({ type: 'success', text: `提醒已设置: ${data.date} ${data.text}` });
      }
    });

    // 主人信息更新（从聊天窗口设置面板修改）
    window.petAPI.onOwnerInfoUpdated((data) => {
      if (data.name !== undefined) memorySys.setOwnerName(data.name);
      if (data.birthday !== undefined) memorySys.setOwnerBirthday(data.birthday);
      saveAllState();
    });

    // 周日程：接收主进程转发的日程触发（播放动画 + 气泡）
    window.petAPI.onScheduleTrigger(async (data) => {
      // 动画和气泡已在 WeeklyScheduleSystem._triggerEvent 中处理
      // 这里仅做额外日志（可选）
      console.log('日程触发:', data.time, data.text);
    });

    // 番茄钟倒计时推送
    pomodoroSys.onTickCallback = (data) => {
      if (window.petAPI.pushPomodoroTick) {
        window.petAPI.pushPomodoroTick(data);
      }
    };

    pomodoroSys.onStateChangeCallback = (data) => {
      if (window.petAPI.pushPomodoroTick) {
        window.petAPI.pushPomodoroTick(data);
      }
    };

    // 番茄钟工作阶段完成 → 亲密度奖励
    pomodoroSys.onWorkComplete = () => {
      affinitySys.addAffinity('pomodoro');
    };

    // 状态推送函数
    const pushStatusToChat = () => {
      const { MOOD_NAMES, AFFINITY_LEVELS } = require('./utils/constants');
      if (window.petAPI.pushStatusUpdate) {
        const currentLevel = affinitySys.getLevel();
        const levelDef = AFFINITY_LEVELS.find(l => l.level === currentLevel);
        const nextLevelDef = AFFINITY_LEVELS.find(l => l.level === currentLevel + 1);
        const days = memorySys.getDaysSinceFirstMeeting();
        window.petAPI.pushStatusUpdate({
          moodLevel: moodSys.getMoodLevel(),
          moodName: MOOD_NAMES[moodSys.getMoodLevel()] || '未知',
          affinityLevelNum: currentLevel,
          affinityLevelName: affinitySys.getLevelName(),
          affinity: affinitySys.getAffinity(),
          days: days,
          ownerName: memorySys.getOwnerName() || '新朋友',
          loginStreakDays: affinitySys.getLoginStreak(),
          greeting: days > 0 ? `相识 ${days} 天` : '初次见面',
          nextLevelMin: levelDef ? levelDef.min : 0,
          nextLevelMax: nextLevelDef ? nextLevelDef.min : (levelDef ? levelDef.max : 2500),
        });
      }
    };

    // 心情变化时推送状态到聊天窗口
    moodSys.onMoodChange(() => {
      pushStatusToChat();
    });

    // 亲密度等级提升庆祝
    affinitySys.onLevelChange(async (newLevel, oldLevel) => {
      const levelDef = AFFINITY_LEVELS.find(l => l.level === newLevel);
      if (!levelDef) return;

      const name = memorySys.getOwnerName() || '你';
      const message = (LEVEL_UP_MESSAGES[newLevel] || '我们的关系更近了！').replace(/\{name\}/g, name);

      // 播放庆祝动画
      idleBehavior.pause();
      const celebration = ANIMATION_POOLS.celebration;
      if (celebration && celebration.length > 0) {
        for (const gifId of celebration) {
          await animMgr.play(gifId, { force: true });
          const dur = (GIFS[gifId] && GIFS[gifId].duration) || 3000;
          await new Promise(r => setTimeout(r, Math.min(dur, 2000)));
        }
      }

      // 显示升级消息
      bubbleUI.showText(`🎉 ${levelDef.emoji} ${message}`, 5000);

      // 推送到聊天窗口
      if (window.petAPI.pushActionResult) {
        window.petAPI.pushActionResult({
          type: 'levelup',
          text: `🎉 亲密度提升！关系变成了「${levelDef.emoji} ${levelDef.name}」！`,
        });
      }

      pushStatusToChat();
      saveAllState();

      setTimeout(() => idleBehavior.resume(), 3000);
    });

    // 定期推送状态（30秒）
    setInterval(pushStatusToChat, 30000);

    // 初始推送（延迟 2 秒等聊天窗口加载）
    setTimeout(pushStatusToChat, 2000);
  }

  console.log('Hello Kitty 桌面宠物已启动！');
  console.log('心情:', moodSys.getMoodLevel(), '亲密度:', affinitySys.getLevelName(), affinitySys.getAffinity());
  console.log('主人:', memorySys.getOwnerName() || '未设置', '相识天数:', memorySys.getDaysSinceFirstMeeting());
}

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
