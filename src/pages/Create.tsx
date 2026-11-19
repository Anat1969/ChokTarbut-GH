import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ALL_DOMAINS, INITIAL_LAWS, getLawById } from '../data/laws';
import { FAMILIES, FAMILY_BY_ID, FAMILY_OF, type FamilyId } from '../data/families';
import { ORDERED, NEIGHBORS } from '../lib/graph';
import { createNewLaw } from '../lib/ai';
import { saveLaw, newId } from '../lib/store';
import DomainFilter from '../components/DomainFilter';
import DomainBadge, { domainColor, domainInk } from '../components/DomainBadge';
import RichText from '../components/RichText';
import Dictate from '../components/Dictate';
import type { CreateLawResult, Domain, Law } from '../types';

const MAX = 3;
const DRAFT_KEY = 'chok-manual-draft';
const byLinks = (a: Law, b: Law) => NEIGHBORS[b.id].length - NEIGHBORS[a.id].length;

interface Draft {
  name: string;
  definition: string;
  mechanism: string;
  example: string;
  domains: Domain[];
  family: FamilyId | '';
}
const EMPTY: Draft = { name: '', definition: '', mechanism: '', example: '', domains: [], family: '' };

export default function Create() {
  const [params] = useSearchParams();
  const targetFamily = FAMILY_BY_ID[params.get('family') as FamilyId];
  const targetDomain = ALL_DOMAINS.find((d) => d === params.get('domain'));
  const target = targetFamily && targetDomain ? { family: targetFamily, domain: targetDomain } : null;

  const [selected, setSelected] = useState<Law[]>(() => {
    if (target) {
      // למשבצת ריקה: החוק המקושר ביותר במשפחה, והחוק המקושר ביותר בתחום
      const kin = INITIAL_LAWS.filter((l) => FAMILY_OF[l.id] === target.family.id).sort(byLinks)[0];
      const local = INITIAL_LAWS.filter((l) => l.domain.includes(target.domain) && l.id !== kin?.id).sort(byLinks)[0];
      return [kin, local].filter(Boolean);
    }
    return (params.get('with') ?? '')
      .split(',')
      .map(getLawById)
      .filter((l): l is Law => Boolean(l))
      .slice(0, MAX);
  });
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [domain, setDomain] = useState<Domain | null>(null);
  const [result, setResult] = useState<CreateLawResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // ניסוח ידני: הטיוטה נשמרת לבד
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') as Draft | null;
      if (stored) return stored;
    } catch {
      /* טיוטה פגומה: מתחילים מחדש */
    }
    return target ? { ...EMPTY, domains: [target.domain], family: target.family.id } : EMPTY;
  });
  const [draftSaved, setDraftSaved] = useState(false);
  const [manualSaved, setManualSaved] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setDraftSaved(Boolean(draft.name || draft.definition));
    }, 400);
    return () => clearTimeout(t);
  }, [draft]);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setManualSaved(null);
    setDraft((d) => ({ ...d, [key]: value }));
  };

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
      setResult(
        await createNewLaw(
          selected,
          target ? { domain: target.domain, family: target.family.name, rule: target.family.rule } : undefined,
        ),
      );
    } catch {
      setError('ה-AI לא זמין כרגע, ולכן החוק לא נוצר. הבחירה שלך נשמרה במסך. אפשר לנסות שוב בעוד דקה, או לנסח בעצמך.');
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
      domain: target ? [target.domain, ...result.domain.filter((d) => d !== target.domain)] : result.domain,
      definition: result.definition,
      mechanism: result.mechanism,
      examples: result.examples,
      tags: result.tags,
      parent_law_ids: selected.map((l) => l.id),
      why_novel: result.why_novel,
      family: target?.family.id ?? FAMILY_OF[selected[0].id],
      created_at: new Date().toISOString(),
    });
    setSaved(true);
  };

  const manualReady = draft.name.trim() && draft.definition.trim() && draft.domains.length > 0 && draft.family;
  const saveManual = () => {
    if (!manualReady) return;
    saveLaw({
      id: newId(),
      kind: 'created',
      name: draft.name.trim(),
      domain: draft.domains,
      definition: draft.definition.trim(),
      mechanism: draft.mechanism.trim(),
      examples: draft.example.trim() ? [{ domain: draft.domains[0], description: draft.example.trim() }] : [],
      tags: [],
      parent_law_ids: selected.map((l) => l.id),
      family: draft.family || undefined,
      created_at: new Date().toISOString(),
    });
    setManualSaved(draft.name.trim());
    setDraft(target ? { ...EMPTY, domains: [target.domain], family: target.family.id } : EMPTY);
  };

  // אותו סדר כמו במפה: מקובץ לפי תחום ראשי
  const laws = ORDERED.filter((l) => !domain || l.domain.includes(domain));
  const distinctFamilies = new Set(selected.map((l) => FAMILY_OF[l.id])).size;

  return (
    <main className="page screen grid md:grid-cols-[38.2fr_61.8fr]">
      {/* בחירת חוקי המקור */}
      <section className="flex min-h-0 flex-col px-4 py-4 md:px-6" data-col="side">
        <h1 className="h2">
          {target ? (
            <>
              ממלאים משבצת ריקה: <span className="marker">{target.family.name}, ב{target.domain}</span>.
            </>
          ) : (
            <>
              בחרי שניים או שלושה חוקים. <span className="marker">הצומת ביניהם</span> הוא חוק חדש.
            </>
          )}
        </h1>
        {target && (
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            המנגנון: {target.family.rule} נבחרו מראש החוק המקושר ביותר במשפחה, והחוק המקושר ביותר ב{target.domain}.
          </p>
        )}
        <div className="mt-3">
          <DomainFilter value={domain} onChange={setDomain} />
        </div>
        <p className="meta mt-2">
          נבחרו <b className="text-black">{selected.length}</b> מתוך {MAX}. חוקים ממשפחות מנגנון שונות נותנים צומת מפתיע יותר.
        </p>
        <ul className="scroll-y -mx-1 mt-2 flex-1 px-1">
          {laws.map((law) => {
            const on = isOn(law);
            const blocked = !on && selected.length >= MAX;
            return (
              <li key={law.id}>
                <button
                  className="row"
                  aria-pressed={on}
                  disabled={blocked}
                  onClick={() => toggle(law)}
                  style={blocked ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0" style={{ backgroundColor: domainColor(law.domain[0]) }} />
                    <span className="text-sm font-bold">{law.name}</span>
                    <span className="meta">{FAMILY_BY_ID[FAMILY_OF[law.id]]?.name}</span>
                    {on && <span className="mr-auto text-xs font-bold">נבחר</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* הצומת והחוק החדש */}
      <section className="scroll-y bg-zinc-50 px-4 py-5 md:px-8" data-col="main">
        <div className="max-w-2xl">
          <h2 className="label mb-2">החוקים שבצומת</h2>
          {selected.length === 0 ? (
            <p className="text-sm text-zinc-500">עוד לא נבחר חוק. בחרי מהרשימה שניים לפחות, והכפתור ייפתח.</p>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selected.length}, minmax(0, 1fr))` }}>
              {selected.map((law) => (
                <div key={law.id} className="bg-white p-3" style={{ boxShadow: `inset 0 3px 0 ${domainColor(law.domain[0])}, 0 1px 3px rgba(0,0,0,.1)` }}>
                  <div className="flex items-start justify-between gap-2">
                    <b className="text-sm leading-tight">{law.name}</b>
                    <button className="btn-soft btn-sm !px-2 !py-0.5" onClick={() => toggle(law)} aria-label={`הסירי את ${law.name}`}>
                      הסירי
                    </button>
                  </div>
                  <p className="meta">{FAMILY_BY_ID[FAMILY_OF[law.id]]?.name}</p>
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-zinc-600">{law.definition}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex gap-1" role="group" aria-label="מי מנסח">
            <button className={`btn btn-sm ${mode === 'ai' ? 'bg-black text-white' : 'bg-white'}`} aria-pressed={mode === 'ai'} onClick={() => setMode('ai')}>
              ה-AI מנסח
            </button>
            <button className={`btn btn-sm ${mode === 'manual' ? 'bg-black text-white' : 'bg-white'}`} aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>
              אני מנסחת
            </button>
          </div>

          {mode === 'ai' && (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button onClick={create} disabled={selected.length < 2 || loading} className="btn-primary">
                  {loading ? 'מנסח חוק חדש...' : 'צרי חוק חדש'}
                </button>
                {selected.length >= 2 && (
                  <span className="meta">
                    {distinctFamilies > 1 ? `צומת בין ${distinctFamilies} משפחות מנגנון.` : 'כל החוקים מאותה משפחה. חוק ממשפחה אחרת יפתיע יותר.'}
                  </span>
                )}
              </div>
              {error && <p className="problem mt-4 text-sm">{error}</p>}

              {result && (
                <article className="mt-5 bg-white p-5 shadow-[0_2px_14px_rgba(0,0,0,.08)]" aria-live="polite">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {result.domain.map((d) => (
                      <DomainBadge key={d} domain={d} />
                    ))}
                  </div>
                  <h2 className="h1">{result.name}</h2>
                  <p className="meta mb-3" dir="ltr" style={{ textAlign: 'right' }}>
                    {result.name_en}
                  </p>
                  <p className="text-lg leading-relaxed">
                    <RichText text={result.definition} />
                  </p>
                  <h3 className="label mb-1 mt-4">מה הוא מגלה שחוקי המקור לא גילו</h3>
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
                      <Link to="/" className="btn-soft">
                        לראות אותו בטבלה
                      </Link>
                    )}
                  </div>
                  <p className="meta mt-3">החוק נוסח בידי AI. זו השערה לבדיקה, לא חוק מוכח.</p>
                </article>
              )}
            </>
          )}

          {mode === 'manual' && (
            <form
              className="mt-3 space-y-3 bg-white p-5 shadow-[0_2px_14px_rgba(0,0,0,.08)]"
              onSubmit={(e) => {
                e.preventDefault();
                saveManual();
              }}
            >
              <label className="block">
                <span className="label">שם החוק</span>
                <input className="input mt-1" value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="עד חמש מילים" />
              </label>
              <label className="block">
                <span className="label flex items-center justify-between">
                  ההגדרה: מה החוק אומר
                  <Dictate onText={(t) => set('definition', draft.definition ? `${draft.definition} ${t}` : t)} />
                </span>
                <textarea className="input mt-1 resize-none" rows={2} value={draft.definition} onChange={(e) => set('definition', e.target.value)} placeholder="משפט אחד" />
              </label>
              <label className="block">
                <span className="label flex items-center justify-between">
                  המנגנון: למה זה קורה
                  <Dictate onText={(t) => set('mechanism', draft.mechanism ? `${draft.mechanism} ${t}` : t)} />
                </span>
                <textarea className="input mt-1 resize-none" rows={2} value={draft.mechanism} onChange={(e) => set('mechanism', e.target.value)} />
              </label>
              <label className="block">
                <span className="label flex items-center justify-between">
                  דוגמה, רצוי מהעיר
                  <Dictate onText={(t) => set('example', draft.example ? `${draft.example} ${t}` : t)} />
                </span>
                <input className="input mt-1" value={draft.example} onChange={(e) => set('example', e.target.value)} />
              </label>
              <div>
                <span className="label">תחומים. הראשון הוא תחום הבית</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {ALL_DOMAINS.map((d) => {
                    const on = draft.domains.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={on}
                        className="btn btn-sm"
                        style={on ? { backgroundColor: domainColor(d), color: domainInk(d) } : { backgroundColor: '#f4f4f5' }}
                        onClick={() => set('domains', on ? draft.domains.filter((x) => x !== d) : [...draft.domains, d])}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <span className="label">משפחת מנגנון</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {FAMILIES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={draft.family === f.id}
                      className={`btn btn-sm ${draft.family === f.id ? 'bg-black text-white' : 'bg-zinc-100'}`}
                      onClick={() => set('family', f.id)}
                      title={f.short}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button className="btn-primary" disabled={!manualReady}>
                  שמרי בחוקים שלי
                </button>
                {!manualReady && <span className="meta">חסרים: שם, הגדרה, תחום אחד לפחות, ומשפחת מנגנון.</span>}
                {manualReady && draftSaved && <span className="meta">הטיוטה נשמרה</span>}
              </div>
              {manualSaved && (
                <p className="solution text-sm" role="status">
                  "{manualSaved}" נשמר, ומופיע בטבלה באריח צהוב.{' '}
                  <Link to="/" className="font-bold underline">
                    לטבלה
                  </Link>
                </p>
              )}
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
