# 大作业存档站 · 设计文档

- **日期**：2026-08-09（2026-08-13 修订：works.yaml 配置化收录、gh CLI 抓取、未出分置顶、全息构件改用 Inspira UI + motion-v）
- **项目根**：`D:\0Program\Mriris`
- **目标仓库**：`Mriris/coursework-archive`
- **线上地址**：`https://mriris.github.io/coursework-archive/`

---

## 1. 目标与非目标

### 目标

把散落在个人 GitHub 账号（88 个仓库）中的 8 个课程大作业聚合成一个可浏览、可检索、可长期留存的存档站点，供后来的同学参考。站点需要：

1. 一眼看清全部作业的时间跨度、课程来源、技术栈、成绩。
2. 不跳出站点就能读完每个作业的完整 README（含图片）。
3. 高科技全息视觉风格，支持明暗主题切换，两种主题都是一等公民。
4. 新增作业的维护成本 ≤ 改一行配置 + push。
5. 未出分（进行中）的作业固定置顶，任课老师打开首页第一眼即可看到并点击进入。

### 非目标（明确不做）

- 不做后端、不做数据库、不做评论/访客统计。
- 不做站内全文搜索（只对标题/课程/技术栈做前端过滤）。
- 不做 i18n，全站中文。
- 不做作业源码的在线浏览（跳转 GitHub 即可）。
- 不修改这 8 个源仓库的任何设置（不解档、不打 topic、不改描述）。

---

## 2. 收录范围

收录清单由项目根目录的 `works.yaml` 声明。每个条目最少只写 `url`（其余信息从 GitHub description 自动解析）；也可以手填字段逐项覆盖自动解析结果：

```yaml
works:
  # 常规条目：只写 url，course/title/date/score 全部来自描述解析
  - url: https://github.com/Mriris/PeopleOps

  # 覆盖条目：手填字段优先于自动解析；未写的字段仍用解析值
  - url: https://github.com/Mriris/catia-v5-aircraft-automation
    course: 飞机三维建模技术与创新实践
    title: CATIA参数化建模、DMU运动仿真与结构有限元分析
    date: 2026-08
    # score 不写 = 用解析值；显式写 score: null = 强制"进行中"
```

**增删科目 = 增删条目**。`url` 携带 owner 与仓库名，收录范围不再限定单一账号。当前收录以下 8 个仓库（其真实描述同时作为测试夹具）：

| # | 仓库 | 默认分支 | 归档 | 描述（数据源） |
|---|---|---|---|---|
| 1 | `Classic-AI-Projects` | `main` | 是 | 【2023-10】人工智能选修课-启发式搜索算法和动物专家系统-95 |
| 2 | `SmartAcademicManagementSystem` | `main` | 是 | 【2023-12】.NET体系及编程-智能教务信息管理系统-95 |
| 3 | `muaCloud` | `master` | 是 | 【2024-8】移动应用开发课程实践-多端网盘系统(ownCloud复刻)-97 |
| 4 | `PA-UIENet` | `master` | 是 | 【2024-10】大创-基于物理感知双流网络的水下图像增强方法-86 |
| 5 | `summer-camp-system` | **`zero`** | 是 | 【2024-11】软件工程综合实训-夏令营管理系统-94 |
| 6 | `PeopleOps` | `master` | 是 | 【2024-11】东软实习-企业人事管理系统-100 |
| 7 | `PatternRecognition` | `main` | 否 | 【2026-1】模式识别基础与前沿-无监督学习工业产品表面缺陷检测方法-97 |
| 8 | `catia-v5-aircraft-automation` | `main` | 否 | 【2026-8】飞机三维建模技术与创新实践-CATIA参数化建模、DMU 运动仿真与结构有限元分析 |

**默认事实来源仍是各仓库的 GitHub description**；`works.yaml` 的手填字段是逐字段的显式覆盖，仅用于描述无法规范化的仓库。约定：能改描述优先改描述，避免两处数据漂移。

---

## 3. 架构总览

```
                  构建时（GitHub Actions / 本地）
  works.yaml ──► scripts/fetch-works.mjs ──► src/data/works.json
                        │  gh api（GitHub CLI 子进程）  │
                        │  · repos/{owner}/{repo}       │
                        │  · repos/.../languages        │
                        │  · repos/.../readme           │
                        ▼                               ▼
                 config-schema.mjs               vite-ssg build
                 parse-description.mjs                  │
                 rewrite-readme.mjs                     │
                                                        ▼
                                          dist/  9 个静态 HTML
                                          ├── index.html
                                          └── work/{repo}/index.html × 8
                                                        │
                                            upload-pages-artifact
                                                        ▼
                                    https://mriris.github.io/coursework-archive/
```

