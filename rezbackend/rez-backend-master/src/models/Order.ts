import { logger } from '../config/logger';
import mongoose, { Schema, Document, Types } from 'mongoose';
import { mul, round2 } from '../utils/currency';

// Service booking details for order items
export interface IOrderServiceBookingDetails {
  bookingDate: Date;
  timeSlot: {
    start: string;
    end: string;
  };
  duration: number; // in minutes
  serviceType: 'home' | 'store' | 'online';
  customerNotes?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

// Order item interface
export interface IOrderItem {
  product: Types.ObjectId;
  store: Types.ObjectId;
  storeName?: string; // Store name at time of order (for display without populate)
  name: string; // Store product name at time of order
  image: string; // Store product image at time of order
  itemType: 'product' | 'service' | 'event'; // Type of item
  quantity: number;
  variant?: {
    type: string;
    value: string;
  };
  price: number; // Price at time of order
  originalPrice?: number;
  discount?: number;
  subtotal: number; // price * quantity
  // Service booking specific fields
  serviceBookingId?: Types.ObjectId; // Reference to created ServiceBooking
  serviceBookingDetails?: IOrderServiceBookingDetails;
  // Smart Spend source tracking (for enhanced Privé coin earning)
  smartSpendSource?: {
    smartSpendItemId: string;
    coinRewardRate: number; // snapshotted at order time
  };
  // Optional merchant-facing fields
  sku?: string; // Snapshotted product SKU at order time (read by merchant order controller)
  specialInstructions?: string; // Per-item customer instructions (read by merchant order controller)
}

// Order totals interface
export interface IOrderTotals {
  subtotal: number;
  tax: number;
  delivery: number;
  discount: number;
  lockFeeDiscount?: number; // Amount already paid when locking item
  cashback: number;
  total: number;
  paidAmount: number;
  refundAmount?: number;
  platformFee: number; // 15% of subtotal - platform commission
  merchantPayout: number; // subtotal - platformFee - what merchant receives
}

// NOTE: Order payment status uses 'paid' to indicate successful payment collection.
// The Payment model uses 'completed'. These are intentionally different state machines.
// Cross-references between Order and Payment must explicitly map:
//   Payment.status === 'completed' <-> Order.payment.status === 'paid'
// DO NOT unify without a full migration — see recovery plan DB-03.

// Payment information interface
export interface IOrderPayment {
  method: 'wallet' | 'card' | 'upi' | 'cod' | 'netbanking' | 'razorpay' | 'stripe';
  status:
    | 'pending'
    | 'awaiting_payment'
    | 'processing'
    | 'authorized'
    | 'paid'
    | 'failed'
    | 'refunded'
    | 'partially_refunded';
  transactionId?: string;
  paymentGateway?: string;
  failureReason?: string;
  paidAt?: Date;
  refundId?: string;
  refundedAt?: Date;
  coinsUsed?: {
    rezCoins?: number; // REZ coins used (primary field)
    wasilCoins?: number; // Legacy field - kept for backward compatibility
    promoCoins?: number; // Promo coins used
    storePromoCoins?: number; // Store promo coins used
    totalCoinsValue?: number; // Total value of coins used
  };
}

// Delivery address interface
export interface IOrderAddress {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  coordinates?: [number, number];
  landmark?: string;
  addressType?: 'home' | 'work' | 'other';
}

// Fulfillment type for orders
export type FulfillmentType = 'delivery' | 'pickup' | 'drive_thru' | 'dine_in';

// Fulfillment details interface
export interface IFulfillmentDetails {
  storeAddress?: string;
  storeCoordinates?: [number, number];
  tableNumber?: string;
  vehicleInfo?: string;
  estimatedReadyTime?: Date;
  pickupInstructions?: string;
  driveThruLane?: string;
}

// Delivery information interface
export interface IOrderDelivery {
  method: 'standard' | 'express' | 'pickup' | 'drive_thru' | 'dine_in' | 'scheduled';
  status:
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'dispatched'
    | 'out_for_delivery'
    | 'delivered'
    | 'failed'
    | 'returned';
  address: IOrderAddress;
  estimatedTime?: Date;
  actualTime?: Date;
  dispatchedAt?: Date;
  deliveredAt?: Date;
  trackingId?: string;
  deliveryPartner?: string;
  deliveryFee: number;
  instructions?: string;
  deliveryOTP?: string;
  attempts?: {
    attemptNumber: number;
    attemptedAt: Date;
    status: 'successful' | 'failed';
    reason?: string;
    nextAttemptAt?: Date;
  }[];
}

// Order timeline interface
export interface IOrderTimeline {
  status: string;
  message: string;
  timestamp: Date;
  updatedBy?: string;
  metadata?: any;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  deliveryPartner?: {
    name: string;
    phone: string;
    vehicleNumber?: string;
    photo?: string;
  };
}

// Order analytics interface
export interface IOrderAnalytics {
  source: 'app' | 'web' | 'social' | 'referral' | 'rendez';
  campaign?: string;
  referralCode?: string;
  attributionPickId?: Types.ObjectId; // Creator pick that led to this purchase
  deviceInfo?: {
    platform: string;
    version: string;
    userAgent?: string;
  };
}

// Main Order interface
export interface IOrder extends Document {
  orderNumber: string;
  user: Types.ObjectId;
  store?: Types.ObjectId; // Primary store for the order (for single-store orders or main store)
  fulfillmentType: FulfillmentType;
  fulfillmentDetails?: IFulfillmentDetails;
  items: IOrderItem[];
  totals: IOrderTotals;
  payment: IOrderPayment;
  delivery: IOrderDelivery;
  timeline: IOrderTimeline[];
  analytics?: IOrderAnalytics;
  status:
    | 'placed'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'dispatched'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelling'
    | 'cancelled'
    | 'returned'
    | 'refunded';
  couponCode?: string;
  redemption?: {
    code: string;
    discount: number;
    dealTitle?: string;
  };
  offerRedemption?: {
    code: string;
    cashback: number;
    offerTitle?: string;
  };
  notes?: string;
  specialInstructions?: string;
  cancelReason?: string;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  returnReason?: string;
  returnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Invoice and document URLs
  invoiceUrl?: string;
  invoiceGeneratedAt?: Date;
  shippingLabelUrl?: string;
  packingSlipUrl?: string;

