import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { syncLaws } from './lib/store';
import { syncCases } from './lib/cases';
import TopBar from './components/TopBar';
import Home from './pages/Home';
import Library from './pages/Library';
import LawDetail from './pages/LawDetail';
import Explain from './pages/Explain';
import Create from './pages/Create';
import MyLaws from './pages/MyLaws';
import type { User } from './types';

function ScrollTop() {
  const { pathname } = useLocation();
  // בסוגריים מסולסלים: בדפדפנים חדשים scrollTo מחזיר Promise, ו-useEffect מקבל רק פונקציית ניקוי
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  // התיקים והחוקים שלי בענן, בלי התחברות: נמשכים בכל פתיחה
  useEffect(() => {
    syncCases();
    syncLaws();
  }, []);

  // האפליקציה נטענת מיד. הכניסה נבדקת ברקע, ולא חוסמת את המסך.
  useEffect(() => {
    const apply = (u: { id: string; email?: string; user_metadata?: Record<string, string> } | null | undefined) => {
      setUser(u ? { id: u.id, email: u.email ?? '', name: u.user_metadata?.full_name } : null);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session?.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session?.user));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <ScrollTop />
      <TopBar user={user} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/law/:id" element={<LawDetail />} />
        <Route path="/explain" element={<Explain user={user} />} />
        <Route path="/create" element={<Create />} />
        <Route path="/my-laws" element={<MyLaws user={user} />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
