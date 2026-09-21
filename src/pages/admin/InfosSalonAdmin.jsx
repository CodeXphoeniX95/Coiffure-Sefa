import { useState, useEffect, useRef } from 'react';
import {
  Save, Store, Phone, Mail, MapPin, MessageCircle,
  Clock, Globe, AlignLeft, Upload, Image
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { uploadImage, deleteImage } from '../../lib/api';
import './InfosSalonAdmin.css';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_MB  = 5;
const BUCKET  = 'salon'; // bucket Supabase Storage pour les images du salon

export default function InfosSalonAdmin() {
  const { salonInfos, mettreAJourSalonInfos } = useApp();
  const toast = useToast();

  const [form, setForm] = useState({
    nom: '', slogan: '', telephone: '', whatsapp: '',
    email: '', adresse: '', description: '', horaires: '',
    facebook: '', instagram: '', hero_image: '', logo: '',
  });
  const [saving,        setSaving]        = useState(false);
  const [heroFile,      setHeroFile]      = useState(null);
  const [heroPreview,   setHeroPreview]   = useState(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [logoFile,      setLogoFile]      = useState(null);
  const [logoPreview,   setLogoPreview]   = useState(null);
  const fileInputRef    = useRef(null);
  const logoInputRef    = useRef(null);

  useEffect(() => {
    if (salonInfos) {
      setForm({
        nom:         salonInfos.nom         || '',
        slogan:      salonInfos.slogan      || '',
        telephone:   salonInfos.telephone   || '',
        whatsapp:    salonInfos.whatsapp    || '',
        email:       salonInfos.email       || '',
        adresse:     salonInfos.adresse     || '',
        description: salonInfos.description || '',
        horaires:    salonInfos.horaires    || '',
        facebook:    salonInfos.facebook    || '',
        instagram:   salonInfos.instagram   || '',
        hero_image:  salonInfos.hero_image  || '',
        logo:        salonInfos.logo        || '',
      });
      if (salonInfos.hero_image) setHeroPreview(salonInfos.hero_image);
      if (salonInfos.logo)       setLogoPreview(salonInfos.logo);
    }
  }, [salonInfos]);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  // ─── Logo ────────────────────────────────────────────────
  const handleLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Image requise.'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { toast.error(`Max ${MAX_MB} Mo.`); return; }
    setLogoFile(file);
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
  };

  // ─── Hero image ──────────────────────────────────────────
  const handleHeroFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Image requise.'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { toast.error(`Max ${MAX_MB} Mo.`); return; }
    setHeroFile(file);
    if (heroPreview?.startsWith('blob:')) URL.revokeObjectURL(heroPreview);
    setHeroPreview(URL.createObjectURL(file));
  };

  const sauvegarder = async () => {
    if (!form.nom.trim() || !form.telephone.trim()) {
      toast.error('Le nom et le téléphone sont requis.');
      return;
    }
    setSaving(true);

    let heroUrl = form.hero_image;
    let logoUrl = form.logo;

    if (logoFile) {
      let { url, error: upErr } = await uploadImage(logoFile, BUCKET);
      if (upErr) ({ url, error: upErr } = await uploadImage(logoFile, 'galerie'));
      if (!upErr && url) {
        if (form.logo) await deleteImage(form.logo, 'galerie');
        logoUrl = url;
      }
    }

    if (heroFile) {
      setHeroUploading(true);
      // Utiliser le bucket 'galerie' si 'salon' n'existe pas encore
      let { url, error: upErr } = await uploadImage(heroFile, BUCKET);
      if (upErr) {
        // Fallback sur le bucket galerie
        ({ url, error: upErr } = await uploadImage(heroFile, 'galerie'));
      }
      setHeroUploading(false);
      if (upErr || !url) {
        toast.error('Erreur upload image. Vérifiez que le bucket "galerie" est public dans Supabase Storage.');
        setSaving(false);
        return;
      }
      if (form.hero_image) await deleteImage(form.hero_image, 'galerie');
      heroUrl = url;
    }

    const { error } = await mettreAJourSalonInfos({ ...form, hero_image: heroUrl, logo: logoUrl });
    setSaving(false);
    if (!error) toast.success('Informations du salon mises à jour.');
    else toast.error('Erreur lors de la sauvegarde.');
  };

  return (
    <div className="infos-salon-admin">
      <div className="admin-page-header">
        <div>
          <h1>Informations du salon</h1>
          <p>Ces informations apparaissent sur tout le site</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={sauvegarder} disabled={saving || heroUploading}>
          {saving ? <><span className="ga-spinner" /> Sauvegarde…</> : <><Save size={15} /> Enregistrer</>}
        </button>
      </div>

      <div className="infos-salon-admin__grid">

        {/* ── Logo du salon ── */}
        <section className="card isa-section">
          <div className="isa-section__header">
            <Image size={18} />
            <h2>Logo du salon</h2>
          </div>
          <div className="isa-logo-wrap">
            <div
              className="isa-logo-zone"
              onClick={() => logoInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && logoInputRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="isa-logo-preview" />
              ) : (
                <div className="isa-logo-placeholder">
                  <Upload size={24} />
                  <span>Uploader le logo</span>
                </div>
              )}
            </div>
            <input ref={logoInputRef} type="file" accept={ACCEPT} className="sr-only" onChange={handleLogoFile} />
            <div className="isa-logo-info">
              <p>Format carré recommandé (ex: 200×200 px)</p>
              <p>JPG, PNG, WebP — max {MAX_MB} Mo</p>
              <p style={{ marginTop: 6, color: 'var(--gris-moyen)', fontSize:'0.78rem' }}>
                Affiché dans la barre de navigation et le footer du site.
              </p>
            </div>
          </div>
        </section>

        {/* ── Image Hero ── */}
        <section className="card isa-section isa-section--full">
          <div className="isa-section__header">
            <Image size={18} />
            <h2>Image principale (page d'accueil)</h2>
          </div>
          <div
            className={`ga-upload-zone ${heroPreview ? 'ga-upload-zone--has-preview' : ''}`}
            style={{ minHeight: 200 }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleHeroFile({ target: { files: e.dataTransfer.files } }); }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            {heroPreview ? (
              <>
                <img src={heroPreview} alt="Hero" className="ga-upload-zone__preview" style={{ maxHeight: 220, objectPosition: 'center top' }} />
                <div className="ga-upload-zone__overlay"><Upload size={20} /><span>Changer l'image</span></div>
              </>
            ) : (
              <div className="ga-upload-zone__placeholder">
                <Image size={36} />
                <strong>Photo principale du salon</strong>
                <span>Affichée sur la page d'accueil · JPG, PNG, WebP — max {MAX_MB} Mo</span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept={ACCEPT} className="sr-only" onChange={handleHeroFile} />
        </section>

        {/* ── Identité ── */}
        <section className="card isa-section">
          <div className="isa-section__header">
            <Store size={18} />
            <h2>Identité du salon</h2>
          </div>
          <div className="form-group">
            <label>Nom du salon *</label>
            <input type="text" placeholder="Coiffure et Tresse Mon'Trésor"
              value={form.nom} onChange={e => update('nom', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Slogan</label>
            <input type="text" placeholder="L'art de sublimer votre beauté naturelle"
              value={form.slogan} onChange={e => update('slogan', e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label><AlignLeft size={13} /> Description</label>
            <textarea rows={4} placeholder="Présentez votre salon en quelques phrases…"
              value={form.description} onChange={e => update('description', e.target.value)} />
          </div>
        </section>

        {/* ── Contact ── */}
        <section className="card isa-section">
          <div className="isa-section__header">
            <Phone size={18} />
            <h2>Coordonnées</h2>
          </div>
          <div className="form-group">
            <label><Phone size={13} /> Téléphone *</label>
            <input type="tel" placeholder="+228 90 00 00 00"
              value={form.telephone} onChange={e => update('telephone', e.target.value)} />
          </div>
          <div className="form-group">
            <label><MessageCircle size={13} /> WhatsApp (sans + ni espaces)</label>
            <div className="isa-input-prefix">
              <span>+</span>
              <input type="text" placeholder="22890000000"
                value={form.whatsapp}
                onChange={e => update('whatsapp', e.target.value.replace(/\D/g, ''))} />
            </div>
            <small>Format : 22890000000</small>
          </div>
          <div className="form-group">
            <label><Mail size={13} /> Email</label>
            <input type="email" placeholder="contact@montresor-togo.com"
              value={form.email} onChange={e => update('email', e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label><MapPin size={13} /> Adresse</label>
            <input type="text" placeholder="Quartier Bè, Lomé, Togo"
              value={form.adresse} onChange={e => update('adresse', e.target.value)} />
          </div>
        </section>

        {/* ── Horaires ── */}
        <section className="card isa-section">
          <div className="isa-section__header">
            <Clock size={18} />
            <h2>Horaires affichés</h2>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Texte des horaires</label>
            <input type="text" placeholder="Lun - Ven : 8h - 18h | Sam : 9h - 17h"
              value={form.horaires} onChange={e => update('horaires', e.target.value)} />
            <small>Pour les créneaux de réservation, voir <strong>Disponibilités</strong>.</small>
          </div>
        </section>

        {/* ── Réseaux sociaux ── */}
        <section className="card isa-section">
          <div className="isa-section__header">
            <Globe size={18} />
            <h2>Réseaux sociaux</h2>
          </div>
          <div className="form-group">
            <label>Facebook (URL complète)</label>
            <div className="isa-input-prefix">
              <span>fb</span>
              <input type="url" placeholder="https://facebook.com/montresor"
                value={form.facebook} onChange={e => update('facebook', e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle',marginRight:4}} aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              Instagram (URL complète)
            </label>
            <div className="isa-input-prefix">
              <span>ig</span>
              <input type="url" placeholder="https://instagram.com/montresor"
                value={form.instagram} onChange={e => update('instagram', e.target.value)} />
            </div>
          </div>
        </section>

      </div>

      {/* Aperçu */}
      <div className="card isa-preview">
        <h3>Aperçu — barre d'adresse</h3>
        <div className="isa-preview__bar">
          <MapPin size={15} color="var(--violet)" />
          <span>
            <strong>{form.nom || '—'}</strong>
            {form.adresse ? ` — ${form.adresse}` : ''}
            {form.horaires ? ` | ${form.horaires}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
