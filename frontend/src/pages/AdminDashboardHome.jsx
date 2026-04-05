import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/apiClient';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faCreditCard,
  faGift,
  faList,
  faTicket
} from '@fortawesome/free-solid-svg-icons';
import { Clock3, Gem, Search, TicketPercent } from 'lucide-react';
import BusinessHoursManager from '../components/BusinessHoursManager';

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
  onOpenAddPriceModal,
  onAddCoupon
}) {
  const [verifyModal, setVerifyModal] = useState(false);
  const [couponModal, setCouponModal] = useState(false);
  const [businessHoursModal, setBusinessHoursModal] = useState(false);

  const [verifyQuery, setVerifyQuery] = useState('');
  const [verifyType, setVerifyType] = useState('recipient');
  const [verifyResults, setVerifyResults] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [giftCardsIndex, setGiftCardsIndex] = useState([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  const [redeemLoading, setRedeemLoading] = useState(false);

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'percentage',
    value: '',
    validTo: '',
    maxUses: ''
  });
  const [couponLoading, setCouponLoading] = useState(false);

  const getAuthToken = () => adminToken || localStorage.getItem('admin_token') || '';

  const loadGiftCardsIndex = async () => {
    try {
      const response = await axios.get('/gift-cards/all', {
        headers: { Authorization: getAuthToken() }
      });
      setGiftCardsIndex(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setGiftCardsIndex([]);
    }
  };

  const nameSuggestions = useMemo(() => {
    if (verifyType !== 'recipient') return [];
    const term = verifyQuery.trim().toLowerCase();
    if (!term) return [];

    const unique = new Map();
    giftCardsIndex.forEach((card) => {
      const buyerFullName = `${card.buyer_firstname || ''} ${card.buyer_lastname || ''}`.trim();
      const recipientName = String(card.recipient_name || '').trim();

      [recipientName, buyerFullName]
        .filter(Boolean)
        .forEach((name) => {
          const key = name.toLowerCase();
          if (!unique.has(key)) unique.set(key, name);
        });
    });

    return Array.from(unique.values())
      .filter((name) => name.toLowerCase().includes(term))
      .slice(0, 8);
  }, [giftCardsIndex, verifyQuery, verifyType]);

  // ============ VERIFY GIFT CARD ============
  const handleVerify = async () => {
    if (!verifyQuery.trim()) {
      toast.error('Veuillez entrer une recherche');
      return;
    }

    setVerifyLoading(true);
    try {
      const localFilterCards = (cards) => {
        const raw = verifyQuery.trim();
        if (!raw) return [];

        if (verifyType === 'code') {
          const normalized = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
          return cards.filter((card) => {
            const code = String(card.code || '').toUpperCase();
            const codeNormalized = code.replace(/[^A-Z0-9]/g, '');
            return code.includes(raw.toUpperCase()) || codeNormalized.includes(normalized);
          });
        }

        const term = raw.toLowerCase();
        return cards.filter((card) => {
          const haystack = [
            card.recipient_name || '',
            card.buyer_firstname || '',
            card.buyer_lastname || '',
            card.buyer_email || '',
            card.code || '',
          ].join(' ').toLowerCase();
          return haystack.includes(term);
        });
      };

      const params = {
        query: verifyQuery.trim(),
        search_type: verifyType
      };

      let response;
      try {
        response = await axios.get('/gift-cards/search', { params });
      } catch (getError) {
        const status = getError?.response?.status;
        if (status === 404 || status === 405) {
          response = await axios.post('/gift-cards/search', null, { params });
        } else {
          throw getError;
        }
      }

      const apiResults = Array.isArray(response?.data?.results) ? response.data.results : [];
      if (apiResults.length > 0) {
        setVerifyResults(apiResults);
        toast.success(`${apiResults.length} carte(s) trouvée(s)`);
        return;
      }

      const allCardsResponse = await axios.get('/gift-cards/all', {
        headers: { Authorization: getAuthToken() }
      });
      const allCards = Array.isArray(allCardsResponse.data) ? allCardsResponse.data : [];
      const fallbackResults = localFilterCards(allCards);

      if (fallbackResults.length > 0) {
        setVerifyResults(fallbackResults);
        toast.success(`${fallbackResults.length} carte(s) trouvée(s)`);
      } else {
        setVerifyResults([]);
        toast.error('Aucune carte cadeau trouvée');
      }
    } catch (error) {
      console.error('Error verifying gift card:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors de la recherche');
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
        { headers: { Authorization: getAuthToken() } }
      );

      if (response.data.success) {
        toast.success(`Carte cadeau ${response.data.gift_card.code} marquée comme utilisée`);
        setVerifyResults((prev) => {
          if (!Array.isArray(prev)) return prev;
          return prev.map((card) => (
            card.id === giftCardId ? { ...card, status: 'redeemed' } : card
          ));
        });
      }
    } catch (error) {
      const msg = error.response?.data?.detail || 'Erreur lors de la validation';
      toast.error(msg);
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleGiftCardStatusUpdate = async (giftCardId, nextStatus) => {
    if (!giftCardId || !nextStatus) return;

    try {
      await axios.patch(`/gift-cards/${giftCardId}`, null, {
        params: { status: nextStatus },
        headers: { Authorization: getAuthToken() }
      });

      setVerifyResults((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((card) => (
          card.id === giftCardId ? { ...card, status: nextStatus } : card
        ));
      });

      toast.success(`Statut mis à jour: ${translateStatus(nextStatus)}`);
    } catch (error) {
      const msg = error.response?.data?.detail || 'Erreur lors du changement de statut';
      toast.error(msg);
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
        headers: { Authorization: getAuthToken() }
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

  const SquareButton = ({ icon, label, onClick, tone = 'champagne' }) => {
    const toneClasses = {
      champagne: {
        accent: 'from-[#C6A16B] to-[#9F7747]',
        icon: 'text-[#7A5730] border-[#C9AE8B] bg-[#FCF8F1]'
      },
      espresso: {
        accent: 'from-[#6A5448] to-[#3E2F28]',
        icon: 'text-[#4C372D] border-[#BFAEA2] bg-[#FBF7F2]'
      },
      pearl: {
        accent: 'from-[#BDA58B] to-[#8E7660]',
        icon: 'text-[#5C483B] border-[#CFC2B4] bg-[#FCFAF7]'
      },
      bronze: {
        accent: 'from-[#A97854] to-[#6C4832]',
        icon: 'text-[#6F4932] border-[#CBB19D] bg-[#FBF7F1]'
      },
      noir: {
        accent: 'from-[#4A4542] to-[#1F1D1C]',
        icon: 'text-[#352F2D] border-[#BBB1AA] bg-[#FBF8F4]'
      }
    };

    const selectedTone = toneClasses[tone] || toneClasses.champagne;

    return (
      <motion.button
        whileHover={{ y: -5, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="group relative min-h-[152px] overflow-hidden rounded-[28px] border border-[#DED3C5] bg-[linear-gradient(180deg,#FCFAF7_0%,#F4EDE3_100%)] p-5 text-center shadow-[0_20px_45px_rgba(98,79,58,0.10)] transition-all duration-300 flex flex-col items-center justify-center gap-3"
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r ${selectedTone.accent}`} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_55%)] opacity-80" />
        <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-105 ${selectedTone.icon}`}>
          {icon}
        </div>
        <div className="relative z-10 text-[14px] font-semibold leading-5 text-[#231B16]">
          {label}
        </div>
      </motion.button>
    );
  };

  return (
    <div className="w-full h-full bg-linear-to-br from-[#F9F7F2] to-[#FBF9F4] p-8 overflow-auto">
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
        <h2 className="mb-6 text-2xl font-bold text-[#1A1A1A]">Actions Rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <SquareButton
            icon={<Search className="h-6 w-6" strokeWidth={1.8} />}
            label="Rechercher une carte"
            tone="pearl"
            onClick={() => {
              setVerifyQuery('');
              setVerifyType('recipient');
              setVerifyResults(null);
              setShowNameSuggestions(false);
              loadGiftCardsIndex();
              setVerifyModal(true);
            }}
          />
          <SquareButton
            icon={<Gem className="h-6 w-6" strokeWidth={1.8} />}
            label="Nouveau Tarif"
            tone="champagne"
            onClick={onOpenAddPriceModal}
          />
          <SquareButton
            icon={<TicketPercent className="h-6 w-6" strokeWidth={1.8} />}
            label="Nouveau Coupon"
            tone="bronze"
            onClick={() => setCouponModal(true)}
          />
          <SquareButton
            icon={<Clock3 className="h-6 w-6" strokeWidth={1.8} />}
            label="Horaires"
            tone="noir"
            onClick={() => setBusinessHoursModal(true)}
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
          <button className="mt-4 px-4 py-2 bg-linear-to-r from-[#D4AF37] to-[#C5A028] text-white rounded-lg hover:shadow-md transition-all">
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
          <button className="mt-4 px-4 py-2 bg-linear-to-r from-[#D4AF37] to-[#C5A028] text-white rounded-lg hover:shadow-md transition-all">
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
          <button className="mt-4 px-4 py-2 bg-linear-to-r from-[#D4AF37] to-[#C5A028] text-white rounded-lg hover:shadow-md transition-all">
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
              Rechercher une Carte Cadeau
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
                  autoFocus
                  onChange={(e) => {
                    const value = e.target.value;
                    if (verifyType === 'code') {
                      setVerifyQuery(formatGiftCardCode(value));
                    } else {
                      setVerifyQuery(value);
                      setShowNameSuggestions(true);
                    }
                  }}
                  onFocus={() => {
                    if (verifyType === 'recipient') setShowNameSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowNameSuggestions(false), 120);
                  }}
                  placeholder={verifyType === 'code' ? 'LB-XXXX-XXXX' : 'Entrez un nom'}
                  className="w-full px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
                {verifyType === 'recipient' && showNameSuggestions && nameSuggestions.length > 0 && (
                  <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-[#E8DCCA] bg-white shadow-lg">
                    {nameSuggestions.map((name) => (
                      <div
                        key={name}
                        onMouseDown={() => {
                          setVerifyQuery(name);
                          setShowNameSuggestions(false);
                        }}
                        className="w-full cursor-pointer px-3 py-2 text-left text-sm text-[#111111] bg-white hover:bg-[#F9F7F2]"
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleVerify}
                disabled={verifyLoading || !verifyQuery.trim()}
                className="w-full px-6 py-3 bg-[#D4AF37] text-[#1A1A1A] rounded-lg hover:bg-[#C5A028] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                {verifyLoading ? 'Recherche...' : 'Rechercher'}
              </button>
            </div>

            {/* Results */}
            {verifyResults && verifyResults.length > 0 && (
              <div className="space-y-4 text-[#1A1A1A]">
                <h3 className="font-bold text-[#1A1A1A]">
                  Résultats ({verifyResults.length})
                </h3>
                {verifyResults.map((card) => (
                  <div
                    key={card.id}
                    className="border border-[#E8DCCA] rounded-lg p-4 bg-white text-[#1A1A1A]"
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
                    <div className="flex flex-wrap gap-2">
                      {card.status === 'pending' && (
                        <button
                          onClick={() => handleGiftCardStatusUpdate(card.id, 'active')}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-sm font-semibold"
                        >
                          Activer
                        </button>
                      )}
                      {card.status === 'active' && (
                        <button
                          onClick={() => handleRedeem(card.id)}
                          disabled={redeemLoading}
                          className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold"
                        >
                          {redeemLoading ? 'Validation...' : (<><FontAwesomeIcon icon={faCheck} className="mr-2" />Marquer utilisée</>)}
                        </button>
                      )}
                      {card.status === 'redeemed' && (
                        <button
                          onClick={() => handleGiftCardStatusUpdate(card.id, 'active')}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all text-sm font-semibold"
                        >
                          Remettre active
                        </button>
                      )}
                      {card.status !== 'canceled' && (
                        <button
                          onClick={() => handleGiftCardStatusUpdate(card.id, 'canceled')}
                          className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all text-sm font-semibold"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
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
                className="flex-1 px-6 py-2 bg-linear-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
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

      {/* Business Hours Manager */}
      <BusinessHoursManager 
        adminToken={adminToken}
        isOpen={businessHoursModal}
        onClose={() => setBusinessHoursModal(false)}
      />
    </div>
  );
}
