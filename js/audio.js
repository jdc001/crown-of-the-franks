'use strict';
// ================= SOUND =================
// Everything is synthesised in the browser: no recordings are downloaded.
// Instruments: a plucked lute and harp (Karplus-Strong string models), a recorder with breath, a shawm, a
// hurdy-gurdy with its buzzing bridge, a chanting choir, tuned bells, frame drums and kettledrums.
// Music is composed as it plays, in the church modes, from short motifs that are stated, varied and answered,
// so no two minutes are the same. Each mood has its own mode, tempo, metre and band; the map follows the seasons
// and turns darker in time of war. Tracks cross-fade; a quiet ambience of wind and birds sits under the map.
const SND = { on: true, ctx: null, master: null, music: null, sfx: null, amb: null, rev: null, comp: null, noise: null, pink: null,
  want: 'title', cur: null, timer: null, ks: {}, ambT: 0, wind: null };
try { const v = localStorage.getItem('cotf-sound'); if (v === '0') SND.on = false; } catch (e) { }
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const rr = (a, b) => a + Math.random() * (b - a);
const MUSIC_VOL = 0.42, SFX_VOL = 0.7, AMB_VOL = 0.5;

function sndBuild(c) {
  SND.ctx = c;
  SND.comp = c.createDynamicsCompressor();
  Object.assign(SND.comp, {}); SND.comp.threshold.value = -16; SND.comp.knee.value = 12; SND.comp.ratio.value = 4; SND.comp.attack.value = 0.006; SND.comp.release.value = 0.25;
  SND.master = c.createGain(); SND.master.gain.value = SND.on ? 0.95 : 0;
  SND.comp.connect(SND.master); SND.master.connect(c.destination);
  SND.music = c.createGain(); SND.music.gain.value = MUSIC_VOL; SND.music.connect(SND.comp);
  SND.sfx = c.createGain(); SND.sfx.gain.value = SFX_VOL; SND.sfx.connect(SND.comp);
  SND.amb = c.createGain(); SND.amb.gain.value = AMB_VOL; SND.amb.connect(SND.comp);
  // a stone hall: a short pre-delay, early reflections, and a darkening stereo tail
  const sr = c.sampleRate, len = Math.floor(sr * 2.6), ir = c.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch); let lp = 0;
    for (let i = 0; i < len; i++) { const t = i / sr, k = 0.35 + 0.6 * (1 - t / 2.6); lp += k * ((Math.random() * 2 - 1) - lp); d[i] = t < 0.012 ? 0 : lp * Math.pow(1 - t / 2.6, 2.6) * 0.9; }
    for (const [tt, a] of [[0.017, 0.5], [0.029, 0.35], [0.041, 0.3], [0.063, 0.22]]) { const i = Math.floor((tt + ch * 0.003) * sr); d[i] += a * (ch ? -1 : 1); }
  }
  // two halls, so that the music's echoes fade and mute with the music and the effects' with the effects
  const hall = out => { const cv = c.createConvolver(), rg = c.createGain(); cv.buffer = ir; rg.gain.value = 0.42; cv.connect(rg); rg.connect(out); return cv; };
  SND.rev = hall(SND.music); SND.revS = hall(SND.sfx);
  SND.amb.wet = c.createGain(); SND.amb.wet.connect(SND.rev);
  const nb = c.createBuffer(1, sr * 2, sr), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  SND.noise = nb;
  // pink-ish noise for wind and breath
  const pb = c.createBuffer(1, sr * 4, sr), pd = pb.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < pd.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048; pd[i] = (b0 + b1 + b2) * 2.2; }
  SND.pink = pb;
  SND.ks = {};
}
// the settings' switches and sliders, applied to the buses
const volOf = k => { const v = typeof SET !== 'undefined' ? SET[k] : undefined; return v == null ? 0.8 : Math.max(0, Math.min(1, Number(v))); };
function sndVolumes() {
  if (!SND.ctx) return;
  const t = SND.ctx.currentTime, on = k => typeof SET === 'undefined' || SET[k] !== false;
  const mv = on('music') ? MUSIC_VOL * volOf('musicVol') / 0.8 : 0, sv = on('sfxOn') ? SFX_VOL * volOf('sfxVol') / 0.8 : 0;
  SND.music.gain.setTargetAtTime(mv, t, 0.05); SND.amb.gain.setTargetAtTime(mv ? AMB_VOL * mv / MUSIC_VOL : 0, t, 0.05); SND.sfx.gain.setTargetAtTime(sv, t, 0.05);
}
function sndInit() {
  if (SND.ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  sndBuild(new AC()); sndVolumes();
  return true;
}
function sndUnlock() {
  if (!sndInit()) return;
  if (SND.ctx.state === 'suspended') SND.ctx.resume();
  if (SND.on && !SND.timer) setMusic(SND.want);
}
function sndToggle() {
  SND.on = !SND.on;
  try { localStorage.setItem('cotf-sound', SND.on ? '1' : '0'); } catch (e) { }
  if (!sndInit()) return SND.on;
  const t = SND.ctx.currentTime;
  SND.master.gain.cancelScheduledValues(t); SND.master.gain.setTargetAtTime(SND.on ? 0.95 : 0, t, 0.15);
  if (SND.on) { SND.ctx.resume(); setMusic(SND.want); } else stopMusic();
  return SND.on;
}
// route a voice: to a bus (the playing track's gain), panned, with some of it sent to the hall
function route(node, bus, pan = 0, wet = 0.3) {
  const c = SND.ctx; let n = node;
  if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; n.connect(p); n = p; }
  n.connect(bus);
  if (wet) { const g = c.createGain(); g.gain.value = wet * (bus.k || 1); n.connect(g); g.connect(bus.wet || SND.rev); }
}

