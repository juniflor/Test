import { GROUND, ATK } from './fighter.js';
import { drawDetailed } from './detailed.js';
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
export function drawFighter(c, f, force) {
  if (f.def.detail) return drawDetailed(c, f, force);
  const d = f.def, S = force || f.state, mv = d.moves[S];
  const crouch = S === 'crouch' || S === 'clight' || S === 'cheavy' || (S === 'block' && f.crouch), legH = Math.round(d.leg * (crouch ? .55 : 1)), tH = d.torso;
  const walk = S === 'walk' ? Math.sin(f.anim * .35) * 4 : 0, air = S === 'jump' || S === 'jlight' || S === 'jheavy';
  const act = mv && f.t >= mv.s && f.t < mv.s + (mv.a || 0);
  let lean = ATK.includes(S) ? 2 : S === 'hit' ? -3 : 0, bob = S === 'idle' ? Math.round(Math.sin(f.anim * .12)) : 0;
  c.save(); c.translate(Math.round(f.x), Math.round(GROUND - f.y)); c.scale(f.facing, 1);
  if (S === 'lose') { const p = Math.min(1, f.t / 20); c.translate(-6 * p, -6 * p); c.rotate(-Math.PI / 2 * p); }
  if (S === 'win') bob = -Math.abs(Math.round(Math.sin(f.t * .2) * 4));
  c.translate(0, bob);
  if (d.aura) { c.globalAlpha = .25 + .1 * Math.sin(f.anim * .2); R(c, -16, -d.h - 8, 32, d.h + 10, '#f22'); c.globalAlpha = .2; R(c, -12, -d.h - 12, 24, d.h + 14, '#f55'); c.globalAlpha = 1; }
  if (mv && mv.spin && S === 'special' && act) c.scale(Math.floor(f.t / 4) % 2 ? -1 : 1, 1);
  if (mv && mv.flop && S === 'special' && f.t >= mv.s - 2) { const p = Math.min(1, (f.t - mv.s + 3) / 6); c.translate(0, -(d.bw || 8) * p); c.rotate(Math.PI / 2 * p); }
  const lw = d.lw || 6, bw = d.bw || 8;
  const kick = S === 'heavy' || S === 'cheavy' || S === 'jheavy' || (S === 'special' && d.moves.special.dash && !d.moves.special.flop);
  const lt = air ? 3 : 0, sh = d.shoes;
  const leg = (x, front) => { if (front && kick && f.t >= mv.s - 2) return; const lh = legH - (air ? 4 : 0);
    R(c, x, -lh, lw, lh, d.pants); if (d.skinLeg) R(c, x, -lh * d.skinLeg, lw, lh * d.skinLeg | 0, d.skin);
    if (d.rips) { R(c, x + 1, -lh * .6, 3, 3, d.skin); R(c, x + 2, -lh * .3, 3, 2, d.skin); }
    if (d.bell) R(c, x - 1, -6, lw + 2, 6, d.pants);
    R(c, x - 1, -2, lw + 2, 2, sh); };
  leg(-1 - lw - walk * .5 + lt, 0); leg(1 + walk * .5 - lt, 1);
  if (kick && f.t >= mv.s - 2) { const e = act ? mv.reach - 6 : 8; const ky = S === 'cheavy' ? -9 : -legH - 5; R(c, 3, ky, e, 6, d.pants); R(c, 3 + e, ky - 1, 4, 8, sh); }
  const ty = -legH - tH;
  R(c, -bw + lean, ty, bw * 2, tH, d.top); R(c, -bw + lean, ty + tH - 4, bw * 2, 4, d.topD);
  if (d.hood !== false) { R(c, -3 + lean, ty + 3, 1, 4, d.topD); R(c, 2 + lean, ty + 3, 1, 4, d.topD); }
  if (d.belt) R(c, -bw + lean, ty + tH - 5, bw * 2, 5, d.belt);
  if (d.dress) R(c, -bw - 1 + lean, ty + tH, bw * 2 + 2, Math.round(legH * .55), d.dressCol || d.top);
  const hy = ty - 12, hx = -6 + lean;
  R(c, hx, hy, 12, 12, d.skin); R(c, hx - 1, ty - 2, 14, 3, d.hood !== false ? d.topD : d.skin);
  hair(c, d, hx, hy);
  R(c, hx + 8, hy + 5, 1, 2, '#111');
  if (d.glasses) { c.strokeStyle = '#111'; c.lineWidth = 1; c.strokeRect(hx + 4.5, hy + 3.5, 4, 4); c.strokeRect(hx + 9.5, hy + 3.5, 3, 4); }
  const sy = ty + 3;
  const ah = d.armH || 5, arm = (x, len, y, col) => { const L = Math.max(3, len); if (d.shortSleeve) { R(c, x, y, L, ah, d.skin); R(c, x, y, 3, ah, col); } else { R(c, x, y, L, ah, col); R(c, x + L - 3, y, 4, ah, d.skin); } };
  if (S === 'win') { R(c, 4, sy - 12, 4, 12, d.top); R(c, 4, sy - 16, 4, 4, d.skin); R(c, -8, sy - 12, 4, 12, d.top); R(c, -8, sy - 16, 4, 4, d.skin); }
  else if (S === 'block') { R(c, 5 + lean, sy - 6, 5, 12, d.top); R(c, 5 + lean, sy - 9, 5, 4, d.skin); }
  else if (S === 'lose') { arm(-6, 8, sy + 2, d.top); }
  else if (ATK.includes(S) && !kick) { const len = f.t < mv.s ? 4 : act ? mv.reach - 4 - (mv.every && (f.t / 3 | 0) % 2 ? 6 : 0) : 9; arm(2 + lean, len, sy + (S === 'special' ? 0 : 1), d.top); arm(-4, S === 'special' ? len : 6, sy + 3, d.topD); }
  else if (S === 'hit') { arm(-8, 6, sy + 4, d.top); }
  else { arm(3 + lean, 8, sy + 3, d.top); arm(-5, 6, sy + 4, d.topD); }
  if (mv && mv.zap && act) for (let k = 0; k < mv.reach; k += 6) { const zy = -Math.round(d.h * .55) + ((k / 6) % 2 ? -5 : 4); R(c, 10 + k, zy, 6, 3, '#ff4'); R(c, 10 + k, zy + 1, 3, 1, '#fff'); }
  c.restore();
}
function hair(c, d, hx, hy) { const h = d.hair, curl = () => { for (let k = 0; k < 5; k++) R(c, hx - 2 + k * 3, hy - 5 + (k % 2) * 2, 4, 6, h); };
  switch (d.style) {
    case 'short': R(c, hx - 1, hy - 3, 14, 6, h); R(c, hx - 1, hy, 3, 7, h); break;
    case 'curly': curl(); R(c, hx - 2, hy, 3, 6, h); break;
    case 'bangs': curl(); R(c, hx - 2, hy, 3, 7, h); R(c, hx + 1, hy, 11, 3, h); break;
    case 'shoulder': curl(); R(c, hx - 4, hy, 6, 15, h); R(c, hx + 10, hy, 3, 5, h); break;
    case 'bob': R(c, hx - 2, hy - 3, 16, 6, h); R(c, hx - 3, hy, 5, 12, h); R(c, hx + 11, hy, 2, 8, h); break;
    case 'long': R(c, hx - 2, hy - 3, 16, 6, h); R(c, hx - 5, hy, 7, 24, h); R(c, hx + 11, hy, 2, 10, h);
      R(c, hx - 4, hy + 6, 2, 3, d.hl); R(c, hx - 3, hy + 14, 2, 4, d.hl); R(c, hx + 3, hy - 3, 3, 2, d.hl); break;
    case 'ponytail': R(c, hx - 1, hy - 3, 14, 6, h); R(c, hx - 1, hy, 3, 7, h); R(c, hx - 6, hy + 1, 5, 13, h); break;
    case 'buzz': R(c, hx, hy - 1, 12, 3, h); break; }
  if (d.cap) { R(c, hx - 1, hy - 4, 14, 5, d.cap); R(c, hx + 10, hy, 6, 2, d.cap); } }
