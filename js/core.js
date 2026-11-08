'use strict';
// ================= STATE =================
let G = null;
const SK = 'crownOfTheFranks987v7';
const eu = () => ({ foot: 0, bow: 0, cav: 0, cat: 0 });
const fighters = u => (u.militia || 0) + (u.foot || 0) + (u.bow || 0) + (u.cav || 0);
// rough strength per company, from attack x hit points
const power = u => (u.militia || 0) * 0.55 + (u.foot || 0) + (u.bow || 0) * 0.85 + (u.cav || 0) * 2.1;
const P = id => G.provs[id];
const provList = () => Object.values(G.provs);
const facIds = () => G.fdefs.map(f => f.id);
const owned = fid => provList().filter(p => p.owner === fid);
const allies = fid => provList().filter(p => !p.owner && p.ally === fid);
const holds = (fid, id) => { const p = P(id); return p.owner === fid || (!p.owner && p.ally === fid); };
const homeOf = fid => FAC(fid).home;
const adjTo = (p, fid) => ADJ[p.id].some(n => holds(fid, n));
const alive = () => facIds().filter(id => G.fac[id].alive);
const isCap = p => !!(p.cap && p.cap === p.owner);
const foreign = fid => FAC(fid).realm !== 'France';
function rulerOf(fid) {
  const d = FAC(fid);
  if (d.emperor) return `Emperor ${d.pname}`;
  if (d.kingOf && d.kingOf.length) return `King ${d.pname} of ${d.kingOf.map(k => KINGDOMS[k].n).join(' and ')}`;
  return `${d.title} ${d.pname}`;
}
const inCrown = (fid, p) => !!(KPROV[p.id] && (FAC(fid).kingOf || []).some(k => KPROV[p.id].includes(k)));
function levyMax(p) {
  if (!p.owner) return (2 + Math.floor(p.base / 2)) * (p.r === 'fr' ? 1 : 2);
  return (isCap(p) ? 6 : 2) * (inCrown(p.owner, p) ? 2 : 1);
}
const bishopsOf = fid => G.fac[fid].bishops;

// ================= ARMIES =================
// Each house keeps three army slots. a0 is the lord's host; a1 and a2 need a general and a realm big enough to field them.
const ARMY_IDS = ['a0', 'a1', 'a2'];
const newArmy = (id, loc) => ({ id, loc, foot: 0, bow: 0, cav: 0, cat: 0, siege: null, mp: MOVES, acted: false, bombarded: false, stormed: false, idle: 0 });
const armiesOf = fid => G.armies[fid];
const army = (fid, id) => armiesOf(fid).find(a => a.id === id);
const lordArmy = fid => army(fid, 'a0');
const armySize = a => fighters(armySide(a));
const armySide = a => ({ militia: 0, foot: a.foot, bow: a.bow, cav: a.cav });
const setArmy = (a, s) => { a.foot = s.foot; a.bow = s.bow; a.cav = s.cav; };
const armyMax = fid => 1 + (owned(fid).length >= 8 ? 1 : 0) + ((FAC(fid).kingOf || []).length ? 1 : 0);
function armyGen(fid, a) { const g = G.fac[fid].gens.find(x => x.at === a.id); return g ? GENMAP[g.id] : null; }
function armyUsable(fid, a) {
  const F = G.fac[fid]; if (!F.alive) return false;
  if (a.id === 'a0') return !F.captive;
  return ARMY_IDS.indexOf(a.id) < armyMax(fid) && !!armyGen(fid, a);
}
const usableArmies = fid => armiesOf(fid).filter(a => armyUsable(fid, a));
function armyName(fid, a) {
  if (a.id === 'a0') return `the host of ${FAC(fid).pname.split(' ')[0]}`;
  const g = armyGen(fid, a); return g ? `${g.n.split(' ')[0]}'s army` : `the ${a.id === 'a1' ? 'second' : 'third'} army`;
}
const armyLabel = (fid, a) => a.id === 'a0' ? "Lord's host" : a.id === 'a1' ? 'Second army' : 'Third army';
function armiesAt(loc) { const out = []; for (const fid in G.armies) if (G.fac[fid].alive) for (const a of G.armies[fid]) if (a.loc === loc && !a.siege && armySize(a) > 0) out.push({ fid, a }); return out; }
function besieging(p) { for (const fid in G.armies) if (G.fac[fid].alive) for (const a of G.armies[fid]) if (a.siege === p.id) return { fid, a }; return null; }
function besiegerOf(p) { const b = besieging(p); return b ? b.fid : null; }
function defArmies(p) { const o = p.owner || p.ally; if (!o) return []; return armiesOf(o).filter(a => a.loc === p.id && !a.siege && armySize(a) > 0); }
const totalArmyPower = fid => armiesOf(fid).reduce((s, a) => s + power(armySide(a)), 0);
const totalMen = fid => armiesOf(fid).reduce((s, a) => s + armySize(a), 0);
// generals: at = province id (strategist in a castle) or an army id
const genAt = (fid, at) => { const g = fid && G.fac[fid] ? G.fac[fid].gens.find(x => x.at === at) : null; return g ? GENMAP[g.id] : null; };
function genPost(fid, g) { return ARMY_IDS.includes(g.at) ? (g.at === 'a0' ? "rides with the lord's host" : `leads ${armyLabel(fid, army(fid, g.at)).toLowerCase()}`) : `strategist at ${P(g.at).name}`; }

// ================= CASTLES & BUILDINGS =================
const castleLv = p => p.b.castle || 0;
function wallLvl(p) {
  if (!p.b.castle || p.ruined) return 0;
  const w = Math.round(castleLv(p) * p.walls / 100 + 0.15);
  return w > 0 ? w + (isCap(p) ? 1 : 0) : 0;
}
function damageWalls(p, amt) {
  if (!p.b.castle || p.ruined) return;
  p.walls = Math.max(0, p.walls - amt);
  if (p.walls <= 0) {
    p.ruined = true; p.b.castle = 1; p.b.moat = 0;
    const txt = `The walls of ${p.name} are thrown down. The castle lies in ruins and must be rebuilt.`;
    if (p.owner === G.player || besiegerOf(p) === G.player) note(txt);
  }
}
function realmHas(fid, t) { return owned(fid).some(p => p.b[t] || (p.build && p.build.type === t)); }
function canBuild(p, t) {
  const B = BLD[t];
  if (t === 'castle') return !p.ruined && castleLv(p) < 3;
  if (t === 'moat') return castleLv(p) > 0 && !p.ruined && !p.b.moat;
  if (B.realm) return !!p.owner && castleLv(p) > 0 && !realmHas(p.owner, t);
  return (p.b[t] || 0) < MAXLV && (B.need === 'coast' ? p.seas.length > 0 : B.need === 'hills' ? p.hills : true);
}
function bldCost(p, t) {
  if (t === 'castle') return CASTLE_C[castleLv(p)];
  if (t === 'rebuild') return 50;
  if (BLD[t].realm) return p.owner === 'bavaria' ? Math.round(BLD[t].c / 2) : BLD[t].c;
  if (t === 'moat') return BLD[t].c;
  return BLD[t].c * ((p.b[t] || 0) + 1);
}
const bldTurns = (p, t) => t === 'castle' ? CASTLE_T[castleLv(p)] : t === 'rebuild' ? 3 : BLD[t].t;
function bldName(p, t) {
  if (t === 'castle') return castleLv(p) ? `Raise to ${CASTLE_N[castleLv(p) + 1].toLowerCase()}` : CASTLE_N[1];
  if (t === 'rebuild') return 'Rebuild the castle';
  return (p.b[t] && !BLD[t].realm && t !== 'moat' ? 'Expand ' + BLD[t].n.toLowerCase() : BLD[t].n);
}
function bldYield(fid, t) {
  let y = BLD[t].y;
  if (t === 'market' && fid === 'champagne') y += 4;
  if (t === 'market' && fid === 'tuscany') y += 3;
  if (t === 'port' && fid === 'provence') y += 3;
  if (t === 'mine' && fid === 'saxony') y += 4;
  return y;
}
function bonus(fid) {
  if (!fid) return { atk: 0, hp: 0, cav: 0 };
  return { atk: (owned(fid).some(p => p.b.armory) ? 0.15 : 0) + ((FAC(fid).kingOf || []).length ? 0.1 : 0),
    hp: owned(fid).some(p => p.b.forge) ? 0.15 : 0, cav: owned(fid).some(p => p.b.stables) ? 0.25 : 0 };
}
const truce = () => G.turn < TRUCE;
function unitCost(fid, t) {
  if (t === 'cav' && fid === 'normandy') return 16;
  if (t === 'bishop' && fid === 'burgundy') return 18;
  if (t === 'cat' && fid === 'naples') return 15;
  return UNIT[t].c;
}
const shipCost = fid => fid === 'denmark' || fid === 'england' ? 20 : 30;
const catShots = (fid, a) => 3 + (fid === 'naples' ? 1 : 0) + (a && armyGen(fid, a) && armyGen(fid, a).siege ? 1 : 0);
function mods(fid) { if (!fid) return 0; const F = G.fac[fid]; return (F.bless > 0 ? 1 : 0) - (F.excom > 0 ? 1 : 0); }
const hasRome = fid => P('rome').owner === fid || P('rome').ally === fid;
const atPeace = (a, b) => G.truces.some(t => t.until > G.turn && ((t.a === a && t.b === b) || (t.a === b && t.b === a)));
// the same two houses cannot renew a truce or pact within 10 turns of the last one lapsing
const TRUCE_COOL = 10;
const pairKey = (a, b) => [a, b].sort().join('|');
function recentPeace(a, b) { const h = G.truceHist && G.truceHist[pairKey(a, b)]; return !!h && G.turn < h + TRUCE_COOL && !atPeace(a, b); }
function addTruce(a, b, until, pact) { G.truces.push({ a, b, until, pact: !!pact }); (G.truceHist = G.truceHist || {})[pairKey(a, b)] = until; }

