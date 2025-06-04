/**
 * Kunden-Routen für DressForPleasure Backend
 */

import { Router } from 'express';
import { authenticateToken, canReadCustomers, canUpdateCustomers } from '../middleware/auth';
import { validateId, validateCustomerRegistration, validateCustomerUpdate, validateCustomerAddress } from '../middleware/validation';
import { asyncHandler } from '../middleware/security';
import customersController from '../controllers/customers';

const router = Router();

// ========================
// ÖFFENTLICHE ENDPUNKTE
// ========================

/**
 * Kundenregistrierung
 * POST /api/customers/register
 */
router.post('/register', 
  validateCustomerRegistration,
  asyncHandler(customersController.registerCustomer)
);

/**
 * Kunden-Login
 * POST /api/customers/login
 */
router.post('/login', 
  asyncHandler(customersController.loginCustomer)
);

/**
 * Passwort-Reset anfordern
 * POST /api/customers/forgot-password
 */
router.post('/forgot-password', 
  asyncHandler(customersController.requestPasswordReset)
);

// ========================
// GESCHÜTZTE ENDPUNKTE (ADMIN)
// ========================

/**
 * Alle Kunden abrufen (Admin)
 * GET /api/customers
 * Query-Parameter: page, limit, sortBy, sortOrder, search, isActive, hasOrders
 */
router.get('/', 
  authenticateToken, 
  canReadCustomers, 
  asyncHandler(customersController.getCustomers)
);

/**
 * Einzelnen Kunden abrufen
 * GET /api/customers/:id
 * Autorisierung: Nur eigenes Profil oder Admin
 */
router.get('/:id', 
  authenticateToken, 
  validateId, 
  asyncHandler(customersController.getCustomerById)
);

/**
 * Kundenprofil aktualisieren
 * PUT /api/customers/:id
 * Autorisierung: Nur eigenes Profil oder Admin
 */
router.put('/:id', 
  authenticateToken, 
  validateId,
  validateCustomerUpdate,
  asyncHandler(customersController.updateCustomer)
);

/**
 * Adresse hinzufügen
 * POST /api/customers/:id/addresses
 */
router.post('/:id/addresses', 
  authenticateToken, 
  validateId,
  validateCustomerAddress,
  asyncHandler(customersController.addCustomerAddress)
);

// ========================
// DSGVO-ENDPUNKTE
// ========================

/**
 * Kundendaten exportieren (DSGVO)
 * GET /api/customers/:id/export
 * Autorisierung: Nur eigenes Profil oder Admin
 */
router.get('/:id/export', 
  authenticateToken, 
  validateId,
  asyncHandler(customersController.exportCustomerData)
);

/**
 * Kunde löschen/anonymisieren (DSGVO)
 * DELETE /api/customers/:id
 * Nur für Admins
 */
router.delete('/:id', 
  authenticateToken, 
  canUpdateCustomers,
  validateId,
  asyncHandler(customersController.deleteCustomer)
);

export default router;
