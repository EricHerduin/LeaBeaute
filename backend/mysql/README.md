Configuration MySQL o2switch

1. Renseigner les variables suivantes dans `.env` :

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `MONGO_URL`
- `MONGO_DB_NAME`

2. Initialiser le schema SQL :

```bash
npm run db:init:mysql
```

3. Migrer les donnees MongoDB existantes vers MySQL :

```bash
npm run db:migrate:mongo-to-mysql
```

Notes :

- Depuis le poste local, utiliser l'hote distant o2switch du type `raisin.o2switch.net`.
- Une fois le backend deploye sur o2switch, l'hote MySQL pourra etre remplace par `localhost`.
- Ne pas commiter les identifiants reels dans le depot.
