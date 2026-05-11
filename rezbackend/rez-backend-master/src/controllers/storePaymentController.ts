/**
 * Store Payment Controller
 *
 * Handles all store payment related operations including:
 * - QR code generation and management
 * - Store payment settings
 * - Payment initiation and confirmation
 * - Offers retrieval for store payments
 */

import { Request, Response } from 'express';
import { logger } from '../config/logger';
import { Store, IStorePaymentSettings } from '../models/Store';
import mongoose, { Types } from 'mongoose';
import { StorePayment, IPaymentRewards } from '../models/StorePayment';
import { Product } from '../models/Product';
import { PosBill } from '../models/PosBill';
import stripeService from '../services/stripeService';
import { Wallet } from '../models/Wallet';
import { Transaction } from '../models/Transaction';
import { CoinTransaction } from '../models/CoinTransaction';
import Discount from '../models/Discount';
import { Category } from '../models/Category';
import { MainCategorySlug } from '../models/CoinTransaction';
import { ledgerService } from '../services/ledgerService';
import subscriptionBenefitsService from '../services/subscriptionBenefitsService';
import { priveMultiplierService } from '../services/priveMultiplierService';
import { asyncHandler } from '../utils/asyncHandler';
import { withCache } from '../utils/cacheHelper';
import { MerchantRewardJournal } from '../models/MerchantRewardJournal';
import { fetchPaymentDetails, createRazorpayOrder } from '../services/razorpayService';
import { razorpayConfig } from '../config/razorpay.config';
// Note: StorePromoCoin model removed - using wallet.brandedCoins instead

const VALID_MAIN_CATEGORY_SLUGS: MainCategorySlug[] = [
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

// CD-CRIT-06 FIX: Server-side price validation for line items.
//
// Previously initiateStorePayment accepted client-submitted prices (via lineItems)
// without checking them against the canonical Product.pricing.selling. An attacker
// or compromised client could submit arbitrary prices and pay less than the real
// bill amount.
//
// This function validates every line item price against the product master in two
// passes (prefer productId lookup, fall back to name-based matching within the store).
// Items with no match in the Product catalog (e.g. manually-entered POS items) are
// flagged but not rejected — they are expected in some merchant flows. However, a
// price mismatch on any identified product is treated as a CRITICAL fraud attempt and
// causes the entire payment initiation to be rejected.
//
// Tolerance: 0.1% (0.001) to handle floating-point representation differences.
// Anything above that is considered a manipulation attempt.
//
// @param lineItems  Items submitted by the client (may include productId).
// @param storeId    The store being paid at — used for name-based fallback lookup.
// @param userId     The user initiating payment — included in the security log.
// @returns          { valid: true } on success, or { valid: false, error: string }
//                   with a CRITICAL security log entry on mismatch.
async function validateLineItemPrices(
  lineItems: Array<{ name: string; qty: number; price: number; productId?: string }>,
  storeId: string,
  userId: string,
): Promise<{ valid: true } | { valid: false; error: string }> {
  if (!lineItems || lineItems.length === 0) {
    return { valid: true };
  }

  // Pass 1: Collect all productId lookups and all names for pass 2 fallback
  const productIdToItem = new Map<string, (typeof lineItems)[0]>();
  const itemNames: string[] = [];
  for (const item of lineItems) {
    if (item.productId) {
      productIdToItem.set(item.productId, item);
    } else {
      itemNames.push(item.name);
    }
  }

  // Pass 1 — resolve canonical prices by productId (preferred path)
  const productIdList = [...productIdToItem.keys()];
  const canonicalById = new Map<string, number>();
  if (productIdList.length > 0) {
    const products = await Product.find({ _id: { $in: productIdList } })
      .select('_id pricing.selling')
      .lean();
    for (const p of products) {
      canonicalById.set(p._id.toString(), p.pricing?.selling ?? 0);
    }
  }

  // Pass 2 — resolve canonical prices by name within the store (fallback for items
  // without productId, e.g. manually entered POS items)
  const canonicalByName = new Map<string, number>();
  if (itemNames.length > 0) {
    const productsByName = await Product.find({
      store: new Types.ObjectId(storeId),
      name: { $in: itemNames },
      isDeleted: { $ne: true },
    })
      .select('_id name pricing.selling')
      .lean();
    for (const p of productsByName) {
      canonicalByName.set(p.name, p.pricing?.selling ?? 0);
    }
  }

  // Validate each item
  for (const item of lineItems) {
    let serverPrice: number | null = null;

    if (item.productId && canonicalById.has(item.productId)) {
      serverPrice = canonicalById.get(item.productId)!;
    } else if (canonicalByName.has(item.name)) {
      serverPrice = canonicalByName.get(item.name)!;
    } else {
      // No matching product found — likely a manually-entered POS item.
      // Flag it but do not reject; merchant POS flows do this legitimately.
      logger.warn('[STORE PAYMENT] Price validation: no product match for line item', {
        itemName: item.name,
        clientPrice: item.price,
        storeId,
        userId,
        hasProductId: !!item.productId,
      });
      continue;
    }

    if (serverPrice === null || serverPrice === undefined) continue;

    const clientPrice = item.price;
    const diff = Math.abs(clientPrice - serverPrice);
    const relativeDiff = serverPrice > 0 ? diff / serverPrice : diff;

    if (relativeDiff > 0.001) {
      // >0.1% difference — clear manipulation attempt
      logger.error(
        '[SECURITY] CRITICAL — Price mismatch detected at store payment initiation ' +
          '(CD-CRIT-06 fraud vector blocked)',
        {
          userId,
          storeId,
          itemName: item.name,
          productId: item.productId ?? null,
          clientPrice,
          serverPrice,
          diff,
          relativeDiff,
          lineItems,
          timestamp: new Date().toISOString(),
          severity: 'CRITICAL',
          event: 'CD-CRIT-06_PRICE_MANIPULATION_ATTEMPT',
        },
      );

      return {
        valid: false,
        error: `Price mismatch for "${item.name}": submitted ₹${clientPrice} but server price is ₹${serverPrice}. Please refresh and try again.`,
      };
    }
  }

  return { valid: true };
}

// QR code handlers moved to qrController.ts

// ==================== PAYMENT SETTINGS HANDLERS ====================

/**
 * Get payment settings for a store
 * GET /api/store-payment/settings/:storeId
 */
export const getPaymentSettings = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const merchantId = req.merchantId;

  const store = await withCache(`store:payment-config:${storeId}:${merchantId}`, 300, () =>
    Store.findOne({ _id: storeId, merchantId })
      .select('name isActive paymentSettings rewardRules storeQR category')
      .lean(),
  );

  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found or you do not have permission to access it',
    });
  }

  // Return settings with defaults if not set
  const defaultPaymentSettings = {
    acceptUPI: true,
    acceptCards: true,
    acceptPayLater: false,
    acceptRezCoins: true,
    acceptPromoCoins: true,
    maxCoinRedemptionPercent: 100,
    allowHybridPayment: true,
    allowOffers: true,
    allowCashback: true,
    upiId: '',
    upiName: '',
  };

  const defaultRewardRules = {
    baseCashbackPercent: 5,
    reviewBonusCoins: 5,
    socialShareBonusCoins: 10,
    minimumAmountForReward: 100,
    extraRewardThreshold: undefined,
    extraRewardCoins: undefined,
    visitMilestoneRewards: [],
  };

  res.status(200).json({
    success: true,
    data: {
      storeName: store.name,
      paymentSettings: { ...defaultPaymentSettings, ...store.paymentSettings },
      rewardRules: { ...defaultRewardRules, ...store.rewardRules },
    },
  });
});

/**
 * Update payment settings for a store
 * PUT /api/store-payment/settings/:storeId
 */
export const updatePaymentSettings = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const { paymentSettings, rewardRules } = req.body;
  const merchantId = req.merchantId;

  // Verify store belongs to merchant
  const store = await withCache(`store:payment-config:${storeId}:${merchantId}`, 300, () =>
    Store.findOne({ _id: storeId, merchantId })
      .select('name isActive paymentSettings rewardRules storeQR category')
      .lean(),
  );

  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found or you do not have permission to access it',
    });
  }

  // Validate payment settings
  if (paymentSettings) {
    if (
      paymentSettings.maxCoinRedemptionPercent !== undefined &&
      (paymentSettings.maxCoinRedemptionPercent < 0 || paymentSettings.maxCoinRedemptionPercent > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: 'maxCoinRedemptionPercent must be between 0 and 100',
      });
    }
  }

  // Validate reward rules
  if (rewardRules) {
    if (
      rewardRules.baseCashbackPercent !== undefined &&
      (rewardRules.baseCashbackPercent < 0 || rewardRules.baseCashbackPercent > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: 'baseCashbackPercent must be between 0 and 100',
      });
    }
  }

  // Update settings
  const updateData: any = {};
  if (paymentSettings) {
    updateData.paymentSettings = { ...store.paymentSettings, ...paymentSettings };
  }
  if (rewardRules) {
    updateData.rewardRules = { ...store.rewardRules, ...rewardRules };
  }

  const updatedStore = await Store.findByIdAndUpdate(storeId, updateData, { new: true }).select(
    'paymentSettings rewardRules name',
  );

  res.status(200).json({
    success: true,
    message: 'Payment settings updated successfully',
    data: {
      storeName: updatedStore?.name,
      paymentSettings: updatedStore?.paymentSettings,
      rewardRules: updatedStore?.rewardRules,
    },
  });
});

// ==================== OFFERS HANDLERS ====================

/**
 * Get offers for store payment
 * GET /api/store-payment/offers/:storeId
 */
