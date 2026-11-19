import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { explainPhenomenon } from '../lib/ai';
import { matchLaws } from '../lib/match';
import { getLawById } from '../data/laws';
import { saveCloudExplanation } from '../lib/supabase';
import LawMap from '../components/LawMap';
import DomainBadge from '../components/DomainBadge';
import RichText from '../components/RichText';
import Dictate from '../components/Dictate';
import type { ExplainResult, Law, User } from '../types';

const DRAFT_KEY = 'chok-explain-draft';
const SAMPLES = [
  'למה הרחבת כביש לא פותרת את הפקק?',
  'למה רחוב עם חנויות מרגיש בטוח יותר בלילה?',
  'למה כולם מזמינים במסעדה שכבר מלאה?',
];

// הסבר מקומי, בלי AI: משמש כשהשרת לא זמין
function localResult(text: string): ExplainResult | null {
  const hits = matchLaws(text);
  if (hits.length === 0) return null;
  return {
    matched_law_ids: hits.map((h) => h.law.id),
    insight: `ההתאמה הקרובה ביותר: **${hits[0].law.name}**.`,
    explanation: hits[0].law.definition,
    per_law: hits.map((h) => ({ id: h.law.id, how: h.law.mechanism })),
    additional_examples: hits[0].law.examples.slice(0, 2),
    by: 'local',
  };
}

export default function Explain({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const [text, setText] = useState(() => localStorage.getItem(DRAFT_KEY) ?? '');
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(false);

  // הטיוטה נשמרת לבד
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, text);
      setSavedAt(text.length > 0);
    }, 400);
    return () => clearTimeout(t);
  }, [text]);

  const live = useMemo(() => (text.trim().length > 3 ? matchLaws(text) : []), [text]);

  const run = async (value: string) => {
    const phenomenon = value.trim();
    if (!phenomenon) return;
    setLoading(true);
    setNote(null);
    setResult(null);
    try {
      const res = await explainPhenomenon(phenomenon);
      setResult(res);
      if (user) {
        saveCloudExplanation(user.id, {
          phenomenon,
          matched_law_ids: res.matched_law_ids,
          explanation: res.explanation,
          insight: res.insight,
        }).catch(() => undefined);
      }
    } catch {
      const local = localResult(phenomenon);
      setResult(local);
      setNote(
        local
          ? 'ה-AI לא זמין כרגע. מוצגת התאמה לפי מילים משותפות, בלי ניסוח חדש. אפשר לנסות שוב בעוד דקה.'
          : 'ה-AI לא זמין כרגע, ולא נמצאה התאמה לפי מילים. נסי לנסח את התופעה במילים אחרות, או שוב בעוד דקה.',
      );
    } finally {
      setLoading(false);
    }
  };

  const matched = (result?.matched_law_ids ?? []).map(getLawById).filter((l): l is Law => Boolean(l));
  const mapIds = result ? result.matched_law_ids : live.map((m) => m.law.id);

  return (
    <main className="page screen grid md:grid-cols-[38.2fr_61.8fr]">
      <section className="scroll-y px-4 py-5 md:px-6">
        <h1 className="h2">
          תארי תופעה. <span className="marker">החוק שמאחוריה</span> יופיע.
        </h1>
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(text);
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(text);
            }}
            placeholder="מה ראית, ומה מסקרן בו?"
            rows={3}
            className="input resize-none"
            aria-label="תיאור התופעה"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="submit" disabled={loading || !text.trim()} className="btn-primary">
              {loading ? 'מחפש את החוק...' : 'הסבירי לי'}
            </button>
            <Dictate onText={(t) => setText((prev) => (prev ? `${prev} ${t}` : t))} />
            {savedAt && <span className="meta">הטיוטה נשמרה</span>}
          </div>
        </form>

        {!result && !loading && (
          <div className="mt-5">
            <p className="label mb-2">או התחילי מדוגמה</p>
            <div className="flex flex-col items-start gap-1.5">
              {SAMPLES.map((s) => (
                <button
                  key={s}
                  className="btn-soft btn-sm text-right"
                  onClick={() => {
                    setText(s);
                    run(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {live.length > 0 && (
              <p className="meta mt-4">
                התאמה ראשונית לפי מילים, עוד לפני ה-AI: {live.map((m) => m.law.name).join(' · ')}
              </p>
            )}
          </div>
        )}

        {note && <p className="problem mt-4 text-sm">{note}</p>}

        {result && (
          <div className="mt-5" aria-live="polite">
            <p className="text-xl font-black leading-snug">
              <RichText text={result.insight} />
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              <RichText text={result.explanation} />
            </p>

            <h2 className="label mb-2 mt-5">
              <b className="text-black">{matched.length}</b> חוקים מסבירים את התופעה
            </h2>
            <ul className="space-y-2">
              {matched.map((law) => (
                <li key={law.id}>
                  <Link to={`/law/${law.id}`} className="row bg-zinc-50">
                    <span className="mb-1 flex flex-wrap items-center gap-1.5">
                      <b className="text-sm">{law.name}</b>
                      {law.domain.map((d) => (
                        <DomainBadge key={d} domain={d} />
                      ))}
                    </span>
                    <span className="block text-xs leading-relaxed text-zinc-600">
                      <RichText text={result.per_law.find((p) => p.id === law.id)?.how ?? law.definition} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {result.additional_examples.length > 0 && (
              <>
                <h2 className="label mb-2 mt-5">אותו חוק, בתחום אחר</h2>
                <ul className="space-y-2">
                  {result.additional_examples.map((ex, i) => (
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
              </>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {matched.length >= 2 && (
                <Link to={`/create?with=${matched.map((l) => l.id).join(',')}`} className="btn-primary">
                  צרי חוק חדש מהחוקים האלה
                </Link>
              )}
              <button className="btn-soft" onClick={() => setResult(null)}>
                תופעה אחרת
              </button>
            </div>
            <p className="meta mt-3">
              {result.by === 'local' ? 'התאמה מקומית, בלי AI.' : 'ההסבר נוסח בידי AI על בסיס החוקים שבמאגר. הדוגמאות הנוספות הן הצעה לבדיקה.'}
            </p>
          </div>
        )}
      </section>

      <section className="hidden min-h-0 flex-col px-4 py-4 md:flex">
        <p className="meta px-2">
          {mapIds.length > 0
            ? 'החוקים שנמצאו מסומנים במפה, עם הקשרים ביניהם.'
            : 'כאן יסומנו החוקים שמסבירים את התופעה. לחיצה על חוק פותחת אותו.'}
        </p>
        <LawMap highlightIds={mapIds} onSelect={(id) => navigate(`/law/${id}`)} className="min-h-0 w-full flex-1" />
      </section>
    </main>
  );
}
