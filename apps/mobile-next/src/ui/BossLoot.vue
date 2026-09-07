<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type { UiSnapshot } from '../core/GameCore';
import gear from '../data/gear.json';
const props = defineProps<{ active: boolean; offer: UiSnapshot['boss']['offer'] }>();
const emit = defineEmits<{ choose: [uid: string] }>();
const dialog = ref<HTMLDialogElement>();
watchEffect(() => {
  if (props.active && !dialog.value?.open) dialog.value?.showModal();
  else if (!props.active) dialog.value?.close();
}, { flush: 'post' });
const rarity: Record<string, string> = { gold: '传说', mythic: '神话', purple: '史诗' };
const label = (key: string) => gear.affixPool.find(affix => affix[0] === key)?.[1] || key;
function choose(uid: string) { if (props.active && !document.hidden) emit('choose', uid); }
</script>

<template>
  <dialog ref="dialog" class="pause-dialog level-dialog boss-loot" aria-labelledby="boss-loot-title" @cancel.prevent>
    <small>黄巾巨将 · 战利品</small><h2 id="boss-loot-title">选择首领奖励</h2>
    <p>首领掉落已暂存。本次额外选择一件装备，确认后封存战果。结算入库建设中。</p>
    <button v-for="item in offer" :key="item.uid" class="level-option" @click="choose(item.uid)">
      <small>{{ rarity[item.rarity] || item.rarity }} · 基础评分 {{ item.score }}</small>
      <strong>{{ item.name }}</strong>
      <span>{{ item.affixes.map(affix => `${label(affix.key)} +${Math.round(affix.value * 100)}%`).join(' · ') }}</span>
    </button>
  </dialog>
</template>
