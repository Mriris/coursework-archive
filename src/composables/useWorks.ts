/**
 * 数据读取、筛选、排序（§7）。
 * works.json 为构建时固化的快照，浏览器运行时零网络请求（§3）。
 */
import rawWorks from '../data/works.json';
import { sortWorks } from './sortWorks';

export interface WorkLanguage {
  name: string;
  bytes: number;
  percent: number;
}

export interface Work {
  owner: string;
  repo: string;
  url: string;
  course: string;
  title: string;
  date: string;
  year: number;
  month: string;
  score: number | null;
  archived: boolean;
  stars: number;
  license: string | null;
  pushedAt: string;
  languages: WorkLanguage[];
  primaryLanguage: string;
  hue: number | null;
  readmeHtml: string | null;
}

/** 全量作业：未出分置顶，组内日期降序（§6.1） */
export const works: Work[] = sortWorks(rawWorks as Work[]);

/** 稳定序号：按时间升序编号（01 起），与筛选/展示排序无关 */
const byDateAsc = [...works].sort((a, b) => a.date.localeCompare(b.date));
export const workNumbers: Record<string, string> = Object.fromEntries(
  byDateAsc.map((w, i) => [w.repo, String(i + 1).padStart(2, '0')]),
);

export function findWork(repo: string): Work | undefined {
  return works.find((w) => w.repo === repo);
}
