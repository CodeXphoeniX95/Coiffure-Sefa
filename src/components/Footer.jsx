import { Link } from 'react-router-dom';
import { Scissors, Phone, MapPin, Mail, MessageCircle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { infosSalon as mockInfos } from '../data/mockData';
import './Footer.css';

// Icônes de marques non disponibles dans lucide-react v1.31+
function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export default function Footer() {
  const { salonInfos } = useApp();
  const infos = salonInfos || mockInfos;
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="container footer__grid">

          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <div className="footer__logo-icon">
                {infos.logo
                  ? <img src={infos.logo} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:'var(--radius-md)' }} />
                  : <Scissors size={20} />
                }
              </div>
              <div>
                <span className="footer__logo-main">{infos.nom || "Mon'Trésor"}</span>
                <span className="footer__logo-sub">Coiffure & Tresse</span>
              </div>
            </div>
            <p className="footer__desc">{infos.slogan}</p>
            <div className="footer__socials">
              <a href={infos.facebook || '#'} target="_blank" rel="noopener noreferrer"
                 aria-label="Facebook" className="footer__social-btn">
                <IconFacebook />
              </a>
              <a href={infos.instagram || '#'} target="_blank" rel="noopener noreferrer"
                 aria-label="Instagram" className="footer__social-btn">
                <IconInstagram />
              </a>
              <a href={`https://wa.me/${infos.whatsapp || ''}`} target="_blank" rel="noopener noreferrer"
                 aria-label="WhatsApp" className="footer__social-btn footer__social-btn--whatsapp">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="footer__col footer__col--nav">
            <h4 className="footer__col-title">Navigation</h4>
            <ul className="footer__links">
              {[
                { to: '/',           label: 'Accueil'     },
                { to: '/services',   label: 'Services'    },
                { to: '/galerie',    label: 'Galerie'     },
                { to: '/reserver',   label: 'Réserver'    },
                { to: '/contact',    label: 'Contact'     },
                { to: '/mon-espace', label: 'Mon espace'  },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="footer__link">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="footer__col footer__col--services">
            <h4 className="footer__col-title">Nos Services</h4>
            <ul className="footer__links">
              {['Tresses Simples', 'Tresses Collées', 'Coiffure Mariage', 'Lissage Kératine', 'Soin Capillaire', 'Mèches & Balayage'].map(s => (
                <li key={s}>
                  <Link to="/services" className="footer__link">{s}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__col">
            <h4 className="footer__col-title">Contact</h4>
            <ul className="footer__contact-list">
              <li>
                <MapPin size={15} />
                <span>{infos.adresse}</span>
              </li>
              <li>
                <Phone size={15} />
                <a href={`tel:${infos.telephone}`} className="footer__link">{infos.telephone}</a>
              </li>
              <li>
                <Mail size={15} />
                <a href={`mailto:${infos.email}`} className="footer__link">{infos.email}</a>
              </li>
              <li>
                <Clock size={15} />
                <span>{infos.horaires}</span>
              </li>
            </ul>
            <a
              href={`https://wa.me/${infos.whatsapp || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm footer__whatsapp-btn"
            >
              <MessageCircle size={16} />
              Écrire sur WhatsApp
            </a>
          </div>

        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>© {year} Coiffure et Tresse Mon'Trésor — Lomé, Togo. Tous droits réservés.</p>
          <Link to="/admin/login" className="footer__admin-link">Espace Admin</Link>
        </div>
      </div>
    </footer>
  );
}
