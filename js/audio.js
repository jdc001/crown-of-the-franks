'use strict';
// ================= SOUND =================
// All music is synthesised: a plucked lute or harp, a recorder, a hurdy-gurdy drone, a shawm and a tabor.
// The map theme is a slow Dorian air; the battle theme is a driving estampie over drums.
const SND = { on: true, ctx: null, master: null, music: null, sfx: null, rev: null, mode: null, want: 'map', timer: null, next: 0, step: 0, phrase: null, drones: [], noise: null };
try { const v = localStorage.getItem('cotf-sound'); if (v === '0') SND.on = false; } catch (e) { }
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

function sndInit() {
  if (SND.ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  const c = SND.ctx = new AC();
  SND.master = c.createGain(); SND.master.gain.value = SND.on ? 0.9 : 0; SND.master.connect(c.destination);
  SND.music = c.createGain(); SND.music.gain.value = 0.32; SND.music.connect(SND.master);
  SND.sfx = c.createGain(); SND.sfx.gain.value = 0.6; SND.sfx.connect(SND.master);
  // a small hall reverb
  const len = c.sampleRate * 2.2, ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  SND.rev = c.createConvolver(); SND.rev.buffer = ir;
  const rg = c.createGain(); rg.gain.value = 0.28; SND.rev.connect(rg); rg.connect(SND.master);
  const nb = c.createBuffer(1, c.sampleRate, c.sampleRate); const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  SND.noise = nb;
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
  SND.master.gain.cancelScheduledValues(t); SND.master.gain.setTargetAtTime(SND.on ? 0.9 : 0, t, 0.15);
  if (SND.on) { SND.ctx.resume(); setMusic(SND.want); } else stopMusic();
  return SND.on;
}
function out(node, wet) { node.connect(SND.music); if (wet) { const g = SND.ctx.createGain(); g.gain.value = wet; node.connect(g); g.connect(SND.rev); } }

// ---------- instruments ----------
function pluck(t, m, dur, vol, bright = 2600) {
  const c = SND.ctx, o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
  o.type = 'triangle'; o.frequency.value = mtof(m); o2.type = 'sawtooth'; o2.frequency.value = mtof(m) * 1.002;
  const g2 = c.createGain(); g2.gain.value = 0.25;
  f.type = 'lowpass'; f.frequency.setValueAtTime(bright, t); f.frequency.exponentialRampToValueAtTime(500, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); out(g, 0.5);
  o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}
function flute(t, m, dur, vol) {
  const c = SND.ctx, o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
  o.type = 'sine'; o.frequency.value = mtof(m);
  lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(mtof(m) * 0.006, t + Math.min(0.4, dur));
  lfo.connect(lg); lg.connect(o.frequency);
  const h = c.createOscillator(), hg = c.createGain(); h.type = 'sine'; h.frequency.value = mtof(m) * 2; hg.gain.value = 0.12; h.connect(hg); hg.connect(g);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.07); g.gain.setValueAtTime(vol, t + dur * 0.8); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.12);
  o.connect(g); out(g, 0.6);
  [o, lfo, h].forEach(x => { x.start(t); x.stop(t + dur + 0.2); });
}
function shawm(t, m, dur, vol) {
  const c = SND.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), f2 = c.createBiquadFilter(), g = c.createGain();
  o.type = 'sawtooth'; o.frequency.value = mtof(m);
  f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.4; f2.type = 'lowpass'; f2.frequency.value = 3200;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.025); g.gain.setValueAtTime(vol * 0.85, t + dur * 0.85); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(f2); f2.connect(g); out(g, 0.35);
  o.start(t); o.stop(t + dur + 0.05);
}
function drum(t, kind, vol) {
  const c = SND.ctx;
  if (kind === 'boom') {
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.3);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.connect(g); out(g, 0.2); o.start(t); o.stop(t + 0.5);
  }
  const n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  n.buffer = SND.noise; f.type = kind === 'boom' ? 'lowpass' : 'bandpass'; f.frequency.value = kind === 'boom' ? 400 : 2400; f.Q.value = 0.8;
  const d = kind === 'boom' ? 0.18 : 0.07;
  g.gain.setValueAtTime(vol * (kind === 'boom' ? 0.5 : 0.7), t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  n.connect(f); f.connect(g); out(g, 0.25); n.start(t, Math.random() * 0.5); n.stop(t + d + 0.02);
}
function startDrone(notes, vol) {
  const c = SND.ctx, t = c.currentTime;
  for (const m of notes) {
    const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = Math.random() * 6 - 3;
    f.type = 'lowpass'; f.frequency.value = 520;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 2.5);
    o.connect(f); f.connect(g); out(g, 0.4); o.start(t);
    SND.drones.push({ o, g });
  }
}
function stopDrones() {
  const t = SND.ctx.currentTime;
  SND.drones.forEach(d => { d.g.gain.cancelScheduledValues(t); d.g.gain.setTargetAtTime(0.0001, t, 0.4); d.o.stop(t + 2); });
  SND.drones = [];
}

