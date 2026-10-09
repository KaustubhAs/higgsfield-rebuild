import {mkdtemp,writeFile,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
const port=await new Promise(resolve=>{const socket=createServer();socket.listen(0,'127.0.0.1',()=>{const value=socket.address().port;socket.close(()=>resolve(value));});});
const root=process.cwd();const dir=await mkdtemp(path.join(tmpdir(),'frame-pages-test-'));
await cp(path.join(root,'functions'),path.join(dir,'functions'),{recursive:true});
await cp(path.join(root,'lib'),path.join(dir,'lib'),{recursive:true});
await writeFile(path.join(dir,'.dev.vars'),'ENABLE_REAL_GENERATION=false\n');
await writeFile(path.join(dir,'wrangler.toml'),`name="frame-test"\ncompatibility_date="2026-10-01"\npages_build_output_dir=${JSON.stringify(path.join(root,'out').replaceAll('\\','/'))}\n`);
// Test-only route: exercises the real handler inside workerd with fixture upstream data.
// Never copied into the application or deployed functions directory.
await writeFile(path.join(dir,'functions/api/runtime-test.js'),`import {handleGenerate} from './generate.js';
export const onRequestPost=({request})=>handleGenerate(new Request('https://frame-studio.pages.dev/api/generate',request),{ENABLE_REAL_GENERATION:request.headers.get('X-Test-Enabled')||'true',CLOUDFLARE_ACCOUNT_ID:'placeholder-account',CLOUDFLARE_API_TOKEN:'placeholder-token'},async(url)=>{const status=Number(request.headers.get('X-Test-Status'));if([401,403,429].includes(status))return new Response('private fixture detail',{status});const base64='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=';return url.includes('flux-1-schnell')?Response.json({success:true,result:{image:base64}}):new Response(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/png'}});});`);
const env={...process.env};for(const key of Object.keys(env))if(/^(CLOUDFLARE|CF_|WRANGLER)/i.test(key))delete env[key];
Object.assign(env,{WRANGLER_SEND_METRICS:'false',CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV:'false'});
const server=spawn(process.execPath,[path.join(root,'node_modules/wrangler/bin/wrangler.js'),'pages','dev','--ip','127.0.0.1','--port',String(port)],{cwd:dir,env,stdio:['ignore','pipe','pipe'],windowsHide:true,detached:process.platform!=='win32'});
let diagnostic='';server.stdout.on('data',b=>{diagnostic+=b;});server.stderr.on('data',b=>{diagnostic+=b;});
try{
  const base=`http://127.0.0.1:${port}`;let ready=false;
  for(let n=0;n<120;n++){try{const r=await fetch(base+'/api/generate',{signal:AbortSignal.timeout(1000)});if(r.ok&&(await r.json()).available===false){ready=true;break;}}catch{}if(server.exitCode!==null)break;await new Promise(r=>setTimeout(r,500));}
  if(!ready){console.error('Isolated Wrangler failed to start. No credentials were loaded.');console.error(diagnostic.replace(/placeholder-(account|token)/g,'[test placeholder]'));throw new Error('Wrangler startup failed');}
  const send=(route,body)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const flux={model:'@cf/black-forest-labs/flux-1-schnell',input:{prompt:'Test fixture',steps:4}};
  assert.equal((await send('/api/generate',flux)).status,503);
  assert.equal((await send('/api/generate',{...flux,input:{...flux.input,width:1024}})).status,400);
  assert.equal((await send('/api/runtime-test',{...flux,batchSize:2})).status,400);
  assert.equal((await fetch(base+'/api/runtime-test',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'})).status,400);
  assert.equal((await fetch(base+'/api/runtime-test',{method:'POST',headers:{'Content-Type':'application/json'},body:' '.repeat(10001)})).status,413);
  assert.equal((await fetch(base+'/api/runtime-test',{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'})).status,415);
  for(const body of [flux,{model:'@cf/stabilityai/stable-diffusion-xl-base-1.0',input:{prompt:'Test fixture',width:768,height:1024,num_steps:10}}]){
    const response=await send('/api/runtime-test',body);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/png');assert.deepEqual([...new Uint8Array(await response.arrayBuffer()).slice(0,8)],[137,80,78,71,13,10,26,10]);
  }
  assert.equal((await fetch(base+'/api/runtime-test',{method:'POST',headers:{'Content-Type':'application/json','X-Test-Enabled':'false'},body:JSON.stringify(flux)})).status,503);
  for(const status of [401,403,429]){const response=await fetch(base+'/api/runtime-test',{method:'POST',headers:{'Content-Type':'application/json','X-Test-Status':String(status)},body:JSON.stringify(flux)});assert.equal(response.status,status===429?429:502);assert.doesNotMatch(await response.text(),/private fixture|placeholder/);if(status===429)assert.equal(response.headers.get('Retry-After'),'60');}
  console.log('Wrangler runtime: disabled flag, malformed/oversized requests, batch/parameter validation, sanitized errors, public-host FLUX and SDXL fixtures passed. No live inference.');
  const browser=spawn(process.execPath,[path.join(root,'node_modules/@playwright/test/cli.js'),'test'],{cwd:root,env:{...env,PLAYWRIGHT_BASE_URL:base},stdio:'inherit',windowsHide:true});
  const code=await new Promise(resolve=>browser.on('exit',resolve));if(code!==0)process.exitCode=1;
}finally{
  if(process.platform==='win32'&&server.exitCode===null){await new Promise(resolve=>{const stop=spawn('taskkill',['/pid',String(server.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});stop.on('exit',resolve);});}
  else if(server.exitCode===null){try{process.kill(-server.pid,'SIGTERM');}catch{server.kill();}}
}
