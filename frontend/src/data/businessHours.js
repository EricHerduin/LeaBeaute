// ============================================================
// Service Business Hours - Récupère les données du backend
// ============================================================
import api from '../lib/apiClient';

// Cache des données récupérées du backend
let businessHoursCache = {
  generalHours: {
    0: { open: null, close: null },
    1: { open: '14:00', close: '18:30' },
    2: { open: '09:00', close: '18:30' },
    3: { open: null, close: null },
    4: { open: '09:00', close: '18:30' },
    5: { open: '09:00', close: '18:30' },
    6: { open: '09:00', close: '16:00' }
  },
  exceptions: [],
  holidays: [],
  status: null,
  lastFetch: 0,
  isInitialized: false, // Flag pour savoir si les vraies données ont été chargées
};

const CACHE_DURATION = 15000; // 15 secondes - plus de réactivité
let initializationPromise = null; // Promise pour l'init

/**
 * Force la mise à jour immédiate du cache
 * À appeler après une modification (ajout exception, jour férié, etc.)
 */
export const invalidateCache = async () => {
  businessHoursCache.lastFetch = 0; // Force une nouvelle récupération
  console.log('[BusinessHours] Cache invalidated - forcing refresh');
  return fetchBusinessHoursFromBackend();
};

/**
 * Récupère les horaires du backend et met à jour le cache
 * Force le rechargement si forceRefresh = true
 */
export const fetchBusinessHoursFromBackend = async (forceRefresh = false) => {
  try {
    const now = Date.now();
    
    // N'actualiser que si le cache est trop vieux (sauf si forceRefresh)
    if (!forceRefresh && now - businessHoursCache.lastFetch < CACHE_DURATION) {
      console.log('[BusinessHours] Cache valide, pas de fetch');
      return businessHoursCache;
    }

    console.log('[BusinessHours] Fetching data from backend...');

    const [hoursRes, exceptionsRes, holidaysRes] = await Promise.all([
      api.get('business-hours').catch((err) => {
        console.error('[BusinessHours] Error fetching business-hours:', err.message);
        return { data: null };
      }),
      api.get('business-hours/exceptions').catch((err) => {
        console.error('[BusinessHours] Error fetching exceptions:', err.message);
        return { data: [] };
      }),
      api.get('business-hours/holidays').catch((err) => {
        console.error('[BusinessHours] Error fetching holidays:', err.message);
        return { data: [] };
      })
    ]);
    console.log('[DEBUG][fetchBusinessHoursFromBackend] exceptionsRes =', exceptionsRes);

    // Mettre à jour le cache avec les vraies données
    if (hoursRes.data) {
      businessHoursCache.generalHours = hoursRes.data;
      console.log('[BusinessHours] Updated generalHours:', hoursRes.data);
    }
    if (exceptionsRes.data && Array.isArray(exceptionsRes.data)) {
      businessHoursCache.exceptions = exceptionsRes.data;
      console.log('[BusinessHours] Updated exceptions:', exceptionsRes.data);
    }
    if (holidaysRes.data && Array.isArray(holidaysRes.data)) {
      businessHoursCache.holidays = holidaysRes.data;
      console.log('[BusinessHours] Updated holidays:', holidaysRes.data);
    }
    
    businessHoursCache.lastFetch = now;
    businessHoursCache.isInitialized = true;
    console.log('[BusinessHours] Cache updated successfully');
    return businessHoursCache;
  } catch (error) {
    console.error('[BusinessHours] Unexpected error:', error);
    return businessHoursCache;
  }
};

/**
 * Attendre que l'initialisation soit terminée
 * À appeler avant d'utiliser les données pour la première fois
 */
export const waitForInitialization = async () => {
  if (businessHoursCache.isInitialized) {
    console.log('[BusinessHours] Already initialized');
    return businessHoursCache;
  }
  
  if (!initializationPromise) {
    console.log('[BusinessHours] Starting initialization...');
    initializationPromise = fetchBusinessHoursFromBackend();
  }
  
  return initializationPromise;
};

// Initialiser au chargement du module
if (typeof window !== 'undefined') {
  console.log('[BusinessHours] Module loaded, starting initialization');
  initializationPromise = fetchBusinessHoursFromBackend();
  
  // Puis rafraîchir régulièrement
  const intervalId = setInterval(async () => {
    const now = Date.now();
    if (now - businessHoursCache.lastFetch >= CACHE_DURATION) {
      await fetchBusinessHoursFromBackend();
    }
  }, 5000); // Vérifier toutes les 5 secondes si le cache est expiré
  
  // Stopper le monitoring si le window est unload
  window.addEventListener('beforeunload', () => clearInterval(intervalId));
}

