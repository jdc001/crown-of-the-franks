'use strict';
// ================= BATTLE MODEL =================
// Each company has attack and hit points (UNIT in data.js). Damage per second = attack x K.
// Phases: the lines advance under arrows (and stones from castle catapults); the horse fight
// on the wings; the winning horse ride round and roll up the enemy from the rear; the centre
// grinds until one side's morale breaks.
const BW_ = 1000, BH_ = 540, WALLX = 700;
const K = 0.18, KR = 0.12, KC = 0.6;
const ST = {
  militia: { atk: LEVY.atk, hp: LEVY.hp },
  foot: { atk: UNIT.foot.atk, hp: UNIT.foot.hp },
  bow: { atk: UNIT.bow.atk, rng: UNIT.bow.rng, hp: UNIT.bow.hp },
  cav: { atk: UNIT.cav.atk, chg: UNIT.cav.chg, hp: UNIT.cav.hp },
};
const STANCE = {
  aggressive: { n: 'Aggressive', atk: 1.15, hp: .85, rout: .27, spd: 1.2, chg: 1.15, wait: 0,
    d: 'Footmen advance as a deep line (+10% attack) and the horse charge early. Hits harder and fights on longer, but loses more men.' },
  balanced: { n: 'Balanced', atk: 1, hp: 1, rout: .32, spd: 1, chg: 1, wait: 2,
    d: 'Advance in good order and work around the flanks. Outmanoeuvres a static shield wall.' },
  defensive: { n: 'Defensive', atk: .88, hp: 1.2, rout: .40, spd: .65, chg: .85, wait: 5,
    d: 'Footmen lock a shield wall: arrows do 30% less and cavalry strike it far weaker. Archers shoot longer. Withdraws sooner to save men.' },
};
function bRand(a, b) { return a + Math.random() * (b - a); }
const SIDE_T = ['militia', 'foot', 'bow', 'cav'];

