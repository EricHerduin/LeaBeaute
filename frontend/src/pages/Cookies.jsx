import { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PricingModal from '../components/PricingModal';

export default function Cookies() {
  const [showPricing, setShowPricing] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navigation onShowPricing={() => setShowPricing(true)} />
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-32">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-[#1A1A1A]">Politique de cookies</h1>
        
        <div className="space-y-8 text-[#4A4A4A] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Qu'est-ce qu'un cookie ?</h2>
            <p>
              Un cookie est un petit fichier texte stocké sur votre appareil lors de la visite d'un site web.
              Il permet de mémoriser vos préférences et d'améliorer votre expérience de navigation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Cookies utilisés sur ce site</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">Cookies techniques (nécessaires)</h3>
                <p>
                  Ces cookies sont indispensables au fonctionnement du site. Ils permettent notamment la navigation
                  et l'utilisation des fonctionnalités de base.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">Cookies de paiement</h3>
                <p>
                  Lors d'un achat de carte cadeau, Stripe (notre prestataire de paiement) utilise des cookies
                  pour sécuriser la transaction.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Gestion des cookies</h2>
            <p>
              Vous pouvez gérer ou supprimer les cookies à tout moment via les paramètres de votre navigateur.
              Notez que la désactivation des cookies techniques peut limiter certaines fonctionnalités du site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Durée de conservation</h2>
            <p>
              Les cookies techniques sont conservés pour la durée de votre session de navigation.
              Les cookies de paiement suivent les règles définies par Stripe.
            </p>
          </section>
        </div>
      </div>
      <Footer onShowPricing={() => setShowPricing(true)} />
      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} />
    </div>
  );
}