'use strict';
// ================= UTIL =================
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
const dateStr = t => SEASONS[(t + 1) % 4] + ' ' + (987 + Math.floor((t + 1) / 4));

// ================= HOUSES =================
const FACTIONS = [
  { id: 'aquitaine', title: 'Duke', pname: 'William Iron-Arm', name: 'Aquitaine', ruler: 'Duke William Iron-Arm', color: '#c58f22', home: 'poitou', realm: 'France',
    blurb: 'Broad southern lands and the Atlantic coast.', trait: 'Rich lands: every province yields +2 deniers.',
    arms: { t: 'lion', f: '#c8952a', c: '#8e1f1b' } },
  { id: 'normandy', title: 'Duke', pname: 'Richard the Fearless', name: 'Normandy', ruler: 'Duke Richard the Fearless', color: '#a3222c', home: 'normandy', realm: 'France',
    blurb: 'Norse blood, hard horsemen and the Channel ports.', trait: 'Norman horse: cavalry cost 16 instead of 20.',
    arms: { t: 'fess2', f: '#a3222c', c: '#e2b33c' } },
  { id: 'champagne', title: 'Count', pname: 'Herbert the Younger', name: 'Champagne', ruler: 'Count Herbert the Younger', color: '#2d5ea8', home: 'champagne', realm: 'France',
    blurb: 'The crossroads of trade, a day\'s ride from Paris.', trait: 'Trade fairs: market towns yield +4 more, and Champagne starts with one.',
    arms: { t: 'bendCot', f: '#2d5ea8', c: '#f2ead6', c2: '#e2b33c' } },
  { id: 'burgundy', title: 'Duke', pname: 'Henry the Great', name: 'Burgundy', ruler: 'Duke Henry the Great', color: '#6e2f63', home: 'burgundy', realm: 'France',
    blurb: 'Vineyards, abbeys and the favour of Cluny.', trait: 'Cluny\'s favour: bishops cost 18, and blessings last 5 turns.',
    arms: { t: 'bendy', f: '#e2b33c', c: '#2d4f96', c2: '#a3222c' } },
  { id: 'provence', title: 'Count', pname: 'William the Liberator', name: 'Provence', ruler: 'Count William the Liberator', color: '#2f7d4a', home: 'provence', realm: 'France',
    blurb: 'Fresh from routing the Saracens at Fraxinet.', trait: 'Sea trade: ports yield +3 more.',
    arms: { t: 'pallets', f: '#e2b33c', c: '#a3222c' } },
  { id: 'england', title: 'King', pname: 'Æthelred the Unready', name: 'England', ruler: 'King Æthelred the Unready', color: '#c4572a', home: 'wessex', realm: 'Foreign',
    blurb: 'A rich, united kingdom across the Narrow Sea.', trait: 'The fyrd: double levies in every province, and longships cost 20.',
    arms: { t: 'cross', f: '#c4572a', c: '#e9c254' } },
  { id: 'denmark', title: 'King', pname: 'Sweyn Forkbeard', name: 'Denmark', ruler: 'King Sweyn Forkbeard', color: '#1f7a7a', home: 'jutland', realm: 'Foreign',
    blurb: 'Sea kings who have just thrown down Harald Bluetooth.', trait: 'Sea kings: longships cost 20, win more sea fights, and Danes landing from the sea fight 10% harder.',
    arms: { t: 'cross', f: '#b8262b', c: '#f2ead6' } },
  { id: 'saxony', title: 'Duke', pname: 'Bernard Billung', name: 'Saxony', ruler: 'Duke Bernard Billung', color: '#55636e', home: 'saxony', realm: 'Foreign',
    blurb: 'The Emperor is a child. The Saxon dukes look west.', trait: 'Silver of the Harz: mines yield +4 more, and Saxony starts with one.',
    arms: { t: 'barry', f: '#2a2a2a', c: '#e2b33c' } },
  { id: 'tuscany', title: 'Margrave', pname: 'Hugh the Great', name: 'Tuscany', ruler: 'Margrave Hugh the Great', color: '#ad3f6c', home: 'tuscany', realm: 'Foreign',
    blurb: 'Master of the pilgrim road to Rome.', trait: 'Via Francigena: market towns yield +3 more from pilgrims and merchants.',
    arms: { t: 'perpale', f: '#ad3f6c', c: '#f2ead6' } },
  { id: 'bavaria', title: 'Duke', pname: 'Henry the Quarrelsome', name: 'Bavaria', ruler: 'Duke Henry the Quarrelsome', color: '#4b3a7a', home: 'bavaria', realm: 'Foreign',
    blurb: 'Thrice a rebel against the Ottonians, now master of the Alpine passes into Italy.', trait: 'Alpine iron: the forge, armory and royal stables cost half.',
    arms: { t: 'bendy', f: '#f2ead6', c: '#4b3a7a', c2: '#f2ead6' } },
  { id: 'naples', title: 'Duke', pname: 'Marinus II', name: 'Naples', ruler: 'Duke Marinus II', color: '#7f8f2a', home: 'naples', realm: 'Foreign',
    blurb: 'A Greek-speaking duchy rich from the Mediterranean trade.', trait: 'Byzantine engineers: catapults cost 15, and each fires an extra shot.',
    arms: { t: 'perfess', f: '#e2b33c', c: '#2d4f96' } },
];
const FACMAP = Object.fromEntries(FACTIONS.map(f => [f.id, f]));
function FAC(id) { return (G && G.fmap && G.fmap[id]) || FACMAP[id]; }

