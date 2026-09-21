import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays, CreditCard, TrendingUp,
  CheckCircle, Clock, XCircle, ChevronRight,
  Scissors, BarChart2, PieChart, ArrowUp, ArrowDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './Dashboard.css';

// ─── Helpers ────────────────────────────────────────────────
const formatPrix = (p) =>
  new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(p);

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-TG', { day: 'numeric', month: 'short', year: 'numeric' });
};

const MOIS_LABELS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

export default function Dashboard() {
  const { rendezVous, services, salonInfos } = useApp();

  // ─── Stats globales ─────────────────────────────────────
  const total     = rendezVous.length;
  const confirmes = rendezVous.filter(r => r.statut === 'confirme').length;
  const enAttente = rendezVous.filter(r => r.statut === 'en_attente').length;
  const annules   = rendezVous.filter(r => r.statut === 'annule').length;

  const recettesTotales = rendezVous
    .filter(r => r.paiementStatut === 'paye')
    .reduce((s, r) => s + r.montant, 0);

  const recettesEnAttente = rendezVous
    .filter(r => r.paiementStatut === 'en_attente' || r.paiementStatut === 'en_verification')
    .reduce((s, r) => s + r.montant, 0);

  const tauxConfirmation = total > 0 ? Math.round((confirmes / total) * 100) : 0;

  // ─── Revenus par mois (12 derniers mois) ────────────────
  const revenusParMois = useMemo(() => {
    const now = new Date();
    const mois = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { label: MOIS_LABELS[d.getMonth()], annee: d.getFullYear(), mois: d.getMonth(), total: 0 };
    });

    rendezVous
      .filter(r => r.paiementStatut === 'paye' && r.createdAt)
      .forEach(r => {
        const d = new Date(r.createdAt);
        const idx = mois.findIndex(m => m.mois === d.getMonth() && m.annee === d.getFullYear());
        if (idx !== -1) mois[idx].total += r.montant;
      });

    const max = Math.max(...mois.map(m => m.total), 1);
    return mois.map(m => ({ ...m, pct: Math.round((m.total / max) * 100) }));
  }, [rendezVous]);

  // ─── Services les plus demandés ──────────────────────────
  const servicesStats = useMemo(() => {
    const compteur = {};
    rendezVous.forEach(r => {
      if (!r.service) return;
      compteur[r.service] = (compteur[r.service] || 0) + 1;
    });
    const total = Object.values(compteur).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(compteur)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nom, count]) => ({ nom, count, pct: Math.round((count / total) * 100) }));
  }, [rendezVous]);

  // ─── Répartition paiements ───────────────────────────────
  const paiementStats = useMemo(() => {
    const modes = { flooz: 0, tmoney: 0, cash: 0 };
    rendezVous.filter(r => r.paiementStatut === 'paye').forEach(r => {
      if (r.paiement in modes) modes[r.paiement] += r.montant;
    });
    const tot = Object.values(modes).reduce((s, v) => s + v, 1);
    return [
      { label: 'Flooz', valeur: modes.flooz,  pct: Math.round(modes.flooz  / tot * 100), color: '#FF6B00' },
      { label: 'T-Money', valeur: modes.tmoney, pct: Math.round(modes.tmoney / tot * 100), color: '#007AFF' },
      { label: 'Cash',   valeur: modes.cash,   pct: Math.round(modes.cash   / tot * 100), color: 'var(--violet)' },
    ].filter(m => m.valeur > 0);
  }, [rendezVous]);

  // ─── Evolution mois en cours vs mois précédent ──────────
  const evolutionMois = useMemo(() => {
    const now = new Date();
    const moisActuel = now.getMonth();
    const moisPrec   = moisActuel === 0 ? 11 : moisActuel - 1;
    const anneeActuelle = now.getFullYear();
    const anneePrec     = moisActuel === 0 ? anneeActuelle - 1 : anneeActuelle;

    const rdvActuel = rendezVous.filter(r => {
      const d = r.createdAt ? new Date(r.createdAt) : null;
      return d && d.getMonth() === moisActuel && d.getFullYear() === anneeActuelle;
    }).length;

    const rdvPrec = rendezVous.filter(r => {
      const d = r.createdAt ? new Date(r.createdAt) : null;
      return d && d.getMonth() === moisPrec && d.getFullYear() === anneePrec;
    }).length;

    const diff = rdvPrec > 0 ? Math.round(((rdvActuel - rdvPrec) / rdvPrec) * 100) : 0;
    return { rdvActuel, rdvPrec, diff };
  }, [rendezVous]);

  // ─── Derniers RDV ───────────────────────────────────────
  const derniersRdv = [...rendezVous]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const statutLabel = (s) => {
    if (s === 'confirme')   return { label: 'Confirmé',   cls: 'badge-confirme'   };
    if (s === 'en_attente') return { label: 'En attente', cls: 'badge-en_attente' };
    if (s === 'annule')     return { label: 'Annulé',     cls: 'badge-annule'     };
    return { label: s, cls: '' };
  };

  return (
    <div className="dashboard">
      {/* En-tête */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__titre">Tableau de bord</h1>
          <p className="dashboard__sous-titre">
            {salonInfos?.nom || "Mon'Trésor"} — Vue d'ensemble de votre activité
          </p>
        </div>
        <Link to="/reserver" target="_blank" className="btn btn-primary btn-sm">
          <CalendarDays size={15} /> Nouvelle réservation
        </Link>
      </div>

      {/* ── Cartes KPI ── */}
      <div className="dashboard__stats">
        <div className="stat-card card">
          <div className="stat-card__icon" style={{ background:'rgba(139,92,246,.12)', color:'var(--violet)' }}>
            <CalendarDays size={22} />
          </div>
          <div className="stat-card__info">
            <span className="stat-card__label">RDV ce mois</span>
            <strong className="stat-card__valeur">{evolutionMois.rdvActuel}</strong>
            {evolutionMois.rdvPrec > 0 && (
              <span className={`stat-card__trend ${evolutionMois.diff >= 0 ? 'stat-card__trend--up' : 'stat-card__trend--down'}`}>
                {evolutionMois.diff >= 0 ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
                {Math.abs(evolutionMois.diff)}% vs mois dernier
              </span>
            )}
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-card__icon" style={{ background:'rgba(34,197,94,.12)', color:'var(--vert)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-card__info">
            <span className="stat-card__label">Recettes confirmées</span>
            <strong className="stat-card__valeur">{formatPrix(recettesTotales)}</strong>
            {recettesEnAttente > 0 && (
              <span className="stat-card__trend" style={{ color:'var(--orange)' }}>
                {formatPrix(recettesEnAttente)} en attente
              </span>
            )}
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-card__icon" style={{ background:'rgba(249,115,22,.12)', color:'var(--orange)' }}>
            <Clock size={22} />
          </div>
          <div className="stat-card__info">
            <span className="stat-card__label">En attente</span>
            <strong className="stat-card__valeur">{enAttente}</strong>
            <span className="stat-card__trend" style={{ color:'var(--gris-moyen)' }}>
              {annules} annulé{annules > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-card__icon" style={{ background:'rgba(6,182,212,.12)', color:'#06B6D4' }}>
            <CheckCircle size={22} />
          </div>
          <div className="stat-card__info">
            <span className="stat-card__label">Taux de confirmation</span>
            <strong className="stat-card__valeur">{tauxConfirmation}%</strong>
            <span className="stat-card__trend" style={{ color:'var(--gris-moyen)' }}>
              {confirmes} / {total} RDV
            </span>
          </div>
        </div>
      </div>

      {/* ── Graphiques ── */}
      <div className="dashboard__charts">

        {/* Revenus 6 derniers mois */}
        <div className="card dash-chart">
          <div className="dash-chart__header">
            <div>
              <h2><BarChart2 size={16} /> Revenus — 6 derniers mois</h2>
              <p>Recettes des paiements confirmés</p>
            </div>
          </div>
          <div className="bar-chart">
            {revenusParMois.map((m, i) => (
              <div key={i} className="bar-chart__col">
                <span className="bar-chart__value">
                  {m.total > 0 ? formatPrix(m.total).replace('FCFA','').replace('XOF','').trim() : '—'}
                </span>
                <div className="bar-chart__bar-wrap">
                  <div
                    className="bar-chart__bar"
                    style={{ height: `${m.pct}%` }}
                    title={formatPrix(m.total)}
                  />
                </div>
                <span className="bar-chart__label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Services les plus demandés */}
        <div className="card dash-chart">
          <div className="dash-chart__header">
            <div>
              <h2><Scissors size={16} /> Services populaires</h2>
              <p>Répartition des réservations</p>
            </div>
          </div>
          {servicesStats.length === 0 ? (
            <p style={{ color:'var(--gris-moyen)', fontSize:'0.85rem', padding:'20px 0' }}>
              Aucune donnée disponible.
            </p>
          ) : (
            <div className="horiz-bars">
              {servicesStats.map((s, i) => (
                <div key={i} className="horiz-bar">
                  <div className="horiz-bar__header">
                    <span className="horiz-bar__label">{s.nom}</span>
                    <span className="horiz-bar__count">{s.count} RDV · {s.pct}%</span>
                  </div>
                  <div className="horiz-bar__track">
                    <div
                      className="horiz-bar__fill"
                      style={{ width: `${s.pct}%`, opacity: 1 - i * 0.15 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Ligne 3 : table RDV + paiements + accès rapides ── */}
      <div className="dashboard__body">

        {/* Derniers RDV */}
        <div className="card dashboard__rdv">
          <div className="dashboard__section-header">
            <h2>Dernières réservations</h2>
            <Link to="/admin/rendez-vous" className="dashboard__voir-tout">
              Voir tout <ChevronRight size={14} />
            </Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {derniersRdv.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--gris-moyen)', padding:'24px' }}>Aucun rendez-vous.</td></tr>
                ) : derniersRdv.map(rdv => {
                  const s = statutLabel(rdv.statut);
                  return (
                    <tr key={rdv.id}>
                      <td><strong>{rdv.nom}</strong><br/><small>{rdv.telephone}</small></td>
                      <td>{rdv.service}</td>
                      <td>{formatDate(rdv.date)}</td>
                      <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                      <td>{formatPrix(rdv.montant)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="dashboard__quick">

          {/* Répartition modes de paiement */}
          {paiementStats.length > 0 && (
            <div className="card dash-paiements">
              <div className="dashboard__section-header">
                <h2><CreditCard size={15} /> Modes de paiement</h2>
              </div>
              <div className="pie-bars">
                {paiementStats.map((p, i) => (
                  <div key={i} className="pie-bar">
                    <div className="pie-bar__header">
                      <div className="pie-bar__dot" style={{ background: p.color }} />
                      <span>{p.label}</span>
                      <strong style={{ marginLeft:'auto' }}>{p.pct}%</strong>
                    </div>
                    <div className="horiz-bar__track">
                      <div className="horiz-bar__fill" style={{ width:`${p.pct}%`, background: p.color }} />
                    </div>
                    <small style={{ color:'var(--gris-moyen)' }}>{formatPrix(p.valeur)}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accès rapides */}
          <h2 style={{ fontSize:'0.92rem', fontWeight:700, color:'var(--noir-doux)', margin:'4px 0' }}>Accès rapides</h2>
          <div className="dashboard__quick-links">
            {[
              { to:'/admin/rendez-vous',    icon:<CalendarDays size={20}/>, label:'Gérer les RDV',  badge: enAttente > 0 ? enAttente : null },
              { to:'/admin/paiements',      icon:<CreditCard size={20}/>,   label:'Paiements',      badge: null },
              { to:'/admin/services',       icon:<Scissors size={20}/>,     label:'Services',       badge: null },
              { to:'/admin/disponibilites', icon:<Clock size={20}/>,        label:'Disponibilités', badge: null },
            ].map((item, i) => (
              <Link key={i} to={item.to} className="quick-link card">
                <div className="quick-link__icon">{item.icon}</div>
                <span>{item.label}</span>
                {item.badge && <span className="quick-link__badge">{item.badge}</span>}
                <ChevronRight size={14} className="quick-link__arrow" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