关键决策：**数据在构建时固化进产物**。浏览器运行时不发任何网络请求，页面打开即完成态。这样归档仓库将来即使被删除或转私有，已发布的站点仍然完整可读 —— 对"存档"这个定位是必要属性。

---

## 4. 数据管线

### 4.1 抓取（`scripts/fetch-works.mjs`）

**不使用 fetch 直连 `api.github.com`**（调研中已两次遇到连接超时），统一通过 GitHub CLI 子进程调用：`execFile('gh', ['api', endpoint])`，stdout 即 JSON。gh 复用本机已配置的凭据与代理链路，脚本内不出现任何 token 处理代码。

对 `works.yaml` 中每个仓库并发发起 3 个请求：

| 端点（`gh api …`） | 取用字段 |
|---|---|
| `repos/{owner}/{repo}` | `description` `default_branch` `stargazers_count` `pushed_at` `html_url` `archived` `license.spdx_id` |
| `repos/{owner}/{repo}/languages` | 全部（语言 → 字节数） |
| `repos/{owner}/{repo}/readme` | `content`（base64）、`path` |

**认证**：本地依赖 `gh auth login` 已登录状态；Actions 的 runner 预装 gh，只需在构建步骤注入环境变量 `GH_TOKEN: ${{ github.token }}`（5000 次/小时）。8 个仓库共 24 个请求，远低于限额。

**前置检查**：启动时先探测 `gh --version` 与 `gh auth status`，gh 未安装或未登录直接失败退出，并打印安装/登录指引。

**重试**：gh 本身不重试，由包装层实现 —— 每个请求最多 3 次，指数退避（1s / 2s / 4s），以子进程非零退出码判定失败。3 次仍失败则**整个构建失败退出**，不允许发布数据残缺的站点。

**产物**：`src/data/works.json`，一并提交进 git 作为快照，使得 clone 后无需 token 即可 `npm run dev`。CI 构建时重新抓取并覆盖。

### 4.2 配置加载、校验与覆盖合并（`scripts/config-schema.mjs`）

`works.yaml` 用 `yaml` 包解析后交给 zod v4 schema 校验（单一本地文件、单一来源，不引入 zod-config 之类的多源加载器）：

```ts
const WorkEntry = z.object({
  url: z.url().regex(/^https:\/\/github\.com\/[^/]+\/[^/]+$/),
  course: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}$/).optional(),   // 已补零
  score: z.number().int().min(0).max(100).nullable().optional(),
})
const Config = z.object({ works: z.array(WorkEntry).min(1) })
```

校验失败即构建失败，报错自带 zod 字段路径（如 `works[3].date`）。

**合并规则**（纯函数，可测）：

1. 从 `url` 提取 `owner` 与 `repo`。
2. 尝试用 `parse-description` 解析该仓库的 GitHub description。
3. 条目中**显式写出的字段**覆盖解析结果，未写的字段用解析值。`score: null` 是显式覆盖（强制"进行中"），与不写 `score`（用解析值）语义不同 —— zod 的 `.nullable().optional()` 恰好区分这两种情况。
4. 描述解析失败不再无条件终止构建：若手填字段已补齐 `course` `title` `date`，该仓库照常收录（允许收录描述无法规范化的仓库）；否则报出仓库名与实际描述后构建失败。

### 4.3 描述解析（`scripts/parse-description.mjs`）

纯函数，独立可测。规则：

```
1. 匹配 /^【(\d{4})-(\d{1,2})】(.+)$/ ；不匹配则抛错（是否致命由 §4.2 合并层决定）
2. year = $1，month = String($2).padStart(2, '0')
3. parts = $3.split('-')
4. 若 parts.length >= 2 且 /^\d+$/.test(parts.at(-1))：
        score = Number(parts.pop())
   否则 score = null（未出分）
5. 若 parts.length < 2 则抛错
6. course = parts[0]
   title  = parts.slice(1).join('-')      ← 必须 join 回去
```

三条容易写错的地方，均已在 8 条真实数据上验证：

