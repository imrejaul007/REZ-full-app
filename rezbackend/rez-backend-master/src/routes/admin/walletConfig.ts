// @ts-nocheck
import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin, requireSuperAdmin } from '../../middleware/auth';
import { WalletConfig } from '../../models/WalletConfig';
import { invalidateWalletConfigCache } from '../../services/walletCacheService';
import { asyncHandler } from '../../utils/asyncHandler';
import { logger } from '../../config/logger';
import { AdminAuditLog } from '../../models/AdminAuditLog';

const router = Router();

router.use(requireAuth);

/**
 * @route   GET /api/admin/wallet-config
 * @desc    Get wallet configuration singleton
 * @access  Admin (any level)
 */
router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const config = await WalletConfig.getOrCreate();
    res.json({ success: true, data: config });
  }),
);

/**
 * @route   PUT /api/admin/wallet-config
 * @desc    Update wallet configuration
 * @access  SuperAdmin only — critical platform config
 */
router.put(
  '/',
  requireSuperAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const config = await WalletConfig.getOrCreate();
    // FT-006 FIX: Add 'rewardIssuanceEnabled' and 'priveInviteConfig' to the
    // allowed-fields list.
    //
    // ROOT CAUSE: rewardIssuanceEnabled is the global kill-switch for the entire
    // reward engine (checked in rewardEngine.issue() before any coin is issued).
    // It is defined in the IWalletConfig interface and persisted in the DB, but
    // it was absent from allowedFields — so PUT /api/admin/wallet-config could
    // never set it. The only way to disable reward issuance was a direct MongoDB
    // update, bypassing all auth, validation, and audit logging. Similarly,
    // priveInviteConfig is a valid top-level config key that was excluded.
    //
    // FIX: Add both fields. rewardIssuanceEnabled is deliberately kept as a
    // Boolean-only field; the spread merge below handles it correctly. No extra
    // validation is needed because WalletConfig schema already types it Boolean.
    //
    // NIDHI GOVERNANCE: commissionRate is now admin-editable via this endpoint.
    // Default is 0.05 (5%), can be changed 0-100% without code deployment.
    // All changes are audit-logged with before/after values.
    const allowedFields = [
      'rewardIssuanceEnabled',
      'transferLimits',
      'giftLimits',
      'rechargeConfig',
      'expiryConfig',
      'commissionRate',
      'coinConversion',
      'fraudThresholds',
      'redemptionConfig',
      'habitLoopConfig',
      'coinExpiryConfig',
      'coinRules',
      'priveInviteConfig',
    ];

    // FT-D001 FIX: Validate numeric rate fields before persisting.
    //
    // ROOT CAUSE: The PUT handler accepted any numeric value for rate-bearing
    // fields without range checks. An admin could set:
    //   - commissionRate: -0.5  → negative platform commission (revenue loss)
    //   - commissionRate: 5     → 500% commission (payout overflow)
    //   - rechargeConfig.tiers[*].cashbackPercentage: -10 (negative cashback)
    //   - coinExpiryConfig.promo.expiryDays: -1 (instant expiry of all issued coins)
    //
    // The Mongoose schema has `min`/`max` on individual tier fields but the
    // spread-merge pattern below bypasses Mongoose validators for nested arrays
    // because markModified() triggers dirty-tracking but not subdoc validation
    // when the whole subdocument is replaced via object spread.
    //
    // FIX: Explicit pre-save guard for each rate-bearing field.
    if (req.body.commissionRate !== undefined) {
      const r = req.body.commissionRate;
      if (typeof r !== 'number' || r < 0 || r > 1) {
        return res.status(400).json({
          success: false,
          message: 'commissionRate must be a number between 0 and 1 (e.g. 0.05 for 5%)',
          received: r,
        });
      }
    }

    if (req.body.rechargeConfig?.tiers !== undefined) {
      const tiers = req.body.rechargeConfig.tiers;
      if (!Array.isArray(tiers)) {
        return res.status(400).json({ success: false, message: 'rechargeConfig.tiers must be an array' });
      }
      for (const tier of tiers) {
        if (
          typeof tier.cashbackPercentage !== 'number' ||
          tier.cashbackPercentage < 0 ||
          tier.cashbackPercentage > 100
        ) {
          return res.status(400).json({
            success: false,
            message: `rechargeConfig.tiers cashbackPercentage must be between 0 and 100; received ${tier.cashbackPercentage}`,
            safeCap: 100,
          });
        }
        if (typeof tier.minAmount !== 'number' || tier.minAmount < 0) {
          return res.status(400).json({
            success: false,
            message: `rechargeConfig.tiers minAmount must be >= 0; received ${tier.minAmount}`,
          });
        }
      }
    }

    if (req.body.coinExpiryConfig !== undefined) {
      const cfg = req.body.coinExpiryConfig;
      const coinTypes = ['rez', 'prive', 'promo', 'branded'];
      for (const ct of coinTypes) {
        if (cfg[ct] !== undefined) {
          const { expiryDays, maxUsagePct } = cfg[ct];
          if (expiryDays !== undefined && (typeof expiryDays !== 'number' || expiryDays < 0)) {
            return res.status(400).json({
              success: false,
              message: `coinExpiryConfig.${ct}.expiryDays must be >= 0 (0 = never expires); received ${expiryDays}`,
            });
          }
          if (maxUsagePct !== undefined && (typeof maxUsagePct !== 'number' || maxUsagePct < 0 || maxUsagePct > 100)) {
            return res.status(400).json({
              success: false,
              message: `coinExpiryConfig.${ct}.maxUsagePct must be 0–100; received ${maxUsagePct}`,
            });
          }
        }
      }
    }

    // Capture before-state for each field being changed so the diff is auditable
    const changesBefore: Record<string, any> = {};
    const changesAfterRequest: Record<string, any> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // Deep-clone the before value (plain object)
        const rawBefore = (config as any)[field];
        changesBefore[field] = rawBefore?.toObject
          ? rawBefore.toObject()
          : JSON.parse(JSON.stringify(rawBefore ?? null));
        changesAfterRequest[field] = req.body[field];

        // FT-D002 FIX: Primitive fields (boolean, number, string) must be
        // assigned directly — the spread merge { ...true, ...false } produces {}
        // which corrupts rewardIssuanceEnabled and commissionRate.
        const newVal = req.body[field];
        if (newVal === null || typeof newVal !== 'object') {
          (config as any)[field] = newVal;
        } else {
          (config as any)[field] = {
            ...((config as any)[field]?.toObject?.() || (config as any)[field]),
            ...newVal,
          };
        }
        config.markModified(field);
      }
    }

    await config.save();

    // Invalidate cached config so all services pick up new values immediately
    await invalidateWalletConfigCache().catch((err) =>
      logger.warn('[WalletConfig] Cache invalidation for wallet config failed', { error: err.message }),
    );

    // AUDIT: persist who changed what config fields, from which values, to which values
    const adminId = (req as any).userId;
    setImmediate(() => {
      AdminAuditLog.create({
        adminId,
        action: 'WALLET_CONFIG_UPDATED',
        method: req.method,
        path: req.originalUrl.split('?')[0],
        targetId: String((config as any)._id),
        targetType: 'wallet-config',
        ip: req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown',
        requestBody: {
          changedFields: Object.keys(changesAfterRequest),
          before: changesBefore,
          after: changesAfterRequest,
        },
        responseSuccess: true,
        responseStatus: 200,
        timestamp: new Date(),
      }).catch((err: Error) => {
        logger.error('[WalletConfig] Failed to write audit log: ' + err.message);
      });
    });

    res.json({ success: true, data: config, message: 'Wallet config updated' });
  }),
);

