// ============================================================
// Service Business Hours - Récupère les données du backend
// ============================================================
import api from '../lib/apiClient';

const getBusinessHoursStore = () => {
  if (typeof window === 'undefined') {
    return {
      cache: null,
      initializationPromise: null,
      inFlightFetchPromise: null,
    };
  }

  if (!window.__leaBusinessHoursStore) {
    window.__leaBusinessHoursStore = {
      cache: null,
      initializationPromise: null,
      inFlightFetchPromise: null,
    };
  }

  return window.__leaBusinessHoursStore;
};

// Cache des données récupérées du backend
let businessHoursCache = {
  generalHours: {
    0: { morningOpen: null, morningClose: null, afternoonOpen: null, afternoonClose: null },
    1: { morningOpen: null, morningClose: null, afternoonOpen: '14:00', afternoonClose: '18:30' },
    2: { morningOpen: '09:00', morningClose: '12:00', afternoonOpen: '14:00', afternoonClose: '18:30' },
    3: { morningOpen: null, morningClose: null, afternoonOpen: null, afternoonClose: null },
    4: { morningOpen: '09:00', morningClose: '12:00', afternoonOpen: '14:00', afternoonClose: '18:30' },
    5: { morningOpen: '09:00', morningClose: '12:00', afternoonOpen: '14:00', afternoonClose: '18:30' },
    6: { morningOpen: '09:00', morningClose: '12:00', afternoonOpen: '14:00', afternoonClose: '16:00' }
  },
  exceptions: [],
  holidays: [],
  status: null,
  lastFetch: 0,
  isInitialized: false, // Flag pour savoir si les vraies données ont été chargées
};

const CACHE_DURATION = import.meta.env.DEV ? 30000 : 3600000; // 30s en dev, 1h en prod

const toLocalDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDayHours = (hours) => {
  if (!hours) {
    return {
      morningOpen: null,
      morningClose: null,
      afternoonOpen: null,
      afternoonClose: null,
    };
  }

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

  if (normalized.morningOpen && normalized.morningClose) {
    intervals.push({ open: normalized.morningOpen, close: normalized.morningClose, label: 'morning' });
  }
  if (normalized.afternoonOpen && normalized.afternoonClose) {
    intervals.push({ open: normalized.afternoonOpen, close: normalized.afternoonClose, label: 'afternoon' });
  }

  return intervals;
};

const getFirstOpening = (hours) => getDayIntervals(hours)[0]?.open || null;
const getLastClosing = (hours) => {
  const intervals = getDayIntervals(hours);
  return intervals[intervals.length - 1]?.close || null;
};

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
  const store = getBusinessHoursStore();
  if (store.cache) {
    businessHoursCache = store.cache;
  }

  let inFlightFetchPromise = store.inFlightFetchPromise;

  if (inFlightFetchPromise) {
    return inFlightFetchPromise;
  }

  try {
    const now = Date.now();

    // N'actualiser que si le cache est trop vieux (sauf si forceRefresh)
    if (!forceRefresh && now - businessHoursCache.lastFetch < CACHE_DURATION) {
      console.log('[BusinessHours] Cache valide, pas de fetch');
      return businessHoursCache;
    }

    inFlightFetchPromise = (async () => {
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

      if (hoursRes.data) {
        const normalizedHours = {};
        for (let dayIndex = 0; dayIndex <= 6; dayIndex += 1) {
          normalizedHours[String(dayIndex)] = normalizeDayHours(hoursRes.data[String(dayIndex)] ?? hoursRes.data[dayIndex]);
        }
        businessHoursCache.generalHours = normalizedHours;
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

      businessHoursCache.lastFetch = Date.now();
      businessHoursCache.isInitialized = true;
      store.cache = businessHoursCache;
      console.log('[BusinessHours] Cache updated successfully');
      return businessHoursCache;
    })();

    store.inFlightFetchPromise = inFlightFetchPromise;

    return await inFlightFetchPromise;
  } catch (error) {
    console.error('[BusinessHours] Unexpected error:', error);
    return businessHoursCache;
  } finally {
    store.inFlightFetchPromise = null;
  }
};

/**
 * Attendre que l'initialisation soit terminée
 * À appeler avant d'utiliser les données pour la première fois
 */
export const waitForInitialization = async () => {
  const store = getBusinessHoursStore();
  if (store.cache) {
    businessHoursCache = store.cache;
  }

  if (businessHoursCache.isInitialized) {
    console.log('[BusinessHours] Already initialized');
    return businessHoursCache;
  }
  
  if (!store.initializationPromise) {
    console.log('[BusinessHours] Starting initialization...');
    store.initializationPromise = fetchBusinessHoursFromBackend();
  }
  
  return store.initializationPromise;
};

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

const formatFullDateLabel = (date) => date.toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const formatDayMonthLabel = (date) => date.toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
});

const isExceptionClosedOnDate = (date) => {
  const exception = getExceptionForDate(date);
  return Boolean(exception && !exception.isOpen);
};

