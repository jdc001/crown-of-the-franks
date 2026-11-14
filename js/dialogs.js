'use strict';
// ================= REPORTS =================
const REPORT_ICON = [[/Unrest|unrest/, 'fire'], [/envoy|Envoy/, 'handshake'], [/Desertion/, 'coin'], [/destroyed|An army/, 'swords'],[/fallen|destroyed|beaten|Defeat/i, 'swords'], [/captured|prisoner|Ransom/i, 'chain'], [/Excommunicated|Rome|interdict/i, 'church'], [/Siege|siege/i, 'tent'], [/Rebellion|Civil war|rises/i, 'flag'], [/wedding|marriage|pact/i, 'ring'], [/ally|alliance/i, 'handshake'], [/king|King|crown/i, 'crown'], [/sea/i, 'ship']];
function showReports() {
  if (G.over) return gameOver();
  const r = G.reports.shift();
  if (!r) return;
  const bad = /fallen|captured|lost|Excommunicated|Siege|beaten|Defeat|refused|broken|Rebellion|Civil war|rises/i.test(r.title);
  const icon = (REPORT_ICON.find(([re]) => re.test(r.title)) || [0, bad ? 'swords' : 'star'])[1];
  const left = G.reports.length;
  if (bad) buzz(40);
  let btns = `<button class="btn gold big" onclick="nextReport()">${left ? 'Next' : 'Continue'}</button>`;
  if (r.action && r.action.kind === 'appease' && G.fac[me()].unrest) { const u = G.fac[me()].unrest; btns = `<button class="btn gold" onclick="doAppease()" ${G.fac[me()].gold >= u.cost ? '' : 'disabled'}><span class="lbl">${ico('coin')}Buy them off · ${u.cost} d</span></button><button class="btn" onclick="nextReport();goProv('${u.seed}')"><span class="lbl">${ico('eye')}Send an army</span></button><button class="btn ghost" onclick="nextReport()">Decide later</button>`; }
  if (r.action && r.action.kind === 'raid' && G.raid) btns = raidButtons();
  if (r.action && typeof powerButtons === 'function') { const pb = powerButtons(r.action); if (pb) btns = pb; }
  if (r.action && r.action.kind === 'diplo' && G.diplo && G.diplo.id === r.action.id) btns = `<button class="btn gold" onclick="doDiplo('${r.action.id}',true)">Accept</button><button class="btn" onclick="doDiplo('${r.action.id}',false)">Decline</button><button class="btn ghost" onclick="nextReport()">Decide later</button>`;
  showModal(`<div class="rep${bad ? ' badrep' : ''}">${left ? `<div class="count">${left} MORE</div>` : ''}<div class="ribbon">${esc(dateStr(G.turn))}</div><div class="sealmark">${ico(icon)}</div><h2>${r.title}</h2><p>${r.body}</p><div class="row ctr">${btns}</div></div>`);
}
function nextReport() { $('#modal').classList.add('hidden'); showReports(); }

// ================= COURT =================
function openCourt() {
  const F = G.fac[me()];
  const stat = g => genSummary(g).split(' · ').map(s => `<span class="tag">${s}</span>`).join('');
  const slots = ARMY_IDS.map(id => { const a = army(me(), id), st = slotState(a), g = genAt(me(), id); return `<span class="tag${st === 'active' ? ' on' : st === 'locked' ? ' red' : ''}">${ARMY_NUM(a)}: ${st === 'locked' ? (id === 'a1' ? 'needs 8 counties' : 'needs a crown') : g ? g.n.split(' ')[0] : id === 'a0' ? 'the lord' : 'empty'}</span>`; }).join('');
  const postOpts = g => { const o = []; const slot = emptyArmySlot(me()); if (slot && g.at !== slot) o.push([slot, `Lead ${armyLabel(me(), army(me(), slot)).toLowerCase()}`]); if (g.at !== 'a0' && !genAt(me(), 'a0')) o.push(['a0', "Ride with the lord's host"]); for (const p of owned(me()).filter(q => q.b.castle && !genAt(me(), q.id)).slice(0, 4)) o.push([p.id, `Castle at ${p.name}`]); return o; };
  const hired = F.gens.map(g => { const d = GENMAP[g.id]; const opts = postOpts(g); return `<div class="gen on"><div class="gname">${ico('fleur')} ${d.n}</div><div class="sub">${d.d}</div><div class="gstats">${stat(d)}</div><div class="sub">${genPost(me(), g)[0].toUpperCase() + genPost(me(), g).slice(1)}</div>${opts.length ? `<div class="row" style="margin-top:4px">${opts.map(([at, l]) => `<button class="btn sm" onclick="doPost('${g.id}','${at}')">${l}</button>`).join('')}</div>` : ''}</div>`; }).join('') || '<p class="sub">No generals in your service.</p>';
  const pool = G.genPool.map(id => { const d = GENMAP[id]; return `<div class="gen"><div class="gname">${d.n}</div><div class="sub">${d.d}</div><div class="gstats">${stat(d)}</div><button class="btn sm" onclick="doHire('${id}')" ${F.gold >= d.c && F.gens.length < 3 ? '' : 'disabled'}>Hire · ${coin(d.c)}</button></div>`; }).join('') || '<p class="sub">No captains are seeking a lord just now.</p>';
  showModal(`<h2>${ico('fleur')} Your court</h2><p>Your lord leads his own host. A second army needs a general and a realm of 9 counties; a third needs a general and either 25 counties, or the crown and 15 counties. A general may instead ride with the lord's host and lend it his strengths, or command a castle as a strategist. You may keep three. A general who leads a lost army dies with it.</p>
    <p>${slots}</p>
    <h3>In your service <span class="sub" style="text-transform:none;letter-spacing:0">${F.gens.length}/3</span></h3><div class="gens">${hired}</div><h3>Seeking a lord</h3><div class="gens">${pool}</div>`, '', { closable: true });
}
function doPost(gid, at) { if (postGeneral(me(), gid, at)) { sfx('click'); save(); render(); openCourt(); } else toast('That posting is not open'); }
function doHire(id) { if (hireGeneral(me(), id)) { sfx('coin'); buzz(); toast(`${GENMAP[id].n} enters your service`, 'fleur'); save(); render(); openCourt(); } else toast('You need a free place: a castle without a general, or room in the army'); }

