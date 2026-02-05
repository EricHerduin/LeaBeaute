import { motion } from 'framer-motion';
import HeroPicture from '../assets/photos/Hero.jpg'

export default function Hero({ onShowPricing }) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={HeroPicture}
          alt="Institut de beauté"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-white"></div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 pt-32 pb-20">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-white leading-tight">
              L'élégance au
              <span className="block gold-gradient-text italic mt-2">naturel</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed"
          >
            Votre institut de beauté à Valognes. Soins visage Guinot, épilations, LPG,
            extensions de cils, manucure et accompagnement nutrition.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="tel:0233214819"
              data-testid="hero-call-btn"
              className="btn-gold inline-flex items-center justify-center"
            >
              Prendre Rendez-vous
            </a>
            <button
              onClick={onShowPricing}
              data-testid="hero-pricing-btn"
              className="glass-light text-white border border-white/40 hover:border-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all duration-300 rounded-full px-8 py-4 text-sm uppercase tracking-widest font-medium"
            >
              Découvrir nos tarifs
            </button>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <div className="flex flex-col items-center text-white/70">
          <span className="text-sm mb-2 uppercase tracking-widest">Découvrir</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}