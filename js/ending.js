'use strict';
// ================= THE END OF A GAME, STATISTICS, SHARING, AND THE CHRONICLER'S CHALLENGE =================
const LAST_KEY = 'cotf-lastgame';

// ---------- the ending ----------
// replaces the old one-box ending: a coronation (or a fall), then the chronicle of the game
gameOver = function () {
  const won = G.winner === me();
  const S = recordGame();
  saveLastGame(S);
  clearSave();
  if (won) {
    setMusic('coronation'); sfx('bell'); setTimeout(() => sfx('cheer'), 900); buzz(60);
    const body = S.how === 'conquest'
      ? `In ${dateStr(G.turn)} the last rival house falls. ${SC.crown.endAll(FAC(me()).pname)}`
      : `In ${dateStr(G.turn)} ${SC.crown.endWon(FAC(me()).pname)} ${owned(me()).length} counties, half the realm of ${SC.crown.people}.`;
    showModal(`<div class="splash">${coronationScene(me(), 'franks')}<div class="splashtxt"><h2>${SC.crown.latin.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</h2><p class="sub ctr" style="margin-top:-6px">${esc(FAC(me()).name)} · ${G.turn} turns</p><p>${body}</p>
      <div class="row ctr"><button class="btn gold big" onclick="closeModal();openStats(G.recorded,0)">Long live the King</button></div></div></div>`, 'splashcard');
  } else {
    setMusic('defeat'); sfx('defeat');
    const W = G.winner ? FAC(G.winner) : null;
    showModal(`<div class="rep badrep"><div class="sealmark">${ico('swords')}</div><h2>${W ? `${esc(W.name)} takes the crown` : 'Your house has fallen'}</h2>
      <p>${W ? `${esc(W.pname)} ${alive().length === 1 ? 'has broken every rival house' : `is ${SC.crown.anointed}, master of half the kingdom`}. ${G.fac[me()].alive ? `${esc(rulerOf(me()))} keeps his lands, but not the crown.` : `${esc(rulerOf(me()))}'s line is broken.`}` : `${esc(rulerOf(me()))}'s line is broken. Another will take the kingdom.`}</p>
      <p class="sub ctr">${dateStr(G.turn)} · ${G.turn} turns</p>
      <div class="row ctr"><button class="btn gold big" onclick="closeModal();openStats(G.recorded,0)">The chronicle of your reign</button></div></div>`);
  }
};
// what the statistics pages need from the last game, kept apart from the long history
function saveLastGame(S) {
  if (!G.stats) return;
  const houses = G.fdefs.map(d => ({ id: d.id, n: d.name, col: d.color, c: (G.stats.h[d.id] || { c: [] }).c }));
  saveJ(LAST_KEY, { when: S.when, player: G.player, houses, own: G.stats.own, ids: PROV.map(r => r[0]) });
}

// ---------- the statistics pages ----------
let STP = null;
function openStats(S, page = 0) {
  const H = gameHistory();
  S = S || H[H.length - 1] || null;
  const L = loadJ(LAST_KEY, null), last = L && S && L.when === S.when ? L : null;
  const P = profile(), r = rankOf(P.points);
  const pages = [statsGame(S, last), statsHistory(H), statsVsAvg(S, H)];
  const names = ['This game', 'Your games', 'Against your average'];
  showModal(`<div class="sthead">${myAchievement(56, { noScroll: true })}<div><b>${RANKS[r].n}</b><small>${P.points} points</small></div></div>
    <div class="stdots">${names.map((n, i) => `<button onclick="stGo(${i})" data-i="${i}">${n}</button>`).join('')}</div>
    <div class="stpages" id="stpages">${pages.map(h => `<section class="stpage">${h}</section>`).join('')}</div>
    <div class="row ctr" style="margin-top:8px"><button class="btn gold" onclick="closeModal();${G && !G.over ? 'render()' : 'showTitle()'}">${G && !G.over ? 'Back to the game' : 'To the title'}</button>${S ? `<button class="btn" onclick="shareGame()"><span class="lbl">${ico('star')}Share</span></button>` : ''}<button class="btn" onclick="openMedals('trophies')">Medals</button></div>`, 'wide statsm', { closable: true });
  const box = $('#stpages');
  const mark = () => { const i = Math.round(box.scrollLeft / Math.max(1, box.clientWidth)); document.querySelectorAll('.stdots button').forEach(b => b.classList.toggle('on', +b.dataset.i === i)); };
  box.addEventListener('scroll', mark, { passive: true });
  requestAnimationFrame(() => { box.scrollLeft = box.clientWidth * page; mark(); if (last) playLapse(last); });
}
function stGo(i) { const box = $('#stpages'); if (box) box.scrollTo({ left: box.clientWidth * i, behavior: 'smooth' }); }
const row = (k, v, cls = '') => `<tr><td>${k}</td><td class="${cls}">${v}</td></tr>`;
function statsGame(S, L) {
  if (!S) return '<p class="sub">No game finished yet. Play one to the end and its chronicle appears here.</p>';
  const m = S.m || {}, P = profile();
  let h = `<h3>${S.won ? 'Victory' : 'Defeat'} · ${esc(S.name)}</h3><p class="sub">${S.won ? (S.how === 'conquest' ? 'Every rival broken' : `${SC.crown.crowned[0].toUpperCase() + SC.crown.crowned.slice(1)} with half the kingdom`) : S.winner ? `The crown went to ${esc(FACMAP[S.winner] ? FACMAP[S.winner].name : 'a rebel house')}` : 'Your house fell'} · ${S.year} · ${S.turns} turns · ${DIFF[S.diff] ? DIFF[S.diff].n : ''} rivals${S.challenge ? ' · challenge' : ''}</p>`;
  if (S.rankAfter > S.rankBefore) h += `<div class="notebox good rankup">${myAchievement(70, { noScroll: true })}<div><b>You rise to ${RANKS[S.rankAfter].n}!</b><br><span class="sub">Unlocked: ${RANKS[S.rankAfter].unlock}.</span></div></div>`;
  if (S.trophies && S.trophies.length) h += `<div class="notebox good">${ico('star')} <b>New trophies:</b> ${S.trophies.map(id => { const t = TROPHIES.find(x => x.id === id); return t ? `${t.n} (${t.pts})` : id; }).join(', ')}</div>`;
  h += `<p class="sub">+${S.points || 0} points this game.</p>`;
  if (L) {
    h += `<h3>The kingdom, turn by turn</h3><div class="lapse"><svg id="lapse" viewBox="0 0 ${MW} ${MH}"></svg><div class="lapsebar"><button class="btn sm" onclick="playLapse()">${ico('next')}Replay</button><span id="lapseyr"></span></div></div>`;
    h += `<h3>Counties held</h3>${territoryChart(L)}`;
    const others = L.houses.filter(x => x.id !== L.player && x.c.some(v => v > 0));
    const pk = x => Math.max(0, ...x.c.filter(v => v != null)), you = L.houses.find(x => x.id === L.player);
    const best = others.slice().sort((a, b) => pk(b) - pk(a))[0];
    h += `<h3>You and the other houses</h3><table class="sttab"><tr><th></th><th>You</th><th>${best ? esc(best.n) : 'Best rival'}</th><th>Average house</th></tr>
      <tr><td>Most counties</td><td>${pk(you)}</td><td>${best ? pk(best) : '–'}</td><td>${others.length ? Math.round(others.reduce((s, x) => s + pk(x), 0) / others.length) : '–'}</td></tr>
      <tr><td>Counties at the end</td><td>${S.counties}</td><td>${best ? best.c[best.c.length - 1] || 0 : '–'}</td><td>${others.length ? Math.round(others.reduce((s, x) => s + (x.c[x.c.length - 1] || 0), 0) / others.length) : '–'}</td></tr></table>`;
  }
  h += `<h3>Your deeds</h3><table class="sttab">${[
    ['Battles won', m.won], ['Battles lost', m.lost], ['Attacks beaten off', m.defWon], ['Counties lost to assault', m.defLost], ['Counties taken', m.taken], ['Castles taken', m.castlesTaken], ['House seats taken', m.seats],
    ['Enemies killed', m.kills], ['Men lost', m.menLost], ['Lords captured', m.lords], ['Ransoms collected', m.ransomGold ? `${m.ransomGold} d (${m.ransoms})` : 0], ['Ransom paid', m.ransomPaid ? m.ransomPaid + ' d' : 0],
    ['Castles raised', m.castles], ['Pacts signed', m.pacts], ['Alliances sworn', m.alliances], ['Heiresses married', m.heiresses], ['Charters forged', m.charters], ['Profit at the fair', (m.fairProfit || 0) + ' d'],
    ['Walls brought down by mines', m.mines], ['Viking raids driven off', m.raids], [SC.raider ? SC.raider.who + ' thrown back' : 'Almanzor thrown back', m.almanzor], ['Most killed by rats in one bombardment', m.ratBest], ['Most burned by oil in one bombardment', m.oilBest],
    ['Most counties', m.peakC], ['Largest treasury', (m.peakG || 0) + ' d'], ['Largest host', (m.peakM || 0) + ' men'], ['Crowned', m.crownedAt != null ? dateStr(m.crownedAt) : 'never'],
  ].map(([k, v]) => row(k, v ?? 0)).join('')}</table>`;
  return h;
}
function territoryChart(L) {
  const W = 340, Hh = 170, n = Math.max(...L.houses.map(x => x.c.length), 2) - 1;
  const top = Math.max(10, ...L.houses.flatMap(x => x.c.filter(v => v != null)));
  const X = t => 24 + (W - 30) * t / n, Y = v => Hh - 18 - (Hh - 26) * v / top;
  let s = `<svg viewBox="0 0 ${W} ${Hh}" class="chart"><path d="M24 ${Hh - 18}H${W - 6}M24 8V${Hh - 18}" stroke="#8a7458" stroke-width="1"/>`;
  for (let v = 0; v <= top; v += Math.ceil(top / 4 / 5) * 5) s += `<text x="20" y="${Y(v) + 3}" text-anchor="end" font-size="8" fill="#5c4630">${v}</text>`;
  for (let t = 0; t <= n; t += Math.max(4, Math.ceil(n / 6 / 4) * 4)) s += `<text x="${X(t)}" y="${Hh - 6}" text-anchor="middle" font-size="8" fill="#5c4630">${yearOf(t)}</text>`;
  const lines = L.houses.filter(x => x.c.some(v => v > 0)).sort((a, b) => (a.id === L.player) - (b.id === L.player));
  for (const x of lines) {
    let d = ''; x.c.forEach((v, t) => { if (v == null) return; d += (d ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(v).toFixed(1); });
    const mine = x.id === L.player;
    s += `<path d="${d}" fill="none" stroke="${x.col}" stroke-width="${mine ? 3.4 : 1.4}" stroke-opacity="${mine ? 1 : 0.75}"${mine ? '' : ' stroke-dasharray="0"'}/>`;
  }
  return s + `</svg><p class="sub">Your house is the thick line.</p>`;
}
// the time-lapse: the map's colours change turn by turn, with the year beside it
let LAPSE = null;
function playLapse(L) {
  L = L || loadJ(LAST_KEY, null); const svg = document.getElementById('lapse'); if (!L || !svg) return;
  if (LAPSE) clearInterval(LAPSE);
  const cols = L.houses.map(h => h.col);
  if (!svg.childElementCount) svg.innerHTML = `<defs><clipPath id="lapseclip"><path d="${LANDS.map(pathOf).join(' ')}"/></clipPath></defs><rect width="${MW}" height="${MH}" fill="#9fc3c8"/>` + LANDS.map(l => `<path d="${pathOf(l)}" fill="#d8cba5"/>`).join('') + `<g clip-path="url(#lapseclip)">${L.ids.map(id => `<path d="${CELLD[id]}" data-c="${id}" stroke="#5c4630" stroke-width="1.2"/>`).join('')}</g>`;
  const cells = [...svg.querySelectorAll('[data-c]')];
  const frames = L.own.map((s, t) => [t, s]).filter(x => x[1]);
  let i = 0;
  const step = () => {
    const [t, s] = frames[i];
    cells.forEach((el, k) => { const ch = s[k]; el.setAttribute('fill', ch === '.' || ch == null ? '#efe4c6' : cols[ch.charCodeAt(0) - 48] || '#999'); });
    const yr = document.getElementById('lapseyr'); if (yr) yr.textContent = `${dateStr(t)}`;
    if (++i >= frames.length) { clearInterval(LAPSE); LAPSE = null; }
  };
  step();
  LAPSE = setInterval(() => { if (!document.getElementById('lapse')) { clearInterval(LAPSE); LAPSE = null; return; } step(); }, Math.max(60, Math.min(160, 16000 / frames.length)));
}
function statsHistory(H) {
  if (!H.length) return '<p class="sub">Your finished games will be listed here.</p>';
  const wins = H.filter(g => g.won).length, by = {};
  for (const g of H) { const b = by[g.house] = by[g.house] || { n: 0, w: 0 }; b.n++; if (g.won) b.w++; }
  let h = `<h3>Your games</h3><p>${H.length} finished · ${wins} won · ${Math.round(wins / H.length * 100)}% won</p>
    <div class="byhouse">${Object.keys(by).map(k => `<span class="tag">${FACMAP[k] ? armsSvg(FACMAP[k].arms, 14) : ''} ${FACMAP[k] ? esc(FACMAP[k].name) : k} ${by[k].w}/${by[k].n}</span>`).join('')}</div>
    <div class="glist">${H.slice().reverse().map(g => `<div class="gitem${g.won ? ' won' : ''}">${FACMAP[g.house] ? armsSvg(FACMAP[g.house].arms, 26) : ''}<div style="min-width:0"><b>${esc(g.name)}</b> <span class="${g.won ? 'good' : 'bad'}">${g.won ? (g.how === 'conquest' ? 'conquest' : 'crowned') : 'lost'}</span><small>${new Date(g.when).toLocaleDateString()} · ${g.year} · ${g.turns} turns · ${DIFF[g.diff] ? DIFF[g.diff].n : ''}${g.challenge ? ' · challenge' : ''}</small></div><div class="pw"><b>+${g.points || 0}</b>pts</div></div>`).join('')}</div>`;
  return h;
}
const STAT_KEYS = [['Turns played', S => S.turns, 'turns'], ['Most counties', S => S.m.peakC], ['Battles won', S => S.m.won], ['Battles lost', S => S.m.lost, 'less'], ['Counties taken', S => S.m.taken], ['Enemies killed', S => S.m.kills], ['Men lost', S => S.m.menLost, 'less'], ['Lords captured', S => S.m.lords], ['Ransoms collected', S => S.m.ransomGold], ['Castles raised', S => S.m.castles], ['Largest treasury', S => S.m.peakG], ['Pacts and alliances', S => (S.m.pacts || 0) + (S.m.alliances || 0)]];
function statsVsAvg(S, H) {
  if (!S) return '<p class="sub">Finish a game to compare it with your others.</p>';
  const rest = H.filter(g => g.when !== S.when && g.m);
  if (!rest.length) return `<h3>Against your average</h3><p class="sub">This is your first finished game. From the next one on, each game is measured against your average.</p>`;
  const won = rest.filter(g => g.won);
  let h = `<h3>Against your average</h3><p class="sub">This game against the average of your ${rest.length} other finished game${rest.length === 1 ? '' : 's'}${won.length ? ` (and of your ${won.length} win${won.length === 1 ? '' : 's'} for the time to the crown)` : ''}.</p><div class="vs">`;
  for (const [n, f, how] of STAT_KEYS) {
    const pool = how === 'turns' && S.won && won.length ? won : rest;
    const avg = pool.reduce((s, g) => s + (f(g) || 0), 0) / pool.length, v = f(S) || 0;
    const better = how === 'less' || how === 'turns' ? v < avg : v > avg, same = Math.abs(v - avg) < 0.5;
    const mx = Math.max(v, avg, 1);
    h += `<div class="vsrow"><div class="vsn">${n}</div><div class="vsb"><i style="width:${pct(v, mx)}%" class="me"></i><i style="width:${pct(avg, mx)}%" class="avg"></i></div><div class="vsv"><b>${Math.round(v)}</b> <small>avg ${avg.toFixed(avg < 10 ? 1 : 0)}</small> <span class="${same ? '' : better ? 'good' : 'bad'}">${same ? '=' : v > avg ? '▲' : '▼'}</span></div></div>`;
  }
  return h + '</div><p class="sub">Gold bar: this game. Grey bar: your average.</p>';
}

// ---------- sharing ----------
function svgImg(svg) { return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }); }
async function shareCard(draw, name) {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 1350); g.addColorStop(0, '#f6ecd2'); g.addColorStop(1, '#e6d4a8'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
  x.strokeStyle = '#8e1f1b'; x.lineWidth = 14; x.strokeRect(24, 24, 1032, 1302); x.strokeStyle = '#e2b33c'; x.lineWidth = 4; x.strokeRect(46, 46, 988, 1258);
  x.fillStyle = '#8e1f1b'; x.font = '700 58px Cinzel, Georgia, serif'; x.textAlign = 'center'; x.fillText('Anointed', 540, 130); x.font = 'italic 30px Georgia, serif'; x.fillStyle = '#5c4630'; x.fillText(SC.game, 540, 172);
  x.fillStyle = '#5c4630'; x.font = 'italic 34px Georgia, serif'; x.fillText(`Anno Domini ${SC.date.y0}`, 540, 180);
  await draw(x);
  x.fillStyle = '#5c4630'; x.font = 'italic 28px Georgia, serif'; x.fillText('jdc001.github.io/crown-of-the-franks', 540, 1290);
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const file = new File([blob], name, { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Anointed' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const url = URL.createObjectURL(blob);
  showModal(`<h2>${ico('star')} Your card</h2><p class="sub">Press and hold the picture to save or share it.</p><img src="${url}" style="width:100%;border-radius:8px">`, '', { closable: true });
}
function wrapText(x, text, cx, y, w, lh) { const words = text.split(' '); let line = ''; for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (x.measureText(t).width > w && line) { x.fillText(line, cx, y); y += lh; line = wd; } else line = t; } if (line) x.fillText(line, cx, y); return y + lh; }
function shareGame() {
  const S = (G && G.recorded) || gameHistory().slice(-1)[0]; if (!S) return;
  const L = loadJ(LAST_KEY, null), P = profile(), r = rankOf(P.points);
  shareCard(async x => {
    const im = await svgImg(myAchievement(300)); if (im) x.drawImage(im, 120, 220, 300, 333);
    if (FACMAP[S.house]) { const hs = await svgImg(armsSvg(FACMAP[S.house].arms, 200)); if (hs) x.drawImage(hs, 680, 250, 200, 240); }
    x.fillStyle = '#2a1d12'; x.font = '700 50px Cinzel, Georgia, serif';
    x.fillText(S.won ? SC.crown.latin.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : 'The crown escapes me', 540, 640);
    x.font = '36px Georgia, serif'; x.fillStyle = '#5c4630';
    let y = wrapText(x, `${S.name}, ${S.won ? (S.how === 'conquest' ? 'every rival broken' : SC.crown.crowned) : 'beaten'}, in the year ${S.year}, after ${S.turns} turns.`, 540, 700, 880, 48);
    x.font = 'italic 32px Georgia, serif'; x.fillText(`${RANKS[r].n} · ${P.points} points${S.trophies && S.trophies.length ? ` · ${S.trophies.length} new troph${S.trophies.length === 1 ? 'y' : 'ies'}` : ''}`, 540, y + 6);
    if (L && L.own && L.own.length) {
      const s = L.own[L.own.length - 1] || L.own.filter(Boolean).pop(), cols = L.houses.map(h => h.col), sc = 430 / MH;
      x.save(); x.translate(540 - MW * sc / 2, y + 40); x.scale(sc, sc);
      x.beginPath(); x.rect(0, 0, MW, MH); x.clip();
      x.fillStyle = '#9fc3c8'; x.fillRect(0, 0, MW, MH);
      x.fillStyle = '#d8cba5'; for (const l of LANDS) x.fill(new Path2D(pathOf(l)));
      x.clip(new Path2D(LANDS.map(pathOf).join(' ')));
      L.ids.forEach((id, k) => { const ch = s[k]; x.fillStyle = ch === '.' ? '#efe4c6' : cols[ch.charCodeAt(0) - 48] || '#999'; const pth = new Path2D(CELLD[id]); x.fill(pth); x.strokeStyle = '#5c4630'; x.lineWidth = 2; x.stroke(pth); });
      x.restore();
    }
  }, 'anointed.png');
}
function shareRank() {
  const P = profile(), r = rankOf(P.points), got = Object.keys(P.trophies).length;
  shareCard(async x => {
    const im = await svgImg(myAchievement(520)); if (im) x.drawImage(im, 280, 230, 520, 577);
    x.fillStyle = RANKS[r].col; x.font = '700 64px Cinzel, Georgia, serif'; x.fillText(RANKS[r].n, 540, 900);
    x.fillStyle = '#5c4630'; x.font = '36px Georgia, serif';
    x.fillText(`${P.points} points · ${got} of ${TROPHIES.length} trophies · ${P.games} games`, 540, 970);
    const H = gameHistory(), w = H.filter(g => g.won).length; x.fillText(`${w} crown${w === 1 ? '' : 's'} won`, 540, 1025);
  }, 'my-rank.png');
}

// ---------- the Chronicler's challenge ----------
// A set start that changes from time to time: the same house, rivals and twists for every player while it lasts,
// so friends can compare how quickly they took the crown.
const CHALLENGES = SC.challenges;
const chalWeek = () => Math.floor((Date.now() / 864e5 + 3) / 7);
function currentChallenge() { const w = chalWeek(); return { ...CHALLENGES[w % CHALLENGES.length], seed: w }; }
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function startChallenge() {
  if (!fullGame()) return openUnlock('chal');
  const C = currentChallenge();
  sndUnlock();
  const rnd0 = Math.random; Math.random = mulberry(C.seed * 7919 + 13);
  try { newGame(C.house); } finally { Math.random = rnd0; }
  G.diff = C.diff; G.goal = 'king'; G.tut = null; G.challenge = { id: C.id + ':' + C.seed, n: C.n, mod: C.mod || {} };
  if (C.mod && C.mod.gold != null) G.fac[C.house].gold = C.mod.gold;
  $('#title').style.display = 'none'; setMusic('map'); applyLayout(); save(); render(); homeView(false); if (isPhone()) setSheet('peek'); showIntro(C.house);
}
function challengeBest() { const C = currentChallenge(), id = C.id + ':' + C.seed; const runs = gameHistory().filter(g => g.challenge === id); const w = runs.filter(g => g.won).sort((a, b) => a.turns - b.turns)[0]; return { runs: runs.length, best: w ? w.turns : null }; }
function challengeBox() {
  const C = currentChallenge(), B = challengeBest();
  return `<div class="chal"><div class="chalh">${ico('scroll')} <b>The Chronicler's Challenge</b></div><div style="display:flex;gap:10px;align-items:center">${armsSvg(FACMAP[C.house].arms, 40)}<div style="min-width:0"><b>${esc(C.n)}</b><small>${esc(C.d)} Everyone who takes it up starts the same way. It changes from time to time.</small>${B.runs ? `<small>${B.best ? `Your best: crowned in ${B.best} turns` : `${B.runs} attempt${B.runs === 1 ? '' : 's'}, no crown yet`}.</small>` : ''}</div></div><button class="btn gold" onclick="startChallenge()"><span class="lbl">${ico('flag')}Take up the challenge</span></button></div>`;
}
// ---------- the title: your rank ----------
function rankBox() { const P = profile(), r = rankOf(P.points), nx = RANKS[r + 1]; return `<div class="rankbox" style="border-color:${RANKS[r].col}" onclick="openMedals('rank')">${myAchievement(96)}<div style="min-width:0"><div class="rk">${RANKS[r].n}</div><small>${P.points} points${nx ? ` · ${nx.n} at ${nx.at}` : ''}</small><small>${Object.keys(P.trophies).length} of ${TROPHIES.length} trophies</small><span class="btn sm"><span class="lbl">${ico('crown')}Medals and arms</span></span></div></div>`; }
function refreshTitleRank() { const el = document.getElementById('titlerank'); if (el) el.innerHTML = rankBox(); }
