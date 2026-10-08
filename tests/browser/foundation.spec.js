import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('PNG conversion failure reports an error without downloading from studio or Assets',async({page})=>{
  await page.addInitScript(()=>{HTMLCanvasElement.prototype.toBlob=function(callback){callback(null);};});
  const downloads=[];page.on('download',item=>downloads.push(item));
  await page.goto('/image/');
  await page.getByLabel('Your prompt').fill('Sample for export failure');
  await page.getByRole('button',{name:'Generate sample',exact:true}).click();
  await page.getByRole('button',{name:'Download sample',exact:true}).click();
  await expect(page.getByText(/Could not export this sample as PNG/)).toBeVisible();
  await page.getByRole('button',{name:'Save to Assets',exact:true}).click();
  await page.getByRole('link',{name:'Assets',exact:true}).click();
  await page.getByRole('button',{name:'Download',exact:true}).click();
  await expect(page.getByText(/Could not export this sample as PNG/)).toBeVisible();
  expect(downloads).toHaveLength(0);
});

test('shared controls, recommendations, batch output, download, assets and recipe reuse',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.getByRole('link',{name:/Make the everyday iconic/}).click();
  const prompt=page.getByLabel('Your prompt');await expect(prompt).toHaveValue(/sculptural skincare bottle/);
  await page.getByRole('button',{name:'Advanced',exact:true}).click();await prompt.fill('My café — keep this exact prompt');
  await page.getByRole('combobox',{name:'Aspect ratio',exact:true}).selectOption('16:9');await page.getByRole('combobox',{name:'Batch size',exact:true}).selectOption('2');
  await page.getByRole('button',{name:'Guided',exact:true}).click();await expect(prompt).toHaveValue('My café — keep this exact prompt');await expect(page.getByRole('combobox',{name:'Aspect ratio',exact:true})).toHaveValue('16:9');
  await page.getByLabel('What do you want to create?').fill('An abstract vertical story in high quality with variations');
  await page.getByRole('button',{name:'Recommend prompt & settings'}).click();await expect(prompt).toHaveValue('My café — keep this exact prompt');
  await page.getByRole('button',{name:'Apply recommendation'}).click();await expect(page.getByRole('combobox',{name:'Aspect ratio',exact:true})).toHaveValue('9:16');await expect(page.getByRole('combobox',{name:'Model',exact:true})).toHaveValue('mock-graphic');
  await page.getByLabel('Elements / references',{exact:true}).fill('glass, leaves');
  await page.getByRole('button',{name:'Generate 2 samples',exact:true}).click();await expect(page.getByText('Creating 2 local samples…')).toBeVisible();
  await expect(page.getByRole('button',{name:'View sample 2'})).toBeVisible();await page.getByRole('button',{name:'View sample 2'}).click();
  await expect(page.getByText('Sample — not AI-generated',{exact:true})).toBeVisible();
  const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Download sample',exact:true}).click();const download=await downloadEvent;expect(download.suggestedFilename()).toMatch(/^sample-image-2-.*\.png$/);
  const png=await readFile(await download.path());
  expect([...png.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
  expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([720,1280]);
  const pixelsMatch=await page.locator('.result-stage img').evaluate(async(preview,base64)=>{
    const exported=new Image();exported.src='data:image/png;base64,'+base64;await exported.decode();await preview.decode();
    function pixels(image){const c=document.createElement('canvas');c.width=720;c.height=1280;const ctx=c.getContext('2d');ctx.drawImage(image,0,0,720,1280);return ctx.getImageData(0,0,720,1280).data;}
    const a=pixels(preview),b=pixels(exported);return a.every((value,i)=>Math.abs(value-b[i])<=1)&&new Set(a).size>20;
  },png.toString('base64'));expect(pixelsMatch).toBe(true);
  for(const name of ['Image Studio','Video Studio']) {
    await page.getByRole('link',{name,exact:true}).click();await page.locator('input[type=file]').setInputFiles({name:download.suggestedFilename(),mimeType:'image/png',buffer:png});
    await expect(page.getByText(download.suggestedFilename(),{exact:true})).toBeVisible();
    await expect(page.locator('.reference-field .field-error')).toHaveCount(0);
  }
  await page.getByRole('link',{name:'Image Studio',exact:true}).click();
  await page.getByRole('button',{name:'Save to Assets',exact:true}).click();await expect(page.getByRole('button',{name:'Saved to Assets',exact:true})).toBeDisabled();
  await page.getByLabel('Recipe name').fill('My vertical campaign');await page.getByRole('button',{name:'Save recipe',exact:true}).click();await expect(page.getByRole('button',{name:'Recipe saved',exact:true})).toBeDisabled();
  await page.getByRole('link',{name:'Assets',exact:true}).click();await expect(page.getByRole('heading',{name:/An abstract vertical story/})).toBeVisible();await page.reload();await expect(page.getByRole('link',{name:'Open & reuse recipe'})).toBeVisible();
  await page.getByRole('link',{name:'Open & reuse recipe'}).click();await expect(page.getByRole('combobox',{name:'Batch size',exact:true})).toHaveValue('2');await expect(page.getByLabel('Elements / references',{exact:true})).toHaveValue('glass, leaves');
  await page.getByRole('link',{name:'Assets',exact:true}).click();await page.getByRole('button',{name:/Recipes \(1\)/}).click();await page.getByRole('link',{name:'Apply recipe',exact:true}).click();await expect(page.getByRole('combobox',{name:'Model',exact:true})).toHaveValue('mock-graphic');await expect(page.getByRole('combobox',{name:'Quality',exact:true})).toHaveValue('high');
  await page.screenshot({path:'test-results/milestone2-image.png',fullPage:true});expect(errors).toEqual([]);
});

test('video shares controls, persists references and downloads an honest storyboard',async({page})=>{
  await page.goto('/video/?template=reveal');await expect(page.getByLabel('Motion prompt')).toHaveValue(/camera push/);
  await page.getByRole('button',{name:'Advanced',exact:true}).click();await page.getByRole('combobox',{name:'Duration',exact:true}).selectOption('8');
  await page.locator('input[type=file]').setInputFiles({name:'reference.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64')});
  await expect(page.getByText('reference.png',{exact:true})).toBeVisible();await page.reload();await expect(page.getByText('reference.png',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Guided',exact:true}).click();await expect(page.getByRole('combobox',{name:'Duration',exact:true})).toHaveValue('8');
  await page.getByRole('button',{name:'Generate sample',exact:true}).click();await expect(page.getByText('SVG storyboard placeholder · not playable video')).toBeVisible();await expect(page.getByText('8s storyboard concept')).toBeVisible();
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'Download storyboard'}).click();expect((await event).suggestedFilename()).toMatch(/^sample-video-storyboard.*\.svg$/);
  await page.getByRole('button',{name:'Save to Assets',exact:true}).click();await page.goto('/assets/');await page.getByRole('button',{name:'Video storyboards',exact:true}).click();await page.getByRole('link',{name:'Open & reuse recipe'}).click();await expect(page.getByRole('combobox',{name:'Duration',exact:true})).toHaveValue('8');await expect(page.getByText('reference.png',{exact:true})).toBeVisible();
});

