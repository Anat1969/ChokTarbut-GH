import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getLawById } from '../data/laws';
import { ORDERED } from '../lib/graph';
import { createNewLaw } from '../lib/ai';
import { saveLaw, newId } from '../lib/store';
import DomainFilter from '../components/DomainFilter';
import DomainBadge, { domainColor } from '../components/DomainBadge';
import RichText from '../components/RichText';
import type { CreateLawResult, Domain, Law } from '../types';

const MAX = 3;

export default function Create() {
  const [params] = useSearchParams();
  const [selected, setSelected] = useState<Law[]>(() =>
    (params.get('with') ?? '')
      .split(',')
      .map(getLawById)
      .filter((l): l is Law => Boolean(l))
      .slice(0, MAX),
  );
  const [domain, setDomain] = useState<Domain | null>(null);
  const [result, setResult] = useState<CreateLawResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isOn = (law: Law) => selected.some((l) => l.id === law.id);
  const toggle = (law: Law) => {
    setResult(null);
    setSaved(false);
    setSelected((prev) => (isOn(law) ? prev.filter((l) => l.id !== law.id) : prev.length >= MAX ? prev : [...prev, law]));
  };

  const create = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      setResult(await createNewLaw(selected));
    } catch {
      setError('ה-AI לא זמין כרגע, ולכן החוק לא נוצר. הבחירה שלך נשמרה במסך. נסי שוב בעוד דקה.');
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    if (!result) return;
    saveLaw({
      id: newId(),
      kind: 'created',
      name: result.name,
      name_en: result.name_en,
      domain: result.domain,
      definition: result.definition,
      mechanism: result.mechanism,
      examples: result.examples,
      tags: result.tags,
      parent_law_ids: selected.map((l) => l.id),
      why_novel: result.why_novel,
      created_at: new Date().toISOString(),
    });
    setSaved(true);
  };

  // אותו סדר כמו במפה: מקובץ לפי תחום ראשי
  const laws = ORDERED.filter((l) => !domain || l.domain.includes(domain));
  const distinctDomains = new Set(selected.map((l) => l.domain[0])).size;

  return (
    <main className="page screen grid md:grid-cols-[38.2fr_61.8fr]">
      {/* בחירה */}
      <section className="flex min-h-0 flex-col px-4 py-4 md:px-6">
        <h1 className="text-2xl font-black leading-tight">
          בחרי שניים או שלושה חוקים. <span className="marker">הצומת ביניהם</span> הוא חוק חדש.
        </h1>
        <div className="mt-3">
          <DomainFilter value={domain} onChange={setDomain} />
        </div>
        <p className="meta mt-2">
          נבחרו <b className="text-black">{selected.length}</b> מתוך {MAX}. חוקים מתחומים רחוקים נותנים צומת מפתיע יותר.
        </p>
        <ul className="scroll-y -mx-1 mt-2 flex-1 px-1">
          {laws.map((law) => {
            const on = isOn(law);
            return (
              <li key={law.id}>
                <button
                  className="row"
                  aria-pressed={on}
                  disabled={!on && selected.length >= MAX}
                  onClick={() => toggle(law)}
                  style={!on && selected.length >= MAX ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0" style={{ backgroundColor: domainColor(law.domain[0]) }} />
                    <span className="text-sm font-bold">{law.name}</span>
                    <span className="meta">{law.domain.join(' · ')}</span>
                    {on && <span className="mr-auto text-xs font-bold">נבחר</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* הצומת והתוצאה */}
      <section className="scroll-y bg-zinc-50 px-4 py-5 md:px-8">
        <div className="max-w-2xl">
          <h2 className="label mb-2">החוקים שבצומת</h2>
          {selected.length === 0 ? (
            <p className="text-sm text-zinc-500">עוד לא נבחר חוק. בחרי מהרשימה שניים לפחות, והכפתור ייפתח.</p>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selected.length}, minmax(0, 1fr))` }}>
              {selected.map((law) => (
                <div key={law.id} className="bg-white p-3" style={{ boxShadow: `inset 0 3px 0 ${domainColor(law.domain[0])}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <b className="text-sm leading-tight">{law.name}</b>
                    <button className="btn-soft btn-sm !px-2 !py-0.5" onClick={() => toggle(law)} aria-label={`הסירי את ${law.name}`}>
                      הסירי
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-zinc-600">{law.definition}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={create} disabled={selected.length < 2 || loading} className="btn-primary">
              {loading ? 'מנסח חוק חדש...' : 'צרי חוק חדש'}
            </button>
            {selected.length >= 2 && (
              <span className="meta">
                {distinctDomains > 1 ? `צומת בין ${distinctDomains} תחומים.` : 'כל החוקים מאותו תחום. כדאי להוסיף חוק מתחום אחר.'}
              </span>
            )}
          </div>

          {error && <p className="problem mt-4 text-sm">{error}</p>}

          {result && (
            <article className="mt-6 bg-white p-5 shadow-[0_2px_14px_rgba(0,0,0,.08)]" aria-live="polite">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {result.domain.map((d) => (
                  <DomainBadge key={d} domain={d} />
                ))}
              </div>
              <h2 className="text-3xl font-black leading-tight">{result.name}</h2>
              <p className="meta mb-3" dir="ltr" style={{ textAlign: 'right' }}>
                {result.name_en}
              </p>
              <p className="text-lg leading-relaxed">
                <RichText text={result.definition} />
              </p>
              <h3 className="label mb-1 mt-4">מה הוא מגלה שההורים לא גילו</h3>
              <p className="text-sm leading-relaxed">
                <RichText text={result.why_novel} />
              </p>
              <h3 className="label mb-1 mt-4">המנגנון</h3>
              <p className="text-sm leading-relaxed text-zinc-700">
                <RichText text={result.mechanism} />
              </p>
              <h3 className="label mb-2 mt-4">דוגמאות</h3>
              <ul className="space-y-2">
                {result.examples.map((ex, i) => (
                  <li key={i} className="grid grid-cols-[72px_1fr] items-baseline gap-3 text-sm">
                    <span>
                      <DomainBadge domain={ex.domain} />
                    </span>
                    <span className="leading-relaxed text-zinc-700">
                      <RichText text={ex.description} />
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button onClick={save} disabled={saved} className="btn-primary">
                  {saved ? 'נשמר בחוקים שלי' : 'שמרי בחוקים שלי'}
                </button>
                <button onClick={create} disabled={loading} className="btn-soft">
                  נסחי גרסה אחרת
                </button>
                {saved && (
                  <Link to="/my-laws" className="btn-soft">
                    לחוקים שלי
                  </Link>
                )}
              </div>
              <p className="meta mt-3">החוק נוסח בידי AI. זו השערה לבדיקה, לא חוק מוכח.</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
