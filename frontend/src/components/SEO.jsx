import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title = "Léa Beauté Valognes - Institut de Beauté et Bien-être",
  description = "Institut de beauté à Valognes (50). Soins Guinot, épilations, LPG, manucure, pédicure, extensions de cils, accompagnement nutrition. Prenez RDV au 02 33 21 48 19.",
  keywords = "institut beauté Valognes, Guinot, épilation, LPG, manucure, pédicure, soins visage, accompagnement nutrition, chrononutrition, extensions cils, Manche 50",
  image = "https://customer-assets.emergentagent.com/job_2c5a61ba-d41e-4013-9ecc-f1a07917e6f6/artifacts/hpgw4x9j_logo16-9_1.png",
  url = "https://lea-beaute-valognes.fr",
  type = "website"
}) {
  const fullTitle = title.includes('Léa Beauté') ? title : `${title} | Léa Beauté Valognes`;
  
  return (
    <Helmet>
      {/* Meta tags de base */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:site_name" content="Léa Beauté Valognes" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Informations géographiques */}
      <meta name="geo.region" content="FR-50" />
      <meta name="geo.placename" content="Valognes" />
      <meta name="geo.position" content="49.508661;-1.470834" />
      <meta name="ICBM" content="49.508661, -1.470834" />
      
      {/* Robots */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      
      {/* Canonical */}
      <link rel="canonical" href={url} />
      
      {/* Langues alternatives */}
      <link rel="alternate" hrefLang="fr" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />
      
      {/* Preconnect pour performance */}
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
    </Helmet>
  );
}
