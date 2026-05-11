import { Router, Request, Response } from 'express';
import { consentService } from '../services/consentService';
import { ConsentType, CONSENT_PURPOSES } from '../models/consent';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// Validation helper
const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Get user consent summary
router.get('/user/:userId',
  param('userId').isString().notEmpty(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const summary = await consentService.getUserConsentSummary(userId);
      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get consent summary' });
    }
  }
);

// Check specific consent
router.get('/check/:userId/:consentType',
  param('userId').isString().notEmpty(),
  param('consentType').isIn(['location_tracking', 'analytics', 'marketing', 'ai_profiling', 'third_party_sharing', 'data_processing']),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { userId, consentType } = req.params;
      const hasConsent = await consentService.hasConsent(userId, consentType as ConsentType);
      res.json({
        success: true,
        data: {
          consentType,
          hasConsent,
          purpose: CONSENT_PURPOSES[consentType as ConsentType]
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to check consent' });
    }
  }
);

// Grant or update consent
router.post('/',
  body('userId').isString().notEmpty(),
  body('consentType').isIn(['location_tracking', 'analytics', 'marketing', 'ai_profiling', 'third_party_sharing', 'data_processing']),
  body('status').isIn(['granted', 'denied']),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { userId, consentType, status, source } = req.body;
      const record = await consentService.updateConsent({
        userId,
        consentType: consentType as ConsentType,
        status,
        source: source || 'settings',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      res.json({ success: true, data: record });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update consent' });
    }
  }
);

// Withdraw consent
router.delete('/:userId/:consentType',
  param('userId').isString().notEmpty(),
  param('consentType').isIn(['location_tracking', 'analytics', 'marketing', 'ai_profiling', 'third_party_sharing', 'data_processing']),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { userId, consentType } = req.params;
      const record = await consentService.withdrawConsent(
        userId,
        consentType as ConsentType,
        req.ip,
        req.headers['user-agent'] as string
      );
      res.json({ success: true, data: record });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to withdraw consent' });
    }
  }
);

// Get consent history
router.get('/history/:userId',
  param('userId').isString().notEmpty(),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await consentService.getConsentHistory(userId, limit);
      res.json({ success: true, data: history });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get consent history' });
    }
  }
);

// Get all available consent types with purposes
router.get('/types', (req: Request, res: Response) => {
  const types = Object.entries(CONSENT_PURPOSES).map(([type, purpose]) => ({
    type,
    purpose,
    required: type === 'data_processing' // Data processing is always required for basic service
  }));
  res.json({ success: true, data: types });
});

// Check if user needs to re-consent
router.get('/needs-reconsent/:userId',
  param('userId').isString().notEmpty(),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const needsReconsent = await consentService.needsReConsent(userId);
      res.json({ success: true, data: { needsReconsent } });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to check re-consent status' });
    }
  }
);

// Revoke all consents (for account deletion)
router.post('/:userId/revoke-all',
  param('userId').isString().notEmpty(),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      await consentService.revokeAllConsents(userId);
      res.json({ success: true, message: 'All consents revoked' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to revoke consents' });
    }
  }
);

export default router;
