# Système de Gestion des Horaires d'Ouverture - Documentation Complète

## 🎯 Vue d'ensemble

Le système de gestion des horaires d'ouverture a été complètement redesigné pour :
- Stocker **TOUS** les horaires dans MongoDB (plus de données en dur dans le frontend)
- Gérer les **horaires généraux** (lundi-dimanche)
- Gérer les **exceptions** pour dates/périodes spécifiques
- Gérer les **jours fériés**
- Fournir un **tableau de bord admin complet**
- Afficher le **statut en temps réel** sur les pages publiques

---

## 📊 Architecture des Données MongoDB

### 1. Collection `business_hours_general`
Document unique stockant les horaires de la semaine :
```json
{
  "_id": "main",
  "0": { "open": null, "close": null },      // Dimanche - Fermé
  "1": { "open": "14:00", "close": "18:30" }, // Lundi
  "2": { "open": "09:00", "close": "18:30" }, // Mardi
  "3": { "open": null, "close": null },      // Mercredi - Fermé
  "4": { "open": "09:00", "close": "18:30" }, // Jeudi
  "5": { "open": "09:00", "close": "18:30" }, // Vendredi
  "6": { "open": "09:00", "close": "16:00" }  // Samedi
}
```

### 2. Collection `business_hours_exceptions`
Documents pour chaque exception (date spécifique ou période) :
```json
{
  "date": "2024-12-25",
  "isOpen": false,
  "startTime": null,
  "endTime": null,
  "reason": "Noël - Journée spéciale"
}
```

**OU** (si ouverture modifiée ce jour) :
```json
{
  "date": "2024-12-24",
  "isOpen": true,
  "startTime": "10:00",
  "endTime": "16:00",
  "reason": "Veille de Noël - Horaires réduits"
}
```

### 3. Collection `business_hours_holidays`
Documents pour les jours fériés permanents :
```json
{
  "date": "2024-01-01",
  "name": "Jour de l'An",
  "isClosed": true
}
```

---

## 🔌 Endpoints API Backend

### Endpoints Généraux
**`GET /api/business-hours`** - Récupère les horaires généraux (7 jours)
```
Response: {
  "0": { "open": null, "close": null },
  "1": { "open": "14:00", "close": "18:30" },
  ...
}
```

**`POST /api/business-hours`** - Met à jour les horaires généraux (Admin Only)
```
Headers: { Authorization: "<ADMIN_PASSWORD>" }
Body: {
  "0": { "open": null, "close": null },
  "1": { "open": "14:00", "close": "18:30" },
  ...
}
Response: { "success": true }
```

### Endpoints Exceptions
**`GET /api/business-hours/exceptions`** - Liste toutes les exceptions
```
Response: [
  {
    "date": "2024-12-25",
    "isOpen": false,
    "startTime": null,
    "endTime": null,
    "reason": "Noël"
  },
  ...
]
```

**`POST /api/business-hours/exceptions`** - Ajoute/met à jour une exception (Admin Only)
```
Headers: { Authorization: "<ADMIN_PASSWORD>" }
Body: {
  "date": "2024-12-25",
  "isOpen": false,
  "reason": "Noël"
}
Response: { "success": true }
```

**`DELETE /api/business-hours/exceptions/{date}`** - Supprime une exception (Admin Only)
```
Headers: { Authorization: "<ADMIN_PASSWORD>" }
Response: { "success": true }
```

### Endpoints Jours Fériés
**`GET /api/business-hours/holidays`** - Liste tous les jours fériés
```
Response: [
  {
    "date": "2024-01-01",
    "name": "Jour de l'An",
    "isClosed": true
  },
  ...
]
```

**`POST /api/business-hours/holidays`** - Ajoute/met à jour un jour férié (Admin Only)
```
Headers: { Authorization: "<ADMIN_PASSWORD>" }
Body: {
  "date": "2024-12-25",
  "name": "Noël",
  "isClosed": true
}
Response: { "success": true }
```

