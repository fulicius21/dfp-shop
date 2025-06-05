/**
 * Bestellungen-Controller für DressForPleasure Backend
 * 
 * Dieser Controller behandelt:
 * - Bestellerstellung und Checkout-Prozess
 * - Bestellverwaltung und Status-Updates
 * - Inventar-Reservierung
 * - Integration mit Stripe Payment Intents
 * - DSGVO-konforme Bestellhistorie
 */

import { Request, Response } from 'express';
import { db } from '../db/connection';
import { 
  orders, 
  orderItems, 
  customers, 
  customerAddresses,
  products, 
  productVariants, 
  inventory,
  payments,
  shipments,
  auditLogs
} from '../db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { 
  generateOrderNumber,
  createSuccessResponse, 
  createErrorResponse,
  calculatePagination,
  formatPrice,
  anonymizeEmail
} from '../utils';
import { 
  CreateOrderRequest, 
  OrderResponse, 
  SearchParams,
  AuthRequest,
  CustomerAddress
} from '../types';
import Stripe from 'stripe';

// Stripe Instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

// ========================
// BESTELLUNGEN ABRUFEN
// ========================

/**
 * Alle Bestellungen abrufen (Admin)
 * GET /api/orders
 */
export async function getOrders(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'orderDate',
      sortOrder = 'desc',
      status,
      paymentStatus,
      customerEmail,
      orderNumber,
      startDate,
      endDate
    } = req.query as SearchParams & {
      status?: string;
      paymentStatus?: string;
      customerEmail?: string;
      orderNumber?: string;
      startDate?: string;
      endDate?: string;
    };

    // Base Query
    let query = db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerId: orders.customerId,
        customerEmail: orders.customerEmail,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        fulfillmentStatus: orders.fulfillmentStatus,
        currency: orders.currency,
        subtotal: orders.subtotal,
        taxAmount: orders.taxAmount,
        shippingAmount: orders.shippingAmount,
        discountAmount: orders.discountAmount,
        totalAmount: orders.totalAmount,
        orderDate: orders.orderDate,
        processedAt: orders.processedAt,
        shippedAt: orders.shippedAt,
        deliveredAt: orders.deliveredAt,
        cancelledAt: orders.cancelledAt,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt
      })
      .from(orders);

    // Filter-Bedingungen
    const conditions = [];

    if (status) {
      conditions.push(eq(orders.status, status));
    }

    if (paymentStatus) {
      conditions.push(eq(orders.paymentStatus, paymentStatus));
    }

    if (customerEmail) {
      conditions.push(eq(orders.customerEmail, customerEmail.toLowerCase()));
    }

    if (orderNumber) {
      conditions.push(eq(orders.orderNumber, orderNumber));
    }

    if (startDate) {
      conditions.push(sql`${orders.orderDate} >= ${new Date(startDate)}`);
    }

    if (endDate) {
      conditions.push(sql`${orders.orderDate} <= ${new Date(endDate)}`);
    }

    // Conditions anwenden
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sortierung
    const sortColumn = orders[sortBy as keyof typeof orders] || orders.orderDate;
    if (sortOrder === 'asc') {
      query = query.orderBy(sortColumn);
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    // Gesamtanzahl für Pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(orders);
    
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count: totalCount }] = await countQuery;

    // Pagination
    const offset = (page - 1) * limit;
    const orderResults = await query
      .limit(limit)
      .offset(offset);

    // Bestellpositionen für jede Bestellung laden
    const enrichedOrders = await Promise.all(
      orderResults.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items,
          itemCount: items.length
        };
      })
    );

    const pagination = calculatePagination(page, limit, totalCount);

    res.json(createSuccessResponse({
      orders: enrichedOrders,
      meta: pagination
    }));

  } catch (error) {
    console.error('Fehler beim Abrufen der Bestellungen:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Bestellungen', 500));
  }
}

/**
 * Einzelne Bestellung abrufen
 * GET /api/orders/:id
 */
