/* Afterclass Club — vanilla JS frontend + Socket.IO live features. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const STORAGE = {
  name: 'afterclass.nickname',
  mood: 'afterclass.mood',
  room: 'afterclass.chatRoom',
  rooms: 'afterclass.rooms',
  memeLikes: 'afterclass.memeLikes',
  tapBest: 'afterclass.tapBest',
  reactions: 'afterclass.chatReactions'
};
const routeNames = {
  home: 'common room', memes: 'meme lab', chat: 'back-bench chat', calls: 'video adda', arcade: 'game period'
};
const roomDefaults = [
  { id: '12-b', name: '12-B homies', hint: 'all present, barely' },
  { id: 'meme-club', name: 'meme club', hint: 'no context pls' },
  { id: 'late-night', name: 'late night', hint: 'low battery gang' }
];
const seedMemes = [
  { id: 'seed-1', author: 'Aarav', caption: 'Me opening the chapter for the 8th time like we have a personal connection.', text: 'BAS AAJ\nSAMAJH AAYEGA', color: 'art-yellow', emoji: '📚', createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), likes: 14 },
  { id: 'seed-2', author: 'Mahi', caption: 'POV: teacher says “this is very easy” and the board looks like NASA.', text: 'TEACHER: EASY HAI', color: 'art-pink', emoji: '🫠', createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(), likes: 22 },
  { id: 'seed-3', author: 'Dev', caption: 'One small break. Bas 5 minutes. Suddenly it is 2047.', text: 'JUST ONE\nMORE REEL', color: 'art-aqua', emoji: '📱', createdAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(), likes: 31 },
  { id: 'seed-4', author: 'Ira', caption: 'Aaj ka plan: do the thing. Aaj ka plot: chai first.', text: 'PRODUCTIVITY\nLOADING…', color: 'art-purple', emoji: '☕', createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(), likes: 9 },
  { id: 'seed-5', author: 'Kabir', caption: 'When group project means one person is the group.', text: 'GROUP PROJECT\nMOMENT', color: 'art-coral', emoji: '🧍', createdAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(), likes: 18 },
  { id: 'seed-6', author: 'Nia', caption: 'The friend who says “I did not study” and finishes first.', text: 'HUMBLE BRAG\nPRO MAX', color: 'art-grass', emoji: '🏆', createdAt: new Date(Date.now() - 1000 * 60 * 470).toISOString(), likes: 26 }
];
const quizQuestions = [
  { q: 'What is the official fuel of a last-minute study session?', a: ['Pure panic', 'A balanced salad', '8 hours of sleep', 'A silent retreat'], correct: 0, fact: 'Panic is loud, but tiny focused steps work better. You got this. ✨' },
  { q: 'Best response to “kal se pakka padhunga”?', a: ['Kal is a myth', 'Start with 10 minutes now', 'Buy 4 planners', 'Open 17 tabs'], correct: 1, fact: 'A tiny start beats a perfect plan sitting in drafts.' },
  { q: 'A truly elite group-chat skill is…', a: ['Replying “hmm”', 'Sending context-free memes', 'Leaving on read forever', 'Typing then deleting'], correct: 1, fact: 'The meme-to-context ratio is an art form.' }
];
const ratherQuestions = [
  { q: 'Choose your slightly chaotic superpower:', a: 'Understand every subject instantly', b: 'Pause time for a 20-min nap', emojiA: '🧠', emojiB: '😴' },
  { q: 'Your weekend vibe:', a: 'Hill-station pixel sunset', b: 'Room, snacks, and 12 episodes', emojiA: '🏔️', emojiB: '🍿' },
  { q: 'Best study buddy:', a: 'The friend who explains calmly', b: 'The friend who sends memes', emojiA: '✍️', emojiB: '🤣' }
];
const wordRounds = [
  { display: 'A D D A', answer: 'adda', clue: 'The art of hanging out and talking. (Hindi/Urdu)' },
  { display: 'C H A I', answer: 'chai', clue: 'The unofficial school timetable.' },
  { display: 'V I B E', answer: 'vibe', clue: 'The feeling in this little corner.' }
];

let nickname = localStorage.getItem(STORAGE.name) || 'Vinay';
let currentRoute = routeFromHash();
let activeChatRoom = localStorage.getItem(STORAGE.room) || '12-b';
let rooms = [...roomDefaults];
let onlineUsers = [];
let memes = [...seedMemes];
let chatHistories = {
  '12-b': [
    { id: 'chat-seed-1', room: '12-b', name: 'Mahi', text: 'Guys, anyone understood what was happening in that last lecture? 😭', time: new Date(Date.now() - 14 * 60000).toISOString() },
    { id: 'chat-seed-2', room: '12-b', name: 'Dev', text: 'Samjha toh nahi but nodded confidently.', time: new Date(Date.now() - 13 * 60000).toISOString() },
    { id: 'chat-seed-3', room: '12-b', name: 'Ira', text: 'Academic weapon ❌ academic decoration ✅', time: new Date(Date.now() - 12 * 60000).toISOString() },
    { id: 'chat-seed-4', room: '12-b', name: 'Aarav', text: 'Chai break? 5 min mein back. Pakka.', time: new Date(Date.now() - 10 * 60000).toISOString() }
  ]
};
let memeFilter = 'all';
let mood = localStorage.getItem(STORAGE.mood) || '';
let quizIndex = 0;
let quizScore = 0;
let ratherIndex = 0;
let ratherVotes = {};
let ratherTotals = ratherQuestions.map(() => ({ a: 0, b: 0 }));
let ratherChoices = {};
let wordIndex = 0;
let tapTimer = null;
let tapStopAt = 0;
let tapScore = 0;
let callRoom = 'study-break';
let callJoined = false;
let localStream = null;
let screenStream = null;
let micOn = true;
let cameraOn = true;
let peerConnections = new Map();
let remoteStreams = new Map();
let participantNames = new Map();
let pendingIce = new Map();
let socket;
try { socket = typeof io === 'function' ? io() : null; } catch (_) { socket = null; }

function routeFromHash() {
  const route = (location.hash.match(/^#\/(home|memes|chat|calls|arcade)/) || [])[1];
  return route || 'home';
}
function safeText(value, max = 500) { return String(value ?? '').slice(0, max).trim(); }
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function initials(name) { return safeText(name, 24).split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || 'F'; }
function shortTime(iso) {
  const date = new Date(iso || Date.now());
  if (Number.isNaN(date.getTime())) return 'now';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' ', '').toLowerCase();
}
function relativeTime(iso) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso || Date.now()).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
function toast(message, strong = '') {
  const region = $('#toast-region');
  if (!region) return;
  const node = document.createElement('div');
  node.className = 'toast';
  node.innerHTML = strong ? `<strong>${escapeHTML(strong)}</strong> ${escapeHTML(message)}` : escapeHTML(message);
  region.appendChild(node);
  setTimeout(() => node.remove(), 3400);
}
function setRoute(route) {
  if (!routeNames[route]) route = 'home';
  if (route !== 'calls' && callJoined) leaveCall(true);
  if (route !== currentRoute) location.hash = `/${route}`;
  currentRoute = route;
  renderPage();
}
function updateNav() {
  $$('[data-route]').forEach(link => {
    const active = link.dataset.route === currentRoute;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  $('#breadcrumb-current').textContent = routeNames[currentRoute] || 'common room';
}
function syncProfile() {
  $('#profile-name').textContent = nickname;
  $('#profile-avatar').textContent = initials(nickname);
  $('#top-avatar').textContent = initials(nickname);
  $('#nickname-input').value = nickname;
  if (socket?.connected) socket.emit('user:hello', { name: nickname });
}
function openModal(id) { const dialog = document.getElementById(id); if (dialog && !dialog.open) dialog.showModal(); }
function closeModal(id) { const dialog = document.getElementById(id); if (dialog?.open) dialog.close(); }
function renderPage() {
  updateNav();
  const root = $('#view');
  root.className = `view page-${currentRoute}`;
  root.innerHTML = ({ home: renderHome, memes: renderMemes, chat: renderChat, calls: renderCalls, arcade: renderArcade }[currentRoute] || renderHome)();
  bindPageEvents();
  if (currentRoute === 'chat') {
    joinChatRoom(activeChatRoom);
    renderChatMessages();
  }
  if (currentRoute === 'memes') renderMemeCards();
  if (currentRoute === 'calls') renderCallTiles();
}
function renderHome() {
  const onlineCount = Math.max(onlineUsers.length, socket?.connected ? 1 : 0);
  const onlineLabel = onlineCount === 1 ? 'friend online' : 'friends online';
  return `
    <div class="hero-panel">
      <section class="hero-copy">
        <div class="hello-chip"><span>✦</span> AFTER-SCHOOL ENERGY</div>
        <h1>Your people.<br>Your <span class="highlight">own little</span><br>internet.</h1>
        <p class="subtitle">Memes, random gupshup, game nights, and calls that were supposed to last 5 mins. Apna sa corner, bas. 💛</p>
        <div class="hero-actions"><button class="button button-dark" data-go="chat">Enter the adda <span>↗</span></button><button class="button button-soft" data-go="calls">Start a video adda <span>▣</span></button></div>
      </section>
      <section class="hero-art" aria-label="Pixel art mountain meadow">
        <div class="pixel-landscape"></div><span class="art-sticker top">✿ mood: unbothered</span><span class="art-sticker bottom">meet me after class →</span><span class="art-star one">✦</span><span class="art-star two">✷</span>
      </section>
    </div>
    <div class="stats-strip">
      <div class="stat-block"><span class="stat-icon pink">☻</span><div><b class="online-count">${onlineCount}</b><small>${onlineLabel}</small></div></div>
      <div class="stat-block"><span class="stat-icon yellow">▧</span><div><b>${memes.length}</b><small>memes in the wild</small></div></div>
      <div class="stat-block"><span class="stat-icon aqua">✧</span><div><b>0%</b><small>attendance pressure</small></div></div>
    </div>
    <div class="section-heading"><div><h2>Pick your corner <span>✳</span></h2><p>Every room has a different kind of chaos.</p></div><span class="tag tag-yellow">NO HOMEWORK HERE</span></div>
    <div class="club-grid">
      <button class="card club-card coral" data-go="memes" style="text-align:left;color:inherit"><span class="card-label"><b>01 / CREATIVE CHAOS</b><span>↗</span></span><span class="decoration">✿</span><span class="card-emoji">😂</span><h3>Meme lab</h3><p>Drop the meme. Explain nothing. Let the group chat do its thing.</p><span class="arrow-link">Enter lab ↗</span></button>
      <button class="card club-card aqua" data-go="chat" style="text-align:left;color:inherit"><span class="card-label"><b>02 / BACK BENCH</b><span>↗</span></span><span class="decoration">⌁</span><span class="card-emoji">💬</span><h3>Gupshup zone</h3><p>Serious baatein, unserious baatein, and 37 unread messages.</p><span class="arrow-link">Say hi ↗</span></button>
      <button class="card club-card purple" data-go="arcade" style="text-align:left;color:inherit"><span class="card-label"><b>03 / FREE PERIOD</b><span>↗</span></span><span class="decoration">✦</span><span class="card-emoji">🕹️</span><h3>Game period</h3><p>Tiny games for a tiny brain break. Challenge your bestie.</p><span class="arrow-link">Play a round ↗</span></button>
    </div>
    <div class="bottom-home-grid">
      <section class="card mood-card"><div class="card-label"><b>YOUR CURRENT VIBE</b><span>✺ DAILY CHECK-IN</span></div><h3 style="margin-top:15px">Aaj kaisa lag raha hai?</h3><p class="muted" style="margin-bottom:0">No pressure to be productive. Just checking in.</p><div class="mood-options">${[['chill','😌 chill'],['chaotic','🌀 chaotic'],['sleepy','😴 sleepy'],['locked-in','🎯 locked in']].map(([id,label]) => `<button class="mood-option ${mood===id?'selected':''}" data-mood="${id}">${label}</button>`).join('')}</div></section>
      <section class="card prompt-card"><div class="card-label"><b>ICEBREAKER OF THE DAY</b><span>✎ OPEN QUESTION</span></div><h3 style="margin-top:15px">${getPrompt().title}</h3><p class="prompt-text">${getPrompt().text}</p><div class="prompt-actions"><button class="button button-dark button-small" data-go="chat">Answer in chat <span>↗</span></button><button class="button button-soft button-small" id="new-prompt-btn" aria-label="Get another icebreaker">↻</button></div></section>
    </div>
    <div class="arcade-footer"><span>MADE FOR THE GROUP CHAT GENERATION ✳</span><span>SCREEN BREAKS ARE ALSO PRODUCTIVE, OKAY?</span></div>`;
}
const prompts = [
  { title: 'What is your most harmless hot take?', text: 'Pineapple on pizza? Maggi at 2 AM? Defend your extremely important opinion.' },
  { title: 'Drop one song for the current mood.', text: 'No explanation needed. Just the song that is soundtracking your brain today.' },
  { title: 'What tiny thing made you happy this week?', text: 'A good chai, a random compliment, that one perfect cloud. Chhoti khushiyan count.' },
  { title: 'You get a free ticket anywhere. Kahan jaoge?', text: 'One destination, no overthinking. Add the snack you are taking with you.' }
];
let promptIndex = Number(localStorage.getItem('afterclass.promptIndex') || 0) % prompts.length;
function getPrompt() { return prompts[promptIndex]; }

function renderMemes() {
  return `
    <div class="page-topline"><div><p class="eyebrow">THE COMMUNITY NOTICEBOARD</p><h2>Meme lab <span>✿</span></h2><p class="subtitle">Your daily dose of “it is funny because it is true.” Create a post or simply appreciate the chaos.</p></div><span class="tag tag-purple">CREATIVE PERIOD</span></div>
    <section class="meme-hero"><div><p class="eyebrow" style="color:#5b4f72">NO CONTEXT NEEDED</p><h1>Humour is our<br>group project.</h1><p>Class ke baad sabse important kaam: sending a meme instead of explaining your feelings.</p></div><span class="sticker hero-sticker">:’)</span></section>
    <section class="card compose-card"><div class="compose-head"><span class="avatar avatar-purple" id="meme-avatar">${initials(nickname)}</span><span><b>Make the group laugh, ${escapeHTML(nickname)}.</b><small>Low effort is a valid art form.</small></span></div>
      <form id="meme-form"><div class="compose-fields"><textarea class="text-area" id="meme-caption" maxlength="220" placeholder="Write a caption… e.g. me saying bas 5 min more at 2:47 AM" required></textarea><input class="text-input" id="meme-image-url" type="url" placeholder="Image URL (optional)" aria-label="Image URL optional" /></div>
      <div class="compose-bottom"><div class="compose-tools"><label for="meme-image-file">＋ add an image</label><input class="file-input" id="meme-image-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" /><select class="select-input" id="meme-style" aria-label="Meme poster style" style="width:auto;padding:8px 10px"><option value="art-yellow">Sunshine</option><option value="art-pink">Pink chaos</option><option value="art-aqua">Mint mood</option><option value="art-purple">Purple thoughts</option><option value="art-coral">Main character</option><option value="art-grass">Fresh grass</option></select></div><button class="button button-dark button-small" type="submit">Post to the wall <span>↗</span></button></div></form>
    </section>
    <div class="section-heading"><div><h2>Fresh off the bench</h2><p>Local legends, big laughs, zero context.</p></div><span class="tag tag-yellow" id="meme-total">${memes.length} POSTS</span></div>
    <div class="meme-filters"><button class="filter-pill ${memeFilter==='all'?'active':''}" data-filter="all">Everything</button><button class="filter-pill ${memeFilter==='top'?'active':''}" data-filter="top">Most loved ✦</button><button class="filter-pill ${memeFilter==='recent'?'active':''}" data-filter="recent">Latest drops ↻</button></div>
    <div id="meme-grid" class="meme-grid"></div>
    <div class="arcade-footer"><span>KEEP IT KIND. ROAST THE SITUATION, NOT THE PERSON. 💛</span><span>AFTERCLASS MEME LAB / VOL. 01</span></div>`;
}
function readLikedMemes() { try { return new Set(JSON.parse(localStorage.getItem(STORAGE.memeLikes) || '[]')); } catch (_) { return new Set(); } }
function renderMemeCards() {
  const grid = $('#meme-grid');
  if (!grid) return;
  const liked = readLikedMemes();
  let list = [...memes];
  if (memeFilter === 'top') list.sort((a,b) => (b.likes || 0) - (a.likes || 0));
  if (memeFilter === 'recent') list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  $('#meme-total') && ($('#meme-total').textContent = `${list.length} POSTS`);
  if (!list.length) { grid.innerHTML = '<div class="empty-state">The wall is suspiciously quiet. Be the first chaos coordinator. ✨</div>'; return; }
  grid.innerHTML = list.map((meme, index) => {
    const color = /^art-(yellow|pink|aqua|purple|coral|grass)$/.test(meme.color) ? meme.color : 'art-yellow';
    const likedNow = liked.has(meme.id);
    const showImage = typeof meme.image === 'string' && /^(https:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(meme.image);
    const artContent = showImage ? `<img src="${escapeHTML(meme.image)}" alt="Meme image" loading="lazy" />` : `<span class="meme-kicker">AFTERCLASS / NO. ${String(index + 1).padStart(2,'0')}</span><span class="meme-big">${escapeHTML(meme.text || meme.caption || 'NO CONTEXT')}</span><span class="meme-emoji">${escapeHTML(meme.emoji || '✦')}</span>`;
    return `<article class="meme-card" data-meme-id="${escapeHTML(meme.id)}"><div class="meme-art ${color}">${artContent}</div><div class="meme-meta"><p>${escapeHTML(meme.caption || '')}</p><div class="meme-meta-bottom"><span class="meme-author"><span class="mini-avatar">${escapeHTML(initials(meme.author || 'Friend'))}</span><span>${escapeHTML(meme.author || 'Friend')} · ${escapeHTML(relativeTime(meme.createdAt))}</span></span><button class="reaction-button ${likedNow?'reacted':''}" data-like-meme="${escapeHTML(meme.id)}" aria-pressed="${likedNow}">💗 ${Number(meme.likes || 0)}</button></div></div></article>`;
  }).join('');
}
function createMeme(caption, image, color) {
  const clean = safeText(caption, 220);
  if (!clean) return toast('Caption daal do first. 😄');
  const colors = ['art-yellow','art-pink','art-aqua','art-purple','art-coral','art-grass'];
  const parts = clean.split(/[.!?\n]/).filter(Boolean);
  const text = (parts[0] || clean).slice(0, 64).toUpperCase();
  const meme = { id: `local-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, author: nickname, caption: clean, text, color: colors.includes(color) ? color : colors[0], emoji: ['😵‍💫','😂','✿','☕','🫠','✦'][Math.floor(Math.random()*6)], createdAt: new Date().toISOString(), likes: 0, image: image || '' };
  if (socket?.connected) socket.emit('meme:create', meme);
  else { memes.unshift(meme); renderMemeCards(); }
  $('#meme-caption').value = '';
  $('#meme-image-url').value = '';
  $('#meme-image-file').value = '';
  toast('The group chat museum has a new exhibit.', 'Posted!');
}

function renderChat() {
  const customRooms = rooms.filter(r => !roomDefaults.some(def => def.id === r.id));
  const allRooms = [...roomDefaults, ...customRooms];
  return `
    <div class="page-topline"><div><p class="eyebrow">WHISPERS FROM THE BACK ROW</p><h2>Gupshup zone <span>◉</span></h2><p class="subtitle">Talk about everything and absolutely nothing. Typing “bro” counts as a complete sentence here.</p></div><span class="tag tag-aqua">CHILL ONLY</span></div>
    <div class="chat-layout">
      <aside class="chat-rooms"><h3>Classrooms</h3><p>Choose your chaos.</p><div class="chat-room-list">${allRooms.map(room => `<button class="chat-room-btn ${activeChatRoom===room.id?'active':''}" data-chat-room="${escapeHTML(room.id)}"><span class="hash">#</span><span>${escapeHTML(room.name)}</span></button>`).join('')}</div><button class="new-chat-room" id="chat-new-room">＋ create a new room</button><div style="margin:20px 7px 0;padding-top:15px;border-top:1px dashed #a3cfc4"><p class="eyebrow" style="color:#72938a;margin-bottom:9px">CHAT ETIQUETTE</p><p style="font-size:10px;line-height:1.65;color:#6c827b;margin:0">Be kind.<br>Share the aux.<br>Context optional.<br>Respect the lurkers. 🌱</p></div></aside>
      <section class="chat-panel"><header class="chat-panel-head"><div class="chat-room-title"><strong id="chat-title"># ${escapeHTML(roomName(activeChatRoom))}</strong><small id="chat-subtitle">the class is in session · live chat</small></div><div class="chat-head-users" id="chat-head-users"><span class="mini-avatar">✦</span><span class="mini-avatar">☻</span><span class="more-users">+?</span></div></header><div class="chat-messages" id="chat-messages"><div class="day-divider">TODAY / THE GROUP CHAT</div><div class="empty-state">Loading the gossip… 💬</div></div><div class="typing-indicator" id="typing-indicator" hidden></div><form class="chat-composer" id="chat-form"><div class="composer-row"><textarea class="chat-input" id="chat-input" maxlength="800" rows="1" placeholder="Type something nice… or just send a 🫠" aria-label="Chat message"></textarea><button class="send-button" type="submit" aria-label="Send message">↗</button></div><div class="composer-hint"><span>ENTER TO SEND · SHIFT + ENTER FOR NEW LINE</span><span id="chat-char-count">0 / 800</span></div></form></section>
    </div>
    <div class="arcade-footer"><span>LIVE GUPSHUP, LIVE GROUPS ✦</span><span>PLEASE DO NOT SEND “HI” THEN DISAPPEAR</span></div>`;
}
function roomName(id) { return rooms.find(room => room.id === id)?.name || id.replace(/-/g,' '); }
function joinChatRoom(room) {
  const id = safeText(room, 32).toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'') || '12-b';
  activeChatRoom = id;
  localStorage.setItem(STORAGE.room, id);
  if (socket?.connected) socket.emit('chat:join', { room: id });
}
function renderChatMessages() {
  const container = $('#chat-messages');
  if (!container) return;
  const messages = chatHistories[activeChatRoom] || [];
  const colors = ['coral','aqua','yellow','pink',''];
  if (!messages.length) {
    container.innerHTML = '<div class="day-divider">TODAY / THE GROUP CHAT</div><div class="empty-state">It is giving peaceful. Be the first to break the silence. 👀</div>';
  } else {
    container.innerHTML = `<div class="day-divider">TODAY / THE GROUP CHAT</div>${messages.map((message, index) => {
      const mine = message.name === nickname;
      const color = colors[(message.name || '').length % colors.length];
      const reactionKey = `${message.id}`;
      const reactStore = readChatReactions();
      const reaction = reactStore[reactionKey] || '';
      return `<article class="chat-message ${mine?'mine':''}" data-message-id="${escapeHTML(message.id)}"><span class="message-avatar ${color}">${escapeHTML(initials(message.name))}</span><div class="message-body"><div class="message-meta"><b>${escapeHTML(mine?'you':message.name || 'friend')}</b><time>${escapeHTML(shortTime(message.time))}</time></div><div class="message-bubble">${escapeHTML(message.text).replace(/\n/g,'<br>')}</div><div class="message-reactions"><button data-react-message="${escapeHTML(reactionKey)}" data-reaction="💗" aria-label="React with heart">${reaction==='💗'?'💗 1':'♡'}</button><button data-react-message="${escapeHTML(reactionKey)}" data-reaction="😂" aria-label="React with laugh">${reaction==='😂'?'😂 1':'😂'}</button></div></div></article>`;
    }).join('')}`;
  }
  container.scrollTop = container.scrollHeight;
  $('#chat-title') && ($('#chat-title').textContent = `# ${roomName(activeChatRoom)}`);
  const currentRoom = rooms.find(room => room.id === activeChatRoom);
  $('#chat-subtitle') && ($('#chat-subtitle').textContent = `${currentRoom?.hint || 'your corner of the internet'} · live chat`);
  $$('.chat-room-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.chatRoom === activeChatRoom));
}
function readChatReactions() { try { return JSON.parse(localStorage.getItem(STORAGE.reactions) || '{}'); } catch (_) { return {}; } }
function sendChatMessage() {
  const input = $('#chat-input');
  const text = safeText(input?.value, 800);
  if (!text) return;
  if (socket?.connected) socket.emit('chat:send', { room: activeChatRoom, text });
  else {
    const msg = { id: `offline-${Date.now()}`, room: activeChatRoom, name: nickname, text, time: new Date().toISOString() };
    (chatHistories[activeChatRoom] ||= []).push(msg);
    toast('Server is offline, so this message stays in this tab.', 'Saved locally');
    renderChatMessages();
  }
  input.value = '';
  $('#chat-char-count').textContent = '0 / 800';
  socket?.emit('chat:typing', { room: activeChatRoom, typing: false });
  input.focus();
}

function renderCalls() {
  const roomSafe = escapeHTML(callRoom);
  return `
    <div class="calls-hero"><div><p class="eyebrow">THE DIGITAL STAFF ROOM</p><h2>Video adda <span>▣</span></h2><p class="subtitle">Bring your faces, bring your stories. Chai optional, good company mandatory.</p></div><span class="tag tag-coral">SMALL GROUP ENERGY</span></div>
    <section class="card call-control-card"><div><label for="call-room-input">YOUR HANGOUT ROOM</label><input class="text-input" id="call-room-input" maxlength="32" value="${roomSafe}" placeholder="e.g. friday-chaos" /></div><div class="call-controls-right"><span class="tag tag-yellow" id="call-status-tag">${callJoined?'IN THE ROOM':'ROOM IS OPEN'}</span><button class="button ${callJoined?'button-coral':'button-dark'}" id="call-join-btn">${callJoined?'Leave call':'Join the adda'} <span>${callJoined?'↙':'↗'}</span></button></div></section>
    <section class="call-stage"><div class="call-stage-top"><span><strong id="call-room-label"># ${roomSafe}</strong> <span style="margin-left:8px" id="call-participant-count">waiting for the gang</span></span><span class="call-live"><i></i> PRIVATE ROOM</span></div><div class="call-tiles" id="call-tiles"></div><div class="call-stage-bottom"><button class="round-control ${micOn?'':'off'}" id="toggle-mic" title="Toggle microphone" aria-label="Toggle microphone">${micOn?'🎙':'🔇'}</button><button class="round-control ${cameraOn?'':'off'}" id="toggle-camera" title="Toggle camera" aria-label="Toggle camera">${cameraOn?'▣':'⊘'}</button><button class="round-control" id="share-screen" title="Share screen" aria-label="Share screen">▤</button><button class="round-control leave" id="leave-call" title="Leave call" aria-label="Leave call">↙</button></div></section>
    <div class="call-tips"><div class="call-tip"><span>🎧</span><p><b>Headphones help</b>Less echo, more “bro can you hear me?” energy.</p></div><div class="call-tip"><span>🔒</span><p><b>Room code = room name</b>Tell your friends which room to enter. Do not share it publicly.</p></div><div class="call-tip"><span>🫶</span><p><b>Ask before recording</b>Consent first. Awkwardness later, if any.</p></div></div>
    <div class="arcade-footer"><span>VIDEO IS PEER-TO-PEER WHEN CONNECTED ✦</span><span>CAMERA PERMISSION NEEDED · HTTPS REQUIRED</span></div>`;
}
function renderCallTiles() {
  const container = $('#call-tiles');
  if (!container) return;
  const people = [{ id: 'local', name: nickname, local: true }, ...[...participantNames.entries()].map(([id,name]) => ({ id, name, stream: remoteStreams.get(id) }))];
  if (!callJoined) {
    container.innerHTML = `<div class="call-empty"><div class="empty-icon">📹</div><h3>Room is waiting for you.</h3><p>Pick a room name above, then join. Friends using the same deployed site<br>can enter the same room from their devices.</p></div>`;
    $('#call-participant-count') && ($('#call-participant-count').textContent = 'waiting for the gang');
    return;
  }
  const shown = people.length ? people : [{id:'local',name:nickname,local:true}];
  container.innerHTML = shown.map(person => `<div class="call-tile ${person.local?'local-tile':''}" data-person="${escapeHTML(person.id)}"><div class="tile-avatar">${escapeHTML(initials(person.name))}</div><span class="tile-name">${escapeHTML(person.local?`${person.name} (you)`:person.name)}</span>${person.local?`<span class="tile-status">YOU</span>`:''}</div>`).join('');
  // Attach media only after the tile elements exist.
  const localTile = $('.call-tile[data-person="local"]', container);
  if (localTile && localStream) attachStreamVideo(localTile, localStream, 'local-video');
  for (const [id, stream] of remoteStreams.entries()) {
    const tile = container.querySelector(`[data-person="${CSS.escape(id)}"]`);
    if (tile && stream) attachStreamVideo(tile, stream, `remote-${id}`);
  }
  $('#call-participant-count') && ($('#call-participant-count').textContent = `${people.length} participant${people.length===1?'':'s'} connected`);
  $('#call-status-tag') && ($('#call-status-tag').textContent = 'IN THE ROOM');
  $('#call-room-label') && ($('#call-room-label').textContent = `# ${callRoom}`);
  $('#call-join-btn') && ($('#call-join-btn').textContent = 'Leave call ↙');
}
function attachStreamVideo(tile, stream, id) {
  let video = tile.querySelector('video');
  if (!video) { video = document.createElement('video'); video.autoplay = true; video.playsInline = true; video.muted = id === 'local-video'; video.dataset.streamId = id; tile.prepend(video); }
  if (video.srcObject !== stream) video.srcObject = stream;
  tile.querySelector('.tile-avatar')?.classList.add('avatar-hidden');
}
async function joinCall() {
  const input = $('#call-room-input');
  callRoom = safeText(input?.value || callRoom, 32).toLowerCase().replace(/[^a-z0-9 -]/g,'').trim().replace(/\s+/g,'-') || 'study-break';
  if (!socket?.connected) return toast('The live server is not connected yet. Refresh and try again.', 'One sec');
  if (!navigator.mediaDevices?.getUserMedia) return toast('This browser needs HTTPS or localhost for camera access.', 'Camera unavailable');
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: { ideal: 640 }, height: { ideal: 480 } } });
    callJoined = true;
    participantNames.clear(); remoteStreams.clear(); pendingIce.clear();
    socket.emit('call:join', { room: callRoom });
    renderCallTiles();
    $('#call-join-btn').textContent = 'Leave call ↙';
    $('#call-status-tag').textContent = 'JOINING…';
    $('#call-room-label').textContent = `# ${callRoom}`;
    toast(`You are joining #${callRoom}. Send the room name to your friends.`, 'Video adda');
  } catch (error) {
    console.warn('Media permission error:', error);
    toast(error.name === 'NotAllowedError' ? 'Camera/mic permission was blocked. Allow it in browser settings.' : 'Could not start the camera. Check that another app is not using it.', 'Permission needed');
  }
}
function closePeer(id) {
  const pc = peerConnections.get(id);
  if (pc) { pc.ontrack = null; pc.onicecandidate = null; try { pc.close(); } catch (_) {} }
  peerConnections.delete(id); remoteStreams.delete(id); pendingIce.delete(id); participantNames.delete(id);
}
function makePeerConnection(id, name) {
  if (peerConnections.has(id)) return peerConnections.get(id);
  if (name) participantNames.set(id, name);
  const pc = new RTCPeerConnection({ iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ] });
  if (localStream) localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  pc.onicecandidate = event => { if (event.candidate) socket?.emit('call:ice', { target: id, candidate: event.candidate }); };
  pc.ontrack = event => {
    let stream = remoteStreams.get(id);
    if (!stream) { stream = event.streams?.[0] || new MediaStream(); remoteStreams.set(id, stream); }
    if (!event.streams?.[0] && event.track && !stream.getTracks().some(track => track.id === event.track.id)) stream.addTrack(event.track);
    renderCallTiles();
  };
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed') toast('Connection got wobbly. Try rejoining the call.', 'Call hiccup');
  };
  peerConnections.set(id, pc);
  return pc;
}
async function flushIce(id, pc) {
  const queued = pendingIce.get(id) || [];
  pendingIce.delete(id);
  for (const candidate of queued) { try { await pc.addIceCandidate(candidate); } catch (error) { console.debug('Skipping stale ICE candidate', error); } }
}
async function createOfferTo(id, name) {
  try {
    const pc = makePeerConnection(id, name);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket?.emit('call:offer', { target: id, description: pc.localDescription });
  } catch (error) { console.warn('Offer failed', error); toast('Could not connect to one friend yet.'); }
}
async function receiveOffer({ from, name, description }) {
  if (!callJoined) return;
  try {
    const pc = makePeerConnection(from, name);
    await pc.setRemoteDescription(description);
    await flushIce(from, pc);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket?.emit('call:answer', { target: from, description: pc.localDescription });
    renderCallTiles();
  } catch (error) { console.warn('Answer failed', error); }
}
async function leaveCall(notify = true) {
  if (notify && socket && callJoined) socket.emit('call:leave', { room: callRoom });
  callJoined = false;
  if (tapTimer) { clearInterval(tapTimer); tapTimer = null; }
  for (const id of [...peerConnections.keys()]) closePeer(id);
  if (screenStream) { screenStream.getTracks().forEach(track => track.stop()); screenStream = null; }
  if (localStream) { localStream.getTracks().forEach(track => track.stop()); localStream = null; }
  participantNames.clear(); remoteStreams.clear(); pendingIce.clear();
  if (currentRoute === 'calls') {
    renderCallTiles();
    $('#call-join-btn') && ($('#call-join-btn').textContent = 'Join the adda ↗');
    $('#call-status-tag') && ($('#call-status-tag').textContent = 'ROOM IS OPEN');
  }
}

function renderArcade() {
  const best = Number(localStorage.getItem(STORAGE.tapBest) || 0);
  const quiz = quizQuestions[quizIndex % quizQuestions.length];
  const rather = ratherQuestions[ratherIndex % ratherQuestions.length];
  const word = wordRounds[wordIndex % wordRounds.length];
  const votes = { ...(ratherTotals[ratherIndex % ratherQuestions.length] || { a: 0, b: 0 }), mine: ratherChoices[ratherIndex % ratherQuestions.length] || '' };
  return `
    <div class="arcade-hero"><div><p class="eyebrow" style="color:#68744b">NO TESTS. NO GRADES.</p><h1>Free period! <span>✹</span></h1><p>Micro-games for your brain break. Challenge yourself, flex in the group chat, then please drink some water.</p></div><span class="sticker sticker-yellow" style="transform:rotate(8deg)">GG!</span></div>
    <div class="arcade-grid">
      <section class="card game-card tap-game"><div class="game-card-head"><div><p class="eyebrow">GAME 01 / SPEED</p><h3>Tap like there is<br>free Wi-Fi.</h3><p>5 seconds. One finger. Maximum chaos.</p></div><span class="game-big-emoji">⚡</span></div><div class="tap-display" id="tap-display">${tapScore}</div><div class="tap-caption" id="tap-caption">PERSONAL BEST: ${best} TAPS</div><div class="tap-progress"><span id="tap-progress-fill"></span></div><button class="button button-dark" id="tap-start-btn">${tapTimer?'Tap!':'Start the sprint'} <span>↗</span></button><p class="game-result" id="tap-result">Ready? Steady? Tap.</p></section>
      <section class="card game-card quiz-game"><div class="game-card-head"><div><p class="eyebrow">GAME 02 / BRAIN ROT</p><h3>Extremely important<br>quiz.</h3><p>Academic integrity is on a break.</p></div><span class="game-big-emoji">🧠</span></div><p class="quiz-question" id="quiz-question">${escapeHTML(quiz.q)}</p><div class="quiz-options" id="quiz-options">${quiz.a.map((answer,i)=>`<button class="quiz-option" data-quiz-answer="${i}">${escapeHTML(answer)}</button>`).join('')}</div><p class="game-result" id="quiz-result">Score: ${quizScore} correct · Question ${(quizIndex%quizQuestions.length)+1}/${quizQuestions.length}</p><button class="button button-soft button-small" id="next-quiz-btn">Next question ↻</button></section>
      <section class="card game-card rather-game"><div class="game-card-head"><div><p class="eyebrow">GAME 03 / PICK A SIDE</p><h3>Would you rather?</h3><p>There are no wrong answers. Only lore.</p></div><span class="game-big-emoji">🫵</span></div><p class="rather-question" id="rather-question">${escapeHTML(rather.q)}</p><div class="rather-options"><button class="rather-choice ${votes.mine==='a'?'chosen':''}" data-rather="a">${rather.emojiA} ${escapeHTML(rather.a)} <span>${votes.a||0} votes</span></button><button class="rather-choice ${votes.mine==='b'?'chosen':''}" data-rather="b">${rather.emojiB} ${escapeHTML(rather.b)} <span>${votes.b||0} votes</span></button></div><p class="game-result" id="rather-result">Your pick becomes canon (in this browser).</p><button class="button button-soft button-small" id="next-rather-btn">Next dilemma ↻</button></section>
      <section class="card game-card word-game"><div class="game-card-head"><div><p class="eyebrow">GAME 04 / WORD VIBES</p><h3>Guess the word.</h3><p>Little hints, large brain energy.</p></div><span class="game-big-emoji">🔤</span></div><p class="muted" id="word-clue" style="margin:17px 0 0">Hint: ${escapeHTML(word.clue)}</p><div class="word-row" id="word-display">${word.display.split(' ').map(letter=>`<span class="word-letter">${escapeHTML(letter)}</span>`).join('')}</div><form class="word-input-row" id="word-form"><input class="text-input" id="word-answer" maxlength="12" placeholder="Your guess…" autocomplete="off" required /><button class="button button-dark button-small" type="submit">Guess ↗</button></form><p class="game-result" id="word-result">One word. No pressure.</p><button class="button button-soft button-small" id="next-word-btn">Another word ↻</button></section>
    </div>
    <div class="arcade-footer"><span>BEST TAP SCORE: ${best} ✦</span><span>PLEASE RETURN YOUR BRAIN TO THE BODY AFTER PLAYING.</span></div>`;
}

function bindPageEvents() {
  $$('[data-go]').forEach(button => button.addEventListener('click', () => setRoute(button.dataset.go)));
  $$('[data-mood]').forEach(button => button.addEventListener('click', () => {
    mood = button.dataset.mood;
    localStorage.setItem(STORAGE.mood, mood);
    $$('.mood-option').forEach(option => option.classList.toggle('selected', option.dataset.mood === mood));
    toast(`Vibe saved: ${mood.replace('-',' ')}. No explanation needed.`, 'Check-in');
  }));
  $('#new-prompt-btn')?.addEventListener('click', () => {
    promptIndex = (promptIndex + 1) % prompts.length;
    localStorage.setItem('afterclass.promptIndex', String(promptIndex));
    // Replace only the prompt copy so it does not disturb other homepage bindings.
    const card = $('.prompt-card');
    if (card) { card.querySelector('h3').textContent = getPrompt().title; card.querySelector('.prompt-text').textContent = getPrompt().text; }
  });
  if (currentRoute === 'memes') {
    $('#meme-form')?.addEventListener('submit', async event => {
      event.preventDefault();
      let image = safeText($('#meme-image-url').value, 2000);
      const file = $('#meme-image-file').files?.[0];
      if (file) {
        if (file.size > 380 * 1024) return toast('Choose an image smaller than 380 KB for the live wall.', 'Image too large');
        try { image = await fileToDataURL(file); } catch (_) { return toast('Could not read that image. Try another one.'); }
      }
      if (image && !/^(https:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(image)) return toast('Use an HTTPS image URL or upload a file.');
      createMeme($('#meme-caption').value, image, $('#meme-style').value);
    });
    $$('.filter-pill').forEach(button => button.addEventListener('click', () => { memeFilter = button.dataset.filter; $$('.filter-pill').forEach(p=>p.classList.toggle('active',p===button)); renderMemeCards(); }));
    $('#meme-grid')?.addEventListener('click', event => {
      const button = event.target.closest('[data-like-meme]');
      if (!button) return;
      const id = button.dataset.likeMeme;
      const liked = readLikedMemes();
      const already = liked.has(id);
      if (already) liked.delete(id); else liked.add(id);
      localStorage.setItem(STORAGE.memeLikes, JSON.stringify([...liked]));
      if (socket?.connected) socket.emit('meme:react', { id, liked: !already });
      else { const meme = memes.find(m => m.id === id); if (meme) meme.likes = Math.max(0, Number(meme.likes||0) + (already ? -1 : 1)); }
      const current = memes.find(m => m.id === id);
      if (current && !socket?.connected) button.textContent = `${already?'💗':'💗'} ${current.likes}`;
      button.classList.toggle('reacted', !already);
      button.setAttribute('aria-pressed', String(!already));
      if (socket?.connected) button.textContent = `💗 ${Number(current?.likes || 0) + (already ? -1 : 1)}`;
    });
  }
  if (currentRoute === 'chat') {
    $$('.chat-room-btn').forEach(button => button.addEventListener('click', () => {
      activeChatRoom = button.dataset.chatRoom;
      joinChatRoom(activeChatRoom);
      $$('.chat-room-btn').forEach(b => b.classList.toggle('active', b === button));
      renderChatMessages();
    }));
    $('#chat-new-room')?.addEventListener('click', () => openModal('room-modal'));
    $('#chat-form')?.addEventListener('submit', event => { event.preventDefault(); sendChatMessage(); });
    $('#chat-input')?.addEventListener('input', event => {
      $('#chat-char-count').textContent = `${event.target.value.length} / 800`;
      if (event.target.value.trim()) socket?.emit('chat:typing', { room: activeChatRoom, typing: true });
    });
    $('#chat-input')?.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendChatMessage(); }
    });
    $('#chat-messages')?.addEventListener('click', event => {
      const button = event.target.closest('[data-react-message]');
      if (!button) return;
      const state = readChatReactions();
      const id = button.dataset.reactMessage;
      state[id] = state[id] === button.dataset.reaction ? '' : button.dataset.reaction;
      localStorage.setItem(STORAGE.reactions, JSON.stringify(state));
      renderChatMessages();
    });
  }
  if (currentRoute === 'calls') {
    $('#call-join-btn')?.addEventListener('click', () => callJoined ? leaveCall(true) : joinCall());
    $('#leave-call')?.addEventListener('click', () => leaveCall(true));
    $('#toggle-mic')?.addEventListener('click', () => {
      micOn = !micOn;
      if (localStream) localStream.getAudioTracks().forEach(track => { track.enabled = micOn; });
      $('#toggle-mic').classList.toggle('off', !micOn); $('#toggle-mic').textContent = micOn ? '🎙' : '🔇';
      toast(micOn ? 'Mic is back on.' : 'Mic muted. Secret snack break?');
    });
    $('#toggle-camera')?.addEventListener('click', () => {
      cameraOn = !cameraOn;
      if (localStream) localStream.getVideoTracks().forEach(track => { track.enabled = cameraOn; });
      $('#toggle-camera').classList.toggle('off', !cameraOn); $('#toggle-camera').textContent = cameraOn ? '▣' : '⊘';
      toast(cameraOn ? 'Camera on.' : 'Camera off.');
    });
    $('#share-screen')?.addEventListener('click', shareScreen);
  }
  if (currentRoute === 'arcade') bindArcadeEvents();
}
function updateRatherUI(index = ratherIndex % ratherQuestions.length) {
  if (index !== ratherIndex % ratherQuestions.length || currentRoute !== 'arcade') return;
  const counts = ratherTotals[index] || { a: 0, b: 0 };
  const mine = ratherChoices[index] || '';
  const question = ratherQuestions[index];
  $$('.rather-choice').forEach(choice => {
    const key = choice.dataset.rather;
    choice.classList.toggle('chosen', key === mine);
    choice.lastElementChild.textContent = `${counts[key] || 0} votes`;
  });
  const result = $('#rather-result');
  if (result) result.textContent = mine ? `You picked ${mine === 'a' ? question.a : question.b}. Votes are live across the club. 😌` : 'Vote with your own controversial opinion. Votes update live.';
}

function bindArcadeEvents() {
  $('#tap-start-btn')?.addEventListener('click', () => {
    if (tapTimer) { tapScore += 1; $('#tap-display').textContent = tapScore; return; }
    tapScore = 0; tapStopAt = Date.now() + 5000;
    $('#tap-start-btn').textContent = 'TAP TAP TAP!';
    $('#tap-display').textContent = '0';
    $('#tap-caption').textContent = '5 SECONDS ON THE CLOCK';
    $('#tap-result').textContent = 'Go go go!';
    tapTimer = setInterval(() => {
      const left = Math.max(0, tapStopAt - Date.now());
      $('#tap-progress-fill') && ($('#tap-progress-fill').style.width = `${(1 - left/5000)*100}%`);
      if (left <= 0) {
        clearInterval(tapTimer); tapTimer = null;
        const best = Number(localStorage.getItem(STORAGE.tapBest) || 0);
        const record = Math.max(best, tapScore);
        localStorage.setItem(STORAGE.tapBest, String(record));
        $('#tap-start-btn') && ($('#tap-start-btn').textContent = 'Run it back ↻');
        $('#tap-caption') && ($('#tap-caption').textContent = `PERSONAL BEST: ${record} TAPS`);
        $('#tap-result') && ($('#tap-result').textContent = tapScore > best ? 'NEW HIGH SCORE. Absolute legend. 🏆' : 'Solid sprint. Finger needs chai now. ☕');
        $('#tap-progress-fill') && ($('#tap-progress-fill').style.width = '100%');
      }
    }, 50);
  });
  $('#tap-start-btn')?.addEventListener('pointerdown', event => { if (tapTimer) { /* handled in click for keyboard parity */ } });
  // While the sprint is active, every press should count; the first click started the timer.
  $('#tap-start-btn')?.addEventListener('click', () => {});
  // Use a dedicated tap target so repeated clicks do not restart the clock.
  $('#tap-display')?.addEventListener('click', () => { if (tapTimer) { tapScore += 1; $('#tap-display').textContent = tapScore; } });
  $('#quiz-options')?.addEventListener('click', event => {
    const button = event.target.closest('[data-quiz-answer]');
    if (!button || button.dataset.answered === 'true') return;
    const question = quizQuestions[quizIndex % quizQuestions.length];
    const answer = Number(button.dataset.quizAnswer);
    $$('.quiz-option').forEach(option => { option.disabled = true; if (Number(option.dataset.quizAnswer) === question.correct) option.classList.add('correct'); });
    if (answer === question.correct) { quizScore += 1; $('#quiz-result').textContent = `Correct! ${question.fact} · score ${quizScore}`; }
    else { button.classList.add('wrong'); $('#quiz-result').textContent = `Not quite. ${question.fact} · score ${quizScore}`; }
  });
  $('#next-quiz-btn')?.addEventListener('click', () => { quizIndex = (quizIndex + 1) % quizQuestions.length; renderPage(); });
  $$('.rather-choice').forEach(button => button.addEventListener('click', () => {
    const idx = ratherIndex % ratherQuestions.length;
    const pick = button.dataset.rather;
    if (socket?.connected) {
      socket.emit('arcade:vote', { question: idx, option: pick });
    } else {
      const counts = ratherTotals[idx] || { a: 0, b: 0 };
      const previous = ratherChoices[idx] || '';
      if (previous) counts[previous] = Math.max(0, counts[previous] - 1);
      const next = previous === pick ? '' : pick;
      if (next) counts[next] += 1;
      ratherTotals[idx] = counts;
      if (next) ratherChoices[idx] = next; else delete ratherChoices[idx];
      updateRatherUI(idx);
    }
  }));
  $('#next-rather-btn')?.addEventListener('click', () => { ratherIndex = (ratherIndex + 1) % ratherQuestions.length; renderPage(); });
  $('#word-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const guess = safeText($('#word-answer').value, 12).toLowerCase();
    const correct = wordRounds[wordIndex % wordRounds.length].answer;
    $('#word-result').textContent = guess === correct ? 'Correct! Big brain, small celebration. ✨' : 'Not quite, try again. Hints are friends.';
    if (guess === correct) { $('#word-display').innerHTML = correct.toUpperCase().split('').map(letter=>`<span class="word-letter">${escapeHTML(letter)}</span>`).join(''); $('#word-answer').value = ''; }
  });
  $('#next-word-btn')?.addEventListener('click', () => { wordIndex = (wordIndex + 1) % wordRounds.length; renderPage(); });
}
async function shareScreen() {
  if (!callJoined || !localStream) return toast('Join the call first, then share your screen.');
  if (!navigator.mediaDevices?.getDisplayMedia) return toast('Screen sharing is not supported in this browser.');
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const activeScreenStream = screenStream;
    const track = activeScreenStream.getVideoTracks()[0];
    for (const pc of peerConnections.values()) {
      const sender = pc.getSenders().find(item => item.track?.kind === 'video');
      if (sender) await sender.replaceTrack(track);
    }
    const localVideoTrack = localStream.getVideoTracks()[0];
    track.addEventListener('ended', async () => {
      if (screenStream === activeScreenStream) screenStream = null;
      for (const pc of peerConnections.values()) {
        const sender = pc.getSenders().find(item => item.track?.kind === 'video');
        if (sender && localVideoTrack) await sender.replaceTrack(localVideoTrack);
      }
      renderCallTiles();
    }, { once: true });
    const localTile = $('.call-tile[data-person="local"]', $('#call-tiles'));
    if (localTile) attachStreamVideo(localTile, activeScreenStream, 'local-video');
    toast('You are sharing your screen. Click Stop sharing in the browser bar to end.', 'Screen share');
  } catch (error) { if (error.name !== 'NotAllowedError') toast('Screen sharing did not start.'); }
}
function fileToDataURL(file) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
}
function renderOnlinePresence() {
  const count = Math.max(onlineUsers.length, socket?.connected ? 1 : 0);
  $$('.online-count').forEach(node => { node.textContent = String(count); const small = node.nextElementSibling; if (small) small.textContent = count === 1 ? 'friend online' : 'friends online'; });
  const holder = $('#chat-head-users');
  if (holder) {
    const shown = onlineUsers.slice(0, 3);
    holder.innerHTML = `${shown.map((user, i)=>`<span class="mini-avatar" title="${escapeHTML(user.name)}" style="background:${['var(--coral)','var(--aqua)','var(--purple)'][i%3]}">${escapeHTML(initials(user.name))}</span>`).join('')}${onlineUsers.length>3?`<span class="more-users">+${onlineUsers.length-3}</span>`:''}`;
  }
}
function renderRoomShortcuts() {
  const holder = $('#room-shortcuts');
  if (!holder) return;
  const icons = ['yellow','pink','purple','aqua','coral'];
  holder.innerHTML = rooms.slice(0, 5).map((room, i) => `<button class="room-shortcut" data-room="${escapeHTML(room.id)}"><span class="room-emoji ${icons[i%icons.length]}">${['☻','✿','☾','✦','✳'][i%5]}</span><span><b>${escapeHTML(room.name)}</b><small>${escapeHTML(room.hint || 'open room')}</small></span>${room.id===activeChatRoom?'<i class="online-dot"></i>':''}</button>`).join('');
  $$('[data-room]', holder).forEach(button => button.addEventListener('click', () => { activeChatRoom = button.dataset.room; setRoute('chat'); }));
}

