import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/apiClient';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faCreditCard,
  faEuroSign,
  faGift,
  faList,
  faMagnifyingGlass,
  faTicket
} from '@fortawesome/free-solid-svg-icons';

const axios = api;

// Fonction pour traduire les statuts des cartes cadeaux
const translateStatus = (status) => {
  const translations = {
    pending: 'En attente',
    active: 'Actif',
    redeemed: 'Utilisé',
    expired: 'Expiré',
    canceled: 'Annulé',
    failed: 'Échoué'
  };
  return translations[status] || status;
};

// Formater automatiquement le numéro de carte cadeau (majuscules + tirets)
const formatGiftCardCode = (value) => {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const part1 = cleaned.slice(0, 2);
  const part2 = cleaned.slice(2, 6);
  const part3 = cleaned.slice(6, 10);
  const parts = [part1, part2, part3].filter(Boolean);
  return parts.join('-');
};

export default function AdminDashboardHome({
  onNavigatePrices,
  onNavigateGiftCards,
  onNavigateCoupons,
  adminToken,
  onAddPrice,
  onAddCoupon
}) {
  const [verifyModal, setVerifyModal] = useState(false);
  const [redeemModal, setRedeemModal] = useState(false);
  const [priceModal, setPriceModal] = useState(false);
  const [couponModal, setCouponModal] = useState(false);

  const [verifyQuery, setVerifyQuery] = useState('');
  const [verifyType, setVerifyType] = useState('code');
  const [verifyResults, setVerifyResults] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);

  const [newPrice, setNewPrice] = useState({
    category: '',
    name: '',
    priceEur: '',
    durationMin: '',
    note: ''
  });
  const [priceLoading, setPriceLoading] = useState(false);

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'percentage',
    value: '',
    validTo: '',
    maxUses: ''
  });
  const [couponLoading, setCouponLoading] = useState(false);

  // ============ VERIFY GIFT CARD ============
  const handleVerify = async () => {
    if (!verifyQuery.trim()) {
      toast.error('Veuillez entrer une recherche');
      return;
    }

    setVerifyLoading(true);
    try {
      const response = await axios.post('/gift-cards/search', null, {
        params: {
          query: verifyQuery.trim(),
          search_type: verifyType
        }
      });

      if (response.data.found) {
        setVerifyResults(response.data.results);
        toast.success(`${response.data.results.length} carte(s) trouvée(s)`);
      } else {
        setVerifyResults([]);
        toast.error('Aucune carte cadeau trouvée');
      }
    } catch (error) {
      console.error('Error verifying gift card:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setVerifyLoading(false);
    }
  };

  // ============ REDEEM GIFT CARD ============
  const handleRedeem = async (giftCardId) => {
    if (!giftCardId) {
      toast.error('ID de carte cadeau manquant');
      return;
    }

    setRedeemLoading(true);
    try {
      const response = await axios.post(
        `/gift-cards/${giftCardId}/redeem`,
        {},
        { headers: { Authorization: adminToken } }
      );

      if (response.data.success) {
        toast.success(`Carte cadeau ${response.data.gift_card.code} marquée comme utilisée`);
        setRedeemModal(false);
        setVerifyQuery('');
        setVerifyResults(null);
        setRedeemCode('');
      }
    } catch (error) {
      const msg = error.response?.data?.detail || 'Erreur lors de la validation';
      toast.error(msg);
    } finally {
      setRedeemLoading(false);
    }
  };

  // ============ ADD PRICE ============
  const handleAddPrice = async () => {
    if (!newPrice.category || !newPrice.name || !newPrice.priceEur) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    setPriceLoading(true);
    try {
      const priceData = {
        category: newPrice.category,
        name: newPrice.name,
        priceEur: parseFloat(newPrice.priceEur),
        durationMin: newPrice.durationMin ? parseInt(newPrice.durationMin) : null,
        note: newPrice.note || null,
        isActive: true,
        sortOrder: 0
      };

      await axios.post('/prices', priceData, {
        headers: { Authorization: adminToken }
      });

      toast.success(`Tarif "${newPrice.name}" ajouté`);
      setPriceModal(false);
      setNewPrice({
        category: '',
        name: '',
        priceEur: '',
        durationMin: '',
        note: ''
      });
      onAddPrice?.();
    } catch (error) {
      console.error('Error adding price:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'ajout');
    } finally {
      setPriceLoading(false);
    }
  };

  // ============ ADD COUPON ============
  const handleAddCoupon = async () => {
    if (!newCoupon.code || !newCoupon.value || !newCoupon.validTo) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    setCouponLoading(true);
    try {
      const couponData = {
        code: newCoupon.code.toUpperCase(),
        type: newCoupon.type,
        value: parseFloat(newCoupon.value),
        validTo: new Date(newCoupon.validTo).toISOString(),
        isActive: true,
        maxUses: newCoupon.maxUses ? parseInt(newCoupon.maxUses) : null
      };

      await axios.post('/coupons', couponData, {
        headers: { Authorization: adminToken }
      });

      toast.success(`Coupon "${newCoupon.code}" créé`);
      setCouponModal(false);
      setNewCoupon({
        code: '',
        type: 'percentage',
        value: '',
        validTo: '',
        maxUses: ''
      });
      onAddCoupon?.();
    } catch (error) {
      console.error('Error adding coupon:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'ajout');
    } finally {
      setCouponLoading(false);
    }
  };

  // ============ RENDER COMPONENTS ============

  const SquareButton = ({ icon, label, onClick, color = 'gold' }) => {
    const colorClasses = {
      gold: 'from-[#D4AF37] to-[#C5A028] hover:shadow-lg',
      green: 'from-green-500 to-green-600 hover:shadow-lg',
      blue: 'from-blue-500 to-blue-600 hover:shadow-lg',
      purple: 'from-purple-500 to-purple-600 hover:shadow-lg',
      red: 'from-red-500 to-red-600 hover:shadow-lg'
    };

    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-2 p-4`}
      >
        <div className="text-4xl">{icon}</div>
        <div className="text-sm font-semibold text-center">{label}</div>
      </motion.button>
    );
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-[#F9F7F2] to-[#FBF9F4] p-8 overflow-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">
          Tableau de Bord
        </h1>
        <p className="text-[#4A4A4A]">Bienvenue dans votre espace de gestion</p>
      </motion.div>

      {/* Quick Actions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16"
      >
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Actions Rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <SquareButton
            icon={<FontAwesomeIcon icon={faMagnifyingGlass} />}
            label="Vérifier une Carte"
            color="blue"
            onClick={() => {
              setVerifyQuery('');
              setVerifyResults(null);
              setVerifyModal(true);
            }}
          />
          <SquareButton
            icon={<FontAwesomeIcon icon={faCheck} />}
            label="Valider une Carte"
            color="green"
            onClick={() => {
              setRedeemCode('');
              setRedeemModal(true);
            }}
          />
          <SquareButton
            icon={<FontAwesomeIcon icon={faEuroSign} />}
            label="Nouveau Tarif"
            color="purple"
            onClick={() => setPriceModal(true)}
          />
          <SquareButton
            icon={<FontAwesomeIcon icon={faTicket} />}
            label="Nouveau Coupon"
            color="red"
            onClick={() => setCouponModal(true)}
          />
          <SquareButton
            icon={<FontAwesomeIcon icon={faList} />}
            label="Tous les Tarifs"
            color="gold"
            onClick={onNavigatePrices}
          />
        </div>
      </motion.div>

      {/* Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Cartes Cadeaux */}
        <motion.div
          whileHover={{ y: -4 }}
          onClick={onNavigateGiftCards}
          className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg cursor-pointer transition-all"
        >
          <div className="text-5xl mb-4">
            <FontAwesomeIcon icon={faGift} />
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Cartes Cadeaux</h3>
          <p className="text-[#4A4A4A] text-sm">Gérer et suivre vos cartes cadeau</p>
          <button className="mt-4 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white rounded-lg hover:shadow-md transition-all">
            Accéder →
          </button>
        </motion.div>

        {/* Tarifs */}
        <motion.div
          whileHover={{ y: -4 }}
          onClick={onNavigatePrices}
          className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg cursor-pointer transition-all"
        >
          <div className="text-5xl mb-4">
            <FontAwesomeIcon icon={faCreditCard} />
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Tarifs Complets</h3>
          <p className="text-[#4A4A4A] text-sm">Consulter et modifier tous les tarifs</p>
          <button className="mt-4 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white rounded-lg hover:shadow-md transition-all">
            Accéder →
          </button>
        </motion.div>

        {/* Coupons */}
        <motion.div
          whileHover={{ y: -4 }}
          onClick={onNavigateCoupons}
          className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg cursor-pointer transition-all"
        >
          <div className="text-5xl mb-4">
            <FontAwesomeIcon icon={faTicket} />
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Coupons</h3>
          <p className="text-[#4A4A4A] text-sm">Gérer les codes de réduction</p>
          <button className="mt-4 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white rounded-lg hover:shadow-md transition-all">
            Accéder →
          </button>
        </motion.div>
      </motion.div>

      {/* ============ VERIFY MODAL ============ */}
      {verifyModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setVerifyModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-auto"
          >
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">
              Vérifier une Carte Cadeau
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Type de recherche
                </label>
                <select
                  value={verifyType}
                  onChange={(e) => {
                    setVerifyType(e.target.value);
                    setVerifyResults(null);
                  }}
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="code">Par Numéro de Carte</option>
                  <option value="recipient">Par Nom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  {verifyType === 'code' ? 'Numéro de carte' : 'Nom (bénéficiaire ou acheteur)'}
                </label>
                <input
                  type="text"
                  value={verifyQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (verifyType === 'code') {
                      setVerifyQuery(formatGiftCardCode(value));
                    } else {
                      setVerifyQuery(value);
                    }
                  }}
                  placeholder={verifyType === 'code' ? 'LB-XXXX-XXXX' : 'Entrez un nom'}
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={verifyLoading || !verifyQuery.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                {verifyLoading ? 'Recherche...' : 'Rechercher'}
              </button>
            </div>

            {/* Results */}
            {verifyResults && verifyResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-[#1A1A1A]">
                  Résultats ({verifyResults.length})
                </h3>
                {verifyResults.map((card) => (
                  <div
                    key={card.id}
                    className="border border-[#E8DCCA] rounded-lg p-4 bg-[#FBF9F4]"
                  >
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-[#4A4A4A]">Numéro</p>
                        <p className="font-mono font-bold text-[#1A1A1A]">{card.code}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#4A4A4A]">Montant</p>
                        <p className="font-bold text-[#D4AF37]">{card.amountEur}€</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#4A4A4A]">Statut</p>
                        <p className="font-semibold text-[#1A1A1A]">{translateStatus(card.status)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#4A4A4A]">Expire le</p>
                        <p className="text-sm text-[#1A1A1A]">
                          {card.expiresAt ? new Date(card.expiresAt).toLocaleDateString('fr-FR') : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="mb-3 pb-3 border-t border-[#E8DCCA]">
                      <p className="text-xs text-[#4A4A4A] mb-1">Bénéficiaire</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {card.recipient_name || card.buyer_firstname + ' ' + card.buyer_lastname}
                      </p>
                      <p className="text-xs text-[#4A4A4A] mt-2">Acheté par</p>
                      <p className="text-sm text-[#1A1A1A]">
                        {card.buyer_firstname} {card.buyer_lastname}
                      </p>
                    </div>
                    {card.status === 'active' && (
                      <button
                        onClick={() => handleRedeem(card.id)}
                        disabled={redeemLoading}
                        className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                      >
                        {redeemLoading ? 'Validation...' : (<><FontAwesomeIcon icon={faCheck} className="mr-2" />Marquer comme utilisée</>)}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-6 border-t border-[#E8DCCA]">
              <button
                onClick={() => setVerifyModal(false)}
                className="flex-1 px-6 py-2 border border-[#E8DCCA] text-[#1A1A1A] rounded-lg hover:bg-[#FBF9F4] transition-all"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ============ REDEEM MODAL ============ */}
      {redeemModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setRedeemModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">
              Valider une Carte Cadeau
            </h2>

            <p className="text-[#4A4A4A] mb-4">
              Utilisez la recherche ci-dessus pour trouver une carte, puis cliquez sur "Marquer comme utilisée"
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                💡 Conseil : Utilisez d'abord l'onglet "Vérifier" pour retrouver la carte, puis validez-la.
              </p>
            </div>

            <button
              onClick={() => {
                setRedeemModal(false);
                setVerifyModal(true);
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-md transition-all font-semibold mb-3"
            >
              Aller à la Recherche
            </button>

            <button
              onClick={() => setRedeemModal(false)}
              className="w-full px-6 py-2 border border-[#E8DCCA] text-[#1A1A1A] rounded-lg hover:bg-[#FBF9F4] transition-all"
            >
              Fermer
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* ============ PRICE MODAL ============ */}
      {priceModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setPriceModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">
              Ajouter un Nouveau Tarif
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Catégorie *
                </label>
                <input
                  type="text"
                  value={newPrice.category}
                  onChange={(e) => setNewPrice({ ...newPrice, category: e.target.value })}
                  placeholder="ex: Epilations"
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Nom du service *
                </label>
                <input
                  type="text"
                  value={newPrice.name}
                  onChange={(e) => setNewPrice({ ...newPrice, name: e.target.value })}
                  placeholder="ex: Sourcils"
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Prix (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice.priceEur}
                  onChange={(e) => setNewPrice({ ...newPrice, priceEur: e.target.value })}
                  placeholder="25.00"
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Durée (minutes)
                </label>
                <input
                  type="number"
                  value={newPrice.durationMin}
                  onChange={(e) => setNewPrice({ ...newPrice, durationMin: e.target.value })}
                  placeholder="30"
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Note
                </label>
                <input
                  type="text"
                  value={newPrice.note}
                  onChange={(e) => setNewPrice({ ...newPrice, note: e.target.value })}
                  placeholder="ex: En duo 60€"
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddPrice}
                disabled={priceLoading}
                className="flex-1 px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                {priceLoading ? 'Ajout...' : 'Ajouter'}
              </button>
              <button
                onClick={() => setPriceModal(false)}
                className="flex-1 px-6 py-2 border border-[#E8DCCA] text-[#1A1A1A] rounded-lg hover:bg-[#FBF9F4] transition-all"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ============ COUPON MODAL ============ */}
      {couponModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setCouponModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">
              Ajouter un Nouveau Coupon
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Code *
                </label>
                <input
                  type="text"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER2025"
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Type *
                </label>
                <select
                  value={newCoupon.type}
                  onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="percentage">Pourcentage</option>
                  <option value="fixed">Montant fixe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Valeur *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newCoupon.value}
                  onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })}
                  placeholder={newCoupon.type === 'percentage' ? '15' : '25.00'}
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Valide jusqu'au *
                </label>
                <input
                  type="date"
                  value={newCoupon.validTo}
                  onChange={(e) => setNewCoupon({ ...newCoupon, validTo: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Max utilisations
                </label>
                <input
                  type="number"
                  value={newCoupon.maxUses}
                  onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}
                  placeholder="100"
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddCoupon}
                disabled={couponLoading}
                className="flex-1 px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                {couponLoading ? 'Création...' : 'Créer'}
              </button>
              <button
                onClick={() => setCouponModal(false)}
                className="flex-1 px-6 py-2 border border-[#E8DCCA] text-[#1A1A1A] rounded-lg hover:bg-[#FBF9F4] transition-all"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
