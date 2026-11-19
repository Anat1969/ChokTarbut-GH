import type { Family } from '../data/families';
import FamilyGlyph from './FamilyGlyph';

// משפחת מנגנון: הכלל, התובנה והיישום. כך מוצג כל קשר בין חוקים.
export default function FamilyCard({ family, compact = false }: { family: Family; compact?: boolean }) {
  return (
    <article key={family.id} className={compact ? '' : 'rise'}>
      {!compact && (
        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
          <div>
            <p className="label mb-1">משפחת מנגנון</p>
            <h2 className="h2">{family.name}</h2>
            <p className="mt-1 text-sm text-zinc-600">{family.short}</p>
          </div>
          <FamilyGlyph key={family.id} family={family.id} color="#111" animate className="h-24 w-24 bg-white shadow-[0_1px_3px_rgba(0,0,0,.14)]" />
        </div>
      )}
      <dl className={`grid grid-cols-[52px_1fr] gap-x-3 gap-y-1.5 text-sm leading-relaxed ${compact ? '' : 'mt-3'}`}>
        <dt className="label pt-0.5">הכלל</dt>
        <dd>{family.rule}</dd>
        <dt className="label pt-0.5">התובנה</dt>
        <dd className="font-semibold">{family.insight}</dd>
        <dt className="label pt-0.5 text-green-700">בעיר</dt>
        <dd>{family.apply}</dd>
      </dl>
    </article>
  );
}
