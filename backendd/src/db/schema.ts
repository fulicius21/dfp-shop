/**
 * Datenbankschema für DressForPleasure E-Commerce System
 * 
 * Dieses Schema implementiert alle notwendigen Tabellen für:
 * - Produktmanagement (Produkte, Varianten, Kategorien, Kollektionen)
 * - Bestellverwaltung (Bestellungen, Bestellpositionen, Zahlungen)
 * - Benutzerverwaltung (Kunden, Admin-Benutzer, Rollen)
 * - DSGVO-Compliance (Audit-Logs, Datenverarbeitung)
 * - KI-Integration (Style Creator Aufgaben)
 */

import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  decimal, 
  integer, 
  boolean, 
  timestamp, 
  json, 
  unique,
  index,
  primaryKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ========================
// KATEGORIEN & KOLLEKTIONEN
// ========================

/**
 * Tabelle: Categories
 * Produktkategorien (Kleider, Shirts, Jacken, etc.)
 */
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  image: varchar('image', { length: 500 }),
  parentId: integer('parent_id').references(() => categories.id),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  slugIdx: index('categories_slug_idx').on(table.slug),
  activeIdx: index('categories_active_idx').on(table.isActive)
}));

/**
 * Tabelle: Collections
 * Produktkollektionen (Berlin Collection, Atlanta Collection, etc.)
 */
export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  longDescription: text('long_description'),
  image: varchar('image', { length: 500 }),
  featured: boolean('featured').default(false),
  season: varchar('season', { length: 100 }),
  tags: json('tags').$type<string[]>(),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  slugIdx: index('collections_slug_idx').on(table.slug),
  featuredIdx: index('collections_featured_idx').on(table.featured),
  activeIdx: index('collections_active_idx').on(table.isActive)
}));

// ========================
// PRODUKTE
// ========================

/**
 * Tabelle: Products
 * Hauptprodukt-Informationen
 */
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }),
  originalPrice: decimal('original_price', { precision: 10, scale: 2 }),
  discount: integer('discount').default(0), // Prozent
  sku: varchar('sku', { length: 100 }).unique(),
  material: varchar('material', { length: 500 }),
  careInstructions: text('care_instructions'),
  sustainabilityInfo: text('sustainability_info'),
  tags: json('tags').$type<string[]>(),
  sizes: json('sizes').$type<string[]>(),
  colors: json('colors').$type<Array<{name: string, value: string, code: string}>>(),
  status: varchar('status', { length: 50 }).default('draft'), // draft, active, archived
  featured: boolean('featured').default(false),
  newArrival: boolean('new_arrival').default(false),
  bestseller: boolean('bestseller').default(false),
  weight: decimal('weight', { precision: 8, scale: 2 }), // in kg
  dimensions: json('dimensions').$type<{length: number, width: number, height: number}>(),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  slugIdx: index('products_slug_idx').on(table.slug),
  statusIdx: index('products_status_idx').on(table.status),
  featuredIdx: index('products_featured_idx').on(table.featured),
  skuIdx: index('products_sku_idx').on(table.sku)
}));

/**
 * Tabelle: ProductVariants
 * Produktvarianten (verschiedene Größen/Farben-Kombinationen)
 */
export const productVariants = pgTable('product_variants', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  size: varchar('size', { length: 10 }),
  color: varchar('color', { length: 50 }),
  colorCode: varchar('color_code', { length: 20 }),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock').default(0),
  lowStockThreshold: integer('low_stock_threshold').default(5),
  weight: decimal('weight', { precision: 8, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  productIdx: index('variants_product_idx').on(table.productId),
  skuIdx: index('variants_sku_idx').on(table.sku),
  stockIdx: index('variants_stock_idx').on(table.stock),
  uniqueVariant: unique('unique_variant').on(table.productId, table.size, table.color)
}));

/**
 * Tabelle: ProductCategories
 * Many-to-Many Beziehung zwischen Produkten und Kategorien
 */
export const productCategories = pgTable('product_categories', {
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  pk: primaryKey({ columns: [table.productId, table.categoryId] }),
  productIdx: index('pc_product_idx').on(table.productId),
  categoryIdx: index('pc_category_idx').on(table.categoryId)
}));

/**
 * Tabelle: ProductCollections
 * Many-to-Many Beziehung zwischen Produkten und Kollektionen
 */
export const productCollections = pgTable('product_collections', {
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  collectionId: integer('collection_id').references(() => collections.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  pk: primaryKey({ columns: [table.productId, table.collectionId] }),
  productIdx: index('pcol_product_idx').on(table.productId),
  collectionIdx: index('pcol_collection_idx').on(table.collectionId)
}));