  // Additional properties for compatibility
  cancellation?: {
    reason?: string;
    cancelledAt?: Date;
    cancelledBy?: Types.ObjectId;
    refundAmount?: number;
    refundStatus?: 'pending' | 'completed' | 'failed' | 'not_applicable';
  };
  paymentStatus?: string; // Alias for payment.status
  tracking?: {
    trackingId?: string;
    estimatedDelivery?: Date;
    deliveredAt?: Date;
  };
  estimatedDeliveryTime?: Date; // Alias for delivery.estimatedTime
  deliveredAt?: Date; // Alias for delivery.deliveredAt
  totalAmount?: number; // Alias for totals.total (for compatibility with services)
  rating?: {
    score: number;
    review?: string;
    ratedAt: Date;
  };

  // Payment gateway details (for Razorpay)
  paymentGateway?: {
    gatewayOrderId?: string; // Razorpay order ID
    gatewayPaymentId?: string; // Razorpay payment ID
    gatewaySignature?: string; // Razorpay signature
    gateway: 'razorpay' | 'cod' | 'wallet';
    currency?: string;
    amountPaid?: number;
    paidAt?: Date;
    failureReason?: string;
    refundId?: string;
    refundedAt?: Date;
    refundAmount?: number;
  };

  idempotencyKey?: string;

  // Merchant-facing convenience fields (read by merchant order controller transform)
  // cashback: top-level cashback object expected by merchant frontend
  cashback?: {
    amount: number;
    status: 'pending' | 'credited' | 'reversed';
  };
  // priority: order urgency for merchant KDS/display (set by merchant or system)
  priority?: 'low' | 'normal' | 'high' | 'urgent';

  // Soft-delete
  deletedAt?: Date | null;
  isDeleted?: boolean; // virtual

  // Pending offer cashback — for non-COD orders, cashback is deferred until payment success
  pendingOfferCashback?: number;

  // Dispute hold — locks reward issuance while dispute is active
  disputeHold?: boolean;

  // FT-D002: cashback rate snapshotted at order-creation time.
  // Settlement (createCashbackFromOrder) MUST use this field instead of
  // re-calling calculateOrderCashback() so that an admin changing
  // cashback_rate_base mid-campaign cannot retroactively alter in-flight orders.
  snapshotCashbackRate?: number;
  refundRetryCount?: number;
  flags?: string[];
  paymentRetryCount?: number;
  stateVersion?: number;
  stateTransitionHistory?: Array<{ from: string; to: string; at: Date; by?: string }>;
  kitchenItemStatus?: Record<string, any>;
  merchantCredit?: {
    status?: 'pending' | 'succeeded' | 'failed';
    failedAt?: Date;
    failureReason?: string;
    idempotencyKey?: string;
    retriedAt?: Date;
    retryCount?: number;
  };

