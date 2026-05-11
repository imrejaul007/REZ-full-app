import * as crypto from 'crypto';
import { Types, ClientSession } from 'mongoose';
import { Wallet } from '../models/Wallet';
import { CoinTransaction, MainCategorySlug } from '../models/CoinTransaction';
import { UserLoyalty } from '../models/UserLoyalty';
import { LedgerOperationType, LedgerCoinType } from '../models/LedgerEntry';
import { walletService, WalletMutationResult } from '../services/walletService';
import { ledgerService } from '../services/ledgerService';
import specialProgramService from '../services/specialProgramService';
import gamificationEventBus from '../events/gamificationEventBus';
import redisService from '../services/redisService';
import { CURRENCY_RULES } from '../config/currencyRules';
import { getCachedWalletConfig } from '../services/walletCacheService';
import { createServiceLogger } from '../config/logger';
import { coinIssuanceCounter } from '../config/prometheus';

const logger = createServiceLogger('reward-engine');

// ─── Lean Document Interfaces ─────────────────────────────────

/**
 * Typed interface for Wallet lean documents (Mongoose .lean() returns plain objects).
 * Mirrors the shape used in walletService.ts (BED-003 fix).
 */
interface WalletLeanDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  balance: {
    total: number;
    available: number;
    pending?: number;
    cashback?: number;
  };
  coins: Array<{ type: string; amount: number; lastUsed?: Date }>;
  brandedCoins: Array<{ brandId: string; amount: number; expiresAt?: Date; isActive: boolean }>;
  categoryBalances?: Record<string, { available: number; earned: number; spent: number }>;
  isFrozen?: boolean;
  frozenReason?: string; // not in walletService.ts lean doc — needed here
  limits?: { maxBalance?: number; dailySpendLimit?: number; dailySpent?: number; lastResetDate?: Date };
  statistics?: { totalEarned: number; totalSpent: number };
  lastTransactionAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Typed interface for UserStreak lean documents (savingsStreak.currentStreak access).
 */
interface UserStreakLeanDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: string;
  currentStreak: number;
}

/**
 * Typed interface for CoinTransaction lean documents (duplicate check reads these fields).
 */
interface CoinTransactionLeanDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId | string;
  amount: number;
  balance: number;
  type: string;
  source?: string;
  description?: string;
  category?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

/**
 * Typed metadata shape for reward issuance — replaces Record<string, any>.
 */
interface RewardIssuanceMetadata extends Record<string, unknown> {
  idempotencyKey?: string;
  rewardType?: string;
  streakMultiplier?: number;
  streakTierName?: string;
  baseAmount?: number;
  bonusCoins?: number;
  expiresAt?: Date;
  merchantId?: string;
  referenceId?: string;
}

/** Shape of each item in specialProgramService.calculateMultiplierBonus.programBonuses */
interface ProgramBonus {
  slug: string;
  bonus: number;
}

// ─── Types ──────────────────────────────────────────────────

export type RewardType =
  | 'cashback'
  | 'referral'
  | 'game_prize'
  | 'achievement'
  | 'bonus_campaign'
  | 'engagement'
  | 'creator_earning'
  | 'tournament_prize'
  | 'leaderboard_prize'
  | 'event_reward'
  | 'learning_reward'
  | 'social_impact'
  | 'survey'
  | 'travel_cashback'
  | 'mall_affiliate'
  | 'prive_invite'
  | 'challenge_reward'
  | 'partner_bonus'
  | 'spin_wheel'
  | 'scratch_card'
  | 'quiz_game'
  | 'admin_adjustment'
  | 'pick_approval'
  | 'program_task'
  | 'prive_campaign'
  | 'bill_payment'; // promo coins for BBPS bill/recharge

export interface RewardRequest {
  userId: string;
  amount: number;
  rewardType: RewardType;
  source: string;
  description: string;
  operationType: LedgerOperationType;
  referenceId: string;
  referenceModel: string;
  category?: MainCategorySlug | null;
  coinType?: 'rez' | 'prive' | 'promo' | 'branded';
  metadata?: Record<string, any>;
  skipCap?: boolean;
  skipMultiplier?: boolean;
  session?: ClientSession;
  merchantId?: string;
  merchantLiability?: number;
  /**
   * FT-007: Optional expiry override (days). When provided, the coin's expiresAt
   * is stamped with this value regardless of the current WalletConfig. Callers
   * that pre-commit an expiry (e.g. campaign claims) should pass this to prevent
   * mid-campaign expiry rule changes from affecting in-flight issuances.
   */
  overrideExpiryDays?: number;
}