- **`title` 必须 `join('-')` 而非 `parts[1]`**，否则标题含连字符时会被截断。
- **`month` 必须补零**。原始数据同时存在 `2024-8` 和 `2024-10`、`2026-1` 和 `2026-8`；不补零则字符串排序下 8 月会排到 10 月之后。
- **成绩判定用"末段是否纯数字"，不能用固定段数**。`.NET体系及编程`（含点）、`多端网盘系统(ownCloud复刻)`（含括号）、`CATIA参数化建模、DMU 运动仿真与结构有限元分析`（含顿号和空格）都能正确解析；第 8 条无分数，`score` 为 `null`。

### 4.4 README 重写（`scripts/rewrite-readme.mjs`）

README 中的相对路径在站点域名下全部失效，必须重写为 raw 链接：

```
Resource/工作模式.png
  → https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/Resource/%E5%B7%A5%E4%BD%9C%E6%A8%A1%E5%BC%8F.png
```

规则：

| 输入形态 | 处理 |
|---|---|
| 相对图片 `![](a/b.png)` / `<img src="a/b.png">` | 重写为 `raw.githubusercontent.com`，路径段 `encodeURIComponent`（README 中存在中文文件名） |
| 以 `./` 开头 | 先剥掉 `./` 再重写 |
| 绝对 URL（`http://` `https://` `//`） | 原样保留 |
| 页内锚点 `#xxx` | 原样保留 |
| 相对文档链接 `docs/x.md` | 重写为 GitHub blob 页面（`/blob/{branch}/docs/x.md`），不重写为 raw |

**`{default_branch}` 必须逐仓库从 API 取**。三种分支名同时存在（`main` / `master` / `zero`），硬编码 `main` 会让 5 个仓库的图片全部 404。这是本项目最容易踩的坑。

**渲染与安全**：markdown-it（`html: true`）+ Shiki 构建时代码高亮，产物经 sanitize 移除 `<script>` `<iframe>` `<style>` 及 `on*` 事件属性。README 虽来自本人仓库，但属于构建时拉取的远端内容，按不可信输入处理。所有 `<img>` 补 `loading="lazy"`（`PA-UIENet` 61 MB、`PeopleOps` 40 MB，图片资源不小）。

### 4.5 数据模型

```ts
interface Work {
  owner: string           // 'Mriris'，来自 works.yaml 条目的 url
  repo: string            // 'PeopleOps'
  url: string             // GitHub 仓库地址
  year: number            // 2024
  month: string           // '11'（已补零）
  date: string            // '2024-11'，排序键
  course: string          // '东软实习'
  title: string           // '企业人事管理系统'
  score: number | null    // 100 ；null = 未出分
  archived: boolean
  stars: number
  license: string | null
  pushedAt: string
  languages: { name: string; bytes: number; percent: number }[]  // 降序
  primaryLanguage: string // 见 §5.2 主语言选取规则，非 API 原值
  hue: number             // 由 primaryLanguage 映射的 OKLCH 色相角
  readmeHtml: string      // 已重写、已高亮、已 sanitize
}
```

---

## 5. 视觉设计系统

### 5.1 核心原则：明暗不是取反，是两种光照

全息感由四个构件组成 —— 虹彩渐变、辉光、玻璃质感、流光描边。这四者在深色底上天然成立，**直接搬到浅色主题会全面塌方**：有色 `box-shadow` 在白底上呈现为脏色晕；`backdrop-filter` 白玻璃叠白底等于消失；霓虹强调色在白底上既刺眼又不满足对比度。

因此两套主题采用不同的物理隐喻：

| | 暗色主题（emissive · 发光） | 浅色主题（refractive · 色散） |
|---|---|---|
| 底 | 近黑，微弱色相偏移 | 近白，微弱冷灰 |
| 强调 | 高亮度低饱和霓虹，带 glow | 中亮度高饱和，**无 glow** |
| 卡片 | 半透明玻璃 + `backdrop-blur` + 内发光边 | 实底 + 多色锐利描边 + 细投影 |
| 全息表达 | 边缘辉光、光晕扩散 | 棱镜色散、渐变描边 |
| 参照 | Linear / Vercel 暗色 | Apple visionOS 浅色材质 |

### 5.2 OKLCH 锁色相

