'use strict';
// ================= ACTIVE ARMY =================
function myA() {
  const arms = armiesOf(me());
  let a = arms.find(x => x.id === G.army);
  if (!a || !armyUsable(me(), a)) a = usableArmies(me())[0] || lordArmy(me());
  G.army = a.id; return a;
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
    if (st === 'locked') return `<button class="ab lock" onclick="openCourt()" title="${ARMY_IDS.indexOf(a.id) === 1 ? 'Hold 8 provinces to field a second army' : 'Wear a crown to field a third army'}">${ico('lock')}<span>${ARMY_NUM(a)}</span></button>`;
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
      <button class="btn sm desk" onclick="openPope()"><span class="lbl">${ico('church')}Church</span></button>
      <button class="btn sm desk ibtn" onclick="openLog()" title="Chronicle" style="position:relative">${ico('scroll')}${G.unread ? `<span style="position:absolute;top:-4px;right:-4px;background:#b8342c;color:#fff;border-radius:9px;font-size:10px;padding:1px 5px">${G.unread}</span>` : ''}</button>
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
    if (st === 'locked') body = `<p class="sub">${i === 1 ? 'Hold 8 provinces to field a second army.' : 'Wear a crown to field a third army.'} <span class="muted">(${owned(me()).length} provinces${(FAC(me()).kingOf || []).length ? ', crowned' : ', no crown'})</span></p>`;
    else if (st === 'nogen') body = `<p class="sub">Waiting for a general. Hire one at court, or post an idle strategist here.</p><button class="btn sm" onclick="openCourt()"><span class="lbl">${ico('fleur')}Court</span></button>`;
    else body = armyLine(a) + (st === 'active' ? `<div class="row" style="margin-top:6px">${a.id !== A.id ? `<button class="btn sm" onclick="pickArmy('${a.id}')"><span class="lbl">${ico('flag')}Command</span></button>` : ''}${a.loc ? `<button class="btn sm ghost" onclick="goProv('${a.loc}')"><span class="lbl">${ico('eye')}Go there</span></button>` : ''}</div>` : '');
    return `<div class="statcard${a.id === A.id && st === 'active' ? ' on' : ''}"><b>${ARMY_NUM(a)} · ${armyLabel(me(), a)}</b>${st === 'active' && a.acted ? ' <span class="tag">done</span>' : ''}${body}</div>`;
  }).join('');
}
function crownsHtml() {
  let h = '';
  for (const k in KINGDOMS) {
    const K = KINGDOMS[k], who = G.crowns[k], pr = crownProgress(me(), k);
    const n = KINGDOMS[k].list.filter(id => P(id).owner === me()).length;
    if (who === me()) { h += `<div class="statcard on"><b>${ico('crown')} King of ${K.n}</b><ul><li>+2 d from each of your ${n} provinces there: <b>+${crownIncome(me(), k)} d a turn</b></li><li>Double levies in those provinces</li><li>No resentment from French lords there</li><li>The royal host: +10% attack for all your troops, and a third army (one bonus, however many crowns)</li></ul></div>`; continue; }
    if (who) { h += `<p class="sub">Crown of ${K.n}: worn by ${fname(who)}</p>`; continue; }
    const ok = canCrown(me(), k);
    h += `<div class="statcard"><b>Crown of ${K.n}</b> <span class="sub">(${K.list.length} provinces)</span><div class="bar"><i style="width:${pct(pr.have, K.need)}%"></i></div>Needs ${K.need} of its provinces (you hold ${pr.have}) and both ${K.keys.map(id => P(id).name).join(' and ')} (you hold ${pr.keys}).<br><span class="sub">Would give you +2 d per province you hold there (+${n * 2} d now), double levies there, +10% attack for all your troops, and a third army.</span>${ok ? `<br><button class="btn gold" onclick="doCrown('${k}')" ${G.fac[me()].gold >= CROWN_COST ? '' : 'disabled'}><span class="lbl">${ico('crown')}Be crowned at ${K.at}</span><small>${CROWN_COST} d for the coronation</small></button>` : ''}</div>`;
  }
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
  h += ladies.length ? `<p class="sub">Heiresses (win one and her province is yours, garrison and all):</p><div class="grid">${ladies.map(p => `<button class="btn" onclick="goProv('${p.id}')"><span class="lbl">${ico('ring')}Lady ${p.heiress}</span><small>${p.name}${p.ally ? ' · sworn to ' + fname(p.ally) : ''} · floor ${courtFloor(p)}</small></button>`).join('')}</div>` : '<p class="sub">No heiresses are of marrying age just now.</p>';
  const foes = alive().filter(f => f !== me());
  h += `<p class="sub" style="margin-top:10px">Marriage pacts with rival houses (${PACT_COST} d in gifts; peace for ${PACT_TURNS} turns, neither may attack the other):</p><div class="grid">${foes.map(f => `<button class="btn" onclick="doPact('${f}')" ${canPact(me(), f) && F.gold >= PACT_COST ? '' : 'disabled'}><span class="lbl">${shield(f, 14)} ${FAC(f).name}</span><small>${atPeace(me(), f) ? 'already at peace' : recentPeace(me(), f) ? 'too soon after the last peace' : Math.round(pactChance(me(), f) * 100) + '% chance'}</small></button>`).join('')}</div>`;
  return h;
}
function goProv(id) { G.sel = 'p:' + id; PANEL.tab = null; render(); focusProv(id); if (isPhone()) setSheet('half'); }
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
    ${acc('armies', 'Your armies', 'sword', armiesHtml() + `<p class="sub">Garrisons cost nothing; armies in the field are paid every turn (foot ${UPKEEP.foot}, bow ${UPKEEP.bow}, horse ${UPKEEP.cav}, catapult ${UPKEEP.cat} d). Upkeep now ${upkeepOf(me())} d against ${grossIncome(me())} d of income. If the treasury runs dry, men desert.</p>`, `${men} men · ${upkeepOf(me())} d`)}
    ${acc('road', 'Your goal: ' + GOALS[goalId()].n, 'crown', goalHtml(held), goalCount(held))}
    ${acc('crowns', 'Crowns', 'crown', crownsHtml(), (FAC(me()).kingOf || []).length ? (FAC(me()).kingOf.length + ' worn') : '')}
    ${acc('marriage', 'Marriages', 'ring', marriageHtml(), F.sons + ' son' + (F.sons === 1 ? '' : 's'))}
    ${acc('realm', 'The realm', 'map', `
      <p>Income ${coin(grossIncome(me()))} a turn, upkeep ${coin(upkeepOf(me()))} · net ${coin(net)}</p>
      <p>Church: ${F.bishops} bishop${F.bishops === 1 ? '' : 's'}, ${F.cardinals} cardinal${F.cardinals === 1 ? '' : 's'} · influence with the Pope ${Math.round(influence(me()) * 100)}%</p>
      <p>War buildings: ${wb.length ? wb.map(t => `<span class="tag on">${ico(BLD_ICON[t])}${BLD[t].n}</span>`).join('') : '<span class="sub">none. A forge, armory and stables can be built at any castle.</span>'}</p>
      <p>Generals: ${F.gens.length ? F.gens.map(g => `${GENMAP[g.id].n} <span class="sub">(${genPost(me(), g)})</span>`).join(', ') : '<span class="sub">none. Hire one at court.</span>'}</p>
      <p>Longships: ${shipsOf(me()) ? SEAS.filter(z => G.fleets[z[0]][me()]).map(z => `${G.fleets[z[0]][me()]} in the ${z[1]}`).join(', ') : '<span class="sub">none. Build them in a port. A hostile fleet closes a sea lane to your armies.</span>'}</p>
      <p>Allied lords: ${allies(me()).length ? allies(me()).map(p => `<span class="tag" onclick="goProv('${p.id}')" style="cursor:pointer">${p.name}</span>`).join('') : '<span class="sub">none</span>'}</p>
      ${G.truces.filter(t => t.a === me() || t.b === me()).map(t => `<p>${ico('dove')} ${t.pact ? 'Peace' : 'Truce of God'} with ${fname(t.a === me() ? t.b : t.a)} until ${dateStr(t.until)}</p>`).join('')}`)}
    ${acc('houses', 'Other houses', 'people', `<div class="rivals">${rivals.map(id => { const R = G.fac[id], d = FAC(id); return `<div class="rival${R.alive ? '' : ' dead'}" onclick="${R.alive ? `goProv('${homeOf(id)}')` : ''}">${shield(id, 24)}<div style="min-width:0"><b>${esc(d.name)}</b>${d.realm === 'Rebel' ? ' <span class="tag red">rebels</span>' : d.realm === 'Union' ? ' <span class="tag">kingdom</span>' : ''}<div class="sub" style="font-size:13px">${R.alive ? `${esc(rulerOf(id))}${R.excom ? ' · <span class="bad">excommunicated</span>' : ''}${R.captive ? ' · <span class="bad">lord captive</span>' : ''}${atPeace(me(), id) ? ' · at peace with you' : ''}${R.fallen ? ' · rallied once' : ''}` : 'destroyed'}</div></div>${R.alive ? `<div class="pw"><b>${owned(id).length} prov.</b>armies ${usableArmies(id).map(a => armySize(a)).join('+') || '0'}</div>` : ''}</div>`; }).join('')}</div>`, `${alive().length - 1} standing`)}
    <p class="hint" style="margin-top:14px">Tap a province or a sea. Pinch or scroll to zoom, drag to pan, double-tap to zoom in. Green dots mark where the chosen army can march; red dashes mark what it can strike this turn.</p>
    <p class="sub ctr">Rivals: ${diff().n.toLowerCase()} · ${G.turn} turn${G.turn === 1 ? '' : 's'} played</p>
    <div class="row"><button class="btn sm" onclick="openSaves()"><span class="lbl">${ico('scroll')}Save / load</span></button><button class="btn sm" onclick="openHelp()"><span class="lbl">${ico('info')}How to play</span></button><button class="btn sm" onclick="homeView(true)"><span class="lbl">${ico('home')}Find my lands</span></button><button class="btn sm ghost" onclick="confirmNew()">New game</button></div>`;
}

// progress toward the goal chosen at the start
function crownLine(k) {
  const K = KINGDOMS[k], pr = crownProgress(me(), k);
  if (wears(me(), k)) return `<p>${ico('crown')} <b>King of ${K.n}</b> <span class="good">done</span></p>`;
  if (G.crowns[k]) return `<p>${ico('crown')} King of ${K.n}: <span class="bad">worn by ${fname(G.crowns[k])}</span>. Take its crown cities to win it back.</p>`;
  return `<p>${ico('crown')} King of ${K.n}: ${pr.have} of ${K.need} provinces, ${pr.keys} of ${K.keys.length} crown cities (${K.keys.map(id => P(id).name).join(', ')})</p><div class="bar"><i style="width:${pct(Math.min(pr.have, K.need) + pr.keys * 3, K.need + K.keys.length * 3)}%"></i></div>`;
}
function goalHtml(held) {
  const g = goalId(), rivals = alive().length - 1;
  const fall = `<p class="sub">Take a house's seat (${ico('crown')}) and you win it and every province beside it; a house with four connected provinces left rallies once under an heir, the rest falls to its castellans.</p>`;
  const size = owned(me()).length > 15 ? `<p class="sub">A realm this size yields ${Math.round(adminMult(me()) * 100)}% of its income.</p>` : '';
  if (g === 'kingdom') return `<p>${GOALS.kingdom.d}</p>${crownLine('franks')}<p class="sub">Any house that is crowned King of the Franks first wins. Breaking every rival also wins.</p>${size}`;
  if (g === 'empire') return `<p>${GOALS.empire.d}</p>${crownLine('franks')}${crownLine('germans')}${crownLine('italians')}<p>Empire: ${held} of ${empireNeed()} provinces needed (of ${EMPIRE.length})</p><div class="bar"><i style="width:${pct(Math.min(held, empireNeed()), empireNeed())}%"></i></div><p class="sub">You need the Franks and one of Germany or Italy. Any house that gets there first wins.</p>${size}`;
  return `<p>Break every rival house, including rebels and any kingdom that rises against you, and you will be crowned Emperor at Aachen in Charlemagne's place. <b>${rivals}</b> rival house${rivals === 1 ? '' : 's'} still stand${rivals === 1 ? 's' : ''}.</p>${fall}<p class="sub">You hold ${held} of the ${EMPIRE.length} provinces of Charlemagne's old empire.</p><div class="bar"><i style="width:${pct(held, EMPIRE.length)}%"></i></div>${size}`;
}
function goalCount(held) { const g = goalId(); return g === 'kingdom' ? (wears(me(), 'franks') ? 'crowned' : `${crownProgress(me(), 'franks').have}/${KINGDOMS.franks.need}`) : g === 'empire' ? `${held}/${empireNeed()}` : `${alive().length - 1} left`; }

