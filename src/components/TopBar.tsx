import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { isGoogleEnabled, signInWithGoogle, signInWithPassword, signOut } from '../lib/supabase';
import { useSavedLaws } from '../lib/store';
import type { User } from '../types';

const NAV = [
  { to: '/library', label: 'גלה' },
  { to: '/explain', label: 'הסבר' },
  { to: '/create', label: 'צור' },
  { to: '/my-laws', label: 'החוקים שלי' },
];

export default function TopBar({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);
  const saved = useSavedLaws();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <header className="topbar">
      <div className="flex h-[52px] items-center gap-4 px-4 md:px-6">
        <Link to="/" className="text-base font-black tracking-tight hover:opacity-70">
          חוקי התנהגות
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="ניווט ראשי">
          <NavItems saved={saved.length} />
        </nav>
        <div className="flex-1" />
        <div className="relative" ref={box}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="dialog"
            className="btn-primary btn-sm h-8"
          >
            {user ? user.name ?? user.email.split('@')[0] : 'תפריט'}
          </button>
          {open && <Menu user={user} onClose={() => setOpen(false)} />}
        </div>
      </div>
      <nav className="flex h-9 items-center gap-1 px-3 md:hidden" aria-label="ניווט ראשי">
        <NavItems saved={saved.length} />
      </nav>
    </header>
  );
}

function NavItems({ saved }: { saved: number }) {
  return (
    <>
      {NAV.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `px-3 py-1.5 text-sm transition-colors hover:bg-zinc-100 ${isActive ? 'bg-zinc-100 font-bold' : ''}`
          }
        >
          {label}
          {to === '/my-laws' && saved > 0 && <span className="meta mr-1">{saved}</span>}
        </NavLink>
      ))}
    </>
  );
}

function Menu({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [google, setGoogle] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) isGoogleEnabled().then(setGoogle);
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await signInWithPassword(email.trim(), password);
    setBusy(false);
    if (err) setError('הכניסה נכשלה. בדקי את האימייל והסיסמה ונסי שוב.');
    else onClose();
  };

  return (
    <div
      role="dialog"
      aria-label="תפריט"
      className="absolute left-0 top-10 z-50 w-72 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,.18)]"
    >
      {user ? (
        <>
          <p className="label mb-1">מחוברת</p>
          <p className="mb-3 break-all text-sm">{user.email}</p>
          <p className="meta mb-3">החוקים שלך נשמרים בענן, וזמינים בכל מכשיר.</p>
          <button
            className="btn-soft w-full"
            onClick={async () => {
              await signOut();
              onClose();
            }}
          >
            יציאה
          </button>
        </>
      ) : (
        <>
          <p className="mb-1 text-sm font-bold">כניסה</p>
          <p className="meta mb-3">בלי כניסה, החוקים שלך נשמרים במכשיר הזה. עם כניסה, גם בענן.</p>
          {google === true && (
            <button className="btn-primary mb-3 w-full" onClick={() => signInWithGoogle()}>
              כניסה עם Google
            </button>
          )}
          {google === false && (
            <form onSubmit={submit} className="space-y-2">
              <input
                className="input"
                type="email"
                name="email"
                autoComplete="username"
                placeholder="אימייל"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="flex gap-1">
                <input
                  className="input"
                  type={show ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="סיסמה"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="btn-soft btn-sm shrink-0" onClick={() => setShow((v) => !v)} aria-pressed={show}>
                  {show ? 'הסתירי' : 'הציגי'}
                </button>
              </div>
              {error && <p className="problem text-xs">{error}</p>}
              <button className="btn-primary w-full" disabled={busy}>
                {busy ? 'נכנסת...' : 'כניסה'}
              </button>
              <p className="meta">כניסה עם Google כבויה בפרויקט. הכניסה היא עם החשבון הקיים שלך.</p>
            </form>
          )}
          {google === null && <p className="meta">בודק אפשרויות כניסה...</p>}
        </>
      )}
    </div>
  );
}
