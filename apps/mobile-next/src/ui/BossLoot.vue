<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type { UiSnapshot } from '../core/GameCore';
import gear from '../data/gear.json';
import { dialogActivation } from '../input/dialogActivation';
const activation = dialogActivation();
const props = defineProps<{ active: boolean; offer: UiSnapshot['boss']['offer']; chapter?: boolean }>();
const emit = defineEmits<{ choose: [uid: string]; chapter: [] }>();
const dialog = ref<HTMLDialogElement>();
watchEffect(() => {
  if (props.active && !dialog.value?.open) dialog.value?.showModal();
  else if (!props.active) dialog.value?.close();
}, { flush: 'post' });
const rarity: Record<string, string> = { gold: '传说', mythic: '神话', purple: '史诗' };
const label = (key: string) => gear.affixPool.find(affix => affix[0] === key)?.[1] || key;
function choose(uid: string) { if (props.active && !document.hidden) emit('choose', uid); }
function chooseChapter() { if (props.active && !document.hidden) emit('chapter'); }
</script>

<template>
  <dialog ref="dialog" class="pause-dialog level-dialog boss-loot" aria-labelledby="boss-loot-title" @cancel.prevent @pointerdown.capture="activation.press" @pointercancel.capture="activation.cancel" @click.capture="activation.click">
    <small>黄巾巨将 · 战利品</small><h2 id="boss-loot-title" tabindex="-1" autofocus>选择首领奖励</h2>
    <p v-if="chapter">领取首章战利品后，封存本局构筑、章节进度与发现记录。</p>
    <p v-else>首领掉落已暂存。本次额外选择一件装备，确认后封存战果并入库存档。</p>
    <button v-if="chapter" class="primary" @click="chooseChapter">领取首章战利品</button>
    <button v-for="item in offer" :key="item.uid" class="level-option" @click="choose(item.uid)">
      <small>{{ rarity[item.rarity] || item.rarity }} · 基础评分 {{ item.score }}</small>
      <strong>{{ item.name }}</strong>
      <span>{{ item.affixes.map(affix => `${label(affix.key)} +${Math.round(affix.value * 100)}%`).join(' · ') }}</span>
    </button>
  </dialog>
</template>
