'use strict';
// ================= ACTIVE ARMY =================
function myA() {
  const arms = armiesOf(me());
  let a = arms.find(x => x.id === G.army);
  if (!a || !armyUsable(me(), a)) a = usableArmies(me())[0] || lordArmy(me());
  G.army = a.id; return a;
}
// selecting a county where one of your armies stands (or lays siege) puts that army under command,
// unless the army you already command is there
function armyAt(id) {
  const here = usableArmies(me()).filter(a => a.loc === id || a.siege === id);
  if (!here.length || here.some(a => a.id === G.army)) return;
  G.army = (here.find(a => !a.acted) || here[0]).id;
}
// the lord's captive host has nothing to command: its button opens the ransom instead
function openRansom() {
  G.sel = null; render(); if (isPhone()) setSheet('full');
  setTimeout(() => { const b = document.getElementById('ransombox'); if (b) { b.scrollIntoView({ behavior: 'smooth', block: 'center' }); b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 1200); } }, 60);
}
function pickArmy(id) { { const a = army(me(), id); if (a && slotState(a) === 'captive') { G.army = id; sfx('click'); return openRansom(); } } G.army = id; sfx('click'); render(); const a = army(me(), id); if (a.loc && !G.sel) focusProv(a.loc, VIEW.w); }
const ARMY_NUM = a => ARMY_IDS.indexOf(a.id) + 1;
function armyPay(a) { return atRest(me(), a) ? 0 : armyCost(a); }
function slotState(a) {
  const F = G.fac[me()], i = ARMY_IDS.indexOf(a.id);
  if (a.id === 'a0') return F.captive ? 'captive' : 'active';
  if (i >= armyMax(me())) return 'locked';
  if (!armyGen(me(), a)) return 'nogen';
  return 'active';
}
function renderArmyBar() {
  let el = $('#armybar');
  if (!el) { el = document.createElement('div'); el.id = 'armybar'; $('#mapwrap').appendChild(el); }
  const A = myA();
  setHTML(el, armiesOf(me()).map(a => {
    const st = slotState(a), n = armySize(a), on = a.id === A.id;
    if (st === 'locked') return `<button class="ab lock" onclick="openCourt()" title="${ARMY_IDS.indexOf(a.id) === 1 ? 'Hold 9 counties to field a second army' : 'Hold 25 counties, or be a king with two princes sworn to you, to field a third army'}">${ico('lock')}<span>${ARMY_NUM(a)}</span></button>`;
    if (st === 'nogen') return `<button class="ab lock" onclick="nogenClick()" title="Needs a general: tap to raise it">${ico('fleur')}<span>${ARMY_NUM(a)}</span></button>`;
    return `<button class="ab${on ? ' on' : ''}${a.acted ? ' done' : ''}" onclick="pickArmy('${a.id}')"><b>${ARMY_NUM(a)}</b><span class="n">${st === 'captive' ? ico('chain') : ico('foot') + n}</span><small>${st === 'captive' ? 'captive' : (a.loc ? P(a.loc).name : '—')}${a.siege ? ' ⚔' : ''}</small><small class="mv">${st === 'captive' ? '' : a.acted ? 'done' : a.mp + '/' + MOVES + ' mv'}</small></button>`;
  }).join(''));
}

// ================= HEADER =================
function renderHeader() {
  const f = FAC(me()), F = G.fac[me()];
  const gross = grossIncome(me()), up = upkeepOf(me());
  const net = gross - up;
  const chips = [`<span class="chip btn-like" onclick="openTreasury()" title="Treasury ${F.gold} d · income +${gross} · upkeep −${up} · net ${net >= 0 ? '+' : ''}${net} a turn">${ico('coin')}<span class="num">${F.gold}</span><small class="${net >= 0 ? 'good' : 'bad'}">${net >= 0 ? '+' : ''}${net}/turn</small></span>`];
  { const wars = alive().filter(f => f !== me() && atWar(me(), f)), left = TRUCE - G.turn;
    const tip = truce() ? `${SC.peace.Name}: ${left} turn${left === 1 ? '' : 's'} left` : wars.length ? `At war with ${wars.map(f => FAC(f).name).join(', ')}` : 'At war with no one';
    chips.push(truce() ? `<span class="chip peace btn-like" onclick="openRelations()" title="${esc(tip)}">${ico('dove')}<small>Peace · ${left}</small></span>` : wars.length ? `<span class="chip warn btn-like" onclick="openRelations()" title="${esc(tip)}">${ico('swords')}<small>War · ${wars.length}</small></span>` : `<span class="chip peace btn-like" onclick="openRelations()" title="${esc(tip)}">${ico('dove')}<small>Peace</small></span>`); }
  if (F.unrest) chips.push(`<span class="chip warn btn-like" onclick="goProv('${F.unrest.seed}')" title="Unrest at ${P(F.unrest.seed).name}">${ico('fire')}<small>${Math.max(0, F.unrest.at - G.turn)}</small></span>`);
  if (fairOpen()) chips.push(`<span class="chip ok btn-like" onclick="openFair()" title="${SC.fair.open}">${ico('market')}<small>Fair</small></span>`);
  if (G.diplo) chips.push(`<span class="chip ok btn-like" onclick="G.sel=null;render();setSheet('full')" title="An envoy waits">${ico('handshake')}</span>`);
  if (F.bless) chips.push(`<span class="chip ok" title="Blessed: your troops fight 12% harder">${ico('bless')}${F.bless}</span>`);
  if (F.excom) chips.push(`<span class="chip warn" title="Excommunicated">${ico('interdict')}${F.excom}</span>`);
  if (F.captive) chips.push(`<span class="chip warn btn-like" onclick="G.sel=null;render();setSheet('full')" title="Your lord is a prisoner">${ico('chain')}</span>`);
  if (G.offers.length) chips.push(`<span class="chip ok btn-like" onclick="G.sel=null;render();setSheet('full')" title="Ransom offers">${ico('coin')}${G.offers.length}</span>`);
  setHTML($('#hdr'), `<div class="hfac"><span class="hach" onclick="openTitles()" title="Your titles">${houseAchievement(me(), 50)}</span><div style="min-width:0"><div class="hname">${esc(f.name)}</div><div class="hdate">${esc(dateStr(G.turn))}<span class="hrv"> · ${alive().length - 1} rival${alive().length === 2 ? '' : 's'}</span></div></div></div>
    <div class="hchips">${chips.join('')}</div>
    <div class="hbtns">
      <button class="btn sm desk" onclick="openCourt()"><span class="lbl">${ico('fleur')}Court</span></button>
      <button class="btn sm desk" onclick="openDiplo()"><span class="lbl">${ico('handshake')}Diplomacy</span></button>
      <button class="btn sm desk" onclick="openPope()"><span class="lbl">${ico('church')}Church</span></button>
      <button class="btn sm desk ibtn" onclick="openLog()" title="Chronicle" style="position:relative">${ico('scroll')}${G.unread ? `<span style="position:absolute;top:-4px;right:-4px;background:#b8342c;color:#fff;border-radius:9px;font-size:10px;padding:1px 5px">${G.unread}</span>` : ''}</button>
      <button class="btn sm ibtn" onclick="openSaves()" title="Save / load">${ico('chest')}</button>
      <button class="btn sm ibtn" onclick="openSettings()" title="Settings">${ico('gear')}</button>
      <button class="btn sm gold desk" onclick="playerEndTurn()"><span class="lbl">End turn ${ico('next')}</span></button>
    </div>`);
}

