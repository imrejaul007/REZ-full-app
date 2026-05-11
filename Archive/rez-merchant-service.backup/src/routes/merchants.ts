import { Router, Request, Response } from 'express';
import { Merchant } from '../models/Merchant';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

// PEN-TEST FIX: Explicit field projection to prevent sensitive data exposure
// Never return: passwordHash, refreshTokenHash, refreshTokenMeta, accountLockedUntil,
// failedLoginAttempts, bankDetails (encrypted), apiKeys, secretKeys
const MERCHANT_PROFILE_FIELDS = [
  '_id', 'businessName', 'ownerName', 'email', 'phone',
  'businessAddress', 'logoUrl', 'coverImageUrl', 'description', 'website',
  'socialLinks', 'gstNumber', 'panNumber', 'businessType', 'cuisine', 'tags',
  'verificationStatus', 'kycStatus', 'isActive', 'emailVerified',
  'rating', 'totalReviews', 'currentPlan', 'planExpiresAt',
  'onboarding', 'createdAt', 'updatedAt',
];

/**
 * @route GET /profile
 * @summary Get merchant profile
 * @tags Merchant
 * @security BearerAuth
 * @description Returns merchant's profile information.
 * @response {object} 200 - Profile retrieved
 * @response {object} 404 - Merchant not found
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const merchant = await Merchant.findById(req.merchantId)
      .select(MERCHANT_PROFILE_FIELDS.join(' '))
      .lean();
    if (!merchant) { res.status(404).json({ success: false, message: 'Merchant not found' }); return; }
    res.json({ success: true, data: merchant });
  } catch (e: unknown) {
    const requestId = (req as any).res?.locals?.requestId;
    const message = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : (e instanceof Error ? e.message : 'Unknown error');
    res.status(500).json({ success: false, message });
  }
});

// BE-MER-002 / BE-MER-003: STRICT WHITELIST — only fields a merchant may safely edit.
// NEVER add: isVerified, subscription, accountLockedUntil, bankDetails, verificationStatus,
// kycStatus, rating, totalReviews, currentPlan, planExpiresAt, isActive, role, onboarding.
// bankDetails must ONLY be collected through the dedicated /onboarding/bank-details endpoint
// which applies field validation (BE-MER-010) and passes data through the Merchant model pre-save
// hook that encrypts accountNumber and ifscCode before storage (GDPR/RBI compliance).
const MERCHANT_PROFILE_EDITABLE_FIELDS = [
  'businessName', 'ownerName', 'phone', 'businessAddress',
  'logoUrl', 'coverImageUrl', 'description', 'website', 'socialLinks',
  'gstNumber', 'panNumber', 'businessType', 'cuisine', 'tags',
];

/**
 * @route PUT /profile
 * @summary Update merchant profile
 * @tags Merchant
 * @security BearerAuth
 * @description Updates merchant profile fields.
 * @response {object} 200 - Profile updated
 * @response {object} 400 - Validation failed
 */
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const update: Record<string, unknown> = {};
    for (const field of MERCHANT_PROFILE_EDITABLE_FIELDS) {
      if (field in req.body) update[field] = req.body[field];
    }

    // Trim whitespace on all string fields
    for (const key of Object.keys(update)) {
      if (typeof update[key] === 'string') {
        update[key] = (update[key] as string).trim();
      }
    }

    // Validate fields
    const errors: string[] = [];

    if ('businessName' in update) {
      const v = update.businessName;
      if (typeof v !== 'string' || v.length < 3 || v.length > 200) {
        errors.push('businessName must be a string between 3 and 200 characters');
      }
    }

    if ('ownerName' in update) {
      const v = update.ownerName;
      if (typeof v !== 'string' || v.length < 2 || v.length > 100) {
        errors.push('ownerName must be a string between 2 and 100 characters');
      }
    }

    if ('description' in update) {
      const v = update.description;
      if (typeof v !== 'string' || v.length > 2000) {
        errors.push('description must be a string of at most 2000 characters');
      }
    }

    if ('phone' in update) {
      const v = update.phone;
      if (typeof v !== 'string' || !/^[6-9]\d{9}$/.test(v)) {
        errors.push('phone must be a valid 10-digit Indian mobile number');
      }
    }

    if ('gstNumber' in update) {
      const v = update.gstNumber;
      if (typeof v === 'string' && v.length > 0) {
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v)) {
          errors.push('gstNumber must be a valid 15-character GST number');
        }
      }
    }

    if ('website' in update) {
      const v = update.website;
      if (typeof v === 'string' && v.length > 0) {
        if (!/^https?:\/\//.test(v)) {
          errors.push('website must start with http:// or https://');
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const merchant = await Merchant.findByIdAndUpdate(req.merchantId, { $set: update }, { new: true });
    if (!merchant) { res.status(404).json({ success: false, message: 'Merchant not found' }); return; }
    res.json({ success: true, message: 'Profile updated', data: merchant });
  } catch (e: unknown) {
    const requestId = (req as any).res?.locals?.requestId;
    const message = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : (e instanceof Error ? e.message : 'Unknown error');
    res.status(500).json({ success: false, message });
  }
});

export default router;
