import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../lib/supabase';
import type { User } from '../types';

interface HomeProps {
  user: User | null;
}

const engines = [
  {
    id: 'library',
    label: 'גלה',
    sub: 'ספריית חוקי התנהגות',
    path: '/library',
    description: '20 חוקים ממדעים שונים — כולם מחכים לחיבור',
  },
  {
    id: 'explain',
    label: 'הסבר',
    sub: 'תופעה ← חוק',
    path: '/explain',
    description: 'תאר תופעה שמסקרנת אותך וגלה איזה חוק מסביר אותה',
  },
  {
    id: 'create',
    label: 'צור',
    sub: 'חוק חדש מקורלציות',
    path: '/create',
    description: 'בחר שני חוקים מתחומים שונים — ה-AI יסנתז חוק חדש',
  },
];

export default function Home({ user }: HomeProps) {
  const navigate = useNavigate();

  return (
    <div className="page-content">
      {/* Hero */}
      <section className="border-b border-zinc-100 px-8 py-16">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-zinc-400 mb-4">
            מדע × עיצוב × חשיבה
          </p>
          <h1 className="text-5xl font-black leading-tight mb-6">
            חוקי<br />התנהגות
          </h1>
          <p className="text-zinc-600 text-lg leading-relaxed max-w-lg">
            דפוסים שחוזרים בביולוגיה, חברה, ספורט, ועיר.
            למד אותם. השתמש בהם. צור חדשים.
          </p>
        </div>
      </section>

      {/* שלושה מנועים */}
      <section className="px-8 py-12">
        <div className="grid grid-cols-3 gap-px bg-zinc-200 max-w-5xl">
          {engines.map((engine) => (
            <button
              key={engine.id}
              onClick={() => navigate(engine.path)}
              className="bg-white p-8 text-right hover:bg-zinc-50 transition-colors group"
            >
              <div className="text-4xl font-black mb-1 group-hover:text-zinc-700 transition-colors">
                {engine.label}
              </div>
              <div className="text-xs text-zinc-400 mb-4 font-mono">
                {engine.sub}
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {engine.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Auth — רק אם לא מחובר */}
      {!user && (
        <section className="px-8 pb-16">
          <div className="border border-zinc-200 p-8 max-w-md">
            <p className="text-sm text-zinc-600 mb-4">
              כנסי עם Google כדי לשמור חוקים שיצרת ולעקוב אחרי ההסברים שלך
            </p>
            <button
              onClick={() => signInWithGoogle()}
              className="btn-primary w-full"
            >
              כניסה עם Google
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
