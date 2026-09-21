import { Link } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, Phone, MessageCircle, Home, Scissors } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { infosSalon as mockInfos } from '../data/mockData';
import './Confirmation.css';

export default function Confirmation() {
  const { reservationEnCours, salonInfos } = useApp();
  const infos = salonInfos || mockInfos;

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-TG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const formatPrix = (p) =>
    new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(p);

  const rdv = reservationEnCours;

  return (
    <div className="confirmation-page">
      <div className="container confirmation-page__content">

        {/* Icône succès */}
        <div className="confirmation-icon">
          <CheckCircle size={64} />
        </div>

        <h1 className="confirmation-titre">Réservation confirmée !</h1>
        <p className="confirmation-sous-titre">
          Merci {rdv?.nom ? rdv.nom.split(' ')[0] : ''} ! Votre rendez-vous a bien été enregistré.
          Nous vous contacterons pour confirmer votre créneau.
        </p>

        {/* Ticket de réservation */}
        {rdv && (
          <div className="ticket">
            <div className="ticket__header">
              <Scissors size={20} />
              <span>Coiffure et Tresse Mon'Trésor</span>
              <span className="ticket__ref">#{String(rdv.id).padStart(4, '0')}</span>
            </div>

            <div className="ticket__body">
              <div className="ticket__row">
                <span>Service</span>
                <strong>{rdv.service}</strong>
              </div>
              <div className="ticket__row">
                <span><Calendar size={14} /> Date</span>
                <strong>{formatDate(rdv.date)}</strong>
              </div>
              <div className="ticket__row">
                <span><Clock size={14} /> Heure</span>
                <strong>{rdv.heure}</strong>
              </div>
              <div className="ticket__row">
                <span>Nom</span>
                <strong>{rdv.nom}</strong>
              </div>
              <div className="ticket__row">
                <span><Phone size={14} /> Téléphone</span>
                <strong>{rdv.telephone}</strong>
              </div>
              {rdv.refTransaction && (
                <div className="ticket__row">
                  <span>Réf. paiement</span>
                  <strong>{rdv.refTransaction}</strong>
                </div>
              )}
            </div>

            <div className="ticket__footer">
              <div className="ticket__total">
                <span>Montant</span>
                <strong>{formatPrix(rdv.montant)}</strong>
              </div>
              <span className={`badge badge-${rdv.paiementStatut || 'en_attente'}`}>
                {rdv.paiementStatut === 'paye'           ? 'Payé'
                 : rdv.paiementStatut === 'en_verification' ? 'Vérification en cours'
                 : 'En attente de paiement'}
              </span>
            </div>

            <div className="ticket__deco" />
          </div>
        )}

        {/* Prochaines étapes */}
        <div className="confirmation-steps">
          <h3>Que se passe-t-il ensuite ?</h3>
          <div className="confirmation-steps__list">
            <div className="confirmation-steps__item">
              <div className="confirmation-steps__num">1</div>
              <div>
                <strong>Vérification du paiement</strong>
                <p>Notre équipe vérifie votre paiement et confirme votre créneau.</p>
              </div>
            </div>
            <div className="confirmation-steps__item">
              <div className="confirmation-steps__num">2</div>
              <div>
                <strong>Confirmation par WhatsApp</strong>
                <p>Vous recevrez un message de confirmation sur votre numéro.</p>
              </div>
            </div>
            <div className="confirmation-steps__item">
              <div className="confirmation-steps__num">3</div>
              <div>
                <strong>Votre rendez-vous</strong>
                <p>Arrivez 5 minutes avant votre créneau. On s'occupe du reste !</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="confirmation-actions">
          <Link to="/" className="btn btn-primary btn-lg">
            <Home size={18} />
            Retour à l'accueil
          </Link>
          <a
            href={`https://wa.me/${infos.whatsapp || ''}?text=Bonjour, j'ai réservé le ${rdv?.date} à ${rdv?.heure} pour ${rdv?.service}. Ma référence est #${String(rdv?.id || '').padStart(4,'0')}.`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-lg"
          >
            <MessageCircle size={18} />
            Contacter sur WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}
