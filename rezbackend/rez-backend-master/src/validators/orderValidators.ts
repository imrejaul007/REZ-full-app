import Joi from 'joi';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// DEPRECATED: This schema uses the old field names (shippingAddress, useWalletBalance) and is NOT
// wired to any route. The active createOrder validation lives in src/middleware/validation.ts
// (orderSchemas.createOrder) which uses deliveryAddress, coinsUsed, and fulfillmentType — matching
// what the consumer app sends. Do not use or import this schema; it will be removed in a future cleanup.
//
// export const createOrderSchema = Joi.object({ ... });

// Update order status validation
export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    // Matches Order model schema enum (source of truth: src/models/Order.ts)
    .valid(
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
    )
    .required(),
  notes: Joi.string().trim().max(500).optional(),
  trackingNumber: Joi.string().trim().max(100).optional(),
  carrier: Joi.string().trim().max(100).optional(),
});

// Query orders validation
export const queryOrdersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('createdAt', '-createdAt', 'total', '-total', 'status').default('-createdAt'),
  // Matches Order model schema enum (source of truth: src/models/Order.ts)
  status: Joi.string()
    .valid(
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
    )
    .optional(),
  // 'stripe' and 'paypal' removed — these gateways are not active.
  paymentMethod: Joi.string().valid('cod', 'online', 'wallet', 'card', 'upi', 'netbanking', 'razorpay').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  minAmount: Joi.number().positive().precision(2).optional(),
  maxAmount: Joi.number().positive().precision(2).optional(),
});

// Cancel order validation
export const cancelOrderSchema = Joi.object({
  reason: Joi.string().trim().min(10).max(500).required().messages({
    'string.min': 'Cancellation reason must be at least 10 characters',
    'any.required': 'Cancellation reason is required',
  }),
});

// Return/Refund request validation
export const returnRequestSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        orderItem: Joi.string().pattern(objectIdPattern).required(),
        quantity: Joi.number().integer().min(1).required(),
        reason: Joi.string().trim().max(500).required(),
      }),
    )
    .min(1)
    .required(),
  returnType: Joi.string().valid('return', 'exchange', 'refund').required(),
  notes: Joi.string().trim().max(1000).optional(),
});
