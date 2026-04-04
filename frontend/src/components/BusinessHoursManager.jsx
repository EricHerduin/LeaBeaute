import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '../lib/apiClient';
import { invalidateCache } from '../data/businessHours';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const EMPTY_DAY = {
  morningOpen: null,
  morningClose: null,
  afternoonOpen: null,
  afternoonClose: null,
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

export default function BusinessHoursManager({ adminToken, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'exceptions', 'holidays'
  const [businessHours, setBusinessHours] = useState({});
  const [exceptions, setExceptions] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialGeneralHoursSnapshot, setInitialGeneralHoursSnapshot] = useState('');

  // Form states for exceptions
  const [exceptionMode, setExceptionMode] = useState('single'); // 'single' ou 'range'
  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionEndDate, setExceptionEndDate] = useState('');
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [exceptionStartTime, setExceptionStartTime] = useState('09:00');
  const [exceptionEndTime, setExceptionEndTime] = useState('18:30');
  const [exceptionReason, setExceptionReason] = useState('');
  const [editingException, setEditingException] = useState(null);

  // Form states for holidays
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');

  const resetExceptionForm = useCallback(() => {
    setExceptionDate('');
    setExceptionEndDate('');
    setExceptionReason('');
    setExceptionOpen(false);
    setExceptionMode('single');
    setEditingException(null);
    setExceptionStartTime('09:00');
    setExceptionEndTime('18:30');
  }, []);

  const resetHolidayForm = useCallback(() => {
    setHolidayDate('');
    setHolidayName('');
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [hoursRes, exceptionsRes, holidaysRes] = await Promise.all([
        api.get('/business-hours', { headers: { Authorization: adminToken } }),
        api.get('/business-hours/exceptions', { headers: { Authorization: adminToken } }),
        api.get('/business-hours/holidays', { headers: { Authorization: adminToken } })
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
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...(normalizeDayHours(prev[day]) || EMPTY_DAY),
        [field]: value === '' ? null : value
      }
    }));
  };

  const handleToggleDay = (day) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: hasAnyOpeningHours(normalizeDayHours(prev[day]))
        ? null
        : { morningOpen: '09:00', morningClose: '12:00', afternoonOpen: '14:00', afternoonClose: '18:30' }
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
        headers: { 'Authorization': adminToken }
      });
      toast.success('Horaires généraux mis à jour');
      await fetchData();
      await invalidateCache(); // Forcer la mise à jour du cache
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

  const handleAddException = async () => {
    if (!exceptionDate) {
      toast.error('Veuillez sélectionner une date');
      return;
    }

    if (exceptionMode === 'range' && !exceptionEndDate) {
      toast.error('Veuillez sélectionner une date de fin');
      return;
    }

    if (exceptionOpen && (!exceptionStartTime || !exceptionEndTime)) {
      toast.error('Veuillez sélectionner les horaires');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        date: exceptionDate,
        endDate: exceptionMode === 'range' ? exceptionEndDate : undefined,
        isOpen: exceptionOpen,
        startTime: exceptionOpen ? exceptionStartTime : null,
        endTime: exceptionOpen ? exceptionEndTime : null,
        reason: exceptionReason
      };

      if (editingException) {
        // Édition : supprimer l'ancienne et créer la nouvelle
        await api.delete(`/business-hours/exceptions/${editingException}`, {
          headers: { 'Authorization': adminToken }
        });
      }

      await api.post('/business-hours/exceptions', payload, {
        headers: { 'Authorization': adminToken }
      });

      toast.success(editingException ? 'Exception modifiée' : 'Exception ajoutée');
      
      resetExceptionForm();
      await fetchData();
      await invalidateCache();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de sauvegarder l\'exception');
    } finally {
      setSaving(false);
    }
  };

  const handleEditException = (exc) => {
    setExceptionDate(exc.date);
    setExceptionEndDate(exc.endDate || '');
    setExceptionMode(exc.endDate && exc.date !== exc.endDate ? 'range' : 'single');
    setExceptionOpen(exc.isOpen);
    setExceptionStartTime(exc.startTime || '09:00');
    setExceptionEndTime(exc.endTime || '18:30');
    setExceptionReason(exc.reason || '');
    setEditingException(exc.date);
  };

  const handleCancelEdit = () => {
    resetExceptionForm();
  };

  const handleDeleteException = async (date) => {
    try {
      setSaving(true);
      await api.delete(`/business-hours/exceptions/${date}`, {
        headers: { 'Authorization': adminToken }
      });
      toast.success('Exception supprimée');
      await fetchData();
      await invalidateCache(); // Forcer la mise à jour du cache
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de supprimer l\'exception');
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayDate || !holidayName) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    try {
      setSaving(true);
      await api.post('/business-hours/holidays', {
        date: holidayDate,
        name: holidayName
      }, {
        headers: { 'Authorization': adminToken }
      });
      toast.success('Jour férié ajouté');
      resetHolidayForm();
      await fetchData();
      await invalidateCache(); // Forcer la mise à jour du cache
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible d\'ajouter le jour férié');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (date) => {
    try {
      setSaving(true);
      await api.delete(`/business-hours/holidays/${date}`, {
        headers: { 'Authorization': adminToken }
      });
      toast.success('Jour férié supprimé');
      await fetchData();
      await invalidateCache(); // Forcer la mise à jour du cache
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de supprimer le jour férié');
    } finally {
      setSaving(false);
    }
  };

  const generalHoursDirty = serializeGeneralHours(buildGeneralHoursPayload()) !== initialGeneralHoursSnapshot;
  const exceptionDraftDirty = Boolean(
    exceptionDate ||
    exceptionEndDate ||
    exceptionReason.trim() ||
    editingException ||
    exceptionOpen ||
    exceptionStartTime !== '09:00' ||
    exceptionEndTime !== '18:30' ||
    exceptionMode !== 'single'
  );
  const holidayDraftDirty = Boolean(holidayDate || holidayName.trim());

  const handleResetGeneralHours = () => {
    const loaded = JSON.parse(initialGeneralHoursSnapshot || '{}');
    setBusinessHours(loaded);
    toast.success('Modifications des horaires annulées');
  };

  const handleRequestClose = async () => {
    if (saving) return;

    if (activeTab === 'general' && generalHoursDirty) {
      const shouldSave = window.confirm('Les horaires généraux ont été modifiés. Voulez-vous les enregistrer avant de fermer ?');
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

    if (activeTab === 'exceptions' && exceptionDraftDirty) {
      const shouldDiscard = window.confirm('Une exception est en cours de saisie. Fermer sans enregistrer ?');
      if (!shouldDiscard) return;
    }

    if (activeTab === 'holidays' && holidayDraftDirty) {
      const shouldDiscard = window.confirm('Un jour férié est en cours de saisie. Fermer sans enregistrer ?');
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
        className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-auto"
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">
              Gérer les Horaires d'Ouverture
            </h2>
            <p className="text-sm text-[#6B6358] mt-2">
              Modifie les horaires, enregistre explicitement tes changements, puis ferme la fenêtre.
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#E8DCCA]">
          {['general', 'exceptions', 'holidays'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold transition-all ${
                activeTab === tab
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                  : 'text-[#4A4A4A] hover:text-[#1A1A1A]'
              }`}
            >
              {tab === 'general' && 'Horaires Généraux'}
              {tab === 'exceptions' && 'Exceptions'}
              {tab === 'holidays' && 'Jours Fériés'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
          </div>
        ) : (
          <>
            {/* General Hours Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4 mb-6">
                <div className="rounded-xl border border-[#E8DCCA] bg-[#FCF8F1] px-4 py-3 text-sm text-[#6B6358]">
                  Modifie les créneaux ci-dessous puis utilise les actions <strong>Enregistrer</strong> ou <strong>Annuler</strong>.
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
                            isClosed 
                              ? 'bg-red-500 hover:bg-red-600' 
                              : 'bg-green-500 hover:bg-green-600'
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
                    Annuler les modifications
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

            {/* Exceptions Tab */}
            {activeTab === 'exceptions' && (
              <div className="space-y-6">
                <div className="border border-[#E8DCCA] rounded-lg p-4">
                  <h3 className="font-semibold text-[#1A1A1A] mb-4">
                    {editingException ? 'Modifier une exception' : 'Créer une exception'}
                  </h3>
                  <p className="text-sm text-[#6B6358] mb-4">
                    Renseigne le formulaire, puis clique sur <strong>{editingException ? 'Enregistrer l’exception' : 'Créer l’exception'}</strong>.
                  </p>
                  <div className="space-y-4">
                    {/* Mode Toggle: Single Day vs Period */}
                    <div>
                      <label className="text-sm text-[#4A4A4A] block mb-2 font-semibold">Type:</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setExceptionMode('single')}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                            exceptionMode === 'single'
                              ? 'bg-[#D4AF37] text-white'
                              : 'border border-[#E8DCCA] text-[#4A4A4A] hover:bg-[#F5F0E8]'
                          }`}
                        >
                          Jour isolé
                        </button>
                        <button
                          onClick={() => setExceptionMode('range')}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                            exceptionMode === 'range'
                              ? 'bg-[#D4AF37] text-white'
                              : 'border border-[#E8DCCA] text-[#4A4A4A] hover:bg-[#F5F0E8]'
                          }`}
                        >
                          Période (du...au...)
                        </button>
                      </div>
                    </div>

                    {/* Date fields */}
                    <div className={exceptionMode === 'range' ? 'grid grid-cols-2 gap-4' : ''}>
                      <div>
                        <label className="text-sm text-[#4A4A4A] block mb-1">
                          {exceptionMode === 'range' ? 'Date de début' : 'Date'}
                        </label>
                        <input
                          type="date"
                          value={exceptionDate}
                          onChange={(e) => setExceptionDate(e.target.value)}
                          className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        />
                      </div>
                      {exceptionMode === 'range' && (
                        <div>
                          <label className="text-sm text-[#4A4A4A] block mb-1">Date de fin</label>
                          <input
                            type="date"
                            value={exceptionEndDate}
                            onChange={(e) => setExceptionEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center gap-4">
                      <label className="font-semibold text-[#1A1A1A]">Statut:</label>
                      <button
                        onClick={() => setExceptionOpen(!exceptionOpen)}
                        className={`px-4 py-2 rounded-lg font-medium text-white transition-all ${
                          exceptionOpen 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        {exceptionOpen ? 'Ouvert' : 'Fermé'}
                      </button>
                    </div>

                    {/* Opening/Closing Times (shown when exception is Open) */}
                    {exceptionOpen && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-[#4A4A4A] block mb-1">Heure d'ouverture</label>
                          <input
                            type="time"
                            value={exceptionStartTime}
                            onChange={(e) => setExceptionStartTime(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-[#4A4A4A] block mb-1">Heure de fermeture</label>
                          <input
                            type="time"
                            value={exceptionEndTime}
                            onChange={(e) => setExceptionEndTime(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Reason */}
                    <div>
                      <label className="text-sm text-[#4A4A4A] block mb-1">Raison (optionnel)</label>
                      <input
                        type="text"
                        value={exceptionReason}
                        onChange={(e) => setExceptionReason(e.target.value)}
                        placeholder="Ex: Jour de formation"
                        className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>

                    {/* Submit and Cancel buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddException}
                        disabled={saving}
                        className="flex-1 px-6 py-2 bg-[#8A6A16] text-[#FFF8E7] rounded-lg hover:bg-[#755912] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                      >
                        {saving 
                          ? (editingException ? 'Enregistrement...' : 'Création...') 
                          : (editingException ? 'Enregistrer l’exception' : 'Créer l’exception')
                        }
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex-1 px-6 py-2 border border-[#E8DCCA] text-[#4A4A4A] rounded-lg hover:bg-[#F5F0E8] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                      >
                        Vider le formulaire
                      </button>
                    </div>
                  </div>
                </div>

                {/* List of Exceptions */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-[#1A1A1A]">Exceptions Existantes</h3>
                  {exceptions.length === 0 ? (
                    <p className="text-[#4A4A4A]">Aucune exception enregistrée</p>
                  ) : (
                    exceptions.map((exc, idx) => {
                      // Format date range or single date
                      const formatDate = (dateStr) => {
                        const date = new Date(dateStr + 'T00:00:00');
                        return date.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' });
                      };
                      
                      const dateRange = exc.endDate && exc.endDate !== exc.date
                        ? `du ${formatDate(exc.date)} au ${formatDate(exc.endDate)}`
                        : formatDate(exc.date);
                      
                      return (
                        <div key={idx} className="border border-[#E8DCCA] rounded-lg p-3 flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-[#1A1A1A]">{dateRange}</p>
                            <p className="text-sm text-[#4A4A4A]">
                              {exc.isOpen ? `${exc.startTime} - ${exc.endTime}` : 'Fermé'}
                              {exc.reason && ` • ${exc.reason}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditException(exc)}
                              disabled={saving}
                              className="px-3 py-1 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] disabled:opacity-50 transition-all text-sm font-medium"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteException(exc.date)}
                              disabled={saving}
                              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all text-sm font-medium"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Holidays Tab */}
            {activeTab === 'holidays' && (
              <div className="space-y-6">
                <div className="border border-[#E8DCCA] rounded-lg p-4">
                  <h3 className="font-semibold text-[#1A1A1A] mb-4">Ajouter un Jour Férié</h3>
                  <p className="text-sm text-[#6B6358] mb-4">
                    Saisis la date et le libellé, puis clique sur <strong>Enregistrer le jour férié</strong>.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#4A4A4A] block mb-1">Date</label>
                      <input
                        type="date"
                        value={holidayDate}
                        onChange={(e) => setHolidayDate(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#4A4A4A] block mb-1">Nom du Jour</label>
                      <input
                        type="text"
                        value={holidayName}
                        onChange={(e) => setHolidayName(e.target.value)}
                        placeholder="Ex: Noël, Jour de l'An"
                        className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                    <button
                      onClick={handleAddHoliday}
                      disabled={saving}
                      className="w-full px-6 py-2 bg-[#8A6A16] text-[#FFF8E7] rounded-lg hover:bg-[#755912] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                    >
                      {saving ? 'Enregistrement...' : 'Enregistrer le jour férié'}
                    </button>
                    <button
                      onClick={resetHolidayForm}
                      disabled={saving || !holidayDraftDirty}
                      className="w-full px-6 py-2 border border-[#E8DCCA] text-[#4A4A4A] rounded-lg hover:bg-[#F5F0E8] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                    >
                      Vider le formulaire
                    </button>
                  </div>
                </div>

                {/* List of Holidays */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-[#1A1A1A]">Jours Fériés Enregistrés</h3>
                  {holidays.length === 0 ? (
                    <p className="text-[#4A4A4A]">Aucun jour férié enregistré</p>
                  ) : (
                    holidays.map((holiday, idx) => (
                      <div key={idx} className="border border-[#E8DCCA] rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-[#1A1A1A]">{holiday.name}</p>
                          <p className="text-sm text-[#4A4A4A]">{holiday.date}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteHoliday(holiday.date)}
                          disabled={saving}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}

      </motion.div>
    </motion.div>
  );
}
