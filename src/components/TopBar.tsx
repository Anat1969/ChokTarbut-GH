import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSavedLaws } from '../lib/store';
import type { User } from '../types';

const NAV = [
  { to: '/library', label: 'גלה' },
  { to: '/explain', label: 'הסבר' },
  { to: '/create', label: 'צור' },
  { to: '/my-laws', label: 'החוקים שלי' },
  { to: '/articles', label: 'כתבות' },
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
            תפריט
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

// בלי התחברות, תמיד (כלל ענת, 21.11.2026): התפריט לא מבקש כניסה. הכול נשמר בענן מיד.
function Menu({ onClose }: { user: User | null; onClose: () => void }) {
  const saved = useSavedLaws();
  return (
    <div
      role="dialog"
      aria-label="תפריט"
      className="absolute left-0 top-10 z-50 w-72 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,.18)]"
    >
      <p className="mb-1 text-sm font-bold">הכול נשמר בענן</p>
      <p className="meta mb-3">
        החוקים שלך והתיקים נשמרים מיד, בלי כניסה ובלי סיסמה, וזמינים בכל מכשיר.
      </p>
      <Link to="/my-laws" className="btn-soft w-full" onClick={onClose}>
        החוקים שלי <span className="num">{saved.length}</span>
      </Link>
    </div>
  );
}
