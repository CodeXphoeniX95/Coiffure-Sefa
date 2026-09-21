import { useState, useEffect } from 'react';
import { Clock, Save, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { creneaux } from '../../data/mockData';
import './DisponibilitesAdmin.css';

export default function DisponibilitesAdmin() {
  const { disponibilites, mettreAJourDispo } = useApp();
  const toast = useToast();

  const [editedDispo, setEditedDispo] = useState([]);

  // Synchroniser quand les dispos sont chargées depuis Supabase
  useEffect(() => {
    if (disponibilites.length > 0) {
      setEditedDispo(disponibilites.map(d => ({ ...d })));
    }
  }, [disponibilites]);

  const updateDispo = (id, field, value) => {
    setEditedDispo(prev =>
      prev.map(d => d.id === id ? { ...d, [field]: value } : d)
    );
  };

  const sauvegarder = async () => {
    const results = await Promise.all(
      editedDispo.map(d =>
        mettreAJourDispo(d.id, {
          heureDebut: d.heureDebut,
          heureFin:   d.heureFin,
          actif:      d.actif,
        })
      )
    );

    const hasError = results.some(r => r.error);
    if (hasError) {
      toast.error('Erreur lors de l\'enregistrement des disponibilités.');
    } else {
      toast.success('Disponibilités enregistrées avec succès.');
    }
  };

  return (
    <div className="dispos-admin">
      <div className="admin-page-header">
        <div>
          <h1>Disponibilités</h1>
          <p>Configurez les jours et horaires d'ouverture du salon</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={sauvegarder}>
          <Save size={15} /> Enregistrer
        </button>
      </div>

      <div className="dispos-grid">
        {editedDispo.map(d => (
          <div key={d.id} className={`dispo-card card ${!d.actif ? 'dispo-card--ferme' : ''}`}>
            <div className="dispo-card__header">
              <div className="dispo-card__jour">
                <strong>{d.jour}</strong>
                {d.actif
                  ? <span className="badge badge-confirme">Ouvert</span>
                  : <span className="badge badge-annule">Fermé</span>
                }
              </div>
              <label className="dispo-toggle" title={d.actif ? 'Fermer ce jour' : 'Ouvrir ce jour'}>
                <input
                  type="checkbox"
                  checked={d.actif}
                  onChange={e => updateDispo(d.id, 'actif', e.target.checked)}
                />
                <span className="dispo-toggle__slider" />
              </label>
            </div>

            {d.actif && (
              <div className="dispo-card__horaires">
                <div className="form-group">
                  <label><Clock size={13} /> Ouverture</label>
                  <select
                    value={d.heureDebut}
                    onChange={e => updateDispo(d.id, 'heureDebut', e.target.value)}
                  >
                    {creneaux.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="dispo-card__sep">→</div>
                <div className="form-group">
                  <label><Clock size={13} /> Fermeture</label>
                  <select
                    value={d.heureFin}
                    onChange={e => updateDispo(d.id, 'heureFin', e.target.value)}
                  >
                    {creneaux.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {!d.actif && (
              <p className="dispo-card__ferme-msg">
                <XCircle size={14} /> Le salon est fermé ce jour.
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Aperçu créneaux */}
      <div className="card dispos-apercu">
        <h3>Créneaux disponibles</h3>
        <p style={{ color: 'var(--gris-moyen)', fontSize: '0.85rem', marginBottom: 16 }}>
          Ces créneaux horaires sont proposés lors de la réservation.
        </p>
        <div className="dispos-creneaux">
          {creneaux.map(c => (
            <span key={c} className="dispo-creneau">{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
