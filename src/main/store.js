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
  },
});

// 强制更新 API Key（迁移到新模型时更新，之后可移除）
if (store.get('aiApiKey') !== 'sk-2ffc7a0d40a44208af3710a6d34a5f2f') {
  store.set('aiApiKey', 'sk-2ffc7a0d40a44208af3710a6d34a5f2f');
}

module.exports = store;
