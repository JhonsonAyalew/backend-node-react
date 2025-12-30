const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const peers = new Map(); // connectionKey => ws client

wss.on('connection', (ws) => {
  let connectionKey = null;

  ws.on('message', (message) => {
    let data;

    // Safely parse incoming message
    try {
      data = JSON.parse(message);
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      return;
    }

    const { type } = data;

    if (type === 'register') {
      // Assign and store connection key
      connectionKey = data.connectionKey;
      if (!connectionKey) {
        ws.send(JSON.stringify({ type: 'error', message: 'Missing connectionKey' }));
        return;
      }

      // If key exists, replace old socket
      if (peers.has(connectionKey)) {
        const oldWs = peers.get(connectionKey);
        if (oldWs !== ws && oldWs.readyState === WebSocket.OPEN) {
          oldWs.close();
        }
      }

      peers.set(connectionKey, ws);
      console.log(`✅ Registered peer: ${connectionKey}`);
      ws.send(JSON.stringify({ type: 'registered', connectionKey }));

    } else if (type === 'signal') {
      const targetKey = data.target;
      const payload = data.data;

      if (!targetKey || !peers.has(targetKey)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Target peer not found' }));
        return;
      }

      const targetWs = peers.get(targetKey);
      if (targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(JSON.stringify({
          type: 'signal',
          from: connectionKey,
          data: payload,
        }));
        console.log(`🔁 Signal forwarded from ${connectionKey} to ${targetKey}`);
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Target peer not available' }));
      }

    } else {
      ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${type}` }));
    }
  });

  ws.on('close', () => {
    if (connectionKey && peers.get(connectionKey) === ws) {
      peers.delete(connectionKey);
      console.log(`❌ Disconnected: ${connectionKey}`);
    }
  });

  ws.on('error', (err) => {
    console.error(`⚠️ WebSocket error for ${connectionKey || 'unknown peer'}:`, err.message);
  });
});

console.log('🚀 Signaling server running on ws://localhost:8080');
