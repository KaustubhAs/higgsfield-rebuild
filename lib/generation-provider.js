import { dimensions, elementList, models, normalizeDraft, snapshot } from './creation.js';

// Future real adapters use same-origin server endpoints; no provider tokens here.
// generate(draft, {signal}) returns assets with provenance and immutable recipe.
const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const hash = s => [...s].reduce((n,c)=>(n*31+c.codePointAt(0))>>>0,7);
const error = (code,message) => Object.assign(new Error(message),{code});
function wait(ms,signal) {
  return new Promise((resolve,reject)=>{
    if(signal?.aborted) return reject(error('CANCELLED','Sample creation cancelled.'));
    const abort=()=>{clearTimeout(timer);reject(error('CANCELLED','Sample creation cancelled.'));};
    const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},ms);
    signal?.addEventListener('abort',abort,{once:true});
  });
}
export function sampleSVG(d,index) {
  const {width,height}=dimensions(d);
  const canvasHeight=800*height/width;
  const hue=hash(d.prompt+d.style+d.elements+d.model+index)%360;
  const refs=d.references.length+elementList(d).length;
  const label=d.kind==='video'?`VIDEO STORYBOARD / ${d.duration}s / NOT A VIDEO`:'SAMPLE IMAGE / NOT AI GENERATED';
  const shapes=d.model==='mock-graphic'
    ? `<path d="M180 390 400 95 620 390Z" fill="url(#object)"/><circle cx="${370+index*18}" cy="275" r="90" fill="hsl(${(hue+100)%360} 35% 70%)" opacity=".7"/>`
    : '<ellipse cx="400" cy="428" rx="178" ry="30" fill="#000" opacity=".2"/><rect x="225" y="382" width="350" height="55" rx="8" fill="#d9d6bd"/><ellipse cx="400" cy="380" rx="175" ry="28" fill="#efead5"/><rect x="334" y="150" width="132" height="224" rx="42" fill="url(#object)"/><rect x="361" y="109" width="78" height="57" rx="8" fill="#222923"/><text x="400" y="280" text-anchor="middle" fill="#25312a" font-family="Georgia" font-size="22" letter-spacing="5">FORM</text>';
  const artwork=`<g>${shapes}${d.references[0]?`<image href="${escape(d.references[0].dataUrl)}" x="560" y="100" width="110" height="110" preserveAspectRatio="xMidYMid meet"/><text x="615" y="229" text-anchor="middle" font-size="13" fill="white">REFERENCE</text>`:''}</g>`;
  const content=d.kind==='video'
    ? [0,1,2].map(frame=>`<svg x="${frame*266}" y="95" width="258" height="320" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice"><rect width="800" height="500" fill="hsl(${hue+frame*12} 22% ${36+frame*4}%)"/><g transform="translate(${frame*12} 0)">${artwork}</g></svg><text x="${frame*266+12}" y="449" fill="white" font-size="16">${frame===0?'START':frame===1?`${d.duration/2}s / MOVE`:`${d.duration}s / END`}</text>`).join('')
    : artwork;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 800 ${canvasHeight}"><title>${escape(label)}</title><desc>Procedural sample, not AI inference. ${escape(d.prompt)}</desc><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="hsl(${hue} 24% 23%)"/><stop offset="1" stop-color="hsl(${hue} 32% 57%)"/></linearGradient><linearGradient id="object"><stop stop-color="#404c40"/><stop offset=".4" stop-color="#dde3bb"/><stop offset=".7" stop-color="#a4b5a0"/><stop offset="1" stop-color="#435447"/></linearGradient></defs><rect width="800" height="${canvasHeight}" fill="url(#bg)"/><text x="28" y="40" fill="#fff" font-size="17" font-family="Arial">${label}</text><svg x="0" y="65" width="800" height="${canvasHeight-160}" viewBox="0 0 800 500">${content}</svg><g transform="translate(0 ${canvasHeight-600})" font-family="Arial" fill="white"><text x="28" y="533" font-size="16">${escape(d.model)} · ${escape(d.aspectRatio)} · ${d.quality} · ${index+1}/${d.batchSize}${d.kind==='video'?` · ${d.duration}s concept`:''}</text><text x="28" y="560" font-size="14">${escape(d.prompt.slice(0,68))}</text><text x="28" y="583" font-size="12">${refs} references/elements · ${escape(d.style)} · SAMPLE — NOT AI INFERENCE</text></g></svg>`;
}
export const mockProvider={
  getCapabilities(kind){return {kind,status:'sample',models:models.filter(m=>m.provider==='local-mock'),aspectRatios:['1:1','4:5','16:9','9:16'],qualities:['standard','high'],batchSizes:[1,2,4],durations:kind==='video'?[4,6,8]:[]};},
  async generate(input,{signal,scenario='success',delay=900}={}) {
    if(!input.model.startsWith('mock-')||!['image','video'].includes(input.kind)||!input.prompt?.trim()) throw error('INVALID_INPUT','Write a prompt before creating a sample.');
    const draft=normalizeDraft(input);
    for(const field of ['model','aspectRatio','quality','batchSize','duration']) if(draft[field]!==input[field]) throw error('UNSUPPORTED_SETTING',`Unsupported ${field}. Review your settings.`);
    await wait(delay+(delay?draft.batchSize*150:0),signal);
    if(scenario==='error') throw error('UPSTREAM_ERROR','Simulated provider error. Your draft is safe. Turn off error simulation and retry.');
    const createdAt=new Date().toISOString();const recipe=snapshot(draft);
    return Array.from({length:draft.batchSize},(_,index)=>({id:crypto.randomUUID(),kind:draft.kind,title:(draft.goal||draft.prompt).slice(0,65),createdAt,provenance:'sample',providerId:'local-mock',mime:'image/svg+xml',...dimensions(draft),index,recipe,svg:sampleSVG(draft,index)}));
  },
};
export const sampleURL=asset=>asset.provenance==='real'?asset.dataUrl:`data:image/svg+xml;charset=utf-8,${encodeURIComponent(asset.svg)}`;
export async function samplePNG(asset) {
  try {
    const {width,height}=asset;
    if (![width,height].every(n=>Number.isInteger(n)&&n>0&&n<=4096)) throw new Error('Invalid dimensions');
    const image=new Image();
    // Use exactly the same self-contained artwork as the selected preview.
    image.src=sampleURL(asset);
    await image.decode();
    const canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d');
    if(!context) throw new Error('Canvas unavailable');
    context.drawImage(image,0,0,width,height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob||blob.type!=='image/png') throw new Error('PNG encoding failed');
    const header=new Uint8Array(await blob.slice(0,8).arrayBuffer());
    if(![137,80,78,71,13,10,26,10].every((byte,i)=>header[i]===byte)) throw new Error('Invalid PNG');
    return blob;
  } catch {
    throw new Error('Could not export this sample as PNG. No file was downloaded. Try again or regenerate the sample; your saved asset is unchanged.');
  }
}
export async function downloadSample(asset){
  const blob=asset.kind==='image'?await samplePNG(asset):new Blob([asset.svg],{type:'image/svg+xml;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`${asset.provenance==='real'?'cloudflare':'sample'}-${asset.kind==='video'?'video-storyboard':'image'}-${asset.index+1}-${asset.id.slice(0,8)}.${asset.kind==='image'?'png':'svg'}`;
  try {document.body.append(a);a.click();}
  finally {a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
}