function connectSocketEvents() {
  if (!socket) {
    $('#connection-pill').classList.add('offline');
    $('#connection-pill span').textContent = 'offline mode';
    return;
  }
  socket.on('connect', () => {
    $('#connection-pill').classList.remove('offline');
    $('#connection-pill span').textContent = 'club is live';
    socket.emit('user:hello', { name: nickname });
    socket.emit('rooms:request');
    socket.emit('arcade:request');
    if (currentRoute === 'chat') socket.emit('chat:join', { room: activeChatRoom });
  });
  socket.on('disconnect', () => {
    $('#connection-pill').classList.add('offline');
    $('#connection-pill span').textContent = 'reconnecting…';
  });
  socket.on('presence:update', users => { onlineUsers = Array.isArray(users) ? users : []; renderOnlinePresence(); });
  socket.on('rooms:list', nextRooms => { if (Array.isArray(nextRooms) && nextRooms.length) rooms = nextRooms; renderRoomShortcuts(); if (currentRoute === 'chat') renderPage(); });
  socket.on('memes:history', history => { if (Array.isArray(history) && history.length) memes = history; else if (Array.isArray(history)) memes = [...seedMemes]; if (currentRoute === 'memes') renderMemeCards(); });
  socket.on('meme:new', meme => { if (!memes.some(item => item.id === meme.id)) memes.unshift(meme); if (currentRoute === 'memes') renderMemeCards(); if (currentRoute === 'home') { const count = $('.stats-strip .stat-block:nth-child(2) b'); if (count) count.textContent = String(memes.length); } });
  socket.on('meme:reaction-updated', ({ id, likes }) => { const meme = memes.find(item => item.id === id); if (meme) meme.likes = likes; if (currentRoute === 'memes') renderMemeCards(); });
  socket.on('chat:history', ({ room, messages }) => { chatHistories[room] = Array.isArray(messages) ? messages : []; if (currentRoute === 'chat' && activeChatRoom === room) renderChatMessages(); });
  socket.on('chat:message', message => { (chatHistories[message.room] ||= []).push(message); chatHistories[message.room] = chatHistories[message.room].slice(-100); if (currentRoute === 'chat' && activeChatRoom === message.room) renderChatMessages(); });
  let typingTimeout;
  socket.on('chat:typing', data => {
    if (currentRoute !== 'chat' || data.room !== activeChatRoom) return;
    const indicator = $('#typing-indicator'); if (!indicator) return;
    indicator.hidden = !data.typing;
    indicator.textContent = data.typing ? `${data.name} is typing…` : '';
    clearTimeout(typingTimeout);
    if (data.typing) typingTimeout = setTimeout(() => { if ($('#typing-indicator')) $('#typing-indicator').hidden = true; }, 1300);
  });
  socket.on('arcade:state', ({ totals, myVotes }) => {
    if (Array.isArray(totals)) ratherTotals = ratherQuestions.map((_, i) => totals[i] || { a: 0, b: 0 });
    ratherChoices = {};
    (Array.isArray(myVotes) ? myVotes : []).forEach(([question, choice]) => { if (choice === 'a' || choice === 'b') ratherChoices[Number(question)] = choice; });
    updateRatherUI();
  });
  socket.on('arcade:votes', ({ question, counts }) => {
    const index = Number(question);
    if (index < 0 || index >= ratherQuestions.length || !counts) return;
    ratherTotals[index] = { a: Number(counts.a || 0), b: Number(counts.b || 0) };
    updateRatherUI(index);
  });
  socket.on('arcade:my-vote', ({ question, choice }) => {
    const index = Number(question);
    if (index < 0 || index >= ratherQuestions.length) return;
    if (choice === 'a' || choice === 'b') ratherChoices[index] = choice; else delete ratherChoices[index];
    updateRatherUI(index);
  });
  socket.on('call:peers', ({ room, peers }) => {
    if (!callJoined || room !== callRoom) return;
    (peers || []).forEach(peer => { participantNames.set(peer.id, peer.name); createOfferTo(peer.id, peer.name); });
    renderCallTiles();
  });
  socket.on('call:peer-joined', ({ room, id, name }) => {
    if (!callJoined || room !== callRoom) return;
    participantNames.set(id, name || 'friend'); renderCallTiles(); toast(`${name || 'A friend'} joined the room.`, 'Someone is here');
  });
  socket.on('call:offer', receiveOffer);
  socket.on('call:answer', async ({ from, description }) => {
    const pc = peerConnections.get(from); if (!pc) return;
    try { await pc.setRemoteDescription(description); await flushIce(from, pc); } catch (error) { console.warn('Remote answer failed', error); }
  });
  socket.on('call:ice', async ({ from, candidate }) => {
    const pc = peerConnections.get(from);
    if (!pc || !pc.remoteDescription) { (pendingIce.get(from) || (pendingIce.set(from, []), pendingIce.get(from))).push(candidate); return; }
    try { await pc.addIceCandidate(candidate); } catch (error) { console.debug('ICE candidate skipped', error); }
  });
  socket.on('call:peer-left', ({ id, name }) => { closePeer(id); if (currentRoute === 'calls') renderCallTiles(); if (name) toast(`${name} left the call.`); });
  socket.on('call:error', message => toast(message || 'Could not join this call room.'));
}