// ================= PROVINCES =================
// id, name, lon, lat, seas, hills, base, owner, castle, lord, region
const PROV = [
  // France
  ['flanders', 'Flanders', 2.95, 50.8, 'north,channel', 0, 7, null, 1, 'Count Arnulf II', 'fr'],
  ['ponthieu', 'Ponthieu', 1.95, 50.1, 'channel', 0, 5, null, 0, 'Count Hilduin', 'fr'],
  ['vermandois', 'Vermandois', 3.25, 49.75, '', 0, 6, 'champagne', 1, '', 'fr'],
  ['cotentin', 'Cotentin', -1.3, 49.25, 'channel', 0, 4, 'normandy', 0, '', 'fr'],
  ['normandy', 'Normandy', 0.9, 49.3, 'channel', 0, 6, 'normandy', 1, '', 'fr'],
  ['brittany', 'Brittany', -3.0, 48.1, 'channel,celtic,biscay', 1, 5, null, 1, 'Duke Conan the Crooked', 'fr'],
  ['maine', 'Maine', 0.15, 48.1, '', 0, 5, null, 0, 'Count Hugh III', 'fr'],
  ['anjou', 'Anjou', -0.6, 47.35, '', 0, 6, null, 1, 'Count Fulk Nerra', 'fr'],
  ['blois', 'Blois', 1.45, 47.75, '', 0, 6, null, 1, 'Count Odo', 'fr'],
  ['paris', 'Paris', 2.45, 48.75, '', 0, 9, null, 1, 'the Robertian household', 'fr'],
  ['reims', 'Reims', 4.1, 49.35, '', 0, 5, 'champagne', 0, '', 'fr'],
  ['champagne', 'Champagne', 4.15, 48.25, '', 0, 6, 'champagne', 1, '', 'fr'],
  ['auxerre', 'Auxerre', 3.4, 47.55, '', 1, 5, 'burgundy', 0, '', 'fr'],
  ['burgundy', 'Burgundy', 4.9, 47.25, '', 1, 6, 'burgundy', 1, '', 'fr'],
  ['besancon', 'Besançon', 6.2, 47.1, '', 1, 5, 'burgundy', 0, '', 'fr'],
  ['berry', 'Berry', 2.3, 46.85, '', 0, 5, null, 0, 'the Viscount of Bourges', 'fr'],
  ['poitou', 'Poitou', -0.2, 46.55, 'biscay', 0, 6, 'aquitaine', 1, '', 'fr'],
  ['saintonge', 'Saintonge', -0.55, 45.7, 'biscay', 0, 5, 'aquitaine', 0, '', 'fr'],
  ['limousin', 'Limousin', 1.5, 45.75, '', 1, 4, null, 0, 'Viscount Gerald', 'fr'],
  ['auvergne', 'Auvergne', 3.05, 45.6, '', 1, 5, null, 1, 'Count Guy', 'fr'],
  ['lyon', 'Lyon', 4.75, 45.95, '', 0, 7, null, 1, 'Archbishop Burchard', 'fr'],
  ['viennois', 'Viennois', 5.8, 45.2, '', 1, 5, 'provence', 0, '', 'fr'],
  ['bordeaux', 'Bordeaux', -0.6, 44.75, 'biscay', 0, 6, null, 0, 'the Bishop of Bordeaux', 'fr'],
  ['rouergue', 'Rouergue', 2.55, 44.4, '', 1, 4, null, 0, 'Count Raymond', 'fr'],
  ['toulouse', 'Toulouse', 1.4, 43.65, '', 0, 7, null, 1, 'Count William Taillefer', 'fr'],
  ['gascony', 'Gascony', -0.5, 43.6, 'biscay', 1, 5, null, 0, 'Duke William Sánchez', 'fr'],
  ['septimania', 'Septimania', 3.2, 43.6, 'lion', 1, 6, null, 0, 'Count Roger of Carcassonne', 'fr'],
  ['provence', 'Provence', 5.3, 43.75, 'lion', 1, 6, 'provence', 1, '', 'fr'],
  // Britain
  ['cornwall', 'Cornwall', -4.7, 50.45, 'channel,celtic', 1, 4, null, 0, 'the Ealdorman of Cornwall', 'br'],
  ['wessex', 'Wessex', -1.6, 51.15, 'channel', 0, 7, 'england', 1, '', 'br'],
  ['kent', 'Kent', 0.6, 51.2, 'channel,north', 0, 6, 'england', 0, '', 'br'],
  ['mercia', 'Mercia', -1.9, 52.6, 'irish', 0, 6, 'england', 0, '', 'br'],
  ['eastanglia', 'East Anglia', 1.0, 52.45, 'north', 0, 5, null, 0, 'Ealdorman Æthelwine', 'br'],
  ['york', 'York', -1.1, 54.0, 'north', 0, 5, null, 1, 'the Earl of York', 'br'],
  ['northumbria', 'Northumbria', -1.9, 55.1, 'north', 0, 4, null, 1, 'Earl Waltheof of Bamburgh', 'br'],
  ['gwynedd', 'Gwynedd', -3.9, 52.9, 'irish', 1, 4, null, 0, 'Maredudd ab Owain', 'br'],
  ['deheubarth', 'Deheubarth', -4.1, 51.95, 'celtic,irish', 1, 4, null, 0, 'the sons of Einion', 'br'],
  ['strathclyde', 'Strathclyde', -4.2, 55.55, 'irish,west', 1, 3, null, 0, 'King Máel Coluim', 'br'],
  ['alba', 'Alba', -3.8, 56.9, 'north,west', 1, 4, null, 1, 'King Kenneth II', 'br'],
  // Ireland
  ['ulaid', 'Ulaid', -6.5, 54.6, 'irish,west', 0, 3, null, 0, 'the King of Ulaid', 'ie'],
  ['connacht', 'Connacht', -8.9, 53.7, 'west', 1, 3, null, 0, 'King Conchobar', 'ie'],
  ['mide', 'Mide', -7.4, 53.6, '', 0, 4, null, 1, 'High King Máel Sechnaill', 'ie'],
  ['dublin', 'Dublin', -6.3, 53.25, 'irish', 0, 5, null, 1, 'King Glúniairn of Dublin', 'ie'],
  ['leinster', 'Leinster', -6.8, 52.6, 'irish,celtic', 0, 4, null, 0, 'King Donnchad of Leinster', 'ie'],
  ['munster', 'Munster', -8.6, 52.25, 'celtic,west', 1, 4, null, 1, 'King Brian Bóruma', 'ie'],
  // German lands
  ['frisia', 'Frisia', 6.0, 53.1, 'north', 0, 4, null, 0, 'the Count of West Frisia', 'de'],
  ['lowerlorraine', 'Aachen', 5.3, 50.7, '', 0, 6, null, 1, 'Duke Charles the Carolingian', 'de'],
  ['upperlorraine', 'Upper Lorraine', 6.4, 48.9, '', 1, 5, null, 1, 'Duchess Beatrice', 'de'],
  ['westphalia', 'Westphalia', 7.8, 51.8, '', 0, 4, 'saxony', 0, '', 'de'],
  ['saxony', 'Saxony', 10.0, 52.7, 'north,baltic', 0, 6, 'saxony', 1, '', 'de'],
  ['thuringia', 'Thuringia', 11.2, 51.0, '', 1, 4, 'saxony', 0, '', 'de'],
  ['franconia', 'Franconia', 9.8, 49.9, '', 0, 5, null, 1, 'Duke Otto of Worms', 'de'],
  ['swabia', 'Swabia', 9.0, 48.2, '', 1, 5, null, 1, 'Duke Conrad of Swabia', 'de'],
  ['bavaria', 'Bavaria', 12.0, 48.4, '', 0, 6, 'bavaria', 1, '', 'de'],
  ['eastmarch', 'Eastern March', 15.3, 48.2, '', 1, 3, null, 0, 'Margrave Leopold', 'de'],
  ['carinthia', 'Carinthia', 14.0, 46.8, '', 1, 3, null, 0, 'Duke Henry the Younger', 'de'],
  ['transjurane', 'Transjurane', 7.6, 46.7, '', 1, 4, null, 1, 'King Conrad of Burgundy', 'de'],
  // Italy
  ['ivrea', 'Ivrea', 7.8, 45.3, '', 1, 4, null, 0, 'Margrave Conrad of Ivrea', 'it'],
  ['lombardy', 'Lombardy', 9.4, 45.4, '', 0, 7, null, 1, 'the Archbishop of Milan', 'it'],
  ['friuli', 'Friuli', 13.1, 46.1, 'adri', 1, 4, null, 0, 'the Patriarch of Aquileia', 'it'],
  ['venice', 'Venice', 12.2, 45.45, 'adri', 0, 6, null, 1, 'Doge Tribuno Memmo', 'it'],
  ['liguria', 'Liguria', 8.6, 44.5, 'lion,tyrr', 1, 4, null, 0, 'the Bishop of Genoa', 'it'],
  ['tuscany', 'Tuscany', 11.0, 43.5, 'tyrr', 0, 6, 'tuscany', 1, '', 'it'],
  ['romagna', 'Romagna', 11.8, 44.4, 'adri', 0, 5, null, 0, 'the Archbishop of Ravenna', 'it'],
  ['pentapolis', 'Pentapolis', 13.1, 43.35, 'adri', 0, 4, null, 0, 'the Counts of the Pentapolis', 'it'],
  ['spoleto', 'Spoleto', 12.9, 42.6, '', 1, 4, 'tuscany', 0, '', 'it'],
  ['rome', 'Rome', 12.4, 41.95, 'tyrr', 0, 6, null, 1, 'Pope John XV', 'it'],
  ['benevento', 'Benevento', 14.9, 41.35, '', 1, 4, 'naples', 1, '', 'it'],
  ['naples', 'Naples', 14.25, 40.85, 'tyrr', 0, 6, 'naples', 1, '', 'it'],
  ['apulia', 'Apulia', 16.6, 41.0, 'adri,ionian', 0, 5, null, 1, 'the Byzantine catepan', 'it'],
  ['calabria', 'Calabria', 16.3, 39.1, 'tyrr,ionian', 1, 4, null, 0, 'the Byzantine strategos', 'it'],
  // Denmark
  ['schleswig', 'Schleswig', 9.4, 54.75, 'north,baltic', 0, 4, 'denmark', 0, '', 'dk'],
  ['jutland', 'Jutland', 9.2, 56.2, 'north,baltic', 0, 5, 'denmark', 1, '', 'dk'],
  ['zealand', 'Zealand', 11.75, 55.5, 'baltic', 0, 5, 'denmark', 0, '', 'dk'],
  ['scania', 'Scania', 13.6, 55.95, 'baltic', 1, 4, null, 0, 'the Jarl of Scania', 'dk'],
];
const REGION_NAME = { fr: 'France', br: 'Britain', ie: 'Ireland', de: 'the German lands', it: 'Italy', dk: 'Denmark' };

