/**
 * Medien-Controller für DressForPleasure Backend
 * 
 * Dieser Controller behandelt:
 * - Datei-Uploads (Produktbilder, Avatare)
 * - Bildverarbeitung und Optimierung
 * - Cloud-Storage-Integration (Cloudinary)
 * - DSGVO-konforme Medien-Verwaltung
 */

import { Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { db } from '../db/connection';
import { media, auditLogs } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { 
  createSuccessResponse, 
  createErrorResponse,
  calculatePagination,
  generateSlug
} from '../utils';
import { AuthRequest, SearchParams } from '../types';

// Cloudinary für Produktionsumgebung (optional)
import { v2 as cloudinary } from 'cloudinary';

// Erlaubte Dateitypen
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Upload-Verzeichnisse
const UPLOAD_DIRS = {
  products: 'uploads/products',
  collections: 'uploads/collections',
  avatars: 'uploads/avatars',
  documents: 'uploads/documents',
  temp: 'uploads/temp'
};

// ========================
// MULTER KONFIGURATION
// ========================

// Speicher-Konfiguration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadType = req.params.type || 'temp';
    const uploadDir = UPLOAD_DIRS[uploadType as keyof typeof UPLOAD_DIRS] || UPLOAD_DIRS.temp;
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    // Sicherer Dateiname generieren
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    const safeName = `${timestamp}_${randomString}${ext}`;
    cb(null, safeName);
  }
});

// Datei-Filter
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const uploadType = req.params.type;
  
  if (uploadType === 'documents') {
    if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur PDF-Dateien sind erlaubt'));
    }
  } else {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilddateien (JPEG, PNG, WebP) sind erlaubt'));
    }
  }
};

// Multer-Instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // Max 10 Dateien gleichzeitig
  }
});

// ========================
// CLOUDINARY SETUP
// ========================

/**
 * Cloudinary initialisieren (falls konfiguriert)
 */
function initializeCloudinary(): boolean {
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET) {
      
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      
      console.log('☁️ Cloudinary konfiguriert');
      return true;
    }
    
    console.log('📁 Lokaler Datei-Upload (Cloudinary nicht konfiguriert)');
    return false;
  } catch (error) {
    console.error('Cloudinary-Konfigurationsfehler:', error);
    return false;
  }
}

const useCloudinary = initializeCloudinary();

// ========================
// UPLOAD-ENDPUNKTE
// ========================

/**
 * Einzelne Datei hochladen
 * POST /api/media/upload/:type
 */
export async function uploadSingleFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const uploadType = req.params.type;
    const user = req.user!;

    // Multer-Middleware für einzelne Datei
    const singleUpload = upload.single('file');
    
    singleUpload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json(createErrorResponse('Datei zu groß (max. 10MB)', 400));
          } else {
            res.status(400).json(createErrorResponse(`Upload-Fehler: ${err.message}`, 400));
          }
        } else {
          res.status(400).json(createErrorResponse(err.message, 400));
        }
        return;
      }

      if (!req.file) {
        res.status(400).json(createErrorResponse('Keine Datei hochgeladen', 400));
        return;
      }

      try {
        const file = req.file;
        let finalUrl = '';
        let cloudinaryId = null;

        // Bild optimieren (nur für Bilder)
        if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
          const optimizedPath = await optimizeImage(file.path, uploadType);
          
          if (useCloudinary) {
            // Zu Cloudinary hochladen
            const cloudinaryResult = await uploadToCloudinary(optimizedPath, uploadType);
            finalUrl = cloudinaryResult.secure_url;
            cloudinaryId = cloudinaryResult.public_id;
            
            // Lokale Datei löschen
            await fs.unlink(optimizedPath);
          } else {
            // Lokale URL generieren
            finalUrl = `/uploads/${uploadType}/${path.basename(optimizedPath)}`;
          }
        } else {
          // Dokumente: nur zu Cloudinary oder lokal speichern
          if (useCloudinary) {
            const cloudinaryResult = await uploadToCloudinary(file.path, uploadType);
            finalUrl = cloudinaryResult.secure_url;
            cloudinaryId = cloudinaryResult.public_id;
            
            await fs.unlink(file.path);
          } else {
            finalUrl = `/uploads/${uploadType}/${file.filename}`;
          }
        }

        // Medien-Eintrag in Datenbank erstellen
        const [mediaRecord] = await db
          .insert(media)
          .values({
            fileName: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            filePath: finalUrl,
            cloudinaryId,
            uploadType,
            uploadedBy: user.id,
            isActive: true
          })
          .returning();

        // Audit-Log erstellen
        await db.insert(auditLogs).values({
          entityType: 'media',
          entityId: mediaRecord.id,
          action: 'upload',
          performedBy: user.id,
          performedByEmail: user.email,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          changes: { 
            fileName: file.originalname,
            fileSize: file.size,
            uploadType,
            url: finalUrl
          },
          gdprLegalBasis: 'legitimate_interest'
        });

        res.status(201).json(createSuccessResponse({
          id: mediaRecord.id,
          fileName: mediaRecord.originalName,
          url: finalUrl,
          mimeType: file.mimetype,
          fileSize: file.size,
          uploadType,
          createdAt: mediaRecord.createdAt
        }, 'Datei erfolgreich hochgeladen'));

      } catch (processError) {
        console.error('Fehler bei Dateiverarbeitung:', processError);
        
        // Aufräumen bei Fehler
        try {
          await fs.unlink(req.file!.path);
        } catch {}

        res.status(500).json(createErrorResponse('Fehler bei der Dateiverarbeitung', 500));
      }
    });

  } catch (error) {
    console.error('Fehler beim Datei-Upload:', error);
    res.status(500).json(createErrorResponse('Fehler beim Datei-Upload', 500));
  }
}

