'use strict';
// ================= THE FORGED CHARTER =================
// Monasteries forged land charters all through this century. Copy three strokes of an old charter by tracing them,
// then press the seal while the wax is right. A good forgery makes a lesser lord swear to you for nothing;
// a clumsy one may be discovered, and the Pope excommunicates the forger.
const FORGE_COST = 25, FORGE_EVERY = 4, CW_ = 800, CH_ = 440;
const forgeReady = F => F.forged === undefined || F.forged === null || G.turn - F.forged >= FORGE_EVERY;
const canForge = (p, F) => !p.owner && !p.ally && canAlly(me(), p) && F.bishops >= 1 && forgeReady(F) && F.gold >= FORGE_COST;
function forgeNote(p, F) {
  if (F.bishops < 1) return 'You need at least one bishop: the monks of his abbey do the writing.';
  if (!forgeReady(F)) return `Your scriptorium can forge again in ${FORGE_EVERY - (G.turn - F.forged)} turn${FORGE_EVERY - (G.turn - F.forged) === 1 ? '' : 's'}.`;
  return `${FORGE_COST} d for vellum, wax and a discreet scribe. A fine forgery makes ${p.lord} swear to you for nothing (an alliance costs ${allyCost(me(), p)} d); a poor one may be discovered.`;
}
function openCharter(pid) {
  const p = P(pid);
  mgIntro(`A charter for ${p.name}`, 'scroll', `In an abbey of yours the monks have found, or made, an old charter: the land of ${p.name} was granted to your forebears by ${SC.founder || 'Charlemagne'} himself. Trace the three strokes of the old hand as closely as you can, then press the seal while the wax is right. The better the copy, the likelier ${p.lord} accepts it.`,
    [[`${ico('scroll')}Take up the pen`, `startCharter('${pid}')`, 'gold big', `${FORGE_COST} d`], [`${ico('skip')}Leave it to the scribe`, `autoCharter('${pid}')`, '', `${FORGE_COST} d · average skill`], ['Not now', 'closeModal()', 'ghost']]);
}
function charterStrokes() {
  const arc = [], zig = [[330, 330], [372, 120], [418, 300], [462, 150], [510, 330]], wave = [];
  for (let i = 0; i <= 40; i++) { const a = Math.PI * (1.15 - i / 40 * 1.3); arc.push([205 + 95 * Math.cos(a), 225 - 105 * Math.sin(a)]); }
  for (let i = 0; i <= 40; i++) wave.push([565 + i * 4.6, 230 + Math.sin(i / 40 * Math.PI * 2.5) * 48]);
  const dense = pts => { const out = []; for (let i = 0; i < pts.length - 1; i++) { const [a, b] = pts[i], [c, d] = pts[i + 1], n = Math.ceil(Math.hypot(c - a, d - b) / 6); for (let k = 0; k < n; k++) out.push([a + (c - a) * k / n, b + (d - b) * k / n]); } out.push(pts[pts.length - 1]); return out; };
  return [dense(arc), dense(zig), dense(wave)];
}
function startCharter(pid) {
  const p = P(pid), F = G.fac[me()];
  if (!canForge(p, F)) return toast('You cannot forge a charter now');
  F.gold -= FORGE_COST; F.forged = G.turn;
  showModal(mgFrame([['mg-time', 'Time'], ['mg-stroke', 'Stroke'], ['mg-q', 'Likeness']], `<div class="row ctr" id="mg-seal" style="display:none"><button class="btn gold big" onclick="pressSeal()"><span class="lbl">${ico('check')}Press the seal</span></button></div>`), 'wide ctcard');
  const S = MG = mgScene(CW_, CH_);
  Object.assign(S, { kind: 'charter', p, strokes: charterStrokes(), i: 0, scores: [], cur: null, inked: [], left: 26, phase: 'trace', msg: 'Start at the green dot and trace the first stroke.' });
  S.ground = makeLayer(CW_, CH_, S.dpr, x => drawCharterGround(x));
  S.cv.onpointerdown = e => {
    if (S.phase === 'seal') return pressSeal();
    if (S.phase !== 'trace') return;
    const q = S.pt(e), st = S.strokes[S.i][0];
    if (Math.hypot(q.x - st[0], q.y - st[1]) > 44) { S.msg = 'Begin at the green dot.'; return; }
    S.cur = [[q.x, q.y]]; S.cv.setPointerCapture && S.cv.setPointerCapture(e.pointerId);
  };
  S.cv.onpointermove = e => { if (S.cur) { const q = S.pt(e); S.cur.push([q.x, q.y]); } };
  S.cv.onpointerup = S.cv.onpointercancel = () => { if (S.cur) { scoreStroke(S); } };
  sfx('click');
  mgRun(S, dt => { charterUpdate(S, dt); if (MG === S) charterDraw(S); });
}
function scoreStroke(S) {
  const g = S.strokes[S.i], u = S.cur; S.cur = null;
  if (u.length < 4) { S.msg = 'Keep the pen on the vellum to the end of the stroke.'; return; }
  const near = (pt, set) => set.reduce((m, q) => Math.min(m, Math.hypot(pt[0] - q[0], pt[1] - q[1])), 1e9);
  const cover = g.filter(q => near(q, u) < 17).length / g.length;
  const acc = clamp(1 - (u.reduce((s, q) => s + near(q, g), 0) / u.length) / 26, 0, 1);
  const sc = cover * 0.6 + acc * 0.4;
  S.scores.push(sc); S.inked.push(u); S.i++;
  sfx(sc > 0.7 ? 'coin' : 'miss');
  S.msg = sc > 0.85 ? 'A perfect copy of the old hand.' : sc > 0.65 ? 'A fair copy.' : 'A shaky line. It may not pass.';
  if (S.i >= S.strokes.length) toSeal(S);
}
function toSeal(S) { S.phase = 'seal'; S.sealT = 0; S.msg = 'Now the seal. Press it when the wax is in the gold band.'; const b = $('#mg-seal'); if (b) b.style.display = ''; }
// the wax swings between too cold and too hot; the gold band is narrow
const sealPos = S => 0.5 + 0.5 * Math.sin(S.sealT * 3.1);
function pressSeal() {
  const S = MG; if (!S || S.kind !== 'charter' || S.phase !== 'seal') return;
  const d = Math.abs(sealPos(S) - 0.5); S.seal = clamp(1 - d / 0.22, 0, 1); S.phase = 'done';
  sfx('bell'); buzz(30);
  setTimeout(() => finishCharter(S), 700);
}
function charterUpdate(S, dt) {
  if (S.phase === 'trace') { S.left -= dt; if (S.left <= 0) { while (S.scores.length < S.strokes.length) S.scores.push(0.15); S.msg = 'Out of time: the last strokes are rushed.'; toSeal(S); } }
  else if (S.phase === 'seal') S.sealT += dt;
}
function charterQuality(S) { const tr = S.scores.reduce((a, b) => a + b, 0) / S.strokes.length; return tr * 0.7 + (S.seal || 0) * 0.3; }
function charterOutcome(p, q) {
  const F = G.fac[me()];
  let res;
  if (q >= 0.75 || (q >= 0.5 && Math.random() < (q - 0.5) * 2 + 0.25)) { p.ally = me(); res = 'ok'; }
  else if (q < 0.5 && Math.random() < 0.45) { F.excom = Math.max(F.excom, 3); res = 'caught'; }
  else res = 'doubt';
  note(res === 'ok' ? `${p.lord} accepts an old charter and swears to you.` : res === 'caught' ? `A forged charter for ${p.name} is exposed; the Pope excommunicates ${rulerOf(me())}.` : `${p.lord}'s clerks are not convinced by your charter.`);
  return res;
}
function charterReport(p, q, res) {
  const pct_ = Math.round(q * 100);
  if (res === 'ok') mgResult(`${p.name} swears to you`, `The charter is a likeness of ${pct_}%. ${p.lord} reads it, kisses the seal, and swears to your house as his forebears swore to ${SC.founder || 'Charlemagne'}. You receive half of ${p.name}'s income, and your armies may march through it.`, true, 'scroll');
  else if (res === 'caught') mgResult('The forgery is exposed!', `A likeness of only ${pct_}%. ${p.lord}'s clerks find the ink too fresh and the seal crooked, and send the charter to Rome. The Pope excommunicates ${rulerOf(me())} for 3 turns.`, false, 'interdict');
  else mgResult('The clerks are not convinced', `A likeness of ${pct_}%. ${p.lord} thanks you for the charter and does nothing. Your scriptorium can try again in ${FORGE_EVERY} turns.`, false, 'scroll');
}
function finishCharter(S) { if (MG !== S) return; const q = charterQuality(S); charterReport(S.p, q, charterOutcome(S.p, q)); }
function autoCharter(pid) {
  const p = P(pid), F = G.fac[me()]; if (!canForge(p, F)) return toast('You cannot forge a charter now');
  F.gold -= FORGE_COST; F.forged = G.turn;
  const q = 0.4 + Math.random() * 0.45; charterReport(p, q, charterOutcome(p, q));
}
function drawCharterGround(x) {
  const g = x.createRadialGradient(CW_ / 2, CH_ / 2, 60, CW_ / 2, CH_ / 2, 480); g.addColorStop(0, '#f6ebcc'); g.addColorStop(1, '#d9c393'); x.fillStyle = g; x.fillRect(0, 0, CW_, CH_);
  x.strokeStyle = 'rgba(120,90,50,.18)'; x.lineWidth = 1; for (let y = 40; y < CH_; y += 26) { x.beginPath(); x.moveTo(30, y); x.lineTo(CW_ - 30, y); x.stroke(); }
  // lines of faded script, for the look of it
  x.strokeStyle = 'rgba(70,45,20,.18)'; x.lineWidth = 1.4; x.beginPath();
  for (let r = 0; r < 3; r++) for (let i = 0; i < 46; i++) { const bx = 40 + i * 16, by = 380 + r * 18 - 340 * (r === 0 ? 0 : 0); const y0 = r === 0 ? 34 : r === 1 ? 398 : 416; x.moveTo(bx, y0); x.quadraticCurveTo(bx + 4, y0 - 7 - (i % 3) * 2, bx + 9, y0); }
  x.stroke();
  x.fillStyle = '#8e1f1b'; x.font = '700 15px Cinzel, Georgia, serif'; x.textAlign = 'center'; x.fillText('IN NOMINE SANCTAE ET INDIVIDUAE TRINITATIS', CW_ / 2, 22);
}
function charterDraw(S) {
  const x = S.ctx; x.drawImage(S.ground, 0, 0, CW_, CH_);
  x.lineCap = 'round'; x.lineJoin = 'round';
  // the old hand: finished strokes in ink, the current one dotted
  S.strokes.forEach((g, k) => {
    if (k < S.i) return;
    x.strokeStyle = k === S.i ? 'rgba(90,60,30,.55)' : 'rgba(90,60,30,.16)'; x.lineWidth = k === S.i ? 9 : 6; x.setLineDash(k === S.i ? [2, 10] : []);
    x.beginPath(); g.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); x.setLineDash([]);
    if (k === S.i && S.phase === 'trace') { const [a, b] = g[0], [c, d] = g[g.length - 1]; x.fillStyle = '#3f6b35'; x.beginPath(); x.arc(a, b, 11 + Math.sin(S.t * 6) * 2, 0, 7); x.fill(); x.fillStyle = 'rgba(142,31,27,.6)'; x.beginPath(); x.arc(c, d, 7, 0, 7); x.fill(); }
  });
  x.strokeStyle = '#2a1408'; x.lineWidth = 6;
  for (const u of S.inked.concat(S.cur ? [S.cur] : [])) { x.beginPath(); u.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); }
  if (S.phase === 'seal' || S.phase === 'done') {
    const bx = 250, by = 352, bw = 300, pos = S.phase === 'done' ? 1 - Math.abs(0.5 - 0.5) : sealPos(S);
    const grad = x.createLinearGradient(bx, 0, bx + bw, 0); grad.addColorStop(0, '#6d8fb0'); grad.addColorStop(.5, '#e2b33c'); grad.addColorStop(1, '#b8342c');
    x.fillStyle = grad; x.fillRect(bx, by, bw, 16); x.strokeStyle = '#2a1d12'; x.lineWidth = 1.5; x.strokeRect(bx, by, bw, 16);
    x.strokeStyle = '#fff8e4'; x.lineWidth = 2; x.strokeRect(bx + bw * 0.39, by - 3, bw * 0.22, 22);
    x.font = 'italic 13px "IM Fell English", Georgia, serif'; x.fillStyle = '#2a1d12'; x.textAlign = 'left'; x.fillText('too cold', bx, by + 32); x.textAlign = 'right'; x.fillText('too hot', bx + bw, by + 32);
    if (S.phase === 'seal') { x.fillStyle = '#2a1d12'; x.beginPath(); x.moveTo(bx + bw * pos, by - 4); x.lineTo(bx + bw * pos - 7, by - 14); x.lineTo(bx + bw * pos + 7, by - 14); x.fill(); }
    else { const s = S.seal || 0; x.fillStyle = s > 0.6 ? '#8e1f1b' : '#a8574f'; x.beginPath(); x.arc(CW_ - 90, CH_ - 110, 34, 0, 7); x.fill(); x.strokeStyle = '#5a1410'; x.lineWidth = 3; x.stroke(); x.fillStyle = '#e8c9a0'; x.font = '700 22px Cinzel, Georgia, serif'; x.textAlign = 'center'; x.fillText('✠', CW_ - 90, CH_ - 102); }
  }
  const tr = S.scores.length ? S.scores.reduce((a, b) => a + b, 0) / S.scores.length : 0;
  mgSet('mg-time', S.phase === 'trace' ? Math.max(0, Math.ceil(S.left)) + 's' : '—'); mgSet('mg-stroke', `${Math.min(S.i + (S.phase === 'trace' ? 1 : 0), 3)}/3`); mgSet('mg-q', S.scores.length ? Math.round(tr * 100) + '%' : '—');
  const m = $('#mgmsg'); if (m && m.textContent !== S.msg) m.textContent = S.msg;
}

