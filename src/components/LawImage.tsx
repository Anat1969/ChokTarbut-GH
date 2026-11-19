import { useRef, useState } from 'react';
import { FAMILY_OF } from '../data/families';
import { promptOf, fullPrompt } from '../data/prompts';
import { saveImage, removeImage, restoreImage, imageFromClipboard, useLawImage } from '../lib/images';
import { domainColor } from './DomainBadge';
import FamilyGlyph from './FamilyGlyph';
import type { Law } from '../types';

interface Props {
  law: Law;
  compact?: boolean; // בלי כפתורים: לדיוקן הקצר
}

// שתי מסגרות זו ליד זו: הגרפיקה של המנגנון נשארת תמיד, והתמונה מקבלת מקום משלה.
// העלאה היא גם הדבקה וגם גרירה: לחיצה, Ctrl+V, כפתור "הדבקה", או גרירת קובץ.
export default function LawImage({ law, compact = false }: Props) {
  const image = useLawImage(law.id);
  const prompt = promptOf(law.id);
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const say = (text: string, bad = false) => setNote({ text, bad });

  const take = async (file: Blob | null | undefined) => {
    if (!file) return say('לא נמצאה תמונה. העתיקי תמונה ונסי שוב, או גררי קובץ למסגרת הריקה.', true);
    setBusy(true);
    try {
      const where = await saveImage(law.id, file);
      say(
        where === 'cloud'
          ? 'התמונה נשמרה לתמיד בענן, ומוצגת בכל מכשיר.'
          : 'התמונה נשמרה במכשיר הזה בלבד. ההעלאה לענן נכשלה, ותנוסה שוב בכניסה הבאה.',
        where !== 'cloud',
      );
    } catch {
      say('הקובץ הזה אינו תמונה שאפשר לקרוא. נסי PNG או JPG.', true);
    } finally {
      setBusy(false);
    }
  };

  const paste = async () => {
    try {
      await take(await imageFromClipboard());
    } catch {
      say('הדפדפן לא נתן גישה ללוח. לחצי על המסגרת הריקה ואז Ctrl+V, או גררי את הקובץ.', true);
    }
  };

  const copy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(fullPrompt(prompt));
      say('הפרומפט הועתק. הדביקי אותו במידג\'רני, ואת התמונה שתתקבל הדביקי במסגרת הריקה.');
    } catch {
      setOpen(true);
      say('ההעתקה נחסמה. הפרומפט פתוח למטה, אפשר לסמן ולהעתיק.', true);
    }
  };

  const graphic = (
    <div className="frame frame-static" data-slot="graphic">
      <div className="frame-mat">
        <FamilyGlyph key={law.id} family={FAMILY_OF[law.id]} color={domainColor(law.domain[0])} animate className="h-full w-full" />
      </div>
    </div>
  );

  const slot = (
    <div
      className={`frame ${over ? 'is-over' : ''} ${image.url ? '' : 'frame-empty'}`}
      data-slot="image"
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
      {image.url ? (
        <img src={image.url} alt={prompt?.idea ?? law.name} loading="lazy" />
      ) : (
        <span className="frame-hint">{busy ? 'שומר...' : 'מקום לתמונה'}</span>
      )}
    </div>
  );

  // בדיוקן הקצר: הגרפיקה תמיד, והתמונה רק אם כבר יש
  if (compact) {
    return (
      <div className={`grid gap-2 ${image.url ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {graphic}
        {image.url && slot}
      </div>
    );
  }

  return (
    <figure>
      <div className="grid grid-cols-2 gap-3">
        <div>
          {graphic}
          <p className="meta mt-1.5">הגרפיקה: תרשים המנגנון</p>
        </div>
        <div>
          {slot}
          <p className="meta mt-1.5">{image.url ? (image.local ? 'התמונה: במכשיר הזה בלבד' : 'התמונה: שמורה בענן') : 'התמונה: גרירה, הדבקה או לחיצה'}</p>
        </div>
      </div>
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
        <button className="btn-soft btn-sm" onClick={paste} disabled={busy}>
          הדבקת תמונה
        </button>
        <button className="btn-soft btn-sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'הסתרת הפרומפט' : 'הצגת הפרומפט'}
        </button>
        {image.url &&
          (confirm ? (
            <>
              <button
                className="btn btn-sm bg-red-600 text-white"
                onClick={async () => {
                  setConfirm(false);
                  try {
                    await removeImage(law.id);
                    say('המסגרת רוקנה. התמונה עצמה נשארת שמורה בענן.');
                  } catch {
                    say('ההסרה נכשלה, כי הענן לא זמין כרגע. נסי שוב בעוד דקה.', true);
                  }
                }}
              >
                כן, לרוקן
              </button>
              <button className="btn-soft btn-sm" onClick={() => setConfirm(false)}>
                ביטול
              </button>
            </>
          ) : (
            <button className="btn-soft btn-sm" onClick={() => setConfirm(true)}>
              ריקון המסגרת
            </button>
          ))}
        {image.previous && !image.url && (
          <button
            className="btn btn-sm bg-yellow-300"
            onClick={async () => {
              try {
                await restoreImage(law.id);
                say('התמונה הוחזרה.');
              } catch {
                say('ההחזרה נכשלה, כי הענן לא זמין כרגע. נסי שוב בעוד דקה.', true);
              }
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
      {open && prompt && (
        <p className="mt-2 select-all bg-zinc-100 p-3 text-xs leading-relaxed" dir="rtl">
          {fullPrompt(prompt)}
        </p>
      )}
    </figure>
  );
}
