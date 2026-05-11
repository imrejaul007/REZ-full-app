import { Request, Response } from 'express';
import { GiftCard, UserGiftCard } from '../models/GiftCard';
import { Wallet } from '../models/Wallet';
import { sendSuccess, sendError, sendBadRequest, sendNotFound } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { validateAmount } from '../utils/walletValidation';
import { logger } from '../config/logger';
import { checkVelocity } from '../services/walletVelocityService';
import { walletService } from '../services/walletService';

/**
 * @desc    Get gift card catalog
 * @route   GET /api/wallet/gift-cards/catalog
 * @access  Private
 */
export const getCatalog = asyncHandler(async (req: Request, res: Response) => {
  const { category, search } = req.query;

  const query: any = { isActive: true };
  if (category && category !== 'all') query.category = category;
  if (search) query.$text = { $search: search as string };

  const giftCards = await GiftCard.find(query).select('-__v').sort({ cashbackPercentage: -1 }).lean();

  const categories = await GiftCard.distinct('category', { isActive: true });

  sendSuccess(res, { giftCards, categories }, 'Gift card catalog retrieved');
});

/**
 * @desc    Purchase a gift card
 * @route   POST /api/wallet/gift-cards/purchase
 * @access  Private
 */
export const purchaseGiftCard = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { giftCardId, amount } = req.body;

  if (!userId) return sendError(res, 'User not authenticated', 401);
  if (!giftCardId) return sendBadRequest(res, 'Gift card ID is required');
  const amountCheck = validateAmount(amount, { fieldName: 'Gift card amount' });
  if (!amountCheck.valid) return sendBadRequest(res, amountCheck.error);
  const validatedAmount = amountCheck.amount;

  // Velocity check
  const velocityResult = await checkVelocity(userId, 'spend');
  if (!velocityResult.allowed) {
    return sendBadRequest(
      res,
      `Gift card purchase rate limit exceeded. Try again in ${Math.ceil(velocityResult.resetInSeconds / 60)} minutes.`,
    );
  }

  // Find gift card template
  const giftCard = await GiftCard.findOne({ _id: giftCardId, isActive: true }).lean();
  if (!giftCard) return sendBadRequest(res, 'Gift card not available');

  // Validate denomination
  if (!giftCard.denominations.includes(validatedAmount)) {
    return sendBadRequest(res, `Invalid amount. Available: ${giftCard.denominations.join(', ')}`);
  }

  // Check wallet balance
  const wallet = await Wallet.findOne({ user: userId }).lean();
  if (!wallet) return sendError(res, 'Wallet not found', 404);
  if (wallet.isFrozen) return sendBadRequest(res, 'Wallet is frozen');
  if (wallet.balance.available < validatedAmount) return sendBadRequest(res, 'Insufficient balance');

  // Calculate cashback upfront
  const cashback = Math.floor((validatedAmount * giftCard.cashbackPercentage) / 100);
  const netDebit = validatedAmount - cashback;

  // Create user gift card first (needed for referenceId)
  const userGiftCard = await UserGiftCard.create({
    user: userId,
    giftCard: giftCard._id,
    amount: validatedAmount,
    balance: validatedAmount,
    expiresAt: new Date(Date.now() + giftCard.validityDays * 24 * 60 * 60 * 1000),
    status: 'active',
  });

  // CONCURRENCY FIX #4: Atomic wallet debit + cashback credit in single operation
  // Prevents race where debit succeeds but cashback application races with another concurrent purchase
  //
  // HIGH-003 FIX: Track whether wallet was deducted before entering the catch block.
  // If walletUpdateResult succeeded but walletService.debit() (logging) fails, we must NOT
  // delete the user gift card — the user's wallet was already charged. Instead we log the
  // failure and leave the gift card active. The missing CoinTransaction can be reconciled later.
  let walletDeducted = false;
  try {
    // Perform both operations in a single findOneAndUpdate:
    // 1. Debit the net amount (netDebit = validatedAmount - cashback)
    // 2. Credit the cashback
    // This ensures atomicity: if debit fails ($gte guard), neither operation happens
    const walletUpdateResult = await Wallet.findOneAndUpdate(
      { user: userId, 'balance.available': { $gte: netDebit }, isFrozen: false },
      {
        $inc: {
          'balance.available': -netDebit, // Deduct net from available
          'balance.cashback': cashback, // Add cashback immediately
          'balance.total': -netDebit + cashback, // Update total (net debit, plus cashback credit)
          'statistics.totalCashback': cashback,
        },
      },
      { new: true },
    );

    if (!walletUpdateResult) {
      // Failed: insufficient balance or frozen wallet — wallet NOT charged, soft-delete the card
      await UserGiftCard.findByIdAndUpdate(userGiftCard._id, {
        $set: { deletedAt: new Date(), status: 'expired' },
      });
      return sendBadRequest(res, 'Insufficient balance or wallet is frozen');
    }

    // Wallet has been atomically deducted — mark so catch block knows not to delete gift card
    walletDeducted = true;

    // Atomic wallet debit complete. Now create CoinTransaction + LedgerEntry via walletService
    // NOTE: walletService.debit is called with amount=netDebit (already deducted above)
    // We pass metadata with the full transaction details for logging
    await walletService.debit({
      userId,
      amount: netDebit,
      source: 'purchase',
      description: `Purchased ${giftCard.name} gift card`,
      operationType: 'gift_card_purchase',
      referenceId: String(userGiftCard._id),
      referenceModel: 'UserGiftCard',
      metadata: {
        giftCardId: giftCard._id,
        userGiftCardId: userGiftCard._id,
        cashback,
        walletTxnAlreadyApplied: true, // Flag: wallet balance already updated
      },
    });
  } catch (debitError: any) {
    if (walletDeducted) {
      // HIGH-003 FIX: Wallet was already charged — do NOT delete the gift card.
      // User has paid; the card must remain active. The missing CoinTransaction log
      // can be reconciled via admin tools. Log for ops alerting.
      logger.error('[GIFT CARD] Transaction log failed AFTER wallet deduction — gift card preserved', {
        userGiftCardId: String(userGiftCard._id),
        userId,
        netDebit,
        error: debitError?.message,
      });
      // Fall through to the success response — user has their card and paid the right amount.
    } else {
      // Wallet was NOT charged — soft-delete the gift card (retain record for audit trail)
      await UserGiftCard.findByIdAndUpdate(userGiftCard._id, {
        $set: { deletedAt: new Date(), status: 'expired' },
      });
      logger.error('[GIFT CARD] Purchase failed before wallet deduction — soft-deleted gift card:', debitError);
      return sendBadRequest(res, debitError.message || 'Insufficient balance or wallet is frozen');
    }
  }

  // Update gift card stats
  await GiftCard.findByIdAndUpdate(giftCard._id, { $inc: { totalIssued: 1 } });

  sendSuccess(
    res,
    {
      userGiftCard: {
        id: String(userGiftCard._id),
        giftCardName: giftCard.name,
        giftCardLogo: giftCard.logo,
        giftCardColor: giftCard.color,
        amount: validatedAmount,
        balance: validatedAmount,
        expiresAt: userGiftCard.expiresAt,
        status: 'active',
        cashbackEarned: cashback,
      },
    },
    `Gift card purchased! ${cashback > 0 ? `+${cashback} NC cashback earned.` : ''}`,
  );
});

