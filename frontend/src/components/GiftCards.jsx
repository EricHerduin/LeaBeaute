import { useState } from 'react';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import api, { API } from '../lib/apiClient';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

const axios = api;

const stripePromise = loadStripe('pk_test_51QeoMFJ5BKpSEjx1HgPPFHyJFD4oIuPTLk97bWFpXCfsmUTgbPt1Xwk5HZnK4ydZGkZD3FZb5ysqGRWqU0r3J7uj00iJBnxQFh');

const MIN_CUSTOM_AMOUNT = 10;
const MAX_CUSTOM_AMOUNT = 500;
const MESSAGE_MAX_CHARS = 250;

export default function GiftCards() {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [formData, setFormData] = useState({
    buyer_firstname: '',
    buyer_lastname: '',
    buyer_email: '',
    buyer_phone: '',
    recipient_name: '',
    personal_message: ''
  });

  const amounts = [15, 20, 30, 50];

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setShowForm(true);
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    const parsed = parseFloat(value.replace(',', '.'));

    if (!Number.isFinite(parsed)) {
      setSelectedAmount(null);
      return;
    }

    setSelectedAmount(parsed);
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Veuillez entrer un code coupon');
      return;
    }

    setCouponValidating(true);
    try {
      const response = await axios.post(
        `${API}/coupons/validate?code=${encodeURIComponent(couponCode.trim())}`
      );

      if (response.data.valid) {
        setAppliedCoupon({
          code: couponCode.toUpperCase(),
          token: response.data.token,
          type: response.data.type,
          value: response.data.value,
          currency: response.data.currency
        });
        
        // Calculate discount
        let discountAmount = 0;
        if (response.data.type === 'percentage') {
          discountAmount = (selectedAmount * response.data.value) / 100;
        } else {
          discountAmount = response.data.value;
        }
        
        toast.success(
          `Coupon appliqué ! Réduction de ${response.data.type === 'percentage' ? response.data.value + '%' : response.data.value + '€'}`
        );
      } else {
        toast.error(response.data.error || 'Coupon invalide');
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.error('Erreur lors de la validation du coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const calculateFinalAmount = () => {
    if (!appliedCoupon || !selectedAmount) return selectedAmount;
    
    if (appliedCoupon.type === 'percentage') {
      const discount = (selectedAmount * appliedCoupon.value) / 100;
      return Math.max(0, selectedAmount - discount);
    } else {
      return Math.max(0, selectedAmount - appliedCoupon.value);
    }
  };

  const handlePurchase = async () => {
    // Validation
    if (!Number.isFinite(selectedAmount)) {
      toast.error('Veuillez sélectionner un montant');
      return;
    }
    if (selectedAmount < MIN_CUSTOM_AMOUNT || selectedAmount > MAX_CUSTOM_AMOUNT) {
      toast.error(`Le montant doit être compris entre ${MIN_CUSTOM_AMOUNT}€ et ${MAX_CUSTOM_AMOUNT}€`);
      return;
    }
    if (!formData.buyer_firstname.trim()) {
      toast.error('Veuillez entrer votre prénom');
      return;
    }
    if (!formData.buyer_lastname.trim()) {
      toast.error('Veuillez entrer votre nom');
      return;
    }
    if (!formData.buyer_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.buyer_email)) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }
    if (!formData.buyer_phone.trim()) {
      toast.error('Veuillez entrer votre numéro de téléphone');
      return;
    }

    setLoading(true);
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(`${API}/gift-cards/create-checkout`, {
        amount: selectedAmount,
        origin_url: originUrl,
        buyer_firstname: formData.buyer_firstname,
        buyer_lastname: formData.buyer_lastname,
        buyer_email: formData.buyer_email,
        buyer_phone: formData.buyer_phone,
        recipient_name: formData.recipient_name || null,
        personal_message: formData.personal_message?.trim() || null,
        coupon_token: appliedCoupon?.token || null
      });

      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors de la création du paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedAmount(null);
    setCouponCode('');
    setAppliedCoupon(null);
    setFormData({
      buyer_firstname: '',
      buyer_lastname: '',
      buyer_email: '',
      buyer_phone: '',
      recipient_name: '',
      personal_message: ''
    });
  };

  const finalAmount = calculateFinalAmount();

  return (
    <section id="cartes-cadeaux" className="py-24 md:py-32 bg-[#F9F7F2]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-[#1A1A1A]">
            Cartes <span className="gold-gradient-text italic">cadeaux</span>
          </h2>
          <p className="text-lg md:text-xl text-[#4A4A4A] max-w-3xl mx-auto leading-relaxed">
            Offrez un moment de détente et de beauté avec nos cartes cadeaux valables 6 mois
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {amounts.map((amount, index) => (
              <motion.button
                key={amount}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAmountSelect(amount)}
                data-testid={`gift-card-${amount}`}
                className={`p-8 rounded-2xl transition-all duration-300 ${
                  selectedAmount === amount && !showForm
                    ? 'bg-gradient-to-br from-[#D4AF37] to-[#C5A028] text-white shadow-xl'
                    : 'glass-card text-[#1A1A1A] hover:shadow-lg'
                }`}
              >
                <div className="text-4xl font-bold mb-2">{amount}€</div>
                <div className="text-sm opacity-80">Carte cadeau</div>
              </motion.button>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: amounts.length * 0.1, duration: 0.5 }}
              className={`p-6 rounded-2xl transition-all duration-300 ${
                customAmount && showForm
                  ? 'bg-gradient-to-br from-[#D4AF37] to-[#C5A028] text-white shadow-xl'
                  : 'glass-card text-[#1A1A1A] hover:shadow-lg'
              }`}
            >
              <div className="text-sm font-semibold mb-2">Autre montant</div>
              <input
                type="number"
                min={MIN_CUSTOM_AMOUNT}
                max={MAX_CUSTOM_AMOUNT}
                step="0.5"
                value={customAmount}
                onChange={handleCustomAmountChange}
                placeholder="Ex: 45"
                className={`w-full px-3 py-2 rounded-lg border ${
                  customAmount && showForm
                    ? 'border-white/50 bg-white/10 text-white placeholder-white/70'
                    : 'border-[#E8DCCA] bg-white text-[#1A1A1A]'
                } focus:outline-none focus:ring-2 focus:ring-[#D4AF37]`}
              />
              <div className={`text-xs mt-2 ${customAmount && showForm ? 'text-white/80' : 'text-[#808080]'}`}>
                Entre {MIN_CUSTOM_AMOUNT}€ et {MAX_CUSTOM_AMOUNT}€
              </div>
            </motion.div>
          </div>

          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-light p-8 rounded-3xl mb-8"
            >
              <h3 className="text-xl font-bold mb-6 text-[#1A1A1A]">Vos informations</h3>
              
              {/* Coupon section */}
              <div className="mb-8 p-4 border-2 border-dashed border-[#D4AF37] rounded-lg bg-[#FBF9F4]">
                <h4 className="font-semibold text-[#1A1A1A] mb-4">Code de réduction</h4>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Entrez votre code coupon"
                    disabled={appliedCoupon !== null}
                    className="flex-1 px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] disabled:bg-gray-100"
                  />
                  <button
                    onClick={validateCoupon}
                    disabled={couponValidating || appliedCoupon !== null || !couponCode.trim()}
                    className="px-6 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {couponValidating ? 'Vérification...' : 'Appliquer'}
                  </button>
                </div>
                
                {appliedCoupon && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        <FontAwesomeIcon icon={faCheck} className="mr-2" />
                        Coupon {appliedCoupon.code} appliqué
                      </p>
                      <p className="text-sm text-green-700">
                        Réduction : {appliedCoupon.type === 'percentage' ? appliedCoupon.value + '%' : appliedCoupon.value + '€'}
                      </p>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-red-600 hover:text-red-800 font-semibold"
                      aria-label="Supprimer le coupon"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Prénom *</label>
                  <input
                    type="text"
                    name="buyer_firstname"
                    value={formData.buyer_firstname}
                    onChange={handleFormChange}
                    placeholder="Votre prénom"
                    className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Nom *</label>
                  <input
                    type="text"
                    name="buyer_lastname"
                    value={formData.buyer_lastname}
                    onChange={handleFormChange}
                    placeholder="Votre nom"
                    className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Email *</label>
                  <input
                    type="email"
                    name="buyer_email"
                    value={formData.buyer_email}
                    onChange={handleFormChange}
                    placeholder="votre@email.com"
                    className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    name="buyer_phone"
                    value={formData.buyer_phone}
                    onChange={handleFormChange}
                    placeholder="01 23 45 67 89"
                    className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Bénéficiaire (optionnel)</label>
                <input
                  type="text"
                  name="recipient_name"
                  value={formData.recipient_name}
                  onChange={handleFormChange}
                  placeholder="Nom du bénéficiaire si offre"
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
                <p className="text-sm text-[#808080] mt-1">Laissez vide pour une carte à votre nom</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Message personnel (optionnel)
                </label>
                <textarea
                  name="personal_message"
                  value={formData.personal_message}
                  onChange={handleFormChange}
                  placeholder="Ex: Joyeux anniversaire ! Profite bien de ce moment..."
                  maxLength={MESSAGE_MAX_CHARS}
                  rows={3}
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none"
                />
                <div className="text-xs text-[#808080] mt-1 flex justify-between">
                  <span>Ce message sera imprimé sur la carte cadeau</span>
                  <span>{formData.personal_message.length}/{MESSAGE_MAX_CHARS}</span>
                </div>
              </div>

              {/* Price summary */}
              <div className="mb-6 p-4 bg-[#FBF9F4] rounded-lg border border-[#E8DCCA]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#4A4A4A]">Montant de la carte :</span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {Number.isFinite(selectedAmount) ? selectedAmount.toFixed(2) : '0.00'}€
                  </span>
                </div>
                {appliedCoupon && (
                  <>
                    <div className="flex justify-between items-center text-red-600 text-sm mb-2">
                      <span>Réduction ({appliedCoupon.type === 'percentage' ? appliedCoupon.value + '%' : appliedCoupon.value + '€'}) :</span>
                      <span>-{(selectedAmount - finalAmount).toFixed(2)}€</span>
                    </div>
                    <div className="border-t border-[#E8DCCA] pt-2 flex justify-between items-center">
                      <span className="font-semibold text-[#1A1A1A]">À payer :</span>
                      <span className="text-lg font-bold text-[#D4AF37]">{finalAmount.toFixed(2)}€</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="flex-1 btn-gold text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Redirection...' : `Payer ${finalAmount.toFixed(2)}€`}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 btn-secondary text-lg py-3 disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          )}

          {!showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-light p-8 rounded-3xl mb-8"
            >
              <h3 className="text-xl font-bold mb-4 text-[#1A1A1A]">Informations</h3>
              <ul className="space-y-3 text-[#4A4A4A]">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Valable 6 mois à partir de la date d'achat</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Utilisable sur toutes les prestations de l'institut</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Non remboursable</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Paiement sécurisé par Stripe</span>
                </li>
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}