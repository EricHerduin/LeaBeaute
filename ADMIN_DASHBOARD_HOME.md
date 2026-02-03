# Page d'Accueil Dashboard Admin - Documentation

## 🎯 Vue d'Ensemble

La page d'accueil du dashboard admin (`AdminDashboardHome.jsx`) offre un interface **rapide et intuitive** pour les actions les plus fréquentes :

- Vérifier une carte cadeau
- Valider une carte cadeau (marquer comme utilisée)
- Ajouter un nouveau tarif
- Ajouter un nouveau coupon
- Accès rapide à la gestion complète

---

## 🎨 Design

### Boutons Carrés Style Caisse
- **Taille** : 128x128px (32 × 32 rem)
- **Formes** : Carrés arrondis (border-radius: 2xl)
- **Couleurs** :
  - 🔍 Vérifier Carte : Bleu
  - ✓ Valider Carte : Vert
  - 💰 Nouveau Tarif : Violet
  - 🎟️ Nouveau Coupon : Rouge
  - 📋 Tous les Tarifs : Or (couleur branding)

### Animations
- Hover : Zoom 1.05x
- Tap : Zoom 0.95x
- Smooth transition sur 300ms

---

## 🔧 Fonctionnalités

### 1. Vérifier une Carte Cadeau
**Bouton bleu** 🔍

Permet de **rechercher et afficher les détails** d'une carte cadeau.

**Modalité** :
- Type de recherche :
  - `Par Numéro de Carte` : LB-XXXX-XXXX (exact match)
  - `Par Nom` : Recherche bénéficiaire ou acheteur (regex insensible à la casse)

**Résultats affichent** :
- Numéro unique (code)
- Montant
- Status (active, redeemed, expired, etc.)
- Date d'expiration
- Nom du bénéficiaire
- Nom de l'acheteur
- Bouton "Marquer comme utilisée" (si status = active)

**Endpoint** : `POST /api/gift-cards/search`
```javascript
{
  "query": "LB-XXXX-XXXX" | "Jean Dupont",
  "search_type": "code" | "recipient"
}
```

---

### 2. Valider une Carte Cadeau
**Bouton vert** ✓

Permet de **marquer une carte cadeau comme utilisée** (status → "redeemed").

**Flux** :
1. Cliquez sur "Valider une Carte"
2. Système vous redirige vers "Vérifier une Carte"
3. Cherchez la carte à valider
4. Cliquez "✓ Marquer comme utilisée" dans les résultats
5. La carte passe en statut "redeemed" avec timestamp

**Endpoint** : `POST /api/gift-cards/{gift_card_id}/redeem`
```javascript
{
  "success": true,
  "message": "Gift card marked as redeemed",
  "gift_card": { ...updated card data }
}
```

**Validations** :
- ❌ Erreur si status ≠ "active"
- ❌ Erreur si carte n'existe pas

---

### 3. Ajouter un Nouveau Tarif
**Bouton violet** 💰

Formulaire modal pour **créer rapidement un nouveau service/tarif**.

**Champs** :
- `Catégorie` * : ex. "Epilations", "Soins visage"
- `Nom du service` * : ex. "Sourcils", "Hydradermie"
- `Prix (€)` * : ex. "25.00"
- `Durée (minutes)` : ex. "30"
- `Note` : ex. "En duo 60€"

**Endpoint** : `POST /api/prices`
```javascript
{
  "category": "Epilations",
  "name": "Sourcils",
  "priceEur": 25.00,
  "durationMin": null,
  "note": null,
  "isActive": true,
  "sortOrder": 0
}
```

---

### 4. Ajouter un Nouveau Coupon
**Bouton rouge** 🎟️

Formulaire modal pour **créer rapidement un code de réduction**.

**Champs** :
- `Code` * : ex. "SUMMER2025"
- `Type` * : "Pourcentage" | "Montant fixe"
- `Valeur` * : ex. "15" (%), "25.00" (€)
- `Valide jusqu'au` * : Date picker
- `Max utilisations` : ex. "100"

**Endpoint** : `POST /api/coupons`
```javascript
{
  "code": "SUMMER2025",
  "type": "percentage",
  "value": 15,
  "validTo": "2025-12-31T23:59:59Z",
  "isActive": true,
  "maxUses": 100
}
```

---

### 5. Accès aux Gestions Complètes
**Cartes complémentaires** 

