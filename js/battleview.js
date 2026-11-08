'use strict';
// ================= BATTLE: pre-battle & live view =================
let PB = null, BV = null;
function openPreBattle(kind, pid) {
  const p = P(pid), F = G.fac[me()], A = myA();
  armsImage(me()); armsImage(kind === 'relief' ? besiegerOf(p) : p.owner);
  const peace = kind === 'assault' && p.owner && truce() && F.excom < 1;
  const cfgFor = (st, res) => { const c = kind === 'relief' ? reliefCfg(me(), A, p, st) : assaultCfg(me(), A, p, st); if (peace) c.aMod = mods(me()) - 1; c.aRes = !!res; return c; };
  PB = { kind, p, A, st: 'balanced', res: false, cfgFor, peace, odds: {} };
  for (const st of ['aggressive', 'balanced', 'defensive']) PB.odds[st] = estimateWin(cfgFor(st, PB.res), 40);
  setMusic('battle');
  drawPreBattle();
}
function bonusTxt(b, gen, mod) {
  const t = [];
  if (b.atk) t.push(`+${Math.round(b.atk * 100)}% attack`); if (b.hp) t.push(`+${Math.round(b.hp * 100)}% hit points`); if (b.cav) t.push(`+${Math.round(b.cav * 100)}% cavalry`);
  if (gen) t.push(ico('fleur') + ' ' + gen.n); if (mod > 0) t.push('blessed'); if (mod < 0) t.push('excommunicated');
  return t.length ? `<p class="sub">${t.join(' · ')}</p>` : '';
}
const STANCE_ICON = { aggressive: 'swords', balanced: 'flag', defensive: 'foot' };
function drawPreBattle() {
  const { kind, p, A } = PB, cfg = PB.cfgFor(PB.st, PB.res);
  const canRes = armySize(A) >= 9 && !(cfg.castle && !p.ruined);
  const enemyF = kind === 'relief' ? cfg.besieger : p.owner;
  const title = kind === 'relief' ? `Relief of ${p.name}` : (p.b.castle && !p.ruined ? `Storming ${p.name}` : `Battle for ${p.name}`);
  const col = (fid, name, U, extra) => `<div class="bcol">${shield(fid, 34)}<div class="bname">${name}</div><p class="units">${uStr(U, true, false)}</p>${extra || ''}</div>`;
  const castleTxt = cfg.castle && !p.ruined ? `<p>${ico('castle')} ${CASTLE_N[castleLv(p)]}${p.b.moat ? ', moat' : ''} · walls ${p.walls}%</p>${cfg.D.cat ? `<p>${ico('cat')} ${cfg.D.cat} catapult${cfg.D.cat > 1 ? 's' : ''} on the walls</p>` : ''}` : '';
  showModal(`<h2 class="ctr">${title}</h2>
    <div class="vs">${col(me(), FAC(me()).name, cfg.A, bonusTxt(cfg.aBon, cfg.aGen, cfg.aMod))}<div class="vsx">vs</div>${col(enemyF, enemyF ? FAC(enemyF).name : p.lord, cfg.D, castleTxt + bonusTxt(cfg.dBon || {}, cfg.dGen, cfg.dMod) + `<p class="sub">Expect a ${STANCE[cfg.dSt].n.toLowerCase()} stand</p>`)}</div>
    ${PB.peace ? `<div class="notebox bad">${ico('dove')} This attack breaks the Peace of God.</div>` : ''}
    <h3>Your orders · army ${ARMY_NUM(A)}</h3>
    <div class="stances">${['aggressive', 'balanced', 'defensive'].map(st => `<button class="btn stance${PB.st === st ? ' on' : ''}" onclick="PB.st='${st}';drawPreBattle()"><b>${ico(STANCE_ICON[st])}${STANCE[st].n}</b><small>${STANCE[st].d}</small><span class="odds">${oddsTxt(PB.odds[st])} to win</span></button>`).join('')}</div>
    ${canRes ? `<button class="btn${PB.res ? ' on' : ''}" style="width:100%;margin-top:8px" onclick="PB.res=!PB.res;for(const st of ['aggressive','balanced','defensive'])PB.odds[st]=estimateWin(PB.cfgFor(st,PB.res),40);drawPreBattle()"><span class="lbl">${ico('foot')}Hold a reserve</span><small>A third of the foot and bowmen wait behind the line. Commit them for a surge; held back, they halve the losses of a defeat.</small></button>` : ''}
    ${!cfg.castle && cfg.A.cav > 0 ? `<p class="sub" style="margin-top:8px">${ico('cav')} During the battle, while your horse still hold, you may send them at the enemy horse, at their bowmen, or round to the rear. Left alone, they charge as the lines close.</p>` : ''}
    <div class="row ctr"><button class="btn gold big" onclick="startBattle()"><span class="lbl">${ico('swords')}Sound the advance</span></button><button class="btn big" onclick="autoBattle()"><span class="lbl">${ico('skip')}Auto-resolve</span></button><button class="btn" onclick="PB=null;closeModal()">Withdraw</button></div>
    <p class="sub ctr">Auto-resolve fights the same battle with your stance and reserve, without the battle scene.</p>`, 'wide');
}
// move the army into position for the fight; false if it can no longer reach
function stageBattle(kind, p, A) {
  if (kind === 'assault') { if (A.siege !== p.id) { const s = stageFor(me(), A, p); if (!s) return false; } breakPeace(p); if (p.b.castle && !p.ruined) { A.siege = p.id; A.loc = p.id; } }
  else { if (A.siege && A.siege !== p.id) note(`You lift the siege of ${P(A.siege).name}.`); A.siege = null; if (A.loc !== p.id) { const s = strikeFrom(me(), A, p); if (s) { A.mp -= s.dist; A.loc = s.stage; } else if (canMarch(me(), A, p.id)) marchArmy(me(), A, p.id); } }
  return true;
}
const battleNames = (kind, p, cfg) => { const e = kind === 'relief' ? cfg.besieger : p.owner; return [FAC(me()).name, e ? FAC(e).name : p.lord]; };
// fight it out without the battle scene: the same battle model, your stance and reserve, the horse left to charge as the lines close
function autoBattle() {
  if (!PB) return;
  const { kind, p, A } = PB;
  if (!stageBattle(kind, p, A)) { PB = null; closeModal(); return toast('Out of reach'); }
  const cfg = PB.cfgFor(PB.st, PB.res); PB = null;
  const res = runBattle(cfg);
  finishBattle({ kind, p, army: A, cfg, a0: { ...cfg.A }, d0: { ...cfg.D }, names: battleNames(kind, p, cfg) }, res, res.why);
}
function startBattle() {
  if (BV) { BV.dead = true; releaseScene(BV); BV = null; }
  const { kind, p, A } = PB;
  if (!stageBattle(kind, p, A)) { PB = null; closeModal(); return toast('Out of reach'); }
  const cfg = PB.cfgFor(PB.st, PB.res); cfg.manualA = true;
  const B = makeBattle(cfg);
  const enemyF = kind === 'relief' ? cfg.besieger : p.owner;
  BV = { fids: [me(), enemyF], B, kind, p, army: A, cfg, a0: { ...cfg.A }, d0: { ...cfg.D }, enemyF, last: 0, clashT: 0, volley: 0, endT: 0, dead: false, bg: battleBg(), walls: p.walls, names: [FAC(me()).name, enemyF ? FAC(enemyF).name : p.lord], colors: [FAC(me()).color, enemyF ? FAC(enemyF).color : '#d9cba5'], dust: [], speed: SET.speed || 1, lastPhase: '' };
  PB = null;
  const side = (i, cls) => `<div class="side ${cls}"><div class="nm">${shield(BV.fids[i], 18)}<span>${esc(BV.names[i])}</span></div><div class="st">${STANCE[i ? cfg.dSt : cfg.aSt].n}</div><div class="hb"><i id="hb${i}" style="width:100%;background:${BV.colors[i]}"></i></div><div class="cnts" id="cn${i}"></div></div>`;
  showModal(`<div class="bview"><div class="bhud">${side(0, 'l')}<div class="mid"><div class="phase" id="bphase">The armies advance</div><div class="tot" id="btot"></div></div>${side(1, 'r')}</div><canvas id="bvc"></canvas>
    <div class="bord" id="bord"></div>
    <div class="bctl" id="bvbtns"><button class="btn dark sm" onclick="bvSpeed()" id="bvspd"><span class="lbl">${ico('speed')}${BV.speed}×</span></button><button class="btn" onclick="bvRetreat()"><span class="lbl">${ico('retreat')}Sound the retreat</span></button><button class="btn" onclick="bvSkip()"><span class="lbl">${ico('skip')}Skip to the end</span></button></div></div>`, 'wide battle');
  const cv = $('#bvc');
  fitCanvas(cv, BW_, BH_);
  // draw no finer than the screen can show: the field is shown smaller than 1000 points on a phone
  const shown = (() => { const r = cv.getBoundingClientRect(); return Math.max(r.width, r.height) || BW_; })();
  const dpr = clamp(shown * (window.devicePixelRatio || 1) / BW_, 1, 2);
  cv.width = Math.round(BW_ * dpr); cv.height = Math.round(BH_ * dpr); BV.ctx = cv.getContext('2d'); BV.ctx.scale(dpr, dpr);
  // the field, the vignette and the fallen are drawn once into their own layers
  BV.ground = makeLayer(BW_, BH_, dpr, g => drawGround(g, BV));
  BV.vig = makeLayer(BW_, BH_, dpr, g => { const vg = g.createRadialGradient(BW_ / 2, BH_ / 2, BH_ * 0.5, BW_ / 2, BH_ / 2, BW_ * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,15,5,.35)'); g.fillStyle = vg; g.fillRect(0, 0, BW_, BH_); });
  BV.corpC = makeLayer(BW_, BH_, dpr); BV.corpX = BV.corpC.getContext('2d'); BV.corpN = 0;
  sfx('horn'); buzz(30);
  const scene = BV; requestAnimationFrame(t => bvFrame(t, scene));
}
function battleBg() {
  const patches = [], trees = [], gaps = [], tufts = [];
  for (let i = 0; i < 46; i++) patches.push([Math.random() * BW_, Math.random() * BH_, 24 + Math.random() * 70, Math.random()]);
  for (let i = 0; i < 28; i++) trees.push([Math.random() * BW_, i % 2 ? 6 + Math.random() * 16 : BH_ - 6 - Math.random() * 16, 9 + Math.random() * 9, Math.random()]);
  for (let i = 0; i < 14; i++) gaps.push(Math.random());
  for (let i = 0; i < 90; i++) tufts.push([Math.random() * BW_, 30 + Math.random() * (BH_ - 60), Math.random()]);
  return { patches, trees, gaps, tufts, road: 150 + Math.random() * 240 };
}
function bvOrder(k) {
  if (!BV || BV.B.done) return;
  const B = BV.B;
  if (k === 'reserve') { if (commitReserve(B, 0)) { sfx('horn'); buzz(20); } }
  else if (orderCav(B, 0, k)) { sfx('horn'); buzz(20); }
  drawHud(BV);
}
function bvSpeed() { if (!BV) return; BV.speed = BV.speed >= 4 ? 1 : BV.speed * 2; SET.speed = BV.speed; saveSettings(); $('#bvspd').innerHTML = `<span class="lbl">${ico('speed')}${BV.speed}×</span>`; }
function bvRetreat() { if (!BV || BV.B.done) return; endBattle(BV.B, 1, 'retreat'); BV.endT = 0.01; }
function bvSkip() { if (!BV) return; const B = BV.B; let g = 0; while (!B.done && g++ < 2000) battleStep(B, 0.25); if (!B.done) endBattle(B, 1, 'time'); for (let i = 0; i < 40; i++) animateSquads(B, 0.1); BV.endT = 2; }
// each battle owns its own loop, so an old loop can never carry on drawing into a newer battle
function bvFrame(ts, scene) {
  if (!BV || BV !== scene || BV.dead) return;
  const dt = Math.min(0.05, BV.last ? (ts - BV.last) / 1000 : 0.016); BV.last = ts;
  const B = BV.B, sim = dt * 2.4 * BV.speed;
  if (!B.done) { let left = sim; while (left > 0 && !B.done) { const s = Math.min(0.1, left); battleStep(B, s); left -= s; } }
  animateSquads(B, sim);
  if (B.contact && !B.done) { BV.clashT -= dt; if (BV.clashT <= 0) { sfx('clash'); BV.clashT = 0.12 + Math.random() * 0.25; } }
  if (B.volley - BV.volley > 6) { sfx('arrows'); BV.volley = B.volley; }
  // dust behind moving squads
  for (const q of B.sq) if (q.moving && q.n > 0.1 && Math.random() < dt * 6) BV.dust.push({ x: q.x + (q.s === 0 ? -14 : 14), y: q.y + 6 + (Math.random() - .5) * 10, t: 0, r: 4 + Math.random() * 5 });
  BV.dust.forEach(d => d.t += dt); BV.dust = BV.dust.filter(d => d.t < 1.1);
  drawBattle(BV); drawHud(BV);
  if (B.done) { BV.endT += dt; if (BV.endT > 2.2) return bvFinish(); }
  requestAnimationFrame(t => bvFrame(t, scene));
}
function drawHud(V) {
  const B = V.B, tot = s => sideAll(B, s);
  // touch the page only when a number actually changes; rewriting it every frame forces a relayout
  for (const s of [0, 1]) {
    const hb = $('#hb' + s), w = Math.round(100 * tot(s) / Math.max(1, B.n0[s])) + '%'; if (hb && hb._w !== w) { hb._w = w; hb.style.width = w; }
    const cn = $('#cn' + s); if (cn) { const h = SIDE_T.filter(t => B.u0[s][t] > 0).map(t => `<span>${ico(UNIT_ICON[t])}${Math.round(B.u[s][t] + (B.res[s] ? (B.res[s][t] || 0) : 0))}</span>`).join('') + (B.res[s] ? `<span class="tag" style="font-size:11px;padding:1px 6px;margin:0">reserve ${resN(B, s)}</span>` : ''); if (cn._h !== h) { cn._h = h; cn.innerHTML = h; } }
  }
  const ob = $('#bord');
  if (ob) {
    let h = '';
    if (!B.done) {
      if (B.res[0]) h += `<button class="btn sm gold" onclick="bvOrder('reserve')"><span class="lbl">${ico('foot')}Commit the reserve</span></button>`;
      if (!B.castle && B.wing[0].s === 'hold' && B.u[0].cav > 0.05) h += `<button class="btn sm" onclick="bvOrder('wing')"><span class="lbl">${ico('cav')}At their horse</span></button><button class="btn sm" onclick="bvOrder('archers')"><span class="lbl">${ico('bow')}At their bowmen</span></button><button class="btn sm" onclick="bvOrder('rear')"><span class="lbl">${ico('flag')}Round the rear</span></button>`;
      else if (!B.castle && B.u0[0].cav > 0) h += `<span class="st">${B.status[0] || (B.wing[0].s === 'fight' ? 'The horse are engaged' : B.wing[0].s === 'flank' ? 'The horse are in the enemy rear' : B.wing[0].s === 'broken' ? 'The horse are broken' : B.wing[0].s === 'ride' ? 'The horse ride round' : B.wing[0].s === 'raid' ? 'The horse are among the bowmen' : 'The horse await the enemy')}</span>`;
      if (B.boost[0] > B.t) h += `<span class="st good">Surge: +15% attack</span>`;
    } else h += `<span class="st">${B.win === 0 ? 'The day is yours.' : 'The field is lost.'}</span>`;
    if (ob.innerHTML !== h) ob.innerHTML = h;
  }
  const phase = B.done ? (B.win === 0 ? 'VICTORY' : B.why === 'retreat' ? 'RETREAT' : 'DEFEAT')
    : B.wing.some(w => w.s === 'flank') ? 'The horse strike the rear!' : B.wing[0].s === 'fight' ? 'The horse clash on the wings' : B.contact ? 'The lines clash' : (B.castle ? B.front[0] > WALLX - 330 : gap(B) <= 300) ? 'Arrows fly' : 'The armies advance';
  if (phase !== V.lastPhase) { if (phase.includes('rear') || phase.includes('clash')) { const cv = $('#bvc'), box = cv && (cv.closest('.rotbox') || cv); if (box && SET.motion) { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); } } V.lastPhase = phase; const el = $('#bphase'); if (el) { el.textContent = phase; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); } if (phase.includes('rear')) buzz(25); }
  const bt = $('#btot'), tt = `${Math.round(tot(0))} vs ${Math.round(tot(1))}`; if (bt && bt.textContent !== tt) bt.textContent = tt;
}

