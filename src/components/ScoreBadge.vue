<script setup lang="ts">
// 评分钤印：score === null 渲染为「待评分」空章（§6.1）。
// 颜色不是唯一信息载体，章内始终有文字（§5.4）；满分 100 为双圈章。
defineProps<{ score: number | null }>();
</script>

<template>
  <span
    class="seal"
    :class="score === null ? 'seal-pending' : score === 100 ? 'seal-full' : ''"
    :aria-label="score === null ? '待评分' : `成绩 ${score} 分`"
  >
    {{ score === null ? '待评分' : score }}
  </span>
</template>

<!-- 钤印样式在 obsidian.css 全局定义：暗色覆盖需要 .dark 后代选择器，
     scoped 块中的 :global(.dark) 前缀会被 SFC 编译器错误拆分成选择器列表 -->
