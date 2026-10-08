import { settingsDefaults } from './creation.js';
export const templates = [
  { id: 'product', kind: 'image', title: 'Make the everyday iconic', category: 'Product story', art: 'product', color: 'olive', goal: 'A sculptural skincare bottle on a stone plinth, lit like a luxury campaign.', style: 'Studio', prompt: 'A sculptural skincare bottle on a pale stone plinth. Minimal composition, soft directional studio light, tactile surfaces, editorial product photography, no text.' },
  { id: 'architecture', kind: 'image', title: 'Find a quieter world', category: 'Cinematic scene', art: 'arch', color: 'clay', goal: 'A sun-washed desert pavilion with a quiet, cinematic atmosphere.', style: 'Cinematic', prompt: 'An empty desert pavilion with monumental arches, warm terracotta walls and long afternoon shadows. Quiet cinematic composition, natural textures, warm film tones.' },
  { id: 'abstract', kind: 'image', title: 'Go beyond the ordinary', category: 'Abstract art', art: 'orb', color: 'violet', goal: 'An iridescent sculpture suspended in a surreal violet space.', style: 'Experimental', prompt: 'An iridescent spherical sculpture floating above a dark violet surface. Surreal editorial still life, sculptural highlights, restrained composition, rich material detail.' },
  { id: 'reveal', kind: 'video', title: 'Give your product a moment', category: 'Product reveal', art: 'product', color: 'olive', goal: 'A slow camera push toward a product with a gentle shift in the light.', style: 'Subtle', prompt: 'Slow, steady camera push toward the product. A soft light passes across its surface. Keep the subject stable and the movement understated.' },
  { id: 'journey', kind: 'video', title: 'Let the scene unfold', category: 'Cinematic motion', art: 'arch', color: 'clay', goal: 'A gentle tracking shot through a sunlit architectural space.', style: 'Cinematic', prompt: 'A slow lateral tracking shot through the architectural space. Preserve its geometry, with soft atmospheric movement and warm, consistent light.' },
  { id: 'orbit', kind: 'video', title: 'Explore another perspective', category: 'Abstract motion', art: 'orb', color: 'violet', goal: 'A smooth orbit around a floating sculptural object.', style: 'Experimental', prompt: 'A gentle camera orbit around the floating sculpture. Maintain the shape of the object as reflections shift slowly across its surface.' },
];

export function templateById(id, kind) {
  return templates.find((template) => template.id === id && template.kind === kind);
}

export const blankDraft = (kind) => ({ ...settingsDefaults, references: [], kind, mode: 'guided', goal: '', prompt: '', style: kind === 'image' ? 'Studio' : 'Subtle', templateId: null, customized: false });

export function applyTemplate(draft, template) {
  return { ...draft, goal: template.goal, prompt: template.prompt, style: template.style, aspectRatio: template.kind === 'video' ? '16:9' : template.art === 'product' ? '4:5' : '1:1', model: template.art === 'orb' ? 'mock-graphic' : 'mock-studio', templateId: template.id, customized: false };
}

export function recommend(draft) {
  const goal = draft.goal.trim();
  if (!goal) return null;
  const direction = draft.kind === 'video'
    ? { Subtle: 'Use one slow, controlled camera movement. Keep the subject stable.', Cinematic: 'Use deliberate cinematic camera movement and consistent natural light.', Experimental: 'Explore an unexpected camera angle with smooth, restrained motion.' }
    : { Studio: 'Use soft directional studio lighting, tactile surfaces and a clean composition.', Cinematic: 'Use atmospheric natural lighting, a deliberate composition and cinematic color.', Experimental: 'Explore sculptural forms, unexpected materials and a restrained surreal composition.' };
  const portrait = /portrait|vertical|story|reel|phone/i.test(goal);
  const wide = /landscape|wide|cinema|panorama/i.test(goal);
  const product = /product|bottle|skincare|studio/i.test(goal);
  const abstract = /abstract|surreal|experimental/i.test(goal);
  const style = abstract ? 'Experimental' : wide ? 'Cinematic' : draft.kind === 'video' ? 'Subtle' : 'Studio';
  const settings = {model:abstract?'mock-graphic':'mock-studio',aspectRatio:portrait?'9:16':wide||draft.kind==='video'?'16:9':product?'4:5':'1:1',quality:/detail|print|high quality/i.test(goal)?'high':'standard',batchSize:/variations|options|compare/i.test(goal)?2:1,style,duration:/slow|gentle/i.test(goal)?6:4};
  return {prompt:`${goal}\n\n${direction[style]}`,settings,reason:`${portrait?'A tall frame suits a phone-first idea.':wide||draft.kind==='video'?'A wide frame gives the scene breathing room.':product?'A portrait frame keeps the product in focus.':'A square frame is a versatile starting point.'} ${abstract?'Graphic samples suit abstract shapes.':'Studio samples suit a composed scene.'} ${settings.quality==='high'?'High quality uses a larger SVG canvas.':'Standard keeps the sample compact.'} ${settings.batchSize===2?'Two variations offer a comparison.':'Start with one output to stay focused.'} ${draft.kind==='video'?`${settings.duration} seconds leaves room for the motion. `:''}Local rules only, not AI or image analysis. References are kept.`};
}
