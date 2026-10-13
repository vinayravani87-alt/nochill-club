import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'db.json');
const port = Number(process.env.PORT || 3000);

fs.mkdirSync(dataDir, { recursive: true });
const starterRooms = [
  { id: '12-b', name: '12-B homies', hint: 'all present, barely' },
  { id: 'meme-club', name: 'meme club', hint: 'no context pls' },
  { id: 'late-night', name: 'late night', hint: 'low battery gang' }
];
const now = Date.now();
const starterMemes = [
  { id: 'seed-1', author: 'Aarav', caption: 'Me opening the chapter for the 8th time like we have a personal connection.', text: 'BAS AAJ\nSAMAJH AAYEGA', color: 'art-yellow', emoji: '📚', createdAt: new Date(now - 25 * 60000).toISOString(), likes: 14 },
  { id: 'seed-2', author: 'Mahi', caption: 'POV: teacher says “this is very easy” and the board looks like NASA.', text: 'TEACHER: EASY HAI', color: 'art-pink', emoji: '🫠', createdAt: new Date(now - 75 * 60000).toISOString(), likes: 22 },
  { id: 'seed-3', author: 'Dev', caption: 'One small break. Bas 5 minutes. Suddenly it is 2047.', text: 'JUST ONE\nMORE REEL', color: 'art-aqua', emoji: '📱', createdAt: new Date(now - 130 * 60000).toISOString(), likes: 31 },
  { id: 'seed-4', author: 'Ira', caption: 'Aaj ka plan: do the thing. Aaj ka plot: chai first.', text: 'PRODUCTIVITY\nLOADING…', color: 'art-purple', emoji: '☕', createdAt: new Date(now - 240 * 60000).toISOString(), likes: 9 },
  { id: 'seed-5', author: 'Kabir', caption: 'When group project means one person is the group.', text: 'GROUP PROJECT\nMOMENT', color: 'art-coral', emoji: '🧍', createdAt: new Date(now - 320 * 60000).toISOString(), likes: 18 },
  { id: 'seed-6', author: 'Nia', caption: 'The friend who says “I did not study” and finishes first.', text: 'HUMBLE BRAG\nPRO MAX', color: 'art-grass', emoji: '🏆', createdAt: new Date(now - 470 * 60000).toISOString(), likes: 26 }
];
const seedChat = [
  { id: 'chat-seed-1', room: '12-b', name: 'Mahi', text: 'Guys, anyone understood what was happening in that last lecture? 😭', time: new Date(now - 14 * 60000).toISOString() },
  { id: 'chat-seed-2', room: '12-b', name: 'Dev', text: 'Samjha toh nahi but nodded confidently.', time: new Date(now - 13 * 60000).toISOString() },
  { id: 'chat-seed-3', room: '12-b', name: 'Ira', text: 'Academic weapon ❌ academic decoration ✅', time: new Date(now - 12 * 60000).toISOString() },
  { id: 'chat-seed-4', room: '12-b', name: 'Aarav', text: 'Chai break? 5 min mein back. Pakka.', time: new Date(now - 10 * 60000).toISOString() }
];
function freshStore() { return { rooms: starterRooms, memes: starterMemes, chats: { '12-b': seedChat } }; }
function loadStore() {
  try {
    const value = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    return {
      rooms: Array.isArray(value.rooms) && value.rooms.length ? value.rooms : starterRooms,
      memes: Array.isArray(value.memes) && value.memes.length ? value.memes : starterMemes,
      chats: value.chats && typeof value.chats === 'object' ? value.chats : { '12-b': seedChat }
    };
  } catch { return freshStore(); }
}
let store = loadStore();
function persist() {
  try { fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), 'utf8'); }
  catch (error) { console.error('Could not persist app data:', error.message); }
}
function cleanText(value, max = 500) { return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max); }
function cleanRoomId(value) {
  return cleanText(value, 40).toLowerCase().replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'lounge';
}
function roomLabel(id) { return store.rooms.find(room => room.id === id)?.name || id.replace(/-/g, ' '); }
function safeImage(image) {
  const input = typeof image === 'string' ? image : '';
  if (input.length > 520 * 1024) return '';
  if (/^https:\/\//i.test(input)) return input;
  if (/^data:image\/(png|jpeg|webp|gif);base64,/i.test(input)) return input;
  return '';
}

const MAX_FRAME_BYTES = 800 * 1024;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};
function handleHttp(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', 'Allow': 'GET, HEAD' });
    res.end('Method not allowed'); return;
  }
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ok: true, name: 'Afterclass Club', online: onlineUsers.size })); return;
  }
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { decoded = '/'; }
  const requestedPath = decoded === '/' ? '/index.html' : decoded;
  const candidate = path.resolve(publicDir, `.${requestedPath}`);
  if (!candidate.startsWith(`${publicDir}${path.sep}`) && candidate !== path.join(publicDir, 'index.html')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Forbidden'); return;
  }
  let filePath = candidate;
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
  } catch {
    // Nice URLs fall back to the single-page shell; missing assets remain 404s.
    if (!path.extname(requestedPath)) filePath = path.join(publicDir, 'index.html');
    else { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); return; }
  }
  fs.readFile(filePath, (error, content) => {
    if (error) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
    if (req.method === 'HEAD') res.end(); else res.end(content);
  });
}
function encodeWebSocketFrame(payload, opcode = 0x1) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  let header;
  if (body.length < 126) {
    header = Buffer.alloc(2); header[1] = body.length;
  } else if (body.length <= 0xffff) {
    header = Buffer.alloc(4); header[1] = 126; header.writeUInt16BE(body.length, 2);
  } else {
    header = Buffer.alloc(10); header[1] = 127; header.writeBigUInt64BE(BigInt(body.length), 2);
  }
  header[0] = 0x80 | opcode;
  return Buffer.concat([header, body]);
}
class LivePeer {
  constructor(server, rawSocket, id) {
    this.server = server; this.rawSocket = rawSocket; this.id = id; this.data = {}; this.rooms = new Set();
    this.handlers = new Map(); this.incoming = Buffer.alloc(0); this.closed = false;
    this.join(id);
    rawSocket.on('data', chunk => this.readFrames(chunk));
    rawSocket.on('close', () => this.close());
    rawSocket.on('error', () => this.close());
  }
  on(event, handler) { const list = this.handlers.get(event) || []; list.push(handler); this.handlers.set(event, list); return this; }
  _dispatch(event, payload) { for (const handler of this.handlers.get(event) || []) { try { handler(payload); } catch (error) { console.error(`Live event ${event} failed:`, error); } } }
  emit(event, payload) {
    if (this.closed || this.rawSocket.destroyed || !this.rawSocket.writable) return;
    try { this.rawSocket.write(encodeWebSocketFrame(JSON.stringify({ event, data: payload }))); }
    catch (error) { console.error('WebSocket send failed:', error.message); }
  }
  join(room) { this.server.join(room, this.id); this.rooms.add(room); }
  leave(room) { this.server.leave(room, this.id); this.rooms.delete(room); }
  to(room) { return { emit: (event, payload) => this.server.to(room, this.id).emit(event, payload) }; }
  readFrames(chunk) {
    if (this.closed) return;
    this.incoming = Buffer.concat([this.incoming, chunk]);
    if (this.incoming.length > MAX_FRAME_BYTES + 14) { this.rawSocket.destroy(); return; }
    while (this.incoming.length >= 2) {
      const first = this.incoming[0], second = this.incoming[1];
      const opcode = first & 0x0f, masked = Boolean(second & 0x80);
      let length = second & 0x7f, offset = 2;
      if (length === 126) { if (this.incoming.length < 4) return; length = this.incoming.readUInt16BE(2); offset = 4; }
      else if (length === 127) { if (this.incoming.length < 10) return; const longLength = this.incoming.readBigUInt64BE(2); if (longLength > BigInt(MAX_FRAME_BYTES)) { this.rawSocket.destroy(); return; } length = Number(longLength); offset = 10; }
      if (length > MAX_FRAME_BYTES) { this.rawSocket.destroy(); return; }
      if (masked) offset += 4;
      if (this.incoming.length < offset + length) return;
      let payload = Buffer.from(this.incoming.subarray(offset, offset + length));
      if (masked) { const key = this.incoming.subarray(offset - 4, offset); for (let i = 0; i < payload.length; i += 1) payload[i] ^= key[i % 4]; }
      this.incoming = this.incoming.subarray(offset + length);
      if (opcode === 0x8) { this.rawSocket.end(encodeWebSocketFrame(Buffer.alloc(0), 0x8)); return; }
      if (opcode === 0x9) { this.rawSocket.write(encodeWebSocketFrame(payload, 0xA)); continue; }
      if (opcode !== 0x1) continue;
      try { const packet = JSON.parse(payload.toString('utf8')); if (typeof packet.event === 'string') this._dispatch(packet.event, packet.data); }
      catch { /* Ignore malformed packets instead of breaking the connection. */ }
    }
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    this._dispatch('disconnect');
    this.server.remove(this);
  }
}
class LiveServer {
  constructor(server) {
    this.peers = new Map(); this.rooms = new Map(); this.handlers = new Map();
    server.on('upgrade', (req, rawSocket) => this.upgrade(req, rawSocket));
  }
  on(event, handler) { const list = this.handlers.get(event) || []; list.push(handler); this.handlers.set(event, list); return this; }
  upgrade(req, rawSocket) {
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;
    const key = req.headers['sec-websocket-key'];
    if (pathname !== '/live' || !key || String(req.headers.upgrade || '').toLowerCase() !== 'websocket') { rawSocket.destroy(); return; }
    const accept = createHash('sha1').update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
    rawSocket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    const peer = new LivePeer(this, rawSocket, randomUUID());
    this.peers.set(peer.id, peer);
    for (const handler of this.handlers.get('connection') || []) { try { handler(peer); } catch (error) { console.error('Connection setup failed:', error); } }
  }
  join(room, id) { const members = this.rooms.get(room) || new Set(); members.add(id); this.rooms.set(room, members); }
  leave(room, id) { const members = this.rooms.get(room); if (!members) return; members.delete(id); if (!members.size) this.rooms.delete(room); }
  remove(peer) { for (const room of [...peer.rooms]) this.leave(room, peer.id); this.peers.delete(peer.id); }
  to(room, exceptId = null) {
    return { emit: (event, payload) => { const ids = this.rooms.get(room) || new Set(); for (const id of ids) if (id !== exceptId) this.peers.get(id)?.emit(event, payload); } };
  }
  emit(event, payload) { for (const peer of this.peers.values()) peer.emit(event, payload); }
}
const server = http.createServer(handleHttp);
const io = new LiveServer(server);
const onlineUsers = new Map();
const callRooms = new Map();
const activeReactions = new Map();
const socketLikedMemes = new Map();
const arcadeTotals = Array.from({ length: 3 }, () => ({ a: 0, b: 0 }));
const arcadeVotesBySocket = new Map();
function broadcastPresence() {
  io.emit('presence:update', [...onlineUsers.values()].map(user => ({ id: user.id, name: user.name })));
}
function emitRooms() { io.emit('rooms:list', store.rooms); }
function addToCall(socket, rawRoom) {
  const room = cleanRoomId(rawRoom);
  const previousRoom = socket.data.callRoom;
  if (previousRoom) removeFromCall(socket);
  let members = callRooms.get(room);
  if (!members) { members = new Map(); callRooms.set(room, members); }
  if (!members.has(socket.id) && members.size >= 8) {
    socket.emit('call:error', 'This room has reached its 8-person limit. Start a new room for the next round.');
    return;
  }
  const peers = [...members.entries()].map(([id, name]) => ({ id, name }));
  socket.join(`call:${room}`);
  socket.data.callRoom = room;
  members.set(socket.id, socket.data.name || 'friend');
  socket.emit('call:peers', { room, peers });
  socket.to(`call:${room}`).emit('call:peer-joined', { room, id: socket.id, name: socket.data.name || 'friend' });
}
function removeFromCall(socket) {
  const room = socket.data.callRoom;
  if (!room) return;
  socket.data.callRoom = null;
  socket.leave(`call:${room}`);
  const members = callRooms.get(room);
  if (members) {
    members.delete(socket.id);
    if (!members.size) callRooms.delete(room);
  }
  socket.to(`call:${room}`).emit('call:peer-left', { room, id: socket.id, name: socket.data.name || 'friend' });
}