/**
 * Multiple Dateien hochladen
 * POST /api/media/upload-multiple/:type
 */
export async function uploadMultipleFiles(req: AuthRequest, res: Response): Promise<void> {
  try {
    const uploadType = req.params.type;
    const user = req.user!;

    // Multer-Middleware für multiple Dateien
    const multipleUpload = upload.array('files', 10);
    
    multipleUpload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          res.status(400).json(createErrorResponse(`Upload-Fehler: ${err.message}`, 400));
        } else {
          res.status(400).json(createErrorResponse(err.message, 400));
        }
        return;
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json(createErrorResponse('Keine Dateien hochgeladen', 400));
        return;
      }

      try {
        const uploadResults = [];

        for (const file of files) {
          let finalUrl = '';
          let cloudinaryId = null;

          // Bild optimieren
          if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            const optimizedPath = await optimizeImage(file.path, uploadType);
            
            if (useCloudinary) {
              const cloudinaryResult = await uploadToCloudinary(optimizedPath, uploadType);
              finalUrl = cloudinaryResult.secure_url;
              cloudinaryId = cloudinaryResult.public_id;
              await fs.unlink(optimizedPath);
            } else {
              finalUrl = `/uploads/${uploadType}/${path.basename(optimizedPath)}`;
            }
          } else {
            if (useCloudinary) {
              const cloudinaryResult = await uploadToCloudinary(file.path, uploadType);
              finalUrl = cloudinaryResult.secure_url;
              cloudinaryId = cloudinaryResult.public_id;
              await fs.unlink(file.path);
            } else {
              finalUrl = `/uploads/${uploadType}/${file.filename}`;
            }
          }

          // Medien-Eintrag erstellen
          const [mediaRecord] = await db
            .insert(media)
            .values({
              fileName: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              fileSize: file.size,
              filePath: finalUrl,
              cloudinaryId,
              uploadType,
              uploadedBy: user.id,
              isActive: true
            })
            .returning();

          uploadResults.push({
            id: mediaRecord.id,
            fileName: mediaRecord.originalName,
            url: finalUrl,
            mimeType: file.mimetype,
            fileSize: file.size,
            uploadType
          });
        }

        // Audit-Log für Batch-Upload
        await db.insert(auditLogs).values({
          entityType: 'media',
          entityId: 0,
          action: 'batch_upload',
          performedBy: user.id,
          performedByEmail: user.email,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          changes: { 
            fileCount: files.length,
            uploadType,
            files: uploadResults.map(r => r.fileName)
          },
          gdprLegalBasis: 'legitimate_interest'
        });

        res.status(201).json(createSuccessResponse({
          uploadedFiles: uploadResults,
          totalCount: uploadResults.length
        }, `${uploadResults.length} Dateien erfolgreich hochgeladen`));

      } catch (processError) {
        console.error('Fehler bei Multi-Datei-Verarbeitung:', processError);
        
        // Aufräumen bei Fehler
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch {}
        }

        res.status(500).json(createErrorResponse('Fehler bei der Dateiverarbeitung', 500));
      }
    });

  } catch (error) {
    console.error('Fehler beim Multi-Datei-Upload:', error);
    res.status(500).json(createErrorResponse('Fehler beim Multi-Datei-Upload', 500));
  }
}

