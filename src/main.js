import { CHARACTERS, ROSTER } from './characters.js';
import { Fighter, GROUND } from './fighter.js';
import { drawFighter, drawStage, shadow } from './sprites.js';
import { poll, pressed, held, hit, endFrame, padCount, padStatus, takeEvents, ACTIONS, PAD_ACTIONS, captureKey, capturePad, getKey, getPad, setKey, setPad, resetKey, resetPad, resetAll } from './input.js';
import { makeAI, aiThink } from './ai.js';
import { drawWithFx, drawParticles, drawWaves, drawOverlay, stepFx, announce as fxAnnounce, impact as fxImpact } from './comboFx.js';
import { audio } from './audio.js';
import './touch.js';

const cv = document.getElementById('c'), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
const saved = (() => { try { return JSON.parse(localStorage.getItem('pixelfighter')) || {}; } catch { return {}; } })();
const S = { sound: saved.sound ?? true, mode: saved.mode ?? 'pvp', sel: saved.sel ?? [0, 1] };
const save = () => { try { localStorage.setItem('pixelfighter', JSON.stringify(S)); } catch {} };
audio.setOn(S.sound);
addEventListener('pointerdown', () => audio.init(), { once: true });
addEventListener('keydown', () => audio.init(), { once: true });

let O = null;   // online session (null when offline)
let scene = 'menu', sel = 0, M = null, lock = [false, false], goT = 0, paused = false;
const txt = (s, x, y, size = 8, col = '#fff', al = 'center') => { c.font = `bold ${size}px monospace`; c.textAlign = al; c.fillStyle = '#000'; c.fillText(s, x + 1, y + 1); c.fillStyle = col; c.fillText(s, x, y); };
const LISTS = {
  menu: () => ['VERSUS MODE', 'PLAY ONLINE', 'CONTROLS', 'REMAP CONTROLS', 'SOUND: ' + (S.sound ? 'ON' : 'OFF')],
  versus: () => ['PLAYER vs PLAYER', 'PLAYER vs CPU', 'BACK'],
  online: () => ['HOST GAME', 'JOIN GAME', 'BACK'],
  results: () => O ? ['PLAY AGAIN', 'LEAVE'] : ['REMATCH', 'CHARACTER SELECT', 'MAIN MENU'],
};
const go = s => { scene = s; sel = 0; };
function activate(i) {
  audio.sfx('beep');
  if (scene === 'menu') { if (i === 0) go('versus'); else if (i === 1) go('online'); else if (i === 2) go('controls'); else if (i === 3) { R.page = 0; R.p = 0; R.row = 0; R.wait = false; R.msg = ''; go('remap'); } else { S.sound = !S.sound; audio.setOn(S.sound); save(); } }
  else if (scene === 'online') { if (i === 0) hostGame(); else if (i === 1) { const code = (prompt('Enter the room code:') || '').trim().toUpperCase(); if (code) joinGame(code); } else go('menu'); }
  else if (scene === 'results' && O) { if (i === 0) { lock[O.me] = false; O.send({ t: 'lock', v: false }); goT = 0; go('select'); } else { leaveOnline(); go('menu'); } }
  else if (scene === 'versus') { if (i === 2) go('menu'); else { S.mode = i ? 'cpu' : 'pvp'; save(); lock = [false, false]; goT = 0; go('select'); } }
  else if (scene === 'results') { if (i === 0) startMatch(); else if (i === 1) { lock = [false, false]; goT = 0; go('select'); } else go('menu'); }
}
cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), y = (e.clientY - r.top) * 270 / r.height;
  if (scene === 'controls') return go('menu');
  if (scene === 'remap') { if (R.wait) return; const x = (e.clientX - r.left) * 480 / r.width;
    if (y < 56 && y > 38) { R.page = x > 240 ? 1 : 0; R.row = 0; R.msg = ''; return; }
    const i = Math.floor((y - 74) / 16); if (i >= 0 && i <= remapRows()) { R.row = i; if (!R.page && i < ACTIONS.length) R.p = x > 240 ? 1 : 0; remapSelect(); } return; }
  if (scene === 'lobby') { if (O && O.me === 0) { try { navigator.clipboard.writeText(roomLink()); toasts.push({ s: 'Invite link copied!', t: 120 }); } catch {} } return; }
  const l = LISTS[scene]?.(); if (!l) return;
  const i = Math.floor((y - (scene === 'results' ? 168 : 128)) / 22); if (i >= 0 && i < l.length) activate(i); });
