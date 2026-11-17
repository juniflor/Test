let ac, on = true, timer = null, step = 0;
const SFX = { light: [320, 140, .07, 'square'], heavy: [220, 70, .14, 'sawtooth'], hit: [170, 50, .12, 'square'],
  block: [520, 420, .05, 'triangle'], special: [300, 900, .25, 'sawtooth'], ko: [300, 40, .6, 'sawtooth'], beep: [660, 660, .08, 'square'] };
const NOTES = [220, 0, 262, 0, 330, 262, 294, 0, 196, 0, 247, 0, 294, 247, 262, 0];
function tone(f, d, type, vol, f2) { const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d); }
export const audio = {
  init() { try { ac ||= new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); this.music(); } catch {} },
  setOn(v) { on = v; v ? this.music() : (clearInterval(timer), timer = null); },
  sfx(n) { if (!ac || !on) return; const s = SFX[n]; if (s) tone(s[0], s[2], s[3], .12, s[1]); },
  music() { if (!ac || !on || timer) return; timer = setInterval(() => { const n = NOTES[step++ % 16]; if (n) tone(n, .16, 'triangle', .05); }, 170); },
};
