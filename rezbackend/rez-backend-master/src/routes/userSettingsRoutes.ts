// @ts-nocheck
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  getUserSettings,
  updateGeneralSettings,
  updateNotificationPreferences,
  updatePrivacySettings,
  updateSecuritySettings,
  updateDeliveryPreferences,
  updatePaymentPreferences,
  updateAppPreferences,
  resetSettings,
  getCourierPreferences,
  updateCourierPreferences,
  getNotificationSettings,
  updatePushNotifications,
  updateEmailNotifications,
  updateSMSNotifications,
  updateInAppNotifications,
  enableTwoFactorAuth,
  disableTwoFactorAuth,
  verifyTwoFactorCode,
  generateBackupCodes,
  updateBiometricSettings,
  getSecurityStatus,
} from '../controllers/userSettingsController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { UserSettings } from '../models/UserSettings';
import { logger } from '../config/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Settings routes
router.get('/', getUserSettings);
router.put('/general', updateGeneralSettings);
router.put('/notifications', updateNotificationPreferences);
router.put('/privacy', updatePrivacySettings);
router.put('/security', updateSecuritySettings);
router.put('/delivery', updateDeliveryPreferences);

// Security-specific routes
router.get('/security/status', getSecurityStatus);
router.post('/security/2fa/enable', enableTwoFactorAuth);
router.post('/security/2fa/disable', disableTwoFactorAuth);
router.post('/security/2fa/verify', verifyTwoFactorCode);
router.post('/security/2fa/backup-codes', generateBackupCodes);
router.put('/security/biometric', updateBiometricSettings);
router.put('/payment', updatePaymentPreferences);
router.put('/preferences', updateAppPreferences);
router.post('/reset', resetSettings);

// Courier preference routes
router.get('/courier', getCourierPreferences);
router.put('/courier', updateCourierPreferences);

// Enhanced notification routes
router.get('/notifications/all', getNotificationSettings);
router.put('/notifications/push', updatePushNotifications);
router.put('/notifications/email', updateEmailNotifications);
router.put('/notifications/sms', updateSMSNotifications);
router.put('/notifications/inapp', updateInAppNotifications);

// ── Sprint 11: Simplified settings + account management endpoints ──
// These are mounted at /api/user/settings (via a separate mount in routes.ts)
// and complement the full /api/user-settings routes above.

/**
 * GET /api/user/settings
 * Returns notification preferences + privacy settings for the authenticated user.
 */
router.get(
  '/sprint11',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId || (req as any).user?._id || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const settings = await UserSettings.findOne({ user: new mongoose.Types.ObjectId(userId.toString()) })
      .select(
        'notifications.push.enabled notifications.push.promotions notifications.push.deliveryUpdates notifications.push.paymentUpdates notifications.push.securityAlerts notifications.push.chatMessages privacy.profileVisibility privacy.dataSharing privacy.analytics',
      )
      .lean();

    const notifications = {
      push: (settings as any)?.notifications?.push?.enabled ?? true,
      cashbackAlerts: (settings as any)?.notifications?.push?.paymentUpdates ?? true,
      streakReminders: (settings as any)?.notifications?.push?.deliveryUpdates ?? true,
      offerAlerts: (settings as any)?.notifications?.push?.promotions ?? false,
      achievementUnlocks: (settings as any)?.notifications?.push?.chatMessages ?? true,
    };

    const privacy = {
      dataExportRequested: false,
      deleteRequested: false,
    };

    return res.json({ success: true, notifications, privacy });
  }),
);

export const sprint11SettingsRouter = Router();
sprint11SettingsRouter.use(authenticate);

/**
 * GET /api/user/settings
 */
sprint11SettingsRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId || (req as any).user?._id || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const settings = await UserSettings.findOne({ user: new mongoose.Types.ObjectId(userId.toString()) }).lean();

    const notifications = {
      push: (settings as any)?.notifications?.push?.enabled ?? true,
      cashbackAlerts: (settings as any)?.notifications?.push?.paymentUpdates ?? true,
      streakReminders: (settings as any)?.notifications?.push?.deliveryUpdates ?? true,
      offerAlerts: (settings as any)?.notifications?.push?.promotions ?? false,
      achievementUnlocks: (settings as any)?.notifications?.push?.chatMessages ?? true,
    };

    const privacy = {
      dataExportRequested: (settings as any)?.privacy?.dataExportRequested ?? false,
      deleteRequested: (settings as any)?.privacy?.deleteRequested ?? false,
    };

    return res.json({ success: true, notifications, privacy });
  }),
);

/**
 * PATCH /api/user/settings
 * Update notification preferences (partial update).
 */
sprint11SettingsRouter.patch(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId || (req as any).user?._id || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { notifications } = req.body as {
      notifications?: {
        push?: boolean;
        cashbackAlerts?: boolean;
        streakReminders?: boolean;
        offerAlerts?: boolean;
        achievementUnlocks?: boolean;
      };
    };

    const updateFields: Record<string, any> = {};
    if (notifications !== undefined) {
      if (notifications.push !== undefined) updateFields['notifications.push.enabled'] = notifications.push;
      if (notifications.cashbackAlerts !== undefined)
        updateFields['notifications.push.paymentUpdates'] = notifications.cashbackAlerts;
      if (notifications.streakReminders !== undefined)
        updateFields['notifications.push.deliveryUpdates'] = notifications.streakReminders;
      if (notifications.offerAlerts !== undefined)
        updateFields['notifications.push.promotions'] = notifications.offerAlerts;
      if (notifications.achievementUnlocks !== undefined)
        updateFields['notifications.push.chatMessages'] = notifications.achievementUnlocks;
    }

    const updated = await UserSettings.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId(userId.toString()) },
      { $set: updateFields },
      { upsert: true, new: true },
    );

    logger.info('[UserSettings] Notification preferences updated', { userId: userId.toString() });
    return res.json({ success: true, message: 'Settings updated', settings: updated });
  }),
);

export const sprint11AccountRouter = Router();
sprint11AccountRouter.use(authenticate);

/**
 * POST /api/user/account/delete-request
 * Request data export or account deletion.
 */
sprint11AccountRouter.post(
  '/delete-request',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId || (req as any).user?._id || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { type } = req.body as { type?: 'export' | 'delete' };
    if (type !== 'export' && type !== 'delete') {
      return res.status(400).json({ success: false, message: 'type must be "export" or "delete"' });
    }

    const User = mongoose.model('User');
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());

    if (type === 'export') {
      await UserSettings.findOneAndUpdate(
        { user: userObjectId },
        { $set: { 'privacy.dataExportRequested': true } },
        { upsert: true },
      );
      logger.info('[UserSettings] Data export requested', { userId: userId.toString() });
      return res.json({
        success: true,
        message: 'Data export request submitted. You will receive your data via email within 30 days.',
      });
    }

    // type === 'delete': soft-delete — mark for deletion after 30 days
    await User.findByIdAndUpdate(userObjectId, {
      $set: {
        isActive: false,
        deletedAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await UserSettings.findOneAndUpdate(
      { user: userObjectId },
      { $set: { 'privacy.deleteRequested': true } },
      { upsert: true },
    );

    logger.info('[UserSettings] Account deletion requested', { userId: userId.toString() });
    return res.json({
      success: true,
      message:
        'Account deletion request submitted. Your account will be permanently deleted after 30 days. Contact support to cancel.',
    });
  }),
);

export default router;
