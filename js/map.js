'use strict';
// ================= MAP =================
const VIEW = { x: 0, y: 0, w: 600, h: 600 };
let mapEl = null, ovQueued = false, viewAnim = null, ovScale = 0;
// measure the frame around the map, not the map itself: the map may be mid-gesture under a CSS transform
const mapRect = () => $('#mapwrap').getBoundingClientRect();
function svgSize() { const r = mapRect(); return { w: Math.max(1, r.width), h: Math.max(1, r.height) }; }
// While a finger pans or pinches, the drawn map is slid and scaled as a picture (cheap, done by the GPU).
// The real view is changed once, when the gesture ends, so the SVG is redrawn once instead of every frame.
let GX = { dx: 0, dy: 0, k: 1 };
function setMapTransform(dx, dy, k) { GX = { dx, dy, k }; mapEl.style.transform = (dx || dy || k !== 1) ? `translate3d(${dx.toFixed(1)}px,${dy.toFixed(1)}px,0) scale(${k.toFixed(4)})` : ''; }
function commitGesture() {
  if (!GX.dx && !GX.dy && GX.k === 1) return;
  const ppu = svgSize().w / VIEW.w;
  VIEW.x -= GX.dx / (GX.k * ppu); VIEW.y -= GX.dy / (GX.k * ppu); VIEW.w /= GX.k;
  applyView(); setMapTransform(0, 0, 1);
}
let animCur = null;
function stopViewAnim() { if (viewAnim) { cancelAnimationFrame(viewAnim); viewAnim = null; } if (animCur) { Object.assign(VIEW, animCur); animCur = null; applyView(); setMapTransform(0, 0, 1); } }
function applyView() {
  const s = svgSize();
  VIEW.h = VIEW.w * s.h / s.w;
  VIEW.x = clamp(VIEW.x, -150, MW - VIEW.w + 150); VIEW.y = clamp(VIEW.y, -150, MH - VIEW.h + 150);
  mapEl.setAttribute('viewBox', `${VIEW.x.toFixed(1)} ${VIEW.y.toFixed(1)} ${VIEW.w.toFixed(1)} ${VIEW.h.toFixed(1)}`);
  // the overlay is drawn in map space, so panning never needs a rebuild; only a change of zoom does
  const sc = clamp(VIEW.w / 720, 0.5, 1.5);
  if (Math.abs(sc - ovScale) > 0.06 && !ovQueued) { ovQueued = true; requestAnimationFrame(() => { ovQueued = false; if (G) renderOverlay(); }); }
}
// where the map is actually visible (the phone sheet covers the bottom part)
function visibleCenter() {
  const s = svgSize();
  if (!isPhone()) return { cx: 0.5, cy: 0.5 };
  const cover = SHEET.state === 'full' ? 1 : SHEET.state === 'half' ? 0.5 : 92 / s.h;
  return { cx: 0.5, cy: Math.max(0.2, (1 - cover) / 2) };
}
function centerOn(x, y, w, animate = true) {
  const s = svgSize(), { cx, cy } = visibleCenter();
  const nw = clamp(w || VIEW.w, 220, MW * 1.15), nh = nw * s.h / s.w;
  const target = { x: clamp(x - nw * cx, -150, MW - nw + 150), y: clamp(y - nh * cy, -150, MH - nh + 150), w: nw };
  stopViewAnim(); commitGesture();
  // a long jump is made at once: sliding the old picture would show empty edges for most of the way
  const far = Math.hypot(target.x + nw / 2 - VIEW.x - VIEW.w / 2, target.y + nh / 2 - VIEW.y - VIEW.h / 2) > VIEW.w * 0.6 || nw / VIEW.w > 1.6 || VIEW.w / nw > 1.6;
  if (!animate || !SET.motion || far) { Object.assign(VIEW, target); applyView(); return; }
  const from = { x: VIEW.x, y: VIEW.y, w: VIEW.w }, ppu = s.w / VIEW.w, t0 = performance.now(), dur = 380;
  const tick = now => {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    const v = { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, w: from.w + (target.w - from.w) * e }, sc = from.w / v.w;
    animCur = v; setMapTransform((from.x - v.x) * sc * ppu, (from.y - v.y) * sc * ppu, sc);
    if (k < 1) viewAnim = requestAnimationFrame(tick);
    else { viewAnim = null; animCur = null; Object.assign(VIEW, target); applyView(); setMapTransform(0, 0, 1); }
  };
  viewAnim = requestAnimationFrame(tick);
}
function zoomAt(f, cx, cy) {
  stopViewAnim(); commitGesture();
  const nw = clamp(VIEW.w * f, 220, MW * 1.15), k = nw / VIEW.w;
  VIEW.x = cx - (cx - VIEW.x) * k; VIEW.y = cy - (cy - VIEW.y) * k; VIEW.w = nw; applyView();
}
function toMap(cx, cy) { const r = mapRect(); return [VIEW.x + (cx - r.left) / r.width * VIEW.w, VIEW.y + (cy - r.top) / r.height * VIEW.h]; }
function fromMap(x, y) { const r = mapRect(); return [r.left + (x - VIEW.x) / VIEW.w * r.width, r.top + (y - VIEW.y) / VIEW.h * r.height]; }
function homeView(animate) { const p = P(homeOf(me())); centerOn(p.x, p.y + 10, isPhone() ? 520 : 620, animate); }
function focusProv(id, w) { const p = P(id); centerOn(p.x, p.y, w || Math.min(VIEW.w, isPhone() ? 460 : 560)); }
function zoomBtn(f) { const { cx, cy } = visibleCenter(); zoomAt(f, VIEW.x + VIEW.w * cx, VIEW.y + VIEW.h * cy); }

