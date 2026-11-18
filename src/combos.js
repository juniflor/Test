// Chain combos. No imports here, so fighter.js can import it freely.
//
// HOW IT WORKS
//  1. When a move CONNECTS (hit, not blocked) you may cancel it straight into another move
//     (CHAIN below says which ones). Early presses are buffered for 10 frames, so mashing works.
//  2. Every cancel is added to the fighter's `chain`. If the end of the chain matches one of the
//     fighter's combos, the move you just cancelled into becomes the FINISHER: bonus damage,
//     knockback, launch, and the combo name pops up on screen.
//  3. Each move later in a chain does a little less damage (see Fighter.receive) so combos can't be infinite.
//
// Move keys: light/heavy = standing punch/kick, clight/cheavy = crouching (hold DOWN), special.
// Combo fields: seq (move keys, in order), dmg/kb (multipliers), launch (sets launch speed),
// hs (extra hitstun frames), final (no more cancelling out of it).
// Finisher animation fields (see comboFx.js): anim, col, fx, turns, lift, shake, stop.
// Holding DOWN the whole time works: a crouching chain (clight, clight, cheavy) is also read as (clight, clight, heavy)
// and (clight, light, heavy), so crouch combos don't need you to let go of DOWN.

export const MAX_CHAIN = 6;

// Default "what can cancel into what" (every fighter). Fighters can override entries in `chain`.
export const CHAIN = {
  light:  ['light', 'clight', 'heavy', 'special'],
  clight: ['clight', 'light', 'cheavy', 'heavy'],
  heavy:  ['special'],
  cheavy: [], special: [], jlight: [], jheavy: [],
};

