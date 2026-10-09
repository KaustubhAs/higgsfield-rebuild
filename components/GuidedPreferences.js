'use client';
import {intendedUses,desiredFormats,desiredStyles} from '../lib/recommendations';
export default function GuidedPreferences({draft,onChange,busy}){
  return <fieldset className="generation-controls guided-preferences" disabled={busy}><legend>Shape your recommendation</legend><div className="control-grid">
    <label>Intended use<select value={draft.intendedUse||'auto'} onChange={e=>onChange({intendedUse:e.target.value})}>{Object.entries(intendedUses).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
    <label>Desired output format<select value={draft.desiredFormat||'auto'} onChange={e=>onChange({desiredFormat:e.target.value})}>{Object.entries(desiredFormats).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
    <label>Visual style<select value={draft.desiredStyle||'auto'} onChange={e=>onChange({desiredStyle:e.target.value})}>{Object.entries(desiredStyles).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
    <label>Creation preference<select value={draft.generationPreference||'auto'} onChange={e=>onChange({generationPreference:e.target.value})}><option value="auto">Real images when available</option><option value="sample">Samples only</option></select></label>
  </div><p className="field-help">These choices shape the next proposal. Your current prompt, model and settings stay unchanged until you review and apply it. Style and intended use become wording in the suggested prompt.</p></fieldset>;
}
