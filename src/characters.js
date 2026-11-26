// Add new fighters here. moves: s=startup, a=active, r=recovery frames; y/h = hitbox offset/height from top of body.
export const CHARACTERS = {
  junior: { name: 'JUNIOR', hp: 100, speed: 2.1, jump: 9.5, h: 62, w: 22, leg: 32, torso: 18,
    skin: '#f1c27d', hair: '#111118', top: '#19c9d6', topD: '#0e8f99', pants: '#1b1b24', shoes: '#eeeeee', style: 'short',
    moves: {
      light: { s: 4, a: 3, r: 8, dmg: 6, kb: 2.5, hs: 14, reach: 26, y: 14, h: 12, snd: 'light' },
      heavy: { s: 10, a: 4, r: 16, dmg: 12, kb: 5, hs: 22, reach: 34, y: 24, h: 14, snd: 'heavy' },
      special: { type: 'proj', s: 12, r: 24, dmg: 14, kb: 5, hs: 22, speed: 4.5, col: '#5ff', snd: 'special' } } },
  marty: { name: 'MARTY', hp: 95, speed: 3, jump: 10.5, h: 68, w: 22, leg: 34, torso: 20,
    skin: '#cf9660', hair: '#0e0e12', top: '#f2f2f2', topD: '#b9b9c4', pants: '#d62828', shoes: '#ffffff', style: 'curly', glasses: true, skinLeg: .45,
    moves: {
      light: { s: 3, a: 3, r: 7, dmg: 5, kb: 2, hs: 12, reach: 28, y: 16, h: 12, snd: 'light' },
      heavy: { s: 8, a: 4, r: 14, dmg: 10, kb: 4.5, hs: 20, reach: 36, y: 28, h: 14, snd: 'heavy' },
      special: { s: 8, a: 14, r: 14, dmg: 15, kb: 6, hs: 22, reach: 30, y: 16, h: 18, dash: 6, snd: 'special' } } },
};
CHARACTERS.junior.stats = { spd: 7, atk: 7, hp: 7 };
CHARACTERS.marty.stats = { spd: 9, atk: 6, hp: 5 };
// Stat helper for new fighters: spd/atk/hp (1-10) drive walk speed, damage (x atk/7) and health. Move dmg below is "at attack 7".
const mk = ([spd, atk, hp], look, moves) => { for (const m of Object.values(moves)) m.dmg = Math.max(1, Math.round(m.dmg * atk / 7));
  return { hp: 50 + 7 * hp, speed: +(.45 + .24 * spd).toFixed(2), jump: +(8.5 + .2 * spd).toFixed(1), stats: { spd, atk, hp }, ...look, moves }; };
