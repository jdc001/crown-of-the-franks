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
    if (fid === G.player) { statInc('taken'); if (castle) statInc('castlesTaken'); if (seat && prev) statInc('seats'); if (prev === 'byzantium') statInc('byz'); }
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
  wrap('raiderStrike', (o, p, n) => { const own = p.owner; const r = o(p, n); if (own === G.player && r && !r.won) statInc('raider'); return r; });
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
  { id: 'baron', n: 'Baron', at: 50, col: '#9aa3ad', unlock: "A baron's coronet and a silver border" },
  { id: 'viscount', n: 'Viscount', at: 150, col: '#3d7a4a', unlock: 'Supporters: lions or hounds' },
  { id: 'count', n: 'Count', at: 320, col: '#2f5aa8', unlock: "A count's coronet, and stags or wolves as supporters" },
  { id: 'marquis', n: 'Marquis', at: 620, col: '#7a3f8f', unlock: 'A laurel wreath, and griffins' },
  { id: 'duke', n: 'Duke', at: 1050, col: '#a3222c', unlock: "A ducal coronet, a mantle of estate, and unicorns" },
  { id: 'king', n: 'King', at: 1650, col: '#e2b33c', unlock: 'A royal crown, an ermine mantle, and eagles' },
  { id: 'emperor', n: 'Emperor', at: 2500, col: '#5a1f6e', unlock: 'The imperial crown and golden laurels' },
];
const rankOf = pts => { let r = 0; RANKS.forEach((k, i) => { if (pts >= k.at) r = i; }); return r; };
const rankNow = () => RANKS[rankOf(profile().points)];
// between two ranks, three honours mark the way: the first ranks come quickly, the high ones take many campaigns
const HONOURS = [
  ["A knight's spurs", 'A seat at the high table', 'Your banner in the hall'],
  ['Witness to a royal charter', 'A pilgrimage to Compostela', 'A gift of hawks from the king'],
  ['Steward of the household', 'A fief in the march', 'Keeper of a royal castle'],
  ['Envoy to the Pope', 'Founder of an abbey', 'Marshal of the host'],
  ['Chancellor of the realm', 'A relic for your chapel', 'Guardian of a young prince'],
  ['Envoy to Constantinople', 'Peer of the realm', 'Regent of the kingdom'],
  ['Crowned in a second kingdom', 'Protector of the Holy See', 'Hailed as Augustus'],
];
// honours held at a score: 0 to 3 within the current rank, and the next one's name and threshold
function honourOf(pts) {
  const r = rankOf(pts), a = RANKS[r], b = RANKS[r + 1]; if (!b) return { r, n: 0, next: null };
  const step = (b.at - a.at) / 4, n = Math.min(3, Math.floor((pts - a.at) / step));
  return { r, n, names: HONOURS[r], next: n < 3 ? { name: HONOURS[r][n], at: Math.round(a.at + step * (n + 1)) } : null };
}

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
  { id: 'conquest', n: 'Hammer of the Princes', d: 'Win by breaking every rival house.', pts: 60, test: S => S.won && S.how === 'conquest' },
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
  { id: 'almanzor', n: 'Bane of Almanzor', d: 'In France, 987: throw back an army of Almanzor.', map: 'france', pts: 40, test: S => S.m.almanzor >= 1 },
  { id: 'wives', n: 'A Marriage Policy', d: 'Marry three heiresses in one game.', pts: 30, test: S => S.m.heiresses >= 3 },
  { id: 'web', n: 'A Web of Treaties', d: 'Be at peace with four houses at once.', pts: 25, test: S => S.m.maxPacts >= 4 },
  { id: 'brothers', n: 'Brothers in Arms', d: 'Win while allied to another house.', pts: 25, test: S => S.won && S.alliedAtEnd },
  { id: 'seats', n: 'Breaker of Seats', d: 'Take five house seats in one game.', pts: 40, test: S => S.m.seats >= 5 },
  { id: 'phoenix', n: 'Phoenix', d: 'Win after falling to three counties or fewer.', pts: 80, test: S => S.won && S.m.lowC <= 3 },
  { id: 'little', n: 'King of Little', d: 'Be crowned holding fewer than 12 counties.', pts: 40, test: S => S.m.crownedSmall },
  { id: 'usurper', n: 'Usurper', d: 'Be crowned while another king still lives.', pts: 30, test: S => S.m.usurped },
  { id: 'builder', n: 'Builder of Castles', d: 'Raise ten castles in one game.', pts: 25, test: S => S.m.castles >= 10 },
  { id: 'anathema', n: 'Anathema', d: 'Win while excommunicated.', pts: 50, test: S => S.won && S.excom },
  { id: 'unbroken', n: 'The Crown Unbroken', d: 'Win as the house that starts with the crown (the Royal Domain, or Wessex in 1066) without ever losing it.', pts: 40, test: S => S.won && S.house === (MAPS[S.map || 'france'] || MAPS.france).crown.start && S.m.keptCrown !== false },
  { id: 'coast', n: 'Hold the Coast', d: 'Throw back two raids by Sweyn of Denmark (1066) or the Saracens (1002) in one game.', pts: 35, test: S => (S.m.raider || 0) >= 2 },
  // ---- the islands, 1066 ----
  { id: 'ardri', n: 'Ard Rí', d: 'In 1066: hold every county of Ireland at the end of a game.', pts: 45, map: 'britain', test: S => S.map === 'britain' && S.f && S.f.ireland },
  { id: 'britannia', n: 'Emperor of Britain', d: 'In 1066: win holding at least three counties each in England, Scotland, Wales and Ireland.', pts: 60, map: 'britain', test: S => S.won && S.map === 'britain' && S.f && S.f.four },
  { id: 'fjords', n: 'Lord of the Fjords', d: "In 1066: hold all four counties of Norway at the end of a game, playing a house that did not start with them.", pts: 40, map: 'britain', test: S => S.map === 'britain' && S.f && S.f.fjords },
  { id: 'channel', n: 'The Conquest Reversed', d: 'In 1066: as an English or Welsh house, take Rouen.', pts: 45, map: 'britain', test: S => S.map === 'britain' && S.f && S.f.rouen },
  // ---- the Empire, 1002 ----
  { id: 'rome', n: 'Crowned in Rome', d: 'In 1002: win holding Rome, where emperors are crowned.', pts: 50, map: 'empire', test: S => S.won && S.map === 'empire' && S.f && S.f.rome },
  { id: 'ironcrown', n: 'Two Crowns', d: 'In 1002: win holding Pavia, the seat of the kings of Italy, as well as Mainz and Aachen.', pts: 45, map: 'empire', test: S => S.won && S.map === 'empire' && S.f && S.f.pavia },
  { id: 'greeks', n: 'Bane of the Greeks', d: 'In 1002: take a county from Byzantium.', pts: 35, map: 'empire', test: S => S.map === 'empire' && (S.m.byz || 0) >= 1 },
  { id: 'elbe', n: 'Across the Elbe', d: 'In 1002: hold Brandenburg, Havelberg, Rethra, Mecklenburg and Rügen at the end of a game.', pts: 35, map: 'empire', test: S => S.map === 'empire' && S.f && S.f.elbe },
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
    alliedAtEnd: alive().some(f => f !== me_ && allied(me_, f)), challenge: G.challenge ? G.challenge.id : null, m: { ...m }, f: endFlags(me_) };
}
// what the map trophies look at when a game ends
function endFlags(fid) {
  const mine = id => G.provs[id] && G.provs[id].owner === fid, inR = r => provList().filter(p => p.r === r), f = {};
  if (MAP_ID === 'britain') {
    f.ireland = inR('ir').every(p => p.owner === fid);
    f.four = ['en', 'sc', 'wa', 'ir'].every(r => inR(r).filter(p => p.owner === fid).length >= 3);
    const nor = ['bergen', 'stavanger', 'sogn', 'agder']; f.fjords = nor.every(mine) && !nor.every(id => G.start && G.start[id] === fid);
    f.rouen = mine('rouen') && ['England', 'Wales'].includes(FACMAP[fid] && FACMAP[fid].realm);
  }
  if (MAP_ID === 'empire') { f.rome = mine('rome'); f.pavia = mine('pavia'); f.elbe = ['brandenburg', 'havelberg', 'rethra', 'obodrites', 'rugen'].every(mine); }
  return f;
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
  { const a = honourOf(before), b = honourOf(P.points); if (b.r === a.r && b.n > a.n) S.honour = b.names[b.n - 1]; }
  saveProfile(P);
  const H = gameHistory(); H.push(S); while (H.length > 300) H.shift(); saveJ(HIST_KEY, H);
  G.recorded = S;
  return S;
}
