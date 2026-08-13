import { describe, expect, it } from 'vitest';
import { compareWorks, sortWorks } from '../src/composables/sortWorks';

const w = (repo, score, date) => ({ repo, score, date });

describe('sortWorks（§6.1 未出分置顶）', () => {
  it('未出分（进行中）固定排在已出分之前', () => {
    const sorted = sortWorks([
      w('a', 100, '2024-11'),
      w('b', null, '2023-01'),
      w('c', 95, '2026-01'),
    ]);
    expect(sorted.map((x) => x.repo)).toEqual(['b', 'c', 'a']);
  });

  it('两组内部均按 date 降序', () => {
    const sorted = sortWorks([
      w('old-scored', 95, '2023-10'),
      w('new-wip', null, '2026-08'),
      w('new-scored', 97, '2026-01'),
      w('old-wip', null, '2024-01'),
    ]);
    expect(sorted.map((x) => x.repo)).toEqual(['new-wip', 'old-wip', 'new-scored', 'old-scored']);
  });

  it('月份补零后字符串比较即时间序（2024-08 < 2024-10）', () => {
    expect(compareWorks(w('a', 90, '2024-08'), w('b', 90, '2024-10'))).toBeGreaterThan(0);
  });

  it('不修改原数组', () => {
    const list = [w('a', null, '2024-01'), w('b', 90, '2025-01')];
    const snapshot = [...list];
    sortWorks(list);
    expect(list).toEqual(snapshot);
  });

  it('8 条真实数据形态：仅 2026-08 未出分置顶', () => {
    const real = [
      w('Classic-AI-Projects', 95, '2023-10'),
      w('SmartAcademicManagementSystem', 95, '2023-12'),
      w('muaCloud', 97, '2024-08'),
      w('PA-UIENet', 86, '2024-10'),
      w('summer-camp-system', 94, '2024-11'),
      w('PeopleOps', 100, '2024-11'),
      w('PatternRecognition', 97, '2026-01'),
      w('catia-v5-aircraft-automation', null, '2026-08'),
    ];
    const sorted = sortWorks(real);
    expect(sorted[0].repo).toBe('catia-v5-aircraft-automation');
    expect(sorted[1].repo).toBe('PatternRecognition');
    expect(sorted.at(-1).repo).toBe('Classic-AI-Projects');
  });
});
