// GIF 注册表 - 所有素材的元数据
const GIFS = {
  // === 开心类 ===
  happy_hands_up: {
    file: 'HelloKitty_开心_双手举起.gif',
    category: 'happy',
    moodLevels: [4, 5],
    tags: ['idle', 'celebrate'],
    duration: 5000,
    loop: true,
    priority: 3,
  },
  happy_hug_bear: {
    file: 'HelloKitty_开心_抱小熊.gif',
    category: 'happy',
    moodLevels: [4, 5],
    tags: ['idle', 'cute'],
    duration: 6000,
    loop: true,
    priority: 2,
  },
  happy_dance: {
    file: 'HelloKitty_开心_跳舞.gif',
    category: 'happy',
    moodLevels: [5],
    tags: ['idle', 'dance', 'celebrate'],
    duration: 5000,
    loop: true,
    priority: 4,
  },
  happy_spin: {
    file: 'HelloKitty_开心_转圈.gif',
    category: 'happy',
    moodLevels: [5],
    tags: ['idle', 'dance'],
    duration: 5000,
    loop: true,
    priority: 3,
  },

  // === 微笑/常规类 ===
  smile_stand: {
    file: 'HelloKitty_微笑_站立.gif',
    category: 'calm',
    moodLevels: [3, 4],
    tags: ['idle', 'default'],
    duration: 8000,
    loop: true,
    priority: 1,
  },
  smile_stand02: {
    file: 'HelloKitty_微笑_站立02.gif',
    category: 'calm',
    moodLevels: [3, 4],
    tags: ['idle', 'default'],
    duration: 8000,
    loop: true,
    priority: 1,
  },
  heart_gesture: {
    file: 'HelloKitty_爱心_比心.gif',
    category: 'happy',
    moodLevels: [5],
    tags: ['idle', 'love', 'special'],
    duration: 5000,
    loop: true,
    priority: 5,
  },

  // === 情绪类 ===
  starry_eyes: {
    file: 'HelloKitty_期待_星星眼.gif',
    category: 'emotional',
    moodLevels: [4, 5],
    tags: ['idle', 'excited', 'wakeup'],
    duration: 4000,
    loop: true,
    priority: 3,
  },
  shy_cover_face: {
    file: 'HelloKitty_害羞_捂脸.gif',
    category: 'emotional',
    moodLevels: [2, 3],
    tags: ['idle', 'shy'],
    duration: 5000,
    loop: true,
    priority: 2,
  },
  nervous_cover_mouth: {
    file: 'HelloKitty_紧张_捂嘴.gif',
    category: 'emotional',
    moodLevels: [2],
    tags: ['idle', 'nervous'],
    duration: 5000,
    loop: true,
    priority: 2,
  },
  surprised_sit: {
    file: 'HelloKitty_惊讶_呆坐.gif',
    category: 'emotional',
    moodLevels: [1, 2],
    tags: ['idle', 'surprised', 'drag'],
    duration: 3000,
    loop: false,
    priority: 2,
  },
  surprised_exclaim: {
    file: 'HelloKitty_惊讶_感叹号.gif',
    category: 'emotional',
    moodLevels: [1, 2],
    tags: ['surprised', 'drag'],
    duration: 3000,
    loop: false,
    priority: 3,
  },
  crying: {
    file: 'HelloKitty_哭泣_流泪.gif',
    category: 'emotional',
    moodLevels: [1],
    tags: ['idle', 'sad'],
    duration: 6000,
    loop: true,
    priority: 3,
  },
  thinking: {
    file: 'HelloKitty_思考_灯泡.gif',
    category: 'calm',
    moodLevels: [3],
    tags: ['idle', 'think', 'sleepy'],
    duration: 5000,
    loop: true,
    priority: 2,
  },

  // === 动作类 ===
  writing: {
    file: 'HelloKitty_写字_记录.gif',
    category: 'action',
    moodLevels: [3, 4],
    tags: ['idle', 'work'],
    duration: 8000,
    loop: true,
    priority: 2,
  },
  singing: {
    file: 'HelloKitty_唱歌_喇叭.gif',
    category: 'action',
    moodLevels: [4, 5],
    tags: ['idle', 'sing', 'evening', 'unlock3'],
    duration: 6000,
    loop: true,
    priority: 4,
  },
  skating_ok: {
    file: 'HelloKitty_溜冰_OK.gif',
    category: 'action',
    moodLevels: [4, 5],
    tags: ['idle', 'skate', 'unlock3'],
    duration: 6000,
    loop: true,
    priority: 3,
  },
  skating_pink: {
    file: 'HelloKitty_溜冰_OK_粉衣.gif',
    category: 'action',
    moodLevels: [5],
    tags: ['idle', 'skate', 'special', 'unlock4'],
    duration: 6000,
    loop: true,
    priority: 5,
  },
  peeking: {
    file: 'HelloKitty_偷看_探头.gif',
    category: 'action',
    moodLevels: [2, 3],
    tags: ['idle', 'peek', 'easter_egg'],
    duration: 4000,
    loop: false,
    priority: 3,
  },
  sleeping: {
    file: 'HelloKitty_睡觉_侧卧.gif',
    category: 'action',
    moodLevels: [1, 2, 3, 4, 5],
    tags: ['sleep', 'night'],
    duration: 15000,
    loop: true,
    priority: 10,
  },

  // === 互动类 ===
  nodding: {
    file: 'HelloKitty_点头_嗯嗯.gif',
    category: 'interactive',
    moodLevels: [3, 4, 5],
    tags: ['click', 'agree'],
    duration: 3000,
    loop: false,
    priority: 2,
  },
  ok_bear: {
    file: 'HelloKitty_好的_小熊.gif',
    category: 'interactive',
    moodLevels: [3, 4, 5],
    tags: ['click', 'agree', 'feed'],
    duration: 4000,
    loop: false,
    priority: 2,
  },
  morning_bear: {
    file: 'HelloKitty_早呀_小熊.gif',
    category: 'interactive',
    moodLevels: [3, 4, 5],
    tags: ['morning', 'greet'],
    duration: 5000,
    loop: false,
    priority: 8,
  },
  reject_no: {
    file: 'HelloKitty_拒绝_NO.gif',
    category: 'interactive',
    moodLevels: [1, 2, 3, 4, 5],
    tags: ['reject', 'annoyed'],
    duration: 3000,
    loop: false,
    priority: 10,
  },
  medical_kit: {
    file: 'HelloKitty_医疗_急救箱.gif',
    category: 'interactive',
    moodLevels: [1, 2, 3, 4, 5],
    tags: ['heal', 'special'],
    duration: 5000,
    loop: false,
    priority: 8,
  },
};

