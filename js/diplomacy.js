'use strict';
// ================= DIPLOMACY =================
// The player treats with any house: a truce of a chosen length, which neither side can break while it runs,
// or a joint war against a third house. Either can be sweetened with silver or a county. One embassy to each
// house a turn; nothing is paid unless they accept.
// Pacts are signed, not gambled on: a house says plainly what it wants. If a pact is in its interest it asks
// nothing; if it is reluctant it names a price, in silver or a county; if it is hostile it will not sign at all.
const PACT_LENS = [[8, '2 years'], [12, '3 years']];
const DP = { f: null, len: 8, alen: 8, county: null, target: null };
const DEAL = { pact: 0.5, ally: 0.68, war: 0.5 };

function cedable(fid, to) { return owned(fid).filter(p => !isCap(p) && !besieging(p)).sort((a, b) => adjTo(b, to) - adjTo(a, to) || b.base - a.base); }
function relPower(a, b) { return (armyPow(a) + 5) / (armyPow(b) + 5); }
const goldRate = t => 0.4 / (facIncome(t) * 1.5 + 30);
function countyValue(t, pid) { if (!pid) return 0; const p = P(pid); return (0.18 + 0.03 * p.base + (p.b.castle ? 0.05 : 0)) * (adjTo(p, t) ? 1 : 0.6); }
const peaceUntil = (a, b) => G.truces.filter(x => (x.a === a && x.b === b) || (x.a === b && x.b === a)).reduce((m, x) => Math.max(m, x.until), 0);
const bordersHouse = (a, b) => owned(a).some(p => adjTo(p, b));
// a stronger house on both your borders, at war with both of you
function sharedFoe(a, b) { return alive().some(x => x !== a && x !== b && !atPeace(a, x) && !atPeace(b, x) && bordersHouse(a, x) && bordersHouse(b, x) && armyPow(x) > Math.max(armyPow(a), armyPow(b))); }
function threatened(t, fid) { return alive().some(o => o !== t && o !== fid && !atPeace(t, o) && bordersHouse(t, o) && relPower(o, t) > 1.4); }
// how much a house wants a pact or alliance with fid, before any payment
function pactWill(fid, t, len, kind) {
  const r = relPower(t, fid);
  let w = 0.35 + clamp(0.35 * (1 - r), -0.4, 0.3) + (threatened(t, fid) ? 0.15 : 0) + (sharedFoe(fid, t) ? 0.15 : 0) - (len - 8) * 0.02;
  if (G.fac[fid].excom > 0) w -= 0.1;
  if (kind === 'ally' && !bordersHouse(fid, t)) w -= 0.05;
  return w + 0.25 * attitude(t, fid);
}
function warWill(fid, t, target) {
  const together = (armyPow(fid) + armyPow(t) + 10) / (armyPow(target) + 5);
  const most = alive().map(f => [f, owned(f).length]).sort((a, b) => b[1] - a[1])[0][0];
  let w = 0.3 + clamp((together - 1.2) * 0.25, -0.3, 0.3) + (most === target ? 0.15 : 0) + (sharedFoe(fid, t) && threatened(t, fid) ? 0.1 : 0) - (relPower(t, fid) > 1.5 ? 0.1 : 0);
  if (G.fac[fid].excom > 0) w -= 0.1;
  return w;
}
// what they ask: 0 if willing, a sum in silver if reluctant, null if they will not sign at any price
function askPrice(t, will, need, pid) {
  if (G.challenge && G.challenge.mod && G.challenge.mod.noPacts) return null;
  const deficit = need - will - countyValue(t, pid);
  if (deficit <= 0) return 0;
  if (need - will > 0.55) return null;
  return Math.ceil(deficit / goldRate(t) / 5) * 5;
}
const priceTxt = (t, a) => a === null ? `<span class="bad">${esc(FAC(t).name)} will not sign with you now.</span>` : a === 0 ? `<span class="good">${esc(FAC(t).name)} is willing${DP.county ? ' with the county' : ''}: they ask nothing${DP.county ? ' more' : ''}.</span>` : `${esc(FAC(t).name)} is reluctant: they ask <b>${a} d</b>${DP.county ? ' as well as the county' : ''}.`;