// ================= INSTRUMENTS =================
// A plucked string by Karplus-Strong: a burst of noise circulating in a delay line that loses its highs each pass.
function ksBuffer(m, kind) {
  const key = kind + m; if (SND.ks[key]) return SND.ks[key];
  const c = SND.ctx, sr = c.sampleRate, f = mtof(m), dur = kind === 'harp' ? 3.2 : kind === 'bass' ? 1.6 : 2.0;
  const N = Math.max(2, Math.round(sr / f)), len = Math.floor(sr * dur), b = c.createBuffer(1, len, sr), d = b.getChannelData(0);
  const line = new Float32Array(N); let lp = 0;
  const bright = kind === 'harp' ? 0.75 : kind === 'bass' ? 0.35 : 0.55;
  for (let i = 0; i < N; i++) { lp += bright * ((Math.random() * 2 - 1) - lp); line[i] = lp; }
  // pluck position: comb out some of the fundamental's neighbours for a woodier tone
  const pp = Math.max(1, Math.floor(N * (kind === 'lute' ? 0.18 : 0.12))); const ln2 = Float32Array.from(line); for (let i = 0; i < N; i++) line[i] = ln2[i] - 0.6 * ln2[(i + pp) % N];
  const loss = kind === 'harp' ? 0.9985 : kind === 'bass' ? 0.996 : 0.9965, blend = kind === 'harp' ? 0.5 : 0.48;
  let p = 0, prev = 0;
  for (let i = 0; i < len; i++) { const cur = line[p]; const nx = loss * (blend * cur + (1 - blend) * prev); prev = cur; line[p] = nx; d[i] = cur; p = (p + 1) % N; }
  let mx = 0; for (let i = 0; i < Math.min(len, 4000); i++) mx = Math.max(mx, Math.abs(d[i])); if (mx) for (let i = 0; i < len; i++) d[i] /= mx;
  SND.ks[key] = b; return b;
}
function pluck(bus, t, m, vol, kind = 'lute', pan = 0, len) {
  const c = SND.ctx, s = c.createBufferSource(), g = c.createGain(), body = c.createBiquadFilter(), air = c.createBiquadFilter();
  s.buffer = ksBuffer(Math.round(m), kind); s.detune.value = (m - Math.round(m)) * 100 + rr(-4, 4);
  body.type = 'peaking'; body.frequency.value = kind === 'harp' ? 400 : 230; body.Q.value = 1.2; body.gain.value = kind === 'harp' ? 2 : 5;
  air.type = 'lowpass'; air.frequency.value = kind === 'lute' ? 3400 : kind === 'bass' ? 1400 : 5200;
  const L = len || (kind === 'harp' ? 3 : 1.8);
  g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + L * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + L);
  s.connect(body); body.connect(air); air.connect(g); route(g, bus, pan, kind === 'harp' ? 0.45 : 0.3);
  s.start(t); s.stop(t + L + 0.05);
}
// recorder: a soft fundamental with a little second and third harmonic, a breath chiff, and late vibrato
function recorder(bus, t, m, dur, vol, pan = 0) {
  const c = SND.ctx, f = mtof(m), g = c.createGain(), o = c.createOscillator(), o2 = c.createOscillator(), o3 = c.createOscillator(), g2 = c.createGain(), g3 = c.createGain();
  o.type = 'sine'; o2.type = 'sine'; o3.type = 'sine'; o.frequency.value = f; o2.frequency.value = f * 2; o3.frequency.value = f * 3; g2.gain.value = 0.18; g3.gain.value = 0.06;
  const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = rr(4.6, 5.6); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.007, t + Math.min(0.5, dur * 0.7));
  lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
  const br = c.createBufferSource(), bf = c.createBiquadFilter(), bg = c.createGain(); br.buffer = SND.noise; bf.type = 'bandpass'; bf.frequency.value = f * 2; bf.Q.value = 3;
  bg.gain.setValueAtTime(vol * 0.9, t); bg.gain.exponentialRampToValueAtTime(vol * 0.06, t + 0.06); bg.gain.setValueAtTime(vol * 0.06, t + dur); bg.gain.linearRampToValueAtTime(0.0001, t + dur + 0.08);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.045); g.gain.setValueAtTime(vol * 0.92, t + Math.max(0.05, dur * 0.85)); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.1);
  o.connect(g); o2.connect(g2); g2.connect(g); o3.connect(g3); g3.connect(g); br.connect(bf); bf.connect(bg); bg.connect(g);
  route(g, bus, pan, 0.5);
  for (const x of [o, o2, o3, lfo]) { x.start(t); x.stop(t + dur + 0.2); } br.start(t, rr(0, 1)); br.stop(t + dur + 0.2);
}
// shawm: a loud double reed, buzzy, with two formants
function shawm(bus, t, m, dur, vol, pan = 0) {
  const c = SND.ctx, f = mtof(m), o = c.createOscillator(), q = c.createOscillator(), qg = c.createGain(), f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), lp = c.createBiquadFilter(), g = c.createGain(), mix = c.createGain();
  o.type = 'sawtooth'; q.type = 'square'; o.frequency.value = f; q.frequency.value = f; qg.gain.value = 0.35;
  const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = rr(5, 6.5); lg.gain.value = f * 0.004; lfo.connect(lg); lg.connect(o.frequency); lg.connect(q.frequency);
  f1.type = 'peaking'; f1.frequency.value = 1150; f1.Q.value = 2; f1.gain.value = 9; f2.type = 'peaking'; f2.frequency.value = 2600; f2.Q.value = 2.5; f2.gain.value = 6; lp.type = 'lowpass'; lp.frequency.value = 4200;
  mix.gain.value = 0.5; o.connect(mix); q.connect(qg); qg.connect(mix); mix.connect(f1); f1.connect(f2); f2.connect(lp); lp.connect(g);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol * 0.9, t + Math.max(0.04, dur * 0.88)); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.04);
  route(g, bus, pan, 0.32);
  for (const x of [o, q, lfo]) { x.start(t); x.stop(t + dur + 0.1); }
}
// a chanting voice: detuned saws through the formants of 'ah' or 'oh'
function voice(bus, t, m, dur, vol, pan = 0, vowel = 'ah') {
  const c = SND.ctx, f = mtof(m), g = c.createGain(), sum = c.createGain(); sum.gain.value = 0.33;
  const os = [-7, 0, 6].map(dt => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt + rr(-2, 2); o.connect(sum); return o; });
  const F = vowel === 'oh' ? [[450, 7, 12], [800, 8, 8], [2830, 10, 2]] : [[730, 6, 12], [1090, 7, 8], [2440, 9, 3]];
  let n = sum; for (const [fr, Q, gn] of F) { const b = c.createBiquadFilter(); b.type = 'peaking'; b.frequency.value = fr; b.Q.value = Q; b.gain.value = gn; n.connect(b); n = b; }
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; n.connect(lp); lp.connect(g);
  const at = Math.min(0.35, dur * 0.4);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + at); g.gain.setValueAtTime(vol, t + Math.max(at, dur - 0.25)); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
  route(g, bus, pan, 0.7);
  for (const o of os) { o.start(t); o.stop(t + dur + 0.4); }
}
// a tuned bell: the hum, prime, minor third, fifth and nominal partials, each with its own decay
function bell(bus, t, m, vol, pan = 0) {
  const c = SND.ctx, f = mtof(m);
  for (const [r, a, d] of [[0.5, 0.5, 4.5], [1, 0.8, 3.2], [1.19, 0.45, 2.2], [1.5, 0.3, 1.8], [2, 0.55, 1.6], [2.51, 0.2, 1.1], [3.01, 0.15, 0.8], [4.1, 0.08, 0.5]]) {
    const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f * r * rr(0.999, 1.001);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * a, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); route(g, bus, pan, 0.55); o.start(t); o.stop(t + d + 0.05);
  }
}
// the hurdy-gurdy: a bowed drone on the finalis and fifth, its trompette buzzing in rhythm when asked
function gurdy(bus, t, notes, dur, vol, buzz) {
  const c = SND.ctx;
  for (const m of notes) {
    const o = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m) * 1.003;
    lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.6); g.gain.setValueAtTime(vol, t + dur - 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); o2.connect(lp); lp.connect(g); route(g, bus, m < 48 ? -0.15 : 0.15, 0.35);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  if (buzz) for (const bt of buzz) {
    const n = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain(); n.buffer = SND.noise; bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 4;
    g.gain.setValueAtTime(vol * 1.5, bt); g.gain.exponentialRampToValueAtTime(0.0001, bt + 0.09); n.connect(bp); bp.connect(g); route(g, bus, 0.1, 0.1); n.start(bt, rr(0, 1.5)); n.stop(bt + 0.1);
  }
}
// percussion
function noiseBurst(bus, t, type, freq, q, dur, vol, pan = 0, wet = 0.2, slide) {
  const c = SND.ctx, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  n.buffer = SND.noise; f.type = type; f.frequency.setValueAtTime(freq, t); if (slide) f.frequency.exponentialRampToValueAtTime(slide, t + dur); f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f); f.connect(g); route(g, bus, pan, wet); n.start(t, rr(0, 1.5)); n.stop(t + dur + 0.02);
}
function skin(bus, t, f0, f1, dur, vol, pan = 0, wet = 0.25) {
  const c = SND.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.7);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); route(g, bus, pan, wet); o.start(t); o.stop(t + dur + 0.02);
}
function perc(bus, t, kind, vol) {
  switch (kind) {
    case 'tabor': skin(bus, t, 210, 150, 0.18, vol, 0.2); noiseBurst(bus, t, 'bandpass', 900, 1.2, 0.08, vol * 0.5, 0.2); break;
    case 'tak': noiseBurst(bus, t, 'bandpass', 2600, 2, 0.05, vol * 0.8, 0.25); skin(bus, t, 420, 330, 0.05, vol * 0.3, 0.25); break;
    case 'frame': skin(bus, t, 120, 85, 0.35, vol, -0.1); noiseBurst(bus, t, 'lowpass', 600, 0.7, 0.12, vol * 0.4, -0.1); break;
    case 'naker': skin(bus, t, 105, 62, 0.42, vol, -0.2, 0.3); noiseBurst(bus, t, 'lowpass', 300, 0.7, 0.15, vol * 0.5, -0.2); break;
    case 'war': skin(bus, t, 72, 40, 0.9, vol, 0, 0.45); noiseBurst(bus, t, 'lowpass', 220, 0.5, 0.4, vol * 0.6, 0, 0.4); break;
    case 'jingle': for (let i = 0; i < 3; i++) noiseBurst(bus, t + i * 0.012, 'bandpass', rr(6500, 9500), 14, 0.16, vol * 0.5, 0.35, 0.15); break;
  }
}

