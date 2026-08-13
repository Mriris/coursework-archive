<script setup lang="ts">
import { onMounted, ref } from 'vue';

// html 来自构建时管线：已重写链接、已高亮、已 sanitize（§4.4），可安全 v-html
defineProps<{ html: string }>();

const el = ref<HTMLElement>();

onMounted(() => {
  // §8：README 图片 404（运行时）→ 隐藏该图，不破坏排版
  el.value?.querySelectorAll('img').forEach((img) => {
    img.addEventListener(
      'error',
      () => {
        img.style.display = 'none';
      },
      { once: true },
    );
  });
});
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div ref="el" class="markdown-body" v-html="html" />
</template>
