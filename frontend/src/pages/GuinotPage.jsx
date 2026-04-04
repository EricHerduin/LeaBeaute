
import { useState } from 'react';
import { motion } from 'framer-motion';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PricingModal from '../components/PricingModal';
import { Dialog, DialogContent } from '../components/ui/dialog';
import hydradermieImage from '../assets/photos/prestations/hydradermie1000_1.jpg'
import hydradermieLiftImage from '../assets/photos/prestations/soin-hydradermie-lift.jpg'
import ageSummumImage from '../assets/photos/prestations/soin-age-summum_1.jpg'
import hydrapeelingImage from '../assets/photos/prestations/soin-hydra-peeling_1.jpg'
import detoxygeneImage from '../assets/photos/prestations/soin-detoxygene_1.jpg'
import cabineImage from '../assets/photos/prestations/cabine.png'
import cabine1Image from '../assets/photos/prestations/cabine_1.webp'
import soinGuinotImage from '../assets/photos/prestations/soin-guinot.jpg'

const visibleAgeReverseGallery = Object.entries(
  import.meta.glob('../assets/photos/guinot-visible-age-reverse/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}', {
    eager: true,
    import: 'default',
  })
)
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, 'fr'))
  .map(([path, src], index) => ({
    src,
    alt: `Résultat Visible Age Reverse ${index + 1}`,
    key: path,
  }));

