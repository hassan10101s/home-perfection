import { readFile, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';
const $=load(await readFile('migration/raw/home.html','utf8'));
for(const el of $('link[rel="icon"],link[rel="apple-touch-icon"]').toArray()){
  const href=$(el).attr('href');if(!href)continue;const u=new URL(href);
  if(u.origin!=='https://homeperfectionnow.com')continue;
  const response=await fetch(u);if(!response.ok)throw Error(`Icon download ${response.status}`);
  await writeFile(`public${u.pathname}`,Buffer.from(await response.arrayBuffer()));
}
