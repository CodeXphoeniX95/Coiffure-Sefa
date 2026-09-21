import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './LoginAdmin.css';

export default function LoginAdmin() {
  const navigate         = useNavigate();
  const { login, loginError } = useAuth();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const ok = login(form.email, form.password);
    setLoading(false);
    if (ok) navigate('/admin/dashboard');
  };

  return (
    <div className="login-page">
      <div className="login-bg" />

      <div className="login-card card">
        {/* Logo */}
        <div className="login-card__logo">
          <div className="login-logo-icon">
            <Scissors size={28} />
          </div>
          <div>
            <span className="login-logo-main">Mon'Trésor</span>
            <span className="login-logo-sub">Espace Administrateur</span>
          </div>
        </div>

        <h1 className="login-card__titre">Connexion</h1>
        <p className="login-card__desc">Accédez à votre tableau de bord de gestion.</p>

        {/* Hint */}
        <div className="login-hint">
          <AlertCircle size={14} />
          <span>Email: admin@montresor-togo.com / Mot de passe: montresor2025</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email"><Mail size={14} /> Adresse email</label>
            <input
              type="email"
              id="email"
              placeholder="admin@montresor-togo.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group login-pwd-group">
            <label htmlFor="password"><Lock size={14} /> Mot de passe</label>
            <div className="login-pwd-wrap">
              <input
                type={showPwd ? 'text' : 'password'}
                id="password"
                placeholder="••••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-pwd-toggle"
                onClick={() => setShowPwd(s => !s)}
                aria-label={showPwd ? 'Masquer' : 'Afficher'}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {loginError && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg login-submit"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="login-back">
          <a href="/">← Retour au site</a>
        </p>
      </div>
    </div>
  );
}
