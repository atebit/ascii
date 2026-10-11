// The 3 stacked clay cats from the reference: grey asleep at the bottom, orange lying on
// top of it, pink sitting at the back and waving. Built from spheres, capsules, cones and
// tubes. Units: about 1 = the grey cat's head radius; the ground is y = 0 before centring.
const CAT = {
  grey: 0x8e919c,
  orange: 0xf5b04c,
  pink: 0xf8c6d2,
  inner: 0xee8aa2,
  eye: 0x18161c,
  white: 0xffffff,
};

function clay(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0 });
}

function solid(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Place a feature on the front of a sphere of radius r and turn it to face outward.
// Call before adding obj to a parent: lookAt reads world space.
function onFace(obj, r, x, y, out = 0) {
  const z = Math.sqrt(Math.max(r * r - x * x - y * y, 0));
  const p = new THREE.Vector3(x, y, z);
  obj.lookAt(p.clone().multiplyScalar(2));
  obj.position.copy(p.addScaledVector(p.clone().normalize(), out));
  return obj;
}

// eyes: 'open' (orange), 'closed' ‿ (grey, asleep) or 'happy' ∩ (pink).
function makeHead(r, color, eyes, { peek = false } = {}) {
  const head = new THREE.Group();
  const skin = clay(color);
  const inner = clay(CAT.inner);
  const dark = clay(CAT.eye);
  const white = clay(CAT.white);

  const skull = solid(new THREE.SphereGeometry(r, 48, 32), skin);
  skull.scale.set(1.08, 0.93, 1);
  head.add(skull);

  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    const outer = solid(new THREE.ConeGeometry(r * 0.36, r * 0.62, 24), skin);
    outer.scale.z = 0.6;
    const pad = solid(new THREE.ConeGeometry(r * 0.24, r * 0.42, 24), inner);
    pad.scale.z = 0.4;
    pad.position.set(0, -r * 0.05, r * 0.15);
    ear.add(outer, pad);
    ear.position.set(s * r * 0.58, r * 0.72, -r * 0.05);
    ear.rotation.z = -s * 0.42;
    head.add(ear);
  }

  const rig = { blinkers: [], pupils: [], peekOpen: null, peekShut: null, r };
  for (const s of [-1, 1]) {
    const pivot = onFace(new THREE.Group(), r, s * r * 0.36, r * 0.04, 0);
    if (eyes === 'open') pivot.add(openEye(r, dark, white, rig));
    else {
      const arc = closedEye(r, dark, eyes);
      pivot.add(arc);
      if (peek && s === 1) {
        const eye = openEye(r, dark, white, null);
        eye.visible = false;
        pivot.add(eye);
        rig.peekOpen = eye;
        rig.peekShut = arc;
      }
    }
    rig.blinkers.push(pivot);
    head.add(pivot);
  }

  const nose = onFace(solid(new THREE.SphereGeometry(r * 0.075, 16, 12), inner), r, 0, -r * 0.14, 0);
  nose.scale.set(1.4, 0.9, 0.8);
  head.add(nose);

  for (const s of [-1, 1]) {
    const mouth = onFace(solid(new THREE.TorusGeometry(r * 0.06, r * 0.022, 6, 16, Math.PI), dark), r, s * r * 0.06, -r * 0.25, 0);
    mouth.rotateZ(Math.PI);
    head.add(mouth);
  }

  const whiskerMat = clay(CAT.white);
  for (const s of [-1, 1]) {
    for (const k of [-1, 0, 1]) {
      const len = r * 0.62;
      const ax = s * r * 0.4;
      const ay = -r * 0.16 + k * r * 0.08;
      const az = Math.sqrt(Math.max(r * r - ax * ax - ay * ay, 0)) + r * 0.02;
      const w = solid(new THREE.CylinderGeometry(r * 0.009, r * 0.009, len, 4), whiskerMat);
      w.castShadow = false;
      const tilt = k * 0.16 * s;
      w.rotation.z = Math.PI / 2 + tilt;
      w.position.set(ax + s * (len / 2) * Math.cos(tilt), ay + s * (len / 2) * Math.sin(tilt), az);
      head.add(w);
    }
  }

  return { group: head, rig };
}

