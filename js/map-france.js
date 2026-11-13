'use strict';
// ================= THE MAP OF FRANCE, 987 =================
// The kingdom of the West Franks at the death of Louis V. Registered as a map; data.js reads whichever map is chosen.
MAPS.france = (() => {
// ================= HOUSES =================
// The king, the Carolingian claimant, and the great princes of the kingdom of the West Franks in 987.
const FACTIONS = [
  { id: 'capet', title: 'King', pname: "Hugh Capet", name: 'The Royal Domain', ruler: "King Hugh Capet", color: '#26408a', home: 'paris', realm: 'France',
    blurb: "Newly anointed at Reims, master of little more than Paris and Orléans. Every prince is his equal in all but the crown.", trait: "The anointed king: starts crowned King of the Franks, with a cardinal in Rome.",
    arms: { t: 'semy', f: '#26408a', c: '#e2b33c' } },
  { id: 'charles', title: 'Duke', pname: "Charles of Lorraine", name: 'Lower Lorraine', ruler: "Duke Charles of Lorraine", color: '#7a3f8f', home: 'brussels', realm: 'France',
    blurb: "Uncle of the dead king and the last of Charlemagne's line. The lords passed him over; he has not forgiven them.", trait: "Carolingian blood: may be crowned holding Reims and Laon alone, and his men fight 15% harder for Laon and Reims.",
    arms: { t: 'cross', f: '#7a3f8f', c: '#e2b33c' } },
  { id: 'normandy', title: 'Duke', pname: "Richard the Fearless", name: 'Normandy', ruler: "Duke Richard the Fearless", color: '#a3222c', home: 'rouen', realm: 'France',
    blurb: "Norse blood, hard horsemen and the Channel ports. Hugh's most important friend.", trait: "Norman horse: cavalry cost 16 instead of 20. The Danes sell their plunder in his ports, if he lets them.",
    arms: { t: 'fess2', f: '#a3222c', c: '#e2b33c' } },
  { id: 'flanders', title: 'Count', pname: "Arnulf II", name: 'Flanders', ruler: "Count Arnulf II", color: '#3d3d36', home: 'bruges', realm: 'France',
    blurb: "The cloth towns of the north and a long quarrel with everyone around them.", trait: "Cloth towns: market towns yield +3 more.",
    arms: { t: 'lion', f: '#e2b33c', c: '#1d1d1d' } },
  { id: 'champagne', title: 'Count', pname: "Herbert the Younger", name: 'Champagne', ruler: "Count Herbert the Younger", color: '#3f7f3a', home: 'troyes', realm: 'France',
    blurb: "The Herbertian counts of Troyes, Meaux and Vermandois, who boxed in the old kings and mean to box in the new one.", trait: "The fair at Troyes: market towns yield +4 more, Troyes starts with one, and your goods sell for 40% more at the summer fair.",
    arms: { t: 'bendCot', f: '#2d5ea8', c: '#f2ead6', c2: '#f2ead6' } },
  { id: 'blois', title: 'Count', pname: "Odo of Blois", name: 'Blois', ruler: "Count Odo of Blois", color: '#2a7a8a', home: 'blois', realm: 'France',
    blurb: "Odo of Blois, Chartres and Tours: the richest count on the Loire and the most ambitious man in the kingdom.", trait: "Odo's purse: lesser lords swear to you for a quarter less.",
    arms: { t: 'barry', f: '#2a7a8a', c: '#e2b33c' } },
  { id: 'anjou', title: 'Count', pname: "Fulk Nerra", name: 'Anjou', ruler: "Count Fulk Nerra", color: '#b5652a', home: 'angers', realm: 'France',
    blurb: "Fulk the Black, count since this spring, squeezed between Blois and Brittany and afraid of neither.", trait: "Fulk the builder: castles cost a quarter less and rise a turn sooner.",
    arms: { t: 'perfess', f: '#b5652a', c: '#e2b33c' } },
  { id: 'brittany', title: 'Count', pname: "Conan the Crooked", name: 'Brittany', ruler: "Count Conan the Crooked", color: '#6b7480', home: 'rennes', realm: 'France',
    blurb: "Conan of Rennes, who calls himself Duke of the Bretons and fights every other Breton count to prove it.", trait: "Breton levies: every county raises double levies.",
    arms: { t: 'semy', f: '#f2ead6', c: '#1d1d1d' } },
  { id: 'aquitaine', title: 'Duke', pname: "William Iron-Arm", name: 'Aquitaine', ruler: "Duke William Iron-Arm", color: '#c58f22', home: 'poitiers', realm: 'France',
    blurb: "William Iron-Arm of Poitiers, who will not bow to the new king.", trait: "Rich lands: every county yields +2 deniers.",
    arms: { t: 'lion', f: '#c8952a', c: '#8e1f1b' } },
  { id: 'burgundy', title: 'Duke', pname: "Henry the Great", name: 'Burgundy', ruler: "Duke Henry the Great", color: '#6e2f63', home: 'autun', realm: 'France',
    blurb: "Duke Henry, the king's own brother: vineyards, abbeys and the favour of Cluny.", trait: "Cluny's favour: bishops cost 18, and blessings last 5 turns.",
    arms: { t: 'bendy', f: '#e2b33c', c: '#2d4f96', c2: '#a3222c' } },
  { id: 'toulouse', title: 'Count', pname: "William Taillefer", name: 'Toulouse', ruler: "Count William Taillefer", color: '#c2386b', home: 'toulouse', realm: 'France',
    blurb: "William Taillefer, Count of Toulouse: a great name over a scatter of lords who mostly please themselves.", trait: "Walls of Toulouse: the garrison of your seat grows back twice as fast.",
    arms: { t: 'cross', f: '#b8262b', c: '#e2b33c' } },
  { id: 'barcelona', title: 'Count', pname: "Borrell II", name: 'Barcelona', ruler: "Count Borrell II", color: '#e0a82e', home: 'barcelona', realm: 'France',
    blurb: "Borrell II, whose city Almanzor burned two years ago. He has asked the King of the Franks for help.", trait: "Frontier castles: your garrisons have 5% more hit points, and Almanzor strikes you most.",
    arms: { t: 'pallets', f: '#e2b33c', c: '#a3222c' } },
  { id: 'gascony', title: 'Duke', pname: "William Sánchez", name: 'Gascony', ruler: "Duke William Sánchez", color: '#5a8a3a', home: 'bordeaux', realm: 'France',
    blurb: "William Sánchez, Duke of the Gascons, master of Bordeaux and the marshes beyond the Garonne.", trait: "Gascon horse: cavalry cost 17 instead of 20.",
    arms: { t: 'perpale', f: '#5a8a3a', c: '#f2ead6' } },
  { id: 'provence', title: 'Count', pname: "William the Liberator", name: 'Provence', ruler: "Count William the Liberator", color: '#2f8f7f', home: 'arles', realm: 'Arles',
    blurb: "William the Liberator, who drove the Saracens from Fraxinet. Provence belongs to the King of Arles, in name.", trait: "Fraxinet's veterans: generals cost a quarter less, and ports yield +3 more.",
    arms: { t: 'bendCot', f: '#2f8f7f', c: '#e2b33c', c2: '#f2ead6' } },
  { id: 'roussillon', title: 'Count', pname: "Gausfred", name: 'Roussillon', ruler: "Count Gausfred", color: '#8a5a9a', home: 'roussillon', realm: 'France',
    blurb: "Gausfred, Count of Empúries and Roussillon, cousin and rival of Borrell. He holds the coast road between Narbonne and Barcelona.", trait: "Mountain archers: bowmen cost 8 instead of 10.",
    arms: { t: 'chief', f: '#e2b33c', c: '#26408a' } },
];
// ================= PROVINCES =================
// id, name, lon, lat, coast, hills, base, owner, castle, lord, region
// coast: a non-empty value marks a coastal county (ports, raiders). There are no sea lanes in this game.
// region: fr = the kingdom of the West Franks, lo = Lorraine (the Empire's), ar = the kingdom of Burgundy-Arles, ca = the Spanish March
const PROV = [
  // the royal domain and the Île-de-France
  ['paris', 'Paris', 2.35, 48.86, '', 0, 9, 'capet', 1, '', 'fr'],
  ['orleans', 'Orléans', 1.9, 47.9, '', 0, 7, 'capet', 1, '', 'fr'],
  ['senlis', 'Senlis', 2.59, 49.2, '', 0, 5, 'capet', 1, '', 'fr'],
  ['laon', 'Laon', 3.62, 49.56, '', 1, 5, 'capet', 1, '', 'fr'],
  ['melun', 'Melun', 2.66, 48.45, '', 0, 4, null, 1, 'Bouchard of Vendôme', 'fr'],
  ['vexin', 'Vexin', 1.9, 49.12, '', 0, 4, null, 0, 'Count Gautier', 'fr'],
  ['dreux', 'Dreux', 1.32, 48.74, '', 0, 4, null, 1, 'the Count of Dreux', 'fr'],
  ['beauvais', 'Beauvais', 2.08, 49.48, '', 0, 4, null, 0, 'Bishop Hervé', 'fr'],
  ['soissons', 'Soissons', 3.32, 49.33, '', 0, 4, null, 0, 'Count Guy', 'fr'],
  ['reims', 'Reims', 4.03, 49.26, '', 0, 6, null, 1, 'Archbishop Adalbero', 'fr'],
  ['chalons', 'Châlons', 4.4, 48.9, '', 0, 4, null, 0, 'the Bishop of Châlons', 'fr'],
  ['sens', 'Sens', 3.28, 48.2, '', 0, 5, null, 1, 'Count Fromond', 'fr'],
  // the north: Flanders, Picardy, Artois
  ['bruges', 'Bruges', 3.15, 51.12, 'north', 0, 6, 'flanders', 1, '', 'fr'],
  ['ghent', 'Ghent', 3.75, 50.98, '', 0, 6, 'flanders', 1, '', 'fr'],
  ['artois', 'Artois', 2.78, 50.33, '', 0, 5, 'flanders', 1, '', 'fr'],
  ['boulogne', 'Boulogne', 1.72, 50.68, 'channel,north', 0, 4, null, 0, 'Count Arnulf of Boulogne', 'fr'],
  ['ponthieu', 'Ponthieu', 1.85, 50.18, 'channel', 0, 4, null, 1, 'Count Hugh of Ponthieu', 'fr'],
  ['amiens', 'Amiens', 2.35, 49.88, '', 0, 5, null, 1, 'Count Gautier of Amiens', 'fr'],
  ['vermandois', 'Vermandois', 3.29, 49.85, '', 0, 5, 'champagne', 1, '', 'fr'],
  ['cambrai', 'Cambrai', 3.3, 50.22, '', 0, 4, null, 1, 'Bishop Rothard', 'lo'],
  // Lorraine
  ['brussels', 'Brussels', 4.35, 50.85, '', 0, 4, 'charles', 1, '', 'lo'],
  ['antwerp', 'Antwerp', 4.42, 51.24, 'north', 0, 4, 'charles', 0, '', 'lo'],
  ['hainaut', 'Hainaut', 3.95, 50.45, '', 0, 4, null, 1, 'Count Reginar', 'lo'],
  ['namur', 'Namur', 4.87, 50.42, '', 1, 4, null, 1, 'Count Albert', 'lo'],
  ['liege', 'Liège', 5.57, 50.63, '', 0, 5, null, 1, 'Bishop Notger', 'lo'],
  ['ardennes', 'Ardennes', 6.0, 49.75, '', 1, 3, null, 1, 'Count Sigefroi', 'lo'],
  ['verdun', 'Verdun', 5.38, 49.16, '', 1, 4, null, 1, 'Godfrey the Captive', 'lo'],
  ['metz', 'Metz', 6.18, 49.12, '', 0, 5, null, 1, 'the Bishop of Metz', 'lo'],
  ['bar', 'Bar', 5.16, 48.72, '', 1, 4, null, 1, 'Duchess Beatrice', 'lo'],
  ['toul', 'Toul', 5.89, 48.62, '', 1, 3, null, 0, 'Bishop Gerard', 'lo'],
  // Champagne and Burgundy
  ['troyes', 'Troyes', 4.07, 48.3, '', 0, 6, 'champagne', 1, '', 'fr'],
  ['meaux', 'Meaux', 2.88, 48.85, '', 0, 5, 'champagne', 1, '', 'fr'],
  ['langres', 'Langres', 5.33, 47.86, '', 1, 4, null, 1, 'Bishop Brun', 'fr'],
  ['tonnerre', 'Tonnerre', 3.98, 47.86, '', 1, 3, null, 0, 'the Count of Tonnerre', 'fr'],
  ['auxerre', 'Auxerre', 3.57, 47.65, '', 1, 5, 'burgundy', 1, '', 'fr'],
  ['autun', 'Autun', 4.3, 46.95, '', 1, 5, 'burgundy', 1, '', 'fr'],
  ['dijon', 'Dijon', 5.04, 47.32, '', 1, 5, null, 1, 'the Castellan of Dijon', 'fr'],
  ['nevers', 'Nevers', 3.16, 47.0, '', 0, 4, null, 1, 'Count Landri', 'fr'],
  ['chalon', 'Chalon', 4.85, 46.78, '', 0, 4, null, 0, 'Count Lambert', 'fr'],
  ['macon', 'Mâcon', 4.83, 46.31, '', 1, 4, null, 0, 'Otto-William', 'fr'],
  // the Loire and the west
  ['blois', 'Blois', 1.33, 47.59, '', 0, 6, 'blois', 1, '', 'fr'],
  ['chartres', 'Chartres', 1.49, 48.45, '', 0, 6, 'blois', 1, '', 'fr'],
  ['tours', 'Tours', 0.69, 47.39, '', 0, 6, 'blois', 1, '', 'fr'],
  ['chateaudun', 'Châteaudun', 1.33, 48.07, '', 0, 4, null, 0, 'the Viscount of Châteaudun', 'fr'],
  ['vendome', 'Vendôme', 0.95, 47.8, '', 0, 4, null, 1, 'Bouchard the Venerable', 'fr'],
  ['saumur', 'Saumur', -0.08, 47.26, '', 1, 4, null, 1, 'Gelduin of Saumur', 'fr'],
  ['angers', 'Angers', -0.55, 47.47, '', 0, 6, 'anjou', 1, '', 'fr'],
  ['loudun', 'Loudun', 0.07, 46.98, '', 0, 4, 'anjou', 1, '', 'fr'],
  ['maine', 'Maine', 0.2, 48.0, '', 0, 5, null, 1, 'Count Hugh III', 'fr'],
  ['belleme', 'Bellême', 0.57, 48.38, '', 1, 4, null, 1, 'Yves of Bellême', 'fr'],
  ['berry', 'Berry', 2.4, 47.08, '', 0, 5, null, 1, 'the Viscount of Bourges', 'fr'],
  // Normandy and Brittany
  ['rouen', 'Rouen', 1.0, 49.5, 'channel', 0, 7, 'normandy', 1, '', 'fr'],
  ['evreux', 'Évreux', 1.0, 48.98, '', 0, 5, 'normandy', 1, '', 'fr'],
  ['bessin', 'Bessin', -0.6, 49.15, 'channel', 0, 5, 'normandy', 1, '', 'fr'],
  ['cotentin', 'Cotentin', -1.4, 49.35, 'channel', 0, 4, null, 0, 'the Viscount of the Cotentin', 'fr'],
  ['avranches', 'Avranches', -1.3, 48.68, 'channel', 0, 3, null, 0, 'the Bishop of Avranches', 'fr'],
  ['rennes', 'Rennes', -1.68, 48.11, '', 0, 5, 'brittany', 1, '', 'fr'],
  ['dol', 'Dol', -2.1, 48.5, 'channel', 0, 4, 'brittany', 0, '', 'fr'],
  ['nantes', 'Nantes', -1.6, 47.25, 'biscay', 0, 5, null, 1, 'Count Guérech', 'fr'],
  ['vannes', 'Vannes', -2.8, 47.8, 'biscay', 0, 4, null, 0, 'the Count of Vannes', 'fr'],
  ['cornouaille', 'Cornouaille', -4.0, 48.05, 'biscay', 1, 3, null, 0, 'Count Hoël', 'fr'],
  ['leon', 'Léon', -3.8, 48.55, 'channel', 1, 3, null, 0, 'the Lord of Léon', 'fr'],
  // Aquitaine
  ['poitiers', 'Poitiers', 0.34, 46.58, '', 0, 6, 'aquitaine', 1, '', 'fr'],
  ['saintonge', 'Saintonge', -0.63, 45.75, 'biscay', 0, 5, 'aquitaine', 0, '', 'fr'],
  ['thouars', 'Thouars', -0.5, 46.85, 'biscay', 0, 4, null, 1, 'the Viscount of Thouars', 'fr'],
  ['angouleme', 'Angoulême', 0.4, 45.65, '', 0, 4, null, 1, 'Count Arnaud', 'fr'],
  ['limoges', 'Limoges', 1.26, 45.83, '', 1, 4, null, 1, 'Viscount Gerald', 'fr'],
  ['marche', 'La Marche', 2.0, 46.25, '', 1, 3, null, 0, 'Count Boson', 'fr'],
  ['perigord', 'Périgord', 0.72, 45.18, '', 1, 4, null, 0, 'the Count of Périgord', 'fr'],
  ['bourbon', 'Bourbon', 3.06, 46.57, '', 0, 4, null, 1, 'Archambaud of Bourbon', 'fr'],
  ['auvergne', 'Auvergne', 3.08, 45.78, '', 1, 5, null, 1, 'Count Guy', 'fr'],
  ['velay', 'Le Puy', 3.88, 45.04, '', 1, 4, null, 0, 'the Bishop of Le Puy', 'fr'],
  // Gascony and the south-west
  ['bordeaux', 'Bordeaux', -0.58, 44.84, 'biscay', 0, 6, 'gascony', 1, '', 'fr'],
  ['agen', 'Agen', 0.62, 44.2, '', 0, 4, null, 0, 'the Count of Agen', 'fr'],
  ['gascony', 'Dax', -0.6, 43.85, 'biscay', 0, 4, 'gascony', 1, '', 'fr'],
  ['auch', 'Fézensac', 0.58, 43.65, '', 1, 4, null, 0, 'Count Odo of Fézensac', 'fr'],
  ['bearn', 'Béarn', -0.6, 43.2, '', 1, 3, null, 1, 'Viscount Gaston', 'fr'],
  ['bigorre', 'Bigorre', 0.4, 43.05, '', 1, 3, null, 1, 'Count Garcia', 'fr'],
  // Toulouse and Languedoc
  ['toulouse', 'Toulouse', 1.44, 43.6, '', 0, 7, 'toulouse', 1, '', 'fr'],
  ['quercy', 'Quercy', 1.44, 44.45, '', 1, 4, 'toulouse', 1, '', 'fr'],
  ['albi', 'Albi', 2.15, 43.93, '', 1, 4, null, 0, 'the Viscount of Albi', 'fr'],
  ['rouergue', 'Rouergue', 2.57, 44.35, '', 1, 4, null, 1, 'Count Raymond', 'fr'],
  ['carcassonne', 'Carcassonne', 2.35, 43.21, '', 1, 5, null, 1, 'Count Roger', 'fr'],
  ['narbonne', 'Narbonne', 3.0, 43.18, 'lion', 0, 6, null, 1, 'Viscount Raymond', 'fr'],
  ['beziers', 'Béziers', 3.3, 43.45, 'lion', 0, 4, null, 0, 'the Viscount of Béziers', 'fr'],
  ['nimes', 'Nîmes', 4.36, 43.84, 'lion', 0, 5, null, 1, 'the Viscount of Nîmes', 'fr'],
  ['roussillon', 'Roussillon', 2.89, 42.7, 'lion', 1, 5, 'roussillon', 1, '', 'ca'],
  // the Spanish March
  ['barcelona', 'Barcelona', 2.17, 41.39, 'lion', 0, 7, 'barcelona', 1, '', 'ca'],
  ['girona', 'Girona', 2.82, 41.98, 'lion', 1, 5, 'barcelona', 1, '', 'ca'],
  ['osona', 'Osona', 2.25, 41.93, '', 1, 4, 'barcelona', 1, '', 'ca'],
  ['cerdanya', 'Cerdanya', 1.95, 42.43, '', 1, 3, null, 1, 'Count Oliba Cabreta', 'ca'],
  ['urgell', 'Urgell', 1.3, 42.0, '', 1, 4, null, 1, 'Ermengol, son of Borrell', 'ca'],
  ['pallars', 'Pallars', 0.95, 42.4, '', 1, 3, null, 0, 'the Count of Pallars', 'ca'],
  ['manresa', 'Manresa', 1.83, 41.73, '', 1, 3, null, 1, 'the Castellans of the March', 'ca'],
  // Burgundy-Arles: counts the princes may win
  ['lyon', 'Lyon', 4.83, 45.76, '', 0, 7, null, 1, 'Archbishop Burchard', 'ar'],
  ['vienne', 'Vienne', 5.0, 45.4, '', 1, 4, null, 1, 'the Count of Vienne', 'ar'],
  ['valence', 'Valence', 4.95, 44.85, '', 1, 4, null, 0, 'the Bishop of Valence', 'ar'],
  ['grenoble', 'Grenoble', 5.8, 45.15, '', 1, 3, null, 1, 'the Bishop of Grenoble', 'ar'],
  ['besancon', 'Besançon', 6.02, 47.24, '', 1, 5, null, 1, 'Otto-William, Count of Burgundy', 'ar'],
  ['avignon', 'Avignon', 4.8, 43.95, '', 0, 4, 'provence', 0, '', 'ar'],
  ['arles', 'Arles', 4.63, 43.62, 'lion', 0, 6, 'provence', 1, '', 'ar'],
  ['marseille', 'Marseille', 5.4, 43.3, 'lion', 1, 5, null, 1, 'Viscount Pons', 'ar'],
  ['nice', 'Nice', 6.9, 43.75, 'lion', 1, 3, null, 0, 'the Count of Nice', 'ar'],
  // the south coast of England, reached only by sea
  ['kent', 'Kent', 0.95, 51.2, 'channel,north', 0, 5, null, 1, 'the Ealdorman of Kent', 'en'],
  ['sussex', 'Sussex', -0.3, 50.97, 'channel', 0, 4, null, 0, 'the Ealdorman of Sussex', 'en'],
  ['wessex', 'Winchester', -1.5, 51.05, 'channel', 0, 6, null, 1, 'the Ealdorman of Hampshire', 'en'],
  ['devon', 'Exeter', -3.5, 50.78, 'channel', 1, 4, null, 1, 'the Ealdorman of Devon', 'en'],
  ['empuries', 'Empúries', 3.0, 42.27, 'lion', 1, 4, 'roussillon', 1, '', 'ca'],
];
const REGION_NAME = { fr: 'the kingdom of the Franks', lo: 'Lorraine', ar: 'Burgundy-Arles', ca: 'the Spanish March', en: 'the kingdom of the English' };
// crossings by sea, as on a board game: an army marches or strikes along them as if the two counties touched
const SEA_ROUTES = [['barcelona', 'marseille'], ['boulogne', 'kent'], ['cotentin', 'wessex'], ['leon', 'devon']];
// lands beyond the kingdom: drawn and named, never played; they press on the edges through events
const EDGES = [
  ['england', 'Anglo-Saxon England', -1.9, 51.62], ['empire1', 'The Empire', 7.6, 50.6], ['empire2', 'The Empire', 7.9, 48.7],
  ['empire3', 'The Empire', 6.2, 51.6], ['jura', 'Kingdom of Burgundy-Arles', 6.9, 46.5], ['italy', 'Kingdom of Italy', 8.4, 44.6],
  ['pamplona', 'Kingdom of Pamplona', -1.7, 42.6], ['cordoba1', 'Caliphate of Córdoba', 0.2, 41.2], ['cordoba2', 'Caliphate of Córdoba', -2.6, 41.6],
];
const SEA_LABELS = [['The Narrow Sea', -1.9, 50.35], ['The German Sea', 2.2, 51.55], ['Bay of Biscay', -3.6, 45.9], ['Gulf of Lion', 4.4, 42.6]];
// ================= GENERALS =================
const GENERALS = [
  { id: 'bouchard', n: 'Bouchard of Corbeil', d: 'A patient defender of walls, raised in the household of the Count of Vendôme.', c: 60, def: .25, morale: .05 },
  { id: 'byrhtnoth', n: 'Hugh of Beaumont', d: 'A towering vassal who leads the shield wall from the front.', c: 55, foot: .3, morale: .08 },
  { id: 'geoffrey', n: 'Geoffrey Greymantle', d: 'An old campaigner of Anjou, sound in every part of war.', c: 70, atk: .12, def: .12 },
  { id: 'gerbert', n: 'Gerbert the Engineer', d: 'A scholar of Aurillac who studied Moorish siegecraft.', c: 60, siege: 1, def: .05 },
  { id: 'thorkell', n: 'Thorkell the Tall', d: 'A Danish sea-lord who sells his sword in Rouen. Hits hard and thinks little.', c: 65, atk: .25, def: -.05 },
  { id: 'lambert', n: 'Lambert of Louvain', d: 'A master of the mounted charge.', c: 60, cav: .4 },
  { id: 'osgar', n: 'Hervé the Archer', d: 'Trained the bowmen of the Breton march.', c: 50, bow: .45 },
  { id: 'adalbero', n: 'Adalbero of Laon', d: 'A scheming bishop with an eye for ground.', c: 55, def: .15, morale: .1 },
  { id: 'raoul', n: 'Raoul of Ivry', d: 'Hard on rebels and quick in the saddle.', c: 60, atk: .1, cav: .2 },
  { id: 'eadric', n: 'Raoul of Cambrai', d: 'Captain of a household guard of axemen.', c: 55, foot: .25, atk: .05 },
  { id: 'sancho', n: 'Sancho the Navarrese', d: 'A mercenary horseman from beyond the Pyrenees.', c: 50, cav: .3 },
  { id: 'theophylact', n: 'Theophylact the Greek', d: 'A Byzantine officer skilled with engines and bows.', c: 65, siege: 1, bow: .2 },
];
const LADIES = ['Adela', 'Emma', 'Gerberga', 'Mathilde', 'Hildegarde', 'Ermengarde', 'Judith', 'Constance', 'Gisela', 'Richilde', 'Beatrix', 'Alix', 'Adelaide', 'Rothilde', 'Ermesinde', 'Garsende'];
const CONT_LL = [[-1.8, 43.3], [-1.5, 43.6], [-1.2, 44.6], [-1.25, 45.6], [-1.2, 46.2], [-2.1, 46.8], [-2.5, 47.3], [-3.5, 47.7], [-4.4, 47.8], [-4.75, 48.4], [-4.0, 48.7], [-3.0, 48.8], [-2.0, 48.6], [-1.6, 48.65], [-1.9, 49.7], [-1.3, 49.65], [-1.1, 49.35], [0.1, 49.45], [0.2, 49.7], [1.4, 50.1], [1.6, 50.7], [1.9, 51.0], [2.5, 51.1],
  [3.4, 51.35], [3.6, 51.5], [4.1, 52.0], [4.6, 52.5], [4.75, 52.95], [5.4, 53.4], [6.5, 53.5], [7.2, 53.6], [8.0, 53.6], [8.5, 53.5], [8.7, 53.9], [8.9, 54.3], [9.9, 54.4], [10.2, 54.45], [10.9, 54.0], [11.5, 54.05], [12.3, 54.3], [13.0, 54.4],
  [13.2, 53.6], [12.6, 52.9], [12.5, 52.2], [12.3, 51.4], [12.8, 50.7], [12.3, 50.2], [13.0, 49.6], [13.7, 48.8], [14.8, 48.75], [16.2, 48.6], [16.9, 48.1], [16.5, 47.6], [16.1, 46.8], [15.6, 46.3], [14.8, 45.8], [14.0, 45.6], [13.75, 45.65],
  [13.35, 45.75], [12.9, 45.6], [12.4, 45.45], [12.25, 45.0], [12.3, 44.5], [12.4, 44.1], [13.0, 43.8], [13.6, 43.55], [13.9, 42.95], [14.4, 42.4], [15.0, 42.1], [15.6, 41.95], [16.1, 41.9], [16.0, 41.6], [16.6, 41.2], [17.3, 40.9], [18.0, 40.6], [18.5, 40.15], [18.35, 39.8], [17.9, 40.25], [17.2, 40.45], [16.8, 40.3], [16.5, 39.75], [17.15, 39.1], [16.6, 38.75], [16.15, 38.05], [15.65, 37.95],
  [15.65, 38.25], [15.95, 38.65], [16.05, 39.2], [15.8, 39.8], [15.4, 40.05], [14.95, 40.25], [14.85, 40.6], [14.3, 40.75], [14.0, 40.95], [13.7, 41.25], [13.0, 41.25], [12.4, 41.65], [11.8, 42.1], [11.2, 42.45], [10.6, 42.95], [10.5, 43.4], [10.25, 43.85], [9.85, 44.05], [9.2, 44.3], [8.8, 44.4], [8.2, 43.95], [7.5, 43.78],
  [6.6, 43.1], [5.9, 43.1], [5.0, 43.35], [4.3, 43.5], [3.4, 43.3], [3.05, 42.9], [3.15, 42.45], [3.2, 41.9], [2.2, 41.3], [1.0, 41.05], [0.5, 40.6], [0.0, 39.8], [-6, 39.8], [-6, 43.55], [-4.5, 43.4], [-3.0, 43.4]];
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
// the houses' traits, as the rules read them
const TRAITS = {
  normandy: { cost: { cav: 16 } }, gascony: { cost: { cav: 17 } }, roussillon: { cost: { bow: 8 } }, burgundy: { cost: { bishop: 18 }, bless: 5 },
  champagne: { market: 4, fair: 1.4 }, flanders: { market: 3 }, provence: { port: 3, gen: 0.75 }, anjou: { castle: 0.75 }, aquitaine: { income: 2 },
  brittany: { levy: 2 }, toulouse: { capGrow: 2 }, blois: { ally: 0.75 }, barcelona: { hold: 0.05, march: 0.15 },
};
FACTIONS.forEach(f => { f.tr = TRAITS[f.id] || {}; });
Object.assign(FACTIONS.find(f => f.id === 'capet'), { lose: 'Duke', domain: 'the royal domain', seat: king => king ? ['Count', 'Paris'] : ['Duke', 'the Franks'] });
const NORTH = ['capet', 'charles', 'normandy', 'flanders', 'champagne', 'blois', 'anjou', 'brittany', 'burgundy'];
return {
  id: 'france', FACTIONS, PROV, REGION_NAME, SEA_ROUTES, EDGES, SEA_LABELS, GENERALS, LADIES,
  name: 'France, 987', sub: 'The kingdom of the West Franks', game: 'The Crown of the Franks',
  realm: 'France', foreignTxt: 'French lords resent foreign rule', foreignAsk: 'French lords ask double of foreigners',
  kingdom: { regions: ['fr', 'ca'], core: 'fr', n: 'the Franks', short: 'France', keys: ['reims'], at: 'Reims' },
  date: { y0: 987, s0: 1, yOff: 1, roman: 'CMLXXXVII' },
  truce: 6,
  peace: { Name: 'The Peace of God', name: 'the Peace of God', ends: 'The Peace of God has expired. The great houses may now make war on each other.', breakTxt: 'This attack breaks the Peace of God.' },
  crown: {
    title: 'King of the Franks', of: 'of the Franks', the: 'the crown of the Franks', people: 'the Franks', latin: 'REX FRANCORUM', regnum: 'Regnum Francorum', rex: 'Rex Francorum',
    anointed: 'anointed at Reims', at: 'Reims', rite: 'At Reims the archbishop anoints', start: 'capet',
    needs: (fid, great) => great ? ['reims'] : ['reims', fid === 'charles' ? 'laon' : 'paris'],
    why: { reims: 'Its archbishop anoints the kings of the Franks.', paris: 'The royal seat of the Robertians: a king needs it, with Reims.', laon: 'The last city of the Carolingians: Charles may be crowned with it in place of Paris.' },
    coronation: 'The archbishop of Reims anoints kings, and a king needs his royal seat.',
    rule: () => `A king is anointed at Reims and needs his royal seat: hold Reims and Paris (Charles: Reims and Laon) and at least ${CROWN_LANDS} counties of the kingdom, and pay ${CROWN_COST} d. A prince with ${CROWN_GREAT} counties of the kingdom needs only Reims.`,
    take: 'Take Reims and the royal seat and it can be yours.',
    won: fid => `At Reims, before the bishops of the realm, the archbishop anoints ${FAC(fid).pname} King of the Franks.`,
    wonAll: fid => `At Reims the archbishop anoints ${FAC(fid).pname}, and there is no prince left to stand against him.`,
    endWon: n => `${n} kneels before the altar of Reims. The archbishop anoints him, the crown is set on his head, and the bells ring out across a kingdom he holds in his own hand.`,
    endAll: n => `At Reims the archbishop anoints ${n}, and from Flanders to Barcelona no prince stands against him.`,
    span: 'From Flanders to Barcelona', crowned: 'crowned at Reims', church: 'the archbishop of Reims',
    rules: 'For the first time in a century, a king of the Franks rules as well as reigns.',
  },
  houseOf: f => f.realm === 'France' ? 'A house of the kingdom of the Franks' : 'A house of the kingdom of Arles',
  groups: [['The north', NORTH], ['The south', null]],
  where: fid => NORTH.includes(fid) ? 'The north is rich and crowded: Reims and Paris are close, and so is every rival.' : 'The south has room to grow, but its counties pay less, the crown is far away, and other powers press from beyond the border.',
  intro: {
    get note() { return `Louis V is dead without an heir. At Senlis the great men of the kingdom passed over his uncle, Charles of Lorraine, and chose Hugh, Duke of the Franks; Archbishop Adalbero of Reims crowned him in July. The new king's writ runs little further than Paris and Orléans. The bishops proclaim the Peace of God: no war between the princes until ${dateStr(TRUCE)}.`; },
    lead: 'King Louis V is dead without an heir. At Senlis the princes have chosen Hugh Capet, but a crown is not a kingdom. Charles of Lorraine, the last Carolingian, wants it back, and from Flanders to Barcelona the great princes rule as they please. Who will be king in fact?',
    splash: (fid, d, cap) => `<p>King Louis V is dead without an heir. At Senlis the princes have raised Hugh Capet to the throne, but he is king of little more than Paris and Orléans. At ${cap}, ${d.pname} raises the banner of ${d.name}.</p>
    <p>Build while the Peace of God holds, and win the lesser lords by sword, marriage or gold. ${fid === 'capet' ? 'You wear the crown already. Now make it mean something: hold half the kingdom yourself.' : fid === 'charles' ? 'Take Laon and Reims and the crown of your fathers is yours.' : 'Take Reims and Paris and you may be anointed yourself, or make yourself too strong for any king to command.'}</p>`,
  },
  help: {
    top: '<p><b>France in 987.</b> King Louis V is dead. Hugh Capet holds the crown, but the great princes rule their own lands, and Charles of Lorraine, the last Carolingian, wants it back. Fifteen houses, from Flanders to Barcelona.</p>',
    sea: '<p><b>Sea crossings.</b> Dotted lines on the map join counties across the water: Barcelona and Marseille, and three crossings of the Channel to the south coast of England. An army marches or strikes along one as if the two counties touched. The English shires are held by their own ealdormen, are defended by their king, and do not count toward the kingdom of the Franks.</p>',
    rich: 'The rich land is in the north.',
    peace: () => `<p><b>The Peace of God.</b> For the first ${TRUCE} turns the Church forbids war between the great houses. Break it and you are excommunicated.</p>`,
    powers: `<p><b>Beyond the kingdom.</b> The hatched lands at the edge of the map are not for conquest. Their rulers act on France from outside.</p>
      <p><b>Almanzor.</b> The hajib of Córdoba sends summer raids over the Pyrenees, against Barcelona and the far south. Pay him parias to go away, or meet him in the field.</p>
      <p><b>Pamplona and Arles.</b> The Basques raid Gascony and Toulouse. In Provence, the Kingdom of Arles watches any outsider who takes more than a foothold.</p>
      <p><b>The Empire.</b> The Emperor's regents hold Lorraine. Take its counties, or take Reims without the crown, and an imperial host may come to take them back.</p>
      <p><b>England.</b> King Æthelred holds the south coast through his ealdormen. Take a shire across the Channel and, sooner or later, an English army comes to take it back.</p>
      <p><b>The Danes.</b> Normandy can open or close its ports to the Danes. Open, Normandy profits and Danish raiders range the coasts; closed, the Pope is pleased.</p>
      <p><b>Events.</b> Some things happened in these years: Robert crowned beside his father, Laon opened to Charles, an archbishop's death, a bishop's betrayal. The game follows them loosely.</p>`,
  },
  fair: { at: 'Troyes', name: 'the fair at Troyes', title: 'The fair at Troyes', who: 'Merchants from Flanders, the Rhine and Venice fill Troyes for the summer fair.', lord: 'Count of Champagne', open: 'The summer fair at Troyes is open' },
  art: {
    // the siege screen: a grand castle behind the realm's capital, a cathedral behind the great sees
    grand: ['paris'], cathedrals: ['reims', 'sens', 'tours', 'rouen', 'berry', 'bordeaux', 'lyon', 'narbonne', 'auch', 'besancon', 'vienne', 'arles', 'chartres', 'laon', 'cambrai', 'liege'],
    mountains: ['bearn', 'bigorre', 'pallars', 'urgell', 'cerdanya', 'roussillon', 'grenoble', 'nice', 'auvergne', 'velay', 'osona', 'italy', 'jura', 'pamplona'],
    woods: ['ardennes', 'maine', 'belleme', 'chateaudun', 'vendome', 'berry', 'bourbon', 'nevers', 'marche', 'limoges', 'perigord', 'gascony', 'vannes', 'rennes', 'soissons', 'senlis', 'autun', 'namur', 'hainaut', 'dol', 'empire1', 'empire2', 'empire3', 'angouleme', 'thouars', 'loudun', 'velay', 'rouergue', 'kent', 'sussex', 'wessex', 'devon', 'vexin', 'evreux', 'besancon'],
    rivers: [
  ['Seine', [[4.72, 47.48], [4.57, 47.86], [4.08, 48.3], [3.5, 48.49], [2.95, 48.38], [2.66, 48.54], [2.35, 48.86], [2.05, 48.93], [1.71, 48.99], [1.41, 49.24], [1.1, 49.44], [0.73, 49.53], [0.15, 49.46]]],
  ['Marne', [[5.3, 47.9], [5.14, 48.1], [4.95, 48.64], [4.36, 48.96], [3.95, 49.04], [3.4, 49.05], [2.88, 48.96], [2.42, 48.82]]],
  ['Oise', [[4.1, 49.9], [3.3, 49.62], [2.83, 49.42], [2.4, 49.2], [2.1, 49.0]]],
  ['Loire', [[4.22, 44.84], [4.0, 45.3], [4.07, 46.03], [3.98, 46.48], [3.46, 46.83], [3.16, 46.99], [3.02, 47.18], [2.63, 47.69], [1.9, 47.9], [1.33, 47.59], [0.98, 47.41], [0.69, 47.39], [-0.08, 47.26], [-0.55, 47.38], [-1.55, 47.21], [-2.2, 47.28]]],
  ['Allier', [[3.8, 44.6], [3.4, 45.5], [3.42, 46.13], [3.33, 46.56], [3.08, 46.96]]],
  ['Vienne', [[1.9, 45.6], [1.26, 45.83], [0.7, 46.1], [0.55, 46.8], [0.08, 47.21]]],
  ['Garonne', [[0.6, 42.75], [0.72, 43.1], [1.44, 43.6], [0.62, 44.2], [0.16, 44.5], [-0.57, 44.84], [-0.75, 45.1], [-1.05, 45.55]]],
  ['Dordogne', [[2.8, 45.55], [2.3, 45.2], [1.4, 44.9], [0.48, 44.85], [-0.24, 44.92], [-0.6, 45.03]]],
  ['Lot', [[3.5, 44.5], [2.4, 44.6], [1.44, 44.45], [0.34, 44.3]]],
  ['Tarn', [[3.6, 44.3], [2.15, 43.93], [1.35, 44.05], [1.0, 44.1]]],
  ['Rhône', [[6.15, 46.2], [5.75, 45.9], [4.83, 45.76], [4.87, 45.52], [4.89, 44.93], [4.75, 44.56], [4.81, 43.95], [4.63, 43.68], [4.65, 43.35]]],
  ['Saône', [[6.0, 48.0], [5.6, 47.45], [4.85, 46.78], [4.83, 46.31], [4.83, 45.76]]],
  ['Meuse', [[5.6, 48.0], [5.38, 49.16], [4.94, 49.7], [4.87, 50.46], [5.57, 50.63], [5.69, 50.85], [5.9, 51.3], [5.1, 51.75], [4.2, 51.85]]],
  ['Moselle', [[6.8, 47.9], [6.45, 48.17], [5.89, 48.68], [6.18, 49.12], [6.64, 49.75], [7.6, 50.36]]],
  ['Rhine', [[7.59, 47.56], [7.8, 48.58], [8.43, 49.32], [8.27, 50.0], [7.6, 50.36], [6.96, 50.94], [6.6, 51.5], [6.1, 51.85], [5.0, 51.95], [4.2, 51.95]]],
  ['Scheldt', [[3.3, 49.95], [3.24, 50.17], [3.39, 50.6], [3.72, 51.05], [4.4, 51.22], [3.8, 51.4]]],
  ['Somme', [[3.3, 49.85], [2.3, 49.9], [1.83, 50.1], [1.6, 50.2]]],
  ['Charente', [[0.5, 45.95], [0.16, 45.65], [-0.33, 45.7], [-0.63, 45.75], [-1.1, 45.95]]],
  ['Adour', [[0.15, 43.05], [-0.4, 43.7], [-1.05, 43.71], [-1.47, 43.49]]],
  ['Vilaine', [[-1.0, 48.2], [-1.68, 48.11], [-1.9, 47.75], [-2.4, 47.5]]],
  ['Ebro', [[-2.5, 42.45], [-1.6, 42.0], [-0.88, 41.65], [0.5, 41.2], [0.87, 40.72]]],
  ['Thames', [[-1.9, 51.7], [-1.25, 51.75], [-0.6, 51.5], [0.1, 51.5], [0.6, 51.5]]],
],
    ships: [[-3.9, 49.4, 1.05], [3.0, 42.15, 0.75, true]], serpent: [-5.2, 46.95, 1.3], rose: [-4.4, 44.6], cart: [5.6, 42.4],
  },
  free: ['normandy', 'capet', 'flanders'],
  challenges: [
  { id: 'breton', n: 'The Breton Gambit', house: 'brittany', diff: 'original', d: 'Brittany, far from Reims, against Standard rivals.' },
  { id: 'alm', n: "Almanzor's Summers", house: 'barcelona', diff: 'original', mod: { almEvery: 3 }, d: 'Barcelona, with Almanzor raiding twice as often.' },
  { id: 'poor', n: 'A Poor Crown', house: 'capet', diff: 'hard', mod: { gold: 20 }, d: 'The Royal Domain with an empty treasury, against Hard rivals.' },
  { id: 'alone', n: 'No Friends in the North', house: 'normandy', diff: 'original', mod: { noPacts: true }, d: 'Normandy, and no house will sign a pact or alliance with you.' },
  { id: 'usurper', n: 'The Carolingian Return', house: 'charles', diff: 'hard', d: 'Lower Lorraine against Hard rivals.' },
  { id: 'rhone', n: 'Across the Rhône', house: 'provence', diff: 'original', mod: { gold: 250 }, d: 'Provence, with a full treasury but a long road to Reims.' },
  { id: 'fairs', n: 'The Fair Kingdom', house: 'champagne', diff: 'hard', d: 'Champagne, between the King and Lorraine, against Hard rivals.' },
  { id: 'basque', n: 'The Basque Crown', house: 'gascony', diff: 'gentle', mod: { almEvery: 4 }, d: 'Gascony against Gentle rivals, with Almanzor restless.' },
],
  setup: {
    // Reims: the archbishop who crowns kings keeps a strong household
    before() { P('reims').b.castle = 2; Object.assign(P('reims').gar, { foot: 9, bow: 4, cav: 2 }); },
    houses() { P('troyes').b.market = 1; },
    // the princes who raised Hugh to the throne stand by him for his first years: Normandy, and his brother in Burgundy
    after() { for (const f of ['normandy', 'burgundy']) G.truces.push({ a: 'capet', b: f, until: TRUCE + 20, pact: true, treaty: true, pass: true }); },
  },
  geo: { LON0: -5.6, LAT1: 51.7, SX: 78, SY: 113, MW: 1200, MH: 1290, lands: [CONT_LL, BRIT_LL], seas: [SEA_ATL_LL, SEA_MED_LL], isles: [CORS_LL, SARD_LL] },
};
})();