// ================= GENERALS =================
function loseGeneral(fid, at, why) {
  const F = G.fac[fid]; const g = F.gens.find(x => x.at === at);
  if (!g) return null;
  F.gens = F.gens.filter(x => x !== g);
  if (fid === G.player) note(`${GENMAP[g.id].n} ${why}.`);
  return GENMAP[g.id];
}
function emptyArmySlot(fid) { const max = armyMax(fid); return ARMY_IDS.slice(1, max).find(id => !genAt(fid, id)) || null; }
function hireGeneral(fid, gid) {
  const F = G.fac[fid], g = GENMAP[gid];
  if (!G.genPool.includes(gid) || F.gold < g.c || F.gens.length >= 3) return false;
  let at = emptyArmySlot(fid);
  if (at) { const a = army(fid, at); if (!a.loc || P(a.loc).owner !== fid) a.loc = homeOf(fid); }
  if (!at) { const c = owned(fid).find(q => q.b.castle && !genAt(fid, q.id)); at = c ? c.id : null; }
  if (!at) return false;
  F.gold -= g.c; G.genPool = G.genPool.filter(x => x !== gid);
  F.gens.push({ id: gid, at });
  return true;
}
// move a general between postings: a castle, an empty army slot, or the lord's host
function postGeneral(fid, gid, at) {
  const F = G.fac[fid], g = F.gens.find(x => x.id === gid); if (!g) return false;
  if (ARMY_IDS.includes(at)) {
    if (at !== 'a0' && ARMY_IDS.indexOf(at) >= armyMax(fid)) return false;
    const other = F.gens.find(x => x.at === at); if (other) other.at = g.at;
    const a = army(fid, at); if (!a.loc || !holds(fid, a.loc)) a.loc = homeOf(fid);
  } else { const p = P(at); if (!p || p.owner !== fid || !p.b.castle) return false; const other = F.gens.find(x => x.at === at); if (other) other.at = g.at; }
  g.at = at; return true;
}

// ================= INCOME =================
function minorIncome(p) {
  let v = p.base;
  for (const t of ['farm', 'market', 'port', 'mine']) v += (p.b[t] || 0) * BLD[t].y;
  return v;
}
function provIncome(p) {
  if (besiegerOf(p) || p.interdict > 0) return 0;
  if (!p.owner) return p.ally ? Math.floor(minorIncome(p) / 2) : 0;
  const f = p.owner;
  let v = p.base * (isCap(p) ? 2 : 1);
  for (const t of ['farm', 'market', 'port', 'mine']) v += (p.b[t] || 0) * bldYield(f, t);
  if (f === 'aquitaine') v += 2;
  if (inCrown(f, p)) v += 2;
  if (p.r === 'fr' && foreign(f) && !inCrown(f, p)) v = Math.floor(v * 0.7);
  return v;
}
function adminMult(fid) { const n = owned(fid).length; return n <= 15 ? 1 : 1 / (1 + (n - 15) * 0.025); }
function grossIncome(fid) {
  let v = owned(fid).reduce((s, p) => s + provIncome(p), 0) + allies(fid).reduce((s, p) => s + provIncome(p), 0);
  v = Math.floor(v * adminMult(fid));
  if (G.fac[fid].excom > 0) v = Math.floor(v * 0.75);
  return v;
}
const facIncome = grossIncome;
function upkeepOf(fid) { let u = 0; for (const a of armiesOf(fid)) for (const t of ['foot', 'bow', 'cav', 'cat']) u += a[t] * UPKEEP[t]; return Math.ceil(u); }
const netIncome = fid => grossIncome(fid) - upkeepOf(fid);

// ================= DEFENCE =================
function defenders(p) {
  const s = { militia: p.militia, foot: p.gar.foot, bow: p.gar.bow, cav: p.gar.cav, cat: p.b.castle && !p.ruined ? p.gar.cat : 0 };
  for (const a of defArmies(p)) { s.foot += a.foot; s.bow += a.bow; s.cav += a.cav; }
  return s;
}
function applyDefLoss(p, start, end) {
  p.militia = end.militia;
  const here = defArmies(p);
  for (const t of ['foot', 'bow', 'cav']) {
    let loss = start[t] - end[t];
    const g = Math.min(loss, p.gar[t]); p.gar[t] -= g; loss -= g;
    for (const a of here) { if (loss <= 0) break; const k = Math.min(loss, a[t]); a[t] -= k; loss -= k; }
  }
}
function killDefenders(p, k) {
  let n = 0;
  while (k-- > 0) {
    const opts = [];
    if (p.militia > 0) opts.push('militia', 'militia');
    for (const t of ['foot', 'foot', 'bow', 'cav']) if (p.gar[t] > 0) opts.push(t);
    if (!opts.length) break;
    const t = pick(opts);
    if (t === 'militia') p.militia--; else p.gar[t]--;
    n++;
  }
  return n;
}
function uStr(u, withMil, withExtra = true) {
  const keys = (withMil ? ['militia'] : []).concat(['foot', 'bow', 'cav']).concat(withExtra ? ['cat'] : []);
  const parts = keys.filter(t => (u[t] || 0) > 0).map(t => `<span class="u">${ICON[t]}&thinsp;${u[t]}</span>`);
  return parts.length ? parts.join(' ') : '<span class="sub">none</span>';
}

// ================= MOVEMENT =================
// armies march through their own and allied land; a hostile fleet closes a sea lane
function laneOpen(z, fid) { const f = G.fleets[z]; for (const k in f) if (k !== fid && f[k] > 0 && G.fac[k] && G.fac[k].alive && !atPeace(fid, k)) return false; return true; }
function marchDist(fid, from) {
  const d = { [from]: 0 }, q = [from];
  while (q.length) { const c = q.shift(); if (d[c] >= MOVES) continue; for (const n of ADJ[c]) if (!(n in d) && holds(fid, n)) { d[n] = d[c] + 1; q.push(n); } }
  return d;
}
function canMarch(fid, a, id) {
  if (!armyUsable(fid, a) || a.acted || !a.loc || !holds(fid, id) || id === a.loc) return false;
  const d = marchDist(fid, a.loc)[id];
  return d !== undefined && d <= a.mp;
}
function marchArmy(fid, a, id) {
  if (!canMarch(fid, a, id)) return false;
  a.mp -= marchDist(fid, a.loc)[id]; a.siege = null; a.loc = id; a.idle = 0; return true;
}
// the nearest province reachable this turn from which p can be struck: by land, or over an open sea lane
function strikeFrom(fid, a, p) {
  if (!armyUsable(fid, a) || a.acted || !a.loc || armySize(a) === 0) return null;
  if (holds(fid, p.id)) return null;
  if (p.owner && atPeace(fid, p.owner)) return null;
  const dist = a.siege ? { [a.loc]: 0 } : marchDist(fid, a.loc);
  let best = null;
  for (const id in dist) {
    const d = dist[id]; if (d > a.mp) continue;
    if (id === p.id) continue;
    const q = P(id);
    const land = ADJ[p.id].includes(id);
    const sea = !land && q.seas.some(z => p.seas.includes(z) && laneOpen(z, fid));
    if (!land && !sea) continue;
    if (!best || d < best.dist || (d === best.dist && land && best.sea)) best = { stage: id, dist: d, sea: !land };
  }
  return best;
}
function stageFor(fid, a, p) { const s = strikeFrom(fid, a, p); if (!s) return null; a.mp -= s.dist; a.siege = null; a.loc = s.stage; return s; }
function nearestHeld(fid, from) {
  const seen = { [from]: true }, q = [from];
  while (q.length) { const c = q.shift(); if (holds(fid, c)) return c; for (const n of ADJ[c]) if (!seen[n]) { seen[n] = true; q.push(n); } }
  return homeOf(fid);
}
const canReachAny = (p, fid) => usableArmies(fid).some(a => strikeFrom(fid, a, p));
function canReach(p, fid) { return canReachAny(p, fid); }
const canRaiseInto = (fid, a) => armyUsable(fid, a) && !!a.loc && !a.siege && P(a.loc).owner === fid;
function raise(fid, t, a) { const F = G.fac[fid], c = unitCost(fid, t); if (!canRaiseInto(fid, a) || F.gold < c || t === 'bishop') return false; F.gold -= c; a[t]++; return true; }