// Fighters are looked up by name: lowercase, letters only ("Sam Li" -> "samli").
// Add a new fighter by adding an entry here. Anyone not listed uses `default`.
export const COMBOS = {
  default: { combos: [
    { name: 'TRIPLE THREAT', seq: ['light', 'light', 'heavy'], dmg: 1.3, kb: 1.3, anim: 'rush', col: '#fd5', fx: 'star' },
    { name: 'LOW BLOW', seq: ['clight', 'clight', 'heavy'], dmg: 1.4, launch: 5, final: true, anim: 'slam', col: '#fd5', fx: 'dust' },
    { name: 'FULL COMBO', seq: ['light', 'heavy', 'special'], dmg: 1.5, final: true, anim: 'burst', col: '#fff', fx: 'star', shake: 8 },
  ] },

  junior: { combos: [
    { name: 'JAB JAB KICK', seq: ['light', 'light', 'heavy'], dmg: 1.3, kb: 1.3, anim: 'rush', col: '#3df', fx: 'star' },
    { name: 'JUNIOR RUSH', seq: ['light', 'light', 'light', 'heavy'], dmg: 1.6, launch: 6, final: true, anim: 'flip', col: '#3df', fx: 'star', shake: 7 },
    { name: 'BIG FINISH', seq: ['light', 'heavy', 'special'], dmg: 1.5, final: true, anim: 'burst', col: '#7ff', fx: 'star', stop: 10, shake: 9 },
  ] },

  marty: { combos: [
    { name: 'MARTY MASH', seq: ['light', 'light', 'heavy'], dmg: 1.2, kb: 1.5, anim: 'rush', col: '#f55', fx: 'star' },
    { name: 'LOW & SLOW', seq: ['clight', 'clight', 'heavy'], dmg: 1.4, launch: 5, final: true, anim: 'slam', col: '#f55', fx: 'dust' },
    { name: 'MARTY MAGIC', seq: ['light', 'heavy', 'special'], dmg: 1.6, final: true, anim: 'flip', col: '#c6f', fx: 'star', shake: 8 },
  ] },

  raphy: { combos: [
    { name: 'BELLY BUMP', seq: ['light', 'light', 'heavy'], dmg: 1.2, kb: 1.8, anim: 'slam', col: '#88f', fx: 'dust', shake: 8 },
    { name: 'SUMO STORM', seq: ['light', 'light', 'light', 'heavy'], dmg: 1.5, launch: 6, final: true, anim: 'spin', turns: 2, lift: 6, col: '#88f', fx: 'dust', shake: 8 },
    { name: 'BELLY FLOP FINALE', seq: ['light', 'heavy', 'special'], dmg: 1.7, final: true, anim: 'slam', col: '#88f', fx: 'dust', shake: 12, stop: 10 },
  ] },

  esa: { combos: [
    { name: 'STINK BOMB', seq: ['light', 'light', 'special'], dmg: 1.5, final: true, anim: 'burst', col: '#6d4', fx: 'gas', shake: 5 },
    { name: 'COUGH SYRUP', seq: ['clight', 'light', 'heavy'], dmg: 1.3, kb: 1.4, anim: 'shake', col: '#6d4', fx: 'gas', shake: 4 },
    { name: 'TOXIC TOUCH', seq: ['light', 'heavy', 'special'], dmg: 1.6, final: true, anim: 'spin', turns: 1, col: '#8f4', fx: 'gas', stop: 9, shake: 8 },
  ] },

  sydney: { combos: [
    { name: 'BULLET TRAIN', seq: ['light', 'light', 'special'], dmg: 1.4, final: true, anim: 'rush', col: '#f93', fx: 'star', shake: 6 },
    { name: 'FLARE KICK', seq: ['clight', 'light', 'heavy'], dmg: 1.4, launch: 5, final: true, anim: 'flip', col: '#f93', fx: 'star', shake: 7 },
    { name: 'RAPID FINISH', seq: ['light', 'heavy', 'special'], dmg: 1.5, final: true, anim: 'shake', col: '#f93', fx: 'star', shake: 7 },
  ] },

  // Sam Li can chain kicks into kicks (spinning kick strings).
  samli: { repeat: ['light', 'clight', 'heavy'], chain: { heavy: ['heavy', 'special'] }, combos: [
    { name: 'SPIN CYCLE', seq: ['light', 'heavy', 'heavy'], dmg: 1.3, kb: 1.3, anim: 'spin', turns: 1, col: '#f8f', fx: 'star' },
    { name: 'TORNADO KICK', seq: ['light', 'heavy', 'heavy', 'heavy'], dmg: 1.7, launch: 6, final: true, anim: 'spin', turns: 2, lift: 10, col: '#f8f', fx: 'dust', shake: 9 },
    { name: 'DRAGON SPIN', seq: ['light', 'heavy', 'special'], dmg: 1.5, final: true, anim: 'spin', turns: 2, lift: 6, col: '#f63', fx: 'flame', stop: 9, shake: 10 },
  ] },

  edson: { combos: [
    { name: 'WRESTLE MANIA', seq: ['light', 'light', 'heavy'], dmg: 1.3, kb: 1.4, anim: 'slam', col: '#fd5', fx: 'star', shake: 8 },
    { name: 'TAKEDOWN', seq: ['clight', 'clight', 'heavy'], dmg: 1.3, launch: 4, final: true, anim: 'slam', col: '#bbb', fx: 'dust', shake: 8 },
    { name: 'SUPLEX COMBO', seq: ['light', 'heavy', 'special'], dmg: 1.6, final: true, anim: 'flip', col: '#fd5', fx: 'dust', shake: 12, stop: 10 },
  ] },

  mom: { combos: [
    { name: 'MOM KNOWS BEST', seq: ['light', 'light', 'special'], dmg: 1.5, final: true, anim: 'shake', col: '#ff4', fx: 'bolt', shake: 6 },
    { name: 'GROUNDED', seq: ['clight', 'light', 'heavy'], dmg: 1.4, launch: 5, final: true, anim: 'slam', col: '#ff4', fx: 'bolt', shake: 8 },
    { name: 'TIME OUT', seq: ['light', 'heavy', 'special'], dmg: 1.6, final: true, anim: 'burst', col: '#ff4', fx: 'bolt', stop: 10, shake: 9 },
  ] },
};

export const comboKey = def => String((def && def.name) || '').toLowerCase().replace(/[^a-z]/g, '');
export const comboSet = def => COMBOS[comboKey(def)] || COMBOS.default;
