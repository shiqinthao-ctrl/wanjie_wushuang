<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { BattleHandle } from '../game/mountBattle';
import type { UiSnapshot } from '../core/GameCore';
import { bindKeyboard } from '../input/controls';
import MovePad from './MovePad.vue';
import type { ChoiceKind } from '../core/progression';
import type { Action } from '../core/CombatSimulation';
const emit = defineEmits<{ exit: [] }>();
const host = ref<HTMLElement>();
const pauseDialog = ref<HTMLDialogElement>();
const choiceDialog = ref<HTMLDialogElement>();
const endDialog = ref<HTMLDialogElement>();
const snapshot = shallowRef<UiSnapshot>({ status: 'idle', time: 0, hp: 0, maxHp: 0, level: 1, xp: 0, xpNeed: 26, skills: {}, passives: {}, choice: undefined, kills: 0, heat: 0, dodgeCd: 0, skillCd: 0, ult: 0, map: { used: 0, bonusGold: 0, hazardSuppress: 0, target: undefined, notice: '' } });
const error = ref('');
const ready = ref(false);
const leaving = ref(false);
let handle: BattleHandle | undefined;
let controls: ReturnType<typeof bindKeyboard> | undefined;
let cancelled = false;
function pause() {
  if (!handle || !['running', 'choosing'].includes(handle.core.snapshot().status)) return;
  controls?.clear(); handle?.core.pause(); snapshot.value = handle!.core.snapshot();
}
function resume() {
  if (document.hidden) return;
  handle?.core.resume(); snapshot.value = handle!.core.snapshot();
  host.value?.focus();
}
function choose(token: number, kind: ChoiceKind, id: string) {
  if (document.hidden || !handle?.core.choose(token, kind, id)) return;
  controls?.clear(); snapshot.value = handle.core.snapshot();
  if (snapshot.value.status === 'running') host.value?.focus();
}
function action(value: Action) {
  if (document.hidden || !handle) return;
  handle.core.action(value); snapshot.value = handle.core.snapshot();
}
function interact() {
  if (document.hidden || !handle) return;
  handle.core.interact(); snapshot.value = handle.core.snapshot();
}
watch(() => snapshot.value.status, status => {
  if (status !== 'running') controls?.clear();
  if (status !== 'paused') pauseDialog.value?.close();
  if (status !== 'choosing') choiceDialog.value?.close();
  if (status === 'running') host.value?.focus();
  if (status === 'paused' && !pauseDialog.value?.open) pauseDialog.value?.showModal();
  if (status === 'choosing' && !choiceDialog.value?.open) choiceDialog.value?.showModal();
  if (status === 'ended' && !endDialog.value?.open) endDialog.value?.showModal();
}, { flush: 'post' });
async function leave() {
  if (leaving.value) return;
  leaving.value = true; cancelled = true; controls?.destroy();
  await handle?.destroy(); emit('exit');
}
onMounted(async () => {
  try {
    const { mountBattle } = await import('../game/mountBattle');
    if (cancelled || !host.value) return;
    handle = mountBattle(host.value, value => { snapshot.value = value; }, () => { ready.value = true; host.value?.focus(); }, message => { error.value = message; });
    controls = bindKeyboard(handle.core, pause);
  } catch { error.value = '当前浏览器无法启动战场，请确认已启用图形加速后重试。'; }
});
onBeforeUnmount(() => { cancelled = true; controls?.destroy(); void handle?.destroy(); });
const format = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
</script>

