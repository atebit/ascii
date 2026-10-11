// Game shell pieces shared by every stage. Stages register themselves in stage-N-*.js as
// STAGES[n] = (ctx) => stage; game.js boots the game.
//
// Stage contract — the factory gets ctx and returns:
//   scene, camera          THREE.Scene and THREE.PerspectiveCamera, rendered through the ASCII pass
//   enter(), exit()        optional; called when the stage becomes active or inactive
//   update(t, dt)          optional; t is seconds since this stage was entered
//   onKey(e) -> bool       optional; return true if the stage used the key (shell skips its own handling)
//   hud() -> {tl,tr,bl,br} optional; HUD text overrides (top left/right, bottom left/right)
//   swipe                  optional; set false if the stage uses horizontal drags (orbit), so a
//                          touch swipe doesn't change stage. Elements with data-no-swipe opt out too.
// ctx gives: renderer, ascii (AsciiPass), layer (this stage's DOM layer, visible only while
// active; attach pointer handlers here), setAscii({cell, mode, fill, edges, ridges}), sfx(name),
// go(n), next(), back(), score (object shared across stages), fps() (smoothed frames per
// second, for HUD counters).
//
// Transitions: go/next/back play a ~700ms transition. The outgoing layer's text and the HUD
// scramble into random characters, a warp star field flies past, then the incoming layer's
// text resolves. enter() runs about 500ms in, so update(t) starts while the text resolves.
// Text inside an element with data-no-scramble is left alone. Calls to go() during a
// transition are queued, so a stage never needs to guard against them.
//
// setAscii options reset to ASCII_DEFAULTS on every stage change; call it in enter().
//   ridges: true draws thin bright lines (grids, streaks, line art) as | / - \ along the line.
const STAGES = [];
const STAGE_COUNT = 5;

const PALETTE = {
  ink: 0xf4ecdf,
  hot: 0xff3d8b,
  cyan: 0x4be3f0,
  gold: 0xffc53d,
  orange: 0xff8a3d,
  violet: 0x9b5cff,
};

const ASCII_DEFAULTS = { cell: 12, mode: 0, fill: 0.4, edges: true, ridges: false };