const HILL_PAT = (id) => `<pattern id="${id}" width="26" height="18" patternUnits="userSpaceOnUse"><path d="M2 14 l6-8 6 8 M14 16 l5-6 5 6" fill="none" stroke="#5c4630" stroke-width="1" opacity=".18" stroke-linejoin="round"/></pattern>`;
function buildMap() {
  mapEl = $('#map');
  const allyPats = FACTIONS.map(f => allyPat(f.id, f.color)).join('');
  const h = `<defs>
    <clipPath id="landclip">${LANDS.map(L => `<path d="${pathOf(L)}"/>`).join('')}</clipPath>
    <clipPath id="seaclip">${SEA_POLYS.map(L => `<path d="${pathOf(L)}"/>`).join('')}</clipPath>
    <linearGradient id="seag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#96b3ad"/><stop offset="1" stop-color="#7f9e9a"/></linearGradient>
    <pattern id="waves" width="52" height="30" patternUnits="userSpaceOnUse"><path d="M3 16 q10-9 20 0 t20 0" fill="none" stroke="#4f6f6b" stroke-width="1.2" opacity=".35"/><path d="M-10 28 q10-9 20 0 t20 0 t20 0" fill="none" stroke="#4f6f6b" stroke-width="1" opacity=".2"/></pattern>
    <pattern id="terra" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="5" cy="6" r=".9" fill="#8b7a55" opacity=".3"/><circle cx="16" cy="17" r=".9" fill="#8b7a55" opacity=".25"/><circle cx="12" cy="3" r=".6" fill="#8b7a55" opacity=".2"/></pattern>
    ${HILL_PAT('hills')}
    ${allyPats}
  </defs>
  <rect x="-400" y="-400" width="${MW + 800}" height="${MH + 800}" fill="#d9ca9f"/>
  <rect x="-400" y="-400" width="${MW + 800}" height="${MH + 800}" fill="url(#terra)"/>
  ${SEA_POLYS.map(L => `<path d="${pathOf(L)}" fill="url(#seag)"/>`).join('')}
  ${SEA_POLYS.map(L => `<path d="${pathOf(L)}" fill="url(#waves)"/>`).join('')}
  <g clip-path="url(#seaclip)" id="seazones">${SEAS.map(s => `<path class="seacell" id="z-${s[0]}" data-sea="${s[0]}" d="${SEA_CELLD[s[0]]}"/>`).join('')}</g>
  <g clip-path="url(#seaclip)">${LANDS.map(L => `<path d="${pathOf(L)}" fill="none" stroke="#c9d6c9" stroke-width="26" stroke-opacity=".22"/><path d="${pathOf(L)}" fill="none" stroke="#c9d6c9" stroke-width="12" stroke-opacity=".3"/>`).join('')}</g>
  ${ISLES.map(L => `<path d="${pathOf(L)}" fill="#d9ca9f" stroke="#7b6a48" stroke-width="1.4"/>`).join('')}
  <g clip-path="url(#landclip)">${PROV.map(r => `<path class="cell" id="c-${r[0]}" data-id="${r[0]}" d="${CELLD[r[0]]}"/>`).join('')}</g>
  <g clip-path="url(#landclip)" pointer-events="none">${PROV.filter(r => r[5]).map(r => `<path d="${CELLD[r[0]]}" fill="url(#hills)"/>`).join('')}</g>
  <g clip-path="url(#landclip)" pointer-events="none" id="ownerlines"></g>
  ${LANDS.map(L => `<path d="${pathOf(L)}" fill="none" stroke="#3a2b1b" stroke-width="2.4"/>`).join('')}
  ${[['Hispania', -4.5, 40.6], ['Sweden', 15.6, 57.6], ['Bohemia', 14.6, 50.0], ['Poland', 17.5, 52.3], ['Hungary', 18.5, 47.0], ['Croatia', 16.5, 45.2], ['Emirate of Sicily', 14.0, 37.2], ['Corsica', 9.1, 42.2], ['Sardinia', 9.0, 40.0], ['Norway', 7.2, 58.5]].map(([n, lo, la]) => `<text class="geo" x="${px(lo)}" y="${py(la)}">${n}</text>`).join('')}
  ${SEAS.map(s => `<text class="seal" x="${px(s[2])}" y="${py(s[3]) + 34}">${s[1]}</text>`).join('')}
  <g transform="translate(${px(-9.4)},${py(47.6)})" class="rose"><circle r="36" fill="#efe3c4aa" stroke="#3a2b1b" stroke-width="1.2"/><circle r="30" fill="none" stroke="#b8892c" stroke-width="1"/><path d="M0,-46 L7,0 L0,46 L-7,0Z M-46,0 L0,-7 L46,0 L0,7Z" fill="#8e1f1b" stroke="#2a1d12" stroke-width="1"/><path d="M0,-46 L7,0 L0,0Z M46,0 L0,7 L0,0Z M0,46 L-7,0 L0,0Z M-46,0 L0,-7 L0,0Z" fill="#e2b33c"/><text y="-52" text-anchor="middle" class="rosel">N</text></g>
  <g transform="translate(${px(-10.6)},${py(58.3)})"><rect width="250" height="66" rx="4" fill="#efe3c4" stroke="#2a1d12" stroke-width="2"/><rect x="5" y="5" width="240" height="56" fill="none" stroke="#b8892c" stroke-width="1.2"/><text x="125" y="31" class="cart">Francia et Regna Vicina</text><text x="125" y="50" class="cart2">Anno Domini 987</text></g>
  <rect id="tint" x="-400" y="-400" width="${MW + 800}" height="${MH + 800}" fill="#000" fill-opacity="0" pointer-events="none"/>
  <g id="ovsel" pointer-events="none"></g>
  <g id="ov"></g>
  <g id="ovmoves" pointer-events="none"></g>`;
  mapEl.innerHTML = h;
  initMapInput();
}
function allyPat(fid, color) { return `<pattern id="al-${fid}" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="12" height="12" fill="#ece0bf"/><rect width="5" height="12" fill="${mix(color, '#ece0bf', 0.3)}"/></pattern>`; }
function ensureAllyPattern(fid) { if (document.getElementById('al-' + fid)) return; mapEl.querySelector('defs').insertAdjacentHTML('beforeend', allyPat(fid, FAC(fid).color)); }

