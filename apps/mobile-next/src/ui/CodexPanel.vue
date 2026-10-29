<script setup lang="ts">
import { computed, ref } from 'vue';
import { codexRows } from '../chapter/codex';
import type { CodexTrack, Seen } from '../chapter/codex';
import type { GameSave } from '../core/saveTypes';
/**
 * The codex page. It reads two things and writes nothing: `readChapterProgress` for what this save
 * has touched, and `save.build` for the account's skill inventory. Both columns on a fusion row name
 * their own source - see D28 for why one column would be a constant.
 */
const props = defineProps<{ save: GameSave }>();
defineEmits<{ back: [] }>();
const track = ref<CodexTrack>('chapter');
const codex = computed(() => codexRows(props.save, track.value));
const label: Record<Seen, string> = { 'not-found': '未见', discovered: '已见', awakened: '已觉醒', cleared: '已通关' };
const lineName = computed(() => track.value === 'chapter' ? '章节线' : '进化征途（威胁 v2）');
</script>

<template>
  <section class="codex">
    <small class="eyebrow">图鉴</small>
    <h1>已见与未见</h1>
    <p class="lede">
      目录里的每一条都在这里。<strong>未见</strong> 只说明这份存档还没在结算过的战局里碰到它，不是被规则锁住 ——
      两者是不同的事实，所以也写成不同的字。
    </p>
    <p class="count">目录 {{ codex.forms.length }} 种形态 / {{ codex.fusions.length }} 条融合 · 本档已见 {{ codex.seenCount }}/{{ codex.forms.length }}</p>

    <div class="track" role="group" aria-label="按哪条线的等级闸门">
      <button :aria-pressed="track === 'chapter'" @click="track = 'chapter'">章节线</button>
      <button :aria-pressed="track === 'journey'" @click="track = 'journey'">进化征途</button>
    </div>
    <p class="gate">{{ lineName }}：Lv.{{ codex.gates.form }} 可选形态，Lv.{{ codex.gates.awaken }} 且核心术式 Lv.3 觉醒。</p>

    <p v-if="codex.progressError" class="unknown" role="alert">
      存档进度读不出来（{{ codex.progressError }}），下面按「从未见过」显示；目录与配方仍然完整。
    </p>
    <p v-if="codex.unknown.length" class="unknown" role="alert">
      这份存档记着 {{ codex.unknown.length }} 个本作没有的形态（{{ codex.unknown.join('、') }}），已照实列出，没有丢掉。
    </p>

    <ul class="forms">
      <li v-for="form in codex.forms" :key="form.id" :style="{ borderColor: form.color + '55' }">
        <div class="head">
          <i :style="{ background: form.color }" aria-hidden="true"></i>
          <strong>{{ form.name }}</strong>
          <small>{{ form.heroName }}</small>
          <span class="seen" :data-seen="form.seen">{{ label[form.seen] }}</span>
        </div>
        <p>{{ form.detail }}</p>
        <p class="awaken">觉醒 · {{ form.awakening }}</p>
        <p class="needs">核心术式 {{ form.needs.coreSkillName }} · Lv.{{ form.needs.formLevel }} 可选 · Lv.{{ form.needs.awakenLevel }} 觉醒</p>
      </li>
    </ul>

    <h2>融合配方</h2>
    <p class="lede small">
      两列各自标来源：<strong>可组装</strong> 看技能表（三英雄同值，D28 测过），<strong>本档持有</strong> 看存档构筑。二者不等价 ——
      可组装但本档没凑齐的，就在这两列之间露出来。
    </p>
    <ul class="fusions">
      <li v-for="row in codex.fusions" :key="row.id">
        <div class="head">
          <strong>{{ row.name }}</strong>
          <span class="col" :data-ok="row.assembleAble">可组装</span>
          <span class="col" :data-ok="row.held">本档持有</span>
        </div>
        <div class="parts">
          <span v-for="part in row.parts" :key="part.id" :data-live="part.live" :data-owned="part.owned">
            {{ part.name }}<small>{{ part.activeName }} + {{ part.passive }}</small>
          </span>
        </div>
        <p v-if="!row.assembleAble" class="why">
          部件 {{ row.parts.filter(part => !part.live).map(part => part.name).join('、') }} 的技能不在本作可用技能表里，任何一局都组装不出来。
        </p>
        <p v-else-if="!row.held" class="why">两个部件都能在局内做出来，但这份存档的构筑还没有凑齐它们的技能。</p>
      </li>
    </ul>

    <button class="primary" @click="$emit('back')">返回大厅</button>
  </section>
</template>

<style scoped>
.codex { max-width: 760px; margin: 34px auto 80px; }
.codex h1 { font-size: 32px; margin: 14px 0 16px; }
.codex h2 { font-size: 22px; margin: 34px 0 10px; }
.lede { font-size: 13px; line-height: 1.9; color: var(--muted); }
.lede.small { font-size: 12px; }
.count { margin-top: 14px; font-size: 12px; letter-spacing: .08em; color: var(--gold); }
.track { display: flex; gap: 10px; margin: 22px 0 10px; }
.track button { flex: 1; }
.track button[aria-pressed="true"] { border-color: var(--gold); color: var(--gold); }
.gate { font-size: 12px; color: var(--muted); }
.unknown { margin-top: 14px; padding: 10px 12px; border-left: 2px solid #e08a6a; background: #2a1b16; font-size: 12px; line-height: 1.8; }
.forms, .fusions { list-style: none; padding: 0; margin: 18px 0 0; display: grid; gap: 10px; }
.forms li, .fusions li { border: 1px solid var(--line); border-radius: 6px; padding: 14px 16px; background: #0f1f1c; }
.head { display: flex; align-items: center; gap: 10px; }
.head i { width: 10px; height: 10px; border-radius: 50%; flex: none; }
.head strong { font-size: 15px; letter-spacing: .06em; }
.head small { color: var(--muted); font-size: 11px; }
.head .seen { margin-left: auto; font-size: 11px; padding: 3px 8px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); }
.head .seen[data-seen="discovered"] { color: #9fd0b0; border-color: #9fd0b055; }
.head .seen[data-seen="awakened"] { color: var(--gold); border-color: var(--gold); }
.head .seen[data-seen="cleared"] { color: #7eefce; border-color: #7eefce88; }
.forms p, .fusions p { font-size: 12px; line-height: 1.8; color: var(--muted); margin-top: 8px; }
.forms .awaken { color: #c9b58a; }
.forms .needs { color: #8fa79b; }
.head .col { font-size: 11px; padding: 3px 8px; border: 1px solid var(--line); border-radius: 999px; }
.head .col[data-ok="true"] { color: #7eefce; border-color: #7eefce88; }
.head .col[data-ok="false"] { color: #d99a86; border-color: #d99a8655; }
.head .col:nth-of-type(1) { margin-left: auto; }
.parts { display: flex; gap: 8px; margin-top: 10px; }
.parts span { flex: 1; font-size: 13px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 5px; }
.parts span[data-live="false"] { color: #b98d7d; border-style: dashed; }
.parts span[data-owned="true"] { border-color: #7eefce66; }
.parts small { font-size: 11px; color: var(--muted); margin-top: 4px; }
.why { color: #c8a48f !important; }
.codex > button { margin-top: 30px; width: 100%; }
@media (max-width: 640px) {
  .codex { margin: 22px auto 56px; }
  .codex h1 { font-size: 26px; }
  .codex h2 { font-size: 15px; }
  .head { flex-wrap: wrap; }
  /* Two parts side by side stop being readable under ~360px, so they stack. */
  .parts { flex-direction: column; }
}
</style>
