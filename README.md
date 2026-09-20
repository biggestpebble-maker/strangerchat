# StrangerChat

Random text and video chat with strangers. No signup, no accounts, no bots. Real people only.

## Run it on your own computer

1. Install Node.js from nodejs.org
2. In this folder run: npm install
3. Then run: node server.js
4. Open http://localhost:3000 in your browser

Open it in two browsers or two devices to watch two strangers get paired.

## Put it on the internet free with Render

1. Push this folder to a GitHub repo
2. Go to render.com and create a free Web Service from that repo
3. Build command: npm install
4. Start command: npm start
5. Render gives you a public link like https://strangerchat.onrender.com

Share that link and anyone who opens it can chat with real strangers. The page and the pairing server run together as one service, so there is nothing else to set up.

## How it works

The browser page connects to the server with a WebSocket. The server holds one waiting stranger per mode. When a second person joins the same mode, the server pairs them and they chat directly. Video uses WebRTC between the two browsers, so video never passes through the server.

Nothing is stored. No messages are saved. When someone leaves, the pairing is gone.
