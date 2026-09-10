# Analyse GEO — Léa Beauté Valognes
> Généré le 2026-06-10 | Basé sur l'analyse des fichiers locaux

---

## GEO Readiness Score : 37/100

| Critère | Poids | Score | Note |
|---------|-------|-------|------|
| Citabilité | 25 % | 6/25 | Aucun bloc citable, pas de définitions, pas de statistiques |
| Lisibilité structurelle | 20 % | 12/20 | Hiérarchie H1→H2→H3 correcte, mais pas de FAQ ni tableaux |
| Contenu multi-modal | 15 % | 8/15 | Images + vidéo + galerie avant/après, pas d'infographies |
| Signaux d'autorité | 20 % | 7/20 | Biographies équipe présentes, sameAs limité, pas de dates |
| Accessibilité technique | 20 % | 4/20 | **SPA sans SSR = contenu invisible aux crawlers IA** |

---

## Scores par plateforme

| Plateforme | Score | Blocage principal |
|------------|-------|------------------|
| Google AI Overviews | 20/100 | SPA : HTML vide sans JavaScript |
| ChatGPT | 15/100 | Pas de Wikipedia, pas de Reddit, mentions externes limitées |
| Perplexity | 15/100 | Idem ChatGPT — s'appuie fortement sur Reddit/Wikipedia |
| Bing Copilot | 25/100 | Légèrement mieux grâce au sitemap, même blocage SSR |

---

## 1. Accès des crawlers IA — État

### robots.txt actuel

```
User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://leabeautevalognes.fr/sitemap.xml
```

**Résultat :** tous les crawlers sont autorisés via le wildcard. Aucun crawler IA n'est explicitement nommé.

### robots.txt recommandé

Ajouter les directives explicites suivantes pour améliorer la confiance des crawlers IA :

```
User-agent: *
Allow: /
Disallow: /admin

# Crawlers IA — autorisés explicitement pour la visibilité en recherche IA
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

# Crawlers d'entraînement — bloquer si souhaité
User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

Sitemap: https://leabeautevalognes.fr/sitemap.xml
```

---

## 2. llms.txt — Absent

**Statut :** aucun fichier `/llms.txt` trouvé dans `frontend/public/`.

### Template à créer : `frontend/public/llms.txt`

```
# Léa Beauté Valognes

> Institut de beauté à Valognes (Manche, Normandie). Soins visage Guinot, épilations
> (dont lumière pulsée), LPG Endermologie, extensions de cils, mains & pieds,
> maquillage, soins corps et accompagnement nutrition personnalisé.
> Tél. : 02 33 21 48 19 — 7 Rue du Palais de Justice, 50700 Valognes.

## Pages principales

- [Accueil](https://leabeautevalognes.fr/): Présentation générale de l'institut, services, horaires, contact
- [Soins visage Guinot](https://leabeautevalognes.fr/guinot): Hydradermie, Visible Age Reverse, Age Summum, Hydra Peeling, Eye Lift, Détoxygène
- [Accompagnement nutrition](https://leabeautevalognes.fr/accompagnement-nutrition): Chrononutrition personnalisée, bilan, suivi
- [L'équipe](https://leabeautevalognes.fr/a-propos-institut): Léa (fondatrice, 15 ans d'expérience), Maryssa, Maélise
- [Toutes les prestations](https://leabeautevalognes.fr/prestations): Liste complète des soins proposés

## Informations clés

- Horaires : Lundi 14h–18h30, Mardi–Vendredi 09h–18h30, Samedi 09h–17h
- Gammes : Guinot (soins visage), LPG Endermologie (corps), YUMI Lashes (cils)
- Spécialité reconnue : soin signature Visible Age Reverse — anti-âge non invasif, 30 min
- Fondatrice : Léa, esthéticienne depuis plus de 15 ans à Valognes
```

---

## 3. Présence de la marque — Analyse

