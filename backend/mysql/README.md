Configuration MySQL o2switch

1. Renseigner les variables suivantes dans `.env` :

- `MONGO_URL`
- `MONGO_DB_NAME`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DB_NAME`
- `MYSQL_USER`
- `MYSQL_PASSWORD`

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
