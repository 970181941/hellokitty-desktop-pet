// === SVG 图标常量 ===
const SVG_CLOSE = (s) => `<svg width="${s||11}" height="${s||11}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const SVG_EDIT = (s) => `<svg width="${s||11}" height="${s||11}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const SVG_CHAT = (s) => `<svg width="${s||12}" height="${s||12}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`;
const SVG_SEARCH = (s) => `<svg width="${s||14}" height="${s||14}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px;margin-top:-2px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

// === DOM 元素 ===
const messageList = document.getElementById('message-list');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const btnClose = document.getElementById('btn-close');
const typingIndicator = document.getElementById('typing-indicator');

// === 状态 ===
let messages = [];
let isSending = false;
let pomodoroTimerEl = null;
let currentSchedule = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
let selectedDay = 'mon';
let latestStatusData = null;
let todos = [];
let currentSkinId = 'classic';
// 当前侧边面板视图
let currentView = 'status';
// 聊天模式: 'kitty' 或 'friend'
let currentChatMode = 'kitty';
let currentFriendId = null;
let currentFriendName = '';
let friendMessages = {};  // 缓存好友消息 { friendId: messages[] }
let lanFriends = [];      // 好友列表缓存
let discoveredPeers = []; // 发现的对端缓存
let isScanning = false;   // 是否正在搜索

// 心情 emoji 映射
const MOOD_EMOJIS = { 1: '😢', 2: '😟', 3: '😐', 4: '😊', 5: '🤩' };
// 亲密度 emoji 映射
const AFFINITY_EMOJIS = { 1: '🤍', 2: '💛', 3: '💚', 4: '💙', 5: '💗', 6: '💖', 7: '💝', 8: '💎' };

// === 初始化 ===
document.addEventListener('DOMContentLoaded', async () => {
  // 加载历史消息
  const history = await window.chatAPI.loadHistory();
  if (history && history.length > 0) {
    messages = history;
    for (const msg of messages) {
      renderMessage(msg, false);
    }
    scrollToBottom();
  } else {
    showEmptyState();
  }

  // 输入事件
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  btnSend.addEventListener('click', sendMessage);

  btnClose.addEventListener('click', () => {
    window.chatAPI.closeWindow();
  });

  // 初始化侧边工具栏
  initSideToolbar();

  // 初始化周日程面板
  initSchedulePanel();

  // 初始化待办面板
  initTodoPanel();

  // 初始化设置面板
  initSettingsPanel();

  // 初始化找朋友面板
  initFriendsPanel();

  // 初始化状态栏
  refreshStatusBar();

  // 加载并应用皮肤
  loadAndApplySkin();

  // 初始化情绪色彩
  applyEmotion('normal');

  // 加载并应用聊天背景
  loadAndApplyBackground();

  // 初始加载侧边面板数据
  refreshSidePanelData();

  // 监听状态推送
  window.chatAPI.onStatusUpdate((data) => {
    latestStatusData = data;
    updateStatusBar(data);
    updatePlayButtonStates(data);
    // 始终更新侧边面板状态视图
    updateSidePanelContent(data);
    // 情绪色彩联动
    updateEmotionFromMood(data.moodLevel);
  });

  // 监听番茄钟倒计时
  window.chatAPI.onPomodoroTick((data) => {
    updatePomodoroDisplay(data);
  });

  // 监听动作结果
  window.chatAPI.onActionResult((data) => {
    renderSystemMessage(data.text);
    if (['feed', 'play', 'heal', 'sing', 'skate'].includes(data.action)) {
      refreshStatusBar();
    }
  });

  // 监听周日程通知
  window.chatAPI.onScheduleNotification((data) => {
    renderSystemMessage(`提醒: ${data.text}`);
  });

  // 监听局域网事件
  window.chatAPI.onLANEvent((payload) => {
    handleLANEvent(payload);
  });

  // 聚焦输入框
  chatInput.focus();
});

// === 皮肤系统 ===
async function loadAndApplySkin() {
  try {
    const skinId = await window.chatAPI.getSkin();
    if (skinId) {
      // 迁移旧皮肤 ID
      const migratedId = migrateSkinId(skinId);
      currentSkinId = migratedId;
      applySkin(migratedId);
      // 如果发生了迁移，保存新 ID
      if (migratedId !== skinId) {
        try { await window.chatAPI.setSkin(migratedId); } catch (_) {}
      }
    }
  } catch (e) {
    // ignore
  }
}

function applySkin(skinId) {
  const skin = SKINS[skinId] || SKINS.classic;
  const root = document.getElementById('app-wrapper');

  // Brand colors
  root.style.setProperty('--color-primary', skin.primary);
  root.style.setProperty('--color-primary-hover', skin.primaryHover || skin.primary);
  root.style.setProperty('--color-primary-active', skin.primaryActive || skin.primary);
  root.style.setProperty('--color-primary-light', skin.primaryLight);
  root.style.setProperty('--color-primary-ultra-light', skin.primaryUltraLight || skin.primaryLight);
  root.style.setProperty('--color-secondary', skin.secondary || skin.primaryLight);
  root.style.setProperty('--color-accent', skin.accent || skin.primary);
  root.style.setProperty('--text-brand', skin.textBrand || skin.primary);
  root.style.setProperty('--shadow-brand', skin.shadowBrand || 'rgba(0,0,0,0.1)');
  root.style.setProperty('--hover-overlay', skin.hoverOverlay || 'rgba(0,0,0,0.04)');
  root.style.setProperty('--active-overlay', skin.activeOverlay || 'rgba(0,0,0,0.08)');
  root.style.setProperty('--focus-ring', skin.focusRing || 'rgba(0,0,0,0.2)');
  root.style.setProperty('--divider-brand', skin.dividerBrand || skin.primaryLight);
  root.style.setProperty('--bubble-user-bg', skin.bubbleUser || skin.primary);

  // Dark mode handling
  if (skin.dark) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }

  currentSkinId = skinId;
}

async function selectSkin(skinId) {
  applySkin(skinId);
  try {
    await window.chatAPI.setSkin(skinId);
  } catch (e) {
    // ignore
  }
  document.querySelectorAll('.skin-card').forEach(card => {
    card.classList.toggle('active', card.dataset.skinId === skinId);
  });
}

// === 情绪色彩体系 ===
let currentEmotionId = 'normal';

function applyEmotion(emotionId) {
  const emotion = EMOTIONS[emotionId] || EMOTIONS.normal;
  const root = document.getElementById('app-wrapper');
  root.style.setProperty('--emotion-primary', emotion.primary);
  root.style.setProperty('--emotion-secondary', emotion.secondary);
  root.style.setProperty('--emotion-bg', emotion.bg);
  currentEmotionId = emotionId;
}

function updateEmotionFromMood(moodLevel) {
  if (moodLevel === undefined) return;
  const emotionId = MOOD_TO_EMOTION[moodLevel] || 'normal';
  if (emotionId !== currentEmotionId) {
    applyEmotion(emotionId);
  }
}