/**
 * Tabelle: Media
 * Medien-Dateien (Bilder, Videos) für Produkte
 */
export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // image, video
  url: varchar('url', { length: 500 }).notNull(),
  altText: varchar('alt_text', { length: 255 }),
  title: varchar('title', { length: 255 }),
  sortOrder: integer('sort_order').default(0),
  isPrimary: boolean('is_primary').default(false),
  fileSize: integer('file_size'), // in bytes
  mimeType: varchar('mime_type', { length: 100 }),
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  productIdx: index('media_product_idx').on(table.productId),
  typeIdx: index('media_type_idx').on(table.type),
  primaryIdx: index('media_primary_idx').on(table.isPrimary)
}));

// ========================
// BENUTZER & AUTHENTIFIZIERUNG
// ========================

/**
 * Tabelle: Users
 * System-Benutzer (Admins, Manager)
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
  emailVerifiedAt: timestamp('email_verified_at'),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpiresAt: timestamp('password_reset_expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  activeIdx: index('users_active_idx').on(table.isActive)
}));

/**
 * Tabelle: Roles
 * Benutzerrollen (admin, manager, editor)
 */
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  permissions: json('permissions').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow()
});

/**
 * Tabelle: UserRoles
 * Many-to-Many Beziehung zwischen Benutzern und Rollen
 */
export const userRoles = pgTable('user_roles', {
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow()
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
  userIdx: index('ur_user_idx').on(table.userId),
  roleIdx: index('ur_role_idx').on(table.roleId)
}));

/**
 * Tabelle: Customers
 * Kunden (DSGVO-konform)
 */
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  dateOfBirth: timestamp('date_of_birth'),
  gender: varchar('gender', { length: 20 }),
  newsletterConsent: boolean('newsletter_consent').default(false),
  marketingConsent: boolean('marketing_consent').default(false),
  cookieConsent: json('cookie_consent').$type<{necessary: boolean, analytics: boolean, marketing: boolean}>(),
  consentTimestamp: timestamp('consent_timestamp'),
  isActive: boolean('is_active').default(true),
  lastOrderAt: timestamp('last_order_at'),
  totalOrders: integer('total_orders').default(0),
  totalSpent: decimal('total_spent', { precision: 12, scale: 2 }).default('0.00'),
  customerSince: timestamp('customer_since').defaultNow(),
  gdprDataRetentionUntil: timestamp('gdpr_data_retention_until'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  emailIdx: index('customers_email_idx').on(table.email),
  activeIdx: index('customers_active_idx').on(table.isActive),
  retentionIdx: index('customers_retention_idx').on(table.gdprDataRetentionUntil)
}));

/**
 * Tabelle: CustomerAddresses
 * Kundenadresses (Rechnungs- und Lieferadressen)
 */
export const customerAddresses = pgTable('customer_addresses', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // billing, shipping
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  company: varchar('company', { length: 255 }),
  streetAddress: varchar('street_address', { length: 255 }).notNull(),
  streetAddress2: varchar('street_address_2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 2 }).notNull(), // ISO country code
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  customerIdx: index('addresses_customer_idx').on(table.customerId),
  typeIdx: index('addresses_type_idx').on(table.type),
  defaultIdx: index('addresses_default_idx').on(table.isDefault)
}));

// ========================
// BESTELLUNGEN & ZAHLUNGEN
// ========================

/**
 * Tabelle: Orders
 * Bestellungen
 */
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  customerId: integer('customer_id').references(() => customers.id),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending'), // pending, confirmed, processing, shipped, delivered, cancelled, refunded
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'), // pending, paid, failed, refunded, partially_refunded
  fulfillmentStatus: varchar('fulfillment_status', { length: 50 }).default('unfulfilled'), // unfulfilled, partial, fulfilled
  currency: varchar('currency', { length: 3 }).default('EUR'),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).default('0.00'),
  shippingAmount: decimal('shipping_amount', { precision: 12, scale: 2 }).default('0.00'),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).default('0.00'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  billingAddress: json('billing_address').$type<{
    firstName: string, lastName: string, company?: string,
    streetAddress: string, streetAddress2?: string, city: string,
    state?: string, postalCode: string, country: string
  }>(),
  shippingAddress: json('shipping_address').$type<{
    firstName: string, lastName: string, company?: string,
    streetAddress: string, streetAddress2?: string, city: string,
    state?: string, postalCode: string, country: string
  }>(),
  notes: text('notes'),
  tags: json('tags').$type<string[]>(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  orderDate: timestamp('order_date').defaultNow(),
  processedAt: timestamp('processed_at'),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  orderNumberIdx: index('orders_order_number_idx').on(table.orderNumber),
  customerIdx: index('orders_customer_idx').on(table.customerId),
  statusIdx: index('orders_status_idx').on(table.status),
  paymentStatusIdx: index('orders_payment_status_idx').on(table.paymentStatus),
  orderDateIdx: index('orders_order_date_idx').on(table.orderDate),
  stripeIdx: index('orders_stripe_idx').on(table.stripePaymentIntentId)
}));

