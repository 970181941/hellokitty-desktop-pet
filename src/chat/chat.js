// === DOM 元素 ===
const messageList = document.getElementById('message-list');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const btnClose = document.getElementById('btn-close');
const typingIndicator = document.getElementById('typing-indicator');
const toolbar = document.getElementById('toolbar');

// 面板元素
const playPopup = document.getElementById('play-popup');
const scheduleContainer = document.getElementById('schedule-container');
const infoPanel = document.getElementById('info-panel');
const todoPanel = document.getElementById('todo-panel');
const settingsPanel = document.getElementById('settings-panel');

// === 状态 ===
let messages = [];
let isSending = false;
let pomodoroTimerEl = null;
let currentSchedule = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
let selectedDay = 'mon';
let latestStatusData = null;
let todos = [];
let currentSkinId = 'sakura';
// 面板状态：日程和待办可同时打开，玩耍、信息、设置面板与其他互斥
let panelState = { play: false, schedule: false, info: false, todo: false, settings: false };

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

  // 初始化工具栏
  initToolbar();

  // 初始化周日程面板
  initSchedulePanel();

  // 初始化待办面板
  initTodoPanel();

  // 初始化设置面板
  initSettingsPanel();

  // 初始化状态栏
  refreshStatusBar();

  // 加载并应用皮肤
  loadAndApplySkin();

  // 监听状态推送
  window.chatAPI.onStatusUpdate((data) => {
    latestStatusData = data;
    updateStatusBar(data);
    updatePlayButtonStates(data);
    // 如果信息面板正在显示，更新它
    if (panelState.info) {
      updateInfoPanel(data);
    }
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

  // 点击面板外部关闭玩耍弹出
  document.addEventListener('click', (e) => {
    if (panelState.play && !playPopup.contains(e.target) && !toolbar.contains(e.target)) {
      togglePanel('play');
    }
  });

  // 聚焦输入框
  chatInput.focus();
});

// === 皮肤系统 ===
async function loadAndApplySkin() {
  try {
    const skinId = await window.chatAPI.getSkin();
    if (skinId) {
      currentSkinId = skinId;
      applySkin(skinId);
    }
  } catch (e) {
    // ignore
  }
}

function applySkin(skinId) {
  const skin = SKINS[skinId] || SKINS.sakura;
  const root = document.getElementById('chat-app');
  root.style.setProperty('--color-bg', skin.bg);
  root.style.setProperty('--color-bg-alt', skin.bgAlt);
  root.style.setProperty('--color-primary', skin.primary);
  root.style.setProperty('--color-primary-light', skin.primaryLight);
  root.style.setProperty('--color-primary-dark', skin.primaryDark);
  root.style.setProperty('--color-border', skin.border);
  root.style.setProperty('--color-text-muted', skin.textMuted);
  root.style.setProperty('--color-surface', skin.surface);
  // 更新 header 渐变
  document.getElementById('chat-header').style.background =
    `linear-gradient(135deg, ${skin.primaryLight}, ${skin.primary})`;
  currentSkinId = skinId;
}

async function selectSkin(skinId) {
  applySkin(skinId);
  try {
    await window.chatAPI.setSkin(skinId);
  } catch (e) {
    // ignore
  }
  // 更新皮肤卡片选中状态
  document.querySelectorAll('.skin-card').forEach(card => {
    card.classList.toggle('active', card.dataset.skinId === skinId);
  });
}

// === 面板切换 ===
// 关闭与目标面板互斥的面板
function closeExclusivePanels(except) {
  // 玩耍、信息、设置面板：与所有其他面板互斥
  if (except === 'play' || except === 'info' || except === 'settings') {
    Object.keys(panelState).forEach(name => {
      if (name !== except && panelState[name]) {
        setPanelVisibility(name, false);
      }
    });
  } else {
    // 日程和待办：只关闭玩耍、信息、设置面板
    ['play', 'info', 'settings'].forEach(name => {
      if (panelState[name]) {
        setPanelVisibility(name, false);
      }
    });
  }
}