// sea lanes: id, name, lon, lat
const SEAS = [
  ['irish', 'Irish Sea', -4.9, 53.9], ['celtic', 'Celtic Sea', -7.2, 50.8], ['channel', 'Narrow Sea', -2.2, 50.15],
  ['north', 'German Sea', 3.0, 54.9], ['biscay', 'Bay of Biscay', -4.5, 45.6], ['west', 'Western Ocean', -9.8, 56.3],
  ['lion', 'Gulf of Lion', 4.8, 42.3], ['tyrr', 'Tyrrhenian Sea', 11.6, 40.3], ['adri', 'Adriatic Sea', 15.0, 43.0],
  ['ionian', 'Ionian Sea', 18.6, 38.4], ['baltic', 'Baltic Sea', 14.5, 55.2],
];
const SEA_ADJ = {
  irish: ['celtic', 'west'], celtic: ['irish', 'channel', 'biscay', 'west'], channel: ['celtic', 'north'],
  north: ['channel', 'west', 'baltic'], biscay: ['celtic', 'lion'], west: ['irish', 'celtic', 'north'],
  lion: ['biscay', 'tyrr'], tyrr: ['lion', 'ionian'], adri: ['ionian'], ionian: ['tyrr', 'adri'], baltic: ['north'],
};
const SEAMAP = Object.fromEntries(SEAS.map(s => [s[0], s[1]]));

