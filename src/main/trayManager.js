const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let tray = null;

function createTray(getStatusInfo, onQuit) {
  // 创建一个简单的托盘图标 (使用 16x16 的空白图标+标记)
  // 由于没有专门的托盘图标素材，创建一个简单的粉色圆形图标
  const iconSize = 16;
  const canvas = `<svg width="${iconSize}" height="${iconSize}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="7" fill="#FF69B4"/>
    <text x="8" y="12" font-size="10" fill="white" text-anchor="middle">K</text>
  </svg>`;
  const icon = nativeImage.createFromBuffer(Buffer.from(canvas));
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('Hello Kitty 桌面宠物');

  updateTrayMenu(getStatusInfo, onQuit);

  // 左键点击显示/隐藏窗口
  tray.on('click', () => {
    const { getWindow } = require('./windowManager');
    const win = getWindow();
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
      }
    }
  });
}

function updateTrayMenu(getStatusInfo, onQuit) {
  if (!tray) return;

  const status = getStatusInfo ? getStatusInfo() : {};
  const ownerName = status.ownerName || '';
  const affinityValue = status.affinity || 0;

  const menuItems = [];

  if (ownerName) {
    menuItems.push({ label: `主人: ${ownerName}`, enabled: false });
  }

  menuItems.push(
    { label: `亲密度: ${affinityValue}`, enabled: false },
    { type: 'separator' },
    {
      label: '重置位置',
      click: () => {
        const { resetWindowPosition } = require('./windowManager');
        resetWindowPosition();
      },
    },
    {
      label: '显示/隐藏',
      click: () => {
        const { getWindow } = require('./windowManager');
        const win = getWindow();
        if (win) {
          if (win.isVisible()) win.hide();
          else win.show();
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        if (onQuit) onQuit();
      },
    },
  );

  const contextMenu = Menu.buildFromTemplate(menuItems);

  tray.setContextMenu(contextMenu);
}

module.exports = {
  createTray,
  updateTrayMenu,
};
