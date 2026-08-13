# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目

课程大作业存档站（Vue 3 + vite-ssg 单页静态站），部署在 https://mriris.github.io/coursework-archive/ 。卡片墙展示 8 项大作业，整卡外跳 GitHub 仓库，右下角提供国内镜像入口；站点不渲染 README、无详情页、无路由。

## 常用命令

```bash
npm run dev        # 开发服务器（用已提交的 works.json 快照，无需 gh）
npm test           # 全部单测（Vitest）
npx vitest run tests/parse-description.test.mjs   # 单个测试文件
npm run fetch      # 重新抓取数据生成 src/data/works.json（需 gh auth login）
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

- `works.yaml`：收录清单。顶层 `mirror` 为镜像站根地址（删除即隐藏镜像入口）；每条最少写 `url`，可手填 `course`/`title`/`date`/`score` 覆盖自动解析。
- `scripts/config-schema.mjs`（纯函数）：zod v4 校验 + 覆盖合并。关键语义：`score: null` 是显式强制"进行中"，与不写 `score`（用解析值）不同；描述解析失败仅在手填未补齐 course/title/date 三项时才致命。
- `scripts/parse-description.mjs`（纯函数）：解析仓库描述 `【YYYY-M】课程-标题[-分数]`。月份必须补零；标题必须 `join('-')` 防截断；末段纯数字才算分数。
- `scripts/pick-language.mjs`（纯函数）：主语言 = 排除样式/标记语言（CSS/HTML/SCSS/Less/Stylus）后字节数最大者；内含语言→OKLCH 色相角映射表。**前端 LangBar 已删，但 WorkCard 色相仍从此模块导入 `hueForLanguage`，是色相表的唯一事实来源。**
- `scripts/fetch-works.mjs`：gh api 子进程（每仓库 2 个请求：meta + languages），3 次指数退避重试，404 不重试直接报仓库名。启动先探测 gh 安装/登录。
- `src/data/works.json`：结构为 `{ mirror, works }`，**提交进 git 作为快照**，clone 后无需 gh 即可开发。
- 错误处理原则：数据完整性问题（schema 不合法、描述无法解析且未补齐、仓库 404）一律构建失败；内容缺失（languages 为空）优雅降级。

### 前端

- 入口 `src/main.ts` 用 `vite-ssg/single-page`（无 vue-router），`App.vue` = MotionConfig + AuroraBackground + IndexView。
- 排序在 `src/composables/sortWorks.ts`（纯函数，有单测）：`score === null`（进行中）置顶，两组内部按 date 降序；筛选不改变顺序。
- 卡片序号按时间升序稳定编号（`useWorks.ts` 的 `workNumbers`），与展示排序无关。
- 卡片外链结构：整卡是绝对定位的覆盖层 `<a class="card-link">`（GitHub），镜像 `<a class="mirror-link">` 以 `z-10` 叠在其上 —— **不允许 `<a>` 嵌套**，改动卡片时保持该结构。

### 主题与视觉（OKLCH 双主题）

- token 全在 `src/styles/theme.css`：色相角锁定，明暗只改 L/C。浅色"色散"（无 glow、锐利描边）、暗色"发光"（玻璃 + glow），两套是不同物理隐喻，不是取反。
- 每张卡片经 style 注入 `--hue`（色相表未命中时注入 `--c: 0` 回退中性灰），`--wa` 在 holo.css 里合成。
- 主题切换：VueUse `useDark`（class `.dark`，storage key `vueuse-color-scheme`）+ index.html 内联防闪烁脚本 + ThemeToggle 的 View Transitions 圆形扩散。
- Inspira UI 移植组件在 `src/components/inspira/`（CardSpotlight/GlowBorder/AuroraBackground），全部 CSS/pointer 实现；**不引入 WebGL/Canvas 类组件**。交互动效用 motion-v，入场 stagger 是纯 CSS（`--i` 变量），保证静态 HTML 不执行 JS 也完整可读。

### ⚠ 已踩过的坑：scoped 样式里的 `:global(.dark)`

当前 Vue SFC 编译器会把 `<style scoped>` 里的 `:global(.dark) .xxx` 错误拆成选择器列表 `.dark, .xxx[data-v]`，规则泄漏到 `html.dark` 上（曾导致整页 `display:none` 白屏）。**暗色覆盖规则必须写在全局 CSS（holo.css）或用 Tailwind `dark:` 变体类，绝不在 scoped 块里写 `:global(.dark)` 后代选择器。**

### 测试与 CI

- `tests/` 下按模块分文件，夹具用 8 条真实仓库描述；改 parse/merge/sort 逻辑必须同步跑对应测试。
- `.github/workflows/deploy.yml`：`npm test` 置于 build **之前**（解析类 bug 是静默的，构建照样绿灯，必须在发布前拦截）；build 步骤注入 `GH_TOKEN` 供 runner 预装的 gh 认证；产物经 `npm run smoke` 断言后走 Pages artifact 部署。
- 仓库名必须保持 `coursework-archive`（vite `base` 与 Pages 地址依赖它）。

## 维护流程

新增科目：给仓库写规范描述 → `works.yaml` 加 `- url: https://github.com/{owner}/{repo}`（描述不规范就手填覆盖字段）→ push 自动部署。删科目 = 删条目。刷新 star/描述：Actions 页手动 `Run workflow`。
