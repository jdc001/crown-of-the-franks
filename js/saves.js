'use strict';
// ================= SAVED GAMES =================
// The game still saves itself after every action (one autosave). On top of that: three named slots kept on this
// device, and export/import so a campaign can be backed up as a file or a code, or moved to another device.
const SLOTS = 5, SLOT_KEY = n => 'cotf-slot-' + n;
function readSlot(n) { try { const s = localStorage.getItem(SLOT_KEY(n)); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function slotLabel(s) { const d = s.fdefs.find(x => x.id === s.player), m = s.map || 'france'; return `${d ? d.name : '?'} · ${dateIn(m, s.turn)}${m !== MAP_ID && MAPS[m] ? ` · ${MAPS[m].name}` : ''}`; }
function saveToSlot(n) {
  if (!G || G.over) return;
  if (slotLocked(n)) return openUnlock('slot');
  try {
    localStorage.setItem(SLOT_KEY(n), JSON.stringify({ when: Date.now(), game: G }));
    sfx('coin'); toast(`Saved to slot ${n}`, 'scroll');
  } catch (e) { toast('Could not save: this device is out of storage space'); }
  openSaves();
}
// save into the first empty slot, or over the oldest one
function quickSave() {
  if (!fullGame()) return saveToSlot(1);
  let n = 0, oldest = Infinity;
  for (let i = 1; i <= SLOTS; i++) { const s = readSlot(i); if (!s) { n = i; break; } if (s.when < oldest) { oldest = s.when; n = i; } }
  saveToSlot(n);
}
const anySlot = () => Array.from({ length: SLOTS }, (_, i) => readSlot(i + 1)).some(s => s && s.game && s.game.v === 8 && !s.game.over);
function loadSlot(n) { const s = readSlot(n); if (s) loadGameObj(s.game); }
function deleteSlot(n) {
  showModal(`<div class="rep"><h2>Delete slot ${n}?</h2><p class="ctr">${esc(slotLabel(readSlot(n).game))}</p><div class="grid2"><button class="btn red" onclick="try{localStorage.removeItem(SLOT_KEY(${n}))}catch(e){};openSaves()">Delete</button><button class="btn" onclick="openSaves()">Keep it</button></div></div>`);
}
// put a saved game on the board, replacing whatever is being played
function loadGameObj(obj) {
  if (obj && obj._career) { const got = careerMerge(obj._career); delete obj._career; if (got) toast('Your trophies and past games were restored', 'star'); }
  if (!obj || obj.v !== 8 || !obj.fdefs || !obj.provs || !obj.fac) return toast('That save is not from this version of the game');
  if (obj.over) return toast('That campaign is already over');
  // a campaign on another map: switch maps, then load it there
  if ((obj.map || 'france') !== MAP_ID) { if (!MAPS[obj.map || 'france']) return toast('That save is from a map this version does not have'); if (mapLocked(obj.map || 'france')) return openUnlock('map:' + obj.map); try { sessionStorage.setItem('cotf-load', JSON.stringify(obj)); } catch (e) { return toast('That save is too large to carry across maps'); } return switchMap(obj.map || 'france'); }
  G = obj; rebuildFmap(); ensureProvs();
  // saves from before v6.44 may hold half a levyman: round them to whole men
  for (const p of provList()) { p.militia = Math.round(p.militia || 0); for (const t in p.gar) p.gar[t] = Math.round(p.gar[t] || 0); }
  if (!G.army) G.army = 'a0';
  G.sel = null; G.reports = G.reports || []; PANEL.tab = null;
  $('#title').style.display = 'none'; closeModal(); setMusic('map'); closeDrawer();
  applyLayout(); render(); homeView(false); if (isPhone()) setSheet('peek');
  save(); sfx('bell'); toast(`Loaded: ${FAC(me()).name}, ${dateStr(G.turn)}`, 'scroll');
}

// ---------- export / import ----------
// a save code is the game as JSON, gzipped where the browser can, then base64
const b64 = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = str => { const s = atob(str); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; };
async function pipeBytes(bytes, stream) { const r = new Response(new Blob([bytes]).stream().pipeThrough(stream)); return new Uint8Array(await r.arrayBuffer()); }
async function makeCode(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === 'function') { try { return 'COTF1z:' + b64(await pipeBytes(raw, new CompressionStream('gzip'))); } catch (e) { } }
  return 'COTF1:' + b64(raw);
}
async function readCode(text) {
  text = String(text || '').trim();
  if (text.startsWith('{')) return JSON.parse(text);
  const m = text.match(/^COTF1(z?):([A-Za-z0-9+/=\s]+)$/);
  if (!m) throw new Error('not a save code');
  let bytes = unb64(m[2].replace(/\s+/g, ''));
  if (m[1]) bytes = await pipeBytes(bytes, new DecompressionStream('gzip'));
  return JSON.parse(new TextDecoder().decode(bytes));
}
const saveFileName = () => `crown-${SC.date.y0}-${FAC(me()).name.toLowerCase().replace(/[^a-z]+/g, '-')}-${dateStr(G.turn).toLowerCase().replace(/\s+/g, '-')}.json`;
async function exportFile() {
  if (!G) return;
  const json = JSON.stringify({ ...G, _career: careerPack() }), name = saveFileName();
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Anointed save' }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('Save file downloaded', 'scroll'); }
  catch (e) { toast('This browser cannot save files. Use Copy save code instead.'); }
}
async function exportCode() {
  if (!G) return;
  const code = await makeCode({ ...G, _career: careerPack() });
  try { await navigator.clipboard.writeText(code); toast(`Save code copied (${Math.round(code.length / 1024)} KB of text). Paste it into Notes to keep it.`, 'scroll'); }
  catch (e) { const t = $('#codebox'); if (t) { t.value = code; t.select(); toast('Select the code and copy it'); } }
}
async function importText(text) {
  try { loadGameObj(await readCode(text)); } catch (e) { toast('That is not a save code or save file from this game'); }
}
function importFile(input) {
  const f = input.files && input.files[0]; if (!f) return;
  const r = new FileReader(); r.onload = () => importText(r.result); r.onerror = () => toast('Could not read that file'); r.readAsText(f);
}

// ---------- the screen ----------
function openSaves() {
  const live = G && !G.over;
  const auto = loadSave();
  const slots = Array.from({ length: SLOTS }, (_, i) => i + 1).map(n => {
    const s = readSlot(n), when = s ? new Date(s.when) : null;
    return `<div class="gen"><div class="gname">${ico('scroll')} Slot ${n}</div>${s ? `<div>${shieldFromSave(s.game)} <b>${esc(slotLabel(s.game))}</b></div><div class="sub">saved ${when.toLocaleDateString()} ${when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · ${s.game.fdefs.filter(d => s.game.fac[d.id].alive).length - 1} rivals left</div>` : '<div class="sub">Empty</div>'}
      <div class="row" style="margin-top:4px">${live ? `<button class="btn sm${s ? '' : ' gold'}" onclick="${s ? `confirmOverwrite(${n})` : `saveToSlot(${n})`}">${s ? 'Save over' : 'Save here'}</button>` : ''}${s && s.game.v !== 8 ? '<span class="sub">From the old map of Europe: it plays in Emperor: 1000 AD.</span>' : ''}${s ? `${s.game.v === 8 ? `<button class="btn sm gold" onclick="loadSlot(${n})">Load</button>` : ''}<button class="btn sm ghost" onclick="deleteSlot(${n})">Delete</button>` : ''}</div></div>`;
  }).join('');
  showModal(`<h2>${ico('chest')} Saved games</h2>${live ? `<button class="btn gold" style="width:100%;margin:4px 0 8px" onclick="quickSave()"><span class="lbl">${ico('chest')}Save now</span><small>into an empty slot, or over the oldest</small></button>` : ''}
    <p class="sub">The game also saves itself after every move${auto && !auto.over && auto.v === 8 ? ` (now: ${esc(slotLabel(auto))})` : ''}. Slots are kept on this device; deleting the home-screen icon deletes them too, so export a copy of a long campaign.</p>
    <div class="gens">${slots}</div>
    <h3>Back up or move a campaign</h3>
    ${live ? `<div class="grid2"><button class="btn" onclick="exportFile()"><span class="lbl">${ico('scroll')}Save as a file</span><small>to Files, iCloud Drive, AirDrop or email</small></button><button class="btn" onclick="exportCode()"><span class="lbl">${ico('check')}Copy save code</span><small>paste it into Notes or a message</small></button></div>` : '<p class="sub">Start or continue a campaign to export it.</p>'}
    <h3>Load a backup</h3>
    <div class="grid2"><label class="btn" style="cursor:pointer"><span class="lbl">${ico('scroll')}Open a save file</span><small>a .json file from this game</small><input type="file" accept=".json,application/json,text/plain" style="display:none" onchange="importFile(this)"></label>
      <button class="btn" onclick="importText(document.getElementById('codebox').value)"><span class="lbl">${ico('next')}Load the code below</span><small>paste a save code first</small></button></div>
    <textarea id="codebox" placeholder="Paste a save code here" style="width:100%;min-height:64px;margin-top:8px;font:13px/1.3 monospace;border:1px solid var(--line2);border-radius:8px;padding:8px;background:#fffaf0;-webkit-user-select:text;user-select:text"></textarea>`, '', { closable: true });
}
function confirmOverwrite(n) {
  showModal(`<div class="rep"><h2>Save over slot ${n}?</h2><p class="ctr">${esc(slotLabel(readSlot(n).game))} will be replaced.</p><div class="grid2"><button class="btn gold" onclick="saveToSlot(${n})">Save over it</button><button class="btn" onclick="openSaves()">Cancel</button></div></div>`);
}
// a save's house may be a rebel or a kingdom that no longer exists in the running game, so draw its arms from the save
function shieldFromSave(s) { const d = s.fdefs.find(x => x.id === s.player); if (!d) return ''; const keep = G; const tmp = { fmap: { [d.id]: d } }; try { G = tmp; return shield(d.id, 18); } finally { G = keep; } }