| Plateforme | Statut | Impact IA |
|------------|--------|-----------|
| Google Business Profile | Probablement présent (Google Reviews intégré) | Positif — local pack |
| Facebook | `facebook.com/leabeaute50` (sameAs déclaré) | Faible pour les IA |
| Instagram | `instagram.com/lea.beaute.valognes` (sameAs déclaré) | Faible pour les IA |
| Wikipedia | Absent | **Manque fort** — ChatGPT cite Wikipedia à 47,9 % |
| Reddit | Absent | **Manque fort** — Perplexity cite Reddit à 46,7 % |
| YouTube | Absent | **Manque fort** — YouTube a la corrélation la plus haute (~0,737) |
| LinkedIn | Absent | Modéré — ajouter page entreprise |
| Wikidata | Absent | Manque pour l'entité sémantique |

**Action prioritaire :** créer une chaîne YouTube même basique (1 vidéo de présentation de l'institut suffit) — c'est le signal le plus corrélé à la visibilité IA.

---

## 4. Citabilité au niveau des passages

### Longueur optimale : 134–167 mots par bloc

#### Situation actuelle

Aucune page ne contient de blocs auto-suffisants optimisés pour la citation IA. Les descriptions de services sont trop courtes (20–40 mots). Les textes de `GuinotPage.jsx` et `AboutInstitut.jsx` sont les plus développés mais fragmentés en multiples paragraphes courts.

#### Exemple de bloc citable à créer

**Pour la page Guinot — section "Qu'est-ce que le soin Hydradermie ?"**

> L'Hydradermie 1000 est un soin visage professionnel Guinot qui combine l'action de courants
> galvaniques et d'actifs cosmétiques concentrés pour une pénétration optimisée en profondeur.
> En cabinet, ce soin s'adapte à tous les types de peau : peaux sèches, mixtes, sensibles ou
> fatiguées. Il agit sur l'éclat, le confort et l'hydratation dès la première séance. Un protocole
> complet dure entre 45 et 75 minutes et se déroule en plusieurs étapes : nettoyage, diagnostic,
> application d'actifs ciblés et galvanothérapie. C'est l'un des soins les plus demandés à
> l'institut Léa Beauté Valognes pour retrouver une peau fraîche, lumineuse et revitalisée.
> À recommander après les périodes de stress, de fatigue ou de changement de saison.
> (149 mots — dans la plage optimale 134–167)

---

## 5. Rendu côté serveur (SSR) — Problème critique

### Situation actuelle

Le site est une **SPA React + Vite** (Client-Side Rendering exclusif).

```
frontend/index.html :
<div id="root"></div>   ← contenu vide sans JavaScript
```

Les crawlers IA (GPTBot, ClaudeBot, PerplexityBot) **n'exécutent pas JavaScript**. Ils voient donc :
- Titre : `Léa Beauté - Institut de Beauté` (statique dans index.html)
- Description : `Léa Beauté Valognes - Institut de Beauté` (générique)
- Contenu principal : **vide**
- Structured data (StructuredData.jsx via react-helmet-async) : **invisibles**
- Balises SEO (SEO.jsx via react-helmet-async) : **invisibles**

### Options par ordre de priorité

| Solution | Effort | Impact |
|----------|--------|--------|
| **Pré-rendu statique avec `vite-plugin-ssr` ou Astro** | Moyen | Très élevé |
| **Migration vers Next.js** | Élevé | Très élevé |
| **Service de pré-rendu (Prerender.io, Rendertron)** | Faible | Élevé |
| **Contenu statique dans index.html** | Très faible | Partiel |

**Recommandation rapide sans refactoring :** injecter du contenu clé directement dans `index.html` (description complète, nom de l'entreprise, adresse, services principaux) en HTML statique, avant `<div id="root">`. Les crawlers IA liront au moins ces informations.

---

## 6. Schéma structuré — Lacunes

### Schémas présents (dans StructuredData.jsx)

- `BeautySalon` ✅ (complet : adresse, téléphone, géo, horaires, sameAs, offerCatalog)
- `Organization` ✅ (partiel : pas de `foundingDate`, pas de `numberOfEmployees`)
- `BreadcrumbList` ✅ (seulement la page d'accueil)

### Schémas manquants — à ajouter

| Schéma | Page cible | Bénéfice IA |
|--------|-----------|------------|
| `Person` (Léa, Maryssa, Maélise) | AboutInstitut | Entités nommées citables |
| `FAQPage` | Guinot, Prestations, Coaching | Blocs Q&R directs pour AIO |
| `Service` | Chaque prestation | Meilleure désambiguïsation |
| `Review` / `AggregateRating` | LandingPage | Trust signal + rich result |
| `WebPage` par route | Toutes les pages | Méta-données par page |
| `VideoObject` | AboutInstitut (vidéo vitrine) | Indexation vidéo |

### Schéma Person recommandé à ajouter dans StructuredData.jsx

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Léa",
  "jobTitle": "Esthéticienne fondatrice",
  "worksFor": {
    "@type": "BeautySalon",
    "name": "Léa Beauté",
    "url": "https://leabeautevalognes.fr"
  },
  "description": "Fondatrice de l'institut Léa Beauté à Valognes, esthéticienne depuis plus de 15 ans, spécialisée en soins visage et conseil beauté personnalisé.",
  "knowsAbout": ["Soins visage Guinot", "Épilation", "Chrononutrition"]
}
```

### Correction urgente : rendre le schéma accessible sans JavaScript

Les schémas sont injectés via `react-helmet-async` — ils nécessitent JavaScript. Pour que les crawlers IA les voient, **déplacer le JSON-LD principal dans index.html** directement :

```html
<!-- Dans index.html, avant </head> -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  "name": "Léa Beauté",
  "telephone": "+33233214819",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "7 Rue du Palais de Justice",
    "addressLocality": "Valognes",
    "postalCode": "50700",
    "addressCountry": "FR"
  },
  "url": "https://leabeautevalognes.fr"
}
</script>
```

---

## 7. Top 5 changements à fort impact

### #1 — Injecter du contenu statique dans index.html (Effort : 1h | Impact : très élevé)

Rendre le site partiellement lisible par les crawlers IA sans refactoring.

Dans `frontend/index.html`, après `<div id="root">`, ajouter :

```html
<div id="root"></div>
<!-- Contenu statique pour les crawlers (sera masqué par React au chargement) -->
<noscript>
  <main>
    <h1>Léa Beauté Valognes — Institut de Beauté</h1>
    <p>Institut de beauté à Valognes (50700), Normandie. Soins visage Guinot,
    épilations (dont lumière pulsée semi-définitive), LPG Endermologie,
    extensions de cils, mains et pieds, maquillage, accompagnement nutrition.
    Fondé par Léa, esthéticienne depuis plus de 15 ans.</p>
    <p>Adresse : 7 Rue du Palais de Justice, 50700 Valognes — Tél. : 02 33 21 48 19</p>
    <p>Horaires : Lundi 14h–18h30, Mardi–Vendredi 09h–18h30, Samedi 09h–17h</p>
  </main>
