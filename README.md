# 🍽 SmartResto ESMT

Application complète de gestion de restaurant universitaire pour l'ESMT — Dakar.

## Architecture

```
smartresto/
├── backend/
│   ├── server.js          # Express API REST (Node.js)
│   └── package.json
└── frontend/
    └── index.html         # SPA vanilla JS (aucune dépendance build)
```

## Démarrage rapide

### Backend (Terminal 1)
```bash
cd backend
npm install
npm start
# Serveur sur http://localhost:3001
```

### Frontend (Terminal 2)
```bash
cd frontend
# Option 1 — Ouvrir directement index.html dans le navigateur
# Option 2 — Serveur local
npx serve . -p 3000
# App sur http://localhost:3000
```

## Comptes démo

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@esmt.sn | admin123 | Super Admin |
| cuisinier@esmt.sn | cuisine123 | Cuisinier |

Pour créer un compte étudiant, utiliser l'inscription avec un email `@esmt.sn` ou `@etu.esmt.sn`.

## Fonctionnalités implémentées

### 👨‍🎓 Interface Étudiant
- ✅ Inscription avec allergènes et infos ESMT
- ✅ Connexion avec vérification email institutionnel
- ✅ Menu du jour avec filtres par catégorie
- ✅ Détection automatique des allergènes (alerte si conflit)
- ✅ Commander un plat avec choix du créneau
- ✅ Paiement Wave / Orange Money / Carte / Espèces
- ✅ QR Code de validation généré automatiquement
- ✅ Suivi des commandes avec statuts
- ✅ Feedback sur les repas (+5 pts)
- ✅ Points ESMT — niveaux Bronze/Argent/Or
- ✅ Notifications en temps réel

### 👨‍🍳 Interface Cuisinier
- ✅ Bons de préparation en temps réel
- ✅ Indicateur urgence (>15 min)
- ✅ Valider une commande (marquer "Prêt")
- ✅ Vue prédiction IA des couverts

### 📊 Interface Admin / Super Admin
- ✅ Dashboard avec KPIs temps réel
- ✅ Gestion complète du menu (CRUD)
- ✅ Gestion des stocks avec alertes visuelles
- ✅ Gestion des fournisseurs
- ✅ Gestion des utilisateurs (créer staff, activer/désactiver)
- ✅ Prédiction IA des couverts par créneau
- ✅ Détection de surplus → suggestion repas éco

## API Endpoints

### Auth
- `POST /api/auth/inscription` — Créer compte étudiant
- `POST /api/auth/connexion` — Connexion
- `GET /api/auth/me` — Profil utilisateur

### Plats
- `GET /api/plats` — Liste des plats
- `POST /api/plats` — Créer un plat (admin)
- `PUT /api/plats/:id` — Modifier un plat
- `DELETE /api/plats/:id` — Supprimer un plat

### Commandes
- `GET /api/commandes` — Liste des commandes
- `POST /api/commandes` — Passer une commande
- `PUT /api/commandes/:id/valider` — Valider (cuisine)
- `GET /api/commandes/bons-preparation` — Bons pour cuisine

### Autres
- `GET/PUT /api/stocks` — Gestion stocks
- `GET/POST /api/fournisseurs` — Fournisseurs
- `POST /api/feedbacks` — Soumettre feedback
- `GET /api/stats` — Statistiques dashboard
- `GET /api/prediction` — Prédiction IA
- `GET /api/utilisateurs` — Liste utilisateurs (admin)
- `POST /api/utilisateurs/staff` — Créer compte staff

## Stack technique
- **Backend**: Node.js + Express + JWT + bcrypt + QRCode
- **Frontend**: HTML/CSS/JS vanilla (aucun framework, déployable partout)
- **Auth**: JWT Bearer tokens
- **DB**: In-memory (à remplacer par PostgreSQL/MongoDB en production)
