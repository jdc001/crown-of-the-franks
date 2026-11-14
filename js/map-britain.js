'use strict';
// ================= THE MAP OF THE ISLANDS, 1066 =================
// Edward the Confessor is dead. Harold Godwinson wears the crown; William of Normandy and Harald Hardrada of Norway
// both claim it; the earls of England, the kings of Scotland, Wales and Ireland and the jarls of the Isles take
// what they can. Registered as a map; data.js reads whichever map is chosen.
MAPS.britain = (() => {
const FACTIONS = [
  // ---- the English ----
  { id: 'wessex', title: 'King', pname: 'Harold Godwinson', name: 'Wessex', ruler: 'King Harold Godwinson', color: '#b3262e', home: 'london', realm: 'England', houseTxt: 'The house of Godwin, Earls of Wessex',
    blurb: 'Crowned at Westminster on the day Edward was buried. The richest earldom in England, a crown, and enemies on every coast.', trait: 'The crown and the housecarls: starts crowned King of the English, with footmen at 7 d.',
    arms: { t: 'cross', f: '#b3262e', c: '#e2b33c' } },
  { id: 'eastanglia', title: 'Earl', pname: 'Gyrth Godwinson', name: 'East Anglia', ruler: 'Earl Gyrth Godwinson', color: '#d08a2a', home: 'norwich', realm: 'England', houseTxt: 'An earldom of the kingdom of the English',
    blurb: "Harold's loyal younger brother, earl of the fens and the wool towns. Rich, flat and open to the sea.", trait: 'Wool and the North Sea trade: markets yield +3, and your goods fetch 40% more at the summer fair.',
    arms: { t: 'chevron', f: '#d08a2a', c: '#2a1d12' } },
  { id: 'mercia', title: 'Earl', pname: 'Edwin of Mercia', name: 'Mercia', ruler: 'Earl Edwin of Mercia', color: '#3f6fb3', home: 'chester', realm: 'England', houseTxt: 'An earldom of the kingdom of the English',
    blurb: "Young, proud and of the old house of Leofric. He and his brother Morcar married their sister to Harold, and trust him no further.", trait: 'The heart of England: your counties raise a quarter more levies and pay +1 d a turn.',
    arms: { t: 'saltire', f: '#3f6fb3', c: '#e2b33c' } },
  { id: 'northumbria', title: 'Earl', pname: 'Morcar of Northumbria', name: 'Northumbria', ruler: 'Earl Morcar of Northumbria', color: '#5a7a3a', home: 'york', realm: 'England', houseTxt: 'An earldom of the kingdom of the English',
    blurb: 'The northerners threw out Tostig and chose Morcar. York is his, and the hard country to the Tweed answers to no one for long.', trait: 'Hard northern country: castles cost 25% less and go up a turn faster.',
    arms: { t: 'bendy', f: '#5a7a3a', c: '#e9ddbc' } },
  // ---- the Normans ----
  { id: 'normandy', title: 'Duke', pname: 'William the Bastard', name: 'Normandy', ruler: 'Duke William the Bastard', color: '#8e1f1b', home: 'rouen', realm: 'Normandy', houseTxt: 'A great fief of the kingdom of the Franks',
    blurb: 'He says Edward promised him the crown, and that Harold swore to it on holy relics. He has the best horsemen in Christendom and the Pope\'s ear.', trait: 'Norman horse: cavalry cost 16 instead of 20. In the summer of 1066 the Pope sends him a consecrated banner.',
    arms: { t: 'fess2', f: '#a3222c', c: '#e2b33c' } },
  { id: 'boulogne', title: 'Count', pname: 'Eustace of Boulogne', name: 'Boulogne', ruler: 'Count Eustace II of Boulogne', color: '#d4a017', home: 'boulogne', realm: 'Normandy', houseTxt: 'A county of the Frankish coast',
    blurb: "Edward's brother-in-law, thrown out of Dover with his men in 1051 and never forgiven. His ships sit across the narrowest strait.", trait: 'Channel ships: ports yield +3, and the shortest crossing to England is yours.',
    arms: { t: 'roundels', f: '#d4a017', c: '#a3222c' } },
  // ---- the Northmen ----
  { id: 'norway', title: 'King', pname: 'Harald Hardrada', name: 'Norway', ruler: 'King Harald Hardrada', color: '#26408a', home: 'bergen', realm: 'Norway', houseTxt: 'A kingdom of the Northmen',
    blurb: 'Once a captain of the Varangian Guard in Constantinople, now the most feared king in the north. Cnut\'s heirs promised Norway the English crown; he means to collect.', trait: 'The Varangian: your men fight 10% harder, and Greek fire costs only 25 d.',
    arms: { t: 'lion', f: '#a3222c', c: '#e2b33c' } },
  { id: 'orkney', title: 'Earl', pname: 'Paul Thorfinnsson', name: 'Orkney', ruler: 'Earl Paul Thorfinnsson', color: '#4f6f7a', home: 'orkney', realm: 'Norway', houseTxt: 'A jarldom of the Northmen',
    blurb: 'Paul and his brother Erlend rule the islands their father Thorfinn the Mighty won. Their longships answer to the King of Norway, when he comes.', trait: 'Sea raiders: bowmen cost 8, and ports yield +2.',
    arms: { t: 'barry', f: '#4f6f7a', c: '#e9ddbc' } },
  { id: 'isles', title: 'King', pname: 'Godred Sihtricson', name: 'The Isles', ruler: 'King Godred Sihtricson', color: '#2f8f7f', home: 'man', realm: 'Norway', houseTxt: 'The kingdom of Man and the Isles',
    blurb: 'A Norse-Gaelic king on Man, with the Hebrides and the Irish Sea trade in his hands, and a fleet that goes where it pleases.', trait: 'Sea-kings: ports yield +3, and lesser lords ask 25% less to swear to you.',
    arms: { t: 'pale', f: '#2f8f7f', c: '#e9ddbc' } },
  // ---- the Scots and the Welsh ----
  { id: 'scotland', title: 'King', pname: 'Malcolm Canmore', name: 'Scotland', ruler: 'King Malcolm III', color: '#3a2a5a', home: 'scone', realm: 'Scotland', houseTxt: 'The kingdom of Alba',
    blurb: 'He killed Macbeth for his crown. Tostig is his sworn brother, and the rich lands south of the Tweed have always tempted the kings of Alba.', trait: 'Highland levies: your counties raise double levies.',
    arms: { t: 'lion', f: '#e2b33c', c: '#a3222c' } },
  { id: 'gwynedd', title: 'King', pname: 'Bleddyn ap Cynfyn', name: 'Gwynedd', ruler: 'King Bleddyn ap Cynfyn', color: '#2e7a3a', home: 'gwynedd', realm: 'Wales', houseTxt: 'A kingdom of the Welsh',
    blurb: "Harold broke Gruffydd ap Llywelyn three years ago and set Bleddyn up in his place. Gwynedd remembers Gruffydd's day, when Wales had one king.", trait: 'Welsh bowmen: bowmen cost 8, and a castle in the hills costs 25% less.',
    arms: { t: 'quarterly', f: '#a3222c', c: '#e2b33c' } },
  // ---- the Irish ----
  { id: 'leinster', title: 'King', pname: 'Diarmait mac Máel na mBó', name: 'Leinster', ruler: 'King Diarmait mac Máel na mBó', color: '#c2386b', home: 'ferns', realm: 'Ireland', houseTxt: 'A kingdom of Ireland',
    blurb: 'The strongest king in Ireland, lord of Dublin and its Norse fleet. He took in Harold\'s family once, and may again.', trait: 'Lord of Dublin: markets and ports yield +3.',
    arms: { t: 'tower', f: '#c2386b', c: '#e9ddbc' } },
  { id: 'munster', title: 'King', pname: 'Toirdelbach Ua Briain', name: 'Munster', ruler: 'King Toirdelbach Ua Briain', color: '#6b8a2a', home: 'killaloe', realm: 'Ireland', houseTxt: 'A kingdom of Ireland',
    blurb: "Grandson of Brian Boru, Diarmait's ally, patient and cunning. He wants all Ireland, and he can wait for it.", trait: 'Dál Cais: your castles and garrisons hold 15% harder, and a county earns +2 d a turn.',
    arms: { t: 'perpale', f: '#6b8a2a', c: '#e2b33c' } },
  { id: 'connacht', title: 'King', pname: 'Áed Ua Conchobair', name: 'Connacht', ruler: 'King Áed of the Gapped Spear', color: '#7a5aa3', home: 'tuam', realm: 'Ireland', houseTxt: 'A kingdom of Ireland',
    blurb: 'Áed of the Gapped Spear, cattle-raider and king of the west, who burned Kincora and took its treasure.', trait: 'Cattle raiders: cavalry cost 17, and the Pope blesses your banners for longer.',
    arms: { t: 'chief', f: '#7a5aa3', c: '#e2b33c' } },
  { id: 'ulaid', title: 'King', pname: 'Niall mac Eochada', name: 'Ulaid', ruler: 'King Niall mac Eochada', color: '#c97b2e', home: 'down', realm: 'Ireland', houseTxt: 'A kingdom of Ireland',
    blurb: 'King of the Ulaid in the north-east, a short sail from Man, Galloway and the Isles, with enemies in Ailech at his back.', trait: 'Friends across the water: alliances with lesser lords cost 25% less.',
    arms: { t: 'perfess', f: '#c97b2e', c: '#a3222c' } },
];
// the houses' traits, as the rules read them
const TRAITS = {
  wessex: { cost: { foot: 7 } }, eastanglia: { market: 3, fair: 1.4 }, mercia: { levy: 1.25, income: 1 }, northumbria: { castle: 0.75 },
  normandy: { cost: { cav: 16 } }, boulogne: { port: 3 }, norway: { atk: 0.1, gf: 25 }, orkney: { cost: { bow: 8 }, port: 2 },
  isles: { port: 3, ally: 0.75 }, scotland: { levy: 2 }, gwynedd: { cost: { bow: 8 }, castle: 0.75 }, leinster: { market: 3, port: 3 }, munster: { hold: 0.15, income: 2 },
  connacht: { cost: { cav: 17 }, bless: 5 }, ulaid: { ally: 0.75 },
};
FACTIONS.forEach(f => { f.tr = TRAITS[f.id] || {}; });
Object.assign(FACTIONS[0], { lose: 'Earl', seat: () => ['Earl', 'Wessex'] });
// Malcolm is king of a people, not of a land: King of Scots
Object.assign(FACTIONS.find(f => f.id === 'scotland'), { seat: () => ['King', 'Scots'] });

// ================= COUNTIES =================
// id, name, lon, lat, coast, hills, base, owner, castle, lord, region
// region: en = the kingdom of the English (the crown's lands), wa = Wales, sc = Scotland, ir = Ireland,
// no = the Norse lands (Norway, Orkney and the Isles), nm = Normandy and the Frankish coast
const PROV = [
  // ---- England: Wessex and the south ----
  ['london', 'London', -0.12, 51.51, 'north', 0, 9, 'wessex', 1, '', 'en'],
  ['winchester', 'Winchester', -1.31, 51.06, 'channel', 0, 7, 'wessex', 1, '', 'en'],
  ['sussex', 'Sussex', 0.15, 50.93, 'channel', 0, 5, 'wessex', 1, '', 'en'],
  ['kent', 'Kent', 0.95, 51.22, 'channel', 0, 6, 'wessex', 1, '', 'en'],
  ['wiltshire', 'Wilton', -1.86, 51.15, '', 0, 5, 'wessex', 0, '', 'en'],
  ['surrey', 'Surrey', -0.45, 51.24, '', 0, 4, null, 0, 'the Thegns of Surrey', 'en'],
  ['berkshire', 'Wallingford', -1.13, 51.55, '', 0, 4, null, 1, 'Wigod of Wallingford', 'en'],
  ['dorset', 'Dorset', -2.3, 50.78, 'channel', 0, 4, null, 0, 'the Abbot of Sherborne', 'en'],
  ['somerset', 'Somerset', -2.85, 51.12, 'irish', 0, 5, null, 0, 'Bishop Giso of Wells', 'en'],
  ['devon', 'Exeter', -3.6, 50.75, 'channel', 1, 5, null, 1, 'Countess Gytha', 'en'],
  ['cornwall', 'Cornwall', -4.85, 50.42, 'channel', 1, 3, null, 0, 'Cadoc of Cornwall', 'en'],
  ['gloucester', 'Gloucester', -2.24, 51.85, '', 0, 5, null, 1, 'Brictric son of Ælfgar', 'en'],
  ['hereford', 'Hereford', -2.75, 52.06, '', 1, 4, null, 1, 'the Thegns of the March', 'en'],
  ['oxford', 'Oxford', -1.3, 51.8, '', 0, 5, null, 0, 'the Abbot of Abingdon', 'en'],
  // ---- East Anglia and the east ----
  ['norwich', 'Norwich', 1.3, 52.63, 'north', 0, 7, 'eastanglia', 1, '', 'en'],
  ['essex', 'Essex', 0.75, 51.86, 'north', 0, 5, 'eastanglia', 0, '', 'en'],
  ['suffolk', 'Bury', 0.85, 52.26, 'north', 0, 5, 'eastanglia', 0, '', 'en'],
  ['ely', 'Ely', 0.2, 52.45, '', 0, 4, null, 0, 'Abbot Thurstan of Ely', 'en'],
  ['hertford', 'Hertford', -0.2, 51.86, '', 0, 4, null, 0, 'Ansgar the Staller', 'en'],
  ['bedford', 'Bedford', -0.55, 52.15, '', 0, 4, null, 0, 'the Thegns of Bedford', 'en'],
  ['northampton', 'Northampton', -0.95, 52.3, '', 0, 5, null, 1, 'Earl Waltheof', 'en'],
  // ---- Mercia and the midlands ----
  ['chester', 'Chester', -2.85, 53.15, 'irish', 0, 6, 'mercia', 1, '', 'en'],
  ['stafford', 'Stafford', -2.1, 52.82, '', 0, 4, 'mercia', 0, '', 'en'],
  ['derby', 'Derby', -1.6, 53.02, '', 1, 4, 'mercia', 0, '', 'en'],
  ['leicester', 'Leicester', -1.13, 52.65, '', 0, 5, null, 1, 'the Lawmen of Leicester', 'en'],
  ['nottingham', 'Nottingham', -1.08, 53.1, '', 0, 5, null, 1, 'the Lawmen of Nottingham', 'en'],
  ['lincoln', 'Lincoln', -0.4, 53.25, 'north', 0, 7, null, 1, 'the Lawmen of Lincoln', 'en'],
  ['warwick', 'Warwick', -1.6, 52.3, '', 0, 4, null, 0, 'Thurkill of Arden', 'en'],
  ['worcester', 'Worcester', -2.2, 52.25, '', 0, 5, null, 0, 'Bishop Wulfstan of Worcester', 'en'],
  ['shrewsbury', 'Shrewsbury', -2.75, 52.62, '', 1, 4, null, 0, 'Eadric the Wild', 'en'],
  // ---- Northumbria and the north ----
  ['york', 'York', -1.08, 53.96, '', 0, 8, 'northumbria', 1, '', 'en'],
  ['holderness', 'Holderness', -0.3, 53.8, 'north', 0, 4, 'northumbria', 0, '', 'en'],
  ['richmond', 'Richmond', -1.75, 54.4, '', 1, 3, 'northumbria', 0, '', 'en'],
  ['scarborough', 'Scarborough', -0.55, 54.25, 'north', 1, 3, null, 0, 'the Thegns of Ryedale', 'en'],
  ['hallam', 'Hallam', -1.5, 53.45, '', 1, 3, null, 0, 'the Thegns of Hallam', 'en'],
  ['lancaster', 'Lancaster', -2.75, 53.95, 'irish', 1, 3, null, 0, 'the Reeve of Amounderness', 'en'],
  ['durham', 'Durham', -1.55, 54.78, 'north', 0, 4, null, 1, 'Bishop Æthelwine of Durham', 'en'],
  ['bamburgh', 'Bamburgh', -1.85, 55.45, 'north', 1, 4, null, 1, 'Osulf of Bamburgh', 'en'],
  // ---- Wales ----
  ['gwynedd', 'Gwynedd', -4.0, 52.95, 'irish', 1, 5, 'gwynedd', 1, '', 'wa'],
  ['powys', 'Powys', -3.35, 52.6, '', 1, 3, 'gwynedd', 0, '', 'wa'],
  ['rhuddlan', 'Rhuddlan', -3.45, 53.2, 'irish', 1, 3, 'gwynedd', 0, '', 'wa'],
  ['ceredigion', 'Ceredigion', -4.05, 52.3, 'irish', 1, 3, null, 0, 'the Lords of Ceredigion', 'wa'],
  ['deheubarth', 'Deheubarth', -3.9, 51.9, '', 1, 4, null, 1, 'Maredudd ab Owain', 'wa'],
  ['stdavids', 'St Davids', -4.95, 51.82, 'irish', 0, 3, null, 0, 'Bishop Sulien of St Davids', 'wa'],
  ['morgannwg', 'Morgannwg', -3.45, 51.58, 'irish', 1, 3, null, 0, 'Cadwgan ap Meurig', 'wa'],
  ['gwent', 'Gwent', -2.95, 51.72, 'irish', 1, 3, null, 0, 'Caradog ap Gruffydd', 'wa'],
  // ---- Scotland ----
  ['scone', 'Scone', -3.45, 56.42, '', 0, 5, 'scotland', 1, '', 'sc'],
  ['fife', 'Fife', -3.05, 56.2, 'north', 0, 4, 'scotland', 0, '', 'sc'],
  ['lothian', 'Lothian', -2.9, 55.88, 'north', 0, 5, 'scotland', 1, '', 'sc'],
  ['carlisle', 'Carlisle', -2.95, 54.85, 'irish', 1, 3, 'scotland', 0, '', 'sc'],
  ['strathclyde', 'Strathclyde', -4.3, 55.75, 'irish', 1, 4, null, 1, 'the Britons of Strathclyde', 'sc'],
  ['galloway', 'Galloway', -4.4, 55.0, 'irish', 1, 3, null, 0, 'the Lords of Galloway', 'sc'],
  ['angus', 'Angus', -2.85, 56.7, 'north', 1, 3, null, 0, 'the Mormaer of Angus', 'sc'],
  ['mar', 'Mar', -2.5, 57.2, 'north', 1, 3, null, 0, 'the Mormaer of Mar', 'sc'],
  ['moray', 'Moray', -3.5, 57.45, 'north', 1, 4, null, 1, 'Máel Snechtai of Moray', 'sc'],
  ['ross', 'Ross', -4.85, 57.6, 'atlantic', 1, 2, null, 0, 'the Mormaer of Ross', 'sc'],
  ['argyll', 'Argyll', -5.25, 56.25, 'atlantic', 1, 2, null, 0, 'the Lords of Argyll', 'sc'],
  ['atholl', 'Atholl', -4.05, 56.85, '', 1, 2, null, 0, 'the Mormaer of Atholl', 'sc'],
  ['caithness', 'Caithness', -3.45, 58.35, 'north', 1, 2, 'orkney', 0, '', 'sc'],
  ['sutherland', 'Sutherland', -4.45, 58.15, 'atlantic', 1, 2, null, 0, 'the Norse of Sutherland', 'sc'],
  // ---- the Norse lands ----
  ['orkney', 'Orkney', -3.05, 59.0, 'north', 0, 4, 'orkney', 1, '', 'no'],
  ['shetland', 'Shetland', -1.25, 60.3, 'north', 1, 2, 'orkney', 0, '', 'no'],
  ['man', 'Man', -4.52, 54.22, 'irish', 1, 4, 'isles', 1, '', 'no'],
  ['skye', 'Skye', -6.25, 57.35, 'atlantic', 1, 2, 'isles', 0, '', 'no'],
  ['lewis', 'Lewis', -6.6, 58.1, 'atlantic', 1, 2, 'isles', 0, '', 'no'],
  ['mull', 'Mull', -5.95, 56.45, 'atlantic', 1, 2, null, 0, 'the Lords of Islay', 'no'],
  ['bergen', 'Hordaland', 5.6, 60.35, 'north', 1, 6, 'norway', 1, '', 'no'],
  ['stavanger', 'Rogaland', 5.95, 58.95, 'north', 1, 5, 'norway', 0, '', 'no'],
  ['sogn', 'Sogn', 6.3, 61.05, 'north', 1, 3, 'norway', 0, '', 'no'],
  ['agder', 'Agder', 7.6, 58.3, 'north', 1, 4, 'norway', 0, '', 'no'],
  // ---- Ireland ----
  ['ferns', 'Ferns', -6.55, 52.55, 'irish', 0, 5, 'leinster', 1, '', 'ir'],
  ['dublin', 'Dublin', -6.3, 53.35, 'irish', 0, 7, 'leinster', 1, '', 'ir'],
  ['kildare', 'Kildare', -6.95, 53.1, '', 0, 4, 'leinster', 0, '', 'ir'],
  ['ossory', 'Ossory', -7.3, 52.7, '', 0, 4, null, 0, 'the King of Osraige', 'ir'],
  ['waterford', 'Waterford', -7.3, 52.2, 'irish', 0, 4, null, 1, 'the Ostmen of Waterford', 'ir'],
  ['meath', 'Meath', -6.75, 53.62, '', 0, 5, null, 1, 'the King of Mide', 'ir'],
  ['killaloe', 'Kincora', -8.45, 52.8, '', 0, 5, 'munster', 1, '', 'ir'],
  ['cashel', 'Cashel', -7.9, 52.48, '', 1, 5, 'munster', 0, '', 'ir'],
  ['limerick', 'Limerick', -8.75, 52.62, 'atlantic', 0, 5, 'munster', 0, '', 'ir'],
  ['cork', 'Cork', -8.5, 51.95, 'atlantic', 0, 4, null, 1, 'the Ostmen of Cork', 'ir'],
  ['kerry', 'Kerry', -9.6, 52.1, 'atlantic', 1, 2, null, 0, 'the Ciarraige', 'ir'],
  ['tuam', 'Tuam', -8.85, 53.5, '', 0, 5, 'connacht', 1, '', 'ir'],
  ['cruachan', 'Cruachan', -8.2, 53.8, '', 0, 4, 'connacht', 0, '', 'ir'],
  ['galway', 'Galway', -9.1, 53.25, 'atlantic', 0, 3, 'connacht', 0, '', 'ir'],
  ['mayo', 'Umall', -9.5, 53.85, 'atlantic', 1, 2, null, 0, 'the Lords of Umall', 'ir'],
  ['breifne', 'Bréifne', -7.7, 54.1, '', 1, 3, null, 0, 'the King of Bréifne', 'ir'],
  ['sligo', 'Sligo', -8.55, 54.2, 'atlantic', 1, 2, null, 0, 'the Lords of Cairbre', 'ir'],
  ['tirconnell', 'Tír Conaill', -8.0, 54.85, 'atlantic', 1, 2, null, 0, 'the King of Tír Conaill', 'ir'],
  ['ailech', 'Ailech', -7.3, 54.9, 'atlantic', 1, 4, null, 1, 'Ardgar Mac Lochlainn', 'ir'],
  ['down', 'Downpatrick', -5.8, 54.4, 'irish', 0, 4, 'ulaid', 1, '', 'ir'],
  ['antrim', 'Dál nAraidi', -6.25, 54.85, 'irish', 1, 3, 'ulaid', 0, '', 'ir'],
  ['oriel', 'Airgialla', -6.75, 54.15, '', 0, 3, 'ulaid', 0, '', 'ir'],
  ['armagh', 'Armagh', -6.65, 54.45, '', 0, 4, null, 0, 'the Abbot of Armagh', 'ir'],
  // ---- Normandy and the Frankish coast ----
  ['rouen', 'Rouen', 1.1, 49.44, 'channel', 0, 8, 'normandy', 1, '', 'nm'],
  ['caen', 'Caen', -0.37, 49.15, 'channel', 0, 6, 'normandy', 1, '', 'nm'],
  ['caux', 'Caux', 0.75, 49.72, 'channel', 0, 4, 'normandy', 0, '', 'nm'],
  ['evreux', 'Évreux', 1.15, 49.02, '', 0, 4, 'normandy', 0, '', 'nm'],
  ['cotentin', 'Cotentin', -1.45, 49.45, 'channel', 0, 3, null, 0, 'Viscount Néel of Saint-Sauveur', 'nm'],
  ['avranches', 'Avranches', -1.25, 48.75, 'channel', 0, 3, null, 1, "Viscount Richard d'Avranches", 'nm'],
  ['ponthieu', 'Ponthieu', 1.85, 50.12, 'channel', 0, 4, null, 1, 'Count Guy of Ponthieu', 'nm'],
  ['boulogne', 'Boulogne', 1.75, 50.65, 'channel', 0, 5, 'boulogne', 1, '', 'nm'],
  ['guines', 'Guînes', 2.15, 50.85, 'channel', 0, 3, 'boulogne', 0, '', 'nm'],
  ['lens', 'Lens', 2.75, 50.4, '', 0, 4, null, 0, 'the Castellan of Lens', 'nm'],
];
const REGION_NAME = { en: 'the kingdom of the English', wa: 'Wales', sc: 'Scotland', ir: 'Ireland', no: 'the lands of the Northmen', nm: 'the Frankish coast' };
// crossings by sea, as on a board game: an army marches or strikes along them as if the two counties touched
const SEA_ROUTES = [
  ['ponthieu', 'sussex'], ['boulogne', 'kent'], ['caen', 'winchester'], ['cotentin', 'dorset'],
  ['bergen', 'shetland'], ['stavanger', 'orkney'], ['agder', 'holderness'], ['shetland', 'orkney'], ['orkney', 'caithness'],
  ['lewis', 'skye'], ['lewis', 'sutherland'], ['skye', 'ross'], ['skye', 'mull'], ['mull', 'argyll'], ['mull', 'antrim'],
  ['man', 'galloway'], ['man', 'down'], ['man', 'lancaster'], ['down', 'galloway'],
  ['dublin', 'gwynedd'], ['ferns', 'stdavids'],
];
// lands beyond the islands: drawn and named, never played
const EDGES = [
  ['franks', 'Kingdom of the Franks', 2.4, 48.75], ['flanders', 'County of Flanders', 3.6, 50.9], ['empire', 'The Empire', 6.3, 52.3],
  ['denmark', 'Kingdom of Denmark', 9.0, 56.2], ['uplands', 'The Uplands', 8.9, 60.2], ['brittany', 'Duchy of Brittany', -2.6, 48.45],
  ['maine', 'County of Maine', 0.0, 48.45], ['vermandois', 'Vermandois', 3.1, 49.75], ['hainaut', 'County of Hainaut', 3.9, 50.45],
];
const SEA_LABELS = [['The Narrow Sea', -1.2, 50.35], ['The German Sea', 3.2, 53.5], ['The Irish Sea', -5.15, 53.55], ['The Western Ocean', -9.6, 55.4], ['The Northern Sea', 1.8, 59.6], ['Celtic Sea', -7.4, 51.2]];

// ================= CAPTAINS =================
const GENERALS = [
  { id: 'odo', n: 'Odo of Bayeux', d: "William's half-brother: a bishop who rides into battle with a mace, so as not to shed blood.", c: 60, atk: .12, morale: .1 },
  { id: 'fitzosbern', n: 'William FitzOsbern', d: 'Steward of Normandy and a builder of castles.', c: 65, def: .2, siege: 1 },
  { id: 'leofwine', n: 'Leofwine Godwinson', d: 'Earl of Kent, a hard man in the shield wall.', c: 55, foot: .3, morale: .08 },
  { id: 'tostig', n: 'Tostig Godwinson', d: "The exiled earl, bitter and bold. He will fight for anyone against his brother.", c: 60, atk: .2, def: -.05 },
  { id: 'ealdred', n: 'Ealdred of York', d: 'An archbishop who knows the north and has crowned a king.', c: 55, def: .15, morale: .1 },
  { id: 'hereward', n: 'Hereward the Wake', d: 'An outlaw of the fens, master of the ambush.', c: 55, atk: .1, bow: .3 },
  { id: 'godred', n: 'Godred Crovan', d: 'A Norse-Gael adventurer from the Isles, looking for a kingdom.', c: 55, foot: .25, atk: .05 },
  { id: 'siward', n: 'Siward Barn', d: 'A Northumbrian thegn who will not bend the knee.', c: 55, foot: .2, def: .1 },
  { id: 'mortain', n: 'Robert of Mortain', d: "William's other half-brother, lord of many manors and many horses.", c: 55, cav: .3 },
  { id: 'taillefer', n: 'Taillefer', d: 'A singing knight who rides out alone before the battle line, juggling his sword.', c: 60, cav: .4 },
  { id: 'haldor', n: 'Halldor Snorrason', d: 'An Icelander who served with Harald in the Varangian Guard, and knows Greek fire.', c: 65, siege: 1, atk: .1 },
  { id: 'rhiwallon', n: 'Rhiwallon ap Cynfyn', d: "Bleddyn's brother, captain of the Welsh bowmen.", c: 50, bow: .45 },
];
const LADIES = ['Edith', 'Gytha', 'Ealdgyth', 'Agatha', 'Margaret', 'Cristina', 'Gunhild', 'Matilda', 'Adeliza', 'Judith', 'Gormlaith', 'Derbforgaill', 'Mór', 'Ingibiorg', 'Thora', 'Nest', 'Gwladus', 'Ælfgifu'];

// ================= COASTS =================
const GB = [[-5.71, 50.06], [-5.48, 50.12], [-5.2, 49.96], [-5.05, 50.15], [-4.75, 50.33], [-4.2, 50.36], [-3.9, 50.28], [-3.65, 50.22], [-3.5, 50.45], [-3.45, 50.62], [-3.05, 50.7], [-2.75, 50.72], [-2.45, 50.6], [-2.05, 50.62], [-1.95, 50.71], [-1.6, 50.73], [-1.35, 50.85], [-1.1, 50.8], [-0.8, 50.75], [-0.35, 50.81], [0.1, 50.77], [0.28, 50.74], [0.6, 50.86], [0.97, 50.92], [1.1, 51.07], [1.4, 51.15], [1.45, 51.38], [1.0, 51.45], [0.6, 51.48], [0.45, 51.45], [0.7, 51.55], [0.95, 51.6], [1.05, 51.75], [1.28, 51.88], [1.6, 52.1], [1.75, 52.48], [1.68, 52.75], [1.3, 52.95], [0.9, 52.97], [0.5, 52.95], [0.35, 52.78], [0.2, 52.82], [0.1, 53.0], [0.35, 53.2], [0.25, 53.45], [0.1, 53.6], [-0.05, 53.62], [-0.2, 53.75], [-0.08, 54.1], [-0.4, 54.28], [-0.6, 54.48], [-1.0, 54.58], [-1.2, 54.65], [-1.3, 54.85], [-1.4, 55.05], [-1.55, 55.3], [-1.65, 55.6], [-2.0, 55.78], [-2.2, 55.9], [-2.6, 56.0], [-3.0, 55.97], [-3.4, 56.02], [-3.0, 56.1], [-2.7, 56.2], [-2.6, 56.33], [-2.85, 56.42], [-2.95, 56.46], [-2.6, 56.55], [-2.45, 56.75], [-2.2, 56.95], [-2.07, 57.15], [-1.85, 57.5], [-2.0, 57.68], [-2.6, 57.68], [-3.3, 57.72], [-3.9, 57.6], [-4.2, 57.5], [-4.0, 57.7], [-3.8, 57.85], [-3.8, 58.05], [-3.4, 58.3], [-3.05, 58.45], [-3.05, 58.64], [-3.4, 58.62], [-4.0, 58.58], [-4.6, 58.55], [-5.0, 58.62], [-5.15, 58.35], [-5.35, 58.1], [-5.2, 57.85], [-5.7, 57.7], [-5.65, 57.4], [-5.55, 57.25], [-5.8, 57.0], [-5.75, 56.75], [-6.2, 56.7], [-5.8, 56.5], [-5.5, 56.3], [-5.6, 56.0], [-5.45, 55.7], [-5.6, 55.4], [-5.4, 55.5], [-5.25, 55.85], [-4.9, 55.95], [-4.85, 55.7], [-4.65, 55.45], [-4.9, 55.2], [-5.05, 54.95], [-5.15, 54.65], [-4.85, 54.7], [-4.4, 54.7], [-4.0, 54.82], [-3.6, 54.9], [-3.3, 54.95], [-3.45, 54.6], [-3.6, 54.35], [-3.2, 54.1], [-2.95, 54.15], [-3.05, 53.85], [-3.0, 53.6], [-3.1, 53.4], [-3.4, 53.35], [-3.8, 53.3], [-4.1, 53.25], [-4.35, 53.4], [-4.6, 53.3], [-4.5, 53.15], [-4.3, 53.05], [-4.6, 52.85], [-4.75, 52.78], [-4.45, 52.85], [-4.1, 52.6], [-4.05, 52.35], [-4.3, 52.15], [-4.7, 52.1], [-5.1, 51.95], [-5.3, 51.85], [-5.1, 51.7], [-4.7, 51.65], [-4.3, 51.67], [-4.05, 51.6], [-3.75, 51.5], [-3.3, 51.4], [-3.0, 51.5], [-2.7, 51.6], [-2.6, 51.5], [-2.95, 51.35], [-3.1, 51.2], [-3.6, 51.22], [-4.1, 51.2], [-4.25, 51.05], [-4.55, 51.0], [-4.75, 50.6], [-5.0, 50.55], [-5.4, 50.25]];
const IRE = [[-6.2, 55.25], [-5.95, 55.05], [-5.75, 54.8], [-5.6, 54.6], [-5.45, 54.45], [-5.55, 54.25], [-5.9, 54.1], [-6.1, 53.98], [-6.2, 53.75], [-6.15, 53.55], [-6.05, 53.3], [-6.0, 53.0], [-6.15, 52.7], [-6.35, 52.3], [-6.4, 52.18], [-6.9, 52.15], [-7.2, 52.1], [-7.6, 51.95], [-8.1, 51.8], [-8.5, 51.65], [-9.0, 51.55], [-9.5, 51.45], [-10.1, 51.6], [-10.2, 51.8], [-10.3, 52.1], [-9.9, 52.3], [-9.5, 52.6], [-9.65, 52.75], [-9.45, 53.05], [-9.05, 53.2], [-9.6, 53.3], [-10.1, 53.45], [-10.05, 53.7], [-9.9, 54.05], [-10.0, 54.25], [-9.4, 54.3], [-8.8, 54.3], [-8.5, 54.45], [-8.6, 54.65], [-8.8, 54.8], [-8.4, 55.05], [-8.0, 55.2], [-7.6, 55.25], [-7.25, 55.35], [-7.0, 55.15], [-6.6, 55.2]];
const CONTI = [[-4.8, 48.4], [-4.6, 48.6], [-4.0, 48.72], [-3.5, 48.82], [-3.0, 48.85], [-2.6, 48.6], [-2.0, 48.62], [-1.6, 48.65], [-1.55, 48.85], [-1.6, 49.2], [-1.85, 49.65], [-1.3, 49.7], [-1.25, 49.6], [-1.15, 49.35], [-0.6, 49.35], [-0.2, 49.3], [0.1, 49.42], [0.15, 49.6], [0.25, 49.72], [0.65, 49.87], [1.1, 49.92], [1.45, 50.08], [1.6, 50.25], [1.6, 50.55], [1.6, 50.75], [1.85, 50.95], [2.4, 51.05], [3.0, 51.25], [3.5, 51.4], [4.0, 51.95], [4.6, 52.45], [4.75, 52.95], [5.4, 53.35], [6.2, 53.45], [7.0, 53.65], [8.0, 53.6], [8.5, 53.6], [8.7, 53.9], [8.9, 54.3], [8.6, 54.9], [8.15, 55.6], [8.1, 56.6], [8.6, 57.1], [9.6, 57.35], [10.4, 57.6], [11.5, 57.6], [11.5, 47.5], [-5.0, 47.5]];
const NOR = [[11.0, 58.9], [9.6, 58.9], [9.0, 58.5], [8.3, 58.1], [7.5, 58.0], [7.0, 58.0], [6.6, 58.1], [6.0, 58.3], [5.6, 58.75], [5.55, 59.1], [5.3, 59.4], [5.1, 59.85], [5.0, 60.2], [4.95, 60.6], [4.95, 61.0], [5.0, 61.4], [5.1, 61.9], [5.2, 62.3], [11.0, 62.3]];
const ORK = [[-3.4, 58.9], [-3.2, 58.8], [-2.85, 58.82], [-2.7, 58.95], [-2.8, 59.1], [-2.9, 59.3], [-3.15, 59.15], [-3.35, 59.1]];
const SHE = [[-1.3, 59.85], [-1.0, 60.1], [-1.05, 60.4], [-0.9, 60.6], [-1.15, 60.8], [-1.4, 60.6], [-1.6, 60.4], [-1.4, 60.15]];
const LEW = [[-6.2, 58.5], [-6.15, 58.25], [-6.35, 58.0], [-6.7, 57.8], [-7.1, 57.75], [-7.05, 58.0], [-6.85, 58.25], [-6.6, 58.35]];
const UIST = [[-7.2, 57.65], [-7.2, 57.1], [-7.45, 57.1], [-7.5, 57.6]];
const SKYE = [[-6.15, 57.65], [-5.95, 57.45], [-5.75, 57.25], [-5.9, 57.1], [-6.25, 57.15], [-6.55, 57.3], [-6.75, 57.5], [-6.4, 57.7]];
const MULL = [[-5.65, 56.45], [-5.85, 56.65], [-6.15, 56.6], [-6.35, 56.35], [-6.0, 56.3], [-5.75, 56.35]];
const ISLAY = [[-6.0, 55.65], [-6.1, 55.9], [-6.35, 55.85], [-6.5, 55.7], [-6.25, 55.6]];
const MAN = [[-4.35, 54.4], [-4.3, 54.3], [-4.6, 54.05], [-4.8, 54.1], [-4.7, 54.3]];
const WIGHT = [[-1.55, 50.68], [-1.3, 50.77], [-1.08, 50.7], [-1.25, 50.58], [-1.5, 50.65]];
const SEA = [[-20, 40], [20, 40], [20, 70], [-20, 70]];

return {
  id: 'britain', FACTIONS, PROV, REGION_NAME, SEA_ROUTES, EDGES, SEA_LABELS, GENERALS, LADIES,
  name: 'Great Britain & Ireland, 1066', sub: 'England, Scotland, Wales, Ireland and the North', game: 'The Crown of the English',
  geo: { LON0: -11.0, LAT1: 61.4, SX: 57, SY: 98, MW: 1220, MH: 1310, lands: [CONTI, GB, IRE, NOR, ORK, SHE, LEW, UIST, SKYE, MULL, ISLAY, MAN, WIGHT], seas: [SEA], isles: [] },
  realm: 'England', foreignTxt: 'English thegns resent foreign rule', foreignAsk: 'English thegns ask double of foreigners',
  kingdom: { regions: ['en'], core: 'en', n: 'the English', short: 'England', keys: ['london'], at: 'Westminster' },
  date: { y0: 1066, s0: 3, yOff: 0, roman: 'MLXVI' },
  truce: 3,
  peace: { Name: 'The Truce of God', name: 'the Truce of God', ends: 'The winter seas are open and the Truce of God has run its course. The great houses may now make war on each other.', breakTxt: 'This attack breaks the Truce of God.' },
  short: { eastanglia: 'East Anglia', northumbria: 'Northumbria', isles: 'Isles' },
  crown: {
    title: 'King of the English', of: 'of the English', the: 'the crown of England', people: 'the English', latin: 'REX ANGLORUM', regnum: 'Regnum Anglorum', rex: 'Rex Anglorum',
    anointed: 'crowned at Westminster', at: 'Westminster', rite: 'At Westminster the archbishop crowns', start: 'wessex',
    needs: (fid, great) => great ? ['london'] : ['london', 'winchester'],
    why: { london: 'Westminster, where King Edward built his abbey: kings of the English are crowned here.', winchester: 'The old royal city and the treasury: a king needs it, with London.' },
    coronation: 'Kings of the English are crowned at Westminster, and a king needs the treasury at Winchester.',
    rule: () => `A king is crowned at Westminster and needs the treasury: hold London and Winchester and at least ${CROWN_LANDS} counties of England, and pay ${CROWN_COST} d. A lord with ${CROWN_GREAT} counties of England needs only London.`,
    take: 'Take London and Winchester and it can be yours.',
    won: fid => `At Westminster, before the bishops and thegns of England, Archbishop Ealdred crowns ${FAC(fid).pname} King of the English.`,
    wonAll: fid => `At Westminster the archbishop crowns ${FAC(fid).pname}, and there is no lord left in the islands to stand against him.`,
    endWon: n => `${n} kneels in the abbey at Westminster. The archbishop crowns him, the thegns shout their assent, and the bells ring out across a kingdom he holds in his own hand.`,
    endAll: n => `At Westminster the archbishop crowns ${n}, and from Shetland to Cornwall no lord stands against him.`,
    span: 'From Shetland to Cornwall', crowned: 'crowned at Westminster', church: 'the Archbishop of York',
    rules: 'For the first time since Cnut, one king rules England from end to end.',
  },
  founder: 'King Alfred',
  pnames: ['Edgar', 'Edmund', 'Leofric', 'Siward', 'Godric', 'Ælfric', 'Wulfstan', 'Osgod', 'Thurkill', 'Brand', 'Donnchad', 'Gruffydd', 'Eadric', 'Uhtred', 'Cospatrick'],
  houseOf: f => f.houseTxt,
  groups: [['The English', ['wessex', 'eastanglia', 'mercia', 'northumbria']], ['The Normans', ['normandy', 'boulogne']], ['The Northmen', ['norway', 'orkney', 'isles']], ['The Scots and the Welsh', ['scotland', 'gwynedd']], ['The Irish', null]],
  where: fid => ({ England: 'England is the prize: rich, crowded, and every claimant is coming for it.', Normandy: 'The Channel lies between you and the crown. The crossings are short, and the English coast is long.', Norway: 'The sea is your road. England is far, but the islands of the north are yours to gather.', Scotland: 'The rich north of England lies over the Tweed, and the Highlands guard your back.', Wales: 'The March of England is at your door, and the mountains are your castle.', Ireland: 'Ireland is far from London. Make yourself master of the island first, then cross the Irish Sea.' })[FACMAP[fid].realm] || '',
  intro: {
    get note() { return `King Edward is dead. On the day of his burial the Witan chose Harold Godwinson, Earl of Wessex, and Archbishop Ealdred crowned him in the new abbey at Westminster. Across the sea Duke William says the crown was promised to him, and Harald Hardrada of Norway claims it by an old treaty. The bishops proclaim the Truce of God until ${dateStr(TRUCE)}.`; },
    lead: 'King Edward the Confessor is dead without a son. The Witan has crowned Harold Godwinson, but William of Normandy swears the crown was promised to him, Harald Hardrada of Norway claims it by an old pact, and in Scotland, Wales and Ireland the kings watch for their chance. Who will hold England?',
    splash: (fid, d, cap) => `<p>King Edward is dead, and Harold Godwinson wears his crown. At ${cap}, ${d.pname} raises the banner of ${d.name}.</p>
    <p>${fid === 'wessex' ? 'You wear the crown. Now hold it: half of England in your own hands, and no rival strong enough to take it from you.' : fid === 'normandy' ? 'Cross the Channel, take London and Winchester, and the crown that was promised to you is yours.' : fid === 'norway' ? 'Sail for England with Tostig, take London and Winchester, and you may be King of the English as well as of Norway.' : FACMAP[fid].realm === 'England' ? 'Hold your earldom while the claimants fight, and wait for your chance at the crown.' : 'England is divided and its king is new. Take what you can, and perhaps the crown itself.'}</p>`,
  },
  help: {
    top: '<p><b>The islands in 1066.</b> Edward the Confessor is dead. Harold Godwinson wears the crown, but William of Normandy and Harald Hardrada of Norway both claim it, and the earls, kings and jarls of the islands will take what they can. Fifteen houses, from Norway to Munster.</p>',
    sea: '<p><b>Sea crossings.</b> Dotted lines on the map join counties across the water: the Channel from Normandy and Boulogne, the North Sea from Norway, the Irish Sea, and the chains of the Isles. An army marches or strikes along one as if the two counties touched. Only the counties of England count toward the kingdom.</p>',
    rich: 'The rich land is in the south and east of England.',
    peace: () => `<p><b>The Truce of God.</b> For the first ${TRUCE} turns, while the winter seas are closed, the bishops forbid war between the great houses. Break the truce and you are excommunicated.</p>`,
    powers: `<p><b>Beyond the islands.</b> The hatched lands at the edge of the map are not for conquest.</p>
      <p><b>The Northmen.</b> Longships from Norway raid the coasts of England and Normandy. The fewer of Norway\'s four counties you hold, the more often they come; hold all four and the raids stop.</p>
      <p><b>Sweyn of Denmark.</b> King Sweyn, Cnut's nephew, has a claim of his own. From the second year his fleets raid the east coast of England. Pay the Danegeld to send them away, or fight.</p>
      <p><b>Events.</b> Some things happened in 1066: the hairy star in spring, Tostig's raids on the coast, the papal banner sent to William, Hardrada's fleet, and the fyrd sent home for the harvest. The game follows them loosely.</p>`,
  },
  // an English or Scots county is an earldom; on the Frankish coast it stays a county
  countAs: p => p.r === 'nm' ? 'Count' : 'Earl',
  fair: { at: 'Winchester', name: 'the fair of St Giles at Winchester', title: 'The fair at Winchester', who: 'Merchants from Flanders, Rouen and Dublin crowd the hill of St Giles above Winchester for the summer fair.', lord: 'a wool earl', open: 'The summer fair at Winchester is open' },
  free: [],
  challenges: [
    { id: 'promised', n: 'The Promised Crown', house: 'normandy', diff: 'original', d: 'Normandy against Standard rivals: cross the Channel and take what you were promised.' },
    { id: 'stamford', n: 'Stamford Bridge', house: 'norway', diff: 'original', d: 'Norway, with the whole North Sea between you and the crown.' },
    { id: 'lastsaxon', n: 'The Last Saxon King', house: 'wessex', diff: 'hard', d: 'Harold Godwinson against Hard rivals.' },
    { id: 'ardri', n: 'High King', house: 'leinster', diff: 'original', mod: { gold: 200 }, d: 'Leinster, rich and far from London.' },
    { id: 'canmore', n: 'Canmore', house: 'scotland', diff: 'gentle', d: 'Scotland against Gentle rivals.' },
    { id: 'brothers', n: 'The Brothers', house: 'mercia', diff: 'original', d: 'Mercia, caught between Harold and the north.' },
  ],
  art: {
    // the siege screen: a grand castle behind the realm's capital, a cathedral behind the great sees
    grand: ['london'], cathedrals: ['kent', 'york', 'winchester', 'armagh', 'stdavids', 'fife', 'dublin', 'cashel', 'durham', 'rouen'],
    mountains: ['ross', 'sutherland', 'atholl', 'argyll', 'skye', 'lewis', 'gwynedd', 'sogn', 'bergen', 'uplands', 'mar'],
    woods: ['sussex', 'kent', 'surrey', 'winchester', 'nottingham', 'gloucester', 'warwick', 'essex', 'somerset', 'shrewsbury', 'hertford', 'ossory', 'meath', 'breifne', 'strathclyde', 'evreux', 'avranches', 'agder', 'stavanger', 'powys', 'deheubarth', 'denmark', 'franks', 'maine', 'flanders', 'empire'],
    rivers: [
      ['Thames', [[-1.95, 51.7], [-1.25, 51.75], [-1.0, 51.55], [-0.6, 51.48], [-0.12, 51.5], [0.3, 51.48], [0.6, 51.48]]],
      ['Severn', [[-3.6, 52.48], [-3.1, 52.62], [-2.7, 52.7], [-2.4, 52.55], [-2.22, 52.2], [-2.24, 51.86], [-2.6, 51.62]]],
      ['Trent', [[-2.15, 53.05], [-1.9, 52.8], [-1.5, 52.85], [-1.15, 52.95], [-0.8, 53.1], [-0.75, 53.6]]],
      ['Ouse', [[-1.75, 54.3], [-1.3, 54.1], [-1.08, 53.96], [-0.95, 53.75], [-0.75, 53.7], [-0.4, 53.72], [-0.1, 53.65]]],
      ['Tyne', [[-2.3, 54.97], [-1.9, 54.97], [-1.6, 54.97], [-1.4, 55.0]]],
      ['Tweed', [[-3.3, 55.6], [-2.8, 55.6], [-2.3, 55.65], [-2.0, 55.77]]],
      ['Great Ouse', [[-1.0, 52.05], [-0.47, 52.13], [-0.1, 52.35], [0.25, 52.55], [0.4, 52.78]]],
      ['Wye', [[-3.6, 52.35], [-3.2, 52.15], [-2.72, 52.05], [-2.65, 51.65]]],
      ['Dee', [[-3.6, 52.9], [-3.2, 52.98], [-2.9, 53.1], [-3.1, 53.3]]],
      ['Mersey', [[-2.0, 53.4], [-2.4, 53.42], [-2.75, 53.35], [-3.0, 53.45]]],
      ['Forth', [[-4.4, 56.15], [-3.95, 56.12], [-3.6, 56.05]]],
      ['Tay', [[-4.3, 56.6], [-3.75, 56.6], [-3.43, 56.4], [-3.1, 56.43]]],
      ['Clyde', [[-3.7, 55.45], [-3.9, 55.7], [-4.25, 55.86], [-4.6, 55.94]]],
      ['Spey', [[-4.3, 57.05], [-3.8, 57.3], [-3.3, 57.5], [-3.1, 57.67]]],
      ['Shannon', [[-7.9, 54.2], [-8.0, 53.8], [-7.95, 53.35], [-8.2, 53.0], [-8.45, 52.8], [-8.7, 52.65], [-9.3, 52.6]]],
      ['Liffey', [[-6.45, 53.15], [-6.65, 53.25], [-6.45, 53.36], [-6.2, 53.35]]],
      ['Boyne', [[-7.0, 53.4], [-6.7, 53.6], [-6.4, 53.72], [-6.25, 53.72]]],
      ['Barrow', [[-7.3, 53.1], [-7.0, 52.85], [-6.95, 52.4], [-7.0, 52.25]]],
      ['Suir', [[-7.85, 52.85], [-7.9, 52.5], [-7.6, 52.3], [-7.1, 52.25]]],
      ['Bann', [[-6.2, 54.25], [-6.45, 54.6], [-6.55, 54.95], [-6.75, 55.17]]],
      ['Seine', [[2.0, 48.95], [1.55, 49.05], [1.1, 49.4], [0.75, 49.5], [0.2, 49.45]]],
      ['Somme', [[3.0, 49.85], [2.3, 49.9], [1.85, 50.1], [1.65, 50.2]]],
    ],
    // the Dragon of Wessex, and the papal banner William carried: white, with a gold cross
    pennants: {
      l: { bg: '#a3222c', motif: '<path d="M14,96 C10,80 20,70 30,74 C38,77 40,66 34,58 C30,52 22,54 22,46 C22,38 32,34 38,40 L44,34 L40,46 C46,56 44,70 36,80 C30,86 22,84 20,92 Z M30,58 L44,52 L40,62 Z" fill="#e2b33c" stroke="#7a5a10" stroke-width="1.2"/><circle cx="35" cy="41" r="1.6" fill="#2a1d12"/>' },
      r: { bg: '#f3ecd8', motif: '<path d="M22,20 h10 v28 h14 v10 h-14 v42 h-10 v-42 h-14 v-10 h14z" fill="#e2b33c" stroke="#7a5a10" stroke-width="1.5"/><path d="M4,5 H50 V140 L27,118 L4,140Z" fill="none" stroke="#26408a" stroke-width="3" transform="translate(0,0)"/>' },
    },
    ships: [[-2.6, 50.18, 1.0], [5.6, 57.1, 0.9, true]], serpent: [-9.6, 56.6, 1.3], rose: [-9.5, 50.2], cart: [1.4, 55.3],
  },
  setup: {
    // the Godwin brothers stand together, and so do the sons of Ælfgar; in Ireland, Diarmait and Toirdelbach are allies.
    // Harold's housecarls: the best foot soldiers in the north of the world hold London and march with the king
    houses() { Object.assign(P('london').gar, { foot: 14, bow: 4, cav: 2 }); P('winchester').gar.foot += 4; const A = lordArmy('wessex'); A.foot += 6; },
    after() {
      const pact = (a, b, n) => G.truces.push({ a, b, until: TRUCE + n, pact: true, treaty: true, pass: true });
      // Harold has just married Ealdgyth, sister of Edwin and Morcar: the northern earls are his brothers-in-law, for now
      pact('wessex', 'eastanglia', 16); pact('wessex', 'mercia', 6); pact('wessex', 'northumbria', 8); pact('mercia', 'northumbria', 12); pact('leinster', 'munster', 10);
    },
  },
  tick() { britainTick(); },
  // the longships that raid your coasts sail from Norway: hold its four counties and they stop coming
  vikings: { home: ['bergen', 'stavanger', 'sogn', 'agder'], mineT: 'The fjords are yours', mine: 'Every harbour in Norway answers to you now. The longships that raided your coasts are your own ships, and the Northmen will not come raiding again.' },
  raider: {
    who: 'Sweyn of Denmark', title: "King Sweyn Estridsen, Cnut's nephew, who says England is his by right,", tribute: 'the Danegeld', every: 6, from: 5,
    targets: () => provList().filter(p => p.owner && !besiegerOf(p) && p.r === 'en' && p.seas.includes('north')),
    sack: (p, loot) => `Danish ships come up the estuary to ${p.name}. They burn the villages, storm the burh and sail away with ${loot} d and a fleet-load of captives. The walls are broken, half the garrison is dead or taken, and the county will pay nothing for three turns.`,
    held: p => `The Danes come ashore at ${p.name}, find the fyrd waiting, and row away.`,
  },
};
// ---------- the events of 1066 ----------
function britainTick() {
  raiderTick();
  const T = G.turn, E = G.ev, alv = f => G.fac[f] && G.fac[f].alive;
  // Spring 1066: the hairy star
  if (T === 1 && !E.comet) { E.comet = 1; note('A star with a long fiery tail burns in the sky for a week after Easter. Men say it means a change of kings.'); }
  // Spring 1066: Tostig raids the south and east coasts with Flemish ships
  if (T === 1 && !E.tostig) {
    E.tostig = 1;
    const t = ['sussex', 'kent', 'norwich', 'lincoln', 'holderness'].map(P).filter(p => p && p.owner && !besiegerOf(p));
    if (t.length) {
      const p = pick(t), r = pressBattle(p, forceOf(9, 0.05));
      if (r.won) { const loot = Math.min(G.fac[p.owner].gold, 20 + rnd(20)); G.fac[p.owner].gold -= loot; p.militia = 0; tell(p.owner, `Tostig raids ${p.name}`, `The exiled earl Tostig comes ashore with Flemish ships, plunders ${p.name} of ${loot} d and sails north. Your losses: ${r.lost}.`); }
      else tell(p.owner, `${p.name} drives off Tostig`, `Tostig's ships try ${p.name}, meet the local levies and sail on north. Your losses: ${r.lost}.`);
    }
  }
  // Summer 1066: the Pope sends William a consecrated banner
  if (T === 2 && !E.banner && alv('normandy')) {
    E.banner = 1; const F = G.fac.normandy; F.bless = Math.max(F.bless || 0, 6);
    tell('normandy', 'The papal banner', 'Pope Alexander sends Duke William a consecrated banner and a ring with a hair of Saint Peter. The war for England is blessed: your troops fight 12% harder for six turns.');
    if (G.player !== 'normandy') note('The Pope has sent Duke William a consecrated banner for his war on England.');
  }
  // Summer 1066: Tostig comes to Norway, and the Earls of Orkney sail with Hardrada
  if (T === 2 && !E.hardrada && alv('norway')) {
    E.hardrada = 1; const A = lordArmy('norway'); if (armyUsable('norway', A)) { A.foot += 8; A.bow += 2; }
    if (alv('orkney')) G.truces.push({ a: 'norway', b: 'orkney', until: T + 12, pact: true, treaty: true, pass: true });
    tell('norway', 'Tostig comes to Norway', "Tostig swears to Harald and promises half of England will rise for him. Norway's levies gather in the fjords, and Earls Paul and Erlend of Orkney will sail with you.");
    if (G.player !== 'norway') note('Harald Hardrada gathers a great fleet in Norway, with Tostig and the Earls of Orkney at his side.');
  }
  // Autumn 1066: Harold's fyrd goes home for the harvest
  if (T === 3 && !E.fyrd && alv('wessex')) {
    E.fyrd = 1; const A = lordArmy('wessex'), k = Math.floor((A.foot || 0) * 0.3); A.foot -= k;
    if (k) tell('wessex', 'The fyrd goes home', `The levies have served their two months, and the harvest is in the fields: ${k} footmen of the king's host go home.`);
  }
}
})();
