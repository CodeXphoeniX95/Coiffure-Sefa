-- ═══════════════════════════════════════════════════════════
-- SCHÉMA SUPABASE — Coiffure et Tresse Mon'Trésor
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── TABLE : services ────────────────────────────────────────
create table if not exists public.services (
  id          uuid primary key default uuid_generate_v4(),
  nom         text    not null,
  description text    not null,
  prix        integer not null check (prix > 0),
  duree       integer not null check (duree > 0),   -- en minutes
  categorie   text    not null check (categorie in ('tresses','coiffures','soins')),
  actif       boolean not null default true,
  image       text,
  created_at  timestamptz not null default now()
);

-- ─── TABLE : disponibilites ──────────────────────────────────
create table if not exists public.disponibilites (
  id          uuid primary key default uuid_generate_v4(),
  jour        text    not null,
  jour_index  integer not null check (jour_index between 0 and 6),
  heure_debut text    not null,
  heure_fin   text    not null,
  actif       boolean not null default true
);

-- ─── TABLE : rendez_vous ─────────────────────────────────────
create table if not exists public.rendez_vous (
  id               uuid primary key default uuid_generate_v4(),
  nom              text    not null,
  telephone        text    not null,
  email            text,
  service_id       uuid    references public.services(id) on delete set null,
  service_nom      text    not null,
  date_rdv         date    not null,
  heure            text    not null,
  note             text,
  montant          integer not null,
  statut           text    not null default 'en_attente'
                     check (statut in ('en_attente','confirme','annule','termine')),
  paiement         text    not null default ''
                     check (paiement in ('','flooz','tmoney','cash','manuel')),
  paiement_statut  text    not null default 'en_attente'
                     check (paiement_statut in ('en_attente','en_verification','paye','rembourse')),
  ref_transaction  text    not null default '',
  created_at       timestamptz not null default now()
);