// ========================
// MEDIEN-VERWALTUNG
// ========================

/**
 * Alle Medien abrufen
 * GET /api/media
 */
export async function getMedia(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      uploadType,
      mimeType,
      search
    } = req.query as SearchParams & {
      uploadType?: string;
      mimeType?: string;
    };

    // Base Query
    let query = db
      .select({
        id: media.id,
        fileName: media.fileName,
        originalName: media.originalName,
        mimeType: media.mimeType,
        fileSize: media.fileSize,
        filePath: media.filePath,
        uploadType: media.uploadType,
        isActive: media.isActive,
        createdAt: media.createdAt,
        uploadedBy: media.uploadedBy
      })
      .from(media);

    // Filter-Bedingungen
    const conditions = [];

    if (uploadType) {
      conditions.push(eq(media.uploadType, uploadType));
    }

    if (mimeType) {
      conditions.push(eq(media.mimeType, mimeType));
    }

    if (search) {
      conditions.push(
        sql`(${media.originalName} ILIKE ${`%${search}%`} OR 
            ${media.fileName} ILIKE ${`%${search}%`})`
      );
    }

    // Nur aktive Medien (außer für Admins)
    if (req.user?.role !== 'admin') {
      conditions.push(eq(media.isActive, true));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sortierung
    const sortColumn = media[sortBy as keyof typeof media] || media.createdAt;
    if (sortOrder === 'asc') {
      query = query.orderBy(sortColumn);
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    // Gesamtanzahl für Pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(media);
    
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count: totalCount }] = await countQuery;

    // Pagination
    const offset = (page - 1) * limit;
    const mediaResults = await query
      .limit(limit)
      .offset(offset);

    const pagination = calculatePagination(page, limit, totalCount);

    res.json(createSuccessResponse({
      media: mediaResults,
      meta: pagination
    }));

  } catch (error) {
    console.error('Fehler beim Abrufen der Medien:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Medien', 500));
  }
}

/**
 * Einzelne Mediendatei abrufen
 * GET /api/media/:id
 */
export async function getMediaById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const mediaId = parseInt(req.params.id);

    const mediaResult = await db
      .select()
      .from(media)
      .where(eq(media.id, mediaId))
      .limit(1);

    if (mediaResult.length === 0) {
      res.status(404).json(createErrorResponse('Mediendatei nicht gefunden', 404));
      return;
    }

    const mediaFile = mediaResult[0];

    // Prüfen ob Datei aktiv ist (außer für Admins)
    if (!mediaFile.isActive && req.user?.role !== 'admin') {
      res.status(404).json(createErrorResponse('Mediendatei nicht verfügbar', 404));
      return;
    }

    res.json(createSuccessResponse(mediaFile));

  } catch (error) {
    console.error('Fehler beim Abrufen der Mediendatei:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Mediendatei', 500));
  }
}

/**
 * Mediendatei löschen
 * DELETE /api/media/:id
 */
