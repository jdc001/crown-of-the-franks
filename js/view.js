'use strict';
// ================= SHELL: settings, layout, sheet, modal, toast, drawer, overlay, hints =================
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const me = () => G.player;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- settings ----------
const SETTINGS_KEY = 'cotf-settings-v1';
const SET = Object.assign({ replay: 'near', layout: 'auto', hints: true, confirmEnd: true, motion: true, music: true, sfxOn: true, speed: 1, seenHints: {} }, (() => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; } })());
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SET)); } catch (e) { } }

// ---------- layout ----------
const LAYOUT = { mode: 'd' };
function detectLayout() {
  if (SET.layout === 'phone') return 'm';
  if (SET.layout === 'desktop') return 'd';
  const w = window.innerWidth, h = window.innerHeight;
  const coarse = matchMedia('(pointer: coarse)').matches;
  return (w < 760 || (coarse && w < 1000 && h > w)) ? 'm' : 'd';
}
function applyLayout() {
  const m = detectLayout();
  const changed = m !== LAYOUT.mode;
  LAYOUT.mode = m;
  document.body.classList.toggle('m', m === 'm');
  document.body.classList.toggle('d', m === 'd');
  document.body.classList.toggle('nomotion', !SET.motion);
  if (changed && typeof applyView === 'function' && mapEl) applyView();
  if (m === 'd') $('#panel').classList.remove('half', 'full', 'hid');
  renderDock();
}
const isPhone = () => LAYOUT.mode === 'm';

// ---------- haptics ----------
function buzz(ms = 12) { if (SET.sfxOn && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { } } }

// ---------- bottom sheet ----------
const SHEET = { state: 'peek' };
function setSheet(state) {
  SHEET.state = state;
  const p = $('#panel');
  p.classList.remove('half', 'full', 'hid', 'peek');
  if (state !== 'peek') p.classList.add(state);
  if (state !== 'full') $('#pbody').scrollTop = 0;
}
function initSheet() {
  const p = $('#panel'), grip = $('#grip'), body = $('#pbody');
  let drag = null;
  const H = () => p.getBoundingClientRect().height;
  const yFor = s => s === 'full' ? 0 : s === 'half' ? H() * 0.5 : H() - 92;
  const start = (e, fromBody) => {
    if (!isPhone()) return;
    if (fromBody && SHEET.state === 'full' && body.scrollTop > 0) return;
    drag = { y0: e.clientY, t0: Date.now(), base: yFor(SHEET.state), fromBody, moved: false, last: e.clientY, lastT: Date.now() };
  };
  const move = e => {
    if (!drag) return;
    const dy = e.clientY - drag.y0;
    if (drag.fromBody) {
      // only take over from the scroll when pulling down at the top, or pulling up when not full
      if (!drag.moved && Math.abs(dy) < 8) return;
      if (!drag.moved && SHEET.state === 'full' && dy < 0) { drag = null; return; }
    }
    drag.moved = true;
    p.classList.add('dragging');
    const y = Math.max(0, Math.min(H() - 60, drag.base + dy));
    p.style.transform = `translateY(${y}px)`;
    drag.vel = (e.clientY - drag.last) / Math.max(1, Date.now() - drag.lastT); drag.last = e.clientY; drag.lastT = Date.now();
    if (e.cancelable) e.preventDefault();
  };
  const end = () => {
    if (!drag) return;
    const d = drag; drag = null;
    p.classList.remove('dragging'); p.style.transform = '';
    if (!d.moved) return;
    const y = d.base + (d.last - d.y0), h = H(), v = d.vel || 0;
    let s;
    if (v < -0.6) s = SHEET.state === 'peek' ? 'half' : 'full';
    else if (v > 0.6) s = SHEET.state === 'full' ? 'half' : 'peek';
    else s = y < h * 0.25 ? 'full' : y < h * 0.72 ? 'half' : 'peek';
    setSheet(s);
  };
  grip.addEventListener('pointerdown', e => { start(e, false); grip.setPointerCapture(e.pointerId); });
  grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
  grip.addEventListener('click', () => { if (!isPhone()) return; setSheet(SHEET.state === 'peek' ? 'half' : SHEET.state === 'half' ? 'full' : 'peek'); });
  body.addEventListener('pointerdown', e => { if (e.target.closest('button,a,input')) return; start(e, true); });
  body.addEventListener('pointermove', move, { passive: false }); body.addEventListener('pointerup', end); body.addEventListener('pointercancel', end);
}

