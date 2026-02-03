import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging
import os

logger = logging.getLogger(__name__)

def generate_gift_card_email_html(
    recipient_name: str,
    gift_card_code: str,
    amount: float,
    expires_at: str,
    buyer_name: str
) -> str:
    """Generate HTML email template for gift card"""
    
    # Format expiration date
    try:
        exp_date = datetime.fromisoformat(expires_at).strftime("%d %B %Y")
    except:
        exp_date = expires_at

    display_name = recipient_name if recipient_name else buyer_name
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: 'Arial', sans-serif;
                background-color: #F9F7F2;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 32px;
                font-weight: bold;
            }}
            .logo {{
                font-size: 48px;
                margin-bottom: 10px;
            }}
            .content {{
                padding: 40px 30px;
                color: #1A1A1A;
            }}
            .greeting {{
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 20px;
                color: #1A1A1A;
            }}
            .gift-card {{
                background: linear-gradient(135deg, #F9F7F2 0%, #EDE7D9 100%);
                border: 3px solid #D4AF37;
                border-radius: 15px;
                padding: 30px;
                margin: 30px 0;
                text-align: center;
                box-shadow: 0 5px 20px rgba(212, 175, 55, 0.2);
            }}
            .gift-card-amount {{
                font-size: 48px;
                font-weight: bold;
                color: #D4AF37;
                margin-bottom: 10px;
            }}
            .gift-card-code {{
                font-size: 28px;
                font-weight: bold;
                color: #1A1A1A;
                font-family: 'Courier New', monospace;
                letter-spacing: 2px;
                margin: 20px 0;
                padding: 15px;
                background-color: white;
                border-radius: 10px;
                border: 2px solid #D4AF37;
            }}
            .gift-card-label {{
                font-size: 12px;
                text-transform: uppercase;
                color: #808080;
                letter-spacing: 1px;
                margin-bottom: 10px;
            }}
            .details {{
                background-color: #F9F7F2;
                border-left: 4px solid #D4AF37;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .detail-row {{
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 14px;
            }}
            .detail-label {{
                color: #808080;
                font-weight: bold;
            }}
            .detail-value {{
                color: #1A1A1A;
            }}
            .info {{
                background-color: #E8F4F8;
                border-left: 4px solid #108A8A;
                padding: 15px;
                margin: 20px 0;
                border-radius: 8px;
                font-size: 13px;
                color: #1A1A1A;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                background-color: #F9F7F2;
                border-top: 1px solid #E8DCCA;
                font-size: 12px;
                color: #808080;
            }}
            .footer p {{
                margin: 5px 0;
            }}
            .contact {{
                color: #D4AF37;
                text-decoration: none;
                font-weight: bold;
            }}
            ul {{
                margin: 15px 0;
                padding-left: 20px;
            }}
            li {{
                margin-bottom: 8px;
                color: #1A1A1A;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">✨</div>
                <h1>Carte cadeau Léa Beauté</h1>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Bienvenue, {display_name} !
                </div>
                
                <p>Vous avez reçu une carte cadeau <strong>Léa Beauté</strong> d'une valeur de <strong>{amount}€</strong>.</p>
                
                <div class="gift-card">
                    <div class="gift-card-label">Code de votre carte</div>
                    <div class="gift-card-code">{gift_card_code}</div>
                    <div style="color: #808080; font-size: 12px;">À présenter lors de votre visite</div>
                </div>
                
                <div class="details">
                    <div class="detail-row">
                        <span class="detail-label">Montant :</span>
                        <span class="detail-value"><strong>{amount}€</strong></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Valide jusqu'au :</span>
                        <span class="detail-value"><strong>{exp_date}</strong></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Durée de validité :</span>
                        <span class="detail-value"><strong>6 mois</strong></span>
                    </div>
                </div>
                
                <div class="info">
                    <strong>ℹ️ Conditions d'utilisation :</strong>
                    <ul>
                        <li>Valable 6 mois à partir de la date d'achat</li>
                        <li>Utilisable sur toutes les prestations de l'institut</li>
                        <li>Non remboursable et non transférable</li>
                        <li>À présenter en version papier ou numérique</li>
                    </ul>
                </div>
                
                <p>Pour réserver votre prestation, veuillez nous contacter :</p>
                <p style="text-align: center; font-size: 16px;">
                    <strong>☎️ 02 33 21 48 19</strong><br/>
                    📍 Valognes, Normandie
                </p>
            </div>
            
            <div class="footer">
                <p><strong>Léa Beauté Valognes</strong></p>
                <p>Institut de beauté - Soins esthétiques & bien-être</p>
                <p>Tél. : <a href="tel:0233214819" class="contact">02 33 21 48 19</a></p>
                <p style="margin-top: 15px; border-top: 1px solid #E8DCCA; padding-top: 10px;">
                    Merci de votre confiance ! ✨
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    return html


async def send_gift_card_email(
    to_email: str,
    recipient_name: str,
    gift_card_code: str,
    amount: float,
    expires_at: str,
    buyer_name: str
) -> bool:
    """Send gift card email via SMTP"""
    try:
        # Get SMTP credentials from environment
        email_user = os.getenv('EMAIL_USER')
        email_password = os.getenv('EMAIL_PASSWORD')
        email_from = os.getenv('EMAIL_FROM', email_user)
        
        if not email_user or not email_password:
            logger.warning(f"Email credentials not configured. Email to {to_email} would be sent but SMTP not configured.")
            logger.info(f"Gift card: {recipient_name or buyer_name}, Code: {gift_card_code}, Amount: {amount}€")
            return True
        
        # Generate HTML email
        html_content = generate_gift_card_email_html(
            recipient_name or buyer_name,
            gift_card_code,
            amount,
            expires_at,
            buyer_name
        )
        
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Votre carte cadeau Léa Beauté - {amount}€'
        msg['From'] = email_from
        msg['To'] = to_email
        
        # Attach HTML content
        html_part = MIMEText(html_content, 'html', _charset='utf-8')
        msg.attach(html_part)
        
        # Send via Gmail SMTP
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(email_user, email_password)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False
