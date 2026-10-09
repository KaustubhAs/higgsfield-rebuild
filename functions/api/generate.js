import {FLUX,validateInference} from '../../lib/capabilities.js';

const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const fail=(message,status)=>Response.json({error:message},{status,headers:{...headers,...(status===429?{'Retry-After':'60'}:{})}});
const configured=env=>env.ENABLE_REAL_GENERATION==='true'&&Boolean(env.CLOUDFLARE_ACCOUNT_ID&&env.CLOUDFLARE_API_TOKEN);
const unavailable='Real generation is unavailable. Configure server-side Cloudflare credentials and ENABLE_REAL_GENERATION; sample mode remains available.';
export function onRequestGet({env}) {const available=configured(env);return Response.json({available,maxBatchSize:1,message:available?'Cloudflare image generation enabled. One image per request.':unavailable},{headers});}
async function readBounded(request){
  if(Number(request.headers.get('Content-Length'))>10000)throw Object.assign(new Error(),{status:413});
  if(!request.body)return '';
  const reader=request.body.getReader();const chunks=[];let length=0;
  try {while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>10000){await reader.cancel();throw Object.assign(new Error(),{status:413});}chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
export async function handleGenerate(request,env,fetcher=fetch){
  if(request.method!=='POST')return fail('Use POST for image generation.',405);
  if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return fail('Cross-origin generation is not allowed.',403);
  if(request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()!=='application/json')return fail('Send an application/json request.',415);
  if(request.headers.has('Content-Encoding'))return fail('Compressed request bodies are not supported.',415);
  let body;
  try {body=validateInference(JSON.parse(await readBounded(request)));}
  catch(e){return fail(e.status===413?'Request exceeds the 10 KB limit.':e instanceof SyntaxError?'Invalid JSON request.':'Invalid model, prompt, parameters, dimensions or steps. Only one image is accepted per request.',e.status===413?413:400);}
  if(!configured(env))return fail(unavailable,503);
  const controller=new AbortController();const abort=()=>controller.abort();request.signal.addEventListener('abort',abort,{once:true});
  if(request.signal.aborted)abort();
  const timeout=setTimeout(abort,90000);
  try {
    const response=await fetcher(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)}/ai/run/${body.model}`,{method:'POST',headers:{Authorization:`Bearer ${env.CLOUDFLARE_API_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify(body.input),signal:controller.signal});
    // Never forward upstream errors, URLs, or credentials to clients or logs.
    if(!response.ok)return fail(response.status===429?'Cloudflare quota or rate limit reached. Try later; if the daily free allowance is exhausted, wait for its reset. You can switch to Sample Mode now.':response.status===401||response.status===403?'Cloudflare rejected the server credentials or model access. Check server configuration.':'Cloudflare could not generate this image. Try later or switch to samples.',response.status===429?429:502);
    let bytes;
    if(body.model===FLUX){const data=await response.json();const encoded=data.result?.image;if(data.success===false||typeof encoded!=='string'||encoded.length>16000000)throw new Error();bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));}
    else bytes=new Uint8Array(await response.arrayBuffer());
    if(!bytes.length||bytes.length>12000000)throw new Error();
    const png=[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
    const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
    if(!png&&!jpeg)throw new Error();
    return new Response(bytes,{headers:{...headers,'Content-Type':png?'image/png':'image/jpeg','X-Generation-Provider':'cloudflare'}});
  }catch {return fail(controller.signal.aborted?'Generation timed out or was cancelled. Completed outputs are kept.':'Cloudflare returned an unreadable image or could not be reached. Try again or switch to samples.',controller.signal.aborted?504:502);}
  finally {clearTimeout(timeout);request.signal.removeEventListener('abort',abort);}
}
export const onRequestPost=({request,env})=>handleGenerate(request,env);