// ================= UNITS & BUILDINGS =================
// Attack and hit points per company. Value per denier is roughly even; each does a different job.
const UNIT = {
  foot: { n: 'Footmen', c: 8, i: '🛡️', atk: 3, hp: 10, d: 'Spearmen. Form a shield wall when defensive, or advance as a deep line when aggressive.' },
  bow: { n: 'Bowmen', c: 10, i: '🏹', atk: 1, rng: 3, hp: 6, d: 'Wear the enemy down at long range as they close. Weak in a melee and easy prey for horse.' },
  cav: { n: 'Cavalry', c: 20, i: '🐎', atk: 5, chg: 10, hp: 14, d: 'Milites. Fight the enemy horse on the wings, then ride round to strike the rear.' },
  cat: { n: 'Catapults', c: 25, i: '🪨', rng: 6, hp: 0, d: 'Three shots each when bombarding. In a garrison they shoot from the walls.' },
  bishop: { n: 'Bishops', c: 30, i: '✝️', d: 'Sit in your council of bishops. Can be raised to cardinal.' },
};
const LEVY = { atk: 2, hp: 6 };
const ICON = { militia: '🧑‍🌾', foot: '🛡️', bow: '🏹', cav: '🐎', cat: '🪨', bishop: '✝️' };
const LBL = { militia: 'Levy', foot: 'Footmen', bow: 'Bowmen', cav: 'Cavalry', cat: 'Catapults', bishop: 'Bishops' };
const BLD = {
  farm: { n: 'Farms', c: 25, t: 2, y: 4, i: '🌾' },
  market: { n: 'Market town', c: 45, t: 3, y: 7, i: '⚖️' },
  port: { n: 'Port', c: 45, t: 3, y: 7, i: '⚓', need: 'coast' },
  mine: { n: 'Mine', c: 40, t: 3, y: 6, i: '⛏️', need: 'hills' },
  castle: { n: 'Castle', c: 60, t: 3, y: 0, i: '🏰' },
  moat: { n: 'Moat', c: 50, t: 2, y: 0, i: '〰️', d: 'Slows attackers under fire and weakens them at the walls.' },
  forge: { n: 'Forge', c: 220, t: 5, y: 0, i: '⚒️', realm: true, d: 'Mail for your men: +15% hit points for all your troops.' },
  armory: { n: 'Armory', c: 220, t: 5, y: 0, i: '⚔️', realm: true, d: 'Better swords and spears: +15% attack for all your troops.' },
  stables: { n: 'Royal stables', c: 200, t: 5, y: 0, i: '🐴', realm: true, d: 'Bred warhorses: cavalry +25% attack and charge.' },
};
const CASTLE_N = ['No castle', 'Wooden castle', 'Stone castle', 'Great walls'];
const CASTLE_C = [60, 90, 140], CASTLE_T = [3, 4, 5];
const FIGHT = ['militia', 'foot', 'bow', 'cav'];
const MAXLV = 2, TRUCE = 6, MOVES = 2;
const UPKEEP = { foot: 1, bow: 1, cav: 2.5, cat: 2 };
const PACT_TURNS_JOINT = 10;
const ROMAN = ['', '', ' II'];

