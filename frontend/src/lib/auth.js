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

function getRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem('arca_registered_users') || '[]');
  } catch (e) {
    return [];
  }
}

function saveRegisteredUser(userRecord) {
  const users = getRegisteredUsers();
  const existingIndex = users.findIndex(u => u.id === userRecord.id || u.email.toLowerCase() === userRecord.email.toLowerCase());
  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...userRecord };
  } else {
    users.push(userRecord);
  }
  localStorage.setItem('arca_registered_users', JSON.stringify(users));
}

export function generateUniqueUserId() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `ARCA-${randomNum}`;
}

function getDemoSession() {
  const localAuth = JSON.parse(localStorage.getItem('arca_auth_user') || 'null');
  const localProfile = JSON.parse(localStorage.getItem('arca_profile') || '{}');

  const userId = localAuth?.id || localProfile?.id || generateUniqueUserId();
  const email = localAuth?.email || localProfile?.email || 'user@example.com';
  const fullName = localAuth?.user_metadata?.full_name || localProfile?.full_name || localProfile?.display_name || 'User';

  return {
    access_token: localStorage.getItem('sb-access-token') || 'demo-token',
    user: {
      id: userId,
      email: email,
      user_metadata: { full_name: fullName },
    },
  };
}

export async function signUp(email, password, fullName, customUserId = null) {
  const userId = customUserId || generateUniqueUserId();
  
  if (isDemoMode || !supabase) {
    const user = {
      id: userId,
      email: email.trim().toLowerCase(),
      password,
      user_metadata: { full_name: fullName }
    };
    const session = { access_token: 'demo-token-' + Date.now(), user };
    
    saveRegisteredUser({ id: userId, email: email.trim().toLowerCase(), password, full_name: fullName, profile: { id: userId, email: email.trim().toLowerCase(), full_name: fullName, display_name: fullName } });
    localStorage.setItem('arca_auth_user', JSON.stringify(user));
    localStorage.setItem('arca_profile', JSON.stringify({ id: userId, email: email.trim().toLowerCase(), full_name: fullName, display_name: fullName }));
    setAuthToken(session.access_token);
    return { user, session };
  }
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, custom_user_id: userId } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(identifier, password) {
  const cleanId = identifier.trim().toLowerCase();
  
  if (isDemoMode || !supabase) {
    const registered = getRegisteredUsers();
    const matchedUser = registered.find(u => u.email.toLowerCase() === cleanId || u.id.toLowerCase() === cleanId);
    
    if (!matchedUser && registered.length > 0) {
      throw new Error('Invalid Email / User ID or password.');
    }

    const userId = matchedUser?.id || (cleanId.startsWith('arca-') ? cleanId.toUpperCase() : generateUniqueUserId());
    const email = matchedUser?.email || (cleanId.includes('@') ? cleanId : cleanId + '@arca.terminal');
    const fullName = matchedUser?.full_name || matchedUser?.profile?.display_name || email.split('@')[0];

    const user = {
      id: userId,
      email: email,
      user_metadata: { full_name: fullName }
    };
    const session = { access_token: 'demo-token-' + Date.now(), user };
    
    localStorage.setItem('arca_auth_user', JSON.stringify(user));
    if (matchedUser?.profile) {
      localStorage.setItem('arca_profile', JSON.stringify(matchedUser.profile));
    }
    setAuthToken(session.access_token);
    return { session, user };
  }
  
  ensureSupabaseConfigured();
  // Supabase auth signin with password (email)
  let authEmail = cleanId;
  if (!cleanId.includes('@')) {
    // If entered User ID instead of email in Supabase mode, attempt lookup in profiles
    const { data: prof } = await supabase.from('profiles').select('email').eq('id', cleanId.toUpperCase()).single();
    if (prof?.email) authEmail = prof.email;
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
  if (error) throw error;
  if (data.session?.access_token) setAuthToken(data.session.access_token);
  return data;
}

export async function signOut() {
  localStorage.removeItem('arca_auth_user');
  localStorage.removeItem('arca_profile');
  clearAuthToken();
  if (supabase) {
    try { await supabase.auth.signOut(); } catch (e) { /* ignore */ }
  }
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
  if (isDemoMode || !supabase) {
    const session = getDemoSession();
    if (session?.access_token) setAuthToken(session.access_token);
    return session;
  }
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) setAuthToken(data.session.access_token);
  return data.session;
}

export async function getUser() {
  if (isDemoMode || !supabase) {
    return getDemoSession().user;
  }
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
