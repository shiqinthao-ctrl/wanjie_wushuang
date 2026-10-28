import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fresh from '../data/freshSave.json';
import { GameCore } from '../core/GameCore';
import { CombatSimulation } from '../core/CombatSimulation';
import { insideTelegraph } from '../core/FirstBoss';
import { parseSchema30 } from '../storage/schema30';
import type { GameSave } from '../core/saveTypes';
import { chapterCharms } from './catalog';
import { chapterCharmRows, charmRow, charmViews, equippedCharm } from './charms';
import { createChapterProgression } from './growth';
import { freshChapterProgress, readChapterProgress } from './progress';
import { prepareChapterRun } from './prepare';

/**
 * R3-P03 / D30: six charms, six levers, one equipped at a time.
 *
 * The slice is asserted in four layers, because each one can fail alone:
 *
 *   - the data says *one* lever and *one* multiplier per charm, and no two charms share a lever;
 *   - preparation carries the charm without baking it into `player` (so the shipped run's numbers
 *     are not touched by a feature that is off);
 *   - each lever moves by exactly its factor, measured at the site that reads it, on the same
 *     pipeline as the shipped run - one switch, nothing else;
 *   - the three charms you have to earn are reachable in a real run on a stage that ships.
 *
 * No Playwright: the page's *layout* is not seen here. What is asserted is the field the renderer
 * reads plus the four source-level connection points in `App.vue`.
 */
const OPTIONS = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-01', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 15 } as const;
const FRAME = 1 / 60;
const simOf = (core: GameCore) => (core as unknown as { combat: CombatSimulation }).combat;
const HERO = { hp: 620, maxHp: 620, atk: 108, speed: 240, aspd: .95, crit: .05 };
const close = (value: number, digits = 10) => Math.round(value * 10 ** digits) / 10 ** digits;

/** A save whose chapter progress has `unlocked` charms and one of them worn. */
function withCharm(id: string | null, unlocked: readonly string[] = chapterCharms) {
  const save = structuredClone(fresh) as GameSave;
  save.mobileChapter = { ...freshChapterProgress(), charms: { unlocked: [...unlocked], equipped: id } };
  return save;
}
function chapterCore(id: string | null) {
  const save = withCharm(id);
  const core = new GameCore(save, () => .8, 'classic', OPTIONS);
  core.start(390, 844);
  return { core, sim: simOf(core) };
}
function simulation(id: string | null) {
  const save = withCharm(id);
  const preparation = prepareChapterRun(save, OPTIONS);
  return new CombatSimulation(save, createChapterProgression(preparation, () => .8), () => .8, [], Date.now, preparation);
}

describe('the data: one lever each, and a multiplier that is never 1', () => {
  it('has exactly the six ids the catalog names, no more and no fewer', () => {
    expect(Object.keys(chapterCharmRows).sort()).toEqual([...chapterCharms].sort());
    expect(Object.keys(chapterCharmRows)).toHaveLength(6);
  });
  it('never ships a charm that changes nothing', () => {
    for (const id of chapterCharms) {
      const row = chapterCharmRows[id];
      expect(row.factor, id).toBeGreaterThan(0);
      expect(Number.isFinite(row.factor), id).toBe(true);
      // 1 is the "no charm" multiplier; a row with 1 is a no-op wearing a name.
      expect(row.factor, id).not.toBe(1);
    }
  });
  it('gives every charm its own lever, so none of them silently does two things', () => {
    const levers = chapterCharms.map(id => chapterCharmRows[id].lever);
    expect(new Set(levers).size).toBe(6);
    expect(levers).toEqual(['dodgeCd', 'eliteDamage', 'pickup', 'incoming', 'skillCd', 'speed']);
  });
  it('states its own multiplier in the sentence the player reads', () => {
    // If the factor moves and the sentence does not, the page lies. Pin them to each other.
    for (const id of chapterCharms) {
      const row = chapterCharmRows[id];
      expect(row.name, id).not.toBe('');
      expect(row.detail, id).toContain(`×${row.factor}`);
    }
  });
  it('refuses an id it does not know, and says which one', () => {
    expect(() => charmRow('MC_PHOENIX')).toThrow(/MC_PHOENIX/);
    expect(charmRow('MC_MOVE').lever).toBe('speed');
  });
});