export async function getOrderById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orderId = parseInt(req.params.id);

    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderResult.length === 0) {
      res.status(404).json(createErrorResponse('Bestellung nicht gefunden', 404));
      return;
    }

    const order = orderResult[0];

    // Bestellpositionen laden
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        variantId: orderItems.variantId,
        productName: orderItems.productName,
        productSku: orderItems.productSku,
        variantSku: orderItems.variantSku,
        size: orderItems.size,
        color: orderItems.color,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        fulfillmentStatus: orderItems.fulfillmentStatus,
        createdAt: orderItems.createdAt
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    // Zahlungen laden
    const paymentsResult = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id));

    // Versand laden
    const shipmentsResult = await db
      .select()
      .from(shipments)
      .where(eq(shipments.orderId, order.id));

    // Kunde laden (falls registriert)
    let customer = null;
    if (order.customerId) {
      const customerResult = await db
        .select({
          id: customers.id,
          email: customers.email,
          firstName: customers.firstName,
          lastName: customers.lastName,
          customerSince: customers.customerSince,
          totalOrders: customers.totalOrders,
          totalSpent: customers.totalSpent
        })
        .from(customers)
        .where(eq(customers.id, order.customerId))
        .limit(1);

      if (customerResult.length > 0) {
        customer = customerResult[0];
      }
    }

    const enrichedOrder: OrderResponse = {
      ...order,
      items,
      payments: paymentsResult,
      shipments: shipmentsResult,
      customer
    };

    res.json(createSuccessResponse(enrichedOrder));

  } catch (error) {
    console.error('Fehler beim Abrufen der Bestellung:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Bestellung', 500));
  }
}

// ========================
// BESTELLUNG ERSTELLEN (CHECKOUT)
// ========================

/**
 * Neue Bestellung erstellen (Checkout)
 * POST /api/orders
 */
