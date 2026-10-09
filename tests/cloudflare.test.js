import test from 'node:test';
import assert from 'node:assert/strict';
import {FLUX,SDXL,inferenceRequest,validateInference,modelOptions} from '../lib/capabilities.js';
import {handleGenerate,onRequestGet} from '../functions/api/generate.js';
import {blankDraft,recommend} from '../lib/templates.js';
import {normalizeDraft} from '../lib/creation.js';
const env={ENABLE_REAL_GENERATION:'true',CLOUDFLARE_ACCOUNT_ID:'placeholder-account',CLOUDFLARE_API_TOKEN:'placeholder-token'};
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');
const request=body=>new Request('https://frame-studio.pages.dev/api/generate',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://frame-studio.pages.dev'},body:JSON.stringify(body)});
const flux={model:FLUX,input:{prompt:'A coffee cup',steps:4}};
test('public inference requires an exact enable flag and both server credentials',async()=>{
  let calls=0;const never=()=>{calls++;throw new Error('Upstream must not run');};
  for(const config of [...[undefined,'false','TRUE','1'].map(flag=>({...env,ENABLE_REAL_GENERATION:flag})),{...env,CLOUDFLARE_API_TOKEN:''},{...env,CLOUDFLARE_ACCOUNT_ID:''}]){
    const response=await handleGenerate(request(flux),config,never);assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/placeholder/);
    assert.equal((await onRequestGet({env:config}).json()).available,false);
  }
  assert.equal(calls,0);
  assert.equal((await onRequestGet({env}).json()).available,true);
});
test('bounded JSON validation rejects malformed, oversized, unsupported and batched requests',async()=>{
  let calls=0;const never=()=>{calls++;throw new Error();};
  for(const [body,headers,status] of [
    ['{',{'Content-Type':'application/json'},400],
    ['"'+ 'é'.repeat(6000)+'"',{'Content-Type':'application/json'},413],
    ['{}',{'Content-Type':'text/plain'},415],
    ['{}',{'Content-Type':'application/json-invalid'},415],
    ['{}',{'Content-Type':'application/json','Content-Encoding':'gzip'},415],
    ['{}',{'Content-Type':'application/json',Origin:'https://other.example'},403],
  ])assert.equal((await handleGenerate(new Request('http://localhost/api/generate',{method:'POST',body,headers}),env,never)).status,status);
  for(const body of [[flux,flux],{...flux,batchSize:2},{...flux,count:2},{...flux,model:'unsupported'},...['','x'.repeat(2049)].map(prompt=>({...flux,input:{prompt,steps:4}}))])assert.equal((await handleGenerate(request(body),env,never)).status,400);
  assert.equal(calls,0);
  const limited=await handleGenerate(request(flux),env,async()=>new Response('private details',{status:429}));
  assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'60');
  const message=await limited.text();assert.doesNotMatch(message,/private details|placeholder/);assert.match(message,/daily free allowance/);assert.match(message,/switch to Sample Mode/);
});
test('capabilities restrict FLUX, map SDXL, bound batches, preserve recommendation provider',()=>{
  const draft={...blankDraft('image'),model:FLUX,prompt:'Coffee',goal:'A vertical product in high quality',aspectRatio:'native'};
  assert.deepEqual(inferenceRequest(draft),{model:FLUX,input:{prompt:'Coffee',steps:4}});
  assert.equal(recommend(draft,{realAvailable:true}).settings.aspectRatio,'9:16');assert.equal(recommend(draft,{realAvailable:true}).settings.model,SDXL);
  assert.deepEqual(inferenceRequest({...draft,model:SDXL,aspectRatio:'3:4',quality:'high'}).input,{prompt:'Coffee',width:768,height:1024,num_steps:20});
  assert.equal(normalizeDraft({...draft,batchSize:4}).batchSize,1);
  assert.equal(modelOptions('video').some(m=>m.id===FLUX),false);
  for(const field of ['width','height','seed','image','quality','batchSize'])assert.throws(()=>validateInference({...flux,input:{...flux.input,[field]:1}}));
  assert.throws(()=>validateInference({model:SDXL,input:{prompt:'x',width:12,height:12,num_steps:21}}));
});
test('endpoint validates before inference and handles missing credentials without calling upstream',async()=>{
  let called=false;const fetcher=()=>{called=true;throw new Error();};
  assert.equal((await handleGenerate(request({...flux,input:{...flux.input,width:1024}}),env,fetcher)).status,400);
  assert.equal((await handleGenerate(request(flux),{},fetcher)).status,503);
  assert.equal((await onRequestGet({env:{}}).json()).available,false);assert.equal(called,false);
});
test('enabled public FLUX and SDXL requests return images with exactly one inference call each',async()=>{
  for(const body of [flux,{model:SDXL,input:{prompt:'Coffee',width:768,height:1024,num_steps:10}}]){
    let calls=0;const response=await handleGenerate(request(body),env,async(url,options)=>{
      calls++;
      assert.deepEqual(JSON.parse(options.body),body.input);assert.ok(url.endsWith(body.model));
      return body.model===FLUX?Response.json({success:true,result:{image:png.toString('base64')}}):new Response(png,{headers:{'Content-Type':'image/png'}});
    });
    assert.equal(calls,1);assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'image/png');assert.deepEqual(Buffer.from(await response.arrayBuffer()),png);
  }
});
test('upstream failures never leak credentials or error bodies, and invalid image data is rejected',async()=>{
  for(const status of [401,403,429,500]){
    const r=await handleGenerate(request(flux),env,async()=>new Response('placeholder-token private upstream text',{status}));
    assert.equal(r.status,status===429?429:502);assert.doesNotMatch(await r.text(),/placeholder-token|private upstream/);
  }
  assert.equal((await handleGenerate(request(flux),env,async()=>Response.json({result:{image:btoa('<html>failure</html>')}}))).status,502);
});
