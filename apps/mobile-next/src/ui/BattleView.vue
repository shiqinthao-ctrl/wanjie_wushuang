<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { BattleHandle } from '../game/mountBattle';
import type { UiSnapshot } from '../core/GameCore';
import { bindKeyboard } from '../input/controls';
import MovePad from './MovePad.vue';
import type { ChoiceKind } from '../core/progression';
import type { Action } from '../core/CombatSimulation';
import { EventSession } from '../storage/EventSession';
import type { SaveRepository, SaveSlot } from '../storage/SaveRepository';
import { eventOptions } from '../core/firstEvents';
import type { EventCode } from '../core/firstEvents';
import { chestTitle, formName } from '../core/timedChests';
const props = defineProps<{ slot: SaveSlot; repository: SaveRepository }>();
const emit = defineEmits<{ exit: [] }>();
const host = ref<HTMLElement>();
const pauseDialog = ref<HTMLDialogElement>();
const choiceDialog = ref<HTMLDialogElement>();
const endDialog = ref<HTMLDialogElement>();
const eventDialog = ref<HTMLDialogElement>();
const chestDialog = ref<HTMLDialogElement>();
const snapshot = shallowRef<UiSnapshot>({ status: 'idle', time: 0, hp: 0, maxHp: 0, level: 1, xp: 0, xpNeed: 26, skills: {}, passives: {}, choice: undefined, kills: 0, heat: 0, dodgeCd: 0, skillCd: 0, ult: 0, map: { used: 0, bonusGold: 0, hazardSuppress: 0, target: undefined, notice: '' }, encounter: { offer: undefined, shopBuff: 0, gearCount: 0, notice: '' }, chests: { offer: undefined, notice: '', rewards: [], evolved: [], fused: [] } });
const chestStates: Record<string, string> = { locked: '未解锁', ready: '领取', choosing: '选择中', claimed: '已领取' };
const chestCopy = { evo: '术式进化', fusion: '双术式融合', upgrade: '随机强化已拥有且未满级的术式', gear: '获得一件紫色装备，暂存本局战利品' };
const eventBusy = ref(false), eventError = ref(''), eventGold = ref(Number(props.slot.save.gold));
const eventSelection = ref<{ token: number; code: EventCode }>();
let eventSession: EventSession | undefined;
const eventCopy: Record<EventCode, { title: string; detail: string }> = {
  merchantAtk: { title: '购买火力', detail: '-250 金币；游商火力 +18%。赤焰战神专属普攻不受此加成。' },
  merchantHeal: { title: '购买回复', detail: '-180 金币；恢复 40% 最大生命，最高恢复至满血。' },
  goldOpen: { title: '打开黄金宝箱', detail: '获得一件本局装备，并随机强化一项已拥有且未满级的术式。' },
  goldCash: { title: '换成金币', detail: '立即获得 500 金币并保存。' },
  skip: { title: '离开', detail: '不购买或领取奖励，继续征途。' },
};
const error = ref('');
const ready = ref(false);
const leaving = ref(false);
let handle: BattleHandle | undefined;
let controls: ReturnType<typeof bindKeyboard> | undefined;
let cancelled = false;
function pause() {
  if (!handle || !['running', 'choosing', 'encounter', 'chest'].includes(handle.core.snapshot().status)) return;
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
function claimChest(index: number) {
  if (document.hidden || !handle?.core.claimChest(index)) return;
  controls?.clear(); snapshot.value = handle.core.snapshot();
}
function pickChest(token: number, index: number) {
  if (document.hidden || !handle?.core.pickChest(token, index)) return;
  controls?.clear(); snapshot.value = handle.core.snapshot();
}
async function chooseEvent(token: number, code: EventCode) {
  if (document.hidden || eventBusy.value || !eventSession || !handle || leaving.value) return;
  eventSelection.value = { token, code }; eventBusy.value = true; eventError.value = '';
  controls?.clear();
  try {
    await eventSession.choose(token, code);
    eventGold.value = eventSession.gold;
    snapshot.value = handle.core.snapshot(); eventSelection.value = undefined;
  } catch (cause) {
    eventError.value = cause instanceof Error && cause.message.includes('存档已更新') ? cause.message : '本次操作尚未确认保存，战局保持暂停。请重试原选择，或返回大厅重新载入。';
  } finally { eventBusy.value = false; }
}
watch(() => snapshot.value.status, status => {
  if (status !== 'running') controls?.clear();
  if (status !== 'paused') pauseDialog.value?.close();
  if (status !== 'choosing') choiceDialog.value?.close();
  if (status !== 'encounter') eventDialog.value?.close();
  if (status !== 'chest') chestDialog.value?.close();
  if (status === 'running') host.value?.focus();
  if (status === 'paused' && !pauseDialog.value?.open) pauseDialog.value?.showModal();
  if (status === 'choosing' && !choiceDialog.value?.open) choiceDialog.value?.showModal();
  if (status === 'ended' && !endDialog.value?.open) endDialog.value?.showModal();
  if (status === 'encounter' && !eventDialog.value?.open) eventDialog.value?.showModal();
  if (status === 'chest' && !chestDialog.value?.open) chestDialog.value?.showModal();
}, { flush: 'post' });
async function leave() {
  if (leaving.value || eventBusy.value) return;
  leaving.value = true; cancelled = true; controls?.destroy();
  await handle?.destroy(); emit('exit');
}
onMounted(async () => {
  try {
    const { mountBattle } = await import('../game/mountBattle');
    if (cancelled || !host.value) return;
    handle = mountBattle(host.value, value => { snapshot.value = value; }, () => { ready.value = true; host.value?.focus(); }, message => { error.value = message; }, props.slot.save);
    eventSession = new EventSession(props.repository, props.slot, handle.core);
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
      <p v-if="snapshot.encounter.notice" class="map-notice" role="status" aria-label="事件反馈">{{ snapshot.encounter.notice }}</p>
    </aside>
    <aside v-if="ready" class="timed-rewards" aria-label="定时宝箱">
      <p v-if="snapshot.chests.notice" role="status" aria-label="宝箱反馈">{{ snapshot.chests.notice }}</p>
      <p v-if="snapshot.chests.evolved.length || snapshot.chests.fused.length" aria-label="已获得形态">{{ [...snapshot.chests.fused, ...snapshot.chests.evolved].map(formName).join(' · ') }}</p>
      <div><button v-for="reward in snapshot.chests.rewards" :key="reward.index" :class="{ 'reward-ready': reward.state === 'ready' }" :disabled="snapshot.status !== 'running' || reward.state !== 'ready'" @click="claimChest(reward.index)"><small>{{ format(reward.at) }} 宝箱</small><strong>{{ chestStates[reward.state] }}</strong></button></div>
    </aside>
    <div v-if="ready && snapshot.status === 'running'" class="control-zone"><MovePad @move="(x, y) => handle?.core.move(x, y)" /><div class="action-pad"><button aria-label="闪避" :disabled="snapshot.dodgeCd > 0" @pointerdown.prevent="action('dodge')" @click="event => { if (event.detail === 0) action('dodge'); }"><strong>闪避</strong><small>{{ snapshot.dodgeCd > 0 ? snapshot.dodgeCd.toFixed(1) + 's' : 'Space' }}</small></button><button aria-label="炎龙斩" :disabled="snapshot.skillCd > 0" @pointerdown.prevent="action('skill')" @click="event => { if (event.detail === 0) action('skill'); }"><strong>炎龙斩</strong><small>{{ snapshot.skillCd > 0 ? snapshot.skillCd.toFixed(1) + 's' : 'E / Q' }}</small></button><button aria-label="赤龙降世" :disabled="snapshot.ult < 100" @pointerdown.prevent="action('ultimate')" @click="event => { if (event.detail === 0) action('ultimate'); }"><strong>赤龙降世</strong><small>{{ snapshot.ult < 100 ? Math.floor(snapshot.ult) + '%' : 'R' }}</small></button><button aria-label="地图互动" :disabled="!snapshot.map.target?.canUse" @pointerdown.prevent="interact" @click="event => { if (event.detail === 0) interact(); }"><strong>互动</strong><small>{{ snapshot.map.target?.canUse ? 'F / 互动' : '靠近使用' }}</small></button></div></div>
    <div v-if="!ready || error" class="loading-curtain" role="status"><h2>{{ error ? '战场未能开启' : '正在前往乱世荒原' }}</h2><p>{{ error || '整装，待发。' }}</p><button @click="leave">返回大厅</button></div>
    <dialog ref="pauseDialog" class="pause-dialog" aria-labelledby="pause-title" @cancel.prevent>
      <small>暂停征途</small><h2 id="pause-title">战局已暂停</h2><p>切回页面后，点击继续再出发。</p>
      <button class="primary" @click="resume">继续战斗</button><button :disabled="leaving || eventBusy" @click="leave">返回大厅</button>
    </dialog>
    <dialog ref="choiceDialog" class="pause-dialog level-dialog" aria-labelledby="level-title" @cancel.prevent>
      <small>境界突破 · Lv.{{ snapshot.level }}</small><h2 id="level-title">选择本局强化</h2><p>从以下术式中选择一项，继续征途。</p>
      <template v-for="offer in snapshot.choice ? [snapshot.choice] : []" :key="offer.token"><button v-for="option in offer.options" :key="`${option.kind}-${option.id}`" class="level-option" @click="choose(offer.token, option.kind, option.id)"><small>{{ option.kind === 'active' ? '主动术式' : '被动心法' }}</small><strong>{{ option.label }}</strong><span>Lv.{{ (option.kind === 'active' ? snapshot.skills : snapshot.passives)[option.id] || 0 }} → Lv.{{ ((option.kind === 'active' ? snapshot.skills : snapshot.passives)[option.id] || 0) + 1 }}</span></button></template>
    </dialog>
    <dialog ref="eventDialog" class="pause-dialog level-dialog event-dialog" aria-labelledby="event-title" @cancel.prevent>
      <small>荒原奇遇 · 当前金币 {{ eventGold }}</small><h2 id="event-title">{{ snapshot.encounter.offer?.kind === 'merchant' ? '万界游商' : '黄金宝箱' }}</h2>
      <p>{{ snapshot.encounter.offer?.kind === 'merchant' ? '金币不足时，本次购买无效并继续战斗。' : '宝箱装备暂存本局；装备入库随结算功能后续开放。' }}</p>
      <template v-for="offer in snapshot.encounter.offer ? [snapshot.encounter.offer] : []" :key="offer.token"><button v-for="code in eventOptions[offer.kind]" :key="code" class="level-option" :disabled="eventBusy || !!eventSelection" @click="chooseEvent(offer.token, code)"><strong>{{ eventCopy[code].title }}</strong><span>{{ eventCopy[code].detail }}</span></button></template>
      <p v-if="eventBusy" role="status">正在保存，请稍候…</p>
      <div v-if="eventError" role="alert"><p>{{ eventError }}</p><button v-if="eventSelection" class="primary" :disabled="eventBusy" @click="chooseEvent(eventSelection.token, eventSelection.code)">重试原选择</button><button :disabled="eventBusy || leaving" @click="leave">返回大厅</button></div>
    </dialog>
    <dialog ref="chestDialog" class="pause-dialog level-dialog" aria-labelledby="chest-title" @cancel.prevent>
      <small>荒原馈赠 · 三选一</small><h2 id="chest-title">领取宝箱奖励</h2><p>选择一项奖励后继续战斗。本局装备 {{ snapshot.encounter.gearCount }} 件，结算入库建设中。</p>
      <template v-for="offer in snapshot.chests.offer ? [snapshot.chests.offer] : []" :key="offer.token"><button v-for="(option, index) in offer.options" :key="index" class="level-option" @click="pickChest(offer.token, index)"><strong>{{ chestTitle(option) }}</strong><span>{{ chestCopy[option.type] }}</span></button></template>
    </dialog>
    <dialog ref="endDialog" class="pause-dialog" aria-labelledby="end-title" @cancel.prevent><small>战斗预览</small><h2 id="end-title">{{ snapshot.endReason === 'defeat' ? '本局生命耗尽' : '本次预览结束' }}</h2><p>击破 {{ snapshot.kills }} · Lv.{{ snapshot.level }}<br />事件金币已保存；本局装备 {{ snapshot.encounter.gearCount }} 件。首领与结算建设中，本局装备及结算奖励尚不入库。</p><button class="primary" @click="leave">返回大厅</button></dialog>
  </section>
</template>