// ================= SEA =================
function seaControl(z) {
  const f = G.fleets[z]; let who = null;
  for (const k in f) if (f[k] > 0) { if (who) return null; who = k; }
  return who;
}
const shipsOf = fid => SEAS.reduce((s, z) => s + (G.fleets[z[0]][fid] || 0), 0);
const coastIn = (fid, z) => provList().some(q => holds(fid, q.id) && q.seas.includes(z));
function seaRoute(p, fid) { return p.seas.find(z => laneOpen(z, fid) && coastIn(fid, z)) || null; }
function seaPath(from, to) {
  if (from === to) return [from];
  const prev = { [from]: null }, q = [from];
  while (q.length) { const c = q.shift(); for (const n of SEA_ADJ[c]) if (!(n in prev)) { prev[n] = c; if (n === to) { const path = [n]; let k = c; while (k) { path.unshift(k); k = prev[k]; } return path; } q.push(n); } }
  return null;
}
function navalBattle(af, z, an) {
  const df = Object.keys(G.fleets[z]).find(k => k !== af && G.fleets[z][k] > 0);
  let dn = G.fleets[z][df]; const a0 = an, d0 = dn;
  const am = 1 + 0.15 * mods(af) + (af === 'denmark' ? 0.1 : 0), dm = 1 + 0.15 * mods(df) + (df === 'denmark' ? 0.1 : 0);
  while (an > 0 && dn > 0) {
    let ha = 0, hd = 0;
    for (let i = 0; i < an; i++) if (Math.random() < 0.3 * am) ha++;
    for (let i = 0; i < dn; i++) if (Math.random() < 0.32 * dm) hd++;
    dn = Math.max(0, dn - ha); an = Math.max(0, an - hd);
  }
  G.fleets[z][df] = dn; G.fleets[z][af] = an;
  const txt = `Sea fight in the ${SEAMAP[z]}: ${FAC(af).name} ${a0} longships against ${FAC(df).name} ${d0}. ${an > 0 ? FAC(af).name : FAC(df).name} holds the sea lane (${an > 0 ? an : dn} ships left).`;
  if (af === G.player || df === G.player) report(an > 0 === (af === G.player) ? 'Victory at sea' : 'Defeat at sea', txt); else note(txt);
  return an > 0;
}
function moveFleet(fid, from, to) {
  const F = G.fac[fid];
  const n = G.fleets[from][fid] || 0;
  if (!n || !SEA_ADJ[from].includes(to) || F.moved.includes(from)) return false;
  G.fleets[from][fid] = 0;
  const enemy = Object.keys(G.fleets[to]).some(k => k !== fid && G.fleets[to][k] > 0);
  if (enemy) { if (!navalBattle(fid, to, n)) return true; }
  else G.fleets[to][fid] = (G.fleets[to][fid] || 0) + n;
  F.moved.push(to);
  return true;
}
function buildShip(fid, p, z) {
  const F = G.fac[fid], c = shipCost(fid);
  if (!p.b.port || p.owner !== fid || F.gold < c || !p.seas.includes(z)) return false;
  if (Object.keys(G.fleets[z]).some(k => k !== fid && G.fleets[z][k] > 0)) return false;
  F.gold -= c; G.fleets[z][fid] = (G.fleets[z][fid] || 0) + 1;
  return true;
}

// ================= LOG =================
function note(text) { G.log.unshift({ d: dateStr(G.turn), text }); if (G.log.length > 200) G.log.pop(); }
function report(title, body, action) { G.reports.push({ title, body, action: action || null }); note(title + ': ' + body.replace(/<[^>]+>/g, '')); }

// ================= FACTION REGISTRY =================
function facState() { return { alive: true, gold: 100, sons: 2, bless: 0, excom: 0, popeUsed: false, proposed: false, captive: null, gens: [], moved: [], bishops: 1, cardinals: 0, lastRebel: -99, unrest: null, fallen: false, warOn: null }; }
function rebuildFmap() { G.fmap = {}; for (const d of G.fdefs) G.fmap[d.id] = d; }
function addFaction(def, home) {
  G.fdefs.push(def); G.fmap[def.id] = def;
  G.fac[def.id] = Object.assign(facState(), { id: def.id });
  G.armies[def.id] = ARMY_IDS.map(id => newArmy(id, home));
  G.order.push(def.id);
}
const NEW_COLORS = ['#8c4b2a', '#3d6b6b', '#7a3f8f', '#a0782a', '#4a6a2a', '#2a4a7a', '#8f2a5a', '#5a6a1a', '#9a5a7a', '#2a7a5a'];
const ARMS_T = ['fess2', 'pallets', 'cross', 'barry', 'perpale', 'bendCot', 'perfess', 'semy'];
const PNAMES = ['Louis', 'Robert', 'Odo', 'Hugh', 'Charles', 'Rudolf', 'Arnulf', 'Baldwin', 'Godfrey', 'Conrad', 'Lothair', 'Bernard', 'Geoffrey', 'Raymond', 'Theobald'];
function freshColor() { const used = new Set(G.fdefs.filter(d => G.fac[d.id] && G.fac[d.id].alive).map(d => d.color)); return NEW_COLORS.find(c => !used.has(c)) || pick(NEW_COLORS); }

// ================= NEW GAME =================
function newGame(playerId) {
  G = { v: 7, turn: 0, player: playerId, provs: {}, fac: {}, armies: {}, fleets: {}, log: [], reports: [], over: false, winner: null, sel: null, army: 'a0',
    genPool: GENERALS.map(g => g.id), fdefs: FACTIONS.map(f => ({ ...f, arms: { ...f.arms }, kingOf: [] })), offers: [], truces: [], crowns: {}, formed: {}, lastUnion: -99, newN: 0, diplo: null, court: null };
  rebuildFmap();
  PROV.forEach((r, i) => {
    const [id, name, , , seas, hills, base, owner, castle, lord, reg] = r;
    G.provs[id] = { id, name, x: SEEDS[i][0], y: SEEDS[i][1], seas: seas ? seas.split(',') : [], hills: !!hills, base, owner, ally: null, cap: null, r: reg,
      b: { farm: 0, market: 0, port: 0, mine: 0, castle: castle ? (base >= 6 ? 2 : 1) : 0, moat: 0, forge: 0, armory: 0, stables: 0 }, build: null, walls: castle ? 100 : 0, ruined: false,
      gar: eu(), militia: 0, heiress: null, lord, plague: null, interdict: 0 };
  });
  SEAS.forEach(s => G.fleets[s[0]] = {});
  for (const p of provList()) {
    if (!p.owner && p.b.castle) p.gar = { foot: p.base - 1, bow: 2, cav: 1, cat: 0 };
    if (!p.owner && p.r !== 'fr') { const k = (p.b.castle ? 2 : 1.5) * (p.r === 'it' ? 1.8 : 1); p.gar = { foot: Math.round((p.gar.foot || 2) * k) + 2, bow: Math.round((p.gar.bow || 1) * k), cav: Math.round((p.gar.cav || 1) * k), cat: 0 }; }
    if (!p.owner && p.b.castle && p.seas.length) p.b.port = 1;
  }
  Object.assign(P('paris').gar, { foot: 7, bow: 4, cav: 3 });
  Object.assign(P('rome').gar, { foot: 9, bow: 4, cav: 2 });
  P('rome').b.castle = 3; P('paris').b.castle = 2;
  G.order = FACTIONS.map(f => f.id);
  FACTIONS.forEach(f => {
    G.fac[f.id] = Object.assign(facState(), { id: f.id });
    const h = P(f.home); h.cap = f.id; h.b.castle = 2; h.walls = 100;
    h.gar = { foot: 8, bow: 4, cav: 2, cat: 0 };
    G.armies[f.id] = ARMY_IDS.map(id => newArmy(id, f.home));
    Object.assign(G.armies[f.id][0], { foot: 5, bow: 2, cav: 1 });
  });
  P('champagne').b.market = 1;
  P('saxony').b.mine = 1; P('saxony').hills = true;
  P('wessex').b.port = 1; P('jutland').b.port = 1; P('naples').b.port = 1;
  G.crowns = { english: 'england', danes: 'denmark' };
  FAC('england').kingOf = ['english']; FAC('denmark').kingOf = ['danes'];
  for (const p of provList()) p.militia = levyMax(p);
  const neut = provList().filter(p => !p.owner);
  for (let i = 0; i < 6; i++) { const c = neut.filter(p => !p.heiress); pick(c).heiress = pick(LADIES); }
  note(`Louis V is dead without an heir. The lords of Francia cannot agree on a king, and the empire of Charlemagne lies in pieces. The bishops proclaim the Peace of God: no war between the great houses until ${dateStr(TRUCE)}.`);
  beginTurn(playerId);
}

