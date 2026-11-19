// התמונות של החוקים נשמרות במכשיר (IndexedDB), אחרי הקטנה ל-1200 פיקסלים.
// כך אפשר להדביק תמונה גם בלי כניסה. התמונות לא עוברות לענן.
import { useEffect, useState } from 'react';

const DB = 'chok-images';
const STORE = 'images';
const urls = new Map<string, string | null>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

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
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('המרת התמונה נכשלה'))), 'image/jpeg', 0.86),
  );
}

function set(id: string, blob: Blob | null) {
  const old = urls.get(id);
  if (old) URL.revokeObjectURL(old);
  urls.set(id, blob ? URL.createObjectURL(blob) : null);
  emit();
}

export async function saveImage(id: string, file: Blob): Promise<void> {
  if (!file.type.startsWith('image/')) throw new Error('הקובץ אינו תמונה');
  const blob = await shrink(file);
  await tx('readwrite', (s) => s.put(blob, id));
  set(id, blob);
}

export async function removeImage(id: string): Promise<Blob | null> {
  const blob = ((await tx('readonly', (s) => s.get(id))) as Blob | undefined) ?? null;
  await tx('readwrite', (s) => s.delete(id));
  set(id, null);
  return blob;
}

export async function restoreImage(id: string, blob: Blob): Promise<void> {
  await tx('readwrite', (s) => s.put(blob, id));
  set(id, blob);
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

export function useLawImage(id: string): string | null {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    if (!urls.has(id)) {
      urls.set(id, null);
      tx('readonly', (s) => s.get(id))
        .then((blob) => blob && set(id, blob as Blob))
        .catch(() => undefined);
    }
    return () => {
      listeners.delete(l);
    };
  }, [id]);
  return urls.get(id) ?? null;
}
