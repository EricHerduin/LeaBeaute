import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../assets/photos/logos/logo16-9_1.png';
import OpeningStatus from './OpeningStatus';
import ExceptionBanner from './ExceptionBanner';
import { getOpeningStatus } from '../data/businessHours';

export default function Navigation({ onShowPricing, forceLight = false }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [exceptionBanner, setExceptionBanner] = useState(null);
  const BANNER_REFRESH_INTERVAL = 3600000;
  const isHomePage = location.pathname === '/';
  const navIsLight = forceLight || isScrolled || !isHomePage;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateBanner = () => {
      const status = getOpeningStatus();
      if (status.secondaryMessage && status.secondaryMessage.includes('Institut fermé du')) {
        setExceptionBanner(status.secondaryMessage.replace(/\n/g, ' '));
      } else {
        setExceptionBanner(null);
      }
    };
    updateBanner();
    const interval = setInterval(updateBanner, BANNER_REFRESH_INTERVAL);
    return () => clearInterval(interval);
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
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 before:content-[''] before:absolute before:inset-0 before:rounded-b-2xl before:pointer-events-none before:z-[-1] ${
        navIsLight
          ? 'bg-white/92 backdrop-blur-md shadow-lg before:bg-none border-b border-[#EADFCF]/85'
          : 'bg-[#222]/40 before:bg-linear-to-b before:from-black/60 before:to-transparent'
      }`}>
        <div className="max-w-8xl mx-auto px-6 md:px-12 relative">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3" data-testid="nav-logo" onClick={handleHomeClick}>
              <img
                src={Logo}
                alt="Léa Beauté Valognes"
                className="h-12 md:h-14 w-auto object-contain"
              />
            </Link>

            <div className="lg:hidden flex-1 flex justify-end mr-2">
              <OpeningStatus isScrolled={navIsLight} showShortReopen compact />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
              <Link
                to="/a-propos-institut"
                className={`text-sm font-medium transition-colors ${navIsLight ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-[#D4AF37] hover:text-white'}`}
              >
                À propos
              </Link>
              <button
                onClick={() => scrollToSection('services')}
                data-testid="nav-services"
                className={`text-sm font-medium transition-colors ${navIsLight ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-[#D4AF37] hover:text-white'}`}
              >
                Prestations
              </button>
              <Link
                to="/guinot"
                data-testid="nav-guinot"
                className={`text-sm font-medium transition-colors ${navIsLight ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-[#D4AF37] hover:text-white'}`}
              >
                Guinot
              </Link>
              <button
                onClick={() => scrollToSection('lpg')}
                data-testid="nav-lpg"
                className={`text-sm font-medium transition-colors ${navIsLight ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-[#D4AF37] hover:text-white'}`}
              >
                LPG
              </button>
              <button
                onClick={() => scrollToSection('cartes-cadeaux')}
                data-testid="nav-giftcards"
                className={`text-sm font-medium transition-colors ${navIsLight ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-[#D4AF37] hover:text-white'}`}
              >
                Cartes cadeaux
              </button>
              <Link
                to="/accompagnement-nutrition"
                data-testid="nav-coaching"
                className={`text-sm font-medium transition-colors ${navIsLight ? 'text-[#1A1A1A] hover:text-[#D4AF37]' : 'text-[#D4AF37] hover:text-white'}`}
              >
                Accompagnement Nutrition
              </Link>
              <a
                href="tel:0233214819"
                data-testid="nav-call"
                className={`btn-gold text-sm ${navIsLight ? '' : 'text-[#D4AF37] hover:text-white'}`}
              >
                Prendre rendez-vous
              </a>
              <OpeningStatus isScrolled={navIsLight} />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="mobile-menu-btn"
              className={`lg:hidden p-2 ${navIsLight ? 'text-[#1A1A1A]' : 'text-white'}`}
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
              className="lg:hidden mt-2 mb-5 rounded-2xl border border-[#E8DCCA] bg-[#FFFCF7]/95 backdrop-blur-md shadow-[0_18px_45px_rgba(20,17,14,0.18)] px-4 py-4 space-y-2"
            >
              <Link
                to="/a-propos-institut"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-[#1A1A1A] hover:bg-[#F4EBDD] hover:text-[#7A5B14] transition-colors"
              >
                À propos
              </Link>

              <button
                onClick={() => scrollToSection('services')}
                className="block w-full text-left rounded-lg px-3 py-2 text-[#1A1A1A] hover:bg-[#F4EBDD] hover:text-[#7A5B14] transition-colors"
              >
                Prestations
              </button>

              <Link
                to="/guinot"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-[#1A1A1A] hover:bg-[#F4EBDD] hover:text-[#7A5B14] transition-colors"
              >
                Guinot
              </Link>

              <button
                onClick={() => scrollToSection('lpg')}
                className="block w-full text-left rounded-lg px-3 py-2 text-[#1A1A1A] hover:bg-[#F4EBDD] hover:text-[#7A5B14] transition-colors"
              >
                LPG
              </button>

              <button
                onClick={() => scrollToSection('cartes-cadeaux')}
                className="block w-full text-left rounded-lg px-3 py-2 text-[#1A1A1A] hover:bg-[#F4EBDD] hover:text-[#7A5B14] transition-colors"
              >
                Cartes cadeaux
              </button>

              <Link
                to="/accompagnement-nutrition"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-[#1A1A1A] hover:bg-[#F4EBDD] hover:text-[#7A5B14] transition-colors"
              >
                Accompagnement Nutrition
              </Link>

              <div className="pt-4 mt-2 border-t border-[#E8DCCA]">
                <a
                  href="tel:0233214819"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-gold w-full text-sm"
                >
                  Prendre rendez-vous
                </a>
              </div>
            </motion.div>
          )}
        </div>
        {exceptionBanner && <ExceptionBanner message={exceptionBanner} />}
      </nav>
      
    </>
  );
}