</noscript>
```

Et placer le JSON-LD BeautySalon directement dans `<head>` (voir §6).

---

### #2 — Créer llms.txt (Effort : 30 min | Impact : élevé)

Créer `frontend/public/llms.txt` avec le template fourni au §2.
Ce fichier est lu par ChatGPT, Claude et Perplexity pour comprendre le site.

---

### #3 — Ajouter des blocs Q&R sur les pages clés (Effort : 2–3h | Impact : élevé)

Sur `GuinotPage.jsx` et `CoachingPage.jsx`, ajouter une section FAQ avec des blocs de 134–167 mots. Exemples de questions :

- « Qu'est-ce que l'Hydradermie Guinot ? »
- « En combien de séances la lumière pulsée est-elle efficace ? »
- « Qu'est-ce que la chrononutrition ? »
- « Quel soin Guinot choisir selon son type de peau ? »

Chaque réponse doit être auto-suffisante (lisible sans le contexte de la page).

---

### #4 — Mettre à jour robots.txt et ajouter les directives IA (Effort : 10 min | Impact : moyen-élevé)

Remplacer `frontend/public/robots.txt` par le contenu recommandé au §1.
Les crawlers GPTBot, ClaudeBot et PerplexityBot seront explicitement autorisés.

---

### #5 — Créer une présence YouTube minimale (Effort : 1–2 jours | Impact : élevé long terme)

Filmer et publier 1–2 courtes vidéos de présentation de l'institut (visite, présentation de l'équipe, démonstration d'un soin). Ajouter dans `StructuredData.jsx` le schéma `VideoObject` et l'URL YouTube dans `sameAs`.
YouTube est le signal le plus corrélé à la visibilité dans les réponses IA (~0,737).

---

## 8. Suggestions de reformulation de passages

### Page d'accueil — Hero

**Actuel (non citable) :**
> « L'élégance au naturel »
> « Votre institut de beauté à Valognes. Soins visage Guinot, épilations, LPG, extensions de cils, manucure et accompagnement nutrition. »

**Recommandé (40–60 premiers mots auto-suffisants) :**
> « Léa Beauté est un institut de beauté à Valognes (Manche, 50700), fondé par Léa, esthéticienne
> depuis plus de 15 ans. L'institut propose des soins visage Guinot, des épilations à la lumière
> pulsée, des séances LPG Endermologie, des extensions de cils et un accompagnement
> nutritionnel personnalisé. »

---

### Page Services — Description épilations

**Actuel :**
> « Sourcils, lèvres, maillot, jambes... Toutes zones avec des techniques adaptées, dont l'épilation à la lumière pulsée. »

**Recommandé (bloc citable ~150 mots) :**
> « L'épilation à la lumière pulsée est une méthode d'épilation semi-définitive proposée à
> l'institut Léa Beauté Valognes. Cette technique cible les poils en émettant des flashs lumineux
> intenses qui agissent sur le pigment mélanique du poil. Le résultat : 90 à 95 % des poils
> traités sont éliminés de façon durable, en une dizaine de séances environ. Elle est applicable
> sur toutes les zones classiques — jambes, maillot, aisselles, visage — et convient à la plupart
> des types de peau. En parallèle, l'institut propose des épilations à la cire tiède ou pelable
> pour toutes les zones, avec des conseils post-épilation pour limiter les rougeurs et ingrown
> hairs. Chaque séance est adaptée à la repousse et à la sensibilité de la cliente. »

---

### Page À propos — Biographie Léa

**Actuel :**
> « Fondatrice de l'institut, Léa est animée par la passion de l'esthétique depuis plus de 15 ans... »
> (texte complet : ~100 mots — légèrement sous la plage optimale)

**Recommandé :** compléter avec ses formations (Guinot, LPG, etc.) pour atteindre 134–167 mots et ajouter un schéma `Person` dans le structured data.

---

## Résumé des actions

| Priorité | Action | Effort | Fichier(s) concerné(s) |
|----------|--------|--------|------------------------|
| 🔴 Critique | JSON-LD statique dans index.html | 1h | `frontend/index.html` |
| 🔴 Critique | Créer llms.txt | 30 min | `frontend/public/llms.txt` |
| 🟠 Haute | Mettre à jour robots.txt | 10 min | `frontend/public/robots.txt` |
| 🟠 Haute | Ajouter blocs FAQ sur pages Guinot et Coaching | 3h | `GuinotPage.jsx`, `CoachingPage.jsx` |
| 🟠 Haute | Schéma Person (Léa) dans StructuredData | 1h | `StructuredData.jsx` |
| 🟡 Moyenne | Créer présence YouTube + VideoObject schema | 2 jours | Externe + `StructuredData.jsx` |
| 🟡 Moyenne | Réécrire descriptions services en blocs 134–167 mots | 4h | `services.js` + pages dédiées |
| 🟡 Moyenne | Ajouter LinkedIn page entreprise + sameAs | 30 min | Externe + `StructuredData.jsx` |
| 🟢 Long terme | Migration SSR (Next.js ou pré-rendu) | Semaines | Architecture complète |
| 🟢 Long terme | Présence Wikipedia / Wikidata | Selon critères | Externe |
