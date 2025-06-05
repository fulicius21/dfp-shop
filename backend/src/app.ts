/**
 * Express.js Hauptanwendung für DressForPleasure Backend
 * 
 * Diese Datei konfiguriert:
 * - Express Server Setup
 * - Middleware-Konfiguration
 * - Route-Definitionen
 * - Error-Handling
 * - Health-Checks
 */

import express from 'express';
import * as dotenv from 'dotenv';
import { testConnection, closeConnection, healthCheck } from './db/connection';
import { 
  corsMiddleware,
  helmetConfig,
  requestLogger,
  enhancedLogger,
  compressionMiddleware,
  globalErrorHandler,
  notFoundHandler,
  standardRateLimit,
  validateContentType,
  healthCheckMiddleware
} from './middleware/security';
import { sanitizeInput } from './middleware/validation';
import { requireGdprCompliance } from './middleware/auth';
import { createSuccessResponse, createErrorResponse, getAppVersion } from './utils';
import { initializeEmailService, checkEmailServiceHealth } from './services/emailService';
import { checkMediaServiceHealth } from './controllers/media';

// Environment Variables laden
dotenv.config();

// Express App erstellen
const app = express();

// ========================
// GRUNDLEGENDE MIDDLEWARE
// ========================

// Trust proxy für Heroku, Railway, etc.
app.set('trust proxy', 1);

// Sicherheits-Headers
app.use(helmetConfig);

// CORS konfigurieren
app.use(corsMiddleware);

// Request-Logging
app.use(requestLogger);
app.use(enhancedLogger);

// Compression für bessere Performance
app.use(compressionMiddleware);

// Health-Check-Middleware (vor Rate-Limiting)
app.use(healthCheckMiddleware);

// Rate Limiting für alle Routes
app.use(standardRateLimit);

// Body-Parser für JSON und URL-encoded
app.use(express.json({ 
  limit: process.env.MAX_REQUEST_SIZE || '10mb',
  strict: true
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_REQUEST_SIZE || '10mb' 
}));

// Content-Type Validation für POST/PUT/PATCH
app.use(validateContentType());

// Input-Sanitization
app.use(sanitizeInput);

// DSGVO-Compliance-Middleware
app.use(requireGdprCompliance);

// ========================
// ROUTES IMPORTIEREN
// ========================

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import collectionRoutes from './routes/collections';
import orderRoutes from './routes/orders';
import customerRoutes from './routes/customers';
import mediaRoutes from './routes/media';
import webhookRoutes from './routes/webhooks';
import healthRoutes from './routes/health';

// ========================
// API ROUTES REGISTRIEREN
// ========================

const API_PREFIX = '/api';

// Health-Check (ohne Auth)
app.use('/health', healthRoutes);

// Authentication Routes
app.use(`${API_PREFIX}/auth`, authRoutes);

// Public Product Routes (ohne Auth für Frontend)
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/collections`, collectionRoutes);

// Protected Routes (mit Auth)
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/customers`, customerRoutes);
app.use(`${API_PREFIX}/media`, mediaRoutes);

// Webhook Routes (spezielle Auth)
app.use(`${API_PREFIX}/webhooks`, webhookRoutes);

// ========================
// ROOT ENDPOINT
// ========================

app.get('/', (req, res) => {
  res.json(createSuccessResponse({
    message: 'DressForPleasure Backend API',
    version: getAppVersion(),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    documentation: `${req.protocol}://${req.get('host')}/api/docs`,
    endpoints: {
      auth: `${req.protocol}://${req.get('host')}${API_PREFIX}/auth`,
      products: `${req.protocol}://${req.get('host')}${API_PREFIX}/products`,
      categories: `${req.protocol}://${req.get('host')}${API_PREFIX}/categories`,
      collections: `${req.protocol}://${req.get('host')}${API_PREFIX}/collections`,
      orders: `${req.protocol}://${req.get('host')}${API_PREFIX}/orders`,
      customers: `${req.protocol}://${req.get('host')}${API_PREFIX}/customers`,
      webhooks: `${req.protocol}://${req.get('host')}${API_PREFIX}/webhooks`,
      health: `${req.protocol}://${req.get('host')}/health`
    }
  }, 'API ist bereit'));
});

