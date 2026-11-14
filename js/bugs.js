'use strict';
// ================= REPORT A BUG =================
// The player taps "Report a bug": the game gathers what it knows (version, device, the last moves, any errors, the
// chronicle, and if they agree the saved game) and sends it to the developer. Nothing is sent without that tap.
//
// Where reports go: paste the web app address of the Google Apps Script in publishing/BUGS.md here. Until one is
// set, the report is handed to the share sheet (Mail, Messages, Files) or downloaded as a file instead.
const BUG_ENDPOINT = '';
const BUG_EMAIL = '';

// ---------- what the game remembers for a report ----------
const BUG = { crumbs: [], errors: [], prompted: false };
function crumb(s) { BUG.crumbs.push(`${new Date().toISOString().slice(11, 19)} ${typeof G !== 'undefined' && G ? 'T' + G.turn + ' ' : ''}${s}`); if (BUG.crumbs.length > 80) BUG.crumbs.shift(); }
function bugError(msg, stack) {
  BUG.errors.push({ at: new Date().toISOString(), msg: String(msg).slice(0, 400), stack: String(stack || '').split('\n').slice(0, 6).join('\n'), turn: typeof G !== 'undefined' && G ? G.turn : null });
  if (BUG.errors.length > 20) BUG.errors.shift();
  if (!BUG.prompted) { BUG.prompted = true; setTimeout(bugPrompt, 400); }
}
window.addEventListener('error', e => bugError(e.message, e.error && e.error.stack));
window.addEventListener('unhandledrejection', e => bugError('Unhandled: ' + (e.reason && e.reason.message || e.reason), e.reason && e.reason.stack));
// the player's moves, as a trail of breadcrumbs: wrap the functions the buttons call
function bugWatch() {
  const names = ['act', 'pickArmy', 'goProv', 'playerEndTurn', 'startGame', 'openPreBattle', 'openCatapult', 'finishCatapult', 'startRaid', 'doCrown', 'openDiplo', 'doNewArmy', 'doCommand', 'doDisband', 'openFair', 'loadGameObj', 'pickMap', 'pullBack', 'openRansom'];
  for (const n of names) {
    const f = window[n]; if (typeof f !== 'function' || f._watched) continue;
    const w = function (...a) { crumb(`${n}(${a.map(x => typeof x === 'object' ? (x && x.id) || '{}' : String(x)).join(', ').slice(0, 60)})`); return f.apply(this, a); };
    w._watched = true; window[n] = w;
  }
}
window.addEventListener('load', () => { bugWatch(); bugRetry(); });

// a quiet bar when something breaks, offering to send a report
function bugPrompt() {
  if (document.getElementById('bugbar')) return;
  const d = document.createElement('div'); d.id = 'bugbar';
  d.innerHTML = `<span>${ico('flag')} Something went wrong.</span><button class="btn sm gold" onclick="document.getElementById('bugbar').remove();openBugReport(true)">Report it</button><button class="btn sm" onclick="document.getElementById('bugbar').remove()">Dismiss</button>`;
  document.body.appendChild(d);
}

// ---------- the report ----------
function bugReport(note) {
  const g = typeof G !== 'undefined' && G ? G : null;
  return {
    v: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '?', at: new Date().toISOString(), note: note || '',
    map: MAP_ID, house: g ? g.player : null, turn: g ? g.turn : null, date: g ? dateStr(g.turn) : null, over: g ? g.over : null,
    diff: g ? g.diff : null, goal: g ? g.goal : null,
    device: { ua: navigator.userAgent, w: innerWidth, h: innerHeight, dpr: devicePixelRatio, layout: typeof LAYOUT !== 'undefined' ? LAYOUT.mode : null, standalone: !!(navigator.standalone || matchMedia('(display-mode: standalone)').matches), lang: navigator.language },
    settings: typeof SET !== 'undefined' ? SET : null,
    errors: BUG.errors, crumbs: BUG.crumbs,
    chronicle: g ? g.log.slice(0, 40) : [],
    open: { modal: !!document.querySelector('.modal.on, .modal[style*="flex"]'), sel: g ? g.sel : null, army: g ? g.army : null },
  };
}
// the saved game, squeezed (gzip and base64) when the browser can
async function bugSave() {
  if (typeof G === 'undefined' || !G) return null;
  const raw = JSON.stringify(G);
  try {
    if (typeof CompressionStream === 'undefined') return { enc: 'json', data: raw };
    const s = new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'));
    const buf = new Uint8Array(await new Response(s).arrayBuffer()); let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return { enc: 'gzip-base64', data: btoa(bin) };
  } catch (e) { return { enc: 'json', data: raw }; }
}
function bugSummary(R) { return `Anointed ${R.v} · ${R.map}${R.house ? ' · ' + R.house : ''}${R.turn !== null ? ' · turn ' + R.turn : ''} · ${R.errors.length} error${R.errors.length === 1 ? '' : 's'}${R.note ? ' · ' + R.note.slice(0, 80) : ''}`; }

