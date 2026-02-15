import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchBusinessHoursFromBackend, getOpeningStatus } from '../data/businessHours';
import OpeningHours from './OpeningHours';

export default function Contact() {
  const [hours, setHours] = useState([]);
  const [status, setStatus] = useState(null);
  const [isClosedPeriod, setIsClosedPeriod] = useState(false);

  useEffect(() => {
    const fetchHours = async () => {
      const data = await fetchBusinessHoursFromBackend();
      // Adapter le format pour l'affichage
      const days = [
        'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
      ];
      const result = days.map((day, idx) => {
        const h = data.generalHours[idx] || {};
        return {
          day,
          hours: h.open && h.close ? `${h.open}–${h.close}` : 'Fermé'
        };
      });
      setHours(result);
      setStatus(getOpeningStatus());
    };
    fetchHours();
  }, []);

  const handleClosedPeriodChange = (isClosed, message) => {
    setIsClosedPeriod(isClosed);
    // setClosedBannerMessage n'existe pas, la gestion du bandeau est assurée par OpeningHours
  };

  return (
    <section id="contact" className="py-24 md:py-32 bg-[#F9F7F2]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-[#1A1A1A]">
            Nous <span className="gold-gradient-text italic">contacter</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="glass-card p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-6 text-[#1A1A1A]">Coordonnées</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-4 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-[#1A1A1A] mb-1">Téléphone</p>
                    <a href="tel:0233214819" data-testid="contact-phone" className="text-[#D4AF37] hover:underline text-lg">
                      02 33 21 48 19
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-4 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-[#1A1A1A] mb-1">Adresse</p>
                    <p className="text-[#4A4A4A]">7 Rue du Palais de Justice</p>
                    <p className="text-[#4A4A4A]">50700 Valognes</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <a
                  href="https://www.google.com/maps/dir//7+Rue+du+Palais+de+Justice,+50700+Valognes"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="contact-directions"
                  className="btn-gold w-full inline-flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Itinéraire
                </a>
              </div>
            </div>
          </motion.div>

          {/* Business Hours */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1"
          >
            <OpeningHours fullWidth={true} showStatus={true} showShortReopen={isClosedPeriod} onClosedPeriodChange={handleClosedPeriodChange} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}