import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { categoriesServices } from '../data/mockData';
import { useApp } from '../context/AppContext';
import ServiceCard from '../components/ServiceCard';
import './Services.css';

export default function Services() {
  const { services } = useApp();
  const [categorieActive, setCategorieActive] = useState('tous');

  const servicesFiltres = categorieActive === 'tous'
    ? services.filter(s => s.actif)
    : services.filter(s => s.actif && s.categorie === categorieActive);

  const categories = [{ id: 'tous', label: 'Tous les services' }, ...categoriesServices];

  return (
    <div className="services-page">
      {/* En-tête */}
      <div className="page-header">
        <div className="container page-header__inner">
          <h1 className="page-header__titre">Nos <span>Services</span></h1>
          <p className="page-header__desc">
            Découvrez l'ensemble de nos prestations capillaires, pensées pour sublimer votre beauté naturelle.
          </p>
          <div className="page-header__breadcrumb">
            <Link to="/">Accueil</Link>
            <span>/</span>
            <span>Services</span>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="container services-page__filters">
        <div className="filters-bar">
          <Filter size={16} className="filters-bar__icon" />
          <span className="filters-bar__label">Filtrer :</span>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`filter-btn ${categorieActive === cat.id ? 'filter-btn--active' : ''}`}
              onClick={() => setCategorieActive(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille */}
      <div className="container services-page__content">
        {servicesFiltres.length === 0 ? (
          <div className="empty-state">
            <p>Aucun service dans cette catégorie pour le moment.</p>
          </div>
        ) : (
          <div className="grid-3">
            {servicesFiltres.map(s => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}

        {/* Info paiement */}
        <div className="services-page__info-paiement">
          <h3>Paiement Mobile Money accepté</h3>
          <div className="payment-methods">
            <div className="payment-method">
              <div className="payment-method__logo payment-method__logo--flooz">F</div>
              <span>Flooz (Moov)</span>
            </div>
            <div className="payment-method">
              <div className="payment-method__logo payment-method__logo--tmoney">T</div>
              <span>T-Money</span>
            </div>
            <div className="payment-method">
              <div className="payment-method__logo payment-method__logo--cash">₣</div>
              <span>Cash en salon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
