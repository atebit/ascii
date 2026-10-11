// Background music: an original darkwave loop, synthesized live with the Web Audio API.
// No samples, no files. SFX.toggle starts and stops it; go() calls MUSIC.stage(n).
//
//   MUSIC.start(ac)   build the graph on ac, fade in over ~2s from bar 1
//   MUSIC.stop()      fade out over 0.5s, then stop scheduling and tear the graph down
//   MUSIC.stage(n)    a short filter swell on a stage change (no-op while silent)
//   MUSIC.stats()     voices live and played, position and state, for console checks
//
// D minor, 92 BPM, 16th-note grid. The 8-bar progression Dm Dm Bb Bb Gm Gm Eb A plays four
// times as a 32-bar loop:
//   bars  1–8   intro      pad, sub bass, 8th-note arp behind a closed filter, hats creep in
//   bars  9–16  build      arp goes to 16ths and opens, pulse bass, kick, offbeat hats
//   bars 17–24  full       snare, 8th hats and a slow lead line through the echo
//   bars 25–32  breakdown  drums thin out, the filter closes back to where bar 1 starts
// The arp filter's cutoff ends the loop where it began, so the loop point is seamless.
//
// Notes are scheduled ahead on AudioContext time (lookahead scheduler); the interval timer
// only decides when to look ahead. Every note voice disconnects itself when it ends.
const MUSIC_BPM = 92;
const MUSIC_STEP = 60 / MUSIC_BPM / 4;
const MUSIC_BARS = 32;
const MUSIC_LEVEL = 0.13; // master level: about 9 dB under the SFX bleeps (RMS)
const MUSIC_LOOKAHEAD = 0.15;

const MUSIC_CHORDS = {
  Dm: { root: 38, pad: [57, 62, 65], arp: [62, 65, 69, 72, 76] },
  Bb: { root: 34, pad: [58, 62, 65], arp: [58, 62, 65, 69, 72] },
  Gm: { root: 31, pad: [58, 62, 67], arp: [55, 62, 65, 70, 74] },
  Eb: { root: 39, pad: [58, 63, 67], arp: [58, 63, 67, 70, 74] },
  A: { root: 33, pad: [57, 61, 64], arp: [57, 61, 64, 67, 69] },
};
const MUSIC_PROG = ['Dm', 'Dm', 'Bb', 'Bb', 'Gm', 'Gm', 'Eb', 'A'];
const MUSIC_ARP = [0, 2, 4, 1, 3, 2, 4, 3]; // index into the chord's arp tones, per 16th
// Lead line for the full section: [bar in cycle, step, midi, length in 16ths]
const MUSIC_LEAD = [
  [0, 0, 81, 8], [0, 8, 77, 4], [0, 12, 76, 4], [1, 0, 74, 14],
  [2, 0, 77, 8], [2, 8, 79, 8], [3, 0, 86, 14],
  [4, 0, 82, 8], [4, 8, 81, 4], [4, 12, 79, 4], [5, 0, 77, 14],
  [6, 0, 75, 8], [6, 8, 79, 8], [7, 0, 85, 16],
];
// Arp cutoff (Hz) at bar starts; log-interpolated between, with a slow 4-bar wobble.
const MUSIC_CUTOFF = [[0, 320], [8, 650], [16, 1700], [20, 2700], [24, 2200], [32, 320]];

function musicMtof(m) { return 440 * 2 ** ((m - 69) / 12); }

function musicCutoff(bar) {
  const b = ((bar % MUSIC_BARS) + MUSIC_BARS) % MUSIC_BARS;
  let i = 0;
  while (MUSIC_CUTOFF[i + 1][0] <= b) i++;
  const [b0, f0] = MUSIC_CUTOFF[i];
  const [b1, f1] = MUSIC_CUTOFF[i + 1];
  const f = f0 * (f1 / f0) ** ((b - b0) / (b1 - b0));
  return f * (1 + 0.14 * Math.sin((b / 4) * Math.PI * 2));
}