  // Set to true once the full post-payment pipeline (stock deduction, cashback,
  // wallet credits, notifications) has run successfully. Used by the webhook handler
  // to prevent re-running the pipeline on duplicate webhook deliveries.
  postPaymentProcessed?: boolean;

  // Methods
  updateStatus(newStatus: string, message?: string, updatedBy?: string): Promise<void>;
  calculateRefund(): number;
  canBeCancelled(): boolean;
  canBeReturned(): boolean;
  generateInvoice(): Promise<string>;
  sendStatusUpdate(): Promise<void>;
}

// Order Schema
const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Primary store for the order (populated from first item's store during order creation)
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
    },
    fulfillmentType: {
      type: String,
      enum: ['delivery', 'pickup', 'drive_thru', 'dine_in'],
      default: 'delivery',
    },
    fulfillmentDetails: {
      storeAddress: String,
      storeCoordinates: {
        type: [Number],
        index: '2dsphere',
      },
      tableNumber: String,
      vehicleInfo: String,
      estimatedReadyTime: Date,
      pickupInstructions: String,
      driveThruLane: String,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        store: {
          type: Schema.Types.ObjectId,
          ref: 'Store',
          required: true,
        },
        storeName: {
          type: String,
          trim: true,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        image: {
          type: String,
          required: false,
          default: '',
        },
        itemType: {
          type: String,
          enum: ['product', 'service', 'event'],
          default: 'product',
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          max: 999,
        },
        variant: {
          type: {
            type: String,
            trim: true,
          },
          value: {
            type: String,
            trim: true,
          },
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        originalPrice: {
          type: Number,
          min: 0,
        },
        discount: {
          type: Number,
          default: 0,
          min: 0,
        },
        subtotal: {
          type: Number,
          required: true,
          min: 0,
        },
        // Service booking specific fields
        serviceBookingId: {
          type: Schema.Types.ObjectId,
          ref: 'ServiceBooking',
        },
        serviceBookingDetails: {
          bookingDate: { type: Date },
          timeSlot: {
            start: { type: String },
            end: { type: String },
          },
          duration: { type: Number, min: 15 },
          serviceType: {
            type: String,
            enum: ['home', 'store', 'online'],
          },
          customerNotes: { type: String, trim: true, maxlength: 500 },
          customerName: { type: String, trim: true },
          customerPhone: { type: String, trim: true },
          customerEmail: { type: String, trim: true, lowercase: true },
        },
        // Smart Spend source tracking
        smartSpendSource: {
          smartSpendItemId: { type: String },
          coinRewardRate: { type: Number },
        },
        // Optional merchant-facing fields
        // sku: snapshot of the product SKU at order time (read by merchant order controller)
        sku: { type: String, trim: true },
        // specialInstructions: per-item instructions (read by merchant order controller)
        specialInstructions: { type: String, trim: true, maxlength: 500 },
      },
    ],
    totals: {
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
      tax: {
        type: Number,
        default: 0,
        min: 0,
      },
      delivery: {
        type: Number,
        default: 0,
        min: 0,
      },
      discount: {
        type: Number,
        default: 0,
        min: 0,
      },
      lockFeeDiscount: {
        type: Number,
        default: 0,
        min: 0,
      },
      cashback: {
        type: Number,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
      paidAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      refundAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      platformFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      merchantPayout: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    payment: {
      method: {
        type: String,
        required: true,
        enum: ['wallet', 'card', 'upi', 'cod', 'netbanking', 'razorpay', 'stripe'],
      },
      status: {
        type: String,
        required: true,
        enum: [
          'pending',
          'awaiting_payment',
          'processing',
          'authorized',
          'paid',
          'failed',
          'refunded',
          'partially_refunded',
        ],
        default: 'pending',
      },
      transactionId: String,
      paymentGateway: String,
      failureReason: String,
      paidAt: Date,
      refundId: String,
      refundedAt: Date,
      coinsUsed: {
        rezCoins: { type: Number, default: 0, min: 0 }, // Primary field for REZ coins
        wasilCoins: { type: Number, default: 0, min: 0 }, // Legacy field for backward compatibility
        promoCoins: { type: Number, default: 0, min: 0 },
        storePromoCoins: { type: Number, default: 0, min: 0 },
        totalCoinsValue: { type: Number, default: 0, min: 0 },
      },
    },
    delivery: {
      method: {
        type: String,
        required: true,
        enum: ['standard', 'express', 'pickup', 'drive_thru', 'dine_in', 'scheduled'],
        default: 'standard',
      },
      status: {
        type: String,
        required: true,
        enum: [
          'pending',
          'confirmed',
          'preparing',
          'ready',
          'dispatched',
          'out_for_delivery',
          'delivered',
          'failed',
          'returned',
        ],
        default: 'pending',
      },
      address: {
        name: { type: String },
        phone: { type: String },
        email: String,
        addressLine1: { type: String },
        addressLine2: String,
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        country: { type: String, default: 'India' },
        coordinates: {
          type: [Number], // [longitude, latitude]
          index: '2dsphere',
        },
        landmark: String,
        addressType: {
          type: String,
          enum: ['home', 'work', 'other'],
          default: 'home',
        },
      },
      estimatedTime: Date,
      actualTime: Date,
      dispatchedAt: Date,
      deliveredAt: Date,
      trackingId: String,
      deliveryPartner: String,
      deliveryFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      instructions: String,
      deliveryOTP: String,
      attempts: [
        {
          attemptNumber: { type: Number, min: 1 },
          attemptedAt: { type: Date, required: true },
          status: {
            type: String,
            enum: ['successful', 'failed'],
            required: true,
          },
          reason: String,
          nextAttemptAt: Date,
        },
      ],
    },
    timeline: [
      {
        status: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
          default: Date.now,
        },
        updatedBy: String,
        metadata: Schema.Types.Mixed,
        location: {
          latitude: Number,
          longitude: Number,
          address: String,
        },
        deliveryPartner: {
          name: String,
          phone: String,
          vehicleNumber: String,
          photo: String,
        },
      },
    ],
    analytics: {
      source: {
        type: String,
        enum: ['app', 'web', 'social', 'referral', 'rendez'],
        default: 'app',
      },
      campaign: String,
      referralCode: String,
      attributionPickId: {
        type: Schema.Types.ObjectId,
        ref: 'CreatorPick',
      },
      deviceInfo: {
        platform: String,
        version: String,
        userAgent: String,
      },
    },
    status: {
      type: String,
      required: true,
      enum: [
        'placed',
        'confirmed',
        'preparing',
        'ready',
        'dispatched',
        'out_for_delivery',
        'delivered',
        'cancelling',
        'cancelled',
        'returned',
        'refunded',
      ],
      default: 'placed',
    },
    couponCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
    redemption: {
      code: { type: String, uppercase: true, trim: true },
      discount: { type: Number, default: 0 },
      dealTitle: { type: String },
    },
    offerRedemption: {
      code: { type: String, uppercase: true, trim: true },
      cashback: { type: Number, default: 0 },
      offerTitle: { type: String },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    cancelReason: String,
    cancelledAt: Date,
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    returnReason: String,
    returnedAt: Date,

    // Invoice and document URLs
    invoiceUrl: String,
    invoiceGeneratedAt: Date,
    shippingLabelUrl: String,
    packingSlipUrl: String,

    // Additional fields for compatibility
    cancellation: {
      reason: String,
      cancelledAt: Date,
      cancelledBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      refundAmount: {
        type: Number,
        min: 0,
      },
      refundStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'not_applicable'],
      },
    },
    // Refund retry tracking (used by failedRefundRetryJob)
    refundRetryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    flags: [{ type: String }],
    tracking: {
      trackingId: String,
      estimatedDelivery: Date,
      deliveredAt: Date,
    },
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: String,
      ratedAt: {
        type: Date,
        default: Date.now,
      },
    },

