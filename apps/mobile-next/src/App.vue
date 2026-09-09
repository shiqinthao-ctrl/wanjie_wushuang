<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import fresh from './data/freshSave.json';
import { calculateStartup } from './core/growth';
import { SaveRepository } from './storage/SaveRepository';
import type { SaveSlot } from './storage/SaveRepository';
import { previewBlocker } from './storage/schema30';
import SavePanel from './ui/SavePanel.vue';
import './ui/saves.css';
import { starters, starter, isStarter, heroForms } from './core/evolutionCatalog';
import type { Journey } from './core/evolutionCatalog';
import { evolutionBuild } from './core/RunEvolution';
import { prepareHero } from './storage/prepareHero';
import './ui/evolution.css';
const journey = ref<Journey>('classic');
const hero = computed(() => starter(active.value && isStarter(active.value.save.hero) ? active.value.save.hero : 'H001'));
const active = shallowRef<SaveSlot>();
const repository = shallowRef<SaveRepository>();
const busy = ref(false), saveBusy = ref(false), storageError = ref('');
const launchBlocker = computed(() => active.value ? previewBlocker(active.value.save, journey.value) : '');
const prepared = computed(() => { const save = active.value && !launchBlocker.value ? active.value.save : fresh; return calculateStartup(journey.value === 'evolution' ? { ...save, build: evolutionBuild(save.hero) } : save); });
const BattleView = defineAsyncComponent(() => import('./ui/BattleView.vue'));
const page = ref<'home' | 'battle' | 'settings' | 'saves'>('home');
const startButton = ref<HTMLButtonElement>();
const base = import.meta.env.BASE_URL;
let disposed = false;
async function load() {
  if (busy.value) return;
  busy.value = true; storageError.value = '';
  try {
    repository.value ??= await SaveRepository.open();
    if (disposed) { repository.value.close(); return; }
    active.value = await repository.value.initialize();
  } catch { repository.value?.close(); repository.value = undefined; storageError.value = '无法读取本地存档，请检查浏览器存储权限后重试。'; }
  finally { busy.value = false; }
}
async function home() { page.value = 'home'; await load(); await nextTick(); startButton.value?.focus(); }
async function enter() { await load(); if (active.value && !busy.value && !storageError.value && !launchBlocker.value) page.value = 'battle'; }
async function selectHero(id: string) {
  if (!active.value || !repository.value || busy.value) return;
  busy.value = true; storageError.value = '';
  try { active.value = await prepareHero(repository.value, active.value, id); }
  catch (cause) { storageError.value = cause instanceof Error ? cause.message : '英雄选择尚未保存，请重试读取存档。'; }
  finally { busy.value = false; }
}
async function replay(slotId: string) {
  page.value = 'home'; await nextTick();
  if (!repository.value || busy.value) return;
  busy.value = true; storageError.value = '';
  try {
    active.value = await repository.value.select(slotId);
    if (!previewBlocker(active.value.save, journey.value)) page.value = 'battle';
  } catch { storageError.value = '无法重新载入本局存档，请重试读取存档。'; }
  finally { busy.value = false; }
}
onMounted(load);
onBeforeUnmount(() => { disposed = true; repository.value?.close(); });
</script>

