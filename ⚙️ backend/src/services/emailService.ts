/**
 * E-Mail-Service für DressForPleasure Backend
 * 
 * Dieser Service behandelt:
 * - Bestellbestätigungen
 * - Zahlungsbenachrichtigungen
 * - Newsletter-Versand
 * - DSGVO-konforme E-Mail-Verarbeitung
 */

import nodemailer from 'nodemailer';
import { db } from '../db/connection';
import { auditLogs } from '../db/schema';

// E-Mail-Templates
interface OrderConfirmationData {
  orderNumber: string;
  totalAmount: string;
  customerName: string;
  items?: any[];
}

interface PaymentFailedData {
  orderNumber: string;
  failureReason: string;
  customerName: string;
}

interface PasswordResetData {
  resetToken: string;
  customerName: string;
  expiryTime: Date;
}

// Nodemailer Transporter Setup
let transporter: nodemailer.Transporter;

/**
 * E-Mail-Service initialisieren
 */
export function initializeEmailService(): void {
  try {
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true für 465, false für andere Ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    };

    // Für lokale Entwicklung: Ethereal Email für Testing
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      // Verwende Ethereal für Development
      transporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.password'
        }
      });
      console.log('📧 E-Mail-Service: Ethereal Email für Development konfiguriert');
    } else {
      transporter = nodemailer.createTransporter(emailConfig);
      console.log('📧 E-Mail-Service: SMTP-Server konfiguriert');
    }

  } catch (error) {
    console.error('Fehler bei E-Mail-Service-Initialisierung:', error);
  }
}

/**
 * Bestellbestätigung senden
 */
export async function sendOrderConfirmationEmail(
  customerEmail: string, 
  data: OrderConfirmationData
): Promise<boolean> {
  try {
    if (!transporter) {
      initializeEmailService();
    }

    const htmlContent = generateOrderConfirmationHTML(data);
    const textContent = generateOrderConfirmationText(data);

    const mailOptions = {
      from: {
        name: 'DressForPleasure',
        address: process.env.FROM_EMAIL || 'noreply@dressforp.com'
      },
      to: customerEmail,
      subject: `Bestellbestätigung #${data.orderNumber} - DressForPleasure`,
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Category': 'order-confirmation',
        'X-Order-Number': data.orderNumber
      }
    };

    const result = await transporter.sendMail(mailOptions);
    
    // Audit-Log für E-Mail-Versand
    await logEmailActivity('order_confirmation', customerEmail, data.orderNumber, true);
    
    console.log(`✅ Bestellbestätigung gesendet an ${customerEmail}: ${result.messageId}`);
    return true;

  } catch (error) {
    console.error('Fehler beim Senden der Bestellbestätigung:', error);
    await logEmailActivity('order_confirmation', customerEmail, data.orderNumber, false);
    return false;
  }
}

/**
 * Zahlungsfehlschlag-E-Mail senden
 */
export async function sendPaymentFailedEmail(
  customerEmail: string, 
  data: PaymentFailedData
): Promise<boolean> {
  try {
    if (!transporter) {
      initializeEmailService();
    }

    const htmlContent = generatePaymentFailedHTML(data);
    const textContent = generatePaymentFailedText(data);

    const mailOptions = {
      from: {
        name: 'DressForPleasure',
        address: process.env.FROM_EMAIL || 'noreply@dressforp.com'
      },
      to: customerEmail,
      subject: `Zahlungsproblem bei Bestellung #${data.orderNumber} - DressForPleasure`,
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Category': 'payment-failed',
        'X-Order-Number': data.orderNumber
      }
    };

    const result = await transporter.sendMail(mailOptions);
    
    await logEmailActivity('payment_failed', customerEmail, data.orderNumber, true);
    
    console.log(`📧 Zahlungsfehlschlag-E-Mail gesendet an ${customerEmail}: ${result.messageId}`);
    return true;

  } catch (error) {
    console.error('Fehler beim Senden der Zahlungsfehlschlag-E-Mail:', error);
    await logEmailActivity('payment_failed', customerEmail, data.orderNumber, false);
    return false;
  }
}

/**
 * Passwort-Reset-E-Mail senden
 */
