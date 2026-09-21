# Coiffure et Tresse Mon'Trésor

Application web de réservation en ligne pour salon de coiffure — Lomé, Togo.

Stack : **React + Vite** (frontend) · **Supabase** (PostgreSQL + Auth) · **Vercel** (déploiement)

---

## 1. Prérequis

- Node.js 18+
- Un compte [Supabase](https://supabase.com) (gratuit)
- Un compte [Vercel](https://vercel.com) (gratuit)

---

## 2. Setup Supabase

### 2.1 Créer le projet

1. Connectez-vous sur [app.supabase.com](https://app.supabase.com)
2. Cliquez **New Project** → choisissez un nom, un mot de passe fort, région **West EU**
3. Attendez la création (~1 min)

### 2.2 Exécuter le schéma SQL

1. Dans le dashboard Supabase → **SQL Editor** → **New query**
2. Copiez-collez le contenu de `supabase/schema.sql`
3. Cliquez **Run** — les tables et données initiales sont créées

### 2.3 Créer le compte admin

1. Supabase Dashboard → **Authentication** → **Users** → **Add user**
2. Email : `admin@montresor-togo.com`
3. Mot de passe : choisissez un mot de passe fort
4. Cochez **Auto Confirm User**

### 2.4 Récupérer les clés API

1. Supabase Dashboard → **Settings** → **API**
2. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

## 3. Setup local

```bash
# Cloner le projet
git clone <votre-repo>
cd salon-coiffure

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.local.example .env.local
# Éditez .env.local et remplissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# Lancer en développement
npm run dev
```

---

## 4. Déploiement Vercel

### 4.1 Via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### 4.2 Via dashboard

1. Importez le repo GitHub sur [vercel.com](https://vercel.com)
2. Framework Preset : **Vite**
3. Ajoutez les variables d'environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Cliquez **Deploy**

---

## 5. Structure du projet

```
src/
├── lib/
│   ├── supabase.js       # Client Supabase
│   └── api.js            # Toutes les fonctions CRUD
├── context/
│   ├── AppContext.jsx     # État global (services, RDV, galerie, dispos)
│   ├── AuthContext.jsx    # Auth Supabase
│   └── ToastContext.jsx   # Notifications toast
├── pages/
│   ├── Accueil.jsx
│   ├── Services.jsx
│   ├── Reservation.jsx
│   ├── Paiement.jsx
│   ├── Confirmation.jsx
│   ├── Contact.jsx
│   ├── Galerie.jsx
│   └── admin/
│       ├── LoginAdmin.jsx
│       ├── AdminLayout.jsx
│       ├── Dashboard.jsx
│       ├── RendezVousAdmin.jsx
│       ├── PaiementsAdmin.jsx
│       ├── ServicesAdmin.jsx
│       ├── GalerieAdmin.jsx
│       └── DisponibilitesAdmin.jsx
└── components/
    ├── Navbar.jsx
    ├── Footer.jsx
    ├── PageLayout.jsx
    ├── ServiceCard.jsx
    └── Toast.jsx
supabase/
└── schema.sql             # Schéma PostgreSQL complet
```

---

## 6. Variables d'environnement

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anon Supabase |

> Ces variables sont préfixées `VITE_` pour être accessibles côté client via `import.meta.env`.

---

## 7. Paiement Mobile Money

L'intégration Flooz / T-Money sera ajoutée ultérieurement.
Pour l'instant, les clients saisissent leur référence de transaction manuellement et l'admin la valide depuis le dashboard.