// One synth engine on one AudioContext (or OfflineAudioContext). sched(step, t) plays a 16th.
function musicEngine(ac, out) {
  const nodes = [];
  const keep = (n) => (nodes.push(n), n);
  const gain = (v) => { const g = keep(ac.createGain()); g.gain.value = v; return g; };
  const filter = (type, f, q = 0.7) => {
    const b = keep(ac.createBiquadFilter());
    b.type = type; b.frequency.value = f; b.Q.value = q;
    return b;
  };
  const stats = { live: 0, played: 0 };

  // Shared noise and a dark synthetic reverb impulse.
  const noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const irLen = Math.floor(ac.sampleRate * 2.8);
  const ir = ac.createBuffer(2, irLen, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    let y = 0;
    for (let i = 0; i < irLen; i++) {
      y += (Math.random() * 2 - 1 - y) * 0.3; // one-pole lowpass: a darker tail
      d[i] = y * (1 - i / irLen) ** 2.5;
    }
  }

  // Master: comp -> fade -> out
  const comp = keep(ac.createDynamicsCompressor());
  comp.threshold.value = -18; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.25;
  const master = gain(0);
  comp.connect(master).connect(out);

  const rev = keep(ac.createConvolver());
  rev.buffer = ir;
  const revIn = gain(1);
  revIn.connect(rev).connect(gain(0.8)).connect(comp);

  // Two feedback echoes, dotted 8th left and quarter right, darkening on each repeat.
  const delayIn = gain(1);
  for (const [steps, pan] of [[3, -0.55], [4, 0.55]]) {
    const dl = keep(ac.createDelay(2));
    dl.delayTime.value = steps * MUSIC_STEP;
    const fb = gain(0.42);
    const tone = filter('lowpass', 1600);
    const p = keep(ac.createStereoPanner());
    p.pan.value = pan;
    delayIn.connect(dl);
    dl.connect(tone).connect(fb).connect(dl);
    tone.connect(p).connect(comp);
  }

  // Layer buses. Voices feed the filters; the filters are shared, so one sweep moves them all.
  const bus = (dry, toDelay, toRev) => {
    const g = gain(dry);
    g.connect(comp);
    if (toDelay) g.connect(gain(toDelay)).connect(delayIn);
    if (toRev) g.connect(gain(toRev)).connect(revIn);
    return g;
  };
  const arpF = filter('lowpass', musicCutoff(0), 7);
  arpF.connect(bus(1, 0.38, 0.25));
  const padF = filter('lowpass', 1000, 0.6);
  padF.connect(bus(1, 0, 0.7));
  const padLfo = keep(ac.createOscillator());
  padLfo.frequency.value = 0.055;
  padLfo.connect(gain(380)).connect(padF.frequency);
  padLfo.start();
  const bassF = filter('lowpass', 420, 3);
  bassF.connect(bus(1, 0, 0));
  const subOut = bus(1, 0, 0);
  const leadF = filter('lowpass', 2300, 1.5);
  leadF.connect(bus(1, 0.55, 0.45));
  const drums = bus(1, 0, 0.12);
  const drumsWet = bus(0.5, 0, 1); // snare and swells: mostly reverb

  // A voice: oscillators [type, freq, detune] into one envelope gain into dest.
  function voice(oscs, t, end, dest) {
    const env = ac.createGain();
    env.gain.value = 0;
    env.connect(dest);
    const os = oscs.map(([type, f, det = 0]) => {
      const o = ac.createOscillator();
      o.type = type; o.frequency.value = f; o.detune.value = det;
      o.connect(env);
      o.start(t); o.stop(end);
      return o;
    });
    stats.live++; stats.played++;
    os[0].onended = () => { for (const o of os) o.disconnect(); env.disconnect(); stats.live--; };
    return { env: env.gain, osc: os };
  }
  // A noise burst: noise -> filter -> envelope -> dest.
  function noiseVoice(type, f, q, t, end, dest) {
    const src = ac.createBufferSource();
    src.buffer = noise; src.loop = true;
    const bf = ac.createBiquadFilter();
    bf.type = type; bf.frequency.value = f; bf.Q.value = q;
    const env = ac.createGain();
    env.gain.value = 0;
    src.connect(bf).connect(env).connect(dest);
    src.start(t, Math.random() * 0.5); src.stop(end);
    stats.live++; stats.played++;
    src.onended = () => { src.disconnect(); bf.disconnect(); env.disconnect(); stats.live--; };
    return { env: env.gain, freq: bf.frequency };
  }

  function arp(t, m, level) {
    const v = voice([['sawtooth', musicMtof(m), -4], ['square', musicMtof(m), 5]], t, t + 0.4, arpF);
    v.env.setValueAtTime(0, t);
    v.env.linearRampToValueAtTime(level, t + 0.004);
    v.env.setTargetAtTime(0, t + 0.01, 0.07);
  }
  function pad(t, notes, dur, level) {
    for (const m of notes) {
      const v = voice([['sawtooth', musicMtof(m), -9], ['sawtooth', musicMtof(m), 8]], t, t + dur + 1.8, padF);
      v.env.setValueAtTime(0, t);
      v.env.linearRampToValueAtTime(level, t + 1.1);
      v.env.setValueAtTime(level, t + dur);
      v.env.linearRampToValueAtTime(0, t + dur + 1.6);
    }
  }
  function sub(t, m, dur, level) {
    const v = voice([['sine', musicMtof(m)]], t, t + dur + 0.4, subOut);
    v.env.setValueAtTime(0, t);
    v.env.linearRampToValueAtTime(level, t + 0.06);
    v.env.setValueAtTime(level, t + dur - 0.05);
    v.env.linearRampToValueAtTime(0, t + dur + 0.3);
  }
  function pulse(t, m, level) {
    const v = voice([['sawtooth', musicMtof(m)], ['square', musicMtof(m - 12), 3]], t, t + 0.3, bassF);
    v.env.setValueAtTime(0, t);
    v.env.linearRampToValueAtTime(level, t + 0.005);
    v.env.setTargetAtTime(0, t + 0.02, 0.06);
  }
  let leadPrev = 0;
  function lead(t, m, dur) {
    const f = musicMtof(m);
    const v = voice([['triangle', f], ['square', f, 7]], t, t + dur + 0.5, leadF);
    if (leadPrev) for (const o of v.osc) { o.frequency.setValueAtTime(leadPrev, t); o.frequency.setTargetAtTime(f, t, 0.035); }
    leadPrev = f;
    v.env.setValueAtTime(0, t);
    v.env.linearRampToValueAtTime(0.07, t + 0.06);
    v.env.setTargetAtTime(0.045, t + 0.06, 0.4);
    v.env.setValueAtTime(0.045, t + dur);
    v.env.linearRampToValueAtTime(0, t + dur + 0.35);
  }
  function kick(t, level) {
    const v = voice([['sine', 140]], t, t + 0.4, drums);
    v.osc[0].frequency.setValueAtTime(140, t);
    v.osc[0].frequency.exponentialRampToValueAtTime(42, t + 0.11);
    v.env.setValueAtTime(level, t);
    v.env.exponentialRampToValueAtTime(0.001, t + 0.36);
  }
  function snare(t) {
    // Gated: the noise holds flat, then cuts, like an 80s gated reverb.
    const n = noiseVoice('bandpass', 1700, 0.7, t, t + 0.25, drumsWet);
    n.env.setValueAtTime(0.32, t);
    n.env.setValueAtTime(0.32, t + 0.16);
    n.env.linearRampToValueAtTime(0, t + 0.2);
    const v = voice([['triangle', 190]], t, t + 0.15, drums);
    v.env.setValueAtTime(0.18, t);
    v.env.exponentialRampToValueAtTime(0.001, t + 0.12);
  }
  function hat(t, level) {
    const n = noiseVoice('highpass', 7500, 0.8, t, t + 0.08, drums);
    n.env.setValueAtTime(level, t);
    n.env.exponentialRampToValueAtTime(0.001, t + 0.05);
  }
  function swell(t, dur) {
    const n = noiseVoice('bandpass', 300, 2, t, t + dur + 0.05, drumsWet);
    n.freq.setValueAtTime(300, t);
    n.freq.exponentialRampToValueAtTime(5000, t + dur);
    n.env.setValueAtTime(0, t);
    n.env.linearRampToValueAtTime(0.1, t + dur * 0.95);
    n.env.linearRampToValueAtTime(0, t + dur);
  }

  function sched(step, t) {
    const bar = Math.floor(step / 16) % MUSIC_BARS;
    const s = step % 16;
    const sec = bar >> 3; // 0 intro, 1 build, 2 full, 3 breakdown
    const cb = bar % 8;
    const chord = MUSIC_CHORDS[MUSIC_PROG[cb]];
    const bar16 = 16 * MUSIC_STEP;

    if (s === 0) {
      // Arp cutoff: ramp across the bar toward next bar's value.
      arpF.frequency.setValueAtTime(musicCutoff(bar), t);
      arpF.frequency.linearRampToValueAtTime(musicCutoff(bar + 1), t + bar16);
      // Pad and sub on chord changes, held until the next change.
      if (MUSIC_PROG[cb] !== MUSIC_PROG[(cb + 7) % 8]) {
        let len = 1;
        while (cb + len < 8 && MUSIC_PROG[cb + len] === MUSIC_PROG[cb]) len++;
        pad(t, chord.pad, len * bar16, sec === 3 ? 0.03 : 0.022);
        sub(t, chord.root, len * bar16, sec === 0 ? 0.2 : sec === 3 ? 0.24 : 0.16);
      }
      if (bar === 7 || bar === 15) swell(t, bar16);
    }

    // Arp: 8ths in the intro, 16ths after.
    if (sec > 0 || s % 2 === 0) {
      const lvl = [0.05, 0.065, 0.07, 0.055][sec] * (s % 4 === 0 ? 1.15 : 1);
      arp(t, chord.arp[MUSIC_ARP[s % 8]], lvl);
    }
    // Pulse bass in build and full.
    if ((sec === 1 || sec === 2) && s % 2 === 0) pulse(t, chord.root + 12, s % 4 === 0 ? 0.09 : 0.065);
    // Lead in full.
    if (sec === 2) for (const [lb, ls, m, len] of MUSIC_LEAD) if (lb === cb && ls === s) lead(t, m, len * MUSIC_STEP);
    // Drums.
    if (sec === 1 && (s === 0 || s === 8)) kick(t, 0.55);
    if (sec === 2 && (s === 0 || s === 8 || s === 10)) kick(t, 0.6);
    if (sec === 3 && s === 0 && cb % 2 === 0 && cb < 6) kick(t, 0.45);
    if (sec === 2 && (s === 4 || s === 12)) snare(t);
    if (bar === 15 && s === 12) snare(t);
    if (sec === 1 && s % 4 === 2) hat(t, 0.05);
    if (sec === 2 && s % 2 === 0) hat(t, s % 4 === 2 ? 0.06 : 0.03);
    if (sec === 0 && cb >= 6 && s % 4 === 2) hat(t, 0.025);
  }

  // A stage-change swell: open the arp and pad filters for a moment.
  function stage(t) {
    for (const p of [arpF.detune, padF.detune]) {
      p.cancelScheduledValues(t);
      p.setValueAtTime(p.value, t);
      p.linearRampToValueAtTime(1400, t + 0.35);
      p.setTargetAtTime(0, t + 0.35, 0.9);
    }
  }

  function dispose() {
    padLfo.stop();
    for (const n of nodes) n.disconnect();
  }

  return { sched, stage, dispose, master: master.gain, stats };
}

