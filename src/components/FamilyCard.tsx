import type { Family } from '../data/families';

// משפחת מנגנון: הכלל, התובנה והיישום. כך מוצג כל קשר בין חוקים.
export default function FamilyCard({ family, compact = false }: { family: Family; compact?: boolean }) {
  return (
    <article>
      {!compact && (
        <>
          <p className="label mb-1">משפחת מנגנון</p>
          <h2 className="h2">{family.name}</h2>
        </>
      )}
      <dl className={`grid grid-cols-[52px_1fr] gap-x-3 gap-y-1.5 text-sm leading-relaxed ${compact ? '' : 'mt-3'}`}>
        <dt className="label pt-0.5">הכלל</dt>
        <dd>{family.rule}</dd>
        <dt className="label pt-0.5">התובנה</dt>
        <dd>
          <mark className="marker bg-transparent">{family.insight}</mark>
        </dd>
        <dt className="label pt-0.5 text-green-700">בעיר</dt>
        <dd>{family.apply}</dd>
      </dl>
    </article>
  );
}
