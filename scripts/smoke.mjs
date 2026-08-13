/**
 * 构建冒烟（§9）：dist 下存在 9 个 HTML；index.html 含全部标题与「进行中」；
 * 详情页含对应标题与 README 容器；works.json 无 <script> 残留。
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function assert(cond, message) {
  if (!cond) failures.push(message);
}

async function readOrNull(p) {
  try {
    return await readFile(p, 'utf8');
  } catch {
    return null;
  }
}

const works = JSON.parse(await readFile(path.join(ROOT, 'src', 'data', 'works.json'), 'utf8'));
assert(works.length >= 1, 'works.json 为空');

const indexHtml = await readOrNull(path.join(ROOT, 'dist', 'index.html'));
assert(indexHtml !== null, 'dist/index.html 不存在');

for (const work of works) {
  assert(!(work.readmeHtml ?? '').includes('<script'), `${work.repo} 的 readmeHtml 含 <script>`);
  assert(!/\son\w+=/.test(work.readmeHtml ?? ''), `${work.repo} 的 readmeHtml 含 on* 事件属性`);
  if (indexHtml) {
    assert(indexHtml.includes(work.title), `index.html 缺少标题：${work.title}`);
  }

  const page = await readOrNull(path.join(ROOT, 'dist', 'work', work.repo, 'index.html'));
  assert(page !== null, `dist/work/${work.repo}/index.html 不存在`);
  if (page) {
    assert(page.includes(work.title), `详情页 ${work.repo} 缺少标题`);
    if (work.readmeHtml) {
      assert(page.includes('markdown-body'), `详情页 ${work.repo} 缺少 README 容器`);
    }
  }
}

if (indexHtml && works.some((w) => w.score === null)) {
  assert(indexHtml.includes('进行中'), 'index.html 缺少「进行中」徽章文案');
}

if (failures.length > 0) {
  console.error(`冒烟失败（${failures.length} 项）：`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`冒烟通过：dist 含 ${works.length + 1} 个 HTML，内容断言全部成立`);
