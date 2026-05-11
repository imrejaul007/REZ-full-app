/**
 * Support Copilot Integration Routes
 * API endpoints for support copilot to access user intelligence data
 */

import { Router, Request, Response } from 'express';
import {
  getEnrichedUserProfile,
  getSupportContext,
  alertSupportForChurnRisk,
  getUserChurnRisk,
  updateUserProfileFromInteraction,
  sendSatisfactionFeedback,
  syncUserSegments,
} from '../integrations/supportCopilotIntegration';

const router = Router();

/**
 * POST /user/:id/interaction
 * Record a user interaction from support copilot
 */
router.post('/user/:id/interaction', async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params;
    const { interactionType, message, metadata, timestamp } = req.body;

    // Update user intelligence with interaction
    // This could update behavioral scores, interaction counts, etc.

    res.json({
      success: true,
      message: 'Interaction recorded',
      userId,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /user/:id/support-context
 * Get enriched user profile for support agents
 */
router.get('/user/:id/support-context', async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params;

    const context = await getSupportContext(userId);

    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: context,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /user/:id/churn-risk
 * Get churn risk assessment for a user
 */
router.get('/user/:id/churn-risk', async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params;

    const churnRisk = await getUserChurnRisk(userId);

    if (!churnRisk) {
      return res.status(404).json({
        success: false,
        error: 'Churn risk data not available',
      });
    }

    res.json({
      success: true,
      data: churnRisk,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /user/:id/churn-risk/alert
 * Trigger support alert for high churn risk
 */
router.post('/user/:id/churn-risk/alert', async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params;

    const churnRisk = await getUserChurnRisk(userId);

    if (!churnRisk) {
      return res.status(404).json({
        success: false,
        error: 'Churn risk data not available',
      });
    }

    // Only alert for medium or higher risk
    if (churnRisk.riskLevel === 'low') {
      return res.json({
        success: true,
        message: 'No alert needed - low risk',
        riskLevel: churnRisk.riskLevel,
      });
    }

    await alertSupportForChurnRisk(churnRisk);

    res.json({
      success: true,
      message: 'Support alert triggered',
      riskLevel: churnRisk.riskLevel,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /user/:id/segment-update
 * Update user segments from support copilot
 */
router.post('/user/:id/segment-update', async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params;
    const { previousSegments, newSegments, removedSegments, addedSegments } = req.body;

    await syncUserSegments(userId, previousSegments, newSegments);

    res.json({
      success: true,
      message: 'Segment update synced',
      userId,
      changes: {
        added: addedSegments,
        removed: removedSegments,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /users/at-risk
 * Get all users with high churn risk (for batch processing)
 */
router.get('/users/at-risk', async (req: Request, res: Response) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 60;

    // This would typically query the database for users above threshold
    // For now, return empty array as placeholder
    res.json({
      success: true,
      data: {
        users: [],
        threshold,
        count: 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /user/:id/satisfaction-feedback
 * Submit satisfaction feedback to support
 */
router.post('/user/:id/satisfaction-feedback', async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params;
    const { score, feedback } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        error: 'Score must be between 1 and 5',
      });
    }

    await sendSatisfactionFeedback(userId, score, feedback);

    res.json({
      success: true,
      message: 'Feedback submitted',
      score,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
