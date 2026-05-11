/**
 * WealthOS — useAuth hook
 * Provides current user, loading state, and auth actions to any component.
 */

import { useState, useEffect } from 'react';
import { supabase, signIn, signUp, signOut, getSession } from './auth.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = null;

    // Restore session on mount
    getSession()
      .then((session) => {
        setUser(session?.user ?? null);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });

    // Listen for auth state changes when Supabase is configured
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });
      unsubscribe = () => subscription.unsubscribe();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };
}
