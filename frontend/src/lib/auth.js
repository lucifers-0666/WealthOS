/**
 * WealthOS — Supabase Auth helper
 * Wraps supabase-js auth methods and manages token in api.js
 */

import { createClient } from '@supabase/supabase-js';
import { setAuthToken, clearAuthToken } from './api.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  console.warn('[WealthOS] Supabase env vars missing. Auth features are disabled until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in frontend/.env');
}

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Sync token on session changes
if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.access_token) {
      setAuthToken(session.access_token);
    } else {
      clearAuthToken();
    }
  });
}

function ensureSupabaseConfigured() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env');
  }
}

export async function signUp(email, password, fullName) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.session?.access_token) setAuthToken(data.session.access_token);
  return data;
}

export async function signOut() {
  clearAuthToken();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) setAuthToken(data.session.access_token);
  return data.session;
}

export async function getUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
