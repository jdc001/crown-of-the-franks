'use strict';
// ================= STATISTICS, HISTORY, RANKS AND TROPHIES =================
// During a game: a snapshot of every house each turn (counties, silver, men, and who owns each county, for the
// time-lapse), plus counters for the player. At the end: a summary goes into the history kept on this device,
// trophies are checked, and rank points are added to the profile.
const HIST_KEY = 'cotf-history', PROF_KEY = 'cotf-profile';

// ---------- recording ----------
function statsInit() {
  G.stats = { own: [], h: {}, me: { won: 0, lost: 0, defWon: 0, defLost: 0, menLost: 0, kills: 0, taken: 0, castlesTaken: 0, seats: 0, lords: 0, ransoms: 0, ransomGold: 0, ransomPaid: 0, castles: 0, pacts: 0, alliances: 0, heiresses: 0, charters: 0, caught: 0, fairProfit: 0, mines: 0, raids: 0, almanzor: 0, ratBest: 0, oilBest: 0, peakC: 0, peakG: 0, peakM: 0, lowC: 99, used3: false, captured: false, maxPacts: 0, crownedAt: null, crownedSmall: false, usurped: false, keptCrown: true } };
  statsSnap();
}
const SM = () => (G && G.stats ? G.stats.me : null);
function statInc(k, n = 1) { const m = SM(); if (m) m[k] = (m[k] || 0) + n; }
// one character per county: the owner's place in fdefs, or '.' for an independent lord
const OWN_CH = i => String.fromCharCode(48 + i);
function statsSnap() {
  if (!G.stats) { statsInit(); return; }
  const idx = {}; G.fdefs.forEach((d, i) => { idx[d.id] = i; });
  G.stats.own[G.turn] = PROV.map(r => { const p = P(r[0]); return p.owner ? OWN_CH(idx[p.owner]) : '.'; }).join('');
  for (const d of G.fdefs) {
    const F = G.fac[d.id]; if (!F) continue;
    const H = G.stats.h[d.id] = G.stats.h[d.id] || { c: [], g: [], m: [] };
    H.c[G.turn] = F.alive ? owned(d.id).length : 0; H.g[G.turn] = F.alive ? Math.round(F.gold) : 0; H.m[G.turn] = F.alive ? totalMen(d.id) : 0;
  }
  const m = G.stats.me, me_ = G.player, n = owned(me_).length;
  m.peakC = Math.max(m.peakC, n); m.peakG = Math.max(m.peakG, Math.round(G.fac[me_].gold)); m.peakM = Math.max(m.peakM, totalMen(me_));
  if (G.turn >= 8 && G.fac[me_].alive) m.lowC = Math.min(m.lowC, n);
  if (usableArmies(me_).filter(a => armySize(a) > 0).length >= 3) m.used3 = true;
  m.maxPacts = Math.max(m.maxPacts, alive().filter(f => f !== me_ && atPeace(me_, f)).length);
  if (G.player === SC.crown.start && king() !== SC.crown.start) m.keptCrown = false;
}
// ---------- hooks into the rules ----------
(function hookStats() {
  const wrap = (name, fn) => { const orig = window[name]; if (typeof orig !== 'function') return; window[name] = function (...a) { return fn(orig, ...a); }; };
  wrap('newGame', (o, ...a) => { const r = o(...a); statsInit(); return r; });
  wrap('endRound', (o, ...a) => { const r = o(...a); statsSnap(); return r; });
  wrap('resolveAssault', (o, fid, A, p, res, cfg) => {
    const def = p.owner || p.ally, r = o(fid, A, p, res, cfg);
    if (fid === G.player) { statInc(res.won ? 'won' : 'lost'); statInc('menLost', Math.max(0, fighters(cfg.A) - fighters(res.A))); statInc('kills', Math.max(0, fighters(cfg.D) - fighters(res.D))); }
    else if (def === G.player) { statInc(res.won ? 'defLost' : 'defWon'); statInc('menLost', Math.max(0, fighters(cfg.D) - fighters(res.D))); statInc('kills', Math.max(0, fighters(cfg.A) - fighters(res.A))); }
    return r;
  });
  wrap('resolveRelief', (o, fid, A, p, res, cfg) => {
    const r = o(fid, A, p, res, cfg);
    if (fid === G.player) { statInc(res.won ? 'won' : 'lost'); statInc('menLost', Math.max(0, fighters(cfg.A) - fighters(res.A))); statInc('kills', Math.max(0, fighters(cfg.D) - fighters(res.D))); }
    else if (cfg.besieger === G.player) { statInc(res.won ? 'defLost' : 'defWon'); statInc('menLost', Math.max(0, fighters(cfg.D) - fighters(res.D))); statInc('kills', Math.max(0, fighters(cfg.A) - fighters(res.A))); }
    return r;
  });
  wrap('capture', (o, p, fid) => {
    const seat = isCap(p), castle = !!p.b.castle, prev = p.owner;
    const r = o(p, fid);
    if (fid === G.player) { statInc('taken'); if (castle) statInc('castlesTaken'); if (seat && prev) statInc('seats'); }
    return r;
  });
  wrap('loseArmy', (o, fid, a, captor) => {
    const was = !!G.fac[fid].captive, r = o(fid, a, captor);
    if (a.id === 'a0' && !was && G.fac[fid].captive) { if (captor === G.player) statInc('lords'); if (fid === G.player && SM()) SM().captured = true; }
    return r;
  });
  wrap('payRansom', (o, fid, sum) => {
    const by = G.fac[fid].captive && G.fac[fid].captive.by, r = o(fid, sum);
    if (by === G.player) { statInc('ransoms'); statInc('ransomGold', sum); } else if (fid === G.player) statInc('ransomPaid', sum);
    return r;
  });
  wrap('crown', (o, fid, k) => {
    const old = king(), r = o(fid, k);
    if (r && fid === G.player && SM()) { const m = SM(); m.crownedAt = G.turn; if (owned(fid).length < 12) m.crownedSmall = true; if (old && old !== fid) m.usurped = true; }
    return r;
  });
  wrap('signPact', (o, kind) => { const n = G.truces.length, r = o(kind); if (G.truces.length > n) statInc(kind === 'ally' ? 'alliances' : 'pacts'); return r; });
  wrap('signWar', (o, ...a) => { const n = G.truces.length, r = o(...a); if (G.truces.length > n) statInc('pacts'); return r; });
  wrap('courtOffer', (o, fid, x) => { const pid = G.court && G.court.p, before = pid && P(pid).owner; const r = o(fid, x); if (fid === G.player && pid && before !== G.player && P(pid).owner === G.player) statInc('heiresses'); return r; });
  wrap('charterReport', (o, p, q, res) => { if (res === 'ok') statInc('charters'); else if (res === 'caught') statInc('caught'); return o(p, q, res); });
  wrap('closeFair', (o) => { const stake = FR ? FR.stake : 0, g0 = G.fac[me()].gold; const r = o(); statInc('fairProfit', Math.max(0, G.fac[me()].gold - g0 - stake)); return r; });
  wrap('autoFair', (o, stake) => { const g0 = G.fac[me()].gold; const r = o(stake); statInc('fairProfit', Math.max(0, G.fac[me()].gold - g0)); return r; });
  wrap('mineOutcome', (o, p, A, reached, ...a) => { if (reached) statInc('mines'); return o(p, A, reached, ...a); });
  wrap('raidOutcome', (o, repelled, plundered, lost) => { if (repelled > 0 && !plundered) statInc('raids'); return o(repelled, plundered, lost); });
  wrap('almanzorStrike', (o, p, n) => { const own = p.owner; const r = o(p, n); if (own === G.player && r && !r.won) statInc('almanzor'); return r; });
  wrap('finishCatapult', (o) => { if (CT && SM()) { const m = SM(); m.ratBest = Math.max(m.ratBest, CT.ratKills || 0); m.oilBest = Math.max(m.oilBest, CT.oilKills || 0); } return o(); });
})();

