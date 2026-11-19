import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { INITIAL_LAWS, getLawById } from '../data/laws';
import { FAMILIES, FAMILY_BY_ID, FAMILY_OF, QUOTES } from '../data/families';
import { EDGES, HUB } from '../lib/graph';
import { useSavedLaws } from '../lib/store';
import { useImageIds, useLawImage } from '../lib/images';
import PeriodicTable, { EMPTY_CELLS, type Selection } from '../components/PeriodicTable';
import LawMap from '../components/LawMap';
import LawPortrait from '../components/LawPortrait';
import FamilyCard from '../components/FamilyCard';
import FamilyGlyph from '../components/FamilyGlyph';
import type { Domain } from '../types';

// אריח בגלריה: התמונה של חוק אחד
function GalleryTile({ id }: { id: string }) {
  const image = useLawImage(id);
  const law = getLawById(id);
  if (!law || !image.url) return null;
  return (
    <Link to={`/law/${id}`} className="card-link !p-0">
      <img src={image.url} alt={law.name} loading="lazy" className="aspect-square w-full object-cover" />
      <span className="block px-2 py-1.5 text-xs font-bold">{law.name}</span>
    </Link>
  );
}

const randomLaw = (): Selection => ({ type: 'law', id: INITIAL_LAWS[Math.floor(Math.random() * INITIAL_LAWS.length)].id });

// קשרים שמחברים שתי משפחות מנגנון שונות
const BRIDGES = EDGES.filter(({ a, b }) => FAMILY_OF[a] !== FAMILY_OF[b]).length;

