/**
 * Sicherheits-Middleware für DressForPleasure Backend
 * 
 * Diese Middleware-Funktionen handhaben:
 * - Rate Limiting
 * - CORS-Konfiguration
 * - Sicherheits-Headers
 * - Request-Logging
 * - Error-Handling
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createErrorResponse, extractErrorInfo, isDevelopment } from '../utils';
import { AuthRequest } from '../types';

// ========================
// RATE LIMITING
// ========================

/**
 * Standard Rate Limiting für API-Endpunkte
 */
export const standardRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 Minuten
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 Requests pro Window
  message: {
    success: false,
    error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
    retryAfter: 900 // 15 Minuten in Sekunden
  },
  standardHeaders: true, // `RateLimit-*` headers zurückgeben
  legacyHeaders: false, // Deaktiviere `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Zu viele Anfragen.',
      retryAfter: Math.round(req.rateLimit.resetTime! / 1000)
    });
  }
});

/**
 * Strenges Rate Limiting für Authentifizierungs-Endpunkte
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5, // Nur 5 Login-Versuche pro 15 Minuten
  skipSuccessfulRequests: true, // Erfolgreiche Requests nicht zählen
  message: {
    success: false,
    error: 'Zu viele Login-Versuche. Bitte warten Sie 15 Minuten.',
    retryAfter: 900
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Zu viele Login-Versuche. Account temporär gesperrt.',
      retryAfter: 900
    });
  }
});

/**
 * Lockeres Rate Limiting für öffentliche Endpunkte
 */
export const publicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 1000, // 1000 Requests pro 15 Minuten für öffentliche APIs
  message: {
    success: false,
    error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
  }
});

/**
 * Sehr strenges Rate Limiting für Webhook-Endpunkte
 */
export const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 Minute
  max: 100, // 100 Webhooks pro Minute
  keyGenerator: (req) => {
    // Rate Limiting basierend auf IP und User-Agent
    return `${req.ip}-${req.get('User-Agent')}`;
  }
});

// ========================
// CORS KONFIGURATION
// ========================

/**
 * CORS-Middleware-Konfiguration
 */
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Erlaubte Origins aus Environment Variables
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map(origin => origin.trim());

    // In Entwicklung alle Origins erlauben
    if (isDevelopment() && !origin) {
      return callback(null, true);
    }

    // Prüfe ob Origin erlaubt ist
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Nicht erlaubt durch CORS-Policy'));
    }
  },
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Client-Version'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count'
  ],
  maxAge: 86400 // 24 Stunden
};

export const corsMiddleware = cors(corsOptions);

// ========================
// SICHERHEITS-HEADERS
// ========================

/**
 * Helmet-Konfiguration für Sicherheits-Headers
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'], // Cloudinary, etc.
      connectSrc: ["'self'", 'https://api.stripe.com'],
      frameSrc: ["'self'", 'https://js.stripe.com']
    }
  },
  crossOriginEmbedderPolicy: false, // Für externe Ressourcen
  hsts: {
    maxAge: 31536000, // 1 Jahr
    includeSubDomains: true,
    preload: true
  }
});

// ========================
// REQUEST LOGGING
// ========================

/**
 * Morgan-Konfiguration für Request-Logging
 */
export const requestLogger = morgan(
  isDevelopment() 
    ? 'dev' // Colored output for development
    : 'combined', // Standard Apache combined log format for production
  {
    skip: (req: Request) => {
      // Health-Check-Endpunkte nicht loggen
      return req.url === '/health' || req.url === '/metrics';
    },
    stream: {
      write: (message: string) => {
        console.log(message.trim());
      }
    }
  }
);

/**
 * Erweiterte Request-Logging-Middleware mit User-Info
 */
export function enhancedLogger(req: AuthRequest, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  // Original end function speichern
  const originalEnd = res.end;
  
  // end function überschreiben um Response-Zeit zu messen
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      userEmail: req.user?.email,
      timestamp: new Date().toISOString()
    };

    // Nur in Development oder bei Fehlern loggen
    if (isDevelopment() || res.statusCode >= 400) {
      console.log('API Request:', JSON.stringify(logData, null, 2));
    }

    // Original end function aufrufen
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

