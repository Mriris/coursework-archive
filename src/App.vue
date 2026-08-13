<script setup lang="ts">
import { MotionConfig } from 'motion-v';
import AuroraBackground from './components/inspira/AuroraBackground.vue';
import IndexView from './views/IndexView.vue';
</script>

<template>
  <MotionConfig reduced-motion="user">
    <AuroraBackground />
    <IndexView />
  </MotionConfig>
</template>
