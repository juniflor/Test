// Finisher animations for combos. Visual only (plus hit-stop). Fighter calls m.combo() when a combo is matched and m.impact()
// when the finisher lands; main.js draws everything here. Each combo in combos.js picks its look with these fields:
//   anim: 'spin' | 'flip' | 'rush' | 'slam' | 'burst' | 'shake'   how the attacker's body moves during the finisher
//   col:  colour of aura / flash / shockwave / particles          fx: 'star' | 'gas' | 'bolt' | 'flame' | 'dust'  particle style
//   turns, lift (spin only), shake (screen shake), stop (hit-stop frames) are optional.
import { GROUND, ATK } from './fighter.js';
const TAU = Math.PI * 2, TRAIL = new Set(['rush', 'flip', 'spin', 'juke']);

export function poseFx(f) {              // transform for the attacker's body, or null
  const cb = f.cur && f.cur.combo; if (!cb || !cb.anim || !ATK.includes(f.state)) return null;
  const mv = f.cur, p = Math.min(1, f.t / Math.max(10, mv.s + (mv.a || 8))), fc = f.facing;
  switch (cb.anim) {
    case 'spin': return { rot: fc * TAU * (cb.turns || 1) * p, dy: -(cb.lift || 0) * Math.sin(Math.PI * p) };
    case 'flip': return { rot: -fc * TAU * p, dy: -16 * Math.sin(Math.PI * p) };
    case 'rush': return { rot: fc * .22, dx: fc * 3 * Math.sin(Math.PI * p) };
    case 'juke': return { dx: fc * 9 * Math.sin(p * TAU * 1.5), rot: fc * .1 };   // crossover shuffle
    case 'slam': { const L = cb.lift || 16; return p < .45 ? { dy: -L * (p / .45), sy: 1.1 } : p < .65 ? { dy: -L * (1 - (p - .45) / .2) } : { sy: .84 }; }   // lift = jump height
    case 'burst': { const s = 1 + .1 * Math.sin(p * TAU * 1.5); return { sx: s, sy: s }; }
    case 'shake': return { dx: (Math.random() - .5) * 3, dy: (Math.random() - .5) * 2 };
  } return null;
}
function transformed(c, f, draw) {
  const px = poseFx(f); if (!px) return draw(c, f);
  const cx = Math.round(f.x), cy = GROUND - f.y - f.def.h * .5;
  c.save(); c.translate(cx + (px.dx || 0), cy + (px.dy || 0)); c.rotate(px.rot || 0); c.scale(px.sx || 1, px.sy || 1); c.translate(-cx, -cy); draw(c, f); c.restore();
}
export function drawWithFx(c, f, draw) {   // drop-in for drawFighter: adds aura, afterimages and the body animation during a finisher
  const cb = f.cur && f.cur.combo, on = cb && cb.anim && ATK.includes(f.state);
  if (!on) { f._h = null; return draw(c, f); }
  c.save(); c.globalAlpha = .2 + .1 * Math.sin(f.anim * .6); c.fillStyle = cb.col || '#fc3'; c.beginPath(); c.ellipse(Math.round(f.x), GROUND - f.y - f.def.h * .5, 17, f.def.h * .58, 0, 0, TAU); c.fill(); c.restore();   // soft glow
  if (TRAIL.has(cb.anim)) { const h = f._h || (f._h = []); h.push({ ...f, _h: null }); if (h.length > 7) h.shift();
    for (const [k, a] of [[5, .14], [3, .22], [1, .32]]) { const s = h[h.length - 1 - k]; if (s) { c.save(); c.globalAlpha = a; transformed(c, s, draw); c.restore(); } } }
  transformed(c, f, draw);
}

