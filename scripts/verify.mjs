import { readFile, access, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
const manifest=JSON.parse(await readFile('content/manifest.json','utf8'));
const baseline=JSON.parse(await readFile('migration/baseline.json','utf8'));
const company=JSON.parse(await readFile('content/company.json','utf8'));
const site=JSON.parse(await readFile('content/site.json','utf8'));
const root='.output/public';let images=0,links=0;const errors=[];
const redirects=new Map([['/company-services/','/moving-furniture-riyadh/'],['/نقل-عفش-الرس/','/شركة-نقل-عفش-بالقصيم/']]);
const normalize=p=>decodeURI(p).replace(/\/$/,'')||'/';const paths=new Set(manifest.map(p=>normalize(p.path)));
for(const item of manifest){
 try{
  const html=await readFile(path.join(root,item.path,'index.html'),'utf8');const $=load(html);const meta=JSON.parse(await readFile(`content/pages/${item.id}.json`,'utf8'));
  const mode=JSON.parse(await readFile(`${root}/build-info.json`,'utf8')).environment;
  if(mode==='production')assert.equal($('meta[name=robots]').attr('content'),meta.meta.find(m=>m.name==='robots')?.content||'index, follow','robots differs from the original production directive');
  assert.equal($('title').text(),meta.title,'title changed');assert.equal($('link[rel=canonical]').attr('href'),meta.canonical,'canonical changed');
  for(const m of meta.meta.filter(m=>m.name==='description'||m.property?.startsWith('og:')))assert.equal($(`meta[${m.name?'name':'property'}="${m.name||m.property}"]`).attr('content'),m.content,`metadata changed: ${m.name||m.property}`);
  const renderedNodes=$('script[type="application/ld+json"]').toArray().flatMap(el=>{const doc=JSON.parse($(el).text());return doc['@graph']||[doc]});
  const entityId=company.url+'#organization';
  const entities=renderedNodes.filter(node=>node['@id']===entityId);
  assert.equal(entities.length,1,'company identity duplicated or missing');assert.equal(entities[0].telephone,company.telephone);assert.equal(entities[0].name,company.name);
  assert.deepEqual(renderedNodes.filter(node=>node['@id']!==entityId),meta.schema.flatMap(doc=>doc['@graph']||[doc]).filter(node=>node['@id']!==entityId),'non-company schema changed');
  const legacyCompany=meta.schema.flatMap(doc=>doc['@graph']||[doc]).find(node=>node['@id']===entityId&&[node['@type']].flat().includes('MovingCompany'));
  for(const field of ['address','geo','openingHoursSpecification','makesOffer','aggregateRating','priceRange'])if(legacyCompany?.[field])assert.deepEqual(entities[0][field],legacyCompany[field],`legacy company field changed: ${field}`);
  assert.ok($('link[rel=stylesheet]').length<=2,'too many render-blocking stylesheets');
  for(const link of $('link[rel=stylesheet]').toArray()){
    const href=$(link).attr('href');
    if(href?.startsWith('/assets/css/'))assert.ok(!(await readFile(path.join(root,href),'utf8')).includes(':not(.e-lazyloaded)'),'obsolete Elementor background gate remains');
  }
  if(item.id==='382'){assert.equal($('.hp-quote-intro').length,1);assert.equal($('.elementor-382,.wpcf7').length,0,'empty WordPress form layout remains');}
  const original=load(await readFile(`content/pages/${item.id}.html`,'utf8'));
  const text=s=>s.replace(/\s+/g,' ').trim();assert.ok(text($('#main-content').text()).includes(text(original('body').text())),'page text missing');
  assert.equal($('#main-content h1').length,item.path==='/'?1:original('h1').length,'H1 changed');
  assert.deepEqual($('#main-content h1, #main-content h2, #main-content h3').filter((_,e)=>!$(e).closest('.hp-quote').length).map((_,e)=>$(e).text().replace(/\s+/g,'')).get(),baseline.pages.find(p=>p.id===item.id).headings.map(s=>s.replace(/\s+/g,'')),'original headings changed');
  assert.equal($('#main-content script').length,0,'legacy scripts remain');assert.equal($('[onclick],[onerror],[onload]').length,0,'inline event handlers remain');
  const tasks=[];
  $('img[src],source[src],source[srcset],video[src],link[rel=stylesheet],link[rel=icon],link[rel=apple-touch-icon]').each((_,el)=>{const n=$(el);const urls=n.attr('srcset')?n.attr('srcset').split(',').map(s=>s.trim().split(/\s+/)[0]):[n.attr('src')||n.attr('href')];for(const u of urls){if(u?.startsWith('/')){images++;tasks.push(access(path.join(root,decodeURI(u.split('?')[0]))).catch(()=>errors.push(`${item.path}: missing asset ${u}`)))}}});
  $('a[href]').each((_,el)=>{const href=$(el).attr('href');if(href.startsWith('/')&&!href.startsWith('//')){const u=new URL(href,'https://homeperfectionnow.com');if(!u.search&&!/\.[a-z0-9]+$/i.test(u.pathname)){links++;if(!paths.has(normalize(u.pathname))&&!redirects.has(decodeURI(u.pathname)))errors.push(`${item.path}: broken link ${href}`)}}});
  await Promise.all(tasks);
 }catch(e){errors.push(`${item.path}: ${e.message}`)}
}
await access(`${root}/404.html`).catch(()=>errors.push('404.html missing'));
let cssReferences=0;
for(const file of await readdir(root,{recursive:true})){
 if(!file.endsWith('.css'))continue;
 const css=await readFile(path.join(root,file),'utf8');
 for(const match of css.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)){
  if(!match[1].startsWith('/')||match[1].startsWith('//'))continue;
  cssReferences++;const asset=decodeURI(match[1].split(/[?#]/)[0]);
  await access(path.join(root,asset)).catch(()=>errors.push(`CSS ${file}: missing ${asset}`));
 }
}
const buildInfo=JSON.parse(await readFile(`${root}/build-info.json`,'utf8'));
const rootHtml=load(await readFile(`${root}/index.html`,'utf8'));
const companyFile=JSON.parse(await readFile(`${root}/company.json`,'utf8'));assert.equal(companyFile.telephone,company.telephone);assert.equal(companyFile.url,company.url);
assert.ok((await readFile(`${root}/llms.txt`,'utf8')).includes(company.telephone));
const worker=JSON.parse(await readFile('wrangler.jsonc','utf8'));assert.ok(!worker.main,'static site must not have a Worker JavaScript entry');assert.equal(worker.assets.directory,'./.output/public');
const clientFiles=await readdir(`${root}/_nuxt`,{recursive:true});
const clientCode=(await Promise.all(clientFiles.filter(file=>file.endsWith('.js')).map(file=>readFile(path.join(root,'_nuxt',file),'utf8')))).join('\n');
assert.ok(clientCode.includes(site.googleTagManager),'built client does not match the configured GTM container');
assert.equal(JSON.parse(await readFile('.output/nitro.json','utf8')).preset,'static','build must use the static preset');
assert.equal(await access('.output/server/index.mjs').then(()=>true,()=>false),false,'server entry must not be generated');
if(buildInfo.environment==='production')assert.ok(!/noindex/.test(rootHtml('meta[name=robots]').attr('content')||''),'production is noindex');
const headers=await readFile(`${root}/_headers`,'utf8');assert.ok(headers.includes("object-src 'none'")&&headers.includes("frame-ancestors 'none'"));
const report={date:new Date().toISOString(),environment:buildInfo.environment,pages:manifest.length,assetReferences:images,cssReferences,internalLinks:links,errors,sourceBrokenLinks:baseline.failures,notes:['Tracking is restricted to the production build on homeperfectionnow.com.','Source Elementor content is retained as separate HTML files; the app shell and quote form are Vue components.']};
await writeFile('migration/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
