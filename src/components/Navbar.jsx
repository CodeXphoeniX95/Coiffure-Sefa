import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Scissors, User, LogOut } from 'lucide-react';
import { useClientAuth } from '../context/ClientAuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import './Navbar.css';

const navLinks = [
  { to: '/',          label: 'Accueil'   },
  { to: '/services',  label: 'Services'  },
  { to: '/galerie',   label: 'Galerie'   },
  { to: '/reserver',  label: 'Réserver'  },
  { to: '/contact',   label: 'Contact'   },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { isConnected, profile, deconnexion } = useClientAuth();
  const { salonInfos } = useApp();
  const toast = useToast();

  useEffect(() => { setMenuOpen(false); }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDeconnexion = async () => {
    await deconnexion();
    toast.info('Déconnectée.');
  };

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <div className="navbar__logo-icon">
            {salonInfos?.logo
              ? <img src={salonInfos.logo} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:'var(--radius-md)' }} />
              : <Scissors size={20} />
            }
          </div>
          <div className="navbar__logo-text">
            <span className="navbar__logo-main">{salonInfos?.nom?.split(' ')[0] || "Mon'Trésor"}</span>
            <span className="navbar__logo-sub">Coiffure & Tresse</span>
          </div>
        </Link>

        {/* Liens desktop */}
        <nav className="navbar__nav" aria-label="Navigation principale">
          <ul className="navbar__links">
            {navLinks.map(link => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `navbar__link ${isActive ? 'navbar__link--active' : ''}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* CTA + compte + burger */}
        <div className="navbar__actions">
          {isConnected ? (
            <div className="navbar__compte">
              <Link to="/mon-espace" className="navbar__compte-btn" title="Mon espace">
                <User size={15} />
                <span className="navbar__compte-nom">{profile?.nom?.split(' ')[0] || 'Mon espace'}</span>
              </Link>
              <button className="navbar__deconnexion" onClick={handleDeconnexion} title="Déconnexion">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link to="/connexion" className="btn btn-outline btn-sm navbar__connexion">
              <User size={14} /> Connexion
            </Link>
          )}
          <Link to="/reserver" className="btn btn-primary btn-sm navbar__cta">
            Prendre RDV
          </Link>
          <button
            className="navbar__burger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <div className={`navbar__mobile ${menuOpen ? 'navbar__mobile--open' : ''}`} aria-hidden={!menuOpen}>
        <ul className="navbar__mobile-links">
          {navLinks.map(link => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `navbar__mobile-link ${isActive ? 'navbar__mobile-link--active' : ''}`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          <li>
            {isConnected ? (
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <Link to="/mon-espace" className="btn btn-outline" style={{ flex:1, justifyContent:'center' }}>
                  <User size={14} /> Mon espace
                </Link>
                <button className="btn btn-dark btn-sm" onClick={handleDeconnexion} style={{ flexShrink:0 }}>
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link to="/connexion" className="btn btn-outline" style={{ width:'100%', marginTop:8, justifyContent:'center' }}>
                <User size={14} /> Se connecter
              </Link>
            )}
          </li>
          <li>
            <Link to="/reserver" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
              Prendre RDV
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