function cede(from, to, p) {
  loseGeneral(from, p.id, `rides home from ${p.name}, now given up`);
  const back = nearestHeld(from, p.id);
  if (back && back !== p.id) for (const u of ['foot', 'bow', 'cav', 'cat']) P(back).gar[u] += p.gar[u];
  for (const a of armiesOf(from)) if (a.loc === p.id) a.loc = back;
  for (const a of armiesOf(to)) if (a.siege === p.id) { a.siege = null; a.loc = p.id; }
  p.owner = to; p.ally = null; p.gar = eu(); p.build = null;
}
function paid(t, gold, pid) {
  const F = G.fac[me()];
  F.gold -= gold; G.fac[t].gold += gold;
  if (pid) cede(me(), t, P(pid));
  return [gold ? gold + ' d' : '', pid ? P(pid).name : ''].filter(Boolean).join(' and ');
}
function signPact(kind) {
  const t = DP.f, F = G.fac[me()], len = kind === 'ally' ? DP.alen : DP.len;
  const price = askPrice(t, pactWill(me(), t, len, kind), DEAL[kind], DP.county);
  if (!t || price === null || F.gold < price) return;
  const gave = paid(t, price, DP.county);
  const until = Math.max(G.turn, peaceUntil(me(), t)) + len;
  G.truces.push({ a: me(), b: t, until, pact: true, treaty: true, pass: kind === 'ally' }); (G.truceHist = G.truceHist || {})[pairKey(me(), t)] = until;
  sfx('bell'); buzz(); tutorDid('pact');
  report(kind === 'ally' ? 'An alliance' : 'A pact of peace', `${rulerOf(t)} ${kind === 'ally' ? 'swears an alliance with you' : 'swears on the relics to keep the peace with you'} until ${dateStr(until)}${gave ? `, for ${gave}` : ''}. Neither house may attack the other until then${kind === 'ally' ? ', and the armies of each may march through the other\'s lands' : ''}.`);
  DP.county = null; save(); closeModal(); render(); showReports();
}
function signWar() {
  const t = DP.f, x = DP.target, F = G.fac[me()];
  const price = x ? askPrice(t, warWill(me(), t, x), DEAL.war, DP.county) : null;
  if (!t || !x || price === null || F.gold < price) return;
  const gave = paid(t, price, DP.county);
  const until = Math.max(G.turn, peaceUntil(me(), t)) + JOINT_TURNS;
  G.truces.push({ a: me(), b: t, until, pact: true, treaty: true }); (G.truceHist = G.truceHist || {})[pairKey(me(), t)] = until;
  G.fac[t].warOn = { target: x, until: G.turn + JOINT_TURNS };
  sfx('horn'); buzz();
  report('A war alliance', `${rulerOf(t)} agrees to make war on ${FAC(x).name}${gave ? ` for ${gave}` : ''}. Your houses keep the peace until ${dateStr(until)}, and ${FAC(t).name}'s armies turn on ${FAC(x).name}.`);
  DP.county = null; DP.target = null; save(); closeModal(); render(); showReports();
}