// ================= TURN FLOW =================
function nearestCastle(fid, from) {
  const seen = { [from]: true }, q = [from];
  while (q.length) { const c = q.shift(); const p = P(c); if (p.owner === fid && p.b.castle) return p; for (const n of ADJ[c]) if (!seen[n]) { seen[n] = true; q.push(n); } }
  return null;
}
function dissolveArmy(fid, a, why) {
  const n = armySize(a) + a.cat; if (!n) return;
  const p = (a.loc && P(a.loc).owner === fid && P(a.loc).b.castle) ? P(a.loc) : nearestCastle(fid, a.loc || homeOf(fid));
  if (p) { for (const t of ['foot', 'bow', 'cav', 'cat']) { p.gar[t] += a[t]; a[t] = 0; } if (fid === G.player) note(`${why}: its ${n} men return to the garrison of ${p.name}.`); }
  else { a.foot = a.bow = a.cav = a.cat = 0; if (fid === G.player) note(`${why}: with no castle to return to, its men disband.`); }
  a.siege = null;
}
function beginTurn(fid) {
  const F = G.fac[fid]; if (!F.alive) return;
  const gross = grossIncome(fid), up = upkeepOf(fid);
  F.gold += gross - up;
  if (F.gold < 0) {
    let lost = 0;
    for (const a of armiesOf(fid)) for (const t of ['foot', 'bow', 'cav', 'cat']) { const k = Math.ceil(a[t] * 0.15); a[t] -= k; lost += k; }
    F.gold = 0;
    if (fid === G.player) report('Desertion!', `The treasury is empty and the field armies go unpaid. ${lost} men slip away in the night. Garrisons cost nothing; armies in the field must be paid every turn.`);
    else note(`${FAC(fid).name} cannot pay its armies: ${lost} men desert.`);
  }
  for (const p of provList().filter(q => q.owner === fid || (!q.owner && q.ally === fid))) {
    if (p.build && !besiegerOf(p)) {
      p.build.left--;
      if (p.build.left <= 0) {
        const t = p.build.type;
        if (t === 'castle') { p.b.castle = castleLv(p) + 1; p.walls = 100; }
        else if (t === 'rebuild') { p.ruined = false; p.walls = 100; }
        else p.b[t] = (p.b[t] || 0) + 1;
        if (fid === G.player) note(`${t === 'castle' ? CASTLE_N[p.b.castle] : t === 'rebuild' ? 'The castle' : BLD[t].n + (BLD[t].realm || t === 'moat' ? '' : ROMAN[p.b[t]])} completed in ${p.name}.`);
        p.build = null;
      }
    }
  }
  for (const a of armiesOf(fid)) {
    if (!armyUsable(fid, a) && a.id !== 'a0') dissolveArmy(fid, a, ARMY_IDS.indexOf(a.id) >= armyMax(fid) ? `${armyLabel(fid, a)} is beyond what the realm can field` : `${armyLabel(fid, a)} has no general`);
    a.acted = false; a.bombarded = false; a.stormed = false; a.mp = MOVES;
    if (a.siege) { const p = P(a.siege); if (holds(fid, p.id) || !armyUsable(fid, a)) a.siege = null; else siegeAttrition(fid, a, p); }
  }
  F.popeUsed = false; F.proposed = false; F.moved = [];
}
function endTurn(fid) { const F = G.fac[fid]; if (F.bless > 0) F.bless--; if (F.excom > 0) F.excom--; }
function siegeAttrition(fid, a, p) {
  p.militia = 0;
  const f = fighters(p.gar);
  const g = armyGen(fid, a);
  let rate = isCap(p) ? 0.08 : 0.15;
  if (g && g.siege) rate += 0.05;
  const dg = genAt(p.owner, p.id); if (dg && dg.def) rate *= 0.75;
  let k = Math.ceil(f * rate); const killed = Math.min(k, f);
  while (k-- > 0) { for (const t of ['foot', 'bow', 'cav']) if (p.gar[t] > 0) { p.gar[t]--; break; } }
  damageWalls(p, 4 / Math.max(1, castleLv(p)));
  if (p.owner === G.player) note(`Siege of ${p.name}: hunger claims ${killed} of your men.`);
  else if (fid === G.player && killed) note(`Siege of ${p.name}: ${killed} defenders lost to hunger.`);
}
function plagueTick() {
  for (const p of provList()) {
    const pl = p.plague; if (!pl || pl.s <= 0) continue;
    const f = fighters(p.gar) + p.militia;
    const tended = p.owner && G.fac[p.owner].bishops >= 2;
    const k = killDefenders(p, Math.ceil(f * 0.07 * pl.s * (tended ? 0.5 : 1)));
    const b = besieging(p);
    let spread = '';
    if (b && Math.random() < 0.18 * pl.s) {
      const A = b.a; let lost = 0;
      for (const t of ['foot', 'bow', 'cav']) { const l = Math.ceil(A[t] * 0.08); A[t] -= l; lost += l; }
      if (lost) spread = ` The sickness spreads to the besiegers: ${FAC(b.fid).name} loses ${lost} men.`;
    }
    if ((k || spread) && (p.owner === G.player || p.ally === G.player || (b && b.fid === G.player))) note(`Plague in ${p.name}: ${k} dead${tended ? ' (your bishops tend the sick)' : ''}.${spread}`);
    pl.t--;
    if (pl.t <= 0) { pl.s--; pl.t = pl.s > 0 ? 2 : 0; }
    if (pl.s <= 0) p.plague = null;
  }
}
function endRound() {
  plagueTick();
  for (const p of provList()) {
    const s = besiegerOf(p);
    if (p.interdict > 0) p.interdict--;
    if (!s) {
      p.militia = Math.min(levyMax(p), p.militia + 1);
      if (p.b.castle && !p.ruined && p.walls < 100) p.walls = Math.min(100, p.walls + 8);
      if (!p.owner && !p.ally && G.turn % 2 === 1 && p.gar.foot < (p.r === 'fr' ? p.base + 2 : p.base * 2 + 4) && (p.b.castle || p.r !== 'fr')) p.gar.foot++;
      if (isCap(p) && fighters(p.gar) < Math.min(24, 10 + G.turn / 3)) { p.gar.foot++; if (G.turn % 2 === 1) p.gar.bow++; }
    }
  }
  G.truces = G.truces.filter(t => t.until > G.turn);
  for (const f of facIds()) { const F = G.fac[f]; if (F.warOn && F.warOn.until <= G.turn) F.warOn = null; }
  if (G.turn === TRUCE - 1) note('The Peace of God has expired. The great houses may now make war on each other.');
  if (Math.random() < 0.25) {
    const c = provList().filter(p => !p.owner && !p.heiress);
    if (c.length) { const p = pick(c); p.heiress = pick(LADIES); note(`Lady ${p.heiress} of ${p.name} is now of marrying age.`); }
  }
  if (G.turn % 8 === 7 && G.genPool.length < 4) {
    const used = new Set(G.genPool); facIds().forEach(f => G.fac[f].gens.forEach(g => used.add(g.id)));
    const back = GENERALS.filter(g => !used.has(g.id));
    if (back.length) { const g = pick(back); G.genPool.push(g.id); note(`${g.n} offers his sword to any lord who can pay.`); }
  }
  if (!G.over) { for (const f of alive()) unrestTick(f); maybeUnion(); }
  G.turn++;
}
function capture(p, fid) {
  const prev = p.owner, prevAlly = p.ally;
  if (prev) loseGeneral(prev, p.id, 'was taken in the fall of ' + p.name);
  p.owner = fid; p.ally = null; p.gar = eu(); p.militia = 0; p.heiress = null; p.build = null; p.plague = null; p.interdict = 0;
  for (const o in G.armies) for (const b of G.armies[o]) if (o !== fid && b.siege === p.id) { b.siege = null; b.loc = G.fac[o].alive ? nearestHeld(o, p.id) : null; }
  for (const o in G.armies) if (o !== fid && G.fac[o].alive) for (const b of G.armies[o]) if (b.loc === p.id && !b.siege && armySize(b) > 0) loseArmy(o, b, fid);
  if (prevAlly && prevAlly === G.player && fid !== G.player) report('An ally has fallen', `${FAC(fid).name} has taken ${p.name}. Your alliance there is ended.`);
  if (prev && p.cap === prev) collapse(prev, fid, p);
  checkVictory();
}