// === 视图切换 ===
function switchView(viewName) {
  if (currentView === viewName) return;

  // 隐藏当前视图
  const currentEl = document.getElementById(`view-${currentView}`);
  if (currentEl) currentEl.classList.remove('active');

  // 显示目标视图
  const targetEl = document.getElementById(`view-${viewName}`);
  if (targetEl) targetEl.classList.add('active');

  // 更新工具栏按钮激活状态
  document.querySelectorAll('.side-tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  currentView = viewName;

  // 切换到设置视图时刷新数据
  if (viewName === 'settings') {
    refreshSettingsPanel();
  }
  // 切换到状态视图时刷新数据
  if (viewName === 'status') {
    if (latestStatusData) {
      updateSidePanelContent(latestStatusData);
    } else {
      refreshSidePanelData();
    }
  }
  // 切换到找朋友视图时刷新列表
  if (viewName === 'friends') {
    refreshFriendsList();
    refreshDiscoveredList();
  }
}

function showStatusView() {
  switchView('status');
}

// === 侧边工具栏初始化 ===
function initSideToolbar() {
  // 工具栏按钮点击切换视图
  const toolBtns = document.querySelectorAll('.side-tool-btn');
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });

  // 返回按钮
  document.querySelectorAll('.side-view-back').forEach(btn => {
    btn.addEventListener('click', () => {
      showStatusView();
    });
  });

  // 初始化玩耍按钮事件
  initPlayButtons();

  // 初始获取状态来设置按钮状态
  refreshButtonStates();
}

// === 玩耍按钮 ===
function initPlayButtons() {
  const playBtns = document.querySelectorAll('#view-play .play-btn');
  playBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      await window.chatAPI.triggerAction(action);
      // 非番茄钟动作执行后回到状态视图
      if (action !== 'pomodoro') {
        showStatusView();
      }
    });
  });
}

async function refreshButtonStates() {
  try {
    const ctx = await window.chatAPI.getContext();
    if (ctx) {
      updatePlayButtonStates({
        moodLevel: ctx.moodLevel,
        affinityLevelNum: ctx.affinityLevelNum,
      });
    }
  } catch (e) {
    // ignore
  }
}

function updatePlayButtonStates(data) {
  const playBtns = document.querySelectorAll('#view-play .play-btn');
  playBtns.forEach((btn) => {
    const action = btn.dataset.action;
    const req = btn.dataset.req;

    // 治疗：心情 <= 2 才可用
    if (action === 'heal' && data.moodLevel !== undefined) {
      btn.disabled = data.moodLevel > 2;
      return;
    }

    // 亲密度门槛
    if (req && req.startsWith('affinity') && data.affinityLevelNum !== undefined) {
      const required = parseInt(req.replace('affinity', ''), 10);
      btn.disabled = data.affinityLevelNum < required;
    }
  });
}

// === 周日程面板 ===
function initSchedulePanel() {
  // 填充时间选择器
  const hourSelect = document.getElementById('schedule-hour');
  const minuteSelect = document.getElementById('schedule-minute');
  for (let h = 0; h < 24; h++) {
    const opt = document.createElement('option');
    opt.value = String(h).padStart(2, '0');
    opt.textContent = String(h).padStart(2, '0');
    hourSelect.appendChild(opt);
  }
  for (let m = 0; m < 60; m += 5) {
    const opt = document.createElement('option');
    opt.value = String(m).padStart(2, '0');
    opt.textContent = String(m).padStart(2, '0');
    minuteSelect.appendChild(opt);
  }
  hourSelect.value = '09';
  minuteSelect.value = '00';

  // 加载日程数据
  loadSchedule();

  // 日期选择按钮
  const dayBtns = document.querySelectorAll('#view-schedule .day-btn');
  dayBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      dayBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDay = btn.dataset.day;
      renderScheduleList();
    });
  });

  // 添加事件
  document.getElementById('schedule-add-btn').addEventListener('click', addScheduleEvent);

  // 日程内容输入框回车添加
  document.getElementById('schedule-text').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addScheduleEvent();
    }
  });

  // 保存
  document.getElementById('schedule-save').addEventListener('click', saveSchedule);

  // 取消 → 回到状态视图
  document.getElementById('schedule-cancel').addEventListener('click', () => {
    showStatusView();
  });
}

async function loadSchedule() {
  try {
    const data = await window.chatAPI.getSchedule();
    if (data) {
      currentSchedule = Object.assign(
        { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
        data
      );
    }
  } catch (e) {
    // ignore
  }
  renderScheduleList();
}

function renderScheduleList() {
  const list = document.getElementById('schedule-list');
  list.innerHTML = '';
  const events = currentSchedule[selectedDay] || [];

  if (events.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'schedule-empty';
    empty.textContent = '暂无日程安排';
    list.appendChild(empty);
    return;
  }

  const sorted = [...events].sort((a, b) => a.time.localeCompare(b.time));
  sorted.forEach((event) => {
    const row = document.createElement('div');
    row.className = 'schedule-event';

    const badge = document.createElement('span');
    badge.className = 'time-badge';
    badge.textContent = event.time;

    const text = document.createElement('span');
    text.className = 'event-text';
    text.textContent = event.text;

    const delBtn = document.createElement('button');
    delBtn.className = 'event-delete';
    delBtn.innerHTML = SVG_CLOSE();
    delBtn.setAttribute('aria-label', '删除日程');
    delBtn.addEventListener('click', () => {
      deleteScheduleEvent(event.id);
    });

    row.appendChild(badge);
    row.appendChild(text);
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

function addScheduleEvent() {
  const hour = document.getElementById('schedule-hour').value;
  const minute = document.getElementById('schedule-minute').value;
  const text = document.getElementById('schedule-text').value.trim();

  if (!text) {
    renderSystemMessage('请填写日程内容~');
    return;
  }

  const time = `${hour}:${minute}`;
  const id = `s_${Date.now()}`;

  if (!currentSchedule[selectedDay]) {
    currentSchedule[selectedDay] = [];
  }
  currentSchedule[selectedDay].push({ id, time, text, enabled: true });
  document.getElementById('schedule-text').value = '';
  renderScheduleList();
}

function deleteScheduleEvent(id) {
  if (!currentSchedule[selectedDay]) return;
  currentSchedule[selectedDay] = currentSchedule[selectedDay].filter(e => e.id !== id);
  renderScheduleList();
}

async function saveSchedule() {
  try {
    await window.chatAPI.setSchedule(currentSchedule);
    renderSystemMessage('日程已保存~');
    showStatusView();
  } catch (e) {
    renderSystemMessage('保存失败了...再试试~');
  }
}

// === 待办面板 ===
function initTodoPanel() {
  // 加载待办数据
  loadTodos();

  // 添加按钮
  document.getElementById('todo-add-btn').addEventListener('click', addTodo);

  // 回车添加
  document.getElementById('todo-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTodo();
    }
  });
}

async function loadTodos() {
  try {
    const data = await window.chatAPI.getTodos();
    if (data) {
      todos = data;
    }
  } catch (e) {
    // ignore
  }
  renderTodoList();
}

function renderTodoList() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';

  if (todos.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'todo-empty';
    empty.textContent = '暂无待办事项~';
    list.appendChild(empty);
    return;
  }

  todos.forEach((todo) => {
    const item = document.createElement('div');
    item.className = `todo-item${todo.done ? ' completed' : ''}`;

    const checkbox = document.createElement('div');
    checkbox.className = 'todo-checkbox';
    checkbox.setAttribute('role', 'checkbox');
    checkbox.setAttribute('aria-checked', todo.done ? 'true' : 'false');
    checkbox.setAttribute('aria-label', todo.done ? '已完成' : '未完成');
    checkbox.addEventListener('click', () => toggleTodo(todo.id));

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const delBtn = document.createElement('button');
    delBtn.className = 'todo-delete';
    delBtn.innerHTML = SVG_CLOSE();
    delBtn.setAttribute('aria-label', '删除待办');
    delBtn.addEventListener('click', () => deleteTodo(todo.id));

    item.appendChild(checkbox);
    item.appendChild(text);
    item.appendChild(delBtn);
    list.appendChild(item);
  });
}

function addTodo() {
  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  if (!text) return;

  const todo = {
    id: `t_${Date.now()}`,
    text: text,
    done: false,
    createdAt: Date.now(),
  };
  todos.push(todo);
  input.value = '';
  renderTodoList();
  saveTodos();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    renderTodoList();
    saveTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  renderTodoList();
  saveTodos();
}

async function saveTodos() {
  try {
    await window.chatAPI.setTodos(todos);
  } catch (e) {
    // ignore
  }
}

// === 设置面板 ===
function initSettingsPanel() {
  // 主人信息保存
  document.getElementById('settings-save-owner').addEventListener('click', saveOwnerInfo);

  // AI Key 保存
  document.getElementById('settings-save-ai').addEventListener('click', saveAIKey);

  // 渲染皮肤网格
  renderSkinGrid();

  // 渲染背景图网格
  renderBackgroundGrid();

  // 背景透明度滑块
  const opacitySlider = document.getElementById('bg-opacity-slider');
  if (opacitySlider) {
    // 先加载当前透明度再设置
    window.chatAPI.getBackground().then(bg => {
      if (bg) {
        opacitySlider.value = Math.round((bg.opacity || 0.18) * 100);
        const label = document.getElementById('bg-opacity-value');
        if (label) label.textContent = Math.round((bg.opacity || 0.18) * 100) + '%';
      }
    }).catch(() => {});
    opacitySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value) / 100;
      const label = document.getElementById('bg-opacity-value');
      if (label) label.textContent = e.target.value + '%';
      setBackgroundOpacity(val);
    });
  }

  // 初始化更新区域
  initUpdateSection();
}

