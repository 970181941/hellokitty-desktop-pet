const { ipcRenderer } = require('electron');

// 直接将 IPC API 挂载到 window（本地桌面应用，无需 contextIsolation）
window.petAPI = {
  // 窗口操作
  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),
  setWindowPosition: (x, y) => ipcRenderer.invoke('set-window-position', x, y),
  getScreenSize: () => ipcRenderer.invoke('get-screen-size'),

  // 持久化存储
  saveState: (data) => ipcRenderer.invoke('save-state', data),
  loadState: () => ipcRenderer.invoke('load-state'),

  // 右键菜单
  showContextMenu: (menuData) => ipcRenderer.invoke('show-context-menu', menuData),

  // 退出
  quit: () => ipcRenderer.send('quit-app'),

  // 接收主进程事件
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (_event, action) => callback(action));
  },

  // AI 对话
  aiChat: (input, context, options) => ipcRenderer.invoke('ai-chat', input, context, options),
  aiSetKey: (key) => ipcRenderer.invoke('ai-set-key', key),
  aiGetKeyStatus: () => ipcRenderer.invoke('ai-get-key-status'),
  aiValidateKey: (key) => ipcRenderer.invoke('ai-validate-key', key),

  // 聊天窗口
  openChatWindow: () => ipcRenderer.invoke('open-chat-window'),

  // 接收聊天窗口的 GIF 播放请求
  onPlayGif: (callback) => {
    ipcRenderer.on('play-gif', (_event, gifId) => callback(gifId));
  },

  // 响应聊天窗口的上下文请求
  onRequestContext: (callback) => {
    ipcRenderer.on('request-context', () => {
      const context = callback();
      ipcRenderer.send('context-response', context);
    });
  },

  // 接收聊天窗口的历史同步
  onSyncHistory: (callback) => {
    ipcRenderer.on('sync-history', (_event, data) => callback(data));
  },

  // 接收聊天窗口的动作执行请求
  onChatAction: (callback) => {
    ipcRenderer.on('chat-action-execute', (_event, action) => callback(action));
  },

  // 响应番茄钟状态查询
  onGetPomodoroStatus: (callback) => {
    ipcRenderer.on('chat-get-pomodoro-status', () => {
      const result = callback();
      ipcRenderer.send('pomodoro-status-response', result);
    });
  },

  // 接收提醒添加请求
  onChatAddReminder: (callback) => {
    ipcRenderer.on('chat-add-reminder-execute', (_event, data) => callback(data));
  },

  // 推送状态更新到聊天窗口
  pushStatusUpdate: (data) => {
    ipcRenderer.send('push-status-update', data);
  },

  // 推送番茄钟倒计时到聊天窗口
  pushPomodoroTick: (data) => {
    ipcRenderer.send('push-pomodoro-tick', data);
  },

  // 推送动作结果到聊天窗口
  pushActionResult: (data) => {
    ipcRenderer.send('push-action-result', data);
  },

  // === 周日程 ===
  getSchedule: () => ipcRenderer.invoke('schedule-get'),
  setSchedule: (schedule) => ipcRenderer.invoke('schedule-set', schedule),
  scheduleNotify: (data) => ipcRenderer.invoke('schedule-notify', data),
  onScheduleTrigger: (callback) => {
    ipcRenderer.on('schedule-trigger', (_event, data) => callback(data));
  },

  // === 待办 ===
  getTodos: () => ipcRenderer.invoke('todo-get'),
  setTodos: (todos) => ipcRenderer.invoke('todo-set', todos),

  // === 主人信息更新 ===
  onOwnerInfoUpdated: (callback) => {
    ipcRenderer.on('owner-info-updated', (_event, data) => callback(data));
  },
};
