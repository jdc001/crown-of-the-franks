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

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('service-worker.js').catch(() => {});

// a one-time nudge for iPhone Safari users to install the game
(() => {
  const ios = /iPhone|iPad/.test(navigator.userAgent), standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  if (ios && !standalone && !SET.installNudged) { SET.installNudged = true; saveSettings(); setTimeout(() => toast('Share → Add to Home Screen for a full-screen game', 'phone'), 4000); }
})();
