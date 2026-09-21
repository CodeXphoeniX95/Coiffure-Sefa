import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  LogOut, User, Phone, Scissors, MessageCircle, Edit2, Save, X
} from 'lucide-react';
import { useClientAuth } from '../context/ClientAuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { infosSalon as mockInfos } from '../data/mockData';
import { useApp } from '../context/AppContext';
import './MonEspace.css';

export default function MonEspace() {
  const { client, profile, deconnexion, mettreAJourProfil, isConnected } = useClientAuth();
  const { salonInfos } = useApp();
  const infos = salonInfos || mockInfos;
  const toast = useToast();
  const navigate = useNavigate();

  const [rdvs,        setRdvs]        = useState([]);
  const [loadingRdv,  setLoadingRdv]  = useState(true);
  const [editProfil,  setEditProfil]  = useState(false);
  const [formProfil,  setFormProfil]  = useState({ nom: '', telephone: '' });
  const [savingProfil, setSavingProfil] = useState(false);
  const [cancelId,    setCancelId]    = useState(null);

  // Rediriger si non connecté
  useEffect(() => {
    if (!isConnected) navigate('/connexion', { state: { from: '/mon-espace' } });
  }, [isConnected, navigate]);

  // Préremplir le formulaire profil
  useEffect(() => {
    if (profile) setFormProfil({ nom: profile.nom || '', telephone: profile.telephone || '' });
  }, [profile]);

  // Charger les RDV de la cliente connectée
  useEffect(() => {
    if (!client) return;
    const load = async () => {
      setLoadingRdv(true);
      try {
        const { data, error } = await supabase
          .from('rendez_vous')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false });
        if (!error) setRdvs(data || []);
        // Si 400 (colonne client_id absente), on affiche juste une liste vide
      } catch {
        // Colonne client_id pas encore créée en base
      }
      setLoadingRdv(false);
    };
    load();
  }, [client]);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-TG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatPrix = (p) =>
    new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(p);

  const statutConfig = (statut) => {
    switch (statut) {
      case 'confirme':   return { label: 'Confirmé',   cls: 'badge-confirme',   icon: <CheckCircle size={13} /> };
      case 'en_attente': return { label: 'En attente', cls: 'badge-en_attente', icon: <Clock size={13} /> };
      case 'annule':     return { label: 'Annulé',     cls: 'badge-annule',     icon: <XCircle size={13} /> };
      case 'termine':    return { label: 'Terminé',    cls: 'badge-termine',    icon: <CheckCircle size={13} /> };
      default:           return { label: statut,       cls: '',                 icon: null };
    }
  };

  const paiementConfig = (s) => {
    switch (s) {
      case 'paye':            return { label: 'Payé',         cls: 'badge-confirme'   };
      case 'en_verification': return { label: 'Vérification', cls: 'badge-en_attente' };
      case 'rembourse':       return { label: 'Remboursé',    cls: 'badge-rembourse'  };
      default:                return { label: 'En attente',   cls: 'badge-en_attente' };
    }
  };

  // Annuler un RDV (seulement si dans le futur et pas encore annulé)
  const annulerRdv = async (rdv) => {
    const { error } = await supabase
      .from('rendez_vous')
      .update({ statut: 'annule' })
      .eq('id', rdv.id)
      .eq('client_id', client.id);

    if (!error) {
      setRdvs(prev => prev.map(r => r.id === rdv.id ? { ...r, statut: 'annule' } : r));
      toast.warning('Rendez-vous annulé.');
    } else {
      toast.error('Erreur lors de l\'annulation.');
    }
    setCancelId(null);
  };

  const peutAnnuler = (rdv) => {
    if (rdv.statut === 'annule' || rdv.statut === 'termine') return false;
    const dateRdv = new Date(`${rdv.date_rdv}T${rdv.heure}`);
    const now = new Date();
    const diff = dateRdv - now;
    return diff > 24 * 60 * 60 * 1000; // 24h avant
  };

  const sauvegarderProfil = async () => {
    setSavingProfil(true);
    const { error } = await mettreAJourProfil(formProfil);
    setSavingProfil(false);
    if (!error) {
      toast.success('Profil mis à jour.');
      setEditProfil(false);
    } else {
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  const handleDeconnexion = async () => {
    await deconnexion();
    toast.info('Déconnectée.');
    navigate('/');
  };

  if (!isConnected) return null;

  const prochains = rdvs.filter(r => r.statut !== 'annule' && r.statut !== 'termine' && new Date(r.date_rdv) >= new Date());
  const passes    = rdvs.filter(r => r.statut === 'termine' || r.statut === 'annule' || new Date(r.date_rdv) < new Date());

  return (
    <div className="mon-espace">
      <div className="container mon-espace__content">

        {/* ── En-tête ── */}
        <div className="mon-espace__header">
          <div className="mon-espace__avatar">
            {(profile?.nom || client?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1>Bonjour, {profile?.nom || 'Cliente'} 👋</h1>
            <p>{client?.email}</p>
          </div>
          <button className="btn btn-outline btn-sm mon-espace__logout" onClick={handleDeconnexion}>
            <LogOut size={14} /> Déconnexion
          </button>
        </div>

        <div className="mon-espace__grid">

          {/* ── Profil ── */}
          <div className="card mon-espace__profil">
            <div className="mon-espace__section-header">
              <h2><User size={16} /> Mon profil</h2>
              {!editProfil && (
                <button className="btn btn-outline btn-sm" onClick={() => setEditProfil(true)}>
                  <Edit2 size={13} /> Modifier
                </button>
              )}
            </div>

            {editProfil ? (
              <div className="mon-espace__profil-form">
                <div className="form-group">
                  <label>Nom complet</label>
                  <input type="text" value={formProfil.nom}
                    onChange={e => setFormProfil(p => ({ ...p, nom: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Téléphone</label>
                  <input type="tel" value={formProfil.telephone}
                    onChange={e => setFormProfil(p => ({ ...p, telephone: e.target.value }))} />
                </div>
                <div className="mon-espace__profil-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => setEditProfil(false)}>
                    <X size={13} /> Annuler
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={sauvegarderProfil} disabled={savingProfil}>
                    <Save size={13} /> {savingProfil ? 'Sauvegarde…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mon-espace__profil-infos">
                <div className="mon-espace__info-item">
                  <User size={15} />
                  <span>{profile?.nom || '—'}</span>
                </div>
                <div className="mon-espace__info-item">
                  <Phone size={15} />
                  <span>{profile?.telephone || '—'}</span>
                </div>
              </div>
            )}

            <div className="mon-espace__actions-rapides">
              <Link to="/reserver" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Calendar size={14} /> Nouveau RDV
              </Link>
              <a href={`https://wa.me/${infos.whatsapp || ''}`} target="_blank" rel="noopener noreferrer"
                className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>
          </div>

          {/* ── Stats rapides ── */}
          <div className="mon-espace__stats">
            <div className="card me-stat">
              <strong>{rdvs.length}</strong>
              <span>RDV total</span>
            </div>
            <div className="card me-stat">
              <strong>{prochains.length}</strong>
              <span>À venir</span>
            </div>
            <div className="card me-stat">
              <strong>{rdvs.filter(r => r.statut === 'confirme').length}</strong>
              <span>Confirmés</span>
            </div>
          </div>

          {/* ── Prochains RDV ── */}
          <div className="mon-espace__rdvs">
            <h2 className="mon-espace__rdvs-titre">
              <Calendar size={16} /> Prochains rendez-vous
            </h2>

            {loadingRdv ? (
              <div className="me-loading">Chargement…</div>
            ) : prochains.length === 0 ? (
              <div className="me-empty card">
                <Scissors size={36} />
                <p>Aucun rendez-vous à venir.</p>
                <Link to="/reserver" className="btn btn-primary btn-sm">Réserver maintenant</Link>
              </div>
            ) : (
              prochains.map(rdv => {
                const s = statutConfig(rdv.statut);
                const p = paiementConfig(rdv.paiement_statut);
                return (
                  <div key={rdv.id} className="me-rdv-card card">
                    <div className="me-rdv-card__header">
                      <div className="me-rdv-card__service">
                        <Scissors size={14} />
                        <strong>{rdv.service_nom}</strong>
                      </div>
                      <span className={`badge ${s.cls}`}>{s.icon} {s.label}</span>
                    </div>
                    <div className="me-rdv-card__body">
                      <span><Calendar size={13} /> {formatDate(rdv.date_rdv)}</span>
                      <span><Clock size={13} /> {rdv.heure}</span>
                      <span className={`badge ${p.cls}`} style={{ fontSize: '0.72rem' }}>{p.label}</span>
                    </div>
                    <div className="me-rdv-card__footer">
                      <strong className="me-rdv-card__prix">{formatPrix(rdv.montant)}</strong>
                      {rdv.statut === 'confirme' && (
                        <span className="me-rdv-card__confirme">
                          <CheckCircle size={13} /> Votre rendez-vous est confirmé !
                        </span>
                      )}
                      {peutAnnuler(rdv) && (
                        <button className="btn btn-danger btn-sm" onClick={() => setCancelId(rdv.id)}>
                          <XCircle size={13} /> Annuler
                        </button>
                      )}
                    </div>
                    {rdv.note && (
                      <div className="me-rdv-card__note">
                        <span>📝 {rdv.note}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Historique */}
            {passes.length > 0 && (
              <>
                <h2 className="mon-espace__rdvs-titre" style={{ marginTop: 28 }}>
                  <Clock size={16} /> Historique
                </h2>
                {passes.map(rdv => {
                  const s = statutConfig(rdv.statut);
                  return (
                    <div key={rdv.id} className="me-rdv-card me-rdv-card--passe card">
                      <div className="me-rdv-card__header">
                        <div className="me-rdv-card__service">
                          <Scissors size={14} />
                          <strong>{rdv.service_nom}</strong>
                        </div>
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                      </div>
                      <div className="me-rdv-card__body">
                        <span><Calendar size={13} /> {formatDate(rdv.date_rdv)}</span>
                        <span><Clock size={13} /> {rdv.heure}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirmation annulation ── */}
      {cancelId && (
        <div className="admin-modal-overlay" onClick={() => setCancelId(null)}>
          <div className="admin-modal admin-modal--sm card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10 }}>Annuler ce rendez-vous ?</h3>
            <p style={{ color: 'var(--gris-moyen)', fontSize: '0.85rem', marginBottom: 20 }}>
              L'annulation est possible jusqu'à 24h avant le rendez-vous. Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setCancelId(null)}>Garder le RDV</button>
              <button className="btn btn-danger" onClick={() => annulerRdv(rdvs.find(r => r.id === cancelId))}>
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