export default function GuinotPage() {
  const [showPricing, setShowPricing] = useState(false);
  const [pricingInitialCategories, setPricingInitialCategories] = useState(null);
  const [pricingInitialSearchTerm, setPricingInitialSearchTerm] = useState('');
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);

  const openAllPricing = () => {
    setPricingInitialCategories(null);
    setPricingInitialSearchTerm('');
    setShowPricing(true);
  };

  const openVisibleAgeReversePricing = () => {
    setPricingInitialCategories(null);
    setPricingInitialSearchTerm('Visible Age Reverse');
    setShowPricing(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation onShowPricing={openAllPricing} forceLight />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <p className="uppercase tracking-widest text-xs text-[#1A1A1A]/70 mb-2">Institut Léa Beauté • Soins Visage</p>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-[#1A1A1A]">Soins <span className="gold-gradient-text italic">Guinot</span></h1>
            <p className="text-lg md:text-xl text-[#4A4A4A] mb-8 leading-relaxed max-w-2xl">
              Des soins en institut, pensés pour répondre à des objectifs beauté précis : éclat, confort, anti-âge, fermeté, regard.
            </p>
            <div className="h-px bg-black/10 my-6 w-32 md:w-48"></div>
            <p className="text-base text-[#4A4A4A]/80 max-w-xl">
              L'avantage de l'institut : le choix ne se fait pas "à l'aveugle". Le soin est orienté en cabine, selon l'objectif beauté et l'état de peau du moment, pour une expérience plus juste, plus agréable, et plus sereine.
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 mt-10">
              <a href="tel:0233214819" className="btn-primary inline-flex items-center justify-center">Prendre Rendez-vous</a>
              <a
                href="#visible-age-reverse"
                className="btn-secondary inline-flex items-center justify-center"
              >
                Découvrir Visible Age Reverse
              </a>
              <button onClick={openAllPricing} className="btn-secondary">Voir les tarifs</button>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img src={soinGuinotImage} alt="Soin visage en institut" className="w-full h-auto object-cover" />
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-20 bg-[#F9F7F2]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid gap-10 md:grid-cols-2 items-center">
          <div className="rounded-2xl overflow-hidden shadow-lg order-2 md:order-1">
            <img src={cabine1Image} alt="Gestuelle de soin visage" className="w-full h-auto object-cover" />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#1A1A1A]">L'expertise institut, le confort en plus</h2>
            <p className="text-base md:text-lg text-[#4A4A4A] mb-6 leading-relaxed">
              Un soin visage, c'est une méthode, des gestes précis, et un protocole choisi pour une intention beauté claire. En institut, l'expérience est plus complète : le temps est consacré au soin, au bien-être, et à l'attention portée aux détails.
            </p>
            <div className="h-px bg-black/10 my-6 w-32 md:w-48"></div>
            <p className="text-base text-[#4A4A4A]/80 max-w-xl">
              Le conseil en cabine permet de clarifier l'objectif (éclat, grain de peau, fermeté, regard…), d'orienter le protocole et de repartir avec des repères simples pour prolonger le confort au quotidien.
            </p>
          </div>
        </div>
      </section>

      {/* Objectifs beauté */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#1A1A1A]">Choisir selon l'objectif beauté</h2>
          <p className="text-base md:text-lg text-[#4A4A4A] mb-8 max-w-2xl">Une peau peut changer avec la saison, le rythme de vie ou la fatigue. L'intérêt de l'institut est de bénéficier d'une orientation claire, au bon moment, plutôt que d'accumuler des essais.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div className="bg-[#F9F7F2] rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Éclat</h3>
              <p className="text-[#4A4A4A]">Pour retrouver un teint plus lumineux et une sensation de fraîcheur.</p>
            </div>
            <div className="bg-[#F9F7F2] rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Peau plus lisse</h3>
              <p className="text-[#4A4A4A]">Quand le grain de peau et l'uniformité visuelle sont la priorité.</p>
            </div>
            <div className="bg-[#F9F7F2] rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Anti-âge global</h3>
              <p className="text-[#4A4A4A]">Une approche complète lorsque plusieurs besoins se superposent.</p>
            </div>
            <div className="bg-[#F9F7F2] rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Fermeté</h3>
              <p className="text-[#4A4A4A]">Pour privilégier la tonicité et la tenue des contours.</p>
            </div>
            <div className="bg-[#F9F7F2] rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Regard</h3>
              <p className="text-[#4A4A4A]">Contour des yeux : fatigue, ridules, aspect plus reposé.</p>
            </div>
            <div className="bg-[#F9F7F2] rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Détox</h3>
              <p className="text-[#4A4A4A]">Teint terne : une remise en beauté "reset", tout en douceur.</p>
            </div>
          </div>
          <p className="text-base text-[#4A4A4A]/80 mt-4">Une simple prise de contact suffit pour être orientée vers l'objectif le plus pertinent.</p>
        </div>
      </section>

      {/* Soins emblématiques */}
      <section
        id="visible-age-reverse"
        className="scroll-mt-32 py-24 md:py-32 bg-[#F9F7F2] relative overflow-hidden"
      >
        {/* Decorative element */}
        <div className="absolute top-0 left-0 w-1/3 h-full opacity-5">
          <div className="w-full h-full bg-gradient-to-r from-[#D4AF37] to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#1A1A1A]">
              Les soins <span className="gold-gradient-text italic">emblématiques</span>
            </h2>
            <p className="text-lg text-[#4A4A4A] max-w-3xl leading-relaxed">
              En institut, le soin prend une autre dimension : un temps dédié, une atmosphère apaisante, et l'attention portée à chaque étape. C'est un instant pour soi, pensé pour être à la fois agréable et cohérent.
            </p>
          </motion.div>

          <div className="space-y-20">
            {/* Visible Age Reverse */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-[2rem] border border-white/70 bg-white/85 p-6 md:p-10 shadow-[0_30px_80px_rgba(35,27,20,0.08)] backdrop-blur-sm"
            >
              <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
                <div>
                  <div className="mb-5 flex flex-wrap gap-3">
                    <span className="inline-flex items-center rounded-full bg-[#D4AF37]/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9F7C20]">
                      Notre soin signature
                    </span>
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-[#1A1A1A]">
                    Visible Age Reverse
                  </h3>
                  <p className="mt-5 text-lg leading-relaxed text-[#4A4A4A]">
                    Un soin expert pensé pour celles qui veulent retrouver une peau visiblement plus lisse, plus tonique et plus régulière, dans un format court et précis.
                  </p>
                  <p className="mt-4 text-base leading-relaxed text-[#4A4A4A]/80">
                    Il prend tout son sens lorsque les signes de l&apos;âge commencent à s&apos;installer et que l&apos;on souhaite une réponse ciblée, non invasive, avec un effet peau plus fraîche et plus homogène.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[#FBF8EE] px-5 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8F7755]">Temps de soin</p>
                      <p className="mt-2 text-lg font-semibold text-[#1A1A1A]">30 minutes</p>
                    </div>
                    <div className="rounded-2xl bg-[#FBF8EE] px-5 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8F7755]">Approche</p>
                      <p className="mt-2 text-lg font-semibold text-[#1A1A1A]">Non invasive</p>
                    </div>
                    <div className="rounded-2xl bg-[#FBF8EE] px-5 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8F7755]">Zones ciblées</p>
                      <p className="mt-2 text-lg font-semibold text-[#1A1A1A]">Rides & fermeté</p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={openVisibleAgeReversePricing}
                      className="btn-secondary"
                    >
                      Voir les tarifs
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-2xl font-semibold text-[#1A1A1A]">Avant / après</h4>
                    </div>
                  </div>

                  {visibleAgeReverseGallery.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {visibleAgeReverseGallery.map((image, index) => (
                        <button
                          key={image.key}
                          type="button"
                          onClick={() => setSelectedGalleryImage(image)}
                          className={`group relative overflow-hidden rounded-[1.75rem] bg-[#EEE7DA] text-left shadow-[0_16px_45px_rgba(34,24,18,0.12)] transition-transform duration-500 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 ${
                            index === 0 ? 'md:row-span-2' : ''
                          }`}
                          aria-label={`Agrandir ${image.alt}`}
                        >
                          <img
                            src={image.src}
                            alt={image.alt}
                            className={`w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] ${
                              index === 0 ? 'h-[440px]' : 'h-[212px]'
                            }`}
                          />
                          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1A1A1A]/65 via-[#1A1A1A]/10 to-transparent px-5 pb-5 pt-14 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                            Voir en grand
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[1.75rem] border border-dashed border-[#D4AF37]/35 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(248,243,233,0.96))] p-8 md:p-10">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8F7755]">Dossier prêt</p>
                      <p className="mt-4 text-xl font-semibold text-[#1A1A1A]">Ajoute simplement tes photos avant / après</p>
                      <p className="mt-4 text-base leading-relaxed text-[#4A4A4A]/85">
                        Dépose tes images dans le dossier <span className="font-mono text-sm font-semibold text-[#1A1A1A]">frontend/src/assets/photos/guinot-visible-age-reverse</span>.
                        Elles s&apos;ajouteront automatiquement à cette galerie, sans modification supplémentaire.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Hydradermie */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img src={hydradermieImage} alt="Hydradermie" className="w-full h-[400px] object-cover" />
              </div>
              <div>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 rounded-full text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">Soin signature</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-[#1A1A1A]">Hydradermie 1000</h3>
                <p className="text-lg text-[#4A4A4A] mb-4 leading-relaxed">
                  Un grand classique de l&apos;institut, apprécié pour sa capacité à s&apos;adapter à la peau et à lui redonner confort, fraîcheur et éclat.
                </p>
                <div className="h-px bg-gradient-to-r from-[#D4AF37] to-transparent w-12 my-4"></div>
                <p className="text-base text-[#4A4A4A]/75 leading-relaxed">
                  C&apos;est souvent le soin vers lequel on se tourne quand la peau tire, brille, manque d&apos;éclat ou simplement quand on veut un soin complet, personnalisé et rassurant.
                </p>
              </div>
            </motion.div>

            {/* Hydradermie Lift */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl order-2 md:order-1">
                <img src={hydradermieLiftImage} alt="Hydradermie 1000 Lift" className="w-full h-[400px] object-cover" />
              </div>
              <div className="order-1 md:order-2">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 rounded-full text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">Fermeté & Tonicité</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-[#1A1A1A]">Hydradermie 1000 Lift</h3>
                <p className="text-lg text-[#4A4A4A] mb-4 leading-relaxed">
                  Un soin pensé pour redonner du ressort aux traits et retrouver cette sensation de visage plus tonique, plus net, plus maintenu.
                </p>
                <div className="h-px bg-gradient-to-r from-[#D4AF37] to-transparent w-12 my-4"></div>
                <p className="text-base text-[#4A4A4A]/75 leading-relaxed">
                  Il parle particulièrement à celles qui sentent leur peau moins ferme ou leurs contours moins dessinés et qui souhaitent une réponse experte axée sur la tonicité.
                </p>
              </div>
            </motion.div>

            {/* Age Summum */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img src= {ageSummumImage} alt="Age Summum" className="w-full h-[400px] object-cover" />
              </div>
              <div>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 rounded-full text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">Anti-âge global</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-[#1A1A1A]">Age Summum</h3>
                <p className="text-lg text-[#4A4A4A] mb-4 leading-relaxed">
                  Un soin anti-âge global, enveloppant, pensé pour sublimer la peau lorsqu&apos;elle a besoin d&apos;une réponse complète et experte.
                </p>
                <div className="h-px bg-gradient-to-r from-[#D4AF37] to-transparent w-12 my-4"></div>
                <p className="text-base text-[#4A4A4A]/75 leading-relaxed">
                  C&apos;est le soin idéal lorsque l&apos;on souhaite agir en même temps sur les rides, la fermeté, l&apos;éclat et l&apos;uniformité, avec une prise en charge complète du visage, du cou et du décolleté.
                </p>
              </div>
            </motion.div>

            {/* Hydra Peeling */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl order-2 md:order-1">
                <img src= {hydrapeelingImage} alt="Hydra Peeling" className="w-full h-[400px] object-cover" />
              </div>
              <div className="order-1 md:order-2">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 rounded-full text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">Luminosité</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-[#1A1A1A]">Hydra Peeling</h3>
                <p className="text-lg text-[#4A4A4A] mb-4 leading-relaxed">
                  Un soin rénovateur qui révèle l&apos;éclat et laisse la peau plus nette, plus douce et plus régulière.
                </p>
                <div className="h-px bg-gradient-to-r from-[#D4AF37] to-transparent w-12 my-4"></div>
                <p className="text-base text-[#4A4A4A]/75 leading-relaxed">
                  Il convient parfaitement lorsque le teint paraît plus terne, que le grain de peau manque d&apos;homogénéité ou que l&apos;on a envie d&apos;un effet peau neuve, lumineux et lissé.
                </p>
              </div>
            </motion.div>

            {/* Eye Lift */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img src= {ageSummumImage} alt="Eye Lift" className="w-full h-[400px] object-cover" />
              </div>
              <div>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 rounded-full text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">Zone ciblée</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-[#1A1A1A]">Eye Lift</h3>
                <p className="text-lg text-[#4A4A4A] mb-4 leading-relaxed">
                  Un soin entièrement dédié au regard, pour lui redonner fraîcheur, légèreté et éclat lorsqu&apos;il paraît plus marqué ou plus fatigué.
                </p>
                <div className="h-px bg-gradient-to-r from-[#D4AF37] to-transparent w-12 my-4"></div>
                <p className="text-base text-[#4A4A4A]/75 leading-relaxed">
                  C&apos;est une belle option lorsque les poches, les cernes ou les ridules attirent davantage l&apos;attention et que l&apos;on souhaite cibler cette zone avec précision.
                </p>
              </div>
            </motion.div>

            {/* Détoxygène */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl order-2 md:order-1">
                <img src= {detoxygeneImage} alt="Détoxygène" className="w-full h-[400px] object-cover" />
              </div>
              <div className="order-1 md:order-2">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 rounded-full text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">Reset beauté</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-[#1A1A1A]">Détoxygène</h3>
                <p className="text-lg text-[#4A4A4A] mb-4 leading-relaxed">
                  Un soin coup d&apos;éclat qui redonne immédiatement une impression de peau plus fraîche, plus oxygénée et plus lumineuse.
                </p>
                <div className="h-px bg-gradient-to-r from-[#D4AF37] to-transparent w-12 my-4"></div>
                <p className="text-base text-[#4A4A4A]/75 leading-relaxed">
                  Il est particulièrement apprécié quand la peau paraît terne, fatiguée ou comme brouillée par le stress, la pollution ou le rythme du quotidien, et qu&apos;elle a besoin d&apos;un vrai reset beauté.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Déroulé */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#1A1A1A]">Le déroulé, en toute simplicité</h2>
            <p className="text-base md:text-lg text-[#4A4A4A] mb-6">Un rendez-vous en institut, c'est aussi du temps : du temps pour soi, du temps pour la peau, et un cadre propice au relâchement.</p>
            <ol className="list-decimal pl-6 text-[#4A4A4A] mb-6 space-y-1">
              <li>Accueil et définition de l'objectif beauté.</li>
              <li>Orientation vers le soin le plus cohérent.</li>
              <li>Soin en cabine : protocole et gestuelles adaptées.</li>
              <li>Recommandations simples pour prolonger le confort au quotidien.</li>
            </ol>
            <p className="text-base text-[#4A4A4A]/80">L'essentiel : repartir avec une direction claire, et une sensation de soin "complet", sans improvisation.</p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img src={cabineImage} alt="Cabine de soin visage" className="w-full h-auto object-cover" />
          </div>
        </div>
      </section>

      {/* Accompagnement */}
      <section className="py-20 bg-[#F9F7F2]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#1A1A1A]">Un accompagnement qui s'ajuste</h2>
          <p className="text-base md:text-lg text-[#4A4A4A] mb-6">La peau évolue. L'intérêt de l'institut est de pouvoir ajuster l'approche au fil du temps : saisons, rythme de vie, fatigue, variations de confort ou d'éclat.</p>
          <div className="h-px bg-black/10 my-6 w-32 md:w-48"></div>
          <p className="text-base text-[#4A4A4A]/80">Le conseil vise la simplicité : clarifier l'objectif, choisir le bon soin au bon moment, et garder une routine lisible entre deux rendez-vous.</p>
        </div>
      </section>

      {/* Prendre rendez-vous */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#1A1A1A]">
              Prendre <span className="gold-gradient-text italic">rendez-vous</span>
            </h2>
            <p className="text-lg text-[#4A4A4A] mb-4 leading-relaxed">
              Pour être orientée vers le soin le plus adapté, un échange rapide suffit.
            </p>
            <p className="text-base text-[#4A4A4A]/75 mb-10 leading-relaxed">
              L'objectif : un conseil clair, un moment pour soi, et une expérience institut à la hauteur de vos attentes.
            </p>
            <a
              href="tel:0233214819"
              data-testid="guinot-contact-btn"
              className="btn-gold inline-flex items-center justify-center mb-8"
              aria-label="Appeler l'institut au 02 33 21 48 19"
            >
              Appeler : 02 33 21 48 19
            </a>
            <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-8"></div>
            <p className="text-sm text-[#4A4A4A]/70 font-medium">
              Jeudi–Vendredi 09:00–18:30 · Samedi 09:00–16:00<br />
              Lundi 14:00–18:30 · Mardi 09:00–18:30
            </p>
          </motion.div>
        </div>
      </section>

      <Footer onShowPricing={openAllPricing} />
      <PricingModal
        open={showPricing}
        onClose={() => setShowPricing(false)}
        initialCategories={pricingInitialCategories}
        initialSearchTerm={pricingInitialSearchTerm}
      />
      <Dialog open={Boolean(selectedGalleryImage)} onOpenChange={(open) => !open && setSelectedGalleryImage(null)}>
        <DialogContent className="w-[95vw] max-w-5xl overflow-hidden border-0 bg-transparent p-0 shadow-none">
          {selectedGalleryImage ? (
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
              <img
                src={selectedGalleryImage.src}
                alt={selectedGalleryImage.alt}
                className="max-h-[82vh] w-full object-contain bg-[#F6F0E5]"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