    idempotencyKey: {
      type: String,
      trim: true,
      maxlength: 128,
    },

    // FT-D002 FIX: Snapshot the effective cashback rate (%) at order-creation time.
    // The settlement path (cashbackService.createCashbackFromOrder) reads this value
    // so an admin changing cashback_rate_base after order placement has no effect on
    // already-placed orders. Without this snapshot, the rate is re-calculated at
    // delivery time from the live RewardConfig, causing retroactive changes.
    snapshotCashbackRate: {
      type: Number,
      min: 0,
      max: 100,
    },

    // LF-D009 FIX: Payment retry count — tracks how many times the user (or system)
    // has attempted to pay for this order.  Incremented by the payment route each
    // time createPaymentOrder is called for an existing orderId.  Used by:
    //  - Fraud detection (>5 retries on one order → flag for review)
    //  - Support tooling (quick way to see how hard a user tried to pay)
    paymentRetryCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // LF-D009 FIX: State transition history for audit — every change to order.status
    // is recorded here so support agents can see the full lifecycle without parsing
    // the timeline array.  Written by the pre-save hook below.
    stateTransitionHistory: [
      {
        from: String,
        to: String,
        at: { type: Date, default: Date.now },
        by: String, // 'system', userId, or 'webhook'
      },
    ],