色相角固定，明暗主题只调整亮度 L 与彩度 C。这保证两套主题是"同一品牌的两种光照条件"，而不是两套割裂的设计；同时 OKLCH 的 L 通道感知均匀，`L=0.55` 在任意色相上视觉亮度一致，便于统一保证对比度（sRGB / HSL 做不到这点）。

```css
@theme {
  --hue-cyan: 210;  --hue-violet: 285;  --hue-magenta: 330;
  --hue-emerald: 155; --hue-amber: 70;  --hue-indigo: 265;
}
:root                    { --accent: oklch(0.55 0.19 var(--hue-violet)); }
:root[data-theme="dark"] { --accent: oklch(0.78 0.21 var(--hue-violet)); }
```

**每个作业按主语言分配一个色相角**，卡片的全息渐变以自身色相为基调。

#### 主语言选取规则（不可直接使用 API 原值）

GitHub 的 `primaryLanguage` 按字节数计算，会被样式与标记文件严重带偏。实测 `summer-camp-system` 的 API 主语言是 **CSS（294 KB）**，而真正的业务语言是 Vue（130 KB）—— 差值来自体积庞大的样式库文件。`PA-UIENet` 同样含 122 KB 的 HTML 干扰项。

规则：**取字节数最大的非样式/标记类语言**，排除集合为 `CSS` `HTML` `SCSS` `Less` `Stylus`。若排除后为空（例如纯静态页面项目），则回退为字节数最大的语言。

在 8 个仓库上的实测结果：

| 作业 | API 原值 | 规则修正后 | 色相角 |
|---|---|---|---|
| Classic-AI-Projects | C++ | C++ | 285（紫） |
| SmartAcademicManagementSystem | ASP.NET | ASP.NET | 265（靛） |
| muaCloud | Kotlin | Kotlin | 70（琥珀） |
| PA-UIENet | Jupyter Notebook | Jupyter Notebook | 210（青） |
| summer-camp-system | **CSS** ← 错 | **Vue** | 155（翠） |
| PeopleOps | Vue | Vue | 155（翠） |
| PatternRecognition | Python | Python | 210（青） |
| catia-v5-aircraft-automation | VBScript | VBScript | 330（品红） |

色相表未命中的语言回退到中性灰（`C = 0`），卡片仍成立，只是没有色彩个性。

8 张卡片色彩各异，但共用同一套 L/C 规则，整体仍是一个系统。

### 5.3 全息构件（Inspira UI 组件子集 + 少量自写 CSS）

全息构件不再全部自写，改用 **Inspira UI**（Aceternity UI / Magic UI 的 Vue 移植）：通过 `shadcn-vue` CLI 按组件复制进 `src/components/inspira/`，代码归本仓库所有，落地后统一改接 §5.2 的 OKLCH token。**只取 CSS / pointer 事件类组件，three.js / canvas 类组件一律不用**，"无 WebGL"底线不变。

| 构件 | 来源 | 说明 |
|---|---|---|
| 光标追随聚光卡片 | Inspira `CardSpotlight` | 替代自写指针光晕；gradient 色接卡片色相角 |
| 流光描边 | Inspira `GlowBorder` / `BorderBeam` | 替代自写 `@property --angle` + `conic-gradient`；仅 hover 启动 |
| 极光背景 | Inspira `AuroraBackground` | 纯 CSS 渐变动画；暗色主题为主，浅色主题降彩度 |
| 玻璃卡片 | 自写 CSS | `backdrop-filter: blur()` + 半透明底（仅暗色主题） |
| 网格底纹 | 自写 CSS | `repeating-linear-gradient`，极低对比度 |
| 主题切换 | 自写 | View Transitions API 圆形扩散，从点击坐标铺开 |

**交互层统一交给 motion-v**（Framer Motion 同源 Vue 版，也是 Inspira 自身的动效依赖，不引入第二套动效体系）：

- 卡片墙入场：`initial` / `animate` + stagger 逐张浮现。
- 筛选/搜索重排：`layout` 布局动画（FLIP），卡片平滑归位而非闪跳。
- hover / press：`:while-hover` / `:while-press` 弹簧曲线。
- 根组件包一层 `<MotionConfig reduced-motion="user">`，`prefers-reduced-motion` 全局自动降级（§5.4）。

**不使用 WebGL / Canvas** 的决策不变。理由：站点核心价值是可读的档案索引；CSS / pointer 方案运行时开销极低，与 SSG 预渲染契合 —— 静态 HTML 不执行 JS 即呈现基础视觉，motion-v 动效是渐进增强，JS 未加载时页面依然完整可读。WebGL 背景需 +100 KB 且首屏需等 JS，与 SSG 的收益直接冲突。