export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const orderData: CreateOrderRequest = req.body;

    // Input-Validierung
    if (!orderData.items || orderData.items.length === 0) {
      res.status(400).json(createErrorResponse('Bestellung muss mindestens ein Artikel enthalten', 400));
      return;
    }

    // Produktvarianten laden und Verfügbarkeit prüfen
    const variantIds = orderData.items
      .filter(item => item.variantId)
      .map(item => item.variantId!);

    const variants = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        sku: productVariants.sku,
        size: productVariants.size,
        color: productVariants.color,
        price: productVariants.price,
        stock: productVariants.stock,
        isActive: productVariants.isActive
      })
      .from(productVariants)
      .where(inArray(productVariants.id, variantIds));

    // Produkte laden
    const productIds = orderData.items.map(item => item.productId);
    const productsResult = await db
      .select({
        id: products.id,
        name: products.name,
        basePrice: products.basePrice,
        sku: products.sku,
        status: products.status
      })
      .from(products)
      .where(inArray(products.id, productIds));

    // Verfügbarkeitsprüfung
    const unavailableItems = [];
    let subtotal = 0;

    for (const item of orderData.items) {
      const product = productsResult.find(p => p.id === item.productId);
      if (!product || product.status !== 'active') {
        unavailableItems.push(`Produkt ${product?.name || item.productId} ist nicht verfügbar`);
        continue;
      }

      if (item.variantId) {
        const variant = variants.find(v => v.id === item.variantId);
        if (!variant || !variant.isActive || variant.stock < item.quantity) {
          unavailableItems.push(`${product.name} (${variant?.size || ''}, ${variant?.color || ''}) ist nicht verfügbar oder unzureichender Lagerbestand`);
          continue;
        }
        subtotal += parseFloat(variant.price) * item.quantity;
      } else {
        subtotal += parseFloat(product.basePrice) * item.quantity;
      }
    }

    if (unavailableItems.length > 0) {
      res.status(400).json(createErrorResponse(
        `Artikel nicht verfügbar: ${unavailableItems.join(', ')}`, 
        400
      ));
      return;
    }

    // Steuer und Versandkosten berechnen
    const taxRate = 0.19; // 19% MwSt in Deutschland
    const taxAmount = subtotal * taxRate;
    const shippingAmount = subtotal >= 50 ? 0 : 4.95; // Kostenloser Versand ab 50€
    const discountAmount = 0; // TODO: Discount-Codes implementieren
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    // Bestellnummer generieren
    const orderNumber = generateOrderNumber();

    // Stripe Payment Intent erstellen
    let stripePaymentIntentId = null;
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Stripe arbeitet mit Cent
        currency: 'eur',
        metadata: {
          orderNumber,
          customerEmail: orderData.customerEmail
        },
        automatic_payment_methods: {
          enabled: true
        }
      });
      stripePaymentIntentId = paymentIntent.id;
    } catch (stripeError) {
      console.error('Stripe Payment Intent Fehler:', stripeError);
      res.status(500).json(createErrorResponse('Fehler bei der Zahlungsverarbeitung', 500));
      return;
    }

    // Kunde suchen oder erstellen
    let customerId = null;
    if (orderData.customerId) {
      customerId = orderData.customerId;
    } else {
      // Prüfen ob E-Mail bereits als Kunde existiert
      const existingCustomer = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.email, orderData.customerEmail.toLowerCase()))
        .limit(1);

      if (existingCustomer.length > 0) {
        customerId = existingCustomer[0].id;
      } else {
        // Neuen Gastkunden erstellen
        const [newCustomer] = await db
          .insert(customers)
          .values({
            email: orderData.customerEmail.toLowerCase(),
            firstName: orderData.billingAddress.firstName,
            lastName: orderData.billingAddress.lastName,
            customerSince: new Date(),
            totalOrders: 0,
            totalSpent: '0.00'
          })
          .returning({ id: customers.id });

        customerId = newCustomer.id;
      }
    }

    // Datenbank-Transaktion für Bestellung
    const result = await db.transaction(async (tx) => {
      // Bestellung erstellen
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerId,
          customerEmail: orderData.customerEmail.toLowerCase(),
          status: 'pending',
          paymentStatus: 'pending',
          fulfillmentStatus: 'unfulfilled',
          currency: 'EUR',
          subtotal: subtotal.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          shippingAmount: shippingAmount.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          billingAddress: orderData.billingAddress,
          shippingAddress: orderData.shippingAddress,
          notes: orderData.notes,
          stripePaymentIntentId,
          orderDate: new Date()
        })
        .returning();

      // Bestellpositionen erstellen
      const orderItemsData = [];
      for (const item of orderData.items) {
        const product = productsResult.find(p => p.id === item.productId)!;
        const variant = item.variantId ? variants.find(v => v.id === item.variantId) : null;

        const unitPrice = variant ? parseFloat(variant.price) : parseFloat(product.basePrice);
        const totalPrice = unitPrice * item.quantity;

        orderItemsData.push({
          orderId: newOrder.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: product.name,
          productSku: product.sku,
          variantSku: variant?.sku,
          size: variant?.size,
          color: variant?.color,
          quantity: item.quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
          fulfillmentStatus: 'unfulfilled'
        });
      }

      await tx.insert(orderItems).values(orderItemsData);

      // Inventar reservieren
      for (const item of orderData.items) {
        if (item.variantId) {
          await tx
            .update(inventory)
            .set({
              quantityReserved: sql`${inventory.quantityReserved} + ${item.quantity}`,
              quantityAvailable: sql`${inventory.quantityAvailable} - ${item.quantity}`,
              updatedAt: new Date()
            })
            .where(eq(inventory.variantId, item.variantId));

          // Produktvariante-Stock aktualisieren
          await tx
            .update(productVariants)
            .set({
              stock: sql`${productVariants.stock} - ${item.quantity}`,
              updatedAt: new Date()
            })
            .where(eq(productVariants.id, item.variantId));
        }
      }

      // Kunde-Statistiken aktualisieren
      await tx
        .update(customers)
        .set({
          totalOrders: sql`${customers.totalOrders} + 1`,
          totalSpent: sql`${customers.totalSpent} + ${totalAmount}`,
          lastOrderAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(customers.id, customerId!));

      // Audit-Log erstellen
      await tx.insert(auditLogs).values({
        entityType: 'order',
        entityId: newOrder.id,
        action: 'create',
        performedByEmail: orderData.customerEmail,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        changes: { order: newOrder, items: orderItemsData },
        gdprLegalBasis: 'contract'
      });

      return newOrder;
    });

    // Payment-Eintrag erstellen
    await db.insert(payments).values({
      orderId: result.id,
      stripePaymentIntentId,
      paymentMethod: orderData.paymentMethod || 'card',
      status: 'pending',
      amount: totalAmount.toFixed(2),
      currency: 'EUR'
    });

    // Vollständige Bestellung laden
    req.params.id = result.id.toString();
    return getOrderById(req as AuthRequest, res);

  } catch (error) {
    console.error('Fehler beim Erstellen der Bestellung:', error);
    res.status(500).json(createErrorResponse('Fehler beim Erstellen der Bestellung', 500));
  }
}

