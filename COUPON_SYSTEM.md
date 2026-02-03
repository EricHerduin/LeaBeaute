# Système de Validation des Coupons - Documentation

## 🎯 Objectif
Système de validation de coupons avec **protection contre les utilisations en double impression** et enregistrement d'utilisation.

## 🔄 Flux de Validation

### 1️⃣ Étape 1 : Validation du Coupon (Frontend)
**Endpoint** : `POST /api/coupons/validate?code=CODE`
**Accès** : Public (aucune authentification requise)

**Requête**:
```javascript
// Appel depuis GiftCards.jsx
const response = await axios.post(
  `${API}/coupons/validate?code=${couponCode}`
);
```

**Réponse réussie** :
```json
{
  "valid": true,
  "token": "unique_validation_token_base64_32bytes",
  "type": "percentage",
  "value": 10,
  "currency": "EUR",
  "currentUses": 5,
  "maxUses": 100
}
```

**Réponse échouée** :
```json
{
  "valid": false,
  "error": "Coupon not found | Coupon is inactive | Coupon has expired | Coupon usage limit reached",
  "token": null
}
```

**Ce qui se passe au backend** :
- ✓ Cherche le coupon par code (case-insensitive)
- ✓ Vérifie que le coupon est actif
- ✓ Vérifie que le coupon n'a pas expiré
- ✓ Vérifie que le limite d'utilisations n'est pas atteinte
- **IMPORTANT** : Génère un **token unique** (`secrets.token_urlsafe(32)`)
- ✓ Crée un enregistrement `CouponUsage` en état "pending"
- ✓ Retourne le token (pas encore appliqué)

**Table MongoDB créée** : `coupon_usages`
```json
{
  "_id": ObjectId(),
  "id": "uuid",
  "coupon_code": "SUMMER2025",
  "validation_token": "unique_token_base64",
  "session_id": null,
  "gift_card_id": null,
  "status": "pending",
  "created_at": "2025-02-03T10:30:00Z",
  "applied_at": null
}
```

---

### 2️⃣ Étape 2 : Application du Coupon lors du Checkout
**Endpoint** : `POST /api/gift-cards/create-checkout`
**Accès** : Public
**Requête** (depuis GiftCards.jsx) :
```javascript
const response = await axios.post(`${API}/gift-cards/create-checkout`, {
  amount: 50,
  origin_url: window.location.origin,
  buyer_firstname: "Jean",
  buyer_lastname: "Dupont",
  buyer_email: "jean@example.com",
  buyer_phone: "+33612345678",
  recipient_name: "Marie",
  coupon_token: "unique_validation_token"  // ← Token reçu à l'étape 1
});
```

**Ce qui se passe au backend** :
1. **Valide le token** :
   - Cherche l'enregistrement `coupon_usages` avec ce token
   - Vérifie que le statut est "pending"
   - Si invalide ou déjà utilisé → Erreur 400

2. **Récupère les détails du coupon** :
   - Charge le coupon par `coupon_code` depuis `coupon_usages`
   - Vérifie que le coupon existe toujours

3. **Calcule le montant final** :
   ```
   Si type = "percentage":
     discount = (50 * 10) / 100 = 5€
     final_amount = 50 - 5 = 45€
   
   Si type = "fixed":
     discount = 15€
     final_amount = 50 - 15 = 35€
   ```

4. **Crée la session Stripe** :
   - Avec le montant final (après réduction)
   - Enregistre les métadonnées incluant le code du coupon

5. **Enregistre le token** :
   - Sauvegarde `coupon_token` dans le document `gift_cards`
   - Crée une transaction avec `coupon_token` et `coupon_data`

**Réponse** :
```json
{
  "url": "https://checkout.stripe.com/pay/...",
  "session_id": "cs_live_..."
}
```

**Erreurs possibles** :
- `400 Invalid coupon token` - Token introuvable ou expiré
- `400 Coupon already used or invalid` - Status ≠ "pending"
- `400 Coupon not found` - Coupon supprimé entre validation et checkout

---

### 3️⃣ Étape 3 : Finalisation après Paiement
**Endpoint** : `GET /api/gift-cards/status/{session_id}`
**Accès** : Public (polling)

**Ce qui se passe au backend** :
1. **Récupère le statut Stripe**
2. **Si paiement réussi** (`payment_status = "paid"`) :
   - ✓ Génère le code de la carte cadeau
   - ✓ Met à jour le statut à "active"
   - **✓ FINALISE LE COUPON** :
     ```python
     await db.coupon_usages.update_one(
       {"validation_token": transaction["coupon_token"]},
       {"$set": {
         "status": "applied",
         "session_id": session_id,
         "applied_at": datetime.now(timezone.utc).isoformat(),
         "gift_card_id": gift_card_id
       }}
     )
     ```
   - **✓ INCRÉMENTE LE COMPTEUR** :
     ```python
     await db.coupons.update_one(
       {"code": coupon_code},
       {"$inc": {"currentUses": 1}}
     )
     ```
   - Envoie l'email à l'acheteur

**État final dans MongoDB** :
```json
// Dans coupon_usages
{
  "validation_token": "...",
  "status": "applied",  // ← Changé de "pending"
  "applied_at": "2025-02-03T10:35:00Z",
  "gift_card_id": "uuid_of_gift_card",
  "session_id": "cs_live_..."
}

// Dans coupons
{
  "code": "SUMMER2025",
  "currentUses": 6  // ← Incrémenté de 1
}
```

---

## 🛡️ Protection contre les Doublons

### Problème
Une personne pourrait :
1. Valider le coupon → Reçoit token
2. Appliquer le coupon → Session Stripe créée
3. **Copier le token et l'utiliser multiple fois** avant paiement
4. **Annuler le paiement** et utiliser le token ailleurs

