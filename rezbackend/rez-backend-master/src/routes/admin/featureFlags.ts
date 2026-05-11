// @ts-nocheck
import { Router, Request, Response } from 'express';
import FeatureFlag from '../../models/FeatureFlag';
import { requireAdmin } from '../../middleware/auth';
import { invalidateFlagCache } from '../../utils/featureFlags';
import { invalidateFeatureCache } from '../../services/walletFeatureService';
import redisService from '../../services/redisService';
import { isSocketInitialized, getIO } from '../../config/socket';
import { sendSuccess, sendError, sendBadRequest } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';
import { AdminAuditLog } from '../../models/AdminAuditLog';
import { logger } from '../../config/logger';

const router = Router();

/**
 * GET /api/admin/feature-flags
 * Fetch all feature flags
 */
router.get(
  '/feature-flags',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const flags = await FeatureFlag.find().sort({ key: 1 }).lean();
      sendSuccess(res, { flags }, 'Feature flags retrieved');
    } catch (err) {
      sendError(res, 'Failed to fetch feature flags', 500);
    }
  }),
);

/**
 * PATCH /api/admin/feature-flags/:key
 * Update a feature flag
 */
router.patch(
  '/feature-flags/:key',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { enabled, rolloutPercentage, description } = req.body;
      const adminId = (req as any).user?.id || (req as any).userId;

      if (
        rolloutPercentage !== undefined &&
        (typeof rolloutPercentage !== 'number' || rolloutPercentage < 0 || rolloutPercentage > 100)
      ) {
        return sendBadRequest(res, 'rolloutPercentage must be a number between 0 and 100');
      }

      // FT-003 FIX: Capture before-state for audit log.
      //
      // ROOT CAUSE: Feature flag mutations had NO audit trail. WalletConfig
      // correctly logs before/after diffs to AdminAuditLog; feature flags did not.
      // This meant that toggling a kill_switch.payments flag left no record of who
      // disabled payments, when, or what the previous value was — a compliance gap.
      //
      // FIX: Read the current flag state before mutation, then write an
      // AdminAuditLog entry (fire-and-forget, non-blocking) with the full diff.
      const existingFlag = await FeatureFlag.findOne({ key: req.params.key }).lean();
      if (!existingFlag) return sendBadRequest(res, 'Feature flag not found');

      const beforeState = {
        enabled: existingFlag.enabled,
        rolloutPercentage: existingFlag.rolloutPercentage,
        description: existingFlag.description,
      };

      const flag = await FeatureFlag.findOneAndUpdate(
        { key: req.params.key },
        {
          ...(enabled !== undefined && { enabled }),
          ...(rolloutPercentage !== undefined && { rolloutPercentage }),
          ...(description && { description }),
          updatedBy: adminId,
        },
        { new: true },
      );

      if (!flag) return sendBadRequest(res, 'Feature flag not found');

      // FT-001 FIX: Invalidate Redis-backed cross-pod cache (not just the local Map).
      await invalidateFlagCache(req.params.key);
      // Also flush walletFeatureService in-process cache (separate Map from utils/featureFlags).
      invalidateFeatureCache(req.params.key);
      // Also invalidate the /app-status feature flags bundle so clients get fresh flags within 60s.
      redisService.del('app:feature_flags').catch(() => {});

      // Emit real-time event so merchant/consumer apps get instant flag propagation
      if (isSocketInitialized()) {
        getIO().emit('feature-flag-changed', {
          flagKey: flag.key,
          enabled: flag.enabled,
          rolloutPercentage: flag.rolloutPercentage,
          changedAt: new Date().toISOString(),
        });
      }

      // FT-003 FIX: Persist audit trail with before/after diff.
      setImmediate(() => {
        const afterState = {
          enabled: flag.enabled,
          rolloutPercentage: flag.rolloutPercentage,
          description: flag.description,
        };
        const changedFields = (Object.keys(afterState) as Array<keyof typeof afterState>).filter(
          (k) => afterState[k] !== beforeState[k],
        );

        AdminAuditLog.create({
          adminId,
          action: 'FEATURE_FLAG_UPDATED',
          method: 'PATCH',
          path: req.originalUrl.split('?')[0],
          targetId: req.params.key,
          targetType: 'feature-flag',
          ip: req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown',
          requestBody: { key: req.params.key, changedFields, before: beforeState, after: afterState },
          responseSuccess: true,
          responseStatus: 200,
          timestamp: new Date(),
          changes: { beforeValues: beforeState, afterValues: afterState, changedFields },
        }).catch((err: Error) => {
          logger.error('[FeatureFlags] Failed to write audit log: ' + err.message);
        });
      });

      sendSuccess(res, { flag }, 'Feature flag updated');
    } catch (err) {
      sendError(res, 'Failed to update feature flag', 500);
    }
  }),
);

/**
 * POST /api/admin/feature-flags
 * Create a new feature flag
 */
router.post(
  '/feature-flags',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { key, enabled, description, rolloutPercentage, environments } = req.body;

      if (!key || !description) {
        return sendBadRequest(res, 'Key and description are required');
      }

      const rp = rolloutPercentage !== undefined ? rolloutPercentage : 100;
      if (typeof rp !== 'number' || rp < 0 || rp > 100) {
        return sendBadRequest(res, 'rolloutPercentage must be a number between 0 and 100');
      }

      const existing = await FeatureFlag.findOne({ key });
      if (existing) {
        return sendBadRequest(res, 'Feature flag with this key already exists');
      }

      const flag = new FeatureFlag({
        key,
        enabled: enabled || false,
        description,
        rolloutPercentage: rp,
        environments: environments || ['development', 'staging'],
        updatedBy: (req as any).user?.id || (req as any).userId,
      });

      await flag.save();
      redisService.del('app:feature_flags').catch(() => {});
      sendSuccess(res, { flag }, 'Feature flag created', 201);
    } catch (err) {
      sendError(res, 'Failed to create feature flag', 500);
    }
  }),
);

export default router;
