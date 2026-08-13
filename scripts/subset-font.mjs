/**
 * 衬线标题字体子集化：站点为全静态，衬线用字在构建时完全已知，
 * 从 fontsource 的 Noto Serif SC 700 全量中文文件（约 1.5MB）裁出仅含用字的
 * woff2（几十 KB），写入 src/assets/ 并提交进 git（与 works.json 同为快照）。
 * works.yaml 变更后随 npm run fetch 自动重生成；若改动界面上的衬线文案
 * （h1、钤印等），需同步维护下方 UI_TEXT。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(
  ROOT,
  'node_modules',
  '@fontsource',
  'noto-serif-sc',
  'files',
  'noto-serif-sc-chinese-simplified-700-normal.woff2',
);
const TARGET_DIR = path.join(ROOT, 'src', 'assets');
const TARGET = path.join(TARGET_DIR, 'noto-serif-sc-700-subset.woff2');

// 界面静态衬线用字：h1「大作业存档」、钤印「待评分」与成绩数字
const UI_TEXT = '大作业存档待评分0123456789';

const { works } = JSON.parse(
  await readFile(path.join(ROOT, 'src', 'data', 'works.json'), 'utf8'),
);
// 卡片衬线标题 = 课程名（含其中的拉丁字符，如 .NET）
const text = UI_TEXT + works.map((w) => w.course).join('');

const source = await readFile(SOURCE);
const subset = await subsetFont(source, text, { targetFormat: 'woff2' });
await mkdir(TARGET_DIR, { recursive: true });
await writeFile(TARGET, subset);

const glyphs = new Set(text).size;
console.log(
  `字体子集：${glyphs} 个用字 → ${(subset.length / 1024).toFixed(0)} KB（${path.relative(ROOT, TARGET)}）`,
);
