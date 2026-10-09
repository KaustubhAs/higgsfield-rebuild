import {readLibrary as legacyLibrary} from './library.js';

function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open('frame-studio-library',1);r.onupgradeneeded=()=>r.result.createObjectStore('library');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('Local library storage is unavailable. Download your output to keep it.'));});}
async function transaction(change){
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('library',change?'readwrite':'readonly');const store=tx.objectStore('library');let value;let failure;
    const request=store.get('current');
    request.onsuccess=()=>{try{
      // Import legacy data on the first write; never delete or rewrite the old copy.
      value=request.result||legacyLibrary(localStorage);
      if(value.version!==1||!Array.isArray(value.assets)||!Array.isArray(value.recipes))throw new Error('Local library is unreadable; existing data has been preserved.');
      if(change){change(value);store.put(value,'current');}
    }catch(e){failure=e;tx.abort();}};
    tx.oncomplete=()=>{db.close();resolve(value);};
    tx.onabort=tx.onerror=()=>{db.close();reject(new Error(failure?.message?.startsWith('Your library')?failure.message:change?'Could not save on this device. Storage may be full or blocked. Download your output to keep it.':'Local library could not be read. Existing data has been preserved.'));};
  });
}
export const readLibrary=()=>transaction();
export const saveAsset=(_storage,asset)=>transaction(library=>{if(library.assets.some(a=>a.id===asset.id))return;if(library.assets.length>=40)throw new Error('Your library holds 40 assets. Download and remove an older item before saving.');library.assets.unshift(asset);});
export const saveRecipe=(_storage,recipe)=>transaction(library=>{if(library.recipes.some(r=>r.id===recipe.id))return;if(library.recipes.length>=40)throw new Error('Your library holds 40 recipes. Remove an older recipe before saving.');library.recipes.unshift(recipe);});
export const removeItem=(_storage,collection,id)=>transaction(library=>{library[collection]=library[collection].filter(item=>item.id!==id);});
