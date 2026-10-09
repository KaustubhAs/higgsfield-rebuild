import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const flux='@cf/black-forest-labs/flux-1-schnell',sdxl='@cf/stabilityai/stable-diffusion-xl-base-1.0';
// Test fixture only: intercepted HTTP responses, never presented as a live inference test.
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');
test('real models preserve draft, explain capabilities, save and reopen real provenance with partial batch failure',async({page})=>{
  test.skip(!process.env.PLAYWRIGHT_BASE_URL,'Real-provider UI is tested against the production export in Wrangler.');
  const submitted=[];
  await page.route('**/api/generate',async route=>{
    if(route.request().method()==='GET')return route.fulfill({json:{available:true,message:'Cloudflare enabled (test fixture).'}});
    submitted.push(route.request().postDataJSON());
    if(submitted.length===2)return route.fulfill({status:429,json:{error:'Cloudflare quota reached.'}});
    return route.fulfill({contentType:'image/png',body:png});
  });
  await page.goto('/image/');
  await page.getByRole('button',{name:'Advanced',exact:true}).click();
  await page.getByRole('combobox',{name:'Model',exact:true}).selectOption(flux);
  await expect(page.getByRole('combobox',{name:'Aspect ratio',exact:true})).toBeDisabled();
  await expect(page.getByLabel('FLUX output format')).toContainText('FLUX native aspect-ratio controls are unavailable');
  await expect(page.locator('input[type=file]')).toBeDisabled();
  await page.getByLabel('Your prompt').fill('A coffee cup - exact prompt');
  await page.getByRole('button',{name:'Advanced',exact:true}).click();
  await expect(page.getByLabel('Your prompt')).toHaveValue('A coffee cup - exact prompt');
  await page.getByRole('button',{name:'Guided',exact:true}).click();
  await page.getByRole('combobox',{name:'Desired output format',exact:true}).selectOption('native');
  await page.getByLabel('What do you want to create?').fill('A flexible coffee campaign');
  await page.getByRole('button',{name:'Recommend prompt & settings'}).click();
  await expect(page.getByLabel('Your prompt')).toHaveValue('A coffee cup - exact prompt');
  await page.getByRole('button',{name:'Apply recommendation'}).click();
  await page.getByRole('button',{name:'Advanced',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Model',exact:true})).toHaveValue(flux);
  await expect(page.getByRole('combobox',{name:'Aspect ratio',exact:true})).toHaveValue('native');
  await page.getByRole('button',{name:'Advanced',exact:true}).click();
  await page.getByLabel('Your prompt').fill('A coffee cup - exact prompt');
  await page.getByRole('combobox',{name:'Batch size',exact:true}).selectOption('2');
  await page.getByRole('button',{name:'Generate 2 real images',exact:true}).click();
  await expect(page.getByText('Real AI image - Cloudflare',{exact:true})).toBeVisible();
  await expect(page.getByText('Model default - 1 x 1',{exact:true})).toBeVisible(); // actual fixture dimensions, not a claimed model default
  await expect(page.getByText(/1 of 2 outputs completed/)).toBeVisible();
  expect(submitted).toEqual(Array(2).fill({model:flux,input:{prompt:'A coffee cup - exact prompt',steps:4}}));
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download image',exact:true}).click();
  const file=await download;expect(file.suggestedFilename()).toMatch(/^cloudflare-image.*\.png$/);expect([...(await readFile(await file.path())).subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
  await page.getByRole('button',{name:'Save to Assets',exact:true}).click();await expect(page.getByRole('button',{name:'Saved to Assets'})).toBeDisabled();
  await page.getByLabel('Recipe name').fill('Real coffee settings');await page.getByRole('button',{name:'Save recipe',exact:true}).click();await expect(page.getByRole('button',{name:'Recipe saved'})).toBeDisabled();
  await page.goto('/assets/');await page.reload();await expect(page.getByText('Real AI - Cloudflare',{exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Open & reuse recipe'}).click();await expect(page.getByRole('combobox',{name:'Model',exact:true})).toHaveValue(flux);await expect(page.getByText('Real AI image - Cloudflare',{exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Assets',exact:true}).click();await page.getByRole('button',{name:'Recipes (1)',exact:true}).click();await page.getByRole('link',{name:'Apply recipe'}).click();await expect(page.getByLabel('Your prompt')).toHaveValue('A coffee cup - exact prompt');
  await page.getByRole('combobox',{name:'Model',exact:true}).selectOption(sdxl);await page.getByRole('combobox',{name:'Aspect ratio',exact:true}).selectOption('3:4');await page.getByRole('combobox',{name:'Quality',exact:true}).selectOption('high');await page.getByRole('combobox',{name:'Batch size',exact:true}).selectOption('1');
  await page.getByRole('button',{name:'Guided',exact:true}).click();await expect(page.getByText(/Current output format: 3:4/)).toBeVisible();
  await page.getByRole('button',{name:'Generate 1 real image',exact:true}).click();await expect.poll(()=>submitted.length).toBe(3);expect(submitted[2].input).toEqual({prompt:'A coffee cup - exact prompt',width:768,height:1024,num_steps:20});
  await page.goto('/video/');await expect(page.getByRole('combobox',{name:'Model',exact:true}).locator('option')).toHaveCount(2);
});
test('missing credentials require an explicit sample switch',async({page})=>{
  test.skip(!process.env.PLAYWRIGHT_BASE_URL,'Real-provider UI is tested against the production export in Wrangler.');
  let posts=0;await page.route('**/api/generate',route=>{if(route.request().method()==='POST')posts++;return route.fulfill({json:{available:false,message:'Real generation unavailable: server credentials missing.'}});});
  await page.goto('/image/');await page.getByLabel('Your prompt').fill('Keep this prompt');await page.getByRole('button',{name:'Advanced',exact:true}).click();await page.getByRole('combobox',{name:'Model',exact:true}).selectOption(flux);
  await expect(page.getByText(/server credentials missing/)).toBeVisible();await expect(page.getByRole('button',{name:'Generate 1 real image'})).toBeDisabled();expect(posts).toBe(0);
  await page.getByRole('button',{name:'Switch to sample mode'}).click();await expect(page.getByLabel('Your prompt')).toHaveValue('Keep this prompt');await page.getByRole('button',{name:'Generate sample',exact:true}).click();await expect(page.getByText('Sample — not AI-generated',{exact:true})).toBeVisible();
});

test('next dev never requests the real endpoint',async({page})=>{
  test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL),'This guard specifically covers next dev.');
  const requests=[];page.on('request',r=>{if(r.url().includes('/api/generate'))requests.push(r.url());});
  await page.goto('/image/');await page.getByLabel('Your prompt').fill('No network request');await page.getByRole('button',{name:'Advanced',exact:true}).click();
  await page.getByRole('combobox',{name:'Model',exact:true}).selectOption(flux);
  await expect(page.getByText(/next dev is sample-only/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Generate 1 real image'})).toBeDisabled();expect(requests).toHaveLength(0);
});

test('legacy library remains intact when migrated into IndexedDB',async({page})=>{
  await page.goto('/image/');await page.getByLabel('Your prompt').fill('Legacy sample');await page.getByRole('button',{name:'Generate sample',exact:true}).click();
  await page.getByRole('button',{name:'Save to Assets',exact:true}).click();await expect(page.getByRole('button',{name:'Saved to Assets'})).toBeDisabled();
  const legacy=await page.evaluate(async()=>{
    const db=await new Promise(resolve=>{const r=indexedDB.open('frame-studio-library',1);r.onsuccess=()=>resolve(r.result);});
    const data=await new Promise(resolve=>{const r=db.transaction('library').objectStore('library').get('current');r.onsuccess=()=>resolve(r.result);});db.close();
    await new Promise((resolve,reject)=>{const r=indexedDB.deleteDatabase('frame-studio-library');r.onsuccess=resolve;r.onerror=reject;});
    const raw=JSON.stringify(data);localStorage.setItem('frame-studio:library:v1',raw);return raw;
  });
  await page.goto('/assets/');await page.getByRole('link',{name:'Open & reuse recipe'}).click();
  await page.getByRole('button',{name:'Save recipe',exact:true}).click();await expect(page.getByRole('button',{name:'Recipe saved'})).toBeDisabled();
  await page.goto('/assets/');await page.reload();await expect(page.getByRole('link',{name:'Open & reuse recipe'})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('frame-studio:library:v1'))).toBe(legacy);
});
