'use strict';
// ================= SHOWCASE SCENES =================
// The coronation at Reims and the title screen's dawn. Drawn as SVG with soft light and a little motion
// (candles, light shafts, falling petals, drifting dust); all of it stops when Animations are off.

const lerp = (a, b, t) => a + (b - a) * t;

// ---- the anointing at Reims: the nave in perspective, light through the glass of the apse ----
function coronationScene(fid, kid) {
  const col = FAC(fid).color, latin = LATIN[kid] || 'REX';
  const name = FAC(fid).pname.split(' ')[0].toUpperCase();
  const W = 600, H = 400, VX = 300, VY = 196;
  const R = seeded('reims' + fid);
  // floor tiles converging on the altar
  let tiles = '';
  for (let i = -9; i <= 9; i++) tiles += `M${VX + i * 6},${VY + 54}L${VX + i * 70},${H}`;
  for (let k = 1; k <= 9; k++) { const t = Math.pow(k / 9, 1.7), y = lerp(VY + 54, H, t), hw = lerp(54, 660, t); tiles += `M${VX - hw},${y.toFixed(1)}H${VX + hw}`; }
  // the arcade: pairs of piers receding toward the apse, with ribs across the vault
  let piers = '', ribs = '', banners = '';
  const D = 6;
  for (let k = D - 1; k >= 0; k--) {
    const t = k / D, t2 = (k + 1) / D;
    const xl = lerp(22, 214, Math.pow(t, 0.8)), xr = W - xl, top = lerp(60, 132, t), bot = lerp(H, VY + 58, Math.pow(t, 0.9)), w = lerp(40, 9, t);
    const xl2 = lerp(22, 214, Math.pow(t2, 0.8)), top2 = lerp(60, 132, t2);
    const shade = Math.round(lerp(60, 40, t));
    for (const [x, side] of [[xl, -1], [xr, 1]]) {
      piers += `<rect x="${(x - w / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${(bot - top).toFixed(1)}" fill="rgb(${shade + 22},${shade + 12},${shade + 8})"/>`;
      piers += `<rect x="${(side < 0 ? x + w / 2 - w * 0.32 : x - w / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${(w * 0.32).toFixed(1)}" height="${(bot - top).toFixed(1)}" fill="#c9905a" opacity="${(0.25 + 0.25 * t).toFixed(2)}"/>`;
      piers += `<rect x="${(x - w / 2 - 2).toFixed(1)}" y="${(top - 4).toFixed(1)}" width="${(w + 4).toFixed(1)}" height="5" fill="#5a463c"/>`;
    }
    if (k < D - 1) {
      // side arches between this pier and the next one back
      ribs += `M${xl.toFixed(1)},${top.toFixed(1)}Q${((xl + xl2) / 2).toFixed(1)},${(Math.min(top, top2) - lerp(46, 12, t)).toFixed(1)} ${xl2.toFixed(1)},${top2.toFixed(1)}`;
      ribs += `M${xr.toFixed(1)},${top.toFixed(1)}Q${((xr + W - xl2) / 2).toFixed(1)},${(Math.min(top, top2) - lerp(46, 12, t)).toFixed(1)} ${(W - xl2).toFixed(1)},${top2.toFixed(1)}`;
    }
    // a transverse rib across the nave
    ribs += `M${xl.toFixed(1)},${top.toFixed(1)}Q${VX},${(top - lerp(150, 46, t)).toFixed(1)} ${xr.toFixed(1)},${top.toFixed(1)}`;
    // the realm's banners hang from the nearer piers
    if (k >= 1 && k <= 3) {
      const bw = lerp(34, 14, t), bh = bw * 2.4, by = top + 14;
      for (const x of [xl, xr]) banners += `<g class="cban" style="animation-delay:-${(R() * 4).toFixed(2)}s"><path d="M${(x - bw / 2).toFixed(1)},${by.toFixed(1)}h${bw.toFixed(1)}v${bh.toFixed(1)}l${(-bw / 2).toFixed(1)},${(-bw * 0.4).toFixed(1)}l${(-bw / 2).toFixed(1)},${(bw * 0.4).toFixed(1)}z" fill="${col}" stroke="#2a1d12" stroke-width="1"/><path d="M${(x - bw / 2).toFixed(1)},${(by + 3).toFixed(1)}h${bw.toFixed(1)}" stroke="#e2b33c" stroke-width="1.6"/>${embedShield(fid, x, by + bh * 0.42, bw * 0.62, false)}</g>`;
    }
  }
  // the apse: three tall lancets of stained glass and a rose window
  const lancet = (cx, w, y0, y1) => `M${cx - w / 2},${y1}V${y0 + w * 0.6}Q${cx - w / 2},${y0} ${cx},${y0 - w * 0.25}Q${cx + w / 2},${y0} ${cx + w / 2},${y0 + w * 0.6}V${y1}Z`;
  const L = [[VX - 30, 18, 126, 196], [VX, 22, 118, 196], [VX + 30, 18, 126, 196]];
  let glassLead = '';
  for (const [cx, w, y0, y1] of L) { for (let y = y0 + 10; y < y1; y += 9) glassLead += `M${cx - w / 2},${y}H${cx + w / 2}`; glassLead += `M${cx},${y0}V${y1}`; }
  let rose = ''; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; rose += `<path d="M${VX},94L${(VX + Math.cos(a - 0.22) * 20).toFixed(1)},${(94 + Math.sin(a - 0.22) * 20).toFixed(1)}A20,20 0 0 1 ${(VX + Math.cos(a + 0.22) * 20).toFixed(1)},${(94 + Math.sin(a + 0.22) * 20).toFixed(1)}Z" fill="${['#2d5ea8', '#a3222c', '#e2b33c', '#3f7f3a'][i % 4]}" stroke="#1a1214" stroke-width="1.2"/>`; }
  // shafts of light falling from the glass onto the king
  const rays = [[VX - 30, 128, 190, 330, 38, 3.2], [VX, 120, 268, 342, 46, 0], [VX + 30, 128, 330, 336, 38, 1.6]]
    .map(([sx, sy, ex, ey, ew, dl]) => `<path class="cray" style="animation-delay:-${dl}s" d="M${sx - 7},${sy}L${sx + 7},${sy}L${ex + ew},${ey}L${ex - ew},${ey}Z" fill="url(#crayg)"/>`).join('');
  // candles on tall stands down both sides of the carpet
  let candles = '';
  for (let k = 0; k < 4; k++) {
    const t = Math.pow((k + 0.6) / 5, 0.9), y = lerp(H - 22, VY + 66, t), dx = lerp(150, 40, t), s = lerp(1, 0.4, t);
    for (const x of [VX - dx, VX + dx]) candles += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(2)})"><circle cy="-74" r="26" fill="url(#cglow)" class="cglow" style="animation-delay:-${(R() * 2).toFixed(2)}s"/><path d="M-10,0h20l-6,-6h-8z M-2,-6v-52h4v52z" fill="#b8892c" stroke="#5a3e10" stroke-width="1"/><rect x="-4" y="-70" width="8" height="12" fill="#f3e8cc"/><path class="cfl" style="animation-delay:-${(R() * 2).toFixed(2)}s" d="M0,-86q5,8 0,15q-5,-7 0,-15z" fill="#ffd36b"/></g>`;
  }
  // the court looking on: dark heads and shoulders at the near edges
  let crowd = '';
  for (let i = 0; i < 9; i++) for (const side of [-1, 1]) {
    const x = VX + side * (178 + i * 15 + R() * 6), y = H - 16 - (i % 2) * 10 - R() * 6, s = 0.9 + R() * 0.3;
    crowd += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(2)})"><path d="M-16,30Q-16,4 0,2Q16,4 16,30Z" fill="#150e12"/><circle cy="-6" r="9" fill="#1d1418"/></g>`;
  }
  // petals drifting down through the light, and motes of dust in it
  let petals = '';
  for (let i = 0; i < 26; i++) { const x = 140 + R() * 320, d = 5 + R() * 5, dl = R() * d, c = ['#c8303a', '#e05a64', '#f3e8cc', '#e2b33c'][i % 4]; petals += `<g class="cpet" style="animation-duration:${d.toFixed(2)}s;animation-delay:-${dl.toFixed(2)}s"><ellipse cx="${x.toFixed(1)}" cy="-10" rx="3" ry="1.8" fill="${c}" transform="rotate(${(R() * 180).toFixed(0)} ${x.toFixed(1)} -10)"/></g>`; }
  let motes = ''; for (let i = 0; i < 30; i++) motes += `<circle class="cmote" style="animation-delay:-${(R() * 4).toFixed(2)}s" cx="${(220 + R() * 160).toFixed(1)}" cy="${(140 + R() * 190).toFixed(1)}" r="${(0.6 + R() * 1.1).toFixed(1)}" fill="#fff6d8"/>`;
  const king = figurePerson(286, 342, col, '#7a1d1d', 1.15, true);
  const arch = `${figurePerson(352, 344, '#f7f1e0', '#a3222c', 1.12)}
    <path d="M342,252 Q352,226 362,252 Z" fill="#f7f1e0" stroke="#e2b33c" stroke-width="2"/><path d="M343,247 H361 M345,240 H359" stroke="#e2b33c" stroke-width="1.8"/>
    <line x1="378" y1="344" x2="378" y2="228" stroke="#e2b33c" stroke-width="3.5"/><path d="M378,228 q13,-4 11,-15 q-2,-9 -11,-5" fill="none" stroke="#e2b33c" stroke-width="3.5"/>
    <path d="M338,286 Q324,262 314,250" stroke="#f7f1e0" stroke-width="8" stroke-linecap="round" fill="none"/>`;
  const crown = `<g class="ccrown"><circle cx="300" cy="244" r="22" fill="url(#cglow)"/><g transform="translate(300,244)"><path d="M-14,9 L-14,-5 L-7,2 L0,-11 L7,2 L14,-5 L14,9Z" fill="#e2b33c" stroke="#7a5a10" stroke-width="1.4"/><circle cx="0" cy="-11" r="2.6" fill="#a3222c"/><circle cx="-14" cy="-5" r="2.2" fill="#2d5ea8"/><circle cx="14" cy="-5" r="2.2" fill="#2d5ea8"/></g></g>`;
  const bishops = [[220, 338], [418, 338]].map(([bx, by]) => figurePerson(bx, by, '#f3e8cc', '#6e2f63', 0.8) + `<path d="M${bx - 5},${by - 72} L${bx},${by - 86} L${bx + 5},${by - 72}Z" fill="#f3e8cc" stroke="#e2b33c"/>`).join('');
  const title = `${name} ${latin}`;
  return `<svg class="scene coron" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cnave" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120c16"/><stop offset=".5" stop-color="#2a1d22"/><stop offset="1" stop-color="#1a1214"/></linearGradient>
      <radialGradient id="capse" cx="50%" cy="38%" r="40%"><stop offset="0" stop-color="#f6d48a" stop-opacity=".55"/><stop offset="1" stop-color="#f6d48a" stop-opacity="0"/></radialGradient>
      <linearGradient id="cglass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2b33c"/><stop offset=".25" stop-color="#2d5ea8"/><stop offset=".5" stop-color="#a3222c"/><stop offset=".72" stop-color="#2d5ea8"/><stop offset="1" stop-color="#3f7f3a"/></linearGradient>
      <linearGradient id="crayg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2c8" stop-opacity=".55"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></linearGradient>
      <radialGradient id="cglow"><stop offset="0" stop-color="#ffcf6b" stop-opacity=".7"/><stop offset="1" stop-color="#ffcf6b" stop-opacity="0"/></radialGradient>
      <radialGradient id="cvig" cx="50%" cy="55%" r="70%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>
      <filter id="cblur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#cnave)"/>
    <rect width="${W}" height="${H}" fill="url(#capse)"/>
    <g filter="url(#cblur)" opacity=".85">${L.map(([cx, w, y0, y1]) => `<path d="${lancet(cx, w + 8, y0 - 4, y1 + 4)}" fill="#ffd78a"/>`).join('')}<circle cx="${VX}" cy="94" r="26" fill="#ffd78a"/></g>
    ${L.map(([cx, w, y0, y1]) => `<path d="${lancet(cx, w, y0, y1)}" fill="url(#cglass)" stroke="#1a1214" stroke-width="2"/>`).join('')}
    <path d="${glassLead}" stroke="#1a1214" stroke-width="1" opacity=".7"/>
    <circle cx="${VX}" cy="94" r="23" fill="#1a1214"/>${rose}<circle cx="${VX}" cy="94" r="5" fill="#e2b33c" stroke="#1a1214" stroke-width="1.2"/>
    <path d="M${VX - 54},${VY + 54}H${VX + 54}L${W},${H}H0Z" fill="#2c2124"/>
    <path d="${tiles}" stroke="#1a1214" stroke-width="1" opacity=".8"/>
    <path d="M${VX - 12},${VY + 54}H${VX + 12}L${VX + 70},${H}H${VX - 70}Z" fill="#7a1d1d"/><path d="M${VX - 12},${VY + 54}L${VX - 70},${H}M${VX + 12},${VY + 54}L${VX + 70},${H}" stroke="#e2b33c" stroke-width="2" opacity=".7"/>
    <rect x="${VX - 32}" y="${VY + 34}" width="64" height="22" fill="#5a463c"/><rect x="${VX - 36}" y="${VY + 30}" width="72" height="6" fill="#e2b33c"/><rect x="${VX - 26}" y="${VY + 38}" width="52" height="14" fill="#a3222c"/>
    <path d="M${VX - 6},${VY + 30}v-18h12v18" fill="none" stroke="#e2b33c" stroke-width="2.5"/><path d="M${VX},${VY + 8}v-10M${VX - 6},${VY + 2}h12" stroke="#e2b33c" stroke-width="2.5"/>
    <path d="${ribs}" fill="none" stroke="#4a3a34" stroke-width="5" stroke-linecap="round"/><path d="${ribs}" fill="none" stroke="#7a6658" stroke-width="1.6" opacity=".7"/>
    ${piers}${banners}
    <g style="mix-blend-mode:screen">${rays}</g>${motes}
    ${candles}${bishops}${king}${arch}${crown}
    ${petals}${crowd}
    <rect width="${W}" height="${H}" fill="url(#cvig)"/>
    <g><path d="M90,26 H510 L496,46 L510,66 H90 L104,46Z" fill="#f3e8cc" stroke="#8e1f1b" stroke-width="2.5"/><path d="M90,26 l-14,8 v28 l14,4 M510,26 l14,8 v28 l-14,4" fill="#d9c79a" stroke="#8e1f1b" stroke-width="2"/>
      <text x="300" y="54" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="24" fill="#8e1f1b" letter-spacing="3" textLength="${Math.min(380, title.length * 18)}" lengthAdjust="spacingAndGlyphs">${esc(title)}</text></g>
    <rect x="3" y="3" width="${W - 6}" height="${H - 6}" fill="none" stroke="#e2b33c" stroke-width="2.5" opacity=".9"/><rect x="9" y="9" width="${W - 18}" height="${H - 18}" fill="none" stroke="#8e1f1b" stroke-width="1.5" opacity=".8"/>
  </svg>`;
}

