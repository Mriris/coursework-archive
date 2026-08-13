/**
 * 描述解析（§4.3）。纯函数，无 I/O。
 * 输入形如「【2024-11】东软实习-企业人事管理系统-100」的 GitHub 仓库描述，
 * 输出 { year, month, date, course, title, score }。
 * 解析失败抛错；是否致命由 config-schema.mjs 的合并层决定（§4.2）。
 */
export function parseDescription(description) {
  if (typeof description !== 'string') {
    throw new Error('描述不是字符串');
  }
  const m = description.trim().match(/^【(\d{4})-(\d{1,2})】(.+)$/);
  if (!m) {
    throw new Error(`描述不匹配「【YYYY-M】课程-名称[-分数]」格式：${description}`);
  }
  const year = Number(m[1]);
  const month = String(Number(m[2])).padStart(2, '0');
  const parts = m[3].split('-');
  let score = null;
  if (parts.length >= 2 && /^\d+$/.test(parts.at(-1))) {
    score = Number(parts.pop());
  }
  if (parts.length < 2) {
    throw new Error(`描述缺少「课程-名称」结构：${description}`);
  }
  const course = parts[0];
  const title = parts.slice(1).join('-');
  return { year, month, date: `${year}-${month}`, course, title, score };
}