const MUSIC = {
  ac: null,
  engine: null,
  timer: 0,
  stopTimer: 0,
  step: 0,
  next: 0,
  playing: false,

  start(ac) {
    this.ac = ac;
    if (this.stopTimer) { clearTimeout(this.stopTimer); this.stopTimer = 0; }
    if (!this.engine || this.engine.ac !== ac) {
      this.engine = musicEngine(ac, ac.destination);
      this.engine.ac = ac;
      this.step = 0;
      this.next = ac.currentTime + 0.1;
      this.timer = setInterval(() => this.tick(), 25);
    }
    const g = this.engine.master;
    const now = ac.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(MUSIC_LEVEL, now + 2);
    this.playing = true;
    this.tick();
  },

  stop() {
    if (!this.engine || !this.playing) return;
    this.playing = false;
    const g = this.engine.master;
    const now = this.ac.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + 0.5);
    this.stopTimer = setTimeout(() => {
      this.stopTimer = 0;
      clearInterval(this.timer);
      this.timer = 0;
      this.engine.dispose();
      this.engine = null;
    }, 650);
  },

  tick() {
    const e = this.engine;
    if (!e) return;
    const now = this.ac.currentTime;
    // Fell behind (a throttled tab): skip ahead on the grid instead of a burst of notes.
    while (this.next < now) { this.next += MUSIC_STEP; this.step = (this.step + 1) % (MUSIC_BARS * 16); }
    while (this.next < now + MUSIC_LOOKAHEAD) {
      e.sched(this.step, this.next);
      this.next += MUSIC_STEP;
      this.step = (this.step + 1) % (MUSIC_BARS * 16);
    }
  },

  stage() {
    if (this.playing && this.engine) this.engine.stage(this.ac.currentTime);
  },

  stats() {
    const e = this.engine;
    return {
      playing: this.playing, state: this.ac?.state ?? 'none', bar: Math.floor(this.step / 16) + 1,
      live: e ? e.stats.live : 0, played: e ? e.stats.played : 0, level: e ? +e.master.value.toFixed(3) : 0,
    };
  },
};