/**
 * @desc    Get user's purchased gift cards
 * @route   GET /api/wallet/gift-cards/mine
 * @access  Private
 */
export const getMyGiftCards = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { status } = req.query;

  if (!userId) return sendError(res, 'User not authenticated', 401);

  const query: any = { user: userId };
  if (status && status !== 'all') query.status = status;

  const cards = await UserGiftCard.find(query)
    .sort({ createdAt: -1 })
    .populate('giftCard', 'name logo color category')
    .lean();

  // Mask codes — only show last 4 chars
  const maskedCards = cards.map((card: any) => ({
    ...card,
    code: '****-****-' + (card.code?.slice(-4) || '????'),
    pin: card.pin ? '****' : undefined,
  }));

  sendSuccess(res, { giftCards: maskedCards }, 'Gift cards retrieved');
});

/**
 * @desc    Reveal gift card code (sensitive — could add OTP gate)
 * @route   GET /api/wallet/gift-cards/:id/reveal
 * @access  Private
 */
export const revealGiftCardCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  if (!userId) return sendError(res, 'User not authenticated', 401);

  // HIGH-001 FIX: Rate-limit reveal calls to prevent enumeration / card-resale abuse.
  // Re-uses the existing checkVelocity('reveal') bucket (1 req/10s per user).
  const velocityResult = await checkVelocity(userId, 'reveal');
  if (!velocityResult.allowed) {
    return sendBadRequest(
      res,
      `Too many reveal attempts. Try again in ${Math.ceil(velocityResult.resetInSeconds / 60)} minutes.`,
    );
  }

  // CRIT-001 FIX: Do NOT use .lean() here — revealCode() is a Mongoose instance method
  // that would throw TypeError: card.revealCode is not a function on a plain JS object.
  const card = await UserGiftCard.findOne({ _id: id, user: userId });
  if (!card) return sendNotFound(res, 'Gift card not found');

  // Reveal decrypted code
  const code = (card as any).revealCode();

  sendSuccess(res, { code, pin: card.pin ? 'Contact support for PIN' : undefined }, 'Code revealed');
});
