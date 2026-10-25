import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const secretPattern=/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|sk-(?:proj-)?[A-Za-z0-9_-]{32,}/;
let scanned=0;
for(const file of files){if(!/\.(?:vue|ts|mjs|json|html|md|css|txt)$/.test(file)||file==='scripts/security-check.mjs')continue;assert.ok(!secretPattern.test(await readFile(file,'utf8')),`Possible secret in ${file}`);scanned++;}
const pages=JSON.parse(await readFile('content/manifest.json','utf8'));
for(const page of pages){const $=load(await readFile(`content/pages/${page.id}.html`,'utf8'));assert.equal($('script').length,0);$(' *').each((_,el)=>{for(const [key,value] of Object.entries(el.attribs||{})){assert.ok(!/^on/i.test(key),`Inline event in ${page.path}`);if(['src','href','action','xlink:href'].includes(key))assert.ok(!/^(?:javascript|vbscript|data:text\/html):/i.test(value.replace(/[\u0000-\u0020]/g,'')),`Unsafe URL in ${page.path}`);}});}
const headers=await readFile('.output/public/_headers','utf8');
for(const rule of ["object-src 'none'","frame-ancestors 'none'","base-uri 'self'","form-action 'none'",'X-Content-Type-Options: nosniff','Strict-Transport-Security: max-age=31536000'])assert.ok(headers.includes(rule),`Missing ${rule}`);
assert.ok(!headers.includes("'unsafe-eval'"));
assert.ok(!headers.match(/script-src[^;]*'unsafe-inline'/));
const $=load(await readFile('.output/public/index.html','utf8'));
const whatsapp=$('a.hp-whatsapp');assert.equal(whatsapp.attr('href'),'https://wa.me/966565964755');assert.ok(whatsapp.attr('rel').includes('noopener'));assert.ok(whatsapp.attr('rel').includes('noreferrer'));
const report={date:new Date().toISOString(),scannedTextFiles:scanned,publicPages:pages.length,knownSecretPatternsFound:0,legacyScripts:0,inlineEventHandlers:0,securityHeaders:true,whatsappSafeExternalLink:true,errors:[],limitations:['This is a static review and configuration check, not a penetration test or a guarantee of complete security.','Build-tool dependency warning involving node-forge remains documented in README; build tools are not deployed.','Cloudflare account, DNS, TLS configuration and private Google Tag Manager container need review at deployment.']};
await writeFile('migration/security-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
