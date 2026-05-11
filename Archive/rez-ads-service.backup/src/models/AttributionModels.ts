/**
 * Attribution Models - Core business logic for multi-touch attribution
 *
 * Implements first-touch, last-touch, linear, time-decay, and position-based
 * attribution models for marketing analytics.
 */

import {
  AttributionModel,
  TouchpointType,
  IAttributedTouchpoint,
  ITouchpoint,
  IAttributionSession,
  POSITION_BASED_WEIGHTS,
  TIME_DECAY_PARAMS,
} from '@rez/shared-types';

/**
 * Attribution weight result for a single touchpoint
 */
export interface AttributionWeight {
  touchpointId: string;
  score: number;
  percentage: number;
}

/**
 * Calculate attribution scores based on the selected model
 */
export function calculateAttributionScores(
  touchpoints: ITouchpoint[],
  model: AttributionModel,
  conversionTimestamp: Date
): IAttributedTouchpoint[] {
  if (touchpoints.length === 0) {
    return [];
  }

  // Sort touchpoints by timestamp
  const sortedTouchpoints = [...touchpoints].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const totalTouchpoints = sortedTouchpoints.length;
  const firstTouch = sortedTouchpoints[0];
  const lastTouch = sortedTouchpoints[totalTouchpoints - 1];

  return sortedTouchpoints.map((touchpoint, index) => {
    const score = calculateScore(touchpoint, index, totalTouchpoints, model, conversionTimestamp);
    const isFirstTouch = touchpoint === firstTouch;
    const isLastTouch = touchpoint === lastTouch;
    const daysFromConversion = Math.floor(
      (conversionTimestamp.getTime() - new Date(touchpoint.timestamp).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return {
      touchpointId: (touchpoint as { _id?: string })._id || `tp_${index}`,
      touchpointType: touchpoint.type,
      touchpoint,
      score,
      percentage: 0, // Will be calculated after all scores
      isFirstTouch,
      isLastTouch,
      position: index + 1,
      daysFromConversion,
    };
  });
}

/**
 * Calculate individual touchpoint score based on attribution model
 */
function calculateScore(
  touchpoint: ITouchpoint,
  position: number,
  totalTouchpoints: number,
  model: AttributionModel,
  conversionTimestamp: Date
): number {
  switch (model) {
    case AttributionModel.FIRST_TOUCH:
      return position === 0 ? 1 : 0;

    case AttributionModel.LAST_TOUCH:
      return position === totalTouchpoints - 1 ? 1 : 0;

    case AttributionModel.LINEAR:
      return 1 / totalTouchpoints;

    case AttributionModel.TIME_DECAY:
      return calculateTimeDecayScore(touchpoint, conversionTimestamp);

    case AttributionModel.POSITION_BASED:
      return calculatePositionBasedScore(position, totalTouchpoints);

    default:
      return 0;
  }
}

/**
 * Time decay attribution: More recent touchpoints get more credit
 * Uses exponential decay: score = (0.5)^(days/half_life)
 */
function calculateTimeDecayScore(touchpoint: ITouchpoint, conversionTimestamp: Date): number {
  const daysFromConversion = Math.floor(
    (conversionTimestamp.getTime() - new Date(touchpoint.timestamp).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const halfLife = TIME_DECAY_PARAMS.HALF_LIFE_DAYS;
  return Math.pow(0.5, daysFromConversion / halfLife);
}

/**
 * Position-based attribution: 40% first, 20% last, 40% distributed among middle
 */
function calculatePositionBasedScore(position: number, totalTouchpoints: number): number {
  if (totalTouchpoints === 1) {
    return 1; // Single touchpoint gets 100%
  }

  const firstWeight = POSITION_BASED_WEIGHTS.FIRST_TOUCH;
  const lastWeight = POSITION_BASED_WEIGHTS.LAST_TOUCH;
  const middleWeight = POSITION_BASED_WEIGHTS.MIDDLE_TOUCHES;

  // First touch
  if (position === 0) {
    return firstWeight;
  }

  // Last touch
  if (position === totalTouchpoints - 1) {
    return lastWeight;
  }

  // Middle touchpoints: distribute remaining weight equally
  const middleTouchCount = totalTouchpoints - 2;
  return middleWeight / middleTouchCount;
}

/**
 * Normalize attribution scores to percentages (sum to 100%)
 */
export function normalizeAttributionPercentages(
  attributedTouchpoints: IAttributedTouchpoint[]
): IAttributedTouchpoint[] {
  const totalScore = attributedTouchpoints.reduce((sum, tp) => sum + tp.score, 0);

  if (totalScore === 0) {
    return attributedTouchpoints.map((tp) => ({
      ...tp,
      percentage: 0,
    }));
  }

  return attributedTouchpoints.map((tp) => ({
    ...tp,
    percentage: Math.round((tp.score / totalScore) * 10000) / 100, // Round to 2 decimal places
  }));
}

/**
 * Calculate total attribution value for a conversion
 */
export function calculateAttributedValue(
  conversionValue: number,
  attributedTouchpoints: IAttributedTouchpoint[]
): Map<string, number> {
  const attributedValueByChannel = new Map<string, number>();

  for (const tp of attributedTouchpoints) {
    const currentValue = attributedValueByChannel.get(tp.touchpointType) || 0;
    const attributedAmount = conversionValue * tp.percentage / 100;
    attributedValueByChannel.set(tp.touchpointType, currentValue + attributedAmount);
  }

  return attributedValueByChannel;
}

/**
 * Get attribution breakdown summary
 */
export function getAttributionSummary(
  session: IAttributionSession,
  conversionValue?: number
): {
  model: AttributionModel;
  totalTouchpoints: number;
  channels: TouchpointType[];
  firstTouchChannel?: TouchpointType;
  lastTouchChannel?: TouchpointType;
  attributedValueByChannel?: Map<TouchpointType, number>;
} {
  const touchpoints = session.touchpoints;

  if (touchpoints.length === 0) {
    return {
      model: session.model,
      totalTouchpoints: 0,
      channels: [],
    };
  }

  const sortedTouchpoints = [...touchpoints].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const channels = [...new Set<TouchpointType>(touchpoints.map((tp: ITouchpoint) => tp.type))];

  return {
    model: session.model,
    totalTouchpoints: touchpoints.length,
    channels,
    firstTouchChannel: sortedTouchpoints[0]?.type,
    lastTouchChannel: sortedTouchpoints[sortedTouchpoints.length - 1]?.type,
  };
}

/**
 * Determine if a session is still within the attribution window
 */
export function isWithinAttributionWindow(
  session: IAttributionSession,
  currentTime: Date = new Date()
): boolean {
  return currentTime < new Date(session.expiresAt);
}

/**
 * Get default attribution model for a channel type
 */
export function getDefaultAttributionModel(channel: TouchpointType): AttributionModel {
  switch (channel) {
    case TouchpointType.QR_SCAN:
    case TouchpointType.DEEP_LINK:
      return AttributionModel.FIRST_TOUCH; // First interaction is most important
    case TouchpointType.AD_CLICK:
      return AttributionModel.LAST_TOUCH; // Last ad click before conversion
    case TouchpointType.PUSH_NOTIFICATION:
      return AttributionModel.LINEAR; // Equal credit for awareness
    default:
      return AttributionModel.LAST_TOUCH;
  }
}
