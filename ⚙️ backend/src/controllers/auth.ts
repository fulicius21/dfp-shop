/**
 * Authentifizierungs-Controller für DressForPleasure Backend
 * 
 * Dieser Controller behandelt:
 * - Benutzer-Login/Logout
 * - Token-Refresh
 * - Passwort-Reset
 * - Benutzer-Registrierung (Admin)
 */

import { Request, Response } from 'express';
import { db } from '../db/connection';
import { users, roles, userRoles } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { 
  comparePassword, 
  hashPassword, 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  createSuccessResponse, 
  createErrorResponse,
  generateRandomString
} from '../utils';
import { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenRequest, 
  AuthenticatedUser 
} from '../types';

// ========================
// LOGIN
// ========================

/**
 * Benutzer-Login
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password }: LoginRequest = req.body;

    // Benutzer suchen
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (userResult.length === 0) {
      res.status(401).json(createErrorResponse('Ungültige Anmeldedaten', 401));
      return;
    }

    const user = userResult[0];

    // Prüfen ob Benutzer aktiv ist
    if (!user.isActive) {
      res.status(401).json(createErrorResponse('Benutzerkonto ist deaktiviert', 401));
      return;
    }

    // Passwort prüfen
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json(createErrorResponse('Ungültige Anmeldedaten', 401));
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
      .where(eq(userRoles.userId, user.id));

    const roleNames = userRolesResult.map(r => r.roleName);
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
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      roles: roleNames,
      permissions: uniquePermissions
    };

    // Tokens generieren
    const accessToken = generateAccessToken(authenticatedUser);
    const refreshToken = generateRefreshToken(user.id);

    // Letzten Login aktualisieren
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Response
    const response: LoginResponse = {
      success: true,
      user: {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        firstName: authenticatedUser.firstName,
        lastName: authenticatedUser.lastName,
        roles: authenticatedUser.roles
      },
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60 // 7 Tage in Sekunden
    };

    res.json(createSuccessResponse(response, 'Erfolgreich angemeldet'));

  } catch (error) {
    console.error('Login-Fehler:', error);
    res.status(500).json(createErrorResponse('Anmeldefehler', 500));
  }
}

// ========================
// TOKEN REFRESH
// ========================

/**
 * Access-Token mittels Refresh-Token erneuern
 * POST /api/auth/refresh
 */
export async function refreshAccessToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken }: RefreshTokenRequest = req.body;

    // Refresh-Token verifizieren
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      res.status(401).json(createErrorResponse('Ungültiger Refresh-Token', 401));
      return;
    }

    // Benutzer laden
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive
      })
      .from(users)
      .where(and(
        eq(users.id, decoded.userId),
        eq(users.isActive, true)
      ))
      .limit(1);

    if (userResult.length === 0) {
      res.status(401).json(createErrorResponse('Benutzer nicht gefunden oder deaktiviert', 401));
      return;
    }

    const user = userResult[0];

    // Benutzerrollen und Permissions laden
    const userRolesResult = await db
      .select({
        roleName: roles.name,
        permissions: roles.permissions
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id));

    const roleNames = userRolesResult.map(r => r.roleName);
    const allPermissions = userRolesResult.reduce((acc, role) => {
      if (role.permissions) {
        acc.push(...role.permissions);
      }
      return acc;
    }, [] as string[]);

    const uniquePermissions = [...new Set(allPermissions)];

    // AuthenticatedUser-Objekt erstellen
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      roles: roleNames,
      permissions: uniquePermissions
    };

    // Neue Tokens generieren
    const newAccessToken = generateAccessToken(authenticatedUser);
    const newRefreshToken = generateRefreshToken(user.id);

    const response = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 7 * 24 * 60 * 60
    };

    res.json(createSuccessResponse(response, 'Token erfolgreich erneuert'));

  } catch (error) {
    console.error('Token-Refresh-Fehler:', error);
    res.status(500).json(createErrorResponse('Token-Refresh-Fehler', 500));
  }
}

// ========================
// LOGOUT
// ========================

/**
 * Benutzer-Logout
 * POST /api/auth/logout
 * 
 * Note: Da wir stateless JWTs verwenden, ist Logout clientseitig.
 * Dieser Endpunkt dient hauptsächlich für Logging-Zwecke.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    // TODO: Implementierung einer Token-Blacklist falls gewünscht
    
    res.json(createSuccessResponse(
      { message: 'Erfolgreich abgemeldet' },
      'Logout erfolgreich'
    ));

  } catch (error) {
    console.error('Logout-Fehler:', error);
    res.status(500).json(createErrorResponse('Logout-Fehler', 500));
  }
}

// ========================
// BENUTZER REGISTRIERUNG (ADMIN)
// ========================

/**
 * Neuen Admin-Benutzer erstellen
 * POST /api/auth/register
 * Nur für Admins zugänglich
 */