// a small map of the kingdom in the houses' colours: tap a county to treat with whoever holds it
function diploMap(sel) {
  const ps = provList(), xs = ps.map(p => p.x), ys = ps.map(p => p.y), pad = 30;
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, w = Math.max(...xs) + pad - x0, h = Math.max(...ys) + pad - y0;
  const houses = new Set(alive());
  const fill = p => p.owner ? mix(FAC(p.owner).color, '#efe3c4', p.owner === sel || (sel === 'me' && p.owner === me()) ? 0 : sel === 'me' ? 0.15 : 0.4) : p.ally ? mix(FAC(p.ally).color, '#efe3c4', 0.75) : '#e8dcb9';
  const cells = ps.map(p => `<path d="${CELLD[p.id]}" data-f="${p.owner && houses.has(p.owner) ? p.owner : p.ally && houses.has(p.ally) ? p.ally : ''}" fill="${fill(p)}" stroke="#4b3825" stroke-width="1"${p.owner === sel ? ' class="dsel"' : ''}/>`).join('');
  const fs = Math.max(24, w / 24), placed = [];
  const short = f => f === me() ? 'You' : ({ capet: 'Royal Domain', charles: 'Lorraine' })[f] || FAC(f).name.replace(/^The /, '');
  const lbl = [...houses].map(f => { const own = owned(f); if (!own.length) return null; return { f, nm: short(f), x: own.reduce((s, p) => s + p.x, 0) / own.length, y: own.reduce((s, p) => s + p.y, 0) / own.length + 6 }; }).filter(Boolean).sort((a, b) => a.y - b.y)
    .map(L => { const hw = L.nm.length * fs * 0.28; let n = 0; while (n++ < 6 && placed.some(q => Math.abs(q.x - L.x) < hw + q.hw && Math.abs(q.y - L.y) < fs * 0.95)) L.y += fs * 0.95; placed.push({ ...L, hw }); return `<text class="lbl dlbl${L.f === sel ? ' on' : ''}" text-anchor="middle" x="${L.x.toFixed(0)}" y="${L.y.toFixed(0)}" style="font-size:${fs.toFixed(0)}px;stroke-width:${Math.max(5, w / 140).toFixed(0)}px">${esc(L.nm)}</text>`; }).join('');
  return `<div class="dmap"><svg viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" onclick="diploMapTap(event)" xmlns="http://www.w3.org/2000/svg"><rect x="${x0 - w}" y="${y0 - h}" width="${w * 3}" height="${h * 3}" fill="#8fa8a3"/><g clip-path="url(#landclip)">${cells}</g>${LANDS.map(L => `<path d="${pathOf(L)}" fill="none" stroke="#3a2b1b" stroke-width="2" pointer-events="none"/>`).join('')}<g pointer-events="none">${lbl}</g></svg><div class="sub ctr">Tap a house's lands to treat with it</div></div>`;
}
function diploMapTap(e) {
  const f = e.target && e.target.dataset ? e.target.dataset.f : '';
  if (!f) return;
  sfx('click'); DP.f = f === me() ? 'me' : f; DP.county = null; DP.target = null; openDiplo();
}
function openDiplo(fid) {
  const F = G.fac[me()], houses = alive().filter(f => f !== me());
  if (fid && fid !== DP.f) { DP.f = fid; DP.county = null; DP.target = null; }
  if (DP.f !== 'me' && !houses.includes(DP.f)) DP.f = 'me';
  const t = DP.f;
  const picker = diploMap(t) + `<div class="dpick"><button class="${DP.f === 'me' ? 'on' : ''} meb" onclick="DP.f='me';openDiplo()" title="All your relations">${shield(me(), 22)}<span>You: all relations</span></button>${houses.map(f => `<button class="${f === t ? 'on' : ''}" onclick="DP.f='${f}';DP.county=null;DP.target=null;openDiplo()" title="${esc(FAC(f).name)}">${shield(f, 22)}<span>${esc(FAC(f).name.replace(/^The /, ''))}</span>${allied(me(), f) ? '<i>✦</i>' : atPeace(me(), f) ? '<i>✓</i>' : ''}</button>`).join('')}</div>`;
  if (!houses.length) return showModal(`<h2>${ico('handshake')} Diplomacy</h2><p>No other house stands.</p>`, '', { closable: true });
  if (t === 'me') return showModal(`<h2>${ico('handshake')} Diplomacy</h2><p class="sub">Choose a house to treat with it, or see all your relations below.</p>${picker}${relationsTable()}`, '', { closable: true });
  const T = G.fac[t], d = FAC(t);
  const r = relPower(t, me());
  const strength = r > 1.5 ? '<span class="bad">much stronger than you</span>' : r > 1.1 ? 'stronger than you' : r > 0.9 ? 'about your equal' : r > 0.6 ? 'weaker than you' : '<span class="good">much weaker than you</span>';
  const pu = peaceUntil(me(), t);
  let rel = allied(me(), t) ? `${ico('handshake')} Your ally until <b>${dateStr(pu)}</b>: your armies may march through each other's lands.` : atPeace(me(), t) ? `${ico('dove')} At peace with you until <b>${dateStr(pu)}</b>.` : `${ico('swords')} No pact binds you.`;
  if (T.warOn && T.warOn.target) rel += ` At war with ${FAC(T.warOn.target).name} until ${dateStr(T.warOn.until)}.`;
  const why = [threatened(t, me()) ? 'a stronger neighbour threatens them' : '', sharedFoe(me(), t) ? 'you share a dangerous enemy' : ''].filter(Boolean);
  const head = `<div class="row" style="gap:10px;align-items:center;margin:6px 0">${shield(t, 46)}<div style="min-width:0"><h3 style="margin:0">${esc(d.name)}</h3><div class="sub">${esc(rulerOf(t))} · ${owned(t).length} counties · ${strength}${T.excom ? ' · <span class="bad">excommunicated</span>' : ''}</div></div></div><p>${rel}${why.length ? ` <span class="sub">(${why.join('; ')})</span>` : ''}</p>${relBars(t)}<div class="row" style="margin:-4px 0 6px"><button class="btn sm ghost" onclick="closeModal();goProv('${homeOf(t)}')"><span class="lbl">${ico('eye')}See ${P(homeOf(t)).name}</span></button></div>`;
  const cs = cedable(me(), t);
  if (DP.county && !cs.some(p => p.id === DP.county)) DP.county = null;
  const county = `<div class="sub" style="margin-top:4px">Give a county to lower their price <small>(one that borders them, ✦, is worth more)</small></div>${cs.length ? `<div class="seg" style="display:flex;flex-wrap:wrap"><button class="${!DP.county ? 'on' : ''}" onclick="DP.county=null;openDiplo()">none</button>${cs.map(p => `<button class="${DP.county === p.id ? 'on' : ''}" onclick="DP.county='${p.id}';openDiplo()">${p.name}${adjTo(p, t) ? ' ✦' : ''}</button>`).join('')}</div>` : '<p class="sub" style="margin:2px 0">You have no county to give but your seat.</p>'}`;
  const signBtn = (cls, icon, label, price, on) => `<button class="btn ${cls}" style="margin-top:8px" onclick="${on}" ${price === null || F.gold < price ? 'disabled' : ''}><span class="lbl">${ico(icon)}${label}</span><small>${price === null ? 'they refuse' : price === 0 ? (DP.county ? 'for ' + P(DP.county).name : 'free') : price + ' d' + (DP.county ? ' and ' + P(DP.county).name : '') + (F.gold < price ? ' · not enough silver' : '')}</small></button>`;
  const pp = askPrice(t, pactWill(me(), t, DP.len, 'pact'), DEAL.pact, DP.county);
  const pact = `<h3>A pact of peace</h3><p class="sub">Neither house may attack the other while it runs. It cannot be broken.${atPeace(me(), t) ? ' A new pact begins when the present one ends.' : ''}</p>
    <div class="seg" style="display:flex">${PACT_LENS.map(([n, l]) => `<button class="${DP.len === n ? 'on' : ''}" style="flex:1;flex-direction:column;gap:0" onclick="DP.len=${n};openDiplo()">${l}<small>${n} turns</small></button>`).join('')}</div>
    <p style="margin:8px 0 0">${priceTxt(t, pp)}</p>${signBtn('gold', 'dove', 'Sign the pact', pp, "signPact('pact')")}`;
  const ap = askPrice(t, pactWill(me(), t, DP.alen, 'ally'), DEAL.ally, DP.county);
  const ally = `<h3>An alliance</h3><p class="sub">A pact of peace that also opens each house's lands to the other's armies, so you can march through them to reach the enemy beyond. Harder to win than a pact.</p>
    <div class="seg" style="display:flex">${PACT_LENS.map(([n, l]) => `<button class="${DP.alen === n ? 'on' : ''}" style="flex:1;flex-direction:column;gap:0" onclick="DP.alen=${n};openDiplo()">${l}<small>${n} turns</small></button>`).join('')}</div>
    <p style="margin:8px 0 0">${priceTxt(t, ap)}</p>${signBtn('gold', 'handshake', 'Swear the alliance', ap, "signPact('ally')")}`;
  const jt = alive().filter(x => x !== me() && x !== t && !atPeace(t, x) && bordersHouse(t, x));
  if (DP.target && !jt.includes(DP.target)) DP.target = null;
  const wp = DP.target ? askPrice(t, warWill(me(), t, DP.target), DEAL.war, DP.county) : null;
  const war = `<h3>A war alliance</h3><p class="sub">${esc(d.name)} turns its armies on a house that borders it, and your houses keep the peace for ${JOINT_TURNS} turns.</p>
    ${jt.length ? `<div class="seg" style="display:flex;flex-wrap:wrap">${jt.map(x => `<button class="${DP.target === x ? 'on' : ''}" onclick="DP.target='${x}';openDiplo()">${shield(x, 14)} ${esc(FAC(x).name)}</button>`).join('')}</div>
    ${DP.target ? `<p style="margin:8px 0 0">${priceTxt(t, wp)}</p>${signBtn('red', 'swords', `War on ${esc(FAC(DP.target).name)}`, wp, 'signWar()')}` : '<p class="sub">Choose the house they should make war on.</p>'}` : `<p class="sub">${esc(d.name)} borders no house it could make war on just now.</p>`}`;
  const marry = `<h3>A marriage</h3><p class="sub">${PACT_COST} d in gifts and one of your sons: peace for ${PACT_TURNS} turns, if they accept.</p><button class="btn" onclick="closeModal();doPact('${t}')" ${canPact(me(), t) && F.gold >= PACT_COST ? '' : 'disabled'}><span class="lbl">${ico('ring')}Offer a marriage</span><small>${!F.sons ? 'no unmarried sons' : F.proposed ? 'already courted this turn' : atPeace(me(), t) ? 'already at peace' : recentPeace(me(), t) ? 'too soon after the last peace' : Math.round(pactChance(me(), t) * 100) + '% chance'}</small></button>`;
  showModal(`<h2>${ico('handshake')} Diplomacy</h2><p class="sub">Choose a house. A house that gains from a pact asks nothing; a reluctant one names its price.</p>${picker}${head}${county}${pact}${ally}${war}${marry}`, '', { closable: true });
}

