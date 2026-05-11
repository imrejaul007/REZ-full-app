import { Request, Response } from 'express';
import { UserIntelligenceService, EventPayload } from '../services/UserIntelligenceService';
import { ErrorResponse, SuccessResponse } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const userIntelligenceService = new UserIntelligenceService();

/**
 * POST /user/event
 * Capture any user behavior event
 */
export const captureEvent = async (req: Request, res: Response): Promise<void> => {
  const { eventType, userId, payload, source, timestamp, sessionId, deviceType } = req.body;

  const event: EventPayload = {
    eventType,
    userId,
    payload,
    source,
    timestamp: timestamp ? new Date(timestamp) : undefined,
    sessionId,
    deviceType,
  };

  const profile = await userIntelligenceService.captureEvent(event);

  const response: SuccessResponse<{ eventType: string; userId: string; processed: boolean }> = {
    success: true,
    data: {
      eventType,
      userId,
      processed: true,
    },
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
};

/**
 * GET /user/:id/profile
 * Get full 360 user profile view
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const profile = await userIntelligenceService.getUserProfile(userId);

  if (!profile) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `User profile for '${userId}' not found`,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(404).json(errorResponse);
    return;
  }

  const response: SuccessResponse<typeof profile> = {
    success: true,
    data: profile,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

/**
 * GET /user/:id/preferences
 * Get user preferences
 */
export const getUserPreferences = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const preferences = await userIntelligenceService.getUserPreferences(userId);

  if (!preferences) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `User preferences for '${userId}' not found`,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(404).json(errorResponse);
    return;
  }

  const response: SuccessResponse<typeof preferences> = {
    success: true,
    data: preferences,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

/**
 * GET /user/:id/recommendations
 * Get personalized recommendations
 */
export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;

  const recommendations = await userIntelligenceService.getRecommendations(userId, limit);

  const response: SuccessResponse<typeof recommendations> = {
    success: true,
    data: recommendations,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

/**
 * GET /user/:id/push-tokens
 * Get push tokens for notifications
 */
export const getPushTokens = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const tokens = await userIntelligenceService.getPushTokens(userId);

  if (!tokens) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `User '${userId}' not found`,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(404).json(errorResponse);
    return;
  }

  const response: SuccessResponse<typeof tokens> = {
    success: true,
    data: tokens,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

/**
 * GET /user/:id/lifetime-value
 * Get lifetime value information
 */
export const getLifetimeValue = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const lifetimeValue = await userIntelligenceService.getLifetimeValue(userId);

  if (!lifetimeValue) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `User '${userId}' not found`,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    };
    res.status(404).json(errorResponse);
    return;
  }

  const response: SuccessResponse<typeof lifetimeValue> = {
    success: true,
    data: lifetimeValue,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

/**
 * POST /user/:id/feedback
 * Submit user feedback
 */
export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const feedbackData = req.body;

  const feedback = await userIntelligenceService.submitFeedback(userId, feedbackData);

  const response: SuccessResponse<typeof feedback> = {
    success: true,
    data: feedback,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
};

/**
 * POST /user/:id/push-token
 * Add or update push token
 */
export const addPushToken = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { token, platform, deviceId, deviceName } = req.body;

  await userIntelligenceService.addPushToken(userId, token, platform, deviceId, deviceName);

  const response: SuccessResponse<{ added: boolean }> = {
    success: true,
    data: { added: true },
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
};

/**
 * GET /users/search
 * Search users by various criteria
 */
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  const { q, segment, churnRisk, minValue, maxValue, limit = 20, page = 1 } = req.query;

  // Build query
  const query: Record<string, unknown> = {};

  if (segment) {
    query['behavioralScores.valueSegment'] = segment;
  }

  if (churnRisk) {
    query['behavioralScores.churnRisk'] = churnRisk;
  }

  if (minValue || maxValue) {
    query['lifetimeValue.totalRevenue'] = {};
    if (minValue) (query['lifetimeValue.totalRevenue'] as Record<string, number>).$gte = parseInt(minValue as string);
    if (maxValue) (query['lifetimeValue.totalRevenue'] as Record<string, number>).$lte = parseInt(maxValue as string);
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const limitNum = Math.min(parseInt(limit as string), 100);

  const { UserProfile } = await import('../models/UserProfile');
  const [users, total] = await Promise.all([
    UserProfile.find(query)
      .select('userId profile behavioralScores lifetimeValue engagementMetrics createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    UserProfile.countDocuments(query),
  ]);

  const response: SuccessResponse<{
    users: typeof users;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> = {
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

/**
 * GET /users/segments
 * Get all user segments with counts
 */
export const getUserSegments = async (req: Request, res: Response): Promise<void> => {
  const { UserProfile } = await import('../models/UserProfile');

  const [valueSegments, churnRisks, segments] = await Promise.all([
    UserProfile.aggregate([
      {
        $group: {
          _id: '$behavioralScores.valueSegment',
          count: { $sum: 1 },
          avgRevenue: { $avg: '$lifetimeValue.totalRevenue' },
        },
      },
    ]),
    UserProfile.aggregate([
      {
        $group: {
          _id: '$behavioralScores.churnRisk',
          count: { $sum: 1 },
        },
      },
    ]),
    UserProfile.aggregate([
      { $unwind: '$metadata.segments' },
      {
        $group: {
          _id: '$metadata.segments',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
  ]);

  const response: SuccessResponse<{
    valueSegments: typeof valueSegments;
    churnRisks: typeof churnRisks;
    customSegments: typeof segments;
  }> = {
    success: true,
    data: {
      valueSegments,
      churnRisks,
      customSegments: segments,
    },
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

/**
 * POST /users/batch/push-tokens
 * Batch update push tokens
 */
export const batchUpdatePushTokens = async (req: Request, res: Response): Promise<void> => {
  const { updates } = req.body;

  const result = await userIntelligenceService.batchUpdatePushTokens(updates);

  const response: SuccessResponse<typeof result> = {
    success: true,
    data: result,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

/**
 * POST /users/batch/events
 * Batch capture multiple events
 */
export const batchCaptureEvents = async (req: Request, res: Response): Promise<void> => {
  const { events } = req.body;

  if (!Array.isArray(events) || events.length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Events array is required',
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (events.length > 100) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Maximum 100 events per batch',
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const results: Array<{ eventType: string; userId: string; success: boolean; error?: string }> = [];

  for (const event of events) {
    try {
      await userIntelligenceService.captureEvent(event);
      results.push({
        eventType: event.eventType,
        userId: event.userId,
        success: true,
      });
    } catch (error) {
      results.push({
        eventType: event.eventType,
        userId: event.userId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;

  const response: SuccessResponse<{
    processed: number;
    failed: number;
    results: typeof results;
  }> = {
    success: true,
    data: {
      processed: successCount,
      failed: results.length - successCount,
      results,
    },
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

/**
 * DELETE /user/:id
 * Delete user profile (GDPR compliance)
 */
export const deleteUserProfile = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const { UserProfile } = await import('../models/UserProfile');
  const result = await UserProfile.deleteOne({ userId });

  if (result.deletedCount === 0) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `User '${userId}' not found`,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const response: SuccessResponse<{ deleted: boolean; userId: string }> = {
    success: true,
    data: { deleted: true, userId },
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};

export default {
  captureEvent,
  getUserProfile,
  getUserPreferences,
  getRecommendations,
  getPushTokens,
  getLifetimeValue,
  submitFeedback,
  addPushToken,
  searchUsers,
  getUserSegments,
  batchUpdatePushTokens,
  batchCaptureEvents,
  deleteUserProfile,
};
