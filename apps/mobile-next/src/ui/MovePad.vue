<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
const emit = defineEmits<{ move: [x: number, y: number] }>();
const pointer = ref<number | null>(null);
const offset = ref({ x: 0, y: 0 });
let center = { x: 0, y: 0 };
let surface: HTMLElement | null = null;
function track(event: PointerEvent) {
  if (pointer.value !== event.pointerId) return;
  const dx = event.clientX - center.x, dy = event.clientY - center.y;
  const scale = Math.max(1, Math.hypot(dx, dy) / 42);
  offset.value = { x: dx / scale, y: dy / scale };
  emit('move', offset.value.x / 42, offset.value.y / 42);
}
function start(event: PointerEvent) {
  if (pointer.value !== null) return;
  surface = event.currentTarget as HTMLElement;
  const rect = surface.getBoundingClientRect();
  center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  pointer.value = event.pointerId;
  surface.setPointerCapture(event.pointerId); track(event);
}
function release(event?: PointerEvent) {
  if (event && pointer.value !== event.pointerId) return;
  const id = pointer.value; pointer.value = null;
  if (id !== null && surface?.hasPointerCapture(id)) surface.releasePointerCapture(id);
  offset.value = { x: 0, y: 0 }; emit('move', 0, 0);
}
onBeforeUnmount(() => release());
</script>

<template>
  <div class="move-pad" aria-label="拖动摇杆移动" @pointerdown.prevent="start" @pointermove.prevent="track" @pointerup="release" @pointercancel="release" @lostpointercapture="release">
    <span class="pad-ring"></span><span class="pad-thumb" :style="{ transform: `translate(${offset.x}px,${offset.y}px)` }"></span>
    <span class="pad-label">移动</span>
  </div>
</template>
