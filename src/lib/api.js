/**
 * api.js — toutes les fonctions CRUD qui appellent Supabase
 * Chaque fonction retourne { data, error }
 */
import { supabase } from './supabase';

// ─── Helper ──────────────────────────────────────────────────
const handle = (result) => {
  if (result.error) console.error('[Supabase]', result.error.message);
  return result;
};

// ═══════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════

export const getServices = () =>
  handle(supabase.from('services').select('*').order('created_at'));

export const getServicesActifs = () =>
  handle(supabase.from('services').select('*').eq('actif', true).order('created_at'));

export const createService = (data) =>
  handle(supabase.from('services').insert([data]).select().single());

export const updateService = (id, data) =>
  handle(supabase.from('services').update(data).eq('id', id).select().single());

export const deleteService = (id) =>
  handle(supabase.from('services').delete().eq('id', id));

// ═══════════════════════════════════════════════════════════
// RENDEZ-VOUS
// ═══════════════════════════════════════════════════════════

export const getRendezVous = () =>
  handle(
    supabase
      .from('rendez_vous')
      .select('*')
      .order('created_at', { ascending: false })
  );

export const getRendezVousById = (id) =>
  handle(supabase.from('rendez_vous').select('*').eq('id', id).single());

export const createRendezVous = async (data) => {
  // Insert sans .select() pour éviter les problèmes de RLS SELECT
  const { data: inserted, error } = await supabase
    .from('rendez_vous')
    .insert([{
      nom:             data.nom,
      telephone:       data.telephone,
      email:           data.email || null,
      service_id:      data.serviceId || null,
      service_nom:     data.service,
      date_rdv:        data.date,
      heure:           data.heure,
      note:            data.note || null,
      montant:         data.montant,
      statut:          'en_attente',
      paiement:        '',
      paiement_statut: 'en_attente',
      ref_transaction: '',
      client_id:       data.clientId || null,
    }])
    .select();

  if (error) {
    console.error('[Supabase]', error.message);
    return { data: null, error };
  }

  // Retourner le premier résultat (certaines policies bloquent .single())
  const row = inserted?.[0] || null;
  return { data: row, error: null };
};

export const updateStatutRdv = (id, statut) =>
  handle(supabase.from('rendez_vous').update({ statut }).eq('id', id).select().single());

export const updatePaiementRdv = (id, data) =>
  handle(
    supabase
      .from('rendez_vous')
      .update({
        paiement:        data.paiement,
        paiement_statut: data.paiementStatut,
        ref_transaction: data.refTransaction || '',
      })
      .eq('id', id)
      .select()
      .single()
  );

export const isCreneauDispo = async (date, heure) => {
  const { data } = await supabase
    .from('rendez_vous')
    .select('id')
    .eq('date_rdv', date)
    .eq('heure', heure)
    .neq('statut', 'annule');
  return !data || data.length === 0;
};

// ═══════════════════════════════════════════════════════════
// GALERIE
// ═══════════════════════════════════════════════════════════

export const getGalerie = () =>
  handle(supabase.from('galerie').select('*').order('date_photo', { ascending: false }));

export const createPhoto = (data) =>
  handle(
    supabase
      .from('galerie')
      .insert([{
        titre:      data.titre,
        categorie:  data.categorie,
        image:      data.image,
        date_photo: new Date().toISOString().split('T')[0],
      }])
      .select()
      .single()
  );

export const deletePhoto = (id) =>
  handle(supabase.from('galerie').delete().eq('id', id));

// ═══════════════════════════════════════════════════════════
// STORAGE — Upload vers Supabase Storage (bucket: "galerie")
// À créer dans : Supabase Dashboard > Storage > New bucket
//   Name: galerie | Public: true
// ═══════════════════════════════════════════════════════════

export const uploadImage = async (file, bucket = 'galerie') => {
  const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
  const fileName = `${Date.now()}_${safeName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) return { url: null, error };

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, error: null };
};

export const deleteImage = async (imageUrl, bucket = 'galerie') => {
  const marker = `/object/public/${bucket}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return { error: null };

  const fileName = imageUrl.slice(idx + marker.length);
  const { error } = await supabase.storage.from(bucket).remove([fileName]);
  return { error };
};

// ═══════════════════════════════════════════════════════════
// SALON INFOS (ligne unique id=1)
// ═══════════════════════════════════════════════════════════

export const getSalonInfos = () =>
  handle(supabase.from('salon_infos').select('*').eq('id', 1).single());

export const updateSalonInfos = (data) =>
  handle(
    supabase
      .from('salon_infos')
      .update(data)
      .eq('id', 1)
      .select()
      .single()
  );

// ═══════════════════════════════════════════════════════════
// DISPONIBILITÉS
// ═══════════════════════════════════════════════════════════

export const getDisponibilites = () =>
  handle(supabase.from('disponibilites').select('*').order('jour_index'));

export const updateDisponibilite = (id, data) =>
  handle(
    supabase
      .from('disponibilites')
      .update({
        heure_debut: data.heureDebut,
        heure_fin:   data.heureFin,
        actif:       data.actif,
      })
      .eq('id', id)
      .select()
      .single()
  );

// ═══════════════════════════════════════════════════════════
// MESSAGES DE CONTACT
// ═══════════════════════════════════════════════════════════

export const createMessage = (data) =>
  handle(
    supabase
      .from('messages')
      .insert([{
        nom:       data.nom,
        telephone: data.telephone,
        email:     data.email     || null,
        sujet:     data.sujet     || null,
        message:   data.message,
        lu:        false,
      }])
      .select()
      .single()
  );

export const getMessages = () =>
  handle(
    supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
  );

export const marquerMessageLu = (id) =>
  handle(
    supabase
      .from('messages')
      .update({ lu: true })
      .eq('id', id)
      .select()
      .single()
  );

export const supprimerMessage = (id) =>
  handle(supabase.from('messages').delete().eq('id', id));
