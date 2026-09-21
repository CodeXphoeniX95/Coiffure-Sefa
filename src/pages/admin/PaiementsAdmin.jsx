import { useState } from 'react';
import { Search, CreditCard, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import './PaiementsAdmin.css';

const FILTRES = [
  { id: 'tous',            label: 'Tous'            },
  { id: 'en_attente',      label: 'En attente'      },
  { id: 'en_verification', label: 'Vérification'    },
  { id: 'paye',            label: 'Payés'           },
  { id: 'rembourse',       label: 'Remboursés'      },
];

const MODES_LABEL = {
  flooz:  'Flooz',
  tmoney: 'T-Money',
  cash:   'Cash',
  manuel: 'Manuel',
  '':     '—',
};

export default function PaiementsAdmin() {
  const { rendezVous, mettreAJourPaiement } = useApp();
  const toast = useToast();
  const [filtre,    setFiltre]    = useState('tous');
  const [recherche, setRecherche] = useState('');

  const formatPrix = (p) =>
    new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(p);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-TG', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const paiementsFiltres = rendezVous
    .filter(r => filtre === 'tous' || r.paiementStatut === filtre)
    .filter(r => {
      const q = recherche.toLowerCase();
      return (
        r.nom.toLowerCase().includes(q)           ||
        r.service.toLowerCase().includes(q)       ||
        (r.refTransaction || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.id - a.id);

  // ─── Totaux ───────────────────────────────────────────────
  const totalPaye       = rendezVous.filter(r => r.paiementStatut === 'paye').reduce((s, r) => s + r.montant, 0);
  const totalEnAttente  = rendezVous.filter(r => r.paiementStatut === 'en_attente' || r.paiementStatut === 'en_verification').reduce((s, r) => s + r.montant, 0);

  const confirmerPaiement = async (id) => {
    const rdv = rendezVous.find(r => r.id === id);
    const { error } = await mettreAJourPaiement(id, { paiement: rdv?.paiement || '', paiementStatut: 'paye', refTransaction: rdv?.refTransaction || '' });
    if (!error) toast.success(`Paiement de ${rdv?.nom || '#'+id} validé.`);
    else toast.error('Erreur lors de la validation.');
  };

  const refuserPaiement = async (id) => {
    const rdv = rendezVous.find(r => r.id === id);
    const { error } = await mettreAJourPaiement(id, { paiement: rdv?.paiement || '', paiementStatut: 'rembourse', refTransaction: rdv?.refTransaction || '' });
    if (!error) toast.warning(`Paiement de ${rdv?.nom || '#'+id} refusé — remboursement enregistré.`);
    else toast.error('Erreur lors du refus.');
  };

  const paiementBadge = (s) => {
    if (s === 'paye')             return <span className="badge badge-confirme">Payé</span>;
    if (s === 'en_verification')  return <span className="badge badge-en_attente">Vérification</span>;
    if (s === 'rembourse')        return <span className="badge badge-annule">Remboursé</span>;
    return <span className="badge badge-en_attente">En attente</span>;
  };

  return (
    <div className="paiements-admin">
      <div className="admin-page-header">
        <h1>Paiements</h1>
        <p>Suivi et validation des paiements Mobile Money</p>
      </div>

      {/* Résumé */}
      <div className="paiements-resume">
        <div className="card paiements-resume__card">
          <div className="paiements-resume__icon" style={{ background: 'rgba(34,197,94,.12)', color: 'var(--vert)' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <span>Recettes confirmées</span>
            <strong>{formatPrix(totalPaye)}</strong>
          </div>
        </div>
        <div className="card paiements-resume__card">
          <div className="paiements-resume__icon" style={{ background: 'rgba(249,115,22,.12)', color: 'var(--orange)' }}>
            <Clock size={22} />
          </div>
          <div>
            <span>En attente / vérification</span>
            <strong>{formatPrix(totalEnAttente)}</strong>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="admin-filters card">
        <div className="admin-filters__tabs">
          {FILTRES.map(f => (
            <button
              key={f.id}
              className={`filter-tab ${filtre === f.id ? 'filter-tab--active' : ''}`}
              onClick={() => setFiltre(f.id)}
            >
              {f.label}
              <span className="filter-tab__count">
                {f.id === 'tous'
                  ? rendezVous.length
                  : rendezVous.filter(r => r.paiementStatut === f.id).length}
              </span>
            </button>
          ))}
        </div>
        <div className="admin-filters__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Rechercher par nom, service, référence…"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Service</th>
                <th>Date RDV</th>
                <th>Mode</th>
                <th>Réf. transaction</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paiementsFiltres.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--gris-moyen)', padding: '32px' }}>
                    Aucun paiement trouvé.
                  </td>
                </tr>
              ) : (
                paiementsFiltres.map(rdv => (
                  <tr key={rdv.id}>
                    <td>
                      <strong>{rdv.nom}</strong>
                      <br /><small>{rdv.telephone}</small>
                    </td>
                    <td>{rdv.service}</td>
                    <td>{formatDate(rdv.date)} · {rdv.heure}</td>
                    <td>
                      <span className={`mode-pill mode-pill--${rdv.paiement || 'vide'}`}>
                        {MODES_LABEL[rdv.paiement] || '—'}
                      </span>
                    </td>
                    <td>{rdv.refTransaction || <span style={{color:'var(--gris-moyen)'}}>—</span>}</td>
                    <td><strong>{formatPrix(rdv.montant)}</strong></td>
                    <td>{paiementBadge(rdv.paiementStatut)}</td>
                    <td>
                      <div className="paiements-actions">
                        {(rdv.paiementStatut === 'en_attente' || rdv.paiementStatut === 'en_verification') && (
                          <>
                            <button
                              className="btn btn-primary btn-xs"
                              onClick={() => confirmerPaiement(rdv.id)}
                              title="Confirmer le paiement"
                            >
                              <CheckCircle size={13} /> Valider
                            </button>
                            <button
                              className="btn btn-danger btn-xs"
                              onClick={() => refuserPaiement(rdv.id)}
                              title="Refuser / rembourser"
                            >
                              <XCircle size={13} /> Refuser
                            </button>
                          </>
                        )}
                        {rdv.paiementStatut === 'paye' && (
                          <span style={{ color: 'var(--vert)', fontSize: '0.8rem', display:'flex', alignItems:'center', gap:4 }}>
                            <CheckCircle size={14} /> Validé
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
