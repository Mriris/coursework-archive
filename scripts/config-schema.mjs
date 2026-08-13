/**
 * works.yaml 结构校验 + 覆盖合并（§4.2）。纯函数，无 I/O。
 * 条目最少只写 url；手填 course / title / date / score 逐字段覆盖描述解析结果。
 * score: null 是显式覆盖（强制"待评分"），与不写 score（用解析值）语义不同。
 */
import { z } from 'zod';
import { parseDescription } from './parse-description.mjs';

const GITHUB_URL_RE = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)\/?$/;

export const WorkEntrySchema = z.strictObject({
  url: z.string().regex(GITHUB_URL_RE, 'url 必须形如 https://github.com/{owner}/{repo}'),
  course: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'date 必须为 YYYY-MM（月份补零）').optional(),
  score: z.number().int().min(0).max(100).nullable().optional(),
});

export const ConfigSchema = z.strictObject({
  works: z.array(WorkEntrySchema).min(1),
});

/** 校验配置对象并展开 owner / repo。校验失败抛出带字段路径的 ZodError。 */
export function parseConfig(data) {
  const cfg = ConfigSchema.parse(data);
  return {
    entries: cfg.works.map((entry) => {
      const m = entry.url.match(GITHUB_URL_RE);
      return { ...entry, owner: m[1], repo: m[2] };
    }),
  };
}

const hasOwn = (obj, key) =>
  Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined;

/**
 * 合并规则（§4.2）：手填字段覆盖描述解析；描述解析失败时，
 * 手填已补齐 course/title/date 则放行，否则抛错（fail fast）。
 * @param {{owner:string, repo:string, course?:string, title?:string, date?:string, score?:number|null}} entry
 * @param {string|null|undefined} description GitHub 仓库描述
 */
export function mergeWork(entry, description) {
  let parsed = null;
  let parseError = null;
  if (typeof description === 'string' && description.trim()) {
    try {
      parsed = parseDescription(description);
    } catch (err) {
      parseError = err;
    }
  } else {
    parseError = new Error('仓库无描述');
  }

  if (!parsed) {
    const missing = ['course', 'title', 'date'].filter((k) => !hasOwn(entry, k));
    if (missing.length > 0) {
      throw new Error(
        `仓库 ${entry.owner}/${entry.repo} 的描述无法解析（${parseError.message}），` +
          `且 works.yaml 未手填补齐：${missing.join('、')}`,
      );
    }
  }

  const date = hasOwn(entry, 'date') ? entry.date : parsed.date;
  const [year, month] = date.split('-');
  return {
    course: hasOwn(entry, 'course') ? entry.course : parsed.course,
    title: hasOwn(entry, 'title') ? entry.title : parsed.title,
    date,
    year: Number(year),
    month,
    score: hasOwn(entry, 'score') ? entry.score : parsed ? parsed.score : null,
  };
}
