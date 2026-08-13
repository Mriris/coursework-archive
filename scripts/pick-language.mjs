/**
 * 主语言选取（§5.2）。纯函数，无 I/O。
 * GitHub 按字节数计的主语言会被样式/标记文件带偏（summer-camp-system 实测 CSS > Vue），
 * 因此取字节数最大的非样式/标记类语言；排除后为空则回退到字节数最大者；无数据返回「未知」。
 */
const STYLE_MARKUP = new Set(['CSS', 'HTML', 'SCSS', 'Less', 'Stylus']);

export function pickPrimaryLanguage(languages) {
  const entries = Object.entries(languages ?? {});
  if (entries.length === 0) return '未知';
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const nonStyle = sorted.filter(([name]) => !STYLE_MARKUP.has(name));
  return (nonStyle[0] ?? sorted[0])[0];
}

/** 语言 → OKLCH 色相角（§5.2 表）。未命中返回 null，渲染层回退中性灰（C = 0）。 */
const LANGUAGE_HUES = {
  'C++': 285,
  'ASP.NET': 265,
  'C#': 265,
  Kotlin: 70,
  'Jupyter Notebook': 210,
  Python: 210,
  Vue: 155,
  VBScript: 330,
  TypeScript: 210,
  JavaScript: 70,
  Java: 265,
};

export function hueForLanguage(name) {
  return LANGUAGE_HUES[name] ?? null;
}