// ================= GENERALS =================
const GENERALS = [
  { id: 'bouchard', n: 'Bouchard the Venerable', d: 'Count of Vendôme. A patient defender of walls.', c: 60, def: .25, morale: .05 },
  { id: 'byrhtnoth', n: 'Byrhtnoth of Essex', d: 'A towering ealdorman who leads the shield wall from the front.', c: 55, foot: .3, morale: .08 },
  { id: 'geoffrey', n: 'Geoffrey Greymantle', d: 'An old campaigner of Anjou, sound in every part of war.', c: 70, atk: .12, def: .12 },
  { id: 'gerbert', n: 'Gerbert the Engineer', d: 'A scholar of Aurillac who studied Moorish siegecraft.', c: 60, siege: 1, def: .05 },
  { id: 'thorkell', n: 'Thorkell the Tall', d: 'A Danish sea-lord. Hits hard and thinks little.', c: 65, atk: .25, def: -.05 },
  { id: 'lambert', n: 'Lambert of Louvain', d: 'A master of the mounted charge.', c: 60, cav: .4 },
  { id: 'osgar', n: 'Osgar Bowmaster', d: 'Trained the archers of the Welsh March.', c: 50, bow: .45 },
  { id: 'adalbero', n: 'Adalbero of Laon', d: 'A scheming bishop with an eye for ground.', c: 55, def: .15, morale: .1 },
  { id: 'raoul', n: 'Raoul of Ivry', d: 'Hard on rebels and quick in the saddle.', c: 60, atk: .1, cav: .2 },
  { id: 'eadric', n: 'Eadric the Huscarl', d: 'Captain of a household guard of axemen.', c: 55, foot: .25, atk: .05 },
  { id: 'sancho', n: 'Sancho the Navarrese', d: 'A mercenary horseman from beyond the Pyrenees.', c: 50, cav: .3 },
  { id: 'theophylact', n: 'Theophylact the Greek', d: 'A Byzantine officer skilled with engines and bows.', c: 65, siege: 1, bow: .2 },
];
const GENMAP = Object.fromEntries(GENERALS.map(g => [g.id, g]));
function genSummary(g) {
  const t = [];
  if (g.atk) t.push(`${g.atk > 0 ? '+' : ''}${Math.round(g.atk * 100)}% attack`);
  if (g.def) t.push(`${g.def > 0 ? '+' : ''}${Math.round(g.def * 100)}% defence`);
  if (g.foot) t.push(`+${Math.round(g.foot * 100)}% footmen`);
  if (g.bow) t.push(`+${Math.round(g.bow * 100)}% bowmen`);
  if (g.cav) t.push(`+${Math.round(g.cav * 100)}% cavalry`);
  if (g.morale) t.push('steadier morale');
  if (g.siege) t.push('siege expert: +1 shot per catapult, faster starvation');
  return t.join(' · ');
}
const LADIES = ['Adela', 'Emma', 'Gerberga', 'Mathilde', 'Hildegarde', 'Ermengarde', 'Judith', 'Constance', 'Gisela', 'Richilde', 'Beatrix', 'Alix', 'Adelaide', 'Rothilde', 'Ælfgifu', 'Gormflaith'];

