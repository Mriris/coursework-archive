import { describe, expect, it } from 'vitest';
import { readmeDirFromPath, rewriteUrl } from '../scripts/rewrite-readme.mjs';

const ctx = (over = {}) => ({
  owner: 'Mriris',
  repo: 'muaCloud',
  branch: 'master',
  readmeDir: '',
  kind: 'image',
  ...over,
});

describe('rewriteUrl（§4.4）', () => {
  it('相对图片重写为 raw 链接，中文文件名逐段编码', () => {
    expect(rewriteUrl('Resource/工作模式.png', ctx())).toBe(
      'https://raw.githubusercontent.com/Mriris/muaCloud/master/Resource/%E5%B7%A5%E4%BD%9C%E6%A8%A1%E5%BC%8F.png',
    );
  });

  it('./ 前缀先剥掉再重写', () => {
    expect(rewriteUrl('./img/shot.png', ctx())).toBe(
      'https://raw.githubusercontent.com/Mriris/muaCloud/master/img/shot.png',
    );
  });

  it('绝对 URL 与协议相对 URL 原样保留', () => {
    expect(rewriteUrl('https://example.com/a.png', ctx())).toBe('https://example.com/a.png');
    expect(rewriteUrl('http://example.com/a.png', ctx())).toBe('http://example.com/a.png');
    expect(rewriteUrl('//cdn.example.com/a.png', ctx())).toBe('//cdn.example.com/a.png');
    expect(rewriteUrl('mailto:a@b.com', ctx({ kind: 'link' }))).toBe('mailto:a@b.com');
  });

  it('页内锚点原样保留', () => {
    expect(rewriteUrl('#安装', ctx({ kind: 'link' }))).toBe('#安装');
  });

  it('相对文档链接重写为 blob 页面而非 raw', () => {
    expect(rewriteUrl('docs/guide.md', ctx({ kind: 'link' }))).toBe(
      'https://github.com/Mriris/muaCloud/blob/master/docs/guide.md',
    );
  });

  it('三种默认分支名均按 ctx 注入（main / master / zero）', () => {
    for (const branch of ['main', 'master', 'zero']) {
      expect(rewriteUrl('a.png', ctx({ branch }))).toBe(
        `https://raw.githubusercontent.com/Mriris/muaCloud/${branch}/a.png`,
      );
    }
  });

  it('README 不在根目录时以其所在目录为基准解析相对路径', () => {
    expect(rewriteUrl('img/a.png', ctx({ readmeDir: 'docs' }))).toBe(
      'https://raw.githubusercontent.com/Mriris/muaCloud/master/docs/img/a.png',
    );
    expect(rewriteUrl('../top.png', ctx({ readmeDir: 'docs' }))).toBe(
      'https://raw.githubusercontent.com/Mriris/muaCloud/master/top.png',
    );
  });

  it('保留查询串与片段后缀', () => {
    expect(rewriteUrl('docs/guide.md#用法', ctx({ kind: 'link' }))).toBe(
      'https://github.com/Mriris/muaCloud/blob/master/docs/guide.md#用法',
    );
  });

  it('空值原样返回', () => {
    expect(rewriteUrl('', ctx())).toBe('');
    expect(rewriteUrl(undefined, ctx())).toBeUndefined();
  });
});

describe('readmeDirFromPath', () => {
  it('根目录 README 返回空串', () => {
    expect(readmeDirFromPath('README.md')).toBe('');
  });
  it('子目录 README 返回其目录', () => {
    expect(readmeDirFromPath('docs/README.md')).toBe('docs');
    expect(readmeDirFromPath('a/b/README.rst')).toBe('a/b');
  });
});