describe('preparation: the charm rides along, it does not rewrite the hero', () => {
  it('is null when nothing is equipped, and the player block is the hero row exactly', () => {
    const preparation = prepareChapterRun(withCharm(null), OPTIONS);
    expect(preparation.charm).toBeNull();
    expect(preparation.player).toEqual(HERO);
  });
  it('carries the equipped row without touching player', () => {
    // The lever is applied where it is read, not pre-baked here. If this ever fails, the shipped
    // run has a second place where a charm changes numbers - and D30 has only one per charm.
    const preparation = prepareChapterRun(withCharm('MC_DODGE'), OPTIONS);
    expect(preparation.charm).toMatchObject({ id: 'MC_DODGE', lever: 'dodgeCd', factor: .8 });
    expect(preparation.player).toEqual(HERO);
  });
  it('still refuses a charm the save has not unlocked', () => {
    const save = structuredClone(fresh) as GameSave;
    save.mobileChapter = { ...freshChapterProgress(), charms: { unlocked: [], equipped: 'MC_DODGE' } };
    expect(() => prepareChapterRun(save, OPTIONS)).toThrow(/未解锁护符/);
  });
  it('refuses an unknown id at preparation, not at schema validation', () => {
    // `progress.ts` has to keep accepting a save from a newer build (D28), so membership is not
    // checked there. Starting a run with a charm this build cannot apply would be a silent no-op.
    // Unlocked (so validation passes) but unknown to this build: the schema accepts it, the run
    // cannot honour it.
    expect(() => prepareChapterRun(withCharm('MC_PHOENIX', [...chapterCharms, 'MC_PHOENIX']), OPTIONS)).toThrow(/MC_PHOENIX/);
  });
  it('survives the save round trip the panel performs: write, re-parse, read back', () => {
    const save = withCharm(null);
    const next = readChapterProgress(save);
    next.charms.equipped = 'MC_CYCLE';
    save.mobileChapter = next;
    const reparsed = parseSchema30(JSON.stringify(save)) as GameSave;
    expect(equippedCharm(readChapterProgress(reparsed))).toMatchObject({ id: 'MC_CYCLE', lever: 'skillCd', factor: .85 });
    expect(prepareChapterRun(reparsed, OPTIONS).charm?.id).toBe('MC_CYCLE');
    // And the list the page renders agrees with the row it just wrote.
    expect(charmViews(readChapterProgress(reparsed)).filter(view => view.equipped).map(view => view.id)).toEqual(['MC_CYCLE']);
  });
});

