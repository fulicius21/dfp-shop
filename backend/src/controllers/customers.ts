/**
 * Kunden-Controller für DressForPleasure Backend
 * 
 * Dieser Controller behandelt:
 * - Kundenregistrierung und -verwaltung
 * - Profil-Management
 * - Adressverwaltung
 * - Bestellhistorie
 * - DSGVO-konforme Datenverarbeitung
 */

import { Request, Response } from 'express';
import { db } from '../db/connection';
import { 
  customers, 
  customerAddresses, 
  orders, 
  orderItems,
  auditLogs,
  userSessions 
} from '../db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { 
  hashPassword, 
  generateJWT, 
  createSuccessResponse, 
  createErrorResponse,
  calculatePagination,
  anonymizeEmail,
  validateEmail,
  generateResetToken
} from '../utils';
import { 
  CreateCustomerRequest, 
  UpdateCustomerRequest, 
  CustomerResponse,
  AuthRequest,
  SearchParams,
  CustomerAddress
} from '../types';
import { sendPasswordResetEmail } from '../services/emailService';

// ========================
// KUNDENREGISTRIERUNG
// ========================

/**
 * Neuen Kunden registrieren
 * POST /api/customers/register
 */
export async function registerCustomer(req: Request, res: Response): Promise<void> {
  try {
    const customerData: CreateCustomerRequest = req.body;

    // Input-Validierung
    if (!customerData.email || !customerData.password) {
      res.status(400).json(createErrorResponse('E-Mail und Passwort sind erforderlich', 400));
      return;
    }

    if (!validateEmail(customerData.email)) {
      res.status(400).json(createErrorResponse('Ungültige E-Mail-Adresse', 400));
      return;
    }

    // Prüfen ob E-Mail bereits existiert
    const existingCustomer = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.email, customerData.email.toLowerCase()))
      .limit(1);

    if (existingCustomer.length > 0) {
      res.status(409).json(createErrorResponse('E-Mail-Adresse bereits registriert', 409));
      return;
    }

    // Passwort hashen
    const hashedPassword = await hashPassword(customerData.password);

    // Kunden erstellen
    const [newCustomer] = await db
      .insert(customers)
      .values({
        email: customerData.email.toLowerCase(),
        passwordHash: hashedPassword,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        phone: customerData.phone,
        dateOfBirth: customerData.dateOfBirth ? new Date(customerData.dateOfBirth) : null,
        gender: customerData.gender,
        customerSince: new Date(),
        isActive: true,
        totalOrders: 0,
        totalSpent: '0.00',
        marketingOptIn: customerData.marketingOptIn || false,
        gdprConsentDate: new Date()
      })
      .returning({
        id: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        customerSince: customers.customerSince
      });

    // Audit-Log erstellen
    await db.insert(auditLogs).values({
      entityType: 'customer',
      entityId: newCustomer.id,
      action: 'register',
      performedByEmail: newCustomer.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      changes: { registration: true },
      gdprLegalBasis: 'consent'
    });

    // JWT-Token generieren
    const token = generateJWT({ 
      id: newCustomer.id, 
      email: newCustomer.email, 
      role: 'customer' 
    });

    res.status(201).json(createSuccessResponse({
      customer: newCustomer,
      token
    }, 'Kunde erfolgreich registriert'));

  } catch (error) {
    console.error('Fehler bei Kundenregistrierung:', error);
    res.status(500).json(createErrorResponse('Fehler bei der Registrierung', 500));
  }
}

/**
 * Kunde-Login
 * POST /api/customers/login
 */
