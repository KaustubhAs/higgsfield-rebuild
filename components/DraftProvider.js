'use client';
import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import {blankDraft} from '../lib/templates';
import {normalizeDraft} from '../lib/creation';
const Context=createContext(null);
const key='frame-studio:drafts:v1';
export default function DraftProvider({children}) {
  const [drafts,setDrafts]=useState({image:blankDraft('image'),video:blankDraft('video')});
  const [outputs,setOutputs]=useState({image:[],video:[]});
  const [ready,setReady]=useState(false);
  const [storageNotice,setStorageNotice]=useState('');
  useEffect(()=>{
    try {const raw=localStorage.getItem(key);if(raw){const saved=JSON.parse(raw);if(saved.version!==1||!saved.image||!saved.video) throw new Error();setDrafts({image:normalizeDraft(saved.image,'image'),video:normalizeDraft(saved.video,'video')});}}
    catch {setStorageNotice('Saved drafts could not be read. Your edits will stay in this tab; existing saved data has not been replaced.');}
    setReady(true);
  },[]);
  useEffect(()=>{if(!ready||storageNotice)return;try{localStorage.setItem(key,JSON.stringify({version:1,...drafts}));}catch{setStorageNotice('Browser storage is unavailable. Your drafts will stay in this tab only.');}},[drafts,ready,storageNotice]);
  const updateDraft=useCallback((kind,patch)=>setDrafts(previous=>({...previous,[kind]:{...previous[kind],...patch}})),[]);
  const updateOutputs=useCallback((kind,items)=>setOutputs(previous=>({...previous,[kind]:items})),[]);
  return <Context.Provider value={{drafts,updateDraft,outputs,updateOutputs,ready,storageNotice}}>{children}</Context.Provider>;
}
export const useDrafts=()=>useContext(Context);
