/**
 * Kategorien-Routen für DressForPleasure Backend
 */

import { Router } from 'express';
import { 
  authenticateToken, 
  canReadProducts,
  canCreateProducts,
  canUpdateProducts,
  canDeleteProducts,
  publicRateLimit
} from '../middleware/auth';
import { 
  validateBody, 
  validateId,
  categorySchema
} from '../middleware/validation';
import { asyncHandler } from '../middleware/security';
import categoryController from '../controllers/categories';

const router = Router();

// Öffentliche Routen
router.get('/', publicRateLimit, asyncHandler(categoryController.getCategories));
router.get('/flat', publicRateLimit, asyncHandler(categoryController.getCategoriesFlat));
router.get('/slug/:slug', publicRateLimit, asyncHandler(categoryController.getCategoryBySlug));
router.get('/:id', publicRateLimit, validateId, asyncHandler(categoryController.getCategoryById));

// Geschützte Routen
router.post('/', authenticateToken, canCreateProducts, validateBody(categorySchema), asyncHandler(categoryController.createCategory));
router.put('/:id', authenticateToken, canUpdateProducts, validateId, validateBody(categorySchema), asyncHandler(categoryController.updateCategory));
router.delete('/:id', authenticateToken, canDeleteProducts, validateId, asyncHandler(categoryController.deleteCategory));
router.patch('/:id/deactivate', authenticateToken, canUpdateProducts, validateId, asyncHandler(categoryController.deactivateCategory));

export default router;
