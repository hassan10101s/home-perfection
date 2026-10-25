import { readdir, readFile, writeFile } from 'node:fs/promises';
for(const name of await readdir('app/pages')){
  const file=`app/pages/${name}`;let text=await readFile(file,'utf8');
  text=text.replace(/path: ("[^"]*")/,(_,value)=>'path: '+JSON.stringify(encodeURI(decodeURI(JSON.parse(value)))));
  await writeFile(file,text);
}
