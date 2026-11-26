// Detailed pixel renderer: jointed skeleton (2-bone IK for arms/legs), outlines, shading, face, sneakers.
// Enabled per fighter with `detail: true` + `pal` in characters.js. Local coords: facing +x, feet at y=0, up is negative.
import { GROUND, ATK } from './fighter.js';
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
function ik(x0, y0, x1, y1, l1, l2, mode) {            // returns joint (knee/elbow) and clamped end point
  let dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1; const m = l1 + l2 - .5;
  if (d > m) { x1 = x0 + dx * m / d; y1 = y0 + dy * m / d; dx = x1 - x0; dy = y1 - y0; d = m; }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a)), ux = dx / d, uy = dy / d; let px = -uy, py = ux;
  if (mode === 'x' ? px < 0 : py < 0) { px = -px; py = -py; }   // knees bend forward, elbows bend down
  return { j: [x0 + ux * a + px * h, y0 + uy * a + py * h], e: [x1, y1] };
}
export function drawDetailed(c, f, force) {
  const d = f.def, S = force || f.state, mv = d.moves[S], P = d.pal, t = f.t, atk = ATK.includes(S);
  const crouch = S === 'crouch' || S === 'clight' || S === 'cheavy' || (S === 'block' && f.crouch), air = S === 'jump' || S === 'jlight' || S === 'jheavy';
  const B = { leg: 15, arm: 12, torso: 18, ...d.body }, k = B.leg / 15, ka = B.arm / 12, L1 = B.leg, L2 = B.leg, A1 = B.arm, A2 = B.arm, H0 = -2 * B.leg;
  const dashKick = S === 'special' && mv && mv.dash && !mv.flop, kickS = S === 'heavy' || S === 'cheavy' || S === 'jheavy' || dashKick;
  const flopS = mv && mv.flop && S === 'special';
  const act = mv && t >= mv.s && t < mv.s + (mv.a || 0), rf = atk && S !== 'special' ? .5 : .8;   // normals retract twice as fast
  // e: 0 = guard, 1 = fully extended. Quick wind-up (pull back / chamber), snap to full on active frames, fast retract.
  const e = !mv ? 0 : act ? (mv.every && (t / 3 | 0) % 2 ? .55 : 1) : t < mv.s ? (kickS ? .35 : -.2) * t / mv.s : mv.r ? Math.max(0, 1 - (t - mv.s - (mv.a || 0)) / (mv.r * rf)) : 0;
  const ph = f.anim * .3, sn = Math.sin(ph), lerp = (a, b, q) => [a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q];
  let hip = [0, H0], lean = 2, aF = [10 * k, -5], aB = [-10 * k, -5], tilt = 0;
  if (S === 'idle') hip[1] += Math.round(Math.sin(f.anim * .12));
  if (S === 'walk') { aF = [(10 + sn * 7) * k, -5 - Math.max(0, Math.cos(ph)) * 4]; aB = [(-10 - sn * 7) * k, -5 - Math.max(0, -Math.cos(ph)) * 4]; hip[1] = H0 + Math.abs(sn); }
  if (crouch) { hip = [0, H0 * .47]; aF = [11 * k, -5]; aB = [-11 * k, -5]; lean = 3; }
  if (air) { hip = [0, H0 * .93]; aF = [8 * k, -16 * k]; aB = [-6 * k, -12 * k]; }
  if (kickS) lean = S === 'cheavy' ? -2 : -3;
  if (S === 'light' || S === 'clight' || S === 'jlight' || (S === 'special' && !dashKick)) lean += 2 * e;
  if (S === 'hit' || S === 'lose') { lean = -6; hip = [-3, H0 * .93]; aB = [-14 * k, -5]; tilt = -2; }
  if (S === 'win') hip[1] -= Math.round(Math.abs(Math.sin(t * .2)) * 4);
  if (S === 'throw') lean = t < mv.s ? 3 * t / mv.s : t < mv.s + mv.a + 12 ? -4 : 2;   // reach in, lean back to heave, follow through
  if (flopS) { hip = [0, H0 * .85]; lean = 0; aF = [8 * k, -5]; aB = [-8 * k, -5]; }
  const nx = hip[0] + lean, ny = hip[1] - B.torso, sx = nx, sy = ny + 3;
  const lg = P.lowGuard ? 8 : 0; let hF = [sx + 10 * ka, sy - 6 * ka + lg], hB = [sx + 5 * ka, sy - 5 * ka + lg]; if (crouch) { hF[1] += 3; hB[1] += 3; }
  const X = 23 * ka;
  if (S === 'light' || S === 'jlight') hF = lerp(hF, [sx + X, sy + 1], e); if (S === 'clight') hF = lerp(hF, [sx + X, sy + 4], e);
  if (S === 'special' && !dashKick) { if (mv.jabs && act) { const o = (t / 3 | 0) % 2; hF = lerp(hF, o ? [sx + 8 * ka, sy + 2] : [sx + X, sy + 2], 1); hB = lerp(hB, o ? [sx + X, sy + 3] : [sx + 7 * ka, sy + 3], 1); }   // quick alternating jabs
    else { hF = lerp(hF, [sx + X, sy + 2], e); hB = lerp(hB, [sx + X - 6, sy + 4], e); } }
  if (S === 'heavy' || dashKick) aF = lerp(aF, [hip[0] + 27 * k, hip[1] + 3], e); if (S === 'cheavy') aF = lerp(aF, [hip[0] + 27 * k, -5], e); if (S === 'jheavy') aF = lerp(aF, [hip[0] + 22 * k, hip[1] + 17 * k], e);
  if (S === 'block') { hF = [sx + 8 * ka, sy - 9 * ka]; hB = [sx + 5 * ka, sy - 8 * ka]; }
  if (S === 'win') { hF = [sx + 9, sy - 25 * ka]; hB = [sx - 6, sy - 25 * ka]; }
  if (S === 'throw') { if (t < mv.s) { hF = lerp(hF, [sx + 23 * ka, sy + 4], t / mv.s); hB = lerp(hB, [sx + 18 * ka, sy + 6], t / mv.s); } else if (t < mv.s + mv.a + 12) { hF = [sx + 8 * ka, sy - 20 * ka]; hB = [sx + 4 * ka, sy - 20 * ka]; } else { hF = [sx + 16 * ka, sy + 8]; hB = [sx + 14 * ka, sy + 9]; } }
  if (S === 'hit' || S === 'lose') { hF = [sx - 1, sy + 9]; hB = [sx - 7, sy + 8]; }
  if (flopS) { hF = [sx + 8 * ka, sy - 20 * ka]; hB = [sx + 4 * ka, sy - 20 * ka]; }
  const legF = ik(hip[0], hip[1], aF[0], aF[1], L1, L2, 'x'), legB = ik(hip[0], hip[1], aB[0], aB[1], L1, L2, 'x');
  const armF = ik(sx, sy, hF[0], hF[1], A1, A2, 'y'), armB = ik(sx, sy, hB[0], hB[1], A1, A2, 'y');
  const W = B.w || 1, w4 = Math.round(4 * W), w5 = Math.round(5 * W), w6 = Math.round(6 * W), w9 = Math.round(9 * W), w12 = Math.round(12 * W), fs = W > 1.3 ? 6 : 4;
  const kicking = kickS && e > .3, hurt = S === 'hit', shout = atk && act;
  const paint = ol => {
    const r = (x, y, w, h, k) => R(c, x, y, w, h, ol ? P.ol : P[k]);
    const limb = (p, q, w, k) => { const dx = q[0] - p[0], dy = q[1] - p[1], n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
      for (let i = 0; i <= n; i++) R(c, Math.round(p[0] + dx * i / n - w / 2), Math.round(p[1] + dy * i / n - w / 2), w, w, ol ? P.ol : P[k]); };
    const taper = (p, q, w0, w1, k) => { const dx = q[0] - p[0], dy = q[1] - p[1], n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
      for (let i = 0; i <= n; i++) { const w = Math.round(w0 + (w1 - w0) * i / n); R(c, Math.round(p[0] + dx * i / n - w / 2), Math.round(p[1] + dy * i / n - 2), w, 4, ol ? P.ol : P[k]); } };
    const shoe = (a, kick) => { const [x, y] = a.map(Math.round);
      if (P.barefoot) { if (kick) r(x - 2, y - 4, 5, 8, 'skin'); else { r(x - 3, y + 1, 10, 4, 'skin'); r(x + 5, y + 3, 3, 2, 'skinS'); r(x - 3, y + 4, 10, 1, 'skinS'); } return; }
      if (kick) { r(x - 2, y - 4, 5, 8, 'red'); r(x + 3, y - 4, 1, 8, 'sole'); r(x + 1, y - 4, 2, 3, 'blk'); }
      else { r(x - 2, y - 3, 5, 4, 'red'); r(x - 2, y - 3, 5, 1, 'blk'); r(x - 3, y + 1, 10, 3, 'red'); r(x + 4, y + 1, 3, 3, 'blk'); r(x - 3, y + 4, 10, 1, 'sole'); r(x, y - 1, 2, 1, 'white'); } };
    const leg = (g, kick) => { const lc = P.shorts || P.skinLegs || P.skirt ? 'skin' : 'jean'; limb(hip, g.j, w6, lc); if (!P.flare && !P.baggy) limb(g.j, g.e, w5, lc); if (P.skinLegs && !ol) { r(g.j[0] - 1, g.j[1] - 2, 4, 4, 'skinH'); limb([hip[0] + 2, hip[1] + 3], [g.j[0] + 2, g.j[1] - 3], 2, 'skinH'); }
      if (P.shorts) { const q = lerp(hip, g.j, .8); limb(hip, q, w9, 'shorts'); if (!ol) { r(q[0] - 4, q[1], 9, 1, P.shortsTrim ? 'shortsD' : 'white'); r(q[0] - 4, q[1] - 2, 1, 2, 'shortsD'); } } else if (!ol && !P.skinLegs && !P.skirt) { limb([hip[0] + 2, hip[1] + 2], [g.j[0] + 2, g.j[1]], 1, 'jeanH'); r(g.j[0] - 2, g.j[1], 5, 1, 'jeanD'); } if (P.sock) limb(lerp(g.j, g.e, .55), [g.e[0], g.e[1] - 1], w5 + 1, 'sock');   // crew socks
      if (P.skirt) { shoe(g.e, kick); const hem = lerp(hip, g.e, .8); limb(hip, g.j, w6 + 1, 'hood'); limb(g.j, hem, w6, 'hood'); taper(hip, hem, 9, 12, 'hood');
        if (!ol) { taper([hip[0] - 1, hip[1] + 2], [hem[0] - 2, hem[1]], 1, 2, 'hoodD'); taper([hip[0] + 2, hip[1] + 2], [hem[0] + 3, hem[1]], 1, 2, 'hoodL'); r(hem[0] - 6, hem[1] + 1, 12, 1, 'hoodDD'); } }
      else if (P.baggy) { shoe(g.e, kick); limb(hip, g.j, w9, 'jean'); taper(g.j, [g.e[0], g.e[1] - 1], w9, w9 + 3, 'jean');   // wide straight-leg jeans that bunch over the sneakers
        if (!ol) { taper([g.j[0] + 2, g.j[1] + 1], [g.e[0] + 3, g.e[1] - 3], 1, 3, 'jeanH'); taper([g.j[0] - 2, g.j[1] + 2], [g.e[0] - 3, g.e[1] - 2], 1, 2, 'jeanD'); r(g.e[0] - (P.cargo ? (w9 + 3) >> 1 : 6), g.e[1] - 1, P.cargo ? w9 + 3 : 12, 1, 'jeanD'); r(g.j[0] - 3, g.j[1] + 3, 7, 1, 'jeanD');
          if (P.cargo) { const q = lerp(hip, g.j, .78); r(q[0] - 3, q[1] - 2, 7, 6, 'jeanH'); r(q[0] - 2, q[1] - 1, 5, 4, 'jean'); r(q[0] - 3, q[1] + 3, 7, 1, 'jeanD'); } } }   // cargo pocket
      else if (P.flare) { shoe(g.e, kick); const fw = P.flareW || 13; taper(g.j, [g.e[0] - 1, g.e[1] + 1], P.flareS || 6, fw, 'jean'); if (!ol) { taper([g.j[0] + 2, g.j[1] + 2], [g.e[0] + 3, g.e[1] - 1], 1, 3, 'jeanH'); r(g.e[0] - ((fw + 1) >> 1), g.e[1] + 1, fw, 1, 'jeanD'); } } else shoe(g.e, kick); };
    const arm = (g, k, sk) => { if (P.puff) limb([sx, sy - 1], [sx, sy - 1], w5 + 3, k); if (P.shortSleeve) { limb([sx, sy], g.j, w5, sk); limb(g.j, g.e, w4, sk); if (!P.sleeveless) limb([sx, sy], lerp([sx, sy], g.j, .45), w5 + 1, k); }
      else { limb([sx, sy], g.j, w5, k); limb(g.j, g.e, w4, k); if (!ol && !P.bare) limb(lerp(g.j, g.e, .7), g.e, 4, 'hoodDD'); }
      r(g.e[0] - fs / 2, g.e[1] - fs / 2, fs, fs, 'skin'); if (!ol) { r(g.e[0] - fs / 2, g.e[1], fs, 1, 'skinS'); } };
    if (P.straight) { const bx = nx - 4 + tilt, by = ny - 10;   // long straight hair hanging down the back, lighter (hairE) ends
      r(bx - 5, by + 1, 9, 19, 'hair'); r(bx - 5, by + 15, 5, 5, 'hairE'); r(bx - 6, by + 9, 1, 8, 'hair');
      if (!ol) { r(bx - 3, by + 3, 1, 9, 'hairH'); r(bx - 1, by + 5, 1, 7, 'hairH'); r(bx - 3, by + 15, 1, 3, 'hairE'); } }
    else if (P.wavy && P.shortHair) { const bx = nx - 4 + tilt, by = ny - 10;   // shoulder-length wavy hair
      r(bx - 5, by + 1, 9, 14, 'hair'); r(bx - 7, by + 5, 3, 8, 'hair'); r(bx - 6, by + 11, 3, 5, 'hair'); r(bx - 3, by + 13, 5, 3, 'hair');
      if (!ol) { r(bx - 3, by + 4, 1, 7, 'hairH'); r(bx - 5, by + 10, 1, 4, 'hairH'); r(bx - 1, by + 10, 1, 4, 'hairH'); } }
    else if (P.wavy) { const bx = nx - 4 + tilt, by = ny - 10; r(bx - 5, by + 1, 9, 26, 'hair'); r(bx - 7, by + 6, 3, 7, 'hair'); r(bx - 6, by + 15, 3, 8, 'hair'); r(bx - 4, by + 24, 5, 4, 'hair'); r(bx - 8, by + 19, 3, 5, 'hair');
      if (!ol) { r(bx - 3, by + 4, 1, 9, 'hairH'); r(bx - 5, by + 15, 1, 6, 'hairH'); r(bx - 1, by + 14, 1, 9, 'hairH'); r(bx - 7, by + 8, 1, 3, 'hairH'); } }
    if (!P.bare && !P.noHoodie) r(nx - 9, ny - 3, 6, 6, 'hoodD');                              // hood bunched behind the neck
    arm(armB, 'hoodD', 'skinS'); leg(legB, false); leg(legF, kicking);
    limb([hip[0], hip[1] + 2], [hip[0], hip[1] + 5], w12, P.wrap ? 'wrap' : P.shorts ? 'shorts' : P.skirt ? 'hood' : 'jean');   // pelvis
    limb([hip[0], hip[1] - 2], [nx, ny + (P.bare || P.noHoodie ? Math.round(w12 / 2) - 2 : 2)], w12, 'hood');           // torso
    if (P.belly) { r(nx + 8, ny + 8, 6, 11, 'hood'); if (!ol) { r(nx + 11, ny + 12, 2, 1, 'hoodDD'); r(nx + 2, ny + 6, 8, 1, 'hoodD'); r(nx + 9, ny + 18, 5, 1, 'hoodD'); } }
    if (!ol) { limb([hip[0] - 4, hip[1] - 2], [nx - 4, ny + 2], 4, 'hoodD'); limb([hip[0] + 3, hip[1] - 4], [nx + 3, ny + 5], 2, 'hoodL');
      if (!P.bare && !P.noHoodie) { r(hip[0] - Math.round(6 * W), hip[1] - 1, w12, 3, 'hoodD'); r(hip[0] - Math.round(4 * W) + lean * .3, hip[1] - 9, Math.round(9 * W), 6, 'hoodD'); r(hip[0] - Math.round(4 * W) + lean * .3, hip[1] - 9, Math.round(9 * W), 1, 'hoodDD');
      const sk = P.emblem ? 'hoodD' : P.stringKey || 'white'; r(nx - 1, ny + 4, 1, 6, sk); r(nx + 3, ny + 4, 1, 6, sk); if (P.emblem) r(nx, ny + 6, 5, 5, 'emblem'); } }
    if (P.zip && !ol) { r(nx + 3, ny + 3, 1, B.torso - 5, 'hoodDD'); r(nx + 2, ny + 2, 1, 1, 'gold'); r(nx + 3, ny + 3, 1, 1, 'gold'); r(nx + 4, ny + 4, 1, 1, 'gold'); r(nx + 3, ny + 5, 1, 1, 'gold'); r(nx + 2, ny + 6, 1, 1, 'gold'); }   // zip-up front and gold chain
    if (P.graphic && !ol) { const gx = nx - 8, gy = ny + 4; r(gx, gy, 16, 8, 'gSky');   // landscape tee print across the chest (mountains, lake, pines); the near arm covers its middle
      for (const [pk, hw] of [[4, 4], [11, 3]]) for (let k = 0; k < hw; k++) r(gx + pk - k, gy + 1 + k, 2 * k + 1, 1, 'gMtn'); r(gx + 1, gy + 5, 14, 1, 'gMtn'); r(gx, gy + 5, 16, 3, 'gLake');
      for (const px of [3, 12]) { r(gx + px, gy + 3, 1, 1, 'gPine'); r(gx + px - 1, gy + 4, 3, 1, 'gPine'); r(gx + px - 2, gy + 5, 5, 1, 'gPine'); r(gx + px, gy + 6, 1, 1, 'gPine'); } }
    if (P.wrap) { const hw = Math.round(w12 / 2) + 1; r(hip[0] - hw, hip[1] - 6, hw * 2, 7, 'wrap'); r(hip[0] - hw - 2, hip[1] - 6, 3, 6, 'wrap');
      if (!ol) { r(hip[0] - hw, hip[1] - 6, hw * 2, 1, 'wrapL'); r(hip[0] - hw, hip[1], hw * 2, 1, 'wrapD'); } r(hip[0] - 2, hip[1] + 1, 10, 9, 'wrap'); r(hip[0] - 1, hip[1] + 10, 8, 3, 'wrap'); if (!ol) r(hip[0] - 2, hip[1] + 1, 10, 1, 'wrapD'); }
    if (P.belt) { r(hip[0] - 6, hip[1] - 4, 12, 3, 'hoodD'); r(hip[0], hip[1] - 5, 4, 5, 'hoodL'); r(hip[0] + 1, hip[1] - 4, 2, 3, 'hoodDD'); }
    if (P.highWaist) { limb([hip[0], hip[1] + 1], [hip[0], hip[1] + 3], w12, 'jean'); if (!ol) { r(hip[0] - Math.round(w12 / 2), hip[1] - 5, w12, 2, 'jeanD'); r(hip[0] + 1, hip[1] - 4, 2, 1, 'white'); } }
    if (P.rainbow && !ol) ['#e86a7a', '#f2a65a', '#e6d55a', '#6ab8d8'].forEach((col, i) => R(c, nx - 4, ny + 4 + i * 2, 9, 1, col));   // rainbow chest stripes
    if (P.jersey && !ol) { const hw = Math.round(w12 / 2); r(nx - hw, ny + 2, 2, B.torso - 4, 'trim'); r(nx + hw - 2, ny + 2, 2, B.torso - 4, 'trim'); r(nx - 3, ny, 7, 1, 'trim'); r(nx - 2, ny + 1, 5, 1, 'trim'); r(nx - 4, ny + 4, 9, 2, 'trim');   // trim, V-neck, BULLS band
      const N = { 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'] };   // jersey number 23
      N[2].forEach((row, yy) => [...row].forEach((v, xx) => v === '1' && r(nx - 4 + xx, ny + 8 + yy, 1, 1, 'trim'))); N[3].forEach((row, yy) => [...row].forEach((v, xx) => v === '1' && r(nx + xx, ny + 8 + yy, 1, 1, 'trim'))); }
    if (P.shoulders) { r(nx - 5, ny - 1, 11, 4, 'skin'); if (!ol) r(nx - 1, ny + 3, 5, 1, 'skinS'); }
    if (P.straight) { r(nx + 3, ny + 2, 3, 12, 'hair'); r(nx + 3, ny + 10, 3, 4, 'hairE'); if (!ol) { r(nx + 4, ny + 4, 1, 6, 'hairH'); r(nx + 3, ny + 12, 1, 2, 'hairH'); } }   // lock of hair over the front shoulder
    else if (P.wavy) { const sl = P.shortHair ? 6 : 14; r(nx + 3, ny + 2, 3, sl, 'hair'); if (!ol) { r(nx + 4, ny + 4, 1, sl - 5, 'hairH'); if (!P.shortHair) r(nx + 3, ny + 13, 1, 2, 'hairH'); } }
    const hx = nx - 4 + tilt, hy = ny - 10;                         // head
    r(hx, hy, 10, 10, 'skin'); if (P.chubby) r(hx - 1, hy + 5, 12, 6, 'skin'); if (!ol) { if (P.chubby) r(hx, hy + 10, 11, 2, 'hoodDD'); r(hx, hy + 8, 10, 2, 'skinS'); r(hx + 1, hy + 4, 2, 3, 'skinS'); r(hx + 10, hy + 6, 1, 2, 'skin');
      if (hurt) { r(hx + 5, hy + 5, 4, 1, 'eye'); r(hx + 5, hy + 2, 5, 1, 'hair'); } else { r(hx + 5, hy + 4, 4, 3, 'white'); r(hx + 7, hy + 4, 2, 3, 'eye'); r(hx + 5, hy + 2, 5, 1, 'hair'); r(hx + 8, hy + 3, 2, 1, 'hair'); }
      if (P.glasses && P.rect) { r(hx + 4, hy + 2, 6, 5, 'frame'); r(hx + 5, hy + 3, 4, 3, 'lens'); r(hx + 7, hy + 4, 2, 2, 'eye'); r(hx + 1, hy + 3, 3, 1, 'frame'); }   // black rectangular glasses
      else if (P.glasses && P.round) { r(hx + 4, hy + 3, 6, 5, 'frame'); r(hx + 5, hy + 4, 4, 3, 'lens'); r(hx + 7, hy + 5, 2, 2, 'eye'); r(hx + 4, hy + 3, 1, 1, 'skin'); r(hx + 9, hy + 3, 1, 1, 'skin'); r(hx + 4, hy + 7, 1, 1, 'skin'); r(hx + 9, hy + 7, 1, 1, 'skin'); r(hx + 1, hy + 4, 3, 1, 'frame'); }   // thin round wire glasses
      else if (P.glasses) { r(hx + 4, hy + 3, 6, 6, 'frame'); r(hx + 5, hy + 4, 4, 4, 'lens'); r(hx + 7, hy + 5, 2, 2, 'eye'); r(hx + 1, hy + 4, 4, 1, 'frame'); }
      if (P.shades) { r(hx + 3, hy + 3, 7, 3, 'frame'); r(hx + 1, hy + 3, 3, 1, 'frame'); r(hx + 4, hy + 4, 5, 1, 'lens'); r(hx + 5, hy + 4, 2, 1, 'hairH'); }   // black sunglasses with a glint
      if (P.goatee) { r(hx + 5, hy + 6, 5, 1, 'stub'); r(hx + 5, hy + 9, 5, 2, 'stub'); }   // moustache + goatee
      if (hurt || shout) r(hx + 5, hy + 7, 4, 2, 'mouth'); else if (P.smile) { r(hx + 4, hy + 7, 6, 3, 'mouth'); r(hx + 5, hy + 7, 4, 2, 'white'); } else r(hx + 6, hy + 8, 3, 1, 'mouth'); }
    if (P.curly) { r(hx - 3, hy - 7, 16, 10, 'hair'); r(hx - 4, hy - 3, 3, 9, 'hair'); r(hx - 1, hy - 9, 4, 3, 'hair'); r(hx + 4, hy - 10, 4, 3, 'hair'); r(hx + 9, hy - 8, 4, 3, 'hair'); r(hx + 11, hy - 4, 2, 4, 'hair'); r(hx + 2, hy - 2, 8, 3, 'hair'); r(hx - 3, hy + 5, 3, 5, 'hair');
      if (!ol) { r(hx + 1, hy - 7, 3, 1, 'hairH'); r(hx + 6, hy - 8, 3, 1, 'hairH'); r(hx - 2, hy - 3, 2, 1, 'hairH'); r(hx + 10, hy - 6, 2, 1, 'hairH'); } } else if (P.bangs) {
      r(hx - 2, hy - 5, 14, 8, 'hair'); r(hx + 1, hy - 7, 8, 3, 'hair'); r(hx + 4, hy - 2, 8, 4, 'hair'); r(hx - 2, hy + 1, 3, 7, 'hair'); r(hx - 2, hy + 6, 2, 3, 'hair');
      if (!ol) { r(hx + 2, hy - 5, 6, 1, 'hairH'); r(hx + 6, hy - 1, 4, 1, 'hairH'); r(hx - 1, hy + 2, 1, 3, 'hairH'); } } else if (P.straight) {   // centre-parted straight hair framing the face
      const ht = P.hairT ? 'hairT' : 'hair'; r(hx - 2, hy - 4, 13, 6, ht); r(hx + 1, hy - 5, 8, 1, ht); r(hx - 2, hy + 2, 4, 9, 'hair'); r(hx + 9, hy - 1, 2, 6, 'hair');
      if (!ol) { r(hx + 1, hy - 3, 6, 1, 'hairH'); r(hx - 1, hy + 3, 1, 6, 'hairH'); } } else if (P.wavy) {
      r(hx - 2, hy - 4, 13, 8, 'hair'); r(hx + 3, hy - 6, 7, 3, 'hair'); r(hx + 8, hy - 1, 3, 7, 'hair'); r(hx - 2, hy + 2, 3, 8, 'hair');
      if (!ol) { r(hx + 1, hy - 4, 5, 1, 'hairH'); r(hx + 6, hy - 5, 3, 1, 'hairH'); r(hx + 9, hy + 1, 1, 4, 'hairH'); r(hx - 1, hy + 3, 1, 5, 'hairH'); } } else if (P.crop) { r(hx - 1, hy - 3, 12, 4, 'hair'); r(hx + 1, hy - 4, 8, 1, 'hair'); r(hx - 1, hy + 1, 2, 3, 'hairS'); if (!ol) r(hx + 2, hy - 3, 5, 1, 'hairH');   // very short crop: forehead and face stay visible
    } else if (P.fade) { r(hx - 1, hy - 3, 12, 5, 'hair'); r(hx + 1, hy - 4, 8, 2, 'hair'); r(hx - 1, hy + 1, 3, 5, 'hairS'); r(hx + 9, hy + 1, 2, 4, 'hairS');   // short fade
    } else if (P.bob) {
      r(hx - 2, hy - 4, 14, 6, 'hair'); r(hx - 4, hy, 5, 13, 'hair'); r(hx + 10, hy + 1, 2, 8, 'hair'); r(hx + 2, hy - 5, 7, 2, 'hair');
      if (!ol) { r(hx + 3, hy - 4, 6, 1, 'hairH'); r(hx - 3, hy + 3, 1, 8, 'hairH'); r(hx + 10, hy + 2, 1, 4, 'hairH'); } } else {
    r(hx - 1, hy - 3, 12, 5, 'hair'); r(hx + 2, hy - 5, 7, 3, 'hair'); r(hx + 7, hy - 4, 4, 3, 'hair'); r(hx + 5, hy - 1, 6, 3, 'hair'); r(hx - 1, hy, 3, 5, 'hair'); r(hx - 1, hy + 4, 2, 3, 'hair');
    if (!ol) { r(hx + 3, hy - 5, 4, 1, 'hairH'); r(hx + 8, hy - 4, 2, 1, 'hairH'); r(hx + 1, hy - 2, 7, 1, 'hairH'); } }
    if (P.bare || P.noHoodie) r(nx - 3, ny - 1, 9, 3, P.neckKey || 'hood'); else { r(nx - Math.round(6 * W), ny, w12, 2, 'hoodD'); if (!ol) r(nx - Math.round(6 * W), ny, w12, 1, 'hoodDD'); }   // collar / neck
    if (P.crew) { r(nx - 3, ny - 1, 9, 2, 'hoodD'); if (!ol) { r(nx - 3, ny - 1, 9, 1, 'hoodL'); r(nx - 2, ny + 1, 7, 1, 'hoodDD'); } }   // crew-neck ribbed collar
    if (P.collar) { r(nx - 3, ny - 1, 9, 3, 'hoodL'); r(nx + 1, ny - 1, 4, 3, 'skin'); r(nx + 2, ny + 2, 2, 1, 'skin'); if (!ol) { r(nx - 3, ny + 2, 4, 1, 'hoodDD'); r(nx + 4, ny + 2, 3, 1, 'hoodDD'); r(nx - 3, ny - 1, 1, 3, 'hoodD'); r(nx + 1, ny + 1, 1, 1, 'skinS'); } }   // open dress-shirt collar
    if (P.placket && !ol) { r(nx + 3, ny + 3, 1, B.torso - 5, 'hoodD'); for (let q = 5; q < B.torso - 3; q += 4) r(nx + 3, ny + q, 1, 1, 'hoodDD'); }   // button placket
    if (P.capC) { r(hx - 2, hy - 5, 13, 6, 'capC'); r(hx - 1, hy - 6, 11, 1, 'capC'); r(hx + 8, hy - 1, 6, 2, 'capC');   // baseball cap, brim forward
      if (!ol) { r(hx - 1, hy - 5, 9, 1, 'capH'); r(hx + 8, hy - 1, 6, 1, 'capH'); r(hx - 2, hy, 10, 1, 'capD');
        for (const [gx, gy] of [[0, 0], [1, 0], [0, 1], [2, 1], [0, 2], [1, 2], [0, 3], [2, 3]]) r(hx + 6 + gx, hy - 5 + gy, 1, 1, 'gold'); } }   // gold R
    if (P.beard) { r(hx + 5, hy + 9, 4, 2, 'beard'); if (!ol) { r(hx + 5, hy + 7, 5, 1, 'beard'); r(hx + 3, hy + 8, 2, 1, 'beard'); r(hx + 4, hy + 9, 1, 1, 'beard'); } }   // moustache + goatee
    arm(armF, 'hood', 'skin');
  };
  c.save(); c.translate(Math.round(f.x), Math.round(GROUND - f.y)); c.scale(f.facing, 1);
  if (S === 'lose') { const p = Math.min(1, t / 20); c.translate(-8 * p, -8 * p); c.rotate(-Math.PI / 2 * p); }
  if (flopS && t >= mv.s - 2) { const p = Math.min(1, (t - mv.s + 3) / 6); c.translate(0, -10 * p); c.rotate(Math.PI / 2 * p); }
  if (mv && mv.spin && S === 'special' && act) c.scale(Math.floor(t / 4) % 2 ? -1 : 1, 1);   // multi-kick specials flip direction every 4 frames (same as the simple renderer)
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { c.save(); c.translate(dx, dy); paint(true); c.restore(); }
  paint(false);
  if (mv && mv.zap && act) for (let q = 12; q < mv.reach + 14; q += 6) { const zy = Math.round(sy) + 3 + ((q / 6) % 2 ? -4 : 3); R(c, sx + q, zy, 6, 3, '#ffe94a'); R(c, sx + q, zy + 1, 3, 1, '#ffffff'); }
  c.restore();
}
