import { describe, expect, it } from 'vitest';
import { hueForLanguage, pickPrimaryLanguage } from '../scripts/pick-language.mjs';

describe('pickPrimaryLanguage（§5.2）', () => {
  it('summer-camp-system：CSS 字节最多但必须选 Vue', () => {
    expect(
      pickPrimaryLanguage({ CSS: 294000, Vue: 130000, JavaScript: 24000, HTML: 9000 }),
    ).toBe('Vue');
  });

  it('PA-UIENet：HTML 干扰项不影响 Jupyter Notebook', () => {
    expect(
      pickPrimaryLanguage({ 'Jupyter Notebook': 861000, HTML: 122000, Python: 96000 }),
    ).toBe('Jupyter Notebook');
  });

  it('全为样式/标记语言时回退到字节数最大者', () => {
    expect(pickPrimaryLanguage({ HTML: 5000, CSS: 9000 })).toBe('CSS');
  });

  it('空对象与空输入返回未知', () => {
    expect(pickPrimaryLanguage({})).toBe('未知');
    expect(pickPrimaryLanguage(null)).toBe('未知');
    expect(pickPrimaryLanguage(undefined)).toBe('未知');
  });

  it('常规仓库取字节数最大语言', () => {
    expect(pickPrimaryLanguage({ 'C++': 120000, Python: 30000 })).toBe('C++');
  });
});

describe('hueForLanguage（§5.2 色相表）', () => {
  it('表内语言返回约定色相角', () => {
    expect(hueForLanguage('Vue')).toBe(155);
    expect(hueForLanguage('C++')).toBe(285);
    expect(hueForLanguage('Kotlin')).toBe(70);
    expect(hueForLanguage('VBScript')).toBe(330);
  });

  it('未命中返回 null（渲染层回退中性灰）', () => {
    expect(hueForLanguage('COBOL')).toBeNull();
    expect(hueForLanguage('未知')).toBeNull();
  });
});
