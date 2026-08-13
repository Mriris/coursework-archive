/**
 * 抓取编排（§4.1）。唯一有 I/O 的模块。
 * 不用 fetch 直连 api.github.com（调研中两次超时），统一走 GitHub CLI 子进程：
 * gh 复用本机凭据与代理链路，CI 中由 GH_TOKEN 认证。
 * 产物 src/data/works.json 提交进 git 作为快照，clone 后无需 gh 即可 npm run dev。
 * 详情直接外跳 GitHub / 镜像站，站点不渲染 README。
 */
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import YAML from 'yaml';
import { mergeWork, parseConfig } from './config-schema.mjs';
import { hueForLanguage, pickPrimaryLanguage } from './pick-language.mjs';

const execFileP = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXEC_OPTS = { maxBuffer: 8 * 1024 * 1024, windowsHide: true };

async function preflight() {
  try {
    await execFileP('gh', ['--version'], EXEC_OPTS);
  } catch {
    throw new Error('未检测到 GitHub CLI（gh）。请先安装：https://cli.github.com');
  }
  try {
    await execFileP('gh', ['auth', 'status'], EXEC_OPTS);
  } catch {
    throw new Error('gh 未登录。本地请运行 gh auth login；CI 请注入环境变量 GH_TOKEN。');
  }
}

/** gh api 包装：3 次重试 + 指数退避（1s/2s/4s）；404 不重试。 */
async function gh(endpoint) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { stdout } = await execFileP('gh', ['api', endpoint], EXEC_OPTS);
      return JSON.parse(stdout);
    } catch (err) {
      const msg = String(err?.stderr || err?.message || '');
      if (/HTTP 404/.test(msg)) {
        throw new Error(`gh api ${endpoint} 返回 404：仓库不存在或已转私有`);
      }
      lastErr = err;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
      }
    }
  }
  throw new Error(
    `gh api ${endpoint} 连续 3 次失败：${String(lastErr?.stderr || lastErr?.message).trim()}`,
  );
}

async function fetchWork(entry) {
  const base = `repos/${entry.owner}/${entry.repo}`;
  const [meta, languages] = await Promise.all([gh(base), gh(`${base}/languages`)]);

  const merged = mergeWork(entry, meta.description);

  const langEntries = Object.entries(languages ?? {}).sort((a, b) => b[1] - a[1]);
  const totalBytes = langEntries.reduce((sum, [, bytes]) => sum + bytes, 0);
  const langs = langEntries.map(([name, bytes]) => ({
    name,
    bytes,
    percent: totalBytes > 0 ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
  }));
  const primaryLanguage = pickPrimaryLanguage(languages ?? {});

  return {
    owner: entry.owner,
    repo: entry.repo,
    url: meta.html_url,
    ...merged,
    archived: Boolean(meta.archived),
    stars: meta.stargazers_count ?? 0,
    license:
      meta.license?.spdx_id && meta.license.spdx_id !== 'NOASSERTION' ? meta.license.spdx_id : null,
    pushedAt: meta.pushed_at,
    languages: langs,
    primaryLanguage,
    hue: hueForLanguage(primaryLanguage),
  };
}

async function main() {
  await preflight();

  const yamlText = await readFile(path.join(ROOT, 'works.yaml'), 'utf8');
  const { mirror, entries } = parseConfig(YAML.parse(yamlText));
  console.log(`works.yaml：${entries.length} 个仓库${mirror ? `，镜像 ${mirror}` : ''}`);

  const works = await Promise.all(entries.map((entry) => fetchWork(entry)));
  for (const w of works) {
    const scoreText = w.score === null ? '进行中' : String(w.score);
    console.log(
      `  ✓ ${w.owner}/${w.repo}  ${w.date}  ${w.course} - ${w.title}  [${scoreText}]  ${w.primaryLanguage}`,
    );
  }

  const outDir = path.join(ROOT, 'src', 'data');
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, 'works.json'),
    `${JSON.stringify({ mirror, works }, null, 2)}\n`,
    'utf8',
  );
  console.log(`已写入 src/data/works.json（${works.length} 条）`);
}

main().catch((err) => {
  console.error(`抓取失败：${err.message}`);
  process.exit(1);
});