export function burst(m, x, y, kind, col, n = 16) {
  for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = 1 + Math.random() * 3;
    const p = { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, l: 22 + (Math.random() * 14 | 0), col, k: kind, g: .12 };
    if (kind === 'gas') { p.vx *= .5; p.vy = -Math.random() * 1.2; p.g = -.02; p.l += 20; }
    if (kind === 'flame') { p.vx *= .5; p.vy = -1 - Math.random() * 2; p.g = -.05; }
    if (kind === 'note') { p.vx *= .5; p.vy = -1 - Math.random() * 1.5; p.g = -.03; p.l += 14; }
    if (kind === 'dust') { p.vy = -Math.random() * 1.5; p.g = .05; p.vx *= 1.4; }
    m.fx_.push(p); }
}
export function announce(m, att, cb) {   // combo just matched: banner + sparks around the attacker
  m.banner = { text: cb.name, col: cb.col || '#fc3', t: 100 }; burst(m, att.x, GROUND - att.y - att.def.h * .5, cb.fx || 'star', cb.col || '#fc3', 10); m.sfx('special');
}
export function impact(m, att, mv, foe) { // finisher landed: hit-stop, screen shake, flash, ground shockwave, burst
  const cb = mv.combo; if (!cb || !cb.anim) return;
  m.stop = Math.max(m.stop || 0, cb.stop ?? 7); m.shake = Math.max(m.shake || 0, cb.shake ?? 6); m.flash = { col: cb.col || '#fff', t: 10 };
  (m.waves || (m.waves = [])).push({ x: foe.x, y: GROUND, t: 0, col: cb.col || '#fff' });
  burst(m, foe.x, GROUND - foe.y - foe.def.h * .5, cb.fx || 'star', cb.col || '#fd5', 22); m.sfx('heavy');
}
export function stepFx(m) {
  if (m.shake > 0) m.shake = Math.max(0, m.shake - .7); if (m.flash && m.flash.t > 0) m.flash.t--; if (m.banner && m.banner.t > 0) m.banner.t--;
  if (m.waves) { m.waves.forEach(w => w.t++); m.waves = m.waves.filter(w => w.t < 22); }
}
export function drawParticles(c, list) {
  for (const p of list) { const x = Math.round(p.x), y = Math.round(p.y); c.globalAlpha = Math.min(1, p.l / 10); c.fillStyle = p.col;
    switch (p.k) {
      case 'star': c.fillRect(x - 1, y - 3, 2, 6); c.fillRect(x - 3, y - 1, 6, 2); c.fillStyle = '#fff'; c.fillRect(x - 1, y - 1, 2, 2); break;
      case 'gas': c.globalAlpha *= .6; c.fillRect(x - 4, y - 3, 8, 6); c.fillRect(x - 3, y - 4, 6, 8); break;
      case 'bolt': c.fillRect(x, y - 4, 2, 4); c.fillRect(x + 2, y - 1, 2, 4); c.fillStyle = '#fff'; c.fillRect(x, y - 3, 1, 2); break;
      case 'flame': c.fillRect(x - 2, y - 2, 4, 4); c.fillStyle = '#ffe27a'; c.fillRect(x - 1, y - 1, 2, 2); break;
      case 'dust': c.fillRect(x - 2, y - 2, 4, 3); break;
      case 'ball': c.fillRect(x - 2, y - 2, 5, 5); c.fillStyle = '#4a2008'; c.fillRect(x - 2, y, 5, 1); c.fillRect(x, y - 2, 1, 5); break;
      case 'pin': c.fillRect(x - 2, y - 4, 5, 5); c.fillRect(x - 1, y + 1, 3, 2); c.fillStyle = '#000'; c.fillRect(x - 1, y - 3, 3, 3); break;   // Uber-style map pin
      case 'note': c.fillRect(x, y, 3, 2); c.fillRect(x + 2, y - 5, 1, 6); c.fillRect(x + 3, y - 5, 3, 1); break;
      default: c.fillRect(x, y, 3, 3); } }
  c.globalAlpha = 1;
}
export function drawWaves(c, m) {
  for (const w of m.waves || []) { c.globalAlpha = 1 - w.t / 22; c.strokeStyle = w.col; c.lineWidth = 2; c.beginPath(); c.ellipse(w.x, w.y, 6 + w.t * 3.2, 2 + w.t * .9, 0, 0, TAU); c.stroke(); }
  c.globalAlpha = 1;
}
export function drawOverlay(c, m) {      // screen flash + combo name banner (drawn above everything, not shaken)
  if (m.flash && m.flash.t > 0) { c.globalAlpha = .5 * m.flash.t / 10; c.fillStyle = m.flash.col; c.fillRect(0, 0, 480, 270); c.globalAlpha = 1; }
  const b = m.banner; if (b && b.t > 0) { const k = Math.min(1, (100 - b.t) / 6), size = Math.round(10 + 8 * k + (b.t > 90 ? 6 : 0));
    c.globalAlpha = Math.min(1, b.t / 15); c.font = `bold ${size}px monospace`; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(b.text, 241, 91); c.fillStyle = b.col; c.fillText(b.text, 240, 90);
    c.font = 'bold 8px monospace'; c.fillStyle = '#fff'; c.fillText('COMBO!', 240, 102); c.globalAlpha = 1; }
}
