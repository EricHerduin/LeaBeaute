import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie } from 'lucide-react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookieConsent', 'all');
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem('cookieConsent', 'necessary');
    setShowBanner(false);
  };

  const rejectAll = () => {
    localStorage.setItem('cookieConsent', 'none');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6">
          <div className="flex items-start gap-4">
            <Cookie className="w-6 h-6 text-[#D4AF37] flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                🍪 Cookies sur Léa Beauté
              </h3>
              <p className="text-sm text-[#4A4A4A] mb-4">
                Nous utilisons des cookies pour améliorer votre expérience sur notre site.
                Certains sont nécessaires au fonctionnement du site, d'autres nous aident à
                analyser l'utilisation et personnaliser le contenu.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={acceptAll}
                  className="px-4 py-2 bg-[#D4AF37] text-white text-sm font-medium rounded-lg hover:bg-[#B8952A] transition-colors"
                >
                  Accepter tout
                </button>
                <button
                  onClick={acceptNecessary}
                  className="px-4 py-2 border border-[#D4AF37] text-[#D4AF37] text-sm font-medium rounded-lg hover:bg-[#D4AF37] hover:text-white transition-colors"
                >
                  Cookies nécessaires uniquement
                </button>
                <button
                  onClick={rejectAll}
                  className="px-4 py-2 border border-gray-300 text-[#4A4A4A] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Refuser tout
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-[#D4AF37] hover:underline"
                >
                  {showDetails ? 'Masquer les détails' : 'Voir les détails'}
                </button>
                <a
                  href="/cookies"
                  className="text-[#4A4A4A] hover:text-[#D4AF37] transition-colors"
                >
                  Politique de cookies
                </a>
              </div>

              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-[#4A4A4A]"
                >
                  <h4 className="font-semibold text-[#1A1A1A] mb-2">Types de cookies :</h4>
                  <ul className="space-y-2">
                    <li><strong>Cookies techniques :</strong> Nécessaires au fonctionnement du site</li>
                    <li><strong>Cookies analytiques :</strong> Pour mesurer l'audience et améliorer le site</li>
                    <li><strong>Cookies de paiement :</strong> Pour sécuriser les transactions (Stripe)</li>
                  </ul>
                </motion.div>
              )}
            </div>

            <button
              onClick={() => setShowBanner(false)}
              className="p-1 text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}