<template>
  <section class="battle-view" aria-label="边境清剿战场">
    <div ref="host" class="canvas-host" tabindex="-1" aria-label="战场，使用方向键或摇杆移动"></div>
    <header class="battle-hud"><div><small>乱世荒原 · 边境清剿</small><strong>赤焰战神</strong></div><time aria-label="本局时间">{{ format(snapshot.time) }}</time><button :disabled="!ready || leaving" @click="pause">暂停</button></header>
    <p class="stage-note">战斗预览 · 首领与结算建设中</p>
    <div class="combat-vitals" aria-label="战斗状态"><div><span>生命 {{ Math.ceil(snapshot.hp) }} / {{ Math.ceil(snapshot.maxHp) }}</span><progress aria-label="生命值" :value="snapshot.hp" :max="snapshot.maxHp || 1"></progress></div><div><span>Lv.{{ snapshot.level }} · 经验 {{ Math.floor(snapshot.xp) }} / {{ snapshot.xpNeed }}</span><progress aria-label="经验值" :value="snapshot.xp" :max="snapshot.xpNeed"></progress></div></div>
    <div class="combat-record"><span aria-label="本局击杀">击破 {{ snapshot.kills }}</span><span>炎势 {{ Math.round(snapshot.heat) }}%</span></div>
    <aside v-if="ready" class="map-route" aria-label="地图指引">
      <small aria-label="地图互动进度">地图互动 {{ Math.min(1, snapshot.map.used) }} / 1<span v-if="snapshot.map.hazardSuppress > 0"> · 压制 {{ Math.ceil(snapshot.map.hazardSuppress) }}s</span></small>
      <p v-if="snapshot.map.target" aria-label="交互目标"><strong>{{ snapshot.map.target.name }}</strong> · {{ snapshot.map.target.canUse ? '可互动' : snapshot.map.target.direction + ' ' + snapshot.map.target.distance + 'm' }}</p>
      <p v-else>地图互动已完成</p>
      <small v-if="snapshot.map.target?.canUse">{{ snapshot.map.target.description }}</small>
      <p v-if="snapshot.map.notice" class="map-notice" role="status" aria-label="地图反馈">{{ snapshot.map.notice }}</p>
    </aside>
    <div v-if="ready && snapshot.status === 'running'" class="control-zone"><MovePad @move="(x, y) => handle?.core.move(x, y)" /><div class="action-pad"><button aria-label="闪避" :disabled="snapshot.dodgeCd > 0" @pointerdown.prevent="action('dodge')" @click="event => { if (event.detail === 0) action('dodge'); }"><strong>闪避</strong><small>{{ snapshot.dodgeCd > 0 ? snapshot.dodgeCd.toFixed(1) + 's' : 'Space' }}</small></button><button aria-label="炎龙斩" :disabled="snapshot.skillCd > 0" @pointerdown.prevent="action('skill')" @click="event => { if (event.detail === 0) action('skill'); }"><strong>炎龙斩</strong><small>{{ snapshot.skillCd > 0 ? snapshot.skillCd.toFixed(1) + 's' : 'E / Q' }}</small></button><button aria-label="赤龙降世" :disabled="snapshot.ult < 100" @pointerdown.prevent="action('ultimate')" @click="event => { if (event.detail === 0) action('ultimate'); }"><strong>赤龙降世</strong><small>{{ snapshot.ult < 100 ? Math.floor(snapshot.ult) + '%' : 'R' }}</small></button><button aria-label="地图互动" :disabled="!snapshot.map.target?.canUse" @pointerdown.prevent="interact" @click="event => { if (event.detail === 0) interact(); }"><strong>互动</strong><small>{{ snapshot.map.target?.canUse ? 'F / 互动' : '靠近使用' }}</small></button></div></div>
    <div v-if="!ready || error" class="loading-curtain" role="status"><h2>{{ error ? '战场未能开启' : '正在前往乱世荒原' }}</h2><p>{{ error || '整装，待发。' }}</p><button @click="leave">返回大厅</button></div>
    <dialog ref="pauseDialog" class="pause-dialog" aria-labelledby="pause-title" @cancel.prevent>
      <small>暂停征途</small><h2 id="pause-title">战局已暂停</h2><p>切回页面后，点击继续再出发。</p>
      <button class="primary" @click="resume">继续战斗</button><button :disabled="leaving" @click="leave">返回大厅</button>
    </dialog>
    <dialog ref="choiceDialog" class="pause-dialog level-dialog" aria-labelledby="level-title" @cancel.prevent>
      <small>境界突破 · Lv.{{ snapshot.level }}</small><h2 id="level-title">选择本局强化</h2><p>从以下术式中选择一项，继续征途。</p>
      <template v-for="offer in snapshot.choice ? [snapshot.choice] : []" :key="offer.token"><button v-for="option in offer.options" :key="`${option.kind}-${option.id}`" class="level-option" @click="choose(offer.token, option.kind, option.id)"><small>{{ option.kind === 'active' ? '主动术式' : '被动心法' }}</small><strong>{{ option.label }}</strong><span>Lv.{{ (option.kind === 'active' ? snapshot.skills : snapshot.passives)[option.id] || 0 }} → Lv.{{ ((option.kind === 'active' ? snapshot.skills : snapshot.passives)[option.id] || 0) + 1 }}</span></button></template>
    </dialog>
    <dialog ref="endDialog" class="pause-dialog" aria-labelledby="end-title" @cancel.prevent><small>战斗预览</small><h2 id="end-title">{{ snapshot.endReason === 'defeat' ? '本局生命耗尽' : '本次预览结束' }}</h2><p>击破 {{ snapshot.kills }} · Lv.{{ snapshot.level }}<br />首领与奖励结算仍在建设中，本次不发放奖励。</p><button class="primary" @click="leave">返回大厅</button></dialog>
  </section>
</template>
