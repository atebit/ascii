// Stage 5 placeholder: replace with the real stage (see the contract in game-core.js).
STAGES[5] = (ctx) => {
  const scene = new THREE.Scene();
  scene.add(makeStars());
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
  ctx.layer.innerHTML = '<h1 style="position:absolute;top:45%;width:100%;text-align:center;font:24px var(--arcade);color:var(--gold)">HOW TO GET STARTED</h1>';
  return {
    scene,
    camera,
    update(t) { camera.position.z = -t * 4; },
    hud: () => ({ tl: 'STAGE 05 · HOW TO GET STARTED' }),
  };
};
