import { readFile, writeFile, mkdir, readdir, access, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { PurgeCSS } from 'purgecss';
import postcss from 'postcss';
import cssnano from 'cssnano';

const root = path.resolve(import.meta.dirname, '..');
const digest = text => createHash('sha256').update(text).digest('hex').slice(0, 16);
async function vueSources(dir) {
  const results = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...await vueSources(file));
    else if (entry.name.endsWith('.vue')) results.push({ raw: await readFile(file, 'utf8'), extension: 'vue' });
  }
  return results;
}

export async function prepareStyles() {
  const pages = JSON.parse(await readFile(path.join(root, 'content/manifest.json'), 'utf8'));
  const vue = await vueSources(path.join(root, 'app'));
  const output = {}; const report = [];
  await mkdir(path.join(root, 'public/assets/css'), { recursive: true });
  for (const page of pages) {
    const data = JSON.parse(await readFile(path.join(root, `content/pages/${page.id}.json`), 'utf8'));
    const html = await readFile(path.join(root, `content/pages/${page.id}.html`), 'utf8');
    const source = (await Promise.all(data.css.map(file => readFile(path.join(root, 'public', file), 'utf8')))).join('\n');
    // Elementor's lazy-background gate is released by its WordPress JS, which is
    // intentionally absent here. Static pages must display their backgrounds immediately.
    const staticCss = postcss.parse(source);
    staticCss.walkRules(rule => {
      if (!rule.selector.includes(':not(.e-lazyloaded)') || !rule.selector.includes('.e-con.e-parent')) return;
      rule.walkDecls('background-image', declaration => {
        if (declaration.value === 'none') declaration.remove();
      });
      if (!rule.nodes.length) rule.remove();
    });
    const content = [...vue, { raw: `<html lang="ar" dir="rtl"><body class="${data.bodyClass}">${html}</body></html>`, extension: 'html' }];
    const signature = digest('safe-purge-v2-static-backgrounds' + staticCss.toString() + content.map(v => v.raw).join(''));
    const href = `/assets/css/page-${page.id}-${signature}.css`;
    const target = path.join(root, 'public', href);
    let cached = true;
    try { await access(target); } catch { cached = false; }
    if (!cached) {
      const result = await new PurgeCSS().purge({
        content, css: [{ raw: staticCss.toString() }],
        fontFace: false, keyframes: false, variables: false,
        safelist: { standard: ['open', 'active', 'is-open', 'is-scrolled', 'elementor-active', 'e-active'], greedy: [/^hp-/, /\[open\]/, /aria-expanded/, /aria-current/] },
      });
      const minified = await postcss([cssnano({ preset: ['default', { normalizeUrl: false }] })]).process(result[0].css, { from: undefined });
      await writeFile(target, minified.css);
    }
    const bytes = (await readFile(target)).length;
    output[page.id] = href;
    report.push({ path: page.path, beforeRequests: data.css.length, afterRequests: 1, beforeBytes: Buffer.byteLength(source), afterBytes: bytes });
  }
  const activeFiles = new Set(Object.values(output).map(href => path.basename(href)));
  for (const name of await readdir(path.join(root, 'public/assets/css'))) {
    if (/^page-\d+-[a-f0-9]{16}\.css$/.test(name) && !activeFiles.has(name)) {
      await unlink(path.join(root, 'public/assets/css', name));
    }
  }
  await writeFile(path.join(root, 'content/styles-manifest.json'), JSON.stringify(output, null, 2));
  await writeFile(path.join(root, 'migration/css-optimization.json'), JSON.stringify({ date: new Date().toISOString(), pages: report }, null, 2));
}
