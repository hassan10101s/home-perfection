import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { load } from 'cheerio';

const hash = bytes => createHash('sha256').update(bytes).digest('hex').slice(0, 16);
const manifest = JSON.parse(await readFile('content/manifest.json', 'utf8'));
const records = {}; const originals = new Map();
let previous = {};
try { previous = JSON.parse(await readFile('migration/image-optimization.json', 'utf8')).files || {}; } catch {}
await mkdir('public/assets/images', { recursive: true });
await mkdir('.data/original-images', { recursive: true });
const directory = 'public/wp-content/uploads/2026/01';
for (const name of await readdir(directory)) {
  if (!name.endsWith('.webp')) continue;
  const file = path.join(directory, name); const href = '/'+file.replaceAll('\\', '/').replace(/^public\//, '');
  const bytes = await readFile(file); const digest = hash(bytes);
  const metadata = await sharp(bytes).metadata();
  if ((metadata.width || 0) < 250) continue;
  originals.set(href, bytes);
  if (previous[href]?.afterHash === digest) { records[href] = previous[href]; continue; }
  const quality = /HOME-perfection/i.test(name) ? 88 : 84;
  const candidate = await sharp(bytes).rotate().webp({ quality, effort: 6, smartSubsample: true }).toBuffer();
  const optimized = candidate.length < bytes.length * .95 ? candidate : bytes;
  if (optimized !== bytes) {
    await writeFile(path.join('.data/original-images', name), bytes);
    await writeFile(file, optimized);
  }
  records[href] = { beforeBytes: bytes.length, afterBytes: optimized.length, beforeHash: digest, afterHash: hash(optimized), width: metadata.width, height: metadata.height };
}
function localHref(url) {
  try { const u = new URL(url, 'https://homeperfectionnow.com'); return u.hostname === 'homeperfectionnow.com' ? decodeURIComponent(u.pathname) : null; } catch { return null; }
}
function parseSet(srcset) {
  return (srcset || '').split(',').map(item => { const [url, width] = item.trim().split(/\s+/); return { url: localHref(url), width: Number.parseInt(width) }; }).filter(item => item.url && item.width);
}
async function variants(srcset) {
  const items = parseSet(srcset);
  const largest = [...items].sort((a,b) => b.width-a.width).find(item => originals.has(item.url));
  if (!largest) return srcset;
  const source = originals.get(largest.url); const stable = records[largest.url].beforeHash;
  for (const width of [480,640]) {
    if (width >= largest.width || items.some(item => item.width === width)) continue;
    const url = `/assets/images/${stable}-${width}.webp`;
    try { await access('public'+url); } catch {
      await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: /HOME-perfection/i.test(largest.url) ? 88 : 84, effort: 6, smartSubsample: true }).toFile('public'+url);
    }
    items.push({ url, width });
  }
  return items.sort((a,b) => a.width-b.width).map(item => `${item.url} ${item.width}w`).join(', ');
}
for (const page of manifest) {
  const file = `content/pages/${page.id}.html`;
  const $ = load(await readFile(file, 'utf8'), null, false);
  for (const element of $('img').toArray()) {
    const img = $(element); const srcset = img.attr('srcset');
    if (srcset) img.attr('srcset', await variants(srcset));
    if (!img.attr('sizes') && img.attr('data-sizes')) img.attr('sizes', img.attr('data-sizes'));
    if (page.path === '/' && img.closest('.elementor-element-e134128').length) img.attr('sizes', '(max-width: 767px) calc(100vw - 40px), (max-width: 1200px) calc((100vw - 88px) / 3), 365px');
    if (page.path === '/' && img.closest('.elementor-element-879bc44').length) img.attr('sizes', '(max-width: 767px) calc(100vw - 40px), (max-width: 1600px) calc((100vw - 80px) / 3), 505px');
    img.removeAttr('data-sizes');
  }
  await writeFile(file, $.html());
}
const hero = JSON.parse(await readFile('content/home-hero.json', 'utf8'));
hero.image.srcset = await variants(hero.image.srcset);
await writeFile('content/home-hero.json', JSON.stringify(hero, null, 2));
const values = Object.values(records);
const report = { date: new Date().toISOString(), beforeBytes: values.reduce((n,v) => n+v.beforeBytes,0), afterBytes: values.reduce((n,v) => n+v.afterBytes,0), files: records };
await writeFile('migration/image-optimization.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ images: values.length, beforeBytes: report.beforeBytes, afterBytes: report.afterBytes, savedBytes: report.beforeBytes-report.afterBytes }));