Trois cartes cliquables pour naviguer vers les onglets de gestion complets :

| Carte | Icône | Acces |
|-------|-------|-------|
| **Cartes Cadeaux** | 🎁 | Gestion complète avec filtres |
| **Tarifs Complets** | 💳 | Tous les tarifs, édition, suppression |
| **Coupons** | 🎟️ | Tous les coupons, édition, suppression |

---

## 📱 Navigation

**Tab "Accueil"** est le tab par défaut au login.

```
🏠 Accueil | Tarifs | Cartes cadeaux | Coupons
```

Cliquez sur chaque onglet pour naviguer.

---

## 🔐 Authentification

Tous les appels API incluent :
```javascript
headers: {
  Authorization: adminToken
}
```

Token obtenu via `/api/admin/login`.

---

## 💬 Messages & Notifications

Utilise **Sonner Toast** pour les retours :

### Succès ✓
- "N carte(s) trouvée(s)"
- "Carte cadeau XXX marquée comme utilisée"
- "Tarif 'Sourcils' ajouté"
- "Coupon 'SUMMER2025' créé"

### Erreurs ✗
- "Veuillez entrer une recherche"
- "Aucune carte cadeau trouvée"
- "Only active cards can be redeemed"
- "Veuillez remplir les champs obligatoires"
- Erreurs backend détaillées

---

## 🎯 Cas d'Usage

### Cas 1 : Client arrive en boutique avec un code
1. Admin clique 🔍 "Vérifier une Carte"
2. Entre le code : `LB-XXXX-XXXX`
3. Voir tous les détails (montant, date expiration, etc.)
4. Cliquer "Marquer comme utilisée"
5. Status passe à "redeemed" ✓

### Cas 2 : Nouveau service à ajouter
1. Admin clique 💰 "Nouveau Tarif"
2. Remplit : Soin visage, Hydradermie, 100€, 60 min
3. Cliquer "Ajouter"
4. Tarif disponible immédiatement dans la liste

### Cas 3 : Nouvelle promotion
1. Admin clique 🎟️ "Nouveau Coupon"
2. Code : NOEL2025, 20%, expire 31/12
3. Max 100 utilisations
4. Cliquer "Créer"
5. Coupon actif et utilisable

---

## 🔗 Endpoints Utilisés

### GET
- `GET /api/gift-cards/all` - Lister les cartes (réutilisé après actions)
- `GET /api/coupons` - Lister les coupons (réutilisé après actions)
- `GET /api/prices/all` - Lister les tarifs (réutilisé après actions)

### POST
- `POST /api/gift-cards/search` - **Chercher une carte**
- `POST /api/gift-cards/{id}/redeem` - **Marquer comme utilisée**
- `POST /api/prices` - **Créer un tarif**
- `POST /api/coupons` - **Créer un coupon**

---

## 🎨 Composants

### SquareButton
Composant réutilisable pour les boutons carrés.

```jsx
<SquareButton
  icon="🔍"
  label="Vérifier une Carte"
  color="blue"
  onClick={() => setVerifyModal(true)}
/>
```

**Props** :
- `icon` : emoji ou texte
- `label` : texte affiché
- `color` : "gold" | "green" | "blue" | "purple" | "red"
- `onClick` : handler

---

## 📊 État du Composant

```javascript
const [verifyModal, setVerifyModal] = useState(false);
const [redeemModal, setRedeemModal] = useState(false);
const [priceModal, setPriceModal] = useState(false);
const [couponModal, setCouponModal] = useState(false);

const [verifyQuery, setVerifyQuery] = useState('');
const [verifyType, setVerifyType] = useState('code');
const [verifyResults, setVerifyResults] = useState(null);
const [verifyLoading, setVerifyLoading] = useState(false);

const [newPrice, setNewPrice] = useState({...});
const [newCoupon, setNewCoupon] = useState({...});
```

---

## ✨ Améliorations Futures

- [ ] Historique des validations (cartes utilisées aujourd'hui)
- [ ] Stats dashboard (nb cartes actives, coupons les plus utilisés)
- [ ] Recherche avancée (par date d'achat, montant, etc.)
- [ ] Export CSV des cartes validées
- [ ] Impression d'étiquette pour cartes
- [ ] Raccourcis clavier (Ctrl+G pour recherche, etc.)

