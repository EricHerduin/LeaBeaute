# 🌟 Avis Google - Guide de Configuration

## 📋 Prérequis

Avant de commencer, vous aurez besoin de :
1. Un compte Google Cloud Platform
2. Votre établissement sur Google Business Profile
3. 15-20 minutes pour la configuration

## 🚀 Étape 1 : Obtenir votre Place ID

### Méthode facile (Place ID Finder) :
1. Allez sur : https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
2. Recherchez "Léa Beauté Valognes" dans la barre de recherche
3. Copiez le **Place ID** qui commence par `ChIJ...`

### Méthode alternative (Google Maps) :
1. Recherchez votre établissement sur Google Maps
2. L'URL contiendra quelque chose comme `.../@49.508661,-1.470834,17z/data=!4m...`
3. Utilisez le Place ID Finder avec ces coordonnées

**Exemple de Place ID** : `ChIJN1t_tDeuEmsRUsoyG83frY4`

---

## 🔑 Étape 2 : Créer une API Key Google Places

### 1. Accéder à Google Cloud Console
- Allez sur : https://console.cloud.google.com/
- Connectez-vous avec votre compte Google

### 2. Créer un projet
```
1. Cliquez sur le menu déroulant du projet (en haut)
2. Cliquez sur "Nouveau projet"
3. Nom : "Lea Beaute Website"
4. Cliquez sur "Créer"
```

### 3. Activer l'API Places
```
1. Menu latéral → "APIs & Services" → "Bibliothèque"
2. Recherchez "Places API"
3. Cliquez sur "Places API"
4. Cliquez sur "Activer"
```

### 4. Créer les credentials
```
1. Menu latéral → "APIs & Services" → "Identifiants"
2. Cliquez sur "+ CRÉER DES IDENTIFIANTS"
3. Sélectionnez "Clé API"
4. Copiez la clé générée (elle ressemble à : AIzaSyC_XxXxXxXxXxXxXxXxXxXxXxXxXxX)
```

### 5. Sécuriser votre API Key
```
1. Cliquez sur le nom de la clé créée
2. Restrictions de clé API → "Restreindre la clé"
3. Restrictions d'API → Sélectionnez "Places API"
4. Restrictions d'application :
   - Type : "Référents HTTP (sites web)"
   - Référents du site web :
     * http://localhost:3000/*
     * http://localhost:8000/*
     * https://lea-beaute-valognes.fr/*
     * https://www.lea-beaute-valognes.fr/*
5. Enregistrer
```

---

## ⚙️ Étape 3 : Configuration Backend

### 1. Installer httpx (client HTTP async)
```bash
cd backend
source .venv/bin/activate  # ou votre environnement virtuel
pip install httpx
```

### 2. Ajouter les variables d'environnement
Éditez le fichier `backend/.env` :

```bash
# Google Places API
GOOGLE_PLACES_API_KEY=AIzaSyC_XxXxXxXxXxXxXxXxXxXxXxXxXxX
GOOGLE_PLACE_ID=ChIJN1t_tDeuEmsRUsoyG83frY4
```

⚠️ **Remplacez** ces valeurs par vos véritables clés !

---

## ⚙️ Étape 4 : Configuration Frontend

Éditez le fichier `frontend/.env` :

```bash
# Google Places (pour le bouton "Laisser un avis")
REACT_APP_GOOGLE_PLACE_ID=ChIJN1t_tDeuEmsRUsoyG83frY4
```

---

## 🧪 Étape 5 : Tester

### 1. Redémarrer le backend
```bash
cd backend
source .venv/bin/activate
python server.py
```

### 2. Redémarrer le frontend
```bash
cd frontend
npm start
```

### 3. Tester l'endpoint backend
Ouvrez dans un navigateur :
```
http://localhost:8000/api/google-reviews
```

Vous devriez voir un JSON avec :
```json
{
  "name": "Léa Beauté",
  "rating": 4.8,
  "user_ratings_total": 42,
  "reviews": [...]
}
```

### 4. Vérifier le frontend
- Ouvrez http://localhost:3000
- Scrollez jusqu'en bas de page
- Vous devriez voir la section "Ce qu'en pensent nos client·e·s"

---

## 🎨 Fonctionnalités

