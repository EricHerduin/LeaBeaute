import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { MoonStar, SunMedium, UtensilsCrossed } from 'lucide-react';
import api from '../lib/apiClient';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PricingModal from '../components/PricingModal';
import nutritionImage from '../assets/photos/prestations/chrononutrition_4.jpg' 

export default function CoachingPage() {
  const [showPricing, setShowPricing] = useState(false);
  const [nutritionPrices, setNutritionPrices] = useState([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [pricesError, setPricesError] = useState(null);
  const rhythmCards = [
    {
      title: 'Le matin',
      description: 'Petit-déjeuner riche en protéines et féculents pour démarrer la journée avec énergie.',
      icon: SunMedium,
      palette: {
        card: 'border-[#E7D8C6] bg-[#FFFCF8]',
        title: 'text-[#2E2118]',
        text: 'text-[#5B4736]',
        shell: 'from-[#FBF4EA] via-[#F2E1C6] to-[#DEC09A]',
        iconWrap: 'bg-[#FFF9F1] border-[#D4BB97] text-[#7A5832]',
      },
      scene: 'morning',
    },
    {
      title: 'À midi',
      description: 'Repas équilibré avec protéines, féculents et légumes pour soutenir vos activités.',
      icon: UtensilsCrossed,
      palette: {
        card: 'border-[#E6DACE] bg-[#FFFDFB]',
        title: 'text-[#30251E]',
        text: 'text-[#5D4C40]',
        shell: 'from-[#F7F2EC] via-[#E8DDD1] to-[#D8C7B6]',
        iconWrap: 'bg-[#FFFCF8] border-[#CDBEAF] text-[#564335]',
      },
      scene: 'midday',
    },
    {
      title: 'Le soir',
      description: 'Repas léger à base de protéines et légumes pour favoriser une bonne récupération.',
      icon: MoonStar,
      palette: {
        card: 'border-[#48424F] bg-[#2A2831]',
        title: 'text-[#F7EFE4]',
        text: 'text-[#E7D9C6]',
        shell: 'from-[#2C2B33] via-[#3A3847] to-[#565161]',
        iconWrap: 'bg-[rgba(255,250,244,0.1)] border-[rgba(255,247,236,0.16)] text-[#F4E7D4]',
      },
      dark: true,
      scene: 'evening',
    },
  ];

  const renderRhythmScene = (scene) => {
    if (scene === 'morning') {
      return (
        <div className="relative h-60 overflow-hidden bg-gradient-to-br from-[#FBF4EA] via-[#F2E1C6] to-[#DEC09A]">
          <div className="absolute -right-10 top-10 h-32 w-32 rounded-full border border-white/30" />
          <div className="absolute -left-8 bottom-6 h-24 w-24 rounded-full border border-white/25" />
          <div className="absolute inset-x-7 top-8 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.75),transparent)]" />
          <div className="absolute bottom-8 left-7 flex h-16 w-16 items-center justify-center rounded-full border border-[#D4BB97] bg-[#FFF9F1] text-[#7A5832] shadow-[0_10px_24px_rgba(122,88,50,0.12)]">
            <SunMedium className="h-7 w-7" strokeWidth={1.6} />
          </div>
        </div>
      );
    }

    if (scene === 'midday') {
      return (
        <div className="relative h-60 overflow-hidden bg-gradient-to-br from-[#F7F2EC] via-[#E8DDD1] to-[#D8C7B6]">
          <div className="absolute right-8 top-8 h-24 w-24 rounded-full border border-white/25" />
          <div className="absolute left-10 bottom-10 h-px w-28 bg-[linear-gradient(90deg,rgba(255,255,255,0.85),transparent)]" />
          <div className="absolute bottom-8 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border border-[#CDBEAF] bg-[#FFFCF8] text-[#564335] shadow-[0_10px_24px_rgba(86,67,53,0.1)]">
            <UtensilsCrossed className="h-7 w-7" strokeWidth={1.6} />
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-60 overflow-hidden bg-gradient-to-br from-[#2C2B33] via-[#3A3847] to-[#565161]">
        <div className="absolute right-10 top-10 h-28 w-28 rounded-full border border-white/10" />
        <div className="absolute left-8 top-12 h-px w-24 bg-[linear-gradient(90deg,rgba(255,255,255,0.5),transparent)]" />
        {[...Array(6)].map((_, index) => (
          <div
            key={`evening-star-${index}`}
            className="absolute h-1.5 w-1.5 rounded-full bg-[#FFF3D9]"
            style={{
              left: `${18 + index * 11}%`,
              top: `${18 + (index % 3) * 12}%`,
              opacity: 0.65,
            }}
          />
        ))}
        <div className="absolute bottom-8 left-7 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(255,247,236,0.16)] bg-[rgba(255,250,244,0.1)] text-[#F4E7D4] shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
          <MoonStar className="h-7 w-7" strokeWidth={1.6} />
        </div>
      </div>
    );
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchNutritionPrices() {
      try {
        setPricesLoading(true);
        setPricesError(null);
        const response = await api.get('/prices');
        const filteredPrices = (response.data || []).filter(
          (item) => String(item.category || '').trim().toLowerCase() === 'accompagnement nutrition'
        );

        if (isMounted) {
          setNutritionPrices(filteredPrices);
        }
      } catch (error) {
        if (isMounted) {
          setPricesError('Impossible de charger les tarifs pour le moment.');
        }
      } finally {
        if (isMounted) {
          setPricesLoading(false);
        }
      }
    }

    fetchNutritionPrices();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation onShowPricing={() => setShowPricing(true)} />
      
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F9F7F2] to-white"></div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-[#1A1A1A]">
                Accompagnement en <span className="gold-gradient-text italic">Chrononutrition</span>
              </h1>
              <p className="text-lg md:text-xl text-[#4A4A4A] mb-8 leading-relaxed">
                Un accompagnement personnalisé pour manger au bon moment et retrouver votre équilibre naturel.
              </p>
              <a
                href="tel:0233214819"
                data-testid="coaching-call-btn"
                className="btn-primary inline-flex items-center justify-center"
              >
                Prendre Rendez-vous
              </a>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="rounded-2xl overflow-hidden shadow-lg"
            >
              <img 
                src={nutritionImage} 
                alt="Accompagnement Chrononutrition" 
                className="w-full h-96 object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* What is it */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#1A1A1A]">
              Qu'est-ce que la <span className="gold-gradient-text">chrononutrition</span> ?
            </h2>
            <p className="text-lg text-[#4A4A4A] leading-relaxed max-w-3xl mx-auto">
              La chrononutrition est une approche holistique de l'alimentation qui consiste à manger certains aliments à des moments spécifiques de la journée,
              en accord avec votre rythme biologique naturel (chronobiologie). L'objectif est de retrouver un équilibre alimentaire durable et améliorer votre santé globale.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {rhythmCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className={`overflow-hidden rounded-[30px] border shadow-[0_22px_44px_rgba(78,60,42,0.08)] ${card.palette.card}`}
              >
                  {renderRhythmScene(card.scene)}
                <div className="p-8 text-left">
                  <h3 className={`mb-3 text-[1.6rem] font-bold ${card.palette.title}`}>{card.title}</h3>
                  <p className={`text-sm leading-7 ${card.palette.text}`}>{card.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-card p-8 rounded-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 text-[#1A1A1A]">Pour qui ?</h3>
              <ul className="space-y-3">
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Personnes souhaitant rééquilibrer leur alimentation
                </li>
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Celles et ceux recherchant plus d'énergie et de vitalité
                </li>
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Envie de mieux comprendre son corps et ses besoins
                </li>
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Personnes désirant créer des habitudes alimentaires saines
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-card p-8 rounded-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 text-[#1A1A1A]">Les avantages</h3>
              <ul className="space-y-3">
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Amélioration de l'énergie et de la vitalité
                </li>
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Meilleure qualité de sommeil et récupération
                </li>
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Meilleure digestion et confort digestif
                </li>
                <li className="flex items-start text-[#4A4A4A]">
                  <svg className="w-6 h-6 text-[#D4AF37] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Diminution des fringales et mieux-être général
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Important Note */}
      <section className="py-20 bg-[#F9F7F2]">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl border-l-4 border-[#D4AF37]"
            >
              <h3 className="text-2xl font-bold mb-4 text-[#1A1A1A]">Comment ça fonctionne ?</h3>
              <ol className="space-y-4 text-[#4A4A4A]">
                <li className="flex">
                  <span className="font-bold text-[#D4AF37] mr-4">1.</span>
                  <span>Bilan nutritionnel et analyse de vos habitudes alimentaires</span>
                </li>
                <li className="flex">
                  <span className="font-bold text-[#D4AF37] mr-4">2.</span>
                  <span>Élaboration d'un plan nutritionnel personnalisé adapté à votre rythme</span>
                </li>
                <li className="flex">
                  <span className="font-bold text-[#D4AF37] mr-4">3.</span>
                  <span>Suivi régulier et ajustements en fonction de vos retours</span>
                </li>
                <li className="flex">
                  <span className="font-bold text-[#D4AF37] mr-4">4.</span>
                  <span>Conseils pratiques et recettes adaptées à vos préférences</span>
                </li>
              </ol>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl border-l-4 border-[#D4AF37]"
            >
              <h3 className="text-2xl font-bold mb-4 text-[#1A1A1A]">Note importante</h3>
              <p className="text-[#4A4A4A] leading-relaxed mb-4">
                Cet accompagnement en chrononutrition est un service nutritionnel et ne constitue pas un traitement médical.
              </p>
              <p className="text-[#4A4A4A] leading-relaxed">
                Aucune promesse de perte de poids garantie n'est formulée. L'objectif est de vous aider à retrouver un équilibre alimentaire durable, 
                adapté à votre rythme de vie et à vos besoins biologiques.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-[28px] border border-[#E5D8C6] bg-white p-8 shadow-[0_16px_35px_rgba(92,70,49,0.08)] md:col-span-2"
            >
              <div className="mb-4 inline-flex rounded-full border border-[#E1D1BC] bg-[#F9F5EE] px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8E6C42]">
                Tarifs
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1.85fr] gap-8 items-start">
                <div>
                  <h3 className="text-3xl font-bold mb-4 text-[#1A1A1A]">Les tarifs de l'accompagnement nutrition</h3>
                  <p className="text-[#4A4A4A] text-lg leading-relaxed">
                    Découvrez les formules proposées pour avancer à votre rythme, avec un accompagnement personnalisé
                    pensé pour s'intégrer durablement à votre quotidien.
                  </p>
                </div>

                {pricesLoading ? (
                  <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-[#E8DCCA] bg-[#FCFAF7]">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D4AF37] border-t-transparent" />
                  </div>
                ) : pricesError ? (
                  <div className="rounded-[24px] border border-[#E8DCCA] bg-[#FCFAF7] p-8 text-center text-[#8A6A46]">
                    {pricesError}
                  </div>
                ) : nutritionPrices.length === 0 ? (
                  <div className="rounded-[24px] border border-[#E8DCCA] bg-[#FCFAF7] p-8 text-center text-[#8A6A46]">
                    Aucun tarif n'est disponible actuellement pour cette catégorie.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nutritionPrices.map((item, index) => (
                      <motion.div
                        key={item.id || `${item.name}-${index}`}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, delay: index * 0.05 }}
                        className="rounded-[24px] border border-[#E6D9C8] bg-[linear-gradient(180deg,#FFFDF9_0%,#F7F1E8_100%)] p-6 shadow-[0_14px_28px_rgba(92,70,49,0.08)]"
                      >
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-xl font-semibold text-[#1A1A1A]">{item.name}</h4>
                            {item.durationMin ? (
                              <p className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-[#9A7747]">
                                {item.durationMin} minutes
                              </p>
                            ) : null}
                          </div>
                          <div className="rounded-full border border-[#DEC9AA] bg-[#FFF8EE] px-4 py-2 text-lg font-bold text-[#8F6A3F] whitespace-nowrap">
                            {item.priceEur !== null ? `${item.priceEur} €` : 'Sur demande'}
                          </div>
                        </div>
                        {item.note ? (
                          <p className="text-sm leading-6 text-[#5B4A3B]">{item.note}</p>
                        ) : (
                          <p className="text-sm leading-6 text-[#5B4A3B]">
                            Accompagnement personnalisé ajusté à votre rythme biologique et à vos objectifs.
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="md:col-span-2"
            >
              <div className="bg-gradient-to-r from-[#D4AF37] to-[#E8C158] p-8 rounded-[28px] text-white text-center shadow-[0_18px_38px_rgba(173,133,43,0.25)]">
                <h3 className="text-2xl font-bold mb-4">Durée recommandée</h3>
                <p className="text-lg leading-relaxed">
                  Un accompagnement minimum de 3 mois est recommandé pour observer les résultats et mettre en place durablement les nouvelles habitudes alimentaires.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#1A1A1A]">
              Intéressé(e) par un accompagnement nutrition ?
            </h2>
            <p className="text-lg text-[#4A4A4A] mb-8 leading-relaxed">
              Contactez-nous par téléphone pour discuter de vos objectifs et définir un accompagnement adapté.
            </p>
            <a
              href="tel:0233214819"
              data-testid="coaching-footer-call-btn"
              className="btn-gold inline-flex items-center justify-center"
            >
              Appeler : 02 33 21 48 19
            </a>
          </motion.div>
        </div>
      </section>

      <Footer onShowPricing={() => setShowPricing(true)} />
      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} />
    </div>
  );
}
