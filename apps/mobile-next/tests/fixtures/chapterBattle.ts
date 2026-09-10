// Browser-only fixture: mounts the production UI, never included by the app entry.
import { createApp, defineComponent, h, ref, shallowRef } from 'vue';
import BattleView from '../../src/ui/BattleView.vue';
import { GameCore } from '../../src/core/GameCore';
import { SaveRepository } from '../../src/storage/SaveRepository';
import type { Progression } from '../../src/core/progression';
import type { CombatSimulation } from '../../src/core/CombatSimulation';
import type { App } from 'vue';
import type { CoreEvent } from '../../src/core/GameCore';

let core: GameCore, repository: SaveRepository, app: App, slotId: string, database: string;
let recorded: CoreEvent[] = [];
const start = GameCore.prototype.start;
GameCore.prototype.start = function (...args) { core = this; return start.apply(this, args); };
const takeEvents = GameCore.prototype.takeEvents;
GameCore.prototype.takeEvents = function () { const events = takeEvents.call(this); recorded.push(...events.filter(e => e.type === 'dragon-slash')); return events; };
export async function mount(seed = 15) {
  database = `chapter-battle-${crypto.randomUUID()}`;
  repository = await SaveRepository.open(database);
  const initial = await repository.initialize(); slotId = initial.id;
  const slot = shallowRef(initial), battle = ref(false), revision = ref(0);
  const options = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-01', heroId: 'H001', mode: 'story', difficulty: 'normal', seed } as const;
  async function enter() { slot.value = await repository.get(slotId); revision.value++; battle.value = true; }
  const root = document.createElement('main'); document.body.replaceChildren(root);
  app = createApp(defineComponent({ setup: () => () => battle.value ? h(BattleView, { key: revision.value, slot: slot.value, repository, chapter: options,
    onExit: () => { battle.value = false; }, onReplay: enter }) : h('section', { style: 'padding:32px;max-width:560px;margin:auto' }, [
      h('small', 'R1c 自动化验收 · 独立测试存档'), h('h1', '首章成长样板'),
      h('p', '赤焰战神 · 四术式与四心法 · 进化与觉醒'), h('p', '过渡战斗与美术；尚未通过 R1 样板试玩。'),
      h('button', { onClick: enter, class: 'primary' }, '开始成长样板'),
    ]) }));
  app.mount(root);
}
export function snapshot() { return core.snapshot(); }
export function render() { return core.renderState(); }
export function position() { const { x, y } = core.renderState().player; return { x, y }; }
export async function saved() { return repository.get(slotId); }
export function seedXp(value: number) { const p = (core as unknown as { progression: Progression }).progression; p.gain(value); }
export function finish(reason: 'defeat' | 'victory' | 'timeout') {
  const sim = (core as unknown as { combat: CombatSimulation }).combat;
  if (reason === 'defeat') sim.hurt(1e6, 'synthetic-test');
  else { sim.time = 360; if (reason === 'victory') { sim.bossEncounter.spawn(); sim.bossEncounter.defeat(); sim.time += .2; } }
}
export async function reloadSaved() {
  app.unmount(); repository.close();
  repository = await SaveRepository.open(database); return saved();
}

/** Directed combat only: explicitly synthetic, never used by the natural run. */
export function dragonScenario(kind: 'crowd' | 'ranged' | 'elite' | 'boss') {
  const sim = (core as unknown as { combat: CombatSimulation }).combat;
  const p = sim.progression, awakened = kind === 'elite' || kind === 'boss';
  Object.assign(p, { level: awakened ? 8 : 3, skills: { A003: 3 }, choice: undefined, pendingNormal: false });
  Object.assign(p.journey!, { form: 'dragon', rank: awakened ? 2 : 1 });
  sim.enemies.length = 0; sim.crystals.clear(); sim.player.ult = 100; sim.cool.A003 = 0;
  const placements = kind === 'ranged' ? [[80, -60], [170, -110], [260, -150]] : [[80, 0], [115, -55], [0, 110], [-100, 0]];
  for (const [index, point] of placements.entries()) sim.enemies.push({ id: `R1C_${kind}_${index}`, name: kind, ai: kind === 'ranged' ? 'ranged' : 'melee',
    x: sim.player.x + point[0]!, y: sim.player.y + point[1]!, hp: 2400, maxHp: 2400, r: kind === 'elite' ? 22 : 12, elite: kind === 'elite',
    affixes: [], speed: kind === 'ranged' ? 35 : 12, damage: 10, attack: 0, skill: 0, flash: 0, color: '#d7ba87' });
  if (kind === 'boss') { sim.enemies.length = 0; sim.time = 270; sim.bossEncounter.spawn(); sim.boss!.x = sim.player.x + 145; sim.boss!.y = sim.player.y - 50; sim.boss!.shield = 0; }
  recorded = [];
  const label = document.createElement('p'); label.id = 'directed-scenario';
  label.textContent = `R1c 定向测试 · ${{ crowd: '正面与侧后', ranged: '远程与穿透', elite: '觉醒连斩转向', boss: '单首领输出' }[kind]} · 人工布置敌人与成长`;
  label.style.cssText = 'position:fixed;top:100px;left:12px;right:12px;z-index:20;padding:8px;background:#102720e8;color:#ffe3a3;font:12px serif;pointer-events:none;text-align:center';
  document.querySelector('#directed-scenario')?.remove(); document.body.append(label);
}
export function combatEvidence() {
  const sim = (core as unknown as { combat: CombatSimulation }).combat;
  return { damage: { ...sim.damageBy }, recorded, dragon: sim.renderState().dragon };
}
