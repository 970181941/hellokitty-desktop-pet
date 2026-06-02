// 皮肤主题定义 — 基于 HelloKitty 配色方案设计稿
// 设计理念：经典 Kitty 色调、柔光圆底、情绪色彩联动
// 6 套皮肤：经典/马卡龙/霓虹/暗夜/春樱/圣诞

const SKINS = {

  // ─── 经典原版 ───
  classic: {
    name: '经典原版',
    bg: '#FFF0F5',
    bgAlt: '#FFF5F9',
    primary: '#FF6B9D',
    primaryLight: '#FFD4E5',
    primaryDark: '#E0527D',
    border: '#FFD4E5',
    textMuted: '#8B5A6B',
    surface: '#FFE4EC',
    gradient: 'linear-gradient(135deg, #FFD4E5 0%, #FF6B9D 50%, #E0527D 100%)',
    shadowColor: 'rgba(255, 107, 157, 0.20)',
    accent: '#FFB300',
    pattern: 'radial-gradient(circle, #FFD4E5 1px, transparent 1px)',
    bubbleUser: 'linear-gradient(135deg, #FF6B9D, #E0527D)',
    tag: '🎀',
    dark: false,
  },

  // ─── 奶油马卡龙 ───
  macaron: {
    name: '奶油马卡龙',
    bg: '#FFF9F0',
    bgAlt: '#FFFCF5',
    primary: '#B5D8CC',
    primaryLight: '#F2D7D9',
    primaryDark: '#8DB8AA',
    border: '#F2D7D9',
    textMuted: '#7A6A5E',
    surface: '#F5EAE0',
    gradient: 'linear-gradient(135deg, #F2D7D9 0%, #B5D8CC 50%, #8DB8AA 100%)',
    shadowColor: 'rgba(181, 216, 204, 0.20)',
    accent: '#E8D5B7',
    pattern: 'radial-gradient(circle at 30% 30%, rgba(181,216,204,0.06) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(242,215,217,0.06) 0%, transparent 50%)',
    bubbleUser: 'linear-gradient(135deg, #B5D8CC, #8DB8AA)',
    tag: '🧁',
    dark: false,
  },

  // ─── 糖果霓虹 ───
  neon: {
    name: '糖果霓虹',
    bg: '#1A1A2E',
    bgAlt: '#16162B',
    primary: '#FF006E',
    primaryLight: '#8338EC',
    primaryDark: '#CC0058',
    border: '#3A3A5C',
    textMuted: '#A0A0C0',
    surface: '#252540',
    gradient: 'linear-gradient(135deg, #8338EC 0%, #FF006E 40%, #FB5607 80%, #06D6A0 100%)',
    shadowColor: 'rgba(255, 0, 110, 0.25)',
    accent: '#06D6A0',
    pattern: 'radial-gradient(1.5px 1.5px at 20% 30%, rgba(255,0,110,0.25) 0%, transparent 100%), radial-gradient(1.5px 1.5px at 60% 70%, rgba(131,56,236,0.22) 0%, transparent 100%), radial-gradient(1px 1px at 80% 20%, rgba(6,214,160,0.20) 0%, transparent 100%)',
    bubbleUser: 'linear-gradient(135deg, #FF006E, #FB5607)',
    tag: '✨',
    dark: true,
  },

  // ─── 暗夜星梦 ───
  night: {
    name: '暗夜星梦',
    bg: '#1A1A2E',
    bgAlt: '#16162B',
    primary: '#7B68EE',
    primaryLight: '#B39DDB',
    primaryDark: '#5A48CC',
    border: '#3A3A5C',
    textMuted: '#A0A0C0',
    surface: '#252540',
    gradient: 'linear-gradient(135deg, #B39DDB 0%, #7B68EE 50%, #5A48CC 100%)',
    shadowColor: 'rgba(123, 104, 238, 0.25)',
    accent: '#FFD700',
    pattern: 'radial-gradient(1.5px 1.5px at 15% 25%, rgba(255,215,0,0.25) 0%, transparent 100%), radial-gradient(1px 1px at 45% 65%, rgba(123,104,238,0.30) 0%, transparent 100%), radial-gradient(1.5px 1.5px at 75% 35%, rgba(179,157,219,0.22) 0%, transparent 100%), radial-gradient(1px 1px at 85% 80%, rgba(255,215,0,0.18) 0%, transparent 100%)',
    bubbleUser: 'linear-gradient(135deg, #7B68EE, #5A48CC)',
    tag: '🌙',
    dark: true,
  },

  // ─── 春樱 ───
  spring: {
    name: '春樱',
    bg: '#FFF5F7',
    bgAlt: '#FFF8FA',
    primary: '#FFB7C5',
    primaryLight: '#FF9AA2',
    primaryDark: '#E89AAA',
    border: '#FFD0D8',
    textMuted: '#8B5A6B',
    surface: '#FFE8EC',
    gradient: 'linear-gradient(135deg, #FF9AA2 0%, #FFB7C5 50%, #E89AAA 100%)',
    shadowColor: 'rgba(255, 183, 197, 0.20)',
    accent: '#C8E6C9',
    pattern: 'radial-gradient(ellipse at 20% 30%, rgba(255,183,197,0.08) 0%, transparent 40%), radial-gradient(ellipse at 80% 70%, rgba(255,154,162,0.06) 0%, transparent 40%), radial-gradient(circle at 50% 90%, rgba(200,230,201,0.05) 0%, transparent 30%)',
    bubbleUser: 'linear-gradient(135deg, #FFB7C5, #E89AAA)',
    tag: '🌸',
    dark: false,
  },

  // ─── 圣诞 ───
  christmas: {
    name: '圣诞',
    bg: '#FFF8F0',
    bgAlt: '#FFFBF5',
    primary: '#E53935',
    primaryLight: '#EF9A9A',
    primaryDark: '#C62828',
    border: '#FFCDD2',
    textMuted: '#8B5A5A',
    surface: '#FFE8E0',
    gradient: 'linear-gradient(135deg, #EF9A9A 0%, #E53935 40%, #2E7D32 70%, #FFD54F 100%)',
    shadowColor: 'rgba(229, 57, 53, 0.20)',
    accent: '#FFD54F',
    pattern: 'radial-gradient(circle at 25% 25%, rgba(229,57,53,0.06) 0%, transparent 40%), radial-gradient(circle at 75% 75%, rgba(46,125,50,0.05) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(255,213,79,0.04) 0%, transparent 30%)',
    bubbleUser: 'linear-gradient(135deg, #E53935, #C62828)',
    tag: '🎄',
    dark: false,
  },
};

// === 情绪色彩体系 ===
// 8 种情绪状态，每种 3 色（主色/辅色/背景色）
// 宠物根据当前心情自动切换色调
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
// moodLevel: 1=低落 2=不佳 3=一般 4=开心 5=超开心
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

/**
 * 将旧皮肤 ID 迁移为新皮肤 ID
 * 如果已经是新 ID 则直接返回
 */
function migrateSkinId(oldId) {
  if (SKINS[oldId]) return oldId;
  return LEGACY_SKIN_MAP[oldId] || 'classic';
}
