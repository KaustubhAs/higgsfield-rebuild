export const models = [{id:'mock-studio',name:'Sample Studio'},{id:'mock-graphic',name:'Sample Graphic'}];
export const ratios = ['1:1','4:5','16:9','9:16'];
export const styles = kind => kind === 'video' ? ['Subtle','Cinematic','Experimental'] : ['Studio','Cinematic','Experimental'];
export const settingsDefaults = {model:'mock-studio',aspectRatio:'1:1',quality:'standard',batchSize:1,duration:4,elements:'',references:[]};
export function normalizeDraft(v, kind = v.kind) {
  return {kind,mode:v.mode === 'advanced' ? 'advanced':'guided',goal:String(v.goal||'').slice(0,1200),prompt:String(v.prompt||'').slice(0,2048),style:styles(kind).includes(v.style)?v.style:styles(kind)[0],templateId:v.templateId||null,customized:Boolean(v.customized),model:models.some(m=>m.id===v.model)?v.model:'mock-studio',aspectRatio:ratios.includes(v.aspectRatio)?v.aspectRatio:'1:1',quality:v.quality==='high'?'high':'standard',batchSize:[1,2,4].includes(Number(v.batchSize))?Number(v.batchSize):1,duration:[4,6,8].includes(Number(v.duration))?Number(v.duration):4,elements:String(v.elements||'').slice(0,300),references:(Array.isArray(v.references)?v.references:[]).filter(r=>typeof r.name==='string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(r.dataUrl) && r.dataUrl.length<100000).slice(0,1).map(r=>({name:r.name.slice(0,150),dataUrl:r.dataUrl,width:Number(r.width),height:Number(r.height)}))};
}
export const elementList = d => d.elements.split(/[,\n]/).map(s=>s.trim()).filter(Boolean).slice(0,10);
export function dimensions(d) {const [w,h]=d.aspectRatio.split(':').map(Number);const size=d.quality==='high'?1280:768;return {width:Math.round(size*w/Math.max(w,h)),height:Math.round(size*h/Math.max(w,h))};}
export const modelName = id => models.find(m=>m.id===id)?.name || 'Unknown sample model';
export const snapshot = draft => structuredClone(normalizeDraft(draft));
