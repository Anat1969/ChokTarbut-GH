import { useFinding } from '../lib/findings';
import RichText from './RichText';
import FoundLaw from './FoundLaw';
import { getLawById } from '../data/laws';
import type { AppEvidence } from '../lib/ai';
import type { CorrelationResult } from '../types';

// הפרק האחרון של כתבה: מה שה-AI גילה על החוק במסך החוק, ונשמר.
// מופיע רק אם יש ממצא. זו הצעה לבדיקה, ולכן הוא מסומן ונפרד מגוף הכתבה.
export default function ArticleFindings({ lawId }: { lawId: string }) {
  const links = useFinding<CorrelationResult & { saved_at?: string }>(lawId, 'correlations');
  const lawName = getLawById(lawId)?.name ?? lawId;
  const apps = useFinding<AppEvidence>(lawId, 'apps');
  const hasLinks = Boolean(links?.correlations?.length);
  const hasApps = Boolean(apps?.picks?.length);
  if (!hasLinks && !hasApps) return null;

  return (
    <section className="article-read article-found" aria-label="מה התגלה בדרך">
      <h3 className="article-chapter-head">מה התגלה בדרך</h3>
      {hasLinks && (
        <>
          <p className="label">קשרים מפתיעים</p>
          <p className="mt-1 font-bold">
            <RichText text={links!.meta_pattern} />
          </p>
          <ul className="mt-3 space-y-2">
            {links!.correlations.map((c, i) => (
              <li key={i}>
                <FoundLaw name={c.law_name} bornFrom={lawName} savedAt={links!.saved_at} /> <span className="meta">({c.domain})</span>
                <span className="block text-zinc-700">
                  <RichText text={c.shared_mechanism} />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {hasApps && (
        <>
          <p className="label mt-6">איפה אפשר לבדוק את זה</p>
          <ul className="mt-2 space-y-2">
            {apps!.picks.map((p) => (
              <li key={p.id}>
                <a href={p.url} target="_blank" rel="noreferrer" className="font-bold underline decoration-2 underline-offset-2">
                  {p.title}
                </a>
                <span className="block text-zinc-700">
                  <RichText text={p.experiment} />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="meta mt-4">נוסח בידי AI במסך החוק. הצעה לבדיקה, לא עובדה מהמאגר.</p>
    </section>
  );
}
