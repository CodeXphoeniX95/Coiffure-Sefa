import { useState, useRef } from 'react';
import { Plus, Trash2, X, Upload, ImageOff, Image } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { uploadImage, deleteImage } from '../../lib/api';
import { categoriesGalerie } from '../../data/mockData';
import './GalerieAdmin.css';

const FORM_INIT = { titre: '', categorie: 'tresses' };
const CATS = categoriesGalerie.filter(c => c.id !== 'toutes');

// Formats acceptés
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_MB  = 5;

export default function GalerieAdmin() {
  const { galerie, ajouterPhoto, supprimerPhoto } = useApp();
  const toast = useToast();

  const [filtreActive,  setFiltreActive]  = useState('toutes');
  const [modalOpen,     setModalOpen]     = useState(false);
  const [form,          setForm]          = useState(FORM_INIT);
  const [errors,        setErrors]        = useState({});
  const [uploading,     setUploading]     = useState(false);
  const [previewUrl,    setPreviewUrl]    = useState(null);
  const [selectedFile,  setSelectedFile]  = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileInputRef = useRef(null);

  const photosFiltrees = filtreActive === 'toutes'
    ? galerie
    : galerie.filter(p => p.categorie === filtreActive);

  // ─── Sélection fichier ──────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(p => ({ ...p, fichier: 'Le fichier doit être une image (JPG, PNG, WebP).' }));
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrors(p => ({ ...p, fichier: `L'image ne doit pas dépasser ${MAX_MB} Mo.` }));
      return;
    }

    setErrors(p => ({ ...p, fichier: '' }));
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Simuler un input change
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      handleFileChange({ target: { files: [file] } });
    }
  };

  // ─── Validation ─────────────────────────────────────────
  const valider = () => {
    const errs = {};
    if (!form.titre.trim()) errs.titre   = 'Le titre est requis.';
    if (!selectedFile)      errs.fichier = 'Veuillez sélectionner une image.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Upload + ajout en base ──────────────────────────────
  const ajouter = async () => {
    if (!valider()) return;
    setUploading(true);

    // 1. Uploader l'image vers Supabase Storage
    const { url, error: uploadErr } = await uploadImage(selectedFile);
    if (uploadErr || !url) {
      toast.error('Erreur lors de l\'upload. Vérifiez que le bucket "galerie" est public.');
      setUploading(false);
      return;
    }

    // 2. Enregistrer en base
    const { error: dbErr } = await ajouterPhoto({ ...form, image: url });
    if (dbErr) {
      toast.error('Image uploadée mais erreur lors de l\'enregistrement.');
      setUploading(false);
      return;
    }

    toast.success('Photo ajoutée à la galerie.');
    fermerModal();
    setUploading(false);
  };

  // ─── Suppression (Storage + BDD) ────────────────────────
  const supprimer = async (id) => {
    const photo = galerie.find(p => p.id === id);

    // Supprimer du Storage si c'est une image uploadée
    if (photo?.image) await deleteImage(photo.image);

    const { error } = await supprimerPhoto(id);
    setConfirmDelete(null);
    if (!error) toast.success('Photo supprimée.');
    else toast.error('Erreur lors de la suppression.');
  };

  const fermerModal = () => {
    setModalOpen(false);
    setForm(FORM_INIT);
    setErrors({});
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const update = (f, v) => {
    setForm(p => ({ ...p, [f]: v }));
    setErrors(p => ({ ...p, [f]: '' }));
  };

  return (
    <div className="galerie-admin">
      <div className="admin-page-header">
        <div>
          <h1>Galerie</h1>
          <p>{galerie.length} photo{galerie.length > 1 ? 's' : ''}</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setForm(FORM_INIT); setErrors({}); setModalOpen(true); }}
        >
          <Plus size={16} /> Ajouter une photo
        </button>
      </div>

      {/* Filtres */}
      <div className="admin-filters card" style={{ marginBottom: 20 }}>
        <div className="admin-filters__tabs">
          {[{ id: 'toutes', label: 'Toutes' }, ...CATS].map(c => (
            <button
              key={c.id}
              className={`filter-tab ${filtreActive === c.id ? 'filter-tab--active' : ''}`}
              onClick={() => setFiltreActive(c.id)}
            >
              {c.label}
              <span className="filter-tab__count">
                {c.id === 'toutes' ? galerie.length : galerie.filter(p => p.categorie === c.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grille */}
      {photosFiltrees.length === 0 ? (
        <div className="admin-empty card">
          <ImageOff size={40} />
          <p>Aucune photo dans cette catégorie.</p>
        </div>
      ) : (
        <div className="galerie-admin__grid">
          {photosFiltrees.map(photo => (
            <div key={photo.id} className="ga-card card">
              <div className="ga-card__img-wrap">
                <img src={photo.image} alt={photo.titre} loading="lazy" />
                <button
                  className="ga-card__delete"
                  onClick={() => setConfirmDelete(photo.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="ga-card__body">
                <span className="ga-card__cat">{photo.categorie}</span>
                <p className="ga-card__titre">{photo.titre}</p>
                <small className="ga-card__date">{photo.date}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ajout ── */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={fermerModal}>
          <div className="admin-modal card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Ajouter une photo</h2>
              <button className="admin-modal__close" onClick={fermerModal}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal__body">
              {/* Zone de drop / sélection */}
              <div
                className={`ga-upload-zone ${previewUrl ? 'ga-upload-zone--has-preview' : ''} ${errors.fichier ? 'ga-upload-zone--error' : ''}`}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label="Sélectionner une image"
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Prévisualisation" className="ga-upload-zone__preview" />
                    <div className="ga-upload-zone__overlay">
                      <Upload size={20} />
                      <span>Changer l'image</span>
                    </div>
                  </>
                ) : (
                  <div className="ga-upload-zone__placeholder">
                    <Image size={36} />
                    <strong>Cliquez ou glissez une image ici</strong>
                    <span>JPG, PNG, WebP — max {MAX_MB} Mo</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                onChange={handleFileChange}
              />
              {errors.fichier && <p className="form-error" style={{ marginTop: 4 }}>{errors.fichier}</p>}
              {selectedFile && !errors.fichier && (
                <p className="ga-file-info">
                  {selectedFile.name} — {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
                </p>
              )}

              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Titre *</label>
                <input
                  type="text"
                  placeholder="Ex: Tresses collées élégantes"
                  value={form.titre}
                  onChange={e => update('titre', e.target.value)}
                />
                {errors.titre && <p className="form-error">{errors.titre}</p>}
              </div>

              <div className="form-group">
                <label>Catégorie</label>
                <select value={form.categorie} onChange={e => update('categorie', e.target.value)}>
                  {CATS.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-modal__footer">
              <button className="btn btn-outline" onClick={fermerModal} disabled={uploading}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={ajouter} disabled={uploading}>
                {uploading ? (
                  <><span className="ga-spinner" /> Upload en cours…</>
                ) : (
                  <><Upload size={15} /> Ajouter à la galerie</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression ── */}
      {confirmDelete !== null && (
        <div className="admin-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="admin-modal admin-modal--sm card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>Supprimer cette photo ?</h3>
            <p style={{ color: 'var(--gris-moyen)', marginBottom: 24 }}>
              L'image sera supprimée définitivement du stockage.
            </p>
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
