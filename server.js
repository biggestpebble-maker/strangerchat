// StrangerChat server: pairs strangers for text or video chat, no accounts.
// Serves index.html too, so one deploy hosts the whole site.

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) { res.writeHead(500); res.end('Site file missing'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocket.Server({ server });

// One waiting stranger per mode. Real people only, nothing fake.
const waiting = { text: null, video: null };
const pairs = new Map();
let reportCount = 0;

function onlineCount() {
  let n = 0;
  wss.clients.forEach(c => { if (c.readyState === 1) n++; });
  return n;
}

function broadcastCount() {
  const msg = JSON.stringify({ type: 'count', n: onlineCount() });
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(msg); });
}

function send(ws, obj) {
  if (ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function unpair(ws, notifyPeer) {
  if (waiting.text === ws) waiting.text = null;
  if (waiting.video === ws) waiting.video = null;
  const peer = pairs.get(ws);
  pairs.delete(ws);
  if (peer) {
    pairs.delete(peer);
    if (notifyPeer) send(peer, { type: 'stranger_left' });
  }
}

wss.on('connection', (ws) => {
  broadcastCount();

  ws.on('message', (raw) => {
    let d;
    try { d = JSON.parse(raw); } catch (e) { return; }

    if (d.type === 'join') {
      const m = (d.mode === 'video') ? 'video' : 'text';
      const other = waiting[m];
      if (other && other !== ws && other.readyState === 1) {
        waiting[m] = null;
        pairs.set(ws, other);
        pairs.set(other, ws);
        send(ws, { type: 'paired', initiator: false });
        send(other, { type: 'paired', initiator: true });
      } else {
        waiting[m] = ws;
        send(ws, { type: 'waiting' });
      }
    }
    else if (d.type === 'leave') {
      unpair(ws, true);
    }
    else if (d.type === 'report') {
      reportCount++;
      console.log('Report filed. Total reports: ' + reportCount);
      unpair(ws, true);
    }
    else if (d.type === 'message') {
      const peer = pairs.get(ws);
      if (peer && typeof d.text === 'string') {
        send(peer, { type: 'message', text: d.text.slice(0, 500) });
      }
    }
    else if (d.type === 'typing' || d.type === 'stop_typing' || d.type === 'signal') {
      const peer = pairs.get(ws);
      if (peer) send(peer, d);
    }
  });

  ws.on('close', () => {
    unpair(ws, true);
    broadcastCount();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('StrangerChat live on port ' + PORT));
