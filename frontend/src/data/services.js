import lpgImage from '../assets/photos/prestations/lpg.jpg';
import uvImage from '../assets/photos/prestations/uv.jpg';
import soinsVisageImage from '../assets/photos/prestations/soins_visage.jpg';
import epilationImage from '../assets/photos/prestations/epilation.jpg';
import extensionCilsImage from '../assets/photos/prestations/extensions_cils.jpg';
import mainsPiedsImage from '../assets/photos/prestations/soins_mains_et_pieds.jpg';
import maquillageImage from '../assets/photos/prestations/maquillage.jpg';
import soinsVisage2image from '../assets/photos/prestations/soins_visage_1.jpg';
import nutritionImage from '../assets/photos/prestations/Chrono nutrition.png';


export const services = [
  {
    id: 'epilations',
    imageSrc: epilationImage,
    imageAlt: "Épilations (sourcils, lèvres, maillot, jambes)",
    fallbackLetter: 'E',
    title: 'Épilations',
    description: 'Sourcils, lèvres, maillot, jambes... Toutes zones avec des techniques adaptées.',
    details: "Des gestes précis et une épilation adaptée à chaque zone pour une peau nette et confortable.",
    techniquesText: 'Cire tiède ou pelable selon la zone · Conseils pour limiter les rougeurs · Finitions soignées',
    duration: '20–45 min',
    pricingCategories: ['Epilations', 'Forfaits épilations']
  },
  {
    id: 'soins-visage-guinot',
    imageSrc: soinsVisage2image,
    imageAlt: 'Soins visage Guinot',
    fallbackLetter: 'G',
    title: 'Soins visage Guinot',
    description: 'Hydradermie, Hydra Peeling, Age Summum... Technologies brevetées pour une peau rajeunie.',
    details: "Des protocoles ciblés selon l'objectif beauté : éclat, fermeté, confort ou anti-âge global.",
    techniquesText: 'Diagnostic rapide en cabine · Technologies brevetées Guinot · Gestuelle experte',
    duration: '45–75 min',
    pricingCategories: ['Guinot - Soins visage']
  },
  {
    id: 'lpg',
    imageSrc: lpgImage,
    imageAlt: 'LPG Endermologie',
    fallbackLetter: 'L',
    title: 'LPG',
    description: 'Technologie mécanobiol Endermologie pour le corps. Forfaits et entretien disponibles.',
    details: "Des séances personnalisées pour améliorer la qualité de peau et accompagner les objectifs silhouette.",
    techniquesText: 'Endermologie Corps · Séances ciblées par zone · Suivi des progrès',
    duration: '35–45 min',
    pricingCategories: ['LPG']
  },
  {
    id: 'extensions-cils',
    imageSrc: extensionCilsImage,
    imageAlt: 'Extensions de cils',
    fallbackLetter: 'C',
    title: 'Extensions de cils',
    description: '1ère pose et remplissages. YUMI Lashes, réhaussement de cils et browlift.',
    details: "Un regard structuré avec des techniques adaptées à la forme des yeux et au résultat souhaité.",
    techniquesText: 'Extensions cil à cil · Réhaussement YUMI Lashes · Browlift',
    duration: '45–90 min',
    pricingCategories: ['Extensions de cils', 'YUMI']
  },
  {
    id: 'mains-pieds',
    imageSrc: mainsPiedsImage,
    imageAlt: 'Mains et pieds',
    fallbackLetter: 'M',
    title: 'Mains & Pieds',
    description: 'Manucure, semi-permanent, french, beauté des mains et pieds, paraffine.',
    details: "Des soins esthétiques et relaxants pour des mains et des pieds nets, doux et soignés.",
    techniquesText: 'Manucure & beauté des pieds · Semi-permanent & french · Paraffine confort',
    duration: '30–75 min',
    pricingCategories: ['Mains', 'Pieds']
  },
  {
    id: 'maquillage',
    imageSrc: maquillageImage,
    imageAlt: 'Maquillage',
    fallbackLetter: 'Q',
    title: 'Maquillage',
    description: "Maquillage jour, soir, forfait mariée. Cours d'auto-maquillage.",
    details: "Mise en beauté personnalisée selon l'événement, le style et la morphologie du visage.",
    techniquesText: 'Maquillage jour & soirée · Forfait mariée · Cours d’auto-maquillage',
    duration: '30–75 min',
    pricingCategories: ['Maquillage']
  },
  {
    id: 'soins-corps',
    imageSrc: lpgImage,
    imageAlt: 'Soins corps',
    fallbackLetter: 'S',
    title: 'Soins corps',
    description: 'Gommage, modelage, enveloppement. Rêve de détente, future maman, duo.',
    details: "Des rituels corps pour relâcher les tensions et retrouver une peau douce et confortable.",
    techniquesText: 'Gommage & enveloppement · Modelage relaxant · Rituels duo',
    duration: '45–90 min',
    pricingCategories: ['Soins corps', 'Soins corps spécifiques']
  },
  {
    id: 'accompagnement-nutrition',
    imageSrc: nutritionImage,
    imageAlt: 'Accompagnement nutrition - Chrononutrition',
    fallbackLetter: 'A',
    title: 'Accompagnement nutrition',
    description: 'Accompagnement nutritionnel personnalisé pour retrouver votre équilibre.',
    details: "Un accompagnement sur-mesure pour installer des habitudes simples et durables.",
    techniquesText: 'Bilan personnalisé · Suivi & ajustements · Conseils pratiques',
    duration: '45–60 min',
    pricingCategories: []
  },
  {
    id: 'autres-prestations',
    imageSrc: uvImage,
    imageAlt: 'Autres prestations',
    fallbackLetter: '+',
    title: 'Autres prestations',
    description: 'UV, pressothérapie, électrolyse, teinture cils/sourcils, strass dentaire.',
    details: "Des prestations complémentaires pour répondre à des besoins ciblés et ponctuels.",
    techniquesText: 'Pressothérapie · Teinture cils/sourcils · Électrolyse',
    duration: '15–45 min',
    pricingCategories: ['Autres soins', 'Électrolyse', 'Pressothérapie', 'UV', 'Épilation lumière pulsée']
  }
];