Object.assign(CHARACTERS, {
  raphy: mk([4, 8, 9], { name: 'RAPHY', h: 62, w: 30, leg: 14, torso: 20, bw: 11, lw: 8, skin: '#f1c27d', hair: '#111118', top: '#f1c27d', topD: '#d9a860',
    pants: '#f1c27d', shoes: '#d9a860', style: 'bangs', glasses: true, hood: false, belt: '#ece4d2', dress: true, dressCol: '#ece4d2' }, {
    light: { s: 6, a: 3, r: 10, dmg: 6, kb: 2.5, hs: 14, reach: 26, y: 16, h: 14, snd: 'light' },
    heavy: { s: 13, a: 4, r: 20, dmg: 12, kb: 6, hs: 24, reach: 34, y: 20, h: 18, snd: 'heavy' },
    special: { s: 10, a: 22, r: 14, dmg: 17, kb: 6, hs: 26, reach: 34, y: 14, h: 32, dash: 3.5, hop: 6, flop: true, snd: 'special' } }), // belly flop
  esa: mk([6, 7, 7], { name: 'ESA', h: 62, w: 20, leg: 15, torso: 15, lw: 7, skin: '#e09a5c', hair: '#3b2418', top: '#e87a90', topD: '#b8546a',
    pants: '#5f7fb0', shoes: '#ffffff', style: 'shoulder', hood: false, shortSleeve: true }, {
    light: { s: 5, a: 3, r: 9, dmg: 5, kb: 2, hs: 13, reach: 30, y: 14, h: 12, snd: 'light' },
    heavy: { s: 10, a: 4, r: 16, dmg: 10, kb: 4, hs: 20, reach: 36, y: 22, h: 12, snd: 'heavy' },
    special: { type: 'proj', s: 14, r: 26, dmg: 12, kb: 3, hs: 28, speed: 2.6, col: '#5c4', size: 18, snd: 'special' } }), // green gas
  sydney: mk([8, 7, 6], { name: 'SYDNEY', h: 58, w: 22, leg: 18, torso: 18, skin: '#d49a6a', hair: '#6b4226', top: '#8b5a2b', topD: '#6b4220',
    pants: '#3d6fb5', rips: true, shoes: '#222222', style: 'ponytail', hood: false }, {
    light: { s: 3, a: 3, r: 7, dmg: 5, kb: 2, hs: 12, reach: 28, y: 16, h: 12, snd: 'light' },
    heavy: { s: 8, a: 4, r: 14, dmg: 10, kb: 4, hs: 20, reach: 34, y: 26, h: 14, snd: 'heavy' },
    special: { s: 6, a: 15, r: 16, dmg: 3, kb: 1.2, hs: 10, reach: 32, y: 14, h: 14, every: 3, snd: 'light' } }), // rapid fire
  sami: mk([8, 7, 7], { name: 'SAMI', h: 58, w: 22, leg: 18, torso: 17, skin: '#e0aa84', hair: '#5c3421', hl: '#9a5f3a', top: '#34303c', topD: '#24222b',
    pants: '#5073ab', shoes: '#f6f2f4', style: 'long', glasses: true, hood: false, shortSleeve: true }, {
    light: { s: 3, a: 3, r: 8, dmg: 5, kb: 2.2, hs: 13, reach: 28, y: 14, h: 12, snd: 'light' },
    heavy: { s: 9, a: 4, r: 14, dmg: 8, kb: 4.5, hs: 21, reach: 36, y: 26, h: 14, snd: 'heavy' },
    special: { s: 6, a: 20, r: 16, dmg: 3, kb: 1.5, hs: 10, reach: 40, y: 18, h: 16, every: 5, dash: 1.5, spin: true, snd: 'special' } }), // spinning multi-kick
  edson: mk([4, 9, 9], { name: 'EDSON', h: 62, w: 26, leg: 18, torso: 20, bw: 10, lw: 7, armH: 6, skin: '#c68a5c', hair: '#17110f', top: '#1e1d23', topD: '#141318',
    pants: '#22212a', shoes: '#18181e', style: 'buzz', cap: '#17171c', glasses: true, hood: false, shortSleeve: true }, {
    light: { s: 6, a: 3, r: 10, dmg: 6, kb: 3, hs: 14, reach: 28, y: 16, h: 14, snd: 'light' },
    heavy: { s: 12, a: 4, r: 18, dmg: 11, kb: 6, hs: 24, reach: 34, y: 18, h: 18, snd: 'heavy' },
    special: { s: 10, a: 4, r: 26, dmg: 15, kb: 3.5, hs: 34, reach: 24, y: 14, h: 24, grab: true, launch: 6, snd: 'heavy' } }), // wrestling slam (unblockable grab)
  mom: mk([6, 7, 8], { name: 'MOM', h: 58, w: 20, leg: 15, torso: 13, skin: '#d9a07a', hair: '#3a2a24', top: '#7a5aa8', topD: '#5a3f80',
    pants: '#6fb863', shoes: '#4a3a2a', style: 'bob', glasses: true, hood: false, dress: true, aura: true }, {
    light: { s: 4, a: 3, r: 9, dmg: 5, kb: 2, hs: 13, reach: 26, y: 12, h: 12, snd: 'light' },
    heavy: { s: 9, a: 4, r: 15, dmg: 10, kb: 4, hs: 20, reach: 32, y: 16, h: 14, snd: 'heavy' },
    special: { s: 10, a: 12, r: 20, dmg: 3, kb: .8, hs: 30, reach: 58, y: 4, h: 30, every: 3, zap: true, snd: 'special' } }), // electric shock
  // Kuya D: quick + strong, weak defense (low health AND takes 20% extra damage). Special is a basketball chest pass.
  kuyad: mk([9, 9, 4], { name: 'KUYA D', h: 62, w: 24, leg: 15, torso: 17, taken: 1.2, skin: '#d09a68', hair: '#14110f', top: '#f4f2f2', topD: '#cfcaca', pants: '#ece9e9', shoes: '#c8202a', style: 'short' }, {
    light: { s: 3, a: 3, r: 6, dmg: 5, kb: 2.2, hs: 12, reach: 27, y: 14, h: 12, snd: 'light' },
    heavy: { s: 8, a: 4, r: 13, dmg: 10, kb: 5, hs: 21, reach: 34, y: 24, h: 14, snd: 'heavy' },
    special: { type: 'proj', s: 8, r: 18, dmg: 12, kb: 5, hs: 22, speed: 7, col: '#f80', size: 9, ball: true, snd: 'special' } }),   // chest pass
  // Uncle Dandy: all-rounder with Mom's stats. Uber + basketball powers; special is a flurry of quick punches (like a pump-fake into jabs).
  dandy: mk([6, 7, 8], { name: 'UNCLE DANDY', h: 62, w: 22, leg: 15, torso: 18, skin: '#c98f5f', hair: '#14110f', top: '#f4f4f6', topD: '#cfd0d8', pants: '#16161c', shoes: '#f2f2f2', style: 'short' }, {
    light: { s: 4, a: 3, r: 8, dmg: 5, kb: 2.2, hs: 13, reach: 27, y: 14, h: 12, snd: 'light' },
    heavy: { s: 9, a: 4, r: 15, dmg: 10, kb: 4.5, hs: 21, reach: 34, y: 24, h: 14, snd: 'heavy' },
    special: { s: 4, a: 15, r: 14, dmg: 3, kb: 1, hs: 12, reach: 30, y: 14, h: 14, every: 3, jabs: true, snd: 'light' } }),   // quick punches
  // Auntie Sheila: teacher. Quick and balanced (speed 9, attack 7, health 7). Special: throws a red-pen "F" test paper.
  auntiesheila: mk([9, 7, 7], { name: 'AUNTIE SHEILA', h: 62, w: 20, leg: 15, torso: 18, skin: '#d9a47c', hair: '#4a2c20', top: '#f08aa8', topD: '#c8607e', pants: '#17171d', shoes: '#f2f2f2', style: 'straight', glasses: true, hood: false }, {
    light: { s: 3, a: 3, r: 7, dmg: 5, kb: 2, hs: 13, reach: 27, y: 14, h: 12, snd: 'light' },
    heavy: { s: 8, a: 4, r: 14, dmg: 10, kb: 4, hs: 20, reach: 34, y: 24, h: 14, snd: 'heavy' },
    special: { type: 'proj', s: 9, r: 18, dmg: 12, kb: 4, hs: 22, speed: 6.5, col: '#ffffff', size: 12, slip: true, snd: 'special' } }),   // graded test paper
  // Sherell: same strength/speed/health as Esa. Music + acting powers: the special is a sonic scream.
  sherell: mk([6, 7, 7], { name: 'SHERELL', h: 58, w: 20, leg: 15, torso: 13, skin: '#c89468', hair: '#16110f', top: '#9b9ba3', topD: '#7b7b85', pants: '#4a72b0', shoes: '#f2edf4', style: 'straight' }, {
    light: { s: 5, a: 3, r: 9, dmg: 5, kb: 2, hs: 13, reach: 29, y: 12, h: 12, snd: 'light' },
    heavy: { s: 10, a: 4, r: 16, dmg: 10, kb: 4, hs: 20, reach: 34, y: 18, h: 12, snd: 'heavy' },
    special: { type: 'proj', s: 12, r: 24, dmg: 12, kb: 3, hs: 26, speed: 4.2, col: '#6df', size: 16, ring: true, snd: 'special' } }),   // sonic scream
});
// Crouch (low punch / sweep) and jump (flying punch / kick) variants are derived from each fighter's light/heavy.
function addVariants(d) { const L = d.moves.light, H = d.moves.heavy, h = d.h;
  d.moves.clight = { ...L, s: L.s + 1, dmg: Math.max(1, Math.round(L.dmg * .9)), y: Math.round(h * .6), h: 10 };
  d.moves.cheavy = { ...H, a: 5, r: H.r + 4, dmg: Math.max(1, Math.round(H.dmg * .9)), kb: 2, hs: 26, reach: H.reach + 6, y: h - 10, h: 10, launch: 3.5, sweep: true };
  d.moves.jlight = { ...L, s: 3, a: 14, r: 0, air: true, land: 6, y: Math.round(h * .4), h: 14 };   // flying moves: short hit window + landing lag (no more jump-in spam)
  d.moves.jheavy = { ...H, s: 4, a: 16, r: 0, air: true, land: 11, reach: H.reach + 4, y: Math.round(h * .55), h: 16, dmg: Math.max(1, Math.round(H.dmg * .7)) };
  // Throw (Light + Heavy together): beats blocking, slow to start and very slow to recover, so it can't be spammed. Grounded foes only.
  d.moves.throw = { s: 14, a: 3, r: 36, dmg: Math.max(1, Math.round(H.dmg * 1.1)), kb: 4, hs: 40, reach: 18, y: Math.round(h * .22), h: Math.round(h * .5), grab: true, throw: true, launch: 5, final: true, snd: 'heavy' }; }