// ---------- modal ----------
function showModal(html, cls, opts = {}) {
  const c = $('#mcard'); c.className = 'card' + (cls ? ' ' + cls : '');
  c.innerHTML = (opts.closable ? `<button class="x" onclick="closeModal()" aria-label="Close">${ico('close')}</button>` : '') + html;
  $('#modal').classList.remove('hidden'); c.scrollTop = 0;
}
// an offscreen canvas for parts of a scene that do not change from frame to frame
function makeLayer(w, h, dpr, fn) { const c = document.createElement('canvas'); c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); const g = c.getContext('2d'); g.scale(dpr, dpr); if (fn) fn(g); return c; }
// iOS keeps a closed canvas's memory until it gets round to collecting it, and once its graphics budget
// is used up, new canvases are drawn without the GPU and crawl. So a scene's canvases are emptied the moment it ends.
function releaseScene(S) {
  if (!S) return;
  for (const k of ['ground', 'vig', 'corpC', 'sky', 'land']) if (S[k]) { S[k].width = S[k].height = 0; S[k] = null; }
  if (S.ctx && S.ctx.canvas) { S.ctx.canvas.width = S.ctx.canvas.height = 0; }
  S.ctx = S.corpX = null;
}
function closeModal() {
  $('#modal').classList.add('hidden');
  if (typeof CT !== 'undefined' && CT) { CT.dead = true; releaseScene(CT); CT = null; }
  if (typeof BV !== 'undefined' && BV) { BV.dead = true; releaseScene(BV); BV = null; }
  if (typeof MG !== 'undefined' && MG) { MG.dead = true; releaseScene(MG); MG = null; }
  setMusic('map');
}
const modalOpen = () => !$('#modal').classList.contains('hidden');
$('#modal').addEventListener('pointerdown', e => { if (e.target === e.currentTarget && $('#mcard').dataset.dismiss === '1') closeModal(); });

// ---------- toast ----------
function toast(t, icon) {
  const el = $('#toast'); el.innerHTML = (icon ? ico(icon) : '') + esc(t); el.classList.add('show');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2000);
}

// ---------- drawer ----------
function openDrawer(html) {
  const d = $('#drawer'); d.innerHTML = `<div class="drw">${html}</div>`; d.classList.remove('hidden');
  let dim = $('#dim'); if (!dim) { dim = document.createElement('div'); dim.id = 'dim'; dim.className = 'dim'; dim.onclick = closeDrawer; document.body.appendChild(dim); }
  dim.classList.remove('hidden');
}
function closeDrawer() { $('#drawer').classList.add('hidden'); const d = $('#dim'); if (d) d.classList.add('hidden'); renderDock(); }
const drawerOpen = () => !$('#drawer').classList.contains('hidden');

