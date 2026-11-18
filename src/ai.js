export const makeAI = () => ({ t: 0, mode: 'approach', blk: 0 });
export function aiThink(ai, me, foe) {
  const d = Math.abs(foe.x - me.x), dir = foe.x > me.x ? 'right' : 'left', away = dir === 'right' ? 'left' : 'right';
  const i = { left: false, right: false, up: false, down: false, block: false, lightP: false, heavyP: false, specialP: false };
  if (--ai.t <= 0) { ai.t = 12 + Math.random() * 25; const r = Math.random();
    ai.mode = d > 120 ? (r < .75 ? 'approach' : 'special') : d > 55 ? (r < .6 ? 'approach' : r < .75 ? 'special' : 'attack') :
      (r < .55 ? 'attack' : r < .75 ? 'retreat' : r < .9 ? 'block' : 'approach'); }
  const foeAtk = ['light', 'heavy', 'special', 'clight', 'cheavy', 'jlight', 'jheavy'].includes(foe.state);
  if (me.conf && Math.random() < .1) { const o = me.options(); if (o.length) { const pool = me.hint(o), k = pool[Math.random() * pool.length | 0]; // keep the combo going
    i.down = k[0] === 'c'; if (k === 'special') i.specialP = true; else if (k.endsWith('light')) i.lightP = true; else i.heavyP = true; return i; } }
  if (me.y > 0 && d < 70 && Math.random() < .1) { if (Math.random() < .5) i.lightP = true; else i.heavyP = true; return i; }
  if (ai.blk <= 0 && foeAtk && d < 65 && foe.t < 6 && Math.random() < .4) ai.blk = 20 + Math.random() * 15;
  if (ai.blk > 0) { ai.blk--; i.block = true; return i; }
  switch (ai.mode) {
    case 'approach': if (d > 34) i[dir] = true; if (Math.random() < .004) i.up = true; break;
    case 'retreat': i[away] = true; break;
    case 'block': i.block = true; break;
    case 'special': { const sp = me.def.moves.special, prj = sp.type === 'proj', rng = prj ? 0 : sp.reach + (sp.dash ? sp.dash * sp.a * .5 : 0);
      if (me.cd <= 0 && (prj ? d > 70 : d < rng + 12) && Math.random() < .3) { i.specialP = true; ai.mode = 'approach'; }
      else if (prj ? d < 80 : d > rng) i[prj ? away : dir] = true; break; }
    case 'attack': if (d > 38) i[dir] = true; else if (Math.random() < .12) { if (Math.random() < .25) i.down = true; if (Math.random() < .6) i.lightP = true; else i.heavyP = true; } break;
  }
  return i;
}