// ================= SHARED FRAGMENTS =================
function armyLine(a) {
  const g = armyGen(me(), a), st = slotState(a);
  if (st === 'captive') return `<div class="notebox bad">${ico('chain')} ${rulerOf(me())} is a prisoner${G.fac[me()].captive.by ? ' of ' + fname(G.fac[me()].captive.by) : ''}. His host cannot take the field until he is ransomed.<div class="row" style="margin-top:6px"><button class="btn sm gold" onclick="openRansom()"><span class="lbl">${ico('chain')}Ransom him</span></button></div></div>`;
  if (!a.loc) return '<p class="sub">Nowhere</p>';
  return `<p>${a.siege ? `${ico('tent')} Besieging <b>${P(a.siege).name}</b>` : `At <b>${P(a.loc).name}</b>`}${g ? ` · ${a.id === 'a0' ? 'with' : 'led by'} <b>${g.n}</b>` : ''} · ${a.acted ? 'has fought' : `${a.mp} of ${MOVES} moves`}</p><p class="units">${uStr(a, false)} <span class="sub">· ${atRest(me(), a) ? 'at rest in the castle: no pay' : `on campaign: ${armyCost(a)} d a turn`}</span></p>`;
}
function armiesHtml() {
  const F = G.fac[me()], A = myA();
  return armiesOf(me()).map(a => {
    const st = slotState(a), i = ARMY_IDS.indexOf(a.id);
    let body;
    if (st === 'locked') body = `<p class="sub">${i === 1 ? 'Hold 9 counties to field a second army.' : 'Hold 25 counties, or be a king with two princes sworn to you, to field a third army.'} <span class="muted">(${owned(me()).length} counties${isKing(me()) ? ', crowned' : ', no crown'})</span></p>`;
    else if (st === 'nogen') body = `<p class="sub">Waiting for a general. Hire one at court, or post an idle strategist here.</p><button class="btn sm" onclick="openCourt()"><span class="lbl">${ico('fleur')}Court</span></button>`;
    else body = armyLine(a) + (st === 'active' ? `<div class="row" style="margin-top:6px">${a.id !== A.id ? `<button class="btn sm" onclick="pickArmy('${a.id}')"><span class="lbl">${ico('flag')}Command</span></button>` : ''}${a.loc ? `<button class="btn sm ghost" onclick="goProv('${a.loc}')"><span class="lbl">${ico('eye')}Go there</span></button>` : ''}</div>` : '');
    return `<div class="statcard${a.id === A.id && st === 'active' ? ' on' : ''}"><b>${ARMY_NUM(a)} · ${armyLabel(me(), a)}</b>${st === 'active' && a.acted ? ' <span class="tag">done</span>' : ''}${body}</div>`;
  }).join('');
}
function garrisonsHtml() {
  const ps = provList().filter(p => holds(me(), p.id)).sort((a, b) => garMen(b) - garMen(a) || a.name.localeCompare(b.name));
  return `<p class="sub">Men in a garrison stay put when your armies march. The number beside a castle on the map is its garrison. The levy is raised by each county and defends it too.</p><div class="rivals">${ps.map(p => `<div class="rival" onclick="goProv('${p.id}')"><div style="min-width:0"><b>${p.name}</b>${isCap(p) ? ' ' + ico('crown') : ''}<div class="sub" style="font-size:13px">${p.b.castle ? (p.ruined ? 'ruined castle' : CASTLE_N[castleLv(p)].toLowerCase() + ' · walls ' + p.walls + '%') : 'no castle'}${besieging(p) ? ' · <span class="bad">besieged</span>' : ''}</div></div><div class="pw"><b>${garMen(p)}</b>${p.gar.cat ? p.gar.cat + ' cat. · ' : ''}levy ${p.militia}</div></div>`).join('')}</div>`;
}
// two bars: how they feel about you, and where things stand between you
function relBars(o) {
  const a = attitude(o, me()), parts = attitudeParts(o, me()).sort((x, y) => Math.abs(y[0]) - Math.abs(x[0]));
  const st = allied(me(), o) ? 3 : atPeace(me(), o) ? 2 : atWar(me(), o) ? 0 : 1;
  const segs = [['At war', '#a3222c'], ['No pact', '#8a7458'], ['Pact', '#2e9a4a'], ['Allied', '#2f6fd6']];
  return `<div class="relb"><div class="rlab"><span>Hostile</span><b>${attWord(a)}</b><span>Friendly</span></div><div class="mood"><i style="left:${((a + 1) / 2 * 100).toFixed(0)}%"></i></div>
    ${parts.length ? `<div class="why">${parts.slice(0, 4).map(([v, t]) => `<span class="${v > 0 ? 'good' : 'bad'}">${v > 0 ? '▲' : '▼'} ${esc(t)}</span>`).join('')}</div>` : '<div class="why"><span class="sub">Nothing between you yet.</span></div>'}
    <div class="rstate">${segs.map(([n, c], i) => `<span class="${i === st ? 'on' : ''}" style="--c:${c}">${n}</span>`).join('')}</div></div>`;
}
// where a house stands: with you, and with everyone else
function houseStatus(o) {
  const T = G.fac[o], rows = [];
  const pu = peaceUntil(me(), o);
  if (allied(me(), o)) rows.push(`${ico('handshake')} Your ally until ${dateStr(pu)}: your armies may cross each other's lands.`); else if (atPeace(me(), o)) rows.push(`${ico('dove')} Pact of peace until ${dateStr(pu)}.`); else if (truce()) rows.push(`${ico('dove')} The Peace of God holds until ${dateStr(TRUCE)}.`);
  if (T.warOn && T.warOn.target && G.fac[T.warOn.target] && G.fac[T.warOn.target].alive) rows.push(`${ico('swords')} Sworn to make war on ${T.warOn.target === me() ? '<b class="bad">you</b>' : esc(FAC(T.warOn.target).name)} until ${dateStr(T.warOn.until)}.`);
  const others = alive().filter(f => f !== me() && f !== o);
  const al = others.filter(f => allied(o, f)), pe = others.filter(f => atPeace(o, f) && !allied(o, f));
  if (al.length) rows.push(`${ico('handshake')} Allied with ${al.map(f => esc(FAC(f).name)).join(', ')}.`);
  if (pe.length) rows.push(`${ico('dove')} At peace with ${pe.map(f => esc(FAC(f).name)).join(', ')}.`);
  if (isKing(o)) rows.push(`${ico('crown')} Wears ${SC.crown.the}.`);
  if (T.excom > 0) rows.push(`${ico('interdict')} Excommunicated.`);
  if (T.captive) rows.push(`${ico('chain')} Its lord is a prisoner${T.captive.by ? ' of ' + esc(fname(T.captive.by)) : ''}.`);
  return `<div class="statcard">${relBars(o)}${rows.map(r => `<p style="margin:3px 0">${r}</p>`).join('')}</div>`;
}
// the treasury, line by line
function openTreasury() {
  const F = G.fac[me()], mine = owned(me()), al = allies(me());
  const cty = mine.reduce((s, p) => s + provIncome(p), 0), ally = al.reduce((s, p) => s + provIncome(p), 0), raw = cty + ally, gross = grossIncome(me());
  const adj = gross - raw, up = upkeepOf(me()), net = gross - up;
  const top = mine.map(p => [p, provIncome(p)]).sort((a, b) => b[1] - a[1]);
  const rowsI = [[`${mine.length} counties`, cty], ...(al.length ? [[`${al.length} sworn lords (half their income)`, ally]] : []), ...(adj ? [[adminMult(me()) < 1 && F.excom > 0 ? 'A large realm, and excommunication' : adminMult(me()) < 1 ? `A realm this large (${Math.round(adminMult(me()) * 100)}%)` : 'Excommunicated (−25%)', adj]] : [])];
  const rowsE = armiesOf(me()).filter(a => armySize(a)).map(a => [`Army ${ARMY_NUM(a)}: ${armySize(a)} men${atRest(me(), a) ? ', at rest in a castle' : a.siege ? ', at a siege' : ', on campaign'}`, -armyPay(a)]);
  const line = ([k, v], cls) => `<tr><td>${k}</td><td class="${cls || (v < 0 ? 'bad' : '')}">${v > 0 ? '+' : ''}${v} d</td></tr>`;
  showModal(`<h2>${ico('coin')} The treasury</h2>
    <div class="tiles" style="grid-template-columns:repeat(3,1fr)"><div class="tile">${ico('coin')}<div class="v">${F.gold}</div><div class="k">In the treasury</div></div><div class="tile"><div class="v good">+${gross}</div><div class="k">Income a turn</div></div><div class="tile"><div class="v ${net >= 0 ? 'good' : 'bad'}">${net >= 0 ? '+' : ''}${net}</div><div class="k">Net a turn</div></div></div>
    <h3>Income</h3><table class="sttab">${rowsI.map(r => line(r)).join('')}<tr><td><b>Total</b></td><td class="good"><b>+${gross} d</b></td></tr></table>
    <h3>Upkeep</h3><table class="sttab">${rowsE.length ? rowsE.map(r => line(r, r[1] ? 'bad' : 'good')).join('') : '<tr><td colspan="2" class="sub">No armies in the field.</td></tr>'}<tr><td><b>Total</b></td><td class="${up ? 'bad' : 'good'}"><b>${up ? '−' + up : 0} d</b></td></tr></table>
    <p class="sub">Garrisons cost nothing. An army is paid while on campaign; once it has spent a full turn without marching or fighting in a castle of yours, it is lodged with the garrison at no cost.</p>
    <h3>Richest counties</h3><table class="sttab">${top.slice(0, 6).map(([p, v]) => `<tr><td><span style="cursor:pointer;text-decoration:underline" onclick="closeModal();goProv('${p.id}')">${p.name}</span></td><td>${v} d</td></tr>`).join('')}</table>`, '', { closable: true });
}
// peace and war, at a glance
function openRelations() { DP.f = 'me'; return openDiplo(); }
function openRelationsOld() {
  const left = TRUCE - G.turn, others = alive().filter(f => f !== me());
  const rowsFor = list => list.map(([f, extra]) => `<div class="rival" onclick="closeModal();openDiplo('${f}')">${shield(f, 22)}<div style="min-width:0"><b>${esc(FAC(f).name)}</b><div class="sub" style="font-size:13px">${extra}</div></div></div>`).join('');
  const wars = others.filter(f => atWar(me(), f)).map(f => [f, `fought in the last two years · ${attWord(attitude(f, me())).toLowerCase()}`]);
  const ally = others.filter(f => allied(me(), f)).map(f => [f, `allied until ${dateStr(peaceUntil(me(), f))}`]);
  const pact = others.filter(f => atPeace(me(), f) && !allied(me(), f)).map(f => [f, `at peace until ${dateStr(peaceUntil(me(), f))}`]);
  showModal(`<h2>${ico(truce() ? 'dove' : 'swords')} Peace and war</h2>
    ${truce() ? `<div class="notebox good">${ico('dove')} <b>${SC.peace.Name}</b> forbids war between the great houses for ${left} more turn${left === 1 ? '' : 's'}, until ${dateStr(TRUCE)}. Lesser lords may be attacked.</div>` : ''}
    <h3>At war with</h3>${wars.length ? `<div class="rivals">${rowsFor(wars)}</div>` : '<p class="sub">No one has fought you, or you them, in the last two years.</p>'}
    ${ally.length ? `<h3>Allies</h3><div class="rivals">${rowsFor(ally)}</div>` : ''}
    ${pact.length ? `<h3>Pacts of peace</h3><div class="rivals">${rowsFor(pact)}</div>` : ''}
    <p class="sub">Every other house may attack you, and you them. Tap a house to send envoys.</p>`, '', { closable: true });
}
function crownsHtml() {
  const F = G.fac[me()], k = king(), others = alive().filter(f => f !== me());
  let h = '';
  if (isKing(me())) {
    const n = crownIncome(me());
    h += `<div class="statcard on"><b>${ico('crown')} ${SC.crown.title}</b><ul><li>+1 d from each of your ${n} counties in the kingdom: <b>+${n} d a turn</b></li><li>Double levies there</li><li>The royal host: +10% attack</li><li>Lesser lords swear to you for a third less</li></ul></div>`;
    return h;
  }
  if (k) h += `<p>${ico('crown')} The crown is worn by <b>${esc(FAC(k).pname)}</b>. ${SC.crown.take}</p>`;
  else h += `<p>${ico('crown')} No one wears ${SC.crown.the}.</p>`;
  const need = crownNeeds(me());
  h += `<div class="statcard"><b>The coronation</b><br>${SC.crown.coronation} You need ${need.map(id => `<b>${P(id).name}</b> ${P(id).owner === me() ? '<span class="good">(held)</span>' : '<span class="bad">(not held)</span>'}`).join(' and ')}, and at least ${CROWN_LANDS} counties of the kingdom (you hold ${domainHeld(me())}).${me() === 'charles' ? ' <span class="sub">As a Carolingian, Laon serves you for Paris.</span>' : ''}<br><span class="sub">A prince who holds ${CROWN_GREAT} counties of the kingdom needs only ${P(SC.kingdom.keys[0]).name}: the bishops cannot refuse him.</span><br><span class="sub">The king's counties in the kingdom pay +1 d and raise double levies, his host fights 10% harder, and lesser lords swear to him for a third less.</span>${canCrown(me()) ? `<br><button class="btn gold" onclick="doCrown('franks')" ${F.gold >= CROWN_COST ? '' : 'disabled'}><span class="lbl">${ico('crown')}Be ${SC.crown.crowned}</span><small>${CROWN_COST} d for the coronation</small></button>` : ''}</div>`;
  return h;
}
function prisonersHtml() {
  const held = alive().filter(f => G.fac[f].captive && G.fac[f].captive.by === me());
  if (!held.length) return '';
  let h = '';
  for (const f of held) {
    const n = ransomHeld(f), o = G.offers.find(x => x.fid === f);
    h += `<div class="statcard"><p style="margin:0">${ico('chain')} <b>${rulerOf(f)}</b> <span class="sub">(held ${n} turn${n > 1 ? 's' : ''})</span></p>`;
    if (o) h += `<p>${FAC(f).name} offers <b>${o.sum} d</b>.${n >= 3 ? ' After three turns you must accept.' : ' Hold him and the next offer will be lower, but his house stays without its lord.'}</p><div class="grid2"><button class="btn gold" onclick="doOffer('${f}',true)">Accept ${coin(o.sum)}</button>${n < 3 ? `<button class="btn" onclick="openHagglePrisoner('${f}')">Haggle for more</button><button class="btn" onclick="doOffer('${f}',false)">Keep him another turn</button>` : ''}</div>`;
    else h += `<p class="sub">No ransom has been offered yet.</p>`;
    h += '</div>';
  }
  return h;
}
function marriageHtml() {
  const F = G.fac[me()];
  const ladies = provList().filter(p => p.heiress && !p.owner);
  let h = `<p>Unmarried sons: <b>${F.sons}</b>. One courtship a turn; a son is spent only when a lady accepts.${F.proposed ? ' <span class="sub">You have courted this turn.</span>' : ''}${F.sons ? '' : ' <span class="sub">The Pope can grant a dispensation for another.</span>'}</p>`;
  h += ladies.length ? `<p class="sub">Heiresses (win one and her county is yours, garrison and all):</p><div class="grid">${ladies.map(p => `<button class="btn" onclick="goProv('${p.id}')"><span class="lbl">${ico('ring')}Lady ${p.heiress}</span><small>${p.name}${p.ally ? ' · sworn to ' + fname(p.ally) : ''} · floor ${courtFloor(p)}</small></button>`).join('')}</div>` : '<p class="sub">No heiresses are of marrying age just now.</p>';
  const foes = alive().filter(f => f !== me());
  h += `<p class="sub" style="margin-top:10px">Marriage pacts with rival houses (${PACT_COST} d in gifts; peace for ${PACT_TURNS} turns, neither may attack the other):</p><div class="grid">${foes.map(f => `<button class="btn" onclick="doPact('${f}')" ${canPact(me(), f) && F.gold >= PACT_COST ? '' : 'disabled'}><span class="lbl">${shield(f, 14)} ${FAC(f).name}</span><small>${atPeace(me(), f) ? 'already at peace' : recentPeace(me(), f) ? 'too soon after the last peace' : Math.round(pactChance(me(), f) * 100) + '% chance'}</small></button>`).join('')}</div>`;
  return h;
}
function goProv(id) { G.sel = 'p:' + id; armyAt(id); render(); focusProv(id); if (isPhone()) setSheet('half'); }
function unrestBox(p) {
  const F = G.fac[me()], u = F.unrest; if (!u || (p && u.seed !== p.id)) return '';
  const left = u.at - G.turn, covered = unrestCovered(me());
  return `<div class="notebox bad">${ico('fire')} <b>Unrest at ${P(u.seed).name}.</b> ${covered ? 'Your army there overawes the malcontents; keep at least 8 men in the county until ' + dateStr(u.at) + '.' : `Unless an army of at least 8 men stands in ${P(u.seed).name} by ${dateStr(u.at)} (${left} turn${left === 1 ? '' : 's'}), or they are bought off, the lords there will rise and carry a quarter of the realm with them.`}
    <div class="row" style="margin-top:8px">${!covered ? `<button class="btn gold sm" onclick="doAppease()" ${F.gold >= u.cost ? '' : 'disabled'}><span class="lbl">${ico('coin')}Buy them off · ${u.cost} d</span></button>` : ''}${!p ? `<button class="btn sm" onclick="goProv('${u.seed}')"><span class="lbl">${ico('eye')}Go there</span></button>` : ''}</div></div>`;
}
function envoyBox() {
  const D = G.diplo; if (!D) return '';
  const nm = FAC(D.from).name;
  return `<div class="notebox good">${ico('handshake')} <b>An envoy from ${nm}.</b> ${D.kind === 'pact' ? `${rulerOf(D.from)} offers a marriage between the houses${D.gift ? ` with ${D.gift} d in gifts` : ''}: peace for ${PACT_TURNS} turns.` : `${rulerOf(D.from)} proposes a joint war on ${FAC(D.target).name}${D.gift ? `, with ${D.gift} d to seal it` : ''}: peace between you for ${JOINT_TURNS} turns while ${nm} turns its armies on ${FAC(D.target).name}.`} The envoy leaves at the end of the turn.
    <div class="grid2"><button class="btn gold sm" onclick="doDiplo('${D.id}',true)">Accept</button><button class="btn sm" onclick="doDiplo('${D.id}',false)">Decline</button></div></div>`;
}