// ================= COMPOSITION =================
const MODES = { dorian: [0, 2, 3, 5, 7, 9, 10], mixolydian: [0, 2, 4, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], ionian: [0, 2, 4, 5, 7, 9, 11] };
const PROGS = {
  dorian: [[0, 0, 6, 0, 3, 2, 6, 0], [0, 3, 0, 6, 2, 3, 4, 0], [0, 6, 3, 0, 0, 2, 6, 0]],
  mixolydian: [[0, 6, 3, 0, 0, 6, 4, 0], [0, 3, 6, 0, 3, 0, 6, 0], [0, 0, 6, 3, 0, 4, 6, 0]],
  aeolian: [[0, 6, 5, 6, 0, 3, 4, 0], [0, 5, 2, 6, 0, 3, 6, 0], [0, 3, 0, 6, 5, 3, 4, 0]],
  phrygian: [[0, 1, 0, 6, 0, 1, 6, 0], [0, 6, 1, 0, 3, 1, 0, 0]],
  ionian: [[0, 4, 3, 0, 5, 3, 4, 0], [0, 3, 4, 0, 0, 5, 4, 0]],
};
const deg = (T, d) => { const sc = MODES[T.mode], o = Math.floor(d / 7), i = ((d % 7) + 7) % 7; return T.tonic + o * 12 + sc[i]; };
const RHY = { 6: [[2, 2, 2], [3, 1, 2], [2, 1, 1, 2], [4, 2], [1, 1, 2, 2], [3, 3], [2, 4]], 8: [[2, 2, 2, 2], [3, 1, 2, 2], [2, 2, 4], [4, 2, 2], [1, 1, 2, 2, 2], [2, 1, 1, 4], [3, 1, 4], [6, 2]] };
const DENSE = { 8: [[1, 1, 1, 1, 2, 2], [2, 1, 1, 2, 2], [1, 1, 2, 1, 1, 2], [2, 2, 1, 1, 2]], 6: [[1, 1, 1, 1, 2], [2, 1, 1, 2], [1, 1, 2, 2]] };
// one bar of melody: a rhythm and scale degrees that move mostly by step, landing on the chord on the downbeat
function barLine(T, start, chordRoot, dense, last) {
  const S = T.steps, pool = (dense ? DENSE[S] : RHY[S]) || RHY[8];
  const r = last ? (S === 6 ? [2, 4] : [2, 6]) : pick(pool);
  let d = start; const out = [];
  r.forEach((len, k) => {
    if (k === 0) { const tones = [chordRoot, chordRoot + 2, chordRoot + 4, chordRoot + 7, chordRoot - 3, chordRoot - 5]; d = tones.reduce((b, x) => Math.abs(x - d) < Math.abs(b - d) ? x : b, tones[0]); }
    else { const mv = pick([-1, -1, 1, 1, -2, 2, 0, 1, -1, 3, -3]); d += mv; }
    d = clamp(d, T.lo, T.hi);
    if (last && k === r.length - 1) d = Math.abs(d - 7) < Math.abs(d) ? 7 : 0;
    out.push([d, len]);
  });
  return out;
}
// eight bars: a two-bar motif, its answer, a contrasting pair, and the motif again closing on the finalis
function composePhrase(T) {
  const prog = pick(PROGS[T.mode]); const bars = [];
  let s = T.lo + 4;
  const motif = [barLine(T, s, prog[0], T.dense), barLine(T, s + 1, prog[1], T.dense)];
  const shift = (b, dd) => b.map(([d, l]) => [clamp(d + dd, T.lo, T.hi), l]);
  bars.push(motif[0], motif[1]);
  const up = pick([1, 2, -1]); bars.push(shift(motif[0], up), barLine(T, motif[1][0][0] + up, prog[3], T.dense));
  const hi = Math.min(T.hi - 2, s + 4); bars.push(barLine(T, hi, prog[4], T.dense), barLine(T, hi - 1, prog[5], T.dense));
  bars.push(motif[0], barLine(T, motif[0][motif[0].length - 1][0], prog[7], false, true));
  return { prog, bars };
}

