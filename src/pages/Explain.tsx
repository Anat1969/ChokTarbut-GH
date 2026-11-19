import { useState } from 'react';
import { explainPhenomenon } from '../lib/claude';
import { getLawById } from '../data/laws';
import LawCard from '../components/LawCard';
import type { ExplainResult } from '../types';

export default function Explain() {
  const [phenomenon, setPhenomenon] = useState('');
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phenomenon.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await explainPhenomenon(phenomenon);
      setResult(res);
    } catch (err) {
      setError('שגיאה בחיבור ל-Claude. נסי שוב.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const matchedLaws = result?.matched_law_ids
    .map((id) => getLawById(id))
    .filter(Boolean) ?? [];

  return (
    <div className="page-content px-8 py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="section-title mb-1">הסבר תופעה</h1>
        <p className="text-sm text-zinc-500">
          תארי תופעה שמסקרנת אותך — ה-AI ימצא איזה חוק התנהגות מסביר אותה
        </p>
      </div>

      {/* טופס */}
      <form onSubmit={handleSubmit} className="mb-10">
        <textarea
          value={phenomenon}
          onChange={(e) => setPhenomenon(e.target.value)}
          placeholder="לדוגמה: מדוע רשתות חברתיות מייצרות דעות קיצוניות? או: למה ערים גדולות מייצרות יותר חדשנות?"
          rows={4}
          className="input resize-none mb-3"
          dir="rtl"
        />
        <button
          type="submit"
          disabled={loading || !phenomenon.trim()}
          className="btn-primary w-full disabled:opacity-40"
        >
          {loading ? 'מנתח...' : 'הסבר'}
        </button>
      </form>

      {/* שגיאה */}
      {error && (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* תוצאה */}
      {result && (
        <div className="space-y-8">
          {/* חוקים מותאמים */}
          {matchedLaws.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-4">
                החוקים שמסבירים את התופעה
              </h2>
              <div className="grid grid-cols-1 gap-px bg-zinc-200">
                {matchedLaws.map((law) => law && <LawCard key={law.id} law={law} />)}
              </div>
            </section>
          )}

          {/* הסבר */}
          <section>
            <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-3">הסבר</h2>
            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
              {result.explanation}
            </p>
          </section>

          {/* דוגמאות נוספות */}
          {result.additional_examples.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-3">
                דוגמאות נוספות מאותו חוק
              </h2>
              <div className="space-y-2">
                {result.additional_examples.map((ex, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-zinc-400 font-mono text-xs mt-0.5">{ex.domain}</span>
                    <span className="text-zinc-700">{ex.description}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* תובנה */}
          {result.insight && (
            <section className="border-t border-zinc-100 pt-6">
              <p className="text-base font-bold">{result.insight}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
