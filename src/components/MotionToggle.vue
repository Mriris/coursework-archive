<script setup lang="ts">
import { motionEnabled } from '../composables/useMotionPref';

function toggle() {
  motionEnabled.value = !motionEnabled.value;
}
</script>

<template>
  <button type="button" class="icon-toggle" aria-label="切换动画开关" @click="toggle">
    <!-- 波线 = 动画开，平线 = 动画关；两图标常驻 DOM，由 reduce-motion: 变体控制显隐（与 ThemeToggle 同模式，SSG 首帧无水合闪变） -->
    <svg
      class="block reduce-motion:hidden"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d="M3 12c2-5.5 4-5.5 6 0s4 5.5 6 0 4-5.5 6 0" />
    </svg>
    <svg
      class="hidden reduce-motion:block"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d="M3 12h18" />
    </svg>
  </button>
</template>
