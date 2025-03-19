const express = require('express');
const WebSocket = require('ws');
const app = express();
const port = process.env.PORT || 3000;

// Store messages for 1 hour
let messageHistory = [];

// HTTP Server
app.use(express.json());
app.post('/send', (req, res) => {
  messageHistory.push(req.body);
  res.status(200).send('OK');
});

app.get('/messages', (req, res) => {
  res.json(messageHistory.slice(-100)); // Last 100 messages
});

// WebSocket Server
const wss = new WebSocket.Server({ noServer: true });
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'history', data: messageHistory.slice(-100) }));
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    messageHistory.push(message);
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
