import { describe, expect, it } from 'vitest';
import { mergeWork, parseConfig } from '../scripts/config-schema.mjs';

const DESC = '【2024-11】东软实习-企业人事管理系统-100';

describe('parseConfig（§4.2 校验）', () => {
  it('url-only 条目通过并展开 owner / repo', () => {
    const [entry] = parseConfig({ works: [{ url: 'https://github.com/Mriris/PeopleOps' }] });
    expect(entry.owner).toBe('Mriris');
    expect(entry.repo).toBe('PeopleOps');
  });

  it('url 末尾斜杠可容忍', () => {
    const [entry] = parseConfig({ works: [{ url: 'https://github.com/Mriris/PeopleOps/' }] });
    expect(entry.repo).toBe('PeopleOps');
  });

  it('非 github.com 仓库 url 拒绝', () => {
    expect(() => parseConfig({ works: [{ url: 'https://gitee.com/a/b' }] })).toThrow();
    expect(() => parseConfig({ works: [{ url: 'https://github.com/only-owner' }] })).toThrow();
  });

  it('date 未补零拒绝（必须 YYYY-MM）', () => {
    expect(() =>
      parseConfig({ works: [{ url: 'https://github.com/a/b', date: '2026-8' }] }),
    ).toThrow();
  });

  it('未知字段拒绝（strict）', () => {
    expect(() =>
      parseConfig({ works: [{ url: 'https://github.com/a/b', scroe: 90 }] }),
    ).toThrow();
  });

  it('score 超界拒绝', () => {
    expect(() =>
      parseConfig({ works: [{ url: 'https://github.com/a/b', score: 101 }] }),
    ).toThrow();
  });

  it('空列表拒绝', () => {
    expect(() => parseConfig({ works: [] })).toThrow();
  });
});

describe('mergeWork（§4.2 覆盖合并）', () => {
  const base = { owner: 'Mriris', repo: 'PeopleOps' };

  it('url-only：全部字段来自描述解析', () => {
    expect(mergeWork(base, DESC)).toEqual({
      course: '东软实习',
      title: '企业人事管理系统',
      date: '2024-11',
      year: 2024,
      month: '11',
      score: 100,
    });
  });

  it('手填字段覆盖解析值，未填字段保留解析值', () => {
    const merged = mergeWork({ ...base, title: '人事系统（重构版）', date: '2025-01' }, DESC);
    expect(merged.title).toBe('人事系统（重构版）');
    expect(merged.date).toBe('2025-01');
    expect(merged.year).toBe(2025);
    expect(merged.month).toBe('01');
    expect(merged.course).toBe('东软实习');
    expect(merged.score).toBe(100);
  });

  it('score: null 是显式覆盖（强制进行中）', () => {
    expect(mergeWork({ ...base, score: null }, DESC).score).toBeNull();
  });

  it('不写 score 时采用解析值', () => {
    expect(mergeWork(base, DESC).score).toBe(100);
  });

  it('描述无法解析但手填补齐 course/title/date 时放行', () => {
    const merged = mergeWork(
      { ...base, course: '课程', title: '标题', date: '2026-08' },
      '一段完全不规范的描述',
    );
    expect(merged).toMatchObject({ course: '课程', title: '标题', date: '2026-08', score: null });
  });

  it('描述无法解析且手填未补齐时抛错并报出仓库名', () => {
    expect(() => mergeWork({ ...base, course: '课程' }, '不规范')).toThrow(/Mriris\/PeopleOps/);
    expect(() => mergeWork({ ...base, course: '课程' }, '不规范')).toThrow(/title|date/);
  });

  it('仓库无描述且手填补齐时放行', () => {
    const merged = mergeWork({ ...base, course: 'A', title: 'B', date: '2026-01', score: 90 }, null);
    expect(merged.score).toBe(90);
  });
});
