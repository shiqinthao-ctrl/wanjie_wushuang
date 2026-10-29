<script setup lang="ts">
import { computed } from 'vue';
import { challengeViews } from '../chapter/challenges';
import { charmRow } from '../chapter/charms';
import { readChapterProgress } from '../chapter/progress';
import type { ChapterProgress } from '../chapter/progress';
import { chapterStars } from '../chapter/catalog';
import type { GameSave } from '../core/saveTypes';
/**
 * The challenges page. Read-only, like the codex: `settlement` is the only writer, and it writes
 * when a run is settled - so nothing here can grant itself a reward by being looked at.
 *
 * The page states the payout in the charm's own words (`charmRow(...).detail`), not in a copy of
 * the number. A page that said "受到伤害 ×0.85" as a literal would keep saying it after the charm
 * was retuned, and it would be wrong in the one place the player reads it.
 */
const props = defineProps<{ save: GameSave }>();
defineEmits<{ back: [] }>();
const read = computed<{ progress: ChapterProgress | null; error: string }>(() => {
  try { return { progress: readChapterProgress(props.save), error: '' }; }
  catch (cause) { return { progress: null, error: cause instanceof Error ? cause.message : '存档进度读不出来。' }; }
});
const rows = computed(() => read.value.progress ? challengeViews(read.value.progress) : []);
const paidCount = computed(() => rows.value.filter(row => row.paid).length);
</script>

<template>
  <section class="challenges">
    <small class="eyebrow">挑战</small>
    <h1>三件事，三枚护符</h1>
    <p class="lede">
      三条挑战，每条只问一件在结算那一刻就能判定的事。达成之后掉一枚护符 ——
      <strong>只掉护符，不掉属性</strong>：护符一次只能戴一枚，所以再多挑战也叠不出一局更强的开局。
      这三枚不在开局的三枚里，没达成之前是拿不到的。
    </p>
    <p class="count">本档已达成 {{ paidCount }}/{{ rows.length }}</p>

    <p v-if="read.error" class="warn" role="alert">
      存档进度读不出来（{{ read.error }}），下面按「未达成」显示；挑战本身仍然完整。
    </p>

    <ul class="list">
      <li v-for="row in rows" :key="row.id" :data-paid="row.paid">
        <div class="head">
          <strong>{{ row.name }}</strong>
          <span class="tag">{{ row.paid ? '已达成' : '未达成' }}</span>
        </div>
        <p class="asks">{{ row.asks }}</p>
        <p class="pays">奖励 · {{ charmRow(row.reward).name }} —— {{ charmRow(row.reward).detail }}</p>
      </li>
    </ul>

    <h2>星级是记录，不是加成</h2>
    <p class="lede small">
      通关 {{ chapterStars.clear }} 星，通关且剩余生命高于 {{ Math.round(chapterStars.masteryHp * 100) }}%
      给 {{ chapterStars.mastery }} 星，失败 0 星。星级写进存档的最好成绩，<strong>不会</strong>换来金币、精通或任何
      下一局的数值 —— 重打一关能提高的只有这个数字本身。
    </p>

    <p class="boundary">
      章节出战入口（R3-U06）尚未接入大厅，所以现在达成挑战之后还没有可点开的一局 ——
      这一条写在页面上，不藏在代码里。
    </p>
    <button class="primary" @click="$emit('back')">返回大厅</button>
  </section>
</template>

<style scoped>
.challenges { max-width: 760px; margin: 34px auto 80px; }
.challenges h1 { font-size: 32px; margin: 14px 0 16px; }
.challenges h2 { font-size: 17px; margin: 30px 0 10px; }
.lede { font-size: 13px; line-height: 1.9; color: var(--muted); }
.lede.small { font-size: 12px; }
.count { margin-top: 14px; font-size: 12px; letter-spacing: .08em; color: var(--gold); }
.warn { margin-top: 14px; padding: 10px 12px; border-left: 2px solid #e08a6a; background: #2a1b16; font-size: 12px; line-height: 1.8; }
.list { list-style: none; padding: 0; margin: 18px 0 0; display: grid; gap: 10px; }
.list li { border: 1px solid var(--line); border-radius: 6px; padding: 14px 16px; background: #0f1f1c; }
.list li[data-paid="true"] { border-color: var(--gold); }
.list li[data-paid="false"] { opacity: .72; }
.head { display: flex; align-items: center; gap: 10px; }
.head strong { font-size: 15px; letter-spacing: .06em; }
.head .tag { margin-left: auto; font-size: 11px; padding: 3px 8px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); }
.list li[data-paid="true"] .tag { color: var(--gold); border-color: var(--gold); }
.asks { font-size: 12px; line-height: 1.8; color: var(--muted); margin-top: 8px; }
.pays { font-size: 12px; line-height: 1.8; color: #7eefce; margin-top: 4px; }
.boundary { margin-top: 24px; font-size: 12px; line-height: 1.9; color: #8fa79b; }
.challenges > button { margin-top: 22px; width: 100%; }
</style>
