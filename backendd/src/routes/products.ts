/**
 * Produkt-Routen für DressForPleasure Backend
 * 
 * Diese Routen behandeln:
 * - Öffentliche Produktabfragen (für Frontend)
 * - Geschützte Produktverwaltung (für Admin)
 * - Produktvarianten-Management
 * - Produktsuche und Filterung
 */

import { Router } from 'express';
import { 
  authenticateToken, 
  optionalAuth,
  canReadProducts,
  canCreateProducts,
  canUpdateProducts,
  canDeleteProducts,
  publicRateLimit
} from '../middleware/auth';
import { 
  validateBody, 
  validateQuery,
  validateId,
  validatePagination,
  validateSearch,
  createProductSchema,
  updateProductSchema,
  productVariantSchema
} from '../middleware/validation';
import { asyncHandler } from '../middleware/security';
import productController from '../controllers/products';
import Joi from 'joi';

const router = Router();

// ========================
// VALIDATION SCHEMAS
// ========================

// Batch-Update Schema für mehrere Produkte
const batchUpdateProductsSchema = Joi.object({
  productIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  updates: Joi.object({
    status: Joi.string().valid('draft', 'active', 'archived'),
    featured: Joi.boolean(),
    newArrival: Joi.boolean(),
    bestseller: Joi.boolean(),
    categoryIds: Joi.array().items(Joi.number().integer().positive()),
    collectionIds: Joi.array().items(Joi.number().integer().positive())
  }).min(1).required()
});

// Inventar-Update Schema
const updateInventorySchema = Joi.object({
  variantId: Joi.number().integer().positive().required(),
  quantityChange: Joi.number().integer().required(),
  reason: Joi.string().max(255).required(),
  reference: Joi.string().max(100)
});

// Status-Update Schema
const updateStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'active', 'archived').required()
});

// ========================
// ÖFFENTLICHE ROUTEN (für Frontend)
// ========================

/**
 * @route   GET /api/products
 * @desc    Alle Produkte abrufen (mit Filterung und Pagination)
 * @access  Public
 */
router.get(
  '/',
  publicRateLimit,
  validateSearch,
  asyncHandler(productController.getProducts)
);

/**
 * @route   GET /api/products/featured
 * @desc    Featured Produkte abrufen
 * @access  Public
 */
router.get(
  '/featured',
  publicRateLimit,
  validatePagination,
  asyncHandler(async (req, res) => {
    // Featured Filter hinzufügen
    req.query.featured = 'true';
    req.query.status = 'active';
    return productController.getProducts(req, res);
  })
);

/**
 * @route   GET /api/products/new-arrivals
 * @desc    Neue Produkte abrufen
 * @access  Public
 */
router.get(
  '/new-arrivals',
  publicRateLimit,
  validatePagination,
  asyncHandler(async (req, res) => {
    // New Arrival Filter hinzufügen
    req.query.newArrival = 'true';
    req.query.status = 'active';
    return productController.getProducts(req, res);
  })
);

/**
 * @route   GET /api/products/bestsellers
 * @desc    Bestseller Produkte abrufen
 * @access  Public
 */
router.get(
  '/bestsellers',
  publicRateLimit,
  validatePagination,
  asyncHandler(async (req, res) => {
    // Bestseller Filter hinzufügen
    req.query.bestseller = 'true';
    req.query.status = 'active';
    return productController.getProducts(req, res);
  })
);

/**
 * @route   GET /api/products/search
 * @desc    Produktsuche mit erweiterten Filtern
 * @access  Public
 */
router.get(
  '/search',
  publicRateLimit,
  validateQuery(Joi.object({
    q: Joi.string().min(2).max(255).required()
      .messages({
        'string.min': 'Suchbegriff muss mindestens 2 Zeichen lang sein',
        'any.required': 'Suchbegriff ist erforderlich'
      }),
    category: Joi.string().max(100),
    collection: Joi.string().max(100),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('name', 'basePrice', 'createdAt', 'featured').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })),
  asyncHandler(productController.getProducts)
);