function initMapInput() {
  const ptrs = new Map(); let pinch = null, moved = false, downT = 0, downTarget = null, sx = 0, sy = 0, lastTap = 0, lastTapPos = null;
  const startPinch = () => {
    const [a, b] = [...ptrs.values()], r = mapRect();
    const mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
    pinch = { d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), k: GX.k, sx: (mx - GX.dx) / GX.k, sy: (my - GX.dy) / GX.k };
  };
  mapEl.addEventListener('pointerdown', e => {
    sndUnlock(); hideTip();
    stopViewAnim();
    mapEl.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) { moved = false; downT = Date.now(); downTarget = e.target; sx = e.clientX; sy = e.clientY; }
    if (ptrs.size === 2) { startPinch(); moved = true; }
  });
  mapEl.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId);
    if (!p) { if (e.pointerType === 'mouse' && !isPhone()) hoverTip(e); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 1) {
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 8) moved = true;
      if (moved) setMapTransform(GX.dx + dx, GX.dy + dy, GX.k);
    } else if (ptrs.size === 2 && pinch) {
      const [a, b] = [...ptrs.values()], r = mapRect();
      const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
      const k = clamp(pinch.k * d / pinch.d, VIEW.w / (MW * 1.15), VIEW.w / 220);
      setMapTransform(mx - k * pinch.sx, my - k * pinch.sy, k);
    }
  });
  const up = e => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (ptrs.size === 0) commitGesture();
    if (ptrs.size === 0 && !moved && Date.now() - downT < 600) {
      const now = Date.now();
      if (now - lastTap < 320 && lastTapPos && Math.hypot(lastTapPos[0] - e.clientX, lastTapPos[1] - e.clientY) < 30) { const [cx, cy] = toMap(e.clientX, e.clientY); zoomAt(0.6, cx, cy); lastTap = 0; return; }
      lastTap = now; lastTapPos = [e.clientX, e.clientY];
      tapMap(downTarget);
    }
  };
  mapEl.addEventListener('pointerup', up); mapEl.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); pinch = null; if (!ptrs.size) commitGesture(); });
  mapEl.addEventListener('pointerleave', hideTip);
  mapEl.addEventListener('wheel', e => { e.preventDefault(); const [cx, cy] = toMap(e.clientX, e.clientY); zoomAt(Math.exp(e.deltaY * 0.0015), cx, cy); }, { passive: false });
  window.addEventListener('resize', () => { applyLayout(); if (G) applyView(); });
}
function tapMap(t) {
  if (!t || !t.closest) return;
  const c = t.closest('[data-id]'), z = t.closest('[data-sea]');
  const sel = c ? 'p:' + c.dataset.id : z ? 's:' + z.dataset.sea : null;
  const same = sel === G.sel;
  G.sel = sel;
  sfx('click'); buzz(8);
  PANEL.tab = null;
  render(); $('#pbody').scrollTop = 0;
  if (isPhone()) {
    if (sel) { if (SHEET.state === 'peek' || same) setSheet('half'); }
    else setSheet('peek');
  }
  if (sel && sel[0] === 'p') {
    hint('firstSel');
    if (isPhone()) {
      // re-centre only when the province would be near an edge or hidden by the sheet: every re-centre redraws the map
      const p = P(sel.slice(2)), r = mapRect(), [sx, sy] = fromMap(p.x, p.y), { cy } = visibleCenter(), visH = r.height * cy * 2;
      const inView = sx > r.left + r.width * 0.15 && sx < r.right - r.width * 0.15 && sy > r.top + visH * 0.15 && sy < r.top + visH * 0.85;
      if (!inView) centerOn(p.x, p.y, VIEW.w);
    }
  }
}