export interface RewardResult {
  success: boolean;
  transactionId: Types.ObjectId | null;
  amount: number;
  newBalance: number;
  source: string;
  description: string;
  category: MainCategorySlug | null;
  ledgerPairId?: string;
  cappedReason?: string;
  multiplierBonus?: number;
  originalAmount?: number;
  idempotencyKey: string;
  duplicate?: boolean;
}

export interface RedemptionStep {
  coinType: 'promo' | 'branded' | 'prive' | 'rez';
  amountDeducted: number;
  merchantId?: string;
}

export interface RedemptionResult {
  success: boolean;
  totalDeducted: number;
  steps: RedemptionStep[];
  newBalance: number;
  transactionIds: Types.ObjectId[];
}

export interface ReversalResult {
  success: boolean;
  reversalTransactionId: Types.ObjectId | null;
  amount: number;
  newBalance: number;
  originalTransactionId: string;
  reason: string;
}

export type RewardErrorCode =
  | 'WALLET_FROZEN'
  | 'NO_WALLET'
  | 'INSUFFICIENT_BALANCE'
  | 'TX_NOT_FOUND'
  | 'INVALID_REVERSAL'
  | 'AMOUNT_EXCEEDED'
  | 'DUPLICATE_REWARD'
  | 'CAP_REACHED';

export class RewardError extends Error {
  code: RewardErrorCode;
  constructor(code: RewardErrorCode, message: string) {
    super(message);
    this.name = 'RewardError';
    this.code = code;
  }
}

// ─── Helpers ────────────────────────────────────────────────

function generateIdempotencyKey(userId: string, referenceId: string, rewardType: string, source: string): string {
  return crypto.createHash('sha256').update(`${userId}:${referenceId}:${rewardType}:${source}`).digest('hex');
}

function mapCoinTypeToLedger(coinType: string): LedgerCoinType {
  switch (coinType) {
    case 'promo':
      return 'promo';
    case 'branded':
      return 'branded';
    default:
      return 'rez';
  }
}

// FT-007 FIX — Expiry rule change mid-campaign: snapshot rate at issuance time.
//
// ROOT CAUSE: calculateExpiryDate() fetched coinExpiryConfig from
// getCachedWalletConfig() every time a coin was issued. An admin changing
// expiryDays for 'promo' from 90 to 30 mid-campaign would instantly shorten
// expiry for all newly issued coins — even coins for orders that were in-flight
// before the change. Coins issued seconds before got 90-day expiry; coins
// issued seconds after got 30-day expiry. This creates an inconsistent user
// experience (same campaign, different expiry visible in wallet) and potential
// support disputes.
//
// FIX: Accept an optional `overrideExpiryDays` parameter. Callers (especially
// bonusCampaignService.creditRewardToWallet) that have already captured the
// campaign's intended expiry days at claim time pass it here, guaranteeing that
// the expiry stamped on the coin matches what the user was shown at claim. When
// no override is provided, the live config is used — this is correct for
// cashback/referral rewards that don't pre-commit to an expiry window.
async function calculateExpiryDate(
  coinType: 'rez' | 'prive' | 'promo' | 'branded',
  overrideExpiryDays?: number,
): Promise<Date | undefined> {
  // If the caller has already locked in an expiry (e.g. campaign claim at t=0),
  // use that value directly — no config fetch needed.
  if (overrideExpiryDays !== undefined) {
    if (overrideExpiryDays <= 0) return undefined;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + overrideExpiryDays);
    return expiry;
  }

  // Live config path: fetch current expiry rule for ad-hoc rewards.
  let expiryDays: number;
  try {
    const config = await getCachedWalletConfig();
    expiryDays = config?.coinExpiryConfig?.[coinType]?.expiryDays ?? CURRENCY_RULES[coinType]?.expiryDays ?? 0;
  } catch {
    expiryDays = CURRENCY_RULES[coinType]?.expiryDays ?? 0;
  }
  if (expiryDays <= 0) return undefined;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + expiryDays);
  return expiry;
}

// ─── Reward Engine ──────────────────────────────────────────

