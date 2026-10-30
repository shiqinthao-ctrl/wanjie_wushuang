<script setup lang="ts">
import { computed } from 'vue';
import { chapterStages, chapterStars } from '../chapter/catalog';
import { OPEN_STAGES, prepareChapterRun, stageObjective } from '../chapter/prepare';
import type { ChapterRunOptions } from '../chapter/prepare';
import { equippedCharm } from '../chapter/charms';
import { readChapterProgress } from '../chapter/progress';
import type { ChapterProgress } from '../chapter/progress';
import { clock } from '../chapter/reports';
import { starter } from '../core/evolutionCatalog';
import { difficultyFor, difficultyIds } from '../core/spawnRules';
import type { DifficultyId } from '../core/spawnRules';
import type { GameSave } from '../core/saveTypes';

/**
 * The chapter entry - the page that makes the last six slices reachable.
 *
 * D33 measured what was missing: one page, one `:chapter` binding, one route member, and one reset.
 * Everything else was already built and tested (`prepareChapterRun`, `ChapterRunSession`,
 * `settleChapterRun`, `chapterStages`, `OPEN_STAGES`, the six charms) - it just had no door.
 *
 * Two decisions are visible in the code rather than in a comment:
 *
 * 1. **The gate is a real call, not a condition list.** `blocker()` runs `prepareChapterRun` and
 *    returns whatever it throws. Reusing `previewBlocker` would have refused a save whose `mode` is
 *    `endless` - a field this path never reads (D33 (d), measured in `contracts.test.ts`).
 * 2. **The star row is three slots, and that is only correct because D31 filled the range.** D29
 *    refused to draw three slots when the writer could only ever emit 0 or 1: three slots showing
 *    1/3 reads as a rating the player failed. Now 0..3 are all reachable, so the row is a rating.
 *    The number of slots comes from `chapterStars.mastery`, not from a literal `3`.
 */
/**
 * The six coefficients a chapter run actually reads, in the order the page shows them.
 *
 * D38 counted the readers before opening the door. `difficulties.json` has eight numbers; on this
 * path six of them are live (`hp`/`dmg`/`speed` in `spawnRules.createEnemy` and `FirstBoss`,
 * `budget`/`elite` in `director`, `xp` in `CombatSimulation`'s crystal spawn) and two are not:
 *
 * - `gold` is read only by the **legacy** settlement (`core/settlement.ts:43`). Chapter settlement
 *   pays no gold at all - D31 established that on purpose, and `challenges.test.ts` asserts that a
 *   settled run leaves `gold` untouched.
 * - `drop` is read by nothing: `gearDrops.ts` looks at the difficulty **by name** for mythic odds,
 *   never at `diff.drop`.
 *
 * So the selector lists six, and the page says the other two are not paid here. Showing `gold`
 * would advertise `hard`'s own description ("高密度高收益") for a mode that structurally cannot
 * pay the second half of it.
 */
const LEVERS = [
  { key: 'hp', label: '生命' }, { key: 'dmg', label: '伤害' }, { key: 'speed', label: '速度' },
  { key: 'budget', label: '密度' }, { key: 'elite', label: '精英' }, { key: 'xp', label: '经验' },
] as const;
/**
 * The tier is **owned by `App.vue`**, not by this page.
 *
 * D38 measured the alternative and rejected it: a `ref` here is destroyed when the page unmounts
 * (`v-else-if`), so a player who picks 万界劫, checks the codex, and comes back gets a `normal` run
 * without ever choosing one. A silent reset to the default is the same class of bug D33 fixed for
 * `chapterOptions` - the player's choice replaced by the code's.
 */
