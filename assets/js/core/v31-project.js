/* ================= V3.1 ENGINEERING SPLIT ================= */
window.WW_PROJECT = Object.freeze({
  version: 'V3.1.3',
  codename: 'MASTER HANDOFF',
  schema: 30,
  architecture: 'ordered-global-runtime',
  note: 'V3.1 preserves V3.0 runtime behavior while splitting source by responsibility.'
});
const _v31RenderTop = renderTop;
renderTop = function(){
  _v31RenderTop();
  const chip = document.querySelector('.versionChip');
  if(chip) chip.textContent = '三界十二关 · 七大挑战模式';
};
window.addEventListener('load', () => {
  document.title = '万界无双 · 裂隙征途';
  const chip = document.querySelector('.versionChip');
  if(chip) chip.textContent = '三界十二关 · 七大挑战模式';
});
