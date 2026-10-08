import test from 'node:test';
import assert from 'node:assert/strict';
import {blankDraft,applyTemplate,recommend,templateById,templates} from '../lib/templates.js';
import {mockProvider,sampleSVG} from '../lib/generation-provider.js';
import {dimensions,normalizeDraft} from '../lib/creation.js';
import {readLibrary,saveAsset,saveRecipe,libraryKey} from '../lib/library.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};};

test('template handoff preserves mode and defaults are migrated safely',()=>{
  for(const t of templates){const d=applyTemplate({...blankDraft(t.kind),mode:'advanced'},t);assert.equal(d.mode,'advanced');assert.equal(d.prompt,t.prompt);assert.equal(templateById(t.id,t.kind),t);}
  assert.equal(normalizeDraft({kind:'image',prompt:'old'}).model,'mock-studio');
});
test('recommendations are explicit and suggest settings from intent without mutating draft',()=>{
  const d={...blankDraft('video'),goal:'Slow abstract vertical reel, high quality, compare options',prompt:'Keep my café — words'};
  const suggestion=recommend(d);
  assert.equal(suggestion.settings.aspectRatio,'9:16');assert.equal(suggestion.settings.model,'mock-graphic');assert.equal(suggestion.settings.quality,'high');assert.equal(suggestion.settings.batchSize,2);assert.equal(suggestion.settings.duration,6);assert.equal(d.prompt,'Keep my café — words');
});
test('mock batch respects dimensions/settings and snapshots while escaping prompt markup',async()=>{
  const d={...blankDraft('image'),prompt:'<script>café & light</script>',aspectRatio:'4:5',quality:'high',batchSize:4,elements:'glass, leaves'};
  const results=await mockProvider.generate(d,{delay:0});
  assert.equal(results.length,4);assert.equal(new Set(results.map(a=>a.svg)).size,4);
  assert.deepEqual(dimensions(d),{width:1024,height:1280});
  assert.ok(results[0].svg.includes('&lt;script&gt;'));assert.ok(!results[0].svg.includes('<script>'));assert.equal(results[0].provenance,'sample');
  d.prompt='changed';assert.notEqual(results[0].recipe.prompt,d.prompt);
  assert.notEqual(sampleSVG({...d,model:'mock-graphic'},0),sampleSVG(d,0));
});
test('video duration changes storyboard, references are retained, errors and cancel reject',async()=>{
  const d={...blankDraft('video'),prompt:'Move slowly',duration:8};
  const results=await mockProvider.generate(d,{delay:0});assert.ok(results[0].svg.includes('8s / END'));assert.equal(results[0].mime,'image/svg+xml');
  await assert.rejects(mockProvider.generate(d,{delay:0,scenario:'error'}),{code:'UPSTREAM_ERROR'});
  const controller=new AbortController();controller.abort();await assert.rejects(mockProvider.generate(d,{signal:controller.signal}),{code:'CANCELLED'});
  await assert.rejects(mockProvider.generate({...d,aspectRatio:'garbage'},{delay:0}),{code:'UNSUPPORTED_SETTING'});
  await assert.rejects(mockProvider.generate({...d,prompt:''},{delay:0}),{code:'INVALID_INPUT'});
});
test('library saves outputs and recipes without duplicate assets or silent quota failures',async()=>{
  const storage=memory();const [asset]=await mockProvider.generate({...blankDraft('image'),prompt:'test'},{delay:0});
  saveAsset(storage,asset);saveAsset(storage,asset);saveRecipe(storage,{id:'r1',draft:asset.recipe,name:'Recipe'});
  assert.equal(readLibrary(storage).assets.length,1);assert.equal(readLibrary(storage).recipes[0].draft.prompt,'test');
  const blocked={getItem:()=>null,setItem:()=>{throw new Error('quota');}};
  assert.throws(()=>saveAsset(blocked,asset),/Could not save/);
  storage.setItem(libraryKey,'{broken');assert.throws(()=>saveAsset(storage,asset));assert.equal(storage.getItem(libraryKey),'{broken');
});
