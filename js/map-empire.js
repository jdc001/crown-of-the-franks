'use strict';
// ================= THE MAP OF THE EMPIRE, 1002 =================
// Otto III is dead at twenty-one, without a son. Henry of Bavaria has the funeral train and the regalia; Eckard of
// Meissen has the Saxons; Hermann of Swabia has his knights. Bolesław of Poland is marching west, Arduin has crowned
// himself King of Italy at Pavia, and in the south the Lombard princes, the Saracens and the Greek catepan of Bari
// watch each other. Registered as a map; data.js reads whichever map is chosen.
MAPS.empire = (() => {
const FACTIONS = [
  // ---- the German princes ----
  { id: 'bavaria', title: 'Duke', pname: 'Henry of Bavaria', name: 'Bavaria', ruler: 'Duke Henry of Bavaria', color: '#2f5fa8', home: 'regensburg', realm: 'Germany', houseTxt: 'A duchy of the kingdom of the Germans',
    blurb: "Otto's cousin, last of the Ottonian men. He met the funeral train in the Alps and took the regalia; the Holy Lance had gone ahead to Cologne.", trait: 'Ottonian blood: lesser lords ask 25% less to swear to you, and bishops cost 22.',
    arms: { t: 'bendy', f: '#2f5fa8', c: '#e9ddbc' } },
  { id: 'swabia', title: 'Duke', pname: 'Hermann of Swabia', name: 'Swabia', ruler: 'Duke Hermann II of Swabia', color: '#c9a227', home: 'ulm', realm: 'Germany', houseTxt: 'A duchy of the kingdom of the Germans',
    blurb: 'The princes of the Rhine and many bishops would rather have Hermann than Henry. He has the Swabian knights, Alsace, and a grudge against Strasbourg.', trait: 'Swabian knights: cavalry cost 16 instead of 20.',
    arms: { t: 'lion', f: '#e2b33c', c: '#1d1d1d' } },
  { id: 'saxony', title: 'Duke', pname: 'Bernard Billung', name: 'Saxony', ruler: 'Duke Bernard of Saxony', color: '#7a7f2c', home: 'luneburg', realm: 'Germany', houseTxt: 'A duchy of the kingdom of the Germans',
    blurb: 'Duke of the Saxons, the people of the Ottos. The Saxon lords meet at Werla to choose their own king, and Bernard will speak for them.', trait: 'The Saxon levies: your counties raise 20% more levies.',
    arms: { t: 'barry', f: '#e2b33c', c: '#1d1d1d' } },
  { id: 'meissen', title: 'Margrave', pname: 'Eckard of Meissen', name: 'Meissen', ruler: 'Margrave Eckard of Meissen', color: '#3a7a5a', home: 'meissen', realm: 'Germany', houseTxt: 'A march on the Elbe',
    blurb: 'The hardest fighter in Saxony, who holds the Elbe against the Slavs. The Thuringians have already hailed him as their duke. He has many enemies.', trait: 'The march on the Elbe: your men fight 10% harder, and castles cost 25% less.',
    arms: { t: 'pale', f: '#3a7a5a', c: '#e9ddbc' } },
  { id: 'carinthia', title: 'Duke', pname: 'Otto of Worms', name: 'Worms and Carinthia', ruler: 'Duke Otto of Carinthia', color: '#8a5a2a', home: 'worms', realm: 'Germany', houseTxt: 'The Salian house',
    blurb: "Grandson of Otto the Great, lord of Worms and Speyer on the Rhine, of Carinthia and of the March of Verona. Some princes asked him to stand; he stepped aside, for a price.", trait: 'The Salian line: generals cost 25% less, and each county pays +1 d a turn.',
    arms: { t: 'chief', f: '#8a5a2a', c: '#e2b33c' } },
  // ---- Lotharingia ----
  { id: 'lorraine', title: 'Duke', pname: 'Otto of Lower Lorraine', name: 'Lower Lorraine', ruler: 'Duke Otto of Lower Lorraine', color: '#b8342c', home: 'brussels', realm: 'Germany', houseTxt: 'A duchy of Lotharingia',
    blurb: "Son of Charles of Lorraine, the Carolingian the Franks passed over. Charlemagne's blood and Charlemagne's Aachen, a day's ride away.", trait: "Charlemagne's blood: the Pope's blessings on your banners last 5 turns.",
    arms: { t: 'fess2', f: '#b8342c', c: '#e2b33c' } },
  { id: 'upperlorraine', title: 'Duke', pname: 'Theoderic of Bar', name: 'Upper Lorraine', ruler: 'Duke Theoderic of Upper Lorraine', color: '#d0832a', home: 'bar', realm: 'Germany', houseTxt: 'A duchy of Lotharingia',
    blurb: 'A small duchy between the bishops of Metz, Toul and Verdun, and the kingdom of the Franks. Theoderic is careful, and his castles are strong.', trait: 'Forest castles: your castles and garrisons hold 15% harder, and mines yield +2.',
    arms: { t: 'bend', f: '#d0832a', c: '#e9ddbc' } },
  // ---- the Slavs ----
  { id: 'poland', title: 'Duke', pname: 'Bolesław the Brave', name: 'Poland', ruler: 'Duke Bolesław the Brave', color: '#c23b4a', home: 'gniezno', realm: 'Poland', houseTxt: 'The duchy of the Polans',
    blurb: "Otto III came to Gniezno two years ago, set his own crown on Bolesław's head and called him brother. With Otto dead, Bolesław means to take the Elbe marches.", trait: 'Chrobry: cavalry cost 16, and your men fight 5% harder.',
    arms: { t: 'eagle', f: '#c23b4a', c: '#f3ecd8' } },
  { id: 'bohemia', title: 'Duke', pname: 'Boleslaus the Red', name: 'Bohemia', ruler: 'Duke Boleslaus III of Bohemia', color: '#5a6a7a', home: 'prague', realm: 'Bohemia', houseTxt: 'The duchy of the Czechs',
    blurb: 'A cruel duke who murdered his way through the Slavník princes and has driven his own brothers into exile. His nobles are close to throwing him out.', trait: 'Silver and mountain walls: mines yield +3, and castles cost 25% less.',
    arms: { t: 'lion', f: '#5a6a7a', c: '#f3ecd8' } },
  // ---- Italy ----
  { id: 'ivrea', title: 'King', pname: 'Arduin of Ivrea', name: 'Italy', ruler: 'King Arduin of Italy', color: '#2e7a6a', home: 'pavia', realm: 'Italy', houseTxt: 'The kingdom of Italy',
    blurb: 'Margrave of Ivrea, excommunicated for killing a bishop. Three weeks after Otto died, the Lombard lords crowned him King of Italy at Pavia. The German bishops in Italy want him dead.', trait: 'The iron crown of the Lombards: footmen cost 7, and your counties raise a quarter more levies.',
    arms: { t: 'cross', f: '#2e7a6a', c: '#e9ddbc' } },
  { id: 'canossa', title: 'Marquis', pname: 'Tedald of Canossa', name: 'Canossa', ruler: 'Marquis Tedald of Canossa', color: '#4a6a2a', home: 'canossa', realm: 'Italy', houseTxt: 'A march of the kingdom of Italy',
    blurb: "Count of Modena, Reggio, Mantua, Brescia and Ferrara, from a rock fortress in the Apennines no one has ever taken. He is for Henry, and against Arduin.", trait: "Canossa's crags: castles cost 25% less and hold 15% harder.",
    arms: { t: 'tower', f: '#4a6a2a', c: '#e9ddbc' } },
  { id: 'crescentii', title: 'Patrician', pname: 'John Crescentius', name: 'Rome', ruler: 'Patrician John Crescentius', color: '#a8326e', home: 'rome', realm: 'Italy', houseTxt: 'The Crescentii of Rome',
    blurb: "Otto beheaded his father on the walls of Castel Sant'Angelo. Now Otto is dead, the Pope has fled, and John Crescentius rules Rome as patrician.", trait: 'Lords of Rome: bishops cost 20, blessings last 5 turns, and Rome brings its six cardinals.',
    arms: { t: 'roundels', f: '#a8326e', c: '#e2b33c' } },
  // ---- the Lombard south ----
  { id: 'benevento', title: 'Prince', pname: 'Pandulf of Benevento', name: 'Benevento', ruler: 'Prince Pandulf II of Benevento', color: '#c97b2e', home: 'benevento', realm: 'Lombardy', houseTxt: 'A Lombard principality',
    blurb: 'Heir of Pandulf Ironhead, who once held all the Lombard south. Benevento and Capua are his family\'s, and the Greeks and the Saracens are at his door.', trait: 'Lombard horse: cavalry cost 17, and your counties raise a quarter more levies.',
    arms: { t: 'perpale', f: '#c97b2e', c: '#2a1d12' } },
  { id: 'salerno', title: 'Prince', pname: 'Guaimar of Salerno', name: 'Salerno', ruler: 'Prince Guaimar III of Salerno', color: '#2a6a9a', home: 'salerno', realm: 'Lombardy', houseTxt: 'A Lombard principality',
    blurb: 'Lord of the richest coast in Italy, with Amalfi\'s merchants and the doctors of Salerno. He pays the Saracens when he must, and plots against the Greeks when he can.', trait: 'Amalfi and the sea trade: markets and ports yield +3.',
    arms: { t: 'perfess', f: '#2a6a9a', c: '#e2b33c' } },
  // ---- Byzantium: not a house to play, but a power to fear ----
  { id: 'byzantium', title: 'Catepan', pname: 'Gregory Tarchaneiotes', name: 'Byzantine Italy', ruler: 'Catepan Gregory Tarchaneiotes', color: '#5b2a86', home: 'bari', realm: 'Byzantium', houseTxt: 'The Catepanate of Italy, for the Emperor Basil',
    blurb: "The Emperor Basil's governor at Bari. Constantinople is busy with the Bulgars and mostly lets Italy be, but if anyone threatens Apulia or grows too strong in the south, the imperial fleet comes.", trait: 'The Roman Empire: strong garrisons, Greek fire at 20 d, and ports yield +3.',
    arms: { t: 'eagle', f: '#5b2a86', c: '#e2b33c' } },
];
// the houses' traits, as the rules read them
const TRAITS = {
  bavaria: { ally: 0.75, cost: { bishop: 22 } }, swabia: { cost: { cav: 16 } }, saxony: { levy: 1.2 }, meissen: { atk: 0.1, castle: 0.75 },
  carinthia: { gen: 0.75, income: 1 }, lorraine: { bless: 5 }, upperlorraine: { hold: 0.15, mine: 2 },
  poland: { cost: { cav: 16 }, atk: 0.05 }, bohemia: { mine: 3, castle: 0.75 },
  ivrea: { cost: { foot: 7 }, levy: 1.25 }, canossa: { castle: 0.75, hold: 0.15 }, crescentii: { cost: { bishop: 20 }, bless: 5 },
  benevento: { cost: { cav: 17 }, levy: 1.25 }, salerno: { market: 3, port: 3 }, byzantium: { gf: 20, hold: 0.25, port: 3 },
};
FACTIONS.forEach(f => { f.tr = TRAITS[f.id] || {}; });
// Bolesław wears the crown Otto put on him, but to the Germans he is a duke; Malcolm-style, Arduin is King of the Italians
Object.assign(FACTIONS.find(f => f.id === 'ivrea'), { seat: () => ['King', 'the Italians'] });

// ================= COUNTIES =================
// id, name, lon, lat, coast, hills, base, owner, castle, lord, region
// region: de = the kingdom of the Germans (the crown's lands), sl = the Slav lands, it = the kingdom of Italy,
// lo = the Lombard south, gr = Byzantine Italy
const PROV = [
  // ---- Bavaria ----
  ['regensburg', 'Regensburg', 12.1, 49.02, '', 0, 8, 'bavaria', 1, '', 'de'],
  ['bamberg', 'Bamberg', 10.89, 49.89, '', 0, 5, 'bavaria', 0, '', 'de'],
  ['landshut', 'Landshut', 12.15, 48.54, '', 0, 4, 'bavaria', 0, '', 'de'],
  ['nordgau', 'Nordgau', 11.6, 49.5, '', 1, 4, 'bavaria', 1, '', 'de'],
  ['freising', 'Freising', 11.6, 48.25, '', 0, 4, 'bavaria', 0, '', 'de'],
  ['passau', 'Passau', 13.46, 48.57, '', 1, 4, null, 1, 'Bishop Christian of Passau', 'de'],
  ['salzburg', 'Salzburg', 13.05, 47.75, '', 1, 5, null, 1, 'Archbishop Hartwig of Salzburg', 'de'],
  ['austria', 'Ostarrichi', 15.6, 48.2, '', 0, 4, null, 1, 'Margrave Henry of Austria', 'de'],
  ['brixen', 'Brixen', 11.65, 46.72, '', 1, 3, null, 0, 'Bishop Albuin of Brixen', 'de'],
  // ---- Swabia and Alsace ----
  ['ulm', 'Ulm', 9.99, 48.4, '', 0, 5, 'swabia', 1, '', 'de'],
  ['zurich', 'Zürich', 8.54, 47.37, '', 1, 5, 'swabia', 0, '', 'de'],
  ['breisgau', 'Breisgau', 8.0, 47.95, '', 1, 4, 'swabia', 0, '', 'de'],
  ['alsace', 'Upper Alsace', 7.3, 47.75, '', 1, 4, 'swabia', 0, '', 'de'],
  ['augsburg', 'Augsburg', 10.9, 48.37, '', 0, 5, null, 1, 'Bishop Siegfried of Augsburg', 'de'],
  ['konstanz', 'Konstanz', 9.3, 47.75, '', 0, 4, 'swabia', 0, '', 'de'],
  ['chur', 'Chur', 9.53, 46.85, '', 1, 3, null, 0, 'Bishop Ulrich of Chur', 'de'],
  ['strasbourg', 'Strasbourg', 7.75, 48.58, '', 0, 6, null, 1, 'Bishop Werner of Strasbourg', 'de'],
  // ---- Saxony and Thuringia ----
  ['luneburg', 'Lüneburg', 10.4, 53.25, '', 0, 5, 'saxony', 1, '', 'de'],
  ['holstein', 'Holstein', 9.9, 54.1, 'north,baltic', 0, 4, 'saxony', 0, '', 'de'],
  ['stade', 'Stade', 9.3, 53.6, 'north', 0, 4, 'saxony', 0, '', 'de'],
  ['eastfrisia', 'East Frisia', 7.35, 53.3, 'north', 0, 3, null, 0, 'the East Frisian chiefs', 'de'],
  ['bremen', 'Bremen', 8.75, 53.05, 'north', 0, 6, null, 1, 'Archbishop Libentius of Bremen', 'de'],
  ['munster', 'Münster', 7.63, 52.0, '', 0, 5, null, 0, 'Bishop Suidger of Münster', 'de'],
  ['dortmund', 'Dortmund', 7.47, 51.45, '', 0, 4, null, 0, 'the Royal Reeve of Dortmund', 'de'],
  ['paderborn', 'Paderborn', 8.75, 51.72, '', 1, 4, null, 0, 'Bishop Rethar of Paderborn', 'de'],
  ['hildesheim', 'Hildesheim', 9.95, 52.2, '', 0, 5, null, 1, 'Bishop Bernward of Hildesheim', 'de'],
  ['brunswick', 'Brunswick', 10.6, 52.4, '', 0, 4, null, 0, 'Count Bruno of Brunswick', 'de'],
  ['goslar', 'Goslar', 10.43, 51.85, '', 1, 5, null, 1, 'the Royal Reeve of Goslar', 'de'],
  ['quedlinburg', 'Quedlinburg', 11.2, 51.72, '', 1, 4, null, 1, 'Abbess Adelheid of Quedlinburg', 'de'],
  ['magdeburg', 'Magdeburg', 11.63, 52.13, '', 0, 6, null, 1, 'Archbishop Gisiler of Magdeburg', 'de'],
  ['stendal', 'North March', 11.75, 52.65, '', 0, 3, null, 0, 'Margrave Lothair of Walbeck', 'de'],
  ['merseburg', 'Merseburg', 12.0, 51.4, '', 0, 4, null, 1, 'the Bishop of Merseburg', 'de'],
  ['erfurt', 'Erfurt', 11.03, 50.98, '', 0, 5, null, 0, 'the Reeve of Erfurt', 'de'],
  ['lahngau', 'Lahngau', 8.15, 50.6, '', 1, 3, null, 0, 'the Konradine Counts of the Lahngau', 'de'],
  ['hesse', 'Hesse', 9.4, 51.15, '', 1, 4, null, 0, 'the Konradine Counts of Hesse', 'de'],
  ['meissen', 'Meissen', 13.47, 51.16, '', 1, 5, 'meissen', 1, '', 'de'],
  ['zeitz', 'Zeitz', 12.2, 50.95, '', 0, 4, 'meissen', 0, '', 'de'],
  // ---- Franconia and the Rhine ----
  ['worms', 'Worms', 8.36, 49.63, '', 0, 6, 'carinthia', 1, '', 'de'],
  ['speyer', 'Speyer', 8.43, 49.25, '', 0, 4, 'carinthia', 0, '', 'de'],
  ['mainz', 'Mainz', 8.15, 50.0, '', 0, 8, null, 1, 'Archbishop Willigis of Mainz', 'de'],
  ['frankfurt', 'Frankfurt', 8.75, 50.15, '', 0, 5, null, 0, 'the Royal Reeve of Frankfurt', 'de'],
  ['wurzburg', 'Würzburg', 9.93, 49.79, '', 0, 5, null, 1, 'Bishop Henry of Würzburg', 'de'],
  ['fulda', 'Fulda', 9.68, 50.55, '', 1, 4, null, 0, 'the Abbot of Fulda', 'de'],
  ['trier', 'Trier', 6.64, 49.75, '', 1, 6, null, 1, 'Archbishop Liudolf of Trier', 'de'],
  // ---- Lotharingia ----
  ['aachen', 'Aachen', 6.08, 50.78, '', 0, 7, null, 1, 'Count Palatine Ezzo', 'de'],
  ['cologne', 'Cologne', 6.96, 50.94, '', 0, 8, null, 1, 'Archbishop Heribert of Cologne', 'de'],
  ['liege', 'Liège', 5.57, 50.6, '', 0, 6, null, 1, 'Bishop Notger of Liège', 'de'],
  ['utrecht', 'Utrecht', 5.12, 52.09, '', 0, 5, null, 1, 'Bishop Ansfried of Utrecht', 'de'],
  ['frisia', 'West Frisia', 4.85, 52.65, 'north', 0, 3, null, 0, 'Count Arnulf of West Frisia', 'de'],
  ['nijmegen', 'Nijmegen', 5.86, 51.8, '', 0, 4, null, 1, 'the Royal Reeve of Nijmegen', 'de'],
  ['brussels', 'Brussels', 4.35, 50.85, '', 0, 4, 'lorraine', 1, '', 'de'],
  ['antwerp', 'Antwerp', 4.4, 51.25, 'north', 0, 4, null, 0, 'the Margrave of Antwerp', 'de'],
  ['hainaut', 'Hainaut', 3.9, 50.4, '', 0, 4, null, 1, 'Count Reginar of Hainaut', 'de'],
  ['namur', 'Namur', 4.87, 50.4, '', 1, 4, null, 1, 'Count Albert of Namur', 'de'],
  ['verdun', 'Verdun', 5.38, 49.16, '', 0, 4, null, 1, 'Count Godfrey of Verdun', 'de'],
  ['bar', 'Bar', 5.16, 48.72, '', 0, 4, 'upperlorraine', 1, '', 'de'],
  ['toul', 'Toul', 5.95, 48.6, '', 1, 4, 'upperlorraine', 0, '', 'de'],
  ['metz', 'Metz', 6.18, 49.12, '', 0, 6, null, 1, 'Bishop Adalbero of Metz', 'de'],
  ['luxembourg', 'Luxembourg', 6.13, 49.65, '', 1, 4, null, 1, 'Count Siegfried of Luxembourg', 'de'],
  // ---- Carinthia ----
  ['carinthia', 'Carinthia', 14.3, 46.65, '', 1, 4, 'carinthia', 1, '', 'de'],
  ['styria', 'Carantania', 15.4, 47.15, '', 1, 3, null, 0, 'Markwart of Eppenstein', 'de'],
  ['carniola', 'Carniola', 14.5, 46.0, '', 1, 3, null, 0, 'the Margrave of Carniola', 'de'],
  // ---- Poland ----
  ['gniezno', 'Gniezno', 17.6, 52.53, '', 0, 6, 'poland', 1, '', 'sl'],
  ['poznan', 'Poznań', 16.8, 52.3, '', 0, 5, 'poland', 1, '', 'sl'],
  ['kalisz', 'Kalisz', 18.09, 51.76, '', 0, 4, 'poland', 0, '', 'sl'],
  ['krakow', 'Kraków', 19.94, 50.06, '', 1, 6, 'poland', 1, '', 'sl'],
  ['wroclaw', 'Silesia', 17.03, 51.11, '', 0, 5, 'poland', 0, '', 'sl'],
  ['plock', 'Masovia', 20.0, 52.5, '', 0, 4, null, 0, 'the Masovian lords', 'sl'],
  ['gdansk', 'Gdańsk', 18.5, 54.15, 'baltic', 0, 4, null, 0, 'the Pomeranians of Gdańsk', 'sl'],
  ['kolobrzeg', 'Kołobrzeg', 15.8, 53.9, 'baltic', 0, 3, null, 0, 'Bishop Reinbern of Kołobrzeg', 'sl'],
  ['wolin', 'Wolin', 14.6, 53.6, 'baltic', 0, 4, null, 1, 'the Pomeranians of Wolin', 'sl'],
  ['lubusz', 'Lubusz', 14.9, 52.45, '', 0, 3, null, 0, 'the Lubusz lords', 'sl'],
  ['sandomierz', 'Sandomierz', 20.6, 50.8, '', 0, 4, null, 1, 'the Castellan of Sandomierz', 'sl'],
  ['glogow', 'Głogów', 15.95, 51.65, '', 0, 3, null, 1, 'the Castellan of Głogów', 'sl'],
  ['moravia', 'Moravia', 17.1, 49.4, '', 1, 4, null, 1, 'the Moravian lords', 'sl'],
  // ---- Bohemia ----
  ['prague', 'Prague', 14.42, 50.08, '', 0, 6, 'bohemia', 1, '', 'sl'],
  ['kourim', 'Kouřim', 15.4, 49.95, '', 0, 4, 'bohemia', 0, '', 'sl'],
  ['zatec', 'Žatec', 13.55, 50.38, '', 1, 4, 'bohemia', 0, '', 'sl'],
  ['plzen', 'Plzeň', 13.38, 49.7, '', 1, 3, 'bohemia', 0, '', 'sl'],
  ['doudleby', 'Doudleby', 14.45, 49.0, '', 1, 3, null, 0, 'the Doudlebi', 'sl'],
  // ---- the lands across the Elbe ----
  ['brandenburg', 'Brandenburg', 12.6, 52.4, '', 0, 4, null, 1, 'the Hevelli', 'sl'],
  ['havelberg', 'Havelberg', 12.3, 53.0, '', 0, 3, null, 0, 'the Liutizi of Havelberg', 'sl'],
  ['rethra', 'Rethra', 13.3, 53.5, '', 0, 3, null, 1, 'the Liutizi of Rethra', 'sl'],
  ['obodrites', 'Mecklenburg', 11.4, 53.8, 'baltic', 0, 4, null, 1, 'the Obodrite princes', 'sl'],
  ['rugen', 'Rügen', 13.4, 54.45, 'baltic', 0, 3, null, 0, 'the Rani of Arkona', 'sl'],
  ['lusatia', 'Bautzen', 14.43, 51.18, '', 1, 3, null, 0, 'the Milzeni', 'sl'],
  ['lausitz', 'Lower Lusatia', 13.9, 51.75, '', 0, 3, null, 0, 'the Lusici', 'sl'],
  // ---- the kingdom of Italy ----
  ['pavia', 'Pavia', 9.1, 45.0, '', 0, 8, 'ivrea', 1, '', 'it'],
  ['ivrea', 'Ivrea', 7.88, 45.47, '', 1, 4, 'ivrea', 1, '', 'it'],
  ['turin', 'Turin', 7.55, 44.95, '', 1, 5, null, 1, 'Margrave Olderic Manfred of Turin', 'it'],
  ['milan', 'Milan', 9.19, 45.6, '', 0, 8, null, 1, 'Archbishop Arnulf of Milan', 'it'],
  ['vercelli', 'Vercelli', 8.42, 45.32, '', 0, 4, null, 0, 'Bishop Leo of Vercelli', 'it'],
  ['genoa', 'Genoa', 8.95, 44.5, 'tyrrhenian', 1, 5, null, 1, 'the Viscounts of Genoa', 'it'],
  ['brescia', 'Brescia', 10.21, 45.6, '', 1, 5, 'canossa', 0, '', 'it'],
  ['mantua', 'Mantua', 10.79, 45.16, '', 0, 5, 'canossa', 0, '', 'it'],
  ['canossa', 'Canossa', 10.45, 44.6, '', 1, 4, 'canossa', 1, '', 'it'],
  ['modena', 'Modena', 10.95, 44.62, '', 0, 4, 'canossa', 0, '', 'it'],
  ['ferrara', 'Ferrara', 11.62, 44.84, '', 0, 4, 'canossa', 0, '', 'it'],
  ['verona', 'Verona', 11.0, 45.5, '', 0, 6, 'carinthia', 1, '', 'it'],
  ['trento', 'Trent', 11.12, 46.07, '', 1, 3, null, 0, 'Bishop Ulrich of Trent', 'it'],
  ['belluno', 'Belluno', 12.2, 46.2, '', 1, 3, null, 0, 'the Bishop of Belluno', 'it'],
  ['aquileia', 'Aquileia', 13.3, 45.95, '', 0, 5, null, 1, 'Patriarch John of Aquileia', 'it'],
  ['venice', 'Venice', 12.2, 45.55, 'adriatic', 0, 7, null, 1, 'Doge Pietro Orseolo', 'it'],
  ['ravenna', 'Ravenna', 12.1, 44.4, 'adriatic', 0, 6, null, 1, 'Archbishop Frederick of Ravenna', 'it'],
  ['bologna', 'Bologna', 11.34, 44.45, '', 1, 5, null, 0, 'the Bishop of Bologna', 'it'],
  ['lucca', 'Lucca', 10.55, 43.9, '', 0, 6, null, 1, 'the Tuscan lords', 'it'],
  ['pisa', 'Pisa', 10.6, 43.45, 'tyrrhenian', 0, 5, null, 0, 'the Viscounts of Pisa', 'it'],
  ['florence', 'Florence', 11.25, 43.77, '', 0, 5, null, 0, 'the Bishop of Florence', 'it'],
  ['siena', 'Siena', 11.4, 43.2, '', 1, 4, null, 0, 'the Counts of Siena', 'it'],
  ['spoleto', 'Spoleto', 12.73, 42.8, '', 1, 5, null, 1, 'the Duke of Spoleto', 'it'],
  ['ancona', 'Ancona', 13.3, 43.45, 'adriatic', 1, 4, null, 0, 'the Counts of the Pentapolis', 'it'],
  ['chieti', 'Chieti', 14.05, 42.3, 'adriatic', 1, 4, null, 0, 'the Counts of Chieti', 'it'],
  ['viterbo', 'Tuscia', 11.95, 42.45, 'tyrrhenian', 0, 4, null, 0, 'the Counts of Tuscia', 'it'],
  ['rome', 'Rome', 12.5, 41.9, 'tyrrhenian', 0, 8, 'crescentii', 1, '', 'it'],
  ['sabina', 'Sabina', 12.85, 42.3, '', 1, 4, 'crescentii', 0, '', 'it'],
  ['tusculum', 'Tusculum', 13.15, 41.65, '', 1, 4, null, 1, 'Count Gregory of Tusculum', 'it'],
  // ---- the Lombard south ----
  ['benevento', 'Benevento', 14.78, 41.13, '', 1, 6, 'benevento', 1, '', 'lo'],
  ['capua', 'Capua', 14.15, 41.2, '', 0, 5, 'benevento', 1, '', 'lo'],
  ['salerno', 'Salerno', 14.85, 40.72, 'tyrrhenian', 0, 6, 'salerno', 1, '', 'lo'],
  ['naples', 'Naples', 14.3, 40.88, 'tyrrhenian', 0, 7, null, 1, 'the Duke of Naples', 'lo'],
  ['gaeta', 'Gaeta', 13.5, 41.35, 'tyrrhenian', 1, 4, null, 1, 'the Duke of Gaeta', 'lo'],
  ['montecassino', 'Monte Cassino', 13.85, 41.62, '', 1, 4, null, 0, 'the Abbot of Monte Cassino', 'lo'],
  ['molise', 'Molise', 14.6, 41.65, '', 1, 3, null, 0, 'the Counts of Molise', 'lo'],
  ['potenza', 'Lucania', 15.75, 40.55, '', 1, 3, 'salerno', 0, '', 'lo'],
  // ---- Byzantine Italy ----
  ['bari', 'Bari', 16.75, 41.05, 'adriatic', 0, 7, 'byzantium', 1, '', 'gr'],
  ['trani', 'Trani', 16.2, 41.2, 'adriatic', 0, 5, 'byzantium', 0, '', 'gr'],
  ['lucera', 'Capitanata', 15.45, 41.5, 'adriatic', 0, 4, 'byzantium', 1, '', 'gr'],
  ['matera', 'Matera', 16.45, 40.6, '', 1, 3, 'byzantium', 0, '', 'gr'],
  ['taranto', 'Taranto', 17.15, 40.6, 'ionian', 0, 5, 'byzantium', 1, '', 'gr'],
  ['otranto', 'Otranto', 18.15, 40.25, 'adriatic,ionian', 0, 4, 'byzantium', 0, '', 'gr'],
  ['cosenza', 'Cosenza', 16.2, 39.45, 'tyrrhenian', 1, 4, 'byzantium', 0, '', 'gr'],
  ['crotone', 'Crotone', 16.95, 39.15, 'ionian', 1, 3, 'byzantium', 0, '', 'gr'],
  ['reggio', 'Reggio', 16.0, 38.35, 'tyrrhenian,ionian', 1, 4, 'byzantium', 1, '', 'gr'],
];
const REGION_NAME = { de: 'the kingdom of the Germans', sl: 'the Slav lands', it: 'the kingdom of Italy', lo: 'the Lombard south', gr: 'Byzantine Italy' };
// crossings by sea, as on a board game: an army marches or strikes along them as if the two counties touched
const SEA_ROUTES = [['rugen', 'rethra'], ['rugen', 'wolin'], ['venice', 'ancona'], ['ancona', 'bari'], ['genoa', 'pisa']];
// lands beyond the Empire: drawn and named, never played
const EDGES = [
  ['franks', 'Kingdom of the Franks', 3.4, 48.6], ['flanders', 'County of Flanders', 3.0, 51.0], ['burgundy', 'Kingdom of Burgundy', 6.0, 46.6], ['provence', 'Kingdom of Burgundy', 6.6, 44.2],
  ['denmark', 'Kingdom of Denmark', 9.4, 55.45], ['zealand', 'Kingdom of Denmark', 11.8, 55.5], ['prussia', 'The Prussians', 20.7, 54.3], ['yotvingia', 'The Yotvingians', 21.3, 53.3],
  ['rus', 'The Land of the Rus', 21.2, 50.4], ['nitra', 'Nitra', 18.4, 48.5], ['hungary', 'Kingdom of Hungary', 19.3, 47.3], ['pannonia', 'Kingdom of Hungary', 17.0, 47.4],
  ['croatia', 'Kingdom of Croatia', 15.6, 45.15], ['dalmatia', 'Byzantine Dalmatia', 16.9, 43.4], ['dyrrachium', 'Theme of Dyrrachium', 20.0, 41.6],
  ['sicily', 'Emirate of Sicily', 14.0, 37.5], ['messina', 'Emirate of Sicily', 15.1, 37.85], ['sardinia', 'Sardinia', 9.0, 40.0], ['corsica', 'Corsica', 9.1, 42.15],
];
const SEA_LABELS = [['The German Sea', 6.2, 54.6], ['The Baltic', 16.5, 55.2], ['The Adriatic', 15.4, 43.2], ['The Tyrrhenian Sea', 11.7, 40.4], ['Ionian Sea', 18.4, 38.6], ['Ligurian Sea', 8.6, 43.5]];

// ================= CAPTAINS =================
const GENERALS = [
  { id: 'gunzelin', n: 'Gunzelin of Meissen', d: "Eckard's brother and Bolesław's half-brother: a man with friends on both banks of the Elbe.", c: 55, def: .15, foot: .2 },
  { id: 'schweinfurt', n: 'Henry of Schweinfurt', d: 'Margrave of the Nordgau, who expects to be made Duke of Bavaria for his help.', c: 60, cav: .3, atk: .05 },
  { id: 'bernward', n: 'Bernward of Hildesheim', d: "Otto III's tutor, a bishop who builds walls and casts bronze doors.", c: 60, def: .2, siege: 1 },
  { id: 'ezzo', n: 'Ezzo the Palatine', d: "Otto III's brother-in-law and master of the palaces on the Rhine.", c: 60, atk: .12, morale: .08 },
  { id: 'godfrey', n: 'Godfrey of Verdun', d: 'Son of Godfrey the Captive, a hard Lotharingian count.', c: 55, cav: .3 },
  { id: 'leo', n: 'Leo of Vercelli', d: 'A bishop who hates Arduin more than he fears God.', c: 55, def: .15, morale: .1 },
  { id: 'boniface', n: 'Boniface of Canossa', d: "Tedald's son, young and grasping, who will one day hold half of Italy.", c: 60, atk: .12, cav: .2 },
  { id: 'melus', n: 'Melus of Bari', d: 'A Lombard noble of Bari who dreams of throwing the Greeks out of Apulia.', c: 55, foot: .3, atk: .05 },
  { id: 'bruno', n: 'Bruno of Querfurt', d: 'A missionary bishop who rides with armies into the pagan lands.', c: 50, morale: .15, def: .05 },
  { id: 'sobeslav', n: 'Soběslav Slavník', d: 'Last of the Slavník princes, sworn enemy of the dukes of Prague, now serving Bolesław.', c: 55, atk: .15 },
  { id: 'hammerstein', n: 'Otto of Hammerstein', d: 'A Rhineland count who defies bishops and kings from his rock above the river.', c: 55, def: .2, bow: .2 },
  { id: 'orseolo', n: 'Otto Orseolo', d: "The Doge's son, captain of the Venetian galleys.", c: 55, bow: .4 },
  { id: 'adalbero', n: 'Adalbero of Eppenstein', d: 'A Carinthian lord with a hard fist and a long memory.', c: 55, foot: .25, morale: .05 },
];
const LADIES = ['Kunigunde', 'Gisela', 'Mathilde', 'Adelheid', 'Sophia', 'Theophanu', 'Emnilda', 'Richeza', 'Oda', 'Hemma', 'Imiza', 'Willa', 'Gerberga', 'Bertha', 'Beatrice', 'Gaitelgrima', 'Theodora', 'Hedwig', 'Swanhild', 'Liutgard'];

// ================= COASTS =================
const MAIN = [[1.5, 50.95], [1.9, 51.0], [2.4, 51.05], [2.9, 51.23], [3.5, 51.4], [3.9, 51.55], [4.0, 51.95], [4.3, 52.15], [4.55, 52.45], [4.75, 52.95], [5.1, 53.05], [5.4, 53.35], [6.2, 53.45], [7.0, 53.65], [7.6, 53.7], [8.1, 53.55], [8.3, 53.6], [8.55, 53.55], [8.6, 53.9], [8.9, 54.05], [8.85, 54.3], [8.6, 54.35], [8.85, 54.6], [8.6, 54.9], [8.35, 55.05], [8.6, 55.4], [8.15, 55.6], [8.1, 56.6], [10.3, 56.6], [10.25, 56.2], [10.0, 55.95], [9.85, 55.75], [9.6, 55.7], [9.5, 55.5], [9.55, 55.25], [9.45, 55.05], [9.45, 54.8], [9.9, 54.75], [10.0, 54.6], [10.2, 54.42], [10.65, 54.3], [11.05, 54.38], [11.1, 54.2], [10.85, 54.0], [11.2, 53.95], [11.5, 54.0], [12.1, 54.18], [12.45, 54.4], [12.9, 54.42], [13.1, 54.3], [13.4, 54.18], [13.75, 54.15], [14.0, 53.98], [14.25, 53.92], [14.6, 53.97], [15.0, 54.07], [15.6, 54.18], [16.2, 54.32], [16.5, 54.5], [17.0, 54.67], [17.6, 54.78], [18.3, 54.83], [18.45, 54.65], [18.6, 54.5], [18.65, 54.38], [19.0, 54.35], [19.6, 54.45], [19.9, 54.6], [20.0, 54.95], [20.6, 54.95], [21.2, 55.2], [22.5, 55.2],
  [22.5, 40.8], [19.45, 40.8], [19.45, 41.3], [19.6, 41.6], [19.45, 41.85], [19.1, 42.05], [18.75, 42.3], [18.5, 42.45], [18.1, 42.62], [17.6, 42.95], [17.1, 43.2], [16.45, 43.5], [16.0, 43.5], [15.65, 43.85], [15.2, 44.1], [14.9, 44.6], [14.6, 45.05], [14.3, 45.32], [14.15, 45.05], [13.9, 44.85], [13.6, 45.15], [13.75, 45.6], [13.55, 45.75], [13.2, 45.72], [12.75, 45.55], [12.4, 45.42], [12.3, 45.2], [12.45, 44.95], [12.3, 44.6], [12.35, 44.3], [12.6, 44.05], [13.0, 43.82], [13.6, 43.6], [13.85, 43.1], [14.15, 42.55], [14.65, 42.15], [15.1, 41.95], [15.6, 41.92], [16.15, 41.9], [16.05, 41.7], [15.9, 41.55], [16.5, 41.3], [16.9, 41.13], [17.5, 40.85], [17.95, 40.65], [18.5, 40.15], [18.4, 39.8], [18.0, 40.05], [17.7, 40.3], [17.2, 40.45], [16.85, 40.4], [16.6, 40.1], [16.55, 39.7], [17.0, 39.4], [17.15, 39.0], [16.6, 38.75], [16.55, 38.4], [16.1, 38.0], [15.65, 37.93], [15.65, 38.25], [15.85, 38.6], [16.15, 38.75], [16.05, 39.15], [15.85, 39.55], [15.75, 39.9], [15.6, 40.07], [15.3, 40.03], [14.98, 40.35], [14.75, 40.65], [14.45, 40.6], [14.3, 40.8], [14.05, 40.82], [13.75, 41.1], [13.55, 41.21], [13.05, 41.25], [12.6, 41.45], [12.25, 41.75], [11.85, 42.05], [11.45, 42.35], [11.1, 42.55], [10.75, 42.85], [10.55, 42.95], [10.5, 43.25], [10.3, 43.55], [10.25, 43.85], [9.85, 44.08], [9.35, 44.3], [8.93, 44.41], [8.5, 44.3], [8.15, 43.95], [7.5, 43.8], [7.0, 43.55], [6.6, 43.15], [5.95, 43.1], [5.35, 43.3], [4.85, 43.38], [4.4, 43.45], [3.9, 43.55], [3.4, 43.3], [3.05, 43.05], [1.5, 43.0]];
const SICILY = [[12.4, 37.8], [12.55, 38.1], [13.1, 38.2], [13.4, 38.1], [14.0, 38.02], [14.6, 38.07], [15.1, 38.15], [15.55, 38.28], [15.4, 37.95], [15.25, 37.6], [15.1, 37.3], [15.3, 37.05], [15.1, 36.68], [14.5, 36.78], [14.1, 37.05], [13.5, 37.2], [12.9, 37.55], [12.6, 37.65]];
const SARDINIA = [[8.4, 39.1], [8.2, 40.0], [8.4, 40.6], [8.2, 40.9], [8.8, 41.2], [9.2, 41.25], [9.6, 40.9], [9.8, 40.4], [9.65, 39.5], [9.5, 39.15], [9.0, 39.0], [8.6, 38.9]];
const CORSICA = [[8.55, 42.4], [8.7, 42.7], [9.3, 43.0], [9.45, 42.7], [9.55, 42.15], [9.4, 41.6], [9.2, 41.37], [8.8, 41.6], [8.6, 41.95]];
const FUNEN = [[9.75, 55.5], [10.15, 55.6], [10.75, 55.45], [10.85, 55.15], [10.6, 54.95], [10.1, 55.05], [9.8, 55.2]];
const ZEALAND = [[11.1, 55.7], [11.75, 55.95], [12.6, 56.0], [12.6, 55.65], [12.4, 55.25], [12.05, 54.95], [11.55, 55.1], [11.2, 55.25]];
const LOLLAND = [[11.0, 54.75], [11.9, 54.65], [11.75, 54.95], [11.1, 54.95]];
const RUGEN = [[13.1, 54.45], [13.25, 54.65], [13.55, 54.65], [13.7, 54.4], [13.5, 54.3], [13.25, 54.32]];
const SEA = [[-10, 30], [30, 30], [30, 60], [-10, 60]];

return {
  id: 'empire', FACTIONS, PROV, REGION_NAME, SEA_ROUTES, EDGES, SEA_LABELS, GENERALS, LADIES,
  name: 'The Empire, 1002', sub: 'Germany, Italy and the Slav lands', game: 'The Crown of the Germans',
  geo: { LON0: 2.0, LAT1: 56.0, SX: 49, SY: 70, MW: 965, MH: 1370, lands: [MAIN, SICILY, SARDINIA, CORSICA, FUNEN, ZEALAND, LOLLAND, RUGEN], seas: [SEA], isles: [] },
  realm: 'Germany', foreignTxt: 'German lords resent foreign rule', foreignAsk: 'German lords ask double of foreigners',
  kingdom: { regions: ['de'], core: 'de', n: 'the Germans', short: 'Germany', keys: ['mainz'], at: 'Mainz' },
  date: { y0: 1002, s0: 3, yOff: 0, roman: 'MII' },
  truce: 3,
  peace: { Name: "The Emperor's Mourning", name: 'the mourning for Otto', ends: 'Otto is buried at Aachen beside Charlemagne and the mourning is over. The great houses may now make war on each other.', breakTxt: 'This attack breaks the mourning for the emperor.' },
  short: { upperlorraine: 'Upper Lorraine', lorraine: 'Lower Lorraine', carinthia: 'Carinthia', byzantium: 'Byzantium', crescentii: 'Rome' },
  crown: {
    title: 'King of the Germans', of: 'of the Germans', the: 'the crown of the Germans', people: 'the Germans', latin: 'REX TEUTONICORUM', regnum: 'Regnum Teutonicorum', rex: 'Rex Teutonicorum',
    anointed: 'anointed at Mainz', at: 'Mainz', rite: 'At Mainz Archbishop Willigis anoints', start: null,
    needs: (fid, great) => great ? ['mainz'] : ['mainz', 'aachen'],
    why: { mainz: 'Mainz, where Archbishop Willigis anoints kings.', aachen: "Aachen, where Charlemagne's stone throne waits for a king." },
    coronation: "Kings of the Germans are anointed at Mainz and take their seat on Charlemagne's throne at Aachen.",
    rule: () => `A king is anointed at Mainz and enthroned at Aachen: hold Mainz and Aachen and at least ${CROWN_LANDS} counties of the German kingdom, and pay ${CROWN_COST} d. A prince with ${CROWN_GREAT} counties of the kingdom needs only Mainz.`,
    take: 'Take Mainz and Aachen and it can be yours.',
    won: fid => `At Mainz, before the bishops and princes of the kingdom, Archbishop Willigis anoints ${FAC(fid).pname} King of the Germans.`,
    wonAll: fid => `At Mainz the archbishop anoints ${FAC(fid).pname}, and there is no prince left from the Rhine to the Oder to stand against him.`,
    endWon: n => `${n} kneels before the altar at Mainz. Archbishop Willigis anoints him, and at Aachen he takes his seat on Charlemagne's throne while the princes shout their assent.`,
    endAll: n => `At Mainz the archbishop anoints ${n}, and from the Baltic to the Alps no prince stands against him.`,
    span: 'From the Baltic to the Alps', crowned: 'anointed at Mainz',
    rules: 'The empty throne is filled, and the kingdom of the Germans has one master again.',
  },
  founder: 'Charlemagne',
  // the map is wide and the houses far apart, so the princes league sooner against a runaway house
  league: 0.22,
  pnames: ['Conrad', 'Otto', 'Henry', 'Bruno', 'Liudolf', 'Ekkehard', 'Dietrich', 'Gero', 'Hermann', 'Udo', 'Adalbert', 'Wichmann', 'Berengar', 'Lambert', 'Ulrich'],
  houseOf: f => f.houseTxt,
  groups: [['The German princes', ['bavaria', 'swabia', 'saxony', 'meissen', 'carinthia']], ['Lotharingia', ['lorraine', 'upperlorraine']], ['The Slavs', ['poland', 'bohemia']], ['Italy', ['ivrea', 'canossa', 'crescentii']], ['The Lombard south', ['benevento', 'salerno']]],
  where: fid => ({ Germany: 'The throne is empty and Mainz is close. Every prince of the kingdom can reach for it, and every one of them knows it.', Poland: 'The Elbe marches are open, and the German princes are busy with each other. Push west.', Bohemia: 'The mountains guard you on every side. Your own nobles are the danger.', Italy: 'The Alps lie between you and Mainz. Make Italy yours first, then cross them.', Lombardy: 'The crown is very far away. The Greeks are close, and the Saracens closer.' })[FACMAP[fid].realm] || '',
  intro: {
    get note() { return `Otto III is dead at twenty-one, in a castle north of Rome, without a son. Henry of Bavaria met the funeral train in the Alps and took the regalia; Eckard of Meissen and Hermann of Swabia claim the throne as well. The bishops keep the mourning for the emperor until ${dateStr(TRUCE)}.`; },
    lead: 'Otto III is dead without a son, and the throne of the Germans stands empty. Henry of Bavaria has the regalia, Eckard of Meissen has the Saxons, Hermann of Swabia has the Rhine. Bolesław of Poland is marching west, Arduin has crowned himself King of Italy, and in the south the Greeks of Bari watch. Who will be anointed at Mainz?',
    splash: (fid, d, cap) => `<p>Otto III is dead, and the throne is empty. At ${cap}, ${d.pname} raises the banner of ${d.name}.</p>
    <p>${fid === 'bavaria' ? 'You have the regalia. Take Mainz and Aachen, and the bishops will anoint you.' : fid === 'meissen' ? 'The Saxons want you. Live long enough to reach Mainz.' : fid === 'swabia' ? 'The Rhine princes are with you. Take Mainz before Henry does.' : fid === 'poland' ? 'Otto called you brother. With him gone, the marches of the Elbe are yours for the taking, and perhaps more.' : FACMAP[fid].realm === 'Italy' ? 'Italy is yours to fight for. The German crown lies over the Alps.' : FACMAP[fid].realm === 'Lombardy' ? 'The Greeks hold the south-east, the Saracens raid every coast, and the crown is a month\'s ride away.' : 'The princes are divided. Take what you can, and perhaps the crown itself.'}</p>`,
  },
  help: {
    top: '<p><b>The Empire in 1002.</b> Otto III is dead without a son, and the throne of the Germans is empty. The princes of the kingdom, the Slav dukes, the lords of Italy and the Lombard princes of the south all take what they can. Fourteen houses, from Holstein to Salerno, and the Greeks at Bari.</p>',
    sea: '<p><b>Sea crossings.</b> Dotted lines on the map join counties across the water: Rügen to the shore, and the sea lanes of the Adriatic and the Ligurian coast. An army marches or strikes along one as if the two counties touched. Only the counties of the German kingdom count toward the crown.</p>',
    rich: 'The rich land is along the Rhine and in the cities of Lombardy.',
    peace: () => `<p><b>The emperor's mourning.</b> For the first ${TRUCE} turns, while Otto is carried home to Aachen, the bishops forbid war between the great houses. Break the peace and you are excommunicated.</p>`,
    powers: `<p><b>Beyond the Empire.</b> The hatched lands at the edge of the map are not for conquest.</p>
      <p><b>Byzantium.</b> The Emperor Basil's catepan holds Bari and the south-east with strong garrisons. Constantinople mostly leaves Italy alone. Attack the Greeks, or grow too strong in the south, and the imperial fleet lands an army.</p>
      <p><b>The Saracens.</b> From the second year, the emir of Sicily's ships raid the coasts of southern Italy. Pay tribute to send them away, or fight.</p>
      <p><b>Events.</b> Some things happened in 1002: Henry seizing the regalia, the murder of Eckard at Pöhlde, Bolesław's march west, Hermann's sack of Strasbourg, and the revolt in Prague. The game follows them loosely.</p>`,
  },
  fair: { at: 'Pavia', name: 'the great market at Pavia', title: 'The market at Pavia', who: 'Merchants from Venice, Amalfi and beyond the Alps fill the market at Pavia, where the kings of Italy take their toll.', lord: 'a Lombard merchant', open: 'The summer market at Pavia is open' },
  free: [],
  rome: 'rome',
  challenges: [
    { id: 'lance', n: 'The Holy Lance', house: 'bavaria', diff: 'hard', d: 'Henry of Bavaria against Hard rivals.' },
    { id: 'chrobry', n: 'The Brave', house: 'poland', diff: 'original', d: 'Bolesław, with the whole kingdom between you and Mainz.' },
    { id: 'ironcrown', n: 'The Iron Crown', house: 'ivrea', diff: 'original', mod: { gold: 150 }, d: 'Arduin: hold Italy, then cross the Alps.' },
    { id: 'pohlde', n: 'Pöhlde', house: 'meissen', diff: 'original', d: 'Meissen, whose margrave may not live out the spring.' },
    { id: 'strasbourg', n: 'The Sack of Strasbourg', house: 'swabia', diff: 'gentle', d: 'Hermann of Swabia against Gentle rivals.' },
    { id: 'southwind', n: 'The South Wind', house: 'salerno', diff: 'original', mod: { gold: 200 }, d: 'Salerno, as far from Mainz as a prince can be.' },
  ],
  art: {
    // the siege screen: a grand castle behind Aachen and Rome, a cathedral behind the great sees
    grand: ['aachen', 'rome'], cathedrals: ['mainz', 'cologne', 'trier', 'magdeburg', 'salzburg', 'hildesheim', 'regensburg', 'worms', 'speyer', 'strasbourg', 'metz', 'liege', 'bremen', 'milan', 'ravenna', 'rome', 'aquileia', 'gniezno', 'bamberg'],
    mountains: ['brixen', 'chur', 'carinthia', 'carniola', 'styria', 'salzburg', 'trento', 'ivrea', 'turin', 'spoleto', 'zurich', 'burgundy', 'cosenza', 'molise', 'zatec', 'krakow'],
    woods: ['hesse', 'fulda', 'nordgau', 'paderborn', 'luxembourg', 'toul', 'breisgau', 'havelberg', 'rethra', 'lubusz', 'lausitz', 'brandenburg', 'kourim', 'plzen', 'kalisz', 'franks', 'pannonia', 'rus', 'prussia', 'siena', 'viterbo', 'potenza', 'montecassino'],
    rivers: [
      ['Rhine', [[9.5, 47.6], [8.6, 47.65], [7.6, 47.6], [7.6, 48.2], [7.9, 48.9], [8.4, 49.4], [8.3, 50.0], [7.7, 50.2], [7.4, 50.5], [6.96, 50.94], [6.6, 51.5], [6.1, 51.85], [5.5, 51.9], [4.6, 51.9]]],
      ['Danube', [[8.5, 47.95], [9.5, 48.1], [10.0, 48.4], [11.4, 48.75], [12.1, 49.02], [13.0, 48.8], [13.46, 48.57], [14.3, 48.3], [15.6, 48.35], [16.4, 48.2], [17.1, 48.1], [18.8, 47.8], [19.0, 47.3]]],
      ['Elbe', [[15.6, 50.2], [14.4, 50.4], [14.0, 50.8], [13.47, 51.16], [12.8, 51.6], [11.8, 51.9], [11.63, 52.13], [11.9, 52.6], [11.4, 53.1], [10.5, 53.4], [9.8, 53.55], [8.9, 53.85]]],
      ['Weser', [[9.7, 51.4], [9.4, 51.7], [9.2, 52.1], [9.1, 52.6], [8.8, 53.08], [8.5, 53.5]]],
      ['Oder', [[17.9, 50.0], [17.6, 50.7], [17.03, 51.11], [16.1, 51.6], [15.3, 51.9], [14.6, 52.4], [14.3, 53.0], [14.5, 53.6]]],
      ['Vistula', [[19.0, 49.9], [19.94, 50.06], [21.0, 50.6], [21.3, 51.4], [20.6, 52.4], [19.7, 52.6], [18.6, 53.1], [18.8, 53.9], [18.95, 54.35]]],
      ['Main', [[11.6, 50.1], [10.89, 49.89], [10.2, 50.05], [9.93, 49.79], [9.3, 49.8], [8.9, 50.1], [8.3, 50.0]]],
      ['Moselle', [[6.4, 48.0], [6.18, 49.12], [6.4, 49.5], [6.64, 49.75], [7.1, 50.0], [7.6, 50.35]]],
      ['Meuse', [[5.5, 48.2], [5.38, 49.16], [4.8, 49.8], [4.87, 50.47], [5.57, 50.63], [5.8, 51.2], [5.85, 51.7], [5.0, 51.8], [4.2, 51.85]]],
      ['Saale', [[11.9, 50.3], [11.6, 50.9], [12.0, 51.4], [11.8, 51.8]]],
      ['Vltava', [[14.0, 48.8], [14.4, 49.4], [14.42, 50.08], [14.45, 50.35]]],
      ['Po', [[7.55, 44.75], [8.4, 45.05], [9.16, 45.15], [10.0, 45.05], [10.79, 45.05], [11.62, 44.95], [12.3, 44.95]]],
      ['Adige', [[11.12, 46.4], [11.12, 46.07], [11.0, 45.5], [11.6, 45.2], [12.25, 45.15]]],
      ['Tiber', [[12.0, 43.6], [12.4, 43.0], [12.5, 42.4], [12.5, 41.9], [12.25, 41.75]]],
      ['Arno', [[11.8, 43.7], [11.25, 43.77], [10.8, 43.7], [10.3, 43.68]]],
      ['Inn', [[10.0, 46.6], [11.4, 47.25], [12.2, 47.8], [13.46, 48.57]]],
    ],
    // the Holy Lance on Henry's red, and a gold eagle on imperial purple
    pennants: {
      l: { bg: '#a3222c', motif: '<path d="M27,14 L33,36 L29,40 L29,118 L25,118 L25,40 L21,36 Z" fill="#e2b33c" stroke="#7a5a10" stroke-width="1.2"/><path d="M22,48 h10 v4 h-10z" fill="#e9ddbc"/><circle cx="27" cy="27" r="2" fill="#2a1d12"/>' },
      r: { bg: '#4a2a6a', motif: '<path d="M27,40 C22,40 20,46 22,52 L8,46 L12,58 L22,60 L18,78 L24,72 L27,84 L30,72 L36,78 L32,60 L42,58 L46,46 L32,52 C34,46 32,40 27,40 Z" fill="#e2b33c" stroke="#7a5a10" stroke-width="1.2"/><circle cx="27" cy="45" r="1.5" fill="#2a1d12"/>' },
    },
    ships: [[6.2, 54.0, 0.9], [11.0, 41.2, 1.0], [17.6, 42.3, 0.9, true]], serpent: [4.6, 54.2, 1.0], rose: [4.5, 38.6], cart: [18.8, 37.6],
  },
  setup: {
    houses() {
      // the Greeks keep Apulia with strong garrisons; the catepan's own host is small, for now
      for (const p of provList()) if (p.owner === 'byzantium') { p.gar.foot += 6; p.gar.bow += 3; p.gar.cav += 1; }
      Object.assign(P('bari').gar, { foot: 16, bow: 6, cav: 4 });
      // the counts and bishops of Lotharingia and Saxony have kept their own castles since Charlemagne's grandsons
      for (const p of provList()) if (!p.owner && p.r === 'de' && ((p.x < px(7.3) && p.lat > 49.4) || p.lat > 51.3)) { p.gar.foot = Math.round((p.gar.foot || 2) * 1.8) + 3; p.gar.bow = (p.gar.bow || 0) + 2; }
      // the palace of Charlemagne and the see of Cologne are no easy prizes
      Object.assign(P('aachen').gar, { foot: 12, bow: 4, cav: 3 }); Object.assign(P('cologne').gar, { foot: 11, bow: 4, cav: 2 });
      // Henry has the regalia and the Bavarian host; Eckard is the best soldier in Saxony; Bolesław brought his drużyna
      { const A = lordArmy('bavaria'); A.foot += 6; A.cav += 2; G.fac.bavaria.gold += 100; }
      // Otto of Lower Lorraine is no warrior: his host is small
      { const A = lordArmy('lorraine'); A.foot = Math.max(2, A.foot - 2); }
      { const A = lordArmy('meissen'); A.foot += 6; A.cav += 2; }
      { const A = lordArmy('poland'); A.foot += 2; }
    },
    after() {
      const pact = (a, b, n) => G.truces.push({ a, b, until: TRUCE + n, pact: true, treaty: true, pass: true });
      // Otto of Worms stood aside for Henry; Tedald of Canossa is Henry's man in Italy; the Lombard princes are kin
      pact('bavaria', 'carinthia', 8); pact('bavaria', 'canossa', 12); pact('benevento', 'salerno', 8);
    },
  },
  tick() { empireTick(); },
  // Byzantium sits still unless it is provoked: then the imperial fleet comes, and for a while it makes war
  idle: fid => fid === 'byzantium' && !(G.ev.byzWar > G.turn),
  raider: {
    who: 'the Saracens of Sicily', title: 'The emir of Sicily sends his ships, and', tribute: 'tribute', every: 5, from: 4,
    targets: () => provList().filter(p => p.owner && !besiegerOf(p) && p.lat < 42.4 && p.seas.some(s => s === 'tyrrhenian' || s === 'ionian')),
    sack: (p, loot) => `Saracen galleys from Palermo beach below ${p.name}. They storm the walls, burn the churches and sail away with ${loot} d and a crowd of captives for the slave markets. Half the garrison is dead or taken, and the county will pay nothing for three turns.`,
    held: p => `The Saracens land below ${p.name}, find the walls manned and the levies waiting, and row back to Sicily.`,
  },
};
// ---------- the events of 1002 ----------
function empireTick() {
  raiderTick();
  const T = G.turn, E = G.ev, alv = f => G.fac[f] && G.fac[f].alive;
  // Spring 1002: Henry seizes the regalia, and holds Heribert's brother until the Holy Lance is handed over
  if (T === 1 && !E.lance && alv('bavaria')) {
    E.lance = 1; const F = G.fac.bavaria; F.bless = Math.max(F.bless || 0, 4); F.gold += 40;
    tell('bavaria', 'The Holy Lance', "Archbishop Heribert sent the Holy Lance ahead to Cologne, hoping to keep it from you. You hold his brother, the Bishop of Würzburg, until the lance is handed over. With the regalia in your hands, men believe God is with you: your troops fight 12% harder for four turns.");
    if (G.player !== 'bavaria') note('Henry of Bavaria has the regalia of the Empire, and now the Holy Lance as well.');
  }
  // 30 April 1002: Eckard of Meissen is murdered at Pöhlde by Saxon counts he had wronged
  if (T === 1 && !E.pohlde && alv('meissen')) {
    E.pohlde = 1; const d = FAC('meissen'), A = lordArmy('meissen'), k = Math.floor((A.foot || 0) * 0.4);
    A.foot -= k; d.pname = 'Gunzelin of Meissen'; d.ruler = 'Margrave Gunzelin of Meissen';
    tell('meissen', 'Murder at Pöhlde', `Margrave Eckard is cut down at night in the palace at Pöhlde by Saxon counts with old grudges. His brother Gunzelin, half-brother of Bolesław of Poland, takes up the march. ${k} footmen go home with their dead lord.`);
    if (G.player !== 'meissen') note('Eckard of Meissen has been murdered at Pöhlde. His brother Gunzelin holds the march.');
  }
  // Spring 1002: Bolesław marches west and takes the Milzeni and the Lusici
  if (T === 1 && !E.boleslaw && alv('poland')) {
    E.boleslaw = 1; const A = lordArmy('poland'); if (armyUsable('poland', A)) A.foot += 3;
    const took = ['lusatia', 'lausitz'].map(P).filter(p => p && !p.owner && !p.ally);
    for (const p of took) { p.owner = 'poland'; p.gar = { foot: 3, bow: 1, cav: 1, cat: 0 }; p.militia = levyMax(p); }
    tell('poland', 'West to the Elbe', `With Eckard dead, your army crosses into the marches.${took.length ? ` ${took.map(p => p.name).join(' and ')} open their gates to you.` : ''} The Polish host is ready for more.`);
    if (G.player !== 'poland') note(`Bolesław of Poland marches west into the Elbe marches${took.length ? ` and takes ${took.map(p => p.name).join(' and ')}` : ''}.`);
  }
  // Summer 1002: Hermann of Swabia storms Strasbourg, whose bishop backed Henry
  if (T === 2 && !E.strasbourg && alv('swabia')) {
    E.strasbourg = 1; const p = P('strasbourg');
    if (!p.owner && !p.ally) {
      p.owner = 'swabia'; damageWalls(p, 50); p.gar = { foot: 3, bow: 1, cav: 1, cat: 0 }; p.sacked = 2;
      tell('swabia', 'The sack of Strasbourg', "Bishop Werner backed Henry, so your men storm Strasbourg and plunder it. The cathedral burns. The city is yours, though the bishops will not forget it.");
      if (G.player !== 'swabia') note('Hermann of Swabia has stormed and sacked Strasbourg. The cathedral is burned.');
    }
  }
  // Summer 1002: Archbishop Willigis favours Henry, and opens Mainz to him
  if (T === 2 && !E.willigis && alv('bavaria')) {
    E.willigis = 1; const p = P('mainz');
    if (!p.owner && !p.ally) { p.ally = 'bavaria'; tell('bavaria', 'Willigis of Mainz', 'Archbishop Willigis has chosen you. Mainz swears to you as an ally: its gates are open to your armies, and half its revenue is yours. To be anointed there, you must still make it your own.'); if (G.player !== 'bavaria') note('Archbishop Willigis of Mainz has declared for Henry of Bavaria.'); }
  }
  // Summer 1002: the Czech nobles throw out Boleslaus the Red; Vladivoj, Bolesław of Poland's man, takes Prague
  if (T === 2 && !E.prague && alv('bohemia')) {
    E.prague = 1; const d = FAC('bohemia'), A = lordArmy('bohemia'), k = Math.floor((A.foot || 0) * 0.3);
    A.foot -= k; d.pname = 'Vladivoj'; d.ruler = 'Duke Vladivoj of Bohemia';
    if (alv('poland')) G.truces.push({ a: 'bohemia', b: 'poland', until: T + 10, pact: true, treaty: true, pass: true });
    tell('bohemia', 'Revolt in Prague', `The Czech lords have had enough of Boleslaus the Red and drive him out. Vladivoj takes the duke's seat, with Polish backing: peace with Poland for ten turns. ${k} footmen who fought for the old duke are gone.`);
    if (G.player !== 'bohemia') note('Boleslaus the Red has been driven out of Prague. Vladivoj, backed by Poland, rules Bohemia.');
  }
  byzantineWatch();
}
// the Greeks: provoked by an attack on their land, or by a power growing too strong in the south
function byzantineWatch() {
  const T = G.turn, E = G.ev, F = G.fac.byzantium; if (!F || !F.alive) return;
  const held = owned('byzantium').length, south = f => owned(f).filter(p => p.r === 'lo' || p.r === 'gr' || (p.r === 'it' && p.lat < 42.5)).length;
  if (E.byzHeld === undefined) E.byzHeld = held;
  const lost = held < E.byzHeld, besieged = owned('byzantium').some(p => besiegerOf(p));
  const big = alive().find(f => f !== 'byzantium' && south(f) >= 9);
  E.byzHeld = held;
  if (E.byzWar > T || (E.byzNext || 0) > T) return;
  if (!lost && !besieged && !(big && Math.random() < 0.35)) return;
  const A = lordArmy('byzantium'); if (!armyUsable('byzantium', A)) return;
  A.foot += 18; A.bow += 8; A.cav += 8; A.cat += 2; A.gf = (A.gf || 0) + 2;
  E.byzWar = T + 8; E.byzNext = T + 18;
  const why = lost || besieged ? 'an attack on the Greek lands of Apulia' : `the growing power of ${FAC(big).name} in the south`;
  tell(G.player, 'The imperial fleet', `Angered by ${why}, the Emperor Basil sends a fleet to Bari. The catepan marches out with Varangians, Greek horse and pots of Greek fire.`);
}
})();