export const getStorePaymentOffers = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const { amount } = req.query;
  const _userId = req.userId;

  // Validate amount if provided
  const billAmount = amount ? parseFloat(amount as string) : 0;

  // Get store with payment settings
  const store = await Store.findById(storeId)
    .select('paymentSettings rewardRules offers name')
    .populate('offers.discounts')
    .lean();

  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found',
    });
  }

  // Check if store allows offers
  if (!store.paymentSettings?.allowOffers) {
    return res.status(200).json({
      success: true,
      data: {
        storeOffers: [],
        bankOffers: [],
        rezOffers: [],
        bestOffer: null,
        message: 'This store does not currently have offers enabled',
      },
    });
  }

  // Build store offers from store data
  const storeOffers = [];

  // Basic cashback offer from reward rules
  if (store.paymentSettings?.allowCashback && store.rewardRules?.baseCashbackPercent) {
    storeOffers.push({
      id: `cashback-${storeId}`,
      type: 'CASHBACK',
      title: `${store.rewardRules.baseCashbackPercent}% Cashback`,
      description: `Earn ${store.rewardRules.baseCashbackPercent}% cashback on your payment`,
      value: store.rewardRules.baseCashbackPercent,
      valueType: 'PERCENTAGE',
      minAmount: store.rewardRules.minimumAmountForReward || 0,
      isAutoApplied: true,
    });
  }

  // Extra reward threshold offer
  if (store.rewardRules?.extraRewardThreshold && store.rewardRules?.extraRewardCoins) {
    storeOffers.push({
      id: `bonus-${storeId}`,
      type: 'BONUS_COINS',
      title: `Spend ₹${store.rewardRules.extraRewardThreshold}, Get ${store.rewardRules.extraRewardCoins} Coins`,
      description: `Earn ${store.rewardRules.extraRewardCoins} bonus coins when you spend ₹${store.rewardRules.extraRewardThreshold} or more`,
      value: store.rewardRules.extraRewardCoins,
      valueType: 'FIXED_COINS',
      minAmount: store.rewardRules.extraRewardThreshold,
      isAutoApplied: true,
    });
  }

  // Fetch bank/card offers from Discount model
  const bankOffers: any[] = [];
  try {
    const cardDiscounts = await Discount.find({
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
      applicableOn: { $in: ['card_payment', 'bill_payment', 'all'] },
      $or: [
        { scope: 'global' },
        { scope: 'store', storeId: storeId },
        { scope: 'merchant', merchantId: store.merchantId },
      ],
      minOrderValue: { $lte: billAmount || 0 },
    })
      .sort({ priority: -1 })
      .limit(5)
      .lean();

    for (const discount of cardDiscounts) {
      const calculatedDiscount = discount.calculateDiscount(billAmount || 0);
      bankOffers.push({
        id: discount._id.toString(),
        type: discount.type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
        title: discount.name,
        description:
          discount.description ||
          `Get ${discount.type === 'percentage' ? discount.value + '%' : '₹' + discount.value} off`,
        value: discount.value,
        valueType: discount.type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
        minAmount: discount.minOrderValue,
        maxDiscount: discount.maxDiscountAmount,
        calculatedDiscount,
        bankNames: discount.bankNames || [],
        cardType: discount.cardType || 'all',
        paymentMethod: discount.paymentMethod || 'card',
        metadata: discount.metadata,
      });
    }
  } catch (discountError) {
    logger.error('Failed to fetch bank offers:', discountError);
  }

  // Fetch ReZ platform offers (global discounts without store/merchant restriction)
  const rezOffers: any[] = [];
  try {
    const platformDiscounts = await Discount.find({
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
      scope: 'global',
      applicableOn: { $in: ['bill_payment', 'all'] },
      minOrderValue: { $lte: billAmount || 0 },
    })
      .sort({ priority: -1 })
      .limit(3)
      .lean();

    for (const discount of platformDiscounts) {
      // Skip if already added to bank offers
      if (bankOffers.some((o) => o.id === discount._id.toString())) continue;

      const calculatedDiscount = discount.calculateDiscount(billAmount || 0);
      rezOffers.push({
        id: discount._id.toString(),
        type: discount.type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
        title: discount.name,
        description:
          discount.description ||
          `ReZ Offer: ${discount.type === 'percentage' ? discount.value + '%' : '₹' + discount.value} off`,
        value: discount.value,
        valueType: discount.type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
        minAmount: discount.minOrderValue,
        maxDiscount: discount.maxDiscountAmount,
        calculatedDiscount,
        isRezOffer: true,
        metadata: discount.metadata,
      });
    }
  } catch (discountError) {
    logger.error('Failed to fetch ReZ offers:', discountError);
  }

  // Calculate best offer from all offer types
  let bestOffer = null;
  if (billAmount > 0) {
    // Combine all offers
    const allOffers = [
      ...storeOffers.map((o) => ({ ...o, source: 'store' })),
      ...bankOffers.map((o) => ({ ...o, source: 'bank' })),
      ...rezOffers.map((o) => ({ ...o, source: 'rez' })),
    ].filter((offer) => billAmount >= (offer.minAmount || 0));

    if (allOffers.length > 0) {
      // Find offer with highest calculated discount value
      bestOffer = allOffers.reduce((best, current) => {
        const bestValue =
          best.calculatedDiscount || (best.valueType === 'PERCENTAGE' ? (billAmount * best.value) / 100 : best.value);
        const currentValue =
          current.calculatedDiscount ||
          (current.valueType === 'PERCENTAGE' ? (billAmount * current.value) / 100 : current.value);
        return currentValue > bestValue ? current : best;
      });
    }
  }

  res.status(200).json({
    success: true,
    data: {
      storeOffers,
      bankOffers,
      rezOffers,
      bestOffer,
    },
  });
});

// ==================== PAYMENT HANDLERS ====================

/**
 * Initiate store payment
 * POST /api/store-payment/initiate
 */
export const initiateStorePayment = asyncHandler(async (req: Request, res: Response) => {
  const { storeId, amount, paymentMethod, coinsToRedeem, offersApplied } = req.body;
  const userId = req.userId;
  const lineItems = req.body.lineItems as
    | Array<{
        name: string;
        qty: number;
        price: number;
        gstRate?: number;
        gstAmount?: number;
        productId?: string; // CD-CRIT-06: enables server-side price validation
      }>
    | undefined;

  // Validate required fields
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  if (!storeId || !amount || !paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'storeId, amount, and paymentMethod are required',
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be greater than 0',
    });
  }

  // Idempotency: if client provides clientTxnId and we've seen it, return the existing payment
  const clientTxnId = req.body.clientTxnId as string | undefined;
  if (clientTxnId) {
    const existing = await StorePayment.findOne({ clientTxnId }).lean();
    if (existing) {
      logger.info(`[STORE PAYMENT] Idempotent replay: clientTxnId=${clientTxnId} → paymentId=${existing.paymentId}`);
      res.status(200).json({
        success: true,
        message: 'Payment already initiated (idempotent)',
        data: { paymentId: existing.paymentId, status: existing.status, alreadyProcessed: true },
      });
      return;
    }
  }

  // Get store
  const store = await Store.findById(storeId).select('paymentSettings rewardRules name isActive').lean();

  if (!store || !store.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Store not found or is inactive',
    });
  }

  // Validate payment method is accepted
  const settings = (store.paymentSettings || {}) as IStorePaymentSettings;
  if (paymentMethod === 'upi' && !settings.acceptUPI) {
    return res.status(400).json({
      success: false,
      message: 'This store does not accept UPI payments',
    });
  }
  if (
    (paymentMethod === 'card' || paymentMethod === 'credit_card' || paymentMethod === 'debit_card') &&
    !settings.acceptCards
  ) {
    return res.status(400).json({
      success: false,
      message: 'This store does not accept card payments',
    });
  }

  // Calculate coin redemption
  let coinRedemptionAmount = 0;
  const coinRedemption = {
    rezCoins: coinsToRedeem?.rezCoins || 0,
    promoCoins: coinsToRedeem?.promoCoins || 0,
    brandedCoins: coinsToRedeem?.brandedCoins || 0, // Merchant-specific coins
    payBill: coinsToRedeem?.payBill || 0,
    totalAmount: 0,
  };

  if (coinsToRedeem) {
    const maxCoins = (amount * (settings.maxCoinRedemptionPercent || 100)) / 100;

    // Validate coin types are accepted
    if (coinsToRedeem.rezCoins && !settings.acceptRezCoins) {
      return res.status(400).json({
        success: false,
        message: 'This store does not accept ReZ Coins',
      });
    }
    if (coinsToRedeem.promoCoins && !settings.acceptPromoCoins) {
      return res.status(400).json({
        success: false,
        message: 'This store does not accept Promo Coins',
      });
    }

    // Calculate total coin redemption (ReZ + Promo + Branded)
    coinRedemptionAmount = coinRedemption.rezCoins + coinRedemption.promoCoins + coinRedemption.brandedCoins;

    coinRedemption.totalAmount = coinRedemptionAmount;

    if (coinRedemptionAmount > maxCoins) {
      return res.status(400).json({
        success: false,
        message: `Maximum coin redemption is ₹${maxCoins} (${settings.maxCoinRedemptionPercent}% of bill)`,
      });
    }

    // Validate user has enough coins
    if (coinRedemptionAmount > 0) {
      const wallet = await Wallet.findOne({ user: userId }).lean();
      if (!wallet) {
        return res.status(400).json({
          success: false,
          message: 'Wallet not found. Cannot redeem coins.',
        });
      }

      // Check ReZ coins + Promo coins (from available balance)
      const universalCoinsNeeded = coinRedemption.rezCoins + coinRedemption.promoCoins;
      if (universalCoinsNeeded > wallet.balance.available) {
        return res.status(400).json({
          success: false,
          message: `Insufficient coin balance. You have ₹${wallet.balance.available} but trying to use ₹${universalCoinsNeeded}`,
        });
      }

      // Pre-checkout expiry check: reject if promo coins have expired
      if (coinRedemption.promoCoins > 0) {
        // Check legacy wallet field
        const promoCoin = wallet.coins?.find((c: any) => c.type === 'promo');
        const promoExpiryRaw = promoCoin?.promoDetails?.expiryDate || promoCoin?.expiryDate;
        if (promoExpiryRaw) {
          const expDate = new Date(promoExpiryRaw as string | number | Date);
          if (expDate <= new Date()) {
            return res.status(400).json({
              success: false,
              message: 'Your promo coins have expired. Please refresh your wallet balance.',
            });
          }
        }
        // Also check CoinTransaction-based expiry (new system)
        const expiredPromoTx = await CoinTransaction.findOne({
          user: userId,
          type: 'earned',
          'metadata.coinType': 'promo',
          expiresAt: { $lte: new Date() },
          'metadata.isExpired': { $ne: true },
        }).lean();
        if (expiredPromoTx) {
          return res.status(400).json({
            success: false,
            message: 'Some of your promo coins have expired. Please refresh your wallet balance.',
          });
        }
      }

      // Validate branded coins balance if being used
      if (coinRedemption.brandedCoins > 0) {
        // Find branded coins for this specific store/merchant
        const storeMerchantId = (store as any).merchantId?.toString() || storeId;
        const merchantBrandedCoin = wallet.brandedCoins?.find((bc: any) => {
          const bcMerchantId = bc.merchantId?.toString();
          return bcMerchantId === storeId || bcMerchantId === storeMerchantId;
        });

        const availableBrandedCoins = merchantBrandedCoin?.amount || 0;
        if (coinRedemption.brandedCoins > availableBrandedCoins) {
          return res.status(400).json({
            success: false,
            message: `Insufficient branded coins. You have ₹${availableBrandedCoins} but trying to use ₹${coinRedemption.brandedCoins}`,
          });
        }
      }
    }
  }

  // Calculate final amount
  const remainingAmount = Math.max(0, amount - coinRedemptionAmount);

  // Generate unique payment ID
  const paymentId = (StorePayment as any).generatePaymentId();

  // Determine effective payment method
  const effectivePaymentMethod = remainingAmount === 0 ? 'coins_only' : paymentMethod;

  // Calculate discount from applied offers
  let discountAmount = 0;
  if (offersApplied && offersApplied.length > 0) {
    for (const offer of offersApplied) {
      if (offer.type === 'PERCENTAGE' || offer.valueType === 'PERCENTAGE') {
        let offerDiscount = Math.floor((amount * (offer.value || 0)) / 100);
        // Apply max discount cap if specified
        if (offer.maxDiscount && offerDiscount > offer.maxDiscount) {
          offerDiscount = offer.maxDiscount;
        }
        discountAmount += offerDiscount;
      } else if (offer.type === 'FIXED' || offer.valueType === 'FIXED') {
        discountAmount += offer.value || 0;
      } else if (offer.calculatedDiscount) {
        discountAmount += offer.calculatedDiscount;
      }
    }
  }

  // CD-CRIT-06 FIX: Validate client-submitted line-item prices against canonical
  // Product.pricing.selling before accepting the payment.  This closes the fraud
  // vector where a malicious client submits inflated discounts on individual items to
  // reduce the effective bill amount below what was actually charged at the store.
  if (lineItems && lineItems.length > 0) {
    const priceValidation = await validateLineItemPrices(lineItems, storeId, userId);
    if (!priceValidation.valid) {
      return res.status(400).json({
        success: false,
        message: priceValidation.error,
        code: 'CD-CRIT-06_PRICE_MISMATCH',
      });
    }
  }

  // Create store payment record
  const storePayment = new StorePayment({
    paymentId,
    clientTxnId: clientTxnId || undefined,
    userId: new Types.ObjectId(userId),
    storeId: new Types.ObjectId(storeId),
    storeName: store.name,
    billAmount: amount,
    discountAmount,
    coinRedemption,
    remainingAmount,
    paymentMethod: effectivePaymentMethod,
    offersApplied: offersApplied || [],
    status: 'initiated',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
    lineItems: lineItems || undefined,
  });

  // If there's an amount to pay, create payment gateway order
  let clientSecret: string | undefined;
  let razorpayOrderId: string | undefined;
  const razorpayKeyId = razorpayConfig.keyId;

  if (remainingAmount > 0) {
    // Create Razorpay order for UPI/card payments (primary gateway for India)
    try {
      logger.info('[STORE PAYMENT] Creating Razorpay order for ₹', remainingAmount);
      const rzpOrder = await createRazorpayOrder(remainingAmount, `store_pay_${paymentId}`, {
        paymentId,
        storeId,
        userId,
        storeName: store.name,
      });
      razorpayOrderId = rzpOrder.id;
      storePayment.razorpayOrderId = rzpOrder.id;
      logger.info('[STORE PAYMENT] Razorpay order created:', rzpOrder.id);
    } catch (rzpError: any) {
      logger.warn('[STORE PAYMENT] Razorpay order creation failed, proceeding without it:', rzpError.message);
      // Non-fatal: coin-only payments don't need a gateway order
    }

    // Check if Stripe is configured (fallback / non-INR currencies)
    if (!stripeService.isStripeConfigured()) {
      logger.warn('[STORE PAYMENT] Stripe not configured, proceeding without payment intent');
    } else {
      try {
        logger.info('[STORE PAYMENT] Creating Stripe PaymentIntent for ₹', remainingAmount);

        const paymentIntent = await stripeService.createPaymentIntent({
          amount: remainingAmount,
          currency: 'inr',
          metadata: {
            paymentId,
            storeId,
            userId,
            storeName: store.name,
            paymentType: 'store_payment',
            coinRedemption: coinRedemptionAmount.toString(),
          },
        });

        storePayment.stripePaymentIntentId = paymentIntent.id;
        storePayment.stripeClientSecret = paymentIntent.client_secret || undefined;
        clientSecret = paymentIntent.client_secret || undefined;

        logger.info('[STORE PAYMENT] PaymentIntent created:', paymentIntent.id);
      } catch (stripeError: any) {
        logger.error('[STORE PAYMENT] Failed to create PaymentIntent:', stripeError.message);
        // Continue without Stripe - can still process coin-only or manual verification
      }
    }
  }

  // Save the payment record
  await storePayment.save();
  logger.info('[STORE PAYMENT] Payment record created:', paymentId);

  res.status(200).json({
    success: true,
    message: 'Payment initiated successfully',
    data: {
      paymentId,
      storeId,
      storeName: store.name,
      billAmount: amount,
      coinRedemption: coinRedemptionAmount,
      remainingAmount,
      paymentMethod: effectivePaymentMethod,
      upiId: settings.upiId,
      offersApplied: offersApplied || [],
      status: 'INITIATED',
      expiresAt: storePayment.expiresAt,
      // Stripe client secret for frontend payment confirmation
      clientSecret,
      // Razorpay order details for native SDK checkout
      razorpayOrderId,
      razorpayKeyId,
    },
  });
});

