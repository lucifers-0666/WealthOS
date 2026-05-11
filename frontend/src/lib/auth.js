/**
 * WealthOS — Supabase Auth helper
 * Wraps supabase-js auth methods and manages token in api.js
 */

import { createClient } from '@supabase/supabase-js';
import { setAuthToken, clearAuthToken } from './api.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sync token on session changes
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.access_token) {
    setAuthToken(session.access_token);
  } else {
    clearAuthToken();
  }
});

export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.session?.access_token) setAuthToken(data.session.access_token);
  return data;
}

export async function signOut() {
  clearAuthToken();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) setAuthToken(data.session.access_token);
  return data.session;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