Object.values(CHARACTERS).forEach(addVariants);
// Detailed sprite palette (see src/detailed.js). Gameplay stats are unchanged.
Object.assign(CHARACTERS.junior, { detail: true, pal: { ol: '#0b0b16', skin: '#f1c27d', skinS: '#d9a05e', hair: '#14141c', hairH: '#33406a', hood: '#2fd3e6', hoodL: '#8ff4ff', hoodD: '#1c9fb5', hoodDD: '#126f84',
  jean: '#1d1d28', jeanH: '#3a3a52', jeanD: '#101018', red: '#d92b2b', redD: '#8f1414', blk: '#15151b', sole: '#f2f2f2', white: '#ffffff', eye: '#15151c', mouth: '#7a2e24' } });
Object.assign(CHARACTERS.marty, { detail: true, body: { leg: 17, arm: 13, torso: 20 }, pal: { ol: '#0b0b16', skin: '#cf9660', skinS: '#a8703f', hair: '#0e0e12', hairH: '#3a3a4a', curly: true, glasses: true,
  frame: '#1a1a22', lens: '#dfe8f0', hood: '#e6eaf2', hoodL: '#ffffff', hoodD: '#aab4c6', hoodDD: '#7f8aa0', emblem: '#d62828', shorts: '#d62828', shortsD: '#8f1616', jeanH: '#fff', jeanD: '#fff',
  red: '#b8a58c', redD: '#8a7a66', blk: '#8a7a66', sole: '#ece5d6', white: '#f4f0e6', eye: '#15151c', mouth: '#7a3a2a' } });
