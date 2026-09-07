import type { GameCore } from '../core/GameCore';

export function bindKeyboard(core: GameCore, pause: () => void) {
  const keys = new Set<string>();
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const move = () => core.move(Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')), Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup')));
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') { pause(); return; }
    if (event.target instanceof Element && event.target.closest('button,input,textarea,select')) return;
    const key = event.key.toLowerCase();
    if (core.snapshot().status !== 'running') return;
    if (!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) return;
    event.preventDefault(); keys.add(key); move();
  }, options);
  window.addEventListener('keyup', event => { keys.delete(event.key.toLowerCase()); move(); }, options);
  const interrupt = () => { keys.clear(); core.clearInput(); pause(); };
  window.addEventListener('blur', interrupt, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) interrupt(); }, options);
  return {
    clear: () => { keys.clear(); core.clearInput(); },
    destroy: () => { controller.abort(); keys.clear(); core.clearInput(); },
  };
}