function makeBattle(cfg) {
  const B = { cfg, t: 0, done: false, win: null, why: '', castle: !!cfg.castle, lvl: cfg.castle ? (cfg.wallLvl || 0) : 0, clv: cfg.castleLv || 0, moat: !!cfg.moat,
    st: [STANCE[cfg.aSt || 'balanced'], STANCE[cfg.dSt || 'balanced']], gen: [cfg.aGen || {}, cfg.dGen || {}], mod: [cfg.aMod || 0, cfg.dMod || 0],
    bon: [cfg.aBon || { atk: 0, hp: 0, cav: 0 }, cfg.dBon || { atk: 0, hp: 0, cav: 0 }],
    fort: [bRand(.8, 1.2), bRand(.8, 1.2)], u: [{}, {}], u0: [{}, {}], n0: [0, 0], cats: cfg.castle ? (cfg.D.cat || 0) : 0,
    front: [0, 0], contact: false, wing: [{ s: 'hold', t: 0 }, { s: 'hold', t: 0 }], flanked: [false, false],
    sq: [], fx: [], arrows: [], stones: [], corpses: [], clash: 0, volley: 0, lastN: [0, 0],
    res: [null, null], boost: [0, 0], manual: [!!cfg.manualA, false], ordered: [false, false], status: ['', ''] };
  for (const s of [0, 1]) {
    const U = s === 0 ? cfg.A : cfg.D;
    for (const t of SIDE_T) { B.u[s][t] = U[t] || 0; B.u0[s][t] = U[t] || 0; }
    B.n0[s] = SIDE_T.reduce((a, t) => a + B.u[s][t], 0);
    // a reserve holds back a third of the foot and bowmen
    const wantRes = s === 0 ? cfg.aRes : cfg.dRes;
    if (wantRes && B.n0[s] >= 9 && (B.u[s].foot + B.u[s].bow) >= 3) {
      const r = { foot: Math.floor(B.u[s].foot / 3), bow: Math.floor(B.u[s].bow / 3) };
      B.u[s].foot -= r.foot; B.u[s].bow -= r.bow; B.res[s] = r;
    }
  }
  B.front = B.castle ? [190, WALLX + 22] : [230, 770];
  B.lastN = [...B.n0];
  if (B.castle) { B.wing = [{ s: 'none', t: 0 }, { s: 'none', t: 0 }]; }
  deploy(B, 0); deploy(B, 1);
  if (!B.n0[0] || !B.n0[1]) { B.done = true; B.win = B.n0[1] ? 1 : 0; B.why = 'none'; }
  return B;
}
const resN = (B, s) => B.res[s] ? (B.res[s].foot + B.res[s].bow) : 0;
const sideN = (B, s) => SIDE_T.reduce((a, t) => a + B.u[s][t], 0) + resN(B, s) * 0.85;
const sideAll = (B, s) => SIDE_T.reduce((a, t) => a + B.u[s][t], 0) + resN(B, s);
const gap = B => B.front[1] - B.front[0];
const shieldWall = (B, s) => B.st[s] === STANCE.defensive && B.u[s].foot > 0;
function atkM(B, s, t) {
  const g = B.gen[s], bn = B.bon[s];
  let m = B.st[s].atk * (1 + (g.atk || 0) + bn.atk) * (1 + 0.12 * B.mod[s]) * B.fort[s];
  if (B.boost[s] > B.t) m *= 1.15;
  const k = t === 'militia' ? 'foot' : t;
  m *= 1 + (g[k] || 0) * (t === 'militia' ? 0.5 : 1);
  if (t === 'cav') m *= 1 + bn.cav;
  if (t === 'foot' && B.st[s] === STANCE.aggressive) m *= 1.1;
  if (B.castle && s === 1 && B.lvl > 0) m *= 1 + 0.1 * B.lvl;
  if (B.castle && s === 0 && t === 'cav') m *= 0.6;
  if (B.castle && s === 0 && B.moat) m *= 0.8;
  if (!B.castle && B.st[s] === STANCE.balanced && B.st[1 - s] === STANCE.defensive) m *= 1.08;
  return m;
}
function hpM(B, s, t, vs) {
  const g = B.gen[s];
  let h = ST[t].hp * B.st[s].hp * (1 + (g.def || 0) + B.bon[s].hp);
  if (B.castle && s === 1) h *= 1 + 0.3 * B.lvl;
  if (t === 'foot' && shieldWall(B, s) && (vs === 'cav' || vs === 'arrow')) h *= vs === 'cav' ? 1.6 : 1.43;
  return h;
}
// spread damage (in hit points) over a side by exposure
function inflict(B, s, dmg, w, vs) {
  let tw = 0; const ww = {};
  for (const t of SIDE_T) { ww[t] = B.u[s][t] * (w[t] || 0); tw += ww[t]; }
  if (tw <= 0) return;
  for (const t of SIDE_T) if (ww[t] > 0) B.u[s][t] = Math.max(0, B.u[s][t] - dmg * ww[t] / tw / hpM(B, s, t, vs));
}
const W_CENTRE = { militia: 1.2, foot: 1, bow: 0.35, cav: 0 };
const W_ARROW = { militia: 1.2, foot: 1, bow: 0.8, cav: 0.6 };
const W_REAR = { militia: 1.2, foot: 1, bow: 1.6, cav: 0 };
const W_RAID = { militia: 0.25, foot: 0.25, bow: 3, cav: 0 };
function battleStep(B, dt) {
  if (B.done) return;
  B.t += dt;
  const noise = () => bRand(.85, 1.15);
  const g = gap(B);
  // --- approach ---
  if (!B.contact) {
    const sp = [0, 1].map(s => {
      const st = B.st[s];
      if (B.castle && s === 1) return 0;
      if (s === 1 && st === STANCE.defensive) return 0;
      if (B.t < st.wait) return 0;
      let v = 32 * st.spd * (s === 1 ? 0.6 : 1);
      if (B.castle && B.moat && s === 0 && B.front[0] > WALLX - 150) v *= 0.5;
      return v;
    });
    B.front[0] += sp[0] * dt; B.front[1] -= sp[1] * dt;
    if (gap(B) <= 22) { B.contact = true; B.fx.push({ k: 'clash', t: 0 }); for (const s of [0, 1]) if (B.res[s] && !B.manual[s]) commitReserve(B, s); }
  }
  // --- missiles ---
  const inRange = B.castle ? B.front[0] > WALLX - 330 : g <= 300;
  if (inRange) {
    for (const s of [0, 1]) {
      const o = 1 - s, bows = B.u[s].bow + (B.res[s] ? B.res[s].bow : 0);
      if (!bows) continue;
      let dm = bows * ST.bow.rng * KR * atkM(B, s, 'bow') * dt * noise() * (B.contact ? 0.5 : 1) * (B.st[s] === STANCE.defensive ? 1.2 : 1);
      if (B.castle && s === 0 && B.lvl > 0) dm *= 0.55;
      if (B.castle && s === 1) dm *= 1.2;
      inflict(B, o, dm, W_ARROW, 'arrow');
      B.volley += bows * dt;
    }
  }
  if (B.cats && B.front[0] > WALLX - 460) {
    inflict(B, 0, B.cats * UNIT.cat.rng * KR * dt * noise() * (B.contact ? 0.3 : 1), W_ARROW, 'stone');
    if (Math.random() < B.cats * dt * 0.5) B.stones.push({ t: 0 });
  }
  // --- the horse on the wings ---
  if (!B.castle) {
    for (const s of [0, 1]) { const w = B.wing[s]; if ((w.s === 'ride') && (w.t -= dt) <= 0) { w.s = 'flank'; flankCharge(B, s); } }
    const ride = g <= (B.st[0] === STANCE.aggressive || B.st[1] === STANCE.aggressive ? 260 : 200);
    if (ride && B.wing[0].s === 'hold' && B.wing[1].s === 'hold') {
      const c0 = B.u[0].cav > 0.05, c1 = B.u[1].cav > 0.05;
      if (c0 && c1) startFight(B, 0, 1, 1, 1);
      else if (c0 || c1) { const s = c0 ? 0 : 1; B.wing[s] = { s: 'ride', t: 3.5 }; B.wing[1 - s].s = 'none'; }
      else { B.wing[0].s = B.wing[1].s = 'none'; }
    }
    // a raid on the archers: horse ride among the bowmen, who shoot back
    for (const s of [0, 1]) {
      if (B.wing[s].s !== 'raid' || B.u[s].cav <= 0.05) { if (B.wing[s].s === 'raid') B.wing[s].s = 'broken'; continue; }
      const o = 1 - s;
      const d = B.u[s].cav * ST.cav.atk * K * atkM(B, s, 'cav') * 1.3 * dt * noise();
      inflict(B, o, d, W_RAID, 'cav');
      const back = (B.u[o].bow * ST.bow.atk * 2.2 * atkM(B, o, 'bow') + B.u[o].foot * ST.foot.atk * atkM(B, o, 'foot') * 0.25) * K * dt * noise();
      B.u[s].cav = Math.max(0, B.u[s].cav - back / hpM(B, s, 'cav'));
      B.clash += dt;
      if (B.u[o].bow < 0.3) B.wing[s] = { s: 'ride', t: 2 };
    }
    if (B.wing[0].s === 'fight') {
      const d0 = B.u[0].cav * ST.cav.atk * K * atkM(B, 0, 'cav') * dt * noise(), d1 = B.u[1].cav * ST.cav.atk * K * atkM(B, 1, 'cav') * dt * noise();
      B.u[1].cav = Math.max(0, B.u[1].cav - d0 / hpM(B, 1, 'cav')); B.u[0].cav = Math.max(0, B.u[0].cav - d1 / hpM(B, 0, 'cav'));
      B.clash += dt;
      const r0 = B.u[0].cav / Math.max(0.01, B.cav0[0]), r1 = B.u[1].cav / Math.max(0.01, B.cav0[1]);
      if (r0 < 0.35 || r1 < 0.35) {
        const lose = r0 < r1 ? 0 : 1;
        B.wing[lose].s = 'broken'; B.wing[1 - lose] = { s: 'ride', t: 3 };
      }
    }
  }
  // --- the centre ---
  if (B.contact) {
    const out = [0, 1].map(s => {
      let m = (B.u[s].militia * ST.militia.atk * atkM(B, s, 'militia') + B.u[s].foot * ST.foot.atk * atkM(B, s, 'foot') + B.u[s].bow * ST.bow.atk * 0.3 * atkM(B, s, 'bow')) * K;
      const ws = B.wing[s].s;
      if (B.castle || ws === 'none' && B.u[s].cav > 0 && B.u[s].foot + B.u[s].militia < 0.5) m += B.u[s].cav * ST.cav.atk * K * atkM(B, s, 'cav');
      if (B.castle && s === 0 && B.lvl > 0) m *= Math.min(1, 14 / Math.max(1, sideN(B, 0))) * 0.9 + 0.1;
      return m * noise();
    });
    inflict(B, 1, out[0] * dt, B.castle ? { ...W_CENTRE, cav: 0.7 } : W_CENTRE, 'melee');
    inflict(B, 0, out[1] * dt, B.castle ? { ...W_CENTRE, cav: 0.7 } : W_CENTRE, 'melee');
    B.clash += dt;
  }
  // --- horse in the enemy rear ---
  for (const s of [0, 1]) {
    if (B.wing[s].s !== 'flank' || !B.u[s].cav) continue;
    const o = 1 - s;
    const d = B.u[s].cav * ST.cav.atk * K * atkM(B, s, 'cav') * 1.6 * dt * noise();
    inflict(B, o, d, W_REAR, 'cav');
    // the infantry turn their spears on the horsemen behind them
    const back = (B.u[o].foot * ST.foot.atk * atkM(B, o, 'foot') + B.u[o].militia * ST.militia.atk * atkM(B, o, 'militia')) * K * (shieldWall(B, o) ? 0.9 : 0.5) * (B.contact ? 0.6 : 1) * dt * noise();
    B.u[s].cav = Math.max(0, B.u[s].cav - back / hpM(B, s, 'cav'));
    B.clash += dt;
  }
  // --- morale ---
  const r = [sideN(B, 0) / B.n0[0], sideN(B, 1) / B.n0[1]];
  const rout = [0, 1].map(s => (B.castle && s === 1) ? 0.05 : Math.max(0.1, B.st[s].rout - (B.gen[s].morale || 0) + (B.flanked[s] ? 0.1 : 0)));
  for (const s of [0, 1]) if (B.res[s] && B.manual[s] && r[s] < rout[s] + 0.12) commitReserve(B, s);
  const broke = [r[0] < rout[0], r[1] < rout[1]];
  if (broke[0] || broke[1]) {
    const loser = broke[0] && broke[1] ? (r[0] - rout[0] < r[1] - rout[1] ? 0 : 1) : (broke[0] ? 0 : 1);
    endBattle(B, 1 - loser, 'rout');
  } else if (B.t > 170) endBattle(B, 1, 'time');
}
function flankCharge(B, s) {
  const o = 1 - s;
  B.flanked[o] = true;
  let imp = B.u[s].cav * ST.cav.chg * KC * atkM(B, s, 'cav') * B.st[s].chg;
  inflict(B, o, imp, W_REAR, 'cav');
  B.fx.push({ k: 'charge', s, t: 0 });
}
function endBattle(B, winner, why) {
  B.done = true; B.win = winner; B.why = why;
  const loser = 1 - winner;
  const winTot = sideN(B, winner) || 1;
  let extra;
  if (B.castle && loser === 1) extra = 1;
  else if (why === 'retreat' || why === 'time') extra = 0.08;
  else extra = 0.12 + 0.25 * Math.min(1, B.u[winner].cav / winTot * 2);
  if (B.res[loser]) extra *= 0.5;
  for (const t of SIDE_T) B.u[loser][t] *= (1 - extra);
  for (const s of [0, 1]) if (B.res[s]) { B.u[s].foot += B.res[s].foot; B.u[s].bow += B.res[s].bow; B.res[s] = null; }
}
function commitReserve(B, s) {
  const r = B.res[s]; if (!r || B.done) return false;
  B.u[s].foot += r.foot; B.u[s].bow += r.bow; B.res[s] = null;
  B.boost[s] = B.t + 10; B.fx.push({ k: 'reserve', s, t: 0 });
  B.status[s] = 'The reserve comes up';
  return true;
}
// every cavalry charge comes through here. s charges o; m scales s's impact, oc scales o's answer.
function startFight(B, s, o, oc, m) {
  B.wing[s].s = B.wing[o].s = 'fight';
  const i0 = B.u[s].cav * ST.cav.chg * KC * atkM(B, s, 'cav') * B.st[s].chg * m, i1 = B.u[o].cav * ST.cav.chg * KC * atkM(B, o, 'cav') * B.st[o].chg * oc;
  B.u[o].cav = Math.max(0, B.u[o].cav - i0 * 0.5 / hpM(B, o, 'cav')); B.u[s].cav = Math.max(0, B.u[s].cav - i1 * 0.5 / hpM(B, s, 'cav'));
  B.cav0 = [0, 0]; B.cav0[s] = B.u[s].cav; B.cav0[o] = B.u[o].cav;
}
// the player's horse orders, only while they still hold
function orderCav(B, s, kind) {
  if (B.done || B.castle || B.wing[s].s !== 'hold' || B.u[s].cav <= 0.05) return false;
  const o = 1 - s, oHold = B.wing[o].s === 'hold' && B.u[o].cav > 0.05;
  B.ordered[s] = true;
  if (kind === 'wing') {
    if (oHold) startFight(B, s, o, B.manual[o] ? 0.6 : 1, 1);
    else { B.wing[s] = { s: 'ride', t: 3.5 }; B.wing[o].s = 'none'; }
    B.status[s] = oHold ? 'The horse charge the enemy horse' : 'The horse ride for the flank';
  } else if (kind === 'archers') {
    if (oHold) { startFight(B, o, s, 0.7, 1); B.status[s] = 'Intercepted by the enemy horse!'; }
    else { B.wing[s] = { s: 'raid', t: 0 }; B.wing[o].s = 'none'; B.status[s] = 'The horse ride down the bowmen'; }
  } else if (kind === 'rear') {
    if (oHold) { startFight(B, o, s, 0.7, 1.2); B.status[s] = 'Intercepted by the enemy horse!'; }
    else { B.wing[s] = { s: 'ride', t: 3 }; B.wing[o].s = 'none'; B.status[s] = 'The horse ride round to the rear'; }
  }
  return true;
}
function battleResult(B) {
  const out = [0, 1].map(s => { const o = {}; for (const t of SIDE_T) o[t] = Math.floor(B.u[s][t] + 0.45); return o; });
  return { won: B.win === 0, A: out[0], D: out[1], why: B.why };
}
function runBattle(cfg) {
  const B = makeBattle({ ...cfg, manualA: false });
  let guard = 0;
  while (!B.done && guard++ < 1000) battleStep(B, 0.25);
  if (!B.done) endBattle(B, 1, 'time');
  return battleResult(B);
}
// the odds shown on buttons are re-asked on every redraw; the same battle gets the same answer from a small cache
const EWC = new Map();
function estimateWin(cfg, n = 40) {
  const key = n + JSON.stringify(cfg);
  if (EWC.has(key)) return EWC.get(key);
  let w = 0;
  for (let i = 0; i < n; i++) if (runBattle(cfg).won) w++;
  const v = Math.round(w / n * 100);
  if (EWC.size > 300) EWC.clear();
  EWC.set(key, v); return v;
}
function autoStance(myPow, theirPow, defending, castle) {
  if (defending && castle) return 'defensive';
  const r = myPow / Math.max(1, theirPow);
  if (r > 1.5) return 'aggressive';
  if (r < 0.85) return 'defensive';
  return 'balanced';
}

