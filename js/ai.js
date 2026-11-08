'use strict';
// ================= SHARED WAR RESOLUTION =================
const lossStr = (s0, s) => {
  const parts = FIGHT.filter(t => (s0[t] || 0) - (s[t] || 0) > 0).map(t => `${(s0[t] || 0) - (s[t] || 0)} ${LBL[t].toLowerCase()}`);
  return parts.length ? parts.join(', ') : 'nobody';
};
const ownerName = p => p.owner ? FAC(p.owner).name : p.lord;
function defGen(p) { if (!p.owner) return null; const g = genAt(p.owner, p.id); if (g) return g; for (const a of defArmies(p)) { const ag = armyGen(p.owner, a); if (ag) return ag; } return null; }
function defStance(p, attPow) { return p.b.castle ? 'defensive' : autoStance(power(defenders(p)), attPow, true, false); }
function assaultCfg(fid, A, p, aSt, dSt) {
  const aBon = { ...bonus(fid) };
  if (fid === 'denmark' && !adjTo(p, fid)) aBon.atk += 0.1;
  return { A: armySide(A), D: defenders(p), castle: !!p.b.castle, wallLvl: wallLvl(p), castleLv: castleLv(p), moat: !!(p.b.moat && !p.ruined), ruined: !!p.ruined,
    aSt, dSt: dSt || defStance(p, power(armySide(A))), aGen: armyGen(fid, A), dGen: defGen(p), aMod: mods(fid), dMod: mods(p.owner), aBon, dBon: bonus(p.owner), dRes: armySize(A) >= 9 && fighters(defenders(p)) >= 9 && !p.b.castle };
}
function resolveAssault(fid, A, p, res, cfg) {
  const prev = p.owner, prevAlly = p.ally;
  setArmy(A, res.A); applyDefLoss(p, cfg.D, res.D);
  A.acted = true; A.stormed = true; A.idle = 0;
  if (res.won) capture(p, fid);
  else if (armySize(A) === 0) loseArmy(fid, A, prev);
  return { prev, prevAlly };
}
function reliefCfg(fid, A, p, aSt) {
  const b = besieging(p), Bz = b.a;
  return { A: armySide(A), D: armySide(Bz), castle: false, aSt, dSt: autoStance(power(armySide(Bz)), power(armySide(A)), true, false),
    aGen: armyGen(fid, A), dGen: armyGen(b.fid, Bz), aMod: mods(fid), dMod: mods(b.fid), aBon: bonus(fid), dBon: bonus(b.fid), besieger: b.fid, bArmy: Bz.id, dRes: armySize(Bz) >= 9 };
}
function resolveRelief(fid, A, p, res, cfg) {
  const b = cfg.besieger, Bz = army(b, cfg.bArmy);
  setArmy(A, res.A); setArmy(Bz, res.D); A.acted = true; A.siege = null; A.idle = 0;
  if (res.won) { A.loc = p.id; if (armySize(Bz) === 0) loseArmy(b, Bz, fid); else { Bz.siege = null; Bz.loc = nearestHeld(b, p.id); } }
  else if (armySize(A) === 0) loseArmy(fid, A, b);
  else A.loc = nearestHeld(fid, p.id);
}
function aiStanceAtt(ap, dp, castle) { return castle ? (ap > dp * 1.8 ? 'aggressive' : 'balanced') : autoStance(ap, dp, false, false); }

// ================= COMPUTER PLAYERS =================
function pickW(w) { let t = 0; for (const k in w) t += w[k]; let r = Math.random() * t; for (const k in w) { r -= w[k]; if (r <= 0) return k; } return Object.keys(w)[0]; }
function buy(fid, t, target) { const c = unitCost(fid, t); const F = G.fac[fid]; if (F.gold < c) return false; F.gold -= c; target[t]++; return true; }
const armyPowA = (fid, a) => { const b = bonus(fid); return power(armySide(a)) * (1 + 0.12 * mods(fid)) * (armyGen(fid, a) ? 1.15 : 1) * (1 + b.atk + b.hp * 0.8); };
const armyPow = fid => usableArmies(fid).reduce((s, a) => s + armyPowA(fid, a), 0);
const strongestArmy = fid => usableArmies(fid).sort((x, y) => armyPowA(fid, y) - armyPowA(fid, x))[0] || null;
const defPow = p => { const b = bonus(p.owner); return (power(defenders(p)) + (defenders(p).cat || 0) * 1.5) * (1 + 0.4 * wallLvl(p) + (p.b.moat && !p.ruined ? 0.25 : 0)) * (1 + 0.12 * mods(p.owner)) * (defGen(p) ? 1.15 : 1) * (1 + b.atk + b.hp * 0.8) + 0.5; };
const STD_KNOBS = { pNeed: 0, pVal: 1, grace: 0, gang: true, pBonus: 2 };
const knobs = () => (typeof diff === 'function' ? diff() : null) || STD_KNOBS;