async function refreshSettingsPanel() {
  // 加载主人信息
  try {
    const info = await window.chatAPI.getOwnerInfo();
    document.getElementById('settings-owner-name').value = info.name || '';
    document.getElementById('settings-owner-birthday').value = info.birthday || '';
  } catch (e) {
    // ignore
  }

  // 加载 AI Key 状态
  try {
    const hasKey = await window.chatAPI.getAiKeyStatus();
    const keyInput = document.getElementById('settings-api-key');
    keyInput.placeholder = hasKey ? '已设置 (留空不变)' : 'sk-...';
    keyInput.value = '';
  } catch (e) {
    // ignore
  }

  // 更新皮肤选中状态
  document.querySelectorAll('.skin-card').forEach(card => {
    card.classList.toggle('active', card.dataset.skinId === currentSkinId);
  });

  // 刷新背景图网格
  renderBackgroundGrid();
}

async function saveOwnerInfo() {
  const name = document.getElementById('settings-owner-name').value.trim();
  const birthday = document.getElementById('settings-owner-birthday').value.trim();

  // 验证生日格式（MM-DD，且月份1-12，日期1-31）
  if (birthday && !/^\d{2}-\d{2}$/.test(birthday)) {
    renderSystemMessage('生日格式不对哦，请使用 MM-DD 格式（如 03-15）');
    return;
  }
  if (birthday) {
    const [mm, dd] = birthday.split('-').map(Number);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
      renderSystemMessage('生日日期不合法哦，请检查月份和日期~');
      return;
    }
  }

  try {
    await window.chatAPI.setOwnerInfo({ name, birthday });
    renderSystemMessage('主人信息已保存~');
  } catch (e) {
    renderSystemMessage('保存失败了...再试试~');
  }
}

async function saveAIKey() {
  const key = document.getElementById('settings-api-key').value.trim();
  if (!key) {
    renderSystemMessage('API Key 不能为空哦~');
    return;
  }

  try {
    await window.chatAPI.setAiKey(key);
    renderSystemMessage('API Key 已保存~');
    document.getElementById('settings-api-key').value = '';
    document.getElementById('settings-api-key').placeholder = '已设置 (留空不变)';
  } catch (e) {
    renderSystemMessage('保存失败了...再试试~');
  }
}

function renderSkinGrid() {
  const grid = document.getElementById('skin-grid');
  grid.innerHTML = '';

  Object.entries(SKINS).forEach(([id, skin]) => {
    const card = document.createElement('div');
    card.className = `skin-card${id === currentSkinId ? ' active' : ''}`;
    card.dataset.skinId = id;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `选择皮肤: ${skin.name}`);

    const preview = document.createElement('div');
    preview.className = 'skin-preview';
    // 使用品牌色展示皮肤预览
    if (skin.dark) {
      preview.style.background = `linear-gradient(135deg, #1A1A2E 0%, ${skin.primary} 100%)`;
    } else {
      preview.style.background = `linear-gradient(135deg, ${skin.primaryLight} 0%, ${skin.primary} 100%)`;
    }

    const name = document.createElement('span');
    name.className = 'skin-name';
    name.textContent = `${skin.tag || ''} ${skin.name}`.trim();

    card.appendChild(preview);
    card.appendChild(name);

    card.addEventListener('click', () => selectSkin(id));

    grid.appendChild(card);
  });
}

// === 聊天背景系统 ===
let currentBgImage = '';  // 当前选中的背景图路径
let currentBgOpacity = 0.18;