**`DELETE /api/business-hours/holidays/{date}`** - Supprime un jour férié (Admin Only)
```
Headers: { Authorization: "<ADMIN_PASSWORD>" }
Response: { "success": true }
```

### Endpoint Statut Courant
**`GET /api/business-hours/status`** - Statut en temps réel (tenant compte de TOUS les facteurs)
```
Response: {
  "status": "open" | "closed",
  "message": "Ouvert" | "Fermé - Noël",
  "hours": { "open": "09:00", "close": "18:30" } | null
}
```

---

## 🖥️ Composant Admin Dashboard

### Fichier: `frontend/src/components/BusinessHoursManager.jsx`

Le composant `BusinessHoursManager` offre une interface **tabbed** avec 3 sections :

#### 🏢 Onglet 1: Horaires Généraux
- Affiche chaque jour de la semaine (Dimanche → Samedi)
- Bouton On/Off pour marquer un jour comme fermé
- Sélecteurs d'heure d'ouverture et fermeture
- Bouton "Sauvegarder les Horaires"

**Structure state** :
```javascript
{
  "0": { "open": null, "close": null },
  "1": { "open": "14:00", "close": "18:30" },
  ...
}
```

#### 📅 Onglet 2: Exceptions
- **Formulaire d'ajout** :
  - Sélecteur de date
  - Toggle Ouvert/Fermé
  - Si ouvert → champs pour heure d'ouverture/fermeture
  - Champ raison (optionnel)
  - Bouton "Ajouter l'Exception"
  
- **Liste des exceptions existantes** :
  - Affiche la date, l'état (fermé ou horaires modifiés), la raison
  - Bouton "Supprimer" pour chaque exception

#### 🎉 Onglet 3: Jours Fériés
- **Formulaire d'ajout** :
  - Sélecteur de date
  - Champ texte pour le nom du jour (ex: "Noël", "Jour de l'An")
  - Bouton "Ajouter le Jour Férié"
  
- **Liste des jours fériés** :
  - Affiche le nom et la date
  - Bouton "Supprimer" pour chaque jour

---

## 📱 Composants Publics

### Fichier: `frontend/src/components/OpeningHours.jsx`

Affiche les horaires publiquement sur les pages :

**Props** :
- `fullWidth` (boolean) - Largeur pleine ou max-width
- `showStatus` (boolean) - Affiche le statut en temps réel

**Fonctionnalités** :
- Affiche tous les jours avec horaires
- Indicateur vert/rouge du statut courant
- Message dynamique (ex: "Fermé - Noël")
- Mise à jour en temps réel (chaque minute)
- Mise en évidence du jour courant
- Lien vers formulaire de contact

**Logique de priorité** :
1. Vérifie d'abord les **jours fériés**
2. Puis les **exceptions** pour aujourd'hui
3. Finalement les **horaires généraux** du jour

---

## 🚀 Intégration aux Pages Publiques

### Landing Page
`frontend/src/pages/LandingPage.jsx`
```jsx
import OpeningHours from '../components/OpeningHours';

// Dans le JSX juste avant le Footer:
<OpeningHours />
<Footer />
```

### Page À Propos
`frontend/src/pages/AboutInstitut.jsx`
```jsx
import OpeningHours from '../components/OpeningHours';

// Dans le JSX juste avant le Footer:
<OpeningHours />
<Footer />
```

---

## 💾 Migration des Données

L'ancien système utilisait un fichier en dur :
```javascript
// ❌ ANCIEN - frontend/src/data/businessHours.js
BUSINESS_HOURS = {
  0: null, // Sunday
  1: { open: 14, close: '18:30' }, // Monday
  ...
}
```

**Ce fichier peut maintenant être supprimé** - Tous les horaires viennent de MongoDB.

### Migration vers MongoDB :
```js
// Dans backend/server.js - fonction seedDatabase()
// Ces données sont automatiquement créées si la collection n'existe pas
```

