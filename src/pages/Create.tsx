import { useState } from 'react';
import { INITIAL_LAWS } from '../data/laws';
import { createNewLaw } from '../lib/claude';
import { saveUserLaw } from '../lib/supabase';
import LawCard from '../components/LawCard';
import DomainBadge from '../components/DomainBadge';
import type { Law, CreateLawResult, User } from '../types';

interface CreateProps {
  user: User | null;
}

export default function Create({ user }: CreateProps) {
  const [selected, setSelected] = useState<Law[]>([]);
  const [result, setResult] = useState<CreateLawResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLaw = (law: Law) => {
    setSelected((prev) => {
      const exists = prev.find((l) => l.id === law.id);
      if (exists) return prev.filter((l) => l.id !== law.id);
      if (prev.length >= 3) return prev; // מקסימום 3
      return [...prev, law];
    });
  };

  const handleCreate = async () => {
    if (selected.length < 2) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      const res = await createNewLaw(selected);
      setResult(res);
    } catch (err) {
      setError('שגיאה ביצירה. נסי שוב.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user) return;

    try {
      await saveUserLaw({
        user_id: user.id,
        name: result.name,
        name_en: result.name_en,
        domain: result.domain,
        definition: result.definition,
        mechanism: result.mechanism,
        examples: result.examples,
        tags: result.tags,
        parent_law_ids: selected.map((l) => l.id),
        why_novel: result.why_novel,
        source: 'claude-generated',
        created_by: 'anat',
      });
      setSaved(true);
    } catch (err) {
      setError('שגיאה בשמירה.');
    }
  };

  return (
    <div className="page-content px-8 py-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="section-title mb-1">צור חוק חדש</h1>
        <p className="text-sm text-zinc-500">
          בחרי 2–3 חוקים מתחומים שונים — ה-AI יסנתז מהם חוק חדש
        </p>
      </div>

      <div className="grid grid-cols-5 gap-8">
        {/* בחירת חוקים */}
        <div className="col-span-3">
          <div className="text-xs uppercase tracking-widest text-zinc-400 mb-3">
            בחרי חוקים ({selected.length}/3)
          </div>
          <div className="grid grid-cols-2 gap-px bg-zinc-200 max-h-[60vh] overflow-y-auto">
            {INITIAL_LAWS.map((law) => (
              <LawCard
                key={law.id}
                law={law}
                compact
                selected={!!selected.find((l) => l.id === law.id)}
                onSelect={toggleLaw}
              />
            ))}
          </div>
        </div>

        {/* פאנל ימני */}
        <div className="col-span-2">
          {/* חוקים שנבחרו */}
          <div className="mb-6">
            <div className="text-xs uppercase tracking-widest text-zinc-400 mb-3">
              נבחרו
            </div>
            {selected.length === 0 ? (
              <p className="text-sm text-zinc-400">בחרי לפחות 2 חוקים</p>
            ) : (
              <div className="space-y-2">
                {selected.map((law) => (
                  <div
                    key={law.id}
                    className="flex items-start gap-2 p-3 border border-zinc-200"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{law.name}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {law.domain.map((d) => (
                          <DomainBadge key={d} domain={d} />
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleLaw(law)}
                      className="text-zinc-300 hover:text-black text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* כפתור יצירה */}
          <button
            onClick={handleCreate}
            disabled={selected.length < 2 || loading}
            className="btn-primary w-full mb-6 disabled:opacity-40"
          >
            {loading ? 'יוצר חוק...' : 'צור חוק חדש'}
          </button>

          {error && (
            <div className="text-sm text-red-600 mb-4">{error}</div>
          )}

          {/* תוצאה */}
          {result && (
            <div className="border border-zinc-200 p-5">
              <div className="flex flex-wrap gap-1 mb-3">
                {result.domain.map((d) => (
                  <DomainBadge key={d} domain={d as Law['domain'][number]} />
                ))}
              </div>
              <h3 className="font-bold text-lg mb-1">{result.name}</h3>
              <p className="text-xs text-zinc-400 font-mono mb-3" dir="ltr">
                {result.name_en}
              </p>
              <p className="text-sm text-zinc-700 leading-relaxed mb-3">
                {result.definition}
              </p>
              <p className="text-xs text-zinc-500 italic mb-4">{result.why_novel}</p>

              {user ? (
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className="btn-primary w-full text-sm disabled:opacity-40"
                >
                  {saved ? 'נשמר' : 'שמרי את החוק'}
                </button>
              ) : (
                <p className="text-xs text-zinc-400 text-center">
                  כנסי עם Google כדי לשמור
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