async function loadAndApplyBackground() {
  try {
    const bg = await window.chatAPI.getBackground();
    if (bg && bg.image) {
      // 已有保存的背景图
      currentBgImage = bg.image;
      currentBgOpacity = bg.opacity || 0.18;
      await applyBackgroundImage(bg.image, bg.opacity);
    } else {
      // 首次使用，自动设置一张背景图
      const list = await window.chatAPI.getBackgroundList();
      if (list && list.length > 0) {
        const firstBg = list[0].path;
        currentBgImage = firstBg;
        currentBgOpacity = 0.18;
        await applyBackgroundImage(firstBg, 0.18);
        try {
          await window.chatAPI.setBackground({ image: firstBg, opacity: 0.18 });
        } catch (e) {
          // ignore
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

async function applyBackgroundImage(filePath, opacity) {
  const messageList = document.getElementById('message-list');
  if (!filePath) {
    messageList.style.setProperty('--chat-bg-image', 'none');
    messageList.style.setProperty('--chat-bg-opacity', '0');
    messageList.classList.remove('has-bg-image');
    return;
  }
  try {
    const dataUrl = await window.chatAPI.readBackgroundImage(filePath);
    if (dataUrl) {
      messageList.style.setProperty('--chat-bg-image', `url("${dataUrl}")`);
      messageList.style.setProperty('--chat-bg-opacity', String(opacity || 0.18));
      messageList.classList.add('has-bg-image');
    }
  } catch (e) {
    // ignore
  }
}

async function selectBackground(filePath) {
  currentBgImage = filePath;
  await applyBackgroundImage(filePath, currentBgOpacity);
  try {
    await window.chatAPI.setBackground({ image: filePath, opacity: currentBgOpacity });
  } catch (e) {
    // ignore
  }
  // 更新背景选择器选中状态
  document.querySelectorAll('.bg-card').forEach(card => {
    card.classList.toggle('active', card.dataset.bgPath === filePath);
  });
}

async function setBackgroundOpacity(opacity) {
  currentBgOpacity = opacity;
  const messageList = document.getElementById('message-list');
  messageList.style.setProperty('--chat-bg-opacity', String(opacity));
  try {
    await window.chatAPI.setBackground({ image: currentBgImage, opacity });
  } catch (e) {
    // ignore
  }
}

async function renderBackgroundGrid() {
  const grid = document.getElementById('bg-grid');
  if (!grid) return;
  grid.innerHTML = '';

  try {
    const list = await window.chatAPI.getBackgroundList();

    // "无背景" 选项
    const noneCard = document.createElement('div');
    noneCard.className = `bg-card${!currentBgImage ? ' active' : ''}`;
    noneCard.dataset.bgPath = '';
    noneCard.innerHTML = `
      <div class="bg-preview" style="background: var(--color-surface); display:flex; align-items:center; justify-content:center;">
        <span style="font-size:14px; color: var(--color-text-muted);">✕</span>
      </div>
      <span class="bg-name">无背景</span>
    `;
    noneCard.addEventListener('click', () => selectBackground(''));
    grid.appendChild(noneCard);

    // 各背景图选项
    for (const item of list) {
      const dataUrl = await window.chatAPI.readBackgroundImage(item.path);
      const card = document.createElement('div');
      card.className = `bg-card${item.path === currentBgImage ? ' active' : ''}`;
      card.dataset.bgPath = item.path;

      const preview = document.createElement('div');
      preview.className = 'bg-preview';
      if (dataUrl) {
        preview.style.backgroundImage = `url("${dataUrl}")`;
        preview.style.backgroundSize = 'cover';
        preview.style.backgroundPosition = 'center';
      }

      const name = document.createElement('span');
      name.className = 'bg-name';
      name.textContent = item.name.length > 8 ? item.name.substring(0, 8) + '…' : item.name;

      card.appendChild(preview);
      card.appendChild(name);
      card.addEventListener('click', () => selectBackground(item.path));
      grid.appendChild(card);
    }
  } catch (e) {
    // ignore
  }
}

// === 软件更新 ===
function initUpdateSection() {
  const checkBtn = document.getElementById('update-check-btn');
  const installBtn = document.getElementById('update-install-btn');
  const changelogBtn = document.getElementById('update-changelog-btn');

  // 加载当前版本号
  loadVersionDisplay();

  // 检查更新按钮
  checkBtn.addEventListener('click', async () => {
    checkBtn.disabled = true;
    checkBtn.textContent = '检查中...';
    setUpdateStatus('正在检查更新...');
    hideUpdateNotes();
    try {
      const result = await window.chatAPI.checkForUpdate();
      if (!result) {
        setUpdateStatus('检查失败，请稍后重试');
      }
      // 结果通过 onUpdateStatus 回调处理
    } catch (e) {
      setUpdateStatus('检查失败: ' + (e.message || '网络错误'));
    }
    checkBtn.disabled = false;
    checkBtn.textContent = '检查更新';
  });

  // 安装更新按钮
  installBtn.addEventListener('click', async () => {
    const btnText = installBtn.textContent;
    if (btnText === '前往下载') {
      // 手动下载模式：打开 GitHub Release 页面
      window.chatAPI.openReleasePage();
      return;
    }
    installBtn.disabled = true;
    installBtn.textContent = '安装中...';
    try {
      const result = await window.chatAPI.installUpdate();
      if (result && result.error) {
        // 手动安装模式或错误——状态已通过回调推送
        installBtn.disabled = false;
        installBtn.textContent = '安装更新';
      } else {
        setUpdateStatus('正在重启应用...');
      }
    } catch (e) {
      setUpdateStatus('安装失败: ' + (e.message || '未知错误'));
      installBtn.disabled = false;
      installBtn.textContent = '安装更新';
    }
  });

  // 更新日志展开/收起
  changelogBtn.addEventListener('click', async () => {
    const content = document.getElementById('update-changelog-content');
    const isHidden = content.classList.contains('hidden');
    if (isHidden) {
      try {
        const md = await window.chatAPI.getChangelog();
        content.textContent = md || '暂无更新记录';
      } catch (e) {
        content.textContent = '加载失败';
      }
      content.classList.remove('hidden');
      changelogBtn.textContent = '收起更新日志';
    } else {
      content.classList.add('hidden');
      changelogBtn.textContent = '查看更新日志';
    }
  });

  // 监听更新状态事件
  window.chatAPI.onUpdateStatus((data) => {
    handleUpdateStatus(data);
  });
}

async function loadVersionDisplay() {
  try {
    const ver = await window.chatAPI.getAppVersion();
    document.getElementById('update-current-version').textContent = 'v' + (ver || '0.0.0');
  } catch (e) {
    document.getElementById('update-current-version').textContent = '--';
  }
}

function setUpdateStatus(text) {
  document.getElementById('update-status-text').textContent = text;
}

function showUpdateNotes(notes) {
  const el = document.getElementById('update-release-notes');
  if (el && notes) {
    el.textContent = notes;
    el.classList.remove('hidden');
  }
}

function hideUpdateNotes() {
  const el = document.getElementById('update-release-notes');
  if (el) el.classList.add('hidden');
}

function handleUpdateStatus(data) {
  const progressBar = document.getElementById('update-progress-bar');
  const progressFill = document.getElementById('update-progress-fill');
  const progressPct = document.getElementById('update-progress-pct');
  const installBtn = document.getElementById('update-install-btn');
  const checkBtn = document.getElementById('update-check-btn');

  switch (data.status) {
    case 'checking':
      setUpdateStatus('正在检查更新...');
      progressBar.classList.add('hidden');
      progressPct.classList.add('hidden');
      installBtn.classList.add('hidden');
      hideUpdateNotes();
      break;

    case 'available':
      setUpdateStatus(`发现新版本 v${data.version || ''}，准备下载...`);
      installBtn.classList.add('hidden');
      progressBar.classList.remove('hidden');
      progressPct.classList.remove('hidden');
      progressFill.style.width = '0%';
      progressPct.textContent = '0%';
      if (data.notes) showUpdateNotes(data.notes);
      // 自动开始下载
      if (data.hasDownload) {
        window.chatAPI.downloadUpdate().catch(() => {});
      } else {
        // 没有直接下载链接，引导手动下载
        setUpdateStatus(`发现新版本 v${data.version || ''}`);
        progressBar.classList.add('hidden');
        progressPct.classList.add('hidden');
        installBtn.classList.remove('hidden');
        installBtn.disabled = false;
        installBtn.textContent = '前往下载';
      }
      break;

    case 'not-available':
      setUpdateStatus('当前已是最新版本 ✓');
      progressBar.classList.add('hidden');
      progressPct.classList.add('hidden');
      installBtn.classList.add('hidden');
      checkBtn.disabled = false;
      checkBtn.textContent = '检查更新';
      hideUpdateNotes();
      break;

    case 'downloading':
      setUpdateStatus('正在下载更新...');
      progressBar.classList.remove('hidden');
      progressPct.classList.remove('hidden');
      installBtn.classList.add('hidden');
      if (data.percent !== undefined) {
        progressFill.style.width = data.percent + '%';
        progressPct.textContent = data.percent + '%';
      }
      break;

    case 'installing':
      setUpdateStatus('正在安装更新...');
      progressBar.classList.add('hidden');
      progressPct.classList.add('hidden');
      installBtn.classList.add('hidden');
      break;

    case 'ready':
      setUpdateStatus(`新版本 v${data.version || ''} 已就绪`);
      progressBar.classList.add('hidden');
      progressPct.classList.add('hidden');
      installBtn.classList.remove('hidden');
      installBtn.disabled = false;
      installBtn.textContent = '重启安装';
      loadVersionDisplay();
      break;

    case 'manual-download':
      setUpdateStatus(`发现新版本 v${data.version || ''}，请点击前往下载页面`);
      progressBar.classList.add('hidden');
      progressPct.classList.add('hidden');
      installBtn.classList.remove('hidden');
      installBtn.disabled = false;
      installBtn.textContent = '前往下载';
      loadVersionDisplay();
      break;

    case 'error':
      setUpdateStatus('更新失败: ' + (data.message || '未知错误'));
      progressBar.classList.add('hidden');
      progressPct.classList.add('hidden');
      installBtn.classList.add('hidden');
      checkBtn.disabled = false;
      checkBtn.textContent = '检查更新';
      break;
  }
}

// === 状态栏 ===
async function refreshStatusBar() {
  try {
    const ctx = await window.chatAPI.getContext();
    if (ctx) {
      updateStatusBar({
        moodLevel: ctx.moodLevel,
        moodName: ctx.moodName,
        affinityLevelNum: ctx.affinityLevelNum,
        affinityLevelName: ctx.affinityLevel,
        days: ctx.days,
      });
    }
  } catch (e) {
    // ignore
  }
}

function updateStatusBar(data) {
  const moodEl = document.getElementById('status-mood');
  const affinityEl = document.getElementById('status-affinity');
  const daysEl = document.getElementById('status-days');

  if (data.moodLevel !== undefined || data.moodName) {
    const emoji = MOOD_EMOJIS[data.moodLevel] || '😊';
    const name = data.moodName || '';
    moodEl.textContent = `${emoji} ${name}`;
  }

  if (data.affinityLevelNum !== undefined || data.affinityLevelName) {
    const emoji = AFFINITY_EMOJIS[data.affinityLevelNum] || '💗';
    const name = data.affinityLevelName || '';
    affinityEl.textContent = `${emoji} ${name}`;
  }

  if (data.days !== undefined) {
    daysEl.textContent = data.days > 0 ? `第${data.days}天` : '初次见面';
  }
}

// === 侧边面板数据 ===
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

async function refreshSidePanelData() {
  try {
    const ctx = await window.chatAPI.getContext();
    if (ctx) {
      updateSidePanelContent({
        ownerName: ctx.ownerName,
        moodLevel: ctx.moodLevel,
        moodName: ctx.moodName,
        affinityLevelNum: ctx.affinityLevelNum,
        affinityLevelName: ctx.affinityLevel,
        affinity: ctx.affinity,
        nextLevelMin: ctx.nextLevelMin,
        nextLevelMax: ctx.nextLevelMax,
        days: ctx.days,
        loginStreakDays: ctx.loginStreakDays,
        totalInteractions: ctx.totalInteractions,
      });
    }
  } catch (e) {
    // ignore
  }
}

function updateSidePanelContent(data) {
  // 主人信息
  const nameEl = document.getElementById('side-owner-name');
  const greetingEl = document.getElementById('side-greeting');
  const ownerName = data.ownerName || '新朋友';
  nameEl.textContent = ownerName;

  // 根据时段生成问候语
  const hour = new Date().getHours();
  let greeting = '欢迎回来~';
  if (hour < 6) greeting = '夜深了，注意休息~';
  else if (hour < 12) greeting = '早上好~';
  else if (hour < 14) greeting = '中午好~';
  else if (hour < 18) greeting = '下午好~';
  else if (hour < 22) greeting = '晚上好~';
  else greeting = '夜深了，注意休息~';
  if (data.days > 0) {
    greeting = `${greeting} 第 ${data.days} 天`;
  }
  greetingEl.textContent = greeting;

  // 心情
  const moodEmojiEl = document.getElementById('side-mood-emoji');
  const moodTextEl = document.getElementById('side-mood-text');
  const moodEmoji = MOOD_EMOJIS[data.moodLevel] || '😊';
  moodEmojiEl.textContent = moodEmoji;
  moodTextEl.textContent = data.moodName || '开心';

  // 亲密度
  const levelNameEl = document.getElementById('side-level-name');
  const affinityNumEl = document.getElementById('side-affinity-num');
  const progressEl = document.getElementById('side-progress');
  const progressLabelEl = document.getElementById('side-progress-label');
  const nextLevelEl = document.getElementById('side-next-level');

  const levelEmoji = AFFINITY_EMOJIS[data.affinityLevelNum] || '💗';
  levelNameEl.textContent = `${levelEmoji} ${data.affinityLevelName || ''}`;
  const currentAffinity = data.affinity || 0;
  affinityNumEl.textContent = `${currentAffinity}`;

  const currentMin = data.nextLevelMin || 0;
  const currentMax = data.nextLevelMax || 2500;
  const range = currentMax - currentMin;
  const progress = range > 0 ? Math.min(((currentAffinity - currentMin) / range) * 100, 100) : 100;
  progressEl.style.width = `${Math.max(0, progress)}%`;
  progressLabelEl.textContent = `${currentAffinity} / ${currentMax}`;

  const remaining = Math.max(0, currentMax - currentAffinity);
  nextLevelEl.textContent = remaining > 0 ? `距离下一级还需 ${remaining} 点` : '已达最高等级！';

  // 陪伴统计
  const daysEl = document.getElementById('side-days');
  const streakEl = document.getElementById('side-streak');
  daysEl.textContent = data.days > 0 ? `第 ${data.days} 天` : '初次见面';
  streakEl.textContent = data.loginStreakDays > 0 ? `${data.loginStreakDays} 天` : '0 天';

  // 成就徽章
  renderAchievements(data.loginStreakDays || 0);
}

function renderAchievements(streakDays) {
  const container = document.getElementById('side-achievements');
  container.innerHTML = '';
  STREAK_MILESTONES.forEach(milestone => {
    const badge = document.createElement('div');
    badge.className = `side-streak-badge${streakDays >= milestone ? ' achieved' : ''}`;
    badge.textContent = `${milestone}`;
    badge.title = streakDays >= milestone ? `已达成 ${milestone} 天连续登录` : `还需 ${milestone - streakDays} 天`;
    container.appendChild(badge);
  });
}

// === 番茄钟显示 ===
function updatePomodoroDisplay(data) {
  if (!data.active && data.state === 'idle') {
    if (pomodoroTimerEl) {
      pomodoroTimerEl.remove();
      pomodoroTimerEl = null;
    }
    renderSystemMessage('专注结束了~ 辛苦了！');
    return;
  }

  const stateLabels = { working: '专注中', short_break: '休息中', long_break: '长休息' };
  const label = stateLabels[data.state] || '';
  const timeStr = formatCountdown(data.timeRemaining);

  if (!pomodoroTimerEl) {
    pomodoroTimerEl = document.createElement('div');
    pomodoroTimerEl.id = 'pomodoro-display';
    pomodoroTimerEl.className = 'system-message';
    messageList.appendChild(pomodoroTimerEl);
  }

  pomodoroTimerEl.textContent = `${label} ${timeStr}`;
  scrollToBottom();
}

// === 系统消息 ===
function renderSystemMessage(text) {
  removeEmptyState();
  const row = document.createElement('div');
  row.className = 'message-row system';

  const content = document.createElement('div');
  content.className = 'msg-content';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;

  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = formatTime(Date.now());

  content.appendChild(bubble);
  content.appendChild(time);
  row.appendChild(content);

  messageList.appendChild(row);
  scrollToBottom();
}

// === 发送消息 ===
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || isSending) return;

  if (currentChatMode === 'friend' && currentFriendId) {
    await sendFriendMessage(text);
  } else {
    await sendKittyMessage(text);
  }
}

// === 发送好友消息 ===
async function sendFriendMessage(text) {
  isSending = true;
  btnSend.disabled = true;
  chatInput.value = '';

  removeEmptyState();

  const userMsg = { role: 'user', text, time: Date.now() };
  messages.push(userMsg);
  renderMessage(userMsg, true);
  scrollToBottom();

  try {
    const result = await window.chatAPI.lanSendMessage(currentFriendId, text);
    if (result && result.error) {
      renderSystemMessage(`发送失败: ${result.error}`);
    }
  } catch (err) {
    renderSystemMessage('发送失败，对方可能不在线~');
  }

  isSending = false;
  btnSend.disabled = false;
  chatInput.focus();
}

// === 发送 Kitty 消息 ===
async function sendKittyMessage(text) {

  isSending = true;
  btnSend.disabled = true;
  chatInput.value = '';

  removeEmptyState();

  const userMsg = {
    role: 'user',
    text: text,
    time: Date.now(),
  };
  messages.push(userMsg);
  renderMessage(userMsg, true);
  scrollToBottom();

  showTyping();

  try {
    const context = await window.chatAPI.getContext();
    const result = await window.chatAPI.sendMessage(text, context);

    hideTyping();

    if (result && !result.error) {
      const kittyMsg = {
        role: 'assistant',
        text: result.text,
        gifId: result.gifId,
        time: Date.now(),
      };
      messages.push(kittyMsg);
      renderMessage(kittyMsg, true);
      scrollToBottom();

      if (result.gifId) {
        window.chatAPI.playGif(result.gifId);
      }

      // 处理 AI 返回的 action（主人信息修改）
      if (result.action) {
        await handleAIAction(result.action);
      }

      saveHistory();
    } else {
      let errorText = 'Kitty 走神了...再试试吧~';
      if (result?.error === 'invalid_key') {
        errorText = 'API Key 好像不对呢，检查一下设置吧~';
      } else if (result?.error === 'timeout') {
        errorText = 'Kitty 想了想...没想出来，再说一次吧~';
      } else if (result?.error === 'rate_limited') {
        errorText = '说话太快啦，等一下再聊~';
      } else if (result?.error === 'no_key') {
        errorText = '还没设置 API Key 呢，去设置面板设置一下吧~';
      }

      const errorMsg = {
        role: 'assistant',
        text: errorText,
        time: Date.now(),
      };
      messages.push(errorMsg);
      renderMessage(errorMsg, true);
      scrollToBottom();
    }
  } catch (err) {
    hideTyping();
    const errMsg = {
      role: 'assistant',
      text: '网络好像不太好...稍后再试试~',
      time: Date.now(),
    };
    messages.push(errMsg);
    renderMessage(errMsg, true);
    scrollToBottom();
  }

  isSending = false;
  btnSend.disabled = false;
  chatInput.focus();
}

// 处理 AI 返回的 action
async function handleAIAction(action) {
  if (action.type === 'set_name' || action.type === 'set_birthday') {
    try {
      const info = await window.chatAPI.getOwnerInfo();
      if (action.type === 'set_name') {
        info.name = action.value;
      } else if (action.type === 'set_birthday') {
        info.birthday = action.value;
      }
      await window.chatAPI.setOwnerInfo(info);
    } catch (e) {
      // ignore
    }
  }
}

// === 渲染消息 ===
function renderMessage(msg, animate) {
  const row = document.createElement('div');
  const isUser = msg.role === 'user';
  const isFriend = msg.role === 'friend';
  row.className = `message-row ${isUser ? 'user' : isFriend ? 'friend-msg kitty' : 'kitty'}`;

  if (!animate) {
    row.style.animation = 'none';
  }

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  if (isUser) {
    avatar.textContent = '我';
  } else if (isFriend) {
    // 好友消息 - 显示好友首字
    const initial = currentFriendName ? currentFriendName[0] : '友';
    avatar.textContent = initial;
  } else {
    const img = document.createElement('img');
    img.src = 'assets/avatar.jpeg';
    img.alt = 'HK';
    avatar.appendChild(img);
  }

  const content = document.createElement('div');
  content.className = 'msg-content';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = msg.text;

  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = formatTime(msg.time);

  content.appendChild(bubble);
  content.appendChild(time);
  row.appendChild(avatar);
  row.appendChild(content);

  messageList.appendChild(row);
}

// === 工具函数 ===
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: 'smooth',
    });
  });
}

