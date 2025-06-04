/**
 * Webhook-Controller für DressForPleasure Backend
 * 
 * Dieser Controller behandelt:
 * - Stripe Webhooks für Zahlungsverarbeitung
 * - Automatische Bestellstatus-Updates
 * - Product Sync Webhooks
 * - E-Mail-Benachrichtigungen
 */

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../db/connection';
import { orders, payments, auditLogs, customers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createSuccessResponse, createErrorResponse } from '../utils';
import { sendOrderConfirmationEmail, sendPaymentFailedEmail } from '../services/emailService';

// Stripe Instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ========================
// STRIPE WEBHOOKS
// ========================

/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!webhookSecret) {
      console.error('Stripe Webhook Secret nicht konfiguriert');
      res.status(500).json(createErrorResponse('Webhook-Konfiguration fehlt', 500));
      return;
    }

    let event: Stripe.Event;

    try {
      // Webhook-Signatur verifizieren
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook-Signatur-Verifizierung fehlgeschlagen:', err);
      res.status(400).json(createErrorResponse('Ungültige Webhook-Signatur', 400));
      return;
    }

    console.log(`Stripe Webhook erhalten: ${event.type}`);

    // Event-Handler basierend auf Event-Typ
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'invoice.payment_succeeded':
        // Für wiederkehrende Zahlungen (falls implementiert)
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Für Abonnements (falls implementiert)
        console.log(`Subscription Event: ${event.type}`);
        break;

      default:
        console.log(`Unbehandelter Event-Typ: ${event.type}`);
    }

    // Erfolgreiche Webhook-Verarbeitung
    res.json(createSuccessResponse({ received: true }));

  } catch (error) {
    console.error('Stripe Webhook Fehler:', error);
    res.status(500).json(createErrorResponse('Webhook-Verarbeitung fehlgeschlagen', 500));
  }
}

/**
 * Erfolgreiche Zahlung verarbeiten
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    console.log(`Payment Intent erfolgreich: ${paymentIntent.id}`);

    // Bestellung über Payment Intent ID finden
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
      .limit(1);

    if (orderResult.length === 0) {
      console.error(`Bestellung für Payment Intent ${paymentIntent.id} nicht gefunden`);
      return;
    }

    const order = orderResult[0];

    await db.transaction(async (tx) => {
      // Bestellstatus aktualisieren
      await tx
        .update(orders)
        .set({
          status: 'confirmed',
          paymentStatus: 'paid',
          processedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, order.id));

      // Zahlungs-Eintrag aktualisieren
      await tx
        .update(payments)
        .set({
          status: 'succeeded',
          stripeChargeId: paymentIntent.latest_charge as string,
          processorFee: paymentIntent.application_fee_amount ? 
            (paymentIntent.application_fee_amount / 100).toFixed(2) : null,
          processedAt: new Date(),
          metadata: paymentIntent.metadata
        })
        .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

      // Audit-Log erstellen
      await tx.insert(auditLogs).values({
        entityType: 'order',
        entityId: order.id,
        action: 'payment_succeeded',
        performedByEmail: 'stripe-webhook',
        changes: { paymentIntent: paymentIntent.id, amount: paymentIntent.amount },
        gdprLegalBasis: 'contract'
      });
    });

    // E-Mail-Benachrichtigung senden
    try {
      await sendOrderConfirmationEmail(order.customerEmail, {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        customerName: `${order.billingAddress?.firstName} ${order.billingAddress?.lastName}`.trim()
      });
      console.log(`Bestellbestätigung gesendet an: ${order.customerEmail}`);
    } catch (emailError) {
      console.error('Fehler beim Senden der Bestellbestätigung:', emailError);
    }

    console.log(`Bestellung ${order.orderNumber} erfolgreich als bezahlt markiert`);

  } catch (error) {
    console.error('Fehler bei Payment Intent Succeeded:', error);
  }
}

/**
 * Fehlgeschlagene Zahlung verarbeiten
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    console.log(`Payment Intent fehlgeschlagen: ${paymentIntent.id}`);

    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
      .limit(1);

    if (orderResult.length === 0) {
      console.error(`Bestellung für Payment Intent ${paymentIntent.id} nicht gefunden`);
      return;
    }

    const order = orderResult[0];
    const failureReason = paymentIntent.last_payment_error?.message || 'Unbekannter Fehler';

    await db.transaction(async (tx) => {
      // Zahlungs-Eintrag aktualisieren
      await tx
        .update(payments)
        .set({
          status: 'failed',
          failureReason,
          metadata: paymentIntent.metadata
        })
        .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

      // Audit-Log erstellen
      await tx.insert(auditLogs).values({
        entityType: 'order',
        entityId: order.id,
        action: 'payment_failed',
        performedByEmail: 'stripe-webhook',
        changes: { 
          paymentIntent: paymentIntent.id, 
          failureReason,
          errorCode: paymentIntent.last_payment_error?.code
        },
        gdprLegalBasis: 'contract'
      });
    });

    // E-Mail-Benachrichtigung über fehlgeschlagene Zahlung
    try {
      await sendPaymentFailedEmail(order.customerEmail, {
        orderNumber: order.orderNumber,
        failureReason,
        customerName: `${order.billingAddress?.firstName} ${order.billingAddress?.lastName}`.trim()
      });
    } catch (emailError) {
      console.error('Fehler beim Senden der Zahlungsfehlschlag-E-Mail:', emailError);
    }

    console.log(`Bestellung ${order.orderNumber} als Zahlungsfehlschlag markiert`);

  } catch (error) {
    console.error('Fehler bei Payment Intent Failed:', error);
  }
}

/**
 * Stornierte Zahlung verarbeiten
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    console.log(`Payment Intent storniert: ${paymentIntent.id}`);

    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
      .limit(1);

    if (orderResult.length === 0) {
      return;
    }

    const order = orderResult[0];

    await db.transaction(async (tx) => {
      // Bestellstatus aktualisieren
      await tx
        .update(orders)
        .set({
          status: 'cancelled',
          paymentStatus: 'cancelled',
          cancelledAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, order.id));

      // Zahlungs-Eintrag aktualisieren
      await tx
        .update(payments)
        .set({
          status: 'cancelled'
        })
        .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

      // Audit-Log erstellen
      await tx.insert(auditLogs).values({
        entityType: 'order',
        entityId: order.id,
        action: 'payment_cancelled',
        performedByEmail: 'stripe-webhook',
        changes: { paymentIntent: paymentIntent.id },
        gdprLegalBasis: 'contract'
      });
    });

    console.log(`Bestellung ${order.orderNumber} als storniert markiert`);

  } catch (error) {
    console.error('Fehler bei Payment Intent Canceled:', error);
  }
}

/**
 * Zahlung erfordert weitere Aktion (3D Secure, etc.)
 */