Object.assign(CHARACTERS.raphy, { detail: true, body: { leg: 14, arm: 11, torso: 20, w: 1.45 }, pal: { lowGuard: true, ol: '#0b0b16', skin: '#ec9d62', skinS: '#c97a48', skinH: '#f6b27a', hair: '#17121f', hairH: '#3c3456',
  bare: true, bangs: true, chubby: true, smile: true, belly: true, barefoot: true, skinLegs: true, hood: '#ec9d62', hoodD: '#d8844f', hoodL: '#f6b27a', hoodDD: '#a85f35',
  wrap: '#4a4a9a', wrapL: '#6e6ec8', wrapD: '#2f2f6a', jean: '#ec9d62', jeanH: '#f6b27a', jeanD: '#d8844f', white: '#ffffff', eye: '#15151c', mouth: '#6a2a20', red: '#ec9d62', redD: '#c97a48', blk: '#c97a48', sole: '#c97a48' } });
Object.assign(CHARACTERS.sydney, { detail: true, body: { leg: 13, arm: 9.7, torso: 17, w: .9 }, pal: { ol: '#0b0b16', skin: '#d49a6a', skinS: '#ab6f45', hair: '#845631', hairH: '#c9975a',
  noHoodie: true, neckKey: 'skin', shoulders: true, wavy: true, shortSleeve: true, highWaist: true, flare: true,
  hood: '#46210f', hoodL: '#6a3a24', hoodD: '#2e140a', hoodDD: '#1c0c06', jean: '#5b79ad', jeanH: '#86a2d6', jeanD: '#3d5688',
  red: '#ece7de', blk: '#b9b1a4', sole: '#ffffff', white: '#ffffff', eye: '#15151c', mouth: '#b0554f' } });
