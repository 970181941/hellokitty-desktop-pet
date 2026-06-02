// 皮肤主题定义 — 基于 Application UI Color Design v2.0
// 设计理念：专业现代 UI，品牌色 + 中性色阶体系
// 皮肤只覆盖品牌色相关变量，共享中性色阶/文字/边框/阴影
// 6 套皮肤：经典原版/奶油马卡龙/糖果霓虹/暗夜星梦/春樱/圣诞

const SKINS = {

  // ─── 经典原版 Classic Pink ───
  classic: {
    name: '经典原版',
    primary: '#FF6B9D',
    primaryHover: '#FF508A',
    primaryActive: '#E0457A',
    primaryLight: '#FFD4E5',
    primaryUltraLight: '#FFF0F5',
    secondary: '#FFB7C5',
    accent: '#FFB300',
    bubbleUser: '#FF6B9D',
    textBrand: '#FF6B9D',
    shadowBrand: 'rgba(255,107,157,0.25)',
    hoverOverlay: 'rgba(255,107,157,0.06)',
    activeOverlay: 'rgba(255,107,157,0.12)',
    focusRing: 'rgba(255,107,157,0.35)',
    dividerBrand: '#FFD4E5',
    dark: false,
    tag: '🎀',
  },

  // ─── 奶油马卡龙 Macaron ───
  macaron: {
    name: '奶油马卡龙',
    primary: '#8DB8AA',
    primaryHover: '#7DA89A',
    primaryActive: '#6D988A',
    primaryLight: '#D4E8E0',
    primaryUltraLight: '#F0F8F5',
    secondary: '#F2D7D9',
    accent: '#E8D5B7',
    bubbleUser: '#8DB8AA',
    textBrand: '#8DB8AA',
    shadowBrand: 'rgba(141,184,170,0.25)',
    hoverOverlay: 'rgba(141,184,170,0.06)',
    activeOverlay: 'rgba(141,184,170,0.12)',
    focusRing: 'rgba(141,184,170,0.35)',
    dividerBrand: '#D4E8E0',
    dark: false,
    tag: '🧁',
  },

  // ─── 糖果霓虹 Neon ───
  neon: {
    name: '糖果霓虹',
    primary: '#FF006E',
    primaryHover: '#E60063',
    primaryActive: '#CC0058',
    primaryLight: '#8338EC',
    primaryUltraLight: '#2A2040',
    secondary: '#3A86FF',
    accent: '#06D6A0',
    bubbleUser: '#FF006E',
    textBrand: '#FF85B1',
    shadowBrand: 'rgba(255,0,110,0.3)',
    hoverOverlay: 'rgba(255,0,110,0.1)',
    activeOverlay: 'rgba(255,0,110,0.18)',
    focusRing: 'rgba(255,0,110,0.35)',
    dividerBrand: '#3A3A5C',
    dark: true,
    tag: '✨',
  },

  // ─── 暗夜星梦 Night ───
  night: {
    name: '暗夜星梦',
    primary: '#7B68EE',
    primaryHover: '#6A58DD',
    primaryActive: '#5A48CC',
    primaryLight: '#B39DDB',
    primaryUltraLight: '#252540',
    secondary: '#FFD700',
    accent: '#FFD700',
    bubbleUser: '#7B68EE',
    textBrand: '#B39DDB',
    shadowBrand: 'rgba(123,104,238,0.3)',
    hoverOverlay: 'rgba(123,104,238,0.1)',
    activeOverlay: 'rgba(123,104,238,0.18)',
    focusRing: 'rgba(123,104,238,0.35)',
    dividerBrand: '#3A3A5C',
    dark: true,
    tag: '🌙',
  },

  // ─── 春樱 Spring Sakura ───
  spring: {
    name: '春樱',
    primary: '#F48FB1',
    primaryHover: '#EC407A',
    primaryActive: '#E91E63',
    primaryLight: '#FCE4EC',
    primaryUltraLight: '#FFF5F7',
    secondary: '#FF9AA2',
    accent: '#C8E6C9',
    bubbleUser: '#F48FB1',
    textBrand: '#F48FB1',
    shadowBrand: 'rgba(244,143,177,0.25)',
    hoverOverlay: 'rgba(244,143,177,0.06)',
    activeOverlay: 'rgba(244,143,177,0.12)',
    focusRing: 'rgba(244,143,177,0.35)',
    dividerBrand: '#FCE4EC',
    dark: false,
    tag: '🌸',
  },

  // ─── 圣诞 Christmas ───
  christmas: {
    name: '圣诞',
    primary: '#E53935',
    primaryHover: '#D32F2F',
    primaryActive: '#C62828',
    primaryLight: '#FFCDD2',
    primaryUltraLight: '#FFF8F0',
    secondary: '#2E7D32',
    accent: '#FFD54F',
    bubbleUser: '#E53935',
    textBrand: '#E53935',
    shadowBrand: 'rgba(229,57,53,0.25)',
    hoverOverlay: 'rgba(229,57,53,0.06)',
    activeOverlay: 'rgba(229,57,53,0.12)',
    focusRing: 'rgba(229,57,53,0.35)',
    dividerBrand: '#FFCDD2',
    dark: false,
    tag: '🎄',
  },
};

// === 情绪色彩体系 ===
const EMOTIONS = {
  happy:   { name: '开心', emoji: '😊', primary: '#FF6B9D', secondary: '#FFD54F', bg: '#FFF9C4' },
  sleepy:  { name: '困倦', emoji: '😴', primary: '#7B68EE', secondary: '#B39DDB', bg: '#EDE7F6' },
  hungry:  { name: '饥饿', emoji: '🤤', primary: '#FF8A65', secondary: '#FFCC80', bg: '#FFF3E0' },
  angry:   { name: '生气', emoji: '😤', primary: '#EF5350', secondary: '#FF8A80', bg: '#FFEBEE' },
  love:    { name: '恋爱', emoji: '💕', primary: '#EC407A', secondary: '#F48FB1', bg: '#FCE4EC' },
  cold:    { name: '生病', emoji: '🤒', primary: '#42A5F5', secondary: '#90CAF9', bg: '#E3F2FD' },
  excited: { name: '兴奋', emoji: '🤩', primary: '#FF6F00', secondary: '#FFB74D', bg: '#FFF8E1' },
  normal:  { name: '日常', emoji: '😐', primary: '#FFB7C5', secondary: '#FFFFFF', bg: '#FFF0F5' },
};

// 心情等级 → 情绪映射
const MOOD_TO_EMOTION = {
  1: 'cold',
  2: 'sleepy',
  3: 'normal',
  4: 'happy',
  5: 'excited',
};

// === 旧皮肤 ID 迁移映射 ===
const LEGACY_SKIN_MAP = {
  sakura:   'classic',
  candy:    'neon',
  rose:     'classic',
  ocean:    'macaron',
  starry:   'night',
  arctic:   'night',
  lavender: 'night',
  grape:    'night',
  mint:     'macaron',
  matcha:   'macaron',
  peach:    'christmas',
  sunset:   'christmas',
};

function migrateSkinId(oldId) {
  if (SKINS[oldId]) return oldId;
  return LEGACY_SKIN_MAP[oldId] || 'classic';
}
