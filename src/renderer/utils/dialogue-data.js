// 关键词回复规则（按优先级从高到低排列）
// 每条规则: { id, keywords[], requireAll?, replies[], gifId, dynamic? }
// replies 中的 {name} 会被替换为主人名字, {days} 替换为相识天数, {time} 替换为当前时间
const KEYWORD_RULES = [
  {
    id: 'time_query',
    keywords: ['几点', '时间', '什么时候', '几点了'],
    replies: ['现在是{time}哦~', '让 Kitty 看看... 现在{time}！'],
    gifId: 'thinking',
    dynamic: true,
  },
  {
    id: 'self_identity',
    keywords: ['你叫什么', '你是谁', '你的名字', 'hello kitty'],
    replies: ['我是 Kitty 呀~ 你的桌面小伙伴！', '当然是 Hello Kitty 啦~'],
    gifId: 'happy_hands_up',
  },
  {
    id: 'owner_identity',
    keywords: ['我是谁', '我叫什么', '我叫啥'],
    replies: ['你是我最重要的{name}呀~', '{name}！Kitty 最喜欢的人！'],
    gifId: 'heart_gesture',
    fallbackReplies: ['嗯...我们好像还没正式认识呢~'],
    fallbackGifId: 'thinking',
  },
  {
    id: 'greeting_morning',
    keywords: ['早上好', '早安', '早呀', 'good morning'],
    replies: ['早安~ 今天也要元气满满哦！', '早上好呀~ 新的一天开始啦！'],
    gifId: 'morning_bear',
  },
  {
    id: 'greeting_general',
    keywords: ['你好', '嗨', 'hi', 'hello', 'hey', '哈喽'],
    replies: ['{name}~你好呀！', '嗨嗨~ 见到你真开心！', '你好呀~ 今天心情怎么样？'],
    gifId: 'starry_eyes',
  },
  {
    id: 'love',
    keywords: ['喜欢你', '爱你', '么么', '亲亲', '比心', 'mua', 'love'],
    replies: ['我也最喜欢{name}了！', '嘿嘿，好害羞~', 'Kitty 也爱你哟~'],
    gifId: 'heart_gesture',
  },
  {
    id: 'sad',
    keywords: ['不开心', '难过', '伤心', '委屈', '哭了', '郁闷', '丧', 'emo'],
    replies: ['别难过了，Kitty 陪着你~', '摸摸头，一切都会好起来的！', '抱抱~ Kitty 给你力量！'],
    gifId: 'happy_hug_bear',
  },
  {
    id: 'angry',
    keywords: ['生气', '烦', '讨厌', '气死', '暴躁'],
    replies: ['深呼吸~ 吸——呼——', 'Kitty 帮你把坏心情赶走！', '别生气啦，笑一个~'],
    gifId: 'happy_spin',
  },
  {
    id: 'tired',
    keywords: ['好累', '累了', '困了', '疲惫', '加班', '熬夜'],
    replies: ['辛苦了~ 休息一下吧', '要不要和 Kitty 一起打个盹？', '{name}辛苦了，抱抱~'],
    gifId: 'thinking',
  },
  {
    id: 'bored',
    keywords: ['无聊', '没事做', '好闷', '好无聊'],
    replies: ['那我们来玩吧！', '要不要看 Kitty 跳舞？', '去散散步怎么样~', '不如看看 Kitty 溜冰！'],
    gifId: 'happy_dance',
  },
  {
    id: 'praise',
    keywords: ['好棒', '厉害', '可爱', '真乖', '好乖', '漂亮'],
    replies: ['嘿嘿~ 被夸了好开心！', '谢谢夸奖~', 'Kitty 会更努力的！'],
    gifId: 'happy_hands_up',
  },
  {
    id: 'thanks',
    keywords: ['谢谢', '感谢', '多谢', 'thx', 'thanks'],
    replies: ['不客气~', '能帮到你 Kitty 很开心！', '嘿嘿~ 不用谢啦'],
    gifId: 'nodding',
  },
  {
    id: 'food',
    keywords: ['吃什么', '饿了', '午饭', '晚饭', '早餐', '吃饭', '零食'],
    replies: ['Kitty 想吃蛋糕！', '该吃饭啦~ 不要饿肚子哦', '一起吃饭吧~'],
    gifId: 'ok_bear',
  },
  {
    id: 'work',
    keywords: ['工作', '上班', '加班', '学习', '考试', '作业', '写代码', '开会'],
    replies: ['认真工作的{name}好帅~', '加油！Kitty 给你打气！', '工作辛苦了~ 要适度休息哦'],
    gifId: 'writing',
  },
  {
    id: 'weather',
    keywords: ['天气', '下雨', '晴天', '好冷', '好热', '下雪'],
    replies: ['不管什么天气，有{name}在就是好天气~', '注意保暖/防暑哦~'],
    gifId: 'smile_stand',
  },
  {
    id: 'bye',
    keywords: ['再见', '拜拜', '走了', 'bye', '出门了', '出去一下'],
    replies: ['路上小心~ 早点回来！', '等你回来哦~', '拜拜~ Kitty 在这里等你'],
    gifId: 'happy_hands_up',
  },
  {
    id: 'night',
    keywords: ['晚安', '睡了', '睡觉', '困了睡'],
    replies: ['晚安~ 做个好梦！', 'Kitty 也困了... zzZ', '好梦~ 明天见！'],
    gifId: 'sleeping',
  },
  {
    id: 'days_query',
    keywords: ['认识多久', '多少天', '几天了', '相识'],
    replies: ['我们已经认识{days}天啦~', '从第一次见面到现在已经{days}天了！时间过得好快~'],
    gifId: 'heart_gesture',
    dynamic: true,
  },
  {
    id: 'birthday',
    keywords: ['生日', 'birthday'],
    replies: ['{name}的生日 Kitty 记得呢~', '生日？让 Kitty 想想...'],
    gifId: 'heart_gesture',
  },
  {
    id: 'sing',
    keywords: ['唱歌', '唱首歌', '来一首'],
    replies: ['啦啦啦~ Kitty 给你唱首歌~', 'Kitty 最喜欢唱歌了！'],
    gifId: 'singing',
  },
  {
    id: 'dance',
    keywords: ['跳舞', '来一段', '表演'],
    replies: ['看 Kitty 跳舞！', '音乐起~ 转圈圈！'],
    gifId: 'happy_dance',
  },
];

