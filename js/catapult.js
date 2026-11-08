'use strict';
// ================= CATAPULT =================
let CT = null;
const CW = 800, CH = 440, GY = 380, CBW = 20, CBH = 20, WXE = 640, GRAV = 500;
const AMMO = [['stone', 'Stone', 'stone'], ['triple', 'Three stones', 'stones'], ['oil', 'Flaming oil', 'oil'], ['oil3', 'Three fires', 'oil'], ['plague', 'Plague carcass', 'skull'], ['plague3', 'Three carcasses', 'skull']];
// a volley of three: smaller shots, spread a little, each weaker than a single
const VOLLEY = { triple: 'triple', oil3: 'oil', plague3: 'plague' };
function openCatapult(p) {
  if (CT) { CT.dead = true; releaseScene(CT); CT = null; }
  const A = myA(), lv = Math.max(1, castleLv(p));
  const cols = 4 + lv, rows = 3 + 2 * lv, total = cols * rows, h = Array(cols).fill(0);
  let target = Math.round(total * p.walls / 100);
  while (target-- > 0) { const open = h.map((v, i) => v < rows ? i : -1).filter(i => i >= 0); if (!open.length) break; h[pick(open)]++; }
  const wx = WXE - cols * CBW;
  const crowd = [];
  const nFoot = Math.min(12, p.gar.foot + p.militia + p.gar.cav);
  const ground0 = p.gar.foot + p.militia + p.gar.cav, wall0 = p.gar.bow + p.gar.foot;
  for (let i = 0; i < nFoot; i++) crowd.push({ x: 660 + Math.random() * 120, v: (Math.random() < .5 ? -1 : 1) * (8 + Math.random() * 14), ph: Math.random() * 6, t: i < p.gar.cav ? 'cav' : i % 4 === 0 ? 'militia' : 'foot' });
  const clouds = Array.from({ length: 5 }, (_, i) => [i * 170 + Math.random() * 80, 30 + Math.random() * 80, 30 + Math.random() * 40, 6 + Math.random() * 6]);
  CT = { p, h, cols, rows, lv, wx, ground0, wall0, shots: A.cat * catShots(me(), A), ammo: 'stone', wind: Math.round((Math.random() * 2 - 1) * 70), projs: [], drag: null, parts: [], fires: [], arrows: [], crowd, clouds, t: 0,
    msg: 'Drag anywhere on the field and release to fire. Pull further for more power.', killed: 0, plague: 0, w0: p.walls, last: 0, dead: false, color: p.owner ? FAC(p.owner).color : '#d8cba5' };
  setMusic('battle');
  showModal(`<div class="cthud"><div class="ct"><div class="v" id="ct-shots"></div><div class="k">Shots</div></div><div class="ct"><div class="v" id="ct-walls"></div><div class="k">Walls</div></div><div class="ct"><div class="v" id="ct-def"></div><div class="k">Defenders</div></div><div class="ct"><div class="v" id="ct-wind"></div><div class="k">Wind</div></div></div>
    <canvas id="ctc"></canvas>
    <div class="ctbar"><div id="ctmsg"></div>
      <div class="ammo">${AMMO.map(([id, n, i], k) => `<button class="btn sm${k === 0 ? ' on' : ''}" data-am="${id}"><span class="lbl">${ico(i)}</span><small>${n}</small></button>`).join('')}</div>
      <button class="btn gold" style="flex:1" onclick="finishCatapult()"><span class="lbl">${ico('check')}Finish bombardment</span></button></div>
    <p class="sub">${CASTLE_N[lv]}${p.b.moat ? ' behind a moat' : ''}. A stone smashes a section of wall; three stones scatter wider. Flaming oil burns defenders inside at once, and sets wooden walls alight. A plague carcass inside spreads sickness over the coming turns. A volley of three fires or three carcasses spreads its effect wider, each shot weaker. If the walls fall completely, the castle is ruined and must be rebuilt.</p>`, 'wide ctcard');
  const cv = $('#ctc'), dpr = clamp((cv.getBoundingClientRect().width || CW) * (window.devicePixelRatio || 1) / CW, 1, 2);
  cv.width = CW * dpr; cv.height = CH * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); CT.ctx = ctx;
  // sky and land do not change during a bombardment, so they are painted once
  CT.sky = makeLayer(CW, CH, dpr, x => { const sky = x.createLinearGradient(0, 0, 0, GY); sky.addColorStop(0, '#8fb0c4'); sky.addColorStop(.6, '#d9d2b8'); sky.addColorStop(1, '#efe2c2'); x.fillStyle = sky; x.fillRect(0, 0, CW, CH); });
  CT.land = makeLayer(CW, CH, dpr, x => {
    x.fillStyle = '#9fae9a'; x.beginPath(); x.moveTo(0, 300); x.quadraticCurveTo(120, 250, 260, 290); x.quadraticCurveTo(400, 240, 560, 285); x.quadraticCurveTo(700, 262, 800, 290); x.lineTo(800, GY); x.lineTo(0, GY); x.fill();
    x.fillStyle = '#b4b79a'; x.beginPath(); x.moveTo(0, 330); x.quadraticCurveTo(200, 270, 420, 320); x.quadraticCurveTo(620, 280, 800, 310); x.lineTo(800, GY); x.lineTo(0, GY); x.fill();
    const gg = x.createLinearGradient(0, GY, 0, CH); gg.addColorStop(0, '#86944f'); gg.addColorStop(1, '#6a7a3c');
    x.fillStyle = gg; x.fillRect(0, GY, CW, CH - GY); x.fillStyle = '#6c7740'; x.fillRect(0, GY, CW, 5);
    x.strokeStyle = 'rgba(60,80,30,.5)'; x.lineWidth = 1; x.beginPath(); for (let i = 0; i < 60; i++) { const tx = (i * 53) % CW; x.moveTo(tx, GY + 8 + (i % 3) * 9); x.lineTo(tx + 2, GY + 2 + (i % 3) * 9); } x.stroke();
  });
  const fit = { pt: e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * CW / r.width, y: (e.clientY - r.top) * CH / r.height }; } };
  $$('[data-am]').forEach(b => b.onclick = () => { CT.ammo = b.dataset.am; $$('[data-am]').forEach(x => x.classList.toggle('on', x === b)); sfx('click'); buzz(6); });
  const pt = fit.pt;
  cv.onpointerdown = e => { if (!CT || CT.projs.length || CT.shots <= 0) return; cv.setPointerCapture(e.pointerId); const q = pt(e); CT.drag = { s: q, c: q }; };
  cv.onpointermove = e => { if (CT && CT.drag) CT.drag.c = pt(e); };
  cv.onpointerup = () => {
    if (!CT || !CT.drag) return;
    const d = CT.drag; CT.drag = null;
    const v = launchVec(d); if (!v) return;
    const vt = VOLLEY[CT.ammo];
    const mk = (vx, vy, r) => ({ x: 112, y: 300, vx, vy, r, type: vt || CT.ammo, small: !!vt && vt !== 'triple', trail: [] });
    if (vt) { const ang = Math.atan2(v.vy, v.vx), sp = Math.hypot(v.vx, v.vy); [-0.07, 0, 0.07].forEach((da, i) => { const s2 = sp * (1 + (i - 1) * 0.05); CT.projs.push(mk(Math.cos(ang + da) * s2, Math.sin(ang + da) * s2, 4.5)); }); }
    else CT.projs.push(mk(v.vx, v.vy, 7));
    CT.shots--; sfx('launch'); buzz(20);
  };
  const scene = CT; requestAnimationFrame(t => ctFrame(t, scene));
}
function launchVec(d) {
  let dx = d.s.x - d.c.x, dy = d.s.y - d.c.y;
  const len = Math.hypot(dx, dy); if (len < 15) return null;
  const k = Math.min(len, 170) / len; dx *= k; dy *= k;
  return { vx: dx * 4.2, vy: dy * 4.2, pow: Math.min(len, 170) / 170 };
}
function ctBurst(x, y, color, n) { for (let i = 0; i < n; i++) CT.parts.push({ x, y, vx: (Math.random() - .5) * 260, vy: -Math.random() * 260, life: .6 + Math.random() * .6, color, s: 2 + Math.random() * 4 }); }
const ctHit = (c, n) => { CT.h[c] = Math.max(0, CT.h[c] - n); };
function ctHitWall(c, q) {
  const wood = CT.lv === 1;
  if (q.type === 'stone') { ctHit(c, 3); if (c > 0 && Math.random() < .7) ctHit(c - 1, 1); if (c < CT.cols - 1 && Math.random() < .7) ctHit(c + 1, 1); ctBurst(q.x, q.y, wood ? '#7a5530' : '#8a816e', 26); CT.msg = 'Direct hit! A section of wall collapses.'; sfx('wall'); buzz(40); }
  else if (q.type === 'triple') { ctHit(c, 1); if (Math.random() < .35) { const n = c + (Math.random() < .5 ? -1 : 1); if (n >= 0 && n < CT.cols) ctHit(n, 1); } ctBurst(q.x, q.y, '#8a816e', 12); CT.msg = 'Stones hammer the wall.'; sfx('wall'); buzz(20); }
  else if (q.type === 'oil' && q.small) {
    if (wood) { ctHit(c, 1); CT.fires.push({ x: q.x, y: q.y, t: 3 }); CT.msg = 'A pot of fire catches on the palisade.'; }
    else { if (Math.random() < 0.4) ctHit(c, 1); CT.msg = 'The fire splashes on the stone. Aim over the top to burn the defenders.'; }
  }
  else if (q.type === 'oil') {
    if (wood) { ctHit(c, 2); if (c > 0) ctHit(c - 1, 1); if (c < CT.cols - 1) ctHit(c + 1, 1); CT.fires.push({ x: q.x, y: q.y, t: 5 }); CT.msg = 'The palisade catches fire! The wooden wall burns.'; }
    else { ctHit(c, 1); CT.msg = 'The oil bursts against the stone and scorches it. Aim over the top to burn the defenders.'; }
    ctBurst(q.x, q.y, '#ff8c1a', 26); sfx('fire');
  } else { ctBurst(q.x, q.y, '#6d7a3a', 18); CT.msg = 'The carcass splatters on the wall. Wasted.'; sfx('plague'); }
}
function ctHitInside(q) {
  const p = CT.p; let k = 0;
  const empty = ctAlive() === 0;
  if (q.type === 'stone' || q.type === 'triple') { k = Math.random() < (q.type === 'stone' ? .5 : .25) ? killDefenders(p, 1) : 0; ctBurst(q.x, q.y, '#8a816e', 12); CT.msg = empty ? 'The stone lands in an empty bailey.' : k ? 'The stone crashes into the bailey and crushes a defender.' : 'The stone lands in the bailey. The defenders scatter.'; sfx('wall'); }
  else if (q.type === 'oil') { k = killDefenders(p, q.small ? 1 + rnd(2) : 2 + rnd(4)); CT.fires.push({ x: q.x, y: GY - 4, t: q.small ? 2.5 : 4 }); ctBurst(q.x, q.y, '#ff8c1a', q.small ? 22 : 44); CT.msg = empty ? 'Burning oil spatters an empty bailey. No one is left to burn.' : `${q.small ? 'Fire falls' : 'Burning oil rains'} on the bailey! ${k} defender${k === 1 ? '' : 's'} burned.`; sfx('fire'); buzz(q.small ? 20 : 40); }
  else if (q.small) {
    k = Math.random() < 0.3 ? killDefenders(p, 1) : 0;
    if (Math.random() < 0.5) { p.plague = { s: Math.min(3, ((p.plague && p.plague.s) || 0) + 1), t: 3 }; CT.plague++; CT.msg = `A carcass lands inside. The sickness grows (${['', 'mild', 'spreading', 'raging'][p.plague.s]}).`; }
    else CT.msg = 'A carcass lands inside, but the defenders burn it before the sickness takes hold.';
    ctBurst(q.x, q.y, '#6d7a3a', 14); sfx('plague');
  }
  else {
    k = killDefenders(p, 1);
    p.plague = { s: Math.min(3, ((p.plague && p.plague.s) || 0) + 1), t: 3 };
    CT.plague++;
    ctBurst(q.x, q.y, '#6d7a3a', 30); CT.msg = `The carcass bursts inside the walls. Sickness takes hold (${['', 'mild', 'spreading', 'raging'][p.plague.s]}) and will spread through the garrison over the coming turns.`; sfx('plague');
  }
  CT.killed += k;
}
const ctAlive = () => CT.p.militia + CT.p.gar.foot + CT.p.gar.bow + CT.p.gar.cav;
function ctUpdate(dt) {
  CT.t += dt;
  const moat0 = CT.wx - 46, moat1 = CT.wx - 8;
  for (const q of CT.projs) {
    if (q.dead) continue;
    q.vy += GRAV * dt; q.vx += CT.wind * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    q.trail.push([q.x, q.y]); if (q.trail.length > 30) q.trail.shift();
    let done = false;
    for (let c = 0; c < CT.cols && !done; c++) { const x0 = CT.wx + c * CBW; if (q.x + q.r > x0 && q.x - q.r < x0 + CBW && CT.h[c] > 0 && q.y + q.r > GY - CT.h[c] * CBH) { ctHitWall(c, q); done = true; } }
    if (!done && q.x > 705 && q.x < 755 && q.y > GY - 120) { ctHitInside(q); done = true; }
    if (!done && q.y >= GY) {
      if (q.x >= WXE && q.x <= 790) ctHitInside(q);
      else if (CT.p.b.moat && q.x > moat0 && q.x < moat1) { ctBurst(q.x, GY, '#9fc3c8', 16); CT.msg = 'Splash! The shot falls into the moat.'; sfx('miss'); }
      else { ctBurst(q.x, GY, '#7a6a4a', 10); CT.msg = q.x < CT.wx ? 'Short! The shot ploughs into the field.' : 'Too long! It sails over the castle.'; sfx('miss'); }
      done = true;
    }
    if (!done && (q.x > CW + 40 || q.x < -40)) { CT.msg = 'The shot flies wide.'; done = true; }
    if (done) q.dead = true;
  }
  if (CT.projs.length && CT.projs.every(q => q.dead)) { CT.projs = []; CT.wind = Math.round((Math.random() * 2 - 1) * 70); if (CT.shots <= 0) CT.msg += ' Out of ammunition.'; }
  CT.parts.forEach(t => { t.vy += 600 * dt; t.x += t.vx * dt; t.y += t.vy * dt; t.life -= dt; });
  CT.parts = CT.parts.filter(t => t.life > 0 && t.y < GY + 4);
  CT.fires.forEach(f => f.t -= dt); CT.fires = CT.fires.filter(f => f.t > 0);
  for (const c of CT.crowd) { c.x += c.v * dt; if (c.x < 652 || c.x > 790) c.v = -c.v; }
  for (const c of CT.clouds) { c[0] += CT.wind * dt * 0.15; if (c[0] > CW + 80) c[0] = -80; if (c[0] < -80) c[0] = CW + 80; }
  if (CT.p.gar.bow + CT.p.gar.foot > 0 && Math.random() < dt * Math.min(4, CT.p.gar.bow + 1) * 0.6) {
    const cols = CT.h.map((v, i) => v > 0 ? i : -1).filter(i => i >= 0);
    if (cols.length) { const c = pick(cols); CT.arrows.push({ x: CT.wx + c * CBW + 10, y: GY - CT.h[c] * CBH - 14, tx: 90 + Math.random() * 80, ty: GY - 10 - Math.random() * 30, t: 0 }); }
  }
  CT.arrows.forEach(a => a.t += dt * 0.8); CT.arrows = CT.arrows.filter(a => a.t < 1);
}
function ctDraw() {
  const x = CT.ctx, p = CT.p, wood = CT.lv === 1;
  x.drawImage(CT.sky, 0, 0, CW, CH);
  x.fillStyle = 'rgba(255,255,255,.75)';
  for (const [cx, cy, w, h] of CT.clouds) { x.beginPath(); x.ellipse(cx, cy, w, h, 0, 0, 7); x.ellipse(cx + w * 0.5, cy - h * 0.4, w * 0.6, h * 0.9, 0, 0, 7); x.ellipse(cx - w * 0.5, cy - h * 0.2, w * 0.5, h * 0.8, 0, 0, 7); x.fill(); }
  x.drawImage(CT.land, 0, 0, CW, CH);
  if (p.b.moat) { x.fillStyle = '#4f7f8a'; x.fillRect(CT.wx - 46, GY, 38, 24); x.fillStyle = '#8fb5bb'; for (let i = 0; i < 3; i++) x.fillRect(CT.wx - 42 + i * 12 + Math.sin(CT.t * 2 + i) * 2, GY + 6 + i * 5, 8, 2); }
  // keep and banner
  x.fillStyle = wood ? '#5a3e24' : '#7a7262'; x.fillRect(703, GY - 122, 54, 122);
  x.fillStyle = wood ? '#6b4a2b' : '#8f8572'; x.fillRect(705, GY - 120, 50, 120); for (let i = 0; i < 4; i++) x.fillRect(705 + i * 14, GY - 132, 8, 12);
  if (!wood) { x.strokeStyle = '#7a7262'; x.lineWidth = 1; for (let r = 0; r < 6; r++) { x.beginPath(); x.moveTo(705, GY - 100 + r * 20); x.lineTo(755, GY - 100 + r * 20); x.stroke(); } }
  x.fillStyle = '#3a3226'; x.fillRect(724, GY - 90, 10, 16); x.fillRect(714, GY - 60, 6, 10); x.fillRect(740, GY - 60, 6, 10);
  drawBanner(x, p.owner || p.ally, 730, GY - 176, 44, false, CT.t);
  if (p.plague) { x.fillStyle = `rgba(110,140,50,${0.18 + 0.06 * Math.sin(CT.t * 2)})`; x.beginPath(); x.ellipse(720, GY - 40, 95, 55, 0, 0, 7); x.fill(); }
  const groundNow = p.gar.foot + p.militia + p.gar.cav, wallNow = p.gar.bow + p.gar.foot;
  const showN = groundNow > 0 ? Math.ceil(CT.crowd.length * groundNow / Math.max(1, CT.ground0)) : 0;
  let wallSlots = 0; for (let c = 0; c < CT.cols; c++) if (c % 2 === 1) wallSlots++;
  const wallN = wallNow > 0 ? Math.max(1, Math.ceil(wallSlots * wallNow / Math.max(1, CT.wall0))) : 0;
  let wallShown = 0;
  for (const c of CT.crowd.slice(0, showN)) { const bob = Math.sin(CT.t * 8 + c.ph) * 1.2; figure(x, { x: c.x, y: GY - 10 + bob }, 1, CT.color, c.t, Math.floor(CT.t * 6 + c.ph), c.v < 0); }
  // walls
  for (let c = 0; c < CT.cols; c++) {
    for (let r = 0; r < CT.h[c]; r++) {
      const bx = CT.wx + c * CBW, by = GY - (r + 1) * CBH;
      if (wood) { x.fillStyle = (r + c) % 2 ? '#7a5530' : '#6b4a2b'; x.fillRect(bx + 1, by, CBW - 2, CBH); x.strokeStyle = '#4a3320'; x.lineWidth = 1; x.beginPath(); x.moveTo(bx + CBW / 2, by); x.lineTo(bx + CBW / 2, by + CBH); x.stroke(); }
      else { x.fillStyle = (r + c) % 2 ? (CT.lv === 3 ? '#9a917c' : '#a39a85') : '#958c77'; x.fillRect(bx, by, CBW, CBH); x.strokeStyle = '#6e6656'; x.lineWidth = 1; x.strokeRect(bx + .5, by + .5, CBW - 1, CBH - 1); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(bx + 2, by + 2, CBW - 4, 4); }
    }
    const top = GY - CT.h[c] * CBH;
    if (CT.h[c] > 0) {
      if (wood) { x.fillStyle = '#6b4a2b'; x.beginPath(); x.moveTo(CT.wx + c * CBW + 1, top); x.lineTo(CT.wx + c * CBW + CBW / 2, top - 9); x.lineTo(CT.wx + c * CBW + CBW - 1, top); x.fill(); }
      else if (c % 2 === 0) { x.fillStyle = '#958c77'; x.fillRect(CT.wx + c * CBW + 3, top - 8, CBW - 6, 8); }
      if (c % 2 === 1 && wallShown++ < wallN) figure(x, { x: CT.wx + c * CBW + CBW / 2, y: top - 10 + Math.sin(CT.t * 3 + c) }, 1, CT.color, c % 4 === 1 ? 'bow' : 'foot', c, true);
    } else { x.fillStyle = wood ? '#4a3320' : '#6e6656'; for (let k = 0; k < 4; k++) x.fillRect(CT.wx + c * CBW + (k * 5) % 16, GY - 4 - (k % 2) * 4, 5, 4); }
  }
  for (const f of CT.fires) for (let i = 0; i < 6; i++) { x.fillStyle = `rgba(255,${120 + rnd(100)},30,${0.5 * f.t / 5 + 0.2})`; x.beginPath(); x.arc(f.x + (Math.random() - .5) * 18, f.y - Math.random() * 24, 3 + Math.random() * 5, 0, 7); x.fill(); x.fillStyle = `rgba(60,50,40,${0.25 * f.t / 5})`; x.beginPath(); x.arc(f.x + (Math.random() - .5) * 24, f.y - 20 - Math.random() * 30, 5 + Math.random() * 6, 0, 7); x.fill(); }
  // catapult
  x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(115, GY - 4, 60, 6, 0, 0, 7); x.fill();
  x.fillStyle = '#6b4a2b'; x.fillRect(66, GY - 28, 98, 12); x.fillStyle = '#4a3320'; x.fillRect(66, GY - 20, 98, 3);
  x.fillStyle = '#3a2817'; [88, 142].forEach(cx => { x.beginPath(); x.arc(cx, GY - 10, 11, 0, 7); x.fill(); x.fillStyle = '#6b4a2b'; x.beginPath(); x.arc(cx, GY - 10, 4, 0, 7); x.fill(); x.fillStyle = '#3a2817'; });
  x.strokeStyle = '#5a3e24'; x.lineWidth = 6; x.beginPath(); x.moveTo(90, GY - 22); x.lineTo(112, GY - 64); x.lineTo(134, GY - 22); x.stroke();
  x.strokeStyle = '#4a3320'; x.lineWidth = 3; x.beginPath(); x.moveTo(100, GY - 44); x.lineTo(124, GY - 44); x.stroke();
  let ang = -2.2, pull = 0;
  if (CT.drag) { const v = launchVec(CT.drag); if (v) { ang = Math.atan2(v.vy, v.vx) + Math.PI; pull = v.pow; } } else if (CT.projs.length) ang = -1.0;
  const ax = 112, ay = GY - 64, L = 64 + pull * 8;
  x.strokeStyle = '#7a5530'; x.lineWidth = 7; x.beginPath(); x.moveTo(ax, ay); x.lineTo(ax + Math.cos(ang) * L, ay + Math.sin(ang) * L); x.stroke();
  x.fillStyle = '#3a2817'; x.beginPath(); x.arc(ax + Math.cos(ang) * L, ay + Math.sin(ang) * L, 8, 0, 7); x.fill();
  if (!CT.projs.length && CT.shots > 0) { const col = CT.ammo.startsWith('oil') ? '#ff7a00' : CT.ammo.startsWith('plague') ? '#59672f' : '#5d564a'; x.fillStyle = col; x.beginPath(); x.arc(ax + Math.cos(ang) * L, ay + Math.sin(ang) * L - 2, 5, 0, 7); x.fill(); }
  const myColor = FAC(me()).color;
  [56, 170].forEach((cx, i) => figure(x, { x: cx, y: GY - 10 + Math.sin(CT.t * 4 + i) }, 0, myColor, 'foot', i, false));
  drawBanner(x, me(), 30, GY - 70, 62, false, CT.t);
  // aim guide
  if (CT.drag) { const v = launchVec(CT.drag); if (v) { let sx = 112, sy = 300, vx = v.vx, vy = v.vy; for (let i = 0; i < 26; i++) { const dt = 0.03; for (let k = 0; k < 2; k++) { vy += GRAV * dt; vx += CT.wind * dt; sx += vx * dt; sy += vy * dt; } x.fillStyle = `rgba(43,32,22,${0.7 - i * 0.022})`; x.beginPath(); x.arc(sx, sy, 2.6, 0, 7); x.fill(); }
    // power meter
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(40, 60, 14, 120); x.fillStyle = v.pow > .8 ? '#c0392b' : v.pow > .5 ? '#d4a017' : '#5c8a3a'; x.fillRect(40, 180 - 120 * v.pow, 14, 120 * v.pow); x.strokeStyle = '#2a1d12'; x.lineWidth = 1.5; x.strokeRect(40, 60, 14, 120); } }
  // wind flag on the keep
  x.strokeStyle = '#2a1d12'; x.lineWidth = 1.2;
  x.beginPath();
  for (const a of CT.arrows) { const t = a.t, ax2 = a.x + (a.tx - a.x) * t, ay2 = a.y + (a.ty - a.y) * t - Math.sin(t * Math.PI) * 70; const t2 = Math.max(0, t - .04), bx = a.x + (a.tx - a.x) * t2, by = a.y + (a.ty - a.y) * t2 - Math.sin(t2 * Math.PI) * 70; x.moveTo(bx, by); x.lineTo(ax2, ay2); }
  x.stroke();
  for (const q of CT.projs) {
    if (q.dead) continue;
    const col = q.type === 'oil' ? '#ff7a00' : q.type === 'plague' ? '#59672f' : '#5d564a';
    x.strokeStyle = col + '66'; x.lineWidth = 3; x.beginPath(); q.trail.forEach((t, i) => i ? x.lineTo(t[0], t[1]) : x.moveTo(t[0], t[1])); x.stroke();
    x.fillStyle = 'rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(q.x, GY - 2, q.r, q.r * 0.4, 0, 0, 7); x.fill();
    x.fillStyle = col; x.beginPath(); x.arc(q.x, q.y, q.r, 0, 7); x.fill();
    if (q.type === 'oil') { x.fillStyle = '#ffd36b'; x.beginPath(); x.arc(q.x - 3, q.y - 3, 3, 0, 7); x.fill(); }
  }
  CT.parts.forEach(t => { x.globalAlpha = Math.max(0, Math.min(1, t.life)); x.fillStyle = t.color; x.fillRect(t.x, t.y, t.s, t.s); });
  x.globalAlpha = 1;
  // HUD (DOM)
  const integ = Math.round(CT.h.reduce((s, v) => s + v, 0) / (CT.cols * CT.rows) * 100);
  const set = (id, v) => { const el = document.getElementById(id); if (el && el.innerHTML !== v) el.innerHTML = v; };
  set('ct-shots', String(CT.shots)); set('ct-walls', integ + '%'); set('ct-def', `${ctAlive()}${CT.killed ? ` <small style="color:#ff9c8c">−${CT.killed}</small>` : ''}${CT.plague ? ' ' + ico('skull') : ''}`);
  set('ct-wind', `${CT.wind < 0 ? '◂' : CT.wind > 0 ? '▸' : '·'} ${Math.abs(CT.wind)}`);
  const m = document.getElementById('ctmsg'); if (m && m.textContent !== CT.msg) m.textContent = CT.msg;
}
// each bombardment owns its own loop: a loop that finds a different (newer) bombardment in CT stops at once,
// so loops can never pile up from one siege to the next
function ctFrame(ts, scene) {
  if (!CT || CT !== scene || CT.dead) return;
  const dt = Math.min(0.033, CT.last ? (ts - CT.last) / 1000 : 0.016); CT.last = ts;
  ctUpdate(dt); ctDraw();
  requestAnimationFrame(t => ctFrame(t, scene));
}
// bombard without the catapult scene: each shot has the same chance as the computer's engineers
function autoBombard(A, p) {
  const w0 = p.walls; let wl = 0, kl = 0, pl = 0;
  for (let s = 0; s < A.cat * catShots(me(), A); s++) {
    if (Math.random() < 0.6) {
      if (p.walls > 34 && !p.ruined && p.b.castle) { const d = Math.min(p.walls, 26 / Math.max(1, castleLv(p))); damageWalls(p, d); wl += Math.round(d); }
      else if (Math.random() < 0.5) { p.plague = { s: Math.min(3, ((p.plague && p.plague.s) || 0) + 1), t: 3 }; pl++; }
      else kl += killDefenders(p, 2 + rnd(3));
    }
  }
  A.bombarded = true; A.acted = true;
  const txt = `Bombardment of ${p.name}: walls ${w0}% → ${p.ruined ? 'ruined' : p.walls + '%'}, ${kl} defenders killed${pl ? ', plague sown inside' : ''}.`;
  note(txt); toast(`Walls ${w0}% → ${p.ruined ? 'ruined' : p.walls + '%'} · ${kl} killed`, 'cat'); sfx('wall');
}
function finishCatapult() {
  if (!CT) return;
  const c = CT, p = c.p, A = myA();
  const w = Math.round(c.h.reduce((s, v) => s + v, 0) / (c.cols * c.rows) * 100);
  if (w <= 0) { p.walls = 1; damageWalls(p, 5); } else p.walls = w;
  A.bombarded = true; A.acted = true;
  note(`Bombardment of ${p.name}: walls ${c.w0}% → ${p.ruined ? 'ruined' : p.walls + '%'}, ${c.killed} defenders killed${c.plague ? ', plague sown inside' : ''}.`);
  c.dead = true; releaseScene(c); CT = null; closeModal(); save(); render();
  toast(`Walls ${c.w0}% → ${p.ruined ? 'ruined' : p.walls + '%'} · ${c.killed} killed`, 'cat');
}
