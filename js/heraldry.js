'use strict';
// ================= HERALDRY: THE PLAYER'S ACHIEVEMENT OF ARMS =================
// A full achievement drawn in SVG: the shield with a border in the rank's colour, the crown or coronet of the
// rank, and (as ranks unlock them) supporters, a laurel wreath and a mantle of estate. The player designs his
// own arms for the title screen and the medals page; in a game the same ornaments surround his house's shield.
const TINCTURES = [['#a3222c', 'Gules'], ['#26408a', 'Azure'], ['#2f6b3a', 'Vert'], ['#7a3f8f', 'Purpure'], ['#2a1d12', 'Sable'], ['#e2b33c', 'Or'], ['#f2ead6', 'Argent'], ['#c0602a', 'Tenné']];
const CHARGES = [['plain', 'Plain'], ['cross', 'Cross'], ['saltire', 'Saltire'], ['chevron', 'Chevron'], ['bend', 'Bend'], ['pale', 'Pale'], ['fess', 'Fess'], ['chief', 'Chief'], ['quarterly', 'Quarterly'], ['lion', 'Lion'], ['eagle', 'Eagle'], ['fleur', 'Fleur-de-lis'], ['star', 'Star'], ['tower', 'Tower'], ['roundels', 'Roundels'], ['semy', 'Semé']];
// supporters, the rank that unlocks them, and their colours
const SUPPORTERS = { none: { n: 'None', r: 0 }, lion: { n: 'Lions', r: 2, c: '#d9a634' }, hound: { n: 'Hounds', r: 2, c: '#e8e2d2' }, stag: { n: 'Stags', r: 3, c: '#8a5a30' }, wolf: { n: 'Wolves', r: 3, c: '#77706a' }, griffin: { n: 'Griffins', r: 4, c: '#c9962a' }, unicorn: { n: 'Unicorns', r: 5, c: '#f2ede2' }, eagle: { n: 'Eagles', r: 6, c: '#2a1d12' } };
const LOOK_OPTS = { laurel: 4, mantle: 5 }; // rank index that unlocks each

