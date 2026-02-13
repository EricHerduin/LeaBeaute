import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/apiClient';

const dayLabels = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours}h${minutes}`;
};

export default function OpeningHours({ fullWidth = false, showStatus = true }) {
  const [status, setStatus] = useState(null);
  const [generalHours, setGeneralHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchHours = async () => {
      try {
        setLoading(true);
        const [statusRes, hoursRes] = await Promise.all([
          api.get('/business-hours/status'),
          api.get('/business-hours')
        ]);
        
        setStatus(statusRes.data);
        setGeneralHours(hoursRes.data);
        setCurrentTime(new Date());
      } catch (error) {
        console.error('Erreur chargement horaires:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHours();
    const interval = setInterval(fetchHours, 60000); // Mise à jour chaque minute

    return () => clearInterval(interval);
  }, []);

  if (loading || !generalHours) return null;

  const containerClass = fullWidth 
    ? 'w-full' 
    : 'max-w-md';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`${containerClass} bg-white rounded-2xl p-6 md:p-8 shadow-lg border-t-4 border-[#D4AF37]`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2">Horaires d'ouverture</h2>
        {showStatus && status && (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${status.status === 'open' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-semibold ${status.status === 'open' ? 'text-green-600' : 'text-red-600'}`}>
              {status.message}
            </span>
          </div>
        )}
      </div>

      {/* Horaires */}
      <div className="space-y-3">
        {dayLabels.map((day, index) => {
          // Convert index to key: 0=sunday, 1=monday, etc.
          const dayKey = String(index);
          const dayHours = generalHours[dayKey];
          const isClosed = !dayHours || !dayHours.open || !dayHours.close;
          const isToday = currentTime.getDay() === index;

          return (
            <div
              key={index}
              className={`flex justify-between items-center p-3 rounded-lg transition-colors ${
                isToday 
                  ? 'bg-[#FFF9E6] border-l-4 border-[#D4AF37]' 
                  : isClosed 
                  ? 'bg-[#F5F5F5]' 
                  : 'bg-[#FAFAFA]'
              }`}
            >
              <span className={`font-medium ${isToday ? 'text-[#1A1A1A]' : 'text-[#4A4A4A]'}`}>
                {day}
              </span>
              <span className={`text-sm font-semibold ${
                isClosed 
                  ? 'text-[#999]' 
                  : isToday 
                  ? 'text-[#D4AF37]' 
                  : 'text-[#1A1A1A]'
              }`}>
                {isClosed ? 'Fermé' : `${formatTime(dayHours?.open)} - ${formatTime(dayHours?.close)}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Contact */}
      <div className="mt-6 pt-6 border-t border-[#E8DCCA] text-center">
        <p className="text-sm text-[#4A4A4A] mb-3">
          <strong>Téléphone :</strong> <a href="tel:+33233214819" className="text-[#D4AF37] hover:underline">02 33 21 48 19</a>
        </p>
        <a 
          href="/contact"
          className="inline-block px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white rounded-lg hover:shadow-md transition-all text-sm font-semibold"
        >
          Prendre rendez-vous
        </a>
      </div>
    </motion.div>
  );
}
