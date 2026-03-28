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
            <div class="greeting">Bienvenue, ${displayName} !</div>
            <p>Vous avez reçu une carte cadeau <strong>Léa Beauté</strong> d'une valeur de <strong>${amount}€</strong>.</p>
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

async function sendGiftCardEmail({ toEmail, recipientName, giftCardCode, amount, expiresAt, buyerName }) {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailFrom = process.env.EMAIL_FROM || emailUser;

    if (!emailUser || !emailPassword) {
      console.warn(`SMTP non configuré. Email simulé pour ${toEmail}`);
      return true;
    }

    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    await transport.sendMail({
      from: emailFrom,
      to: toEmail,
      subject: `Votre carte cadeau Léa Beauté - ${amount}€`,
      html: generateGiftCardEmailHtml(recipientName, giftCardCode, amount, expiresAt, buyerName),
    });

    return true;
  } catch (error) {
    console.error(`Erreur d'envoi email vers ${toEmail}:`, error);
    return false;
  }
}

module.exports = {
  generateGiftCardEmailHtml,
  sendGiftCardEmail,
};
