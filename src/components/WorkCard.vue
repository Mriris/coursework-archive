<script setup lang="ts">
import { computed } from 'vue';
import { type Work, workNumbers } from '../composables/useWorks';
import CardSpotlight from './inspira/CardSpotlight.vue';
import GlowBorder from './inspira/GlowBorder.vue';
import ScoreBadge from './ScoreBadge.vue';

const props = defineProps<{ work: Work; entranceIndex?: number }>();

// §5.2：按主语言注入色相角；色相表未命中时 --c: 0 回退中性灰
const cardStyle = computed(() => ({
  '--hue': String(props.work.hue ?? 0),
  ...(props.work.hue === null ? { '--c': '0' } : {}),
  '--i': String(props.entranceIndex ?? 0),
}));

const num = computed(() => workNumbers[props.work.repo]);
</script>

<template>
  <RouterLink
    :to="`/work/${work.repo}`"
    class="work-card entrance group block h-full"
    :style="cardStyle"
  >
    <GlowBorder class="h-full rounded-2xl">
      <CardSpotlight class="glass-card flex h-full flex-col gap-3 rounded-2xl p-5">
        <span class="hue-halo" aria-hidden="true" />
        <div class="relative flex items-start justify-between gap-3">
          <span class="font-mono text-sm font-semibold" style="color: var(--wa)">
            #{{ num }}
          </span>
          <ScoreBadge :score="work.score" />
        </div>
        <h3 class="relative text-lg leading-snug font-semibold">{{ work.title }}</h3>
        <p class="relative text-sm" style="color: var(--text-dim)">
          {{ work.course }} · {{ work.year }}-{{ work.month }}
        </p>
        <div
          class="relative mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-xs"
          style="color: var(--text-dim)"
        >
          <span class="inline-flex items-center gap-1.5">
            <span
              class="inline-block size-2.5 rounded-full"
              style="background: var(--wa)"
              aria-hidden="true"
            />
            {{ work.primaryLanguage }}
          </span>
          <span v-if="work.stars > 0">★ {{ work.stars }}</span>
          <span
            v-if="work.archived"
            class="rounded-full px-2 py-0.5"
            style="background: var(--chip-bg)"
          >
            Archived
          </span>
        </div>
      </CardSpotlight>
    </GlowBorder>
  </RouterLink>
</template>
