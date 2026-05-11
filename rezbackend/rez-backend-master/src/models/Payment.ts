/**
 * DEPRECATED — CRITICAL-008 FIX
 *
 * This model is kept for READ-ONLY access to the payments collection.
 * ALL WRITES to the payments collection MUST go through rez-payment-service.
 *
 * The payments collection has a single authoritative writer (rez-payment-service).
 * The backend MUST NOT write to this collection directly.
 *
 * Read operations are still permitted (e.g., reconciliation, analytics, admin dashboard).
 * Any new write operations must be delegated to rez-payment-service via HTTP API:
 *   POST /api/payment/internal/wallet-credit  (for wallet credits)
 *   POST /api/payment/capture               (for payment capture)
 *   POST /api/payment/webhook/razorpay     (for Razorpay webhooks)
 *
 * See CRITICAL-008 for full context.
 */
import mongoose, { Document, Schema, Model } from 'mongoose';
import { assertValidTransition } from '../config/financialStateMachine';

export interface IPaymentModel extends Model<IPayment> {
  findActivePayments(userId: string): Promise<IPayment[]>;
  findByPaymentId(paymentId: string, userId: string): Promise<IPayment | null>;
  markCompleted(paymentId: string, expectedStatus: string | string[]): Promise<IPayment | null>;
  markFailed(paymentId: string, expectedStatus: string | string[]): Promise<IPayment | null>;
}

// NOTE: Payment model uses 'completed' to indicate a successful, settled payment.
// The Order model uses 'paid' for the same logical outcome (Order.payment.status === 'paid').
// These are intentionally different state machines.
// Cross-references between Order and Payment must explicitly map:
//   Payment.status === 'completed' <-> Order.payment.status === 'paid'
// DO NOT unify without a full migration — see recovery plan DB-03.