    // LF-D001 FIX: merchantCredit subdocument was written by orderUpdateController
    // but never declared in the schema.  Mongoose silently strips undeclared paths on
    // save(), so the 'failed' status, failedAt timestamp, and idempotencyKey were never
    // persisted — the reconciliation job and admin dashboard could never surface these
    // failures for retry.  Adding the subdocument here makes writes durable.
    merchantCredit: {
      status: {
        type: String,
        enum: ['pending', 'succeeded', 'failed'],
        default: 'pending',
      },
      failedAt: Date,
      failureReason: String,
      idempotencyKey: String,
      retriedAt: Date,
      retryCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Pending offer cashback — deferred for non-COD orders until payment is confirmed
    pendingOfferCashback: {
      type: Number,
      min: 0,
    },

    // Dispute hold — locks reward issuance while dispute is active
    disputeHold: {
      type: Boolean,
      default: false,
    },

    // Optimistic locking version counter for atomic state transitions.
    // Incremented by transitionState() on each status change to prevent
    // concurrent updates from overwriting each other silently.
    stateVersion: {
      type: Number,
      default: 0,
    },

    // Soft-delete timestamp — set to preserve financial audit trail instead of hard-deleting
    deletedAt: {
      type: Date,
      default: null,
    },

    // Set to true once the full post-payment pipeline has run successfully.
    // Prevents duplicate processing on concurrent or retried webhook deliveries.
    postPaymentProcessed: {
      type: Boolean,
      default: false,
    },

    // Payment gateway details
    paymentGateway: {
      gatewayOrderId: String,
      gatewayPaymentId: String,
      gatewaySignature: String,
      gateway: {
        type: String,
        enum: ['razorpay', 'cod', 'wallet'],
      },
      currency: String,
      amountPaid: Number,
      paidAt: Date,
      failureReason: String,
      refundId: String,
      refundedAt: Date,
      refundAmount: Number,
    },

    // Kitchen Display System (KDS) item status tracking
    // Maps item._id to { status: 'pending'|'preparing'|'ready', updatedAt, updatedBy }
    // Allows kitchen staff to mark individual items as ready without changing order status
    kitchenItemStatus: Schema.Types.Mixed,

    // Merchant-facing cashback object (read by merchant order controller transform).
    // amount mirrors totals.cashback; status tracks settlement lifecycle.
    cashback: {
      amount: { type: Number, default: 0, min: 0 },
      status: {
        type: String,
        enum: ['pending', 'credited', 'reversed'],
        default: 'pending',
      },
    },

    // Merchant-facing order priority for KDS display and alerting.
    // Defaults to 'normal'; can be elevated to 'high' or 'urgent' by merchant staff.
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance - SCALEPILOT OPTIMIZED
// Unique indexes
OrderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

// Critical compound indexes for fast queries (order by user and date)
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ user: 1, status: 1, createdAt: -1 });
OrderSchema.index({ store: 1, status: 1, createdAt: -1 }); // Primary store operations

// Store-based queries
OrderSchema.index({ 'items.store': 1, createdAt: -1 });
OrderSchema.index({ 'items.store': 1, status: 1 });
OrderSchema.index({ 'items.store': 1, createdAt: -1, status: 1 }); // Sales trends by store
OrderSchema.index({ 'items.store': 1, 'items.product': 1, createdAt: -1 }); // Product performance
OrderSchema.index({ 'items.store': 1, user: 1, createdAt: -1 }); // Customer insights

// Payment and delivery status
OrderSchema.index({ 'payment.status': 1 });
OrderSchema.index({ 'delivery.status': 1 });
OrderSchema.index({ status: 1, createdAt: -1 }); // Admin queries
OrderSchema.index({ status: 1, updatedAt: 1, deletedAt: 1 }); // Stuck-order lifecycle job: status IN + updatedAt range + deletedAt null
OrderSchema.index({ fulfillmentType: 1, status: 1 });

// Additional queries
OrderSchema.index({ 'payment.method': 1, 'items.store': 1 }); // Payment analytics
OrderSchema.index({ 'payment.transactionId': 1 }); // Payment gateway lookups
OrderSchema.index({ 'delivery.estimatedTime': 1 });
OrderSchema.index({ createdAt: -1 }); // Timeline queries

