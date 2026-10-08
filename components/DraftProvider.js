'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { blankDraft } from '../lib/templates';

const Context = createContext(null);
const key = 'frame-studio:drafts:v1';
export default function DraftProvider({ children }) {
  const [drafts, setDrafts] = useState({ image: blankDraft('image'), video: blankDraft('video') });
  const [ready, setReady] = useState(false);
  const [storageNotice, setStorageNotice] = useState('');
  const [reference, setReference] = useState(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.version !== 1) throw new Error('Unknown draft format');
        const next = {};
        for (const kind of ['image', 'video']) {
          const value = saved[kind];
          if (!value || typeof value.prompt !== 'string' || typeof value.goal !== 'string') throw new Error('Invalid draft');
          next[kind] = { ...blankDraft(kind), goal: value.goal.slice(0, 1200), prompt: value.prompt.slice(0, 2048), mode: value.mode === 'advanced' ? 'advanced' : 'guided', style: (kind === 'image' ? ['Studio','Cinematic','Experimental'] : ['Subtle','Cinematic','Experimental']).includes(value.style) ? value.style : blankDraft(kind).style, templateId: typeof value.templateId === 'string' ? value.templateId : null, customized: Boolean(value.customized) };
        }
        setDrafts(next);
      }
    } catch { setStorageNotice('Saved drafts could not be read. Your edits will stay in this tab; existing saved data has not been replaced.'); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || storageNotice) return;
    try { localStorage.setItem(key, JSON.stringify({ version: 1, ...drafts })); }
    catch { setStorageNotice('Browser storage is unavailable. Your drafts will stay in this tab only.'); }
  }, [drafts, ready, storageNotice]);
  useEffect(() => () => { if (reference) URL.revokeObjectURL(reference.url); }, [reference]);
  function updateDraft(kind, patch) { setDrafts((previous) => ({ ...previous, [kind]: { ...previous[kind], ...patch } })); }
  return <Context.Provider value={{ drafts, updateDraft, ready, storageNotice, reference, setReference }}>{children}</Context.Provider>;
}
export function useDrafts() { return useContext(Context); }
