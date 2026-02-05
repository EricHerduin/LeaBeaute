# Tests Playwright - Léa Beauté

## 🎯 Installation

Les navigateurs sont déjà installés. Si besoin :
```bash
npx playwright install
```

## 🚀 Lancer les tests

### Tous les navigateurs (Chrome, Firefox, Safari)
```bash
npx playwright test
```

### Un navigateur spécifique
```bash
# Chrome uniquement
npx playwright test --project=chromium

# Firefox uniquement
npx playwright test --project=firefox

# Safari uniquement
npx playwright test --project=webkit
```

### En mode interactif (UI)
```bash
npx playwright test --ui
```

### Avec interface visuelle (headed)
```bash
npx playwright test --headed
```

### Un fichier de test spécifique
```bash
npx playwright test tests/home.spec.js
npx playwright test tests/navigation.spec.js
npx playwright test tests/responsive.spec.js
```

## 📊 Voir les rapports

Après avoir lancé les tests :
```bash
npx playwright show-report
```

## 🔍 Tests disponibles

### ✅ home.spec.js
- Chargement de la page d'accueil
- Affichage du hero section
- Navigation vers Guinot
- Navigation vers Accompagnement nutrition

### ✅ navigation.spec.js
- Liens de navigation présents
- Menu mobile (ouverture/fermeture)
- ScrollToTop fonctionnel

### ✅ responsive.spec.js
- Affichage Mobile (375px)
- Affichage Tablet (768px)
- Affichage Desktop (1920px)
- Animations sans erreurs

### ✅ 404.spec.js
- Page 404 s'affiche correctement
- Bouton retour à l'accueil fonctionne
- Animation CSS présente

### ✅ performance.spec.js
- Temps de chargement < 5s
- Images avec attribut alt
- Aucune erreur console critique

### ✅ accessibility.spec.js
- Liens cliquables
- Navigation au clavier
- Contrastes suffisants

## 🎨 Screenshots

Les screenshots sont générés dans `tests/screenshots/` :
- `mobile-home.png`
- `tablet-home.png`
- `desktop-home.png`

## 💡 Astuces

### Debug un test
```bash
npx playwright test --debug
```

### Générer un test automatiquement
```bash
npx playwright codegen localhost:3000
```

### Tests en mode watch (re-run automatique)
```bash
npx playwright test --watch
```

## 🌐 Navigateurs testés

- ✅ **Chrome** (Chromium)
- ✅ **Firefox**
- ✅ **Safari** (WebKit)
- ✅ **Mobile Chrome** (Pixel 5)
- ✅ **Mobile Safari** (iPhone 12)

## 📝 Ajouter un nouveau test

Créez un fichier `tests/mon-test.spec.js` :
```javascript
import { test, expect } from '@playwright/test';

test('mon test', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Mon texte')).toBeVisible();
});
```

## 🚨 Dépannage

**Les tests échouent ?**
- Vérifiez que le serveur frontend tourne sur `localhost:3000`
- Vérifiez que le backend tourne sur `localhost:8000`
- Exécutez `npx playwright install` pour réinstaller les navigateurs

**Erreur "Cannot find module" ?**
```bash
npm install --save-dev @playwright/test
```