describe('each lever moves by its factor, and only its factor', () => {
  it('MC_DODGE shortens the dodge cooldown from 4.5 s to 3.6 s', () => {
    const plain = simulation(null), dodging = simulation('MC_DODGE');
    expect(plain.action('dodge')).toBe(true);
    expect(dodging.action('dodge')).toBe(true);
    expect(plain.player.dodgeCd).toBe(4.5);
    expect(close(dodging.player.dodgeCd)).toBe(3.6);
  });
  it('MC_CYCLE shortens the skill cooldown from 6 s to 5.1 s', () => {
    const plain = simulation(null), cycling = simulation('MC_CYCLE');
    expect(plain.action('skill')).toBe(true);
    expect(cycling.action('skill')).toBe(true);
    expect(plain.player.skillCd).toBe(6);
    expect(close(cycling.player.skillCd)).toBe(5.1);
  });
  it('MC_SURVIVAL scales incoming damage from 0.44 to 0.374', () => {
    expect(simulation(null).player.incoming).toBe(.44);
    expect(close(simulation('MC_SURVIVAL').player.incoming)).toBe(.374);
  });
  it('MC_MOVE scales the walking line and leaves the dodge step alone', () => {
    // The dodge step reads the same `player.speed`, which is exactly why the charm scales the
    // movement line instead of the stat: one charm, one change.
    const walk = (id: string | null) => {
      const { core, sim } = chapterCore(id);
      const start = { x: sim.player.x, y: sim.player.y };
      for (let frame = 0; frame < 30; frame++) { core.move(1, 0); core.advance(FRAME); }
      const moved = sim.player.x - start.x;
      core.destroy();
      return moved;
    };
    const plain = walk(null), fast = walk('MC_MOVE');
    expect(fast / plain).toBeGreaterThan(1.1);
    expect(fast / plain).toBeLessThan(1.14);
    // Same dodge, same distance: the step is `min(90, speed * .34, viewport * .16)` and unchanged.
    const step = (id: string | null) => {
      const sim = simulation(id);
      const before = { x: sim.player.x, y: sim.player.y };
      sim.action('dodge');
      return Math.hypot(sim.player.x - before.x, sim.player.y - before.y);
    };
    expect(step('MC_MOVE')).toBe(step(null));
  });
  it('MC_PICKUP collects at 40 px, which the shipped 26 px does not', () => {
    const pickup = (id: string | null) => {
      const { core, sim } = chapterCore(id);
      sim.crystals.spawn({ x: sim.player.x + 40, y: sim.player.y, elite: false }, 10);
      core.advance(FRAME);
      const xp = core.snapshot().xp;
      core.destroy();
      return xp;
    };
    expect(pickup(null)).toBe(0);
    expect(pickup('MC_PICKUP')).toBe(10);
  });
  it('MC_ELITE multiplies damage to elites by 1.15 and leaves ordinary enemies alone', () => {
    const damage = (id: string | null, elite: boolean) => {
      const { core, sim } = chapterCore(id);
      // The first wave is on a timer, not on frame one: wait for a real body instead of assuming one.
      for (let frame = 0; frame < 600 && !sim.enemies.length; frame++) core.advance(FRAME);
      const enemy = sim.enemies[0]!;
      enemy.elite = elite; enemy.hp = 1e6; enemy.maxHp = 1e6;
      const before = enemy.hp;
      sim.hit(enemy, 100, 'CHARMS_TEST');
      const dealt = before - enemy.hp;
      core.destroy();
      return dealt;
    };
    const ordinaryPlain = damage(null, false), ordinaryCharmed = damage('MC_ELITE', false);
    const elitePlain = damage(null, true), eliteCharmed = damage('MC_ELITE', true);
    // An ordinary enemy is not the lever's target: the two readings must be the same number.
    expect(ordinaryCharmed).toBe(ordinaryPlain);
    expect(close(eliteCharmed / elitePlain, 6)).toBe(1.15);
    // The elite path is not a no-op even without the charm - it just is not multiplied.
    expect(elitePlain).toBeGreaterThan(0);
  });
});