// A box of colored star specks. Each star snaps to one ASCII cell and draws as one glyph,
// whatever the pixel ratio. Stars don't write depth, so they never trigger edge glyphs.
//   brightness    linear color scale; 0.4 lands most stars on . : - + * rather than # @
//   twinkle 0..1  how much each star dims and brightens over time
//   drift         units per second the field streams toward +z (toward a default camera)
//   wrap          keep the field around the camera along z, so a flying camera never runs out
//                 (on whenever drift is set)
function makeStars({
  count = 700, spread = 160, depth = 200, twinkle = 0.35, drift = 0, wrap = false, brightness = 0.4,
  colors = [PALETTE.ink, PALETTE.cyan, PALETTE.hot, PALETTE.gold],
} = {}) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
    pos[i * 3 + 2] = -Math.random() * depth;
    c.set(colors[i % colors.length]).multiplyScalar(brightness * (0.5 + Math.random() * 0.5));
    col.set([c.r, c.g, c.b], i * 3);
    phase[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
  const uniforms = {
    uTime: { value: 0 },
    uTwinkle: { value: twinkle },
    uDrift: { value: drift },
    uDepth: { value: depth },
    uWrap: { value: wrap || drift !== 0 ? 1 : 0 },
    uCam: { value: new THREE.Vector3() },
    uRes: { value: new THREE.Vector2(1, 1) },
    uCell: { value: 2 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      attribute vec3 color;
      attribute float phase;
      uniform float uTime, uTwinkle, uDrift, uDepth, uWrap, uCell;
      uniform vec3 uCam;
      uniform vec2 uRes;
      varying vec3 vColor;
      void main() {
        vec3 p = position;
        float fade = 1.0;
        if (uWrap > 0.5) {
          p.z += uDrift * uTime;
          p.z = uCam.z - mod(uCam.z - p.z, uDepth);
          fade = smoothstep(0.0, 0.15, (p.z - (uCam.z - uDepth)) / uDepth);
        }
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        // Snap to the center of an ASCII cell and cover exactly that cell.
        vec2 cells = uRes / uCell;
        vec2 ndc = gl_Position.xy / gl_Position.w;
        vec2 snapped = (floor((ndc * 0.5 + 0.5) * cells) + 0.5) / cells;
        gl_Position.xy = (snapped * 2.0 - 1.0) * gl_Position.w;
        gl_PointSize = uCell;
        float tw = 1.0 - uTwinkle * (0.5 + 0.5 * sin(uTime * (1.2 + phase * 2.5) + phase * 6.2832));
        vColor = color * tw * fade;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main() { gl_FragColor = vec4(vColor, 1.0); }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const res = new THREE.Vector2();
  points.onBeforeRender = (r, scene, camera) => {
    const rt = r.getRenderTarget();
    if (rt) uniforms.uRes.value.set(rt.width, rt.height);
    else uniforms.uRes.value.copy(r.getDrawingBufferSize(res));
    uniforms.uCell.value = rt ? 2 : 1;
    uniforms.uTime.value = performance.now() / 1000;
    points.worldToLocal(camera.getWorldPosition(uniforms.uCam.value));
  };
  return points;
}

function el(tag, className = '', html = '') {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html) e.innerHTML = html;
  return e;
}

// Scramble: swap a share of a string's characters for random glyphs. Each character has its
// own threshold, so as amount goes 0 -> 1 the noise spreads across the text.
const SCRAMBLE_GLYPHS = '!#$%&*+=?@<>/\\|~^:;01ABCDEFGHJKLMNPRSTUVXYZ░▒▓█';
function scrambleText(s, amount, seed = 0) {
  if (amount <= 0 || !s) return s;
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const th = Math.abs(Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453) % 1;
    if (ch === ' ' || ch === '\n' || ch === ' ' || th >= amount) out += ch;
    else out += SCRAMBLE_GLYPHS[(Math.random() * SCRAMBLE_GLYPHS.length) | 0];
  }
  return out;
}

// Chiptune bleeps from square and triangle waves, plus the background music (music.js).
// On by default. Browsers only allow audio after a user gesture, so the first key, click or
// tap anywhere unlocks it; M or the HUD label toggles it after that.
const SFX = {
  on: true,
  ac: null,
  notes: {
    coin: [[988, 0.07], [1319, 0.25]],
    next: [[660, 0.06], [880, 0.08]],
    back: [[880, 0.06], [660, 0.08]],
    blip: [[1200, 0.04]],
    select: [[523, 0.05], [784, 0.07]],
    type: [[1800, 0.015]],
    meow: [[700, 0.08], [900, 0.12], [600, 0.14]],
    warp: [[196, 0.04], [262, 0.04], [349, 0.04], [466, 0.04], [622, 0.05]],
  },
  unlock() {
    if (this.ac) return;
    this.ac = new AudioContext();
    if (this.on) MUSIC.start(this.ac);
  },
  toggle() {
    this.on = !this.on;
    if (!this.ac) this.ac = new AudioContext();
    if (this.on && this.ac.state === 'suspended') this.ac.resume();
    if (this.on) this.play('select');
    if (this.on) MUSIC.start(this.ac);
    else MUSIC.stop();
    return this.on;
  },
  play(name) {
    if (!this.on || !this.ac || !this.notes[name]) return;
    let at = this.ac.currentTime;
    const soft = name === 'warp' || name === 'type';
    for (const [f, d] of this.notes[name]) {
      const o = this.ac.createOscillator();
      const g = this.ac.createGain();
      o.type = name === 'meow' || name === 'warp' ? 'triangle' : 'square';
      o.frequency.setValueAtTime(f, at);
      g.gain.setValueAtTime(soft ? 0.035 : 0.06, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + d);
      o.connect(g).connect(this.ac.destination);
      o.start(at);
      o.stop(at + d);
      at += d;
    }
  },
};

// Unlock audio on the first gesture. Capture phase, so it runs before any stage handler
// (the title's start key then plays its coin sound with the music already running).
const SFX_GESTURES = ['pointerdown', 'keydown', 'touchstart'];
function sfxUnlock() {
  SFX.unlock();
  for (const t of SFX_GESTURES) window.removeEventListener(t, sfxUnlock, true);
}
for (const t of SFX_GESTURES) window.addEventListener(t, sfxUnlock, true);
