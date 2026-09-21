import { Link } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import './ServiceCard.css';

export default function ServiceCard({ service }) {
  const formatPrix = (p) =>
    new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(p);

  return (
    <div className="service-card card">
      <div className="service-card__img-wrap">
        <img
          src={service.image}
          alt={service.nom}
          className="service-card__img"
          loading="lazy"
        />
        <span className="service-card__categorie">{service.categorie}</span>
      </div>
      <div className="service-card__body">
        <h3 className="service-card__nom">{service.nom}</h3>
        <p className="service-card__desc">{service.description}</p>
        <div className="service-card__meta">
          <span className="service-card__prix">{formatPrix(service.prix)}</span>
          <span className="service-card__duree">
            <Clock size={14} />
            {service.duree} min
          </span>
        </div>
        <Link
          to={`/reserver?service=${service.id}`}
          className="btn btn-primary service-card__btn"
        >
          Réserver
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
