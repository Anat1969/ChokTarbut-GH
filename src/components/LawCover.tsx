import { useRef, useState } from 'react';
import { FAMILY_OF, familyOf } from '../data/families';
import { promptOf, fullPrompt } from '../data/prompts';
import { saveImage, removeImage, restoreImage, imageFromClipboard, useLawImage } from '../lib/images';
import DomainBadge, { domainColor } from './DomainBadge';
import Evidence from './Evidence';
import FamilyGlyph from './FamilyGlyph';
import type { Law, SavedLaw } from '../types';

interface Props {
  law: Law;
  savedLaw?: SavedLaw;
  className?: string;
}

// השער של חוק, כמו שער מגזין. שני לוחות באותה קומפוזיציה: מראה גדול, והטקסט עליו בתחתית.
//   משמאל, הגדול: התמונה, ועליה שלוש רמות טקסט בלבד: שם החוק, הפרשנות הוויזואלית, וטקסט המנגנון.
//   מימין: ההגדרה, הגרפיקה של המנגנון, והכפתורים. כפתורים לא יושבים על התמונה.
// העלאה היא גם הדבקה וגם גרירה: לחיצה, Ctrl+V, כפתור "הדבקה", או גרירת קובץ.
export default function LawCover({ law, savedLaw: _savedLaw, className = '' }: Props) {
  const image = useLawImage(law.id);
  const prompt = promptOf(law.id);
  const family = familyOf(law.id);
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [savedCustomPrompt, setSavedCustomPrompt] = useState('');
  const has = Boolean(image.url);

  // פרומפט אפקטיבי: מובנה (מהמערכת) או ידני (ממשתמש)
  const effectivePrompt = prompt ?? (savedCustomPrompt ? { idea: law.name, scene: savedCustomPrompt } : undefined);

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
    if (!effectivePrompt) return;
    try {
      await navigator.clipboard.writeText(fullPrompt(effectivePrompt));
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
          {effectivePrompt && <p className="cover-lead">{effectivePrompt.idea}</p>}
          <p className="cover-body">
            <span className="cover-kicker">המנגנון{family ? ` · ${family.name}` : ''}</span>
            {law.mechanism}
          </p>
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

      {/* לוח המנגנון: הגדרה, גרפיקה, וכלי התמונה */}
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
        <div className="cover-tools">
        <div className="flex flex-wrap gap-1.5">
          {effectivePrompt ? (
            <button className="cover-btn is-main" onClick={copy}>
              העתקת הפרומפט
            </button>
          ) : (
            <button className="cover-btn is-main" onClick={() => setEditingPrompt(true)}>
              כתבי פרומפט
            </button>
          )}
          <button className="cover-btn" onClick={paste} disabled={busy}>
            הדבקת תמונה
          </button>
          <button className="cover-btn" onClick={() => input.current?.click()} disabled={busy}>
            {has ? 'החלפת התמונה' : 'בחירת קובץ'}
          </button>
          {effectivePrompt && (
            <button className="cover-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? 'הסתרת הפרומפט' : 'הצגת הפרומפט'}
            </button>
          )}
          {has &&
            (confirm ? (
              <>
                <button
                  className="cover-btn !bg-red-600 !text-white"
                  onClick={async () => {
                    setConfirm(false);
                    try {
                      await removeImage(law.id);
                      say('התמונה ירדה מהשער. היא נשארת שמורה, ואפשר להחזיר אותה.');
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
          {has && !note && image.local && <p className="cover-note is-bad">התמונה שמורה במכשיר הזה בלבד. היא תעלה לענן בכניסה הבאה.</p>}
          {open && effectivePrompt && (
            <p className="mt-2 select-all bg-zinc-100 p-3 text-xs leading-relaxed" dir="rtl">
              {fullPrompt(effectivePrompt)}
            </p>
          )}
          {!prompt && editingPrompt && (
            <div className="mt-2 flex flex-col gap-1.5">
              <textarea
                className="w-full rounded border border-zinc-300 p-2 text-xs leading-relaxed"
                rows={4}
                placeholder="תארי את הסצנה שתמחיש את החוק הזה, בעברית. לאחר השמירה תוכלי להעתיק את הפרומפט המלא."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                dir="rtl"
              />
              <div className="flex gap-1.5">
                <button
                  className="cover-btn is-main"
                  onClick={() => {
                    setSavedCustomPrompt(customPrompt.trim());
                    setEditingPrompt(false);
                    say('הפרומפט נשמר. עכשיו אפשר להעתיק ולהשתמש במידג\'רני.');
                  }}
                  disabled={!customPrompt.trim()}
                >
                  שמירה
                </button>
                <button className="cover-btn" onClick={() => setEditingPrompt(false)}>
                  ביטול
                </button>
              </div>
            </div>
          )}
          {!prompt && savedCustomPrompt && !editingPrompt && (
            <button className="cover-btn mt-1 text-xs" onClick={() => { setCustomPrompt(savedCustomPrompt); setEditingPrompt(true); }}>
              עריכת הפרומפט
            </button>
          )}
        </div>
      </section>
    </header>
  );
}
