import { useStorage } from '@vueuse/core';
import { computed, watchEffect } from 'vue';

// 页面级动画总开关：默认全开（无视系统 prefers-reduced-motion），由页眉 MotionToggle 显式关闭。
// 与 useDark 同模式：localStorage 持久化 + html 挂 .reduce-motion 类 + index.html 内联脚本首帧前挂类防闪。
// 消费方：obsidian.css 的 html.reduce-motion 规则（CSS 动画）、App.vue 的 MotionConfig（motion-v）、
// ThemeToggle 的 View Transitions 圆形扩散。
const pref = useStorage<'on' | 'off'>('motion-preference', 'on');

export const motionEnabled = computed<boolean>({
  get: () => pref.value !== 'off',
  set: (v) => {
    pref.value = v ? 'on' : 'off';
  },
});

// SSG 构建时无 document；客户端由首个 import 方触发，App 生命周期内常驻
if (typeof document !== 'undefined') {
  watchEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', !motionEnabled.value);
  });
}
