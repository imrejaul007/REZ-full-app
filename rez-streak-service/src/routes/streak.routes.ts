import { Router, Request, Response } from 'express';
import { streakService, MILESTONES } from '../services/StreakService';
import { ApiResponse, StreakData, VisitResult, RecoveryResult, MilestoneInfo } from '../types';

const router = Router();

/**
 * GET /streak/:userId
 * Get streak data for a user
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID is required',
      };
      return res.status(400).json(response);
    }

    const streakData = await streakService.getStreakData(userId);

    const response: ApiResponse<StreakData> = {
      success: true,
      data: streakData,
      message: 'Streak data retrieved successfully',
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error getting streak data:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal server error',
    };
    return res.status(500).json(response);
  }
});

/**
 * POST /streak/:userId/visit
 * Record a visit for a user
 */
router.post('/:userId/visit', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID is required',
      };
      return res.status(400).json(response);
    }

    const result = await streakService.recordVisit(userId);

    const response: ApiResponse<VisitResult> = {
      success: result.success,
      data: result,
      message: result.message,
    };

    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(response);
  } catch (error) {
    console.error('Error recording visit:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal server error',
    };
    return res.status(500).json(response);
  }
});

/**
 * POST /streak/:userId/recover
 * Recover a lost streak
 */
router.post('/:userId/recover', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID is required',
      };
      return res.status(400).json(response);
    }

    const result = await streakService.recoverStreak(userId);

    const response: ApiResponse<RecoveryResult> = {
      success: result.success,
      data: result,
      message: result.message,
    };

    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(response);
  } catch (error) {
    console.error('Error recovering streak:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal server error',
    };
    return res.status(500).json(response);
  }
});

/**
 * GET /streak/:userId/milestones
 * Get milestone status for a user
 */
router.get('/:userId/milestones', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User ID is required',
      };
      return res.status(400).json(response);
    }

    const milestones = await streakService.getMilestones(userId);

    const response: ApiResponse<{
      milestones: MilestoneInfo[];
      nextMilestone: MilestoneInfo | null;
    }> = {
      success: true,
      data: {
        milestones,
        nextMilestone: milestones.find((m) => !m.achieved) || null,
      },
      message: 'Milestones retrieved successfully',
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error getting milestones:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal server error',
    };
    return res.status(500).json(response);
  }
});

/**
 * GET /api/v1/streak/milestones/config
 * Get milestone configuration (public endpoint)
 */
router.get('/milestones/config', (req: Request, res: Response) => {
  const response: ApiResponse<typeof MILESTONES> = {
    success: true,
    data: MILESTONES,
    message: 'Milestone configuration retrieved',
  };
  return res.status(200).json(response);
});

export default router;
