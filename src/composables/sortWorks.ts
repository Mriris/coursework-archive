/**
 * 排序（§6.1）：未出分（score === null，待评分）的作业固定置顶，
 * 便于任课老师第一眼看到并点击进入；两组内部均按 date 降序。纯函数，可测。
 */
export interface SortableWork {
  score: number | null;
  date: string;
}

export function compareWorks(a: SortableWork, b: SortableWork): number {
  const group = (a.score === null ? 0 : 1) - (b.score === null ? 0 : 1);
  if (group !== 0) return group;
  return b.date.localeCompare(a.date);
}

export function sortWorks<T extends SortableWork>(works: readonly T[]): T[] {
  return [...works].sort(compareWorks);
}
