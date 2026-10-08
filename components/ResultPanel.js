'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {useDrafts} from './DraftProvider';
import {elementList,modelName,snapshot} from '../lib/creation';
import {downloadSample,sampleURL} from '../lib/generation-provider';
import {readLibrary,saveAsset,saveRecipe} from '../lib/library';

export function ResultMetadata({asset}) {
  const d=asset.recipe;
  return <div className="result-metadata"><dl><div><dt>Mode</dt><dd>{d.mode}</dd></div><div><dt>Model</dt><dd>{modelName(d.model)} · mock</dd></div><div><dt>Aspect ratio</dt><dd>{d.aspectRatio}</dd></div><div><dt>Quality</dt><dd>{d.quality} · {asset.width} × {asset.height}</dd></div><div><dt>Batch</dt><dd>{asset.index+1} of {d.batchSize}</dd></div><div><dt>Direction</dt><dd>{d.style}</dd></div>{asset.kind==='video'&&<div><dt>Duration</dt><dd>{d.duration}s storyboard concept</dd></div>}<div><dt>References / elements</dt><dd>{d.references.length+elementList(d).length} · {[...d.references.map(r=>r.name),...elementList(d)].join(', ')||'None'}</dd></div></dl><details><summary>Prompt & creative goal</summary><p><strong>Prompt</strong><br/>{d.prompt}</p><p><strong>Goal</strong><br/>{d.goal||'Manual start'}</p></details></div>;
}
export default function ResultPanel({assets,onRevise}) {
  const [selected,setSelected]=useState(0);
  const [downloading,setDownloading]=useState(false);
  const [library,setLibrary]=useState({assets:[],recipes:[]});
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');
  const [recipeName,setRecipeName]=useState('');
  const {updateDraft}=useDrafts();const router=useRouter();
  useEffect(()=>{setSelected(0);setNotice('');setError('');setRecipeName('');try{setLibrary(readLibrary(localStorage));}catch{setError('Local library is unreadable. Download your result to keep it; existing data is unchanged.');}},[assets]);
  const asset=assets[Math.min(selected,assets.length-1)];
  if(!asset)return null;
  const saved=library.assets.some(a=>a.id===asset.id);
  const recipeId=`recipe-${asset.id}`;
  const recipeSaved=library.recipes.some(r=>r.id===recipeId);
  function action(fn,message){try{setLibrary(fn());setNotice(message);setError('');}catch(e){setError(e.message);setNotice('');}}
  function reuse(){updateDraft(asset.kind,snapshot(asset.recipe));setNotice('Recipe reapplied to the shared controls. No new sample was created.');if(onRevise)onRevise();else router.push(`/${asset.kind}/`);}
  return <div className="result-panel"><div className="sample-disclaimer"><strong>Sample — not AI-generated</strong><span>{asset.kind==='video'?'SVG storyboard placeholder · not playable video':'Original procedural illustration'}</span></div><div className="result-stage"><img src={sampleURL(asset)} alt={`Sample ${asset.kind==='video'?'video storyboard':'image'} ${selected+1}; not AI-generated`} style={{aspectRatio:asset.recipe.aspectRatio.replace(':',' / ')}}/></div>
    {assets.length>1&&<div className="batch-strip" aria-label="Sample outputs">{assets.map((item,i)=><button key={item.id} aria-label={`View sample ${i+1}`} aria-pressed={selected===i} onClick={()=>{setSelected(i);setNotice('');setError('');setRecipeName('');}}><img src={sampleURL(item)} alt=""/><span>{i+1}</span></button>)}</div>}
    <div className="result-actions"><button className="button primary" disabled={downloading} onClick={async()=>{setDownloading(true);setError('');setNotice('');try{await downloadSample(asset);setNotice(asset.kind==='image'?'Sample PNG download started.':'Sample SVG storyboard download started.');}catch(e){setError(e.message||'Download failed. Please try again.');}finally{setDownloading(false);}}}>Download {asset.kind==='video'?'storyboard':'sample'}</button><button className="button secondary" disabled={saved} onClick={()=>action(()=>saveAsset(localStorage,asset),'Saved to Assets on this device.')}>{saved?'Saved to Assets':'Save to Assets'}</button><button className="button secondary" onClick={reuse}>Reuse recipe / revise</button></div>
    <ResultMetadata asset={asset}/><div className="recipe-save"><label htmlFor={`recipe-name-${asset.id}`}>Recipe name<input id={`recipe-name-${asset.id}`} maxLength={80} value={recipeName} placeholder={asset.title} disabled={recipeSaved} onChange={e=>setRecipeName(e.target.value)}/></label><button className="button secondary" disabled={recipeSaved} onClick={()=>action(()=>saveRecipe(localStorage,{id:recipeId,name:recipeName.trim()||asset.title,createdAt:new Date().toISOString(),draft:snapshot(asset.recipe)}),'Recipe saved on this device.')}>{recipeSaved?'Recipe saved':'Save recipe'}</button></div><p className="result-notice" role="status">{notice}</p>{error&&<p className="field-error" role="alert">{error}</p>}<p className="field-help">{saved?'This sample is stored locally. Clearing browser data removes it.':'Not saved yet. Save to Assets or download before refreshing.'}</p></div>;
}
