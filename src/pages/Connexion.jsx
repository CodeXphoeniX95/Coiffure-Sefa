import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scissors, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useClientAuth } from '../context/ClientAuthContext';
import { useToast } from '../context/ToastContext';
import './Inscription.css'; // même CSS partagé

export default function Connexion() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { connexion, loginError } = useClientAuth();
  const toast = useToast();

  const from = location.state?.from || '/mon-espace';

  const [form, setForm]   = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const soumettre = async (e) => {
    e.preventDefault();
    setLoading(true);
    const ok = await connexion(form.email, form.password);
    setLoading(false);
    if (ok) {
      toast.success('Bienvenue !');
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-card__logo">
          <div className="auth-logo-icon"><Scissors size={24} /></div>
          <div>
            <span className="auth-logo-main">Mon'Trésor</span>
            <span className="auth-logo-sub">Espace client</span>
          </div>
        </div>

        <h1 className="auth-card__titre">Connexion</h1>
        <p className="auth-card__desc">Accédez à votre espace personnel et suivez vos rendez-vous.</p>

        <form onSubmit={soumettre} noValidate>
          <div className="form-group">
            <label><Mail size={13} /> Email</label>
            <input type="email" placeholder="votremail@exemple.com"
              value={form.email} onChange={e => update('email', e.target.value)}
              autoComplete="email" required />
          </div>

          <div className="form-group">
            <label><Lock size={13} /> Mot de passe</label>
            <div className="auth-pwd-wrap">
              <input type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                value={form.password} onChange={e => update('password', e.target.value)}
                autoComplete="current-password" required />
              <button type="button" className="auth-pwd-toggle"
                onClick={() => setShowPwd(s => !s)} aria-label="Afficher">
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {loginError && (
            <div className="auth-error">
              <span>{loginError}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-card__link">
          Pas encore de compte ? <Link to="/inscription">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}
