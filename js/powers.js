'use strict';
// ================= THE POWERS BEYOND, AND THE EVENTS OF 987 TO 991 =================
// Outside powers never take a place on the map. They press on its edges:
//  - Almanzor, the Caliph's general, raids the Spanish March and the far south (he sacked Barcelona in 985);
//  - the King of Pamplona harries Gascony;
//  - the Empire steps in when a prince takes land in Lorraine, or holds Reims against the king;
//  - the King of Arles defends his counts against the princes of the west;
//  - the Danes raid the Atlantic coasts, and Normandy must choose whether to let them sell their plunder in Rouen.
// And a handful of events follow what really happened, if the game still allows it.
// powersTick() runs at the end of every round. Choices for the player arrive as reports with buttons (powerButtons).
const ALM_EVERY = 6, EMP_EVERY = 5;
// a battle between an outside army and whatever holds a county; the outsiders never keep it
function pressBattle(p, force, st = 'aggressive') {
  const cfg = { A: { militia: 0, ...force }, D: defenders(p), castle: !!p.b.castle, wallLvl: wallLvl(p), castleLv: castleLv(p), moat: !!(p.b.moat && !p.ruined), ruined: !!p.ruined,
    aSt: st, dSt: defStance(p, power(force)), aGen: null, dGen: defGen(p), aMod: 0, dMod: mods(p.owner), aBon: { atk: 0, hp: 0, cav: 0 }, dBon: { ...bonus(p.owner) } };
  if (p.owner === 'barcelona') cfg.dBon.hp += 0.15;
  const d0 = { ...cfg.D }, res = runBattle(cfg);
  applyDefLoss(p, cfg.D, res.D);
  return { won: res.won, lost: lossStr(d0, res.D) };
}
const forceOf = (n, cav = 0.3) => ({ foot: Math.round(n * (0.7 - cav)), bow: Math.round(n * 0.2), cav: Math.round(n * cav), cat: 0 });
const tell = (fid, title, body, action) => { if (fid === G.player) report(title, body, action); else note(`${title}: ${body}`); };

