import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faHouse, faXmark, faInfoCircle, faFilePdf, faEnvelope, faCalendarPlus, faUserEdit, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import AdminDashboardHome from './AdminDashboardHome';
import logoLeaBeaute from '../assets/photos/logos/logo16-9_1.png';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

export default function AdminPage() {
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState('home');

  // Prices
  const [prices, setPrices] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddPriceModal, setShowAddPriceModal] = useState(false);
  const [newPriceForm, setNewPriceForm] = useState({
    category: '',
    name: '',
    priceEur: '',
    durationMin: '',
    note: '',
    isActive: true
  });

  // Gift Cards
  const [giftCards, setGiftCards] = useState([]);
  const [giftCardStatusFilters, setGiftCardStatusFilters] = useState({
    pending: true,
    active: true,
    redeemed: true,
    expired: true,
    canceled: true,
    failed: true
  });
  const [selectedGiftCard, setSelectedGiftCard] = useState(null);
  const [showGiftCardModal, setShowGiftCardModal] = useState(false);
  const [extendExpiryDate, setExtendExpiryDate] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Coupons
  const [coupons, setCoupons] = useState([]);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    validTo: '',
    isActive: true,
    maxUses: ''
  });
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [editCouponForm, setEditCouponForm] = useState({});

  // Initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      fetchPrices(savedToken);
    }
  }, []);

  // Gift Cards functions
  const fetchGiftCards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/gift-cards/all`, {
        headers: { Authorization: token }
      });
      setGiftCards(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des cartes cadeaux');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Coupons functions
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/coupons/all`, {
        headers: { Authorization: token }
      });
      setCoupons(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des coupons');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load data based on tab
  useEffect(() => {
    if (token && activeTab === 'coupons') {
      fetchCoupons();
    }
  }, [token, activeTab, fetchCoupons]);

  useEffect(() => {
    if (token && activeTab === 'gift-cards') {
      fetchGiftCards();
    }
  }, [token, activeTab, fetchGiftCards]);

  // Auth functions
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/admin/login`, { password });
      if (response.data.success) {
        setToken(response.data.token);
        setIsAuthenticated(true);
        localStorage.setItem('admin_token', response.data.token);
        fetchPrices(response.data.token);
        toast.success('Connexion réussie');
      }
    } catch (error) {
      toast.error('Mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken(null);
    localStorage.removeItem('admin_token');
    toast.success('Déconnexion réussie');
  };

  // Prices functions
  const fetchPrices = async (authToken) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/prices/all`, {
        headers: { Authorization: authToken }
      });
      setPrices(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des tarifs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrice = async () => {
    if (!newPriceForm.category.trim()) {
      toast.error('Veuillez entrer une catégorie');
      return;
    }
    if (!newPriceForm.name.trim()) {
      toast.error('Veuillez entrer un nom');
      return;
    }
    if (newPriceForm.priceEur === '') {
      toast.error('Veuillez entrer un prix');
      return;
    }

    try {
      await axios.post(`${API}/prices`, {
        category: newPriceForm.category,
        name: newPriceForm.name,
        priceEur: newPriceForm.priceEur ? parseFloat(newPriceForm.priceEur) : null,
        durationMin: newPriceForm.durationMin ? parseInt(newPriceForm.durationMin) : null,
        note: newPriceForm.note || null,
        isActive: newPriceForm.isActive
      }, {
        headers: { Authorization: token }
      });
      toast.success('Tarif ajouté avec succès');
      setShowAddPriceModal(false);
      setNewPriceForm({
        category: '',
        name: '',
        priceEur: '',
        durationMin: '',
        note: '',
        isActive: true
      });
      fetchPrices(token);
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du tarif');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API}/prices/${editingId}`, editForm, {
        headers: { Authorization: token }
      });
      toast.success('Tarif mis à jour');
      setEditingId(null);
      fetchPrices(token);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce tarif ?')) return;
    
    try {
      await axios.delete(`${API}/prices/${id}`, {
        headers: { Authorization: token }
      });
      toast.success('Tarif supprimé');
      fetchPrices(token);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteGiftCard = async (id) => {
    if (!window.confirm('Supprimer cette carte cadeau en attente ?')) return;

    try {
      await axios.delete(`${API}/gift-cards/${id}`, {
        headers: { Authorization: token }
      });
      toast.success('Carte cadeau supprimée');
      fetchGiftCards();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const handleViewGiftCard = (card) => {
    setSelectedGiftCard(card);
    setShowGiftCardModal(true);
    setExtendExpiryDate(card.expiresAt ? card.expiresAt.split('T')[0] : '');
    setNewRecipientName(card.recipient_name || '');
  };

  const handleActivateGiftCard = async (id) => {
    if (!window.confirm('Valider cette carte cadeau ? Un code unique sera généré.')) return;

    try {
      const response = await axios.post(`${API}/gift-cards/${id}/activate`, {}, {
        headers: { Authorization: token }
      });
      toast.success(`Carte activée avec le code: ${response.data.code}`);
      fetchGiftCards();
      if (showGiftCardModal) {
        setSelectedGiftCard(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'activation');
    }
  };

  const handleExtendExpiry = async (id) => {
    if (!extendExpiryDate) {
      toast.error('Veuillez sélectionner une date');
      return;
    }

    try {
      await axios.patch(`${API}/gift-cards/${id}/extend-expiry`, {
        new_expiry_date: extendExpiryDate
      }, {
        headers: { Authorization: token }
      });
      toast.success('Date de validité prolongée');
      fetchGiftCards();
      const response = await axios.get(`${API}/gift-cards/${id}`, {
        headers: { Authorization: token }
      });
      setSelectedGiftCard(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la prolongation');
    }
  };

  const handleUpdateRecipient = async (id) => {
    if (!newRecipientName.trim()) {
      toast.error('Veuillez entrer un nom de bénéficiaire');
      return;
    }

    try {
      await axios.patch(`${API}/gift-cards/${id}/update-recipient`, {
        recipient_name: newRecipientName
      }, {
        headers: { Authorization: token }
      });
      toast.success('Bénéficiaire mis à jour');
      fetchGiftCards();
      const response = await axios.get(`${API}/gift-cards/${id}`, {
        headers: { Authorization: token }
      });
      setSelectedGiftCard(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  };

  const wrapText = (text, maxCharsPerLine) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + word).length > maxCharsPerLine) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });
    
    if (currentLine) lines.push(currentLine.trim());
    return lines;
  };

  const handleGeneratePDF = async (card) => {
    if (!card.code) {
      toast.error('Cette carte doit être validée avant de générer le PDF');
      return;
    }

    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 419.53]);
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const creamColor = rgb(0.976, 0.969, 0.949);
      const goldColor = rgb(0.831, 0.686, 0.216);
      const darkGoldColor = rgb(0.773, 0.627, 0.156);
      const textColor = rgb(0.102, 0.102, 0.102);
      const borderColor = rgb(0.831, 0.686, 0.216);

      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: creamColor,
      });

      page.drawRectangle({
        x: 0,
        y: height - 70,
        width: width,
        height: 70,
        color: goldColor,
      });

      // Embed logo
      try {
        const logoResponse = await fetch(logoLeaBeaute);
        if (!logoResponse.ok) {
          throw new Error('Logo non trouvé');
        }
        const logoBytes = await logoResponse.arrayBuffer();
        
        // Try to embed as PNG
        let logoImage;
        try {
          logoImage = await pdfDoc.embedPng(logoBytes);
        } catch (pngError) {
          console.warn('PNG embedding failed, trying JPEG:', pngError);
          logoImage = await pdfDoc.embedJpg(logoBytes);
        }
        
        const logoAspect = logoImage.width / logoImage.height;
        const logoHeight = 40;
        const logoWidth = logoHeight * logoAspect;
        page.drawImage(logoImage, {
          x: (width - Math.min(logoWidth, 140)) / 2,
          y: height - 60,
          width: Math.min(logoWidth, 140),
          height: Math.min(logoHeight, 140 / logoAspect),
        });
      } catch (logoError) {
        console.error('Erreur chargement logo:', logoError);
        // Continue without logo - add text instead
        page.drawText('LEA BEAUTE', {
          x: width / 2 - 50,
          y: height - 50,
          size: 18,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
      }

      page.drawText('CARTE CADEAU', {
        x: width / 2 - 80,
        y: height - 95,
        size: 20,
        font: fontBold,
        color: goldColor,
      });

      const codeBoxY = height - 170;
      const codeBoxHeight = 60;
      page.drawRectangle({
        x: 40,
        y: codeBoxY,
        width: width - 80,
        height: codeBoxHeight,
        borderColor: borderColor,
        borderWidth: 2,
      });

      page.drawText('Code:', {
        x: 60,
        y: codeBoxY + 35,
        size: 12,
        font: font,
        color: textColor,
      });

      page.drawText(card.code, {
        x: 110,
        y: codeBoxY + 33,
        size: 16,
        font: fontBold,
        color: darkGoldColor,
      });

      page.drawText('Montant:', {
        x: width - 200,
        y: codeBoxY + 35,
        size: 12,
        font: font,
        color: textColor,
      });

      page.drawText(`${card.amountEur} €`, {
        x: width - 120,
        y: codeBoxY + 33,
        size: 16,
        font: fontBold,
        color: darkGoldColor,
      });

      page.drawText(`Valide jusqu'au: ${card.expiresAt ? new Date(card.expiresAt).toLocaleDateString('fr-FR') : 'Non défini'}`, {
        x: 60,
        y: codeBoxY + 10,
        size: 10,
        font: font,
        color: textColor,
      });

      let currentY = codeBoxY - 30;

      if (card.personal_message) {
        page.drawText('Message personnel:', {
          x: 40,
          y: currentY,
          size: 11,
          font: fontBold,
          color: textColor,
        });
        currentY -= 20;

        const messageLines = wrapText(card.personal_message, 90);
        messageLines.forEach((line) => {
          page.drawText(line, {
            x: 40,
            y: currentY,
            size: 10,
            font: font,
            color: textColor,
          });
          currentY -= 14;
        });
        currentY -= 10;
      }

      if (card.recipient_name) {
        page.drawText(`Pour: ${card.recipient_name}`, {
          x: 40,
          y: currentY,
          size: 11,
          font: fontBold,
          color: goldColor,
        });
        currentY -= 25;
      }

      page.drawText('CONDITIONS D\'UTILISATION', {
        x: 40,
        y: currentY,
        size: 11,
        font: fontBold,
        color: textColor,
      });
      currentY -= 18;

      const conditions = [
        '• Valable sur tous nos soins et prestations',
        '• Non remboursable et non échangeable contre espèces',
        '• Utilisable en une ou plusieurs fois',
        '• À présenter lors de votre visite'
      ];

      conditions.forEach((condition) => {
        page.drawText(condition, {
          x: 40,
          y: currentY,
          size: 9,
          font: font,
          color: textColor,
        });
        currentY -= 14;
      });

      page.drawText('Institut Léa Beauté', {
        x: 40,
        y: 40,
        size: 10,
        font: fontBold,
        color: textColor,
      });

      page.drawText('Tel: 06 XX XX XX XX', {
        x: 40,
        y: 25,
        size: 9,
        font: font,
        color: textColor,
      });

      page.drawText('Adresse de l\'institut', {
        x: 40,
        y: 10,
        size: 9,
        font: font,
        color: textColor,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      toast.success('PDF généré avec succès');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const handleSendEmail = async (card) => {
    if (!card.code) {
      toast.error('Cette carte doit être validée avant d\'envoyer l\'email');
      return;
    }

    setSendingEmail(true);
    try {
      await axios.post(`${API}/gift-cards/${card.id}/resend-email`, {}, {
        headers: { Authorization: token }
      });
      toast.success(`Email envoyé à ${card.buyer_email}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleAddCoupon = async () => {
    if (!newCouponForm.code.trim()) {
      toast.error('Veuillez entrer un code');
      return;
    }
    if (newCouponForm.value === '') {
      toast.error('Veuillez entrer une valeur');
      return;
    }
    if (!newCouponForm.validTo) {
      toast.error('Veuillez choisir une date d\'expiration');
      return;
    }

    try {
      await axios.post(`${API}/coupons`, {
        code: newCouponForm.code,
        type: newCouponForm.type,
        value: parseFloat(newCouponForm.value),
        validTo: new Date(newCouponForm.validTo).toISOString(),
        isActive: newCouponForm.isActive,
        maxUses: newCouponForm.maxUses ? parseInt(newCouponForm.maxUses) : null
      }, {
        headers: { Authorization: token }
      });
      toast.success('Coupon créé avec succès');
      setShowAddCouponModal(false);
      setNewCouponForm({
        code: '',
        type: 'percentage',
        value: '',
        validTo: '',
        isActive: true,
        maxUses: ''
      });
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création du coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce coupon ?')) return;

    try {
      await axios.delete(`${API}/coupons/${id}`, {
        headers: { Authorization: token }
      });
      toast.success('Coupon supprimé');
      fetchCoupons();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEditCoupon = (coupon) => {
    setEditingCouponId(coupon.id);
    setEditCouponForm({ ...coupon });
  };

  const handleSaveCouponEdit = async () => {
    try {
      await axios.put(`${API}/coupons/${editingCouponId}`, editCouponForm, {
        headers: { Authorization: token }
      });
      toast.success('Coupon mis à jour');
      setEditingCouponId(null);
      fetchCoupons();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const categories = ['all', ...new Set(prices.map(p => p.category))];
  const filteredPrices = prices.filter(item => {
    const matchCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const filteredGiftCards = giftCards.filter(card => giftCardStatusFilters[card.status]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center px-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6 text-[#1A1A1A] text-center">Admin Dashboard</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F2]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#E8DCCA]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-[#4A4A4A] hover:text-[#D4AF37] transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E8DCCA]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('home')}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'home'
                  ? 'border-[#D4AF37] text-[#D4AF37]'
                  : 'border-transparent text-[#4A4A4A] hover:text-[#D4AF37]'
              }`}
            >
              <FontAwesomeIcon icon={faHouse} className="mr-2" /> Accueil
            </button>
            <button
              onClick={() => { setActiveTab('prices'); setFilterCategory('all'); setSearchTerm(''); }}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'prices'
                  ? 'border-[#D4AF37] text-[#D4AF37]'
                  : 'border-transparent text-[#4A4A4A] hover:text-[#D4AF37]'
              }`}
            >
              Tarifs
            </button>
            <button
              onClick={() => setActiveTab('gift-cards')}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'gift-cards'
                  ? 'border-[#D4AF37] text-[#D4AF37]'
                  : 'border-transparent text-[#4A4A4A] hover:text-[#D4AF37]'
              }`}
            >
              Cartes cadeaux
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'coupons'
                  ? 'border-[#D4AF37] text-[#D4AF37]'
                  : 'border-transparent text-[#4A4A4A] hover:text-[#D4AF37]'
              }`}
            >
              Coupons
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* TAB: HOME */}
        {activeTab === 'home' && (
          <AdminDashboardHome
            onNavigatePrices={() => setActiveTab('prices')}
            onNavigateGiftCards={() => setActiveTab('gift-cards')}
            onNavigateCoupons={() => setActiveTab('coupons')}
            adminToken={token}
            onAddPrice={() => fetchPrices(token)}
            onAddCoupon={() => fetchCoupons()}
          />
        )}

        {/* TAB: PRICES */}
        {activeTab === 'prices' && (
          <div>
            <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat === 'all' ? 'Toutes les catégories' : cat}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowAddPriceModal(true)}
                className="btn-gold w-full md:w-auto"
              >
                + Ajouter un tarif
              </button>
            </div>

            {/* Add Price Modal */}
            {showAddPriceModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
                  <h2 className="text-2xl font-bold mb-6 text-[#1A1A1A]">Ajouter un tarif</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        Catégorie
                      </label>
                      <select
                        value={newPriceForm.category}
                        onChange={(e) => setNewPriceForm({...newPriceForm, category: e.target.value})}
                        className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      >
                        <option value="">Sélectionner...</option>
                        {categories.filter(c => c !== 'all').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newPriceForm.category}
                        onChange={(e) => setNewPriceForm({...newPriceForm, category: e.target.value})}
                        placeholder="Ou saisissez une nouvelle catégorie"
                        className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] mt-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        Désignation
                      </label>
                      <input
                        type="text"
                        value={newPriceForm.name}
                        onChange={(e) => setNewPriceForm({...newPriceForm, name: e.target.value})}
                        className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        Prix (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newPriceForm.priceEur}
                        onChange={(e) => setNewPriceForm({...newPriceForm, priceEur: e.target.value})}
                        className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        Durée (minutes) - Optionnel
                      </label>
                      <input
                        type="number"
                        value={newPriceForm.durationMin}
                        onChange={(e) => setNewPriceForm({...newPriceForm, durationMin: e.target.value})}
                        className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        Note - Optionnel
                      </label>
                      <input
                        type="text"
                        value={newPriceForm.note}
                        onChange={(e) => setNewPriceForm({...newPriceForm, note: e.target.value})}
                        className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newPriceForm.isActive}
                        onChange={(e) => setNewPriceForm({...newPriceForm, isActive: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <label className="text-sm font-medium text-[#4A4A4A]">
                        Actif
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleAddPrice}
                        className="flex-1 btn-gold"
                      >
                        Ajouter
                      </button>
                      <button
                        onClick={() => {
                          setShowAddPriceModal(false);
                          setNewPriceForm({ category: '', name: '', priceEur: '', durationMin: '', note: '', isActive: true });
                        }}
                        className="flex-1 px-4 py-2 border border-[#E8DCCA] rounded-lg text-[#4A4A4A] hover:bg-[#F9F7F2]"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prices Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F9F7F2] border-b border-[#E8DCCA]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Catégorie</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Nom</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Prix (€)</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Durée (min)</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Note</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Actif</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Ordre</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrices.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F9F7F2]/30'}>
                        {editingId === item.id ? (
                          <>
                            <td className="px-4 py-3"><input type="text" value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})} className="w-full px-2 py-1 border border-[#E8DCCA] rounded text-sm" /></td>
                            <td className="px-4 py-3"><input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full px-2 py-1 border border-[#E8DCCA] rounded text-sm" /></td>
                            <td className="px-4 py-3"><input type="number" step="0.01" value={editForm.priceEur || ''} onChange={(e) => setEditForm({...editForm, priceEur: parseFloat(e.target.value) || null})} className="w-20 px-2 py-1 border border-[#E8DCCA] rounded text-sm" /></td>
                            <td className="px-4 py-3"><input type="number" value={editForm.durationMin || ''} onChange={(e) => setEditForm({...editForm, durationMin: parseInt(e.target.value) || null})} className="w-20 px-2 py-1 border border-[#E8DCCA] rounded text-sm" /></td>
                            <td className="px-4 py-3"><input type="text" value={editForm.note || ''} onChange={(e) => setEditForm({...editForm, note: e.target.value || null})} className="w-full px-2 py-1 border border-[#E8DCCA] rounded text-sm" /></td>
                            <td className="px-4 py-3"><input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})} className="w-4 h-4" /></td>
                            <td className="px-4 py-3"><input type="number" value={editForm.sortOrder} onChange={(e) => setEditForm({...editForm, sortOrder: parseInt(e.target.value)})} className="w-16 px-2 py-1 border border-[#E8DCCA] rounded text-sm" /></td>
                            <td className="px-4 py-3"><div className="flex gap-2"><button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 text-sm"><FontAwesomeIcon icon={faCheck} /></button><button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800 text-sm"><FontAwesomeIcon icon={faXmark} /></button></div></td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-sm text-[#4A4A4A]">{item.category}</td>
                            <td className="px-4 py-3 text-sm text-[#1A1A1A] font-medium">{item.name}</td>
                            <td className="px-4 py-3 text-sm text-[#4A4A4A]">{item.priceEur || '-'}</td>
                            <td className="px-4 py-3 text-sm text-[#4A4A4A]">{item.durationMin || '-'}</td>
                            <td className="px-4 py-3 text-sm text-[#4A4A4A]">{item.note || '-'}</td>
                            <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.isActive ? 'Oui' : 'Non'}</span></td>
                            <td className="px-4 py-3 text-sm text-[#4A4A4A]">{item.sortOrder}</td>
                            <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleEdit(item)} className="text-[#D4AF37] hover:text-[#C5A028] text-sm font-medium">Modifier</button><button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Supprimer</button></div></td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-6 text-center text-sm text-[#808080]">{filteredPrices.length} tarif(s) affiché(s)</div>
          </div>
        )}

        {/* TAB: GIFT CARDS */}
        {activeTab === 'gift-cards' && (
          <div>
            <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'pending', label: 'En attente' },
                  { key: 'active', label: 'Actif' },
                  { key: 'redeemed', label: 'Utilisé' },
                  { key: 'expired', label: 'Expiré' },
                  { key: 'canceled', label: 'Annulé' },
                  { key: 'failed', label: 'Échec' }
                ].map(filter => (
                  <label key={filter.key} className="flex items-center gap-2 text-sm text-[#4A4A4A]">
                    <input
                      type="checkbox"
                      checked={giftCardStatusFilters[filter.key]}
                      onChange={(e) => setGiftCardStatusFilters({
                        ...giftCardStatusFilters,
                        [filter.key]: e.target.checked
                      })}
                      className="w-4 h-4"
                    />
                    {filter.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F9F7F2] border-b border-[#E8DCCA]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Montant (€)</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Statut</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Fin de validité</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Retour</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Acheteur</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Bénéficiaire</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Date création</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGiftCards.map((card, index) => (
                      <tr key={card.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F9F7F2]/30'}>
                        <td className="px-4 py-3 text-sm font-mono text-[#D4AF37]">{card.code || 'En attente'}</td>
                        <td className="px-4 py-3 text-sm text-[#4A4A4A]">{card.amountEur}€</td>
                        <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs ${card.status === 'active' ? 'bg-green-100 text-green-800' : card.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : card.status === 'redeemed' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{translateStatus(card.status)}</span></td>
                        <td className="px-4 py-3 text-sm text-[#4A4A4A]">{card.expiresAt ? new Date(card.expiresAt).toLocaleDateString('fr-FR') : '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${card.status === 'redeemed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                            {card.status === 'redeemed' ? 'Oui' : 'Non'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#4A4A4A]">{card.buyer_firstname} {card.buyer_lastname}</td>
                        <td className="px-4 py-3 text-sm text-[#4A4A4A]">{card.buyer_email}</td>
                        <td className="px-4 py-3 text-sm text-[#4A4A4A]">{card.recipient_name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-[#4A4A4A]">{new Date(card.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewGiftCard(card)}
                              className="text-[#D4AF37] hover:text-[#C5A028] text-sm font-medium"
                              title="Voir détails"
                            >
                              <FontAwesomeIcon icon={faInfoCircle} />
                            </button>
                            {card.status === 'pending' && (
                              <button
                                onClick={() => handleDeleteGiftCard(card.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                title="Supprimer"
                              >
                                <FontAwesomeIcon icon={faXmark} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-6 text-center text-sm text-[#808080]">{filteredGiftCards.length} carte(s) cadeau</div>

            {/* Gift Card Details Modal */}
            {showGiftCardModal && selectedGiftCard && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-6 my-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#1A1A1A]">
                      Détails de la carte cadeau
                    </h2>
                    <button
                      onClick={() => setShowGiftCardModal(false)}
                      className="text-[#808080] hover:text-[#1A1A1A]"
                    >
                      <FontAwesomeIcon icon={faXmark} size="lg" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Statut et code */}
                    <div className="bg-[#F9F7F2] p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-[#808080] mb-1">Statut</p>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            selectedGiftCard.status === 'active' ? 'bg-green-100 text-green-800' :
                            selectedGiftCard.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            selectedGiftCard.status === 'redeemed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {translateStatus(selectedGiftCard.status)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-[#808080] mb-1">Code</p>
                          <p className="text-lg font-mono font-bold text-[#D4AF37]">
                            {selectedGiftCard.code || 'Non généré'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[#808080] mb-1">Montant</p>
                          <p className="text-lg font-bold text-[#1A1A1A]">
                            {selectedGiftCard.amountEur} €
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[#808080] mb-1">Date de création</p>
                          <p className="text-sm text-[#4A4A4A]">
                            {new Date(selectedGiftCard.createdAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Informations acheteur */}
                    <div className="border-t border-[#E8DCCA] pt-4">
                      <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3">
                        Informations acheteur
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-[#808080]">Nom</p>
                          <p className="text-sm text-[#1A1A1A] font-medium">
                            {selectedGiftCard.buyer_firstname} {selectedGiftCard.buyer_lastname}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[#808080]">Email</p>
                          <p className="text-sm text-[#1A1A1A]">{selectedGiftCard.buyer_email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-[#808080]">Téléphone</p>
                          <p className="text-sm text-[#1A1A1A]">{selectedGiftCard.buyer_phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bénéficiaire et message */}
                    <div className="border-t border-[#E8DCCA] pt-4">
                      <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3">
                        Bénéficiaire
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-[#808080] mb-2">Nom du bénéficiaire</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newRecipientName}
                              onChange={(e) => setNewRecipientName(e.target.value)}
                              placeholder="Nom du bénéficiaire"
                              className="flex-1 px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                            />
                            <button
                              onClick={() => handleUpdateRecipient(selectedGiftCard.id)}
                              className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] text-sm font-medium"
                            >
                              <FontAwesomeIcon icon={faUserEdit} className="mr-2" />
                              Modifier
                            </button>
                          </div>
                        </div>
                        {selectedGiftCard.personal_message && (
                          <div>
                            <p className="text-sm text-[#808080] mb-2">Message personnel</p>
                            <p className="text-sm text-[#4A4A4A] bg-[#F9F7F2] p-3 rounded-lg italic">
                              "{selectedGiftCard.personal_message}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Validité */}
                    <div className="border-t border-[#E8DCCA] pt-4">
                      <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3">
                        Validité
                      </h3>
                      <div>
                        <p className="text-sm text-[#808080] mb-2">
                          Date d'expiration actuelle: {selectedGiftCard.expiresAt ? 
                            new Date(selectedGiftCard.expiresAt).toLocaleDateString('fr-FR') : 
                            'Non définie'
                          }
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={extendExpiryDate}
                            onChange={(e) => setExtendExpiryDate(e.target.value)}
                            className="flex-1 px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                          />
                          <button
                            onClick={() => handleExtendExpiry(selectedGiftCard.id)}
                            className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] text-sm font-medium"
                          >
                            <FontAwesomeIcon icon={faCalendarPlus} className="mr-2" />
                            Prolonger
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-[#E8DCCA] pt-4">
                      <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3">
                        Actions
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedGiftCard.status === 'pending' && (
                          <button
                            onClick={() => handleActivateGiftCard(selectedGiftCard.id)}
                            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                          >
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                            Valider et générer code
                          </button>
                        )}
                        {selectedGiftCard.code && (
                          <>
                            <button
                              onClick={() => handleGeneratePDF(selectedGiftCard)}
                              className="px-4 py-3 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C5A028] font-medium text-sm"
                            >
                              <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
                              Générer PDF
                            </button>
                            <button
                              onClick={() => handleSendEmail(selectedGiftCard)}
                              disabled={sendingEmail}
                              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
                            >
                              <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                              {sendingEmail ? 'Envoi...' : 'Envoyer par email'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Informations techniques */}
                    {selectedGiftCard.stripeSessionId && (
                      <div className="border-t border-[#E8DCCA] pt-4">
                        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3">
                          Informations techniques
                        </h3>
                        <div className="text-xs text-[#808080] space-y-1">
                          <p>ID: {selectedGiftCard.id}</p>
                          {selectedGiftCard.stripeSessionId && (
                            <p>Stripe Session: {selectedGiftCard.stripeSessionId}</p>
                          )}
                          {selectedGiftCard.stripePaymentIntentId && (
                            <p>Payment Intent: {selectedGiftCard.stripePaymentIntentId}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowGiftCardModal(false)}
                      className="px-6 py-2 border border-[#E8DCCA] rounded-lg text-[#4A4A4A] hover:bg-[#F9F7F2]"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: COUPONS */}
        {activeTab === 'coupons' && (
          <div>
            <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
              <button onClick={() => setShowAddCouponModal(true)} className="btn-gold w-full md:w-auto">
                + Ajouter un coupon
              </button>
            </div>

            {/* Add Coupon Modal */}
            {showAddCouponModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
                  <h2 className="text-2xl font-bold mb-6 text-[#1A1A1A]">Ajouter un coupon</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Code</label>
                      <input type="text" value={newCouponForm.code} onChange={(e) => setNewCouponForm({...newCouponForm, code: e.target.value.toUpperCase()})} placeholder="Ex: NOEL20" className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Type</label>
                      <select value={newCouponForm.type} onChange={(e) => setNewCouponForm({...newCouponForm, type: e.target.value})} className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
                        <option value="percentage">Pourcentage (%)</option>
                        <option value="fixed">Montant fixe (€)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Valeur {newCouponForm.type === 'percentage' ? '(%)' : '(€)'}</label>
                      <input type="number" step={newCouponForm.type === 'percentage' ? '1' : '0.01'} value={newCouponForm.value} onChange={(e) => setNewCouponForm({...newCouponForm, value: e.target.value})} className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Date d'expiration</label>
                      <input type="datetime-local" value={newCouponForm.validTo} onChange={(e) => setNewCouponForm({...newCouponForm, validTo: e.target.value})} className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Nombre d'utilisations max - Optionnel</label>
                      <input type="number" value={newCouponForm.maxUses} onChange={(e) => setNewCouponForm({...newCouponForm, maxUses: e.target.value})} className="w-full px-3 py-2 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                    </div>

                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={newCouponForm.isActive} onChange={(e) => setNewCouponForm({...newCouponForm, isActive: e.target.checked})} className="w-4 h-4" />
                      <label className="text-sm font-medium text-[#4A4A4A]">Actif</label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button onClick={handleAddCoupon} className="flex-1 btn-gold">Créer</button>
                      <button onClick={() => { setShowAddCouponModal(false); setNewCouponForm({code: '', type: 'percentage', value: '', validTo: '', isActive: true, maxUses: ''}); }} className="flex-1 px-4 py-2 border border-[#E8DCCA] rounded-lg text-[#4A4A4A] hover:bg-[#F9F7F2]">Annuler</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Coupons Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F9F7F2] border-b border-[#E8DCCA]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Valeur</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Valide jusqu'au</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Utilisations</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Statut</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon, index) => (
                      <tr key={coupon.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F9F7F2]/30'}>
                        {editingCouponId === coupon.id ? (
                          <>
                            <td className="px-4 py-3"><input type="text" value={editCouponForm.code} onChange={(e) => setEditCouponForm({...editCouponForm, code: e.target.value.toUpperCase()})} className="w-full px-2 py-1 border border-[#E8DCCA] rounded text-sm" /></td>
                            <td className="px-4 py-3"><select value={editCouponForm.type} onChange={(e) => setEditCouponForm({...editCouponForm, type: e.target.value})} className="px-2 py-1 border border-[#E8DCCA] rounded text-sm"><option value="percentage">%</option><option value="fixed">€</option></select></td>
                            <td className="px-4 py-3"><input type="number" step="0.01" value={editCouponForm.value} onChange={(e) => setEditCouponForm({...editCouponForm, value: parseFloat(e.target.value)})} className="w-20 px-2 py-1 border border-[#E8DCCA] rounded text-sm" /></td>
                            <td className="px-4 py-3"><input type="date" value={editCouponForm.validTo?.split('T')[0] || ''} onChange={(e) => setEditCouponForm({...editCouponForm, validTo: e.target.value})} className="px-2 py-1 border border-[#E8DCCA] rounded text-sm" /></td>
                            <td className="px-4 py-3 text-sm text-[#4A4A4A]">{editCouponForm.currentUses}/{editCouponForm.maxUses || '∞'}</td>
                            <td className="px-4 py-3"><input type="checkbox" checked={editCouponForm.isActive} onChange={(e) => setEditCouponForm({...editCouponForm, isActive: e.target.checked})} className="w-4 h-4" /></td>
                            <td className="px-4 py-3"><div className="flex gap-2"><button onClick={handleSaveCouponEdit} className="text-green-600 hover:text-green-800 text-sm"><FontAwesomeIcon icon={faCheck} /></button><button onClick={() => setEditingCouponId(null)} className="text-red-600 hover:text-red-800 text-sm"><FontAwesomeIcon icon={faXmark} /></button></div></td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-sm font-mono font-bold text-[#D4AF37]">{coupon.code}</td>
                            <td className="px-4 py-3 text-sm text-[#4A4A4A]">{coupon.type === 'percentage' ? 'Pourcentage' : 'Montant fixe'}</td>
                            <td className="px-4 py-3 text-sm text-[#4A4A4A]">{coupon.value}{coupon.type === 'percentage' ? '%' : '€'}</td>
                            <td className="px-4 py-3 text-sm text-[#4A4A4A]">{new Date(coupon.validTo).toLocaleDateString('fr-FR')}</td>
                            <td className="px-4 py-3 text-sm text-[#4A4A4A]">{coupon.currentUses}/{coupon.maxUses || '∞'}</td>
                            <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{coupon.isActive ? 'Actif' : 'Inactif'}</span></td>
                            <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleEditCoupon(coupon)} className="text-[#D4AF37] hover:text-[#C5A028] text-sm font-medium">Modifier</button><button onClick={() => handleDeleteCoupon(coupon.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Supprimer</button></div></td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-6 text-center text-sm text-[#808080]">{coupons.length} coupon(s)</div>
          </div>
        )}
      </div>
    </div>
  );
}