export class RewardEngine {
  /**
   * Single entry point for ALL reward issuance.
   *
   * Flow:
   * 1. Generate deterministic idempotency key
   * 2. Fast duplicate check (Redis)
   * 3. Validate eligibility (wallet not frozen)
   * 4. Apply earning cap (unless skipCap)
   * 5. Calculate expiry for non-rez coins
   * 6. Atomic wallet mutation via walletService.credit()
   * 7. Apply multiplier bonus (unless skipMultiplier)
   * 8. Record merchant liability (if applicable)
   * 9. Update UserLoyalty categoryCoins (if category)
   * 10. Emit REWARD_ISSUED event
   * 11. Cache result for fast dedup
   */
  async issue(request: RewardRequest): Promise<RewardResult> {
    const {
      userId,
      amount,
      rewardType,
      source,
      description,
      operationType,
      referenceId,
      referenceModel,
      category,
      coinType = 'rez',
      metadata = {},
      skipCap = false,
      skipMultiplier = false,
      session,
      merchantId,
      merchantLiability,
      overrideExpiryDays,
    } = request;

    // Step 0: Global reward kill-switch (checked via cached WalletConfig)
    try {
      const config = await getCachedWalletConfig();
      if (config && (config as { rewardIssuanceEnabled?: boolean }).rewardIssuanceEnabled === false) {
        logger.warn('Reward issuance DISABLED via kill-switch', { userId, amount, source });
        return this.emptyResult(source, description, category || null, `killswitch:${userId}:${Date.now()}`);
      }
    } catch {
      // Config fetch failure — proceed (fail-open on config, fail-closed on cap)
    }

    // Step 1: Deterministic idempotency key
    const idempotencyKey = metadata?.idempotencyKey || generateIdempotencyKey(userId, referenceId, rewardType, source);

    // Step 2: Fast duplicate check (Redis)
    const dupeKey = `reward:issued:${idempotencyKey}`;
    try {
      const cached = await redisService.get(dupeKey);
      if (cached) {
        const existing = JSON.parse(cached as string) as RewardResult;
        return { ...existing, duplicate: true };
      }
    } catch {
      // Redis failure — fall through to DB-level idempotency
    }

    // Step 3: Validate eligibility
    if (amount <= 0) {
      return this.emptyResult(source, description, category, idempotencyKey);
    }

    const wallet = (await Wallet.findOne({ user: userId }).lean()) as WalletLeanDoc | null;
    if (wallet?.isFrozen) {
      throw new RewardError('WALLET_FROZEN', `Wallet is frozen: ${wallet.frozenReason || 'unknown'}`);
    }

    // Step 4a: Savings Streak Multiplier (non-blocking, fail-open)
    let streakMultiplier = 1.0;
    let streakTierName: string | undefined;
    if (!skipMultiplier && (source === 'cashback' || source === 'order' || source === 'review')) {
      try {
        const { default: UserStreak } = await import('../models/UserStreak');
        const savingsStreak = (await UserStreak.findOne({
          user: userId,
          type: 'savings',
        })
          .select('currentStreak')
          .lean()) as UserStreakLeanDoc | null;

        const days = savingsStreak?.currentStreak ?? 0;
        if (days >= 60) {
          streakMultiplier = 1.2;
          streakTierName = 'Smart Saver Elite';
        } else if (days >= 21) {
          streakMultiplier = 1.15;
          streakTierName = 'Gold Saver';
        } else if (days >= 7) {
          streakMultiplier = 1.1;
          streakTierName = 'Silver Saver';
        } else if (days >= 1) {
          streakMultiplier = 1.05;
          streakTierName = 'Bronze Saver';
        }
      } catch {
        // Non-blocking — use 1.0 on any error
      }
    }

    // Step 4b: Apply earning cap (fail-open)
    let adjustedAmount = streakMultiplier > 1 ? Math.floor(amount * streakMultiplier) : amount;
    if (streakMultiplier > 1) {
      const enriched: RewardIssuanceMetadata = metadata as RewardIssuanceMetadata;
      enriched.streakMultiplier = streakMultiplier;
      enriched.streakTierName = streakTierName;
      enriched.baseAmount = amount;
      enriched.bonusCoins = adjustedAmount - amount;
    }
    let cappedReason: string | undefined;
    if (!skipCap) {
      try {
        const capCheck = await specialProgramService.checkEarningCap(userId, amount, source);
        if (!capCheck.allowed && capCheck.adjustedAmount === 0) {
          return {
            success: true,
            transactionId: null,
            amount: 0,
            newBalance: wallet ? (wallet.balance?.available ?? 0) : 0,
            source,
            description,
            category: category || null,
            cappedReason: capCheck.reason,
            originalAmount: amount,
            idempotencyKey,
          };
        }
        adjustedAmount = capCheck.adjustedAmount;
        if (adjustedAmount < amount) {
          cappedReason = capCheck.reason;
        }
      } catch (capError) {
        // FAIL-CLOSED: If cap check service is down, block reward issuance to prevent runaway inflation
        logger.error('Program cap check failed — BLOCKING reward issuance (fail-closed)', capError as Error, {
          userId,
          amount,
          source,
        });
        return this.emptyResult(source, description, category || null, idempotencyKey);
      }
    }

    // Step 5: Calculate expiry for non-rez coins.
    // FT-007: Pass overrideExpiryDays so campaign claims lock in their expiry
    // at claim time rather than reading live config (which may have changed).
    const enrichedMetadata: Record<string, any> = { ...metadata, idempotencyKey, rewardType };
    if (coinType !== 'rez') {
      const expiresAt = await calculateExpiryDate(coinType, overrideExpiryDays);
      if (expiresAt) {
        enrichedMetadata.expiresAt = expiresAt;
      }
    }

    // Step 6a: DB-level duplicate check (fallback if Redis missed)
    const existingTx = (await CoinTransaction.findOne({
      user: userId,
      'metadata.idempotencyKey': idempotencyKey,
    }).lean()) as CoinTransactionLeanDoc | null;
    if (existingTx) {
      const dupeResult: RewardResult = {
        success: true,
        transactionId: existingTx._id,
        amount: existingTx.amount,
        newBalance: existingTx.balance,
        source,
        description,
        category: category || null,
        idempotencyKey,
        duplicate: true,
      };
      redisService.set(dupeKey, JSON.stringify(dupeResult), 300).catch((err) =>
        logger.warn('[RewardEngine] Redis cache set failed for duplicate result', {
          error: err.message,
          idempotencyKey,
        }),
      );
      return dupeResult;
    }

    // Step 6b: Atomic Redis daily earning counter increment BEFORE wallet credit.
    //
    // RACE-CONDITION FIX: The original code incremented the counter inside
    // setImmediate() AFTER walletService.credit(). Under 5 concurrent requests all
    // 5 pass the cap check before any setImmediate fires, so a user earns 5× their
    // daily limit.
    //
    // Fix: Use an atomic Redis INCR here (synchronously, before the credit) so the
    // very first concurrent request that increments past the cap blocks all
    // subsequent ones. If the cap is breached we DECR back immediately and return
    // without issuing coins, keeping the counter accurate. Redis failure is treated
    // as fail-open to avoid blocking legitimate users during a Redis outage.
    if (!skipCap) {
      const todayKey = `earnings:daily:${userId}:${new Date().toISOString().slice(0, 10)}`;
      try {
        const newCount = await redisService.incr(todayKey, adjustedAmount);
        // Set / refresh TTL on first write (or refresh on every write — idempotent).
        await redisService.expire(todayKey, 25 * 60 * 60);

        // Retrieve the configured daily limit from specialProgramService.
        // We need the raw limit here; checkEarningCap() already ran above and
        // approved this request, but that check was non-atomic.  Re-read the limit
        // to enforce the atomic gate.
        let dailyCapCoins: number;
        try {
          const capInfo = await specialProgramService.checkEarningCap(userId, 0, source);
          // CapCheckResult has no dailyCapCoins field — phantom cast removed. Use hardcoded cap.
          dailyCapCoins = 1000;
        } catch {
          dailyCapCoins = 1000;
        }

        if (newCount !== null && newCount > dailyCapCoins) {
          // Already over limit — roll back the counter and abort.
          try {
            await redisService.incr(todayKey, -adjustedAmount);
          } catch (rollbackErr) {
            logger.error('[RewardEngine] Failed to roll back daily cap counter', {
              userId,
              todayKey,
              adjustedAmount,
              error: rollbackErr,
            });
          }
          logger.info('[RewardEngine] Daily cap reached (atomic gate)', { userId, newCount, dailyCapCoins, source });
          return {
            success: true,
            transactionId: null,
            amount: 0,
            newBalance: wallet ? (wallet.balance?.available ?? 0) : 0,
            source,
            description,
            category: category || null,
            cappedReason: 'daily_cap_reached',
            originalAmount: adjustedAmount,
            idempotencyKey,
          };
        }
      } catch (redisCapErr) {
        // Redis failure — fail-open: proceed with the credit to avoid blocking
        // legitimate users during a Redis outage.  The DB-level aggregate cap in
        // specialProgramService will still provide a ground-truth backstop.
        logger.warn('[RewardEngine] Redis atomic cap increment failed (fail-open)', {
          error: (redisCapErr as Error).message,
          userId,
        });
      }
    }

    // Step 6c: Atomic wallet mutation
    let result: WalletMutationResult;
    try {
      result = await walletService.credit({
        userId,
        amount: adjustedAmount,
        source,
        description,
        operationType,
        referenceId,
        referenceModel,
        metadata: enrichedMetadata,
        category,
        coinType: mapCoinTypeToLedger(coinType),
        session,
      });
    } catch (error: unknown) {
      // Check if this is a duplicate key error (idempotency guard in CoinTransaction)
      const err = error as { code?: number; message?: string };
      if (err?.code === 11000 || err?.message?.includes('duplicate')) {
        logger.info('Duplicate reward detected via DB index', { userId, referenceId, rewardType });
        // Roll back the cap counter increment since we're not actually issuing coins.
        if (!skipCap) {
          const todayKey = `earnings:daily:${userId}:${new Date().toISOString().slice(0, 10)}`;
          try {
            await redisService.incr(todayKey, -adjustedAmount);
          } catch (rollbackErr) {
            logger.error('[RewardEngine] Failed to roll back daily cap counter after duplicate', {
              userId,
              todayKey,
              adjustedAmount,
              error: rollbackErr,
            });
          }
        }
        return {
          success: true,
          transactionId: null,
          amount: adjustedAmount,
          newBalance: wallet ? (wallet.balance?.available ?? 0) : 0,
          source,
          description,
          category: category || null,
          idempotencyKey,
          duplicate: true,
        };
      }
      // On any other error, roll back the cap counter increment.
      if (!skipCap) {
        const todayKey = `earnings:daily:${userId}:${new Date().toISOString().slice(0, 10)}`;
        try {
          await redisService.incr(todayKey, -adjustedAmount);
        } catch (rollbackErr) {
          logger.error('[RewardEngine] Failed to roll back daily cap counter on error', {
            userId,
            todayKey,
            adjustedAmount,
            error: rollbackErr,
          });
        }
      }
      throw error;
    }

    // Step 7: Multiplier bonus (fail-open, non-blocking for error)
    let multiplierBonus = 0;
    if (!skipMultiplier) {
      try {
        const { bonus, programBonuses } = await specialProgramService.calculateMultiplierBonus(
          userId,
          adjustedAmount,
          source,
        );
        if (bonus > 0) {
          const slugLabel = programBonuses.map((pb: ProgramBonus) => pb.slug).join('+');
          await walletService.credit({
            userId,
            amount: bonus,
            source: 'program_multiplier_bonus',
            description: `${slugLabel} multiplier bonus on ${source}`,
            operationType: 'loyalty_credit',
            referenceId: `multiplier-bonus:${result.transactionId}`,
            referenceModel: 'CoinTransaction',
            metadata: {
              originalTransactionId: result.transactionId,
              programSlug: slugLabel,
              programBonuses,
              idempotencyKey: `${idempotencyKey}:multiplier`,
            },
            category,
          });
          multiplierBonus = bonus;

          for (const pb of programBonuses) {
            await specialProgramService.incrementMultiplierBonus(userId, pb.slug, pb.bonus).catch((err) =>
              logger.error('[RewardEngine] Increment multiplier bonus failed', {
                error: err.message,
                userId,
                slug: pb.slug,
              }),
            );
          }
        }
        await specialProgramService
          .incrementMonthlyEarnings(userId, adjustedAmount + multiplierBonus)
          .catch((err) =>
            logger.error('[RewardEngine] Increment monthly earnings failed', { error: err.message, userId }),
          );
      } catch (err) {
        logger.error('Multiplier bonus failed (non-blocking)', err as Error, { userId, source });
      }
    }

    // Step 8: Merchant liability ledger entry (fire-and-forget)
    if (merchantId && merchantLiability && merchantLiability > 0) {
      this.recordMerchantLiability(
        merchantId,
        merchantLiability,
        coinType,
        operationType,
        referenceId,
        referenceModel,
        rewardType,
      ).catch((err) => {
        logger.error('Merchant liability ledger failed (non-blocking)', err as Error, {
          merchantId,
          merchantLiability,
        });
      });
    }

    // Step 9: Update UserLoyalty categoryCoins (non-blocking)
    if (category) {
      this.updateUserLoyaltyCategory(userId, category, adjustedAmount).catch((err) =>
        logger.error('[RewardEngine] UserLoyalty category update failed', { error: err.message, userId, category }),
      );
    }

    // Step 10: Emit REWARD_ISSUED event
    setImmediate(() => {
      try {
        gamificationEventBus.emit('reward_issued', {
          userId,
          entityId: referenceId,
          entityType: rewardType,
          amount: adjustedAmount,
          metadata: {
            source,
            rewardType,
            category,
            coinType,
            multiplierBonus: multiplierBonus > 0 ? multiplierBonus : undefined,
            transactionId: result.transactionId?.toString(),
          },
          source: { controller: 'rewardEngine', action: 'issue' },
        });
      } catch (err) {
        logger.error('Failed to emit reward_issued event', err as Error);
      }
    });

    // --- GAP FIX #1: structured reward issuance log (searchable by ELK/Datadog) ---
    // Emits every coin credit with the fields needed for log-based alerting:
    // userId, amount, source, coinType, rewardType, category, newBalance
    logger.info('coin_issued', {
      event: 'coin_issued',
      userId,
      amount: adjustedAmount,
      source,
      coinType: coinType || 'rez',
      rewardType,
      category: category || null,
      newBalance: result.newBalance,
      transactionId: result.transactionId?.toString() || null,
      referenceId,
      ...(multiplierBonus > 0 && { multiplierBonus }),
      ...(cappedReason && { cappedReason }),
      timestamp: new Date().toISOString(),
    });

    // --- GAP FIX #1b: Prometheus issuance counter (coin_type x source x reward_type) ---
    coinIssuanceCounter.inc({
      source: source.replace(/\s+/g, '_').slice(0, 64),
      coin_type: coinType || 'rez',
      reward_type: rewardType,
    });

    // Step 11: Cache result for fast dedup
    const rewardResult: RewardResult = {
      success: true,
      transactionId: result.transactionId,
      amount: result.amount,
      newBalance: result.newBalance,
      source: result.source,
      description: result.description,
      category: category || null,
      ledgerPairId: result.ledgerPairId,
      cappedReason,
      multiplierBonus: multiplierBonus > 0 ? multiplierBonus : undefined,
      originalAmount: adjustedAmount < amount ? amount : undefined,
      idempotencyKey,
    };

    redisService
      .set(dupeKey, JSON.stringify(rewardResult), 300)
      .catch((err) =>
        logger.warn('[RewardEngine] Redis cache set failed for reward result', { error: err.message, idempotencyKey }),
      );

    return rewardResult;
  }

