'use strict';
// ================= DIFFICULTY =================
// Knobs read by aiWar in ai.js: how eagerly the computer houses turn on the player.
// 'original' is the standard set the AI uses on its own.
const DIFF = {
  gentle: { n: 'Gentle', d: 'The houses fight each other first. They still come for you, but they need the odds well in their favour, and they leave you alone for a year after the Peace of God ends.', pNeed: 0.5, pVal: 0.6, grace: 4, gang: false, pBonus: 0 },
  original: { n: 'Standard', d: 'Every house sees you as one rival among many. The balance of power decides who they strike.', pNeed: 0, pVal: 1, grace: 0, gang: true, pBonus: 2 },
  hard: { n: 'Hard', d: 'The great houses smell weakness. They strike you at longer odds and gang up on you early.', pNeed: -0.25, pVal: 1.4, grace: 0, gang: true, pBonus: 4 },
};
const diff = () => DIFF[(G && G.diff) || 'original'];