export async function loginCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json(createErrorResponse('E-Mail und Passwort sind erforderlich', 400));
      return;
    }

    // Kunde suchen
    const customerResult = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email.toLowerCase()))
      .limit(1);

    if (customerResult.length === 0) {
      res.status(401).json(createErrorResponse('Ungültige Anmeldedaten', 401));
      return;
    }

    const customer = customerResult[0];

    if (!customer.isActive) {
      res.status(401).json(createErrorResponse('Konto ist deaktiviert', 401));
      return;
    }

    // Passwort prüfen
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, customer.passwordHash);

    if (!isValidPassword) {
      res.status(401).json(createErrorResponse('Ungültige Anmeldedaten', 401));
      return;
    }

    // Login-Daten aktualisieren
    await db
      .update(customers)
      .set({
        lastLoginAt: new Date(),
        loginCount: sql`${customers.loginCount} + 1`
      })
      .where(eq(customers.id, customer.id));

    // JWT-Token generieren
    const token = generateJWT({ 
      id: customer.id, 
      email: customer.email, 
      role: 'customer' 
    });

    // Session erstellen
    await db.insert(userSessions).values({
      userId: customer.id,
      sessionToken: token,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 Tage
    });

    // Audit-Log erstellen
    await db.insert(auditLogs).values({
      entityType: 'customer',
      entityId: customer.id,
      action: 'login',
      performedByEmail: customer.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      gdprLegalBasis: 'contract'
    });

    const customerResponse: CustomerResponse = {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth,
      gender: customer.gender,
      customerSince: customer.customerSince,
      totalOrders: customer.totalOrders,
      totalSpent: customer.totalSpent,
      lastLoginAt: new Date(),
      isActive: customer.isActive,
      marketingOptIn: customer.marketingOptIn
    };

    res.json(createSuccessResponse({
      customer: customerResponse,
      token
    }, 'Erfolgreich angemeldet'));

  } catch (error) {
    console.error('Fehler beim Kunden-Login:', error);
    res.status(500).json(createErrorResponse('Fehler bei der Anmeldung', 500));
  }
}

// ========================
// KUNDENVERWALTUNG
// ========================

/**
 * Alle Kunden abrufen (Admin)
 * GET /api/customers
 */
export async function getCustomers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'customerSince',
      sortOrder = 'desc',
      search,
      isActive,
      hasOrders
    } = req.query as SearchParams & {
      isActive?: string;
      hasOrders?: string;
    };

    // Base Query
    let query = db
      .select({
        id: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        customerSince: customers.customerSince,
        totalOrders: customers.totalOrders,
        totalSpent: customers.totalSpent,
        lastLoginAt: customers.lastLoginAt,
        lastOrderAt: customers.lastOrderAt,
        isActive: customers.isActive,
        marketingOptIn: customers.marketingOptIn
      })
      .from(customers);

    // Filter-Bedingungen
    const conditions = [];

    if (search) {
      conditions.push(
        sql`(${customers.email} ILIKE ${`%${search}%`} OR 
            ${customers.firstName} ILIKE ${`%${search}%`} OR 
            ${customers.lastName} ILIKE ${`%${search}%`})`
      );
    }

    if (isActive !== undefined) {
      conditions.push(eq(customers.isActive, isActive === 'true'));
    }

    if (hasOrders === 'true') {
      conditions.push(sql`${customers.totalOrders} > 0`);
    } else if (hasOrders === 'false') {
      conditions.push(sql`${customers.totalOrders} = 0`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sortierung
    const sortColumn = customers[sortBy as keyof typeof customers] || customers.customerSince;
    if (sortOrder === 'asc') {
      query = query.orderBy(sortColumn);
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    // Gesamtanzahl für Pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(customers);
    
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count: totalCount }] = await countQuery;

    // Pagination
    const offset = (page - 1) * limit;
    const customersResult = await query
      .limit(limit)
      .offset(offset);

    const pagination = calculatePagination(page, limit, totalCount);

    res.json(createSuccessResponse({
      customers: customersResult,
      meta: pagination
    }));

  } catch (error) {
    console.error('Fehler beim Abrufen der Kunden:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Kunden', 500));
  }
}

/**
 * Einzelnen Kunden abrufen
 * GET /api/customers/:id
 */
export async function getCustomerById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = parseInt(req.params.id);
    const user = req.user!;

    // Autorisierung: Nur eigenes Profil oder Admin
    if (user.role !== 'admin' && user.id !== customerId) {
      res.status(403).json(createErrorResponse('Zugriff verweigert', 403));
      return;
    }

    const customerResult = await db
      .select({
        id: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        dateOfBirth: customers.dateOfBirth,
        gender: customers.gender,
        customerSince: customers.customerSince,
        totalOrders: customers.totalOrders,
        totalSpent: customers.totalSpent,
        lastLoginAt: customers.lastLoginAt,
        lastOrderAt: customers.lastOrderAt,
        isActive: customers.isActive,
        marketingOptIn: customers.marketingOptIn,
        preferredLanguage: customers.preferredLanguage,
        notes: customers.notes
      })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customerResult.length === 0) {
      res.status(404).json(createErrorResponse('Kunde nicht gefunden', 404));
      return;
    }

    const customer = customerResult[0];

    // Adressen laden
    const addresses = await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId));

    // Letzte Bestellungen laden (für Kundenprofil)
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        orderDate: orders.orderDate
      })
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.orderDate))
      .limit(5);

    const customerResponse: CustomerResponse = {
      ...customer,
      addresses: addresses.map(addr => ({
        id: addr.id,
        customerId: addr.customerId,
        type: addr.type,
        isDefault: addr.isDefault,
        firstName: addr.firstName,
        lastName: addr.lastName,
        company: addr.company,
        street: addr.street,
        houseNumber: addr.houseNumber,
        zipCode: addr.zipCode,
        city: addr.city,
        state: addr.state,
        country: addr.country,
        createdAt: addr.createdAt,
        updatedAt: addr.updatedAt
      })),
      recentOrders
    };

    res.json(createSuccessResponse(customerResponse));

  } catch (error) {
    console.error('Fehler beim Abrufen des Kunden:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen des Kunden', 500));
  }
}