### 5.4 无障碍

- 正文对比度 ≥ 4.5:1，大字号 ≥ 3:1（WCAG AA），两种主题均需实测。
- `prefers-reduced-motion: reduce` 时关闭全部流光/扩散动画，View Transition 退化为直接切换；motion-v 侧由 `<MotionConfig reduced-motion="user">` 统一处理，无需逐组件判断。
- 颜色不作为唯一信息载体：成绩、语言均有文字标注，色相仅为装饰。
- 卡片为原生 `<a>`，键盘可达，焦点环使用当前色相且保证对比度。

---

## 6. 页面与路由

| 路由 | 页面 | 预渲染产物 |
|---|---|---|
| `/` | 卡片墙 | `dist/index.html` |
| `/work/:repo` | 详情页 × 8 | `dist/work/{repo}/index.html` |

`vue-router` 使用 `createWebHistory(import.meta.env.BASE_URL)`，`vite.config.ts` 设 `base: '/coursework-archive/'`。

**vite-ssg 的 `includedRoutes`** 从 `works.json` 展开出 8 条具体路径。因为展开后路径中不含 `:`，且全部仓库名均为合法 Windows 文件名（仅字母/数字/连字符），**无需配置 `htmlFileName`**。

预渲染是本项目选择 SSG 而非纯 SPA 的直接原因：GitHub Pages 无服务端 rewrite，纯 SPA 下直接访问或刷新 `/work/PeopleOps` 会返回 404。预渲染生成真实文件即彻底解决，且顺带获得 SEO 可索引与首屏无白屏。

### 6.1 首页

- 页头：标题、时间跨度（2023–2026）、作业数、主题切换按钮。
- 筛选栏：年份（2023 / 2024 / 2026）、技术栈、课程类型；搜索框对标题 + 课程 + 技术栈做前端过滤。
- 卡片网格：CSS Grid `auto-fill`，响应式，无媒体查询断点硬编码。
- 排序：`score === null`（进行中）的作业**固定置顶**（任课老师第一眼看到并点击进入），其后是已出分作业；两组内部均按 `date` 降序。筛选/搜索不改变该排序。比较器：`(a.score === null ? 0 : 1) - (b.score === null ? 0 : 1) || b.date.localeCompare(a.date)`。
- 卡片内容：序号、标题、课程、年月、语言色点 + 名称、成绩徽章（`score === null` 渲染为 `进行中`）、star 数（> 0 才显示）、`Archived` 标记。

### 6.2 详情页

- 页头：返回、标题、课程 · 年月 · 成绩 · star、语言构成条（百分比堆叠）、GitHub 跳转按钮、`git clone` 一键复制。
- 正文：渲染后的 README。
- 未出分的作业显示 `进行中` 徽章，而非隐藏成绩字段。

---

## 7. 组件划分

```
src/
├── main.ts                      ViteSSG 入口，导出 createApp
├── App.vue                      布局壳、AuroraBackground、MotionConfig、主题切换
├── data/works.json              构建产物（提交快照）
├── views/
│   ├── IndexView.vue            卡片墙
│   └── WorkView.vue             详情页
├── components/
│   ├── inspira/                 Inspira UI 落地组件（shadcn-vue CLI 复制，改接 OKLCH token）
│   │   ├── CardSpotlight.vue
│   │   ├── GlowBorder.vue
│   │   └── AuroraBackground.vue
│   ├── WorkCard.vue             单张卡片（组合 CardSpotlight + GlowBorder）
│   ├── FilterBar.vue            筛选 + 搜索
│   ├── LangBar.vue              语言构成条
│   ├── ScoreBadge.vue           成绩徽章（含 null → 进行中）
│   ├── ThemeToggle.vue          主题切换 + View Transition
│   └── MarkdownBody.vue         README 容器与排版
├── composables/
│   └── useWorks.ts              数据读取、筛选、排序（未出分置顶，§6.1）
└── styles/
    ├── theme.css                @theme token（OKLCH）
    ├── holo.css                 自写全息补充（玻璃卡片、网格底纹）
    └── markdown.css             README 正文排版
scripts/
├── fetch-works.mjs              抓取编排 + gh 子进程 + 重试（唯一有 I/O 的模块）
├── config-schema.mjs            纯函数，可测（works.yaml 校验 + 覆盖合并，§4.2）
├── parse-description.mjs        纯函数，可测
├── rewrite-readme.mjs           纯函数，可测
└── pick-language.mjs            纯函数，可测（主语言选取，§5.2）
works.yaml                       收录清单（url + 可选覆盖字段）
```

