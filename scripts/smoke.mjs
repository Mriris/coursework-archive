/**
 * 构建冒烟（§9）：dist/index.html 存在且包含全部标题、每张卡片的 GitHub 外链
 * 与「待评分」徽章文案。
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function assert(cond, message) {
  if (!cond) failures.push(message);
}

const { works } = JSON.parse(
  await readFile(path.join(ROOT, 'src', 'data', 'works.json'), 'utf8'),
);
assert(Array.isArray(works) && works.length >= 1, 'works.json 为空');

let indexHtml = null;
try {
  indexHtml = await readFile(path.join(ROOT, 'dist', 'index.html'), 'utf8');
} catch {
  assert(false, 'dist/index.html 不存在');
}

if (indexHtml) {
  for (const work of works) {
    assert(indexHtml.includes(work.title), `index.html 缺少标题：${work.title}`);
    assert(
      indexHtml.includes(`https://github.com/${work.owner}/${work.repo}`),
      `index.html 缺少 GitHub 外链：${work.owner}/${work.repo}`,
    );
  }
  if (works.some((w) => w.score === null)) {
    assert(indexHtml.includes('待评分'), 'index.html 缺少「待评分」徽章文案');
  }
}

if (failures.length > 0) {
  console.error(`冒烟失败（${failures.length} 项）：`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`冒烟通过：index.html 含 ${works.length} 张卡片的 GitHub 外链`);
