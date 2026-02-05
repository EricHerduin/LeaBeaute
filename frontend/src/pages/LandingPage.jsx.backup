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
import Footer from '../components/Footer';
import PricingModal from '../components/PricingModal';

export default function LandingPage() {
  const [showPricing, setShowPricing] = useState(false);
  const [pricingCategories, setPricingCategories] = useState(null);

  const handleShowPricing = (categories) => {
    setPricingCategories(Array.isArray(categories) && categories.length > 0 ? categories : null);
    setShowPricing(true);
  };

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation onShowPricing={handleShowPricing} />
      <Hero onShowPricing={handleShowPricing} />
      <Services onShowPricing={handleShowPricing} />
      <GuinotSection onShowPricing={handleShowPricing} />
      <LPGSection onShowPricing={handleShowPricing} />
      <GiftCards />
      <CoachingTeaser />
      <Contact />
      <Footer onShowPricing={handleShowPricing} />
      <PricingModal
        open={showPricing}
        onClose={() => setShowPricing(false)}
        initialCategories={pricingCategories}
      />
    </div>
  );
}