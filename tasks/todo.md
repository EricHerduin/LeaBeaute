# TODO — Léa Beauté

## Bug en cours : les avis Google ne s'affichent pas en production

### Diagnostic (2026-09-09) — TERMINÉ

Domaine réel : `leabeautevalognes.fr` (avec « s »). Backend : `api.leabeautevalognes.fr`.

Faits vérifiés en production :
- `GET https://api.leabeautevalognes.fr/api/google-reviews` → **200 OK**
  avec `{"name":"Léa Beauté","rating":4.8,"user_ratings_total":0,"reviews":[]}`
  → c'est le **JSON de repli codé en dur** de `backend/server.js:733-740` (ou `:752-759`).
- Le reste de l'API fonctionne (`/api/prices`, `/api/business-hours`, `/api/testimonials` → vraies données).
  Le problème est donc isolé aux avis Google, pas au déploiement backend.
- La section s'affiche bien sur la page, mais vide : « 4.8 — 0 avis Google », 0 carte.
- Le bouton « Laisser un avis Google » pointe vers
  `https://search.google.com/local/writereview?placeid=` → **placeid vide**
  ⇒ `VITE_GOOGLE_PLACE_ID` est absent du build de production.

### Cause racine

1. **Les variables Google Places ne sont pas configurées en production**
   (`GOOGLE_PLACE_ID`, `GOOGLE_PLACES_API_KEY` côté backend ; `VITE_GOOGLE_PLACE_ID` côté build front).
   Preuve directe côté front (placeid vide dans le bundle déployé).
2. **Défaut de conception aggravant** : les deux branches d'échec de `/api/google-reviews`
   (« non configuré » et « erreur Google ») renvoient un **200 avec le même JSON factice**,
   dont un `rating: 4.8` inventé. L'échec est donc invisible depuis le front comme depuis les logs.
3. **Risque bloquant pour la suite** : le code appelle l'API Places **legacy**
   (`maps.googleapis.com/maps/api/place/details/json`), fermée aux nouveaux projets Google Cloud
   depuis mars 2025. Une clé créée aujourd'hui renverra `REQUEST_DENIED`.

### Correction — FAIT (code) le 2026-09-09

- [x] 1. Repli silencieux supprimé. Trois états désormais distincts :
      `not_configured` (200), erreur amont (**503** + journalisation du `status` Google), `ok` (200).
      Plus aucun `rating: 4.8` fabriqué.
- [x] 2. Migration vers **Places API (New)** (`places.googleapis.com/v1/places/{id}` + `X-Goog-FieldMask`).
- [x] 3. Cache mémoire 1 h, et **pas de mise en cache des échecs**.
- [x] 4. `GoogleReviews.jsx` masque la section si `reviews.length === 0`.
      Le bouton « Laisser un avis » est masqué si `VITE_GOOGLE_PLACE_ID` est vide (sinon lien mort).
- [x] Tests : 6 nouveaux tests dans `backend/tests/googleReviews.test.js`. Suite complète : 17/17.
- [x] 5. Variables d'environnement renseignées en production + rebuild du front.
- [x] 6. Vérifié en production le 2026-09-10 : avis affichés (note 4,4 — 103 avis).

Fichiers créés (pattern service/controller/routes du dépôt) :
- `backend/services/googleReviewsService.js`
- `backend/controllers/googleReviewsController.js`
- `backend/routes/googleReviewsRoutes.js`
- `backend/tests/googleReviews.test.js`

Fichiers modifiés : `backend/server.js`, `frontend/src/components/GoogleReviews.jsx`.

Note : l'API Places (New) ne renvoie pas les réponses du propriétaire aux avis
(l'ancienne API legacy non plus — le champ `reply` n'a jamais été alimenté).
Le rendu conditionnel côté front reste inoffensif.

### Variables à renseigner en production