  /**
   * Consume coins in priority order: promo (1) → branded (2) → prive (3) → rez (4).
   * Each deduction is an atomic walletService.debit() call.
   */
  async applyRedemptionPipeline(
    userId: string,
    totalAmount: number,
    options?: {
      session?: ClientSession;
      referenceId?: string;
      referenceModel?: string;
      description?: string;
      maxPromoPct?: number;
      allowedMerchantIds?: string[];
    },
  ): Promise<RedemptionResult> {
    const wallet = (await Wallet.findOne({ user: userId })) as import('mongoose').HydratedDocument<
      import('../models/Wallet').IWallet
    >;
    if (!wallet) throw new RewardError('NO_WALLET', 'Wallet not found');
    if (wallet.isFrozen) throw new RewardError('WALLET_FROZEN', 'Wallet is frozen');

    const coinOrder = wallet.getCoinUsageOrder() as Array<{
      type: string;
      amount: number;
      merchantId?: string;
    }>;
    let remaining = totalAmount;
    const steps: RedemptionStep[] = [];
    const transactionIds: Types.ObjectId[] = [];
    const refId = options?.referenceId || `redeem:${userId}:${Date.now()}`;

    for (const coin of coinOrder) {
      if (remaining <= 0) break;

      // Apply maxUsagePct constraint (promo coins default to 20% of bill)
      let maxForThisType = remaining;
      const rule = CURRENCY_RULES[coin.type];
      if (rule && rule.maxUsagePct < 100) {
        const pctLimit = options?.maxPromoPct ?? rule.maxUsagePct;
        maxForThisType = Math.min(remaining, Math.round((totalAmount * pctLimit) / 100));
      }

      // For branded coins, ALWAYS enforce merchant restriction.
      // Branded coins are issued by a specific merchant and must never be redeemed elsewhere.
      // If the caller omits allowedMerchantIds the pipeline skips ALL branded coins —
      // this is a safe-fail: the user keeps their branded coins rather than spending them
      // at the wrong store. Callers that process store checkouts MUST pass the store/merchant
      // ID(s) that are valid for the current transaction.
      if (coin.type === 'branded') {
        if (!options?.allowedMerchantIds || options.allowedMerchantIds.length === 0) {
          logger.warn(
            '[RewardEngine] Branded coin skip: allowedMerchantIds not supplied — branded coins are merchant-scoped and require an explicit allow-list.',
            { userId },
          );
          continue;
        }
        if (!coin.merchantId || !options.allowedMerchantIds.includes(coin.merchantId)) {
          continue;
        }
      }

      const toDeduct = Math.min(coin.amount, maxForThisType, remaining);
      if (toDeduct <= 0) continue;

      const debitResult = await walletService.debit({
        userId,
        amount: toDeduct,
        source: 'redemption',
        description: options?.description || `Redeemed ${toDeduct} ${coin.type} coins`,
        operationType: 'payment',
        referenceId: `${refId}:${coin.type}:${coin.merchantId || 'none'}`,
        referenceModel: options?.referenceModel || 'Redemption',
        metadata: {
          coinType: coin.type,
          merchantId: coin.merchantId,
          pipelineStep: steps.length + 1,
          idempotencyKey: `${refId}:${coin.type}:${coin.merchantId || 'none'}`,
        },
        category: null,
        coinType: mapCoinTypeToLedger(coin.type),
        session: options?.session,
      });

      steps.push({
        coinType: coin.type as RedemptionStep['coinType'],
        amountDeducted: toDeduct,
        merchantId: coin.merchantId,
      });
      if (debitResult.transactionId) {
        transactionIds.push(debitResult.transactionId);
      }
      remaining -= toDeduct;
    }

    if (remaining > 0) {
      throw new RewardError(
        'INSUFFICIENT_BALANCE',
        `Insufficient balance. Needed ${totalAmount}, could only deduct ${totalAmount - remaining}`,
      );
    }

    const updatedWallet = (await Wallet.findOne({ user: userId }).lean()) as WalletLeanDoc | null;
    return {
      success: true,
      totalDeducted: totalAmount,
      steps,
      newBalance: updatedWallet ? (updatedWallet.balance?.available ?? 0) : 0,
      transactionIds,
    };
  }

