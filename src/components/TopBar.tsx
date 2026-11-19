import { useNavigate } from 'react-router-dom';
import { signOut } from '../lib/supabase';
import type { User } from '../types';

interface TopBarProps {
  user: User | null;
}

export default function TopBar({ user }: TopBarProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    window.location.reload();
  };

  return (
    <header className="topbar">
      {/* שם האפליקציה — לוחץ חוזר הביתה */}
      <button
        onClick={() => navigate('/')}
        className="font-bold text-base tracking-tight hover:opacity-70 transition-opacity"
      >
        חוקי התנהגות
      </button>

      <div className="flex-1" />

      {/* ניווט */}
      <nav className="flex items-center gap-6 text-sm">
        <button
          onClick={() => navigate('/library')}
          className="hover:opacity-60 transition-opacity"
        >
          ספרייה
        </button>
        <button
          onClick={() => navigate('/explain')}
          className="hover:opacity-60 transition-opacity"
        >
          הסבר
        </button>
        <button
          onClick={() => navigate('/create')}
          className="hover:opacity-60 transition-opacity"
        >
          צור
        </button>
        {user && (
          <button
            onClick={() => navigate('/my-laws')}
            className="hover:opacity-60 transition-opacity"
          >
            החוקים שלי
          </button>
        )}
      </nav>

      {/* Auth */}
      <div className="mr-6">
        {user ? (
          <div className="flex items-center gap-3">
            {user.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.name ?? 'user'}
                className="w-7 h-7 rounded-full"
              />
            )}
            <button
              onClick={handleSignOut}
              className="text-xs text-zinc-500 hover:text-black transition-colors"
            >
              יציאה
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="btn-primary text-xs px-4 py-2"
          >
            כניסה
          </button>
        )}
      </div>
    </header>
  );
}
