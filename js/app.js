'use strict';
// ================= BOOT =================
makeTex();
injectIconSprite();
buildMap();
initSheet();
applyLayout();
// sound: honour the settings on the first unlock
SND.on = !!(SET.music || SET.sfxOn);
document.addEventListener('pointerdown', () => { sndUnlock(); if (SND.ctx && !SND._applied) { SND._applied = true; applySound(); } }, { passive: true });
// keyboard shortcuts (desktop)
document.addEventListener('keydown', e => {
  if (!G || e.target.tagName === 'INPUT') return;
  if (e.key === 'Escape') { if (modalOpen()) { if (BV || CT) return; closeModal(); } else if (drawerOpen()) closeDrawer(); else if (G.sel) { G.sel = null; render(); } }
  else if ((e.key === 'e' || e.key === 'E') && !modalOpen() && !drawerOpen()) playerEndTurn();
  else if (e.key === 'Enter') {
    const yes = document.getElementById('endyes');
    if (yes) { e.preventDefault(); yes.click(); }
    else if (!modalOpen() && !drawerOpen() && !(typeof RP !== 'undefined' && RP)) { e.preventDefault(); showModal(`<div class="rep"><div class="sealmark">${ico('next')}</div><h2>End the turn?</h2><div class="grid2"><button class="btn gold" id="endyes" onclick="closeModal();playerEndTurn(true)">End turn <small>Enter</small></button><button class="btn" onclick="closeModal()">Not yet <small>Esc</small></button></div></div>`, '', { closable: true }); }
  }
  else if (e.key === 'h' || e.key === 'H') homeView(true);
  else if (e.key === 'l' || e.key === 'L') { if (drawerOpen()) closeDrawer(); else openLog(); }
  else if (e.key === 'c' || e.key === 'C') openCourt();
  else if (['1', '2', '3'].includes(e.key)) { const a = army(me(), 'a' + (Number(e.key) - 1)); if (a && armyUsable(me(), a)) pickArmy(a.id); }
  else if (e.key === '+' || e.key === '=') zoomBtn(0.75);
  else if (e.key === '-') zoomBtn(1.33);
});
document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.over) save(); });
window.addEventListener('orientationchange', () => setTimeout(() => { applyLayout(); if (G) applyView(); }, 250));
showTitle();
// a campaign carried over from another map, loaded once this map is up
try { const pend = sessionStorage.getItem('cotf-load'); if (pend) { sessionStorage.removeItem('cotf-load'); loadGameObj(JSON.parse(pend)); } } catch (e) { }

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('service-worker.js').catch(() => {});

// a one-time nudge for iPhone Safari users to install the game
(() => {
  const ios = /iPhone|iPad/.test(navigator.userAgent), standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  if (ios && !standalone && !SET.installNudged) { SET.installNudged = true; saveSettings(); setTimeout(() => toast('Share → Add to Home Screen for a full-screen game', 'phone'), 4000); }
})();

// ---------- if something breaks ----------
// The game saves after every move, so the safe answer to an unexpected error is to offer a reload: the campaign
// comes back from the autosave. Two errors within a few seconds are needed before the screen appears, so one
// stray glitch in a drawing loop does not interrupt a turn.
(function () {
  let last = 0, shown = false;
  function oops(msg) {
    const now = Date.now(); const again = now - last < 4000; last = now;
    if (!again || shown || document.getElementById('oops')) return;
    shown = true;
    const d = document.createElement('div'); d.id = 'oops';
    d.innerHTML = '<div><h2>Something went wrong</h2><p>Your campaign is safe: the game saves after every move. Reload to carry on from where you were.</p><button id="oopsr">Reload the game</button><button class="plain" id="oopsc">Keep playing</button><small></small></div>';
    d.querySelector('small').textContent = String(msg || '').slice(0, 160);
    document.body.appendChild(d);
    d.querySelector('#oopsr').onclick = () => location.reload();
    d.querySelector('#oopsc').onclick = () => { d.remove(); shown = false; };
  }
  window.addEventListener('error', e => { if (e && e.message && !/ResizeObserver|Script error/.test(e.message)) oops(e.message); });
  window.addEventListener('unhandledrejection', e => { const r = e && e.reason; if (r && r.name !== 'AbortError') oops(r.message || r); });
})();
