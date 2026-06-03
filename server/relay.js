#!/usr/bin/env node
/**
 * HelloKitty 桌面宠物 - 互联网消息中继服务器
 * 用法: node server/relay.js [port]
 * 默认端口: 38530
 *
 * 协议:
 *   客户端 → 服务器:
 *     { type: 'register', id, nickname }
 *     { type: 'message', to, text }
 *     { type: 'ping' }
 *
 *   服务器 → 客户端:
 *     { type: 'registered', users: [{id, nickname}] }
 *     { type: 'user-online', id, nickname }
 *     { type: 'user-offline', id }
 *     { type: 'message', from, fromName, text, ts }
 *     { type: 'pong' }
 */

const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = parseInt(process.argv[2]) || 38530;
const HEARTBEAT_INTERVAL = 30000;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      users: users.size,
      uptime: process.uptime(),
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('HelloKitty Relay Server is running');
  }
});

const wss = new WebSocketServer({ server });
const users = new Map();

function broadcast(excludeId, data) {
  const msg = JSON.stringify(data);
  for (const [id, user] of users) {
    if (id !== excludeId && user.ws.readyState === 1) {
      user.ws.send(msg);
    }
  }
}

function sendTo(ws, data) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(data));
  }
}

function getOnlineUsers() {
  const list = [];
  for (const [id, user] of users) {
    list.push({ id, nickname: user.nickname });
  }
  return list;
}

wss.on('connection', (ws) => {
  let userId = null;

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw.toString()); } catch (e) { return; }

    switch (data.type) {
      case 'register': {
        userId = data.id || `anon-${Date.now()}`;
        const nickname = data.nickname || '新朋友';

        if (users.has(userId)) {
          const old = users.get(userId);
          try { old.ws.close(); } catch (e) { /* ignore */ }
        }

        users.set(userId, { ws, nickname, lastSeen: Date.now() });
        console.log(`[+] ${nickname} (${userId}) 上线, 当前在线: ${users.size}`);

        sendTo(ws, {
          type: 'registered',
          users: getOnlineUsers().filter(u => u.id !== userId),
        });

        broadcast(userId, { type: 'user-online', id: userId, nickname });
        break;
      }

      case 'message': {
        if (!userId) return;
        const from = users.get(userId);
        if (!from) return;
        const target = users.get(data.to);
        if (target) {
          sendTo(target.ws, {
            type: 'message',
            from: userId,
            fromName: from.nickname,
            text: data.text,
            ts: Date.now(),
          });
        }
        break;
      }

      case 'ping': {
        if (userId && users.has(userId)) {
          users.get(userId).lastSeen = Date.now();
        }
        sendTo(ws, { type: 'pong' });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (userId && users.has(userId)) {
      const user = users.get(userId);
      if (user.ws === ws) {
        users.delete(userId);
        console.log(`[-] ${user.nickname} (${userId}) 下线, 当前在线: ${users.size}`);
        broadcast(userId, { type: 'user-offline', id: userId });
      }
    }
  });

  ws.on('error', (err) => {
    console.error(`[!] WebSocket error for ${userId}:`, err.message);
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [id, user] of users) {
    if (now - user.lastSeen > HEARTBEAT_INTERVAL * 3) {
      console.log(`[!] 超时清理: ${user.nickname} (${id})`);
      try { user.ws.close(); } catch (e) { /* ignore */ }
      users.delete(id);
      broadcast(id, { type: 'user-offline', id });
    }
  }
}, HEARTBEAT_INTERVAL);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🐱 HelloKitty 中继服务器已启动`);
  console.log(`   地址: ws://0.0.0.0:${PORT}`);
  console.log(`   健康检查: http://0.0.0.0:${PORT}/health`);
  console.log(`   等待客户端连接...\n`);
});

process.on('SIGINT', () => {
  console.log('\n👋 服务器正在关闭...');
  for (const [id, user] of users) {
    try { user.ws.close(); } catch (e) { /* ignore */ }
  }
  server.close();
  process.exit(0);
});