// ---------- shields ----------
let shieldN = 0;
function shield(fid, size = 26, flag) { return armsSvg(fid ? FAC(fid).arms : { t: 'plain', f: '#e9ddbc', c: '#8b7a55' }, size, flag); }
const SHIELD_PATH = 'M2,2 H38 V20 C38,34 28,42 20,46 C12,42 2,34 2,20 Z';
// the inside of a coat of arms: field colour a.f, charge a.t in colour a.c (and a.c2 for some)
function armsCharge(a, path) {
  switch (a.t) {
    case 'lion': return `<path d="M15 10c3-2 7-1 8 2l3-1-1 3c2 1 3 3 2 5l3 2-3 1 1 4c2 1 3 4 2 6l-3-2-2 5-2-1v-4l-4 2-1 5-3-1 1-6c-3-1-4-4-3-7l-3 1 1-4 3-1c-1-3 0-6 1-8z" fill="${a.c}"/>`;
    case 'fess2': return `<rect x="0" y="12" width="40" height="6" fill="${a.c}"/><rect x="0" y="26" width="40" height="6" fill="${a.c}"/>`;
    case 'bendCot': return `<path d="M-4,4 L8,-4 L46,40 L34,48Z" fill="${a.c}"/><path d="M-6,12 L-3,10 L37,52 L34,54Z M6,-6 L9,-8 L49,34 L46,36Z" fill="${a.c2 || '#e2b33c'}"/>`;
    case 'bendy': { let s = ''; for (let i = -6; i < 8; i++) if (i % 2) s += `<path d="M${i * 7},0 L${i * 7 + 7},0 L${i * 7 + 47},48 L${i * 7 + 40},48Z" fill="${a.c}"/>`; return s + `<path d="${path}" fill="none" stroke="${a.c2}" stroke-width="5"/>`; }
    case 'pallets': return [7, 15, 23, 31].map(x => `<rect x="${x}" y="0" width="4" height="48" fill="${a.c}"/>`).join('');
    case 'cross': return `<rect x="14" y="0" width="7" height="48" fill="${a.c}"/><rect x="0" y="16" width="40" height="7" fill="${a.c}"/>`;
    case 'barry': { let s = ''; for (let i = 0; i < 10; i++) if (i % 2) s += `<rect x="0" y="${i * 5}" width="40" height="5" fill="${a.c}"/>`; return s; }
    case 'perpale': return `<rect x="20" y="0" width="20" height="48" fill="${a.c}"/><circle cx="20" cy="22" r="5" fill="#e2b33c"/>`;
    case 'perfess': return `<rect x="0" y="22" width="40" height="26" fill="${a.c}"/><circle cx="20" cy="22" r="5" fill="#f2ead6"/>`;
    case 'semy': { let s = ''; for (let y = 6; y < 44; y += 9) for (let x = 6 + (y % 2) * 4; x < 38; x += 9) s += `<path d="M${x},${y - 3} l1.6,3 -1.6,3 -1.6,-3z" fill="${a.c}"/>`; return s; }
    // charges for a player's own arms
    case 'chevron': return `<path d="M-2,38 L20,14 L42,38 L42,46 L20,22 L-2,46Z" fill="${a.c}"/>`;
    case 'saltire': return `<path d="M-2,2 L4,-2 L42,44 L36,48Z M42,2 L36,-2 L-2,44 L4,48Z" fill="${a.c}"/>`;
    case 'chief': return `<rect x="0" y="0" width="40" height="14" fill="${a.c}"/>`;
    case 'bend': return `<path d="M-4,6 L6,-4 L46,38 L36,48Z" fill="${a.c}"/>`;
    case 'quarterly': return `<rect x="20" y="0" width="20" height="20" fill="${a.c}"/><rect x="0" y="20" width="20" height="28" fill="${a.c}"/>`;
    case 'pale': return `<rect x="14" y="0" width="12" height="48" fill="${a.c}"/>`;
    case 'fess': return `<rect x="0" y="17" width="40" height="11" fill="${a.c}"/>`;
    case 'fleur': return `<path d="M20 8c-3 4-3 9 0 13 3-4 3-9 0-13zM20 21c-4-3-10-2-11 4 4 1 8 0 11-4zm0 0c4-3 10-2 11 4-4 1-8 0-11-4zM16 24h8v3h-8zM18 27h4l-1 8h-2z" fill="${a.c}"/>`;
    case 'eagle': return `<path d="M20 9c2 0 3 2 3 3l2 1-2 1v3l7-6 3 2-3 4 4 1-4 3 2 3-6-1-2 4 3 5h-3l-2-3-2 3h-3l3-5-2-4-6 1 2-3-4-3 4-1-3-4 3-2 7 6v-3l-2-1 2-1c0-1 1-3 3-3z" fill="${a.c}"/>`;
    case 'star': return `<path d="M20 9l3.2 8.6 9.2.3-7.2 5.7 2.6 8.8-7.8-5.2-7.6 5.2 2.5-8.8-7.2-5.7 9.2-.3z" fill="${a.c}"/>`;
    case 'tower': return `<path d="M12 36V18h3v-4h3v4h4v-4h3v4h3v18zM18 36v-6a2 2 0 0 1 4 0v6z" fill="${a.c}"/><rect x="18" y="22" width="4" height="4" fill="${a.f}"/>`;
    case 'roundels': return [[12, 14], [28, 14], [20, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${a.c}"/>`).join('');
    case 'plain': return '';
    default: return `<path d="M8 14h24M8 22h24" stroke="${a.c}" stroke-width="1.5" opacity=".5"/>`;
  }
}
function armsSvg(a, size = 26, flag, border) {
  const id = 'sh' + (shieldN++);
  const path = flag ? 'M0,0 H40 V40 L30,48 L20,40 L10,48 L0,40 Z' : SHIELD_PATH;
  const ch = armsCharge(a, path);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="shield" viewBox="0 0 40 48" width="${size}" height="${Math.round(size * 1.2)}"><defs><clipPath id="${id}"><path d="${path}"/></clipPath><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs><g clip-path="url(#${id})"><rect width="40" height="48" fill="${a.f}"/>${ch}<rect width="40" height="48" fill="url(#${id}g)"/></g><path d="${path}" fill="none" stroke="${border || '#2a1d12'}" stroke-width="${border ? 3.2 : 2.4}"/></svg>`;
}
const fname = fid => fid ? FAC(fid).name : '';
// replace an element's contents only when they changed (each shield carries a fresh id, so ids are ignored in the comparison)
function setHTML(el, h) { if (!el) return false; const k = h.replace(/sh\d+/g, ''); if (el._h === k) return false; el._h = k; el.innerHTML = h; return true; }
const armsCache = {};
function armsImage(fid) {
  const key = fid || '_';
  if (!armsCache[key]) { const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(shield(fid, 40, true)); armsCache[key] = img; }
  return armsCache[key];
}
// the arms as a bitmap: drawing an SVG image into a canvas every frame is very slow on iOS
const armsBmp = {};
function armsSprite(fid) {
  const key = fid || '_'; if (armsBmp[key]) return armsBmp[key];
  const img = armsImage(fid); if (!img.complete || !img.naturalWidth) return null;
  const d = Math.min(2, window.devicePixelRatio || 1);
  return (armsBmp[key] = makeLayer(30, 36, d, g => g.drawImage(img, 0, 0, 30, 36)));
}
const MIXC = new Map();
function mix(h1, h2, t) {
  const key = h1 + h2 + t; const hit = MIXC.get(key); if (hit) return hit;
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const c = s => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  const v = '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
  MIXC.set(key, v); return v;
}
// the parchment grain, drawn once into a small PNG (an SVG noise filter re-renders on every repaint, which iOS does slowly)
function makeTex() {
  try {
    const S = 240, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
    const octs = [[10, 0.45], [30, 0.35], [80, 0.2]].map(([n, w]) => { const v = new Float32Array(n * n); for (let i = 0; i < v.length; i++) v[i] = Math.random(); return { n, w, v }; });
    const samp = (o, x, y) => { const fx = x * o.n / S, fy = y * o.n / S, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, n = o.n;
      const at = (i, j) => o.v[((j % n) * n) + (i % n)]; const a = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx, b = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx; return a * (1 - ty) + b * ty; };
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let v = 0; for (const o of octs) v += samp(o, x, y) * o.w;
      const k = (y * S + x) * 4; d[k] = 107; d[k + 1] = 77; d[k + 2] = 38; d[k + 3] = Math.round(0.11 * 255 * clamp((v - 0.5) * 1.8 + 0.5, 0, 1));
    }
    g.putImageData(img, 0, 0);
    document.documentElement.style.setProperty('--tex', `url(${c.toDataURL('image/png')})`);
  } catch (e) { }
}
const coin = n => `<b class="num">${n}</b>&thinsp;d`;
const pct = (n, d) => Math.round(100 * n / Math.max(1, d));
// unit string with SVG icons (overrides the emoji version from core.js; same signature)
function uStr(u, withMil, withExtra = true) {
  const keys = (withMil ? ['militia'] : []).concat(['foot', 'bow', 'cav']).concat(withExtra ? ['cat'] : []);
  const parts = keys.filter(t => (u[t] || 0) > 0).map(t => `<span class="u" title="${LBL[t]}">${ico(UNIT_ICON[t])}${u[t]}</span>`);
  return parts.length ? parts.join(' ') : '<span class="sub">no men</span>';
}
const statLine = t => t === 'cat' ? 'Range 6 from walls' : t === 'bishop' ? 'Council of bishops' : `Atk ${UNIT[t].atk}${UNIT[t].rng ? ' · Range ' + UNIT[t].rng : ''}${UNIT[t].chg ? ' · Charge ' + UNIT[t].chg : ''} · HP ${UNIT[t].hp}`;
function oddsTxt(v) { return v >= 70 ? `<span class="good">${v}%</span>` : v >= 40 ? `<b>${v}%</b>` : `<span class="bad">${v}%</span>`; }

// ---------- accordion state ----------
const ACC = Object.assign({ crowns: false, army: true, marriage: false, realm: false, houses: false, prisoners: true }, (() => { try { return JSON.parse(localStorage.getItem('cotf-acc')) || {}; } catch (e) { return {}; } })());
function acc(id, title, icon, body, count) {
  return `<div class="acc${ACC[id] ? ' open' : ''}" id="acc-${id}"><div class="ah" onclick="toggleAcc('${id}')">${ico(icon)}${title}${count !== undefined ? `<span class="cnt">${count}</span>` : ''}${ico('next', 'car')}</div><div class="ab">${body}</div></div>`;
}
function toggleAcc(id) { if (id === 'road') { tutorDid('goal'); setTimeout(renderTutor, 0); } ACC[id] = !ACC[id]; try { localStorage.setItem('cotf-acc', JSON.stringify(ACC)); } catch (e) { } const el = $('#acc-' + id); if (el) el.classList.toggle('open', ACC[id]); }

// ---------- turn overlay: see replay.js ----------

// ---------- hints ----------
const HINTS = {
  start: { t: 'Your capital', b: 'Tap your capital to raise troops, build, and move men between garrison and army. Green dots mark where your army can march; red dashes mark what it can strike.' },
  firstSel: { t: 'The county sheet', b: 'Drag the sheet up for everything you can do here. The main action always sits at the bottom.' },
  peace: { t: 'The Peace of God', b: 'No war between the great houses until Summer 988. Use the year to build farms and markets, win minor lords, and gather an army.' },
  army: { t: 'Your armies', b: 'Each army marches up to two counties a turn, then strikes. Switch armies with the tabs over the map. Men in the field are paid every turn; garrisons are free.' },
  siege: { t: 'Siege begun', b: 'Each turn the garrison starves and the walls weaken. Bombard with catapults, then storm when the odds turn.' },
  captive: { t: 'Your lord is captive', b: 'No army can take the field until he is ransomed. The price falls the longer he is held.' },
  endturn: { t: 'Ending the turn', b: 'When you are done, press End turn. The other houses move, then the chronicle tells you what happened.' },
};
function hint(id) {
  if (!SET.hints || SET.seenHints[id] || modalOpen() || (G && G.tut)) return;
  const h = HINTS[id]; if (!h) return;
  SET.seenHints[id] = true; saveSettings();
  const el = $('#hintbox');
  el.innerHTML = `${ico('info')}<div><b>${esc(h.t)}</b>${esc(h.b)}</div><button onclick="closeHint()">OK</button>`;
  el.classList.remove('hidden');
  clearTimeout(el._t); el._t = setTimeout(closeHint, 12000);
}
function closeHint() { $('#hintbox').classList.add('hidden'); }

// ---------- dock (phone bottom nav) ----------
function renderDock() {
  const d = $('#dock'); if (!d || !G) return;
  const sel = G.sel;
  const F = G.fac[me()];
  const alerts = (G.offers.length || 0) + (F.captive ? 1 : 0);
  setHTML(d, `
    <button class="dk${!sel && !drawerOpen() ? ' on' : ''}" onclick="dockRealm()">${ico('map')}Realm</button>
    <button class="dk" onclick="openCourt()">${ico('fleur')}Court</button>
    <button class="dk" onclick="openDiplo()">${ico('handshake')}Envoys</button>
    <button class="dk" onclick="openPope()">${ico('church')}Church</button>
    <button class="dk${drawerOpen() ? ' on' : ''}" onclick="openLog()">${ico('scroll')}Chronicle${G.unread ? `<span class="badge">${G.unread}</span>` : ''}</button>
    <button class="dk end${endTurnReady() ? ' pulse' : ''}" onclick="playerEndTurn()">${ico('next')}End turn</button>`);
}
function dockRealm() { closeDrawer(); if (G.sel) { G.sel = null; render(); } setSheet(SHEET.state === 'peek' ? 'half' : SHEET.state === 'half' ? 'full' : 'half'); }
function endTurnReady() { return usableArmies(me()).every(a => a.acted || armySize(a) === 0); }

// ---------- canvas fitting: in portrait on a phone the field is turned sideways to fill the screen ----------
const portraitPhone = () => isPhone() && window.innerHeight > window.innerWidth * 1.1;
// shrink a scene so that the whole card, down to its last control, fits on the screen without scrolling
// (an iPad on its side is wide but short, and a full-width field pushed the buttons off the bottom)
function shrinkToFit(cv, LW, LH, lastSel) {
  const card = cv && cv.closest('.card'); if (!card || cv.closest('.rotbox') || document.body.classList.contains('m')) { if (cv) cv._fit = null; return; }
  cv._fit = [LW, LH, lastSel]; cv.style.width = ''; cv.style.height = ''; cv.style.margin = '';
  const kids = [...card.querySelectorAll(lastSel || '.btn')].filter(e => e.offsetParent); const last = kids[kids.length - 1]; if (!last) return;
  // measured from layout offsets, not screen rectangles, so the card's opening animation cannot skew it
  const top = el => { let y = 0; for (let e = el; e && e !== card; e = e.offsetParent) y += e.offsetTop; return y; };
  const pad = parseFloat(getComputedStyle(card).paddingBottom) || 0, over = top(last) + last.offsetHeight + pad - card.clientHeight + 2;
  if (over <= 0) return;
  const h0 = cv.offsetHeight, h = Math.max(150, h0 * 0.55, h0 - over);
  cv.style.height = h + 'px'; cv.style.width = Math.round(h * LW / LH) + 'px'; cv.style.margin = '0 auto';
}
window.addEventListener('resize', () => { for (const cv of document.querySelectorAll('.card canvas')) if (cv._fit) shrinkToFit(cv, ...cv._fit); });
function fitCanvas(cv, LW, LH) {
  const wrap = cv.parentElement;
  if (!portraitPhone()) { cv.style.cssText = ''; shrinkToFit(cv, LW, LH); return { rotated: false, pt: e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * LW / r.width, y: (e.clientY - r.top) * LH / r.height }; } }; }
  const W = wrap.clientWidth || window.innerWidth - 12, maxH = window.innerHeight - 250;
  const H = Math.min(W * LW / LH, maxH), w = H * LH / LW;
  const box = document.createElement('div'); box.className = 'rotbox'; box.style.cssText = `position:relative;width:${w}px;height:${H}px;margin:0 auto;overflow:hidden;border-radius:8px;border:1px solid #5e4515`;
  cv.parentNode.insertBefore(box, cv); box.appendChild(cv);
  cv.style.cssText = `position:absolute;left:0;top:0;width:${H}px;height:${w}px;transform:translateY(${H}px) rotate(-90deg);transform-origin:top left;border:0;border-radius:0`;
  return { rotated: true, pt: e => { const r = box.getBoundingClientRect(); const sx = e.clientX - r.left, sy = e.clientY - r.top; return { x: (H - sy) * LW / H, y: sx * LH / w }; } };
}
