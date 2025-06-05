/**
 * Bestellungen-Routen für DressForPleasure Backend
 */

import { Router } from 'express';
import { authenticateToken, canReadOrders, canUpdateOrders } from '../middleware/auth';
import { validateId, validateOrderRequest, validateOrderStatusUpdate } from '../middleware/validation';
import { asyncHandler } from '../middleware/security';
import ordersController from '../controllers/orders';

const router = Router();

// ========================
// ÖFFENTLICHE ENDPUNKTE
// ========================

/**
 * Neue Bestellung erstellen (Checkout)
 * POST /api/orders
 */
router.post('/', 
  validateOrderRequest,
  asyncHandler(ordersController.createOrder)
);

// ========================
// GESCHÜTZTE ENDPUNKTE (ADMIN)
// ========================

/**
 * Alle Bestellungen abrufen
 * GET /api/orders
 * Query-Parameter: page, limit, sortBy, sortOrder, status, paymentStatus, customerEmail, orderNumber, startDate, endDate
 */
router.get('/', 
  authenticateToken, 
  canReadOrders, 
  asyncHandler(ordersController.getOrders)
);

/**
 * Einzelne Bestellung abrufen
 * GET /api/orders/:id
 */
router.get('/:id', 
  authenticateToken, 
  canReadOrders, 
  validateId, 
  asyncHandler(ordersController.getOrderById)
);

/**
 * Bestellstatus aktualisieren
 * PUT /api/orders/:id/status
 */
router.put('/:id/status', 
  authenticateToken, 
  canUpdateOrders, 
  validateId,
  validateOrderStatusUpdate,
  asyncHandler(ordersController.updateOrderStatus)
);

/**
 * Bestellung stornieren
 * POST /api/orders/:id/cancel
 */
router.post('/:id/cancel', 
  authenticateToken, 
  canUpdateOrders, 
  validateId,
  asyncHandler(ordersController.cancelOrder)
);

// ========================
// ANALYTICS & STATISTIKEN
// ========================

/**
 * Bestellstatistiken abrufen
 * GET /api/orders/analytics/overview
 */
router.get('/analytics/overview', 
  authenticateToken, 
  canReadOrders,
  asyncHandler(ordersController.getOrderAnalytics)
);

export default router;
