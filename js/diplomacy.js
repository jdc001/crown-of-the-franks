'use strict';
// ================= DIPLOMACY =================
// The player treats with any house: a truce of a chosen length, which neither side can break while it runs,
// or a joint war against a third house. Either can be sweetened with silver or a county. One embassy to each
// house a turn; nothing is paid unless they accept.
const TRUCE_LENS = [[4, '1 year'], [8, '2 years'], [12, '3 years'], [20, '5 years']];
const GIFTS = [0, 25, 50, 100, 200];
const DP = { f: null, len: 8, gold: 0, county: null, target: null };

// counties the player could hand over: his own, not his seat, bordering the other house, not under siege
function cedable(fid, to) { return owned(fid).filter(p => !isCap(p) && !besieging(p)).sort((a, b) => adjTo(b, to) - adjTo(a, to) || b.base - a.base); }
const sentTo = t => !!(G.fac[me()].envoys && G.fac[me()].envoys[t] === G.turn);
function relPower(a, b) { return (armyPow(a) + 5) / (armyPow(b) + 5); }
function offerValue(t, gold, pid) {
  let v = 0.4 * gold / (facIncome(t) * 1.5 + 30);
  if (pid) { const p = P(pid); v += (0.18 + 0.03 * p.base + (p.b.castle ? 0.05 : 0)) * (adjTo(p, t) ? 1 : 0.6); }
  return v;
}
const peaceUntil = (a, b) => G.truces.filter(x => (x.a === a && x.b === b) || (x.a === b && x.b === a)).reduce((m, x) => Math.max(m, x.until), 0);
// how willing a house is to agree a truce of a given length
function truceChance(fid, t, len, gold, pid) {
  const r = relPower(t, fid);
  const threatened = alive().some(o => o !== t && o !== fid && !atPeace(t, o) && owned(t).some(p => adjTo(p, o)) && relPower(o, t) > 1.4);
  let c = 0.35 + clamp(0.3 * (1 - r), -0.35, 0.3) + (threatened ? 0.15 : 0) - (len - 4) * 0.025 + offerValue(t, gold, pid);
  if (G.fac[fid].excom > 0) c -= 0.1;
  if (atPeace(fid, t)) c += 0.1;
  return clamp(c, 0.02, 0.95);
}
// a house joins a war if the target borders it and the two of you together outweigh it
function jointTargets(fid, t) {
  return alive().filter(x => x !== fid && x !== t && !atPeace(t, x) && owned(t).some(p => adjTo(p, x)));
}
function jointChance(fid, t, target, gold, pid) {
  const together = (armyPow(fid) + armyPow(t) + 10) / (armyPow(target) + 5);
  const most = alive().map(f => [f, owned(f).length]).sort((a, b) => b[1] - a[1])[0][0];
  let c = 0.12 + clamp((together - 1.2) * 0.2, -0.25, 0.3) + (most === target ? 0.12 : 0) - (relPower(t, fid) > 1.5 ? 0.1 : 0) + offerValue(t, gold, pid);
  if (G.fac[fid].excom > 0) c -= 0.1;
  return clamp(c, 0.02, 0.9);
}
function cede(from, to, p) {
  loseGeneral(from, p.id, `rides home from ${p.name}, now given up`);
  const back = nearestHeld(from, p.id);
  if (back && back !== p.id) for (const u of ['foot', 'bow', 'cav', 'cat']) P(back).gar[u] += p.gar[u];
  for (const a of armiesOf(from)) if (a.loc === p.id) a.loc = back;
  for (const a of armiesOf(to)) if (a.siege === p.id) { a.siege = null; a.loc = p.id; }
  p.owner = to; p.ally = null; p.gar = eu(); p.build = null;
}
function payOffer(t, gold, pid) {
  const F = G.fac[me()];
  F.gold -= gold; G.fac[t].gold += gold;
  if (pid) cede(me(), t, P(pid));
}
function proposeTruce() {
  const t = DP.f, F = G.fac[me()];
  if (!t || sentTo(t) || F.gold < DP.gold) return;
  (F.envoys = F.envoys || {})[t] = G.turn;
  const ok = Math.random() < truceChance(me(), t, DP.len, DP.gold, DP.county);
  if (ok) {
    payOffer(t, DP.gold, DP.county);
    const until = Math.max(G.turn, peaceUntil(me(), t)) + DP.len;
    addTruce(me(), t, until, true); G.truces[G.truces.length - 1].treaty = true;
    sfx('bell'); buzz();
    report('A truce is sworn', `${rulerOf(t)} swears on the relics to keep the peace with you until ${dateStr(until)}${DP.gold || DP.county ? `, for ${[DP.gold ? DP.gold + ' d' : '', DP.county ? P(DP.county).name : ''].filter(Boolean).join(' and ')}` : ''}. Neither house may attack the other until then.`);
  } else { sfx('miss'); report('The envoys come home', `${rulerOf(t)} hears your envoys out and sends them home without a truce. Your gifts come home with them.`); }
  DP.county = null; DP.gold = 0;
  save(); closeModal(); render(); showReports();
}
function proposeJoint() {
  const t = DP.f, x = DP.target, F = G.fac[me()];
  if (!t || !x || sentTo(t) || F.gold < DP.gold) return;
  (F.envoys = F.envoys || {})[t] = G.turn;
  const ok = Math.random() < jointChance(me(), t, x, DP.gold, DP.county);
  if (ok) {
    payOffer(t, DP.gold, DP.county);
    const until = Math.max(G.turn, peaceUntil(me(), t)) + JOINT_TURNS;
    addTruce(me(), t, until, true); G.truces[G.truces.length - 1].treaty = true;
    G.fac[t].warOn = { target: x, until: G.turn + JOINT_TURNS };
    sfx('horn'); buzz();
    report('Common cause', `${rulerOf(t)} agrees to make war on ${FAC(x).name}${DP.gold || DP.county ? ` for ${[DP.gold ? DP.gold + ' d' : '', DP.county ? P(DP.county).name : ''].filter(Boolean).join(' and ')}` : ''}. There is peace between your houses until ${dateStr(until)}, and ${FAC(t).name}'s armies turn on ${FAC(x).name}.`);
  } else { sfx('miss'); report('The envoys come home', `${rulerOf(t)} will not go to war with ${FAC(x).name} on your account. Your gifts come home with your envoys.`); }
  DP.county = null; DP.gold = 0; DP.target = null;
  save(); closeModal(); render(); showReports();
}

