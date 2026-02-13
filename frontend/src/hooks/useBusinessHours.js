import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/apiClient';

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
 * Hook personnalisé pour récupérer et gérer les horaires d'ouverture du backend
 * @returns {Object} État avec status, message, horaires, exceptions, jours fériés
 */
export function useBusinessHours() {
  const [status, setStatus] = useState(null);
  const [generalHours, setGeneralHours] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({});

  // Récupérer toutes les données du backend
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusRes, hoursRes, exceptionsRes, holidaysRes] = await Promise.all([
        api.get('/business-hours/status'),
        api.get('/business-hours'),
        api.get('/business-hours/exceptions'),
        api.get('/business-hours/holidays'),
      ]);

      const newStatus = statusRes.data;
      const newHours = hoursRes.data;
      const newExceptions = exceptionsRes.data || [];
      const newHolidays = holidaysRes.data || [];

      setStatus(newStatus);
      setGeneralHours(newHours);
      setExceptions(newExceptions);
      setHolidays(newHolidays);

      // Mettre en cache
      cacheRef.current = {
        status: newStatus,
        generalHours: newHours,
        exceptions: newExceptions,
        holidays: newHolidays,
        lastFetch: Date.now(),
      };
    } catch (err) {
      console.error('Erreur chargement horaires backend:', err);
      setError(err.message);
      
      // Utiliser le cache si disponible
      if (cacheRef.current.lastFetch) {
        setStatus(cacheRef.current.status);
        setGeneralHours(cacheRef.current.generalHours);
        setExceptions(cacheRef.current.exceptions);
        setHolidays(cacheRef.current.holidays);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial et mise à jour toutes les minutes
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000); // Mise à jour chaque minute
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Fonction helper pour vérifier si une date est un jour férié
  const isHoliday = useCallback((date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.some((h) => h.date === dateStr);
  }, [holidays]);

  // Fonction helper pour obtenir une exception pour une date
  const getExceptionForDate = useCallback((date) => {
    const dateStr = date.toISOString().split('T')[0];
    return exceptions.find((e) => e.date === dateStr);
  }, [exceptions]);

  // Fonction helper pour obtenir les horaires d'un jour spécifique
  const getHoursForDay = useCallback((dayIndex) => {
    if (!generalHours) return null;
    return generalHours[String(dayIndex)] || null;
  }, [generalHours]);

  // Fonction helper pour trouver le prochain jour d'ouverture
  const getNextOpenDay = useCallback((startDate = new Date()) => {
    let date = new Date(startDate);
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
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

      // Récupérer les horaires du jour
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
  }, [isHoliday, getExceptionForDate, getHoursForDay]);

  // Fonction helper pour obtenir une description détaillée du statut
  const getStatusDetails = useCallback(() => {
    if (!status) {
      return {
        isOpen: false,
        message: 'Chargement...',
        secondaryMessage: null,
        nextOpenTime: null,
        hoursToday: null,
        closingTime: null,
        openingTime: null,
      };
    }

    const now = new Date();
    const nextOpen = getNextOpenDay(now);
    const hoursToday = getHoursForDay(now.getDay());

    return {
      isOpen: status.status === 'open',
      message: status.message,
      secondaryMessage: status.status === 'closed' ? formatNextOpenMessage(nextOpen) : `Ferme à ${status.hours?.close || ''}`,
      nextOpenTime: nextOpen,
      hoursToday: hoursToday,
      closingTime: status.hours?.close,
      openingTime: status.hours?.open,
    };
  }, [status, getNextOpenDay, getHoursForDay]);

  // Fonction pour rafraîchir manuellement
  const refresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    status,
    generalHours,
    exceptions,
    holidays,
    loading,
    error,
    isHoliday,
    getExceptionForDate,
    getHoursForDay,
    getNextOpenDay,
    getStatusDetails,
    refresh,
  };
}

export default useBusinessHours;
