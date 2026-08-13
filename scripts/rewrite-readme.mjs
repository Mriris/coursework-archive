/**
 * README 链接重写（§4.4）。纯函数，无 I/O。
 * 站点域名下 README 的相对路径全部失效，需要重写：
 *   相对图片   → raw.githubusercontent.com/{owner}/{repo}/{branch}/…（逐段 encodeURIComponent）
 *   相对文档   → github.com/{owner}/{repo}/blob/{branch}/…
 *   绝对 URL / 协议相对 / 页内锚点 → 原样保留
 * {branch} 必须逐仓库取自 API 的 default_branch（main / master / zero 并存）。
 */
const ABSOLUTE_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** README 所在目录（相对路径的解析基准）：'README.md' → ''，'docs/README.md' → 'docs' */
export function readmeDirFromPath(readmePath) {
  const idx = (readmePath ?? '').lastIndexOf('/');
  return idx === -1 ? '' : readmePath.slice(0, idx);
}

function splitSuffix(url) {
  const m = url.match(/^([^?#]*)([?#][\s\S]*)?$/);
  return [m[1], m[2] ?? ''];
}

function resolveSegments(readmeDir, rel) {
  const segments = [];
  for (const seg of `${readmeDir}/${rel}`.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      segments.pop();
      continue;
    }
    segments.push(seg);
  }
  return segments;
}

/**
 * @param {string} url 原始 src/href
 * @param {{owner:string, repo:string, branch:string, readmeDir?:string, kind:'image'|'link'}} ctx
 */
export function rewriteUrl(url, ctx) {
  const { owner, repo, branch, readmeDir = '', kind } = ctx;
  if (!url) return url;
  const trimmed = url.trim();
  if (trimmed.startsWith('#')) return url;
  if (ABSOLUTE_RE.test(trimmed)) return url;
  const [pathPart, suffix] = splitSuffix(trimmed);
  if (!pathPart) return url;
  const rel = pathPart.replace(/^\.\//, '');
  const encoded = resolveSegments(readmeDir, rel).map(encodeURIComponent).join('/');
  if (kind === 'image') {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encoded}${suffix}`;
  }
  return `https://github.com/${owner}/${repo}/blob/${branch}/${encoded}${suffix}`;
}
