import React, { useState, useEffect } from 'react';
import '../styles/custom-scrollbar-hide.css';
import { motion } from 'framer-motion';
import { Star, Quote, ExternalLink } from 'lucide-react';
import { API } from '../lib/apiClient';

const GoogleReviews = () => {
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API}/google-reviews`);
        if (!response.ok) {
          // Erreur API - ne pas afficher le composant
          setError('API not configured');
          setLoading(false);
          return;
        }
        const data = await response.json();
        setReviewsData(data);
      } catch (err) {
        // Erreur réseau ou backend - ne pas afficher le composant
        console.log('Google Reviews not available:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    for (let star = 1; star <= 5; star += 1) {
      stars.push(
        <Star
          key={star}
          className={`w-5 h-5 ${
            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return <div className="flex gap-1">{stars}</div>;
  };

  if (loading) {
    return (
      <section className="py-20 bg-linear-to-b from-white to-amber-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Chargement des avis...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !reviewsData) {
    return null; // Ne pas afficher la section en cas d'erreur
  }

  const reviews = reviewsData?.reviews || [];
  const reviewCards = [];
  for (let index = 0; index < reviews.length; index += 1) {
    const review = reviews[index];
    reviewCards.push(
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
        style={{ height: '420px', minHeight: '420px', maxHeight: '420px' }}
      >
        {/* Quote Icon */}
        <Quote className="w-8 h-8 text-amber-500/20 mb-4" />

        {/* Rating */}
        <div className="mb-4">{renderStars(review.rating)}</div>

        {/* Review Text */}
        <p className="text-gray-700 mb-6 leading-relaxed line-clamp-6">
          {review.text}
        </p>

        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
          {review.profile_photo ? (
            <img
              src={review.profile_photo}
              alt={review.author}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold">
              {review.author?.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-800">{review.author}</p>
            <p className="text-sm text-gray-500">{review.relative_time}</p>
          </div>
        </div>

        {/* Owner Reply */}
        {review.reply && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-semibold text-amber-600 mb-2">
              Réponse de Léa Beauté
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {review.reply.text}
            </p>
          </div>
        )}

        {/* Link to Google Review */}
        {review.author_url && (
          <a
            href={review.author_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm text-amber-600 hover:text-amber-700 transition-colors"
          >
            Voir sur Google
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </motion.div>
    );
  }

  const placeId = process.env.REACT_APP_GOOGLE_PLACE_ID || '';
  const writeReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;

  return (
    <section className="py-20 bg-linear-to-b from-white to-amber-50/30">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-light text-gray-800 mb-4">
            Ce qu'en pensent nos client·e·s
          </h2>
          
          {/* Google Rating Summary */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                <svg className="w-8 h-8" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-semibold text-gray-800">
                    {reviewsData.rating}
                  </span>
                  {renderStars(Math.round(reviewsData.rating))}
                </div>
                <p className="text-sm text-gray-600">
                  {reviewsData.user_ratings_total} avis Google
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Carrousel horizontal moderne avec snap et animation */}
        <div
          className="flex gap-6 overflow-x-auto py-4 scroll-smooth snap-x snap-mandatory custom-scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
        >
          {reviewCards.map((card, idx) => (
            <div
              key={idx}
              className="min-w-[320px] max-w-xs shrink-0 snap-center transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {card}
            </div>
          ))}
        </div>

        {/* CTA to leave a review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a
            href={writeReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-amber-500 to-amber-600 text-white rounded-full font-medium hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-amber-500 to-amber-600 text-white rounded-full font-medium hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Laisser un avis Google
            <Star className="w-5 h-5 fill-white" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default GoogleReviews;
