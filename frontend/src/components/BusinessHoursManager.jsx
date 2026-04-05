import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '../lib/apiClient';
import { invalidateCache } from '../data/businessHours';
import { Calendar } from './ui/calendar';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const EMPTY_DAY = {
  morningOpen: null,
  morningClose: null,
  afternoonOpen: null,
  afternoonClose: null,
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDate = (dateKey) => {
  if (!dateKey || typeof dateKey !== 'string') return null;
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
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

const hasAnyOpeningHours = (hours) => {
  if (!hours) return false;
  return Boolean(
    (hours.morningOpen && hours.morningClose) ||
    (hours.afternoonOpen && hours.afternoonClose)
  );
};

const serializeGeneralHours = (hours) => JSON.stringify(hours);

const buildDateRange = (fromKey, toKey) => {
  const fromDate = toDate(fromKey);
  const toDateValue = toDate(toKey);
  if (!fromDate || !toDateValue) return [];

  const dates = [];
  let cursor = new Date(fromDate);
  const end = new Date(toDateValue);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const normalizeIsOpen = (value) => value === true || value === 1 || value === '1';

export default function BusinessHoursManager({ adminToken, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'calendar'
  const [businessHours, setBusinessHours] = useState({});
  const [exceptions, setExceptions] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialGeneralHoursSnapshot, setInitialGeneralHoursSnapshot] = useState('');

  const [selectedRange, setSelectedRange] = useState(undefined);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [specialOpen, setSpecialOpen] = useState(false);
  const [specialStartTime, setSpecialStartTime] = useState('09:00');
  const [specialEndTime, setSpecialEndTime] = useState('18:30');
  const [specialReason, setSpecialReason] = useState('');
  const [markAsHoliday, setMarkAsHoliday] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [editingItem, setEditingItem] = useState(null); // { kind: 'exception'|'holiday', key: string }

  const resetSpecialForm = useCallback(() => {
    setSelectedRange(undefined);
    setSpecialOpen(false);
    setSpecialStartTime('09:00');
    setSpecialEndTime('18:30');
    setSpecialReason('');
    setMarkAsHoliday(false);
    setHolidayName('');
    setEditingItem(null);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [hoursRes, exceptionsRes, holidaysRes] = await Promise.all([
        api.get('/business-hours', { headers: { Authorization: adminToken } }),
        api.get('/business-hours/exceptions', { headers: { Authorization: adminToken } }),
        api.get('/business-hours/holidays', { headers: { Authorization: adminToken } }),
      ]);
      const loadedHours = hoursRes.data || {};
      setBusinessHours(loadedHours);
      setInitialGeneralHoursSnapshot(serializeGeneralHours(loadedHours));
      setExceptions(exceptionsRes.data || []);
      setHolidays(holidaysRes.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const handleTimeChange = (day, field, value) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...(normalizeDayHours(prev[day]) || EMPTY_DAY),
        [field]: value === '' ? null : value,
      },
    }));
  };

  const handleToggleDay = (day) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: hasAnyOpeningHours(normalizeDayHours(prev[day]))
        ? null
        : { morningOpen: '09:00', morningClose: '12:00', afternoonOpen: '14:00', afternoonClose: '18:30' },
    }));
  };

  const buildGeneralHoursPayload = () => {
    const payload = {};
    for (let dayIndex = 0; dayIndex <= 6; dayIndex += 1) {
      const normalized = normalizeDayHours(businessHours[dayIndex]);
      if (!hasAnyOpeningHours(normalized)) {
        payload[dayIndex] = { ...EMPTY_DAY };
        continue;
      }
      payload[dayIndex] = {
        morningOpen: normalized.morningOpen || null,
        morningClose: normalized.morningClose || null,
        afternoonOpen: normalized.afternoonOpen || null,
        afternoonClose: normalized.afternoonClose || null,
      };
    }
    return payload;
  };

  const handleSaveGeneral = async () => {
    try {
      setSaving(true);
      const payload = buildGeneralHoursPayload();
      await api.post('/business-hours', payload, {
        headers: { Authorization: adminToken },
      });
      toast.success('Horaires généraux mis à jour');
      await fetchData();
      await invalidateCache();
      setInitialGeneralHoursSnapshot(serializeGeneralHours(payload));
      return true;
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.detail || 'Impossible de sauvegarder');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleResetGeneralHours = () => {
    const loaded = JSON.parse(initialGeneralHoursSnapshot || '{}');
    setBusinessHours(loaded);
    toast.success('Modifications des horaires annulées');
  };

  const rangeStart = selectedRange?.from ? toDateKey(selectedRange.from) : '';
  const rangeEnd = selectedRange?.to ? toDateKey(selectedRange.to) : rangeStart;
  const isRange = Boolean(rangeStart && rangeEnd && rangeStart !== rangeEnd);

  const combinedEntries = useMemo(() => {
    const currentYearStart = `${new Date().getFullYear()}-01-01`;

    const exceptionEntries = (exceptions || [])
      .filter((exc) => typeof exc?.date === 'string' && exc.date.length > 0)
      .map((exc) => ({
      kind: 'exception',
      key: `exception:${exc.date}`,
      label: exc.endDate && exc.endDate !== exc.date
        ? `Exception du ${exc.date} au ${exc.endDate}`
        : `Exception du ${exc.date}`,
      date: exc.date,
      endDate: exc.endDate || exc.date,
      isOpen: normalizeIsOpen(exc.isOpen),
      reason: exc.reason || '',
      startTime: exc.startTime || null,
      endTime: exc.endTime || null,
    }));

    const holidayEntries = (holidays || [])
      .filter((holiday) => typeof holiday?.date === 'string' && holiday.date.length > 0)
      .map((holiday) => ({
      kind: 'holiday',
      key: `holiday:${holiday.date}`,
      label: `Jour férié du ${holiday.date}`,
      date: holiday.date,
      endDate: holiday.date,
      isOpen: false,
      reason: holiday.name || '',
      startTime: null,
      endTime: null,
    }));

    return [...exceptionEntries, ...holidayEntries]
      .filter((entry) => entry.date >= currentYearStart)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [exceptions, holidays]);

  const calendarModifiers = useMemo(() => {
    const holidayKeys = new Set(
      (holidays || [])
        .map((h) => h?.date)
        .filter((d) => typeof d === 'string' && d.length > 0)
    );

    const closedKeys = new Set();
    const openKeys = new Set();

    for (const exc of exceptions || []) {
      if (!exc?.date) continue;
      const end = exc.endDate || exc.date;
      const expanded = buildDateRange(exc.date, end);
      for (const d of expanded) {
        const key = toDateKey(d);
        if (!key) continue;
        if (normalizeIsOpen(exc.isOpen)) {
          openKeys.add(key);
        } else {
          closedKeys.add(key);
        }
      }
    }

    // Priorité visuelle: férié > fermé > ouvert
    for (const key of holidayKeys) {
      closedKeys.delete(key);
      openKeys.delete(key);
    }
    for (const key of closedKeys) {
      openKeys.delete(key);
    }

    const keysToDates = (keys) => [...keys].map((k) => toDate(k)).filter(Boolean);

    return {
      holiday: keysToDates(holidayKeys),
      closedException: keysToDates(closedKeys),
      openException: keysToDates(openKeys),
    };
  }, [exceptions, holidays]);

  const handleDeleteEntry = async (entry) => {
    try {
      setSaving(true);
      if (entry.kind === 'holiday') {
        await api.delete(`/business-hours/holidays/${entry.date}`, {
          headers: { Authorization: adminToken },
        });
      } else {
        await api.delete(`/business-hours/exceptions/${entry.date}`, {
          headers: { Authorization: adminToken },
        });
      }
      toast.success('Entrée supprimée');
      await fetchData();
      await invalidateCache();
      if (editingItem?.key === entry.key) {
        resetSpecialForm();
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de supprimer cette entrée');
    } finally {
      setSaving(false);
    }
  };

  const handleEditEntry = (entry) => {
    const from = toDate(entry.date);
    const to = toDate(entry.endDate || entry.date);
    if (!from || !to) {
      toast.error('Impossible de charger cette entrée (date invalide)');
      return;
    }

    setEditingItem({ kind: entry.kind, key: entry.key, date: entry.date });
    setSelectedRange({
      from,
      to,
    });
    setCalendarMonth(from);
    if (entry.kind === 'holiday') {
      setSpecialOpen(false);
      setMarkAsHoliday(true);
      setHolidayName(entry.reason || '');
      setSpecialReason(entry.reason || '');
      setSpecialStartTime('09:00');
      setSpecialEndTime('18:30');
      return;
    }
    setMarkAsHoliday(false);
    setHolidayName('');
    setSpecialOpen(Boolean(entry.isOpen));
    setSpecialStartTime(entry.startTime || '09:00');
    setSpecialEndTime(entry.endTime || '18:30');
    setSpecialReason(entry.reason || '');
  };

  const handleSelectEntryRange = (entry) => {
    const from = toDate(entry.date);
    const to = toDate(entry.endDate || entry.date);
    if (!from || !to) return;
    setSelectedRange({ from, to });
    setCalendarMonth(from);
  };

  const removeOldEditedItemIfNeeded = async () => {
    if (!editingItem) return;
    if (editingItem.kind === 'holiday') {
      await api.delete(`/business-hours/holidays/${editingItem.date}`, {
        headers: { Authorization: adminToken },
      });
      return;
    }
    await api.delete(`/business-hours/exceptions/${editingItem.date}`, {
      headers: { Authorization: adminToken },
    });
  };

  const handleSaveSpecial = async () => {
    if (!selectedRange?.from) {
      toast.error('Sélectionne au moins une date sur le calendrier');
      return;
    }

    const date = rangeStart;
    const endDate = rangeEnd || rangeStart;

    if (specialOpen && (!specialStartTime || !specialEndTime)) {
      toast.error('Renseigne les horaires d’ouverture et de fermeture');
      return;
    }

    if (markAsHoliday) {
      if (date !== endDate) {
        toast.error('Un jour férié doit être sur une seule date');
        return;
      }
      if (!holidayName.trim()) {
        toast.error('Renseigne le nom du jour férié');
        return;
      }
    }

    try {
      setSaving(true);
      await removeOldEditedItemIfNeeded();

      if (markAsHoliday) {
        await api.post('/business-hours/holidays', {
          date,
          name: holidayName.trim(),
        }, {
          headers: { Authorization: adminToken },
        });
      } else {
        await api.post('/business-hours/exceptions', {
          date,
          endDate: isRange ? endDate : undefined,
          isOpen: specialOpen,
          startTime: specialOpen ? specialStartTime : null,
          endTime: specialOpen ? specialEndTime : null,
          reason: specialReason.trim(),
        }, {
          headers: { Authorization: adminToken },
        });
      }

      toast.success(editingItem ? 'Période mise à jour' : 'Période créée');
      resetSpecialForm();
      await fetchData();
      await invalidateCache();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.detail || 'Impossible de sauvegarder cette période');
    } finally {
      setSaving(false);
    }
  };

  const generalHoursDirty = serializeGeneralHours(buildGeneralHoursPayload()) !== initialGeneralHoursSnapshot;
  const specialDraftDirty = Boolean(
    selectedRange?.from ||
    specialReason.trim() ||
    holidayName.trim() ||
    editingItem ||
    specialOpen ||
    markAsHoliday ||
    specialStartTime !== '09:00' ||
    specialEndTime !== '18:30'
  );

  const handleRequestClose = async () => {
    if (saving) return;

    if (activeTab === 'general' && generalHoursDirty) {
      const shouldSave = window.confirm('Les horaires généraux ont été modifiés. Les enregistrer avant de fermer ?');
      if (shouldSave) {
        const saved = await handleSaveGeneral();
        if (saved) {
          onClose();
        }
        return;
      }
      const shouldDiscard = window.confirm('Fermer sans enregistrer les horaires généraux ?');
      if (!shouldDiscard) return;
    }

    if (activeTab === 'calendar' && specialDraftDirty) {
      const shouldDiscard = window.confirm('Une saisie calendrier est en cours. Fermer sans enregistrer ?');
      if (!shouldDiscard) return;
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleRequestClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-auto"
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Gérer les Horaires d&apos;Ouverture</h2>
            <p className="text-sm text-[#6B6358] mt-2">
              Gestion simplifiée: horaires hebdomadaires + calendrier des jours modifiés.
            </p>
          </div>
          <button
            onClick={handleRequestClose}
            className="h-10 w-10 shrink-0 rounded-full border border-[#E8DCCA] text-[#4A4A4A] hover:bg-[#F5F0E8] transition-all font-medium"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-6 border-b border-[#E8DCCA]">
          {['general', 'calendar'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold transition-all ${
                activeTab === tab
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                  : 'text-[#4A4A4A] hover:text-[#1A1A1A]'
              }`}
            >
              {tab === 'general' ? 'Horaires Généraux' : 'Calendrier (Exceptions + Fériés)'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]" />
          </div>
        ) : (
          <>
            {activeTab === 'general' && (
              <div className="space-y-4 mb-6">
                <div className="rounded-xl border border-[#E8DCCA] bg-[#FCF8F1] px-4 py-3 text-sm text-[#6B6358]">
                  Modifie les créneaux puis clique sur <strong>Enregistrer</strong>.
                </div>
                {DAYS.map((day, index) => {
                  const hours = normalizeDayHours(businessHours[index]);
                  const isClosed = !hasAnyOpeningHours(hours);
                  return (
                    <div key={index} className="border border-[#E8DCCA] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="font-semibold text-[#1A1A1A]">{day}</label>
                        <button
                          onClick={() => handleToggleDay(index)}
                          className={`px-3 py-1 rounded-lg font-medium text-white transition-all ${
                            isClosed ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {isClosed ? 'Fermé' : 'Ouvert'}
                        </button>
                      </div>

                      {!isClosed && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-[#4A4A4A] block mb-1">Matin - ouverture</label>
                              <input
                                type="time"
                                value={hours?.morningOpen || ''}
                                onChange={(e) => handleTimeChange(index, 'morningOpen', e.target.value)}
                                className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-[#4A4A4A] block mb-1">Matin - fermeture</label>
                              <input
                                type="time"
                                value={hours?.morningClose || ''}
                                onChange={(e) => handleTimeChange(index, 'morningClose', e.target.value)}
                                className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-[#4A4A4A] block mb-1">Après-midi - ouverture</label>
                              <input
                                type="time"
                                value={hours?.afternoonOpen || ''}
                                onChange={(e) => handleTimeChange(index, 'afternoonOpen', e.target.value)}
                                className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-[#4A4A4A] block mb-1">Après-midi - fermeture</label>
                              <input
                                type="time"
                                value={hours?.afternoonClose || ''}
                                onChange={(e) => handleTimeChange(index, 'afternoonClose', e.target.value)}
                                className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleResetGeneralHours}
                    disabled={saving || !generalHoursDirty}
                    className="px-5 py-2 border border-[#E8DCCA] text-[#4A4A4A] rounded-lg hover:bg-[#F5F0E8] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveGeneral}
                    disabled={saving}
                    className="px-6 py-2 bg-[#8A6A16] text-[#FFF8E7] rounded-lg hover:bg-[#755912] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-[#E8DCCA] rounded-lg p-4">
                  <h3 className="font-semibold text-[#1A1A1A] mb-3">Calendrier (2 mois)</h3>
                  <p className="text-sm text-[#6B6358] mb-4">
                    Clique une date, puis une seconde pour créer une période comme une réservation d&apos;hôtel.
                  </p>
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    selected={selectedRange}
                    onSelect={(range) => setSelectedRange(range)}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    modifiers={calendarModifiers}
                    modifiersClassNames={{
                      holiday: 'bg-red-100 text-red-700 font-semibold',
                      closedException: 'bg-amber-100 text-amber-800 font-semibold',
                      openException: 'bg-green-100 text-green-700 font-semibold',
                    }}
                    className="rounded-lg border border-[#F0E7D9] p-3"
                  />
                  <div className="mt-4 flex flex-wrap gap-3 text-xs">
                    <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" />Jour férié</span>
                    <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />Exception fermée</span>
                    <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-100 border border-green-200" />Exception ouverte</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-[#E8DCCA] rounded-lg p-4">
                    <h3 className="font-semibold text-[#1A1A1A] mb-4">
                      {editingItem ? 'Modifier la sélection' : 'Créer une règle calendrier'}
                    </h3>

                    <div className="text-sm text-[#6B6358] mb-4">
                      {rangeStart
                        ? (isRange ? `Sélection: du ${rangeStart} au ${rangeEnd}` : `Sélection: ${rangeStart}`)
                        : 'Aucune date sélectionnée'}
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <label className="font-semibold text-[#1A1A1A]">Statut :</label>
                      <button
                        onClick={() => {
                          setSpecialOpen((prev) => !prev);
                          if (markAsHoliday) setMarkAsHoliday(false);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium text-white transition-all ${
                          specialOpen ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        {specialOpen ? 'Ouvert' : 'Fermé'}
                      </button>
                    </div>

                    {!specialOpen && (
                      <div className="mb-4">
                        <label className="inline-flex items-center gap-2 text-sm text-[#4A4A4A]">
                          <input
                            type="checkbox"
                            checked={markAsHoliday}
                            onChange={(e) => setMarkAsHoliday(e.target.checked)}
                          />
                          Marquer comme jour férié
                        </label>
                      </div>
                    )}

                    {specialOpen ? (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-sm text-[#4A4A4A] block mb-1">Heure d&apos;ouverture</label>
                          <input
                            type="time"
                            value={specialStartTime}
                            onChange={(e) => setSpecialStartTime(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-[#4A4A4A] block mb-1">Heure de fermeture</label>
                          <input
                            type="time"
                            value={specialEndTime}
                            onChange={(e) => setSpecialEndTime(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                          />
                        </div>
                      </div>
                    ) : markAsHoliday ? (
                      <div className="mb-4">
                        <label className="text-sm text-[#4A4A4A] block mb-1">Nom du jour férié</label>
                        <input
                          type="text"
                          value={holidayName}
                          onChange={(e) => setHolidayName(e.target.value)}
                          placeholder="Ex: Lundi de Pâques"
                          className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        />
                      </div>
                    ) : (
                      <div className="mb-4">
                        <label className="text-sm text-[#4A4A4A] block mb-1">Motif (optionnel)</label>
                        <input
                          type="text"
                          value={specialReason}
                          onChange={(e) => setSpecialReason(e.target.value)}
                          placeholder="Ex: Congés, formation, fermeture exceptionnelle"
                          className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveSpecial}
                        disabled={saving}
                        className="flex-1 px-6 py-2 bg-[#8A6A16] text-[#FFF8E7] rounded-lg hover:bg-[#755912] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                      >
                        {saving ? 'Enregistrement...' : (editingItem ? 'Mettre à jour' : 'Enregistrer')}
                      </button>
                      <button
                        onClick={resetSpecialForm}
                        disabled={saving || !specialDraftDirty}
                        className="flex-1 px-6 py-2 border border-[#E8DCCA] text-[#4A4A4A] rounded-lg hover:bg-[#F5F0E8] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </div>

                  <div className="border border-[#E8DCCA] rounded-lg p-4">
                    <h3 className="font-semibold text-[#1A1A1A] mb-3">Règles existantes</h3>
                    {combinedEntries.length === 0 ? (
                      <p className="text-[#4A4A4A]">Aucune règle enregistrée</p>
                    ) : (
                      <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
                        {combinedEntries.map((entry) => (
                          <div
                            key={entry.key}
                            onClick={() => handleSelectEntryRange(entry)}
                            className="border border-[#E8DCCA] rounded-lg p-3 flex justify-between items-start gap-3 cursor-pointer hover:bg-[#FCF8F1] transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-[#1A1A1A]">
                                {entry.endDate !== entry.date
                                  ? `Du ${entry.date} au ${entry.endDate}`
                                  : `${entry.date}`}
                              </p>
                              <p className="text-sm text-[#4A4A4A]">
                                {entry.kind === 'holiday'
                                  ? `Jour férié${entry.reason ? ` • ${entry.reason}` : ''}`
                                  : `${entry.isOpen ? `${entry.startTime} - ${entry.endTime}` : 'Fermé'}${entry.reason ? ` • ${entry.reason}` : ''}`}
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleEditEntry(entry)}
                                disabled={saving}
                                className="px-3 py-1 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] disabled:opacity-50 transition-all text-sm font-medium"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEntry(entry);
                                }}
                                disabled={saving}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all text-sm font-medium"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
