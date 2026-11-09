import {readdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {extname,resolve} from 'node:path';
const root=fileURLToPath(new URL('../public/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const assets={};
for(const name of (await readdir(root,{recursive:true})).sort()){
 const type=types[extname(name)];if(!type)continue;
 assets['/'+name]={type,data:(await readFile(resolve(root,name))).toString('base64')};
}
await writeFile(new URL('../cloudflare-assets.js',import.meta.url),'export default '+JSON.stringify(assets)+';\n');
console.log(`Built ${Object.keys(assets).length} public assets.`);
