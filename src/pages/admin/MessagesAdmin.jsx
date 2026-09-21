import { useState, useEffect } from 'react';
import {
  Mail, Phone, MessageCircle, Trash2,
  CheckCircle, Clock, ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getMessages, marquerMessageLu, supprimerMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import './MessagesAdmin.css';

export default function MessagesAdmin() {
  const toast = useToast();
  const [messages,   setMessages]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [expandId,   setExpandId]   = useState(null);
  const [filtreNonLu, setFiltreNonLu] = useState(false);
  const [recherche,  setRecherche]  = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  // ─── Chargement initial ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await getMessages();
      if (!error) setMessages(data || []);
      setLoading(false);
    };
    load();

    // Realtime
    const channel = supabase
      .channel('realtime:messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
          toast.info(`Nouveau message de ${payload.new.nom}`);
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages(prev => prev.map(m =>
            m.id === payload.new.id ? payload.new : m
          ));
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-TG', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const nonLus = messages.filter(m => !m.lu).length;

  const messagesFiltres = messages
    .filter(m => !filtreNonLu || !m.lu)
    .filter(m => {
      const q = recherche.toLowerCase();
      return (
        m.nom.toLowerCase().includes(q) ||
        m.telephone.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q) ||
        (m.sujet || '').toLowerCase().includes(q)
      );
    });

  const ouvrir = async (msg) => {
    const newId = expandId === msg.id ? null : msg.id;
    setExpandId(newId);
    // Marquer comme lu quand on ouvre
    if (newId && !msg.lu) {
      const { error } = await marquerMessageLu(msg.id);
      if (!error) {
        setMessages(prev => prev.map(m =>
          m.id === msg.id ? { ...m, lu: true } : m
        ));
      }
    }
  };

  const supprimer = async (id) => {
    const { error } = await supprimerMessage(id);
    setConfirmDel(null);
    if (!error) toast.warning('Message supprimé.');
    else toast.error('Erreur lors de la suppression.');
  };

  const SUJETS = {
    rdv:      'Prise de rendez-vous',
    tarifs:   'Renseignement sur les tarifs',
    paiement: 'Problème de paiement',
    autre:    'Autre',
  };

  return (
    <div className="messages-admin">
      <div className="admin-page-header">
        <div>
          <h1>Messages</h1>
          <p>
            {messages.length} message{messages.length > 1 ? 's' : ''}
            {nonLus > 0 && <span className="messages-admin__nonlu-badge">{nonLus} non lu{nonLus > 1 ? 's' : ''}</span>}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="admin-filters card" style={{ marginBottom: 16 }}>
        <div className="admin-filters__tabs">
          <button
            className={`filter-tab ${!filtreNonLu ? 'filter-tab--active' : ''}`}
            onClick={() => setFiltreNonLu(false)}
          >
            Tous
            <span className="filter-tab__count">{messages.length}</span>
          </button>
          <button
            className={`filter-tab ${filtreNonLu ? 'filter-tab--active' : ''}`}
            onClick={() => setFiltreNonLu(true)}
          >
            Non lus
            <span className="filter-tab__count">{nonLus}</span>
          </button>
        </div>
        <div className="admin-filters__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Rechercher par nom, téléphone, message…"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-empty card"><p>Chargement…</p></div>
      ) : messagesFiltres.length === 0 ? (
        <div className="admin-empty card">
          <Mail size={40} />
          <p>Aucun message trouvé.</p>
        </div>
      ) : (
        <div className="messages-list">
          {messagesFiltres.map(msg => (
            <div key={msg.id} className={`msg-card card ${!msg.lu ? 'msg-card--nonlu' : ''}`}>
              {/* En-tête */}
              <div
                className="msg-card__header"
                onClick={() => ouvrir(msg)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && ouvrir(msg)}
                aria-expanded={expandId === msg.id}
              >
                <div className="msg-card__left">
                  {!msg.lu && <span className="msg-card__dot" />}
                  <div className="msg-card__avatar">{msg.nom.charAt(0).toUpperCase()}</div>
                  <div className="msg-card__info">
                    <strong>{msg.nom}</strong>
                    <span>{msg.sujet ? SUJETS[msg.sujet] || msg.sujet : 'Sans sujet'}</span>
                  </div>
                </div>
                <div className="msg-card__right">
                  <span className="msg-card__date">{formatDate(msg.created_at)}</span>
                  {msg.lu
                    ? <span className="badge badge-confirme" style={{ fontSize:'0.68rem' }}>Lu</span>
                    : <span className="badge badge-en_attente" style={{ fontSize:'0.68rem' }}>Non lu</span>
                  }
                  {expandId === msg.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </div>

              {/* Corps */}
              {expandId === msg.id && (
                <div className="msg-card__body">
                  <div className="msg-card__coords">
                    <div><Phone size={14} /><span>{msg.telephone}</span></div>
                    {msg.email && <div><Mail size={14} /><span>{msg.email}</span></div>}
                  </div>
                  <div className="msg-card__texte">
                    {msg.message}
                  </div>
                  <div className="msg-card__actions">
                    <a
                      href={`https://wa.me/${msg.telephone.replace(/\D/g,'')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      <MessageCircle size={14} /> Répondre WhatsApp
                    </a>
                    {msg.email && (
                      <a href={`mailto:${msg.email}?subject=Réponse - ${msg.sujet || 'votre message'}`}
                        className="btn btn-outline btn-sm">
                        <Mail size={14} /> Répondre Email
                      </a>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setConfirmDel(msg.id)}
                      style={{ marginLeft:'auto' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation suppression */}
      {confirmDel && (
        <div className="admin-modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="admin-modal admin-modal--sm card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10 }}>Supprimer ce message ?</h3>
            <p style={{ color:'var(--gris-moyen)', marginBottom: 20, fontSize:'0.85rem' }}>
              Cette action est irréversible.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setConfirmDel(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={() => supprimer(confirmDel)}>
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
