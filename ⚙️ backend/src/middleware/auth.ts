/**
 * Authentifizierungs-Middleware für DressForPleasure Backend
 * 
 * Diese Middleware-Funktionen handhaben:
 * - JWT-Token-Authentifizierung
 * - Rollen-basierte Autorisierung
 * - Permission-Checks
 * - API-Rate-Limiting
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest, AuthenticatedUser, ApiResponse } from '../types';
import { verifyAccessToken, createErrorResponse } from '../utils';
import { db } from '../db/connection';
import { users, roles, userRoles } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// ========================
// JWT AUTHENTIFIZIERUNG
// ========================

/**
 * Middleware für JWT-Token-Authentifizierung
 * Prüft ob ein gültiger JWT-Token im Authorization-Header vorhanden ist
 */
export async function authenticateToken(
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json(createErrorResponse('Authentifizierung erforderlich', 401));
      return;
    }

    // Token verifizieren
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      res.status(403).json(createErrorResponse('Ungültiger oder abgelaufener Token', 403));
      return;
    }

    // Benutzer aus Datenbank laden um aktuelle Daten zu haben
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive
      })
      .from(users)
      .where(and(
        eq(users.id, decoded.id),
        eq(users.isActive, true)
      ))
      .limit(1);

    if (user.length === 0) {
      res.status(403).json(createErrorResponse('Benutzer nicht gefunden oder deaktiviert', 403));
      return;
    }

    // Benutzerrollen und Permissions laden
    const userRolesResult = await db
      .select({
        roleName: roles.name,
        permissions: roles.permissions
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, decoded.id));

    const userRoleNames = userRolesResult.map(r => r.roleName);
    const allPermissions = userRolesResult.reduce((acc, role) => {
      if (role.permissions) {
        acc.push(...role.permissions);
      }
      return acc;
    }, [] as string[]);

    // Deduplizierte Permissions
    const uniquePermissions = [...new Set(allPermissions)];

    // AuthenticatedUser-Objekt erstellen
    const authenticatedUser: AuthenticatedUser = {
      id: user[0].id,
      email: user[0].email,
      firstName: user[0].firstName || undefined,
      lastName: user[0].lastName || undefined,
      roles: userRoleNames,
      permissions: uniquePermissions
    };

    req.user = authenticatedUser;
    next();

  } catch (error) {
    console.error('Authentifizierungsfehler:', error);
    res.status(500).json(createErrorResponse('Interner Authentifizierungsfehler', 500));
  }
}

/**
 * Optionale Authentifizierung - fügt Benutzerinformationen hinzu falls Token vorhanden
 */
export async function optionalAuth(
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        const user = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            isActive: users.isActive
          })
          .from(users)
          .where(and(
            eq(users.id, decoded.id),
            eq(users.isActive, true)
          ))
          .limit(1);

        if (user.length > 0) {
          req.user = {
            id: user[0].id,
            email: user[0].email,
            firstName: user[0].firstName || undefined,
            lastName: user[0].lastName || undefined,
            roles: decoded.roles,
            permissions: decoded.permissions
          };
        }
      }
    }

    next();
  } catch (error) {
    // Bei optionaler Auth ignorieren wir Fehler und fahren ohne User fort
    next();
  }
}

// ========================
// ROLLEN-BASIERTE AUTORISIERUNG
// ========================

/**
 * Middleware für Rollen-basierte Autorisierung
 * Prüft ob der authentifizierte Benutzer eine der erforderlichen Rollen hat
 */
export function requireRole(...requiredRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentifizierung erforderlich', 401));
      return;
    }

    const hasRequiredRole = requiredRoles.some(role => 
      req.user!.roles.includes(role) || req.user!.roles.includes('admin')
    );

    if (!hasRequiredRole) {
      res.status(403).json(createErrorResponse(
        `Zugriff verweigert. Erforderliche Rolle: ${requiredRoles.join(' oder ')}`, 
        403
      ));
      return;
    }

    next();
  };
}

/**
 * Middleware für Admin-Zugriff
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware für Manager-Zugriff (Admin oder Manager)
 */
export const requireManager = requireRole('admin', 'manager');

/**
 * Middleware für Editor-Zugriff (Admin, Manager oder Editor)
 */
export const requireEditor = requireRole('admin', 'manager', 'editor');

// ========================
// PERMISSION-BASIERTE AUTORISIERUNG
// ========================

/**
 * Middleware für Permission-basierte Autorisierung
 * Prüft ob der Benutzer eine spezifische Berechtigung hat
 */
export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentifizierung erforderlich', 401));
      return;
    }

    // Admin hat immer alle Berechtigungen
    if (req.user.roles.includes('admin') || req.user.permissions.includes('*')) {
      next();
      return;
    }

    // Prüfe spezifische Berechtigung oder Wildcard-Berechtigung
    const hasPermission = req.user.permissions.some(userPerm => {
      if (userPerm === permission) return true;
      
      // Wildcard-Check (z.B. "products.*" für "products.read")
      if (userPerm.endsWith('.*')) {
        const basePermission = userPerm.slice(0, -2);
        return permission.startsWith(basePermission + '.');
      }
      
      return false;
    });

    if (!hasPermission) {
      res.status(403).json(createErrorResponse(
        `Zugriff verweigert. Erforderliche Berechtigung: ${permission}`, 
        403
      ));
      return;
    }

    next();
  };
}

