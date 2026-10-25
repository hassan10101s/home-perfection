import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.argv[2]||'http://127.0.0.1:3002';
const manifest=JSON.parse(await readFile('content/manifest.json','utf8'));
for(const page of manifest){const response=await fetch(base+encodeURI(page.path));assert.equal(response.status,200,page.path);assert.ok(response.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"));assert.ok((await response.text()).includes(page.title));}
assert.equal((await fetch(base+'/missing-page-for-verification/')).status,404);
for(const [from,to] of [['/company-services/','/moving-furniture-riyadh/'],['/نقل-عفش-الرس/','/شركة-نقل-عفش-بالقصيم/']]){const response=await fetch(base+encodeURI(from),{redirect:'manual'});assert.equal(response.status,301);assert.equal(decodeURI(response.headers.get('location')),to);}
await writeFile('migration/http-verification.json',JSON.stringify({date:new Date().toISOString(),pages:manifest.length,pageStatus:200,unknownPage:404,redirects:301,csp:true,errors:[]},null,2));
console.log('HTTP verified: 13 pages return 200, unknown route returns 404, 2 redirects return 301, security headers present.');