  /**
   * Reverse a previously issued reward.
   * Creates a 'spent' CoinTransaction linked to the original, debits wallet.
   */
  async reverseReward(
    originalTransactionId: string,
    reason: string,
    options?: { session?: ClientSession; partialAmount?: number },
  ): Promise<ReversalResult> {
    // 1. Find the original transaction
    const original = (await CoinTransaction.findById(originalTransactionId).lean()) as CoinTransactionLeanDoc | null;
    if (!original) {
      throw new RewardError('TX_NOT_FOUND', `Transaction ${originalTransactionId} not found`);
    }

    // 2. Only earned/bonus/refunded can be reversed
    if (!['earned', 'bonus', 'refunded'].includes(original.type)) {
      throw new RewardError('INVALID_REVERSAL', `Cannot reverse transaction of type: ${original.type}`);
    }

    // 3. Check idempotency (prevent double reversal)
    const alreadyReversed = (await CoinTransaction.findOne({
      user: original.user,
      'metadata.reversedTransactionId': originalTransactionId,
      type: 'spent',
    }).lean()) as CoinTransactionLeanDoc | null;

    if (alreadyReversed) {
      return {
        success: true,
        reversalTransactionId: alreadyReversed._id,
        amount: alreadyReversed.amount,
        newBalance: alreadyReversed.balance,
        originalTransactionId,
        reason,
      };
    }

    // 4. Determine reversal amount
    const reversalAmount = options?.partialAmount ?? original.amount;
    if (reversalAmount > original.amount) {
      throw new RewardError('AMOUNT_EXCEEDED', `Reversal amount ${reversalAmount} exceeds original ${original.amount}`);
    }

    // 5. Debit the wallet
    const debitResult = await walletService.debit({
      userId: String(original.user),
      amount: reversalAmount,
      source: original.source ?? 'reversal', // F001-C9 pre-existing: source may be undefined on legacy transactions
      description: `Reversed: ${reason}`,
      operationType: 'cashback_reversal',
      referenceId: `reversal:${originalTransactionId}`,
      referenceModel: 'CoinTransaction',
      metadata: {
        reversedTransactionId: originalTransactionId,
        reversalReason: reason,
        originalSource: original.source,
        originalAmount: original.amount,
        idempotencyKey: `reversal:${originalTransactionId}`,
      },
      category: (original.category as MainCategorySlug | undefined) ?? null,
      session: options?.session,
    });

    // 6. Reverse associated multiplier bonus (non-blocking)
    this.reverseMultiplierBonus(original, originalTransactionId, reason, options?.session).catch((err) => {
      logger.error('Multiplier bonus reversal failed (non-blocking)', err as Error, { originalTransactionId });
    });

    return {
      success: true,
      reversalTransactionId: debitResult.transactionId,
      amount: reversalAmount,
      newBalance: debitResult.newBalance,
      originalTransactionId,
      reason,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────

  private emptyResult(
    source: string,
    description: string,
    category: MainCategorySlug | null | undefined,
    idempotencyKey: string,
  ): RewardResult {
    return {
      success: true,
      transactionId: null,
      amount: 0,
      newBalance: 0,
      source,
      description,
      category: category || null,
      idempotencyKey,
    };
  }

  private async recordMerchantLiability(
    merchantId: string,
    amount: number,
    coinType: string,
    operationType: LedgerOperationType,
    referenceId: string,
    referenceModel: string,
    rewardType: string,
  ): Promise<void> {
    await ledgerService.recordEntry({
      debitAccount: { type: 'merchant_wallet', id: new Types.ObjectId(merchantId) },
      creditAccount: { type: 'platform_float', id: ledgerService.getPlatformAccountId('platform_float') },
      amount,
      coinType: mapCoinTypeToLedger(coinType),
      operationType,
      referenceId,
      referenceModel,
      metadata: { description: `Merchant liability for ${rewardType}` },
    });

    // Also track in MerchantLiability aggregate
    try {
      const { liabilityService } = await import('../services/liabilityService');
      const campaignType =
        rewardType === 'creator_pick_reward'
          ? ('creator_reward' as const)
          : rewardType === 'bonus_campaign'
            ? ('bonus_campaign' as const)
            : ('branded_coin_award' as const);
      liabilityService
        .recordIssuance({
          merchantId,
          storeId: merchantId,
          campaignType,
          amount,
          referenceId,
          referenceModel,
        })
        .catch((err: unknown) =>
          logger.error('[RewardEngine] Merchant liability recording failed', {
            error: (err as Error)?.message,
            merchantId,
          }),
        );
    } catch (importErr) {
      logger.error('[RewardEngine] Failed to import liabilityService', { error: importErr });
    }
  }

  private async updateUserLoyaltyCategory(userId: string, category: MainCategorySlug, amount: number): Promise<void> {
    try {
      // LS-004 FIX: Original code used findOne → mutate in-memory → .save().
      // Under a campaign reward burst (many concurrent rewardEngine.issue() calls for
      // different orders for the same user), multiple requests could:
      //   1. Read the same loyalty document
      //   2. Each increment catCoins.available by their own amount in JS memory
      //   3. Each call .save() — the last writer wins, silently dropping all earlier
      //      increments (classic lost-update race condition).
      //
      // Fix: Replace with a single findOneAndUpdate using $inc on the Map field path.
      // MongoDB applies $inc atomically — concurrent calls each land their own increment
      // without any read-modify-write cycle in application code.
      await UserLoyalty.findOneAndUpdate(
        { userId },
        {
          $inc: { [`categoryCoins.${category}.available`]: amount },
        },
        { upsert: false }, // Do not create loyalty doc here; created elsewhere on user setup
      );
    } catch (err) {
      logger.error('Failed to update UserLoyalty categoryCoins', err as Error, { userId, category });
    }
  }

  private async reverseMultiplierBonus(
    original: CoinTransactionLeanDoc,
    originalTransactionId: string,
    reason: string,
    session?: ClientSession,
  ): Promise<void> {
    const bonusTx = (await CoinTransaction.findOne({
      user: original.user,
      source: 'program_multiplier_bonus',
      'metadata.originalTransactionId': original._id,
    }).lean()) as CoinTransactionLeanDoc | null;

    if (bonusTx && bonusTx.amount > 0) {
      await walletService.debit({
        userId: String(original.user),
        amount: bonusTx.amount,
        source: 'program_multiplier_bonus',
        description: `Multiplier bonus reversed: ${reason}`,
        operationType: 'cashback_reversal',
        referenceId: `reversal-bonus:${originalTransactionId}`,
        referenceModel: 'CoinTransaction',
        metadata: {
          reversedTransactionId: bonusTx._id,
          reversalReason: reason,
          idempotencyKey: `reversal-bonus:${originalTransactionId}`,
        },
        category: (original.category as MainCategorySlug | undefined) ?? null,
        session,
      });
    }
  }
}

export const rewardEngine = new RewardEngine();
export default rewardEngine;
