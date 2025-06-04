/**
 * Health-Check-Routen für DressForPleasure Backend
 * 
 * Diese Routen stellen Health-Check-Endpunkte bereit für:
 * - Grundlegende Server-Health
 * - Datenbankverbindung
 * - Service-Dependencies
 * - Detaillierte System-Metriken
 */

import { Router } from 'express';
import { healthCheck } from '../db/connection';
import { createSuccessResponse, createErrorResponse, getAppVersion } from '../utils';
import { asyncHandler } from '../middleware/security';

const router = Router();

/**
 * @route   GET /health
 * @desc    Basis Health Check
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Datenbankverbindung testen
    const dbHealth = await healthCheck();
    const dbResponseTime = Date.now() - startTime;

    // Stripe-Konnektivität testen (vereinfacht)
    const stripeHealth = {
      status: process.env.STRIPE_SECRET_KEY ? 'healthy' : 'unhealthy',
      message: process.env.STRIPE_SECRET_KEY 
        ? 'Stripe-Konfiguration vorhanden' 
        : 'Stripe nicht konfiguriert'
    };

    // Gesamtstatus bestimmen
    const isHealthy = dbHealth.status === 'healthy' && stripeHealth.status === 'healthy';

    const healthResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: getAppVersion(),
      uptime: Math.floor(process.uptime()),
      services: {
        database: {
          ...dbHealth,
          responseTime: dbResponseTime
        },
        stripe: stripeHealth
      }
    };

    if (isHealthy) {
      res.json(createSuccessResponse(healthResponse, 'System ist gesund'));
    } else {
      res.status(503).json(createErrorResponse('System ist nicht vollständig gesund', 503));
    }

  } catch (error) {
    console.error('Health-Check-Fehler:', error);
    res.status(500).json(createErrorResponse('Health-Check fehlgeschlagen', 500));
  }
}));

/**
 * @route   GET /health/ready
 * @desc    Readiness Check (für Kubernetes/Docker)
 * @access  Public
 */
router.get('/ready', asyncHandler(async (req, res) => {
  try {
    // Überprüfe ob alle kritischen Services bereit sind
    const dbHealth = await healthCheck();
    
    if (dbHealth.status === 'healthy') {
      res.json(createSuccessResponse({
        status: 'ready',
        timestamp: new Date().toISOString(),
        message: 'Service ist bereit für Requests'
      }));
    } else {
      res.status(503).json(createErrorResponse('Service ist nicht bereit', 503));
    }

  } catch (error) {
    res.status(503).json(createErrorResponse('Readiness-Check fehlgeschlagen', 503));
  }
}));

/**
 * @route   GET /health/live
 * @desc    Liveness Check (für Kubernetes/Docker)
 * @access  Public
 */
router.get('/live', (req, res) => {
  // Einfacher Liveness-Check - Server antwortet
  res.json(createSuccessResponse({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    message: 'Service ist am Leben'
  }));
});

/**
 * @route   GET /health/detailed
 * @desc    Detaillierte Health-Informationen
 * @access  Public
 */
router.get('/detailed', asyncHandler(async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Datenbankverbindung testen
    const dbHealth = await healthCheck();
    const dbResponseTime = Date.now() - startTime;

    // Memory-Usage
    const memoryUsage = process.memoryUsage();
    
    // CPU-Usage (vereinfacht)
    const cpuUsage = process.cpuUsage();

    // Environment-Informationen
    const environment = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || 'development',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Service-Konfiguration
    const serviceConfig = {
      port: process.env.PORT || 3000,
      host: process.env.HOST || 'localhost',
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: process.env.CORS_CREDENTIALS === 'true'
      },
      database: {
        configured: !!process.env.DATABASE_URL || !!(process.env.DB_HOST && process.env.DB_NAME),
        ssl: process.env.NODE_ENV === 'production'
      },
      stripe: {
        configured: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLIC_KEY)
      },
      features: {
        gdprCompliance: process.env.GDPR_COMPLIANCE_MODE === 'true',
        rateLimit: !!(process.env.RATE_LIMIT_WINDOW_MS && process.env.RATE_LIMIT_MAX_REQUESTS)
      }
    };

    const detailedHealth = {
      status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: getAppVersion(),
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: formatUptime(process.uptime())
      },
      services: {
        database: {
          ...dbHealth,
          responseTime: dbResponseTime
        }
      },
      system: {
        memory: {
          rss: formatBytes(memoryUsage.rss),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsed: formatBytes(memoryUsage.heapUsed),
          external: formatBytes(memoryUsage.external),
          heapUsagePercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      },
      environment,
      configuration: serviceConfig
    };

    res.json(createSuccessResponse(detailedHealth, 'Detaillierte Health-Informationen'));

  } catch (error) {
    console.error('Detailed Health-Check-Fehler:', error);
    res.status(500).json(createErrorResponse('Detaillierter Health-Check fehlgeschlagen', 500));
  }
}));

/**
 * @route   GET /health/dependencies
 * @desc    Check aller externen Dependencies
 * @access  Public
 */
router.get('/dependencies', asyncHandler(async (req, res) => {
  try {
    const dependencies = {};

    // Datenbank-Check
    const dbHealth = await healthCheck();
    dependencies['database'] = dbHealth;

    // Weitere Dependency-Checks könnten hier hinzugefügt werden
    // z.B. Redis, External APIs, etc.

    const allHealthy = Object.values(dependencies).every(
      (dep: any) => dep.status === 'healthy'
    );

    const response = {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies
    };

    if (allHealthy) {
      res.json(createSuccessResponse(response, 'Alle Dependencies sind gesund'));
    } else {
      res.status(503).json({
        success: false,
        data: response,
        message: 'Einige Dependencies sind nicht verfügbar'
      });
    }

  } catch (error) {
    console.error('Dependencies-Check-Fehler:', error);
    res.status(500).json(createErrorResponse('Dependencies-Check fehlgeschlagen', 500));
  }
}));

// ========================
// HELPER FUNCTIONS
// ========================

/**
 * Formatiert Bytes in lesbare Einheiten
 */
function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Formatiert Uptime in lesbare Zeit
 */
function formatUptime(uptimeSeconds: number): string {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
}

export default router;