// ========================
// BESTELLUNG AKTUALISIEREN
// ========================

/**
 * Bestellstatus aktualisieren
 * PUT /api/orders/:id/status
 */
export async function updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orderId = parseInt(req.params.id);
    const { status, paymentStatus, fulfillmentStatus, notes } = req.body;

    const user = req.user!;

    // Prüfen ob Bestellung existiert
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (existingOrder.length === 0) {
      res.status(404).json(createErrorResponse('Bestellung nicht gefunden', 404));
      return;
    }

    const order = existingOrder[0];
    const updateFields: any = {
      updatedAt: new Date()
    };

    // Status-Updates
    if (status && status !== order.status) {
      updateFields.status = status;
      
      if (status === 'confirmed') {
        updateFields.processedAt = new Date();
      } else if (status === 'cancelled') {
        updateFields.cancelledAt = new Date();
        // TODO: Inventar freigeben
      }
    }

    if (paymentStatus && paymentStatus !== order.paymentStatus) {
      updateFields.paymentStatus = paymentStatus;
    }

    if (fulfillmentStatus && fulfillmentStatus !== order.fulfillmentStatus) {
      updateFields.fulfillmentStatus = fulfillmentStatus;
      
      if (fulfillmentStatus === 'fulfilled') {
        updateFields.shippedAt = new Date();
      }
    }

    if (notes) {
      updateFields.notes = notes;
    }

    // Bestellung aktualisieren
    const [updatedOrder] = await db
      .update(orders)
      .set(updateFields)
      .where(eq(orders.id, orderId))
      .returning();

    // Audit-Log erstellen
    await db.insert(auditLogs).values({
      entityType: 'order',
      entityId: orderId,
      action: 'update',
      performedBy: user.id,
      performedByEmail: user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      changes: { before: order, after: updatedOrder },
      reason: `Status-Update durch ${user.email}`,
      gdprLegalBasis: 'legitimate_interest'
    });

    res.json(createSuccessResponse(updatedOrder, 'Bestellstatus aktualisiert'));

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Bestellstatus:', error);
    res.status(500).json(createErrorResponse('Fehler beim Aktualisieren des Bestellstatus', 500));
  }
}

/**
 * Bestellung stornieren
 * POST /api/orders/:id/cancel
 */
