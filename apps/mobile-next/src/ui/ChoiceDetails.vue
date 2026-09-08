<script setup lang="ts">
import { computed } from 'vue';
import type { LevelOption, SkillLevels } from '../core/progression';
import type { EvolutionSnapshot } from '../core/RunEvolution';
import { choiceAdvice } from './buildAdvice';
const props = defineProps<{ option: LevelOption; journey?: EvolutionSnapshot; skills: SkillLevels }>();
const advice = computed(() => choiceAdvice(props.option, props.journey, props.skills));
</script>

<template>
  <span v-if="advice.detail">{{ advice.detail }}</span>
  <span v-if="advice.route" class="route-advice">
    <b>{{ option.kind === 'route' ? '打法' : advice.route.name }} · {{ advice.route.style }}</b>
    <span>{{ advice.route.tradeoff }}</span>
    <small v-if="option.kind === 'route'">本局选择后不再选择「{{ advice.route.alternative }}」。</small>
  </span>
  <span v-if="advice.bonds.length" class="choice-bonds">
    <small v-for="bond in advice.bonds" :key="bond.name" :class="{ completes: bond.completes }">{{ bond.completes ? '可激活' : '推进' }} · {{ bond.name }}</small>
  </span>
</template>
