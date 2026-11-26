import { Link } from 'react-router-dom';
import { getLawById } from '../data/laws';
import { FAMILY_BY_ID, type FamilyId } from '../data/families';
import type { MineLaw } from '../lib/mine';
import DomainBadge from './DomainBadge';
import FamilyGlyph from './FamilyGlyph';
import RichText from './RichText';

// דיוקן של חוק שענת ניסחה: אותו סדר קריאה של חוק מהמאגר, בלי שער תמונה,
// ועם המקור שלו, החוקים שמהם נולד. מסומן בצהוב־תובנה, ו"לא אומת" במקום ציון ראיות.
export default function MineLawCard({ law, onSelect }: { law: MineLaw; onSelect?: (id: string) => void }) {
  const family = law.family ? FAMILY_BY_ID[law.family as FamilyId] : undefined;
  return (
    <article data-mine-card={law.id}>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="marker text-xs font-bold">חוק שניסחת</span>
        {law.domain.map((d) => (
          <DomainBadge key={d} domain={d} />
        ))}
        <span className="meta mr-auto">{law.source} · לא אומת בשטח</span>
      </div>
      <h2 className="text-[26px] font-black leading-tight">{law.name}</h2>
      {law.name_en && <p className="meta mt-0.5" dir="ltr">{law.name_en}</p>}

      <p className="mt-4 text-base leading-relaxed">
        <RichText text={law.definition} />
      </p>

      {law.mechanism && (
        <section className="mt-5">
          <h3 className="mb-1 text-xs font-bold text-zinc-500">המנגנון</h3>
          <p className="text-sm leading-relaxed text-zinc-800">
            <RichText text={law.mechanism} />
          </p>
        </section>
      )}

      {family && (
        <section className="mt-5 flex items-start gap-3 bg-zinc-50 p-3">
          <FamilyGlyph family={family.id} className="h-10 w-10 shrink-0" />
          <div>
            <h3 className="text-sm font-bold">משפחה: {family.name}</h3>
            <p className="text-xs leading-relaxed text-zinc-600">{family.short}</p>
          </div>
        </section>
      )}

      {law.examples.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-1 text-xs font-bold text-zinc-500">דוגמאות</h3>
          <ul className="space-y-2">
            {law.examples.map((e, i) => (
              <li key={i} className="text-sm leading-relaxed">
                <b>{e.domain}:</b> <RichText text={e.description} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {law.parents.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-1 text-xs font-bold text-zinc-500">נולד מ</h3>
          <ul className="flex flex-wrap gap-1.5">
            {law.parents.map((id) => {
              const p = getLawById(id);
              if (!p) return null;
              return (
                <li key={id}>
                  {onSelect ? (
                    <button className="btn-soft btn-sm" onClick={() => onSelect(id)}>
                      {p.name}
                    </button>
                  ) : (
                    <Link className="btn-soft btn-sm" to={`/law/${id}`}>
                      {p.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Link to={`/my-laws?law=${law.id}`} className="btn-soft btn-sm mt-6">
        לחוקים שלי
      </Link>
    </article>
  );
}