Object.assign(CHARACTERS.mom, { detail: true, body: { leg: 14, arm: 11, torso: 19, w: .9 }, pal: { ol: '#0b0b16', skin: '#d9a07a', skinS: '#b87a58', hair: '#3a2a24', hairH: '#6a4c40',
  lowGuard: true, noHoodie: true, neckKey: 'hood', skirt: true, puff: true, belt: true, bob: true, smile: true,
  hood: '#7a1f3d', hoodL: '#9d3558', hoodD: '#551229', hoodDD: '#3a0c1c', red: '#241a1a', blk: '#14100f', sole: '#14100f', white: '#f4eee8', eye: '#15151c', mouth: '#b83a4a' } });
Object.assign(CHARACTERS.esa, { detail: true, body: { leg: 14.2, arm: 12, torso: 18.6, w: .9 }, pal: { ol: '#1a0f12', skin: '#e09a5c', skinS: '#b9753f', hair: '#3b2418', hairH: '#6e4a32',   // long wavy brown hair, pink tee, baggy jeans, white sneakers
  lowGuard: true, noHoodie: true, neckKey: 'skin', wavy: true, shortHair: true, shortSleeve: true, baggy: true, smile: true,
  hood: '#e87a90', hoodL: '#f59aac', hoodD: '#bd5670', hoodDD: '#8c3a50', jean: '#5f7fb0', jeanH: '#8aa3cc', jeanD: '#3f5580',
  red: '#f2edf4', blk: '#c4bace', sole: '#a89fb4', white: '#ffffff', eye: '#1b1214', mouth: '#a8443f' } });
// Sami: round clear glasses, long straight brown hair (darker at the part), black oversized hoodie with drawstrings and pocket, blue flared jeans, white sneakers.
Object.assign(CHARACTERS.sami, { detail: true, body: { leg: 15.1, arm: 11.6, torso: 13.9, w: .8 }, pal: { ol: '#0b0a10', skin: '#e0aa84', skinS: '#bf8660', hair: '#5c3421', hairH: '#8a5232', hairE: '#9a5f3a', hairT: '#2a1a14',
  straight: true, round: true, glasses: true, flare: true, flareS: 5, flareW: 11, lowGuard: true, stringKey: 'hoodL',
  frame: '#aeb6c0', lens: '#eaf1f7', hood: '#34303c', hoodL: '#5a5568', hoodD: '#24222b', hoodDD: '#17151c',
  jean: '#5073ab', jeanH: '#7f9fd0', jeanD: '#34517f',
  red: '#f6f2f4', blk: '#c9c0cc', sole: '#a9a1b6', white: '#ffffff', eye: '#1b1214', mouth: '#c8665f' } });
// Edson: black cap with gold R, black rectangular glasses, moustache + goatee, black tee with a landscape print, stocky build, baggy black cargo pants, black/cream sneakers.
Object.assign(CHARACTERS.edson, { detail: true, body: { leg: 15.4, arm: 15.4, torso: 18.2, w: 1.5 }, pal: { ol: '#09080c', skin: '#c68a5c', skinS: '#9f6a43', hair: '#17110f', hairH: '#2e2420',
  capC: '#1d1d23', capH: '#3a3a45', capD: '#101014', gold: '#d9a94b', rect: true, glasses: true, graphic: true, baggy: true, cargo: true, noHoodie: true, neckKey: 'skin', shortSleeve: true, lowGuard: true,
  frame: '#0e0e12', lens: '#d4dee6', eye: '#17120f', mouth: '#8c4c3e', white: '#ffffff', beard: '#3a2a22',
  hood: '#2a2932', hoodL: '#403f4b', hoodD: '#1b1a21', hoodDD: '#121116', jean: '#2b2a34', jeanH: '#4a4856', jeanD: '#1a191f',
  gSky: '#9a99a2', gMtn: '#63636c', gLake: '#80808a', gPine: '#202027',
  red: '#18181e', blk: '#ece6da', sole: '#d9d1c2' } });
