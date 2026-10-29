import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHandler } from '../lib/chat.js';
const chat=createHandler();
createServer(async(req,res)=>{
  if(req.url==='/api/chat'){
    let raw='';
    for await(const chunk of req){raw+=chunk;if(raw.length>30000){res.writeHead(413);res.end();return;}}
    res.status=n=>{res.statusCode=n;return res;};
    res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
    req.body=raw;await chat(req,res);return;
  }
  const files={'/':'index.html','/chat.js':'chat.js','/chat.css':'chat.css'};
  const file=files[req.url?.split('?')[0]];
  if(!file){res.writeHead(404);res.end('Not found');return;}
  res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css':'application/javascript');
  res.end(await readFile(new URL(`../public/${file}`,import.meta.url)));
}).listen(3000,'127.0.0.1',()=>console.log('Dashboard: http://127.0.0.1:3000'));