/**
 * @route   GET /api/products/slug/:slug
 * @desc    Produkt nach Slug abrufen
 * @access  Public
 */
router.get(
  '/slug/:slug',
  publicRateLimit,
  asyncHandler(productController.getProductBySlug)
);

/**
 * @route   GET /api/products/:id
 * @desc    Einzelnes Produkt abrufen
 * @access  Public
 */
router.get(
  '/:id',
  publicRateLimit,
  validateId,
  asyncHandler(productController.getProductById)
);

// ========================
// GESCHÜTZTE ROUTEN (Admin/Manager)
// ========================

/**
 * @route   POST /api/products
 * @desc    Neues Produkt erstellen
 * @access  Private (Permissions: products.create)
 */
router.post(
  '/',
  authenticateToken,
  canCreateProducts,
  validateBody(createProductSchema),
  asyncHandler(productController.createProduct)
);

/**
 * @route   PUT /api/products/:id
 * @desc    Produkt aktualisieren
 * @access  Private (Permissions: products.update)
 */
router.put(
  '/:id',
  authenticateToken,
  canUpdateProducts,
  validateId,
  validateBody(updateProductSchema),
  asyncHandler(productController.updateProduct)
);

/**
 * @route   PATCH /api/products/:id/status
 * @desc    Produktstatus ändern
 * @access  Private (Permissions: products.update)
 */
