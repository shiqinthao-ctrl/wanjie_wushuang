// Synthetic native-browser fixtures. Never imported by the shipping application.
export { SaveRepository } from '../../src/storage/SaveRepository';
export { RunSession } from '../../src/storage/RunSession';
export { settleRun } from '../../src/core/settlement';
export { eventCore } from './eventHarness';
import { GameCore } from '../../src/core/GameCore';
import type { CombatSimulation } from '../../src/core/CombatSimulation';
import type { GameSave, GearInstance } from '../../src/core/saveTypes';
import { freezeRun } from '../../src/core/settlement';
import oracle from '../../../../tasks/mobile-modernization/baseline/settlement-oracle.json';
import { SaveRepository } from '../../src/storage/SaveRepository';
import { RunSession } from '../../src/storage/RunSession';
import { createApp, h, ref, shallowRef } from 'vue';
import type { RunResult as Result } from '../../src/core/settlement';
import RunResult from '../../src/ui/RunResult.vue';
import MovePad from '../../src/ui/MovePad.vue';

export function fixtureCore(save: GameSave, win = false) {
  const item = oracle.cases[win ? 1 : 0]!;
  const run = freezeRun({
    heroId: save.hero, chapter: String(save.selectedChapter), stageId: String(save.selectedStage), modeId: String(save.mode), difficultyId: String(save.difficulty || 'normal'),
    endReason: win ? 'victory' : 'defeat', reason: item.spec.name,
    hp: item.spec.hp * 1000, maxHp: 1000, time: item.spec.time, level: 1, kills: item.spec.kills,
    eliteKills: item.spec.elite, maxCombo: item.spec.combo, modeScore: 777, modeBosses: win ? 1 : 0,
    interactionsUsed: 2, mapGold: 0, bossPhaseMax: 3, petGold: 0, petDamage: 1234.5, petHeals: 0,
    damageBy: { H001_SLASH: 7200, A011: 3400 }, evolved: ['E001'], fused: [], drops: item.drops as GearInstance[],
    build: save.build, timedRewards: item.result.timedRewards, encounterEvidence: item.result.encounterEvidence,
  });
  const core = new GameCore(save); core.start(); core.finalRun = () => run;
  return core;
}
export function endEventCore(core: GameCore) {
  (core as unknown as { combat: CombatSimulation }).combat.player.hp = 0;
  core.advance(.02);
}
export async function receipts(name: string) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open(name); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
  try { return await new Promise<unknown[]>((resolve, reject) => { const r = db.transaction('receipts').objectStore('receipts').getAll(); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }); }
  finally { db.close(); }
}

export async function mountResult(touchOrigin?: { x: number; y: number }) {
  const repo = await SaveRepository.open('test-result-ui-' + crypto.randomUUID()), slot = await repo.initialize();
  const core = fixtureCore(slot.save, true), run = core.finalRun()!, session = new RunSession(repo, slot, core, 'result-ui');
  const state = shallowRef({ ...core.snapshot(), status: touchOrigin ? 'running' as const : 'ended' as const, endReason: run.endReason, time: run.time, kills: run.kills });
  const result = shallowRef<Result>(), busy = ref(true), error = ref('');
  let release: (() => void) | undefined, fail = true, replayed = 0, exited = 0;
  const original = repo.transactOnce.bind(repo);
  repo.transactOnce = async (...args) => {
    await new Promise<void>(resolve => { release = resolve; });
    if (fail) throw new DOMException('Synthetic disk full', 'QuotaExceededError');
    return original(...args);
  };
  async function settle() {
    busy.value = true; error.value = '';
    try { result.value = await session.settle(); }
    catch { error.value = '本局战果尚未确认保存。请保持页面打开并重试，同一局不会重复发奖。'; }
    finally { busy.value = false; }
  }
  const host = document.body.appendChild(document.createElement('div'));
  const app = createApp({ render: () => h('div', [
    touchOrigin && state.value.status === 'running' ? h(MovePad, { style: { position: 'fixed', left: `${touchOrigin.x - 60}px`, top: `${touchOrigin.y - 60}px`, width: '120px', height: '120px' } }) : undefined,
    h(RunResult, { snapshot: state.value, result: result.value, busy: busy.value, error: error.value, leaving: false, onRetry: settle, onReplay: () => { replayed++; }, onExit: () => { exited++; } }),
  ]) });
  app.mount(host); void settle();
  return {
    releaseFailure: () => release?.(), releaseSuccess: () => { fail = false; release?.(); },
    finish: () => { state.value = { ...state.value, status: 'ended' }; },
    saved: () => repo.get(slot.id), counts: () => ({ replayed, exited }),
    destroy: () => { app.unmount(); host.remove(); core.destroy(); repo.close(); },
  };
}
