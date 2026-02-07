import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { API } from '../lib/apiClient';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import logoLeaBeaute from '../assets/photos/logos/logo16-9_1.png';
import {
  faCheck,
  faCircleInfo,
  faEnvelope,
  faEnvelopeOpenText,
  faGift,
  faLocationDot,
  faFilePdf,
  faPhone,
  faWandMagicSparkles,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';

const axios = api;

export default function GiftCardSuccess() {
  const [searchParams] = useSearchParams();
  const [giftCard, setGiftCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('Identifiant de session manquant');
      setLoading(false);
      return;
    }

    const fetchGiftCard = async () => {
      try {
        const response = await axios.get(`${API}/gift-cards/status/${sessionId}`);
        
        if (response.data.status === 'complete' && response.data.gift_card) {
          setGiftCard(response.data.gift_card);
        } else if (response.data.payment_status === 'pending') {
          setError('Le paiement est en cours de traitement. Veuillez vérifier dans quelques instants.');
        } else {
          setError('Le paiement n\'a pas été complété.');
        }
      } catch (err) {
        console.error('Error fetching gift card:', err);
        setError('Erreur lors de la récupération de la carte cadeau');
      } finally {
        setLoading(false);
      }
    };

    fetchGiftCard();
  }, [sessionId]);


  const handlePrint = () => {
    window.print();
  };

  const handleOpenPdf = async () => {
    if (!giftCard) return;
    try {
      const pdfDoc = await PDFDocument.create();
      const pageWidth = 595.28; // A5 landscape width in points
      const pageHeight = 419.53; // A5 landscape height in points
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const logoResponse = await fetch(logoLeaBeaute);
      const logoBytes = await logoResponse.arrayBuffer();
      const logoImage = await pdfDoc.embedPng(logoBytes);

      const cream = rgb(0.976, 0.969, 0.949);
      const gold = rgb(0.831, 0.686, 0.216);
      const goldDark = rgb(0.773, 0.627, 0.157);
      const text = rgb(0.1, 0.1, 0.1);
      const muted = rgb(0.35, 0.35, 0.35);
      const border = rgb(0.91, 0.86, 0.79);
      const infoBg = rgb(0.91, 0.96, 0.97);
      const messageBg = rgb(1, 0.97, 0.9);

      const margin = 28;
      const headerHeight = 70;

      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: cream });
      page.drawRectangle({ x: 0, y: pageHeight - headerHeight, width: pageWidth, height: headerHeight, color: gold });
      page.drawRectangle({ x: 0, y: pageHeight - headerHeight, width: pageWidth, height: 4, color: goldDark });

      const logoMaxWidth = 140;
      const logoMaxHeight = 40;
      const logoScale = Math.min(logoMaxWidth / logoImage.width, logoMaxHeight / logoImage.height);
      const logoWidth = logoImage.width * logoScale;
      const logoHeight = logoImage.height * logoScale;

      page.drawImage(logoImage, {
        x: pageWidth - margin - logoWidth,
        y: pageHeight - headerHeight / 2 - logoHeight / 2,
        width: logoWidth,
        height: logoHeight
      });

      page.drawText('Carte Cadeau', {
        x: margin,
        y: pageHeight - 42,
        size: 24,
        font: fontBold,
        color: rgb(1, 1, 1)
      });
      page.drawText('Léa Beauté', {
        x: margin,
        y: pageHeight - 60,
        size: 14,
        font,
        color: rgb(1, 1, 1)
      });

      const recipientName = giftCard.recipient_name || `${giftCard.buyer_firstname} ${giftCard.buyer_lastname}`;
      const buyerName = `${giftCard.buyer_firstname} ${giftCard.buyer_lastname}`;
      const displayAmount = giftCard.amountEur ?? giftCard.amount;
      const displayExpiresAt = giftCard.expiresAt ?? giftCard.expires_at;

      const leftX = margin;
      const rightX = pageWidth / 2 + 10;
      const startY = pageHeight - headerHeight - 24;

      page.drawText('Bénéficiaire', { x: leftX, y: startY, size: 11, font, color: muted });
      page.drawText(recipientName, { x: leftX, y: startY - 18, size: 14, font: fontBold, color: text });
      if (giftCard.recipient_name) {
        page.drawText('Offert par', { x: leftX, y: startY - 36, size: 10, font, color: muted });
        page.drawText(buyerName, { x: leftX, y: startY - 52, size: 12, font: fontBold, color: text });
      }

      page.drawText('Montant', { x: rightX, y: startY, size: 11, font, color: muted });
      page.drawText(`${displayAmount}€`, { x: rightX, y: startY - 28, size: 24, font: fontBold, color: goldDark });
      page.drawText(`Valide jusqu'au : ${formatDate(displayExpiresAt)}`, { x: rightX, y: startY - 50, size: 10, font, color: muted });
      page.drawText('Durée : 6 mois', { x: rightX, y: startY - 64, size: 10, font, color: muted });

      const codeBoxY = startY - 118;
      const codeBoxHeight = 62;
      page.drawRectangle({
        x: margin,
        y: codeBoxY,
        width: pageWidth - margin * 2,
        height: codeBoxHeight,
        borderColor: gold,
        borderWidth: 2,
        color: rgb(0.985, 0.98, 0.96)
      });
      page.drawText('Code carte cadeau', {
        x: margin + 16,
        y: codeBoxY + 40,
        size: 10,
        font,
        color: muted
      });
      const codeSize = 20;
      const codeWidth = fontBold.widthOfTextAtSize(giftCard.code || '', codeSize);
      const codeX = margin + (pageWidth - margin * 2 - codeWidth) / 2;
      page.drawText(giftCard.code || '', {
        x: codeX,
        y: codeBoxY + 14,
        size: codeSize,
        font: fontBold,
        color: text
      });

      const wrapText = (textValue, maxWidth, fontRef, size) => {
        const words = textValue.split(' ');
        const lines = [];
        let current = '';
        for (const word of words) {
          const test = current ? `${current} ${word}` : word;
          const width = fontRef.widthOfTextAtSize(test, size);
          if (width <= maxWidth) {
            current = test;
          } else {
            if (current) lines.push(current);
            current = word;
          }
        }
        if (current) lines.push(current);
        return lines;
      };

      const footerY = margin + 6;
      const footerRightText = 'Valognes, Normandie';
      const footerRightWidth = font.widthOfTextAtSize(footerRightText, 11);

      page.drawText('Réservation : 02 33 21 48 19', {
        x: margin,
        y: footerY,
        size: 11,
        font: fontBold,
        color: text
      });
      page.drawText(footerRightText, {
        x: pageWidth - margin - footerRightWidth,
        y: footerY,
        size: 11,
        font,
        color: muted
      });

      const conditionsHeight = 62;
      const conditionsY = footerY + 18;
      page.drawRectangle({
        x: margin,
        y: conditionsY,
        width: pageWidth - margin * 2,
        height: conditionsHeight,
        color: infoBg,
        borderColor: border,
        borderWidth: 1
      });
      page.drawText('Conditions d’utilisation :', {
        x: margin + 12,
        y: conditionsY + 42,
        size: 11,
        font: fontBold,
        color: text
      });
      page.drawText('• Valable 6 mois à partir de la date d’achat', {
        x: margin + 12,
        y: conditionsY + 28,
        size: 10,
        font,
        color: text
      });
      page.drawText('• Utilisable sur toutes les prestations de l’institut', {
        x: margin + 12,
        y: conditionsY + 16,
        size: 10,
        font,
        color: text
      });
      page.drawText('• Non remboursable et non transférable', {
        x: margin + 280,
        y: conditionsY + 28,
        size: 10,
        font,
        color: text
      });
      page.drawText('• À présenter en version papier ou numérique', {
        x: margin + 280,
        y: conditionsY + 16,
        size: 10,
        font,
        color: text
      });

      if (giftCard.personal_message) {
        const messageMaxWidth = pageWidth - margin * 2 - 24;
        const allLines = wrapText(giftCard.personal_message, messageMaxWidth, font, 11);
        const maxLines = 3;
        const lines = allLines.slice(0, maxLines);
        const messageHeight = 18 + lines.length * 14 + 10;
        const messageMinY = conditionsY + conditionsHeight + 10;
        let messageBoxY = codeBoxY - messageHeight - 12;
        if (messageBoxY < messageMinY) {
          messageBoxY = messageMinY;
        }

        page.drawRectangle({
          x: margin,
          y: messageBoxY,
          width: pageWidth - margin * 2,
          height: messageHeight,
          color: messageBg,
          borderColor: border,
          borderWidth: 1
        });
        page.drawText('Message personnel', {
          x: margin + 12,
          y: messageBoxY + messageHeight - 18,
          size: 11,
          font: fontBold,
          color: text
        });
        lines.forEach((line, index) => {
          page.drawText(line, {
            x: margin + 12,
            y: messageBoxY + messageHeight - 34 - index * 14,
            size: 11,
            font,
            color: text
          });
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-[#1A1A1A]">Chargement de votre carte cadeau...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md text-center"
        >
          <div className="text-red-500 text-5xl mb-4">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4">Erreur</h1>
          <p className="text-[#4A4A4A] mb-8">{error}</p>
          <a
            href="/#cartes-cadeaux"
            className="btn-gold inline-block px-6 py-3 rounded-lg"
          >
            Retour aux cartes cadeaux
          </a>
        </motion.div>
      </div>
    );
  }

  if (!giftCard) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md text-center"
        >
          <div className="text-yellow-500 text-5xl mb-4">
            <FontAwesomeIcon icon={faGift} />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4">Carte non trouvée</h1>
          <p className="text-[#4A4A4A] mb-8">La carte cadeau n'a pas pu être récupérée.</p>
          <a
            href="/#cartes-cadeaux"
            className="btn-gold inline-block px-6 py-3 rounded-lg"
          >
            Retour aux cartes cadeaux
          </a>
        </motion.div>
      </div>
    );
  }

  const recipientName = giftCard.recipient_name || `${giftCard.buyer_firstname} ${giftCard.buyer_lastname}`;
  const buyerName = `${giftCard.buyer_firstname} ${giftCard.buyer_lastname}`;

  const displayAmount = giftCard.amountEur ?? giftCard.amount;
  const displayExpiresAt = giftCard.expiresAt ?? giftCard.expires_at;

  return (
    <div className="min-h-screen bg-[#F9F7F2] py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-6 md:px-12 gift-card-wrapper">
        {/* Header with print buttons - hidden on print */}
        <div className="print:hidden mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-2">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-2" />
              Paiement validé !
            </h1>
            <p className="text-[#4A4A4A] text-lg">
              Votre carte cadeau est prête à être utilisée
            </p>
          </motion.div>

          <div className="flex gap-4 justify-center mb-8 flex-wrap">
            <button
              onClick={handlePrint}
              className="btn-gold px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2v-2a2 2 0 00-2-2zm0 0h4a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5" />
              </svg>
              Imprimer
            </button>
            <button
              onClick={handleOpenPdf}
              className="btn-secondary px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faFilePdf} />
              Ouvrir le PDF
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(giftCard.code);
                toast.success('Code copié !');
              }}
              className="btn-secondary px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copier le code
            </button>
            <a
              href="/"
              className="btn-secondary px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h5m4 0h5a1 1 0 001-1V10" />
              </svg>
              Retour à l'accueil
            </a>
          </div>
        </div>

        {/* Printable Gift Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          id="gift-card-printable"
          className="bg-white rounded-3xl overflow-hidden shadow-2xl gift-card-print"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#D4AF37] to-[#C5A028] p-8 md:p-12 text-white text-center gc-header">
            <div className="text-6xl mb-4">
              <FontAwesomeIcon icon={faWandMagicSparkles} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Carte Cadeau</h2>
            <p className="text-lg opacity-90">Léa Beauté</p>
          </div>

          {/* Main Content */}
          <div className="p-8 md:p-12 gc-body">
            {/* Greeting */}
            <div className="text-center mb-12 gc-greeting">
              <p className="text-xl md:text-2xl font-bold text-[#1A1A1A] mb-2">
                Bienvenue, {recipientName}!
              </p>
              <p className="text-[#4A4A4A]">
                Une magnifique carte cadeau vous attend
              </p>
            </div>

            {/* Gift Card Display */}
            <div className="bg-gradient-to-br from-[#F9F7F2] to-[#EDE7D9] border-4 border-[#D4AF37] rounded-2xl p-8 md:p-12 text-center mb-8 shadow-lg gc-code">
              <p className="text-sm uppercase tracking-widest text-[#808080] mb-4">
                Code de votre carte
              </p>
              <p className="text-4xl md:text-5xl font-bold font-mono text-[#1A1A1A] mb-6 tracking-wide gc-code-value">
                {giftCard.code}
              </p>
              <p className="text-[#808080]">À présenter lors de votre visite</p>
            </div>

            {/* Amount */}
            <div className="text-center mb-12 gc-amount">
              <p className="text-[#808080] text-sm mb-2">Montant de votre carte</p>
              <p className="text-6xl md:text-7xl font-bold text-[#D4AF37] gc-amount-value">
                {displayAmount}€
              </p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-6 md:gap-8 mb-8 bg-[#F9F7F2] p-8 rounded-xl border-l-4 border-[#D4AF37] gc-details">
              <div>
                <p className="text-[#808080] text-sm mb-2">Valide jusqu'au</p>
                <p className="font-bold text-[#1A1A1A]">{formatDate(displayExpiresAt)}</p>
              </div>
              <div>
                <p className="text-[#808080] text-sm mb-2">Durée de validité</p>
                <p className="font-bold text-[#1A1A1A]">6 mois</p>
              </div>
              {giftCard.recipient_name && (
                <div className="col-span-2">
                  <p className="text-[#808080] text-sm mb-2">Offert par</p>
                  <p className="font-bold text-[#1A1A1A]">{buyerName}</p>
                </div>
              )}
            </div>

            {giftCard.personal_message && (
              <div className="bg-[#FFF7E6] border-l-4 border-[#D4AF37] p-6 rounded-lg mb-8 gc-message">
                <p className="font-bold text-[#1A1A1A] mb-2">
                  <FontAwesomeIcon icon={faEnvelopeOpenText} className="mr-2" />
                  Message personnel
                </p>
                <p className="text-[#1A1A1A] whitespace-pre-wrap">{giftCard.personal_message}</p>
              </div>
            )}

            {/* Terms */}
            <div className="bg-[#E8F4F8] border-l-4 border-[#108A8A] p-6 rounded-lg mb-8 gc-terms">
              <p className="font-bold text-[#1A1A1A] mb-4">
                <FontAwesomeIcon icon={faCircleInfo} className="mr-2" />
                Conditions d'utilisation :
              </p>
              <ul className="space-y-2 text-[#1A1A1A]">
                <li className="flex items-start">
                  <span className="mr-3"><FontAwesomeIcon icon={faCheck} /></span>
                  <span>Valable 6 mois à partir de la date d'achat</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3"><FontAwesomeIcon icon={faCheck} /></span>
                  <span>Utilisable sur toutes les prestations de l'institut</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3"><FontAwesomeIcon icon={faCheck} /></span>
                  <span>Non remboursable et non transférable</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3"><FontAwesomeIcon icon={faCheck} /></span>
                  <span>À présenter en version papier ou numérique</span>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="text-center gc-contact">
              <p className="text-[#4A4A4A] mb-4">Pour réserver votre prestation :</p>
              <p className="text-2xl font-bold text-[#D4AF37] mb-2">
                <FontAwesomeIcon icon={faPhone} className="mr-2" />
                02 33 21 48 19
              </p>
              <p className="text-[#4A4A4A]">
                <FontAwesomeIcon icon={faLocationDot} className="mr-2" />
                Valognes, Normandie
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#F9F7F2] border-t border-[#E8DCCA] p-6 text-center text-[#808080] text-sm gc-footer">
            <p className="font-bold text-[#1A1A1A]">Léa Beauté Valognes</p>
            <p>Institut de beauté - Soins esthétiques & bien-être</p>
            <p className="mt-2">Tél. : 02 33 21 48 19</p>
            <p className="mt-4 pt-4 border-t border-[#E8DCCA]">
              Merci de votre confiance ! <FontAwesomeIcon icon={faWandMagicSparkles} className="ml-2" />
            </p>
          </div>
        </motion.div>

        {/* Additional info - hidden on print */}
        <div className="print:hidden mt-8 bg-white rounded-2xl p-6 md:p-8">
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">
            <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
            Confirmation par email
          </h3>
          <p className="text-[#4A4A4A] mb-4">
            Une confirmation détaillée a été envoyée à <span className="font-semibold">{giftCard.buyer_email}</span>
          </p>
          <p className="text-[#808080] text-sm">
            Conservez ce code précieusement. Vous pouvez aussi l'envoyer directement au bénéficiaire de la carte cadeau.
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        .gift-card-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .gift-card-print {
          width: min(840px, 95vw);
          max-width: 840px;
          margin: 0 auto;
          overflow-y: auto;
        }
        .gift-card-print,
        .gift-card-print * {
          box-sizing: border-box;
          word-break: break-word;
        }
        @media (max-width: 768px) {
          .gift-card-print {
            width: 95vw;
          }
        }
        .gift-card-print .gc-header h2 {
          font-size: 28px;
          line-height: 1.1;
        }
        .gift-card-print .gc-header p {
          font-size: 16px;
        }
        .gift-card-print .gc-header {
          padding: 24px;
        }
        .gift-card-print .gc-body {
          padding: 32px 24px;
        }
        .gift-card-print .gc-greeting {
          margin-bottom: 20px;
        }
        .gift-card-print .gc-greeting p:first-child {
          font-size: 24px;
        }
        .gift-card-print .gc-code {
          padding: 24px;
          margin-bottom: 20px;
        }
        .gift-card-print .gc-code-value {
          font-size: 36px;
          margin-bottom: 12px;
        }
        .gift-card-print .gc-amount {
          margin-bottom: 24px;
        }
        .gift-card-print .gc-amount-value {
          font-size: 56px;
          line-height: 1.05;
        }
        .gift-card-print .gc-details {
          padding: 20px;
          gap: 16px;
          margin-bottom: 20px;
        }
        .gift-card-print .gc-terms {
          padding: 16px;
          margin-bottom: 20px;
          font-size: 14px;
          line-height: 1.4;
        }
        .gift-card-print .gc-terms ul {
          margin: 12px 0;
        }
        .gift-card-print .gc-terms li {
          margin-bottom: 8px;
        }
        .gift-card-print .gc-contact {
          font-size: 16px;
        }
        .gift-card-print .gc-footer {
          padding: 16px;
          font-size: 13px;
        }
        @media print {
          @page {
            size: A5 landscape;
            margin: 5mm;
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          #gift-card-printable {
            box-shadow: none;
            page-break-after: avoid;
            break-inside: avoid;
          }
          .gift-card-print {
            width: 100%;
            max-width: 100%;
            height: auto;
            max-height: none;
            overflow: visible;
            border-radius: 10px;
            page-break-inside: avoid;
          }
          .gift-card-print .gc-header {
            padding: 14px;
          }
          .gift-card-print .gc-header h2 {
            font-size: 22px;
          }
          .gift-card-print .gc-header p {
            font-size: 13px;
          }
          .gift-card-print .gc-body {
            padding: 14px;
          }
          .gift-card-print .gc-greeting {
            margin-bottom: 10px;
          }
          .gift-card-print .gc-greeting p:first-child {
            font-size: 18px;
          }
          .gift-card-print .gc-code {
            padding: 12px;
            margin-bottom: 10px;
          }
          .gift-card-print .gc-code-value {
            font-size: 24px;
            margin-bottom: 6px;
          }
          .gift-card-print .gc-amount {
            margin-bottom: 10px;
          }
          .gift-card-print .gc-amount-value {
            font-size: 38px;
          }
          .gift-card-print .gc-details {
            padding: 12px;
            gap: 8px;
            margin-bottom: 10px;
          }
          .gift-card-print .gc-message {
            padding: 10px;
            margin-bottom: 10px;
            font-size: 12px;
          }
          .gift-card-print .gc-terms {
            padding: 10px;
            margin-bottom: 10px;
            font-size: 11px;
            line-height: 1.3;
          }
          .gift-card-print .gc-contact {
            font-size: 13px;
          }
          .gift-card-print .gc-footer {
            padding: 10px;
            font-size: 11px;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