function openBugReport(fromError) {
  crumb('openBugReport');
  showModal(`<div class="sealmark">${ico('flag')}</div><h2 class="ctr">Report a bug</h2>
    <p class="sub ctr">${fromError ? 'The game hit an error. ' : ''}Tell us what happened. The report includes the game version, your device and screen size, your last moves, any errors, and the recent chronicle.</p>
    <textarea id="bugnote" rows="4" style="width:100%;box-sizing:border-box;font:inherit;padding:8px;border-radius:8px;border:1px solid #b8892c;background:#fffaf0" placeholder="What were you doing, and what went wrong?"></textarea>
    <label class="row" style="gap:8px;align-items:center;margin:8px 0"><input type="checkbox" id="bugsave" checked> <span>Include my current game, so the problem can be replayed</span></label>
    <div class="grid2"><button class="btn gold" onclick="sendBugReport()"><span class="lbl">${ico('check')}Send report</span></button><button class="btn" onclick="closeModal()">Cancel</button></div>
    <p class="sub ctr" style="font-size:12.5px">Nothing is sent until you tap Send. No name, account or location is included.</p>`, '', { closable: true });
  setTimeout(() => { const t = $('#bugnote'); if (t) t.focus(); }, 200);
}
async function sendBugReport() {
  const note = ($('#bugnote') || {}).value || '', withSave = ($('#bugsave') || {}).checked;
  const R = bugReport(note.trim()); if (withSave) R.save = await bugSave();
  const body = JSON.stringify(R);
  if (BUG_ENDPOINT) {
    try {
      await fetch(BUG_ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body });
      closeModal(); toast('Report sent. Thank you!', 'check'); return;
    } catch (e) {
      // offline: keep it and send it next time the game opens
      try { localStorage.setItem('cotf-bug-pending', body); } catch (e2) { }
      closeModal(); toast('No connection: the report will be sent next time', 'flag'); return;
    }
  }
  // no address set yet: hand the file to the share sheet, or download it
  const name = `anointed-bug-${R.v}-${Date.now()}.json`, file = new File([body], name, { type: 'application/json' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Anointed bug report', text: bugSummary(R) }); closeModal(); toast('Report shared. Thank you!', 'check'); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  closeModal(); toast(BUG_EMAIL ? `Report saved. Please email it to ${BUG_EMAIL}` : 'Report saved as a file', 'scroll');
}
async function bugRetry() {
  if (!BUG_ENDPOINT) return;
  let body = null; try { body = localStorage.getItem('cotf-bug-pending'); } catch (e) { }
  if (!body || !navigator.onLine) return;
  try { await fetch(BUG_ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body }); localStorage.removeItem('cotf-bug-pending'); } catch (e) { }
}
// for the developer: open a report's saved game in this browser (paste the report's JSON text, from the console)
async function bugLoad(text) {
  const R = typeof text === 'string' ? JSON.parse(text) : text; if (!R.save) return console.warn('This report has no saved game');
  let raw = R.save.data;
  if (R.save.enc === 'gzip-base64') { const bin = Uint8Array.from(atob(raw), c => c.charCodeAt(0)); raw = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text(); }
  loadGameObj(JSON.parse(raw));
}
