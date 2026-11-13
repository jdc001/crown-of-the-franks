'use strict';
// ================= CATAPULT =================
let CT = null;
const CW = 800, CH = 440, GY = 380, CBW = 20, CBH = 20, WXE = 640, GRAV = 500;
const AMMO = [['stone', 'Stone', 'stone'], ['triple', '3 stones', 'stones'], ['oil', 'Flaming oil', 'oil'], ['oil3', '3 flaming oil', 'oil'], ['rats', 'Plague rats', 'rat'], ['giant', 'Giant plague rat', 'rat'], ['greek', 'Greek fire', 'oil']];
// a volley of three: smaller shots, spread a little, each weaker than a single
const VOLLEY = { triple: 'triple', oil3: 'oil' };
// rats do not kill at once: once inside, each one bites every second or so, a few times, while you keep shooting
const RAT = { small: { rounds: 3, bite: 0.3 }, giant: { rounds: 4 }, every: 1.3 };
const RAT_COL = '#4b4038';
// ================= LANDMARKS BEHIND THE SIEGE =================
// a house's seat shows a great castle on the far ridge, the realm's capital a grand one, and the great sees a cathedral
const SILH = '#3c3040', LIT = 'rgba(255,200,110,.9)';
function crenels(x, l, t, w, step = 6) { for (let i = l; i < l + w - 1; i += step * 2) x.fillRect(i, t - 4, Math.min(step, l + w - i), 4); }
function towerS(x, cx, base, w, h, roof) {
  x.fillRect(cx - w / 2, base - h, w, h);
  if (roof) { x.beginPath(); x.moveTo(cx - w / 2 - 3, base - h); x.lineTo(cx, base - h - roof); x.lineTo(cx + w / 2 + 3, base - h); x.fill(); }
  else crenels(x, cx - w / 2, base - h, w, 3);
}
function slitS(x, cx, y, tall) { x.fillStyle = LIT; x.fillRect(cx - 1, y, 2, tall ? 5 : 3); x.fillStyle = SILH; }
function flagS(x, cx, top, col) {
  x.fillRect(cx - 0.6, top - 16, 1.4, 16);
  x.fillStyle = col; x.beginPath(); x.moveTo(cx + 1, top - 16); x.quadraticCurveTo(cx + 9, top - 15, cx + 15, top - 12); x.quadraticCurveTo(cx + 8, top - 10, cx + 1, top - 9); x.fill(); x.fillStyle = SILH;
}
function castleSilhouette(x, cx, base, grand, col) {
  x.fillStyle = SILH;
  const span = grand ? 230 : 150, wallH = grand ? 34 : 26, tw = grand ? 20 : 16, th = grand ? 58 : 50, l = cx - span / 2;
  // the curtain wall with its crenels, the towers at the corners and along it
  x.fillRect(l, base - wallH, span, wallH + 30); crenels(x, l, base - wallH, span);
  const towers = grand ? [0, 0.24, 0.76, 1] : [0, 1];
  for (const f of towers) towerS(x, l + f * span, base, tw, th + (f > 0 && f < 1 ? 8 : 0), grand ? 18 : 0);
  // the keep, and for the capital a palace hall and a second great tower beside it
  const kw = grand ? 48 : 40, kh = grand ? 96 : 80;
  x.fillRect(cx - kw / 2, base - kh, kw, kh); crenels(x, cx - kw / 2, base - kh, kw, 4);
  towerS(x, cx + kw / 2 - 5, base - kh + 2, 10, 18, grand ? 14 : 0);
  if (grand) {
    x.fillRect(cx - kw / 2 - 52, base - 60, 52, 60); x.beginPath(); x.moveTo(cx - kw / 2 - 54, base - 60); x.lineTo(cx - kw / 2 - 26, base - 76); x.lineTo(cx - kw / 2 + 2, base - 60); x.fill();
    towerS(x, cx + kw / 2 + 22, base, 22, 82, 26);
    for (let i = 0; i < 4; i++) { x.fillStyle = LIT; x.fillRect(cx - kw / 2 - 46 + i * 12, base - 48, 4, 7); x.fillStyle = SILH; }
    slitS(x, cx + kw / 2 + 22, base - 66, 1); slitS(x, cx + kw / 2 + 22, base - 46, 0);
    flagS(x, cx + kw / 2 + 22, base - 108, col); flagS(x, cx, base - kh - 4, col);
  } else flagS(x, cx, base - kh - 4, col);
  for (const [dx, dy] of [[-10, 52], [8, 52], [-2, 30], [10, 30]]) slitS(x, cx + dx * (kw / 40), base - kh + (kh - dy) * 0.55 + 6, 1);
  for (const f of towers) slitS(x, l + f * span, base - th + 14, 0);
}
function cathedralSilhouette(x, cx, base) {
  x.fillStyle = SILH;
  const nave = 150, nh = 40, l = cx - nave / 2, r = cx + nave / 2;
  // the long nave under a steep roof, buttresses along its flank, the round apse at the east end
  x.fillRect(l, base - nh, nave, nh + 30);
  x.beginPath(); x.moveTo(l, base - nh); x.lineTo(l + 8, base - nh - 14); x.lineTo(r - 4, base - nh - 14); x.lineTo(r, base - nh); x.fill();
  x.beginPath(); x.arc(r, base - nh / 2 + 4, nh / 2 + 2, -Math.PI / 2, Math.PI / 2); x.fill();
  for (let i = 0; i < 6; i++) { const bx = l + 34 + i * 18; x.beginPath(); x.moveTo(bx, base - nh + 6); x.lineTo(bx + 9, base - nh + 26); x.lineTo(bx + 9, base); x.lineTo(bx + 3, base); x.fill(); }
  // two west towers with spires, a lantern and spire over the crossing
  for (const tx of [l - 6, l + 18]) { x.fillRect(tx - 9, base - 86, 18, 86); x.beginPath(); x.moveTo(tx - 10, base - 86); x.lineTo(tx, base - 132); x.lineTo(tx + 10, base - 86); x.fill(); }
  x.fillRect(l - 6, base - 62, 24, 62);
  const cxr = l + nave * 0.66; x.fillRect(cxr - 11, base - nh - 34, 22, 34); x.beginPath(); x.moveTo(cxr - 12, base - nh - 34); x.lineTo(cxr, base - nh - 84); x.lineTo(cxr + 12, base - nh - 34); x.fill();
  // the rose window and the lancets, lit for vespers
  const g = x.createRadialGradient(l + 6, base - 46, 0, l + 6, base - 46, 9); g.addColorStop(0, '#fff0c0'); g.addColorStop(.6, 'rgba(255,190,90,.95)'); g.addColorStop(1, 'rgba(200,90,60,.9)');
  x.fillStyle = g; x.beginPath(); x.arc(l + 6, base - 46, 7, 0, 7); x.fill();
  x.strokeStyle = SILH; x.lineWidth = 1; x.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; x.moveTo(l + 6, base - 46); x.lineTo(l + 6 + Math.cos(a) * 7, base - 46 + Math.sin(a) * 7); } x.stroke();
  x.fillStyle = LIT; for (let i = 0; i < 6; i++) { const wx = l + 40 + i * 18; x.fillRect(wx, base - nh + 10, 3, 9); x.beginPath(); x.arc(wx + 1.5, base - nh + 10, 1.5, Math.PI, 0); x.fill(); }
  x.fillRect(l - 7, base - 76, 2, 6); x.fillRect(l + 17, base - 76, 2, 6); x.fillRect(cxr - 1, base - nh - 26, 2, 6);
  // a cross on the crossing spire
  x.fillStyle = SILH; x.fillRect(cxr - 0.7, base - nh - 94, 1.4, 10); x.fillRect(cxr - 3, base - nh - 91, 6, 1.4);
}
function skylineLandmarks(x, p, col) {
  const A = SC.art || {}, grand = (A.grand || []).includes(p.id), seat = grand || !!p.cap, cath = (A.cathedrals || []).includes(p.id);
  if (!seat && !cath) return;
  const base = GY - 82, dark = mix(col, '#2a1a20', 0.3);
  if (seat && cath) { cathedralSilhouette(x, 195, base); castleSilhouette(x, grand ? 360 : 340, base, grand, dark); }
  else if (cath) cathedralSilhouette(x, 300, base);
  else castleSilhouette(x, grand ? 320 : 300, base, grand, dark);
}
function openCatapult(p) {
  if (CT) { CT.dead = true; releaseScene(CT); CT = null; }
  const A = myA(), lv = Math.max(1, castleLv(p));
  const cols = 4 + lv, rows = 3 + 2 * lv, total = cols * rows, h = Array(cols).fill(0);
  let target = Math.round(total * p.walls / 100);
  while (target-- > 0) { const open = h.map((v, i) => v < rows ? i : -1).filter(i => i >= 0); if (!open.length) break; h[pick(open)]++; }
  const wx = WXE - cols * CBW;
  // a seat's outer ring: a lower wall in front of the moat
  const ocols = hasOuter(p) ? 3 : 0, orows = 3 + lv, oh = Array(ocols).fill(0), ox = wx - 62 - ocols * CBW;
  { let t = Math.round(ocols * orows * (p.outer ?? 100) / 100); while (t-- > 0) { const open = oh.map((v, i) => v < orows ? i : -1).filter(i => i >= 0); if (!open.length) break; oh[pick(open)]++; } }
  const crowd = [];
  const nFoot = Math.min(12, p.gar.foot + p.militia + p.gar.cav);
  const D0 = defenders(p), ground0 = D0.foot + D0.militia + D0.cav, wall0 = D0.bow + D0.foot;
  for (let i = 0; i < nFoot; i++) crowd.push({ x: 660 + Math.random() * 120, v: (Math.random() < .5 ? -1 : 1) * (8 + Math.random() * 14), ph: Math.random() * 6, t: i < p.gar.cav ? 'cav' : i % 4 === 0 ? 'militia' : 'foot' });
  const clouds = Array.from({ length: 5 }, (_, i) => [i * 170 + Math.random() * 80, 30 + Math.random() * 80, 30 + Math.random() * 40, 6 + Math.random() * 6]);
  CT = { p, h, cols, rows, lv, wx, oh, ocols, orows, ox, o0: p.outer ?? 100, ground0, wall0, shots: A.cat * catShots(me(), A), ammo: 'stone', wind: Math.round((Math.random() * 2 - 1) * 70), projs: [], drag: null, parts: [], fires: [], arrows: [], crowd, clouds, t: 0,
    msg: 'Drag anywhere on the field and release to fire. Pull further for more power.', killed: 0, plague: 0, rats: [], cages: A.cat + 1, w0: p.walls, last: 0, dead: false, color: p.owner ? FAC(p.owner).color : '#d8cba5' };
  setMusic('siege');
  showModal(`<div class="cthud"><div class="ct"><div class="v" id="ct-shots"></div><div class="k">Shots</div></div><div class="ct"><div class="v" id="ct-walls"></div><div class="k">${ocols ? 'Outer · inner' : 'Walls'}</div></div><div class="ct"><div class="v" id="ct-def"></div><div class="k">Defenders</div></div><div class="ct"><div class="v" id="ct-wind"></div><div class="k">Wind</div></div></div>
    <canvas id="ctc"></canvas>
    <div class="ctbar"><div id="ctmsg"></div>
      <div class="ammo"${A.gf > 0 ? ' style="grid-template-columns:repeat(4,1fr)"' : ''}>${AMMO.filter(([id]) => id !== 'greek' || A.gf > 0).map(([id, n, i], k) => `<button class="btn sm${k === 0 ? ' on' : ''}" data-am="${id}"><span class="lbl">${ico(i)}</span><small>${n}</small><small class="amn" id="am-${id}"></small></button>`).join('')}</div>
      <button class="btn gold" style="flex:1" onclick="finishCatapult()"><span class="lbl">${ico('check')}Finish bombardment</span></button></div>
    <p class="sub">${CASTLE_N[lv]}${p.b.moat ? ' behind a moat' : ''}. One heavy stone smashes a deep section of any wall. 3 light stones scatter wider and tear through wood, but only chip stone and mostly bounce off great walls. Flaming oil works the same way: one big pot burns more men where it lands, 3 small pots spread the fire wider. Standing walls shelter the defenders from fire, and each pot does less than the last, so break the walls first. ${A.gf > 0 ? 'Greek fire brings down a whole stretch of wall, or, thrown over it, burns about a third of the garrison, but each throw has a one-in-three chance of setting the catapult alight. ' : ''}Rats are scarcer: you have one cage for each catapult, and one more; a cage holds a swarm or a single giant rat. An army sheltering in the castle suffers from fire and rats along with the garrison.</p>`, 'wide ctcard');
  // give the canvas its true shape before measuring; a bare canvas is 300 by 150 and would be measured too short
  { const c0 = $('#ctc'); c0.width = CW; c0.height = CH; }
  shrinkToFit($('#ctc'), CW, CH, '.ctbar .btn');
  const cv = $('#ctc'), dpr = clamp((cv.getBoundingClientRect().width || CW) * (window.devicePixelRatio || 1) / CW, 1, 2);
  cv.width = CW * dpr; cv.height = CH * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); CT.ctx = ctx;
  // sky and land do not change during a bombardment, so they are painted once
  // dusk: a sky going from night blue to ember gold, a low sun behind layered hills, a far town against the light
  CT.sky = makeLayer(CW, CH, dpr, x => {
    const sky = x.createLinearGradient(0, 0, 0, GY); sky.addColorStop(0, '#1c2546'); sky.addColorStop(.28, '#3d3f6b'); sky.addColorStop(.55, '#a4566a'); sky.addColorStop(.78, '#e98f55'); sky.addColorStop(1, '#fbd38a');
    x.fillStyle = sky; x.fillRect(0, 0, CW, CH);
    const R = seeded('stars' + CT.p.id); for (let i = 0; i < 70; i++) { const sy = R() * 150; x.fillStyle = `rgba(255,248,230,${(1 - sy / 150) * (0.35 + R() * 0.5)})`; x.fillRect(R() * CW, sy, R() < .15 ? 2 : 1, 1); }
    const sx = 455, sy = GY - 150;
    let g = x.createRadialGradient(sx, sy, 0, sx, sy, 260); g.addColorStop(0, 'rgba(255,214,140,.75)'); g.addColorStop(.25, 'rgba(255,170,90,.35)'); g.addColorStop(1, 'rgba(255,140,80,0)'); x.fillStyle = g; x.fillRect(0, 0, CW, CH);
    g = x.createRadialGradient(sx, sy, 0, sx, sy, 30); g.addColorStop(0, '#fff8e0'); g.addColorStop(.7, '#ffe2a0'); g.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = g; x.beginPath(); x.arc(sx, sy, 30, 0, 7); x.fill();
  });
  CT.land = makeLayer(CW, CH, dpr, x => {
    const ridge = (y0, amp, seedS, col, haze) => { const R = seeded(seedS); x.fillStyle = col; x.beginPath(); x.moveTo(0, CH); let y = y0; for (let px = 0; px <= CW + 20; px += 20) { y = y0 + Math.sin(px / 90 + R() * 0.6) * amp * 0.6 + (R() - 0.5) * amp; x.lineTo(px, y); } x.lineTo(CW, CH); x.fill(); if (haze) { const g = x.createLinearGradient(0, y0 - amp, 0, GY); g.addColorStop(0, haze); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fill(); } };
    ridge(GY - 120, 26, 'far', '#6b5878', 'rgba(255,170,120,.25)');
    ridge(GY - 92, 18, 'mid', '#5c4a5e', 'rgba(255,150,100,.18)');
    // a far town on the ridge, black against the glow: a church spire, towers, roofs
    x.fillStyle = '#3c3040';
    for (const [tx, w, h, spire] of [[330, 16, 34, 1], [348, 22, 20, 0], [372, 12, 26, 0], [386, 26, 16, 0], [414, 14, 40, 1], [430, 20, 18, 0], [452, 10, 24, 0], [462, 24, 14, 0]]) { const by = GY - 82; x.fillRect(tx, by - h, w, h + 30); if (spire) { x.beginPath(); x.moveTo(tx - 2, by - h); x.lineTo(tx + w / 2, by - h - 22); x.lineTo(tx + w + 2, by - h); x.fill(); } else { x.beginPath(); x.moveTo(tx - 2, by - h); x.lineTo(tx + w / 2, by - h - 7); x.lineTo(tx + w + 2, by - h); x.fill(); } }
    x.fillStyle = 'rgba(255,200,110,.85)'; for (const [wx, wy] of [[336, -40], [419, -46], [355, -26], [392, -22], [436, -24], [466, -18]]) x.fillRect(wx, GY - 82 + wy + 16, 2, 3);
    skylineLandmarks(x, CT.p, CT.color);
    ridge(GY - 62, 14, 'near', '#4a4a3a', 'rgba(255,160,90,.14)');
    // the near field: dark olive with a rim of sunset along its crest
    x.fillStyle = '#3f4a28'; x.beginPath(); x.moveTo(0, GY - 22); x.quadraticCurveTo(200, GY - 46, 420, GY - 18); x.quadraticCurveTo(620, GY - 36, 800, GY - 16); x.lineTo(800, GY); x.lineTo(0, GY); x.fill();
    x.strokeStyle = 'rgba(240,160,80,.55)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, GY - 22); x.quadraticCurveTo(200, GY - 46, 420, GY - 18); x.quadraticCurveTo(620, GY - 36, 800, GY - 16); x.stroke();
    // a dark wood on the near ridge
    x.fillStyle = '#2f3820'; const RT = seeded('wood'); for (let i = 0; i < 26; i++) { const tx = 520 + i * 11 + RT() * 6, th = 14 + RT() * 14, base = GY - 26 + Math.sin(tx / 70) * 4; x.beginPath(); x.moveTo(tx - 5, base); x.lineTo(tx, base - th); x.lineTo(tx + 5, base); x.fill(); }
    const gg = x.createLinearGradient(0, GY, 0, CH); gg.addColorStop(0, '#5a6a2e'); gg.addColorStop(1, '#2f3a1c');
    x.fillStyle = gg; x.fillRect(0, GY, CW, CH - GY); x.fillStyle = 'rgba(240,170,90,.5)'; x.fillRect(0, GY, CW, 2); x.fillStyle = '#3d4a22'; x.fillRect(0, GY + 2, CW, 4);
    x.strokeStyle = 'rgba(25,35,12,.55)'; x.lineWidth = 1; x.beginPath(); for (let i = 0; i < 60; i++) { const tx = (i * 53) % CW; x.moveTo(tx, GY + 8 + (i % 3) * 9); x.lineTo(tx + 2, GY + 2 + (i % 3) * 9); } x.stroke();
  });
  CT.dusk = makeLayer(CW, CH, dpr, x => {
    const m = x.createLinearGradient(0, 0, 0, CH); m.addColorStop(0, 'rgba(40,20,50,0)'); m.addColorStop((GY - 200) / CH, 'rgba(40,20,50,0)'); m.addColorStop(GY / CH, 'rgba(50,25,55,.28)'); m.addColorStop(1, 'rgba(30,15,35,.45)'); x.fillStyle = m; x.fillRect(0, 0, CW, CH);
    const v = x.createRadialGradient(CW / 2, CH * 0.55, CH * 0.35, CW / 2, CH * 0.55, CW * 0.7); v.addColorStop(0, 'rgba(20,10,20,0)'); v.addColorStop(1, 'rgba(20,10,20,.45)'); x.fillStyle = v; x.fillRect(0, 0, CW, CH);
  });
  CT.glowS = makeLayer(64, 64, 1, x => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,170,70,1)'); g.addColorStop(1, 'rgba(255,170,70,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
  // the warm wash of the low sun, baked into the sky and the land
  for (const L of [CT.sky, CT.land]) { const x = L.getContext('2d'); x.globalCompositeOperation = L === CT.sky ? 'soft-light' : 'source-atop'; const k = L === CT.sky ? 1 : 0.3, g = x.createLinearGradient(0, 0, CW, 0); g.addColorStop(0, `rgba(120,70,160,${.35 * k})`); g.addColorStop(.55, `rgba(255,150,70,${.45 * k})`); g.addColorStop(1, `rgba(120,60,120,${.35 * k})`); x.fillStyle = g; x.fillRect(0, 0, CW, CH); x.globalCompositeOperation = 'source-over'; }
  const fit = { pt: e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * CW / r.width, y: (e.clientY - r.top) * CH / r.height }; } };
  $$('[data-am]').forEach(b => b.onclick = () => { CT.ammo = b.dataset.am; $$('[data-am]').forEach(x => x.classList.toggle('on', x === b)); sfx('click'); buzz(6); });
  const pt = fit.pt;
  cv.onpointerdown = e => { if (!CT || CT.projs.length || CT.shots <= 0) return; cv.setPointerCapture(e.pointerId); const q = pt(e); CT.drag = { s: q, c: q }; };
  cv.onpointermove = e => { if (CT && CT.drag) CT.drag.c = pt(e); };
  cv.onpointerup = () => {
    if (!CT || !CT.drag) return;
    const d = CT.drag; CT.drag = null;
    const v = launchVec(d); if (!v) return;
    if (CT.ammo === 'greek') {
      if (!(A.gf > 0)) { CT.msg = 'No Greek fire left. Buy jars on the Raise tab of a county where the army stands.'; CT.ammo = 'stone'; $$('[data-am]').forEach(x => x.classList.toggle('on', x.dataset.am === 'stone')); sfx('miss'); return; }
      A.gf--;
      // a third of the time the naphtha splashes back on the throwing arm, and the catapult burns
      if (Math.random() < 1 / 3) { const share = Math.ceil(CT.shots / Math.max(1, A.cat)); A.cat = Math.max(0, A.cat - 1); CT.shots = A.cat ? Math.max(0, CT.shots - share) : 1; CT.lostCat = (CT.lostCat || 0) + 1; ctBoom(112, GY - 64, 0.7); CT.fires.push({ x: 112, y: GY - 30, t: 5 }); CT.burnMsg = true; sfx('fire'); buzz(60); }
    }
    const pool = CT.ammo === 'rats' || CT.ammo === 'giant' ? 'cages' : null;
    if (pool) { if (CT[pool] <= 0) { CT.msg = pool === 'pots' ? 'No fire pots left. Stones are all you have.' : 'No cages of rats left. Stones are all you have.'; CT.ammo = 'stone'; $$('[data-am]').forEach(x => x.classList.toggle('on', x.dataset.am === 'stone')); sfx('miss'); return; } CT[pool]--; }
    const vt = VOLLEY[CT.ammo];
    const mk = (vx, vy, r) => ({ x: 112, y: 300, vx, vy, r, type: vt || CT.ammo, small: !!vt && vt !== 'triple', trail: [] });
    if (vt) { const ang = Math.atan2(v.vy, v.vx), sp = Math.hypot(v.vx, v.vy); [-0.07, 0, 0.07].forEach((da, i) => { const s2 = sp * (1 + (i - 1) * 0.05); CT.projs.push(mk(Math.cos(ang + da) * s2, Math.sin(ang + da) * s2, 4.5)); }); }
    else if (CT.ammo === 'rats') { const ang = Math.atan2(v.vy, v.vx), sp = Math.hypot(v.vx, v.vy); [-0.05, -0.017, 0.017, 0.05].forEach(da => { const s2 = sp * (0.96 + Math.random() * 0.08); CT.projs.push({ ...mk(Math.cos(ang + da) * s2, Math.sin(ang + da) * s2, 4), type: 'rat', small: true, ph: Math.random() * 6 }); }); }
    else if (CT.ammo === 'giant') CT.projs.push({ ...mk(v.vx, v.vy, 10), type: 'giant', small: false, ph: 0 });
    else if (CT.ammo === 'greek') CT.projs.push({ ...mk(v.vx, v.vy, 8), type: 'greek', small: false });
    else CT.projs.push(mk(v.vx, v.vy, 7));
    CT.shots--; sfx('launch'); buzz(20);
    if (CT.burnMsg) { CT.burnMsg = false; CT.msg = `The jar flies, but naphtha splashes the throwing arm: a catapult burns! ${A.cat ? `${A.cat} left.` : 'This was the last one.'}`; }
  };
  const scene = CT; requestAnimationFrame(t => ctFrame(t, scene));
}
function launchVec(d) {
  let dx = d.s.x - d.c.x, dy = d.s.y - d.c.y;
  const len = Math.hypot(dx, dy); if (len < 15) return null;
  const k = Math.min(len, 170) / len; dx *= k; dy *= k;
  return { vx: dx * 4.2, vy: dy * 4.2, pow: Math.min(len, 170) / 170 };
}
// Greek fire going off: a flash, a fireball, a shock ring, burning gobbets, flying stone, a column of black smoke,
// embers drifting down long after, and a shake of the whole scene
function ctBoom(x, y, big = 1) {
  CT.booms = CT.booms || []; CT.booms.push({ x, y, t: 0, big });
  CT.shake = Math.max(CT.shake || 0, 0.55 * big); CT.flash = Math.max(CT.flash || 0, 0.9 * big);
  const P = CT.parts, R = Math.random;
  for (let i = 0; i < 46 * big; i++) { const a = R() * Math.PI * 2, v = 120 + R() * 380; P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, life: 0.7 + R() * 0.9, color: pick(['#fff3b0', '#ffd23f', '#ff8c1a', '#ff5a1a']), s: 3 + R() * 5, round: 1, glow: 1, g: 0.8 }); }
  for (let i = 0; i < 22 * big; i++) { const a = -Math.PI * R(), v = 180 + R() * 320; P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.2 + R() * 0.8, color: pick(['#6d6658', '#8a816e', '#4e483e']), s: 3 + R() * 6, g: 1 }); }
  for (let i = 0; i < 14 * big; i++) P.push({ x: x + (R() - .5) * 30, y: y - R() * 20, vx: (R() - .5) * 50 + (CT.wind || 0) * 0.4, vy: -40 - R() * 90, life: 2 + R() * 2.2, max: 4.2, color: R() < .5 ? '#2b2620' : '#46403a', s: 8 + R() * 10, grow: 14 + R() * 14, round: 1, smoke: 1, g: -0.04 });
  for (let i = 0; i < 40 * big; i++) P.push({ x: x + (R() - .5) * 40, y: y - R() * 50, vx: (R() - .5) * 140, vy: -60 - R() * 200, life: 2 + R() * 2.5, color: pick(['#ffb347', '#ff7a1a', '#ffe08a']), s: 1.5 + R() * 2, round: 1, glow: 1, g: 0.12, flick: 1 });
  for (let i = 0; i < 4 * big; i++) CT.fires.push({ x: x + (R() - .5) * 70, y: Math.min(GY - 4, y + R() * 30), t: 5 + R() * 4 });
}
// the cloud: a column of fire-lit smoke climbs to the top of the sky, spreads into a cap, and drifts apart;
// the ground beneath glows and smoulders for a few seconds
function ctMushroom(x, y) {
  CT.mush = CT.mush || []; CT.mush.push({ x, gy: Math.min(GY - 2, y), t: 0, seed: Math.random() * 6 });
  CT.smoulder = CT.smoulder || []; CT.smoulder.push({ x, t: 3.5 });
}
function drawMushroom(x, m) {
  const ease = u => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);
  const RISE = 2.2, END = 5;
  const rise = ease(m.t / RISE), fade = m.t < RISE ? 1 : Math.max(0, 1 - (m.t - RISE) / (END - RISE));
  const drift = (CT.wind || 0) * 0.25 * Math.max(0, m.t - 0.8);
  const top = 74, cy = m.gy - (m.gy - top) * rise, rc = (16 + 46 * rise) * (1 + 0.5 * Math.max(0, m.t - RISE) / (END - RISE)), cx = m.x + drift;
  const hot = Math.max(0, 1 - m.t / 1.6);
  const puff = (px, py, r, a, lit) => { const g = x.createRadialGradient(px, py - r * 0.2, 0, px, py, r); const c0 = lit > 0 ? `${Math.round(60 + 190 * lit)},${Math.round(50 + 80 * lit)},${Math.round(40 + 10 * lit)}` : '58,52,46'; g.addColorStop(0, `rgba(${c0},${a})`); g.addColorStop(0.65, `rgba(${c0},${a * 0.75})`); g.addColorStop(1, `rgba(40,36,32,0)`); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); };
  // the stem, thinning as the cloud lifts away from it
  const segs = 26, sw = (10 + 14 * rise) * (m.t < RISE ? 1 : fade);
  for (let i = 0; i <= segs; i++) { const u = i / segs, py = m.gy + (cy - m.gy) * u, px = m.x + (cx - m.x) * u + Math.sin(u * 6 + m.seed + m.t * 2) * 3; puff(px, py, sw * (1.15 - 0.4 * u) + 4, 0.55 * fade, hot * (1 - u)); }
  // a pale condensation ring around the stem as it climbs
  if (m.t > 0.5 && m.t < 2.2) { const u = (m.t - 0.5) / 1.7, ry = m.gy + (cy - m.gy) * 0.55; x.strokeStyle = `rgba(240,232,215,${0.35 * Math.sin(u * Math.PI)})`; x.lineWidth = 3; x.beginPath(); x.ellipse(m.x + (cx - m.x) * 0.55, ry, 18 + 40 * u, 5 + 7 * u, 0, 0, 7); x.stroke(); }
  // the cap: a rolling ring of smoke with a dome on top, lit from below while it burns
  const n = 11;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + m.t * 0.6, px = cx + Math.cos(a) * rc * 1.15, py = cy + Math.sin(a) * rc * 0.42; puff(px, py, rc * 0.55, 0.62 * fade, hot * (Math.sin(a) > 0 ? 1 : 0.4)); }
  for (let i = 0; i < 4; i++) puff(cx + (i - 1.5) * rc * 0.35, cy - rc * 0.35 - (i % 2) * rc * 0.12, rc * 0.6, 0.6 * fade, hot * 0.5);
  if (hot > 0) { x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(cx, cy + rc * 0.2, 0, cx, cy + rc * 0.2, rc * 1.3); g.addColorStop(0, `rgba(255,150,40,${0.55 * hot})`); g.addColorStop(1, 'rgba(255,80,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy + rc * 0.2, rc * 1.3, 0, 7); x.fill(); x.globalCompositeOperation = 'source-over'; }
}
function ctBurst(x, y, color, n) { for (let i = 0; i < n; i++) CT.parts.push({ x, y, vx: (Math.random() - .5) * 260, vy: -Math.random() * 260, life: .6 + Math.random() * .6, color, s: 2 + Math.random() * 4 }); }
const ctHit = (c, n) => { CT.h[c] = Math.max(0, CT.h[c] - n); };
function ctHitOuter(c, q) {
  const hit = (k, n) => { if (k >= 0 && k < CT.ocols) CT.oh[k] = Math.max(0, CT.oh[k] - n); };
  if (q.type === 'greek') { hit(c, 99); hit(c - 1, 4); hit(c + 1, 4); ctBoom(q.x, q.y); ctMushroom(q.x, q.y); CT.msg = 'Greek fire bursts on the outer wall and tears a great gap in it.'; sfx('greek'); sfx('fire'); if (CT.oh.every(v => v === 0) && !CT.obreach) { CT.obreach = true; CT.msg += ' The outer wall is breached!'; } return; }
  if (q.type === 'stone') { hit(c, 3); if (Math.random() < .7) hit(c - 1, 1); if (Math.random() < .7) hit(c + 1, 1); CT.msg = 'Direct hit on the outer wall! A section comes down.'; sfx('wall'); buzz(40); }
  else if (q.type === 'triple') { if (Math.random() < 0.5) { hit(c, 1); CT.msg = 'Stones chip the outer wall.'; sfx('wall'); } else { CT.msg = 'A small stone glances off the outer wall.'; sfx('miss'); } }
  else if (q.type === 'oil') { if (Math.random() < 0.3) hit(c, 1); CT.msg = 'The fire splashes on the outer wall. Aim over both walls to burn the defenders.'; sfx('fire'); }
  else { CT.msg = q.type === 'giant' ? 'The giant rat slams into the outer wall and limps away.' : 'The rats hit the outer wall and scatter.'; sfx('plague'); }
  ctBurst(q.x, q.y, q.type === 'oil' ? '#ff8c1a' : q.type === 'rat' || q.type === 'giant' ? RAT_COL : '#8a816e', q.small || q.type === 'triple' ? 12 : 24);
  if (CT.oh.every(v => v === 0) && !CT.obreach) { CT.obreach = true; CT.msg += ' The outer wall is breached!'; }
}
function ctHitWall(c, q) {
  const wood = CT.lv === 1;
  if (q.type === 'greek') { ctHit(c, 99); for (const [k, n] of [[c - 1, wood ? 99 : 6], [c + 1, wood ? 99 : 6], [c - 2, wood ? 6 : 3], [c + 2, wood ? 6 : 3]]) if (k >= 0 && k < CT.cols) ctHit(k, n); const kw = killDefenders(CT.p, 2 + rnd(3)); CT.killed += kw; CT.fires.push({ x: q.x, y: q.y, t: 6 }); ctBoom(q.x, q.y); ctMushroom(q.x, q.y); CT.msg = `Greek fire bursts against the wall! The stones split in the heat and a whole stretch comes down${kw ? `, with ${kw} of the men on it` : ''}.`; sfx('greek'); sfx('fire'); buzz(60); return; }
  if (q.type === 'stone') { ctHit(c, wood ? 4 : 3); if (c > 0 && Math.random() < .7) ctHit(c - 1, 1); if (c < CT.cols - 1 && Math.random() < .7) ctHit(c + 1, 1); ctBurst(q.x, q.y, wood ? '#7a5530' : '#8a816e', 26); CT.msg = 'Direct hit! A section of wall collapses.'; sfx('wall'); buzz(40); }
  else if (q.type === 'triple' && Math.random() > (CT.lv === 1 ? 1 : CT.lv === 2 ? 0.5 : 0.2)) { ctBurst(q.x, q.y, '#8a816e', 6); CT.msg = CT.lv === 3 ? 'The small stones rattle off the great walls. It takes a heavy stone to break these.' : 'A small stone glances off the masonry.'; sfx('miss'); }
  else if (q.type === 'triple') { ctHit(c, 1); if (CT.lv === 1 && Math.random() < .35) { const n = c + (Math.random() < .5 ? -1 : 1); if (n >= 0 && n < CT.cols) ctHit(n, 1); } ctBurst(q.x, q.y, '#8a816e', 12); CT.msg = 'Stones hammer the wall.'; sfx('wall'); buzz(20); }
  else if (q.type === 'oil' && q.small) {
    if (wood) { ctHit(c, 1); CT.fires.push({ x: q.x, y: q.y, t: 3 }); CT.msg = 'A pot of fire catches on the palisade.'; }
    else { if (Math.random() < 0.4) ctHit(c, 1); CT.msg = 'The fire splashes on the stone. Aim over the top to burn the defenders.'; }
  }
  else if (q.type === 'oil') {
    if (wood) { ctHit(c, 2); if (c > 0) ctHit(c - 1, 1); if (c < CT.cols - 1) ctHit(c + 1, 1); CT.fires.push({ x: q.x, y: q.y, t: 5 }); CT.msg = 'The palisade catches fire! The wooden wall burns.'; }
    else { ctHit(c, 1); CT.msg = 'The oil bursts against the stone and scorches it. Aim over the top to burn the defenders.'; }
    ctBurst(q.x, q.y, '#ff8c1a', 26); sfx('fire');
  } else if (q.type === 'rat') {
    ctBurst(q.x, q.y, RAT_COL, 8); sfx('plague'); sfx('rat');
    if (Math.random() < 0.3) { ratNest(q.x, false); CT.msg = 'A rat hits the wall, scrabbles over the top and drops inside.'; }
    else CT.msg = 'The rats hit the wall and scatter into the ditch.';
  } else {
    ctBurst(q.x, q.y, RAT_COL, 20); sfx('plague');
    if (Math.random() < 0.55) { ratNest(q.x, true); ratPlague(); CT.msg = 'The giant rat slams into the wall, claws its way over and drops into the bailey!'; }
    else CT.msg = 'The giant rat slams into the wall and limps off into the field. Wasted.';
  }
}
function ctHitInside(q) {
  const p = CT.p; let k = 0;
  const empty = ctAlive() === 0;
  if (q.type === 'stone' || q.type === 'triple') { k = Math.random() < (q.type === 'stone' ? .5 : .25) ? killDefenders(p, 1) : 0; ctBurst(q.x, q.y, '#8a816e', 12); CT.msg = empty ? 'The stone lands in an empty bailey.' : k ? 'The stone crashes into the bailey and crushes a defender.' : 'The stone lands in the bailey. The defenders scatter.'; sfx('wall'); }
  else if (q.type === 'greek') {
    // water only spreads it: a third of the garrison, less a little for whatever walls still stand between them and the blast
    const cover = CT.h.reduce((s, v) => s + v, 0) / (CT.cols * CT.rows), n = CT.gfIn = (CT.gfIn || 0) + 1;
    const e = (3 + 0.32 * ctAlive()) * (1 - 0.25 * cover) * (n === 1 ? 1 : n === 2 ? 0.85 : 0.7); k = killDefenders(p, Math.floor(e) + (Math.random() < e % 1 ? 1 : 0)); CT.oilKills = (CT.oilKills || 0) + k; CT.fires.push({ x: q.x, y: GY - 4, t: 7 }); ctBoom(q.x, q.y, 1.15); ctMushroom(q.x, GY - 4); CT.msg = empty ? 'Greek fire burns in an empty bailey.' : `Greek fire pours over the bailey, and water only spreads it! ${k} defender${k === 1 ? '' : 's'} burned.`; sfx('greek'); buzz(50); }
  else if (q.type === 'oil') { k = killDefenders(p, fireKills(q.small)); CT.oilKills = (CT.oilKills || 0) + k; CT.fires.push({ x: q.x, y: GY - 4, t: q.small ? 2.5 : 4 }); ctBurst(q.x, q.y, '#ff8c1a', q.small ? 22 : 44); CT.msg = empty ? 'Burning oil spatters an empty bailey. No one is left to burn.' : `${q.small ? 'Fire falls' : 'Burning oil rains'} on the bailey! ${k} defender${k === 1 ? '' : 's'} burned.`; sfx('fire'); buzz(q.small ? 20 : 40); }
  else if (q.type === 'rat') {
    ratNest(q.x, false); if (Math.random() < 0.12) ratPlague();
    ctBurst(q.x, q.y, RAT_COL, 8); sfx('plague'); sfx('rat');
    CT.msg = empty ? 'The rats land in an empty bailey and find nothing to eat.' : `Rats rain into the bailey and scurry for the stores. They bite as they run: watch the garrison shrink.${CT.plague ? ' The sickness spreads.' : ''}`;
  }
  else {
    ratNest(q.x, true); ratPlague();
    ctBurst(q.x, q.y, RAT_COL, 26); sfx('plague'); sfx('rat'); buzz(40);
    CT.msg = empty ? 'The giant rat thuds into an empty bailey.' : `A giant plague rat lands in the bailey! It savages the garrison as it runs, and the sickness takes hold (${['', 'mild', 'spreading', 'raging'][p.plague.s]}).`;
  }
  CT.killed += k;
}
function ratNest(x, big) { CT.rats.push({ x: clamp(x, 664, 786), v: (Math.random() < .5 ? -1 : 1) * (big ? 30 : 55), big, left: big ? RAT.giant.rounds : RAT.small.rounds, ph: Math.random() * 6, cd: RAT.every * (0.6 + Math.random() * 0.6) }); }
function ratPlague() { const p = CT.p; p.plague = { s: Math.min(3, ((p.plague && p.plague.s) || 0) + 1), t: 3 }; CT.plague++; }
// one bite: a small rat kills now and then, a giant rat kills one or two
function ratBite(r) {
  r.left--;
  if (ctAlive() === 0) return 0;
  const n = r.big ? 1 + (Math.random() < 0.5 ? 1 : 0) : (Math.random() < RAT.small.bite ? 1 : 0);
  return n ? killDefenders(CT.p, n) : 0;
}
// while the scene runs, the rats bite on their own clock
function ratsTick(dt) {
  let k = 0;
  for (const r of CT.rats) {
    r.cd -= dt; if (r.cd > 0) continue;
    r.cd = RAT.every * (0.7 + Math.random() * 0.6);
    const n = ratBite(r);
    if (n) { k += n; ctBurst(r.x, GY - 8, '#8a2a1a', 10 * n); }
  }
  CT.rats = CT.rats.filter(r => r.left > 0);
  if (k) { CT.killed += k; CT.ratKills = (CT.ratKills || 0) + k; if (!CT.projs.length) CT.msg = `The rats are at work in the bailey: ${CT.ratKills} defender${CT.ratKills === 1 ? '' : 's'} dead of their bites so far.`; sfx('plague'); buzz(10); }
}
// when the bombardment ends, rats still inside finish their work
function ratsFinish() { let k = 0; for (const r of CT.rats) while (r.left > 0) k += ratBite(r); CT.rats = []; CT.killed += k; CT.ratKills = (CT.ratKills || 0) + k; return k; }
// fire behind standing walls: the defenders shelter in towers and under the walls, and each new pot finds more
// of them ready with sand and water. Break the walls first and fire does its full work.
function fireKills(small) {
  const integ = CT.h.reduce((s, v) => s + v, 0) / (CT.cols * CT.rows), cover = 1 - (CT.lv === 1 ? 0.25 : 0.55) * integ;
  const tired = Math.max(0.3, 1 - 0.1 * (CT.fireN || 0)); CT.fireN = (CT.fireN || 0) + (small ? 1 / 3 : 1);
  const e = (small ? 0.6 : 2.2) * cover * tired, n = Math.floor(e) + (Math.random() < e % 1 ? 1 : 0);
  if (integ > 0.6 && CT.lv > 1 && !CT.coverSaid) { CT.coverSaid = true; setTimeout(() => { if (CT) CT.msg += ' The walls shelter many of them: break the walls and fire will do more.'; }, 0); }
  return n;
}
const ctAlive = () => fighters(defenders(CT.p));
function ctUpdate(dt) {
  CT.t += dt;
  const moat0 = CT.wx - 46, moat1 = CT.wx - 8;
  for (const q of CT.projs) {
    if (q.dead) continue;
    q.vy += GRAV * dt; q.vx += CT.wind * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    q.trail.push([q.x, q.y]); if (q.trail.length > 30) q.trail.shift();
    let done = false;
    for (let c = 0; c < CT.ocols && !done; c++) { const x0 = CT.ox + c * CBW; if (q.x + q.r > x0 && q.x - q.r < x0 + CBW && CT.oh[c] > 0 && q.y + q.r > GY - CT.oh[c] * CBH) { ctHitOuter(c, q); done = true; } }
    for (let c = 0; c < CT.cols && !done; c++) { const x0 = CT.wx + c * CBW; if (q.x + q.r > x0 && q.x - q.r < x0 + CBW && CT.h[c] > 0 && q.y + q.r > GY - CT.h[c] * CBH) { ctHitWall(c, q); done = true; } }
    if (!done && q.x > 705 && q.x < 755 && q.y > GY - 120) { ctHitInside(q); done = true; }
    if (!done && q.y >= GY) {
      if (q.x >= WXE && q.x <= 790) ctHitInside(q);
      else if (CT.p.b.moat && q.x > moat0 && q.x < moat1) { ctBurst(q.x, GY, '#9fc3c8', 16); CT.msg = 'Splash! The shot falls into the moat.'; sfx('splash'); }
      else { ctBurst(q.x, GY, '#7a6a4a', 10); CT.msg = q.x < CT.wx ? 'Short! The shot ploughs into the field.' : 'Too long! It sails over the castle.'; sfx('miss'); }
      done = true;
    }
    if (!done && (q.x > CW + 40 || q.x < -40)) { CT.msg = 'The shot flies wide.'; done = true; }
    if (done) q.dead = true;
  }
  if (CT.projs.length && CT.projs.every(q => q.dead)) { CT.projs = []; CT.wind = Math.round((Math.random() * 2 - 1) * 70); if (CT.shots <= 0) CT.msg += ' Out of ammunition.'; }
  CT.parts.forEach(t => { t.vy += 600 * (t.g ?? 1) * dt; if (t.smoke) { t.vx *= 1 - dt * 0.8; t.vy *= 1 - dt * 0.6; t.vx += (CT.wind || 0) * 0.15 * dt; } if (t.grow) t.s += t.grow * dt; t.x += t.vx * dt; t.y += t.vy * dt; t.life -= dt; });
  CT.parts = CT.parts.filter(t => t.life > 0 && (t.y < GY + 4 || t.smoke));
  if (CT.booms) { CT.booms.forEach(b => b.t += dt); CT.booms = CT.booms.filter(b => b.t < 1.2); }
  if (CT.mush) { CT.mush.forEach(m => m.t += dt); CT.mush = CT.mush.filter(m => m.t < 5); }
  if (CT.smoulder) { for (const s of CT.smoulder) { s.t -= dt; if (Math.random() < dt * 10 * Math.min(1, s.t)) CT.parts.push({ x: s.x + (Math.random() - .5) * 70, y: GY - 2, vx: (CT.wind || 0) * 0.2, vy: -25 - Math.random() * 30, life: 1.4 + Math.random(), max: 2.4, color: '#46403a', s: 4 + Math.random() * 4, grow: 10, round: 1, smoke: 1, g: -0.03 }); } CT.smoulder = CT.smoulder.filter(s => s.t > 0); }
  if (CT.shake) CT.shake = Math.max(0, CT.shake - dt); if (CT.flash) CT.flash = Math.max(0, CT.flash - dt * 3.2);
  CT.fires.forEach(f => f.t -= dt); CT.fires = CT.fires.filter(f => f.t > 0);
  ratsTick(dt);
  for (const r of CT.rats) { r.x += r.v * dt; r.ph += dt * (r.big ? 9 : 16); if (r.x < 662 || r.x > 788) r.v = -r.v; }
  for (const c of CT.crowd) { c.x += c.v * dt; if (c.x < 652 || c.x > 790) c.v = -c.v; }
  for (const c of CT.clouds) { c[0] += CT.wind * dt * 0.15; if (c[0] > CW + 80) c[0] = -80; if (c[0] < -80) c[0] = CW + 80; }
  if (CT.p.gar.bow + CT.p.gar.foot > 0 && Math.random() < dt * Math.min(4, CT.p.gar.bow + 1) * 0.6) {
    const cols = CT.h.map((v, i) => v > 0 ? i : -1).filter(i => i >= 0);
    if (cols.length) { const c = pick(cols); CT.arrows.push({ x: CT.wx + c * CBW + 10, y: GY - CT.h[c] * CBH - 14, tx: 90 + Math.random() * 80, ty: GY - 10 - Math.random() * 30, t: 0 }); }
  }
  CT.arrows.forEach(a => a.t += dt * 0.8); CT.arrows = CT.arrows.filter(a => a.t < 1);
}
// clouds lit from below by the setting sun
const cloudCol = () => 'rgba(250,196,160,.62)';
// torches on the battlements and the keep, lit windows, and the besiegers' campfire
function duskLights(x) {
  const fl = k => 0.75 + 0.25 * Math.sin(CT.t * 11 + k * 2.3) * Math.sin(CT.t * 7.3 + k);
  const glow = (gx, gy, r, a) => { x.globalAlpha = Math.min(1, a); x.drawImage(CT.glowS, gx - r, gy - r, r * 2, r * 2); x.globalAlpha = 1; };
  const flame = (fx, fy, s, k) => { const f = fl(k); x.fillStyle = '#ff8c1a'; x.beginPath(); x.moveTo(fx - 3 * s, fy); x.quadraticCurveTo(fx - 2 * s, fy - 7 * s * f, fx, fy - 11 * s * f); x.quadraticCurveTo(fx + 2 * s, fy - 7 * s * f, fx + 3 * s, fy); x.fill(); x.fillStyle = '#ffe08a'; x.beginPath(); x.moveTo(fx - 1.4 * s, fy); x.quadraticCurveTo(fx, fy - 7 * s * f, fx + 1.4 * s, fy); x.fill(); };
  x.globalCompositeOperation = 'lighter';
  // the keep's windows
  for (const [wx, wy, ww, wh] of [[724, GY - 90, 10, 16], [714, GY - 60, 6, 10], [740, GY - 60, 6, 10]]) glow(wx + ww / 2, wy + wh / 2, 22, 0.35 * fl(wx));
  x.globalCompositeOperation = 'source-over';
  x.fillStyle = '#ffcf6b'; for (const [wx, wy, ww, wh] of [[725, GY - 89, 8, 14], [715, GY - 59, 4, 8], [741, GY - 59, 4, 8]]) x.fillRect(wx, wy, ww, wh);
  // torches on every other standing column of the wall, and on the keep
  const torches = [[707, GY - 134], [751, GY - 134]];
  for (let c = 0; c < CT.cols; c += 2) if (CT.h[c] > 1) torches.push([CT.wx + c * CBW + CBW / 2, GY - CT.h[c] * CBH - 8]);
  x.globalCompositeOperation = 'lighter'; torches.forEach(([tx, ty], k) => glow(tx, ty - 6, 34, 0.42 * fl(k))); x.globalCompositeOperation = 'source-over';
  torches.forEach(([tx, ty], k) => { x.fillStyle = '#2a1d12'; x.fillRect(tx - 1, ty - 2, 2, 8); flame(tx, ty - 2, 0.8, k); });
  // the campfire behind the catapult
  const cx = 214, cy = GY - 4;
  x.globalCompositeOperation = 'lighter'; glow(cx, cy - 8, 70, 0.45 * fl(9)); x.globalCompositeOperation = 'source-over';
  x.strokeStyle = '#3a2817'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 10, cy + 2); x.lineTo(cx + 10, cy - 4); x.moveTo(cx + 10, cy + 2); x.lineTo(cx - 10, cy - 4); x.stroke();
  flame(cx - 4, cy - 2, 1.3, 3); flame(cx + 4, cy - 1, 1.1, 5); flame(cx, cy - 3, 1.6, 7);
  if (Math.random() < 0.25) CT.parts.push({ x: cx + (Math.random() - .5) * 6, y: cy - 16, vx: (CT.wind || 0) * 0.3, vy: -30 - Math.random() * 20, life: 1.6, max: 1.6, color: '#3a3430', s: 3, grow: 8, round: 1, smoke: 1, g: -0.02 });
  if (Math.random() < 0.3) CT.parts.push({ x: cx + (Math.random() - .5) * 8, y: cy - 10, vx: (Math.random() - .5) * 20, vy: -60 - Math.random() * 40, life: 0.9, color: '#ffb347', s: 1.2, round: 1, glow: 1, g: 0.05, flick: 1 });
}
// the last of the light: warm the scene and darken its corners
function duskGrade(x) {
  // stone in shadow: the walls and keep face away from the sun (small rects, cheap)
  x.globalCompositeOperation = 'multiply'; x.fillStyle = '#a68fa0';
  for (let c = 0; c < CT.cols; c++) if (CT.h[c]) x.fillRect(CT.wx + c * CBW, GY - CT.h[c] * CBH - 8, CBW, CT.h[c] * CBH + 8);
  for (let c = 0; c < (CT.ocols || 0); c++) if (CT.oh[c]) x.fillRect(CT.ox + c * CBW, GY - CT.oh[c] * CBH - 8, CBW, CT.oh[c] * CBH + 8);
  x.fillRect(703, GY - 134, 54, 134);
  x.globalCompositeOperation = 'source-over'; x.fillStyle = 'rgba(255,170,90,.35)'; for (let c = 0; c < CT.cols; c++) if (CT.h[c] && (c === 0 || CT.h[c - 1] < CT.h[c])) x.fillRect(CT.wx + c * CBW, GY - CT.h[c] * CBH - 8, 2, CT.h[c] * CBH + 8); x.fillRect(703, GY - 134, 2, 134);
  // the dusk over everything in the foreground and the dark corners, painted once and laid over each frame
  x.drawImage(CT.dusk, 0, 0, CW, CH);
}
function ctDraw() {
  const x = CT.ctx, p = CT.p, wood = CT.lv === 1;
  x.save(); if (CT.shake && !document.body.classList.contains('nomotion')) { const k = 10 * CT.shake; x.translate((Math.random() - .5) * k, (Math.random() - .5) * k); }
  x.drawImage(CT.sky, 0, 0, CW, CH);
  for (const [cx, cy, w, h] of CT.clouds) { x.fillStyle = 'rgba(90,50,80,.35)'; x.beginPath(); x.ellipse(cx + 4, cy + h * 0.45, w * 1.05, h * 0.7, 0, 0, 7); x.fill(); }
  x.fillStyle = cloudCol(CT.clouds);
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
  const DN = defenders(p), groundNow = DN.foot + DN.militia + DN.cav, wallNow = DN.bow + DN.foot;
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
  for (let c = 0; c < CT.ocols; c++) {
    for (let r = 0; r < CT.oh[c]; r++) { const bx = CT.ox + c * CBW, by = GY - (r + 1) * CBH; x.fillStyle = (r + c) % 2 ? '#8d846f' : '#80776a'; x.fillRect(bx, by, CBW, CBH); x.strokeStyle = '#5f584a'; x.lineWidth = 1; x.strokeRect(bx + .5, by + .5, CBW - 1, CBH - 1); }
    const top = GY - CT.oh[c] * CBH;
    if (CT.oh[c] > 0 && c % 2 === 0) { x.fillStyle = '#80776a'; x.fillRect(CT.ox + c * CBW + 3, top - 8, CBW - 6, 8); }
    if (!CT.oh[c]) { x.fillStyle = '#5f584a'; for (let k = 0; k < 4; k++) x.fillRect(CT.ox + c * CBW + (k * 5) % 16, GY - 4 - (k % 2) * 4, 5, 4); }
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
  if (!CT.projs.length && CT.shots > 0) { const hx = ax + Math.cos(ang) * L, hy = ay + Math.sin(ang) * L - 2; if (CT.ammo === 'rats' || CT.ammo === 'giant') drawRat(x, hx, hy - 3, CT.ammo === 'giant' ? 0.9 : 0.55, 1, CT.t * 6, false); else { x.fillStyle = CT.ammo.startsWith('oil') ? '#ff7a00' : '#5d564a'; x.beginPath(); x.arc(hx, hy, 5, 0, 7); x.fill(); } }
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
    if (q.type === 'rat' || q.type === 'giant') { const big = q.type === 'giant'; x.strokeStyle = RAT_COL + '33'; x.lineWidth = big ? 3 : 1.5; x.beginPath(); q.trail.forEach((t, i) => i ? x.lineTo(t[0], t[1]) : x.moveTo(t[0], t[1])); x.stroke(); drawRat(x, q.x, q.y, big ? 1.5 : 0.55, Math.sign(q.vx) || 1, CT.t * 20 + (q.ph || 0), true, Math.atan2(q.vy, Math.abs(q.vx)) * 0.6); continue; }
    const col = q.type === 'oil' ? '#ff7a00' : q.type === 'greek' ? '#2f4a2a' : '#5d564a';
    x.strokeStyle = col + '66'; x.lineWidth = 3; x.beginPath(); q.trail.forEach((t, i) => i ? x.lineTo(t[0], t[1]) : x.moveTo(t[0], t[1])); x.stroke();
    x.fillStyle = 'rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(q.x, GY - 2, q.r, q.r * 0.4, 0, 0, 7); x.fill();
    x.fillStyle = col; x.beginPath(); x.arc(q.x, q.y, q.r, 0, 7); x.fill();
    if (q.type === 'greek') { x.fillStyle = '#ff8c1a'; x.beginPath(); x.arc(q.x, q.y - 2, 4, 0, 7); x.fill(); }
    if (q.type === 'oil') { x.fillStyle = '#ffd36b'; x.beginPath(); x.arc(q.x - 3, q.y - 3, 3, 0, 7); x.fill(); }
  }
  for (const r of CT.rats) drawRat(x, r.x, GY - (r.big ? 9 : 4), r.big ? 1.2 : 0.5, Math.sign(r.v), r.ph, false);
  duskGrade(x); duskLights(x);
  // smoke first, then the fireball and its ring, then everything glowing on top
  for (const t of CT.parts) if (t.smoke) {
    const al = Math.max(0, Math.min(0.6, t.life / (t.max || 3) * 0.75)), young = Math.max(0, 1 - ((t.max || 3) - t.life) / 0.9);
    const g = x.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.s); const c = young > 0 ? `${Math.round(43 + 180 * young)},${Math.round(38 + 60 * young)},${Math.round(32 + 10 * young)}` : (t.color === '#2b2620' ? '43,38,32' : '70,64,58');
    g.addColorStop(0, `rgba(${c},${al})`); g.addColorStop(0.6, `rgba(${c},${al * 0.6})`); g.addColorStop(1, `rgba(${c},0)`); x.fillStyle = g; x.beginPath(); x.arc(t.x, t.y, t.s, 0, 7); x.fill();
  }
  x.globalAlpha = 1;
  for (const s of CT.smoulder || []) { const a = Math.min(1, s.t / 1.5); x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(s.x, GY, 0, s.x, GY, 60); g.addColorStop(0, `rgba(255,${110 + rnd(40)},30,${0.55 * a * (0.8 + 0.2 * Math.random())})`); g.addColorStop(1, 'rgba(200,40,0,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(s.x, GY, 60, 12, 0, 0, 7); x.fill(); x.globalCompositeOperation = 'source-over'; for (let i = 0; i < 6; i++) { x.fillStyle = `rgba(255,${120 + rnd(100)},40,${0.7 * a})`; x.fillRect(s.x + (Math.random() - .5) * 90, GY - 2 - Math.random() * 3, 2, 2); } }
  for (const m of CT.mush || []) drawMushroom(x, m);
  for (const b of CT.booms || []) {
    const k = b.t, r = (24 + 120 * Math.min(1, k / 0.3) + 18 * Math.sin(Math.min(k, 0.6) * 18) * (1 - k)) * b.big, a = Math.max(0, 1 - k / 0.95);
    if (a > 0) { const g = x.createRadialGradient(b.x, b.y, 0, b.x, b.y, r); g.addColorStop(0, `rgba(255,255,230,${a})`); g.addColorStop(0.25, `rgba(255,220,90,${a})`); g.addColorStop(0.55, `rgba(255,120,20,${a * 0.85})`); g.addColorStop(1, 'rgba(160,30,0,0)'); x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.beginPath(); x.arc(b.x, b.y, r, 0, 7); x.fill(); x.globalCompositeOperation = 'source-over'; }
    if (k < 0.5) { x.strokeStyle = `rgba(255,240,200,${0.7 * (1 - k / 0.5)})`; x.lineWidth = 6 * (1 - k / 0.5) + 1; x.beginPath(); x.arc(b.x, b.y, (30 + 260 * k) * b.big, 0, 7); x.stroke(); }
  }
  for (const t of CT.parts) {
    if (t.smoke) continue;
    x.globalAlpha = Math.max(0, Math.min(1, t.life)) * (t.flick ? 0.6 + 0.4 * Math.random() : 1); x.fillStyle = t.color;
    if (t.glow) x.globalCompositeOperation = 'lighter';
    if (t.round) { x.beginPath(); x.arc(t.x, t.y, t.s, 0, 7); x.fill(); } else x.fillRect(t.x, t.y, t.s, t.s);
    x.globalCompositeOperation = 'source-over';
  }
  x.globalAlpha = 1;
  x.restore();
  if (CT.flash) { x.fillStyle = `rgba(255,236,190,${Math.min(0.85, CT.flash)})`; x.fillRect(0, 0, CW, CH); }
  // HUD (DOM)
  const integ = Math.round(CT.h.reduce((s, v) => s + v, 0) / (CT.cols * CT.rows) * 100);
  const set = (id, v) => { const el = document.getElementById(id); if (el && el.innerHTML !== v) el.innerHTML = v; };
  set('ct-shots', String(CT.shots)); set('ct-walls', CT.ocols ? `${Math.round(CT.oh.reduce((s, v) => s + v, 0) / (CT.ocols * CT.orows) * 100)}% · ${integ < RUIN_AT ? `<span style="color:#ff9c8c">${integ}% ruin</span>` : integ + '%'}` : (integ < RUIN_AT ? `<span style="color:#ff9c8c">${integ}% ruin</span>` : integ + '%')); set('ct-def', `${ctAlive()}${CT.killed ? ` <small style="color:#ff9c8c">−${CT.killed}</small>` : ''}${CT.plague ? ' ' + ico('skull') : ''}${CT.rats.length ? ' ' + ico('rat') : ''}`);
  set('am-rats', CT.cages + ' left'); set('am-giant', CT.cages + ' left'); set('am-greek', (myA().gf || 0) + ' left');
  set('ct-wind', `${CT.wind < 0 ? '◂' : CT.wind > 0 ? '▸' : '·'} ${Math.abs(CT.wind)}`);
  const m = document.getElementById('ctmsg'); if (m && m.textContent !== CT.msg) m.textContent = CT.msg;
}
// each bombardment owns its own loop: a loop that finds a different (newer) bombardment in CT stops at once,
// so loops can never pile up from one siege to the next
// a rat: body, head, ear, legs and a long tail. Flying rats sprawl with legs out; rats on the ground scurry.
function drawRat(x, cx, cy, sc, dir, ph, flying, tilt = 0) {
  x.save(); x.translate(cx, cy); x.scale(dir * sc, sc); x.rotate(tilt);
  x.strokeStyle = '#2f2722'; x.lineWidth = 2; x.lineCap = 'round';
  x.beginPath(); x.moveTo(-10, 0); x.quadraticCurveTo(-20, -4 + Math.sin(ph) * 5, -27, 2 + Math.cos(ph) * 3); x.stroke();
  const lg = flying ? 6 : 3 * Math.sin(ph);
  x.lineWidth = 2.2; x.beginPath();
  x.moveTo(-5, 3); x.lineTo(-8 - lg * 0.5, 8 + (flying ? 2 : 0)); x.moveTo(5, 3); x.lineTo(7 + lg * 0.5, 8 + (flying ? 2 : 0));
  if (flying) { x.moveTo(-3, -3); x.lineTo(-7, -9); x.moveTo(4, -3); x.lineTo(8, -9); }
  x.stroke();
  x.fillStyle = RAT_COL; x.beginPath(); x.ellipse(0, 0, 11, 6.5, 0, 0, 7); x.fill();
  x.beginPath(); x.moveTo(8, -4); x.quadraticCurveTo(18, -2, 19, 2); x.quadraticCurveTo(14, 5, 8, 4); x.fill();
  x.fillStyle = '#7a675a'; x.beginPath(); x.arc(9, -6, 3, 0, 7); x.fill();
  x.fillStyle = '#d23a2a'; x.beginPath(); x.arc(14, -1, 1.3, 0, 7); x.fill();
  x.restore();
}
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
  ratsFinish();
  const c = CT, p = c.p, A = myA();
  if (c.lostCat) note(`${c.lostCat} catapult${c.lostCat > 1 ? 's' : ''} burned in your own Greek fire.`);
  const w = Math.round(c.h.reduce((s, v) => s + v, 0) / (c.cols * c.rows) * 100);
  if (c.ocols) p.outer = Math.round(c.oh.reduce((s, v) => s + v, 0) / (c.ocols * c.orows) * 100);
  p.walls = Math.round(w); ruinIfBroken(p);
  A.bombarded = true; A.acted = true;
  note(`Bombardment of ${p.name}: walls ${c.w0}% → ${p.ruined ? 'ruined' : p.walls + '%'}, ${c.killed} defenders killed${c.plague ? ', plague sown inside' : ''}.`);
  c.dead = true; releaseScene(c); CT = null; closeModal(); save(); render();
  toast(`Walls ${c.w0}% → ${p.ruined ? 'ruined' : p.walls + '%'} · ${c.killed} killed`, 'cat');
}
