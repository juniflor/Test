import { CHAIN, MAX_CHAIN, comboSet } from './combos.js';
export const GROUND = 232, MIN_X = 16, MAX_X = 464;
export const ATK = ['light', 'heavy', 'special', 'clight', 'cheavy', 'jlight', 'jheavy', 'throw'];
export class Fighter {
  constructor(id, def, x, facing) { Object.assign(this, { id, def, x, y: 0, vx: 0, vy: 0, facing, hp: def.hp, shown: def.hp, state: 'idle', t: 0, anim: 0, stun: 0, bs: 0, cd: 0, done: false, crouch: false,
    cs: comboSet(def), chain: [], cur: null, conf: false, buf: null, hits: 0, hitsT: 0, comboName: '', comboT: 0, grace: 0, lag: 0 }); }
  set(s) { if (this.state !== s) { this.state = s; this.t = 0; } }
  hurt() { const d = this.def, h = ['crouch', 'clight', 'cheavy'].includes(this.state) ? d.h * .65 : d.h; return { l: this.x - d.w / 2, r: this.x + d.w / 2, t: GROUND - this.y - h, b: GROUND - this.y }; }
  box(mv) { const d = this.def, f = this.x + this.facing * d.w / 2, l = this.facing > 0 ? f : f - mv.reach, t = GROUND - this.y - d.h + mv.y; return { l, r: l + mv.reach, t, b: t + mv.h }; }
  start(k, c) { const b = this.def.moves[k]; this.set(k); this.t = 0; this.done = false; this.vx = 0; this.conf = false; g_snd = b.snd; if (k === 'special') this.cd = 90;
    this.cur = c ? { ...b, dmg: Math.round(b.dmg * (c.dmg || 1)), kb: b.kb * (c.kb || 1), launch: c.launch ?? b.launch, hs: b.hs + (c.hs || 0), final: !!c.final, combo: c } : null; }
  begin(k) { this.chain = [k]; this.buf = null; this.comboName = ''; this.comboT = 0; this.start(k); } // a fresh attack from neutral
  bufferInput(i) { const dn = i.down, k = i.lightP && i.heavyP ? null : i.lightP ? (dn ? 'clight' : 'light') : i.heavyP ? (dn ? 'cheavy' : 'heavy') : i.specialP ? 'special' : null; if (k) this.buf = { k, ttl: 14 }; }
  options() { // moves we may cancel into right now
    const ch = this.chain, cur = ch[ch.length - 1], tbl = (this.cs.chain && this.cs.chain[cur]) || CHAIN[cur] || [], rep = this.cs.repeat || ['light', 'clight'];
    let run = 0; for (let j = ch.length - 1; j >= 0 && ch[j] === cur; j--) run++;
    if (ch.length >= MAX_CHAIN) return [];
    return tbl.filter(k => this.def.moves[k] && (k !== cur || (rep.includes(k) && run < 3)) && !(k === 'special' && this.cd > 0));
  }
  hint(o) { const ch = this.chain, good = o.filter(k => this.cs.combos.some(c => c.seq.length > ch.length && ch.every((x, j) => c.seq[j] === x) && c.seq[ch.length] === k)); return good.length ? good : o; } // AI helper
  matchCombo() { const ch = this.chain, best = m => { let b = null;   // longest combo that ends the chain
      for (const c of this.cs.combos) { const n = c.seq.length; if (n <= m.length && c.seq.every((k, j) => m[m.length - n + j] === k) && (!b || n > b.seq.length)) b = c; } return b; };
    // exact first; then be forgiving about DOWN being held the whole time (cheavy counts as heavy, later clight counts as light)
    return best(ch) || best(ch.map(x => x === 'cheavy' ? 'heavy' : x)) || best(ch.map((x, j) => x === 'cheavy' ? 'heavy' : j > 0 && x === 'clight' ? 'light' : x)); }
  tryCancel(foe, mv, g) {
    if (mv.final || mv.every || !this.buf) return false;
    const k = this.buf.k; if (!this.options().includes(k)) return false;
    this.buf = null; this.chain.push(k); const c = this.matchCombo(); this.start(k, c);
    if (c) { this.comboName = c.name; this.comboT = 110; if (g && g.combo) g.combo(this, c); }
    if (foe.state === 'hit') { const b = this.def.moves[k], lead = b.type === 'proj' ? b.s + Math.ceil(Math.max(0, Math.abs(foe.x - this.x) - 14) / b.speed) + 3 : b.s + 4; // frames until the next hit lands
      foe.stun = Math.max(foe.stun, foe.t + lead); // keep them stunned until then
      // follow the knocked-back foe: step in so the next move still reaches (foe slides about 7x its vx; our own slide is about 4x our vx)
      const fx = foe.x + foe.vx * 7, gap = Math.abs(fx - this.x) - (this.def.w + foe.def.w) / 2 - (b.reach || 0) * .5; this.vx = this.facing * Math.max(0, Math.min(7, gap / 4)) || 0; }   // projectiles have no reach: guard against NaN
    return true;
  }
  link(i, foe, g) { this.bufferInput(i); const mv = this.cur || this.def.moves[this.chain[this.chain.length - 1]]; return !!mv && this.tryCancel(foe, mv, g); }
  update(i, foe, g) {
    const d = this.def, fight = g.phase === 'fight', S = this.state; this.anim++; this.t++; if (this.cd > 0) this.cd--;
    if (this.hitsT > 0) this.hitsT--; else this.hits = 0; if (this.comboT > 0) this.comboT--; if (this.grace > 0) this.grace--; if (this.buf && --this.buf.ttl <= 0) this.buf = null;
    if (!ATK.includes(S) && !(this.grace > 0)) { this.chain.length = 0; this.cur = null; this.conf = false; this.buf = null; }
    if (g_snd) { g.sfx(g_snd); g_snd = null; }
    if (S === 'win' || S === 'lose') this.vx *= .8;
    else if (S === 'hit') { this.vx *= .88; if (this.t >= this.stun) this.set(this.y > 0 ? 'jump' : 'idle'); }
    else if (ATK.includes(S)) {
      if (fight && this.t <= 3 && !this.conf && this.y <= 0 && ((S === 'light' && i.heavyP) || (S === 'heavy' && i.lightP))) this.begin('throw');   // Light + Heavy a hair apart still counts as a throw
      const mv = this.cur || d.moves[this.state]; if (fight) this.bufferInput(i);
      if (mv.type === 'proj') { if (this.t === mv.s) g.shoot(this, mv); this.vx = 0; }
      else { const act = this.t >= mv.s && this.t < mv.s + mv.a; if (mv.hop && this.t === mv.s) { this.vy = mv.hop; this.y = .01; }
        if (mv.every && act && (this.t - mv.s) % mv.every === 0) this.done = false; // multi-hit moves
        this.vx = act && mv.dash ? this.facing * mv.dash : mv.air ? this.vx : this.vx * .8;
        if (act && !this.done) { const a = this.box(mv), h = foe.hurt();
          if (a.l < h.r && a.r > h.l && a.t < h.b && a.b > h.t && !(mv.throw && (foe.y > 0 || foe.state === 'hit'))) { this.done = true; if (foe.receive(this, mv, g)) this.conf = true; } }
        if (fight && this.conf) this.tryCancel(foe, mv, g); }
      if (this.t >= mv.s + (mv.a || 0) + mv.r) { if (this.conf && !mv.final && !mv.every) this.grace = 6; this.set(this.y > 0 ? 'jump' : 'idle'); }   // grace: a few extra frames to keep the combo going
    } else if (this.bs > 0) { this.bs--; this.vx *= .85; this.set('block'); }
    else if (this.y <= 0) {
      this.facing = foe.x >= this.x ? 1 : -1;
      if (this.lag > 0) { this.lag--; this.vx *= .5; this.set('idle'); }   // landing lag after a flying attack
      else if (fight && this.grace > 0 && this.link(i, foe, g)) { /* chained into the next move */ } else {
      const blk = fight && i.block, dn = fight && i.down; this.crouch = dn && blk;
      if (fight && i.lightP && i.heavyP) this.begin('throw'); else if (fight && i.lightP) this.begin(dn ? 'clight' : 'light'); else if (fight && i.heavyP) this.begin(dn ? 'cheavy' : 'heavy');
      else if (fight && i.specialP && this.cd <= 0) this.begin('special');
      else if (blk) { this.set('block'); this.vx = 0; }
      else if (dn) { this.set('crouch'); this.vx = 0; }
      else { const m = fight ? (i.right ? 1 : 0) - (i.left ? 1 : 0) : 0; this.vx = m * d.speed * (m === this.facing ? 1 : .8); this.set(m ? 'walk' : 'idle');
        if (fight && i.up) { this.vy = d.jump; this.y = .01; this.set('jump'); } } }
    } else { this.set('jump'); if (fight && !this.airUsed && (i.lightP || i.heavyP)) { this.airUsed = true; this.begin(i.heavyP ? 'jheavy' : 'jlight'); } }
    if (this.y > 0) { this.y += this.vy; this.vy -= .5; if (this.y <= 0) { this.y = 0; this.vy = 0; this.airUsed = false; if (this.state === 'jlight' || this.state === 'jheavy') this.lag = this.def.moves[this.state].land || 0; if (['jump', 'jlight', 'jheavy'].includes(this.state)) this.set('idle'); } }
    if (!Number.isFinite(this.vx)) this.vx = 0;
    this.x = Math.max(MIN_X, Math.min(MAX_X, this.x + this.vx));
    this.shown += (this.hp - this.shown) * .08;
  }
  receive(a, mv, g) {   // def.taken > 1 (set per fighter) = weak defense: takes extra damage
    const front = a.x === this.x || Math.sign(a.x - this.x) === this.facing, dir = Math.sign(this.x - a.x) || -a.facing, cy = GROUND - this.y - this.def.h * .6;
    if (this.state === 'block' && !mv.grab) {   // blocks work from either side (no cross-up cheese); throws (grab) go through
      this.hp = Math.max(0, this.hp - Math.ceil(mv.dmg * .15 * (this.def.taken || 1))); this.bs = 9; this.vx = dir * Math.max(3, mv.kb * 1.6);   // every blocked hit shoves the defender back
      if (!a.o && (this.x < MIN_X + 16 || this.x > MAX_X - 16 || a.y > 0)) a.vx = -dir * Math.max(3.5, mv.kb * 1.5);   // cornered, or hit by a jump-in: the attacker is pushed away instead
      g.fx(this.x, cy, '#9cf', 'block'); return false; }
    const atk = a.o || a, idx = Math.max(0, ((atk.chain && atk.chain.length) || 1) - 1), sc = Math.max(.6, 1 - .08 * idx); // later moves in a chain hit a bit softer
    atk.hits = this.state === 'hit' ? (atk.hits || 0) + 1 : 1; atk.hitsT = 80;
    this.hp = Math.max(0, this.hp - Math.max(1, Math.round(mv.dmg * sc * (this.def.taken || 1)))); this.set('hit'); this.t = 0; this.grace = 0; this.lag = 0; if (mv.combo && g.impact) g.impact(atk, mv, this); if (mv.launch) { this.vy = mv.launch; this.y = .01; } this.stun = mv.hs; this.vx = dir * mv.kb; g.fx(this.x, cy, '#fd5', 'hit');
    return true;
  }
}
let g_snd = null;
