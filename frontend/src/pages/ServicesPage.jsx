import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PricingModal from '../components/PricingModal';
import { services } from '../data/services';

export default function ServicesPage() {
  const [showPricing, setShowPricing] = useState(false);
  const [pricingCategories, setPricingCategories] = useState(null);

  const openPricing = (categories) => {
    setPricingCategories(Array.isArray(categories) && categories.length > 0 ? categories : null);
    setShowPricing(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation onShowPricing={() => setShowPricing(true)} />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="uppercase tracking-widest text-xs text-[#1A1A1A]/70 mb-3">Institut Léa Beauté • Prestations</p>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-[#1A1A1A]">
              Toutes nos <span className="gold-gradient-text italic">prestations</span>
            </h1>
            <p className="text-lg md:text-xl text-[#4A4A4A] max-w-3xl mx-auto leading-relaxed">
              Retrouvez l’ensemble de nos prestations avec des descriptions claires et des techniques associées.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button onClick={() => openPricing(null)} className="btn-gold text-xs px-6 py-3">Voir les tarifs</button>
              <Link to="/" className="btn-secondary text-xs px-6 py-3">Retour à l’accueil</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Index */}
      <section className="py-12 bg-[#F9F7F2]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {services.map((service) => (
              <a
                key={service.id}
                href={`#${service.id}`}
                className="px-4 py-3 rounded-full bg-white border border-[#E8DCCA] text-sm font-medium text-[#1A1A1A] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
              >
                {service.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Détails des prestations */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-20">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              id={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid md:grid-cols-2 gap-12 items-center scroll-mt-32"
            >
              <div className={index % 2 === 0 ? '' : 'order-2 md:order-1'}>
                <div className="rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={service.imageSrc}
                    alt={service.imageAlt}
                    className="w-full h-[380px] object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
              <div className={index % 2 === 0 ? '' : 'order-1 md:order-2'}>
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 rounded-full text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">
                    Durée {service.duration}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#1A1A1A]">
                  {service.title}
                </h2>
                <p className="text-lg text-[#4A4A4A] mb-4 leading-relaxed">
                  {service.description}
                </p>
                <div className="h-px bg-gradient-to-r from-[#D4AF37] to-transparent w-14 my-4"></div>
                <p className="text-base text-[#4A4A4A]/80 leading-relaxed">
                  {service.details}
                </p>
                <div className="mt-6">
                  <p className="text-sm uppercase tracking-widest text-[#1A1A1A]/60 mb-2">Techniques</p>
                  <p className="text-[#4A4A4A] leading-relaxed">
                    {service.techniquesText}
                  </p>
                </div>
                <div className="mt-8 flex flex-col gap-2 max-w-sm">
                  <a href="tel:0233214819" className="btn-gold inline-flex items-center justify-center text-[11px] px-4 py-2 whitespace-nowrap w-full">
                    Prendre rendez-vous
                  </a>
                  <button onClick={() => openPricing(service.pricingCategories)} className="btn-secondary text-[11px] px-4 py-2 whitespace-nowrap w-full">
                    Voir les tarifs
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer onShowPricing={() => setShowPricing(true)} />
      <PricingModal
        open={showPricing}
        onClose={() => setShowPricing(false)}
        initialCategories={pricingCategories}
      />
    </div>
  );
}