function showTyping() {
  typingIndicator.classList.remove('hidden');
  scrollToBottom();
}

function hideTyping() {
  typingIndicator.classList.add('hidden');
}

function showEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.id = 'empty-state';
  if (currentChatMode === 'friend') {
    empty.innerHTML = `<div class="empty-icon empty-icon-friend"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg></div><div class="empty-text">和 ${currentFriendName || '好友'} 打个招呼吧~</div>`;
  } else {
    empty.innerHTML = '<div class="empty-icon"><img src="assets/empty-state.png" alt="Kitty" class="empty-illustration"></div><div class="empty-text">和 Kitty 打个招呼吧~</div><div class="empty-subtext">发送消息开始你们的旅程</div>';
  }
  messageList.appendChild(empty);
}

function removeEmptyState() {
  const empty = document.getElementById('empty-state');
  if (empty) empty.remove();
}

async function saveHistory() {
  const toSave = messages.slice(-50);
  await window.chatAPI.saveHistory(toSave);
}

// === 找朋友面板 ===
function initFriendsPanel() {
  // 搜索按钮
  const scanBtn = document.getElementById('friends-scan-btn');
  if (scanBtn) {
    scanBtn.addEventListener('click', async () => {
      if (isScanning) {
        await window.chatAPI.lanStopDiscovery();
        isScanning = false;
        scanBtn.innerHTML = SVG_SEARCH() + '搜索附近的好友';
        scanBtn.classList.remove('scanning');
      } else {
        await window.chatAPI.lanStartDiscovery();
        isScanning = true;
        scanBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-right:4px;margin-top:-2px"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>停止搜索`;
        scanBtn.classList.add('scanning');
        document.getElementById('friends-scan-status').textContent = '正在搜索局域网好友...';
        // 定时刷新发现列表
        refreshDiscoveredList();
      }
    });
  }

  // 昵称保存
  const nickSaveBtn = document.getElementById('friends-nickname-save');
  const nickInput = document.getElementById('friends-nickname-input');
  if (nickSaveBtn && nickInput) {
    // 加载当前昵称
    window.chatAPI.lanGetStatus().then(status => {
      if (status && status.nickname) {
        nickInput.value = status.nickname;
      }
    }).catch(() => {});

    nickSaveBtn.addEventListener('click', async () => {
      const name = nickInput.value.trim();
      if (!name) return;
      await window.chatAPI.lanSetNickname(name);
      renderSystemMessage(`昵称已设为: ${name}`);
    });
  }

  // 手动 IP 添加
  const ipAddBtn = document.getElementById('friends-ip-add-btn');
  const ipInput = document.getElementById('friends-ip-input');
  const ipStatus = document.getElementById('friends-ip-status');
  if (ipAddBtn && ipInput) {
    ipAddBtn.addEventListener('click', async () => {
      const ip = ipInput.value.trim();
      if (!ip) {
        if (ipStatus) ipStatus.textContent = '请输入 IP 地址';
        return;
      }
      ipAddBtn.disabled = true;
      ipAddBtn.textContent = '连接中...';
      if (ipStatus) ipStatus.textContent = `正在连接 ${ip}...`;
      try {
        const result = await window.chatAPI.lanConnectByIP(ip, 38528, ip);
        if (result && result.error) {
          if (ipStatus) ipStatus.textContent = `连接失败: ${result.error}`;
        } else if (result && result.connected) {
          if (ipStatus) ipStatus.textContent = `已连接到 ${ip}`;
          renderSystemMessage(`已添加好友: ${result.nickname}`);
          ipInput.value = '';
          refreshFriendsList();
        } else if (result) {
          if (ipStatus) ipStatus.textContent = `好友已添加，但对方不在线`;
          renderSystemMessage(`已添加好友: ${result.nickname}（离线）`);
          ipInput.value = '';
          refreshFriendsList();
        }
      } catch (e) {
        if (ipStatus) ipStatus.textContent = `错误: ${e.message}`;
      }
      ipAddBtn.disabled = false;
      ipAddBtn.textContent = '连接';
    });

    // 回车触发连接
    ipInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        ipAddBtn.click();
      }
    });
  }

  // 返回按钮（聊天区域）
  const backBtn = document.getElementById('chat-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      switchChatMode('kitty');
    });
  }

  // 初始加载好友列表
  refreshFriendsList();
}

