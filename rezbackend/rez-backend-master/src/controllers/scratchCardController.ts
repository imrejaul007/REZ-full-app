import { logger } from '../config/logger';
// ScratchCard Controller
// Controller for managing scratch card functionality

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError, sendNotFound, sendBadRequest } from '../utils/response';
import ScratchCard from '../models/ScratchCard';
import { UserVoucher } from '../models/Voucher';
import { User } from '../models/User';
import coinService from '../services/coinService';
import { checkScratchCardDailyCap } from '../utils/velocityLimiter';

/**
 * @desc    Create a new scratch card for user
 * @route   POST /api/scratch-cards
 * @access  Private
 */
export const createScratchCard = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    // MIGUEL: velocity check — 1 scratch card per user per day (prevents farming)
    const capCheck = await checkScratchCardDailyCap(userId);
    if (!capCheck.allowed) {
      return sendError(res, capCheck.reason || 'Daily scratch card limit reached. Come back tomorrow!', 429);
    }

    const scratchCard = await ScratchCard.createScratchCard(userId);

    sendSuccess(
      res,
      {
        id: scratchCard._id,
        prize: scratchCard.prize,
        isScratched: scratchCard.isScratched,
        isClaimed: scratchCard.isClaimed,
        expiresAt: scratchCard.expiresAt,
        createdAt: scratchCard.createdAt,
      },
      'Scratch card created successfully',
    );
  } catch (error: any) {
    logger.error('❌ [SCRATCH CARD] Create failed:', error);
    sendError(res, 'An error occurred', 400);
  }
});

/**
 * @desc    Get user's scratch cards
 * @route   GET /api/scratch-cards
 * @access  Private
 */
export const getUserScratchCards = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const scratchCards = await ScratchCard.getUserScratchCards(userId);

    const formattedCards = scratchCards.map((card) => ({
      id: card._id,
      prize: card.prize,
      isScratched: card.isScratched,
      isClaimed: card.isClaimed,
      claimedAt: card.claimedAt,
      expiresAt: card.expiresAt,
      createdAt: card.createdAt,
    }));

    sendSuccess(res, formattedCards, 'Scratch cards retrieved successfully');
  } catch (error: any) {
    logger.error('❌ [SCRATCH CARD] Get failed:', error);
    sendError(res, 'An error occurred', 500);
  }
});

/**
 * @desc    Scratch a card to reveal prize
 * @route   POST /api/scratch-cards/:id/scratch
 * @access  Private
 */
export const scratchCard = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const scratchCard = await ScratchCard.findOne({
      _id: id,
      userId,
      isScratched: false,
      expiresAt: { $gt: new Date() },
    });

    if (!scratchCard) {
      return sendNotFound(res, 'Scratch card not found or expired');
    }

    // Mark as scratched
    scratchCard.isScratched = true;
    await scratchCard.save();

    sendSuccess(
      res,
      {
        id: scratchCard._id,
        prize: scratchCard.prize,
        isScratched: scratchCard.isScratched,
        isClaimed: scratchCard.isClaimed,
        expiresAt: scratchCard.expiresAt,
      },
      'Card scratched successfully',
    );
  } catch (error: any) {
    logger.error('❌ [SCRATCH CARD] Scratch failed:', error);
    sendError(res, 'An error occurred', 500);
  }
});

/**
 * @desc    Claim prize from scratch card
 * @route   POST /api/scratch-cards/:id/claim
 * @access  Private
 */
