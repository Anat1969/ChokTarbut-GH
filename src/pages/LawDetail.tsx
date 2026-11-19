import { useParams, useNavigate } from 'react-router-dom';
import { getLawById, getCorrelatedLaws } from '../data/laws';
import DomainBadge from '../components/DomainBadge';
import LawCard from '../components/LawCard';

export default function LawDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const law = id ? getLawById(id) : undefined;

  if (!law) {
    return (
      <div className="page-content px-8 py-16">
        <p className="text-zinc-500">חוק לא נמצא</p>
        <button onClick={() => navigate('/library')} className="btn-secondary mt-4">
          חזרה לספרייה
        </button>
      </div>
    );
  }

  const correlated = getCorrelatedLaws(law.id);

  return (
    <div className="page-content px-8 py-10 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-xs text-zinc-400 hover:text-black transition-colors mb-6 flex items-center gap-1"
      >
        ← חזרה
      </button>

      {/* תגי תחומים */}
      <div className="flex flex-wrap gap-2 mb-4">
        {law.domain.map((d) => (
          <DomainBadge key={d} domain={d} size="md" />
        ))}
      </div>

      {/* כותרת */}
      <h1 className="text-4xl font-black mb-1">{law.name}</h1>
      {law.name_en && (
        <p className="text-sm text-zinc-400 mb-6 font-mono" dir="ltr">
          {law.name_en}
        </p>
      )}

      {/* הגדרה */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-3">הגדרה</h2>
        <p className="text-lg leading-relaxed">{law.definition}</p>
      </section>

      {/* מנגנון */}
      <section className="border-t border-zinc-100 pt-8 mb-8">
        <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-3">מנגנון</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">{law.mechanism}</p>
      </section>

      {/* דוגמאות */}
      <section className="border-t border-zinc-100 pt-8 mb-8">
        <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-4">דוגמאות</h2>
        <div className="space-y-3">
          {law.examples.map((ex, i) => (
            <div key={i} className="flex gap-4">
              <DomainBadge domain={ex.domain} />
              <p className="text-sm text-zinc-700 flex-1">{ex.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* קורלציות */}
      {correlated.length > 0 && (
        <section className="border-t border-zinc-100 pt-8">
          <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-4">
            חוקים קשורים ({correlated.length})
          </h2>
          <div className="grid grid-cols-2 gap-px bg-zinc-200">
            {correlated.map((c) => (
              <LawCard key={c.id} law={c} compact />
            ))}
          </div>
        </section>
      )}

      {/* תגיות */}
      {law.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {law.tags.map((tag) => (
            <span key={tag} className="text-xs text-zinc-400 border border-zinc-200 px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
