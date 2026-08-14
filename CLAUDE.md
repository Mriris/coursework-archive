# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目

课程大作业存档站（Vue 3 + vite-ssg 单页静态站），部署在 https://mriris.github.io/coursework-archive/ 。卡片墙展示 8 项大作业，整卡外跳 GitHub 仓库（卡内无显式链接）；站点不渲染 README、无详情页、无路由。

## 常用命令

```bash
npm run dev        # 开发服务器（用已提交的 works.json 快照，无需 gh）
npm test           # 全部单测（Vitest）
npx vitest run tests/parse-description.test.mjs   # 单个测试文件
npm run fetch      # 抓数据生成 src/data/works.json 并重生成字体子集（需 gh auth login）
npm run subset     # 仅重生成标题衬线字体子集（衬线用字变化时跑）
npm run build      # fetch + vite-ssg 预渲染（会联网抓数据）
npm run build:site # 仅 vite-ssg 构建，跳过抓取（用快照）
npm run preview    # 预览 dist，端口固定 9000（见下方端口说明）
npm run smoke      # 构建产物冒烟断言（须先 build）
```

- **访问 GitHub 一律走 `gh` CLI 子进程，禁止 fetch 直连 `api.github.com`**（本机网络直连易超时；CI 注入 `GH_TOKEN` 认证）。
- **本机端口坑**：Windows winnat 保留端口段覆盖了 vite 默认的 4173/5173 之外的很多端口（8899 也在内），`preview` 已在 vite.config.ts 固定为 9000；起新服务遇到 `EACCES` 先查 `netsh interface ipv4 show excludedportrange protocol=tcp`。
- 提交信息用中文，遵循 `feat:` / `fix:` / `ci:` / `docs:` / `refactor:` 前缀惯例。

## 架构

### 数据管线（构建时固化，浏览器零请求）

```
works.yaml → scripts/fetch-works.mjs（唯一有 I/O 的模块）→ src/data/works.json → vite-ssg 预渲染
```

- `works.yaml`：收录清单。顶层只有 `works` 一个字段（`ConfigSchema` 是 `strictObject`，多写任何顶层字段都会构建失败）；每条最少写 `url`，可手填 `course`/`title`/`date`/`score` 覆盖自动解析。
- `scripts/config-schema.mjs`（纯函数）：zod v4 校验 + 覆盖合并。关键语义：`score: null` 是显式强制"待评分"，与不写 `score`（用解析值）不同；描述解析失败仅在手填未补齐 course/title/date 三项时才致命。
- `scripts/parse-description.mjs`（纯函数）：解析仓库描述 `【YYYY-M】课程-标题[-分数]`。月份必须补零；标题必须 `join('-')` 防截断；末段纯数字才算分数。
- `scripts/pick-language.mjs`（纯函数）：主语言 = 排除样式/标记语言（CSS/HTML/SCSS/Less/Stylus）后字节数最大者；内含语言→OKLCH 色相角映射表。**前端 LangBar 已删，但 WorkCard 色相仍从此模块导入 `hueForLanguage`，是色相表的唯一事实来源。**
- `scripts/fetch-works.mjs`：gh api 子进程（每仓库 2 个请求：meta + languages），3 次指数退避重试，404 不重试直接报仓库名。启动先探测 gh 安装/登录。
- `src/data/works.json`：结构为 `{ works }`，**提交进 git 作为快照**，clone 后无需 gh 即可开发。
- `scripts/subset-font.mjs`：从 fontsource 的 Noto Serif SC 700 全量 CJK 文件（约 1.5MB）按用字裁出 `src/assets/noto-serif-sc-700-subset.woff2`（约 12KB，**提交进 git**）。用字 = 脚本内 `UI_TEXT`（h1/钤印文案与数字）+ 全部课程名；改界面上的衬线文案须同步 `UI_TEXT` 并重跑 `npm run subset`。
- 错误处理原则：数据完整性问题（schema 不合法、描述无法解析且未补齐、仓库 404）一律构建失败；内容缺失（languages 为空）优雅降级。

### 前端

- 入口 `src/main.ts` 用 `vite-ssg/single-page`（无 vue-router），`App.vue` = MotionConfig + IndexView；背景场景（受光/渐晕/噪点）由 obsidian.css 的 `body::before/::after` 纯 CSS 承担。
- 排序在 `src/composables/sortWorks.ts`（纯函数，有单测）：`score === null`（待评分）置顶，两组内部按 date 降序；筛选不改变顺序。首页把待评分/已评分两组上下分开渲染，中间 `.group-divider` 虚线分割（任一组为空则不渲染分割线，见 IndexView）。
- 卡片左上角展示归档年月（`work.date`，形如 `2023-10`）；卡片主标题是课程名（`course`），副行是作业名（`title`）。
- 站点标识在 `public/`（非 `src/assets/`，因为 index.html 的 favicon / og:image 需要稳定 URL）：`logo.png`（320×320 圆形，页头 + og:image）、`favicon.png`（64×64 圆形）、`apple-touch-icon.png`（180×180 方形不透明，iOS 会自行加圆角，透明区会被填黑故不留 alpha）。三者均由同一张方形原图派生，圆形 alpha 已烘焙进 PNG。**Vue 组件里引用 public 资源必须拼 `import.meta.env.BASE_URL`**（部署在 `/coursework-archive/` 子路径），见 IndexView 的 `logoUrl`；`.site-logo` 的铜金细环在 obsidian.css。
- 卡片外链结构：整卡只有一个绝对定位的覆盖层 `<a class="card-link">`（GitHub），卡内不放任何显式链接。曾有的「仓库↗」（与整卡点击重复）与「镜像↗」（国内镜像站已全面失效，见下）均已删除。**若将来要加卡内链接，必须以 `z-10` 叠在覆盖层之上，绝不能嵌套 `<a>`。**

