/**
 * ReZ Ads Service - Attribution Module
 *
 * Marketing attribution tracking for:
 * - QR scans
 * - Ad clicks
 * - Push notifications
 * - Deep links
 *
 * Supports multiple attribution models:
 * - First-touch
 * - Last-touch
 * - Linear
 * - Time-decay
 * - Position-based
 *
 * Usage:
 *
 * ```typescript
 * import { AttributionTracker, createAttributionRouter } from '@rez/ads-service';
 * import express from 'express';
 *
 * const tracker = new AttributionTracker();
 * const app = express();
 *
 * app.use('/api/attribution', createAttributionRouter(tracker));
 * ```
 */

export { AttributionTracker, attributionTracker } from './services/AttributionTracker';
export type { TrackingContext } from './services/AttributionTracker';

export {
  calculateAttributionScores,
  normalizeAttributionPercentages,
  calculateAttributedValue,
  getAttributionSummary,
  isWithinAttributionWindow,
  getDefaultAttributionModel,
} from './models/AttributionModels';

export {
  getAttributionConfig,
  validateAttributionConfig,
  AttributionConfig,
} from './config/attributionConfig';

export { createAttributionRouter } from './routes/attributionRoutes';
export type { AttributionRequest } from './routes/attributionRoutes';

// Re-export types from @rez/shared-types
export {
  AttributionModel,
  TouchpointType,
  AttributionStatus,
  ConversionType,
  DEFAULT_ATTRIBUTION_WINDOW_DAYS,
  POSITION_BASED_WEIGHTS,
  TIME_DECAY_PARAMS,
} from '@rez/shared-types';

export type {
  ITouchpoint,
  IAttributionSession,
  IConversion,
  IAttributedTouchpoint,
  IAttributionConfig,
} from '@rez/shared-types';
