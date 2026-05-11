/**
 * AnonymizationPipeline — strips merchant identity from analytics events
 * before those events are used in peer benchmarking.
 *
 * Rules:
 *  - merchantId is replaced with a deterministic opaque key so grouping
 *    still works but the raw ID is never exposed downstream.
 *  - Customer PII (names, emails, phones) is removed.
 *  - Amounts and rates are preserved — they are needed for statistics.
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  merchantId: string;
  eventType: string;
  amount?: number;
  quantity?: number;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  city?: string;
  cuisineType?: string;
  timestamp?: string | Date;
  [key: string]: unknown;
}

export interface AnonymizedEvent {
  anonymizedMerchantKey: string;
  eventType: string;
  amount?: number;
  quantity?: number;
  city?: string;
  cuisineType?: string;
  timestamp: string;
}

// ── Opaque key derivation ─────────────────────────────────────────────────────

// SECURITY FIX: Fail at startup instead of using insecure default salt
const ANON_SALT = process.env.ANONYMIZATION_SALT;
if (!ANON_SALT) {
  throw new Error('[AnonymizationPipeline] ANONYMIZATION_SALT environment variable is REQUIRED in production. Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}
const SALT = ANON_SALT;

/**
 * Derives a deterministic but opaque key for a merchantId.
 * HMAC-SHA256 ensures the same merchantId always maps to the same key
 * within a salt rotation period, enabling consistent grouping without
 * exposing the raw ID.
 */
function deriveMerchantKey(merchantId: string): string {
  return crypto
    .createHmac('sha256', SALT)
    .update(merchantId)
    .digest('hex')
    .slice(0, 16); // 16 hex chars = 64 bits — sufficient for grouping
}

// ── Peer group key ────────────────────────────────────────────────────────────

type SizeCategory = 'small' | 'medium' | 'large';

function sizeCategory(monthlyOrders: number): SizeCategory {
  if (monthlyOrders < 300) return 'small';
  if (monthlyOrders < 1500) return 'medium';
  return 'large';
}

/**
 * Returns the peer group key for a merchant: `city:cuisineType:sizeCategory`.
 * Looks up the last 30 days of order count from merchantanalytics to classify size.
 */
export async function buildPeerGroupKey(merchantId: string): Promise<string> {
  try {
    const col = mongoose.connection.collection('merchantanalytics');
    const dateStr = new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0];

    const pipeline = [
      { $match: { merchantId, date: { $gte: dateStr } } },
      {
        $group: {
          _id: null,
          city: { $last: '$city' },
          cuisineType: { $last: '$cuisineType' },
          totalOrders: { $sum: '$orderCount' },
        },
      },
    ];

    const [result] = await col.aggregate(pipeline).toArray() as any[];

    if (!result) {
      logger.warn('[AnonymizationPipeline] No aggregation data for merchant', { merchantId });
      return 'unknown:other:small';
    }

    const city = (result.city || 'unknown').toLowerCase().replace(/\s+/g, '-');
    const cuisine = (result.cuisineType || 'other').toLowerCase().replace(/\s+/g, '-');
    const size = sizeCategory(result.totalOrders || 0);

    return `${city}:${cuisine}:${size}`;
  } catch (err: any) {
    logger.error('[AnonymizationPipeline] buildPeerGroupKey failed', { merchantId, error: err.message });
    return 'unknown:other:small';
  }
}

// ── Event anonymization ───────────────────────────────────────────────────────

/**
 * Strips merchant identity and customer PII from an analytics event,
 * retaining only the fields needed for benchmark computation.
 */
export function anonymize(event: AnalyticsEvent): AnonymizedEvent {
  const {
    merchantId,
    eventType,
    amount,
    quantity,
    city,
    cuisineType,
    timestamp,
    // PII fields — intentionally destructured and discarded
    customerId: _cid,
    customerName: _cn,
    customerEmail: _ce,
    ...rest
  } = event;

  // Scrub any remaining string fields that look like email or phone
  const safeRest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (typeof v === 'string' && (v.includes('@') || /^\+?\d{7,}$/.test(v))) {
      continue; // drop PII-looking strings
    }
    if (typeof v === 'number' || typeof v === 'boolean') {
      safeRest[k] = v;
    }
  }

  return {
    anonymizedMerchantKey: deriveMerchantKey(merchantId || ''),
    eventType: eventType || 'unknown',
    ...(amount !== undefined && { amount }),
    ...(quantity !== undefined && { quantity }),
    ...(city !== undefined && { city }),
    ...(cuisineType !== undefined && { cuisineType }),
    timestamp: timestamp ? new Date(timestamp as string).toISOString() : new Date().toISOString(),
  };
}
