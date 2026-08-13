<script setup lang="ts">
// 成绩徽章：score === null 渲染为「进行中」（§6.1）。
// 颜色不是唯一信息载体，始终带文字（§5.4）。
defineProps<{ score: number | null; large?: boolean }>();
</script>

<template>
  <span
    class="badge inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium"
    :class="[large ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs', score === null ? 'badge-wip' : 'badge-score']"
  >
    <span v-if="score === null" class="wip-dot" aria-hidden="true" />
    {{ score === null ? '进行中' : `${score} 分` }}
  </span>
</template>

<!-- 徽章样式在 holo.css 全局定义：暗色覆盖需要 .dark 后代选择器，
     scoped 块中的 :global(.dark) 前缀会被 SFC 编译器错误拆分成选择器列表 -->
