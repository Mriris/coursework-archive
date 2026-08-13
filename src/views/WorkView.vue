<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import LangBar from '../components/LangBar.vue';
import MarkdownBody from '../components/MarkdownBody.vue';
import ScoreBadge from '../components/ScoreBadge.vue';
import ThemeToggle from '../components/ThemeToggle.vue';
import { findWork } from '../composables/useWorks';

const route = useRoute();
const work = computed(() => findWork(String(route.params.repo)));

useHead({
  title: computed(() =>
    work.value ? `${work.value.title} · 大作业存档` : '未找到 · 大作业存档',
  ),
});

const pageStyle = computed(() =>
  work.value
    ? {
        '--hue': String(work.value.hue ?? 0),
        ...(work.value.hue === null ? { '--c': '0' } : {}),
      }
    : {},
);

const cloneCommand = computed(() => (work.value ? `git clone ${work.value.url}.git` : ''));
const copied = ref(false);

async function copyClone() {
  if (!cloneCommand.value) return;
  try {
    await navigator.clipboard.writeText(cloneCommand.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // 剪贴板不可用时静默，命令本身已展示在按钮上
  }
}
</script>

<template>
  <div class="work-card mx-auto max-w-4xl px-5 py-10 md:py-14" :style="pageStyle">
    <template v-if="work">
      <header>
        <div class="flex items-center justify-between gap-4">
          <RouterLink to="/" class="back-link text-sm">← 返回全部作业</RouterLink>
          <ThemeToggle />
        </div>

        <h1 class="mt-8 text-2xl leading-snug font-bold tracking-tight md:text-3xl">
          {{ work.title }}
        </h1>

        <div
          class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
          style="color: var(--text-dim)"
        >
          <span class="rounded-full px-2.5 py-0.5" style="background: var(--chip-bg)">
            {{ work.course }}
          </span>
          <span>{{ work.year }}-{{ work.month }}</span>
          <ScoreBadge :score="work.score" />
          <span v-if="work.stars > 0">★ {{ work.stars }}</span>
          <span v-if="work.license">{{ work.license }}</span>
          <span
            v-if="work.archived"
            class="rounded-full px-2.5 py-0.5"
            style="background: var(--chip-bg)"
          >
            Archived
          </span>
        </div>

        <LangBar v-if="work.languages.length > 0" :languages="work.languages" class="mt-6" />

        <div class="mt-6 flex flex-wrap items-center gap-3">
          <a :href="work.url" target="_blank" rel="noopener noreferrer" class="action-btn primary">
            GitHub 仓库 ↗
          </a>
          <button type="button" class="action-btn font-mono text-xs" @click="copyClone">
            {{ copied ? '已复制 ✓' : cloneCommand }}
          </button>
        </div>
      </header>

      <hr class="my-10" style="border-color: var(--border)" />

      <MarkdownBody v-if="work.readmeHtml" :html="work.readmeHtml" />
      <p v-else class="py-10 text-center" style="color: var(--text-dim)">
        该仓库未提供 README。
      </p>
    </template>

    <template v-else>
      <p class="py-20 text-center" style="color: var(--text-dim)">未找到这个作业。</p>
      <p class="text-center">
        <RouterLink to="/" class="back-link">← 返回全部作业</RouterLink>
      </p>
    </template>
  </div>
</template>

<style scoped>
.back-link {
  color: var(--text-dim);
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--accent);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  border-radius: 0.7rem;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;
}

.action-btn:hover {
  border-color: var(--wa, var(--accent));
  color: var(--wa, var(--accent));
}

.action-btn.primary {
  border-color: color-mix(in oklch, var(--wa, var(--accent)) 55%, var(--border));
  color: var(--wa, var(--accent));
  font-weight: 600;
}
</style>