/**
 * Kundenprofil aktualisieren
 * PUT /api/customers/:id
 */
export async function updateCustomer(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = parseInt(req.params.id);
    const updateData: UpdateCustomerRequest = req.body;
    const user = req.user!;

    // Autorisierung: Nur eigenes Profil oder Admin
    if (user.role !== 'admin' && user.id !== customerId) {
      res.status(403).json(createErrorResponse('Zugriff verweigert', 403));
      return;
    }

    // Existierenden Kunden laden
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (existingCustomer.length === 0) {
      res.status(404).json(createErrorResponse('Kunde nicht gefunden', 404));
      return;
    }

    const currentCustomer = existingCustomer[0];

    // Update-Daten vorbereiten
    const updateFields: any = {
      updatedAt: new Date()
    };

    // Erlaubte Felder für Kunden
    const allowedCustomerFields = [
      'firstName', 'lastName', 'phone', 'dateOfBirth', 
      'gender', 'preferredLanguage', 'marketingOptIn'
    ];

    // Admin-spezifische Felder
    const adminOnlyFields = ['isActive', 'notes'];

    // Standard-Felder verarbeiten
    allowedCustomerFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    });

    // Admin-spezifische Felder (nur für Admins)
    if (user.role === 'admin') {
      adminOnlyFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      });
    }

    // E-Mail-Änderung (mit zusätzlicher Validierung)
    if (updateData.email && updateData.email !== currentCustomer.email) {
      if (!validateEmail(updateData.email)) {
        res.status(400).json(createErrorResponse('Ungültige E-Mail-Adresse', 400));
        return;
      }

      // Prüfen ob neue E-Mail bereits existiert
      const emailExists = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(
          eq(customers.email, updateData.email.toLowerCase()),
          sql`${customers.id} != ${customerId}`
        ))
        .limit(1);

      if (emailExists.length > 0) {
        res.status(409).json(createErrorResponse('E-Mail-Adresse bereits vergeben', 409));
        return;
      }

      updateFields.email = updateData.email.toLowerCase();
    }

    // Passwort-Änderung
    if (updateData.password) {
      if (updateData.password.length < 8) {
        res.status(400).json(createErrorResponse('Passwort muss mindestens 8 Zeichen lang sein', 400));
        return;
      }
      updateFields.passwordHash = await hashPassword(updateData.password);
    }

    // Kunden aktualisieren
    const [updatedCustomer] = await db
      .update(customers)
      .set(updateFields)
      .where(eq(customers.id, customerId))
      .returning({
        id: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        dateOfBirth: customers.dateOfBirth,
        gender: customers.gender,
        isActive: customers.isActive,
        marketingOptIn: customers.marketingOptIn,
        updatedAt: customers.updatedAt
      });

    // Audit-Log erstellen
    await db.insert(auditLogs).values({
      entityType: 'customer',
      entityId: customerId,
      action: 'update',
      performedBy: user.id,
      performedByEmail: user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      changes: { before: currentCustomer, after: updateFields },
      gdprLegalBasis: 'contract'
    });

    res.json(createSuccessResponse(updatedCustomer, 'Profil erfolgreich aktualisiert'));

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Kunden:', error);
    res.status(500).json(createErrorResponse('Fehler beim Aktualisieren des Profils', 500));
  }
}

// ========================
// ADRESSVERWALTUNG
// ========================

/**
 * Adresse hinzufügen
 * POST /api/customers/:id/addresses
 */
