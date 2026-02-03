import { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PricingModal from '../components/PricingModal';

export default function Confidentialite() {
  const [showPricing, setShowPricing] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navigation onShowPricing={() => setShowPricing(true)} />
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-32">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-[#1A1A1A]">Politique de confidentialité</h1>
        
        <div className="space-y-8 text-[#4A4A4A] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Données collectées</h2>
            <p>
              Léa Beauté Valognes collecte uniquement les données nécessaires à la gestion des rendez-vous et des prestations.
              Aucune donnée personnelle n'est collectée via ce site sans votre consentement explicite.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Utilisation des données</h2>
            <p>
              Les données collectées sont utilisées exclusivement pour :
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>La gestion des rendez-vous</li>
              <li>Le traitement des paiements (cartes cadeaux)</li>
              <li>La communication relative à nos prestations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Paiements</h2>
            <p>
              Les paiements en ligne sont sécurisés par Stripe. Léa Beauté Valognes ne conserve aucune donnée bancaire.
              Les informations de paiement sont traitées directement par Stripe conformément aux normes PCI-DSS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données.
              Pour exercer ces droits, contactez-nous au 02 33 21 48 19.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Cookies</h2>
            <p>
              Ce site utilise des cookies techniques nécessaires à son fonctionnement. Pour plus d'informations, consultez notre
              <a href="/cookies" className="text-[#D4AF37] hover:underline ml-1">politique cookies</a>.
            </p>
          </section>
        </div>
      </div>
      <Footer onShowPricing={() => setShowPricing(true)} />
      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} />
    </div>
  );
}