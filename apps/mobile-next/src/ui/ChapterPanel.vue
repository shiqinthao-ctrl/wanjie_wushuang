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
const props = defineProps<{ save: GameSave; heroId: string }>();
const emit = defineEmits<{ start: [options: ChapterRunOptions]; back: [] }>();
const read = computed<{ progress: ChapterProgress | null; error: string }>(() => {
  try { return { progress: readChapterProgress(props.save), error: '' }; }
  catch (cause) { return { progress: null, error: cause instanceof Error ? cause.message : '存档进度读不出来。' }; }
});
const hero = computed(() => starter(props.heroId));
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
  heroId: props.heroId as ChapterRunOptions['heroId'], mode: 'story', difficulty: 'normal',
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

    <ul class="stages">
      <li v-for="stage in stages" :key="stage.id">
        <div class="head">
          <strong>{{ stage.name }}</strong>
          <span class="clock">{{ clock(stage.duration) }}</span>
        </div>
        <p class="goal">{{ stageObjective(stage) }}</p>
        <p class="best" :aria-label="`最好成绩 ${best(stage.id)} 星`">
          最好成绩 <b>{{ starRow(stage.id) }}</b>
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
}
</style>
