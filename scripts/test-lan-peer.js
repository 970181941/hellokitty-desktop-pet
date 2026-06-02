/**
 * 局域网聊天功能测试脚本
 * 模拟第二个用户（好友），测试 UDP 发现 + TCP 消息收发
 * 
 * 用法：
 *   1. 先启动 HelloKitty 桌面宠物应用
 *   2. 在应用里点击"搜索附近好友"
 *   3. 运行此脚本: node scripts/test-lan-peer.js
 *   4. 观察脚本输出和应用中的发现/消息结果
 */

const dgram = require('dgram');
const net = require('net');
const os = require('os');
const crypto = require('crypto');

const UDP_PORT = 38527;
const PEER_UDP_PORT = 38529; // 模拟对端的 UDP 端口
const PEER_TCP_PORT = 38530; // 模拟对端的 TCP 端口

const FAKE_ID = crypto.randomUUID();
const FAKE_NICKNAME = '测试好友小花';

let udpSocket = null;
let tcpServer = null;
let connections = new Map();
let buffers = new Map();

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// ===== 1. UDP: 模拟对端广播和接收 =====
function initUDP() {
  udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

  udpSocket.on('message', (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString('utf-8'));
      if (data.id === FAKE_ID) return; // 忽略自己的广播

      if (data.type === 'hello') {
        console.log(`\n🔍 发现 Kitty 用户广播:`);
        console.log(`   ID: ${data.id}`);
        console.log(`   昵称: ${data.nickname}`);
        console.log(`   TCP端口: ${data.tcpPort}`);
        console.log(`   来源: ${rinfo.address}:${rinfo.port}`);

        // 回复 hello-ack
        const ack = JSON.stringify({
          type: 'hello-ack',
          id: FAKE_ID,
          nickname: FAKE_NICKNAME,
          tcpPort: PEER_TCP_PORT,
          ts: Date.now(),
        });
        udpSocket.send(ack, PEER_UDP_PORT, rinfo.address, (err) => {
          if (err) console.error('   ❌ 发送 hello-ack 失败:', err.message);
          else console.log(`   ✅ 已回复 hello-ack (昵称: ${FAKE_NICKNAME})`);
        });

        // 也主动发送一个 hello，确保对方也能发现我们
        const hello = JSON.stringify({
          type: 'hello',
          id: FAKE_ID,
          nickname: FAKE_NICKNAME,
          tcpPort: PEER_TCP_PORT,
          ts: Date.now(),
        });
        udpSocket.send(hello, PEER_UDP_PORT, rinfo.address);

      } else if (data.type === 'hello-ack') {
        console.log(`   📩 收到 hello-ack 回复: ${data.nickname} (${data.id})`);
      }
    } catch (e) {
      // ignore malformed
    }
  });

  udpSocket.bind(PEER_UDP_PORT, () => {
    try { udpSocket.setBroadcast(true); } catch (e) { /* ignore */ }
    console.log(`✅ UDP 监听已启动 (端口 ${PEER_UDP_PORT})`);

    // 主动广播 hello
    broadcastHello();
    setInterval(broadcastHello, 3000);
  });
}

function broadcastHello() {
  if (!udpSocket) return;
  const payload = JSON.stringify({
    type: 'hello',
    id: FAKE_ID,
    nickname: FAKE_NICKNAME,
    tcpPort: PEER_TCP_PORT,
    ts: Date.now(),
  });
  const buf = Buffer.from(payload, 'utf-8');
  const addrs = getBroadcastAddresses();
  for (const addr of addrs) {
    try { udpSocket.send(buf, 0, buf.length, UDP_PORT, addr); } catch (e) { /* ignore */ }
  }
}

function getBroadcastAddresses() {
  const addresses = [];
  try {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          const ip = iface.address.split('.').map(Number);
          const mask = iface.netmask.split('.').map(Number);
          const bcast = ip.map((octet, i) => octet | (~mask[i] & 255));
          addresses.push(bcast.join('.'));
        }
      }
    }
  } catch (e) { /* ignore */ }
  if (addresses.length === 0) addresses.push('255.255.255.255');
  return addresses;
}

