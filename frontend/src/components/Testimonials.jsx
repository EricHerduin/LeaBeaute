import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const Testimonials = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({
    name: '',
    rating: 5,
    text: '',
    service: '',
    allowDisplay: true
  });

  const fetchTestimonials = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/testimonials?limit=6`);
      if (!response.ok) throw new Error('Erreur chargement avis');
      const data = await response.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.log('Testimonials not available:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/testimonials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        throw new Error('Impossible d’envoyer votre avis');
      }

      setMessage('Merci pour votre avis !');
      setForm({ name: '', rating: 5, text: '', service: '', allowDisplay: true });
      await fetchTestimonials();
    } catch (err) {
      setMessage('Une erreur est survenue. Réessayez plus tard.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i += 1) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
        />
      );
    }
    return <div className="flex gap-1">{stars}</div>;
  };

  const placeId = process.env.REACT_APP_GOOGLE_PLACE_ID || 'ChIJreE_Pi-DDEgRJ0veR0hH5jE';
  const writeReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;

  return (
    <section className="py-20 bg-gradient-to-b from-white to-amber-50/30">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-light text-gray-800 mb-4">
            Ce qu’en pensent nos client·e·s
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Vos retours comptent énormément. Partagez votre expérience et aidez d’autres clients à nous découvrir.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Laisser un avis</h3>

            <label className="block text-sm font-medium text-gray-700 mb-2">Votre prénom</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, rating: value }))}
                  className={`w-10 h-10 rounded-full border ${value <= form.rating ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-200 text-gray-400'}`}
                >
                  {value}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">Prestation (optionnel)</label>
            <input
              type="text"
              name="service"
              value={form.service}
              onChange={handleChange}
              placeholder="Ex: Soin visage Guinot"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            <label className="block text-sm font-medium text-gray-700 mb-2">Votre avis</label>
            <textarea
              name="text"
              value={form.text}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />

            <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <input
                type="checkbox"
                name="allowDisplay"
                checked={form.allowDisplay}
                onChange={handleChange}
              />
              J’autorise l’affichage de mon avis sur le site
            </label>

            {message && (
              <p className="text-sm mb-4 text-amber-600">{message}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all"
            >
              {submitting ? 'Envoi en cours...' : 'Envoyer mon avis'}
            </button>

            <div className="mt-6 text-center">
              <a
                href={writeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800 text-sm font-medium"
              >
                Laisser un avis Google
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </a>
            </div>
          </motion.form>

          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Avis récents</h3>
            {loading ? (
              <p className="text-gray-500">Chargement des avis...</p>
            ) : (
              <div className="grid gap-6">
                {items.length === 0 && (
                  <p className="text-gray-500">Aucun avis pour le moment.</p>
                )}
                {items.map((item, index) => (
                  <motion.div
                    key={item.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl p-6 shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      {renderStars(item.rating)}
                    </div>
                    {item.service && (
                      <p className="text-sm text-amber-700 mb-2">{item.service}</p>
                    )}
                    <p className="text-gray-600 leading-relaxed">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