// ---------- compositions ----------
// Map theme: D Dorian, 3/4, eighth-note harp arpeggios with a recorder air.
const CHORDS = { Dm: [50, 57, 62, 65, 69], C: [48, 55, 60, 64, 67], F: [53, 57, 60, 65, 69], Am: [45, 52, 57, 60, 64], G: [43, 50, 55, 59, 62] };
const AIRS = [
  { ch: ['Dm', 'Dm', 'F', 'C', 'Dm', 'Am', 'C', 'Dm'], mel: [[69, 1.5], [67, .5], [65, 1], [64, 1], [62, 1], [64, 1], [65, 1], [67, 1], [69, 1], [67, 2], [64, 1], [69, 1], [72, 1], [74, 1], [72, 1.5], [71, .5], [69, 1], [67, 1], [65, 1], [64, 1], [62, 3]] },
  { ch: ['Dm', 'G', 'Dm', 'C', 'F', 'F', 'C', 'Dm'], mel: [[74, 1], [72, 1], [69, 1], [71, .5], [69, .5], [67, 2], [69, 1], [65, 1], [62, 1], [64, 3], [65, 1], [67, 1], [69, 1], [72, 2], [69, 1], [67, 1], [64, 1], [60, 1], [62, 3]] },
  { ch: ['Am', 'Am', 'C', 'G', 'Dm', 'F', 'C', 'Dm'], mel: [[69, 2], [72, 1], [71, 1], [69, 1], [67, 1], [64, 2], [67, 1], [62, 1.5], [64, .5], [65, 1], [69, 1], [67, 1], [65, 1], [64, 1.5], [62, .5], [60, 1], [62, 3]] },
  { ch: ['Dm', 'C', 'F', 'C', 'Dm', 'Am', 'G', 'Dm'], mel: null },
];
const ARP = [0, 2, 1, 3, 2, 4];
function newPhrase() {
  const a = AIRS[SND.phrase === null ? 0 : rnd(AIRS.length)];
  const ev = {}; let s = 0;
  if (a.mel) for (const [m, b] of a.mel) { ev[Math.round(s * 2)] = [m, b]; s += b; }
  SND.phrase = { a, ev };
}
function mapStep(i, t, dur) {
  if (i % 48 === 0) newPhrase();
  const k = i % 48, bar = Math.floor(k / 6), ph = SND.phrase;
  const chord = CHORDS[ph.a.ch[bar]];
  pluck(t, chord[ARP[k % 6]] + (k % 6 === 0 ? 0 : 12), dur * 5, k % 6 === 0 ? 0.16 : 0.09);
  if (k % 6 === 0) pluck(t, chord[0] - 12, dur * 8, 0.1, 900);
  const e = ph.ev[k];
  if (e) flute(t, e[0], e[1] * dur * 2 * 0.95, 0.075);
}
// Battle theme: D minor estampie, 4/4 at a gallop, tabor and shawm.
const RIFF = [[74, 74, 72, 74, 77, 76, 74, 72], [69, null, 72, 69, 67, 65, 67, 69], [74, 74, 72, 74, 77, 79, 77, 76], [74, null, null, 72, 74, null, null, null],
  [77, 77, 76, 74, 76, 74, 72, 74], [69, 72, 74, 72, 69, 67, 65, 67], [69, 69, 67, 65, 64, 65, 67, 69], [74, null, 74, null, 74, null, null, null]];