// ============================================================
// Fonctions Utilitaires
// ============================================================

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
    const [h, m] = time.split(':');
    if (m && m !== '00') {
      return `${h}h${m}`;
    }
    return `${h}h`;
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

/**
 * Retourne le message secondaire quand on est fermé
 * Si demain est exceptionnellement fermé, affiche ce message au lieu du prochain jour d'ouverture
 */
const getClosedSecondaryMessage = (startDate) => {
  const tomorrow = new Date(startDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Vérifier si demain est exceptionnellement fermé
  const tomorrowException = getExceptionForDate(tomorrow);
  if (tomorrowException && !tomorrowException.isOpen) {
    // C'est une fermeture exceptionnelle
    const endDate = tomorrowException.endDate || tomorrowException.date;
    
    // Si c'est un jour unique (date === endDate)
    if (tomorrowException.date === endDate) {
      return `Fermeture exceptionnelle demain`;
    }
    
    // C'est une plage
    const endDateObj = new Date(endDate + 'T00:00:00');
    const reopenDate = new Date(endDateObj);
    reopenDate.setDate(reopenDate.getDate() + 1);
    
    // Chercher l'heure de réouverture
    const reopenException = getExceptionForDate(reopenDate);
    let reopenTime = null;
    
    if (reopenException && reopenException.isOpen && reopenException.startTime) {
      reopenTime = formatTime(reopenException.startTime);
    } else {
      const dayHours = getHoursForDay(reopenDate.getDay());
      if (dayHours && dayHours.open) {
        reopenTime = formatTime(dayHours.open);
      }
    }
    
    const startLabel = new Date(tomorrowException.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const endLabel = endDateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const reopenLabel = reopenDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    
    if (reopenTime) {
      return `Institut fermé du ${startLabel} au ${endLabel}\nRéouverture le ${reopenLabel} à ${reopenTime}`;
    } else {
      return `Institut fermé du ${startLabel} au ${endLabel}\nRéouverture le ${reopenLabel}`;
    }
  }
  
  // Vérifier si demain est un jour férié
  if (isHoliday(tomorrow)) {
    const holiday = businessHoursCache.holidays.find((h) => h.date === tomorrow.toISOString().split('T')[0]);
    return `${holiday?.name || 'Jour férié'} demain`;
  }
  
  // Sinon retourner le prochain jour d'ouverture
  const nextOpenTime = getNextOpenDay(startDate);
  return formatNextOpenMessage(nextOpenTime);
};

// ============================================================
// Fonctions Publiques
// ============================================================

/**
 * Vérifie si une date est un jour férié (via le cache)
 */
export const isHoliday = (date) => {
  const dateStr = date.toISOString().split('T')[0];
  return businessHoursCache.holidays.some((h) => h.date === dateStr);
};

/**
 * Récupère une exception pour une date donnée (jour unique ou plage)
 */
export const getExceptionForDate = (date) => {
  const dateStr = date.toISOString().split('T')[0];
  console.log('[DEBUG][getExceptionForDate] businessHoursCache.exceptions =', businessHoursCache.exceptions);
  // Chercher une exception qui couvre cette date
  const found = businessHoursCache.exceptions.find((e) => {
    const startDate = e.date;
    const endDate = e.endDate || e.date; // Si pas d'endDate, c'est un jour unique
    return dateStr >= startDate && dateStr <= endDate;
  });
  if (found) {
    console.log('[DEBUG][getExceptionForDate] Exception trouvée pour', dateStr, ':', found);
  } else {
    console.log('[DEBUG][getExceptionForDate] Aucune exception pour', dateStr);
  }
  return found;
};

/**
 * Récupère les horaires d'un jour de la semaine (0=dimanche, 6=samedi)
 */
export const getHoursForDay = (dayIndex) => {
  return businessHoursCache.generalHours[String(dayIndex)] || null;
};

/**
 * Retourne le statut d'ouverture actuel et les informations
 * Utilise le cache du backend
 * @returns { status: 'open'|'closed', message: string, secondaryMessage: string|null, nextOpenTime: Date|null }
 */
export const getOpeningStatus = () => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const dateStr = now.toISOString().split('T')[0];

  // Vérifier si c'est un jour férié
  if (isHoliday(now)) {
    const holiday = businessHoursCache.holidays.find((h) => h.date === dateStr);
    return {
      status: 'closed',
      message: `Fermé - ${holiday?.name || 'Jour férié'}`,
      secondaryMessage: getClosedSecondaryMessage(now),
      nextOpenTime: getNextOpenDay(now),
    };
  }

  // Vérifier s'il y a une exception pour aujourd'hui
  const exception = getExceptionForDate(now);
  if (exception) {
    // Si la période couvre aujourd'hui ET isOpen: false, on affiche toujours fermé (aucun horaire d'ouverture ne doit être affiché)
    if (!exception.isOpen) {
      // Calculer la date de réouverture (lendemain de endDate)
      const endDateObj = new Date((exception.endDate || exception.date) + 'T00:00:00');
      const reopenDate = new Date(endDateObj);
      reopenDate.setDate(reopenDate.getDate() + 1);
      // Chercher l'heure de réouverture
      let reopenTime = null;
      const reopenException = getExceptionForDate(reopenDate);
      if (reopenException && reopenException.isOpen && reopenException.startTime) {
        reopenTime = formatTime(reopenException.startTime);
      } else {
        const dayHours = getHoursForDay(reopenDate.getDay());
        if (dayHours && dayHours.open) {
          reopenTime = formatTime(dayHours.open);
        }
      }
      // Utiliser le vrai prochain jour ouvert (nextOpenTime)
      const nextOpen = getNextOpenDay(now);
      let secondaryMessage = '';
      if (nextOpen) {
        const label = nextOpen.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        const heure = `${nextOpen.getHours()}h${String(nextOpen.getMinutes()).padStart(2, '0')}`;
        secondaryMessage = `Réouverture le ${label} à ${heure}`;
      } else {
        secondaryMessage = 'Réouverture prochainement';
      }
      return {
        status: 'closed',
        message: `Fermé - ${exception.reason || 'Fermeture exceptionnelle'}`,
        secondaryMessage,
        nextOpenTime: nextOpen,
      };
    }
    // Si la période couvre aujourd'hui ET isOpen: true (modification horaires), on affiche les horaires modifiés
    else if (exception.isOpen) {
      const openMinutes = parseTimeToMinutes(exception.startTime);
      const closeMinutes = parseTimeToMinutes(exception.endTime);
      if (openMinutes !== null && closeMinutes !== null) {
        if (currentTimeInMinutes >= openMinutes && currentTimeInMinutes < closeMinutes) {
          return {
            status: 'open',
            message: `Ouvert actuellement (horaires modifiés)`,
            secondaryMessage: `Ferme à ${formatTime(exception.endTime)}`,
            nextOpenTime: null,
          };
        } else if (currentTimeInMinutes < openMinutes) {
          return {
            status: 'closed',
            message: 'Fermé actuellement',
            secondaryMessage: `Ouvre aujourd'hui à ${formatTime(exception.startTime)} (horaires modifiés)`,
            nextOpenTime: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              Math.floor(openMinutes / 60),
              openMinutes % 60
            ),
          };
        } else {
          const nextOpenTime = getNextOpenDay(now);
          return {
            status: 'closed',
            message: 'Fermé actuellement',
            secondaryMessage: formatNextOpenMessage(nextOpenTime),
            nextOpenTime,
          };
        }
      }
    }
    // Si exception mais pas d'horaires modifiés, on ne doit jamais tomber sur les horaires généraux
    return {
      status: 'closed',
      message: 'Fermé actuellement',
      secondaryMessage: getClosedSecondaryMessage(now),
      nextOpenTime: getNextOpenDay(now),
    };
  }

  // Utiliser les horaires généraux du jour
  const todayHours = getHoursForDay(currentDay);

  if (!todayHours || !todayHours.open || !todayHours.close) {
    return {
      status: 'closed',
      message: 'Fermé actuellement',
      secondaryMessage: getClosedSecondaryMessage(now),
      nextOpenTime: getNextOpenDay(now),
    };
  }

  const openTimeInMinutes = parseTimeToMinutes(todayHours.open);
  const closeTimeInMinutes = parseTimeToMinutes(todayHours.close);

  if (openTimeInMinutes === null || closeTimeInMinutes === null) {
    return {
      status: 'closed',
      message: 'Fermé',
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
  return {
    status: 'closed',
    message: 'Fermé actuellement',
    secondaryMessage: getClosedSecondaryMessage(now),
    nextOpenTime: getNextOpenDay(now),
  };
};

/**
 * Trouve le prochain jour d'ouverture
 */
export const getNextOpenDay = (startDate = new Date()) => {
  let date = new Date(startDate);
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);

  for (let i = 0; i < 14; i++) {
    // Vérifier jour férié
    if (isHoliday(date)) {
      date.setDate(date.getDate() + 1);
      continue;
    }

    // Vérifier exception
    const exception = getExceptionForDate(date);
    if (exception && !exception.isOpen) {
      date.setDate(date.getDate() + 1);
      continue;
    }

    // Déterminer les horaires du jour
    const dayHours = exception && exception.isOpen
      ? { open: exception.startTime, close: exception.endTime }
      : getHoursForDay(date.getDay());

    if (dayHours && dayHours.open && dayHours.close) {
      const openMinutes = parseTimeToMinutes(dayHours.open);
      if (openMinutes !== null) {
        date.setHours(Math.floor(openMinutes / 60), openMinutes % 60, 0, 0);
        return date;
      }
    }

    date.setDate(date.getDate() + 1);
  }

  return null;
};

/**
 * Retourne les informations d'horaires aujourd'hui et demain
 */
export const getTodayAndNextDayHours = () => {
  const now = new Date();
  const today = {
    date: now.toISOString().split('T')[0],
    dayIndex: now.getDay(),
    isOpen: getOpeningStatus().status === 'open',
    hours: null,
    isHoliday: isHoliday(now),
    isException: !!getExceptionForDate(now),
  };

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tmrw = {
    date: tomorrow.toISOString().split('T')[0],
    dayIndex: tomorrow.getDay(),
    hours: null,
    isHoliday: isHoliday(tomorrow),
    isException: !!getExceptionForDate(tomorrow),
  };

  // Récupérer les horaires
  const todayException = getExceptionForDate(now);
  if (todayException && todayException.isOpen) {
    today.hours = {
      open: todayException.startTime,
      close: todayException.endTime,
      isException: true,
    };
  } else if (!today.isHoliday && !todayException) {
    const dayHours = getHoursForDay(today.dayIndex);
    if (dayHours && dayHours.open && dayHours.close) {
      today.hours = { ...dayHours, isException: false };
    }
  }

  const tmrwException = getExceptionForDate(tomorrow);
  if (tmrwException && tmrwException.isOpen) {
    tmrw.hours = {
      open: tmrwException.startTime,
      close: tmrwException.endTime,
      isException: true,
    };
  } else if (!tmrw.isHoliday && !tmrwException) {
    const dayHours = getHoursForDay(tmrw.dayIndex);
    if (dayHours && dayHours.open && dayHours.close) {
      tmrw.hours = { ...dayHours, isException: false };
    }
  }

  return { today, tomorrow: tmrw };
};
/**
 * Teste le statut d'ouverture pour une date spécifique (pour debug)
 * Usage: getOpeningStatusForDate(new Date(2026, 1, 14))
 */
export const getOpeningStatusForDate = (testDate) => {
  const dateStr = testDate.toISOString().split('T')[0];
  const dayIndex = testDate.getDay();
  
  console.log(`[DEBUG] Testing date: ${dateStr} (${['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][dayIndex]})`);
  console.log(`[DEBUG] Exceptions in cache:`, businessHoursCache.exceptions);
  console.log(`[DEBUG] Holidays in cache:`, businessHoursCache.holidays);
  
  // Vérifier si c'est un jour férié
  if (isHoliday(testDate)) {
    console.log(`[DEBUG] Is holiday: YES`);
    const holiday = businessHoursCache.holidays.find((h) => h.date === dateStr);
    return {
      status: 'closed',
      message: `Fermé - ${holiday?.name || 'Jour férié'}`,
      secondaryMessage: getClosedSecondaryMessage(testDate),
      nextOpenTime: getNextOpenDay(testDate),
    };
  }

  // Vérifier s'il y a une exception pour ce jour
  const exception = getExceptionForDate(testDate);
  console.log(`[DEBUG] Exception found:`, exception);
  
  if (exception) {
    if (!exception.isOpen) {
      console.log(`[DEBUG] Exception: CLOSED`);
      return {
        status: 'closed',
        message: `Fermé - ${exception.reason || 'Fermeture exceptionnelle'}`,
        secondaryMessage: getClosedSecondaryMessage(testDate),
        nextOpenTime: getNextOpenDay(testDate),
      };
    }
  }

  // Horaires généraux
  const dayHours = getHoursForDay(dayIndex);
  console.log(`[DEBUG] Day hours:`, dayHours);
  
  if (!dayHours || !dayHours.open || !dayHours.close) {
    console.log(`[DEBUG] Closed (no hours for this day)`);
    return {
      status: 'closed',
      message: 'Fermé actuellement',
      secondaryMessage: getClosedSecondaryMessage(testDate),
      nextOpenTime: getNextOpenDay(testDate),
    };
  }

  return {
    status: 'open',
    message: 'Ouvert',
    secondaryMessage: `De ${formatTime(dayHours.open)} à ${formatTime(dayHours.close)}`,
    nextOpenTime: null,
  };
};

// Export du cache pour accès direct si nécessaire
export const getCache = () => businessHoursCache;
