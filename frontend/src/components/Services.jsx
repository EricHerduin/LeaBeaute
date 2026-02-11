import { motion } from 'framer-motion';

function ServiceVisual({ src, alt, fallbackLetter }) {
  return (
    <div className="relative w-20 h-20 md:w-24 md:h-24">
      <div className="absolute inset-0 rounded-2xl bg-white shadow-sm border border-[#E8DCCA]" />

      <div className="absolute inset-[6px] rounded-xl overflow-hidden bg-[#F7F4EC]">
        <span className="absolute inset-0 grid place-items-center text-base md:text-lg font-semibold text-[#1A1A1A]/70">
          {fallbackLetter}
        </span>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            // Keep the fallback letter visible if the image is missing.
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}

export default function Services({ onShowPricing }) {
  const services = [
    {
      imageSrc: '/images/services/epilations.jpg',
      imageAlt: "Épilations (sourcils, lèvres, maillot, jambes)",
      fallbackLetter: 'E',
      title: 'Épilations',
      description: 'Sourcils, lèvres, maillot, jambes... Toutes zones avec des techniques adaptées.'
    },
    {
      imageSrc: '/assets/photos/services/soins - visage - guinot.jpg',
      imageAlt: 'Soins visage Guinot',
      fallbackLetter: 'G',
      title: 'Soins visage Guinot',
      description: 'Hydradermie, Hydra Peeling, Age Summum... Technologies brevetées pour une peau rajeunie.'
    },
    {
      imageSrc: '/images/services/lpg.jpg',
      imageAlt: 'LPG Endermologie',
      fallbackLetter: 'L',
      title: 'LPG',
      description: 'Technologie mécanobiol Endermologie pour le corps. Forfaits et entretien disponibles.'
    },
    {
      imageSrc: '/images/services/extensions-cils.jpg',
      imageAlt: 'Extensions de cils',
      fallbackLetter: 'C',
      title: 'Extensions de cils',
      description: '1ère pose et remplissages. YUMI Lashes, réhaussement de cils et browlift.'
    },
    {
      imageSrc: '/images/services/mains-pieds.jpg',
      imageAlt: 'Mains et pieds',
      fallbackLetter: 'M',
      title: 'Mains & Pieds',
      description: 'Manucure, semi-permanent, french, beauté des mains et pieds, paraffine.'
    },
    {
      imageSrc: '/images/services/maquillage.jpg',
      imageAlt: 'Maquillage',
      fallbackLetter: 'Q',
      title: 'Maquillage',
      description: "Maquillage jour, soir, forfait mariée. Cours d'auto-maquillage."
    },
    {
      imageSrc: '/images/services/soins-corps.jpg',
      imageAlt: 'Soins corps',
      fallbackLetter: 'S',
      title: 'Soins corps',
      description: 'Gommage, modelage, enveloppement. Rêve de détente, future maman, duo.'
    },
    {
      imageSrc: '/images/services/chrononutrition.jpg',
      imageAlt: 'Accompagnement nutrition - Chrononutrition',
      fallbackLetter: 'A',
      title: 'Accompagnement nutrition',
      description: 'Accompagnement nutritionnel personnalisé pour retrouver votre équilibre.'
    },
    {
      imageSrc: '/images/services/autres-prestations.jpg',
      imageAlt: 'Autres prestations',
      fallbackLetter: '+',
      title: 'Autres prestations',
      description: 'UV, pressothérapie, électrolyse, teinture cils/sourcils, strass dentaire.'
    }
  ];

  return (
    <section id="services" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-[#1A1A1A]">
            Nos <span className="gold-gradient-text italic">prestations</span>
          </h2>
          <p className="text-lg md:text-xl text-[#4A4A4A] max-w-3xl mx-auto leading-relaxed">
            Un large éventail de soins pour sublimer votre beauté naturelle
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              className="service-card rounded-2xl"
              data-testid={`service-${index}`}
            >
              <div className="mb-4">
                <ServiceVisual
                  src={service.imageSrc}
                  alt={service.imageAlt}
                  fallbackLetter={service.fallbackLetter}
                />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#1A1A1A]">{service.title}</h3>
              <p className="text-[#4A4A4A] leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <button
            onClick={onShowPricing}
            data-testid="services-pricing-btn"
            className="btn-gold"
          >
            Consulter tous les tarifs
          </button>
        </motion.div>
      </div>
    </section>
  );
}