import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Runs from Nuxt too: direct `nuxt generate` must produce robots.txt and headers.
export async function finalizeStaticSite(root, production) {
  const hashes = new Set();
  async function walk(dir) {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) await walk(file);
      else if (item.name.endsWith('.html')) {
        const html = await readFile(file, 'utf8');
        for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
          if (!/\bsrc\s*=/.test(match[1]) && !/application\/(ld\+json|json)/.test(match[1]) && match[2]) hashes.add(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`);
        }
      }
    }
  }
  await walk(root);
  const index = await readFile(path.join(root, 'index.html'), 'utf8');
  const robotsMeta = index.match(/<meta\s+name="robots"\s+content="([^"]*)"/i)?.[1];
  if (!robotsMeta || (production ? /noindex/i.test(robotsMeta) : !/noindex/i.test(robotsMeta))) throw new Error('Build environment does not match homepage robots. Refusing to package.');
  const scripts = production ? ' https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com https://www.google-analytics.com https://www.statcounter.com/counter/counter.js https://static.cloudflareinsights.com' : '';
  const connections = production ? ' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://stats.g.doubleclick.net https://cloudflareinsights.com' : '';
  const counter = production ? ' https://statcounter.com https://*.statcounter.com' : '';
  const adsCollection = production ? ' https://ad.doubleclick.net' : '';
  const csp = `default-src 'self'; script-src 'self' ${[...hashes].join(' ')}${scripts}; style-src 'self' 'unsafe-inline'; img-src 'self' data:${connections}${counter}; font-src 'self' data:; connect-src 'self'${connections}${adsCollection}${counter}; frame-src https://www.google.com https://maps.google.com https://www.googletagmanager.com https://td.doubleclick.net${production ? ' https://partitioned.statcounter.com' : ''}; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests`;
  // Legacy mail/panel subdomains have not had their TLS audited: do not force HSTS there.
  await writeFile(path.join(root, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Strict-Transport-Security: max-age=63072000\n  Cross-Origin-Opener-Policy: same-origin-allow-popups\n  Content-Security-Policy: ${csp}\n${production ? '' : '  X-Robots-Tag: noindex, nofollow\n'}\n/_nuxt/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
  await writeFile(path.join(root, 'robots.txt'), production ? 'User-agent: *\nDisallow: /search/\nDisallow: /?s=\nSitemap: https://homeperfectionnow.com/sitemap_index.xml\n' : 'User-agent: *\nDisallow: /\n');
  await writeFile(path.join(root, 'build-info.json'), JSON.stringify({ environment: production ? 'production' : 'preview', generated: new Date().toISOString() }, null, 2));
}
