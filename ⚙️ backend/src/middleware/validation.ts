/**
 * Validierungs-Middleware für DressForPleasure Backend
 * 
 * Diese Middleware-Funktionen handhaben:
 * - Request-Validierung mit Joi
 * - Sanitization von Eingabedaten
 * - File-Upload-Validierung
 * - Parameter-Validierung
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createErrorResponse } from '../utils';
import { AuthRequest } from '../types';

// ========================
// HELPER FUNKTIONEN
// ========================

/**
 * Validiert Request-Body gegen ein Joi-Schema
 */
export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Alle Fehler sammeln
      stripUnknown: true, // Unbekannte Felder entfernen
      convert: true // Typkonvertierung durchführen
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      res.status(400).json(createErrorResponse(`Validierungsfehler: ${errorMessage}`, 400));
      return;
    }

    req.body = value; // Validierte und bereinigte Daten verwenden
    next();
  };
}

/**
 * Validiert Query-Parameter gegen ein Joi-Schema
 */
export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      res.status(400).json(createErrorResponse(`Query-Parameter-Fehler: ${errorMessage}`, 400));
      return;
    }

    req.query = value;
    next();
  };
}

/**
 * Validiert URL-Parameter gegen ein Joi-Schema
 */
export function validateParams(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      res.status(400).json(createErrorResponse(`Parameter-Fehler: ${errorMessage}`, 400));
      return;
    }

    req.params = value;
    next();
  };
}

// ========================
// GEMEINSAME SCHEMAS
// ========================

// ID-Parameter Schema
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID muss eine Zahl sein',
      'number.integer': 'ID muss eine ganze Zahl sein',
      'number.positive': 'ID muss positiv sein',
      'any.required': 'ID ist erforderlich'
    })
});

// Pagination Schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Search Schema
export const searchSchema = paginationSchema.keys({
  q: Joi.string().max(255).allow(''),
  category: Joi.string().max(100),
  collection: Joi.string().max(100),
  featured: Joi.boolean(),
  status: Joi.string().valid('draft', 'active', 'archived'),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0)
});

// ========================
// AUTHENTIFIZIERUNG SCHEMAS
// ========================

export const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Gültige E-Mail-Adresse erforderlich',
      'any.required': 'E-Mail ist erforderlich'
    }),
  password: Joi.string().min(6).required()
    .messages({
      'string.min': 'Passwort muss mindestens 6 Zeichen lang sein',
      'any.required': 'Passwort ist erforderlich'
    })
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
    .messages({
      'any.required': 'Refresh-Token ist erforderlich'
    })
});

// ========================
// PRODUKT SCHEMAS
// ========================

export const createProductSchema = Joi.object({
  name: Joi.string().min(1).max(255).required()
    .messages({
      'string.min': 'Produktname ist erforderlich',
      'string.max': 'Produktname darf maximal 255 Zeichen lang sein',
      'any.required': 'Produktname ist erforderlich'
    }),
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).max(255)
    .messages({
      'string.pattern.base': 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten'
    }),
  description: Joi.string().max(5000),
  shortDescription: Joi.string().max(500),
  basePrice: Joi.number().positive().precision(2).required()
    .messages({
      'number.positive': 'Preis muss positiv sein',
      'any.required': 'Preis ist erforderlich'
    }),
  originalPrice: Joi.number().positive().precision(2),
  discount: Joi.number().integer().min(0).max(100).default(0),
  sku: Joi.string().pattern(/^[A-Z0-9-]+$/).max(100)
    .messages({
      'string.pattern.base': 'SKU darf nur Großbuchstaben, Zahlen und Bindestriche enthalten'
    }),
  material: Joi.string().max(500),
  careInstructions: Joi.string().max(1000),
  sustainabilityInfo: Joi.string().max(1000),
  tags: Joi.array().items(Joi.string().max(50)),
  sizes: Joi.array().items(Joi.string().max(10)),
  colors: Joi.array().items(Joi.object({
    name: Joi.string().max(50).required(),
    value: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required()
      .messages({
        'string.pattern.base': 'Farbwert muss ein gültiger Hex-Code sein (#000000)'
      }),
    code: Joi.string().max(20).required()
  })),
  status: Joi.string().valid('draft', 'active', 'archived').default('draft'),
  featured: Joi.boolean().default(false),
  newArrival: Joi.boolean().default(false),
  bestseller: Joi.boolean().default(false),
  weight: Joi.number().positive(),
  dimensions: Joi.object({
    length: Joi.number().positive().required(),
    width: Joi.number().positive().required(),
    height: Joi.number().positive().required()
  }),
  seoTitle: Joi.string().max(255),
  seoDescription: Joi.string().max(500),
  categoryIds: Joi.array().items(Joi.number().integer().positive()),
  collectionIds: Joi.array().items(Joi.number().integer().positive())
});

