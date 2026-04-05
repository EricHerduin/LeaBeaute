import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getExceptionForDate, getCache, getOpeningStatus, waitForInitialization } from '../data/businessHours';
import OpeningStatus from './OpeningStatus';

const dayLabels = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours}h${minutes}`;
};

const toLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDayHours = (hours) => {
  if (!hours) return null;
  return {
    morningOpen: hours.morningOpen ?? hours.open ?? null,
    morningClose: hours.morningClose ?? null,
    afternoonOpen: hours.afternoonOpen ?? null,
    afternoonClose: hours.afternoonClose ?? hours.close ?? null,
  };
};

const getDayIntervals = (hours) => {
  const normalized = normalizeDayHours(hours);
  const intervals = [];

  if (normalized?.morningOpen && normalized?.morningClose) {
    intervals.push(`${formatTime(normalized.morningOpen)} - ${formatTime(normalized.morningClose)}`);
  }
  if (normalized?.afternoonOpen && normalized?.afternoonClose) {
    intervals.push(`${formatTime(normalized.afternoonOpen)} - ${formatTime(normalized.afternoonClose)}`);
  }

  return intervals;
};

export default function OpeningHours({ fullWidth = false, showStatus = true, showShortReopen = false, onClosedPeriodChange }) {
  const [status, setStatus] = useState(null);
  const [generalHours, setGeneralHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchHours = async () => {
      try {
        setLoading(true);
        await waitForInitialization();
        const cache = getCache();
        setStatus(getOpeningStatus());
        setGeneralHours(cache.generalHours);
        setCurrentTime(new Date());
      } catch (error) {
        console.error('Erreur chargement horaires:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHours();
  }, []);

  // Vérification période de fermeture
  const today = new Date();
  const exception = getExceptionForDate(today);
  const todayKey = toLocalDateKey(today);
  const isClosedPeriod = exception && !exception.isOpen && exception.endDate && todayKey >= exception.date && todayKey <= exception.endDate;

  // Message bandeau (reprend la logique businessHours.js)
  let closedBannerMessage = null;
  if (isClosedPeriod) {
    const startLabel = new Date(exception.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const endLabel = new Date(exception.endDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    // Correction : trouver le vrai prochain jour d'ouverture après la période, en sautant tous les jours fermés (habituel ou exception)
    // Utiliser la même logique que getNextOpenDay pour trouver le vrai jour de réouverture
    let searchDate = new Date(exception.endDate + 'T00:00:00');
    let reopenDate = null;
    let reopenTime = null;
    for (let i = 0; i < 14; i++) {
      searchDate.setDate(searchDate.getDate() + 1);
      // Vérifier exception de fermeture
      const exceptionForDay = getExceptionForDate(searchDate);
      if (exceptionForDay && !exceptionForDay.isOpen) continue;
      // Vérifier horaires habituels
      const dayIdx = searchDate.getDay();
      const dayHours = generalHours && normalizeDayHours(generalHours[String(dayIdx)]);
      const intervals = getDayIntervals(dayHours);
      if (intervals.length === 0) continue;
      // Si exception d'ouverture modifiée ce jour-là
      if (exceptionForDay && exceptionForDay.isOpen) {
        reopenDate = new Date(searchDate);
        reopenTime = exceptionForDay.startTime;
        break;
      } else {
        reopenDate = new Date(searchDate);
        reopenTime = dayHours.morningOpen || dayHours.afternoonOpen;
        break;
      }
    }
    const reopenLabel = reopenDate ? reopenDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
    closedBannerMessage = `Institut fermé du ${startLabel} au ${endLabel} — Réouverture le ${reopenLabel}${reopenTime ? ' à ' + reopenTime : ''}`;
  }

  // Remonter l'info au parent
  useEffect(() => {
    if (onClosedPeriodChange) {
      onClosedPeriodChange(isClosedPeriod, closedBannerMessage);
    }
    // eslint-disable-next-line
  }, [isClosedPeriod, closedBannerMessage]);

  if (loading || !generalHours) return null;

  const containerClass = fullWidth 
    ? 'w-full' 
    : 'max-w-md sm:max-w-lg md:max-w-xl';

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
          <OpeningStatus isScrolled={false} showShortReopen={isClosedPeriod} />
        )}
        {/* Affichage motif/période sous le titre si période de fermeture */}
        {isClosedPeriod && exception && (
          <div className="mt-2 text-[#999] text-sm font-semibold">
            {(() => {
              const motif = exception.reason && exception.reason.trim() !== '' ? exception.reason : null;
              const startLabel = new Date(exception.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
              const endLabel = exception.endDate ? new Date(exception.endDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : null;
              if (!exception.isOpen) {
                if (endLabel && endLabel !== startLabel) {
                  // Format : du 11 au 15 février
                  const startDay = new Date(exception.date + 'T00:00:00').getDate();
                  const endDay = exception.endDate ? new Date(exception.endDate + 'T00:00:00').getDate() : startDay;
                  const month = new Date(exception.endDate ? exception.endDate + 'T00:00:00' : exception.date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long' });
                  return motif ? `Nous sommes fermés exceptionnellement du ${startDay} au ${endDay} ${month} pour ${motif}.` : `Nous sommes fermés exceptionnellement du ${startDay} au ${endDay} ${month}.`;
                } else {
                  // Format : le 11 février
                  const day = new Date(exception.date + 'T00:00:00').getDate();
                  const month = new Date(exception.date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long' });
                  return motif ? `Nous sommes fermés exceptionnellement le ${day} ${month} pour ${motif}.` : `Nous sommes fermés exceptionnellement le ${day} ${month}.`;
                }
              } else {
                // Cas ouverture/fermeture exceptionnelle
                const heure = exception.startTime || exception.endTime;
                if (endLabel && endLabel !== startLabel) {
                  return `Nous ouvrons ou fermons exceptionnellement à ${heure} du ${startLabel} au ${endLabel} (${motif})`;
                } else {
                  return `Nous ouvrons ou fermons exceptionnellement à ${heure} le ${startLabel} (${motif})`;
                }
              }
            })()}
          </div>
        )}
      </div>

      {/* Affichage des horaires avec gestion des exceptions */}
      <div className="space-y-3">
        {dayLabels.map((day, index) => {
          const dayKey = String(index);
          const dayHours = normalizeDayHours(generalHours[dayKey]);
          const dayIntervals = getDayIntervals(dayHours);
          const isClosed = dayIntervals.length === 0;
          const isToday = currentTime.getDay() === index;
          // Calcul de la date du jour affiché (année/mois/jour corrects)
          const today = new Date(); today.setHours(0,0,0,0);
          const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
          const dateObj = new Date(weekStart); dateObj.setDate(weekStart.getDate() + index);

          // Recherche exception couvrant ce jour
          const exception = getExceptionForDate(dateObj);
          let horaires = dayIntervals.join('  •  ');

          // Cas 1 : Jour habituellement fermé
          if (isClosed) {
            horaires = <span className="text-[#999]">Fermé</span>;
          }
          // Cas 2 : Jour à venir ou aujourd'hui, dans période d'exception, habituellement ouvert
          else if (
            exception && !exception.isOpen && dateObj.getTime() >= today.getTime() && dateObj.getTime() <= new Date(exception.endDate + 'T00:00:00').getTime()
          ) {
            horaires = <span className="line-through text-[#999]">{horaires}</span>;
          }
          // Cas 3 : Jour passé dans période d'exception, habituellement ouvert
          else if (
            exception && !exception.isOpen && dateObj.getTime() < today.getTime() && dateObj.getTime() >= new Date(exception.date + 'T00:00:00').getTime()
          ) {
            // Affichage normal (horaires habituels)
            // Rien à changer
          }

          return (
            <div
              key={index}
              className={`flex justify-between items-center gap-3 p-3 rounded-lg transition-colors ${
                isToday 
                  ? 'bg-[#FFF9E6] border-l-4 border-[#D4AF37]' 
                  : isClosed 
                  ? 'bg-[#F5F5F5]' 
                  : 'bg-[#FAFAFA]'
              }`}
            >
              <span className={`font-medium text-sm sm:text-base ${isToday ? 'text-[#1A1A1A]' : 'text-[#4A4A4A]'}`}>{day}</span>
              <span className={`text-[11px] sm:text-sm font-semibold ${
                isClosed
                  ? 'text-[#999]' 
                  : isToday 
                  ? 'text-[#D4AF37]' 
                  : 'text-[#1A1A1A]'
              } flex items-center text-right`}>
                {horaires}
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
            className="inline-block px-4 py-2 bg-linear-to-r from-[#D4AF37] to-[#C5A028] text-white rounded-lg hover:shadow-md transition-all text-sm font-semibold"
        >
          Prendre rendez-vous
        </a>
      </div>
    </motion.div>
  );
}