let stage;
export function drawStage(c) {
  if (!stage) { stage = document.createElement('canvas'); stage.width = 480; stage.height = 270; const s = stage.getContext('2d');
    ['#1a1040', '#2a1a5e', '#4a2a7e', '#8a3a8e', '#d4607a', '#f09a6a'].forEach((col, i) => R(s, 0, i * 28, 480, 29, col));
    R(s, 380, 60, 28, 28, '#ffe9a8'); let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let x = 0; x < 480; x += 30) { const h = 40 + rnd() * 70 | 0; R(s, x, 190 - h, 28, h, '#1c1030');
      for (let wy = 190 - h + 6; wy < 184; wy += 10) for (let wx = x + 4; wx < x + 24; wx += 8) if (rnd() > .5) R(s, wx, wy, 3, 4, '#ffd36a'); }
    R(s, 0, 190, 480, 80, '#2c2438'); R(s, 0, 190, 480, 4, '#5a4a6e');
    for (let x = 0; x < 480; x += 40) R(s, x, 232, 22, 2, '#4a3e5e'); R(s, 0, 232 + 10, 480, 38, '#3a2f4a');
    for (let x = 0; x < 480; x += 16) R(s, x, 250, 8, 20, '#33293f'); }
  c.drawImage(stage, 0, 0);
}
export const shadow = (c, f) => { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(Math.round(f.x) - 12 + f.y / 4, GROUND, 24 - f.y / 2, 3); };
