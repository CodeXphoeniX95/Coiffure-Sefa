import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ZoomIn } from 'lucide-react';
import { categoriesGalerie } from '../data/mockData';
import { useApp } from '../context/AppContext';
import './Galerie.css';

export default function Galerie() {
  const { galerie } = useApp();
  const [categorieActive, setCategorieActive] = useState('toutes');
  const [photoZoom, setPhotoZoom]             = useState(null);

  const photosFiltrees = categorieActive === 'toutes'
    ? galerie
    : galerie.filter(p => p.categorie === categorieActive);

  const ouvrirZoom = (photo) => setPhotoZoom(photo);
  const fermerZoom = ()      => setPhotoZoom(null);

  return (
    <div className="galerie-page">
      {/* En-tête */}
      <div className="page-header">
        <div className="container page-header__inner">
          <h1 className="page-header__titre">Notre <span>Galerie</span></h1>
          <p className="page-header__desc">
            Chaque photo raconte une histoire. Parcourez nos réalisations et laissez-vous inspirer.
          </p>
          <div className="page-header__breadcrumb">
            <Link to="/">Accueil</Link>
            <span>/</span>
            <span>Galerie</span>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="container galerie-page__filters">
        <div className="filters-bar">
          {categoriesGalerie.map(cat => (
            <button
              key={cat.id}
              className={`filter-btn ${categorieActive === cat.id ? 'filter-btn--active' : ''}`}
              onClick={() => setCategorieActive(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <p className="galerie-page__count">
          {photosFiltrees.length} réalisation{photosFiltrees.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Grille masonry */}
      <div className="container galerie-page__grid">
        {photosFiltrees.map((photo) => (
          <div
            key={photo.id}
            className="galerie-photo-card"
            onClick={() => ouvrirZoom(photo)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && ouvrirZoom(photo)}
            aria-label={`Voir ${photo.titre}`}
          >
            <img src={photo.image} alt={photo.titre} loading="lazy" />
            <div className="galerie-photo-card__overlay">
              <ZoomIn size={28} />
              <span>{photo.titre}</span>
              <span className="galerie-photo-card__cat">{photo.categorie}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA réservation */}
      <div className="galerie-page__cta">
        <div className="container galerie-page__cta-inner">
          <h3>Une coiffure vous a inspirée ?</h3>
          <p>Réservez votre rendez-vous et montrez-nous la photo comme référence.</p>
          <Link to="/reserver" className="btn btn-primary btn-lg">
            Réserver avec cette inspiration
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      {photoZoom && (
        <div
          className="lightbox"
          onClick={fermerZoom}
          role="dialog"
          aria-modal="true"
          aria-label="Image agrandie"
        >
          <button className="lightbox__close" onClick={fermerZoom} aria-label="Fermer">
            <X size={24} />
          </button>
          <div className="lightbox__content" onClick={e => e.stopPropagation()}>
            <img src={photoZoom.image} alt={photoZoom.titre} />
            <div className="lightbox__info">
              <strong>{photoZoom.titre}</strong>
              <span>{photoZoom.categorie}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
