import {inferenceRequest} from './capabilities.js';
import {snapshot} from './creation.js';
export async function providerStatus(){if(process.env.NODE_ENV==='development')return {available:false,message:'Real generation requires Wrangler. Run npm run build then npm run dev:pages and open port 8788. next dev is sample-only.'};try{const r=await fetch('/api/generate',{cache:'no-store'});if(!r.ok)throw new Error();return await r.json();}catch{return {available:false,message:'Real endpoint unavailable. Use the Cloudflare Pages local runtime with server credentials, or continue in sample mode.'};}}
function dataURL(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read generated image.'));reader.readAsDataURL(blob);});}
export const cloudflareProvider={
  async generate(draft,{signal,onProgress=()=>{},onOutput=()=>{}}={}){
    if(process.env.NODE_ENV==='development')throw new Error('Use Wrangler Pages for real generation; next dev is sample-only.');
    if(draft.batchSize!==1)throw new Error('The demo allows one real image per generation.');
    const assets=[];const failures=[];
    for(let index=0;index<draft.batchSize;index++){
      if(signal?.aborted)break;
      onProgress(`Generating image ${index+1} of ${draft.batchSize} with Cloudflare…`);
      try {
        const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(inferenceRequest(draft)),signal});
        if(!response.ok){let message='Real endpoint unavailable. Run Pages with server credentials, or use samples.';try{message=(await response.json()).error||message;}catch{}throw new Error(message);}
        const blob=await response.blob();if(!['image/png','image/jpeg'].includes(blob.type)||blob.size>12000000)throw new Error('Provider returned an unsupported image.');
        const url=await dataURL(blob);const image=new Image();image.src=url;await image.decode();
        if(signal?.aborted)break;
        const asset={id:crypto.randomUUID(),kind:'image',title:(draft.goal||draft.prompt).slice(0,65),createdAt:new Date().toISOString(),provenance:'real',providerId:'cloudflare',mime:blob.type,width:image.naturalWidth,height:image.naturalHeight,index,recipe:snapshot(draft),inferenceSettings:inferenceRequest(draft).input,dataUrl:url};
        assets.push(asset);onOutput([...assets]);
      }catch(e){if(signal?.aborted)break;failures.push(`Image ${index+1}: ${e.message}`);break;}
    }
    return {assets,message:signal?.aborted?`Generation cancelled. ${assets.length} completed output(s) kept. Cancellation may not stop inference already running at Cloudflare.`:failures.length?`${failures.join(' ')} ${assets.length} of ${draft.batchSize} outputs completed. Remaining calls were stopped.`:''};
  },
};