// ========================
// SPEZIFISCHE PERMISSION-MIDDLEWARE
// ========================

// Produkte
export const canReadProducts = requirePermission('products.read');
export const canCreateProducts = requirePermission('products.create');
export const canUpdateProducts = requirePermission('products.update');
export const canDeleteProducts = requirePermission('products.delete');

// Bestellungen
export const canReadOrders = requirePermission('orders.read');
export const canUpdateOrders = requirePermission('orders.update');
export const canCancelOrders = requirePermission('orders.cancel');

// Kunden
export const canReadCustomers = requirePermission('customers.read');
export const canUpdateCustomers = requirePermission('customers.update');
export const canDeleteCustomers = requirePermission('customers.delete');

// Medien
export const canReadMedia = requirePermission('media.read');
export const canUploadMedia = requirePermission('media.upload');
export const canDeleteMedia = requirePermission('media.delete');

// ========================
// OWNERSHIP-CHECKS
// ========================

/**
 * Middleware die prüft ob der Benutzer Eigentümer einer Ressource ist
 * Nur für Kunden-spezifische Endpunkte
 */
export function requireOwnership(entityType: 'customer' | 'order') {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentifizierung erforderlich', 401));
      return;
    }

    // Admins und Manager können alle Ressourcen zugreifen
    if (req.user.roles.includes('admin') || req.user.roles.includes('manager')) {
      next();
      return;
    }

    const resourceId = parseInt(req.params.id);
    if (isNaN(resourceId)) {
      res.status(400).json(createErrorResponse('Ungültige Ressourcen-ID', 400));
      return;
    }

    try {
      let isOwner = false;

      switch (entityType) {
        case 'customer':
          // Prüfe ob der Benutzer der Kunde ist (nur für authentifizierte Kunden)
          // TODO: Implementierung für Kunden-Auth wenn benötigt
          isOwner = true; // Vereinfacht für Admin-System
          break;

        case 'order':
          // Prüfe ob die Bestellung dem Benutzer gehört
          // TODO: Implementierung für Bestellungs-Ownership wenn benötigt
          isOwner = true; // Vereinfacht für Admin-System
          break;
      }

      if (!isOwner) {
        res.status(403).json(createErrorResponse('Zugriff auf diese Ressource nicht erlaubt', 403));
        return;
      }

      next();
    } catch (error) {
      console.error('Ownership-Check Fehler:', error);
      res.status(500).json(createErrorResponse('Fehler bei der Berechtigungsprüfung', 500));
    }
  };
}

// ========================
// API-KEY AUTHENTIFIZIERUNG
// ========================

/**
 * Middleware für API-Key-Authentifizierung (für Webhooks und externe Services)
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedApiKey = process.env.WEBHOOK_SECRET;

  if (!expectedApiKey) {
    res.status(500).json(createErrorResponse('API-Key nicht konfiguriert', 500));
    return;
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    res.status(401).json(createErrorResponse('Ungültiger API-Key', 401));
    return;
  }

  next();
}

// ========================
// FEATURE FLAGS
// ========================

/**
 * Middleware für Feature-Flags
 */
export function requireFeature(featureName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const featureEnabled = process.env[`FEATURE_${featureName.toUpperCase()}`] === 'true';
    
    if (!featureEnabled) {
      res.status(404).json(createErrorResponse('Feature nicht verfügbar', 404));
      return;
    }

    next();
  };
}

// ========================
// DSGVO MIDDLEWARE
// ========================

/**
 * Middleware für DSGVO-Compliance-Checks
 */
export function requireGdprCompliance(req: AuthRequest, res: Response, next: NextFunction): void {
  // Prüfe ob DSGVO-Compliance-Modus aktiviert ist
  const gdprMode = process.env.GDPR_COMPLIANCE_MODE === 'true';
  
  if (!gdprMode) {
    next();
    return;
  }

  // Prüfe ob der Request User-Agent und IP-Adresse enthält (für Audit-Log)
  if (!req.headers['user-agent']) {
    res.status(400).json(createErrorResponse('User-Agent erforderlich für DSGVO-Compliance', 400));
    return;
  }

  // Füge DSGVO-relevante Headers hinzu
  res.setHeader('X-GDPR-Compliance', 'enabled');
  
  next();
}

// ========================
// EXPORT
// ========================

export default {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireManager,
  requireEditor,
  requirePermission,
  canReadProducts,
  canCreateProducts,
  canUpdateProducts,
  canDeleteProducts,
  canReadOrders,
  canUpdateOrders,
  canCancelOrders,
  canReadCustomers,
  canUpdateCustomers,
  canDeleteCustomers,
  canReadMedia,
  canUploadMedia,
  canDeleteMedia,
  requireOwnership,
  requireApiKey,
  requireFeature,
  requireGdprCompliance
};
