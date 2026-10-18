import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin,       setAdmin]       = useState(null);
  const [loginError,  setLoginError]  = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Vérifier si l'utilisateur connecté est bien un admin ─
  const checkIsAdmin = async (user) => {
    if (!user) return false;
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    return !error && data?.role === 'admin';
  };

  // ─── Récupérer la session au montage ─────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const isAdmin = await checkIsAdmin(session.user);
        setAdmin(isAdmin ? session.user : null);
      }
      setAuthLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const isAdmin = await checkIsAdmin(session.user);
          setAdmin(isAdmin ? session.user : null);
        } else {
          setAdmin(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ─── Login ───────────────────────────────────────────────
  const login = async (email, password) => {
    setLoginError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError('Email ou mot de passe incorrect.');
      return false;
    }

    // Vérifier que c'est bien un admin
    const isAdmin = await checkIsAdmin(data.user);
    if (!isAdmin) {
      await supabase.auth.signOut();
      setLoginError('Accès refusé. Ce compte n\'a pas les droits administrateur.');
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
    <AuthContext.Provider value={{
      admin,
      login,
      logout,
      loginError,
      isAuthenticated: !!admin,
      authLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
