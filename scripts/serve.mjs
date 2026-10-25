import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
const root=path.resolve('.output/public');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.xml':'application/xml','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const server=http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file=path.resolve(root,`.${pathname}`);
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
    const redirectText=await readFile(path.join(root,'_redirects'),'utf8').catch(()=>'');
    const redirect=redirectText.split('\n').map(s=>s.trim().split(/\s+/)).find(rule=>rule[0]===pathname);
    if(redirect){res.writeHead(Number(redirect[2])||301,{Location:encodeURI(redirect[1])});res.end();return}
    if((await stat(file).catch(()=>null))?.isDirectory())file=path.join(file,'index.html');
    let data;let status=200;
    try{data=await readFile(file)}catch{file=path.join(root,'404.html');data=await readFile(file);status=404}
    const headerText=await readFile(path.join(root,'_headers'),'utf8').catch(()=>'');
    for(const line of headerText.split('\n\n')[0].split('\n').slice(1)){
      const colon=line.indexOf(':');if(colon>0)res.setHeader(line.slice(0,colon).trim(),line.slice(colon+1).trim());
    }
    res.writeHead(status,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'});
    res.end(data);
  }catch{res.writeHead(400);res.end('Bad request')}
});
const port=Number(process.env.PORT||3000);
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
