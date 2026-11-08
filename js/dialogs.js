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
  const slots = ARMY_IDS.map(id => { const a = army(me(), id), st = slotState(a), g = genAt(me(), id); return `<span class="tag${st === 'active' ? ' on' : st === 'locked' ? ' red' : ''}">${ARMY_NUM(a)}: ${st === 'locked' ? (id === 'a1' ? 'needs 8 provinces' : 'needs a crown') : g ? g.n.split(' ')[0] : id === 'a0' ? 'the lord' : 'empty'}</span>`; }).join('');
  const postOpts = g => { const o = []; const slot = emptyArmySlot(me()); if (slot && g.at !== slot) o.push([slot, `Lead ${armyLabel(me(), army(me(), slot)).toLowerCase()}`]); if (g.at !== 'a0' && !genAt(me(), 'a0')) o.push(['a0', "Ride with the lord's host"]); for (const p of owned(me()).filter(q => q.b.castle && !genAt(me(), q.id)).slice(0, 4)) o.push([p.id, `Castle at ${p.name}`]); return o; };
  const hired = F.gens.map(g => { const d = GENMAP[g.id]; const opts = postOpts(g); return `<div class="gen on"><div class="gname">${ico('fleur')} ${d.n}</div><div class="sub">${d.d}</div><div class="gstats">${stat(d)}</div><div class="sub">${genPost(me(), g)[0].toUpperCase() + genPost(me(), g).slice(1)}</div>${opts.length ? `<div class="row" style="margin-top:4px">${opts.map(([at, l]) => `<button class="btn sm" onclick="doPost('${g.id}','${at}')">${l}</button>`).join('')}</div>` : ''}</div>`; }).join('') || '<p class="sub">No generals in your service.</p>';
  const pool = G.genPool.map(id => { const d = GENMAP[id]; return `<div class="gen"><div class="gname">${d.n}</div><div class="sub">${d.d}</div><div class="gstats">${stat(d)}</div><button class="btn sm" onclick="doHire('${id}')" ${F.gold >= d.c && F.gens.length < 3 ? '' : 'disabled'}>Hire · ${coin(d.c)}</button></div>`; }).join('') || '<p class="sub">No captains are seeking a lord just now.</p>';
  showModal(`<h2>${ico('fleur')} Your court</h2><p>Your lord leads his own host. A second army needs a general and a realm of 9 counties; a third needs a general and the crown, with two princes sworn to it. A general may instead ride with the lord's host and lend it his strengths, or command a castle as a strategist. You may keep three. A general who leads a lost army dies with it.</p>
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
    ${sel && sel.owner && sel.owner !== me() ? btn('interdict', sel.id, `Interdict ${sel.name}`) : '<p class="sub">Select an enemy province on the map, then open the Church to lay it under interdict.</p>'}`, '', { closable: true });
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
const APP_VERSION = '5.2';
function openSettings() {
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, l, i]) => `<button class="${SET[key] === v ? 'on' : ''}" onclick="setOpt('${key}','${v}')">${ico(i)}${l}</button>`).join('')}</div>`;
  const sw = key => `<div class="sw${SET[key] ? ' on' : ''}" onclick="setOpt('${key}',${!SET[key]})"></div>`;
  showModal(`<h2>${ico('gear')} Settings</h2>
    <div class="setrow"><div class="l">Layout<small>Phone: map with a sliding sheet. Desktop: map with a sidebar.</small></div>${seg('layout', [['auto', 'Auto', 'auto'], ['phone', 'Phone', 'phone'], ['desktop', 'Desktop', 'desktop']])}</div>
    <div class="setrow"><div class="l">Music<small>Lute, recorder and hurdy-gurdy, all synthesised</small></div>${sw('music')}</div>
    <div class="setrow"><div class="l">Sound effects<small>Clashes, arrows, bells and horns</small></div>${sw('sfxOn')}</div>
    <div class="setrow"><div class="l">Tips for new players<small>Short hints on your first turns</small></div>${sw('hints')}</div>
    <div class="setrow"><div class="l">End-of-turn reminder<small>Warn when the army is idle or gold lies unspent</small></div>${sw('confirmEnd')}</div>
    <div class="setrow"><div class="l">Animations<small>Map movement and turn transitions</small></div>${sw('motion')}</div>
    <div class="setrow"><div class="l">Rival moves<small>After you end a turn, show the other houses' marches, sieges and conquests on the map</small></div>${seg('replay', [['near', 'Near me', 'home'], ['all', 'All', 'map'], ['off', 'Off', 'close']])}</div>
    <div class="setrow" style="flex-direction:column;align-items:stretch"><div class="l">The rival houses<small>How eagerly the computer houses turn on you. Takes effect from the next turn.</small></div>${diffSeg()}</div>
    <div class="setrow"><div class="l">Battle speed</div>${seg('speed', [[1, '1×', 'next'], [2, '2×', 'speed'], [4, '4×', 'skip']])}</div>
    <div class="row"><button class="btn sm" onclick="openSaves()"><span class="lbl">${ico('scroll')}Saved games</span></button><button class="btn sm" onclick="closeModal();openHelp()"><span class="lbl">${ico('info')}How to play</span></button><button class="btn sm ghost" onclick="SET.seenHints={};saveSettings();toast('Tips will show again')">Reset tips</button>${G ? `<button class="btn sm ghost" onclick="closeModal();confirmNew()">New game</button>` : ''}</div>
    <p class="sub ctr" style="margin-top:12px">Add this page to your iPhone home screen for a full-screen game.<br>Version ${APP_VERSION}</p>`, '', { closable: true });
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
  if (SND.ctx) { SND.music.gain.value = SET.music ? 0.32 : 0; SND.sfx.gain.value = SET.sfxOn ? 0.6 : 0; }
  if (SET.music && SND.ctx) setMusic(SND.want);
}
function toggleSound() { SET.music = SET.sfxOn = !(SET.music || SET.sfxOn); saveSettings(); sndUnlock(); applySound(); toast(SET.music ? 'Sound on' : 'Sound off', SET.music ? 'sound' : 'mute'); }

// ================= CODEX (help) =================
const HELP = { tab: 'goal' };
function openHelp() {
  const rows = ['foot', 'bow', 'cav', 'cat'].map(t => `<tr><td>${ico(UNIT_ICON[t])} ${UNIT[t].n}</td><td>${UNIT[t].c} d</td><td>${UNIT[t].atk || '–'}</td><td>${UNIT[t].rng || '–'}</td><td>${UNIT[t].chg || '–'}</td><td>${UNIT[t].hp || '–'}</td></tr>`).join('');
  const T = {
    goal: `<p><b>France in 987.</b> King Louis V is dead. Hugh Capet holds the crown, but the great princes rule their own lands, and Charles of Lorraine, the last Carolingian, wants it back. Fourteen houses, from Flanders to Barcelona.</p>
      <p><b>The goal.</b> You choose it when you raise your banner. <i>King in fact</i>: wear the crown, anointed at Reims; hold the homage of two-thirds of the princes still standing (at least three); and hold two-fifths of the kingdom's counties yourself. <i>Full conquest</i>: break every rival house. The first house to reach the goal wins, and the last house standing always wins.</p>
      <p><b>The crown.</b> A king is anointed at Reims and needs his royal seat: hold Reims and Paris (Charles: Reims and Laon) and at least ${CROWN_LANDS} counties of the kingdom, and pay ${CROWN_COST} d. The king's counties in the kingdom pay +1 d and raise double levies, his host fights 10% harder, and once two princes have sworn to him he may field a third army. A new king finds every oath to the old one void.</p>
      <p><b>Homage.</b> The king may summon one prince a turn (${HOMAGE_GIFT} d in gifts). The prince weighs the king's armies against his own, the king's favour with the Pope, and whether he is the bigger lord. A captured prince can be freed for his homage. King and vassal are at peace; a vassal who renounces his oath may be excommunicated, and a king who wants war with a vassal declares his fiefs forfeit first.</p>
      <p><b>Distance.</b> A prince's power fades with distance. Counties more than three steps from his seat pay less, and far-flung realms breed unrest sooner. The rich land is in the north.</p>
      <p><b>The league.</b> If one house holds more than a quarter of the kingdom, the princes may league against it for three years.</p>
      <p><b>The fall of a house.</b> Take a house's seat (${ico('crown')}) and you win it and every county of theirs beside it. If the house still holds four connected counties, an heir rallies there once. Fragments go to independent castellans.</p>
      <p><b>The Peace of God.</b> For the first ${TRUCE} turns the Church forbids war between the great houses. Break it and you are excommunicated.</p>
      <p><b>A turn.</b> Build and raise troops, march your armies (${MOVES} counties each through your own and allied land), strike with each army once, petition the Pope once, court one lady. Then end the turn and the other houses move.</p>`,
    powers: `<p><b>Beyond the kingdom.</b> The hatched lands at the edge of the map are not for conquest. Their rulers act on France from outside.</p>
      <p><b>Almanzor.</b> The hajib of Córdoba sends summer raids over the Pyrenees, against Barcelona and the far south. Pay him parias to go away, or meet him in the field.</p>
      <p><b>Pamplona and Arles.</b> The Basques raid Gascony and Toulouse. In Provence, the Kingdom of Arles watches any outsider who takes more than a foothold.</p>
      <p><b>The Empire.</b> The Emperor's regents hold Lorraine. Take its counties, or take Reims without the crown, and an imperial host may come to take them back.</p>
      <p><b>The Danes.</b> Normandy can open or close its ports to the Danes. Open, Normandy profits and Danish raiders range the coasts; closed, the Pope is pleased.</p>
      <p><b>Events.</b> Some things happened in these years: Robert crowned beside his father, Laon opened to Charles, an archbishop's death, a bishop's betrayal. The game follows them loosely.</p>`,
    war: `<p><b>Armies.</b> Your lord leads his own host. A second army needs a general and a realm of 9 counties; a third needs a general and the crown, with two princes sworn to it. Each army marches up to ${MOVES} provinces a turn, then strikes a county bordering its position. If the lord's host is destroyed he is captured; if a general's army is destroyed, the general dies.</p>
      <p><b>Pay.</b> Garrisons cost nothing. Armies in the field are paid every turn: footmen and bowmen ${UPKEEP.foot} d, cavalry ${UPKEEP.cav} d, catapults ${UPKEEP.cat} d. If the treasury runs dry, every army loses 15% of its men. Realms above 20 counties yield a little less for each county beyond.</p>
      <p><b>Troops.</b> Each company:</p>
      <table class="stat"><tr><th></th><th>Cost</th><th>Atk</th><th>Range</th><th>Charge</th><th>HP</th></tr>${rows}<tr><td>${ico('militia')} Levy</td><td>free</td><td>${LEVY.atk}</td><td>–</td><td>–</td><td>${LEVY.hp}</td></tr></table>
      <p><b>Battle.</b> Bowmen wear the enemy down as the lines close. The horse fight on the wings; the winners ride round and strike the enemy rear, which can break an army. Footmen in a <i>defensive</i> stance lock a shield wall that blunts arrows and cavalry; in an <i>aggressive</i> stance they advance as a deep line and hit harder. A <i>balanced</i> host outflanks a static shield wall.</p>
      <p><b>Horse orders.</b> While your horse still hold, you may send them at the enemy horse (the usual charge), at the enemy bowmen (a raid; if the enemy horse are holding they intercept), or round to the rear (if the enemy horse are holding they intercept at a heavier charge). Leave the buttons alone and your horse charge as the lines close.</p>
      <p><b>The reserve.</b> An army of 9 or more may hold back a third of its foot and bowmen. Commit them when the moment is right for a surge of +15% attack; a reserve never committed halves the losses of a beaten army and comes home intact. Reserve bowmen still shoot from behind the line.</p>
      <p><b>Battles and sieges, quickly.</b> Every battle can be auto-resolved from the pre-battle screen, and a siege can be auto-bombarded: the same rules, without the scene.</p>
      <p><b>Mining.</b> Instead of bombarding, an army of 4 or more footmen can dig a mine under the walls: steer the tunnel along the foundations, clear of rock, water and counter-mines. It brings down a section of wall whatever the walls are made of, so it is the better tool against stone.</p>
      <p><b>Castles.</b> Wooden castle, stone castle, great walls, and a moat. Walls make defenders far stronger, and catapults in a garrison shoot from them. Bombard to break them: stones for walls (one, or 3 that scatter wider), flaming oil for the men inside (one, or 3), and plague rats that gnaw at the garrison over your next few shots and may start a plague. A giant plague rat does the work of three. A capital's household grows back each turn it is not besieged. If the walls fall completely, the castle is ruined: its upgrades are lost and it must be rebuilt.</p>
      <p><b>War buildings.</b> One forge (+15% hit points), one armory (+15% attack) and one royal stables (+25% cavalry) serve your whole realm.</p>
      <p><b>Captured lords.</b> If your lord's host is destroyed he is captured and his host cannot take the field. His captor may hold him up to three turns: a ransom after one turn costs twice your income, after two your full income, then half, and after three turns it must be accepted. Your generals' armies fight on.</p>`,
    court: `<p><b>Unrest.</b> Large realms breed unrest, sooner if they sprawl far from the seat. When the lords around a far province mutter, you have two turns to put an army of at least 8 men in that province or buy them off (40 d + 4 per county). Otherwise a son or great vassal rises and carries a quarter of the realm with him.</p>
      <p><b>Courtship.</b> To win an heiress (${ico('ring')}) you make a suit: your standing, a bride price, a promise of protection (footmen for her garrison) and a bishop's blessing. Her guardians set a minimum; rival houses may bid. If outbid you may raise once. A son is spent only when she accepts. One courtship a turn.</p>
      <p><b>Diplomacy.</b> Open Envoys (or Diplomacy on a computer), or the Envoys tab on any county of a rival house. Choose a house and offer a truce of one to five years, or ask it to make war on a house it borders, in return for which you keep the peace for ${JOINT_TURNS} turns. Sweeten either with silver or one of your counties (not your seat). A sworn truce cannot be broken by either side while it runs. One embassy to each house a turn, and nothing is paid unless they accept.</p>
      <p><b>Envoys.</b> Computer houses send envoys: a marriage from a weaker neighbour (peace for ${PACT_TURNS} turns), or a joint war against a house that threatens you both (peace between you for ${JOINT_TURNS} turns while they attack it). An envoy waits until the end of your turn. The same two houses cannot renew a truce or pact within ${TRUCE_COOL} turns of the last one lapsing.</p>
      <p><b>The Church.</b> Bishops sit in your council; raise them to cardinal to win votes in the college. Your share of the college decides how often the Pope agrees: blessings, mercenaries, absolution, dispensations, excommunication, a Truce of God or an interdict.</p>
      <p><b>Forged charters.</b> With a bishop in your council, your scriptorium can forge an old charter for a lesser lord who borders you (25 d, once every 4 turns). Trace the old hand and press the seal at the right moment: a good copy makes him swear to you for nothing; a poor one may be exposed, and the Pope excommunicates you.</p>
      <p><b>Ransoms.</b> When your lord is a prisoner, his captor's envoy names a price you can haggle down. When you hold a prisoner, you can haggle his house up. Push too hard and the envoy rides home for the turn.</p>
      <p><b>The fair at Troyes.</b> Each summer, if you hold a market town, you may take a purse to the fair: six days of buying and selling cloth, wine, salt, spices, furs and wax. Rumours are right more often than not.</p>
      <p><b>Raiders.</b> Danish longships sometimes fall on a coastal county. Meet them on the beach yourself, leave it to the garrison, or pay them to go.</p>
      <p><b>Minor lords and generals.</b> Ally with minor lords for half their income; your armies march through their land. Generals lead your armies or command a castle.</p>`,
    map: `<p><b>Reading the map.</b></p>
      <p>${ico('crown')} a house's seat · ${ico('ring')} an heiress of marrying age · ${ico('hammer')} building under way · ${ico('skull')} plague · ${ico('interdict')} under interdict · ${ico('fleur')} a general in command · ${ico('fire')} unrest.</p>
      <p>Every army is a banner with its strength; your banners carry their number, and the one you command wears a gold ring. A tent beside a banner marks a siege. Diagonal hatching marks a minor lord sworn to a house. The grey hatched lands at the edges are outside powers, not for conquest. Chevrons mark hill country, where mines can be dug.</p>
      <p>A thick coloured outline marks your own holdings. Green dots mark where the chosen army can march this turn; red dashes mark what it can strike.</p>
      <p><b>Controls.</b> Tap to select. Drag to pan, pinch or scroll to zoom, double-tap to zoom in. The army tabs over the map switch which army you command. On a phone, drag the sheet up for the full province page; the main action always sits at its foot.</p>
      <p><b>Rival moves.</b> After you end a turn, the marches, sieges and conquests of the houses near you are drawn on the map, one house at a time. Tap to skip, or change it in Settings (near me, all, or off).</p>
      <p><b>Saved games.</b> The game saves itself after every move. Settings, the realm panel and the title screen also have three save slots, and you can export a campaign as a file or a code to back it up or move it to another device.</p>
      <p><b>Keyboard.</b> <span class="kbd">E</span> end turn · <span class="kbd">H</span> my lands · <span class="kbd">L</span> chronicle · <span class="kbd">C</span> court · <span class="kbd">1</span>–<span class="kbd">3</span> choose an army · <span class="kbd">+</span>/<span class="kbd">−</span> zoom · <span class="kbd">Esc</span> back.</p>`,
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
  const wonTxt = lastStanding ? `In ${dateStr(G.turn)}, the last rival house falls. From Flanders to Barcelona, no prince stands against ${FAC(me()).pname}. He is king of the Franks in name and in fact.`
    : `In ${dateStr(G.turn)}, ${vassals().length} princes have knelt to ${FAC(me()).pname}, and his own lands are the greatest in the kingdom. For the first time in a century, a king of the Franks rules as well as reigns.`;
  showModal(`<div class="rep${won ? '' : ' badrep'}"><div class="sealmark">${ico(won ? 'crown' : 'swords')}</div><h2>${won ? 'Rex Francorum' : W ? `${W.name} rules the Franks` : 'Your house has fallen'}</h2>
    <p>${won ? wonTxt : W ? `${W.pname} ${alive().length === 1 ? 'has broken every rival house' : 'is king in fact: the princes have done him homage'}.` : `${rulerOf(me())}'s line is broken. Another will take the kingdom.`}</p>
    <p class="sub ctr">${dateStr(G.turn)} · ${G.turn} turns</p>
    <div class="row ctr"><button class="btn gold big" onclick="closeModal();showTitle()">Play again</button></div></div>`);
}

// ================= TITLE =================
const TITLE_NORTH = ['capet', 'charles', 'normandy', 'flanders', 'champagne', 'blois', 'anjou', 'brittany', 'burgundy'];
function oldCampaign() { try { const o = localStorage.getItem('crownOfTheFranks987v7'); if (o && !JSON.parse(o).over) return true; for (let n = 1; n <= SLOTS; n++) { const s = readSlot(n); if (s && s.game && s.game.v === 7) return true; } } catch (e) { } return false; }
function showTitle() {
  const s = loadSave();
  const t = $('#title'); t.style.display = 'block';
  const card = f => `<div class="fcard" style="--c:${f.color}" onclick="openFaction('${f.id}')">${shield(f.id, 46)}<div style="min-width:0"><h3>${f.name}</h3><div class="r">${f.title} ${f.pname}</div><div class="b">${f.blurb}</div><div class="tr">${ico('star')}<span>${f.trait}</span></div></div></div>`;
  t.innerHTML = `<div class="tbg">${titleMap()}</div><div class="inner"><div class="ad">ANNO DOMINI CMLXXXVII</div><h1>Crown of the Franks</h1><div class="orn">❦</div>
    <p class="lead">King Louis V is dead without an heir. At Senlis the princes have chosen Hugh Capet, but a crown is not a kingdom. Charles of Lorraine, the last Carolingian, wants it back, and from Flanders to Barcelona the great princes rule as they please. Who will be king in fact?</p>
    ${oldCampaign() ? `<div class="notebox" style="color:var(--ink,#2a1d12)">${ico('scroll')} A campaign from the old map of Europe is saved on this device. It plays on in <a href="https://jdc001.github.io/Emperor-1000/" style="color:inherit;font-weight:700">Emperor: 1000 AD</a>, which picks it up by itself.</div>` : ''}
    ${s && !s.over && s.v === 8 ? `<div class="contbox"><button class="btn gold big" onclick="continueGame()"><span class="lbl">${shield(s.player, 20)} Continue as ${s.fdefs.find(d => d.id === s.player).name}</span><small>${dateStr(s.turn)} · ${s.fdefs.filter(d => s.fac[d.id].alive).length - 1} rivals left</small></button></div>` : ''}
    <h2>The north</h2><div class="facs">${FACTIONS.filter(f => TITLE_NORTH.includes(f.id)).map(card).join('')}</div>
    <h2>The south</h2><div class="facs">${FACTIONS.filter(f => !TITLE_NORTH.includes(f.id)).map(card).join('')}</div>
    <p class="sub ctr" style="opacity:.8;margin-top:18px">New games: ${GOALS[setGoal()].n.toLowerCase()} · ${DIFF[SET.diff || 'gentle'].n.toLowerCase()} rivals · change them on a house's page</p>
    <div class="foot"><button onclick="openSaves()">Saved games</button><button onclick="openHelp()">How to play</button><button onclick="openSettings()">Settings</button><span>Tap anywhere to enable music</span></div></div>`;
}
function diffSeg() {
  const cur = SET.diff || 'gentle';
  return `<div class="seg" style="display:flex">${Object.keys(DIFF).map(k => `<button class="${cur === k ? 'on' : ''}" style="flex:1" onclick="SET.diff='${k}';saveSettings();if(G)G.diff='${k}';document.getElementById('diffd').textContent=DIFF['${k}'].d;this.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===this))">${DIFF[k].n}</button>`).join('')}</div><p class="sub" id="diffd" style="min-height:40px">${DIFF[cur].d}</p>`;
}
function openFaction(fid) {
  const f = FACMAP[fid], home = PROV.find(r => r[0] === f.home);
  const lands = PROV.filter(r => r[7] === fid).map(r => r[1]);
  sfx('click');
  showModal(`<div class="facsheet"><div class="top">${shield(fid, 64)}<div><div class="sub">${f.realm === 'France' ? 'A house of the kingdom of the Franks' : 'A house of the kingdom of Arles'}</div><h2>${f.name}</h2><div class="sub">${f.title} ${f.pname}</div></div></div>
    <div class="mini">${miniMap(fid)}</div>
    <p>${f.blurb}</p>
    <div class="notebox good">${ico('star')} <b>House trait.</b> ${f.trait}</div>
    <p class="sub">Seat at <b>${home[1]}</b>. Starting lands: ${lands.join(', ')}. ${TITLE_NORTH.includes(fid) ? 'The north is rich and crowded: Reims and Paris are close, and so is every rival.' : 'The south has room to grow, but its counties pay less, the crown is far away, and other powers press from beyond the border.'}</p>
    <div class="setrow"><div class="l">Guided first campaign<small>One objective at a time, with a hint, for your first few years</small></div><div class="sw${SET.guided !== false ? ' on' : ''}" onclick="SET.guided=!(SET.guided!==false);saveSettings();this.classList.toggle('on',SET.guided)"></div></div>
    <h3>Your goal</h3>${goalSeg()}
    <h3>The rival houses</h3>${diffSeg()}
    <div class="row ctr"><button class="btn gold big" onclick="closeModal();startGame('${fid}')"><span class="lbl">${ico('flag')}Raise the banner of ${f.name}</span></button></div></div>`, '', { closable: true });
}
function startGame(fid) { sndUnlock(); newGame(fid); G.diff = SET.diff || 'gentle'; G.goal = setGoal(); G.tut = SET.guided !== false ? { i: 0, did: {} } : null; $('#title').style.display = 'none'; applyLayout(); save(); render(); homeView(false); if (isPhone()) setSheet('peek'); showIntro(fid); }
function continueGame() { sndUnlock(); G = loadSave(); if (!G || G.v !== 8) { G = null; return showTitle(); } rebuildFmap(); if (!G.army) G.army = 'a0'; $('#title').style.display = 'none'; applyLayout(); render(); homeView(false); if (isPhone()) setSheet('peek'); }

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
function coronationScene(fid, kid) {
  const col = FAC(fid).color, latin = LATIN[kid] || 'REX';
  const name = FAC(fid).pname.split(' ')[0].toUpperCase();
  const arches = [90, 220, 380, 510].map(cx => `<path d="M${cx - 60},330 V150 A60,60 0 0 1 ${cx + 60},150 V330" fill="none" stroke="#6b5636" stroke-width="10"/><rect x="${cx - 66}" y="140" width="12" height="190" fill="#8b7350"/><rect x="${cx + 54}" y="140" width="12" height="190" fill="#8b7350"/>`).join('');
  const candles = [60, 150, 450, 540].map(cx => `<rect x="${cx - 3}" y="260" width="6" height="40" fill="#f3e8cc"/><path d="M${cx},248 q5,7 0,12 q-5,-5 0,-12" fill="#ffb347"/>`).join('');
  const bishops = [[120, 330], [480, 330]].map(([bx, by]) => figurePerson(bx, by, '#f3e8cc', '#6e2f63', 0.9) + `<path d="M${bx - 6},${by - 82} L${bx},${by - 98} L${bx + 6},${by - 82}Z" fill="#f3e8cc" stroke="#e2b33c"/>`).join('');
  const pope = `${figurePerson(395, 332, '#f7f1e0', '#a3222c', 1.25)}
    <path d="M384,212 Q395,180 406,212 Z" fill="#f7f1e0" stroke="#e2b33c" stroke-width="2"/><path d="M385,206 H405 M387,198 H403 M390,190 H400" stroke="#e2b33c" stroke-width="2"/>
    <line x1="425" y1="330" x2="425" y2="200" stroke="#e2b33c" stroke-width="4"/><path d="M425,200 q14,-4 12,-16 q-2,-10 -12,-6" fill="none" stroke="#e2b33c" stroke-width="4"/>
    <path d="M378,250 Q350,236 318,236" stroke="#f7f1e0" stroke-width="9" stroke-linecap="round" fill="none"/>`;
  const crownG = `<g transform="translate(300,222)"><path d="M-16,10 L-16,-6 L-8,2 L0,-12 L8,2 L16,-6 L16,10Z" fill="#e2b33c" stroke="#7a5a10" stroke-width="1.5"/><circle cx="0" cy="-12" r="3" fill="#a3222c"/><circle cx="-16" cy="-6" r="2.5" fill="#2d5ea8"/><circle cx="16" cy="-6" r="2.5" fill="#2d5ea8"/></g>`;
  const king = figurePerson(290, 334, col, '#7a1d1d', 1.3, true) + `<path d="M255,334 h120" stroke="#a3222c" stroke-width="10"/>`;
  return frame(`<rect width="600" height="400" fill="url(#diap)"/><rect x="18" y="300" width="564" height="82" fill="#7a6648"/>
    <path d="M18,300 H582" stroke="#5a4a32" stroke-width="3"/>${arches}${candles}
    <line x1="200" y1="334" x2="200" y2="150" stroke="#2a1d12" stroke-width="4"/>${embedShield(fid, 202, 152, 44, true)}
    ${bishops}${king}${pope}${crownG}
    <g><path d="M90,38 H510 L496,58 L510,78 H90 L104,58Z" fill="#f3e8cc" stroke="#8e1f1b" stroke-width="2.5"/><text x="300" y="66" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="24" fill="#8e1f1b" letter-spacing="3" textLength="${Math.min(380, (name.length + latin.length + 1) * 19)}" lengthAdjust="spacingAndGlyphs">${name} ${latin}</text></g>`);
}
function introScene(fid) {
  const col = FAC(fid).color;
  const riders = Array.from({ length: 9 }, (_, i) => { const x = 120 + i * 34 + (i % 2) * 8, y = 318 + (i % 3) * 6; return `<g transform="translate(${x},${y})"><ellipse cx="0" cy="0" rx="13" ry="6" fill="#3a2a1a"/><path d="M8,-3 l8,-6 l2,4z" fill="#3a2a1a"/><rect x="-3" y="-16" width="6" height="12" fill="${col}"/><circle cx="0" cy="-19" r="3.5" fill="#d9c09a"/><line x1="-2" y1="-12" x2="18" y2="-40" stroke="#2a1d12" stroke-width="1.6"/>${i % 3 === 0 ? `<path d="M18,-40 l10,3 l-10,4z" fill="${col}"/>` : ''}<path d="M-8,5 l-2,9 M8,5 l2,9" stroke="#3a2a1a" stroke-width="2"/></g>`; }).join('');
  return frame(`<rect width="600" height="400" fill="url(#dawn)"/><circle cx="470" cy="150" r="34" fill="#fbe3a6" opacity=".9"/>
    <path d="M18,250 Q150,190 300,236 T582,214 V382 H18Z" fill="#8a8a5a"/><path d="M18,300 Q200,260 380,296 T582,288 V382 H18Z" fill="#6f7a43"/>
    <g transform="translate(300,196)"><path d="M-70,44 V-6 H-58 V-18 H-46 V-6 H-30 V-40 H-20 V-52 H-8 V-40 H8 V-52 H20 V-40 H30 V-6 H46 V-18 H58 V-6 H70 V44Z" fill="#7d7363" stroke="#3a3226" stroke-width="2"/><path d="M-8,44 V28 a8,8 0 0 1 16,0 V44Z" fill="#3a3226"/><line x1="0" y1="-52" x2="0" y2="-96" stroke="#2a1d12" stroke-width="2.5"/></g>
    ${embedShield(fid, 302, 100, 34, true)}${riders}
    <g><path d="M120,30 H480 L466,52 L480,74 H120 L134,52Z" fill="#f3e8cc" stroke="#8e1f1b" stroke-width="2.5"/><text x="300" y="61" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="22" fill="#8e1f1b" letter-spacing="2" textLength="310" lengthAdjust="spacingAndGlyphs">ANNO DOMINI CMLXXXVII</text></g>`);
}
function showIntro(fid) {
  sfx('horn');
  const d = FAC(fid), cap = P(d.home).name;
  showModal(`<div class="splash">${introScene(fid)}<div class="splashtxt"><h2>${rulerOf(fid)}</h2>
    <p>King Louis V is dead without an heir. At Senlis the princes have raised Hugh Capet to the throne, but he is king of little more than Paris and Orléans. At ${cap}, ${d.pname} raises the banner of ${d.name}.</p>
    <p>Build while the Peace of God holds, and win the lesser lords by sword, marriage or gold. ${fid === 'capet' ? 'You wear the crown already. Now make the princes kneel.' : fid === 'charles' ? 'Take Laon and Reims and the crown of your fathers is yours.' : 'Take Reims and Paris and you may be anointed yourself, or make yourself too strong for any king to command.'}</p>
    <div class="row ctr"><button class="btn gold big" onclick="closeModal();render();hint('start');setTimeout(()=>hint('peace'),13000)">Raise the banners</button><button class="btn" onclick="openHelp()">How to play</button></div></div></div>`, 'splashcard');
}
function showCoronation(fid, kid, onDone) {
  setMusic('battle'); sfx('bell'); setTimeout(() => sfx('victory'), 600); buzz(60);
  const title = 'King of the Franks';
  const body = G.over && alive().length === 1
    ? `In ${dateStr(G.turn)}, the last rival house has fallen. At Reims the archbishop anoints ${FAC(fid).pname}, and there is no prince left to refuse him homage.`
    : `At Reims, before the bishops of the realm, the archbishop anoints ${FAC(fid).pname} King of the Franks. His counties in the kingdom pay +1 d each a turn and raise double levies, and his host fights 10% harder. Every oath sworn to the old king is void.`;
  window._coronDone = onDone || null;
  showModal(`<div class="splash">${coronationScene(fid, kid)}<div class="splashtxt"><h2>${title}</h2><p>${body}</p>
    <div class="row ctr"><button class="btn gold big" onclick="closeModal();(window._coronDone||(()=>{render();showReports();}))()">Long live the King</button></div></div></div>`, 'splashcard');
}
