<script setup lang="ts">
import { MotionConfig } from 'motion-v';
import AuroraBackground from './components/inspira/AuroraBackground.vue';
</script>

<template>
  <MotionConfig reduced-motion="user">
    <AuroraBackground />
    <router-view />
  </MotionConfig>
</template>
