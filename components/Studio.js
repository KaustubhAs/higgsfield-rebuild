'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDrafts } from './DraftProvider';
import { applyTemplate, recommend, templateById } from '../lib/templates';
import { unavailableProvider } from '../lib/generation-provider';
import ConceptArt from './ConceptArt';
import Icon from './Icons';

export default function Studio({ kind }) {
  const { drafts, updateDraft, ready, storageNotice, reference, setReference } = useDrafts();
  const draft = drafts[kind];
  const isVideo = kind === 'video';
  const router = useRouter();
  const pathname = usePathname();
  const [suggestion, setSuggestion] = useState(null);
  const [notice, setNotice] = useState('');
  const [fileError, setFileError] = useState('');
  const [reading, setReading] = useState(false);
  const fileInput = useRef(null);
  const fileRequest = useRef(0);
  const lastTemplate = useRef('');
  const capability = unavailableProvider.getCapabilities(kind);
  const selectedTemplate = templateById(draft.templateId, kind);
  useEffect(() => {
    if (!ready) return;
    const id = new URLSearchParams(window.location.search).get('template');
    if (!id || lastTemplate.current === `${kind}:${id}`) return;
    lastTemplate.current = `${kind}:${id}`;
    const template = templateById(id, kind);
    if (template) { updateDraft(kind, applyTemplate(draft, template)); setNotice(`“${template.category}” starting point applied to your draft.`); }
    else setNotice('That template is unavailable. Your current draft has been kept.');
    router.replace(pathname, { scroll: false });
  }, [ready, kind, pathname, router, draft, updateDraft]);
  useEffect(() => () => { fileRequest.current += 1; }, []);
  function edit(patch) { updateDraft(kind, { ...patch, customized: true }); setSuggestion(null); setNotice(''); }
  async function loadReference(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const ticket = ++fileRequest.current;
    setFileError('');
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setFileError('Choose a JPEG, PNG or WebP image smaller than 5 MB.'); return; }
    setReading(true);
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      if (ticket !== fileRequest.current) { URL.revokeObjectURL(url); return; }
      setReference({ url, name: file.name, width: image.naturalWidth, height: image.naturalHeight });
    } catch { URL.revokeObjectURL(url); if (ticket === fileRequest.current) setFileError('This file could not be opened as an image. Try another file.'); }
    finally { if (ticket === fileRequest.current) setReading(false); }
  }
  if (!ready) return <div className="page loading-state" role="status"><span className="spinner" />Restoring your draft…</div>;
  return <div className="page studio-page"><div className="page-heading"><div><p className="eyebrow">{isVideo ? 'GIVE YOUR IDEA A SENSE OF MOTION' : 'FROM A FIRST THOUGHT TO A CLEAR VISION'}</p><h1>{isVideo ? 'Video' : 'Image'} Studio<span className="heading-dot">.</span></h1></div><span className="draft-status"><span />{storageNotice ? 'Draft in this tab' : 'Draft saved on this device'}</span></div>
    {storageNotice && <p className="notice warning" role="status">{storageNotice}</p>}
    <div className={`studio-grid ${isVideo ? 'video-workspace' : ''}`}><section className="config-panel" aria-label={`${kind} configuration`}><div className="config-top"><span className="panel-title"><Icon name={kind} size={18} />{isVideo ? 'Shape your shot' : 'Shape your image'}</span><span className="small-label">DRAFT</span></div>
      <div className="mode-switch" aria-label="Editing mode">{['guided','advanced'].map((mode) => <button key={mode} aria-pressed={draft.mode === mode} onClick={() => updateDraft(kind, { mode })}><Icon name={mode === 'guided' ? 'explore' : 'sliders'} size={15} />{mode === 'guided' ? 'Guided' : 'Advanced'}</button>)}</div>
      <div className="mode-description"><h2>{draft.mode === 'guided' ? 'Start with the idea.' : 'Make it your own.'}</h2><p>{draft.mode === 'guided' ? 'Tell us the direction. We’ll help you shape a clearer brief.' : 'Edit the exact prompt. Your changes stay with you in either mode.'}</p></div>
      {isVideo && <div className="reference-field"><label htmlFor="reference">Starting image <span>Optional</span></label><input ref={fileInput} id="reference" type="file" accept="image/png,image/jpeg,image/webp" onChange={loadReference} className="file-input" />{reference ? <div className="reference-selected"><img src={reference.url} alt="Your selected starting reference" /><div><strong>{reference.name}</strong><span>{reference.width} × {reference.height} · Local only</span></div><button className="icon-button" aria-label="Remove reference image" onClick={() => { fileRequest.current += 1; setReading(false); setReference(null); }}><Icon name="close" size={16} /></button></div> : <button className="upload-zone" onClick={() => fileInput.current?.click()} disabled={reading}><Icon name="upload" size={23} /><strong>{reading ? 'Opening image…' : 'Choose a starting image'}</strong><span>JPEG, PNG or WebP · up to 5 MB</span></button>}<p className="field-help">Stays in this tab. No upload or image analysis.</p>{fileError && <p className="field-error" role="alert">{fileError}</p>}</div>}
      {draft.mode === 'guided' && <><div className="field"><label htmlFor={`${kind}-goal`}>{isVideo ? 'What happens in your shot?' : 'What do you want to create?'}</label><textarea id={`${kind}-goal`} value={draft.goal} maxLength={1200} onChange={(event) => edit({ goal: event.target.value })} placeholder={isVideo ? 'A slow push toward a bottle as the light shifts…' : 'A minimal skincare campaign with warm light and natural textures…'} rows={4} /><div className="field-meta"><span>Be as specific or as open as you like.</span><span>{draft.goal.length}/1200</span></div></div><fieldset className="style-field"><legend>{isVideo ? 'Motion direction' : 'Creative direction'}</legend><div className="style-options">{(isVideo ? ['Subtle','Cinematic','Experimental'] : ['Studio','Cinematic','Experimental']).map((style) => <button key={style} aria-pressed={draft.style === style} onClick={() => edit({ style })}>{style}</button>)}</div></fieldset><button className="button secondary full" disabled={!draft.goal.trim()} onClick={() => { setSuggestion(recommend(draft)); setNotice(''); }}><Icon name="explore" size={17} />Suggest a prompt</button><p className="field-help">Local writing guidance. No AI request.</p></>}
      {suggestion && <section className="suggestion" aria-label="Suggested prompt"><p className="eyebrow">REVIEW BEFORE APPLYING</p><p className="suggested-prompt">{suggestion.prompt}</p><p>{suggestion.reason}</p><div className="action-row"><button className="button primary compact" onClick={() => { updateDraft(kind, { prompt: suggestion.prompt.slice(0,2048), customized: false }); setSuggestion(null); setNotice('Suggested prompt applied. You can still edit every word.'); }}>Apply suggestion</button><button className="text-button" onClick={() => setSuggestion(null)}>Dismiss</button></div></section>}
      <div className="field prompt-field"><label htmlFor={`${kind}-prompt`}>{isVideo ? 'Motion prompt' : 'Your prompt'}{draft.customized && <span className="customized">Customized</span>}</label><textarea id={`${kind}-prompt`} value={draft.prompt} onChange={(event) => edit({ prompt: event.target.value })} maxLength={2048} rows={draft.mode === 'advanced' ? 8 : 4} placeholder="Your editable prompt will appear here. You can also write it yourself." /><div className="field-meta"><span>{draft.mode === 'advanced' ? 'Full manual prompt control' : 'Shared with Advanced Mode'}</span><span>{draft.prompt.length}/2048</span></div></div>
      {draft.mode === 'advanced' && <div className="provider-settings"><label>Model & configuration</label><div><Icon name="info" size={18} /><span>No model connected</span></div><p>Model choices and supported settings will appear when a provider is connected. No seed, resolution or other unsupported controls are simulated.</p></div>}
      <div className="draft-notice" role="status">{notice}</div><div className="generate-section"><button className="button primary full" disabled aria-describedby={`${kind}-unavailable`}><Icon name={kind} size={18} />{isVideo ? 'Video' : 'Image'} generation unavailable</button><p id={`${kind}-unavailable`}>{capability.message}</p></div>
    </section><section className="preview-panel" aria-label={`${kind} preview`}><div className="preview-toolbar"><span><Icon name={isVideo ? 'video' : 'image'} size={16} />{isVideo && reference ? 'Reference image' : 'Creative canvas'}</span><span className="small-label">{isVideo ? 'VIDEO CONCEPT' : 'IMAGE CONCEPT'}</span></div><div className="preview-body">{isVideo && reference ? <><div className="uploaded-preview"><img src={reference.url} alt="Starting image for your video concept" /></div><span className="illustration-label">Your reference · not a generated video</span><h2>Set the scene. Describe the motion.</h2><p>Your image is ready as a local reference.<br />Video inference is not connected in this milestone.</p></> : <><div className={`preview-art ${isVideo ? 'film-frame' : ''}`}><ConceptArt variant={selectedTemplate?.art || (isVideo ? 'arch' : 'product')} /></div><span className="illustration-label">Original concept illustration · not an AI output</span><h2>{isVideo ? 'A great shot starts with a direction.' : 'Give your idea room to take shape.'}</h2><p>{isVideo ? 'Choose a reference and describe a single moment of movement.' : 'Write a brief, explore a direction, and make the prompt your own.'}<br />{isVideo ? 'No video has been generated.' : 'Your generated image will appear here when generation is connected.'}</p></>}<div className="canvas-steps"><span className="current"><b>01</b> Shape the brief</span><span><b>02</b> Generate later</span><span><b>03</b> Make it yours</span></div></div><div className="preview-footer"><Icon name="info" size={16} /><span>Looking for a starting point?</span><Link href="/">Explore templates <Icon name="arrow" size={15} /></Link></div></section></div></div>;
}