// ---- the title: a gold crown with a glint passing over it, and the old royal banners either side ----
function titleCrown() {
  return `<svg class="hcrown" viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="tcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".35" stop-color="#e8b740"/><stop offset=".7" stop-color="#b07a1e"/><stop offset="1" stop-color="#7a4f0e"/></linearGradient>
    <linearGradient id="tglint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <clipPath id="tcclip"><path d="M14,74 L10,30 L34,50 L60,12 L86,50 L110,30 L106,74Z"/><rect x="12" y="72" width="96" height="12" rx="2"/></clipPath></defs>
    <path d="M14,74 L10,30 L34,50 L60,12 L86,50 L110,30 L106,74Z" fill="url(#tcg)" stroke="#5a3a0a" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="12" y="72" width="96" height="12" rx="2" fill="url(#tcg)" stroke="#5a3a0a" stroke-width="2.5"/>
    <circle cx="10" cy="28" r="5" fill="#e8b740" stroke="#5a3a0a" stroke-width="2"/><circle cx="110" cy="28" r="5" fill="#e8b740" stroke="#5a3a0a" stroke-width="2"/><circle cx="60" cy="10" r="6" fill="#e8b740" stroke="#5a3a0a" stroke-width="2"/>
    <path d="M60,22 l6,10 -6,10 -6,-10z" fill="#a3222c" stroke="#5a3a0a" stroke-width="1.5"/><circle cx="34" cy="62" r="5" fill="#2d5ea8" stroke="#5a3a0a" stroke-width="1.5"/><circle cx="86" cy="62" r="5" fill="#2d5ea8" stroke="#5a3a0a" stroke-width="1.5"/><circle cx="60" cy="60" r="6" fill="#3f7f3a" stroke="#5a3a0a" stroke-width="1.5"/>
    <path d="M18,78 h84" stroke="#fff3c4" stroke-width="1.2" opacity=".6"/>
    <g clip-path="url(#tcclip)"><rect class="glint" x="0" y="0" width="34" height="90" fill="url(#tglint)" transform="skewX(-20)"/></g></svg>`;
}
// a long swallow-tailed banner: azure with gold fleurs on the left, the oriflamme of Saint-Denis on the right
function titlePennant(side) {
  const az = side === 'l';
  const fleur = (x, y) => `<path transform="translate(${x},${y}) scale(.5)" d="M0,-12 C-4,-6 -4,0 0,4 C4,0 4,-6 0,-12Z M-2,4 C-12,-2 -14,8 -4,8 M2,4 C12,-2 14,8 4,8 M-7,8 h14" fill="#e2b33c" stroke="#7a5a10" stroke-width="1"/>`;
  return `<svg class="pennant ${side}" viewBox="0 0 54 150" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="54" height="5" rx="2" fill="#b8892c" stroke="#5a3a0a"/>
    <path d="M4,5 H50 V140 L27,118 L4,140Z" fill="${az ? '#26408a' : '#b8241c'}" stroke="#1a1214" stroke-width="1.5"/>
    <path d="M4,5 H50 V140 L27,118 L4,140Z" fill="url(#none)"/>
    ${az ? [[16, 26], [38, 26], [27, 46], [16, 66], [38, 66], [27, 86], [16, 106], [38, 106]].map(([x, y]) => fleur(x, y)).join('') : `<path d="M4,30 H50 M4,60 H50 M4,90 H50" stroke="#e8a83c" stroke-width="2" opacity=".7"/><circle cx="27" cy="45" r="9" fill="none" stroke="#e8a83c" stroke-width="2"/><path d="M27,36v18M18,45h18" stroke="#e8a83c" stroke-width="2"/>`}
    <path d="M10,5 V128" stroke="#fff" stroke-width="3" opacity=".08"/></svg>`;
}
