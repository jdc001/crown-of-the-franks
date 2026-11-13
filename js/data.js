'use strict';
// ================= UTIL =================
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
// the date of a turn, on this map or another (for saves made on another map)
const dateIn = (id, t) => { const D = ((typeof MAPS !== 'undefined' && MAPS[id || 'france']) || SC).date; return SEASONS[(t + D.s0) % 4] + ' ' + (D.y0 + Math.floor((t + D.yOff) / 4)); };
const dateStr = t => dateIn(MAP_ID, t);

// the chosen map's houses, counties, coasts and captains (see js/map-*.js)
const SC = MAPS[MAP_ID] || MAPS.france;
const FACTIONS = SC.FACTIONS;
const PROV = SC.PROV;
const REGION_NAME = SC.REGION_NAME;
const SEA_ROUTES = SC.SEA_ROUTES;
const EDGES = SC.EDGES;
const SEA_LABELS = SC.SEA_LABELS;
const GENERALS = SC.GENERALS;
const LADIES = SC.LADIES;
const FACMAP = Object.fromEntries(FACTIONS.map(f => [f.id, f]));
function FAC(id) { return (G && G.fmap && G.fmap[id]) || FACMAP[id]; }


// ================= UNITS & BUILDINGS =================
// Attack and hit points per company. Value per denier is roughly even; each does a different job.
const UNIT = {
  foot: { n: 'Footmen', c: 8, i: '🛡️', atk: 3, hp: 10, d: 'Spearmen. Form a shield wall when defensive, or advance as a deep line when aggressive.' },
  bow: { n: 'Bowmen', c: 10, i: '🏹', atk: 1, rng: 3, hp: 6, d: 'Wear the enemy down at long range as they close. Weak in a melee and easy prey for horse.' },
  cav: { n: 'Cavalry', c: 20, i: '🐎', atk: 5, chg: 10, hp: 14, d: 'Milites. Fight the enemy horse on the wings, then ride round to strike the rear.' },
  cat: { n: 'Catapults', c: 25, i: '🪨', rng: 6, hp: 0, d: 'Three shots each when bombarding. In a garrison they shoot from the walls.' },
  bishop: { n: 'Bishops', c: 30, i: '✝️', d: 'Sit in your council of bishops. Can be raised to cardinal.' },
};
const LEVY = { atk: 2, hp: 6 };
const ICON = { militia: '🧑‍🌾', foot: '🛡️', bow: '🏹', cav: '🐎', cat: '🪨', bishop: '✝️' };
const LBL = { militia: 'Levy', foot: 'Footmen', bow: 'Bowmen', cav: 'Cavalry', cat: 'Catapults', bishop: 'Bishops' };
const BLD = {
  farm: { n: 'Farms', c: 25, t: 2, y: 4, i: '🌾' },
  market: { n: 'Market town', c: 45, t: 3, y: 7, i: '⚖️' },
  port: { n: 'Port', c: 45, t: 3, y: 7, i: '⚓', need: 'coast' },
  mine: { n: 'Mine', c: 40, t: 3, y: 6, i: '⛏️', need: 'hills' },
  castle: { n: 'Castle', c: 60, t: 3, y: 0, i: '🏰' },
  moat: { n: 'Moat', c: 50, t: 2, y: 0, i: '〰️', d: 'Slows attackers under fire and weakens them at the walls.' },
  forge: { n: 'Forge', c: 220, t: 5, y: 0, i: '⚒️', realm: true, d: 'Mail for your men: +15% hit points for all your troops.' },
  armory: { n: 'Armory', c: 220, t: 5, y: 0, i: '⚔️', realm: true, d: 'Better swords and spears: +15% attack for all your troops.' },
  stables: { n: 'Royal stables', c: 200, t: 5, y: 0, i: '🐴', realm: true, d: 'Bred warhorses: cavalry +25% attack and charge.' },
};
const CASTLE_N = ['No castle', 'Wooden castle', 'Stone castle', 'Great walls'];
// a wooden castle goes up in a season: a cheap foothold, but its palisade barely slows an assault
const CASTLE_C = [35, 90, 140], CASTLE_T = [1, 3, 4];
const FIGHT = ['militia', 'foot', 'bow', 'cav'];
const MAXLV = 2, TRUCE = SC.truce, MOVES = 2;
const UPKEEP = { foot: 1, bow: 1, cav: 2.5, cat: 2 };
const PACT_TURNS_JOINT = 10;
const ROMAN = ['', '', ' II'];

const GENMAP = Object.fromEntries(GENERALS.map(g => [g.id, g]));
function genSummary(g) {
  const t = [];
  if (g.atk) t.push(`${g.atk > 0 ? '+' : ''}${Math.round(g.atk * 100)}% attack`);
  if (g.def) t.push(`${g.def > 0 ? '+' : ''}${Math.round(g.def * 100)}% defence`);
  if (g.foot) t.push(`+${Math.round(g.foot * 100)}% footmen`);
  if (g.bow) t.push(`+${Math.round(g.bow * 100)}% bowmen`);
  if (g.cav) t.push(`+${Math.round(g.cav * 100)}% cavalry`);
  if (g.morale) t.push('steadier morale');
  if (g.siege) t.push('siege expert: +1 shot per catapult, faster starvation');
  return t.join(' · ');
}

