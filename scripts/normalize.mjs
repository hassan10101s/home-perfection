import { readFile, writeFile, unlink } from 'node:fs/promises';
import { load } from 'cheerio';
const baseline=JSON.parse(await readFile('migration/baseline.json','utf8'));
const manifest=[];
for(const item of baseline.pages){
  if(item.path!=='/'&&!item.path.endsWith('/')){
    await unlink(`app/pages/page-${item.id}.vue`).catch(()=>{});
    await unlink(`content/pages/${item.id}.json`).catch(()=>{});
    continue;
  }
  const file=`content/pages/${item.id}.json`;const page=JSON.parse(await readFile(file,'utf8'));
  if(page.html){const {html,...meta}=page;await writeFile(file,JSON.stringify(meta,null,2));await writeFile(`content/pages/${item.id}.html`,html.replace(/></g,'>\n<'));}
  await writeFile(`app/pages/${item.path==='/'?'index':`page-${item.id}`}.vue`,`<script setup lang="ts">\nimport content from '../../content/pages/${item.id}.json'\nimport html from '../../content/pages/${item.id}.html?raw'\ndefinePageMeta({ path: ${JSON.stringify(encodeURI(item.path))} })\n</script>\n<template><ContentPage :page="{ ...content, html }" /></template>\n`);
  manifest.push({id:item.id,path:item.path,title:item.title,canonical:item.canonical});
}
await writeFile('content/manifest.json',JSON.stringify(manifest,null,2));
const xml=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${manifest.map(p=>`<url><loc>${p.canonical.replaceAll('&','&amp;')}</loc></url>`).join('')}</urlset>`;
await writeFile('public/sitemap.xml',xml);
// Existing broken service links have no published content. Point them to relevant existing services.
for(const p of manifest){const file=`content/pages/${p.id}.html`;let html=await readFile(file,'utf8');html=html.replaceAll('href="/company-services/"','href="/moving-furniture-riyadh/"').replaceAll('href="/نقل-عفش-الرس/"','href="/شركة-نقل-عفش-بالقصيم/"');await writeFile(file,html);}
await writeFile('public/_redirects','/company-services/ /moving-furniture-riyadh/ 301\n/نقل-عفش-الرس/ /شركة-نقل-عفش-بالقصيم/ 301\n/page-sitemap.xml /sitemap.xml 301\n/post-sitemap.xml /sitemap.xml 301\n');
const source=load(await readFile('migration/raw/home.html','utf8'));
await writeFile('migration/tracking-inventory.json',JSON.stringify({scripts:source('script[src],script[data-src]').map((_,e)=>source(e).attr('src')||source(e).attr('data-src')).get().filter(s=>/google|gtag|analytics|facebook|clarity/i.test(s)),note:'External tracking was inventoried but is not executed in the preview. Reconnect reviewed tracking on production.'},null,2));
console.log(`Normalized ${manifest.length} unique published routes.`);