export async function sendPasswordResetEmail(
  customerEmail: string, 
  data: PasswordResetData
): Promise<boolean> {
  try {
    if (!transporter) {
      initializeEmailService();
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${data.resetToken}`;
    
    const htmlContent = generatePasswordResetHTML({ ...data, resetUrl });
    const textContent = generatePasswordResetText({ ...data, resetUrl });

    const mailOptions = {
      from: {
        name: 'DressForPleasure',
        address: process.env.FROM_EMAIL || 'noreply@dressforp.com'
      },
      to: customerEmail,
      subject: 'Passwort zurücksetzen - DressForPleasure',
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Category': 'password-reset'
      }
    };

    const result = await transporter.sendMail(mailOptions);
    
    await logEmailActivity('password_reset', customerEmail, data.resetToken, true);
    
    console.log(`🔑 Passwort-Reset-E-Mail gesendet an ${customerEmail}: ${result.messageId}`);
    return true;

  } catch (error) {
    console.error('Fehler beim Senden der Passwort-Reset-E-Mail:', error);
    await logEmailActivity('password_reset', customerEmail, data.resetToken, false);
    return false;
  }
}

/**
 * Newsletter-E-Mail senden
 */
export async function sendNewsletterEmail(
  customerEmail: string,
  subject: string,
  content: string
): Promise<boolean> {
  try {
    if (!transporter) {
      initializeEmailService();
    }

    const htmlContent = generateNewsletterHTML(content);

    const mailOptions = {
      from: {
        name: 'DressForPleasure',
        address: process.env.FROM_EMAIL || 'noreply@dressforp.com'
      },
      to: customerEmail,
      subject: `${subject} - DressForPleasure`,
      html: htmlContent,
      headers: {
        'X-Category': 'newsletter',
        'List-Unsubscribe': `<${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(customerEmail)}>`
      }
    };

    const result = await transporter.sendMail(mailOptions);
    
    await logEmailActivity('newsletter', customerEmail, subject, true);
    
    console.log(`📰 Newsletter gesendet an ${customerEmail}: ${result.messageId}`);
    return true;

  } catch (error) {
    console.error('Fehler beim Senden des Newsletters:', error);
    await logEmailActivity('newsletter', customerEmail, subject, false);
    return false;
  }
}

// ========================
// HTML-TEMPLATE-GENERATOREN
// ========================

/**
 * Bestellbestätigung HTML generieren
 */
function generateOrderConfirmationHTML(data: OrderConfirmationData): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bestellbestätigung</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60; }
        .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
        .button { background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
        .amount { font-size: 1.2em; font-weight: bold; color: #27ae60; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛍️ DressForPleasure</h1>
        <p>Vielen Dank für Ihre Bestellung!</p>
    </div>
    
    <div class="content">
        <h2>Hallo ${data.customerName},</h2>
        
        <p>Ihre Bestellung wurde erfolgreich aufgegeben und wird derzeit bearbeitet.</p>
        
        <div class="order-details">
            <h3>Bestelldetails</h3>
            <p><strong>Bestellnummer:</strong> #${data.orderNumber}</p>
            <p><strong>Gesamtbetrag:</strong> <span class="amount">${data.totalAmount} €</span></p>
            <p><strong>Bestelldatum:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
        </div>
        
        <p>Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versandt wurde.</p>
        
        <a href="${process.env.FRONTEND_URL}/account/orders" class="button">
            Bestellung verfolgen
        </a>
        
        <div class="footer">
            <p>Bei Fragen erreichen Sie uns unter <a href="mailto:support@dressforp.com">support@dressforp.com</a></p>
            <p>DressForPleasure - Ihr Fashion Online-Shop</p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Bestellbestätigung Text generieren
 */
function generateOrderConfirmationText(data: OrderConfirmationData): string {
  return `
🛍️ DressForPleasure - Bestellbestätigung

Hallo ${data.customerName},

vielen Dank für Ihre Bestellung! Ihre Bestellung wurde erfolgreich aufgegeben und wird derzeit bearbeitet.

Bestelldetails:
- Bestellnummer: #${data.orderNumber}
- Gesamtbetrag: ${data.totalAmount} €
- Bestelldatum: ${new Date().toLocaleDateString('de-DE')}

Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versandt wurde.

Bestellung verfolgen: ${process.env.FRONTEND_URL}/account/orders

Bei Fragen erreichen Sie uns unter support@dressforp.com

Vielen Dank für Ihr Vertrauen!
DressForPleasure Team
  `;
}

/**
 * Zahlungsfehlschlag HTML generieren
 */
function generatePaymentFailedHTML(data: PaymentFailedData): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zahlungsproblem</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚠️ Zahlungsproblem</h1>
        <p>DressForPleasure</p>
    </div>
    
    <div class="content">
        <h2>Hallo ${data.customerName},</h2>
        
        <div class="alert">
            <p><strong>Bei der Zahlung Ihrer Bestellung #${data.orderNumber} ist ein Problem aufgetreten:</strong></p>
            <p><em>${data.failureReason}</em></p>
        </div>
        
        <p>Keine Sorge! Ihre Bestellung wurde reserviert und wartet auf Sie.</p>
        
        <p>Bitte versuchen Sie die Zahlung erneut oder verwenden Sie eine andere Zahlungsmethode.</p>
        
        <a href="${process.env.FRONTEND_URL}/checkout/retry?order=${data.orderNumber}" class="button">
            Zahlung erneut versuchen
        </a>
        
        <div class="footer">
            <p>Bei weiteren Fragen erreichen Sie uns unter <a href="mailto:support@dressforp.com">support@dressforp.com</a></p>
            <p>DressForPleasure Team</p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Zahlungsfehlschlag Text generieren
 */
function generatePaymentFailedText(data: PaymentFailedData): string {
  return `
⚠️ DressForPleasure - Zahlungsproblem

Hallo ${data.customerName},

bei der Zahlung Ihrer Bestellung #${data.orderNumber} ist ein Problem aufgetreten:

${data.failureReason}

Keine Sorge! Ihre Bestellung wurde reserviert und wartet auf Sie.

Bitte versuchen Sie die Zahlung erneut oder verwenden Sie eine andere Zahlungsmethode.

Zahlung erneut versuchen: ${process.env.FRONTEND_URL}/checkout/retry?order=${data.orderNumber}

Bei weiteren Fragen erreichen Sie uns unter support@dressforp.com

DressForPleasure Team
  `;
}

/**
 * Passwort-Reset HTML generieren
 */
function generatePasswordResetHTML(data: PasswordResetData & { resetUrl: string }): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Passwort zurücksetzen</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3498db; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
        .security-note { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 0.9em; }
        .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔑 Passwort zurücksetzen</h1>
        <p>DressForPleasure</p>
    </div>
    
    <div class="content">
        <h2>Hallo ${data.customerName},</h2>
        
        <p>Sie haben eine Passwort-Zurücksetzung für Ihr DressForPleasure-Konto angefordert.</p>
        
        <p>Klicken Sie auf den folgenden Button, um Ihr Passwort zurückzusetzen:</p>
        
        <a href="${data.resetUrl}" class="button">
            Passwort zurücksetzen
        </a>
        
        <div class="security-note">
            <p><strong>Sicherheitshinweis:</strong></p>
            <ul>
                <li>Dieser Link ist nur für 24 Stunden gültig</li>
                <li>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren</li>
                <li>Teilen Sie diesen Link niemals mit anderen</li>
            </ul>
        </div>
        
        <p>Gültig bis: ${data.expiryTime.toLocaleDateString('de-DE')} ${data.expiryTime.toLocaleTimeString('de-DE')}</p>
        
        <div class="footer">
            <p>Bei Fragen erreichen Sie uns unter <a href="mailto:support@dressforp.com">support@dressforp.com</a></p>
            <p>DressForPleasure Team</p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Passwort-Reset Text generieren
 */
function generatePasswordResetText(data: PasswordResetData & { resetUrl: string }): string {
  return `
🔑 DressForPleasure - Passwort zurücksetzen

Hallo ${data.customerName},

Sie haben eine Passwort-Zurücksetzung für Ihr DressForPleasure-Konto angefordert.

Passwort zurücksetzen: ${data.resetUrl}

Sicherheitshinweise:
- Dieser Link ist nur für 24 Stunden gültig
- Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren
- Teilen Sie diesen Link niemals mit anderen

Gültig bis: ${data.expiryTime.toLocaleDateString('de-DE')} ${data.expiryTime.toLocaleTimeString('de-DE')}

Bei Fragen erreichen Sie uns unter support@dressforp.com

DressForPleasure Team
  `;
}

/**
 * Newsletter HTML generieren
 */
function generateNewsletterHTML(content: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Newsletter</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛍️ DressForPleasure Newsletter</h1>
    </div>
    
    <div class="content">
        ${content}
    </div>
    
    <div class="footer">
        <p>Sie erhalten diese E-Mail, weil Sie sich für den DressForPleasure Newsletter angemeldet haben.</p>
        <p><a href="${process.env.FRONTEND_URL}/unsubscribe">Newsletter abbestellen</a></p>
        <p>DressForPleasure - Ihr Fashion Online-Shop</p>
    </div>
</body>
</html>
  `;
}

// ========================
// AUDIT-LOGGING
// ========================

/**
 * E-Mail-Aktivität protokollieren
 */
async function logEmailActivity(
  emailType: string,
  recipientEmail: string,
  referenceId: string,
  success: boolean
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      entityType: 'email',
      entityId: 0,
      action: `email_${emailType}`,
      performedByEmail: 'email-service',
      changes: {
        type: emailType,
        recipient: recipientEmail,
        reference: referenceId,
        success,
        timestamp: new Date()
      },
      gdprLegalBasis: 'contract'
    });
  } catch (error) {
    console.error('Fehler beim Protokollieren der E-Mail-Aktivität:', error);
  }
}

/**
 * E-Mail-Service-Status prüfen
 */
export async function checkEmailServiceHealth(): Promise<{ status: string; details?: any }> {
  try {
    if (!transporter) {
      initializeEmailService();
    }

    const verification = await transporter.verify();
    
    if (verification) {
      return { status: 'healthy' };
    } else {
      return { status: 'unhealthy', details: 'SMTP-Verbindung fehlgeschlagen' };
    }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      details: `E-Mail-Service-Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` 
    };
  }
}

// E-Mail-Service beim Import initialisieren
initializeEmailService();

// ========================
// EXPORT
// ========================

export default {
  initializeEmailService,
  sendOrderConfirmationEmail,
  sendPaymentFailedEmail,
  sendPasswordResetEmail,
  sendNewsletterEmail,
  checkEmailServiceHealth
};