export async function addCustomerAddress(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = parseInt(req.params.id);
    const addressData: CustomerAddress = req.body;
    const user = req.user!;

    // Autorisierung prüfen
    if (user.role !== 'admin' && user.id !== customerId) {
      res.status(403).json(createErrorResponse('Zugriff verweigert', 403));
      return;
    }

    // Pflichtfelder prüfen
    if (!addressData.firstName || !addressData.lastName || !addressData.street || 
        !addressData.zipCode || !addressData.city || !addressData.country) {
      res.status(400).json(createErrorResponse('Pflichtfelder fehlen', 400));
      return;
    }

    // Bei Default-Adresse: andere Adressen auf nicht-default setzen
    if (addressData.isDefault) {
      await db
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(and(
          eq(customerAddresses.customerId, customerId),
          eq(customerAddresses.type, addressData.type || 'billing')
        ));
    }

    // Neue Adresse erstellen
    const [newAddress] = await db
      .insert(customerAddresses)
      .values({
        customerId,
        type: addressData.type || 'billing',
        isDefault: addressData.isDefault || false,
        firstName: addressData.firstName,
        lastName: addressData.lastName,
        company: addressData.company,
        street: addressData.street,
        houseNumber: addressData.houseNumber,
        zipCode: addressData.zipCode,
        city: addressData.city,
        state: addressData.state,
        country: addressData.country
      })
      .returning();

    res.status(201).json(createSuccessResponse(newAddress, 'Adresse erfolgreich hinzugefügt'));

  } catch (error) {
    console.error('Fehler beim Hinzufügen der Adresse:', error);
    res.status(500).json(createErrorResponse('Fehler beim Hinzufügen der Adresse', 500));
  }
}

/**
 * Passwort-Reset anfordern
 * POST /api/customers/forgot-password
 */
export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      res.status(400).json(createErrorResponse('Gültige E-Mail-Adresse erforderlich', 400));
      return;
    }

    // Kunde suchen
    const customerResult = await db
      .select({
        id: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        isActive: customers.isActive
      })
      .from(customers)
      .where(eq(customers.email, email.toLowerCase()))
      .limit(1);

    // Immer positive Antwort (Sicherheit)
    if (customerResult.length === 0) {
      res.json(createSuccessResponse(
        { message: 'Falls die E-Mail-Adresse registriert ist, wurde ein Reset-Link gesendet' }
      ));
      return;
    }

    const customer = customerResult[0];

    if (!customer.isActive) {
      res.json(createSuccessResponse(
        { message: 'Falls die E-Mail-Adresse registriert ist, wurde ein Reset-Link gesendet' }
      ));
      return;
    }

    // Reset-Token generieren
    const resetToken = generateResetToken();
    const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Stunden

    // Token in Datenbank speichern
    await db
      .update(customers)
      .set({
        passwordResetToken: resetToken,
        passwordResetTokenExpiry: expiryTime
      })
      .where(eq(customers.id, customer.id));

    // E-Mail senden
    const emailSent = await sendPasswordResetEmail(customer.email, {
      resetToken,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      expiryTime
    });

    if (emailSent) {
      console.log(`Passwort-Reset-E-Mail gesendet an: ${customer.email}`);
    }

    // Audit-Log erstellen
    await db.insert(auditLogs).values({
      entityType: 'customer',
      entityId: customer.id,
      action: 'password_reset_requested',
      performedByEmail: customer.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      gdprLegalBasis: 'contract'
    });

    res.json(createSuccessResponse(
      { message: 'Falls die E-Mail-Adresse registriert ist, wurde ein Reset-Link gesendet' }
    ));

  } catch (error) {
    console.error('Fehler bei Passwort-Reset-Anfrage:', error);
    res.status(500).json(createErrorResponse('Fehler bei der Passwort-Reset-Anfrage', 500));
  }
}

// ========================
// DSGVO-FUNKTIONEN
// ========================

/**
 * Kundendaten exportieren (DSGVO)
 * GET /api/customers/:id/export
 */
