import { ViteSSG } from 'vite-ssg';
import App from './App.vue';
import IndexView from './views/IndexView.vue';
import WorkView from './views/WorkView.vue';
import './styles/theme.css';
import './styles/holo.css';
import './styles/markdown.css';

const routes = [
  { path: '/', component: IndexView },
  { path: '/work/:repo', component: WorkView },
];

export const createApp = ViteSSG(App, {
  routes,
  base: import.meta.env.BASE_URL,
  scrollBehavior: () => ({ top: 0 }),
});
