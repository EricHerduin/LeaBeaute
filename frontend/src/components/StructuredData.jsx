import { Helmet } from 'react-helmet-async';

// Note : le JSON-LD principal (BeautySalon + Organization) est injecté statiquement
// dans index.html pour être crawlable sans JS. Ce composant ajoute uniquement
// le BreadcrumbList dynamique et les schémas de pages spécifiques.
export default function StructuredData() {
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": "https://leabeautevalognes.fr"
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbData)}
      </script>
    </Helmet>
  );
}
