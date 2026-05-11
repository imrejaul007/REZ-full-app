// @ts-nocheck
import { Router } from 'express';
import {
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
} from '../controllers/UserIntelligenceController';
import {
  validateEvent,
  validateFeedback,
  validatePushToken,
  validateUserId,
  validatePagination,
  validateRecommendationParams,
} from '../middleware/validation';
import {
  apiRateLimiter,
  strictRateLimiter,
  eventRateLimiter,
  userRateLimiter,
} from '../middleware/security';
import { asyncHandler } from '../middleware/errorHandler';
import supportIntegrationRoutes from './supportIntegration';

const router = Router();

// Health check (no rate limiting)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'user-intelligence-service',
      timestamp: new Date().toISOString(),
    },
  });
});

// Service readiness check
router.get('/ready', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ready',
      service: 'user-intelligence-service',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================================================
// USER EVENT ENDPOINTS
// ============================================================================

// POST /user/event - Capture any user behavior event
router.post(
  '/user/event',
  apiRateLimiter,
  eventRateLimiter,
  validateEvent,
  asyncHandler(captureEvent)
);

// POST /users/batch/events - Batch capture events
router.post(
  '/users/batch/events',
  apiRateLimiter,
  asyncHandler(batchCaptureEvents)
);

// ============================================================================
// USER PROFILE ENDPOINTS
// ============================================================================

// GET /user/:id/profile - Get full 360 user profile view
router.get(
  '/user/:id/profile',
  userRateLimiter,
  validateUserId,
  asyncHandler(getUserProfile)
);

// GET /user/:id/preferences - Get user preferences
router.get(
  '/user/:id/preferences',
  userRateLimiter,
  validateUserId,
  asyncHandler(getUserPreferences)
);

// GET /user/:id/recommendations - Get personalized recommendations
router.get(
  '/user/:id/recommendations',
  userRateLimiter,
  validateUserId,
  validateRecommendationParams,
  asyncHandler(getRecommendations)
);

// GET /user/:id/push-tokens - Get push tokens for notifications
router.get(
  '/user/:id/push-tokens',
  userRateLimiter,
  validateUserId,
  asyncHandler(getPushTokens)
);

// POST /user/:id/push-token - Add or update push token
router.post(
  '/user/:id/push-token',
  userRateLimiter,
  strictRateLimiter,
  validateUserId,
  validatePushToken,
  asyncHandler(addPushToken)
);

// GET /user/:id/lifetime-value - Get lifetime value information
router.get(
  '/user/:id/lifetime-value',
  userRateLimiter,
  validateUserId,
  asyncHandler(getLifetimeValue)
);

// POST /user/:id/feedback - Submit user feedback
router.post(
  '/user/:id/feedback',
  userRateLimiter,
  strictRateLimiter,
  validateUserId,
  validateFeedback,
  asyncHandler(submitFeedback)
);

// DELETE /user/:id - Delete user profile (GDPR compliance)
router.delete(
  '/user/:id',
  strictRateLimiter,
  validateUserId,
  asyncHandler(deleteUserProfile)
);

// ============================================================================
// ADMIN & SEARCH ENDPOINTS
// ============================================================================

// GET /users/search - Search users by various criteria
router.get(
  '/users/search',
  apiRateLimiter,
  validatePagination,
  asyncHandler(searchUsers)
);

// GET /users/segments - Get all user segments with counts
router.get(
  '/users/segments',
  apiRateLimiter,
  asyncHandler(getUserSegments)
);

// POST /users/batch/push-tokens - Batch update push tokens
router.post(
  '/users/batch/push-tokens',
  apiRateLimiter,
  asyncHandler(batchUpdatePushTokens)
);

// ============================================================================
// SUPPORT COPILOT INTEGRATION ROUTES
// ============================================================================

// POST /user/:id/interaction - Record user interaction from support
router.post(
  '/user/:id/interaction',
  userRateLimiter,
  asyncHandler(async (req, res) => {
    // Delegate to support integration
    supportIntegrationRoutes(req, res);
  })
);

// GET /user/:id/support-context - Get enriched profile for support
router.get(
  '/user/:id/support-context',
  userRateLimiter,
  asyncHandler(async (req, res) => {
    supportIntegrationRoutes(req, res);
  })
);

// GET /user/:id/churn-risk - Get churn risk assessment
router.get(
  '/user/:id/churn-risk',
  userRateLimiter,
  asyncHandler(async (req, res) => {
    supportIntegrationRoutes(req, res);
  })
);

// POST /user/:id/churn-risk/alert - Trigger support alert for churn risk
router.post(
  '/user/:id/churn-risk/alert',
  userRateLimiter,
  asyncHandler(async (req, res) => {
    supportIntegrationRoutes(req, res);
  })
);

// GET /users/at-risk - Get all users with high churn risk
router.get(
  '/users/at-risk',
  apiRateLimiter,
  asyncHandler(async (req, res) => {
    supportIntegrationRoutes(req, res);
  })
);

export default router;