export interface IPayment extends Document {
  paymentId: string;
  orderId: string;
  user: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentMethodId?: string;
  purpose: 'wallet_topup' | 'order_payment' | 'event_booking' | 'financial_service' | 'other';
  status:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'expired'
    | 'refund_initiated'
    | 'refund_processing'
    | 'refunded'
    | 'refund_failed';
  userDetails: {
    name?: string;
    email?: string;
    phone?: string;
  };
  /**
   * Freeform gateway metadata.
   *
   * Recognised keys used by idempotency guards:
   *   razorpayOrderId  — Razorpay order_id stamped at payment creation
   *   stripeWebhookId  — Stripe Event ID (evt_xxx) for dedup on activation
   *   paypalOrderId    — PayPal Order ID for dedup on activation
   */
  metadata: Record<string, any> & {
    razorpayOrderId?: string;
    stripeWebhookId?: string;
    paypalOrderId?: string;
  };
  gatewayResponse?: {
    gateway: string;
    transactionId?: string;
    paymentUrl?: string;
    qrCode?: string;
    upiId?: string;
    expiryTime?: Date;
    timestamp: Date;
    [key: string]: any;
  };
  failureReason?: string;
  walletCredited?: boolean;
  walletCreditedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  expiresAt?: Date; // BUG 2 FIX: Optional — completed payments must NOT be TTL-deleted
  refundedAmount?: number; // CRITICAL 3 FIX: running total of amounts refunded against this payment
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      // Gen 20 #1 FIX: Canonical PaymentMethod has exactly 4 values.
      // 'stripe', 'razorpay', 'paypal' are gateways, not methods — use the `gateway` field instead.
      enum: ['upi', 'card', 'wallet', 'netbanking'],
    },
    paymentMethodId: {
      type: String,
      sparse: true,
    },
    purpose: {
      type: String,
      enum: ['wallet_topup', 'order_payment', 'event_booking', 'financial_service', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      required: true,
      // FSM FIX: refund states added to match PAYMENT_TRANSITIONS in financialStateMachine.ts.
      // Without these, Mongoose throws a validation error the moment any refund flow
      // tries to save a refund_initiated / refund_processing / refunded / refund_failed status,
      // making the entire refund lifecycle dead code.
      enum: [
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'expired',
        'refund_initiated',
        'refund_processing',
        'refunded',
        'refund_failed',
      ],
      default: 'pending',
    },
    userDetails: {
      name: String,
      email: String,
      phone: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    gatewayResponse: {
      gateway: String,
      transactionId: String,
      paymentUrl: String,
      qrCode: String,
      upiId: String,
      expiryTime: Date,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    failureReason: String,
    failedAt: Date,
    walletCredited: {
      type: Boolean,
      default: false,
    },
    walletCreditedAt: {
      type: Date,
    },
    completedAt: Date,
    // CRITICAL 3 FIX: Tracks total amount refunded against this payment.
    // The atomic $inc in refundService uses $expr to ensure this never exceeds `amount`.
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // BUG 2 FIX: expiresAt is optional and must only be set for non-completed payments.
    // The TTL index uses a partial filter so MongoDB only auto-deletes pending/failed records.
    // Drop the old unconditional TTL index in MongoDB and replace with the partial one below.
    expiresAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for better query performance
PaymentSchema.index({ user: 1, status: 1 });
PaymentSchema.index({ paymentId: 1, user: 1 });
PaymentSchema.index({ orderId: 1, user: 1 });
PaymentSchema.index({ createdAt: -1 });

// FIX: Missing indexes for common queries
PaymentSchema.index({ purpose: 1, status: 1 }); // for purpose-based filtering
PaymentSchema.index({ createdAt: 1, status: 1 }); // for status timeline queries
PaymentSchema.index({ user: 1, purpose: 1, createdAt: -1 }); // for user purpose analytics
PaymentSchema.index({ paymentMethod: 1, status: 1 }); // for payment method analytics
PaymentSchema.index({ completedAt: 1 }); // for completed payment date queries

// BUG 2 FIX: Partial TTL index — only expires pending/failed/cancelled/expired records.
// Completed payments are NEVER deleted by the TTL daemon.
// NOTE: The old unconditional TTL index on expiresAt must be dropped from MongoDB manually
//       (or via a migration) before this partial index takes effect.
//       Run: db.payments.dropIndex("expiresAt_1")
//       Then Mongoose will create the correct partial index on next startup.
PaymentSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { status: { $in: ['pending', 'processing', 'failed', 'cancelled', 'expired'] } },
  },
);

// Virtual for checking if payment is expired
// BUG 2 FIX: expiresAt is now optional (undefined for completed payments) — guard before comparing
PaymentSchema.virtual('isExpired').get(function () {
  return this.expiresAt != null && this.expiresAt < new Date();
});

// Virtual for checking if payment is active (not completed, failed, or expired)
// BUG 2 FIX: expiresAt is optional — undefined means no expiry (i.e., not expired)
PaymentSchema.virtual('isActive').get(function () {
  return ['pending', 'processing'].includes(this.status) && !(this.expiresAt != null && this.expiresAt < new Date());
});

// Static method to find active payments for a user
PaymentSchema.statics.findActivePayments = function (userId: string) {
  return this.find({
    user: userId,
    status: { $in: ['pending', 'processing'] },
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
};

// Static method to find payment by payment ID and user
PaymentSchema.statics.findByPaymentId = function (paymentId: string, userId: string) {
  return this.findOne({ paymentId, user: userId });
};

// Static method for atomic status transition to 'completed'
// Returns null if the payment is already in the expectedStatus (already processed by another process).
// BUG 2 FIX: Unsets expiresAt so the TTL partial-index never deletes a completed payment.
PaymentSchema.statics.markCompleted = async function (paymentId: string, expectedStatus: string | string[]) {
  const statusFilter = Array.isArray(expectedStatus) ? { $in: expectedStatus } : expectedStatus;
  return this.findOneAndUpdate(
    { paymentId, status: statusFilter },
    {
      $set: { status: 'completed', completedAt: new Date(), walletCredited: true },
      $unset: { expiresAt: '' }, // BUG 2 FIX: clear TTL field so completed records are never auto-deleted
    },
    { new: true },
  );
};

// Static method for atomic status transition to 'failed'
// Returns null if the payment is not in expectedStatus (already transitioned by another process).
PaymentSchema.statics.markFailed = async function (paymentId: string, expectedStatus: string | string[]) {
  const statusFilter = Array.isArray(expectedStatus) ? { $in: expectedStatus } : expectedStatus;
  return this.findOneAndUpdate(
    { paymentId, status: statusFilter },
    { $set: { status: 'failed', failedAt: new Date() } },
    { new: true },
  );
};

// Instance method to mark payment as completed
// BUG 2 FIX: Clears expiresAt so the TTL daemon never deletes a completed payment.
PaymentSchema.methods.markCompleted = function (transactionId?: string) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.expiresAt = undefined; // BUG 2 FIX: clear TTL field — the pre-save hook enforces this too
  if (transactionId) {
    this.gatewayResponse = this.gatewayResponse || {};
    this.gatewayResponse.transactionId = transactionId;
  }
  return this.save();
};

// Instance method to mark payment as failed
PaymentSchema.methods.markFailed = function (reason: string) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

// Instance method to mark payment as cancelled
PaymentSchema.methods.markCancelled = function () {
  this.status = 'cancelled';
  return this.save();
};

// ── State Machine: pre-save guard ────────────────────────────────────────────
// Validates payment status transitions on .save() calls using the centralised
// PAYMENT_TRANSITIONS map in config/financialStateMachine.ts.
// Callers must set  doc.$locals.previousStatus = doc.status  before mutating
// status and calling .save() so the hook knows the prior state.
// Set  doc.$locals.bypassStateMachine = true  for admin/migration overrides.
PaymentSchema.pre('save', function (next) {
  if (!this.isModified('status') || this.isNew) return next();

  const previousStatus = (this.$locals?.previousStatus as string) ?? undefined;
  const bypassStateMachine = this.$locals?.bypassStateMachine === true;

  if (!bypassStateMachine && previousStatus && previousStatus !== this.status) {
    try {
      assertValidTransition('payment', previousStatus, this.status as string);
    } catch (err) {
      return next(err as Error);
    }
  }

  return next();
});

// ── State Machine: findOneAndUpdate guard ─────────────────────────────────────
// Catches status transitions performed via findOneAndUpdate (e.g. static markCompleted /
// markFailed helpers and any service-layer atomic updates).
PaymentSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  const newStatus: string | undefined = update?.status ?? update?.$set?.status;
  if (!newStatus) return next();

  const doc = await (this.model as any).findOne(this.getQuery()).select('status').lean();
  if (!doc) return next();

  const bypassStateMachine = (this.getOptions() as any)?.bypassStateMachine === true;
  if (bypassStateMachine) return next();

  try {
    assertValidTransition('payment', (doc as any).status as string, newStatus);
  } catch (err) {
    return next(err as Error);
  }
  return next();
});

// Pre-save middleware to ensure payment ID is unique
PaymentSchema.pre('save', async function (next) {
  if (this.isNew && this.paymentId) {
    const PaymentModel = this.constructor as any;
    const existingPayment = await PaymentModel.findOne({ paymentId: this.paymentId });
    if (existingPayment) {
      const error = new Error('Payment ID already exists');
      return next(error);
    }
  }
  next();
});

// Pre-save middleware to set expiry time if not provided.
// BUG 2 FIX: Only set expiresAt for non-completed payments so the TTL daemon
// never deletes completed payment records.
PaymentSchema.pre('save', function (next) {
  const terminalStatuses = ['completed', 'cancelled'];
  if (terminalStatuses.includes(this.status)) {
    // Clear expiresAt so the TTL partial-filter expression doesn't match this document
    this.expiresAt = undefined;
  } else if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  }
  next();
});

export const Payment = mongoose.model<IPayment, IPaymentModel>('Payment', PaymentSchema);
export default Payment;
