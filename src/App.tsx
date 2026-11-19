import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import TopBar from './components/TopBar';
import Home from './pages/Home';
import Library from './pages/Library';
import LawDetail from './pages/LawDetail';
import Explain from './pages/Explain';
import Create from './pages/Create';
import MyLaws from './pages/MyLaws';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // קבל session קיים
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.full_name,
          avatar_url: session.user.user_metadata?.avatar_url,
        });
      }
      setAuthLoading(false);
    });

    // הקשב לשינויי auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.full_name,
          avatar_url: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-zinc-400 text-sm">טוען...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <TopBar user={user} />
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/library" element={<Library />} />
        <Route path="/law/:id" element={<LawDetail />} />
        <Route path="/explain" element={<Explain />} />
        <Route path="/create" element={<Create user={user} />} />
        <Route path="/my-laws" element={<MyLaws user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}
