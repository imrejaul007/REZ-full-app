import { Request, Response } from 'express';
import { randomInt } from 'crypto';
import * as crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import { Order } from '../models/Order';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { sendSuccess, sendBadRequest } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import stockSocketService from '../services/stockSocketService';
import { pct } from '../utils/currency';
import activityService from '../services/activityService';
import couponService from '../services/couponService';
import gamificationEventBus from '../events/gamificationEventBus';
import { publishOrderEvent } from '../events/orderQueue';
import { walletService } from '../services/walletService';
import { Wallet } from '../models/Wallet';
import SmartSpendItem from '../models/SmartSpendItem';
import { CHECKOUT_CONFIG } from '../config/checkoutConfig';
import { SMSService } from '../services/SMSService';
import EmailService from '../services/EmailService';
import { Store } from '../models/Store';
import { Category } from '../models/Category';
import { MainCategorySlug, CoinTransaction } from '../models/CoinTransaction';
import { logger } from '../config/logger';
import { MarketingSignalService } from '../services/MarketingSignalService';
import redisService from '../services/redisService';
import { CacheInvalidator } from '../utils/cacheHelper';
import merchantNotificationService from '../services/merchantNotificationService';
import orderSocketService from '../services/orderSocketService';
import pushNotificationService from '../services/pushNotificationService';
import { generateTableToken } from '../utils/tableToken';

// ─── SCALEPILOT: Cost-per-transaction analysis ──────────────────────────────
//
// Measured by tracing createOrder() from entry to response.
//
// DB QUERIES PER ORDER (worst case, no cache hits):
//   1.  Order.findOne         — idempotency key check
//   2.  Cart.findOne+populate — fetch cart with products + stores
//   3.  coinService.getCoinBalance  — REZ coin balance (if coinsUsed)
//   4.  Wallet.findOne        — promo/branded coin validation (if coinsUsed)
//   5.  Category.find({})     — build category root map (cold; cached 5min)
//   6.  Store.findById        — get store category for coin category slug
//   7.  Product.findById ×N   — stock/price revalidation per line item
//   8.  Order.create          — insert new order (inside transaction)
//   9.  Cart.findOneAndUpdate — remove ordered items from cart
//   10. Wallet.findByIdAndUpdate — deduct wallet balance (if wallet payment)
//   11. CoinTransaction.create — record coin deduction (if coinsUsed)
//   ─── post-response async ──
//   12. activityService write
//   13. QueueService.sendEmail / sendSMS (enqueue, 1 Redis LPUSH each)
//   Total worst-case: ~11 synchronous DB queries + 2 Redis writes
//
// REDIS CALLS PER ORDER:
//   R1. GET cache:category-root-map   — category cache lookup
//   R2. GET idempotency key           — duplicate order check
//   R3. LPUSH email queue             — async email job
//   R4. LPUSH sms queue               — async SMS job
//   R5. CacheInvalidator.invalidate   — bust user cart / order list caches
//   Total: ~5 Redis operations
//
// THEORETICAL THROUGHPUT (single Render Starter pod, 1 CPU, 512 MB RAM):
//   Avg order latency (cached categories, wallet payment): ~120-180 ms
//   Avg order latency (cold cache, all DB hits):           ~350-500 ms
//   Concurrent requests limited by: maxPoolSize=25 DB connections
//   Estimated ceiling: ~50-70 orders/minute on a single pod (I/O bound)
//
// OPTIMISATION OPPORTUNITIES (in priority order):
//   [HIGH]   Items 7 (product revalidation) — batch into one find({_id:{$in:ids}})
//            instead of per-item findById loops; saves N-1 round trips.
//   [MEDIUM] Items 3+4 (coin balance + wallet) — already batched with
//            validationWallet reuse; good. Consider combining with wallet
//            payment deduction (item 10) into a single findOneAndUpdate
//            with $inc so wallet is read and decremented in one round trip.
//   [LOW]    Item 8+9 (order create + cart clear) — already in a MongoDB
//            session transaction; good for correctness, slight latency overhead.
//            At 10x scale consider write-behind (create order, clear cart async).
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── Category root slug helpers (shared with orderUpdateController) ─────────

export const VALID_CATEGORY_SLUGS: MainCategorySlug[] = [
  'food-dining',
  'beauty-wellness',
  'grocery-essentials',
  'fitness-sports',
  'healthcare',
  'fashion',
  'education-learning',
  'home-services',
  'travel-experiences',
  'entertainment',
  'financial-lifestyle',
  'electronics',
];

const CATEGORY_ROOT_CACHE_KEY = 'cache:category-root-map';
const CATEGORY_ROOT_CACHE_TTL = 300; // 5 minutes

// SCALEPILOT — HORIZONTAL SCALING NOTE:
//   localCategoryCache is a module-level in-memory Map used as an L1 cache
//   in front of the Redis L2 cache (CATEGORY_ROOT_CACHE_KEY).
//   - Single-pod: completely safe, zero extra cost.
//   - Multi-pod: each pod independently warms its L1 within 5 minutes of a
//     cold start. There is no cross-pod staleness risk because category
//     hierarchies rarely change; the 5-min TTL ensures eventual consistency.
//   - If you add a category admin action that changes the hierarchy, call
//     redisService.del(CATEGORY_ROOT_CACHE_KEY) and set localCategoryCache=null
//     on the responding pod. Other pods self-heal within 5 min via TTL.
//   No action needed for single-region multi-pod deployments.
let localCategoryCache: Map<string, string | null> | null = null;
let localCacheTTL = 0;

// RC-04: Subscribe to Redis pub/sub to invalidate the local cache immediately
// across all pods when an admin updates the category hierarchy.
// BUG-017 FIX: store the subscriber client reference at module scope so it can
// be disconnected during graceful shutdown (previously it was never cleaned up,
// keeping the process alive after SIGTERM and leaking a Redis connection).
// BUG-054 FIX: typed as ReturnType<RedisClientType['duplicate']> to avoid 'any'
import type { RedisClientType } from 'redis';
export let categoryInvalidateSubClient: ReturnType<RedisClientType['duplicate']> | null = null;

try {
  const redisService = require('../services/redisService').default;
  if (redisService?.getClient && redisService.getClient()) {
    categoryInvalidateSubClient = redisService.getClient().duplicate();
    categoryInvalidateSubClient!
      .connect()
      .then(() => {
        categoryInvalidateSubClient!.subscribe('cache:invalidate', (_message: string, _channel: string) => {
          try {
            const { key } = JSON.parse(_message);
            if (key === 'category-root-map') {
              localCategoryCache = null;
              localCacheTTL = 0;
            }
          } catch (parseErr) {
            // BUG-023 FIX: Log malformed invalidation messages for debugging
            logger.debug('[ORDER] Failed to parse cache:invalidate message:', parseErr);
          }
        });
      })
      .catch((connectErr: unknown) => {
        // BUG-025 FIX: Log Redis subscriber connection failure
        logger.debug('[ORDER] Redis subscriber connect failed, cache invalidation disabled:', connectErr);
        categoryInvalidateSubClient = null;
      });
  }
} catch (setupErr) {
  // BUG-026 FIX: Log Redis subscriber setup failure
  logger.debug('[ORDER] Redis subscriber setup failed:', setupErr);
}

/**
 * Build or retrieve a map of categoryId -> root MainCategory slug.
 * Cached in Redis (5min) with in-memory fallback.
 */
export async function getCategoryRootMap(): Promise<Map<string, string | null>> {
  // Check local memory cache first
  if (localCategoryCache && Date.now() < localCacheTTL) {
    return localCategoryCache;
  }

  // Try Redis cache
  try {
    const cached = await redisService.get<[string, string | null][]>(CATEGORY_ROOT_CACHE_KEY);
    if (cached) {
      localCategoryCache = new Map<string, string | null>(cached);
      localCacheTTL = Date.now() + CATEGORY_ROOT_CACHE_TTL * 1000;
      return localCategoryCache;
    }
  } catch (cacheReadErr) {
    // BUG-029 FIX: Log Redis read failure for debugging
    logger.debug('[ORDER] Redis category cache read failed, building from DB:', cacheReadErr);
  }

  // Build from DB: load all categories in one query
  const allCategories = await Category.find({}).select('slug parentCategory').lean();
  const catMap = new Map<string, { slug: string; parentId: string | null }>();
  for (const cat of allCategories) {
    catMap.set(cat._id.toString(), {
      slug: cat.slug,
      parentId: cat.parentCategory ? cat.parentCategory.toString() : null,
    });
  }

  // Resolve each category to its root slug
  const rootMap = new Map<string, string | null>();
  for (const [catId] of catMap) {
    let currentId: string | null = catId;
    let depth = 5;
    let rootSlug: string | null = null;

    while (currentId && depth-- > 0) {
      const entry = catMap.get(currentId);
      if (!entry) break;
      if (!entry.parentId) {
        // Root category found
        rootSlug = VALID_CATEGORY_SLUGS.includes(entry.slug as MainCategorySlug) ? entry.slug : null;
        break;
      }
      currentId = entry.parentId;
    }
    rootMap.set(catId, rootSlug);
  }

  // Cache in Redis + memory
  try {
    await redisService.set(CATEGORY_ROOT_CACHE_KEY, [...rootMap], CATEGORY_ROOT_CACHE_TTL);
  } catch (cacheWriteErr) {
    // BUG-029 FIX: Log Redis write failure for debugging
    logger.debug('[ORDER] Redis category cache write failed:', cacheWriteErr);
  }
  localCategoryCache = rootMap;
  localCacheTTL = Date.now() + CATEGORY_ROOT_CACHE_TTL * 1000;

  return rootMap;
}

/**
 * Get the root MainCategory slug for a store.
 * Uses cached category hierarchy (1 DB query for all categories, cached 5min).
 */
export async function getStoreCategorySlug(storeId: string): Promise<MainCategorySlug | null> {
  try {
    const store = await Store.findById(storeId).select('category').lean();
    if (!store?.category) return null;

    const rootMap = await getCategoryRootMap();
    const rootSlug = rootMap.get(store.category.toString());
    return (rootSlug as MainCategorySlug) || null;
  } catch (err) {
    logger.error('[ORDER] Error getting store category slug:', err);
    return null;
  }
}