// ---------- pieces ----------
const PEARL = (x, y, r = 2.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6f1e4" stroke="#7a6a4a" stroke-width=".8"/>`;
const LEAF = (x, y, s = 1) => `<path transform="translate(${x},${y}) scale(${s})" d="M0 0c-5-3-6-9-2-13 1 3 3 3 2 0 3 2 4 7 0 13z" fill="#e2b33c" stroke="#7a5a14" stroke-width=".8"/>`;
// a crown or coronet for each rank, centred at 0,0 with its band on y=0, about 70 wide
function crownSvg(r) {
  const gold = '#e2b33c', dk = '#7a5a14';
  const band = `<rect x="-34" y="-2" width="68" height="12" rx="2" fill="${gold}" stroke="${dk}" stroke-width="1.2"/><rect x="-30" y="2" width="5" height="4" fill="#a3222c"/><rect x="-2.5" y="1" width="5" height="6" fill="#26408a"/><rect x="25" y="2" width="5" height="4" fill="#2f6b3a"/>`;
  switch (RANKS[r].id) {
    case 'seigneur': // a plain helm with a short crest
      return `<path d="M-16 8c0-14 6-22 16-22s16 8 16 22z" fill="#9aa3ad" stroke="#4a5058" stroke-width="1.4"/><rect x="-16" y="0" width="32" height="3" fill="#4a5058"/><path d="M-10 -4h20" stroke="#4a5058" stroke-width="1.4"/><path d="M0 -14c3-8 10-10 14-6-5 0-8 3-9 6z" fill="#a3222c"/>`;
    case 'baron': { let s = ''; for (let i = 0; i < 9; i++) s += PEARL(-30 + i * 7.5, -1 + (i % 2) * 2, 2.4); return band + s; }
    case 'viscount': { let s = ''; for (let i = 0; i < 5; i++) { const x = -28 + i * 14; s += `<path d="M${x - 3} -2 L${x} -9 L${x + 3} -2Z" fill="${gold}" stroke="${dk}" stroke-width=".8"/>` + PEARL(x, -11, 3.2); } return band + s; }
    case 'count': { let s = ''; for (let i = 0; i < 9; i++) { const x = -30 + i * 7.5; s += `<path d="M${x - 2} -2 L${x} -13 L${x + 2} -2Z" fill="${gold}" stroke="${dk}" stroke-width=".7"/>` + PEARL(x, -15, 2.4); } return band + s; }
    case 'marquis': { let s = ''; for (let i = 0; i < 5; i++) { const x = -28 + i * 14; s += i % 2 ? PEARL(x, -6, 2.8) : LEAF(x, -1, 1.1); } return band + s; }
    case 'duke': { let s = ''; for (let i = 0; i < 5; i++) s += LEAF(-28 + i * 14, -1, 1.35); return band + s; }
    case 'king': {
      let s = ''; for (let i = 0; i < 5; i++) { const x = -28 + i * 14; s += `<path transform="translate(${x},-2) scale(.75)" d="M0 -18c-3 4-3 9 0 13 3-4 3-9 0-13zM0 -5c-4-3-10-2-11 4 4 1 8 0 11-4zm0 0c4-3 10-2 11 4-4 1-8 0-11-4z" fill="${gold}" stroke="${dk}" stroke-width="1"/>`; }
      return `<path d="M-30 -4 C-26 -30 26 -30 30 -4" fill="#a3222c" stroke="${dk}" stroke-width="1.2"/><path d="M-30 -4 C-20 -26 -6 -30 0 -30 M30 -4 C20 -26 6 -30 0 -30" fill="none" stroke="${gold}" stroke-width="3"/><circle cx="0" cy="-33" r="5" fill="${gold}" stroke="${dk}"/><path d="M0 -38v-8M-3 -43h6" stroke="${gold}" stroke-width="2.4"/>` + band + s;
    }
    case 'emperor':
      return `<path d="M-32 6 V-18 C-32 -34 -6 -36 0 -24 C6 -36 32 -34 32 -18 V6Z" fill="#5a1f6e" stroke="${dk}" stroke-width="1.2"/><path d="M0 -24 V6 M-32 -10 H32" stroke="${gold}" stroke-width="3"/>${[-24, -12, 12, 24].map(x => PEARL(x, -10, 2.4)).join('')}<path d="M0 -26 C-4 -40 4 -40 0 -26" fill="${gold}"/><path d="M0 -40v-12M-5 -47h10" stroke="${gold}" stroke-width="3"/>` + band + `<circle cx="-14" cy="4" r="2.6" fill="#a3222c"/><circle cx="14" cy="4" r="2.6" fill="#2f6b3a"/>`;
  }
  return '';
}
// a rampant beast for the left side, facing right; mirrored for the right
function supporterSvg(kind) {
  const S = SUPPORTERS[kind]; if (!S || kind === 'none') return '';
  const c = S.c, o = '#2a1d12', w = 'stroke="' + o + '" stroke-width="1.6" stroke-linejoin="round"';
  if (kind === 'eagle') return `<g ${w} fill="${c}"><path d="M22 34c6-4 14-4 18 2l6-2-3 6c4 4 4 12 0 18l6 14-10-4-2 14-6-10-6 10-2-14-10 4 6-14c-4-6-4-14 0-18z"/><path d="M22 40C8 30 -2 44 2 60c6-6 12-6 18-2zM40 40c10-12 22-8 22 4-6-2-12 0-18 6z"/><circle cx="36" cy="30" r="1.6" fill="#f3e8cc" stroke="none"/><path d="M42 32l6 1-5 3z" fill="#e2b33c"/></g>`;
  const body = `<path d="M18 118l4-26c-6-6-8-16-4-26l4-22c2-8 10-12 16-8l6 6 10-6 4 4-8 6 6 6-4 4-8-4c0 8-2 14-6 18l8 10-4 4-8-8-2 10 6 20-6 2-6-16-6 14z" fill="${c}" ${w}/>`;
  const head = `<circle cx="40" cy="26" r="8" fill="${c}" ${w}/><path d="M46 26l8 2-7 3z" fill="${c}" ${w}/><circle cx="42" cy="24" r="1.2" fill="${o}"/>`;
  const tail = kind === 'lion' ? `<path d="M18 96C4 100 2 80 10 74" fill="none" ${w}/><circle cx="10" cy="72" r="4" fill="${c}" ${w}/>` : kind === 'griffin' ? `<path d="M18 96C6 104 0 90 6 82" fill="none" ${w}/>` : `<path d="M18 96c-6 2-8-4-6-8" fill="none" ${w}/>`;
  let extra = '';
  if (kind === 'lion') extra = `<path d="M30 18c-6 6-6 18 2 24 4-4 6-10 6-16" fill="#b9822a" ${w}/><path d="M38 18l2-6 3 6" fill="${c}" ${w}/>`;
  if (kind === 'hound') extra = `<path d="M36 22c-6 2-8 12-4 16 2-4 4-8 4-16z" fill="#bdb6a6" ${w}/>`;
  if (kind === 'stag') extra = `<path d="M38 18c-2-10 2-16 6-18M40 10l-6-4M42 4l4-4M36 18c-6-6-12-6-14-2M28 14l-2-6" fill="none" stroke="#5a3a1a" stroke-width="2"/>`;
  if (kind === 'wolf') extra = `<path d="M34 20l2-10 5 8M40 18l4-8 2 9" fill="${c}" ${w}/>`;
  if (kind === 'unicorn') extra = `<path d="M44 18l14-14-10 17z" fill="#e2b33c" ${w}/><path d="M34 22c-6 6-8 14-6 22 4-2 6-8 8-14" fill="#e2b33c" ${w}/>`;
  if (kind === 'griffin') extra = `<path d="M30 44C14 34 8 18 14 8c4 8 10 14 18 18" fill="${c}" ${w}/><path d="M18 20c4 4 8 6 12 8M16 28c4 4 10 6 14 6" stroke="${o}" stroke-width="1" fill="none"/>`;
  const headX = kind === 'griffin' ? `<circle cx="40" cy="26" r="8" fill="${c}" ${w}/><path d="M46 24l10 4-10 4z" fill="#e2b33c" ${w}/><circle cx="42" cy="24" r="1.2" fill="${o}"/>` : head;
  return tail + body + extra + headX;
}
function laurelSvg(goldLaurel) {
  const c = goldLaurel ? '#e2b33c' : '#3f6b34', k = goldLaurel ? '#7a5a14' : '#22401c';
  let s = '';
  for (const side of [-1, 1]) for (let i = 0; i < 8; i++) {
    const t = i / 7, ang = Math.PI * (0.55 + 0.75 * t), x = 100 + side * 56 * Math.cos(ang - Math.PI / 2) * 0.95, y = 118 + 60 * Math.sin(ang - Math.PI / 2) * 0.9;
    s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="9" transform="rotate(${(side * (20 + t * 70)).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${c}" stroke="${k}" stroke-width=".8"/>`;
  }
  return s + `<path d="M92 176c4 4 12 4 16 0" fill="none" stroke="#a3222c" stroke-width="4" stroke-linecap="round"/>`;
}
function mantleSvg(ermine) {
  let s = `<path d="M100 22 C60 22 26 40 14 64 C6 120 18 180 30 210 H170 C182 180 194 120 186 64 C174 40 140 22 100 22Z" fill="#8e1f1b" stroke="#5a120f" stroke-width="2"/>`;
  s += `<path d="M40 70 C40 140 50 190 58 210 H142 C150 190 160 140 160 70 C140 54 60 54 40 70Z" fill="${ermine ? '#f6f1e4' : '#c99a3a'}"/>`;
  if (ermine) for (let y = 80; y < 205; y += 18) for (let x = 54 + ((y / 18) % 2) * 9; x < 150; x += 18) s += `<path d="M${x} ${y}l-2 5h4zM${x} ${y + 4}v4" stroke="#2a1d12" stroke-width="1.6" fill="#2a1d12"/>`;
  return s + `<path d="M70 18 Q100 6 130 18 L134 26 Q100 14 66 26Z" fill="#e2b33c" stroke="#7a5a14"/>`;
}
// the whole achievement. arms: a coat of arms; r: rank index; look: { sup, laurel, mantle }; w: width in px
function achievementSvg(arms, r, look = {}, w = 200, opts = {}) {
  const rk = RANKS[r], sup = look.sup && SUPPORTERS[look.sup] && SUPPORTERS[look.sup].r <= r ? look.sup : 'none';
  const laurel = look.laurel && r >= LOOK_OPTS.laurel, mantle = look.mantle && r >= LOOK_OPTS.mantle;
  const id = 'sh' + (shieldN++);
  const inner = armsSvg(arms, 80, false, rk.col).replace('<svg ', `<svg x="60" y="64" `);
  const s = supporterSvg(sup);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 ${opts.noScroll ? 196 : 222}" width="${w}" height="${Math.round(w * (opts.noScroll ? 196 : 222) / 200)}" class="ach" data-id="${id}">
    ${mantle ? mantleSvg(r >= 6) : ''}
    ${laurel ? laurelSvg(r >= 7) : ''}
    ${s ? `<g transform="translate(2,46) scale(1.08)">${s}</g><g transform="translate(198,46) scale(-1.08,1.08)">${s}</g>` : ''}
    ${inner}
    <g transform="translate(100,${rk.id === 'seigneur' ? 58 : 54})">${crownSvg(r)}</g>
    ${opts.noScroll ? '' : `<g transform="translate(100,198)"><path d="M-66 -10 H66 L58 0 L66 10 H-66 L-58 0Z" fill="#f3e8cc" stroke="${rk.col}" stroke-width="2"/><text x="0" y="5" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="13" fill="#2a1d12" letter-spacing="2">${(opts.label || rk.n).toUpperCase()}</text></g>`}
  </svg>`;
}
// the player's achievement, from the profile
function myAchievement(w = 200, opts) { const P = profile(); return achievementSvg(P.arms, rankOf(P.points), P.look, w, opts); }
// in a game: the house's own shield, framed by the player's rank (crown, border, supporters, laurels)
function houseAchievement(fid, w) { const P = profile(); return achievementSvg(FAC(fid).arms, rankOf(P.points), P.look, w, { noScroll: true }); }

// ---------- the medals page ----------
const MED = { tab: 'rank' };
function openMedals(tab) {
  if (tab) MED.tab = tab;
  const P = profile(), r = rankOf(P.points), rk = RANKS[r], next = RANKS[r + 1];
  const got = Object.keys(P.trophies).length;
  const tabs = [['rank', 'Rank'], ['trophies', `Trophies ${got}/${TROPHIES.length}`], ['arms', 'Your arms']];
  let body = '';
  if (MED.tab === 'rank') {
    const H = gameHistory(), wins = H.filter(g => g.won).length;
    body = `<div class="ctr">${myAchievement(220)}</div>
      <p class="ctr" style="margin:4px 0"><b style="font:700 22px var(--head);color:${rk.col}">${rk.n}</b><br><span class="sub">${P.points} points${next ? ` · ${next.at - P.points} to ${next.n}` : ' · the highest rank'}</span></p>
      ${next ? `<div class="bar"><i style="width:${pct(P.points - rk.at, next.at - rk.at)}%"></i></div><p class="sub ctr">At ${next.n}: ${next.unlock}.</p>` : ''}
      <h3>The ladder</h3><div class="ladder">${RANKS.map((k, i) => `<div class="rung${i <= r ? ' on' : ''}" style="--c:${k.col}">${achievementSvg(P.arms, i, P.look, 54, { noScroll: true })}<b>${k.n}</b><small>${k.at} pts</small></div>`).join('')}</div>
      <p class="sub">Points come from trophies and from every game you finish: ${30} for a win (more against harder rivals), 8 for a loss.</p>
      <h3>Your record</h3><p>${P.games} game${P.games === 1 ? '' : 's'} finished · ${wins} won</p>
      <div class="row ctr"><button class="btn gold" onclick="shareRank()"><span class="lbl">${ico('star')}Share your rank</span></button>${H.length ? `<button class="btn" onclick="closeModal();openStats(null, 1)"><span class="lbl">${ico('scroll')}Past games</span></button>` : ''}</div>`;
  } else if (MED.tab === 'trophies') {
    const card = t => { const g = P.trophies[t.id]; return `<div class="trophy${g ? ' on' : ''}"><div class="tm">${ico(g ? 'star' : 'lock')}</div><div style="min-width:0"><b>${t.n}</b><small>${t.d}</small>${g ? `<i>Won ${new Date(g.when).toLocaleDateString()}${g.house && FACMAP[g.house] ? ' as ' + FACMAP[g.house].name : ''}</i>` : ''}</div><div class="tp">${t.pts}</div></div>`; };
    body = `<h3>The houses</h3><p class="sub">Win the crown with each of the fourteen houses.</p><div class="trophies">${TROPHIES.filter(t => t.kind === 'house').map(card).join('')}</div>
      <h3>Feats</h3><div class="trophies">${TROPHIES.filter(t => t.kind !== 'house').map(card).join('')}</div>`;
  } else {
    const a = P.arms, L = P.look;
    const tin = (k, cur) => `<div class="tins">${TINCTURES.map(([c, n]) => `<button class="${cur === c ? 'on' : ''}" style="background:${c}" title="${n}" onclick="setArms('${k}','${c}')"></button>`).join('')}</div>`;
    body = `<div class="ctr">${myAchievement(200)}</div>
      <h3>Field</h3>${tin('f', a.f)}
      <h3>Charge</h3><div class="charges">${CHARGES.map(([t, n]) => `<button class="${a.t === t ? 'on' : ''}" onclick="setArms('t','${t}')" title="${n}">${armsSvg({ ...a, t }, 30)}<small>${n}</small></button>`).join('')}</div>
      <h3>Charge colour</h3>${tin('c', a.c)}
      <h3>Supporters</h3><div class="seg" style="display:flex;flex-wrap:wrap">${Object.keys(SUPPORTERS).map(k => { const S = SUPPORTERS[k], ok = S.r <= r; return `<button class="${(L.sup || 'none') === k ? 'on' : ''}" ${ok ? '' : 'disabled'} onclick="setLook('sup','${k}')">${S.n}${ok ? '' : ` <small>(${RANKS[S.r].n})</small>`}</button>`; }).join('')}</div>
      <h3>Ornaments</h3><div class="seg" style="display:flex;flex-wrap:wrap">${Object.keys(LOOK_OPTS).map(k => { const ok = r >= LOOK_OPTS[k]; return `<button class="${L[k] ? 'on' : ''}" ${ok ? '' : 'disabled'} onclick="setLook('${k}',${!L[k]})">${k === 'laurel' ? 'Laurel wreath' : 'Mantle of estate'}${ok ? '' : ` <small>(${RANKS[LOOK_OPTS[k]].n})</small>`}</button>`; }).join('')}</div>
      <p class="sub">Your crown and the colour of your shield's border come with your rank. In a game, your house keeps its own arms, framed by your rank's crown, border and ornaments.</p>`;
  }
  showModal(`<h2>${ico('crown')} Medals and arms</h2><div class="tabs">${tabs.map(([id, n]) => `<button class="${MED.tab === id ? 'on' : ''}" onclick="openMedals('${id}')">${n}</button>`).join('')}</div>${body}`, 'wide', { closable: true });
}
function setArms(k, v) { const P = profile(); P.arms = { ...P.arms, [k]: v }; if (k === 'f' && P.arms.c === v) P.arms.c = v === '#e2b33c' ? '#a3222c' : '#e2b33c'; saveProfile(P); sfx('click'); openMedals('arms'); if (typeof refreshTitleRank === 'function') refreshTitleRank(); }
function setLook(k, v) { const P = profile(); P.look = { ...P.look, [k]: v }; saveProfile(P); sfx('click'); openMedals('arms'); if (typeof refreshTitleRank === 'function') refreshTitleRank(); }
