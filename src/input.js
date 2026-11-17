// Keyboard works for both players at all times; gamepads are added on top and auto-assigned to the first free player slot.
// Key and gamepad-button bindings are remappable (see the REMAP CONTROLS screen) and saved in localStorage.
export const ACTIONS = ['left', 'right', 'up', 'down', 'light', 'heavy', 'special', 'block'];
const DEFAULT_KEYS = [
  { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', light: 'KeyF', heavy: 'KeyG', special: 'KeyR', block: 'ShiftLeft' },
  { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', light: 'Numpad1', heavy: 'Numpad2', special: 'Numpad3', block: 'Numpad0' }];
const DEFAULT_PAD = { up: [1], light: [0], heavy: [2], special: [3], block: [4, 5, 6, 7] };   // stick / d-pad always move; these are button indexes
const clone = o => JSON.parse(JSON.stringify(o));
let KEYS = clone(DEFAULT_KEYS), PAD = clone(DEFAULT_PAD);
try { const s = JSON.parse(localStorage.getItem('pixelfighter_keys'));
  if (s) { for (const p of [0, 1]) for (const a of ACTIONS) if (typeof s.keys?.[p]?.[a] === 'string') KEYS[p][a] = s.keys[p][a];
    for (const a in PAD) if (Array.isArray(s.pad?.[a]) && s.pad[a].length && s.pad[a].every(Number.isInteger)) PAD[a] = s.pad[a]; } } catch {}
const persist = () => { try { localStorage.setItem('pixelfighter_keys', JSON.stringify({ keys: KEYS, pad: PAD })); } catch {} };
export const PAD_ACTIONS = Object.keys(DEFAULT_PAD);
export const getKey = (p, a) => KEYS[p][a];
export const getPad = a => PAD[a];
export function setKey(p, a, code) {   // if the key is already used by another action, the two swap
  for (const q of [0, 1]) for (const b of ACTIONS) if (KEYS[q][b] === code && !(q === p && b === a)) KEYS[q][b] = KEYS[p][a];
  KEYS[p][a] = code; persist(); }
export const resetKey = (p, a) => setKey(p, a, DEFAULT_KEYS[p][a]);
export function setPad(a, i) {
  const old = PAD[a];
  for (const b of PAD_ACTIONS) if (b !== a && PAD[b].includes(i)) { PAD[b] = PAD[b].filter(x => x !== i); if (!PAD[b].length) PAD[b] = [...old]; }
  PAD[a] = [i]; persist(); }
export const resetPad = a => { PAD[a] = [...DEFAULT_PAD[a]]; persist(); };
export const resetAll = () => { KEYS = clone(DEFAULT_KEYS); PAD = clone(DEFAULT_PAD); persist(); };

const down = new Set(); let hits = new Set(), cur = [{}, {}], prev = [{}, {}];
let capKey = null, capPad = null, padHeld = {};
export const captureKey = cb => { capKey = cb; };     // next key press goes to cb(code) instead of the game
export const capturePad = cb => { capPad = cb; };     // next gamepad button press goes to cb(index)
const isBound = code => KEYS.some(k => Object.values(k).includes(code));
addEventListener('keydown', e => {
  if (capKey) { e.preventDefault(); if (e.repeat) return; const cb = capKey; capKey = null; cb(e.code); return; }
  if (!e.repeat) hits.add(e.code); down.add(e.code);
  if (e.code.startsWith('Arrow') || e.code === 'Space' || e.code.startsWith('Numpad') || e.code === 'Tab' || (!e.ctrlKey && !e.metaKey && !e.altKey && isBound(e.code))) e.preventDefault(); });
addEventListener('keyup', e => down.delete(e.code));
addEventListener('blur', () => down.clear());
export const hit = c => hits.has(c);          // key pressed this frame (menus)
export const pushHit = c => hits.add(c);      // lets on-screen buttons fake a key press (e.g. Escape)
export const touch = {};                      // on-screen button states (action -> bool), merged into player slot 0

// ---- gamepad slot management ----
const slots = [null, null], names = ['', ''], mem = {}, events = [], swapPrev = {};
const ev = (type, text) => events.push({ type, text });
const kind = id => /xbox|045e/i.test(id) ? 'Xbox' : /054c|playstation|dualshock|dualsense/i.test(id) ? 'PlayStation' : 'Gamepad';
function manage(list) {
  for (let s = 0; s < 2; s++) if (slots[s] !== null) { const g = list[slots[s]];
    if (!g || !g.connected) { ev('off', `P${s + 1} controller disconnected - keyboard still works`); slots[s] = null; names[s] = ''; } }
  for (const g of list) { if (!g || !g.connected || slots.includes(g.index)) continue;
    const key = g.index + g.id, m = mem[key]; const s = m !== undefined && slots[m] === null ? m : slots.indexOf(null); if (s < 0) continue;
    slots[s] = g.index; names[s] = kind(g.id); mem[key] = s; ev('on', `P${s + 1}: ${names[s]} controller connected`); }
}
function readPad(g, s) {
  const b = i => !!g.buttons[i]?.pressed, any = l => l.some(b), x = g.axes[0] || 0, y = g.axes[1] || 0;
  let L = b(14), R = b(15), U = b(12), D = b(13);
  if (g.mapping !== 'standard' && g.axes.length > 9 && Math.abs(g.axes[9]) <= 1.01) { // generic pads: d-pad as a hat axis
    const i = Math.round((g.axes[9] + 1) * 3.5); U ||= [7, 0, 1].includes(i); R ||= [1, 2, 3].includes(i); D ||= [3, 4, 5].includes(i); L ||= [5, 6, 7].includes(i); }
  s.left ||= x < -.5 || L; s.right ||= x > .5 || R; s.up ||= y < -.6 || U || any(PAD.up); s.down ||= y > .6 || D;
  s.light ||= any(PAD.light); s.heavy ||= any(PAD.heavy); s.special ||= any(PAD.special); s.block ||= any(PAD.block);
}
export function poll() {
  const list = [...(navigator.getGamepads?.() || [])]; manage(list);
  const now = {};   // newly pressed buttons feed the remap screen (Back/Select, index 8, is reserved for swapping slots)
  for (const g of list) { if (!g) continue; g.buttons.forEach((bt, i) => { if (!bt.pressed) return; const k = g.index + ':' + i; now[k] = 1;
    if (capPad && !padHeld[k] && i !== 8 && i < 16) { const cb = capPad; capPad = null; cb(i); } }); }
  padHeld = now;
  for (const g of list) { if (!g) continue; const b8 = !!g.buttons[8]?.pressed;   // Back/Select/Share swaps player slots
    if (b8 && !swapPrev[g.index] && slots.includes(g.index)) { [slots[0], slots[1]] = [slots[1], slots[0]]; [names[0], names[1]] = [names[1], names[0]]; ev('on', 'Controller slots swapped'); }
    swapPrev[g.index] = b8; }
  for (let p = 0; p < 2; p++) { prev[p] = cur[p]; const s = {}; for (const a of ACTIONS) s[a] = down.has(KEYS[p][a]);
    const g = slots[p] !== null ? list[slots[p]] : null; if (g) readPad(g, s);
    if (p === 0) for (const a of ACTIONS) if (touch[a]) s[a] = true;
    cur[p] = s; }
}
export const padCount = () => slots.filter(s => s !== null).length;
export const padStatus = () => `P1: ${names[0] ? names[0].toUpperCase() + ' + KEYS' : 'KEYBOARD'}   P2: ${names[1] ? names[1].toUpperCase() + ' + KEYS' : 'KEYBOARD'}`;
export const takeEvents = () => events.splice(0);
export const held = (p, a) => !!cur[p][a];
export const pressed = (p, a) => !!cur[p][a] && !prev[p][a];
export const endFrame = () => hits.clear();