// ================= CAPTIVES & RANSOM =================
function loseArmy(fid, a, captor) {
  const F = G.fac[fid];
  a.foot = a.bow = a.cav = a.cat = 0; a.siege = null;
  a.loc = F.alive ? nearestHeld(fid, a.loc || homeOf(fid)) : null;
  if (a.id === 'a0') {
    const g = loseGeneral(fid, 'a0', 'fell with the army');
    if (F.alive && !F.captive) {
      F.captive = { by: captor || null, since: G.turn };
      const who = captor ? FAC(captor).name : 'his enemies';
      const txt = `${rulerOf(fid)} has been taken prisoner by ${who}. His own host cannot take the field until he is ransomed.${g ? ` ${g.n} fell in the battle.` : ''}`;
      if (fid === G.player) report('Your lord is captured!', txt + ' His captor may hold him for up to three turns; the price falls the longer he is held. Your generals\' armies can still fight.');
      else if (captor === G.player) report('A great prisoner', `${rulerOf(fid)} is your prisoner. You may hold him for up to three turns. A ransom offered after one turn is worth twice his house's income; after two, its full income; from the third turn on, half, and then you must accept.`);
      else note(txt);
    }
  } else {
    const g = loseGeneral(fid, a.id, 'died with his army');
    if (g && fid !== G.player && captor === G.player) note(`${g.n} of ${FAC(fid).name} died with his army.`);
    else if (g && fid === G.player) report('An army destroyed', `${g.n} died with his army. The slot can be raised again under a new general.`);
  }
}
const ransomHeld = fid => Math.max(1, G.turn - G.fac[fid].captive.since);
function ransomPrice(fid) {
  const held = ransomHeld(fid), m = held <= 1 ? 2 : held === 2 ? 1 : 0.5;
  return Math.max(15, Math.ceil(facIncome(fid) * m));
}
function payRansom(fid, sum) {
  const F = G.fac[fid], by = F.captive && F.captive.by;
  F.gold -= sum;
  if (by && G.fac[by] && G.fac[by].alive) G.fac[by].gold += sum;
  if (by === G.player) report('Ransom paid', `${FAC(fid).name} pays you ${sum} d for the return of ${rulerOf(fid)}.`);
  else if (fid === G.player) report('Your lord is free', `You pay ${sum} d and ${rulerOf(fid)} rides home.`);
  else note(`${FAC(fid).name} ransoms ${rulerOf(fid)} for ${sum} d.`);
  F.captive = null;
}
function offerRansom(fid) {
  const F = G.fac[fid], C = F.captive;
  if (!C) return null;
  const sum = ransomPrice(fid);
  if (F.gold < sum) return null;
  const by = C.by, held = ransomHeld(fid);
  if (by && G.fac[by] && G.fac[by].alive && held < 3) {
    if (by === G.player) { if (!G.offers.some(o => o.fid === fid)) G.offers.push({ fid, sum, held }); return 'pending'; }
    if (Math.random() > (held === 1 ? 0.45 : 0.7)) return 'refused';
  }
  payRansom(fid, sum);
  return 'paid';
}
function answerOffer(fid, accept) {
  const i = G.offers.findIndex(o => o.fid === fid); if (i < 0) return;
  const o = G.offers[i]; G.offers.splice(i, 1);
  const F = G.fac[o.fid];
  if (!F.captive) return;
  if (accept && F.gold >= o.sum) payRansom(o.fid, o.sum);
  else note(`You refuse ${FAC(o.fid).name}'s ransom and keep ${rulerOf(o.fid)} in your dungeon.`);
}

// ================= THE FALL OF A HOUSE =================
function freeMinor(p) {
  p.owner = null; p.ally = null; p.cap = null; p.build = null; p.interdict = 0;
  p.lord = `Castellan ${pick(PNAMES)}`;
  if (p.b.castle && fighters(p.gar) < 4) { p.gar.foot += 3; p.gar.bow += 1; }
  p.militia = levyMax(p);
}
function blocksOf(fid) {
  const left = new Set(owned(fid).map(p => p.id)), blocks = [];
  while (left.size) {
    const start = left.values().next().value, blk = [], q = [start]; left.delete(start);
    while (q.length) { const c = q.shift(); blk.push(c); for (const n of ADJ[c]) if (left.has(n)) { left.delete(n); q.push(n); } }
    blocks.push(blk);
  }
  return blocks.sort((a, b) => b.length - a.length);
}
function destroyHouse(lo, win) {
  const F = G.fac[lo];
  F.alive = false;
  owned(lo).forEach(freeMinor);
  allies(lo).forEach(q => { q.ally = null; });
  for (const a of armiesOf(lo)) { a.foot = a.bow = a.cav = a.cat = 0; a.siege = null; a.loc = null; }
  F.gens.forEach(g => G.genPool.push(g.id)); F.gens = [];
  for (const k in G.crowns) if (G.crowns[k] === lo) delete G.crowns[k];
  for (const f of facIds()) if (G.fac[f].captive && G.fac[f].captive.by === lo) G.fac[f].captive.by = null;
  G.offers = G.offers.filter(o => o.fid !== lo);
  if (G.diplo && G.diplo.from === lo) G.diplo = null;
  SEAS.forEach(s => { const f = G.fleets[s[0]]; if (f[lo]) { if (win) f[win] = (f[win] || 0) + f[lo]; f[lo] = 0; } });
  F.unrest = null; F.warOn = null;
}
function collapse(lo, win, seat) {
  const F = G.fac[lo], d = FAC(lo);
  const oldRuler = rulerOf(lo);
  // the conqueror takes the seat and every province of the loser beside it
  const taken = [seat.name];
  for (const n of ADJ[seat.id]) { const q = P(n); if (q.owner === lo) { q.owner = win; q.ally = null; q.build = null; q.gar = eu(); q.militia = 0; q.cap = null; loseGeneral(lo, q.id, 'was taken with ' + q.name); taken.push(q.name); for (const b of armiesOf(lo)) if (b.loc === q.id && !b.siege) { b.loc = null; } } }
  seat.cap = null;
  for (const b of armiesOf(lo)) if (b.loc && P(b.loc).owner === win) b.loc = null;
  const blocks = blocksOf(lo);
  const big = blocks[0] && blocks[0].length >= 4 && !F.fallen ? blocks[0] : null;
  if (big) {
    F.fallen = true;
    const newSeat = big.map(P).sort((a, b) => (castleLv(b) * 10 + b.base) - (castleLv(a) * 10 + a.base))[0];
    if (!newSeat.b.castle) { newSeat.b.castle = 1; newSeat.walls = 100; newSeat.ruined = false; }
    newSeat.cap = lo; d.home = newSeat.id;
    const old = d.pname;
    d.pname = `${pick(PNAMES)}, heir of ${old.split(',')[0].split(' ')[0]}`;
    d.title = FACMAP[lo] ? FACMAP[lo].title : 'Duke';
    for (const k in G.crowns) if (G.crowns[k] === lo) delete G.crowns[k];
    d.kingOf = [];
    F.gold = Math.floor(F.gold / 2);
    for (const a of armiesOf(lo)) { for (const t of ['foot', 'bow', 'cav', 'cat']) a[t] -= Math.round(a[t] * 0.3); if (!a.loc || !holds(lo, a.loc)) a.loc = newSeat.id; }
    if (F.captive) { /* the lord is still a prisoner; the heir rules in his name */ }
    const lost = [];
    for (const blk of blocks.slice(1)) for (const id of blk) { lost.push(P(id).name); loseGeneral(lo, id, 'went his own way'); freeMinor(P(id)); }
    for (const a of armiesOf(lo)) if (a.loc && !holds(lo, a.loc)) a.loc = newSeat.id;
    const txt = `${seat.name} has fallen to ${FAC(win).name}, who takes ${taken.join(', ')}. ${oldRuler}'s line does not end: ${d.pname} rallies the house at ${newSeat.name} with ${big.length} provinces${lost.length ? `, while ${lost.join(', ')} fall away to their own castellans` : ''}. The crowns of the house are vacant.`;
    if (lo === G.player) report('Your seat has fallen', txt + ' Half the treasury and a third of the army are lost. This can happen to a house only once.');
    else if (win === G.player) report(`${seat.name} is yours — but ${d.name} endures`, txt);
    else report(`The fall of ${seat.name}`, txt);
  } else {
    const n = owned(lo).length;
    destroyHouse(lo, win);
    const txt = `${seat.name} has fallen to ${FAC(win).name}, who takes ${taken.join(', ')}. ${oldRuler}'s house is destroyed${n ? `; its remaining ${n} province${n > 1 ? 's' : ''} fall to their own castellans` : ''}.`;
    if (lo === G.player || win === G.player) report(lo === G.player ? 'Your house has fallen' : `${d.name} is destroyed`, txt); else report(`${d.name} is destroyed`, txt);
  }
}
// a union absorbs a house peacefully: everything passes to the new king
function eliminate(lo, win, quiet) {
  G.fac[lo].alive = false;
  const n = owned(lo).length;
  owned(lo).forEach(q => { q.owner = win; });
  allies(lo).forEach(q => { q.ally = null; });
  const wa = lordArmy(win);
  for (const a of armiesOf(lo)) { if (quiet && wa) { wa.foot += a.foot; wa.bow += a.bow; wa.cav += a.cav; wa.cat += a.cat; } a.foot = a.bow = a.cav = a.cat = 0; a.siege = null; a.loc = null; }
  G.fac[lo].gens.forEach(g => G.genPool.push(g.id)); G.fac[lo].gens = [];
  for (const k in G.crowns) if (G.crowns[k] === lo) delete G.crowns[k];
  for (const f of facIds()) if (G.fac[f].captive && G.fac[f].captive.by === lo) G.fac[f].captive.by = null;
  G.offers = G.offers.filter(o => o.fid !== lo);
  SEAS.forEach(s => { const f = G.fleets[s[0]]; if (f[lo]) { f[win] = (f[win] || 0) + f[lo]; f[lo] = 0; } });
  for (const o in G.armies) for (const b of G.armies[o]) if (b.siege && P(b.siege).owner === o) b.siege = null;
  if (quiet) return;
  const msg = `${rulerOf(lo)}'s seat has fallen. ${FAC(win).name} takes all ${n + 1} of ${FAC(lo).name}'s provinces and its fleet.`;
  if (lo === G.player || win === G.player) report(lo === G.player ? 'Your house has fallen' : `${FAC(lo).name} is destroyed`, msg); else note(msg);
}
const frenchHeld = fid => FRANCE.filter(id => holds(fid, id)).length;
const empireHeld = fid => EMPIRE.filter(id => holds(fid, id)).length;
function checkVictory() {
  const al = alive();
  if (al.length === 1) { G.over = true; G.winner = al[0]; FAC(al[0]).emperor = true; return; }
  if (!G.fac[G.player].alive) G.over = true;
}

