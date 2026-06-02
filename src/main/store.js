const Store = require('electron-store').default;

const store = new Store({
  defaults: {
    affinity: 0,
    dailyGains: {},
    lastActiveDate: '',
    totalInteractions: 0,
    windowPosition: null,
    autoWalkEnabled: false,
    lastMoodLevel: 4,
    lastCloseTime: Date.now(),
    ownerName: '',
    ownerBirthday: '',
    firstMeetingDate: '',
    reminders: [],
    lastInteractionDate: '',
    loginStreakDays: 0,
    lastLoginStreakCheck: '',
    loginStreakBonusesClaimed: [],
    weeklySchedule: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
    lastScheduleNotified: { date: '', firedIds: [] },
    todos: [],
    aiApiKey: 'sk-2ffc7a0d40a44208af3710a6d34a5f2f',
    aiEnabled: true,
    chatHistory: [],
    chatHistoryMax: 50,
    skinId: 'sakura',
    chatBackgroundImage: '',  // 聊天背景图路径（空表示不使用背景图）
    chatBackgroundOpacity: 0.18, // 背景图不透明度
    // === 局域网找朋友 ===
    lanFriends: [],            // 好友列表
    lanNickname: '',           // 本机昵称（默认取 ownerName）
    lanInstanceId: '',         // 实例唯一 ID（自动生成）
    lanChatHistory: {},        // 好友聊天记录 { [friendId]: Message[] }
  },
});

// 强制更新 API Key（迁移到新模型时更新，之后可移除）
if (store.get('aiApiKey') !== 'sk-2ffc7a0d40a44208af3710a6d34a5f2f') {
  store.set('aiApiKey', 'sk-2ffc7a0d40a44208af3710a6d34a5f2f');
}

module.exports = store;