// ---------- the bands ----------
const TRACKS = {
  title: { lvl: 3.0, tempo: 54, steps: 8, mode: 'dorian', tonic: 62, lo: -3, hi: 9, lead: 'choir', bed: 'organum', perc: null, bells: 4 },
  spring: { lvl: 1.8, tempo: 88, steps: 6, mode: 'mixolydian', tonic: 67, lo: -2, hi: 9, lead: 'recorder', bed: 'harp', perc: 'light', amb: 'birds' },
  summer: { lvl: 2.1, tempo: 104, steps: 6, mode: 'dorian', tonic: 62, lo: 0, hi: 10, lead: 'recorder', alt: 'lute', bed: 'strum', perc: 'dance', amb: 'birds' },
  autumn: { lvl: 3.0, tempo: 74, steps: 8, mode: 'aeolian', tonic: 57, lo: 0, hi: 10, lead: 'lute', alt: 'recorder', bed: 'harp', perc: null, drone: true, amb: 'crows' },
  winter: { lvl: 4.2, tempo: 60, steps: 6, mode: 'dorian', tonic: 62, lo: -2, hi: 8, lead: 'harp', bed: 'choirpad', perc: null, drone: true, amb: 'wind' },
  war: { lvl: 2.4, tempo: 80, steps: 8, mode: 'phrygian', tonic: 64, lo: -3, hi: 7, lead: 'shawm', sparse: true, bed: 'bass', perc: 'heart', drone: 'buzz', amb: 'wind' },
  battle: { lvl: 1.9, tempo: 138, steps: 8, mode: 'dorian', tonic: 62, lo: 0, hi: 9, lead: 'shawm', dense: true, bed: 'pump', perc: 'battle', drone: true },
  siege: { lvl: 1.8, tempo: 68, steps: 8, mode: 'aeolian', tonic: 57, lo: -2, hi: 7, lead: 'shawm', sparse: true, low: true, bed: 'bass', perc: 'siege', drone: 'buzz' },
  fair: { lvl: 2.1, tempo: 124, steps: 6, mode: 'mixolydian', tonic: 67, lo: 0, hi: 9, lead: 'recorder', alt: 'shawm', bed: 'strum', perc: 'dance', dense: true },
  coronation: { lvl: 2.2, tempo: 66, steps: 8, mode: 'mixolydian', tonic: 62, lo: 0, hi: 9, lead: 'shawm', alt: 'choir', bed: 'organum', perc: 'stately', bells: 1 },
  defeat: { lvl: 2.4, tempo: 56, steps: 8, mode: 'aeolian', tonic: 57, lo: -2, hi: 7, lead: 'recorder', bed: 'harp', drone: true, sparse: true },
};
function leadNote(Tr, bus, t, m, dur, vol, inst) {
  switch (inst) {
    case 'recorder': recorder(bus, t, m + 12 * (m < 64 ? 1 : 0), dur * 0.95, vol * 0.9, 0.12); break;
    case 'shawm': shawm(bus, t, m - (Tr.def.low ? 12 : 0), dur * 0.9, vol * 0.55, -0.1); break;
    case 'lute': pluck(bus, t, m, vol * 1.6, 'lute', 0.15, Math.max(0.6, dur * 1.4)); break;
    case 'harp': pluck(bus, t, m + 12, vol * 1.3, 'harp', 0.2, 3); break;
    case 'choir': voice(bus, t, m - 12, dur, vol * 0.55, -0.05); voice(bus, t, m - 5, dur, vol * 0.35, 0.15, 'oh'); break;
  }
}
// schedule one sixteenth... in fact one step (an eighth note) of the running track
function trackStep(Tr, t, dur) {
  const T = Tr.def, S = T.steps, bus = Tr.bus;
  const k = Tr.step % (S * 8), bar = Math.floor(k / S), e = k % S;
  if (k === 0) { Tr.ph = composePhrase(Tr.T); Tr.n++; Tr.leadNow = T.alt && Tr.n % 2 === 0 ? T.alt : T.lead; if (Tr.onPhrase) Tr.onPhrase(Tr); }
  const ph = Tr.ph, root = ph.prog[bar], chord = [root, root + 2, root + 4].map(d => deg(Tr.T, d));
  const sw = S === 6 && e % 2 === 1 ? dur * 0.12 : 0, tt = t + sw + rr(-0.006, 0.006);
  // the melody
  let pos = 0;
  if (!(T.sparse && bar % 2 === 1 && bar < 7)) for (const [d, len] of ph.bars[bar]) { if (pos === e) leadNote(Tr, bus, tt, deg(Tr.T, d), len * dur, (e === 0 ? 0.11 : 0.09) * rr(0.85, 1), Tr.leadNow); pos += len; }
  // the bed
  switch (T.bed) {
    case 'harp': { const pat = S === 6 ? [0, 2, 1, 2, 0, 1] : [0, 1, 2, 1, 0, 2, 1, 2]; if (!(T.sparse && e % 2)) pluck(bus, tt, chord[pat[e]] - 12 + (e % 3 === 2 ? 12 : 0), e === 0 ? 0.13 : 0.08, 'harp', -0.25); if (e === 0) pluck(bus, t, chord[0] - 24, 0.12, 'bass', -0.1, 2.5); break; }
    case 'strum': { const on = S === 6 ? [0, 3] : [0, 2, 4, 6]; if (on.includes(e)) chord.forEach((m, i) => pluck(bus, tt + i * 0.014, m - 12, e === 0 ? 0.08 : 0.06, 'lute', -0.3, 0.9)); if (e === 0) pluck(bus, t, chord[0] - 24, 0.12, 'bass', -0.1, 1.5); break; }
    case 'bass': if (e === 0 || (e === S / 2 && Math.random() < 0.5)) pluck(bus, t, chord[0] - 24, 0.16, 'bass', -0.15, 1.8); break;
    case 'pump': pluck(bus, t, (e % 2 ? chord[2] : chord[0]) - 24 + (e === 4 ? 12 : 0), 0.11, 'bass', -0.15, 0.5); break;
    case 'organum': if (e === 0 && bar % 2 === 0) { voice(bus, t, chord[0] - 12, dur * S * 2, 0.06, -0.3); voice(bus, t, chord[0] - 5, dur * S * 2, 0.045, 0.3, 'oh'); } break;
    case 'choirpad': if (e === 0) { voice(bus, t, chord[0] - 12, dur * S, 0.035, -0.3, 'oh'); voice(bus, t, chord[1] - 12, dur * S, 0.03, 0.3, 'oh'); } break;
  }
  // the drone, re-bowed every two bars
  if (T.drone && e === 0 && bar % 2 === 0) gurdy(bus, t, [Tr.T.tonic - 24, Tr.T.tonic - 17], dur * S * 2 + 0.3, T.drone === 'buzz' ? 0.022 : 0.016, T.drone === 'buzz' ? [0, 2, 4, 6].map(x => t + x * dur * (S / 4)) : null);
  // percussion
  const P = T.perc;
  if (P === 'light' && e === 0) perc(bus, t, 'frame', 0.25);
  if (P === 'dance') { if (e === 0 || e === 3) perc(bus, t, 'tabor', 0.3); if (e === 2 || e === 5) perc(bus, t, 'tak', 0.2); if (e === 1 && Math.random() < 0.5) perc(bus, t, 'jingle', 0.25); }
  if (P === 'heart' && (e === 0 || e === 1)) perc(bus, t + (e ? dur * 0.4 : 0), 'frame', e ? 0.18 : 0.3);
  if (P === 'battle') { if ([0, 3, 6].includes(e)) perc(bus, t, 'naker', 0.4); if ([2, 4, 7].includes(e)) perc(bus, t, 'tak', 0.24); if (e === 4) perc(bus, t, 'tabor', 0.3); if (bar === 7 && e >= 4) perc(bus, t, 'tabor', 0.3); }
  if (P === 'siege') { if (e === 0) perc(bus, t, 'war', 0.55); if (e === 5 && bar % 2) perc(bus, t, 'war', 0.35); if (bar === 7 && e >= 4) perc(bus, t, 'naker', 0.3); }
  if (P === 'stately') { if (e === 0) perc(bus, t, 'naker', 0.4); if (e === 4) perc(bus, t, 'tabor', 0.25); }
  if (T.bells && e === 0 && bar % T.bells === 0) bell(bus, t, Tr.T.tonic - 12 + (bar % 4 === 2 ? 7 : 0), 0.12, 0.3);
  // a horn call in the siege, now and then
  if (P === 'siege' && k === S * 6 && Math.random() < 0.6) { shawm(bus, t, Tr.T.tonic - 12, dur * 3, 0.05, 0.4); shawm(bus, t + dur * 3, Tr.T.tonic - 5, dur * 4, 0.05, 0.4); }
}