// ========================
// COMPRESSION
// ========================

/**
 * Compression-Middleware-Konfiguration
 */
export const compressionMiddleware = compression({
  level: 6, // Compressions-Level (1-9)
  threshold: 1024, // Nur Responses > 1KB komprimieren
  filter: (req, res) => {
    // Nicht komprimieren wenn no-transform header gesetzt ist
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    
    // Standard compression filter verwenden
    return compression.filter(req, res);
  }
});

// ========================
// ERROR HANDLING
// ========================

/**
 * Globaler Error-Handler
 */
export function globalErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { message, code } = extractErrorInfo(error);
  
  // Error-Details loggen
  console.error('Global Error:', {
    message,
    code,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Verschiedene Error-Typen handhaben
  let statusCode = 500;
  let errorMessage = 'Ein interner Serverfehler ist aufgetreten';

  // Datenbank-Fehler
  if (code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    errorMessage = 'Datensatz bereits vorhanden';
  } else if (code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    errorMessage = 'Ungültige Referenz zu verknüpften Daten';
  } else if (code === '23502') { // PostgreSQL not null violation
    statusCode = 400;
    errorMessage = 'Erforderliche Felder fehlen';
  }

  // JWT-Fehler
  else if (message.includes('jwt')) {
    statusCode = 401;
    errorMessage = 'Ungültiger Authentifizierungstoken';
  }

  // Validierungs-Fehler
  else if (message.includes('validation')) {
    statusCode = 400;
    errorMessage = message;
  }

  // CORS-Fehler
  else if (message.includes('CORS')) {
    statusCode = 403;
    errorMessage = 'CORS-Richtlinie verletzt';
  }

  // In Development vollständige Error-Details senden
  const errorResponse = createErrorResponse(errorMessage, statusCode);
  
  if (isDevelopment()) {
    (errorResponse as any).debug = {
      originalMessage: message,
      code,
      stack: error.stack
    };
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found Handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(createErrorResponse(
    `Endpunkt ${req.method} ${req.url} nicht gefunden`,
    404
  ));
}

/**
 * Async Error Wrapper für Route-Handler
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ========================
// REQUEST VALIDATION
// ========================

/**
 * Middleware zur Validierung von Content-Type
 */
export function validateContentType(expectedType: string = 'application/json') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('Content-Type');
      
      if (!contentType || !contentType.includes(expectedType)) {
        res.status(400).json(createErrorResponse(
          `Content-Type muss ${expectedType} sein`,
          400
        ));
        return;
      }
    }
    
    next();
  };
}

/**
 * Middleware zur Begrenzung der Request-Body-Größe
 */
export function limitRequestSize(maxSize: string = '10mb') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        res.status(413).json(createErrorResponse(
          `Request-Body zu groß. Maximum: ${maxSize}`,
          413
        ));
        return;
      }
    }
    
    next();
  };
}

/**
 * Hilfsfunktion zur Umwandlung von Size-Strings in Bytes
 */
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return value * (units[unit] || 1);
}

// ========================
// HEALTH CHECK MIDDLEWARE
// ========================

/**
 * Middleware für Health-Check-Endpunkte
 */
export function healthCheckMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Health-Check-Requests nicht rate-limitieren
  if (req.url === '/health' || req.url === '/metrics') {
    req.rateLimit = {
      limit: Infinity,
      used: 0,
      remaining: Infinity,
      resetTime: new Date()
    } as any;
  }
  
  next();
}

// ========================
// EXPORT
// ========================

export default {
  // Rate Limiting
  standardRateLimit,
  authRateLimit,
  publicRateLimit,
  webhookRateLimit,
  
  // CORS
  corsMiddleware,
  corsOptions,
  
  // Security
  helmetConfig,
  
  // Logging
  requestLogger,
  enhancedLogger,
  
  // Compression
  compressionMiddleware,
  
  // Error Handling
  globalErrorHandler,
  notFoundHandler,
  asyncHandler,
  
  // Validation
  validateContentType,
  limitRequestSize,
  
  // Health Check
  healthCheckMiddleware
};
