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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function findFirstExistingFile(paths) {
  const fs = require("fs");

  for (const filePath of paths) {
    if (filePath && fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

function findBuiltFrontendLogoPath() {
  const fs = require("fs");
  const path = require("path");
  const assetDirs = [
    path.join(__dirname, "..", "public_html", "assets"),
    path.join(__dirname, "..", "leabeautevalognes.fr", "assets"),
    path.join(__dirname, "..", "frontend", "dist", "assets"),
  ];

  for (const assetDir of assetDirs) {
    if (!fs.existsSync(assetDir)) {
      continue;
    }
    const logoFile = fs
      .readdirSync(assetDir)
      .find((fileName) => /^logo16-9_1.*\.(png|jpg|jpeg)$/i.test(fileName));
    if (logoFile) {
      return path.join(assetDir, logoFile);
    }
  }

  return null;
}

function getLogoPath() {
  const path = require("path");
  return findFirstExistingFile([
    path.join(__dirname, "assets", "logo16-9_1.png"),
    path.join(__dirname, "..", "frontend", "src", "assets", "photos", "logos", "logo16-9_1.png"),
    findBuiltFrontendLogoPath(),
  ]);
}

function normalizePersonName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function generateGiftCardEmailHtml(recipientName, giftCardCode, amount, expiresAt, buyerName, personalMessage) {
  const displayName = buyerName || recipientName;
  const firstName = String(displayName || "").trim().split(/\s+/)[0] || displayName;
  const hasRecipient = Boolean(String(recipientName || "").trim());
  const hasPersonalMessage = Boolean(String(personalMessage || "").trim());
  const isSelfGift = !hasRecipient || normalizePersonName(recipientName) === normalizePersonName(buyerName);
  const isGiftForSomeoneElse = !isSelfGift || hasPersonalMessage;
  const formattedExpiry = formatExpiryDate(expiresAt);
  const safeDisplayName = escapeHtml(displayName);
  const safeFirstName = escapeHtml(firstName);
  const safeGiftCardCode = escapeHtml(giftCardCode);
  const safeRecipientName = escapeHtml(recipientName || buyerName);
  const safePersonalMessage = escapeHtml(personalMessage);
  const personalMessageHtml = safePersonalMessage
    ? `
                      <tr>
                        <td style="padding-top:18px;">
                          <div style="font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:#8f7a70; padding-bottom:7px;">Message personnel</div>
                          <div style="background:#f7f1eb; border-left:3px solid #ab827f; color:#3a312e; font-size:15px; line-height:1.55; padding:14px 16px; font-style:italic;">"${safePersonalMessage}"</div>
                        </td>
                      </tr>`
    : "";

  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @media only screen and (max-width: 720px) {
            .shell { width: 100% !important; }
            .panel { padding: 28px 22px !important; }
            .stack { display: block !important; width: 100% !important; }
            .card { margin-top: 22px !important; }
          }
        </style>
      </head>
      <body style="margin:0; padding:0; background:#eee5dc; font-family:Arial, Helvetica, sans-serif; color:#342b28;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eee5dc; padding:34px 14px;">
          <tr>
            <td align="center">
              <table role="presentation" class="shell" width="760" cellspacing="0" cellpadding="0" style="width:760px; max-width:760px; background:#fffaf5; border:1px solid #dfd1c6;">
                <tr>
                  <td align="center" style="padding:34px 34px 28px; border-bottom:1px solid #dfd1c6; background:#fffdf9;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <img src="cid:lea-beaute-logo" width="320" alt="Léa Beauté Valognes" style="display:block; width:320px; max-width:86%; height:auto; margin:0 auto 22px;" />
                          <div style="font-size:12px; letter-spacing:.18em; text-transform:uppercase; color:#8f7a70;">Institut de beauté · Valognes</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="panel" style="padding:44px 42px 34px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td colspan="2" align="center" style="padding:0 0 34px;">
                          <div style="font-size:13px; letter-spacing:.14em; text-transform:uppercase; color:#ab827f; padding-bottom:14px;">Votre carte cadeau est prête</div>
                          <div style="font-size:31px; line-height:1.22; color:#2f2724; font-weight:700; padding:0 28px;">
                            ${isSelfGift ? "Un instant pour vous, tout en douceur" : `Un joli moment à offrir à ${safeRecipientName}`}
                          </div>
                          <div style="font-size:16px; line-height:1.75; color:#5c4d47; padding:20px 42px 0; text-align:center;">
                            ${isGiftForSomeoneElse && !isSelfGift
                              ? "Merci pour votre confiance. Vous avez choisi un cadeau attentionné, délicat et facile à offrir. Une parenthèse de soin, de calme et de bien-être attend la personne qui viendra à l’institut."
                              : "Merci pour votre confiance. Cette carte est une invitation à ralentir et à s’accorder une vraie pause : un moment pour retrouver de l’équilibre, prendre soin de soi et profiter de l’attention de l’institut."}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td class="stack" width="58%" valign="top" style="padding-right:34px;">
                          <div style="font-size:15px; color:#ab827f; padding-bottom:12px;">Bonjour ${safeFirstName},</div>
                          <h1 style="margin:0 0 18px; font-size:25px; line-height:1.25; font-weight:700; color:#2f2724;">Votre chèque cadeau Léa Beauté est joint à cet email.</h1>
                          <p style="margin:0 0 16px; font-size:16px; line-height:1.7; color:#4b403c;">
                            ${isGiftForSomeoneElse && !isSelfGift
                              ? `${safeRecipientName} pourra choisir le soin qui lui correspond et profiter d’une expérience personnalisée, dans une ambiance douce et attentionnée.`
                              : "Vous pourrez choisir le soin qui vous correspond et profiter d’une expérience personnalisée, dans une ambiance douce et attentionnée."}
                          </p>
                          <p style="margin:0; font-size:16px; line-height:1.7; color:#4b403c;">
                            ${isGiftForSomeoneElse && !isSelfGift
                              ? "Vous avez fait un choix sûr : le PDF joint peut être imprimé, transféré ou présenté directement sur mobile."
                              : "Le PDF joint peut être imprimé, conservé sur mobile ou présenté directement lors de votre venue."}
                          </p>
                        </td>
                        <td class="stack card" width="42%" valign="top">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4eee6; border:1px solid #d8c7ba; box-shadow:0 10px 24px rgba(70, 48, 40, 0.08);">
                            <tr>
                              <td style="padding:28px;">
                                <div style="font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:#8f7a70;">Chèque cadeau</div>
                                <div style="font-size:44px; line-height:1; font-weight:700; color:#ab827f; padding:12px 0 22px;">${amount} €</div>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td style="padding:10px 0; border-top:1px solid #d8c7ba; font-size:13px; color:#8f7a70;">Bénéficiaire</td>
                                    <td align="right" style="padding:10px 0; border-top:1px solid #d8c7ba; font-size:14px; color:#342b28; font-weight:700;">${safeRecipientName}</td>
                                  </tr>
                                  <tr>
                                    <td style="padding:10px 0; border-top:1px solid #d8c7ba; font-size:13px; color:#8f7a70;">Code</td>
                                    <td align="right" style="padding:10px 0; border-top:1px solid #d8c7ba; font-size:15px; color:#342b28; font-weight:700; letter-spacing:.04em;">${safeGiftCardCode}</td>
                                  </tr>
                                  <tr>
                                    <td style="padding:10px 0 0; border-top:1px solid #d8c7ba; font-size:13px; color:#8f7a70;">Valable jusqu’au</td>
                                    <td align="right" style="padding:10px 0 0; border-top:1px solid #d8c7ba; font-size:14px; color:#342b28; font-weight:700;">${formattedExpiry}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="panel" style="padding:0 42px 38px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      ${personalMessageHtml}
                      <tr>
                        <td style="padding-top:24px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #dfd1c6; border-bottom:1px solid #dfd1c6;">
                            <tr>
                              <td class="stack" valign="top" width="50%" style="padding:20px 26px 20px 0;">
                                <div style="font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:#8f7a70; padding-bottom:10px;">Utilisation</div>
                                <div style="font-size:14px; line-height:1.65; color:#4b403c;">Présentez le PDF en pièce jointe lors du rendez-vous, en version papier ou numérique.</div>
                              </td>
                              <td class="stack" valign="top" width="50%" style="padding:20px 0 20px 26px;">
                                <div style="font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:#8f7a70; padding-bottom:10px;">Conditions</div>
                                <div style="font-size:14px; line-height:1.65; color:#4b403c;">Valable 2 ans à partir de la date d’achat, utilisable sur les prestations de l’institut, non remboursable.</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:26px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#342b28;">
                            <tr>
                              <td class="stack" width="64%" style="padding:26px 28px; color:#fffaf5;">
                                <div style="font-size:18px; font-weight:700; padding-bottom:6px;">Préparer le rendez-vous</div>
                                <div style="font-size:14px; line-height:1.6; color:#e8dcd2;">Un appel suffit pour choisir la prestation, réserver le bon créneau et préparer une expérience parfaitement adaptée.</div>
                              </td>
                              <td class="stack" width="36%" align="right" style="padding:26px 28px;">
                                <a href="tel:0233214819" style="color:#fffaf5; font-size:20px; font-weight:700; text-decoration:none; white-space:nowrap;">02 33 21 48 19</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 34px; border-top:1px solid #dfd1c6; color:#7b6a62; font-size:12px; line-height:1.55;">
                    Léa Beauté Valognes · 7 Rue du Palais de Justice, 50700 Valognes · leabeautevalognes.fr
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateGiftCardEmailText(recipientName, giftCardCode, amount, expiresAt, buyerName, personalMessage) {
  const displayName = buyerName || recipientName;
  const firstName = String(displayName || "").trim().split(/\s+/)[0] || displayName;
  const formattedExpiry = formatExpiryDate(expiresAt);
  const personalMessageLines = personalMessage
    ? ["", `Message personnel : ${personalMessage}`]
    : [];

  return [
    `Bonjour ${firstName},`,
    "",
    "Merci pour votre achat et votre confiance envers Léa Beauté.",
    `Votre carte cadeau de ${amount}EUR est active.`,
    "Vous trouverez la carte cadeau en PDF en pièce jointe à cet email.",
    "",
    `Code carte cadeau : ${giftCardCode}`,
    `Montant : ${amount}EUR`,
    `Valable jusqu'au : ${formattedExpiry}`,
    ...personalMessageLines,
    "",
    "Conditions : valable 2 ans, non remboursable, à présenter en version papier ou numérique.",
    "",
    "Réservation : 02 33 21 48 19",
    "Léa Beauté Valognes",
  ].join("\n");
}

function generateGiftCardPdfBuffer({ recipientName, giftCardCode, amount, expiresAt, buyerName, personalMessage }) {
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
    const doc = new PDFDocument({ size: [595.28, 419.53], margin: 0 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.info.Title = "Chèque cadeau Léa Beauté";
    doc.info.Author = "Léa Beauté Valognes";

    const pageWidth = 595.28;
    const pageHeight = 419.53;
    const bg = "#f4eee6";
    const accent = "#ab827f";
    const text = "#38302e";
    const muted = "#7a6963";
    const rule = "#c7b8ad";

    const wrapText = (value, maxCharsPerLine) => {
      const words = String(value || "").split(/\s+/).filter(Boolean);
      const lines = [];
      let current = "";
      for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (next.length <= maxCharsPerLine) {
          current = next;
        } else {
          if (current) lines.push(current);
          current = word;
        }
      }
      if (current) lines.push(current);
      return lines;
    };

    const textY = (pdfLibY, size) => pageHeight - pdfLibY - size;
    const lineY = (pdfLibY) => pageHeight - pdfLibY;
    const imageY = (pdfLibY, height) => pageHeight - pdfLibY - height;

    const drawTextAtPdfLibY = (value, x, pdfLibY, size, font, color, options = {}) => {
      doc
        .font(font)
        .fontSize(size)
        .fillColor(color)
        .text(value, x, textY(pdfLibY, size), { lineBreak: false, ...options });
    };

    const drawCenteredText = (value, pdfLibY, size, font, color) => {
      const width = doc.font(font).fontSize(size).widthOfString(value);
      drawTextAtPdfLibY(value, (pageWidth - width) / 2, pdfLibY, size, font, color);
    };

    const drawLineField = (label, value, pdfLibY) => {
      drawTextAtPdfLibY(label, 52, pdfLibY + 4, 12, "Helvetica", accent);
      doc.moveTo(150, lineY(pdfLibY)).lineTo(pageWidth - 54, lineY(pdfLibY)).lineWidth(1).strokeColor(rule).stroke();
      drawTextAtPdfLibY(String(value || "-"), 158, pdfLibY + 5, 15, "Helvetica-Bold", text, {
        width: pageWidth - 212,
      });
    };

    doc.rect(0, 0, pageWidth, pageHeight).fill(bg);

    try {
      const logoPath = getLogoPath();
      if (logoPath) {
        doc.image(logoPath, (pageWidth - 66) / 2, imageY(pageHeight - 86, 54), { fit: [66, 54] });
      } else {
        drawCenteredText("Léa Beauté", pageHeight - 78, 18, "Helvetica-Bold", accent);
      }
    } catch (error) {
      drawCenteredText("Léa Beauté", pageHeight - 78, 18, "Helvetica-Bold", accent);
    }

    drawCenteredText("CHÈQUE CADEAU", pageHeight - 126, 22, "Helvetica-Bold", accent);

    drawLineField("Pour :", displayName, pageHeight - 178);
    drawLineField("De la part de :", buyerName, pageHeight - 218);

    drawTextAtPdfLibY("Montant", 52, pageHeight - 268, 10, "Helvetica", muted);
    drawTextAtPdfLibY(`${amount} EUR`, 52, pageHeight - 290, 22, "Helvetica-Bold", accent);
    drawTextAtPdfLibY("N° du bon", 250, pageHeight - 268, 10, "Helvetica", muted);
    drawTextAtPdfLibY(giftCardCode || "-", 250, pageHeight - 286, 14, "Helvetica-Bold", text, {
      width: 150,
    });
    drawTextAtPdfLibY("Valable jusqu'au", 430, pageHeight - 268, 10, "Helvetica", muted);
    drawTextAtPdfLibY(formattedExpiry || "-", 430, pageHeight - 286, 12, "Helvetica-Bold", text, {
      width: 110,
    });

    drawTextAtPdfLibY("Conditions d'utilisation", 52, 118, 11, "Helvetica-Bold", accent);
    [
      "• Valable 2 ans à partir de la date d'achat",
      "• Utilisable sur toutes les prestations de l'institut",
      "• Non remboursable et non transférable",
      "• À présenter en version papier ou numérique",
    ].forEach((condition, index) => {
      drawTextAtPdfLibY(condition, 60, 100 - index * 14, 10, "Helvetica", text, {
        width: 250,
      });
    });

    if (personalMessage) {
      const messageLines = wrapText(personalMessage, 34).slice(0, 4);
      drawTextAtPdfLibY("Message personnel", 322, 118, 11, "Helvetica-Bold", accent);
      messageLines.forEach((line, index) => {
        drawTextAtPdfLibY(line, 322, 100 - index * 14, 11, "Helvetica", text, {
          width: 220,
        });
      });
    }

    doc.moveTo(52, lineY(52)).lineTo(pageWidth - 52, lineY(52)).lineWidth(1).strokeColor(rule).stroke();
    drawTextAtPdfLibY("7 Rue du Palais de Justice - 50700 Valognes", 52, 34, 10, "Helvetica", text);
    drawTextAtPdfLibY("Tél. 02 33 21 48 19", 52, 20, 10, "Helvetica", text);
    drawTextAtPdfLibY("leabeautevalognes.fr", 388, 20, 10, "Helvetica-Bold", accent);

    doc.end();
  });
}

async function sendGiftCardEmail({ toEmail, recipientName, giftCardCode, amount, expiresAt, buyerName, personalMessage }) {
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
        personalMessage,
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

    const logoPath = getLogoPath();
    if (logoPath) {
      attachments.push({
        filename: "logo-lea-beaute.png",
        path: logoPath,
        cid: "lea-beaute-logo",
      });
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
      text: generateGiftCardEmailText(recipientName, giftCardCode, amount, expiresAt, buyerName, personalMessage),
      html: generateGiftCardEmailHtml(recipientName, giftCardCode, amount, expiresAt, buyerName, personalMessage),
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
