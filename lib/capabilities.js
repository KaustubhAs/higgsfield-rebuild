export const FLUX='@cf/black-forest-labs/flux-1-schnell';
export const SDXL='@cf/stabilityai/stable-diffusion-xl-base-1.0';
// Deliberately bounded subset of the official schemas. No reference conditioning.
export const sdxlSizes={'1:1':[1024,1024],'4:5':[768,960],'3:4':[768,1024],'16:9':[1024,576],'9:16':[576,1024]};
export const capabilities={
  'mock-studio':{id:'mock-studio',name:'Sample Studio',provider:'local-mock',ratios:['1:1','4:5','16:9','9:16'],batches:[1,2,4],references:true},
  'mock-graphic':{id:'mock-graphic',name:'Sample Graphic',provider:'local-mock',ratios:['1:1','4:5','16:9','9:16'],batches:[1,2,4],references:true},
  [FLUX]:{id:FLUX,name:'FLUX.1 Schnell',provider:'cloudflare',ratios:['native'],batches:[1,2],references:false,steps:{standard:4,high:8},parameters:['prompt','steps']},
  [SDXL]:{id:SDXL,name:'Stable Diffusion XL',provider:'cloudflare',ratios:Object.keys(sdxlSizes),batches:[1,2],references:false,steps:{standard:10,high:20},parameters:['prompt','width','height','num_steps']},
};
export const isReal=model=>capabilities[model]?.provider==='cloudflare';
export const modelOptions=kind=>Object.values(capabilities).filter(c=>kind==='image'||!isReal(c.id));
export function selectModel(draft,model){const c=capabilities[model];return {model,aspectRatio:c.ratios.includes(draft.aspectRatio)?draft.aspectRatio:c.ratios[0],batchSize:c.batches.includes(draft.batchSize)?draft.batchSize:1};}
export function inferenceRequest(draft){
  const c=capabilities[draft.model];
  if(!c||!isReal(draft.model)||draft.kind!=='image')throw new Error('Select a supported image model.');
  const input={prompt:draft.prompt};
  if(draft.model===FLUX)input.steps=c.steps[draft.quality];
  else {const size=sdxlSizes[draft.aspectRatio];if(!size)throw new Error('Choose a supported SDXL aspect ratio.');[input.width,input.height]=size;input.num_steps=c.steps[draft.quality];}
  return {model:draft.model,input};
}
export function validateInference(body){
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['model','input'].includes(k)))throw new Error('Invalid request fields.');
  const c=capabilities[body.model],p=body.input;
  if(!c||!isReal(body.model)||!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!c.parameters.includes(k)))throw new Error('Unsupported model or parameter.');
  if(typeof p.prompt!=='string'||!p.prompt.trim()||p.prompt.length>2048)throw new Error('Prompt must contain 1–2048 characters.');
  if(body.model===FLUX){if(![4,8].includes(p.steps))throw new Error('Choose 4 or 8 FLUX steps.');}
  else if(![10,20].includes(p.num_steps)||!Object.values(sdxlSizes).some(([w,h])=>p.width===w&&p.height===h))throw new Error('Unsupported SDXL dimensions or steps.');
  return {model:body.model,input:{...p}};
}