// Global navigation and modal bindings.
$$('[data-route]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); setRoute(link.dataset.route); }));
window.addEventListener('hashchange', () => { const next = routeFromHash(); if (next !== currentRoute) { currentRoute = next; if (next !== 'calls' && callJoined) leaveCall(true); renderPage(); } });
$('#profile-button')?.addEventListener('click', () => openModal('profile-modal'));
$('#top-avatar')?.addEventListener('click', () => openModal('profile-modal'));
$('#profile-form')?.addEventListener('submit', event => {
  const submitter = event.submitter;
  if (submitter?.value === 'cancel') return;
  event.preventDefault();
  const next = safeText($('#nickname-input').value, 24);
  if (!next) return toast('Pick a nickname first.');
  nickname = next; localStorage.setItem(STORAGE.name, nickname); syncProfile(); closeModal('profile-modal'); renderPage(); toast(`Welcome back, ${nickname}.`, 'Attendance marked');
});
$('#help-button')?.addEventListener('click', () => openModal('help-modal'));
$('#close-help')?.addEventListener('click', () => closeModal('help-modal'));
$('#got-it-btn')?.addEventListener('click', () => closeModal('help-modal'));
$('#new-room-btn')?.addEventListener('click', () => openModal('room-modal'));
$('#room-form')?.addEventListener('submit', event => {
  const submitter = event.submitter;
  if (submitter?.value === 'cancel') return;
  event.preventDefault();
  const name = safeText($('#room-name-input').value, 28);
  if (!name) return toast('Every classroom needs a name.');
  const id = name.toLowerCase().replace(/[^a-z0-9 -]/g,'').trim().replace(/\s+/g,'-').slice(0,32) || `room-${Date.now()}`;
  if (socket?.connected) socket.emit('room:create', { name, id });
  else if (!rooms.some(room => room.id === id)) rooms.push({ id, name, hint: 'new little corner' });
  activeChatRoom = id;
  $('#room-name-input').value = '';
  closeModal('room-modal');
  renderRoomShortcuts();
  setRoute('chat');
  toast(`Room “${name}” is ready. Invite your people.`, 'New room');
});

syncProfile();
connectSocketEvents();
renderPage();