export async function cancelOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orderId = parseInt(req.params.id);
    const { reason } = req.body;

    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      res.status(404).json(createErrorResponse('Bestellung nicht gefunden', 404));
      return;
    }

    const currentOrder = order[0];

    // Prüfen ob Stornierung möglich
    if (['shipped', 'delivered', 'cancelled'].includes(currentOrder.status)) {
      res.status(400).json(createErrorResponse(
        'Bestellung kann nicht storniert werden (bereits versandt oder storniert)', 
        400
      ));
      return;
    }

    await db.transaction(async (tx) => {
      // Bestellung stornieren
      await tx
        .update(orders)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          notes: reason || 'Storniert durch Admin',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

      // Inventar freigeben
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        if (item.variantId) {
          await tx
            .update(inventory)
            .set({
              quantityReserved: sql`${inventory.quantityReserved} - ${item.quantity}`,
              quantityAvailable: sql`${inventory.quantityAvailable} + ${item.quantity}`,
              updatedAt: new Date()
            })
            .where(eq(inventory.variantId, item.variantId));

          await tx
            .update(productVariants)
            .set({
              stock: sql`${productVariants.stock} + ${item.quantity}`,
              updatedAt: new Date()
            })
            .where(eq(productVariants.id, item.variantId));
        }
      }

      // Stripe Payment Intent stornieren
      if (currentOrder.stripePaymentIntentId) {
        try {
          await stripe.paymentIntents.cancel(currentOrder.stripePaymentIntentId);
        } catch (stripeError) {
          console.error('Stripe Stornierung fehlgeschlagen:', stripeError);
        }
      }
    });

    res.json(createSuccessResponse(
      { orderId, status: 'cancelled' },
      'Bestellung erfolgreich storniert'
    ));

  } catch (error) {
    console.error('Fehler beim Stornieren der Bestellung:', error);
    res.status(500).json(createErrorResponse('Fehler beim Stornieren der Bestellung', 500));
  }
}

// ========================
// ANALYTICS & STATISTIKEN
// ========================

/**
 * Bestellstatistiken abrufen
 * GET /api/orders/analytics/overview
 */
export async function getOrderAnalytics(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { startDate, endDate } = req.query;

    // Basis-Zeitfilter
    let dateFilter = sql`1=1`;
    if (startDate) {
      dateFilter = sql`${orders.orderDate} >= ${new Date(startDate as string)}`;
    }
    if (endDate) {
      dateFilter = sql`${dateFilter} AND ${orders.orderDate} <= ${new Date(endDate as string)}`;
    }

    // Gesamtstatistiken
    const [totalStats] = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        totalRevenue: sql<number>`sum(${orders.totalAmount}::numeric)`,
        averageOrderValue: sql<number>`avg(${orders.totalAmount}::numeric)`,
        pendingOrders: sql<number>`count(*) FILTER (WHERE status = 'pending')`,
        paidOrders: sql<number>`count(*) FILTER (WHERE payment_status = 'paid')`,
        shippedOrders: sql<number>`count(*) FILTER (WHERE fulfillment_status = 'fulfilled')`
      })
      .from(orders)
      .where(dateFilter);

    // Top-Produkte
    const topProducts = await db
      .select({
        productName: orderItems.productName,
        totalQuantity: sql<number>`sum(${orderItems.quantity})`,
        totalRevenue: sql<number>`sum(${orderItems.totalPrice}::numeric)`
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(dateFilter)
      .groupBy(orderItems.productName)
      .orderBy(sql`sum(${orderItems.quantity}) DESC`)
      .limit(10);

    // Tägliche Statistiken (letzte 30 Tage)
    const dailyStats = await db
      .select({
        date: sql<string>`date(${orders.orderDate})`,
        orderCount: sql<number>`count(*)`,
        revenue: sql<number>`sum(${orders.totalAmount}::numeric)`
      })
      .from(orders)
      .where(sql`${orders.orderDate} >= now() - interval '30 days'`)
      .groupBy(sql`date(${orders.orderDate})`)
      .orderBy(sql`date(${orders.orderDate})`);

    const analytics = {
      totalStats,
      topProducts,
      dailyStats,
      period: {
        startDate: startDate || 'Unbegrenzt',
        endDate: endDate || 'Heute'
      }
    };

    res.json(createSuccessResponse(analytics));

  } catch (error) {
    console.error('Fehler beim Abrufen der Bestellstatistiken:', error);
    res.status(500).json(createErrorResponse('Fehler beim Abrufen der Bestellstatistiken', 500));
  }
}

// ========================
// EXPORT
// ========================

export default {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderAnalytics
};