// ---------- figures ----------
// each figure is drawn once per colour, type, pose and facing into a small bitmap, then stamped
const SPR = new Map(), SPR_W = 64, SPR_H = 52, SPR_OX = 32, SPR_OY = 30;
function figure(x, t, side, color, type, k, flip) {
  const kk = type === 'cav' ? k % 6 : 0, key = color + type + kk + (flip ? 1 : 0);
  let c = SPR.get(key);
  if (!c) { c = makeLayer(SPR_W, SPR_H, Math.min(2, window.devicePixelRatio || 1), g => figureRaw(g, { x: SPR_OX, y: SPR_OY }, side, color, type, kk, flip)); SPR.set(key, c); }
  x.drawImage(c, t.x - SPR_OX, t.y - SPR_OY, SPR_W, SPR_H);
}
function figureRaw(x, t, side, color, type, k, flip) {
  const s = flip ? -1 : 1;
  const dark = mix(color, '#000000', 0.3);
  x.save(); x.translate(t.x, t.y); x.scale(s * 1.75, 1.75);
  x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(0, 4.5, type === 'cav' ? 9 : 4, 1.8, 0, 0, 7); x.fill();
  if (type === 'cav') {
    const horse = k % 3 === 0 ? '#4a3220' : k % 3 === 1 ? '#6b4a2b' : '#2f2218';
    x.fillStyle = horse; x.beginPath(); x.ellipse(0, 2, 8.5, 3.8, 0, 0, 7); x.fill();
    x.beginPath(); x.moveTo(6, -1); x.lineTo(10.5, -5); x.lineTo(11, 1); x.lineTo(7, 3); x.fill();
    x.strokeStyle = horse; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(-5, 5); x.lineTo(-6, 9 + (k % 2)); x.moveTo(5, 5); x.lineTo(6, 9 - (k % 2)); x.moveTo(-3, 5); x.lineTo(-2, 9 - (k % 2)); x.moveTo(3, 5); x.lineTo(2, 9 + (k % 2)); x.stroke();
    x.strokeStyle = '#1d1510'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-8, 1); x.quadraticCurveTo(-11, 4, -9, 8); x.stroke();
    x.fillStyle = color; x.fillRect(-2.2, -7, 4.4, 7); x.fillStyle = dark; x.fillRect(-2.2, -7, 1.4, 7);
    x.fillStyle = '#9a9a9a'; x.beginPath(); x.arc(0, -9, 2.2, 0, 7); x.fill();
    x.strokeStyle = '#2a1d12'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-3, -4); x.lineTo(15, -11); x.stroke();
    x.fillStyle = color; x.beginPath(); x.moveTo(13, -10.5); x.lineTo(17, -12.5); x.lineTo(14, -8.5); x.fill();
  } else {
    const robe = type === 'militia' ? '#8a6a42' : color;
    x.fillStyle = robe; x.fillRect(-2.4, -4, 4.8, 8.5); x.fillStyle = mix(robe, '#000', 0.25); x.fillRect(-2.4, -4, 1.5, 8.5);
    x.fillStyle = type === 'militia' ? '#e7c9a3' : '#9a9a9a'; x.beginPath(); x.arc(0, -6.2, 2.2, 0, 7); x.fill();
    x.strokeStyle = '#2a1d12'; x.lineWidth = 1.1;
    if (type === 'foot') { x.fillStyle = dark; x.beginPath(); x.arc(3.2, 0, 3.6, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#d9c9a3'; x.beginPath(); x.arc(3.2, 0, 1.1, 0, 7); x.fill(); x.beginPath(); x.moveTo(-1, 4); x.lineTo(5, -13); x.stroke(); x.fillStyle = '#9a9a9a'; x.beginPath(); x.moveTo(4.6, -12); x.lineTo(5.6, -15.5); x.lineTo(6.4, -12); x.fill(); }
    else if (type === 'bow') { x.beginPath(); x.arc(2.5, -2, 5, -1.2, 1.2); x.stroke(); x.beginPath(); x.moveTo(4.3, -6.6); x.lineTo(4.3, 2.6); x.stroke(); x.fillStyle = '#6b4a2b'; x.fillRect(-4, -4, 1.6, 7); }
    else { x.beginPath(); x.moveTo(-1, 4); x.lineTo(3, -11); x.moveTo(1.5, -11); x.lineTo(4.5, -11); x.stroke(); }
  }
  x.restore();
}
function drawCastle(x, V) {
  const B = V.B, lv = V.cfg.castleLv || 1, ruined = V.cfg.ruined, intact = (V.walls || 0) / 100;
  x.fillStyle = '#a0957e'; x.fillRect(WALLX + 14, 0, BW_ - WALLX, BH_);
  x.fillStyle = '#8f856f'; for (let i = 0; i < 60; i++) x.fillRect(WALLX + 30 + (i * 37) % 290, (i * 53) % BH_, 22, 11);
  // keep
  x.fillStyle = '#6f685a'; x.fillRect(876, 176, 98, 188); x.fillStyle = '#857d6b'; x.fillRect(880, 180, 90, 180);
  x.fillStyle = '#6f685a'; for (let i = 0; i < 6; i++) x.fillRect(880 + i * 16, 168, 9, 12);
  x.fillStyle = '#3a3226'; x.fillRect(916, 240, 18, 30); x.fillRect(896, 210, 8, 14); x.fillRect(946, 210, 8, 14);
  if (V.cfg.moat) { x.fillStyle = '#4f7f8a'; x.fillRect(WALLX - 52, 0, 34, BH_); x.strokeStyle = '#8fb5bb'; x.lineWidth = 1.2; for (let y = 10; y < BH_; y += 26) { x.beginPath(); x.moveTo(WALLX - 46, y + Math.sin(B.t * 2 + y) * 2); x.quadraticCurveTo(WALLX - 36, y - 5, WALLX - 26, y); x.stroke(); } }
  const thick = lv === 1 ? 10 : lv === 2 ? 16 : 24;
  const segs = 14;
  for (let i = 0; i < segs; i++) {
    const y0 = i * BH_ / segs, h = BH_ / segs + 1;
    const broken = ruined || V.bg.gaps[i] > intact;
    if (broken) { x.fillStyle = lv === 1 ? '#5a3f26' : '#6f6656'; for (let k = 0; k < 7; k++) x.fillRect(WALLX - 10 + ((k * 13 + i * 7) % 30), y0 + ((k * 17) % h), 6, 5); continue; }
    if (lv === 1) { x.fillStyle = '#7a5530'; for (let k = 0; k < 4; k++) { const sx = WALLX + 1 + (k % 2) * 4, sy = y0 + k * h / 4; x.fillRect(sx, sy, thick, h / 4 - 1); x.beginPath(); x.moveTo(sx - 3, sy + h / 8); x.lineTo(sx, sy); x.lineTo(sx, sy + h / 4); x.fill(); } }
    else { x.fillStyle = lv === 3 ? '#aba48d' : '#b5ab95'; x.fillRect(WALLX, y0, thick, h); x.fillStyle = '#8b816c'; x.fillRect(WALLX - 4, y0 + 4, 4, 10); x.strokeStyle = '#7d7462'; x.lineWidth = 1; x.strokeRect(WALLX + .5, y0 + .5, thick - 1, h - 1); x.fillStyle = '#9d947f'; x.fillRect(WALLX + 2, y0 + h / 2, thick - 4, 1); }
  }
  if (!ruined && lv > 1) for (const ty of [60, 270, 480]) { const r = lv === 3 ? 28 : 22; x.fillStyle = '#aba48d'; x.beginPath(); x.arc(WALLX + thick / 2, ty, r, 0, 7); x.fill(); x.strokeStyle = '#5c5444'; x.lineWidth = 2; x.stroke(); x.fillStyle = '#8b816c'; for (let a = 0; a < 6.28; a += 0.8) x.fillRect(WALLX + thick / 2 + Math.cos(a) * (r - 4) - 2, ty + Math.sin(a) * (r - 4) - 2, 4, 4); }
  if (B.cats && !ruined) [60, 270, 480].slice(0, Math.min(3, B.cats)).forEach((ty, i) => { x.save(); x.translate(WALLX + thick / 2, ty); x.fillStyle = '#5a3e24'; x.fillRect(-9, -5, 18, 10); x.strokeStyle = '#3a2817'; x.lineWidth = 3; const a = -2.4 + Math.sin(B.t * 2 + i) * 0.5; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * 16, Math.sin(a) * 16); x.stroke(); x.restore(); });
}
function drawBanner(x, fid, px, py, h, flip, t) {
  x.strokeStyle = '#2a1d12'; x.lineWidth = 3; x.beginPath(); x.moveTo(px, py + h); x.lineTo(px, py - 4); x.stroke();
  x.fillStyle = '#e2b33c'; x.beginPath(); x.arc(px, py - 6, 3.5, 0, 7); x.fill();
  const spr = armsSprite(fid), w = 30, hh = 36, bx = flip ? px - w - 1 : px + 1;
  x.save(); x.translate(bx + w / 2, py); x.rotate(Math.sin((t || 0) * 3) * 0.04); x.translate(-(bx + w / 2), -py);
  if (spr) x.drawImage(spr, bx, py, w, hh); else { x.fillStyle = '#ccc'; x.fillRect(bx, py, w, hh); }
  x.strokeStyle = '#2a1d12'; x.lineWidth = 1; x.beginPath(); x.moveTo(bx - 2, py); x.lineTo(bx + w + 2, py); x.stroke();
  x.restore();
}
function drawGround(x, V) {
  const B = V.B, bg = V.bg;
  const gr = x.createLinearGradient(0, 0, 0, BH_); gr.addColorStop(0, '#8a9a52'); gr.addColorStop(1, '#6f8040');
  x.fillStyle = gr; x.fillRect(0, 0, BW_, BH_);
  for (const [px_, py_, r, v] of bg.patches) { x.fillStyle = v < .5 ? 'rgba(60,80,30,.16)' : 'rgba(150,150,80,.14)'; x.beginPath(); x.ellipse(px_, py_, r, r * 0.5, 0, 0, 7); x.fill(); }
  // a cart track across the field
  x.strokeStyle = 'rgba(110,90,50,.22)'; x.lineWidth = 10; x.beginPath(); x.moveTo(0, bg.road); x.bezierCurveTo(300, bg.road + 40, 600, bg.road - 40, B.castle ? WALLX - 20 : BW_, bg.road + 10); x.stroke();
  x.strokeStyle = 'rgba(70,90,35,.5)'; x.lineWidth = 1;
  x.beginPath();
  for (const [tx, ty, v] of bg.tufts) { if (B.castle && tx > WALLX - 60) continue; x.moveTo(tx, ty); x.lineTo(tx - 2, ty - 5); x.moveTo(tx, ty); x.lineTo(tx + 2 + v, ty - 4); }
  x.stroke();
  for (const [tx, ty, r, v] of bg.trees) { if (B.castle && tx > WALLX - 60) continue; x.fillStyle = 'rgba(0,0,0,.15)'; x.beginPath(); x.ellipse(tx + 3, ty + r * 0.8, r, r * 0.45, 0, 0, 7); x.fill(); x.fillStyle = v < .5 ? '#3e4f25' : '#46582a'; x.beginPath(); x.arc(tx, ty, r, 0, 7); x.fill(); x.fillStyle = '#546a33'; x.beginPath(); x.arc(tx - 3, ty - 3, r * 0.6, 0, 7); x.fill(); }
}
function drawBattle(V) {
  const x = V.ctx, B = V.B;
  x.drawImage(V.ground, 0, 0, BW_, BH_);
  if (B.castle) drawCastle(x, V);
  // new bodies are added to the layer of the fallen; the old ones are never redrawn
  const cx = V.corpX;
  while (V.corpN < B.corpses.length) { const c = B.corpses[V.corpN++]; cx.save(); cx.translate(c.x, c.y); cx.rotate(c.r); cx.fillStyle = V.colors[c.s]; cx.fillRect(-5, -2, 10, 4); cx.fillStyle = '#3a2b1b'; cx.fillRect(5, -2, 3, 4); cx.restore(); }
  x.globalAlpha = 0.55; x.drawImage(V.corpC, 0, 0, BW_, BH_); x.globalAlpha = 1;
  for (const d of V.dust) { x.fillStyle = `rgba(170,150,100,${0.35 * (1 - d.t)})`; x.beginPath(); x.arc(d.x, d.y - d.t * 8, d.r + d.t * 10, 0, 7); x.fill(); }
  const time = B.t;
  for (const q of B.sq) {
    if (q.n < 0.05) continue;
    const count = clamp(Math.round(q.n * 3), 2, 12), cols = 3;
    const color = V.colors[q.s];
    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const bob = q.moving ? Math.sin(time * 10 + i + q.hy) * 1.4 : Math.sin(time * 3 + i) * 0.4;
      const fx = q.x + (q.s === 0 ? -1 : 1) * r * (q.t === 'cav' ? 26 : 15) + (r % 2) * 4, fy = q.y + (c - (cols - 1) / 2) * (q.t === 'cav' ? 19 : 15) + bob;
      figure(x, { x: fx, y: fy }, q.s, color, q.t, i + Math.floor(time * 6), q.s === 1);
    }
  }
  for (const s of [0, 1]) {
    const qs = B.sq.filter(q => q.s === s && q.n > 0.05 && (q.role === 'line' || q.role === 'wall'));
    if (!qs.length) continue;
    const mx = qs.reduce((a, q) => a + q.x, 0) / qs.length + (s === 0 ? -40 : 40);
    drawBanner(x, V.fids[s], mx, 226, 74, s === 1, time + s);
  }
  if (B.castle) drawBanner(x, V.fids[1], 926, 96, 84, true, time);
  x.strokeStyle = '#2a1d12'; x.lineWidth = 1.3;
  x.beginPath();
  for (const a of B.arrows) { const t = a.t, ax = a.x + (a.tx - a.x) * t, ay = a.y + (a.ty - a.y) * t - Math.sin(t * Math.PI) * 40; const t2 = Math.max(0, t - .05), bx = a.x + (a.tx - a.x) * t2, by = a.y + (a.ty - a.y) * t2 - Math.sin(t2 * Math.PI) * 40; x.moveTo(bx, by); x.lineTo(ax, ay); }
  x.stroke();
  for (const s of B.stones) if (s.tx !== undefined) { const t = s.t, sx = s.x + (s.tx - s.x) * t, sy = s.y + (s.ty - s.y) * t - Math.sin(t * Math.PI) * 120; x.fillStyle = 'rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(sx, s.y + (s.ty - s.y) * t + 4, 6, 2.5, 0, 0, 7); x.fill(); x.fillStyle = '#4a4338'; x.beginPath(); x.arc(sx, sy, 5.5, 0, 7); x.fill(); x.fillStyle = '#6a6358'; x.beginPath(); x.arc(sx - 1.5, sy - 1.5, 2, 0, 7); x.fill(); }
  for (const f of B.fx) if (f.k === 'charge') { x.fillStyle = `rgba(160,130,80,${0.45 * (1 - f.t / 1.5)})`; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(B.front[1 - f.s] + (f.s === 0 ? 70 : -70), 150 + i * 60, 18 + f.t * 40, 0, 7); x.fill(); } }
  if ((B.contact || B.wing[0].s === 'fight') && !B.done) {
    x.strokeStyle = '#ffe9a0'; x.lineWidth = 1.6;
    const spots = [];
    if (B.contact) for (let i = 0; i < 6; i++) spots.push([B.castle ? WALLX - 8 : (B.front[0] + B.front[1]) / 2, 160 + Math.random() * 220]);
    if (B.wing[0].s === 'fight') spots.push([(B.front[0] + B.front[1]) / 2, 75 + Math.random() * 10], [(B.front[0] + B.front[1]) / 2, 460 + Math.random() * 10]);
    for (const [sx, sy] of spots) { x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + (Math.random() - .5) * 16, sy + (Math.random() - .5) * 16); x.stroke(); }
  }
  if (B.done) { x.fillStyle = B.win === 0 ? 'rgba(226,179,60,.12)' : 'rgba(80,20,10,.22)'; x.fillRect(0, 0, BW_, BH_); }
  x.drawImage(V.vig, 0, 0, BW_, BH_);
}
function bvFinish() {
  const V = BV; BV = null; V.dead = true;
  const res = battleResult(V.B), why = V.B.why;
  releaseScene(V);
  finishBattle(V, res, why);
}
function finishBattle(V, res, why) {
  const p = V.p; tutorDid('battle');
  if (V.kind === 'relief') resolveRelief(me(), V.army, p, res, V.cfg); else resolveAssault(me(), V.army, p, res, V.cfg);
  if (res.won && V.kind !== 'relief') setTimeout(() => flashProv(p.id), 300);
  sfx(res.won ? 'victory' : 'defeat'); buzz(res.won ? 50 : 80);
  const head = res.won ? (V.kind === 'relief' ? `The siege of ${p.name} is broken!` : `${p.name} is yours!`) : (why === 'retreat' ? 'You sound the retreat' : why === 'time' ? 'The attack stalls and your men fall back' : 'Your army is beaten');
  const foe = V.names[1].charAt(0).toUpperCase() + V.names[1].slice(1);
  const body = `Your losses: ${lossStr(V.a0, res.A)}. ${foe} lost ${lossStr(V.d0, res.D)}.`;
  note(head + ' ' + body);
  const row = (name, before, after) => `<tr><td>${name}</td><td>${uStr(before, true, false)}</td><td>${uStr(after, true, false)}</td></tr>`;
  showModal(`<div class="rep${res.won ? '' : ' badrep'}"><div class="sealmark">${ico(res.won ? 'star' : 'swords')}</div><h2>${head}</h2><p>${body}</p>
    <table class="stat"><tr><th></th><th>Before</th><th>After</th></tr>${row(V.names[0], V.a0, res.A)}${row(V.names[1], V.d0, res.D)}</table>
    <div class="row ctr"><button class="btn gold big" onclick="closeModal();save();render();showReports()">Continue</button></div></div>`);
}
