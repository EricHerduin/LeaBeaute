import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../assets/photos/logos/logo16-9_1.png';
import OpeningStatus from './OpeningStatus';

export default function Navigation({ onShowPricing }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  // Scroll to top même si on est déjà sur la page d'accueil
  const handleHomeClick = (e) => {
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      e.preventDefault();
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 before:content-[''] before:absolute before:inset-0 before:rounded-b-2xl before:pointer-events-none before:z-[-1] ${
      isScrolled
        ? 'bg-white/40 backdrop-blur shadow-lg before:bg-none'
        : 'bg-[#222]/40 before:bg-gradient-to-b before:from-black/60 before:to-transparent'
    }`}>
      <div className="max-w-8xl mx-auto px-6 md:px-12 relative">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3" data-testid="nav-logo" onClick={handleHomeClick}>
            <img
              src={Logo}
              alt="Léa Beauté Valognes"
              className="h-18 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            
            <Link
              to="/a-propos-institut"
              className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-[#D4AF37] hover:text-white'}`}
            >
              À propos
            </Link>
            <button
              onClick={() => scrollToSection('services')}
              data-testid="nav-services"
              className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-[#D4AF37] hover:text-white'}`}
            >
              Prestations
            </button>
            <Link
              to="/guinot"
              data-testid="nav-guinot"
              className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-[#D4AF37] hover:text-white'}`}
            >
              Guinot
            </Link>
            <button
              onClick={() => scrollToSection('lpg')}
              data-testid="nav-lpg"
              className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-[#D4AF37] hover:text-white'}`}
            >
              LPG
            </button>
            <button
              onClick={() => scrollToSection('cartes-cadeaux')}
              data-testid="nav-giftcards"
              className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-[#D4AF37] hover:text-white'}`}
            >
              Cartes cadeaux
            </button>
            <Link
              to="/coaching-chrononutrition"
              data-testid="nav-coaching"
              className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-[#D4AF37] hover:text-white'}`}
            >
              Accompagnement Nutrition
            </Link>
            <a
              href="tel:0233214819"
              data-testid="nav-call"
              className={`btn-gold text-sm ${isScrolled ? '' : 'text-[#D4AF37] hover:text-white'}`}
            >
              Prendre rendez-vous
            </a>
            <OpeningStatus isScrolled={isScrolled} />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="mobile-menu-btn"
            className="md:hidden p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden pb-6 space-y-4"
          >
            <Link
              to="/a-propos-institut"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-[#1A1A1A] hover:text-[#D4AF37]"
            >
              À propos
            </Link>

            <button
              onClick={() => scrollToSection('services')}
              className="block w-full text-left py-2 text-[#1A1A1A] hover:text-[#D4AF37]"
            >
              Prestations
            </button>

            <Link
              to="/guinot"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-[#1A1A1A] hover:text-[#D4AF37]"
            >
              Guinot
            </Link>

            <button
              onClick={() => scrollToSection('lpg')}
              className="block w-full text-left py-2 text-[#1A1A1A] hover:text-[#D4AF37]"
            >
              LPG
            </button>

            <button
              onClick={() => scrollToSection('cartes-cadeaux')}
              className="block w-full text-left py-2 text-[#1A1A1A] hover:text-[#D4AF37]"
            >
              Cartes cadeaux
            </button>

            <Link
              to="/coaching-chrononutrition"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-[#1A1A1A] hover:text-[#D4AF37]"
            >
              Coaching
            </Link>

            <a
              href="tel:0233214819"
              onClick={() => setIsMobileMenuOpen(false)}
              className="btn-gold w-full text-sm"
            >
              Prendre rendez-vous
            </a>
          </motion.div>
        )}
      </div>
    </nav>
  );
}