export default function Home() {
  // דף הבית מתחלף: חוק אחר בכל כניסה, ומתחלף לבד עד שענת בוחרת
  const [selection, setSelection] = useState<Selection>(randomLaw);
  const [touched, setTouched] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [view, setView] = useState<'table' | 'net'>('table');
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const saved = useSavedLaws();
  const imageIds = useImageIds();

  useEffect(() => {
    if (touched || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setSelection(randomLaw()), 7000);
    return () => clearInterval(timer);
  }, [touched]);

  const select = (s: Selection) => {
    setTouched(true);
    setSelection(s ?? randomLaw());
  };

  const law = selection?.type === 'law' ? getLawById(selection.id) : undefined;
  const family =
    selection?.type === 'family'
      ? FAMILY_BY_ID[selection.id]
      : selection?.type === 'cell'
        ? FAMILY_BY_ID[selection.family]
        : law
          ? FAMILY_BY_ID[FAMILY_OF[law.id]]
          : FAMILIES[0];

  return (
    <main className="page">
      <div className="screen home-grid">
        {/* טור הכניסה, מימין: המסר, המשמעות, והפריט שנבחר */}
        <section className="home-intro flex flex-col gap-4 px-4 pb-3 pt-5 md:px-6" data-col="side">
          <div>
            <h1 className="h1">
              אותו מנגנון חוזר <mark className="marker bg-transparent">בתחומים רחוקים</mark>.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              <b className="text-black">{INITIAL_LAWS.length}</b> חוקים, מסודרים לפי <b className="text-black">6</b> תחומים ו-
              <b className="text-black">6</b> משפחות מנגנון.
              <br />
              <b className="text-black">{EMPTY_CELLS}</b> משבצות ריקות: בכל אחת מחכה חוק שעוד לא נוסח.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <p className="box box-problem">
              <b>הבעיה</b>
              כל תחום לומד את החוקים שלו לבד.
            </p>
            <p className="box box-solution">
              <b>הפתרון</b>
              טבלה אחת: מנגנון בשורה, תחום בטור.
            </p>
            <p className="box box-insight">
              <b>התובנה</b>
              משבצת ריקה היא ניבוי של חוק.
            </p>
          </div>
        </section>

        <section className="home-detail scroll-y flex flex-col gap-4 px-4 pb-5 md:px-6">
          <div className="bg-zinc-50 p-4" aria-live="polite">
            {selection?.type === 'cell' ? (
              <article>
                <p className="label mb-1">משבצת ריקה</p>
                <h2 className="h2">
                  {family.name}, ב{selection.domain}
                </h2>
                <p className="mt-2 text-sm leading-relaxed">
                  במאגר אין חוק ממשפחת <b>{family.name}</b> שנצפה ב<b>{selection.domain}</b>.
                  <br />
                  המנגנון ידוע: {family.short}
                  <br />
                  נשאר לנסח איך הוא נראה בתחום הזה.
                </p>
                <Link to={`/create?family=${selection.family}&domain=${selection.domain}`} className="btn-primary mt-4">
                  מלאי את המשבצת
                </Link>
              </article>
            ) : selection?.type === 'family' ? (
              <FamilyCard family={family} />
            ) : (
              law && <LawPortrait law={law} onSelect={(id) => select({ type: 'law', id })} brief />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/explain" className="btn-primary">
              הסבירי תופעה
            </Link>
            <Link to="/library" className="btn-soft">
              כל החוקים
            </Link>
          </div>
        </section>

        {/* המוקד, משמאל: הטבלה המחזורית */}
        <section className="home-stage flex min-h-0 flex-col gap-2 px-3 pb-4 md:px-5 md:py-4" data-col="main" data-focal>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1" role="group" aria-label="תצוגה">
              <button className={`btn btn-sm ${view === 'table' ? 'bg-black text-white' : 'bg-zinc-100'}`} aria-pressed={view === 'table'} onClick={() => setView('table')}>
                טבלה
              </button>
              <button className={`btn btn-sm ${view === 'net' ? 'bg-black text-white' : 'bg-zinc-100'}`} aria-pressed={view === 'net'} onClick={() => setView('net')}>
                רשת קשרים
              </button>
            </div>
            <p className="meta">
              {view === 'table'
                ? 'אריח מלא: תחום הבית של החוק. אריח לבן: תחום נוסף שבו הוא נצפה. ריחוף מדליק את החוקים הקשורים.'
                : 'כל נקודה היא חוק, וכל קו הוא קשר. נקודה גדולה: חוק עם הרבה קשרים.'}
            </p>
          </div>
          {view === 'table' ? (
            <div className="scroll-y flex-1">
              <PeriodicTable
                selection={selection}
                hoverId={hoverId}
                onHover={setHoverId}
                onSelect={select}
                domain={domain}
                onDomain={setDomain}
              />
            </div>
          ) : (
            <LawMap
              selectedId={law?.id}
              domain={domain}
              onSelect={(id) => select({ type: 'law', id })}
              className="min-h-0 w-full md:flex-1"
            />
          )}
        </section>
      </div>

      {/* מתחת לקו המסך: מפת התוכן ושכבת המוזיאון */}
      <section className="grid gap-3 px-4 py-6 md:grid-cols-3 md:px-6">
        <Link to="/library" className="card-link">
          <span className="num block text-4xl font-medium">{EDGES.length}</span>
          <span className="block text-lg font-bold">גלה</span>
          <span className="block text-sm leading-relaxed text-zinc-600">
            קשרים בין החוקים. <b className="text-black">{BRIDGES}</b> מהם מגשרים בין שתי משפחות מנגנון. המקושר ביותר: {HUB.law.name}.
          </span>
        </Link>
        <Link to="/explain" className="card-link">
          <span className="num block text-4xl font-medium">3</span>
          <span className="block text-lg font-bold">הסבר</span>
          <span className="block text-sm leading-relaxed text-zinc-600">
            חוקים לכל היותר מסבירים תופעה אחת. מתארים מה ראית, ומקבלים את החוק שמאחוריה.
          </span>
        </Link>
        <Link to="/create" className="card-link">
          <span className="num block text-4xl font-medium">{EMPTY_CELLS}</span>
          <span className="block text-lg font-bold">צור</span>
          <span className="block text-sm leading-relaxed text-zinc-600">
            משבצות ריקות בטבלה. עד עכשיו ניסחת <b className="text-black">{saved.filter((l) => l.kind === 'created').length}</b> חוקים משלך.
          </span>
        </Link>
      </section>

      <section className="px-4 pb-8 md:px-6">
        <h2 className="h2">שישה מנגנונים, בתרשים אחד לכל אחד.</h2>
        <p className="meta mb-3 mt-1">לחיצה מדליקה את השורה של המנגנון בטבלה.</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {FAMILIES.map((f) => (
            <button
              key={f.id}
              className="card-link"
              aria-pressed={selection?.type === 'family' && selection.id === f.id}
              onClick={() => {
                select({ type: 'family', id: f.id });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <FamilyGlyph family={f.id} animate className="mb-2 aspect-square w-full" />
              <span className="block text-sm font-bold">{f.name}</span>
              <span className="block text-xs leading-snug text-zinc-600">{f.short}</span>
            </button>
          ))}
        </div>
      </section>

      {imageIds.length > 0 && (
        <section className="px-4 pb-8 md:px-6">
          <h2 className="h2">
            <span className="marker">{imageIds.length}</span> חוקים כבר קיבלו תמונה.
          </h2>
          <p className="meta mb-3 mt-1">התמונות שמורות לתמיד בענן. לחיצה פותחת את החוק.</p>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-8">
            {imageIds.map((id) => (
              <GalleryTile key={id} id={id} />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-8 bg-zinc-50 px-4 py-8 md:grid-cols-[1.618fr_1fr] md:px-6">
        <figure>
          <p className="label mb-2">מהמקור</p>
          <blockquote className="quote" dir="ltr" lang="en" style={{ textAlign: 'left' }}>
            “{quote.text}”
          </blockquote>
          <p className="mt-2 text-sm leading-relaxed text-zinc-700">{quote.he}</p>
          <figcaption className="meta mt-2">
            {quote.byHe} ({quote.by}), <span dir="ltr">{quote.work}</span>, <span className="num">{quote.year}</span>. התרגום חופשי.{' '}
            <Link to={`/law/${quote.lawId}`} className="font-bold text-black underline">
              {getLawById(quote.lawId)?.name}
            </Link>
          </figcaption>
        </figure>
        <figure>
          <p className="label mb-2">הייקו: {family.name}</p>
          <p className="haiku">
            {family.haiku.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <figcaption className="meta mt-2">{family.haikuNote}</figcaption>
        </figure>
      </section>

      <p className="meta px-4 py-4 md:px-6">
        בהשראת הטבלה המחזורית של דמיטרי מנדלייב (Dmitri Mendeleev), <span className="num">1869</span>, שהשאיר משבצות ריקות ליסודות שעוד לא התגלו.
        <br />
        החלוקה למשפחות מנגנון היא פרשנות של האפליקציה, לא עובדה מהמקורות.
      </p>
    </main>
  );
}