io.on('connection', socket => {
  socket.data.name = `friend-${socket.id.slice(0, 4)}`;
  onlineUsers.set(socket.id, { id: socket.id, name: socket.data.name });
  broadcastPresence();
  socket.emit('rooms:list', store.rooms);
  socket.emit('memes:history', store.memes);

  socket.on('user:hello', payload => {
    const name = cleanText(payload?.name, 24).replace(/[<>]/g, '') || 'friend';
    socket.data.name = name;
    onlineUsers.set(socket.id, { id: socket.id, name });
    if (socket.data.callRoom) callRooms.get(socket.data.callRoom)?.set(socket.id, name);
    broadcastPresence();
  });

  socket.on('rooms:request', () => socket.emit('rooms:list', store.rooms));
  socket.on('room:create', payload => {
    const name = cleanText(payload?.name, 28);
    const id = cleanRoomId(payload?.id || name);
    if (!name) return;
    if (!store.rooms.some(room => room.id === id)) {
      store.rooms.push({ id, name, hint: 'new little corner' });
      store.rooms = store.rooms.slice(-30);
      store.chats[id] ||= [];
      persist();
    }
    emitRooms();
  });

  socket.on('chat:join', payload => {
    const room = cleanRoomId(payload?.room);
    if (socket.data.chatRoom) socket.leave(`chat:${socket.data.chatRoom}`);
    if (!store.rooms.some(item => item.id === room)) {
      // An invite can contain a room name that another friend created just before this join packet arrived.
      store.rooms.push({ id: room, name: roomLabel(room), hint: 'open room' });
    }
    socket.data.chatRoom = room;
    socket.join(`chat:${room}`);
    const messages = (store.chats[room] || []).slice(-80);
    socket.emit('chat:history', { room, messages });
  });

  socket.on('chat:send', payload => {
    const room = cleanRoomId(payload?.room);
    if (!socket.data.chatRoom || socket.data.chatRoom !== room) return;
    const text = cleanText(payload?.text, 800);
    if (!text) return;
    const message = { id: randomUUID(), room, name: socket.data.name || 'friend', text, time: new Date().toISOString() };
    store.chats[room] ||= [];
    store.chats[room].push(message);
    store.chats[room] = store.chats[room].slice(-100);
    persist();
    io.to(`chat:${room}`).emit('chat:message', message);
  });
  socket.on('chat:typing', payload => {
    const room = cleanRoomId(payload?.room);
    if (socket.data.chatRoom === room) socket.to(`chat:${room}`).emit('chat:typing', { room, name: socket.data.name || 'friend', typing: Boolean(payload?.typing) });
  });

  socket.on('meme:create', payload => {
    const caption = cleanText(payload?.caption, 220);
    if (!caption) return;
    const colors = new Set(['art-yellow','art-pink','art-aqua','art-purple','art-coral','art-grass']);
    const post = {
      id: randomUUID(), author: socket.data.name || 'friend', caption,
      text: cleanText(payload?.text || caption, 64).toUpperCase(),
      color: colors.has(payload?.color) ? payload.color : 'art-yellow',
      emoji: cleanText(payload?.emoji || '✦', 8), image: safeImage(payload?.image),
      createdAt: new Date().toISOString(), likes: 0
    };
    store.memes.unshift(post);
    store.memes = store.memes.slice(0, 80);
    persist();
    io.emit('meme:new', post);
  });
  socket.on('meme:react', payload => {
    const id = cleanText(payload?.id, 80);
    const meme = store.memes.find(item => item.id === id);
    if (!meme) return;
    let liked = socketLikedMemes.get(socket.id);
    if (!liked) { liked = new Set(); socketLikedMemes.set(socket.id, liked); }
    let count = activeReactions.get(id);
    if (count === undefined) count = new Set();
    const wantsLike = typeof payload?.liked === 'boolean' ? payload.liked : !liked.has(id);
    if (wantsLike) { liked.add(id); count.add(socket.id); }
    else { liked.delete(id); count.delete(socket.id); }
    activeReactions.set(id, count);
    // Seed likes are a baseline; current connected users add/remove their own reactions around it.
    const baseline = Number(meme.baseLikes ?? meme.likes ?? 0);
    meme.baseLikes = baseline;
    meme.likes = Math.max(0, baseline + count.size);
    persist();
    io.emit('meme:reaction-updated', { id, likes: meme.likes });
  });

  socket.on('arcade:request', () => {
    const votes = arcadeVotesBySocket.get(socket.id) || new Map();
    socket.emit('arcade:state', { totals: arcadeTotals.map(item => ({ ...item })), myVotes: [...votes.entries()] });
  });
  socket.on('arcade:vote', payload => {
    const question = Number(payload?.question);
    const option = payload?.option;
    if (!Number.isInteger(question) || question < 0 || question >= arcadeTotals.length || !['a', 'b'].includes(option)) return;
    let votes = arcadeVotesBySocket.get(socket.id);
    if (!votes) { votes = new Map(); arcadeVotesBySocket.set(socket.id, votes); }
    const previous = votes.get(question) || '';
    const next = previous === option ? '' : option;
    if (next) votes.set(question, next); else votes.delete(question);
    const counts = { a: 0, b: 0 };
    for (const voteMap of arcadeVotesBySocket.values()) {
      const choice = voteMap.get(question);
      if (choice === 'a' || choice === 'b') counts[choice] += 1;
    }
    arcadeTotals[question] = counts;
    io.emit('arcade:votes', { question, counts });
    socket.emit('arcade:my-vote', { question, choice: next });
  });

  socket.on('call:join', payload => addToCall(socket, payload?.room));
  socket.on('call:leave', () => removeFromCall(socket));
  socket.on('call:offer', payload => {
    if (!socket.data.callRoom || !callRooms.get(socket.data.callRoom)?.has(payload?.target) || !payload?.description) return;
    io.to(payload.target).emit('call:offer', { from: socket.id, name: socket.data.name, description: payload.description });
  });
  socket.on('call:answer', payload => {
    if (!socket.data.callRoom || !callRooms.get(socket.data.callRoom)?.has(payload?.target) || !payload?.description) return;
    io.to(payload.target).emit('call:answer', { from: socket.id, description: payload.description });
  });
  socket.on('call:ice', payload => {
    if (!socket.data.callRoom || !callRooms.get(socket.data.callRoom)?.has(payload?.target) || !payload?.candidate) return;
    io.to(payload.target).emit('call:ice', { from: socket.id, candidate: payload.candidate });
  });

  socket.on('disconnect', () => {
    removeFromCall(socket);
    onlineUsers.delete(socket.id);
    socketLikedMemes.delete(socket.id);
    arcadeVotesBySocket.delete(socket.id);
    for (let question = 0; question < arcadeTotals.length; question += 1) {
      const counts = { a: 0, b: 0 };
      for (const voteMap of arcadeVotesBySocket.values()) { const choice = voteMap.get(question); if (choice === 'a' || choice === 'b') counts[choice] += 1; }
      arcadeTotals[question] = counts;
      io.emit('arcade:votes', { question, counts });
    }
    for (const [, active] of activeReactions) active.delete(socket.id);
    broadcastPresence();
  });
});

server.listen(port, () => {
  console.log(`Afterclass Club is running at http://localhost:${port}`);
  console.log(`Serving ${publicDir}`);
});
