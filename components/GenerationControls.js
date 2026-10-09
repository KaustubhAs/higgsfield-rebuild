'use client';
import {useEffect,useRef,useState} from 'react';
import {mockProvider} from '../lib/generation-provider';
import {capabilities,isReal,modelOptions,selectModel} from '../lib/capabilities';
import {fluxFormatDisclosure} from '../lib/recommendations';
import {readLibrary} from '../lib/browser-library';
import {styles} from '../lib/creation';
import Icon from './Icons';

export default function GenerationControls({draft,onChange,busy,onGenerate,unavailable=false,outputs=[]}) {
  const guided=draft.kind==='image'&&draft.mode==='guided';
  const [observations,setObservations]=useState([]);
  useEffect(()=>{let active=true;readLibrary().then(l=>{if(active)setObservations(l.assets.map(({id,provenance,recipe,width,height})=>({id,provenance,recipe:{model:recipe.model},width,height})));}).catch(()=>{});return()=>{active=false;};},[outputs]);
  const fluxFormat=fluxFormatDisclosure([...new Map([...observations,...outputs].map(a=>[a.id,a])).values()]);
  const real=isReal(draft.model);const model=capabilities[draft.model];
  const caps={...mockProvider.getCapabilities(draft.kind),models:modelOptions(draft.kind),aspectRatios:model.ratios,batchSizes:model.batches};
  const [fileError,setFileError]=useState('');
  const [reading,setReading]=useState(false);
  const ticket=useRef(0);
  const fileInput=useRef(null);
  useEffect(()=>()=>{ticket.current++;},[]);
  async function loadReference(event){
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    const request=++ticket.current;setFileError('');
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setFileError('Choose a JPEG, PNG or WebP image smaller than 5 MB.');return;}
    setReading(true);const url=URL.createObjectURL(file);
    try{
      const image=new Image();image.src=url;await image.decode();
      const scale=Math.min(1,320/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
      const ctx=canvas.getContext('2d');ctx.fillStyle='#eee';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
      const dataUrl=canvas.toDataURL('image/jpeg',.65);
      if(dataUrl.length>=100000)throw new Error('large');
      if(request===ticket.current)onChange({references:[{name:file.name,dataUrl,width:image.naturalWidth,height:image.naturalHeight}]});
    }catch{if(request===ticket.current)setFileError('This file could not be opened as an image. Try another file.');}
    finally{URL.revokeObjectURL(url);if(request===ticket.current)setReading(false);}
  }
  return <fieldset className="generation-controls" disabled={busy}><legend>Generation controls</legend><p className="field-help">{real?'Real Cloudflare image generation. Each output uses one inference call.':'Sample settings only. No real model is connected.'}</p>
    {real&&!guided&&<p className="notice">{draft.aspectRatio==='native'?'FLUX native aspect-ratio controls are unavailable. Output dimensions are determined by the model, not your previous ratio.':'SDXL uses the selected dimensions; quality changes diffusion steps, not resolution.'} Style and elements are not sent as separate parameters. Describe them in your prompt. The demo allows one real image per generation.</p>}
    {guided&&<div className="model-disclosure"><small>Current model</small><p>{model.name} {real?'(Cloudflare)':'(sample)'}</p><button className="text-button" onClick={()=>onChange({mode:'advanced'})}>Adjust in Advanced Mode</button><p>Current output format: {draft.aspectRatio==='native'?fluxFormat.label:draft.aspectRatio}. Review and apply a new recommendation to change it.</p></div>}
    {draft.aspectRatio==='native'&&<div className="model-disclosure" aria-label="FLUX output format"><strong>{fluxFormat.label}</strong><p>{fluxFormat.explanation}</p><small>{fluxFormat.evidence}</small></div>}
    <div className="control-grid">
      {!guided&&<label className="wide-control">Model<select value={draft.model} onChange={e=>onChange(selectModel(draft,e.target.value))}>{caps.models.map(m=><option key={m.id} value={m.id}>{m.name} {isReal(m.id)?' - Cloudflare':' - mock'}</option>)}</select></label>}
      {!guided&&<label>Aspect ratio<select disabled={draft.aspectRatio==='native'} value={draft.aspectRatio} onChange={e=>onChange({aspectRatio:e.target.value})}>{caps.aspectRatios.map(r=><option key={r} value={r}>{r==='native'?'Model default (no ratio control)':r}</option>)}</select></label>}
      {!guided&&<label>Quality<select value={draft.quality} onChange={e=>onChange({quality:e.target.value})}><option value="standard">{real?`Standard - ${model.steps.standard} steps`:'Standard - 768 px'}</option><option value="high">{real?`High - ${model.steps.high} steps`:'High - 1280 px'}</option></select></label>}
      <label>Batch size<select value={draft.batchSize} onChange={e=>onChange({batchSize:Number(e.target.value)})}>{caps.batchSizes.map(n=><option value={n} key={n}>{n} {real?(n===1?'image':'images'):(n===1?'sample':'samples')}</option>)}</select></label>
      {!guided&&<label>Creative direction<select disabled={real} value={draft.style} onChange={e=>onChange({style:e.target.value})}>{styles(draft.kind).map(s=><option key={s}>{s}</option>)}</select></label>}
      {draft.kind==='video'&&<label className="wide-control">Duration<select value={draft.duration} onChange={e=>onChange({duration:Number(e.target.value)})}>{caps.durations.map(d=><option value={d} key={d}>{d} seconds · storyboard timing</option>)}</select></label>}
    </div>
    {!(guided&&real)&&<><div className="field"><label htmlFor={`${draft.kind}-elements`}>Elements / references</label><textarea id={`${draft.kind}-elements`} rows={2} maxLength={300} value={draft.elements} disabled={real} placeholder="Amber bottle, stone plinth, warm light…" onChange={e=>onChange({elements:e.target.value})}/><p className="field-help">Comma-separated elements affect sample colors and metadata. They are not AI-interpreted.</p></div>
    <div className="reference-field"><label htmlFor={`${draft.kind}-reference`}>Reference image <span>Optional</span></label><input className="file-input" ref={fileInput} id={`${draft.kind}-reference`} type="file" accept="image/jpeg,image/png,image/webp" onChange={loadReference} disabled={real}/>
      {draft.references[0]?<div className="reference-selected"><img src={draft.references[0].dataUrl} alt="Your selected starting reference"/><div><strong>{draft.references[0].name}</strong><span>Local thumbnail · no upload</span></div><button className="icon-button" aria-label="Remove reference image" onClick={()=>onChange({references:[]})}><Icon name="close" size={16}/></button></div>:<button className="upload-zone" disabled={reading||real} onClick={()=>fileInput.current?.click()}><Icon name="upload"/><strong>{reading?'Opening image…':'Choose a reference image'}</strong><span>JPEG, PNG or WebP · up to 5 MB</span></button>}
      <p className="field-help">{real?'Reference conditioning is not enabled for this integration. Existing references are kept in the recipe but are not sent.':'A small local thumbnail is kept with the recipe and shown in the sample. No image analysis.'}</p>{fileError&&<p className="field-error" role="alert">{fileError}</p>}
    </div>
    </>}
    {guided&&real&&<p className="field-help">References and separate elements are not used by real models here. Describe the important details in your prompt.</p>}
    <div className="field prompt-field"><label htmlFor={`${draft.kind}-prompt`}>{draft.kind==='video'?'Motion prompt':'Your prompt'}{draft.customized&&<span className="customized">Customized</span>}</label><textarea id={`${draft.kind}-prompt`} value={draft.prompt} maxLength={2048} rows={5} onChange={e=>onChange({prompt:e.target.value})} placeholder="Describe what you want to create…"/><div className="field-meta"><span>Shared with both editing modes</span><span>{draft.prompt.length}/2048</span></div></div>
    <button className="button primary full" disabled={!draft.prompt.trim()||reading||(real&&unavailable)} onClick={onGenerate}><Icon name={draft.kind}/>{busy?'Generating...':real?`Generate ${draft.batchSize} real image${draft.batchSize===1?'':'s'}`:`Generate ${draft.batchSize===1?'sample':`${draft.batchSize} samples`}`}</button>
    <p className="field-help">{draft.kind==='video'?'Creates a downloadable SVG storyboard, not a playable video.':real?'Sends only the prompt and supported settings to Cloudflare.':'Creates original procedural SVG samples, not AI images.'} Save results to Assets to keep them after refresh.</p>
  </fieldset>;
}