// ---------- playing and switching tracks ----------
function seasonName() { return G ? dateStr(G.turn).split(' ')[0].toLowerCase() : 'summer'; }
// 'map' means: the season's air, or the war theme if the realm is at war or besieged
function resolveMood(mode) {
  if (mode !== 'map') return mode;
  const t = document.getElementById('title');
  if (!G || (t && t.style.display !== 'none' && t.style.display !== '')) return 'title';
  if (G.over) return 'title';
  const me_ = G.player, war = !truce() && (alive().some(f => f !== me_ && atWar(me_, f)) || owned(me_).some(p => besiegerOf(p)));
  if (war) return 'war';
  const s = seasonName(); return TRACKS[s] ? s : 'summer';
}
function playTrack(name) {
  const c = SND.ctx, def = TRACKS[name]; if (!def) return;
  const bus = c.createGain(), lvl = def.lvl || 1; bus.wet = c.createGain(); bus.wet.connect(SND.rev); bus.connect(SND.music);
  for (const [g, v] of [[bus.gain, lvl], [bus.wet.gain, lvl]]) { g.setValueAtTime(0.0001, c.currentTime); g.linearRampToValueAtTime(v, c.currentTime + 1.2); }
  const T = { ...def };
  if (name === 'battle') { T.mode = pick(['dorian', 'phrygian', 'aeolian']); T.tonic = pick([62, 64]); }
  const Tr = { name, def, T, bus, step: 0, n: 0, next: c.currentTime + 0.15, dur: 60 / def.tempo / 2, ph: null };
  Tr.onPhrase = tr => { if (SND.want === 'map' && tr === SND.cur) { const m = resolveMood('map'); if (m !== tr.name) setTimeout(() => switchTo(m), 0); } };
  SND.cur = Tr;
}
function fadeOut(Tr) {
  if (!Tr) return; const c = SND.ctx, t = c.currentTime;
  for (const g of [Tr.bus.gain, Tr.bus.wet.gain]) { g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.0001, t + 1.6); }
  setTimeout(() => { try { Tr.bus.disconnect(); Tr.bus.wet.disconnect(); } catch (e) { } }, 4500);
}
function switchTo(name) {
  if (!SND.ctx || !SND.on) return;
  if (SND.cur && SND.cur.name === name) return;
  fadeOut(SND.cur); playTrack(name);
  if (!SND.timer) SND.timer = setInterval(pump, 50);
}
// the scheduler: queue the next steps of the running track, and the ambience, a little ahead of time
function pump(until) {
  const c = SND.ctx; if (!c) return;
  const end = until ?? c.currentTime + 0.25, Tr = SND.cur;
  if (Tr) while (Tr.next < end) { trackStep(Tr, Tr.next, Tr.dur); Tr.next += Tr.dur; Tr.step++; }
  ambience(end, Tr && Tr.def.amb);
}
function setMusic(mode) {
  SND.want = mode;
  if (!SND.ctx || !SND.on) return;
  if (typeof SET !== 'undefined' && SET.music === false) { if (SND.cur) stopMusic(); return; }
  switchTo(resolveMood(mode));
}
function stopMusic() {
  if (SND.timer) clearInterval(SND.timer);
  SND.timer = null; fadeOut(SND.cur); SND.cur = null; windStop();
}