/**
 * Confirm store payment
 * POST /api/store-payment/confirm
 *
 * IMPORTANT: This function uses MongoDB sessions for atomic operations.
 * All coin deductions and payment updates happen within a single transaction.
 */
export const confirmStorePayment = asyncHandler(async (req: Request, res: Response) => {
  // Start a MongoDB session for atomic operations
  const session = await mongoose.startSession();

  try {
    const { paymentId, transactionId } = req.body;
    const userId = req.userId;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'paymentId is required',
      });
    }

    // Find the payment record
    const storePayment = await StorePayment.findOne({ paymentId });

    if (!storePayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Verify the payment belongs to this user
    if (storePayment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to confirm this payment',
      });
    }

    // Check if payment is expired
    if (storePayment.expiresAt < new Date()) {
      storePayment.status = 'expired';
      await storePayment.save();
      return res.status(400).json({
        success: false,
        message: 'Payment has expired',
      });
    }

    // VIKTOR: concurrency fix — idempotent payment confirmation
    // Check if already completed and return success if so (idempotent handler for webhook retries)
    if (storePayment.status === 'completed') {
      logger.info('[STORE PAYMENT] Payment already completed (idempotent retry):', paymentId);
      return res.status(200).json({
        success: true,
        message: 'Payment already completed',
        data: { status: 'completed', alreadyProcessed: true },
      });
    }

    // Verify Stripe payment if applicable (only for card payments, not UPI)
    const isCardPayment = storePayment.paymentMethod.includes('card');

    if (storePayment.stripePaymentIntentId && storePayment.remainingAmount > 0 && isCardPayment) {
      logger.info('[STORE PAYMENT] Verifying Stripe payment:', storePayment.stripePaymentIntentId);

      try {
        const verification = await stripeService.verifyPaymentIntent(storePayment.stripePaymentIntentId);

        if (!verification.verified) {
          logger.error('[STORE PAYMENT] Payment not verified. Status:', verification.status);
          return res.status(400).json({
            success: false,
            message: `Payment not completed. Status: ${verification.status}`,
          });
        }

        logger.info('[STORE PAYMENT] Stripe payment verified');
      } catch (stripeError: any) {
        logger.error('[STORE PAYMENT] Stripe verification failed:', stripeError.message);
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
        });
      }
    } else if (storePayment.paymentMethod === 'upi') {
      // ISSUE-36 FIX: Verify UPI payment status via Razorpay API before accepting.
      // The client-supplied razorpayPaymentId (stored as storePayment.razorpayPaymentId
      // at order creation, or provided as transactionId in the confirm body) is fetched
      // from Razorpay to confirm the payment is 'captured' server-side.
      const razorpayPaymentId = (storePayment as any).razorpayPaymentId || transactionId;

      if (!razorpayPaymentId) {
        logger.warn('[STORE PAYMENT] UPI confirmation missing razorpayPaymentId', {
          paymentId: storePayment.paymentId,
        });
        return res.status(400).json({
          success: false,
          message: 'razorpayPaymentId is required to confirm a UPI payment.',
          code: 'UPI_PAYMENT_ID_MISSING',
        });
      }

      try {
        logger.info('[STORE PAYMENT] Verifying UPI payment via Razorpay', {
          paymentId: storePayment.paymentId,
          razorpayPaymentId,
        });

        const rzpPayment = await fetchPaymentDetails(razorpayPaymentId);

        if (rzpPayment.status !== 'captured') {
          logger.warn('[STORE PAYMENT] UPI payment not captured', {
            razorpayPaymentId,
            status: rzpPayment.status,
          });
          return res.status(400).json({
            success: false,
            message: `UPI payment not confirmed. Razorpay status: ${rzpPayment.status}`,
            code: 'UPI_PAYMENT_NOT_CAPTURED',
          });
        }

        // Verify amount matches (Razorpay amounts are in paise)
        const expectedPaise = Math.round(storePayment.remainingAmount * 100);
        if (Math.abs(Number(rzpPayment.amount) - expectedPaise) > 1) {
          logger.error('[STORE PAYMENT] UPI amount mismatch', {
            razorpayPaymentId,
            expected: expectedPaise,
            received: rzpPayment.amount,
          });
          return res.status(400).json({
            success: false,
            message: 'UPI payment amount does not match order amount.',
            code: 'UPI_AMOUNT_MISMATCH',
          });
        }

        logger.info('[STORE PAYMENT] UPI payment verified via Razorpay', { razorpayPaymentId });
      } catch (upiError: any) {
        logger.error('[STORE PAYMENT] UPI Razorpay verification failed:', upiError.message);
        return res.status(400).json({
          success: false,
          message: 'Unable to verify UPI payment with payment gateway. Please retry.',
          code: 'UPI_VERIFICATION_FAILED',
        });
      }
    }

    // Retry loop for transient transaction errors (WriteConflict code 112)
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      attempt++;
      // Start the atomic transaction
      session.startTransaction();

      try {
        // Update payment status to processing
        storePayment.status = 'processing';
        await storePayment.save({ session });

        // Resolve store's root MainCategory slug for category-specific coins
        let paymentCategorySlug: MainCategorySlug | null = null;
        try {
          let catId = (
            await Store.findById(storePayment.storeId).select('category').session(session).lean()
          )?.category?.toString();
          let depth = 5;
          while (catId && depth-- > 0) {
            const cat = await Category.findById(catId).select('slug parentCategory').session(session).lean();
            if (!cat) break;
            if (!cat.parentCategory) {
              if (VALID_MAIN_CATEGORY_SLUGS.includes(cat.slug as MainCategorySlug)) {
                paymentCategorySlug = cat.slug as MainCategorySlug;
              }
              break;
            }
            catId = cat.parentCategory.toString();
          }
        } catch (e) {
          logger.error('[PAYMENT] Failed to resolve store category slug, falling back to global coin config', {
            error: e instanceof Error ? e.message : e,
          });
        }

        // Deduct coins from user's wallet (ATOMIC with $gte guards — prevents double-spend)
        if (storePayment.coinRedemption.totalAmount > 0) {
          const rezCoinsToDeduct = storePayment.coinRedemption.rezCoins || 0;
          const promoCoinsToDeduct = storePayment.coinRedemption.promoCoins || 0;
          const brandedCoinsToDeduct = storePayment.coinRedemption.brandedCoins || 0;
          const universalCoinsToDeduct = rezCoinsToDeduct + promoCoinsToDeduct;

          // VIKTOR: concurrency fix — atomic coin deduction with balance guards
          // All $inc operations are protected by $gte conditions to prevent negative balances
          // This ensures concurrent payments cannot cause double-spend from insufficient coins

          // Deduct ReZ coins atomically — try category balance first, then global
          let deductedFromCategory = false;
          let latestWalletState: any = null; // Track last successful atomic update result
          if (rezCoinsToDeduct > 0) {
            if (paymentCategorySlug) {
              const catDeductResult = await Wallet.findOneAndUpdate(
                {
                  user: storePayment.userId,
                  [`categoryBalances.${paymentCategorySlug}.available`]: { $gte: rezCoinsToDeduct }, // Guard: sufficient balance
                },
                {
                  $inc: {
                    [`categoryBalances.${paymentCategorySlug}.available`]: -rezCoinsToDeduct,
                    'statistics.totalSpent': rezCoinsToDeduct,
                  },
                  $set: { lastTransactionAt: new Date() },
                },
                { new: true, session },
              );
              if (catDeductResult) {
                deductedFromCategory = true;
                latestWalletState = catDeductResult;
                // Update UserLoyalty.categoryCoins atomically
                try {
                  const UserLoyalty =
                    require('../models/UserLoyalty').default || require('../models/UserLoyalty').UserLoyalty;
                  await UserLoyalty.findOneAndUpdate(
                    {
                      userId: userId.toString(),
                      [`categoryCoins.${paymentCategorySlug}.available`]: { $gte: rezCoinsToDeduct },
                    },
                    { $inc: { [`categoryCoins.${paymentCategorySlug}.available`]: -rezCoinsToDeduct } },
                    { session },
                  );
                } catch (loyaltyErr) {
                  logger.error('[STORE PAYMENT] Failed to update UserLoyalty categoryCoins:', loyaltyErr);
                }
              }
            }
            if (!deductedFromCategory) {
              // Global ReZ coins — atomic deduction with $gte guard
              const rezDeductResult = await Wallet.findOneAndUpdate(
                {
                  user: storePayment.userId,
                  'balance.available': { $gte: rezCoinsToDeduct },
                  coins: { $elemMatch: { type: 'rez', amount: { $gte: rezCoinsToDeduct } } },
                },
                {
                  $inc: {
                    'balance.available': -rezCoinsToDeduct,
                    'coins.$.amount': -rezCoinsToDeduct,
                    'statistics.totalSpent': rezCoinsToDeduct,
                  },
                  $set: { lastTransactionAt: new Date(), 'coins.$.lastUsed': new Date() },
                },
                { new: true, session },
              );
              if (!rezDeductResult) {
                throw new Error(`Insufficient ReZ coin balance for deduction of ${rezCoinsToDeduct}`);
              }
              latestWalletState = rezDeductResult;
            }
          }

          // Deduct Promo coins atomically
          if (promoCoinsToDeduct > 0) {
            // If rez was deducted from category, also deduct promo from balance.available
            const promoFilter: any = {
              user: storePayment.userId,
              coins: { $elemMatch: { type: 'promo', amount: { $gte: promoCoinsToDeduct } } },
            };
            const promoInc: any = {
              'coins.$.amount': -promoCoinsToDeduct,
              'balance.available': -promoCoinsToDeduct,
            };
            const promoDeductResult = await Wallet.findOneAndUpdate(
              promoFilter,
              {
                $inc: promoInc,
                $set: { lastTransactionAt: new Date(), 'coins.$.lastUsed': new Date() },
              },
              { new: true, session },
            );
            if (!promoDeductResult) {
              throw new Error(`Insufficient Promo coin balance for deduction of ${promoCoinsToDeduct}`);
            }
            latestWalletState = promoDeductResult;
          }

          // If rez coins were global (not category), the balance.available was already decremented above
          // If rez coins were from category, we still need to add dailySpent/totalSpent tracking
          if (universalCoinsToDeduct > 0) {
            await Wallet.findOneAndUpdate(
              { user: storePayment.userId },
              { $inc: { 'limits.dailySpent': universalCoinsToDeduct } },
              { session },
            );
          }

          // Deduct Branded Coins atomically (merchant-specific)
          if (brandedCoinsToDeduct > 0) {
            const store = await Store.findById(storePayment.storeId).select('merchantId').session(session).lean();
            const storeMerchantId = store?.merchantId?.toString() || storePayment.storeId.toString();

            // Try both storeId and merchantId as the branded coin identifier
            let brandedDeductResult = await Wallet.findOneAndUpdate(
              {
                user: storePayment.userId,
                brandedCoins: {
                  $elemMatch: { merchantId: storePayment.storeId, amount: { $gte: brandedCoinsToDeduct } },
                },
              },
              {
                $inc: { 'brandedCoins.$.amount': -brandedCoinsToDeduct, 'statistics.totalSpent': brandedCoinsToDeduct },
                $set: { lastTransactionAt: new Date(), 'brandedCoins.$.lastUsed': new Date() },
              },
              { new: true, session },
            );
            if (!brandedDeductResult && storeMerchantId !== storePayment.storeId.toString()) {
              brandedDeductResult = await Wallet.findOneAndUpdate(
                {
                  user: storePayment.userId,
                  brandedCoins: { $elemMatch: { merchantId: storeMerchantId, amount: { $gte: brandedCoinsToDeduct } } },
                },
                {
                  $inc: {
                    'brandedCoins.$.amount': -brandedCoinsToDeduct,
                    'statistics.totalSpent': brandedCoinsToDeduct,
                  },
                  $set: { lastTransactionAt: new Date(), 'brandedCoins.$.lastUsed': new Date() },
                },
                { new: true, session },
              );
            }

            if (!brandedDeductResult) {
              throw new Error(`Insufficient branded coins. Required: ${brandedCoinsToDeduct}`);
            }
            latestWalletState = brandedDeductResult;
          }

          // Create transaction record for coin spending
          await Transaction.create(
            [
              {
                user: storePayment.userId,
                type: 'debit',
                category: 'spending',
                amount: storePayment.coinRedemption.totalAmount,
                balanceBefore: (latestWalletState?.balance?.available ?? 0) + universalCoinsToDeduct,
                balanceAfter: latestWalletState?.balance?.available ?? 0,
                description: `Store payment at ${storePayment.storeName} (ReZ: ${rezCoinsToDeduct}, Promo: ${promoCoinsToDeduct}, Branded: ${brandedCoinsToDeduct})`,
                source: {
                  type: 'paybill',
                  reference: storePayment._id,
                  description: `Coins used for store payment`,
                  metadata: {
                    storeInfo: {
                      name: storePayment.storeName,
                      id: storePayment.storeId,
                    },
                  },
                },
                status: {
                  current: 'completed',
                  history: [
                    {
                      status: 'completed',
                      timestamp: new Date(),
                    },
                  ],
                },
                isReversible: false,
                retryCount: 0,
                maxRetries: 0,
              },
            ],
            { session },
          );

          // Create CoinTransaction record for sync (CRITICAL for balance sync)
          // This ensures wallet.syncBalance() uses the correct balance from CoinTransaction
          if (universalCoinsToDeduct > 0) {
            const coinTx = await CoinTransaction.createTransaction(
              storePayment.userId.toString(),
              'spent',
              universalCoinsToDeduct,
              'store_payment',
              `Store payment at ${storePayment.storeName}`,
              {
                storePaymentId: storePayment._id,
                paymentId: storePayment.paymentId,
                storeId: storePayment.storeId,
                storeName: storePayment.storeName,
                rezCoins: rezCoinsToDeduct,
                promoCoins: promoCoinsToDeduct,
              },
              paymentCategorySlug,
              session,
            );
            logger.info(
              `[STORE PAYMENT] CoinTransaction record created for universal coins: ${universalCoinsToDeduct}, category: ${paymentCategorySlug}`,
            );

            // Create ledger entry (fire-and-forget)
            const spUserAcctId = new mongoose.Types.ObjectId(storePayment.userId.toString());
            const spPlatformId = ledgerService.getPlatformAccountId('platform_float');
            ledgerService
              .recordEntry({
                debitAccount: { type: 'user_wallet', id: spUserAcctId },
                creditAccount: { type: 'platform_float', id: spPlatformId },
                amount: universalCoinsToDeduct,
                coinType: 'rez',
                operationType: 'store_payment_reward',
                referenceId: String(coinTx._id),
                referenceModel: 'CoinTransaction',
                metadata: { description: `Store payment at ${storePayment.storeName}` },
              })
              .catch((err: any) => logger.error('[STORE PAYMENT] Ledger entry failed:', err));
          }

          // Create separate CoinTransaction for branded coins (for audit trail)
          if (brandedCoinsToDeduct > 0) {
            // Note: Branded coins are tracked separately in wallet.brandedCoins
            // This CoinTransaction is for audit purposes only, not for balance sync
            await CoinTransaction.create(
              [
                {
                  user: storePayment.userId,
                  type: 'spent',
                  amount: brandedCoinsToDeduct,
                  balance: 0, // Branded coins have separate balance tracking
                  source: 'branded_coin_store_payment',
                  description: `Branded coins used at ${storePayment.storeName}`,
                  metadata: {
                    storePaymentId: storePayment._id,
                    paymentId: storePayment.paymentId,
                    storeId: storePayment.storeId,
                    storeName: storePayment.storeName,
                  },
                },
              ],
              { session },
            );
            logger.info('[STORE PAYMENT] CoinTransaction record created for branded coins:', brandedCoinsToDeduct);
          }
        }

        // Calculate rewards
        const store = await Store.findById(storePayment.storeId)
          .select('rewardRules merchantId')
          .session(session)
          .lean();
        const rewardRules = store?.rewardRules;

        // Get user's actual visit count at this store
        const visitCount = await StorePayment.countDocuments({
          userId: storePayment.userId,
          storeId: storePayment.storeId,
          status: 'completed',
        }).session(session);

        // Calculate loyalty progress
        const currentVisits = visitCount + 1; // Including this payment
        let nextMilestone = 5;
        let milestoneReward = 'Bronze Member';

        // Use store's visit milestone rewards if configured
        if (rewardRules?.visitMilestoneRewards && rewardRules.visitMilestoneRewards.length > 0) {
          const milestones = rewardRules.visitMilestoneRewards.sort((a: any, b: any) => a.visits - b.visits);
          const nextMilestoneConfig = milestones.find((m: any) => m.visits > currentVisits);
          if (nextMilestoneConfig) {
            nextMilestone = nextMilestoneConfig.visits;
            milestoneReward = `${nextMilestoneConfig.coinsReward} Bonus Coins`;
          }
        } else {
          // Default milestones: 5, 10, 15 (then repeating every 5)
          if (currentVisits < 5) {
            nextMilestone = 5;
            milestoneReward = 'Bronze Loyalist';
          } else if (currentVisits < 10) {
            nextMilestone = 10;
            milestoneReward = 'Silver Loyalist';
          } else if (currentVisits < 15) {
            nextMilestone = 15;
            milestoneReward = 'Gold Loyalist';
          } else {
            // After 15, milestone every 5 visits
            nextMilestone = currentVisits + (5 - (currentVisits % 5 || 5));
            milestoneReward = 'Platinum Loyalist';
          }
        }

        const rewards: IPaymentRewards = {
          cashbackEarned: 0,
          coinsEarned: 0,
          bonusCoins: 0,
          loyaltyProgress: {
            currentVisits,
            nextMilestone,
            milestoneReward,
          },
        };

        // Fetch subscription and Prive multipliers (non-blocking fallback to 1x)
        let subscriptionMultiplier = 1;
        let priveMultiplier = 1;
        let priveTier = 'none';
        try {
          const [subMult, priveResult] = await Promise.all([
            subscriptionBenefitsService.getCashbackMultiplier(userId),
            priveMultiplierService.getMultiplier(userId),
          ]);
          subscriptionMultiplier = subMult;
          priveMultiplier = priveResult.multiplier;
          priveTier = priveResult.tier;
        } catch (err) {
          logger.warn('[STORE PAYMENT] Failed to fetch multipliers, defaulting to 1x:', err);
        }

        // FT-005 FIX — In-flight order rate snapshot.
        //
        // ROOT CAUSE: The cashback rate was read live from store.rewardRules at
        // payment settlement time. A merchant who changes baseCashbackPercent
        // between "checkout preview" and "payment confirm" (even a few seconds
        // later) would silently receive a different cashback amount than the user
        // was quoted at preview. This is both a UX inconsistency and a potential
        // financial discrepancy if the rate goes up during a high-traffic window.
        //
        // FIX: Lock the rate at the moment the StorePayment record is created
        // (payment initiation). Use storePayment.metadata.lockedCashbackRate when
        // available (set by the payment-initiation endpoint), falling back to the
        // current store rate for backward compatibility with older records. The
        // locked rate is stored in the payment's metadata so the settlement step
        // and any future audits always use the rate that was quoted to the user.
        const lockedCashbackRate: number =
          (storePayment as any).metadata?.lockedCashbackRate ?? rewardRules?.baseCashbackPercent;

        if (lockedCashbackRate && storePayment.billAmount >= (rewardRules?.minimumAmountForReward || 0)) {
          const baseCashbackAmount = Math.floor((storePayment.billAmount * lockedCashbackRate) / 100);
          const afterSubscription = Math.floor(baseCashbackAmount * subscriptionMultiplier);
          const finalCashback = Math.floor(afterSubscription * priveMultiplier);

          rewards.cashbackEarned = finalCashback;
          rewards.cashbackBreakdown = {
            baseCashbackPercent: lockedCashbackRate,
            baseCashbackAmount,
            subscriptionMultiplier,
            priveMultiplier,
            priveTier,
            finalCashbackAmount: finalCashback,
            // FT-005: surface whether a locked rate was used for auditability
            rateSource:
              (storePayment as any).metadata?.lockedCashbackRate !== undefined
                ? 'locked_at_initiation'
                : 'live_store_rate',
          };

          if (subscriptionMultiplier > 1 || priveMultiplier > 1) {
            logger.info('[STORE PAYMENT] Cashback multipliers applied:', {
              base: baseCashbackAmount,
              subMultiplier: subscriptionMultiplier,
              priveMultiplier,
              final: finalCashback,
              rateSource: rewards.cashbackBreakdown.rateSource,
            });
          }
        }

        // Calculate coins earned based on store's reward rules or default (1 coin per ₹10 spent)
        const coinsPerRupee = rewardRules?.coinsPerRupee || 0.1; // Default: 1 coin per ₹10
        const minAmountForCoins = rewardRules?.minimumAmountForReward || 0;

        if (storePayment.billAmount >= minAmountForCoins) {
          rewards.coinsEarned = Math.floor(storePayment.billAmount * coinsPerRupee);
        }

        // Extra reward for spending above threshold
        if (rewardRules?.extraRewardThreshold && storePayment.billAmount >= rewardRules.extraRewardThreshold) {
          rewards.bonusCoins = rewardRules.extraRewardCoins || 0;
        }

        // First visit bonus — award extra coins on first-ever completed payment at this store
        if (visitCount === 0 && rewardRules?.firstVisitBonus && rewardRules.firstVisitBonus > 0) {
          rewards.firstVisitBonus = rewardRules.firstVisitBonus;
          logger.info('[STORE PAYMENT] First visit bonus awarded:', rewards.firstVisitBonus, 'coins');
        }

        // Credit reward coins to user's wallet via walletService (atomic $inc + CoinTransaction + LedgerEntry)
        const totalRewardCoins =
          rewards.cashbackEarned + rewards.coinsEarned + rewards.bonusCoins + (rewards.firstVisitBonus || 0);
        if (totalRewardCoins > 0) {
          {
            const { walletService } = await import('../services/walletService');
            await walletService.credit({
              userId: storePayment.userId.toString(),
              amount: totalRewardCoins,
              source: 'cashback',
              description: `Rewards for payment at ${storePayment.storeName}`,
              operationType: 'store_payment_reward',
              referenceId: `store-payment:${storePayment._id}`,
              referenceModel: 'StorePayment',
              metadata: {
                storeId: storePayment.storeId,
                storeName: storePayment.storeName,
                billAmount: storePayment.billAmount,
                cashbackBreakdown: rewards.cashbackBreakdown || undefined,
              },
              category: paymentCategorySlug || undefined,
              session,
            });

            logger.info('Credited reward coins via walletService:', totalRewardCoins);

            // Create Transaction display record for reward
            await Transaction.create(
              [
                {
                  user: storePayment.userId,
                  type: 'credit',
                  category: 'cashback',
                  amount: totalRewardCoins,
                  balanceBefore: 0,
                  balanceAfter: totalRewardCoins,
                  description: `Rewards for payment at ${storePayment.storeName}`,
                  source: {
                    type: 'cashback',
                    reference: storePayment._id,
                    description: `Store payment rewards`,
                    metadata: {
                      storeInfo: {
                        name: storePayment.storeName,
                        id: storePayment.storeId,
                      },
                    },
                  },
                  status: {
                    current: 'completed',
                    history: [
                      {
                        status: 'completed',
                        timestamp: new Date(),
                      },
                    ],
                  },
                  isReversible: false,
                  retryCount: 0,
                  maxRetries: 0,
                },
              ],
              { session },
            );
            // CoinTransaction already created by walletService.credit above
          }
        }

        // Mark payment as completed
        const finalTransactionId = transactionId || storePayment.stripePaymentIntentId || `TXN-${Date.now()}`;
        storePayment.status = 'completed';
        storePayment.transactionId = finalTransactionId;
        storePayment.completedAt = new Date();
        storePayment.rewards = rewards;
        await storePayment.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        logger.info('[STORE PAYMENT] Payment completed (atomic):', paymentId);

        // Emit savings streak event (non-blocking — payment already committed)
        try {
          const gamificationEventBus = (await import('../events/gamificationEventBus')).default;
          gamificationEventBus.emit('store_payment_confirmed', {
            userId: storePayment.userId.toString(),
            metadata: {
              storeId: storePayment.storeId.toString(),
              storeName: storePayment.storeName,
              amount: storePayment.billAmount,
            },
          });
        } catch {
          // Non-blocking — payment succeeded, streak update is bonus
        }

        // Track subscription cashback usage (non-blocking, outside transaction)
        if (rewards.cashbackEarned > 0 && subscriptionMultiplier > 1) {
          subscriptionBenefitsService
            .trackCashbackEarned(userId, rewards.cashbackEarned)
            .catch((err) => logger.error('[STORE PAYMENT] Failed to track subscription cashback:', err));
        }

        // v3: Write MerchantRewardJournal entry for dispute resolution + fraud analytics
        // Non-blocking — payment already committed, journal is audit trail only
        if (store?.merchantId) {
          MerchantRewardJournal.create({
            sessionId: String((storePayment as any)._id),
            merchantId: store.merchantId,
            storeId: storePayment.storeId,
            userId: storePayment.userId,
            eventType: 'payment',
            transactionAmount: storePayment.billAmount,
            decision: {
              coinsIssued: totalRewardCoins,
              coinType: 'rez',
              stampAdded: false,
              tierUpgraded: false,
              skippedReasons: totalRewardCoins === 0 ? ['no_rewards_applicable'] : [],
            },
            balanceBefore: { rezCoins: 0, promoCoins: 0 },
            balanceAfter: { rezCoins: totalRewardCoins, promoCoins: 0 },
          }).catch((err) => logger.error('[STORE PAYMENT] MerchantRewardJournal write failed (non-blocking):', err));
        }

        // Notify merchant of in-store payment (non-blocking)
        if (store?.merchantId) {
          try {
            const merchantNotificationService = require('../services/merchantNotificationService').default;
            await merchantNotificationService.notifyStorePaymentReceived({
              merchantId: store.merchantId.toString(),
              paymentId: storePayment.paymentId,
              storeName: storePayment.storeName,
              amount: storePayment.billAmount,
              paymentMethod: storePayment.paymentMethod,
              coinsUsed: storePayment.coinRedemption?.totalAmount || 0,
              cashbackAwarded: rewards.cashbackEarned || 0,
            });
          } catch (notifyErr) {
            logger.error('[STORE PAYMENT] Merchant notification failed (non-blocking):', notifyErr);
          }
        }

        // P0: Consumer push — cashback receipt (non-blocking)
        try {
          const pushSvc = require('../services/pushNotificationService').default;
          const cashbackEarned = rewards?.cashbackEarned || 0;
          const coinsEarned = totalRewardCoins || 0;
          const rewardLine =
            cashbackEarned > 0
              ? `₹${cashbackEarned} cashback earned!`
              : coinsEarned > 0
                ? `${coinsEarned} REZ coins earned!`
                : 'Payment confirmed.';
          await pushSvc.sendPushToUser(userId, {
            title: `Payment at ${storePayment.storeName} ✅`,
            body: `₹${storePayment.billAmount} paid. ${rewardLine}`,
            data: { screen: 'wallet', paymentId: storePayment.paymentId },
          });
        } catch (_err) {
          // Non-blocking — payment already committed
        }

        // Auto-trigger bank_offer bonus campaign on successful store payment
        try {
          const bonusCampaignService = require('../services/bonusCampaignService');
          logger.info('[STORE PAYMENT] Triggering bank_offer for payment:', paymentId);
          await bonusCampaignService.autoClaimForTransaction('bank_offer', userId, {
            transactionRef: { type: 'payment' as const, refId: (storePayment._id as Types.ObjectId).toString() },
            transactionAmount: storePayment.billAmount,
            paymentMethod: storePayment.paymentMethod,
          });
        } catch (bonusErr) {
          logger.error('[STORE PAYMENT] bank_offer auto-claim failed (non-blocking):', bonusErr);
        }

        res.status(200).json({
          success: true,
          message: 'Payment confirmed successfully',
          data: {
            paymentId,
            status: 'COMPLETED',
            transactionId: finalTransactionId,
            completedAt: storePayment.completedAt,
            rewards,
          },
        });
      } catch (atomicError: any) {
        // Abort the transaction on any error
        await session.abortTransaction();

        // Retry on TransientTransactionError (WriteConflict code 112)
        const isTransient = atomicError.errorLabelSet?.has('TransientTransactionError') || atomicError.code === 112;
        if (isTransient && attempt < MAX_RETRIES) {
          logger.warn(`[STORE PAYMENT] Transient transaction error (attempt ${attempt}/${MAX_RETRIES}), retrying...`);
          // Brief backoff before retry
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
          continue;
        }

        logger.error('[STORE PAYMENT] Atomic transaction failed:', atomicError.message);

        // Revert payment status if it was changed
        if (storePayment.status === 'processing') {
          storePayment.status = 'initiated';
          try {
            await storePayment.save();
          } catch (saveErr) {
            logger.error('[STORE PAYMENT] Failed to revert payment status to initiated:', saveErr);
          }
        }

        throw atomicError;
      }
      // If we reach here, transaction committed successfully — break out of retry loop
      break;
    } // end retry while loop
  } finally {
    // End the session
    session.endSession();
  }
});

