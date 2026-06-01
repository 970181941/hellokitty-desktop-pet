/**
 * 从数组中随机选取一个元素
 */
function randomPick(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 从数组中按权重随机选取
 * items: [{id, priority}] 或简单数组（等权重）
 */
function weightedRandomPick(items) {
  if (!items || items.length === 0) return null;
  if (typeof items[0] === 'string') return randomPick(items);

  const totalWeight = items.reduce((sum, item) => sum + (item.priority || 1), 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= (item.priority || 1);
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

/**
 * 生成 min 到 max 之间的随机整数
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 获取当前时段
 */
function getCurrentTimePeriod() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour <= 8) return 'morning';
  if (hour >= 9 && hour <= 17) return 'daytime';
  if (hour >= 18 && hour <= 21) return 'evening';
  return 'night'; // 22-5
}

/**
 * 获取今天的日期字符串 YYYY-MM-DD
 */
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 限制数值范围
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取当前精细时段
 */
function getFineTimePeriod() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour <= 7) return 'early_morning';
  if (hour >= 8 && hour <= 9) return 'morning';
  if (hour >= 10 && hour <= 11) return 'late_morning';
  if (hour === 12) return 'lunch';
  if (hour === 13) return 'nap';
  if (hour >= 14 && hour <= 16) return 'afternoon';
  if (hour === 17) return 'off_work';
  if (hour === 18) return 'dinner';
  if (hour >= 19 && hour <= 20) return 'evening';
  if (hour === 21) return 'late_evening';
  return 'night'; // 22-5
}

/**
 * 将秒数格式化为 MM:SS
 */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * 获取精细时段的问候语
 */
function getGreetingForPeriod(periodId) {
  const { FINE_TIME_PERIODS } = require('./constants');
  const period = FINE_TIME_PERIODS[periodId];
  return period ? period.greeting : '';
}

/**
 * 比较两个日期字符串是否同一天 (支持 MM-DD 和 YYYY-MM-DD)
 */
function isSameDay(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return false;
  // 统一为 MM-DD 格式比较
  const normalize = (s) => {
    if (s.length === 5) return s; // MM-DD
    if (s.length === 10) return s.slice(5); // YYYY-MM-DD → MM-DD
    return s;
  };
  return normalize(dateStr1) === normalize(dateStr2);
}

/**
 * 计算两个日期之间的天数差（包含首日，相识当天 = 1 天）
 */
function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diff = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * 获取今天 MM-DD 格式
 */
function getTodayMMDD() {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = {
  randomPick,
  weightedRandomPick,
  randomInt,
  getCurrentTimePeriod,
  getFineTimePeriod,
  getTodayStr,
  getTodayMMDD,
  clamp,
  delay,
  formatTime,
  getGreetingForPeriod,
  isSameDay,
  daysBetween,
};
