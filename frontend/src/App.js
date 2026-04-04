import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import ScrollToTop from "./components/ScrollToTop";
import ScrollTopFab from "./components/ScrollTopFab";
import CookieConsent from "./components/CookieConsent";
import GoogleAnalyticsConsentBridge from "./components/GoogleAnalyticsConsentBridge";
import StructuredData from "./components/StructuredData";
import LandingPage from './pages/LandingPage';
import GuinotPage from './pages/GuinotPage';
import CoachingPage from './pages/CoachingPage';
import GiftCardSuccess from './pages/GiftCardSuccess';
import MentionsLegales from './pages/MentionsLegales';
import Confidentialite from './pages/Confidentialite';
import Cookies from './pages/Cookies';
import AdminPage from './pages/AdminPage';
import AboutInstitut from './pages/AboutInstitut';
import ServicesPage from './pages/ServicesPage';
import NotFound from './pages/NotFound';
import { getOpeningStatus } from './data/businessHours';
import { useState, useEffect } from 'react';

function App() {
  const [exceptionBanner, setExceptionBanner] = useState(null);
  const BANNER_REFRESH_INTERVAL = 3600000;

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

  return (
    <HelmetProvider>
      <StructuredData />
      <BrowserRouter>
        <ScrollToTop />
        <GoogleAnalyticsConsentBridge />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/guinot" element={<GuinotPage />} />
          <Route path="/accompagnement-nutrition" element={<CoachingPage />} />
          <Route path="/gift-card-success" element={<GiftCardSuccess />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/a-propos-institut" element={<AboutInstitut />} />
          <Route path="/prestations" element={<ServicesPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <CookieConsent />
      <ScrollTopFab />
      <Toaster richColors position="top-center" />
    </HelmetProvider>
  );
}

export default App;