-- ─── TABLE : galerie ─────────────────────────────────────────
create table if not exists public.galerie (
  id         uuid primary key default uuid_generate_v4(),
  titre      text not null,
  categorie  text not null,
  image      text not null,
  date_photo date not null default current_date,
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════

-- Activer RLS sur toutes les tables
alter table public.services       enable row level security;
alter table public.disponibilites enable row level security;
alter table public.rendez_vous    enable row level security;
alter table public.galerie        enable row level security;

-- ── services : lecture publique, écriture admin seulement ──
create policy "services_public_read"
  on public.services for select
  using (true);

create policy "services_admin_write"
  on public.services for all
  using (auth.role() = 'authenticated');

-- ── disponibilites : lecture publique, écriture admin ──────
create policy "dispos_public_read"
  on public.disponibilites for select
  using (true);

create policy "dispos_admin_write"
  on public.disponibilites for all
  using (auth.role() = 'authenticated');

-- ── rendez_vous : insert public, lecture/modif admin ───────
create policy "rdv_public_insert"
  on public.rendez_vous for insert
  with check (true);

create policy "rdv_admin_all"
  on public.rendez_vous for all
  using (auth.role() = 'authenticated');

-- ── galerie : lecture publique, écriture admin ─────────────
create policy "galerie_public_read"
  on public.galerie for select
  using (true);

create policy "galerie_admin_write"
  on public.galerie for all
  using (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════
-- DONNÉES INITIALES
-- ═══════════════════════════════════════════════════════════

-- Services
insert into public.services (nom, description, prix, duree, categorie, actif, image) values
  ('Tresses Simples',        'Tresses classiques soignées, adaptées à tous types de cheveux.',                    3000,  120, 'tresses',   true, 'https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=400&q=80'),
  ('Tresses Collées',        'Tresses plates collées au cuir chevelu, style moderne et élégant.',                 5000,  180, 'tresses',   true, 'https://images.unsplash.com/photo-1614886137799-e3d9a1d43d34?w=400&q=80'),
  ('Tresses avec Extensions','Ajout d extensions pour un volume et une longueur exceptionnels.',                  8000,  240, 'tresses',   true, 'https://images.unsplash.com/photo-1626954079979-ec4ce8af6e3b?w=400&q=80'),
  ('Coiffure Mariage',       'Coiffure spéciale cérémonie, chignon, updo ou coiffure libre selon vos envies.',   15000, 180, 'coiffures', true, 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&q=80'),
  ('Lissage Kératine',       'Lissage professionnel longue durée pour des cheveux soyeux et brillants.',          20000, 240, 'soins',     true, 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&q=80'),
  ('Soin Capillaire',        'Masque nourrissant et hydratant pour revitaliser vos cheveux abîmés.',              5000,   60, 'soins',     true, 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&q=80'),
  ('Mèches / Balayage',      'Mise en valeur de votre chevelure avec des mèches naturelles ou colorées.',        12000, 150, 'coiffures', true, 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=400&q=80'),
  ('Coupe & Brushing',       'Coupe personnalisée suivie d un brushing professionnel.',                           4000,   90, 'coiffures', true, 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80'),
  ('Dreadlocks',             'Pose et entretien de dreadlocks naturelles ou artificielles.',                     10000, 300, 'tresses',   true, 'https://images.unsplash.com/photo-1590333748338-d629e4564ad9?w=400&q=80');

-- Disponibilités
insert into public.disponibilites (jour, jour_index, heure_debut, heure_fin, actif) values
  ('Lundi',    1, '08:00', '18:00', true),
  ('Mardi',    2, '08:00', '18:00', true),
  ('Mercredi', 3, '08:00', '18:00', true),
  ('Jeudi',    4, '08:00', '18:00', true),
  ('Vendredi', 5, '08:00', '18:00', true),
  ('Samedi',   6, '09:00', '17:00', true),
  ('Dimanche', 0, '10:00', '14:00', false);

-- Quelques photos galerie
insert into public.galerie (titre, categorie, image, date_photo) values
  ('Tresses collées élégantes',      'tresses',    'https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=500&q=80', '2024-12-01'),
  ('Coiffure de mariée',             'mariage',    'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=500&q=80', '2024-11-28'),
  ('Tresses avec extensions longues','tresses',    'https://images.unsplash.com/photo-1626954079979-ec4ce8af6e3b?w=500&q=80', '2024-11-20'),
  ('Soin capillaire profond',        'soins',      'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&q=80', '2024-11-15'),
  ('Tresses collées africaines',     'tresses',    'https://images.unsplash.com/photo-1614886137799-e3d9a1d43d34?w=500&q=80', '2024-11-10'),
  ('Box braids longues',             'tresses',    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&q=80', '2024-10-25'),
  ('Nattes simples',                 'tresses',    'https://images.unsplash.com/photo-1590333748338-d629e4564ad9?w=500&q=80', '2024-10-20'),
  ('Chignon élaboré mariage',        'mariage',    'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=500&q=80', '2024-10-15');

-- ═══════════════════════════════════════════════════════════
-- STORAGE — Bucket pour les images de la galerie
-- ═══════════════════════════════════════════════════════════

-- Créer le bucket public "galerie"
insert into storage.buckets (id, name, public)
values ('galerie', 'galerie', true)
on conflict (id) do nothing;

-- Permettre aux admins (authentifiés) d'uploader
create policy "galerie_admin_upload"
  on storage.objects for insert
  with check (bucket_id = 'galerie' AND auth.role() = 'authenticated');

-- Permettre aux admins de supprimer leurs fichiers
create policy "galerie_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'galerie' AND auth.role() = 'authenticated');

-- Permettre à tout le monde de lire les images (bucket public)
create policy "galerie_public_read"
  on storage.objects for select
  using (bucket_id = 'galerie');

-- ═══════════════════════════════════════════════════════════
-- TABLE : salon_infos (ligne unique — id = 1)
-- ═══════════════════════════════════════════════════════════

create table if not exists public.salon_infos (
  id          integer primary key default 1,
  nom         text not null default 'Coiffure et Tresse Mon''Trésor',
  slogan      text not null default 'L''art de sublimer votre beauté naturelle',
  telephone   text not null default '+228 90 00 00 00',
  whatsapp    text not null default '22890000000',
  email       text not null default 'contact@montresor-togo.com',
  adresse     text not null default 'Quartier Bè, Lomé, Togo',
  description text not null default 'Bienvenue chez Mon''Trésor, le salon de coiffure et tresses de référence à Lomé.',
  horaires    text not null default 'Lun - Ven : 8h - 18h | Sam : 9h - 17h',
  facebook    text not null default 'https://facebook.com',
  instagram   text not null default 'https://instagram.com',
  constraint  salon_infos_single_row check (id = 1)
);

-- RLS
alter table public.salon_infos enable row level security;

create policy "salon_infos_public_read"
  on public.salon_infos for select using (true);

create policy "salon_infos_admin_write"
  on public.salon_infos for all using (auth.role() = 'authenticated');

-- Données initiales
insert into public.salon_infos (id) values (1)
on conflict (id) do nothing;

-- ═══════════════════════════════════════════════════════════
-- ESPACE CLIENT — profiles + lien rendez_vous → user
-- ═══════════════════════════════════════════════════════════

-- Table profiles (créée automatiquement à l'inscription)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nom         text not null default '',
  telephone   text not null default '',
  created_at  timestamptz not null default now()
);

-- Trigger : créer un profil vide à chaque nouvel utilisateur Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nom, telephone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom', ''),
    coalesce(new.raw_user_meta_data->>'telephone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Ajouter colonne client_id dans rendez_vous (nullable pour les anciens)
alter table public.rendez_vous
  add column if not exists client_id uuid references auth.users(id) on delete set null;

-- RLS profiles
alter table public.profiles enable row level security;

create policy "profiles_own_read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_own_update"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_admin_read"
  on public.profiles for select
  using (auth.role() = 'authenticated' and exists (
    select 1 from auth.users where id = auth.uid()
    -- L'admin peut tout lire (à affiner selon rôles si besoin)
  ));

-- RLS rendez_vous — un client ne voit que SES RDV
-- (la policy admin existante "rdv_admin_all" couvre déjà les admins)
create policy "rdv_client_own"
  on public.rendez_vous for select
  using (client_id = auth.uid());

create policy "rdv_client_annuler"
  on public.rendez_vous for update
  using (client_id = auth.uid())
  with check (statut = 'annule');

-- ═══════════════════════════════════════════════════════════
-- REALTIME — Activer les publications temps réel
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Activer Realtime sur les tables nécessaires (ignorer si déjà membre)
do $$
begin
  begin
    alter publication supabase_realtime add table public.rendez_vous;
  exception when sqlstate '42710' then null;
  end;
  begin
    alter publication supabase_realtime add table public.galerie;
  exception when sqlstate '42710' then null;
  end;
  begin
    alter publication supabase_realtime add table public.services;
  exception when sqlstate '42710' then null;
  end;
  begin
    alter publication supabase_realtime add table public.salon_infos;
  exception when sqlstate '42710' then null;
  end;
end $$;

-- ═══════════════════════════════════════════════════════════
-- Ajouter colonne hero_image dans salon_infos
-- ═══════════════════════════════════════════════════════════
alter table public.salon_infos
  add column if not exists hero_image text not null default '';

-- Bucket "services" pour les images des services
insert into storage.buckets (id, name, public)
values ('services', 'services', true)
on conflict (id) do nothing;

create policy "services_admin_upload"
  on storage.objects for insert
  with check (bucket_id = 'services' AND auth.role() = 'authenticated');

create policy "services_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'services' AND auth.role() = 'authenticated');

create policy "services_public_read_storage"
  on storage.objects for select
  using (bucket_id = 'services');

-- Bucket "salon" pour l'image hero et autres images du salon
insert into storage.buckets (id, name, public)
values ('salon', 'salon', true)
on conflict (id) do nothing;

create policy "salon_admin_upload"
  on storage.objects for insert
  with check (bucket_id = 'salon' AND auth.role() = 'authenticated');

create policy "salon_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'salon' AND auth.role() = 'authenticated');

create policy "salon_public_read_storage"
  on storage.objects for select
  using (bucket_id = 'salon');

-- Colonne logo dans salon_infos
alter table public.salon_infos
  add column if not exists logo text not null default '';

-- ═══════════════════════════════════════════════════════════
-- TABLE : messages (formulaire de contact)
-- ═══════════════════════════════════════════════════════════

create table if not exists public.messages (
  id          uuid primary key default uuid_generate_v4(),
  nom         text not null,
  telephone   text not null,
  email       text,
  sujet       text,
  message     text not null,
  lu          boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;

-- N'importe qui peut envoyer un message (insert public)
create policy "messages_public_insert"
  on public.messages for insert
  with check (true);

-- Seul l'admin peut lire et modifier (marquer comme lu)
create policy "messages_admin_read"
  on public.messages for select
  using (auth.role() = 'authenticated');

create policy "messages_admin_update"
  on public.messages for update
  using (auth.role() = 'authenticated');

create policy "messages_admin_delete"
  on public.messages for delete
  using (auth.role() = 'authenticated');

-- Realtime pour les messages
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when sqlstate '42710' then null;
  end;
end $$;
