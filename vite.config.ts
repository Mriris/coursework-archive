import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// includedRoutes 从 works.json 展开出具体详情页路径（§6）
function workRoutes(): string[] {
  try {
    const works = JSON.parse(
      readFileSync(new URL('./src/data/works.json', import.meta.url), 'utf8'),
    ) as { repo: string }[];
    return works.map((w) => `/work/${w.repo}`);
  } catch {
    return [];
  }
}

export default defineConfig({
  base: '/coursework-archive/',
  plugins: [vue(), tailwindcss()],
  // @ts-expect-error vite-ssg 扩展字段
  ssgOptions: {
    dirStyle: 'nested',
    includedRoutes: () => ['/', ...workRoutes()],
  },
});