router.patch(
  '/:id/status',
  authenticateToken,
  canUpdateProducts,
  validateId,
  validateBody(updateStatusSchema),
  asyncHandler(async (req, res) => {
    // Status-Update in den Body des Standard-Update-Controllers einbetten
    req.body = { status: req.body.status };
    return productController.updateProduct(req, res);
  })
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Produkt löschen
 * @access  Private (Permissions: products.delete)
 */
router.delete(
  '/:id',
  authenticateToken,
  canDeleteProducts,
  validateId,
  asyncHandler(productController.deleteProduct)
);

// ========================
// PRODUKTVARIANTEN ROUTEN
// ========================

/**
 * @route   POST /api/products/:id/variants
 * @desc    Neue Produktvariante erstellen
 * @access  Private (Permissions: products.update)
 */
router.post(
  '/:id/variants',
  authenticateToken,
  canUpdateProducts,
  validateId,
  validateBody(productVariantSchema),
  asyncHandler(productController.createProductVariant)
);

/**
 * @route   PUT /api/products/:id/variants/:variantId
 * @desc    Produktvariante aktualisieren
 * @access  Private (Permissions: products.update)
 */
router.put(
  '/:id/variants/:variantId',
  authenticateToken,
  canUpdateProducts,
  validateId,
  validateBody(productVariantSchema.fork(
    ['productId', 'sku', 'price', 'stock'],
    schema => schema.optional()
  )),
  asyncHandler(productController.updateProductVariant)
);

/**
 * @route   DELETE /api/products/:id/variants/:variantId
 * @desc    Produktvariante löschen
 * @access  Private (Permissions: products.delete)
 */
router.delete(
  '/:id/variants/:variantId',
  authenticateToken,
  canDeleteProducts,
  validateId,
  asyncHandler(productController.deleteProductVariant)
);

// ========================
// BULK OPERATIONS
// ========================

/**
 * @route   PATCH /api/products/bulk/update
 * @desc    Mehrere Produkte gleichzeitig aktualisieren
 * @access  Private (Permissions: products.update)
 */
router.patch(
  '/bulk/update',
  authenticateToken,
  canUpdateProducts,
  validateBody(batchUpdateProductsSchema),
  asyncHandler(async (req, res) => {
    try {
      const { productIds, updates } = req.body;
      
      // TODO: Implementierung des Batch-Updates
      res.json({
        success: true,
        data: {
          updatedProducts: productIds.length,
          message: 'Batch-Update wird in einer zukünftigen Version implementiert'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Fehler beim Batch-Update'
      });
    }
  })
);

/**
 * @route   DELETE /api/products/bulk/delete
 * @desc    Mehrere Produkte gleichzeitig löschen
 * @access  Private (Permissions: products.delete)
 */
router.delete(
  '/bulk/delete',
  authenticateToken,
  canDeleteProducts,
  validateBody(Joi.object({
    productIds: Joi.array().items(Joi.number().integer().positive()).min(1).required()
  })),
  asyncHandler(async (req, res) => {
    try {
      const { productIds } = req.body;
      
      // TODO: Implementierung des Batch-Deletes
      res.json({
        success: true,
        data: {
          deletedProducts: productIds.length,
          message: 'Batch-Delete wird in einer zukünftigen Version implementiert'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Fehler beim Batch-Delete'
      });
    }
  })
);

// ========================
// INVENTAR-MANAGEMENT
// ========================

/**
 * @route   GET /api/products/:id/inventory
 * @desc    Inventar-Informationen für ein Produkt abrufen
 * @access  Private (Permissions: products.read)
 */
router.get(
  '/:id/inventory',
  authenticateToken,
  canReadProducts,
  validateId,
  asyncHandler(async (req, res) => {
    try {
      // TODO: Implementierung des Inventory-Controllers
      res.json({
        success: true,
        data: {
          message: 'Inventar-Management wird in einer zukünftigen Version implementiert'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Fehler beim Abrufen der Inventar-Informationen'
      });
    }
  })
);

/**
 * @route   PATCH /api/products/inventory/update
 * @desc    Inventar aktualisieren
 * @access  Private (Permissions: products.update)
 */
router.patch(
  '/inventory/update',
  authenticateToken,
  canUpdateProducts,
  validateBody(updateInventorySchema),
  asyncHandler(async (req, res) => {
    try {
      // TODO: Implementierung des Inventory-Updates
      res.json({
        success: true,
        data: {
          message: 'Inventar-Update wird in einer zukünftigen Version implementiert'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Fehler beim Inventar-Update'
      });
    }
  })
);

// ========================
// ANALYTICS & REPORTS
// ========================

/**
 * @route   GET /api/products/analytics/overview
 * @desc    Produkt-Analytics Übersicht
 * @access  Private (Permissions: products.read)
 */
router.get(
  '/analytics/overview',
  authenticateToken,
  canReadProducts,
  asyncHandler(async (req, res) => {
    try {
      // TODO: Implementierung der Analytics
      res.json({
        success: true,
        data: {
          totalProducts: 0,
          activeProducts: 0,
          featuredProducts: 0,
          lowStockProducts: 0,
          message: 'Analytics wird in einer zukünftigen Version implementiert'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Fehler beim Abrufen der Analytics'
      });
    }
  })
);

/**
 * @route   GET /api/products/analytics/low-stock
 * @desc    Produkte mit niedrigem Lagerbestand
 * @access  Private (Permissions: products.read)
 */
router.get(
  '/analytics/low-stock',
  authenticateToken,
  canReadProducts,
  validatePagination,
  asyncHandler(async (req, res) => {
    try {
      // TODO: Implementierung der Low-Stock-Analytics
      res.json({
        success: true,
        data: {
          products: [],
          meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
          message: 'Low-Stock-Analytics wird in einer zukünftigen Version implementiert'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Fehler beim Abrufen der Low-Stock-Produkte'
      });
    }
  })
);

// ========================
// EXPORT/IMPORT ROUTEN
// ========================

/**
 * @route   GET /api/products/export
 * @desc    Produkte als CSV/JSON exportieren
 * @access  Private (Permissions: products.read)
 */
router.get(
  '/export',
  authenticateToken,
  canReadProducts,
  validateQuery(Joi.object({
    format: Joi.string().valid('csv', 'json').default('json'),
    includeVariants: Joi.boolean().default(true),
    includeInventory: Joi.boolean().default(true)
  })),
  asyncHandler(async (req, res) => {
    try {
      // TODO: Implementierung des Exports
      res.json({
        success: true,
        data: {
          message: 'Produkt-Export wird in einer zukünftigen Version implementiert'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Fehler beim Export'
      });
    }
  })
);

export default router;