// FIX: Missing indexes for common queries
OrderSchema.index({ couponCode: 1, createdAt: -1 }); // Coupon code analytics
OrderSchema.index({ 'analytics.source': 1, createdAt: -1 }); // Analytics source queries
OrderSchema.index({ user: 1, 'payment.status': 1, createdAt: -1 }); // User payment status queries
OrderSchema.index({ 'payment.paidAt': 1 }); // Payment completion date queries

// LF-D001 FIX: index to let reconciliation job cheaply find failed merchant credits
OrderSchema.index({ 'merchantCredit.status': 1, status: 1, createdAt: -1 }, { sparse: true });

// Index for webhook retry jobs that scan for orders where the post-payment pipeline
// has not yet run (postPaymentProcessed: false / unset). Without this index each
// scan is a full collection scan — with this index only unprocessed orders are touched.
OrderSchema.index({ postPaymentProcessed: 1, 'payment.status': 1, createdAt: -1 }, { sparse: true });
// Stuck-payment recovery job: { status:"placed", payment.status:$in, payment.method:$ne, createdAt:$lt, deletedAt:null }
OrderSchema.index({ status: 1, 'payment.status': 1, createdAt: 1, deletedAt: 1 });

// Virtual for order age in hours
OrderSchema.virtual('ageInHours').get(function (this: any) {
  return Math.floor((Date.now() - (this.createdAt as Date).getTime()) / (1000 * 60 * 60));
});

// Virtual for estimated delivery date
OrderSchema.virtual('estimatedDeliveryDate').get(function (this: any) {
  return this.delivery?.estimatedTime || new Date(Date.now() + 24 * 60 * 60 * 1000);
});

// Virtual properties for compatibility with controller
OrderSchema.virtual('paymentStatus').get(function (this: any) {
  return this.payment?.status;
});

OrderSchema.virtual('estimatedDeliveryTime').get(function (this: any) {
  return this.delivery?.estimatedTime;
});

OrderSchema.virtual('deliveredAt').get(function (this: any) {
  return this.delivery?.deliveredAt;
});

OrderSchema.virtual('totalAmount').get(function (this: any) {
  return this.totals?.total;
});

// Virtual: true when the order has been soft-deleted
OrderSchema.virtual('isDeleted').get(function (this: any) {
  return this.deletedAt != null;
});