/**
 * Tabelle: OrderItems
 * Bestellpositionen
 */
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id),
  variantId: integer('variant_id').references(() => productVariants.id),
  productName: varchar('product_name', { length: 255 }).notNull(),
  productSku: varchar('product_sku', { length: 100 }),
  variantSku: varchar('variant_sku', { length: 100 }),
  size: varchar('size', { length: 10 }),
  color: varchar('color', { length: 50 }),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
  fulfillmentStatus: varchar('fulfillment_status', { length: 50 }).default('unfulfilled'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  orderIdx: index('order_items_order_idx').on(table.orderId),
  productIdx: index('order_items_product_idx').on(table.productId),
  variantIdx: index('order_items_variant_idx').on(table.variantId)
}));

/**
 * Tabelle: Payments
 * Zahlungsinformationen
 */
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  stripeChargeId: varchar('stripe_charge_id', { length: 255 }),
  paymentMethod: varchar('payment_method', { length: 50 }), // card, paypal, bank_transfer
  status: varchar('status', { length: 50 }).notNull(), // pending, succeeded, failed, cancelled, refunded
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  refundedAmount: decimal('refunded_amount', { precision: 12, scale: 2 }).default('0.00'),
  processorFee: decimal('processor_fee', { precision: 10, scale: 2 }),
  metadata: json('metadata'),
  failureReason: text('failure_reason'),
  processedAt: timestamp('processed_at'),
  refundedAt: timestamp('refunded_at'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  orderIdx: index('payments_order_idx').on(table.orderId),
  stripeIdx: index('payments_stripe_idx').on(table.stripePaymentIntentId),
  statusIdx: index('payments_status_idx').on(table.status)
}));

/**
 * Tabelle: Shipments
 * Versandinformationen
 */
export const shipments = pgTable('shipments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  carrier: varchar('carrier', { length: 100 }),
  service: varchar('service', { length: 100 }),
  status: varchar('status', { length: 50 }).default('pending'), // pending, shipped, in_transit, delivered, exception
  shippedAt: timestamp('shipped_at'),
  estimatedDeliveryAt: timestamp('estimated_delivery_at'),
  deliveredAt: timestamp('delivered_at'),
  trackingUrl: varchar('tracking_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  orderIdx: index('shipments_order_idx').on(table.orderId),
  trackingIdx: index('shipments_tracking_idx').on(table.trackingNumber),
  statusIdx: index('shipments_status_idx').on(table.status)
}));

// ========================
// INVENTAR
// ========================

/**
 * Tabelle: Inventory
 * Lagerbestand
 */
export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  variantId: integer('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }).notNull().unique(),
  quantityOnHand: integer('quantity_on_hand').default(0),
  quantityReserved: integer('quantity_reserved').default(0),
  quantityAvailable: integer('quantity_available').default(0),
  reorderPoint: integer('reorder_point').default(5),
  reorderQuantity: integer('reorder_quantity').default(10),
  lastRestockedAt: timestamp('last_restocked_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  variantIdx: index('inventory_variant_idx').on(table.variantId),
  availableIdx: index('inventory_available_idx').on(table.quantityAvailable)
}));

// ========================
// KI & AUTOMATISIERUNG
// ========================

/**
 * Tabelle: AiStyleCreatorTasks
 * KI Style Creator Aufgaben
 */
export const aiStyleCreatorTasks = pgTable('ai_style_creator_tasks', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }),
  taskType: varchar('task_type', { length: 50 }).notNull(), // image_enhancement, description_generation, tag_suggestion
  status: varchar('status', { length: 50 }).default('pending'), // pending, processing, completed, failed, approved, rejected
  inputData: json('input_data'),
  outputData: json('output_data'),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  processingStartedAt: timestamp('processing_started_at'),
  processingCompletedAt: timestamp('processing_completed_at'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  productIdx: index('ai_tasks_product_idx').on(table.productId),
  statusIdx: index('ai_tasks_status_idx').on(table.status),
  typeIdx: index('ai_tasks_type_idx').on(table.taskType)
}));

// ========================
// DSGVO & AUDIT
// ========================

