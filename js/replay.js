'use strict';
// ================= THE HOUSES MOVE: a replay of the computer turns on the map =================
// Before the computer houses move, the positions of every army and the owner of every province are noted.
// Afterwards the two are compared house by house, and each house's marches, sieges and conquests are drawn
// on the map in turn order. The chronicle line for the house sits in a strip at the top. A tap skips it all.
function replaySnap() {
  const own = {}, al = {}, arm = {};
  for (const p of provList()) { own[p.id] = p.owner; al[p.id] = p.ally; }
  for (const f in G.armies) arm[f] = G.armies[f].map(a => ({ id: a.id, loc: a.loc, siege: a.siege, n: armySize(a) }));
  return { own, al, arm };
}
const seaLinked = (a, b) => P(a).seas.some(z => P(b).seas.includes(z));
function replayEvents(snap) {
  const out = [];
  for (const f of G.order) {
    if (f === me() || !G.fac[f]) continue;
    const ev = [];
    if (G.fac[f].alive) for (const a of G.armies[f] || []) {
      const b = (snap.arm[f] || []).find(x => x.id === a.id);
      if (!b || !b.loc || !b.n || !a.loc) continue;
      if (a.siege && a.siege !== b.siege) ev.push({ k: 'siege', from: b.loc, to: a.siege });
      else if (a.loc !== b.loc && !a.siege) ev.push({ k: 'march', from: b.loc, to: a.loc });
    }
    for (const p of provList()) {
      if (p.owner === f && snap.own[p.id] !== f) {
        // draw the blow from the army that stands beside it, if one does
        const src = (G.armies[f] || []).find(a => a.loc && a.loc !== p.id && (ADJ[p.id].includes(a.loc) || seaLinked(a.loc, p.id)));
        ev.push({ k: 'take', from: src ? src.loc : null, to: p.id, was: snap.own[p.id] });
      } else if (!p.owner && p.ally === f && snap.al[p.id] !== f) ev.push({ k: 'ally', to: p.id });
    }
    if (ev.length) out.push({ f, ev });
  }
  return out;
}
// provinces within two steps of anything the player holds, plus anything the player has just lost
function nearPlayer(snap) {
  const near = new Set(), ring = provList().filter(p => holds(me(), p.id) || snap.own[p.id] === me()).map(p => p.id);
  ring.forEach(id => near.add(id));
  for (let k = 0; k < 2; k++) for (const id of [...near]) for (const n of ADJ[id]) near.add(n);
  return near;
}
function fitReplay(list) {
  const ids = []; list.forEach(x => x.ev.forEach(e => { ids.push(e.to); if (e.from) ids.push(e.from); }));
  if (!ids.length) return;
  const xs = ids.map(id => P(id).x), ys = ids.map(id => P(id).y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const s = svgSize(), { cy } = visibleCenter(), visH = VIEW.h * cy * 2;
  const inside = x0 > VIEW.x + 30 && x1 < VIEW.x + VIEW.w - 30 && y0 > VIEW.y + 30 && y1 < VIEW.y + visH - 30;
  if (inside) return;
  const w = Math.max(VIEW.w, (x1 - x0) * 1.3 + 120, ((y1 - y0) * 1.3 + 120) * s.w / (s.h * cy * 2));
  centerOn((x0 + x1) / 2, (y0 + y1) / 2, w, false);
}
function arrowSvg(a, b, color, s, dash) {
  const A = P(a), Bp = P(b), dx = Bp.x - A.x, dy = Bp.y - A.y, L = Math.hypot(dx, dy) || 1;
  const cx = (A.x + Bp.x) / 2 - dy * 0.18, cy = (A.y + Bp.y) / 2 + dx * 0.18;
  const ux = (Bp.x - cx), uy = (Bp.y - cy), ul = Math.hypot(ux, uy) || 1, tx = ux / ul, ty = uy / ul;
  const hx = Bp.x - tx * 12 * s, hy = Bp.y - ty * 12 * s, hw = 9 * s, hl = 16 * s;
  const d = `M${A.x.toFixed(1)},${A.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${hx.toFixed(1)},${hy.toFixed(1)}`;
  const head = `M${(hx + tx * hl).toFixed(1)},${(hy + ty * hl).toFixed(1)} L${(hx - ty * hw).toFixed(1)},${(hy + tx * hw).toFixed(1)} L${(hx + ty * hw).toFixed(1)},${(hy - tx * hw).toFixed(1)}Z`;
  return `<path d="${d}" fill="none" stroke="#2a1d12" stroke-width="${(8 * s).toFixed(1)}" stroke-linecap="round" pathLength="1" class="mvline" opacity=".55"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="${(5 * s).toFixed(1)}" stroke-linecap="round" pathLength="1" class="mvline"${dash ? ' stroke-opacity=".85"' : ''}/>
    <path d="${head}" fill="${color}" stroke="#2a1d12" stroke-width="${(1.6 * s).toFixed(1)}" class="mvhead"/>`;
}
function replayHouseSvg(x) {
  const s = clamp(VIEW.w / 720, 0.5, 1.5), col = FAC(x.f).color;
  let o = '';
  for (const e of x.ev) if (e.k === 'take' || e.k === 'ally') o += `<g clip-path="url(#landclip)"><path class="mvcap" d="${CELLD[e.to]}" fill="${col}" fill-opacity="${e.k === 'take' ? .4 : .22}" stroke="${col}" stroke-width="${(6 * s).toFixed(1)}"/></g>`;
  for (const e of x.ev) {
    if (e.k === 'march') o += arrowSvg(e.from, e.to, col, s, true);
    else if (e.k === 'siege') { o += arrowSvg(e.from, e.to, col, s); const q = P(e.to); o += `<g class="mvhead" transform="translate(${q.x},${q.y - 10 * s}) scale(${s.toFixed(2)})">${mapIco('tent', 0, 0, 30, 'style="color:#f3e8cc"')}${mapIco('tent', 0, 0, 24, `style="color:${col}"`)}</g>`; }
    else if (e.k === 'take' && e.from) o += arrowSvg(e.from, e.to, col, s);
  }
  return o;
}
let RP = null;
function replayStop() { if (!RP) return; const r = RP; RP = null; clearTimeout(r.t); $('#ovmoves').innerHTML = ''; $('#turnov').classList.add('hidden'); $('#turnov').classList.remove('strip'); const c = $('#turncatch'); if (c) c.remove(); r.done(); }
function runTurnOverlay(order, lines, done, snap) {
  const mode = SET.replay || 'near';
  if (!snap || mode === 'off' || !SET.motion) return done();
  let list = replayEvents(snap);
  if (mode === 'near') {
    const near = nearPlayer(snap);
    list = list.map(x => ({ f: x.f, ev: x.ev.filter(e => near.has(e.to) || (e.from && near.has(e.from)) || e.was === me()) })).filter(x => x.ev.length);
  }
  if (!list.length) return done();
  if (isPhone()) setSheet('peek');
  fitReplay(list);
  const ov = $('#turnov'); ov.classList.add('strip'); ov.classList.remove('hidden');
  const catcher = document.createElement('div'); catcher.id = 'turncatch'; catcher.onclick = replayStop; document.body.appendChild(catcher);
  ov.onclick = replayStop;
  RP = { done, t: 0 };
  let i = 0;
  const g = $('#ovmoves');
  const step = () => {
    if (!RP) return;
    g.querySelectorAll('.mvhouse').forEach(el => el.setAttribute('opacity', '0.3'));
    if (i >= list.length) { RP.t = setTimeout(replayStop, 700); return; }
    const x = list[i++], l = lines.find(y => y.f === x.f);
    const what = x.ev.filter(e => e.k === 'take').length;
    ov.innerHTML = `<div class="rpbar">${shield(x.f, 30)}<div style="min-width:0"><div class="rpname">${esc(FAC(x.f).name)} <span class="rpdate">${esc(dateStr(G.turn))}</span></div><div class="rpline">${esc(l && l.t ? l.t : what ? `takes ${what} province${what > 1 ? 's' : ''}` : 'marches')}</div></div><div class="rpskip">${i}/${list.length}<br>tap to skip</div></div>`;
    g.insertAdjacentHTML('beforeend', `<g class="mvhouse">${replayHouseSvg(x)}</g>`);
    RP.t = setTimeout(step, 1500);
  };
  step();
}
