import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getServices, createService, updateService, deleteService,
  getRendezVous, createRendezVous, updateStatutRdv, updatePaiementRdv,
  isCreneauDispo as apiIsCreneauDispo,
  getGalerie, createPhoto, deletePhoto,
  getDisponibilites, updateDisponibilite,
  getSalonInfos, updateSalonInfos as apiUpdateSalonInfos,
} from '../lib/api';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

// Convertit une ligne Supabase (snake_case) en objet frontend (camelCase)
const mapRdv = (r) => ({
  id:              r.id,
  nom:             r.nom,
  telephone:       r.telephone,
  email:           r.email || '',
  service:         r.service_nom,
  serviceId:       r.service_id,
  date:            r.date_rdv,
  heure:           r.heure,
  note:            r.note || '',
  montant:         r.montant,
  statut:          r.statut,
  paiement:        r.paiement,
  paiementStatut:  r.paiement_statut,
  refTransaction:  r.ref_transaction,
  createdAt:       r.created_at,
});

const mapDispo = (d) => ({
  id:         d.id,
  jour:       d.jour,
  jourIndex:  d.jour_index,
  heureDebut: d.heure_debut,
  heureFin:   d.heure_fin,
  actif:      d.actif,
});

const mapGalerie = (p) => ({
  id:        p.id,
  titre:     p.titre,
  categorie: p.categorie,
  image:     p.image,
  date:      p.date_photo,
});