export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      roleNames = ['editor']
    } = req.body;

    // Prüfen ob E-Mail bereits existiert
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      res.status(409).json(createErrorResponse('E-Mail-Adresse bereits registriert', 409));
      return;
    }

    // Passwort hashen
    const passwordHash = await hashPassword(password);

    // Benutzer erstellen
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        isActive: true,
        emailVerifiedAt: new Date()
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      });

    // Rollen zuweisen
    for (const roleName of roleNames) {
      const roleResult = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, roleName))
        .limit(1);

      if (roleResult.length > 0) {
        await db.insert(userRoles).values({
          userId: newUser.id,
          roleId: roleResult[0].id
        });
      }
    }

    res.status(201).json(createSuccessResponse(
      {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        roles: roleNames
      },
      'Benutzer erfolgreich erstellt'
    ));

  } catch (error) {
    console.error('Registrierungsfehler:', error);
    res.status(500).json(createErrorResponse('Registrierungsfehler', 500));
  }
}

// ========================
// PASSWORT RESET
// ========================

/**
 * Passwort-Reset anfordern
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    // Benutzer suchen
    const userResult = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Aus Sicherheitsgründen immer success zurückgeben
    // (verhindert E-Mail-Enumeration)
    if (userResult.length === 0) {
      res.json(createSuccessResponse(
        { message: 'Falls die E-Mail-Adresse existiert, wurde eine Reset-E-Mail gesendet' },
        'Reset-Anfrage verarbeitet'
      ));
      return;
    }

    const user = userResult[0];

    // Reset-Token generieren
    const resetToken = generateRandomString(32);
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 Stunde gültig

    // Reset-Token speichern
    await db
      .update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpiresAt: resetExpires
      })
      .where(eq(users.id, user.id));

    // TODO: E-Mail mit Reset-Link senden
    // await sendPasswordResetEmail(user.email, resetToken);

    res.json(createSuccessResponse(
      { message: 'Falls die E-Mail-Adresse existiert, wurde eine Reset-E-Mail gesendet' },
      'Reset-Anfrage verarbeitet'
    ));

  } catch (error) {
    console.error('Passwort-Reset-Fehler:', error);
    res.status(500).json(createErrorResponse('Passwort-Reset-Fehler', 500));
  }
}

/**
 * Passwort zurücksetzen
 * POST /api/auth/reset-password
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body;

    // Benutzer mit gültigem Reset-Token suchen
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        passwordResetExpiresAt: users.passwordResetExpiresAt
      })
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);

    if (userResult.length === 0) {
      res.status(400).json(createErrorResponse('Ungültiger oder abgelaufener Reset-Token', 400));
      return;
    }

    const user = userResult[0];

    // Prüfen ob Token noch gültig ist
    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      res.status(400).json(createErrorResponse('Reset-Token ist abgelaufen', 400));
      return;
    }

    // Neues Passwort hashen
    const newPasswordHash = await hashPassword(newPassword);

    // Passwort aktualisieren und Reset-Token löschen
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null
      })
      .where(eq(users.id, user.id));

    res.json(createSuccessResponse(
      { message: 'Passwort erfolgreich zurückgesetzt' },
      'Passwort aktualisiert'
    ));

  } catch (error) {
    console.error('Passwort-Reset-Fehler:', error);
    res.status(500).json(createErrorResponse('Passwort-Reset-Fehler', 500));
  }
}

// ========================
// BENUTZER-PROFIL
// ========================

/**
 * Aktuelles Benutzerprofil abrufen
 * GET /api/auth/profile
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as any).user as AuthenticatedUser;

    // Vollständige Benutzerinformationen laden
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        lastLoginAt: users.lastLoginAt,
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userResult.length === 0) {
      res.status(404).json(createErrorResponse('Benutzer nicht gefunden', 404));
      return;
    }

    const userProfile = {
      ...userResult[0],
      roles: user.roles,
      permissions: user.permissions
    };

    res.json(createSuccessResponse(userProfile, 'Profil geladen'));

  } catch (error) {
    console.error('Profil-Laden-Fehler:', error);
    res.status(500).json(createErrorResponse('Profil-Laden-Fehler', 500));
  }
}

/**
 * Benutzerprofil aktualisieren
 * PUT /api/auth/profile
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as any).user as AuthenticatedUser;
    const { firstName, lastName } = req.body;

    // Profil aktualisieren
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName,
        lastName,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      });

    res.json(createSuccessResponse(updatedUser, 'Profil aktualisiert'));

  } catch (error) {
    console.error('Profil-Update-Fehler:', error);
    res.status(500).json(createErrorResponse('Profil-Update-Fehler', 500));
  }
}

/**
 * Passwort ändern
 * PUT /api/auth/change-password
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as any).user as AuthenticatedUser;
    const { currentPassword, newPassword } = req.body;

    // Aktuelles Passwort verifizieren
    const userResult = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userResult.length === 0) {
      res.status(404).json(createErrorResponse('Benutzer nicht gefunden', 404));
      return;
    }

    const isValidPassword = await comparePassword(currentPassword, userResult[0].passwordHash);
    if (!isValidPassword) {
      res.status(400).json(createErrorResponse('Aktuelles Passwort ist falsch', 400));
      return;
    }

    // Neues Passwort hashen
    const newPasswordHash = await hashPassword(newPassword);

    // Passwort aktualisieren
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    res.json(createSuccessResponse(
      { message: 'Passwort erfolgreich geändert' },
      'Passwort aktualisiert'
    ));

  } catch (error) {
    console.error('Passwort-Ändern-Fehler:', error);
    res.status(500).json(createErrorResponse('Passwort-Ändern-Fehler', 500));
  }
}

// ========================
// EXPORT
// ========================

export default {
  login,
  refreshAccessToken,
  logout,
  registerUser,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword
};
