import { useState } from 'react';
import { useCases, casesOf, tally, fileCase, removeCase } from '../lib/cases';
import type { Law, Verdict } from '../types';

const VERDICT: Record<Verdict, { label: string; note: string; cls: string }> = {
  applied: { label: 'הופעל', note: 'החוק הסביר את התופעה', cls: 'text-green-700' },
  distinguished: { label: 'הובחן', note: 'החוק נראה רלוונטי, ולא חל כאן', cls: 'text-red-700' },
};

// התיקים של חוק: תופעות מהשטח שהוא הסביר, או שלא חל עליהן.
// בהשראת המשפט המקובל: חוק מקבל משקל מהתקדימים שלו, וגבולות מההבחנות.
export default function Cases({ law }: { law: Law }) {
  const all = useCases();
  const list = casesOf(all, law.id);
  const t = tally(all, law.id);
  const [open, setOpen] = useState(false);
  const [phenomenon, setPhenomenon] = useState('');
  const [verdict, setVerdict] = useState<Verdict>('applied');
  const [decision, setDecision] = useState('');

  const submit = () => {
    if (!phenomenon.trim()) return;
    fileCase({ law_id: law.id, phenomenon, verdict, decision });
    setPhenomenon('');
    setDecision('');
    setOpen(false);
  };

  return (
    <section className="mt-8" aria-label="תיקים מהשטח">
      <h3 className="h2 mb-1">תיקים מהשטח</h3>
      <p className="mb-3 text-sm text-zinc-700">
        {t.total === 0 ? (
          <>החוק עוד לא נבחן בשטח. כל תופעה שהוא מסביר, או לא מסביר, נכנסת לכאן כתקדים.</>
        ) : (
          <>
            <b className="num">{t.applied}</b> הופעל · <b className="num">{t.distinguished}</b> הובחן.{' '}
            <span className="text-zinc-500">ראיות מהשטח, בנוסף לחוזק הראיות מהמחקר.</span>
          </>
        )}
      </p>

      {list.length > 0 && (
        <ol className="space-y-2">
          {list.map((c) => (
            <li key={c.id} className="grid grid-cols-[56px_1fr_auto] items-baseline gap-3 bg-white p-3 text-sm shadow-[0_1px_3px_rgba(0,0,0,.12)]">
              <span className={`font-bold ${VERDICT[c.verdict].cls}`} title={VERDICT[c.verdict].note}>
                {VERDICT[c.verdict].label}
              </span>
              <span className="min-w-0">
                <span className="block leading-relaxed">{c.phenomenon}</span>
                {c.decision && (
                  <span className="mt-0.5 block leading-relaxed text-zinc-600">
                    <span className="label">ההחלטה: </span>
                    {c.decision}
                  </span>
                )}
                <span className="meta num">{new Date(c.created_at).toLocaleDateString('he-IL')}</span>
              </span>
              <button className="btn-soft btn-sm" onClick={() => removeCase(c.id)} aria-label={`מחיקת התיק: ${c.phenomenon}`}>
                מחיקה
              </button>
            </li>
          ))}
        </ol>
      )}

      {!open ? (
        <button className="btn-soft mt-3" onClick={() => setOpen(true)}>
          פתחי תיק
        </button>
      ) : (
        <form
          className="mt-3 bg-zinc-50 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <textarea
            className="input resize-none"
            rows={2}
            maxLength={600}
            placeholder="מה ראית בשטח?"
            aria-label="התופעה"
            value={phenomenon}
            onChange={(e) => setPhenomenon(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="ההכרעה">
            {(Object.keys(VERDICT) as Verdict[]).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={verdict === v}
                className={verdict === v ? 'btn-primary btn-sm' : 'btn-soft btn-sm'}
                onClick={() => setVerdict(v)}
                title={VERDICT[v].note}
              >
                {VERDICT[v].label}: {VERDICT[v].note}
              </button>
            ))}
          </div>
          <input
            className="input mt-2"
            maxLength={600}
            placeholder="מה הוחלט בעקבות זה? (לא חובה)"
            aria-label="ההחלטה"
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button type="submit" className="btn-primary" disabled={!phenomenon.trim()}>
              שמרי את התיק
            </button>
            <button type="button" className="btn-soft" onClick={() => setOpen(false)}>
              ביטול
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
