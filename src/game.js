// Boot: one renderer and one ASCII pass; the active stage's scene renders through it.
const canvas = document.getElementById('screen');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const ascii = new AsciiPass(renderer, { ...ASCII_DEFAULTS });
const layers = document.getElementById('layers');
const hudEls = {
  tl: document.getElementById('hud-tl'),
  tr: document.getElementById('hud-tr'),
  bl: document.getElementById('hud-bl'),
  br: document.getElementById('hud-br'),
};
const hudSound = document.getElementById('hud-sound');
const hudDots = document.getElementById('hud-dots');
for (const r of document.querySelectorAll('.hud .rule')) r.textContent = '═'.repeat(160);

const game = { current: 0, t: 0, score: { chars: 0 }, fps: 60 };
const SHELL_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setAscii(opts = {}) {
  const o = { ...ASCII_DEFAULTS, ...opts };
  ascii.mode = o.mode;
  ascii.fill = o.fill;
  ascii.edges = o.edges;
  ascii.ridges = o.ridges;
  if (ascii.cell !== o.cell) {
    ascii.cell = o.cell;
    resize();
  }
}

const ctxBase = {
  renderer,
  ascii,
  setAscii,
  sfx: (name) => SFX.play(name),
  go: (n) => go(n),
  next: () => go(Math.min(targetStage() + 1, STAGE_COUNT)),
  back: () => go(Math.max(targetStage() - 1, 1)),
  score: game.score,
  fps: () => game.fps,
};

const stages = [];
for (let n = 1; n <= STAGE_COUNT; n++) {
  const layer = el('section', `layer layer-${n}`);
  layers.appendChild(layer);
  const stage = STAGES[n]({ ...ctxBase, layer });
  stage.layer = layer;
  stages[n] = stage;
}

// Stage shellDots in the bottom bar: one per stage, click to jump.
const shellDots = [];
for (let n = 1; n <= STAGE_COUNT; n++) {
  const b = el('button');
  b.type = 'button';
  b.textContent = '○';
  b.setAttribute('aria-label', `Stage ${n}`);
  b.addEventListener('click', (e) => { e.stopPropagation(); go(n); });
  hudDots.appendChild(b);
  shellDots[n] = b;
}
function drawDots(n) {
  for (let i = 1; i <= STAGE_COUNT; i++) {
    shellDots[i].textContent = i === n ? '●' : '○';
    shellDots[i].classList.toggle('on', i === n);
    if (i === n) shellDots[i].setAttribute('aria-current', 'step');
    else shellDots[i].removeAttribute('aria-current');
  }
}

// ---- Warp: streaking stars between stages, drawn through the ASCII pass as | / - \ ----
const shellWarp = (() => {
  const N = 420;
  const DEPTH = 260;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 400);
  const pos = new Float32Array(N * 6);
  const col = new Float32Array(N * 6);
  const star = [];
  const palette = [PALETTE.ink, PALETTE.cyan, PALETTE.hot, PALETTE.gold, PALETTE.ink, PALETTE.violet];
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 3 + Math.pow(Math.random(), 0.7) * 45;
    c.set(palette[i % palette.length]);
    star.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, z: -Math.random() * DEPTH, r: c.r, g: c.g, b: c.b });
  }
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  const colAttr = new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('color', colAttr);
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, depthWrite: false }));
  lines.frustumCulled = false;
  scene.add(lines);

  function update(dt, speed) {
    const trail = Math.min(4 + speed * 0.11, 70);
    for (let i = 0; i < N; i++) {
      const s = star[i];
      s.z += speed * dt;
      if (s.z > -1) s.z -= DEPTH;
      const near = 1 - Math.min(-s.z / DEPTH, 1);
      const k = 0.35 + 0.65 * near;
      pos.set([s.x, s.y, s.z, s.x, s.y, s.z - trail], i * 6);
      col.set([s.r * k, s.g * k, s.b * k, 0, 0, 0], i * 6);
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    camera.rotation.z += dt * 0.6;
  }
  return { scene, camera, update };
})();

