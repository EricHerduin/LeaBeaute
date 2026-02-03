# Guide d'Utilisation - Système de Validation des Coupons

## 🎯 Vue d'Ensemble

Vous avez maintenant un système **complet et sécurisé** de validation des coupons de réduction qui :

✅ **Génère des tokens uniques** pour chaque validation  
✅ **Empêche les utilisations en double** lors du checkout  
✅ **Enregistre l'utilisation** uniquement après paiement réussi  
✅ **Limite le nombre d'utilisations** par coupon  
✅ **Gère les dates d'expiration**  
✅ **Calcule les réductions** (pourcentage ou montant fixe)  

---

## 📱 Interface Utilisateur (Frontend)

### Pour les clients (achat de cartes cadeaux)

#### Étape 1 : Sélectionner un montant
```
[15€] [20€] [30€] [50€]
```

#### Étape 2 : Formulaire avec coupon
```
Vos informations
─────────────────
Prénom: [___________]
Nom: [___________]
Email: [___________]
Téléphone: [___________]

Code de réduction
─────────────────
Entrez votre code: [SUMMER2025] [Appliquer]

✓ Coupon SUMMER2025 appliqué
  Réduction: 15%

Montant de la carte: 50€
Réduction: -7.50€
─────────────────
À payer: 42.50€

[Payer 42.50€] [Annuler]
```

### Pour les admins (création de coupons)

**Admin Dashboard → Onglet "Coupons"**

1. **Ajouter un coupon**
   - Code: `SUMMER2025`
   - Type: `Pourcentage` ou `Montant fixe`
   - Valeur: `15` ou `15€`
   - Valide jusqu'au: `31/12/2025`
   - Max utilisations: `100`
   - Actif: `Oui`

2. **Modifier un coupon**
   - Cliquez sur "Modifier"
   - Changez les paramètres
   - Cliquez "Confirmer"

3. **Supprimer un coupon**
   - Cliquez "Supprimer"
   - Confirmez

4. **Voir l'historique**
   - Utilisations actuelles / Max
   - État (actif/inactif)
   - Dates de validité

---

## 🔄 Flux Complet

### Pour un client

```
1. Client ouvre GiftCards.jsx
   ↓
2. Client sélectionne montant (50€)
   ↓
3. Client remplit le formulaire
   ↓
4. Client saisit code coupon: "SUMMER2025"
   ↓
5. Frontend appelle POST /api/coupons/validate?code=SUMMER2025
   ↓
6. Backend génère token unique: "w3w5vGt4Vs0JEGp69iMx..."
   ↓
7. Crée coupon_usage avec status="pending"
   ↓
8. Frontend affiche réduction: 50€ - 7.50€ = 42.50€
   ↓
9. Client clique "Payer 42.50€"
   ↓
10. Frontend appelle POST /api/gift-cards/create-checkout
    Avec: coupon_token="w3w5vGt4Vs0JEGp69iMx..."
    ↓
11. Backend valide le token (status doit être "pending")
    ↓
12. Marque token comme "applied-pending" (bloque la réutilisation)
    ↓
13. Crée session Stripe de 42.50€
    ↓
14. Client effectue le paiement Stripe
    ↓
15. Stripe confirme le paiement
    ↓
16. Backend reçoit la confirmation
    ↓
17. Met à jour status: "applied-pending" → "applied"
    ↓
18. Incrémente coupons.currentUses += 1
    ↓
19. Génère et envoie la carte cadeau
    ↓
20. ✓ Coupon validé et utilisé !
```

---

## 🚀 Pour Tester

### Script Python de test

```bash
cd /Users/ericherduin/Projet_SitesWeb_Officiel/Site\ Lea\ Beaute/backend
python test_coupon_system.py
```

### Curl manual

**1. Créer un coupon (admin)**
```bash
curl -X POST "http://localhost:8000/api/coupons" \
  -H "Content-Type: application/json" \
  -H "Authorization: LEABeaute369" \
  -d '{
    "code": "NOEL2025",
    "type": "percentage",
    "value": 20,
    "validTo": "2025-12-31T23:59:59Z",
    "isActive": true,
    "maxUses": 50
  }'
```

**2. Valider un coupon (client)**
```bash
curl -X POST "http://localhost:8000/api/coupons/validate?code=NOEL2025"
```

**3. Utiliser au checkout (client)**
```bash
curl -X POST "http://localhost:8000/api/gift-cards/create-checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50,
    "origin_url": "http://localhost:3000",
    "buyer_firstname": "Jean",
    "buyer_lastname": "Dupont",
    "buyer_email": "jean@example.com",
    "buyer_phone": "0612345678",
    "coupon_token": "TOKEN_FROM_VALIDATE"
  }'
```

