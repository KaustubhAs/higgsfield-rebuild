export const libraryKey = 'frame-studio:library:v1';
export function readLibrary(storage) {
  const raw=storage.getItem(libraryKey);
  if(!raw) return {version:1,assets:[],recipes:[]};
  const value=JSON.parse(raw);
  if(value.version!==1 || !Array.isArray(value.assets) || !Array.isArray(value.recipes) || !value.assets.every(a=>a.id && a.recipe && typeof a.svg==='string' && a.provenance==='sample') || !value.recipes.every(r=>r.id && r.draft)) throw new Error('Local library could not be read. Existing data has been preserved.');
  return value;
}
function write(storage,value) {
  const raw=JSON.stringify(value);
  if(raw.length>1800000) throw new Error('Local library is full. Download your work and remove older items before saving.');
  try {storage.setItem(libraryKey,raw);} catch {throw new Error('Could not save on this device. Browser storage may be full or blocked. Download your sample to keep it.');}
}
export function saveAsset(storage,asset) {
  const library=readLibrary(storage);
  if(library.assets.some(a=>a.id===asset.id)) return library;
  if(library.assets.length>=40) throw new Error('Your library holds 40 assets. Download and remove an older asset before saving.');
  library.assets.unshift(asset);write(storage,library);return library;
}
export function saveRecipe(storage,recipe) {
  const library=readLibrary(storage);
  if(library.recipes.some(r=>r.id===recipe.id)) return library;
  if(library.recipes.length>=40) throw new Error('Your library holds 40 recipes. Remove an older recipe before saving.');
  library.recipes.unshift(recipe);write(storage,library);return library;
}
export function removeItem(storage,collection,id) {const library=readLibrary(storage);library[collection]=library[collection].filter(item=>item.id!==id);write(storage,library);return library;}
