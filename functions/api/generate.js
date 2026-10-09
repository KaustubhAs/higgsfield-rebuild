import {FLUX,validateInference} from '../../lib/capabilities.js';

const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const fail=(message,status)=>Response.json({error:message},{status,headers});
const configured=env=>env.ENABLE_REAL_GENERATION==='true'&&Boolean(env.CLOUDFLARE_ACCOUNT_ID&&env.CLOUDFLARE_API_TOKEN);
export function onRequestGet({env}) {return Response.json({available:configured(env),message:configured(env)?'Cloudflare image generation enabled.':'Real generation is unavailable. Configure server-side Cloudflare credentials and ENABLE_REAL_GENERATION; sample mode remains available.'},{headers});}
export async function handleGenerate(request,env,fetcher=fetch){
  if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return fail('Cross-origin generation is not allowed.',403);
  if(!request.headers.get('Content-Type')?.includes('application/json'))return fail('Send a JSON request.',415);
  let body;
  try {const text=await request.text();if(text.length>10000)return fail('Request is too large.',413);body=validateInference(JSON.parse(text));}
  catch(e){return fail(e instanceof SyntaxError?'Invalid JSON request.':e.message,400);}
  if(!configured(env))return fail('Real generation is unavailable. Configure server-side Cloudflare credentials and ENABLE_REAL_GENERATION; sample mode remains available.',503);
  const controller=new AbortController();const abort=()=>controller.abort();request.signal.addEventListener('abort',abort,{once:true});
  const timeout=setTimeout(abort,90000);
  try {
    const response=await fetcher(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)}/ai/run/${body.model}`,{method:'POST',headers:{Authorization:`Bearer ${env.CLOUDFLARE_API_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify(body.input),signal:controller.signal});
    // Never forward upstream errors, URLs, or credentials to clients or logs.
    if(!response.ok)return fail(response.status===429?'Cloudflare quota or rate limit reached. Wait before retrying, or explicitly switch to samples.':response.status===401||response.status===403?'Cloudflare rejected the server credentials or model access. Check server configuration.':'Cloudflare could not generate this image. Try later or switch to samples.',response.status===429?429:502);
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