/**
 * Tabelle: AuditLogs
 * Audit-Protokoll für DSGVO-Compliance
 */
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // customer, order, product, user
  entityId: integer('entity_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(), // create, update, delete, view, export
  performedBy: integer('performed_by').references(() => users.id),
  performedByEmail: varchar('performed_by_email', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  changes: json('changes'), // vor/nach Daten
  reason: text('reason'),
  gdprLegalBasis: varchar('gdpr_legal_basis', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  entityIdx: index('audit_entity_idx').on(table.entityType, table.entityId),
  actionIdx: index('audit_action_idx').on(table.action),
  performedByIdx: index('audit_performed_by_idx').on(table.performedBy),
  createdAtIdx: index('audit_created_at_idx').on(table.createdAt)
}));

/**
 * Tabelle: DataProcessingActivities
 * DSGVO Verarbeitungstätigkeiten
 */
export const dataProcessingActivities = pgTable('data_processing_activities', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  activityType: varchar('activity_type', { length: 100 }).notNull(),
  legalBasis: varchar('legal_basis', { length: 100 }).notNull(),
  dataCategories: json('data_categories').$type<string[]>(),
  processingPurpose: text('processing_purpose').notNull(),
  retentionPeriod: varchar('retention_period', { length: 100 }),
  thirdPartyRecipients: json('third_party_recipients').$type<string[]>(),
  consentGiven: boolean('consent_given').default(false),
  consentWithdrawn: boolean('consent_withdrawn').default(false),
  consentTimestamp: timestamp('consent_timestamp'),
  withdrawalTimestamp: timestamp('withdrawal_timestamp'),
  dataRetentionUntil: timestamp('data_retention_until'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  customerIdx: index('dpa_customer_idx').on(table.customerId),
  activityIdx: index('dpa_activity_idx').on(table.activityType),
  retentionIdx: index('dpa_retention_idx').on(table.dataRetentionUntil)
}));

// ========================
// RELATIONS DEFINITIONEN
// ========================

// Categories Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id]
  }),
  children: many(categories),
  productCategories: many(productCategories)
}));

// Collections Relations
export const collectionsRelations = relations(collections, ({ many }) => ({
  productCollections: many(productCollections)
}));

// Products Relations
export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  categories: many(productCategories),
  collections: many(productCollections),
  media: many(media),
  orderItems: many(orderItems),
  aiTasks: many(aiStyleCreatorTasks)
}));

// Product Variants Relations
export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id]
  }),
  inventory: one(inventory),
  orderItems: many(orderItems)
}));

// Product Categories Relations
export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, {
    fields: [productCategories.productId],
    references: [products.id]
  }),
  category: one(categories, {
    fields: [productCategories.categoryId],
    references: [categories.id]
  })
}));

// Product Collections Relations
export const productCollectionsRelations = relations(productCollections, ({ one }) => ({
  product: one(products, {
    fields: [productCollections.productId],
    references: [products.id]
  }),
  collection: one(collections, {
    fields: [productCollections.collectionId],
    references: [collections.id]
  })
}));

// Media Relations
export const mediaRelations = relations(media, ({ one }) => ({
  product: one(products, {
    fields: [media.productId],
    references: [products.id]
  })
}));

// Users Relations
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  auditLogs: many(auditLogs),
  approvedAiTasks: many(aiStyleCreatorTasks)
}));

// Roles Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles)
}));

// User Roles Relations
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id]
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id]
  })
}));

// Customers Relations
export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(customerAddresses),
  orders: many(orders),
  dataProcessingActivities: many(dataProcessingActivities)
}));

// Customer Addresses Relations
export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.id]
  })
}));

// Orders Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id]
  }),
  items: many(orderItems),
  payments: many(payments),
  shipments: many(shipments)
}));

// Order Items Relations
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id]
  })
}));

// Payments Relations
export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id]
  })
}));

// Shipments Relations
export const shipmentsRelations = relations(shipments, ({ one }) => ({
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id]
  })
}));

// Inventory Relations
export const inventoryRelations = relations(inventory, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventory.variantId],
    references: [productVariants.id]
  })
}));

// AI Style Creator Tasks Relations
export const aiStyleCreatorTasksRelations = relations(aiStyleCreatorTasks, ({ one }) => ({
  product: one(products, {
    fields: [aiStyleCreatorTasks.productId],
    references: [products.id]
  }),
  approver: one(users, {
    fields: [aiStyleCreatorTasks.approvedBy],
    references: [users.id]
  })
}));

// Audit Logs Relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  performer: one(users, {
    fields: [auditLogs.performedBy],
    references: [users.id]
  })
}));

// Data Processing Activities Relations
export const dataProcessingActivitiesRelations = relations(dataProcessingActivities, ({ one }) => ({
  customer: one(customers, {
    fields: [dataProcessingActivities.customerId],
    references: [customers.id]
  })
}));
