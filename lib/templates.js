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

export const blankDraft = (kind) => ({ kind, mode: 'guided', goal: '', prompt: '', style: kind === 'image' ? 'Studio' : 'Subtle', templateId: null, customized: false });

export function applyTemplate(draft, template) {
  return { ...draft, goal: template.goal, prompt: template.prompt, style: template.style, templateId: template.id, customized: false };
}

export function recommend(draft) {
  const goal = draft.goal.trim();
  if (!goal) return null;
  const direction = draft.kind === 'video'
    ? { Subtle: 'Use one slow, controlled camera movement. Keep the subject stable.', Cinematic: 'Use deliberate cinematic camera movement and consistent natural light.', Experimental: 'Explore an unexpected camera angle with smooth, restrained motion.' }
    : { Studio: 'Use soft directional studio lighting, tactile surfaces and a clean composition.', Cinematic: 'Use atmospheric natural lighting, a deliberate composition and cinematic color.', Experimental: 'Explore sculptural forms, unexpected materials and a restrained surreal composition.' };
  return { prompt: `${goal}\n\n${direction[draft.style]}`, reason: draft.kind === 'video' ? 'One clear movement makes the shot easier to direct. This is a writing template, not an analysis of your image.' : 'A clear subject, lighting direction and composition make this a useful starting brief. This suggestion uses a local writing template, not AI.' };
}
