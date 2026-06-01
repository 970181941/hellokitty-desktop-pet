const { BrowserWindow, screen } = require('electron');
const path = require('path');
const store = require('./store');
const { WINDOW_CONFIG } = require('../renderer/utils/constants');

let mainWindow = null;
let chatWindow = null;

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  // 恢复上次窗口位置，或默认屏幕右下角
  const savedPos = store.get('windowPosition');
  const defaultX = screenWidth - WINDOW_CONFIG.width - 60;
  const defaultY = screenHeight - WINDOW_CONFIG.height - 20;

  let x = savedPos ? savedPos.x : defaultX;
  let y = savedPos ? savedPos.y : defaultY;

  // 校验位置是否在屏幕内
  if (x < -WINDOW_CONFIG.width || x > screenWidth || y < -WINDOW_CONFIG.height || y > screenHeight) {
    x = defaultX;
    y = defaultY;
  }

  mainWindow = new BrowserWindow({
    width: WINDOW_CONFIG.width,
    height: WINDOW_CONFIG.height,
    x,
    y,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: true,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  // macOS 特殊处理
  if (process.platform === 'darwin') {
    mainWindow.setAlwaysOnTop(true, 'floating');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // 禁止窗口获得焦点时显示蓝色边框
  mainWindow.on('focus', () => {
    // no-op, 保持透明
  });

  return mainWindow;
}

function getWindow() {
  return mainWindow;
}

function saveWindowPosition() {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  store.set('windowPosition', { x: bounds.x, y: bounds.y });
}

function resetWindowPosition() {
  if (!mainWindow) return;
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const x = screenWidth - WINDOW_CONFIG.width - 60;
  const y = screenHeight - WINDOW_CONFIG.height - 20;
  mainWindow.setPosition(x, y);
  saveWindowPosition();
}

function getScreenSize() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { width, height };
}

function createChatWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const chatWidth = 730;  // 450 聊天区 + 280 侧边面板
  const chatHeight = 620;

  // 计算位置：优先 Kitty 窗口左侧，不够则右侧，再不够则居中
  let x, y;
  if (mainWindow) {
    const bounds = mainWindow.getBounds();
    if (bounds.x - chatWidth - 10 >= 0) {
      // 左侧
      x = bounds.x - chatWidth - 10;
      y = bounds.y + bounds.height - chatHeight;
    } else if (bounds.x + bounds.width + chatWidth + 10 <= screenWidth) {
      // 右侧
      x = bounds.x + bounds.width + 10;
      y = bounds.y + bounds.height - chatHeight;
    } else {
      // 居中
      x = Math.round((screenWidth - chatWidth) / 2);
      y = Math.round((screenHeight - chatHeight) / 2);
    }
  } else {
    x = Math.round((screenWidth - chatWidth) / 2);
    y = Math.round((screenHeight - chatHeight) / 2);
  }

  // 确保 y 不小于 0
  y = Math.max(0, y);

  // 根据皮肤设置背景色
  const SKIN_BG_COLORS = {
    sakura: '#fff5f8',
    ocean: '#f0f8ff',
    lavender: '#f8f0ff',
    mint: '#f0fff8',
    peach: '#fff8f0',
    starry: '#f0f0ff',
  };
  const skinId = store.get('skinId', 'sakura');
  const bgColor = SKIN_BG_COLORS[skinId] || '#fff5f8';

  chatWindow = new BrowserWindow({
    width: chatWidth,
    height: chatHeight,
    x,
    y,
    frame: false,
    transparent: false,
    alwaysOnTop: false,
    resizable: false,
    hasShadow: true,
    skipTaskbar: false,
    backgroundColor: bgColor,
    webPreferences: {
      preload: path.join(__dirname, '..', 'chat', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  chatWindow.loadFile(path.join(__dirname, '..', 'chat', 'index.html'));

  // 关闭时隐藏而非销毁
  chatWindow.on('close', (e) => {
    e.preventDefault();
    chatWindow.hide();
  });

  chatWindow.on('closed', () => {
    chatWindow = null;
  });

  return chatWindow;
}

function getChatWindow() {
  return chatWindow;
}

function showChatWindow() {
  if (chatWindow && !chatWindow.isDestroyed()) {
    chatWindow.show();
    chatWindow.focus();
  } else {
    createChatWindow();
  }
}

module.exports = {
  createWindow,
  getWindow,
  saveWindowPosition,
  resetWindowPosition,
  getScreenSize,
  createChatWindow,
  getChatWindow,
  showChatWindow,
};