// ================= CHURCH =================
const POPE_ICON = { bless: 'bless', merc: 'foot', absolve: 'cross', dispense: 'ring', excom: 'interdict', truce: 'dove', interdict: 'interdict' };
function openPope() {
  const F = G.fac[me()], inf = influence(me());
  const foes = alive().filter(f => f !== me());
  const ch = (a, t) => Math.round(popeChance(me(), a, t) * 100);
  const can = a => !F.popeUsed && F.gold >= popeCost(me(), a);
  const btn = (a, t, label) => `<button class="btn" ${can(a) && (a !== 'absolve' || F.excom) && (a !== 'merc' || !F.captive) ? '' : 'disabled'} onclick="doPope('${a}'${t ? `,'${t}'` : ''})"><span class="lbl">${ico(POPE_ICON[a])}${label || POPE[a].n}</span><small>${popeCost(me(), a)} d · ${ch(a, t)}% · ${POPE[a].d}</small></button>`;
  const sel = G.sel && G.sel[0] === 'p' ? P(G.sel.slice(2)) : null;
  const college = alive().filter(f => G.fac[f].cardinals > 0 || hasRome(f)).map(f => `<span class="tag">${shield(f, 14)} ${FAC(f).name} ${cardsOf(f)}</span>`).join('');
  showModal(`<h2>${ico('church')} The Church</h2>
    <h3>College of Cardinals</h3>
    <div class="bar"><i style="width:${Math.round(inf * 100)}%"></i></div>
    <p>You have <b>${cardsOf(me())}</b> of <b>${totalCards()}</b> cardinals${hasRome(me()) ? ' (including the 6 Roman cardinals that follow whoever holds Rome)' : '. The 6 Roman cardinals follow whoever holds or is allied with Rome'}. Your influence with the Pope: <b>${Math.round(inf * 100)}%</b>.${popeIsYours(me()) ? ' <span class="good">The Pope is your man: every petition succeeds at half price.</span>' : ' Hold more than half the college and the Pope is your man.'}</p>
    <p>${college || '<span class="sub">No house has a cardinal yet.</span>'}</p>
    <h3>Council of bishops</h3>
    <p>${F.bishops} bishop${F.bishops === 1 ? '' : 's'} sit in your council. Each makes petitions a little likelier, helps marriages, and two or more tend the sick when plague strikes. Raise bishops at any castle.</p>
    <button class="btn gold" onclick="doPromote()" ${F.bishops > 0 && F.gold >= CARD_COST ? '' : 'disabled'}><span class="lbl">${ico('bishop')}Raise a bishop to cardinal</span><small>${CARD_COST} d · +1 vote in the college</small></button>
    <h3>Petition the Pope</h3><p class="sub">One petition a turn. The chance shown depends on your share of the college; gifts are not returned if he refuses.${F.popeUsed ? ' <span class="bad">You have already petitioned this turn.</span>' : ''}</p>
    <div class="grid2">${btn('bless')}${btn('merc')}${btn('dispense')}${btn('absolve')}</div>
    <h3>Against a rival house</h3>
    <div class="gens">${foes.map(f => `<div class="gen"><div class="gname">${shield(f, 16)} ${FAC(f).name}${G.fac[f].excom ? ' <span class="bad">(excommunicated)</span>' : ''}${atPeace(me(), f) ? ' <span class="sub">(at peace)</span>' : ''}</div><div class="grid2">${btn('excom', f)}${btn('truce', f)}</div></div>`).join('')}</div>
    <h3>Interdict</h3>
    ${sel && sel.owner && sel.owner !== me() ? btn('interdict', sel.id, `Interdict ${sel.name}`) : '<p class="sub">Select an enemy county on the map, then open the Church to lay it under interdict.</p>'}`, '', { closable: true });
}
function doPromote() { if (promote(me())) { sfx('bell'); toast('A new cardinal in Rome', 'bishop'); save(); render(); openPope(); } }
function doPope(a, t) { tutorDid('pope'); const r = papal(me(), a, t); closeModal(); if (r) { sfx('bell'); report('Word from Rome', r); save(); render(); showReports(); } }

// ================= COURTSHIP =================
const CO = { price: 1, protect: false, bishop: false };
function openCourtshipDlg(pid) {
  const p = P(pid), F = G.fac[me()];
  if (!G.court) { if (!openCourtship(me(), p)) return toast('You cannot court this turn'); CO.price = Math.min(1, 3); CO.protect = false; CO.bishop = false; }
  drawCourtship();
}
function drawCourtship(msg) {
  const C = G.court; if (!C) return;
  const p = P(C.p), F = G.fac[me()];
  const o = { price: CO.price, protect: CO.protect, bishop: CO.bishop && F.bishops > 0 };
  const pts = suitPoints(me(), p, o), cost = suitCost(o), best = C.rivals.length ? Math.max(...C.rivals.map(r => r.bid)) : null;
  const ok = pts >= C.floor && (best === null || pts > best), afford = F.gold >= cost;
  const bar = (v, max) => `<div class="bar${v >= C.floor && (best === null || v > best) ? '' : ' red'}" style="height:12px"><i style="width:${pct(v, max)}%"></i></div>`;
  const max = Math.max(C.floor, best || 0, pts) * 1.15;
  showModal(`<h2>${ico('ring')} Courting Lady ${C.lady}</h2><p class="sub">${p.name} · her guardians, ${p.lord}${p.ally ? `, sworn to ${fname(p.ally)}` : ''} · round ${C.round} of 2</p>
    ${msg ? `<div class="notebox bad">${msg}</div>` : ''}
    <h3>Your suit</h3>
    <p>Standing <b>${Math.round(C.prestige)}</b> <span class="sub">(20, +15 per crown, +8 bordering, +15 if sworn to you, −15 if excommunicated, +${Math.min(10, owned(me()).length / 2).toFixed(0)} for the size of the realm)</span></p>
    <div class="grid" style="grid-template-columns:repeat(4,1fr)">${PRICES.map(([c, v], i) => `<button class="btn sm${CO.price === i ? ' on' : ''}" onclick="CO.price=${i};drawCourtship()" ${F.gold >= c ? '' : 'disabled'}><span class="lbl">${i ? ico('coin') : ''}${i ? c + ' d' : 'No price'}</span><small>+${v}</small></button>`).join('')}</div>
    <div class="grid2"><button class="btn sm${CO.protect ? ' on' : ''}" onclick="CO.protect=!CO.protect;drawCourtship()"><span class="lbl">${ico('foot')}Promise of protection</span><small>${PROTECT.c} d and ${PROTECT.men} footmen for her garrison · +${PROTECT.pts}</small></button><button class="btn sm${CO.bishop ? ' on' : ''}" onclick="CO.bishop=!CO.bishop;drawCourtship()" ${F.bishops > 0 ? '' : 'disabled'}><span class="lbl">${ico('bishop')}A bishop blesses the match</span><small>gives up one bishop · +${BISHOP_PTS}</small></button></div>
    <h3>The reckoning</h3>
    <p>Your suit <b>${pts}</b> · costs <b>${cost} d</b>${o.bishop ? ' and a bishop' : ''} <span class="sub">(paid only if she accepts)</span></p>${bar(pts, max)}
    <p>Her guardians' minimum <b>${C.floor}</b></p>${bar(C.floor, max)}
    ${C.rivals.length ? C.rivals.map(r => `<p>${shield(r.fid, 16)} ${FAC(r.fid).name} bids <b>${r.bid}</b></p>${bar(r.bid, max)}`).join('') : '<p class="sub">No rival suitors.</p>'}
    <p class="${ok ? 'good' : 'bad'}">${ok ? 'This suit would win her hand.' : pts < C.floor ? 'Below her guardians\' minimum.' : 'A rival outbids you.'}${C.round === 1 ? ' If it fails you may raise it once.' : ' This is your last offer; if it fails, the best rival may wed her.'}</p>
    <div class="row ctr"><button class="btn gold big" onclick="sendSuit()" ${afford ? '' : 'disabled'}><span class="lbl">${ico('ring')}Send the suit</span></button><button class="btn" onclick="withdrawSuit()">${C.round === 2 ? 'Withdraw (she may wed a rival)' : 'Withdraw'}</button></div>`, '', {});
}
function sendSuit() {
  const F = G.fac[me()]; tutorDid('court');
  const r = courtOffer(me(), { price: CO.price, protect: CO.protect, bishop: CO.bishop && F.bishops > 0 });
  if (!r) return closeModal();
  if (!r.done) { sfx('miss'); return drawCourtship(r.text); }
  closeModal(); sfx(r.ok ? 'bell' : 'miss'); buzz(r.ok ? 40 : 10);
  if (r.ok) flashProv(G.sel && G.sel[0] === 'p' ? G.sel.slice(2) : '');
  report(r.ok ? 'A wedding!' : 'The suit is refused', r.text); save(); render(); showReports();
}
function withdrawSuit() { const C = G.court; if (!C) return closeModal(); if (C.round === 2) { const r = finishCourt(me(), ''); closeModal(); if (r) report('The suit is withdrawn', r.text); } else { cancelCourt(me()); closeModal(); } save(); render(); showReports(); }