// ---------- history and profile on this device ----------
const loadJ = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const saveJ = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
const gameHistory = () => loadJ(HIST_KEY, []);
let PROF_C = null;
function profile() { if (PROF_C) return JSON.parse(PROF_C); const p = loadJ(PROF_KEY, null) || {}; p.points = p.points || 0; p.trophies = p.trophies || {}; p.games = p.games || 0; p.arms = p.arms || { t: 'cross', f: '#26408a', c: '#e2b33c' }; p.look = p.look || {}; PROF_C = JSON.stringify(p); return p; }
const saveProfile = p => { PROF_C = null; saveJ(PROF_KEY, p); };

// a career travels inside exported saves: on import, trophies and games are merged, never lost
function careerPack() { return { profile: profile(), history: gameHistory() }; }
function careerMerge(c) {
  if (!c || !c.profile) return false;
  const P = profile(), Q = c.profile; let changed = false;
  for (const id in (Q.trophies || {})) if (!P.trophies[id]) { P.trophies[id] = Q.trophies[id]; changed = true; }
  const H = gameHistory(), seen = new Set(H.map(g => g.when));
  for (const g of (c.history || [])) if (!seen.has(g.when)) { H.push(g); changed = true; }
  H.sort((a, b) => a.when - b.when);
  if (changed) {
    // points are recounted from what is now held, so nothing is counted twice
    P.points = Object.keys(P.trophies).reduce((s, id) => { const t = TROPHIES.find(x => x.id === id); return s + (t ? t.pts : 0); }, 0) + H.reduce((s, g) => s + (g.won ? 30 + (g.diff === 'hard' ? 20 : g.diff === 'gentle' ? 0 : 10) : 8), 0);
    P.games = H.length; if (Q.arms && !gameHistory().length) { P.arms = Q.arms; P.look = Q.look || {}; }
    saveProfile(P); saveJ(HIST_KEY, H);
  }
  return changed;
}
// ---------- ranks ----------
const RANKS = [
  { id: 'seigneur', n: 'Seigneur', at: 0, col: '#8a6a3a', unlock: 'Your own coat of arms' },
  { id: 'baron', n: 'Baron', at: 60, col: '#9aa3ad', unlock: "A baron's coronet and a silver border" },
  { id: 'viscount', n: 'Viscount', at: 160, col: '#3d7a4a', unlock: 'Supporters: lions or hounds' },
  { id: 'count', n: 'Count', at: 300, col: '#2f5aa8', unlock: "A count's coronet, and stags or wolves as supporters" },
  { id: 'marquis', n: 'Marquis', at: 480, col: '#7a3f8f', unlock: 'A laurel wreath, and griffins' },
  { id: 'duke', n: 'Duke', at: 700, col: '#a3222c', unlock: "A ducal coronet, a mantle of estate, and unicorns" },
  { id: 'king', n: 'King', at: 960, col: '#e2b33c', unlock: 'A royal crown, an ermine mantle, and eagles' },
  { id: 'emperor', n: 'Emperor', at: 1260, col: '#5a1f6e', unlock: 'The imperial crown and golden laurels' },
];
const rankOf = pts => { let r = 0; RANKS.forEach((k, i) => { if (pts >= k.at) r = i; }); return r; };
const rankNow = () => RANKS[rankOf(profile().points)];

