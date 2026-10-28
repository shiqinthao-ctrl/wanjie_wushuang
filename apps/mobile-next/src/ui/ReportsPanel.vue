<script setup lang="ts">
import { computed } from 'vue';
import { REPORT_CAP, reportRows } from '../chapter/reports';
import type { GameSave } from '../core/saveTypes';
/**
 * The run record. Read-only: it renders `progress.reports` through `reportRows` and writes nothing.
 *
 * Two rules from D29 are visible here rather than hidden in the code:
 *
 * - A defeat or a timeout is a row like any other. This is a record, not a trophy case, so the
 *   outcome is a labelled badge on every row instead of a filter that hides the losses.
 * - No percentage without a denominator. Below `RATE_MIN_RUNS` the page says how many runs it
 *   wants instead of printing a rate; the median names how many victories it was taken over.
 */
const props = defineProps<{ save: GameSave }>();
defineEmits<{ back: [] }>();
const reports = computed(() => reportRows(props.save));
const percent = (value: number) => `${Math.round(value * 1000) / 10}%`;
</script>

<template>
  <section class="reports">
    <small class="eyebrow">战报</small>
    <h1>最近 {{ REPORT_CAP }} 局</h1>
    <p class="lede">
      结算过的战局都记在这里，新的在最前。失败与超时和胜利一样占一行 ——
      这是一份记录，不是奖杯柜。
    </p>

    <p v-if="reports.progressError" class="unknown" role="alert">
      存档进度读不出来（{{ reports.progressError }}），所以这份记录暂时看不见。这不等于你没有打过。
    </p>

    <template v-else-if="reports.summary.runs === 0">
      <p class="empty">这份存档还没有结算过的战局。打完一局并保存战报后，它会出现在这里。</p>
    </template>

    <template v-else>
      <p class="summary" aria-label="汇总">
        窗口 <strong>{{ reports.summary.runs }}</strong> 局（上限 {{ REPORT_CAP }}）·
        胜 <strong>{{ reports.summary.victory }}</strong> /
        败 <strong>{{ reports.summary.defeat }}</strong> /
        超时 <strong>{{ reports.summary.timeout }}</strong>
      </p>
      <p class="summary small">
        <template v-if="reports.summary.winRate === null">
          样本不足 {{ reports.summary.rateNeeds }} 局，不给胜率 —— {{ reports.summary.runs }} 局里的百分比不是胜率。
        </template>
        <template v-else>
          胜率 {{ percent(reports.summary.winRate) }}（{{ reports.summary.victory }}/{{ reports.summary.runs }} 局）。
        </template>
        <template v-if="reports.summary.victoryMedian !== null">
          胜利局中位用时 {{ reports.summary.victoryMedian }} 秒（{{ reports.summary.victoryCount }} 局胜利）—— 超时局不计入，
          否则中位数会被时限拖走。
        </template>
      </p>

      <ol class="runs" aria-label="战报列表，新的在最前">
        <li v-for="run in reports.rows" :key="run.runId" :data-outcome="run.outcome">
          <div class="head">
            <strong>{{ run.stageName }}</strong>
            <span class="outcome">{{ run.outcomeLabel }}</span>
            <small>{{ run.clock }}</small>
          </div>
          <p class="meta">
            <span>{{ run.heroName }}</span>
            <span>{{ run.formName ?? '未选形态' }}</span>
            <span>Lv.{{ run.level }}</span>
            <span>击破 {{ run.kills }}</span>
            <span>星 {{ run.stars }}</span>
            <span>种子 {{ run.seed }}</span>
          </p>
          <p class="extra">
            {{ run.routes }} 条路线 · {{ run.bonds }} 个羁绊<template v-if="run.awakened"> · 已觉醒</template>
          </p>
        </li>
      </ol>

      <p class="note">
        「星」是数字不是三格：写入处是「胜利记 1 星、其余记 0」，校验却允许 0–3 ——
        画三格会显示成 1/3，像是没打好。另外，守住的界碑数与清掉的精英检验数在结算时没有被写进战报，
        所以这里没有这两列。
      </p>
    </template>

    <button class="primary" @click="$emit('back')">返回大厅</button>
  </section>
</template>

<style scoped>
.reports { max-width: 760px; margin: 34px auto 80px; }
.reports h1 { font-size: 32px; margin: 14px 0 16px; }
.lede { font-size: 13px; line-height: 1.9; color: var(--muted); }
.unknown { margin-top: 14px; padding: 10px 12px; border-left: 2px solid #e08a6a; background: #2a1b16; font-size: 12px; line-height: 1.8; }
.empty { margin-top: 22px; padding: 18px; border: 1px dashed var(--line); border-radius: 6px; font-size: 13px; line-height: 1.9; color: var(--muted); }
.summary { margin-top: 20px; font-size: 13px; letter-spacing: .04em; color: #cfe3d9; }
.summary strong { color: var(--gold); font-size: 15px; }
.summary.small { margin-top: 6px; font-size: 12px; line-height: 1.9; color: var(--muted); }
.runs { list-style: none; padding: 0; margin: 20px 0 0; display: grid; gap: 8px; }
.runs li { border: 1px solid var(--line); border-left-width: 3px; border-radius: 6px; padding: 12px 14px; background: #0f1f1c; }
.runs li[data-outcome="victory"] { border-left-color: var(--gold); }
.runs li[data-outcome="defeat"] { border-left-color: #d99a86; }
.runs li[data-outcome="timeout"] { border-left-color: #7f8f96; }
.head { display: flex; align-items: baseline; gap: 10px; }
.head strong { font-size: 14px; letter-spacing: .06em; }
.head .outcome { font-size: 11px; padding: 2px 8px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); }
.runs li[data-outcome="victory"] .outcome { color: var(--gold); border-color: var(--gold); }
.runs li[data-outcome="defeat"] .outcome { color: #d99a86; border-color: #d99a8655; }
.head small { margin-left: auto; font-size: 12px; color: #cfe3d9; font-variant-numeric: tabular-nums; }
.meta { display: flex; flex-wrap: wrap; gap: 4px 10px; margin-top: 8px; font-size: 12px; color: var(--muted); }
.meta span:first-child { color: #c9b58a; }
.extra { margin-top: 4px; font-size: 11px; color: #7f8f96; }
.note { margin-top: 22px; padding-top: 14px; border-top: 1px solid var(--line); font-size: 11px; line-height: 1.9; color: #7f8f96; }
.reports > button { margin-top: 26px; width: 100%; }
</style>
