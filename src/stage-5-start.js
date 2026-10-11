// Stage 5: how to get started. An arcade "CONTINUE?" screen: a big block-letter countdown
// ticks 9 to 0 and loops, and a move list gives the prompts to say to the agent. Enter copies
// the selected prompt; the last move downloads the skill as a zip (zip.js, SKILL_FILES from
// build.py). Copy is team-agnostic: the page is shared outside the repo. Background: a slow
// star field and the 3 cats, dozing, as a cameo.
STAGES[5] = (ctx) => {
  // ANSI Shadow digits, 6 rows each.
  const DIGITS = [
    [' ██████╗ ', '██╔═████╗', '██║██╔██║', '████╔╝██║', '╚██████╔╝', ' ╚═════╝ '],
    [' ██╗', '███║', '╚██║', ' ██║', ' ██║', ' ╚═╝'],
    ['██████╗ ', '╚════██╗', ' █████╔╝', '██╔═══╝ ', '███████╗', '╚══════╝'],
    ['██████╗ ', '╚════██╗', ' █████╔╝', ' ╚═══██╗', '██████╔╝', '╚═════╝ '],
    ['██╗  ██╗', '██║  ██║', '███████║', '╚════██║', '     ██║', '     ╚═╝'],
    ['███████╗', '██╔════╝', '███████╗', '╚════██║', '███████║', '╚══════╝'],
    [' ██████╗ ', '██╔════╝ ', '███████╗ ', '██╔═══██╗', '╚██████╔╝', ' ╚═════╝ '],
    ['███████╗', '╚════██║', '    ██╔╝', '   ██╔╝ ', '   ██║  ', '   ╚═╝  '],
    [' █████╗ ', '██╔══██╗', '╚█████╔╝', '██╔══██╗', '╚█████╔╝', ' ╚════╝ '],
    [' █████╗ ', '██╔══██╗', '╚██████║', ' ╚═══██║', ' █████╔╝', ' ╚════╝ '],
  ];
  const digitHtml = (n) => DIGITS[n]
    .map((r, i) => `<span class="r${i}">${r.replace(/█+/g, '<b>$&</b>')}</span>`)
    .join('\n');

  const ZIP_NAME = 'design-wireframe-ascii.zip';
  const MOVES = [
    { name: 'SKETCH ONE SCREEN', mode: 'DIVERGE',
      say: "I'm working on {project} and I'd like to explore {a screen} with the ascii wireframe skill." },
    { name: 'GO WIDE', mode: 'DIVERGE 10+',
      say: "I'm working on {project} and I'd like to go wide on {a screen or flow} with the ascii wireframe skill, 10 different concepts." },
    { name: 'MAP A FLOW', mode: 'DETAIL',
      say: "I'm working on {project} and I'd like to map the step-by-step flow for {an interaction} with the ascii wireframe skill." },
    { name: 'DOWNLOAD THE SKILL (.ZIP)', mode: 'DOWNLOAD', download: true,
      say: `${ZIP_NAME}: the skill, its templates and a README with install steps` },
  ];

  // ---------- Styles ----------
  const style = el('style');
  style.textContent = `
    .layer-5 .s5 { position: absolute; inset: 44px 0 76px; display: flex; flex-direction: column; align-items: center;
      justify-content: space-evenly; padding: 0 16px; overflow: hidden; }
    .layer-5 button { all: unset; cursor: pointer; }
    .layer-5 .s5-cont { font: clamp(14px, 2.4vw, 26px)/1 var(--arcade); letter-spacing: .5em; margin-right: -.5em; color: var(--hot);
      text-shadow: 0 0 12px rgba(255, 61, 139, .7), 3px 3px 0 #3a0a2a; animation: s5-blink 1.1s steps(1) infinite; }
    .layer-5 .s5-digit { margin: 0; font: clamp(12px, min(3.2vh, 4.4vw), 30px)/1 var(--mono); white-space: pre; color: var(--violet); }
    .layer-5 .s5-digit b { font-weight: normal; }
    .layer-5 .s5-digit .r0 b, .layer-5 .s5-digit .r1 b { color: #ffd76a; }
    .layer-5 .s5-digit .r2 b, .layer-5 .s5-digit .r3 b { color: var(--gold); }
    .layer-5 .s5-digit .r4 b, .layer-5 .s5-digit .r5 b { color: var(--orange); }
    .layer-5 .s5-digit b { text-shadow: 0 0 14px rgba(255, 170, 61, .55); }
    .layer-5 .s5-digit.tick { animation: s5-tick .45s cubic-bezier(.2, 1.6, .4, 1); }
    .layer-5 .s5-digit.zero b { color: var(--hot); text-shadow: 0 0 14px rgba(255, 61, 139, .8); }
    .layer-5 .s5-thanks { min-height: 2.2em; text-align: center; font: clamp(9px, 1.2vw, 14px)/1.6 var(--arcade); color: var(--gold);
      visibility: hidden; }
    .layer-5 .s5-thanks.seen { visibility: visible; opacity: .55; }
    .layer-5 .s5-thanks.now { visibility: visible; opacity: 1; animation: s5-blink .5s steps(1) infinite; text-shadow: 0 0 10px rgba(255, 197, 61, .7); }
    .layer-5 .s5-thanks button { display: block; margin: 4px auto 0; font: clamp(7px, .8vw, 10px)/1.4 var(--arcade); color: var(--cyan); }
    .layer-5 .s5-thanks button:hover { color: var(--ink); }

    .layer-5 .s5-moves { width: min(760px, 100%); background: rgba(0, 0, 0, .7); padding: 10px 14px 12px; }
    .layer-5 .s5-head, .layer-5 .s5-row { display: grid; grid-template-columns: 2.2em 2em minmax(0, 1fr) 7.5em;
      align-items: baseline; column-gap: 8px; }
    .layer-5 .s5-head { font: 9px/1.6 var(--arcade); color: var(--hot); letter-spacing: .06em; }
    .layer-5 .s5-head span:first-child { grid-column: 1 / 4; padding-left: 4.2em; }
    .layer-5 .s5-head span:last-child { grid-column: 4; text-align: right; color: var(--violet); }
    .layer-5 .s5-rule { font: 14px/1 var(--mono); color: var(--violet); opacity: .6; white-space: pre; overflow: hidden; margin: 4px 0 6px; }
    .layer-5 .s5-row { padding: 7px 0; color: var(--dim); text-decoration: none; cursor: pointer; font: 12px/1.3 var(--mono); }
    .layer-5 .s5-row .mk { color: var(--hot); visibility: hidden; text-align: center; }
    .layer-5 .s5-row .n, .layer-5 .s5-row .nm { font: 10px/1.3 var(--arcade); }
    .layer-5 .s5-row .say { grid-column: 3 / -1; grid-row: 2; margin-top: 5px; color: var(--ink); opacity: .7; font-size: 13px;
      line-height: 1.45; overflow-wrap: anywhere; }
    .layer-5 .s5-row .ph { color: var(--gold); }
    .layer-5 .s5-row .md { font: 8px/1.3 var(--arcade); color: var(--violet); text-align: right; }
    .layer-5 .s5-row.sel { color: var(--gold); text-shadow: 0 0 10px rgba(255, 197, 61, .65); }
    .layer-5 .s5-row.sel .mk { visibility: visible; animation: s5-blink .6s steps(1) infinite; }
    .layer-5 .s5-row.sel .say { color: var(--cyan); opacity: 1; text-shadow: 0 0 10px rgba(75, 227, 240, .6); }
    .layer-5 .s5-row.sel .ph { color: var(--gold); text-shadow: 0 0 10px rgba(255, 197, 61, .7); }
    .layer-5 .s5-row.flash .md { color: var(--hot); }
    .layer-5 .s5-row.dl .say { color: var(--gold); }
    .layer-5 .s5-status { min-height: 1.5em; font: 11px/1.5 var(--arcade); color: var(--hot); text-align: center; text-shadow: 0 0 10px rgba(255, 61, 139, .7); }
    .layer-5 .s5-status.pop { animation: s5-pop .5s ease-out; }
    .layer-5 .s5-status .lc { font: 13px/1.5 var(--mono); color: var(--cyan); text-shadow: 0 0 8px rgba(75, 227, 240, .6); }
    .layer-5 .s5-keys { font: 9px/1.8 var(--arcade); color: var(--dim); text-align: center; }
    .layer-5 .s5-keys b { color: var(--cyan); font-weight: normal; }
    .layer-5 .s5-skill { margin-top: 4px; font: 12px/1.5 var(--mono); color: var(--ink); opacity: .8; text-align: center; }
    .layer-5 .s5-skill code { color: var(--gold); font: inherit; white-space: nowrap; }
    .layer-5 .s5-skill .nw { white-space: nowrap; }
    .layer-5 .s5-skill .ph { color: var(--gold); }
    .layer-5 .s5-zz { position: absolute; pointer-events: none; font: 11px/1 var(--arcade); color: var(--cyan); }
    .layer-5 .s5-zz span { position: absolute; opacity: 0; animation: s5-zz 3.6s linear infinite; }
    .layer-5 .s5-zz span:nth-child(2) { animation-delay: 1.2s; font-size: 14px; }
    .layer-5 .s5-zz span:nth-child(3) { animation-delay: 2.4s; font-size: 17px; }

    @keyframes s5-blink { 50% { opacity: .15; } }
    @keyframes s5-tick { from { transform: scale(1.18); filter: brightness(1.8); } to { transform: none; filter: none; } }
    @keyframes s5-pop { from { transform: scale(1.4); } to { transform: none; } }
    @keyframes s5-zz { 0% { opacity: 0; transform: translate(0, 0); } 15% { opacity: .9; }
      100% { opacity: 0; transform: translate(26px, -48px); } }

    @media (max-width: 640px) {
      .layer-5 .s5 { inset: 38px 0 84px; padding: 0 10px; }
      .layer-5 .s5-cont { letter-spacing: .3em; margin-right: -.3em; }
      .layer-5 .s5-moves { padding: 8px 8px 10px; }
      .layer-5 .s5-head, .layer-5 .s5-row { grid-template-columns: 1.6em 1.6em minmax(0, 1fr); column-gap: 6px; }
      .layer-5 .s5-head span:last-child, .layer-5 .s5-row .md { display: none; }
      .layer-5 .s5-head span:first-child { grid-column: 1 / -1; padding-left: 0; text-align: center; }
      .layer-5 .s5-row { padding: 5px 0; }
      .layer-5 .s5-row .say { grid-column: 3; font-size: 11px; margin-top: 3px; }
      .layer-5 .s5-row .n, .layer-5 .s5-row .nm { font-size: 8px; }
      .layer-5 .s5-status { font-size: 8px; }
      .layer-5 .s5-status .lc { display: block; font-size: 11px; }
      .layer-5 .s5-keys { font-size: 7px; }
      .layer-5 .s5-skill { font-size: 10px; }
    }
  `;
  document.head.appendChild(style);

  // ---------- DOM ----------
  ctx.layer.innerHTML = `
    <div class="s5">
      <div class="s5-cont">CONTINUE?</div>
      <pre class="s5-digit" data-no-scramble aria-label="Countdown"></pre>
      <div class="s5-thanks">THANKS FOR PLAYING<button class="s5-title">[ESC] TITLE SCREEN</button></div>
      <div class="s5-moves" role="listbox" aria-label="Choose your move">
        <div class="s5-head"><span>CHOOSE YOUR MOVE · SAY THIS TO THE AGENT</span><span>MODE</span></div>
        <div class="s5-rule">${'─'.repeat(120)}</div>
        ${MOVES.map((m, i) => {
          const say = m.download ? m.say : `"${m.say.replace(/\{[^}]*\}/g, '<span class="ph">$&</span>')}"`;
          return `<div class="s5-row${m.download ? ' dl' : ''}" data-i="${i}" role="option">
            <span class="mk">▶</span><span class="n">${i + 1}</span><span class="nm">${m.name}</span>
            <span class="say">${say}</span><span class="md">${m.mode}</span></div>`;
        }).join('')}
      </div>
      <div class="s5-status" data-no-scramble aria-live="polite"></div>
      <div>
        <div class="s5-keys"><b>[↑ ↓]</b> CHOOSE &nbsp; <b>[ENTER]</b> COPY OR DOWNLOAD &nbsp; <b>[ESC]</b> TITLE SCREEN</div>
        <div class="s5-skill">Each prompt uses the ascii wireframe skill. Download it with move 4, add it to your agent, then paste a prompt and fill in the <span class="nw ph">{ }</span>.</div>
      </div>
      <div class="s5-zz" aria-hidden="true"><span>z</span><span>z</span><span>Z</span></div>
    </div>`;
  const $ = (s) => ctx.layer.querySelector(s);
  const ui = {
    digit: $('.s5-digit'),
    thanks: $('.s5-thanks'),
    rows: [...ctx.layer.querySelectorAll('.s5-row')],
    status: $('.s5-status'),
    zz: $('.s5-zz'),
  };

  // ---------- Move list ----------
  let sel = 0;
  let statusTimer = 0;
  function select(i) {
    sel = (i + MOVES.length) % MOVES.length;
    ui.rows.forEach((r, j) => {
      r.classList.toggle('sel', j === sel);
      r.setAttribute('aria-selected', String(j === sel));
    });
  }
  function status(text, html = '', ms = 2600) {
    ui.status.textContent = text;
    if (html) ui.status.insertAdjacentHTML('beforeend', html);
    ui.status.classList.remove('pop');
    void ui.status.offsetWidth;
    ui.status.classList.add('pop');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { ui.status.textContent = ''; }, ms);
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for pages opened from a file or without clipboard permission.
      const ta = el('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  }
  // The skill as design-wireframe-ascii.zip, with one top-level design-wireframe-ascii/ folder.
  function download() {
    try {
      const files = Object.entries(SKILL_FILES);
      const dirs = [...new Set(files.map(([p]) => p.slice(0, p.indexOf('/') + 1)))].map((d) => [d, '']);
      const url = URL.createObjectURL(new Blob([zipStore([...dirs, ...files])], { type: 'application/zip' }));
      const a = el('a');
      a.href = url;
      a.download = ZIP_NAME;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
  function flashRow(row, text, mode) {
    row.classList.remove('flash');
    void row.offsetWidth;
    row.classList.add('flash');
    const md = row.querySelector('.md');
    md.textContent = text;
    setTimeout(() => { md.textContent = mode; row.classList.remove('flash'); }, 1400);
  }
  async function activate() {
    const m = MOVES[sel];
    const row = ui.rows[sel];
    if (m.download) {
      const ok = download();
      ctx.sfx(ok ? 'coin' : 'blip');
      if (ok) status('DOWNLOADED! ', '<span class="lc">unzip into .claude/skills/ or .cursor/skills/</span>', 4200);
      else status('DOWNLOAD FAILED. TRY AGAIN');
      flashRow(row, ok ? 'SAVED!' : 'TRY AGAIN', m.mode);
      return;
    }
    const ok = await copy(m.say);
    ctx.sfx(ok ? 'coin' : 'blip');
    status(ok ? 'COPIED! FILL IN THE { }' : 'COPY BLOCKED. SELECT THE PROMPT AND COPY IT');
    flashRow(row, ok ? 'COPIED!' : 'TRY AGAIN', m.mode);
  }
  ui.rows.forEach((r, i) => {
    r.addEventListener('mouseenter', () => { if (sel !== i) { select(i); ctx.sfx('blip'); } });
    r.addEventListener('click', () => { select(i); activate(); });
  });
  $('.s5-title').addEventListener('click', () => ctx.go(1));

  // ---------- Countdown ----------
  const STEP = 1;      // seconds per digit
  const HOLD = 3;      // seconds held on 0
  const CYCLE = 9 * STEP + HOLD;
  const cd = { shown: -1, seen: false };
  function countdown(t) {
    const u = (t - 0.4) % CYCLE;
    const n = t < 0.4 ? 9 : Math.max(0, 9 - Math.floor(u / STEP));
    if (n !== cd.shown) {
      cd.shown = n;
      ui.digit.innerHTML = digitHtml(n);
      ui.digit.classList.toggle('zero', n === 0);
      ui.digit.classList.remove('tick');
      void ui.digit.offsetWidth;
      ui.digit.classList.add('tick');
      if (t > 0.4) ctx.sfx(n === 0 ? 'meow' : 'blip');
      if (n === 0) cd.seen = true;
      ui.thanks.classList.toggle('now', n === 0);
      ui.thanks.classList.toggle('seen', cd.seen && n !== 0);
    }
  }

  // ---------- Background: slow stars and the cats, dozing ----------
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
  camera.position.set(0, 0, 12);
  const stars = makeStars({ count: 1100, spread: 220, depth: 260, colors: [PALETTE.ink, PALETTE.cyan, PALETTE.hot, PALETTE.violet] });
  stars.position.z = -10;
  scene.add(stars);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9a08f, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 6, 8);
  scene.add(key);
  const kit = buildCats();
  scene.add(kit.root);
  const proj = new THREE.Vector3();

  // Park the cats to the right of the countdown digit, sized to the screen.
  function placeCats() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const show = w >= 900 && h >= 560;
    kit.root.visible = show;
    ui.zz.style.display = show ? '' : 'none';
    if (!show) return;
    const r = ui.digit.getBoundingClientRect();
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const halfW = halfH * (w / h);
    const sx = Math.min(r.right + w * 0.2, w * 0.82);
    const sy = r.top + r.height * 0.5;
    kit.root.position.set((sx / w * 2 - 1) * halfW, -(sy / h * 2 - 1) * halfH, 0);
    kit.root.scale.setScalar(0.42);
  }

  function sizePoints() { stars.material.size = 2 / ctx.renderer.getPixelRatio(); }
  window.addEventListener('resize', () => { if (ctx.layer.classList.contains('on')) { placeCats(); sizePoints(); } });

  return {
    scene,
    camera,
    enter() {
      ctx.setAscii({ fill: 0.3 });
      cd.shown = -1;
      cd.seen = false;
      ui.thanks.className = 's5-thanks';
      ui.status.textContent = '';
      select(0);
      sizePoints();
      requestAnimationFrame(placeCats);
    },
    update(t, dt) {
      countdown(t);
      stars.rotation.z = t * 0.012;
      stars.position.z = -10 + Math.sin(t * 0.15) * 4;
      camera.position.y = Math.sin(t * 0.3) * 0.08;
      if (kit.root.visible) {
        kit.update(t, dt);
        kit.root.rotation.y = -0.35 + Math.sin(t * 0.25) * 0.3;
        kit.zzAnchor.getWorldPosition(proj).project(camera);
        ui.zz.style.left = `${(proj.x * 0.5 + 0.5) * window.innerWidth}px`;
        ui.zz.style.top = `${(-proj.y * 0.5 + 0.5) * window.innerHeight - 44}px`;
      }
    },
    onKey(e) {
      if (e.key === 'ArrowUp') { select(sel - 1); ctx.sfx('blip'); return true; }
      if (e.key === 'ArrowDown') { select(sel + 1); ctx.sfx('blip'); return true; }
      if (e.key === 'Enter') { activate(); return true; }
      return false;
    },
    hud: () => ({ tl: 'STAGE 05 · HOW TO GET STARTED', tr: 'HI 999999', bl: 'CREDIT 00', br: 'GAME CLEAR' }),
  };
};