// ---------- trophies ----------
// test(S, P) gets the game summary and the profile; points are worth more the stranger the feat
const HOUSE_TROPHY = { capet: ['The Capetian line', 25], charles: ['Last of the Carolingians', 30], normandy: ['Duke of the Northmen', 25], flanders: ['The Lion of Flanders', 25], champagne: ['Count of the Fairs', 25], blois: ['Between the Lions', 30], anjou: ['The Black Count', 25], brittany: ['Breton Kingship', 40], aquitaine: ['Lord of the South-West', 30], burgundy: ['The Burgundian Crown', 25], toulouse: ['The Raymondine Throne', 30], barcelona: ['Count of the March', 25], gascony: ['Basque Crown', 40], provence: ['From Beyond the Rhône', 40], roussillon: ['Lord of the Coast Road', 40] };
const HOUSE_TROPHY_1066 = { wessex: ['The Last Saxon King', 25], eastanglia: ['Earl of the Fens', 35], mercia: ['The Mercian Revival', 30], northumbria: ['King in the North', 30], normandy: ['The Conqueror', 25], boulogne: ['Across the Narrow Sea', 35],
  norway: ['The Last Viking', 30], orkney: ['Jarl of England', 40], isles: ['Sea-King of England', 40], scotland: ['Canmore Triumphant', 35], gwynedd: ['The Red Dragon', 40], leinster: ['From Ferns to Westminster', 40], munster: ['Brian Boru Avenged', 40], connacht: ['The Gapped Spear', 45], ulaid: ['The Hound of Ulster', 45] };
