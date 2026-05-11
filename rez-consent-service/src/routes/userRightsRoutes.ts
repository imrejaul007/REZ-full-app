/**
 * User Rights Routes (DPDP Article 6)
 * Implements user data rights
 */

import { Router, Request, Response } from 'express';
import {
  exportUserData,
  deleteUserData,
  generateDataExport,
  requestDeletion,
  isDeletionInProgress
} from '../services/userRightsService';
import { param, validationResult } from 'express-validator';

const router = Router();

// Validation helper
const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * GET /api/user-rights/export/:userId
 * Right to Access - View all user data
 */
router.get('/export/:userId',
  param('userId').isString().notEmpty(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Verify authorization
      const authUserId = req.headers['x-user-id'];
      if (authUserId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to export this user\'s data'
        });
      }

      const exportData = await exportUserData(userId);

      res.json({
        success: true,
        data: exportData,
        message: 'Data export includes all personal information held by ReZ'
      });
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ success: false, error: 'Failed to export data' });
    }
  }
);

/**
 * GET /api/user-rights/export/:userId/file
 * Right to Data Portability - Download as JSON file
 */
router.get('/export/:userId/file',
  param('userId').isString().notEmpty(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Verify authorization
      const authUserId = req.headers['x-user-id'];
      if (authUserId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to export this user\'s data'
        });
      }

      const fileBuffer = await generateDataExport(userId);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="rez-data-export-${userId}.json"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error('Export file error:', error);
      res.status(500).json({ success: false, error: 'Failed to generate export file' });
    }
  }
);

/**
 * POST /api/user-rights/delete/:userId
 * Right to Erasure - Delete all user data
 */
router.post('/delete/:userId',
  param('userId').isString().notEmpty(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Verify authorization
      const authUserId = req.headers['x-user-id'];
      if (authUserId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to delete this user\'s data'
        });
      }

      // Check if deletion is already in progress
      const inProgress = await isDeletionInProgress(userId);
      if (inProgress) {
        return res.status(409).json({
          success: false,
          error: 'Deletion already in progress'
        });
      }

      // Request deletion (async processing)
      const { requestId, estimatedCompletion } = await requestDeletion(userId);

      res.json({
        success: true,
        data: {
          requestId,
          status: 'pending',
          estimatedCompletion,
          message: 'Your deletion request has been received. Data will be deleted within 7 days.'
        }
      });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ success: false, error: 'Failed to initiate deletion' });
    }
  }
);

/**
 * GET /api/user-rights/deletion-status/:userId
 * Check deletion status
 */
router.get('/deletion-status/:userId',
  param('userId').isString().notEmpty(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Verify authorization
      const authUserId = req.headers['x-user-id'];
      if (authUserId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to check this user\'s deletion status'
        });
      }

      const inProgress = await isDeletionInProgress(userId);

      res.json({
        success: true,
        data: {
          deletionInProgress: inProgress,
          message: inProgress
            ? 'Your data is being deleted. This may take up to 7 days.'
            : 'No pending deletion request found.'
        }
      });
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({ success: false, error: 'Failed to check deletion status' });
    }
  }
);

/**
 * GET /api/user-rights/privacy-policy
 * Get privacy policy
 */
router.get('/privacy-policy', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      version: '2.0',
      lastUpdated: '2026-05-07',
      policyUrl: 'https://rez.money/privacy',
      summary: {
        dataWeCollect: [
          'Profile information (name, phone, email)',
          'Order and transaction history',
          'Location data (with your consent)',
          'App usage and analytics (with your consent)',
          'AI-powered recommendations (with your consent)'
        ],
        dataRetention: [
          'Intent signals: 90 days',
          'Transaction logs: 7 years (legal requirement)',
          'Inactive accounts: Anonymized after 2 years'
        ],
        yourRights: [
          'Right to access your data',
          'Right to correction',
          'Right to erasure',
          'Right to withdraw consent',
          'Right to data portability'
        ]
      }
    }
  });
});

export default router;
