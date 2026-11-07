import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('public');
http.createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+'/')){res.writeHead(403);return res.end();}const body=await readFile(path);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.webp':'image/webp'})[extname(path)]||'application/octet-stream');res.end(body);}catch{res.writeHead(404);res.end('Hittades inte');}}).listen(Number(process.env.PORT||3000),'0.0.0.0');