// ========================
// API DOCUMENTATION
// ========================

app.get(`${API_PREFIX}/docs`, (req, res) => {
  res.json(createSuccessResponse({
    title: 'DressForPleasure API Documentation',
    version: getAppVersion(),
    baseUrl: `${req.protocol}://${req.get('host')}${API_PREFIX}`,
    authentication: {
      type: 'Bearer Token',
      description: 'JWT Token im Authorization Header: Bearer <token>'
    },
    endpoints: {
      'Authentication': {
        'POST /auth/login': 'Benutzer anmelden',
        'POST /auth/refresh': 'Token erneuern',
        'POST /auth/logout': 'Benutzer abmelden',
        'GET /auth/profile': 'Benutzerprofil abrufen',
        'PUT /auth/profile': 'Benutzerprofil aktualisieren'
      },
      'Products': {
        'GET /products': 'Alle Produkte abrufen (mit Filterung)',
        'GET /products/:id': 'Einzelnes Produkt abrufen',
        'GET /products/slug/:slug': 'Produkt nach Slug abrufen',
        'POST /products': 'Neues Produkt erstellen [AUTH]',
        'PUT /products/:id': 'Produkt aktualisieren [AUTH]',
        'DELETE /products/:id': 'Produkt löschen [AUTH]'
      },
      'Categories': {
        'GET /categories': 'Alle Kategorien abrufen (hierarchisch)',
        'GET /categories/flat': 'Kategorien als flache Liste',
        'GET /categories/:id': 'Einzelne Kategorie abrufen',
        'GET /categories/slug/:slug': 'Kategorie nach Slug abrufen',
        'POST /categories': 'Neue Kategorie erstellen [AUTH]',
        'PUT /categories/:id': 'Kategorie aktualisieren [AUTH]',
        'DELETE /categories/:id': 'Kategorie löschen [AUTH]'
      },
      'Collections': {
        'GET /collections': 'Alle Kollektionen abrufen',
        'GET /collections/featured': 'Featured Kollektionen abrufen',
        'GET /collections/:id': 'Einzelne Kollektion abrufen',
        'GET /collections/slug/:slug': 'Kollektion nach Slug abrufen',
        'GET /collections/:id/products': 'Produkte einer Kollektion abrufen',
        'POST /collections': 'Neue Kollektion erstellen [AUTH]',
        'PUT /collections/:id': 'Kollektion aktualisieren [AUTH]',
        'DELETE /collections/:id': 'Kollektion löschen [AUTH]'
      },
      'Orders': {
        'GET /orders': 'Alle Bestellungen abrufen [AUTH]',
        'GET /orders/:id': 'Einzelne Bestellung abrufen [AUTH]',
        'POST /orders': 'Neue Bestellung erstellen',
        'PUT /orders/:id': 'Bestellung aktualisieren [AUTH]',
        'PATCH /orders/:id/status': 'Bestellstatus ändern [AUTH]'
      },
      'Webhooks': {
        'POST /webhooks/stripe': 'Stripe Webhook Handler',
        'POST /webhooks/product-sync': 'Produktsynchronisation'
      }
    },
    queryParameters: {
      pagination: 'page, limit, sortBy, sortOrder',
      filtering: 'q (search), category, collection, featured, status, minPrice, maxPrice',
      examples: {
        'GET /products?page=1&limit=20&category=kleider&featured=true': 'Featured Kleider, erste 20',
        'GET /products?q=berlin&minPrice=50&maxPrice=200': 'Suche nach "berlin", Preis 50-200€'
      }
    },
    errorCodes: {
      400: 'Bad Request - Validierungsfehler',
      401: 'Unauthorized - Authentifizierung erforderlich',
      403: 'Forbidden - Unzureichende Berechtigung',
      404: 'Not Found - Ressource nicht gefunden',
      409: 'Conflict - Datensatz bereits vorhanden',
      429: 'Too Many Requests - Rate Limit erreicht',
      500: 'Internal Server Error - Serverfehler'
    }
  }, 'API-Dokumentation'));
});

