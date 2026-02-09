import { Helmet } from 'react-helmet-async';

export default function StructuredData() {
  const businessData = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "name": "Léa Beauté",
  "image": "https://demo-client.htagfacility.fr/assets/photos/logos/logo16-9_1.png",
    "description": "Institut de beauté à Valognes proposant des soins Guinot, épilations, LPG, manucure, pédicure, extensions de cils et accompagnement nutrition.",
    "telephone": "+33233214819",
    "email": "contact@demo-client.htagfacility.fr",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "7 Rue du Palais de Justice",
      "addressLocality": "Valognes",
      "postalCode": "50700",
      "addressCountry": "FR",
      "addressRegion": "Normandie"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 49.508661,
      "longitude": -1.470834
    },
    "url": "https://demo-client.htagfacility.fr",
    "priceRange": "€€",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "19:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "17:00"
      }
    ],
    "sameAs": [
      "https://www.facebook.com/leabeautevalognes",
      "https://www.instagram.com/leabeautevalognes"
    ],
    "areaServed": {
      "@type": "City",
      "name": "Valognes",
      "containedIn": {
        "@type": "AdministrativeArea",
        "name": "Manche"
      }
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Services de beauté",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Soins visage Guinot",
            "description": "Soins du visage professionnels avec la marque Guinot"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Épilations",
            "description": "Épilations professionnelles pour femmes et hommes"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "LPG Endermologie",
            "description": "Soins LPG pour le corps et le visage"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Manucure et Pédicure",
            "description": "Soins des mains et des pieds"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Extensions de cils",
            "description": "Pose d'extensions de cils professionnelle"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Accompagnement nutrition",
            "description": "Coaching en chrononutrition personnalisé"
          }
        }
      ]
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": "https://demo-client.htagfacility.fr"
      }
    ]
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Léa Beauté",
  "url": "https://demo-client.htagfacility.fr",
  "logo": "https://demo-client.htagfacility.fr/assets/photos/logos/logo16-9_1.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+33233214819",
      "contactType": "customer service",
      "areaServed": "FR",
      "availableLanguage": "French"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(businessData)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbData)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(organizationData)}
      </script>
    </Helmet>
  );
}