// ---------- ambience under the map ----------
function windStart(level) {
  const c = SND.ctx;
  if (!SND.wind) {
    const n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    n.buffer = SND.pink; n.loop = true; f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.6;
    lfo.frequency.value = 0.07; lg.gain.value = 180; lfo.connect(lg); lg.connect(f.frequency);
    g.gain.value = 0.0001; n.connect(f); f.connect(g); g.connect(SND.amb); n.start(); lfo.start();
    SND.wind = { n, g, lfo };
  }
  const t = c.currentTime; SND.wind.g.gain.cancelScheduledValues(t); SND.wind.g.gain.setTargetAtTime(level, t, 1.5);
}
function windStop() { if (!SND.wind || !SND.ctx) return; const w = SND.wind, t = SND.ctx.currentTime; w.g.gain.setTargetAtTime(0.0001, t, 0.5); setTimeout(() => { try { w.n.stop(); w.lfo.stop(); } catch (e) { } }, 2000); SND.wind = null; }
function bird(t) {
  const c = SND.ctx, n = 2 + rnd(4), base = rr(2600, 4200), pan = rr(-0.8, 0.8);
  for (let i = 0; i < n; i++) {
    const o = c.createOscillator(), g = c.createGain(), s = t + i * rr(0.07, 0.13), d = rr(0.04, 0.09);
    o.type = 'sine'; o.frequency.setValueAtTime(base * rr(0.9, 1.1), s); o.frequency.exponentialRampToValueAtTime(base * rr(1.15, 1.5), s + d);
    g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(0.03, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + d);
    o.connect(g); route(g, SND.amb, pan, 0.4); o.start(s); o.stop(s + d + 0.02);
  }
}
function crow(t) { const pan = rr(-0.7, 0.7); for (let i = 0; i < 1 + rnd(3); i++) { noiseBurst(SND.amb, t + i * 0.32, 'bandpass', rr(900, 1300), 5, 0.22, 0.05, pan, 0.5); skin(SND.amb, t + i * 0.32, 520, 380, 0.2, 0.012, pan, 0.5); } }
function ambience(end, kind) {
  if (!kind) { if (SND.wind) windStop(); return; }
  windStart(kind === 'wind' ? 0.05 : kind === 'crows' ? 0.03 : 0.018);
  if (SND.ambT < SND.ctx.currentTime) SND.ambT = SND.ctx.currentTime + rr(2, 6);
  while (SND.ambT < end) { if (kind === 'birds') bird(SND.ambT); else if (kind === 'crows' && Math.random() < 0.6) crow(SND.ambT); SND.ambT += kind === 'birds' ? rr(2.5, 8) : rr(6, 14); }
}