// ================= OVERVIEW =================
function overviewPanel() {
  const f = FAC(me()), F = G.fac[me()], A = myA();
  const held = empireHeld(me());
  const rivals = alive().filter(x => x !== me()).concat(G.fdefs.map(d => d.id).filter(id => !G.fac[id].alive && FACMAP[id]));
  const wb = ['forge', 'armory', 'stables'].filter(t => owned(me()).some(p => p.b[t]));
  const men = totalMen(me()), net = netIncome(me());
  let ransom = '';
  if (F.captive) { const price = ransomPrice(me()), n = ransomHeld(me()); ransom = `${canHaggleRansom(F) ? `<button class="btn gold" onclick="openHaggleRansom()"><span class="lbl">${ico('chain')}Receive the captor's envoy</span><small>haggle over the price</small></button>` : F.haggled === G.turn ? '<p class="sub">The envoy has gone home; he will return next turn.</p>' : ''}<button class="btn red" onclick="doRansom()" ${F.gold >= price ? '' : 'disabled'}><span class="lbl">${ico('chain')}Offer the usual ransom · ${coin(price)}</span></button><p class="sub">Held ${n} turn${n > 1 ? 's' : ''}. The price is twice your income after one turn, your full income after two, then half; after three turns his captor must accept.</p>`; }
  const tiles = `<div class="tiles">
    <div class="tile${net < 0 ? ' warn' : ''}" onclick="goProv('${homeOf(me())}')">${ico('coin')}<div class="v">${F.gold}<small style="${net < 0 ? 'color:var(--red)' : ''}"> ${net >= 0 ? '+' : ''}${net}</small></div><div class="k">Deniers</div></div>
    <div class="tile${!men && !F.captive ? ' warn' : ''}" onclick="ACC.armies=true;render();document.getElementById('acc-armies').scrollIntoView({behavior:'smooth'})">${ico(F.captive ? 'chain' : 'sword')}<div class="v">${men}<small> ${usableArmies(me()).length}/${armyMax(me())}</small></div><div class="k">Men · armies</div></div>
    <div class="tile" onclick="toggleAcc('houses')">${ico('map')}<div class="v">${owned(me()).length}<small>${allies(me()).length ? ' +' + allies(me()).length : ''}</small></div><div class="k">Counties</div></div>
    <div class="tile" onclick="ACC.marriage=true;render();document.getElementById('acc-marriage').scrollIntoView({behavior:'smooth'})">${ico('ring')}<div class="v">${F.sons}</div><div class="k">Sons</div></div>
    <div class="tile" onclick="openPope()">${ico('church')}<div class="v">${F.bishops}<small> ${F.cardinals}✦</small></div><div class="k">Bishops</div></div>
    <div class="tile" onclick="openCourt()">${ico('fleur')}<div class="v">${F.gens.length}</div><div class="k">Generals</div></div>
  </div>`;
  const prisoners = prisonersHtml();
  return `<div class="phead">${shield(me(), 46)}<div><h2>${esc(rulerOf(me()))}</h2><span class="sub">${esc(f.trait || (f.realm === 'Rebel' ? 'A rebel house, risen in civil war.' : ''))}</span></div></div>
    ${tiles}
    ${unrestBox()}${envoyBox()}${fairOpen() ? `<div class="notebox good">${ico('market')} <b>${SC.fair.open}</b> this turn only. Your carts are worth about ${fairCap()} d there.<div class="row" style="margin-top:6px"><button class="btn gold sm" onclick="openFair()"><span class="lbl">${ico('market')}Go to the fair</span></button></div></div>` : ''}
    ${F.captive ? `<div id="ransombox"><div class="notebox bad">${ico('chain')} ${rulerOf(me())} is a prisoner${F.captive.by ? ' of ' + fname(F.captive.by) : ''}. His host cannot take the field until he is ransomed; your generals' armies still can.</div>${ransom}</div>` : ''}
    ${prisoners ? acc('prisoners', 'Your prisoners', 'chain', prisoners, G.offers.length ? G.offers.length + ' offer' + (G.offers.length > 1 ? 's' : '') : '') : ''}
    ${acc('garrisons', 'Your garrisons', 'castle', garrisonsHtml(), owned(me()).reduce((a, p) => a + garMen(p), 0) + ' men')}
    ${acc('armies', 'Your armies', 'sword', armiesHtml() + `<p class="sub">Garrisons cost nothing. An army on campaign is paid every turn (foot ${UPKEEP.foot}, bow ${UPKEEP.bow}, horse ${UPKEEP.cav}, catapult ${UPKEEP.cat} d); after a full turn at rest in a castle of yours it is lodged free. Upkeep now ${upkeepOf(me())} d against ${grossIncome(me())} d of income. If the treasury runs dry, men desert.</p>`, `${men} men · ${upkeepOf(me())} d`)}
    ${acc('road', 'Your goal: ' + GOALS[goalId()].n, 'crown', goalHtml(held), goalCount(held))}
    ${acc('crowns', 'The crown', 'crown', crownsHtml(), isKing(me()) ? 'yours' : king() ? '' : 'vacant')}
    ${acc('marriage', 'Marriages', 'ring', marriageHtml(), F.sons + ' son' + (F.sons === 1 ? '' : 's'))}
    ${acc('realm', 'The realm', 'map', `
      <p>Income ${coin(grossIncome(me()))} a turn, upkeep ${coin(upkeepOf(me()))} · net ${coin(net)}</p>
      <p>Church: ${F.bishops} bishop${F.bishops === 1 ? '' : 's'}, ${F.cardinals} cardinal${F.cardinals === 1 ? '' : 's'} · influence with the Pope ${Math.round(influence(me()) * 100)}%</p>
      <p>War buildings: ${wb.length ? wb.map(t => `<span class="tag on">${ico(BLD_ICON[t])}${BLD[t].n}</span>`).join('') : '<span class="sub">none. A forge, armory and stables can be built at any castle.</span>'}</p>
      <p>Generals: ${F.gens.length ? F.gens.map(g => `${GENMAP[g.id].n} <span class="sub">(${genPost(me(), g)})</span>`).join(', ') : '<span class="sub">none. Hire one at court.</span>'}</p>
      <p>Allied lords: ${allies(me()).length ? allies(me()).map(p => `<span class="tag" onclick="goProv('${p.id}')" style="cursor:pointer">${p.name}</span>`).join('') : '<span class="sub">none</span>'}</p>
      ${G.truces.filter(t => t.a === me() || t.b === me()).map(t => `<p>${ico('dove')} ${t.pact ? 'Peace' : 'Truce of God'} with ${fname(t.a === me() ? t.b : t.a)} until ${dateStr(t.until)}</p>`).join('')}`)}
    ${acc('houses', 'Other houses', 'people', `<div class="rivals">${rivals.map(id => { const R = G.fac[id], d = FAC(id); return `<div class="rival${R.alive ? '' : ' dead'}" onclick="${R.alive ? `goProv('${homeOf(id)}')` : ''}">${shield(id, 24)}<div style="min-width:0"><b>${esc(d.name)}</b>${d.realm === 'Rebel' ? ' <span class="tag red">rebels</span>' : ''}${isKing(id) ? ' <span class="tag on">king</span>' : ''}${allied(me(), id) ? ' <span class="tag on">ally</span>' : ''}<div class="sub" style="font-size:13px">${R.alive ? `${esc(rulerOf(id))}${R.excom ? ' · <span class="bad">excommunicated</span>' : ''}${R.captive ? ' · <span class="bad">lord captive</span>' : ''}${allied(me(), id) ? ' · your ally' : atPeace(me(), id) ? ' · at peace with you' : atWar(me(), id) ? ' · <span class="bad">at war with you</span>' : ''} · ${attWord(attitude(id, me())).toLowerCase()}${R.fallen ? ' · rallied once' : ''}` : 'destroyed'}</div></div>${R.alive ? `<div class="pw"><b>${owned(id).length} counties</b>armies ${usableArmies(id).map(a => armySize(a)).join('+') || '0'}</div>` : ''}</div>`; }).join('')}</div>`, `${alive().length - 1} standing`)}
    <p class="hint" style="margin-top:14px">Tap a county. Pinch or scroll to zoom, drag to pan, double-tap to zoom in. Green dots mark where the chosen army can march; red dashes mark what it can strike this turn.</p>
    <p class="sub ctr">Rivals: ${diff().n.toLowerCase()} · ${G.turn} turn${G.turn === 1 ? '' : 's'} played</p>
    <div class="row"><button class="btn sm" onclick="openSaves()"><span class="lbl">${ico('chest')}Save / load</span></button><button class="btn sm" onclick="openHelp()"><span class="lbl">${ico('info')}How to play</span></button><button class="btn sm" onclick="homeView(true)"><span class="lbl">${ico('home')}Find my lands</span></button><button class="btn sm ghost" onclick="confirmNew()">New game</button></div>`;
}

// progress toward the goal chosen at the start
function goalHtml(held) {
  const g = goalId(), rivals = alive().length - 1;
  const fall = `<p class="sub">Take a house's seat (${ico('crown')}) and you win it and every county beside it; a house with four connected counties left rallies once under an heir, the rest falls to its castellans.</p>`;
  const size = owned(me()).length > 20 ? `<p class="sub">A realm this size yields ${Math.round(adminMult(me()) * 100)}% of its income.</p>` : '';
  if (g === 'king') {
    const crowned = wears(me()), dh = domainHeld(me()), dn = domainNeed(), k = king();
    return `<p>${GOALS.king.d}</p>
      <p>${ico('crown')} ${winSeats(me()).map(id => `${P(id).name} ${P(id).owner === me() ? '<span class="good">held</span>' : '<span class="bad">not held</span>'}`).join(' · ')}${crowned ? ' · <span class="good">anointed</span>' : k ? ` · the crown is worn by ${esc(FAC(k).pname)}` : ''}</p>
      <p>${ico('map')} Your own counties in the kingdom: ${dh} of ${dn}</p><div class="bar"><i style="width:${pct(Math.min(dh, dn), dn)}%"></i></div>
      ${(() => { const r = greatRival(me()), rh = r ? domainHeld(r) : 0, ok = rh <= rivalCap(); return r ? `<p>${ico('swords')} Your greatest rival: ${esc(FAC(r).name)}, with ${rh} counties. ${ok ? '<span class="good">No rival holds more than ' + rivalCap() + '.</span>' : `<span class="bad">Bring every rival down to ${rivalCap()} or fewer.</span>`}</p>` : ''; })()}
      <p class="sub">The first house to have all three wins, and is crowned as it wins: there is no need to hold a coronation first.${G.playOn && goalMet(me()) ? `<br><button class="btn gold" onclick="claimWin()"><span class="lbl">${ico('crown')}Claim the victory</span></button>` : ''}${k && k !== me() ? ` The king holds ${domainHeld(k)} of the kingdom's counties.` : ''}</p>${size}`;
  }
  return `<p>${GOALS.conquest.d} <b>${rivals}</b> rival house${rivals === 1 ? '' : 's'} still stand${rivals === 1 ? 's' : ''}.</p>${fall}<p class="sub">You hold ${domainHeld(me())} of the kingdom's ${FRANCE.length} counties.</p><div class="bar"><i style="width:${pct(domainHeld(me()), FRANCE.length)}%"></i></div>${size}`;
}
function goalCount(held) { return goalId() === 'king' ? `${wears(me()) ? 'crowned · ' : ''}${domainHeld(me())}/${domainNeed()}${domainHeld(me()) >= domainNeed() && !undisputed(me()) ? ' · rival too strong' : ''}` : `${alive().length - 1} left`; }

// ================= PROVINCE =================
const PANEL = { tab: null };
// the tab last chosen stays open as you tap from county to county; own and foreign counties each keep their own
function setTab(t) { PANEL.tab = t; PANEL.hist = [t, ...(PANEL.hist || []).filter(x => x !== t)].slice(0, 6); render(); }
const keptTab = tabs => [PANEL.tab, ...(PANEL.hist || [])].find(t => t && tabs.some(x => x.id === t));
function tabsHtml(tabs, cur) { return `<div class="tabs">${tabs.map(t => `<button class="${cur === t.id ? 'on' : ''}" onclick="setTab('${t.id}')">${ico(t.ic)}${t.n}${t.dot ? '<span class="dot"></span>' : ''}</button>`).join('')}</div>`; }
// how many of a unit are already there, big on the button, so the next purchase is easy to judge
const haveBadge = (n, where) => `<span class="have${n ? '' : ' none'}" title="${n} ${where}"><b>${n || 0}</b><i>${where}</i></span>`;
function castleText(p) {
  if (!p.b.castle) return `<p class="sub">No castle. Only the levy defends, and no garrison can be kept here.</p>`;
  if (p.ruined) return `<div class="notebox bad">${ico('rebuild')} The castle lies in ruins. Its walls give no protection until it is rebuilt.</div>`;
  return `<p>${ico('castle')} ${CASTLE_N[castleLv(p)]}${p.b.moat ? ' with a moat' : ''}${isCap(p) ? ', citadel' : ''} · walls ${p.walls}% <span class="sub">(defenders ${['fight in the open', 'protected', 'well protected', 'strongly protected', 'nearly unassailable'][Math.min(4, Math.ceil(wallLvl(p)))]})</span></p>${p.walls < 100 ? `<p class="sub">${besiegerOf(p) ? 'No repairs while the siege lasts.' : `Masons mend 10% a turn: whole in ${Math.ceil((100 - p.walls) / WALL_MEND)} turn${Math.ceil((100 - p.walls) / WALL_MEND) === 1 ? '' : 's'}.`} Below ${RUIN_AT}% the castle falls into ruin and must be paid for to rebuild.</p>` : ''}<div class="bar walls"><i style="width:${p.walls}%"></i></div>${hasOuter(p) ? `<p style="margin:6px 0 0">${ico('wall')} Outer wall · ${p.outer ?? 100}% <span class="sub">(must fall before the inner walls can be breached)</span></p><div class="bar walls"><i style="width:${p.outer ?? 100}%"></i></div>` : ''}${castleLv(p) === 1 ? '<p class="sub">A wooden palisade: quick to raise, but it barely slows an assault. Raise it to stone to hold the county.</p>' : ''}`;
}
// what a county is worth: to whoever holds it now, to you if you took it, and at the fair
function wealthCard(p) {
  const mine = incomeFor(p, me()), steps = reachOf(me(), p), now = p.owner ? incomeFor(p, p.owner) : p.ally ? Math.floor(minorIncome(p) / 2) : 0;
  const lots = WARES.map(w => [w, p.b[w.id] || 0]).filter(x => x[1]).map(([w, n]) => `${n} lot${n > 1 ? 's' : ''} of ${w.grades[Math.min(2, n - 1)].toLowerCase()}`);
  const bl = ['farm', 'market', 'port', 'mine'].filter(t => p.b[t]).map(t => `${BLD[t].n.toLowerCase()} ${ROMAN[p.b[t]]}`);
  return `<div class="statcard wealth"><p style="margin:0">${ico('coin')} ${p.owner ? `Pays ${esc(FAC(p.owner).name)} <b>${now} d</b> a turn.` : p.ally ? `Pays ${esc(fname(p.ally))} <b>${now} d</b> a turn as an ally.` : `Its lord keeps <b>${p.base} d</b> a turn.`} Yours, it would pay <b>${mine} d</b> a turn${steps > 3 ? ` <span class="sub">(${steps} steps from your seat, so ${Math.round(reachMult(me(), p) * 100)}%)</span>` : ''}.${p.cap && p.cap === p.owner ? ' <span class="sub">A seat pays double only to its own house.</span>' : ''}</p>
    <p style="margin:4px 0 0" class="sub">${bl.length ? `Buildings: ${bl.join(', ')}.` : 'No farms, markets, mines or ports yet.'}${lots.length ? ` At the fair it would add ${lots.join(', ')}.` : ''}</p></div>`;
}
function provHead(p) {
  const bz = besieging(p);
  const who = p.owner ? FAC(p.owner).name : p.ally ? `${p.lord}, sworn to ${fname(p.ally)}` : p.lord;
  let h = `<div class="row top"><button class="btn sm" onclick="G.sel=null;render()"><span class="lbl">${ico('back')}Realm</span></button></div>
    <div class="phead">${shield(p.owner || p.ally, 42)}<div style="min-width:0"><h2><span class="init">${p.name[0]}</span>${p.name.slice(1)}${isCap(p) ? ' ' + ico('crown') : ''}</h2><span class="sub">${esc(who)} · ${REGION_NAME[p.r]}${p.seas.length ? ' · coast' : ''}${p.hills ? ' · hills' : ''}</span></div></div>`;
  const tags = [];
  if (p.owner) tags.push(`<span class="tag">${ico('coin')}${provIncome(p)} d a turn${bz ? ' (blockaded)' : ''}${p.interdict > 0 ? ' (interdict)' : ''}</span>`);
  else if (p.ally) tags.push(`<span class="tag">${ico('coin')}${minorIncome(p)} d · half to ${fname(p.ally)}</span>`);
  else tags.push(`<span class="tag">${ico('coin')}worth ${p.base} d a turn</span>`);
  if (holds(me(), p.id)) tags.push(`<span class="tag on">${ico('foot')}garrison ${garMen(p)}${p.gar.cat ? ' + ' + p.gar.cat + ' catapult' + (p.gar.cat > 1 ? 's' : '') : ''} · levy ${p.militia}</span>`);
  if (p.b.castle) tags.push(`<span class="tag">${ico('castle')}${p.ruined ? 'ruined' : CASTLE_N[castleLv(p)].replace(' castle', '')}${!p.ruined && p.walls < 100 ? ' ' + p.walls + '%' : ''}</span>`);
  for (const t of ['farm', 'market', 'port', 'mine', 'forge', 'armory', 'stables']) if (p.b[t]) tags.push(`<span class="tag on">${ico(BLD_ICON[t])}${BLD[t].n}${BLD[t].realm ? '' : ROMAN[p.b[t]]}</span>`);
  if (p.build) tags.push(`<span class="tag">${ico('hammer')}${p.build.type === 'castle' ? CASTLE_N[castleLv(p) + 1] : p.build.type === 'rebuild' ? 'Rebuilding' : BLD[p.build.type].n}: ${p.build.left} turn${p.build.left > 1 ? 's' : ''}</span>`);
  if (bz) tags.push(`<span class="tag red">${ico('tent')}besieged by ${FAC(bz.fid).name}</span>`);
  if (p.plague) tags.push(`<span class="tag red">${ico('skull')}plague (${['', 'mild', 'spreading', 'raging'][p.plague.s]})</span>`);
  if (p.sacked > 0) tags.push(`<span class="tag red">${ico('fire')}sacked: pays nothing for ${p.sacked} turn${p.sacked > 1 ? 's' : ''}</span>`);
  if (p.interdict > 0) tags.push(`<span class="tag red">${ico('interdict')}interdict, ${p.interdict} turn${p.interdict > 1 ? 's' : ''}</span>`);
  if (p.heiress && !p.owner) tags.push(`<span class="tag">${ico('ring')}Lady ${p.heiress}</span>`);
  h += `<p style="margin:0 0 4px">${tags.join('')}</p>`;
  if (!holds(me(), p.id)) h += wealthCard(p);
  if (p.cap && p.cap !== p.owner && FAC(p.cap)) h += `<p class="sub">Former seat of ${FAC(p.cap).name}</p>`;
  const why = SC.crown.why[p.id];
  if (why) h += `<p class="sub">${ico('crown')} ${why}</p>`;
  if (p.owner && inCrown(p.owner, p)) h += `<p class="sub">Held by the king: +1 d and double levies.</p>`;
  else if (p.owner && p.owner !== me() && reachOf(p.owner, p) >= 4) h += `<p class="sub">Far from ${FAC(p.owner).name}'s seat: it pays ${Math.round(reachMult(p.owner, p) * 100)}%.</p>`;
  if (p.owner && coreR(p.r) && foreign(p.owner) && !inCrown(p.owner, p)) h += `<p class="sub">${SC.foreignTxt}: income -30%.</p>`;
  return h;
}
function defenceHtml(p) {
  let h = `<h3>Defences</h3>` + castleText(p) + `<p class="sub" style="margin:4px 0 0">Garrison: ${garMen(p)} men who stay when armies march away${p.b.castle ? '' : ' (no castle: only the levy holds it)'}. Levy: ${p.militia}, raised by the county itself.</p><p class="units">${uStr({ ...p.gar, militia: p.militia }, true)}</p>`;
  const dg = p.owner ? genAt(p.owner, p.id) : null;
  if (dg) h += `<p>${ico('fleur')} ${dg.n} commands here <span class="sub">(${genSummary(dg)})</span></p>`;
  const ao = p.owner || p.ally;
  if (ao && ao !== me()) for (const a of defArmies(p)) h += `<div class="notebox bad">${FAC(ao).name}'s ${armyLabel(ao, a).toLowerCase()} is here: <span class="units" style="display:inline-flex">${uStr(a, false)}</span></div>`;
  const others = armiesAt(p.id).filter(x => x.fid !== me() && x.fid !== ao);
  for (const x of others) h += `<div class="notebox">${FAC(x.fid).name}'s army stands here: <span class="units" style="display:inline-flex">${uStr(x.a, false)}</span></div>`;
  return h;
}
function provPanel(p) {
  const F = G.fac[me()], A = myA();
  const mine = p.owner === me(), myAlly = !p.owner && p.ally === me();
  let h = provHead(p);
  if (mine) h += ownPanel(p, F, A);
  else if (myAlly) h += allyPanel(p, F, A);
  else h += foreignPanel(p, F, A);
  return h;
}
function marchBtn(p, A) {
  const st = slotState(A);
  if (st !== 'active') return '';
  const d = A.siege ? null : marchDist(me(), A.loc)[p.id];
  if (A.loc === p.id && !A.siege) return '';
  if (canMarch(me(), A, p.id)) return `<button class="btn gold" onclick="act('move')"><span class="lbl">${ico('flag')}${A.siege ? 'Lift siege and march here' : 'March here'}</span><small>${d} of ${A.mp} move${A.mp === 1 ? '' : 's'} · army ${ARMY_NUM(A)}</small></button>`;
  if (!A.siege && isForced(me(), A, p.id)) return `<div class="notebox warnbox">${ico('flag')} <b>Forced march.</b> ${P(p.id).name} is one county beyond army ${ARMY_NUM(A)}'s march. It can get there, but the men arrive spent: <b>no attack, siege or bombardment this turn</b>, and no further marching.</div><button class="btn" onclick="openForced('${p.id}')"><span class="lbl">${ico('flag')}Forced march here</span><small>army ${ARMY_NUM(A)} · its turn ends on arrival</small></button>`;
  const others = usableArmies(me()).filter(b => b !== A && canMarch(me(), b, p.id));
  if (others.length) return `<button class="btn" onclick="pickArmy('${others[0].id}')"><span class="lbl">${ico('flag')}Army ${ARMY_NUM(others[0])} can march here</span><small>switch to it</small></button>`;
  const hard = usableArmies(me()).filter(b => b !== A && !b.siege && isForced(me(), b, p.id));
  if (hard.length) return `<button class="btn" onclick="pickArmy('${hard[0].id}')"><span class="lbl">${ico('flag')}Army ${ARMY_NUM(hard[0])} can reach here by forced march</span><small>switch to it · no attack this turn on arrival</small></button>`;
  return `<p class="sub">${A.acted ? `Army ${ARMY_NUM(A)} has ${A.forced ? 'made a forced march and rests' : 'fought'} this turn.` : A.siege ? `Army ${ARMY_NUM(A)} is besieging ${P(A.siege).name}; march from there only to lift the siege.` : `Out of reach for army ${ARMY_NUM(A)} this turn (${MOVES} moves a turn through your own and allied land, or ${MOVES + FORCED} by forced march with no attack).`}</p>`;
}
// trade men with another of your armies standing in the same county
function armyMatesHtml(p, A) {
  const mates = usableArmies(me()).filter(b => b !== A && b.loc === p.id && !b.siege);
  return mates.map(B => {
    const n = ARMY_NUM(B), blockIn = A.acted && !B.acted, blockOut = B.acted && !A.acted;
    let h = `<h3>Army ${ARMY_NUM(A)} ⇄ army ${n}</h3><div class="xfer"><span></span><b>Unit</b><b>Army ${n}</b><b>Army ${ARMY_NUM(A)}</b>`;
    for (const t of ['foot', 'bow', 'cav', 'cat']) h += `<span>${ico(UNIT_ICON[t])}</span><span>${UNIT[t].n}</span><button class="btn sm" onclick="act('xTo','${t}:${B.id}')" ${A[t] && (!blockIn || t === 'cat') ? '' : 'disabled'}>${ico('back')} ${B[t]}</button><button class="btn sm" onclick="act('xFrom','${t}:${B.id}')" ${B[t] && (!blockOut || t === 'cat') ? '' : 'disabled'}>${A[t]} ${ico('next')}</button>`;
    h += `</div><div class="grid2"><button class="btn sm" onclick="act('xAllTo','${B.id}')" ${armySize(A) && !blockIn ? '' : 'disabled'}>All to army ${n}</button><button class="btn sm" onclick="act('xAllFrom','${B.id}')" ${armySize(B) && !blockOut ? '' : 'disabled'}>All to army ${ARMY_NUM(A)}</button></div>`;
    if (blockIn || blockOut) h += `<p class="sub">Men who fought this turn cannot join an army that has not; they can only move the other way.</p>`;
    return h;
  }).join('');
}
// who leads this army, and how to change it or stand it down
function commandHtml(A) {
  const g = armyGen(me(), A), others = G.fac[me()].gens.filter(x => x.at !== A.id);
  let h = '', btns = [];
  if (others.length || (g && A.id === 'a0')) btns.push(`<button class="btn sm" onclick="openCommand('${A.id}')"><span class="lbl">${ico('fleur')}${g ? 'Change general' : 'Appoint a general'}</span></button>`);
  if (A.id !== 'a0' && !A.siege) btns.push(`<button class="btn sm" onclick="openDisband('${A.id}')"><span class="lbl">${ico('close')}Disband army ${ARMY_NUM(A)}</span></button>`);
  if (btns.length) h += `<div class="grid2" style="margin-top:8px">${btns.join('')}</div>`;
  return h;
}
function openCommand(aid) {
  const A = army(me(), aid), F = G.fac[me()], cur = armyGen(me(), A), n = ARMY_NUM(A);
  const stat = d => genSummary(d).split(' · ').map(s => `<span class="tag">${s}</span>`).join('');
  const row = x => { const d = GENMAP[x.id]; return `<div class="gen"><div class="gname">${ico('fleur')} ${esc(d.n)}</div><div class="sub">${esc(genPost(me(), x)[0].toUpperCase() + genPost(me(), x).slice(1))}</div><div class="gstats">${stat(d)}</div><button class="btn sm gold" onclick="doCommand('${aid}','${x.id}')">${aid === 'a0' ? 'Ride with the host' : 'Take command'}</button></div>`; };
  const list = F.gens.filter(x => x.at !== aid).map(row).join('');
  const p = P(A.loc), canStay = cur && p && p.owner === me() && p.b.castle && !p.ruined && !genAt(me(), p.id);
  showModal(`<h2>${ico('fleur')} ${aid === 'a0' ? "The lord's host" : `Command of army ${n}`}</h2>
    <p>${cur ? `${esc(cur.n)} ${aid === 'a0' ? 'rides with the host' : `leads army ${n}`}. ${aid === 'a0' ? '' : 'Whoever takes his place, he goes to that general\'s old posting.'}` : `Army ${n} has no general.`}</p>
    ${list ? `<h3>Your generals</h3><div class="gens">${list}</div>` : '<p class="sub">You have no other general. Hire one at the court.</p>'}
    ${aid === 'a0' && cur && canStay ? `<div class="row ctr"><button class="btn" onclick="closeModal();act('genStay')"><span class="lbl">${ico('castle')}Station ${esc(cur.n.split(' ')[0])} at ${esc(p.name)}</span></button></div>` : ''}
    <div class="row ctr"><button class="btn sm ghost" onclick="closeModal();openCourt()">Open the court</button></div>`, '', { closable: true });
}
function doCommand(aid, gid) { if (postGeneral(me(), gid, aid)) { sfx('raise'); toast(`${GENMAP[gid].n.split(' ')[0]} ${aid === 'a0' ? 'rides with the host' : 'takes command of army ' + (ARMY_IDS.indexOf(aid) + 1)}`, 'fleur'); } closeModal(); save(); render(); }
function openDisband(aid) {
  const A = army(me(), aid), p = P(A.loc), F = G.fac[me()], g = armyGen(me(), A), n = ARMY_NUM(A), men = armySize(A) + (A.cat || 0);
  const mate = usableArmies(me()).find(b => b !== A && b.loc === A.loc && !b.siege), castle = p.owner === me() && p.b.castle && !p.ruined;
  const free = owned(me()).filter(q => q.b.castle && !q.ruined && !F.gens.some(x => x.at === q.id));
  const menTxt = !men ? 'The army has no men.' : castle ? `Its ${men} men join the garrison of ${esc(p.name)}.` : mate ? `Its ${men} men join army ${ARMY_NUM(mate)}, which stands here.` : `<b>There is no castle here, so its ${men} men go home to their fields and are lost.</b>`;
  const genTxt = !g ? '' : free.length ? `${esc(g.n)} goes to command the nearest castle of yours that has no general.` : `${esc(g.n)} has no castle to go to and leaves your service.`;
  showModal(`<div class="rep"><div class="sealmark">${ico('flag')}</div><h2>Disband army ${n}?</h2><p class="ctr">${menTxt} ${genTxt}</p>
    <p class="sub ctr">You can raise army ${n} again later under a general, from the Raise tab of any county of yours.${A.gf ? ' Its Greek fire goes with the catapults.' : ''}</p>
    <div class="grid2"><button class="btn red" onclick="doDisband('${aid}')"><span class="lbl">${ico('close')}Disband</span></button><button class="btn" onclick="closeModal()">Keep the army</button></div></div>`, '', { closable: true });
}
function doDisband(aid) {
  const A = army(me(), aid), n = ARMY_NUM(A), o = disbandArmy(me(), A); closeModal(); if (!o) return;
  note(`Army ${n} is stood down${o.to === 'garrison' ? '; its men join the garrison' : o.to && o.to !== 'home' ? `; its men join ${o.to}` : o.to === 'home' ? '; its men go home' : ''}${o.gen ? `. ${o.gen} ${o.genTo ? 'goes to ' + o.genTo : 'leaves your service'}` : ''}.`);
  sfx('click'); G.army = 'a0'; toast(`Army ${n} disbanded`, 'flag'); save(); render();
}
function ownPanel(p, F, A) {
  const here = A.loc === p.id && !A.siege && slotState(A) === 'active';
  const bz = besieging(p);
  const tabs = [{ id: 'army', n: 'Army', ic: 'sword', dot: here }, { id: 'build', n: 'Build', ic: 'hammer', dot: !p.build && F.gold >= 25 }, { id: 'raise', n: 'Raise', ic: 'foot', dot: here && F.gold >= 8 }];
  if (!p.b.castle && !here) tabs.pop();
  const cur = keptTab(tabs) || (here || bz || F.unrest && F.unrest.seed === p.id ? 'army' : 'build');
  let h = tabsHtml(tabs, cur), cta = '';
  if (cur === 'army') {
    h += unrestBox(p);
    h += `<h3>Army ${ARMY_NUM(A)} · ${armyLabel(me(), A)}</h3>`;
    if (slotState(A) === 'captive') h += armyLine(A);
    else if (here) {
      h += `<p>Army ${ARMY_NUM(A)} is here${armyGen(me(), A) ? `, ${A.id === 'a0' ? 'with' : 'led by'} ${armyGen(me(), A).n}` : ''} · ${A.acted ? 'has fought this turn' : `${A.mp} of ${MOVES} moves left`}.</p><p class="units">${uStr(A, false)} <span class="sub">· pay ${armyPay(A)} d a turn</span></p>`;
      if (p.b.castle) {
        h += `<div class="xfer"><span></span><b>Unit</b><b>Garrison</b><b>Army</b>`;
        for (const t of ['foot', 'bow', 'cav', 'cat']) h += `<span>${ico(UNIT_ICON[t])}</span><span>${UNIT[t].n}</span><button class="btn sm" onclick="act('toGar','${t}')" ${A[t] ? '' : 'disabled'}>${ico('back')} ${p.gar[t]}</button><button class="btn sm" onclick="act('toArmy','${t}')" ${p.gar[t] ? '' : 'disabled'}>${A[t]} ${ico('next')}</button>`;
        h += `</div><div class="grid2"><button class="btn sm" onclick="act('allGar')">All to garrison</button><button class="btn sm" onclick="act('allArmy')">All to army</button></div>`;
        const gp = genAt(me(), p.id), ga = armyGen(me(), A);
        if (A.id === 'a0') { if (ga || gp) h += `<div class="grid2">${ga ? `<button class="btn sm" onclick="act('genStay')"><span class="lbl">${ico('fleur')}Station ${ga.n.split(' ')[0]} here</span></button>` : ''}${gp ? `<button class="btn sm" onclick="act('genJoin')"><span class="lbl">${ico('fleur')}${gp.n.split(' ')[0]} rides with the host</span></button>` : ''}</div>`; }
        else if (gp) h += `<button class="btn sm" onclick="act('genSwap')"><span class="lbl">${ico('fleur')}${gp.n.split(' ')[0]} takes command, ${ga.n.split(' ')[0]} stays</span></button>`;
      } else h += `<p class="sub">No castle here, so no garrison to draw on.</p>`;
      h += armyMatesHtml(p, A);
      h += commandHtml(A);
      if (!A.acted && armySize(A)) h += `<p class="sub">Red dashed borders on the map mark what the army can strike from here; green dots mark where it can march; faint gold dots, where it can reach only by a forced march.</p>`;
    } else {
      h += armyLine(A);
      cta += marchBtn(p, A);
    }
    if (bz && bz.fid !== me()) {
      h += `<div class="notebox bad">${ico('tent')} Besieged by ${FAC(bz.fid).name}: <span class="units" style="display:inline-flex">${uStr(bz.a, false)}</span></div>`;
      const can = usableArmies(me()).filter(b => !b.acted && armySize(b) > 0 && (b.loc === p.id || strikeFrom(me(), b, p) || canMarch(me(), b, p.id)));
      if (can.includes(A)) cta += `<button class="btn red" onclick="openPreBattle('relief','${p.id}')"><span class="lbl">${ico('swords')}Break the siege</span><small>army ${ARMY_NUM(A)}</small></button>`;
      else if (can.length) cta += `<button class="btn" onclick="pickArmy('${can[0].id}')"><span class="lbl">${ico('swords')}Army ${ARMY_NUM(can[0])} can break the siege</span><small>switch to it</small></button>`;
    }
    h += defenceHtml(p);
  } else if (cur === 'build') {
    h += `<h3>Build</h3>` + buildButtons(p, F);
  } else {
    if (here && canRaiseInto(me(), A)) h += `<h3>Raise into army ${ARMY_NUM(A)}</h3><div class="grid">${['foot', 'bow', 'cav', 'cat'].map(t => `<button class="btn" onclick="act('raiseA','${t}')" ${F.gold >= unitCost(me(), t) ? '' : 'disabled'}>${haveBadge(A[t], 'in army ' + ARMY_NUM(A))}<span class="lbl">${ico(UNIT_ICON[t])}${UNIT[t].n}</span><small>${unitCost(me(), t)} d · ${UPKEEP[t]} d a turn · ${statLine(t)}</small></button>`).join('')}</div><p class="sub">Men raised into an army are paid every turn.</p>${A.cat ? `<button class="btn" style="margin-top:6px;width:100%" onclick="act('greek')" ${(A.gf || 0) < GF_MAX && F.gold >= gfCost(me(), A) ? '' : 'disabled'}>${haveBadge(A.gf || 0, 'jars')}<span class="lbl">${ico('oil')}A jar of Greek fire</span><small>${gfCost(me(), A)} d${armyGen(me(), A) && armyGen(me(), A).siege ? ', made by your Greek engineer' : ' from Venetian traders (25 d with a Greek engineer)'} · at most ${GF_MAX} · each throw may burn the catapult</small></button>` : ''}`;
    h += newArmyHtml(p, F);
    if (p.b.castle) h += `<h3>Raise into the garrison</h3><div class="grid">${UT_ALL.map(t => `<button class="btn" onclick="act('raise','${t}')" ${F.gold >= unitCost(me(), t) ? '' : 'disabled'}>${haveBadge(t === 'bishop' ? F.bishops : p.gar[t], t === 'bishop' ? 'in council' : 'in garrison')}<span class="lbl">${ico(UNIT_ICON[t])}${UNIT[t].n}</span><small>${unitCost(me(), t)} d · ${statLine(t)}</small></button>`).join('')}</div><p class="sub">Garrisons cost nothing to keep. Bishops join your council of bishops.</p>`;
    h += defenceHtml(p);
  }
  return h + (cta ? `<div class="cta">${cta}</div>` : '');
}
const UT_ALL = ['foot', 'bow', 'cav', 'cat', 'bishop'];
// a new army, raised here under a general
function newArmyHtml(p, F) {
  const o = newArmyOptions(me(), p.id); if (!o.slot) return '';
  const n = ARMY_IDS.indexOf(o.slot) + 1, cheap = o.pool.length ? Math.min(...o.pool.map(d => genCost(me(), d))) : null;
  if (!o.here && !o.pool.length) return `<h3>A new army</h3><p class="sub">Your realm can field army ${n}, but it needs a general and none is free. ${F.gens.length >= 3 ? 'You already keep three: post one from a castle to command it at the court.' : 'No captain is seeking a lord just now.'}</p>`;
  const can = o.here || F.gold >= cheap;
  return `<h3>A new army</h3><button class="btn gold" style="width:100%" onclick="openNewArmy('${p.id}')" ${can ? '' : 'disabled'}><span class="lbl">${ico('fleur')}Raise army ${n} here under a general</span><small>${o.here ? `${o.here.n.split(' ')[0]} is in the castle and can take command` : `hire a captain from ${coin(cheap)}`} · the army starts empty: fill it from the garrison or raise men into it</small></button>`;
}
// tapping an empty army slot raises it in the county you are looking at, or at home
function nogenClick() { const p = G.sel && G.sel[0] === 'p' ? P(G.sel.slice(2)) : null; const at = p && newArmyOptions(me(), p.id).slot ? p.id : homeOf(me()); const o = newArmyOptions(me(), at); if (o.slot && (o.here || o.pool.length)) openNewArmy(at); else openCourt(); }
function openForced(pid) {
  const A = myA(), p = P(pid);
  showModal(`<div class="rep"><div class="sealmark">${ico('flag')}</div><h2>Forced march to ${esc(p.name)}?</h2>
    <p class="ctr">Army ${ARMY_NUM(A)} can reach ${esc(p.name)} only by marching hard, one county further than its march allows (at most ${MOVES + FORCED} counties in a turn).</p>
    <p class="ctr"><b>When it arrives it cannot attack, lay siege, bombard or march again until next turn.</b></p>
    <div class="grid2"><button class="btn gold" onclick="closeModal();act('force')"><span class="lbl">${ico('flag')}March hard</span></button><button class="btn" onclick="closeModal()">Stay</button></div></div>`, '', { closable: true });
}
function openNewArmy(pid, gid) {
  const p = P(pid), F = G.fac[me()], o = newArmyOptions(me(), pid); if (!o.slot) return;
  const n = ARMY_IDS.indexOf(o.slot) + 1, stat = d => genSummary(d).split(' · ').map(s => `<span class="tag">${s}</span>`).join('');
  if (gid) {
    const d = GENMAP[gid], fromCastle = o.here && o.here.id === gid, cost = fromCastle ? 0 : genCost(me(), d);
    return showModal(`<div class="rep"><div class="sealmark">${ico('fleur')}</div><h2>Raise army ${n}?</h2>
      <p class="ctr">${esc(d.n)} ${fromCastle ? `leaves the castle at ${esc(p.name)}` : `enters your service for ${coin(cost)}`} and raises your banner at ${esc(p.name)} as the commander of army ${n}.</p>
      <p class="sub ctr">This cannot be undone. ${fromCastle ? 'The castle loses its strategist.' : 'The silver is spent'}${fromCastle ? '' : ', and a general can only leave an army by moving to a castle or dying with it'}. The new army costs upkeep for every man in it while it campaigns.</p>
      <div class="grid2"><button class="btn gold" onclick="doNewArmy('${pid}','${gid}')"><span class="lbl">${ico('flag')}Raise the army</span></button><button class="btn" onclick="openNewArmy('${pid}')">Back</button></div></div>`, '', { closable: true });
  }
  const row = (d, fromCastle) => { const cost = fromCastle ? 0 : genCost(me(), d), ok = fromCastle || F.gold >= cost; return `<div class="gen${fromCastle ? ' on' : ''}"><div class="gname">${ico('fleur')} ${esc(d.n)}</div><div class="sub">${esc(d.d)}</div><div class="gstats">${stat(d)}</div><button class="btn sm${ok ? ' gold' : ''}" onclick="openNewArmy('${pid}','${d.id}')" ${ok ? '' : 'disabled'}>${fromCastle ? 'Give him command' : `Hire · ${coin(cost)}`}</button></div>`; };
  showModal(`<h2>${ico('fleur')} Raise army ${n} at ${esc(p.name)}</h2><p>Choose the general who will lead it. You have ${coin(F.gold)}.</p>
    ${o.here ? `<h3>In the castle</h3><div class="gens">${row(GENMAP[o.here.id], true)}</div>` : ''}
    ${o.pool.length ? `<h3>Seeking a lord</h3><div class="gens">${o.pool.map(d => row(d, false)).join('')}</div>` : ''}`, '', { closable: true });
}
function doNewArmy(pid, gid) {
  const a = raiseArmyHere(me(), pid, gid); if (!a) { closeModal(); return toast('The army could not be raised'); }
  const d = GENMAP[gid]; G.army = a.id; PANEL.tab = 'raise';
  note(`${d.n} raises your banner at ${P(pid).name}: army ${ARMY_NUM(a)} takes the field.`);
  sfx('horn'); buzz(30); closeModal(); save(); render(); toast(`Army ${ARMY_NUM(a)} raised under ${d.n.split(' ')[0]}`, 'flag');
}
function buildButtons(p, F) {
  if (p.build) return `<div class="notebox">${ico('hammer')} Work is under way: ${p.build.type === 'castle' ? CASTLE_N[castleLv(p) + 1] : p.build.type === 'rebuild' ? 'rebuilding the castle' : BLD[p.build.type].n}, ${p.build.left} turn${p.build.left > 1 ? 's' : ''} left. One project at a time.</div>${p.build.turn === G.turn && p.build.cost != null ? `<button class="btn sm" onclick="act('unbuild')"><span class="lbl">${ico('back')}Cancel the work</span><small>begun this turn: ${p.build.cost} d back</small></button>` : ''}`;
  const opts = [];
  if (p.ruined && p.owner) opts.push('rebuild');
  for (const t of ['farm', 'market', 'port', 'mine', 'castle', 'moat', 'forge', 'armory', 'stables']) if (canBuild(p, t)) { if (BLD[t].realm && !p.owner) continue; opts.push(t); }
  if (!opts.length) return '<p class="sub">Nothing more to build here.</p>';
  const info = t => {
    if (t === 'rebuild') return 'Restores the walls';
    if (t === 'castle') return castleLv(p) ? 'Stronger, thicker walls' : 'Allows a garrison';
    if (BLD[t].y) return `+${p.owner ? bldYield(me(), t) : BLD[t].y / 2}/turn`;
    return BLD[t].d;
  };
  return `<div class="grid">${opts.map(t => `<button class="btn${BLD[t] && BLD[t].realm ? ' wide' : ''}" onclick="act('build','${t}')" ${F.gold >= bldCost(p, t) ? '' : 'disabled'}><span class="lbl">${ico(BLD_ICON[t])}${bldName(p, t)}</span><small>${bldCost(p, t)} d · ${bldTurns(p, t)} turns · ${info(t)}</small></button>`).join('')}</div>`;
}
function allyPanel(p, F, A) {
  const here = A.loc === p.id && !A.siege && slotState(A) === 'active';
  const tabs = [{ id: 'army', n: 'Army', ic: 'sword' }, { id: 'build', n: 'Build', ic: 'hammer' }];
  if (p.b.castle) tabs.push({ id: 'raise', n: 'Raise', ic: 'foot' });
  if (p.heiress) tabs.push({ id: 'wed', n: 'Marriage', ic: 'ring', dot: F.sons && !F.proposed });
  const cur = keptTab(tabs) || (p.heiress ? 'wed' : 'army');
  let h = `<div class="notebox good">${ico('handshake')} ${p.lord} is sworn to you. You receive half the county's income, and you may build here and buy troops for its garrison. They will not march with your army, but your armies may march through their lands and strike from them.</div>` + tabsHtml(tabs, cur), cta = '';
  if (cur === 'army') {
    h += `<h3>Army ${ARMY_NUM(A)} · ${armyLabel(me(), A)}</h3>` + (here ? `<p>Army ${ARMY_NUM(A)} is camped here.</p><p class="units">${uStr(A, false)}</p>` : armyLine(A));
    if (!here) cta += marchBtn(p, A);
    h += defenceHtml(p);
  } else if (cur === 'build') h += `<h3>Build</h3>` + buildButtons(p, F);
  else if (cur === 'raise') h += `<h3>Buy troops for their garrison</h3><div class="grid">${['foot', 'bow', 'cav'].map(t => `<button class="btn" onclick="act('raise','${t}')" ${F.gold >= unitCost(me(), t) ? '' : 'disabled'}>${haveBadge(p.gar[t], 'in garrison')}<span class="lbl">${ico(UNIT_ICON[t])}${UNIT[t].n}</span><small>${unitCost(me(), t)} d · ${statLine(t)}</small></button>`).join('')}</div>` + defenceHtml(p);
  else { h += courtshipIntro(p, F); cta += courtshipBtn(p, F); }
  if (!p.b.castle && cur !== 'build') h += `<p class="sub">Build a castle here to station a garrison.</p>`;
  return h + (cta ? `<div class="cta">${cta}</div>` : '');
}
function courtshipIntro(p, F) {
  return `<h3>Marriage</h3><p>${ico('ring')} Lady <b>${p.heiress}</b>, heiress of ${p.name}. Win her hand for one of your sons and the county is yours with its garrison.</p><p class="sub">Her guardians want a suit worth at least <b>${courtFloor(p)}</b>. Your standing counts for ${Math.round(prestige(me(), p))}; a bride price, a promise of protection and a bishop's blessing add to it. Rival houses may bid against you.</p>`;
}
function courtshipBtn(p, F) {
  return `<button class="btn gold" onclick="openCourtshipDlg('${p.id}')" ${F.sons && !F.proposed && !G.court ? '' : 'disabled'}><span class="lbl">${ico('ring')}Court Lady ${p.heiress}</span><small>${F.proposed ? 'already courted this turn' : F.sons ? `sons: ${F.sons} · one courtship a turn` : 'no unmarried sons'}</small></button>`;
}
// every county of a great house carries a quick way to its ambassador, whatever tab is open
function ambassadorBar(o) {
  const a = attitude(o, me()), st = allied(me(), o) ? 'allied' : atPeace(me(), o) ? 'at peace' : atWar(me(), o) ? 'at war' : truce() ? SC.peace.Name : 'no treaty';
  return `<button class="ambbar" onclick="openDiplo('${o}')">${shield(o, 26)}<span class="t"><b>Speak with their ambassador</b><small>${esc(FAC(o).name)} · ${attWord(a)} · ${st}</small></span>${ico('handshake')}</button>`;
}
function foreignPanel(p, F, A) {
  const tabs = [{ id: 'war', n: 'War', ic: 'swords' }];
  if (!p.owner) tabs.push({ id: 'dip', n: 'Diplomacy', ic: 'handshake', dot: (p.heiress && F.sons && !F.proposed) || (canAlly(me(), p) && F.gold >= allyCost(me(), p)) });
  if (p.owner && p.owner !== me()) tabs.push({ id: 'church', n: 'Church', ic: 'church' });
  const cur = keptTab(tabs) || 'war';
  let h = (p.owner && p.owner !== me() ? ambassadorBar(p.owner) : '') + tabsHtml(tabs, cur), cta = '';
  if (cur === 'war') {
    h += `<h3>War · army ${ARMY_NUM(A)}</h3>`;
    const bz = besieging(p);
    const s = strikeFrom(me(), A, p);
    const peace = p.owner && truce() && F.excom < 1;
    const tr = p.owner ? G.truces.filter(t => (t.a === me() && t.b === p.owner) || (t.b === me() && t.a === p.owner)) : [];
    if (p.owner && atPeace(me(), p.owner)) h += `<div class="notebox">${ico(allied(me(), p.owner) ? 'handshake' : 'dove')} ${allied(me(), p.owner) ? 'An alliance' : tr.some(x => x.treaty) ? 'A sworn pact' : tr[0] && tr[0].pact ? 'A marriage' : 'A Truce of God'} binds you and ${FAC(p.owner).name}. Neither may attack the other until ${dateStr(tr.reduce((a, t) => Math.max(a, t.until), 0))}.${allied(me(), p.owner) ? ' Your armies may march through their lands.' : ''}</div>`;
    else if (slotState(A) !== 'active') h += `<p class="sub">${slotState(A) === 'captive' ? 'Your lord is a prisoner. Pay his ransom, or command another army.' : 'This army is not in the field.'}</p>`;
    else if (A.siege === p.id) {
      h += `<div class="notebox">${ico('tent')} Army ${ARMY_NUM(A)} besieges ${p.name}. Each turn the garrison starves and the walls weaken.</div><p class="units">${uStr(A, false)}</p>`;
      cta += `<div class="grid2" style="margin:0"><button class="btn" onclick="act('bombard')" ${A.cat && !A.bombarded && !p.ruined && p.b.castle ? '' : 'disabled'}><span class="lbl">${ico('cat')}Bombard</span><small>${A.cat ? A.cat * catShots(me(), A) + ' shots' : 'no catapults'}${A.bombarded ? ' · done' : ''}${p.ruined ? ' · walls already down' : ''}</small></button>
        <button class="btn red" onclick="openPreBattle('assault','${p.id}')" ${A.stormed ? 'disabled' : ''}><span class="lbl">${ico('swords')}Storm the walls</span><small>odds ${oddsTxt(estimateWin(assaultCfg(me(), A, p, 'balanced'), 30))}</small></button></div>
        <div class="grid2" style="margin:0"><button class="btn sm" onclick="openMine('${p.id}')" ${canMine(A, p) ? '' : 'disabled'}><span class="lbl">${ico('mine')}Dig a mine</span><small>${A.foot >= 4 ? 'instead of bombarding' : 'needs 4 footmen'}</small></button><button class="btn sm" onclick="act('autobomb')" ${A.cat && !A.bombarded && !p.ruined && p.b.castle ? '' : 'disabled'}><span class="lbl">${ico('skip')}Auto-bombard</span></button></div>
        ${A.undo && A.undo.t === G.turn && !A.bombarded && !A.stormed ? `<button class="btn sm" onclick="act('unsiege')"><span class="lbl">${ico('back')}Call it off and choose again</span><small>nothing has been done yet</small></button>` : '<button class="btn sm ghost" onclick="act(\'lift\')">Lift the siege</button>'}`;
    } else if (bz && bz.fid === me()) { h += `<p class="sub">Army ${ARMY_NUM(bz.a)} is besieging ${p.name}.</p>`; cta += `<button class="btn gold" onclick="pickArmy('${bz.a.id}')"><span class="lbl">${ico('tent')}Command army ${ARMY_NUM(bz.a)}</span></button>`; }
    else if (bz) h += `<p class="sub">${FAC(bz.fid).name} is already besieging it.</p>`;
    else if (!s) {
      const others = usableArmies(me()).filter(b => b !== A && strikeFrom(me(), b, p));
      h += `<p class="sub">${!armySize(A) ? `Army ${ARMY_NUM(A)} has no fighting men. Raise troops into it or draw them from a garrison.` : A.acted ? `Army ${ARMY_NUM(A)} has already fought this turn.` : `Out of reach for army ${ARMY_NUM(A)} this turn. An army strikes from a county of yours, or an ally's, that borders the target.`}</p>`;
      if (others.length) cta += others.map(b => `<button class="btn" onclick="pickArmy('${b.id}')"><span class="lbl">${ico('swords')}Army ${ARMY_NUM(b)} can strike from ${P(strikeFrom(me(), b, p).stage).name}</span><small>${armySize(b)} men · switch to it</small></button>`).join('');
    } else {
      if (peace) h += `<div class="notebox bad">${ico('dove')} ${SC.peace.Name} protects the great houses until ${dateStr(TRUCE)}. Attack ${FAC(p.owner).name} now and the Pope excommunicates you for 4 turns.</div>`;
      if (p.ally && !p.owner) h += `<p class="sub">${p.lord} is sworn to ${fname(p.ally)}. Taking the county breaks that alliance.</p>`;
      const sea = seaRoute(s.stage, p.id); const how = s.dist ? `marches to ${P(s.stage).name} (${s.dist} move${s.dist > 1 ? 's' : ''}) and ${sea ? 'crosses the sea to strike' : 'strikes'}` : sea ? `crosses the sea from ${P(s.stage).name} to strike` : `strikes from ${P(s.stage).name}`;
      h += `<p>${ico('flag')} Army ${ARMY_NUM(A)} ${how}. If it wins, it ${sea ? 'lands' : 'marches in'} and holds the county.</p>`;
      const odds = estimateWin({ ...assaultCfg(me(), A, p, 'balanced'), aMod: mods(me()) - (peace ? 1 : 0) }, 30);
      h += `<p class="units">Your army: ${uStr(A, false)}</p>`;
      if (p.b.castle && !p.ruined) { h += `<p class="sub">Storm now, or lay siege: starve them, bombard the walls, then storm when the odds improve.</p>`; cta += `<div class="grid2" style="margin:0"><button class="btn" onclick="act('besiege')"><span class="lbl">${ico('tent')}Lay siege</span><small>${A.cat ? 'then bombard' : 'starve them out'}</small></button><button class="btn red" onclick="openPreBattle('assault','${p.id}')"><span class="lbl">${ico('swords')}Storm at once</span><small>odds ${oddsTxt(odds)}</small></button></div>`; }
      else cta += `<button class="btn red" onclick="openPreBattle('assault','${p.id}')"><span class="lbl">${ico('swords')}Attack ${p.name}</span><small>odds ${oddsTxt(odds)}</small></button>`;
    }
    h += defenceHtml(p);
  } else if (cur === 'dip') {
    if (!p.ally) {
      const c = allyCost(me(), p);
      h += `<h3>Alliance</h3><p>Pay ${p.lord} to swear to you. You take half the income, control the buildings and can buy troops for the garrison, and your armies may march through their land.</p>`;
      if (canAlly(me(), p)) {
        cta += `<button class="btn gold" onclick="act('ally')" ${F.gold >= c ? '' : 'disabled'}><span class="lbl">${ico('handshake')}Offer alliance</span><small>${c} d${foreign(me()) && coreR(p.r) ? ` (${SC.foreignAsk})` : ''}</small></button>`;
        h += `<h3>A charter</h3><p class="sub">${forgeNote(p, F)}</p>`;
        cta += `<button class="btn" onclick="openCharter('${p.id}')" ${canForge(p, F) ? '' : 'disabled'}><span class="lbl">${ico('scroll')}Forge an old charter</span><small>${FORGE_COST} d · needs a bishop · may be discovered</small></button>`;
      }
      else h += `<p class="sub">You must border them to treat with them${besiegerOf(p) ? ', and they must not be under siege' : ''}.</p>`;
    } else h += `<p class="sub">${p.lord} is sworn to ${fname(p.ally)}.</p>`;
    if (p.heiress) { h += courtshipIntro(p, F); cta += courtshipBtn(p, F); }
  } else if (cur === 'treaty') {
    const o = p.owner, pu = peaceUntil(me(), o);
    h += `<h3>${esc(FAC(o).name)}</h3><p>${esc(rulerOf(o))} holds ${owned(o).length} counties.</p>${houseStatus(o)}<p class="sub">Send envoys to offer a pact of peace, an alliance that opens your lands to each other's armies, or a war alliance against a third house. If it suits them they ask nothing; if not, they name a price.</p>`;
    cta += `<button class="btn gold" onclick="openDiplo('${o}')"><span class="lbl">${ico('handshake')}Send envoys to ${esc(FAC(o).name)}</span><small>pact · alliance · war alliance</small></button>`;
  } else {
    h += `<h3>Interdict</h3><p>${ico('interdict')} Ask the Pope to lay ${p.name} under interdict: the churches close and the county pays nothing for 4 turns.</p><p class="sub">${popeCost(me(), 'interdict')} d · ${Math.round(popeChance(me(), 'interdict', p.id) * 100)}% chance. One petition a turn.${F.popeUsed ? ' <span class="bad">You have already petitioned this turn.</span>' : ''}</p>`;
    cta += `<button class="btn" onclick="doPope('interdict','${p.id}')" ${!F.popeUsed && F.gold >= popeCost(me(), 'interdict') ? '' : 'disabled'}><span class="lbl">${ico('interdict')}Interdict ${p.name}</span><small>${popeCost(me(), 'interdict')} d</small></button><button class="btn sm ghost" onclick="openPope()">Open the Church</button>`;
  }
  return h + (cta ? `<div class="cta">${cta}</div>` : '');
}
function render() {
  if (G) fixSieges();
  if (!G) return;
  renderHeader(); renderMapFill(); renderOverlay(); renderArmyBar(); renderDock();
  let h;
  if (G.sel && G.sel[0] === 'p') h = provPanel(P(G.sel.slice(2)));
  else h = overviewPanel();
  setHTML($('#pbody'), h);
  renderTutor();
}

// ================= ACTIONS =================
function breakPeace(p) {
  const F = G.fac[me()];
  if (!p.owner || !truce() || F.excom > 0) return;
  F.excom = 4;
  report('Excommunicated!', `You broke ${SC.peace.name} by attacking ${FAC(p.owner).name}. The Pope has cast ${rulerOf(me())} out of the Church: your troops fight worse and you lose a quarter of your income for 4 turns.`);
}
function act(c, a) {
  const p = G.sel && G.sel[0] === 'p' ? P(G.sel.slice(2)) : null, F = G.fac[me()], A = myA();
  tutorDid(c);
  switch (c) {
    case 'build': { const c0 = bldCost(p, a); if (F.gold < c0) return toast('Not enough deniers', 'coin'); F.gold -= c0; p.build = { type: a, left: bldTurns(p, a), turn: G.turn, cost: c0 }; note(`Work begins in ${p.name}: ${bldName(p, a)}.`); sfx('build'); buzz(); toast(`Work begins: ${bldName(p, a)}`, 'hammer'); break; }
    case 'unsiege': { const u = A.undo; if (!u || u.t !== G.turn || A.bombarded || A.stormed || A.siege !== p.id) break; A.siege = null; A.loc = u.loc; A.mp = u.mp; A.campT = u.campT; A.acted = false; F.excom = u.excom; G.grudge = JSON.parse(u.gr); G.fought = JSON.parse(u.fo); A.undo = null; G.reports = G.reports.filter(r => r.title !== 'Excommunicated!'); note(`Army ${ARMY_NUM(A)} thinks better of the siege of ${p.name}.`); toast('Siege called off: choose again', 'back'); break; }
    case 'greek': { const c = gfCost(me(), A); if (!A.cat || (A.gf || 0) >= GF_MAX || F.gold < c) break; F.gold -= c; A.gf = (A.gf || 0) + 1; sfx('coin'); toast('A sealed jar of Greek fire joins the siege train', 'oil'); break; }
    case 'unbuild': if (p.build && p.build.turn === G.turn && p.build.cost != null) { F.gold += p.build.cost; note(`Work is called off in ${p.name}.`); p.build = null; sfx('click'); toast('Work cancelled, silver returned', 'coin'); } break;
    case 'raise': {
      const cost = unitCost(me(), a); if (F.gold < cost) return toast('Not enough deniers', 'coin'); F.gold -= cost;
      if (a === 'bishop') { F.bishops++; toast('A bishop joins your council', 'bishop'); } else { p.gar[a]++; toast(`${UNIT[a].n} raised in ${p.name}`, UNIT_ICON[a]); }
      sfx(a === 'bishop' ? 'bell' : 'raise'); buzz(); break;
    }
    case 'raiseA': if (raise(me(), a, A)) { sfx('raise'); buzz(); toast(`${UNIT[a].n} join army ${ARMY_NUM(A)}`, UNIT_ICON[a]); } else toast('Not enough deniers', 'coin'); break;
    case 'xTo': case 'xFrom': { const [t, bid] = a.split(':'), B = army(me(), bid); if (c === 'xTo') shiftMen(me(), A, B, t); else shiftMen(me(), B, A, t); sfx('click'); break; }
    case 'xAllTo': case 'xAllFrom': { const B = army(me(), a); for (const t of ['foot', 'bow', 'cav', 'cat']) c === 'xAllTo' ? shiftMen(me(), A, B, t, 999) : shiftMen(me(), B, A, t, 999); sfx('raise'); break; }
    case 'toArmy': if (p.gar[a] > 0 && slotState(A) === 'active') { p.gar[a]--; A[a]++; } break;
    case 'toGar': if (A[a] > 0) { A[a]--; p.gar[a]++; } break;
    case 'allArmy': if (slotState(A) === 'active') for (const t of ['foot', 'bow', 'cav', 'cat']) { A[t] += p.gar[t]; p.gar[t] = 0; } break;
    case 'allGar': for (const t of ['foot', 'bow', 'cav', 'cat']) { p.gar[t] += A[t]; A[t] = 0; } break;
    case 'genStay': { const g = F.gens.find(x => x.at === 'a0'); const o = F.gens.find(x => x.at === p.id); if (g) g.at = p.id; if (o) o.at = 'a0'; break; }
    case 'genJoin': { const g = F.gens.find(x => x.at === p.id); const o = F.gens.find(x => x.at === 'a0'); if (g) g.at = 'a0'; if (o) o.at = p.id; break; }
    case 'genSwap': { const g = F.gens.find(x => x.at === p.id); const o = F.gens.find(x => x.at === A.id); if (g && o) { g.at = A.id; o.at = p.id; } break; }
    case 'move': case 'force': { const was = A.siege, prevLoc = A.loc; if (marchArmy(me(), A, p.id, c === 'force')) { if (A.forced) note(`Army ${ARMY_NUM(A)} makes a forced march to ${p.name} and rests there.`); sfx('march'); if (was) note(`You lift the siege of ${P(was).name}.`); PANEL.tab = 'army'; PANEL.hist = ['army', ...(PANEL.hist || []).filter(x => x !== 'army')]; { const from = P(prevLoc); toast(`Army ${ARMY_NUM(A)} marches to ${p.name}${holds(me(), from.id) ? ` · ${garMen(from)} stay in ${from.name}` : ''}`, 'flag'); } hint('army'); } break; }
    case 'besiege': { const pre = { t: G.turn, loc: A.loc, mp: A.mp, campT: A.campT, excom: F.excom, gr: JSON.stringify(G.grudge || {}), fo: JSON.stringify(G.fought || {}) }; const s = stageFor(me(), A, p); if (!s) return; breakPeace(p); hostility(me(), p.owner || p.ally); A.undo = pre; A.siege = p.id; A.loc = p.id; A.acted = true; note(`Army ${ARMY_NUM(A)} lays siege to ${p.name}.`); sfx('horn'); buzz(30); hint('siege'); break; }
    case 'bombard': openCatapult(p); return;
    case 'autobomb': if (A.cat && !A.bombarded && A.siege === p.id) autoBombard(A, p); break;
    case 'lift': note(`You lift the siege of ${p.name}.`); A.siege = null; A.loc = nearestHeld(me(), p.id); break;
    case 'ally': if (makeAlly(me(), p)) { sfx('bell'); flashProv(p.id); report('A new ally', `${p.lord} of ${p.name} swears to you. Half of the county's income is yours.`); } break;
  }
  save(); render(); showReports();
}
function doAppease() { const F = G.fac[me()], u = F.unrest; if (!u) return; const nm = P(u.seed).name; if (appease(me())) { sfx('coin'); buzz(); note(`You buy off the malcontents around ${nm} for ${u.cost} d.`); toast(`The lords of ${nm} are bought off`, 'coin'); } else toast('Not enough deniers', 'coin'); closeModal(); save(); render(); showReports(); }
function doDiplo(id, yes) { const r = answerDiplo(id, yes); if (r && r.ok) { sfx('bell'); buzz(); } closeModal(); save(); render(); showReports(); }
function doRansom() {
  const r = offerRansom(me());
  if (r === 'paid') sfx('coin');
  else if (r === 'refused') { report('Ransom refused', `${fname(G.fac[me()].captive.by)} refuses your offer and keeps ${rulerOf(me())} another turn. The price will fall.`); }
  else if (r === null) toast('Not enough deniers', 'coin');
  save(); render(); showReports();
}
function doOffer(fid, yes) { answerOffer(fid, yes); if (yes) sfx('coin'); save(); render(); showReports(); }
function doCrown(k) { if (crown(me(), k)) { G.reports = G.reports.filter(r => r.title !== 'Long live the king!'); if (G.over || G.askWin) { render(); return showReports(); } save(); render(); showCoronation(me(), k); } }
function doPact(f) { const r = marriagePact(me(), f); if (r) { sfx(r.ok ? 'bell' : 'miss'); report(r.ok ? 'A marriage pact' : 'Proposal refused', r.text); save(); render(); showReports(); } }

// ================= END OF TURN =================
function playerEndTurn(force) {
  if (G.over) return;
  const F = G.fac[me()];
  if (!force && SET.confirmEnd && !G.endWarned) {
    const warn = [];
    const idle = usableArmies(me()).filter(a => !a.acted && armySize(a) > 0 && provList().some(p => !(p.owner && truce()) && strikeFrom(me(), a, p)));
    if (idle.length) warn.push(`${idle.length === 1 ? 'army ' + ARMY_NUM(idle[0]) + ' has' : idle.length + ' armies have'} not struck this turn`);
    if (F.unrest && F.unrest.at <= G.turn + 1 && !unrestCovered(me())) warn.push(`the unrest at ${P(F.unrest.seed).name} falls due and is uncovered`);
    if (G.diplo) warn.push(`${FAC(G.diplo.from).name}'s envoy is still waiting`);
    if (F.gold >= 60) warn.push(`${F.gold} deniers lie unspent`);
    if (warn.length) {
      G.endWarned = true;
      return showModal(`<div class="rep"><div class="sealmark">${ico('next')}</div><h2>End the turn?</h2><p>${warn.map(w => w[0].toUpperCase() + w.slice(1)).join(', and ')}.</p><div class="grid2"><button class="btn gold" id="endyes" onclick="closeModal();playerEndTurn(true)">End turn</button><button class="btn" onclick="closeModal()">Not yet</button></div><p class="sub ctr" style="margin-top:10px">This reminder can be turned off in settings.</p></div>`);
    }
  }
  closeModal(); closeDrawer(); closeHint();
  tutorDid('end');
  if (G.raid) raidAutoQuiet();
  settlePending();
  for (const o of [...G.offers]) answerOffer(o.fid, false);
  if (G.diplo) answerDiplo(G.diplo.id, false);
  if (G.court) cancelCourt(me());
  endTurn(me());
  const firstLog = G.log[0];
  const snap = replaySnap();
  runAITurns();
  maybeRaid();
  const idx = firstLog ? G.log.indexOf(firstLog) : G.log.length;
  const fresh = G.log.slice(0, idx < 0 ? G.log.length : idx).map(l => l.text).reverse();
  const lines = G.order.filter(f => f !== me()).map(f => ({ f, t: fresh.find(t => t.startsWith(FAC(f).name + ' ') || t.includes(FAC(f).name)) || '' }));
  G.unread = (G.unread || 0) + fresh.length;
  G.sel = null; G.endWarned = false;
  save();
  runTurnOverlay(G.order, lines, () => { render(); sfx('bell'); buzz(20); if (isPhone()) setSheet('peek'); showReports(); if (G.turn === TRUCE) hint('endturn'); }, snap);
}
