import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { API } from '../lib/apiClient';

const getGoogleReviewsStore = () => {
  if (typeof window === 'undefined') {
    return { cache: null, inFlightPromise: null };
  }

  if (!window.__leaGoogleReviewsStore) {
    window.__leaGoogleReviewsStore = {
      cache: null,
      inFlightPromise: null,
    };
  }

  return window.__leaGoogleReviewsStore;
};

export default function GoogleRatingAnchorBadge() {
  const [summary, setSummary] = useState(null);

  const renderStars = (rating) => {
    const stars = [];
    for (let star = 1; star <= 5; star += 1) {
      const fill = Math.max(0, Math.min(1, Number(rating) - (star - 1)));
      stars.push(
        <div key={star} className="relative h-3.5 w-3.5">
          <Star className="h-3.5 w-3.5 text-gray-300" />
          {fill > 0 ? (
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="h-3.5 w-3.5 fill-[#D4AF37] text-[#D4AF37]" />
            </div>
          ) : null}
        </div>
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      const store = getGoogleReviewsStore();

      if (store.cache) {
        if (isMounted) setSummary(store.cache);
        return;
      }

      try {
        if (!store.inFlightPromise) {
          store.inFlightPromise = fetch(`${API}/google-reviews`)
            .then(async (response) => {
              if (!response.ok) throw new Error('Google reviews unavailable');
              return response.json();
            })
            .finally(() => {
              store.inFlightPromise = null;
            });
        }

        const data = await store.inFlightPromise;
        store.cache = data;
        if (isMounted) setSummary(data);
      } catch {
        if (isMounted) setSummary(null);
      }
    };

    loadSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!summary?.rating || !summary?.user_ratings_total) {
    return null;
  }

  return (
    <a
      href="#google-reviews"
      className="hidden md:flex fixed right-5 top-28 z-40 items-center gap-2.5 rounded-full border border-[#D4AF37]/40 bg-white/95 px-3 py-2 text-[#1A1A1A] shadow-lg backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#D4AF37] hover:shadow-xl"
      title="Voir les avis Google"
      aria-label="Voir les avis Google"
    >
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold leading-none">{summary.rating}</span>
        {renderStars(summary.rating)}
      </div>
      <span className="text-xs text-[#6E625A] leading-none">({summary.user_ratings_total})</span>
    </a>
  );
}
