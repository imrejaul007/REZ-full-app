import { Request, Response, NextFunction } from 'express';
import { Store } from '../models/Store';
import redisService from '../services/redisService';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('qr-abuse-protection');

// ── Config ───────────────────────────────────────────────
const QR_COOLDOWN_SECONDS = 180;           // 3 minutes between same QR scans
// MIGUEL: abuse prevention — QR reward cooldown (30-day per-user per-QR)
// Prevents: User scans same QR code repeatedly for rewards (once per 30 days max)
const QR_REWARD_COOLDOWN_SECONDS = 30 * 24 * 60 * 60;  // 30 days
const STORE_VELOCITY_WINDOW = 600;         // 10-minute window
const STORE_VELOCITY_MAX = 50;             // Max initiations per store per window
const DEFAULT_MAX_DISTANCE_KM = 5;         // Max km from store

// ── Haversine helper ─────────────────────────────────────

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ── Middleware ────────────────────────────────────────────

/**
 * Block the same user from scanning the same QR code within 3 minutes.
 * Prevents rapid repeated scans/payment initiations.
 * Fail-open: if Redis unavailable, allows the request.
 */
export function qrCooldown() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const qrCode = req.body?.qrCode || req.params?.qrCode || req.body?.storeId;

      // Skip if no user (public endpoint) or no identifiable QR/store
      if (!userId || !qrCode) return next();

      const key = `qr:cooldown:${userId}:${qrCode}`;
      const existing = await redisService.get(key);

      if (existing) {
        logger.warn('QR cooldown active', { userId, qrCode: String(qrCode).substring(0, 20) });
        return res.status(429).json({
          success: false,
          message: 'Please wait before scanning this QR code again',
        });
      }

      // Set cooldown
      await redisService.set(key, '1', QR_COOLDOWN_SECONDS);
      next();
    } catch {
      // Fail-open
      next();
    }
  };
}

/**
 * Validate that the user is within maxKm of the store.
 * Expects latitude/longitude in req.body alongside storeId.
 * Skips gracefully if location not provided or store has no coordinates.
 */
export function validateDistance(maxKm: number = DEFAULT_MAX_DISTANCE_KM) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { storeId, latitude, longitude } = req.body;

      // Skip if no location data provided (graceful degradation)
      if (!latitude || !longitude || !storeId) return next();

      const lat = Number(latitude);
      const lng = Number(longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return next();

      const store = await Store.findById(storeId)
        .select('location.coordinates')
        .lean();

      // Skip if store has no coordinates set
      const coords = (store as any)?.location?.coordinates;
      if (!coords || coords.length < 2) return next();

      const distance = haversineDistance(lat, lng, coords[1], coords[0]);

      if (distance > maxKm) {
        const userId = (req as any).user?.id || (req as any).userId;
        logger.warn('QR distance violation', {
          userId,
          storeId,
          distanceKm: Math.round(distance * 100) / 100,
          maxKm,
        });
        return res.status(403).json({
          success: false,
          message: 'You appear to be too far from this store',
        });
      }

      next();
    } catch {
      // Fail-open
      next();
    }
  };
}

/**
 * Detect unusual scan velocity for a single store.
 * If a store receives >50 payment initiations in 10 minutes,
 * block further attempts (potential fraud ring or bot attack).
 * Fail-open: if Redis unavailable, allows the request.
 */
export function merchantScanAnomaly() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { storeId } = req.body;
      if (!storeId) return next();

      const key = `qr:store_velocity:${storeId}`;
      const count = await redisService.atomicIncr(key, STORE_VELOCITY_WINDOW);

      if (count !== null && count > STORE_VELOCITY_MAX) {
        logger.warn('Merchant scan anomaly detected', {
          storeId,
          count,
          threshold: STORE_VELOCITY_MAX,
          windowMinutes: STORE_VELOCITY_WINDOW / 60,
        });
        return res.status(429).json({
          success: false,
          message: 'Unusual activity detected. Please try again later.',
        });
      }

      next();
    } catch {
      // Fail-open
      next();
    }
  };
}

/**
 * MIGUEL: abuse prevention — per-user per-QR-code 30-day reward cooldown
 * Prevents: Exploit where user scans same QR code multiple times for repeated rewards
 * Rule: Same QR code can reward the same user ONCE per 30 days maximum
 *
 * Implementation:
 * - Key: qr:reward_cooldown:{userId}:{qrCodeId}
 * - TTL: 30 days (2,592,000 seconds)
 * - Check before reward issuance, not just scan initiation
 *
 * Fail-open: if Redis unavailable, allows the request (logging error)
 */
export function qrRewardCooldown() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const qrCode = req.body?.qrCode || req.params?.qrCode || req.body?.storeId;

      // Skip if no user or QR (public endpoint or test)
      if (!userId || !qrCode) return next();

      // MIGUEL: 30-day per-user per-QR reward cooldown
      const rewardCooldownKey = `qr:reward_cooldown:${userId}:${qrCode}`;
      const recentReward = await redisService.get(rewardCooldownKey);

      if (recentReward) {
        logger.warn('[QRAbuseProtection] QR reward cooldown active (30-day)', {
          userId,
          qrCode: String(qrCode).substring(0, 20),
          reason: 'User already claimed reward for this QR within 30 days',
        });
        return res.status(429).json({
          success: false,
          message:
            'You have already claimed a reward for this QR code. Please try again in 30 days.',
        });
      }

      // Mark request as eligible for reward (actual marking happens after reward issuance)
      // Store in request context for downstream handler to mark as claimed
      (req as any)._qrRewardKey = rewardCooldownKey;

      next();
    } catch (err) {
      // Fail-open with logging
      logger.warn('[QRAbuseProtection] QR reward cooldown check failed (fail-open)', {
        error: err instanceof Error ? err.message : String(err),
      });
      next();
    }
  };
}

/**
 * MIGUEL: abuse prevention — mark QR reward as claimed (call after successful reward issuance)
 * Partners with qrRewardCooldown() middleware
 *
 * Usage: Call this in your reward issuance handler after coins are successfully added
 */
export async function markQrRewardClaimed(req: Request): Promise<void> {
  try {
    const rewardKey = (req as any)._qrRewardKey;
    if (!rewardKey) return;

    await redisService.set(rewardKey, '1', QR_REWARD_COOLDOWN_SECONDS);
    logger.debug('[QRAbuseProtection] QR reward cooldown set', {
      key: rewardKey,
      ttlDays: QR_REWARD_COOLDOWN_SECONDS / (24 * 60 * 60),
    });
  } catch (err) {
    logger.warn('[QRAbuseProtection] Failed to mark QR reward as claimed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