async function refreshDiscoveredList() {
  try {
    const peers = await window.chatAPI.lanGetDiscovered();
    discoveredPeers = peers || [];
    renderDiscoveredList();
  } catch (e) { /* ignore */ }
}

function renderDiscoveredList() {
  const list = document.getElementById('friends-discovered-list');
  if (!list) return;
  list.innerHTML = '';

  if (discoveredPeers.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'friends-empty';
    empty.textContent = isScanning ? '搜索中...' : '暂未发现好友';
    list.appendChild(empty);
    return;
  }

  // 过滤掉已经是好友的
  const friendIds = new Set(lanFriends.map(f => f.id));
  const newPeers = discoveredPeers.filter(p => !friendIds.has(p.id));

  if (newPeers.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'friends-empty';
    empty.textContent = '附近的好友都已添加';
    list.appendChild(empty);
    return;
  }

  newPeers.forEach(peer => {
    const item = document.createElement('div');
    item.className = 'discovered-item';

    const icon = document.createElement('div');
    icon.className = 'discovered-icon';
    icon.textContent = '🖥';

    const info = document.createElement('div');
    info.className = 'discovered-info';

    const name = document.createElement('div');
    name.className = 'discovered-name';
    name.textContent = peer.nickname || '未知用户';

    const ip = document.createElement('div');
    ip.className = 'discovered-ip';
    ip.textContent = peer.ip;

    info.appendChild(name);
    info.appendChild(ip);

    const addBtn = document.createElement('button');
    addBtn.className = 'discovered-add-btn';
    addBtn.textContent = '添加';
    addBtn.addEventListener('click', () => {
      showAddFriendDialog(peer, item, addBtn);
    });

    item.appendChild(icon);
    item.appendChild(info);
    item.appendChild(addBtn);
    list.appendChild(item);
  });
}

