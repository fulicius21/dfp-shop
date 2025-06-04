/**
 * Webhook-Routen für DressForPleasure Backend
 * 
 * Wichtig: Stripe Webhooks benötigen Raw Body für Signatur-Verifizierung
 * Siehe app.ts für spezielle Body-Parser-Konfiguration
 */

import { Router } from 'express';
import { requireApiKey, webhookRateLimit } from '../middleware/auth';
import { asyncHandler } from '../middleware/security';
import webhooksController from '../controllers/webhooks';

const router = Router();

// ========================
// STRIPE WEBHOOKS
// ========================

/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 * 
 * Behandelt alle Stripe-Events:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - payment_intent.canceled
 * - payment_intent.requires_action
 * - charge.dispute.created
 * - invoice.payment_succeeded
 */
router.post('/stripe', 
  webhookRateLimit,
  asyncHandler(webhooksController.handleStripeWebhook)
);

// ========================
// PRODUCT SYNC WEBHOOKS
// ========================

/**
 * Produktsynchronisation Webhook
 * POST /api/webhooks/product-sync
 * 
 * Behandelt externe Produktsynchronisation:
 * - product.updated
 * - product.created  
 * - product.deleted
 * - inventory.updated
 */
router.post('/product-sync', 
  requireApiKey,
  asyncHandler(webhooksController.handleProductSync)
);

// ========================
// WEITERE WEBHOOKS (Erweiterbar)
// ========================

/**
 * Allgemeiner Webhook-Handler für künftige Integrationen
 * POST /api/webhooks/:source
 */
router.post('/:source', 
  requireApiKey,
  asyncHandler(async (req, res) => {
    const { source } = req.params;
    const { type, data } = req.body;
    
    // Log für unbekannte Webhook-Quellen
    await webhooksController.logWebhookEvent(source, type, data, false);
    
    res.status(200).json({ 
      received: true, 
      message: `Webhook von ${source} erhalten aber nicht implementiert` 
    });
  })
);

export default router;