/**
 * @route   PATCH /api/admin/wallet-config
 * @desc    Partial update (kill switch toggle, etc.)
 * @access  SuperAdmin only
 */
router.patch(
  '/',
  requireSuperAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const config = await WalletConfig.getOrCreate();

    const allowedPatchFields = ['rewardIssuanceEnabled'];
    const changesBefore: Record<string, any> = {};
    const changesAfter: Record<string, any> = {};

    for (const field of allowedPatchFields) {
      if (req.body[field] !== undefined) {
        changesBefore[field] = (config as any)[field];
        (config as any)[field] = req.body[field];
        changesAfter[field] = req.body[field];
        config.markModified(field);
      }
    }

    if (Object.keys(changesAfter).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    await config.save();

    await invalidateWalletConfigCache().catch((err) =>
      logger.warn('[WalletConfig] Cache invalidation failed', { error: err.message }),
    );

    const adminId = (req as any).userId;
    setImmediate(() => {
      AdminAuditLog.create({
        adminId,
        action: 'WALLET_CONFIG_KILL_SWITCH',
        method: req.method,
        path: req.originalUrl.split('?')[0],
        targetId: String((config as any)._id),
        targetType: 'wallet-config',
        ip: req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown',
        requestBody: { before: changesBefore, after: changesAfter },
        responseSuccess: true,
        responseStatus: 200,
        timestamp: new Date(),
      }).catch((err: Error) => {
        logger.error('[WalletConfig] Failed to write audit log: ' + err.message);
      });
    });

    res.json({ success: true, data: config, message: 'Wallet config updated' });
  }),
);

export default router;
