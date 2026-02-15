import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Lenis from 'lenis';
import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import Services from '../components/Services';
import GuinotSection from '../components/GuinotSection';
import LPGSection from '../components/LPGSection';
import GiftCards from '../components/GiftCards';
import CoachingTeaser from '../components/CoachingTeaser';
import Contact from '../components/Contact';
import GoogleReviews from '../components/GoogleReviews';
import OpeningHours from '../components/OpeningHours';
import Footer from '../components/Footer';
import PricingModal from '../components/PricingModal';
import SEO from '../components/SEO';
import ExceptionBanner from '../components/ExceptionBanner';
import { getOpeningStatus } from '../data/businessHours';

export default function LandingPage() {
  const [showPricing, setShowPricing] = useState(false);
  const [pricingCategories, setPricingCategories] = useState(null);
  const [exceptionBanner, setExceptionBanner] = useState(null);
  const [isClosedPeriod, setIsClosedPeriod] = useState(false);
  const [closedBannerMessage, setClosedBannerMessage] = useState(null);

  const handleShowPricing = (categories) => {
    setPricingCategories(Array.isArray(categories) && categories.length > 0 ? categories : null);
    setShowPricing(true);
  };

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

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
    const interval = setInterval(updateBanner, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClosedPeriodChange = (isClosed, message) => {
    setIsClosedPeriod(isClosed);
    setClosedBannerMessage(isClosed ? message : null);
  };

  return (
    <>
      <SEO 
        title="Léa Beauté Valognes - Institut de Beauté et Bien-être"
        description="Institut de beauté à Valognes (50). Soins Guinot, épilations, LPG, manucure, pédicure, extensions de cils, accompagnement nutrition. Prenez RDV au 02 33 21 48 19."
        keywords="institut beauté Valognes, Guinot, épilation, LPG, manucure, pédicure, soins visage, accompagnement nutrition, chrononutrition, extensions cils, Manche 50"
        url="https://demo-client.htagfacility.fr"
      />
      <div className="overflow-hidden bg-white">
        <Navigation onShowPricing={handleShowPricing} />
        {isClosedPeriod && closedBannerMessage && <ExceptionBanner message={closedBannerMessage} />}
        <Hero onShowPricing={handleShowPricing} />
        <Services onShowPricing={handleShowPricing} />
        <GuinotSection onShowPricing={handleShowPricing} />
        <LPGSection onShowPricing={handleShowPricing} />
        <CoachingTeaser />
        <GiftCards />
        <Contact />
        <GoogleReviews />
        
        <Footer onShowPricing={handleShowPricing} />
      </div>
      {showPricing && (
        <PricingModal
          open={showPricing}
          onClose={() => setShowPricing(false)}
          initialCategories={pricingCategories}
        />
      )}
    </>
  );
}
