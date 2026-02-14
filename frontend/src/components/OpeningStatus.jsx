import { useState, useEffect } from 'react';
import { getOpeningStatus, fetchBusinessHoursFromBackend, waitForInitialization } from '../data/businessHours';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCircle } from '@fortawesome/free-solid-svg-icons';

export default function OpeningStatus({ isScrolled, showShortReopen }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // Charger les données du backend immédiatement et attendre l'init
    const loadStatus = async () => {
      try {
        await waitForInitialization();
        const debug = getOpeningStatus();
        console.log('[DEBUG][OpeningStatus] getOpeningStatus:', debug);
        setStatus(debug);
      } catch (error) {
        console.error('[OpeningStatus] Error loading status:', error);
        setStatus(getOpeningStatus());
      }
    };

    loadStatus();

    // Rafraîchir toutes les 30 secondes avec rechargement du backend
    const interval = setInterval(async () => {
      await fetchBusinessHoursFromBackend(true);
      setStatus(getOpeningStatus());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const isOpen = status.status === 'open';
  const textColor = isScrolled ? (isOpen ? 'text-green-600' : 'text-red-600') : (isOpen ? 'text-green-400' : 'text-red-400');
  const dotColor = isOpen ? 'text-green-600' : 'text-red-600';
  const secondaryColor = isScrolled ? 'text-[#C5A028]' : 'text-[#D4AF37]';

  // Message secondaire court si bandeau actif
  let secondaryMessage = status.secondaryMessage;
  if (showShortReopen && !isOpen && status.secondaryMessage) {
    // Extraire uniquement la partie "Ouvre le ... à ..." ou "Réouverture le ... à ..."
    const match = status.secondaryMessage.match(/(Ouvre le .+|Réouverture le .+)/);
    secondaryMessage = match ? match[0] : '';
  }

  return (
    <div className="flex flex-col items-start">
      <div className={`flex items-center gap-2 text-sm font-semibold ${textColor}`}>
        <FontAwesomeIcon icon={faCircle} size="xs" className={dotColor} />
        <span className="whitespace-nowrap">
          {status.message}
        </span>
      </div>
      {secondaryMessage && (
        <div className={`text-xs whitespace-nowrap ${secondaryColor}`}>
          {secondaryMessage}
        </div>
      )}
    </div>
  );
}