划分依据：除 `fetch-works.mjs` 外的四个模块全部是纯数据变换，不依赖 Vue、不依赖网络，因此可以脱离浏览器直接单元测试 —— 而这几处正是本项目 bug 风险最集中的地方（覆盖合并错位、描述截断、图片 404、主语言标错），且错误都具有**静默性**：构建照常绿灯，错误只体现在页面内容上。

---

## 8. 错误处理

| 场景 | 处理 |
|---|---|
| GitHub API 超时 / 5xx | 重试 3 次，指数退避；仍失败则构建失败退出 |
| gh 未安装 / 未登录 | 构建失败，打印安装与 `gh auth login` 指引 |
| `works.yaml` 不符合 schema | 构建失败，报出 zod 字段路径 |
| 仓库描述不匹配 `【YYYY-M】` 且手填未补齐 course/title/date | 构建失败，报出仓库名与实际描述 |
| 描述缺少 `课程-名称` 结构 | 同上（手填补齐则放行） |
| 仓库无 README（404） | 允许：详情页渲染"该仓库未提供 README"，构建继续 |
| `languages` 返回空对象 | 允许：语言构成条隐藏，`primaryLanguage` 取 `未知`，色相用中性灰 |
| 主语言不在色相表中 | 允许：回退中性灰（`C = 0`），不影响布局 |
| README 图片 404（运行时） | `onerror` 隐藏该图，不破坏排版 |
| `works.yaml` 中仓库不存在 / 已转私有 | 构建失败，明确报出仓库名 |

原则：**数据完整性问题一律 fail fast**（宁可构建红，不可发布错），**内容缺失则优雅降级**。

---

## 9. 测试策略

| 层 | 工具 | 覆盖 |
|---|---|---|
| 解析器单测 | Vitest | 8 条真实描述全部断言；边界：无分数、标题含 `-`、含 `.`、含 `()`、含顿号空格、月份补零、非法格式抛错 |
| 配置与合并单测 | Vitest | url-only 条目、手填覆盖、`score: null` 显式覆盖 vs 缺省、非法 url / 日期格式报错、描述解析失败但手填齐全时放行 |
| 排序单测 | Vitest | 未出分置顶、两组内部日期降序、筛选后顺序保持 |
| 重写器单测 | Vitest | 相对图片、`./` 前缀、绝对 URL 保留、锚点保留、中文文件名编码、`.md` 链接指向 blob、三种分支名 |
| 主语言选取单测 | Vitest | 8 个仓库的真实 `languages` 响应作为夹具，断言 `summer-camp-system` → `Vue`（非 `CSS`）、`PA-UIENet` → `Jupyter Notebook`；边界：全为样式语言时的回退、空对象 |
| 构建冒烟 | 脚本断言 | `dist` 下存在 9 个 HTML；`index.html` 含全部 8 个标题；随机抽查 1 个详情页含 README 内容且无 `<script>` |
| 主题对比度 | 手工 + 断言脚本 | 明暗两套主题下正文/次要文字/徽章的对比度均达 WCAG AA |

采用 TDD：`parse-description` 与 `rewrite-readme` 先写测试（用上表 8 条真实描述作为夹具）再写实现。

---

## 10. 部署

`.github/workflows/deploy.yml`，采用 Vite 官方现行推荐方式（Pages artifact，非 `gh-pages` 分支）：

- 触发：push 到 `main` + `workflow_dispatch`（手动重建，用于刷新 star 数等）
- 权限：`contents: read` / `pages: write` / `id-token: write`
- 并发：`group: pages`，`cancel-in-progress: true`
- 步骤：checkout → setup-node(lts, cache npm) → `npm ci` → `npm test` → `npm run build`（内含抓取，该步骤注入 `env: GH_TOKEN: ${{ github.token }}` 供 runner 预装的 gh 认证）→ `configure-pages` → `upload-pages-artifact(./dist)` → `deploy-pages`

`npm test` 置于 build 之前：解析器出错会产出静默错误的站点（标题被截断、图片全裂），必须在发布前拦截。