// ---- Transitions ----
// Phases of one transition, as a share of SHELL_TRANS_MS:
//   0 .. SHELL_SWAP     outgoing stage keeps running; its text, the HUD and the screen scramble out
//   SHELL_SWAP .. SHELL_ENTER  warp star field flies past
//   SHELL_ENTER .. 1    incoming stage is entered and running; its text and the screen resolve
const SHELL_TRANS_MS = 720;
const SHELL_SWAP = 0.24;
const SHELL_ENTER = 0.68;
let shellTrans = null;
let shellPending = 0;

function targetStage() { return shellTrans ? (shellPending || shellTrans.to) : game.current; }

// Scramble every text node under root. Remembers each node's real text; if the stage writes
// new text mid-transition, that becomes the real text.
const scrambleState = new WeakMap();
function scrambleLayer(root, amount, seed) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let i = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.nodeValue.trim() || node.parentElement?.closest('[data-no-scramble], style, script')) continue;
    let st = scrambleState.get(node);
    if (!st || node.nodeValue !== st.last) {
      st = { real: node.nodeValue, last: '' };
      scrambleState.set(node, st);
    }
    st.last = scrambleText(st.real, amount, seed + i++ * 0.37);
    if (node.nodeValue !== st.last) node.nodeValue = st.last;
  }
}
function restoreLayer(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const st = scrambleState.get(node);
    if (st && node.nodeValue === st.last) node.nodeValue = st.real;
    scrambleState.delete(node);
  }
}

function shellActivate(n) {
  game.current = n;
  game.t = 0;
  const to = stages[n];
  setAscii();
  to.layer.classList.add('on');
  document.body.dataset.stage = n;
  to.enter?.();
  resize();
  if (location.hash !== `#${n}`) history.replaceState(null, '', `#${n}`);
}

function shellDeactivate(n) {
  const from = stages[n];
  from.exit?.();
  from.layer.classList.remove('on');
}

function go(n) {
  n = +n;
  if (!stages[n]) return;
  if (shellTrans) { shellPending = n === shellTrans.to ? 0 : n; return; }
  if (n === game.current) return;
  drawDots(n);
  MUSIC.stage(n);
  if (!game.current || SHELL_REDUCED_MOTION) {
    if (game.current) {
      SFX.play(n > game.current ? 'next' : 'back');
      shellDeactivate(game.current);
    }
    shellActivate(n);
    return;
  }
  SFX.play(n > game.current ? 'next' : 'back');
  setTimeout(() => SFX.play('warp'), 150);
  shellTrans = { from: game.current, to: n, start: performance.now(), swapped: false, entered: false, seed: Math.random() * 100,
    fromHud: hudFor(game.current) };
}

function stepTransition(now, dt) {
  const p = Math.min((now - shellTrans.start) / SHELL_TRANS_MS, 1);
  const from = stages[shellTrans.from];
  const to = stages[shellTrans.to];
  ascii.seed = Math.floor(now / 50) % 97;

  if (!shellTrans.swapped && p >= SHELL_SWAP) {
    restoreLayer(from.layer);
    shellDeactivate(shellTrans.from);
    shellTrans.swapped = true;
    setAscii({ edges: false, ridges: true, fill: 0.15 });
  }
  if (!shellTrans.entered && p >= SHELL_ENTER) {
    shellActivate(shellTrans.to);
    shellTrans.entered = true;
  }

  let hud;
  if (!shellTrans.swapped) {
    const q = p / SHELL_SWAP;
    from.update?.(game.t, dt);
    scrambleLayer(from.layer, q, shellTrans.seed);
    ascii.scramble = q * 0.8;
    hud = scrambleHud(shellTrans.fromHud, q);
    ascii.render(from.scene, from.camera);
  } else if (!shellTrans.entered) {
    const q = (p - SHELL_SWAP) / (SHELL_ENTER - SHELL_SWAP);
    shellWarp.update(dt, 30 + 520 * Math.sin(Math.PI * q) ** 2);
    ascii.scramble = Math.max(0, 0.8 - q * 3) * 0.8;
    hud = scrambleHud(q < 0.5 ? shellTrans.fromHud : hudFor(shellTrans.to, true), 1);
    ascii.render(shellWarp.scene, shellWarp.camera);
  } else {
    const q = (p - SHELL_ENTER) / (1 - SHELL_ENTER);
    to.update?.(game.t, dt);
    scrambleLayer(to.layer, 1 - q, shellTrans.seed + 7);
    ascii.scramble = (1 - q) * 0.6;
    hud = scrambleHud(hudFor(shellTrans.to), 1 - q);
    ascii.render(to.scene, to.camera);
  }
  writeHud(hud);

  if (p >= 1) {
    restoreLayer(to.layer);
    ascii.scramble = 0;
    shellTrans = null;
    const next = shellPending;
    shellPending = 0;
    if (next && next !== game.current) go(next);
  }
}