// ================= GEOGRAPHY =================
const MW = 1250, MH = 1360;
const px = lon => (lon + 11.3) * 41 + 10, py = lat => (58.9 - lat) * 60 + 10;
const LL = ([a, b]) => [px(a), py(b)];
const CONT_LL = [[-1.8, 43.3], [-1.5, 43.6], [-1.2, 44.6], [-1.25, 45.6], [-1.2, 46.2], [-2.1, 46.8], [-2.5, 47.3], [-3.5, 47.7], [-4.4, 47.8], [-4.75, 48.4], [-4.0, 48.7], [-3.0, 48.8], [-2.0, 48.6], [-1.6, 48.65], [-1.9, 49.7], [-1.3, 49.65], [-1.1, 49.35], [0.1, 49.45], [0.2, 49.7], [1.4, 50.1], [1.6, 50.7], [1.9, 51.0], [2.5, 51.1],
  [3.4, 51.35], [3.6, 51.5], [4.1, 52.0], [4.6, 52.5], [4.75, 52.95], [5.4, 53.4], [6.5, 53.5], [7.2, 53.6], [8.0, 53.6], [8.5, 53.5], [8.7, 53.9], [8.9, 54.3], [9.9, 54.4], [10.2, 54.45], [10.9, 54.0], [11.5, 54.05], [12.3, 54.3], [13.0, 54.4],
  [13.2, 53.6], [12.6, 52.9], [12.5, 52.2], [12.3, 51.4], [12.8, 50.7], [12.3, 50.2], [13.0, 49.6], [13.7, 48.8], [14.8, 48.75], [16.2, 48.6], [16.9, 48.1], [16.5, 47.6], [16.1, 46.8], [15.6, 46.3], [14.8, 45.8], [14.0, 45.6], [13.75, 45.65],
  [13.35, 45.75], [12.9, 45.6], [12.4, 45.45], [12.25, 45.0], [12.3, 44.5], [12.4, 44.1], [13.0, 43.8], [13.6, 43.55], [13.9, 42.95], [14.4, 42.4], [15.0, 42.1], [15.6, 41.95], [16.1, 41.9], [16.0, 41.6], [16.6, 41.2], [17.3, 40.9], [18.0, 40.6], [18.5, 40.15], [18.35, 39.8], [17.9, 40.25], [17.2, 40.45], [16.8, 40.3], [16.5, 39.75], [17.15, 39.1], [16.6, 38.75], [16.15, 38.05], [15.65, 37.95],
  [15.65, 38.25], [15.95, 38.65], [16.05, 39.2], [15.8, 39.8], [15.4, 40.05], [14.95, 40.25], [14.85, 40.6], [14.3, 40.75], [14.0, 40.95], [13.7, 41.25], [13.0, 41.25], [12.4, 41.65], [11.8, 42.1], [11.2, 42.45], [10.6, 42.95], [10.5, 43.4], [10.25, 43.85], [9.85, 44.05], [9.2, 44.3], [8.8, 44.4], [8.2, 43.95], [7.5, 43.78],
  [6.6, 43.1], [5.9, 43.1], [5.0, 43.35], [4.3, 43.5], [3.4, 43.3], [3.05, 42.9], [3.15, 42.45], [2.0, 42.4], [0.7, 42.8], [-0.7, 42.9]];
