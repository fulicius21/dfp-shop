/**
 * TypeScript Type Definitionen für DressForPleasure Backend
 * 
 * Diese Datei enthält alle notwendigen Typen für:
 * - API Requests/Responses
 * - Datenbankmodelle
 * - Authentifizierung
 * - DSGVO-Compliance
 */

import { Request } from 'express';
import * as schema from '../db/schema';

// ========================
// AUTHENTIFIZIERUNG
// ========================

export interface AuthenticatedUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: Omit<AuthenticatedUser, 'permissions'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ========================
// API RESPONSES
// ========================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  q?: string;
  category?: string;
  collection?: string;
  featured?: boolean;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
}

// ========================
// PRODUKTE
// ========================

export interface ProductColor {
  name: string;
  value: string; // Hex color code
  code: string;  // Short code (e.g., 'black', 'white')
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
}

export interface CreateProductRequest {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  originalPrice?: number;
  discount?: number;
  sku?: string;
  material?: string;
  careInstructions?: string;
  sustainabilityInfo?: string;
  tags?: string[];
  sizes?: string[];
  colors?: ProductColor[];
  status?: 'draft' | 'active' | 'archived';
  featured?: boolean;
  newArrival?: boolean;
  bestseller?: boolean;
  weight?: number;
  dimensions?: ProductDimensions;
  seoTitle?: string;
  seoDescription?: string;
  categoryIds?: number[];
  collectionIds?: number[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: number;
}

export interface ProductVariantRequest {
  productId: number;
  sku: string;
  size?: string;
  color?: string;
  colorCode?: string;
  price: number;
  stock: number;
  lowStockThreshold?: number;
  weight?: number;
  isActive?: boolean;
}

export interface ProductResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  basePrice: string;
  originalPrice?: string;
  discount: number;
  sku?: string;
  material?: string;
  careInstructions?: string;
  sustainabilityInfo?: string;
  tags?: string[];
  sizes?: string[];
  colors?: ProductColor[];
  status: string;
  featured: boolean;
  newArrival: boolean;
  bestseller: boolean;
  weight?: string;
  dimensions?: ProductDimensions;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  variants?: ProductVariantResponse[];
  categories?: CategoryResponse[];
  collections?: CollectionResponse[];
  media?: MediaResponse[];
}

export interface ProductVariantResponse {
  id: number;
  productId: number;
  sku: string;
  size?: string;
  color?: string;
  colorCode?: string;
  price: string;
  stock: number;
  lowStockThreshold: number;
  weight?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  inventory?: InventoryResponse;
}

// ========================
// KATEGORIEN & KOLLEKTIONEN
// ========================

export interface CategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  parentId?: number;
  sortOrder?: number;
  isActive?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  sortOrder: number;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  productCount?: number;
  children?: CategoryResponse[];
}

export interface CollectionRequest {
  name: string;
  slug?: string;
  description?: string;
  longDescription?: string;
  image?: string;
  featured?: boolean;
  season?: string;
  tags?: string[];
  sortOrder?: number;
  isActive?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CollectionResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  longDescription?: string;
  image?: string;
  featured: boolean;
  season?: string;
  tags?: string[];
  sortOrder: number;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  productCount?: number;
}

// ========================
// MEDIEN
// ========================

export interface MediaRequest {
  productId: number;
  type: 'image' | 'video';
  url: string;
  altText?: string;
  title?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface MediaResponse {
  id: number;
  productId: number;
  type: string;
  url: string;
  altText?: string;
  title?: string;
  sortOrder: number;
  isPrimary: boolean;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  createdAt: Date;
}

// ========================
// KUNDEN
// ========================

export interface CustomerRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  newsletterConsent?: boolean;
  marketingConsent?: boolean;
}