// ================= HAGGLING OVER A RANSOM =================
// An envoy names a price. Each offer he thinks too low costs his patience; an insulting one costs more.
// He has a price he will settle for, which you do not see. Run out his patience and he rides home for the turn.
let HG = null;
const ENVOY = {
  open: ['"My lord will not part with his guest for less than this."', '"A great lord commands a great price. Here is ours."'],
  low: ['"You jest. My lord feeds his prisoner better than that."', '"That would not buy his horse."', '"I will pretend I did not hear it."'],
  near: ['"Closer. My lord is not unreasonable."', '"We are within a day\'s ride of each other."', '"Hm. Add a little and we may shake hands."'],
  insult: ['"You insult my lord and his guest both!"', '"I did not ride three days to be laughed at."'],
  yes: ['"Done. Your lord rides home tomorrow."', '"Agreed. The gold, then, and he is free."'],
  walk: ['"My lord will hear of this. Good day."', '"I return home. Perhaps next season your purse will be fuller."'],
  // when you are the captor, their envoy is the one paying
  popen: ['"My lord\'s house offers this for his return."', '"We have brought what is fair. Here it is."'],
  plow: ['"So much? My lord\'s treasury is not bottomless."', '"Be reasonable. He eats little."'],
  pnear: ['"You drive a hard bargain. Perhaps a little more."', '"We could stretch to this, and no further."'],
  pinsult: ['"That is robbery, not ransom!"', '"Keep him, then, if you think him worth so much."'],
  pyes: ['"Very well. It is agreed."', '"Done. He comes home with us."'],
  pwalk: ['"We will come back when you are in a better humour."', '"Keep him another season. We go."'],
};
const say = k => pick(ENVOY[k]);
const canHaggleRansom = F => !!(F.captive && F.captive.by && G.fac[F.captive.by] && G.fac[F.captive.by].alive && ransomHeld(me()) < 3 && F.haggled !== G.turn);
function openHaggleRansom() {
  const F = G.fac[me()]; if (!canHaggleRansom(F)) return doRansom();
  const std = ransomPrice(me());
  HG = { mode: 'pay', std, fid: F.captive.by, price: Math.round(std * 1.3), res: Math.round(std * (0.72 + Math.random() * 0.22)), patience: 3, line: say('open'), offer: Math.min(F.gold, Math.round(std * 0.8)) };
  drawHaggle();
}
function openHagglePrisoner(fid) {
  const o = G.offers.find(x => x.fid === fid); if (!o) return;
  HG = { mode: 'sell', fid, price: o.sum, price0: o.sum, res: Math.min(G.fac[fid].gold, Math.round(o.sum * (1.15 + Math.random() * 0.35))), patience: 3, line: say('popen'), offer: Math.round(o.sum * 1.3) };
  drawHaggle();
}
function drawHaggle() {
  const H = HG, F = G.fac[me()], pay = H.mode === 'pay';
  const lo = pay ? 15 : H.price, hi = pay ? Math.max(15, Math.min(F.gold, H.price)) : Math.max(H.price + 10, H.price * 2);
  H.offer = clamp(H.offer, lo, hi);
  const seals = [0, 1, 2].map(i => `<span style="opacity:${i < H.patience ? 1 : .2}">${ico('fleur', 'lg')}</span>`).join('');
  showModal(`<h2>${ico('chain')} ${pay ? `Ransom for ${esc(rulerOf(me()))}` : `Ransom for ${esc(rulerOf(H.fid))}`}</h2>
    <div class="vs" style="margin:8px 0"><div class="bcol">${shield(H.fid, 34)}<div class="bname">The envoy of ${esc(FAC(H.fid).name)}</div><p class="sub" style="text-align:center">${H.line}</p><div title="His patience">${seals}</div></div></div>
    <p class="ctr">${pay ? 'He asks' : 'They offer'} <b class="num" style="font-size:20px">${H.price} d</b>${pay ? ` · your treasury ${F.gold} d` : ''}</p>
    <h3>${pay ? 'Your offer' : 'Your price'}</h3>
    <div class="ctr"><b class="num" id="hgv" style="font-size:22px">${H.offer} d</b></div>
    <input type="range" id="hgr" min="${lo}" max="${hi}" step="1" value="${H.offer}" style="width:100%;accent-color:#b8892c" oninput="HG.offer=+this.value;document.getElementById('hgv').textContent=this.value+' d'">
    <div class="grid2"><button class="btn gold" onclick="haggleOffer()">${pay ? 'Make the offer' : 'Name your price'}</button><button class="btn" onclick="haggleAccept()" ${pay && F.gold < H.price ? 'disabled' : ''}>${pay ? `Pay his price · ${H.price} d` : `Take their offer · ${H.price} d`}</button></div>
    <p class="sub ctr" style="margin-top:8px">${pay ? 'Offer too little and he loses patience; insult him and he loses more. He has a price he will settle for.' : 'Ask too much and they lose patience. They have more in their coffers than they offered.'}</p>
    <div class="row ctr"><button class="btn sm ghost" onclick="haggleLeave()">${pay ? 'Send him away for now' : 'Keep the prisoner for now'}</button></div>`, '', {});
}
function haggleOffer() {
  const H = HG; if (!H) return;
  const pay = H.mode === 'pay', v = H.offer;
  if (pay ? v >= H.res : v <= H.res) return haggleDone(v);
  const ratio = pay ? v / H.res : H.res / v;
  if (ratio < 0.6) { H.patience -= 2; H.line = say(pay ? 'insult' : 'pinsult'); sfx('miss'); buzz(30); }
  else { H.patience -= 1; H.line = say(pay ? (ratio > 0.85 ? 'near' : 'low') : (ratio > 0.85 ? 'pnear' : 'plow')); sfx('click'); }
  // the envoy moves toward the offer, never past his own limit
  if (pay) H.price = Math.max(H.res, Math.round(H.price - (H.price - v) * 0.35)); else H.price = Math.min(H.res, Math.round(H.price + (v - H.price) * 0.4));
  if (H.patience <= 0) return haggleWalk();
  drawHaggle();
}
function haggleAccept() { const H = HG; if (!H) return; haggleDone(H.price); }
function haggleDone(sum) {
  const H = HG; HG = null; const pay = H.mode === 'pay';
  if (pay) { if (G.fac[me()].gold < sum) return toast('Not enough deniers'); payRansom(me(), sum); }
  else { G.offers = G.offers.filter(o => o.fid !== H.fid); if (G.fac[H.fid].gold < sum) sum = G.fac[H.fid].gold; payRansom(H.fid, sum); }
  tutorDid('haggle');
  G.reports = G.reports.filter(r => !/Your lord is free|Ransom paid/.test(r.title));
  mgResult(pay ? `${rulerOf(me())} rides home` : 'Ransom paid', `${say(pay ? 'yes' : 'pyes')} ${pay ? `You pay ${sum} d${sum < H.std ? `, ${H.std - sum} d less than the usual price` : ''}.` : `${FAC(H.fid).name} pays you ${sum} d${sum > H.price0 ? `, ${sum - H.price0} d more than they first offered` : ''}.`}`, true, 'chain');
}
function haggleWalk() {
  const H = HG; HG = null;
  if (H.mode === 'pay') { G.fac[me()].haggled = G.turn; note(`${FAC(H.fid).name}'s envoy breaks off the ransom talks.`); }
  else { G.offers = G.offers.filter(o => o.fid !== H.fid); note(`${FAC(H.fid).name}'s envoy withdraws the ransom offer.`); }
  mgResult('The envoy rides away', `${say(H.mode === 'pay' ? 'walk' : 'pwalk')} ${H.mode === 'pay' ? 'You can try again next turn.' : 'They may offer again next turn.'}`, false, 'chain');
}
function haggleLeave() { HG = null; closeModal(); render(); }

