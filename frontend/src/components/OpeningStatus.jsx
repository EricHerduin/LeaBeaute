import { useState, useEffect } from 'react';
import { getOpeningStatus } from '../data/businessHours';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCircle } from '@fortawesome/free-solid-svg-icons';

export default function OpeningStatus({ isScrolled }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // Mettre à jour le statut immédiatement
    setStatus(getOpeningStatus());

    // Rafraîchir toutes les minutes
    const interval = setInterval(() => {
      setStatus(getOpeningStatus());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

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
