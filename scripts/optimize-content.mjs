import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const manifest=JSON.parse(await readFile('content/manifest.json','utf8'));
await mkdir('public/assets/styles',{recursive:true});
const unique=new Set();let removed=0;
for(const entry of manifest){
  const file=`content/pages/${entry.id}.json`;const page=JSON.parse(await readFile(file,'utf8'));
  for(const style of page.styles){
    const hash=createHash('sha256').update(style).digest('hex').slice(0,16);
    const target=`/assets/styles/${hash}.css`;
    if(!unique.has(target)){await writeFile(`public${target}`,style);unique.add(target)}
    page.css.push(target);removed+=Buffer.byteLength(style);
  }
  page.styles=[];page.css=[...new Set(page.css)];
  await writeFile(file,JSON.stringify(page,null,2));
}
console.log(`Extracted ${removed} bytes from page JavaScript into ${unique.size} cacheable local stylesheets.`);