// ================= CROWNS =================
const CROWN_COST = 120;
const crownIncome = (fid, kid) => KINGDOMS[kid].list.filter(id => P(id).owner === fid).length * 2;
function crownProgress(fid, kid) { const K = KINGDOMS[kid]; return { have: K.list.filter(id => holds(fid, id)).length, keys: K.keys.filter(id => P(id).owner === fid).length }; }
function canCrown(fid, kid) {
  if (G.crowns[kid]) return false;
  const K = KINGDOMS[kid], pr = crownProgress(fid, kid);
  return pr.keys === K.keys.length && pr.have >= K.need;
}
function crown(fid, kid) {
  const F = G.fac[fid];
  if (!canCrown(fid, kid) || F.gold < CROWN_COST) return false;
  F.gold -= CROWN_COST; G.crowns[kid] = fid;
  const d = FAC(fid); d.kingOf = (d.kingOf || []).concat(kid); d.title = 'King';
  for (const id of KINGDOMS[kid].list) { const p = P(id); if (p.owner === fid) p.militia = levyMax(p); }
  const txt = `At ${KINGDOMS[kid].at}, ${d.pname} is crowned King of ${KINGDOMS[kid].n}. His provinces there pay more and raise double levies, his troops fight harder as the royal host, and the crown lets him field another army.`;
  if (fid === G.player) report('Long live the king!', txt); else report(`A new King of ${KINGDOMS[kid].n}`, txt);
  return true;
}

// ================= UNREST, REBELLION & UNIONS =================
function bfsOwned(fid, from, ok) {
  const d = { [from]: 0 }, q = [from];
  while (q.length) { const c = q.shift(); for (const n of ADJ[c]) if (!(n in d) && P(n).owner === fid && (!ok || ok(n))) { d[n] = d[c] + 1; q.push(n); } }
  return d;
}
const appeaseCost = fid => 40 + 4 * owned(fid).length;
const unrestCovered = fid => { const u = G.fac[fid].unrest; return !!u && armiesOf(fid).some(a => a.loc === u.seed && !a.siege && armySize(a) >= 8); };
function appease(fid) { const F = G.fac[fid]; if (!F.unrest || F.gold < F.unrest.cost) return false; F.gold -= F.unrest.cost; F.unrest = null; F.lastRebel = G.turn; return true; }
function unrestTick(fid) {
  const F = G.fac[fid], mine = owned(fid), n = mine.length;
  if (F.unrest) {
    if (!P(F.unrest.seed) || P(F.unrest.seed).owner !== fid) { F.unrest = null; return; }
    if (G.turn >= F.unrest.at) {
      if (unrestCovered(fid)) { if (fid === G.player) report('The unrest is quelled', `Your army at ${P(F.unrest.seed).name} overawes the malcontents. The lords there swear their loyalty once more.`); else note(`${FAC(fid).name}'s army quells the unrest at ${P(F.unrest.seed).name}.`); F.unrest = null; F.lastRebel = G.turn; }
      else rebel(fid);
    }
    return;
  }
  if (n < 10 || G.turn - F.lastRebel < 14) return;
  let ch = 0.04 + 0.006 * (n - 10);
  if (F.bishops >= 3) ch *= 0.7;
  if (Math.random() > ch) return;
  const cap = homeOf(fid), dist = bfsOwned(fid, cap);
  const cands = mine.filter(p => p.id !== cap && !armiesAt(p.id).some(x => x.fid === fid) && !besiegerOf(p)).sort((a, b) => (dist[b.id] ?? 99) - (dist[a.id] ?? 99)).slice(0, 3);
  if (!cands.length) return;
  const seed = pick(cands);
  F.unrest = { seed: seed.id, at: G.turn + 3, cost: appeaseCost(fid) };
  if (fid === G.player) report('Unrest in ' + seed.name, `The lords around ${seed.name} mutter against ${rulerOf(fid)}. Unless an army of at least 8 men stands in ${seed.name} by ${dateStr(F.unrest.at)}, or they are bought off for ${F.unrest.cost} d, they will rise in revolt and carry a quarter of the realm with them.`, { kind: 'appease' });
  else note(`Unrest stirs around ${seed.name} in ${FAC(fid).name}.`);
}
function rebel(fid) {
  const F = G.fac[fid], mine = owned(fid), n = mine.length, seedId = F.unrest.seed, seed = P(seedId);
  F.unrest = null; F.lastRebel = G.turn;
  const cap = homeOf(fid);
  const occupied = id => armiesAt(id).some(x => x.fid === fid);
  const k = Math.max(4, Math.round(n * 0.25));
  const grab = Object.keys(bfsOwned(fid, seedId, id => id !== cap && !occupied(id))).slice(0, k);
  if (grab.length < 4) return;
  const son = F.sons > 0;
  if (son) F.sons--;
  const parent = FAC(fid);
  const id = 'r' + (++G.newN);
  const def = { id, title: son ? 'Prince' : 'Duke', pname: son ? `${pick(PNAMES)}, son of ${parent.pname.split(' ')[0]}` : `${pick(PNAMES)} the Rebel`, name: seed.name, color: freshColor(), home: seedId, realm: 'Rebel',
    arms: { t: pick(ARMS_T), f: parent.arms.f, c: parent.arms.c, c2: parent.arms.c2 || '#e2b33c' }, kingOf: [], blurb: '', trait: '' };
  addFaction(def, seedId);
  for (const pid of grab) { const q = P(pid); q.owner = id; q.build = null; loseGeneral(fid, pid, 'went over to the rebels'); }
  if (!seed.b.castle) { seed.b.castle = 1; seed.walls = 100; seed.ruined = false; }
  seed.cap = id;
  const pw = totalArmyPower(fid) * 0.3, size = Math.max(6, Math.round(pw / 1.1));
  const R = lordArmy(id);
  R.foot = Math.round(size * 0.55); R.bow = Math.round(size * 0.25); R.cav = Math.round(size * 0.2); R.cat = 1;
  G.fac[id].gold = 120; G.fac[id].sons = 1; G.fac[id].lastRebel = G.turn;
  const txt = `${son ? `${def.pname.split(',')[0]}, a son of ${rulerOf(fid)},` : `${def.pname}, a great vassal of ${rulerOf(fid)},`} has risen in revolt. ${grab.length} provinces around ${seed.name} declare for him: ${grab.map(x => P(x).name).join(', ')}. Civil war!`;
  if (fid === G.player) report('Rebellion!', txt);
  else report(`Civil war in ${FAC(fid).name}`, txt);
}
const UNIONS = {
  fr: { name: 'France', pname: 'Hugh Capet', color: '#26408a', arms: { t: 'semy', f: '#26408a', c: '#e2b33c' } },
  de: { name: 'Germany', pname: 'Otto III', color: '#a2832a', arms: { t: 'cross', f: '#e2b33c', c: '#1d1d1d' } },
  it: { name: 'Italy', pname: 'Arduin of Ivrea', color: '#2f8f7f', arms: { t: 'perpale', f: '#2f8f7f', c: '#f2ead6' } },
  br: { name: 'Britain', pname: 'Kenneth of Alba', color: '#5a3f8f', arms: { t: 'bendCot', f: '#5a3f8f', c: '#f2ead6', c2: '#e2b33c' } },
};
function maybeUnion() {
  if (G.turn - G.lastUnion < 12) return;
  const counts = alive().map(f => [f, provList().filter(p => holds(f, p.id)).length]).sort((a, b) => b[1] - a[1]);
  if (!counts.length) return;
  const [L, lc] = counts[0];
  if (lc / PROV.length < 0.33) return;
  for (const region of ['fr', 'de', 'it', 'br']) {
    if (G.formed[region]) continue;
    const ps = provList().filter(p => p.r === region);
    const others = ps.filter(p => !holds(L, p.id));
    if (ps.length - others.length >= ps.length * 0.5 || others.length < 4) continue;
    formUnion(region, L, others);
    G.formed[region] = true; G.lastUnion = G.turn;
    return;
  }
}
function formUnion(region, L, others) {
  const U = UNIONS[region];
  // the strongest house seated in the region leads the union; otherwise a new king is elected. The player's house is never merged.
  const seated = alive().filter(f => f !== L && f !== G.player && P(homeOf(f)).r === region && P(homeOf(f)).owner === f).sort((a, b) => owned(b).length - owned(a).length);
  let kid;
  if (seated.length) { kid = seated[0]; const d = FAC(kid); d.name = U.name; }
  else {
    const homeP = others.filter(p => !p.owner || alive().includes(p.owner)).filter(p => p.owner !== G.player).sort((a, b) => (castleLv(b) * 10 + b.base) - (castleLv(a) * 10 + a.base))[0];
    if (!homeP) return;
    kid = 'u' + region;
    addFaction({ id: kid, title: 'King', pname: U.pname, name: U.name, color: U.color, home: homeP.id, realm: 'Union', arms: { ...U.arms }, kingOf: [], blurb: '', trait: '' }, homeP.id);
    if (!homeP.b.castle) { homeP.b.castle = 2; homeP.walls = 100; }
    homeP.cap = kid;
  }
  const merged = [];
  for (const f of seated.slice(1)) { merged.push(FAC(f).name); eliminate(f, kid, true); }
  for (const p of others) {
    if (p.owner === kid) continue;
    if (p.owner === G.player) continue;
    if (p.owner && p.owner !== L && p.cap === p.owner) continue;
    p.owner = kid; p.ally = null; p.build = null;
  }
  const rk = REGION_KINGDOM[region];
  const d = FAC(kid);
  if (rk && !G.crowns[rk]) { G.crowns[rk] = kid; d.kingOf = (d.kingOf || []).concat(rk); d.title = 'King'; }
  const A = lordArmy(kid);
  const pw = totalArmyPower(L) * 0.45, add = Math.max(12, Math.round(pw / 1.1));
  A.foot += Math.round(add * 0.5); A.bow += Math.round(add * 0.25); A.cav += Math.round(add * 0.25); A.cat += 2;
  if (!A.loc || P(A.loc).owner !== kid) A.loc = homeOf(kid);
  G.fac[kid].gold += 250;
  for (const p of owned(kid)) if (p.b.castle && fighters(p.gar) < 6) { p.gar.foot += 4; p.gar.bow += 2; }
  const txt = `Alarmed by the power of ${FAC(L).name}, the lords of ${REGION_NAME[region]} unite under ${rulerOf(kid)}${merged.length ? `, bringing in ${merged.join(' and ')}` : ''}. Every province of ${REGION_NAME[region]} not held by ${FAC(L).name}${L !== G.player ? ' or by you' : ''} now answers to ${d.name}.`;
  report(`The ${d.name === U.name ? 'kingdom of ' + U.name : d.name} rises`, txt);
}