// ========================
// METRICS ENDPOINT
// ========================

app.get('/metrics', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.json(createSuccessResponse({
      uptime: {
        seconds: uptime,
        formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      },
      database: dbHealth,
      environment: process.env.NODE_ENV || 'development',
      version: getAppVersion(),
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Metriken', 500));
  }
});

// ========================
// ERROR HANDLING
// ========================

// 404 Handler für nicht gefundene Routes
app.use(notFoundHandler);

// Globaler Error Handler
app.use(globalErrorHandler);

// ========================
// SERVER STARTUP
// ========================

// Cloud-optimierte Port-Konfiguration
const PORT = parseInt(process.env.PORT || '3000');
// Host-Konfiguration für Cloud-Provider
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : (process.env.HOST || 'localhost');

/**
 * Server starten
 */
async function startServer() {
  try {
    // Datenbankverbindung testen
    console.log('🔄 Teste Datenbankverbindung...');
    const isDbConnected = await testConnection();
    
    if (!isDbConnected) {
      console.error('❌ Datenbankverbindung fehlgeschlagen. Server wird nicht gestartet.');
      process.exit(1);
    }

    // Services initialisieren
    console.log('🔄 Initialisiere Services...');
    
    try {
      // E-Mail-Service initialisieren
      initializeEmailService();
      const emailHealth = await checkEmailServiceHealth();
      console.log(`📧 E-Mail-Service: ${emailHealth.status}`);
      
      // Media-Service initialisieren
      const mediaHealth = await checkMediaServiceHealth();
      console.log(`📁 Media-Service: ${mediaHealth.status}`);
      
    } catch (serviceError) {
      console.warn('⚠️  Einige Services konnten nicht vollständig initialisiert werden:', serviceError);
    }

    // Server starten
    const server = app.listen(PORT, HOST, () => {
      console.log('\n🚀 DressForPleasure Backend gestartet!');
      console.log(`📍 Server läuft auf: http://${HOST}:${PORT}`);
      console.log(`🌐 API verfügbar unter: http://${HOST}:${PORT}/api`);
      console.log(`📚 Dokumentation: http://${HOST}:${PORT}/api/docs`);
      console.log(`💚 Health Check: http://${HOST}:${PORT}/health`);
      console.log(`📊 Metriken: http://${HOST}:${PORT}/metrics`);
      console.log(`🛡️  Umgebung: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📝 Version: ${getAppVersion()}`);
      console.log('═══════════════════════════════════════════════════════\n');
    });

    // Graceful Shutdown Handler
    const gracefulShutdown = (signal: string) => {
      console.log(`\n📢 ${signal} empfangen. Starte Graceful Shutdown...`);
      
      server.close(async () => {
        console.log('🔄 HTTP Server geschlossen');
        
        try {
          await closeConnection();
          console.log('✅ Graceful Shutdown abgeschlossen');
          process.exit(0);
        } catch (error) {
          console.error('❌ Fehler beim Graceful Shutdown:', error);
          process.exit(1);
        }
      });

      // Forced Shutdown nach 30 Sekunden
      setTimeout(() => {
        console.error('❌ Forced Shutdown nach 30 Sekunden');
        process.exit(1);
      }, 30000);
    };

    // Signal Handler registrieren
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Unhandled Promise Rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught Exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    console.error('❌ Fehler beim Serverstart:', error);
    process.exit(1);
  }
}

// Server nur starten wenn direkt ausgeführt
if (require.main === module) {
  startServer();
}

// App exportieren für Tests
export default app;