// ---------- Almanzor ----------
function almanzorTargets() { return provList().filter(p => p.owner && !besiegerOf(p) && (p.r === 'ca' || (p.lat < 43.55 && p.x < px(2.6)))); }
const parias = n => 15 + 3 * n;
function almanzorStrike(p, n) {
  const o = p.owner, r = pressBattle(p, forceOf(n, 0.35));
  if (r.won) {
    damageWalls(p, 45); p.militia = 0;
    const b = ['farm', 'market', 'port', 'mine'].filter(t => p.b[t] > 0); if (b.length) p.b[pick(b)]--;
    const loot = Math.min(G.fac[o].gold, 30 + rnd(40)); G.fac[o].gold -= loot;
    tell(o, `Almanzor sacks ${p.name}`, `The Caliph's army storms ${p.name}, burns what it cannot carry and rides south with ${loot} d of plunder and captives. The walls are broken. Your losses: ${r.lost}.`);
  } else tell(o, `${p.name} holds against Almanzor`, `The Caliph's army is thrown back from ${p.name} and turns for home. Your losses: ${r.lost}.`);
}
function almanzorTick() {
  if (G.turn < 4 || G.turn - (G.ev.alm ?? -99) < ALM_EVERY || Math.random() > 0.2) return;
  const t = almanzorTargets(); if (!t.length) return;
  const w = t.flatMap(p => p.r === 'ca' ? [p, p, p] : [p]), p = pick(w), n = Math.min(40, 14 + Math.round(G.turn * 0.35));
  G.ev.alm = G.turn;
  if (p.owner === G.player) { G.pend = { kind: 'almanzor', p: p.id, n }; report(`Almanzor marches on ${p.name}`, `The hajib Almanzor, master of Córdoba, leads about ${n} companies over the frontier toward ${p.name}. He will take tribute (parias) to turn back, or fight for it.`, { kind: 'almanzor' }); return; }
  const F = G.fac[p.owner];
  if (F.gold > parias(n) * 2 && Math.random() < 0.5) { F.gold -= parias(n); note(`${FAC(p.owner).name} pays Almanzor ${parias(n)} d to spare ${p.name}.`); }
  else almanzorStrike(p, n);
}
// ---------- Pamplona ----------
function pamplonaTick() {
  if (G.turn < 6 || G.turn - (G.ev.pam ?? -99) < 5 || Math.random() > 0.07) return;
  const t = ['bearn', 'bigorre', 'gascony', 'auch'].map(P).filter(p => p && p.owner && !besiegerOf(p)); if (!t.length) return;
  const p = pick(t), r = pressBattle(p, forceOf(8 + Math.round(G.turn * 0.15), 0.4)); G.ev.pam = G.turn;
  if (r.won) { const loot = Math.min(G.fac[p.owner].gold, 15 + rnd(20)); G.fac[p.owner].gold -= loot; p.militia = 0; tell(p.owner, `Basques raid ${p.name}`, `Horsemen of the King of Pamplona come over the passes, burn the villages of ${p.name} and carry off ${loot} d. Your losses: ${r.lost}.`); }
  else tell(p.owner, `${p.name} beats off the Basques`, `Raiders from Pamplona are driven back over the mountains. Your losses: ${r.lost}.`);
}
// ---------- the Empire and the King of Arles ----------
// the Ottonians want a weak king in France and their own men in Lorraine
function intervene(power, p, n, lordName) {
  const o = p.owner, r = pressBattle(p, forceOf(n, 0.3), 'balanced');
  if (r.won) {
    for (const a of armiesOf(o)) if (a.loc === p.id && !a.siege) a.loc = nearestHeld(o, p.id);
    freeMinor(p); p.lord = lordName; p.gar = { foot: 7, bow: 3, cav: 2, cat: 0 };
    tell(o, `${power} takes ${p.name}`, `An army of ${power === 'The Empire' ? 'the Empress Theophanu' : 'King Conrad'} drives your men out of ${p.name} and gives it to ${lordName}. Your losses: ${r.lost}.`);
  } else tell(o, `${p.name} holds against ${power === 'The Empire' ? 'the Empire' : 'Arles'}`, `${power === 'The Empire' ? 'An imperial army' : 'King Conrad\'s men'} fail${power === 'The Empire' ? 's' : ''} to take ${p.name}. Your losses: ${r.lost}.`);
}
function empireTick() {
  if (G.turn < TRUCE || G.turn - (G.ev.emp ?? -99) < EMP_EVERY) return;
  // the Ottonians want their own men in Lorraine: any imperial county a prince takes there. Charles's own lands are his to lose.
  const lo = provList().filter(p => p.owner && p.r === 'lo' && !(G.start && (G.start[p.id] === p.owner || G.start[p.id] === 'charles')) && !isCap(p) && !besiegerOf(p));
  const reims = P('reims'); if (reims.owner && !isKing(reims.owner) && !isCap(reims) && !besiegerOf(reims)) lo.push(reims);
  if (!lo.length || Math.random() > 0.22) return;
  G.ev.emp = G.turn;
  intervene('The Empire', pick(lo), Math.min(55, 22 + Math.round(G.turn * 0.4)), pick(['Count Godfrey, the Emperor\'s man', 'Count Gerhard, the Emperor\'s man', 'the Bishop of Metz, for the Emperor']));
}
function arlesTick() {
  if (G.turn < TRUCE || G.turn - (G.ev.arl ?? -99) < 6) return;
  const ar = provList().filter(p => p.owner && p.r === 'ar' && p.owner !== 'provence' && !isCap(p) && !besiegerOf(p));
  const heavy = alive().filter(f => f !== 'provence' && ar.filter(p => p.owner === f).length >= 2);
  if (!heavy.length || Math.random() > 0.15) return;
  G.ev.arl = G.turn;
  intervene('King Conrad', pick(ar.filter(p => heavy.includes(p.owner))), Math.min(36, 16 + Math.round(G.turn * 0.25)), 'a vassal of King Conrad');
}
// ---------- the Danes ----------
const vikingCoast = p => p.seas.some(z => z === 'channel' || z === 'north' || z === 'biscay');
function daneMult(fid) { if (!G.danes) return 1; if (fid === 'normandy') return G.danes === 'open' ? 0 : 0.5; return G.danes === 'open' ? 1.5 : 1; }
const popeMod = fid => fid === 'normandy' && G.danes ? (G.danes === 'open' ? -0.1 : 0.1) : 0;
function danesTick() {
  if (G.danes === 'open' && G.fac.normandy && G.fac.normandy.alive) G.fac.normandy.gold += 6;
  if (G.turn < 4) return;
  for (const f of alive()) {
    if (f === G.player) continue;
    const coast = owned(f).filter(vikingCoast); if (!coast.length) continue;
    if (Math.random() > 0.04 * daneMult(f)) continue;
    const p = pick(coast), loot = Math.min(G.fac[f].gold, 10 + rnd(25)); G.fac[f].gold -= loot; p.militia = Math.max(0, p.militia - 3);
    note(`Northmen raid ${p.name} and carry off ${loot} d from ${FAC(f).name}.`);
  }
}
function setDanes(v) {
  G.danes = v;
  note(v === 'open' ? 'The Danes may sell their plunder in the ports of Normandy.' : 'Normandy closes its ports to the Danes.');
}

