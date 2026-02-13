import { useState, useEffect } from 'react';
import { getOpeningStatus, waitForInitialization } from '../data/businessHours';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCircle } from '@fortawesome/free-solid-svg-icons';

export default function OpeningStatus({ isScrolled }) {
  const [status, setStatus] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeAndSetStatus = async () => {
      try {
        // Attendre que les données soient initialisées depuis le backend
        await waitForInitialization();
        console.log('[OpeningStatus] Initialization complete, setting status');
        // Mettre à jour le statut avec les vraies données
        setStatus(getOpeningStatus());
        setIsReady(true);
      } catch (error) {
        console.error('[OpeningStatus] Error initializing:', error);
        setIsReady(true); // Quand même afficher avec les données par défaut
        setStatus(getOpeningStatus());
      }
    };

    initializeAndSetStatus();

    // Rafraîchir toutes les minutes (ou 30 secondes pour réactivité)
    const interval = setInterval(() => {
      setStatus(getOpeningStatus());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Ne rien afficher jusqu'à ce qu'on soit prêt
  if (!isReady || !status) return null;

  const isOpen = status.status === 'open';
  const textColor = isScrolled ? (isOpen ? 'text-green-600' : 'text-red-600') : (isOpen ? 'text-green-400' : 'text-red-400');
  const dotColor = isOpen ? 'text-green-600' : 'text-red-600';
  const secondaryColor = isScrolled ? 'text-[#C5A028]' : 'text-[#D4AF37]';

  return (
    <div className="flex flex-col items-start">
      <div className={`flex items-center gap-2 text-sm font-semibold ${textColor}`}>
        <FontAwesomeIcon icon={faCircle} size="xs" className={dotColor} />
        <span className="whitespace-nowrap">
          {status.message}
        </span>
      </div>
      {status.secondaryMessage && (
        <div className={`text-xs whitespace-nowrap ${secondaryColor}`}>
          {status.secondaryMessage}
        </div>
      )}
    </div>
  );
}
