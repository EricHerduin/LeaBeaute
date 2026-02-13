import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import chronoNutritionImage from '../assets/photos/prestations/chrononutrition _1.jpg';

export default function CoachingTeaser() {
  const navigate = useNavigate();

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-[#D4AF37]/10 rounded-full text-sm font-medium text-[#D4AF37] mb-4">
                Nutrition & Bien-être
              </span>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-[#1A1A1A]">
                Accompagnement en <span className="gold-gradient-text italic">chrononutrition</span>
              </h2>
            </div>
            <p className="text-lg text-[#4A4A4A] mb-6 leading-relaxed">
              Un accompagnement personnalisé pour manger au bon moment et retrouver votre équilibre naturel.
              La chrononutrition respecte votre rythme biologique pour des habitudes durables.
            </p>
            <div className="space-y-4 mb-8">
              {[
                'Diagnostic personnalisé de vos habitudes',
                'Plan adapté à votre rythme de vie',
                'Suivi régulier et ajustements',
                'Objectif : équilibre alimentaire durable'
              ].map((item, index) => (
                <div key={index} className="flex items-center">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-[#1A1A1A] font-medium">{item}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/accompagnement-nutrition')}
                data-testid="coaching-learn-more-btn"
                className="btn-primary"
              >
                En savoir plus
              </button>
              <a
                href="tel:0233214819"
                data-testid="coaching-call-btn"
                className="btn-secondary inline-flex items-center justify-center"
              >
                Prendre contact
              </a>
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
                src={chronoNutritionImage}
                alt="Accompagnement nutrition"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}