export async function deleteMedia(req: AuthRequest, res: Response): Promise<void> {
  try {
    const mediaId = parseInt(req.params.id);
    const user = req.user!;

    const mediaResult = await db
      .select()
      .from(media)
      .where(eq(media.id, mediaId))
      .limit(1);

    if (mediaResult.length === 0) {
      res.status(404).json(createErrorResponse('Mediendatei nicht gefunden', 404));
      return;
    }

    const mediaFile = mediaResult[0];

    // Autorisierung: nur eigene Uploads oder Admin
    if (user.role !== 'admin' && mediaFile.uploadedBy !== user.id) {
      res.status(403).json(createErrorResponse('Zugriff verweigert', 403));
      return;
    }

    await db.transaction(async (tx) => {
      // Medien-Eintrag als inaktiv markieren (Soft Delete)
      await tx
        .update(media)
        .set({
          isActive: false,
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(media.id, mediaId));

      // Bei Cloudinary: Datei löschen
      if (mediaFile.cloudinaryId && useCloudinary) {
        try {
          await cloudinary.uploader.destroy(mediaFile.cloudinaryId);
        } catch (cloudinaryError) {
          console.error('Cloudinary-Löschung fehlgeschlagen:', cloudinaryError);
        }
      }

      // Lokale Datei löschen (falls vorhanden)
      if (!useCloudinary && mediaFile.filePath.startsWith('/uploads/')) {
        try {
          const localPath = path.join(process.cwd(), mediaFile.filePath);
          await fs.unlink(localPath);
        } catch (fsError) {
          console.error('Lokale Datei-Löschung fehlgeschlagen:', fsError);
        }
      }

      // Audit-Log erstellen
      await tx.insert(auditLogs).values({
        entityType: 'media',
        entityId: mediaId,
        action: 'delete',
        performedBy: user.id,
        performedByEmail: user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        changes: { 
          fileName: mediaFile.originalName,
          filePath: mediaFile.filePath
        },
        gdprLegalBasis: 'legitimate_interest'
      });
    });

    res.json(createSuccessResponse(
      { mediaId, status: 'deleted' },
      'Mediendatei erfolgreich gelöscht'
    ));

  } catch (error) {
    console.error('Fehler beim Löschen der Mediendatei:', error);
    res.status(500).json(createErrorResponse('Fehler beim Löschen der Mediendatei', 500));
  }
}

// ========================
// HILFSFUNKTIONEN
// ========================

/**
 * Bild optimieren mit Sharp
 */
async function optimizeImage(inputPath: string, uploadType: string): Promise<string> {
  try {
    const outputPath = inputPath.replace(/\.[^/.]+$/, '_optimized.webp');
    
    let sharpInstance = sharp(inputPath);
    
    // Größe basierend auf Upload-Typ anpassen
    switch (uploadType) {
      case 'products':
        sharpInstance = sharpInstance.resize(800, 800, { 
          fit: 'inside', 
          withoutEnlargement: true 
        });
        break;
      case 'avatars':
        sharpInstance = sharpInstance.resize(200, 200, { 
          fit: 'cover' 
        });
        break;
      case 'collections':
        sharpInstance = sharpInstance.resize(1200, 600, { 
          fit: 'cover' 
        });
        break;
      default:
        sharpInstance = sharpInstance.resize(1920, 1080, { 
          fit: 'inside', 
          withoutEnlargement: true 
        });
    }

    await sharpInstance
      .webp({ quality: 85 })
      .toFile(outputPath);

    // Original-Datei löschen
    await fs.unlink(inputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Bild-Optimierung fehlgeschlagen:', error);
    return inputPath; // Original-Datei bei Fehler zurückgeben
  }
}

/**
 * Datei zu Cloudinary hochladen
 */
async function uploadToCloudinary(filePath: string, uploadType: string): Promise<any> {
  try {
    const options: any = {
      folder: `dressforp/${uploadType}`,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true
    };

    // Transformationen für verschiedene Upload-Typen
    if (uploadType === 'products') {
      options.transformation = [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ];
    }

    const result = await cloudinary.uploader.upload(filePath, options);
    return result;
  } catch (error) {
    console.error('Cloudinary-Upload fehlgeschlagen:', error);
    throw error;
  }
}

/**
 * Medien-Service-Status prüfen
 */
export async function checkMediaServiceHealth(): Promise<{ status: string; details?: any }> {
  try {
    // Lokale Upload-Verzeichnisse prüfen
    for (const [type, dir] of Object.entries(UPLOAD_DIRS)) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }

    // Cloudinary-Status prüfen (falls konfiguriert)
    let cloudinaryStatus = 'nicht konfiguriert';
    if (useCloudinary) {
      try {
        await cloudinary.api.ping();
        cloudinaryStatus = 'verbunden';
      } catch {
        cloudinaryStatus = 'fehler';
      }
    }

    return { 
      status: 'healthy',
      details: {
        localStorage: 'verfügbar',
        cloudinary: cloudinaryStatus,
        uploadDirs: Object.keys(UPLOAD_DIRS)
      }
    };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      details: `Medien-Service-Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` 
    };
  }
}

// ========================
// EXPORT
// ========================

export default {
  uploadSingleFile,
  uploadMultipleFiles,
  getMedia,
  getMediaById,
  deleteMedia,
  checkMediaServiceHealth
};
