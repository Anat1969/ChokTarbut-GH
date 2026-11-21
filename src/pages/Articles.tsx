import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { subscribeArticles, getArticlesMap, refreshFromCloud } from '../lib/articles';
import { SEED_ARTICLES } from '../data/articles';
import { ALL_DOMAINS, getLawById } from '../data/laws';
import { FAMILY_OF, SHORT_NAME } from '../data/families';
import { promptOf } from '../data/prompts';
import { useLawImage } from '../lib/images';
import { domainColor, domainInk } from '../components/DomainBadge';
import FamilyGlyph from '../components/FamilyGlyph';
import ArticleBody, { parseArticle, type ParsedArticle } from '../components/ArticleBody';
import type { Law } from '../types';

interface Entry {
  law: Law;
  text: string;
  article: ParsedArticle;
}

// כתבות: מימין תוכן העניינים לפי תחום, משמאל הכתבה הפתוחה
export default function Articles() {
  useEffect(() => {
    refreshFromCloud();
  }, []);

  const map = useSyncExternalStore(subscribeArticles, getArticlesMap);
  const [params, setParams] = useSearchParams();
  const reader = useRef<HTMLElement>(null);

  // רק כתבות של חוקים מהמאגר, בסדר התחומים של הטבלה
  const groups = useMemo(() => {
    const entries: Entry[] = [];
    for (const [id, text] of Object.entries(map)) {
      const law = getLawById(id);
      if (law && text.trim()) entries.push({ law, text, article: parseArticle(text) });
    }
    return ALL_DOMAINS.map((domain) => ({ domain, entries: entries.filter((e) => e.law.domain[0] === domain) }));
  }, [map]);

  const all = groups.flatMap((g) => g.entries);
  const covered = groups.filter((g) => g.entries.length).length;
  const index = Math.max(0, all.findIndex((e) => e.law.id === params.get('law')));
  const open = all[index];
  const next = all.length > 1 ? all[(index + 1) % all.length] : undefined;

  const pick = (id: string) => {
    setParams({ law: id });
    reader.current?.scrollTo({ top: 0 });
    // בנייד הכתבה נמצאת מתחת לרשימה
    if (!window.matchMedia('(min-width: 768px)').matches) reader.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!open) {
    return (
      <main className="page px-4 py-8 md:px-9">
        <h1 className="h2">עוד אין כתבות.</h1>
        <p className="mt-2 text-sm text-zinc-600">כתבה נכתבת במסך של חוק, בלשונית "כתבה".</p>
        <Link to="/library" className="btn-primary mt-4">
          לספרייה
        </Link>
      </main>
    );
  }

  return (
    <main className="page screen grid md:grid-cols-[38.2fr_61.8fr]">
      <section className="flex min-h-0 flex-col px-4 py-4 md:px-6" aria-label="תוכן העניינים">
        <h1 className="h2">
          <span className="marker num">{all.length}</span> כתבות, <span className="num">{covered}</span> תחומים.
        </h1>
        <p className="mt-1 text-sm text-zinc-600">כל כתבה הולכת באותו מסלול: התופעה, המנגנון, ומה זה אומר בעיר.</p>

        <div className="scroll-y -mx-1 mt-3 flex-1 px-1">
          {groups.map(({ domain, entries }) =>
            entries.length ? (
              entries.map(({ law, article }) => (
                <button
                  key={law.id}
                  className="row flex items-center gap-3"
                  aria-current={law.id === open.law.id}
                  onClick={() => pick(law.id)}
                >
                  <span
                    className="article-tile"
                    style={{ backgroundColor: domainColor(domain), color: domainInk(domain) }}
                    aria-hidden="true"
                  >
                    {SHORT_NAME[law.id] ?? law.name}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold leading-snug">{article.title}</span>
                    <span className="meta block">
                      {domain} · {law.name} · <ReadTime minutes={article.minutes} />
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p key={domain} className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-400">
                <span className="article-tile bg-zinc-100" aria-hidden="true" />
                {domain}: עוד אין כתבה.
              </p>
            ),
          )}
        </div>

        {open.article.insights.length > 0 && (
          <aside className="mt-3 hidden bg-zinc-50 px-3 py-3 md:block" aria-label="הכתבה בעשרים שניות">
            <p className="label">הכתבה בעשרים שניות</p>
            <ol className="mt-1.5 space-y-1.5 text-sm leading-snug">
              {open.article.insights.map((line, i) => (
                <li key={i} className="grid grid-cols-[22px_1fr]">
                  <span className="num text-zinc-400">{i + 1}</span>
                  <span>
                    <span className="marker">{line}</span>
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </section>

      <section ref={reader} className="scroll-y px-4 py-6 md:px-9" data-col="main" aria-label="הכתבה">
        <Reader key={open.law.id} entry={open} />
        <div className="mt-8 flex flex-wrap items-center gap-2 pb-6">
          <Link to={`/law/${open.law.id}`} className="btn-primary btn-sm">
            לחוק המלא
          </Link>
          <Link to={`/law/${open.law.id}?tab=article`} className="btn-soft btn-sm">
            עריכת הכתבה
          </Link>
          {next && (
            <button className="btn-soft btn-sm" onClick={() => pick(next.law.id)}>
              הכתבה הבאה: {next.article.title}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

function ReadTime({ minutes }: { minutes: number }) {
  if (minutes === 1) return <>דקת קריאה</>;
  return (
    <>
      <span className="num">{minutes}</span> דקות קריאה
    </>
  );
}

// שער הכתבה: כותרת ליד התמונה של החוק, ואחריו הפרקים
function Reader({ entry }: { entry: Entry }) {
  const { law, text, article } = entry;
  const image = useLawImage(law.id);
  const domain = law.domain[0];
  const bySystem = SEED_ARTICLES[law.id]?.trim() === text.trim();

  return (
    <article className="rise">
      <header className="article-cover">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold">
            <span className="inline-block h-3 w-3" style={{ backgroundColor: domainColor(domain) }} aria-hidden="true" />
            {domain}
            <Link to={`/law/${law.id}`} className="font-medium text-zinc-500 underline-offset-4 hover:underline">
              {law.name}
            </Link>
          </p>
          <h2 className="h1 mt-3">{article.title}</h2>
          <p className="mt-3 max-w-[52ch] text-zinc-600">{law.definition}</p>
          <p className="meta mt-3">
            <ReadTime minutes={article.minutes} />
            {bySystem && ' · נוסח בידי AI'} · מקור החוק: <bdi>{law.source}</bdi>
          </p>
        </div>
        <figure className="max-w-[320px]">
          <div className="frame frame-static">
            {image.url ? (
              <img src={image.url} alt={promptOf(law.id)?.idea ?? law.name} />
            ) : (
              <div className="frame-mat">
                <FamilyGlyph family={FAMILY_OF[law.id]} color={domainColor(domain)} animate className="h-full w-full" />
              </div>
            )}
          </div>
          <figcaption className="meta mt-1.5">{image.url ? 'הדמיה' : 'תרשים המנגנון של החוק'}</figcaption>
        </figure>
      </header>
      <div className="mt-8">
        <ArticleBody article={article} />
      </div>
    </article>
  );
}
