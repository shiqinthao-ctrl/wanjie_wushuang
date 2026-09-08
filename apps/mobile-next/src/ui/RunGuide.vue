<script setup lang="ts">
import type { UiSnapshot } from '../core/GameCore';
import { skillName } from '../core/progression';
import { skillRoutes, skillTags } from '../core/evolutionCatalog';
import { bondRequirements, routeAdvice } from './buildAdvice';
defineProps<{ snapshot: UiSnapshot }>();
</script>

<template>
  <section v-if="snapshot.journey" class="run-guide" aria-label="本局进化路线">
    <h3>{{ snapshot.journey.name }}</h3><p>{{ snapshot.journey.next }}</p>
    <h4>术式路线 <small>主动 {{ Object.keys(snapshot.skills).length }}/6 · 心法 {{ Object.keys(snapshot.passives).length }}/6</small></h4>
    <ul class="owned-skills"><li v-for="(level, id) in snapshot.skills" :key="id"><strong>{{ skillTags[id] }} · {{ skillName(id) }} Lv.{{ level }}</strong><span v-if="routeAdvice(snapshot.journey?.routes[id])" class="owned-route"><b>{{ routeAdvice(snapshot.journey?.routes[id])!.name }}</b><span>{{ routeAdvice(snapshot.journey?.routes[id])!.style }}</span><small>{{ routeAdvice(snapshot.journey?.routes[id])!.tradeoff }}</small></span><span v-else>{{ skillRoutes.some(route => route.skill === id) ? 'Lv.3 选择分支' : '持续强化' }}</span></li></ul>
    <p class="owned-passives">{{ Object.entries(snapshot.passives).map(([id, level]) => `${skillName(id)} Lv.${level}`).join(' · ') }}</p>
    <h4>元素羁绊</h4><p>拥有对应术式即可满足条件，英雄形态本身不计入羁绊。</p><ul class="bond-list"><li v-for="bond in snapshot.journey.bonds" :key="bond.id" :class="{ active: bond.active }"><strong>{{ bond.name }} <em>{{ bond.active ? '已激活' : `${bond.count}/2` }}</em></strong><span>{{ bond.needs }}</span><span v-for="condition in bondRequirements(bond.tags, snapshot.skills)" :key="condition.tag" class="bond-condition" :class="{ met: condition.met }">{{ condition.met ? '已拥有' : '还缺' }} · {{ condition.skills.join(' / ') }}{{ !condition.met && condition.skills.length > 1 ? '（任选一项）' : '' }}</span><small>{{ bond.detail }}</small></li></ul>
  </section>
</template>