const isFullyClosedOnDate = (date) => isHoliday(date) || isExceptionClosedOnDate(date);

const getConsecutiveClosedRange = (startDate, maxDays = 30) => {
  if (!isFullyClosedOnDate(startDate)) {
    return null;
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);

  for (let i = 0; i < maxDays; i += 1) {
    const next = new Date(end);
    next.setDate(next.getDate() + 1);
    if (!isFullyClosedOnDate(next)) {
      break;
    }
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
};

const formatClosedRangeWithReopen = (rangeStart, rangeEnd, nextOpenTime) => {
  const startLabel = formatDayMonthLabel(rangeStart);
  const endLabel = formatDayMonthLabel(rangeEnd);
  const reopenLine = formatNextOpenMessage(nextOpenTime, { includeDate: true, prefix: 'Réouverture' });
  return `Institut fermé du ${startLabel} au ${endLabel}\n${reopenLine}`;
};

const formatNextOpenMessage = (nextOpenTime, options = {}) => {
  const { includeDate = false, prefix = 'Ouvre' } = options;
  if (!nextOpenTime) return 'Réouverture prochainement';
  const timeLabel = `${nextOpenTime.getHours()}h${String(nextOpenTime.getMinutes()).padStart(2, '0')}`;

  if (includeDate) {
    const dayLabel = formatFullDateLabel(nextOpenTime);
    return `${prefix} le ${dayLabel} à ${timeLabel}`;
  }

  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const isTomorrow =
    nextOpenTime.getFullYear() === tomorrow.getFullYear()
    && nextOpenTime.getMonth() === tomorrow.getMonth()
    && nextOpenTime.getDate() === tomorrow.getDate();

  if (isTomorrow) {
    return `${prefix} demain à ${timeLabel}`;
  }

  const dayLabel = nextOpenTime.toLocaleDateString('fr-FR', { weekday: 'long' });
  return `${prefix} ${dayLabel} à ${timeLabel}`;
};

/**
 * Retourne le message secondaire quand on est fermé
 * Si demain est exceptionnellement fermé, affiche ce message au lieu du prochain jour d'ouverture
 */
const getClosedSecondaryMessage = (startDate) => {
  const tomorrow = new Date(startDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  // Vérifier si demain est exceptionnellement fermé
  const tomorrowException = getExceptionForDate(tomorrow);
  if (tomorrowException && !tomorrowException.isOpen) {
    const closedRange = getConsecutiveClosedRange(tomorrow);
    if (closedRange && toLocalDateKey(closedRange.start) !== toLocalDateKey(closedRange.end)) {
      const nextOpenTime = getNextOpenDay(closedRange.end);
      return formatClosedRangeWithReopen(closedRange.start, closedRange.end, nextOpenTime);
    }

    // C'est une fermeture exceptionnelle
    const endDate = tomorrowException.endDate || tomorrowException.date;
    
    // Si c'est un jour unique (date === endDate)
    if (tomorrowException.date === endDate) {
      const nextOpenTime = getNextOpenDay(tomorrow);
      return `Fermeture exceptionnelle demain\n${formatNextOpenMessage(nextOpenTime, { includeDate: true, prefix: 'Réouverture' })}`;
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
      const firstOpening = getFirstOpening(dayHours);
      if (firstOpening) {
        reopenTime = formatTime(firstOpening);
      }
    }
    
    const startLabel = formatFullDateLabel(new Date(tomorrowException.date + 'T00:00:00'));
    const endLabel = formatFullDateLabel(endDateObj);
    const reopenLabel = formatFullDateLabel(reopenDate);
    
    if (reopenTime) {
      return `Institut fermé du ${startLabel} au ${endLabel}\nRéouverture le ${reopenLabel} à ${reopenTime}`;
    } else {
      return `Institut fermé du ${startLabel} au ${endLabel}\nRéouverture le ${reopenLabel}`;
    }
  }
  
  // Vérifier si demain est un jour férié
  if (isHoliday(tomorrow)) {
    const closedRange = getConsecutiveClosedRange(tomorrow);
    if (closedRange && toLocalDateKey(closedRange.start) !== toLocalDateKey(closedRange.end)) {
      const nextOpenTime = getNextOpenDay(closedRange.end);
      return formatClosedRangeWithReopen(closedRange.start, closedRange.end, nextOpenTime);
    }

    const holiday = businessHoursCache.holidays.find((h) => h.date === toLocalDateKey(tomorrow));
    const nextOpenTime = getNextOpenDay(tomorrow);
    return `${holiday?.name || 'Jour férié'} demain\n${formatNextOpenMessage(nextOpenTime, { includeDate: true, prefix: 'Réouverture' })}`;
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
  const dateStr = toLocalDateKey(date);
  if (!dateStr || !Array.isArray(businessHoursCache.holidays)) return false;
  return businessHoursCache.holidays.some((h) => h && typeof h.date === 'string' && h.date === dateStr);
};

/**
 * Récupère une exception pour une date donnée (jour unique ou plage)
 */
export const getExceptionForDate = (date) => {
  const dateStr = toLocalDateKey(date);
  if (!dateStr || !Array.isArray(businessHoursCache.exceptions)) return null;
  // Chercher une exception qui couvre cette date
  return businessHoursCache.exceptions.find((e) => {
    if (!e || typeof e.date !== 'string' || e.date.length === 0) return false;
    const startDate = e.date;
    const endDate = e.endDate || e.date; // Si pas d'endDate, c'est un jour unique
    return dateStr >= startDate && dateStr <= endDate;
  }) || null;
};

/**
 * Récupère les horaires d'un jour de la semaine (0=dimanche, 6=samedi)
 */
export const getHoursForDay = (dayIndex) => {
  return normalizeDayHours(businessHoursCache.generalHours[String(dayIndex)] || null);
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
  const dateStr = toLocalDateKey(now);

  // Vérifier si c'est un jour férié
  if (isHoliday(now)) {
    const holiday = businessHoursCache.holidays.find((h) => h.date === dateStr);
    const closedRange = getConsecutiveClosedRange(now);
    const nextOpen = getNextOpenDay(closedRange?.end || now);
    const secondaryMessage = closedRange && toLocalDateKey(closedRange.start) !== toLocalDateKey(closedRange.end)
      ? formatClosedRangeWithReopen(closedRange.start, closedRange.end, nextOpen)
      : formatNextOpenMessage(nextOpen, { includeDate: true, prefix: 'Réouverture' });
    return {
      status: 'closed',
      message: `Fermé - ${holiday?.name || 'Jour férié'}`,
      secondaryMessage,
      nextOpenTime: nextOpen,
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
        const firstOpening = getFirstOpening(dayHours);
        if (firstOpening) {
          reopenTime = formatTime(firstOpening);
        }
      }
      // Utiliser le vrai prochain jour ouvert (nextOpenTime)
      const nextOpen = getNextOpenDay(now);
      let secondaryMessage = '';
      if (nextOpen) {
        const label = formatFullDateLabel(nextOpen);
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
  const todayIntervals = getDayIntervals(todayHours);

  if (todayIntervals.length === 0) {
    return {
      status: 'closed',
      message: 'Fermé actuellement',
      secondaryMessage: getClosedSecondaryMessage(now),
      nextOpenTime: getNextOpenDay(now),
    };
  }

  for (const interval of todayIntervals) {
    const openTimeInMinutes = parseTimeToMinutes(interval.open);
    const closeTimeInMinutes = parseTimeToMinutes(interval.close);

    if (openTimeInMinutes === null || closeTimeInMinutes === null) {
      continue;
    }

    if (currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes) {
      return {
        status: 'open',
        message: 'Ouvert actuellement',
        secondaryMessage: `Ferme à ${formatTime(interval.close)}`,
        nextOpenTime: null,
      };
    }

    if (currentTimeInMinutes < openTimeInMinutes) {
      return {
        status: 'closed',
        message: 'Fermé actuellement',
        secondaryMessage: `Ouvre aujourd'hui à ${formatTime(interval.open)}`,
        nextOpenTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          Math.floor(openTimeInMinutes / 60),
          openTimeInMinutes % 60
        ),
      };
    }
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
      ? {
          morningOpen: exception.startTime,
          morningClose: exception.endTime,
          afternoonOpen: null,
          afternoonClose: null,
        }
      : getHoursForDay(date.getDay());

    const firstOpening = getFirstOpening(dayHours);
    if (firstOpening) {
      const openMinutes = parseTimeToMinutes(firstOpening);
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
    date: toLocalDateKey(now),
    dayIndex: now.getDay(),
    isOpen: getOpeningStatus().status === 'open',
    hours: null,
    isHoliday: isHoliday(now),
    isException: !!getExceptionForDate(now),
  };

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tmrw = {
    date: toLocalDateKey(tomorrow),
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
    const firstOpening = getFirstOpening(dayHours);
    const lastClosing = getLastClosing(dayHours);
    if (firstOpening && lastClosing) {
      today.hours = { open: firstOpening, close: lastClosing, ...dayHours, isException: false };
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
    const firstOpening = getFirstOpening(dayHours);
    const lastClosing = getLastClosing(dayHours);
    if (firstOpening && lastClosing) {
      tmrw.hours = { open: firstOpening, close: lastClosing, ...dayHours, isException: false };
    }
  }

  return { today, tomorrow: tmrw };
};
/**
 * Teste le statut d'ouverture pour une date spécifique (pour debug)
 * Usage: getOpeningStatusForDate(new Date(2026, 1, 14))
 */
export const getOpeningStatusForDate = (testDate) => {
  const dateStr = toLocalDateKey(testDate);
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
  const firstOpening = getFirstOpening(dayHours);
  const lastClosing = getLastClosing(dayHours);

  if (!firstOpening || !lastClosing) {
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
    secondaryMessage: `De ${formatTime(firstOpening)} à ${formatTime(lastClosing)}`,
    nextOpenTime: null,
  };
};

// Export du cache pour accès direct si nécessaire
export const getCache = () => businessHoursCache;
