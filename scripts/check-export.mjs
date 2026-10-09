import {readFile,readdir,access} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
for(const file of ['out/index.html','out/image/index.html','out/video/index.html','out/assets/index.html','out/icon.svg','out/_routes.json'])await access(file);
const routes=JSON.parse(await readFile('out/_routes.json','utf8'));assert.deepEqual(routes.include,['/api/*']);
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())await walk(file);else if(/\.(js|html|json)$/.test(file)){const text=await readFile(file,'utf8');assert.ok(!/CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|placeholder-token|api\.cloudflare\.com\/client\/v4\/accounts/.test(text),`Server-only identifier in export: ${file}`);}}}
await walk('out');console.log('Static pages, favicon, Functions routing and client/server boundaries verified.');