// ---------- tooltip (desktop hover) ----------
let tipId = null;
function hoverTip(e) {
  const c = e.target.closest && e.target.closest('[data-id]');
  if (!c) { hideTip(); return; }
  const id = c.dataset.id, p = P(id);
  const el = $('#tip');
  if (tipId !== id) {
    tipId = id;
    const who = p.owner ? FAC(p.owner).name : p.ally ? `${p.lord}, sworn to ${fname(p.ally)}` : p.lord;
    el.innerHTML = `<b>${esc(p.name)}${isCap(p) ? ' · capital' : ''}</b>${esc(who)}<br><span class="units">${uStr({ ...p.gar, militia: p.militia }, true)}</span>${p.b.castle ? `<br><span class="muted">${CASTLE_N[castleLv(p)]}${p.ruined ? ' (ruined)' : ' · walls ' + p.walls + '%'}</span>` : ''}`;
    el.classList.remove('hidden');
  }
  const r = $('#mapwrap').getBoundingClientRect();
  el.style.left = (e.clientX - r.left) + 'px'; el.style.top = (e.clientY - r.top) + 'px';
}
function hideTip() { tipId = null; $('#tip').classList.add('hidden'); }

// ---------- markers ----------
function castleIcon(p) {
  const lv = castleLv(p), col = p.ruined ? '#7d6f5c' : lv === 1 ? '#6b4a2b' : lv === 2 ? '#4a3826' : '#2f261a';
  let s = '';
  if (p.b.moat && !p.ruined) s += `<ellipse cx="0" cy="6" rx="20" ry="9" fill="none" stroke="#4f7f8a" stroke-width="3"/>`;
  if (p.ruined) s += `<path d="M-12,10 V2 L-8,-2 L-5,4 L-1,-4 L3,3 L7,-1 L12,6 V10Z" fill="${col}" stroke="#f3e8cc" stroke-width="1.4"/>`;
  else if (lv === 1) s += `<path d="M-12,10 V-4 L-10,-8 L-8,-4 V-5 L-6,-9 L-4,-5 L-2,-9 L0,-5 L2,-9 L4,-5 L6,-9 L8,-5 L10,-8 L12,-4 V10Z" fill="${col}" stroke="#f3e8cc" stroke-width="1.4"/>`;
  else s += `<path d="M-12,10 V-6 H-12 V-13 H-7.5 V-9 H-2.5 V-13 H2.5 V-9 H7.5 V-13 H12 V-6 V10 Z" fill="${col}" stroke="#f3e8cc" stroke-width="1.6"/>${lv === 3 ? '<path d="M-17,10 V-1 H-12 M17,10 V-1 H12" stroke="' + col + '" stroke-width="5" fill="none"/><path d="M-17,10 V-1 H-12 M17,10 V-1 H12" stroke="#f3e8cc" stroke-width="1.2" fill="none"/>' : ''}<path d="M-3,10 V3 a3,3 0 0 1 6,0 V10Z" fill="#f3e8cc"/>`;
  if (!p.ruined && p.walls < 100) s += `<rect x="-12" y="13" width="24" height="4" rx="1" fill="#0006"/><rect x="-12" y="13" width="${24 * p.walls / 100}" height="4" rx="1" fill="${p.walls < 34 ? '#c0392b' : p.walls < 67 ? '#d4a017' : '#5c8a3a'}"/>`;
  return s;
}
const bannerSvg = (color, n, siege, gen) => `<g><path d="M2,-31 h28 l-7,9 l7,9 h-28z" fill="#0005" transform="translate(1.5,2)"/><line x1="0" y1="-34" x2="0" y2="10" stroke="#2a1d12" stroke-width="3"/><circle cx="0" cy="-36" r="2.6" fill="#e2b33c"/><path d="M0,-33 h28 l-7,9 l7,9 h-28z" fill="${color}" stroke="#2a1d12" stroke-width="1.6"/><path d="M2,-31 h22" stroke="#fff" stroke-opacity=".3" stroke-width="2"/></g>${gen ? mapIco('fleur', 11, -24, 13, 'style="color:#f3e8cc"') : ''}<circle cx="13" cy="20" r="11" fill="#2a1d12" stroke="${color}" stroke-width="2"/><text class="cnt" x="13" y="25" style="stroke-width:0;font-size:14px">${n}</text>${siege ? mapIco('tent', -22, -10, 22, 'style="color:#f3e8cc"') + mapIco('tent', -22, -10, 18, 'style="color:' + color + '"') : ''}`;
const shipSvg = (color, n) => `<g><ellipse cx="2" cy="6" rx="28" ry="5" fill="#0004"/><path d="M-26,2 Q-30,-8 -22,-9 L22,-9 Q30,-8 26,2 Q0,12 -26,2Z" fill="#6b4a2b" stroke="#2a1d12" stroke-width="1.6"/><path d="M-27,-4 q-4,-10 2,-12 M27,-4 q4,-10 -2,-12" stroke="#6b4a2b" stroke-width="3" fill="none"/><line x1="0" y1="-9" x2="0" y2="-42" stroke="#2a1d12" stroke-width="2.4"/><path d="M-15,-40 H15 V-14 H-15Z" fill="${color}" stroke="#2a1d12" stroke-width="1.4"/><path d="M-15,-31 H15 M-15,-22 H15" stroke="#f3e8cc" stroke-width="2" opacity=".7"/></g><circle cx="0" cy="22" r="10" fill="#2a1d12" stroke="${color}" stroke-width="2"/><text class="cnt" x="0" y="26.5" style="stroke-width:0;font-size:13px">${n}</text>`;