function showAddFriendDialog(peer, parentItem, addBtn) {
  // 移除之前的弹窗
  const existing = document.querySelector('.friends-add-dialog');
  if (existing) existing.remove();

  const dialog = document.createElement('div');
  dialog.className = 'friends-add-dialog';

  const title = document.createElement('div');
  title.className = 'friends-add-dialog-title';
  title.textContent = `给 ${peer.nickname || '好友'} 起个备注名吧~`;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = '输入备注名';
  input.value = peer.nickname || '';

  const actions = document.createElement('div');
  actions.className = 'friends-add-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'friends-cancel-btn';
  cancelBtn.textContent = '取消';
  cancelBtn.addEventListener('click', () => dialog.remove());

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'friends-confirm-btn';
  confirmBtn.textContent = '确定';
  confirmBtn.addEventListener('click', async () => {
    const nickname = input.value.trim() || peer.nickname || '新朋友';
    await window.chatAPI.lanAddFriend(peer, nickname);
    dialog.remove();
    addBtn.disabled = true;
    addBtn.textContent = '已添加';
    renderSystemMessage(`已添加好友: ${nickname}`);
    refreshFriendsList();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmBtn.click();
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  dialog.appendChild(title);
  dialog.appendChild(input);
  dialog.appendChild(actions);

  // 插入到发现列表后面
  parentItem.after(dialog);
  input.focus();
  input.select();
}

async function refreshFriendsList() {
  try {
    lanFriends = await window.chatAPI.lanGetFriends() || [];
    renderFriendsList();
  } catch (e) {
    lanFriends = [];
    renderFriendsList();
  }
}

function renderFriendsList() {
  const list = document.getElementById('friends-list');
  if (!list) return;
  list.innerHTML = '';

  if (lanFriends.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'friends-empty';
    empty.textContent = '还没有好友，快去搜索添加吧~';
    list.appendChild(empty);
    return;
  }

  lanFriends.forEach(friend => {
    const item = document.createElement('div');
    item.className = 'friend-item';

    const avatar = document.createElement('div');
    avatar.className = 'friend-avatar';
    avatar.textContent = (friend.nickname || '?')[0];

    const dot = document.createElement('div');
    dot.className = friend.online ? 'friend-online-dot' : 'friend-offline-dot';
    avatar.appendChild(dot);

    const info = document.createElement('div');
    info.className = 'friend-info';

    const name = document.createElement('div');
    name.className = 'friend-name';
    name.textContent = friend.nickname || '未知';

    const statusText = document.createElement('div');
    statusText.className = 'friend-status-text';
    statusText.textContent = friend.online ? '在线' : '离线';

    info.appendChild(name);
    info.appendChild(statusText);

    const actions = document.createElement('div');
    actions.className = 'friend-actions';

    // 聊天按钮
    const chatBtn = document.createElement('button');
    chatBtn.className = 'friend-action-btn chat-btn';
    chatBtn.innerHTML = SVG_CHAT();
    chatBtn.title = '聊天';
    chatBtn.setAttribute('aria-label', '聊天');
    chatBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      switchChatMode('friend', friend.id, friend.nickname);
    });

    // 编辑按钮
    const editBtn = document.createElement('button');
    editBtn.className = 'friend-action-btn';
    editBtn.innerHTML = SVG_EDIT();
    editBtn.title = '修改备注';
    editBtn.setAttribute('aria-label', '修改备注');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showEditFriendDialog(friend, item);
    });

    // 删除按钮
    const delBtn = document.createElement('button');
    delBtn.className = 'friend-action-btn delete-btn';
    delBtn.innerHTML = SVG_CLOSE();
    delBtn.title = '删除好友';
    delBtn.setAttribute('aria-label', '删除好友');
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      // 二次确认：第一次点击显示警告，再次点击确认删除
      if (delBtn.dataset.confirming === 'true') {
        await window.chatAPI.lanRemoveFriend(friend.id);
        renderSystemMessage(`已删除好友: ${friend.nickname}`);
        if (currentFriendId === friend.id) {
          switchChatMode('kitty');
        }
        refreshFriendsList();
      } else {
        delBtn.dataset.confirming = 'true';
        delBtn.title = '再次点击确认删除';
        delBtn.style.background = 'var(--color-danger)';
        delBtn.style.color = '#fff';
        setTimeout(() => {
          delBtn.dataset.confirming = 'false';
          delBtn.title = '删除好友';
          delBtn.style.background = '';
          delBtn.style.color = '';
        }, 2500);
      }
    });

    actions.appendChild(chatBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    item.appendChild(avatar);
    item.appendChild(info);
    item.appendChild(actions);

    // 点击整个卡片进入聊天
    item.addEventListener('click', () => {
      switchChatMode('friend', friend.id, friend.nickname);
    });

    list.appendChild(item);
  });
}

