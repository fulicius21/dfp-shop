/**
 * DressForPleasure AI Style Creator - Main Application
 * ====================================================
 * 
 * Hauptanwendung für das KI Style Creator System:
 * - Express.js Server mit REST API
 * - Integration aller Services (ImageEnhancement, ContentGeneration, ReviewSystem)
 * - Web-Dashboard Serving
 * - Security und Performance Middleware
 * 
 * Author: DressForPleasure Dev Team
 * Version: 1.0.0
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Import Routes
const apiRoutes = require('./api/routes');

// Import Services für Initialisierung
const ImageEnhancementService = require('./services/imageEnhancement');
const ContentGenerationService = require('./services/contentGeneration');
const ReviewSystemService = require('./services/reviewSystem');

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.PORT || 8001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const API_BASE_PATH = '/api';

// Security Configuration
const CORS_ORIGINS = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3001', 'http://localhost:3000'];

// Rate Limiting Configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = NODE_ENV === 'production' ? 100 : 1000;

// ============================================================================
// Express App Setup
// ============================================================================

const app = express();

console.log('🚀 Starte DressForPleasure AI Style Creator...');

// ============================================================================
// Security Middleware
// ============================================================================

// Helmet für Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "blob:"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
            connectSrc: ["'self'", "http://localhost:*"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (CORS_ORIGINS.includes(origin) || NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    max: RATE_LIMIT_MAX,
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
    }
});

app.use(limiter);

// ============================================================================
// General Middleware
// ============================================================================

// Compression
app.use(compression());

// Logging
if (NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Files - Serve Web Dashboard
app.use('/dashboard', express.static(path.join(__dirname, 'web')));
app.use('/thumbnails', express.static(path.join(__dirname, '../thumbnails')));
app.use('/output', express.static(path.join(__dirname, '../output')));

// ============================================================================
// Global Services Initialization
// ============================================================================

let services = {
    imageEnhancement: null,
    contentGeneration: null,
    reviewSystem: null
};

async function initializeServices() {
    console.log('🔧 Initialisiere KI-Services...');
    
    try {
        // Initialize services
        services.imageEnhancement = new ImageEnhancementService();
        services.contentGeneration = new ContentGenerationService();
        services.reviewSystem = new ReviewSystemService();
        
        // Initialize AI models
        console.log('🤖 Lade KI-Modelle...');
        await services.imageEnhancement.initialize();
        await services.contentGeneration.initialize();
        
        console.log('✅ Alle Services erfolgreich initialisiert');
        
    } catch (error) {
        console.error('❌ Service-Initialisierung fehlgeschlagen:', error);
        throw error;
    }
}

// Make services globally available
app.locals.services = services;

// ============================================================================
// Routes
// ============================================================================

// Health Check (before API routes for faster response)
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        version: require('../package.json').version,
        services: {
            imageEnhancement: services.imageEnhancement?.isInitialized || false,
            contentGeneration: services.contentGeneration?.isInitialized || false,
            reviewSystem: !!services.reviewSystem
        },
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
    };
    
    res.json(health);
});

// Dashboard Root
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'dashboard.html'));
});

// API Routes
app.use(API_BASE_PATH, apiRoutes);

// API Documentation
app.get('/api', (req, res) => {
    res.json({
        name: 'DressForPleasure AI Style Creator API',
        version: require('../package.json').version,
        description: 'KI-basierte Bildverbesserung und Content-Generierung für Fashion E-Commerce',
        endpoints: {
            health: 'GET /health',
            dashboard: 'GET /dashboard',
            imageEnhancement: {
                single: 'POST /api/enhance/image',
                batch: 'POST /api/enhance/batch',
                jobStatus: 'GET /api/enhance/job/:jobId'
            },
            contentGeneration: {
                generate: 'POST /api/generate/content'
            },
            reviews: {
                list: 'GET /api/reviews',
                details: 'GET /api/reviews/:reviewId',
                approve: 'POST /api/reviews/:reviewId/approve',
                reject: 'POST /api/reviews/:reviewId/reject',
                revision: 'POST /api/reviews/:reviewId/revision'
            },
            analytics: {
                stats: 'GET /api/analytics/stats',
                notifications: 'GET /api/notifications'
            }
        },
        documentation: 'https://github.com/dressforp/ai-style-creator/docs'
    });
});

// ============================================================================
// Error Handling
// ============================================================================

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Global Error Handler
app.use((error, req, res, next) => {
    console.error('❌ Global Error Handler:', error);
    
    // CORS Error
    if (error.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            error: 'CORS policy violation',
            message: 'Origin not allowed'
        });
    }
    
    // Multer Error (File Upload)
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            error: 'File too large',
            message: 'Maximum file size is 10MB'
        });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
            success: false,
            error: 'Too many files',
            message: 'Maximum 10 files per upload'
        });
    }
    
    // Validation Error
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON',
            message: 'Request body contains invalid JSON'
        });
    }
    
    // Default Error Response
    const status = error.status || error.statusCode || 500;
    const message = NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message;
    
    res.status(status).json({
        success: false,
        error: message,
        ...(NODE_ENV === 'development' && { stack: error.stack })
    });
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

function gracefulShutdown(signal) {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
    process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled Promise Rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Uncaught Exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// ============================================================================
// Server Startup
// ============================================================================

async function startServer() {
    try {
        // Initialize services first
        await initializeServices();
        
        // Start HTTP server
        const server = app.listen(PORT, () => {
            console.log(`\n🎨 DressForPleasure AI Style Creator gestartet!`);
            console.log(`📍 Server läuft auf: http://localhost:${PORT}`);
            console.log(`🌐 Dashboard: http://localhost:${PORT}/dashboard`);
            console.log(`🔗 API: http://localhost:${PORT}/api`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environment: ${NODE_ENV}`);
            console.log(`\n✅ System bereit für KI-Bildverarbeitung!\n`);
        });
        
        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} ist bereits in Verwendung`);
                process.exit(1);
            } else {
                console.error('❌ Server Error:', error);
                process.exit(1);
            }
        });
        
        return server;
        
    } catch (error) {
        console.error('❌ Server-Start fehlgeschlagen:', error);
        process.exit(1);
    }
}

// ============================================================================
// Export für Testing
// ============================================================================

module.exports = app;

// ============================================================================
// Start Server (nur wenn direkt ausgeführt)
// ============================================================================

if (require.main === module) {
    startServer();
}