'use strict';
// ================= THE ILLUMINATED MAP =================
// The map is drawn as a scriptorium might have drawn it: on vellum, with little painted hills and woods,
// the great rivers in ink, ripple lines along the coasts, a ship and a sea serpent in the margins.
// Everything here is built once, as a few large paths, so panning and zooming stay quick.

const MART = {};
// a small seeded random, so every county keeps the same hills and trees from game to game
function seeded(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
function inPolyXY(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
const onLandXY = (x, y) => LANDS.some(L => inPolyXY(x, y, L));

const MOUNTAINS = new Set(['bearn', 'bigorre', 'pallars', 'urgell', 'cerdanya', 'roussillon', 'grenoble', 'nice', 'auvergne', 'velay', 'osona', 'italy', 'jura', 'pamplona']);
const WOODS = new Set(['ardennes', 'maine', 'belleme', 'chateaudun', 'vendome', 'berry', 'bourbon', 'nevers', 'marche', 'limoges', 'perigord', 'gascony', 'vannes', 'rennes', 'soissons', 'senlis', 'autun', 'namur', 'hainaut', 'dol', 'empire1', 'empire2', 'empire3', 'angouleme', 'thouars', 'loudun', 'velay', 'rouergue', 'kent', 'sussex', 'wessex', 'devon', 'vexin', 'evreux', 'besancon']);

// ---- the rivers, from source to mouth, as longitude and latitude ----
const RIVERS = [
  ['Seine', [[4.72, 47.48], [4.57, 47.86], [4.08, 48.3], [3.5, 48.49], [2.95, 48.38], [2.66, 48.54], [2.35, 48.86], [2.05, 48.93], [1.71, 48.99], [1.41, 49.24], [1.1, 49.44], [0.73, 49.53], [0.15, 49.46]]],
  ['Marne', [[5.3, 47.9], [5.14, 48.1], [4.95, 48.64], [4.36, 48.96], [3.95, 49.04], [3.4, 49.05], [2.88, 48.96], [2.42, 48.82]]],
  ['Oise', [[4.1, 49.9], [3.3, 49.62], [2.83, 49.42], [2.4, 49.2], [2.1, 49.0]]],
  ['Loire', [[4.22, 44.84], [4.0, 45.3], [4.07, 46.03], [3.98, 46.48], [3.46, 46.83], [3.16, 46.99], [3.02, 47.18], [2.63, 47.69], [1.9, 47.9], [1.33, 47.59], [0.98, 47.41], [0.69, 47.39], [-0.08, 47.26], [-0.55, 47.38], [-1.55, 47.21], [-2.2, 47.28]]],
  ['Allier', [[3.8, 44.6], [3.4, 45.5], [3.42, 46.13], [3.33, 46.56], [3.08, 46.96]]],
  ['Vienne', [[1.9, 45.6], [1.26, 45.83], [0.7, 46.1], [0.55, 46.8], [0.08, 47.21]]],
  ['Garonne', [[0.6, 42.75], [0.72, 43.1], [1.44, 43.6], [0.62, 44.2], [0.16, 44.5], [-0.57, 44.84], [-0.75, 45.1], [-1.05, 45.55]]],
  ['Dordogne', [[2.8, 45.55], [2.3, 45.2], [1.4, 44.9], [0.48, 44.85], [-0.24, 44.92], [-0.6, 45.03]]],
  ['Lot', [[3.5, 44.5], [2.4, 44.6], [1.44, 44.45], [0.34, 44.3]]],
  ['Tarn', [[3.6, 44.3], [2.15, 43.93], [1.35, 44.05], [1.0, 44.1]]],
  ['Rhône', [[6.15, 46.2], [5.75, 45.9], [4.83, 45.76], [4.87, 45.52], [4.89, 44.93], [4.75, 44.56], [4.81, 43.95], [4.63, 43.68], [4.65, 43.35]]],
  ['Saône', [[6.0, 48.0], [5.6, 47.45], [4.85, 46.78], [4.83, 46.31], [4.83, 45.76]]],
  ['Meuse', [[5.6, 48.0], [5.38, 49.16], [4.94, 49.7], [4.87, 50.46], [5.57, 50.63], [5.69, 50.85], [5.9, 51.3], [5.1, 51.75], [4.2, 51.85]]],
  ['Moselle', [[6.8, 47.9], [6.45, 48.17], [5.89, 48.68], [6.18, 49.12], [6.64, 49.75], [7.6, 50.36]]],
  ['Rhine', [[7.59, 47.56], [7.8, 48.58], [8.43, 49.32], [8.27, 50.0], [7.6, 50.36], [6.96, 50.94], [6.6, 51.5], [6.1, 51.85], [5.0, 51.95], [4.2, 51.95]]],
  ['Scheldt', [[3.3, 49.95], [3.24, 50.17], [3.39, 50.6], [3.72, 51.05], [4.4, 51.22], [3.8, 51.4]]],
  ['Somme', [[3.3, 49.85], [2.3, 49.9], [1.83, 50.1], [1.6, 50.2]]],
  ['Charente', [[0.5, 45.95], [0.16, 45.65], [-0.33, 45.7], [-0.63, 45.75], [-1.1, 45.95]]],
  ['Adour', [[0.15, 43.05], [-0.4, 43.7], [-1.05, 43.71], [-1.47, 43.49]]],
  ['Vilaine', [[-1.0, 48.2], [-1.68, 48.11], [-1.9, 47.75], [-2.4, 47.5]]],
  ['Ebro', [[-2.5, 42.45], [-1.6, 42.0], [-0.88, 41.65], [0.5, 41.2], [0.87, 40.72]]],
  ['Thames', [[-1.9, 51.7], [-1.25, 51.75], [-0.6, 51.5], [0.1, 51.5], [0.6, 51.5]]],
];
// a smooth curve through the points (Catmull-Rom as cubic Béziers)
function smoothPath(pts) {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
// meander a river a little between the known towns
function meander(name, pts) {
  const R = seeded('river' + name), out = [];
  for (let i = 0; i < pts.length; i++) {
    out.push(pts[i]);
    if (i < pts.length - 1) { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, k = (R() - 0.5) * Math.min(14, L * 0.22); out.push([(a[0] + b[0]) / 2 - dy / L * k, (a[1] + b[1]) / 2 + dx / L * k]); }
  }
  return out;
}
const riversLayer = () => MART.riversLayer || (MART.riversLayer = riversLayer_());
function riversLayer_() {
  const ds = RIVERS.map(([n, ll]) => smoothPath(meander(n, ll.map(LL))));
  return `<g class="rivers" pointer-events="none" clip-path="url(#landclip)">
    <path d="${ds.join(' ')}" fill="none" stroke="#3f5f63" stroke-width="5" stroke-opacity=".42" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${ds.join(' ')}" fill="none" stroke="#86acae" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

// ---- hills, mountains and woods, painted into the empty parts of each county ----
const terrainLayer = () => MART.terrainLayer || (MART.terrainLayer = terrainLayer_());
function terrainLayer_() {
  let hillFill = '', hillInk = '', hillShade = '', snow = '', snowM = '', mtnFill = '', mtnInk = '', mtnShade = '', crowns = '', trunks = '';
  const keep = (sx, sy, x, y) => { const dx = x - sx, dy = y - sy; return !(dx > -56 && dx < 56 && dy > -48 && dy < 22); };
  const ok = (x, y, poly, w) => inPolyXY(x, y, poly) && onLandXY(x - w, y) && onLandXY(x + w, y) && onLandXY(x, y - w);
  const cells = PROV.map((r, i) => ({ id: r[0], hill: !!r[5], poly: CELLS[i], seed: SEEDS[i], edge: false }))
    .concat(EDGES.map((e, i) => ({ id: e[0], hill: MOUNTAINS.has(e[0]), poly: EDGE_CELLS[i], seed: EDGE_SEEDS[i], edge: true })));
  for (const c of cells) {
    const R = seeded(c.id), mtn = MOUNTAINS.has(c.id), wood = WOODS.has(c.id), hill = c.hill && !mtn;
    if (!mtn && !hill && !wood) continue;
    const xs = c.poly.map(p => p[0]), ys = c.poly.map(p => p[1]), x0 = Math.max(Math.min(...xs), -60), x1 = Math.min(Math.max(...xs), MW + 60), y0 = Math.max(Math.min(...ys), -60), y1 = Math.min(Math.max(...ys), MH + 60);
    const step = mtn ? 30 : 24;
    for (let gy = y0 + step / 2; gy < y1; gy += step * 0.8) for (let gx = x0 + step / 2 + ((gy / step | 0) % 2) * step / 2; gx < x1; gx += step) {
      const x = gx + (R() - 0.5) * step * 0.6, y = gy + (R() - 0.5) * step * 0.5;
      if (!keep(c.seed[0], c.seed[1], x, y)) continue;
      // woods take some ground, hills or peaks the rest
      const treeHere = wood && (!(hill || mtn) || R() < 0.4);
      if (treeHere) {
        if (!ok(x, y, c.poly, 9) || R() < 0.15) continue;
        const n = 2 + (R() * 3 | 0);
        for (let k = 0; k < n; k++) {
          const tx = x + (k - n / 2) * 6.5 + (R() - 0.5) * 3, ty = y + (k % 2) * 4 + (R() - 0.5) * 2, r = 4.2 + R() * 1.6;
          trunks += `M${tx.toFixed(1)},${(ty + r).toFixed(1)}v${(r * 0.9).toFixed(1)}`;
          crowns += `M${(tx - r).toFixed(1)},${ty.toFixed(1)}a${r.toFixed(1)},${r.toFixed(1)} 0 1 1 ${(2 * r).toFixed(1)},0a${r.toFixed(1)},${r.toFixed(1)} 0 1 1 ${(-2 * r).toFixed(1)},0`;
        }
        continue;
      }
      if (mtn) {
        if (!ok(x, y, c.poly, 14) || R() < 0.15) continue;
        const w = 12 + R() * 7, h = 16 + R() * 10, pk = x + (R() - 0.5) * 4;
        mtnFill += `M${(x - w).toFixed(1)},${y.toFixed(1)}L${pk.toFixed(1)},${(y - h).toFixed(1)}L${(x + w).toFixed(1)},${y.toFixed(1)}Z`;
        mtnInk += `M${(x - w).toFixed(1)},${y.toFixed(1)}L${pk.toFixed(1)},${(y - h).toFixed(1)}L${(x + w).toFixed(1)},${y.toFixed(1)}`;
        mtnShade += `M${pk.toFixed(1)},${(y - h).toFixed(1)}L${(x + w).toFixed(1)},${y.toFixed(1)}L${(pk + 2).toFixed(1)},${y.toFixed(1)}Z`;
        snowM += `M${(pk - w * 0.3).toFixed(1)},${(y - h * 0.7).toFixed(1)}L${pk.toFixed(1)},${(y - h).toFixed(1)}L${(pk + w * 0.3).toFixed(1)},${(y - h * 0.7).toFixed(1)}L${(pk + w * 0.1).toFixed(1)},${(y - h * 0.62).toFixed(1)}L${(pk - w * 0.1).toFixed(1)},${(y - h * 0.72).toFixed(1)}Z`;
      } else if (hill) {
        if (!ok(x, y, c.poly, 11) || R() < 0.12) continue;
        const w = 11 + R() * 5, h = 9 + R() * 5;
        hillFill += `M${(x - w).toFixed(1)},${y.toFixed(1)}Q${(x - w * 0.5).toFixed(1)},${(y - h * 1.3).toFixed(1)} ${x.toFixed(1)},${(y - h).toFixed(1)}Q${(x + w * 0.5).toFixed(1)},${(y - h * 1.3).toFixed(1)} ${(x + w).toFixed(1)},${y.toFixed(1)}Z`;
        hillInk += `M${(x - w).toFixed(1)},${y.toFixed(1)}Q${(x - w * 0.5).toFixed(1)},${(y - h * 1.3).toFixed(1)} ${x.toFixed(1)},${(y - h).toFixed(1)}Q${(x + w * 0.5).toFixed(1)},${(y - h * 1.3).toFixed(1)} ${(x + w).toFixed(1)},${y.toFixed(1)}`;
        for (let k = 1; k <= 3; k++) hillShade += `M${(x + w * 0.15 * k).toFixed(1)},${(y - h * (1 - 0.22 * k)).toFixed(1)}l${(w * 0.18).toFixed(1)},${(h * 0.5).toFixed(1)}`;
        snow += `M${(x - w * 0.42).toFixed(1)},${(y - h * 0.82).toFixed(1)}Q${x.toFixed(1)},${(y - h * 1.18).toFixed(1)} ${(x + w * 0.42).toFixed(1)},${(y - h * 0.82).toFixed(1)}Z`;
      }
    }
  }
  return `<g class="terrain" pointer-events="none" clip-path="url(#landclip)">
    <path d="${hillFill}" class="tfill" fill="#c9b282" fill-opacity=".5"/>
    <path d="${mtnFill}" class="tfill" fill="#c4ac7c" fill-opacity=".62"/>
    <path d="${mtnShade}" fill="#5c4630" fill-opacity=".22"/>
    <path d="${hillShade}" fill="none" stroke="#5c4630" stroke-width=".9" stroke-opacity=".4" stroke-linecap="round"/>
    <path d="${hillInk}${mtnInk}" fill="none" stroke="#4a3622" stroke-width="1.3" stroke-opacity=".62" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${snowM}" fill="#fbfaf4" fill-opacity=".92"/>
    <path d="${snow}" class="snow" fill="#fbfaf4"/>
    <path d="${trunks}" fill="none" stroke="#4a3622" stroke-width="1.3" stroke-opacity=".55"/>
    <path d="${crowns}" class="trees" stroke="#3f4a26" stroke-width="1" stroke-opacity=".55"/></g>`;
}

// ---- the sea: ripple lines along every coast ----
const coastLayer = () => MART.coastLayer || (MART.coastLayer = coastLayer_());
function coastLayer_() {
  const d = LANDS.map(L => pathOf(L)).join(' ') + ' ' + ISLES.map(L => pathOf(L)).join(' ');
  // each ripple is a wide stroke in a darker sea colour with a slightly narrower one in the sea colour over it,
  // leaving a thin line; colours are mixed in advance, since translucent wide strokes are slow to repaint
  const ring = (w, ink) => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${w + 1.4}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#8eaca7" stroke-width="${w}" stroke-linejoin="round"/>`;
  return `<g class="coast" pointer-events="none">${ring(36, '#6a8884')}${ring(19, '#5c7a76')}<path d="${d}" fill="none" stroke="#a9c2bb" stroke-width="6" stroke-linejoin="round"/></g>`;
}

// ---- the margins: a cog under sail, a sea serpent, a compass rose, the title cartouche ----
const marginArt = () => MART.marginArt || (MART.marginArt = marginArt_());
function marginArt_() {
  const ship = (x, y, s, flip) => `<g transform="translate(${x},${y}) scale(${flip ? -s : s},${s})" class="mship">
    <path d="M-40,8 q40,10 80,0" fill="none" stroke="#3f5f5c" stroke-width="1.6" opacity=".55"/><path d="M-52,16 q20,-6 40,0 t40,0 t40,0" fill="none" stroke="#3f5f5c" stroke-width="1.2" opacity=".4"/>
    <path d="M-34,-2 L34,-2 L26,10 L-26,10 Z" fill="#7a5530" stroke="#2a1d12" stroke-width="1.6"/><path d="M-30,1 h60" stroke="#5a3e24" stroke-width="1.2"/>
    <path d="M-34,-2 L-38,-12 L-26,-6 Z M34,-2 L39,-13 L26,-6 Z" fill="#7a5530" stroke="#2a1d12" stroke-width="1.4"/>
    <line x1="0" y1="-2" x2="0" y2="-62" stroke="#2a1d12" stroke-width="2.4"/>
    <path d="M-22,-56 Q0,-48 22,-56 Q26,-34 22,-12 Q0,-18 -22,-12 Q-26,-34 -22,-56Z" fill="#efe3c4" stroke="#2a1d12" stroke-width="1.5"/>
    <path d="M-23,-40 Q0,-33 23,-40 L23,-28 Q0,-21 -23,-28Z" fill="#a3222c" opacity=".85"/>
    <path d="M0,-62 l14,4 -14,4z" fill="#a3222c" stroke="#2a1d12" stroke-width="1"/></g>`;
  const serpent = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})" class="mserp">
    <path d="M-60,6 q14,-26 28,0 q14,26 28,0 q14,-26 28,0 q10,16 22,4" fill="none" stroke="#2a1d12" stroke-width="12" stroke-linecap="round" opacity=".9"/>
    <path d="M-60,6 q14,-26 28,0 q14,26 28,0 q14,-26 28,0 q10,16 22,4" fill="none" stroke="#5f8a5a" stroke-width="8.4" stroke-linecap="round"/>
    <path d="M-60,6 q14,-26 28,0 q14,26 28,0 q14,-26 28,0" fill="none" stroke="#c9d39a" stroke-width="2.2" stroke-dasharray="3 5" stroke-linecap="round"/>
    <path d="M-46,-14 l3,-8 4,7 M-18,10 l3,8 4,-7 M10,-14 l3,-8 4,7" fill="#a3222c" stroke="#2a1d12" stroke-width="1"/>
    <path d="M-64,8 q-14,-12 -6,-24 q10,-6 18,4 q2,8 -4,14z" fill="#5f8a5a" stroke="#2a1d12" stroke-width="1.8"/>
    <circle cx="-62" cy="-8" r="2" fill="#ffd36b" stroke="#2a1d12" stroke-width=".8"/><path d="M-70,-1 l-10,4 6,1 -4,4" fill="none" stroke="#a3222c" stroke-width="1.6"/>
    <path d="M-30,16 q30,8 60,0 M-80,22 q20,-6 40,0" fill="none" stroke="#3f5f5c" stroke-width="1.2" opacity=".5"/></g>`;
  const rose = (x, y) => { let pts = ''; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 - Math.PI / 2, L = i % 4 === 0 ? 52 : i % 2 === 0 ? 36 : 24, w = i % 4 === 0 ? 8 : 5, b1 = a - Math.PI / 2, ex = Math.cos(a) * L, ey = Math.sin(a) * L, sx = Math.cos(b1) * w, sy = Math.sin(b1) * w; pts += `<path d="M0,0L${sx.toFixed(1)},${sy.toFixed(1)}L${ex.toFixed(1)},${ey.toFixed(1)}Z" fill="${i % 4 === 0 ? '#8e1f1b' : i % 2 === 0 ? '#2a1d12' : '#b8892c'}"/><path d="M0,0L${(-sx).toFixed(1)},${(-sy).toFixed(1)}L${ex.toFixed(1)},${ey.toFixed(1)}Z" fill="${i % 4 === 0 ? '#e2b33c' : '#efe3c4'}" stroke="#2a1d12" stroke-width=".6"/>`; }
    return `<g transform="translate(${x},${y})" class="rose" pointer-events="none"><circle r="44" fill="#efe3c4" fill-opacity=".75" stroke="#2a1d12" stroke-width="1.4"/><circle r="38" fill="none" stroke="#b8892c" stroke-width="1"/><circle r="30" fill="none" stroke="#2a1d12" stroke-width=".6" stroke-dasharray="1 3"/>${pts}<circle r="4" fill="#e2b33c" stroke="#2a1d12" stroke-width="1"/>
      <g transform="translate(0,-66) scale(.9)"><path d="M0,-12 C-4,-6 -4,0 0,4 C4,0 4,-6 0,-12Z M-2,4 C-12,-2 -14,8 -4,8 M2,4 C12,-2 14,8 4,8 M-7,8 h14" fill="#e2b33c" stroke="#2a1d12" stroke-width="1.2"/></g></g>`; };
  const cart = (x, y) => `<g transform="translate(${x},${y})" pointer-events="none">
    <path d="M-12,8 q-14,0 -14,14 q0,14 14,14 l0,-22 q8,0 8,-6 z" fill="#d9c79a" stroke="#2a1d12" stroke-width="1.4"/>
    <path d="M262,8 q14,0 14,14 q0,14 -14,14 l0,-22 q-8,0 -8,-6 z" fill="#d9c79a" stroke="#2a1d12" stroke-width="1.4"/>
    <rect x="-12" y="0" width="274" height="74" rx="3" fill="#efe3c4" stroke="#2a1d12" stroke-width="2"/>
    <rect x="-6" y="6" width="262" height="62" fill="none" stroke="#b8892c" stroke-width="1.2"/><rect x="-2" y="10" width="254" height="54" fill="none" stroke="#2a1d12" stroke-width=".6"/>
    <text x="125" y="36" class="cart">Regnum Francorum</text><text x="125" y="55" class="cart2">Anno Domini 987</text>
    ${mapIco('crown', 125, -6, 26)}</g>`;
  return `<g pointer-events="none">${ship(px(-3.9), py(49.4), 1.05)}${ship(px(3.0), py(42.15), 0.75, true)}${serpent(px(-5.2), py(46.95), 1.3)}</g>${rose(px(-4.4), py(44.6))}${cart(px(5.6), py(42.4))}`;
}

// ---- the vellum: a tile of soft stains, fibres and speckles, painted once on a canvas ----
let VELLUM = null;
function vellumTile() {
  if (VELLUM) return VELLUM;
  const S = 320, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); if (!x) return '';
  const R = seeded('vellum'), wrap = f => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) f(ox, oy); };
  for (let i = 0; i < 26; i++) { const cx = R() * S, cy = R() * S, r = 20 + R() * 70, a = 0.025 + R() * 0.05; wrap((ox, oy) => { const g = x.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); g.addColorStop(0, `rgba(110,80,40,${a})`); g.addColorStop(1, 'rgba(110,80,40,0)'); x.fillStyle = g; x.fillRect(cx + ox - r, cy + oy - r, r * 2, r * 2); }); }
  for (let i = 0; i < 14; i++) { const cx = R() * S, cy = R() * S, r = 18 + R() * 40; wrap((ox, oy) => { const g = x.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); g.addColorStop(0, 'rgba(255,250,235,.10)'); g.addColorStop(1, 'rgba(255,250,235,0)'); x.fillStyle = g; x.fillRect(cx + ox - r, cy + oy - r, r * 2, r * 2); }); }
  x.lineCap = 'round';
  for (let i = 0; i < 160; i++) { const cx = R() * S, cy = R() * S, a = R() * Math.PI, L = 3 + R() * 9; x.strokeStyle = `rgba(90,65,35,${0.05 + R() * 0.07})`; x.lineWidth = 0.6; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); x.stroke(); }
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(80,55,30,${0.06 + R() * 0.12})`; x.fillRect(R() * S, R() * S, 1, 1); }
  try { VELLUM = c.toDataURL('image/png'); } catch (e) { VELLUM = ''; }
  return VELLUM;
}
function vellumDefs() { const u = vellumTile(); return u ? `<pattern id="vellum" width="320" height="320" patternUnits="userSpaceOnUse"><image href="${u}" width="320" height="320"/></pattern>` : ''; }
function vellumLayer() { return vellumTile() ? `<rect x="-400" y="-400" width="${MW + 800}" height="${MH + 800}" fill="url(#vellum)" pointer-events="none"/>` : ''; }
