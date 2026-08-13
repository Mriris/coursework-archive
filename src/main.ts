import { ViteSSG } from 'vite-ssg/single-page';
import App from './App.vue';
import './styles/theme.css';
import './styles/holo.css';

// 站点只有卡片墙一页，详情外跳 GitHub / 镜像站（§6），故用 single-page 模式
export const createApp = ViteSSG(App);
