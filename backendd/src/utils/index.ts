/**
 * Utility-Funktionen für DressForPleasure Backend
 * 
 * Diese Datei enthält wiederverwendbare Hilfsfunktionen für:
 * - Slug-Generierung
 * - Passwort-Hashing
 * - JWT-Token-Handling
 * - Validierung
 * - Error-Handling
 * - DSGVO-Compliance
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiResponse, AuthenticatedUser } from '../types';

// ========================
// KONFIGURATION
// ========================

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-please-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

// ========================
// SLUG-GENERIERUNG
// ========================

/**
 * Generiert einen URL-freundlichen Slug aus einem String
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '') // Entferne alle Sonderzeichen außer Leerzeichen und Bindestriche
    .replace(/\s+/g, '-') // Ersetze Leerzeichen durch Bindestriche
    .replace(/-+/g, '-') // Mehrfache Bindestriche zu einem
    .replace(/^-|-$/g, ''); // Entferne Bindestriche am Anfang und Ende
}

/**
 * Generiert einen eindeutigen Slug mit optionalem Suffix
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// ========================
// PASSWORT-HANDLING
// ========================

/**
 * Hasht ein Passwort mit bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Vergleicht ein Passwort mit einem Hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validiert Passwort-Stärke
 */
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Passwort muss mindestens 8 Zeichen lang sein');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Passwort muss mindestens einen Großbuchstaben enthalten');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Passwort muss mindestens einen Kleinbuchstaben enthalten');
  }

  if (!/\d/.test(password)) {
    errors.push('Passwort muss mindestens eine Zahl enthalten');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Passwort muss mindestens ein Sonderzeichen enthalten');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ========================
// JWT-TOKEN-HANDLING
// ========================

/**
 * Generiert einen JWT Access Token
 */
export function generateAccessToken(user: AuthenticatedUser): string {
  const payload = {
    id: user.id,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions
  };

  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'dressforp-api',
    audience: 'dressforp-client'
  });
}

/**
 * Generiert einen JWT Refresh Token
 */
export function generateRefreshToken(userId: number): string {
  return jwt.sign(
    { userId }, 
    JWT_REFRESH_SECRET, 
    { 
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'dressforp-api',
      audience: 'dressforp-client'
    }
  );
}

/**
 * Verifiziert einen JWT Access Token
 */
export function verifyAccessToken(token: string): AuthenticatedUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'dressforp-api',
      audience: 'dressforp-client'
    }) as any;

    return {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles || [],
      permissions: decoded.permissions || []
    };
  } catch (error) {
    return null;
  }
}

/**
 * Verifiziert einen JWT Refresh Token
 */
export function verifyRefreshToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'dressforp-api',
      audience: 'dressforp-client'
    }) as any;

    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
}

// ========================
// VALIDIERUNG
// ========================

/**
 * Validiert eine E-Mail-Adresse
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validiert eine Telefonnummer (internationale Formate)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validiert einen deutschen Postleitzahl
 */
export function isValidGermanPostalCode(postalCode: string): boolean {
  const germanPostalCodeRegex = /^\d{5}$/;
  return germanPostalCodeRegex.test(postalCode);
}

/**
 * Validiert eine SKU (Stock Keeping Unit)
 */
export function isValidSKU(sku: string): boolean {
  const skuRegex = /^[A-Z0-9\-]{3,20}$/;
  return skuRegex.test(sku);
}

/**
 * Validiert einen Preis (positive Dezimalzahl)
 */
export function isValidPrice(price: number | string): boolean {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice >= 0;
}

// ========================
// ERROR-HANDLING
// ========================

/**
 * Erstellt eine standardisierte Error-Response
 */
export function createErrorResponse(message: string, statusCode: number = 400): ApiResponse {
  return {
    success: false,
    error: message
  };
}

/**
 * Erstellt eine standardisierte Success-Response
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

/**
 * Extrahiert relevante Error-Informationen
 */
export function extractErrorInfo(error: unknown): { message: string; code?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as any).code
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return { message: 'Ein unbekannter Fehler ist aufgetreten' };
}