export function AppProvider({ children }) {
  const [services,        setServices]        = useState([]);
  const [galerie,         setGalerie]         = useState([]);
  const [rendezVous,      setRendezVous]      = useState([]);
  const [disponibilites,  setDisponibilites]  = useState([]);
  const [salonInfos,      setSalonInfos]      = useState(null);
  const [reservationEnCours, setReservationEnCours] = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  // ─── Chargement initial ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [sRes, rRes, gRes, dRes, siRes] = await Promise.all([
        getServices(),
        getRendezVous(),
        getGalerie(),
        getDisponibilites(),
        getSalonInfos(),
      ]);

      if (sRes.error || rRes.error || gRes.error || dRes.error) {
        setError('Erreur de chargement des données.');
      } else {
        setServices(sRes.data || []);
        setRendezVous((rRes.data || []).map(mapRdv));
        setGalerie((gRes.data || []).map(mapGalerie));
        setDisponibilites((dRes.data || []).map(mapDispo));
        // salonInfos : utiliser les données Supabase ou null si erreur (les composants ont leur propre fallback mockData)
        setSalonInfos(siRes.data || null);
      }
      setLoading(false);
    };
    load();
  }, []);

  // ─── Temps réel (Supabase Realtime) ──────────────────────
  useEffect(() => {
    // Écouter les changements sur rendez_vous
    const rdvChannel = supabase
      .channel('realtime:rendez_vous')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'rendez_vous' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRendezVous(prev => {
              if (prev.some(r => r.id === payload.new.id)) return prev;
              return [mapRdv(payload.new), ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setRendezVous(prev => prev.map(r =>
              r.id === payload.new.id ? mapRdv(payload.new) : r
            ));
          } else if (payload.eventType === 'DELETE') {
            setRendezVous(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Écouter les changements sur galerie
    const galerieChannel = supabase
      .channel('realtime:galerie')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'galerie' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Éviter le doublon : l'item est peut-être déjà ajouté localement
            setGalerie(prev => {
              if (prev.some(p => p.id === payload.new.id)) return prev;
              return [mapGalerie(payload.new), ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            setGalerie(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Écouter les changements sur services
    const servicesChannel = supabase
      .channel('realtime:services')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setServices(prev => {
              if (prev.some(s => s.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'UPDATE') {
            setServices(prev => prev.map(s =>
              s.id === payload.new.id ? { ...s, ...payload.new } : s
            ));
          } else if (payload.eventType === 'DELETE') {
            setServices(prev => prev.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Écouter les changements sur salon_infos
    const salonChannel = supabase
      .channel('realtime:salon_infos')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'salon_infos' },
        (payload) => { setSalonInfos(payload.new); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rdvChannel);
      supabase.removeChannel(galerieChannel);
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(salonChannel);
    };
  }, []);

  // ═══════════════════════════════════════════════════════
  // SERVICES
  // ═══════════════════════════════════════════════════════
  const ajouterService = useCallback(async (data) => {
    const { data: created, error } = await createService(data);
    if (!error && created) setServices(prev => [...prev, created]);
    return { data: created, error };
  }, []);

  const modifierService = useCallback(async (id, data) => {
    const { data: updated, error } = await updateService(id, data);
    if (!error && updated)
      setServices(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    return { data: updated, error };
  }, []);

  const supprimerService = useCallback(async (id) => {
    const { error } = await deleteService(id);
    if (!error) setServices(prev => prev.filter(s => s.id !== id));
    return { error };
  }, []);

  // ═══════════════════════════════════════════════════════
  // RENDEZ-VOUS
  // ═══════════════════════════════════════════════════════
  const ajouterRdv = useCallback(async (data) => {
    let clientId = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) clientId = user.id;
    } catch { /* pas connecté */ }

    const rdvData = { ...data, clientId };
    const { data: created, error } = await createRendezVous(rdvData);

    if (error) return { data: null, error };

    // created peut être null si la RLS bloque le SELECT après insert
    // On construit un objet minimal pour continuer le flow
    const rdv = created
      ? mapRdv(created)
      : {
          id:              crypto.randomUUID?.() || String(Date.now()),
          nom:             data.nom,
          telephone:       data.telephone,
          email:           data.email || '',
          service:         data.service,
          serviceId:       data.serviceId,
          date:            data.date,
          heure:           data.heure,
          note:            data.note || '',
          montant:         data.montant,
          statut:          'en_attente',
          paiement:        '',
          paiementStatut:  'en_attente',
          refTransaction:  '',
          createdAt:       new Date().toISOString(),
        };

    if (created) setRendezVous(prev => [rdv, ...prev]);
    return { data: rdv, error: null };
  }, []);

  const mettreAJourStatutRdv = useCallback(async (id, statut) => {
    const { data: updated, error } = await updateStatutRdv(id, statut);
    if (!error && updated)
      setRendezVous(prev => prev.map(r => r.id === id ? { ...r, statut } : r));
    return { error };
  }, []);

  const mettreAJourPaiement = useCallback(async (id, data) => {
    const { data: updated, error } = await updatePaiementRdv(id, data);
    if (!error && updated)
      setRendezVous(prev => prev.map(r =>
        r.id === id
          ? { ...r, paiement: data.paiement, paiementStatut: data.paiementStatut, refTransaction: data.refTransaction || '' }
          : r
      ));
    return { error };
  }, []);

  const checkCreneauDispo = useCallback(async (date, heure) => {
    return apiIsCreneauDispo(date, heure);
  }, []);

  // ═══════════════════════════════════════════════════════
  // GALERIE
  // ═══════════════════════════════════════════════════════
  const ajouterPhoto = useCallback(async (data) => {
    const { data: created, error } = await createPhoto(data);
    if (!error && created) setGalerie(prev => [mapGalerie(created), ...prev]);
    return { error };
  }, []);

  const supprimerPhoto = useCallback(async (id) => {
    const { error } = await deletePhoto(id);
    if (!error) setGalerie(prev => prev.filter(p => p.id !== id));
    return { error };
  }, []);

  // ═══════════════════════════════════════════════════════
  // SALON INFOS
  // ═══════════════════════════════════════════════════════
  const mettreAJourSalonInfos = useCallback(async (data) => {
    const { data: updated, error } = await apiUpdateSalonInfos(data);
    if (!error && updated) {
      setSalonInfos(updated);
    }
    return { error };
  }, []);

  // ═══════════════════════════════════════════════════════
  // DISPONIBILITÉS
  // ═══════════════════════════════════════════════════════
  const mettreAJourDispo = useCallback(async (id, data) => {
    const { data: updated, error } = await updateDisponibilite(id, data);
    if (!error && updated)
      setDisponibilites(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    return { error };
  }, []);

  const value = {
    // État
    loading,
    error,
    // Services
    services,
    ajouterService,
    modifierService,
    supprimerService,
    // Rendez-vous
    rendezVous,
    ajouterRdv,
    mettreAJourStatutRdv,
    mettreAJourPaiement,
    isCreneauDispo: checkCreneauDispo,
    // Galerie
    galerie,
    ajouterPhoto,
    supprimerPhoto,
    // Disponibilités
    disponibilites,
    mettreAJourDispo,
    // Salon infos
    salonInfos,
    mettreAJourSalonInfos,
    // Réservation en cours (flow client)
    reservationEnCours,
    setReservationEnCours,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé dans AppProvider');
  return ctx;
}
