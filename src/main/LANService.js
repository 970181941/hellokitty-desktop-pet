const dgram = require('dgram');
const net = require('net');
const os = require('os');
const crypto = require('crypto');
const WebSocket = require('ws');

const UDP_PORT = 38527;
const TCP_PORT = 38528;
const RELAY_PORT = 38530;
const BROADCAST_INTERVAL = 3000;
const DISCOVERY_TIMEOUT = 30000;
const HEARTBEAT_INTERVAL = 15000;
const HEARTBEAT_TIMEOUT = 45000;
const MAX_CHAT_HISTORY = 200;
const RELAY_HEARTBEAT_INTERVAL = 25000;

class LANService {
  constructor(store) {
    this.store = store;
    this.instanceId = this._ensureInstanceId();
    this.nickname = store.get('lanNickname', '') || store.get('ownerName', '') || 'Kitty用户';
    this.tcpPort = TCP_PORT;

    // UDP
    this.udpSocket = null;
    this.discoveryTimer = null;
    this.discoveryTimeout = null;
    this.discoveredPeers = new Map(); // id -> { id, nickname, ip, tcpPort, lastSeen }

    // TCP
    this.tcpServer = null;
    this.connections = new Map();
    this.connectionBuffers = new Map();
    this.peerIdBySocket = new Map();
    this.heartbeatTimer = null;
    this.lastPong = new Map();

    // Relay (互联网中继)
    this.relayWs = null;
    this.relayUrl = null;
    this.relayConnected = false;
    this.relayHeartbeatTimer = null;
    this.relayOnlineUsers = new Map(); // remoteId -> { id, nickname }

    // Event callback
    this.eventCallback = null;
    this.running = false;
  }

  _ensureInstanceId() {
    let id = this.store.get('lanInstanceId');
    if (!id) {
      id = crypto.randomUUID();
      this.store.set('lanInstanceId', id);
    }
    return id;
  }

  setEventCallback(fn) {
    this.eventCallback = fn;
  }

  _emit(event, data) {
    if (this.eventCallback) {
      try { this.eventCallback(event, data); } catch (e) { /* ignore */ }
    }
  }

  // ==================== 启动 / 停止 ====================

  start() {
    if (this.running) return;
    this.running = true;
    this._initUDP();
    this._initTCPServer();
    this._startHeartbeat();
  }

  stop() {
    this.running = false;
    this.stopDiscovery();
    this._stopHeartbeat();

    // 关闭所有 TCP 连接
    for (const [id, socket] of this.connections) {
      try { socket.destroy(); } catch (e) { /* ignore */ }
    }
    this.connections.clear();
    this.connectionBuffers.clear();
    this.peerIdBySocket.clear();

    // 关闭 TCP 服务器
    if (this.tcpServer) {
      try { this.tcpServer.close(); } catch (e) { /* ignore */ }
      this.tcpServer = null;
    }

    // 关闭 UDP socket
    if (this.udpSocket) {
      try { this.udpSocket.close(); } catch (e) { /* ignore */ }
      this.udpSocket = null;
    }

    // 关闭中继连接
    this.disconnectRelay();
  }

  // ==================== 互联网中继 ====================