// 默认回复（无匹配时随机选取）
const DEFAULT_REPLIES = [
  { text: '嗯嗯~ Kitty 在听呢~', gifId: 'nodding' },
  { text: '说的对！', gifId: 'ok_bear' },
  { text: 'Kitty 不太懂...但是很开心你在和我说话~', gifId: 'thinking' },
  { text: '喵？', gifId: 'surprised_exclaim' },
  { text: '嗯~ 然后呢？', gifId: 'starry_eyes' },
  { text: '哇~ 好有趣！', gifId: 'happy_hands_up' },
  { text: 'Kitty 点点头~', gifId: 'nodding' },
];

// 自言自语台词库
const SELF_TALK_LINES = {
  // 按心情分类
  high_mood: [
    '今天心情好好~', '想跳舞！', '啦啦啦~', '好开心呀~',
    '世界真美好！', '嘿嘿~', '开心得想转圈圈~', '幸福的一天~',
  ],
  normal_mood: [
    '今天天气怎么样呢~', '有点无聊...', '嗯...在想什么呢~',
    '发个呆~', 'Kitty 在这里~', '悠闲的一天~',
  ],
  low_mood: [
    '好无聊...', '想你了...', '都不理我...',
    '好寂寞呀...', '要不要来陪陪 Kitty~', '好孤单...',
  ],

  // 按时段分类
  early_morning: ['新的一天~ 早上好！', '今天也要加油哦~', '早安~ 吃过早餐了吗？'],
  morning: ['认真工作的样子好帅~', '上午好~', '要不要休息一下~'],
  late_morning: ['快中午了~', '肚子有点饿了呢~'],
  lunch: ['该吃饭啦~', '午饭吃什么好呢~', '肚子好饿~'],
  nap: ['午休时间~ 打个盹吧', '好困...要不要一起午睡？'],
  afternoon: ['下午茶时间~', '下午好~', '困了...要不要打个盹？'],
  off_work: ['辛苦一天了~', '下班/放学了~', '终于忙完了~'],
  dinner: ['该吃晚饭啦~', '晚饭吃什么好呢~'],
  evening: ['晚上好~', '今天过得怎么样？', '放松一下吧~'],
  late_evening: ['该休息了~', '早点睡哦~', '明天还要早起呢~'],
  night: ['该睡觉了...', '好困... 晚安~', '明天见~'],

  // 使用主人名字的台词（亲密度>=4时）
  with_name: [
    '{name}，陪我玩嘛~', '{name}~ 在看什么呢？',
    '{name}今天辛苦啦~', '最喜欢{name}了！',
    '{name}，给 Kitty 摸摸头~', '{name}~ Kitty 在这里哦',
    '有{name}在好安心~', '{name}笑起来好好看~',
  ],

  // 相识里程碑
  milestones: {
    7: '我们认识一周了耶！好开心~',
    30: '已经一个月了~ 时间过得好快！',
    100: '100 天纪念日！我们的羁绊好深~',
    365: '一年了！感谢你一直陪着 Kitty~',
  },

  // 亲密度分级台词池
  acquaintance: [
    '认识{name}好开心~', '{name}是个好人呢~',
    '和{name}聊天好有趣~', '{name}笑起来好好看~',
    '有{name}在好安心~', '今天也见到{name}了~',
  ],
  close_bond: [
    '{name}是Kitty最重要的人~', '想{name}了...',
    '和{name}在一起好幸福~', '{name}不在的时候好寂寞...',
    '最喜欢{name}的声音了~', '{name}~ 给Kitty抱抱~',
    '有{name}陪着就是最开心的事~',
  ],
  soulmate: [
    'Kitty和{name}心灵相通了~', '永远在一起好不好~',
    '{name}的心情Kitty都懂~', '和{name}在一起时间过得好快~',
    '{name}就是Kitty的全世界~', '不管什么时候Kitty都在{name}身边~',
  ],
  legend: [
    '传说中的羁绊...', '{name}是Kitty生命中最重要的人！',
    'Kitty和{name}的羁绊永远不会消失~', '这份感情比什么都珍贵~',
    '{name}...谢谢你一直陪着Kitty~',
  ],
};

