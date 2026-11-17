export const GROUND = 232, MIN_X = 16, MAX_X = 464;
export const ATK = ['light', 'heavy', 'special', 'clight', 'cheavy', 'jlight', 'jheavy'];
export class Fighter {
  constructor(id, def, x, facing) { Object.assign(this, { id, def, x, y: 0, vx: 0, vy: 0, facing, hp: def.hp, shown: def.hp, state: 'idle', t: 0, anim: 0, stun: 0, bs: 0, cd: 0, done: false, crouch: false }); }
  set(s) { if (this.state !== s) { this.state = s; this.t = 0; } }
  hurt() { const d = this.def, h = ['crouch', 'clight', 'cheavy'].includes(this.state) ? d.h * .65 : d.h; return { l: this.x - d.w / 2, r: this.x + d.w / 2, t: GROUND - this.y - h, b: GROUND - this.y }; }
  box(mv) { const d = this.def, f = this.x + this.facing * d.w / 2, l = this.facing > 0 ? f : f - mv.reach, t = GROUND - this.y - d.h + mv.y; return { l, r: l + mv.reach, t, b: t + mv.h }; }
  start(k) { this.set(k); this.t = 0; this.done = false; this.vx = 0; g_snd = this.def.moves[k].snd; if (k === 'special') this.cd = 90; }
  update(i, foe, g) {
    const d = this.def, fight = g.phase === 'fight', S = this.state; this.anim++; this.t++; if (this.cd > 0) this.cd--;
    if (g_snd) { g.sfx(g_snd); g_snd = null; }
    if (S === 'win' || S === 'lose') this.vx *= .8;
    else if (S === 'hit') { this.vx *= .88; if (this.t >= this.stun) this.set(this.y > 0 ? 'jump' : 'idle'); }
    else if (ATK.includes(S)) {
      const mv = d.moves[S];
      if (mv.type === 'proj') { if (this.t === mv.s) g.shoot(this, mv); this.vx = 0; }
      else { const act = this.t >= mv.s && this.t < mv.s + mv.a; if (mv.hop && this.t === mv.s) { this.vy = mv.hop; this.y = .01; }
        if (mv.every && act && (this.t - mv.s) % mv.every === 0) this.done = false; // multi-hit moves
        this.vx = act && mv.dash ? this.facing * mv.dash : mv.air ? this.vx : this.vx * .8;
        if (act && !this.done) { const a = this.box(mv), h = foe.hurt();
          if (a.l < h.r && a.r > h.l && a.t < h.b && a.b > h.t) { this.done = true; foe.receive(this, mv, g); } } }
      if (this.t >= mv.s + (mv.a || 0) + mv.r) this.set(this.y > 0 ? 'jump' : 'idle');
    } else if (this.bs > 0) { this.bs--; this.vx *= .85; this.set('block'); }
    else if (this.y <= 0) {
      this.facing = foe.x >= this.x ? 1 : -1;
      const blk = fight && i.block, dn = fight && i.down; this.crouch = dn && blk;
      if (fight && i.lightP) this.start(dn ? 'clight' : 'light'); else if (fight && i.heavyP) this.start(dn ? 'cheavy' : 'heavy');
      else if (fight && i.specialP && this.cd <= 0) this.start('special');
      else if (blk) { this.set('block'); this.vx = 0; }
      else if (dn) { this.set('crouch'); this.vx = 0; }
      else { const m = fight ? (i.right ? 1 : 0) - (i.left ? 1 : 0) : 0; this.vx = m * d.speed * (m === this.facing ? 1 : .8); this.set(m ? 'walk' : 'idle');
        if (fight && i.up) { this.vy = d.jump; this.y = .01; this.set('jump'); } }
    } else { this.set('jump'); if (fight && !this.airUsed && (i.lightP || i.heavyP)) { this.airUsed = true; this.start(i.heavyP ? 'jheavy' : 'jlight'); } }
    if (this.y > 0) { this.y += this.vy; this.vy -= .5; if (this.y <= 0) { this.y = 0; this.vy = 0; this.airUsed = false; if (['jump', 'jlight', 'jheavy'].includes(this.state)) this.set('idle'); } }
    this.x = Math.max(MIN_X, Math.min(MAX_X, this.x + this.vx));
    this.shown += (this.hp - this.shown) * .08;
  }
  receive(a, mv, g) {
    const front = a.x === this.x || Math.sign(a.x - this.x) === this.facing, dir = Math.sign(this.x - a.x) || -a.facing, cy = GROUND - this.y - this.def.h * .6;
    if (this.state === 'block' && front && !mv.grab) { this.hp = Math.max(0, this.hp - Math.ceil(mv.dmg * .15)); this.bs = 9; this.vx = dir * mv.kb * .7; g.fx(this.x, cy, '#9cf', 'block'); }
    else { this.hp = Math.max(0, this.hp - mv.dmg); this.set('hit'); this.t = 0; if (mv.launch) { this.vy = mv.launch; this.y = .01; } this.stun = mv.hs; this.vx = dir * mv.kb; g.fx(this.x, cy, '#fd5', 'hit'); }
  }
}
let g_snd = null;
