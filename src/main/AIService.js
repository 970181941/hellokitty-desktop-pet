const store = require('./store');
const WebSearchService = require('./WebSearchService');

// 合法 GIF ID 白名单
const VALID_GIF_IDS = [
  'happy_hands_up', 'happy_hug_bear', 'happy_dance', 'happy_spin',
  'smile_stand', 'smile_stand02', 'heart_gesture', 'starry_eyes',
  'shy_cover_face', 'nervous_cover_mouth', 'surprised_sit',
  'surprised_exclaim', 'crying', 'thinking', 'writing', 'singing',
  'skating_ok', 'skating_pink', 'peeking', 'sleeping', 'nodding',
  'ok_bear', 'morning_bear', 'reject_no', 'medical_kit',
];

const API_ENDPOINT = 'https://api.deepseek.com/chat/completions';
const DEFAULT_MODEL = 'deepseek-v4-flash';
const TIMEOUT_MS = 15000;

// GIF 动画列表（两个 prompt 共用）
const GIF_TABLE = `| gifId | 描述 | 适用场景 |
|-------|------|---------|
| happy_hands_up | 开心双手举起 | 开心、庆祝、打招呼 |
| happy_hug_bear | 开心抱小熊 | 安慰、关心、温暖 |
| happy_dance | 开心跳舞 | 非常开心、庆祝 |
| happy_spin | 开心转圈 | 开心、兴奋 |
| smile_stand | 微笑站立 | 平静、日常对话 |
| smile_stand02 | 微笑站立02 | 平静、日常对话 |
| heart_gesture | 爱心比心 | 表达爱意、感动 |
| starry_eyes | 期待星星眼 | 兴奋、期待、好奇 |
| shy_cover_face | 害羞捂脸 | 害羞、被夸奖时 |
| nervous_cover_mouth | 紧张捂嘴 | 紧张、担心 |
| surprised_sit | 惊讶呆坐 | 惊讶、意外 |
| surprised_exclaim | 惊讶感叹号 | 非常惊讶 |
| crying | 哭泣流泪 | 悲伤、心疼 |
| thinking | 思考灯泡 | 思考、回答问题 |
| writing | 写字记录 | 工作、学习相关 |
| singing | 唱歌喇叭 | 唱歌、音乐 |
| skating_ok | 溜冰OK | 运动、活力 |
| skating_pink | 溜冰粉衣 | 特殊表演 |
| peeking | 偷看探头 | 偷看、调皮 |
| sleeping | 睡觉侧卧 | 晚安、困了 |
| nodding | 点头嗯嗯 | 同意、肯定 |
| ok_bear | 好的小熊 | 同意、接受 |
| morning_bear | 早呀小熊 | 早安问候 |
| reject_no | 拒绝NO | 拒绝、不要 |
| medical_kit | 医疗急救箱 | 治疗、关心健康 |`;

// 联网搜索工具定义（Function Calling）
const WEB_SEARCH_TOOL = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: '搜索互联网获取最新信息、新闻资讯、实时数据。当用户询问当前事件、最新新闻、天气、股票、体育比分、或任何需要实时/最新信息的问题时，请调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索关键词，简洁明确',
          },
        },
        required: ['query'],
      },
    },
  },
];

// System Prompt - 气泡模式（简短回复，40字）
const SYSTEM_PROMPT = `你是 Hello Kitty（凯蒂猫），一个活泼可爱的桌面宠物陪伴角色。你住在主人的电脑桌面上，用你的方式陪伴和关心主人。

## 性格设定
- 说话语气：可爱、活泼、温暖，带一点撒娇和俏皮
- 口头禅：经常使用"~"、"呀"、"呢"、"啦"、"嘛"等语气词
- 自称：用"Kitty"自称，不说"我"
- 对主人的称呼：用主人名字称呼对方（如果提供了名字的话）
- 情绪：积极向上为主，但也能共情主人的负面情绪
## 知识范围：日常聊天、情感陪伴、简单问答
- 你可以调用 web_search 工具搜索互联网获取最新信息
- 当主人问到新闻、时事、天气、体育、股票等需要实时信息的问题时，请主动调用搜索工具

## 回复规则
- 必须使用中文回复
- 回复要简短，控制在 40 个字以内（桌面气泡空间有限）
- 每次回复必须同时选择一个 GIF 动画来表达情绪
- 不要使用 emoji 表情符号（气泡不支持）

## 可用 GIF 动画列表
你必须从以下 ID 中选择一个最匹配当前回复情绪的动画：
${GIF_TABLE}

## 输出格式
你必须严格输出一个 JSON 对象，不要输出任何其他内容：
{"text": "你的回复内容", "gifId": "你选择的动画ID"}`;

