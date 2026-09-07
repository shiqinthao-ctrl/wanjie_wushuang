// Explicit synthetic fixture; never imported by production code.
import { createApp, h, shallowRef, nextTick } from 'vue';
import BossLoot from '../../src/ui/BossLoot.vue';
import { GameCore } from '../../src/core/GameCore';
import { CombatSimulation } from '../../src/core/CombatSimulation';
import { calculateStartup } from '../../src/core/growth';
import { Progression } from '../../src/core/progression';
import type { FirstStageEvents } from '../../src/core/firstEvents';
import fresh from '../../src/data/freshSave.json';
export { CombatSimulation, calculateStartup, Progression };

export async function mountLoot() {
  const core = new GameCore(fresh, () => .8); core.start();
  const sim = (core as unknown as { combat: CombatSimulation }).combat;
  const encounters = (core as unknown as { encounters: FirstStageEvents }).encounters;
  while (encounters.open(360)) encounters.resolve(encounters.snapshot().offer!.token, 'skip', { affordable: true, gold: 6000 });
  sim.time = 270; sim.bossEncounter.spawn(); sim.hitBoss(1e9, 'MAP_BARREL');
  for (let i = 0; i < 10; i++) core.advance(.02);
  const snapshot = shallowRef(core.snapshot()), root = document.createElement('div'); document.body.append(root);
  const app = createApp({ render: () => h(BossLoot, { active: snapshot.value.status === 'boss-loot', offer: snapshot.value.boss.offer, onChoose: uid => { core.pickBossLoot(uid); snapshot.value = core.snapshot(); } }) });
  app.mount(root); await nextTick();
  return {
    snapshot: () => snapshot.value,
    pause: async () => { core.pause(); snapshot.value = core.snapshot(); await nextTick(); },
    resume: async () => { core.resume(); snapshot.value = core.snapshot(); await nextTick(); },
    destroy: () => { core.destroy(); app.unmount(); root.remove(); },
  };
}
