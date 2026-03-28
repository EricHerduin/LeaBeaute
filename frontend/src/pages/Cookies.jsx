import { useEffect, useState } from 'react';
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
          Politique de cookies et autres traceurs
        </h1>
        <p className="text-sm text-[#808080] mb-12">
          Dernière mise à jour : {formatCookiePolicyDate(policyConfig.lastUpdated)}
        </p>

        <div className="space-y-8 text-[#4A4A4A] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">1. Objet de cette politique</h2>
            <p>
              Cette politique explique comment le site de Léa Beauté utilise des cookies, le stockage local du navigateur
              et, plus largement, des traceurs susceptibles d&apos;être déposés ou lus sur votre terminal lorsque vous
              consultez le site ou utilisez certaines fonctionnalités.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">2. Qu&apos;est-ce qu&apos;un traceur ?</h2>
            <p>
              Un traceur est un fichier ou une technologie permettant de stocker ou de lire des informations sur votre
              appareil. Il peut s&apos;agir d&apos;un cookie HTTP, d&apos;un identifiant de session, du stockage local du navigateur
              ou d&apos;une technologie comparable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">3. Traceurs utilisés sur ce site</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">Traceurs strictement nécessaires</h3>
                <p>
                  Le site utilise des traceurs techniques strictement nécessaires à son fonctionnement ou à la fourniture
                  d&apos;un service expressément demandé par l&apos;utilisateur. Ils permettent notamment :
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2">
                  <li>d&apos;assurer le bon affichage et le fonctionnement technique du site ;</li>
                  <li>de mémoriser l&apos;information affichée dans le bandeau d&apos;information relatif aux cookies ;</li>
                  <li>de sécuriser certaines opérations, notamment lors d&apos;un paiement en ligne.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">Paiement en ligne via Stripe</h3>
                <p>
                  Lorsque vous choisissez d&apos;acheter une carte cadeau, vous êtes redirigé vers l&apos;environnement de
                  paiement sécurisé de Stripe. À cette occasion, Stripe peut déposer ses propres traceurs techniques,
                  nécessaires à la sécurité de la transaction, à la prévention de la fraude et à la gestion de la
                  session de paiement.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">Absence de cookies publicitaires ou de mesure d&apos;audience activés par défaut</h3>
                {policyConfig.analyticsEnabled ? (
                  <p>
                    Le site peut utiliser Google Analytics 4 pour mesurer l&apos;audience, uniquement après votre accord
                    explicite sur la catégorie « mesure d&apos;audience ». Aucun suivi analytique n&apos;est chargé avant ce choix.
                  </p>
                ) : (
                  <p>
                    À ce jour, le site n&apos;active pas de traceurs publicitaires ni de mesure d&apos;audience déposés par défaut
                    pour suivre votre navigation à des fins marketing.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">4. Base légale</h2>
            <p>
              Les traceurs strictement nécessaires au fonctionnement du site ou à la fourniture d&apos;un service que vous
              demandez ne nécessitent pas votre consentement préalable. Les autres catégories de traceurs, si elles
              étaient ajoutées ultérieurement, feraient l&apos;objet d&apos;une information spécifique et, le cas échéant, d&apos;un
              recueil de votre consentement avant dépôt.
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
                  Le choix exprimé dans le bandeau cookies est conservé pendant{" "}
                  {formatRetentionDuration(policyConfig.choiceRetentionDays)} avant nouvelle sollicitation.
                </li>
                <li>
                  La preuve du choix enregistré est conservée pendant{" "}
                  {formatRetentionDuration(policyConfig.evidenceRetentionDays)} dans notre base de données,
                  afin de documenter le recueil du consentement en cas de besoin.
                </li>
                <li>
                  Les traceurs strictement nécessaires liés à la navigation ou à la session sont conservés pendant{" "}
                  {policyConfig.necessaryRetentionLabel}.
                </li>
                <li>
                  Les traceurs éventuellement déposés par Stripe relèvent de{" "}
                  {policyConfig.stripeRetentionLabel}.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">6. Gérer les traceurs</h2>
            <p>
              Vous pouvez configurer votre navigateur pour bloquer ou supprimer certains cookies. Toutefois, le blocage
              des traceurs strictement nécessaires peut dégrader le fonctionnement du site ou empêcher l&apos;accès à
              certaines fonctionnalités, notamment le paiement en ligne.
            </p>
            <p className="mt-4">
              Si de nouveaux traceurs soumis à consentement étaient ajoutés au site, un mécanisme dédié vous permettrait
              de les accepter, de les refuser et de modifier votre choix facilement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">7. En savoir plus</h2>
            <p>
              Pour toute question sur cette politique ou sur le traitement de vos données, vous pouvez consulter notre
              <a href="/confidentialite" className="text-[#D4AF37] hover:underline ml-1">
                politique de confidentialité
              </a>
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