// ========================
// PAGINATION
// ========================

/**
 * Berechnet Pagination-Metadaten
 */
export function calculatePagination(page: number = 1, limit: number = 20, total: number) {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    offset: (page - 1) * limit
  };
}

// ========================
// STRING-UTILITIES
// ========================

/**
 * Kapitalisiert den ersten Buchstaben eines Strings
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Generiert eine zufällige Zeichenkette
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generiert eine eindeutige Bestellnummer
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `DF${year}${month}${day}${random}`;
}

/**
 * Generiert einen sicheren Reset-Token
 */
export function generateResetToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

// ========================
// DSGVO-UTILITIES
// ========================

/**
 * Anonymisiert eine E-Mail-Adresse für DSGVO-Compliance
 */
export function anonymizeEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }
  return `${username.slice(0, 2)}***@${domain}`;
}

/**
 * Anonymisiert eine Telefonnummer
 */
export function anonymizePhone(phone: string): string {
  if (phone.length <= 4) {
    return '***';
  }
  return `${phone.slice(0, 3)}***${phone.slice(-2)}`;
}

/**
 * Berechnet DSGVO-Datenaufbewahrungszeit
 */
export function calculateDataRetentionDate(purpose: 'contract' | 'marketing' | 'legal'): Date {
  const now = new Date();
  
  switch (purpose) {
    case 'contract':
      // 10 Jahre für Vertragsdaten
      return new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
    case 'marketing':
      // 3 Jahre für Marketing-Daten
      return new Date(now.getFullYear() + 3, now.getMonth(), now.getDate());
    case 'legal':
      // 6 Jahre für rechtlich erforderliche Daten
      return new Date(now.getFullYear() + 6, now.getMonth(), now.getDate());
    default:
      // Standard: 7 Jahre
      return new Date(now.getFullYear() + 7, now.getMonth(), now.getDate());
  }
}

/**
 * Prüft ob Daten zur Löschung anstehen
 */
export function isDataDueForDeletion(retentionDate: Date): boolean {
  return new Date() >= retentionDate;
}

// ========================
// FORMATIERUNG
// ========================

/**
 * Formatiert einen Preis für die Anzeige
 */
export function formatPrice(price: number | string, currency: string = 'EUR'): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency
  }).format(numPrice);
}

/**
 * Formatiert ein Datum für die deutsche Anzeige
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }).format(date);
}

/**
 * Formatiert ein Datum und Zeit für die deutsche Anzeige
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// ========================
// ENVIRONMENT & CONFIG
// ========================

/**
 * Prüft ob die Anwendung in der Produktionsumgebung läuft
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Prüft ob die Anwendung in der Entwicklungsumgebung läuft
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Gibt die aktuelle Anwendungsversion zurück
 */
export function getAppVersion(): string {
  return process.env.npm_package_version || '1.0.0';
}

// ========================
// ASYNC UTILITIES
// ========================

/**
 * Sleep-Funktion für Delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry-Funktion für fehlerhafte Operationen
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      await sleep(delay * (i + 1)); // Exponential backoff
    }
  }

  throw lastError!;
}

// ========================
// EXPORT
// ========================

export default {
  // Slug
  generateSlug,
  generateUniqueSlug,
  
  // Password
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  
  // JWT
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  
  // Validation
  isValidEmail,
  isValidPhone,
  isValidGermanPostalCode,
  isValidSKU,
  isValidPrice,
  
  // Error handling
  createErrorResponse,
  createSuccessResponse,
  extractErrorInfo,
  
  // Pagination
  calculatePagination,
  
  // String utilities
  capitalize,
  generateRandomString,
  generateOrderNumber,
  generateResetToken,
  
  // DSGVO
  anonymizeEmail,
  anonymizePhone,
  calculateDataRetentionDate,
  isDataDueForDeletion,
  
  // Formatting
  formatPrice,
  formatDate,
  formatDateTime,
  
  // Environment
  isProduction,
  isDevelopment,
  getAppVersion,
  
  // Async
  sleep,
  retry
};