const props = defineProps<{ save: GameSave; heroId: string; difficulty: DifficultyId }>();
const emit = defineEmits<{ start: [options: ChapterRunOptions]; back: []; difficulty: [id: DifficultyId] }>();
const read = computed<{ progress: ChapterProgress | null; error: string }>(() => {
  try { return { progress: readChapterProgress(props.save), error: '' }; }
  catch (cause) { return { progress: null, error: cause instanceof Error ? cause.message : '存档进度读不出来。' }; }
});
const hero = computed(() => starter(props.heroId));
/** Built from the data, in its declared order: a fifth row appears here without a `.vue` edit. */
const tiers = computed(() => difficultyIds.map(id => ({ id, ...difficultyFor(id) })));
const selected = computed(() => difficultyFor(props.difficulty));
const lever = (key: (typeof LEVERS)[number]['key']): number => (selected.value as unknown as Record<string, number>)[key]!;
const charm = computed(() => read.value.progress ? equippedCharm(read.value.progress) : null);
/** `OPEN_STAGES` is the policy; `chapterStages` is the data. The page lists the intersection. */
const stages = computed(() => chapterStages.filter(stage => (OPEN_STAGES as readonly string[]).includes(stage.id)));
const best = (id: string): number => read.value.progress?.chapters.CH001?.stars[id] ?? 0;
const starRow = (id: string): string => {
  const stars = Math.min(chapterStars.mastery, Math.max(0, best(id)));
  return '★'.repeat(stars) + '☆'.repeat(chapterStars.mastery - stars);
};
/**
 * A fresh seed per attempt, so "retry this stage" is a new run and not a replay of the same one.
 * Generated at click time, not at render time: a `computed` seed would change on every re-render
 * and the blocker probe would disagree with the options the button actually sends.
 */
const options = (stageId: string): ChapterRunOptions => ({
  ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: stageId as ChapterRunOptions['stageId'],
  heroId: props.heroId as ChapterRunOptions['heroId'], mode: 'story', difficulty: props.difficulty,
  seed: Math.floor(Math.random() * 0x100000000),
});
/** Empty string means "this stage can start"; anything else is the sentence to show instead. */
function blocker(stageId: string): string {
  try { prepareChapterRun(props.save, options(stageId)); return ''; }
  catch (cause) { return cause instanceof Error ? cause.message : '这一关暂时无法出征。'; }
}
/**
 * Probed once per save, not once per render: the template reads the same gate twice (the `v-if`
 * and the message), and `prepareChapterRun` clones the stage row - doing that six times a frame
 * would be work nobody asked for.
 */
const gates = computed(() => Object.fromEntries(stages.value.map(stage => [stage.id, blocker(stage.id)])) as Record<string, string>);
function start(stageId: string) {
  if (gates.value[stageId]) return;
  emit('start', options(stageId));
}
</script>

<template>
  <section class="chapter">
    <small class="eyebrow">章节</small>
    <h1>第一章 · 乱世荒原</h1>
    <p class="lede">
      纯净规则：没有宝箱、没有奇遇、没有宠物。三关，一套固定的英雄属性，一局一条命。
      星级只记成绩 —— 打十遍也不会让下一局的开局更强。
    </p>
    <p class="now">
      出战英雄 <strong>{{ hero.name }}</strong> · 护符
      <strong>{{ charm ? charm.name : '未装备' }}</strong>
      <span v-if="charm" class="charm-detail">（{{ charm.detail }}）</span>
    </p>

    <p v-if="read.error" class="warn" role="alert">
      存档进度读不出来（{{ read.error }}），下面按「最好成绩 0 星」显示。
    </p>

    <div class="tiers" role="radiogroup" aria-label="难度">
      <!-- Not `:disabled` on the selected one: a disabled button leaves the tab order, so a
           keyboard user could never reach the tier that is currently chosen. `aria-checked` says
           which one it is; clicking it again is a no-op. -->
      <button v-for="tier in tiers" :key="tier.id" role="radio" :aria-checked="tier.id === props.difficulty"
        :class="{ on: tier.id === props.difficulty }" @click="$emit('difficulty', tier.id)">
        <strong>{{ tier.name }}</strong>
        <small>{{ tier.desc }}</small>
      </button>
    </div>
    <p class="levers">
      <strong>{{ selected.name }}</strong>
      <span v-for="item in LEVERS" :key="item.key">{{ item.label }} ×{{ lever(item.key) }}</span>
    </p>
    <p class="tiers-note">
      难度只改这一局：生命、伤害、速度、刷怪密度、精英率与经验六项系数。本模式不结算金币与掉落，
      所以四档里的「收益」在这里不生效 —— 换难度也不会改写上一局的星级。
    </p>

    <ul class="stages">
      <li v-for="stage in stages" :key="stage.id">
        <div class="head">
          <strong>{{ stage.name }}</strong>
          <span class="clock">{{ clock(stage.duration) }}</span>
        </div>
        <p class="goal">{{ stageObjective(stage) }}</p>
        <p class="best" :aria-label="`最好成绩 ${best(stage.id)} 星`">
          最好成绩 <b>{{ starRow(stage.id) }}</b>
          <span class="best-note">（不分难度：记的是这一关拿到过的最好星级）</span>
        </p>
        <p v-if="gates[stage.id]" class="warn" role="alert">{{ gates[stage.id] }}</p>
        <button v-else class="primary" @click="start(stage.id)">出战 {{ stage.name }}</button>
      </li>
    </ul>

    <p class="boundary">
      三关都能打到结算：边境破围、荒原镇界、祭坛决战。
      战备护符在「护符」页装备，一次一枚；战报与挑战在第一次结算后才有内容，图鉴要等本局真的进化过。
    </p>
    <button @click="$emit('back')">返回大厅</button>
  </section>