// ================= THE CHURCH =================
const ROME_CARD = 6, CARD_COST = 80;
const cardsOf = fid => G.fac[fid].cardinals + (hasRome(fid) ? ROME_CARD : 0);
const totalCards = () => alive().reduce((a, f) => a + G.fac[f].cardinals, 0) + ROME_CARD;
const influence = fid => cardsOf(fid) / Math.max(1, totalCards());
const popeIsYours = fid => influence(fid) > 0.5;
function promote(fid) { const F = G.fac[fid]; if (F.bishops < 1 || F.gold < CARD_COST) return false; F.gold -= CARD_COST; F.bishops--; F.cardinals++; return true; }
const POPE = {
  bless: { c: 25, n: 'Bless our arms', d: 'Your troops fight 12% harder for 3 turns.' },
  merc: { c: 60, n: 'Papal mercenaries', d: '4 footmen and 2 cavalry join your largest army.' },
  absolve: { c: 40, n: 'Absolution', d: 'Lift your own excommunication.' },
  dispense: { c: 70, n: 'Dispensation to marry', d: 'Another son may marry: +1 unmarried son.' },
  excom: { c: 50, n: 'Excommunicate', d: 'Their troops fight 12% worse and they lose a quarter of their income for 3 turns.', who: 'house' },
  truce: { c: 60, n: 'Truce of God', d: 'Neither of you may attack the other for 4 turns.', who: 'house' },
  interdict: { c: 45, n: 'Interdict', d: 'The churches close: the province pays nothing for 4 turns.', who: 'province' },
};
const popeCost = (fid, a) => Math.ceil(POPE[a].c * (popeIsYours(fid) || hasRome(fid) ? 0.5 : 1));
function popeChance(fid, act, target) {
  if (popeIsYours(fid)) return 1;
  const inf = influence(fid) + 0.02 * Math.min(5, G.fac[fid].bishops);
  let c;
  if (act === 'excom') c = 0.25 + inf - 0.8 * influence(target) - (hasRome(target) ? 0.3 : 0);
  else if (act === 'interdict') { const o = P(target).owner; c = 0.3 + inf - (o ? 0.8 * influence(o) : 0); }
  else if (act === 'truce') c = recentPeace(fid, target) ? 0 : 0.3 + inf;
  else c = 0.45 + inf;
  return clamp(c, 0.05, 0.97);
}
function papal(fid, act, target) {
  const F = G.fac[fid], c = popeCost(fid, act);
  if (F.popeUsed || F.gold < c) return null;
  if (act === 'merc' && !usableArmies(fid).length) return null;
  if (act === 'absolve' && !F.excom) return null;
  F.gold -= c; F.popeUsed = true;
  const ok = Math.random() < popeChance(fid, act, target);
  const nm = FAC(fid).name;
  if (!ok) return `The Pope will not grant ${nm}'s petition (${POPE[act].n.toLowerCase()}). The gifts are kept all the same.`;
  switch (act) {
    case 'bless': F.bless = fid === 'burgundy' ? 5 : 3; return `The Pope blesses the banners of ${nm}.`;
    case 'merc': { const a = usableArmies(fid).sort((x, y) => armySize(y) - armySize(x))[0]; a.foot += 4; a.cav += 2; return `Papal mercenaries march to join ${armyName(fid, a)}.`; }
    case 'absolve': F.excom = 0; return `The Pope absolves ${rulerOf(fid)} and receives him back into the Church.`;
    case 'dispense': F.sons++; return `The Pope grants ${nm} a dispensation. Another son may now marry.`;
    case 'excom': G.fac[target].excom = 3; return `At the urging of ${nm}, the Pope excommunicates ${rulerOf(target)}!`;
    case 'truce': addTruce(fid, target, G.turn + 4); return `The Pope proclaims a Truce of God between ${nm} and ${FAC(target).name}. Neither may attack the other for 4 turns.`;
    case 'interdict': P(target).interdict = 4; return `The Pope lays ${P(target).name} under interdict. Its churches close and its people will pay nothing.`;
  }
}

