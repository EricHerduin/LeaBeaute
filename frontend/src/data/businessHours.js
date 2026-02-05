// Horaires d'ouverture de l'institut Léa Beauté
// Les jours sont en nombre : 0 = dimanche, 1 = lundi, ..., 6 = samedi

export const BUSINESS_HOURS = {
  0: null, // Dimanche - fermé
  1: { open: 14, close: '18:30' }, // Lundi
  2: { open: 9, close: '18:30' }, // Mardi
  3: null, // Mercredi - fermé
  4: { open: 9, close: '18:30' }, // Jeudi
  5: { open: 9, close: '18:30' }, // Vendredi
  6: { open: 9, close: 16 }, // Samedi
};

const parseTimeToMinutes = (time) => {
  if (typeof time === 'number') {
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    return hours * 60 + minutes;
  }

  if (typeof time === 'string') {
    const [h, m] = time.split(':').map((val) => parseInt(val, 10));
    if (Number.isNaN(h)) return null;
    return h * 60 + (Number.isNaN(m) ? 0 : m);
  }

  return null;
};

const formatTime = (time) => {
  if (typeof time === 'string') {
    return time;
  }

  if (typeof time === 'number') {
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    return minutes > 0 ? `${hours}h${String(minutes).padStart(2, '0')}` : `${hours}h`;
  }

  return '';
};

const formatNextOpenMessage = (nextOpenTime) => {
  if (!nextOpenTime) return 'Ouvre bientôt';

  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const isTomorrow =
    nextOpenTime.getFullYear() === tomorrow.getFullYear() &&
    nextOpenTime.getMonth() === tomorrow.getMonth() &&
    nextOpenTime.getDate() === tomorrow.getDate();

  const timeLabel = `${nextOpenTime.getHours()}h${String(nextOpenTime.getMinutes()).padStart(2, '0')}`;

  if (isTomorrow) {
    return `Ouvre demain à ${timeLabel}`;
  }

  const dayLabel = nextOpenTime.toLocaleDateString('fr-FR', { weekday: 'long' });
  return `Ouvre ${dayLabel} à ${timeLabel}`;
};

// Jours fériés français 2024-2027
export const FRENCH_HOLIDAYS = [
  // 2024
  '2024-01-01', // Jour de l'an
  '2024-04-01', // Lundi de Pâques
  '2024-05-01', // Fête du Travail
  '2024-05-08', // Victoire 1945
  '2024-05-09', // Ascension
  '2024-05-20', // Lundi de Pentecôte
  '2024-07-14', // Bastille
  '2024-08-15', // Assomption
  '2024-11-01', // Toussaint
  '2024-11-11', // Armistice
  '2024-12-25', // Noël
  // 2025
  '2025-01-01',
  '2025-04-21',
  '2025-05-01',
  '2025-05-08',
  '2025-05-29',
  '2025-06-09',
  '2025-07-14',
  '2025-08-15',
  '2025-11-01',
  '2025-11-11',
  '2025-12-25',
  // 2026
  '2026-01-01',
  '2026-04-05',
  '2026-05-01',
  '2026-05-08',
  '2026-05-14',
  '2026-05-25',
  '2026-07-14',
  '2026-08-15',
  '2026-11-01',
  '2026-11-11',
  '2026-12-25',
  // 2027
  '2027-01-01',
  '2027-03-28',
  '2027-05-01',
  '2027-05-08',
  '2027-05-06',
  '2027-05-17',
  '2027-07-14',
  '2027-08-15',
  '2027-11-01',
  '2027-11-11',
  '2027-12-25',
];

/**
 * Vérifie si une date donnée est un jour férié
 */
export const isHoliday = (date) => {
  const dateStr = date.toISOString().split('T')[0];
  return FRENCH_HOLIDAYS.includes(dateStr);
};

/**
 * Retourne le statut d'ouverture actuel et les informations
 * @returns { status: 'open'|'closed', message: string, nextOpenTime: Date|null }
 */
export const getOpeningStatus = () => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Vérifier si c'est un jour férié
  if (isHoliday(now)) {
    const nextOpenTime = getNextOpenDay(now);
    return {
      status: 'closed',
      message: 'Fermé actuellement',
      secondaryMessage: formatNextOpenMessage(nextOpenTime),
      nextOpenTime,
    };
  }

  const todayHours = BUSINESS_HOURS[currentDay];

  // Si dimanche ou fermé aujourd'hui
  if (!todayHours) {
    const nextOpenTime = getNextOpenDay(now);
    return {
      status: 'closed',
      message: 'Fermé actuellement',
      secondaryMessage: formatNextOpenMessage(nextOpenTime),
      nextOpenTime,
    };
  }

  const openTimeInMinutes = parseTimeToMinutes(todayHours.open);
  const closeTimeInMinutes = parseTimeToMinutes(todayHours.close);

  if (openTimeInMinutes === null || closeTimeInMinutes === null) {
    return {
      status: 'closed',
      message: "Fermé",
      nextOpenTime: getNextOpenDay(now),
    };
  }

  // Vérifier si on est dans les horaires d'ouverture
  if (currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes) {
    return {
      status: 'open',
      message: 'Ouvert actuellement',
      secondaryMessage: `Ferme à ${formatTime(todayHours.close)}`,
      nextOpenTime: null,
    };
  }

  // Si c'est avant l'ouverture
  if (currentTimeInMinutes < openTimeInMinutes) {
    return {
      status: 'closed',
      message: 'Fermé actuellement',
      secondaryMessage: `Ouvre aujourd'hui à ${formatTime(todayHours.open)}`,
      nextOpenTime: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        Math.floor(openTimeInMinutes / 60),
        openTimeInMinutes % 60
      ),
    };
  }

  // Si c'est après la fermeture
  const nextOpenTime = getNextOpenDay(now);
  return {
    status: 'closed',
    message: 'Fermé actuellement',
    secondaryMessage: formatNextOpenMessage(nextOpenTime),
    nextOpenTime,
  };
};

/**
 * Trouve le prochain jour d'ouverture
 */
export const getNextOpenDay = (startDate = new Date()) => {
  let date = new Date(startDate);
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);

  // Chercher jusqu'à 7 jours à l'avance
  for (let i = 0; i < 7; i++) {
    if (isHoliday(date)) {
      date.setDate(date.getDate() + 1);
      continue;
    }

    const dayHours = BUSINESS_HOURS[date.getDay()];
    if (dayHours) {
      const openMinutes = parseTimeToMinutes(dayHours.open);
      if (openMinutes === null) return null;
      date.setHours(Math.floor(openMinutes / 60), openMinutes % 60, 0, 0);
      return date;
    }

    date.setDate(date.getDate() + 1);
  }

  return null;
};