### Solution

#### 1. **Token Unique à Chaque Validation**
```python
validation_token = secrets.token_urlsafe(32)  # 43 caractères aléatoires
```
- Impossiblede deviner ou brute-forcer
- Un token = Une seule utilisation

#### 2. **Machine d'État Strict**
```
pending → applied (après paiement réussi)
pending → canceled (si paiement échoue)
```

Les transitions non autorisées sont rejetées :
```python
if usage.get('status') != 'pending':
    raise HTTPException("Coupon already used or canceled")
```

#### 3. **Enregistrement Atomique**
- Le token est lié à une transaction Stripe spécifique
- L'utilisation n'est finalisée que si le paiement est confirmé
- Si le paiement échoue → État reste "pending" (peut être annulé)

#### 4. **Cleanup en Cas d'Erreur**
```python
except stripe.error.StripeError:
    # Annule le coupon si Stripe fail
    await db.coupon_usages.update_one(
        {"validation_token": coupon_token},
        {"$set": {"status": "canceled"}}
    )
    raise HTTPException(...)
```

#### 5. **Vérification du Compteur**
```python
# Avant validation
if coupon.get('maxUses') and coupon.get('currentUses', 0) >= coupon['maxUses']:
    return {"valid": False, "error": "Coupon usage limit reached"}
```

---

## 📊 Base de Données

### Collection `coupons`
```json
{
  "id": "uuid",
  "code": "SUMMER2025",
  "type": "percentage",  // "percentage" ou "fixed"
  "value": 10,
  "currency": "EUR",
  "validFrom": "2025-02-01T00:00:00Z",
  "validTo": "2025-12-31T23:59:59Z",
  "isActive": true,
  "createdAt": "2025-01-15T00:00:00Z",
  "maxUses": 100,
  "currentUses": 6
}
```

### Collection `coupon_usages`
```json
{
  "id": "uuid",
  "coupon_code": "SUMMER2025",
  "validation_token": "SJHDkshKJLDHksjdhksjhd...",
  "session_id": "cs_live_...",
  "gift_card_id": "uuid",
  "status": "applied",  // "pending" | "applied" | "canceled"
  "created_at": "2025-02-03T10:30:00Z",
  "applied_at": "2025-02-03T10:35:00Z"
}
```

---

## 🚀 Endpoints Complets

### ✅ POST `/api/coupons/validate`
```bash
curl -X POST "http://localhost:8000/api/coupons/validate?code=SUMMER2025"
```

### ✅ POST `/api/coupons/apply`
```bash
curl -X POST "http://localhost:8000/api/coupons/apply" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "SJHDkshKJLDHksjdhksjhd...",
    "session_id": "cs_live_..."
  }'
```

### ✅ POST `/api/coupons/cancel/{token}`
```bash
curl -X POST "http://localhost:8000/api/coupons/cancel/SJHDkshKJLDHksjdhksjhd..."
```

---

## 🎨 Interface Frontend (GiftCards.jsx)

### Composants ajoutés
1. **Champ de saisie du coupon**
   - Saisi en majuscules
   - Désactivé après application

2. **Bouton "Appliquer"**
   - Appelle `/api/coupons/validate`
   - Affiche les erreurs
   - Montre l'état "Vérification..."

3. **Affichage du coupon appliqué**
   - Badge vert avec checkmark
   - Affiche le code et la réduction
   - Bouton "✕" pour supprimer

4. **Résumé du prix**
   - Prix original
   - Réduction (si coupon appliqué)
   - Prix final à payer
   - Le bouton affiche le montant final

---

## ⚠️ Cas d'Erreur Gérés

| Cas | Réponse |
|-----|---------|
| Coupon inexistant | `400 Coupon not found` |
| Coupon inactif | `400 Coupon is inactive` |
| Coupon expiré | `400 Coupon has expired` |
| Limite d'utilisation atteinte | `400 Coupon usage limit reached` |
| Token invalide | `400 Invalid or expired validation token` |
| Coupon déjà utilisé | `400 Coupon already used or canceled` |
| Montant invalide | `400 Invalid gift card amount` |
| Session Stripe échouée | `400 Stripe error: ...` |

---

## ✨ Exemple Complet de Flux

```javascript
// 1. Utilisateur saisit code "SUMMER2025"
const validation = await axios.post(
  `${API}/coupons/validate?code=SUMMER2025`
);
// → { valid: true, token: "TOKEN123", value: 10, type: "percentage" }

// 2. Formulaire affiche la réduction
// Prix : 50€, Réduction : 5€, À payer : 45€

// 3. Utilisateur clique "Payer 45€"
const checkout = await axios.post(
  `${API}/gift-cards/create-checkout`,
  {
    amount: 50,
    coupon_token: "TOKEN123",  // ← Token unique inclus
    ...buyerInfo
  }
);
// → Créé une session Stripe de 45€ (après réduction)

// 4. Utilisateur complète le paiement
// Backend détecte paiement réussi et :
// - Met à jour coupon_usages.status = "applied"
// - Incrémente coupons.currentUses += 1

// 5. Coupon ne peut pas être réutilisé :
// - Le token "TOKEN123" est marqué "applied"
// - Toute tentative future avec ce token échoue
// - Coupon ne peut être validé que maxUses fois
```

---

## 🔐 Sécurité

✅ **Tokens cryptographiquement sûrs** - `secrets.token_urlsafe(32)`
✅ **État transactionnel** - pending → applied/canceled uniquement
✅ **Vérification du backend** - Validation côté serveur obligatoire
✅ **Rate limiting recommandé** - Ajouter dans production
✅ **Audit trail** - `created_at`, `applied_at` enregistrés
✅ **Réconciliation possible** - Lier gift_card_id au coupon usage