// ---- HUD ----
function defaultHud(n) {
  const s = String(n).padStart(2, '0');
  return { tl: `STAGE ${s}`, tr: '', bl: n > 1 ? '◂ BACK' : '', br: n < STAGE_COUNT ? 'NEXT ▸' : '' };
}
function hudFor(n, defaultsOnly = false) {
  const stage = stages[n];
  return { ...defaultHud(n), ...(!defaultsOnly && stage.hud?.() || {}) };
}
function scrambleHud(hud, amount) {
  const out = {};
  for (const k of Object.keys(hudEls)) out[k] = scrambleText(hud[k] || '', amount, k.charCodeAt(0) + k.charCodeAt(1));
  return out;
}
function writeHud(hud) {
  for (const k of Object.keys(hudEls)) if (hudEls[k].textContent !== hud[k]) hudEls[k].textContent = hud[k];
  const snd = `[M] SOUND + MUSIC ${SFX.on ? 'ON' : 'OFF'}`;
  if (hudSound.textContent !== snd) hudSound.textContent = snd;
}

hudEls.bl.addEventListener('click', (e) => { e.stopPropagation(); ctxBase.back(); });
hudEls.br.addEventListener('click', (e) => { e.stopPropagation(); ctxBase.next(); });
hudSound.addEventListener('click', (e) => { e.stopPropagation(); SFX.toggle(); });

// ---- Input ----
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  // Stages only see keys while they're settled; during a transition the shell queues moves.
  if (!shellTrans && stages[game.current].onKey?.(e)) { e.preventDefault(); return; }
  const k = e.key;
  if (k === 'ArrowRight' || k === ' ' || k === 'Enter' || k === 'PageDown') ctxBase.next();
  else if (k === 'ArrowLeft' || k === 'PageUp') ctxBase.back();
  else if (k === 'Escape') go(1);
  else if (k >= '1' && k <= String(STAGE_COUNT)) go(+k);
  else if (k === 'm' || k === 'M') SFX.toggle();
  else return;
  e.preventDefault();
});

// Swipe left for next, right for back. Stages that drag horizontally set swipe: false.
let shellTouch = null;
window.addEventListener('touchstart', (e) => {
  const t0 = e.touches[0];
  shellTouch = e.touches.length === 1 && !e.target.closest?.('[data-no-swipe]')
    ? { x: t0.clientX, y: t0.clientY, at: performance.now() } : null;
}, { passive: true });
window.addEventListener('touchend', (e) => {
  if (!shellTouch || stages[game.current]?.swipe === false) { shellTouch = null; return; }
  const t1 = e.changedTouches[0];
  const dx = t1.clientX - shellTouch.x;
  const dy = t1.clientY - shellTouch.y;
  const quick = performance.now() - shellTouch.at < 700;
  shellTouch = null;
  if (!quick || Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  if (dx < 0) ctxBase.next();
  else ctxBase.back();
}, { passive: true });

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  ascii.setSize(w, h);
  for (const cam of [...stages.map((s) => s?.camera), shellWarp.camera]) {
    if (!cam?.isPerspectiveCamera) continue;
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
}
window.addEventListener('resize', resize);
window.addEventListener('hashchange', () => go(+location.hash.slice(1) || 1));

go(+location.hash.slice(1) || 1);

let last = performance.now();
function frame(now) {
  const raw = (now - last) / 1000;
  const dt = Math.min(raw, 0.05);
  last = now;
  if (raw > 0) game.fps += (1 / raw - game.fps) * 0.05;
  game.t += dt;
  if (shellTrans) stepTransition(now, dt);
  else {
    const stage = stages[game.current];
    stage.update?.(game.t, dt);
    ascii.render(stage.scene, stage.camera);
    writeHud(hudFor(game.current));
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
