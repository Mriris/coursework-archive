import { describe, expect, it } from 'vitest';
import { parseDescription } from '../scripts/parse-description.mjs';

// §9：8 条真实描述全部断言（收录仓库的 GitHub description 快照）
const REAL_CASES = [
  {
    input: '【2023-10】人工智能选修课-启发式搜索算法和动物专家系统-95',
    expected: { year: 2023, month: '10', date: '2023-10', course: '人工智能选修课', title: '启发式搜索算法和动物专家系统', score: 95 },
  },
  {
    input: '【2023-12】.NET体系及编程-智能教务信息管理系统-95',
    expected: { year: 2023, month: '12', date: '2023-12', course: '.NET体系及编程', title: '智能教务信息管理系统', score: 95 },
  },
  {
    input: '【2024-8】移动应用开发课程实践-多端网盘系统(ownCloud复刻)-97',
    expected: { year: 2024, month: '08', date: '2024-08', course: '移动应用开发课程实践', title: '多端网盘系统(ownCloud复刻)', score: 97 },
  },
  {
    input: '【2024-10】大创-基于物理感知双流网络的水下图像增强方法-86',
    expected: { year: 2024, month: '10', date: '2024-10', course: '大创', title: '基于物理感知双流网络的水下图像增强方法', score: 86 },
  },
  {
    input: '【2024-11】软件工程综合实训-夏令营管理系统-94',
    expected: { year: 2024, month: '11', date: '2024-11', course: '软件工程综合实训', title: '夏令营管理系统', score: 94 },
  },
  {
    input: '【2024-11】东软实习-企业人事管理系统-100',
    expected: { year: 2024, month: '11', date: '2024-11', course: '东软实习', title: '企业人事管理系统', score: 100 },
  },
  {
    input: '【2026-1】模式识别基础与前沿-无监督学习工业产品表面缺陷检测方法-97',
    expected: { year: 2026, month: '01', date: '2026-01', course: '模式识别基础与前沿', title: '无监督学习工业产品表面缺陷检测方法', score: 97 },
  },
  {
    input: '【2026-8】飞机三维建模技术与创新实践-CATIA参数化建模、DMU 运动仿真与结构有限元分析',
    expected: { year: 2026, month: '08', date: '2026-08', course: '飞机三维建模技术与创新实践', title: 'CATIA参数化建模、DMU 运动仿真与结构有限元分析', score: null },
  },
];

describe('parseDescription：8 条真实描述', () => {
  for (const { input, expected } of REAL_CASES) {
    it(input, () => {
      expect(parseDescription(input)).toEqual(expected);
    });
  }
});

describe('parseDescription：边界', () => {
  it('标题含连字符时必须 join 回去，不能截断', () => {
    expect(parseDescription('【2024-1】课程-前段-后段-95')).toMatchObject({
      course: '课程',
      title: '前段-后段',
      score: 95,
    });
  });

  it('月份补零：2024-8 排在 2024-10 之前（字符串序）', () => {
    const a = parseDescription('【2024-8】课程-作业');
    const b = parseDescription('【2024-10】课程-作业');
    expect(a.date < b.date).toBe(true);
  });

  it('末段非纯数字不视为分数', () => {
    expect(parseDescription('【2024-1】课程-v2版本').score).toBeNull();
  });

  it('不匹配【YYYY-M】前缀时抛错', () => {
    expect(() => parseDescription('一个没有前缀的描述')).toThrow(/不匹配/);
  });

  it('缺少课程-名称结构时抛错', () => {
    expect(() => parseDescription('【2024-1】只有一段')).toThrow(/课程-名称/);
    expect(() => parseDescription('【2024-1】课程-95')).toThrow(/课程-名称/);
  });

  it('非字符串输入抛错', () => {
    expect(() => parseDescription(null)).toThrow();
  });
});
