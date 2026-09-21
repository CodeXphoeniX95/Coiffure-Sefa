import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ClientAuthContext = createContext(null);

export function ClientAuthProvider({ children }) {
  const [client,       setClient]       = useState(null);
  const [profile,      setProfile]      = useState(null);
  const [authLoading,  setAuthLoading]  = useState(true);
  const [loginError,   setLoginError]   = useState('');
  const [signupError,  setSignupError]  = useState('');

  // ─── Charger la session + profil au montage ───────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setClient(session.user);
        await loadProfile(session.user.id);
      }
      setAuthLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;
        setClient(user);
        if (user) await loadProfile(user.id);
        else setProfile(null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) setProfile(data);
      // Si 404 (table inexistante) ou PGRST116 (no row), on ignore silencieusement
    } catch {
      // Table profiles pas encore créée — pas grave
    }
  };

  // ─── Inscription ─────────────────────────────────────────
  const inscription = async ({ email, password, nom, telephone }) => {
    setSignupError('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nom, telephone }, // stocké dans raw_user_meta_data → trigger → profiles
      },
    });
    if (error) {
      setSignupError(
        error.message.includes('already registered')
          ? 'Cet email est déjà utilisé.'
          : error.message
      );
      return { success: false };
    }
    return { success: true, needsConfirmation: !data.session };
  };

  // ─── Connexion ───────────────────────────────────────────
  const connexion = async (email, password) => {
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError('Email ou mot de passe incorrect.');
      return false;
    }
    return true;
  };

  // ─── Déconnexion ─────────────────────────────────────────
  const deconnexion = async () => {
    await supabase.auth.signOut();
    setClient(null);
    setProfile(null);
  };

  // ─── Mettre à jour le profil ─────────────────────────────
  const mettreAJourProfil = async (data) => {
    if (!client) return { error: 'Non connecté' };
    const { data: updated, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', client.id)
      .select()
      .single();
    if (!error && updated) setProfile(updated);
    return { error };
  };

  return (
    <ClientAuthContext.Provider value={{
      client,
      profile,
      authLoading,
      isConnected: !!client,
      loginError,
      signupError,
      inscription,
      connexion,
      deconnexion,
      mettreAJourProfil,
      loadProfile,
    }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext);
  if (!ctx) throw new Error('useClientAuth doit être utilisé dans ClientAuthProvider');
  return ctx;
}
