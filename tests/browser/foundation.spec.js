import { test, expect } from '@playwright/test';

test('template handoff, shared modes, explicit recommendations and refresh persistence', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'What will you create?' })).toBeVisible();
  await page.screenshot({ path: 'test-results/explore-desktop.png', fullPage: true });
  await page.getByRole('link', { name: /Make the everyday iconic/ }).click();
  const prompt = page.getByLabel('Your prompt');
  await expect(prompt).toHaveValue(/sculptural skincare bottle/);
  await page.getByRole('button', { name: 'Advanced', exact: true }).click();
  await prompt.fill('My own café — keep this exact prompt.');
  await page.getByRole('button', { name: 'Guided', exact: true }).click();
  await expect(prompt).toHaveValue('My own café — keep this exact prompt.');
  await page.getByRole('button', { name: 'Suggest a prompt' }).click();
  await expect(prompt).toHaveValue('My own café — keep this exact prompt.');
  await page.getByRole('button', { name: 'Apply suggestion' }).click();
  await expect(prompt).toHaveValue(/studio lighting/);
  await expect(page.getByRole('button', { name: 'Image generation unavailable' })).toBeDisabled();
  const saved = await prompt.inputValue();
  await page.reload();
  await expect(prompt).toHaveValue(saved);
  await page.screenshot({ path: 'test-results/image-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('video template and local reference do not claim generation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Video', exact: true }).click();
  await expect(page.locator('.template-card')).toHaveCount(3);
  await page.getByRole('link', { name: /Give your product a moment/ }).click();
  await expect(page.getByLabel('Motion prompt')).toHaveValue(/camera push/);
  await page.locator('input[type=file]').setInputFiles({ name: 'reference.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64') });
  await expect(page.getByText('Your reference · not a generated video')).toBeVisible();
  await page.getByRole('button', { name: 'Remove reference image' }).click();
  await expect(page.getByText('Choose a starting image')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Video generation unavailable' })).toBeDisabled();
  await page.screenshot({ path: 'test-results/video-desktop.png', fullPage: true });
});

test('all routes work at mobile width without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/image/', '/video/', '/assets/']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.getByRole('link', { name: 'Open Image Studio' }).click();
  await expect(page.getByLabel('Your prompt')).toBeVisible();
  await page.screenshot({ path: 'test-results/image-mobile.png', fullPage: true });
});

test('corrupt saved drafts are not overwritten', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('frame-studio:drafts:v1', '{broken'));
  await page.goto('/image/');
  await expect(page.getByText(/Saved drafts could not be read/)).toBeVisible();
  await page.getByLabel('Your prompt').fill('Still editable');
  expect(await page.evaluate(() => localStorage.getItem('frame-studio:drafts:v1'))).toBe('{broken');
});

test('unknown templates and invalid reference files show useful messages', async ({ page }) => {
  await page.goto('/video/?template=missing');
  await expect(page.getByText('That template is unavailable. Your current draft has been kept.')).toBeVisible();
  await page.locator('input[type=file]').setInputFiles({ name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
  await expect(page.locator('.field-error[role="alert"]')).toHaveText('This file could not be opened as an image. Try another file.');
});
