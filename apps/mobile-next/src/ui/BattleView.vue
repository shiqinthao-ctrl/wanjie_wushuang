<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { BattleHandle } from '../game/mountBattle';
import type { UiSnapshot } from '../core/GameCore';
import { bindKeyboard } from '../input/controls';
import MovePad from './MovePad.vue';
import type { ChoiceKind } from '../core/progression';
const emit = defineEmits<{ exit: [] }>();
const host = ref<HTMLElement>();
const pauseDialog = ref<HTMLDialogElement>();
const choiceDialog = ref<HTMLDialogElement>();
const snapshot = shallowRef<UiSnapshot>({ status: 'idle', time: 0, hp: 0, maxHp: 0, level: 1, xp: 0, xpNeed: 26, skills: {}, passives: {}, choice: undefined });
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
watch(() => snapshot.value.status, status => {
  if (status !== 'running') controls?.clear();
  if (status !== 'paused') pauseDialog.value?.close();
  if (status !== 'choosing') choiceDialog.value?.close();
  if (status === 'running') host.value?.focus();
  if (status === 'paused' && !pauseDialog.value?.open) pauseDialog.value?.showModal();
  if (status === 'choosing' && !choiceDialog.value?.open) choiceDialog.value?.showModal();
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
    <p class="stage-note">战场预览 · 玩法迁移中</p>
    <div class="combat-vitals" aria-label="战斗状态"><div><span>生命 {{ Math.ceil(snapshot.hp) }} / {{ Math.ceil(snapshot.maxHp) }}</span><progress aria-label="生命值" :value="snapshot.hp" :max="snapshot.maxHp || 1"></progress></div><div><span>Lv.{{ snapshot.level }} · 经验 {{ Math.floor(snapshot.xp) }} / {{ snapshot.xpNeed }}</span><progress aria-label="经验值" :value="snapshot.xp" :max="snapshot.xpNeed"></progress></div></div>
    <div v-if="ready && snapshot.status === 'running'" class="control-zone"><MovePad @move="(x, y) => handle?.core.move(x, y)" /><p class="control-hint">拖动摇杆探索战场<br />电脑使用 WASD / 方向键</p></div>
    <div v-if="!ready || error" class="loading-curtain" role="status"><h2>{{ error ? '战场未能开启' : '正在前往乱世荒原' }}</h2><p>{{ error || '整装，待发。' }}</p><button @click="leave">返回大厅</button></div>
    <dialog ref="pauseDialog" class="pause-dialog" aria-labelledby="pause-title" @cancel.prevent>
      <small>暂停征途</small><h2 id="pause-title">战局已暂停</h2><p>切回页面后，点击继续再出发。</p>
      <button class="primary" @click="resume">继续战斗</button><button :disabled="leaving" @click="leave">返回大厅</button>
    </dialog>
    <dialog ref="choiceDialog" class="pause-dialog level-dialog" aria-labelledby="level-title" @cancel.prevent>
      <small>境界突破 · Lv.{{ snapshot.level }}</small><h2 id="level-title">选择本局强化</h2><p>从以下术式中选择一项，继续征途。</p>
      <template v-for="offer in snapshot.choice ? [snapshot.choice] : []" :key="offer.token"><button v-for="option in offer.options" :key="`${option.kind}-${option.id}`" class="level-option" @click="choose(offer.token, option.kind, option.id)"><small>{{ option.kind === 'active' ? '主动术式' : '被动心法' }}</small><strong>{{ option.label }}</strong><span>Lv.{{ (option.kind === 'active' ? snapshot.skills : snapshot.passives)[option.id] || 0 }} → Lv.{{ ((option.kind === 'active' ? snapshot.skills : snapshot.passives)[option.id] || 0) + 1 }}</span></button></template>
    </dialog>
  </section>
</template>
