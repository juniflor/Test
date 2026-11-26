// On-screen touch controls (phones/tablets only). They feed player slot 0, so they work offline vs CPU and in online matches.
import { touch, pushHit } from './input.js';
if (matchMedia('(pointer: coarse)').matches) {
  const root = document.createElement('div'); root.id = 'touch';
  root.innerHTML = `
    <div class="pad"><b data-a="up" style="grid-area:u">&#9650;</b><b data-a="left" style="grid-area:l">&#9664;</b><b data-a="right" style="grid-area:r">&#9654;</b><b data-a="down" style="grid-area:d">&#9660;</b></div>
    <div class="acts"><b data-a="special" style="grid-area:s">SPEC</b><b data-a="throw" style="grid-area:t">THROW</b><b data-a="light" style="grid-area:l">PUNCH</b><b data-a="heavy" style="grid-area:h">KICK</b><b data-a="block" style="grid-area:b">BLOCK</b></div>
    <b class="menu" data-k="Escape">MENU</b>`;
  document.body.appendChild(root);
  const rot = document.createElement('div'); rot.id = 'rot'; rot.textContent = 'Rotate your phone sideways to play'; document.body.appendChild(rot);
  const down = {};   // action -> Set of finger ids currently on that button
  const release = (b, id) => { const a = b?.dataset?.a; if (!a) return; down[a]?.delete(id); if (!down[a]?.size) { if (a === 'throw') { touch.light = false; touch.heavy = false; } else touch[a] = false; b.classList.remove('on'); } };
  root.addEventListener('pointerdown', e => {
    const b = e.target.closest('b'); if (!b) return; e.preventDefault();
    if (b.dataset.k) { pushHit(b.dataset.k); return; }
    try { b.setPointerCapture(e.pointerId); } catch {}
    const a = b.dataset.a; (down[a] ||= new Set()).add(e.pointerId); if (a === 'throw') { touch.light = true; touch.heavy = true; } else touch[a] = true; b.classList.add('on');
    try { navigator.vibrate?.(8); } catch {}
  });
  for (const ev of ['pointerup', 'pointercancel']) root.addEventListener(ev, e => release(e.target.closest?.('b'), e.pointerId));
  const clear = () => { for (const k in touch) touch[k] = false; for (const k in down) down[k].clear(); root.querySelectorAll('.on').forEach(n => n.classList.remove('on')); };
  addEventListener('blur', clear); document.addEventListener('visibilitychange', clear);
  addEventListener('contextmenu', e => e.preventDefault());
}
