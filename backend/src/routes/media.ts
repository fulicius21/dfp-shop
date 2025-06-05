/**
 * Medien-Routen für DressForPleasure Backend
 */

import { Router } from 'express';
import { authenticateToken, canUploadMedia, canDeleteMedia, canReadMedia } from '../middleware/auth';
import { validateId } from '../middleware/validation';
import { asyncHandler } from '../middleware/security';
import mediaController from '../controllers/media';

const router = Router();

// ========================
// UPLOAD-ENDPUNKTE
// ========================

/**
 * Einzelne Datei hochladen
 * POST /api/media/upload/:type
 * Typen: products, collections, avatars, documents
 */
router.post('/upload/:type', 
  authenticateToken, 
  canUploadMedia, 
  asyncHandler(mediaController.uploadSingleFile)
);

/**
 * Multiple Dateien hochladen
 * POST /api/media/upload-multiple/:type
 */
router.post('/upload-multiple/:type', 
  authenticateToken, 
  canUploadMedia, 
  asyncHandler(mediaController.uploadMultipleFiles)
);

// ========================
// MEDIEN-VERWALTUNG
// ========================

/**
 * Alle Medien abrufen
 * GET /api/media
 * Query-Parameter: page, limit, sortBy, sortOrder, uploadType, mimeType, search
 */
router.get('/', 
  authenticateToken, 
  canReadMedia,
  asyncHandler(mediaController.getMedia)
);

/**
 * Einzelne Mediendatei abrufen
 * GET /api/media/:id
 */
router.get('/:id', 
  authenticateToken, 
  canReadMedia,
  validateId, 
  asyncHandler(mediaController.getMediaById)
);

/**
 * Mediendatei löschen
 * DELETE /api/media/:id
 */
router.delete('/:id', 
  authenticateToken, 
  canDeleteMedia, 
  validateId, 
  asyncHandler(mediaController.deleteMedia)
);

export default router;
