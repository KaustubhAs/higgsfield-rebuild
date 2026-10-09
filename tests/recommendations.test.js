import test from 'node:test';
import assert from 'node:assert/strict';
import {recommendImage,fluxFormatDisclosure} from '../lib/recommendations.js';
import {FLUX,SDXL,inferenceRequest} from '../lib/capabilities.js';
import {blankDraft} from '../lib/templates.js';
import {snapshot} from '../lib/creation.js';
test('explicit formats and inferred uses require a capable model without mutating draft',()=>{
  const draft={...blankDraft('image'),model:FLUX,goal:'A vertical product campaign',prompt:'Keep my manual prompt'};
  const before=structuredClone(draft);
  for(const ratio of ['1:1','4:5','3:4','16:9','9:16']){
    const proposal=recommendImage({...draft,desiredFormat:ratio},{realAvailable:true});
    assert.equal(proposal.settings.model,SDXL);assert.equal(proposal.settings.aspectRatio,ratio);
    assert.ok(inferenceRequest({...draft,...proposal.settings,prompt:proposal.prompt}).input.width);
  }
  assert.equal(recommendImage(draft,{realAvailable:true}).settings.model,SDXL);
  assert.equal(recommendImage({...draft,desiredFormat:'native'},{realAvailable:true}).settings.model,FLUX);
  assert.deepEqual(draft,before);
});
test('availability, explicit sample preference, style, and intent affect only reviewable proposals',()=>{
  const draft={...blankDraft('image'),goal:'Coffee',intendedUse:'banner',desiredStyle:'Cinematic'};
  const real=recommendImage(draft,{realAvailable:true});assert.equal(real.settings.aspectRatio,'16:9');assert.match(real.prompt,/website banner/);assert.match(real.prompt,/cinematic color/);
  assert.match(recommendImage(draft).settings.model,/^mock-/);
  assert.match(recommendImage({...draft,generationPreference:'sample'},{realAvailable:true}).settings.model,/^mock-/);
  assert.equal(snapshot(draft).intendedUse,'banner');assert.equal(snapshot(draft).desiredStyle,'Cinematic');
});
test('FLUX disclosure reports observations, never invents a guaranteed square size',()=>{
  assert.equal(fluxFormatDisclosure().label,'Model default · 1:1');
  assert.match(fluxFormatDisclosure().evidence,/reported by the project owner/);
  const output=(width,height)=>({provenance:'real',recipe:{model:FLUX},width,height});
  assert.equal(fluxFormatDisclosure([output(1024,1024)]).label,'Model default · 1:1');
  assert.equal(fluxFormatDisclosure([output(1024,1024),output(1024,1024)]).label,'Model default · 1:1');
  assert.match(fluxFormatDisclosure([output(1024,1024),output(1024,768)]).label,/confirmed/);
});
