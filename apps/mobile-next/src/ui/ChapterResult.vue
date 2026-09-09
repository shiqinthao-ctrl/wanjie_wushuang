<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type { UiSnapshot } from '../core/GameCore';
import type { ChapterResult } from '../chapter/settlement';
import { dialogActivation } from '../input/dialogActivation';
const props = defineProps<{ snapshot: UiSnapshot; result?: ChapterResult; busy: boolean; error: string; leaving: boolean }>();
const emit = defineEmits<{ retry: []; exit: []; replay: [] }>();
const dialog = ref<HTMLDialogElement>(), activation = dialogActivation();
watchEffect(() => { if (props.snapshot.status === 'ended' && !dialog.value?.open) dialog.value?.showModal(); }, { flush: 'post' });
</script>

<template>
  <dialog ref="dialog" class="pause-dialog" aria-labelledby="chapter-end-title" @cancel.prevent @pointerdown.capture="activation.press" @pointercancel.capture="activation.cancel" @click.capture="activation.click">
    <small>首章 · 边境破围</small>
    <h2 id="chapter-end-title">{{ snapshot.endReason === 'victory' ? '破围成功' : snapshot.endReason === 'defeat' ? '本局生命耗尽' : '破围超时' }}</h2>
    <p>{{ snapshot.journey?.name }} · Lv.{{ snapshot.level }} · 击破 {{ snapshot.kills }}</p>
    <p v-if="busy" role="status">正在保存本局战报…</p>
    <div v-if="error" role="alert"><p>{{ error }}</p><button :disabled="busy || leaving" @click="emit('retry')">重试保存战报</button></div>
    <template v-if="result">
      <p role="status">首章战报已保存</p>
      <p>{{ result.stars ? '本关目标已完成' : '本局未获得章节星级' }} · {{ result.report.routes.length }} 条路线 · {{ result.report.bonds.length }} 个羁绊</p>
      <p v-if="result.unlockedCharms.length">新解锁 {{ result.unlockedCharms.length }} 件战备护符，效果将在战备版本开放。</p>
      <p>{{ result.report.awakened ? '下一局：尝试另一条进化路线。' : '下一目标：Lv.8 且核心术式 Lv.3，完成觉醒。' }}</p>
      <button class="primary" :disabled="busy || leaving" @click="emit('replay')">再次挑战本关</button>
    </template>
    <button :disabled="busy || leaving" @click="emit('exit')">返回大厅</button>
  </dialog>
</template>
