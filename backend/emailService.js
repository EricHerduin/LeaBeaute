const nodemailer = require("nodemailer");

function formatExpiryDate(expiresAt) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(expiresAt));
  } catch (error) {
    return expiresAt;
  }
}

function generateGiftCardEmailHtml(recipientName, giftCardCode, amount, expiresAt, buyerName) {
  const displayName = recipientName || buyerName;
  const formattedExpiry = formatExpiryDate(expiresAt);

  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f9f7f2;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #d4af37 0%, #c5a028 100%);
            color: #ffffff;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
          }
          .content {
            padding: 40px 30px;
            color: #1a1a1a;
          }
          .greeting {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 20px;
          }
          .gift-card {
            background: linear-gradient(135deg, #f9f7f2 0%, #ede7d9 100%);
            border: 3px solid #d4af37;
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
          }
          .gift-card-amount {
            font-size: 48px;
            font-weight: 700;
            color: #d4af37;
            margin-bottom: 10px;
          }
          .gift-card-code {
            font-size: 28px;
            font-weight: 700;
            color: #1a1a1a;
            font-family: "Courier New", monospace;
            letter-spacing: 2px;
            margin: 20px 0;
            padding: 15px;
            background-color: #ffffff;
            border-radius: 10px;
            border: 2px solid #d4af37;
          }
          .gift-card-label {
            font-size: 12px;
            text-transform: uppercase;
            color: #808080;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }
          .details {
            background-color: #f9f7f2;
            border-left: 4px solid #d4af37;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .detail-label {
            color: #808080;
            font-weight: 700;
          }
          .detail-value {
            color: #1a1a1a;
          }
          .info {
            background-color: #e8f4f8;
            border-left: 4px solid #108a8a;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
            font-size: 13px;
            color: #1a1a1a;
          }
          .footer {
            text-align: center;
            padding: 20px;
            background-color: #f9f7f2;
            border-top: 1px solid #e8dcca;
            font-size: 12px;
            color: #808080;
          }
          .contact {
            color: #d4af37;
            text-decoration: none;
            font-weight: 700;
          }
          ul {
            margin: 15px 0;
            padding-left: 20px;
          }
          li {
            margin-bottom: 8px;
            color: #1a1a1a;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 48px; margin-bottom: 10px;">✨</div>
            <h1>Carte cadeau Léa Beauté</h1>
          </div>
          <div class="content">
            <div class="greeting">Bonjour ${displayName},</div>
            <p>Merci pour votre achat et votre confiance envers <strong>Léa Beauté</strong>.</p>
            <p>Votre carte cadeau de <strong>${amount}€</strong> est activée. Vous la retrouvez aussi en <strong>PDF en pièce jointe</strong>, prête à être imprimée ou partagée.</p>
            <div class="gift-card">
              <div class="gift-card-label">Code de votre carte</div>
              <div class="gift-card-code">${giftCardCode}</div>
              <div style="color: #808080; font-size: 12px;">À présenter lors de votre visite</div>
            </div>
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Montant :</span>
                <span class="detail-value"><strong>${amount}€</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Valide jusqu'au :</span>
                <span class="detail-value"><strong>${formattedExpiry}</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Durée de validité :</span>
                <span class="detail-value"><strong>2 ans</strong></span>
              </div>
            </div>
            <div class="info">
              <strong>Conditions d'utilisation :</strong>
              <ul>
                <li>Valable 2 ans à partir de la date d'achat</li>
                <li>Utilisable sur toutes les prestations de l'institut</li>
                <li>Non remboursable et non transférable</li>
                <li>À présenter en version papier ou numérique</li>
              </ul>
            </div>
            <div class="info" style="background-color: #f6efe4; border-left-color: #d4af37;">
              <strong>Merci pour votre fidélité :</strong>
              <ul>
                <li>Conservez cet email pour retrouver facilement votre carte cadeau</li>
                <li>Pensez à réserver à l'avance pour bénéficier de plus de créneaux</li>
                <li>Nous sommes ravis de vous accompagner pour vos prochains soins</li>
              </ul>
            </div>
            <p>Pour réserver votre prestation, veuillez nous contacter :</p>
            <p style="text-align: center; font-size: 16px;">
              <strong>02 33 21 48 19</strong><br />
              Valognes, Normandie
            </p>
          </div>
          <div class="footer">
            <p><strong>Léa Beauté Valognes</strong></p>
            <p>Institut de beauté - Soins esthétiques & bien-être</p>
            <p>Tél. : <a href="tel:0233214819" class="contact">02 33 21 48 19</a></p>
            <p style="margin-top: 15px; border-top: 1px solid #e8dcca; padding-top: 10px;">
              Merci de votre confiance !
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateGiftCardEmailText(recipientName, giftCardCode, amount, expiresAt, buyerName) {
  const displayName = recipientName || buyerName;
  const formattedExpiry = formatExpiryDate(expiresAt);

  return [
    `Bonjour ${displayName},`,
    "",
    "Merci pour votre achat et votre confiance envers Léa Beauté.",
    `Votre carte cadeau de ${amount}EUR est active.`,
    "Vous trouverez la carte cadeau en PDF en pièce jointe à cet email.",
    "",
    `Code carte cadeau : ${giftCardCode}`,
    `Montant : ${amount}EUR`,
    `Valable jusqu'au : ${formattedExpiry}`,
    "",
    "Conditions : valable 2 ans, non remboursable, à présenter en version papier ou numérique.",
    "",
    "Réservation : 02 33 21 48 19",
    "Léa Beauté Valognes",
  ].join("\n");
}

function generateGiftCardPdfBuffer({ recipientName, giftCardCode, amount, expiresAt, buyerName }) {
  const displayName = recipientName || buyerName;
  const formattedExpiry = formatExpiryDate(expiresAt);
  let PDFDocument;

  try {
    PDFDocument = require("pdfkit");
    if (PDFDocument && typeof PDFDocument === "object" && PDFDocument.default) {
      PDFDocument = PDFDocument.default;
    }
  } catch (error) {
    const missingDependencyError = new Error("PDF generation unavailable: pdfkit dependency is missing");
    missingDependencyError.cause = error;
    throw missingDependencyError;
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.info.Title = "Carte cadeau Lea Beaute";
    doc.info.Author = "Lea Beaute Valognes";

    doc.roundedRect(40, 40, 515, 760, 14).lineWidth(1).strokeColor("#d4af37").stroke();

    doc.rect(40, 40, 515, 120).fill("#f4ead4");
    doc.fillColor("#7a5f1a").fontSize(14).text("LEA BEAUTE VALOGNES", 60, 70);
    doc.fillColor("#1a1a1a").fontSize(28).text("CARTE CADEAU", 60, 95);

    doc.fillColor("#1a1a1a").fontSize(12).text(`Bonjour ${displayName},`, 60, 190);
    doc
      .fontSize(11)
      .text(
        "Merci pour votre achat et votre confiance. Cette carte cadeau peut etre imprimee ou presentee sur mobile lors de votre venue.",
        60,
        212,
        { width: 470, lineGap: 4 },
      );

    doc.roundedRect(60, 290, 475, 180, 10).lineWidth(1).strokeColor("#d4af37").stroke();
    doc.fillColor("#808080").fontSize(11).text("MONTANT", 80, 320);
    doc.fillColor("#d4af37").fontSize(42).text(`${amount} EUR`, 80, 340);

    doc.fillColor("#808080").fontSize(11).text("CODE", 80, 405);
    doc.fillColor("#1a1a1a").font("Courier-Bold").fontSize(22).text(giftCardCode, 80, 425);
    doc.font("Helvetica");

    doc.fillColor("#808080").fontSize(11).text("VALIDITE", 360, 405);
    doc.fillColor("#1a1a1a").fontSize(12).text(`Jusqu'au ${formattedExpiry}`, 360, 425);

    doc.fillColor("#1a1a1a").fontSize(11).text("Conditions d'utilisation", 60, 510);
    doc
      .fontSize(10)
      .text(
        "- Valable 2 ans a partir de la date d'achat\n- Utilisable sur les prestations de l'institut\n- Non remboursable\n- A presenter a l'institut (papier ou numerique)",
        60,
        530,
        { width: 470, lineGap: 5 },
      );

    doc.moveTo(60, 675).lineTo(535, 675).strokeColor("#e5d8bd").stroke();
    doc.fillColor("#1a1a1a").fontSize(11).text("Reservation : 02 33 21 48 19", 60, 690);
    doc.fillColor("#7a5f1a").fontSize(11).text("Merci pour votre confiance et votre fidelite.", 60, 708);

    doc.end();
  });
}

async function sendGiftCardEmail({ toEmail, recipientName, giftCardCode, amount, expiresAt, buyerName }) {
  try {
    const smtpHost = process.env.SMTP_HOST || "raisin.o2switch.net";
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpSecure = String(process.env.SMTP_SECURE || "true").toLowerCase() === "true";
    const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const emailPassword = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;
    const emailFrom = process.env.EMAIL_FROM || "no-reply@leabeautevalognes.fr";
    const emailReplyTo = process.env.EMAIL_REPLY_TO || "contact@leabeautevalognes.fr";

    if (!emailUser || !emailPassword) {
      console.warn(`SMTP non configuré. Email simulé pour ${toEmail}`);
      return true;
    }

    let attachments = [];
    try {
      const pdfBuffer = await generateGiftCardPdfBuffer({
        recipientName,
        giftCardCode,
        amount,
        expiresAt,
        buyerName,
      });
      const safeCode = String(giftCardCode || "carte-cadeau").replace(/[^A-Za-z0-9_-]/g, "-");
      attachments = [
        {
          filename: `carte-cadeau-${safeCode}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
    } catch (error) {
      console.warn(`PDF indisponible pour l'email vers ${toEmail}:`, error.message);
    }

    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    await transport.sendMail({
      from: emailFrom,
      replyTo: emailReplyTo,
      to: toEmail,
      subject: `Merci pour votre achat - Carte cadeau Lea Beaute ${amount}EUR`,
      text: generateGiftCardEmailText(recipientName, giftCardCode, amount, expiresAt, buyerName),
      html: generateGiftCardEmailHtml(recipientName, giftCardCode, amount, expiresAt, buyerName),
      attachments,
    });

    return true;
  } catch (error) {
    console.error(`Erreur d'envoi email vers ${toEmail}:`, error);
    return false;
  }
}

module.exports = {
  generateGiftCardEmailHtml,
  generateGiftCardPdfBuffer,
  sendGiftCardEmail,
};