function setPanelVisibility(name, visible) {
  const panelMap = {
    play: playPopup,
    schedule: scheduleContainer,
    info: infoPanel,
    todo: todoPanel,
    settings: settingsPanel,
  };
  const el = panelMap[name];
  if (!el) return;

  panelState[name] = visible;
  if (visible) {
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }

  // 更新对应工具栏按钮的激活状态
  const btn = toolbar.querySelector(`[data-action="${name}"]`);
  if (btn) {
    if (visible) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  }
}

function togglePanel(panelName) {
  const isOpen = panelState[panelName];

  if (isOpen) {
    // 关闭该面板
    setPanelVisibility(panelName, false);
  } else {
    // 关闭互斥面板，然后打开目标面板
    closeExclusivePanels(panelName);
    setPanelVisibility(panelName, true);
  }
}

// === 工具栏初始化 ===
function initToolbar() {
  const buttons = toolbar.querySelectorAll('.tool-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;

      switch (action) {
        case 'play':
          togglePanel('play');
          break;
        case 'schedule':
          togglePanel('schedule');
          break;
        case 'status':
          togglePanel('info');
          // 打开时更新信息面板
          if (panelState.info && latestStatusData) {
            updateInfoPanel(latestStatusData);
          }
          break;
        case 'todo':
          togglePanel('todo');
          break;
        case 'settings':
          togglePanel('settings');
          // 打开时加载最新数据
          if (panelState.settings) {
            refreshSettingsPanel();
          }
          break;
      }
    });
  });

  // 初始化玩耍弹出面板按钮事件
  initPlayPopup();

  // 初始获取状态来设置按钮状态
  refreshButtonStates();
}

