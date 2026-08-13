<script setup lang="ts">
// 移植自 Inspira UI 的 GlowBorder / BorderBeam（https://inspira-ui.com），改接 OKLCH token：
// conic-gradient 流光描边，默认取当前卡片色相，仅 hover / focus 时启动（§5.3）。
// 特效实现在 holo.css 的 .glow-border 规则中，本组件负责参数注入。
withDefaults(
  defineProps<{
    color?: string;
    borderWidth?: number;
    duration?: number;
  }>(),
  {
    color: 'var(--wa, var(--accent))',
    borderWidth: 1.5,
    duration: 4,
  },
);
</script>

<template>
  <div
    class="glow-border"
    :style="{
      '--glow-color': color,
      '--glow-width': `${borderWidth}px`,
      '--glow-duration': `${duration}s`,
    }"
  >
    <slot />
  </div>
</template>