// ================= PROVINCE =================
const PANEL = { tab: null };
function setTab(t) { PANEL.tab = t; render(); }
function tabsHtml(tabs, cur) { return `<div class="tabs">${tabs.map(t => `<button class="${cur === t.id ? 'on' : ''}" onclick="setTab('${t.id}')">${ico(t.ic)}${t.n}${t.dot ? '<span class="dot"></span>' : ''}</button>`).join('')}</div>`; }
function castleText(p) {
  if (!p.b.castle) return `<p class="sub">No castle. Only the levy defends, and no garrison can be kept here.</p>`;
  if (p.ruined) return `<div class="notebox bad">${ico('rebuild')} The castle lies in ruins. Its walls give no protection until it is rebuilt.</div>`;
  return `<p>${ico('castle')} ${CASTLE_N[castleLv(p)]}${p.b.moat ? ' with a moat' : ''}${isCap(p) ? ', citadel' : ''} · walls ${p.walls}% <span class="sub">(defenders ${['fight in the open', 'protected', 'well protected', 'strongly protected', 'nearly unassailable'][Math.min(4, wallLvl(p))]})</span></p><div class="bar walls"><i style="width:${p.walls}%"></i></div>`;
}
function provHead(p) {
  const bz = besieging(p);
  const who = p.owner ? FAC(p.owner).name : p.ally ? `${p.lord}, sworn to ${fname(p.ally)}` : p.lord;
  let h = `<div class="row top"><button class="btn sm" onclick="G.sel=null;PANEL.tab=null;render()"><span class="lbl">${ico('back')}Realm</span></button></div>
    <div class="phead">${shield(p.owner || p.ally, 42)}<div style="min-width:0"><h2><span class="init">${p.name[0]}</span>${p.name.slice(1)}${isCap(p) ? ' ' + ico('crown') : ''}</h2><span class="sub">${esc(who)} · ${REGION_NAME[p.r]}${EMPIRE.includes(p.id) ? ' · imperial' : ''}${p.seas.length ? ' · coast' : ''}${p.hills ? ' · hills' : ''}</span></div></div>`;
  const tags = [];
  if (p.owner) tags.push(`<span class="tag">${ico('coin')}${provIncome(p)} d a turn${bz ? ' (blockaded)' : ''}${p.interdict > 0 ? ' (interdict)' : ''}</span>`);
  else if (p.ally) tags.push(`<span class="tag">${ico('coin')}${minorIncome(p)} d · half to ${fname(p.ally)}</span>`);
  else tags.push(`<span class="tag">${ico('coin')}worth ${p.base} d a turn</span>`);
  if (p.b.castle) tags.push(`<span class="tag">${ico('castle')}${p.ruined ? 'ruined' : CASTLE_N[castleLv(p)].replace(' castle', '')}${!p.ruined && p.walls < 100 ? ' ' + p.walls + '%' : ''}</span>`);
  for (const t of ['farm', 'market', 'port', 'mine', 'forge', 'armory', 'stables']) if (p.b[t]) tags.push(`<span class="tag on">${ico(BLD_ICON[t])}${BLD[t].n}${BLD[t].realm ? '' : ROMAN[p.b[t]]}</span>`);
  if (p.build) tags.push(`<span class="tag">${ico('hammer')}${p.build.type === 'castle' ? CASTLE_N[castleLv(p) + 1] : p.build.type === 'rebuild' ? 'Rebuilding' : BLD[p.build.type].n}: ${p.build.left} turn${p.build.left > 1 ? 's' : ''}</span>`);
  if (bz) tags.push(`<span class="tag red">${ico('tent')}besieged by ${FAC(bz.fid).name}</span>`);
  if (p.plague) tags.push(`<span class="tag red">${ico('skull')}plague (${['', 'mild', 'spreading', 'raging'][p.plague.s]})</span>`);
  if (p.interdict > 0) tags.push(`<span class="tag red">${ico('interdict')}interdict, ${p.interdict} turn${p.interdict > 1 ? 's' : ''}</span>`);
  if (p.heiress && !p.owner) tags.push(`<span class="tag">${ico('ring')}Lady ${p.heiress}</span>`);
  h += `<p style="margin:0 0 4px">${tags.join('')}</p>`;
  if (p.cap && p.cap !== p.owner && FAC(p.cap)) h += `<p class="sub">Former seat of ${FAC(p.cap).name}</p>`;
  if (KPROV[p.id]) h += `<p class="sub">Land of the crown of ${KPROV[p.id].map(k => KINGDOMS[k].n + (G.crowns[k] ? ' (worn by ' + fname(G.crowns[k]) + ')' : '') + (KINGDOMS[k].keys.includes(p.id) ? ', a crown city' : '')).join('; ')}.${p.owner && inCrown(p.owner, p) ? ' Its king gains +2 d and double levies here.' : ''}</p>`;
  if (p.owner && p.r === 'fr' && foreign(p.owner) && !inCrown(p.owner, p)) h += `<p class="sub">French lords resent foreign rule: income -30%.</p>`;
  return h;
}
function defenceHtml(p) {
  let h = `<h3>Defences</h3>` + castleText(p) + `<p class="units">${uStr({ ...p.gar, militia: p.militia }, true)}</p>`;
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
  const cur = PANEL.tab && tabs.some(t => t.id === PANEL.tab) ? PANEL.tab : (here || bz || F.unrest && F.unrest.seed === p.id ? 'army' : 'build');
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
    if (p.b.port) h += `<h3>Longships</h3><p class="sub">A hostile fleet closes a sea lane to armies; clear it and your armies may cross from any coast on it.</p><div class="grid">${p.seas.map(z => `<button class="btn" onclick="act('ship','${z}')" ${F.gold >= shipCost(me()) && !Object.keys(G.fleets[z]).some(k => k !== me() && G.fleets[z][k] > 0) ? '' : 'disabled'}><span class="lbl">${ico('ship')}Into the ${SEAMAP[z]}</span><small>${shipCost(me())} d</small></button>`).join('')}</div>`;
  } else {
    if (here && canRaiseInto(me(), A)) h += `<h3>Raise into army ${ARMY_NUM(A)}</h3><div class="grid">${['foot', 'bow', 'cav', 'cat'].map(t => `<button class="btn" onclick="act('raiseA','${t}')" ${F.gold >= unitCost(me(), t) ? '' : 'disabled'}><span class="lbl">${ico(UNIT_ICON[t])}${UNIT[t].n}</span><small>${unitCost(me(), t)} d · ${UPKEEP[t]} d a turn · ${statLine(t)}</small></button>`).join('')}</div><p class="sub">Men raised into an army are paid every turn.</p>`;
    if (p.b.castle) h += `<h3>Raise into the garrison</h3><div class="grid">${UT_ALL.map(t => `<button class="btn" onclick="act('raise','${t}')" ${F.gold >= unitCost(me(), t) ? '' : 'disabled'}><span class="lbl">${ico(UNIT_ICON[t])}${UNIT[t].n}</span><small>${unitCost(me(), t)} d · ${statLine(t)}</small></button>`).join('')}</div><p class="sub">Garrisons cost nothing to keep. Bishops join your council of bishops.</p>`;
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
  const cur = PANEL.tab && tabs.some(t => t.id === PANEL.tab) ? PANEL.tab : (p.heiress ? 'wed' : 'army');
  let h = `<div class="notebox good">${ico('handshake')} ${p.lord} is sworn to you. You receive half the province's income, and you may build here and buy troops for its garrison. They will not march with your army, but your armies may march through their lands and strike from them.</div>` + tabsHtml(tabs, cur), cta = '';
  if (cur === 'army') {
    h += `<h3>Army ${ARMY_NUM(A)} · ${armyLabel(me(), A)}</h3>` + (here ? `<p>Army ${ARMY_NUM(A)} is camped here.</p><p class="units">${uStr(A, false)}</p>` : armyLine(A));
    if (!here) cta += marchBtn(p, A);
    h += defenceHtml(p);
  } else if (cur === 'build') h += `<h3>Build</h3>` + buildButtons(p, F);
  else if (cur === 'raise') h += `<h3>Buy troops for their garrison</h3><div class="grid">${['foot', 'bow', 'cav'].map(t => `<button class="btn" onclick="act('raise','${t}')" ${F.gold >= unitCost(me(), t) ? '' : 'disabled'}><span class="lbl">${ico(UNIT_ICON[t])}${UNIT[t].n}</span><small>${unitCost(me(), t)} d · ${statLine(t)}</small></button>`).join('')}</div>` + defenceHtml(p);
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
  if (p.owner && p.owner !== me()) tabs.push({ id: 'church', n: 'Church', ic: 'church' });
  const cur = PANEL.tab && tabs.some(t => t.id === PANEL.tab) ? PANEL.tab : 'war';
  let h = tabsHtml(tabs, cur), cta = '';
  if (cur === 'war') {
    h += `<h3>War · army ${ARMY_NUM(A)}</h3>`;
    const bz = besieging(p);
    const s = strikeFrom(me(), A, p);
    const peace = p.owner && truce() && F.excom < 1;
    if (p.owner && atPeace(me(), p.owner)) h += `<div class="notebox">${ico('dove')} ${G.truces.find(t => (t.a === me() && t.b === p.owner) || (t.b === me() && t.a === p.owner)).pact ? 'A marriage' : 'A Truce of God'} binds you and ${FAC(p.owner).name}. Neither may attack the other until ${dateStr(G.truces.filter(t => (t.a === me() && t.b === p.owner) || (t.b === me() && t.a === p.owner)).reduce((a, t) => Math.max(a, t.until), 0))}.</div>`;
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
      h += `<p class="sub">${A.acted ? `Army ${ARMY_NUM(A)} has already fought this turn.` : !armySize(A) ? `Army ${ARMY_NUM(A)} has no fighting men. Raise troops into it or draw them from a garrison.` : `Out of reach for army ${ARMY_NUM(A)} this turn. An army strikes from a province of yours that borders the target, or shares a sea lane no hostile fleet holds.`}</p>`;
      if (others.length) cta += others.map(b => `<button class="btn" onclick="pickArmy('${b.id}')"><span class="lbl">${ico('swords')}Army ${ARMY_NUM(b)} can strike from ${P(strikeFrom(me(), b, p).stage).name}</span><small>${armySize(b)} men · switch to it</small></button>`).join('');
    } else {
      if (peace) h += `<div class="notebox bad">${ico('dove')} The Peace of God protects the great houses until ${dateStr(TRUCE)}. Attack ${FAC(p.owner).name} now and the Pope excommunicates you for 4 turns.</div>`;
      if (p.ally && !p.owner) h += `<p class="sub">${p.lord} is sworn to ${fname(p.ally)}. Taking the province breaks that alliance.</p>`;
      const how = s.dist ? `marches to ${P(s.stage).name} (${s.dist} move${s.dist > 1 ? 's' : ''}) and ${s.sea ? 'crosses the sea to strike' : 'strikes'}` : s.sea ? `crosses the sea from ${P(s.stage).name} to strike` : `strikes from ${P(s.stage).name}`;
      h += `<p>${ico(s.sea ? 'ship' : 'flag')} Army ${ARMY_NUM(A)} ${how}.</p>`;
      const odds = estimateWin({ ...assaultCfg(me(), A, p, 'balanced'), aMod: mods(me()) - (peace ? 1 : 0) }, 30);
      h += `<p class="units">Your army: ${uStr(A, false)}</p>`;
      if (p.b.castle && !p.ruined) { h += `<p class="sub">Storm now, or lay siege: starve them, bombard the walls, then storm when the odds improve.</p>`; cta += `<div class="grid2" style="margin:0"><button class="btn" onclick="act('besiege')"><span class="lbl">${ico('tent')}Lay siege</span><small>${A.cat ? 'then bombard' : 'starve them out'}</small></button><button class="btn red" onclick="openPreBattle('assault','${p.id}')"><span class="lbl">${ico('swords')}Storm at once</span><small>odds ${oddsTxt(odds)}</small></button></div>`; }
      else cta += `<button class="btn red" onclick="openPreBattle('assault','${p.id}')"><span class="lbl">${ico('swords')}Attack ${p.name}</span><small>odds ${oddsTxt(odds)}</small></button>`;
    }
    h += defenceHtml(p);
  } else if (cur === 'dip') {
    if (!p.ally) {
      const c = allyCost(me(), p);
      h += `<h3>Alliance</h3><p>Pay ${p.lord} to swear to you. You take half the income, control the buildings and can buy troops for the garrison. Allies count toward the empire, and your armies may march through their land.</p>`;
      if (canAlly(me(), p)) {
        cta += `<button class="btn gold" onclick="act('ally')" ${F.gold >= c ? '' : 'disabled'}><span class="lbl">${ico('handshake')}Offer alliance</span><small>${c} d${foreign(me()) && p.r === 'fr' ? ' (French lords ask double of foreigners)' : ''}</small></button>`;
        h += `<h3>A charter</h3><p class="sub">${forgeNote(p, F)}</p>`;
        cta += `<button class="btn" onclick="openCharter('${p.id}')" ${canForge(p, F) ? '' : 'disabled'}><span class="lbl">${ico('scroll')}Forge an old charter</span><small>${FORGE_COST} d · needs a bishop · may be discovered</small></button>`;
      }
      else h += `<p class="sub">You must border them by land or share a coast to treat with them${besiegerOf(p) ? ', and they must not be under siege' : ''}.</p>`;
    } else h += `<p class="sub">${p.lord} is sworn to ${fname(p.ally)}.</p>`;
    if (p.heiress) { h += courtshipIntro(p, F); cta += courtshipBtn(p, F); }
  } else {
    h += `<h3>Interdict</h3><p>${ico('interdict')} Ask the Pope to lay ${p.name} under interdict: the churches close and the province pays nothing for 4 turns.</p><p class="sub">${popeCost(me(), 'interdict')} d · ${Math.round(popeChance(me(), 'interdict', p.id) * 100)}% chance. One petition a turn.${F.popeUsed ? ' <span class="bad">You have already petitioned this turn.</span>' : ''}</p>`;
    cta += `<button class="btn" onclick="doPope('interdict','${p.id}')" ${!F.popeUsed && F.gold >= popeCost(me(), 'interdict') ? '' : 'disabled'}><span class="lbl">${ico('interdict')}Interdict ${p.name}</span><small>${popeCost(me(), 'interdict')} d</small></button><button class="btn sm ghost" onclick="openPope()">Open the Church</button>`;
  }
  return h + (cta ? `<div class="cta">${cta}</div>` : '');
}
function seaPanel(z) {
  const name = SEAMAP[z], f = G.fleets[z], F = G.fac[me()];
  const mineN = f[me()] || 0;
  const coasts = provList().filter(p => p.seas.includes(z));
  const hostile = Object.keys(f).filter(k => k !== me() && f[k] > 0 && G.fac[k].alive && !atPeace(me(), k));
  let h = `<div class="row top"><button class="btn sm" onclick="G.sel=null;render()"><span class="lbl">${ico('back')}Realm</span></button></div><div class="phead"><div style="color:#2e4b48">${ico('ship', 'xl')}</div><div><h2>The ${name}</h2><span class="sub">Sea lane · ${laneOpen(z, me()) ? 'open to your armies' : 'closed by a hostile fleet'}</span></div></div>`;
  h += `<h3>Fleets</h3>`;
  const fl = Object.keys(f).filter(k => f[k] > 0);
  h += fl.length ? fl.map(k => `<p>${shield(k, 18)} ${FAC(k).name}: ${f[k]} longship${f[k] > 1 ? 's' : ''}${hostile.includes(k) ? ' <span class="bad">(hostile)</span>' : ''}</p>`).join('') : '<p class="sub">No ships.</p>';
  h += `<p>${hostile.length ? `A hostile fleet closes this lane: your armies cannot cross it until it is cleared.` : 'No hostile fleet: your armies may cross from any coast on this sea to any other.'}</p>`;
  if (mineN) {
    h += `<h3>Sail</h3>`;
    if (F.moved.includes(z)) h += '<p class="sub">This fleet has already sailed this turn.</p>';
    else h += `<div class="grid">${SEA_ADJ[z].map(n => { const en = Object.keys(G.fleets[n]).filter(k => k !== me()).reduce((a, k) => a + G.fleets[n][k], 0); return `<button class="btn${en ? ' red' : ''}" onclick="act('sail','${z}>${n}')"><span class="lbl">${ico(en ? 'swords' : 'ship')}${en ? 'Attack' : 'Sail to'} the ${SEAMAP[n]}</span><small>${en ? en + ' enemy ships' : 'clear'}</small></button>`; }).join('')}</div>`;
  }
  h += `<h3>Coasts</h3><p>${coasts.map(p => `<span class="tag" style="border-color:${p.owner ? FAC(p.owner).color : '#b9a37a'};cursor:pointer" onclick="goProv('${p.id}')">${p.name}</span>`).join('')}</p>`;
  h += `<p class="sub">Build longships in any port on this sea. They cost ${shipCost(me())} d and need no upkeep.</p>`;
  return h;
}
function render() {
  if (!G) return;
  renderHeader(); renderMapFill(); renderOverlay(); renderArmyBar(); renderDock();
  let h;
  if (G.sel && G.sel[0] === 'p') h = provPanel(P(G.sel.slice(2)));
  else if (G.sel && G.sel[0] === 's') h = seaPanel(G.sel.slice(2));
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
    case 'move': { const was = A.siege; if (marchArmy(me(), A, p.id)) { if (was) note(`You lift the siege of ${P(was).name}.`); PANEL.tab = 'army'; toast(`Army ${ARMY_NUM(A)} marches to ${p.name}`, 'flag'); hint('army'); } break; }
    case 'besiege': { const s = stageFor(me(), A, p); if (!s) return; breakPeace(p); A.siege = p.id; A.loc = p.id; A.acted = true; note(`Army ${ARMY_NUM(A)} lays siege to ${p.name}.`); sfx('horn'); buzz(30); hint('siege'); break; }
    case 'bombard': openCatapult(p); return;
    case 'autobomb': if (A.cat && !A.bombarded && A.siege === p.id) autoBombard(A, p); break;
    case 'lift': note(`You lift the siege of ${p.name}.`); A.siege = null; A.loc = nearestHeld(me(), p.id); break;
    case 'ally': if (makeAlly(me(), p)) { sfx('bell'); flashProv(p.id); report('A new ally', `${p.lord} of ${p.name} swears to you. Half of the province's income is yours.`); } break;
    case 'ship': if (buildShip(me(), p, a)) { sfx('ship'); toast('A longship is launched', 'ship'); } break;
    case 'sail': { const [from, to] = a.split('>'); if (moveFleet(me(), from, to)) { sfx('ship'); G.sel = 's:' + to; } break; }
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
  G.sel = null; G.endWarned = false; PANEL.tab = null;
  save();
  runTurnOverlay(G.order, lines, () => { render(); sfx('bell'); buzz(20); if (isPhone()) setSheet('peek'); showReports(); if (G.turn === TRUCE) hint('endturn'); }, snap);
}
