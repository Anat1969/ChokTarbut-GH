import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Auth helpers
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Database helpers
export async function getUserLaws(userId: string) {
  const { data, error } = await supabase
    .from('user_laws')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function saveUserLaw(law: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('user_laws')
    .insert(law)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserLaw(id: string, userId: string) {
  const { error } = await supabase
    .from('user_laws')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function saveExplanation(explanation: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('explanations')
    .insert(explanation)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getExplanations(userId: string) {
  const { data, error } = await supabase
    .from('explanations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}
