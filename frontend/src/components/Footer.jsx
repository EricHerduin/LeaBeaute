import { Link } from 'react-router-dom';

export default function Footer({ onShowPricing }) {
  return (
    <footer className="bg-[#1A1A1A] text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Logo & Info */}
          <div>
            <img
              src="https://customer-assets.emergentagent.com/job_2c5a61ba-d41e-4013-9ecc-f1a07917e6f6/artifacts/hpgw4x9j_logo16-9_1.png"
              alt="Léa Beauté Valognes"
              className="h-24 md:h-28 w-auto mb-6"
            />
            <p className="text-white/70 leading-relaxed">
              Votre institut de beauté à Valognes. Élégance, expertise et bien-être depuis des années.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#D4AF37]">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-white/70 hover:text-[#D4AF37] transition-colors">Accueil</Link>
              </li>
              <li>
                <Link to="/guinot" className="text-white/70 hover:text-[#D4AF37] transition-colors">Soins Guinot</Link>
              </li>
              <li>
                <Link to="/accompagnement-nutrition" className="text-white/70 hover:text-[#D4AF37] transition-colors">Accompagnement Nutrition</Link>
              </li>
              <li>
                <button onClick={onShowPricing} className="text-white/70 hover:text-[#D4AF37] transition-colors">
                  Tarifs
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#D4AF37]">Contact</h3>
            <ul className="space-y-2 text-white/70">
              <li>
                <a href="tel:0233214819" className="hover:text-[#D4AF37] transition-colors">02 33 21 48 19</a>
              </li>
              <li>7 Rue du Palais de Justice</li>
              <li>50700 Valognes</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()} Léa Beauté Valognes. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/mentions-legales" className="text-white/50 hover:text-[#D4AF37] transition-colors">
              Mentions légales
            </Link>
            <Link to="/confidentialite" className="text-white/50 hover:text-[#D4AF37] transition-colors">
              Confidentialité
            </Link>
            <Link to="/cookies" className="text-white/50 hover:text-[#D4AF37] transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}