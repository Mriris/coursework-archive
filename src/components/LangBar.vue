<script setup lang="ts">
import { computed } from 'vue';
// 色相表与构建脚本共用同一模块（§5.2），避免两份表漂移
import { hueForLanguage } from '../../scripts/pick-language.mjs';
import type { WorkLanguage } from '../composables/useWorks';

const props = defineProps<{ languages: WorkLanguage[] }>();

function colorFor(name: string): string {
  const hue = hueForLanguage(name);
  return hue === null
    ? 'oklch(var(--card-l) 0 0 / 0.75)'
    : `oklch(var(--card-l) 0.14 ${hue})`;
}

const legend = computed(() => props.languages.slice(0, 5));
const restCount = computed(() => Math.max(0, props.languages.length - 5));
const ariaLabel = computed(
  () => `语言构成：${props.languages.map((l) => `${l.name} ${l.percent}%`).join('，')}`,
);
</script>

<template>
  <div>
    <div
      class="flex h-2 w-full overflow-hidden rounded-full"
      role="img"
      :aria-label="ariaLabel"
      style="background: var(--chip-bg)"
    >
      <span
        v-for="l in languages"
        :key="l.name"
        class="min-w-[3px]"
        :style="{ flexGrow: String(l.percent || 0.4), background: colorFor(l.name) }"
      />
    </div>
    <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" style="color: var(--text-dim)">
      <span v-for="l in legend" :key="l.name" class="inline-flex items-center gap-1.5">
        <span
          class="inline-block size-2 rounded-full"
          :style="{ background: colorFor(l.name) }"
          aria-hidden="true"
        />
        {{ l.name }} {{ l.percent }}%
      </span>
      <span v-if="restCount > 0">+{{ restCount }} 种</span>
    </div>
  </div>
</template>
