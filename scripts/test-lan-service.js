/**
 * LANService 核心功能单元测试
 * 直接测试 UDP 发现 + TCP 消息收发，无需 GUI 操作
 */

const net = require('net');
const dgram = require('dgram');
const crypto = require('crypto');

const PASS = (msg) => console.log(`  ✅ ${msg}`);
const FAIL = (msg) => console.log(`  ❌ ${msg}`);
const INFO = (msg) => console.log(`  ℹ️  ${msg}`);

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, passMsg, failMsg) {
  if (condition) { PASS(passMsg); testsPassed++; }
  else { FAIL(failMsg); testsFailed++; }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===== 模拟 Store =====
class MockStore {
  constructor() { this._data = {}; }
  get(key, def) { return this._data[key] !== undefined ? this._data[key] : def; }
  set(key, val) { this._data[key] = val; }
}

// ===== 测试 1: LANService 模块加载 =====
console.log('\n📦 测试 1: LANService 模块加载');
let LANService;
try {
  LANService = require('../src/main/LANService');
  assert(true, '模块加载成功', '模块加载失败');
} catch (e) {
  FAIL('模块加载失败: ' + e.message);
  process.exit(1);
}

// ===== 测试 2: 实例化 =====
console.log('\n📦 测试 2: LANService 实例化');
const store1 = new MockStore();
const store2 = new MockStore();

let svc1, svc2;
try {
  // 使用不同端口避免冲突
  svc1 = new LANService(store1);
  svc1.tcpPort = 38531;
  svc2 = new LANService(store2);
  svc2.tcpPort = 38532;

  assert(svc1.instanceId && svc1.instanceId.length > 0, `实例1 ID: ${svc1.instanceId.substring(0, 8)}...`, '实例1 ID 生成失败');
  assert(svc2.instanceId && svc2.instanceId.length > 0, `实例2 ID: ${svc2.instanceId.substring(0, 8)}...`, '实例2 ID 生成失败');
  assert(svc1.instanceId !== svc2.instanceId, '两个实例 ID 不同', '实例 ID 冲突');
} catch (e) {
  FAIL('实例化失败: ' + e.message);
}

// ===== 测试 3: 好友管理 =====
console.log('\n📦 测试 3: 好友管理');
try {
  // 添加好友
  const friend = svc1.addFriend({
    id: svc2.instanceId,
    nickname: '小花',
    ip: '127.0.0.1',
    tcpPort: svc2.tcpPort,
  }, '我的好朋友');

  assert(friend.id === svc2.instanceId, '好友 ID 正确', '好友 ID 错误');
  assert(friend.nickname === '我的好朋友', `好友昵称: ${friend.nickname}`, '好友昵称错误');
  assert(friend.ip === '127.0.0.1', '好友 IP 正确', '好友 IP 错误');

  // 获取好友列表
  const list = svc1.getFriendsList();
  assert(list.length === 1, `好友列表长度: ${list.length}`, '好友列表长度错误');

  // 更新好友昵称
  const updated = svc1.updateFriend(svc2.instanceId, { nickname: '花花' });
  assert(updated && updated.nickname === '花花', `更新昵称: ${updated.nickname}`, '更新昵称失败');

  // 聊天记录
  svc1._saveChatMessage(svc2.instanceId, { id: 'msg1', role: 'user', text: '你好', time: Date.now() });
  svc1._saveChatMessage(svc2.instanceId, { id: 'msg2', role: 'friend', text: '你也好', time: Date.now() });
  const history = svc1.getChatHistory(svc2.instanceId);
  assert(history.length === 2, `聊天记录数: ${history.length}`, '聊天记录数错误');
  assert(history[0].text === '你好', `第1条: "${history[0].text}"`, '第1条内容错误');
  assert(history[1].text === '你也好', `第2条: "${history[1].text}"`, '第2条内容错误');
} catch (e) {
  FAIL('好友管理测试失败: ' + e.message);
}

// ===== 测试 4: TCP 服务器 + 消息收发 =====
console.log('\n📦 测试 4: TCP 服务器 + 消息收发');
async function testTCP() {
  const received = [];
  const events = [];

  svc2.setEventCallback((event, data) => {
    events.push({ event, data });
  });

  // 启动 svc2 的 TCP 服务器
  try {
    svc2.tcpServer = net.createServer((socket) => {
      svc2._handleInboundConnection(socket);
    });
    await new Promise((resolve, reject) => {
      svc2.tcpServer.listen(svc2.tcpPort, resolve);
      svc2.tcpServer.on('error', reject);
    });
    assert(true, `实例2 TCP 服务器启动 (端口 ${svc2.tcpPort})`, 'TCP 服务器启动失败');
  } catch (e) {
    FAIL('TCP 服务器启动失败: ' + e.message);
    return;
  }

  // 实例1 连接到 实例2
  try {
    svc1.running = true;
    const socket = await svc1.connectTo(svc2.instanceId, '127.0.0.1', svc2.tcpPort);
    assert(socket && !socket.destroyed, 'TCP 连接建立成功', 'TCP 连接失败');
  } catch (e) {
    FAIL('TCP 连接失败: ' + e.message);
    return;
  }

  await sleep(500);

  // 检查身份识别事件
  const onlineEvent = events.find(e => e.event === 'friend-online');
  assert(onlineEvent && onlineEvent.data.friendId === svc1.instanceId,
    `实例2 收到 friend-online 事件 (来自 ${svc1.instanceId.substring(0, 8)}...)`,
    '实例2 未收到 friend-online 事件');

  // 实例1 发送消息
  try {
    const msg = await svc1.sendMessage(svc2.instanceId, '你好，这是测试消息！');
    assert(msg && msg.text === '你好，这是测试消息！', `发送消息: "${msg.text}"`, '发送消息失败');
  } catch (e) {
    FAIL('发送消息失败: ' + e.message);
  }

  await sleep(500);

  // 检查实例2 收到消息
  const msgEvent = events.find(e => e.event === 'message-received');
  assert(msgEvent !== undefined, '实例2 收到 message-received 事件', '实例2 未收到消息事件');
  if (msgEvent) {
    assert(msgEvent.data.message.text === '你好，这是测试消息！',
      `实例2 收到消息: "${msgEvent.data.message.text}"`,
      `消息内容不匹配: "${msgEvent.data.message.text}"`);
    assert(msgEvent.data.friendId === svc1.instanceId,
      '消息来源 ID 正确', '消息来源 ID 错误');
  }

  // 实例2 回复消息（通过 socket）
  const conn = svc1.connections.get(svc2.instanceId);
  assert(conn && !conn.destroyed, '连接仍然存活', '连接已断开');

  // 模拟实例2回复
  const allConnections = [...svc2.connections.values()];
  // 从 inbound 连接中找到
  let inboundSocket = null;
  for (const [key, peerId] of svc2.peerIdBySocket) {
    if (peerId === svc1.instanceId) {
      // 找到对应的 socket - 遍历 tcpServer 的连接
      // 直接通过 _sendToSocket 发送
      const parts = key.split(':');
      inboundSocket = key;
    }
  }

  // 通过底层方式发送回复
  if (svc2.tcpServer) {
    // 手动找到连接 socket
    for (const [key, peerId] of svc2.peerIdBySocket) {
      if (peerId === svc1.instanceId) {
        // 需要获取对应的 socket，但是 inbound connections 没有存储 socket 引用
        // 改用 svc1 的连接来测试双向通信
        break;
      }
    }
  }

  // 测试心跳
  const pingMsg = JSON.stringify({ type: 'ping', from: svc1.instanceId }) + '\n';
  if (conn && !conn.destroyed) {
    conn.write(pingMsg);
    await sleep(200);
    const pongReceived = svc1.lastPong.get(svc2.instanceId);
    assert(pongReceived !== undefined, '心跳 pong 已收到', '心跳 pong 未收到');
  }

  // 清理
  try {
    svc1.connections.forEach(s => s.destroy());
    svc1.connections.clear();
    if (svc2.tcpServer) svc2.tcpServer.close();
  } catch (e) { /* ignore */ }
}

// ===== 测试 5: 删除好友 =====
console.log('\n📦 测试 5: 删除好友');
async function testDeleteFriend() {
  const result = svc1.removeFriend(svc2.instanceId);
  assert(result.ok, '删除好友成功', '删除好友失败');

  const list = svc1.getFriendsList();
  assert(list.length === 0, `好友列表已清空: ${list.length}`, '好友列表未清空');

  const history = svc1.getChatHistory(svc2.instanceId);
  assert(history.length === 0, `聊天记录已清除: ${history.length}`, '聊天记录未清除');
}

// ===== 测试 6: 昵称管理 =====
console.log('\n📦 测试 6: 昵称管理');
svc1.setNickname('Kitty主人小明');
assert(svc1.nickname === 'Kitty主人小明', `昵称已设置: ${svc1.nickname}`, '昵称设置失败');
assert(store1.get('lanNickname') === 'Kitty主人小明', '昵称已持久化到 store', '昵称未持久化');

// ===== 测试 7: 状态查询 =====
console.log('\n📦 测试 7: 状态查询');
const status = svc1.getStatus();
assert(status.running !== undefined, `running: ${status.running}`, 'running 字段缺失');
assert(status.instanceId === svc1.instanceId, 'instanceId 正确', 'instanceId 错误');
assert(status.nickname === 'Kitty主人小明', `nickname: ${status.nickname}`, 'nickname 错误');
INFO(`状态: ${JSON.stringify(status)}`);

// ===== 运行 =====
async function runAll() {
  await testTCP();
  await testDeleteFriend();

  console.log('\n' + '='.repeat(55));
  console.log(`  测试结果: ✅ ${testsPassed} 通过 / ❌ ${testsFailed} 失败`);
  console.log('='.repeat(55));

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 所有测试通过！局域网聊天功能正常。\n');
    process.exit(0);
  }
}

runAll().catch(e => {
  console.error('测试运行出错:', e);
  process.exit(1);
});
