/**
 * Articles.tsx — ספריית כתבות
 * מציגה את כל הכתבות שנכתבו, עם קישור לחוק
 */

import { useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { subscribeArticles, getArticlesMap } from '../lib/articles';
import { INITIAL_LAWS } from '../data/laws';

export default function Articles() {
  const map = useSyncExternalStore(subscribeArticles, getArticlesMap);
  const entries = Object.entries(map).filter(([, text]) => text.trim().length > 0);

  // מציאת שם החוק לפי id
  function lawName(id: string): string {
    return INITIAL_LAWS.find((l) => l.id === id)?.name ?? id;
  }

  return (
    <main className="page-root" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-black mb-1">כתבות</h1>
        <p className="meta mb-8">כתבות שנכתבו על חוקי ההתנהגות</p>

        {entries.length === 0 ? (
          <p className="text-zinc-400 text-sm">עדיין לא נכתבו כתבות.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {entries.map(([lawId, text]) => {
              const preview = text.trim().slice(0, 220);
              const hasMore = text.trim().length > 220;
              return (
                <article key={lawId} className="border-b border-zinc-100 pb-6">
                  <Link
                    to={`/law/${lawId}`}
                    className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-800 transition-colors"
                  >
                    {lawName(lawId)}
                  </Link>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                    {preview}{hasMore && <span className="text-zinc-400">…</span>}
                  </p>
                  <Link
                    to={`/law/${lawId}`}
                    className="mt-3 inline-block text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    קראי את הכתבה המלאה ←
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
