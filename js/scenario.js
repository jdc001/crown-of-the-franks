'use strict';
// ================= MAPS =================
// Each map (France 987, Britain 1066, ...) registers itself in MAPS from its own file. The chosen map is read
// once, before data.js builds the counties and coasts; switching maps saves the choice and reloads the page.
const MAPS = {};
const MAP_ID = (() => {
  if (typeof SIM_MAP !== 'undefined') return SIM_MAP;
  try {
    const q = location.search.match(/[?&]map=(\w+)/);
    if (q) { localStorage.setItem('cotf-map', q[1]); return q[1]; }
    return localStorage.getItem('cotf-map') || 'france';
  } catch (e) { return 'france'; }
})();
// switch to another map, then do something once it has loaded (continue its campaign, open a slot, start a house)
function switchMap(id, then) {
  try { localStorage.setItem('cotf-map', id); if (then) sessionStorage.setItem('cotf-then', then); } catch (e) { }
  const u = location.pathname + location.search.replace(/([?&])map=\w+&?/, '$1').replace(/[?&]$/, '');
  location.replace(u);
}