Backend (`backend/.env` sur le serveur d'`api.leabeautevalognes.fr`) :
```
GOOGLE_PLACE_ID=ChIJ...
GOOGLE_PLACES_API_KEY=AIza...
```
Front (`frontend/.env.production`, **inliné au build** — un rebuild est obligatoire) :
```
VITE_GOOGLE_PLACE_ID=ChIJ...
```
Console Google Cloud : activer **« Places API (New) »** (et non « Places API » legacy),
puis restreindre la clé à cette API + aux référents `https://leabeautevalognes.fr/*`.

Place ID candidat trouvé en dur dans `frontend/src/components/Testimonials.jsx:83` :
`ChIJreE_Pi-DDEgRJ0veR0hH5jE` — à confirmer avant usage.

---

## Réconciliation de l'arbre de travail — RÉSOLU le 2026-09-10

### Ce qui s'était passé (ce n'est PAS Syncthing)

`git reflog` : le **10 juin 2026 à 22:29**, un `git clone` du dépôt GitHub a été effectué
dans un dossier qui contenait déjà une copie plus ancienne du projet, suivi à 22:31 d'un
`git reset` — qui met à jour l'index mais **ne réécrit pas les fichiers**.
Résultat : `.git` connaissait l'historique jusqu'au 22 mai, mais les fichiers sur disque
étaient restés à l'état du 20 mai (`48ec130`). Écart : 160 fichiers.

Syncthing est hors de cause : son `.stignore` n'exclut que `node_modules`, `dist`, `build`,
`.next`, `.cache`, `.turbo`, `.vite`, `.nuxt`, `coverage`, `logs`, `tmp`, `temp`, `.DS_Store`.
Aucun des fichiers concernés.

### Preuve que la production correspond bien à `main` (75cc1cf)

- HTML en ligne : `data-server-rendered="true"`, `/guinot` pré-rendu (35 221 o) → build SSG.
- Polices auto-hébergées (`/fonts/fonts.css`), preload `Hero.webp`, pas de Google Fonts CDN.
- `robots.txt` en ligne = 145 o = version de `main`. `/llms.txt` renvoie le SPA → absent.
- `git ls-remote` : `origin/main` = `75cc1cf`, rien de plus récent sur GitHub.
- Après réconciliation, le build local reproduit des chunks aux **hashes identiques** :
  `motion-BRYnK2fj.js`, `router-CPC9CVWF.js`, `ui-CFo6AZRb.js`, `app-CjNXJxkY.css`.

### Ce qui a été fait

- [x] Sauvegarde intégrale de l'ancien état sur la branche
      **`sauvegarde-arbre-local-2026-09-10`** (commit `3986850`). Rien n'est perdu.
- [x] Arbre de travail réaligné sur `main` : `git status` propre.
- [x] Corrections « avis Google » réappliquées proprement par patch. Tests : 17/17.
- [x] `npm ci` sur le front → `vite-react-ssg` réinstallé, build SSG fonctionnel
      (10 pages pré-rendues, dont `guinot.html`).
- [x] Branche `backup-local` sur GitHub vérifiée : ancêtre de `main`, 0 commit unique.
      La **pull request #1 est obsolète** et peut être fermée.

## Passe GEO reprise sur la base de `main` — FAIT le 2026-09-10

### Source de vérité pour les horaires

`GET api.leabeautevalognes.fr/api/business-hours` (alimenté par le back-office de l'institut) :

| Jour | Horaires |
|---|---|
| Lundi | 14h00–18h30 |
| Mardi | 09h00–18h30 |
| **Mercredi** | **fermé** |
| Jeudi | 09h00–18h30 |
| Vendredi | 09h00–18h30 |
| Samedi | 09h00–16h00 |
| Dimanche | fermé |

→ Le JSON-LD de `main` était **correct**. La version du 10/06 ajoutait le mercredi et
passait le samedi à 17h : appliquée en bloc, elle aurait publié de faux horaires dans Google.

### Repris

- [x] `robots.txt` : directives crawlers IA (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
      PerplexityBot autorisés ; CCBot et anthropic-ai bloqués).
- [x] `llms.txt` : conservé, **horaires corrigés** (la version du 10/06 annonçait
      « Mardi–Vendredi » et « Samedi 09h–17h », deux erreurs).
- [x] `index.html` : `<meta name="description">` enrichie (39 → 161 caractères).
- [x] `index.html` : bloc `founder` (Person, Léa) ajouté au schéma `BeautySalon` — signal E-E-A-T.

### Écarté volontairement

| Élément du 10/06 | Raison |
|---|---|
| Bloc `<noscript id="static-seo-content">` | **Rendu obsolète par le SSG** : la production sert déjà tout le contenu en HTML pré-rendu. L'ajouter ne ferait que dupliquer le contenu. Le point n°1 de `GEO-ANALYSIS.md` est déjà résolu. |
| Google Fonts CDN | `main` utilise des polices auto-hébergées : meilleure performance et pas de requête tierce. |
| `image` = logo | `main` pointe vers `Hero.webp`, plus pertinent qu'un logo pour un `BeautySalon`. |
| Titre plus court | Celui de `main` est meilleur pour le SEO. |
| Mercredi ouvert / samedi 17h | Contredit les horaires officiels de l'API. |

Vérifié après rebuild SSG : description présente sur les pages générées, `founder` présent,
`GPTBot` dans `robots.txt`, horaires corrigés dans `llms.txt`, polices auto-hébergées
conservées, aucun `Wednesday`, aucun Google Fonts CDN.

## Constat à traiter : titres et descriptions identiques sur les 10 pages

Relevé en production sur `/`, `/guinot`, `/prestations`, `/a-propos-institut` :
toutes servent le **même** `<title>` et la **même** `<meta name="description">`,
celles du template `index.html`. Le composant `SEO.jsx` n'est pas pris en compte
au moment du pré-rendu.

Conséquence : Google voit 10 pages aux métadonnées identiques (signal de contenu dupliqué),
et les pages internes ne ressortent pas sur leurs mots-clés propres.

Piste : `vite-react-ssg` expose un composant `Head` ; `SEO.jsx` doit passer par lui
(ou par `react-helmet-async` correctement branché au prerender) pour que chaque route
émette ses propres balises. **Non traité — à valider avec Éric avant d'ouvrir ce chantier.**

## Avis Google — mise à jour du diagnostic le 2026-09-10

Information d'Éric : **les variables sont bien présentes** dans le `.env` de l'API.
Cela élimine la branche « non configuré » et confirme l'autre : le code partait dans
`data.status !== "OK"`, c'est-à-dire une **erreur renvoyée par Google**, masquée par le
repli silencieux (désormais supprimé).

Hypothèses, par ordre de vraisemblance :

1. **Clé restreinte par « Référents HTTP »** — c'est exactement ce que recommande
   `GOOGLE_REVIEWS_SETUP.md` (étape 2.5), et la liste de référents qui y figure mentionne
   `demo-client.htagfacility.fr`, un domaine obsolète. Or l'appel part du **serveur**, sans
   en-tête `Referer` : Google refuse ce type de clé → `REQUEST_DENIED`.
   Une clé appelée côté serveur doit être restreinte **par adresse IP**, pas par référent.
2. **Dépassement de quota / facturation** — aucun cache n'existait : chaque visiteur
   déclenchait un appel. Le SSG de mai a amélioré le référencement, donc le trafic : cela
   expliquerait la corrélation observée par Éric entre le pré-rendu et la disparition des
   avis. Le cache 1 h ajouté corrige cette cause.
3. **API Places legacy désactivée** sur le projet Google Cloud.

Les trois donnaient le même JSON factice. Après déploiement du correctif, la cause
apparaîtra directement dans la réponse (503 + `status` Google) et dans les logs.

À noter : `VITE_GOOGLE_PLACE_ID` est en revanche **absent du build en ligne**
(le bouton « Laisser un avis » pointe vers `writereview?placeid=`, vide). À vérifier dans
`frontend/.env.production` — c'est une variable distincte de celles du backend.

## Constat du 2026-09-10 : les fichiers source restent synchronisés par Syncthing

Exclure `**/.git` protège l'historique git, mais **les fichiers de travail continuent
d'être synchronisés** entre le MacBook et l'iMac. Démonstration observée le jour même :

- 13h07:14 et 13h07:38 — Syncthing a reçu de l'iMac `frontend/package-lock.json` et
  `backend/package-lock.json`, écrasant les versions validées ici.
- Le diff retirait ~127 marqueurs `"dev": true` du lock frontend : l'iMac reclassait des
  dépendances de développement en dépendances de production.
- Le versioning activé le matin même a conservé les versions remplacées dans
  `Dev_Sync/.stversions` — le filet a fonctionné dès son premier usage.
- Les locks ont été restaurés depuis `main` (version validée par `npm ci` + build SSG
  aux hashes conformes à la production).

Tant que deux machines partagent un arbre de travail par synchronisation de fichiers **et**
par git, ce type de conflit se reproduira : un `npm install` d'un côté écrase l'autre.

Piste à trancher avec Éric : sortir les dossiers de projet de Syncthing et ne s'appuyer
que sur git (`clone` sur chaque machine, `pull`/`push` via GitHub). Syncthing resterait
utile pour les dossiers non versionnés.


## RÉSOLU le 2026-09-10 — les avis Google s'affichent

Cause racine confirmée : **`PERMISSION_DENIED`** renvoyé par Google. La clé en place
n'était pas valide pour Places API (New). Une nouvelle clé a été créée et renseignée dans
`backend/.env`, puis l'application Node redémarrée.

Le correctif a rempli son office : dès le déploiement du backend, l'endpoint a cessé de
renvoyer un faux 200 et a nommé la cause en clair (503 + `PERMISSION_DENIED`), là où
l'ancien code masquait l'erreur derrière un JSON factice depuis des mois.

Vérifié en production :

| Élément | État |
|---|---|
| `/api/google-reviews` | `200` — `"status":"ok"`, 103 avis, note **4,4** |
| Section sur le site | 5 cartes affichées, note et compteur réels |
| Bouton « Laisser un avis » | pointe vers `placeid=ChIJreE_Pi-DDEgRJ0veR0hH5jE` |
| Meta description | version enrichie (161 caractères) |
| Schema `founder` | présent |
| `robots.txt` | 493 o, directives crawlers IA en place |
| `llms.txt` | servi correctement, horaires corrigés |
| `/guinot` | toujours pré-rendu (35 598 o) |
| Polices auto-hébergées | conservées |

À noter : la note réellement attribuée par les client·e·s est **4,4**, alors que le site
affichait publiquement **4,8** — valeur inventée par le repli codé en dur. C'est ce que
la suppression de l'échec silencieux a permis de corriger.

### Reste à faire sur la clé API

- [ ] Restreindre la clé : **API** → Places API (New) uniquement ; **application** →
      adresses IP (celle du serveur), surtout pas « Référents HTTP ».
- [ ] Supprimer l'ancienne clé devenue inutile dans la console Google Cloud.

## 2026-09-11 — Paiement carte cadeau en échec : Tiger Protect (o2switch)

### Cause racine

`api.leabeautevalognes.fr` est protégé par **Tiger Protect**, la sécurité o2switch.
Elle intercepte **toute requête POST portant un User-Agent de navigateur** et répond :

```
HTTP/2 307
location: https://api.leabeautevalognes.fr/api/gift-cards/create-checkout
set-cookie: o2s-chl=...; domain=.api.leabeautevalognes.fr
tiger-protect-security: https://faq.o2switch.fr/.../tiger-protect
```

C'est un challenge par cookie : le client doit rejouer la requête avec `o2s-chl`.

**Pourquoi c'est bloquant** : l'API est sur une origine différente du site, et la réponse 307
ne porte **aucun en-tête `Access-Control-Allow-Origin`**. Le navigateur refuse donc la
redirection avant même de pouvoir traiter le cookie. Message observé dans Safari :
« Cross-origin redirection [...] denied by Cross-Origin Resource Sharing policy [...] Status code: 307 ».

### Mesures (curl, 11/09)

| Requête | Résultat |
|---|---|
| POST, User-Agent `curl` | 400 — passe |
| POST, User-Agent Safari | **307** — bloqué |
| POST, User-Agent Chrome | **307** — bloqué |
| POST avec le cookie `o2s-chl` | 400 — passe |
| GET, User-Agent Safari | 200 — passe |
| POST `/api/webhooks/stripe`, UA Stripe | 400 — passe |

### Déclencheur réel : l'adresse IP, pas le navigateur

Éric a identifié la vraie variable : **NordVPN était actif**. Vérifié le 11/09 —
l'IP publique des tests était `187.13.12.190`, **Datacamp Limited (AS212238)**,
l'infrastructure qui héberge les nœuds de sortie NordVPN.

Tous mes tests `curl` partaient de cette même IP : c'est pourquoi je voyais le 307.
La règle Tiger Protect combine donc **réputation d'IP** (datacenter / VPN) et
**User-Agent de navigateur** — un UA `curl` depuis la même IP passait sans challenge.

### Impact réel — CONFIRMÉ le 11/09

**VPN désactivé, la commande aboutit.** Le site fonctionne normalement pour les visiteurs
en IP résidentielle. Seules les IP classées « datacenter / VPN / proxy » sont challengées.

Double confirmation : mes propres tests restent en 307 alors qu'Éric est passé en 400,
parce que l'environnement d'exécution de l'agent sort par sa propre IP de datacenter
(`Datacamp Limited`, AS212238) — et non par la connexion d'Éric, contrairement à ce que
j'avais écrit. Deux causes distinctes, une seule règle.

Sont donc concernés les seuls visiteurs sous VPN ou proxy d'entreprise :
achat de carte cadeau, dépôt d'avis, consentement cookies — et **connexion au back-office**,
point à surveiller si Éric administre parfois le site depuis un VPN.

Lectures (GET) et webhooks Stripe : jamais touchés.

Conséquence pratique : **je ne peux pas tester les écritures (POST) sur l'API de production
depuis cet environnement.** Tout diagnostic d'écriture devra passer par Éric ou par les logs.

### Hors de cause (vérifié)

- Le code applicatif : les modifications du 09-10/09 ne touchent que les fichiers des avis Google.
- L'URL d'API du bundle : `"https://api.leabeautevalognes.fr"`, identique à l'ancien build.
- Stripe : configuré (sinon 501, or on obtient 400).
- Le CORS applicatif : le preflight OPTIONS répond 204 avec les bons en-têtes.
- Le schéma SQL : les 17 colonnes de l'INSERT existent.

### Correction — côté hébergement uniquement

- [ ] cPanel → **Tiger Protect** → passer la règle concernée de « challenge » à désactivée,
      ou exclure le sous-domaine `api.leabeautevalognes.fr`.
- [ ] Si l'exclusion n'est pas disponible dans l'interface, ouvrir un ticket o2switch.
      Argument : un challenge par redirection 307 + cookie est **incompatible avec une API
      consommée en XHR/fetch depuis une autre origine**, la redirection ne portant pas
      d'en-tête CORS.

**Aucun contournement côté code n'est possible** : vérifié, le navigateur ne peut jamais
obtenir ni rejouer le cookie, la redirection étant rejetée en amont.
