const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('chatAPI', {
  // 发送消息给 AI
  sendMessage: (text, context) => ipcRenderer.invoke('chat-send', text, context),

  // 加载聊天历史
  loadHistory: () => ipcRenderer.invoke('chat-history-load'),

  // 保存聊天历史
  saveHistory: (messages) => ipcRenderer.invoke('chat-history-save', messages),

  // 获取 Kitty 状态上下文
  getContext: () => ipcRenderer.invoke('chat-get-context'),

  // 让 Kitty 播放 GIF 动画
  playGif: (gifId) => ipcRenderer.send('chat-play-gif', gifId),

  // 关闭（隐藏）聊天窗口
  closeWindow: () => ipcRenderer.send('chat-close'),

  // 触发 Kitty 动作
  triggerAction: (action) => ipcRenderer.invoke('chat-action', action),

  // 获取番茄钟状态
  getPomodoroStatus: () => ipcRenderer.invoke('chat-get-pomodoro'),

  // 接收状态更新推送
  onStatusUpdate: (callback) => ipcRenderer.on('chat-status-update', (_e, data) => callback(data)),

  // 接收番茄钟倒计时推送
  onPomodoroTick: (callback) => ipcRenderer.on('chat-pomodoro-tick', (_e, data) => callback(data)),

  // 接收动作执行结果
  onActionResult: (callback) => ipcRenderer.on('chat-action-result', (_e, data) => callback(data)),

  // === 周日程 ===
  getSchedule: () => ipcRenderer.invoke('schedule-get'),
  setSchedule: (schedule) => ipcRenderer.invoke('schedule-set', schedule),
  onScheduleNotification: (callback) => ipcRenderer.on('schedule-trigger-chat', (_e, data) => callback(data)),

  // === 待办 ===
  getTodos: () => ipcRenderer.invoke('todo-get'),
  setTodos: (todos) => ipcRenderer.invoke('todo-set', todos),

  // === 主人信息 ===
  getOwnerInfo: () => ipcRenderer.invoke('owner-get-info'),
  setOwnerInfo: (data) => ipcRenderer.invoke('owner-set-info', data),

  // === 皮肤 ===
  getSkin: () => ipcRenderer.invoke('skin-get'),
  setSkin: (skinId) => ipcRenderer.invoke('skin-set', skinId),

  // === AI 设置 ===
  getAiKeyStatus: () => ipcRenderer.invoke('ai-get-key-status'),
  setAiKey: (key) => ipcRenderer.invoke('ai-set-key', key),

  // === 软件更新 ===
  checkForUpdate: () => ipcRenderer.invoke('update-check'),
  downloadUpdate: () => ipcRenderer.invoke('update-download'),
  installUpdate: () => ipcRenderer.invoke('update-install'),
  getAppVersion: () => ipcRenderer.invoke('update-get-version'),
  getChangelog: () => ipcRenderer.invoke('update-get-changelog'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_e, data) => callback(data)),

  // === 窗口调整 ===
  resizeChatWindow: (expanded) => ipcRenderer.send('chat-resize', expanded),
});
