
import { useState } from 'react';
import { motion } from 'framer-motion';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PricingModal from '../components/PricingModal';

export default function GuinotPage() {
  const [showPricing, setShowPricing] = useState(false);
  return (
    <div className="min-h-screen bg-white">
      <Navigation onShowPricing={() => setShowPricing(true)} />

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
            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <a href="tel:0233214819" className="btn-primary inline-flex items-center justify-center">Prendre Rendez-vous</a>
              <button onClick={() => setShowPricing(true)} className="btn-secondary">Voir les tarifs</button>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img src="/assets/photos/Institut_devanture.jpg" alt="Soin visage en institut" className="w-full h-auto object-cover" />
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-20 bg-[#F9F7F2]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid gap-10 md:grid-cols-2 items-center">
          <div className="rounded-2xl overflow-hidden shadow-lg order-2 md:order-1">
            <img src="/assets/photos/Equipe/Lea.jpg" alt="Gestuelle de soin visage" className="w-full h-auto object-cover" />
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
      <section className="py-24 md:py-32 bg-[#F9F7F2] relative overflow-hidden">
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
            {/* Hydradermie */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img src="/assets/photos/Equipe/Maelise.jpg" alt="Hydradermie" className="w-full h-[400px] object-cover" />
              </div>
              <div>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 rounded-full text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">Soin signature</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-[#1A1A1A]">Hydradermie</h3>
                <p className="text-lg text-[#4A4A4A] mb-4 leading-relaxed">
                  Un soin signature, choisi lorsque l'on souhaite une prise en charge complète et une orientation claire vers l'éclat et le confort.
                </p>
                <div className="h-px bg-gradient-to-r from-[#D4AF37] to-transparent w-12 my-4"></div>
                <p className="text-base text-[#4A4A4A]/75 leading-relaxed">
                  En institut, il devient une parenthèse précieuse : on se laisse guider, et l'on ressort avec un cap beauté simple.
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
                <img src="/assets/photos/Equipe/Maryssa.jpg" alt="Hydradermie Lift" className="w-full h-[400px] object-cover" />
              </div>
              <div className="order-1 md:order-2">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 rounded-full text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">Fermeté & Tonicité</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-[#1A1A1A]">Hydradermie Lift</h3>
                <p className="text-lg text-[#4A4A4A] mb-4 leading-relaxed">
                  Une approche orientée fermeté et tonicité, lorsque la priorité est la tenue des traits et la sensation de peau plus "tonique".
                </p>
                <div className="h-px bg-gradient-to-r from-[#D4AF37] to-transparent w-12 my-4"></div>
                <p className="text-base text-[#4A4A4A]/75 leading-relaxed">
                  L'avantage du rendez-vous : un soin sélectionné avec précision, réalisé dans un cadre calme, avec le temps nécessaire.
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
                <img src="/assets/photos/Institut_devanture.jpg" alt="Age Summum" className="w-full h-[400px] object-cover" />
              </div>
              <div>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 rounded-full text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">Anti-âge global</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-[#1A1A1A]">Age Summum</h3>
                <p className="text-lg text-[#4A4A4A] mb-4 leading-relaxed">
                  Un soin anti-âge global, lorsque plusieurs attentes se superposent et que l'on souhaite une approche harmonieuse.
                </p>
                <div className="h-px bg-gradient-to-r from-[#D4AF37] to-transparent w-12 my-4"></div>
                <p className="text-base text-[#4A4A4A]/75 leading-relaxed">
                  En institut, l'objectif est clarifié et la priorité est posée : moins d'hésitation, plus de cohérence, plus de confort.
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
                <img src="/assets/photos/Equipe/Lea.jpg" alt="Hydra Peeling" className="w-full h-[400px] object-cover" />
              </div>
              <div className="order-1 md:order-2">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 rounded-full text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">Luminosité</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-[#1A1A1A]">Hydra Peeling</h3>
                <p className="text-lg text-[#4A4A4A] mb-4 leading-relaxed">
                  Un soin rénovateur orienté "peau plus nette", lorsque l'on recherche un teint plus lumineux et un grain de peau plus régulier.
                </p>
                <div className="h-px bg-gradient-to-r from-[#D4AF37] to-transparent w-12 my-4"></div>
                <p className="text-base text-[#4A4A4A]/75 leading-relaxed">
                  Le conseil en cabine aide à poser la bonne intention : éclat, lissage, confort… et à choisir l'approche la plus douce.
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
                <img src="/assets/photos/Equipe/Maryssa.jpg" alt="Eye Lift" className="w-full h-[400px] object-cover" />
              </div>
              <div>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 rounded-full text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">Zone ciblée</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-[#1A1A1A]">Eye Lift</h3>
                <p className="text-lg text-[#4A4A4A] mb-4 leading-relaxed">
                  Un soin dédié au contour des yeux, lorsque le regard est la priorité : fatigue, ridules, aspect plus reposé.
                </p>
                <div className="h-px bg-gradient-to-r from-[#D4AF37] to-transparent w-12 my-4"></div>
                <p className="text-base text-[#4A4A4A]/75 leading-relaxed">
                  En institut, c'est un soin ciblé, précis, et particulièrement agréable : un temps calme, centré sur le regard.
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
                <img src="/assets/photos/Equipe/Maelise.jpg" alt="Détoxygène" className="w-full h-[400px] object-cover" />
              </div>
              <div className="order-1 md:order-2">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 rounded-full text-xs font-semibold text-[#D4AF37] uppercase tracking-wide">Reset beauté</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-[#1A1A1A]">Détoxygène</h3>
                <p className="text-lg text-[#4A4A4A] mb-4 leading-relaxed">
                  Lorsque la peau manque d'éclat : un soin pensé pour une sensation de fraîcheur et un teint visuellement plus lumineux.
                </p>
                <div className="h-px bg-gradient-to-r from-[#D4AF37] to-transparent w-12 my-4"></div>
                <p className="text-base text-[#4A4A4A]/75 leading-relaxed">
                  Souvent choisi comme "reset beauté" : une parenthèse pour soi, et des repères simples pour entretenir cette sensation.
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
            <img src="/assets/photos/Institut_devanture.jpg" alt="Cabine de soin visage" className="w-full h-auto object-cover" />
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

      <Footer onShowPricing={() => setShowPricing(true)} />
      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} />
    </div>
  );
}
