'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import Link from 'next/link';
import {useDrafts} from './DraftProvider';
import {applyTemplate,recommend,templateById} from '../lib/templates';
import {modelName,normalizeDraft,snapshot} from '../lib/creation';
import GuidedPreferences from './GuidedPreferences';
import {isReal} from '../lib/capabilities';
import {cloudflareProvider,providerStatus} from '../lib/cloudflare-provider';
import {mockProvider} from '../lib/generation-provider';
import {readLibrary} from '../lib/browser-library';
import ConceptArt from './ConceptArt';
import GenerationControls from './GenerationControls';
import ResultPanel from './ResultPanel';
import Icon from './Icons';

export default function Studio({kind}) {
  const {drafts,updateDraft,outputs,updateOutputs,ready,storageNotice}=useDrafts();
  const draft=drafts[kind];const real=isReal(draft.model);
  const [availability,setAvailability]=useState(null);const [progress,setProgress]=useState('');
  useEffect(()=>{if(kind==='image')providerStatus().then(setAvailability);},[kind]);const assets=outputs[kind];const video=kind==='video';
  const [suggestion,setSuggestion]=useState(null);const [notice,setNotice]=useState('');
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [scenario,setScenario]=useState('success');
  const router=useRouter();const pathname=usePathname();const consumed=useRef('');const active=useRef(null);
  useEffect(()=>()=>active.current?.abort(),[]);
  useEffect(()=>{
    if(!ready)return;
    const query=window.location.search;if(!query||consumed.current===query)return;consumed.current=query;
    const params=new URLSearchParams(query);
    async function restore(){try {
      if(params.has('template')) {
        const template=templateById(params.get('template'),kind);
        if(template){updateDraft(kind,applyTemplate(draft,template));setNotice(`“${template.category}” starting point applied to your draft.`);}
        else setNotice('That template is unavailable. Your current draft has been kept.');
      } else if(params.has('asset')||params.has('recipe')) {
        const library=await readLibrary();
        const asset=library.assets.find(a=>a.id===params.get('asset')&&a.kind===kind);
        const recipe=library.recipes.find(r=>r.id===params.get('recipe')&&r.draft.kind===kind);
        const source=asset?.recipe||recipe?.draft;
        if(!source)throw new Error('This local item could not be found. It may have been removed or belongs to another browser.');
        updateDraft(kind,normalizeDraft(source,kind));if(asset)updateOutputs(kind,[asset]);
        setNotice('Saved recipe restored to all shared controls. Nothing has been generated.');
      }
    }catch(e){setError(e.message);}
    router.replace(pathname,{scroll:false});}
    restore();
  },[ready,kind,pathname,router,draft,updateDraft,updateOutputs]);
  function edit(patch){updateDraft(kind,{...patch,...(patch.aspectRatio?{desiredFormat:patch.aspectRatio}:{}),customized:true});setSuggestion(null);setNotice('');}
  async function generate(){
    if(busy||(real&&!availability?.available))return;
    const controller=new AbortController();active.current=controller;setBusy(true);setError('');setNotice('');
    try{if(real){const result=await cloudflareProvider.generate(snapshot(draft),{signal:controller.signal,onProgress:setProgress,onOutput:items=>updateOutputs(kind,items)});if(result.message)setError(result.message);}else{const result=await mockProvider.generate(snapshot(draft),{signal:controller.signal,scenario});if(!controller.signal.aborted)updateOutputs(kind,result);}}
    catch(e){if(e.code==='CANCELLED')setNotice('Sample creation cancelled. Your draft and previous results are unchanged.');else setError(e.message);}
    finally{if(active.current===controller){setBusy(false);active.current=null;}}
  }
  if(!ready)return <div className="page loading-state" role="status"><span className="spinner"/>Restoring your draft…</div>;
  return <div className="page studio-page"><div className="page-heading"><div><p className="eyebrow">{video?'GIVE YOUR IDEA A SENSE OF MOTION':'FROM A FIRST THOUGHT TO A CLEAR VISION'}</p><h1>{video?'Video':'Image'} Studio<span className="heading-dot">.</span></h1></div><span className="draft-status"><span/>{storageNotice?'Draft in this tab':'Draft saved on this device'}</span></div>{storageNotice&&<p className="notice" role="status">{storageNotice}</p>}
    <div className="studio-grid"><section className="config-panel" aria-label={`${kind} configuration`}><div className="config-top"><span className="panel-title"><Icon name={kind}/>{video?'Shape your shot':'Shape your image'}</span><span className="small-label">{real?'CLOUDFLARE AI':'SAMPLE MODE'}</span></div><div className="mode-switch" aria-label="Editing mode">{['guided','advanced'].map(mode=><button key={mode} aria-pressed={draft.mode===mode} disabled={busy} onClick={()=>updateDraft(kind,{mode})}><Icon name={mode==='guided'?'explore':'sliders'} size={15}/>{mode==='guided'?'Guided':'Advanced'}</button>)}</div>
    <div className="mode-description"><h2>{draft.mode==='guided'?'Start with the idea.':'Make it your own.'}</h2><p>{draft.mode==='guided'?'Describe your goal. Review a suggested prompt and settings before applying them.':'All controls edit the same draft. Your choices stay with you when you switch modes.'}</p></div>
    {draft.mode==='guided'&&<div className="guided-panel"><div className="field"><label htmlFor={`${kind}-goal`}>{video?'What happens in your shot?':'What do you want to create?'}</label><textarea id={`${kind}-goal`} rows={4} maxLength={1200} value={draft.goal} disabled={busy} onChange={e=>edit({goal:e.target.value})} placeholder="A product campaign for a vertical story, with warm light…"/></div>{!video&&<GuidedPreferences draft={draft} onChange={edit} busy={busy}/>}<button className="button secondary full" disabled={!draft.goal.trim()||busy} onClick={()=>setSuggestion(recommend(draft,{realAvailable:availability?.available===true}))}><Icon name="explore" size={17}/>Recommend prompt & settings</button><p className="field-help">Local rules, not an AI assistant. Nothing changes until you apply.</p></div>}
    {suggestion&&<section className="suggestion" aria-label="Suggested prompt and settings"><p className="eyebrow">REVIEW BEFORE APPLYING</p><p className="suggested-prompt">{suggestion.prompt}</p><p>{modelName(suggestion.settings.model)} · {suggestion.settings.aspectRatio} · {suggestion.settings.quality} · {suggestion.settings.batchSize} {isReal(suggestion.settings.model)?'image(s)':'sample(s)'} · {suggestion.settings.style}{video?` · ${suggestion.settings.duration}s`:''}</p><p>{suggestion.reason}</p><div className="action-row"><button className="button primary compact" disabled={busy} onClick={()=>{updateDraft(kind,{...suggestion.settings,prompt:suggestion.prompt.slice(0,2048),customized:false});setSuggestion(null);setNotice('Recommended prompt and settings applied. References were preserved.');}}>Apply recommendation</button><button className="text-button" onClick={()=>setSuggestion(null)}>Dismiss</button></div></section>}
    {real&&<div className="notice" role="status">{availability?.message||'Checking real provider availability...'} <button className="text-button" disabled={busy} onClick={()=>{edit({model:'mock-studio',aspectRatio:'1:1',batchSize:1,generationPreference:'sample'});setError('');}}>Switch to sample mode</button></div>}
    <GenerationControls draft={draft} onChange={edit} busy={busy} onGenerate={generate} unavailable={!availability?.available} outputs={assets}/>
    {!real&&<details className="sample-options"><summary>Sample provider testing</summary><label><input type="checkbox" checked={scenario==='error'} disabled={busy} onChange={e=>setScenario(e.target.checked?'error':'success')}/> Simulate a provider error</label><p>Tests the failure state locally. No API call is made.</p></details>}<p className="draft-notice" role="status">{notice}</p>{error&&<p className="field-error" role="alert">{error}</p>}
    </section><section className="preview-panel" aria-label={`${kind} preview`}><div className="preview-toolbar"><span><Icon name={kind} size={16}/>{assets.length?(assets[0].provenance==='real'?'Cloudflare results':'Sample results'):'Creative canvas'}</span><Link href="/assets/">Open Assets →</Link></div>
    {busy&&<div className="generation-progress" role="status"><span className="spinner"/><div><strong>{real?progress:`Creating ${draft.batchSize} local sample${draft.batchSize>1?'s':''}…`}</strong><p>{real?'Independent inference calls. Completed images remain available.':'Procedural artwork only. No AI inference.'}</p></div><button className="button secondary compact" onClick={()=>active.current?.abort()}>Cancel</button></div>}
    {assets.length?<ResultPanel assets={assets} onRevise={()=>document.getElementById(`${kind}-prompt`)?.focus()}/>:<div className="preview-body"><div className={`preview-art ${video?'film-frame':''}`}><ConceptArt variant={templateById(draft.templateId,kind)?.art||(video?'arch':'product')}/></div><span className="illustration-label">Original concept illustration · not AI output</span><h2>{video?'Plan a moment of motion.':'Give your idea room to take shape.'}</h2><p>{video?'Create a clearly labeled sample storyboard with timing and references.':'Prepare your prompt and settings, then create an image.'}<br/>{real?'Cloudflare text-to-image is selected. Your prompt is sent only when you generate.':'Sample mode is selected. No real inference is requested.'}</p><div className="canvas-steps"><span className="current"><b>01</b>Shape the brief</span><span><b>02</b>{real?'Generate image':'Create a sample'}</span><span><b>03</b>Save & reuse</span></div></div>}
    <div className="preview-footer"><Icon name="info" size={16}/><span>{real?'Cloudflare real inference - free account quota applies':'Local samples only - no paid services or inference'}</span></div></section></div></div>;
}
