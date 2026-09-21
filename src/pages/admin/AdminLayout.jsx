import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, Navigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Scissors, CalendarDays, CreditCard, Image,
  Clock, LogOut, Menu, X, Bell, ChevronRight, Calendar, AlertCircle, Store, Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import './AdminLayout.css';

const navItems = [
  { to: '/admin/dashboard',      icon: <LayoutDashboard size={18} />, label: 'Tableau de bord' },
  { to: '/admin/rendez-vous',    icon: <CalendarDays size={18} />,    label: 'Rendez-vous'     },
  { to: '/admin/paiements',      icon: <CreditCard size={18} />,      label: 'Paiements'       },
  { to: '/admin/messages',       icon: <Mail size={18} />,            label: 'Messages'        },
  { to: '/admin/services',       icon: <Scissors size={18} />,        label: 'Services'        },
  { to: '/admin/galerie',        icon: <Image size={18} />,           label: 'Galerie'         },
  { to: '/admin/disponibilites', icon: <Clock size={18} />,           label: 'Disponibilités'  },
  { to: '/admin/infos-salon',    icon: <Store size={18} />,           label: 'Infos du salon'  },
];

export default function AdminLayout() {
  const { isAuthenticated, admin, logout, authLoading } = useAuth();
  const { rendezVous }                     = useApp();
  const navigate                           = useNavigate();
  const [sidebarOpen, setSidebarOpen]      = useState(false);
  const [notifOpen,   setNotifOpen]        = useState(false);
  const [messagesNonLus, setMessagesNonLus] = useState(0);
  const notifRef                           = useRef(null);

  // Charger et écouter les messages non lus
  useEffect(() => {
    const loadNonLus = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('lu', false);
      setMessagesNonLus(count || 0);
    };
    loadNonLus();

    const channel = supabase
      .channel('layout:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadNonLus();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ─── useEffect TOUJOURS appelé, avant tout return conditionnel ───
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  // ─── Returns conditionnels APRÈS tous les hooks ───────────────────
  if (authLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--gris-pale)', color:'var(--gris-moyen)', fontSize:'0.9rem', gap:12 }}>
      <div className="admin-spinner" /> Chargement...
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  const rdvEnAttente       = rendezVous.filter(r => r.statut === 'en_attente');
  const paiementsAVerifier = rendezVous.filter(r => r.paiementStatut === 'en_verification');
  const totalNotifs        = rdvEnAttente.length + paiementsAVerifier.length;

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-TG', { day: 'numeric', month: 'short' });
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        {/* Logo */}
        <div className="admin-sidebar__logo">
          <div className="admin-sidebar__logo-icon"><Scissors size={20} /></div>
          <div>
            <span className="admin-sidebar__logo-main">Mon'Trésor</span>
            <span className="admin-sidebar__logo-sub">Administration</span>
          </div>
          <button
            className="admin-sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar__nav">
          <ul>
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.label === 'Rendez-vous' && rdvEnAttente.length > 0 && (
                    <span className="admin-nav-badge">{rdvEnAttente.length}</span>
                  )}
                  {item.label === 'Messages' && messagesNonLus > 0 && (
                    <span className="admin-nav-badge">{messagesNonLus}</span>
                  )}
                  <ChevronRight size={14} className="admin-nav-link__arrow" />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User */}
        <div className="admin-sidebar__user">
          <div className="admin-sidebar__user-avatar">
            {admin?.nom?.charAt(0) || 'A'}
          </div>
          <div className="admin-sidebar__user-info">
            <strong>{admin?.nom}</strong>
            <span>{admin?.email}</span>
          </div>
          <button className="admin-sidebar__logout" onClick={handleLogout} aria-label="Déconnexion">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Contenu principal */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <button
            className="admin-topbar__burger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} />
          </button>
          <h2 className="admin-topbar__title">Coiffure et Tresse Mon'Trésor</h2>
          <div className="admin-topbar__actions">
            {/* Cloche notifications */}
            <div className="notif-wrap" ref={notifRef}>
              <button
                className={`admin-topbar__notif-btn ${totalNotifs > 0 ? 'admin-topbar__notif-btn--active' : ''}`}
                onClick={() => setNotifOpen(o => !o)}
                aria-label="Notifications"
                aria-expanded={notifOpen}
              >
                <Bell size={18} />
                {totalNotifs > 0 && (
                  <span className="notif-badge">{totalNotifs}</span>
                )}
              </button>

              {notifOpen && (
                <div className="notif-panel" role="dialog" aria-label="Panneau de notifications">
                  <div className="notif-panel__header">
                    <strong>Notifications</strong>
                    {totalNotifs > 0 && (
                      <span className="notif-panel__count">{totalNotifs} non traitée{totalNotifs > 1 ? 's' : ''}</span>
                    )}
                  </div>

                  <div className="notif-panel__body">
                    {totalNotifs === 0 ? (
                      <div className="notif-panel__empty">
                        <Bell size={28} />
                        <p>Aucune notification</p>
                      </div>
                    ) : (
                      <>
                        {rdvEnAttente.length > 0 && (
                          <div className="notif-group">
                            <span className="notif-group__label">RDV en attente de confirmation</span>
                            {rdvEnAttente.map(rdv => (
                              <Link
                                key={rdv.id}
                                to="/admin/rendez-vous"
                                className="notif-item notif-item--rdv"
                                onClick={() => setNotifOpen(false)}
                              >
                                <div className="notif-item__icon">
                                  <Calendar size={15} />
                                </div>
                                <div className="notif-item__content">
                                  <strong>{rdv.nom}</strong>
                                  <span>{rdv.service}</span>
                                  <span className="notif-item__date">{formatDate(rdv.date)} · {rdv.heure}</span>
                                </div>
                                <span className="badge badge-en_attente" style={{fontSize:'0.68rem'}}>En attente</span>
                              </Link>
                            ))}
                          </div>
                        )}

                        {paiementsAVerifier.length > 0 && (
                          <div className="notif-group">
                            <span className="notif-group__label">Paiements à vérifier</span>
                            {paiementsAVerifier.map(rdv => (
                              <Link
                                key={rdv.id}
                                to="/admin/paiements"
                                className="notif-item notif-item--paiement"
                                onClick={() => setNotifOpen(false)}
                              >
                                <div className="notif-item__icon notif-item__icon--paiement">
                                  <CreditCard size={15} />
                                </div>
                                <div className="notif-item__content">
                                  <strong>{rdv.nom}</strong>
                                  <span>{rdv.service}</span>
                                  <span className="notif-item__date">Réf: {rdv.refTransaction || '—'}</span>
                                </div>
                                <span className="badge badge-en_attente" style={{fontSize:'0.68rem'}}>Vérifier</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {totalNotifs > 0 && (
                    <div className="notif-panel__footer">
                      <Link
                        to="/admin/rendez-vous"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setNotifOpen(false)}
                      >
                        Gérer les RDV
                      </Link>
                      <Link
                        to="/admin/paiements"
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setNotifOpen(false)}
                      >
                        Voir paiements
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link to="/" target="_blank" className="btn btn-outline btn-sm">
              Voir le site
            </Link>
            <button className="btn btn-dark btn-sm" onClick={handleLogout}>
              <LogOut size={14} />
              Déconnexion
            </button>
          </div>
        </header>

        {/* Page */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