// ===== 2. TCP: 模拟对端接收和发送消息 =====
function initTCP() {
  tcpServer = net.createServer((socket) => {
    const key = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`\n🔗 TCP 连接已建立: ${key}`);
    buffers.set(key, '');

    socket.on('data', (chunk) => {
      const buf = (buffers.get(key) || '') + chunk.toString('utf-8');
      const lines = buf.split('\n');
      buffers.set(key, lines.pop() || '');

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          handleTCPMessage(data, socket, key);
        } catch (e) { /* ignore */ }
      }
    });

    socket.on('close', () => {
      console.log(`   🔌 TCP 连接已断开: ${key}`);
      connections.delete(key);
      buffers.delete(key);
    });

    socket.on('error', () => {
      buffers.delete(key);
    });
  });

  tcpServer.listen(PEER_TCP_PORT, () => {
    console.log(`✅ TCP 服务器已启动 (端口 ${PEER_TCP_PORT})`);
  });
}

function handleTCPMessage(data, socket, key) {
  if (data.type === 'identify') {
    console.log(`   👋 对方标识: ${data.nickname} (${data.from})`);
    connections.set(key, { socket, friendId: data.from, nickname: data.nickname });

    // 回复自己的身份
    const reply = JSON.stringify({
      type: 'identify',
      from: FAKE_ID,
      nickname: FAKE_NICKNAME,
    });
    socket.write(reply + '\n');

  } else if (data.type === 'message') {
    console.log(`\n💬 收到消息:`);
    console.log(`   来自: ${data.fromName || '未知'} (${data.from})`);
    console.log(`   内容: "${data.text}"`);
    console.log(`   时间: ${new Date(data.ts).toLocaleTimeString()}`);

    // 自动回复
    const replyText = getAutoReply(data.text);
    const reply = JSON.stringify({
      type: 'message',
      id: crypto.randomUUID(),
      from: FAKE_ID,
      fromName: FAKE_NICKNAME,
      text: replyText,
      ts: Date.now(),
    });

    setTimeout(() => {
      socket.write(reply + '\n');
      console.log(`   📤 已回复: "${replyText}"`);
    }, 800); // 模拟 0.8 秒延迟

  } else if (data.type === 'ping') {
    const pong = JSON.stringify({ type: 'pong', from: FAKE_ID });
    socket.write(pong + '\n');
  } else if (data.type === 'pong') {
    // ignore
  }
}

function getAutoReply(text) {
  const replies = [
    '你好呀！我是小花~',
    '哈哈，收到你的消息啦！',
    '好开心能和你聊天~',
    'Kitty 好可爱！',
    '今天天气真好呢~',
    '你在做什么呀？',
    '我也在用桌面宠物呢！',
    '嘻嘻~',
    '好呀好呀~',
    '真有意思！',
  ];

  // 根据关键词回复
  if (text.includes('你好') || text.includes('hi') || text.includes('hello')) {
    return '你好你好！很高兴认识你~ 🌸';
  }
  if (text.includes('测试') || text.includes('test')) {
    return '测试成功！消息收发正常~ ✅';
  }
  if (text.includes('再见') || text.includes('拜拜')) {
    return '拜拜~ 下次再聊！👋';
  }

  return replies[Math.floor(Math.random() * replies.length)];
}

// ===== 启动 =====
console.log('='.repeat(55));
console.log('  🐱 Hello Kitty 局域网聊天测试工具');
console.log('='.repeat(55));
console.log(`\n📋 模拟好友信息:`);
console.log(`   ID: ${FAKE_ID}`);
console.log(`   昵称: ${FAKE_NICKNAME}`);
console.log(`   UDP端口: ${PEER_UDP_PORT} (本机), 目标: ${UDP_PORT}`);
console.log(`   TCP端口: ${PEER_TCP_PORT}`);
console.log(`   本机IP: ${getLocalIP()}`);
console.log('');

initUDP();
initTCP();

console.log('\n📌 操作步骤:');
console.log('   1. 启动 HelloKitty 桌面宠物应用');
console.log('   2. 打开聊天窗口 → 侧边栏 → "朋友"');
console.log('   3. 点击"搜索附近的好友"');
console.log('   4. 应该会看到 "测试好友小花"');
console.log('   5. 添加好友后，点击 💬 发起聊天');
console.log('   6. 发送消息，会自动收到回复');
console.log('\n   按 Ctrl+C 退出测试\n');

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n\n🛑 正在关闭测试工具...');
  if (udpSocket) { try { udpSocket.close(); } catch (e) { /* ignore */ } }
  if (tcpServer) { try { tcpServer.close(); } catch (e) { /* ignore */ } }
  for (const [, info] of connections) {
    try { info.socket.destroy(); } catch (e) { /* ignore */ }
  }
  process.exit(0);
});