const HOUSE_TROPHY_1002 = { bavaria: ['The Holy Lance', 25], swabia: ['Hermann Triumphant', 30], saxony: ['The Saxon King', 30], meissen: ['Avenged at Pöhlde', 40], carinthia: ['The Salian Dawn', 30], lorraine: ["Charlemagne's Heir", 35],
  upperlorraine: ['The Duke of Bar', 40], poland: ['Rex Poloniae', 35], bohemia: ['The Czech Crown', 40], ivrea: ['Two Crowns', 40], canossa: ['The Rock of Canossa', 40], crescentii: ['Rome Rules', 45], benevento: ['The Lombard Crown', 50], salerno: ['From Salerno to Mainz', 50] };
const TROPHIES = [
  ...Object.keys(HOUSE_TROPHY).map(h => ({ id: 'win_' + h, n: HOUSE_TROPHY[h][0], d: `Win as ${MAPS.france.FACTIONS.find(f => f.id === h).name}.`, pts: HOUSE_TROPHY[h][1], kind: 'house', test: S => S.won && S.house === h && (S.map || 'france') === 'france' })),
  ...Object.keys(HOUSE_TROPHY_1066).map(h => ({ id: 'win66_' + h, n: HOUSE_TROPHY_1066[h][0], d: `Win as ${MAPS.britain.FACTIONS.find(f => f.id === h).name}, in 1066.`, pts: HOUSE_TROPHY_1066[h][1], kind: 'house', test: S => S.won && S.house === h && S.map === 'britain' })),
  ...Object.keys(HOUSE_TROPHY_1002).map(h => ({ id: 'win02_' + h, n: HOUSE_TROPHY_1002[h][0], d: `Win as ${MAPS.empire.FACTIONS.find(f => f.id === h).name}, in 1002.`, pts: HOUSE_TROPHY_1002[h][1], kind: 'house', test: S => S.won && S.house === h && S.map === 'empire' })),
  { id: 'first', n: 'Anointed', d: 'Win your first game.', pts: 20, test: S => S.won },
  { id: 'conquest', n: 'Hammer of the Franks', d: 'Win by breaking every rival house.', pts: 60, test: S => S.won && S.how === 'conquest' },
  { id: 'swift', n: 'Swift Succession', d: 'Win within eighteen years of the start.', pts: 50, test: S => S.won && S.year - (MAPS[S.map || 'france'] || MAPS.france).date.y0 < 18 },
  { id: 'hard', n: 'Against the Odds', d: 'Win against Hard rivals.', pts: 60, test: S => S.won && S.diff === 'hard' },
  { id: 'two', n: 'Two Hosts Suffice', d: 'Win without ever fielding a third army.', pts: 40, test: S => S.won && !S.m.used3 },
  { id: 'untaken', n: 'Never Taken', d: 'Win without your lord ever being captured.', pts: 25, test: S => S.won && !S.m.captured },
  { id: 'ransom3', n: "A King's Ransom", d: 'Collect ransoms for three lords in one game.', pts: 40, test: S => S.m.ransoms >= 3 },
  { id: 'broker', n: 'Ransom Broker', d: 'Collect 500 d in ransoms in one game.', pts: 40, test: S => S.m.ransomGold >= 500 },
  { id: 'piper', n: 'The Pied Piper', d: 'Rats kill 15 defenders in a single bombardment.', pts: 30, test: S => S.m.ratBest >= 15 },
  { id: 'fire', n: 'Greek Fire', d: 'Flaming oil kills 12 defenders in a single bombardment.', pts: 25, test: S => S.m.oilBest >= 12 },
  { id: 'sapper', n: 'Sapper', d: 'Bring down walls with a mine three times in one game.', pts: 25, test: S => S.m.mines >= 3 },
  { id: 'forger', n: 'The Forger', d: 'Five forged charters accepted, and none exposed, in one game.', pts: 40, test: S => S.m.charters >= 5 && !S.m.caught },
  { id: 'merchant', n: 'Merchant Prince', d: 'Make 200 d profit at the summer fair in one game.', pts: 30, test: S => S.m.fairProfit >= 200 },
  { id: 'beach', n: 'Shield Wall on the Beach', d: 'Drive off three Viking raids in one game.', pts: 30, test: S => S.m.raids >= 3 },
  { id: 'almanzor', n: 'Bane of Almanzor', d: 'Throw back an army of Almanzor.', pts: 40, test: S => S.m.almanzor >= 1 },
  { id: 'wives', n: 'A Marriage Policy', d: 'Marry three heiresses in one game.', pts: 30, test: S => S.m.heiresses >= 3 },
  { id: 'web', n: 'A Web of Treaties', d: 'Be at peace with four houses at once.', pts: 25, test: S => S.m.maxPacts >= 4 },
  { id: 'brothers', n: 'Brothers in Arms', d: 'Win while allied to another house.', pts: 25, test: S => S.won && S.alliedAtEnd },
  { id: 'seats', n: 'Breaker of Seats', d: 'Take five house seats in one game.', pts: 40, test: S => S.m.seats >= 5 },
  { id: 'phoenix', n: 'Phoenix', d: 'Win after falling to three counties or fewer.', pts: 80, test: S => S.won && S.m.lowC <= 3 },
  { id: 'little', n: 'King of Little', d: 'Be crowned holding fewer than 12 counties.', pts: 40, test: S => S.m.crownedSmall },
  { id: 'usurper', n: 'Usurper', d: 'Be crowned while another king still lives.', pts: 30, test: S => S.m.usurped },
  { id: 'builder', n: 'Builder of Castles', d: 'Raise ten castles in one game.', pts: 25, test: S => S.m.castles >= 10 },
  { id: 'anathema', n: 'Anathema', d: 'Win while excommunicated.', pts: 50, test: S => S.won && S.excom },
  { id: 'unbroken', n: 'The Crown Unbroken', d: 'Win as the Royal Domain without ever losing the crown.', pts: 40, test: S => S.won && S.house === 'capet' && S.m.keptCrown },
  { id: 'veteran', n: 'Veteran', d: 'Finish ten games, won or lost.', pts: 30, test: (S, P) => P.games >= 10 },
];

