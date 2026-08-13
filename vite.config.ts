import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/coursework-archive/',
  plugins: [vue(), tailwindcss()],
  // 本机 Windows 的 winnat 保留端口段覆盖了 vite 默认的 4173（EACCES），固定到 9000
  preview: { port: 9000 },
});
