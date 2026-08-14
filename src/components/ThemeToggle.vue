<script setup lang="ts">
import { useDark } from '@vueuse/core';
import { nextTick } from 'vue';

// disableTransition：切换瞬间禁用元素级 transition，避免与 View Transition 叠加闪烁
const isDark = useDark({ disableTransition: true });

type ViewTransitionLike = { ready: Promise<void>; finished: Promise<void> };
type DocWithVT = Document & {
  startViewTransition?: (callback: () => Promise<void> | void) => ViewTransitionLike;
};

// 过渡进行中再次 startViewTransition 会跳过前一个过渡（ready reject、动画错乱，
// Chromium 连点此路径可致渲染进程崩溃），故加锁：过渡期间的点击直接忽略
let transitioning = false;

// View Transitions API 圆形扩散，从点击坐标铺开（§5.3）；浏览器不支持时退化为直接切换。
function toggle(event: MouseEvent) {
  const doc = document as DocWithVT;

  if (typeof doc.startViewTransition !== 'function') {
    isDark.value = !isDark.value;
    return;
  }
  if (transitioning) return;
  transitioning = true;

  const x = event.clientX;
  const y = event.clientY;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`];

  const transition = doc.startViewTransition!(async () => {
    isDark.value = !isDark.value;
    await nextTick();
  });

  transition.ready
    .then(() => {
      const anim = document.documentElement.animate(
        { clipPath: isDark.value ? [...clipPath].reverse() : clipPath },
        {
          duration: 380,
          easing: 'ease-in',
          fill: 'forwards',
          pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`,
        },
      );
      // fill: forwards 动画不随过渡销毁：下次过渡重建同名伪元素时，残留终值
      // （满圆裁剪）会抢在新动画前套用、压过 obsidian.css 的 circle(0) 初始态，
      // 暗→亮再度闪白，故必须在过渡收尾（伪元素已销毁）后取消
      return transition.finished.finally(() => anim.cancel());
    })
    .catch(() => {});

  transition.finished
    .catch(() => {})
    .finally(() => {
      transitioning = false;
    });
}
</script>

<template>
  <button type="button" class="icon-toggle" aria-label="切换明暗主题" @click="toggle">
    <!-- 两个图标常驻 DOM，由 Tailwind dark: 变体控制显隐，SSG 首帧无水合闪变 -->
    <svg
      class="hidden dark:block"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.5" />
      <path
        d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"
      />
    </svg>
    <svg
      class="block dark:hidden"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  </button>
</template>