// every house at a glance: where things stand, how long a pact has left, and how they feel about you
function relationsTable() {
  const rank = f => allied(me(), f) ? 0 : atPeace(me(), f) ? 1 : atWar(me(), f) ? 3 : 2;
  const list = alive().filter(f => f !== me()).sort((a, b) => rank(a) - rank(b) || attitude(b, me()) - attitude(a, me()));
  const left = f => { const n = peaceUntil(me(), f) - G.turn; return `${n} turn${n === 1 ? '' : 's'} left`; };
  const state = f => allied(me(), f) ? ['Allied', '#2f6fd6', left(f)] : atPeace(me(), f) ? ['Pact', '#2e9a4a', left(f)] : atWar(me(), f) ? ['At war', '#a3222c', 'fought in the last two years'] : ['No pact', '#8a7458', truce() ? `Peace of God: ${TRUCE - G.turn} turns` : 'may attack each other'];
  const counts = [0, 1, 2, 3].map(k => list.filter(f => rank(f) === k).length);
  return `<p class="sub">${counts[0]} allied · ${counts[1]} at peace · ${counts[2]} without a pact · ${counts[3]} at war${truce() ? ` · the Peace of God holds for ${TRUCE - G.turn} more turn${TRUCE - G.turn === 1 ? '' : 's'}` : ''}</p>
    <div class="reltab">${list.map(f => { const [n, c, sub] = state(f), a = attitude(f, me()); return `<div class="relrow" onclick="DP.f='${f}';DP.county=null;DP.target=null;openDiplo()">${shield(f, 26)}<div class="rn"><b>${esc(FAC(f).name)}</b><small>${owned(f).length} counties${isKing(f) ? ' · the king' : ''}</small></div><div class="rs"><span class="pill" style="background:${c}">${n}</span><small>${sub}</small></div><div class="rm"><div class="mood mini"><i style="left:${((a + 1) / 2 * 100).toFixed(0)}%"></i></div><small>${attWord(a)}</small></div></div>`; }).join('')}</div>
    <p class="sub">Tap a house to treat with it.</p>`;
}
