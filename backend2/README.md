Backend2 est un backend minimal de validation MySQL pour o2switch.

Objectif :

- demarrer une API Node sans MongoDB
- verifier la connexion MySQL sur o2switch
- verifier la lecture et l'ecriture en base

Variables d'environnement attendues :

- `PORT`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DB_NAME`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `CORS_ORIGINS`

En production o2switch :

- `MYSQL_HOST=localhost`
- `MYSQL_PORT=3306`

Installation :

```bash
npm install
```

Initialisation de la table de test :

```bash
npm run db:init
```

Demarrage :

```bash
npm start
```

Routes utiles :

- `GET /api`
- `GET /api/health`
- `GET /api/health/write-test`

Validation attendue :

- `/api/health` retourne le nom de la base, l'utilisateur SQL courant et le nombre de checks
- `/api/health/write-test` insere une ligne de test dans `app_health_checks`
