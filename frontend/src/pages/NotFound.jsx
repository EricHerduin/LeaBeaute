import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      
      {/* 404 Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl w-full text-center">
          {/* Animated 404 Number */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="mb-8"
          >
            <div className="text-9xl md:text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#C4991F]">
              404
            </div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
              Oups !
            </h1>
            <p className="text-xl text-[#4A4A4A] mb-6 leading-relaxed">
              Cette page n'existe pas ou a été supprimée. Peut-être qu'elle s'est envolée avec la brise...
            </p>
            <p className="text-lg text-[#999999]">
              Retournez à l'accueil pour continuer votre visite.
            </p>
          </motion.div>

          {/* Animated Geometric Illustration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-12 h-64 flex items-center justify-center relative"
          >
            {/* Main decorative circle */}
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity }
              }}
              className="absolute w-48 h-48 border-4 border-[#D4AF37]/30 rounded-full"
            />
            
            {/* Inner circle */}
            <motion.div
              animate={{ 
                rotate: -360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 15, repeat: Infinity, ease: "linear" },
                scale: { duration: 3, repeat: Infinity, delay: 0.5 }
              }}
              className="absolute w-32 h-32 border-2 border-[#C4991F]/40 rounded-full"
            />

            {/* Floating orbs */}
            <motion.div
              animate={{ 
                y: [-20, 20, -20],
                x: [-10, 10, -10]
              }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute top-8 left-1/4 w-6 h-6 bg-gradient-to-br from-[#D4AF37] to-[#C4991F] rounded-full shadow-lg"
            />
            <motion.div
              animate={{ 
                y: [20, -20, 20],
                x: [10, -10, 10]
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              className="absolute bottom-12 right-1/3 w-4 h-4 bg-gradient-to-br from-[#E8DCCA] to-[#D4AF37] rounded-full shadow-md"
            />
            <motion.div
              animate={{ 
                y: [-15, 15, -15],
                x: [15, -15, 15]
              }}
              transition={{ duration: 6, repeat: Infinity, delay: 1 }}
              className="absolute top-16 right-1/4 w-5 h-5 bg-gradient-to-br from-[#C4991F] to-[#D4AF37] rounded-full shadow-md"
            />

            {/* Center icon - Abstract leaf/spa symbol */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="relative z-10"
            >
              <div className="relative w-20 h-20">
                {/* Leaf shape using CSS */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] to-[#C4991F] rounded-full opacity-20" />
                <div className="absolute top-2 left-2 w-16 h-16 border-l-4 border-[#D4AF37] rounded-tl-full rounded-bl-full transform rotate-45" />
                <div className="absolute top-2 left-2 w-16 h-16 border-r-4 border-[#C4991F] rounded-tr-full rounded-br-full transform -rotate-45" />
              </div>
            </motion.div>

            {/* Decorative lines */}
            <motion.div
              animate={{ scaleX: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute bottom-0 left-1/4 w-32 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"
            />
            <motion.div
              animate={{ scaleX: [1, 0.8, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              className="absolute top-0 right-1/4 w-32 h-0.5 bg-gradient-to-r from-transparent via-[#C4991F] to-transparent"
            />
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link
              to="/"
              className="inline-block px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#C4991F] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              ← Retour à l'accueil
            </Link>
          </motion.div>

          {/* Additional Help */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-12 pt-12 border-t border-[#E8DCCA]"
          >
            <p className="text-[#4A4A4A] text-sm mb-4">
              Besoin d'aide ? Découvrez nos services :
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/" className="text-[#D4AF37] hover:text-[#C4991F] transition-colors">
                Accueil
              </Link>
              <span className="text-[#E8DCCA]">•</span>
              <Link to="/" className="text-[#D4AF37] hover:text-[#C4991F] transition-colors">
                Services
              </Link>
              <span className="text-[#E8DCCA]">•</span>
              <a href="tel:0233214819" className="text-[#D4AF37] hover:text-[#C4991F] transition-colors">
                Nous appeler
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
