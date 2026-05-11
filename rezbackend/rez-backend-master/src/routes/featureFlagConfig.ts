// @ts-nocheck
import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware/auth';
import { featureFlagService } from '../services/featureFlagService';
import redisService from '../services/redisService';
import { logger } from '../config/logger';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const CACHE_KEY_PREFIX = 'config:feature-flags';
const CACHE_TTL = 60; // 60 seconds

/**
 * Deterministically assigns a user to a cohort (0 to numCohorts-1) for a given flag.
 * Uses a simple djb2-style hash over userId+flagName — no external dependencies.
 * The same userId+flagName combination always returns the same cohort, making
 * assignment stable across requests and service restarts.
 *
 * @param userId     - The user's unique ID string
 * @param flagName   - The feature flag key
 * @param numCohorts - How many cohorts to split into (default 2: control vs treatment)
 * @returns          - Cohort index (0-based)
 */
function getUserCohort(userId: string, flagName: string, numCohorts: number = 2): number {
  let hash = 0;
  const str = userId + flagName;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // coerce to 32-bit integer
  }
  return Math.abs(hash) % numCohorts;
}

/**
 * Flags that support cohort-based A/B assignment.
 * cohortPercent: 0-100 — the percentage of users assigned to cohort 1 (treatment).
 * Flags not listed here behave as before (boolean on/off for everyone).
 *
 * These are the Sprint 6 cohort flags. Additional flags can be added here as needed.
 */
const COHORT_PERCENT_MAP: Record<string, number> = {
  personalized_feed: 50, // 50% of users get personalized feed
  new_rating_prompt: 100, // 100% → everyone is in treatment cohort
  punch_card_ui: 100, // 100% → everyone gets the new punch-card UI
};

/**
 * @route   GET /api/config/feature-flags
 * @desc    Get all feature flags for the current user context.
 *          Supports optional ?userId= query param for cohort-based A/B flags.
 *          Uses optional auth — works for both logged-in and anonymous users.
 *
 * Cohort flags response shape (per flag):
 *   { enabled: boolean, config: object, cohort?: 0 | 1 }
 *
 * The `cohort` field is only present for flags that have a cohortPercent defined.
 * Clients can use it to determine which variant to render without additional logic.
 *
 * @access  Public
 */
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    // Accept userId from authenticated session or explicit query param (unauthenticated preview)
    const userId: string | undefined =
      ((req as any).userId as string | undefined) ||
      (typeof req.query.userId === 'string' ? req.query.userId : undefined);

    const city = (req as any).user?.profile?.location?.city || (req.headers['x-rez-region'] as string | undefined);

    // Cache key includes user + city for scope-aware caching.
    // When a userId is present the response is user-specific (cohort assignment may differ),
    // so we skip caching for cohort-aware requests to avoid serving wrong variant.
    const hasCohortFlags = userId !== undefined;
    const cityKey = city ? city.toLowerCase() : 'none';
    const cacheKey = userId ? `${CACHE_KEY_PREFIX}:${userId}:${cityKey}` : `${CACHE_KEY_PREFIX}:anon:${cityKey}`;

    // Only use cache for anonymous / non-cohort requests
    if (!hasCohortFlags) {
      const cached = await redisService.get<any>(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached });
      }
    }

    const flags = await featureFlagService.getEnabledFlags({ userId, city });

    // Augment cohort-aware flags with per-user assignment
    const augmentedFlags: Record<
      string,
      {
        enabled: boolean;
        config: Record<string, any>;
        cohort?: 0 | 1;
      }
    > = {};

    for (const [key, flagValue] of Object.entries(flags)) {
      const cohortPercent = COHORT_PERCENT_MAP[key];

      if (cohortPercent !== undefined && userId) {
        // Cohort 0 = control, Cohort 1 = treatment
        // We use 100 cohorts so that cohortPercent maps directly to the split ratio.
        const cohort = getUserCohort(userId, key, 100) < cohortPercent ? 1 : 0;
        augmentedFlags[key] = {
          ...flagValue,
          enabled: flagValue.enabled && cohort === 1,
          cohort,
        };
      } else if (cohortPercent !== undefined && !userId) {
        // No userId — return default off for cohort flags so clients fetch again with userId
        augmentedFlags[key] = {
          ...flagValue,
          enabled: false,
          cohort: 0,
        };
      } else {
        augmentedFlags[key] = flagValue;
      }
    }

    const result = {
      flags: augmentedFlags,
      fetchedAt: new Date().toISOString(),
    };

    // Only cache anonymous (non-cohort) responses
    if (!hasCohortFlags) {
      await redisService
        .set(cacheKey, result, CACHE_TTL)
        .catch((err) => logger.warn('[FeatureFlag] Cache set failed', { error: err.message }));
    }

    res.json({ success: true, data: result });
  }),
);

export default router;