// ─── createOrder handler ────────────────────────────────────────────────────

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order from cart
 *     tags: [User Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliveryAddress
 *               - paymentMethod
 *             properties:
 *               deliveryAddress:
 *                 type: object
 *                 required: [name, phone, addressLine1, city, state, pincode]
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   addressLine1:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   pincode:
 *                     type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cod, wallet, razorpay, upi, card, netbanking]
 *               specialInstructions:
 *                 type: string
 *               couponCode:
 *                 type: string
 *               voucherCode:
 *                 type: string
 *               coinsUsed:
 *                 type: object
 *                 description: Coin amounts to deduct from wallet
 *                 properties:
 *                   rezCoins:
 *                     type: number
 *                     description: REZ coins to use
 *                   promoCoins:
 *                     type: number
 *                     description: Promo coins to use
 *                   storePromoCoins:
 *                     type: number
 *                     description: Store promo coins to use
 *               storeId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               idempotencyKey:
 *                 type: string
 *               fulfillmentType:
 *                 type: string
 *                 enum: [delivery, pickup, dine_in]
 *               fulfillmentDetails:
 *                 type: object
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error (empty cart, invalid payment, etc.)
 *       401:
 *         description: Unauthorized
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const {
    deliveryAddress,
    paymentMethod,
    specialInstructions,
    couponCode,
    voucherCode,
    coinsUsed,
    storeId,
    items: requestItems,
    redemptionCode,
    offerRedemptionCode,
    lockFeeDiscount: clientLockFeeDiscount,
    idempotencyKey,
    pickId,
    fulfillmentType: reqFulfillmentType,
    fulfillmentDetails: reqFulfillmentDetails,
  } = req.body;
  // BUG-014: Validate fulfillmentType against an allowlist to prevent arbitrary
  // values from being persisted (e.g. SQL-injection-style enum pollution).
  const ALLOWED_FULFILLMENT_TYPES = ['delivery', 'pickup', 'dine_in', 'drive_thru'] as const;
  const fulfillmentType: string = ALLOWED_FULFILLMENT_TYPES.includes(reqFulfillmentType)
    ? reqFulfillmentType
    : 'delivery';

  // LOW-2 FIX: Require idempotency key on order creation to prevent silent duplicate
  // orders from network retries. Frontend must send an `Idempotency-Key` header with
  // every POST /orders request (UUID v4). Coordinate with frontend before deploying.
  if (!idempotencyKey) {
    return sendBadRequest(res, 'idempotency-key header is required for order creation');
  }

  // Start a MongoDB session for transaction.
  // DP-D002 FIX: Explicitly set w:'majority' + journal on startTransaction() so that
  // order writes are durable even if the connection-string default is changed.
  // Without this, a primary stepdown between startTransaction() and commitTransaction()
  // could silently accept the transaction on a node that never becomes primary, leaving
  // the order document in a non-majority-committed state and invisible to subsequent reads.
  const session = await mongoose.startSession();
  session.startTransaction({
    writeConcern: { w: 'majority', j: true },
    readConcern: { level: 'snapshot' },
  });

  try {
    // Idempotency check: prevent duplicate orders from network retries.
    // Note: the outer guard (line ~350) already returns 400 if idempotencyKey is absent,
    // so this check always runs — the `if` wrapper is redundant but kept for clarity.
    {
      const existingOrder = await Order.findOne({ user: userId, idempotencyKey }).session(session).lean();
      if (existingOrder) {
        await session.abortTransaction();
        session.endSession();
        return sendSuccess(res, { order: existingOrder }, 'Order already exists');
      }
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name image images isActive inventory',
      })
      .populate({
        path: 'items.store',
        select: 'name logo',
      })
      .session(session)
      .lean();

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return sendBadRequest(res, 'Cart is empty');
    }

    // Filter cart items by storeId if provided (for multi-store order splitting)
    let itemsToProcess = cart.items;
    if (storeId) {
      itemsToProcess = cart.items.filter((item: any) => {
        const itemStoreId = typeof item.store === 'object' ? item.store._id?.toString() : item.store?.toString();
        return itemStoreId === storeId;
      });
      if (itemsToProcess.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return sendBadRequest(res, 'No items found for the specified store');
      }
    }

    // Also support filtering by specific product IDs (for more granular control)
    if (requestItems && Array.isArray(requestItems) && requestItems.length > 0) {
      const productIds = requestItems
        .map((item: any) => item.product?.toString() || item.id?.toString())
        .filter(Boolean);
      if (productIds.length > 0) {
        itemsToProcess = itemsToProcess.filter((item: any) => {
          const itemProductId =
            typeof item.product === 'object' ? item.product._id?.toString() : item.product?.toString();
          return productIds.includes(itemProductId);
        });
      }
    }

    // Create a virtual cart object with filtered items for order processing
    // Cart is fetched with .lean() so it's already a plain JS object
    const orderCart = {
      ...cart,
      items: itemsToProcess,
    };

    // Validate payment method.
    // SECURITY FIX: 'stripe' was previously listed but has zero implementation in this
    // controller — accepting it allowed orders to be placed and stock reserved without
    // any payment actually being taken. Removed until Stripe order-payment is implemented.
    const validPaymentMethods = ['cod', 'wallet', 'razorpay', 'upi', 'card', 'netbanking'];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      await session.abortTransaction();
      session.endSession();
      return sendBadRequest(res, `Invalid payment method. Allowed: ${validPaymentMethods.join(', ')}`);
    }

    // Validate address fields based on fulfillment type.
    // Delivery requires full address; non-delivery accepts minimal address.
    const isDeliveryOrder = fulfillmentType === 'delivery';
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    const pincodeRegex = /^\d{6}$/;

    if (isDeliveryOrder) {
      if (!deliveryAddress) {
        await session.abortTransaction();
        session.endSession();
        return sendBadRequest(res, 'Delivery address is required');
      }

      const requiredAddressFields = ['name', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
      const missingFields = requiredAddressFields.filter((field) => !deliveryAddress[field]);
      if (missingFields.length > 0) {
        await session.abortTransaction();
        session.endSession();
        return sendBadRequest(res, `Missing required address fields: ${missingFields.join(', ')}`);
      }

      const cleanPhone = String(deliveryAddress.phone || '').replace(/[\s-]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        await session.abortTransaction();
        session.endSession();
        return sendBadRequest(res, 'Invalid phone number format');
      }

      if (!pincodeRegex.test(String(deliveryAddress.pincode || ''))) {
        await session.abortTransaction();
        session.endSession();
        return sendBadRequest(res, 'Invalid pincode format (must be 6 digits)');
      }
    } else if (deliveryAddress) {
      const requiredNonDeliveryFields = ['name', 'phone'];
      const missingNonDeliveryFields = requiredNonDeliveryFields.filter((field) => !deliveryAddress[field]);
      if (missingNonDeliveryFields.length > 0) {
        await session.abortTransaction();
        session.endSession();
        return sendBadRequest(res, `Missing required address fields: ${missingNonDeliveryFields.join(', ')}`);
      }

      const cleanPhone = String(deliveryAddress.phone || '').replace(/[\s-]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        await session.abortTransaction();
        session.endSession();
        return sendBadRequest(res, 'Invalid phone number format');
      }

      if (deliveryAddress.pincode && !pincodeRegex.test(String(deliveryAddress.pincode))) {
        await session.abortTransaction();
        session.endSession();
        return sendBadRequest(res, 'Invalid pincode format (must be 6 digits)');
      }
    }

    // Validate all items belong to the same store (using filtered orderCart)
    const storeIds = new Set(
      orderCart.items
        .map((item: any) => {
          const store = item.store;
          return typeof store === 'object' ? store._id?.toString() : store?.toString();
        })
        .filter(Boolean),
    );

    if (storeIds.size > 1) {
      await session.abortTransaction();
      session.endSession();
      return sendBadRequest(
        res,
        'All items must be from the same store. Please create separate orders for different stores.',
      );
    }

    // Validate coin balances if coins are being used
    // BUG-049/079 FIX: The pre-transaction getCoinBalance check created a TOCTOU
    // (Time-Of-Check-Time-Of-Use) race condition — a concurrent order could drain
    // the balance between the check and the deduction.  The atomic $inc with $gte
    // guard inside the MongoDB transaction (further below) is the authoritative
    // balance check.  Pre-flight validation here uses the wallet document already
    // loaded inside the session so the read is consistent with the write.
    if (coinsUsed && (coinsUsed.rezCoins > 0 || coinsUsed.storePromoCoins > 0 || coinsUsed.promoCoins > 0)) {
      // Load wallet ONCE for both promo and branded coin validations (avoids duplicate DB query)
      const needsWalletValidation = coinsUsed.promoCoins > 0 || coinsUsed.storePromoCoins > 0;
      const validationWallet = needsWalletValidation
        ? await Wallet.findOne({ user: userId }).session(session).lean()
        : null;

      // Validate promo coins (reuses validationWallet)
      if (coinsUsed.promoCoins > 0) {
        const promoCoin = validationWallet?.coins?.find((c) => c.type === 'promo');
        const promoBalance = promoCoin?.amount || 0;
        if (promoBalance < coinsUsed.promoCoins) {
          await session.abortTransaction();
          session.endSession();
          logger.error('[CREATE ORDER] Insufficient promo coin balance:', {
            required: coinsUsed.promoCoins,
            available: promoBalance,
          });
          return sendBadRequest(
            res,
            `Insufficient promo coin balance. Required: ${coinsUsed.promoCoins}, Available: ${promoBalance}`,
          );
        }
        // Pre-checkout expiry check: reject if promo coins have expired
        // Check legacy wallet field
        const promoExpiryRaw = promoCoin?.promoDetails?.expiryDate || promoCoin?.expiryDate;
        if (promoExpiryRaw) {
          const expDate = new Date(promoExpiryRaw as string | number | Date);
          if (expDate <= new Date()) {
            await session.abortTransaction();
            session.endSession();
            return sendBadRequest(res, 'Your promo coins have expired. Please refresh your wallet balance.');
          }
        }
        // Also check CoinTransaction-based expiry (new system)
        const expiredPromoTx = await CoinTransaction.findOne({
          user: userId,
          type: 'earned',
          'metadata.coinType': 'promo',
          expiresAt: { $lte: new Date() },
          'metadata.isExpired': { $ne: true },
        })
          .session(session)
          .lean();
        if (expiredPromoTx) {
          await session.abortTransaction();
          session.endSession();
          return sendBadRequest(res, 'Some of your promo coins have expired. Please refresh your wallet balance.');
        }
      }

      // Validate store promo coins (reuses validationWallet — no extra DB query)
      if (coinsUsed.storePromoCoins > 0) {
        // Get the store from the first order item - now using branded coins
        const firstItem = orderCart.items[0];
        const orderStoreId =
          typeof firstItem.store === 'object' && firstItem.store !== null && '_id' in firstItem.store
            ? (firstItem.store as { _id: Types.ObjectId })._id
            : firstItem.store;

        if (orderStoreId) {
          const brandedCoin = validationWallet?.brandedCoins?.find(
            (bc) => bc.merchantId?.toString() === orderStoreId.toString(),
          );
          const brandedBalance = brandedCoin?.amount || 0;

          if (brandedBalance < coinsUsed.storePromoCoins) {
            await session.abortTransaction();
            session.endSession();
            logger.error('[CREATE ORDER] Insufficient branded coin balance:', {
              required: coinsUsed.storePromoCoins,
              available: brandedBalance,
            });
            return sendBadRequest(
              res,
              `Insufficient store coin balance. Required: ${coinsUsed.storePromoCoins}, Available: ${brandedBalance}`,
            );
          }
        }
      }
    }

    // Validate products availability and build order items
    const orderItems = [];
    const stockUpdates = []; // Track stock updates for atomic operation

    // FIX: Batch-fetch all products in a single query instead of N individual findById calls
    const productIds = orderCart.items.map((item: any) => {
      const p = item.product;
      return typeof p === 'object' ? p._id : p;
    });
    const products = await Product.find({ _id: { $in: productIds } })
      .lean()
      .session(session);
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // PERF FIX: Batch-fetch all SmartSpendItems upfront (prevents N+1 queries inside the loop).
    // Previously each smart_spend cart item triggered an individual SmartSpendItem.findById() call.
    const smartSpendItemIds = orderCart.items
      .filter((item: any) => item.metadata?.source === 'smart_spend' && item.metadata?.smartSpendItemId)
      .map((item: any) => item.metadata.smartSpendItemId);
    const smartSpendItemMap = new Map<string, any>();
    if (smartSpendItemIds.length > 0) {
      try {
        const ssItems = await SmartSpendItem.find({ _id: { $in: smartSpendItemIds } })
          .select('coinRewardRate')
          .lean()
          .session(session);
        ssItems.forEach((ss: any) => smartSpendItemMap.set(ss._id.toString(), ss));
      } catch (_ssErr) {
        // Non-critical — order creation continues without smart_spend rate snapshots
        logger.warn('[CREATE ORDER] Failed to batch-fetch SmartSpendItems:', _ssErr);
      }
    }

    for (const cartItem of orderCart.items) {
      // Use batch-fetched product for current, session-consistent data (pricing, stock, isActive)
      // cartItem.product/store are ObjectIds in the type but populated objects at runtime (cart was fetched with .populate)
      type PopulatedRef = Types.ObjectId | { _id?: Types.ObjectId; [key: string]: unknown };
      const cartProduct = cartItem.product as PopulatedRef | undefined;
      const cartProductId =
        typeof cartProduct === 'object' && cartProduct !== null && '_id' in cartProduct
          ? cartProduct._id?.toString()
          : cartProduct?.toString();
      const productRaw = (cartProductId && productMap.get(cartProductId)) || cartProduct;
      // Cast to any to allow access to both IProduct and legacy/populated fields
      const product = productRaw as any;
      const store = cartItem.store as PopulatedRef | null;

      // Null check BEFORE any property access
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        logger.error('[CREATE ORDER] Product is null/undefined for cart item');
        return sendBadRequest(res, 'Invalid product in cart');
      }

      // Verify cart price against current product price (prevent stale/manipulated prices)
      const currentPrice =
        product.pricing?.selling || (typeof product.price === 'number' ? product.price : product.price?.current) || 0;
      const cartPrice = cartItem.price || 0;
      if (currentPrice > 0 && cartPrice > 0) {
        const priceDiff = Math.abs(currentPrice - cartPrice) / currentPrice;
        if (priceDiff > 0.001) {
          // >0.1% difference — tightened from 1% to prevent price drift abuse
          await session.abortTransaction();
          session.endSession();
          return sendBadRequest(
            res,
            `Price for "${product.name}" has changed from ₹${cartPrice} to ₹${currentPrice}. Please refresh your cart.`,
          );
        }
      }

      if (!store) {
        await session.abortTransaction();
        session.endSession();
        logger.error('[CREATE ORDER] Store is null/undefined for product:', product.name);
        return sendBadRequest(res, `Product "${product.name}" has no associated store`);
      }

      if (!product.isActive) {
        await session.abortTransaction();
        session.endSession();
        return sendBadRequest(res, `Product "${product.name}" is not available`);
      }

      // Check stock availability and prepare atomic update
      const requestedQuantity = cartItem.quantity;
      let availableStock = 0;
      let updateQuery: any = {};
      let stockCheckQuery: any = { _id: product._id };

      // Skip stock deduction for unlimited products (digital goods, etc.)
      if (product.inventory?.unlimited) {
        // No stock update needed for unlimited products
      } else if (cartItem.variant && product.inventory?.variants?.length > 0) {
        // Handle variant stock
        const variant = product.inventory.variants.find(
          (v: any) => v.type === cartItem.variant?.type && v.value === cartItem.variant?.value,
        );

        if (!variant) {
          await session.abortTransaction();
          session.endSession();
          return sendBadRequest(res, `Variant not found for product "${product.name}"`);
        }

        availableStock = variant.stock;
        // Check if sufficient stock
        if (availableStock < requestedQuantity) {
          await session.abortTransaction();
          session.endSession();
          return sendBadRequest(
            res,
            `Insufficient stock for "${product.name}" (${variant.type}: ${variant.value}). Available: ${availableStock}, Requested: ${requestedQuantity}`,
          );
        }

        // STOCK-RACE FIX: For online payment variant orders, atomically reserve stock
        // via reservedStock so two concurrent orders cannot both claim the last unit.
        if (paymentMethod !== 'cod') {
          const reserved = await Product.findOneAndUpdate(
            {
              _id: product._id,
              'inventory.variants': {
                $elemMatch: {
                  type: cartItem.variant.type,
                  value: cartItem.variant.value,
                  stock: { $gte: requestedQuantity },
                },
              },
              $expr: {
                $gte: [
                  { $subtract: ['$inventory.stock', { $ifNull: ['$inventory.reservedStock', 0] }] },
                  requestedQuantity,
                ],
              },
            },
            { $inc: { 'inventory.reservedStock': requestedQuantity } },
            { session, new: false },
          );
          if (!reserved) {
            await session.abortTransaction();
            session.endSession();
            return sendBadRequest(
              res,
              `"${product.name}" (${cartItem.variant.type}: ${cartItem.variant.value}) is temporarily out of stock. Another order may have just reserved the last unit. Please try again shortly.`,
            );
          }
        }

        // Prepare atomic update for variant stock AND main product stock
        const mainStock = product.inventory?.stock || 0;
        const newMainStock = mainStock - requestedQuantity;
        updateQuery = {
          $inc: {
            'inventory.variants.$[variant].stock': -requestedQuantity,
            'inventory.stock': -requestedQuantity,
          },
        };
        stockCheckQuery['inventory.variants'] = {
          $elemMatch: {
            type: cartItem.variant.type,
            value: cartItem.variant.value,
            stock: { $gte: requestedQuantity },
          },
        };

        // Set isAvailable to false if main stock becomes 0
        if (newMainStock <= 0) {
          updateQuery.$set = {
            'inventory.isAvailable': false,
          };
        }

        stockUpdates.push({
          productId: product._id,
          updateQuery,
          stockCheckQuery,
          arrayFilters: [
            {
              'variant.type': cartItem.variant.type,
              'variant.value': cartItem.variant.value,
            },
          ],
        });
      } else {
        // Handle main product stock
        // STOCK-RACE FIX: For online payment orders, atomically reserve stock via
        // reservedStock so two concurrent orders cannot both claim the last unit.
        // COD orders skip this and instead deduct immediately in the stockUpdates loop below.
        if (paymentMethod !== 'cod') {
          const reserved = await Product.findOneAndUpdate(
            {
              _id: product._id,
              $expr: {
                $gte: [
                  { $subtract: ['$inventory.stock', { $ifNull: ['$inventory.reservedStock', 0] }] },
                  requestedQuantity,
                ],
              },
            },
            { $inc: { 'inventory.reservedStock': requestedQuantity } },
            { session, new: false },
          );
          if (!reserved) {
            await session.abortTransaction();
            session.endSession();
            return sendBadRequest(
              res,
              `"${product.name}" is temporarily out of stock. Another order may have just reserved the last unit. Please try again shortly.`,
            );
          }
          availableStock = reserved.inventory?.stock || 0;
        } else {
          // COD: plain JS check — stockUpdates loop will deduct atomically below
          availableStock = product.inventory?.stock || 0;
          if (availableStock < requestedQuantity) {
            await session.abortTransaction();
            session.endSession();
            return sendBadRequest(
              res,
              `Insufficient stock for "${product.name}". Available: ${availableStock}, Requested: ${requestedQuantity}`,
            );
          }
        }

        // Prepare atomic update for main product stock
        updateQuery = {
          $inc: {
            'inventory.stock': -requestedQuantity,
          },
        };
        stockCheckQuery['inventory.stock'] = { $gte: requestedQuantity };

        // Set isAvailable to false if stock becomes 0
        const newStock = availableStock - requestedQuantity;
        if (newStock === 0) {
          updateQuery.$set = {
            'inventory.isAvailable': false,
          };
        }

        stockUpdates.push({
          productId: product._id,
          updateQuery,
          stockCheckQuery,
          arrayFilters: null,
        });
      }

      // Get product image - provide default if missing
      const productImage = product.image || product.images?.[0] || 'https://placehold.co/150';

      // Build order item
      const orderItem: any = {
        product: product._id,
        store: store._id,
        storeName: (store as any)?.name, // Store name for display without populate
        name: product.name,
        image: productImage,
        quantity: cartItem.quantity,
        variant: cartItem.variant || undefined,
        price: cartItem.price || 0,
        originalPrice: cartItem.originalPrice || cartItem.price || 0,
        discount: cartItem.discount || 0,
        subtotal: (cartItem.price || 0) * cartItem.quantity,
      };

      // Propagate Smart Spend source for enhanced Prive coin earning.
      // Uses the pre-batched smartSpendItemMap — no per-item DB query needed.
      if (cartItem.metadata?.source === 'smart_spend' && cartItem.metadata?.smartSpendItemId) {
        const ssId = cartItem.metadata.smartSpendItemId?.toString();
        const ssItem = ssId ? smartSpendItemMap.get(ssId) : undefined;
        if (ssItem) {
          orderItem.smartSpendSource = {
            smartSpendItemId: cartItem.metadata.smartSpendItemId,
            coinRewardRate: ssItem.coinRewardRate, // snapshot rate at order time
          };
        }
      }

      orderItems.push(orderItem);
    }

    // Note: Stock deduction is now deferred until payment is confirmed
    // This prevents stock being locked for failed payments
    // Stock deduction will happen in paymentService.handlePaymentSuccess()

    // BUGFIX: Calculate totals from filtered items, NOT full cart
    // For multi-store orders, each order should only include its store's items
    const filteredSubtotal = itemsToProcess.reduce((sum: number, item: any) => {
      return sum + (item.price || 0) * (item.quantity || 1);
    }, 0);

    // Use filtered subtotal for this order (not full cart subtotal)
    const subtotal = filteredSubtotal;

    // Calculate tax (5%) on filtered subtotal
    const taxRate = 0.05;
    const tax = Math.round(subtotal * taxRate * 100) / 100;

    // Calculate discount proportionally based on filtered items ratio
    const fullCartSubtotal = cart.totals.subtotal || 0;
    const discountRatio = fullCartSubtotal > 0 ? subtotal / fullCartSubtotal : 1;
    const baseDiscount = Math.round((cart.totals.discount || 0) * discountRatio * 100) / 100;

    // Calculate 15% platform fee on SUBTOTAL ONLY (excludes tax and delivery)
    const platformFeeRate = CHECKOUT_CONFIG.merchantFee?.percentage || 0.15;
    const minFee = CHECKOUT_CONFIG.merchantFee?.minFee || 2;
    const maxFee = CHECKOUT_CONFIG.merchantFee?.maxFee || 10000;
    let platformFee = Math.round(subtotal * platformFeeRate * 100) / 100;
    // Apply min/max constraints
    platformFee = Math.max(minFee, Math.min(maxFee, platformFee));
    const merchantPayout = Math.round((subtotal - platformFee) * 100) / 100;

    // Apply partner benefits to order
    const partnerBenefitsService = require('../services/partnerBenefitsService').default;

    // Calculate base delivery fee for THIS order's subtotal
    // For non-delivery fulfillment types (pickup, drive_thru, dine_in), delivery fee is 0
    const FREE_DELIVERY_THRESHOLD = 500;
    const STANDARD_DELIVERY_FEE = 50;
    const baseDeliveryFee =
      fulfillmentType !== 'delivery' ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;

    // Batch independent lookups: partnerBenefits + optional voucher/deal/offer
    // queries are all independent of each other — run them in parallel.
    const DealRedemption = redemptionCode ? require('../models/DealRedemption').default : null;
    const OfferRedemption = offerRedemptionCode ? require('../models/OfferRedemption').default : null;
    if (offerRedemptionCode) require('../models/Offer'); // preload for populate

    const [partnerBenefits, voucherResultRaw, redemptionRaw, offerRedemptionRaw] = await Promise.all([
      partnerBenefitsService.applyPartnerBenefits({
        subtotal,
        deliveryFee: baseDeliveryFee,
        userId: userId.toString(),
      }),
      voucherCode
        ? require('../services/partnerService').default.applyVoucher(userId.toString(), voucherCode, subtotal)
        : Promise.resolve(null),
      DealRedemption
        ? DealRedemption.findOne({
            redemptionCode: redemptionCode.toUpperCase(),
            user: new mongoose.Types.ObjectId(userId),
          }).session(session)
        : Promise.resolve(null),
      OfferRedemption
        ? OfferRedemption.findOne({
            $or: [{ redemptionCode: offerRedemptionCode.toUpperCase() }, { verificationCode: offerRedemptionCode }],
            user: new mongoose.Types.ObjectId(userId),
          })
            .populate('offer', 'title cashbackPercentage restrictions')
            .session(session)
        : Promise.resolve(null),
    ]);

    // Use partner-adjusted values
    const deliveryFee = partnerBenefits.deliveryFee;
    let discount = baseDiscount + partnerBenefits.birthdayDiscount;
    const cashback = partnerBenefits.cashbackAmount;

    // Apply partner voucher if provided (FIXED: Issue #4 - Voucher redemption)
    let voucherDiscount = 0;
    let voucherApplied = '';
    if (voucherCode && voucherResultRaw) {
      const voucherResult = voucherResultRaw;
      if (voucherResult.valid) {
        voucherDiscount = voucherResult.discount;
        voucherApplied = voucherCode;
        discount += voucherDiscount;
      } else {
        // Don't fail order creation, just don't apply the voucher
      }
    }

    // Apply deal redemption code if provided
    let redemptionDiscount = 0;
    let appliedRedemption: any = null;
    if (redemptionCode) {
      const redemption = redemptionRaw;

      if (redemption) {
        // Check if redemption is active - return error if not
        if (redemption.status !== 'active') {
          await session.abortTransaction();
          session.endSession();
          const statusMessages: Record<string, string> = {
            pending: 'This deal code is pending payment confirmation',
            used: 'This deal code has already been used',
            expired: 'This deal code has expired',
            cancelled: 'This deal code was cancelled',
          };
          return sendBadRequest(res, statusMessages[redemption.status] || `Deal code is ${redemption.status}`);
        } else if (new Date(redemption.expiresAt) < new Date()) {
          await session.abortTransaction();
          session.endSession();
          return sendBadRequest(res, 'This deal code has expired');
        } else {
          // Calculate the benefit
          const deal = redemption.dealSnapshot;
          if (deal?.cashback) {
            // Match decimal numbers (e.g. "12.5%", "₹149.50") — old /(\d+)/ dropped decimals
            const match = deal.cashback.match(/([\d]+(?:\.[\d]+)?)/);
            if (match) {
              const value = parseFloat(match[1]);
              redemptionDiscount = deal.cashback.includes('%') ? pct(subtotal, value) : value;
            }
          } else if (deal?.discount) {
            const match = deal.discount.match(/([\d]+(?:\.[\d]+)?)/);
            if (match) {
              const value = parseFloat(match[1]);
              redemptionDiscount = deal.discount.includes('%') ? pct(subtotal, value) : value;
            }
          }

          // Apply max benefit cap from campaign
          if (redemption.campaignSnapshot?.maxBenefit && redemptionDiscount > redemption.campaignSnapshot.maxBenefit) {
            redemptionDiscount = redemption.campaignSnapshot.maxBenefit;
          }

          appliedRedemption = redemption;
          discount += redemptionDiscount;
        }
      } else {
        await session.abortTransaction();
        session.endSession();
        return sendBadRequest(res, 'Invalid deal code. Please check the code and try again.');
      }
    }

    // Apply offer redemption code if provided (RED-xxx format cashback vouchers)
    // offerRedemptionRaw was already fetched in the Promise.all batch above.
    let offerRedemptionCashback = 0;
    let appliedOfferRedemption: any = null;
    if (offerRedemptionCode) {
      const offerRedemption = offerRedemptionRaw;

      if (offerRedemption) {
        // Check if redemption is active
        if (offerRedemption.status !== 'active') {
          await session.abortTransaction();
          session.endSession();
          const statusMessages: Record<string, string> = {
            pending: 'This voucher is pending activation',
            used: 'This voucher has already been used',
            expired: 'This voucher has expired',
            cancelled: 'This voucher was cancelled',
          };
          return sendBadRequest(res, statusMessages[offerRedemption.status] || `Voucher is ${offerRedemption.status}`);
        }

        // Check expiry
        if (new Date(offerRedemption.expiryDate) < new Date()) {
          await session.abortTransaction();
          session.endSession();
          return sendBadRequest(res, 'This voucher has expired');
        }

        // offer is an ObjectId in the schema but populated at runtime
        const offer = offerRedemption.offer as Types.ObjectId & {
          restrictions?: { minOrderValue?: number; maxDiscountAmount?: number };
          cashbackPercentage?: number;
        };

        // Check minimum order value
        if (offer?.restrictions?.minOrderValue && subtotal < offer.restrictions.minOrderValue) {
          await session.abortTransaction();
          session.endSession();
          return sendBadRequest(
            res,
            `Minimum order value of ₹${offer.restrictions.minOrderValue} required for this voucher`,
          );
        }

        // Calculate cashback
        const cashbackPercentage = offer?.cashbackPercentage || 0;
        offerRedemptionCashback = pct(subtotal, cashbackPercentage);

        // Apply max discount cap
        if (offer?.restrictions?.maxDiscountAmount && offerRedemptionCashback > offer.restrictions.maxDiscountAmount) {
          offerRedemptionCashback = offer.restrictions.maxDiscountAmount;
        }

        appliedOfferRedemption = offerRedemption;
      } else {
        await session.abortTransaction();
        session.endSession();
        return sendBadRequest(res, 'Invalid voucher code. Please check the code and try again.');
      }
    }

    // Calculate coin discount from coinsUsed
    // Also enforce per-coin-type percentage caps defined in CHECKOUT_CONFIG
    // to prevent a user stacking promo+branded coins beyond intended limits.
    const rawRezCoins = coinsUsed?.rezCoins || 0;
    let rawPromoCoins = coinsUsed?.promoCoins || 0;
    let rawStorePromoCoins = coinsUsed?.storePromoCoins || 0;

    // Cap promo coins at 20% of subtotal (CHECKOUT_CONFIG.coins.promoCoin.maxUsagePercentage)
    const maxPromoCoins = Math.floor(subtotal * (CHECKOUT_CONFIG.coins.promoCoin.maxUsagePercentage / 100));
    if (rawPromoCoins > maxPromoCoins) {
      logger.warn('[CREATE ORDER] Promo coin amount exceeds 20% cap, clamping', {
        requested: rawPromoCoins,
        capped: maxPromoCoins,
        subtotal,
      });
      rawPromoCoins = maxPromoCoins;
    }

    // Cap branded/store promo coins at 30% of subtotal (CHECKOUT_CONFIG.coins.storePromoCoin.maxUsagePercentage)
    const maxStorePromoCoins = Math.floor(subtotal * (CHECKOUT_CONFIG.coins.storePromoCoin.maxUsagePercentage / 100));
    if (rawStorePromoCoins > maxStorePromoCoins) {
      logger.warn('[CREATE ORDER] Branded coin amount exceeds 30% cap, clamping', {
        requested: rawStorePromoCoins,
        capped: maxStorePromoCoins,
        subtotal,
      });
      rawStorePromoCoins = maxStorePromoCoins;
    }

    // BUG-NEW-004 FIX: Write clamped values back into coinsUsed so that downstream
    // code (deduction queries, order document creation) uses the capped values rather
    // than the original over-limit values submitted by the client.
    if (coinsUsed) {
      coinsUsed.promoCoins = rawPromoCoins;
      coinsUsed.storePromoCoins = rawStorePromoCoins;
    }

    const coinDiscount = rawRezCoins + rawPromoCoins + rawStorePromoCoins;

    // Lock fee discount (amount already paid by customer when locking item)
    // Server-side verification: look up the user's active LockDeal to validate the claimed discount
    let lockFeeDiscount = 0;
    const clientLockFeeDiscountNum = Number(clientLockFeeDiscount) || 0;
    if (clientLockFeeDiscountNum > 0) {
      const LockPriceDeal = require('../models/LockPriceDeal').default || require('../models/LockPriceDeal');
      const activeDeal = await LockPriceDeal.findOne({
        user: userId,
        status: 'active',
        expiresAt: { $gt: new Date() },
      }).lean();
      lockFeeDiscount = activeDeal ? Math.min(clientLockFeeDiscountNum, activeDeal.discountAmount || 0) : 0;
    }

    // Validate coin discount doesn't exceed order total (prevent negative payment)
    const maxAllowedCoinDiscount = subtotal + tax + deliveryFee - discount - lockFeeDiscount;
    if (coinDiscount > maxAllowedCoinDiscount) {
      await session.abortTransaction();
      session.endSession();
      logger.error('[CREATE ORDER] Coin discount exceeds order total:', {
        coinDiscount,
        maxAllowedCoinDiscount,
      });
      return sendBadRequest(res, `Coin discount (₹${coinDiscount}) exceeds order total (₹${maxAllowedCoinDiscount})`);
    }

    // Calculate total with partner benefits, voucher, lock fee, and coin discount
    let total = subtotal + tax + deliveryFee - discount - lockFeeDiscount - coinDiscount;
    if (total < 0) total = 0;

    // Generate collision-safe order number (timestamp + random suffix)
    const randomSuffix = randomInt(100000, 999999);
    const orderNumber = `ORD${Date.now()}${randomSuffix}`;

    // Get primary store - use storeId from request (for multi-store orders) or extract from first item
    const primaryStoreId = storeId || orderItems[0]?.store;

    // Check if store is active and not suspended before allowing order creation
    if (primaryStoreId) {
      const storeCheck = await Store.findById(primaryStoreId).select('isActive isSuspended').lean().session(session);
      if (!storeCheck || !storeCheck.isActive || storeCheck.isSuspended === true) {
        await session.abortTransaction();
        session.endSession();
        return sendBadRequest(res, 'This store is currently unavailable');
      }
    }

    // Validate fulfillment type against store serviceCapabilities
    const FULFILLMENT_TO_CAPABILITY: Record<string, string> = {
      delivery: 'homeDelivery',
      pickup: 'storePickup',
      drive_thru: 'driveThru',
      dine_in: 'dineIn',
    };

    // Fetch store once for fulfillment validation, address lookup, and details
    const primaryStoreDoc =
      fulfillmentType !== 'delivery' && primaryStoreId
        ? await Store.findById(primaryStoreId).select('serviceCapabilities name location').lean().session(session)
        : null;

    if (fulfillmentType !== 'delivery' && primaryStoreId) {
      const capKey = FULFILLMENT_TO_CAPABILITY[fulfillmentType];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const capEnabled = (primaryStoreDoc?.serviceCapabilities as any)?.[capKey]?.enabled;
      if (!capEnabled) {
        await session.abortTransaction();
        session.endSession();
        return sendBadRequest(res, `This store does not support ${fulfillmentType.replace('_', ' ')} orders`);
      }
    }

    // Map fulfillment type to delivery method
    const FULFILLMENT_TO_METHOD: Record<string, string> = {
      delivery: 'standard',
      pickup: 'pickup',
      drive_thru: 'drive_thru',
      dine_in: 'dine_in',
    };
    const deliveryMethod = FULFILLMENT_TO_METHOD[fulfillmentType] || 'standard';

    // For non-delivery fulfillment types, override delivery fee to 0
    const finalDeliveryFee = fulfillmentType === 'delivery' ? deliveryFee : 0;

    // Recalculate total if delivery fee changed due to fulfillment type
    let finalTotal = total;
    if (finalDeliveryFee !== deliveryFee) {
      finalTotal = subtotal + tax + finalDeliveryFee - discount - lockFeeDiscount - coinDiscount;
      if (finalTotal < 0) finalTotal = 0;
    }

    // Build delivery address: for non-delivery types, use minimal address or store address
    let orderDeliveryAddress = deliveryAddress;
    if (fulfillmentType !== 'delivery' && (!deliveryAddress || !deliveryAddress.addressLine1)) {
      orderDeliveryAddress = {
        name: deliveryAddress?.name || 'Store Pickup',
        phone: deliveryAddress?.phone || '',
        addressLine1: primaryStoreDoc?.location?.address || 'Store Address',
        city: primaryStoreDoc?.location?.city || '',
        state: primaryStoreDoc?.location?.state || '',
        pincode: primaryStoreDoc?.location?.pincode || '',
        country: 'India',
      };
    }

    // Build fulfillment details
    let fulfillmentDetailsData: any = undefined;
    if (fulfillmentType !== 'delivery') {
      fulfillmentDetailsData = {
        storeAddress: primaryStoreDoc?.location?.address,
        storeCoordinates: primaryStoreDoc?.location?.coordinates,
        ...(reqFulfillmentDetails || {}),
      };
      if (fulfillmentType === 'pickup') {
        fulfillmentDetailsData.estimatedReadyTime = new Date(Date.now() + 20 * 60 * 1000);
      } else if (fulfillmentType === 'drive_thru') {
        fulfillmentDetailsData.estimatedReadyTime = new Date(Date.now() + 10 * 60 * 1000);
      }
    }

    // Create order
    const order = new Order({
      orderNumber,
      user: userId,
      store: primaryStoreId,
      fulfillmentType,
      fulfillmentDetails: fulfillmentDetailsData,
      idempotencyKey: idempotencyKey || undefined,
      items: orderItems,
      totals: {
        subtotal,
        tax,
        delivery: finalDeliveryFee,
        discount,
        lockFeeDiscount,
        cashback,
        total: finalTotal,
        paidAmount: paymentMethod === 'cod' ? 0 : finalTotal,
        platformFee,
        merchantPayout,
      },
      payment: {
        method: paymentMethod,
        // 'awaiting_payment' = order created but customer has not yet completed payment.
        // 'pending' = COD order awaiting fulfilment (payment collected on delivery).
        // This distinction lets the lifecycle job correctly identify and auto-cancel
        // online orders whose payment window has expired.
        status: paymentMethod === 'cod' ? 'pending' : 'awaiting_payment',
        coinsUsed: coinsUsed
          ? {
              rezCoins: coinsUsed.rezCoins || 0,
              promoCoins: coinsUsed.promoCoins || 0,
              storePromoCoins: coinsUsed.storePromoCoins || 0,
              totalCoinsValue:
                (coinsUsed.rezCoins || 0) + (coinsUsed.promoCoins || 0) + (coinsUsed.storePromoCoins || 0),
            }
          : undefined,
      },
      delivery: {
        method: deliveryMethod,
        status: 'pending',
        address: orderDeliveryAddress,
        deliveryFee: finalDeliveryFee,
      },
      timeline: [
        {
          status: 'placed',
          message:
            fulfillmentType === 'delivery'
              ? 'Order placed - awaiting payment'
              : fulfillmentType === 'pickup'
                ? 'Pickup order placed'
                : fulfillmentType === 'drive_thru'
                  ? 'Drive-thru order placed'
                  : fulfillmentType === 'dine_in'
                    ? 'Dine-in order placed'
                    : 'Order placed - awaiting payment',
          timestamp: new Date(),
        },
      ],
      status: 'placed',
      couponCode: cart.coupon?.code,
      specialInstructions,
      // Add redemption info if a deal code was applied
      redemption: appliedRedemption
        ? {
            code: appliedRedemption.redemptionCode,
            discount: redemptionDiscount,
            dealTitle: appliedRedemption.campaignSnapshot?.title,
          }
        : undefined,
      // Add offer redemption info if an offer voucher was applied
      offerRedemption: appliedOfferRedemption
        ? {
            code: appliedOfferRedemption.redemptionCode,
            cashback: offerRedemptionCashback,
            offerTitle:
              (appliedOfferRedemption.offer as Types.ObjectId & { title?: string })?.title || 'Offer Cashback',
          }
        : undefined,
      // Creator pick attribution
      analytics: pickId ? { attributionPickId: pickId } : undefined,

      // FT-D002 FIX: Snapshot the effective cashback rate at order-placement time.
      // cashbackService.createCashbackFromOrder() (called at delivery/settlement)
      // checks this field first; if present it skips the live getRewardConfig() call
      // so an admin changing cashback_rate_base after this order was placed has no
      // retroactive effect on the cashback amount the user was shown at checkout.
      snapshotCashbackRate: partnerBenefits.cashbackRate ?? null,
    });

    // LF-D006 FIX: order.save() can throw E11000 (duplicate key) if:
    //  (a) two concurrent requests with the same in-body idempotencyKey race past
    //      the findOne check above (TOCTOU window inside the transaction), OR
    //  (b) the same orderNumber is generated by coincidence (timestamp + random
    //      suffix collision on very high throughput).
    // An unhandled E11000 propagates as a 500.  Catch it, abort the transaction,
    // and return a user-friendly 409 instead.
    try {
      await order.save({ session });
    } catch (saveErr: any) {
      await session.abortTransaction();
      session.endSession();
      if (saveErr?.code === 11000) {
        // Duplicate idempotency key — the order already exists; return it.
        const existingOrder = idempotencyKey ? await Order.findOne({ user: userId, idempotencyKey }).lean() : null;
        if (existingOrder) {
          return sendSuccess(res, { order: existingOrder }, 'Order already exists');
        }
        return sendBadRequest(res, 'Duplicate order detected. Please retry with a new idempotency key.');
      }
      throw saveErr;
    }

    // Mark deal redemption as used if applied
    if (appliedRedemption) {
      appliedRedemption.status = 'used';
      appliedRedemption.usedAt = new Date();
      appliedRedemption.orderId = order._id;
      appliedRedemption.benefitApplied = redemptionDiscount;
      await appliedRedemption.save({ session });
    }

    // Mark offer redemption as used and credit cashback if applied
    if (appliedOfferRedemption && offerRedemptionCashback > 0) {
      // Mark as used
      appliedOfferRedemption.status = 'used';
      appliedOfferRedemption.usedDate = new Date();
      appliedOfferRedemption.order = order._id;
      appliedOfferRedemption.usedAmount = offerRedemptionCashback;
      await appliedOfferRedemption.save({ session });

      if (paymentMethod !== 'cod') {
        // Non-COD: defer cashback credit until payment is confirmed (handlePaymentSuccess)
        // Store pending cashback on the order so it can be credited on payment success
        order.pendingOfferCashback = offerRedemptionCashback;
      } else {
        // COD: credit immediately since payment confirmation never happens
        await walletService.credit({
          userId: String(order.user),
          amount: offerRedemptionCashback,
          source: 'purchase_reward',
          description: `Offer cashback from order #${order.orderNumber}`,
          operationType: 'offer_cashback',
          referenceId: String(order._id),
          referenceModel: 'Order',
          metadata: { orderId: order._id, orderNumber: order.orderNumber },
          session,
        });
        // Send push notification (async, don't wait)
        try {
          const NotificationService = require('../services/notificationService').default;
          NotificationService.sendToUser(userId.toString(), {
            title: 'Cashback Credited! 🎉',
            body: `₹${offerRedemptionCashback} cashback has been added to your wallet for order #${order.orderNumber}`,
            data: {
              type: 'cashback_credited',
              amount: offerRedemptionCashback,
              orderId: String(order._id),
              orderNumber: order.orderNumber,
            },
          }).catch((err: any) => logger.error('Failed to send cashback notification:', err));
        } catch (notifError) {
          logger.error('Failed to send cashback notification:', notifError);
        }
      }
    }

    // For COD orders, deduct stock immediately since payment confirmation never happens
    if (paymentMethod === 'cod') {
      for (const stockUpdate of stockUpdates) {
        try {
          const updateResult = await Product.findOneAndUpdate(stockUpdate.stockCheckQuery, stockUpdate.updateQuery, {
            session,
            arrayFilters: stockUpdate.arrayFilters || undefined,
            new: true,
          });

          if (!updateResult) {
            // Stock became insufficient during transaction - rollback
            await session.abortTransaction();
            session.endSession();
            logger.error('[CREATE ORDER] Stock became insufficient during order creation');
            return sendBadRequest(res, 'Stock became unavailable. Please try again.');
          }

          // Emit real-time stock update (reuse updateResult instead of separate query)
          if (stockSocketService && updateResult) {
            stockSocketService.emitStockUpdate(stockUpdate.productId!.toString(), updateResult.inventory?.stock || 0);
          }
        } catch (stockError) {
          logger.error('[CREATE ORDER] Failed to deduct stock:', stockError);
          await session.abortTransaction();
          session.endSession();
          return sendBadRequest(res, 'Failed to process order. Please try again.');
        }
      }

      // Invalidate product cache for items whose stock changed
      for (const stockUpdate of stockUpdates) {
        CacheInvalidator.invalidateProduct(stockUpdate.productId!.toString()).catch((err) =>
          logger.error('[OrderCreateCtrl] Product cache invalidation failed after stock update', {
            error: err.message,
            productId: stockUpdate.productId,
          }),
        );
      }
    }

    // BUG-01: Deduct coins at order creation time ONLY for COD orders.
    // For online payment orders, coins are deducted in paymentService.handlePaymentSuccess
    // (called from the Razorpay webhook or payment reconciliation job) AFTER payment is
    // confirmed. Deducting here for online orders causes a double deduction.
    if (coinsUsed && coinDiscount > 0 && paymentMethod === 'cod') {
      // Determine the store's root category for category-specific coin deduction
      const firstCartItem = orderCart.items[0];
      const codStoreId = firstCartItem?.store
        ? typeof firstCartItem.store === 'object'
          ? (firstCartItem.store as { _id: Types.ObjectId })._id
          : firstCartItem.store
        : null;
      const codCategory = codStoreId ? await getStoreCategorySlug(codStoreId.toString()) : null;

      // Deduct REZ coins atomically with $gte guard (prevents double-spend on concurrent requests)
      let deductedFromCategory = false;
      if (coinsUsed.rezCoins && coinsUsed.rezCoins > 0) {
        // Try category balance first, fall back to global
        if (codCategory) {
          const catDeductResult = await Wallet.findOneAndUpdate(
            {
              user: userId,
              [`categoryBalances.${codCategory}.available`]: { $gte: coinsUsed.rezCoins },
            },
            {
              $inc: {
                [`categoryBalances.${codCategory}.available`]: -coinsUsed.rezCoins,
                'balance.available': -coinsUsed.rezCoins,
                'balance.total': -coinsUsed.rezCoins,
                'statistics.totalSpent': coinsUsed.rezCoins,
              },
              $set: { lastTransactionAt: new Date() },
            },
            { new: true, session },
          );
          if (catDeductResult) {
            deductedFromCategory = true;
          }
        }

        if (!deductedFromCategory) {
          // Fall back to global ReZ coins — atomic deduction
          // BUGFIX: Replaced positional '$' with named arrayFilters ('$[rezCoin]').
          // The positional '$' operator paired with '$elemMatch' updates the FIRST element
          // that matched ANY part of the $elemMatch condition — when a wallet has multiple
          // 'rez' coin entries the wrong element could be decremented.
          // '$[rezCoin]' with arrayFilters is scoped to the exact matched element.
          const rezDeductResult = await Wallet.findOneAndUpdate(
            {
              user: userId,
              'balance.available': { $gte: coinsUsed.rezCoins },
              coins: { $elemMatch: { type: 'rez', amount: { $gte: coinsUsed.rezCoins } } },
            },
            {
              $inc: {
                'balance.available': -coinsUsed.rezCoins,
                'coins.$[rezCoin].amount': -coinsUsed.rezCoins,
                'statistics.totalSpent': coinsUsed.rezCoins,
              },
              $set: { lastTransactionAt: new Date(), 'coins.$[rezCoin].lastUsed': new Date() },
            },
            {
              new: true,
              session,
              arrayFilters: [{ 'rezCoin.type': 'rez', 'rezCoin.amount': { $gte: coinsUsed.rezCoins } }],
            },
          );

          if (!rezDeductResult) {
            await session.abortTransaction();
            session.endSession();
            logger.error('Insufficient rez coins in wallet at time of deduction', {
              userId,
              requested: coinsUsed.rezCoins,
            });
            return sendBadRequest(res, 'Insufficient REZ coins. Balance may have changed.');
          }
        }

        const { CoinTransaction } = require('../models/CoinTransaction');
        await CoinTransaction.createTransaction(
          userId.toString(),
          'spent',
          coinsUsed.rezCoins,
          'purchase',
          `Order: ${orderNumber}`,
          { orderId: order._id, orderNumber, paymentMethod },
          deductedFromCategory ? codCategory : null,
          session,
        );

        // Also update UserLoyalty.categoryCoins if deducted from category
        if (deductedFromCategory && codCategory) {
          try {
            const UserLoyalty =
              require('../models/UserLoyalty').default || require('../models/UserLoyalty').UserLoyalty;
            await UserLoyalty.findOneAndUpdate(
              { userId: userId.toString(), [`categoryCoins.${codCategory}.available`]: { $gte: coinsUsed.rezCoins } },
              { $inc: { [`categoryCoins.${codCategory}.available`]: -coinsUsed.rezCoins } },
              { session },
            );
          } catch (loyaltyErr) {
            logger.error('[CREATE ORDER] Failed to update UserLoyalty categoryCoins:', loyaltyErr);
          }
        }
      }

      // Deduct promo coins atomically
      if (coinsUsed.promoCoins && coinsUsed.promoCoins > 0) {
        // BUGFIX: Replaced positional '$' with arrayFilters '$[promoCoin]' — same
        // rationale as the rez-coin fix above: multiple promo coin entries could cause
        // the wrong element to be decremented with the positional operator.
        const promoDeductResult = await Wallet.findOneAndUpdate(
          {
            user: userId,
            coins: { $elemMatch: { type: 'promo', amount: { $gte: coinsUsed.promoCoins } } },
          },
          {
            $inc: { 'coins.$[promoCoin].amount': -coinsUsed.promoCoins },
            $set: { lastTransactionAt: new Date(), 'coins.$[promoCoin].lastUsed': new Date() },
          },
          {
            new: true,
            session,
            arrayFilters: [{ 'promoCoin.type': 'promo', 'promoCoin.amount': { $gte: coinsUsed.promoCoins } }],
          },
        );

        if (!promoDeductResult) {
          await session.abortTransaction();
          session.endSession();
          logger.error('Insufficient promo coins at time of deduction', { userId, requested: coinsUsed.promoCoins });
          return sendBadRequest(res, 'Insufficient Promo coins. Balance may have changed.');
        }
      }

      // Deduct branded coins atomically (store-specific coins)
      if (coinsUsed.storePromoCoins && coinsUsed.storePromoCoins > 0) {
        const firstItem = orderCart.items[0];
        const deductStoreId =
          typeof firstItem.store === 'object' && firstItem.store !== null && '_id' in firstItem.store
            ? (firstItem.store as { _id: Types.ObjectId })._id
            : firstItem.store;

        if (deductStoreId) {
          // BUGFIX: Replaced positional '$' with arrayFilters '$[bc]' — same rationale
          // as rez/promo fixes: multiple brandedCoin entries for different merchants
          // exist; positional '$' could update the wrong merchant's balance.
          const brandedDeductResult = await Wallet.findOneAndUpdate(
            {
              user: userId,
              brandedCoins: {
                $elemMatch: {
                  merchantId: deductStoreId,
                  amount: { $gte: coinsUsed.storePromoCoins },
                },
              },
            },
            {
              $inc: {
                'brandedCoins.$[bc].amount': -coinsUsed.storePromoCoins,
                'statistics.totalSpent': coinsUsed.storePromoCoins,
              },
              $set: { lastTransactionAt: new Date(), 'brandedCoins.$[bc].lastUsed': new Date() },
            },
            {
              new: true,
              session,
              arrayFilters: [{ 'bc.merchantId': deductStoreId, 'bc.amount': { $gte: coinsUsed.storePromoCoins } }],
            },
          );

          if (!brandedDeductResult) {
            await session.abortTransaction();
            session.endSession();
            logger.error('Insufficient branded coins at time of deduction', {
              userId,
              requested: coinsUsed.storePromoCoins,
            });
            return sendBadRequest(res, 'Insufficient store coins. Balance may have changed.');
          }
        }
      }
      // Record ledger entry for coin deduction (non-blocking — don't fail order)
      try {
        const ledgerService = require('../services/ledgerService').default || require('../services/ledgerService');
        const { Types: MongoTypes } = require('mongoose');
        const PLATFORM_FLOAT_ID = new MongoTypes.ObjectId('000000000000000000000002');
        await ledgerService.recordEntry({
          debitAccount: { type: 'user_wallet', id: new MongoTypes.ObjectId(userId) },
          creditAccount: { type: 'platform_float', id: PLATFORM_FLOAT_ID },
          amount: coinDiscount,
          coinType: 'rez',
          operationType: 'order_coin_deduction',
          referenceId: String(order._id),
          referenceModel: 'Order',
          metadata: {
            description: `Coin payment for COD order ${orderNumber}`,
            idempotencyKey: `order_coin_${String(order._id)}`,
          },
        });
      } catch (ledgerErr) {
        logger.error('[ORDER:LEDGER] Failed to create ledger entry for coin deduction (non-blocking):', ledgerErr);
      }
    }

    // Mark voucher as used if one was applied (INSIDE TRANSACTION — atomic with order creation)
    if (voucherApplied) {
      try {
        const partnerService = require('../services/partnerService').default;
        await partnerService.markVoucherUsed(userId.toString(), voucherApplied, session);
      } catch (error) {
        logger.error('[VOUCHER] Error marking voucher as used:', error);
        // Don't fail order creation if voucher marking fails
      }
    }

    // Mark coupon as used if one was applied (INSIDE TRANSACTION — atomic with order creation)
    // Check both cart.coupon (from DB) and couponCode (from request body)
    // Frontend passes couponCode in request but doesn't save it to cart DB
    const appliedCouponCodeInTx = orderCart.coupon?.code || couponCode;
    if (appliedCouponCodeInTx) {
      const couponResult = await couponService.markCouponAsUsed(
        new Types.ObjectId(userId),
        appliedCouponCodeInTx,
        order._id as Types.ObjectId,
        session,
      );
      if (!couponResult.success) {
        // ISSUE-51 FIX: If markCouponAsUsed fails (coupon already consumed, usage
        // limit exceeded, or DB error), we must abort the transaction. Previously this
        // only logged a warning and let the order through — the customer got the discount
        // but the coupon was never actually consumed, making it reusable indefinitely.
        // Throwing here causes the outer catch to abort the MongoDB session, so the order
        // is not created and the customer must retry with a valid coupon.
        logger.error('[COUPON] markCouponAsUsed failed inside transaction — aborting order:', couponResult.error);
        throw new Error(
          `Coupon could not be applied: ${couponResult.error || 'usage limit reached or coupon invalid'}`,
        );
      }
    }

    // Note: Cart is NOT cleared here - it will be cleared after successful payment
    // This allows users to retry payment if it fails

    // ATOMIC WALLET PAYMENT: If paymentMethod === 'wallet' and walletPayment is provided,
    // debit the wallet inside this same session so order creation and wallet debit are atomic.
    // This eliminates the race window where the order exists but the wallet has not been
    // debited (the bug that occurs on crash / network drop between the two separate calls).
    let walletPaymentResult: any = null;
    if (req.body.paymentMethod === 'wallet' && req.body.walletPayment?.amount) {
      const walletAmount = parseFloat(req.body.walletPayment.amount);
      const { Transaction } = await import('../models/Transaction');

      const deductResult = await Wallet.findOneAndUpdate(
        {
          user: userId,
          'balance.available': { $gte: walletAmount },
          isFrozen: { $ne: true },
        },
        {
          $inc: {
            'balance.available': -walletAmount,
            'balance.total': -walletAmount,
            'statistics.totalSpent': walletAmount,
            'limits.dailySpent': walletAmount,
          },
          $set: { lastTransactionAt: new Date() },
        },
        { new: true, session },
      );

      if (!deductResult) {
        await session.abortTransaction();
        session.endSession();
        return sendBadRequest(res, 'Insufficient wallet balance or wallet is frozen');
      }

      // Create wallet transaction record inside the same MongoDB session
      const txn = new Transaction({
        user: new mongoose.Types.ObjectId(userId),
        type: 'debit',
        category: 'spending',
        amount: walletAmount,
        currency: deductResult.currency,
        description: `Payment for order`,
        source: {
          type: 'order',
          reference: order._id,
          description: 'Wallet checkout',
          metadata: { orderNumber: order.orderNumber },
        },
        balanceBefore: deductResult.balance.available + walletAmount,
        balanceAfter: deductResult.balance.available,
        status: {
          current: 'completed',
          history: [{ status: 'completed', timestamp: new Date() }],
        },
      });
      await txn.save({ session });

      // Mark order payment as paid within the same session
      order.payment = {
        ...(order.payment || {}),
        status: 'paid',
        transactionId: String(txn._id),
        paidAt: new Date(),
      } as any;
      await order.save({ session });

      walletPaymentResult = {
        transactionId: String(txn._id),
        amount: walletAmount,
        newBalance: deductResult.balance.available,
      };
      logger.info('[ORDER] Atomic wallet debit completed', {
        orderId: String(order._id),
        transactionId: String(txn._id),
        amount: walletAmount,
      });
    }

    // Commit the transaction.
    // DP-D003 FIX: Retry commitTransaction() on UnknownTransactionCommitResult so that
    // a primary stepdown during commit does not silently lose the order.
    // The business-logic body has already run; only the commit call is retried.
    {
      const MAX_COMMIT_RETRIES = 5;
      let commitAttempt = 0;
      while (true) {
        try {
          await session.commitTransaction();
          break;
        } catch (commitErr: any) {
          const isUnknown =
            (Array.isArray(commitErr.errorLabels) &&
              commitErr.errorLabels.includes('UnknownTransactionCommitResult')) ||
            commitErr.code === 50;
          commitAttempt++;
          if (isUnknown && commitAttempt < MAX_COMMIT_RETRIES) {
            const delay = Math.min(100 * Math.pow(2, commitAttempt - 1), 2000);
            logger.warn('[ORDER] UnknownTransactionCommitResult — retrying commit', {
              attempt: commitAttempt,
              delayMs: delay,
              code: commitErr.code,
            });
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw commitErr;
        }
      }
    }
    session.endSession();

    // SCALEPILOT FIX — Issue #1: Synchronous reward calculation removed from hot path.
    //
    // BEFORE: checkTransactionBonus() ran with `await` INSIDE the transaction block,
    //         adding a DB read (count orders) to every single order creation path.
    //         At 10x load (50-70 orders/min → 500-700/min) this added ~20-40 ms of
    //         avoidable latency and an extra DB connection slot to every request.
    //
    // AFTER:  Deferred to a fire-and-forget call AFTER commitTransaction(). The bonus
    //         check is non-critical (bonus is only *awarded* at delivery, not here) so
    //         it does not need to block the response.
    //
    // TODO (infrastructure): When a proper job queue is available, replace this
    //         fire-and-forget with QueueService.enqueue('transaction-bonus-check', { userId })
    //         so that failures are retried automatically and the work is off the API pod entirely.
    setImmediate(() => {
      partnerBenefitsService.checkTransactionBonus(userId.toString()).catch((error: any) => {
        logger.error('[PARTNER BENEFITS] Error checking transaction bonus (async):', error);
      });
    });

    // NOTE: Merchant wallet credit moved to delivery (see updateOrderStatus).
    // Both COD and online payment orders only credit merchant wallet when status = 'delivered'.

    // Populate order for response
    const populatedOrder = await Order.findById(order._id)
      .populate('items.product', 'name image images')
      .populate('items.store', 'name logo')
      .populate('user', 'profile.firstName profile.lastName profile.phoneNumber')
      .lean();

    // Create activity for order placement
    if (populatedOrder) {
      const storeData = populatedOrder.items[0]?.store as
        | Types.ObjectId
        | { name?: string; merchant?: Types.ObjectId }
        | undefined;
      const storeName =
        storeData && typeof storeData === 'object' && 'name' in storeData
          ? (storeData as { name?: string }).name || 'Store'
          : 'Store';
      await activityService.order.onOrderPlaced(
        new Types.ObjectId(userId),
        populatedOrder._id as Types.ObjectId,
        storeName,
        total,
      );
    }

    // Emit gamification event for order creation
    gamificationEventBus.emit('order_placed', {
      userId,
      entityId: String(populatedOrder?._id),
      entityType: 'order',
      amount: finalTotal,
      source: { controller: 'orderController', action: 'createOrder' },
    });

    // Phase 8: Publish to order queue for async side effects (Strangler Fig — dual mode)
    publishOrderEvent({
      eventId: `order-placed:${String(populatedOrder?._id)}:${Date.now()}`,
      eventType: 'order.placed',
      userId,
      merchantId: populatedOrder?.items?.[0]?.store?.toString(),
      storeId: populatedOrder?.items?.[0]?.store?.toString(),
      payload: {
        orderId: String(populatedOrder?._id),
        orderNumber: populatedOrder?.orderNumber,
        amount: finalTotal,
        items: populatedOrder?.items?.map((item: any) => ({
          productId: item.product?.toString() || item.product?._id?.toString(),
          name: item.product?.name || 'Product',
          quantity: item.quantity,
          price: item.price,
        })),
      },
      createdAt: new Date().toISOString(),
    }).catch((err: any) => logger.warn('[OrderCreate] publishOrderEvent failed', { error: err.message }));

    // Send notifications to customer and merchant (all independent — run in parallel)
    try {
      type PopulatedUser = {
        phoneNumber?: string;
        email?: string;
        phone?: string;
        fullName?: string;
        profile?: { firstName?: string; phoneNumber?: string };
      };
      type PopulatedStore = { name?: string };
      const user = populatedOrder?.user as Types.ObjectId | PopulatedUser | undefined;
      const userObj = user && typeof user === 'object' && 'email' in user ? (user as PopulatedUser) : null;
      const userPhone = userObj?.profile?.phoneNumber || userObj?.phoneNumber || userObj?.phone;
      const userName = userObj?.profile?.firstName || userObj?.fullName || 'Customer';
      const userEmail = userObj?.email;
      const storeData = populatedOrder?.items[0]?.store as Types.ObjectId | PopulatedStore | undefined;
      const storeName =
        storeData && typeof storeData === 'object' && 'name' in storeData
          ? (storeData as PopulatedStore).name || 'Store'
          : 'Store';
      const populatedOrderNumber = populatedOrder?.orderNumber || String(order._id);

      const notifPromises: Promise<any>[] = [];

      // Send SMS to customer
      if (userPhone) {
        notifPromises.push(SMSService.sendOrderConfirmation(userPhone, populatedOrderNumber, storeName));
      }

      // Send email to customer
      if (userEmail && userName) {
        const emailOrderItems =
          populatedOrder?.items.map((item: any) => ({
            name: item.product?.name || 'Product',
            quantity: item.quantity,
            price: item.price * item.quantity,
          })) || [];

        notifPromises.push(
          EmailService.sendOrderConfirmation(userEmail, userName, {
            orderId: String(order._id),
            orderNumber: populatedOrderNumber,
            items: emailOrderItems,
            subtotal: populatedOrder?.totals?.subtotal || 0,
            deliveryFee: populatedOrder?.delivery?.deliveryFee || 0,
            total: populatedOrder?.totals?.total || 0,
            estimatedDelivery: 'Within 30-45 minutes',
            storeName,
            deliveryAddress: deliveryAddress,
          }),
        );
      }

      // Send new order alert to merchant (fetch store contact in parallel with customer notifications)
      if ((storeData as any)?._id) {
        notifPromises.push(
          Store.findById((storeData as any)._id)
            .select('contact merchant')
            .lean()
            .then(async (store) => {
              if (!store) return;
              const merchantPhone = store?.contact?.phone;
              const storeLean = store as unknown as { merchant?: Types.ObjectId };
              const merchantId = storeLean?.merchant?.toString();

              const merchantPromises: Promise<any>[] = [];

              if (merchantPhone) {
                merchantPromises.push(
                  SMSService.sendNewOrderAlertToMerchant(merchantPhone, populatedOrderNumber, userName, total),
                );
                if (total > 10000) {
                  merchantPromises.push(SMSService.sendHighValueOrderAlert(merchantPhone, populatedOrderNumber, total));
                }
              }

              if (merchantId) {
                merchantPromises.push(
                  merchantNotificationService.notifyNewOrder({
                    merchantId,
                    orderId: String(order._id),
                    orderNumber: populatedOrderNumber,
                    customerName: userName,
                    totalAmount: total,
                    itemCount: populatedOrder?.items?.length || 0,
                    paymentMethod,
                  }),
                );

                // Real-time socket emit to merchant dashboard
                try {
                  const storeId = (storeData as any)?._id?.toString();
                  const orderPayload = {
                    orderId: String(order._id),
                    orderNumber: populatedOrderNumber,
                    customerName: userName,
                    totalAmount: total,
                    itemCount: populatedOrder?.items?.length || 0,
                    paymentMethod,
                    status: order.status,
                  };
                  // Emit to merchant:storeId room (for real-time merchant app dashboard)
                  if (storeId) {
                    orderSocketService.emitMerchantNewOrder(storeId, merchantId, orderPayload);
                  }
                  // Also emit legacy event for backward compatibility
                  orderSocketService.emitToMerchant(merchantId, 'new_order', orderPayload);
                  orderSocketService.emitToMerchant(merchantId, 'order-event', { type: 'new_order', ...orderPayload });
                } catch (socketErr) {
                  logger.warn('[ORDER] Real-time socket emit failed:', socketErr);
                }
              }

              await Promise.all(merchantPromises);
            }),
        );
      }

      // Send push notification to customer (fire-and-forget)
      pushNotificationService
        .sendPushToUser(String(userId), {
          title: 'Order Placed!',
          body: `Your order #${populatedOrderNumber} has been placed successfully`,
          data: { type: 'order_placed', orderId: String(order._id), orderNumber: populatedOrderNumber },
        })
        .catch((err) => logger.warn('[ORDER] Customer push notification failed (non-fatal):', err));

      const notifResults = await Promise.allSettled(notifPromises);

      // P1-9 FIX: Check if merchant notifications failed. If all merchant notification
      // channels (SMS, socket, in-app) failed, enqueue a BullMQ retry job so the
      // merchant still gets alerted about the new order.
      const merchantNotifFailed = notifResults.some((r) => r.status === 'rejected');
      if (merchantNotifFailed) {
        const storeId = (storeData as any)?._id?.toString();
        const merchantIdForRetry = storeId
          ? await Store.findById(storeId)
              .select('merchant')
              .lean()
              .then((s: any) => s?.merchant?.toString())
          : undefined;

        if (merchantIdForRetry) {
          try {
            const { notificationQueue } = await import('../config/bullmq-queues');
            await notificationQueue.add(
              'retry-merchant-notification',
              {
                orderId: String(order._id),
                merchantId: merchantIdForRetry,
                storeId: storeId || '',
                orderNumber: populatedOrderNumber,
                customerName: userName,
                totalAmount: total,
                itemCount: populatedOrder?.items?.length || 0,
                paymentMethod,
                attempt: 1,
              },
              {
                delay: 30000, // 30 seconds before first retry
                attempts: 5,
                backoff: { type: 'exponential', delay: 30000 },
              },
            );
            logger.warn(`[ORDER] Merchant notification failed — enqueued retry job for order ${populatedOrderNumber}`);
          } catch (queueErr) {
            logger.error('[ORDER] Failed to enqueue merchant notification retry:', queueErr);
          }
        }
      }
    } catch (error) {
      logger.error('[ORDER] Error sending notifications:', error);
      // Don't fail order creation if notifications fail

      // P1-9: Last-resort retry — if the entire notification block threw, still try
      // to enqueue a retry job so the merchant is eventually notified.
      try {
        const retryOrder = (await Order.findById(order._id).populate('items.store', 'merchant').lean()) as any;
        const retryStoreId = retryOrder?.items?.[0]?.store?._id?.toString();
        if (retryStoreId) {
          const merchantIdForRetry = retryOrder?.items?.[0]?.store?.merchant?.toString();
          if (merchantIdForRetry) {
            const { notificationQueue } = await import('../config/bullmq-queues');
            await notificationQueue.add(
              'retry-merchant-notification',
              {
                orderId: String(order._id),
                merchantId: merchantIdForRetry,
                storeId: retryStoreId,
                orderNumber: retryOrder?.orderNumber || String(order._id),
                customerName: retryOrder?.user?.profile?.firstName || 'Customer',
                totalAmount: total,
                itemCount: retryOrder?.items?.length || 0,
                paymentMethod,
                attempt: 1,
              },
              {
                delay: 30000,
                attempts: 5,
                backoff: { type: 'exponential', delay: 30000 },
              },
            );
            logger.warn(
              `[ORDER] All notifications failed — enqueued retry job for order ${retryOrder?.orderNumber || order._id}`,
            );
          }
        }
      } catch (retryQueueErr) {
        logger.error('[ORDER] Failed to enqueue fallback notification retry:', retryQueueErr);
      }
    }

    const userWallet = await Wallet.findOne({ user: userId }, { 'balance.available': 1 }).lean();
    const availableCoins = userWallet?.balance?.available ?? 0;
    const coinsApplicable = Math.min(availableCoins, finalTotal);

    // TABLE-SEC-001: Generate table token for dine-in orders
    // This token allows the customer to use the /table namespace for waiter calls
    let tableToken: string | null = null;
    if (fulfillmentType === 'dine_in' && primaryStoreId) {
      try {
        // Get store slug for the table token
        const storeDoc = await Store.findById(primaryStoreId).select('slug delivery.tableNumber').lean();
        if (storeDoc?.slug) {
          const tableNumber =
            (storeDoc as any).delivery?.tableNumber || (populatedOrder as any)?.delivery?.tableNumber || '1';
          tableToken = generateTableToken({
            storeSlug: storeDoc.slug,
            tableNumber: String(tableNumber),
            expirationSeconds: 4 * 60 * 60, // 4 hours
          });
          if (tableToken) {
            logger.debug('[Order] Generated table token for dine-in order', {
              orderId: (populatedOrder as any)?._id,
              storeSlug: storeDoc.slug,
            });
          }
        }
      } catch (err) {
        // Non-critical: table token generation failure should not fail the order
        logger.warn('[Order] Failed to generate table token:', err);
      }
    }

    const responsePayload = populatedOrder
      ? {
          ...populatedOrder,
          coinsApplicable,
          ...(walletPaymentResult ? { walletPaymentResult } : {}),
          ...(tableToken ? { tableToken } : {}),
        }
      : populatedOrder;
    sendSuccess(res, responsePayload, 'Order created successfully', 201);

    // Fire marketing signals (non-blocking, after response sent)
    try {
      const uid = userId.toString();
      const mid = String((populatedOrder as any).merchant || (populatedOrder as any).merchantId || '');

      // Location signal: update user's area from delivery address
      if (deliveryAddress?.city || deliveryAddress?.area || deliveryAddress?.pincode) {
        MarketingSignalService.locationSignal(uid, {
          city: deliveryAddress.city,
          area: deliveryAddress.area || deliveryAddress.addressLine2,
          pincode: String(deliveryAddress.pincode || ''),
        });
      }

      // Conversion signal: attribute to any active campaign for this merchant
      if (mid) {
        MarketingSignalService.trackConversion(mid, uid);
      }
    } catch {
      // Intentionally swallowed — marketing signals must never fail an order
    }
  } catch (error: any) {
    // Rollback transaction on error
    await session.abortTransaction();
    session.endSession();

    logger.error('[CREATE ORDER] Error:', error);
    logger.error('[CREATE ORDER] Error message: ' + error.message);
    logger.error('[CREATE ORDER] Error stack:', error.stack);
    logger.error('[CREATE ORDER] Error name:', error.name);

    // Log more details about the error
    if (error.name === 'TypeError') {
      logger.error('[CREATE ORDER] This is a TypeError - likely null/undefined access');
    }

    throw new AppError(`Failed to create order: ${error.message}`, 500);
  }
});