// ================= COURTSHIP =================
// An heiress is won by making the best suit: standing, bride price, a promise of protection and a bishop's blessing.
const PRICES = [[0, 0], [40, 12], [80, 22], [150, 36]];
const PROTECT = { c: 32, pts: 12, men: 4 }, BISHOP_PTS = 10;
function prestige(fid, p) {
  const F = G.fac[fid], d = FAC(fid);
  return 20 + 15 * (d.kingOf || []).length + (adjTo(p, fid) ? 8 : 0) + (p.ally === fid ? 15 : 0) - (F.excom > 0 ? 15 : 0) + Math.min(10, owned(fid).length / 2);
}
const courtFloor = p => 32 + 2 * p.base;
function suitPoints(fid, p, o) { return prestige(fid, p) + PRICES[o.price][1] + (o.protect ? PROTECT.pts : 0) + (o.bishop ? BISHOP_PTS : 0); }
function suitCost(o) { return PRICES[o.price][0] + (o.protect ? PROTECT.c : 0); }
function courtRivals(fid, p) {
  return alive().filter(o => o !== fid && G.fac[o].sons > 0 && (adjTo(p, o) || p.ally === o || p.seas.some(z => coastIn(o, z))))
    .map(o => { const F = G.fac[o]; let tier = 0; for (let i = 3; i > 0; i--) if (F.gold >= PRICES[i][0] + 40) { tier = i; break; } return { fid: o, bid: suitPoints(o, p, { price: tier, protect: false, bishop: false }), tier }; })
    .sort((a, b) => b.bid - a.bid).slice(0, 2);
}
function openCourtship(fid, p) {
  const F = G.fac[fid];
  if (F.sons < 1 || F.proposed || !p.heiress || p.owner || G.court) return null;
  G.court = { fid, p: p.id, lady: p.heiress, round: 1, floor: courtFloor(p), prestige: prestige(fid, p), rivals: courtRivals(fid, p), last: null };
  return G.court;
}
// returns { ok, text, done }
function courtOffer(fid, o) {
  const C = G.court; if (!C || C.fid !== fid) return null;
  const p = P(C.p), F = G.fac[fid];
  const cost = suitCost(o);
  if (F.gold < cost || (o.bishop && F.bishops < 1)) return { ok: false, done: false, text: 'You cannot afford that suit.' };
  const pts = suitPoints(fid, p, o), best = C.rivals.length ? Math.max(...C.rivals.map(r => r.bid)) : -1;
  C.last = { o, pts };
  if (pts >= C.floor && pts > best) {
    F.gold -= cost; F.sons--; F.proposed = true;
    if (o.bishop) F.bishops--;
    if (o.protect) p.gar.foot += PROTECT.men;
    const lady = p.heiress; p.owner = fid; p.ally = null; p.heiress = null;
    G.court = null; checkVictory();
    return { ok: true, done: true, text: `Lady ${lady} of ${p.name} accepts the suit of ${FAC(fid).name} and weds a son of ${rulerOf(fid)}. ${p.name} joins the house without a sword drawn.` };
  }
  const why = pts < C.floor ? `Her guardians want a suit worth at least ${C.floor}; yours is worth ${pts}.` : `${FAC(C.rivals.find(r => r.bid === best).fid).name} has made a better offer (${best} to your ${pts}).`;
  if (C.round === 1) { C.round = 2; return { ok: false, done: false, text: `${why} You may raise your offer once.` }; }
  return finishCourt(fid, why);
}
function finishCourt(fid, why) {
  const C = G.court; if (!C) return null;
  const p = P(C.p), F = G.fac[fid]; F.proposed = true; G.court = null;
  const best = C.rivals.slice().sort((a, b) => b.bid - a.bid)[0];
  let text = `${why || ''} Lady ${C.lady} refuses the match from ${FAC(fid).name}.`;
  if (best && best.bid >= C.floor && Math.random() < 0.7) {
    const r = best.fid; G.fac[r].sons--; G.fac[r].gold = Math.max(0, G.fac[r].gold - PRICES[best.tier][0]);
    p.owner = r; p.ally = null; p.heiress = null;
    text += ` Worse, she marries into ${FAC(r).name} instead, and ${p.name} goes with her.`;
    checkVictory();
  } else text += ' She stays unwed for now.';
  return { ok: false, done: true, text };
}
function cancelCourt(fid) { const C = G.court; if (!C || C.fid !== fid) return; if (C.round === 2) { finishCourt(fid, ''); } else G.court = null; }
function aiCourt(fid, p) {
  const F = G.fac[fid];
  if (F.sons < 1 || F.proposed || !p.heiress || p.owner) return null;
  let tier = 0; for (let i = 3; i > 0; i--) if (F.gold >= PRICES[i][0] + 40) { tier = i; break; }
  const o = { price: tier, protect: F.gold >= PRICES[tier][0] + PROTECT.c + 40, bishop: false };
  const pts = suitPoints(fid, p, o), floor = courtFloor(p);
  F.proposed = true;
  if (pts < floor) return { ok: false, text: `${FAC(fid).name}'s suit for Lady ${p.heiress} of ${p.name} is refused.` };
  F.gold -= suitCost(o); F.sons--;
  if (o.protect) p.gar.foot += PROTECT.men;
  const lady = p.heiress; p.owner = fid; p.ally = null; p.heiress = null;
  checkVictory();
  return { ok: true, text: `Lady ${lady} of ${p.name} weds a son of ${rulerOf(fid)}. ${p.name} joins ${FAC(fid).name} without a sword drawn.` };
}

// ================= MARRIAGE PACTS, ENVOYS & ALLIANCE =================
const PACT_COST = 60, PACT_TURNS = 8, JOINT_TURNS = 10;
function pactChance(fid, t) {
  const r = (facIncome(fid) + 10) / (facIncome(t) + 10);
  return clamp(0.25 + 0.25 * r + 0.05 * Math.min(3, G.fac[fid].bishops) - (G.fac[t].sons > 0 ? 0 : 0.2), 0.1, 0.85);
}
const canPact = (fid, t) => t !== fid && G.fac[t] && G.fac[t].alive && G.fac[fid].sons > 0 && !G.fac[fid].proposed && !atPeace(fid, t) && !recentPeace(fid, t);
function marriagePact(fid, t) {
  const F = G.fac[fid];
  if (!canPact(fid, t) || F.gold < PACT_COST) return null;
  F.gold -= PACT_COST; F.proposed = true;
  if (Math.random() < pactChance(fid, t)) {
    F.sons--; addTruce(fid, t, G.turn + PACT_TURNS, true);
    return { ok: true, text: `A son of ${rulerOf(fid)} marries a daughter of ${rulerOf(t)}. The two houses are bound in peace for ${PACT_TURNS} turns.` };
  }
  return { ok: false, text: `${rulerOf(t)} refuses a marriage with ${FAC(fid).name}. The gifts are kept.` };
}
// an envoy from a computer house to the player
function diploOffer(from, kind, target, gift) {
  if (G.diplo || recentPeace(from, G.player) || atPeace(from, G.player)) return false;
  const id = 'd' + (++G.newN);
  G.diplo = { id, from, kind, target: target || null, gift: gift || 0, turn: G.turn };
  const nm = FAC(from).name;
  if (kind === 'pact') report(`An envoy from ${nm}`, `${rulerOf(from)} offers a marriage between the houses${gift ? `, with ${gift} d in gifts` : ''}: peace between you for ${PACT_TURNS} turns. The envoy waits until the end of the turn.`, { kind: 'diplo', id });
  else report(`An envoy from ${nm}`, `${rulerOf(from)} proposes a war against ${FAC(target).name}${gift ? `, and sends ${gift} d to seal it` : ''}. Accept and the two of you are bound in peace for ${JOINT_TURNS} turns while ${nm} turns its armies on ${FAC(target).name}. The envoy waits until the end of the turn.`, { kind: 'diplo', id });
  return true;
}
function answerDiplo(id, yes) {
  const D = G.diplo; if (!D || D.id !== id) return null;
  G.diplo = null;
  const F = G.fac[D.from]; if (!F || !F.alive) return null;
  if (!yes) { note(`You send ${FAC(D.from).name}'s envoy away.`); return { ok: false }; }
  G.fac[G.player].gold += D.gift; F.gold = Math.max(0, F.gold - D.gift);
  if (D.kind === 'pact') { if (F.sons > 0) F.sons--; addTruce(D.from, G.player, G.turn + PACT_TURNS, true); note(`A marriage binds ${FAC(D.from).name} and your house in peace for ${PACT_TURNS} turns.`); }
  else { addTruce(D.from, G.player, G.turn + JOINT_TURNS, true); F.warOn = { target: D.target, until: G.turn + JOINT_TURNS }; note(`You and ${FAC(D.from).name} make common cause against ${FAC(D.target).name}.`); }
  return { ok: true };
}
const allyCost = (fid, p) => Math.round((40 + 10 * p.base + 3 * fighters(p.gar)) * (foreign(fid) && p.r === 'fr' ? 2 : 1));
const canAlly = (fid, p) => !p.owner && !p.ally && (adjTo(p, fid) || p.seas.some(z => coastIn(fid, z))) && !besiegerOf(p);
function makeAlly(fid, p) {
  const F = G.fac[fid], c = allyCost(fid, p);
  if (!canAlly(fid, p) || F.gold < c) return false;
  F.gold -= c; p.ally = fid;
  checkVictory();
  return true;
}

// ================= SAVE =================
function save() { try { localStorage.setItem(SK, JSON.stringify(G)); } catch (e) { } }
function loadSave() { try { const s = localStorage.getItem(SK); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function clearSave() { try { localStorage.removeItem(SK); } catch (e) { } }