</template>

<style scoped>
.chapter { max-width: 760px; margin: 34px auto 80px; }
.chapter h1 { font-size: 32px; margin: 14px 0 16px; }
.lede { font-size: 13px; line-height: 1.9; color: var(--muted); }
.now { margin-top: 16px; font-size: 12px; letter-spacing: .06em; color: var(--gold); }
.charm-detail { color: var(--muted); letter-spacing: 0; }
.warn { margin-top: 12px; padding: 10px 12px; border-left: 2px solid #e08a6a; background: #2a1b16; font-size: 12px; line-height: 1.8; }
.tiers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 20px; }
.tiers button { padding: 8px 6px; background: #0f1f1c; border: 1px solid var(--line); border-radius: 6px; color: var(--muted); text-align: center; }
.tiers button strong { display: block; font-size: 13px; letter-spacing: .06em; color: inherit; }
.tiers button small { display: block; margin-top: 3px; font-size: 10px; line-height: 1.5; opacity: .75; }
.tiers button.on { border-color: var(--gold); color: var(--gold); background: #16241f; }
.levers { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 10px; font-size: 12px; color: #cfe3d9; font-variant-numeric: tabular-nums; }
.levers strong { color: var(--gold); letter-spacing: .06em; }
.tiers-note { margin-top: 8px; font-size: 11px; line-height: 1.9; color: #7f8f96; }
.best-note { color: #7f8f96; font-size: 11px; }
.stages { list-style: none; padding: 0; margin: 18px 0 0; display: grid; gap: 10px; }
.stages li { border: 1px solid var(--line); border-radius: 6px; padding: 14px 16px; background: #0f1f1c; }
.head { display: flex; align-items: baseline; gap: 10px; }
.head strong { font-size: 15px; letter-spacing: .06em; }
.head .clock { margin-left: auto; font-size: 12px; color: #cfe3d9; font-variant-numeric: tabular-nums; }
.goal { font-size: 12px; line-height: 1.8; color: var(--muted); margin-top: 8px; }
.best { font-size: 12px; color: var(--muted); margin-top: 6px; }
.best b { color: var(--gold); letter-spacing: 4px; font-size: 15px; }
.stages button { margin-top: 12px; width: 100%; }
.boundary { margin-top: 24px; font-size: 12px; line-height: 1.9; color: #8fa79b; }
.chapter > button { margin-top: 22px; width: 100%; }
@media (max-width: 640px) {
  .chapter { margin: 22px auto 56px; }
  .chapter h1 { font-size: 26px; }
  /* Four chips in a row stop being readable under ~360px: two columns, two rows. */
  .tiers { grid-template-columns: repeat(2, 1fr); }
}
</style>
