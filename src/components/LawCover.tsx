import { useRef, useState } from 'react';
import { FAMILY_OF, familyOf } from '../data/families';
import { promptOf, fullPrompt } from '../data/prompts';
import { saveImage, removeImage, restoreImage, imageFromClipboard, useLawImage } from '../lib/images';
import DomainBadge, { domainColor } from './DomainBadge';
import Evidence from './Evidence';
import FamilyGlyph from './FamilyGlyph';
import type { Law } from '../types';

interface Props {
  law: Law;
  className?: string;
}

// השער של חוק, כמו שער מגזין. שני לוחות באותה קומפוזיציה: מראה גדול, והטקסט עליו בתחתית.
//   משמאל, הגדול: התמונה, ועליה שם החוק והפרשנות הוויזואלית.
//   מימין: הגרפיקה של המנגנון, ועליה טקסט המנגנון.
// העלאה היא גם הדבקה וגם גרירה: לחיצה, Ctrl+V, כפתור "הדבקה", או גרירת קובץ.
export default function LawCover({ law, className = '' }: Props) {
  const image = useLawImage(law.id);
  const prompt = promptOf(law.id);
  const family = familyOf(law.id);
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const has = Boolean(image.url);

  const say = (text: string, bad = false) => setNote({ text, bad });

  const take = async (file: Blob | null | undefined) => {
    if (!file) return say('לא נמצאה תמונה. העתיקי תמונה ונסי שוב, או גררי קובץ אל השער.', true);
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
      say('הדפדפן לא נתן גישה ללוח. לחצי על השער ואז Ctrl+V, או גררי את הקובץ.', true);
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

  return (
    <header className={`cover ${className}`}>
      {/* לוח התמונה */}
      <section
        className={`cover-panel cover-image ${has ? 'has-image' : 'is-empty'} ${over ? 'is-over' : ''}`}
        data-slot="image"
        tabIndex={0}
        aria-label={`השער של ${law.name}. הדבקה או גרירה מוסיפות תמונה`}
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
        {has && <img src={image.url!} alt={prompt?.idea ?? law.name} className="cover-bg" />}
        {!has && (
          <button className="cover-hint" onClick={() => input.current?.click()}>
            {busy ? 'שומר...' : 'מקום לתמונה: גרירה, הדבקה או לחיצה'}
          </button>
        )}
        <div className="cover-text">
          <h1 className="cover-title">{law.name}</h1>
          {law.name_en && (
            <p className="cover-en" dir="ltr">
              {law.name_en}
            </p>
          )}
          {prompt && <p className="cover-lead">{prompt.idea}</p>}
          <div className="mt-4 flex flex-wrap gap-1.5">
            <button className="cover-btn is-main" onClick={copy}>
              העתקת הפרומפט
            </button>
            <button className="cover-btn" onClick={paste} disabled={busy}>
              הדבקת תמונה
            </button>
            <button className="cover-btn" onClick={() => input.current?.click()} disabled={busy}>
              {has ? 'החלפת התמונה' : 'בחירת קובץ'}
            </button>
            <button className="cover-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? 'הסתרת הפרומפט' : 'הצגת הפרומפט'}
            </button>
            {has &&
              (confirm ? (
                <>
                  <button
                    className="cover-btn !bg-red-600 !text-white"
                    onClick={async () => {
                      setConfirm(false);
                      try {
                        await removeImage(law.id);
                        say('השער רוקן. התמונה עצמה נשארת שמורה בענן.');
                      } catch {
                        say('הריקון נכשל, כי הענן לא זמין כרגע. נסי שוב בעוד דקה.', true);
                      }
                    }}
                  >
                    כן, לרוקן
                  </button>
                  <button className="cover-btn" onClick={() => setConfirm(false)}>
                    ביטול
                  </button>
                </>
              ) : (
                <button className="cover-btn" onClick={() => setConfirm(true)}>
                  ריקון השער
                </button>
              ))}
            {image.previous && !has && (
              <button
                className="cover-btn !bg-yellow-300 !text-black"
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
            <p className={`cover-note ${note.bad ? 'is-bad' : ''}`} role="status">
              {note.text}
            </p>
          )}
          {has && !note && <p className="cover-note">{image.local ? 'התמונה שמורה במכשיר הזה בלבד' : 'התמונה שמורה בענן'}</p>}
          {open && prompt && (
            <p className="mt-2 max-h-28 select-all overflow-auto bg-white p-3 text-xs leading-relaxed text-black" dir="rtl">
              {fullPrompt(prompt)}
            </p>
          )}
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
      </section>

      {/* לוח המנגנון: אותה קומפוזיציה. הגרפיקה גדולה, והטקסט עליה בתחתית */}
      <section className="cover-panel cover-mech" data-slot="graphic">
        <div className="cover-top">
          <div className="flex flex-wrap items-center gap-1.5">
            {law.domain.map((d) => (
              <DomainBadge key={d} domain={d} />
            ))}
            <Evidence value={law.evidence_strength} showLabel />
          </div>
          <p className="cover-def">{law.definition}</p>
        </div>
        <div className="cover-glyph">
          <FamilyGlyph key={law.id} family={FAMILY_OF[law.id]} color={domainColor(law.domain[0])} animate className="h-full w-full" />
        </div>
        <div className="cover-text">
          <p className="cover-kicker">המנגנון{family ? ` · ${family.name}` : ''}</p>
          <p className="cover-mech-text">{law.mechanism}</p>
        </div>
      </section>
    </header>
  );
}