// ================= VISUAL FORMATIONS =================
// Each squad keeps its place in the formation relative to its side's front line.
function deploy(B, s) {
  const U = B.u0[s];
  const add = (t, n, role, dx, y) => { if (n > 0) B.sq.push({ s, t, role, n0: n, n, dx, y, hy: y, x: (s === 0 ? B.front[0] - dx : B.front[1] + dx), jx: bRand(-4, 4) }); };
  const split = n => { if (!n) return []; const size = Math.max(1, Math.ceil(n / 6)); const out = []; let left = n; while (left > 0) { const v = Math.min(size, left); out.push(v); left -= v; } return out; };
  const line = (arr, y0, y1) => arr.map((n, i) => [n, arr.length === 1 ? (y0 + y1) / 2 : y0 + (y1 - y0) * i / (arr.length - 1)]);
  const foot = split(U.foot), mil = split(U.militia), bow = split(U.bow), cav = split(U.cav);
  if (B.castle && s === 1) {
    line(bow, 90, 450).forEach(([n, y]) => add('bow', n, 'wall', -8, y));
    line(foot, 120, 420).forEach(([n, y]) => add('foot', n, 'line', 18, y));
    line(mil, 150, 390).forEach(([n, y]) => add('militia', n, 'rear', 70, y));
    line(cav, 200, 340).forEach(([n, y]) => add('cav', n, 'rear', 130, y));
    return;
  }
  line(foot, 160, 380).forEach(([n, y]) => add('foot', n, 'line', 0, y));
  if (B.res[s]) { const r = B.res[s]; if (r.foot) add('foot', r.foot, 'res', 150, 240); if (r.bow) add('bow', r.bow, 'res', 170, 300); }
  line(mil, 180, 360).forEach(([n, y]) => add('militia', n, 'rear', 46, y));
  line(bow, 150, 390).forEach(([n, y]) => add('bow', n, 'skirm', 0, y));
  if (B.castle) line(cav, 190, 350).forEach(([n, y]) => add('cav', n, 'rear', 95, y));
  else {
    const half = Math.ceil(cav.length / 2);
    line(cav.slice(0, half), 50, 100).forEach(([n, y]) => add('cav', n, 'wingT', 10, y));
    line(cav.slice(half), 440, 490).forEach(([n, y]) => add('cav', n, 'wingB', 10, y));
  }
}
function animateSquads(B, dt) {
  const dir = s => s === 0 ? 1 : -1;
  const fr = s => B.front[s];
  const mid = (B.front[0] + B.front[1]) / 2;
  for (const q of B.sq) {
    if (q.role === 'res') { const r = B.res[q.s]; q.n = r ? r[q.t] : 0; if (!r) q.role = 'line'; }
    else { const line0 = Math.max(0.01, B.u0[q.s][q.t] - (B.res[q.s] ? (B.res[q.s][q.t] || 0) : 0)); q.n = q.n0 * Math.min(1, B.u[q.s][q.t] / line0); }
    const s = q.s, back = -dir(s);
    let tx, ty = q.hy, sp = 46;
    if (q.role === 'wall') tx = WALLX + 8;
    else if (q.role === 'line') tx = fr(s) + back * q.dx;
    else if (q.role === 'rear' || q.role === 'res') tx = fr(s) + back * q.dx;
    else if (q.role === 'skirm') {
      const defensive = B.st[s] === STANCE.defensive;
      const ahead = !defensive && !B.contact && gap(B) > 120;
      tx = fr(s) + (ahead ? dir(s) * 50 : back * 95);
      sp = 60;
    } else { // cavalry wings
      const w = B.wing[s], top = q.role === 'wingT';
      sp = 115;
      if (w.s === 'hold' || w.s === 'none') tx = fr(s) + back * 10;
      else if (w.s === 'fight') { tx = mid - dir(s) * 18 + q.jx; ty = top ? 75 : 465; }
      else if (w.s === 'ride') { tx = fr(1 - s) + dir(s) * 140; ty = top ? 110 : 430; }
      else if (w.s === 'raid') { tx = fr(1 - s) + dir(s) * 95 + q.jx; ty = top ? 190 + (q.hy - 50) : 350 + (q.hy - 440); }
      else if (w.s === 'flank') { tx = fr(1 - s) + dir(s) * 75 + q.jx; ty = top ? 200 + (q.hy - 50) : 340 + (q.hy - 440); }
      else if (w.s === 'broken') { tx = s === 0 ? -120 : BW_ + 120; ty = top ? 40 : 500; sp = 140; }
    }
    if (B.castle && s === 0 && B.lvl > 0) tx = Math.min(tx, WALLX - 14);
    if (B.castle && s === 0 && B.lvl === 0 && B.contact && (q.role === 'line')) tx = WALLX + 26 + q.jx;
    if (B.done && B.win !== s) { tx = s === 0 ? -120 : (B.castle ? q.x : BW_ + 120); sp = 120; }
    const dx = tx - q.x, dy = ty - q.y, d = Math.hypot(dx, dy);
    if (d > 0.5) { q.x += dx / d * Math.min(d, sp * dt); q.y += dy / d * Math.min(d, sp * dt); }
    q.moving = d > 3;
  }
  for (const s of [0, 1]) {
    const inR = B.castle ? B.front[0] > WALLX - 330 : gap(B) <= 300;
    if (inR && B.u[s].bow > 0 && Math.random() < B.u[s].bow * dt * 0.9) {
      const from = B.sq.filter(q => q.s === s && q.t === 'bow' && q.n > 0.05);
      const to = B.sq.filter(q => q.s !== s && q.n > 0.05);
      if (from.length && to.length) { const a = pick(from), b = pick(to); B.arrows.push({ x: a.x, y: a.y, tx: b.x + bRand(-16, 16), ty: b.y + bRand(-14, 14), t: 0 }); }
    }
    const n = sideN(B, s);
    while (B.lastN[s] - n > 0.34 && B.corpses.length < 320) {
      B.lastN[s] -= 0.34;
      const near = B.sq.filter(q => q.s === s && q.n > 0.05);
      const q = near.length ? pick(near) : null;
      if (q) B.corpses.push({ x: q.x + bRand(-14, 14), y: q.y + bRand(-12, 12), s, r: bRand(0, 6.28) });
    }
  }
  for (const st of B.stones) if (st.tx === undefined) { const tg = B.sq.filter(q => q.s === 0 && q.n > 0.05); const q = tg.length ? pick(tg) : { x: B.front[0], y: 270 }; st.x = WALLX + 30; st.y = pick([60, 270, 480]); st.tx = q.x + bRand(-20, 20); st.ty = q.y + bRand(-20, 20); }
  B.arrows.forEach(a => a.t += dt * 2.2); B.arrows = B.arrows.filter(a => a.t < 1);
  B.stones.forEach(a => a.t += dt * 0.9); B.stones = B.stones.filter(a => a.t < 1);
  B.fx.forEach(f => f.t += dt); B.fx = B.fx.filter(f => f.t < 1.5);
}