// ================= CHRONICLE =================
const LOGF = { f: 'all' };
function openLog() {
  G.unread = 0;
  const cats = { all: ['All', null], war: ['War', /siege|took|attack|storm|battle|rout|relie|fell|fall|sea fight|holds the sea|Bombard|hunger/i], court: ['Court & Church', /Pope|bishop|cardinal|excommunic|interdict|bless|Truce|marr|wed|Lady|son of|pact|alliance|swears|sword to|service/i], realm: ['Realm', /Work begins|completed|Rebellion|revolt|unite|crown|King|plague|Plague|ransom/i] };
  const re = cats[LOGF.f][1];
  const rows = G.log.filter(l => !re || re.test(l.text));
  const html = `<div class="dh"><h2>${ico('scroll')} Chronicle</h2><button class="x" style="position:static" onclick="closeDrawer()">${ico('close')}</button></div>
    <div class="filters">${Object.keys(cats).map(k => `<span class="tag${LOGF.f === k ? ' on' : ''}" onclick="LOGF.f='${k}';openLog()">${cats[k][0]}</span>`).join('')}</div>
    <div class="db log">${rows.length ? rows.map(l => `<div><b>${esc(l.d)}</b><div class="d">${esc(l.text)}</div></div>`).join('') : '<p class="sub">Nothing recorded yet.</p>'}</div>`;
  openDrawer(html); renderDock(); renderHeader();
}