// 生日特殊台词
const BIRTHDAY_LINES = [
  '今天是{name}的生日！生日快乐！',
  'Happy Birthday~ Kitty 祝你天天开心！',
  '{name}生日快乐！永远快乐！',
];

// 报时文案模板
const TIME_ANNOUNCEMENT_TEMPLATES = [
  '{name}，现在{hour}点了~',
  '现在{hour}点{minute}~',
  '{hour}点啦~ 时间过得好快！',
];

// 回归消息
const RETURN_MESSAGES = [
  '你终于回来了！Kitty好想你~',
  '好久不见...Kitty好寂寞...',
  '{name}！Kitty等你好久了~',
  '你还记得Kitty呀...好开心！',
  '{name}回来了！今天要多陪陪Kitty哦~',
];

// 升级消息
const LEVEL_UP_MESSAGES = {
  2: '我们更熟了呢~ 好开心！',
  3: 'Kitty觉得我们已经是好朋友了！',
  4: 'Kitty好信赖{name}~ 我们的关系更进一步了！',
  5: '好亲密呀~ Kitty最喜欢{name}了！',
  6: '我们是最好的朋友！永远不分开好不好~',
  7: 'Kitty和{name}心灵相通了！好幸福~',
  8: '传说中的羁绊...{name}是Kitty生命中最重要的人！',
};

// Kitty 的秘密（Level 8 解锁）
const SECRET_FACTS = [
  'Kitty其实最喜欢吃苹果派了~',
  '你知道吗？Kitty的蝴蝶结是红色的哦~',
  'Kitty偷偷告诉你...Kitty会做蛋糕！',
  'Kitty最喜欢在下雨天听雨声~',
  '其实Kitty还会弹钢琴哦~',
  'Kitty的梦想是环游世界！',
  'Kitty最喜欢的颜色是红色和粉色~',
  'Kitty有一个双胞胎妹妹叫Mimmy~',
  'Kitty最喜欢妈妈做的苹果派~',
  'Kitty的体重是3个苹果那么重~',
];

module.exports = {
  KEYWORD_RULES,
  DEFAULT_REPLIES,
  SELF_TALK_LINES,
  BIRTHDAY_LINES,
  TIME_ANNOUNCEMENT_TEMPLATES,
  RETURN_MESSAGES,
  LEVEL_UP_MESSAGES,
  SECRET_FACTS,
};
