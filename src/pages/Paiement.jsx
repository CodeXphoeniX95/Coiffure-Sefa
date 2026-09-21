import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { infosSalon as mockInfos } from '../data/mockData';
import './Paiement.css';

const modesPaymentBase = [
  {
    id: 'flooz',
    label: 'Flooz (Moov Money)',
    instructions: 'Composez *155# → Transfert d\'argent → Entrez le numéro et le montant.',
    couleur: '#FF6B00',
    lettre: 'F',
  },
  {
    id: 'tmoney',
    label: 'T-Money (Togocel)',
    instructions: 'Composez *145# → Paiement → Entrez le numéro et le montant.',
    couleur: '#007AFF',
    lettre: 'T',
  },
  {
    id: 'cash',
    label: 'Paiement en salon',
    instructions: 'Payez directement en espèces à votre arrivée au salon.',
    couleur: '#22C55E',
    lettre: '₣',
  },
];

export default function Paiement() {
  const navigate = useNavigate();
  const { reservationEnCours, mettreAJourPaiement, salonInfos } = useApp();
  const toast = useToast();
  const infos = salonInfos || mockInfos;

  // Injecter le vrai numéro du salon dans les modes Mobile Money
  const modesPayment = modesPaymentBase.map(m => ({
    ...m,
    numero: m.id === 'cash' ? '' : (infos.telephone || '+228 XX XX XX XX'),
  }));

  const [modeChoisi, setModeChoisi] = useState('');
  const [reference, setReference]  = useState('');
  const [copied, setCopied]         = useState(false);
  const [errors, setErrors]         = useState({});

  if (!reservationEnCours) {
    return (
      <div className="paiement-page">
        <div className="container paiement-nodata">
          <AlertCircle size={48} color="var(--orange)" />
          <h2>Aucune réservation en cours</h2>
          <p>Veuillez d'abord effectuer une réservation.</p>
          <Link to="/reserver" className="btn btn-primary">Réserver maintenant</Link>
        </div>
      </div>
    );
  }

  const rdv  = reservationEnCours;
  const mode = modesPayment.find(m => m.id === modeChoisi);

  const formatPrix = (p) =>
    new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(p);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-TG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const copierNumero = () => {
    if (mode?.numero) {
      navigator.clipboard?.writeText(mode.numero).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const valider = async () => {
    const errs = {};
    if (!modeChoisi) errs.mode = 'Choisissez un mode de paiement.';
    if (modeChoisi !== 'cash' && !reference.trim())
      errs.reference = 'Entrez la référence de votre transaction.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const { error } = await mettreAJourPaiement(rdv.id, {
      paiement:       modeChoisi,
      paiementStatut: modeChoisi === 'cash' ? 'en_attente' : 'en_verification',
      refTransaction: reference,
    });

    if (error) {
      toast.error('Erreur lors de l\'enregistrement. Réessayez.');
      return;
    }

    if (modeChoisi === 'cash') {
      toast.info('Réservation confirmée. Payez en espèces à votre arrivée.');
    } else {
      toast.success('Paiement soumis ! Nous vérifierons votre transaction et vous confirmerons par WhatsApp.');
    }
    navigate('/confirmation');
  };

  return (
    <div className="paiement-page">
      <div className="page-header">
        <div className="container page-header__inner">
          <h1 className="page-header__titre">Paiement <span>Mobile Money</span></h1>
          <p className="page-header__desc">
            Finalisez votre réservation en effectuant le paiement via votre mobile.
          </p>
          <div className="page-header__breadcrumb">
            <Link to="/">Accueil</Link>
            <span>/</span>
            <Link to="/reserver">Réservation</Link>
            <span>/</span>
            <span>Paiement</span>
          </div>
        </div>
      </div>

      <div className="container paiement-page__content">
        <div className="paiement-page__layout">

          {/* Formulaire paiement */}
          <div className="paiement-form">

            {/* Résumé RDV */}
            <div className="paiement-resume card">
              <h3><CheckCircle size={18} /> Récapitulatif de votre réservation</h3>
              <div className="paiement-resume__grid">
                <div><span>Service</span><strong>{rdv.service}</strong></div>
                <div><span>Date</span><strong>{formatDate(rdv.date)}</strong></div>
                <div><span>Heure</span><strong>{rdv.heure}</strong></div>
                <div><span>Nom</span><strong>{rdv.nom}</strong></div>
              </div>
              <div className="paiement-resume__total">
                <span>Montant à payer</span>
                <strong>{formatPrix(rdv.montant)}</strong>
              </div>
            </div>

            {/* Mode de paiement */}
            <div className="card paiement-modes">
              <h3><Smartphone size={18} /> Choisissez votre mode de paiement</h3>
              {errors.mode && <p className="form-error" style={{marginTop:'4px'}}>{errors.mode}</p>}
              <div className="modes-grid">
                {modesPayment.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    className={`mode-card ${modeChoisi === m.id ? 'mode-card--active' : ''}`}
                    onClick={() => { setModeChoisi(m.id); setErrors({}); }}
                  >
                    <div className="mode-card__logo" style={{ background: m.couleur }}>
                      {m.lettre}
                    </div>
                    <span className="mode-card__label">{m.label}</span>
                    {modeChoisi === m.id && <CheckCircle size={18} className="mode-card__check" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions paiement */}
            {mode && modeChoisi !== 'cash' && (
              <div className="card paiement-instructions">
                <h3><CreditCard size={18} /> Comment payer avec {mode.label}</h3>

                <div className="paiement-instructions__step">
                  <div className="paiement-instructions__num">1</div>
                  <div>
                    <strong>Numéro à créditer</strong>
                    <div className="paiement-instructions__numero">
                      <span>{mode.numero}</span>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={copierNumero}
                        aria-label="Copier le numéro"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="paiement-instructions__step">
                  <div className="paiement-instructions__num">2</div>
                  <div>
                    <strong>Montant à envoyer</strong>
                    <p className="paiement-instructions__montant">{formatPrix(rdv.montant)}</p>
                  </div>
                </div>

                <div className="paiement-instructions__step">
                  <div className="paiement-instructions__num">3</div>
                  <div>
                    <strong>Instructions</strong>
                    <p>{mode.instructions}</p>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '24px', marginBottom: 0 }}>
                  <label htmlFor="reference">
                    Référence de transaction *
                  </label>
                  <input
                    type="text"
                    id="reference"
                    placeholder="Ex: FL20250115001 ou TM20250115001"
                    value={reference}
                    onChange={e => { setReference(e.target.value); setErrors(prev => ({...prev, reference: ''})); }}
                  />
                  {errors.reference && <p className="form-error">{errors.reference}</p>}
                  <small style={{ color: 'var(--gris-moyen)', marginTop: '4px', fontSize: '0.78rem' }}>
                    La référence se trouve dans le SMS de confirmation reçu après votre paiement.
                  </small>
                </div>
              </div>
            )}

            {modeChoisi === 'cash' && (
              <div className="card paiement-cash">
                <CheckCircle size={32} color="var(--vert)" />
                <h3>Paiement en salon</h3>
                <p>
                  Votre réservation sera enregistrée comme <strong>en attente de paiement</strong>.
                  Réglez en espèces directement à votre arrivée au salon.
                </p>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary btn-lg paiement-submit"
              onClick={valider}
            >
              Confirmer le paiement
            </button>
          </div>

          {/* Aide */}
          <div className="paiement-aide">
            <div className="card paiement-aide__card">
              <h4>Besoin d'aide ?</h4>
              <p>Si vous avez un problème avec votre paiement, contactez-nous directement.</p>
              <a
                href={`https://wa.me/${infos.whatsapp || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
              >
                WhatsApp
              </a>
              <a href={`tel:${infos.telephone || ''}`} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                Appeler le salon
              </a>
            </div>
            <div className="card paiement-aide__securite">
              <h4>🔒 Paiement sécurisé</h4>
              <ul>
                <li>✓ Vos données sont protégées</li>
                <li>✓ Confirmation par SMS / WhatsApp</li>
                <li>✓ Annulation possible 24h avant</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
