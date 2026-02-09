import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import api from '../lib/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

const axios = api;

export default function PricingModal({ open, onClose, initialCategories = null }) {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categoryScope, setCategoryScope] = useState(null);
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (open) {
      fetchPrices();
      setCategoryScope(Array.isArray(initialCategories) && initialCategories.length > 0 ? initialCategories : null);
      setSelectedCategory(
        Array.isArray(initialCategories) && initialCategories.length > 0 ? 'all' : 'all'
      );
    }
  }, [open, initialCategories]);

  useEffect(() => {
    if (!open) return;

    // Bloquer le scroll du body complètement
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Empêcher TOUS les événements wheel sauf s'ils sont sur le contenu de la modale
    const preventScroll = (event) => {
      if (!contentRef.current) {
        event.preventDefault();
        return;
      }

      // Vérifier si l'événement vient du contenu scrollable de la modale
      const isInModalContent = contentRef.current.contains(event.target);
      
      if (!isInModalContent) {
        event.preventDefault();
        return;
      }

      // Si on est dans le contenu modal, on laisse le scroll se faire naturellement
      // mais on s'assure qu'il ne déborde pas sur l'arrière-plan
    };

    window.addEventListener('wheel', preventScroll, { passive: false });

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.removeEventListener('wheel', preventScroll);
    };
  }, [open]);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/prices');
      setPrices(response.data);
    } catch (error) {
      console.error('Error fetching prices:', error);
      setError('Impossible de récupérer les tarifs. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const availableCategories = categoryScope
    ? prices.filter((p) => categoryScope.includes(p.category)).map((p) => p.category)
    : prices.map((p) => p.category);
  const categories = ['all', ...new Set(availableCategories)];

  const filteredPrices = prices.filter(item => {
    const matchCategory = selectedCategory === 'all'
      ? (categoryScope ? categoryScope.includes(item.category) : true)
      : item.category === selectedCategory;
    const matchSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const groupedPrices = filteredPrices.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        ref={modalRef}
        className="w-[96vw] sm:w-[92vw] md:w-[90vw] lg:w-[900px] max-w-[900px] h-[92vh] sm:h-[85vh] max-h-[92vh] flex flex-col p-0 overflow-hidden"
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white z-10 border-b border-[#E8DCCA] p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-[#1A1A1A]">Nos tarifs</h2>
            <button
              onClick={onClose}
              data-testid="close-pricing-modal"
              className="p-2 hover:bg-[#F9F7F2] rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#808080]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher une prestation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="pricing-search"
                className="w-full pl-10 pr-4 py-3 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              data-testid="pricing-category-filter"
              className="px-4 py-3 border border-[#E8DCCA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'Toutes les catégories' : cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 overscroll-contain touch-pan-y">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37] border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-[#D4AF37] font-semibold">{error}</p>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {Object.entries(groupedPrices).map(([category, items], index) => (
                <AccordionItem
                  key={category}
                  value={category}
                  className="glass-card rounded-xl overflow-hidden border border-[#E8DCCA]"
                  data-testid={`category-${index}`}
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-[#F9F7F2] transition-colors">
                    <div className="flex justify-between items-center w-full pr-4">
                      <span className="text-lg font-bold text-[#1A1A1A]">{category}</span>
                      <span className="text-sm text-[#808080]">{items.length} prestation{items.length > 1 ? 's' : ''}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-4 space-y-3">
                      {items.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex justify-between items-start py-3 border-b border-[#E8DCCA] last:border-0"
                          data-testid={`price-item-${item.id}`}
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#1A1A1A] mb-1">{item.name}</h4>
                            {item.note && (
                              <p className="text-sm text-[#808080] italic">{item.note}</p>
                            )}
                            {item.durationMin && (
                              <p className="text-sm text-[#D4AF37] mt-1">{item.durationMin} minutes</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            {item.priceEur !== null ? (
                              <span className="text-xl font-bold text-[#D4AF37]">{item.priceEur} €</span>
                            ) : (
                              <span className="text-sm text-[#808080]">Sur demande</span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {!loading && Object.keys(groupedPrices).length === 0 && (
            <div className="text-center py-20">
              <svg className="w-16 h-16 text-[#E8DCCA] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[#808080]">Aucune prestation trouvée</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F9F7F2] border-t border-[#E8DCCA] p-4 sm:p-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <p className="text-sm text-[#808080]">
              Pour toute information complémentaire, n'hésitez pas à nous contacter
            </p>
            <a
              href="tel:0233214819"
              data-testid="pricing-call-btn"
              className="btn-gold whitespace-nowrap"
            >
              Appeler : 02 33 21 48 19
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
