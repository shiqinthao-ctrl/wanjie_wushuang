<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type { UiSnapshot } from '../core/GameCore';
import type { RunResult } from '../core/settlement';
import { skillRoutes } from '../core/evolutionCatalog';
const props = defineProps<{ snapshot: UiSnapshot; result?: RunResult; busy: boolean; error: string; leaving: boolean }>();
const emit = defineEmits<{ retry: []; exit: []; replay: [] }>();
const dialog = ref<HTMLDialogElement>();
watchEffect(() => { if (props.snapshot.status === 'ended' && !dialog.value?.open) dialog.value?.showModal(); }, { flush: 'post' });
const rarity: Record<string, string> = { gold: '传说', mythic: '神话', purple: '史诗' };
let pressed: { button: HTMLButtonElement; pointerId: number } | undefined;
function beginAction(event: PointerEvent) {
  const button = event.target instanceof Element ? event.target.closest('button') : null;
  pressed = event.button === 0 && button && !button.disabled ? { button, pointerId: event.pointerId } : undefined;
}
function guardAction(event: MouseEvent) {
  const button = event.target instanceof Element ? event.target.closest('button') : null;
  const origin = pressed; pressed = undefined;
  // A held joystick can disappear and send its release click to the new dialog.
  // Keyboard and assistive activation have no pointer press and use detail zero.
  if (!button || event.detail === 0) return;
  if (origin?.button === button && (!(event instanceof PointerEvent) || origin.pointerId === event.pointerId)) return;
  event.preventDefault(); event.stopPropagation();
}
</script>

<template>
  <dialog ref="dialog" class="pause-dialog result-dialog" aria-labelledby="end-title" @cancel.prevent @pointerdown.capture="beginAction" @pointercancel.capture="pressed = undefined" @click.capture="guardAction">
    <small>乱世荒原 · 边境清剿</small>
    <h2 id="end-title">{{ snapshot.endReason === 'defeat' ? '本局生命耗尽' : snapshot.endReason === 'victory' ? '黄巾巨将已击败' : '首战时限已到' }}</h2>
    <p>击破 {{ snapshot.kills }} · Lv.{{ snapshot.level }} · {{ Math.floor(snapshot.time) }} 秒</p>
    <p v-if="busy" role="status">正在保存本局战果，请稍候…</p>
    <div v-else-if="error" role="alert"><p>{{ error }}</p><button class="primary" :disabled="leaving" @click="emit('retry')">重试保存战果</button><p class="result-note">请先重试。返回大厅后，尚未保存的本局奖励将无法补领。</p></div>
    <template v-if="result">
      <p class="result-stars" aria-label="本局星级">{{ '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars) }}</p>
      <p class="saved-status" role="status">战果已保存</p>
      <section v-if="result.journey" class="result-evolution" aria-label="本局进化战果"><strong>{{ result.journey.name }}</strong><p>{{ Object.values(result.journey.routes).map(id => skillRoutes.find(route => route.id === id)?.name).join(' · ') || '本局尚未开辟技能分支' }}</p><p>{{ result.journey.bonds.filter(bond => bond.active).map(bond => bond.name).join(' · ') || '本局未激活羁绊' }}</p><small>下一局回到初始英雄，重新探索组合。</small></section>
      <dl class="reward-grid" aria-label="结算奖励">
        <div><dt>金币</dt><dd>+{{ result.gold }}</dd></div><div><dt>账号经验</dt><dd>+{{ result.accountXpGain }}</dd></div>
        <div><dt>英雄熟练度</dt><dd>+{{ result.masteryGain + result.masteryMetaGain }}</dd></div><div><dt>万界徽记</dt><dd>+{{ result.modeTokens }}</dd></div>
      </dl>
      <p v-if="result.accountLevelUps">账号提升 {{ result.accountLevelUps }} 级，获得 {{ result.accountLevelUps }} 点天赋点。</p>
      <p class="result-note">本关最佳 {{ result.newStars }} 星 · 精英击破 {{ result.eliteKills }} · 最高连击 {{ result.maxCombo }}</p>
      <ul class="result-objectives" aria-label="关卡目标"><li v-for="objective in result.objectives" :key="objective.id"><span>{{ objective.label }}</span><strong>{{ objective.current }} / {{ objective.target }}</strong></li></ul>
      <details v-if="result.drops.length" class="result-drops"><summary>本局装备已入库 · {{ result.drops.length }} 件</summary><p v-for="(drop, index) in result.drops" :key="index">{{ rarity[drop.rarity] || '装备' }} · {{ drop.name || '本局装备' }}</p></details>
      <p v-else class="result-note">本局未获得装备</p>
      <button class="primary" :disabled="busy || leaving" @click="emit('replay')">再次挑战本关</button>
    </template>
    <button :disabled="busy || leaving" @click="emit('exit')">返回大厅</button>
  </dialog>
</template>

<style scoped>
.result-dialog { max-height: calc(100dvh - 40px); overflow-y: auto; }
.result-stars { color: var(--gold, #dbba75); font-size: 30px; letter-spacing: 8px; margin: 8px 0; }
.saved-status { color: #a5d5b6; font-size: 13px; }
.reward-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; background: #506154; border: 1px solid #506154; }
.reward-grid div { padding: 14px 8px; background: #172c26; }
.reward-grid dt { font-size: 12px; color: #b5c6ba; }
.reward-grid dd { margin: 6px 0 0; color: #eed59d; font-size: 23px; }
.result-note { font-size: 12px; line-height: 1.7; }
.result-objectives { list-style: none; padding: 0; font-size: 13px; }
.result-objectives li { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #45534a; }
.result-objectives strong { white-space: nowrap; color: #c6d7bb; }
.result-drops { text-align: left; padding: 12px 0; margin-bottom: 12px; font-size: 13px; }
.result-drops summary { cursor: pointer; min-height: 32px; }
</style>
