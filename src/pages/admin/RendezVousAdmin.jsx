import { useState } from 'react';
import {
  Search, Filter, CheckCircle, XCircle, Clock,
  Calendar, Phone, ChevronDown, ChevronUp
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import './RendezVousAdmin.css';

const STATUTS = [
  { id: 'tous',       label: 'Tous'        },
  { id: 'en_attente', label: 'En attente'  },
  { id: 'confirme',   label: 'Confirmés'   },
  { id: 'annule',     label: 'Annulés'     },
];

export default function RendezVousAdmin() {
  const { rendezVous, mettreAJourStatutRdv } = useApp();
  const toast = useToast();

  const [filtre,    setFiltre]    = useState('en_attente');
  const [recherche, setRecherche] = useState('');
  const [expandId,  setExpandId]  = useState(null);

  const formatPrix = (p) =>
    new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(p);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-TG', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const rdvFiltres = rendezVous
    .filter(r => filtre === 'tous' || r.statut === filtre)
    .filter(r => {
      const q = recherche.toLowerCase();
      return (
        r.nom.toLowerCase().includes(q)       ||
        r.service.toLowerCase().includes(q)   ||
        r.telephone.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const statutBadge = (s) => {
    if (s === 'confirme')   return <span className="badge badge-confirme">Confirmé</span>;
    if (s === 'en_attente') return <span className="badge badge-en_attente">En attente</span>;
    if (s === 'annule')     return <span className="badge badge-annule">Annulé</span>;
    return <span className="badge">{s}</span>;
  };

  const paiementBadge = (s) => {
    if (s === 'paye')             return <span className="badge badge-confirme">Payé</span>;
    if (s === 'en_verification')  return <span className="badge badge-en_attente">Vérification</span>;
    if (s === 'rembourse')        return <span className="badge badge-annule">Remboursé</span>;
    return <span className="badge badge-en_attente">En attente</span>;
  };

  return (
    <div className="rdv-admin">
      <div className="admin-page-header">
        <h1>Rendez-vous</h1>
        <p>{rendezVous.length} rendez-vous enregistrés</p>
      </div>

      {/* Filtres */}
      <div className="admin-filters card">
        <div className="admin-filters__tabs">
          {STATUTS.map(s => (
            <button
              key={s.id}
              className={`filter-tab ${filtre === s.id ? 'filter-tab--active' : ''}`}
              onClick={() => setFiltre(s.id)}
            >
              {s.label}
              <span className="filter-tab__count">
                {s.id === 'tous'
                  ? rendezVous.length
                  : rendezVous.filter(r => r.statut === s.id).length}
              </span>
            </button>
          ))}
        </div>
        <div className="admin-filters__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Rechercher par nom, service, téléphone…"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
        </div>
      </div>

      {/* Liste */}
      {rdvFiltres.length === 0 ? (
        <div className="admin-empty card">
          <Calendar size={40} />
          <p>Aucun rendez-vous trouvé.</p>
        </div>
      ) : (
        <div className="rdv-list">
          {rdvFiltres.map(rdv => (
            <div key={rdv.id} className="rdv-card card">
              {/* En-tête de la carte */}
              <div
                className="rdv-card__header"
                onClick={() => setExpandId(expandId === rdv.id ? null : rdv.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setExpandId(expandId === rdv.id ? null : rdv.id)}
                aria-expanded={expandId === rdv.id}
              >
                <div className="rdv-card__main">
                  <div className="rdv-card__info">
                    <strong>{rdv.nom}</strong>
                    <span>{rdv.service}</span>
                  </div>
                </div>
                <div className="rdv-card__meta">
                  <span className="rdv-card__date">
                    <Calendar size={13} /> {formatDate(rdv.date)} · {rdv.heure}
                  </span>
                  <span className="rdv-card__prix">{formatPrix(rdv.montant)}</span>
                  {statutBadge(rdv.statut)}
                  {expandId === rdv.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Détails dépliables */}
              {expandId === rdv.id && (
                <div className="rdv-card__details">
                  <div className="rdv-card__details-grid">
                    <div>
                      <label>Téléphone</label>
                      <span><Phone size={13} /> {rdv.telephone}</span>
                    </div>
                    {rdv.email && (
                      <div>
                        <label>Email</label>
                        <span>{rdv.email}</span>
                      </div>
                    )}
                    <div>
                      <label>Paiement</label>
                      <span>{paiementBadge(rdv.paiementStatut)}</span>
                    </div>
                    {rdv.refTransaction && (
                      <div>
                        <label>Réf. transaction</label>
                        <span>{rdv.refTransaction}</span>
                      </div>
                    )}
                    {rdv.note && (
                      <div className="rdv-card__note">
                        <label>Note cliente</label>
                        <span>{rdv.note}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="rdv-card__actions">
                    {rdv.statut !== 'confirme' && rdv.statut !== 'annule' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={async () => {
                          const { error } = await mettreAJourStatutRdv(rdv.id, 'confirme');
                          if (!error) toast.success(`RDV de ${rdv.nom} confirmé.`);
                          else toast.error('Erreur lors de la confirmation.');
                        }}
                      >
                        <CheckCircle size={14} />
                        Confirmer
                      </button>
                    )}
                    {rdv.statut !== 'annule' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          const { error } = await mettreAJourStatutRdv(rdv.id, 'annule');
                          if (!error) toast.warning(`RDV de ${rdv.nom} annulé.`);
                          else toast.error('Erreur lors de l\'annulation.');
                        }}
                      >
                        <XCircle size={14} />
                        Annuler
                      </button>
                    )}
                    {rdv.statut === 'annule' && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={async () => {
                          const { error } = await mettreAJourStatutRdv(rdv.id, 'en_attente');
                          if (!error) toast.info(`RDV de ${rdv.nom} remis en attente.`);
                          else toast.error('Erreur.');
                        }}
                      >
                        <Clock size={14} />
                        Remettre en attente
                      </button>
                    )}
                    <a
                      href={`https://wa.me/${rdv.telephone.replace(/\s/g,'').replace('+','')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
