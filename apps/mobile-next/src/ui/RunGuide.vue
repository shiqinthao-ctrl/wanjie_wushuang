<script setup lang="ts">
import type { UiSnapshot } from '../core/GameCore';
import { skillName } from '../core/progression';
import { skillRoutes, skillTags } from '../core/evolutionCatalog';
defineProps<{ snapshot: UiSnapshot }>();
</script>

<template>
  <section v-if="snapshot.journey" class="run-guide" aria-label="本局进化路线">
    <h3>{{ snapshot.journey.name }}</h3><p>{{ snapshot.journey.next }}</p>
    <h4>术式路线 <small>主动 {{ Object.keys(snapshot.skills).length }}/6 · 心法 {{ Object.keys(snapshot.passives).length }}/6</small></h4>
    <ul class="owned-skills"><li v-for="(level, id) in snapshot.skills" :key="id"><strong>{{ skillTags[id] }} · {{ skillName(id) }} Lv.{{ level }}</strong><span>{{ skillRoutes.find(route => route.id === snapshot.journey?.routes[id])?.name || (skillRoutes.some(route => route.skill === id) ? 'Lv.3 选择分支' : '持续强化') }}</span></li></ul>
    <p class="owned-passives">{{ Object.entries(snapshot.passives).map(([id, level]) => `${skillName(id)} Lv.${level}`).join(' · ') }}</p>
    <h4>元素羁绊</h4><ul class="bond-list"><li v-for="bond in snapshot.journey.bonds" :key="bond.id" :class="{ active: bond.active }"><strong>{{ bond.name }} <em>{{ bond.active ? '已激活' : `${bond.count}/2` }}</em></strong><span>{{ bond.needs }}</span><small>{{ bond.detail }}</small></li></ul>
  </section>
</template>
