import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import ScrollToTop from "./components/ScrollToTop";
import CookieConsent from "./components/CookieConsent";
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

function App() {
  return (
    <>
      <BrowserRouter>
        <ScrollToTop />
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
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