// ================= GEOGRAPHY =================
const LON0 = SC.geo.LON0;
const LAT1 = SC.geo.LAT1;
const SX = SC.geo.SX;
const SY = SC.geo.SY;
const MW = SC.geo.MW;
const MH = SC.geo.MH;
const px = lon => (lon - LON0) * SX + 10, py = lat => (LAT1 - lat) * SY + 10;
const LL = ([a, b]) => [px(a), py(b)];
const LANDS = SC.geo.lands.map(a => a.map(LL));
const CONT = LANDS[0];
const SEA_POLYS = SC.geo.seas.map(a => a.map(LL));
const ISLES = (SC.geo.isles || []).map(a => a.map(LL));
const pathOf = pts => 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z';
function inPoly(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi)) c = !c;
  }
  return c;
}
const onLand = pt => LANDS.some(L => inPoly(pt, L));
function clipHalf(poly, a, b) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = b[0] - a[0], ny = b[1] - a[1];
  const f = p => (p[0] - mx) * nx + (p[1] - my) * ny;
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length], fp = f(P), fq = f(Q);
    if (fp <= 0) out.push(P);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); }
  }
  return out;
}
function voronoi(seeds) {
  return seeds.map((s, i) => {
    let poly = [[-200, -200], [MW + 200, -200], [MW + 200, MH + 200], [-200, MH + 200]];
    seeds.forEach((t, j) => { if (i !== j) poly = clipHalf(poly, s, t); });
    return poly;
  });
}
// the edge lands take part in the Voronoi so the counties stop at the kingdom's borders
const SEEDS = PROV.map(r => LL([r[2], r[3]]));
const EDGE_SEEDS = EDGES.map(e => LL([e[2], e[3]]));
const ALLCELLS = voronoi(SEEDS.concat(EDGE_SEEDS));
const CELLS = ALLCELLS.slice(0, PROV.length), EDGE_CELLS = ALLCELLS.slice(PROV.length);
const CELLD = {};
PROV.forEach((r, i) => CELLD[r[0]] = pathOf(CELLS[i]));
const EDGE_CELLD = EDGES.map((e, i) => pathOf(EDGE_CELLS[i]));
const ADJ = {};
PROV.forEach(r => ADJ[r[0]] = []);
for (let i = 0; i < PROV.length; i++) for (let j = i + 1; j < PROV.length; j++) {
  const a = SEEDS[i], b = SEEDS[j];
  const vs = CELLS[i].filter(v => Math.abs(Math.hypot(v[0] - a[0], v[1] - a[1]) - Math.hypot(v[0] - b[0], v[1] - b[1])) < 0.6);
  if (vs.length < 2) continue;
  let best = null, bd = -1;
  for (let m = 0; m < vs.length; m++) for (let n = m + 1; n < vs.length; n++) { const d = Math.hypot(vs[m][0] - vs[n][0], vs[m][1] - vs[n][1]); if (d > bd) { bd = d; best = [vs[m], vs[n]]; } }
  let inside = 0;
  for (let k = 1; k < 30; k++) { const t = k / 30; if (onLand([best[0][0] + (best[1][0] - best[0][0]) * t, best[0][1] + (best[1][1] - best[0][1]) * t])) inside++; }
  if (inside >= 2) { ADJ[PROV[i][0]].push(PROV[j][0]); ADJ[PROV[j][0]].push(PROV[i][0]); }
}
for (const [a, b] of SEA_ROUTES) { ADJ[a].push(b); ADJ[b].push(a); }
for (const k in ADJ) ADJ[k] = [...new Set(ADJ[k])];
const seaRoute = (a, b) => SEA_ROUTES.some(r => (r[0] === a && r[1] === b) || (r[0] === b && r[1] === a));
// the kingdom whose crown is fought for: its counties, and the one crown (internally always 'franks')
const FRANCE = PROV.filter(r => SC.kingdom.regions.includes(r[10])).map(r => r[0]);
const EMPIRE = FRANCE;
const KINGDOMS = { franks: { n: SC.kingdom.n, short: SC.kingdom.short, keys: SC.kingdom.keys, need: 0, at: SC.kingdom.at, list: FRANCE } };
const KPROV = {};
for (const id of FRANCE) KPROV[id] = ['franks'];
const REGION_KINGDOM = {};
// steps between any two counties, for a prince's reach
const HOPS = {};
for (const r of PROV) { const d = { [r[0]]: 0 }, q = [r[0]]; while (q.length) { const c = q.shift(); for (const n of ADJ[c]) if (!(n in d)) { d[n] = d[c] + 1; q.push(n); } } HOPS[r[0]] = d; }
