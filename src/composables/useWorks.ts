/**
 * 数据读取、筛选、排序（§7）。
 * works.json 为构建时固化的快照，浏览器运行时零网络请求（§3）。
 */
import rawData from '../data/works.json';
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
}

interface WorksData {
  works: Work[];
}

const data = rawData as WorksData;

/** 全量作业：未出分置顶，组内日期降序（§6.1） */
export const works: Work[] = sortWorks(data.works);
