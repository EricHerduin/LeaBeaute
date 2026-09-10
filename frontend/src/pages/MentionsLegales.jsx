import { useState } from 'react';
import { Link } from 'react-router-dom';
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
            <p><strong>Dénomination :</strong> Léa Beauté Valognes</p>
            <p><strong>Nom / Exploitante :</strong> LETENNEUR Léa</p>
            <p><strong>Activité :</strong> Institut de beauté</p>
            <p><strong>Adresse :</strong> 7 Rue du Palais de Justice, 50700 Valognes, France</p>
            <p><strong>Téléphone :</strong> 02 33 21 48 19</p>
            <p><strong>Email :</strong> contact@leabeautevalognes.fr</p>
            <p><strong>SIREN :</strong> 494 064 157</p>
            <p><strong>SIRET :</strong> 494 064 157 00030</p>
            <p><strong>RCS :</strong> Cherbourg 494 064 157</p>
            <p><strong>N° TVA intracommunautaire :</strong> FR85 494064157</p>
            <p><strong>Directrice de la publication :</strong> LETENNEUR Léa</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Hébergement</h2>
            <p><strong>Hébergeur :</strong> o2switch</p>
            <p><strong>Raison sociale :</strong> o2switch, SAS au capital de 100 000 €</p>
            <p><strong>Adresse :</strong> Chemin des Pardiaux, 63000 Clermont-Ferrand, France</p>
            <p><strong>Téléphone :</strong> 04 44 44 60 40</p>
            <p><strong>SIRET :</strong> 510 909 807 00032</p>
            <p><strong>RCS :</strong> Clermont-Ferrand</p>
            <p><strong>Site :</strong> https://www.o2switch.fr</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des contenus présents sur ce site (textes, visuels, graphismes, logos, vidéos, éléments de design, structure)
              est protégé par le Code de la propriété intellectuelle et reste la propriété de Léa Beauté Valognes ou de ses partenaires
              autorisés, sauf mention contraire.
            </p>
            <p className="mt-3">
              Toute reproduction, représentation, adaptation, diffusion ou exploitation, totale ou partielle, sans autorisation écrite
              préalable est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Responsabilité</h2>
            <p>
              Les informations publiées sur ce site sont fournies à titre informatif. Léa Beauté Valognes s&apos;efforce d&apos;assurer
              l&apos;exactitude et la mise à jour des contenus, mais ne peut garantir l&apos;absence totale d&apos;erreurs, d&apos;omissions ou
              d&apos;indisponibilités.
            </p>
            <p className="mt-3">
              L&apos;éditeur ne saurait être tenu responsable des dommages directs ou indirects pouvant résulter de l&apos;utilisation du site,
              de son indisponibilité, ou de l&apos;utilisation de services tiers accessibles via des liens externes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Données personnelles et cookies</h2>
            <p>
              Le traitement des données personnelles et l&apos;utilisation des cookies sont décrits dans les pages dédiées :
              <Link to="/confidentialite" className="ml-1 text-[#D4AF37] hover:underline">Politique de confidentialité</Link>
              {' '}et
              <Link to="/cookies" className="ml-1 text-[#D4AF37] hover:underline">Politique cookies</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Médiation de la consommation</h2>
            <p>
              Conformément aux articles L.612-1 et suivants du Code de la consommation, en cas de litige non résolu avec l&apos;institut,
              le client consommateur peut recourir gratuitement à un médiateur de la consommation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Droit applicable</h2>
            <p>
              Le présent site est soumis au droit français. En cas de litige, et à défaut de résolution amiable préalable,
              les juridictions françaises seront seules compétentes.
            </p>
          </section>

          <section>
            <p className="text-sm text-[#808080]">
              Dernière mise à jour : 3 avril 2026
            </p>
          </section>
        </div>
      </div>
      <Footer onShowPricing={() => setShowPricing(true)} />
      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} />
    </div>
  );
}
