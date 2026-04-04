import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PricingModal from '../components/PricingModal';
import {
  fetchCookiePolicyConfig,
  formatCookiePolicyDate,
  formatRetentionDuration,
  getCookiePolicyConfig,
} from '../lib/cookiePolicyConfig';

export default function Cookies() {
  const [showPricing, setShowPricing] = useState(false);
  const [policyConfig, setPolicyConfig] = useState(getCookiePolicyConfig());

  useEffect(() => {
    let isMounted = true;

    async function loadPolicyConfig() {
      const nextConfig = await fetchCookiePolicyConfig();
      if (isMounted) {
        setPolicyConfig(nextConfig);
      }
    }

    loadPolicyConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation onShowPricing={() => setShowPricing(true)} />
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-32">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#1A1A1A]">
          Politique de cookies
        </h1>
        <p className="text-sm text-[#808080] mb-12">
          Dernière mise à jour : {formatCookiePolicyDate(policyConfig.lastUpdated)}
        </p>

        <div className="space-y-8 text-[#4A4A4A] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">1. Pourquoi cette page ?</h2>
            <p>
              Cette page vous explique simplement quels cookies peuvent être utilisés sur le site de Léa Beauté, à quoi
              ils servent, combien de temps ils sont conservés et comment modifier votre choix.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">2. Qu&apos;est-ce qu&apos;un cookie ?</h2>
            <p>
              Un cookie est un petit fichier enregistré sur votre appareil lors de votre navigation. Il permet, selon son
              type, d&apos;assurer le bon fonctionnement du site, de mémoriser vos préférences ou de mesurer l&apos;audience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">3. Cookies utilisés sur le site</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">Cookies strictement nécessaires</h3>
                <p>
                  Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés :
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2">
                  <li>affichage technique du site ;</li>
                  <li>mémorisation de votre choix concernant les cookies ;</li>
                  <li>sécurisation de certaines opérations, notamment lors d&apos;un paiement en ligne.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">Paiement en ligne via Stripe</h3>
                <p>
                  Pour l&apos;achat de cartes cadeaux, le paiement est traité sur l&apos;environnement sécurisé de Stripe. Stripe
                  peut utiliser ses propres cookies techniques pour la sécurité, la prévention de la fraude et la gestion
                  de la session de paiement.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">Mesure d&apos;audience (si activée)</h3>
                {policyConfig.analyticsEnabled ? (
                  <p>
                    Le site peut utiliser Google Analytics 4 uniquement si vous acceptez la catégorie « Mesure
                    d&apos;audience ». Aucun suivi analytique n&apos;est activé avant votre choix.
                  </p>
                ) : (
                  <p>
                    À ce jour, la mesure d&apos;audience n&apos;est pas activée sur le site.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">4. Votre choix</h2>
            <p>
              Vous pouvez à tout moment accepter, refuser ou personnaliser les cookies depuis le bouton de gestion présent
              en bas de page. Les cookies strictement nécessaires restent actifs, car ils sont indispensables au service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">5. Durées de conservation</h2>
            <div className="space-y-4">
              <p>
                Les durées peuvent varier selon la nature du traceur et selon l&apos;intervenant technique concerné.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  Votre choix exprimé dans le bandeau cookies est conservé pendant{" "}
                  {formatRetentionDuration(policyConfig.choiceRetentionDays)} avant nouvelle sollicitation.
                </li>
                <li>
                  La preuve du choix est conservée pendant {formatRetentionDuration(policyConfig.evidenceRetentionDays)}
                  dans notre base de données pour justifier le recueil du consentement.
                </li>
                <li>
                  Les cookies techniques nécessaires liés à la navigation ou à la session sont conservés pendant{" "}
                  {policyConfig.necessaryRetentionLabel}.
                </li>
                <li>
                  Les cookies déposés par Stripe relèvent de {policyConfig.stripeRetentionLabel}.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">6. Paramètres navigateur</h2>
            <p>
              Vous pouvez aussi configurer votre navigateur pour bloquer ou supprimer certains cookies. Attention :
              bloquer les cookies techniques nécessaires peut dégrader le fonctionnement du site, notamment lors du paiement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">7. Contact</h2>
            <p>
              Pour toute question sur cette politique ou sur vos données personnelles, vous pouvez consulter notre
              <Link to="/confidentialite" className="text-[#D4AF37] hover:underline ml-1">
                politique de confidentialité
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
      <Footer onShowPricing={() => setShowPricing(true)} />
      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} />
    </div>
  );
}
