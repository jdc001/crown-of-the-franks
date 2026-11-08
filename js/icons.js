'use strict';
// ================= ICON SET =================
// Hand-drawn 24x24 glyphs. Rendered inline as <svg><use>; the sprite is injected once at boot.
// Colours come from currentColor so icons inherit text colour; a few carry fixed accents.
const ICONS = {
  // --- troops ---
  foot: '<path d="M12 2l7 3v6c0 5-3 9-7 11-4-2-7-6-7-11V5z" fill="currentColor" opacity=".9"/><path d="M12 5v14" stroke="#f3e8cc" stroke-width="1.6"/><path d="M8 9h8" stroke="#f3e8cc" stroke-width="1.6"/>',
  bow: '<path d="M6 3c7 2 7 16 0 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M6 3L6 21" stroke="currentColor" stroke-width="1.2" opacity=".6"/><path d="M4 12h15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M16 9l4 3-4 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  cav: '<path d="M4 20c0-5 2-9 5-11l2-5 3 2 1-3 3 3-1 4c2 1 3 3 3 6v4h-3v-3h-7v3H7v-3H4z" fill="currentColor"/><circle cx="16" cy="9" r=".9" fill="#f3e8cc"/>',
  cat: '<path d="M3 19h18v2H3z" fill="currentColor"/><path d="M6 19l3-11 5 2-4 9" fill="currentColor" opacity=".85"/><circle cx="15.5" cy="7.5" r="3" fill="currentColor"/><path d="M8 19l2-6" stroke="#f3e8cc" stroke-width="1.2"/>',
  militia: '<path d="M11 21V8M11 8L7 3M11 8l4-5M11 8l-2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 21h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  bishop: '<path d="M12 2v6M9 5h6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M8 22l1-10c0-2 1.5-3 3-3s3 1 3 3l1 10z" fill="currentColor"/>',
  ship: '<path d="M3 14h18l-3 5H6z" fill="currentColor"/><path d="M12 14V4" stroke="currentColor" stroke-width="2"/><path d="M12 4l7 7h-7z" fill="currentColor" opacity=".8"/><path d="M2 19c3 2 5 2 8 0s5-2 8 0 4 2 4 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  // --- buildings ---
  farm: '<path d="M12 22V9" stroke="currentColor" stroke-width="2"/><path d="M12 9c-4 0-6 3-6 6 3 0 6-2 6-6zm0 0c4 0 6 3 6 6-3 0-6-2-6-6zm0-6c-3 1-4 4-3 6 2-1 3-4 3-6zm0 0c3 1 4 4 3 6-2-1-3-4-3-6z" fill="currentColor"/>',
  market: '<path d="M12 3v18M5 21h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 14l3-7 3 7a3 3 0 0 1-6 0zm12 0l3-7 3 7a3 3 0 0 1-6 0z" fill="currentColor" opacity=".85"/>',
  port: '<circle cx="12" cy="5" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5V21M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 15c0 4 4 6 8 6s8-2 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  mine: '<path d="M4 20L14 10" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M11 5c3-2 7-2 9 1-2-1-5 0-7 2l-2-3z" fill="currentColor"/><path d="M16 11l3 3" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  castle: '<path d="M4 21V8h3V5h2v3h2V5h2v3h2V5h2v3h3v13z" fill="currentColor"/><path d="M11 21v-5a1.5 1.5 0 0 1 3 0v5" fill="#f3e8cc"/>',
  moat: '<path d="M2 9c3-2 5-2 8 0s5 2 8 0 4-1 4-1M2 14c3-2 5-2 8 0s5 2 8 0 4-1 4-1M2 19c3-2 5-2 8 0s5 2 8 0 4-1 4-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  forge: '<path d="M3 12h7l-2 3h10v3H6l2-3H3z" fill="currentColor"/><path d="M14 4l5 5-3 3-5-5z" fill="currentColor"/><path d="M4 21h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  armory: '<path d="M5 3l12 12M19 3L7 15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M15 17l3-3 3 3-3 3zM9 17l-3-3-3 3 3 3z" fill="currentColor"/>',
  stables: '<path d="M5 21v-9l7-7 7 7v9h-4v-6H9v6z" fill="currentColor"/><path d="M12 5l-3 3h6z" fill="#f3e8cc" opacity=".6"/>',
  rebuild: '<path d="M4 21V9h3V6h2v3h6V6h2v3h3v12z" fill="currentColor" opacity=".5"/><path d="M14 3l6 6-2 2-6-6z" fill="currentColor"/><path d="M8 19l6-6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  // --- map markers & status ---
  crown: '<path d="M3 18V8l5 4 4-7 4 7 5-4v10z" fill="#e2b33c" stroke="#5a3f14" stroke-width="1.3" stroke-linejoin="round"/><path d="M3 19h18" stroke="#5a3f14" stroke-width="2"/><circle cx="12" cy="13" r="1.6" fill="#a3222c"/>',
  ring: '<circle cx="12" cy="14" r="6" fill="none" stroke="#e2b33c" stroke-width="3"/><path d="M9 6l3-3 3 3-3 3z" fill="#7fb7d6" stroke="#2a1d12" stroke-width=".8"/>',
  hammer: '<path d="M4 20l8-8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M10 4h8l2 4-4 4-6-6z" fill="currentColor"/>',
  skull: '<path d="M12 3a7 7 0 0 0-7 7c0 3 2 5 3 6v3h8v-3c1-1 3-3 3-6a7 7 0 0 0-7-7z" fill="currentColor"/><circle cx="9.5" cy="11" r="2" fill="#f3e8cc"/><circle cx="14.5" cy="11" r="2" fill="#f3e8cc"/><path d="M10 19v2M12 19v2M14 19v2" stroke="#f3e8cc" stroke-width="1.2"/>',
  interdict: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M6 6l12 12" stroke="currentColor" stroke-width="2.6"/>',
  fleur: '<path d="M12 2c-2 3-2 6 0 8 2-2 2-5 0-8zM12 10c-3-2-7-1-8 3 3 1 6 0 8-3zm0 0c3-2 7-1 8 3-3 1-6 0-8-3zM10 13h4v2h-4zM11 15h2v7h-2z" fill="currentColor"/>',
  siege: '<path d="M3 20L12 6l9 14z" fill="currentColor"/><path d="M12 6v14" stroke="#f3e8cc" stroke-width="1.4"/><path d="M8 20l4-7 4 7" fill="#f3e8cc" opacity=".4"/>',
  sword: '<path d="M5 19l11-11" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M15 4l5 5-2 2-5-5z" fill="currentColor"/><path d="M4 16l4 4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M7 15l2 2" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>',
  swords: '<path d="M4 4l13 13M20 4L7 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M4 17l3 3M20 17l-3 3" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  coin: '<circle cx="12" cy="12" r="9" fill="#e2b33c" stroke="#7a5a10" stroke-width="1.5"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#7a5a10" stroke-width="1.2"/><path d="M12 8v8M10 10h4M10 14h4" stroke="#7a5a10" stroke-width="1.4" stroke-linecap="round"/>',
  chain: '<rect x="3" y="9" width="9" height="6" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="12" y="9" width="9" height="6" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/>',
  dove: '<path d="M3 13c3 1 6 0 8-3l2-5 3 2-1 3c3 0 5 1 7 3-3 1-5 1-7 1l-2 5-3 1 1-4c-3 1-6 0-8-3z" fill="currentColor"/>',
  bless: '<path d="M12 2l2.4 6.6L21 9l-5.2 4.3L17.5 21 12 17.3 6.5 21l1.7-7.7L3 9l6.6-.4z" fill="#e2b33c" stroke="#7a5a10" stroke-width="1.2" stroke-linejoin="round"/>',
  cross: '<path d="M10 2h4v6h6v4h-6v10h-4V12H4V8h6z" fill="currentColor"/>',
  church: '<path d="M12 2v4M10 4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 22V12l7-6 7 6v10h-5v-5h-4v5z" fill="currentColor"/>',
  scroll: '<path d="M6 3h12a2 2 0 0 1 2 2v2H8v12a2 2 0 0 1-4 0V5a2 2 0 0 1 2-2z" fill="currentColor" opacity=".85"/><path d="M8 7h12v11a3 3 0 0 1-3 3H6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 11h6M11 14h6" stroke="#f3e8cc" stroke-width="1.4"/>',
  gear: '<path d="M12 2l2 3 3.5-.5 1 3.4 3 1.8-1.3 3.3 1.3 3.3-3 1.8-1 3.4L14 19l-2 3-2-3-3.5.5-1-3.4-3-1.8L3.8 11 2.5 7.7l3-1.8 1-3.4L10 5z" fill="currentColor"/><circle cx="12" cy="12" r="3.5" fill="#f3e8cc"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8c2 2 2 6 0 8M19 5c4 4 4 10 0 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  home: '<path d="M3 11l9-8 9 8v10h-6v-6H9v6H3z" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
  minus: '<path d="M5 12h14" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
  back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
  close: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  next: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
  flag: '<path d="M5 22V3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M6 4h13l-4 4 4 4H6z" fill="currentColor"/>',
  skip: '<path d="M4 5l8 7-8 7zM12 5l8 7-8 7z" fill="currentColor"/>',
  retreat: '<path d="M19 22V3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M18 4H5l4 4-4 4h13z" fill="#f3e8cc" stroke="currentColor" stroke-width="1.6"/>',
  tent: '<path d="M2 20L12 4l10 16z" fill="currentColor"/><path d="M12 4v16" stroke="#f3e8cc" stroke-width="1.4"/><path d="M9 20l3-6 3 6z" fill="#f3e8cc" opacity=".5"/>',
  handshake: '<path d="M2 9l5-3 5 3 5-3 5 3v6l-5 3-5-3-5 3-5-3z" fill="currentColor" opacity=".9"/><path d="M7 12l5 3 5-3" fill="none" stroke="#f3e8cc" stroke-width="1.6"/>',
  people: '<circle cx="8" cy="8" r="3.5" fill="currentColor"/><circle cx="16" cy="9" r="3" fill="currentColor" opacity=".7"/><path d="M2 21c0-5 3-7 6-7s6 2 6 7zM13 21c0-4 2-6 4-6s5 2 5 6z" fill="currentColor"/>',
  heart: '<path d="M12 21s-8-5-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-8 11-8 11z" fill="currentColor"/>',
  map: '<path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z" fill="currentColor" opacity=".85"/><path d="M9 3v16M15 5v16" stroke="#f3e8cc" stroke-width="1.4"/>',
  wall: '<path d="M3 20V6h18v14z" fill="currentColor"/><path d="M3 11h18M3 16h18M9 6v5M15 11v5M9 16v4M15 6v5" stroke="#f3e8cc" stroke-width="1.2"/>',
  fire: '<path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-10z" fill="currentColor"/>',
  stone: '<path d="M7 5l9-1 5 6-2 8-8 3-7-5z" fill="currentColor"/><path d="M9 8l5 1 2 5" fill="none" stroke="#f3e8cc" stroke-width="1.2" opacity=".6"/>',
  stones: '<circle cx="7" cy="15" r="4" fill="currentColor"/><circle cx="16" cy="15" r="4" fill="currentColor"/><circle cx="11.5" cy="8" r="4" fill="currentColor"/>',
  oil: '<path d="M8 10h8v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" fill="currentColor"/><path d="M12 2c1 3 4 4 4 7a4 4 0 0 1-8 0c0-3 3-4 4-7z" fill="#ff8c1a"/>',
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 18h8a2 2 0 1 1-2 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  info: '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="7.5" r="1.4" fill="currentColor"/>',
  check: '<path d="M4 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2"/>',
  star: '<path d="M12 2l2.4 6.6L21 9l-5.2 4.3L17.5 21 12 17.3 6.5 21l1.7-7.7L3 9l6.6-.4z" fill="currentColor"/>',
  speed: '<path d="M4 6l7 6-7 6zM12 6l7 6-7 6z" fill="currentColor"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 18h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  desktop: '<rect x="2" y="4" width="20" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  auto: '<path d="M4 20l5-14h2l5 14h-2.5l-1.3-4H7.8l-1.3 4zm4.5-6h3.6l-1.8-5.5z" fill="currentColor"/><path d="M17 4h4v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
};
const UNIT_ICON = { militia: 'militia', foot: 'foot', bow: 'bow', cav: 'cav', cat: 'cat', bishop: 'bishop' };
const BLD_ICON = { farm: 'farm', market: 'market', port: 'port', mine: 'mine', castle: 'castle', moat: 'moat', forge: 'forge', armory: 'armory', stables: 'stables', rebuild: 'rebuild' };
function ico(name, cls = '') { return `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`; }
function injectIconSprite() {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = Object.keys(ICONS).map(k => `<symbol id="i-${k}" viewBox="0 0 24 24">${ICONS[k]}</symbol>`).join('');
  document.body.insertBefore(s, document.body.firstChild);
}
// standalone svg for use inside the map overlay (which is its own SVG, so <use> works there too)
// drawn inline rather than as <use>: every <use> clones its symbol into a hidden copy, which makes the map slow to rebuild
const mapIco = (name, x, y, size, extra = '') => `<g transform="translate(${(x - size / 2).toFixed(1)},${(y - size / 2).toFixed(1)}) scale(${(size / 24).toFixed(3)})" ${extra}>${ICONS[name]}</g>`;
