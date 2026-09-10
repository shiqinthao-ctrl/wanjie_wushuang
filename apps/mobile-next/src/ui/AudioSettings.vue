<script setup lang="ts">
import { ref } from 'vue';
import { loadAudioSettings, saveAudioSettings } from '../game/audio/settings';
import type { AudioSettings } from '../game/audio/settings';
const emit = defineEmits<{ change: [value: AudioSettings] }>();
const settings = ref(loadAudioSettings()), saved = ref(true);
function change() { saved.value = saveAudioSettings(settings.value); emit('change', { ...settings.value }); }
</script>
<template>
  <section aria-label="战斗声音设置" class="audio-settings">
    <button :aria-pressed="settings.enabled" @click="settings.enabled = !settings.enabled; change()">战斗声音 · {{ settings.enabled ? '开启' : '关闭' }}</button>
    <label>音效音量 · {{ Math.round(settings.volume * 100) }}%<input v-model.number="settings.volume" aria-label="音效音量" type="range" min="0" max="1" step="0.05" @input="change" /></label>
    <p v-if="!saved" role="status">设置暂未保存，本次战斗已生效。</p>
    <p v-else>首次操作后播放；回到页面需手动继续。音色为工程样板。</p>
  </section>
</template>
<style scoped>
.audio-settings label { display: block; margin-top: 12px; font-size: 13px; }
.audio-settings input { display: block; width: 100%; min-height: 48px; accent-color: #e0bf7e; }
</style>
