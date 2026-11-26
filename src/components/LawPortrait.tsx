import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLawById } from '../data/laws';
import { useGraph } from '../lib/mine';
import { findCorrelations, findApps, type AppEvidence } from '../lib/ai';
import LawImage from './LawImage';
import { saveLaw, removeLaw, isMarked, newId, useSavedLaws } from '../lib/store';
import DomainBadge, { domainColor } from './DomainBadge';
import Evidence from './Evidence';
import RichText from './RichText';
import FamilyCard from './FamilyCard';
import Cases from './Cases';
import { familyOf, quoteOf, FAMILY_OF } from '../data/families';
import type { Law, CorrelationResult } from '../types';
import ArticleTab from './ArticleTab';
import { saveFinding, useFinding } from '../lib/findings';
import FoundLaw from './FoundLaw';

interface Props {
  law: Law;
  onSelect?: (id: string) => void; // בחירת חוק קשור: במקום, בלי לעזוב את המסך
  brief?: boolean; // דיוקן קצר, לדף הבית
  afterCover?: boolean; // הדיוקן בא אחרי השער (LawCover): בלי שם, הגדרה ומנגנון, שכבר מופיעים בשער
}

// דיוקן של חוק בהקשר: מה הוא אומר, איך הוא פועל, איפה הוא מופיע, ולמה הוא קשור
export default function LawPortrait({ law, onSelect, brief = false, afterCover = false }: Props) {
  const navigate = useNavigate();
  useSavedLaws();
  const marked = isMarked(law.id);
  const [activeTab, setActiveTab] = useState<'details' | 'article'>(() =>
    new URLSearchParams(window.location.search).get('tab') === 'article' ? 'article' : 'details',
  );
  const [ai, setAi] = useState<{ id: string; data?: CorrelationResult; error?: string; loading?: boolean } | null>(null);
  const aiState = ai?.id === law.id ? ai : null;
  const [apps, setApps] = useState<{ id: string; data?: AppEvidence; error?: string; loading?: boolean } | null>(null);
  const appsState = apps?.id === law.id ? apps : null;
  // מה שה-AI כבר גילה על החוק נשמר, ומופיע שוב בכל כניסה לעמוד
  const savedLinks = useFinding<CorrelationResult & { saved_at?: string }>(law.id, 'correlations');
  const savedApps = useFinding<AppEvidence>(law.id, 'apps');
  const linksData = aiState?.data ?? savedLinks;
  const appsData = appsState?.data ?? savedApps;
  const { neighbors: NEIGHBORS } = useGraph();
  const neighbors = (NEIGHBORS[law.id] ?? []).map(getLawById).filter((l): l is Law => Boolean(l));

  const family = familyOf(law.id);
  const quote = quoteOf(law.id);
  const kin = neighbors.filter((n) => FAMILY_OF[n.id] === FAMILY_OF[law.id]);
  const bridges = neighbors.filter((n) => FAMILY_OF[n.id] !== FAMILY_OF[law.id]);

  // בדיוקן הקצר מוצגת דוגמה אחת, ועדיפות לדוגמה מהעיר
  const cityFirst = law.examples.find((e) => e.domain === 'עיר') ?? law.examples[0];

  const go = (id: string) => (onSelect ? onSelect(id) : navigate(`/law/${id}`));

  const toggleMark = () => {
    if (marked) return removeLaw(marked.id);
    saveLaw({
      id: newId(),
      kind: 'marked',
      name: law.name,
      name_en: law.name_en,
      domain: law.domain,
      definition: law.definition,
      mechanism: law.mechanism,
      examples: law.examples,
      tags: law.tags,
      parent_law_ids: [law.id],
      created_at: new Date().toISOString(),
    });
  };

  const verify = async () => {
    setApps({ id: law.id, loading: true });
    try {
      const data = await findApps(law);
      setApps({ id: law.id, data });
      saveFinding(law.id, 'apps', data);
    } catch {
      setApps({ id: law.id, error: 'ה-AI לא זמין כרגע, ולכן לא נמצאו אפליקציות מאמתות. נסי שוב בעוד דקה.' });
    }
  };

  const discover = async () => {
    setAi({ id: law.id, loading: true });
    try {
      const data = await findCorrelations(law);
      setAi({ id: law.id, data });
      saveFinding(law.id, 'correlations', data);
    } catch {
      setAi({ id: law.id, error: 'ה-AI לא זמין כרגע. נסי שוב בעוד דקה. הקשרים הקיימים מוצגים למעלה.' });
    }
  };

  return (
    <article key={law.id} className="rise">
      {law.created_by === 'anat' && (
        // חוק שענת ניסחה: תמיד מצוין שהוא שלה, ומאילו חוקים נולד
        <p className="mb-4 border-r-4 border-yellow-300 bg-yellow-50 px-3 py-2 text-sm leading-relaxed" data-origin>
          <b>חוק שלך</b>, שנוצר מחוקים אחרים במאגר:{' '}
          {law.correlations
            .map((id) => getLawById(id))
            .filter((p): p is Law => Boolean(p))
            .map((p, i) => (
              <span key={p.id}>
                {i > 0 && ' + '}
                <Link className="font-bold underline" to={`/law/${p.id}`}>
                  {p.name}
                </Link>
              </span>
            ))}
          .
          <br />
          <span className="meta">{law.source}</span>
        </p>
      )}
      {!afterCover && (
      <div className={brief ? 'grid grid-cols-[1fr_auto] items-start gap-4' : ''}>
        <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {law.domain.map((d) => (
            <DomainBadge key={d} domain={d} />
          ))}
          <Evidence value={law.evidence_strength} showLabel={!brief} />
        </div>
        <h2 className={brief ? 'h2' : 'h1'}>{law.name}</h2>
        {law.name_en && (
          <p className="meta mb-3" dir="ltr" style={{ textAlign: 'right' }}>
            {law.name_en}
          </p>
        )}
        <p className={`leading-relaxed ${brief ? 'text-sm' : 'text-lg'}`}><RichText text={law.definition} /></p>
        </div>
        {brief && (
          <div className="w-24 shrink-0 md:w-44">
            <LawImage law={law} />
          </div>
        )}
      </div>
      )}

      {brief && (
        <p className="mt-3 grid grid-cols-[72px_1fr] items-baseline gap-3 text-sm">
          <span>
            <DomainBadge domain={cityFirst.domain} />
          </span>
          <span className="leading-relaxed text-zinc-700">{cityFirst.description}</span>
        </p>
      )}

      {!brief && (
        <div className="law-tabs mt-4 flex gap-0 border-b border-zinc-200">
          <button
            className={`law-tab-btn px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'law-tab-active border-b-2 border-black text-black' : 'text-zinc-500 hover:text-zinc-800'}`}
            onClick={() => setActiveTab('details')}
          >
            פרטי החוק
          </button>
          <button
            className={`law-tab-btn px-4 py-2 text-sm font-medium ${activeTab === 'article' ? 'law-tab-active border-b-2 border-black text-black' : 'text-zinc-500 hover:text-zinc-800'}`}
            onClick={() => setActiveTab('article')}
          >
            כתבה
          </button>
        </div>
      )}

      {!brief && activeTab === 'article' && (
        <ArticleTab lawId={law.id} lawName={law.name} />
      )}

      {(brief || activeTab === 'details') && (
        <>
          {!brief && !afterCover && (
            <>
          <h3 className="label mb-1 mt-5">המנגנון</h3>
          <p className="text-sm leading-relaxed text-zinc-700"><RichText text={law.mechanism} /></p>

            </>
          )}

          <h3 className={afterCover ? 'h2 mb-3' : 'label mb-2 mt-5'}>אותו חוק, בתחומים שונים</h3>
          <ul className={afterCover ? 'space-y-3' : 'space-y-2'}>
            {law.examples.map((ex, i) => (
              <li key={i} className={`grid grid-cols-[72px_1fr] items-baseline gap-3 ${afterCover ? 'text-base' : 'text-sm'}`}>
                <span>
                  <DomainBadge domain={ex.domain} />
                </span>
                <span className="leading-relaxed text-zinc-700">{ex.description}</span>
              </li>
            ))}
          </ul>

          {afterCover && <Cases law={law} />}

          {quote && (
            <figure className="mt-5 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,.12)]">
              <blockquote className="text-base font-medium leading-relaxed" dir="ltr" lang="en" style={{ textAlign: 'left' }}>
                “{quote.text}”
              </blockquote>
              <p className="mt-1.5 text-sm text-zinc-700">{quote.he}</p>
              <figcaption className="meta mt-1.5">
                {quote.byHe} ({quote.by}), <span dir="ltr">{quote.work}</span>, <span className="num">{quote.year}</span>. התרגום חופשי.
              </figcaption>
            </figure>
          )}

        </>
      )}

      {family && (
        <p className="mt-4 text-sm">
          <span className="label">משפחת מנגנון: </span>
          <b>{family.name}</b>. <span className="text-zinc-600">{family.short}</span>
        </p>
      )}
      {!brief && activeTab === 'details' && family && (
        <div className="mt-2 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,.12)]">
          <FamilyCard family={family} compact />
        </div>
      )}

      {[
        { title: 'מאותה משפחה', note: 'אותו מנגנון, בתחום אחר', list: kin },
        { title: 'גשרים למשפחות אחרות', note: 'מנגנון אחר שפועל על אותה תופעה', list: bridges },
      ].map(
        (g) =>
          g.list.length > 0 && (
            <div key={g.title}>
              <h3 className="label mb-1.5 mt-4">
                <b className="text-black">{g.list.length}</b> {g.title} <span className="meta font-normal">· {g.note}</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {g.list.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => go(n.id)}
                    className="btn btn-sm bg-white"
                    style={{ boxShadow: `inset -3px 0 0 ${domainColor(n.domain[0])}, 0 1px 2px rgba(0,0,0,.14)` }}
                    title={familyOf(n.id)?.name}
                  >
                    {n.name}
                  </button>
                ))}
              </div>
            </div>
          ),
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {brief ? (
          <Link to={`/law/${law.id}`} className="btn-primary">
            פתחי את החוק
          </Link>
        ) : (
          <>
            <button onClick={discover} disabled={aiState?.loading} className="btn-primary">
              {aiState?.loading ? 'מחפש קשרים...' : linksData ? 'חפשי קשרים חדשים' : 'גלי קשרים מפתיעים'}
            </button>
            <Link to={`/create?with=${law.id}`} className="btn-soft">
              צרי ממנו חוק חדש
            </Link>
            <button onClick={toggleMark} aria-pressed={Boolean(marked)} className={marked ? 'btn bg-yellow-300' : 'btn-soft'}>
              {marked ? 'מסומן. להסיר' : 'סמני לחוקים שלי'}
            </button>
          </>
        )}
      </div>

      {!brief && activeTab === 'details' && (
        <section className="mt-5">
          <h3 className="label mb-1.5">אימות: איפה אפשר לבדוק את החוק באפליקציות שלך</h3>
          {(!appsData || appsState?.loading) && (
            <button onClick={verify} disabled={appsState?.loading} className="btn-soft">
              {appsState?.loading ? 'מחפש בתיק האפליקציות...' : 'מצאי אפליקציות שמאמתות'}
            </button>
          )}
          {appsState?.error && <p className="problem mt-2 text-sm">{appsState.error}</p>}
          {appsData && !appsState?.loading && (
            <div className="rise bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,.12)]" aria-live="polite">
              {appsData.picks.length === 0 ? (
                <p className="text-sm text-zinc-600">לא נמצאה בתיק אפליקציה שהנתונים שלה בודקים את החוק הזה.</p>
              ) : (
                <>
                  <p className="mb-3 text-base font-bold">
                    <RichText text={appsData.insight} />
                  </p>
                  <ol className="space-y-3">
                    {appsData.picks.map((p, n) => (
                      <li key={p.id} className="grid grid-cols-[20px_1fr] gap-2 text-sm">
                        <span className="num pt-0.5 text-zinc-400">{n + 1}</span>
                        <span>
                          <a href={p.url} target="_blank" rel="noreferrer" className="font-bold underline decoration-2 underline-offset-2">
                            {p.title}
                          </a>
                          <span className="block leading-relaxed text-zinc-700">
                            <RichText text={p.proves} />
                          </span>
                          <span className="mt-0.5 block leading-relaxed">
                            <span className="label text-green-700">הבדיקה: </span>
                            <RichText text={p.experiment} />
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              <p className="meta mt-3">
                הצעה של AI לפי שם האפליקציה והתיאור שלה. הבדיקה עצמה עוד לא נעשתה. נשמר, ויופיע גם בכניסה הבאה.{' '}
                <button className="font-bold underline underline-offset-2" onClick={verify}>
                  חפשי שוב
                </button>
              </p>
            </div>
          )}
        </section>
      )}

      {aiState?.error && <p className="problem mt-3 text-sm">{aiState.error}</p>}
      {linksData && !aiState?.loading && (
        <section className="mt-5 bg-zinc-50 p-4" aria-live="polite">
          <p className="mb-3 text-base font-bold">
            <RichText text={linksData.meta_pattern} />
          </p>
          <ul className="space-y-3">
            {linksData.correlations.map((c, i) => (
              <li key={i} className="text-sm">
                <div className="mb-0.5 flex items-center gap-2">
                  <DomainBadge domain={c.domain} />
                  <span>
                    <FoundLaw name={c.law_name} bornFrom={law.name} fromId={law.id} savedAt={savedLinks?.saved_at} />
                  </span>
                </div>
                <p className="leading-relaxed text-zinc-700">
                  <RichText text={c.shared_mechanism} />
                </p>
                <p className="meta">
                  <RichText text={c.surprise} />
                </p>
              </li>
            ))}
          </ul>
          <p className="meta mt-3">נוסח בידי AI. הצעה לבדיקה, לא עובדה מהמאגר. נשמר, ויופיע גם בכניסה הבאה ובכתבה.</p>
        </section>
      )}

      {!brief && (
        <p className="meta mt-5">
          מקור: {law.source}
          {law.tags.length > 0 && <> · {law.tags.join(' · ')}</>}
        </p>
      )}
    </article>
  );
}
