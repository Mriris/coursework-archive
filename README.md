# 大作业存档站

课程大作业聚合存档：一眼看清全部作业的时间跨度、课程来源、技术栈与成绩，不跳出站点读完每个作业的完整 README。

**线上地址**：<https://mriris.github.io/coursework-archive/>

## 特性

- **构建时固化数据**：`gh api` 抓取仓库元数据与 README，渲染、高亮、sanitize 后写入 `src/data/works.json`；浏览器运行时零网络请求，源仓库将来删除或转私有也不影响已发布站点。
- **明暗双主题**：OKLCH 锁色相，暗色发光（emissive）/ 浅色色散（refractive）两套光照隐喻，View Transitions 圆形扩散切换。
- **全息视觉**：Inspira UI 组件子集（CardSpotlight / GlowBorder / AuroraBackground）+ motion-v 交互，纯 CSS/pointer 实现，无 WebGL。
- **未出分置顶**：`score === null`（进行中）的作业固定排在最前，方便任课老师第一眼看到。

## 维护

新增一个大作业：

1. 给仓库写规范描述：`【YYYY-M】课程-作业名称-分数`（未出分省略 `-分数`）。
2. 在 `works.yaml` 追加 `- url: https://github.com/{owner}/{repo}`；描述无法规范化时可在条目下手填 `course` / `title` / `date` / `score` 覆盖（`score: null` 表示强制"进行中"）。
3. push，Actions 自动抓取、测试、构建、部署。

删除科目 = 删除 `works.yaml` 对应条目。刷新 star 数 / 描述变更：Actions 页面手动 `Run workflow`。

## 本地开发

```bash
npm ci
npm run fetch   # 需 gh 已登录（gh auth login）；生成 src/data/works.json
npm run dev     # 开发服务器（可直接用仓库中提交的数据快照，无需 fetch）
npm test        # 数据管线单测（Vitest）
npm run build   # fetch + vite-ssg 预渲染
npm run smoke   # 构建产物冒烟断言
```

设计文档见 [`docs/superpowers/specs/2026-08-09-coursework-archive-site-design.md`](docs/superpowers/specs/2026-08-09-coursework-archive-site-design.md)。
