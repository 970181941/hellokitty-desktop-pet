const { app, ipcMain, Menu, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { createWindow, getWindow, saveWindowPosition, getScreenSize, showChatWindow, getChatWindow, resizeChatWindow } = require('./windowManager');
const { createTray, updateTrayMenu } = require('./trayManager');
const store = require('./store');
const AIService = require('./AIService');
const Updater = require('./updater');

// 隐藏 Dock 图标 (macOS)
if (process.platform === 'darwin') {
  app.dock.hide();
}

app.whenReady().then(() => {
  const mainWindow = createWindow();
  const aiService = new AIService();
  const updater = new Updater();

  // 设置更新器状态回调（推送到聊天窗口）
  updater.setStatusCallback((data) => {
    const chatWin = getChatWindow();
    if (chatWin) {
      chatWin.webContents.send('update-status', data);
    }
  });

  // 状态信息回调
  const getStatusInfo = () => {
    return {
      ownerName: store.get('ownerName', ''),
      affinity: store.get('affinity', 0),
    };
  };

  // 创建系统托盘
  createTray(getStatusInfo, () => {
    saveWindowPosition();
    store.set('lastCloseTime', Date.now());
    app.quit();
  });

  // === IPC 处理 ===

  // 获取窗口位置
  ipcMain.handle('get-window-bounds', () => {
    const win = getWindow();
    return win ? win.getBounds() : null;
  });

  // 设置窗口位置
  ipcMain.handle('set-window-position', (_event, x, y) => {
    const win = getWindow();
    if (win) {
      win.setPosition(Math.round(x), Math.round(y));
    }
  });

  // 获取屏幕尺寸
  ipcMain.handle('get-screen-size', () => {
    return getScreenSize();
  });

  // 保存状态
  ipcMain.handle('save-state', (_event, data) => {
    if (data.affinity !== undefined) store.set('affinity', data.affinity);
    if (data.dailyGains !== undefined) store.set('dailyGains', data.dailyGains);
    if (data.lastActiveDate !== undefined) store.set('lastActiveDate', data.lastActiveDate);
    if (data.totalInteractions !== undefined) store.set('totalInteractions', data.totalInteractions);
    if (data.autoWalkEnabled !== undefined) store.set('autoWalkEnabled', data.autoWalkEnabled);
    if (data.lastMoodLevel !== undefined) store.set('lastMoodLevel', data.lastMoodLevel);
    if (data.windowPosition !== undefined) store.set('windowPosition', data.windowPosition);
    if (data.ownerName !== undefined) store.set('ownerName', data.ownerName);
    if (data.ownerBirthday !== undefined) store.set('ownerBirthday', data.ownerBirthday);
    if (data.firstMeetingDate !== undefined) store.set('firstMeetingDate', data.firstMeetingDate);
    if (data.reminders !== undefined) store.set('reminders', data.reminders);
    if (data.lastInteractionDate !== undefined) store.set('lastInteractionDate', data.lastInteractionDate);
    if (data.loginStreakDays !== undefined) store.set('loginStreakDays', data.loginStreakDays);
    if (data.lastLoginStreakCheck !== undefined) store.set('lastLoginStreakCheck', data.lastLoginStreakCheck);
    if (data.loginStreakBonusesClaimed !== undefined) store.set('loginStreakBonusesClaimed', data.loginStreakBonusesClaimed);
    if (data.weeklySchedule !== undefined) store.set('weeklySchedule', data.weeklySchedule);
    if (data.lastScheduleNotified !== undefined) store.set('lastScheduleNotified', data.lastScheduleNotified);
    store.set('lastCloseTime', Date.now());
    return true;
  });

  // 加载状态
  ipcMain.handle('load-state', () => {
    return {
      affinity: store.get('affinity', 0),
      dailyGains: store.get('dailyGains', {}),
      lastActiveDate: store.get('lastActiveDate', ''),
      totalInteractions: store.get('totalInteractions', 0),
      autoWalkEnabled: store.get('autoWalkEnabled', false),
      lastMoodLevel: store.get('lastMoodLevel', 4),
      lastCloseTime: store.get('lastCloseTime', Date.now()),
      ownerName: store.get('ownerName', ''),
      ownerBirthday: store.get('ownerBirthday', ''),
      firstMeetingDate: store.get('firstMeetingDate', ''),
      reminders: store.get('reminders', []),
      lastInteractionDate: store.get('lastInteractionDate', ''),
      loginStreakDays: store.get('loginStreakDays', 0),
      lastLoginStreakCheck: store.get('lastLoginStreakCheck', ''),
      loginStreakBonusesClaimed: store.get('loginStreakBonusesClaimed', []),
      weeklySchedule: store.get('weeklySchedule', { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }),
      lastScheduleNotified: store.get('lastScheduleNotified', { date: '', firedIds: [] }),
    };
  });

  // 显示右键菜单
  ipcMain.handle('show-context-menu', (_event, menuData) => {
    return new Promise((resolve) => {
      const template = menuData.map((item) => {
        if (item.type === 'separator') return { type: 'separator' };
        return {
          label: item.label,
          enabled: item.enabled !== false,
          click: () => {
            const win = getWindow();
            if (win) win.webContents.send('menu-action', item.action);
            resolve(item.action);
          },
        };
      });

      const menu = Menu.buildFromTemplate(template);
      const win = getWindow();
      menu.popup({ window: win });

      // 菜单关闭时 resolve null
      menu.on('menu-will-close', () => {
        resolve(null);
      });
    });
  });

  // 退出应用
  ipcMain.on('quit-app', () => {
    saveWindowPosition();
    store.set('lastCloseTime', Date.now());
    app.quit();
  });

  // 更新托盘状态 (渲染进程请求)
  ipcMain.handle('update-tray-status', (_event, info) => {
    updateTrayMenu(() => info, () => {
      saveWindowPosition();
      store.set('lastCloseTime', Date.now());
      app.quit();
    });
  });

  // === AI 对话 IPC ===

  ipcMain.handle('ai-chat', async (_event, userInput, context, options) => {
    return await aiService.chat(userInput, context, options);
  });

  ipcMain.handle('ai-set-key', (_event, key) => {
    aiService.setApiKey(key);
    return true;
  });

  ipcMain.handle('ai-get-key-status', () => {
    return aiService.hasApiKey();
  });

  ipcMain.handle('ai-validate-key', async (_event, key) => {
    return await aiService.validateApiKey(key);
  });

  // === 聊天窗口 IPC ===

  ipcMain.handle('open-chat-window', () => {
    showChatWindow();
    const chatWin = getChatWindow();
    if (chatWin) {
      chatWin.webContents.send('chat-opened');
    }
    return true;
  });

  ipcMain.handle('chat-send', async (_event, text, context) => {
    const result = await aiService.chat(text, context, { mode: 'chat' });

    // 如果成功，同步到 Kitty 窗口
    if (result && !result.error) {
      const win = getWindow();
      if (win) {
        win.webContents.send('play-gif', result.gifId);
        win.webContents.send('sync-history', {
          userInput: text,
          assistantReply: result.text,
        });
      }
    }

    return result;
  });

  ipcMain.handle('chat-history-load', () => {
    return store.get('chatHistory', []);
  });

  ipcMain.handle('chat-history-save', (_event, messages) => {
    const max = store.get('chatHistoryMax', 50);
    const trimmed = messages.slice(-max);
    store.set('chatHistory', trimmed);
    return true;
  });

  ipcMain.handle('chat-get-context', () => {
    return new Promise((resolve) => {
      const win = getWindow();
      if (!win) {
        resolve({});
        return;
      }

      // 向 Kitty 窗口请求上下文
      win.webContents.send('request-context');

      // 等待 Kitty 窗口响应
      const handler = (_event, context) => {
        clearTimeout(timeout);
        resolve(context);
      };
      const timeout = setTimeout(() => {
        ipcMain.removeListener('context-response', handler);
        resolve({});
      }, 2000);

      ipcMain.once('context-response', handler);
    });
  });

  ipcMain.on('chat-play-gif', (_event, gifId) => {
    const win = getWindow();
    if (win) {
      win.webContents.send('play-gif', gifId);
    }
  });

  ipcMain.on('chat-close', () => {
    const chatWin = getChatWindow();
    if (chatWin) {
      chatWin.hide();
    }
  });

  // 调整聊天窗口大小（侧边面板）
  ipcMain.on('chat-resize', (_event, expanded) => {
    resizeChatWindow(expanded);
  });

  // === 聊天窗口动作 IPC ===

  // 转发动作到 Kitty 窗口
  ipcMain.handle('chat-action', async (_event, action) => {
    const win = getWindow();
    if (win) {
      win.webContents.send('chat-action-execute', action);
    }
    return { ok: true };
  });

  // 查询番茄钟状态
  ipcMain.handle('chat-get-pomodoro', () => {
    return new Promise((resolve) => {
      const win = getWindow();
      if (!win) {
        resolve({ active: false, state: 'idle', timeRemaining: 0 });
        return;
      }

      win.webContents.send('chat-get-pomodoro-status');

      const handler = (_event, data) => {
        clearTimeout(timeout);
        resolve(data || { active: false, state: 'idle', timeRemaining: 0 });
      };
      const timeout = setTimeout(() => {
        ipcMain.removeListener('pomodoro-status-response', handler);
        resolve({ active: false, state: 'idle', timeRemaining: 0 });
      }, 2000);

      ipcMain.once('pomodoro-status-response', handler);
    });
  });

  // 添加提醒
  ipcMain.handle('chat-add-reminder', (_event, date, text) => {
    const win = getWindow();
    if (win) {
      win.webContents.send('chat-add-reminder-execute', { date, text });
    }
    return { ok: true };
  });

  // === 周日程 IPC ===

  const defaultSchedule = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

  ipcMain.handle('schedule-get', () => {
    return store.get('weeklySchedule', defaultSchedule);
  });

  ipcMain.handle('schedule-set', (_event, schedule) => {
    store.set('weeklySchedule', schedule);
    return { ok: true };
  });

  ipcMain.handle('schedule-notify', (_event, data) => {
    // 系统级通知
    const iconPath = path.join(__dirname, '../../assets/icon_1024.png');
    if (Notification.isSupported()) {
      const notif = new Notification({
        title: '🎀 Kitty 提醒',
        body: data.text,
        icon: iconPath,
      });
      notif.show();
    }
    // 转发到 Kitty 窗口
    const win = getWindow();
    if (win) {
      win.webContents.send('schedule-trigger', data);
    }
    // 转发到聊天窗口
    const chatWin = getChatWindow();
    if (chatWin) {
      chatWin.webContents.send('schedule-trigger-chat', data);
    }
    return { ok: true };
  });

  // === Todo IPC ===
  ipcMain.handle('todo-get', () => {
    return store.get('todos', []);
  });

  ipcMain.handle('todo-set', (_event, todos) => {
    store.set('todos', todos);
    return { ok: true };
  });

  // === Owner Info IPC ===
  ipcMain.handle('owner-get-info', () => {
    return {
      name: store.get('ownerName', ''),
      birthday: store.get('ownerBirthday', ''),
    };
  });

  ipcMain.handle('owner-set-info', (_event, data) => {
    if (data.name !== undefined) store.set('ownerName', data.name);
    if (data.birthday !== undefined) store.set('ownerBirthday', data.birthday);
    // Notify Kitty window to update MemorySystem
    const win = getWindow();
    if (win) {
      win.webContents.send('owner-info-updated', data);
    }
    return { ok: true };
  });

  // === Skin IPC ===
  ipcMain.handle('skin-get', () => {
    return store.get('skinId', 'sakura');
  });

  ipcMain.handle('skin-set', (_event, skinId) => {
    store.set('skinId', skinId);
    return { ok: true };
  });

  // === Update IPC ===
  ipcMain.handle('update-check', async () => {
    return await updater.checkForUpdates();
  });

  ipcMain.handle('update-download', async () => {
    return await updater.downloadUpdate();
  });

  ipcMain.handle('update-install', () => {
    updater.installUpdate();
    return { ok: true };
  });

  ipcMain.handle('update-get-version', () => {
    return updater.getAppVersion();
  });

  ipcMain.handle('update-get-changelog', () => {
    try {
      // 尝试从打包后的资源路径读取
      const appPath = app.getAppPath();
      const changelogPath = path.join(appPath, 'CHANGELOG.md');
      if (fs.existsSync(changelogPath)) {
        return fs.readFileSync(changelogPath, 'utf-8');
      }
      // 开发模式下从项目根目录读取
      const devPath = path.join(__dirname, '../../CHANGELOG.md');
      if (fs.existsSync(devPath)) {
        return fs.readFileSync(devPath, 'utf-8');
      }
      return '# 更新日志\n\n暂无更新记录';
    } catch (error) {
      console.error('[Updater] 读取 changelog 失败:', error.message);
      return '# 更新日志\n\n读取失败';
    }
  });

  // 状态推送中继：Kitty -> Chat
  ipcMain.on('push-status-update', (_event, data) => {
    const chatWin = getChatWindow();
    if (chatWin) {
      chatWin.webContents.send('chat-status-update', data);
    }
  });

  // 番茄钟倒计时中继：Kitty -> Chat
  ipcMain.on('push-pomodoro-tick', (_event, data) => {
    const chatWin = getChatWindow();
    if (chatWin) {
      chatWin.webContents.send('chat-pomodoro-tick', data);
    }
  });

  // 动作结果中继：Kitty -> Chat
  ipcMain.on('push-action-result', (_event, data) => {
    const chatWin = getChatWindow();
    if (chatWin) {
      chatWin.webContents.send('chat-action-result', data);
    }
  });

  // 窗口关闭时保存位置
  mainWindow.on('close', () => {
    saveWindowPosition();
    store.set('lastCloseTime', Date.now());
  });
});

// macOS: 关闭窗口时隐藏到托盘而非退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