---

## 💡 Cas d'Usage

### Cas 1 : Bon plan été
```
Code: SUMMER2025
Type: Pourcentage
Valeur: 15%
Max: 1000 utilisations
Valide: 01/06/2025 au 31/08/2025
```

### Cas 2 : Offre spéciale clients
```
Code: LOYAL50
Type: Montant fixe
Valeur: 50€
Max: 10 utilisations
Valide: Aujourd'hui au 31/12/2025
```

### Cas 3 : Coupon VIP
```
Code: VIP30
Type: Pourcentage
Valeur: 30%
Max: Illimité
Valide: Permanent
```

---

## 🔐 Sécurité

### ✅ Protections Implémentées

| Protection | Détail |
|-----------|--------|
| **Tokens uniques** | Chaque validation génère un token aléatoire de 32 bytes |
| **État transactionnel** | pending → applied ou canceled uniquement |
| **Une utilisation par token** | Un token ne peut pas être réutilisé pour 2 checkouts |
| **Vérification du backend** | Tous les tokens validés côté serveur |
| **Limite d'utilisations** | Compteur `currentUses` <= `maxUses` |
| **Dates d'expiration** | `validTo` vérifié à chaque validation |
| **Audit trail** | `created_at`, `applied_at` enregistrés |
| **Cleanup automatique** | Annulation si paiement échoue |

### ⚠️ Recommandations Production

1. **Rate limiting** sur `/coupons/validate`
   ```python
   # Ajouter slowapi ou similar
   limiter = Limiter(key_func=get_remote_address)
   @limiter.limit("10/minute")
   ```

2. **Logging détaillé**
   ```python
   logger.info(f"Coupon {code} validated for {ip_address}")
   logger.warning(f"Failed coupon validation: {code}, {reason}")
   logger.error(f"Coupon usage anomaly detected: {code}")
   ```

3. **Monitoring des coupons**
   - Alerter si utilisation > 80% du max
   - Vérifier les coupons jamais utilisés
   - Analyser les patterns de validation

4. **Données sensibles**
   - Ne pas exposer les tokens dans les logs
   - Utiliser HTTPS uniquement
   - Valider CORS correctement

---

## 📊 Données Stockées

### Collection `coupons`
```json
{
  "id": "uuid",
  "code": "SUMMER2025",
  "type": "percentage",
  "value": 15,
  "currency": "EUR",
  "validFrom": "2025-06-01T00:00:00Z",
  "validTo": "2025-08-31T23:59:59Z",
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00Z",
  "maxUses": 1000,
  "currentUses": 47
}
```

### Collection `coupon_usages`
```json
{
  "id": "uuid",
  "coupon_code": "SUMMER2025",
  "validation_token": "w3w5vGt4Vs0JEGp69iMx...",
  "session_id": "cs_test_...",
  "gift_card_id": "uuid",
  "status": "applied",  // pending | applied-pending | applied | canceled
  "created_at": "2025-02-03T10:30:00Z",
  "applied_at": "2025-02-03T10:35:00Z"
}
```

---

## 🐛 Dépannage

### Le coupon ne s'applique pas

**Problème**: "Coupon not found"
- **Solution**: Vérifier le code exact (sensibilité à la casse)

**Problème**: "Coupon is inactive"
- **Solution**: Activer le coupon dans l'admin

**Problème**: "Coupon has expired"
- **Solution**: Vérifier la date `validTo`

**Problème**: "Coupon usage limit reached"
- **Solution**: Augmenter `maxUses` ou créer un nouveau coupon

### Le token est rejeté au checkout

**Problème**: "Invalid coupon token"
- **Solution**: Le token est invalide (trop vieux, erreur de copie)

**Problème**: "Coupon already used or invalid"
- **Solution**: Le token a déjà été utilisé dans un checkout précédent

### Les utilisations ne s'incrémentent pas

**Problème**: `currentUses` reste à 0
- **Solution**: Le paiement doit être confirmé pour incrémenter
- **Vérifier**: Le paiement est-il marqué comme "paid" par Stripe ?

---

## 📞 Support

Pour des questions sur le système, consultez :
- `/COUPON_SYSTEM.md` - Documentation technique complète
- `test_coupon_system.py` - Exemples de tests
- `backend/server.py` - Implémentation (lignes 775-820 pour validation)

