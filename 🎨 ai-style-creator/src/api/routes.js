/**
 * DressForPleasure AI Style Creator - API Routes
 * ===============================================
 * 
 * RESTful API-Endpunkte für das KI Style Creator System:
 * - Image Enhancement API
 * - Content Generation API  
 * - Review System API
 * - Batch Processing API
 * - Status & Monitoring API
 * 
 * Author: DressForPleasure Dev Team
 * Version: 1.0.0
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');

// Services
const ImageEnhancementService = require('../services/imageEnhancement');
const ContentGenerationService = require('../services/contentGeneration');
const ReviewSystemService = require('../services/reviewSystem');

const router = express.Router();

// Service-Instanzen
const imageEnhancer = new ImageEnhancementService();
const contentGenerator = new ContentGenerationService();
const reviewSystem = new ReviewSystemService();

// ============================================================================
// Middleware Setup
// ============================================================================

// File Upload Configuration
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Nur JPEG, PNG und WebP Dateien sind erlaubt'));
        }
    }
});

// Rate Limiting
const standardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Zu viele Anfragen, bitte versuchen Sie es später erneut.'
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 uploads per windowMs
    message: 'Upload-Limit erreicht, bitte warten Sie 15 Minuten.'
});

// Validation Error Handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// ============================================================================
// Health & Status Routes
// ============================================================================

/**
 * @route GET /health
 * @desc System Health Check
 */
router.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                imageEnhancement: imageEnhancer.isInitialized,
                contentGeneration: contentGenerator.isInitialized,
                reviewSystem: true
            },
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };
        
        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

/**
 * @route GET /status
 * @desc Detaillierter System-Status
 */
