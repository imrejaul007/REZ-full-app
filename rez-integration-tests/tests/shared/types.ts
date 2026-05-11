// Shared types for all REZ services

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  port: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  status: number;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateEntityDto {
  name?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UpdateEntityDto {
  name?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AuthCredentials {
  apiKey?: string;
  token?: string;
  username?: string;
  password?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version?: string;
  dependencies?: Record<string, 'up' | 'down'>;
}

export interface TestData {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

// Service-specific types
export interface DeliveryOrder {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  customerId: string;
  address: Address;
  items: DeliveryItem[];
  estimatedDelivery?: string;
  actualDelivery?: string;
  driver?: DriverInfo;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'failed';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DeliveryItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  vehicle?: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, unknown>;
  timestamp: string;
  source: string;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  type: 'realtime' | 'batch' | 'scheduled';
  metrics: string[];
  filters?: Record<string, unknown>;
  dateRange: {
    start: string;
    end: string;
  };
  results?: Record<string, unknown>;
  generatedAt: string;
}

export interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: PaymentLinkStatus;
  description?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
  maxUses?: number;
  usesRemaining?: number;
  checkoutUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentLinkStatus = 'active' | 'expired' | 'exhausted' | 'cancelled';

export interface PaymentTransaction {
  id: string;
  paymentLinkId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  customerEmail?: string;
  customerPhone?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Journey {
  id: string;
  name: string;
  description?: string;
  trigger: JourneyTrigger;
  steps: JourneyStep[];
  status: 'active' | 'paused' | 'completed' | 'archived';
  stats?: JourneyStats;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyTrigger {
  type: 'event' | 'schedule' | 'manual' | 'condition';
  config: Record<string, unknown>;
}

export interface JourneyStep {
  id: string;
  type: 'email' | 'sms' | 'push' | 'delay' | 'condition' | 'webhook' | 'attribute';
  config: Record<string, unknown>;
  order: number;
}

export interface JourneyStats {
  enrolled: number;
  completed: number;
  dropped: number;
  conversionRate?: number;
}

export interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  conditions?: AutomationCondition[];
  status: 'active' | 'inactive' | 'draft';
  executionCount?: number;
  lastExecuted?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationTrigger {
  type: string;
  event?: string;
  schedule?: string;
}

export interface AutomationAction {
  id: string;
  type: string;
  config: Record<string, unknown>;
  order: number;
}

export interface AutomationCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface GDPRRequest {
  id: string;
  type: 'access' | 'deletion' | 'portability' | 'rectification' | 'restriction';
  userId: string;
  email: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'expired';
  dataCategories: string[];
  requestedAt: string;
  completedAt?: string;
  expiresAt: string;
  notes?: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  type: 'format' | 'range' | 'custom' | 'schema' | 'business';
  field: string;
  operator?: string;
  value?: unknown;
  config?: Record<string, unknown>;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface Cohort {
  id: string;
  name: string;
  description?: string;
  criteria: CohortCriteria[];
  logic: 'and' | 'or';
  memberCount?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CohortCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: unknown;
}

export interface CohortMember {
  id: string;
  cohortId: string;
  userId: string;
  attributes?: Record<string, unknown>;
  addedAt: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  exchangeRate?: number;
  isBaseCurrency?: boolean;
  isActive: boolean;
  updatedAt?: string;
}

export interface CurrencyConversion {
  from: string;
  to: string;
  rate: number;
  amount: number;
  convertedAmount: number;
  timestamp: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  issuedDate: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'overdue'
  | 'paid'
  | 'partially_paid'
  | 'cancelled'
  | 'refunded';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  total: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  tags?: string[];
  availability: MenuItemAvailability;
  modifiers?: MenuModifier[];
  images?: string[];
  metadata?: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type MenuItemAvailability = 'available' | 'unavailable' | 'limited';

export interface MenuModifier {
  id: string;
  name: string;
  options: MenuModifierOption[];
  required: boolean;
  multiSelect: boolean;
  min?: number;
  max?: number;
}

export interface MenuModifierOption {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: string;
  transactionId: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  reason: string;
  reasonCode?: string;
  status: RefundStatus;
  refundMethod: 'original' | 'manual' | 'store_credit';
  initiatedBy: string;
  processedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type RefundStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'rejected'
  | 'cancelled';

export interface TrackingEvent {
  id: string;
  trackingId: string;
  status: string;
  description: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TrackingInfo {
  id: string;
  referenceId: string;
  referenceType: 'order' | 'shipment' | 'delivery';
  carrier?: string;
  trackingNumber?: string;
  status: TrackingStatus;
  events: TrackingEvent[];
  estimatedDelivery?: string;
  lastUpdated: string;
  createdAt: string;
}

export type TrackingStatus =
  | 'pending'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned'
  | 'cancelled';
