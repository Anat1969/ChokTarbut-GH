import { useState, useEffect } from 'react';
import { getUserLaws, deleteUserLaw } from '../lib/supabase';
import DomainBadge from '../components/DomainBadge';
import type { User, UserLaw } from '../types';

interface MyLawsProps {
  user: User | null;
}

export default function MyLaws({ user }: MyLawsProps) {
  const [laws, setLaws] = useState<UserLaw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserLaws(user.id)
      .then((data) => setLaws((data as UserLaw[]) ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteUserLaw(id, user.id);
    setLaws((prev) => prev.filter((l) => l.id !== id));
  };

  if (!user) {
    return (
      <div className="page-content px-8 py-16">
        <p className="text-zinc-500">יש להיכנס עם Google כדי לראות את החוקים שלך</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-content px-8 py-16">
        <p className="text-zinc-400 text-sm">טוען...</p>
      </div>
    );
  }

  return (
    <div className="page-content px-8 py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="section-title mb-1">החוקים שלי</h1>
        <p className="text-sm text-zinc-500">{laws.length} חוקים שיצרת</p>
      </div>

      {laws.length === 0 ? (
        <div className="border border-zinc-100 p-10 text-center text-zinc-400 text-sm">
          עדיין לא יצרת חוקים.
          <br />
          לכי ל<strong>צור</strong> ובחרי שני חוקים.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-zinc-200">
          {laws.map((law) => (
            <div key={law.id} className="bg-white p-5">
              <div className="flex flex-wrap gap-1 mb-3">
                {law.domain.map((d) => (
                  <DomainBadge key={d} domain={d} />
                ))}
              </div>
              <h3 className="font-bold text-base mb-1">{law.name}</h3>
              {law.name_en && (
                <p className="text-xs text-zinc-400 font-mono mb-2" dir="ltr">
                  {law.name_en}
                </p>
              )}
              <p className="text-sm text-zinc-600 leading-relaxed mb-3 line-clamp-3">
                {law.definition}
              </p>
              {law.why_novel && (
                <p className="text-xs text-zinc-400 italic mb-4">{law.why_novel}</p>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <span className="text-xs text-zinc-400">
                  {new Date(law.created_at).toLocaleDateString('he-IL')}
                </span>
                <button
                  onClick={() => handleDelete(law.id)}
                  className="text-xs text-zinc-300 hover:text-red-500 transition-colors"
                >
                  מחקי
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