export const updateProductSchema = createProductSchema.fork(
  ['name', 'basePrice'], 
  schema => schema.optional()
);

export const productVariantSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  sku: Joi.string().pattern(/^[A-Z0-9-]+$/).max(100).required(),
  size: Joi.string().max(10),
  color: Joi.string().max(50),
  colorCode: Joi.string().max(20),
  price: Joi.number().positive().precision(2).required(),
  stock: Joi.number().integer().min(0).required(),
  lowStockThreshold: Joi.number().integer().min(0).default(5),
  weight: Joi.number().positive(),
  isActive: Joi.boolean().default(true)
});

// ========================
// KATEGORIE & KOLLEKTION SCHEMAS
// ========================

export const categorySchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).max(255),
  description: Joi.string().max(1000),
  image: Joi.string().uri().max(500),
  parentId: Joi.number().integer().positive(),
  sortOrder: Joi.number().integer().default(0),
  isActive: Joi.boolean().default(true),
  seoTitle: Joi.string().max(255),
  seoDescription: Joi.string().max(500)
});

export const collectionSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).max(255),
  description: Joi.string().max(1000),
  longDescription: Joi.string().max(5000),
  image: Joi.string().uri().max(500),
  featured: Joi.boolean().default(false),
  season: Joi.string().max(100),
  tags: Joi.array().items(Joi.string().max(50)),
  sortOrder: Joi.number().integer().default(0),
  isActive: Joi.boolean().default(true),
  seoTitle: Joi.string().max(255),
  seoDescription: Joi.string().max(500)
});

// ========================
// KUNDEN SCHEMAS
// ========================

export const customerSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().max(100),
  lastName: Joi.string().max(100),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,}$/)
    .messages({
      'string.pattern.base': 'Ungültiges Telefonnummer-Format'
    }),
  dateOfBirth: Joi.date().max('now'),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
  newsletterConsent: Joi.boolean().default(false),
  marketingConsent: Joi.boolean().default(false)
});

export const customerAddressSchema = Joi.object({
  customerId: Joi.number().integer().positive().required(),
  type: Joi.string().valid('billing', 'shipping').required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
  company: Joi.string().max(255),
  streetAddress: Joi.string().max(255).required(),
  streetAddress2: Joi.string().max(255),
  city: Joi.string().max(100).required(),
  state: Joi.string().max(100),
  postalCode: Joi.string().max(20).required(),
  country: Joi.string().length(2).uppercase().required()
    .messages({
      'string.length': 'Ländercode muss 2 Zeichen lang sein (ISO-Code)'
    }),
  isDefault: Joi.boolean().default(false)
});

// ========================
// BESTELLUNG SCHEMAS
// ========================

export const createOrderSchema = Joi.object({
  customerEmail: Joi.string().email().required(),
  customerId: Joi.number().integer().positive(),
  items: Joi.array().items(Joi.object({
    productId: Joi.number().integer().positive().required(),
    variantId: Joi.number().integer().positive(),
    quantity: Joi.number().integer().min(1).required()
  })).min(1).required(),
  billingAddress: Joi.object({
    firstName: Joi.string().max(100).required(),
    lastName: Joi.string().max(100).required(),
    company: Joi.string().max(255),
    streetAddress: Joi.string().max(255).required(),
    streetAddress2: Joi.string().max(255),
    city: Joi.string().max(100).required(),
    state: Joi.string().max(100),
    postalCode: Joi.string().max(20).required(),
    country: Joi.string().length(2).uppercase().required()
  }).required(),
  shippingAddress: Joi.object({
    firstName: Joi.string().max(100).required(),
    lastName: Joi.string().max(100).required(),
    company: Joi.string().max(255),
    streetAddress: Joi.string().max(255).required(),
    streetAddress2: Joi.string().max(255),
    city: Joi.string().max(100).required(),
    state: Joi.string().max(100),
    postalCode: Joi.string().max(20).required(),
    country: Joi.string().length(2).uppercase().required()
  }).required(),
  notes: Joi.string().max(1000),
  paymentMethod: Joi.string().max(50),
  discountCode: Joi.string().max(50)
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid(
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  ),
  paymentStatus: Joi.string().valid(
    'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
  ),
  fulfillmentStatus: Joi.string().valid(
    'unfulfilled', 'partial', 'fulfilled'
  ),
  notes: Joi.string().max(1000)
});

