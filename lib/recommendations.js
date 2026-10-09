import {FLUX,SDXL,capabilities} from './capabilities.js';

export const intendedUses={auto:'Choose from my idea',general:'General creative work',social:'Social post',story:'Story or reel',banner:'Website banner',product:'Product campaign'};
export const desiredFormats={auto:'Recommend a format',native:'Flexible — model default is fine','1:1':'Square — 1:1','4:5':'Portrait post — 4:5','3:4':'Portrait — 3:4','16:9':'Landscape — 16:9','9:16':'Vertical story — 9:16'};
export const desiredStyles={auto:'Recommend a style',Studio:'Clean studio',Cinematic:'Cinematic',Experimental:'Experimental'};
const directions={Studio:'Use soft directional studio lighting, tactile surfaces and a clean composition.',Cinematic:'Use atmospheric natural lighting, a deliberate composition and cinematic color.',Experimental:'Explore sculptural forms, unexpected materials and a restrained surreal composition.'};
// Pure recommendation boundary: a future adapter can return this same proposal.
// No mutation, inference, or automatic application happens here.
export function recommendImage(draft,{realAvailable=false}={}){
  const goal=draft.goal.trim();if(!goal)return null;
  const use=draft.intendedUse||'auto',format=draft.desiredFormat||'auto';
  let ratio=format;
  if(format==='auto'){
    const uses={social:'1:1',story:'9:16',banner:'16:9',product:'4:5'};
    ratio=uses[use]||(use==='general'?'native':/\b(vertical|story|reel|phone)\b/i.test(goal)?'9:16':/\b(portrait)\b/i.test(goal)?'4:5':/\b(landscape|wide|banner|panorama)\b/i.test(goal)?'16:9':/\b(square)\b/i.test(goal)?'1:1':/\b(product|bottle|skincare)\b/i.test(goal)?'4:5':'native');
  }
  const style=draft.desiredStyle&&draft.desiredStyle!=='auto'?draft.desiredStyle:/abstract|surreal|experimental/i.test(goal)?'Experimental':/cinema|landscape|wide|panorama/i.test(goal)?'Cinematic':'Studio';
  const real=realAvailable&&draft.generationPreference!=='sample';
  const model=real?(ratio==='native'?FLUX:SDXL):(style==='Experimental'?'mock-graphic':'mock-studio');
  const requestedRatio=ratio;
  if(!real&&!capabilities[model].ratios.includes(ratio))ratio=ratio==='3:4'?'4:5':'1:1';
  const quality=/detail|print|high quality/i.test(goal)?'high':'standard';
  const purpose={social:'Compose for a social post.',story:'Compose for a vertical story or reel.',banner:'Leave breathing room for a website banner.',product:'Keep the product the focus of the campaign.'}[use]||'';
  const settings={model,aspectRatio:ratio,quality,batchSize:/variations|options|compare/i.test(goal)?2:1,style};
  const reason=real?(model===SDXL?`SDXL can generate your ${ratio} format natively; FLUX cannot request that shape.`:'FLUX fits a flexible-format idea because you accept model-default sizing.'):`${draft.generationPreference==='sample'?'You chose samples.':'Real generation is unavailable.'} ${style==='Experimental'?'Graphic':'Studio'} samples let you explore the idea locally.${requestedRatio!==ratio?` The sample provider uses ${ratio} instead of ${requestedRatio==='native'?'an unspecified format':requestedRatio}.`:''}`;
  return {prompt:[goal,directions[style],purpose].filter(Boolean).join('\n\n'),settings,reason:`${reason} ${directions[style]} ${quality==='high'?'The detail preset allows more processing.':'The standard preset is a sensible starting point.'} Review every change before applying. These are local rules, not LLM suggestions.`,source:'local-rules'};
}

export function fluxFormatDisclosure(outputs=[]){
  const observed=outputs.filter(a=>a.provenance==='real'&&a.recipe?.model===FLUX&&a.width>1&&a.height>1);
  // User's manual Cloudflare test returned 1024 x 1024. This is an observation,
  // not a promised schema size. Contradictory local outputs override the label.
  const square=observed.every(a=>a.width===a.height);
  return {label:square?'Model default · 1:1':'Model default · size confirmed after generation',evidence:observed.length?`${observed.length} locally observed FLUX output(s): ${[...new Set(observed.map(a=>`${a.width} × ${a.height}`))].join(', ')}. ${square?'These observed outputs are square; this is not a guaranteed API size.':''}`:'Manually verified output: 1024 × 1024 (reported by the project owner). This observed size is not guaranteed by the API; actual dimensions appear with each result.',explanation:'FLUX native aspect-ratio controls are unavailable. This API cannot change its output format. Use SDXL for portrait, landscape, or another specific native ratio. Images are never cropped or stretched to simulate a supported format.'};
}