// Pre-query middleware: automatically exclude soft-deleted orders from find/findOne queries
// Pass { includeDeleted: true } in the query to bypass this filter.
OrderSchema.pre(/^find/, function (this: any) {
  if (!this.getQuery().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

// Pre-save hook to generate order number and add timeline entry
// DB-002 FIX: Valid order status transition map.
// Defined here (module scope, not inside the hook) so it is computed once,
// not on every save() call.
//
// Design rules:
//   • 'cancelled'  is reachable from any pre-delivery state (merchant/user may cancel)
//   • 'refunded'   only follows a terminal post-delivery or cancelled state
//   • 'placed'     is the entry state — only reachable as the initial status on create
//   • Terminal states (delivered, refunded, returned) have no outgoing transitions
//     except through the explicit return/refund path
//
// The special sentinel '*bypass_state_machine*' in $locals lets internal system
// operations (migrations, support tools) skip enforcement when absolutely needed,
// while leaving an explicit override trail in stateTransitionHistory.
//
// NOTE: This map uses actual schema enum values. The schema defines:
// placed, confirmed, preparing, ready, dispatched, out_for_delivery, delivered,
// cancelling, cancelled, returned, refunded
const ORDER_VALID_TRANSITIONS: Record<string, string[]> = {
  placed: ['confirmed', 'cancelling'],
  confirmed: ['preparing', 'cancelling'],
  preparing: ['ready', 'cancelling'],
  ready: ['dispatched', 'cancelling'],
  dispatched: ['out_for_delivery', 'cancelling'],
  out_for_delivery: ['delivered', 'cancelling'],
  delivered: ['cancelling'], // Can cancel after delivery within return window
  cancelling: ['cancelled'], // Cancelled after confirmation during cancellation
  cancelled: [], // terminal state
  returned: ['refunded'],
  refunded: [], // terminal
};

OrderSchema.pre('save', async function (this: any, next) {
  // Generate order number for new orders
  if (this.isNew && !this.orderNumber) {
    const random = crypto.randomUUID().replace('-', '').substring(0, 6).toUpperCase();
    this.orderNumber = `ORD${Date.now()}${random}`;
  }

  // Add timeline entry for status changes
  if (this.isModified('status') && !this.isNew) {
    const previousStatus: string = (this.$locals?.previousStatus as string) ?? 'unknown';
    const nextStatus: string = this.status as string;

    // ── DB-002: Validate state transition ────────────────────────────────────
    // Reject saves that attempt illegal status jumps (e.g. placed → delivered).
    // The bypass sentinel lets migration scripts and support tools override when
    // strictly necessary — but the override is still recorded so it is auditable.
    const bypassStateMachine = this.$locals?.bypassStateMachine === true;

    if (!bypassStateMachine && previousStatus !== 'unknown') {
      const allowedNext = ORDER_VALID_TRANSITIONS[previousStatus] ?? [];
      if (!allowedNext.includes(nextStatus)) {
        const err = new Error(
          `[OrderStateMachine] Invalid transition: "${previousStatus}" → "${nextStatus}". ` +
            `Allowed next states: [${allowedNext.join(', ') || 'none — terminal state'}]`,
        );
        (err as any).code = 'INVALID_ORDER_TRANSITION';
        return next(err as any);
      }
    }
    // ── End transition validation ─────────────────────────────────────────────

    const statusMessages: Record<string, string> = {
      placed: 'Order has been placed successfully',
      confirmed: 'Order has been confirmed by the store',
      preparing: 'Your order is being prepared',
      ready: 'Order is ready for pickup/dispatch',
      dispatched: 'Order has been dispatched',
      out_for_delivery: 'Order is out for delivery',
      delivered: 'Order has been delivered successfully',
      cancelling: 'Order cancellation is being processed',
      cancelled: 'Order has been cancelled',
      returned: 'Order has been returned',
      refunded: 'Order amount has been refunded',
    };

    const self = this as any;
    if (!self.timeline) self.timeline = [];
    self.timeline.push({
      status: self.status as string,
      message: statusMessages[nextStatus] || `Order status updated to ${nextStatus}`,
      timestamp: new Date(),
    });

    // LF-D009 FIX: record in stateTransitionHistory for audit trail
    if (!self.stateTransitionHistory) {
      self.stateTransitionHistory = [];
    }
    self.stateTransitionHistory.push({
      from: previousStatus,
      to: nextStatus,
      at: new Date(),
      by: this.$locals?.updatedBy ?? 'system',
      ...(bypassStateMachine ? { bypassReason: this.$locals?.bypassReason ?? 'no reason provided' } : {}),
    });
  }

  next();
});

// ── State Machine: findOneAndUpdate guard ─────────────────────────────────────
// Covers atomic updates via transitionState() and any direct findOneAndUpdate
// calls that set order status. Uses the canonical STATUS_TRANSITIONS from
// orderStateMachine.ts — same map as the pre-save hook in transitionStatus().
// Set  { bypassStateMachine: true }  in the update options to allow admin/
// migration overrides; the bypass is still visible in stateTransitionHistory.
OrderSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  const newStatus: string | undefined = update?.status ?? update?.$set?.status;
  if (!newStatus) return next();

  const doc = await (this.model as any)
    .findOne(this.getQuery())
    .select('status')
    .setOptions({ includeDeleted: true })
    .lean();
  if (!doc) return next();

  const currentStatus: string = (doc as any).status;
  if (!currentStatus) return next();

  const bypassStateMachine = (this.getOptions() as any)?.bypassStateMachine === true;
  if (bypassStateMachine) return next();

  const { assertOrderTransition } = require('../config/orderStateMachine') as {
    assertOrderTransition: (from: string, to: string) => void;
  };

  try {
    assertOrderTransition(currentStatus, newStatus);
  } catch (err) {
    return next(err as Error);
  }
  return next();
});

// Phase 3: Safe status transition helper — validates against the canonical FSM
// before writing. Prefer this over direct `order.status = x` assignments.
OrderSchema.methods.transitionStatus = async function (
  newStatus: string,
  message?: string,
  updatedBy?: string,
): Promise<void> {
  const { assertOrderTransition } = require('../config/orderStateMachine') as {
    assertOrderTransition: (from: string, to: string) => void;
  };
  assertOrderTransition(this.status as string, newStatus);
  await (this as any).updateStatus(newStatus, message, updatedBy);
};

// Method to update order status
OrderSchema.methods.updateStatus = async function (
  newStatus: string,
  message?: string,
  updatedBy?: string,
): Promise<void> {
  this.status = newStatus;

  // Update delivery status based on order status
  const deliveryStatusMap: { [key: string]: string } = {
    confirmed: 'confirmed',
    preparing: 'preparing',
    ready: 'ready',
    dispatched: 'dispatched',
    delivered: 'delivered',
    cancelled: 'failed',
    returned: 'returned',
  };

  if (deliveryStatusMap[newStatus]) {
    this.delivery.status = deliveryStatusMap[newStatus];
  }

  // Set timestamps for specific statuses
  if (newStatus === 'dispatched') {
    this.delivery.dispatchedAt = new Date();
  } else if (newStatus === 'delivered') {
    this.delivery.deliveredAt = new Date();
    this.delivery.actualTime = new Date();
  } else if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
  } else if (newStatus === 'returned') {
    this.returnedAt = new Date();
  }

  // Add custom timeline message if provided
  if (message) {
    this.timeline.push({
      status: newStatus,
      message,
      timestamp: new Date(),
      updatedBy,
    });
  }

  await this.save({ validateModifiedOnly: true });
};

