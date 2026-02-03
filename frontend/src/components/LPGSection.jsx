import { motion } from 'framer-motion';
import LPGPic from '../assets/photos/lpg/Lpg.jpg';

export default function LPGSection({ onShowPricing }) {
  return (
    <section id="lpg" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={LPGPic}
                alt="LPG Endermologie"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-[#D4AF37]/10 rounded-full text-sm font-medium text-[#D4AF37] mb-4">
                Technologie mécanobiol
              </span>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-[#1A1A1A]">
                <span className="gold-gradient-text italic">LPG</span> Endermologie
              </h2>
            </div>
            <p className="text-lg text-[#4A4A4A] mb-6 leading-relaxed">
              La technologie LPG Endermologie stimule naturellement les cellules pour raffermir,
              lisser et affiner la silhouette sans chirurgie.
            </p>
            <div className="space-y-4 mb-8">
              {[
                'Raffermissement de la peau',
                'Lissage des capitons',
                'Affinement de la silhouette',
                'Drainage et décongestion',
                'Récupération sportive'
              ].map((item, index) => (
                <div key={index} className="flex items-center">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-[#1A1A1A] font-medium">{item}</p>
                </div>
              ))}
            </div>

            <div className="glass-card p-6 rounded-2xl mb-8">
              <h3 className="font-bold text-[#1A1A1A] mb-3">Nos formules LPG</h3>
              <div className="space-y-2 text-sm text-[#4A4A4A]">
                <p>• Le body : 16€</p>
                <p>• La séance : 55€</p>
                <p>• Forfait 10 séances + 1 offerte : 550€</p>
                <p>• Séance d'entretien : 49€</p>
              </div>
            </div>

            <button
              onClick={onShowPricing}
              data-testid="lpg-pricing-btn"
              className="btn-gold"
            >
              Découvrir tous les tarifs
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}