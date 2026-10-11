// Stage 1: title screen. A ringed planet, star specks and a synthwave grid rolling toward the
// player, all drawn through the ASCII pass; the logo and "PRESS START" are DOM text on top.
STAGES[1] = (ctx) => {
  const CAM_Y = 3;
  const PITCH = 0.25;       // camera looks up a little, so the horizon sits about 72% down
  const GX = 2;             // gap between lines running to the horizon
  const GZ = 5;             // gap between cross lines (wider, so they stay a few rows apart)
  const GRID_SPEED = 6;     // units per second toward the player

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 10, 70);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
  camera.position.set(0, CAM_Y, 0);
  camera.rotation.x = PITCH;
  scene.add(camera);

  // Star specks above the horizon, streaming slowly toward the player.
  const stars = makeStars({ count: 400, spread: 220, depth: 220, drift: 5, twinkle: 0.6 });
  stars.position.y = CAM_Y + 110;
  scene.add(stars);

  // Hot pink perspective grid. Lines don't write depth, so the ASCII pass draws them from
  // brightness, and ridges turn them into / | \ -.
  // Cross lines fade out early, before they bunch up into a solid band near the horizon.
  const gv = [];
  const gc = [];
  const HALF = 11;          // lines each side; more only stack up as flat rows at the far sides
  const NEAR = 6;
  const FAR = 120;
  const CROSS = 26;
  const hot = new THREE.Color(0xff4fa0);
  const gcol = new THREE.Color();
  for (let i = -HALF; i <= HALF; i++) {
    gv.push(i * GX, 0, NEAR, i * GX, 0, -FAR);
    gc.push(hot.r, hot.g, hot.b, hot.r, hot.g, hot.b);
  }
  for (let z = NEAR; z >= -CROSS; z -= GZ) {
    gv.push(-HALF * GX, 0, z, HALF * GX, 0, z);
    gcol.copy(hot).multiplyScalar(Math.max(0, 1 - Math.max(0, -z) / CROSS) ** 0.6);
    gc.push(gcol.r, gcol.g, gcol.b, gcol.r, gcol.g, gcol.b);
  }
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gv, 3));
  gridGeo.setAttribute('color', new THREE.Float32BufferAttribute(gc, 3));
  const grid = new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ vertexColors: true, depthWrite: false }));
  grid.frustumCulled = false;
  scene.add(grid);

  // Horizon glow: a far wall, brightest in a thin magenta line at the horizon, fading up to violet.
  const glowUniforms = {
    uPulse: { value: 1 },
    uHot: { value: new THREE.Color(PALETTE.hot) },
    uViolet: { value: new THREE.Color(PALETTE.violet) },
  };
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1600, 200), new THREE.ShaderMaterial({
    uniforms: glowUniforms,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying float vY;
      void main() { vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uPulse;
      uniform vec3 uHot, uViolet;
      varying float vY;
      void main() {
        float up = max(vY, 0.0);
        vec3 col = mix(uViolet * 0.5, uHot, exp(-up / 3.0)) * exp(-up / 4.5) * 0.3 * uPulse;
        col += vec3(1.0, 0.3, 0.7) * exp(-abs(vY) / 0.8) * (0.7 + 0.3 * uPulse);
        if (vY < 0.0) col *= exp(vY / 2.5);
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  glow.position.set(0, CAM_Y, -215);
  glow.renderOrder = -1; // under the grid
  scene.add(glow);

  // Pink ringed planet with a cyan ring, pinned to the top left of the view.
  const planet = new THREE.Group();
  const sphereGeo = new THREE.SphereGeometry(3, 40, 28);
  {
    const p = sphereGeo.attributes.position;
    const cols = new Float32Array(p.count * 3);
    const a = new THREE.Color(PALETTE.hot);
    const b = new THREE.Color(0xff8fc0);
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      c.copy(Math.sin(y * 3.1 + Math.sin(y * 1.3) * 0.8) > 0.35 ? b : a);
      cols.set([c.r, c.g, c.b], i * 3);
    }
    sphereGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  }
  const sphere = new THREE.Mesh(sphereGeo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  const ringGeo = new THREE.RingGeometry(4.1, 6.6, 96, 6);
  {
    const p = ringGeo.attributes.position;
    const cols = new Float32Array(p.count * 3);
    const cy = new THREE.Color(PALETTE.cyan);
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const r = Math.hypot(p.getX(i), p.getY(i));
      const k = r > 5.15 && r < 5.5 ? 0.15 : r < 5.15 ? 1 : 0.6;
      c.copy(cy).multiplyScalar(k);
      cols.set([c.r, c.g, c.b], i * 3);
    }
    ringGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  }
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  ring.rotation.x = -1.22;
  planet.add(sphere, ring);
  planet.rotation.z = 0.32;
  camera.add(planet);
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(6, 5, 4);
  scene.add(sun);

  // ---- DOM: logo and PRESS START ----
  const BIG = {
    A: [' █████╗ ', '██╔══██╗', '███████║', '██╔══██║', '██║  ██║', '╚═╝  ╚═╝'],
    S: ['███████╗', '██╔════╝', '███████╗', '╚════██║', '███████║', '╚══════╝'],
    C: [' ██████╗', '██╔════╝', '██║     ', '██║     ', '╚██████╗', ' ╚═════╝'],
    I: ['██╗', '██║', '██║', '██║', '██║', '╚═╝'],
    '?': [' ██████╗ ', ' ╚════██╗', '   ▄███╔╝', '   ▀▀══╝ ', '   ██╗   ', '   ╚═╝   '],
  };
  // Block faces take the gradient; box-drawing shadow strokes are a deeper pink.
  const artRow = (row) => row.replace(/([█▄▀ ]+)|([^█▄▀ ]+)/g, (m, face) => (face ? m : `<span class="t1-sh">${m}</span>`));
  let i = 0;
  const small = [...'WHAT IS'].map((ch) => (ch === ' '
    ? '<span class="t1-gap"></span>'
    : `<span class="t1-l" style="--i:${i++}"><span class="t1-g">${ch}</span></span>`)).join('');
  const big = [...'ASCII?'].map((ch) => `<span class="t1-l" style="--i:${i++}"><pre class="t1-g">${BIG[ch].map(artRow).join('\n')}</pre></span>`).join('');

  ctx.layer.innerHTML = `
<style>
  .layer-1 { cursor: pointer; }
  .t1-wrap { position: absolute; left: 0; right: 0; top: 17vh; display: flex; flex-direction: column; align-items: center; gap: 2.4vh; pointer-events: none; }
  .t1-logo { --fs: min(3.2vw, 5.2vh, 40px); display: flex; flex-direction: column; align-items: center; gap: calc(var(--fs) * .55);
    filter: drop-shadow(0 0 6px rgba(255, 138, 61, .55)) drop-shadow(0 0 22px rgba(255, 61, 139, .35)); }
  .t1-small, .t1-big { display: flex; align-items: flex-end; }
  .t1-small { font: calc(var(--fs) * 1.05)/1 var(--arcade); gap: calc(var(--fs) * .55); }
  .t1-gap { width: calc(var(--fs) * 1.3); }
  .t1-big pre { margin: 0; font: var(--fs)/1 var(--mono); letter-spacing: 0; }
  .t1-l { display: block; transform: translateY(-120vh); }
  .t1-g { display: block; color: transparent; -webkit-background-clip: text; background-clip: text;
    background-image: linear-gradient(180deg, #fff59a 0%, #ffd23d 30%, #ffa53d 62%, #ff6a3d 100%); }
  .t1-sh { color: #d8327a; }
  .t1-play .t1-l { animation: t1-drop .8s cubic-bezier(.3, 0, .6, 1) calc(.25s + var(--i) * .11s) both; }
  .t1-play .t1-g { animation: t1-bob 2.6s ease-in-out calc(1.9s + var(--i) * .13s) infinite; }
  @keyframes t1-drop {
    0% { transform: translateY(-120vh); }
    55% { transform: translateY(0); animation-timing-function: cubic-bezier(.2, .6, .4, 1); }
    70% { transform: translateY(-.9em); animation-timing-function: cubic-bezier(.6, 0, .8, .4); }
    82% { transform: translateY(0); animation-timing-function: cubic-bezier(.2, .6, .4, 1); }
    91% { transform: translateY(-.25em); animation-timing-function: cubic-bezier(.6, 0, .8, .4); }
    100% { transform: translateY(0); }
  }
  @keyframes t1-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(calc(var(--fs) * -.22)); } }
  .t1-press { font: clamp(9px, 1.5vw, 16px)/1 var(--arcade); letter-spacing: .3em; margin-right: -.3em; color: var(--ink);
    text-shadow: 0 0 8px rgba(255, 61, 139, .9), 0 0 2px #fff; margin-top: 2.4vh; opacity: 0; }
  .t1-play .t1-press { animation: t1-in .01s linear 1.7s both, t1-blink 1.1s steps(1) 1.7s infinite; }
  .t1-play.t1-go .t1-press { animation: t1-blink .14s steps(1) infinite; }
  @keyframes t1-in { to { opacity: 1; } }
  .t1-notes { display: flex; flex-direction: column; align-items: center; gap: 1.1vh; margin-top: 2.2vh; padding: 0 16px;
    text-align: center; font: clamp(7px, .85vw, 10px)/1.5 var(--arcade); letter-spacing: .06em; color: var(--dim); opacity: 0;
    text-shadow: 0 0 3px #000, 0 0 6px #000, 0 0 10px #000; }
  .t1-play .t1-notes { animation: t1-in .4s ease-out 1.9s both; }
  .t1-notes p { margin: 0; }
  .t1-notes p + p { color: var(--ink); opacity: .8; }
  .t1-heart { color: var(--hot); font-size: 1.3em; text-shadow: 0 0 6px var(--hot), 0 0 12px rgba(255, 61, 139, .6); }
  .t1-skip { all: unset; pointer-events: auto; cursor: pointer; margin-top: .6vh; padding: 6px 8px; font: inherit; color: var(--cyan);
    letter-spacing: .06em; text-shadow: 0 0 4px rgba(75, 227, 240, .4); }
  .t1-skip:hover, .t1-skip:focus-visible { color: #fff; text-shadow: 0 0 6px var(--cyan), 0 0 14px var(--cyan); outline: 1px dashed var(--cyan); outline-offset: 2px; }
  @keyframes t1-blink { 0%, 54% { opacity: 1; } 55%, 100% { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) {
    .t1-play .t1-l { animation: none; transform: none; } .t1-play .t1-g { animation: none; }
    .t1-play .t1-press, .t1-play .t1-notes { animation: none; opacity: 1; }
  }
</style>
<div class="t1-wrap">
  <div class="t1-logo" role="img" aria-label="What is ASCII?">
    <div class="t1-small" aria-hidden="true">${small}</div>
    <div class="t1-big" aria-hidden="true">${big}</div>
  </div>
  <div class="t1-press">PRESS START BUTTON...</div>
  <div class="t1-notes">
    <p>Note: this entire game is rendering with only text.</p>
    <p>Developed with <span class="t1-heart">♥</span> by Christopher Smith @ Xplor</p>
    <button type="button" class="t1-skip">TLDR; Skip to how to use it in your process</button>
  </div>
</div>`;
  const wrap = ctx.layer.querySelector('.t1-wrap');
  const skip = ctx.layer.querySelector('.t1-skip');
  // The TLDR link jumps straight to stage 4 and never counts as the "any click starts" click.
  skip.addEventListener('click', (e) => { e.stopPropagation(); if (active) ctx.go(4); });

  let score = 524;
  let starting = false;
  let active = false;

  function start() {
    if (starting || !active) return;
    starting = true;
    wrap.classList.add('t1-go');
    ctx.sfx('coin');
    setTimeout(() => { if (active) ctx.next(); }, 260);
  }
  ctx.layer.addEventListener('click', start);

  const PASS = new Set(['Escape', 'm', 'M', 'Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'ArrowLeft', 'PageUp']);
  for (let n = 1; n <= STAGE_COUNT; n++) PASS.add(String(n));

  // Size the planet to the view height, but never let the ring take more than a third of the
  // width; then park it near the top left corner.
  function placePlanet(t) {
    const D = 42;
    const hh = D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const hw = hh * camera.aspect;
    const s = Math.min(0.15 * hh / 3, 0.34 * hw / 6.6);
    planet.scale.setScalar(s);
    const x = -hw + 6.6 * s + hw * 0.08;
    const y = hh * (camera.aspect < 1 ? 0.64 : 0.6);
    planet.position.set(x + Math.sin(t * 0.21) * 0.4 * s, y + Math.sin(t * 0.6) * 0.35 * s, -D);
  }

  return {
    scene,
    camera,
    enter() {
      active = true;
      starting = false;
      ctx.setAscii({ cell: 15, edges: true, ridges: true, fill: 0.3 });
      wrap.classList.remove('t1-play', 't1-go');
      void wrap.offsetWidth; // restart the drop-in
      wrap.classList.add('t1-play');
    },
    exit() {
      active = false;
    },
    update(t, dt) {
      grid.position.z = (t * GRID_SPEED) % GZ;
      glowUniforms.uPulse.value = 0.85 + 0.15 * Math.sin(t * 2.4);
      sphere.rotation.y += dt * 0.25;
      ring.rotation.z += dt * 0.05;
      camera.position.x = Math.sin(t * 0.35) * 0.5;
      placePlanet(t);
      score += dt * (90 + 60 * Math.sin(t * 1.7) ** 2);
    },
    onKey(e) {
      if (e.target === skip && (e.key === 'Enter' || e.key === ' ')) { if (active) ctx.go(4); return true; }
      if (PASS.has(e.key)) return false;
      if (!e.repeat) start();
      return true;
    },
    hud: () => ({
      tl: `1UP ${String(Math.floor(score)).padStart(6, '0')}`,
      tr: 'HI 999999',
      bl: 'CREDIT 01',
      br: 'STAGE 01',
    }),
  };
};