- 关于国内镜像入口：不要再加。2026-08 实测 72 个候选站（境外出口 45 个 + 国内出口 27 个）无一可用——`kkgithub.com` 已 502，`bgithub.xyz`/`kgithub.com`/`hub.*.cf` 系列 SSL 握手失败或停服。根因是 `gh-proxy` 那一类做的是 release/raw/clone **文件加速**，对网页路径一律 403，从设计上就不反代 GitHub 网页 UI；而真正做网页反代的站点已因合规与带宽成本集体消失。

### 主题与视觉（玄鉴 · OKLCH 双主题）

- token 全在 `src/styles/theme.css`：曜石（暗，碳黑 + 暖象牙字）× 纸面（浅，象牙纸 + 墨字）双主题，共用铜金强调色 `--accent`（`--hue-accent: 80` 锁定，明暗只改 L/C）。
- 语言色相系统降级为点缀：每张卡片经 style 注入 `--hue`（色相表未命中时注入 `--c: 0` 回退中性灰），`--wa` 在 obsidian.css 合成，仅用于语言圆点与整卡焦点环；色相表事实来源仍是 `scripts/pick-language.mjs` 的 `hueForLanguage`。
- 标题衬线为 Noto Serif SC 700：构建时按用字子集化（见上方 `scripts/subset-font.mjs`），`@font-face` 声明在 theme.css 顶部，指向 `src/assets/` 下的子集 woff2；正文系统黑体、数据等宽。
- 特效全部是全局 CSS（`src/styles/obsidian.css`）：精密面板 `.panel`、hover 铜金掠光一次（`.panel::before` conic mask）、评分钤印 `.seal`（满分双圈 / 待评分虚线脉冲）、页眉金线 `.gold-rule`；Inspira UI 组件已全部移除，**不引入 WebGL/Canvas 类组件**。交互动效用 motion-v，入场 stagger 是纯 CSS（`--i` 变量），保证静态 HTML 不执行 JS 也完整可读。
- 主题切换：VueUse `useDark`（class `.dark`，storage key `vueuse-color-scheme`）+ index.html 内联防闪烁脚本 + ThemeToggle 的 View Transitions 圆形扩散。
- 动画恒定全开、**无视系统 `prefers-reduced-motion`**：obsidian.css 不设任何 reduced-motion 门控，motion-v 侧由 App.vue 的 `MotionConfig reduced-motion="never"` 强制播放。曾有的页眉 MotionToggle 开关（useMotionPref / `.reduce-motion` 类 / `reduce-motion:` 变体）已整体移除，不要再加回。页眉圆形图标按钮外观是 obsidian.css 的 `.icon-toggle`。

### ⚠ 已踩过的坑：scoped 样式里的 `:global(.dark)`

当前 Vue SFC 编译器会把 `<style scoped>` 里的 `:global(.dark) .xxx` 错误拆成选择器列表 `.dark, .xxx[data-v]`，规则泄漏到 `html.dark` 上（曾导致整页 `display:none` 白屏）。**暗色覆盖规则必须写在全局 CSS（obsidian.css）或用 Tailwind `dark:` 变体类，绝不在 scoped 块里写 `:global(.dark)` 后代选择器。**

### 测试与 CI

- `tests/` 下按模块分文件，夹具用 8 条真实仓库描述；改 parse/merge/sort 逻辑必须同步跑对应测试。
- `.github/workflows/deploy.yml`：`npm test` 置于 build **之前**（解析类 bug 是静默的，构建照样绿灯，必须在发布前拦截）；build 步骤注入 `GH_TOKEN` 供 runner 预装的 gh 认证；产物经 `npm run smoke` 断言后走 Pages artifact 部署。
- 仓库名必须保持 `coursework-archive`（vite `base` 与 Pages 地址依赖它）。

## 维护流程

新增科目：给仓库写规范描述 → `works.yaml` 加 `- url: https://github.com/{owner}/{repo}`（描述不规范就手填覆盖字段）→ push 自动部署。删科目 = 删条目。刷新 star/描述：Actions 页手动 `Run workflow`。
