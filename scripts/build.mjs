import { spawnSync } from 'node:child_process';
import { readdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const production=process.argv.includes('--production');
if(!process.argv.includes('--finalize-only')){
  const result=spawnSync(process.execPath,['node_modules/nuxt/bin/nuxt.mjs','generate'],{stdio:'inherit',env:{...process.env,SITE_ENV:production?'production':'preview',NUXT_TELEMETRY_DISABLED:'1'}});
  if(result.status!==0)process.exit(result.status||1);
}
const root='.output/public'; const hashes=new Set();
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())await walk(file);else if(item.name.endsWith('.html')){const html=await readFile(file,'utf8');for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(!/\bsrc\s*=/.test(match[1])&&!/application\/(ld\+json|json)/.test(match[1])&&match[2])hashes.add(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`);}}}}
await walk(root);
const googleScripts=production?' https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com https://www.google-analytics.com':'';
const googleConnections=production?' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://stats.g.doubleclick.net':'';
const csp=`default-src 'self'; script-src 'self' ${[...hashes].join(' ')}${googleScripts}; style-src 'self' 'unsafe-inline'; img-src 'self' data:${googleConnections}; font-src 'self' data:; connect-src 'self'${googleConnections}; frame-src https://www.google.com https://maps.google.com https://www.googletagmanager.com https://td.doubleclick.net; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests`;
await writeFile(`${root}/_headers`,`/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Strict-Transport-Security: max-age=31536000\n  Content-Security-Policy: ${csp}\n${production?'':'  X-Robots-Tag: noindex, nofollow\n'}\n/_nuxt/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
await writeFile(`${root}/robots.txt`,production?'User-agent: *\nDisallow: /search/\nDisallow: /?s=\nSitemap: https://homeperfectionnow.com/sitemap_index.xml\n':'User-agent: *\nDisallow: /\n');
await writeFile(`${root}/build-info.json`,JSON.stringify({environment:production?'production':'preview',generated:new Date().toISOString()},null,2));
console.log(`Static ${production?'PRODUCTION':'PREVIEW (noindex)'} files: ${path.resolve(root)}`);
