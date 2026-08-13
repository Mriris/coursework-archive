<script setup lang="ts">
import { computed } from 'vue';
import { mirrorUrlFor, type Work } from '../composables/useWorks';
import ScoreBadge from './ScoreBadge.vue';

const props = defineProps<{ work: Work; entranceIndex?: number }>();

// §5.2：按主语言注入色相角（仅语言圆点使用）；色相表未命中时 --c: 0 回退中性灰
const cardStyle = computed(() => ({
  '--hue': String(props.work.hue ?? 0),
  ...(props.work.hue === null ? { '--c': '0' } : {}),
  '--i': String(props.entranceIndex ?? 0),
}));

const mirrorUrl = computed(() => mirrorUrlFor(props.work));
</script>

<template>
  <!-- 整卡外跳 GitHub 仓库；镜像入口为独立链接叠在覆盖层之上（避免 <a> 嵌套） -->
  <div class="work-card entrance group relative h-full" :style="cardStyle">
    <article class="panel relative flex h-full flex-col gap-2.5 rounded-xl p-5">
      <div class="flex items-start justify-between gap-3">
        <span class="pt-1 font-mono text-[13px] tracking-widest" style="color: var(--text-dim)">
          {{ work.date }}
        </span>
        <ScoreBadge :score="work.score" />
      </div>
      <h3 class="font-serif text-xl leading-snug font-bold">{{ work.course }}</h3>
      <p class="text-sm" style="color: var(--text-dim)">{{ work.title }}</p>
      <div
        class="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 font-mono text-xs"
        style="color: var(--text-dim)"
      >
        <span class="inline-flex items-center gap-1.5">
          <span
            class="inline-block size-2 rounded-full"
            style="background: var(--wa)"
            aria-hidden="true"
          />
          {{ work.primaryLanguage }}
        </span>
        <span v-if="work.stars > 0">★ {{ work.stars }}</span>
        <a
          v-if="mirrorUrl"
          :href="mirrorUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mirror-link relative z-10 ml-auto"
          :aria-label="`在国内镜像站打开：${work.course}·${work.title}`"
        >
          镜像 ↗
        </a>
      </div>
    </article>
    <a
      :href="work.url"
      target="_blank"
      rel="noopener noreferrer"
      class="card-link absolute inset-0 z-[1] rounded-xl"
      :aria-label="`在 GitHub 打开：${work.course}·${work.title}`"
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
  color: var(--accent);
  text-decoration-color: currentColor;
}
</style>
