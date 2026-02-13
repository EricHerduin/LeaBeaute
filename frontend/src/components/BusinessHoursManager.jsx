import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '../lib/apiClient';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function BusinessHoursManager({ adminToken, isOpen, onClose }) {
  const [businessHours, setBusinessHours] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchBusinessHours = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/business-hours', {
        headers: { Authorization: adminToken }
      });
      setBusinessHours(response.data || {});
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger les horaires');
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (isOpen) {
      fetchBusinessHours();
    }
  }, [isOpen, fetchBusinessHours]);

  const handleTimeChange = (day, field, value) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value === '' ? null : value
      }
    }));
  };

  const handleToggleDay = (day) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: prev[day] ? null : { open: '09:00', close: '18:30' }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post('/api/business-hours', businessHours, {
        headers: { 'Authorization': adminToken }
      });
      toast.success('Horaires mis à jour avec succès');
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de sauvegarder les horaires');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-auto"
      >
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">
          Gérer les Horaires d'Ouverture
        </h2>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {DAYS.map((day, index) => {
              const hours = businessHours[index];
              const isClosed = !hours;

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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-[#4A4A4A] block mb-1">Ouverture</label>
                        <input
                          type="time"
                          value={hours.open || '09:00'}
                          onChange={(e) => handleTimeChange(index, 'open', e.target.value)}
                          className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#4A4A4A] block mb-1">Fermeture</label>
                        <input
                          type="time"
                          value={hours.close || '18:30'}
                          onChange={(e) => handleTimeChange(index, 'close', e.target.value)}
                          className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-2 border border-[#E8DCCA] text-[#1A1A1A] rounded-lg hover:bg-[#FBF9F4] transition-all font-semibold"
          >
            Annuler
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
