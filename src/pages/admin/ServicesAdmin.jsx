import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, CheckCircle, XCircle, X, Save, Upload, Image } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { uploadImage, deleteImage } from '../../lib/api';
import { categoriesServices } from '../../data/mockData';
import './ServicesAdmin.css';

const FORM_INIT = {
  nom: '', description: '', prix: '', duree: '', categorie: 'tresses', image: '', actif: true,
};
const ACCEPT  = 'image/jpeg,image/png,image/webp';
const MAX_MB  = 5;
const BUCKET  = 'services'; // bucket Supabase Storage dédié aux services

export default function ServicesAdmin() {
  const { services, ajouterService, modifierService, supprimerService } = useApp();
  const toast = useToast();

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [form,         setForm]         = useState(FORM_INIT);
  const [errors,       setErrors]       = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Upload état
  const [selectedFile,  setSelectedFile]  = useState(null);
  const [previewUrl,    setPreviewUrl]    = useState(null);
  const [uploading,     setUploading]     = useState(false);
  const fileInputRef = useRef(null);

  const formatPrix = (p) =>
    new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(p);

  const ouvrirAjout = () => {
    setForm(FORM_INIT);
    setEditingId(null);
    setErrors({});
    resetUpload();
    setModalOpen(true);
  };

  const ouvrirEdit = (service) => {
    setForm({
      nom:         service.nom,
      description: service.description,
      prix:        String(service.prix),
      duree:       String(service.duree),
      categorie:   service.categorie,
      image:       service.image || '',
      actif:       service.actif,
    });
    setEditingId(service.id);
    setErrors({});
    resetUpload();
    // Afficher l'image existante comme prévisualisation
    if (service.image) setPreviewUrl(service.image);
    setModalOpen(true);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(p => ({ ...p, image: 'Fichier image requis (JPG, PNG, WebP).' }));
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrors(p => ({ ...p, image: `Max ${MAX_MB} Mo.` }));
      return;
    }
    setErrors(p => ({ ...p, image: '' }));
    setSelectedFile(file);
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange({ target: { files: [file] } });
  };

  const validerForm = () => {
    const errs = {};
    if (!form.nom.trim())         errs.nom         = 'Le nom est requis.';
    if (!form.description.trim()) errs.description = 'La description est requise.';
    if (!form.prix || isNaN(form.prix) || Number(form.prix) <= 0) errs.prix = 'Prix invalide.';
    if (!form.duree || isNaN(form.duree) || Number(form.duree) <= 0) errs.duree = 'Durée invalide.';
    if (!previewUrl && !form.image) errs.image = 'Une image est requise.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const sauvegarder = async () => {
    if (!validerForm()) return;
    setUploading(true);

    let imageUrl = form.image; // URL existante si pas de nouveau fichier

    if (selectedFile) {
      // Essayer bucket 'services', fallback sur 'galerie' si inexistant
      let { url, error: upErr } = await uploadImage(selectedFile, BUCKET);
      if (upErr) {
        ({ url, error: upErr } = await uploadImage(selectedFile, 'galerie'));
      }
      if (upErr || !url) {
        toast.error('Erreur upload image. Vérifiez que le bucket "galerie" est public dans Supabase Storage.');
        setUploading(false);
        return;
      }
      if (editingId && form.image) await deleteImage(form.image, 'galerie');
      imageUrl = url;
    }

    const data = {
      nom:         form.nom,
      description: form.description,
      prix:        Number(form.prix),
      duree:       Number(form.duree),
      categorie:   form.categorie,
      actif:       form.actif,
      image:       imageUrl,
    };

    if (editingId !== null) {
      const { error } = await modifierService(editingId, data);
      if (!error) toast.success('Service mis à jour.');
      else toast.error('Erreur lors de la mise à jour.');
    } else {
      const { error } = await ajouterService(data);
      if (!error) toast.success('Service ajouté avec succès.');
      else toast.error('Erreur lors de l\'ajout.');
    }

    setUploading(false);
    fermerModal();
  };

  const fermerModal = () => {
    setModalOpen(false);
    resetUpload();
    setForm(FORM_INIT);
    setErrors({});
  };

  const toggleActif = async (id, actif) => {
    const { error } = await modifierService(id, { actif: !actif });
    if (!error) toast.info(!actif ? 'Service activé.' : 'Service désactivé.');
    else toast.error('Erreur.');
  };

  const supprimer = async (id) => {
    const service = services.find(s => s.id === id);
    if (service?.image) await deleteImage(service.image, BUCKET);
    const { error } = await supprimerService(id);
    setConfirmDelete(null);
    if (!error) toast.warning(`"${service?.nom || ''}" supprimé.`);
    else toast.error('Erreur lors de la suppression.');
  };

  const update = (f, v) => {
    setForm(p => ({ ...p, [f]: v }));
    setErrors(p => ({ ...p, [f]: '' }));
  };

  return (
    <div className="services-admin">
      <div className="admin-page-header">
        <div>
          <h1>Services</h1>
          <p>{services.filter(s => s.actif).length} actifs · {services.length} au total</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={ouvrirAjout}>
          <Plus size={16} /> Ajouter un service
        </button>
      </div>

      {/* Grille services */}
      <div className="services-admin__grid">
        {services.map(s => (
          <div key={s.id} className={`sa-card card ${!s.actif ? 'sa-card--inactif' : ''}`}>
            <div className="sa-card__img-wrap">
              {s.image
                ? <img src={s.image} alt={s.nom} loading="lazy" />
                : <div className="sa-card__img-placeholder"><Image size={32} color="var(--gris-moyen)" /></div>
              }
              <span className={`sa-card__status ${s.actif ? 'sa-card__status--actif' : 'sa-card__status--inactif'}`}>
                {s.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div className="sa-card__body">
              <div className="sa-card__cat">{s.categorie}</div>
              <h3 className="sa-card__nom">{s.nom}</h3>
              <p className="sa-card__desc">{s.description}</p>
              <div className="sa-card__meta">
                <strong>{formatPrix(s.prix)}</strong>
                <span>{s.duree} min</span>
              </div>
            </div>
            <div className="sa-card__actions">
              <button className="btn btn-outline btn-xs" onClick={() => toggleActif(s.id, s.actif)}>
                {s.actif ? <XCircle size={13} /> : <CheckCircle size={13} />}
                {s.actif ? 'Désactiver' : 'Activer'}
              </button>
              <button className="btn btn-outline btn-xs" onClick={() => ouvrirEdit(s)}>
                <Pencil size={13} /> Modifier
              </button>
              <button className="btn btn-danger btn-xs" onClick={() => setConfirmDelete(s.id)}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal formulaire */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={fermerModal}>
          <div className="admin-modal card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>{editingId !== null ? 'Modifier le service' : 'Ajouter un service'}</h2>
              <button className="admin-modal__close" onClick={fermerModal}><X size={18} /></button>
            </div>

            <div className="admin-modal__body">
              {/* Zone upload image */}
              <div className="form-group">
                <label>Photo du service *</label>
                <div
                  className={`ga-upload-zone ${previewUrl ? 'ga-upload-zone--has-preview' : ''} ${errors.image ? 'ga-upload-zone--error' : ''}`}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Prévisualisation" className="ga-upload-zone__preview" />
                      <div className="ga-upload-zone__overlay"><Upload size={18} /><span>Changer</span></div>
                    </>
                  ) : (
                    <div className="ga-upload-zone__placeholder">
                      <Image size={32} />
                      <strong>Cliquez ou glissez une photo</strong>
                      <span>JPG, PNG, WebP — max {MAX_MB} Mo</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept={ACCEPT} className="sr-only" onChange={handleFileChange} />
                {errors.image && <p className="form-error">{errors.image}</p>}
              </div>

              <div className="form-group">
                <label>Nom du service *</label>
                <input type="text" placeholder="Ex: Tresses Collées"
                  value={form.nom} onChange={e => update('nom', e.target.value)} />
                {errors.nom && <p className="form-error">{errors.nom}</p>}
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea rows={3} placeholder="Décrivez le service..."
                  value={form.description} onChange={e => update('description', e.target.value)} />
                {errors.description && <p className="form-error">{errors.description}</p>}
              </div>

              <div className="admin-modal__row">
                <div className="form-group">
                  <label>Prix (FCFA) *</label>
                  <input type="number" min="0" placeholder="Ex: 5000"
                    value={form.prix} onChange={e => update('prix', e.target.value)} />
                  {errors.prix && <p className="form-error">{errors.prix}</p>}
                </div>
                <div className="form-group">
                  <label>Durée (minutes) *</label>
                  <input type="number" min="0" placeholder="Ex: 120"
                    value={form.duree} onChange={e => update('duree', e.target.value)} />
                  {errors.duree && <p className="form-error">{errors.duree}</p>}
                </div>
              </div>

              <div className="form-group">
                <label>Catégorie</label>
                <select value={form.categorie} onChange={e => update('categorie', e.target.value)}>
                  {categoriesServices.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <label className="admin-toggle">
                <input type="checkbox" checked={form.actif} onChange={e => update('actif', e.target.checked)} />
                <span>Service actif (visible sur le site)</span>
              </label>
            </div>

            <div className="admin-modal__footer">
              <button className="btn btn-outline" onClick={fermerModal} disabled={uploading}>Annuler</button>
              <button className="btn btn-primary" onClick={sauvegarder} disabled={uploading}>
                {uploading ? <><span className="ga-spinner" /> Upload…</> : <><Save size={15} /> {editingId !== null ? 'Enregistrer' : 'Ajouter'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {confirmDelete !== null && (
        <div className="admin-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="admin-modal admin-modal--sm card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>Supprimer ce service ?</h3>
            <p style={{ color: 'var(--gris-moyen)', marginBottom: 24 }}>L'image sera aussi supprimée du stockage.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={() => supprimer(confirmDelete)}>
                <Trash2 size={15} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
