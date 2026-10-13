# Afterclass Club ✳

A playful online hangout for friends, built with plain HTML/CSS/JavaScript and a tiny, dependency-free Node.js WebSocket server. The visual direction mixes pastel pixel-art scenery with neo-brutalist borders, offset shadows, punchy stickers, and a calmer layout underneath.

## Spaces included

- **Common room** — pixel meadow hero, live online count, vibe check, and quick room links.
- **Meme lab** — create text posters or share an image URL/upload, filter posts, and react.
- **Back-bench chat** — real-time room chat, room switching, typing indicator, and message reactions.
- **Video adda** — room-based peer-to-peer group video calls, microphone/camera controls, and screen-share.
- **Game period** — tap sprint, tiny quiz, a live club-wide “Would You Rather” poll, and a word guessing game.

The site is responsive for desktop and mobile. The main navigation uses hash routes, so each space can be linked directly (for example `/#/memes` or `/#/chat`).

## Run locally

Requirements: **Node.js 20+**. The server uses built-in Node modules; no third-party runtime packages are required.

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Keep the server running while using the app. For real-time testing, open the site in two different browsers/devices and use the same room name.

## Deploy

This project runs as a regular Node web service, so it can be deployed to Render, Railway, Fly.io, or a VPS.

1. Upload/push this folder to your Git repository.
2. Create a **Web Service** and use build command `npm install` and start command `npm start`.
3. Use the host's generated HTTPS URL.
4. For persistent chat and meme history on a host with an ephemeral filesystem, attach a persistent disk and mount it at the project `data/` directory (or replace the JSON store with a managed database).

The server listens on `process.env.PORT` automatically and exposes `/health` for a health check.

## Important deployment notes

- **Chat, rooms, memes, poll votes, and call signaling are shared through the running server.** The current data store is a small JSON file in `data/db.json`; it is ideal for a starter project and a single server instance, not a high-traffic production social network. Use a managed database for stronger persistence and multiple server instances.
- **Video calls use WebRTC mesh** with public STUN servers and are capped at 8 participants per room. The app does not include a TURN relay service; some restrictive school/work/Wi-Fi networks may need a TURN server configured in `public/app.js` for reliable calls.
- **Camera, microphone, and screen-share require permission.** Browser media access requires HTTPS on deployed sites (localhost is allowed for development).
- Do not put personal/private information in room names. This starter has no login system; display names are nicknames and room membership is based on knowing the room name.
- The app asks users to respect privacy and consent. Do not record or share other people's calls without permission.

## Project layout

```text
chill-classroom/
├── data/                 # JSON data store (created/updated by server)
├── public/
│   ├── assets/
│   │   └── pixel-meadow.png
│   ├── app.js             # navigation + UI interactions + WebRTC client
│   ├── live.js            # lightweight native WebSocket event client
│   ├── index.html
│   └── styles.css
├── package.json
├── server.js
└── README.md
```
