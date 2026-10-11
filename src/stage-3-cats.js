// Stage 3: How can it be super sick? The 3 clay cats as a real 3D scene drawn in characters.
// Drag to orbit, scroll or pinch to zoom, click a cat, R cycles the render mode.
STAGES[3] = (ctx) => {
  const MODES = ['SHADED', 'WIREFRAME', 'FALLING CODE'];
  const POPS = { pink: ['mrrp! ♥', 'var(--hot)'], orange: ['!?', 'var(--orange)'], grey: ['...mrrp?', 'var(--ink)'] };
  const MSG = 'SAME 95 CHARACTERS. ADD DEPTH, LIGHT AND TIME.';
  const touch = matchMedia('(pointer: coarse)').matches;
  const BASE_TAN = Math.tan(THREE.MathUtils.degToRad(16)); // 32 degree vertical FOV
  const MIN_HALF_W = 0.23; // keep at least this much half-width (as tan) so the stack fits on phones

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 11, 26); // only the floor grid uses it: a depth cue
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
  scene.add(camera); // the camera carries the code rain

  // Lighting from the cat lab.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9a08f, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(3, 6, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
  key.shadow.radius = 6;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd6e4, 1.2);
  rim.position.set(-5, 3, -5);
  scene.add(rim);

  // The turntable: the cats plus a polar grid that turns with them.
  const turntable = new THREE.Group();
  scene.add(turntable);
  const kit = buildCats();
  kit.root.traverse((o) => { if (o.material) o.material.fog = false; });
  turntable.add(kit.root);

  const gridPts = [];
  const ring = (r) => {
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const b = ((i + 1) / 64) * Math.PI * 2;
      gridPts.push(Math.cos(a) * r, 0, Math.sin(a) * r, Math.cos(b) * r, 0, Math.sin(b) * r);
    }
  };
  [2.8, 4.6, 7].forEach(ring);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    gridPts.push(Math.cos(a) * 2.8, 0, Math.sin(a) * 2.8, Math.cos(a) * 7, 0, Math.sin(a) * 7);
  }
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
  // No depth write, so the lines skip the thick silhouette edges; ridges draws them as / - \\ |.
  const grid = new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({
    color: new THREE.Color(PALETTE.violet).multiplyScalar(0.28), depthWrite: false,
  }));
  grid.position.y = -1.9;
  turntable.add(grid);

  // Stars on a shell all the way round, so every orbit angle has some.
  const stars = makeStars({ count: 1400 });
  const sp = stars.geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < sp.count; i++) {
    v.randomDirection().multiplyScalar(45 + Math.random() * 70);
    sp.setXYZ(i, v.x, v.y, v.z);
  }
  stars.material.depthWrite = false; // brightness glyphs, not edge glyphs
  stars.material.fog = false;
  scene.add(stars);

  // Falling green code: drops of points snapped to the character grid, carried by the camera.
  const RAIN_MAX = 3200;
  const RAIN_D = 60;
  const rainPos = new Float32Array(RAIN_MAX * 3);
  const rainCol = new Float32Array(RAIN_MAX * 3);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  rainGeo.setAttribute('color', new THREE.BufferAttribute(rainCol, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({
    size: 2, sizeAttenuation: false, vertexColors: true, depthWrite: false, fog: false,
  }));
  rain.frustumCulled = false;
  rain.position.z = -RAIN_D;
  rain.visible = false;
  camera.add(rain);
  const drops = [];
  const newDrop = (cols, rows, d = {}, spread = false) => Object.assign(d, {
    c: Math.floor(Math.random() * cols),
    y: spread ? Math.random() * rows : -Math.random() * rows * 0.4,
    v: 7 + Math.random() * 20,
    len: 6 + Math.floor(Math.random() * 20),
  });

  function rainStep(t, dt) {
    const { cols, rows } = ctx.ascii;
    const hh = RAIN_D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const hw = hh * camera.aspect;
    const cx = (2 * hw) / cols;
    const cy = (2 * hh) / rows;
    rain.material.size = 2 / ctx.renderer.getPixelRatio();
    const want = Math.min(Math.round(cols * 0.5), 160);
    while (drops.length < want) drops.push(newDrop(cols, rows, {}, true));
    drops.length = want;
    const tick = Math.floor(t * 9);
    let n = 0;
    for (const d of drops) {
      d.y += d.v * dt;
      if (d.y - d.len > rows || d.c >= cols) newDrop(cols, rows, d);
      const head = Math.floor(d.y);
      for (let k = 0; k < d.len && n < RAIN_MAX; k++) {
        const row = head - k;
        if (row < 0 || row >= rows) continue;
        // Glyphs flicker a few times a second, like code being rewritten.
        const h = Math.sin((d.c * 131 + row * 17 + tick * 7) * 12.9898) * 43758.5453;
        const jit = 0.6 + 0.4 * (h - Math.floor(h));
        const b = k === 0 ? 1 : 0.9 * Math.pow(1 - k / d.len, 1.3) * jit;
        rainPos[n * 3] = -hw + (d.c + 0.5) * cx;
        rainPos[n * 3 + 1] = hh - (row + 0.5) * cy;
        rainPos[n * 3 + 2] = 0;
        rainCol[n * 3] = k === 0 ? 0.85 : b * 0.25;
        rainCol[n * 3 + 1] = b;
        rainCol[n * 3 + 2] = k === 0 ? 0.85 : b * 0.4;
        n++;
      }
    }
    rainGeo.setDrawRange(0, n);
    rainGeo.attributes.position.needsUpdate = true;
    rainGeo.attributes.color.needsUpdate = true;
  }

  // DOM: copy, hint, z Z, popups and the render mode flash. All text.
  const style = document.createElement('style');
  style.textContent = `
    .layer-3 { cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none; }
    .layer-3.drag { cursor: grabbing; }
    .layer-3.hover { cursor: pointer; }
    .layer-3 .s3-copy { position: absolute; left: 16px; right: 16px; bottom: 84px; text-align: center; pointer-events: none; }
    .layer-3 .s3-msg { min-height: 1.7em; font: 14px/1.7 var(--arcade); letter-spacing: .06em; color: var(--gold);
      text-shadow: 0 0 3px #000, 0 0 6px #000, 0 0 12px #ffc53d66; }
    .layer-3 .s3-cur { color: var(--hot); animation: s3-blink .7s steps(1) infinite; }
    .layer-3 .s3-hint { margin-top: 10px; font: 12px/1.8 var(--mono); color: var(--dim); text-shadow: 0 0 3px #000, 0 0 6px #000; opacity: 0; transition: opacity .6s; }
    .layer-3 .s3-hint.on { opacity: 1; }
    .layer-3 .s3-hint span { margin: 0 10px; white-space: nowrap; }
    .layer-3 .s3-hint b { color: var(--cyan); font-weight: normal; }
    .layer-3 .s3-hint .s3-r { pointer-events: auto; cursor: pointer; }
    .layer-3 .s3-flash { position: absolute; left: 16px; right: 16px; top: 16%; text-align: center; pointer-events: none;
      font: 16px/1 var(--arcade); color: var(--cyan); letter-spacing: .1em; text-shadow: 0 0 10px #4be3f088; opacity: 0; }
    .layer-3 .s3-flash.on { animation: s3-flash 1.4s ease-out forwards; }
    .layer-3 .s3-pop { position: absolute; transform: translate(-50%, -100%); pointer-events: none; white-space: nowrap;
      font: 18px/1 var(--arcade);
      text-shadow: 0 0 3px #000, 0 0 3px #000, 0 0 14px currentColor; animation: s3-pop 1.3s ease-out forwards; }
    .layer-3 .s3-zz { position: absolute; pointer-events: none; font: 12px/1 var(--arcade); color: var(--cyan);
      text-shadow: 0 0 8px #4be3f088; }
    .layer-3 .s3-zz span { position: absolute; opacity: 0; animation: s3-zz 3s linear infinite; }
    .layer-3 .s3-zz span:nth-child(2) { animation-delay: 1s; font-size: 15px; }
    .layer-3 .s3-zz span:nth-child(3) { animation-delay: 2s; font-size: 19px; }
    @keyframes s3-blink { 50% { opacity: 0; } }
    @keyframes s3-flash { 0% { opacity: 0; transform: scale(1.4); } 15% { opacity: 1; transform: scale(1); }
      70% { opacity: 1; } 100% { opacity: 0; } }
    @keyframes s3-pop { 0% { opacity: 1; margin-top: 10px; scale: .6; } 12% { opacity: 1; margin-top: 0; scale: 1.15; }
      24% { scale: 1; }
      100% { opacity: 0; margin-top: -56px; } }
    @keyframes s3-zz { 0% { opacity: 0; transform: translate(0, 0); } 20% { opacity: 1; }
      100% { opacity: 0; transform: translate(30px, -60px); } }
    @media (max-width: 600px) {
      .layer-3 .s3-copy { bottom: 80px; }
      .layer-3 .s3-msg { font-size: 9px; }
      .layer-3 .s3-hint { font-size: 10px; margin-top: 6px; }
      .layer-3 .s3-hint span { margin: 0 6px; }
      .layer-3 .s3-flash { font-size: 11px; top: 12%; }
      .layer-3 .s3-pop { font-size: 13px; }
    }`;
  document.head.appendChild(style);

  const hint = touch
    ? '<span><b>[DRAG]</b> orbit</span><span><b>[PINCH]</b> zoom</span><span><b>[TAP]</b> a cat</span>'
    : '<span><b>[DRAG]</b> orbit</span><span><b>[SCROLL]</b> zoom</span><span><b>[CLICK]</b> a cat</span>';
  ctx.layer.innerHTML = `
    <div class="s3-zz"><span>z</span><span>z</span><span>Z</span></div>
    <div class="s3-flash"></div>
    <div class="s3-copy"><div class="s3-msg"></div>
      <div class="s3-hint">${hint}<span class="s3-r"><b>[R]</b> render mode</span></div></div>`;
  const $ = (s) => ctx.layer.querySelector(s);
  const msgEl = $('.s3-msg');
  const hintEl = $('.s3-hint');
  const zzEl = $('.s3-zz');
  const flashEl = $('.s3-flash');
  $('.s3-r').addEventListener('click', (e) => { e.stopPropagation(); setMode(state.mode + 1); });
  $('.s3-r').addEventListener('pointerdown', (e) => e.stopPropagation());

  // Orbit and clicks, on this stage's layer only.
  const HOME = { theta: 0, phi: 1.4, dist: 12.5 };
  const orbit = new Orbit({ ...HOME, target: new THREE.Vector3(0, -0.15, 0) });
  orbit.attach(ctx.layer);
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function catAt(e) {
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(kit.root, true)[0];
    return hit ? catNameOf(hit.object) : null;
  }
  ctx.layer.addEventListener('click', (e) => {
    if (orbit.moved > 6) return;
    const name = catAt(e);
    if (!name) return;
    kit.poke(name);
    ctx.sfx('meow');
    const [text, color] = POPS[name];
    const p = el('div', 's3-pop');
    p.textContent = text;
    p.style.color = color;
    p.style.left = `${e.clientX}px`;
    p.style.top = `${e.clientY - 8}px`;
    ctx.layer.appendChild(p);
    setTimeout(() => p.remove(), 1300);
  });
  ctx.layer.addEventListener('pointerdown', () => ctx.layer.classList.add('drag'));
  const undrag = () => ctx.layer.classList.remove('drag');
  ctx.layer.addEventListener('pointerup', undrag);
  ctx.layer.addEventListener('pointercancel', undrag);
  let hoverAt = 0;
  ctx.layer.addEventListener('pointermove', (e) => {
    if (orbit.dragging || e.pointerType !== 'mouse' || performance.now() - hoverAt < 60) return;
    hoverAt = performance.now();
    ctx.layer.classList.toggle('hover', !!catAt(e));
  });

  // Render modes.
  const state = { mode: 0, cell: 10, introT: 0, typed: -1, spin: 0, fps: 60, frames: 0, fpsT: 0, aspect: 0 };
  function cellFor() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return w < 600 ? 8 : THREE.MathUtils.clamp(Math.round(h / 80), 9, 12);
  }
  function applyAscii() {
    ctx.setAscii({ cell: state.cell, mode: state.mode === 2 ? 2 : 0, fill: state.mode === 2 ? 0.12 : 0.4, edges: true,
      ridges: state.mode !== 2 }); // ridges would turn each code drop into a | line
  }
  function setMode(m, flash = true) {
    state.mode = ((m % MODES.length) + MODES.length) % MODES.length;
    kit.setWireframe(state.mode === 1);
    rain.visible = state.mode === 2;
    stars.visible = state.mode !== 2;
    applyAscii();
    if (!flash) return;
    flashEl.textContent = `RENDER · ${MODES[state.mode]}`;
    flashEl.classList.remove('on');
    void flashEl.offsetWidth;
    flashEl.classList.add('on');
    ctx.sfx('blip');
  }
  const onResize = () => {
    const c = cellFor();
    if (c !== state.cell) { state.cell = c; applyAscii(); }
  };

  let shadowWas = false;
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  const proj = new THREE.Vector3();

  return {
    scene,
    camera,
    swipe: false, // drags orbit here
    enter() {
      // One scene pixel per star, whatever the device pixel ratio.
      stars.material.size = 2 / ctx.renderer.getPixelRatio();
      shadowWas = ctx.renderer.shadowMap.enabled;
      ctx.renderer.shadowMap.enabled = true;
      ctx.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      Object.assign(orbit, HOME);
      turntable.rotation.y = -0.9;
      state.cell = cellFor();
      state.typed = -1;
      state.introT = 0;
      msgEl.textContent = '';
      hintEl.classList.remove('on');
      flashEl.classList.remove('on');
      setMode(0, false);
      window.addEventListener('resize', onResize);
    },
    exit() {
      ctx.renderer.shadowMap.enabled = shadowWas;
      window.removeEventListener('resize', onResize);
      ctx.layer.classList.remove('drag', 'hover');
    },
    update(t, dt) {
      // Fit: on narrow screens widen the FOV so the whole stack stays in view.
      if (camera.aspect !== state.aspect) {
        state.aspect = camera.aspect;
        const tanV = Math.max(BASE_TAN, MIN_HALF_W / camera.aspect);
        camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(tanV));
        camera.updateProjectionMatrix();
      }

      // Intro: the camera swoops in from high and wide, then hands over to the orbit.
      if (orbit.dragging) state.introT = 1;
      state.introT = Math.min(1, state.introT + dt / 2.4);
      const k = 1 - ease(state.introT);
      const saved = { theta: orbit.theta, phi: orbit.phi, dist: orbit.dist };
      orbit.theta += k * 1.6;
      orbit.phi -= k * 0.75;
      orbit.dist *= 1 + k * 2.2;
      orbit.apply(camera);
      Object.assign(orbit, saved);

      // Turntable: slower while the faces point at the camera, quicker round the back.
      if (!orbit.dragging) {
        const facing = Math.cos(turntable.rotation.y + orbit.theta);
        turntable.rotation.y += dt * (0.12 + 0.42 * (1 - facing) * 0.5);
      }
      kit.update(t, dt);
      stars.rotation.y += dt * 0.006;
      if (rain.visible) rainStep(t, dt);

      // z Z over the grey cat's head.
      kit.zzAnchor.getWorldPosition(proj).project(camera);
      zzEl.style.display = proj.z < 1 ? '' : 'none';
      zzEl.style.transform = `translate(${(proj.x * 0.5 + 0.5) * window.innerWidth}px, ${(-proj.y * 0.5 + 0.5) * window.innerHeight}px)`;

      // Copy types itself in after the swoop starts, then the hint fades up.
      const typed = THREE.MathUtils.clamp(Math.floor((t - 0.7) * 38), 0, MSG.length);
      if (typed !== state.typed) {
        state.typed = typed;
        msgEl.innerHTML = `${MSG.slice(0, typed)}<span class="s3-cur">█</span>`;
        if (typed === MSG.length) hintEl.classList.add('on');
      }

      state.frames++;
      state.fpsT += dt;
      if (state.fpsT >= 0.5) {
        state.fps = Math.round(state.frames / state.fpsT);
        state.frames = 0;
        state.fpsT = 0;
      }
    },
    onKey(e) {
      if (e.key !== 'r' && e.key !== 'R') return false;
      setMode(state.mode + 1);
      return true;
    },
    hud: () => ({
      // The full title and the counter don't fit side by side on a phone.
      tl: window.innerWidth < 600 ? 'STAGE 03' : 'STAGE 03 · HOW CAN IT BE SUPER SICK?',
      tr: `${(ctx.ascii.cols * ctx.ascii.rows).toLocaleString('en-US')} CHARS × ${ctx.fps ? Math.round(ctx.fps()) : state.fps} FPS`,
    }),
  };
};
