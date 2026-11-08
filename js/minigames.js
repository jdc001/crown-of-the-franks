'use strict';
// ================= MINI-GAMES: shared frame =================
// Every mini-game opens on an intro card with a way to play it and a way to let it resolve itself.
// MG holds the running scene (canvas, loop, state); closeModal() ends and frees it like the battle and catapult.
let MG = null;
function mgIntro(title, icon, body, btns) {
  showModal(`<div class="rep"><div class="sealmark">${ico(icon)}</div><h2>${title}</h2><p>${body}</p>
    <div class="stack" style="margin-top:12px">${btns.map(([label, on, cls, small]) => `<button class="btn ${cls || ''}" onclick="${on}"><span class="lbl">${label}</span>${small ? `<small>${small}</small>` : ''}</button>`).join('')}</div></div>`);
}
function mgResult(title, body, good, icon) {
  if (MG) { MG.dead = true; releaseScene(MG); MG = null; }
  sfx(good ? 'victory' : 'defeat'); buzz(good ? 40 : 60);
  showModal(`<div class="rep${good ? '' : ' badrep'}"><div class="sealmark">${ico(icon || (good ? 'star' : 'swords'))}</div><h2>${title}</h2><p>${body}</p>
    <div class="row ctr"><button class="btn gold big" onclick="closeModal();save();render();showReports()">Continue</button></div></div>`);
}
// a canvas scene inside the open modal, sized to what the screen can show
function mgScene(W, H) {
  const cv = $('#mgc'), dpr = clamp((cv.getBoundingClientRect().width || W) * (window.devicePixelRatio || 1) / W, 1, 2);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
  return { cv, ctx, dpr, pt, W, H, t: 0, last: 0, dead: false };
}
// the scene's own loop: it stops when the scene ends or another takes its place
function mgRun(S, frame) {
  const tick = ts => { if (MG !== S || S.dead) return; const dt = Math.min(0.05, S.last ? (ts - S.last) / 1000 : 0.016); S.last = ts; S.t += dt; frame(dt); if (MG === S && !S.dead) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
const mgSet = (id, v) => { const el = document.getElementById(id); if (el && el.innerHTML !== String(v)) el.innerHTML = v; };
function mgFrame(hud, foot) {
  return `<div class="cthud">${hud.map(([id, k]) => `<div class="ct"><div class="v" id="${id}"></div><div class="k">${k}</div></div>`).join('')}</div>
    <canvas id="mgc" class="mgc"></canvas><div id="mgmsg" class="mgmsg"></div>${foot || ''}`;
}

// ================= MINING =================
// A cross-section under the walls. The tunnel digs itself forward; the player steers it up and down.
// Hard rock slows it, the water table floods it, the defenders' counter-mines break into it.
// Reaching the foundations fires the props and brings a section of wall down, whatever the walls are made of.
const MW_ = 800, MH_ = 440, M_SURF = 110, M_WALL = 650, M_WATER = 382, M_BAND = [150, 235], M_TIME = 32;
const canMine = (A, p) => slotState(A) === 'active' && A.siege === p.id && !A.bombarded && !p.ruined && p.b.castle && A.foot >= 4;
function openMine(pid) {
  const p = P(pid);
  mgIntro(`Mining under ${p.name}`, 'mine', `Your sappers dig toward the walls. Hold your finger on the field to steer the tunnel up or down: stay under the foundations, keep clear of hard rock and the water below, and listen for the defenders digging counter-mines. Reach the wall and the props are fired.${castleLv(p) >= 2 ? ' Stone shrugs off a catapult; a mine brings it down all the same.' : ''} Mining takes the place of a bombardment this turn.`,
    [[`${ico('mine')}Start digging`, `startMine('${pid}')`, 'gold big'], [`${ico('skip')}Leave it to the sappers`, `autoMine('${pid}')`, '', 'resolved at once, at average skill'], ['Not now', 'closeModal()', 'ghost']]);
}
function startMine(pid) {
  const p = P(pid), A = myA();
  showModal(mgFrame([['mg-time', 'Time'], ['mg-dist', 'Distance'], ['mg-lost', 'Men lost']], `<div class="row ctr"><button class="btn" onclick="endMine(false,'You call the sappers back.')">Abandon the mine</button></div>`), 'wide ctcard');
  const S = MG = mgScene(MW_, MH_);
  Object.assign(S, { kind: 'mine', p, A, head: { x: 70, y: 190 }, ty: 190, trail: [[40, 190], [70, 190]], lost: 0, left: M_TIME, cm: [], nextCm: 3 + Math.random() * 2, msg: 'Hold your finger on the field to steer. The tunnel digs itself forward.', over: false, fx: [], lv: Math.max(1, castleLv(p)) });
  S.rocks = []; for (let i = 0; i < 7; i++) { let r; do { r = { x: 170 + Math.random() * 430, y: 150 + Math.random() * 210, rx: 18 + Math.random() * 18, ry: 14 + Math.random() * 12 }; } while (Math.abs(r.y - 190) < 30 && r.x < 260); S.rocks.push(r); }
  S.ground = makeLayer(MW_, MH_, S.dpr, x => drawMineGround(x, S));
  const steer = e => { if (S.over) return; S.ty = clamp(S.pt(e).y, M_SURF + 10, MH_ - 20); };
  S.cv.onpointerdown = e => { S.cv.setPointerCapture && S.cv.setPointerCapture(e.pointerId); S.down = true; steer(e); };
  S.cv.onpointermove = e => { if (S.down) steer(e); };
  S.cv.onpointerup = S.cv.onpointercancel = () => { S.down = false; };
  setMusic('battle'); sfx('horn');
  mgRun(S, dt => { mineUpdate(S, dt); if (MG === S) mineDraw(S); });
}
const inRock = (S, x, y) => S.rocks.some(r => ((x - r.x) / r.rx) ** 2 + ((y - r.y) / r.ry) ** 2 < 1);
function mineUpdate(S, dt) {
  if (S.over) { S.collapse = (S.collapse || 0) + dt; if (S.collapse > 1.8 && !S.done) { S.done = true; finishMine(S); } return; }
  S.left -= dt;
  const h = S.head, rock = inRock(S, h.x + 8, h.y);
  h.x += (rock ? 7 : 34) * dt;
  const dy = S.ty - h.y; h.y += Math.sign(dy) * Math.min(Math.abs(dy), 70 * dt);
  const lt = S.trail[S.trail.length - 1]; if (Math.hypot(h.x - lt[0], h.y - lt[1]) > 6) S.trail.push([h.x, h.y]);
  if (rock && !S.rockMsg) { S.msg = 'Hard rock! The picks barely bite. Steer around it.'; S.rockMsg = true; } if (!rock) S.rockMsg = false;
  if (h.y < M_SURF + 22) { S.lost++; h.y = M_SURF + 45; S.ty = h.y; S.msg = 'Too shallow! The roof caves in and buries a sapper.'; sfx('wall'); buzz(40); S.fx.push({ x: h.x, y: h.y, t: 0 }); }
  if (h.y > M_WATER - 8) return endMine(false, 'You dig into the water table. The mine floods and the sappers scramble out.');
  // counter-mines: a warning, then a shaft dug down from the castle side, then a listening gallery
  S.nextCm -= dt;
  if (S.nextCm <= 0 && h.x < M_WALL - 120) { S.nextCm = 3.5 + Math.random() * 2.5; S.cm.push({ x: clamp(h.x + 110 + Math.random() * 180, 300, 620), warn: 1.3, depth: 175 + Math.random() * 160, y: M_SURF, gal: 0 }); S.msg = 'You hear digging ahead. The defenders are counter-mining!'; }
  for (const c of S.cm) {
    if (c.warn > 0) { c.warn -= dt; continue; }
    if (c.y < c.depth) c.y = Math.min(c.depth, c.y + 55 * dt); else c.gal = Math.min(70, c.gal + 30 * dt);
    const hit = (Math.abs(h.x - c.x) < 12 && h.y < c.y + 6) || (c.gal > 0 && Math.abs(h.y - c.depth) < 14 && h.x > c.x - c.gal - 8 && h.x < c.x + 8);
    if (hit && !c.hit) { c.hit = true; const k = 1 + rnd(2); S.lost += k; h.x = Math.max(70, h.x - 70); S.msg = `The counter-mine breaks into your tunnel! ${k} sapper${k > 1 ? 's' : ''} killed in the dark, and you fall back.`; sfx('clash'); buzz(60); S.fx.push({ x: c.x, y: h.y, t: 0 }); }
  }
  S.cm = S.cm.filter(c => !c.hit);
  if (h.x >= M_WALL) { const d = h.y < M_BAND[0] ? M_BAND[0] - h.y : h.y > M_BAND[1] ? h.y - M_BAND[1] : 0; S.quality = clamp(1 - d / 90, 0.25, 1); S.over = true; S.msg = 'Under the walls! The props are fired...'; sfx('fire'); buzz(30); }
  else if (S.left <= 0) endMine(false, 'The garrison has found the mine. The sappers fall back before it is finished.');
}
function endMine(reached, msg) { const S = MG; if (!S || S.kind !== 'mine' || S.done) return; S.done = true; S.over = true; S.quality = 0; S.msg = msg; S.reachedX = S.head.x; finishMine(S, msg); }
function mineOutcome(p, A, reached, quality, lost, frac) {
  const w0 = p.walls; let dmg = 0, kd = 0;
  if (reached) { dmg = Math.round(30 + 32 * quality); damageWalls(p, dmg); kd = killDefenders(p, 1 + rnd(3)); }
  else if (frac > 0.75) { dmg = 8; damageWalls(p, dmg); }
  A.foot = Math.max(0, A.foot - lost); A.bombarded = true; A.acted = true; tutorDid('mine');
  const wl = `walls ${w0}% → ${p.ruined ? 'ruined' : p.walls + '%'}`;
  note(`Mine under ${p.name}: ${reached ? `a section of wall comes down, ${wl}, ${kd} defenders crushed` : dmg ? `the tunnel gives way short of the walls, ${wl}` : 'it fails'}${lost ? `; ${lost} sappers lost` : ''}.`);
  return { w0, dmg, kd, wl };
}
function finishMine(S, failMsg) {
  const { p, A } = S, reached = !failMsg && S.head.x >= M_WALL;
  const o = mineOutcome(p, A, reached, S.quality || 0, S.lost, (S.head.x - 70) / (M_WALL - 70));
  if (reached) mgResult(`The walls of ${p.name} come down!`, `The props burn, the tunnel collapses, and a section of wall falls into the ditch. ${o.wl}, ${o.kd} defenders crushed.${S.quality < 0.7 ? ' The mine ran a little off the foundations; a deeper or shallower line would have brought down more.' : ''}${S.lost ? ` ${S.lost} sappers died in the dark.` : ''}`, true, 'mine');
  else mgResult('The mine fails', `${failMsg || ''} ${o.dmg ? `The tunnel gives way short of the walls and does a little damage: ${o.wl}.` : ''}${S.lost ? ` ${S.lost} sappers lost.` : ''}`, false, 'mine');
}
function autoMine(pid) {
  const p = P(pid), A = myA(), g = armyGen(me(), A);
  const reached = Math.random() < 0.55 + (g && g.siege ? 0.1 : 0), lost = rnd(3), q = 0.45 + Math.random() * 0.45;
  const o = mineOutcome(p, A, reached, q, lost, 0.6);
  mgResult(reached ? `The walls of ${p.name} come down!` : 'The mine fails', reached ? `Your sappers bring down a section of wall: ${o.wl}, ${o.kd} defenders crushed.${lost ? ` ${lost} sappers lost.` : ''}` : `The defenders find the tunnel and flood it.${lost ? ` ${lost} sappers lost.` : ''}`, reached, 'mine');
}
function drawMineGround(x, S) {
  const sky = x.createLinearGradient(0, 0, 0, M_SURF); sky.addColorStop(0, '#9db8c8'); sky.addColorStop(1, '#e3dcc2'); x.fillStyle = sky; x.fillRect(0, 0, MW_, M_SURF);
  const soil = x.createLinearGradient(0, M_SURF, 0, MH_); soil.addColorStop(0, '#8a6a42'); soil.addColorStop(.5, '#6e5234'); soil.addColorStop(1, '#4e3a26'); x.fillStyle = soil; x.fillRect(0, M_SURF, MW_, MH_ - M_SURF);
  x.fillStyle = '#6c7740'; x.fillRect(0, M_SURF - 4, MW_, 8);
  x.strokeStyle = 'rgba(40,25,10,.25)'; x.lineWidth = 1; x.beginPath(); for (let i = 0; i < 70; i++) { const px = (i * 97) % MW_, py = M_SURF + 20 + (i * 53) % (M_WATER - M_SURF - 20); x.moveTo(px, py); x.lineTo(px + 10, py + 2); } x.stroke();
  // the foundations: the band to aim for
  x.fillStyle = 'rgba(226,179,60,.14)'; x.fillRect(M_WALL - 20, M_BAND[0], MW_ - M_WALL + 20, M_BAND[1] - M_BAND[0]);
  x.strokeStyle = 'rgba(226,179,60,.6)'; x.setLineDash([6, 6]); x.strokeRect(M_WALL - 20, M_BAND[0], MW_ - M_WALL + 18, M_BAND[1] - M_BAND[0]); x.setLineDash([]);
  x.fillStyle = '#7d7363'; x.fillRect(M_WALL, M_SURF, 60, M_BAND[0] - M_SURF);
  for (const r of S.rocks) { x.fillStyle = '#5e5a52'; x.beginPath(); x.ellipse(r.x, r.y, r.rx, r.ry, 0, 0, 7); x.fill(); x.fillStyle = '#76716a'; x.beginPath(); x.ellipse(r.x - r.rx * .3, r.y - r.ry * .3, r.rx * .45, r.ry * .4, 0, 0, 7); x.fill(); }
  const wg = x.createLinearGradient(0, M_WATER, 0, MH_); wg.addColorStop(0, '#4f7f8a'); wg.addColorStop(1, '#2f5560'); x.fillStyle = wg; x.fillRect(0, M_WATER, MW_, MH_ - M_WATER);
  x.strokeStyle = '#8fb5bb'; x.lineWidth = 1.5; x.beginPath(); for (let i = 0; i < 16; i++) { x.moveTo(i * 52, M_WATER + 12); x.quadraticCurveTo(i * 52 + 13, M_WATER + 6, i * 52 + 26, M_WATER + 12); } x.stroke();
  // your camp
  x.fillStyle = '#e8dcc0'; x.beginPath(); x.moveTo(20, M_SURF - 4); x.lineTo(48, M_SURF - 40); x.lineTo(76, M_SURF - 4); x.fill(); x.strokeStyle = '#6b4a2b'; x.lineWidth = 2; x.stroke();
  x.font = '600 13px Cinzel, Georgia, serif'; x.fillStyle = '#2a1d12'; x.textAlign = 'center'; x.fillText('FOUNDATIONS', M_WALL + 70, M_BAND[1] + 16);
}
function mineDraw(S) {
  const x = S.ctx, sink = S.over && S.quality ? Math.min(1, (S.collapse || 0) / 1.2) : 0;
  x.drawImage(S.ground, 0, 0, MW_, MH_);
  // the castle above, sinking when the mine is fired
  x.save(); x.translate(0, sink * 40);
  x.fillStyle = '#9a917c'; x.fillRect(M_WALL, M_SURF - 70, 70, 70); x.fillStyle = '#857d6b'; for (let i = 0; i < 4; i++) x.fillRect(M_WALL + i * 18, M_SURF - 80, 10, 10);
  x.fillStyle = '#7a7262'; x.fillRect(730, M_SURF - 100, 50, 100);
  x.restore();
  drawBanner(x, S.p.owner || S.p.ally, 755, M_SURF - 150 + sink * 40, 40, false, S.t);
  drawBanner(x, me(), 50, M_SURF - 80, 34, false, S.t);
  // tunnel and props
  x.lineCap = 'round'; x.lineJoin = 'round';
  x.strokeStyle = '#2b1d13'; x.lineWidth = 16; x.beginPath(); S.trail.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.lineTo(S.head.x, S.head.y); x.stroke();
  x.strokeStyle = '#a07a44'; x.lineWidth = 2; x.beginPath(); for (let i = 3; i < S.trail.length; i += 4) { const [a, b] = S.trail[i]; x.moveTo(a, b - 8); x.lineTo(a, b + 8); } x.stroke();
  // counter-mines
  for (const c of S.cm) {
    if (c.warn > 0) { x.fillStyle = `rgba(184,52,44,${0.5 + 0.5 * Math.sin(S.t * 14)})`; x.font = '700 24px Cinzel, Georgia, serif'; x.textAlign = 'center'; x.fillText('!', c.x, M_SURF - 10); continue; }
    x.fillStyle = '#1a120b'; x.fillRect(c.x - 9, M_SURF, 18, c.y - M_SURF); if (c.gal) x.fillRect(c.x - c.gal, c.depth - 9, c.gal, 18);
  }
  // the sapper's lamp and pick at the head of the tunnel
  const h = S.head; x.fillStyle = 'rgba(255,214,120,.35)'; x.beginPath(); x.arc(h.x, h.y, 20, 0, 7); x.fill();
  x.fillStyle = '#e7c9a3'; x.beginPath(); x.arc(h.x - 4, h.y - 3, 4, 0, 7); x.fill();
  x.strokeStyle = '#3a2817'; x.lineWidth = 2.5; const sw = Math.sin(S.t * 12) * 0.6; x.beginPath(); x.moveTo(h.x - 2, h.y); x.lineTo(h.x + 9 * Math.cos(sw), h.y - 9 * Math.sin(sw) - 2); x.stroke();
  if (S.down) { x.strokeStyle = 'rgba(243,232,204,.6)'; x.setLineDash([4, 6]); x.lineWidth = 1.5; x.beginPath(); x.moveTo(h.x + 20, S.ty); x.lineTo(MW_, S.ty); x.stroke(); x.setLineDash([]); }
  for (const f of S.fx) { f.t += 0.016; x.fillStyle = `rgba(120,100,70,${Math.max(0, 0.6 - f.t)})`; x.beginPath(); x.arc(f.x, f.y, 10 + f.t * 40, 0, 7); x.fill(); }
  S.fx = S.fx.filter(f => f.t < 0.6);
  if (sink) { x.fillStyle = `rgba(150,130,100,${0.6 * (1 - Math.abs(sink - 0.5) * 2) + 0.15})`; for (let i = 0; i < 8; i++) { x.beginPath(); x.arc(M_WALL + 10 + i * 9, M_SURF - 10 + Math.sin(i + S.t * 5) * 6, 18 + sink * 20, 0, 7); x.fill(); } }
  mgSet('mg-time', Math.max(0, Math.ceil(S.left)) + 's'); mgSet('mg-dist', Math.round(clamp((h.x - 70) / (M_WALL - 70), 0, 1) * 100) + '%'); mgSet('mg-lost', S.lost);
  const m = $('#mgmsg'); if (m && m.textContent !== S.msg) m.textContent = S.msg;
}

// ================= VIKING RAID =================
// Longships row in from the sea, one lane each. Drag your companies onto the beach to meet them; tap a ship to
// loose arrows at it. A ship that lands unopposed sends its crew to plunder the village.
const RW = 800, RH = 440, R_BEACH = 300, R_LAND = 420, R_VILL = 700, R_LANES = [70, 150, 230, 310, 390];
const raidSeas = ['north', 'channel', 'biscay', 'irish', 'celtic', 'west', 'baltic'];
const raiders = () => me() === 'denmark' ? 'Wendish pirates' : 'Northmen';
function maybeRaid() {
  if (G.raid || G.turn < 4 || G.over) return;
  if (G.turn - (G.lastRaid || -99) < 7 || Math.random() > 0.08) return;
  const coast = owned(me()).filter(p => p.seas.some(z => raidSeas.includes(z)) && !besiegerOf(p));
  if (!coast.length) return;
  const p = coast.sort((a, b) => (fighters(a.gar) + a.militia) - (fighters(b.gar) + b.militia))[rnd(Math.min(3, coast.length))];
  const ships = Math.min(7, 3 + Math.floor(G.turn / 14) + rnd(2));
  G.raid = { p: p.id, ships }; G.lastRaid = G.turn;
  report(`${raiders()} off ${p.name}!`, `${ships} longships have been sighted off ${p.name}, making for the beaches. They will burn the village and carry off whatever they can lift unless they are met. You can lead the defence yourself, leave it to the garrison, or pay them to go away.`, { kind: 'raid' });
}
const raidCompanies = p => clamp(Math.round((fighters(p.gar) + p.militia) / 4), 2, 5);
const danegeld = r => 18 * r.ships;
function raidButtons() {
  const r = G.raid, F = G.fac[me()];
  return `<button class="btn gold" onclick="startRaid()"><span class="lbl">${ico('swords')}Meet them on the beach</span></button><button class="btn" onclick="autoRaid()"><span class="lbl">${ico('skip')}Leave it to the garrison</span></button><button class="btn" onclick="payDanegeld()" ${F.gold >= danegeld(r) ? '' : 'disabled'}><span class="lbl">${ico('coin')}Pay them off · ${danegeld(r)} d</span></button>`;
}
function raidOutcome(repelled, plundered, companiesLost) {
  const r = G.raid, p = P(r.p), F = G.fac[me()];
  const gain = repelled * 8, loss = Math.min(F.gold + gain, plundered * 15);
  F.gold += gain - loss;
  p.militia = Math.max(0, p.militia - plundered * 2);
  let gone = companiesLost * 2; for (const t of ['foot', 'bow']) { const k = Math.min(gone, p.gar[t]); p.gar[t] -= k; gone -= k; } p.militia = Math.max(0, p.militia - gone);
  G.raid = null;
  note(`${raiders()} at ${p.name}: ${repelled} ship${repelled === 1 ? '' : 's'} driven off, ${plundered} crew${plundered === 1 ? '' : 's'} plundered the village (+${gain} d, −${loss} d).`);
  return { p, gain, loss };
}
function autoRaid() {
  const r = G.raid; if (!r) return closeModal();
  const p = P(r.p), K = raidCompanies(p); let rep = 0, pl = 0;
  for (let i = 0; i < r.ships; i++) Math.random() < clamp(0.25 + 0.13 * K, 0.2, 0.9) ? rep++ : pl++;
  const o = raidOutcome(rep, pl, Math.floor(pl / 2));
  mgResult(pl ? `${o.p.name} is plundered` : `${o.p.name} holds`, `The garrison drives off ${rep} of ${r.ships} ships${pl ? `, but ${pl} crew${pl > 1 ? 's' : ''} reach the village` : ''}. Booty taken from the raiders: ${o.gain} d. Lost to plunder: ${o.loss} d.`, rep >= pl, 'ship');
}
function payDanegeld() {
  const r = G.raid, F = G.fac[me()]; if (!r || F.gold < danegeld(r)) return;
  F.gold -= danegeld(r); const p = P(r.p); G.raid = null; note(`You pay ${danegeld(r)} d to the ${raiders()} off ${p.name}, and they sail away.`);
  closeModal(); toast('The longships turn away', 'ship'); save(); render(); showReports();
}
function startRaid() {
  const r = G.raid; if (!r) return closeModal();
  const p = P(r.p), K = raidCompanies(p);
  showModal(mgFrame([['mg-ships', 'Ships'], ['mg-rep', 'Driven off'], ['mg-pl', 'Plundered']], '<p class="sub ctr" style="margin:6px 0 0">Drag your companies onto the beach in a ship\'s lane. Tap a ship to loose arrows at it.</p>'), 'wide ctcard');
  const S = MG = mgScene(RW, RH);
  const lanes = [...R_LANES].sort(() => Math.random() - .5);
  Object.assign(S, { kind: 'raid', p, boats: [], toks: [], rep: 0, pl: 0, lostTok: 0, cool: 0, arrows: [], fx: [], msg: `${r.ships} longships! Get your companies to the beach.` });
  let t = 0.6; for (let i = 0; i < r.ships; i++) { S.boats.push({ lane: lanes[i % 5], x: -60 - Math.random() * 30, crew: 3 + rnd(4), at: t, st: 'wait', sp: 34 + Math.random() * 14 }); t += 1.6 + Math.random() * 2; }
  for (let i = 0; i < K; i++) S.toks.push({ x: 480 + (i % 2) * 30, y: R_LANES[Math.round(i * 4 / Math.max(1, K - 1))] || 230, str: 4, alive: true });
  S.ground = makeLayer(RW, RH, S.dpr, x => drawRaidGround(x, S));
  let drag = null;
  S.cv.onpointerdown = e => {
    const q = S.pt(e);
    const tk = S.toks.filter(k => k.alive).sort((a, b) => Math.hypot(a.x - q.x, a.y - q.y) - Math.hypot(b.x - q.x, b.y - q.y))[0];
    if (tk && Math.hypot(tk.x - q.x, tk.y - q.y) < 46) { drag = tk; S.cv.setPointerCapture && S.cv.setPointerCapture(e.pointerId); return; }
    const b = S.boats.find(b => b.st === 'row' && Math.abs(b.x - q.x) < 50 && Math.abs(b.lane - q.y) < 32);
    if (b && S.cool <= 0) { S.cool = 0.9; S.arrows.push({ x0: 520, y0: q.y < 220 ? 120 : 330, x1: b.x, y1: b.lane, t: 0 }); sfx('arrows'); if (Math.random() < 0.7) { b.crew--; if (b.crew <= 0) { b.st = 'sunk'; S.rep++; S.msg = 'The ship is shot to pieces and drifts away!'; sfx('miss'); } } }
  };
  S.cv.onpointermove = e => { if (!drag) return; const q = S.pt(e); drag.x = clamp(q.x, R_BEACH + 20, RW - 30); drag.y = clamp(q.y, 40, RH - 30); };
  S.cv.onpointerup = S.cv.onpointercancel = () => { if (drag) { drag.y = R_LANES.reduce((a, l) => Math.abs(l - drag.y) < Math.abs(a - drag.y) ? l : a, R_LANES[0]); drag = null; } };
  setMusic('battle'); sfx('horn');
  mgRun(S, dt => { raidUpdate(S, dt); if (MG === S) raidDraw(S); });
}
function raidFight(S, b, tk) {
  const win = Math.random() < tk.str / (tk.str + b.crew * 0.8);
  S.fx.push({ x: tk.x, y: tk.y, t: 0 }); sfx('clash'); buzz(30);
  if (win) { b.st = 'gone'; S.rep++; tk.str = Math.max(2, tk.str - (b.crew >= 4 ? 1 : 0)); S.msg = 'Your men drive them back into the sea!'; }
  else { tk.alive = false; S.lostTok++; b.crew = Math.max(1, b.crew - 2); S.msg = 'The raiders cut down a company!'; }
  return win;
}
function raidUpdate(S, dt) {
  if (S.done) return;
  S.cool -= dt;
  for (const b of S.boats) {
    if (b.st === 'wait' && S.t >= b.at) b.st = 'row';
    if (b.st === 'row') { b.x += b.sp * dt; if (b.x >= R_BEACH - 10) { b.x = R_BEACH - 10; const tk = S.toks.find(k => k.alive && Math.abs(k.y - b.lane) < 30 && k.x < R_LAND + 40); if (tk) { if (!raidFight(S, b, tk)) b.st = 'land'; } else { b.st = 'land'; S.msg = 'A ship beaches unopposed. Its crew run for the village!'; } if (b.st === 'land') { b.rx = R_BEACH + 10; } } }
    if (b.st === 'land') {
      b.rx += 38 * dt;
      const tk = S.toks.find(k => k.alive && Math.abs(k.y - b.lane) < 34 && Math.abs(k.x - b.rx) < 30);
      if (tk) raidFight(S, b, tk);
      else if (b.rx >= R_VILL) { b.st = 'gone'; S.pl++; S.msg = 'Raiders reach the village. Smoke rises over the roofs.'; sfx('fire'); S.fx.push({ x: R_VILL + 30, y: b.lane, t: 0, fire: true }); }
    }
  }
  S.arrows.forEach(a => a.t += dt * 2.5); S.arrows = S.arrows.filter(a => a.t < 1);
  if (S.boats.every(b => b.st === 'gone' || b.st === 'sunk')) { S.done = true; setTimeout(() => finishRaid(S), 900); }
}
function finishRaid(S) {
  if (MG !== S) return;
  const o = raidOutcome(S.rep, S.pl, S.lostTok);
  mgResult(S.pl ? `${o.p.name} is plundered` : `${o.p.name} is saved`, `${S.rep} ship${S.rep === 1 ? '' : 's'} driven off${S.pl ? `, ${S.pl} crew${S.pl > 1 ? 's' : ''} plundered the village` : ''}. Booty taken from the raiders: ${o.gain} d.${o.loss ? ` Lost to plunder: ${o.loss} d.` : ''}${S.lostTok ? ` ${S.lostTok} compan${S.lostTok > 1 ? 'ies' : 'y'} cut down.` : ''}`, S.rep >= S.pl, 'ship');
}
function drawRaidGround(x, S) {
  const sea = x.createLinearGradient(0, 0, R_BEACH, 0); sea.addColorStop(0, '#5f8a92'); sea.addColorStop(1, '#8fb3ad'); x.fillStyle = sea; x.fillRect(0, 0, R_BEACH, RH);
  x.strokeStyle = 'rgba(230,240,235,.35)'; x.lineWidth = 1.5; x.beginPath(); for (let i = 0; i < 40; i++) { const px = (i * 71) % (R_BEACH - 30), py = (i * 113) % RH; x.moveTo(px, py); x.quadraticCurveTo(px + 8, py - 4, px + 16, py); } x.stroke();
  x.fillStyle = '#e3d1a2'; x.beginPath(); x.moveTo(R_BEACH - 14, 0); for (let y = 0; y <= RH; y += 20) x.lineTo(R_BEACH - 14 + Math.sin(y / 30) * 6, y); x.lineTo(R_LAND, RH); x.lineTo(R_LAND, 0); x.fill();
  x.fillStyle = '#8d9c55'; x.fillRect(R_LAND, 0, RW - R_LAND, RH);
  x.strokeStyle = 'rgba(70,90,35,.4)'; x.beginPath(); for (let i = 0; i < 80; i++) { const px = R_LAND + (i * 67) % (RW - R_LAND), py = (i * 41) % RH; x.moveTo(px, py); x.lineTo(px - 2, py - 5); } x.stroke();
  // lanes, faintly
  x.setLineDash([3, 9]); x.strokeStyle = 'rgba(42,29,18,.18)'; x.lineWidth = 1; for (const l of R_LANES) { x.beginPath(); x.moveTo(R_BEACH - 10, l); x.lineTo(R_VILL, l); x.stroke(); } x.setLineDash([]);
  // the village and its church
  for (let i = 0; i < 6; i++) { const hx = R_VILL + 10 + (i % 2) * 40, hy = 50 + i * 62; x.fillStyle = '#c9a877'; x.fillRect(hx, hy, 30, 22); x.fillStyle = '#7a4f2a'; x.beginPath(); x.moveTo(hx - 4, hy); x.lineTo(hx + 15, hy - 14); x.lineTo(hx + 34, hy); x.fill(); }
  x.fillStyle = '#bdb3a0'; x.fillRect(R_VILL + 50, 200, 34, 44); x.fillStyle = '#7d7363'; x.fillRect(R_VILL + 61, 176, 12, 24); x.strokeStyle = '#2a1d12'; x.lineWidth = 2; x.beginPath(); x.moveTo(R_VILL + 67, 166); x.lineTo(R_VILL + 67, 178); x.moveTo(R_VILL + 62, 170); x.lineTo(R_VILL + 72, 170); x.stroke();
}
function raidDraw(S) {
  const x = S.ctx; x.drawImage(S.ground, 0, 0, RW, RH);
  for (const f of S.fx) if (f.fire) { x.fillStyle = 'rgba(90,80,70,.35)'; x.beginPath(); x.arc(f.x + Math.sin(S.t * 2) * 6, f.y - 30 - (S.t * 20 % 30), 18, 0, 7); x.fill(); x.fillStyle = 'rgba(255,140,40,.7)'; x.beginPath(); x.arc(f.x, f.y, 10 + Math.sin(S.t * 9) * 3, 0, 7); x.fill(); }
  const col = '#3d4f6e';
  for (const b of S.boats) {
    if (b.st === 'wait' || b.st === 'gone') continue;
    const bob = Math.sin(S.t * 3 + b.lane) * 2, sunk = b.st === 'sunk';
    if (sunk) { b.fade = (b.fade === undefined ? 1 : b.fade) - 0.012; if (b.fade <= 0) continue; b.x -= 0.4; x.globalAlpha = b.fade; }
    x.save(); x.translate(b.x, b.lane + bob);
    x.fillStyle = '#6b4a2b'; x.beginPath(); x.moveTo(-34, 0); x.quadraticCurveTo(-40, -10, -30, -10); x.lineTo(30, -10); x.quadraticCurveTo(42, -12, 36, 2); x.quadraticCurveTo(0, 14, -34, 0); x.fill(); x.strokeStyle = '#2a1d12'; x.lineWidth = 1.5; x.stroke();
    if (!sunk) { x.strokeStyle = '#2a1d12'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -10); x.lineTo(0, -38); x.stroke(); x.fillStyle = '#b8342c'; x.fillRect(-14, -36, 28, 20); x.fillStyle = '#f3e8cc'; x.fillRect(-14, -30, 28, 4); for (let i = 0; i < b.crew; i++) { x.fillStyle = '#d9c09a'; x.beginPath(); x.arc(-22 + i * 9, -12, 3, 0, 7); x.fill(); } }
    x.restore(); x.globalAlpha = 1;
    if (b.st === 'land') { for (let i = 0; i < b.crew; i++) figure(x, { x: b.rx + (i % 3) * 10, y: b.lane - 8 + Math.floor(i / 3) * 12 }, 1, col, 'foot', i, false); }
  }
  for (const k of S.toks) if (k.alive) { x.fillStyle = 'rgba(226,179,60,.28)'; x.beginPath(); x.arc(k.x, k.y, 30, 0, 7); x.fill(); for (let i = 0; i < 4; i++) figure(x, { x: k.x - 10 + (i % 2) * 14, y: k.y - 8 + Math.floor(i / 2) * 14 }, 0, FAC(me()).color, 'foot', i, true); }
  x.strokeStyle = '#2a1d12'; x.lineWidth = 1.3; x.beginPath();
  for (const a of S.arrows) for (let j = 0; j < 4; j++) { const t = a.t, ax = a.x0 + (a.x1 - a.x0) * t + j * 6, ay = a.y0 + (a.y1 - a.y0) * t - Math.sin(t * Math.PI) * 60 + j * 4; x.moveTo(ax, ay); x.lineTo(ax - 8, ay + 2); }
  x.stroke();
  for (const f of S.fx) if (!f.fire) { f.t += 0.02; x.strokeStyle = `rgba(255,233,160,${1 - f.t})`; x.lineWidth = 2; x.beginPath(); for (let i = 0; i < 5; i++) { x.moveTo(f.x, f.y); x.lineTo(f.x + Math.cos(i * 1.3) * 22, f.y + Math.sin(i * 1.3) * 22); } x.stroke(); }
  S.fx = S.fx.filter(f => f.fire || f.t < 1);
  const left = S.boats.filter(b => b.st !== 'gone' && b.st !== 'sunk').length;
  mgSet('mg-ships', left); mgSet('mg-rep', S.rep); mgSet('mg-pl', S.pl);
  const m = $('#mgmsg'); if (m && m.textContent !== S.msg) m.textContent = S.msg;
}
// a raid left unanswered when the turn ends is fought by the garrison
function raidAutoQuiet() { const r = G.raid; if (!r) return; const p = P(r.p), K = raidCompanies(p); let rep = 0, pl = 0; for (let i = 0; i < r.ships; i++) Math.random() < clamp(0.25 + 0.13 * K, 0.2, 0.9) ? rep++ : pl++; raidOutcome(rep, pl, Math.floor(pl / 2)); }