// ================= EFFECTS =================
// each effect plays through its own little bus, levelled so that a click and a falling wall sit right together
const FXL = { greek: 0.9, click: 5, coin: 2.2, horn: 0.7, plague: 2, rat: 3, miss: 2, splash: 2, clash: 7, arrows: 7, cheer: 9, raise: 2.2, ship: 4, fire: 1.2, build: 1.1 };
let FXB = null;
const fx = () => FXB || SND.sfx;
function clink(t, f, vol, pan) { for (const [r, a, d] of [[1, 1, 0.25], [2.76, 0.5, 0.15], [5.4, 0.3, 0.08], [8.9, 0.15, 0.05]]) { const o = SND.ctx.createOscillator(), g = SND.ctx.createGain(); o.type = 'sine'; o.frequency.value = f * r; g.gain.setValueAtTime(vol * a, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); route(g, fx(), pan, 0.25); o.start(t); o.stop(t + d + 0.02); } }
function rumble(t, dur, vol) { const pts = 4 + rnd(4); for (let i = 0; i < pts; i++) noiseBurst(fx(), t + rr(0, dur), 'lowpass', rr(600, 1800), 0.8, rr(0.04, 0.12), vol * rr(0.3, 0.8), rr(-0.4, 0.4), 0.3); }
function sfx(kind) {
  if (!SND.on || !SND.ctx || SND.ctx.state !== 'running') return;
  const t = SND.ctx.currentTime, c0 = SND.ctx, k = FXL[kind] || 1;
  FXB = c0.createGain(); FXB.gain.value = k; FXB.k = 1; FXB.connect(SND.sfx); FXB.wet = c0.createGain(); FXB.wet.gain.value = k; FXB.wet.connect(SND.revS);
  try { sfxPlay(kind, t); } finally { FXB = null; }
}
function sfxPlay(kind, t) {
  switch (kind) {
    case 'click': noiseBurst(fx(), t, 'bandpass', 2400, 3, 0.03, 0.18, 0, 0.05); skin(fx(), t, 1400, 900, 0.03, 0.05, 0, 0); break;
    case 'coin': for (let i = 0; i < 2 + rnd(3); i++) clink(t + i * rr(0.04, 0.08), rr(2100, 2900), 0.07, rr(-0.3, 0.3)); break;
    case 'bell': bell(fx(), t, 67, 0.22, 0.1); bell(fx(), t + 0.7, 62, 0.18, -0.1); break;
    case 'horn': { const c = SND.ctx; [[0, 55, 0.9], [0.95, 62, 1.3]].forEach(([d, m, len]) => { const o = c.createOscillator(), f1 = c.createBiquadFilter(), lp = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(mtof(m) * 0.94, t + d); o.frequency.linearRampToValueAtTime(mtof(m), t + d + 0.12); f1.type = 'peaking'; f1.frequency.value = 700; f1.Q.value = 1.5; f1.gain.value = 8; lp.type = 'lowpass'; lp.frequency.setValueAtTime(600, t + d); lp.frequency.linearRampToValueAtTime(1600, t + d + 0.2); g.gain.setValueAtTime(0.0001, t + d); g.gain.linearRampToValueAtTime(0.28, t + d + 0.12); g.gain.setValueAtTime(0.28, t + d + len - 0.2); g.gain.linearRampToValueAtTime(0.0001, t + d + len); o.connect(f1); f1.connect(lp); lp.connect(g); route(g, fx(), 0, 0.6); o.start(t + d); o.stop(t + d + len + 0.05); }); break; }
    case 'launch': { const c = SND.ctx, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(110, t + 0.18); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 3; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.25, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(f); f.connect(g); route(g, fx(), -0.4, 0.2); o.start(t); o.stop(t + 0.25); skin(fx(), t + 0.16, 90, 45, 0.3, 0.5, -0.4); noiseBurst(fx(), t + 0.15, 'bandpass', 1400, 1, 0.5, 0.3, -0.2, 0.3, 350); break; }
    case 'wall': skin(fx(), t, 80, 32, 0.6, 0.85, 0.3, 0.45); noiseBurst(fx(), t, 'lowpass', 900, 0.7, 0.45, 0.7, 0.3, 0.4, 150); rumble(t + 0.08, 0.7, 0.5); break;
    case 'fire': noiseBurst(fx(), t, 'lowpass', 500, 0.5, 0.7, 0.55, 0.3, 0.3); noiseBurst(fx(), t, 'bandpass', 2200, 0.8, 1.0, 0.25, 0.3, 0.3, 900); for (let i = 0; i < 8; i++) noiseBurst(fx(), t + rr(0.1, 1.2), 'highpass', rr(2500, 5000), 1, 0.015, rr(0.15, 0.35), rr(-0.2, 0.6), 0.1); break;
    case 'greek': // a crack, a deep thump you feel more than hear, the roar of the fireball, then crackling and falling stone
      noiseBurst(fx(), t, 'highpass', 1800, 0.7, 0.12, 0.9, 0.2, 0.3); skin(fx(), t, 110, 28, 1.6, 1.0, 0.2, 0.5); skin(fx(), t + 0.02, 60, 24, 2.2, 0.8, 0, 0.6);
      noiseBurst(fx(), t, 'lowpass', 900, 0.6, 2.2, 0.9, 0.2, 0.6, 120); noiseBurst(fx(), t + 0.05, 'bandpass', 500, 0.5, 1.8, 0.5, -0.3, 0.6, 180);
      rumble(t + 0.25, 1.4, 0.7);
      for (let i = 0; i < 26; i++) noiseBurst(fx(), t + rr(0.15, 3.2), 'highpass', rr(2000, 5500), 1, rr(0.01, 0.03), rr(0.15, 0.45), rr(-0.6, 0.7), 0.15); break;
    case 'plague': noiseBurst(fx(), t, 'lowpass', 700, 1, 0.25, 0.5, 0.3, 0.2); skin(fx(), t, 150, 60, 0.3, 0.3, 0.3); break;
    case 'rat': for (let i = 0; i < 2 + rnd(3); i++) { const c = SND.ctx, s = t + i * rr(0.08, 0.16), o = c.createOscillator(), m = c.createOscillator(), mg = c.createGain(), g = c.createGain(), f = rr(2800, 4200); o.type = 'sine'; o.frequency.value = f; m.frequency.value = rr(30, 60); mg.gain.value = f * 0.12; m.connect(mg); mg.connect(o.frequency); g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(0.08, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + rr(0.06, 0.14)); o.connect(g); route(g, fx(), rr(0, 0.6), 0.2); o.start(s); m.start(s); o.stop(s + 0.16); m.stop(s + 0.16); } break;
    case 'miss': skin(fx(), t, 70, 40, 0.25, 0.45, 0.2, 0.2); noiseBurst(fx(), t, 'lowpass', 400, 0.6, 0.25, 0.35, 0.2, 0.1); break;
    case 'splash': noiseBurst(fx(), t, 'bandpass', 1200, 0.6, 0.6, 0.5, 0, 0.3, 400); for (let i = 0; i < 5; i++) noiseBurst(fx(), t + rr(0.1, 0.5), 'highpass', 3000, 1, 0.03, 0.15, rr(-0.3, 0.3), 0.2); break;
    case 'clash': { const f = rr(2600, 4200); clink(t, f, 0.06, rr(-0.4, 0.4)); noiseBurst(fx(), t, 'bandpass', f * 1.3, 4, 0.08, 0.2, rr(-0.4, 0.4), 0.2); break; }
    case 'arrows': for (let i = 0; i < 6; i++) noiseBurst(fx(), t + rr(0, 0.25), 'bandpass', rr(3000, 6000), 2, rr(0.2, 0.4), 0.06, rr(-0.6, 0.6), 0.15, 1500); break;
    case 'build': for (let i = 0; i < 3; i++) { skin(fx(), t + i * 0.22, 380, 260, 0.08, 0.35, 0.2, 0.25); noiseBurst(fx(), t + i * 0.22, 'bandpass', 1600, 2, 0.04, 0.3, 0.2, 0.2); } break;
    case 'raise': clink(t, 1600, 0.06, -0.2); clink(t + 0.05, 1250, 0.05, 0.2); skin(fx(), t + 0.02, 160, 110, 0.12, 0.25, 0, 0.2); break;
    case 'march': for (let i = 0; i < 4; i++) { perc(fx(), t + i * 0.18, i % 2 ? 'tak' : 'tabor', 0.28); noiseBurst(fx(), t + i * 0.18 + 0.02, 'lowpass', 500, 0.7, 0.06, 0.15, 0, 0.05); } break;
    case 'cheer': for (let i = 0; i < 10; i++) { const s = t + rr(0, 0.4); noiseBurst(fx(), s, 'bandpass', rr(500, 1100), 4, rr(0.6, 1.2), 0.05, rr(-0.7, 0.7), 0.5); } break;
    case 'victory': [[0, 62], [0.18, 69], [0.36, 74], [0.6, 78], [0.6, 74], [0.6, 69]].forEach(([d, m], i) => shawm(fx(), t + d, m, i >= 3 ? 1.6 : 0.16, 0.06, (i % 3 - 1) * 0.3)); bell(fx(), t + 0.6, 62, 0.12); break;
    case 'defeat': [69, 67, 65, 64].forEach((m, i) => recorder(fx(), t + i * 0.42, m, i === 3 ? 1.8 : 0.38, 0.09)); perc(fx(), t, 'war', 0.4); break;
    case 'ship': noiseBurst(fx(), t, 'lowpass', 600, 0.6, 1.2, 0.3, 0, 0.3, 200); break;
  }
}