async function handlePaymentIntentRequiresAction(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    console.log(`Payment Intent erfordert Aktion: ${paymentIntent.id}`);

    // Status als "pending_action" markieren
    await db
      .update(payments)
      .set({
        status: 'requires_action',
        metadata: paymentIntent.metadata
      })
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

  } catch (error) {
    console.error('Fehler bei Payment Intent Requires Action:', error);
  }
}

/**
 * Chargeback/Dispute verarbeiten
 */
async function handleChargeDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  try {
    console.log(`Dispute erstellt: ${dispute.id} für Charge: ${dispute.charge}`);

    // Bestellung über Charge ID finden
    const paymentResult = await db
      .select({
        orderId: payments.orderId,
        orderNumber: orders.orderNumber,
        customerEmail: orders.customerEmail
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(eq(payments.stripeChargeId, dispute.charge as string))
      .limit(1);

    if (paymentResult.length === 0) {
      console.error(`Bestellung für Dispute ${dispute.id} nicht gefunden`);
      return;
    }

    const { orderId, orderNumber, customerEmail } = paymentResult[0];

    // Audit-Log für Dispute erstellen
    await db.insert(auditLogs).values({
      entityType: 'order',
      entityId: orderId,
      action: 'dispute_created',
      performedByEmail: 'stripe-webhook',
      changes: { 
        disputeId: dispute.id,
        reason: dispute.reason,
        amount: dispute.amount,
        status: dispute.status
      },
      gdprLegalBasis: 'legal_obligation'
    });

    // TODO: Admin-Benachrichtigung über Dispute senden
    console.log(`Dispute für Bestellung ${orderNumber} protokolliert`);

  } catch (error) {
    console.error('Fehler bei Dispute Created:', error);
  }
}

/**
 * Rechnung bezahlt (für wiederkehrende Zahlungen)
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  try {
    console.log(`Invoice bezahlt: ${invoice.id}`);
    
    // TODO: Implementierung für Abonnements/wiederkehrende Zahlungen
    // falls in Zukunft benötigt

  } catch (error) {
    console.error('Fehler bei Invoice Payment Succeeded:', error);
  }
}

// ========================
// PRODUCT SYNC WEBHOOKS
// ========================

/**
 * Produktsynchronisation Webhook
 * POST /api/webhooks/product-sync
 */
export async function handleProductSync(req: Request, res: Response): Promise<void> {
  try {
    const { action, productId, data } = req.body;

    console.log(`Product Sync Webhook: ${action} für Produkt ${productId}`);

    // Webhook-Daten validieren
    if (!action || !productId) {
      res.status(400).json(createErrorResponse('Ungültige Webhook-Daten', 400));
      return;
    }

    switch (action) {
      case 'product.updated':
        await handleProductUpdated(productId, data);
        break;

      case 'product.created':
        await handleProductCreated(productId, data);
        break;

      case 'product.deleted':
        await handleProductDeleted(productId);
        break;

      case 'inventory.updated':
        await handleInventoryUpdated(productId, data);
        break;

      default:
        console.log(`Unbekannte Product Sync Action: ${action}`);
    }

    res.json(createSuccessResponse({ 
      message: `Product sync ${action} verarbeitet`,
      productId 
    }));

  } catch (error) {
    console.error('Product Sync Webhook Fehler:', error);
    res.status(500).json(createErrorResponse('Product Sync fehlgeschlagen', 500));
  }
}

/**
 * Produkt-Update verarbeiten
 */
async function handleProductUpdated(productId: number, data: any): Promise<void> {
  try {
    // TODO: Implementierung für externe Produktsynchronisation
    // z.B. mit PIM-System, ERP, oder externen Marktplätzen
    
    console.log(`Produkt ${productId} aktualisiert:`, data);

    // Audit-Log erstellen
    await db.insert(auditLogs).values({
      entityType: 'product',
      entityId: productId,
      action: 'external_sync_update',
      performedByEmail: 'product-sync-webhook',
      changes: data,
      gdprLegalBasis: 'legitimate_interest'
    });

  } catch (error) {
    console.error('Fehler bei Product Updated:', error);
  }
}

/**
 * Neues Produkt erstellt
 */
async function handleProductCreated(productId: number, data: any): Promise<void> {
  try {
    console.log(`Neues Produkt ${productId} erstellt:`, data);

    // Audit-Log erstellen
    await db.insert(auditLogs).values({
      entityType: 'product',
      entityId: productId,
      action: 'external_sync_create',
      performedByEmail: 'product-sync-webhook',
      changes: data,
      gdprLegalBasis: 'legitimate_interest'
    });

  } catch (error) {
    console.error('Fehler bei Product Created:', error);
  }
}

/**
 * Produkt gelöscht
 */
async function handleProductDeleted(productId: number): Promise<void> {
  try {
    console.log(`Produkt ${productId} gelöscht`);

    // Audit-Log erstellen
    await db.insert(auditLogs).values({
      entityType: 'product',
      entityId: productId,
      action: 'external_sync_delete',
      performedByEmail: 'product-sync-webhook',
      gdprLegalBasis: 'legitimate_interest'
    });

  } catch (error) {
    console.error('Fehler bei Product Deleted:', error);
  }
}

/**
 * Inventar aktualisiert
 */
async function handleInventoryUpdated(productId: number, data: any): Promise<void> {
  try {
    console.log(`Inventar für Produkt ${productId} aktualisiert:`, data);

    // TODO: Lokales Inventar mit externen Daten synchronisieren

  } catch (error) {
    console.error('Fehler bei Inventory Updated:', error);
  }
}

// ========================
// WEBHOOK UTILITIES
// ========================

/**
 * Webhook-Authentifizierung prüfen
 */
export function verifyWebhookSignature(req: Request, secret: string): boolean {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    if (!signature) return false;

    // TODO: Implementierung der Signatur-Verifizierung
    // z.B. HMAC-SHA256

    return true;
  } catch (error) {
    console.error('Webhook-Signatur-Verifizierung fehlgeschlagen:', error);
    return false;
  }
}

/**
 * Webhook-Event-Log erstellen
 */
export async function logWebhookEvent(
  source: string, 
  eventType: string, 
  data: any, 
  success: boolean
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      entityType: 'webhook',
      entityId: 0,
      action: `${source}_${eventType}`,
      performedByEmail: `${source}-webhook`,
      changes: { data, success },
      gdprLegalBasis: 'legitimate_interest'
    });
  } catch (error) {
    console.error('Webhook-Event-Log fehlgeschlagen:', error);
  }
}

// ========================
// EXPORT
// ========================

export default {
  handleStripeWebhook,
  handleProductSync,
  verifyWebhookSignature,
  logWebhookEvent
};
