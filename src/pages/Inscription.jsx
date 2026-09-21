import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scissors, Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';
import { useClientAuth } from '../context/ClientAuthContext';
import { useToast } from '../context/ToastContext';
import './Inscription.css';

export default function Inscription() {
  const navigate = useNavigate();
  const { inscription, signupError } = useClientAuth();
  const toast = useToast();

  const [form, setForm]   = useState({ nom: '', telephone: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const update = (f, v) => {
    setForm(p => ({ ...p, [f]: v }));
    setErrors(p => ({ ...p, [f]: '' }));
  };

  const valider = () => {
    const errs = {};
    if (!form.nom.trim())       errs.nom       = 'Votre nom est requis.';
    if (!form.telephone.trim()) errs.telephone = 'Votre numéro est requis.';
    if (!form.email.trim())     errs.email     = 'Votre email est requis.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Email invalide.';
    if (!form.password)         errs.password  = 'Le mot de passe est requis.';
    else if (form.password.length < 6)
      errs.password = 'Minimum 6 caractères.';
    if (form.password !== form.confirm) errs.confirm = 'Les mots de passe ne correspondent pas.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const soumettre = async (e) => {
    e.preventDefault();
    if (!valider()) return;
    setLoading(true);
    const { success, needsConfirmation } = await inscription({
      email:     form.email,
      password:  form.password,
      nom:       form.nom,
      telephone: form.telephone,
    });
    setLoading(false);
    if (success) {
      toast.success('Compte créé ! Bienvenue.');
      navigate('/mon-espace');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-card__logo">
          <div className="auth-logo-icon"><Scissors size={24} /></div>
          <div>
            <span className="auth-logo-main">Mon'Trésor</span>
            <span className="auth-logo-sub">Créer un compte</span>
          </div>
        </div>

        <h1 className="auth-card__titre">Inscription</h1>
        <p className="auth-card__desc">Créez votre compte pour réserver et suivre vos rendez-vous.</p>

        <form onSubmit={soumettre} noValidate>
          <div className="form-group">
            <label><User size={13} /> Nom complet *</label>
            <input type="text" placeholder="Ex: Afi Koffi"
              value={form.nom} onChange={e => update('nom', e.target.value)} />
            {errors.nom && <p className="form-error">{errors.nom}</p>}
          </div>

          <div className="form-group">
            <label><Phone size={13} /> Téléphone *</label>
            <input type="tel" placeholder="+228 90 00 00 00"
              value={form.telephone} onChange={e => update('telephone', e.target.value)} />
            {errors.telephone && <p className="form-error">{errors.telephone}</p>}
          </div>

          <div className="form-group">
            <label><Mail size={13} /> Email *</label>
            <input type="email" placeholder="votremail@exemple.com"
              value={form.email} onChange={e => update('email', e.target.value)} />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label><Lock size={13} /> Mot de passe *</label>
            <div className="auth-pwd-wrap">
              <input type={showPwd ? 'text' : 'password'} placeholder="Minimum 6 caractères"
                value={form.password} onChange={e => update('password', e.target.value)} />
              <button type="button" className="auth-pwd-toggle"
                onClick={() => setShowPwd(s => !s)} aria-label="Afficher">
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <div className="form-group">
            <label><Lock size={13} /> Confirmer le mot de passe *</label>
            <input type="password" placeholder="Répétez le mot de passe"
              value={form.confirm} onChange={e => update('confirm', e.target.value)} />
            {errors.confirm && <p className="form-error">{errors.confirm}</p>}
          </div>

          {signupError && (
            <div className="auth-error">
              <span>{signupError}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? 'Création du compte…' : "S'inscrire"}
          </button>
        </form>

        <p className="auth-card__link">
          Déjà un compte ? <Link to="/connexion">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
