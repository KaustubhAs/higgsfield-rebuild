import test from 'node:test';
import assert from 'node:assert/strict';
import { blankDraft, applyTemplate, recommend, templateById, templates } from '../lib/templates.js';
import { unavailableProvider } from '../lib/generation-provider.js';

test('templates target the correct studio and preserve editing mode', () => {
  for (const template of templates) {
    const draft = applyTemplate({ ...blankDraft(template.kind), mode: 'advanced' }, template);
    assert.equal(draft.prompt, template.prompt);
    assert.equal(draft.mode, 'advanced');
    assert.equal(templateById(template.id, template.kind), template);
    assert.equal(templateById(template.id, template.kind === 'image' ? 'video' : 'image'), undefined);
  }
});
test('recommendations do not silently replace the manual prompt', () => {
  const draft = { ...blankDraft('image'), goal: 'A café — warm light', prompt: 'Keep my words' };
  const result = recommend(draft);
  assert.ok(result.prompt.includes(draft.goal));
  assert.equal(draft.prompt, 'Keep my words');
  assert.equal(recommend(blankDraft('video')), null);
});
test('unavailable provider exposes no pretend capabilities or successful generation', async () => {
  assert.deepEqual(unavailableProvider.getCapabilities('image').models, []);
  assert.equal(unavailableProvider.getCapabilities('video').status, 'unavailable');
  await assert.rejects(unavailableProvider.generate({ prompt: 'test' }), { code: 'UNAVAILABLE' });
});
