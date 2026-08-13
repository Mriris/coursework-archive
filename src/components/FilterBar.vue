<script setup lang="ts">
// 筛选 + 搜索（§6.1）：年份 / 技术栈 / 课程 + 对标题、课程、技术栈的前端过滤
defineProps<{ years: number[]; languages: string[]; courses: string[] }>();

const year = defineModel<string>('year', { default: 'all' });
const language = defineModel<string>('language', { default: 'all' });
const course = defineModel<string>('course', { default: 'all' });
const query = defineModel<string>('query', { default: '' });
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <select v-model="year" class="filter-control" aria-label="按年份筛选">
      <option value="all">全部年份</option>
      <option v-for="y in years" :key="y" :value="String(y)">{{ y }}</option>
    </select>
    <select v-model="language" class="filter-control" aria-label="按技术栈筛选">
      <option value="all">全部技术栈</option>
      <option v-for="l in languages" :key="l" :value="l">{{ l }}</option>
    </select>
    <select v-model="course" class="filter-control" aria-label="按课程筛选">
      <option value="all">全部课程</option>
      <option v-for="c in courses" :key="c" :value="c">{{ c }}</option>
    </select>
    <input
      v-model="query"
      type="search"
      class="filter-control min-w-52 flex-1"
      placeholder="搜索标题 / 课程 / 技术栈…"
      aria-label="搜索作业"
    />
  </div>
</template>

<style scoped>
.filter-control {
  padding: 0.5rem 0.85rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 0.8125rem;
  transition: border-color 0.2s ease;
}

.filter-control:hover {
  border-color: var(--accent);
}

.filter-control::placeholder {
  color: var(--text-dim);
}
</style>
