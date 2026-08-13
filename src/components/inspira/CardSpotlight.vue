<script setup lang="ts">
// 移植自 Inspira UI 的 CardSpotlight（https://inspira-ui.com），改接本项目 OKLCH token：
// 默认聚光色取当前卡片色相（--hue / --c 由 WorkCard 注入）。纯 pointer 事件，无 WebGL。
import { ref } from 'vue';

withDefaults(
  defineProps<{
    gradientSize?: number;
    gradientColor?: string;
  }>(),
  {
    gradientSize: 260,
    gradientColor: 'oklch(var(--card-l) var(--c, var(--card-c)) var(--hue, 0) / 0.16)',
  },
);

const el = ref<HTMLElement>();
const x = ref(-9999);
const y = ref(-9999);

function onPointerMove(event: PointerEvent) {
  const rect = el.value?.getBoundingClientRect();
  if (!rect) return;
  x.value = event.clientX - rect.left;
  y.value = event.clientY - rect.top;
}

function onPointerLeave() {
  x.value = -9999;
  y.value = -9999;
}
</script>

<template>
  <div
    ref="el"
    class="relative overflow-hidden"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  >
    <div
      class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      :style="{
        background: `radial-gradient(${gradientSize}px circle at ${x}px ${y}px, ${gradientColor}, transparent 72%)`,
      }"
      aria-hidden="true"
    />
    <slot />
  </div>
</template>