// ================= SETTINGS =================
const APP_VERSION = '6.40';
function openSettings() {
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, l, i]) => `<button class="${SET[key] === v ? 'on' : ''}" onclick="setOpt('${key}','${v}')">${ico(i)}${l}</button>`).join('')}</div>`;
  const sw = key => `<div class="sw${SET[key] ? ' on' : ''}" onclick="setOpt('${key}',${!SET[key]})"></div>`;
  const vol = key => `<div class="setrow volrow"><div class="l"><small>Volume</small></div><input type="range" min="0" max="100" step="5" value="${Math.round(volOf(key) * 100)}" aria-label="${key === 'musicVol' ? 'Music' : 'Effects'} volume" oninput="SET.${key}=this.value/100;sndVolumes()" onchange="saveSettings();${key === 'sfxVol' ? "sfx('coin')" : ''}"></div>`;
  showModal(`<h2>${ico('gear')} Settings</h2>
    <div class="setrow"><div class="l">Layout<small>Phone: map with a sliding sheet. Desktop: map with a sidebar.</small></div>${seg('layout', [['auto', 'Auto', 'auto'], ['phone', 'Phone', 'phone'], ['desktop', 'Desktop', 'desktop']])}</div>
    <div class="setrow"><div class="l">Music<small>Composed as you play: an air for each season, and others for war, the fair, the siege and the crown</small></div>${sw('music')}</div>
    ${SET.music ? vol('musicVol') : ''}
    <div class="setrow"><div class="l">Sound effects<small>Stones, fire, rats, bells, horns, the march and the hammer</small></div>${sw('sfxOn')}</div>
    ${SET.sfxOn ? vol('sfxVol') : ''}
    ${STORE.on ? `<div class="setrow"><div class="l">The full game<small>${fullGame() ? 'Unlocked. Thank you.' : 'Free to start: three houses on the gentle setting'}</small></div>${fullGame() ? `<button class="btn sm" onclick="restorePurchases()">Restore</button>` : `<button class="btn sm gold" onclick="openUnlock()">Unlock</button>`}</div>` : ''}
    <div class="setrow"><div class="l">Tips for new players<small>Short hints on your first turns</small></div>${sw('hints')}</div>
    <div class="setrow"><div class="l">End-of-turn reminder<small>Warn when the army is idle or gold lies unspent</small></div>${sw('confirmEnd')}</div>
    <div class="setrow"><div class="l">Animations<small>Map movement and turn transitions</small></div>${sw('motion')}</div>
    <div class="setrow"><div class="l">Rival moves<small>After you end a turn, show the other houses' marches, sieges and conquests on the map</small></div>${seg('replay', [['near', 'Near me', 'home'], ['all', 'All', 'map'], ['off', 'Off', 'close']])}</div>
    <div class="setrow" style="flex-direction:column;align-items:stretch"><div class="l">The rival houses<small>How eagerly the computer houses turn on you. Takes effect from the next turn. A game counts, for trophies and points, as the easiest setting it was ever played on.</small></div>${diffSeg()}</div>
    <div class="setrow"><div class="l">Battle speed</div>${seg('speed', [[1, '1×', 'next'], [2, '2×', 'speed'], [4, '4×', 'skip']])}</div>
    <div class="row"><button class="btn sm" onclick="openSaves()"><span class="lbl">${ico('scroll')}Saved games</span></button><button class="btn sm" onclick="closeModal();openHelp()"><span class="lbl">${ico('info')}How to play</span></button><button class="btn sm ghost" onclick="SET.seenHints={};saveSettings();toast('Tips will show again')">Reset tips</button>${G ? `<button class="btn sm ghost" onclick="closeModal();confirmNew()">New game</button>` : ''}</div>
    <p class="sub ctr" style="margin-top:12px">Add this page to your home screen for a full-screen game that also plays offline.</p>
    <p class="sub ctr" style="font-size:13px">Anointed · ${SC.name} · version ${APP_VERSION}<br>Your campaigns, trophies and settings are kept only on this device. The game collects nothing and sends nothing anywhere. <a href="privacy.html" target="_blank" style="color:inherit">Privacy and support</a>. Export a save now and then: it carries your trophies and past games with it.</p>`, '', { closable: true });
}
function setOpt(k, v) {
  if (k === 'speed') v = Number(v);
  SET[k] = v; saveSettings();
  if (k === 'layout') { applyLayout(); if (G) { render(); if (isPhone()) setSheet('peek'); } }
  if (k === 'music' || k === 'sfxOn') applySound();
  if (k === 'motion') document.body.classList.toggle('nomotion', !SET.motion);
  openSettings();
}
function applySound() {
  const want = SET.music || SET.sfxOn;
  if (want !== SND.on) sndToggle();
  sndVolumes();
  if (SND.ctx) { if (SET.music) setMusic(SND.want); else stopMusic(); }
}
function toggleSound() { SET.music = SET.sfxOn = !(SET.music || SET.sfxOn); saveSettings(); sndUnlock(); applySound(); toast(SET.music ? 'Sound on' : 'Sound off', SET.music ? 'sound' : 'mute'); }

// ================= CODEX (help) =================
const HELP = { tab: 'goal' };
function openHelp() {
  const rows = ['foot', 'bow', 'cav', 'cat'].map(t => `<tr><td>${ico(UNIT_ICON[t])} ${UNIT[t].n}</td><td>${UNIT[t].c} d</td><td>${UNIT[t].atk || '–'}</td><td>${UNIT[t].rng || '–'}</td><td>${UNIT[t].chg || '–'}</td><td>${UNIT[t].hp || '–'}</td></tr>`).join('');
  const T = {
    goal: `${SC.help.top}
      <p><b>The goal.</b> You choose it when you raise your banner. <i>${SC.crown.title}</i>: wear the crown, or hold the places a king is made in, with half of the kingdom's counties in your own hands and no rival house holding more than a quarter of them. You are crowned as you win; you need not hold the coronation first. Paying for it earlier gives you the king's strength while you fight on. <i>Full conquest</i>: break every rival house. The first house to reach the goal wins, and the last house standing always wins.</p>
      <p><b>The crown.</b> ${SC.crown.rule()} The king's counties in the kingdom pay +1 d and raise double levies, his host fights 10% harder, and with ${KING_ARMY3} counties he may field a third army. Whoever takes the places a king needs can take the crown from him.</p>
      <p><b>How the houses feel about you.</b> Each house's mood runs from hostile to friendly, shown on its Envoys tab with the reasons: attacks on it (a grudge that fades over a few years), how much of the kingdom you hold, your armies at its border, the crown, a pact or alliance, or an enemy you both fight. A hostile house attacks you more readily and asks more for a pact; a friendly one leaves you alone and signs cheaply. The second bar shows where things stand: at war (you have fought in the last two years), no pact, pact or allied.</p>
      <p><b>Pacts and alliances.</b> Every house plays for the crown. Open Envoys to sign a pact of peace (2 or 3 years) that neither side can break, an alliance that also lets your armies march through each other's lands, or a war alliance that turns another house on a third. A house that gains from it asks nothing; a reluctant one names its price in silver, or takes a county instead; a hostile one refuses.</p>
      ${SC.help.sea}
      <p><b>Distance.</b> A prince's power fades with distance. Counties more than three steps from his seat pay less, and far-flung realms breed unrest sooner. ${SC.help.rich || ''}</p>
      <p><b>The league.</b> If one house holds more than a quarter of the kingdom, the princes may league against it for three years.</p>
      <p><b>The fall of a house.</b> Take a house's seat (${ico('crown')}) and you win it and every county of theirs beside it. If the house still holds four connected counties, an heir rallies there once. Fragments go to independent castellans.</p>
      <p><b>Ranks and trophies.</b> Every game you finish earns points, and ${TROPHIES.length} trophies earn more. Points raise you from Seigneur through Baron, Viscount, Count, Marquis, Duke and King to Emperor; each rank unlocks something for your coat of arms (a crown, supporters, laurels, a mantle), shown on the title screen and around your house's shield in a game. Design your arms under Medals and arms on the title screen. The Chronicler's Challenge on the title screen gives everyone the same start for a while, so you can compare results.</p>
      ${SC.help.peace()}
      <p><b>A turn.</b> Build and raise troops, march your armies (${MOVES} counties each through your own and allied land, or ${MOVES + FORCED} by a forced march that leaves the army unable to attack that turn), strike with each army once, petition the Pope once, court one lady. Then end the turn and the other houses move.</p>`,
    powers: `${SC.help.powers}`,
    war: `<p><b>Armies.</b> Your lord leads his own host. A second army needs a general and a realm of 9 counties; a third needs a general and either 25 counties, or the crown and 15 counties. Each army marches up to ${MOVES} counties a turn, then strikes a county bordering its position. If the lord's host is destroyed he is captured, and even if some of his men get away, a lord whose host is badly beaten may be taken in the rout. If a general's army is destroyed, the general dies. Two of your armies in the same county can trade men directly on the Army tab. From there you can also change an army's general, or disband an army: its men join the garrison if there is a castle, and its general goes to a castle of yours.</p>
      <p><b>Pay.</b> Garrisons cost nothing. An army that has spent a full turn without marching or fighting, in a castle of yours, is lodged with the garrison for free. Armies on campaign are paid every turn: footmen and bowmen ${UPKEEP.foot} d, cavalry ${UPKEEP.cav} d, catapults ${UPKEEP.cat} d. If the treasury runs dry, every army loses 15% of its men. Realms above 20 counties yield a little less for each county beyond.</p>
      <p><b>Troops.</b> Each company:</p>
      <table class="stat"><tr><th></th><th>Cost</th><th>Atk</th><th>Range</th><th>Charge</th><th>HP</th></tr>${rows}<tr><td>${ico('militia')} Levy</td><td>free</td><td>${LEVY.atk}</td><td>–</td><td>–</td><td>${LEVY.hp}</td></tr></table>
      <p><b>Battle.</b> Bowmen wear the enemy down as the lines close. The horse fight on the wings; the winners ride round and strike the enemy rear, which can break an army. Footmen in a <i>defensive</i> stance lock a shield wall that blunts arrows and cavalry; in an <i>aggressive</i> stance they advance as a deep line and hit harder. A <i>balanced</i> host outflanks a static shield wall.</p>
      <p><b>Horse orders.</b> While your horse still hold, you may send them at the enemy horse (the usual charge), at the enemy bowmen (a raid; if the enemy horse are holding they intercept), or round to the rear (if the enemy horse are holding they intercept at a heavier charge). Leave the buttons alone and your horse charge as the lines close.</p>
      <p><b>The reserve.</b> An army of 9 or more may hold back a third of its foot and bowmen. Commit them when the moment is right for a surge of +15% attack; a reserve never committed halves the losses of a beaten army and comes home intact. Reserve bowmen still shoot from behind the line.</p>
      <p><b>Battles and sieges, quickly.</b> Every battle can be auto-resolved from the pre-battle screen, and a siege can be auto-bombarded: the same rules, without the scene.</p>
      <p><b>Mining.</b> Instead of bombarding, an army of 4 or more footmen can dig a mine under the walls: steer the tunnel along the foundations, clear of rock, water and counter-mines. It brings down a section of wall whatever the walls are made of, so it is the better tool against stone.</p>
      <p><b>Castles.</b> A wooden castle goes up in a single turn for 35 d: a quick foothold, but its palisade barely slows an assault. Raise it to stone (3 turns) and great walls (4 turns), and dig a moat. Damaged walls mend by 10% a turn when no enemy is camped outside. If the inner walls are battered below 20%, the castle falls into ruin and must be rebuilt for silver. A house's seat has two rings of walls: the outer wall must fall before the inner walls can be breached. Walls make defenders far stronger, and catapults in a garrison shoot from them. Bombard to break them: one heavy stone breaks any wall; 3 light stones tear through wood but only chip stone and bounce off great walls. Flaming oil burns the men inside, as one big pot or 3 small ones; standing walls shelter them, and each pot does a little less as the defenders ready sand and water, so break the walls first. Greek fire, bought by the jar on an army's Raise tab (60 d from Venetian traders, 25 d if Theophylact the Greek leads the army, at most 3), is the most terrible weapon in the siege train: against a wall it brings down a whole stretch and the men on it; thrown over the walls it burns about a third of the garrison, and water only spreads it; but each throw has a one-in-three chance of burning the catapult that throws it. Plague rats keep biting them while the bombardment goes on; they are scarcer, one cage per catapult and one more, and a cage holds a swarm or a giant rat. An army sheltering inside a castle joins its defence when the walls are stormed, suffers from fire and rats with the garrison, and can sally out to break the siege. Walls still standing protect the defenders in a storm in proportion to what is left of them. A capital's household grows back each turn it is not besieged. If the walls fall completely, the castle is ruined: its upgrades are lost and it must be rebuilt.</p>
      <p><b>War buildings.</b> One forge (+15% hit points), one armory (+15% attack) and one royal stables (+25% cavalry) serve your whole realm.</p>
      <p><b>Captured lords.</b> If your lord's host is destroyed, or badly beaten, he may be captured, and his host cannot take the field. Any men who escaped go to the nearest garrison. His captor may hold him up to three turns: a ransom after one turn costs twice your income, after two your full income, then half, and after three turns it must be accepted. Your generals' armies fight on.</p>`,
    court: `<p><b>Unrest.</b> Large realms breed unrest, sooner if they sprawl far from the seat. When the lords around a far county mutter, you have two turns to put an army of at least 8 men in that county or buy them off (40 d + 4 per county). Otherwise a son or great vassal rises and carries a quarter of the realm with him.</p>
      <p><b>Courtship.</b> To win an heiress (${ico('ring')}) you make a suit: your standing, a bride price, a promise of protection (footmen for her garrison) and a bishop's blessing. Her guardians set a minimum; rival houses may bid. If outbid you may raise once. A son is spent only when she accepts. One courtship a turn.</p>

      <p><b>Envoys.</b> Computer houses send envoys: a marriage from a weaker neighbour (peace for ${PACT_TURNS} turns), or a joint war against a house that threatens you both (peace between you for ${JOINT_TURNS} turns while they attack it). An envoy waits until the end of your turn. The same two houses cannot renew a truce or pact within ${TRUCE_COOL} turns of the last one lapsing.</p>
      <p><b>The Church.</b> Bishops sit in your council; raise them to cardinal to win votes in the college. Your share of the college decides how often the Pope agrees: blessings, mercenaries, absolution, dispensations, excommunication, a Truce of God or an interdict.</p>
      <p><b>Forged charters.</b> With a bishop in your council, your scriptorium can forge an old charter for a lesser lord who borders you (25 d, once every 4 turns). Trace the old hand and press the seal at the right moment: a good copy makes him swear to you for nothing; a poor one may be exposed, and the Pope excommunicates you.</p>
      <p><b>Ransoms.</b> When your lord is a prisoner, his captor's envoy names a price you can haggle down. When you hold a prisoner, you can haggle his house up. Push too hard and the envoy rides home for the turn.</p>
      <p><b>The fair at Troyes.</b> Each summer, if you hold a market town, your carts go to Troyes with what your lands produce: grain and wool from farms, cloth from market towns, metal from mines, salt and fish from ports. Each building level is a lot to sell, higher levels bring finer goods, and each extra kind of goods draws 10% more buyers. Over three days, sell each kind when the price is good; the merchants' word on tomorrow is usually right. Champagne sells for 40% more and always hears the truth.</p>
      <p><b>Raiders.</b> Danish longships sometimes fall on a coastal county. Meet them on the beach yourself, leave it to the garrison, or pay them to go.</p>
      <p><b>Minor lords and generals.</b> Ally with minor lords for half their income; your armies march through their land. Generals lead your armies or command a castle.</p>`,
    map: `<p><b>Reading the map.</b></p>
      <p>${ico('crown')} a house's seat · ${ico('ring')} an heiress of marrying age · ${ico('hammer')} building under way · ${ico('skull')} plague · ${ico('interdict')} under interdict · ${ico('fleur')} a general in command · ${ico('fire')} unrest.</p>
      <p>Every army is a banner with its strength; your banners carry their number, and the one you command wears a gold ring. A tent beside a banner marks a siege. Diagonal hatching marks a minor lord sworn to a house. The grey hatched lands at the edges are outside powers, not for conquest. Chevrons mark hill country, where mines can be dug.</p>
      <p>A thick coloured outline marks your own holdings; a blue outline marks an ally's lands, and a dashed green one a house you have a pact with. Green dots mark where the chosen army can march this turn; red dashes mark what it can strike.</p>
      <p><b>Controls.</b> Tap to select. Drag to pan, pinch or scroll to zoom, double-tap to zoom in. The army tabs over the map switch which army you command. On a phone, drag the sheet up for the full county page; the main action always sits at its foot.</p>
      <p><b>Rival moves.</b> After you end a turn, the marches, sieges and conquests of the houses near you are drawn on the map, one house at a time. Tap to skip, or change it in Settings (near me, all, or off).</p>
      <p><b>Saved games.</b> The game saves itself after every move. Settings, the realm panel and the title screen also have three save slots, and you can export a campaign as a file or a code to back it up or move it to another device.</p>
      <p><b>Keyboard.</b> <span class="kbd">Enter</span> or <span class="kbd">E</span> end turn. Tap the treasury at the top for income and upkeep line by line, and the peace or war badge, or You in the diplomacy screen, for all your relations at a glance · <span class="kbd">H</span> my lands · <span class="kbd">L</span> chronicle · <span class="kbd">C</span> court · <span class="kbd">1</span>–<span class="kbd">3</span> choose an army · <span class="kbd">+</span>/<span class="kbd">−</span> zoom · <span class="kbd">Esc</span> back.</p>`,
  };
  const tabs = [['goal', 'The game', 'crown'], ['war', 'War', 'swords'], ['court', 'Court', 'church'], ['powers', 'Beyond', 'flag'], ['map', 'Map', 'map']];
  showModal(`<h2>${ico('info')} How to play</h2><div class="tabs">${tabs.map(([id, n, i]) => `<button class="${HELP.tab === id ? 'on' : ''}" onclick="HELP.tab='${id}';openHelp()">${ico(i)}${n}</button>`).join('')}</div>${T[HELP.tab]}
    <div class="row ctr"><button class="btn gold" onclick="closeModal()">${G ? 'To war' : 'Close'}</button></div>`, '', { closable: true });
}
const setGoal = () => GOALS[SET.goal] ? SET.goal : 'king';
function goalSeg() {
  const cur = setGoal();
  return `<div class="seg" style="display:flex">${Object.keys(GOALS).map(k => `<button class="${cur === k ? 'on' : ''}" style="flex:1" onclick="SET.goal='${k}';saveSettings();document.getElementById('goald').textContent=GOALS['${k}'].d;this.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===this))">${GOALS[k].n}<br><small style="font-family:var(--body);font-weight:400">${GOALS[k].s}</small></button>`).join('')}</div><p class="sub" id="goald" style="min-height:40px">${GOALS[cur].d}</p>`;
}
function confirmNew() { showModal(`<div class="rep"><div class="sealmark badrep">${ico('flag')}</div><h2>Abandon this war?</h2><p class="ctr">Your campaign will be lost.</p><div class="grid2"><button class="btn red" onclick="clearSave();closeModal();showTitle()">New game</button><button class="btn" onclick="closeModal()">Cancel</button></div></div>`); }
function gameOver() {
  const won = G.winner === me(), lastStanding = alive().length === 1;
  if (won && lastStanding && !wears(me()) && !G.crownedShown) { G.crownedShown = true; return showCoronation(me(), 'franks', () => gameOver()); }
  clearSave(); sfx(won ? 'victory' : 'defeat');
  const W = G.winner ? FAC(G.winner) : null;
  const wonTxt = lastStanding ? `In ${dateStr(G.turn)}, the last rival house falls. ${SC.crown.span}, no prince stands against ${FAC(me()).pname}. He is king of ${SC.crown.people} in name and in fact.`
    : `In ${dateStr(G.turn)}, ${FAC(me()).pname} wears ${SC.crown.the} and holds half the kingdom in his own hand, and no prince is left who can stand against him. ${SC.crown.rules || ''}`;
  showModal(`<div class="rep${won ? '' : ' badrep'}"><div class="sealmark">${ico(won ? 'crown' : 'swords')}</div><h2>${won ? SC.crown.rex : W ? `${W.name} rules ${SC.crown.people}` : 'Your house has fallen'}</h2>
    <p>${won ? wonTxt : W ? `${W.pname} ${alive().length === 1 ? 'has broken every rival house' : 'wears the crown and holds half the kingdom'}.` : `${rulerOf(me())}'s line is broken. Another will take the kingdom.`}</p>
    <p class="sub ctr">${dateStr(G.turn)} · ${G.turn} turns</p>
    <div class="row ctr"><button class="btn gold big" onclick="closeModal();showTitle()">Play again</button></div></div>`);
}

// ================= TITLE =================
// the maps, side by side on the title screen
function mapPicker() {
  const ms = Object.values(MAPS); if (ms.length < 2) return '';
  return `<div class="mappick">${ms.map(m => `<button class="mp${m.id === MAP_ID ? ' on' : ''}" onclick="pickMap('${m.id}')">${m.FACTIONS.slice(0, 3).map(f => armsSvg(f.arms, 22)).join('')}<span class="t"><b>${esc(m.name)}</b><small>${esc(m.sub)}</small></span>${mapLocked(m.id) ? `<span class="lockb">${ico('lock')}Expansion</span>` : m.id === MAP_ID ? '<span class="lockb free">Playing</span>' : ''}</button>`).join('')}</div>`;
}
function pickMap(id) { if (id === MAP_ID) return; if (mapLocked(id)) return openMapUnlock(id); sfx('click'); switchMap(id); }
function oldCampaign() { try { const o = localStorage.getItem('crownOfTheFranks987v7'); if (o && !JSON.parse(o).over) return true; for (let n = 1; n <= SLOTS; n++) { const s = readSlot(n); if (s && s.game && s.game.v === 7) return true; } } catch (e) { } return false; }
function showTitle() {
  const s = loadSave();
  const t = $('#title'); t.style.display = 'block'; setMusic('title');
  const card = f => `<div class="fcard${houseLocked(f.id) ? ' locked' : ''}" style="--c:${f.color}" onclick="openFaction('${f.id}')">${houseLocked(f.id) ? `<span class="lockb">${ico('lock')}Full game</span>` : STORE.on && !fullGame() ? '<span class="lockb free">Free</span>' : ''}${shield(f.id, 46)}<div style="min-width:0"><h3>${f.name}</h3><div class="r">${f.title} ${f.pname}</div><div class="b">${f.blurb}</div><div class="tr">${ico('star')}<span>${f.trait}</span></div></div></div>`;
  t.innerHTML = `<div class="tbg">${titleMap()}</div><div class="inner"><div class="hero">${titlePennant('l')}${titlePennant('r')}${titleCrown()}<div class="ad">ANNO DOMINI ${SC.date.roman}</div><h1 class="gild">Anointed</h1><div class="gsub">${SC.game}</div><div class="orn">❦</div></div>
    <div id="titlerank">${rankBox()}</div>
    ${mapPicker()}
    <p class="lead">${SC.intro.lead}</p>
    ${oldCampaign() ? `<div class="notebox" style="color:var(--ink,#2a1d12)">${ico('scroll')} A campaign from the old map of Europe is saved on this device. It plays on in <a href="https://jdc001.github.io/Emperor-1000/" style="color:inherit;font-weight:700">Emperor: 1000 AD</a>, which picks it up by itself.</div>` : ''}
    ${s && !s.over && s.v === 8 ? `<div class="contbox"><button class="btn gold big" onclick="continueGame()"><span class="lbl">${shield(s.player, 20)} Continue as ${s.fdefs.find(d => d.id === s.player).name}</span><small>${dateStr(s.turn)} · ${s.fdefs.filter(d => s.fac[d.id].alive).length - 1} rivals left</small></button></div>` : ''}
    ${anySlot() ? `<div class="row ctr" style="margin:6px 0 10px"><button class="btn" onclick="openSaves()"><span class="lbl">${ico('chest')}Load a saved game</span></button></div>` : ''}
    ${!fullGame() ? `<div class="row ctr" style="margin:6px 0 4px"><button class="btn gold" onclick="openUnlock()"><span class="lbl">${ico('crown')}Unlock the full game</span><small>all fifteen houses, every difficulty, the challenges</small></button></div>` : ''}
    ${challengeBox()}
    ${SC.groups.map(([h, ids]) => `<h2>${h}</h2><div class="facs">${FACTIONS.filter(f => ids ? ids.includes(f.id) : !SC.groups.some(g => g[1] && g[1].includes(f.id))).map(card).join('')}</div>`).join('')}
    <p class="ctr" style="color:#d9c9a3;font-style:italic;margin-top:18px">New games: ${GOALS[setGoal()].n.toLowerCase()} · ${DIFF[SET.diff || 'gentle'].n.toLowerCase()} rivals · change them on a house's page</p>
    <div class="foot"><button onclick="openSaves()">Saved games</button><button onclick="openHelp()">How to play</button><button onclick="openSettings()">Settings</button><span>Tap anywhere for sound</span></div>
    <p class="ctr" style="color:#e9d9ae;font-size:13px;letter-spacing:.06em;margin-top:10px;text-shadow:0 1px 2px #000">Version ${APP_VERSION}</p></div>`;
}
function diffSeg() {
  const cur = SET.diff || 'gentle';
  return `<div class="seg" style="display:flex">${Object.keys(DIFF).map(k => diffLocked(k) ? `<button style="flex:1;opacity:.6" onclick="openUnlock('diff')">${ico('lock')}${DIFF[k].n}</button>` : `<button class="${cur === k ? 'on' : ''}" style="flex:1" onclick="SET.diff='${k}';saveSettings();if(G){G.diff='${k}';noteDiff();}document.getElementById('diffd').textContent=DIFF['${k}'].d;this.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===this))">${DIFF[k].n}</button>`).join('')}</div><p class="sub" id="diffd" style="min-height:40px">${DIFF[cur].d}</p>`;
}
function openFaction(fid) {
  if (houseLocked(fid)) return openUnlock(fid);
  if (diffLocked(SET.diff || 'gentle')) SET.diff = 'gentle';
  const f = FACMAP[fid], home = PROV.find(r => r[0] === f.home);
  const lands = PROV.filter(r => r[7] === fid).map(r => r[1]);
  sfx('click');
  showModal(`<div class="facsheet"><div class="top">${shield(fid, 64)}<div><div class="sub">${SC.houseOf(f)}</div><h2>${f.name}</h2><div class="sub">${f.title} ${f.pname}</div></div></div>
    <div class="mini">${miniMap(fid)}</div>
    <p>${f.blurb}</p>
    <div class="notebox good">${ico('star')} <b>House trait.</b> ${f.trait}</div>
    <p class="sub">Seat at <b>${home[1]}</b>. Starting lands: ${lands.join(', ')}. ${SC.where(fid)}</p>
    <div class="setrow"><div class="l">Guided first campaign<small>One objective at a time, with a hint, for your first few years</small></div><div class="sw${SET.guided !== false ? ' on' : ''}" onclick="SET.guided=!(SET.guided!==false);saveSettings();this.classList.toggle('on',SET.guided)"></div></div>
    <h3>Your goal</h3>${goalSeg()}
    <h3>The rival houses</h3>${diffSeg()}
    <div class="row ctr"><button class="btn gold big" onclick="closeModal();startGame('${fid}')"><span class="lbl">${ico('flag')}Raise the banner of ${f.name}</span></button></div></div>`, '', { closable: true });
}
function startGame(fid) { sndUnlock(); newGame(fid); G.diff = SET.diff || 'gentle'; noteDiff(); G.goal = setGoal(); G.tut = SET.guided !== false ? { i: 0, did: {} } : null; $('#title').style.display = 'none'; setMusic('map'); applyLayout(); save(); render(); homeView(false); if (isPhone()) setSheet('peek'); showIntro(fid); }
function continueGame() { sndUnlock(); G = loadSave(); if (!G || G.v !== 8) { G = null; return showTitle(); } rebuildFmap(); ensureProvs(); if (!G.army) G.army = 'a0'; $('#title').style.display = 'none'; setMusic('map'); applyLayout(); render(); homeView(false); if (isPhone()) setSheet('peek'); }

// ================= SPLASH SCENES =================
const LATIN = { franks: 'REX FRANCORUM', english: 'REX ANGLORUM', germans: 'REX TEUTONICORUM', italians: 'REX ITALIAE', danes: 'REX DANORUM', emperor: 'IMPERATOR AUGUSTUS' };
function embedShield(fid, x, y, size, flag) { return `<g transform="translate(${x},${y})">${shield(fid, size, flag)}</g>`; }
function frame(inner, w = 600, h = 400) {
  return `<svg class="scene" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="diap" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#c9952e"/><path d="M11 0 L22 11 L11 22 L0 11Z" fill="#d9aa45"/><circle cx="11" cy="11" r="2" fill="#a8761c"/></pattern>
    <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a6f9a"/><stop offset=".55" stop-color="#e9b77a"/><stop offset="1" stop-color="#f3d9a4"/></linearGradient></defs>
    ${inner}
    <rect x="4" y="4" width="${w - 8}" height="${h - 8}" fill="none" stroke="#8e1f1b" stroke-width="6"/><rect x="12" y="12" width="${w - 24}" height="${h - 24}" fill="none" stroke="#e2b33c" stroke-width="2"/>
    ${[[16, 16], [w - 16, 16], [16, h - 16], [w - 16, h - 16]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="9" fill="#23407a" stroke="#e2b33c" stroke-width="2"/>`).join('')}</svg>`;
}
function figurePerson(x, y, robe, mantle, s = 1, kneel) {
  return `<g transform="translate(${x},${y}) scale(${s})">${kneel
    ? `<path d="M-22,0 Q-24,-34 -8,-48 L10,-48 Q20,-30 30,-6 L34,0Z" fill="${robe}" stroke="#2a1d12" stroke-width="1.5"/><path d="M-26,0 Q-30,-40 -6,-52 L4,-50 Q-14,-30 -8,0Z" fill="${mantle}" stroke="#2a1d12" stroke-width="1.2"/><circle cx="12" cy="-56" r="9" fill="#e7c9a3" stroke="#2a1d12" stroke-width="1.2"/><path d="M18,-40 L30,-34" stroke="#e7c9a3" stroke-width="5" stroke-linecap="round"/>`
    : `<path d="M-18,0 L-12,-70 Q0,-80 12,-70 L18,0Z" fill="${robe}" stroke="#2a1d12" stroke-width="1.5"/><path d="M-20,0 L-14,-64 Q-4,-60 0,-40 L4,0Z" fill="${mantle}" stroke="#2a1d12" stroke-width="1.2"/><circle cx="0" cy="-80" r="9" fill="#e7c9a3" stroke="#2a1d12" stroke-width="1.2"/>`}</g>`;
}
function introScene(fid) {
  const col = FAC(fid).color;
  const riders = Array.from({ length: 9 }, (_, i) => { const x = 120 + i * 34 + (i % 2) * 8, y = 318 + (i % 3) * 6; return `<g transform="translate(${x},${y})"><ellipse cx="0" cy="0" rx="13" ry="6" fill="#3a2a1a"/><path d="M8,-3 l8,-6 l2,4z" fill="#3a2a1a"/><rect x="-3" y="-16" width="6" height="12" fill="${col}"/><circle cx="0" cy="-19" r="3.5" fill="#d9c09a"/><line x1="-2" y1="-12" x2="18" y2="-40" stroke="#2a1d12" stroke-width="1.6"/>${i % 3 === 0 ? `<path d="M18,-40 l10,3 l-10,4z" fill="${col}"/>` : ''}<path d="M-8,5 l-2,9 M8,5 l2,9" stroke="#3a2a1a" stroke-width="2"/></g>`; }).join('');
  return frame(`<rect width="600" height="400" fill="url(#dawn)"/><circle cx="470" cy="150" r="34" fill="#fbe3a6" opacity=".9"/>
    <path d="M18,250 Q150,190 300,236 T582,214 V382 H18Z" fill="#8a8a5a"/><path d="M18,300 Q200,260 380,296 T582,288 V382 H18Z" fill="#6f7a43"/>
    <g transform="translate(300,196)"><path d="M-70,44 V-6 H-58 V-18 H-46 V-6 H-30 V-40 H-20 V-52 H-8 V-40 H8 V-52 H20 V-40 H30 V-6 H46 V-18 H58 V-6 H70 V44Z" fill="#7d7363" stroke="#3a3226" stroke-width="2"/><path d="M-8,44 V28 a8,8 0 0 1 16,0 V44Z" fill="#3a3226"/><line x1="0" y1="-52" x2="0" y2="-96" stroke="#2a1d12" stroke-width="2.5"/></g>
    ${embedShield(fid, 302, 100, 34, true)}${riders}
    <g><path d="M120,30 H480 L466,52 L480,74 H120 L134,52Z" fill="#f3e8cc" stroke="#8e1f1b" stroke-width="2.5"/><text x="300" y="61" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="22" fill="#8e1f1b" letter-spacing="2" textLength="310" lengthAdjust="spacingAndGlyphs">ANNO DOMINI ${SC.date.roman}</text></g>`);
}
function showIntro(fid) {
  sfx('horn');
  const d = FAC(fid), cap = P(d.home).name;
  showModal(`<div class="splash">${introScene(fid)}<div class="splashtxt"><h2>${rulerOf(fid)}</h2>
    ${SC.intro.splash(fid, d, cap)}
    <div class="row ctr"><button class="btn gold big" onclick="closeModal();render();hint('start');setTimeout(()=>hint('peace'),13000)">Raise the banners</button><button class="btn" onclick="openHelp()">How to play</button></div></div></div>`, 'splashcard');
}
function showCoronation(fid, kid, onDone) {
  setMusic('coronation'); sfx('bell'); setTimeout(() => sfx('cheer'), 900); buzz(60);
  const title = SC.crown.title;
  const body = G.over && alive().length === 1
    ? `In ${dateStr(G.turn)}, the last rival house has fallen. ${SC.crown.wonAll(fid)}`
    : `${SC.crown.won(fid)} His counties in the kingdom pay +1 d each a turn and raise double levies, and his host fights 10% harder. With ${KING_ARMY3} counties he may field a third army.`;
  window._coronDone = onDone || null;
  showModal(`<div class="splash">${coronationScene(fid, kid)}<div class="splashtxt"><h2>${title}</h2><p>${body}</p>
    <div class="row ctr"><button class="btn gold big" onclick="closeModal();(window._coronDone||(()=>{render();showReports();}))()">Long live the King</button></div></div></div>`, 'splashcard');
}

// ================= TITLES =================
// Every land you hold carries a title. A house's seat carries the house's title (Duke of Normandy, Count of Flanders);
// every other county carries its own, from the lord who held it in 987: count, viscount, lord, or, for a bishop's
// lands, advocate, the lay protector of the see. Lesser lords sworn to you make you their overlord.
const TITLE_RANK = { King: 0, Patrician: 1, Prince: 1, Catepan: 1, Duke: 1, Margrave: 2, Marquis: 2, Earl: 3, Count: 3, Viscount: 4, Advocate: 5, Lord: 6, Overlord: 7 };
function landTitle(p) {
  const t = landTitle0(p);
  return t === 'Count' && SC.countAs ? SC.countAs(p) : t;
}
function landTitle0(p) {
  const r = PROV.find(x => x[0] === p.id) || [], lord = r[9] || '';
  if (!lord) return 'Count';
  if (/viscount/i.test(lord)) return 'Viscount';
  if (/count|duke|duchess|margrave/i.test(lord)) return 'Count';
  if (/bishop|abbot|abbess/i.test(lord)) return 'Advocate';
  return 'Lord';
}
function titlesOf(fid) {
  const out = [], seats = new Set(), mine = owned(fid);
  const orig = id => (PROV.find(x => x[0] === id) || [])[7];
  if (wears(fid)) out.push({ rank: 'King', n: SC.crown.title, sub: 'Anointed at ' + SC.crown.at, w: 1e9, crown: 1 });
  else if (G.crowns.franks === fid) out.push({ rank: 'King', n: SC.crown.title, sub: 'Chosen, but not yet anointed at ' + SC.crown.at, w: 1e9, crown: 1 });
  for (const f of FACTIONS) {
    const seat = P(f.home); if (!seat || seat.owner !== fid) continue;
    seats.add(f.home);
    const lands = provList().filter(q => orig(q.id) === f.id), held = lands.filter(q => q.owner === fid).length;
    const king = out.some(t => t.crown), st = f.seat ? f.seat(king) : null, rank = st ? st[0] : f.title === 'King' && f.id === SC.crown.start ? 'Duke' : f.title, name = st ? st[1] : f.name;
    out.push({ rank, n: `${rank} of ${name}`, sub: `${held} of ${lands.length} counties of ${f.domain || f.name} held${f.id === fid ? ' · your own house' : ''}`, w: (f.id === fid ? 1000 : 0) + held * 10 + seat.base, house: f.id, pid: f.home });
  }
  for (const p of mine) if (!seats.has(p.id)) { const rank = landTitle(p); out.push({ rank, n: `${rank} of ${p.name}`, sub: `${provIncome(p)} d a turn`, w: p.base, pid: p.id }); }
  for (const p of allies(fid)) out.push({ rank: 'Overlord', n: `Overlord of ${p.name}`, sub: `${p.lord} is sworn to you`, w: p.base, pid: p.id });
  return out.sort((a, b) => TITLE_RANK[a.rank] - TITLE_RANK[b.rank] || b.w - a.w);
}
function titleStyle(fid) {
  const T = titlesOf(fid), f = FAC(fid), main = T.filter(t => t.rank !== 'Overlord');
  const top = main.slice(0, 3).map(t => t.n), rest = main.length - top.length;
  const list = top.length > 1 ? top.slice(0, -1).join(', ') + (rest ? ', ' : ' and ') + top[top.length - 1] : top[0] || 'a lord without land';
  return `${f.pname}, by the grace of God ${list}${rest ? `, and of ${rest} more title${rest === 1 ? '' : 's'} besides` : ''}`;
}
function openTitles() {
  const T = titlesOf(me()), groups = [['King', 'The crown'], ['Patrician', 'Rome'], ['Prince', 'Principalities'], ['Catepan', 'The Greek lands'], ['Duke', 'Duchies'], ['Margrave', 'Marches'], ['Marquis', 'Marches'], ['Earl', 'Earldoms'], ['Count', 'Counties'], ['Viscount', 'Viscounties'], ['Advocate', 'Church lands under your protection'], ['Lord', 'Lordships'], ['Overlord', 'Lords sworn to you']];
  const row = t => `<div class="trow"${t.pid ? ` onclick="closeModal();goProv('${t.pid}')"` : ''}><span class="tico">${t.crown ? ico('crown') : t.house ? shield(t.house, 26) : ico(t.rank === 'Advocate' ? 'church' : t.rank === 'Overlord' ? 'handshake' : t.rank === 'Lord' ? 'castle' : 'fleur')}</span><span class="tn"><b>${esc(t.n)}</b><small>${esc(t.sub)}</small></span></div>`;
  const body = groups.map(([r, h]) => { const g = T.filter(t => t.rank === r); return g.length ? `<h3>${h} <span class="sub" style="text-transform:none;letter-spacing:0">${g.length}</span></h3><div class="tlist">${g.map(row).join('')}</div>` : ''; }).join('');
  showModal(`<div class="ctr">${houseAchievement(me(), 64)}</div><h2 class="ctr" style="margin-top:4px">Your titles</h2>
    <p class="ctr titlestyle">${esc(titleStyle(me()))}</p>
    <p class="sub ctr">Whoever holds a house's seat bears its title. Every other county carries the title of the lord who held it in ${SC.date.y0}. Tap a title to go to the land.</p>
    ${body}
    <div class="row ctr" style="margin-top:10px"><button class="btn sm" onclick="openMedals('rank')"><span class="lbl">${ico('star')}Your rank and heraldry</span></button></div>`, '', { closable: true });
}