function openEye(r, dark, white, rig) {
  const eye = new THREE.Group();
  const ring = solid(new THREE.SphereGeometry(r * 0.19, 24, 16), white);
  ring.scale.z = 0.3;
  const pupil = new THREE.Group();
  const ball = solid(new THREE.SphereGeometry(r * 0.155, 24, 16), dark);
  ball.scale.z = 0.4;
  ball.position.z = r * 0.03;
  const shine = solid(new THREE.SphereGeometry(r * 0.045, 12, 8), white);
  shine.position.set(-r * 0.05, r * 0.05, r * 0.09);
  pupil.add(ball, shine);
  eye.add(ring, pupil);
  if (rig) rig.pupils.push(pupil);
  return eye;
}

function closedEye(r, dark, style) {
  const arc = solid(new THREE.TorusGeometry(r * 0.12, r * 0.04, 8, 24, Math.PI), dark);
  if (style === 'closed') arc.rotation.z = Math.PI; // ‿
  return arc;
}

function makeTail(points, r, mat, { phase = 0, sway = 0.18 } = {}) {
  const base = points.map((p) => new THREE.Vector3(...p));
  const group = new THREE.Group();
  const tube = solid(new THREE.BufferGeometry(), mat);
  const tip = solid(new THREE.SphereGeometry(r, 16, 12), mat);
  group.add(tube, tip);
  const pts = base.map((p) => p.clone());
  function update(t, amp = 1) {
    base.forEach((p, i) => {
      const k = i / (base.length - 1);
      const w = k * k * amp * sway;
      pts[i].set(
        p.x + Math.sin(t * 1.6 + phase - i * 0.6) * w,
        p.y + Math.sin(t * 1.1 + phase - i * 0.4) * w * 0.4,
        p.z + Math.cos(t * 1.3 + phase - i * 0.6) * w * 0.7,
      );
    });
    tube.geometry.dispose();
    tube.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r, 10, false);
    tip.position.copy(pts[pts.length - 1]);
  }
  update(0);
  return { group, update };
}

