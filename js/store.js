'use strict';
// ================= FREE TO START =================
// The App Store build is free to start: three houses on the gentle setting, with the whole map of France.
// One purchase unlocks every house, every difficulty, the Chronicler's challenges and all the save slots.
// On the website nothing is locked. The lock only switches on when the app build sets window.COTF_STORE,
// or for a preview with ?store=1 in the address. Trophies, points and ranks are earned either way, so a
// free player is already invested in the ladder when the unlock is offered.
const STORE = {
  FREE: ['normandy', 'capet', 'flanders'],
  PRICE: '$5.99',
  get on() { try { return !!window.COTF_STORE || /[?&]store=1/.test(location.search) || localStorage.getItem('cotf-store-preview') === '1'; } catch (e) { return false; } },
  get unlocked() { try { return localStorage.getItem('cotf-unlocked') === '1'; } catch (e) { return false; } },
};
const fullGame = () => !STORE.on || STORE.unlocked;
// the free houses and difficulties are a France thing; other maps are expansions, bought whole
const houseLocked = fid => MAP_ID === 'france' && !fullGame() && !SC.free.includes(fid);
const diffLocked = k => MAP_ID === 'france' && !fullGame() && k !== 'gentle';
const MAP_PRICE = '$3.99';
const mapLocked = id => { if (!STORE.on || id === 'france') return false; try { return localStorage.getItem('cotf-unlocked-' + id) !== '1'; } catch (e) { return true; } };
const slotLocked = n => !fullGame() && n > 1;

function openMapUnlock(id) {
  const M = MAPS[id];
  showModal(`<div class="rep unlock"><div class="sealmark">${ico('map')}</div><h2>${esc(M.name)}</h2><p class="ctr">${esc(M.sub)}. A second campaign: ${M.FACTIONS.length} new houses, a new map, new captains and new events.</p>
    <div class="facs" style="margin:10px 0">${M.FACTIONS.slice(0, 6).map(f => `<span class="tag">${armsSvg(f.arms, 16)} ${esc(f.name)}</span>`).join(' ')} <span class="sub">and more</span></div>
    <div class="row ctr"><button class="btn gold big" onclick="buyMap('${id}')"><span class="lbl">${ico('map')}Unlock the map · ${MAP_PRICE}</span></button></div>
    <div class="row ctr"><button class="btn sm ghost" onclick="restorePurchases()">Restore a purchase</button><button class="btn sm ghost" onclick="closeModal()">Not now</button></div></div>`, '', { closable: true });
}
function buyMap(id) { if (typeof window.COTF_BUY === 'function') { try { window.COTF_BUY(id); } catch (e) { toast('The store could not be reached. Try again in a moment.'); } return; } toast('Purchases are made in the App Store version of the game'); }
function cotfMapUnlocked(id) { try { localStorage.setItem('cotf-unlocked-' + id, '1'); } catch (e) { } sfx('bell'); closeModal(); showTitle(); toast(`${MAPS[id] ? MAPS[id].name : 'The map'} is yours`, 'map'); }
function openUnlock(why) {
  if (why && String(why).startsWith('map:')) return openMapUnlock(String(why).slice(4));
  const reason = why && FACMAP[why] ? `${esc(FACMAP[why].name)} is one of the twelve houses the full game adds.`
    : why === 'diff' ? 'Tougher rivals come with the full game.' : why === 'chal' ? 'The Chronicler\'s challenges come with the full game.' : why === 'slot' ? 'More save slots come with the full game.' : '';
  const free = STORE.FREE.map(f => `<span class="tag">${shield(f, 16)} ${esc(FACMAP[f].name)}</span>`).join(' ');
  showModal(`<div class="rep unlock"><div class="sealmark">${ico('crown')}</div><h2>The full game</h2>
    ${reason ? `<p class="ctr">${reason}</p>` : ''}
    <div class="ulgrid">
      <div>${ico('flag')}<b>All fifteen houses</b><small>From Flanders to Barcelona, each with its own lands, trait and road to the crown</small></div>
      <div>${ico('swords')}<b>Every difficulty</b><small>Standard and Hard rivals who scheme, ally and pile on</small></div>
      <div>${ico('scroll')}<b>The Chronicler's challenges</b><small>A set campaign everyone plays the same way, to beat your best</small></div>
      <div>${ico('chest')}<b>Five save slots</b><small>Keep several campaigns going at once</small></div>
    </div>
    <p class="sub ctr">Free now: ${free}, on the gentle setting, with the whole map. Your trophies, points and rank carry over.</p>
    <div class="row ctr"><button class="btn gold big" onclick="buyFull()"><span class="lbl">${ico('crown')}Unlock the full game · ${STORE.PRICE}</span></button></div>
    <div class="row ctr"><button class="btn sm ghost" onclick="restorePurchases()">Restore a purchase</button><button class="btn sm ghost" onclick="closeModal()">Not now</button></div>
    <p class="sub ctr" style="font-size:12px">One payment. No ads, no subscriptions.</p></div>`, '', { closable: true });
}
// the app build supplies window.COTF_BUY and window.COTF_RESTORE, which talk to the App Store
// and call cotfUnlocked() when the purchase goes through (see publishing/IAP.md)
function buyFull() {
  if (typeof window.COTF_BUY === 'function') { try { window.COTF_BUY('full'); } catch (e) { toast('The store could not be reached. Try again in a moment.'); } return; }
  toast('Purchases are made in the App Store version of the game');
}
function restorePurchases() {
  if (typeof window.COTF_RESTORE === 'function') { try { window.COTF_RESTORE(); } catch (e) { toast('The store could not be reached. Try again in a moment.'); } return; }
  toast('Purchases are restored in the App Store version of the game');
}
function cotfUnlocked() {
  try { localStorage.setItem('cotf-unlocked', '1'); } catch (e) { }
  sfx('bell'); closeModal(); if (!G || $('#title').style.display !== 'none') showTitle(); toast('The full game is yours', 'crown');
}
