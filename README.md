# Anointed, v6.42

Play it at https://jdc001.github.io/crown-of-the-franks/ (open in Safari, then Share → Add to Home Screen).

The old map of Europe (v4) lives on as **Emperor: 1000 AD**: https://jdc001.github.io/Emperor-1000/ . It picks up campaigns saved under v4 on the same device by itself.

## New in v6
- **No homage.** Every house plays for the crown. Goal: be crowned and hold half the kingdom's counties (or break every rival).
- **Diplomacy** (`diplomacy.js`): unbreakable pacts (2 or 3 years), alliances that open each other's lands to armies, war alliances. A house names its price: nothing if it suits it, silver or a county if reluctant, refusal if hostile.
- **Castles**: a wooden castle is one turn and 35 d but weak; stone 3 turns, great walls 4. House seats have an outer wall that must fall first (`hasOuter`, `p.outer`), drawn in the catapult scene.
- **Endings and statistics** (`stats.js`, `ending.js`): per-turn snapshots of every house, player counters, a coronation or defeat screen, then three swipeable pages: this game (time-lapse map, counties chart, deeds), past games, and this game against your averages. History and profile live in localStorage (`cotf-history`, `cotf-profile`, `cotf-lastgame`).
- **Ranks and trophies**: Seigneur to Emperor from points (40 trophies plus points per game). Personal arms, supporters, crowns, laurels and mantles (`heraldry.js`), shown on the title screen, the medals page, the statistics and around the house shield in the header.
- **Sharing**: a 1080x1350 card through the iOS share sheet. **The Chronicler's Challenge**: a seeded start that rotates, the same for everyone while it lasts.

## New in v5: France in 987
- **The map** is France and its edges: 103 counties (`PROV` in `data.js`), regions France, Lorraine, Arles and Catalonia. England, the Empire, Italy, Pamplona and Córdoba are hatched edge lands, not for conquest. No seas to sail: fleets and longships are gone; Danish raids are the sea.
- **Fifteen houses**: the Royal Domain (Hugh Capet, crowned), Lower Lorraine (Charles), Normandy, Flanders, Vermandois-Champagne, Blois, Anjou, Brittany, Aquitaine, Burgundy, Toulouse, Barcelona, Gascony, Provence, Roussillon. About 70% of counties start independent, so every house has room to grow.
- **One crown.** Crowned at Reims holding Reims and Paris (Charles: Reims and Laon) and at least 8 counties of the kingdom, for 120 d. Homage: the king summons princes (30 d, once a turn), frees captives for their oath, or declares a vassal's fiefs forfeit; vassals may renounce (and risk excommunication). King and vassal are at peace. The king's third army needs two princes sworn to him.
- **Goal "King in fact"** (default): wear the crown, hold the homage of two-thirds of the princes standing (at least three), and hold two-fifths of the kingdom's counties. Or Full conquest.
- **Anti-snowball rules**: income falls with distance from the seat (`reachMult`), unrest comes sooner to sprawling realms, the north is richer, outside powers press the south (Almanzor, Pamplona, Arles), and a league of princes forms against any house with more than a quarter of the kingdom.
- **Powers and events** (`powers.js`): Almanzor's raids (pay parias or fight), the Empire in Lorraine and at Reims, Normandy's Danish ports, Robert crowned co-king, Laon opened to Charles, Adalbero's death, Arnulf's betrayal, Normandy's English treaty.
- Saves are `G.v = 8` under `crownOfTheFranks987v8`. v4 saves are not loaded here; they play in Emperor: 1000 AD.

Computer-only games (`/home/claude/scripts/gsim5.js`, 32 games, cap 200 turns): finished games median about 107 turns, earliest 55; about 9.5 houses alive at turn 40; winners spread across Charles, Capet, Barcelona, Flanders, rebels and Gascony, with the south about a fifth. A quarter of computer-only games reach turn 200 without a winner; a player breaks those deadlocks.

