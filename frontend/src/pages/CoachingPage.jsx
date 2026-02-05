import { motion } from 'framer-motion';
import { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PricingModal from '../components/PricingModal';
import nutritionImage from '../assets/photos/prestations/Chrono nutrition.png' 

export default function CoachingPage() {
  const [showPricing, setShowPricing] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navigation onShowPricing={() => setShowPricing(true)} />
      
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F9F7F2] to-white"></div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-[#1A1A1A]">
                Coaching en <span className="gold-gradient-text italic">Chrononutrition</span>
              </h1>
              <p className="text-lg md:text-xl text-[#4A4A4A] mb-8 leading-relaxed">
                Un accompagnement personnalisé pour manger au bon moment et retrouver votre équilibre naturel.
              </p>
              <a
                href="tel:0233214819"
                data-testid="coaching-call-btn"
                className="btn-primary inline-flex items-center justify-center"
              >
                Prendre Rendez-vous
              </a>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="rounded-2xl overflow-hidden shadow-lg"
            >
              <img 
                src={nutritionImage} 
                alt="Coaching Chrononutrition" 
                className="w-full h-96 object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* What is it */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#1A1A1A]">
              Qu'est-ce que la <span className="gold-gradient-text">chrononutrition</span> ?
            </h2>
            <p className="text-lg text-[#4A4A4A] leading-relaxed max-w-3xl mx-auto">
              La chrononutrition est une approche holistique de l'alimentation qui consiste à manger certains aliments à des moments spécifiques de la journée,
              en accord avec votre rythme biologique naturel (chronobiologie). L'objectif est de retrouver un équilibre alimentaire durable et améliorer votre santé globale.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-card p-6 rounded-2xl text-center"
            >
              <div className="text-4xl mb-4">🌅</div>
              <h3 className="text-xl font-bold mb-3 text-[#1A1A1A]">Le matin</h3>
              <p className="text-[#4A4A4A] text-sm">
                Petit-déjeuner riche en protéines et féculents pour démarrer la journée avec énergie
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-card p-6 rounded-2xl text-center"
            >
              <div className="text-4xl mb-4">☀️</div>
              <h3 className="text-xl font-bold mb-3 text-[#1A1A1A]">À midi</h3>
              <p className="text-[#4A4A4A] text-sm">
                Repas équilibré avec protéines, féculents et légumes pour soutenir vos activités
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card p-6 rounded-2xl text-center"
            >
              <div className="text-4xl mb-4">🌙</div>
              <h3 className="text-xl font-bold mb-3 text-[#1A1A1A]">Le soir</h3>
              <p className="text-[#4A4A4A] text-sm">
                Repas léger à base de protéines et légumes pour favoriser une bonne récupération
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-card p-8 rounded-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 text-[#1A1A1A]">Pour qui ?</h3>
              <ul className="space-y-3">
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Personnes souhaitant rééquilibrer leur alimentation
                </li>
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Celles et ceux recherchant plus d'énergie et de vitalité
                </li>
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Envie de mieux comprendre son corps et ses besoins
                </li>
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Personnes désirant créer des habitudes alimentaires saines
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-card p-8 rounded-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 text-[#1A1A1A]">Les avantages</h3>
              <ul className="space-y-3">
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Amélioration de l'énergie et de la vitalité
                </li>
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Meilleure qualité de sommeil et récupération
                </li>
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Meilleure digestion et confort digestif
                </li>
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Diminution des fringales et mieux-être général
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Important Note */}
      <section className="py-20 bg-[#F9F7F2]">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl border-l-4 border-[#D4AF37]"
            >
              <h3 className="text-2xl font-bold mb-4 text-[#1A1A1A]">Comment ça fonctionne ?</h3>
              <ol className="space-y-4 text-[#4A4A4A]">
                <li className="flex">
                  <span className="font-bold text-[#D4AF37] mr-4">1.</span>
                  <span>Bilan nutritionnel et analyse de vos habitudes alimentaires</span>
                </li>
                <li className="flex">
                  <span className="font-bold text-[#D4AF37] mr-4">2.</span>
                  <span>Élaboration d'un plan nutritionnel personnalisé adapté à votre rythme</span>
                </li>
                <li className="flex">
                  <span className="font-bold text-[#D4AF37] mr-4">3.</span>
                  <span>Suivi régulier et ajustements en fonction de vos retours</span>
                </li>
                <li className="flex">
                  <span className="font-bold text-[#D4AF37] mr-4">4.</span>
                  <span>Conseils pratiques et recettes adaptées à vos préférences</span>
                </li>
              </ol>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl border-l-4 border-[#D4AF37]"
            >
              <h3 className="text-2xl font-bold mb-4 text-[#1A1A1A]">Note importante</h3>
              <p className="text-[#4A4A4A] leading-relaxed mb-4">
                Ce coaching en chrononutrition est un accompagnement nutritionnel et ne constitue pas un traitement médical.
              </p>
              <p className="text-[#4A4A4A] leading-relaxed">
                Aucune promesse de perte de poids garantie n'est formulée. L'objectif est de vous aider à retrouver un équilibre alimentaire durable, 
                adapté à votre rythme de vie et à vos besoins biologiques.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-[#D4AF37] to-[#E8C158] p-8 rounded-2xl text-white text-center"
          >
            <h3 className="text-2xl font-bold mb-4">Durée recommandée</h3>
            <p className="text-lg">
              Un accompagnement minimum de 3 mois est recommandé pour observer les résultats et mettre en place durablement les nouvelles habitudes alimentaires.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#1A1A1A]">
              Intéressé(e) par un coaching ?
            </h2>
            <p className="text-lg text-[#4A4A4A] mb-8 leading-relaxed">
              Contactez-nous par téléphone pour discuter de vos objectifs et définir un accompagnement adapté.
            </p>
            <a
              href="tel:0233214819"
              data-testid="coaching-footer-call-btn"
              className="btn-gold inline-flex items-center justify-center"
            >
              Appeler : 02 33 21 48 19
            </a>
          </motion.div>
        </div>
      </section>

      <Footer onShowPricing={() => setShowPricing(true)} />
      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} />
    </div>
  );
}