/**
 * Cancel store payment
 * POST /api/store-payment/cancel
 */
export const cancelStorePayment = asyncHandler(async (req: Request, res: Response) => {
  const { paymentId, reason } = req.body;
  const userId = req.userId;

  if (!paymentId) {
    return res.status(400).json({
      success: false,
      message: 'paymentId is required',
    });
  }

  // Find the payment record
  const storePayment = await StorePayment.findOne({ paymentId });

  if (!storePayment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found',
    });
  }

  // Verify the payment belongs to this user
  if (storePayment.userId.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized to cancel this payment',
    });
  }

  // Can only cancel payments that are initiated or processing
  if (!['initiated', 'processing'].includes(storePayment.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel payment with status: ${storePayment.status}`,
    });
  }

  // Cancel Stripe PaymentIntent if exists
  if (storePayment.stripePaymentIntentId) {
    try {
      logger.info('[STORE PAYMENT] Cancelling Stripe PaymentIntent:', storePayment.stripePaymentIntentId);
      await stripeService.cancelPaymentIntent(storePayment.stripePaymentIntentId);
      logger.info('[STORE PAYMENT] Stripe PaymentIntent cancelled');
    } catch (stripeError: any) {
      logger.error('[STORE PAYMENT] Failed to cancel Stripe PaymentIntent:', stripeError.message);
      // Continue with cancellation even if Stripe fails
    }
  }

  // Update payment status
  storePayment.status = 'cancelled';
  storePayment.cancelledAt = new Date();
  storePayment.cancellationReason = reason || 'user_cancelled';
  await storePayment.save();

  logger.info('[STORE PAYMENT] Payment cancelled:', paymentId);

  res.status(200).json({
    success: true,
    message: 'Payment cancelled successfully',
    data: {
      paymentId,
      status: 'CANCELLED',
      cancelledAt: storePayment.cancelledAt,
    },
  });
});

/**
 * Get store payment by ID
 * GET /api/store-payment/:paymentId
 */
export const getStorePaymentById = asyncHandler(async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const userId = req.userId;

  logger.info('[GET PAYMENT] Looking up payment:', paymentId, 'for user:', userId);

  if (!paymentId) {
    return res.status(400).json({
      success: false,
      message: 'paymentId is required',
    });
  }

  // Find the payment record
  const storePayment = await StorePayment.findOne({ paymentId }).lean();

  logger.info('[GET PAYMENT] Found payment:', storePayment ? 'Yes' : 'No');

  if (!storePayment) {
    // Check if any payments exist at all
    const count = await StorePayment.countDocuments();
    logger.info('[GET PAYMENT] Total payments in DB:', count);

    return res.status(404).json({
      success: false,
      message: 'Payment not found',
    });
  }

  // Verify the payment belongs to this user
  if (storePayment.userId.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized to view this payment',
    });
  }

  // Get store details
  const store = await Store.findById(storePayment.storeId).select('name logo category').lean();

  res.status(200).json({
    success: true,
    data: {
      id: storePayment._id,
      paymentId: storePayment.paymentId,
      storeId: storePayment.storeId,
      storeName: storePayment.storeName,
      storeLogo: store?.logo,
      storeCategory: store?.category,
      billAmount: storePayment.billAmount,
      discountAmount: storePayment.discountAmount,
      coinRedemption: storePayment.coinRedemption,
      coinsUsed: storePayment.coinRedemption?.totalAmount || 0,
      remainingAmount: storePayment.remainingAmount,
      paymentMethod: storePayment.paymentMethod,
      offersApplied: storePayment.offersApplied,
      status: storePayment.status.toUpperCase(),
      rewards: storePayment.rewards,
      transactionId: storePayment.transactionId,
      createdAt: storePayment.createdAt,
      completedAt: storePayment.completedAt,
      expiresAt: storePayment.expiresAt,
    },
  });
});

/**
 * Get store payment history
 * GET /api/store-payment/history (for users)
 * GET /api/store-payment/history/:storeId (for merchants)
 */
// ==================== NEW PREMIUM PAYMENT ENDPOINTS ====================

/**
 * Get all available coins for user at a specific store
 * GET /api/store-payment/coins/:storeId
 *
 * Returns the 3 coin types per ReZ Wallet design:
 * 1. ReZ Coins (Universal) - Green, usable everywhere, expiry controlled by admin wallet config (default: never), no redemption cap
 * 2. Branded Coins (Merchant) - Store-specific, no expiry, only at that merchant
 * 3. Promo Coins (Limited-time) - Gold, expiry countdown, max 20% per bill cap
 *
 * Usage Order: Promo > Branded > ReZ (auto-applied for max savings)
 */
export const getCoinsForStore = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  // Get store info first
  const store = await Store.findById(storeId).select('name merchantId paymentSettings category').lean();

  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found',
    });
  }

  // Resolve root MainCategory slug for category-specific coins
  let storeCategorySlug: MainCategorySlug | null = null;
  try {
    let catId = store.category?.toString();
    let depth = 5;
    while (catId && depth-- > 0) {
      const cat = await Category.findById(catId).select('slug parentCategory').lean();
      if (!cat) break;
      if (!cat.parentCategory) {
        if (VALID_MAIN_CATEGORY_SLUGS.includes(cat.slug as MainCategorySlug)) {
          storeCategorySlug = cat.slug as MainCategorySlug;
        }
        break;
      }
      catId = cat.parentCategory.toString();
    }
  } catch (e) {
    logger.error('[PAYMENT] Failed to resolve store category slug for wallet summary', {
      error: e instanceof Error ? e.message : e,
    });
  }

  // Get user's wallet
  const wallet = await Wallet.findOne({ user: userId }).lean();

  if (!wallet) {
    return res.status(200).json({
      success: true,
      data: {
        rezCoins: {
          available: 0,
          using: 0,
          enabled: true,
          color: '#00C06A',
          description: 'Universal rewards usable anywhere on ReZ',
          expiryDays: null,
          redemptionCap: null, // No cap for ReZ coins
        },
        promoCoins: {
          available: 0,
          using: 0,
          enabled: true,
          expiringToday: false,
          expiresIn: null,
          color: '#FFC857',
          description: 'Special coins from campaigns & events',
          redemptionCap: 20, // Max 20% per bill
        },
        brandedCoins: null,
        totalApplied: 0,
        usageOrder: ['promo', 'branded', 'rez'],
      },
    });
  }

  // ==================== 1. REZ COINS (Category-specific or Universal) ====================
  // Use category-specific balance if available, otherwise fall back to global
  const rezCoin = wallet.coins?.find((c: any) => c.type === 'rez' && c.isActive);
  const globalRezBalance = rezCoin?.amount || wallet.balance?.available || 0;
  // wallet is a lean() document — call getCategoryBalance only when the method exists
  const categoryBalance =
    storeCategorySlug && typeof (wallet as any).getCategoryBalance === 'function'
      ? (wallet as any).getCategoryBalance(storeCategorySlug)
      : storeCategorySlug
        ? (wallet as any).categoryBalances?.[storeCategorySlug]?.available || 0
        : 0;
  const rezCoinsAvailable = categoryBalance > 0 ? categoryBalance : globalRezBalance;

  // Calculate expiry days for ReZ coins
  let rezExpiryDays = null;
  if (rezCoin?.expiryDate) {
    const now = new Date();
    const expiry = new Date(rezCoin.expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    rezExpiryDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (rezExpiryDays < 0) rezExpiryDays = 0;
  }

  // ==================== 2. PROMO COINS (Limited-time) ====================
  // Gold coin, expiry countdown, max 20% per bill redemption cap
  // Promo coins are global campaign coins stored in wallet.coins
  const promoCoin = wallet.coins?.find((c: any) => c.type === 'promo' && c.isActive && c.amount > 0);
  const promoCoinsAvailable = promoCoin?.amount || 0;

  // Check promo coin expiry
  let promoExpiringToday = false;
  let promoExpiresIn = null;
  const promoExpiryDate = promoCoin?.promoDetails?.expiryDate || promoCoin?.expiryDate;

  if (promoExpiryDate) {
    const now = new Date();
    const expiry = new Date(promoExpiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    promoExpiringToday = diffDays <= 1;
    promoExpiresIn = diffDays > 0 ? diffDays : 0;
  }

  // Get redemption cap (default 20% per bill)
  const promoRedemptionCap = promoCoin?.promoDetails?.maxRedemptionPercentage || 20;

  // ==================== 3. BRANDED COINS (Merchant-specific) ====================
  // Merchant color/logo, no expiry, only at that merchant
  let brandedCoins = null;

  if (wallet.brandedCoins && Array.isArray(wallet.brandedCoins)) {
    // Find coins for this specific store/merchant
    const storeBrandedCoin = wallet.brandedCoins.find((bc: any) => {
      // Match by storeId or merchantId
      const bcMerchantId = bc.merchantId?.toString();
      const storeMerchantId = (store as any).merchantId?.toString();
      return bcMerchantId === storeId || bcMerchantId === storeMerchantId;
    });

    if (storeBrandedCoin && storeBrandedCoin.amount > 0) {
      brandedCoins = {
        available: storeBrandedCoin.amount,
        using: 0,
        enabled: true,
        storeName: storeBrandedCoin.merchantName || store.name,
        storeId: storeId,
        color: storeBrandedCoin.merchantColor || '#6366F1',
        logo: storeBrandedCoin.merchantLogo,
        description: `Earned from ${storeBrandedCoin.merchantName || store.name}. Use at this store only.`,
        expiryDays: null, // Branded coins never expire
        redemptionCap: null, // No cap for branded coins
      };
    }
  }

  // ==================== RESPONSE ====================
  res.status(200).json({
    success: true,
    data: {
      // ReZ Coins - Universal rewards
      rezCoins: {
        available: rezCoinsAvailable,
        using: 0,
        enabled: true,
        color: '#00C06A', // ReZ Green
        icon: 'diamond', // Ionicon name
        description: 'Universal rewards usable anywhere on ReZ',
        expiryDays: rezExpiryDays,
        redemptionCap: null, // No redemption cap for ReZ coins
      },
      // Promo Coins - Limited-time campaigns
      promoCoins: {
        available: promoCoinsAvailable,
        using: 0,
        enabled: promoCoinsAvailable > 0,
        expiringToday: promoExpiringToday,
        expiresIn: promoExpiresIn,
        color: '#FFC857', // ReZ Gold
        icon: 'flame', // Ionicon name
        description: 'Special coins from campaigns & events',
        redemptionCap: promoRedemptionCap, // Max 20% per bill default
      },
      // Branded Coins - Merchant-specific
      brandedCoins,
      // Total applied (starts at 0, updated by frontend)
      totalApplied: 0,
      // Usage order for transparency
      usageOrder: ['promo', 'branded', 'rez'],
      usageOrderDescription: 'Promo Coins → Branded Coins → ReZ Coins (automatically applied for maximum savings)',
    },
  });
});

/**
 * Get enhanced payment methods with bank-specific offers
 * GET /api/store-payment/payment-methods/:storeId
 */
export const getEnhancedPaymentMethods = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const { amount } = req.query;
  const billAmount = amount ? parseFloat(amount as string) : 0;

  // Get store payment settings, reward rules and offers
  const store = await Store.findById(storeId)
    .select('paymentSettings rewardRules name offers')
    .populate('offers.discounts')
    .lean();

  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found',
    });
  }

  const settings = (store.paymentSettings || {}) as any;
  const rewardRules = (store as any).rewardRules || {};
  const paymentMethods: any[] = [];

  // Helper function to get offers for a payment method type from store's active offers
  const getOffersForPaymentMethod = (_methodType: string): any[] => {
    const offers: any[] = [];

    // Get store's base cashback if available
    if (rewardRules.baseCashbackPercent && rewardRules.baseCashbackPercent > 0) {
      const maxCashback = Math.min(50, Math.floor((billAmount * rewardRules.baseCashbackPercent) / 100));
      if (maxCashback > 0) {
        offers.push({
          type: 'cashback',
          title: `Get ${rewardRules.baseCashbackPercent}% cashback`,
          description: `Up to ₹${maxCashback} cashback`,
          value: rewardRules.baseCashbackPercent,
        });
      }
    }

    return offers;
  };

  // UPI Payment Method
  if (settings.acceptUPI !== false) {
    const upiOffers = getOffersForPaymentMethod('upi');

    paymentMethods.push({
      id: 'upi',
      type: 'upi',
      name: 'UPI',
      icon: 'phone-portrait-outline',
      isAvailable: true,
      description: 'GPay, PhonePe, Paytm, etc.',
      badge: 'best',
      offers: upiOffers,
      providers: ['gpay', 'phonepe', 'paytm', 'bhim'],
    });
  }

  // Credit Card Payment Method
  if (settings.acceptCards !== false) {
    const cardOffers = getOffersForPaymentMethod('card');

    // Add EMI offer for higher amounts
    if (billAmount >= 3000) {
      cardOffers.push({
        type: 'emi',
        title: 'No Cost EMI Available',
        description: 'Split payment into easy EMIs',
        value: 0,
      });
    }

    paymentMethods.push({
      id: 'credit_card',
      type: 'credit_card',
      name: 'Credit Card',
      icon: 'card-outline',
      isAvailable: true,
      description: 'Visa, Mastercard, Rupay',
      badge: billAmount >= 3000 ? 'popular' : undefined,
      offers: cardOffers,
      providers: ['visa', 'mastercard', 'rupay', 'amex'],
    });

    // Debit Card Payment Method
    paymentMethods.push({
      id: 'debit_card',
      type: 'debit_card',
      name: 'Debit Card',
      icon: 'card',
      isAvailable: true,
      description: 'All bank debit cards',
      offers: getOffersForPaymentMethod('debit'),
      providers: ['visa', 'mastercard', 'rupay'],
    });
  }

  // Net Banking
  paymentMethods.push({
    id: 'netbanking',
    type: 'netbanking',
    name: 'Net Banking',
    icon: 'business-outline',
    isAvailable: true,
    description: 'All major banks',
    offers: [],
    providers: ['sbi', 'hdfc', 'icici', 'axis', 'kotak'],
  });

  // Pay Later / BNPL
  if (settings.acceptPayLater !== false) {
    paymentMethods.push({
      id: 'pay_later',
      type: 'pay_later',
      name: 'Pay Later',
      icon: 'calendar-outline',
      isAvailable: true,
      description: 'Buy now, pay later',
      badge: 'new',
      offers:
        billAmount >= 500
          ? [
              {
                type: 'emi',
                title: 'Pay in 3 interest-free EMIs',
                description: 'Split your payment easily',
                value: 0,
              },
            ]
          : [],
      providers: ['simpl', 'lazypay', 'zestmoney'],
    });
  }

  res.status(200).json({
    success: true,
    data: paymentMethods,
  });
});

/**
 * Auto-optimize coin allocation for maximum savings
 * POST /api/store-payment/auto-optimize
 *
 * Usage Order (as per ReZ Wallet design):
 * 1. Promo Coins (Limited-time, max 20% per bill cap)
 * 2. Branded Coins (Store-specific, no cap)
 * 3. ReZ Coins (Universal, no cap)
 *
 * Automatically applied for maximum savings
 */
export const autoOptimizeCoins = asyncHandler(async (req: Request, res: Response) => {
  const { storeId, billAmount } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  if (!storeId || !billAmount || billAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'storeId and billAmount are required',
    });
  }

  // Get store settings
  const store = await Store.findById(storeId).select('paymentSettings merchantId name').lean();
  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found',
    });
  }

  // Store's max coin redemption percent (default 100%)
  const maxCoinPercent = store.paymentSettings?.maxCoinRedemptionPercent || 100;
  const maxCoinsAllowed = Math.floor((billAmount * maxCoinPercent) / 100);

  // Get user's wallet
  const wallet = await Wallet.findOne({ user: userId }).lean();

  if (!wallet) {
    return res.status(200).json({
      success: true,
      data: {
        rezCoins: { available: 0, using: 0, enabled: false, color: '#00C06A' },
        promoCoins: { available: 0, using: 0, enabled: false, expiringToday: false, color: '#FFC857' },
        brandedCoins: null,
        totalApplied: 0,
        maxAllowed: maxCoinsAllowed,
        optimizationStrategy: 'no_coins_available',
        savings: { coinsUsed: 0, percentOfBill: 0 },
      },
    });
  }

  // ==================== 1. REZ COINS ====================
  const rezCoin = wallet.coins?.find((c: any) => c.type === 'rez' && c.isActive);
  const rezCoinsAvailable = rezCoin?.amount || wallet.balance?.available || 0;

  // ==================== 2. PROMO COINS ====================
  // Promo coins are global campaign coins stored in wallet.coins
  const promoCoin = wallet.coins?.find((c: any) => c.type === 'promo' && c.isActive && c.amount > 0);
  const promoCoinsAvailable = promoCoin?.amount || 0;

  // Promo coin redemption cap (default 20% per bill)
  const promoRedemptionCap = promoCoin?.promoDetails?.maxRedemptionPercentage || 20;
  const maxPromoCoinsAllowed = Math.floor((billAmount * promoRedemptionCap) / 100);

  // Check promo coin expiry
  let promoExpiringToday = false;
  let promoExpiresIn = null;
  const promoExpiryDate = promoCoin?.promoDetails?.expiryDate || promoCoin?.expiryDate;

  if (promoExpiryDate) {
    const now = new Date();
    const expiry = new Date(promoExpiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    promoExpiringToday = diffDays <= 1;
    promoExpiresIn = diffDays > 0 ? diffDays : 0;
  }

  // ==================== 3. BRANDED COINS ====================
  let brandedCoinsAvailable = 0;
  let brandedCoinInfo: any = null;

  if (wallet.brandedCoins && Array.isArray(wallet.brandedCoins)) {
    const storeBrandedCoin = wallet.brandedCoins.find((bc: any) => {
      const bcMerchantId = bc.merchantId?.toString();
      const storeMerchantId = (store as any).merchantId?.toString();
      return bcMerchantId === storeId || bcMerchantId === storeMerchantId;
    });

    if (storeBrandedCoin && storeBrandedCoin.amount > 0) {
      brandedCoinsAvailable = storeBrandedCoin.amount;
      brandedCoinInfo = {
        storeName: storeBrandedCoin.merchantName || store.name,
        storeId: storeId,
        color: storeBrandedCoin.merchantColor || '#6366F1',
        logo: storeBrandedCoin.merchantLogo,
      };
    }
  }

  // ==================== AUTO-OPTIMIZATION ====================
  // Priority: Promo (expiring first, capped) > Branded > ReZ
  let remainingAllowance = maxCoinsAllowed;
  let promoUsing = 0;
  let brandedUsing = 0;
  let rezUsing = 0;

  // Step 1: Use Promo Coins first (capped at 20% of bill)
  if (promoCoinsAvailable > 0 && remainingAllowance > 0) {
    // Promo coins have their own cap (default 20%)
    const promoCanUse = Math.min(promoCoinsAvailable, maxPromoCoinsAllowed);
    promoUsing = Math.min(promoCanUse, remainingAllowance);
    remainingAllowance -= promoUsing;
  }

  // Step 2: Use Branded Coins (store-specific, no cap)
  if (brandedCoinsAvailable > 0 && remainingAllowance > 0) {
    brandedUsing = Math.min(brandedCoinsAvailable, remainingAllowance);
    remainingAllowance -= brandedUsing;
  }

  // Step 3: Use ReZ Coins (universal, no cap)
  if (rezCoinsAvailable > 0 && remainingAllowance > 0) {
    rezUsing = Math.min(rezCoinsAvailable, remainingAllowance);
    remainingAllowance -= rezUsing;
  }

  const totalApplied = promoUsing + brandedUsing + rezUsing;
  const percentOfBill = billAmount > 0 ? Math.round((totalApplied / billAmount) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      // ReZ Coins - Universal rewards
      rezCoins: {
        available: rezCoinsAvailable,
        using: rezUsing,
        enabled: rezUsing > 0,
        color: '#00C06A',
        icon: 'diamond',
        description: 'Universal rewards usable anywhere on ReZ',
        redemptionCap: null, // No cap
      },
      // Promo Coins - Limited-time campaigns
      promoCoins: {
        available: promoCoinsAvailable,
        using: promoUsing,
        enabled: promoUsing > 0,
        expiringToday: promoExpiringToday,
        expiresIn: promoExpiresIn,
        color: '#FFC857',
        icon: 'flame',
        description: 'Special coins from campaigns & events',
        redemptionCap: promoRedemptionCap, // Max 20% per bill
        maxAllowedForBill: maxPromoCoinsAllowed,
      },
      // Branded Coins - Merchant-specific
      brandedCoins:
        brandedCoinsAvailable > 0
          ? {
              available: brandedCoinsAvailable,
              using: brandedUsing,
              enabled: brandedUsing > 0,
              color: brandedCoinInfo?.color || '#6366F1',
              icon: 'storefront',
              description: `Use only at ${brandedCoinInfo?.storeName}`,
              redemptionCap: null, // No cap
              ...brandedCoinInfo,
            }
          : null,
      // Totals
      totalApplied,
      maxAllowed: maxCoinsAllowed,
      // Optimization details
      optimizationStrategy: 'promo_branded_rez_priority',
      usageOrder: ['promo', 'branded', 'rez'],
      usageOrderDescription: 'Promo → Branded → ReZ (for maximum savings)',
      // Savings summary
      savings: {
        coinsUsed: totalApplied,
        percentOfBill: percentOfBill,
        amountSaved: totalApplied,
      },
    },
  });
});

/**
 * Get user's membership tier for a store
 * GET /api/store-payment/membership/:storeId
 */
export const getStoreMembership = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  // Get user's visit count at this store
  const visitCount = await StorePayment.countDocuments({
    userId: new Types.ObjectId(userId),
    storeId: new Types.ObjectId(storeId),
    status: 'completed',
  });

  // Determine membership tier based on visits
  let tier = 'bronze';
  let tierName = 'Bronze Member';
  let nextTier: string | null = 'Silver Member';
  let visitsToNextTier = 5 - visitCount;

  if (visitCount >= 20) {
    tier = 'gold';
    tierName = 'Gold Member';
    nextTier = null;
    visitsToNextTier = 0;
  } else if (visitCount >= 10) {
    tier = 'silver';
    tierName = 'Silver Member';
    nextTier = 'Gold Member';
    visitsToNextTier = 20 - visitCount;
  } else if (visitCount >= 5) {
    tier = 'bronze';
    tierName = 'Bronze Member';
    nextTier = 'Silver Member';
    visitsToNextTier = 10 - visitCount;
  } else {
    tier = 'new';
    tierName = 'New Customer';
    nextTier = 'Bronze Member';
    visitsToNextTier = 5 - visitCount;
  }

  // Get tier benefits
  const tierBenefits: any = {
    new: { cashbackBonus: 0, prioritySupport: false, exclusiveOffers: false },
    bronze: { cashbackBonus: 1, prioritySupport: false, exclusiveOffers: false },
    silver: { cashbackBonus: 2, prioritySupport: true, exclusiveOffers: false },
    gold: { cashbackBonus: 5, prioritySupport: true, exclusiveOffers: true },
  };

  res.status(200).json({
    success: true,
    data: {
      tier,
      tierName,
      visitCount,
      nextTier,
      visitsToNextTier: Math.max(0, visitsToNextTier),
      benefits: tierBenefits[tier],
      isEarningRewards: true,
    },
  });
});

export const getStorePaymentHistory = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const { page = 1, limit = 20, status, startDate, endDate } = req.query;
  const userId = req.userId;
  const merchantId = req.merchantId;

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  // Build query based on user type
  const query: any = {};

  // Apply status filter — only filter if a valid status is provided.
  // Missing/empty/'all' = no status filter (show all statuses).
  const validStatuses = ['initiated', 'processing', 'completed', 'failed', 'cancelled', 'expired', 'refunded'];
  if (status && status !== 'all' && validStatuses.includes(status as string)) {
    query.status = status as string;
  }

  // Apply date range filter.
  // Use createdAt so it works for non-completed statuses too (failed/initiated
  // payments have no completedAt). When a specific completed-only status is
  // requested, the createdAt field is still valid since every payment has it.
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate as string);
    if (endDate) query.createdAt.$lte = new Date(endDate as string);
  }

  if (storeId && merchantId) {
    // Merchant requesting store-specific history — verify ownership before
    // filtering. Without this check, any merchant could read another
    // merchant's revenue by passing a different storeId.
    //
    // NOTE: this collection has two writers with divergent field names —
    // rez-backend's Store model uses `merchantId`, rez-merchant-service's
    // Store model uses `merchant`. Match either so ownership works for
    // stores created by either service until the schemas are unified.
    const store = await Store.findOne({
      _id: storeId,
      $or: [{ merchantId }, { merchant: merchantId }],
    })
      .select('_id')
      .lean();
    if (!store) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this store',
      });
    }
    query.storeId = new Types.ObjectId(storeId);
  } else if (userId) {
    // User requesting their own history
    query.userId = new Types.ObjectId(userId);
  } else {
    return res.status(400).json({
      success: false,
      message: 'User ID or Store ID required',
    });
  }

  // BUG FIX (C3 — POS data silo): Previously this endpoint queried only the
  // `StorePayment` collection, so the merchant Payments tab never showed any
  // POS bills. PosBill lives in its own collection. For MERCHANT requests
  // (scoped to a single owned store) we also fetch paid PosBills, normalise
  // them into the same transaction shape, merge, sort, and paginate. For
  // consumer-user requests we skip this — consumers don't see other people's
  // POS bills.
  const isMerchantRequest = Boolean(storeId && merchantId);

  // Build a PosBill query that mirrors the StorePayment filters where
  // possible. PosBill has no 'initiated'/'processing' lifecycle, so if the
  // caller filters by a specifically-online status we skip PosBill entirely.
  let posBillQuery: Record<string, any> | null = null;
  if (isMerchantRequest) {
    posBillQuery = { storeId: new Types.ObjectId(storeId as string) };
    // Map StorePayment status → PosBill status vocabulary where they overlap.
    const statusFilter = query.status as string | undefined;
    if (statusFilter) {
      if (statusFilter === 'completed') posBillQuery.status = 'paid';
      else if (statusFilter === 'refunded') posBillQuery.status = { $in: ['refunded', 'partial_refund'] };
      else if (statusFilter === 'cancelled') posBillQuery.status = 'cancelled';
      else {
        // statusFilter is online-only (initiated/processing/failed/expired) —
        // PosBill doesn't have equivalents, so exclude PosBill from the merge.
        posBillQuery = null;
      }
    }
    if (posBillQuery && query.createdAt) {
      posBillQuery.createdAt = query.createdAt;
    }
  }

  // Fetch transactions. Populate storeId to get logo. Sort by createdAt so
  // non-completed payments (no completedAt) still appear in order.
  const [storePayments, storePaymentCount, posBills, posBillCount] = await Promise.all([
    StorePayment.find(query)
      .sort({ createdAt: -1 })
      .select(
        'paymentId storeId storeName billAmount coinRedemption remainingAmount paymentMethod status rewards createdAt completedAt',
      )
      .populate('storeId', 'logo name')
      .lean(),
    StorePayment.countDocuments(query),
    posBillQuery
      ? PosBill.find(posBillQuery)
          .sort({ createdAt: -1 })
          .select('_id billNumber storeId totalAmount paymentMethod status paidAt createdAt customerPhone')
          .populate('storeId', 'logo name')
          .lean()
      : Promise.resolve([] as any[]),
    posBillQuery ? PosBill.countDocuments(posBillQuery) : Promise.resolve(0),
  ]);

  // Normalise both collections into the same transaction DTO shape.
  const storePaymentDTOs = storePayments.map((t: any) => {
    const storeRef = t.storeId && typeof t.storeId === 'object' ? t.storeId : null;
    return {
      id: t._id,
      paymentId: t.paymentId,
      storeId: storeRef?._id || t.storeId,
      storeName: t.storeName,
      storeLogo: storeRef?.logo || undefined,
      amount: t.billAmount || 0,
      coinsUsed: t.coinRedemption?.totalAmount || 0,
      paymentMethod: t.paymentMethod,
      status: t.status,
      rewards: t.rewards,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
      source: 'online' as const,
    };
  });

  const posBillDTOs = posBills.map((b: any) => {
    const storeRef = b.storeId && typeof b.storeId === 'object' ? b.storeId : null;
    // Map PosBill status → StorePayment-style status so the FE badges render.
    const statusMap: Record<string, string> = {
      paid: 'completed',
      pending: 'initiated',
      cancelled: 'cancelled',
      refunded: 'refunded',
      partial_refund: 'refunded',
    };
    return {
      id: b._id,
      paymentId: b.billNumber || b._id?.toString?.() || '',
      storeId: storeRef?._id || b.storeId,
      storeName: storeRef?.name || '',
      storeLogo: storeRef?.logo || undefined,
      amount: b.totalAmount || 0,
      coinsUsed: 0,
      paymentMethod: b.paymentMethod || 'cash',
      status: statusMap[b.status] || b.status,
      rewards: undefined,
      createdAt: b.createdAt,
      completedAt: b.paidAt || b.createdAt,
      source: 'pos' as const,
    };
  });

  // Merge, sort by createdAt desc, then paginate in memory. This is fine for
  // POS-scale stores (thousands of bills/month); if we ever see 100k+ bills
  // on a single merchant we'd switch to a MongoDB $unionWith aggregation.
  const merged = [...storePaymentDTOs, ...posBillDTOs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const total = storePaymentCount + posBillCount;
  const pageSlice = merged.slice(skip, skip + limitNum);
  const hasMore = skip + pageSlice.length < total;

  res.status(200).json({
    success: true,
    data: {
      transactions: pageSlice,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: hasMore,
        hasPrev: pageNum > 1,
        hasMore,
      },
    },
  });
});

// ==================== MERCHANT PAYMENT STATS ====================

/**
 * Get payment statistics for a store (merchant only)
 * GET /api/store-payment/stats/:storeId
 */
export const getStorePaymentStats = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const merchantId = req.merchantId;

  if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
    return res.status(400).json({ success: false, message: 'Invalid store ID' });
  }

  // Verify ownership — a merchant cannot read another merchant's stats.
  // See getStorePaymentHistory above for the $or rationale (field drift
  // between rez-backend and rez-merchant-service Store schemas).
  if (!merchantId) {
    return res.status(401).json({ success: false, message: 'Merchant auth required' });
  }
  const ownedStore = await Store.findOne({
    _id: storeId,
    $or: [{ merchantId }, { merchant: merchantId }],
  })
    .select('_id')
    .lean();
  if (!ownedStore) {
    return res.status(403).json({ success: false, message: 'You do not own this store' });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const storeObjectId = new mongoose.Types.ObjectId(storeId);

  // BUG FIX (C3): Stats now include both StorePayment (online) and PosBill
  // (in-store) so the Payments page "today" / "this month" totals are not
  // blind to POS revenue. Previously a cashier could ring up ₹30k in cash
  // sales and the stats card still showed ₹0.
  const [todayStats, monthStats, paymentMethodBreakdown, todayPosStats, monthPosStats, posPaymentMethodBreakdown] =
    await Promise.all([
      StorePayment.aggregate([
        { $match: { storeId: storeObjectId, status: 'completed', completedAt: { $gte: todayStart } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$billAmount' } } },
      ]),
      StorePayment.aggregate([
        { $match: { storeId: storeObjectId, status: 'completed', completedAt: { $gte: monthStart } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$billAmount' },
            avgValue: { $avg: '$billAmount' },
          },
        },
      ]),
      StorePayment.aggregate([
        { $match: { storeId: storeObjectId, status: 'completed', completedAt: { $gte: monthStart } } },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$billAmount' } } },
        { $sort: { count: -1 } },
      ]),
      // POS today
      PosBill.aggregate([
        { $match: { storeId: storeObjectId, status: 'paid', paidAt: { $gte: todayStart } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      ]),
      // POS this month
      PosBill.aggregate([
        { $match: { storeId: storeObjectId, status: 'paid', paidAt: { $gte: monthStart } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
            totalAmt: { $sum: '$totalAmount' },
          },
        },
      ]),
      // POS payment method breakdown (this month)
      PosBill.aggregate([
        { $match: { storeId: storeObjectId, status: 'paid', paidAt: { $gte: monthStart } } },
        {
          $group: { _id: { $ifNull: ['$paymentMethod', 'cash'] }, count: { $sum: 1 }, total: { $sum: '$totalAmount' } },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

  const todayOnline = todayStats[0] || { count: 0, revenue: 0 };
  const todayPos = todayPosStats[0] || { count: 0, revenue: 0 };
  const monthOnline = monthStats[0] || { count: 0, revenue: 0, avgValue: 0 };
  const monthPos = monthPosStats[0] || { count: 0, revenue: 0 };

  const todayCount = todayOnline.count + todayPos.count;
  const todayRevenue = todayOnline.revenue + todayPos.revenue;
  const monthCount = monthOnline.count + monthPos.count;
  const monthRevenue = monthOnline.revenue + monthPos.revenue;
  const monthAvg = monthCount > 0 ? monthRevenue / monthCount : 0;

  // Merge payment method buckets across both collections.
  const methodMap = new Map<string, { count: number; total: number }>();
  for (const pm of paymentMethodBreakdown) {
    const key = pm._id || 'unknown';
    const prev = methodMap.get(key) || { count: 0, total: 0 };
    methodMap.set(key, { count: prev.count + pm.count, total: prev.total + pm.total });
  }
  for (const pm of posPaymentMethodBreakdown) {
    const key = pm._id || 'cash';
    const prev = methodMap.get(key) || { count: 0, total: 0 };
    methodMap.set(key, { count: prev.count + pm.count, total: prev.total + pm.total });
  }
  const paymentMethods = Array.from(methodMap.entries())
    .map(([method, v]) => ({ method, count: v.count, total: v.total }))
    .sort((a, b) => b.count - a.count);

  res.json({
    success: true,
    data: {
      today: {
        paymentCount: todayCount,
        revenue: todayRevenue,
      },
      thisMonth: {
        paymentCount: monthCount,
        revenue: monthRevenue,
        averageTransactionValue: Math.round(monthAvg),
      },
      paymentMethods,
    },
  });
});

// Per-table QR code handlers moved to qrController.ts
