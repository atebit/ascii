// Cat lab: the cat model shaded on one side and through the ASCII pass on the other,
// so the model and the ASCII look can be tuned together.
const MODES = ['COLOR', 'MONO', 'MATRIX'];
const VIEWS = ['SPLIT', 'SHADED', 'ASCII'];

const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0xd9a08f, 2.0));
const key = new THREE.DirectionalLight(0xffffff, 2.8);
key.position.set(3, 6, 6);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -4;
key.shadow.camera.right = 4;
key.shadow.camera.top = 4;
key.shadow.camera.bottom = -4;
key.shadow.radius = 6;
scene.add(key);
const rim = new THREE.DirectionalLight(0xffd6e4, 1.2);
rim.position.set(-5, 3, -5);
scene.add(rim);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.18 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.9;
floor.receiveShadow = true;
scene.add(floor);

const kit = buildCats();
scene.add(kit.root);

const orbit = new Orbit({ theta: 0, phi: 1.42, dist: 12.5, target: new THREE.Vector3(0, -0.1, 0) });

function makePane(id, bg, ascii) {
  const el = document.getElementById(id);
  const canvas = el.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !ascii });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  const pane = { el, renderer, camera, bg: new THREE.Color(bg), ascii: ascii ? new AsciiPass(renderer, { cell: 11 }) : null };
  orbit.attach(canvas);
  canvas.addEventListener('click', (e) => {
    if (orbit.moved > 6) return;
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(kit.root, true)[0];
    const name = hit && catNameOf(hit.object);
    if (!name) return;
    kit.poke(name);
    pop(el, e.clientX - rect.left, e.clientY - rect.top, { grey: '...mrrp?', orange: '!?', pink: 'mrrp! ♥' }[name]);
  });
  return pane;
}

function pop(el, x, y, text) {
  const p = document.createElement('div');
  p.className = 'pop';
  p.textContent = text;
  p.style.left = `${x}px`;
  p.style.top = `${y}px`;
  el.appendChild(p);
  setTimeout(() => p.remove(), 1200);
}

const panes = [makePane('shaded', 0xefb59d, false), makePane('ascii', 0x000000, true)];
const zz = document.getElementById('zz');

const state = { view: 0, mode: 0, edges: true, spin: true, wire: false, fill: true };

function resize() {
  for (const p of panes) {
    const w = p.el.clientWidth;
    const h = p.el.clientHeight;
    if (!w || !h) continue;
    p.renderer.setSize(w, h, false);
    p.camera.aspect = w / h;
    p.camera.updateProjectionMatrix();
    if (p.ascii) p.ascii.setSize(w, h);
  }
}

function setView(v) {
  state.view = v;
  document.body.dataset.view = VIEWS[v].toLowerCase();
  resize();
  hud();
}

function hud() {
  const a = panes[1].ascii;
  document.getElementById('hud').textContent =
    `[1-3] ${VIEWS[state.view]}  [C] ${MODES[state.mode]}  [E] EDGES ${state.edges ? 'ON' : 'OFF'}  ` +
    `[F] FILL ${state.fill ? 'ON' : 'OFF'}  [T] SPIN ${state.spin ? 'ON' : 'OFF'}  [W] WIRE ${state.wire ? 'ON' : 'OFF'}  [ ] ] CELL ${a.cell}px  ` +
    `${a.cols}×${a.rows} = ${(a.cols * a.rows).toLocaleString()} CHARS`;
}

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  const a = panes[1].ascii;
  if (k >= '1' && k <= '3') setView(+k - 1);
  else if (k === 'c') a.mode = state.mode = (state.mode + 1) % MODES.length;
  else if (k === 'e') a.edges = state.edges = !state.edges;
  else if (k === 'f') a.fill = (state.fill = !state.fill) ? 0.4 : 0;
  else if (k === 't') state.spin = !state.spin;
  else if (k === 'w') kit.setWireframe((state.wire = !state.wire));
  else if (k === '[' || k === ']') { a.cell = THREE.MathUtils.clamp(a.cell + (k === '[' ? -1 : 1), 6, 24); resize(); }
  else return;
  hud();
});
document.getElementById('hud').addEventListener('click', () => setView((state.view + 1) % VIEWS.length));

window.addEventListener('resize', resize);
setView(0);

let last = performance.now();
let t = 0;
let fpsT = 0;
let frames = 0;
const proj = new THREE.Vector3();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  t += dt;
  if (state.spin && !orbit.dragging) orbit.theta += dt * 0.25;
  kit.update(t, dt);
  for (const p of panes) {
    if (!p.el.offsetWidth) continue;
    orbit.apply(p.camera);
    scene.background = p.bg;
    floor.visible = !p.ascii;
    if (p.ascii) p.ascii.render(scene, p.camera);
    else p.renderer.render(scene, p.camera);
  }
  // Float the "z Z" over the grey cat's head in the ASCII pane.
  const ap = panes[1];
  kit.zzAnchor.getWorldPosition(proj).project(ap.camera);
  zz.style.left = `${(proj.x * 0.5 + 0.5) * ap.el.clientWidth}px`;
  zz.style.top = `${(-proj.y * 0.5 + 0.5) * ap.el.clientHeight}px`;
  frames++;
  fpsT += dt;
  if (fpsT > 0.5) {
    document.getElementById('fps').textContent = `${Math.round(frames / fpsT)} FPS`;
    frames = 0;
    fpsT = 0;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
