import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import soinVisageImage from '../assets/photos/prestations/soins_visage_1.jpg';

export default function GuinotSection({ onShowPricing }) {
  const navigate = useNavigate();

  return (
    <section className="py-24 md:py-32 bg-[#F9F7F2] relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-5">
        <div className="w-full h-full bg-gradient-to-l from-[#D4AF37] to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-[#D4AF37]/10 rounded-full text-sm font-medium text-[#D4AF37] mb-4">
                Technologie avancée
              </span>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-[#1A1A1A]">
                Soins visage <span className="gold-gradient-text italic">Guinot</span>
              </h2>
            </div>
            <p className="text-lg text-[#4A4A4A] mb-6 leading-relaxed">
              Leader français de la cosmétique professionnelle, Guinot propose des soins visage à la technologie brevetée
              pour des résultats visibles et prouvés.
            </p>
            <div className="space-y-4 mb-8">
              {[
                { title: 'Hydradermie 1000', desc: 'Restaure l\'énergie cellulaire pour une peau rajeunie' },
                { title: 'Hydra Peeling', desc: 'Réduit les taches brunes de -55% en 3 séances' },
                { title: 'Lift Summum', desc: 'Alternative non-chirurgicale au lifting médical' },
                { title: 'Age Summum', desc: 'Raffermit visage, cou et décolleté' }
              ].map((item, index) => (
                <div key={index} className="flex items-start">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] mb-1">{item.title}</h4>
                    <p className="text-[#4A4A4A] text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/guinot')}
                data-testid="guinot-learn-more-btn"
                className="btn-primary"
              >
                En savoir plus
              </button>
              <button
                onClick={onShowPricing}
                data-testid="guinot-pricing-btn"
                className="btn-secondary"
              >
                Voir les tarifs
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={soinVisageImage}
                alt="Soin visage Guinot"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 glass-light p-6 rounded-2xl max-w-xs">
              <p className="text-3xl font-bold text-[#D4AF37] mb-1">60 min</p>
              <p className="text-sm text-[#1A1A1A] font-medium">Durée moyenne d'un soin</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}