---

## ⚙️ Variables d'Environnement Requises

### Backend `.env`
```
MONGO_URL=mongodb+srv://...
DB_NAME=lea_beaute
ADMIN_PASSWORD=votre_mot_de_passe_admin
```

### Frontend (si nécessaire)
Aucune variable supplémentaire requise - tout passe par l'API

---

## 🔐 Sécurité

### Authentification Admin
Tous les endpoints d'écriture (`POST`, `DELETE`) requièrent le header :
```
Authorization: <ADMIN_PASSWORD>
```

**Les endpoints de lecture** (`GET`) sont publics pour afficher les horaires.

---

## 📋 Ordre de Priorité pour le Statut Courant

Quand l'API `/api/business-hours/status` est appelée, elle applique cet ordre :

1. **Jours Fériés** - Si aujourd'hui est un jour férié → fermé (ou horaires spéciaux)
2. **Exceptions** - Si une exception existe pour aujourd'hui → applique celle-ci
3. **Horaires Généraux** - Sinon, utilise le jour de la semaine standard

Exemple de priorité :
```
Jour: Lundi 25 décembre (Noël)
  ↓
1. Vérifier holidays → TROUVE "Noël"
  ↓
2. Si holiday.isClosed = true → RETOURNE "closed"
  ↓
3. N'utilise PAS les horaires du lundi généraliste
```

---

## 🧪 Exemples d'Utilisation

### Ajouter une exception pour une journée portes ouvertes
```bash
curl -X POST http://localhost:5000/api/business-hours/exceptions \
  -H "Authorization: <ADMIN_PASSWORD>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-06-15",
    "isOpen": true,
    "startTime": "08:00",
    "endTime": "20:00",
    "reason": "Journée portes ouvertes"
  }'
```

### Ajouter des vacances annuelles
```bash
curl -X POST http://localhost:5000/api/business-hours/exceptions \
  -H "Authorization: <ADMIN_PASSWORD>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-08-15",
    "isOpen": false,
    "reason": "Vacances annuelles"
  }'
```

### Ajouter un jour férié
```bash
curl -X POST http://localhost:5000/api/business-hours/holidays \
  -H "Authorization: <ADMIN_PASSWORD>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-12-25",
    "name": "Noël",
    "isClosed": true
  }'
```

---

## 🐛 Débogage

### Vérifier les horaires généraux
```bash
curl http://localhost:5000/api/business-hours
```

### Vérifier le statut courant
```bash
curl http://localhost:5000/api/business-hours/status
```

### Vérifier les exceptions
```bash
curl http://localhost:5000/api/business-hours/exceptions
```

### Vérifier les jours fériés
```bash
curl http://localhost:5000/api/business-hours/holidays
```

---

## 📝 Fichiers Modifiés

✅ **Backend**
- `backend/server.js` - Endpoints business hours (4 groupes)

✅ **Frontend**
- `frontend/src/components/BusinessHoursManager.jsx` - Interface admin tabbed
- `frontend/src/components/OpeningHours.jsx` - Affichage public
- `frontend/src/pages/AdminDashboardHome.jsx` - Intégration (bouton + modal)
- `frontend/src/pages/LandingPage.jsx` - Intégration
- `frontend/src/pages/AboutInstitut.jsx` - Intégration

🗑️ **À Supprimer (optionnel)**
- `frontend/src/data/businessHours.js` - Non utilisé

---

## ✨ Améliorations Futures Possibles

1. **Périodes d'exception** - Support de plages de dates (ex: vacances)
2. **Notifications** - Email quand les horaires changent
3. **Historique** - Audit des modifications d'horaires
4. **Récurrence** - Jours fériés récurrents (chaque année le 25 décembre)
5. **Timezones** - Support de plusieurs fuseaux horaires
6. **Calendrier partagé** - Export iCal pour clients
