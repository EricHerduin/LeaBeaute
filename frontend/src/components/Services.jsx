import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog';
import { services } from '../data/services';

function ServiceVisual({ src, alt, fallbackLetter }) {
  return (
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border border-[#D4AF37]/35" />
      <div className="absolute inset-[3px] rounded-full border border-[#D4AF37]/20" />
      <div className="absolute inset-[6px] rounded-full overflow-hidden bg-[#F7F4EC]">
        <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-[#1A1A1A]/70">
          {fallbackLetter}
        </span>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-white border border-[#D4AF37]/25" />
      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25" />
    </div>
  );
}

export default function Services({ onShowPricing }) {
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
            <Dialog key={service.title}>
              <DialogTrigger asChild>
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  className="service-card rounded-2xl text-left"
                  data-testid={`service-${index}`}
                  aria-label={`En savoir plus sur ${service.title}`}
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
                  <span className="inline-flex items-center mt-4 text-sm text-[#D4AF37] font-semibold">
                    Découvrir
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </motion.button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden">
                <div className="grid md:grid-cols-2">
                  <div className="bg-[#F9F7F2] p-6">
                    <img
                      src={service.imageSrc}
                      alt={service.imageAlt}
                      className="w-full h-48 object-cover rounded-xl shadow-md"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="mt-6 flex items-center gap-4">
                      <ServiceVisual
                        src={service.imageSrc}
                        alt={service.imageAlt}
                        fallbackLetter={service.fallbackLetter}
                      />
                      <div>
                        <p className="text-sm uppercase tracking-widest text-[#1A1A1A]/60">Durée</p>
                        <p className="text-[#1A1A1A] font-semibold">{service.duration}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <DialogHeader className="text-left">
                      <DialogTitle className="text-2xl font-bold text-[#1A1A1A]">
                        {service.title}
                      </DialogTitle>
                      <DialogDescription className="text-[#4A4A4A]">
                        {service.description}
                      </DialogDescription>
                    </DialogHeader>
                    <p className="mt-4 text-[#4A4A4A] leading-relaxed">
                      {service.details}
                    </p>
                    <div className="mt-6">
                      <p className="text-sm uppercase tracking-widest text-[#1A1A1A]/60 mb-3">Techniques</p>
                      <p className="text-[#4A4A4A] leading-relaxed">
                        {service.techniquesText}
                      </p>
                    </div>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                      <a
                        href="tel:0233214819"
                        className="btn-gold inline-flex items-center justify-center"
                      >
                        Prendre rendez-vous
                      </a>
                      <button
                        type="button"
                        onClick={() => onShowPricing?.(service.pricingCategories)}
                        className="btn-secondary"
                      >
                        Voir les tarifs
                      </button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/prestations" className="btn-secondary">
            Voir toutes les prestations
          </Link>
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