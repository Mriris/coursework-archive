<script setup lang="ts">
// 移植自 Inspira UI 的 AuroraBackground（https://inspira-ui.com），纯 CSS 渐变动画：
// 暗色主题为主视觉，浅色主题通过 --aurora-opacity 降低存在感（§5.1 两种光照）。
// 同时承载网格底纹（::before）。实现见 holo.css 的 .aurora-bg。
</script>

<template>
  <div class="aurora-bg" aria-hidden="true" />
</template>