router.get('/status', standardLimiter, async (req, res) => {
    try {
        const status = {
            system: {
                status: 'running',
                version: '1.0.0',
                uptime: process.uptime(),
                memory: process.memoryUsage()
            },
            services: {
                imageEnhancement: {
                    initialized: imageEnhancer.isInitialized,
                    activeJobs: imageEnhancer.getActiveJobs().length,
                    queueSize: imageEnhancer.processingQueue.size
                },
                contentGeneration: {
                    initialized: contentGenerator.isInitialized
                },
                reviewSystem: {
                    totalReviews: reviewSystem.getAllReviews().length,
                    pendingReviews: reviewSystem.getPendingReviews().length,
                    stats: reviewSystem.getReviewStats()
                }
            },
            timestamp: new Date().toISOString()
        };
        
        res.json(status);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================================================
// Image Enhancement Routes
// ============================================================================

/**
 * @route POST /enhance/image
 * @desc Einzelbild Enhancement
 */
router.post('/enhance/image', 
    uploadLimiter,
    upload.single('image'),
    [
        body('style').optional().isIn(['studio', 'street', 'lifestyle', 'luxury', 'berlin', 'atlanta']),
        body('quality').optional().isIn(['standard', 'high', 'ultra']),
        body('enhanceColors').optional().isBoolean(),
        body('removeBackground').optional().isBoolean(),
        body('generateVariants').optional().isBoolean()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'Keine Bilddatei hochgeladen'
                });
            }
            
            console.log(`🎨 Starte Bildverbesserung: ${req.file.originalname}`);
            
            const options = {
                style: req.body.style || 'studio',
                quality: req.body.quality || 'high',
                enhanceColors: req.body.enhanceColors !== 'false',
                removeBackground: req.body.removeBackground === 'true',
                generateVariants: req.body.generateVariants !== 'false',
                outputFormat: 'jpeg'
            };
            
            // Bildverbesserung starten
            const result = await imageEnhancer.enhanceImage(req.file.path, options);
            
            // Review erstellen
            const review = await reviewSystem.createReview({
                type: reviewSystem.reviewTypes.IMAGE_ENHANCEMENT,
                originalImage: req.file.path,
                originalMetadata: {
                    filename: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                },
                processedImages: [result.outputFiles.main, ...result.outputFiles.variants],
                qualityScore: result.finalQuality,
                qualityMetrics: {
                    originalQuality: result.originalQuality,
                    improvement: result.qualityImprovement,
                    processingTime: result.processingTime
                },
                processingMetadata: result.metadata,
                filename: req.file.originalname,
                jobId: result.jobId,
                settings: options
            });
            
            res.json({
                success: true,
                jobId: result.jobId,
                reviewId: review.id,
                result: {
                    status: result.status,
                    processingTime: result.processingTime,
                    qualityImprovement: result.qualityImprovement,
                    outputFiles: result.outputFiles,
                    variants: result.variants
                },
                review: {
                    id: review.id,
                    status: review.status,
                    requiresManualReview: review.workflow.currentStep === 'manual_review'
                }
            });
            
        } catch (error) {
            console.error('❌ Bildverbesserung fehlgeschlagen:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

/**
 * @route POST /enhance/batch
 * @desc Batch Bildverbesserung
 */
router.post('/enhance/batch',
    uploadLimiter,
    upload.array('images', 10),
    [
        body('style').optional().isIn(['studio', 'street', 'lifestyle', 'luxury', 'berlin', 'atlanta']),
        body('quality').optional().isIn(['standard', 'high', 'ultra']),
        body('batchName').optional().isLength({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Keine Bilddateien hochgeladen'
                });
            }
            
            console.log(`📦 Starte Batch-Verarbeitung: ${req.files.length} Bilder`);
            
            const options = {
                style: req.body.style || 'studio',
                quality: req.body.quality || 'high',
                enhanceColors: req.body.enhanceColors !== 'false',
                removeBackground: req.body.removeBackground === 'true',
                generateVariants: req.body.generateVariants !== 'false'
            };
            
            const batchItems = [];
            
            // Jedes Bild verarbeiten
            for (const file of req.files) {
                try {
                    const result = await imageEnhancer.enhanceImage(file.path, options);
                    
                    batchItems.push({
                        originalImage: file.path,
                        originalMetadata: {
                            filename: file.originalname,
                            size: file.size,
                            mimetype: file.mimetype
                        },
                        processedImages: [result.outputFiles.main, ...result.outputFiles.variants],
                        qualityScore: result.finalQuality,
                        processingMetadata: result.metadata,
                        filename: file.originalname,
                        jobId: result.jobId,
                        settings: options
                    });
                    
                } catch (error) {
                    console.error(`❌ Fehler bei Verarbeitung von ${file.originalname}:`, error);
                    // Weiter mit nächstem Bild
                }
            }
            
            // Batch-Review erstellen
            const batchReview = await reviewSystem.createBatchReview(batchItems, {
                batchName: req.body.batchName || `Batch ${new Date().toLocaleDateString()}`,
                autoApprovalEnabled: true
            });
            
            res.json({
                success: true,
                batchId: batchReview.id,
                processedItems: batchReview.processedItems,
                approvedItems: batchReview.approvedItems,
                rejectedItems: batchReview.rejectedItems,
                items: batchReview.items
            });
            
        } catch (error) {
            console.error('❌ Batch-Verarbeitung fehlgeschlagen:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

/**
 * @route GET /enhance/job/:jobId
 * @desc Job-Status abfragen
 */
router.get('/enhance/job/:jobId',
    standardLimiter,
    [param('jobId').isUUID()],
    handleValidationErrors,
    async (req, res) => {
        try {
            const jobStatus = imageEnhancer.getJobStatus(req.params.jobId);
            
            if (jobStatus.status === 'not_found') {
                return res.status(404).json({
                    success: false,
                    error: 'Job nicht gefunden'
                });
            }
            
            res.json({
                success: true,
                jobId: req.params.jobId,
                status: jobStatus
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

// ============================================================================
// Content Generation Routes
// ============================================================================

/**
 * @route POST /generate/content
 * @desc Content für Produktbild generieren
 */
router.post('/generate/content',
    standardLimiter,
    upload.single('image'),
    [
        body('brandVoice').optional().isIn(['berlin', 'atlanta']),
        body('category').optional().isLength({ min: 1, max: 50 }),
        body('targetAudience').optional().isLength({ min: 1, max: 50 }),
        body('language').optional().isIn(['de', 'en'])
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'Keine Bilddatei hochgeladen'
                });
            }
            
            console.log(`📝 Generiere Content für: ${req.file.originalname}`);
            
            const options = {
                brandVoice: req.body.brandVoice || 'berlin',
                category: req.body.category || 'fashion',
                targetAudience: req.body.targetAudience || 'general',
                language: req.body.language || 'de',
                includeSEO: true,
                includeStylingTips: true
            };
            
            const imageData = {
                buffer: await fs.readFile(req.file.path),
                metadata: {
                    filename: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                }
            };
            
            const content = await contentGenerator.generateProductContent(imageData, options);
            
            // Review für Content erstellen
            const review = await reviewSystem.createReview({
                type: reviewSystem.reviewTypes.CONTENT_GENERATION,
                originalImage: req.file.path,
                generatedContent: content,
                qualityScore: 85, // Content-Qualität wird anders bewertet
                filename: req.file.originalname,
                settings: options
            });
            
            res.json({
                success: true,
                reviewId: review.id,
                content,
                review: {
                    id: review.id,
                    status: review.status
                }
            });
            
        } catch (error) {
            console.error('❌ Content-Generierung fehlgeschlagen:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

// ============================================================================
// Review System Routes
// ============================================================================

/**
 * @route GET /reviews
 * @desc Alle Reviews abrufen
 */
router.get('/reviews',
    standardLimiter,
    [
        query('status').optional().isIn(['pending', 'approved', 'rejected', 'revision_requested']),
        query('type').optional().isIn(['image_enhancement', 'content_generation', 'batch_processing']),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const filters = {
                status: req.query.status,
                type: req.query.type,
                userId: req.query.userId
            };
            
            let reviews = reviewSystem.getAllReviews(filters);
            
            // Pagination
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const offset = (page - 1) * limit;
            
            const paginatedReviews = reviews.slice(offset, offset + limit);
            
            res.json({
                success: true,
                reviews: paginatedReviews,
                pagination: {
                    total: reviews.length,
                    page,
                    limit,
                    pages: Math.ceil(reviews.length / limit)
                },
                stats: reviewSystem.getReviewStats()
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

/**
 * @route GET /reviews/pending
 * @desc Pending Reviews abrufen
 */
router.get('/reviews/pending', standardLimiter, async (req, res) => {
    try {
        const pendingReviews = reviewSystem.getPendingReviews();
        
        res.json({
            success: true,
            reviews: pendingReviews,
            count: pendingReviews.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route GET /reviews/:reviewId
 * @desc Einzelnen Review abrufen
 */
router.get('/reviews/:reviewId',
    standardLimiter,
    [param('reviewId').isUUID()],
    handleValidationErrors,
    async (req, res) => {
        try {
            const review = reviewSystem.getReview(req.params.reviewId);
            
            if (!review) {
                return res.status(404).json({
                    success: false,
                    error: 'Review nicht gefunden'
                });
            }
            
            // Vergleichsansicht erstellen
            const comparison = await reviewSystem.createComparisonView(req.params.reviewId);
            
            res.json({
                success: true,
                review,
                comparison
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

/**
 * @route POST /reviews/:reviewId/approve
 * @desc Review genehmigen
 */
router.post('/reviews/:reviewId/approve',
    standardLimiter,
    [
        param('reviewId').isUUID(),
        body('reviewerName').optional().isLength({ min: 1, max: 100 }),
        body('rating').optional().isInt({ min: 1, max: 5 }),
        body('comments').optional().isLength({ max: 1000 }),
        body('publishToWebsite').optional().isBoolean()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const approvalData = {
                reviewerName: req.body.reviewerName || 'Anonymous',
                rating: req.body.rating || 5,
                comments: req.body.comments || '',
                publishToWebsite: req.body.publishToWebsite !== false
            };
            
            const review = await reviewSystem.approveReview(req.params.reviewId, approvalData);
            
            res.json({
                success: true,
                review,
                message: 'Review erfolgreich genehmigt'
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

/**
 * @route POST /reviews/:reviewId/reject
 * @desc Review ablehnen
 */
router.post('/reviews/:reviewId/reject',
    standardLimiter,
    [
        param('reviewId').isUUID(),
        body('reviewerName').optional().isLength({ min: 1, max: 100 }),
        body('reason').isLength({ min: 1, max: 500 }),
        body('suggestions').optional().isLength({ max: 1000 })
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const rejectionData = {
                reviewerName: req.body.reviewerName || 'Anonymous',
                reason: req.body.reason,
                suggestions: req.body.suggestions || ''
            };
            
            const review = await reviewSystem.rejectReview(req.params.reviewId, rejectionData);
            
            res.json({
                success: true,
                review,
                message: 'Review erfolgreich abgelehnt'
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

/**
 * @route POST /reviews/:reviewId/revision
 * @desc Überarbeitung anfordern
 */
router.post('/reviews/:reviewId/revision',
    standardLimiter,
    [
        param('reviewId').isUUID(),
        body('reviewerName').optional().isLength({ min: 1, max: 100 }),
        body('feedback').isLength({ min: 1, max: 500 }),
        body('suggestions').optional().isArray()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const revisionData = {
                reviewerName: req.body.reviewerName || 'Anonymous',
                feedback: req.body.feedback,
                suggestions: req.body.suggestions || []
            };
            
            const review = await reviewSystem.requestRevision(req.params.reviewId, revisionData);
            
            res.json({
                success: true,
                review,
                message: 'Überarbeitung erfolgreich angefordert'
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

// ============================================================================
// Batch Processing Routes
// ============================================================================

/**
 * @route GET /batch/:batchId
 * @desc Batch-Job Status abrufen
 */
router.get('/batch/:batchId',
    standardLimiter,
    [param('batchId').isUUID()],
    handleValidationErrors,
    async (req, res) => {
        try {
            const batch = reviewSystem.getBatchJob(req.params.batchId);
            
            if (!batch) {
                return res.status(404).json({
                    success: false,
                    error: 'Batch-Job nicht gefunden'
                });
            }
            
            res.json({
                success: true,
                batch
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

// ============================================================================
// Monitoring & Analytics Routes
// ============================================================================

/**
 * @route GET /analytics/stats
 * @desc System-Statistiken abrufen
 */
router.get('/analytics/stats', standardLimiter, async (req, res) => {
    try {
        const stats = {
            reviews: reviewSystem.getReviewStats(),
            processing: {
                activeJobs: imageEnhancer.getActiveJobs().length,
                queueSize: imageEnhancer.processingQueue.size
            },
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            }
        };
        
        res.json({
            success: true,
            stats
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route GET /notifications
 * @desc Benachrichtigungen abrufen
 */
router.get('/notifications', standardLimiter, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const notifications = reviewSystem.getNotifications(limit);
        
        res.json({
            success: true,
            notifications,
            count: notifications.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================================================
// Error Handling
// ============================================================================

// Global Error Handler
router.use((error, req, res, next) => {
    console.error('❌ API Error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'Datei zu groß (max. 10MB)'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Zu viele Dateien (max. 10)'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        error: 'Interner Server-Fehler',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404 Handler
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpunkt nicht gefunden'
    });
});

module.exports = router;