test('all routes fit mobile and empty library has a meaningful action',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const path of ['/','/image/','/video/','/assets/']){await page.goto(path);await expect(page.getByRole('main').getByRole('heading',{level:1})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);}
  await page.getByRole('link',{name:'Open Image Studio'}).click();await page.getByLabel('Your prompt').fill('Mobile sample');await page.getByRole('button',{name:'Generate sample',exact:true}).click();await expect(page.getByRole('button',{name:'Download sample'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.screenshot({path:'test-results/milestone2-mobile.png',fullPage:true});
});

test('corrupt drafts stay intact and unknown templates and invalid images show errors',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('frame-studio:drafts:v1','{broken'));await page.goto('/video/?template=missing');await expect(page.getByText(/Saved drafts could not be read/)).toBeVisible();await expect(page.getByText('That template is unavailable. Your current draft has been kept.')).toBeVisible();
  await page.locator('input[type=file]').setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')});await expect(page.locator('.reference-field .field-error')).toHaveText('This file could not be opened as an image. Try another file.');expect(await page.evaluate(()=>localStorage.getItem('frame-studio:drafts:v1'))).toBe('{broken');
});

test('provider errors and cancellation keep draft intact without fake success',async({page})=>{
  await page.goto('/image/');await page.getByLabel('Your prompt').fill('A preserved draft');await page.getByText('Sample provider testing',{exact:true}).click();await page.getByLabel('Simulate a provider error').check();await page.getByRole('button',{name:'Generate sample',exact:true}).click();await expect(page.getByText(/Simulated provider error/)).toBeVisible();await expect(page.getByRole('button',{name:'Download sample'})).toHaveCount(0);await expect(page.getByLabel('Your prompt')).toHaveValue('A preserved draft');
  await page.getByLabel('Simulate a provider error').uncheck();await page.getByRole('button',{name:'Generate sample',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByText(/Sample creation cancelled/)).toBeVisible();await expect(page.getByRole('button',{name:'Download sample'})).toHaveCount(0);
});

test('blocked library writes do not report saved',async({page})=>{
  await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='frame-studio:library:v1')throw new DOMException('Quota exceeded','QuotaExceededError');return original.call(this,key,value);};});
  await page.goto('/image/');await page.getByLabel('Your prompt').fill('Sample before quota failure');await page.getByRole('button',{name:'Generate sample',exact:true}).click();await page.getByRole('button',{name:'Save to Assets',exact:true}).click();await expect(page.getByText(/Could not save on this device/)).toBeVisible();await expect(page.getByRole('button',{name:'Save to Assets',exact:true})).toBeEnabled();
});
