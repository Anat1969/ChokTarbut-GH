import { useRef, useState } from 'react';
import { FAMILY_OF } from '../data/families';
import { promptOf, fullPrompt } from '../data/prompts';
import { saveImage, removeImage, restoreImage, imageFromClipboard, useLawImage } from '../lib/images';
import { domainColor } from './DomainBadge';
import FamilyGlyph from './FamilyGlyph';
import type { Law } from '../types';

interface Props {
  law: Law;
  compact?: boolean; // מסגרת קטנה, בלי כפתורים: לדיוקן הקצר
}

// המסגרת של החוק: עד שמודבקת תמונה, מוצג תרשים המנגנון של המשפחה שלו.
// העלאה היא גם הדבקה וגם גרירה: לחיצה, Ctrl+V, כפתור "הדבקה", או גרירת קובץ.
export default function LawImage({ law, compact = false }: Props) {
  const url = useLawImage(law.id);
  const prompt = promptOf(law.id);
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [undo, setUndo] = useState<Blob | null>(null);

  const say = (text: string, bad = false) => setNote({ text, bad });

  const take = async (file: Blob | null | undefined) => {
    if (!file) return say('לא נמצאה תמונה. העתיקי תמונה ונסי שוב, או גררי קובץ למסגרת.', true);
    try {
      await saveImage(law.id, file);
      setUndo(null);
      say('התמונה נשמרה במכשיר הזה.');
    } catch {
      say('הקובץ הזה אינו תמונה שאפשר לקרוא. נסי PNG או JPG.', true);
    }
  };

  const paste = async () => {
    try {
      await take(await imageFromClipboard());
    } catch {
      say('הדפדפן לא נתן גישה ללוח. לחצי על המסגרת ואז Ctrl+V, או גררי את הקובץ.', true);
    }
  };

  const copy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(fullPrompt(prompt));
      say('הפרומפט הועתק. הדביקי אותו במידג\'רני, ואת התמונה שתתקבל הדביקי כאן.');
    } catch {
      setOpen(true);
      say('ההעתקה נחסמה. הפרומפט פתוח למטה, אפשר לסמן ולהעתיק.', true);
    }
  };

  const frame = (
    <div
      className={`frame ${over ? 'is-over' : ''}`}
      tabIndex={compact ? -1 : 0}
      role={compact ? undefined : 'button'}
      aria-label={compact ? undefined : `מסגרת התמונה של ${law.name}. לחיצה בוחרת קובץ, והדבקה מדביקה תמונה`}
      onClick={() => !compact && input.current?.click()}
      onKeyDown={(e) => {
        if (!compact && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          input.current?.click();
        }
      }}
      onPaste={(e) => {
        const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith('image/'));
        if (file) {
          e.preventDefault();
          take(file);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files[0]);
      }}
    >
      {url ? (
        <img src={url} alt={prompt?.idea ?? law.name} />
      ) : (
        <div className="frame-mat">
          <FamilyGlyph key={law.id} family={FAMILY_OF[law.id]} color={domainColor(law.domain[0])} animate className="h-full w-full" />
        </div>
      )}
    </div>
  );

  if (compact) return frame;

  return (
    <figure>
      {frame}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {prompt && (
        <figcaption className="mt-3">
          <p className="label">הפרשנות הוויזואלית</p>
          <p className="text-base font-semibold leading-snug">{prompt.idea}</p>
        </figcaption>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button className="btn-primary btn-sm" onClick={copy}>
          העתקת הפרומפט
        </button>
        <button className="btn-soft btn-sm" onClick={paste}>
          הדבקת תמונה
        </button>
        <button className="btn-soft btn-sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'הסתרת הפרומפט' : 'הצגת הפרומפט'}
        </button>
        {url &&
          (confirm ? (
            <>
              <button
                className="btn btn-sm bg-red-600 text-white"
                onClick={async () => {
                  setUndo(await removeImage(law.id));
                  setConfirm(false);
                  say('התמונה הוסרה.');
                }}
              >
                כן, להסיר
              </button>
              <button className="btn-soft btn-sm" onClick={() => setConfirm(false)}>
                ביטול
              </button>
            </>
          ) : (
            <button className="btn-soft btn-sm" onClick={() => setConfirm(true)}>
              הסרת התמונה
            </button>
          ))}
        {undo && (
          <button
            className="btn btn-sm bg-yellow-300"
            onClick={async () => {
              await restoreImage(law.id, undo);
              setUndo(null);
              say('התמונה הוחזרה.');
            }}
          >
            החזרת התמונה
          </button>
        )}
      </div>
      {note && (
        <p className={`mt-2 text-xs ${note.bad ? 'problem' : 'solution'}`} role="status">
          {note.text}
        </p>
      )}
      {!url && !note && <p className="meta mt-2">עד שתודבק תמונה, המסגרת מציגה את תרשים המנגנון של המשפחה. גרירה, הדבקה או לחיצה על המסגרת.</p>}
      {open && prompt && (
        <p className="mt-2 select-all bg-zinc-100 p-3 text-xs leading-relaxed" dir="rtl">
          {fullPrompt(prompt)}
        </p>
      )}
    </figure>
  );
}
