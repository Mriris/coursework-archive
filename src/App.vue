<script setup lang="ts">
import { MotionConfig } from 'motion-v';
import { motionEnabled } from './composables/useMotionPref';
import IndexView from './views/IndexView.vue';
</script>

<template>
  <!-- 背景场景（受光/渐晕/噪点）由 obsidian.css 的 body::before / body::after 承担 -->
  <!-- 动画由页面级开关控制（无视系统 prefers-reduced-motion）：开 → never（强制动画），关 → always -->
  <MotionConfig :reduced-motion="motionEnabled ? 'never' : 'always'">
    <IndexView />
  </MotionConfig>
</template>