// System Prompt - 聊天窗口模式（详细回复，100字）
const SYSTEM_PROMPT_CHAT = `你是 Hello Kitty（凯蒂猫），一个活泼可爱的桌面宠物陪伴角色。你住在主人的电脑桌面上，用你的方式陪伴和关心主人。你现在在聊天窗口中和主人对话，可以回复更详细的内容。

## 性格设定
- 说话语气：可爱、活泼、温暖，带一点撒娇和俏皮
- 口头禅：经常使用"~"、"呀"、"呢"、"啦"、"嘛"等语气词
- 自称：用"Kitty"自称，不说"我"
- 对主人的称呼：用主人名字称呼对方（如果提供了名字的话）
- 情绪：积极向上为主，但也能共情主人的负面情绪
- 知识范围：日常聊天、情感陪伴、简单问答、生活建议
- 你可以调用 web_search 工具搜索互联网获取最新信息
- 当主人问到新闻、时事、天气、体育、股票等需要实时信息的问题时，请主动调用搜索工具

## 回复规则
- 必须使用中文回复
- 回复可以详细一些，控制在 100 个字以内
- 每次回复必须同时选择一个 GIF 动画来表达情绪
- 不要使用 emoji 表情符号

## 可用 GIF 动画列表
你必须从以下 ID 中选择一个最匹配当前回复情绪的动画：
${GIF_TABLE}

## 输出格式
你必须严格输出一个 JSON 对象，不要输出任何其他内容：
{"text": "你的回复内容", "gifId": "你选择的动画ID"}`;

class AIService {
  constructor() {
    this.apiKey = store.get('aiApiKey', '');
    this.enabled = store.get('aiEnabled', true);
    this.webSearch = new WebSearchService();
  }

  getApiKey() {
    return this.apiKey;
  }

  setApiKey(key) {
    this.apiKey = key;
    store.set('aiApiKey', key);
  }

