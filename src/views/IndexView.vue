<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { motion } from 'motion-v';
import { computed, ref } from 'vue';
import FilterBar from '../components/FilterBar.vue';
import ThemeToggle from '../components/ThemeToggle.vue';
import WorkCard from '../components/WorkCard.vue';
import { works } from '../composables/useWorks';

useHead({ title: '大作业存档 · Mriris' });

const year = ref('all');
const language = ref('all');
const course = ref('all');
const query = ref('');

const years = [...new Set(works.map((w) => w.year))].sort((a, b) => a - b);
const languages = [...new Set(works.map((w) => w.primaryLanguage))];
const courses = [...new Set(works.map((w) => w.course))];

// works 已按「未出分置顶 + 日期降序」排好（§6.1），筛选不改变该顺序
const filtered = computed(() =>
  works.filter((w) => {
    if (year.value !== 'all' && String(w.year) !== year.value) return false;
    if (language.value !== 'all' && w.primaryLanguage !== language.value) return false;
    if (course.value !== 'all' && w.course !== course.value) return false;
    const q = query.value.trim().toLowerCase();
    if (q) {
      const haystack =
        `${w.title} ${w.course} ${w.languages.map((l) => l.name).join(' ')}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }),
);

const yearSpan = `${Math.min(...works.map((w) => w.year))}–${Math.max(...works.map((w) => w.year))}`;
const wipCount = works.filter((w) => w.score === null).length;
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-10 md:py-14">
    <header class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight md:text-4xl">大作业存档</h1>
        <p class="mt-2 text-sm" style="color: var(--text-dim)">
          {{ yearSpan }} · 共 {{ works.length }} 项课程大作业<template v-if="wipCount > 0">
            · {{ wipCount }} 项进行中（置顶）</template
          >
        </p>
      </div>
      <ThemeToggle />
    </header>

    <FilterBar
      v-model:year="year"
      v-model:language="language"
      v-model:course="course"
      v-model:query="query"
      :years="years"
      :languages="languages"
      :courses="courses"
      class="mb-8"
    />

    <div class="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
      <motion.div
        v-for="(w, i) in filtered"
        :key="w.repo"
        layout
        :while-hover="{ y: -6 }"
        :while-press="{ scale: 0.98 }"
        :transition="{ type: 'spring', stiffness: 350, damping: 26 }"
        class="h-full"
      >
        <WorkCard :work="w" :entrance-index="i" />
      </motion.div>
    </div>

    <p v-if="filtered.length === 0" class="mt-16 text-center" style="color: var(--text-dim)">
      没有匹配的作业，试试清空筛选条件。
    </p>
  </div>
</template>
