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
function pickArmy(id) { G.army = id; sfx('click'); render(); const a = army(me(), id); if (a.loc && !G.sel) focusProv(a.loc, VIEW.w); }
const ARMY_NUM = a => ARMY_IDS.indexOf(a.id) + 1;
function armyPay(a) { let u = 0; for (const t of ['foot', 'bow', 'cav', 'cat']) u += a[t] * UPKEEP[t]; return Math.ceil(u); }
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
    if (st === 'nogen') return `<button class="ab lock" onclick="openCourt()" title="Needs a general">${ico('fleur')}<span>${ARMY_NUM(a)}</span></button>`;
    return `<button class="ab${on ? ' on' : ''}${a.acted ? ' done' : ''}" onclick="pickArmy('${a.id}')"><b>${ARMY_NUM(a)}</b><span class="n">${st === 'captive' ? ico('chain') : ico('foot') + n}</span><small>${st === 'captive' ? 'captive' : (a.loc ? P(a.loc).name : '—')}${a.siege ? ' ⚔' : ''}</small><small class="mv">${st === 'captive' ? '' : a.acted ? 'done' : a.mp + '/' + MOVES + ' mv'}</small></button>`;
  }).join(''));
}

// ================= HEADER =================
function renderHeader() {
  const f = FAC(me()), F = G.fac[me()];
  const gross = grossIncome(me()), up = upkeepOf(me());
  const chips = [`<span class="chip" title="Treasury: income +${gross}, upkeep −${up}">${ico('coin')}<span class="num">${F.gold}</span><small>+${gross}${up ? ` <s>−${up}</s>` : ''}</small></span>`];
  if (truce()) chips.push(`<span class="chip peace" title="No war between the great houses until ${dateStr(TRUCE)}">${ico('dove')}<small>Peace</small></span>`);
  if (F.unrest) chips.push(`<span class="chip warn btn-like" onclick="goProv('${F.unrest.seed}')" title="Unrest at ${P(F.unrest.seed).name}">${ico('fire')}<small>${Math.max(0, F.unrest.at - G.turn)}</small></span>`);
  if (fairOpen()) chips.push(`<span class="chip ok btn-like" onclick="openFair()" title="The summer fair at Troyes is open">${ico('market')}<small>Fair</small></span>`);
  if (G.diplo) chips.push(`<span class="chip ok btn-like" onclick="G.sel=null;render();setSheet('full')" title="An envoy waits">${ico('handshake')}</span>`);
  if (F.bless) chips.push(`<span class="chip ok" title="Blessed: your troops fight 12% harder">${ico('bless')}${F.bless}</span>`);
  if (F.excom) chips.push(`<span class="chip warn" title="Excommunicated">${ico('interdict')}${F.excom}</span>`);
  if (F.captive) chips.push(`<span class="chip warn btn-like" onclick="G.sel=null;render();setSheet('full')" title="Your lord is a prisoner">${ico('chain')}</span>`);
  if (G.offers.length) chips.push(`<span class="chip ok btn-like" onclick="G.sel=null;render();setSheet('full')" title="Ransom offers">${ico('coin')}${G.offers.length}</span>`);
  setHTML($('#hdr'), `<div class="hfac">${shield(me(), 30)}<div style="min-width:0"><div class="hname">${esc(f.name)}</div><div class="hdate">${esc(dateStr(G.turn))} · ${alive().length - 1} rival${alive().length === 2 ? '' : 's'}</div></div></div>
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
  if (st === 'captive') return `<div class="notebox bad">${ico('chain')} ${rulerOf(me())} is a prisoner${G.fac[me()].captive.by ? ' of ' + fname(G.fac[me()].captive.by) : ''}. His host cannot take the field until he is ransomed.</div>`;
  if (!a.loc) return '<p class="sub">Nowhere</p>';
  return `<p>${a.siege ? `${ico('tent')} Besieging <b>${P(a.siege).name}</b>` : `At <b>${P(a.loc).name}</b>`}${g ? ` · ${a.id === 'a0' ? 'with' : 'led by'} <b>${g.n}</b>` : ''} · ${a.acted ? 'has fought' : `${a.mp} of ${MOVES} moves`}</p><p class="units">${uStr(a, false)} <span class="sub">· pay ${armyPay(a)} d a turn</span></p>`;
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
function crownsHtml() {
  const F = G.fac[me()], k = king(), others = alive().filter(f => f !== me());
  let h = '';
  if (isKing(me())) {
    const n = crownIncome(me());
    h += `<div class="statcard on"><b>${ico('crown')} King of the Franks</b><ul><li>+1 d from each of your ${n} counties in the kingdom: <b>+${n} d a turn</b></li><li>Double levies there</li><li>The royal host: +10% attack${vassals().length >= 2 ? ', and a third army' : '. A third army once two princes have sworn to you (or at 25 counties)'}</li><li>Princes who do homage are at peace with you</li></ul></div>`;
    const vs = vassals();
    h += `<p><b>Sworn to you:</b> ${vs.length ? vs.map(f => `<span class="tag on">${shield(f, 14)} ${esc(FAC(f).name)}</span>`).join('') : '<span class="sub">no one yet</span>'}</p>`;
    const free = others.filter(f => !vassal(f));
    if (free.length) {
      h += `<p class="sub">Summon a prince to do homage: ${HOMAGE_GIFT} d in gifts, once a turn. He weighs your armies against his own, your favour with the Pope, and whether he is the bigger lord.${F.summoned === G.turn ? ' <span class="bad">You have summoned this turn.</span>' : ''}</p>`;
      h += `<div class="grid">${free.map(f => `<button class="btn" onclick="doSummon('${f}')" ${F.summoned !== G.turn && F.gold >= HOMAGE_GIFT ? '' : 'disabled'}><span class="lbl">${shield(f, 14)} ${esc(FAC(f).name)}</span><small>${Math.round(homageChance(me(), f) * 100)}% chance</small></button>`).join('')}</div>`;
    }
    if (vs.length) h += `<p class="sub">To make war on a vassal, declare his fiefs forfeit first. He owes you nothing after that.</p><div class="grid">${vs.map(f => `<button class="btn sm ghost" onclick="doForfeit('${f}')"><span class="lbl">${shield(f, 14)} ${esc(FAC(f).name)} forfeit</span></button>`).join('')}</div>`;
    return h;
  }
  if (k) {
    h += `<p>${ico('crown')} The crown is worn by <b>${esc(FAC(k).pname)}</b>.</p>`;
    if (vassal(me())) h += `<div class="notebox good">${ico('handshake')} You are the king's man. You and he are at peace. Renounce the oath and it is war, and the Pope may cast you out.</div><button class="btn sm red" onclick="doRenounce()"><span class="lbl">${ico('swords')}Renounce your homage</span></button>`;
    else h += `<p class="sub">You owe him nothing. Do homage and you are at peace with the king, but every oath brings him closer to ruling in fact.</p><button class="btn sm" onclick="doSwear()"><span class="lbl">${ico('handshake')}Do homage to ${esc(FAC(k).name)}</span></button>`;
  } else h += `<p>${ico('crown')} No one wears the crown of the Franks.</p>`;
  const need = crownNeeds(me());
  h += `<div class="statcard"><b>The coronation</b><br>The archbishop of Reims anoints kings, and a king needs his royal seat. You need ${need.map(id => `<b>${P(id).name}</b> ${P(id).owner === me() ? '<span class="good">(held)</span>' : '<span class="bad">(not held)</span>'}`).join(' and ')}, and at least ${CROWN_LANDS} counties of the kingdom (you hold ${domainHeld(me())}).${me() === 'charles' ? ' <span class="sub">As a Carolingian, Laon serves you for Paris.</span>' : ''}<br><span class="sub">Crowned, every oath sworn to the old king is void.</span>${canCrown(me()) ? `<br><button class="btn gold" onclick="doCrown('franks')" ${F.gold >= CROWN_COST ? '' : 'disabled'}><span class="lbl">${ico('crown')}Be crowned at Reims</span><small>${CROWN_COST} d for the coronation</small></button>` : ''}</div>`;
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
    if (isKing(me()) && !vassal(f)) h += `<button class="btn sm" onclick="doFreeHomage('${f}')"><span class="lbl">${ico('handshake')}Free him for his homage</span></button>`;
    h += '</div>';
  }
  return h;
}
function marriageHtml() {
  const F = G.fac[me()];
  const ladies = provList().filter(p => p.heiress && !p.owner);
  let h = `<p>Unmarried sons: <b>${F.sons}</b>. One courtship a turn; a son is spent only when a lady accepts.${F.proposed ? ' <span class="sub">You have courted this turn.</span>' : ''}${F.sons ? '' : ' <span class="sub">The Pope can grant a dispensation for another.</span>'}</p>`;
  h += ladies.length ? `<p class="sub">Heiresses (win one and her province is yours, garrison and all):</p><div class="grid">${ladies.map(p => `<button class="btn" onclick="goProv('${p.id}')"><span class="lbl">${ico('ring')}Lady ${p.heiress}</span><small>${p.name}${p.ally ? ' · sworn to ' + fname(p.ally) : ''} · floor ${courtFloor(p)}</small></button>`).join('')}</div>` : '<p class="sub">No heiresses are of marrying age just now.</p>';
  const foes = alive().filter(f => f !== me());
  h += `<p class="sub" style="margin-top:10px">Marriage pacts with rival houses (${PACT_COST} d in gifts; peace for ${PACT_TURNS} turns, neither may attack the other):</p><div class="grid">${foes.map(f => `<button class="btn" onclick="doPact('${f}')" ${canPact(me(), f) && F.gold >= PACT_COST ? '' : 'disabled'}><span class="lbl">${shield(f, 14)} ${FAC(f).name}</span><small>${atPeace(me(), f) ? 'already at peace' : recentPeace(me(), f) ? 'too soon after the last peace' : Math.round(pactChance(me(), f) * 100) + '% chance'}</small></button>`).join('')}</div>`;
  return h;
}
function goProv(id) { G.sel = 'p:' + id; armyAt(id); render(); focusProv(id); if (isPhone()) setSheet('half'); }
function unrestBox(p) {
  const F = G.fac[me()], u = F.unrest; if (!u || (p && u.seed !== p.id)) return '';
  const left = u.at - G.turn, covered = unrestCovered(me());
  return `<div class="notebox bad">${ico('fire')} <b>Unrest at ${P(u.seed).name}.</b> ${covered ? 'Your army there overawes the malcontents; keep at least 8 men in the province until ' + dateStr(u.at) + '.' : `Unless an army of at least 8 men stands in ${P(u.seed).name} by ${dateStr(u.at)} (${left} turn${left === 1 ? '' : 's'}), or they are bought off, the lords there will rise and carry a quarter of the realm with them.`}
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
    <div class="tile" onclick="toggleAcc('houses')">${ico('map')}<div class="v">${owned(me()).length}<small>${allies(me()).length ? ' +' + allies(me()).length : ''}</small></div><div class="k">Provinces</div></div>
    <div class="tile" onclick="ACC.marriage=true;render();document.getElementById('acc-marriage').scrollIntoView({behavior:'smooth'})">${ico('ring')}<div class="v">${F.sons}</div><div class="k">Sons</div></div>
    <div class="tile" onclick="openPope()">${ico('church')}<div class="v">${F.bishops}<small> ${F.cardinals}✦</small></div><div class="k">Bishops</div></div>
    <div class="tile" onclick="openCourt()">${ico('fleur')}<div class="v">${F.gens.length}</div><div class="k">Generals</div></div>
  </div>`;
  const prisoners = prisonersHtml();
  return `<div class="phead">${shield(me(), 46)}<div><h2>${esc(rulerOf(me()))}</h2><span class="sub">${esc(f.trait || (f.realm === 'Rebel' ? 'A rebel house, risen in civil war.' : ''))}</span></div></div>
    ${tiles}
    ${unrestBox()}${envoyBox()}${fairOpen() ? `<div class="notebox good">${ico('market')} <b>The summer fair at Troyes is open</b> this turn only. Bring a purse of up to ${fairCap()} d and trade.<div class="row" style="margin-top:6px"><button class="btn gold sm" onclick="openFair()"><span class="lbl">${ico('market')}Go to the fair</span></button></div></div>` : ''}
    ${F.captive ? `<div class="notebox bad">${ico('chain')} ${rulerOf(me())} is a prisoner${F.captive.by ? ' of ' + fname(F.captive.by) : ''}. His host cannot take the field until he is ransomed; your generals' armies still can.</div>${ransom}` : ''}
    ${prisoners ? acc('prisoners', 'Your prisoners', 'chain', prisoners, G.offers.length ? G.offers.length + ' offer' + (G.offers.length > 1 ? 's' : '') : '') : ''}
    ${acc('garrisons', 'Your garrisons', 'castle', garrisonsHtml(), owned(me()).reduce((a, p) => a + garMen(p), 0) + ' men')}
    ${acc('armies', 'Your armies', 'sword', armiesHtml() + `<p class="sub">Garrisons cost nothing; armies in the field are paid every turn (foot ${UPKEEP.foot}, bow ${UPKEEP.bow}, horse ${UPKEEP.cav}, catapult ${UPKEEP.cat} d). Upkeep now ${upkeepOf(me())} d against ${grossIncome(me())} d of income. If the treasury runs dry, men desert.</p>`, `${men} men · ${upkeepOf(me())} d`)}
    ${acc('road', 'Your goal: ' + GOALS[goalId()].n, 'crown', goalHtml(held), goalCount(held))}
    ${acc('crowns', 'The crown and homage', 'crown', crownsHtml(), isKing(me()) ? vassals().length + ' sworn' : vassal(me()) ? 'sworn' : '')}
    ${acc('marriage', 'Marriages', 'ring', marriageHtml(), F.sons + ' son' + (F.sons === 1 ? '' : 's'))}
    ${acc('realm', 'The realm', 'map', `
      <p>Income ${coin(grossIncome(me()))} a turn, upkeep ${coin(upkeepOf(me()))} · net ${coin(net)}</p>
      <p>Church: ${F.bishops} bishop${F.bishops === 1 ? '' : 's'}, ${F.cardinals} cardinal${F.cardinals === 1 ? '' : 's'} · influence with the Pope ${Math.round(influence(me()) * 100)}%</p>
      <p>War buildings: ${wb.length ? wb.map(t => `<span class="tag on">${ico(BLD_ICON[t])}${BLD[t].n}</span>`).join('') : '<span class="sub">none. A forge, armory and stables can be built at any castle.</span>'}</p>
      <p>Generals: ${F.gens.length ? F.gens.map(g => `${GENMAP[g.id].n} <span class="sub">(${genPost(me(), g)})</span>`).join(', ') : '<span class="sub">none. Hire one at court.</span>'}</p>
      <p>Allied lords: ${allies(me()).length ? allies(me()).map(p => `<span class="tag" onclick="goProv('${p.id}')" style="cursor:pointer">${p.name}</span>`).join('') : '<span class="sub">none</span>'}</p>
      ${G.truces.filter(t => t.a === me() || t.b === me()).map(t => `<p>${ico('dove')} ${t.pact ? 'Peace' : 'Truce of God'} with ${fname(t.a === me() ? t.b : t.a)} until ${dateStr(t.until)}</p>`).join('')}${isKing(me()) && vassals().length ? `<p>${ico('handshake')} At peace with your vassals</p>` : vassal(me()) ? `<p>${ico('handshake')} At peace with the king, your lord</p>` : ''}`)}
    ${acc('houses', 'Other houses', 'people', `<div class="rivals">${rivals.map(id => { const R = G.fac[id], d = FAC(id); return `<div class="rival${R.alive ? '' : ' dead'}" onclick="${R.alive ? `goProv('${homeOf(id)}')` : ''}">${shield(id, 24)}<div style="min-width:0"><b>${esc(d.name)}</b>${d.realm === 'Rebel' ? ' <span class="tag red">rebels</span>' : ''}${isKing(id) ? ' <span class="tag on">king</span>' : vassal(id) ? ' <span class="tag">sworn</span>' : ''}<div class="sub" style="font-size:13px">${R.alive ? `${esc(rulerOf(id))}${R.excom ? ' · <span class="bad">excommunicated</span>' : ''}${R.captive ? ' · <span class="bad">lord captive</span>' : ''}${atPeace(me(), id) ? ' · at peace with you' : ''}${R.fallen ? ' · rallied once' : ''}` : 'destroyed'}</div></div>${R.alive ? `<div class="pw"><b>${owned(id).length} prov.</b>armies ${usableArmies(id).map(a => armySize(a)).join('+') || '0'}</div>` : ''}</div>`; }).join('')}</div>`, `${alive().length - 1} standing`)}
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
    const crowned = wears(me()), vs = vassals().length, need = homageNeed(), dh = domainHeld(me()), dn = domainNeed();
    const k = king();
    return `<p>${GOALS.king.d}</p>
      <p>${ico('crown')} Crown: ${crowned ? '<span class="good">anointed</span>' : k ? `<span class="bad">worn by ${esc(rulerOf(k))}</span>` : 'no one wears it'}</p>
      <p>${ico('handshake')} Homage: ${isKing(me()) ? vs : 0} of ${need} princes</p><div class="bar"><i style="width:${pct(isKing(me()) ? Math.min(vs, need) : 0, need)}%"></i></div>
      <p>${ico('map')} Your own counties in the kingdom: ${dh} of ${dn}</p><div class="bar"><i style="width:${pct(Math.min(dh, dn), dn)}%"></i></div>
      <p class="sub">Whoever gets all three first wins. Breaking every rival also wins.${k && k !== me() ? ` The king now has ${vs} oath${vs === 1 ? '' : 's'} and ${domainHeld(k)} counties.` : ''}</p>${size}`;
  }
  return `<p>${GOALS.conquest.d} <b>${rivals}</b> rival house${rivals === 1 ? '' : 's'} still stand${rivals === 1 ? 's' : ''}.</p>${fall}<p class="sub">You hold ${domainHeld(me())} of the kingdom's ${FRANCE.length} counties.</p><div class="bar"><i style="width:${pct(domainHeld(me()), FRANCE.length)}%"></i></div>${size}`;
}
function goalCount(held) { return goalId() === 'king' ? (wears(me()) ? `${vassals().length}/${homageNeed()} oaths` : 'not crowned') : `${alive().length - 1} left`; }

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
  return `<p>${ico('castle')} ${CASTLE_N[castleLv(p)]}${p.b.moat ? ' with a moat' : ''}${isCap(p) ? ', citadel' : ''} · walls ${p.walls}% <span class="sub">(defenders ${['fight in the open', 'protected', 'well protected', 'strongly protected', 'nearly unassailable'][Math.min(4, wallLvl(p))]})</span></p><div class="bar walls"><i style="width:${p.walls}%"></i></div>`;
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
  if (p.interdict > 0) tags.push(`<span class="tag red">${ico('interdict')}interdict, ${p.interdict} turn${p.interdict > 1 ? 's' : ''}</span>`);
  if (p.heiress && !p.owner) tags.push(`<span class="tag">${ico('ring')}Lady ${p.heiress}</span>`);
  h += `<p style="margin:0 0 4px">${tags.join('')}</p>`;
  if (p.cap && p.cap !== p.owner && FAC(p.cap)) h += `<p class="sub">Former seat of ${FAC(p.cap).name}</p>`;
  const why = { reims: 'Its archbishop anoints the kings of the Franks.', paris: 'The royal seat of the Robertians: a king needs it, with Reims.', laon: 'The last city of the Carolingians: Charles may be crowned with it in place of Paris.' }[p.id];
  if (why) h += `<p class="sub">${ico('crown')} ${why}</p>`;
  if (p.owner && inCrown(p.owner, p)) h += `<p class="sub">Held by the king: +1 d and double levies.</p>`;
  else if (p.owner && p.owner !== me() && reachOf(p.owner, p) >= 4) h += `<p class="sub">Far from ${FAC(p.owner).name}'s seat: it pays ${Math.round(reachMult(p.owner, p) * 100)}%.</p>`;
  if (p.owner && p.r === 'fr' && foreign(p.owner) && !inCrown(p.owner, p)) h += `<p class="sub">French lords resent foreign rule: income -30%.</p>`;
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
  const others = usableArmies(me()).filter(b => b !== A && canMarch(me(), b, p.id));
  if (others.length) return `<button class="btn" onclick="pickArmy('${others[0].id}')"><span class="lbl">${ico('flag')}Army ${ARMY_NUM(others[0])} can march here</span><small>switch to it</small></button>`;
  return `<p class="sub">${A.acted ? `Army ${ARMY_NUM(A)} has fought this turn.` : A.siege ? `Army ${ARMY_NUM(A)} is besieging ${P(A.siege).name}; march from there only to lift the siege.` : `Out of reach for army ${ARMY_NUM(A)} this turn (${MOVES} moves a turn through your own and allied land).`}</p>`;
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
      const sameHere = usableArmies(me()).filter(b => b !== A && b.loc === p.id && !b.siege && armySize(b) > 0);
      if (sameHere.length) h += `<p class="sub">Also here: ${sameHere.map(b => `army ${ARMY_NUM(b)} (${armySize(b)} men)`).join(', ')}. ${p.b.castle ? 'Move men between armies through the garrison.' : ''}</p>`;
      if (!A.acted && armySize(A)) h += `<p class="sub">Red dashed borders on the map mark what the army can strike from here; green dots mark where it can march.</p>`;
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
    if (here && canRaiseInto(me(), A)) h += `<h3>Raise into army ${ARMY_NUM(A)}</h3><div class="grid">${['foot', 'bow', 'cav', 'cat'].map(t => `<button class="btn" onclick="act('raiseA','${t}')" ${F.gold >= unitCost(me(), t) ? '' : 'disabled'}>${haveBadge(A[t], 'in army ' + ARMY_NUM(A))}<span class="lbl">${ico(UNIT_ICON[t])}${UNIT[t].n}</span><small>${unitCost(me(), t)} d · ${UPKEEP[t]} d a turn · ${statLine(t)}</small></button>`).join('')}</div><p class="sub">Men raised into an army are paid every turn.</p>`;
    if (p.b.castle) h += `<h3>Raise into the garrison</h3><div class="grid">${UT_ALL.map(t => `<button class="btn" onclick="act('raise','${t}')" ${F.gold >= unitCost(me(), t) ? '' : 'disabled'}>${haveBadge(t === 'bishop' ? F.bishops : p.gar[t], t === 'bishop' ? 'in council' : 'in garrison')}<span class="lbl">${ico(UNIT_ICON[t])}${UNIT[t].n}</span><small>${unitCost(me(), t)} d · ${statLine(t)}</small></button>`).join('')}</div><p class="sub">Garrisons cost nothing to keep. Bishops join your council of bishops.</p>`;
    h += defenceHtml(p);
  }
  return h + (cta ? `<div class="cta">${cta}</div>` : '');
}
const UT_ALL = ['foot', 'bow', 'cav', 'cat', 'bishop'];
function buildButtons(p, F) {
  if (p.build) return `<div class="notebox">${ico('hammer')} Work is under way: ${p.build.type === 'castle' ? CASTLE_N[castleLv(p) + 1] : p.build.type === 'rebuild' ? 'rebuilding the castle' : BLD[p.build.type].n}, ${p.build.left} turn${p.build.left > 1 ? 's' : ''} left. One project at a time.</div>`;
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
  let h = `<div class="notebox good">${ico('handshake')} ${p.lord} is sworn to you. You receive half the province's income, and you may build here and buy troops for its garrison. They will not march with your army, but your armies may march through their lands and strike from them.</div>` + tabsHtml(tabs, cur), cta = '';
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
  return `<h3>Marriage</h3><p>${ico('ring')} Lady <b>${p.heiress}</b>, heiress of ${p.name}. Win her hand for one of your sons and the province is yours with its garrison.</p><p class="sub">Her guardians want a suit worth at least <b>${courtFloor(p)}</b>. Your standing counts for ${Math.round(prestige(me(), p))}; a bride price, a promise of protection and a bishop's blessing add to it. Rival houses may bid against you.</p>`;
}
function courtshipBtn(p, F) {
  return `<button class="btn gold" onclick="openCourtshipDlg('${p.id}')" ${F.sons && !F.proposed && !G.court ? '' : 'disabled'}><span class="lbl">${ico('ring')}Court Lady ${p.heiress}</span><small>${F.proposed ? 'already courted this turn' : F.sons ? `sons: ${F.sons} · one courtship a turn` : 'no unmarried sons'}</small></button>`;
}
function foreignPanel(p, F, A) {
  const tabs = [{ id: 'war', n: 'War', ic: 'swords' }];
  if (!p.owner) tabs.push({ id: 'dip', n: 'Diplomacy', ic: 'handshake', dot: (p.heiress && F.sons && !F.proposed) || (canAlly(me(), p) && F.gold >= allyCost(me(), p)) });
  if (p.owner && p.owner !== me()) tabs.push({ id: 'treaty', n: 'Envoys', ic: 'handshake' }, { id: 'church', n: 'Church', ic: 'church' });
  const cur = keptTab(tabs) || 'war';
  let h = tabsHtml(tabs, cur), cta = '';
  if (cur === 'war') {
    h += `<h3>War · army ${ARMY_NUM(A)}</h3>`;
    const bz = besieging(p);
    const s = strikeFrom(me(), A, p);
    const peace = p.owner && truce() && F.excom < 1;
    const tr = p.owner ? G.truces.filter(t => (t.a === me() && t.b === p.owner) || (t.b === me() && t.a === p.owner)) : [];
    if (p.owner && atPeace(me(), p.owner)) h += tr.length ? `<div class="notebox">${ico('dove')} ${tr.some(x => x.treaty) ? 'A sworn truce' : tr[0].pact ? 'A marriage' : 'A Truce of God'} binds you and ${FAC(p.owner).name}. Neither may attack the other until ${dateStr(tr.reduce((a, t) => Math.max(a, t.until), 0))}.</div>`
      : isKing(me()) ? `<div class="notebox">${ico('handshake')} ${FAC(p.owner).name} is your sworn man. Declare his fiefs forfeit under the crown before you make war on him.</div>`
      : `<div class="notebox">${ico('handshake')} You have done homage to ${FAC(p.owner).name}, your king. Renounce it under the crown before you make war on him.</div>`;
    else if (slotState(A) !== 'active') h += `<p class="sub">${slotState(A) === 'captive' ? 'Your lord is a prisoner. Pay his ransom, or command another army.' : 'This army is not in the field.'}</p>`;
    else if (A.siege === p.id) {
      h += `<div class="notebox">${ico('tent')} Army ${ARMY_NUM(A)} besieges ${p.name}. Each turn the garrison starves and the walls weaken.</div><p class="units">${uStr(A, false)}</p>`;
      cta += `<div class="grid2" style="margin:0"><button class="btn" onclick="act('bombard')" ${A.cat && !A.bombarded && !p.ruined && p.b.castle ? '' : 'disabled'}><span class="lbl">${ico('cat')}Bombard</span><small>${A.cat ? A.cat * catShots(me(), A) + ' shots' : 'no catapults'}${A.bombarded ? ' · done' : ''}${p.ruined ? ' · walls already down' : ''}</small></button>
        <button class="btn red" onclick="openPreBattle('assault','${p.id}')" ${A.stormed ? 'disabled' : ''}><span class="lbl">${ico('swords')}Storm the walls</span><small>odds ${oddsTxt(estimateWin(assaultCfg(me(), A, p, 'balanced'), 30))}</small></button></div>
        <div class="grid2" style="margin:0"><button class="btn sm" onclick="openMine('${p.id}')" ${canMine(A, p) ? '' : 'disabled'}><span class="lbl">${ico('mine')}Dig a mine</span><small>${A.foot >= 4 ? 'instead of bombarding' : 'needs 4 footmen'}</small></button><button class="btn sm" onclick="act('autobomb')" ${A.cat && !A.bombarded && !p.ruined && p.b.castle ? '' : 'disabled'}><span class="lbl">${ico('skip')}Auto-bombard</span></button></div>
        <button class="btn sm ghost" onclick="act('lift')">Lift the siege</button>`;
    } else if (bz && bz.fid === me()) { h += `<p class="sub">Army ${ARMY_NUM(bz.a)} is besieging ${p.name}.</p>`; cta += `<button class="btn gold" onclick="pickArmy('${bz.a.id}')"><span class="lbl">${ico('tent')}Command army ${ARMY_NUM(bz.a)}</span></button>`; }
    else if (bz) h += `<p class="sub">${FAC(bz.fid).name} is already besieging it.</p>`;
    else if (!s) {
      const others = usableArmies(me()).filter(b => b !== A && strikeFrom(me(), b, p));
      h += `<p class="sub">${A.acted ? `Army ${ARMY_NUM(A)} has already fought this turn.` : !armySize(A) ? `Army ${ARMY_NUM(A)} has no fighting men. Raise troops into it or draw them from a garrison.` : `Out of reach for army ${ARMY_NUM(A)} this turn. An army strikes from a county of yours, or an ally's, that borders the target.`}</p>`;
      if (others.length) cta += others.map(b => `<button class="btn" onclick="pickArmy('${b.id}')"><span class="lbl">${ico('swords')}Army ${ARMY_NUM(b)} can strike from ${P(strikeFrom(me(), b, p).stage).name}</span><small>${armySize(b)} men · switch to it</small></button>`).join('');
    } else {
      if (peace) h += `<div class="notebox bad">${ico('dove')} The Peace of God protects the great houses until ${dateStr(TRUCE)}. Attack ${FAC(p.owner).name} now and the Pope excommunicates you for 4 turns.</div>`;
      if (p.ally && !p.owner) h += `<p class="sub">${p.lord} is sworn to ${fname(p.ally)}. Taking the province breaks that alliance.</p>`;
      const how = s.dist ? `marches to ${P(s.stage).name} (${s.dist} move${s.dist > 1 ? 's' : ''}) and strikes` : `strikes from ${P(s.stage).name}`;
      h += `<p>${ico('flag')} Army ${ARMY_NUM(A)} ${how}.</p>`;
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
        cta += `<button class="btn gold" onclick="act('ally')" ${F.gold >= c ? '' : 'disabled'}><span class="lbl">${ico('handshake')}Offer alliance</span><small>${c} d${foreign(me()) && p.r === 'fr' ? ' (French lords ask double of foreigners)' : ''}</small></button>`;
        h += `<h3>A charter</h3><p class="sub">${forgeNote(p, F)}</p>`;
        cta += `<button class="btn" onclick="openCharter('${p.id}')" ${canForge(p, F) ? '' : 'disabled'}><span class="lbl">${ico('scroll')}Forge an old charter</span><small>${FORGE_COST} d · needs a bishop · may be discovered</small></button>`;
      }
      else h += `<p class="sub">You must border them to treat with them${besiegerOf(p) ? ', and they must not be under siege' : ''}.</p>`;
    } else h += `<p class="sub">${p.lord} is sworn to ${fname(p.ally)}.</p>`;
    if (p.heiress) { h += courtshipIntro(p, F); cta += courtshipBtn(p, F); }
  } else if (cur === 'treaty') {
    const o = p.owner, pu = peaceUntil(me(), o);
    h += `<h3>${esc(FAC(o).name)}</h3><p>${esc(rulerOf(o))} holds ${owned(o).length} counties.${atPeace(me(), o) ? (pu > G.turn ? ` You are at peace until ${dateStr(pu)}.` : ' An oath of homage binds you.') : ' No truce binds you.'}</p><p class="sub">Send envoys to offer a truce of one to five years, or to ask them to join a war on a third house. Silver or a county can sweeten either.</p>`;
    cta += `<button class="btn gold" onclick="openDiplo('${o}')"><span class="lbl">${ico('handshake')}Send envoys to ${esc(FAC(o).name)}</span><small>${sentTo(o) ? 'already sent this turn' : 'truce · joint war · marriage'}</small></button>`;
  } else {
    h += `<h3>Interdict</h3><p>${ico('interdict')} Ask the Pope to lay ${p.name} under interdict: the churches close and the province pays nothing for 4 turns.</p><p class="sub">${popeCost(me(), 'interdict')} d · ${Math.round(popeChance(me(), 'interdict', p.id) * 100)}% chance. One petition a turn.${F.popeUsed ? ' <span class="bad">You have already petitioned this turn.</span>' : ''}</p>`;
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
  report('Excommunicated!', `You broke the Peace of God by attacking ${FAC(p.owner).name}. The Pope has cast ${rulerOf(me())} out of the Church: your troops fight worse and you lose a quarter of your income for 4 turns.`);
}
function act(c, a) {
  const p = G.sel && G.sel[0] === 'p' ? P(G.sel.slice(2)) : null, F = G.fac[me()], A = myA();
  tutorDid(c);
  switch (c) {
    case 'build': { const c0 = bldCost(p, a); if (F.gold < c0) return toast('Not enough deniers', 'coin'); F.gold -= c0; p.build = { type: a, left: bldTurns(p, a) }; note(`Work begins in ${p.name}: ${bldName(p, a)}.`); sfx('coin'); buzz(); toast(`Work begins: ${bldName(p, a)}`, 'hammer'); break; }
    case 'raise': {
      const cost = unitCost(me(), a); if (F.gold < cost) return toast('Not enough deniers', 'coin'); F.gold -= cost;
      if (a === 'bishop') { F.bishops++; toast('A bishop joins your council', 'bishop'); } else { p.gar[a]++; toast(`${UNIT[a].n} raised in ${p.name}`, UNIT_ICON[a]); }
      sfx('coin'); buzz(); break;
    }
    case 'raiseA': if (raise(me(), a, A)) { sfx('coin'); buzz(); toast(`${UNIT[a].n} join army ${ARMY_NUM(A)}`, UNIT_ICON[a]); } else toast('Not enough deniers', 'coin'); break;
    case 'toArmy': if (p.gar[a] > 0 && slotState(A) === 'active') { p.gar[a]--; A[a]++; } break;
    case 'toGar': if (A[a] > 0) { A[a]--; p.gar[a]++; } break;
    case 'allArmy': if (slotState(A) === 'active') for (const t of ['foot', 'bow', 'cav', 'cat']) { A[t] += p.gar[t]; p.gar[t] = 0; } break;
    case 'allGar': for (const t of ['foot', 'bow', 'cav', 'cat']) { p.gar[t] += A[t]; A[t] = 0; } break;
    case 'genStay': { const g = F.gens.find(x => x.at === 'a0'); const o = F.gens.find(x => x.at === p.id); if (g) g.at = p.id; if (o) o.at = 'a0'; break; }
    case 'genJoin': { const g = F.gens.find(x => x.at === p.id); const o = F.gens.find(x => x.at === 'a0'); if (g) g.at = 'a0'; if (o) o.at = p.id; break; }
    case 'genSwap': { const g = F.gens.find(x => x.at === p.id); const o = F.gens.find(x => x.at === A.id); if (g && o) { g.at = A.id; o.at = p.id; } break; }
    case 'move': { const was = A.siege, prevLoc = A.loc; if (marchArmy(me(), A, p.id)) { if (was) note(`You lift the siege of ${P(was).name}.`); PANEL.tab = 'army'; PANEL.hist = ['army', ...(PANEL.hist || []).filter(x => x !== 'army')]; { const from = P(prevLoc); toast(`Army ${ARMY_NUM(A)} marches to ${p.name}${holds(me(), from.id) ? ` · ${garMen(from)} stay in ${from.name}` : ''}`, 'flag'); } hint('army'); } break; }
    case 'besiege': { const s = stageFor(me(), A, p); if (!s) return; breakPeace(p); A.siege = p.id; A.loc = p.id; A.acted = true; note(`Army ${ARMY_NUM(A)} lays siege to ${p.name}.`); sfx('horn'); buzz(30); hint('siege'); break; }
    case 'bombard': openCatapult(p); return;
    case 'autobomb': if (A.cat && !A.bombarded && A.siege === p.id) autoBombard(A, p); break;
    case 'lift': note(`You lift the siege of ${p.name}.`); A.siege = null; A.loc = nearestHeld(me(), p.id); break;
    case 'ally': if (makeAlly(me(), p)) { sfx('bell'); flashProv(p.id); report('A new ally', `${p.lord} of ${p.name} swears to you. Half of the province's income is yours.`); } break;
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
function doCrown(k) { if (crown(me(), k)) { G.reports = G.reports.filter(r => r.title !== 'Long live the king!'); save(); render(); showCoronation(me(), k); } }
function doSummon(f) { const r = summonHomage(me(), f); if (r) { sfx(r.ok ? 'bell' : 'miss'); if (r.ok) buzz(); else toast(`${FAC(f).name} will not swear`, 'scroll'); } save(); render(); showReports(); }
function doSwear() { if (doHomage(me())) { sfx('bell'); report('Homage', `${rulerOf(me())} kneels to ${rulerOf(king())} and becomes the king's man. There is peace between you while the oath stands.`); } save(); render(); showReports(); }
function doRenounce() { renounce(me()); sfx('horn'); save(); render(); showReports(); }
function doForfeit(f) { if (forfeit(me(), f)) sfx('horn'); save(); render(); showReports(); }
function doFreeHomage(f) { if (releaseForHomage(me(), f)) sfx('bell'); save(); render(); showReports(); }
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
      return showModal(`<div class="rep"><div class="sealmark">${ico('next')}</div><h2>End the turn?</h2><p>${warn.map(w => w[0].toUpperCase() + w.slice(1)).join(', and ')}.</p><div class="grid2"><button class="btn gold" onclick="closeModal();playerEndTurn(true)">End turn</button><button class="btn" onclick="closeModal()">Not yet</button></div><p class="sub ctr" style="margin-top:10px">This reminder can be turned off in settings.</p></div>`);
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
