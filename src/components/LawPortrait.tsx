import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLawById } from '../data/laws';
import { NEIGHBORS } from '../lib/graph';
import { findCorrelations } from '../lib/ai';
import { saveLaw, removeLaw, isMarked, newId, useSavedLaws } from '../lib/store';
import DomainBadge, { domainColor } from './DomainBadge';
import Evidence from './Evidence';
import RichText from './RichText';
import FamilyCard from './FamilyCard';
import { familyOf, quoteOf, FAMILY_OF } from '../data/families';
import type { Law, CorrelationResult } from '../types';

interface Props {
  law: Law;
  onSelect?: (id: string) => void; // בחירת חוק קשור: במקום, בלי לעזוב את המסך
  brief?: boolean; // דיוקן קצר, לדף הבית
}

// דיוקן של חוק בהקשר: מה הוא אומר, איך הוא פועל, איפה הוא מופיע, ולמה הוא קשור
export default function LawPortrait({ law, onSelect, brief = false }: Props) {
  const navigate = useNavigate();
  useSavedLaws();
  const marked = isMarked(law.id);
  const [ai, setAi] = useState<{ id: string; data?: CorrelationResult; error?: string; loading?: boolean } | null>(null);
  const aiState = ai?.id === law.id ? ai : null;
  const neighbors = NEIGHBORS[law.id].map(getLawById).filter((l): l is Law => Boolean(l));

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

  const discover = async () => {
    setAi({ id: law.id, loading: true });
    try {
      setAi({ id: law.id, data: await findCorrelations(law) });
    } catch {
      setAi({ id: law.id, error: 'ה-AI לא זמין כרגע. נסי שוב בעוד דקה. הקשרים הקיימים מוצגים למעלה.' });
    }
  };

  return (
    <article>
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
      <p className={`leading-relaxed ${brief ? 'text-sm' : 'text-lg'}`}>{law.definition}</p>

      {brief && (
        <p className="mt-3 grid grid-cols-[72px_1fr] items-baseline gap-3 text-sm">
          <span>
            <DomainBadge domain={cityFirst.domain} />
          </span>
          <span className="leading-relaxed text-zinc-700">{cityFirst.description}</span>
        </p>
      )}

      {!brief && (
        <>
          <h3 className="label mb-1 mt-5">המנגנון</h3>
          <p className="text-sm leading-relaxed text-zinc-700">{law.mechanism}</p>

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

          <h3 className="label mb-2 mt-5">אותו חוק, בתחומים שונים</h3>
          <ul className="space-y-2">
            {law.examples.map((ex, i) => (
              <li key={i} className="grid grid-cols-[72px_1fr] items-baseline gap-3 text-sm">
                <span>
                  <DomainBadge domain={ex.domain} />
                </span>
                <span className="leading-relaxed text-zinc-700">{ex.description}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {family && (
        <p className="mt-4 text-sm">
          <span className="label">משפחת מנגנון: </span>
          <b>{family.name}</b>. <span className="text-zinc-600">{family.short}</span>
        </p>
      )}
      {!brief && family && (
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
              {aiState?.loading ? 'מחפש קשרים...' : 'גלי קשרים מפתיעים'}
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

      {aiState?.error && <p className="problem mt-3 text-sm">{aiState.error}</p>}
      {aiState?.data && (
        <section className="mt-5 bg-zinc-50 p-4" aria-live="polite">
          <p className="mb-3 text-base font-bold">
            <RichText text={aiState.data.meta_pattern} />
          </p>
          <ul className="space-y-3">
            {aiState.data.correlations.map((c, i) => (
              <li key={i} className="text-sm">
                <div className="mb-0.5 flex items-center gap-2">
                  <DomainBadge domain={c.domain} />
                  <b>{c.law_name}</b>
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
          <p className="meta mt-3">נוסח בידי AI. הצעה לבדיקה, לא עובדה מהמאגר.</p>
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