function openDiplo(fid) {
  const F = G.fac[me()], houses = alive().filter(f => f !== me());
  if (fid) DP.f = fid;
  if (!houses.includes(DP.f)) DP.f = houses[0] || null;
  const t = DP.f;
  if (DP.gold > F.gold) DP.gold = 0;
  const picker = `<div class="dpick">${houses.map(f => `<button class="${f === t ? 'on' : ''}" onclick="DP.f='${f}';DP.county=null;DP.target=null;openDiplo()" title="${esc(FAC(f).name)}">${shield(f, 22)}<span>${esc(FAC(f).name.replace(/^The /, ''))}</span>${sentTo(f) ? '<i>✓</i>' : ''}</button>`).join('')}</div>`;
  if (!t) return showModal(`<h2>${ico('handshake')} Diplomacy</h2><p>No other house stands.</p>`, '', { closable: true });
  const T = G.fac[t], d = FAC(t);
  const r = relPower(t, me());
  const strength = r > 1.5 ? '<span class="bad">much stronger than you</span>' : r > 1.1 ? 'stronger than you' : r > 0.9 ? 'about your equal' : r > 0.6 ? 'weaker than you' : '<span class="good">much weaker than you</span>';
  const pu = peaceUntil(me(), t);
  let rel = atPeace(me(), t) ? (pu > G.turn ? `${ico('dove')} At peace with you until <b>${dateStr(pu)}</b>.` : isKing(t) ? `${ico('handshake')} Your king: you have done him homage.` : `${ico('handshake')} Your sworn man.`) : `${ico('swords')} No truce binds you.`;
  if (T.warOn && T.warOn.target) rel += ` At war with ${FAC(T.warOn.target).name} until ${dateStr(T.warOn.until)}.`;
  const head = `<div class="row" style="gap:10px;align-items:center;margin:6px 0">${shield(t, 46)}<div style="min-width:0"><h3 style="margin:0">${esc(d.name)}</h3><div class="sub">${esc(rulerOf(t))} · ${owned(t).length} counties · ${strength}${T.excom ? ' · <span class="bad">excommunicated</span>' : ''}</div></div></div><p>${rel}</p><div class="row" style="margin:-4px 0 6px"><button class="btn sm ghost" onclick="closeModal();goProv('${homeOf(t)}')"><span class="lbl">${ico('eye')}See ${P(homeOf(t)).name}</span></button></div>`;
  if (vassal(t) && isKing(me()) || (vassal(me()) && isKing(t))) {
    return showModal(`<h2>${ico('handshake')} Diplomacy</h2>${picker}${head}<p class="sub">An oath of homage binds you already. Open the crown and homage section of the realm panel to change it.</p>`, '', { closable: true });
  }
  const sent = sentTo(t) ? `<div class="notebox">${ico('scroll')} Your envoys have already been to ${esc(d.name)} this turn.</div>` : '';
  const cs = cedable(me(), t);
  const offer = `<h3>Your offer</h3>
    <div class="sub">Silver</div><div class="seg" style="display:flex;flex-wrap:wrap">${GIFTS.map(g => `<button class="${DP.gold === g ? 'on' : ''}" ${g > F.gold ? 'disabled' : ''} onclick="DP.gold=${g};openDiplo()">${g ? g + ' d' : 'none'}</button>`).join('')}</div>
    <div class="sub" style="margin-top:8px">A county <small>(one that borders them is worth more to them)</small></div>${cs.length ? `<div class="seg" style="display:flex;flex-wrap:wrap"><button class="${!DP.county ? 'on' : ''}" onclick="DP.county=null;openDiplo()">none</button>${cs.map(p => `<button class="${DP.county === p.id ? 'on' : ''}" onclick="DP.county='${p.id}';openDiplo()">${p.name}${adjTo(p, t) ? ' ✦' : ''}</button>`).join('')}</div>` : '<p class="sub" style="margin:2px 0">You have no county to give but your seat, which you cannot.</p>'}
    <p class="sub">Nothing changes hands unless they accept. A county is handed over with its walls and buildings; its garrison marches to your nearest county.</p>`;
  const tc = Math.round(truceChance(me(), t, DP.len, DP.gold, DP.county) * 100);
  const truce = `<h3>A truce</h3><p class="sub">Sworn on relics: neither house may attack the other until it ends.${atPeace(me(), t) ? ' A new truce is added to the end of the present one.' : ''}</p>
    <div class="seg" style="display:flex">${TRUCE_LENS.map(([n, l]) => `<button class="${DP.len === n ? 'on' : ''}" style="flex:1;flex-direction:column;gap:0" onclick="DP.len=${n};openDiplo()">${l}<small>${n} turns</small></button>`).join('')}</div>
    <button class="btn gold" style="margin-top:8px" onclick="proposeTruce()" ${sentTo(t) || F.gold < DP.gold ? 'disabled' : ''}><span class="lbl">${ico('dove')}Propose a truce of ${TRUCE_LENS.find(x => x[0] === DP.len)[1]}</span><small>${tc}% chance</small></button>`;
  const jt = jointTargets(me(), t);
  if (DP.target && !jt.includes(DP.target)) DP.target = null;
  const jc = DP.target ? Math.round(jointChance(me(), t, DP.target, DP.gold, DP.county) * 100) : 0;
  const joint = `<h3>A joint war</h3><p class="sub">${esc(d.name)} turns its armies on a house that borders it, and your two houses keep the peace for ${JOINT_TURNS} turns.</p>
    ${jt.length ? `<div class="seg" style="display:flex;flex-wrap:wrap">${jt.map(x => `<button class="${DP.target === x ? 'on' : ''}" onclick="DP.target='${x}';openDiplo()">${shield(x, 14)} ${esc(FAC(x).name)}</button>`).join('')}</div>
    <button class="btn red" style="margin-top:8px" onclick="proposeJoint()" ${!DP.target || sentTo(t) || F.gold < DP.gold ? 'disabled' : ''}><span class="lbl">${ico('swords')}${DP.target ? `War on ${esc(FAC(DP.target).name)}` : 'Choose a house to make war on'}</span><small>${DP.target ? jc + '% chance' : ''}</small></button>` : `<p class="sub">${esc(d.name)} borders no house it could make war on just now.</p>`}`;
  const marry = `<h3>A marriage</h3><p class="sub">${PACT_COST} d in gifts and one of your sons: peace for ${PACT_TURNS} turns.</p><button class="btn" onclick="closeModal();doPact('${t}')" ${canPact(me(), t) && F.gold >= PACT_COST ? '' : 'disabled'}><span class="lbl">${ico('ring')}Offer a marriage</span><small>${!F.sons ? 'no unmarried sons' : F.proposed ? 'already courted this turn' : atPeace(me(), t) ? 'already at peace' : recentPeace(me(), t) ? 'too soon after the last peace' : Math.round(pactChance(me(), t) * 100) + '% chance'}</small></button>`;
  showModal(`<h2>${ico('handshake')} Diplomacy</h2><p class="sub">Choose a house. One embassy to each house a turn.</p>${picker}${head}${sent}${offer}${truce}${joint}${marry}`, '', { closable: true });
}