<template>
  <BattleView v-if="page === 'battle' && active && repository" :slot="active" :repository="repository" :journey="journey" @exit="home" @replay="replay" />
  <main v-else class="app-shell">
    <header class="masthead"><span class="seal">万</span><div><strong>万界无双</strong><small>乱世之中，自成无双</small></div><button v-if="page === 'home'" :disabled="busy" @click="page = 'settings'">设置</button><button v-else :disabled="busy || saveBusy" @click="home">返回</button></header>
    <div v-if="storageError" class="storage-failure" role="alert"><p>{{ storageError }}</p><button :disabled="busy" @click="load">重试读取存档</button></div>
    <section v-if="page === 'home'" class="lobby">
      <div class="chapter-art" :style="{ backgroundImage: `linear-gradient(180deg, transparent 20%, #122522 100%), url(${base}art/battlefield.svg)` }">
        <span class="chapter-marker">第一章 / 乱世荒原</span>
        <img class="hero-portrait" :src="`${base}art/hero-${hero.id.toLowerCase()}.svg`" :alt="hero.name" />
        <div class="hero-caption"><small>{{ hero.style }}</small><h1>{{ hero.name }}</h1><p>{{ hero.description }}</p></div>
      </div>
      <div class="expedition"><span class="eyebrow">下一站 · ST001-01</span><h2>边境清剿</h2><p>在 06:00 前击败黄巾巨将并领取战利品。</p>
        <div class="journey-switch" aria-label="征途选择"><button :aria-pressed="journey === 'classic'" :disabled="busy" @click="journey = 'classic'">经典征途</button><button :aria-pressed="journey === 'evolution'" :disabled="busy" @click="journey = 'evolution'">进化征途</button></div>
        <section v-if="journey === 'evolution'" class="hero-select" aria-label="选择初始英雄"><p>三位初始英雄 · {{ heroForms.length }} 种进化形态</p><div><button v-for="item in starters" :key="item.id" :aria-pressed="active?.save.hero === item.id" :disabled="busy || !active?.save.heroes[item.id]?.unlocked" @click="selectHero(item.id)"><strong>{{ item.name }}</strong><small>{{ item.style }}</small></button></div><small>Lv.3 进化；Lv.8 且任一主动 Lv.3 时觉醒。龙卷风可选游龙、环身或伏阵，搭配影系技能激活风影合袭。冰霜、雷电、召唤等路线也可自由组合；每局重新选择，永久成长保留。</small></section>
        <div class="save-summary"><p aria-label="当前存档">{{ active?.label || '正在读取存档' }}<small v-if="active">金币 {{ active.save.gold }}</small></p><button :disabled="!active || busy || !!storageError" @click="page = 'saves'">存档</button></div>
        <p v-if="launchBlocker" class="save-boundary">{{ launchBlocker }}</p>
        <template v-else><div class="mission-line"><span>Lv.{{ active?.save.heroes[hero.id]?.level ?? 1 }}</span><span>{{ hero.name }}</span><span>火灵同行</span></div><dl class="preparation" aria-label="出征属性"><div><dt>生命</dt><dd>{{ Math.round(prepared.player.maxHp) }}</dd></div><div><dt>攻击</dt><dd>{{ Math.round(prepared.player.atk) }}</dd></div><div><dt>暴击</dt><dd>{{ (prepared.player.crit * 100).toFixed(1) }}%</dd></div></dl></template>
        <button ref="startButton" :disabled="!active || busy || !!storageError || !!launchBlocker" class="primary embark" @click="enter">{{ journey === 'evolution' ? '开启进化征途' : '进入战场预览' }} <span aria-hidden="true">→</span></button><p class="release-note">可完整挑战首关，结算后保存装备与成长奖励。其余内容正在迁移。</p>
      </div>
    </section>
    <SavePanel v-else-if="page === 'saves' && repository && active" :repository="repository" :active="active" @selected="slot => active = slot" @busy="value => saveBusy = value" @back="home" />
    <section v-else class="settings"><small class="eyebrow">行前须知</small><h1>设置与帮助</h1><dl><dt>移动操作</dt><dd>手机拖动左下方摇杆；电脑使用 WASD 或方向键。</dd><dt>战斗操作</dt><dd>普通攻击自动释放。点击右下方按钮使用闪避、当前英雄技能和奥义；电脑对应 Space、E / Q、R。跟随地图指引靠近互动点，点击互动或按 F 使用。</dd><dt>暂停与恢复</dt><dd>点击暂停，或按 Esc。离开页面会暂停，返回后手动继续。</dd><dt>当前版本</dt><dd>移动版首关可玩预览，支持胜败结算、奖励入库和再次挑战。请在战果保存后关闭页面；刷新会返回大厅，未结束战斗不恢复。</dd></dl><button class="primary" @click="home">返回大厅</button></section>
    <footer>万界无双 <span>移动版 · 开发预览</span></footer>
  </main>
</template>
