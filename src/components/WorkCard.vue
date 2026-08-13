<script setup lang="ts">
import { computed } from 'vue';
import { mirrorUrlFor, type Work, workNumbers } from '../composables/useWorks';
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
const mirrorUrl = computed(() => mirrorUrlFor(props.work));
</script>

<template>
  <!-- 整卡外跳 GitHub 仓库；镜像入口为独立链接叠在覆盖层之上（避免 <a> 嵌套） -->
  <div class="work-card entrance group relative h-full" :style="cardStyle">
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
          <a
            v-if="mirrorUrl"
            :href="mirrorUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mirror-link relative z-10 ml-auto"
            :aria-label="`在国内镜像站打开：${work.title}`"
          >
            镜像 ↗
          </a>
        </div>
      </CardSpotlight>
    </GlowBorder>
    <a
      :href="work.url"
      target="_blank"
      rel="noopener noreferrer"
      class="card-link absolute inset-0 z-[1] rounded-2xl"
      :aria-label="`在 GitHub 打开：${work.title}`"
    />
  </div>
</template>

<style scoped>
.mirror-link {
  color: var(--text-dim);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: transparent;
  transition:
    color 0.2s ease,
    text-decoration-color 0.2s ease;
}

.mirror-link:hover {
  color: var(--wa, var(--accent));
  text-decoration-color: currentColor;
}
</style>