function showEditFriendDialog(friend, parentItem) {
  const existing = document.querySelector('.friends-add-dialog');
  if (existing) existing.remove();

  const dialog = document.createElement('div');
  dialog.className = 'friends-add-dialog';

  const title = document.createElement('div');
  title.className = 'friends-add-dialog-title';
  title.textContent = '修改备注名';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = friend.nickname || '';

  const actions = document.createElement('div');
  actions.className = 'friends-add-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'friends-cancel-btn';
  cancelBtn.textContent = '取消';
  cancelBtn.addEventListener('click', () => dialog.remove());

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'friends-confirm-btn';
  confirmBtn.textContent = '确定';
  confirmBtn.addEventListener('click', async () => {
    const nickname = input.value.trim();
    if (nickname) {
      await window.chatAPI.lanUpdateFriend(friend.id, { nickname });
      renderSystemMessage(`备注已修改为: ${nickname}`);
      refreshFriendsList();
    }
    dialog.remove();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmBtn.click();
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  dialog.appendChild(title);
  dialog.appendChild(input);
  dialog.appendChild(actions);
  parentItem.after(dialog);
  input.focus();
  input.select();
}

// === 聊天模式切换 ===
async function switchChatMode(mode, friendId, friendName) {
  if (currentChatMode === mode && currentFriendId === friendId) return;

  // 保存当前消息
  if (currentChatMode === 'kitty') {
    // Kitty 消息已在 messages 中
  } else if (currentChatMode === 'friend' && currentFriendId) {
    friendMessages[currentFriendId] = [...messages];
  }

  const backBtn = document.getElementById('chat-back-btn');
  const headerName = document.getElementById('chat-header-name');
  const headerStatus = document.getElementById('chat-header-status');

  if (mode === 'friend' && friendId) {
    currentChatMode = 'friend';
    currentFriendId = friendId;
    currentFriendName = friendName || '好友';

    // 更新 header
    if (headerName) headerName.textContent = currentFriendName;
    if (headerStatus) headerStatus.textContent = '局域网聊天';
    if (backBtn) backBtn.classList.remove('hidden');

    // 更新输入框
    chatInput.placeholder = `和 ${currentFriendName} 说些什么...`;

    // 加载好友历史消息
    messages = friendMessages[friendId] || [];
    if (!messages.length) {
      try {
        messages = await window.chatAPI.lanGetChatHistory(friendId) || [];
        friendMessages[friendId] = [...messages];
      } catch (e) { /* ignore */ }
    }
  } else {
    currentChatMode = 'kitty';
    currentFriendId = null;
    currentFriendName = '';

    // 恢复 header
    if (headerName) headerName.textContent = 'Hello Kitty';
    if (headerStatus) headerStatus.textContent = '在线 · 陪伴中';
    if (backBtn) backBtn.classList.add('hidden');

    // 恢复输入框
    chatInput.placeholder = '和 Kitty 说些什么...';

    // 加载 Kitty 历史消息
    try {
      messages = await window.chatAPI.loadHistory() || [];
    } catch (e) { messages = []; }
  }

  // 重新渲染消息
  messageList.innerHTML = '';
  if (messages.length === 0) {
    showEmptyState();
  } else {
    for (const msg of messages) {
      renderMessage(msg, false);
    }
    scrollToBottom();
  }
}

// === 局域网事件处理 ===
function handleLANEvent(payload) {
  if (!payload) return;
  const { event, data } = payload;

  switch (event) {
    case 'peer-discovered':
      // 刷新发现列表
      if (currentView === 'friends') {
        refreshDiscoveredList();
        const status = document.getElementById('friends-scan-status');
        if (status) status.textContent = `已发现 ${(discoveredPeers.length + 1)} 人`;
      }
      break;

    case 'discovery-stopped':
      isScanning = false;
      const scanBtn = document.getElementById('friends-scan-btn');
      if (scanBtn) {
        scanBtn.innerHTML = SVG_SEARCH() + '搜索附近的好友';
        scanBtn.classList.remove('scanning');
      }
      const scanStatus = document.getElementById('friends-scan-status');
      if (scanStatus) scanStatus.textContent = `搜索结束，共发现 ${discoveredPeers.length} 人`;
      break;

    case 'message-received':
      if (data && data.friendId && data.message) {
        handleFriendMessage(data.friendId, data.message);
      }
      break;

    case 'friend-online':
      if (data && data.friendId) {
        // 更新好友在线状态
        lanFriends = lanFriends.map(f =>
          f.id === data.friendId ? { ...f, online: true } : f
        );
        if (currentView === 'friends') renderFriendsList();
        // 如果正在和这个好友聊天，更新 header
        if (currentChatMode === 'friend' && currentFriendId === data.friendId) {
          const status = document.getElementById('chat-header-status');
          if (status) status.textContent = '在线';
        }
      }
      break;

    case 'friend-offline':
      if (data && data.friendId) {
        lanFriends = lanFriends.map(f =>
          f.id === data.friendId ? { ...f, online: false } : f
        );
        if (currentView === 'friends') renderFriendsList();
        if (currentChatMode === 'friend' && currentFriendId === data.friendId) {
          const status = document.getElementById('chat-header-status');
          if (status) status.textContent = '离线';
        }
      }
      break;
  }
}

function handleFriendMessage(friendId, msg) {
  // 如果当前正在和该好友聊天，实时显示
  if (currentChatMode === 'friend' && currentFriendId === friendId) {
    messages.push(msg);
    renderMessage(msg, true);
    scrollToBottom();
  } else {
    // 缓存消息
    if (!friendMessages[friendId]) friendMessages[friendId] = [];
    friendMessages[friendId].push(msg);
    // 找到好友昵称
    const friend = lanFriends.find(f => f.id === friendId);
    const name = friend ? friend.nickname : '好友';
    renderSystemMessage(`${name} 发来了一条消息~`);
  }
}
