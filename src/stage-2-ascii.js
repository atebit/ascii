// Stage 2: What is ASCII? The 95 printable characters orbit as a CSS 3D ring (DOM, so they
// stay readable) over a three.js tunnel drawn by the ASCII pass. Press any key and its
// character flies out of the ring into the tile, and its number and 8 bits count up.
STAGES[2] = (ctx) => {
  const FIRST = 32;
  const LAST = 126;
  const N = LAST - FIRST + 1; // 95
  const TAU = Math.PI * 2;
  const MSG = "IT'S JUST THE CHARACTERS YOUR COMPUTER USES TO WRITE TEXT.";
  const touch = matchMedia('(hover: none) and (pointer: coarse)').matches;
  // The call to action: a big first line and a smaller second line, so it fits at phone width.
  const HINT = touch
    ? ['▸ TAP A CHARACTER ◂', 'OR TAP THE TILE TO TYPE · SEE ITS NUMBER']
    : ['▸ PRESS ANY KEY ◂', 'ON YOUR KEYBOARD TO SEE ITS NUMBER'];
  const HINT_DONE = touch ? ['▸ ALL 95 FOUND ◂', 'TAP NEXT FOR THE NEXT STAGE'] : ['▸ ALL 95 FOUND ◂', 'PRESS → FOR THE NEXT STAGE'];
  const FOOT = '* The block letters and box lines in this game are extended characters, '
    + 'a few steps past the original 128. Same idea.';

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = (p) => 1 - (1 - p) ** 3;
  const easeBack = (p) => 1 + 2.4 * (p - 1) ** 3 + 1.4 * (p - 1) ** 2;
  const show = (ch) => (ch === ' ' ? '␣' : ch);
  function kind(code) {
    if (code === 32) return ['sp', 'SPACE'];
    if (code >= 48 && code <= 57) return ['dig', 'DIGIT'];
    if (code >= 65 && code <= 90) return ['up', 'CAPITAL LETTER'];
    if (code >= 97 && code <= 122) return ['low', 'SMALL LETTER'];
    if (code < 128) return ['sym', 'SYMBOL'];
    return ['ext', 'EXTENDED CHARACTER'];
  }

  // ---------- CSS ----------
  if (!document.getElementById('s2-style')) {
    const style = el('style');
    style.id = 's2-style';
    style.textContent = `
.layer-2 { overflow: hidden; user-select: none; -webkit-user-select: none; touch-action: manipulation; }
.layer-2 .s2-orbit { position: absolute; left: 0; top: 0; width: 0; height: 0; }
.layer-2 .s2-ch { position: absolute; left: 0; top: 0; width: 1em; height: 1.2em; margin: -0.6em 0 0 -0.5em;
  text-align: center; font: 700 var(--rfs)/1.2em var(--mono); will-change: transform, opacity; pointer-events: none;
  text-shadow: 0 0 6px currentColor; z-index: 1; opacity: 0; }
.layer-2 .s2-ch.hi { color: #fff; text-shadow: 0 0 6px #fff, 0 0 14px var(--gold), 0 0 28px var(--hot); }
.layer-2 .s2-ch.t { text-shadow: 0 0 8px currentColor, 0 0 18px currentColor; }
.layer-2 .k-up { color: var(--cyan); } .layer-2 .k-low { color: var(--hot); }
.layer-2 .k-dig { color: var(--gold); } .layer-2 .k-sym { color: var(--orange); }
.layer-2 .k-sp { color: var(--violet); } .layer-2 .k-ext { color: var(--ink); }
.layer-2 .s2-tile { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); z-index: 2; cursor: pointer; }
.layer-2 .s2-tilebox { position: relative; }
.layer-2.go .s2-tilebox { animation: s2-pop .7s .3s both cubic-bezier(.2, 1.5, .4, 1); }
.layer-2 .s2-frame { margin: 0; font: 700 var(--tf)/1.02 var(--mono); color: var(--cyan);
  text-shadow: 0 0 6px var(--cyan), 0 0 18px #4be3f088; animation: s2-breathe 2.6s ease-in-out infinite; }
.layer-2 .s2-tile.hit .s2-frame { color: #fff; text-shadow: 0 0 8px #fff, 0 0 24px var(--gold); animation: none; }
.layer-2 .s2-glyph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font: 700 calc(var(--tf) * 3.1)/1 var(--mono); text-shadow: 0 0 10px currentColor, 0 0 30px currentColor; }
.layer-2 .s2-tile.hit .s2-glyph { animation: s2-punch .35s cubic-bezier(.2, 1.8, .4, 1); }
.layer-2 .s2-read { position: absolute; left: 0; top: 0; z-index: 2; display: grid; grid-template-columns: repeat(4, auto);
  align-items: baseline; column-gap: .8em; row-gap: .9em; font: var(--rf)/1 var(--arcade); white-space: nowrap;
  text-shadow: 0 0 4px #000, 0 0 10px #000; }
.layer-2.go .s2-read { animation: s2-fade .6s .7s both; }
.layer-2 .s2-kind { grid-column: 1 / -1; font-size: max(8px, calc(var(--rf) * .55)); letter-spacing: .12em; }
.layer-2 .s2-arrow, .layer-2 .s2-dot { color: var(--dim); font-family: var(--mono); font-size: calc(var(--rf) * 1.3); }
.layer-2 .s2-num { color: var(--ink); min-width: 3em; text-align: right; text-shadow: 0 0 10px var(--hot); }
.layer-2 .s2-bits b { font-weight: normal; color: #5a5466; }
.layer-2 .s2-bits b.one { color: var(--gold); text-shadow: 0 0 8px var(--gold); }
.layer-2 .s2-bits.ext { color: var(--hot); font-size: calc(var(--rf) * .7); text-shadow: 0 0 8px var(--hot); }
.layer-2 .s2-lab { color: var(--dim); font-size: max(7px, calc(var(--rf) * .5)); letter-spacing: .12em; }
.layer-2 .s2-lab.r { text-align: right; }
.layer-2 .s2-fly { position: absolute; width: 1em; height: 1.2em; margin: -0.6em 0 0 -0.5em; text-align: center;
  font: 700 var(--gfs)/1.2em var(--mono); z-index: 5; pointer-events: none; will-change: transform, opacity;
  text-shadow: 0 0 10px currentColor, 0 0 26px currentColor; }
.layer-2 .s2-copy { position: absolute; left: 16px; right: 16px; bottom: 64px; z-index: 4; display: flex;
  flex-direction: column; align-items: center; gap: var(--cg); text-align: center; pointer-events: none;
  text-shadow: 0 0 4px #000, 0 0 12px #000; }
.layer-2 .s2-msg { font: var(--mf)/1.7 var(--arcade); color: var(--ink); max-width: 46em; }
.layer-2 .s2-msg .w { color: var(--gold); text-shadow: 0 0 10px var(--gold); }
.layer-2 .s2-msg .rest { color: transparent; text-shadow: none; }
.layer-2 .s2-msg .cur { color: var(--hot); }
.layer-2 .s2-fact { position: relative; font: var(--ff)/1.6 var(--arcade); color: var(--cyan); pointer-events: auto; cursor: help;
  text-shadow: 0 0 8px #4be3f088, 0 0 4px #000; }
.layer-2.go .s2-fact { animation: s2-fade .6s 2.6s both; }
.layer-2 .s2-fact .star { color: var(--gold); }
.layer-2 .s2-foot { position: absolute; left: 50%; bottom: calc(100% + var(--cg)); width: min(34em, calc(100vw - 32px));
  transform: translateX(-50%); font: 12px/1.5 var(--mono); color: var(--ink); opacity: 0; transition: opacity .2s;
  pointer-events: none; }
.layer-2 .s2-copy.foot .s2-foot { opacity: 1; }
.layer-2 .s2-hint { display: flex; flex-direction: column; align-items: center; gap: .55em; color: var(--gold);
  font-family: var(--arcade); font-size: min(clamp(18px, 3vw, 36px), calc((100vw - 32px) / 21)); }
.layer-2.go .s2-hint { animation: s2-fade .6s 1.6s both; }
.layer-2 .s2-hint .h1 { display: block; line-height: 1.2; white-space: nowrap; letter-spacing: .04em;
  text-shadow: 0 0 6px #ffc53d, 0 0 18px #ffc53d99, 0 0 36px #ff8a3d66, 0 0 4px #000; will-change: transform; }
.layer-2.go:not(.calm) .s2-hint .h1 { animation: s2-call 1.2s 2.2s ease-in-out infinite; }
.layer-2 .s2-hint .h2 { display: block; font-size: max(8px, .4em); line-height: 1.6; color: var(--cyan);
  text-shadow: 0 0 8px #4be3f088, 0 0 4px #000; }
@keyframes s2-call { 0%, 100% { transform: scale(1); color: var(--gold); }
  50% { transform: scale(1.07); color: #fff2c4; } 52% { opacity: .6; } 56% { opacity: 1; } }
.layer-2 .s2-copy.foot .s2-msg { visibility: hidden; }
.layer-2 .s2-input { position: absolute; left: 50%; top: 50%; width: 1px; height: 1px; opacity: 0; border: 0; padding: 0;
  font-size: 16px; pointer-events: none; }
@keyframes s2-pop { from { transform: scale(0) rotate(-20deg); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes s2-punch { 0% { transform: scale(1.5); } 100% { transform: none; } }
@keyframes s2-breathe { 50% { opacity: .7; } }
@keyframes s2-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes s2-blink { 0%, 100% { opacity: 1; } 55% { opacity: .25; } }
`;
    document.head.appendChild(style);
  }

  // ---------- DOM ----------
  const root = ctx.layer;
  root.innerHTML = '';
  const orbit = el('div', 's2-orbit');
  const ring = [];
  for (let i = 0; i < N; i++) {
    const code = FIRST + i;
    const ch = String.fromCharCode(code);
    const e = el('span', `s2-ch k-${kind(code)[0]}`);
    e.textContent = show(ch);
    orbit.appendChild(e);
    ring.push({ el: e, code, ch, base: (i / N) * TAU, front: null, hi: false, gone: -9, d: 0 });
  }
  const tile = el('div', 's2-tile');
  const tileBox = el('div', 's2-tilebox');
  const frame = el('pre', 's2-frame');
  frame.textContent = ['╔═════════╗', '║         ║', '║         ║', '║         ║', '╚═════════╝'].join('\n');
  const glyph = el('div', 's2-glyph k-up');
  tileBox.append(frame, glyph);
  tile.appendChild(tileBox);
  const read = el('div', 's2-read');
  const kindEl = el('span', 's2-kind k-up');
  const arrow = el('span', 's2-arrow', '◂');
  const numEl = el('span', 's2-num');
  const dot = el('span', 's2-dot', '·');
  const bitsEl = el('span', 's2-bits');
  const numLab = el('span', 's2-lab r', 'NUMBER');
  const bitsLab = el('span', 's2-lab', '8 BITS');
  read.append(kindEl, arrow, numEl, dot, bitsEl, el('span'), numLab, el('span'), bitsLab);
  orbit.append(tile, read);

  const copy = el('div', 's2-copy');
  const msg = el('div', 's2-msg');
  const fact = el('div', 's2-fact');
  fact.innerHTML = '128 CODES · 95 YOU CAN SEE · SINCE 1963 <span class="star">*</span>';
  const foot = el('div', 's2-foot');
  foot.textContent = FOOT;
  fact.appendChild(foot);
  const hint = el('div', 's2-hint');
  const hint1 = el('span', 'h1');
  const hint2 = el('span', 'h2');
  hint.append(hint1, hint2);
  const setHint = ([a, b]) => { hint1.textContent = a; hint2.textContent = b; };
  setHint(HINT);
  copy.append(msg, fact, hint);

  const input = el('input', 's2-input');
  input.type = 'text';
  input.setAttribute('aria-label', 'Type a character');
  for (const [k, v] of [['autocapitalize', 'off'], ['autocomplete', 'off'], ['autocorrect', 'off'], ['spellcheck', 'false']]) input.setAttribute(k, v);
  root.append(orbit, copy, input);

  // ---------- three.js background: star field and an octagon tunnel ----------
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 10, 110);
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 400);
  const STAR_DEPTH = 240;
  const stars = makeStars({ count: 1400, spread: 200, depth: STAR_DEPTH });
  scene.add(stars);
  const starPos = stars.geometry.attributes.position;
  const tunnel = new THREE.Group();
  scene.add(tunnel);
  const T_N = 12;
  const T_GAP = 13;
  const T_DEPTH = T_N * T_GAP;
  const T_R = 26;
  const ringGeo = new THREE.TorusGeometry(T_R, 0.45, 4, 8);
  const ringCols = [PALETTE.hot, PALETTE.violet, PALETTE.cyan, PALETTE.violet];
  const rings = [];
  for (let i = 0; i < T_N; i++) {
    const base = new THREE.Color(ringCols[i % ringCols.length]);
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: base.clone() }));
    m.position.z = -4 - i * T_GAP;
    m.userData.base = base;
    rings.push(m);
    tunnel.add(m);
  }
  const strutGeo = new THREE.BoxGeometry(0.35, 0.35, T_DEPTH);
  const strutMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.violet).multiplyScalar(0.22) });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    const s = new THREE.Mesh(strutGeo, strutMat);
    s.position.set(Math.cos(a) * T_R, Math.sin(a) * T_R, -T_DEPTH / 2 + 4);
    tunnel.add(s);
  }

  // ---------- state ----------
  const tried = new Set();
  let R = 300, P = 1200, tilt0 = 18, fs = 20, side = true;
  let spin = 0, kick = 0, pulse = 0, tNow = 0, dirty = true;
  let userPressed = false, nextDemo = 2, typed = -1, done = false;
  let cur = null; // { code, t0 }
  let shownV = -1;
  const flights = [];

  function setGlyph(ch, code) {
    const [k, label] = kind(code);
    glyph.className = `s2-glyph k-${k}`;
    glyph.textContent = show(ch);
    kindEl.className = `s2-kind k-${k}`;
    kindEl.textContent = label;
    const ext = code > 127;
    bitsEl.classList.toggle('ext', ext);
    bitsLab.textContent = ext ? 'PAST 127' : '8 BITS';
    cur = { code, t0: tNow };
    shownV = -1;
  }

  function drawNum(v) {
    numEl.textContent = String(v);
    if (cur.code > 127) { bitsEl.textContent = 'NOT ASCII'; return; }
    const b = v.toString(2).padStart(8, '0');
    let h = '';
    for (const c of b) h += c === '1' ? '<b class="one">1</b>' : '<b>0</b>';
    bitsEl.innerHTML = h;
  }

  function layout() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const small = W < 700;
    const s = root.style;
    s.setProperty('--tf', `${small ? 15 : 18}px`);
    s.setProperty('--rf', `${small ? 12 : 16}px`);
    s.setProperty('--mf', `${small ? 9 : W < 1100 ? 12 : 14}px`);
    s.setProperty('--ff', `${small ? 8 : 10}px`);
    s.setProperty('--cg', `${small ? 14 : 20}px`);
    const bottomPad = small ? 82 : 84;
    copy.style.bottom = `${bottomPad}px`;
    const top = small ? 40 : 54;
    const tileW = tileBox.offsetWidth;
    const tileH = tileBox.offsetHeight;
    const readW = read.offsetWidth;
    const readH = read.offsetHeight;
    root.style.setProperty('--gfs', `${glyph.getBoundingClientRect().height ? parseFloat(getComputedStyle(glyph).fontSize) : 50}px`);
    let bottom = H - bottomPad - copy.offsetHeight - (small ? 14 : 24);
    R = Math.min(W * (small ? 0.44 : 0.38), 480);
    side = R - tileW / 2 - 28 >= readW;
    const below = side ? 0 : readH + 18;
    let front, back;
    for (let guard = 0; guard < 30; guard++) {
      fs = clamp((R * TAU) / N * 0.95, 12, 28);
      P = R * 4;
      tilt0 = clamp((Math.asin(clamp((tileH / 2 + fs * 0.9) / R, 0, 0.9)) * 180) / Math.PI, 12, 30);
      // Tall, narrow screens have room to spare: open the ring up so it reads as 3D.
      if (H / W > 1.4) tilt0 = Math.max(tilt0, 26);
      const st = Math.sin(((tilt0 + 5) * Math.PI) / 180);
      front = R * st * (P / (P - R)) + fs;
      back = Math.max(R * st * (P / (P + R)) + fs, tileH / 2 + 4);
      if (front + back + below <= bottom - top || R < 110) break;
      R *= 0.93;
    }
    s.setProperty('--rfs', `${fs}px`);
    const cy = Math.round((top + back + bottom - front - below) / 2);
    orbit.style.left = `${Math.round(W / 2)}px`;
    orbit.style.top = `${cy}px`;
    if (side) {
      arrow.textContent = '◂';
      read.style.left = `${Math.round(tileW / 2 + 24)}px`;
      read.style.top = `${Math.round(-readH / 2 + 4)}px`;
    } else {
      arrow.textContent = '▴';
      read.style.left = `${Math.round(-readW / 2)}px`;
      read.style.top = `${Math.round(front + 14)}px`;
    }
    dirty = false;
  }

  function fly(ch, code, from, onLand) {
    const to = glyph.getBoundingClientRect();
    const box = root.getBoundingClientRect();
    const tx = to.left + to.width / 2 - box.left;
    const ty = to.top + to.height / 2 - box.top;
    const fx = from.left + from.width / 2 - box.left;
    const fy = from.top + from.height / 2 - box.top;
    const gfs = parseFloat(getComputedStyle(glyph).fontSize) || 50;
    const s0 = clamp(from.height / (gfs * 1.2), 0.08, 1);
    const dx = fx - tx;
    const dy = fy - ty;
    const lift = 50 + Math.abs(dx) * 0.2;
    const frames = [
      { transform: `translate(${dx}px,${dy}px) scale(${s0})` },
      { transform: `translate(${dx * 0.4}px,${dy * 0.4 - lift}px) scale(${0.9}) rotate(${dx > 0 ? 14 : -14}deg)`, offset: 0.5 },
      { transform: 'translate(0,0) scale(1)' },
    ];
    const opts = { duration: 560, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'both' };
    const cls = `s2-fly k-${kind(code)[0]}`;
    [0.4, 0.22, 0.1].forEach((op, j) => {
      const g = el('span', cls);
      g.textContent = show(ch);
      Object.assign(g.style, { left: `${tx}px`, top: `${ty}px`, opacity: op });
      root.appendChild(g);
      const a = g.animate(frames, { ...opts, delay: 40 * (j + 1) });
      a.onfinish = () => g.remove();
      flights.push({ el: g, anim: a });
    });
    const f = el('span', cls);
    f.textContent = show(ch);
    Object.assign(f.style, { left: `${tx}px`, top: `${ty}px` });
    root.appendChild(f);
    const a = f.animate(frames, opts);
    a.onfinish = () => { f.remove(); onLand(); };
    flights.push({ el: f, anim: a });
    while (flights.length && !flights[0].el.isConnected) flights.shift();
  }

  function clearFlights() {
    for (const f of flights) { f.anim.onfinish = null; f.anim.cancel(); f.el.remove(); }
    flights.length = 0;
  }

  function land(ch, code, user) {
    setGlyph(ch, code);
    tile.classList.remove('hit');
    void tile.offsetWidth;
    tile.classList.add('hit');
    clearTimeout(land.timer);
    land.timer = setTimeout(() => tile.classList.remove('hit'), 260);
    ctx.sfx('blip');
    if (user && code >= FIRST && code <= LAST && !tried.has(code)) {
      tried.add(code);
      ctx.score.chars = tried.size;
      ring[code - FIRST].el.classList.add('t');
      if (tried.size === N && !done) {
        done = true;
        setHint(HINT_DONE);
        ctx.sfx('coin');
      }
    }
  }

  function press(ch, user = true) {
    const code = ch.codePointAt(0);
    if (user && !userPressed) { userPressed = true; root.classList.add('calm'); }
    let from;
    if (code >= FIRST && code <= LAST) {
      const c = ring[code - FIRST];
      from = c.el.getBoundingClientRect();
      if (from.width === 0) from = { left: window.innerWidth / 2, top: 0, width: 20, height: 24 };
      c.gone = tNow;
    } else {
      from = { left: window.innerWidth / 2 - 20, top: window.innerHeight + 20, width: 40, height: 48 };
    }
    ctx.sfx('type');
    kick += 1.4;
    pulse = 1;
    fly(ch, code, from, () => land(ch, code, user));
  }

  function pickAt(x, y) {
    let best = null;
    let bd = 36 * 36;
    for (const c of ring) {
      if (c.d < -0.35) continue;
      const r = c.el.getBoundingClientRect();
      const dx = r.left + r.width / 2 - x;
      const dy = r.top + r.height / 2 - y;
      const dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = c; }
    }
    return best;
  }

  // ---------- input ----------
  root.addEventListener('pointerdown', (e) => {
    if (fact.contains(e.target)) {
      if (e.pointerType !== 'mouse') copy.classList.toggle('foot');
      return;
    }
    copy.classList.remove('foot');
    if (tile.contains(e.target)) {
      if (touch) input.focus({ preventScroll: true });
      return;
    }
    const c = pickAt(e.clientX, e.clientY);
    if (c) press(c.ch);
  });
  fact.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') copy.classList.add('foot'); });
  fact.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') copy.classList.remove('foot'); });
  input.addEventListener('input', () => {
    const v = [...input.value];
    input.value = '';
    if (v.length) press(v[v.length - 1]);
  });
  window.addEventListener('resize', () => { dirty = true; });
  if (document.fonts?.ready) document.fonts.ready.then(() => { dirty = true; });

  function typeMsg(n) {
    if (n === typed) return;
    typed = n;
    const word = 'CHARACTERS';
    const w0 = MSG.indexOf(word);
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const vis = MSG.slice(0, n);
    let h;
    if (n > w0) {
      const w1 = Math.min(n, w0 + word.length);
      h = esc(vis.slice(0, w0)) + `<span class="w">${esc(vis.slice(w0, w1))}</span>` + esc(vis.slice(w1));
    } else h = esc(vis);
    if (n < MSG.length) h += `<span class="cur">█</span><span class="rest">${esc(MSG.slice(n + 1))}</span>`;
    msg.innerHTML = h;
  }

  return {
    scene,
    camera,
    enter() {
      ctx.setAscii({ fill: 0.15, edges: false });
      clearFlights();
      copy.classList.remove('foot');
      root.classList.remove('go');
      void root.offsetWidth;
      root.classList.add('go');
      spin = -0.9;
      kick = 0;
      pulse = 0.6;
      typed = -1;
      typeMsg(0);
      nextDemo = 2;
      userPressed = false;
      root.classList.remove('calm');
      for (const c of ring) { c.gone = -9; c.front = null; c.hi = false; c.el.classList.remove('hi'); c.el.style.opacity = 0; }
      setGlyph('A', 65);
      cur.t0 = 0.4;
      dirty = true;
      layout();
    },
    exit() {
      input.blur();
      clearFlights();
    },
    update(t, dt) {
      tNow = t;
      if (dirty) layout();

      // Ring: spin fast on entry, then settle into a slow drift; key presses kick it.
      kick *= Math.exp(-dt * 2.5);
      spin -= dt * (0.12 + 2.6 * Math.exp(-t * 1.6) + kick);
      const tilt = tilt0 + 5 * Math.sin(t * 0.35);
      const wob = 4 * Math.sin(t * 0.23);
      const grow = 0.35 + 0.65 * easeOut(clamp(t / 1.3));
      const r = R * grow;
      const pre = `perspective(${P.toFixed(0)}px) rotateZ(${wob.toFixed(2)}deg) rotateX(${(-tilt).toFixed(2)}deg) rotateY(`;
      const post = `rotateX(${tilt.toFixed(2)}deg) rotateZ(${(-wob).toFixed(2)}deg) scale(`;
      for (let i = 0; i < N; i++) {
        const c = ring[i];
        const th = c.base + spin;
        const d = Math.cos(th);
        c.d = d;
        const intro = clamp((t - 0.1 - i * 0.012) / 0.4);
        const back = c.gone < 0 ? 1 : clamp((t - c.gone - 0.8) / 0.5);
        const f = clamp((d - 0.86) / 0.14);
        const sc = (intro < 1 ? easeBack(intro) : 1) * (1 + 0.7 * f) * (0.5 + 0.5 * back);
        const op = (0.14 + 0.86 * ((d + 1) / 2) ** 2.2) * (c.el.classList.contains('t') ? 1 : 0.82) * Math.min(1, intro * 2) * back;
        const a = th.toFixed(4);
        c.el.style.transform = `${pre}${a}rad) translateZ(${r.toFixed(1)}px) rotateY(${-a}rad) ${post}${sc.toFixed(3)})`;
        c.el.style.opacity = op.toFixed(3);
        const front = d >= 0;
        if (front !== c.front) { c.front = front; c.el.style.zIndex = front ? 3 : 1; }
        const hi = f > 0.35 && back > 0.9;
        if (hi !== c.hi) { c.hi = hi; c.el.classList.toggle('hi', hi); }
      }

      // Tile readout counts up from 0 to the code.
      if (cur) {
        const p = clamp((t - cur.t0) / 0.75);
        const v = Math.round(cur.code * easeOut(p));
        if (v !== shownV) { shownV = v; drawNum(v); }
      }

      // Copy types in, then a demo character flies in until the player presses a key.
      typeMsg(Math.floor(clamp((t - 0.9) * 34, 0, MSG.length)));
      if (!userPressed && t >= nextDemo) {
        nextDemo = t + 4.5;
        const pool = 'AaZz09?@#&{}~';
        const ch = t < 3 ? 'A' : pool[Math.floor(Math.random() * pool.length)];
        press(ch, false);
      }

      // Background: stars stream past, the tunnel rushes forward and flares on each key.
      pulse *= Math.exp(-dt * 2.2);
      const speed = 7 + 45 * pulse;
      const arr = starPos.array;
      for (let i = 2; i < arr.length; i += 3) {
        arr[i] += speed * 1.6 * dt;
        if (arr[i] > 1) arr[i] -= STAR_DEPTH;
      }
      starPos.needsUpdate = true;
      const glow = 0.2 + 0.8 * pulse;
      for (const m of rings) {
        m.position.z += speed * dt;
        if (m.position.z > 2) m.position.z -= T_DEPTH;
        m.material.color.copy(m.userData.base).multiplyScalar(glow);
      }
      tunnel.rotation.z = t * 0.06;
      camera.position.set(Math.sin(t * 0.21) * 1.6, Math.cos(t * 0.17) * 1.1, 0);
      camera.rotation.z = Math.sin(t * 0.3) * 0.05;
    },
    onKey(e) {
      if (e.key.length !== 1) return false;
      if (!e.repeat) press(e.key);
      return true;
    },
    hud: () => ({ tl: 'STAGE 02 · WHAT IS ASCII?', tr: `CHARS ${String(tried.size).padStart(6, '0')}` }),
  };
};