// === 玩耍弹出面板 ===
function initPlayPopup() {
  const playBtns = playPopup.querySelectorAll('.play-btn');
  playBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;

      // 番茄钟：切换开始/停止
      if (action === 'pomodoro') {
        await window.chatAPI.triggerAction('pomodoro');
        togglePanel('play');
        return;
      }

      // 其他动作
      await window.chatAPI.triggerAction(action);
      togglePanel('play');
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
  const playBtns = playPopup.querySelectorAll('.play-btn');
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
  const dayBtns = scheduleContainer.querySelectorAll('.day-btn');
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

  // 取消/关闭
  document.getElementById('schedule-cancel').addEventListener('click', () => {
    togglePanel('schedule');
  });
  scheduleContainer.querySelector('.panel-close-btn').addEventListener('click', () => {
    togglePanel('schedule');
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
    delBtn.textContent = '✕';
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
    togglePanel('schedule');
  } catch (e) {
    renderSystemMessage('保存失败了...再试试~');
  }
}

// === 状态信息面板 ===
function updateInfoPanel(data) {
  // 主人信息
  const ownerNameEl = document.getElementById('info-owner-name');
  const daysEl = document.getElementById('info-days');
  ownerNameEl.textContent = data.ownerName || '新朋友';
  daysEl.textContent = data.days > 0 ? `第 ${data.days} 天` : '初次见面';

  // Kitty 心情
  const moodEl = document.getElementById('info-mood');
  const moodEmoji = MOOD_EMOJIS[data.moodLevel] || '😊';
  moodEl.textContent = `${moodEmoji} ${data.moodName || ''}`;

  // 亲密度
  const levelNameEl = document.getElementById('info-level-name');
  const affinityNumEl = document.getElementById('info-affinity-num');
  const progressEl = document.getElementById('info-progress');
  const progressLabelEl = document.getElementById('info-progress-label');
  const streakEl = document.getElementById('info-streak');

  const levelEmoji = AFFINITY_EMOJIS[data.affinityLevelNum] || '💗';
  levelNameEl.textContent = `${levelEmoji} ${data.affinityLevelName || ''}`;
  affinityNumEl.textContent = `${data.affinity || 0}`;

  // 进度条
  const currentMin = data.nextLevelMin || 0;
  const currentMax = data.nextLevelMax || 2500;
  const currentAffinity = data.affinity || 0;
  const range = currentMax - currentMin;
  const progress = range > 0 ? Math.min(((currentAffinity - currentMin) / range) * 100, 100) : 100;
  progressEl.style.width = `${Math.max(0, progress)}%`;
  progressLabelEl.textContent = `${currentAffinity} / ${currentMax}`;

  // 连续登录
  streakEl.textContent = data.loginStreakDays > 0 ? `${data.loginStreakDays} 天` : '0 天';
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

  // 关闭按钮
  todoPanel.querySelector('.panel-close-btn').addEventListener('click', () => {
    togglePanel('todo');
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
    checkbox.addEventListener('click', () => toggleTodo(todo.id));

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const delBtn = document.createElement('button');
    delBtn.className = 'todo-delete';
    delBtn.textContent = '✕';
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
  // 关闭按钮
  settingsPanel.querySelector('.panel-close-btn').addEventListener('click', () => {
    togglePanel('settings');
  });

  // 主人信息保存
  document.getElementById('settings-save-owner').addEventListener('click', saveOwnerInfo);

  // AI Key 保存
  document.getElementById('settings-save-ai').addEventListener('click', saveAIKey);

  // 渲染皮肤网格
  renderSkinGrid();

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
    keyInput.placeholder = hasKey ? '已设置 (留空保持不变)' : 'sk-...';
    keyInput.value = '';
  } catch (e) {
    // ignore
  }

  // 更新皮肤选中状态
  document.querySelectorAll('.skin-card').forEach(card => {
    card.classList.toggle('active', card.dataset.skinId === currentSkinId);
  });
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
    document.getElementById('settings-api-key').placeholder = '已设置 (留空保持不变)';
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

    const preview = document.createElement('div');
    preview.className = 'skin-preview';
    preview.style.background = `linear-gradient(135deg, ${skin.primaryLight}, ${skin.primary})`;

    const name = document.createElement('span');
    name.className = 'skin-name';
    name.textContent = skin.name;

    card.appendChild(preview);
    card.appendChild(name);

    card.addEventListener('click', () => selectSkin(id));

    grid.appendChild(card);
  });
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
    installBtn.disabled = true;
    installBtn.textContent = '安装中...';
    try {
      await window.chatAPI.installUpdate();
      setUpdateStatus('正在安装更新，应用即将重启...');
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
      break;

    case 'available':
      setUpdateStatus(`发现新版本 v${data.version || ''}，准备下载...`);
      window.chatAPI.downloadUpdate().catch(() => {});
      break;

    case 'not-available':
      setUpdateStatus('当前已是最新版本');
      progressBar.classList.add('hidden');
      progressPct.classList.add('hidden');
      installBtn.classList.add('hidden');
      checkBtn.disabled = false;
      checkBtn.textContent = '检查更新';
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

    case 'ready':
      setUpdateStatus(`新版本 v${data.version || ''} 已就绪`);
      progressBar.classList.add('hidden');
      progressPct.classList.add('hidden');
      installBtn.classList.remove('hidden');
      installBtn.disabled = false;
      installBtn.textContent = '安装更新';
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
      // 刷新设置面板（如果打开的话）
      if (panelState.settings) {
        refreshSettingsPanel();
      }
    } catch (e) {
      // ignore
    }
  }
}

// === 渲染消息 ===
function renderMessage(msg, animate) {
  const row = document.createElement('div');
  row.className = `message-row ${msg.role === 'user' ? 'user' : 'kitty'}`;

  if (!animate) {
    row.style.animation = 'none';
  }

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  if (msg.role === 'user') {
    avatar.textContent = '我';
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
  empty.innerHTML = '<div class="empty-icon"><img src="assets/avatar.jpeg" alt="HK"></div><div class="empty-text">和 Kitty 打个招呼吧~</div>';
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
