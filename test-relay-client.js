const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:38530');

ws.on('open', () => {
  console.log('[Client] Connected to relay server');
  
  // Register as a simulated user
  ws.send(JSON.stringify({
    type: 'register',
    id: 'test-user-001',
    nickname: '测试小明'
  }));
});

ws.on('message', (raw) => {
  const data = JSON.parse(raw.toString());
  console.log('[Client] Received:', JSON.stringify(data, null, 2));
  
  // When registered, send a test message
  if (data.type === 'registered') {
    console.log('[Client] Online users:', data.users);
    
    // Wait a moment, then send a test message (broadcast to all)
    setTimeout(() => {
      console.log('[Client] Sending test message...');
      // Send to any online user
      if (data.users && data.users.length > 0) {
        const target = data.users[0];
        ws.send(JSON.stringify({
          type: 'message',
          to: target.id,
          text: '你好！我是测试小明，这是一条测试消息 🐱'
        }));
        console.log('[Client] Message sent to ' + target.nickname + ' (' + target.id + ')');
      } else {
        console.log('[Client] No other users online yet. Waiting...');
      }
    }, 1000);
  }
  
  // When receiving a message, reply
  if (data.type === 'message') {
    console.log('[Client] Got message from ' + data.fromName + ': ' + data.text);
    // Auto-reply after 1 second
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'message',
        to: data.from,
        text: '收到你的消息了！你说的是: "' + data.text + '" - 来自测试小明的自动回复 ✨'
      }));
      console.log('[Client] Auto-reply sent!');
    }, 1000);
  }
});

ws.on('error', (err) => {
  console.error('[Client] Error:', err.message);
});

ws.on('close', () => {
  console.log('[Client] Disconnected');
});

// Send heartbeat
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 25000);

// Keep alive for 30 seconds then exit
setTimeout(() => {
  console.log('[Client] Test complete, disconnecting...');
  ws.close();
  process.exit(0);
}, 30000);
