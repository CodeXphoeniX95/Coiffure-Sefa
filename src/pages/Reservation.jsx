import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, User, Phone, FileText, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useClientAuth } from '../context/ClientAuthContext';
import { useToast } from '../context/ToastContext';
import './Reservation.css';

const etapes = ['Service', 'Date & Heure', 'Vos infos', 'Confirmation'];

// Génère les créneaux entre deux horaires (intervalles de 30 min)
function genererCreneaux(heureDebut, heureFin) {
  const creneaux = [];
  const [hD, mD] = heureDebut.split(':').map(Number);
  const [hF, mF] = heureFin.split(':').map(Number);
  let minutes = hD * 60 + mD;
  const finMinutes = hF * 60 + mF;
  while (minutes < finMinutes) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    creneaux.push(`${h}:${m}`);
    minutes += 30;
  }
  return creneaux;
}

export default function Reservation() {
  const [searchParams]              = useSearchParams();
  const navigate                    = useNavigate();
  const { services, ajouterRdv, isCreneauDispo, setReservationEnCours, disponibilites } = useApp();
  const { isConnected, profile } = useClientAuth();
  const toast = useToast();

  // Si non connectée, afficher un message d'invitation à se connecter
  // (on laisse quand même accéder mais on prérempli avec les infos du profil)

  const [etape, setEtape]   = useState(0);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    serviceId: searchParams.get('service') || '',
    date:      '',
    heure:     '',
    nom:       profile?.nom       || '',
    telephone: profile?.telephone || '',
    email:     isConnected ? (profile?.email || '') : '',
    note:      '',
  });

  // Mettre à jour nom/tel si le profil se charge après
  useEffect(() => {
    if (profile) {
      setForm(prev => ({
        ...prev,
        nom:       prev.nom       || profile.nom       || '',
        telephone: prev.telephone || profile.telephone || '',
      }));
    }
  }, [profile]);

  const serviceChoisi = services.find(s => s.id === form.serviceId);

  // Créneaux dynamiques selon le jour sélectionné et les disponibilités
  const creneaux = useMemo(() => {
    if (!form.date || disponibilites.length === 0) return [];
    const jourIndex = new Date(form.date + 'T00:00:00').getDay(); // 0=dim, 1=lun…
    const dispo = disponibilites.find(d => d.jourIndex === jourIndex);
    if (!dispo || !dispo.actif) return [];
    return genererCreneaux(dispo.heureDebut, dispo.heureFin);
  }, [form.date, disponibilites]);

  const formatPrix = (p) =>
    new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(p);

  // Date min = aujourd'hui + 1 jour
  const dateMin = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // ─── Validation par étape ─────────────────────────────────
  const validerEtape = () => {
    const errs = {};
    if (etape === 0) {
      if (!form.serviceId) errs.serviceId = 'Veuillez choisir un service.';
    }
    if (etape === 1) {
      if (!form.date)  errs.date  = 'Veuillez choisir une date.';
      if (!form.heure) errs.heure = 'Veuillez choisir un créneau.';
    }
    if (etape === 2) {
      if (!form.nom.trim())       errs.nom       = 'Votre nom est requis.';
      if (!form.telephone.trim()) errs.telephone = 'Votre numéro est requis.';
      else if (!/^\+?[\d\s]{8,15}$/.test(form.telephone))
        errs.telephone = 'Numéro de téléphone invalide.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const etapeSuivante = async () => {
    if (etape === 1 && form.date && form.heure) {
      const dispo = await isCreneauDispo(form.date, form.heure);
      if (!dispo) {
        setErrors({ heure: 'Ce créneau est déjà réservé. Choisissez un autre.' });
        return;
      }
    }
    if (validerEtape()) setEtape(e => e + 1);
  };

  const etapePrecedente = () => setEtape(e => e - 1);

  const soumettre = async () => {
    if (!validerEtape()) return;

    const { data: rdv, error } = await ajouterRdv({
      nom:       form.nom,
      telephone: form.telephone,
      email:     form.email,
      service:   serviceChoisi.nom,
      serviceId: form.serviceId,
      date:      form.date,
      heure:     form.heure,
      note:      form.note,
      montant:   serviceChoisi.prix,
    });

    if (error) {
      toast.error('Erreur lors de la réservation. Réessayez.');
      return;
    }

    setReservationEnCours(rdv);
    toast.success('Réservation enregistrée ! Procédez au paiement.');
    navigate('/paiement');
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-TG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="reservation-page">
      {/* En-tête */}
      <div className="page-header">
        <div className="container page-header__inner">
          <h1 className="page-header__titre">Réserver un <span>rendez-vous</span></h1>
          <p className="page-header__desc">
            Choisissez votre service, votre créneau et payez facilement via Mobile Money.
          </p>
          <div className="page-header__breadcrumb">
            <Link to="/">Accueil</Link>
            <span>/</span>
            <span>Réservation</span>
          </div>
        </div>
      </div>

      <div className="container reservation-page__content">
        {/* Bannière connexion si non connectée */}
        {!isConnected && (
          <div className="reservation-login-banner">
            <Lock size={16} />
            <span>
              <Link to="/connexion" state={{ from: '/reserver' }}>Connectez-vous</Link> pour suivre vos RDV et retrouver vos informations automatiquement.
            </span>
          </div>
        )}

        {/* Stepper */}
        <div className="stepper">
          {etapes.map((e, i) => (
            <div key={i} className={`stepper__step ${i === etape ? 'stepper__step--active' : ''} ${i < etape ? 'stepper__step--done' : ''}`}>
              <div className="stepper__circle">
                {i < etape ? <CheckCircle size={16} /> : <span>{i + 1}</span>}
              </div>
              <span className="stepper__label">{e}</span>
              {i < etapes.length - 1 && <div className="stepper__line" />}
            </div>
          ))}
        </div>

        <div className="reservation-page__layout">
          {/* Formulaire */}
          <div className="reservation-form card">

            {/* Étape 0 : Service */}
            {etape === 0 && (
              <div className="form-step">
                <h2 className="form-step__titre">
                  <Scissors_icon /> Choisissez votre service
                </h2>
                <div className="services-choix">
                  {services.filter(s => s.actif).map(s => (
                    <label
                      key={s.id}
                      className={`service-choix-card ${form.serviceId === s.id ? 'service-choix-card--selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="service"
                        value={s.id}
                        checked={form.serviceId === s.id}
                        onChange={() => updateForm('serviceId', s.id)}
                        className="sr-only"
                      />
                      <img src={s.image} alt={s.nom} />
                      <div className="service-choix-card__body">
                        <strong>{s.nom}</strong>
                        <span>{formatPrix(s.prix)} · {s.duree} min</span>
                      </div>
                      <div className="service-choix-card__check" />
                    </label>
                  ))}
                </div>
                {errors.serviceId && <p className="form-error">{errors.serviceId}</p>}
              </div>
            )}

            {/* Étape 1 : Date & Heure */}
            {etape === 1 && (
              <div className="form-step">
                <h2 className="form-step__titre">
                  <Calendar size={20} /> Choisissez votre créneau
                </h2>
                <div className="form-group">
                  <label htmlFor="date">
                    <Calendar size={14} /> Date du rendez-vous
                  </label>
                  <input
                    type="date"
                    id="date"
                    min={dateMin()}
                    value={form.date}
                    onChange={e => updateForm('date', e.target.value)}
                  />
                  {errors.date && <p className="form-error">{errors.date}</p>}
                </div>
                <div className="form-group">
                  <label>
                    <Clock size={14} /> Heure du rendez-vous
                  </label>
                  {form.date && creneaux.length === 0 ? (
                    <div className="creneau-ferme">
                      <AlertTriangle size={16} />
                      Le salon est fermé ce jour. Choisissez une autre date.
                    </div>
                  ) : (
                    <div className="creneaux-grid">
                      {creneaux.map(c => (
                        <button
                          key={c}
                          type="button"
                          className={`creneau-btn ${form.heure === c ? 'creneau-btn--active' : ''}`}
                          onClick={() => updateForm('heure', c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.heure && <p className="form-error">{errors.heure}</p>}
                </div>
              </div>
            )}

            {/* Étape 2 : Infos personnelles */}
            {etape === 2 && (
              <div className="form-step">
                <h2 className="form-step__titre">
                  <User size={20} /> Vos informations
                </h2>
                <div className="form-group">
                  <label htmlFor="nom">
                    <User size={14} /> Nom complet *
                  </label>
                  <input
                    type="text"
                    id="nom"
                    placeholder="Ex: Afi Koffi"
                    value={form.nom}
                    onChange={e => updateForm('nom', e.target.value)}
                  />
                  {errors.nom && <p className="form-error">{errors.nom}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="telephone">
                    <Phone size={14} /> Téléphone *
                  </label>
                  <input
                    type="tel"
                    id="telephone"
                    placeholder="+228 90 00 00 00"
                    value={form.telephone}
                    onChange={e => updateForm('telephone', e.target.value)}
                  />
                  {errors.telephone && <p className="form-error">{errors.telephone}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email (optionnel)</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="votremail@exemple.com"
                    value={form.email}
                    onChange={e => updateForm('email', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="note">
                    <FileText size={14} /> Note ou demande spéciale (optionnel)
                  </label>
                  <textarea
                    id="note"
                    placeholder="Ex: Je souhaite des tresses avec perles, couleur noire..."
                    value={form.note}
                    onChange={e => updateForm('note', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Étape 3 : Résumé */}
            {etape === 3 && (
              <div className="form-step">
                <h2 className="form-step__titre">
                  <CheckCircle size={20} /> Résumé de votre réservation
                </h2>
                <div className="resume-rdv">
                  <div className="resume-rdv__row">
                    <span>Service</span>
                    <strong>{serviceChoisi?.nom}</strong>
                  </div>
                  <div className="resume-rdv__row">
                    <span>Date</span>
                    <strong>{formatDate(form.date)}</strong>
                  </div>
                  <div className="resume-rdv__row">
                    <span>Heure</span>
                    <strong>{form.heure}</strong>
                  </div>
                  <div className="resume-rdv__row">
                    <span>Nom</span>
                    <strong>{form.nom}</strong>
                  </div>
                  <div className="resume-rdv__row">
                    <span>Téléphone</span>
                    <strong>{form.telephone}</strong>
                  </div>
                  {form.note && (
                    <div className="resume-rdv__row">
                      <span>Note</span>
                      <strong>{form.note}</strong>
                    </div>
                  )}
                  <div className="resume-rdv__row resume-rdv__row--total">
                    <span>Montant</span>
                    <strong>{serviceChoisi && formatPrix(serviceChoisi.prix)}</strong>
                  </div>
                </div>
                <p className="resume-rdv__note">
                  En cliquant sur "Confirmer & Payer", vous serez redirigée vers la page de paiement Mobile Money.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="form-navigation">
              {etape > 0 && (
                <button type="button" className="btn btn-outline" onClick={etapePrecedente}>
                  Précédent
                </button>
              )}
              <div style={{ flex: 1 }} />
              {etape < 3 && (
                <button type="button" className="btn btn-primary" onClick={etapeSuivante}>
                  Continuer
                </button>
              )}
              {etape === 3 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={soumettre}
                >
                  Confirmer & Payer
                </button>
              )}
            </div>
          </div>

          {/* Récap latéral */}
          {serviceChoisi && (
            <div className="reservation-sidebar">
              <div className="card reservation-sidebar__card">
                <h4>Votre sélection</h4>
                <img src={serviceChoisi.image} alt={serviceChoisi.nom} />
                <div className="reservation-sidebar__info">
                  <strong>{serviceChoisi.nom}</strong>
                  <span className="reservation-sidebar__prix">{formatPrix(serviceChoisi.prix)}</span>
                  <span className="reservation-sidebar__duree">
                    <Clock size={13} /> {serviceChoisi.duree} min
                  </span>
                  {form.date && <span>📅 {formatDate(form.date)}</span>}
                  {form.heure && <span>🕐 {form.heure}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Icône ciseaux inline
function Scissors_icon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>
  );
}
