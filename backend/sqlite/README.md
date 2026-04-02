SQLite local sert de base SQL de staging sur le Mac.

Base generee par defaut :

- `backend/local-data/lea-beaute-local.sqlite`

Variables attendues :

- `MONGO_URL`
- `MONGO_DB_NAME`
- optionnel : `LOCAL_SQLITE_PATH`

Commandes :

```bash
npm run db:init:local-sqlite
npm run db:migrate:mongo-to-local-sqlite
npm run db:migrate:local-sqlite-to-mysql
```

Verification rapide :

```bash
sqlite3 backend/local-data/lea-beaute-local.sqlite ".tables"
```

Exemple :

```bash
sqlite3 backend/local-data/lea-beaute-local.sqlite "SELECT COUNT(*) FROM price_items;"
```