// 动画池定义
const ANIMATION_POOLS = {
  idle_ecstatic: ['happy_dance', 'happy_spin', 'happy_hands_up', 'heart_gesture', 'singing', 'skating_ok', 'skating_pink'],
  idle_happy: ['smile_stand', 'smile_stand02', 'nodding', 'starry_eyes', 'happy_hug_bear', 'happy_hands_up'],
  idle_neutral: ['smile_stand', 'smile_stand02', 'writing', 'singing', 'thinking', 'ok_bear'],
  idle_sad: ['nervous_cover_mouth', 'shy_cover_face', 'peeking', 'smile_stand'],
  idle_depressed: ['crying', 'surprised_sit', 'shy_cover_face'],

  morning_greet: ['morning_bear', 'smile_stand'],
  night_sleep: ['sleeping'],
  sleepy_transition: ['thinking', 'surprised_sit'],

  drag_react: ['surprised_exclaim', 'surprised_sit'],
  click_happy: ['happy_hug_bear', 'ok_bear', 'nodding', 'happy_hands_up'],
  click_reject: ['reject_no'],

  feed_react: ['happy_hands_up', 'ok_bear'],
  play_react: ['happy_dance', 'happy_spin', 'skating_ok', 'skating_pink'],
  heal_react: ['medical_kit'],
  sing_action: ['singing'],
  skate_action: ['skating_ok', 'skating_pink'],

  easter_eggs: ['peeking', 'heart_gesture', 'skating_pink'],

  // 新增：番茄钟专用池
  pomodoro_work: ['writing', 'thinking', 'smile_stand'],
  pomodoro_break: ['happy_dance', 'happy_spin', 'happy_hands_up', 'skating_ok'],
  // 新增：庆祝序列
  celebration: ['heart_gesture', 'happy_dance', 'happy_spin', 'starry_eyes'],

  // 新增：亲密度解锁动作池
  gift_react: ['happy_hands_up', 'heart_gesture', 'happy_dance'],
  hug_react: ['happy_hug_bear', 'heart_gesture'],
  secret_react: ['starry_eyes', 'thinking'],
};