  async connectToRelay(url) {
    this.disconnectRelay();
    const wsUrl = url.includes('://') ? url : `ws://${url}:${RELAY_PORT}`;
    this.relayUrl = wsUrl;

    return new Promise((resolve, reject) => {
      try {
        this.relayWs = new WebSocket(wsUrl, { handshakeTimeout: 8000 });
      } catch (e) {
        reject(new Error('连接中继服务器失败: ' + e.message));
        return;
      }

      const timeout = setTimeout(() => {
        if (this.relayWs) { try { this.relayWs.close(); } catch (e) { /* ignore */ } }
        this.relayWs = null;
        reject(new Error('连接中继超时'));
      }, 10000);

      this.relayWs.on('open', () => {
        clearTimeout(timeout);
        this.relayConnected = true;
        // 发送注册消息
        this.relayWs.send(JSON.stringify({
          type: 'register',
          id: this.instanceId,
          nickname: this.nickname,
        }));
        this._startRelayHeartbeat();
        resolve({ ok: true, url: wsUrl });
      });

      this.relayWs.on('message', (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          this._handleRelayMessage(data);
        } catch (e) { /* ignore parse error */ }
      });

      this.relayWs.on('close', () => {
        clearTimeout(timeout);
        this.relayConnected = false;
        this._stopRelayHeartbeat();
        // 通知所有中继好友离线
        for (const [remoteId] of this.relayOnlineUsers) {
          const friendId = `relay-${remoteId}`;
          this._emit('friend-offline', { friendId });
        }
        this.relayOnlineUsers.clear();
        this._emit('relay-disconnected', {});
      });

      this.relayWs.on('error', (err) => {
        clearTimeout(timeout);
        this.relayConnected = false;
        reject(new Error('中继连接错误: ' + err.message));
      });
    });
  }

  disconnectRelay() {
    this._stopRelayHeartbeat();
    if (this.relayWs) {
      try { this.relayWs.close(); } catch (e) { /* ignore */ }
      this.relayWs = null;
    }
    this.relayConnected = false;
    this.relayUrl = null;
    this.relayOnlineUsers.clear();
  }

  getRelayStatus() {
    return {
      connected: this.relayConnected,
      url: this.relayUrl,
      onlineUsers: this.relayOnlineUsers.size,
    };
  }

  _startRelayHeartbeat() {
    this._stopRelayHeartbeat();
    this.relayHeartbeatTimer = setInterval(() => {
      if (this.relayWs && this.relayWs.readyState === WebSocket.OPEN) {
        this.relayWs.send(JSON.stringify({ type: 'ping' }));
      }
    }, RELAY_HEARTBEAT_INTERVAL);
  }

  _stopRelayHeartbeat() {
    if (this.relayHeartbeatTimer) {
      clearInterval(this.relayHeartbeatTimer);
      this.relayHeartbeatTimer = null;
    }
  }

  _handleRelayMessage(data) {
    switch (data.type) {
      case 'registered': {
        // 服务器返回的在线用户列表
        for (const user of (data.users || [])) {
          const friendId = `relay-${user.id}`;
          this.relayOnlineUsers.set(user.id, { id: user.id, nickname: user.nickname });
          this._emit('friend-online', { friendId });
        }
        this._emit('relay-connected', { users: data.users || [] });
        break;
      }
      case 'user-online': {
        const friendId = `relay-${data.id}`;
        this.relayOnlineUsers.set(data.id, { id: data.id, nickname: data.nickname });
        this._emit('friend-online', { friendId });
        break;
      }
      case 'user-offline': {
        const friendId = `relay-${data.id}`;
        this.relayOnlineUsers.delete(data.id);
        this._emit('friend-offline', { friendId });
        break;
      }
      case 'message': {
        const friendId = `relay-${data.from}`;
        const msg = {
          id: crypto.randomUUID(),
          role: 'friend',
          text: data.text,
          time: data.ts || Date.now(),
          fromName: data.fromName || '好友',
        };
        this._saveChatMessage(friendId, msg);
        this._emit('message-received', { friendId, message: msg });
        break;
      }
      case 'pong':
        break;
    }
  }

  _sendViaRelay(remoteId, text) {
    if (!this.relayWs || this.relayWs.readyState !== WebSocket.OPEN) {
      throw new Error('中继服务器未连接');
    }
    this.relayWs.send(JSON.stringify({
      type: 'message',
      to: remoteId,
      text,
    }));
  }

  // ==================== UDP 发现 ====================

  _initUDP() {
    try {
      this.udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

      this.udpSocket.on('message', (msg, rinfo) => {
        this._handleUDPMessage(msg, rinfo);
      });

      this.udpSocket.on('error', (err) => {
        console.error('[LAN] UDP error:', err.message);
      });

      this.udpSocket.bind(UDP_PORT, () => {
        try {
          this.udpSocket.setBroadcast(true);
        } catch (e) {
          console.error('[LAN] setBroadcast failed:', e.message);
        }
      });
    } catch (e) {
      console.error('[LAN] UDP init failed:', e.message);
    }
  }

  _getBroadcastAddresses() {
    const addresses = [];
    try {
      const ifaces = os.networkInterfaces();
      for (const name of Object.keys(ifaces)) {
        for (const iface of ifaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            // 计算广播地址
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

  startDiscovery() {
    this.stopDiscovery();
    this._sendHello();
    this.discoveryTimer = setInterval(() => this._sendHello(), BROADCAST_INTERVAL);
    // 30秒后自动停止
    this.discoveryTimeout = setTimeout(() => this.stopDiscovery(), DISCOVERY_TIMEOUT);
    this._emit('discovery-started', {});
    return { ok: true };
  }

  stopDiscovery() {
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = null;
    }
    if (this.discoveryTimeout) {
      clearTimeout(this.discoveryTimeout);
      this.discoveryTimeout = null;
    }
    this._emit('discovery-stopped', {});
    return { ok: true };
  }

  _sendHello() {
    if (!this.udpSocket) return;
    const payload = JSON.stringify({
      type: 'hello',
      id: this.instanceId,
      nickname: this.nickname,
      tcpPort: this.tcpPort,
      ts: Date.now(),
    });
    const buf = Buffer.from(payload, 'utf-8');
    const addrs = this._getBroadcastAddresses();
    for (const addr of addrs) {
      try {
        this.udpSocket.send(buf, 0, buf.length, UDP_PORT, addr);
      } catch (e) { /* ignore */ }
    }
  }

  _handleUDPMessage(msg, rinfo) {
    try {
      const data = JSON.parse(msg.toString('utf-8'));
      if (!data.id || data.id === this.instanceId) return;

      if (data.type === 'hello') {
        // 记录发现的对端
        this.discoveredPeers.set(data.id, {
          id: data.id,
          nickname: data.nickname || '未知',
          ip: rinfo.address,
          tcpPort: data.tcpPort || TCP_PORT,
          lastSeen: Date.now(),
        });
        this._emit('peer-discovered', {
          id: data.id,
          nickname: data.nickname,
          ip: rinfo.address,
          tcpPort: data.tcpPort,
        });

        // 回复 hello-ack (单播)
        const ack = JSON.stringify({
          type: 'hello-ack',
          id: this.instanceId,
          nickname: this.nickname,
          tcpPort: this.tcpPort,
          ts: Date.now(),
        });
        const buf = Buffer.from(ack, 'utf-8');
        try {
          this.udpSocket.send(buf, 0, buf.length, UDP_PORT, rinfo.address);
        } catch (e) { /* ignore */ }

      } else if (data.type === 'hello-ack') {
        if (!this.discoveredPeers.has(data.id)) {
          this.discoveredPeers.set(data.id, {
            id: data.id,
            nickname: data.nickname || '未知',
            ip: rinfo.address,
            tcpPort: data.tcpPort || TCP_PORT,
            lastSeen: Date.now(),
          });
          this._emit('peer-discovered', {
            id: data.id,
            nickname: data.nickname,
            ip: rinfo.address,
            tcpPort: data.tcpPort,
          });
        }
      }
    } catch (e) { /* ignore malformed */ }
  }

  getDiscoveredPeers() {
    const peers = [];
    const now = Date.now();
    for (const [id, peer] of this.discoveredPeers) {
      // 只显示 60 秒内活跃的
      if (now - peer.lastSeen < 60000) {
        peers.push({ ...peer });
      }
    }
    return peers;
  }

  // ==================== TCP 服务器 ====================

  _initTCPServer() {
    try {
      this.tcpServer = net.createServer((socket) => {
        this._handleInboundConnection(socket);
      });

      this.tcpServer.on('error', (err) => {
        console.error('[LAN] TCP server error:', err.message);
      });

      this.tcpServer.listen(this.tcpPort, () => {
        console.log(`[LAN] TCP server listening on port ${this.tcpPort}`);
      });
    } catch (e) {
      console.error('[LAN] TCP init failed:', e.message);
    }
  }

  _handleInboundConnection(socket) {
    const key = `${socket.remoteAddress}:${socket.remotePort}`;
    this.connectionBuffers.set(key, '');

    socket.on('data', (chunk) => {
      const buf = (this.connectionBuffers.get(key) || '') + chunk.toString('utf-8');
      const lines = buf.split('\n');
      this.connectionBuffers.set(key, lines.pop() || '');
      for (const line of lines) {
        if (line.trim()) {
          this._handleTCPLine(line.trim(), socket);
        }
      }
    });

    socket.on('close', () => {
      const friendId = this.peerIdBySocket.get(key);
      if (friendId) {
        // 只有主动连接才算断开，被动连接移除
        if (this.connections.get(friendId) === socket) {
          this.connections.delete(friendId);
        }
        this.peerIdBySocket.delete(key);
        this._emit('friend-offline', { friendId });
      }
      this.connectionBuffers.delete(key);
    });

    socket.on('error', () => {
      this.connectionBuffers.delete(key);
    });
  }

  _handleTCPLine(line, socket) {
    try {
      const data = JSON.parse(line);
      const key = `${socket.remoteAddress}:${socket.remotePort}`;

      if (data.type === 'identify') {
        // 对端标识自己
        this.peerIdBySocket.set(key, data.from);
        this.lastPong.set(data.from, Date.now());
        this._emit('friend-online', { friendId: data.from });
        // 回复身份
        this._sendToSocket(socket, {
          type: 'identify',
          from: this.instanceId,
          nickname: this.nickname,
        });
      } else if (data.type === 'message') {
        this.lastPong.set(data.from, Date.now());
        if (!this.peerIdBySocket.has(key)) {
          this.peerIdBySocket.set(key, data.from);
        }
        this._handleReceivedMessage(data);
      } else if (data.type === 'ping') {
        this.lastPong.set(data.from || key, Date.now());
        this._sendToSocket(socket, { type: 'pong', from: this.instanceId });
      } else if (data.type === 'pong') {
        this.lastPong.set(data.from || key, Date.now());
      }
    } catch (e) { /* ignore parse error */ }
  }

  // ==================== TCP 客户端 ====================

  async connectTo(friendId, ip, port) {
    // 已有连接则复用——但需验证文件描述符是否有效
    const existing = this.connections.get(friendId);
    if (existing && !existing.destroyed) {
      // 尝试检测文件描述符是否有效
      try {
        if (!existing.writable) throw new Error('socket not writable');
        return existing; // 连接有效，直接复用
      } catch (e) {
        // socket 已失效，清理并重建
        this.connections.delete(friendId);
        const key = `${ip}:${port}`;
        this.connectionBuffers.delete(key);
        this.peerIdBySocket.delete(key);
        try { existing.destroy(); } catch (_) { /* ignore */ }
      }
    }

    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const key = `${ip}:${port}`;
      this.connectionBuffers.set(key, '');

      socket.connect(port, ip, () => {
        this.connections.set(friendId, socket);
        this.peerIdBySocket.set(key, friendId);
        this.lastPong.set(friendId, Date.now());

        // 发送身份标识
        try {
          this._sendToSocket(socket, {
            type: 'identify',
            from: this.instanceId,
            nickname: this.nickname,
          });
        } catch (e) { /* 连接刚建立就失败，忽略 */ }

        this._emit('friend-online', { friendId });

        // 监听数据
        socket.on('data', (chunk) => {
          const buf = (this.connectionBuffers.get(key) || '') + chunk.toString('utf-8');
          const lines = buf.split('\n');
          this.connectionBuffers.set(key, lines.pop() || '');
          for (const line of lines) {
            if (line.trim()) {
              this._handleTCPLine(line.trim(), socket);
            }
          }
        });

        socket.on('close', () => {
          if (this.connections.get(friendId) === socket) {
            this.connections.delete(friendId);
          }
          this.connectionBuffers.delete(key);
          this.peerIdBySocket.delete(key);
          this._emit('friend-offline', { friendId });
        });

        socket.on('error', () => {
          this.connectionBuffers.delete(key);
        });

        resolve(socket);
      });

      socket.on('error', (err) => {
        reject(err);
      });

      // 5秒连接超时
      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error('连接超时'));
      });
    });
  }

  // ==================== 消息收发 ====================

  async sendMessage(friendId, text) {
    const friend = this._getFriend(friendId);
    if (!friend) throw new Error('好友不存在');

    // 中继好友：通过 WebSocket 中继发送
    if (friendId.startsWith('relay-')) {
      const remoteId = friendId.replace('relay-', '');
      try {
        this._sendViaRelay(remoteId, text);
      } catch (e) {
        throw new Error('中继发送失败: ' + e.message);
      }
      const msgRecord = {
        id: crypto.randomUUID(),
        role: 'user',
        text,
        time: Date.now(),
      };
      this._saveChatMessage(friendId, msgRecord);
      return msgRecord;
    }

    // 局域网好友：通过 TCP 直连发送

    // 确保连接——检测 socket 有效性，包括底层文件描述符
    let socket = this.connections.get(friendId);
    if (!socket || socket.destroyed || !socket.writable) {
      // 清理可能存在的陈旧连接
      if (socket) {
        this.connections.delete(friendId);
        try { socket.destroy(); } catch (_) { /* ignore */ }
      }
      try {
        socket = await this.connectTo(friendId, friend.ip, friend.tcpPort);
      } catch (e) {
        throw new Error('无法连接到好友: ' + e.message);
      }
    }

    const msg = {
      type: 'message',
      id: crypto.randomUUID(),
      from: this.instanceId,
      fromName: this.nickname,
      text,
      ts: Date.now(),
    };

    // 发送消息——捕获 EBADF 等写入错误并重试一次
    try {
      this._sendToSocket(socket, msg);
    } catch (e) {
      // 可能是 EBADF，清理旧连接并重试
      this.connections.delete(friendId);
      try { socket.destroy(); } catch (_) { /* ignore */ }
      try {
        socket = await this.connectTo(friendId, friend.ip, friend.tcpPort);
        this._sendToSocket(socket, msg);
      } catch (retryErr) {
        throw new Error('发送失败: ' + retryErr.message);
      }
    }

    // 保存到本地聊天记录
    const msgRecord = {
      id: msg.id,
      role: 'user',
      text,
      time: msg.ts,
    };
    this._saveChatMessage(friendId, msgRecord);

    return msgRecord;
  }

  _handleReceivedMessage(data) {
    const msg = {
      id: data.id,
      role: 'friend',
      text: data.text,
      time: data.ts,
      fromName: data.fromName || '好友',
    };

    // 保存聊天记录
    this._saveChatMessage(data.from, msg);

    // 推送到前端
    this._emit('message-received', {
      friendId: data.from,
      message: msg,
    });
  }

  _sendToSocket(socket, obj) {
    if (!socket || socket.destroyed || !socket.writable) {
      throw new Error('socket 不可用');
    }
    socket.write(JSON.stringify(obj) + '\n');
  }

  // ==================== 心跳 ====================

  _startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      for (const [friendId, socket] of this.connections) {
        if (socket && !socket.destroyed) {
          try {
            this._sendToSocket(socket, { type: 'ping', from: this.instanceId });
          } catch (e) {
            // ping 发送失败，可能 socket 已失效，清理
            this.connections.delete(friendId);
            try { socket.destroy(); } catch (_) { /* ignore */ }
            this._emit('friend-offline', { friendId });
            continue;
          }
          // 检查上次 pong 时间
          const lastPong = this.lastPong.get(friendId) || 0;
          if (now - lastPong > HEARTBEAT_TIMEOUT) {
            // 超时断开
            try { socket.destroy(); } catch (e) { /* ignore */ }
            this.connections.delete(friendId);
            this._emit('friend-offline', { friendId });
          }
        }
      }
    }, HEARTBEAT_INTERVAL);
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ==================== 好友管理 ====================

  _getFriends() {
    return this.store.get('lanFriends', []);
  }

  _saveFriends(friends) {
    this.store.set('lanFriends', friends);
  }

  _getFriend(friendId) {
    return this._getFriends().find(f => f.id === friendId);
  }

  addFriend(peer, nickname) {
    const friends = this._getFriends();
    // 检查是否已添加
    const existing = friends.find(f => f.id === peer.id);
    if (existing) {
      // 更新 IP 和昵称
      existing.ip = peer.ip;
      existing.tcpPort = peer.tcpPort;
      if (nickname) existing.nickname = nickname;
      existing.lastSeen = Date.now();
      this._saveFriends(friends);
      return existing;
    }

    const friend = {
      id: peer.id,
      nickname: nickname || peer.nickname || '新朋友',
      ip: peer.ip,
      tcpPort: peer.tcpPort || TCP_PORT,
      addedAt: Date.now(),
      lastSeen: Date.now(),
    };
    friends.push(friend);
    this._saveFriends(friends);
    return friend;
  }

  removeFriend(friendId) {
    let friends = this._getFriends();
    friends = friends.filter(f => f.id !== friendId);
    this._saveFriends(friends);
    // 断开连接
    const socket = this.connections.get(friendId);
    if (socket) {
      try { socket.destroy(); } catch (e) { /* ignore */ }
      this.connections.delete(friendId);
    }
    // 清除聊天记录
    const history = this.store.get('lanChatHistory', {});
    delete history[friendId];
    this.store.set('lanChatHistory', history);
    return { ok: true };
  }

  updateFriend(friendId, data) {
    const friends = this._getFriends();
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return null;
    if (data.nickname !== undefined) friend.nickname = data.nickname;
    this._saveFriends(friends);
    return friend;
  }

  getFriendsList() {
    const friends = this._getFriends();
    return friends.map(f => {
      // 中继好友：检查中继连接和在线用户列表
      if (f.id.startsWith('relay-')) {
        const remoteId = f.id.replace('relay-', '');
        return {
          ...f,
          online: this.relayConnected && this.relayOnlineUsers.has(remoteId),
          relay: true,
        };
      }
      // 局域网好友
      return {
        ...f,
        online: this.connections.has(f.id) && !this.connections.get(f.id).destroyed,
        relay: false,
      };
    });
  }

  addRelayFriend(remoteId, nickname) {
    const friendId = `relay-${remoteId}`;
    const friends = this._getFriends();
    const existing = friends.find(f => f.id === friendId);
    if (existing) {
      if (nickname) existing.nickname = nickname;
      existing.lastSeen = Date.now();
      this._saveFriends(friends);
      return existing;
    }
    const friend = {
      id: friendId,
      nickname: nickname || '中继好友',
      ip: null,
      tcpPort: null,
      relay: true,
      addedAt: Date.now(),
      lastSeen: Date.now(),
    };
    friends.push(friend);
    this._saveFriends(friends);
    return friend;
  }

  // ==================== 聊天记录 ====================

  _saveChatMessage(friendId, msg) {
    const history = this.store.get('lanChatHistory', {});
    if (!history[friendId]) history[friendId] = [];
    history[friendId].push(msg);
    // 裁剪
    if (history[friendId].length > MAX_CHAT_HISTORY) {
      history[friendId] = history[friendId].slice(-MAX_CHAT_HISTORY);
    }
    this.store.set('lanChatHistory', history);
  }

  getChatHistory(friendId) {
    const history = this.store.get('lanChatHistory', {});
    return history[friendId] || [];
  }

  // ==================== 昵称 ====================

  setNickname(name) {
    this.nickname = name;
    this.store.set('lanNickname', name);
  }

  getStatus() {
    return {
      running: this.running,
      instanceId: this.instanceId,
      nickname: this.nickname,
      tcpPort: this.tcpPort,
      connectionsCount: this.connections.size,
      discoveredCount: this.discoveredPeers.size,
      discovering: this.discoveryTimer !== null,
    };
  }

  // ==================== 手动添加好友 ====================

  async connectByIP(ip, port, nickname) {
    if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
      throw new Error('请输入有效的 IP 地址');
    }
    const tcpPort = port || TCP_PORT;
    const peerId = `manual-${ip}-${tcpPort}`;
    const friends = this._getFriends();
    const existing = friends.find(f => f.id === peerId || (f.ip === ip && f.tcpPort === tcpPort));
    if (existing) {
      try { await this.connectTo(existing.id, existing.ip, existing.tcpPort); } catch (e) {
        throw new Error(`无法连接到 ${ip}:${tcpPort}: ${e.message}`);
      }
      return existing;
    }
    const peer = { id: peerId, nickname: nickname || `${ip}`, ip, tcpPort };
    const friend = this.addFriend(peer, nickname || peer.nickname);
    try {
      await this.connectTo(friend.id, friend.ip, friend.tcpPort);
      this._emit('friend-online', { friendId: friend.id });
      return { ...friend, connected: true };
    } catch (e) {
      console.warn(`[LAN] 手动连接 ${ip}:${tcpPort} 失败:`, e.message);
      this._emit('friend-offline', { friendId: friend.id });
      return { ...friend, connected: false, error: e.message };
    }
  }
}

module.exports = LANService;