```json
{
  "scripts": {
    "dev": "vite",
    "fetch": "node scripts/fetch-works.mjs",
    "build": "npm run fetch && vite-ssg build",
    "test": "vitest run",
    "preview": "vite preview"
  }
}
```

---

## 11. 维护流程

新增一个大作业：

1. 给该仓库写规范描述：`【YYYY-M】课程-作业名称-分数`（未出分则省略 `-分数`）。
2. 在 `works.yaml` 追加 `- url: https://github.com/{owner}/{repo}`；若描述无法规范化，在该条目下手填 `course` / `title` / `date`（及可选 `score`）覆盖。
3. push。Actions 自动抓取、构建、部署。

删除一个科目：删掉 `works.yaml` 中对应条目后 push 即可。

需要刷新 star 数或已修改某仓库描述时：在 Actions 页面点 `Run workflow` 手动重建即可，无需改动代码。

---

## 12. 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | Vue 3 + TypeScript + Vite | 指定 |
| 渲染 | vite-ssg | 解决 Pages 无 rewrite 导致的刷新 404；SEO；首屏无白屏 |
| 路由 | vue-router（history 模式 + BASE_URL） | 配合 SSG 产出真实路径 |
| 主题 | VueUse `useDark` | localStorage 持久化 + 跟随 `prefers-color-scheme`，默认 `disableTransition` 防闪烁 |
| 样式 | Tailwind v4 `@theme`（token） + 少量手写 CSS | token 体系用框架，玻璃/底纹等简单构件手写 |
| 全息组件 | Inspira UI（`shadcn-vue` CLI 按组件复制） | Aceternity/Magic UI 的 Vue 移植；代码入仓可改 token，无整库依赖 |
| 动效 | motion-v | Framer Motion 同源 Vue 版；stagger / layout / 手势内置，`MotionConfig` 统一 reduced-motion |
| Markdown | markdown-it + Shiki | 构建时高亮，运行时零成本 |
| 测试 | Vitest | 与 Vite 同源，零额外配置 |
| 部署 | GitHub Actions + Pages artifact | Vite 官方现行推荐 |
| 收录配置 | `works.yaml`（`yaml` 包解析）+ zod v4 校验 | 注释友好、url-only 一行成条目；zod 报错自带字段路径 |
| GitHub 抓取 | GitHub CLI（`gh api` 子进程） | 复用本机凭据/代理，规避 fetch 直连超时；Actions runner 预装 |

---

## 13. 已知风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| 三种默认分支名（`main`/`master`/`zero`） | 图片大面积 404 | 逐仓库从 API 取 `default_branch`；单测覆盖三种分支 |
| GitHub API 间歇超时（调研中已复现 2 次） | 构建随机失败 | 改走 `gh api`（本机凭据/代理链路）+ 3 次重试指数退避 |
| 描述格式漂移 | 标题截断、成绩丢失且无声 | 解析失败且手填未补齐即构建失败；8 条真实数据作为测试夹具 |
| `works.yaml` 手填字段与仓库描述漂移 | 站点显示与 GitHub 不同步 | 约定能改描述优先改描述，手填仅用于无法规范化的仓库；覆盖字段随 works.json 快照可 diff 审查 |
| GitHub 主语言被样式文件带偏 | `summer-camp-system` 会标成 CSS 项目并失去色相 | 排除样式/标记类语言后再取最大（§5.2）；单测锁定该仓库结果为 `Vue` |
| 归档仓库将来被删除或转私有 | 站点数据源消失 | 数据构建时固化进产物；`works.json` 提交进 git 留存快照 |
| 浅色主题全息效果塌方 | 一半用户看到劣化版本 | 明暗采用不同物理隐喻（§5.1）；对比度实测纳入测试 |
| Inspira 组件默认配色/动效未接双主题 token | 浅色主题塌方以另一种方式复现 | 组件代码入仓后统一改接 OKLCH token（§5.3），对比度实测覆盖两主题 |
| 误引入 Inspira 的 three.js / canvas 类组件 | 破坏无 WebGL 决策，包体积暴涨 | 选型白名单：CardSpotlight / GlowBorder / BorderBeam / AuroraBackground；出现 `three` 依赖即拒 |
| README 含大体积图片 | 详情页加载慢 | 全部 `<img>` 加 `loading="lazy"` |