/** One run of the shipped stage with a growth-first policy: evolve when offered, then actives. */
function playGrowth(seed: number) {
  const core = new GameCore(withCharm(null), () => .8, 'classic', { ...OPTIONS, seed });
  core.start(390, 844);
  const sim = simOf(core);
  for (let frame = 0; frame < 500 * 60; frame++) {
    const snapshot = core.snapshot();
    if (snapshot.status === 'ended') break;
    if (snapshot.status === 'choosing') {
      const choice = snapshot.choice!;
      const pick = choice.options.find(option => option.kind === 'hero')
        ?? choice.options.find(option => option.kind === 'active') ?? choice.options[0]!;
      core.choose(choice.token, pick.kind, pick.id);
      continue;
    }
    if (snapshot.status === 'boss-loot') { core.pickChapterLoot(); continue; }
    const target = sim.bossEncounter.active ?? (sim.enemies.find(enemy => enemy.checked) ?? sim.enemies[0] ?? { x: sim.world.width / 2, y: sim.world.height / 2 });
    const ox = sim.player.x - target.x, oy = sim.player.y - target.y, gap = Math.hypot(ox, oy) || 1;
    let dx = gap > 136 ? -ox / gap : -oy / gap, dy = gap > 136 ? -oy / gap : ox / gap;
    const incoming = sim.bossEncounter.telegraphs.find(warning => !warning.resolved && warning.life < .5 && insideTelegraph(sim.player, warning));
    if (incoming) { const away = Math.hypot(sim.player.x - incoming.x, sim.player.y - incoming.y) || 1; dx = (sim.player.x - incoming.x) / away; dy = (sim.player.y - incoming.y) / away; }
    core.move(dx, dy);
    const near = sim.enemies.filter(enemy => Math.hypot(enemy.x - sim.player.x, enemy.y - sim.player.y) < 70).length;
    if (snapshot.dodgeCd <= 0 && (near >= 2 || incoming)) core.action('dodge');
    if (snapshot.ult >= 100 && near >= 1) core.action('ultimate');
    core.advance(FRAME);
  }
  const final = core.chapterFinalRun();
  const run = { seed, endReason: core.snapshot().endReason, level: core.snapshot().level, formId: final?.formId, awakened: final?.awakened, bonds: final?.bonds ?? [] };
  core.destroy();
  return run;
}

describe('the three charms you have to earn are reachable on a stage that ships', () => {
  const seeds = [15, 7, 99] as const;
  let cache: ReturnType<typeof playGrowth>[] | undefined;
  const runs = () => (cache ??= seeds.map(seed => playGrowth(seed)));
  it('every run wins, which is what MC_SURVIVAL asks for', () => {
    expect(runs().map(run => run.endReason)).toEqual(['victory', 'victory', 'victory']);
  }, 900_000);
  it('every run awakens, which is what MC_CYCLE asks for', () => {
    // Awakening is a *policy* gate, not a luck gate: a player who never picks the evolution option
    // reaches Lv.19 and never awakens (D27's bot did exactly that, 0/3). The page must say
    // "觉醒解锁", not "打通就送".
    expect(runs().map(run => run.awakened)).toEqual([true, true, true]);
    expect(runs().map(run => run.formId)).not.toContain(null);
  }, 900_000);
  it('two bonds are reachable but not free, which is what MC_MOVE asks for', () => {
    // Measured, not assumed: 1 of 3 runs ends with two or more bonds, the other two end with one.
    const counts = runs().map(run => run.bonds.length);
    expect(counts.filter(count => count >= 2).length).toBeGreaterThanOrEqual(1);
    expect(counts.filter(count => count >= 2).length).toBeLessThan(3);
    expect(Math.max(...counts)).toBeGreaterThanOrEqual(2);
  }, 900_000);
});

describe('the route: a page that only exists in a template is not shipped', () => {
  it('has a union member, an import, a lobby button and a branch in App.vue', () => {
    const app = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8');
    expect(app).toMatch(/page = ref<[^>]*'charms'[^>]*>/);
    expect(app).toMatch(/import CharmsPanel from '\.\/ui\/CharmsPanel\.vue';/);
    expect(app).toMatch(/@click="page = 'charms'">护符</);
    expect(app).toMatch(/<CharmsPanel v-else-if="page === 'charms'/);
  });
  it('writes through the repository, once, with the revision in the operation id', () => {
    // The panel is the only page that writes progress. Its operation id carries the slot revision,
    // so a retry is idempotent but "unequip, then equip the same charm" is a new operation.
    const panel = readFileSync(resolve(process.cwd(), 'src/ui/CharmsPanel.vue'), 'utf8');
    expect(panel).toMatch(/transactOnce\(props\.active\.id, `chapter1-v1:charm:\$\{props\.active\.revision\}:/);
    expect(panel).toMatch(/next\.charms\.equipped = id;/);
    expect(panel).toMatch(/save\.mobileChapter = next;/);
  });
});