const BASS = { Dm: [38, 38, 50, 38, 38, 50, 45, 38], C: [36, 36, 48, 36, 36, 48, 43, 36] };
const BCH = ['Dm', 'Dm', 'C', 'Dm', 'Dm', 'C', 'C', 'Dm'];
function battleStepMusic(i, t, dur) {
  const k = i % 64, bar = Math.floor(k / 8), e = k % 8;
  const kick = [1, 0, 0, 1, 0, 0, 1, 0][e], tak = [0, 0, 1, 0, 1, 0, 0, 1][e];
  if (kick) drum(t, 'boom', 0.55);
  if (tak) drum(t, 'tak', 0.3);
  pluck(t, BASS[BCH[bar]][e], dur * 1.6, 0.12, 1200);
  const n = RIFF[bar][e];
  if (n) { let d = 1; while (e + d < 8 && RIFF[bar][e + d] === null) d++; shawm(t, n, dur * d * 0.92, 0.07); }
}
function setMusic(mode) {
  SND.want = mode;
  if (!SND.ctx || !SND.on) return;
  if (SND.mode === mode && SND.timer) return;
  stopMusic();
  SND.mode = mode; SND.step = 0; SND.phrase = null; SND.next = SND.ctx.currentTime + 0.1;
  if (mode === 'map') startDrone([38, 45], 0.018); else startDrone([38, 45, 50], 0.03);
  const dur = mode === 'map' ? 60 / 80 / 2 : 60 / 138 / 2;
  SND.timer = setInterval(() => {
    while (SND.next < SND.ctx.currentTime + 0.3) {
      if (mode === 'map') mapStep(SND.step, SND.next, dur); else battleStepMusic(SND.step, SND.next, dur);
      SND.next += dur; SND.step++;
    }
  }, 60);
}
function stopMusic() {
  if (SND.timer) clearInterval(SND.timer);
  SND.timer = null; SND.mode = null;
  if (SND.ctx) stopDrones();
}

// ---------- effects ----------
function noiseHit(t, freq, q, dur, vol, type = 'bandpass', slide) {
  const c = SND.ctx, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  n.buffer = SND.noise; f.type = type; f.frequency.setValueAtTime(freq, t); if (slide) f.frequency.exponentialRampToValueAtTime(slide, t + dur); f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f); f.connect(g); g.connect(SND.sfx); n.start(t, Math.random() * 0.4); n.stop(t + dur + 0.02);
}
function tone(t, f0, f1, dur, vol, type = 'sine') {
  const c = SND.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(SND.sfx); o.start(t); o.stop(t + dur + 0.02);
}
function sfx(kind) {
  if (!SND.on || !SND.ctx || SND.ctx.state !== 'running') return;
  const t = SND.ctx.currentTime;
  switch (kind) {
    case 'click': tone(t, 900, 600, 0.05, 0.08, 'triangle'); break;
    case 'coin': tone(t, 1320, null, 0.12, 0.12, 'triangle'); tone(t + 0.07, 1760, null, 0.18, 0.1, 'triangle'); break;
    case 'launch': noiseHit(t, 1200, 1, 0.45, 0.5, 'bandpass', 300); tone(t, 90, 50, 0.25, 0.5); break;
    case 'wall': noiseHit(t, 500, 0.7, 0.5, 0.9, 'lowpass', 120); tone(t, 70, 35, 0.4, 0.6); break;
    case 'fire': noiseHit(t, 2500, 0.6, 1.1, 0.5, 'bandpass', 700); noiseHit(t, 300, 0.5, 0.6, 0.4, 'lowpass'); break;
    case 'plague': tone(t, 180, 60, 0.35, 0.4, 'sawtooth'); noiseHit(t, 400, 2, 0.3, 0.4); break;
    case 'miss': noiseHit(t, 300, 0.5, 0.3, 0.4, 'lowpass'); break;
    case 'clash': noiseHit(t, 3200 + Math.random() * 1500, 6, 0.12, 0.25); tone(t, 2200 + Math.random() * 900, null, 0.09, 0.05, 'square'); break;
    case 'arrows': noiseHit(t, 5000, 1, 0.35, 0.12, 'highpass', 2000); break;
    case 'horn': {
      const c = SND.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(196, t); o.frequency.linearRampToValueAtTime(220, t + 0.25); o.frequency.setValueAtTime(220, t + 1.1); o.frequency.linearRampToValueAtTime(294, t + 1.3);
      f.type = 'lowpass'; f.frequency.value = 1100; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.35, t + 0.15); g.gain.setValueAtTime(0.35, t + 1.8); g.gain.linearRampToValueAtTime(0.0001, t + 2.3);
      o.connect(f); f.connect(g); g.connect(SND.sfx); o.start(t); o.stop(t + 2.4); break;
    }
    case 'victory': [62, 69, 74, 78, 81].forEach((m, i) => shawm(t + i * 0.16, m, i === 4 ? 1.4 : 0.2, 0.09)); break;
    case 'defeat': [69, 67, 65, 62].forEach((m, i) => flute(t + i * 0.32, m, i === 3 ? 1.6 : 0.3, 0.09)); break;
    case 'bell': [0, 0.5].forEach(d => { tone(t + d, 660, null, 2.2, 0.12, 'sine'); tone(t + d, 1660, null, 1.2, 0.05, 'sine'); }); break;
    case 'ship': noiseHit(t, 600, 0.6, 0.9, 0.25, 'lowpass', 200); tone(t, 140, 120, 0.6, 0.1, 'triangle'); break;
  }
}