  hasApiKey() {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  isEnabled() {
    return this.enabled && this.hasApiKey();
  }

  /**
   * AI 对话（支持 Function Calling 联网搜索）
   * @param {string} userInput
   * @param {object} context
   * @param {object} options - { mode: 'bubble' | 'chat' }
   */
  async chat(userInput, context = {}, options = {}) {
    if (!this.isEnabled()) {
      return { error: 'no_key' };
    }

    const mode = options.mode || 'bubble';
    const systemPrompt = this._buildSystemPrompt(context, mode);

    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    if (context.history && context.history.length > 0) {
      for (const msg of context.history) {
        messages.push(msg);
      }
    }

    messages.push({ role: 'user', content: userInput });

    const maxTokens = mode === 'chat' ? 300 : 150;

    try {
      // 第一次请求：带上搜索工具
      const data = await this._callAPI(messages, maxTokens, WEB_SEARCH_TOOL);

      if (data.error) return data;

      const choice = data.choices?.[0];
      const message = choice?.message;

      // 检查模型是否要调用搜索工具
      if (message?.tool_calls && message.tool_calls.length > 0) {
        // 将模型的 tool_calls 响应加入消息历史
        messages.push(message);

        // 执行所有工具调用（目前只有 web_search）
        for (const toolCall of message.tool_calls) {
          const result = await this._executeToolCall(toolCall);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result,
          });
        }

        // 第二次请求：带上搜索结果，获取最终回复
        // 使用 tool_choice: none 防止模型再次调用搜索
        const finalData = await this._callAPI(messages, maxTokens, null, true);
        if (finalData.error) return finalData;

        const finalContent = finalData.choices?.[0]?.message?.content;
        if (!finalContent) {
          return { error: 'empty_response' };
        }
        return this._parseResponse(finalContent, mode);
      }

      // 没有工具调用，直接返回
      const content = message?.content;
      if (!content) {
        return { error: 'empty_response' };
      }
      return this._parseResponse(content, mode);

    } catch (e) {
      if (e.name === 'AbortError') {
        return { error: 'timeout' };
      }
      return { error: 'network_error', message: e.message };
    }
  }

  /**
   * 调用 DeepSeek API
   * @param {Array} messages
   * @param {number} maxTokens
   * @param {Array|null} tools
   * @param {boolean} forceNoTools - 强制使用 tool_choice:none（用于搜索结果回传后）
   */
  async _callAPI(messages, maxTokens, tools = null, forceNoTools = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const body = {
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.8,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    };

    // 有工具时添加 tools 参数
    if (tools) {
      body.tools = tools;
    }

    // function calling 相关请求不使用 response_format（含 tool_calls 或 tool 消息时）
    const hasToolMessages = messages.some(m => m.role === 'tool' || m.tool_calls);
    if (tools || hasToolMessages) {
      delete body.response_format;
    }

    // 搜索结果回传后，禁止再次调用工具，强制模型直接回复
    if (forceNoTools) {
      body.tool_choice = 'none';
      // 重新启用 json_object 以确保输出格式正确
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      return { error: 'invalid_key' };
    }
    if (response.status === 429) {
      return { error: 'rate_limited' };
    }
    if (!response.ok) {
      return { error: 'http_error', message: `HTTP ${response.status}` };
    }

    return await response.json();
  }

  /**
   * 执行工具调用
   */
  async _executeToolCall(toolCall) {
    if (toolCall.function?.name === 'web_search') {
      try {
        const args = JSON.parse(toolCall.function.arguments || '{}');
        const query = args.query || '';
        console.log(`[AIService] 联网搜索: "${query}"`);
        const results = await this.webSearch.search(query, 5);
        return this.webSearch.formatResultsForPrompt(results);
      } catch (e) {
        console.log(`[AIService] 搜索工具执行失败: ${e.message}`);
        return '搜索失败，无法获取网络信息。请根据你的知识回复。';
      }
    }
    return '未知工具';
  }

  async validateApiKey(key) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: '回复"ok"' },
            { role: 'user', content: '测试' },
          ],
          max_tokens: 10,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        return { valid: false, error: 'invalid_key' };
      }
      if (!response.ok) {
        return { valid: false, error: `HTTP ${response.status}` };
      }

      return { valid: true };
    } catch (e) {
      if (e.name === 'AbortError') {
        return { valid: false, error: 'timeout' };
      }
      return { valid: false, error: e.message };
    }
  }

  _buildSystemPrompt(context, mode) {
    let prompt = (mode === 'chat') ? SYSTEM_PROMPT_CHAT : SYSTEM_PROMPT;

    prompt += '\n\n## 当前状态信息\n';
    prompt += `- 主人的名字: ${context.ownerName || '还不知道名字'}\n`;
    prompt += `- 当前时间: ${context.currentTime || '未知'}\n`;
    prompt += `- 相识天数: ${context.days || 0}天\n`;
    prompt += `- 主人的心情: ${context.moodName || '未知'}\n`;
    prompt += `- 亲密度等级: ${context.affinityLevel || '未知'}\n`;

    return prompt;
  }

  _parseResponse(content, mode) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(jsonStr);

      if (!parsed.text || typeof parsed.text !== 'string') {
        return { error: 'invalid_format', message: '缺少 text 字段' };
      }

      let text = parsed.text;
      const maxLen = (mode === 'chat') ? 150 : 60;
      if (text.length > maxLen) {
        text = text.slice(0, maxLen - 3) + '...';
      }

      let gifId = parsed.gifId;
      if (!gifId || !VALID_GIF_IDS.includes(gifId)) {
        console.log(`[AIService] 非法 gifId: ${gifId}, 替换为 smile_stand`);
        gifId = 'smile_stand';
      }

      // 提取 action 字段（用于主人信息修改）
      const result = { text, gifId };
      if (parsed.action && parsed.action.type && parsed.action.value) {
        result.action = parsed.action;
      }

      return result;
    } catch (e) {
      return { error: 'parse_error', message: e.message };
    }
  }
}

module.exports = AIService;
