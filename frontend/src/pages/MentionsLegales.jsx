import { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PricingModal from '../components/PricingModal';

export default function MentionsLegales() {
  const [showPricing, setShowPricing] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navigation onShowPricing={() => setShowPricing(true)} />
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-32">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-[#1A1A1A]">Mentions légales</h1>
        
        <div className="space-y-8 text-[#4A4A4A] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Éditeur du site</h2>
            <p><strong>Nom :</strong> Léa Beauté Valognes</p>
            <p><strong>Activité :</strong> Institut de beauté</p>
            <p><strong>Adresse :</strong> 7 Rue du Palais de Justice, 50700 Valognes</p>
            <p><strong>Téléphone :</strong> 02 33 21 48 19</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Hébergement</h2>
            <p>Le site est hébergé par un prestataire technique. Les informations détaillées sont disponibles sur demande.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, images, logos) est la propriété de Léa Beauté Valognes, sauf mention contraire.
              Toute reproduction, même partielle, est interdite sans autorisation préalable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Responsabilité</h2>
            <p>
              Les informations fournies sur ce site le sont à titre indicatif. Léa Beauté Valognes s'efforce de maintenir ces informations à jour,
              mais ne peut garantir leur exactitude ou exhaustivité.
            </p>
          </section>
        </div>
      </div>
      <Footer onShowPricing={() => setShowPricing(true)} />
      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} />
    </div>
  );
}