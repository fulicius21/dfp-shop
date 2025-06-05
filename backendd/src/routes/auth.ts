/**
 * Authentifizierungs-Routen für DressForPleasure Backend
 * 
 * Diese Routen behandeln:
 * - Login/Logout
 * - Token-Refresh
 * - Benutzer-Registrierung
 * - Passwort-Reset
 * - Profil-Management
 */

import { Router } from 'express';
import { 
  authenticateToken, 
  requireAdmin,
  authRateLimit 
} from '../middleware/auth';
import { 
  validateBody, 
  loginSchema, 
  refreshTokenSchema 
} from '../middleware/validation';
import authController from '../controllers/auth';
import Joi from 'joi';

const router = Router();

// ========================
// AUTHENTICATION SCHEMAS
// ========================

// Benutzer-Registrierung Schema (nur für Admins)
const registerUserSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Gültige E-Mail-Adresse erforderlich',
      'any.required': 'E-Mail ist erforderlich'
    }),
  password: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Passwort muss mindestens 8 Zeichen lang sein',
      'string.pattern.base': 'Passwort muss mindestens einen Groß- und Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten',
      'any.required': 'Passwort ist erforderlich'
    }),
  firstName: Joi.string().max(100),
  lastName: Joi.string().max(100),
  roleNames: Joi.array().items(Joi.string().valid('admin', 'manager', 'editor')).default(['editor'])
});

// Passwort-Reset-Anfrage Schema
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

// Passwort-Reset Schema
const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Passwort muss mindestens 8 Zeichen lang sein',
      'string.pattern.base': 'Passwort muss mindestens einen Groß- und Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten'
    })
});

// Profil-Update Schema
const updateProfileSchema = Joi.object({
  firstName: Joi.string().max(100),
  lastName: Joi.string().max(100)
});

// Passwort-Ändern Schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required()
    .messages({
      'any.required': 'Aktuelles Passwort ist erforderlich'
    }),
  newPassword: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Neues Passwort muss mindestens 8 Zeichen lang sein',
      'string.pattern.base': 'Neues Passwort muss mindestens einen Groß- und Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten'
    })
});

// ========================
// ÖFFENTLICHE ROUTEN
// ========================

/**
 * @route   POST /api/auth/login
 * @desc    Benutzer anmelden
 * @access  Public
 * @rateLimit 5 requests per 15 minutes
 */
router.post(
  '/login',
  authRateLimit,
  validateBody(loginSchema),
  authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Access Token erneuern
 * @access  Public
 * @rateLimit 5 requests per 15 minutes
 */
router.post(
  '/refresh',
  authRateLimit,
  validateBody(refreshTokenSchema),
  authController.refreshAccessToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Benutzer abmelden
 * @access  Private
 */
router.post(
  '/logout',
  authenticateToken,
  authController.logout
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Passwort-Reset anfordern
 * @access  Public
 * @rateLimit 5 requests per 15 minutes
 */
router.post(
  '/forgot-password',
  authRateLimit,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Passwort zurücksetzen
 * @access  Public
 * @rateLimit 5 requests per 15 minutes
 */
router.post(
  '/reset-password',
  authRateLimit,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

// ========================
// GESCHÜTZTE ROUTEN
// ========================

/**
 * @route   GET /api/auth/profile
 * @desc    Aktuelles Benutzerprofil abrufen
 * @access  Private
 */
router.get(
  '/profile',
  authenticateToken,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Benutzerprofil aktualisieren
 * @access  Private
 */
router.put(
  '/profile',
  authenticateToken,
  validateBody(updateProfileSchema),
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Passwort ändern
 * @access  Private
 */
router.put(
  '/change-password',
  authenticateToken,
  validateBody(changePasswordSchema),
  authController.changePassword
);

// ========================
// ADMIN ROUTEN
// ========================

/**
 * @route   POST /api/auth/register
 * @desc    Neuen Benutzer registrieren (nur Admins)
 * @access  Private (Admin only)
 */
router.post(
  '/register',
  authenticateToken,
  requireAdmin,
  validateBody(registerUserSchema),
  authController.registerUser
);

// ========================
// TOKEN VALIDATION ROUTE
// ========================

/**
 * @route   GET /api/auth/verify
 * @desc    Token validieren (für Frontend)
 * @access  Private
 */
router.get(
  '/verify',
  authenticateToken,
  (req, res) => {
    const user = (req as any).user;
    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles
        }
      },
      message: 'Token ist gültig'
    });
  }
);

// ========================
// BENUTZER-MANAGEMENT (ADMIN)
// ========================

/**
 * @route   GET /api/auth/users
 * @desc    Alle Benutzer abrufen (nur Admins)
 * @access  Private (Admin only)
 */
router.get(
  '/users',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      // TODO: Implementierung des User-Management Controllers
      res.json({
        success: true,
        data: {
          users: [],
          message: 'User-Management wird in einer zukünftigen Version implementiert'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Fehler beim Abrufen der Benutzer'
      });
    }
  }
);

/**
 * @route   PUT /api/auth/users/:id/status
 * @desc    Benutzerstatus ändern (aktivieren/deaktivieren)
 * @access  Private (Admin only)
 */
router.put(
  '/users/:id/status',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      // TODO: Implementierung der Benutzer-Status-Änderung
      res.json({
        success: true,
        data: {
          message: 'User-Status-Management wird in einer zukünftigen Version implementiert'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Fehler beim Ändern des Benutzerstatus'
      });
    }
  }
);

// ========================
// ROLLEN-MANAGEMENT (ADMIN)
// ========================

/**
 * @route   GET /api/auth/roles
 * @desc    Alle verfügbaren Rollen abrufen
 * @access  Private (Admin only)
 */
router.get(
  '/roles',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      // TODO: Implementierung des Role-Management Controllers
      res.json({
        success: true,
        data: {
          roles: [
            { name: 'admin', description: 'Vollzugriff auf das System' },
            { name: 'manager', description: 'Produktmanagement und Bestellverwaltung' },
            { name: 'editor', description: 'Content-Management' }
          ]
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Fehler beim Abrufen der Rollen'
      });
    }
  }
);

// ========================
// ENTWICKLUNGS-ROUTEN (nur in Development)
// ========================

if (process.env.NODE_ENV === 'development') {
  /**
   * @route   POST /api/auth/dev/create-admin
   * @desc    Admin-Benutzer für Entwicklung erstellen
   * @access  Public (nur in Development)
   */
  router.post(
    '/dev/create-admin',
    async (req, res) => {
      try {
        res.json({
          success: true,
          data: {
            message: 'Verwenden Sie das Seed-Skript um Admin-Benutzer zu erstellen: npm run seed'
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Fehler beim Erstellen des Admin-Benutzers'
        });
      }
    }
  );

  /**
   * @route   GET /api/auth/dev/info
   * @desc    Development-Informationen
   * @access  Public (nur in Development)
   */
  router.get(
    '/dev/info',
    (req, res) => {
      res.json({
        success: true,
        data: {
          environment: 'development',
          adminEmail: process.env.ADMIN_EMAIL || 'admin@dressforp.com',
          seedCommand: 'npm run seed',
          note: 'Diese Route ist nur in der Entwicklungsumgebung verfügbar'
        }
      });
    }
  );
}

export default router;
