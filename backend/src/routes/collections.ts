/**
 * Kollektionen-Routen für DressForPleasure Backend
 */

import { Router } from 'express';
import { 
  authenticateToken, 
  canCreateProducts,
  canUpdateProducts,
  canDeleteProducts,
  publicRateLimit
} from '../middleware/auth';
import { 
  validateBody, 
  validateId,
  collectionSchema
} from '../middleware/validation';
import { asyncHandler } from '../middleware/security';
import collectionController from '../controllers/collections';

const router = Router();

// Öffentliche Routen
router.get('/', publicRateLimit, asyncHandler(collectionController.getCollections));
router.get('/featured', publicRateLimit, asyncHandler(collectionController.getFeaturedCollections));
router.get('/seasons', publicRateLimit, asyncHandler(collectionController.getAvailableSeasons));
router.get('/slug/:slug', publicRateLimit, asyncHandler(collectionController.getCollectionBySlug));
router.get('/:id', publicRateLimit, validateId, asyncHandler(collectionController.getCollectionById));
router.get('/:id/products', publicRateLimit, validateId, asyncHandler(collectionController.getCollectionProducts));

// Geschützte Routen
router.post('/', authenticateToken, canCreateProducts, validateBody(collectionSchema), asyncHandler(collectionController.createCollection));
router.put('/:id', authenticateToken, canUpdateProducts, validateId, validateBody(collectionSchema), asyncHandler(collectionController.updateCollection));
router.delete('/:id', authenticateToken, canDeleteProducts, validateId, asyncHandler(collectionController.deleteCollection));
router.patch('/:id/deactivate', authenticateToken, canUpdateProducts, validateId, asyncHandler(collectionController.deactivateCollection));
router.patch('/:id/featured', authenticateToken, canUpdateProducts, validateId, asyncHandler(collectionController.toggleFeatured));

export default router;