export interface CustomerResponse {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  newsletterConsent: boolean;
  marketingConsent: boolean;
  isActive: boolean;
  lastOrderAt?: Date;
  totalOrders: number;
  totalSpent: string;
  customerSince: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAddress {
  type: 'billing' | 'shipping';
  firstName: string;
  lastName: string;
  company?: string;
  streetAddress: string;
  streetAddress2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface CustomerAddressRequest extends CustomerAddress {
  customerId: number;
  isDefault?: boolean;
}

export interface CustomerAddressResponse extends CustomerAddress {
  id: number;
  customerId: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// BESTELLUNGEN
// ========================

export interface OrderItemRequest {
  productId: number;
  variantId?: number;
  quantity: number;
}

export interface CreateOrderRequest {
  customerEmail: string;
  customerId?: number;
  items: OrderItemRequest[];
  billingAddress: CustomerAddress;
  shippingAddress: CustomerAddress;
  notes?: string;
  paymentMethod?: string;
  discountCode?: string;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  customerId?: number;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currency: string;
  subtotal: string;
  taxAmount: string;
  shippingAmount: string;
  discountAmount: string;
  totalAmount: string;
  billingAddress: CustomerAddress;
  shippingAddress: CustomerAddress;
  notes?: string;
  tags?: string[];
  stripePaymentIntentId?: string;
  orderDate: Date;
  processedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemResponse[];
  payments?: PaymentResponse[];
  shipments?: ShipmentResponse[];
}

export interface OrderItemResponse {
  id: number;
  orderId: number;
  productId: number;
  variantId?: number;
  productName: string;
  productSku?: string;
  variantSku?: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  fulfillmentStatus: string;
  createdAt: Date;
}

// ========================
// ZAHLUNGEN
// ========================

export interface PaymentResponse {
  id: number;
  orderId: number;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  paymentMethod?: string;
  status: string;
  amount: string;
  currency: string;
  refundedAmount: string;
  processorFee?: string;
  metadata?: any;
  failureReason?: string;
  processedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

// ========================
// VERSAND
// ========================

export interface ShipmentRequest {
  orderId: number;
  trackingNumber?: string;
  carrier?: string;
  service?: string;
  estimatedDeliveryAt?: Date;
}

export interface ShipmentResponse {
  id: number;
  orderId: number;
  trackingNumber?: string;
  carrier?: string;
  service?: string;
  status: string;
  shippedAt?: Date;
  estimatedDeliveryAt?: Date;
  deliveredAt?: Date;
  trackingUrl?: string;
  createdAt: Date;
}

// ========================
// INVENTAR
// ========================

export interface InventoryResponse {
  id: number;
  variantId: number;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryUpdateRequest {
  variantId: number;
  quantityChange: number;
  reason: string;
  reference?: string;
}

// ========================
// KI STYLE CREATOR
// ========================

export interface AiStyleCreatorTaskRequest {
  productId: number;
  taskType: 'image_enhancement' | 'description_generation' | 'tag_suggestion';
  inputData: any;
}

export interface AiStyleCreatorTaskResponse {
  id: number;
  productId: number;
  taskType: string;
  status: string;
  inputData: any;
  outputData: any;
  approvedBy?: number;
  approvedAt?: Date;
  rejectionReason?: string;
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  createdAt: Date;
}

// ========================
// AUDIT & DSGVO
// ========================

export interface AuditLogEntry {
  entityType: string;
  entityId: number;
  action: string;
  performedBy?: number;
  performedByEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: any;
  reason?: string;
  gdprLegalBasis?: string;
}

export interface GDPRDataRequest {
  customerId: number;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  reason?: string;
  customerEmail: string;
}

export interface GDPRDataResponse {
  customerId: number;
  customerData: any;
  orders: OrderResponse[];
  addresses: CustomerAddressResponse[];
  processingActivities: any[];
  exportedAt: Date;
}

// ========================
// FILE UPLOAD
// ========================

export interface FileUploadResponse {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  cloudinaryId?: string;
}

// ========================
// HEALTH CHECK
// ========================

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  version: string;
  uptime: number;
  services: {
    database: {
      status: 'healthy' | 'unhealthy';
      message: string;
      responseTime?: number;
    };
    redis?: {
      status: 'healthy' | 'unhealthy';
      message: string;
      responseTime?: number;
    };
    stripe: {
      status: 'healthy' | 'unhealthy';
      message: string;
    };
  };
}

// ========================
// WEBHOOK PAYLOADS
// ========================

export interface WebhookPayload {
  event: string;
  timestamp: Date;
  data: any;
  signature?: string;
}

export interface ProductUpdateWebhook extends WebhookPayload {
  event: 'product.updated' | 'product.created' | 'product.deleted';
  data: {
    productId: number;
    slug: string;
    status: string;
  };
}

export interface OrderUpdateWebhook extends WebhookPayload {
  event: 'order.created' | 'order.updated' | 'order.paid' | 'order.shipped' | 'order.delivered';
  data: {
    orderId: number;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    fulfillmentStatus: string;
  };
}

// ========================
// UTILITY TYPES
// ========================

export type DatabaseResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type AsyncResult<T> = Promise<DatabaseResult<T>>;

// Re-export database schema types
export type {
  products as ProductModel,
  productVariants as ProductVariantModel,
  categories as CategoryModel,
  collections as CollectionModel,
  customers as CustomerModel,
  orders as OrderModel,
  orderItems as OrderItemModel,
  users as UserModel,
  roles as RoleModel
} from '../db/schema';