function makeCapsule(r, len, mat, pos, rot = [0, 0, 0], scale = [1, 1, 1]) {
  const m = solid(new THREE.CapsuleGeometry(r, len, 10, 24), mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.scale.set(...scale);
  return m;
}

function buildCats() {
  const root = new THREE.Group();
  const stack = new THREE.Group();
  stack.position.y = -1.9;
  root.add(stack);

  const mat = {
    grey: clay(CAT.grey),
    orange: clay(CAT.orange),
    pink: clay(CAT.pink),
    inner: clay(CAT.inner),
  };

  // Grey: lying flat at the bottom, head on the right, asleep.
  const grey = new THREE.Group();
  grey.name = 'grey';
  const greyBody = makeCapsule(0.62, 1.5, mat.grey, [-0.45, 0.6, 0], [0, 0, Math.PI / 2], [0.9, 1, 1.05]);
  const greyHead = makeHead(0.78, CAT.grey, 'closed', { peek: true });
  greyHead.group.position.set(0.85, 0.8, 0.6);
  greyHead.group.rotation.set(0.06, -0.08, -0.05);
  const greyTail = makeTail(
    [[-1.3, 0.85, -0.15], [-1.75, 1.25, -0.2], [-2.05, 1.8, -0.2], [-2.0, 2.2, -0.15], [-2.25, 2.3, -0.1]],
    0.13, mat.grey, { phase: 0, sway: 0.14 },
  );
  grey.add(greyBody, greyHead.group, greyTail.group);
  for (const p of [[0.45, 0.2, 0.62], [-0.2, 0.2, 0.68], [-1.45, 0.2, 0.5]]) {
    grey.add(makeCapsule(0.2, 0.3, mat.grey, p, [Math.PI / 2, 0, 0]));
  }

  // Orange: lying on the grey cat, head front left, paws draped forward, tail up on the right.
  const orange = new THREE.Group();
  orange.name = 'orange';
  const orangeBody = makeCapsule(0.5, 1.3, mat.orange, [0.25, 1.55, -0.2], [0, 0, Math.PI / 2 - 0.1], [0.92, 1, 1]);
  const orangeHead = makeHead(0.7, CAT.orange, 'open');
  orangeHead.group.position.set(-0.55, 2.15, 0.35);
  orangeHead.group.rotation.set(0.05, 0.12, 0.05);
  const orangeTail = makeTail(
    [[0.9, 1.7, -0.25], [1.35, 2.0, -0.35], [1.65, 2.5, -0.35], [1.62, 2.9, -0.3], [1.45, 3.05, -0.25]],
    0.12, mat.orange, { phase: 1.7, sway: 0.2 },
  );
  orange.add(orangeBody, orangeHead.group, orangeTail.group);
  orange.add(makeCapsule(0.18, 0.5, mat.orange, [-1.0, 1.28, 0.42], [0, 0.3, Math.PI / 2]));
  orange.add(makeCapsule(0.18, 0.5, mat.orange, [-0.45, 1.22, 0.62], [0, 0.2, Math.PI / 2]));

  // Pink: sitting at the back, head top right, waving with its left paw.
  const pink = new THREE.Group();
  pink.name = 'pink';
  const pinkBody = solid(new THREE.SphereGeometry(0.62, 40, 28), mat.pink);
  pinkBody.position.set(0.55, 2.45, -0.6);
  pinkBody.scale.set(1, 1.25, 0.95);
  const pinkHead = makeHead(0.78, CAT.pink, 'happy');
  pinkHead.group.position.set(0.6, 3.4, -0.4);
  const arm = new THREE.Group();
  arm.position.set(0.05, 2.8, -0.35);
  arm.add(makeCapsule(0.17, 0.55, mat.pink, [0, 0.4, 0]));
  const paw = solid(new THREE.SphereGeometry(0.22, 24, 16), mat.pink);
  paw.position.set(0, 0.8, 0);
  const bean = solid(new THREE.SphereGeometry(0.1, 16, 12), mat.inner);
  bean.scale.z = 0.4;
  bean.position.set(0, 0.76, 0.2);
  arm.add(paw, bean);
  for (const [x, y] of [[-0.1, 0.9], [0, 0.95], [0.1, 0.9]]) {
    const toe = solid(new THREE.SphereGeometry(0.045, 12, 8), mat.inner);
    toe.scale.z = 0.5;
    toe.position.set(x, y, 0.18);
    arm.add(toe);
  }
  // Tail: out of the back of the body on the viewer's right, behind and outside the orange
  // tail, curling up beside the head.
  const pinkTail = makeTail(
    [[0.95, 1.95, -1.0], [1.5, 2.05, -1.2], [1.95, 2.5, -1.25], [2.05, 3.05, -1.15], [1.85, 3.35, -1.0]],
    0.13, mat.pink, { phase: 3.4, sway: 0.17 },
  );
  pink.add(pinkBody, pinkHead.group, arm, pinkTail.group);

  stack.add(grey, orange, pink);

  // Anchor for the floating "z Z" above the grey cat's head.
  const zzAnchor = new THREE.Object3D();
  zzAnchor.position.set(1.4, 1.75, 0.6);
  grey.add(zzAnchor);

  const blinkers = [
    { rig: orangeHead.rig, next: 2.2, t: -1 },
    { rig: pinkHead.rig, next: 3.4, t: -1 },
  ];
  const look = { from: new THREE.Vector2(), to: new THREE.Vector2(), t: 1, next: 1.2 };
  const react = { grey: -9, orange: -9, pink: -9 };
  let clock = 0;

  function update(t, dt) {
    clock = t;
    // Grey: slow breathing, tail barely moving; opens one eye for a moment when clicked.
    const breath = Math.sin(t * 1.4);
    greyBody.scale.x = 0.9 + breath * 0.03;
    greyHead.group.position.y = 0.8 + breath * 0.015;
    greyTail.update(t, 0.6);
    const peeking = t - react.grey < 1.6;
    greyHead.rig.peekOpen.visible = peeking;
    greyHead.rig.peekShut.visible = !peeking;

    // Orange: eyes dart around, tail sways.
    orangeTail.update(t, 1);
    look.next -= dt;
    if (look.next <= 0) {
      look.from.copy(look.to);
      const r = orangeHead.rig.r;
      look.to.set((Math.random() * 2 - 1) * r * 0.06, (Math.random() * 2 - 1) * r * 0.04);
      look.t = 0;
      look.next = 1 + Math.random() * 1.8;
    }
    look.t = Math.min(1, look.t + dt * 8);
    for (const p of orangeHead.rig.pupils) {
      p.position.x = THREE.MathUtils.lerp(look.from.x, look.to.x, look.t);
      p.position.y = THREE.MathUtils.lerp(look.from.y, look.to.y, look.t);
    }
    const startled = t - react.orange < 0.9 ? 1.25 : 1;
    for (const e of orangeHead.rig.blinkers) e.scale.x = THREE.MathUtils.lerp(e.scale.x, startled, 0.2);

    // Pink: waves (faster when clicked), head tilts.
    const excited = t - react.pink < 1.2;
    arm.rotation.z = 0.55 + Math.sin(t * (excited ? 11 : 5.5)) * (excited ? 0.45 : 0.32);
    pinkHead.group.rotation.z = Math.sin(t * 1.2) * 0.06;
    pinkTail.update(t, excited ? 1.6 : 0.9);

    // Blinks, out of sync.
    for (const b of blinkers) {
      b.next -= dt;
      if (b.next <= 0 && b.t < 0) b.t = 0;
      let s = 1;
      if (b.t >= 0) {
        b.t += dt / 0.18;
        s = 1 - Math.sin(Math.min(b.t, 1) * Math.PI) * 0.92;
        if (b.t >= 1) { b.t = -1; b.next = 2.5 + Math.random() * 3; }
      }
      for (const e of b.rig.blinkers) e.scale.y = s;
    }
  }

  function poke(name) { react[name] = clock; }

  // Wireframe swaps in low-poly copies: at ASCII resolution the full meshes have so many
  // lines per cell that they read as solid.
  function setWireframe(on) {
    root.traverse((o) => {
      if (!o.material) return;
      o.material.wireframe = on;
      if (!o.isMesh) return;
      if (on && !o.userData.fine) {
        if (o.userData.coarse === undefined) o.userData.coarse = coarse(o.geometry);
        if (o.userData.coarse) { o.userData.fine = o.geometry; o.geometry = o.userData.coarse; }
      } else if (!on && o.userData.fine) {
        o.geometry = o.userData.fine;
        o.userData.fine = null;
      }
    });
  }

  return { root, cats: { grey, orange, pink }, zzAnchor, update, poke, setWireframe };
}

// A low-poly copy of a sphere, capsule or cone, for the wireframe view; null for the rest.
function coarse(geo) {
  const p = geo.parameters;
  if (geo.type === 'SphereGeometry') {
    const big = p.radius > 0.3;
    return new THREE.SphereGeometry(p.radius, big ? 14 : 8, big ? 9 : 6);
  }
  if (geo.type === 'CapsuleGeometry') return new THREE.CapsuleGeometry(p.radius, p.length, 3, 10);
  if (geo.type === 'ConeGeometry') return new THREE.ConeGeometry(p.radius, p.height, 8);
  return null;
}

// Walk up from a raycast hit to the cat it belongs to.
function catNameOf(obj) {
  for (let o = obj; o; o = o.parent) if (['grey', 'orange', 'pink'].includes(o.name)) return o.name;
  return null;
}