cv.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(), y = (e.clientY - r.top) * 270 / r.height, l = LISTS[scene]?.();
  if (l) { const i = Math.floor((y - (scene === 'results' ? 168 : 128)) / 22); if (i >= 0 && i < l.length) sel = i; } });

const any = a => pressed(0, a) || pressed(1, a);
function startMatch() {
  const ids = [ROSTER[S.sel[0]], ROSTER[S.sel[1]]];
  M = { cpu: S.mode === 'cpu', ids, wins: [0, 0], round: 1, phase: 'intro', pt: 0, timer: 7200, fx_: [], projs: [], ai: makeAI(), msg: '', winner: -1, over: false,
    sfx: n => audio.sfx(n), stop: 0, shake: 0, flash: null, banner: null, waves: [],
    combo(att, cb) { fxAnnounce(this, att, cb); }, impact(att, mv, foe) { fxImpact(this, att, mv, foe); },
    fx(x, y, col, snd) { audio.sfx(snd); for (let i = 0; i < 8; i++) this.fx_.push({ x, y, vx: (Math.random() - .5) * 4, vy: (Math.random() - .7) * 3, l: 14, col }); },
    shoot(o, mv) { this.projs.push({ x: o.x + o.facing * 14, y: GROUND - o.y - o.def.h * .6, vx: o.facing * mv.speed, facing: o.facing, o, mv }); } };
  if (O) { M.cpu = false; M.frame = 0; M.loc = {}; M.pm = [0, 0]; O.rem = {}; for (let f = 0; f < DELAY; f++) { M.loc[f] = 0; O.rem[f] = 0; } lock = [false, false]; goT = 0; }
  newRound(); scene = 'match'; paused = false;
}
function newRound() {
  M.f = [new Fighter('p1', CHARACTERS[M.ids[0]], 150, 1), new Fighter('p2', CHARACTERS[M.ids[1]], 330, -1)];
  M.f.forEach(f => f.def.id = f.def.id || null); M.stop = 0; M.flash = null; M.banner = null; M.waves = []; M.timer = 7200; M.phase = 'intro'; M.pt = 0; M.projs = []; M.msg = 'ROUND ' + M.round;
}
const intent = p => ({ left: held(p, 'left'), right: held(p, 'right'), up: held(p, 'up'), down: held(p, 'down'), block: held(p, 'block'),
  lightP: pressed(p, 'light'), heavyP: pressed(p, 'heavy'), specialP: pressed(p, 'special') });