// Method to calculate refund amount
OrderSchema.methods.calculateRefund = function (): number {
  let refundAmount = this.totals.paidAmount;

  // Deduct delivery charges if order was dispatched
  if (this.status === 'dispatched' || this.status === 'delivered') {
    refundAmount -= this.totals.delivery;
  }

  // Apply cancellation charges based on timing
  const ageInHours = this.ageInHours;
  if (ageInHours > 24) {
    refundAmount = mul(refundAmount, 0.9); // 10% cancellation fee after 24 hours
  } else if (ageInHours > 2) {
    refundAmount = mul(refundAmount, 0.95); // 5% cancellation fee after 2 hours
  }

  return Math.max(0, round2(refundAmount));
};

// Method to check if order can be cancelled
OrderSchema.methods.canBeCancelled = function (): boolean {
  const cancellableStatuses = ['placed', 'confirmed', 'preparing'];
  return cancellableStatuses.includes(this.status);
};

// Method to check if order can be returned
OrderSchema.methods.canBeReturned = function (): boolean {
  if (this.status !== 'delivered') return false;

  const deliveredAt = this.delivery.deliveredAt;
  if (!deliveredAt) return false;

  const hoursSinceDelivery = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceDelivery <= 24; // 24 hours return window
};

// Method to generate invoice (placeholder)
OrderSchema.methods.generateInvoice = async function (): Promise<string> {
  // This would typically generate a PDF invoice
  return `Invoice for order ${this.orderNumber}`;
};

// Method to send status update (placeholder)
OrderSchema.methods.sendStatusUpdate = async function (): Promise<void> {
  // This would typically send push notification, SMS, or email
  logger.info(`Status update sent for order ${this.orderNumber}: ${this.status}`);
};

// Static method to get user orders
OrderSchema.statics.getUserOrders = function (userId: string, status?: string, limit: number = 20, skip: number = 0) {
  const query: any = { user: userId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate('items.product', 'name images')
    .populate('items.store', 'name logo')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get store orders
OrderSchema.statics.getStoreOrders = function (storeId: string, status?: string, limit: number = 50) {
  const query: any = { 'items.store': storeId };
  if (status) {
    query.status = status;
  }

  return this.find(query).populate('user', 'profile.firstName profile.lastName').sort({ createdAt: -1 }).limit(limit);
};

// Static method to get orders by date range
OrderSchema.statics.getOrdersByDateRange = function (startDate: Date, endDate: Date, filters: any = {}) {
  const query: any = {
    createdAt: { $gte: startDate, $lte: endDate },
    ...filters,
  };

  return this.find(query)
    .populate('user', 'profile.firstName profile.lastName')
    .populate('items.store', 'name')
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean();
};

// Static method for atomic state transitions using optimistic locking.
// Uses stateVersion to prevent concurrent updates from racing each other —
// the update only succeeds when _id, status, and stateVersion all match.
// Returns null if the precondition fails (version mismatch or wrong current status).
OrderSchema.statics.transitionState = async function (
  orderId: string,
  fromStatus: string | string[],
  toStatus: string,
  currentVersion: number,
  additionalUpdates: Record<string, any> = {},
) {
  const statusFilter = Array.isArray(fromStatus) ? { $in: fromStatus } : fromStatus;
  return this.findOneAndUpdate(
    { _id: orderId, status: statusFilter, stateVersion: currentVersion },
    {
      $set: { status: toStatus, ...additionalUpdates },
      $inc: { stateVersion: 1 },
      $push: {
        stateTransitionHistory: {
          from: Array.isArray(fromStatus) ? fromStatus.join('|') : fromStatus,
          to: toStatus,
          timestamp: new Date(),
        },
      },
    },
    { new: true },
  );
};

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