### ✅ Ce qui est affiché :
- Score Google global (ex: 4.8/5)
- Nombre total d'avis
- Logo Google authentique
- Les 5 avis les plus récents avec :
  - Photo de profil de l'auteur
  - Nom de l'auteur
  - Note en étoiles
  - Texte de l'avis (limité à 6 lignes)
  - Date relative (ex: "il y a 2 semaines")
  - **Réponse du propriétaire** (si elle existe)
  - Lien vers l'avis sur Google

### ✅ Design :
- Cards blanches avec ombre
- Animation au scroll (framer-motion)
- Responsive (mobile/tablet/desktop)
- Titre inclusif : "Ce qu'en pensent nos client·e·s"
- Bouton call-to-action : "Laisser un avis Google"

---

## 💡 Optimisations recommandées

### 1. Cache des avis (pour éviter les quotas API)
Ajoutez un cache Redis ou simplement un cache mémoire :

```python
# Dans server.py
from datetime import datetime, timedelta

# Cache simple en mémoire
reviews_cache = {
    "data": None,
    "timestamp": None
}

@api_router.get("/google-reviews")
async def get_google_reviews():
    # Vérifier le cache (valide 1 heure)
    if reviews_cache["data"] and reviews_cache["timestamp"]:
        if datetime.now() - reviews_cache["timestamp"] < timedelta(hours=1):
            return reviews_cache["data"]
    
    # ... votre code actuel ...
    
    # Sauvegarder dans le cache
    result = { "name": ..., "rating": ..., ... }
    reviews_cache["data"] = result
    reviews_cache["timestamp"] = datetime.now()
    
    return result
```

### 2. Fallback en cas d'erreur
Le composant React n'affiche rien si l'API échoue (comportement actuel). Vous pouvez aussi afficher des avis statiques en fallback.

### 3. Monitoring
Surveillez vos quotas Google Places API :
- Console Google Cloud → APIs & Services → Dashboard
- Quota gratuit : 150 requêtes/jour (largement suffisant avec cache)

---

## 🔒 Sécurité

### ✅ Bonnes pratiques :
- ✅ API Key restreinte aux domaines autorisés
- ✅ API Key restreinte à Places API uniquement
- ✅ Clé stockée dans .env (jamais commitée)
- ✅ CORS configuré sur le backend
- ✅ Pas d'exposition de la clé côté frontend

### ⚠️ À ne JAMAIS faire :
- ❌ Committer le fichier .env
- ❌ Exposer la clé API dans le code frontend
- ❌ Utiliser une clé non restreinte
- ❌ Partager la clé publiquement

---

## 📊 Quotas Google Places API

### Plan gratuit :
- 150 requêtes/jour
- Place Details : $0.017 par requête après quota gratuit

### Avec cache (1h) :
- ~24 requêtes/jour maximum
- Largement dans le quota gratuit ✅

---

## 🐛 Dépannage

### Erreur : "Google Places API not configured"
→ Vérifiez que GOOGLE_PLACES_API_KEY et GOOGLE_PLACE_ID sont dans `.env`

### Erreur : "Google API error: REQUEST_DENIED"
→ Votre API Key n'est pas activée ou restreinte incorrectement
→ Vérifiez les restrictions dans Google Cloud Console

### Erreur : "This API project is not authorized to use this API"
→ L'API Places n'est pas activée pour votre projet
→ Activez-la dans la bibliothèque d'APIs

### Les avis ne s'affichent pas
→ Ouvrez la console du navigateur (F12)
→ Regardez l'onglet Network pour voir l'appel API
→ Vérifiez les logs du backend

### CORS Error
→ Vérifiez que CORS_ORIGINS dans backend/.env inclut http://localhost:3000

---

## 📞 Support

### Documentation officielle :
- Google Places API : https://developers.google.com/maps/documentation/places/web-service/overview
- Place Details : https://developers.google.com/maps/documentation/places/web-service/place-details

### Obtenir de l'aide :
- Google Cloud Support : https://cloud.google.com/support
- Stack Overflow : https://stackoverflow.com/questions/tagged/google-places-api

---

## ✅ Checklist finale

Avant de déployer en production :

- [ ] API Key Google Places créée et restreinte
- [ ] Place ID récupéré et testé
- [ ] Variables d'environnement configurées (backend + frontend)
- [ ] httpx installé dans le backend
- [ ] Cache implémenté (recommandé)
- [ ] Test local réussi
- [ ] Fichier .env ajouté au .gitignore
- [ ] CORS configuré pour le domaine de production
- [ ] Monitoring des quotas activé

---

**Date de création** : 5 février 2026  
**Version** : 1.0