export async function exportCustomerData(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = parseInt(req.params.id);
    const user = req.user!;

    // Autorisierung prüfen
    if (user.role !== 'admin' && user.id !== customerId) {
      res.status(403).json(createErrorResponse('Zugriff verweigert', 403));
      return;
    }

    // Alle Kundendaten sammeln
    const customerData = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customerData.length === 0) {
      res.status(404).json(createErrorResponse('Kunde nicht gefunden', 404));
      return;
    }

    const customer = customerData[0];

    // Adressen
    const addresses = await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId));

    // Bestellungen
    const orderHistory = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.orderDate));

    // Bestellpositionen
    const orderIds = orderHistory.map(o => o.id);
    let orderItemsHistory = [];
    if (orderIds.length > 0) {
      orderItemsHistory = await db
        .select()
        .from(orderItems)
        .where(sql`${orderItems.orderId} = ANY(${orderIds})`);
    }

    // Audit-Logs (anonymisiert)
    const auditHistory = await db
      .select({
        action: auditLogs.action,
        timestamp: auditLogs.timestamp,
        ipAddress: auditLogs.ipAddress,
        changes: auditLogs.changes
      })
      .from(auditLogs)
      .where(eq(auditLogs.entityId, customerId))
      .orderBy(desc(auditLogs.timestamp));

    // Vollständigen Export zusammenstellen
    const exportData = {
      customer: {
        ...customer,
        passwordHash: '[REDACTED]' // Passwort aus Export entfernen
      },
      addresses,
      orderHistory,
      orderItemsHistory,
      auditHistory,
      exportDate: new Date(),
      dataRetentionInfo: 'Daten werden gemäß DSGVO-Richtlinien aufbewahrt'
    };

    // Audit-Log für Export erstellen
    await db.insert(auditLogs).values({
      entityType: 'customer',
      entityId: customerId,
      action: 'data_export',
      performedBy: user.id,
      performedByEmail: user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      gdprLegalBasis: 'data_subject_rights'
    });

    res.json(createSuccessResponse(exportData, 'Kundendaten erfolgreich exportiert'));

  } catch (error) {
    console.error('Fehler beim Exportieren der Kundendaten:', error);
    res.status(500).json(createErrorResponse('Fehler beim Exportieren der Daten', 500));
  }
}

/**
 * Kunde löschen (DSGVO)
 * DELETE /api/customers/:id
 */
export async function deleteCustomer(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = parseInt(req.params.id);
    const { force = false } = req.query;
    const user = req.user!;

    // Nur Admins können Kunden löschen
    if (user.role !== 'admin') {
      res.status(403).json(createErrorResponse('Zugriff verweigert', 403));
      return;
    }

    // Kunde laden
    const customerResult = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customerResult.length === 0) {
      res.status(404).json(createErrorResponse('Kunde nicht gefunden', 404));
      return;
    }

    const customer = customerResult[0];

    // Prüfen ob Kunde aktive Bestellungen hat
    const activeOrders = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.customerId, customerId),
        sql`${orders.status} NOT IN ('delivered', 'cancelled')`
      ));

    if (activeOrders[0].count > 0 && !force) {
      res.status(400).json(createErrorResponse(
        'Kunde hat aktive Bestellungen. Verwenden Sie force=true zum erzwungenen Löschen', 
        400
      ));
      return;
    }

    await db.transaction(async (tx) => {
      // Kundendaten anonymisieren statt löschen (DSGVO-konform)
      await tx
        .update(customers)
        .set({
          email: anonymizeEmail(customer.email),
          firstName: '[GELÖSCHT]',
          lastName: '[GELÖSCHT]',
          phone: null,
          dateOfBirth: null,
          passwordHash: '[DELETED]',
          isActive: false,
          marketingOptIn: false,
          gdprDeletedAt: new Date(),
          notes: 'Kunde gelöscht (DSGVO)',
          updatedAt: new Date()
        })
        .where(eq(customers.id, customerId));

      // Adressen anonymisieren
      await tx
        .update(customerAddresses)
        .set({
          firstName: '[GELÖSCHT]',
          lastName: '[GELÖSCHT]',
          company: null,
          street: '[GELÖSCHT]',
          houseNumber: null,
          updatedAt: new Date()
        })
        .where(eq(customerAddresses.customerId, customerId));

      // Audit-Log erstellen
      await tx.insert(auditLogs).values({
        entityType: 'customer',
        entityId: customerId,
        action: 'gdpr_delete',
        performedBy: user.id,
        performedByEmail: user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        changes: { originalEmail: customer.email, deletedAt: new Date() },
        reason: 'DSGVO-Löschungsanfrage',
        gdprLegalBasis: 'data_subject_rights'
      });
    });

    res.json(createSuccessResponse(
      { customerId, status: 'anonymized' },
      'Kundendaten erfolgreich anonymisiert'
    ));

  } catch (error) {
    console.error('Fehler beim Löschen des Kunden:', error);
    res.status(500).json(createErrorResponse('Fehler beim Löschen des Kunden', 500));
  }
}

// ========================
// EXPORT
// ========================

export default {
  registerCustomer,
  loginCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  addCustomerAddress,
  requestPasswordReset,
  exportCustomerData,
  deleteCustomer
};
