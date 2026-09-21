import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin,      setAdmin]      = useState(null);
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Récupérer la session existante au montage ───────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAdmin(session?.user ?? null);
      setAuthLoading(false);
    };
    init();

    // Écouter les changements de session (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAdmin(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Login avec email + password ─────────────────────────
  const login = async (email, password) => {
    setLoginError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError('Email ou mot de passe incorrect.');
      return false;
    }
    setAdmin(data.user);
    return true;
  };

  // ─── Logout ──────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        login,
        logout,
        loginError,
        isAuthenticated: !!admin,
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