function renderMapFill() {
  for (const p of provList()) {
    const el = document.getElementById('c-' + p.id);
    if (p.ally) ensureAllyPattern(p.ally);
    const base = EMPIRE.includes(p.id) ? '#ede2c3' : '#e3d7b5';
    el.setAttribute('fill', p.owner ? mix(FAC(p.owner).color, '#efe3c4', p.owner === me() ? 0.3 : 0.42) : p.ally ? `url(#al-${p.ally})` : base);
  }
  for (const s of SEAS) {
    const c = seaControl(s[0]); const el = document.getElementById('z-' + s[0]);
    el.setAttribute('fill', c ? FAC(c).color : 'transparent'); el.setAttribute('fill-opacity', c ? 0.22 : 0);
  }
  // thick coloured outline around the player's holdings, so your realm reads at a glance
  const mine = provList().filter(p => holds(me(), p.id));
  $('#ownerlines').innerHTML = mine.map(p => `<path d="${CELLD[p.id]}" fill="none" stroke="${FAC(me()).color}" stroke-width="5" stroke-opacity=".55" stroke-linejoin="round"/>`).join('');
}
function renderOverlay() {
  const s = clamp(VIEW.w / 720, 0.5, 1.5); ovScale = s;
  const A = myA();
  let o = '<g clip-path="url(#landclip)">';
  if (A && armyUsable(me(), A) && !A.acted) {
    const md = A.siege ? {} : marchDist(me(), A.loc);
    for (const id in md) if (md[id] > 0 && md[id] <= A.mp) o += `<path class="mrch" d="${CELLD[id]}" style="stroke-width:${3 * s}px"/>`;
    if (armySize(A) > 0) for (const p of provList()) { if (p.owner && truce()) continue; const bz = besieging(p); if (bz && bz.fid !== me()) continue; if (strikeFrom(me(), A, p)) o += `<path class="tgt" d="${CELLD[p.id]}" style="stroke-width:${3 * s}px"/>`; }
  }
  o += '</g>';
  // the selection lives in its own small layer, so tapping a province does not rebuild the whole overlay
  const sel = G.sel && G.sel[0] === 'p' ? `<g clip-path="url(#landclip)"><path class="selp" d="${CELLD[G.sel.slice(2)]}" style="stroke-width:${5 * s}px"/></g>`
    : G.sel && G.sel[0] === 's' ? `<g clip-path="url(#seaclip)"><path class="sels" d="${SEA_CELLD[G.sel.slice(2)]}" style="stroke-width:${4 * s}px"/></g>` : '';
  setHTML($('#ovsel'), sel);
  const unrest = G.fac[me()].unrest;
  for (const p of provList()) {
    const T = (dx, dy, inner) => `<g class="pin" transform="translate(${(p.x + dx * s).toFixed(1)},${(p.y + dy * s).toFixed(1)}) scale(${s.toFixed(2)})">${inner}</g>`;
    if (p.b.castle) o += T(0, -6, castleIcon(p));
    if (isCap(p)) o += T(0, -32, mapIco('crown', 0, 0, 24));
    if (p.heiress) o += T(-30, -2, mapIco('ring', 0, 0, 21));
    if (p.build) o += T(28, 0, mapIco('hammer', 0, 0, 18, 'style="color:#5c4630"'));
    if (p.plague) o += T(-28, -20, mapIco('skull', 0, 0, 18, 'style="color:#3f4a1f"'));
    if (p.interdict > 0) o += T(27, -20, mapIco('interdict', 0, 0, 17, 'style="color:#8e1f1b"'));
    if (unrest && unrest.seed === p.id) o += T(0, -34, `<g class="fire">${mapIco('fire', 0, 0, 30, 'style="color:#c0392b"')}</g>`);
    if (p.owner === me() && genAt(me(), p.id)) o += T(-18, -24, mapIco('fleur', 0, 0, 16, 'style="color:#e2b33c"'));
    const cls = 'lbl' + (isCap(p) ? ' cap' : '') + (holds(me(), p.id) ? ' mine' : '');
    o += T(0, 30, `<text class="${cls}" text-anchor="middle">${p.name}</text>`);
  }
  const at = {};
  for (const fid in G.armies) {
    if (!G.fac[fid].alive) continue;
    for (const a of G.armies[fid]) {
      if (!a.loc) continue;
      const n = armySize(a); if (!n) continue;
      if (fid === me()) continue;
      const p = P(a.loc); const k = at[a.loc] = (at[a.loc] || 0) + 1;
      o += `<g class="pin" transform="translate(${(p.x + (20 + (k - 1) * 34) * s).toFixed(1)},${(p.y - 14 * s).toFixed(1)}) scale(${s.toFixed(2)})">${bannerSvg(FAC(fid).color, n, !!a.siege, !!armyGen(fid, a))}</g>`;
    }
  }
  for (const z of SEAS) {
    const f = G.fleets[z[0]]; let k = 0;
    for (const fid in f) if (f[fid] > 0) {
      const [x, y] = LL([z[2], z[3]]);
      o += `<g class="pin" transform="translate(${(x + k * 64 * s).toFixed(1)},${(y - 8 * s).toFixed(1)}) scale(${s.toFixed(2)})">${shipSvg(FAC(fid).color, f[fid])}</g>`; k++;
    }
  }
  setHTML($('#ov'), o);
  renderMyBanners(s, at); seasonTint();
}
// a small static map of a faction's starting lands, for the title-screen detail sheet
function miniMap(fid) {
  const f = FACMAP[fid], home = PROV.find(r => r[0] === f.home);
  const cx = px(home[2]), cy = py(home[3]), w = 520, h = 200;
  const owned = new Set(PROV.filter(r => r[7] === fid).map(r => r[0]));
  return `<svg viewBox="${cx - w / 2} ${cy - h / 2} ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><rect x="${cx - w}" y="${cy - h}" width="${w * 2}" height="${h * 2}" fill="#d9ca9f"/>
    ${SEA_POLYS.map(L => `<path d="${pathOf(L)}" fill="#8fa8a3"/>`).join('')}
    ${PROV.map(r => `<path d="${CELLD[r[0]]}" fill="${owned.has(r[0]) ? mix(f.color, '#efe3c4', 0.3) : '#e8dcb9'}" stroke="#4b3825" stroke-width="1.2"/>`).join('')}
    ${LANDS.map(L => `<path d="${pathOf(L)}" fill="none" stroke="#3a2b1b" stroke-width="2.2"/>`).join('')}
    ${SEA_POLYS.map(L => `<path d="${pathOf(L)}" fill="#8fa8a3" stroke="#3a2b1b" stroke-width="2"/>`).join('')}
    ${PROV.map(r => `<text class="lbl" style="font-size:13px" text-anchor="middle" x="${px(r[2])}" y="${py(r[3]) + 5}">${r[1]}</text>`).join('')}
    ${mapIco('crown', cx, cy - 18, 22)}</svg>`;
}

