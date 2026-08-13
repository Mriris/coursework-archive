<script setup lang="ts">
import { useDark } from '@vueuse/core';
import { nextTick } from 'vue';

// disableTransition：切换瞬间禁用元素级 transition，避免与 View Transition 叠加闪烁
const isDark = useDark({ disableTransition: true });

type DocWithVT = Document & {
  startViewTransition?: (callback: () => Promise<void> | void) => { ready: Promise<void> };
};

// View Transitions API 圆形扩散，从点击坐标铺开（§5.3）；
// 不支持或 prefers-reduced-motion 时退化为直接切换（§5.4）。
function toggle(event: MouseEvent) {
  const doc = document as DocWithVT;
  const canTransition =
    typeof doc.startViewTransition === 'function' &&
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

  if (!canTransition) {
    isDark.value = !isDark.value;
    return;
  }

  const x = event.clientX;
  const y = event.clientY;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`];

  doc
    .startViewTransition!(async () => {
      isDark.value = !isDark.value;
      await nextTick();
    })
    .ready.then(() => {
      document.documentElement.animate(
        { clipPath: isDark.value ? [...clipPath].reverse() : clipPath },
        {
          duration: 380,
          easing: 'ease-in',
          fill: 'forwards',
          pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`,
        },
      );
    });
}
</script>

<template>
  <button type="button" class="theme-toggle" aria-label="切换明暗主题" @click="toggle">
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

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;
}

.theme-toggle:hover {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
