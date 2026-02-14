import { useState, useEffect, useCallback } from 'react';
import api from '../lib/apiClient';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { invalidateCache } from '../data/businessHours';

export default function BusinessHoursExceptions({ token }) {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [exceptionMode, setExceptionMode] = useState('single'); // 'single' ou 'range'

  // Form states
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    isOpen: false,
    startTime: '',
    endTime: '',
    reason: '',
  });

  // Fetch exceptions
  const fetchExceptions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('business-hours/exceptions');
      setExceptions(response.data || []);
    } catch (error) {
      console.error('Error fetching exceptions:', error);
      toast.error('Erreur lors du chargement des exceptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  // Add/Update exception
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.startDate) {
      toast.error('Date requise');
      return;
    }

    if (exceptionMode === 'range' && !formData.endDate) {
      toast.error('Date de fin requise pour une période');
      return;
    }

    if (formData.isOpen && (!formData.startTime || !formData.endTime)) {
      toast.error('Heures d\'ouverture et fermeture requises');
      return;
    }

    try {
      const payload = {
        date: formData.startDate,
        endDate: exceptionMode === 'range' ? formData.endDate : undefined,
        isOpen: formData.isOpen,
        startTime: formData.isOpen ? formData.startTime : null,
        endTime: formData.isOpen ? formData.endTime : null,
        reason: formData.reason,
      };

      await api.post('business-hours/exceptions', payload, {
        headers: { authorization: token },
      });

      toast.success('Exception créée avec succès');
      
      // Invalider le cache et recharger
      await invalidateCache();
      await fetchExceptions();
      
      // Réinitialiser le formulaire
      setFormData({
        startDate: '',
        endDate: '',
        isOpen: false,
        startTime: '',
        endTime: '',
        reason: '',
      });
      setExceptionMode('single');
      setShowForm(false);
    } catch (error) {
      console.error('Error creating exception:', error);
      toast.error('Erreur lors de la création de l\'exception');
    }
  };

  // Delete exception
  const handleDelete = async (date) => {
    if (!window.confirm('Supprimer cette exception ?')) return;

    try {
      await api.delete(`business-hours/exceptions/${date}`, {
        headers: { authorization: token },
      });

      toast.success('Exception supprimée avec succès');
      
      // Invalider le cache et recharger
      await invalidateCache();
      await fetchExceptions();
    } catch (error) {
      console.error('Error deleting exception:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatDateRange = (exc) => {
    const startDate = new Date(exc.date);
    const endDate = exc.endDate ? new Date(exc.endDate) : startDate;

    const startLabel = startDate.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    if (exc.date === exc.endDate || !exc.endDate) {
      return startLabel;
    }

    const endLabel = endDate.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    return `${startLabel} → ${endLabel}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Exceptions d'horaires</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C5A028] text-[#1A1A1A] px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} size="sm" />
          Ajouter une exception
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          {/* Mode Toggle - Button Style */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setExceptionMode('single');
                setFormData({ ...formData, endDate: '' });
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                exceptionMode === 'single'
                  ? 'bg-[#D4AF37] text-[#1A1A1A]'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Jour isolé
            </button>
            <button
              type="button"
              onClick={() => setExceptionMode('range')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                exceptionMode === 'range'
                  ? 'bg-[#D4AF37] text-[#1A1A1A]'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Période (du... au...)
            </button>
          </div>

          {/* Dates */}
          <div className={exceptionMode === 'single' ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-4'}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {exceptionMode === 'single' ? 'Date' : 'Date de début'}
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {exceptionMode === 'range' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  required={exceptionMode === 'range'}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isOpen}
                onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold text-gray-700">
                Horaires modifiés (sinon : fermé)
              </span>
            </label>
          </div>

          {formData.isOpen && (
            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Heure d'ouverture
                </label>
                <input
                  type="time"
                  required={formData.isOpen}
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Heure de fermeture
                </label>
                <input
                  type="time"
                  required={formData.isOpen}
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Raison (optionnel)
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ex: Vacances, Fermeture exceptionnelle, Rénovations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormData({
                  startDate: '',
                  endDate: '',
                  isOpen: false,
                  startTime: '',
                  endTime: '',
                  reason: '',
                });
                setExceptionMode('single');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Créer
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Chargement...</div>
      ) : exceptions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Aucune exception créée</div>
      ) : (
        <div className="space-y-3">
          {exceptions.map((exc) => (
            <div key={exc.date} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-[#D4AF37]" />
                  <span className="font-semibold text-gray-800">
                    {formatDateRange(exc)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {exc.isOpen ? (
                    <>
                      <p>
                        <strong>Statut:</strong> Horaires modifiés ({exc.startTime} - {exc.endTime})
                      </p>
                      {exc.reason && <p><strong>Raison:</strong> {exc.reason}</p>}
                    </>
                  ) : (
                    <>
                      <p>
                        <strong>Statut:</strong> Fermé exceptionnellement
                      </p>
                      {exc.reason && <p><strong>Raison:</strong> {exc.reason}</p>}
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(exc.date)}
                className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