// full map at rest, for the title screen backdrop
function titleMap() {
  const owned = {}; PROV.forEach(r => { if (r[7]) owned[r[0]] = FACMAP[r[7]].color; });
  return `<svg viewBox="0 0 ${MW} ${MH}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><rect width="${MW}" height="${MH}" fill="#d9ca9f"/>
    ${SEA_POLYS.map(L => `<path d="${pathOf(L)}" fill="#8fa8a3"/>`).join('')}
    <g clip-path="url(#landclip)">${PROV.map(r => `<path d="${CELLD[r[0]]}" fill="${owned[r[0]] ? mix(owned[r[0]], '#efe3c4', 0.4) : '#e8dcb9'}" stroke="#4b3825" stroke-width="1.2"/>`).join('')}</g>
    ${LANDS.map(L => `<path d="${pathOf(L)}" fill="none" stroke="#3a2b1b" stroke-width="2.4"/>`).join('')}
    ${FACTIONS.map(f => { const r = PROV.find(x => x[0] === f.home); return mapIco('crown', px(r[2]), py(r[3]) - 14, 30); }).join('')}</svg>`;
}
const SEASON_TINT = [['#9ad07a', 0.05], ['#ffd27a', 0.06], ['#d08a3a', 0.11], ['#cfe0ff', 0.16]];
function seasonTint() { const k = (G.turn + 1) % 4, el = document.getElementById('tint'); if (el && el.dataset.season !== String(k)) { el.dataset.season = k; el.setAttribute('fill', SEASON_TINT[k][0]); el.setAttribute('fill-opacity', SEASON_TINT[k][1]); } }
// the player's banners live in their own elements so they glide when an army marches
function renderMyBanners(s, at) {
  const col = FAC(me()).color;
  for (const a of armiesOf(me())) {
    let g = document.getElementById('mb-' + a.id);
    if (!g) { g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = 'mb-' + a.id; g.setAttribute('class', 'pin glide'); mapEl.appendChild(g); }
    const n = armySize(a);
    if (!a.loc || !n || !G.fac[me()].alive) { g.innerHTML = ''; continue; }
    const p = P(a.loc); const k = at[a.loc] = (at[a.loc] || 0) + 1;
    const chosen = a.id === G.army, num = ARMY_IDS.indexOf(a.id) + 1;
    g.innerHTML = (chosen ? '<circle cx="4" cy="-12" r="34" fill="#e2b33c22" stroke="#e2b33c" stroke-width="3"/>' : '') + bannerSvg(col, n, !!a.siege, !!armyGen(me(), a)) + `<circle cx="-10" cy="-30" r="8" fill="#f3e8cc" stroke="#2a1d12" stroke-width="1.5"/><text x="-10" y="-26" text-anchor="middle" style="font:700 11px Cinzel,serif;fill:#2a1d12">${num}</text>` + (!armyUsable(me(), a) ? mapIco('lock', -10, -30, 12) : '');
    g.setAttribute('transform', `translate(${(p.x + (20 + (k - 1) * 34) * s).toFixed(1)},${(p.y - 14 * s).toFixed(1)}) scale(${s.toFixed(2)})`);
    g.style.cursor = 'pointer';
    g.onclick = e => { e.stopPropagation(); };
  }
}
function flashProv(id) { const el = document.getElementById('c-' + id); if (!el || !SET.motion) return; el.classList.remove('flash'); void el.getBBox(); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600); }
