import { Link } from 'react-router-dom';
import Logo from '../assets/photos/logos/logo16-9_1.png';
import { Instagram } from 'lucide-react';

export default function Footer({ onShowPricing }) {
  return (
    <footer className="bg-[#1A1A1A] text-white">
      <div className="w-full px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Logo & Info */}
          <div>
            <img
              src={Logo}
              alt="Léa Beauté Valognes"
              className="h-24 md:h-28 w-auto mb-6"
            />
            <p className="text-white/70 leading-relaxed">
              Votre institut de beauté à Valognes. Élégance, expertise et bien-être depuis des années.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#D4AF37] tracking-wide">Navigation</h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-[#D4AF37] transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/guinot" className="inline-flex items-center gap-2 text-white/70 hover:text-[#D4AF37] transition-colors">
                  Soins Guinot
                </Link>
              </li>
              <li>
                <Link to="/accompagnement-nutrition" className="inline-flex items-center gap-2 text-white/70 hover:text-[#D4AF37] transition-colors">
                  Accompagnement Nutrition
                </Link>
              </li>
              <li>
                <button onClick={onShowPricing} className="inline-flex items-center gap-2 text-white/70 hover:text-[#D4AF37] transition-colors">
                  Tarifs
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#D4AF37] tracking-wide">Contact</h3>
            <ul className="space-y-2.5 text-white/70">
              <li>
                <a href="tel:0233214819" className="inline-flex items-center gap-2 hover:text-[#D4AF37] transition-colors">
                  02 33 21 48 19
                </a>
              </li>
              <li>7 Rue du Palais de Justice</li>
              <li>50700 Valognes</li>
              <li>
                <a
                  href="https://www.instagram.com/leabeautevalognes/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 p-2 text-white/80 hover:border-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
                  title="Instagram Léa Beauté Valognes"
                  aria-label="Instagram Léa Beauté Valognes"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col items-center gap-4 text-center">
          <p className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()} Léa Beauté Valognes. Tous droits réservés.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/mentions-legales" className="text-white/50 hover:text-[#D4AF37] transition-colors">
              Mentions légales
            </Link>
            <Link to="/confidentialite" className="text-white/50 hover:text-[#D4AF37] transition-colors">
              Confidentialité
            </Link>
            <Link to="/cookies" className="text-white/50 hover:text-[#D4AF37] transition-colors">
              Politique cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