function aiTurn(fid) {
  const F = G.fac[fid];
  if (!F.alive || G.over) return;
  if (F.captive) offerRansom(fid);
  for (const k in KINGDOMS) if (canCrown(fid, k) && F.gold >= CROWN_COST + 40) crown(fid, k);
  if (F.unrest && !unrestCovered(fid)) {
    if (F.gold >= F.unrest.cost + 40 && Math.random() < 0.3) { const seedP = P(F.unrest.seed); appease(fid); note(`${FAC(fid).name} buys off the malcontents around ${seedP.name}.`); }
    else if (Math.random() < 0.5) F.unrestMarch = true;
  }
  aiDefendSeat(fid);
  if (G.over) return;
  aiBuild(fid); aiGenerals(fid); aiNavy(fid); aiRecruit(fid); aiChurch(fid); aiDiplo(fid);
  F.guard = aiPickGuard(fid);
  aiConcentrate(fid);
  F.struck = false;
  for (const a of usableArmies(fid).sort((x, y) => armyPowA(fid, y) - armyPowA(fid, x))) { if (G.over) return; if (!a.acted) aiWar(fid, a); }
  const n = owned(fid).length; if (n > (F.maxProv || 0)) { F.maxProv = n; F.lastGrow = G.turn; }
  F.guard = null;
  F.unrestMarch = false;
  if (G.over) return;
  aiEnvoys(fid);
  if (F.sons > 0 && !F.proposed && F.gold > 120 && Math.random() < 0.06) {
    const t = alive().filter(o => o !== fid && o !== G.player && canReach(P(homeOf(fid)), o) && armyPow(o) > armyPow(fid)).sort((x, y) => armyPow(y) - armyPow(x))[0];
    if (t) { const r = marriagePact(fid, t); if (r) note(r.text); }
  }
  if (F.sons > 0 && !F.proposed && F.gold > 70 && Math.random() < 0.12) {
    const c = provList().filter(p => p.heiress && !p.owner && !p.ally && (adjTo(p, fid) || p.seas.some(z => coastIn(fid, z))));
    if (c.length) { const p = pick(c); const r = aiCourt(fid, p); if (r) { if (r.ok && (adjTo(p, G.player) || p.ally === G.player)) report('A rival marriage', r.text); else note(r.text); } }
  }
}
// when nothing can be taken for two turns running, the other armies march to the strongest and merge into it
function aiConcentrate(fid) {
  const F = G.fac[fid];
  if (G.turn - (F.lastGrow || 0) < 6 || truce()) return;
  const arms = usableArmies(fid).filter(a => a.id !== F.guard && armySize(a) > 0 && !a.siege).sort((x, y) => armyPowA(fid, y) - armyPowA(fid, x));
  if (arms.length < 2) return;
  const main = arms[0];
  for (const a of arms.slice(1)) {
    if (a.acted) continue;
    if (a.loc !== main.loc) {
      if (canMarch(fid, a, main.loc)) marchArmy(fid, a, main.loc);
      else { const d = marchDist(fid, a.loc), dd = bfsOwned(fid, main.loc); let best = null, bd = dd[a.loc] ?? 99; for (const id in d) if (d[id] <= a.mp && dd[id] !== undefined && dd[id] < bd) { bd = dd[id]; best = id; } if (best) marchArmy(fid, a, best); }
    }
    if (a.loc === main.loc) { for (const t of ['foot', 'bow', 'cav', 'cat']) { main[t] += a[t]; a[t] = 0; } a.acted = true; }
  }
}
// when a strong enemy host could strike the seat, the smallest adequate army stands guard
function aiPickGuard(fid) {
  if (truce()) return null;
  const capP = P(homeOf(fid)), arms = usableArmies(fid).filter(a => armySize(a) >= 5);
  if (!arms.length) return null;
  const gar = power(defenders(capP)) * (1 + 0.32 * wallLvl(capP));
  const enemies = alive().filter(o => o !== fid && !G.fac[o].captive && !atPeace(fid, o) && canReachAny(capP, o)).map(o => armyPow(o));
  if (!enemies.length) return null;
  const worst = Math.max(...enemies);
  if (worst <= gar * 1.3) return null;
  const sorted = arms.sort((x, y) => armyPowA(fid, x) - armyPowA(fid, y));
  const ok = sorted.find(a => (gar + armyPowA(fid, a) * (1 + 0.32 * wallLvl(capP))) * 1.3 >= worst && armyPowA(fid, a) > worst * 0.3);
  return (ok || sorted[sorted.length - 1]).id;
}
// if the seat is besieged every army marches to it
function aiDefendSeat(fid) {
  const F = G.fac[fid], capP = P(homeOf(fid));
  const b = besieging(capP);
  if (b && b.fid !== fid) {
    for (const a of usableArmies(fid)) {
      if (a.acted || !besieging(capP)) continue;
      const s = strikeFrom(fid, a, capP) || (canMarch(fid, a, capP.id) ? { stage: capP.id, dist: marchDist(fid, a.loc)[capP.id] } : null);
      if (a.loc === capP.id && !a.siege) { if (armyPowA(fid, a) > armyPowA(b.fid, b.a) * 0.95) aiRelief(fid, a, capP); continue; }
      if (!s) continue;
      a.mp -= s.dist; a.siege = null; a.loc = s.stage;
      if (armyPowA(fid, a) > armyPowA(b.fid, b.a) * 0.95) { aiRelief(fid, a, capP); }
    }
  }
}
function aiRelief(fid, A, p) {
  const b = besieging(p);
  const cfg = reliefCfg(fid, A, p, autoStance(armyPowA(fid, A), armyPowA(b.fid, b.a), false, false));
  const a0 = { ...cfg.A }, b0 = { ...cfg.D };
  const res = runBattle(cfg);
  resolveRelief(fid, A, p, res, cfg);
  const txt = `${FAC(fid).name} marched to relieve ${p.name}. ${res.won ? `The besiegers of ${FAC(b.fid).name} were routed` : `The relief army was driven off`}. Losses: ${FAC(fid).name} ${lossStr(a0, res.A)}; ${FAC(b.fid).name} ${lossStr(b0, res.D)}.`;
  if (b.fid === G.player) report(res.won ? 'Your siege is broken' : 'Relief army beaten', txt); else note(txt);
}
function aiBuild(fid) {
  const F = G.fac[fid]; const opts = [];
  const early = G.turn < 16;
  const lands = provList().filter(q => q.owner === fid || (!q.owner && q.ally === fid));
  for (const p of lands) {
    if (p.build || besiegerOf(p)) continue;
    if (p.ruined && p.owner === fid) { opts.push({ p, t: 'rebuild', sc: 0.5 }); continue; }
    const front = ADJ[p.id].some(n => P(n).owner && P(n).owner !== fid);
    for (const t in BLD) {
      if (!canBuild(p, t)) continue;
      if (BLD[t].realm && (!p.owner || F.gold < 450 || p.cap !== fid)) continue;
      let sc = BLD[t].y ? (p.owner ? bldYield(fid, t) : BLD[t].y / 2) / bldCost(p, t) * (p.cap === fid ? 1.3 : 1) : 0;
      if (t === 'castle') sc = !p.owner ? 0 : castleLv(p) === 0 ? ((front && p.base >= 5) ? 0.12 : 0) : ((p.cap === fid || (front && p.base >= 6)) && F.gold > 200 ? 0.1 : 0);
      if (t === 'moat') sc = p.owner && p.cap === fid && F.gold > 250 ? 0.09 : 0;
      if (BLD[t].realm) sc = 0.2;
      if (t === 'port' && (fid === 'england' || fid === 'denmark' || p.cap === fid)) sc *= 1.5;
      if (sc > 0) opts.push({ p, t, sc });
    }
  }
  opts.sort((a, b) => b.sc - a.sc);
  let n = 0;
  for (const o of opts) {
    if (n >= (early ? 3 : 2)) break;
    const c = bldCost(o.p, o.t);
    if (F.gold >= c + (early ? 10 : 35) && !o.p.build) { F.gold -= c; o.p.build = { type: o.t, left: bldTurns(o.p, o.t) }; n++; }
  }
}
function aiRecruit(fid) {
  const F = G.fac[fid], home = P(homeOf(fid));
  if (!home || home.owner !== fid) return;
  const inc = grossIncome(fid);
  const cap = G.turn < 6 ? 12 : G.turn < 14 ? 20 : Math.max(28, Math.round(inc * 0.5));
  const reserve = G.turn < 14 ? 45 : 25;
  const arms = usableArmies(fid).filter(a => canRaiseInto(fid, a));
  const perArmy = Math.max(8, Math.round(cap / Math.max(1, usableArmies(fid).length)));
  const payOk = t => upkeepOf(fid) + UPKEEP[t] <= inc * 0.8 - 4;
  let guard = 0;
  while (F.gold > reserve && guard++ < 200) {
    const hg = fighters(home.gar);
    if (hg < 6) { if (!buy(fid, Math.random() < 0.5 ? 'foot' : 'bow', home.gar)) break; continue; }
    const a = arms.filter(x => armySize(x) < perArmy).sort((x, y) => armySize(x) - armySize(y))[0];
    if (a) {
      const t = a.cat < 2 + Math.floor(armySize(a) / 20) && G.turn >= 3 && Math.random() < 0.35 ? 'cat' : pickW({ foot: 45, bow: 25, cav: 30 });
      if (!payOk(t)) break;
      if (!buy(fid, t, a)) break; continue;
    }
    if (hg < 14 + Math.floor(inc / 25)) { if (!buy(fid, pickW({ foot: 50, bow: 35, cav: 15 }), home.gar)) break; continue; }
    // top up frontier castles
    const fr = owned(fid).filter(p => p.b.castle && p.id !== home.id && ADJ[p.id].some(n => P(n).owner && P(n).owner !== fid) && fighters(p.gar) < 8).sort((x, y) => fighters(x.gar) - fighters(y.gar))[0];
    if (fr && F.gold > reserve + 30) { if (!buy(fid, pickW({ foot: 60, bow: 40 }), fr.gar)) break; continue; }
    break;
  }
  if (F.bishops < 3 && F.gold >= unitCost(fid, 'bishop') + 15 && Math.random() < 0.3) { F.gold -= unitCost(fid, 'bishop'); F.bishops++; }
  if (F.bishops > 1 && F.gold > 300 && Math.random() < 0.25) promote(fid);
}
function aiGenerals(fid) {
  const F = G.fac[fid];
  // an idle strategist takes an empty army slot first
  const slot = emptyArmySlot(fid);
  if (slot) { const g = F.gens.find(x => !ARMY_IDS.includes(x.at)); if (g) { postGeneral(fid, g.id, slot); } }
  if (F.gens.length >= 3 || !G.genPool.length) return;
  const want = emptyArmySlot(fid) ? 0.6 : 0.2;
  if (F.gold < 140 || Math.random() > want) return;
  const g = G.genPool.map(id => GENMAP[id]).filter(g => g.c <= F.gold - 60).sort((a, b) => b.c - a.c)[0];
  if (g && hireGeneral(fid, g.id)) note(`${g.n} enters the service of ${FAC(fid).name}.`);
}
function aiChurch(fid) {
  const F = G.fac[fid];
  if (F.popeUsed || F.gold < 70) return;
  const say = (r, tgt) => { if (!r) return; if (tgt === G.player && /excommunicates|Truce|interdict/.test(r)) report('Word from Rome', r); else note(r); };
  if (F.excom > 0 && F.gold > 60) return say(papal(fid, 'absolve'));
  if (Math.random() > 0.3) return;
  const rivals = alive().filter(o => o !== fid).sort((a, b) => empireHeld(b) - empireHeld(a));
  const s = rivals[0];
  if (s && empireHeld(s) >= empireHeld(fid) + 4 && G.fac[s].excom === 0 && popeChance(fid, 'excom', s) > 0.3) return say(papal(fid, 'excom', s), s);
  const threat = rivals.find(o => canReach(P(homeOf(fid)), o) && armyPow(o) > armyPow(fid) * 1.4);
  if (threat && !atPeace(fid, threat) && popeChance(fid, 'truce', threat) > 0.4) return say(papal(fid, 'truce', threat), threat);
  if (F.sons === 0 && provList().some(p => p.heiress && !p.owner) && F.gold > 150) return say(papal(fid, 'dispense'));
  if (F.bless === 0) return say(papal(fid, 'bless'));
}
function aiDiplo(fid) {
  const F = G.fac[fid];
  if (Math.random() > 0.15) return;
  const c = provList().filter(p => canAlly(fid, p)).map(p => ({ p, c: allyCost(fid, p) })).filter(o => F.gold >= o.c + 90).sort((a, b) => b.p.base / b.c - a.p.base / a.c);
  if (!c.length) return;
  const { p } = c[0];
  if (makeAlly(fid, p)) {
    const txt = `${p.lord} of ${p.name} swears alliance to ${FAC(fid).name}.`;
    if (adjTo(p, G.player)) report('A new alliance', txt); else note(txt);
  }
}
// envoys to the player: a marriage from a weaker neighbour, or a joint war against a house that borders both
function aiEnvoys(fid) {
  const F = G.fac[fid], me_ = G.player;
  if (G.diplo || fid === me_ || !G.fac[me_].alive || atPeace(fid, me_)) return;
  const borders = (a, b) => owned(a).some(p => ADJ[p.id].some(n => holds(b, n)));
  if (borders(fid, me_) && armyPow(me_) > armyPow(fid) * 1.1 && F.sons > 0 && Math.random() < 0.04) { diploOffer(fid, 'pact', null, F.gold > 200 ? 30 : 0); return; }
  const incs = alive().map(o => [o, facIncome(o)]).sort((x, y) => y[1] - x[1]);
  const leader = incs.length > 1 && incs[0][1] > incs[1][1] * 1.25 ? incs[0][0] : null;
  if (leader && leader !== fid && leader !== me_ && borders(leader, fid) && borders(leader, me_) && !atPeace(fid, leader) && Math.random() < 0.05) diploOffer(fid, 'war', leader, F.gold > 160 ? 20 + rnd(21) : 0);
}
function enemyShips(fid, z) { return Object.keys(G.fleets[z]).filter(k => k !== fid).reduce((a, k) => a + G.fleets[z][k], 0); }
function aiNavy(fid) {
  const F = G.fac[fid];
  const ports = owned(fid).filter(p => p.b.port && p.seas.length);
  if (!ports.length) return;
  const landT = provList().filter(p => p.owner !== fid && p.ally !== fid && adjTo(p, fid) && !(p.owner && atPeace(fid, p.owner))).length;
  let goal = null, best = -1e9;
  for (const [z] of SEAS) {
    if (!coastIn(fid, z)) continue;
    const tg = provList().filter(p => p.seas.includes(z) && p.owner !== fid && p.ally !== fid && !adjTo(p, fid) && !(p.owner && truce())).length;
    const sc = tg * 2 - enemyShips(fid, z) * 0.6 + (G.fleets[z][fid] || 0) * 0.2;
    if (sc > best) { best = sc; goal = z; }
  }
  if (!goal) return;
  const en = enemyShips(fid, goal);
  const want = fid === 'england' || fid === 'denmark' ? Math.min(14, 6 + Math.round(1.5 * en)) : landT <= 1 ? Math.min(14, Math.round(3 + 1.5 * en)) : (fid === 'normandy' ? 3 : 1);
  let guard = 0;
  while (shipsOf(fid) < want && F.gold > shipCost(fid) + 40 && guard++ < 4) {
    // launch into the goal sea if it is clear, otherwise into any clear sea and sail in
    let built = false;
    const clearGoal = !enemyShips(fid, goal) && ports.find(q => q.seas.includes(goal));
    if (clearGoal) built = buildShip(fid, clearGoal, goal);
    else for (const p of ports) { const z = p.seas.find(s => !enemyShips(fid, s)); if (z && buildShip(fid, p, z)) { built = true; break; } }
    if (!built) break;
  }
  for (const [z] of SEAS) {
    const n = G.fleets[z][fid] || 0;
    if (!n || z === goal || F.moved.includes(z)) continue;
    const path = seaPath(z, goal); if (!path || path.length < 2) continue;
    const nx = path[1], en2 = enemyShips(fid, nx);
    if (en2 && n < en2 * 1.2) continue;
    moveFleet(fid, z, nx);
  }
  const here = G.fleets[goal][fid] || 0;
  if (here && !F.moved.includes(goal)) {
    for (const nz of SEA_ADJ[goal]) {
      const en3 = enemyShips(fid, nz);
      if (en3 && here > en3 * 1.4 && coastIn(fid, nz)) { moveFleet(fid, goal, nz); break; }
    }
  }
}
function aiBombard(fid, A, p) {
  let wl = 0, kl = 0, pl = 0;
  for (let s = 0; s < A.cat * catShots(fid, A); s++) {
    if (Math.random() < 0.6) {
      if (p.walls > 34 && !p.ruined) { const d = Math.min(p.walls, 26 / Math.max(1, castleLv(p))); damageWalls(p, d); wl += Math.round(d); }
      else if (Math.random() < 0.5) { p.plague = { s: Math.min(3, ((p.plague && p.plague.s) || 0) + 1), t: 3 }; pl++; }
      else kl += killDefenders(p, 2 + rnd(3));
    }
  }
  A.bombarded = true;
  if (p.owner === G.player || p.ally === G.player) note(`${FAC(fid).name}'s catapults pound ${p.name}: walls -${wl}%, ${kl} burned${pl ? ', and plague carcasses flung over the walls' : ''}.`);
}
function aiAssault(fid, A, p) {
  const ap = armyPowA(fid, A), dp = defPow(p);
  const cfg = assaultCfg(fid, A, p, aiStanceAtt(ap, dp, !!p.b.castle));
  cfg.aRes = armySize(A) >= 9 && !p.b.castle;
  const a0 = { ...cfg.A }, d0 = { ...cfg.D };
  const res = runBattle(cfg);
  const { prev, prevAlly } = resolveAssault(fid, A, p, res, cfg);
  const verb = p.b.castle ? 'stormed' : 'attacked';
  const mine = prev === G.player || prevAlly === G.player;
  if (res.won) {
    if (mine) report(`${p.name} has fallen`, `${FAC(fid).name} ${verb} ${p.name} and took it. Defenders lost ${lossStr(d0, res.D)}; they lost ${lossStr(a0, res.A)}.`);
    else note(`${FAC(fid).name} took ${p.name}${prev ? ' from ' + FAC(prev).name : ''}.`);
  } else if (mine) report(`${p.name} holds!`, `${FAC(fid).name} ${verb} ${p.name} and was thrown back. Defenders lost ${lossStr(d0, res.D)}; they lost ${lossStr(a0, res.A)}.`);
}
// march one step toward the nearest frontier province (or a coast on an open lane)
function stepToward(fid, A) {
  if (!A.loc || A.acted) return false;
  const isFront = id => ADJ[id].some(n => !holds(fid, n) && !(P(n).owner && atPeace(fid, P(n).owner))) || P(id).seas.some(z => laneOpen(z, fid) && provList().some(q => q.seas.includes(z) && !holds(fid, q.id) && !(q.owner && atPeace(fid, q.owner))));
  if (isFront(A.loc)) return false;
  const seen = { [A.loc]: null }, q = [A.loc]; let target = null;
  while (q.length && !target) { const c = q.shift(); for (const n of ADJ[c]) if (!(n in seen) && holds(fid, n)) { seen[n] = c; if (isFront(n)) { target = n; break; } q.push(n); } }
  if (!target) return false;
  let k = target; const path = []; while (k && k !== A.loc) { path.unshift(k); k = seen[k]; }
  const dest = path[Math.min(path.length, MOVES) - 1];
  return marchArmy(fid, A, dest);
}
function aiWar(fid, A) {
  const D = knobs(), F = G.fac[fid];
  if (A.siege) {
    const p = P(A.siege);
    if (armySize(A) < 4) { A.siege = null; A.loc = nearestHeld(fid, p.id); note(`${FAC(fid).name} lifts the siege of ${p.name}.`); return; }
    if (A.cat > 0 && !A.bombarded) aiBombard(fid, A, p);
    if (armyPowA(fid, A) > defPow(p) * 1.4) aiAssault(fid, A, p);
    A.acted = true; F.struck = true; return;
  }
  // an unrest seed to cover
  if (F.unrest && F.unrestMarch && !unrestCovered(fid) && armySize(A) >= 8) {
    const seed = F.unrest.seed;
    if (A.loc === seed) { A.acted = true; return; }
    if (canMarch(fid, A, seed)) { marchArmy(fid, A, seed); A.acted = true; return; }
    const d = marchDist(fid, A.loc); let bestStep = null, bd = 99;
    const dd = bfsOwned(fid, seed);
    for (const id in d) if (d[id] <= A.mp && dd[id] !== undefined && dd[id] < bd) { bd = dd[id]; bestStep = id; }
    if (bestStep && bestStep !== A.loc) { marchArmy(fid, A, bestStep); A.acted = true; return; }
  }
  if (armySize(A) < 5) { A.idle++; return; }
  const ap = armyPowA(fid, A);
  // the chosen guard stays at (or marches to) the seat while a strong enemy could strike it
  if (F.guard === A.id) {
    const capP = P(homeOf(fid));
    if (A.loc !== capP.id && canMarch(fid, A, capP.id)) marchArmy(fid, A, capP.id);
    if (A.loc === capP.id) { A.acted = true; return; }
  }
  // balance of power: gang up on a house that is running away with the game
  const incs = alive().map(o => [o, facIncome(o)]).sort((x, y) => y[1] - x[1]);
  let leader = incs.length > 1 && incs[0][1] > incs[1][1] * 1.25 && incs[0][0] !== fid ? incs[0][0] : null;
  if (leader === G.player && !D.gang) leader = null;
  const grace = G.turn < TRUCE + D.grace;
  const few = alive().length <= 3;
  const warOn = F.warOn ? F.warOn.target : null;
  let best = null, bs = -1, bestS = null;
  for (const p of provList()) {
    const s = strikeFrom(fid, A, p);
    if (!s) continue;
    if (p.owner && truce()) continue;
    const bz = besieging(p); if (bz && bz.fid !== fid) continue;
    if (bz && bz.fid === fid) continue;
    const vsPlayer = p.owner === G.player || (!p.owner && p.ally === G.player);
    if (vsPlayer && grace && p.owner === G.player) continue;
    const ratio = ap / defPow(p);
    const cap = isCap(p);
    const kin = p.owner && !foreign(p.owner) && !foreign(fid);
    let base = p.owner ? (cap ? 2.0 : 1.7) + (kin && G.turn < 30 ? 0.6 : 0) - (p.owner === leader ? 0.3 : 0) + (vsPlayer ? D.pNeed : 0) - (p.owner === warOn ? 0.3 : 0) : 1.3;
    let need = Math.max(1.05, base - 0.06 * A.idle) - (few ? 0.3 : 0);
    const canSiege = p.b.castle && armySize(A) >= (p.owner ? 12 : 7) && ap >= power(defenders(p)) * (cap ? 2.4 : p.owner ? 1.1 : 0.9) * (vsPlayer ? 1 + D.pNeed * 0.4 : 1);
    if (ratio < need && !canSiege) continue;
    let val = p.base + (cap ? (G.turn < 30 ? 6 : 18) : 0) + (p.owner === G.player ? D.pBonus : 0) + (p.owner ? 1 : 0) + (p.r === 'fr' ? 4 : 0) + (p.ally ? 1 : 0);
    if (s.sea) val *= 0.8;
    if (s.dist) val *= 0.9;
    if (kin && G.turn < 30) val *= 0.6;
    if (leader && p.owner === leader) val *= 1.8;
    if (warOn && p.owner === warOn) val *= 1.8;
    if (vsPlayer) val *= D.pVal;
    const sc = val * Math.min(ratio, 3) * (0.8 + Math.random() * 0.4);
    if (sc > bs) { bs = sc; best = p; bestS = s; }
  }
  if (!best) { A.idle++; stepToward(fid, A); return; }
  A.acted = true; A.idle = 0; F.struck = true;
  A.mp -= bestS.dist; A.siege = null; A.loc = bestS.stage;
  if (best.b.castle && ap <= defPow(best) * 1.6) {
    A.siege = best.id; A.loc = best.id;
    if (best.owner === G.player || best.ally === G.player) report('Siege!', `${FAC(fid).name} has laid siege to ${best.name}. The garrison will starve unless an army breaks the siege.`);
    else note(`${FAC(fid).name} besieges ${best.name}.`);
    if (A.cat > 0) aiBombard(fid, A, best);
  } else aiAssault(fid, A, best);
}

// ================= ROUND =================
function runAITurns() {
  for (const fid of G.order) {
    if (fid === G.player || !G.fac[fid].alive || G.over) continue;
    beginTurn(fid); aiTurn(fid); endTurn(fid);
  }
  if (!G.over) { endRound(); beginTurn(G.player); }
}