function endRound(ko) {
  const [a, b] = M.f; M.phase = 'end'; M.pt = 0; audio.sfx('ko');
  const w = a.hp > b.hp ? 0 : b.hp > a.hp ? 1 : -1; M.rw = w; M.msg = w < 0 ? 'DRAW' : ko ? 'K.O.' : 'TIME UP';
  if (w >= 0) { M.wins[w]++; M.f[w].set('win'); M.f[1 - w].set('lose'); }
}
function matchUpdate() {
  if (hit('KeyP') && !O) paused = !paused; if (hit('Escape')) { if (O) leaveOnline(); return go('menu'); }
  if (paused) return; const m = M, [a, b] = m.f;
  let ia, ib; if (O) { const r = onlineStep(m); if (!r) return; [ia, ib] = r; } m.pt++;
  if (m.phase === 'intro' && m.pt > 100) { m.phase = 'fight'; m.pt = 0; m.msg = 'FIGHT!'; audio.sfx('beep'); }
  if (m.phase === 'fight' && m.pt > 50) m.msg = '';
  if (!O) { ia = intent(0); ib = m.cpu ? aiThink(m.ai, b, a) : intent(1); }
  stepFx(m); if (m.stop > 0) { m.stop--; a.bufferInput(ia); b.bufferInput(ib); return; }   // hit-stop: freeze, but remember button presses
  a.update(ia, b, m); b.update(ib, a, m);
  const dx = b.x - a.x, ov = (a.def.w + b.def.w) / 2 - Math.abs(dx);
  if (ov > 0 && a.y < 30 && b.y < 30) { const s = dx >= 0 ? 1 : -1; a.x -= s * ov / 2; b.x += s * ov / 2; }
  for (const p of m.projs) { p.x += p.vx; const t = p.o === a ? b : a, h = t.hurt(), hs = (p.mv.size || 10) / 2;
    if (p.x + hs > h.l && p.x - hs < h.r && p.y + hs > h.t && p.y - hs < h.b) { p.dead = true; t.receive(p, p.mv, m); } if (p.x < -10 || p.x > 490) p.dead = true; }
  m.projs = m.projs.filter(p => !p.dead);
  m.fx_.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += p.g ?? .15; p.l--; }); m.fx_ = m.fx_.filter(p => p.l > 0);
  if (m.phase === 'fight') { m.timer--; if (a.hp <= 0 || b.hp <= 0) endRound(true); else if (m.timer <= 0) endRound(false); }
  else if (m.phase === 'end' && m.pt > 150) {
    const w = m.wins.findIndex(x => x >= 2);
    if (w >= 0) { m.winner = w; m.phase = 'over'; scene = 'results'; sel = 0; } else { if (m.rw >= 0 || true) m.round++; newRound(); } }
}
function drawHUD() {
  const m = M;
  m.f.forEach((f, i) => { const x = i ? 262 : 18, w = 200; c.fillStyle = '#000'; c.fillRect(x - 2, 14, w + 4, 12);
    c.fillStyle = '#a22'; const sw = w * Math.max(0, f.shown) / f.def.hp; c.fillStyle = '#a22'; c.fillRect(i ? x + w - sw : x, 16, sw, 8);
    c.fillStyle = f.hp / f.def.hp > .3 ? '#3d6' : '#ee3'; const hw = w * Math.max(0, f.hp) / f.def.hp; c.fillRect(i ? x + w - hw : x, 16, hw, 8);
    txt((O ? (i === O.me ? 'YOU ' : 'OPP ') : i ? (m.cpu ? 'CPU ' : 'P2 ') : 'P1 ') + f.def.name, i ? x + w : x, 38, 8, '#fff', i ? 'right' : 'left');
    for (let k = 0; k < 2; k++) { c.fillStyle = k < m.wins[i] ? '#fc3' : '#333'; c.fillRect(i ? x + k * 10 : x + w - 8 - k * 10, 42, 8, 5); } });
  m.f.forEach((f, i) => { const x = i ? 462 : 18, al = i ? 'right' : 'left';
    if (f.hits >= 2 && f.hitsT > 0) txt(f.hits + ' HITS!', x, 66, 12, '#fc3', al);
    if (f.comboName && f.comboT > 0) txt(f.comboName, x, 80, 9, '#fff', al); });
  txt(String(Math.ceil(m.timer / 60)).padStart(2, '0'), 240, 28, 16, '#fff');
  if (m.msg) txt(m.msg, 240, 110, 24, '#fc3');
  if (paused) txt('PAUSED  (P resume, Esc quit)', 240, 140, 10);
}
function drawMatch() {
  c.save(); if (M.shake > 0) c.translate(Math.round((Math.random() - .5) * M.shake), Math.round((Math.random() - .5) * M.shake));
  drawStage(c); M.f.forEach(f => shadow(c, f)); drawWaves(c, M);
  const order = M.f[0].state === 'lose' ? [0, 1] : [1, 0]; order.forEach(i => drawWithFx(c, M.f[i], drawFighter));
  M.projs.forEach(p => { const z = p.mv.size || 10; c.globalAlpha = z > 10 ? .75 : 1; c.fillStyle = p.mv.col; c.fillRect(p.x - z / 2, p.y - z * .4, z, z * .8); c.fillStyle = '#fff'; c.fillRect(p.x - 2, p.y - 2, 4, 4); c.globalAlpha = 1; });
  drawParticles(c, M.fx_); c.restore(); drawOverlay(c, M); drawHUD();
}
function drawList(y) { LISTS[scene]().forEach((s, i) => txt((i === sel ? '> ' : '  ') + s + (i === sel ? ' <' : '  '), 240, y + i * 22 + 12, 12, i === sel ? '#fc3' : '#fff')); }
function menuNav() {
  const l = LISTS[scene]?.(); if (!l) return;
  if (any('up')) sel = (sel + l.length - 1) % l.length; if (any('down')) sel = (sel + 1) % l.length;
  if (any('light') || hit('Enter') || hit('Space')) activate(sel);
  if (hit('Escape') && scene !== 'results') go(scene === 'versus' ? 'menu' : 'menu');
}
function selectUpdate() {
  if (O) return onlineSelectUpdate();
  if (hit('Escape')) return go('versus');
  for (let p = 0; p < 2; p++) { if (p === 1 && S.mode === 'cpu') continue; if (lock[p]) { if (pressed(p, 'heavy')) lock[p] = false; continue; }
    if (pressed(p, 'left')) S.sel[p] = (S.sel[p] + ROSTER.length - 1) % ROSTER.length; if (pressed(p, 'right')) S.sel[p] = (S.sel[p] + 1) % ROSTER.length;
    if (pressed(p, 'light') || (p === 0 && (hit('Enter') || hit('Space')))) { lock[p] = true; audio.sfx('beep'); }
    if (p === 0 && pressed(0, 'heavy') && false) go('versus'); }
  if (S.mode === 'cpu') { if (lock[0] && !lock[1]) { S.sel[1] = Math.floor(Math.random() * ROSTER.length); lock[1] = true; } if (!lock[0]) lock[1] = false; }
  if (lock[0] && lock[1]) { if (++goT > 45) { save(); startMatch(); } } else goT = 0;
}
function drawSelect() {
  drawStage(c); txt('SELECT YOUR FIGHTER', 240, 34, 16, '#fc3');
  for (let p = 0; p < 2; p++) { const cx = p ? 360 : 120, id = ROSTER[S.sel[p]], def = CHARACTERS[id];
    txt(O ? (p === O.me ? 'YOU' : 'OPPONENT') : p ? (S.mode === 'cpu' ? 'CPU' : 'PLAYER 2') : 'PLAYER 1', cx, 60, 10, p ? '#f77' : '#7ef');
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(cx - 50, 70, 100, 130); const f = { def, x: cx, y: 0, facing: p ? -1 : 1, state: 'idle', t: 0, anim: performance.now() / 16 | 0 };
    c.save(); c.translate(0, -GROUND + 190); drawFighter(c, f); c.restore();
    txt((lock[p] ? '' : '< ') + def.name + (lock[p] ? ' READY' : ' >'), cx, 218, 10, lock[p] ? '#3f6' : '#fff'); }
  for (let p = 0; p < 2; p++) { const st = CHARACTERS[ROSTER[S.sel[p]]].stats, cx = p ? 360 : 120; txt('SPD ' + st.spd + '  ATK ' + st.atk + '  HP ' + st.hp, cx, 228, 7, '#fc3'); }
  const tw = 18, x0 = 240 - ROSTER.length * tw / 2;
  ROSTER.forEach((id, i) => { const d = CHARACTERS[id], x = x0 + i * tw; c.fillStyle = '#000'; c.fillRect(x, 233, 16, 16);
    c.fillStyle = d.top; c.fillRect(x + 2, 241, 12, 6); c.fillStyle = d.skin; c.fillRect(x + 4, 236, 8, 6); c.fillStyle = d.hair; c.fillRect(x + 3, 235, 10, 3);
    if (S.sel[0] === i) { c.strokeStyle = '#7ef'; c.strokeRect(x + .5, 233.5, 15, 15); } if (S.sel[1] === i) { c.strokeStyle = '#f77'; c.strokeRect(x + 2.5, 235.5, 11, 11); } });
  txt('MOVE: left/right   CONFIRM: Light   CANCEL: Heavy   ESC: back', 240, 262, 7, '#ccc'); txt(padStatus(), 240, 12, 7, '#8f8');
}
// ---- remap screen: rebind keyboard keys (both players) and gamepad buttons; saved in localStorage ----
const R = { page: 0, p: 0, row: 0, wait: false, msg: '', cool: 0 };
const KN = { ArrowLeft: 'LEFT', ArrowRight: 'RIGHT', ArrowUp: 'UP', ArrowDown: 'DOWN', ShiftLeft: 'L-SHIFT', ShiftRight: 'R-SHIFT', ControlLeft: 'L-CTRL', ControlRight: 'R-CTRL', AltLeft: 'L-ALT', AltRight: 'R-ALT',
  Space: 'SPACE', Backspace: 'BKSP', Semicolon: ';', Comma: ',', Period: '.', Slash: '/', Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=', Backquote: '`' };
const keyName = c => !c ? '?' : KN[c] || (c.startsWith('Key') ? c.slice(3) : c.startsWith('Digit') ? c.slice(5) : c.startsWith('Numpad') ? 'NUM' + c.slice(6).toUpperCase() : c.toUpperCase());
const PN = ['A/CROSS', 'B/CIRCLE', 'X/SQUARE', 'Y/TRIANGLE', 'LB', 'RB', 'LT', 'RT', 'BACK', 'START', 'L3', 'R3'], padName = i => PN[i] || 'BTN ' + i;
const ACT_NAME = { left: 'LEFT', right: 'RIGHT', up: 'JUMP', down: 'CROUCH', light: 'PUNCH', heavy: 'KICK', special: 'SPECIAL', block: 'BLOCK' };
const RESERVED = ['Escape', 'Enter', 'KeyP', 'KeyM', 'Tab'];
const remapRows = () => R.page ? PAD_ACTIONS.length : ACTIONS.length;   // the row after these is RESET ALL
function remapSelect() {
  const n = remapRows(); if (R.row === n) { resetAll(); R.msg = 'All controls reset to defaults'; return; }
  R.wait = true; R.msg = '';
  if (!R.page) { const p = R.p, a = ACTIONS[R.row];
    captureKey(code => { R.wait = false; R.cool = 20; if (code === 'Escape') return; if (RESERVED.includes(code)) { R.msg = keyName(code) + ' is reserved'; return; } setKey(p, a, code); R.msg = ACT_NAME[a] + ' = ' + keyName(code); }); }
  else { const a = PAD_ACTIONS[R.row]; capturePad(i => { R.wait = false; R.cool = 20; setPad(a, i); R.msg = ACT_NAME[a] + ' = ' + padName(i); }); }
}
function remapUpdate() {
  if (R.cool > 0) R.cool--;
  if (R.wait) { if (R.page && hit('Escape')) { capturePad(null); R.wait = false; R.cool = 20; } return; }
  if (R.cool > 0) return;
  if (hit('Escape')) return go('menu');
  const n = remapRows();
  if (any('up') || hit('ArrowUp')) R.row = (R.row + n) % (n + 1); if (any('down') || hit('ArrowDown')) R.row = (R.row + 1) % (n + 1);
  if (!R.page) { if (any('left') || hit('ArrowLeft')) R.p = 0; if (any('right') || hit('ArrowRight')) R.p = 1; }
  if (hit('Tab')) { R.page ^= 1; R.row = 0; R.msg = ''; }
  if (hit('Delete') || hit('Backspace')) { if (R.row < n) { if (R.page) resetPad(PAD_ACTIONS[R.row]); else resetKey(R.p, ACTIONS[R.row]); R.msg = 'Reset to default'; } }
  if (hit('Enter') || any('light')) remapSelect();
}
function drawRemap() {
  drawStage(c); c.fillStyle = 'rgba(0,0,0,.75)'; c.fillRect(20, 12, 440, 248); txt('REMAP CONTROLS', 240, 32, 14, '#fc3');
  txt('KEYBOARD', 190, 50, 8, R.page ? '#777' : '#7ef'); txt('GAMEPAD', 290, 50, 8, R.page ? '#7ef' : '#777');
  const n = remapRows(), W = R.wait, blink = (performance.now() / 300 | 0) % 2;
  if (!R.page) for (let p = 0; p < 2; p++) { const x0 = p ? 250 : 30; txt(p ? 'PLAYER 2' : 'PLAYER 1', x0 + 100, 68, 9, p ? '#f77' : '#7ef');
    ACTIONS.forEach((a, i) => { const on = R.row === i && R.p === p, y = 82 + i * 16;
      txt((on ? '> ' : '  ') + ACT_NAME[a], x0, y, 8, on ? '#fc3' : '#fff', 'left'); txt(on && W ? (blink ? 'PRESS KEY' : '') : keyName(getKey(p, a)), x0 + 200, y, 8, on ? '#fc3' : '#9cf', 'right'); }); }
  else PAD_ACTIONS.forEach((a, i) => { const on = R.row === i, y = 82 + i * 16;
    txt((on ? '> ' : '  ') + ACT_NAME[a], 130, y, 8, on ? '#fc3' : '#fff', 'left'); txt(on && W ? (blink ? 'PRESS BUTTON' : '') : getPad(a).map(padName).join('/'), 350, y, 8, on ? '#fc3' : '#9cf', 'right'); });
  const rOn = R.row === n; txt((rOn ? '> ' : '  ') + 'RESET ALL TO DEFAULTS', 240, 82 + n * 16, 8, rOn ? '#fc3' : '#f99');
  txt(R.msg, 240, 234, 8, '#8f8');
  txt(W ? 'Press the new ' + (R.page ? 'button' : 'key') + '  (ESC = cancel)' : 'UP/DOWN pick   ' + (R.page ? '' : 'LEFT/RIGHT player   ') + 'ENTER/PUNCH rebind   DEL default   TAB keyboard/gamepad   ESC back', 240, 250, 6, '#ccc');
}
function drawControls() {
  const k = (p, a) => keyName(getKey(p, a)), pb = a => getPad(a).map(padName).join('/');
  drawStage(c); c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(30, 20, 420, 230); txt('CONTROLS', 240, 44, 16, '#fc3');
  [`P1: ${k(0, 'left')}/${k(0, 'right')} move  ${k(0, 'up')} jump  ${k(0, 'down')} crouch  ${k(0, 'light')} punch  ${k(0, 'heavy')} kick  ${k(0, 'special')} special  ${k(0, 'block')} block`,
   `P2: ${k(1, 'left')}/${k(1, 'right')} move  ${k(1, 'up')} jump  ${k(1, 'down')} crouch  ${k(1, 'light')} punch  ${k(1, 'heavy')} kick  ${k(1, 'special')} special  ${k(1, 'block')} block`,
   'Gamepads auto-assign (pad1=P1, pad2=P2); Back/Select swaps; mix with keyboard', `Pad: stick/d-pad move  ${pb('light')} punch  ${pb('heavy')} kick  ${pb('special')} special  ${pb('up')} jump  ${pb('block')} block`, 'P pause   M sound   Esc back', 'Win 2 of 3 rounds. 2 min per round.', 'Light=punch, Heavy=kick. Hold DOWN: low punch / sweep. In air: flying punch / kick', 'Press any key / click to return']
    .forEach((s, i) => txt(s, 240, 76 + i * 20, 8));
  if (hit('Escape') || hit('Enter') || hit('Space') || any('light')) go('menu');
}
const toasts = [];
function frame() {
  poll(); for (const e of takeEvents()) { toasts.push({ s: e.text, t: 240 }); if (e.type === 'off' && scene === 'match' && !O) paused = true; } if (hit('KeyM')) { S.sound = !S.sound; audio.setOn(S.sound); save(); }
  if (scene === 'match') { matchUpdate(); if (scene === 'match') drawMatch(); }
  if (scene === 'menu') { drawStage(c); txt('PIXEL FIGHTER', 240, 70, 28, '#fc3'); txt('JUNIOR vs MARTY', 240, 92, 10, '#7ef'); txt('build 1.4.0 (online + touch + remap)', 240, 106, 7, '#aaa'); drawList(128); menuNav(); }
  else if (scene === 'versus') { drawStage(c); txt('VERSUS MODE', 240, 70, 20, '#fc3'); drawList(128); menuNav(); }
  else if (scene === 'online') { drawStage(c); txt('PLAY ONLINE', 240, 70, 20, '#fc3'); txt('Host a room, share the code or link', 240, 92, 8, '#7ef'); drawList(128); menuNav(); }
  else if (scene === 'lobby') { drawLobby(); }
  else if (scene === 'select') { selectUpdate(); if (scene === 'select') drawSelect(); }
  else if (scene === 'controls') drawControls();
  else if (scene === 'remap') { remapUpdate(); if (scene === 'remap') drawRemap(); }
  else if (scene === 'results') { matchUpdate_results(); }
  if (scene === 'menu' || scene === 'versus') txt(padStatus(), 240, 262, 7, '#8f8');
  if (toasts.length) { const k = toasts[0]; c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(60, 252, 360, 14); txt(k.s, 240, 262, 8, '#fc3'); if (--k.t <= 0) toasts.shift(); }
  endFrame();
}
function matchUpdate_results() {
  const m = M, [a, b] = m.f; m.phase = 'over'; a.update({}, b, m); b.update({}, a, m); m.fx_ = [];
  drawStage(c); m.f.forEach(f => shadow(c, f)); m.f.forEach(f => drawFighter(c, f));
  c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(120, 40, 240, 190);
  txt(O ? (m.winner === O.me ? 'YOU WIN!' : 'YOU LOSE') : m.winner === 0 ? 'PLAYER 1 WINS!' : m.cpu ? 'CPU WINS!' : 'PLAYER 2 WINS!', 240, 78, 16, '#fc3');
  txt(m.f[m.winner].def.name + '  ' + m.wins[0] + ' - ' + m.wins[1], 240, 100, 10, '#fff'); drawList(168); menuNav();
}
// ================= Online play: WebRTC peer-to-peer (PeerJS) with deterministic input-delay lockstep =================
// The host is P1, the guest is P2. Only button states are sent each frame; both browsers run the identical simulation.
function roomLink() { return location.origin + location.pathname + '?room=' + O.code; }
function leaveOnline() { const o = O; O = null; if (!o) return; try { o.conn && o.conn.close(); o.peer && o.peer.destroy(); } catch {} }
function onClose(msg) {
  if (!O) return; leaveOnline(); toasts.push({ s: msg || 'Opponent disconnected', t: 240 });
  if (['match', 'select', 'results', 'lobby'].includes(scene)) go('menu');
}
function setupConn(conn) {
  O.conn = conn; O.send = o => { try { conn.open && conn.send(o); } catch {} };
  const opened = () => { if (!O) return; toasts.push({ s: 'Connected! Pick your fighter', t: 150 }); S.mode = 'online'; lock = [false, false]; goT = 0; go('select'); };
  if (conn.open) opened(); else conn.on('open', opened);
  conn.on('data', onMsg); conn.on('close', () => onClose()); conn.on('error', () => onClose('Connection error'));
}
function onMsg(m) {
  if (!O || !m) return;
  if (m.t === 'inp') O.rem[m.f] = m.m;
  else if (m.t === 'sel') S.sel[1 - O.me] = m.i;
  else if (m.t === 'lock') lock[1 - O.me] = m.v;
  else if (m.t === 'start' && O.me === 1) { S.sel = m.sel; startMatch(); }
}
function newRoom(me, code) {
  if (!window.Peer) { toasts.push({ s: 'Online library failed to load (check connection)', t: 240 }); return false; }
  leaveOnline(); O = { me, code, rem: {}, pend: 0, status: me ? 'Connecting...' : 'Creating room...', send() {} }; return true;
}
function hostGame() {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let code = ''; for (let i = 0; i < 4; i++) code += A[Math.random() * A.length | 0];
  if (!newRoom(0, code)) return; const o = O, p = o.peer = new Peer('pixelfighter-' + code);
  p.on('open', () => { o.status = 'Waiting for opponent...'; });
  p.on('connection', cn => { if (O !== o || o.conn) { cn.close(); return; } setupConn(cn); });
  p.on('error', e => { if (O === o) { o.status = 'Error: ' + e.type; } });
  go('lobby');
}
function joinGame(code) {
  if (!newRoom(1, code)) return; const o = O, p = o.peer = new Peer();
  p.on('open', () => { if (O === o) setupConn(p.connect('pixelfighter-' + code, { reliable: true })); });
  p.on('error', e => { if (O === o) o.status = e.type === 'peer-unavailable' ? 'Room not found - check the code' : 'Error: ' + e.type; });
  go('lobby');
}
function drawLobby() {
  drawStage(c); c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(40, 50, 400, 170);
  if (hit('Escape')) { leaveOnline(); return go('online'); }
  txt(O.me === 0 ? 'HOSTING' : 'JOINING', 240, 78, 16, '#fc3');
  txt('ROOM CODE: ' + O.code, 240, 112, 20, '#7ef');
  if (O.me === 0) { txt('Share the code, or click to copy an invite link', 240, 140, 8, '#fff'); txt(roomLink().slice(0, 60), 240, 156, 7, '#ccc'); }
  txt(O.status, 240, 190, 10, '#8f8'); txt('ESC: cancel', 240, 210, 8, '#ccc');
}
function onlineSelectUpdate() {
  const me = O.me, L = a => pressed(0, a) || pressed(1, a);
  if (hit('Escape')) { leaveOnline(); return go('menu'); }
  if (lock[me]) { if (L('heavy')) { lock[me] = false; O.send({ t: 'lock', v: false }); } }
  else {
    let ch = false; if (L('left')) { S.sel[me] = (S.sel[me] + ROSTER.length - 1) % ROSTER.length; ch = true; } if (L('right')) { S.sel[me] = (S.sel[me] + 1) % ROSTER.length; ch = true; }
    if (ch) O.send({ t: 'sel', i: S.sel[me] });
    if (L('light') || hit('Enter') || hit('Space')) { lock[me] = true; audio.sfx('beep'); O.send({ t: 'sel', i: S.sel[me] }); O.send({ t: 'lock', v: true }); } }
  if (me === 0) { if (lock[0] && lock[1]) { if (++goT > 45) { O.send({ t: 'start', sel: S.sel }); startMatch(); } } else goT = 0; }
}
const DELAY = 6;   // input delay in frames (~100 ms); both sides wait for each other's input before simulating a frame
function onlineStep(m) {
  ACTIONS.forEach((a, i) => { if (held(0, a) || held(1, a)) O.pend |= 1 << i; });   // latch every real frame; either keyboard layout or any pad
  const F = m.frame; if (m.loc[F] === undefined || O.rem[F] === undefined) return null;   // stall until opponent's input arrives
  const masks = O.me === 0 ? [m.loc[F], O.rem[F]] : [O.rem[F], m.loc[F]], idx = a => ACTIONS.indexOf(a);
  const out = masks.map((k, p) => { const prev = m.pm[p], h = a => ((k >> idx(a)) & 1) === 1, pr = a => h(a) && ((prev >> idx(a)) & 1) === 0; m.pm[p] = k;
    return { left: h('left'), right: h('right'), up: h('up'), down: h('down'), block: h('block'), lightP: pr('light'), heavyP: pr('heavy'), specialP: pr('special') }; });
  const mine = O.pend; O.pend = 0;   // everything pressed since the last simulated frame (so quick taps survive lag stalls)
  m.loc[F + DELAY] = mine; O.send({ t: 'inp', f: F + DELAY, m: mine });
  delete m.loc[F]; delete O.rem[F]; m.frame++; return out;
}
{ const room = new URLSearchParams(location.search).get('room'); if (room) joinGame(room.trim().toUpperCase()); }
let last = performance.now(), acc = 0;
function loop(t) { acc += Math.min(100, t - last); last = t; while (acc >= 1000 / 60) { frame(); acc -= 1000 / 60; } requestAnimationFrame(loop); }
requestAnimationFrame(loop);