// the easiest rivals a game was ever set to: lowering the setting mid-game counts for trophies and points
const DIFF_ORDER = ['gentle', 'original', 'hard'];
function noteDiff() { if (!G) return; const cur = DIFF_ORDER.indexOf(G.diff || 'original'), low = G.diffLow == null ? cur : Math.min(G.diffLow, cur); G.diffLow = low; }
// ---------- the end of a game ----------
function gameSummary() {
  const me_ = G.player, won = G.winner === me_, m = G.stats ? G.stats.me : {};
  return { when: Date.now(), house: me_, name: FAC(me_).name, won, how: !won ? (G.winner ? 'beaten' : 'fallen') : alive().length === 1 ? 'conquest' : 'crown',
    map: MAP_ID, winner: G.winner || null, turns: G.turn, year: yearOf(G.turn), diff: (noteDiff(), DIFF_ORDER[G.diffLow]), counties: owned(me_).length, excom: G.fac[me_].excom > 0,
    alliedAtEnd: alive().some(f => f !== me_ && allied(me_, f)), challenge: G.challenge ? G.challenge.id : null, m: { ...m } };
}
// called once when a game ends: history, trophies, points; returns what changed for the ending screens
function recordGame() {
  if (G.recorded) return G.recorded;
  const S = gameSummary(), P = profile();
  P.games++;
  const before = P.points, newT = [];
  for (const t of TROPHIES) if (!P.trophies[t.id] && t.test(S, P)) { P.trophies[t.id] = { when: S.when, house: S.house }; newT.push(t.id); P.points += t.pts; }
  const base = S.won ? 30 + (S.diff === 'hard' ? 20 : S.diff === 'gentle' ? 0 : 10) : 8;
  P.points += base;
  S.points = P.points - before; S.trophies = newT;
  S.rankBefore = rankOf(before); S.rankAfter = rankOf(P.points);
  saveProfile(P);
  const H = gameHistory(); H.push(S); while (H.length > 300) H.shift(); saveJ(HIST_KEY, H);
  G.recorded = S;
  return S;
}
