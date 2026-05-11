/**
 * WealthOS — Supabase Browser Client
 * Used for auth (sign-in, sign-up, session management) in the React frontend.
 * All data operations go through the FastAPI backend (see api.js).
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[WealthOS] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.\n' +
    'Add them to frontend/.env — see .env.example for details.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Subscribe to auth state changes.
 * Usage: onAuthChange((session) => setUser(session?.user ?? null))
 */
export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return subscription;
}

/** Sign in with email + password */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Sign up new user */
export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

/** Sign out */
export async function signOut() {
  await supabase.auth.signOut();
}

/** Get current session synchronously */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
