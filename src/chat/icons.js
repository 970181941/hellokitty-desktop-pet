/**
 * HelloKitty Desktop Pet - Icon Design System v2.0
 * 基于 Icon 设计规范 v2 + 新增场景 Icon
 * 基于 Icon 设计规范：24×24 基准网格，2px 线宽，圆角端点
 * 线性图标用 currentColor 继承 CSS 颜色，状态/情绪图标用品牌色填充
 *
 * 使用方式：
 *   ICONS.home          → 24px 线性图标 (currentColor)
 *   ICONS.home(20)      → 20px 线性图标
 *   ICONS.homeActive    → 24px 品牌色图标 (#FF6B9D)
 *   ICONS.moodHeart     → 24px 面性填充图标
 */

const _svg = (inner, size = 24, color = 'currentColor', fill = 'none') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const _filled = (inner, size = 24) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24">${inner}</svg>`;

// ============================================
// 1. 导航图标 Navigation (线性, currentColor)
// ============================================

const ICONS = {

  // 首页 Home
  home: (s) => _svg('<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/>', s),
  homeActive: (s) => _svg('<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/>', s, '#FF6B9D'),

  // 聊天 Chat
  chat: (s) => _svg('<path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>', s),

  // 背包 Bag
  bag: (s) => _svg('<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>', s),

  // 设置 Settings
  settings: (s) => _svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>', s),

  // 我的 Profile
  profile: (s) => _svg('<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>', s),

  // 成就 Achievement (金色)
  achievement: (s) => _svg('<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>', s, '#FFB300'),

  // ============================================
  // 2. 状态图标 Status (面性填充, 品牌色)
  // ============================================

  // 心情 Mood (心形, 品牌粉)
  moodHeart: (s) => _filled('<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF6B9D"/>', s),

  // 精力 Energy (闪电, 蓝色)
  energy: (s) => _filled('<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#42A5F5"/>', s),

  // 饱食 Hunger (餐具, 橙色)
  hunger: (s) => _filled('<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" fill="#FF9800"/>', s),

  // 睡眠 Sleep (月亮, 紫色)
  sleepMoon: (s) => _filled('<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#7B68EE"/>', s),

  // 等级 Level (星星, 金色)
  levelStar: (s) => _filled('<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FFB300"/>', s),

  // 金币 Coin
  coin: (s) => _filled('<circle cx="12" cy="12" r="10" fill="#FFD54F" stroke="#FFB300" stroke-width="1.5"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="#FFB300">$</text>', s),

  // 钻石 Diamond
  diamond: (s) => _filled('<path d="M6 3h12l4 6-10 13L2 9z" fill="#42A5F5" opacity="0.85"/>', s),

  // 在线 Online (绿点)
  online: (s) => _filled('<circle cx="12" cy="12" r="6" fill="#4CAF50"/>', s),

  // 离线 Offline (灰点)
  offline: (s) => _filled('<circle cx="12" cy="12" r="6" fill="#BDBDBD"/>', s),

  // ============================================
  // 3. 互动动作图标 Interaction (线性, 品牌色)
  // ============================================

  // 摸摸头 Pet
  pet: (s) => _svg('<path d="M18 11V6a2 2 0 00-4 0v1M14 10V4a2 2 0 00-4 0v6M10 10.5V5a2 2 0 00-4 0v9"/><path d="M18 11a2 2 0 014 0v3a8 8 0 01-8 8h-2c-2.5 0-4.7-1.3-6-3.3L4 15"/>', s, '#FF6B9D'),

  // 喂食 Feed (杯子)
  feed: (s) => _svg('<path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>', s, '#FF6B9D'),

  // 玩耍 Play (圆形播放)
  play: (s) => _svg('<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>', s),
  playBrand: (s) => _svg('<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="#FF6B9D" stroke="none"/>', s, '#FF6B9D'),

  // 换装 Dress
  dress: (s) => _svg('<path d="M20.38 3.46L16 2 12 3.46 8 2 3.62 3.46a2 2 0 00-1.34 1.77L2 22l10-3 10 3-.28-16.77a2 2 0 00-1.34-1.77z"/>', s, '#FF6B9D'),

  // 洗澡 Bath
  bath: (s) => _svg('<path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3v2.25"/><line x1="4" y1="20" x2="4" y2="21"/><line x1="20" y1="20" x2="20" y2="21"/>', s, '#42A5F5'),

  // 哄睡 Lullaby
  lullaby: (s) => _svg('<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/><path d="M15 7l2 2m0 0l2 2m-2-2l-2 2m2-2l2-2" stroke-width="1.5" opacity="0.5"/>', s, '#7B68EE'),

  // 拍照 Photo
  photo: (s) => _svg('<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>', s, '#FF6B9D'),

  // 礼物 Gift
  gift: (s) => _svg('<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>', s, '#FFB300'),

  // 抱抱 Hug (双手+心)
  hug: (s) => _svg('<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>', s, '#FF6B9D'),

  // 专注/番茄钟 Pomodoro (计时器)
  pomodoro: (s) => _svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3L2 6"/><path d="M22 6l-3-3"/><path d="M12 5V3"/><path d="M10 2h4"/>', s),

  // 唱歌 Sing (音符)
  sing: (s) => _svg('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>', s, '#FF6B9D'),

  // 溜冰 Skate
  skate: (s) => _svg('<path d="M17 4h3a2 2 0 010 4h-3"/><path d="M4 8h13l-1.5 6H6L4.5 8z"/><circle cx="7" cy="18" r="2"/><circle cx="15" cy="18" r="2"/><line x1="4" y1="22" x2="20" y2="22"/>', s, '#42A5F5'),

  // 秘密 Secret (锁)
  secret: (s) => _svg('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>', s, '#7B68EE'),

  // 治疗 Heal (医疗十字)
  heal: (s) => _svg('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>', s, '#4CAF50'),

  // ============================================
  // 4. 通用操作图标 Utility (线性, currentColor)
  // ============================================

  // 关闭 Close
  close: (s) => _svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>', s),

  // 返回 Back
  back: (s) => _svg('<polyline points="15 18 9 12 15 6"/>', s),

  // 更多 More (三个点)
  more: (s) => `<svg width="${s||24}" height="${s||24}" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>`,

  // 搜索 Search
  search: (s) => _svg('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', s),

  // 分享 Share
  share: (s) => _svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>', s),

  // 下载 Download
  download: (s) => _svg('<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>', s),

  // 编辑 Edit
  edit: (s) => _svg('<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>', s),

  // 删除 Delete (红色)
  delete: (s) => _svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>', s, '#F44336'),

  // 确认 Check (绿色)
  check: (s) => _svg('<polyline points="20 6 9 17 4 12"/>', s, '#4CAF50'),

  // 帮助 Help (蓝色)
  help: (s) => _svg('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>', s, '#42A5F5'),

  // 查看 View (眼睛)
  view: (s) => _svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', s),

  // 收藏 Favorite (心形线框)
  favorite: (s) => _svg('<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>', s, '#FF6B9D'),

  // 发送 Send (箭头向上)
  send: (s) => _svg('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>', s),

  // 添加 Add (加号)
  add: (s) => _svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', s),

  // 日历 Calendar
  calendar: (s) => _svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>', s),

  // 待办 Todo (清单)
  todo: (s) => _svg('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>', s),

  // 好友 Friends (双人)
  friends: (s) => _svg('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>', s),

  // 设备 Device (电脑)
  device: (s) => _svg('<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>', s),

  // ============================================
  // 5. 通知反馈图标 Notification (面性+线性)
  // ============================================

  // 成功 Success
  success: (s) => _filled('<circle cx="12" cy="12" r="10" fill="#E8F5E9"/><path d="M8 12l3 3 5-5" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', s),

  // 警告 Warning
  warning: (s) => _filled('<path d="M12 2L2 20h20L12 2z" fill="#FFF3E0"/><path d="M12 10v4" stroke="#FF9800" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="12" cy="17" r="1" fill="#FF9800"/>', s),

  // 错误 Error
  error: (s) => _filled('<circle cx="12" cy="12" r="10" fill="#FFEBEE"/><path d="M15 9l-6 6M9 9l6 6" stroke="#F44336" stroke-width="2" stroke-linecap="round" fill="none"/>', s),

  // 信息 Info
  info: (s) => _filled('<circle cx="12" cy="12" r="10" fill="#E3F2FD"/><path d="M12 16v-4" stroke="#42A5F5" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="12" cy="8" r="0.5" fill="#42A5F5" stroke="#42A5F5"/>', s),

  // === Friends ===
  friendAdd: (s) => _svg('<circle cx="9" cy="7" r="3"/><path d="M3 21v-1a4 4 0 014-4h4a4 4 0 014 4v1"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>', s, '#42A5F5'),
  friendRemove: (s) => _svg('<circle cx="9" cy="7" r="3"/><path d="M3 21v-1a4 4 0 014-4h4a4 4 0 014 4v1"/><line x1="16" y1="11" x2="22" y2="11"/>', s),
  friendFavorite: (s) => _svg('<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>', s, '#FF6B9D'),
  friendLevel: (s) => _svg('<path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8 2.4-7.2-6-4.8h7.6z"/>', s, '#FFB300'),
  invite: (s) => _svg('<path d="M4 4h16v16H4z" rx="2"/><path d="M8 12h8M12 8v8"/>', s, '#FF6B9D'),
  chatNew: (s) => _svg('<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/>', s, '#FF6B9D'),
  imageMsg: (s) => _svg('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>', s),
  voiceMsg: (s) => _svg('<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>', s),
  location: (s) => _svg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>', s, '#42A5F5'),
  readReceipt: (s) => _svg('<polyline points="20 6 9 17 4 12"/>', s, '#4CAF50'),
  forward: (s) => _svg('<polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 014-4h12"/>', s),
};
  // ============================================
  // 6. 朋友相关 Friends (社交蓝 #42A5F5)
  // ============================================
  friendAdd: (s) => _svg('<circle cx="9" cy="7" r="3"/><path d="M3 21v-1a4 4 0 014-4h4a4 4 0 014 4v1"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>', s, '#42A5F5'),
  friendRemove: (s) => _svg('<circle cx="9" cy="7" r="3"/><path d="M3 21v-1a4 4 0 014-4h4a4 4 0 014 4v1"/><line x1="16" y1="11" x2="22" y2="11"/>', s),
  friendRequest: (s) => _svg('<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8l3 3-3 3"/><line x1="22" y1="11" x2="14" y2="11"/>', s, '#42A5F5'),
  friendGroup: (s) => _svg('<circle cx="12" cy="7" r="3"/><circle cx="5" cy="10" r="2.5"/><circle cx="19" cy="10" r="2.5"/><path d="M7.5 21v-1a3 3 0 013-3h3a3 3 0 013 3v1"/>', s),
  friendFavorite: (s) => _svg('<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>', s, '#FF6B9D'),
  friendBlock: (s) => _svg('<circle cx="12" cy="8" r="4"/><path d="M5 21v-1a5 5 0 015-5h4a5 5 0 014.24 2.34"/><line x1="4" y1="4" x2="20" y2="20"/>', s, '#F44336'),
  friendLevel: (s) => _svg('<path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8 2.4-7.2-6-4.8h7.6z"/>', s, '#FFB300'),
  friendSearch: (s) => _svg('<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/><path d="M8 10c0-1.5 1.5-3 3-3"/><path d="M14 10c0-1.5-1.5-3-3-3"/><line x1="11" y1="12" x2="11" y2="14"/><path d="M9.5 14c.5.8 1 1 1.5 1s1-.2 1.5-1"/>', s),
  onlineFriends: (s) => _svg('<circle cx="9" cy="7" r="3"/><path d="M3 21v-1a4 4 0 014-4h4a4 4 0 014 4v1"/><circle cx="17" cy="7" r="2.5"/><path d="M21 21v-.5a3 3 0 00-2.5-2.96"/><circle cx="17" cy="16" r="2" fill="#4CAF50" stroke="none"/>', s, '#4CAF50'),
  invite: (s) => _svg('<path d="M4 4h16v16H4z" rx="2"/><path d="M8 12h8M12 8v8"/>', s, '#FF6B9D'),

  // ============================================
  // 7. 聊天扩展 Chat Extended (品牌粉 #FF6B9D)
  // ============================================
  chatNew: (s) => _svg('<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/>', s, '#FF6B9D'),
  imageMsg: (s) => _svg('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>', s),
  voiceMsg: (s) => _svg('<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>', s),
  videoMsg: (s) => _svg('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>', s),
  emojiPicker: (s) => _svg('<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>', s, '#FFB300'),
  sticker: (s) => _svg('<path d="M15.5 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8.5L15.5 3z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13l2 2 4-4"/>', s, '#FF6B9D'),
  fileMsg: (s) => _svg('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>', s),
  location: (s) => _svg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>', s, '#42A5F5'),
  atMention: (s) => _svg('<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/>', s, '#7B68EE'),
  readReceipt: (s) => _svg('<polyline points="20 6 9 17 4 12"/><polyline points="22 8 11 19 8 16" opacity="0.4"/>', s, '#4CAF50'),
  quoteReply: (s) => _svg('<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/>', s),
  forward: (s) => _svg('<polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 014-4h12"/>', s),
  pinMessage: (s) => _svg('<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z"/>', s, '#FF6B9D'),
  msgSearch: (s) => _svg('<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><circle cx="11" cy="10" r="2"/><line x1="13" y1="12" x2="16" y2="15"/>', s),
  translate: (s) => _svg('<path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/>', s, '#42A5F5'),

  // ============================================
  // 8. 心情图标 Mood (面性40px, 各情绪专属三色)
  // ============================================
  moodHappy: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#FFF9C4"/><path d="M13 17c.5-1 1-1.5 2-1.5s1.5.5 2 1.5" fill="none" stroke="#FF6B9D" stroke-width="1.5" stroke-linecap="round"/><path d="M23 17c.5-1 1-1.5 2-1.5s1.5.5 2 1.5" fill="none" stroke="#FF6B9D" stroke-width="1.5" stroke-linecap="round"/><path d="M13 23c2 3 4 3.5 7 3.5s5-.5 7-3.5" fill="none" stroke="#FF6B9D" stroke-width="2" stroke-linecap="round"/><circle cx="11" cy="22" r="2.5" fill="#FFD4E5" opacity="0.6"/><circle cx="29" cy="22" r="2.5" fill="#FFD4E5" opacity="0.6"/></svg>`,
  moodSad: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#E3F2FD"/><path d="M13 18c.5 1 1 1.5 2 1.5s1.5-.5 2-1.5" fill="none" stroke="#42A5F5" stroke-width="1.5" stroke-linecap="round"/><path d="M23 18c.5 1 1 1.5 2 1.5s1.5-.5 2-1.5" fill="none" stroke="#42A5F5" stroke-width="1.5" stroke-linecap="round"/><path d="M14 27c2-2.5 4-3 6-3s4 .5 6 3" fill="none" stroke="#42A5F5" stroke-width="2" stroke-linecap="round"/><path d="M27 14c1-2 1.5-3 1.5-3" fill="none" stroke="#90CAF9" stroke-width="1.5" stroke-linecap="round"/><circle cx="29" cy="12" r="1" fill="#90CAF9"/></svg>`,
  moodShy: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#FCE4EC"/><line x1="12" y1="18" x2="17" y2="18" stroke="#EC407A" stroke-width="2" stroke-linecap="round"/><line x1="23" y1="18" x2="28" y2="18" stroke="#EC407A" stroke-width="2" stroke-linecap="round"/><path d="M16 25c1 1.5 2.5 2 4 2s3-.5 4-2" fill="none" stroke="#EC407A" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="10" cy="23" rx="3.5" ry="2" fill="#F48FB1" opacity="0.4"/><ellipse cx="30" cy="23" rx="3.5" ry="2" fill="#F48FB1" opacity="0.4"/></svg>`,
  moodExcited: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#FFF8E1"/><path d="M12 16l1.5 3M14 14l.5 3.5M26 14l-.5 3.5M28 16l-1.5 3" stroke="#FFB74D" stroke-width="1.5" stroke-linecap="round"/><circle cx="15" cy="17" r="2.5" fill="#FF6F00"/><circle cx="25" cy="17" r="2.5" fill="#FF6F00"/><path d="M13 24c2 3 4.5 3.5 7 3.5s5-.5 7-3.5" fill="#FFB74D" stroke="none"/></svg>`,
  moodSleepy: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#EDE7F6"/><line x1="12" y1="18" x2="18" y2="18" stroke="#7B68EE" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="18" x2="28" y2="18" stroke="#7B68EE" stroke-width="2" stroke-linecap="round"/><path d="M16 25c1.5.8 2.5 1 4 1s2.5-.2 4-1" fill="none" stroke="#7B68EE" stroke-width="1.5" stroke-linecap="round"/><text x="26" y="14" font-size="7" fill="#B39DDB" font-weight="bold">z</text><text x="30" y="10" font-size="5" fill="#B39DDB" font-weight="bold">z</text></svg>`,
  moodAngry: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#FFEBEE"/><line x1="11" y1="15" x2="17" y2="18" stroke="#EF5350" stroke-width="2.5" stroke-linecap="round"/><line x1="29" y1="15" x2="23" y2="18" stroke="#EF5350" stroke-width="2.5" stroke-linecap="round"/><circle cx="14" cy="20" r="1.5" fill="#EF5350"/><circle cx="26" cy="20" r="1.5" fill="#EF5350"/><line x1="15" y1="28" x2="25" y2="28" stroke="#EF5350" stroke-width="2" stroke-linecap="round"/></svg>`,
  moodLove: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#FCE4EC"/><path d="M14 17c.5-1 1-1.5 2-1.5s1.5.5 2 1.5" fill="none" stroke="#EC407A" stroke-width="1.5" stroke-linecap="round"/><path d="M22 17c.5-1 1-1.5 2-1.5s1.5.5 2 1.5" fill="none" stroke="#EC407A" stroke-width="1.5" stroke-linecap="round"/><path d="M14 24c1.5 2.5 3.5 3 6 3s4.5-.5 6-3" fill="none" stroke="#EC407A" stroke-width="2" stroke-linecap="round"/><path d="M20 8c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5 1-2.5 2.5 0 .5.1 1 .3 1.4L20 15l4.7-4.6c.2-.4.3-.9.3-1.4 0-1.5-1-2.5-2.5-2.5-1 0-2 .5-2.5 1.5z" fill="#F48FB1" opacity="0.6"/></svg>`,
  moodSurprised: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#E8F5E9"/><circle cx="15" cy="17" r="2.5" fill="#4CAF50"/><circle cx="25" cy="17" r="2.5" fill="#4CAF50"/><circle cx="20" cy="26" r="3.5" fill="none" stroke="#4CAF50" stroke-width="2"/><line x1="11" y1="11" x2="13" y2="13" stroke="#81C784" stroke-width="1.5" stroke-linecap="round"/><line x1="29" y1="11" x2="27" y2="13" stroke="#81C784" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  moodSick: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#E3F2FD"/><path d="M13 18c.5.8 1 1.2 2 1.2s1.5-.4 2-1.2" fill="none" stroke="#42A5F5" stroke-width="1.5" stroke-linecap="round"/><path d="M23 18c.5.8 1 1.2 2 1.2s1.5-.4 2-1.2" fill="none" stroke="#42A5F5" stroke-width="1.5" stroke-linecap="round"/><path d="M15 26c2-1 3-1.2 5-1.2s3 .2 5 1.2" fill="none" stroke="#42A5F5" stroke-width="1.5" stroke-linecap="round"/><line x1="8" y1="12" x2="12" y2="16" stroke="#90CAF9" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="12" x2="8" y2="16" stroke="#90CAF9" stroke-width="1.5" stroke-linecap="round"/><line x1="28" y1="8" x2="32" y2="12" stroke="#90CAF9" stroke-width="1.5" stroke-linecap="round"/><line x1="32" y1="8" x2="28" y2="12" stroke="#90CAF9" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  moodCalm: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#E8EAF6"/><line x1="13" y1="18" x2="17" y2="18" stroke="#5C6BC0" stroke-width="1.5" stroke-linecap="round"/><line x1="23" y1="18" x2="27" y2="18" stroke="#5C6BC0" stroke-width="1.5" stroke-linecap="round"/><line x1="16" y1="25" x2="24" y2="25" stroke="#5C6BC0" stroke-width="1.5" stroke-linecap="round"/><path d="M12 12c0-2 1-3 2-3" fill="none" stroke="#9FA8DA" stroke-width="1" stroke-linecap="round"/><path d="M28 12c0-2-1-3-2-3" fill="none" stroke="#9FA8DA" stroke-width="1" stroke-linecap="round"/></svg>`,

  // ============================================
  // 9. 日程待办 Schedule & Todo
  // ============================================
  todoList: (s) => _svg('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>', s),
  todoCheck: (s) => _svg('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>', s, '#4CAF50'),
  todoAdd: (s) => _svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', s, '#FF6B9D'),
  reminder: (s) => _svg('<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/><circle cx="18" cy="4" r="3" fill="#FF9800" stroke="none"/>', s, '#FF9800'),
  alarm: (s) => _svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3L2 6"/><path d="M22 6l-3-3"/><line x1="6" y1="19" x2="4" y2="21"/><line x1="18" y1="19" x2="20" y2="21"/>', s),
  calendarEvent: (s) => _svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="2" fill="#FF6B9D" stroke="none"/>', s, '#FF6B9D'),
  recurring: (s) => _svg('<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>', s, '#7B68EE'),
  priorityHigh: (s) => _svg('<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>', s, '#F44336'),
  flag: (s) => _svg('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>', s, '#FF6B9D'),
  countdown: (s) => _svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M12 2v2" stroke-width="1.5"/>', s, '#FF6B9D'),
  clock: (s) => _svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', s),
  snooze: (s) => _svg('<path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/><polyline points="23 4 23 10 17 10"/><line x1="1" y1="4" x2="23" y2="20"/>', s, '#999'),
  dueDate: (s) => _svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 15 15"/><path d="M4.93 4.93l1.41 1.41" stroke-width="1.5"/>', s, '#F44336'),
  subtask: (s) => _svg('<polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 004 4h12"/>', s),
  progress: (s) => _svg('<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>', s, '#4CAF50'),

  // ============================================
  // 10. 日历 Calendar
  // ============================================
  calendarMonth: (s) => _svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><rect x="6" y="13" width="4" height="3" rx="0.5" fill="#FF6B9D" stroke="none"/><rect x="10" y="13" width="4" height="3" rx="0.5"/><rect x="14" y="13" width="4" height="3" rx="0.5"/><rect x="6" y="17" width="4" height="3" rx="0.5"/><rect x="10" y="17" width="4" height="3" rx="0.5"/><rect x="14" y="17" width="4" height="3" rx="0.5"/>', s),
  calendarWeek: (s) => _svg('<rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="7" y1="3" x2="7" y2="21"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="17" y1="3" x2="17" y2="21"/><rect x="8" y="12" width="3" height="6" rx="0.5" fill="#FF6B9D" stroke="none"/>', s),
  calendarDay: (s) => _svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="3" fill="#FF6B9D" stroke="none"/>', s, '#FF6B9D'),
  dateRange: (s) => _svg('<rect x="3" y="4" width="7" height="7" rx="1" fill="#FF6B9D" opacity="0.15"/><rect x="14" y="13" width="7" height="7" rx="1" fill="#FF6B9D" opacity="0.15"/><path d="M10 7.5h2a2 2 0 012 2V11"/><path d="M14 16.5h-2a2 2 0 01-2-2V13"/>', s, '#FF6B9D'),
  today: (s) => _svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="1.5" fill="#FF6B9D" stroke="none"/>', s, '#FF6B9D'),
  next: (s) => _svg('<polyline points="9 18 15 12 9 6"/>', s),
  prev: (s) => _svg('<polyline points="15 18 9 12 15 6"/>', s),
  calendarAdd: (s) => _svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>', s, '#FF6B9D'),
  calendarDelete: (s) => _svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="15" x2="15" y2="19"/><line x1="15" y1="15" x2="9" y2="19"/>', s, '#F44336'),
  allDay: (s) => _svg('<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>', s, '#FFB300'),
  timeSlot: (s) => _svg('<rect x="2" y="3" width="20" height="5" rx="1"/><rect x="2" y="10" width="20" height="5" rx="1" fill="#FF6B9D" opacity="0.15"/><rect x="2" y="17" width="20" height="5" rx="1"/>', s),

  // ============================================
  // 11. 状态 Status (面性+语义色)
  // ============================================
  statusOnline: (s) => `<svg width="${s||24}" height="${s||24}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#E8F5E9"/><circle cx="12" cy="12" r="4" fill="#4CAF50"/></svg>`,
  statusOffline: (s) => `<svg width="${s||24}" height="${s||24}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#F5F5F5"/><circle cx="12" cy="12" r="4" fill="#BDBDBD"/></svg>`,
  statusBusy: (s) => `<svg width="${s||24}" height="${s||24}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#FFEBEE"/><line x1="8" y1="12" x2="16" y2="12" stroke="#F44336" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  statusAway: (s) => `<svg width="${s||24}" height="${s||24}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#FFF3E0"/><circle cx="12" cy="12" r="3" fill="none" stroke="#FF9800" stroke-width="2"/><path d="M12 3v2" stroke="#FF9800" stroke-width="1.5" stroke-linecap="round"/><path d="M12 19v2" stroke="#FF9800" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  statusDnd: (s) => `<svg width="${s||24}" height="${s||24}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#FFEBEE"/><path d="M12 4a8 8 0 010 16" fill="#F44336" opacity="0.2"/><line x1="8" y1="12" x2="16" y2="12" stroke="#F44336" stroke-width="2" stroke-linecap="round"/></svg>`,
  statusInvisible: (s) => _svg('<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>', s, '#9E9E9E'),
  petSleeping: (s) => _svg('<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/><text x="16" y="10" font-size="6" fill="#B39DDB" stroke="none" font-weight="bold">z</text><text x="19" y="7" font-size="4.5" fill="#B39DDB" stroke="none" font-weight="bold">z</text>', s, '#7B68EE'),
  petEating: (s) => _svg('<path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>', s, '#FF9800'),
  petPlaying: (s) => _svg('<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="#FF6B9D" stroke="none"/>', s, '#FF6B9D'),
  petWorking: (s) => _svg('<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>', s, '#42A5F5'),
  petBathing: (s) => _svg('<path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h1"/><path d="M8 6v1"/><path d="M11 6v1"/><path d="M14 6v1"/>', s, '#42A5F5'),
  updateAvailable: (s) => _svg('<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0115-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 01-15 6.7L3 16"/>', s, '#4CAF50'),
  syncing: (s) => _svg('<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>', s, '#42A5F5'),
  batteryLow: (s) => _svg('<rect x="1" y="6" width="18" height="12" rx="2" ry="2"/><line x1="23" y1="10" x2="23" y2="14"/><rect x="3" y="8" width="6" height="8" rx="1" fill="#F44336" stroke="none"/>', s, '#F44336'),
  levelUp: (s) => _svg('<polyline points="18 15 12 9 6 15"/><line x1="12" y1="9" x2="12" y2="21"/><path d="M4 4l2 2M20 4l-2 2" stroke-width="1.5"/>', s, '#FFB300'),

  // === Friends (social blue #42A5F5) ===
  friendAdd: (s) => _svg('<circle cx="9" cy="7" r="3"/><path d="M3 21v-1a4 4 0 014-4h4a4 4 0 014 4v1"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>', s, '#42A5F5'),
  friendRemove: (s) => _svg('<circle cx="9" cy="7" r="3"/><path d="M3 21v-1a4 4 0 014-4h4a4 4 0 014 4v1"/><line x1="16" y1="11" x2="22" y2="11"/>', s),
  friendFavorite: (s) => _svg('<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>', s, '#FF6B9D'),
  friendLevel: (s) => _svg('<path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8 2.4-7.2-6-4.8h7.6z"/>', s, '#FFB300'),
  friendBlock: (s) => _svg('<circle cx="12" cy="8" r="4"/><path d="M5 21v-1a5 5 0 015-5h4a5 5 0 014.24 2.34"/><line x1="4" y1="4" x2="20" y2="20"/>', s, '#F44336'),
  invite: (s) => _svg('<path d="M4 4h16v16H4z" rx="2"/><path d="M8 12h8M12 8v8"/>', s, '#FF6B9D'),

  // === Chat Extended (brand pink #FF6B9D) ===
  chatNew: (s) => _svg('<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/>', s, '#FF6B9D'),
  imageMsg: (s) => _svg('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>', s),
  voiceMsg: (s) => _svg('<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>', s),
  videoMsg: (s) => _svg('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>', s),
  emojiPicker: (s) => _svg('<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>', s, '#FFB300'),
  sticker: (s) => _svg('<path d="M15.5 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8.5L15.5 3z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13l2 2 4-4"/>', s, '#FF6B9D'),
  fileMsg: (s) => _svg('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>', s),
  location: (s) => _svg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>', s, '#42A5F5'),
  atMention: (s) => _svg('<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/>', s, '#7B68EE'),
  readReceipt: (s) => _svg('<polyline points="20 6 9 17 4 12"/><polyline points="22 8 11 19 8 16" opacity="0.4"/>', s, '#4CAF50'),
  quoteReply: (s) => _svg('<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/>', s),
  forward: (s) => _svg('<polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 014-4h12"/>', s),
  pinMessage: (s) => _svg('<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z"/>', s, '#FF6B9D'),
  msgSearch: (s) => _svg('<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><circle cx="11" cy="10" r="2"/><line x1="13" y1="12" x2="16" y2="15"/>', s),
  translate: (s) => _svg('<path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/>', s, '#42A5F5'),
  moodHappy: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#FFF9C4"/><path d="M13 23c2 3 4 3.5 7 3.5s5-.5 7-3.5" fill="none" stroke="#FF6B9D" stroke-width="2" stroke-linecap="round"/></svg>`,
  moodSad: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#E3F2FD"/><path d="M14 27c2-2.5 4-3 6-3s4 .5 6 3" fill="none" stroke="#42A5F5" stroke-width="2" stroke-linecap="round"/></svg>`,
  moodAngry: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#FFEBEE"/><line x1="11" y1="15" x2="17" y2="18" stroke="#EF5350" stroke-width="2.5" stroke-linecap="round"/><line x1="29" y1="15" x2="23" y2="18" stroke="#EF5350" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  moodLove: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#FCE4EC"/><path d="M14 24c1.5 2.5 3.5 3 6 3s4.5-.5 6-3" fill="none" stroke="#EC407A" stroke-width="2" stroke-linecap="round"/></svg>`,
  moodSleepy: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#EDE7F6"/><line x1="12" y1="18" x2="18" y2="18" stroke="#7B68EE" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="18" x2="28" y2="18" stroke="#7B68EE" stroke-width="2" stroke-linecap="round"/></svg>`,
  moodCalm: (s=40) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#E8EAF6"/><line x1="16" y1="25" x2="24" y2="25" stroke="#5C6BC0" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

};
