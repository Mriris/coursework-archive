<script setup lang="ts">
import { MotionConfig } from 'motion-v';
import IndexView from './views/IndexView.vue';
</script>

<template>
  <!-- 背景场景（受光/渐晕/噪点）由 obsidian.css 的 body::before / body::after 承担 -->
  <!-- 动画恒定全开：never = 强制播放，无视系统 prefers-reduced-motion -->
  <MotionConfig reduced-motion="never">
    <IndexView />
  </MotionConfig>
</template>
