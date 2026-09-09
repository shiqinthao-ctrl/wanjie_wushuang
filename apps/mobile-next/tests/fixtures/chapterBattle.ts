// Browser-only fixture: mounts the production UI, never included by the app entry.
import { createApp, defineComponent, h, ref, shallowRef } from 'vue';
import BattleView from '../../src/ui/BattleView.vue';
import { GameCore } from '../../src/core/GameCore';
import { SaveRepository } from '../../src/storage/SaveRepository';
import type { Progression } from '../../src/core/progression';
import type { CombatSimulation } from '../../src/core/CombatSimulation';
import type { App } from 'vue';

let core: GameCore, repository: SaveRepository, app: App, slotId: string, database: string;
const start = GameCore.prototype.start;
GameCore.prototype.start = function (...args) { core = this; return start.apply(this, args); };
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
      h('small', 'R1b 自动化验收 · 独立测试存档'), h('h1', '首章成长样板'),
      h('p', '赤焰战神 · 四术式与四心法 · 进化与觉醒'), h('p', '过渡战斗与美术；尚未通过 R1 样板试玩。'),
      h('button', { onClick: enter, class: 'primary' }, '开始成长样板'),
    ]) }));
  app.mount(root);
}
export function snapshot() { return core.snapshot(); }
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
