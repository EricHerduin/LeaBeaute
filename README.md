# Lea Beaute

Architecture actuelle :

- `frontend/` : application React migrée vers `Vite`
- `backend/` : API `Node.js` + `Express` + `MongoDB`

## Frontend

Installation :

```bash
cd frontend
npm install
```

Développement :

```bash
npm run dev
```

Build :

```bash
npm run build
```

## Backend

Installation :

```bash
cd backend
npm install
```

Développement :

```bash
npm run dev
```

Démarrage simple :

```bash
npm start
```

## Variables d'environnement principales

Backend :

- `PORT`
- `MONGO_URL`
- `DB_NAME`
- `ADMIN_PASSWORD`
- `CORS_ORIGINS`
- `STRIPE_API_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_FROM`
- `GOOGLE_PLACE_ID`
- `GOOGLE_PLACES_API_KEY`

Frontend :

- `VITE_BACKEND_URL`
- `VITE_GOOGLE_PLACE_ID`

## Déploiement o2switch

- Frontend : build statique `Vite`
- Backend : application `Node.js` via `Setup Node.js App`

Le frontend peut consommer l'API en relatif via `/api` ou via `VITE_BACKEND_URL` si l'API est exposée sur un sous-domaine dédié.