## v4 (now Emperor: 1000 AD)
- **Victory goals**, chosen on a house's page: King of the Franks (short), Emperor (the Franks plus Germany or Italy, and half of Charlemagne's empire), or Full conquest. Only a crown won at a coronation counts; a crown handed to a coalition does not. The last house standing always wins. (`GOALS`, `goalMet`, `victor` in `core.js`)
- **Guided first campaign**: ten objectives, one at a time, each done when the player does it (`tutor.js`).
- **Auto-resolve** for battles (same model, player's stance and reserve) and **auto-bombard** for sieges; **volleys of three** fires or plague carcasses at the catapult.
- **Rival moves replayed on the map** after each turn: arrows for marches and sieges, flashes for conquests, house by house (`replay.js`). Settings: near me / all / off.
- **Saved games**: three slots, export as a file or a gzipped code, import from either (`saves.js`).
- **Mini-games**, each skippable with an auto-resolve (`minigames.js`, `dealings.js`):
  - *Mining*: steer a tunnel under the walls; brings down 30 to 62 points of wall whatever the castle level. Takes the place of a bombardment.
  - *Viking raid*: random event on a coastal province (about 8% a turn after turn 4, at most every 7 turns). Drag companies to the beach, shoot the ships, or pay danegeld.
  - *Ransom haggling*: the captor's envoy has a hidden price and three seals of patience; works both ways.
  - *The Champagne fair*: each summer for lords with a market town; six days of trading on rumours (right 70% of the time, 95% for Champagne).
  - *Forged charter*: trace three strokes and press the seal; a good forgery makes a lesser lord your ally for free, a poor one can mean excommunication.
- **Performance** (v3.1 to v3.3): GPU map panning, cached sprites and layers in battles and the catapult, canvases freed after each scene, one animation loop per scene, partial redraws of the interface.
- Saves from v3 still load (`G.v` is still 7; old games play as Full conquest).

Computer-only games with `tools/gsim.js 16 200 <goal>`: median length 108 turns for King of the Franks, 130 for Emperor (the computer houses do not chase the goals deliberately; a player going for Reims finishes much sooner).

## v3 notes

v3 implements the design notes in full. Every number in the notes is used as written.

## Files
- `js/data.js` — houses (now 11, with Bavaria), provinces, constants (`TRUCE = 6`, `MOVES = 2`, `UPKEEP`)
- `js/core.js` — the rules: armies (three slots), movement and striking, upkeep and desertion, administration, collapse and heirs, castellans, unrest and rebellion, unions, the Church, courtship, envoys, marriage pacts, alliances, saves (`crownOfTheFranks987v7`, `G.v = 7`)
- `js/battle.js` — the battle model with reserve, horse orders, `startFight`, `commitReserve`, `orderCav`, `manualA`
- `js/ai.js` — computer players: per-army war, difficulty knobs, idle marching, seat defence, concentration, recruiting with upkeep limits, generals, navy, courtship, envoys
- `js/difficulty.js` — only `DIFF` and `diff()`
- `js/audio.js` — unchanged from the original
- Presentation: `index.html`, `css/style.css`, `js/icons.js`, `js/view.js`, `js/map.js`, `js/panels.js`, `js/dialogs.js`, `js/battleview.js`, `js/catapult.js`, `js/app.js`, `service-worker.js` (bump `VERSION` and `APP_VERSION` in `dialogs.js` whenever a file changes)
- v4 additions: `js/saves.js`, `js/replay.js`, `js/tutor.js`, `js/minigames.js`, `js/dealings.js`

## Deviations from the notes, and why
1. **Reserve bowmen keep shooting** from behind the line (full rate). Without this, "never commit" tested at 26% against the 43% in the notes; with it, 32%. Every other battle target in section 6 reproduces within a few points (see below).
2. **Truce cooldown.** The same two houses cannot renew a Truce of God, a marriage pact or an envoy's peace within 10 turns of the last one lapsing (`TRUCE_COOL`). Without it the last weak house bought a new truce every few turns and games never ended (one Denmark sat on 19,800 gold doing exactly that).
3. **Army concentration.** When a house has gained no province for six turns, its armies march to the strongest one and merge into it. Without it, two large houses traded empty border provinces for hundreds of turns, each capital untouchable by any single army. This is what makes the 2.4× capital-siege rule in section 8 ever fire late in a game.
4. **Navy before recruiting** in the AI's turn order, so a house with nothing left to take by land funds ships before it spends the treasury on men.
5. **Seat guard.** The smallest adequate army guards the seat, not the first one considered; otherwise the strongest army stood guard every turn.
6. The second difficulty is labelled "Standard" in the interface (the internal name, "original", is kept in the code).

## Measured against the notes
Battle (equal 12/4/3 armies, balanced, 800 runs each): baseline 51% (notes: about 50); charge their horse 52 (50); raid the bowmen with their horse alive 28 (28); ride to the rear early 19 (14). Big 24/8/6 armies: no reserve 48 (50); commit at contact 57 (55); commit at +8 s 44 (44); never commit 32 (43).

Computer-only games (16, up to 200 turns, standard knobs): houses alive at turn 40 about 8.8 (notes: 6 to 7); median length 120 turns (notes: 110 to 115); rebellions 1.3 to 1.8 per game (notes: 2.2); winners spread across nine different houses and kingdoms; 3 of 16 games still unfinished at 200 turns, always a mainland leader against an island kingdom.

Harnesses: `tools/bsim.js` (battle) and `tools/gsim.js` (whole games) in the delivery zip run under Node with no browser.