const BRIT_LL = [[-5.7, 50.05], [-4.2, 50.35], [-3.4, 50.6], [-2.5, 50.6], [-1.4, 50.75], [0.3, 50.75], [1.0, 50.95], [1.45, 51.35], [0.9, 51.55], [1.3, 51.9], [1.75, 52.5], [1.6, 52.9], [0.8, 52.95], [0.3, 52.85], [0.35, 53.2], [0.1, 53.6], [-0.2, 54.1], [-0.6, 54.5], [-1.2, 54.75], [-1.5, 55.2], [-1.8, 55.65], [-2.4, 56.0], [-2.6, 56.3], [-2.5, 56.6], [-2.0, 57.0], [-1.85, 57.6], [-3.5, 57.7], [-4.0, 57.6], [-3.1, 58.6], [-5.0, 58.6], [-5.5, 58.0], [-5.7, 57.3], [-6.0, 56.6], [-5.6, 56.0], [-5.0, 55.8], [-4.9, 55.3], [-5.1, 54.85], [-4.4, 54.7], [-3.4, 54.95], [-3.4, 54.5], [-3.0, 54.0], [-3.05, 53.4], [-3.6, 53.3], [-4.6, 53.3], [-4.5, 52.8], [-4.1, 52.4], [-5.2, 51.9], [-4.3, 51.6], [-3.2, 51.45], [-2.7, 51.5], [-3.4, 51.2], [-4.3, 51.2], [-5.0, 50.6]];
const IRE_LL = [[-6.0, 55.25], [-5.5, 54.6], [-6.1, 53.9], [-6.0, 53.2], [-6.2, 52.5], [-6.4, 52.2], [-7.0, 52.1], [-8.3, 51.7], [-9.8, 51.5], [-10.3, 52.1], [-9.5, 52.6], [-9.7, 53.2], [-10.2, 53.6], [-9.9, 54.2], [-8.6, 54.35], [-8.7, 54.85], [-8.3, 55.25], [-7.3, 55.35]];
const JUT_LL = [[8.9, 54.3], [9.9, 54.4], [10.2, 54.45], [10.0, 54.65], [9.6, 54.85], [9.5, 55.1], [9.7, 55.5], [10.2, 55.6], [10.25, 56.05], [10.6, 56.5], [10.3, 57.0], [10.6, 57.75], [9.9, 57.55], [8.6, 57.1], [8.1, 56.6], [8.15, 55.6], [8.6, 54.9]];
const ZEA_LL = [[11.2, 55.3], [11.8, 55.15], [12.3, 55.2], [12.6, 55.7], [12.6, 56.05], [12.0, 56.1], [11.4, 55.95], [10.95, 55.75]];
const SCA_LL = [[12.45, 56.3], [12.9, 55.6], [13.3, 55.35], [14.2, 55.4], [14.4, 55.75], [14.6, 56.2], [15.0, 56.4], [14.9, 56.9], [13.0, 56.9]];
const CORS_LL = [[9.4, 43.0], [9.55, 42.6], [9.4, 41.4], [9.15, 41.4], [8.6, 41.9], [8.6, 42.4], [9.3, 43.0]];
const SARD_LL = [[9.6, 41.1], [9.8, 40.5], [9.6, 39.2], [9.0, 39.0], [8.4, 39.0], [8.4, 40.6], [8.2, 40.9], [9.2, 41.25]];
const SICI_LL = [[12.4, 38.1], [13.4, 38.2], [15.6, 38.3], [15.3, 37.2], [15.1, 36.7], [14.5, 36.8], [12.9, 37.6], [12.4, 37.9]];
const ci = (lon, lat) => CONT_LL.findIndex(p => p[0] === lon && p[1] === lat);
const iBiar = ci(-1.8, 43.3), iEider = ci(8.9, 54.3), iKiel = ci(10.2, 54.45), iBalE = ci(13.0, 54.4), iTrieste = ci(13.75, 45.65), iPyr = ci(3.15, 42.45);
const SEA_ATL_LL = [...CONT_LL.slice(iBiar, iEider + 1), [8.6, 54.9], [8.15, 55.6], [8.1, 56.6], [8.6, 57.1], [10.6, 57.75], [8.5, 58.3], [6.6, 58.1], [5.5, 59], [5.2, 61], [-14, 61], [-14, 35], [-9.0, 36.0], [-8.8, 37.0], [-8.9, 38.5], [-9.5, 38.8], [-9.0, 40.2], [-8.7, 41.2], [-8.9, 42.1], [-9.3, 42.9], [-8.9, 43.3], [-7.7, 43.75], [-6.0, 43.55], [-4.5, 43.4], [-3.0, 43.4]];
const SEA_BAL_LL = [...CONT_LL.slice(iKiel, iBalE + 1), [14.2, 53.9], [15.5, 54.2], [17.0, 54.7], [18.7, 54.4], [19.8, 54.5], [22, 54.5], [22, 61], [18.5, 61], [18.8, 59.3], [16.6, 57.5], [16.3, 56.6], [14.5, 56.0], [12.9, 55.4], [12.6, 56.1], [11.0, 56.0], [10.6, 55.1]];
const SEA_MED_LL = [...CONT_LL.slice(iTrieste, iPyr + 1), [3.2, 41.9], [2.2, 41.3], [1.0, 41.05], [0.5, 40.6], [-0.3, 39.5], [0.2, 38.8], [-0.6, 38.2], [-0.9, 37.6], [-1.6, 37.2], [-2.0, 36.7], [-4.4, 36.7], [-5.5, 36.0], [-6, 34], [23, 34], [23, 38.0], [21.2, 38.2], [20.2, 39.6], [19.4, 40.4], [19.5, 41.8], [18.5, 42.45], [17.5, 43.0], [16.4, 43.5], [15.2, 44.3], [14.5, 45.3]];
const CONT = CONT_LL.map(LL), BRIT = BRIT_LL.map(LL), IRE = IRE_LL.map(LL);
const LANDS = [CONT, BRIT, IRE, JUT_LL.map(LL), ZEA_LL.map(LL), SCA_LL.map(LL)];
const SEA_POLYS = [SEA_ATL_LL, SEA_BAL_LL, SEA_MED_LL].map(a => a.map(LL));
const ISLES = [CORS_LL, SARD_LL, SICI_LL].map(a => a.map(LL));
const pathOf = pts => 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z';
function inPoly(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi)) c = !c;
  }
  return c;
}
const onLand = pt => LANDS.some(L => inPoly(pt, L));
function clipHalf(poly, a, b) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = b[0] - a[0], ny = b[1] - a[1];
  const f = p => (p[0] - mx) * nx + (p[1] - my) * ny;
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length], fp = f(P), fq = f(Q);
    if (fp <= 0) out.push(P);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); }
  }
  return out;
}
function voronoi(seeds) {
  return seeds.map((s, i) => {
    let poly = [[-200, -200], [MW + 200, -200], [MW + 200, MH + 200], [-200, MH + 200]];
    seeds.forEach((t, j) => { if (i !== j) poly = clipHalf(poly, s, t); });
    return poly;
  });
}
const SEEDS = PROV.map(r => LL([r[2], r[3]]));
const CELLS = voronoi(SEEDS);
const CELLD = {};
PROV.forEach((r, i) => CELLD[r[0]] = pathOf(CELLS[i]));
const ADJ = {};
PROV.forEach(r => ADJ[r[0]] = []);
for (let i = 0; i < PROV.length; i++) for (let j = i + 1; j < PROV.length; j++) {
  const a = SEEDS[i], b = SEEDS[j];
  const vs = CELLS[i].filter(v => Math.abs(Math.hypot(v[0] - a[0], v[1] - a[1]) - Math.hypot(v[0] - b[0], v[1] - b[1])) < 0.6);
  if (vs.length < 2) continue;
  let best = null, bd = -1;
  for (let m = 0; m < vs.length; m++) for (let n = m + 1; n < vs.length; n++) { const d = Math.hypot(vs[m][0] - vs[n][0], vs[m][1] - vs[n][1]); if (d > bd) { bd = d; best = [vs[m], vs[n]]; } }
  let inside = 0;
  for (let k = 1; k < 30; k++) { const t = k / 30; if (onLand([best[0][0] + (best[1][0] - best[0][0]) * t, best[0][1] + (best[1][1] - best[0][1]) * t])) inside++; }
  if (inside >= 2) { ADJ[PROV[i][0]].push(PROV[j][0]); ADJ[PROV[j][0]].push(PROV[i][0]); }
}
const unlink = (a, b) => { ADJ[a] = ADJ[a].filter(x => x !== b); ADJ[b] = ADJ[b].filter(x => x !== a); };
const link = (a, b) => { if (!ADJ[a].includes(b)) { ADJ[a].push(b); ADJ[b].push(a); } };
unlink('cornwall', 'deheubarth'); unlink('wessex', 'deheubarth'); unlink('gwynedd', 'northumbria');
link('rome', 'naples'); link('calabria', 'naples');
unlink('zealand', 'scania'); unlink('zealand', 'saxony'); unlink('zealand', 'jutland'); unlink('zealand', 'schleswig'); link('brittany', 'maine');
const SEA_SEEDS = SEAS.map(s => LL([s[2], s[3]]));
const SEA_CELLS = voronoi(SEA_SEEDS);
const SEA_CELLD = {};
SEAS.forEach((s, i) => SEA_CELLD[s[0]] = pathOf(SEA_CELLS[i]));
const FRANCE = PROV.filter(r => r[10] === 'fr').map(r => r[0]);
// Charlemagne's empire: Francia, the German lands and Lombard Italy as far as Rome and Spoleto
const EMPIRE = PROV.filter(r => r[10] === 'fr' || r[10] === 'de' || ['ivrea', 'lombardy', 'friuli', 'liguria', 'tuscany', 'romagna', 'pentapolis', 'spoleto', 'rome'].includes(r[0])).map(r => r[0]);
const KINGDOMS = {
  franks: { n: 'the Franks', short: 'France', region: 'fr', keys: ['reims', 'paris'], need: 18, at: 'Reims' },
  english: { n: 'the English', short: 'England', provs: ['cornwall', 'wessex', 'kent', 'mercia', 'eastanglia', 'york', 'northumbria'], keys: ['wessex', 'york'], need: 6, at: 'Winchester' },
  germans: { n: 'Germany', short: 'Germany', region: 'de', keys: ['lowerlorraine', 'saxony'], need: 8, at: 'Aachen' },
  italians: { n: 'Italy', short: 'Italy', region: 'it', keys: ['lombardy', 'rome'], need: 9, at: 'Pavia' },
  danes: { n: 'the Danes', short: 'Denmark', region: 'dk', keys: ['jutland', 'zealand'], need: 3, at: 'Jelling' },
};
for (const k in KINGDOMS) KINGDOMS[k].list = KINGDOMS[k].provs || PROV.filter(r => r[10] === KINGDOMS[k].region).map(r => r[0]);
const KPROV = {};
for (const k in KINGDOMS) for (const id of KINGDOMS[k].list) (KPROV[id] = KPROV[id] || []).push(k);
const REGION_KINGDOM = { fr: 'franks', de: 'germans', it: 'italians', br: 'english', dk: 'danes' };
