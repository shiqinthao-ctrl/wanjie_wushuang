<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import type { BattleHandle } from '../game/mountBattle';
import type { UiSnapshot } from '../core/GameCore';
import { bindKeyboard } from '../input/controls';
import MovePad from './MovePad.vue';
const emit = defineEmits<{ exit: [] }>();
const host = ref<HTMLElement>();
const pauseDialog = ref<HTMLDialogElement>();
const snapshot = shallowRef<UiSnapshot>({ status: 'idle', time: 0 });
const error = ref('');
const ready = ref(false);
const leaving = ref(false);
let handle: BattleHandle | undefined;
let controls: ReturnType<typeof bindKeyboard> | undefined;
let cancelled = false;
function pause() {
  if (snapshot.value.status !== 'running') return;
  controls?.clear(); handle?.core.pause(); snapshot.value = handle!.core.snapshot();
  nextTick(() => pauseDialog.value?.showModal());
}
function resume() {
  if (document.hidden) return;
  handle?.core.resume(); snapshot.value = handle!.core.snapshot();
  pauseDialog.value?.close(); host.value?.focus();
}
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
    <div v-if="ready && snapshot.status === 'running'" class="control-zone"><MovePad @move="(x, y) => handle?.core.move(x, y)" /><p class="control-hint">拖动摇杆探索战场<br />电脑使用 WASD / 方向键</p></div>
    <div v-if="!ready || error" class="loading-curtain" role="status"><h2>{{ error ? '战场未能开启' : '正在前往乱世荒原' }}</h2><p>{{ error || '整装，待发。' }}</p><button @click="leave">返回大厅</button></div>
    <dialog ref="pauseDialog" class="pause-dialog" aria-labelledby="pause-title" @cancel.prevent>
      <small>暂停征途</small><h2 id="pause-title">战局已暂停</h2><p>切回页面后，点击继续再出发。</p>
      <button class="primary" @click="resume">继续战斗</button><button :disabled="leaving" @click="leave">返回大厅</button>
    </dialog>
  </section>
</template>