// 心情等级到动画池的映射
const MOOD_TO_POOL = {
  5: 'idle_ecstatic',
  4: 'idle_happy',
  3: 'idle_neutral',
  2: 'idle_sad',
  1: 'idle_depressed',
};

// 心情等级名称
const MOOD_NAMES = {
  5: '超开心',
  4: '开心',
  3: '一般',
  2: '不开心',
  1: '难过',
};

// 亲密度等级定义（8级体系）
const AFFINITY_LEVELS = [
  { level: 1, min: 0, max: 29, name: '初遇', emoji: '🤍' },
  { level: 2, min: 30, max: 99, name: '相识', emoji: '💛' },
  { level: 3, min: 100, max: 249, name: '友好', emoji: '💚' },
  { level: 4, min: 250, max: 499, name: '信赖', emoji: '💙' },
  { level: 5, min: 500, max: 899, name: '亲密', emoji: '💗' },
  { level: 6, min: 900, max: 1499, name: '挚友', emoji: '💖' },
  { level: 7, min: 1500, max: 2199, name: '心灵相通', emoji: '💝' },
  { level: 8, min: 2200, max: Infinity, name: '传说之约', emoji: '💎' },
];

const AFFINITY_MAX = 2500;

// 时段定义（粗粒度，4段）
const TIME_PERIODS = {
  morning: { start: 6, end: 8 },
  daytime: { start: 9, end: 17 },
  evening: { start: 18, end: 21 },
  night: { start: 22, end: 5 },
};

// 精细时段定义（11段，用于问候和自言自语）
const FINE_TIME_PERIODS = {
  early_morning: { start: 6, end: 7, greeting: '早安~' },
  morning: { start: 8, end: 9, greeting: '上午好~' },
  late_morning: { start: 10, end: 11, greeting: '快中午了~' },
  lunch: { start: 12, end: 12, greeting: '午饭时间~' },
  nap: { start: 13, end: 13, greeting: '午休时间~' },
  afternoon: { start: 14, end: 16, greeting: '下午好~' },
  off_work: { start: 17, end: 17, greeting: '下班/放学啦~' },
  dinner: { start: 18, end: 18, greeting: '该吃晚饭了~' },
  evening: { start: 19, end: 20, greeting: '晚上好~' },
  late_evening: { start: 21, end: 21, greeting: '该休息了~' },
  night: { start: 22, end: 5, greeting: '晚安~' },
};

// 窗口配置
const WINDOW_CONFIG = {
  width: 192,
  height: 243,
  gifWidth: 179,
};

module.exports = {
  GIFS,
  ANIMATION_POOLS,
  MOOD_TO_POOL,
  MOOD_NAMES,
  AFFINITY_LEVELS,
  AFFINITY_MAX,
  TIME_PERIODS,
  FINE_TIME_PERIODS,
  WINDOW_CONFIG,
};
