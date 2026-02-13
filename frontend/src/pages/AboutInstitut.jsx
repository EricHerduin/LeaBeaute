

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import OpeningHours from '../components/OpeningHours';
import { motion } from 'framer-motion';
import videoVitrine from '../assets/videos/video_vitrine.mp4';

export default function AboutInstitut() {
  const [showPricing, setShowPricing] = useState(false);
  const videoRef = useRef(null);
  const videoWrapperRef = useRef(null);

  useEffect(() => {
    if (!videoWrapperRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) {
          return;
        }

        if (entry.isIntersecting) {
          video.currentTime = 0;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(videoWrapperRef.current);

    return () => observer.disconnect();
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <Navigation onShowPricing={() => setShowPricing(true)} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F9F7F2] to-white"></div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-[#1A1A1A]">
              L'équipe <span className="gold-gradient-text italic">Léa Beauté</span>
            </h1>
            <p className="text-lg md:text-xl text-[#4A4A4A] mb-12 leading-relaxed">
              Découvrez notre équipe d'esthéticiennes passionnées, chacune experte dans son domaine, pour vous offrir le meilleur du bien-être et de la beauté à Valognes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:0233214819"
                className="btn-primary inline-flex items-center justify-center"
              >
                Prendre Rendez-vous
              </a>
              <button
                onClick={() => setShowPricing(true)}
                className="btn-secondary"
              >
                Voir les tarifs
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Équipe Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Léa */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-card p-8 rounded-2xl flex flex-col items-center text-center h-full"
            >
              <img src={require('../assets/photos/Equipe/Lea.jpg')} alt="Léa" className="w-40 h-40 object-cover rounded-full mb-4 shadow-lg border-4 border-[#F9F7F2]" />
              <h3 className="text-2xl font-bold text-[#1A1A1A] mb-1">Léa</h3>
              <div className="min-h-[52px] mb-2">
                <span className="block text-sm text-[#D4AF37] font-medium">Spécialité : Conseil &amp; Soins Visage</span>
                <p className="text-[#4A4A4A] text-sm">Responsable de l'institut</p>
              </div>
              <p className="text-[#808080] text-sm mb-4 flex-1">Fondatrice de l'institut, Léa est animée par la passion de l'esthétique depuis plus de 15 ans. Véritable experte du soin visage, elle met un point d'honneur à personnaliser chaque diagnostic et à créer une relation de confiance avec ses clientes. Toujours à l'écoute, elle aime partager ses conseils pour révéler la beauté naturelle de chacune. Maman de deux filles, elle sait combien il est important de s'accorder du temps pour soi et transmet cette philosophie à toute l'équipe.</p>
              <p className="text-[#D4AF37] text-xs italic mt-auto">"Ce que j'aime le plus ? Voir une cliente repartir apaisée, le sourire aux lèvres, et savoir qu'elle a pris soin d'elle."</p>
            </motion.div>
            {/* Maryssa */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="glass-card p-8 rounded-2xl flex flex-col items-center text-center h-full"
            >
              <img src={require('../assets/photos/Equipe/Maryssa.jpg')} alt="Maryssa" className="w-40 h-40 object-cover rounded-full mb-4 shadow-lg border-4 border-[#F9F7F2]" />
              <h3 className="text-2xl font-bold text-[#1A1A1A] mb-1">Maryssa</h3>
              <div className="min-h-[52px] mb-2">
                <span className="block text-sm text-[#D4AF37] font-medium">Spécialité : Ongles &amp; Extensions de cils</span>
                <p className="text-[#4A4A4A] text-sm">Esthéticienne</p>
              </div>
              <p className="text-[#4A4A4A] text-sm mb-4 flex-1">Créative et minutieuse, Maryssa sublime vos mains et votre regard avec passion. Elle maîtrise l'art du nail art, des extensions de cils et des poses les plus tendances. Toujours à la recherche de nouveautés, elle se forme régulièrement pour proposer des prestations innovantes et personnalisées. Sa bonne humeur et son sens du détail font d'elle une alliée précieuse pour sublimer votre féminité.</p>
              <p className="text-[#D4AF37] text-xs italic mt-auto">"J'adore voir le regard de mes clientes s'illuminer après une pose d'ongles ou d'extensions réussie !"</p>
            </motion.div>
            {/* Maélise */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="glass-card p-8 rounded-2xl flex flex-col items-center text-center h-full"
            >
              <div className="w-40 h-40 rounded-full mb-4 shadow-lg border-4 border-[#F9F7F2] overflow-hidden">
                <img src={require('../assets/photos/Equipe/Maelise.jpg')} alt="Maélise" className="w-full h-full object-cover object-[center_80%] scale-140" />
              </div>
              <h3 className="text-2xl font-bold text-[#1A1A1A] mb-1">Maélise</h3>
              <div className="min-h-[52px] mb-2">
                <span className="block text-sm text-[#D4AF37] font-medium">Spécialité : Modelages du corps</span>
                <p className="text-[#4A4A4A] text-sm">Esthéticienne</p>
              </div>
              <p className="text-[#4A4A4A] text-sm mb-4 flex-1">Douce et attentive, Maélise vous invite à la détente grâce à ses modelages relaxants et personnalisés. Spécialiste des techniques de massage bien-être, elle adapte chaque séance à vos besoins du moment : relaxation profonde, soulagement des tensions, ou simple parenthèse cocooning. Son objectif : que vous repartiez ressourcée, détendue et le corps léger.</p>
              <p className="text-[#D4AF37] text-xs italic mt-auto">"Le massage, c'est offrir un voyage sensoriel et un vrai moment pour soi, loin du stress du quotidien."</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Philosophie & Expertise Section */}
      <section className="py-20 bg-[#F9F7F2]">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-10">
              <div
                ref={videoWrapperRef}
                className="relative rounded-3xl overflow-hidden border border-[#E8DCCA] shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#F3E5AB]/60 via-transparent to-[#D4AF37]/10" aria-hidden="true" />
                <video
                  className="relative w-full aspect-video object-cover"
                  src={videoVitrine}
                  ref={videoRef}
                  preload="metadata"
                  muted
                  playsInline
                />
              </div>
              <p className="text-sm text-[#808080] mt-3 text-center">Un aperçu de l'ambiance à l'institut</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[#1A1A1A]">Notre philosophie</h2>
            <p className="text-lg text-[#4A4A4A] mb-6 leading-relaxed">
              Au cœur de notre métier, il y a le contact humain, l’écoute et la sincérité. Nous croyons que chaque femme mérite de se sentir belle, écoutée et valorisée. Notre objectif : que chaque visite soit un moment de détente, de reconnexion à soi et de confiance retrouvée.<br/>
              <span className="block mt-4 text-[#808080] text-base">Nous privilégions l’accueil chaleureux, la discrétion et la bienveillance. Ici, pas de jugement : chaque cliente est unique et mérite toute notre attention.</span>
            </p>
            <ul className="list-disc list-inside mb-6 text-left text-[#4A4A4A] max-w-xl mx-auto">
              <li>Écouter et comprendre vos besoins, vos envies, vos complexes</li>
              <li>Vous conseiller avec sincérité, même si cela signifie parfois vous orienter vers une autre prestation</li>
              <li>Offrir un moment rien qu’à vous, loin du stress et du regard des autres</li>
              <li>Créer une relation de confiance sur le long terme</li>
            </ul>
            <p className="text-lg text-[#4A4A4A] mb-6 leading-relaxed">
              Nous nous formons régulièrement pour vous proposer les techniques les plus actuelles et efficaces, comme le Yumi Rehaussement de Cils ou l’épilation à la lumière pulsée. Nous testons chaque nouveauté sur nous-mêmes avant de la proposer, pour garantir efficacité et sécurité.<br/>
              <span className="block mt-4 text-[#808080] text-base">Notre équipe partage ses découvertes, ses astuces beauté et ses coups de cœur pour que vous puissiez profiter des meilleurs soins et conseils.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/prestations#yumi" className="btn-secondary">Découvrir le rehaussement de cils</Link>
              <Link to="/prestations#lumiere-pulsee" className="btn-secondary">En savoir plus sur la lumière pulsée</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Points forts Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[#1A1A1A]">Nos points forts</h2>
            <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-lg border border-[#E8DCCA] opacity-75 md:float-right md:ml-6 mb-4 mx-auto md:mx-0">
              <img
                src={require('../assets/photos/Equipe/Equipe.jpg')}
                alt="Equipe Lea Beaute"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <ul className="list-disc list-inside mb-6 text-left text-[#4A4A4A] max-w-xl mx-auto">
              <li>Soins du visage Guinot : résultats visibles dès la première séance (<Link to="/guinot" className="text-[#D4AF37] underline">découvrir</Link>). Diagnostic personnalisé, protocoles innovants, conseils adaptés à chaque peau.</li>
              <li>Épilation semi-définitive à la lumière pulsée : pour une peau douce durablement, en toute sécurité.</li>
              <li>Soins du corps relaxants et personnalisés : modelages, gommages, rituels bien-être pour lâcher prise.</li>
              <li>Beauté des mains et des pieds : manucure, pose de vernis, soins spa, nail art tendance.</li>
              <li>Maquillage, rehaussement et teinture des cils et sourcils : révélez votre regard et votre éclat naturel.</li>
              <li>Rituels bien-être sur-mesure : chaque cliente repart avec des conseils personnalisés pour prolonger les bienfaits à la maison.</li>
              <li>Accompagnement nutrition : un accompagnement global pour se sentir bien dans sa peau, à l'intérieur comme à l'extérieur.</li>
            </ul>
            <p className="text-lg text-[#4A4A4A] mb-6 leading-relaxed font-semibold text-center">Notre promesse : révéler votre beauté, tout en prenant soin de votre bien-être.<br/>
            <span className="block mt-2 text-[#808080] text-base font-normal">Vous hésitez sur une prestation ? Venez discuter avec nous, nous prendrons le temps de vous conseiller et de vous orienter vers ce qui vous conviendra le mieux.</span></p>
          </motion.div>
        </div>
      </section>
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-[#F9F7F2]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-center">
          <OpeningHours fullWidth={false} showStatus={true} />
        </div>
      </section>
      <Footer onShowPricing={() => setShowPricing(true)} />
    </div>
  );
}
