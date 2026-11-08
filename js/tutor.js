'use strict';
// ================= THE GUIDED FIRST CAMPAIGN =================
// One objective at a time, in a small card over the map. A step is done when the player actually does it
// (actions mark G.tut.did); the card then moves on. Any step can be skipped, and the guide can be ended.
const TUT = [
  { id: 'home', t: 'Your seat', b: () => `Tap ${P(homeOf(me())).name}, the province with the crown, to open it.`, done: () => G.sel === 'p:' + homeOf(me()) },
  { id: 'build', t: 'Build', b: () => 'Open the Build tab and start some farms or a market. Buildings pay every turn for the rest of the game.', done: d => d.build },
  { id: 'raise', t: 'Raise an army', b: () => 'Open the Raise tab and put footmen or bowmen into army 1. Men in an army are paid every turn; men in a garrison are free.', done: d => d.raiseA || d.toArmy || d.allArmy },
  { id: 'end', t: 'End the turn', b: () => 'Press End turn. The other houses move, and the map shows what the ones near you did.', done: d => (d.end || 0) >= 1 },
  { id: 'ally', t: 'Win a lesser lord', b: () => 'Tap a neighbouring province with no house colour, open Diplomacy and offer an alliance. You get half its income, and your armies may march through it.', done: d => d.ally || d.court },
  { id: 'church', t: 'The Church', b: () => 'Open the Church and ask the Pope to bless your arms. Raise bishops at a castle later to win more favour in Rome.', done: d => d.pope },
  { id: 'march', t: 'March', b: () => 'Choose a province marked with green dots and tap March here. An army moves two provinces a turn through your own and allied land.', done: d => d.move },
  { id: 'peace', t: 'The Peace of God', b: () => `No war between the great houses until ${dateStr(TRUCE)}. Keep building and raising men, and end turns until then. Lesser lords may be attacked at any time.`, done: () => G.turn >= TRUCE },
  { id: 'war', t: 'To war', b: () => 'Tap a province with a red dashed border and attack it. Against a castle, lay siege first and bombard the walls, then storm.', done: d => d.battle || d.besiege },
  { id: 'goal', t: 'Your goal', b: () => `Open "Your goal" in the realm panel to see how close you are to ${GOALS[goalId()].n.toLowerCase()}.`, done: d => d.goal },
];
function tutorDid(k) { if (G && G.tut) { G.tut.did[k] = (G.tut.did[k] || 0) + 1; } }
function tutorSkip() { if (!G.tut) return; G.tut.i++; sfx('click'); save(); renderTutor(); }
function tutorEnd() { G.tut = null; save(); renderTutor(); toast('Guide closed. How to play is in Settings.', 'info'); }
function renderTutor() {
  let el = $('#tutor');
  const T = G && G.tut;
  if (!T || G.over) { if (el) el.remove(); return; }
  while (T.i < TUT.length && TUT[T.i].done(T.did)) { T.i++; if (T.i > 0) { sfx('coin'); } }
  if (T.i >= TUT.length) { G.tut = null; if (el) el.remove(); report('The guide is done', 'You know the whole of it now: build, raise, ally, march and strike, and use the Church and marriages to win what swords cannot. The rest is yours. How to play, in Settings, has the details.'); return; }
  if (!el) { el = document.createElement('div'); el.id = 'tutor'; $('#mapwrap').appendChild(el); }
  const s = TUT[T.i];
  setHTML(el, `<div class="tn">${T.i + 1}/${TUT.length}</div><div class="tb"><b>${esc(s.t)}</b>${esc(s.b())}</div><div class="tx"><button onclick="tutorSkip()">Skip</button><button onclick="tutorEnd()">End guide</button></div>`);
}
