/**
 * Attribution Configuration - Centralized configuration for attribution settings
 *
 * Provides environment-based configuration for:
 * - Default attribution windows
 * - Attribution model defaults per channel
 * - Cleanup intervals
 * - Storage settings
 */

import {
  AttributionModel,
  TouchpointType,
  DEFAULT_ATTRIBUTION_WINDOW_DAYS,
} from '@rez/shared-types';

export interface AttributionConfig {
  /** Default attribution window in days */
  defaultWindowDays: number;

  /** Default attribution model */
  defaultModel: AttributionModel;

  /** Default model per touchpoint type */
  defaultModelByChannel: Record<TouchpointType, AttributionModel>;

  /** Session cleanup interval in milliseconds */
  cleanupIntervalMs: number;

  /** Maximum touchpoints per session */
  maxTouchpointsPerSession: number;

  /** Enable cross-device tracking */
  crossDeviceTracking: boolean;

  /** Enable organic credit attribution */
  includeOrganicTouchpoints: boolean;

  /** Organic credit percentage when enabled */
  organicCreditPercentage: number;

  /** Enable real-time attribution updates */
  realTimeAttribution: boolean;

  /** Enable attribution analytics */
  enableAnalytics: boolean;
}

const defaultConfig: AttributionConfig = {
  defaultWindowDays: DEFAULT_ATTRIBUTION_WINDOW_DAYS,
  defaultModel: AttributionModel.LAST_TOUCH,
  defaultModelByChannel: {
    [TouchpointType.QR_SCAN]: AttributionModel.FIRST_TOUCH,
    [TouchpointType.AD_CLICK]: AttributionModel.LAST_TOUCH,
    [TouchpointType.PUSH_NOTIFICATION]: AttributionModel.LINEAR,
    [TouchpointType.DEEP_LINK]: AttributionModel.FIRST_TOUCH,
    [TouchpointType.EMAIL_OPEN]: AttributionModel.LINEAR,
    [TouchpointType.EMAIL_CLICK]: AttributionModel.LAST_TOUCH,
    [TouchpointType.SMS_CLICK]: AttributionModel.LAST_TOUCH,
    [TouchpointType.SOCIAL_CLICK]: AttributionModel.FIRST_TOUCH,
    [TouchpointType.WEB_BANNER]: AttributionModel.LAST_TOUCH,
    [TouchpointType.REFERRAL]: AttributionModel.FIRST_TOUCH,
  },
  cleanupIntervalMs: 60 * 60 * 1000, // 1 hour
  maxTouchpointsPerSession: 100,
  crossDeviceTracking: true,
  includeOrganicTouchpoints: true,
  organicCreditPercentage: 15, // 15% credit to organic
  realTimeAttribution: true,
  enableAnalytics: true,
};

/**
 * Get attribution configuration from environment variables
 */
export function getAttributionConfig(): AttributionConfig {
  return {
    ...defaultConfig,
    defaultWindowDays:
      parseInt(process.env.ATTRIBUTION_WINDOW_DAYS || '', 10) || defaultConfig.defaultWindowDays,
    defaultModel:
      (process.env.ATTRIBUTION_DEFAULT_MODEL as AttributionModel) || defaultConfig.defaultModel,
    cleanupIntervalMs:
      parseInt(process.env.ATTRIBUTION_CLEANUP_INTERVAL_MS || '', 10) ||
      defaultConfig.cleanupIntervalMs,
    maxTouchpointsPerSession:
      parseInt(process.env.ATTRIBUTION_MAX_TOUCHPOINTS || '', 10) ||
      defaultConfig.maxTouchpointsPerSession,
    crossDeviceTracking: process.env.ATTRIBUTION_CROSS_DEVICE !== 'false',
    includeOrganicTouchpoints: process.env.ATTRIBUTION_ORGANIC !== 'false',
    organicCreditPercentage:
      parseInt(process.env.ATTRIBUTION_ORGANIC_CREDIT || '', 10) ||
      defaultConfig.organicCreditPercentage,
    realTimeAttribution: process.env.ATTRIBUTION_REALTIME !== 'false',
    enableAnalytics: process.env.ATTRIBUTION_ANALYTICS !== 'false',
  };
}

/**
 * Validate attribution configuration
 */
export function validateAttributionConfig(config: Partial<AttributionConfig>): string[] {
  const errors: string[] = [];

  if (config.defaultWindowDays !== undefined) {
    if (config.defaultWindowDays < 1 || config.defaultWindowDays > 365) {
      errors.push('ATTRIBUTION_WINDOW_DAYS must be between 1 and 365');
    }
  }

  if (config.defaultModel !== undefined) {
    const validModels = Object.values(AttributionModel);
    if (!validModels.includes(config.defaultModel)) {
      errors.push(`ATTRIBUTION_DEFAULT_MODEL must be one of: ${validModels.join(', ')}`);
    }
  }

  if (config.organicCreditPercentage !== undefined) {
    if (config.organicCreditPercentage < 0 || config.organicCreditPercentage > 100) {
      errors.push('ATTRIBUTION_ORGANIC_CREDIT must be between 0 and 100');
    }
  }

  return errors;
}

// Re-export constants for convenience
export {
  DEFAULT_ATTRIBUTION_WINDOW_DAYS,
  AttributionModel,
  TouchpointType,
} from '@rez/shared-types';
