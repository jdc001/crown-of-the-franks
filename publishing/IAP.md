# Free to start: the in-app purchase

The website is never locked. The App Store build is free to start: Normandy, the Royal Domain and
Flanders on the gentle setting, with the whole map. One purchase unlocks the full game: every house,
every difficulty, the Chronicler's challenges and all five save slots. Trophies, points and ranks are
earned in the free game too.

Preview the locked version in a browser by adding `?store=1` to the address.

## What the app build has to do

1. In App Store Connect, create a **non-consumable** in-app purchase with the product ID
   `<your appId>.full` (for example `com.yourname.crownofthefranks.full`), priced at Tier 6 ($5.99).
2. Add a purchase plugin to the Capacitor project. `cordova-plugin-purchase` works with Capacitor:
   `npm install cordova-plugin-purchase && npx cap sync`.
3. Add a small script to the app build only (not the website), loaded before `js/app.js`, that switches
   the lock on and connects the game's two hooks to the store:

```html
<script>
  window.COTF_STORE = true;
  document.addEventListener('deviceready', () => {
    const { store, ProductType, Platform } = CdvPurchase;
    const ID = 'com.yourname.crownofthefranks.full';
    store.register([{ id: ID, type: ProductType.NON_CONSUMABLE, platform: Platform.APPLE_APPSTORE }]);
    store.when().approved(t => t.verify()).verified(r => r.finish()).finished(() => {});
    store.when().productUpdated(p => { if (p.id === ID && p.owned) cotfUnlocked(); });
    store.initialize([Platform.APPLE_APPSTORE]);
    window.COTF_BUY = () => { const o = store.get(ID)?.getOffer(); if (o) o.order(); };
    window.COTF_RESTORE = () => store.restorePurchases();
  }, false);
</script>
```

`cotfUnlocked()` remembers the purchase on the device and refreshes the title screen. "Restore a
purchase" (on the unlock screen and in Settings) is required by Apple's review rules for
non-consumable purchases, and it is already there.

## Store page wording

Say "Free to start" in the subtitle or first line, and list what the unlock adds. Players who feel
surprised by a paywall leave one-star reviews; players who were told up front mostly don't.

## Expansion maps

Each extra map (the first is *The Islands, 1066*) is its own **non-consumable** product, for example
`com.yourname.crownofthefranks.britain` at Tier 4 ($3.99). In the store build a map that has not been bought
shows an "Expansion" badge on the title screen, and tapping it opens its unlock screen. The game calls
`window.COTF_BUY('britain')` for it; when the store reports the product as owned, call `cotfMapUnlocked('britain')`.
Register it next to the full-game product in the script above:

```js
const MAPS_IAP = { 'com.yourname.crownofthefranks.britain': 'britain' };
store.register(Object.keys(MAPS_IAP).map(id => ({ id, type: ProductType.NON_CONSUMABLE, platform: Platform.APPLE_APPSTORE })));
store.when().productUpdated(p => { if (MAPS_IAP[p.id] && p.owned) cotfMapUnlocked(MAPS_IAP[p.id]); });
window.COTF_BUY = what => { const id = what === 'full' ? ID : Object.keys(MAPS_IAP).find(k => MAPS_IAP[k] === what); const o = id && store.get(id)?.getOffer(); if (o) o.order(); };
```

A bundle ("Complete Edition") can be added later as a third product that unlocks both: call `cotfUnlocked()`
and `cotfMapUnlocked('britain')` when it is owned.