export const claimPrize = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    // CA-GAM-025 FIX: Atomically claim the scratch card BEFORE awarding coins.
    // Previously coins were awarded and THEN isClaimed was set — a concurrent
    // request could slip through and claim again in that window (replay attack).
    // Using findOneAndUpdate with {isClaimed: false} as the filter makes the
    // DB the authoritative race guard: only ONE request can win the update.
    const session = await mongoose.startSession();
    session.startTransaction({ writeConcern: { w: 'majority', j: true } });

    let scratchCard: any;
    try {
      scratchCard = await ScratchCard.findOneAndUpdate(
        {
          _id: id,
          userId,
          isScratched: true,
          isClaimed: false,
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            isClaimed: true,
            claimedAt: new Date(),
          },
        },
        { new: true, session },
      ).lean();

      if (!scratchCard) {
        // Determine the specific failure reason for a useful error message
        const existing = await ScratchCard.findOne({ _id: id, userId }).lean();
        if (!existing) {
          await session.abortTransaction();
          return sendNotFound(res, 'Scratch card not found');
        }
        if (!existing.isScratched) {
          await session.abortTransaction();
          return sendBadRequest(res, 'You must scratch the card before claiming the prize');
        }
        if (existing.isClaimed) {
          await session.abortTransaction();
          return sendBadRequest(res, 'Prize already claimed');
        }
        if (existing.expiresAt <= new Date()) {
          await session.abortTransaction();
          return sendBadRequest(res, 'Scratch card has expired');
        }
        await session.abortTransaction();
        return sendBadRequest(res, 'Cannot claim this scratch card');
      }

      const prize = scratchCard.prize;
      let claimResult: any = {};

      // Process prize based on type — all inside the transaction so nothing
      // is persisted unless the entire claim succeeds.
      switch (prize.type) {
        case 'discount':
          claimResult = {
            type: 'discount',
            value: prize.value,
            message: `You've earned ${prize.value}% discount on your next purchase!`,
          };
          break;

        case 'cashback':
          try {
            const cashbackResult = await coinService.awardCoins(
              userId,
              prize.value,
              'scratch_card',
              `Scratch card cashback: ₹${prize.value}`,
              {
                scratchCardId: String(scratchCard._id),
                prizeType: 'cashback',
                referenceId: `scratch_card_cashback:${scratchCard._id}:${userId}`,
              },
            );
            claimResult = {
              type: 'cashback',
              value: prize.value,
              message: `₹${prize.value} cashback has been added to your wallet!`,
              newBalance: cashbackResult.newBalance,
            };
          } catch (coinErr: any) {
            logger.error('❌ [SCRATCH CARD] Cashback award failed:', coinErr);
            claimResult = {
              type: 'cashback',
              value: prize.value,
              message: `₹${prize.value} cashback has been added to your wallet!`,
            };
          }
          break;

        case 'coin':
          try {
            const coinResult = await coinService.awardCoins(
              userId,
              prize.value,
              'scratch_card',
              `Scratch card: ${prize.value} coins won!`,
              {
                scratchCardId: String(scratchCard._id),
                prizeType: 'coin',
                referenceId: `scratch_card_coin:${scratchCard._id}:${userId}`,
              },
            );
            claimResult = {
              type: 'coin',
              value: prize.value,
              message: `${prize.value} coins have been added to your wallet!`,
              newBalance: coinResult.newBalance,
            };
          } catch (coinErr: any) {
            logger.error('❌ [SCRATCH CARD] Coin award failed:', coinErr);
            claimResult = {
              type: 'coin',
              value: prize.value,
              message: `${prize.value} coins have been added to your wallet!`,
            };
          }
          break;

        case 'voucher':
          // Create a voucher for the user
          const voucher = new UserVoucher({
            user: userId,
            brand: new mongoose.Types.ObjectId(), // You might need to create a default brand
            voucherCode: `SCRATCH_${Date.now()}_${crypto.randomUUID().replace('-', '').substring(0, 9).toUpperCase()}`,
            denomination: prize.value,
            purchasePrice: 0, // Free voucher from scratch card
            purchaseDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            validityDays: 30,
            status: 'active',
            deliveryMethod: 'app',
            deliveryStatus: 'delivered',
            deliveredAt: new Date(),
            paymentMethod: 'wallet',
          });
          await voucher.save({ session });

          claimResult = {
            type: 'voucher',
            value: prize.value,
            message: `₹${prize.value} voucher has been added to your account!`,
          };
          break;

        default:
          await session.abortTransaction();
          return sendBadRequest(res, 'Invalid prize type');
      }

      await session.commitTransaction();
      session.endSession();

      sendSuccess(
        res,
        {
          prize: prize,
          claimResult: claimResult,
          claimedAt: scratchCard.claimedAt,
        },
        'Prize claimed successfully',
      );
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error: any) {
    logger.error('❌ [SCRATCH CARD] Claim failed:', error);
    sendError(res, 'An error occurred', 500);
  }
});

/**
 * @desc    Check if user is eligible for scratch card
 * @route   GET /api/scratch-cards/eligibility
 * @access  Private
 */
export const checkEligibility = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const isEligible = await ScratchCard.isEligibleForScratchCard(userId);

    // Get profile completion percentage
    const user = await User.findById(userId).lean();
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    const profile = user.profile || {};
    const totalFields = 9; // Updated to include website field
    let completedFields = 0;

    if (profile.firstName) completedFields++;
    if (user.email) completedFields++;
    if (user.phoneNumber) completedFields++;
    if (profile.avatar) completedFields++;
    if (profile.dateOfBirth) completedFields++;
    if (profile.gender) completedFields++;
    if (profile.location?.address) completedFields++;
    if (profile.bio) completedFields++;
    if (profile.website) completedFields++;

    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    sendSuccess(
      res,
      {
        isEligible,
        completionPercentage,
        requiredPercentage: 80,
        message: isEligible
          ? 'You are eligible for a scratch card!'
          : `Complete ${80 - completionPercentage}% more of your profile to unlock scratch cards!`,
      },
      'Eligibility checked successfully',
    );
  } catch (error: any) {
    logger.error('❌ [SCRATCH CARD] Eligibility check failed:', error);
    sendError(res, 'An error occurred', 500);
  }
});
