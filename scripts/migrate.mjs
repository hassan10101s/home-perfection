import { load } from 'cheerio';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const origin = 'https://homeperfectionnow.com';
const pending = new Map(); const failures = []; const downloaded = new Set();
await Promise.all(['public','content/pages','app/pages','migration/raw'].map(p=>mkdir(p,{recursive:true})));
async function fetchRetry(url) {
  for (let attempt=0;attempt<3;attempt++) {
    try { const r=await fetch(url,{signal:AbortSignal.timeout(45000)}); if(!r.ok) throw Error(`HTTP ${r.status}`); return r; }
    catch(e) { if(attempt===2) throw e; }
  }
}
function localAsset(raw, base=origin) {
  if(!raw || /^(data:|#|blob:)/i.test(raw)) return raw;
  let u; try {u=new URL(raw,base)} catch {return raw}
  if(!/^https?:$/.test(u.protocol)) return raw;
  const file = u.hostname === new URL(origin).hostname
    ? decodeURIComponent(u.pathname)
    : `/assets/external/${createHash('sha256').update(u.href).digest('hex').slice(0,16)}${path.extname(u.pathname)|| (u.hostname.includes('googleapis')?'.css':'.bin')}`;
  if(!file.startsWith('/wp-content/') && !file.startsWith('/wp-includes/') && !file.startsWith('/assets/')) return raw;
  if(!pending.has(file)) pending.set(file,u.href);
  return file;
}
function cssAssets(css,base) {
  return css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi,(whole,q,url)=>`url("${localAsset(url,base)}")`)
    .replace(/@import\s+(['"])(.*?)\1/gi,(whole,q,url)=>`@import "${localAsset(url,base)}"`);
}
function clean($,root) {
  root.find('script, noscript, .grecaptcha-badge, #comments, .comments-area, .ast-scroll-top-icon').remove();
  root.find('*').addBack().each((_,el)=>{
    for(const attr of Object.keys(el.attribs||{})) if(/^on/i.test(attr)) $(el).removeAttr(attr);
    for(const attr of ['href','src','action','xlink:href']) if(/^\s*(javascript:|vbscript:|data:text\/html)/i.test($(el).attr(attr)||'')) $(el).removeAttr(attr);
  });
  root.find('img,source,iframe').each((_,el)=>{
    const n=$(el); const lazy=n.attr('data-src')||n.attr('data-litespeed-src'); if(lazy)n.attr('src',lazy);
    const set=n.attr('data-srcset')||n.attr('srcset');
    if(set)n.attr('srcset',set.split(',').map(x=>{const [url,...descriptor]=x.trim().split(/\s+/);return [localAsset(url),...descriptor].join(' ')}).join(', '));
    if(n.attr('src') && el.name!=='iframe')n.attr('src',localAsset(n.attr('src')));
    n.removeAttr('data-src data-srcset data-lazyloaded data-litespeed-src');
    if(el.name==='img'){n.attr('decoding','async'); if(!n.attr('alt'))n.attr('alt','');}
    if(el.name==='iframe'){n.attr('loading','lazy');n.attr('referrerpolicy','strict-origin-when-cross-origin');}
  });
  root.find('[style]').each((_,el)=>$(el).attr('style',cssAssets($(el).attr('style'),origin)));
  root.find('a[href]').each((_,el)=>{const n=$(el);try {const u=new URL(n.attr('href'),origin);if(u.origin===origin && !u.search)n.attr('href',decodeURI(u.pathname)+u.hash);if(n.attr('target')==='_blank')n.attr('rel','noopener noreferrer')}catch{}});
  root.find('form').remove();
}
const sourcePages=JSON.parse(await readFile('migration/raw/pages.json','utf8'));
const sourcePosts=JSON.parse(await readFile('migration/raw/posts.json','utf8'));
const entries=[...sourcePages,...sourcePosts];
// Fetch every published page, following WordPress pagination when needed.
for(const type of ['pages','posts']){
  const first=await fetchRetry(`${origin}/wp-json/wp/v2/${type}?per_page=100`);
  const total=Number(first.headers.get('x-wp-totalpages')||1);
  for(let page=2;page<=total;page++) entries.push(...await (await fetchRetry(`${origin}/wp-json/wp/v2/${type}?per_page=100&page=${page}`)).json());
}
const queue=[...new Set(entries.map(e=>e.link))];
for(const sitemap of ['page-sitemap.xml','post-sitemap.xml']) {
  try {const xml=load(await(await fetchRetry(`${origin}/${sitemap}`)).text(),{xml:true});xml('url > loc').each((_,el)=>{const url=xml(el).text();if(!queue.includes(url))queue.push(url)});}catch(e){failures.push({url:sitemap,error:String(e)})}
}
const pages=[];
for(let i=0;i<queue.length;i++){
  const url=queue[i];const pathname=decodeURI(new URL(url).pathname);
  let html;
  try {html=pathname==='/'?await readFile('migration/raw/home.html','utf8'):await(await fetchRetry(url)).text();}
  catch(e){failures.push({url,error:String(e)});continue}
  const $=load(html);const main=$('#content').first().length?$('#content').first():$('main').first();
  if(!main.length){failures.push({url,error:'Missing main content'});continue}
  await writeFile(`migration/raw/page-${i}.html`,html);
  // Discover linked public content beyond the menus and sitemaps, excluding WP endpoints.
  $('a[href]').each((_,el)=>{try{const u=new URL($(el).attr('href'),url);if(u.origin===origin&&!u.search&&!/\.(jpg|png|webp|pdf|xml|zip)$/i.test(u.pathname)&&!/^\/(wp-|feed|author|category|tag)/.test(u.pathname)){u.hash='';if(!queue.some(x=>decodeURI(new URL(x).pathname)===decodeURI(u.pathname)))queue.push(u.href)}}catch{}});
  const css=[];$('link[rel=stylesheet],link[as=style]').each((_,el)=>{const href=$(el).attr('href')||$(el).attr('data-href');if(href)css.push(localAsset(href,url))});
  const styles=$('style').map((_,el)=>cssAssets($(el).html()||'',url)).get();
  const meta=$('head meta').map((_,el)=>{const n=$(el);return {name:n.attr('name'),property:n.attr('property'),content:n.attr('content')}}).get().filter(m=>m.content&&(m.name||m.property)&&!['viewport','generator'].includes(m.name));
  for(const m of meta) if(m.property==='og:image'||m.name==='twitter:image')localAsset(m.content);
  const schema=$('script[type="application/ld+json"]').map((_,el)=>{try{return JSON.parse($(el).text())}catch{return null}}).get().filter(Boolean);
  const originalText=main.text().replace(/\s+/g,' ').trim();
  clean($,main);
  const isQuote=pathname.includes('حساب-تكلفة');
  const header=$('#masthead').first();const footer=$('footer#colophon').first(); clean($,header);clean($,footer);
  if(pathname==='/'){
    await writeFile('content/chrome.json',JSON.stringify({header:$.html(header),footer:$.html(footer)},null,2));
  }
  const id=String(entries.find(e=>decodeURI(new URL(e.link).pathname)===pathname)?.id||`extra-${i}`);
  const content={id,path:pathname,title:$('title').text(),canonical:$('link[rel=canonical]').attr('href')||url,bodyClass:$('body').attr('class')||'',css:[...new Set(css)],styles,meta,schema,html:$.html(main),isQuote,modified:entries.find(e=>String(e.id)===id)?.modified_gmt};
  const {html: contentHtml, ...metadata}=content;
  await writeFile(`content/pages/${id}.json`,JSON.stringify(metadata,null,2));
  await writeFile(`content/pages/${id}.html`,contentHtml.replace(/></g,'>\n<'));
  await writeFile(`app/pages/${pathname==='/'?'index':`page-${id}`}.vue`, `<script setup lang="ts">\nimport content from '../../content/pages/${id}.json'\nimport html from '../../content/pages/${id}.html?raw'\ndefinePageMeta({ path: ${JSON.stringify(encodeURI(pathname))} })\n</script>\n<template><ContentPage :page="{ ...content, html }" /></template>\n`);
  pages.push({id,path:pathname,title:content.title,canonical:content.canonical,originalText,headings:main.find('h1,h2,h3').map((_,e)=>$(e).text().trim()).get()});
  console.log(`Page ${pages.length}: ${pathname}`);
}
await writeFile('content/manifest.json',JSON.stringify(pages.map(({originalText,headings,...p})=>p),null,2));
let completed=0;
while([...pending.keys()].some(x=>!downloaded.has(x))){
  const batch=[...pending].filter(([file])=>!downloaded.has(file)).slice(0,8);
  await Promise.all(batch.map(async([file,url])=>{
    downloaded.add(file);
    try{const r=await fetchRetry(url);let bytes=Buffer.from(await r.arrayBuffer());if(/\.css$/i.test(file)||r.headers.get('content-type')?.includes('text/css'))bytes=Buffer.from(cssAssets(bytes.toString('utf8'),url));
      const target=path.join('public',file);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,bytes);completed++;
    }catch(e){failures.push({url,file,error:String(e)})}
  }));
  console.log(`Assets ${completed}/${pending.size}`);
}
await writeFile('migration/baseline.json',JSON.stringify({date:new Date().toISOString(),pages,assets:[...pending].map(([file,url])=>({file,url})),failures},null,2));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const sitemap=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p=>`<url><loc>${escape(p.canonical)}</loc></url>`).join('')}</urlset>`;
await writeFile('public/sitemap.xml',sitemap);
await writeFile('public/sitemap_index.xml','<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://homeperfectionnow.com/sitemap.xml</loc></sitemap></sitemapindex>');
console.log(JSON.stringify({pages:pages.length,assets:completed,failures},null,2));
if(failures.some(f=>!f.file))process.exitCode=1;
