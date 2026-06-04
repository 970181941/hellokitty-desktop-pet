const WebSocket = require('ws');

function createClient(id, nickname, delay) {
  setTimeout(() => {
    const ws = new WebSocket('ws://localhost:38530');
    const prefix = '[' + nickname + ']';

    ws.on('open', () => {
      console.log(prefix + ' Connected to relay server');
      ws.send(JSON.stringify({ type: 'register', id: id, nickname: nickname }));
    });

    ws.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      console.log(prefix + ' Received: ' + JSON.stringify(data));

      if (data.type === 'registered') {
        console.log(prefix + ' Online users: ' + JSON.stringify(data.users));
        if (data.users.length > 0) {
          setTimeout(() => {
            const target = data.users[0];
            const msg = '你好！我是' + nickname + '，这是一条测试消息 🐱';
            ws.send(JSON.stringify({ type: 'message', to: target.id, text: msg }));
            console.log(prefix + ' Sent message to ' + target.nickname + ': ' + msg);
          }, 500);
        }
      }

      if (data.type === 'user-online') {
        console.log(prefix + ' User came online: ' + data.nickname);
        setTimeout(() => {
          const msg = '嗨 ' + data.nickname + '！我是' + nickname + '，欢迎！✨';
          ws.send(JSON.stringify({ type: 'message', to: data.id, text: msg }));
          console.log(prefix + ' Sent welcome to ' + data.nickname);
        }, 500);
      }

      if (data.type === 'message') {
        console.log(prefix + ' Got message from ' + data.fromName + ': ' + data.text);
        setTimeout(() => {
          const reply = '收到! 你说: "' + data.text + '" - ' + nickname + '自动回复 💬';
          ws.send(JSON.stringify({ type: 'message', to: data.from, text: reply }));
          console.log(prefix + ' Auto-reply sent!');
        }, 500);
      }

      if (data.type === 'pong') {
        console.log(prefix + ' Heartbeat pong received');
      }
    });

    ws.on('error', (err) => { console.error(prefix + ' Error:', err.message); });
    ws.on('close', () => { console.log(prefix + ' Disconnected'); });

    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
    }, 25000);

    setTimeout(() => {
      console.log(prefix + ' Test complete, disconnecting...');
      ws.close();
    }, 15000);
  }, delay);
}

// Client A connects immediately, Client B connects 2 seconds later
createClient('test-alice', 'Alice爱丽丝', 0);
createClient('test-bob', 'Bob小明', 2000);

setTimeout(() => { console.log('\n=== Test finished ==='); process.exit(0); }, 20000);