// Kuya D: short fade, goatee, Bulls #23 jersey (sleeveless), white shorts with red trim, crew socks, red/white high-tops
Object.assign(CHARACTERS.kuyad, { detail: true, body: { leg: 15.5, arm: 12.5, torso: 18, w: 1.3 }, pal: { ol: '#0b0a10', skin: '#d09a68', skinS: '#a8703f', hair: '#14110f', hairS: '#3a2c24', stub: '#3a2a22',
  lowGuard: true, fade: true, goatee: true, smile: true, noHoodie: true, neckKey: 'skin', shortSleeve: true, sleeveless: true, jersey: true, shorts: '#ece9e9', shortsD: '#d3232b', shortsTrim: true, sock: true,
  hood: '#f4f2f2', hoodL: '#ffffff', hoodD: '#cfcaca', hoodDD: '#a8a2a2', trim: '#d3232b', sock: '#f4f2f2',
  red: '#c8202a', blk: '#f2eeee', sole: '#ffffff', white: '#ffffff', eye: '#15151c', mouth: '#7a3a2a' } });
// Sherell: long straight black hair, glasses, grey tee with rainbow stripes, jeans, white sneakers
Object.assign(CHARACTERS.sherell, { detail: true, body: { leg: 13.5, arm: 10, torso: 17, w: .9 }, pal: { ol: '#0b0a10', skin: '#c89468', skinS: '#a06a40', hair: '#16110f', hairH: '#3a2c28', hairE: '#241a18', lowGuard: true,
  straight: true, glasses: true, frame: '#4a3f58', lens: '#d8d0e6', noHoodie: true, neckKey: 'skin', shortSleeve: true, rainbow: true,
  hood: '#9b9ba3', hoodL: '#b8b8c0', hoodD: '#7b7b85', hoodDD: '#5f5f68', jean: '#4a72b0', jeanH: '#7b9bd0', jeanD: '#31508a',
  red: '#f2edf4', blk: '#c4bace', sole: '#a89fb4', white: '#ffffff', eye: '#1b1214', mouth: '#b2574f' } });
// Uncle Dandy: black sunglasses, short fade, big grin, white open-collar dress shirt, black jeans, white sneakers
Object.assign(CHARACTERS.dandy, { detail: true, body: { leg: 15, arm: 12, torso: 18, w: 1 }, pal: { ol: '#07070c', skin: '#c98f5f', skinS: '#a06b40', hair: '#14110f', hairH: '#33302e',
  lowGuard: true, noHoodie: true, neckKey: 'skin', collar: true, placket: true, crop: true, hairS: '#2a2422', smile: true, shades: true, frame: '#0a0a0e', lens: '#14141c',
  hood: '#f4f4f6', hoodL: '#ffffff', hoodD: '#cfd0d8', hoodDD: '#a3a4b2', jean: '#16161c', jeanH: '#34343f', jeanD: '#0b0b10',
  red: '#f2f2f2', blk: '#c9c9d2', sole: '#a8a8b4', white: '#ffffff', eye: '#15151c', mouth: '#7a3a2a' } });
// Auntie Sheila: long straight dark-brown hair, teal-framed tinted glasses, pink blouse, gold chain, black slacks, white sneakers
Object.assign(CHARACTERS.auntiesheila, { detail: true, body: { leg: 15, arm: 11.5, torso: 18, w: .85 }, pal: { ol: '#0b0a10', skin: '#d9a47c', skinS: '#b5805a', hair: '#4a2c20', hairH: '#7a4c34', hairE: '#5a3626', lowGuard: true,
  straight: true, glasses: true, smile: true, zip: true, noHoodie: true, neckKey: 'skin', frame: '#2f9a98', lens: '#9a94bc', gold: '#e2b84a',
  hood: '#f08aa8', hoodL: '#f9b0c6', hoodD: '#c8607e', hoodDD: '#9a3f5c', jean: '#17171d', jeanH: '#3a3a46', jeanD: '#0b0b10',
  red: '#f2f2f2', blk: '#c9c9d2', sole: '#a8a8b4', white: '#ffffff', eye: '#15151c', mouth: '#a8504a' } });
export const ROSTER = Object.keys(CHARACTERS);