// ================= THE CHAMPAGNE FAIR =================
// Once a year, in summer, the fair at Troyes. You bring what your lands produce: grain and wool from your farms,
// cloth from your market towns, metal from your mines, salt and fish from your ports. More buildings mean more
// lots to sell; higher levels mean finer goods; more kinds of goods draw more buyers. Over three days you choose
// when to sell each kind: a merchant's word on tomorrow's buyers is usually right.
const WARES = [
  { id: 'farm', grades: ['Grain', 'Wool', 'Fine wool'], v: 9, col: '#b58a3a' },
  { id: 'market', grades: ['Cloth', 'Dyed cloth', 'Scarlet cloth'], v: 18, col: '#7a3f8f' },
  { id: 'mine', grades: ['Iron', 'Lead', 'Silver'], v: 20, col: '#6b7480' },
  { id: 'port', grades: ['Salt', 'Salt fish', 'Wine by sea'], v: 14, col: '#2a7a8a' },
];
const GOODS = WARES.map(w => [w.id]);
const FAIR_DAYS = 3;
const yearOf = t => SC.date.y0 + Math.floor((t + SC.date.yOff) / 4);
const markets = () => owned(me()).filter(p => p.b.market).length;
const fairOpen = () => !!G && !G.over && G.turn >= 1 && SEASONS[(G.turn + SC.date.s0) % 4] === 'Summer' && G.fairYear !== yearOf(G.turn) && (markets() > 0 || !!TR(me()).fair);
// what the realm brings: lots of each ware (one per building level) and the grade of the best of them
function fairStock() {
  const out = [];
  for (const w of WARES) {
    const lv = owned(me()).map(p => p.b[w.id] || 0).filter(n => n > 0);
    if (!lv.length) continue;
    const lots = lv.reduce((a, b) => a + b, 0), grade = Math.min(2, Math.max(...lv) - 1), full = w.v * [1, 1.3, 1.6][grade];
    // the buyers at one fair can only take so much of one thing: past two lots, each extra lot fetches less
    const each = Math.max(1, Math.round(full * fairDepth(lots) / lots));
    out.push({ id: w.id, n: w.grades[grade], lots, each, full: Math.round(full), col: w.col });
  }
  return out;
}
const fairDepth = n => n <= 2 ? n : 2 * Math.sqrt(n / 2);
const fairBonus = st => (1 + 0.1 * Math.max(0, st.length - 1)) * (TR(me()).fair || 1);
const fairWorth = st => Math.round(st.reduce((s, x) => s + x.lots * x.each, 0) * fairBonus(st));
const fairCap = () => fairWorth(fairStock());
let FR = null;
function openFair() {
  if (!fairOpen()) return toast('The fair opens each summer, for lords who hold a market town');
  const st = fairStock();
  if (!st.length) return toast('Your lands have nothing to sell: build farms, markets, mines or ports');
  const list = st.map(x => `<div class="frow"><span class="fdot" style="background:${x.col}"></span><span class="fname">${x.n}</span><span class="fheld">${x.lots} lot${x.lots > 1 ? 's' : ''}</span><span class="fpr num">${x.each} d each${x.each < x.full ? ` <small class="sub">(${x.full} d for the first lots)</small>` : ''}</span></div>`).join('');
  mgIntro(SC.fair.title, 'market', `${SC.fair.who} Your carts carry what your lands produce. Over three days, sell each kind when buyers pay best; whatever is unsold on the last day goes cheap.
    <h3>Your carts</h3><div class="ftab">${list}</div>
    <p class="sub">Worth about <b>${fairWorth(st)} d</b> at a fair price${st.length > 1 ? `, with ${Math.round((0.1 * (st.length - 1)) * 100)}% more for bringing ${st.length} kinds of goods` : ''}${TR(me()).fair ? `, and ${Math.round((TR(me()).fair - 1) * 100)}% more as ${SC.fair.lord}` : ''}. More farms, markets, mines and ports bring more lots, though a glut of one ware lowers what each lot fetches; higher levels bring finer goods, and more kinds of goods draw more buyers.</p>`,
    [[`${ico('market')}Go to the fair`, `startFair()`, 'gold big'], [`${ico('skip')}Send your factor`, `autoFair()`, '', 'sells everything at a fair price'], ['Not this year', 'closeModal()', 'ghost']]);
}
// a price for each ware today, and what the merchants say about tomorrow
function fairDayPrices() {
  for (const x of FR.stock) {
    const t = FR.tip[x.id];
    let m = FR.day === 1 ? 0.85 + Math.random() * 0.3 : FR.pct[x.id] * (t && t.real === 'up' ? 1.1 + Math.random() * 0.12 : t && t.real === 'down' ? 0.78 + Math.random() * 0.1 : 0.95 + Math.random() * 0.1);
    FR.pct[x.id] = clamp(m, 0.65, 1.4);
    if (FR.day < FAIR_DAYS) {
      const real = Math.random() < 0.5 ? 'up' : 'down', honest = !!TR(me()).fair || Math.random() < 0.85;
      FR.tip[x.id] = { real, said: honest ? real : real === 'up' ? 'down' : 'up' };
    } else FR.tip[x.id] = null;
  }
}
function startFair() {
  const st = fairStock(); if (!st.length) return;
  G.fairYear = yearOf(G.turn); tutorDid('fair');
  FR = { stake: 0, stock: st, left: Object.fromEntries(st.map(x => [x.id, x.lots])), pct: {}, tip: {}, take: 0, day: 1, bonus: fairBonus(st) };
  fairDayPrices(); setMusic('fair'); drawFair();
}
const fairPrice = x => Math.max(1, Math.round(x.each * FR.pct[x.id] * FR.bonus));
const pctWord = p => p >= 1.3 ? ['Buyers crowd your stall', 'good'] : p >= 1.1 ? ['Brisk trade', 'good'] : p >= 0.92 ? ['A fair price', ''] : p >= 0.75 ? ['Slow trade', 'bad'] : ['Few buyers', 'bad'];
function drawFair() {
  const last = FR.day === FAIR_DAYS;
  const stall = FR.stock.reduce((s, x) => s + FR.left[x.id] * fairPrice(x), 0);
  const rows = FR.stock.map(x => {
    const n = FR.left[x.id], p = FR.pct[x.id], [w, c] = pctWord(p), t = FR.tip[x.id];
    return `<div class="fwcard${n ? '' : ' sold'}"><div class="fc1"><span class="fdot" style="background:${x.col}"></span><b>${x.n}</b><small>${n ? `${n} lot${n > 1 ? 's' : ''} left` : 'all sold'}</small></div>
      <div class="fc2"><span class="num" style="font-size:20px">${fairPrice(x)} d</span><small class="${c}">${w} (${Math.round(p * 100)}%)</small>${t ? `<small><i>Tomorrow: ${t.said === 'up' ? 'more buyers are coming, they say' : 'buyers are leaving, they say'}</i></small>` : ''}</div>
      <div class="fc3"><button class="btn sm gold" onclick="fairSell('${x.id}',1)" ${n ? '' : 'disabled'}>Sell all</button><button class="btn sm" onclick="fairSell('${x.id}',0.5)" ${n > 1 ? '' : 'disabled'}>Sell half</button></div></div>`;
  }).join('');
  showModal(`<h2>${ico('market')} ${SC.fair.title} · day ${FR.day} of ${FAIR_DAYS}</h2>
    <div class="tiles" style="grid-template-columns:repeat(2,1fr)"><div class="tile">${ico('coin')}<div class="v">${FR.take}</div><div class="k">Sold so far</div></div><div class="tile">${ico('market')}<div class="v">${stall}</div><div class="k">Still in the stall, today</div></div></div>
    <p class="sub">${last ? 'The last day: anything you do not sell now goes to the Lombards at four-fifths of today\'s price.' : 'Sell what fetches a good price today; hold what the merchants say will rise. They are usually right.'}</p>
    <div class="fcards">${rows}</div>
    <div class="row ctr">${last ? `<button class="btn gold big" onclick="closeFair()">Close the stall</button>` : `<button class="btn gold big" onclick="fairNextDay()"><span class="lbl">${ico('next')}Next day</span></button>`}</div>`, 'wide', {});
}
function fairSell(id, frac) {
  const x = FR.stock.find(s => s.id === id), n = Math.max(1, Math.ceil(FR.left[id] * frac));
  if (!x || !FR.left[id]) return;
  const k = Math.min(n, FR.left[id]); FR.left[id] -= k; FR.take += k * fairPrice(x); sfx('coin'); buzz(8); drawFair();
}
function fairTrade(id, n) { if (n < 0) fairSell(id, 1); }
function fairNextDay() { FR.day++; fairDayPrices(); sfx('bell'); drawFair(); }
function closeFair() {
  const rest = FR.stock.reduce((s, x) => s + FR.left[x.id] * Math.round(fairPrice(x) * 0.8), 0), worth = FR.take + rest;
  G.fac[me()].gold += worth; FR = null;
  note(`At ${SC.fair.name} your goods fetch ${worth} d.`);
  mgResult('The fair is over', `Your carts come home from ${SC.fair.at} with ${worth} d${rest ? `, ${rest} d of it from the Lombards on the last day` : ''}.`, true, 'market');
}
function autoFair() {
  const st = fairStock(); if (!st.length) return;
  G.fairYear = yearOf(G.turn); const worth = Math.round(fairWorth(st) * (0.95 + Math.random() * 0.1));
  G.fac[me()].gold += worth; note(`Your factor sells your goods at ${SC.fair.at} for ${worth} d.`);
  mgResult('Your factor returns', `He sold everything your carts carried at a fair price: ${worth} d.`, true, 'market');
}
