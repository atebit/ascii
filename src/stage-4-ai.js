// Stage 4: how we use it in design, now with AI. A token race (HTML mockup against ASCII
// frame) runs on enter, then a 3D carousel of 4 ASCII cards that an "AI" types in line by
// line. E makes a quick live edit on the front card. Background: data streams in depth.
STAGES[4] = (ctx) => {
  // ---------- Card art ----------
  const IW = 36;   // inner width of a card, in characters
  const BODY = 13; // body lines per card

  // Place text at columns: L([12, '[ Open app ]'], [30, '▾']).
  const L = (...segs) => segs.reduce((s, [col, text]) => s.padEnd(col) + text, '');
  const frame = (title, body) => {
    const lines = [...body];
    while (lines.length < BODY) lines.push('');
    return [
      `┌─ ${title} ${'─'.repeat(IW - title.length - 1)}┐`,
      ...lines.map((l) => `│ ${l.padEnd(IW)} │`),
      `└${'─'.repeat(IW + 2)}┘`,
    ];
  };
  const row = (s) => `│ ${s.padEnd(32)} │`;
  const mail = (dot, name, subject, age) => row(`${dot} ${name.padEnd(12)}${subject.padEnd(13)}${age.padStart(4)}`);
  const rule = (l, r) => `${l}${'─'.repeat(34)}${r}`;
  const listTop = [
    `┌ Inbox ${'─'.repeat(16)} [ Write ] ┐`,
    row(`${'Search mail...'.padEnd(23)}Sort: New`),
    rule('├', '┤'),
  ];
  const listEnd = [rule('├', '┤'), row('[ Reply ]  [ Archive ]  [ Flag ]'), rule('└', '┘'), '', '● unread   ○ read'];
  const treeTop = [
    'Route a person who opens the app',
    '',
    L([12, '[ Open app ]']),
    L([17, '│']),
    L([12, '< Account? >']),
  ];
  const routeTop = [
    'Form submit, with an error path',
    '',
    '[ Submit ]──▸[ Validate ]',
    L([18, '│']),
    L([10, '┌───────┴───────┐']),
    L([8, 'valid'], [24, 'invalid']),
    L([10, '▾'], [26, '▾']),
    L([6, '[ Save ]'], [21, '[ ! Error ]']),
    L([10, '│'], [20, 'back to the form']),
    L([10, '▾']),
    L([6, '[ Notify ]──▸ Alert the team']),
  ];
  const flowTop = [
    'Invite a teammate in 3 steps',
    '',
    '[ 1·Open ] › [ 2·Pick ] › [ 3·Done ]',
    L([4, '│'], [17, '│'], [30, '│']),
    L([0, 'Team page'], [13, 'Email, role'], [26, 'Invited']),
    L([0, '4 people'], [13, 'sam@mail.co'], [26, 'Sam, as']),
    L([0, '[ Invite ]'], [13, '● Editor'], [26, 'Editor']),
    L([13, '○ Viewer'], [26, 'Email sent']),
  ];

  const CARDS = [
    {
      title: '1 · DECISION TREE',
      ask: 'add a branch for invites: join the team',
      a: [
        ...treeTop,
        L([8, '┌────────┴────────┐']),
        L([8, '▾ yes'], [26, '▾ no']),
        L([3, '[ Sign in ]'], [21, '[ Sign up ]']),
        L([8, '│'], [26, '│']),
        L([8, '▾'], [26, '▾']),
        L([6, 'Home'], [20, 'Verify email']),
        L([2, 'Welcome back'], [20, 'Then profile']),
      ],
      b: [
        ...treeTop,
        L([5, '┌───────────┼───────────┐']),
        L([5, '▾ yes'], [17, '▾ invite'], [29, '▾ no']),
        L([0, '[ Sign in ]'], [12, '[ Accept ]'], [24, '[ Sign up ]']),
        L([5, '│'], [17, '│'], [29, '│']),
        L([5, '▾'], [17, '▾'], [29, '▾']),
        L([3, 'Home'], [13, 'Join team'], [24, 'Verify email']),
        L([0, 'Welcome back'], [13, 'as member'], [24, 'Then profile']),
      ],
    },
    {
      title: '2 · DATA ROUTE',
      ask: 'then email the person a receipt',
      a: routeTop,
      b: [
        ...routeTop,
        L([10, '▾']),
        L([5, '[ Receipt ]──▸ Email the user']),
      ],
    },
    {
      title: '3 · UI WIREFRAME',
      ask: 'Priya replied. Move her to the top',
      a: [
        'Inbox, list view',
        ...listTop,
        mail('●', 'Ana Ruiz', 'Team lunch?', '2m'),
        mail('●', 'Dale Kim', 'Draft slides', '14m'),
        mail('○', 'Priya Nair', 'Trip photos', '1d'),
        mail('○', 'Tom Bell', 'Weekly notes', '3d'),
        ...listEnd,
      ],
      b: [
        'Inbox, list view',
        ...listTop,
        mail('●', 'Priya Nair', 'Re: Trip pics', 'now'),
        mail('●', 'Ana Ruiz', 'Team lunch?', '2m'),
        mail('●', 'Dale Kim', 'Draft slides', '14m'),
        mail('○', 'Tom Bell', 'Weekly notes', '3d'),
        ...listEnd,
      ],
    },
    {
      title: '4 · MICRO-FLOW',
      ask: 'add an undo toast after Done',
      a: [...flowTop, '', '', '', '3 taps, no page loads'],
      b: [
        ...flowTop,
        L([30, '│']),
        L([30, '▾']),
        L([6, 'Toast: Sam invited [ Undo ]']),
        '3 taps, with 5s to undo',
      ],
    },
  ];
  for (const c of CARDS) {
    c.a = frame(c.title, c.a);
    c.b = frame(c.title, c.b);
  }

  // ---------- Styles ----------
  const style = el('style');
  style.textContent = `
    .layer-4 .s4 { position: absolute; inset: 44px 0 76px; display: flex; flex-direction: column; align-items: center;
      justify-content: space-evenly; overflow: hidden; padding: 0 16px; user-select: none; -webkit-user-select: none; }
    .layer-4 button { all: unset; cursor: pointer; }
    .layer-4 button:focus-visible { outline: 1px dashed var(--cyan); outline-offset: 3px; }

    .layer-4 .s4-race { display: grid; grid-template-columns: auto auto auto auto; column-gap: 14px; row-gap: 6px;
      align-items: center; padding: 8px 14px; background: rgba(0, 0, 0, .72); }
    .layer-4 .s4-race .lbl { font: 10px/1 var(--arcade); letter-spacing: .06em; text-align: right; white-space: nowrap; }
    .layer-4 .s4-race .bar { font: 14px/1 var(--mono); white-space: pre; }
    .layer-4 .s4-race .num { font: 12px/1 var(--mono); color: var(--ink); white-space: pre; min-width: 11ch; }
    .layer-4 .s4-race .tag { font: 9px/1 var(--arcade); min-width: 6em; }
    .layer-4 .lbl.s4-vs { color: var(--hot); }
    .layer-4 .rule.s4-vs { grid-column: 2 / span 2; font: 14px/1 var(--mono); color: var(--violet); opacity: .6; overflow: hidden; white-space: pre; }
    .layer-4 .go.s4-vs { font: 10px/1 var(--arcade); color: var(--gold); }
    .layer-4 .lbl.s4-html, .layer-4 .s4-html .fill { color: var(--orange); text-shadow: 0 0 8px rgba(255, 138, 61, .5); }
    .layer-4 .lbl.s4-ascii, .layer-4 .s4-ascii .fill { color: var(--cyan); text-shadow: 0 0 8px rgba(75, 227, 240, .6); }
    .layer-4 .s4-race .track { color: var(--dim); opacity: .35; }
    .layer-4 .s4-race .tag.win { color: var(--gold); animation: s4-blink .5s steps(1) infinite; }
    .layer-4 .s4-race .tag.done { color: var(--dim); }
    .layer-4 .s4-est { grid-column: 1 / -1; text-align: center; font: 8px/1.4 var(--arcade); color: var(--dim); letter-spacing: .08em; }
    .layer-4 .s4-est b { color: var(--gold); font-weight: normal; border: 0; }

    .layer-4 .s4-ring { display: grid; perspective: 1200px; touch-action: pan-y; cursor: grab; }
    .layer-4 .s4-card { grid-area: 1 / 1; margin: 0; padding: 6px 8px; background: rgba(3, 2, 10, .9);
      --cs: clamp(8px, min(calc((100vw - 40px) / 25), calc((100vh - 400px) / 18.5)), 14px);
      font: var(--cs)/1.15 var(--mono); width: calc(40ch + 16px); height: calc(var(--cs) * 1.15 * 15 + 12px); overflow: hidden; color: var(--ink);
      will-change: transform, opacity; backface-visibility: hidden; }
    .layer-4 .s4-card .b { color: var(--cyan); opacity: .75; }
    .layer-4 .s4-card .a { color: var(--hot); }
    .layer-4 .s4-card .k { color: var(--gold); }
    .layer-4 .s4-card .h { color: var(--hot); text-shadow: 0 0 6px var(--hot); }
    .layer-4 .s4-card .t { color: var(--gold); }
    .layer-4 .s4-card .cur { color: var(--hot); }
    .layer-4 .s4-card.front { text-shadow: 0 0 6px rgba(75, 227, 240, .35); }
    .layer-4 .s4-card.front .b { opacity: 1; }
    .layer-4 .s4-card .hl, .layer-4 .s4-card .hl * { animation: s4-hl 1.8s ease-out forwards; }

    .layer-4 .s4-ctrl { display: flex; align-items: center; gap: 18px; font: 11px/1 var(--arcade); color: var(--ink); }
    .layer-4 .s4-ctrl .turn { font: 22px/1 var(--mono); color: var(--cyan); padding: 4px 10px; text-shadow: 0 0 8px var(--cyan); }
    .layer-4 .s4-ctrl .turn:hover { color: var(--gold); text-shadow: 0 0 8px var(--gold); }
    .layer-4 .s4-ctrl .idx { min-width: 5em; text-align: center; }
    .layer-4 .s4-ctrl .edit { color: var(--gold); padding: 6px 4px; }
    .layer-4 .s4-ctrl .edit:hover { color: var(--hot); }
    .layer-4 .s4-ctrl .keys { color: var(--dim); font-size: 8px; }
    .layer-4 .s4-log { min-height: 1.4em; font: 12px/1.4 var(--mono); color: var(--dim); text-align: center; white-space: pre; }
    .layer-4 .s4-log .you { color: var(--cyan); }
    .layer-4 .s4-log .ai { color: var(--gold); }
    .layer-4 .s4-msg { text-align: center; }
    .layer-4 .s4-msg h2 { margin: 0 0 10px; font: clamp(10px, 1.5vw, 18px)/1.3 var(--arcade); color: var(--gold);
      text-shadow: 0 0 10px rgba(255, 197, 61, .55), 2px 2px 0 #7a2a00; letter-spacing: .04em; }
    .layer-4 .s4-msg p { margin: 0; font: clamp(8px, .9vw, 11px)/1.6 var(--arcade); color: var(--ink); }
    .layer-4 .s4-msg .w { opacity: 0; display: inline-block; transform: translateY(6px); transition: opacity .25s, transform .25s; }
    .layer-4 .s4-msg .w.on { opacity: 1; transform: none; }

    @keyframes s4-blink { 50% { opacity: 0; } }
    @keyframes s4-hl { 0%, 55% { color: var(--gold); text-shadow: 0 0 8px var(--gold); } 100% { } }

    @media (max-width: 640px) {
      .layer-4 .s4 { inset: 38px 0 84px; padding: 0 10px; }
      .layer-4 .s4-race { column-gap: 8px; padding: 6px 8px; }
      .layer-4 .s4-race .lbl { font-size: 7px; }
      .layer-4 .s4-race .bar, .layer-4 .rule.s4-vs { font-size: 12px; }
      .layer-4 .s4-race .num { font-size: 9px; min-width: 0; }
      .layer-4 .s4-race .tag { font-size: 7px; min-width: 0; }
      .layer-4 .s4-ctrl { gap: 10px; font-size: 9px; }
      .layer-4 .s4-ctrl .keys { display: none; }
      .layer-4 .s4-log { font-size: 10px; white-space: normal; }
    }
    @media (max-height: 760px) and (min-width: 641px) { .layer-4 .s4-msg h2 { margin-bottom: 6px; } }
  `;
  document.head.appendChild(style);

  // ---------- DOM ----------
  const words = (s) => s.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
  ctx.layer.innerHTML = `
    <div class="s4">
      <div class="s4-race" data-no-scramble aria-label="Token race: an HTML mockup against an ASCII frame">
        <span class="lbl s4-vs">VS.</span><span class="rule s4-vs"></span><span class="go s4-vs"></span>
        <span class="lbl s4-html">HTML MOCKUP</span><span class="bar s4-html"></span><span class="num s4-html"></span><span class="tag s4-html"></span>
        <span class="lbl s4-ascii">ASCII FRAME</span><span class="bar s4-ascii"></span><span class="num s4-ascii"></span><span class="tag s4-ascii"></span>
        <span class="s4-est"><b>ESTIMATES</b> · PLACEHOLDER COUNTS UNTIL WE MEASURE A REAL SCREEN</span>
      </div>
      <div class="s4-ring" data-no-swipe data-no-scramble>${CARDS.map((c, i) => `<pre class="s4-card" data-i="${i}" aria-label="${c.title}"></pre>`).join('')}</div>
      <div class="s4-ctrl">
        <button class="turn prev" aria-label="Previous card">◂</button>
        <span class="idx">1 / 4</span>
        <button class="turn next" aria-label="Next card">▸</button>
        <button class="edit">[E] EDIT</button>
        <span class="keys">[A D] TURN</span>
      </div>
      <div class="s4-log" data-no-scramble aria-live="polite"></div>
      <div class="s4-msg">
        <h2>${words('VERY, VERY FAST AND TOKEN EFFICIENT.')}</h2>
        <p>${words('THE AI READS IT, WRITES IT AND CHANGES IT IN SECONDS.')}</p>
      </div>
    </div>`;
  const $ = (s) => ctx.layer.querySelector(s);
  const ui = {
    ring: $('.s4-ring'),
    cards: [...ctx.layer.querySelectorAll('.s4-card')],
    idx: $('.s4-ctrl .idx'),
    log: $('.s4-log'),
    msgWords: [...ctx.layer.querySelectorAll('.s4-msg .w')],
    rule: $('.s4-vs.rule'),
    go: $('.s4-vs.go'),
    html: { bar: $('.bar.s4-html'), num: $('.num.s4-html'), tag: $('.tag.s4-html') },
    ascii: { bar: $('.bar.s4-ascii'), num: $('.num.s4-ascii'), tag: $('.tag.s4-ascii') },
  };

  // ---------- Token race ----------
  const HTML_TOK = 20000;
  const ASCII_TOK = 1000;
  const RACE_AT = 0.7;   // seconds after enter
  const RACE_DUR = 3.6;
  const PARTS = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉'];
  const race = { tok: 0, saved: 0, barW: 40, last: '' };

  const fmt = (n) => n.toLocaleString('en-US');
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
  function barText(v) {
    const eighths = Math.round((v / HTML_TOK) * race.barW * 8);
    const full = Math.floor(eighths / 8);
    const part = PARTS[eighths % 8];
    const track = race.barW - full - (part ? 1 : 0);
    return `<span class="fill">${'█'.repeat(full)}${part}</span><span class="track">${'░'.repeat(Math.max(0, track))}</span>`;
  }
  function drawRace(t) {
    const u = Math.min(1, Math.max(0, (t - RACE_AT) / RACE_DUR));
    race.tok = HTML_TOK * ease(u);
    const html = Math.round(race.tok);
    const asc = Math.min(ASCII_TOK, html);
    race.saved = Math.max(0, html - ASCII_TOK);
    const go = t < RACE_AT ? 'READY' : t < RACE_AT + 0.8 ? 'GO!' : '';
    const key = `${race.barW}|${Math.round(html / 25)}|${go}|${html >= HTML_TOK}|${u > 0}`;
    if (key === race.last) return;
    race.last = key;
    ui.go.textContent = go;
    const htmlDone = html >= HTML_TOK;
    const ascDone = asc >= ASCII_TOK;
    ui.html.bar.innerHTML = barText(html);
    ui.ascii.bar.innerHTML = barText(asc);
    ui.html.num.textContent = `~${fmt(htmlDone ? HTML_TOK : Math.round(html / 100) * 100)} TOK`;
    ui.ascii.num.textContent = `~${fmt(ascDone ? ASCII_TOK : Math.round(asc / 10) * 10)} TOK`;
    ui.html.tag.textContent = htmlDone ? 'DONE' : u > 0 ? 'WRITING' : '';
    ui.html.tag.className = `tag s4-html${htmlDone ? ' done' : ''}`;
    ui.ascii.tag.textContent = ascDone ? 'DONE!' : u > 0 ? 'WRITING' : '';
    ui.ascii.tag.className = `tag s4-ascii${ascDone ? ' win' : ''}`;
    if (ascDone && !race.cheered) { race.cheered = true; ctx.sfx('coin'); }
  }
  function sizeRace() {
    race.barW = window.innerWidth < 420 ? 12 : window.innerWidth < 640 ? 16 : window.innerWidth < 1000 ? 28 : 40;
    ui.rule.textContent = '─'.repeat(race.barW);
    race.last = '';
  }

  // ---------- Cards: typing, edits, carousel ----------
  const CURSOR = '█';
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function paint(s, title) {
    let h = esc(s)
      .replace(/\[[^\]]*\]/g, '<span class="k">$&</span>')
      .replace(/[─│┌┐└┘├┤┬┴┼]+/g, '<span class="b">$&</span>')
      .replace(/[▾▸›]/g, '<span class="a">$&</span>')
      .replace(/●/g, '<span class="h">●</span>');
    if (title) h = h.replace(title, `<span class="t">${title}</span>`);
    return h;
  }

  let now = 0; // stage time, seconds
  const cards = CARDS.map((c, i) => ({
    ...c,
    i,
    el: ui.cards[i],
    lines: c.a,
    prev: c.a,
    edited: false,
    order: new Map(),  // line index -> typing order
    start: 0,
    lineT: 0.05,
    hl: false,
    hlUntil: 0,
    doneAt: 0,
    onDone: null,
    lastK: -1,
    html: '',
  }));

  function type(c, { prev, lines, at, lineT, hl }) {
    c.prev = prev;
    c.lines = lines;
    c.order = new Map();
    lines.forEach((l, i) => { if (l !== prev[i]) c.order.set(i, c.order.size); });
    c.start = at;
    c.lineT = lineT;
    c.hl = hl;
    c.doneAt = at + c.order.size * lineT;
    c.hlUntil = hl ? c.doneAt + 2 : 0;
    c.lastK = -1;
  }
  const blank = () => new Array(BODY + 2).fill('');
  const drawIn = (c, at) => type(c, { prev: blank(), lines: c.lines, at, lineT: 0.045, hl: false });

  function renderCard(c, isFront) {
    const out = [];
    let k = -1;
    for (let i = 0; i < c.lines.length; i++) {
      const o = c.order.get(i);
      let text;
      let typing = false;
      if (o === undefined) text = c.lines[i];
      else {
        const p = (now - c.start - o * c.lineT) / c.lineT;
        if (p <= 0) text = c.prev[i];
        else if (p < 1) { text = c.lines[i].slice(0, Math.ceil(c.lines[i].length * p)); typing = true; k = o; }
        else text = c.lines[i];
      }
      let h = paint(text, i === 0 ? c.title : '');
      if (typing) h += `<span class="cur">${CURSOR}</span>`;
      if (o !== undefined && c.hl && now < c.hlUntil) h = `<span class="hl">${h}</span>`;
      out.push(h);
    }
    if (isFront && k !== c.lastK && k >= 0) ctx.sfx('type');
    c.lastK = k;
    const html = out.join('\n');
    if (html !== c.html) { c.html = html; c.el.innerHTML = html; }
    if (c.onDone && now >= c.doneAt) { const f = c.onDone; c.onDone = null; f(); }
  }

  const ring = { rot: 0, target: 0, w: 0 };
  const front = () => ((Math.round(ring.target) % 4) + 4) % 4;

  function turn(d) {
    ring.target += d;
    const c = cards[front()];
    if (now >= c.doneAt) drawIn(c, now + 0.15);
    ui.idx.textContent = `${front() + 1} / 4`;
    ctx.sfx('blip');
  }

  function log(html) { ui.log.innerHTML = html; }
  function edit() {
    const c = cards[front()];
    if (now < c.doneAt) return;
    const next = c.edited ? c.a : c.b;
    const ask = c.edited ? 'undo that' : c.ask;
    const changed = next.filter((l, i) => l !== c.lines[i]).join('').replace(/ +/g, ' ').length;
    const tok = Math.max(20, Math.round(changed / 3 / 10) * 10);
    type(c, { prev: c.lines, lines: next, at: now + 0.45, lineT: 0.11, hl: true });
    c.edited = !c.edited;
    log(`<span class="you">YOU ›</span> "${esc(ask)}"`);
    c.onDone = () => log(`<span class="you">YOU ›</span> "${esc(ask)}"   <span class="ai">AI › DONE · ~${tok} TOKENS</span>`);
    ctx.sfx('select');
  }

  function placeCards(dt) {
    const k = 1 - Math.exp(-dt * 9);
    ring.rot += (ring.target - ring.rot) * k;
    if (Math.abs(ring.target - ring.rot) < 0.0005) ring.rot = ring.target;
    const w = ring.w || (ring.w = ui.ring.offsetWidth);
    const f = front();
    for (const c of cards) {
      const a = ((((c.i - ring.rot) % 4) + 6) % 4 - 2) * (Math.PI / 2); // wrapped to -180..180 deg
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const x = sin * w * 0.78;
      const z = (cos - 1) * w * 0.55;
      const ry = -a * (180 / Math.PI) * 0.47;
      const vis = (cos + 1) / 2;
      c.el.style.transform = Math.abs(a) < 1e-4 ? 'none' : `translate3d(${x.toFixed(1)}px,0,${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg)`;
      c.el.style.opacity = (0.12 + 0.88 * vis ** 1.6).toFixed(3);
      c.el.style.zIndex = String(Math.round(vis * 100));
      c.el.classList.toggle('front', c.i === f);
    }
  }

  // Controls: buttons, click a side card to bring it round, swipe the ring.
  $('.s4-ctrl .prev').addEventListener('click', () => turn(-1));
  $('.s4-ctrl .next').addEventListener('click', () => turn(1));
  $('.s4-ctrl .edit').addEventListener('click', () => edit());
  let swipe = null;
  ui.ring.addEventListener('pointerdown', (e) => { swipe = { x: e.clientX, y: e.clientY }; });
  ui.ring.addEventListener('pointerup', (e) => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { turn(dx < 0 ? 1 : -1); return; }
    const hit = e.target.closest?.('.s4-card');
    if (!hit) return;
    const d = ((+hit.dataset.i - front()) % 4 + 4) % 4;
    if (d === 1) turn(1);
    else if (d === 3) turn(-1);
    else if (d === 2) turn(2);
  });

  // ---------- Background: data streams flowing toward the camera ----------
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 25, 190);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
  const stars = makeStars({ count: 600, colors: [PALETTE.ink, PALETTE.cyan, PALETTE.violet] });
  scene.add(stars);

  const LANES = 72;
  const PER = 14;
  const DEPTH = 210;
  const lanes = [];
  const sPos = new Float32Array(LANES * PER * 3);
  const sCol = new Float32Array(LANES * PER * 3);
  const tint = new THREE.Color();
  const laneColors = [PALETTE.cyan, PALETTE.cyan, PALETTE.hot, PALETTE.gold, PALETTE.violet];
  for (let l = 0; l < LANES; l++) {
    const ang = Math.random() * Math.PI * 2;
    const r = 10 + Math.random() * 38;
    const lane = { x: Math.cos(ang) * r, y: Math.sin(ang) * r * 0.62, z0: Math.random() * DEPTH, speed: 16 + Math.random() * 26, gap: 1.2 + Math.random() * 1.4 };
    lanes.push(lane);
    tint.set(laneColors[l % laneColors.length]);
    for (let k = 0; k < PER; k++) {
      const b = k === 0 ? 1 : 0.85 * (1 - k / PER);
      sCol.set([tint.r * b, tint.g * b, tint.b * b], (l * PER + k) * 3);
    }
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
  const streams = new THREE.Points(sGeo, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true }));
  streams.frustumCulled = false;
  scene.add(streams);
  let travel = 0;

  function flow(dt, t) {
    // Streams rush while the race runs, then settle to a steady flow.
    const racing = t > RACE_AT && t < RACE_AT + RACE_DUR;
    const mul = racing ? 2.6 : 1;
    travel += dt * mul;
    for (let l = 0; l < LANES; l++) {
      const s = lanes[l];
      const head = ((s.z0 + s.speed * travel) % DEPTH) - DEPTH + 8;
      for (let k = 0; k < PER; k++) {
        const j = (l * PER + k) * 3;
        sPos[j] = s.x;
        sPos[j + 1] = s.y;
        sPos[j + 2] = head - k * s.gap * mul;
      }
    }
    sGeo.attributes.position.needsUpdate = true;
  }

  function sizePoints() {
    const s = 2 / ctx.renderer.getPixelRatio();
    streams.material.size = s;
    stars.material.size = s;
  }

  function onResize() {
    ring.w = 0;
    sizeRace();
    sizePoints();
  }
  window.addEventListener('resize', onResize);

  return {
    scene,
    camera,
    enter() {
      ctx.setAscii({ edges: false, fill: 0.18, ridges: true });
      now = 0;
      travel = 0;
      race.cheered = false;
      ring.rot = ring.target = 0;
      ui.idx.textContent = '1 / 4';
      log('');
      onResize();
      cards.forEach((c, i) => {
        c.edited = false;
        c.lines = c.a;
        c.onDone = null;
        c.html = '';
        drawIn(c, 0.3 + [0, 0.9, 1.5, 0.9][i]);
      });
      ui.msgWords.forEach((w) => w.classList.remove('on'));
    },
    update(t, dt) {
      now = t;
      drawRace(t);
      placeCards(dt);
      cards.forEach((c) => renderCard(c, c.i === front()));
      // The message lands word by word once the ASCII frame wins.
      const shown = Math.floor((t - RACE_AT - 0.9) / 0.12);
      ui.msgWords.forEach((w, i) => { if (i < shown && !w.classList.contains('on')) w.classList.add('on'); });
      flow(dt, t);
      camera.rotation.z = Math.sin(t * 0.25) * 0.08;
      stars.rotation.z = t * 0.01;
    },
    onKey(e) {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === ',') turn(-1);
      else if (k === 'd' || k === '.') turn(1);
      else if (k === 'e') edit();
      else return false;
      return true;
    },
    hud: () => {
      const s = String(Math.round(race.saved)).padStart(6, '0');
      return { tl: 'STAGE 04 · HOW WE USE IT WITH AI', tr: `TOKENS SAVED ${s.slice(0, 3)},${s.slice(3)}` };
    },
  };
};
