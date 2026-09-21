import { Link } from 'react-router-dom';
import { Star, Scissors, Calendar, CreditCard, ChevronRight, ArrowRight, Award, Clock, MapPin } from 'lucide-react';
import { temoignages, infosSalon as mockInfos } from '../data/mockData';
import { useApp } from '../context/AppContext';
import ServiceCard from '../components/ServiceCard';
import './Accueil.css';

export default function Accueil() {
  const { salonInfos, services, galerie } = useApp();
  const infos = salonInfos || mockInfos;
  const servicesPhares = services.filter(s => s.actif).slice(0, 3);
  const photosRecentes = galerie.slice(0, 6);
  const temosAffiches  = temoignages.slice(0, 3);

  return (
    <div className="accueil">

      {/* ─── HERO ──────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="container hero__content">
          <div className="hero__text">
            <span className="hero__tag">✦ Salon de Coiffure & Tresses · Lomé, Togo</span>
            <h1 className="hero__titre">
              L'art de sublimer<br />
              <span className="hero__titre-accent">votre beauté</span><br />
              naturelle
            </h1>
            <p className="hero__sous-titre">
              Tresses, coiffures, soins capillaires — des réalisations uniques
              pensées pour vous. Réservez votre créneau en quelques clics.
            </p>
            <div className="hero__actions">
              <Link to="/reserver" className="btn btn-primary btn-lg">
                <Calendar size={20} />
                Réserver maintenant
              </Link>
              <Link to="/galerie" className="btn btn-outline btn-lg hero__btn-galerie">
                Voir la galerie
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="hero__stats">
              <div className="hero__stat">
                <strong>500+</strong>
                <span>Clientes satisfaites</span>
              </div>
              <div className="hero__stat-sep" />
              <div className="hero__stat">
                <strong>5 ans</strong>
                <span>D'expérience</span>
              </div>
              <div className="hero__stat-sep" />
              <div className="hero__stat">
                <strong>4.9★</strong>
                <span>Note moyenne</span>
              </div>
            </div>
          </div>
          <div className="hero__visual">
            <div className="hero__img-wrap">
              {infos.hero_image ? (
                <img
                  src={infos.hero_image}
                  alt="Coiffure élégante Mon'Trésor"
                  className="hero__img"
                />
              ) : (
                <div className="hero__img-placeholder">
                  <Scissors size={48} color="rgba(155,48,255,0.4)" />
                </div>
              )}
              <div className="hero__img-badge">
                <Award size={22} />
                <div>
                  <strong>Mon'Trésor</strong>
                  <span>Expertise & Passion</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Vague */}
        <div className="hero__wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="var(--blanc-casse)" />
          </svg>
        </div>
      </section>

      {/* ─── AVANTAGES ─────────────────────────────────────── */}
      <section className="avantages section-padding">
        <div className="container">
          <div className="avantages__grid">
            {[
              { icon: <Scissors size={28}/>,  titre: 'Expertise confirmée',   desc: 'Plus de 5 ans de passion et de maîtrise dans l\'art de la coiffure.' },
              { icon: <Calendar size={28}/>,  titre: 'Réservation facile',    desc: 'Prenez rendez-vous en ligne en 2 minutes, 24h/24 et 7j/7.' },
              { icon: <CreditCard size={28}/>,titre: 'Paiement Mobile Money', desc: 'Payez facilement via Flooz ou T-Money directement depuis votre téléphone.' },
              { icon: <Clock size={28}/>,     titre: 'Ponctualité garantie',  desc: 'Votre temps est précieux. Nous respectons toujours vos créneaux.' },
            ].map((a, i) => (
              <div key={i} className="avantage-card">
                <div className="avantage-card__icon">{a.icon}</div>
                <h3 className="avantage-card__titre">{a.titre}</h3>
                <p className="avantage-card__desc">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES PHARES ───────────────────────────────── */}
      <section className="section-padding services-section" style={{ background: 'var(--gris-pale)' }}>
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-titre">Nos <span>Services</span></h2>
            <p className="section-sous-titre">
              Des prestations soignées pour toutes les occasions — du quotidien au plus spécial.
            </p>
          </div>
          <div className="grid-3">
            {servicesPhares.map(s => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
          <div className="section-cta">
            <Link to="/services" className="btn btn-outline btn-lg">
              Voir tous les services
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── GALERIE RÉCENTE ───────────────────────────────── */}
      <section className="section-padding galerie-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-titre">Nos <span>Réalisations</span></h2>
            <p className="section-sous-titre">
              Chaque tête est une œuvre. Découvrez quelques-unes de nos créations récentes.
            </p>
          </div>
          <div className="galerie-grid">
            {photosRecentes.map((p, i) => (
              <div key={p.id} className={`galerie-item galerie-item--${i === 0 || i === 3 ? 'large' : 'normal'}`}>
                <img src={p.image} alt={p.titre} loading="lazy" />
                <div className="galerie-item__overlay">
                  <span>{p.titre}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="section-cta">
            <Link to="/galerie" className="btn btn-outline btn-lg">
              Voir toute la galerie
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ─────────────────────────────── */}
      <section className="section-padding comment-section" style={{ background: 'var(--noir-doux)' }}>
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-titre" style={{ color: 'var(--blanc)' }}>
              Comment <span>réserver</span> ?
            </h2>
            <p className="section-sous-titre" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Réservez votre rendez-vous en 4 étapes simples depuis votre téléphone.
            </p>
          </div>
          <div className="comment__steps">
            {[
              { num: '01', titre: 'Choisissez un service',  desc: 'Parcourez nos prestations et trouvez celle qui vous convient.' },
              { num: '02', titre: 'Sélectionnez un créneau', desc: 'Choisissez la date et l\'heure qui vous arrangent.' },
              { num: '03', titre: 'Payez en avance',         desc: 'Réglez via Flooz ou T-Money pour confirmer votre RDV.' },
              { num: '04', titre: 'Venez, on s\'occupe de vous', desc: 'Arrivez sereinement. Votre coiffeuse vous attend.' },
            ].map((step, i) => (
              <div key={i} className="comment__step">
                <div className="comment__step-num">{step.num}</div>
                <div className="comment__step-connector" />
                <h4 className="comment__step-titre">{step.titre}</h4>
                <p className="comment__step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="section-cta">
            <Link to="/reserver" className="btn btn-primary btn-lg">
              <Calendar size={20} />
              Réserver maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TÉMOIGNAGES ───────────────────────────────────── */}
      <section className="section-padding temoignages-section" style={{ background: 'var(--gris-pale)' }}>
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-titre">Ce que disent nos <span>clientes</span></h2>
            <p className="section-sous-titre">Des femmes satisfaites, c'est notre plus belle récompense.</p>
          </div>
          <div className="grid-3">
            {temosAffiches.map(t => (
              <div key={t.id} className="temo-card card">
                <div className="temo-card__stars">
                  {Array.from({ length: t.note }).map((_, i) => (
                    <Star key={i} size={16} fill="var(--violet)" color="var(--violet)" />
                  ))}
                </div>
                <p className="temo-card__comment">"{t.commentaire}"</p>
                <div className="temo-card__footer">
                  <div className="temo-card__avatar">
                    {t.nom.charAt(0)}
                  </div>
                  <div>
                    <strong className="temo-card__nom">{t.nom}</strong>
                    <span className="temo-card__service">{t.service}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─────────────────────────────────────── */}
      <section className="cta-section">
        <div className="container cta-section__inner">
          <div className="cta-section__text">
            <h2>Prête pour une nouvelle coiffure ?</h2>
            <p>Réservez maintenant et payez facilement via Mobile Money.</p>
          </div>
          <div className="cta-section__actions">
            <Link to="/reserver" className="btn btn-white btn-lg">
              <Calendar size={20} />
              Prendre rendez-vous
            </Link>
            <a
              href={`https://wa.me/${infos.whatsapp || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-lg cta-section__wa"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ─── ADRESSE ───────────────────────────────────────── */}
      <section className="adresse-section">
        <div className="container adresse-section__inner">
          <MapPin size={20} color="var(--violet)" />
          <span>
            <strong>{infos.nom}</strong> — {infos.adresse} &nbsp;|&nbsp; {infos.horaires}
          </span>
          <a href={`tel:${infos.telephone}`} className="btn btn-primary btn-sm">
            Appeler maintenant
          </a>
        </div>
      </section>

    </div>
  );
}
