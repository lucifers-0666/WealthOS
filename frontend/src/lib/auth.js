/**
 * Arca — Supabase Auth helper
 * Wraps supabase-js auth methods and manages token in api.js
 */

import { createClient } from '@supabase/supabase-js';
import { setAuthToken, clearAuthToken } from './api.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY) && !isDemoMode;

if (!isSupabaseConfigured && !isDemoMode) {
  console.warn('[Arca] Supabase env vars missing. Auth features are disabled until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in frontend/.env');
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
  if (!supabase && !isDemoMode) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env');
  }
}

function getDemoSession() {
  return {
    access_token: 'demo-token',
    user: {
      id: 'demo-user',
      email: 'demo@example.com',
      user_metadata: { full_name: 'Demo User' },
    },
  };
}

export async function signUp(email, password, fullName) {
  if (isDemoMode) return { user: getDemoSession().user, session: getDemoSession() };
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
  if (isDemoMode) {
    const session = getDemoSession();
    setAuthToken(session.access_token);
    return { session, user: session.user };
  }
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.session?.access_token) setAuthToken(data.session.access_token);
  return data;
}

export async function signOut() {
  if (isDemoMode) {
    clearAuthToken();
    return;
  }
  clearAuthToken();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email) {
  if (isDemoMode) {
    return { ok: true };
  }
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login?mode=reset`,
  });
  if (error) throw error;
  return data;
}

export async function getSession() {
  if (isDemoMode) {
    const session = getDemoSession();
    setAuthToken(session.access_token);
    return session;
  }
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) setAuthToken(data.session.access_token);
  return data.session;
}

export async function getUser() {
  if (isDemoMode) {
    return getDemoSession().user;
  }
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