// ========================
// MEDIEN SCHEMAS
// ========================

export const mediaSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  type: Joi.string().valid('image', 'video').required(),
  url: Joi.string().uri().required(),
  altText: Joi.string().max(255),
  title: Joi.string().max(255),
  sortOrder: Joi.number().integer().default(0),
  isPrimary: Joi.boolean().default(false)
});

// ========================
// FILE UPLOAD VALIDIERUNG
// ========================

/**
 * Middleware für File-Upload-Validierung
 */
export function validateFileUpload(options: {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], required = false } = options;

    if (!req.file && required) {
      res.status(400).json(createErrorResponse('Datei ist erforderlich', 400));
      return;
    }

    if (!req.file && !required) {
      next();
      return;
    }

    const file = req.file!;

    // Dateigröße prüfen
    if (file.size > maxSize) {
      res.status(400).json(createErrorResponse(
        `Datei zu groß. Maximum: ${Math.round(maxSize / 1024 / 1024)}MB`, 
        400
      ));
      return;
    }

    // MIME-Type prüfen
    if (!allowedTypes.includes(file.mimetype)) {
      res.status(400).json(createErrorResponse(
        `Ungültiger Dateityp. Erlaubt: ${allowedTypes.join(', ')}`, 
        400
      ));
      return;
    }

    next();
  };
}

// ========================
// SANITIZATION
// ========================

/**
 * Middleware für HTML-Sanitization in Text-Feldern
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  // Rekursive Funktion zur Bereinigung von Objekten
  function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      // Einfache HTML-Tags entfernen
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  }

  // Body, Query und Params bereinigen
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
}

// ========================
// MIDDLEWARE KOMBINATIONEN
// ========================

// Standard-Validierung für ID-Parameter
export const validateId = validateParams(idParamSchema);

// Standard-Validierung für Pagination
export const validatePagination = validateQuery(paginationSchema);

// Standard-Validierung für Suche
export const validateSearch = validateQuery(searchSchema);

// ========================
// SPEZIFISCHE VALIDIERUNGSMIDDLEWARE
// ========================

// Bestellungen
export const validateOrderRequest = validateBody(createOrderSchema);
export const validateOrderStatusUpdate = validateBody(updateOrderStatusSchema);

// Kunden
export const validateCustomerRegistration = validateBody(customerSchema);
export const validateCustomerUpdate = validateBody(customerSchema.fork(['email', 'password'], (schema) => 
  schema.optional()
));
export const validateCustomerAddress = validateBody(customerAddressSchema);

// Produkte
export const validateProductRequest = validateBody(createProductSchema);
export const validateProductUpdate = validateBody(updateProductSchema);
export const validateProductVariant = validateBody(productVariantSchema);

// Kategorien und Kollektionen
export const validateCategoryRequest = validateBody(categorySchema);
export const validateCollectionRequest = validateBody(collectionSchema);

// Medien
export const validateMediaRequest = validateBody(mediaSchema);

// Auth
export const validateLoginRequest = validateBody(loginSchema);
export const validateRefreshTokenRequest = validateBody(refreshTokenSchema);

// ========================
// EXPORT
// ========================

export default {
  validateBody,
  validateQuery,
  validateParams,
  validateFileUpload,
  sanitizeInput,
  validateId,
  validatePagination,
  validateSearch,
  
  // Schemas
  idParamSchema,
  paginationSchema,
  searchSchema,
  loginSchema,
  refreshTokenSchema,
  createProductSchema,
  updateProductSchema,
  productVariantSchema,
  categorySchema,
  collectionSchema,
  customerSchema,
  customerAddressSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  mediaSchema
};