// ---------- the events of 987 to 991 ----------
function eventsTick() {
  const E = G.ev, T = G.turn, k = king(), alv = f => G.fac[f] && G.fac[f].alive;
  // Barcelona's plea (Summer 987): Borrell asks the new king for help against Almanzor
  if (T === 1 && !E.plea && alv('barcelona') && k && k !== 'barcelona') {
    E.plea = true;
    if (k === G.player) { G.pend = { kind: 'plea' }; report('A plea from Barcelona', `Count Borrell writes that Almanzor burned Barcelona two years ago and will come again. He asks his king for an army. Help now and Barcelona will be your ally. Will you send help?`, { kind: 'plea' }); }
    else if (G.fac[k].gold >= 100 && Math.random() < 0.4) answerPlea(true); else answerPlea(false);
  }
  // the Danish ports (Autumn 987): Normandy chooses
  if (T === 2 && !G.danes && alv('normandy')) {
    if (G.player === 'normandy') { G.pend = { kind: 'danes' }; report('Danish ships in the Seine', `Danish captains ask leave to sell their plunder and buy supplies in Rouen before sailing for England. Their silver would fill your treasury, and their swords are for hire. The Church, and the English, will not forgive it easily.`, { kind: 'danes' }); }
    else setDanes(Math.random() < 0.5 ? 'open' : 'closed');
  }
  // Christmas 987: Robert is crowned beside his father
  if (T === 2 && !E.robert && alv('capet') && isKing('capet')) {
    E.robert = true; G.fac.capet.coKing = true;
    tell('capet', 'Robert crowned at Orléans', 'At Christmas Hugh has his son Robert anointed king beside him, so the crown cannot pass by election when he dies. If the royal seat falls, the Capetians rally under Robert, wherever they still hold a county, and keep the crown.');
    if (G.player !== 'capet') note('At Orléans, Hugh Capet has his son Robert crowned king beside him.');
  }
  // Summer 988: Charles's friends open Laon
  if (T === 4 && !E.laon && alv('charles') && P('laon').owner && P('laon').owner === k && k !== 'charles' && !isCap(P('laon'))) {
    E.laon = true;
    if (Math.random() < 0.35) {
      const p = P('laon'), was = p.owner; capture(p, 'charles'); p.gar = { foot: 4, bow: 2, cav: 1, cat: 0 }; const A = lordArmy('charles'); if (armyUsable('charles', A)) A.foot += 6;
      const t = 'In the night, friends of the old royal house open the gates of Laon to Charles of Lorraine. The city of the Carolingian kings is his, and men flock to his banner.';
      if (was === G.player || G.player === 'charles') report('Laon betrayed', t); else note(t);
    }
  }
  // Winter 988: Archbishop Adalbero of Reims dies; the new archbishop is Arnulf, a Carolingian
  if (T === 6 && !E.arnulf) {
    E.arnulf = true; const p = P('reims');
    if (!p.owner) { p.lord = 'Archbishop Arnulf'; if (alv('charles') && !p.ally) p.ally = 'charles'; const t = `Archbishop Adalbero of Reims is dead. The king's choice to succeed him is Arnulf, a son of King Lothair, who leans toward his uncle Charles.${p.ally === 'charles' ? ' Reims is sworn to Charles of Lorraine.' : ''}`; if (G.player === 'charles' || isKing(G.player)) report('A new archbishop at Reims', t); else note(t); }
  }
  // Summer 989: Arnulf opens Reims to Charles
  if (T === 8 && !E.reims && alv('charles') && !P('reims').owner && P('reims').ally === 'charles' && P('laon').owner === 'charles' && Math.random() < 0.4) {
    E.reims = true; const p = P('reims'); p.ally = null; capture(p, 'charles'); p.gar = { foot: 5, bow: 3, cav: 1, cat: 0 };
    const t = 'Archbishop Arnulf opens the gates of Reims to his uncle Charles. With Laon and Reims in his hand, Charles may now be anointed king.';
    if (G.player === 'charles' || isKing(G.player)) report('Reims opens to Charles', t); else note(t);
  }
  // Spring 991: Bishop Adalbero of Laon betrays Charles
  if (T === 14 && !E.warn && G.player === 'charles' && P('laon').owner === 'charles' && k && k !== 'charles') { E.warn = true; report('Rumours at Laon', 'Your spies say Bishop Adalbero of Laon has been writing to the king. If your host is in Laon at Easter, he may open the gates to your enemies while you sleep.'); }
  if (T === 15 && !E.betrayal && alv('charles') && P('laon').owner === 'charles' && k && k !== 'charles' && !G.fac.charles.captive) {
    E.betrayal = true; const A = lordArmy('charles');
    const there = A.loc === 'laon' && !A.siege, hit = G.player === 'charles' ? there : Math.random() < 0.4;
    if (hit) {
      if (there && armySize(A)) loseArmy('charles', A, k);
      G.fac.charles.captive = G.fac.charles.captive || { by: k, since: G.turn };
      capture(P('laon'), k);
      const t = `On Palm Sunday, Bishop Adalbero of Laon, who had sworn to Charles, opens the gates to ${FAC(k).name}. Charles of Lorraine is taken in his bed, and Laon is the king's again.`;
      if (G.player === 'charles' || G.player === k) report('Betrayed at Laon', t); else report('Charles of Lorraine is captured', t);
    }
  }
  // 991: the Pope makes peace between Normandy and England
  if (T === 15 && !E.treaty && alv('normandy') && G.danes) {
    E.treaty = true;
    if (G.danes === 'closed') { G.fac.normandy.sons++; G.fac.normandy.bless = 3; tell('normandy', 'Peace with England', 'A papal legate seals a treaty between Duke Richard and King Æthelred. The English king will look for a Norman bride; the Pope blesses Normandy\'s arms. (+1 son to marry, blessed for 3 turns.)'); }
    else if (Math.random() < 0.5) { G.fac.normandy.excom = Math.max(G.fac.normandy.excom, 2); tell('normandy', 'The Pope rebukes Normandy', 'A papal legate accuses Duke Richard of harbouring the Danes who plunder England, and the Pope excommunicates him.'); }
  }
}
function answerPlea(help) {
  const k = king(), B = G.fac.barcelona; G.pend = null; if (!k || !B || !B.alive) return;
  if (help && G.fac[k].gold >= 60) { G.fac[k].gold -= 60; B.gold += 60; const A = lordArmy('barcelona'); if (armyUsable('barcelona', A)) A.foot += 6; { const u = G.turn + 12; G.truces.push({ a: k, b: 'barcelona', until: u, pact: true, pass: true }); } tell('barcelona', 'The king sends help', `${rulerOf(k)} sends silver and men south. Count Borrell swears an alliance for three years.`); if (k === G.player) note('You send 60 d and men to Barcelona. Count Borrell is your ally for three years: your armies may march through each other\'s lands.'); }
  else { tell('barcelona', 'No help from the north', `${rulerOf(k)} sends nothing. Borrell will not forget it.`); if (k === G.player) note('You send no help to Barcelona. Count Borrell will remember it.'); }
}
function powersTick() {
  if (G.over) return;
  eventsTick(); almanzorTick(); pamplonaTick(); empireTick(); arlesTick(); danesTick();
}
// a choice left unanswered when the player ends the turn takes its default
function settlePending() {
  const d = G.pend; if (!d) return;
  if (d.kind === 'almanzor') { G.pend = null; almanzorStrike(P(d.p), d.n); }
  else if (d.kind === 'plea') answerPlea(false);
  else if (d.kind === 'danes') { G.pend = null; setDanes('open'); }
  else G.pend = null;
}
// buttons for the player's choices, shown on the report
function powerButtons(a) {
  const d = G.pend; if (!d || !a || d.kind !== a.kind) return null;
  const F = G.fac[me()];
  if (d.kind === 'almanzor') return `<button class="btn" onclick="powerAnswer('fight')"><span class="lbl">${ico('swords')}Fight for ${P(d.p).name}</span><small>the garrison and any army there</small></button><button class="btn gold" onclick="powerAnswer('pay')" ${F.gold >= parias(d.n) ? '' : 'disabled'}><span class="lbl">${ico('coin')}Pay the parias · ${parias(d.n)} d</span></button>`;
  if (d.kind === 'plea') return `<button class="btn gold" onclick="powerAnswer('help')" ${F.gold >= 60 ? '' : 'disabled'}><span class="lbl">${ico('flag')}Send help · 60 d</span><small>an alliance for three years, with passage</small></button><button class="btn" onclick="powerAnswer('refuse')"><span class="lbl">Send nothing</span><small>Borrell remembers it</small></button>`;
  if (d.kind === 'danes') return `<button class="btn gold" onclick="powerAnswer('open')"><span class="lbl">${ico('coin')}Open the ports</span><small>+6 d a turn, no raids on you; worse with Rome, raids elsewhere grow</small></button><button class="btn" onclick="powerAnswer('closed')"><span class="lbl">${ico('church')}Close the ports</span><small>better with Rome, half the raids; an English treaty may follow</small></button>`;
  return null;
}
function powerAnswer(v) {
  const d = G.pend; if (!d) return closeModal();
  if (d.kind === 'almanzor') { G.pend = null; if (v === 'pay') { G.fac[me()].gold -= parias(d.n); note(`You pay Almanzor ${parias(d.n)} d, and he turns back from ${P(d.p).name}.`); } else almanzorStrike(P(d.p), d.n); }
  else if (d.kind === 'plea') answerPlea(v === 'help');
  else if (d.kind === 'danes') { G.pend = null; setDanes(v); }
  closeModal(); save(); render(); showReports();
}
