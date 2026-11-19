// התמונות של החוקים נשמרות לתמיד בענן: דלי chok-images בפרויקט cultura-GH של Supabase.
// כל תמונה מוקטנת ל-1200 פיקסלים, נשמרת בשם חדש, ונרשמת ביומן chok_images. שום קובץ לא נמחק.
// עותק נשמר גם במכשיר (IndexedDB): הוא מוצג מיד, ומשמש גיבוי אם ההעלאה נכשלה.
import { useEffect, useState } from 'react';
import { supabase, SUPABASE_URL } from './supabase';

const DB = 'chok-images';
const STORE = 'images';
const PUBLIC = `${SUPABASE_URL}/storage/v1/object/public/chok-images/`;

interface Entry {
  url: string | null; // מה שמוצג עכשיו
  path: string | null; // הנתיב בענן, אם יש
  previous: string | null; // הנתיב שהוסר, להחזרה
  local: boolean; // נשמר רק במכשיר
}

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const get = (id: string): Entry => entries.get(id) ?? { url: null, path: null, previous: null, local: false };
const put = (id: string, patch: Partial<Entry>) => {
  entries.set(id, { ...get(id), ...patch });
  emit();
};

// ---------- המכשיר ----------
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function shrink(file: Blob, max = 1200): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('המרת התמונה נכשלה'))), 'image/jpeg', 0.84),
  );
}

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

// ---------- הענן ----------
async function call(body: Record<string, unknown>): Promise<{ path: string | null }> {
  const { data, error } = await supabase.functions.invoke('chok-upload', { body });
  if (error) throw new Error(error.message);
  if (!data || data.error) throw new Error(data?.error ?? 'תשובה ריקה');
  return data;
}

async function upload(id: string, blob: Blob): Promise<void> {
  const { path } = await call({ mode: 'upload', law_id: id, image: await toBase64(blob) });
  put(id, { path, url: PUBLIC + path, local: false });
  tx('readwrite', (s) => s.delete(id)).catch(() => undefined); // העותק במכשיר כבר לא נחוץ
}

// טעינה אחת של היומן: השורה האחרונה לכל חוק קובעת מה מוצג.
// תמונה שנשארה רק במכשיר (מגרסה קודמת, או אחרי העלאה שנכשלה) עולה עכשיו לענן.
let loading: Promise<void> | null = null;
function load(): Promise<void> {
  loading ??= (async () => {
    const latest = new Map<string, string | null>();
    try {
      const { data } = await supabase.from('chok_images').select('law_id,path').order('created_at', { ascending: false }).limit(2000);
      for (const row of data ?? []) if (!latest.has(row.law_id)) latest.set(row.law_id, row.path);
    } catch {
      /* הענן לא זמין: מציגים את מה שבמכשיר */
    }
    for (const [id, path] of latest) put(id, { path, url: path ? PUBLIC + path : null });
    try {
      const keys = (await tx('readonly', (s) => s.getAllKeys())) as string[];
      for (const id of keys) {
        const blob = (await tx('readonly', (s) => s.get(id))) as Blob;
        if (latest.get(id)) continue;
        put(id, { url: URL.createObjectURL(blob), local: true });
        upload(id, blob).catch(() => undefined);
      }
    } catch {
      /* אין אחסון במכשיר */
    }
  })();
  return loading;
}

// ---------- פעולות ----------
export async function saveImage(id: string, file: Blob): Promise<'cloud' | 'local'> {
  if (!file.type.startsWith('image/')) throw new Error('הקובץ אינו תמונה');
  const blob = await shrink(file);
  put(id, { url: URL.createObjectURL(blob), local: true, previous: null });
  await tx('readwrite', (s) => s.put(blob, id)).catch(() => undefined);
  try {
    await upload(id, blob);
    return 'cloud';
  } catch {
    return 'local';
  }
}

// מרוקן את המסגרת. הקובץ עצמו נשאר בענן, ואפשר להחזיר אותו.
export async function removeImage(id: string): Promise<void> {
  const { path } = get(id);
  await tx('readwrite', (s) => s.delete(id)).catch(() => undefined);
  if (path) await call({ mode: 'clear', law_id: id });
  put(id, { url: null, path: null, previous: path, local: false });
}

export async function restoreImage(id: string): Promise<void> {
  const { previous } = get(id);
  if (!previous) return;
  await call({ mode: 'restore', law_id: id, path: previous });
  put(id, { url: PUBLIC + previous, path: previous, previous: null });
}

// תמונה מהלוח: לחיצה על "הדבקה", בלי Ctrl+V
export async function imageFromClipboard(): Promise<Blob | null> {
  const items = await navigator.clipboard.read();
  for (const item of items) {
    const type = item.types.find((t) => t.startsWith('image/'));
    if (type) return item.getType(type);
  }
  return null;
}

export function useLawImage(id: string): Entry {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    load();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return get(id);
}

// כל החוקים שיש להם תמונה, לגלריה
export function useImageIds(): string[] {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    load();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return [...entries].filter(([, e]) => e.url).map(([id]) => id);
}
