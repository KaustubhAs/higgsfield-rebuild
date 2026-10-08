'use client';
import {useEffect,useRef,useState} from 'react';
import {mockProvider} from '../lib/generation-provider';
import {styles} from '../lib/creation';
import Icon from './Icons';

export default function GenerationControls({draft,onChange,busy,onGenerate}) {
  const caps=mockProvider.getCapabilities(draft.kind);
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
  return <fieldset className="generation-controls" disabled={busy}><legend>Generation controls</legend><p className="field-help">Sample settings only. No real model is connected.</p>
    <div className="control-grid">
      <label className="wide-control">Model<select value={draft.model} onChange={e=>onChange({model:e.target.value})}>{caps.models.map(m=><option key={m.id} value={m.id}>{m.name} · mock</option>)}</select></label>
      <label>Aspect ratio<select value={draft.aspectRatio} onChange={e=>onChange({aspectRatio:e.target.value})}>{caps.aspectRatios.map(r=><option key={r}>{r}</option>)}</select></label>
      <label>Quality<select value={draft.quality} onChange={e=>onChange({quality:e.target.value})}><option value="standard">Standard · 768 px</option><option value="high">High · 1280 px</option></select></label>
      <label>Batch size<select value={draft.batchSize} onChange={e=>onChange({batchSize:Number(e.target.value)})}>{caps.batchSizes.map(n=><option value={n} key={n}>{n} {n===1?'sample':'samples'}</option>)}</select></label>
      <label>Creative direction<select value={draft.style} onChange={e=>onChange({style:e.target.value})}>{styles(draft.kind).map(s=><option key={s}>{s}</option>)}</select></label>
      {draft.kind==='video'&&<label className="wide-control">Duration<select value={draft.duration} onChange={e=>onChange({duration:Number(e.target.value)})}>{caps.durations.map(d=><option value={d} key={d}>{d} seconds · storyboard timing</option>)}</select></label>}
    </div>
    <div className="field"><label htmlFor={`${draft.kind}-elements`}>Elements / references</label><textarea id={`${draft.kind}-elements`} rows={2} maxLength={300} value={draft.elements} placeholder="Amber bottle, stone plinth, warm light…" onChange={e=>onChange({elements:e.target.value})}/><p className="field-help">Comma-separated elements affect sample colors and metadata. They are not AI-interpreted.</p></div>
    <div className="reference-field"><label htmlFor={`${draft.kind}-reference`}>Reference image <span>Optional</span></label><input className="file-input" ref={fileInput} id={`${draft.kind}-reference`} type="file" accept="image/jpeg,image/png,image/webp" onChange={loadReference}/>
      {draft.references[0]?<div className="reference-selected"><img src={draft.references[0].dataUrl} alt="Your selected starting reference"/><div><strong>{draft.references[0].name}</strong><span>Local thumbnail · no upload</span></div><button className="icon-button" aria-label="Remove reference image" onClick={()=>onChange({references:[]})}><Icon name="close" size={16}/></button></div>:<button className="upload-zone" disabled={reading} onClick={()=>fileInput.current?.click()}><Icon name="upload"/><strong>{reading?'Opening image…':'Choose a reference image'}</strong><span>JPEG, PNG or WebP · up to 5 MB</span></button>}
      <p className="field-help">A small local thumbnail is kept with the recipe and shown in the sample. No image analysis.</p>{fileError&&<p className="field-error" role="alert">{fileError}</p>}
    </div>
    <div className="field prompt-field"><label htmlFor={`${draft.kind}-prompt`}>{draft.kind==='video'?'Motion prompt':'Your prompt'}{draft.customized&&<span className="customized">Customized</span>}</label><textarea id={`${draft.kind}-prompt`} value={draft.prompt} maxLength={2048} rows={5} onChange={e=>onChange({prompt:e.target.value})} placeholder="Describe what you want to create…"/><div className="field-meta"><span>Shared with both editing modes</span><span>{draft.prompt.length}/2048</span></div></div>
    <button className="button primary full" disabled={!draft.prompt.trim()||reading} onClick={onGenerate}><Icon name={draft.kind}/>{busy?'Creating samples…':`Generate ${draft.batchSize===1?'sample':`${draft.batchSize} samples`}`}</button>
    <p className="field-help">{draft.kind==='video'?'Creates a downloadable SVG storyboard, not a playable video.':'Creates original procedural SVG samples, not AI images.'} Save results to Assets to keep them after refresh.</p>
  </fieldset>;
}
