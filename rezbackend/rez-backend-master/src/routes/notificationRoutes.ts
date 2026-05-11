// @ts-nocheck
import { Router, Request, Response } from 'express';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  deleteNotification,
  registerPushToken,
  unregisterPushToken,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { validate, validateParams, validateQuery, notificationSchemas, commonSchemas } from '../middleware/validation';
import { generalLimiter } from '../middleware/rateLimiter';
import { Joi } from '../middleware/validation';
import { Notification } from '../models/Notification';
import { UserSettings } from '../models/UserSettings';
import { sendSuccess, sendBadRequest } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { getRedis } from '../config/redis-pool';

const router = Router();
router.use(generalLimiter);

// All notification routes require authentication
router.use(authenticate);

// Get notification statistics for the current user
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const baseQuery = { user: userId, deletedAt: { $exists: false } as any };

    const [total, unread] = await Promise.all([
      Notification.countDocuments(baseQuery),
      Notification.countDocuments({ ...baseQuery, isRead: false }),
    ]);

    sendSuccess(res, { total, unread, read: total - unread });
  }),
);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Get user notifications
router.get(
  '/',
  // generalLimiter,, // Disabled for development
  validateQuery(
    Joi.object({
      type: Joi.string().valid('order', 'promotion', 'social', 'system'),
      isRead: Joi.boolean(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(50).default(20),
    }),
  ),
  getUserNotifications,
);

// Mark notifications as read
router.patch(
  '/read',
  // generalLimiter,, // Disabled for development
  validate(notificationSchemas.markAsRead),
  markAsRead,
);

// Delete notification
router.delete(
  '/:notificationId',
  // generalLimiter,, // Disabled for development
  validateParams(
    Joi.object({
      notificationId: commonSchemas.objectId().required(),
    }),
  ),
  deleteNotification,
);

// Register push token
router.post(
  '/register-token',
  validate(
    Joi.object({
      token: Joi.string().required(),
      platform: Joi.string().valid('ios', 'android', 'web').default('android'),
      deviceInfo: Joi.object().optional(),
    }),
  ),
  registerPushToken,
);

// Unregister push token
router.post(
  '/unregister-token',
  validate(
    Joi.object({
      token: Joi.string().required(),
    }),
  ),
  unregisterPushToken,
);

// Alias: DELETE /notifications/push/unsubscribe — unregister push token via DELETE method
// Consumer app uses this path; delegates to the same unregisterPushToken controller
router.delete(
  '/push/unsubscribe',
  validate(
    Joi.object({
      token: Joi.string().required(),
    }),
  ),
  unregisterPushToken,
);

// GET /notifications/preferences — get user notification preferences from UserSettings
router.get(
  '/preferences',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const settings = await UserSettings.findOne({ user: userId }).select('notifications').lean();

    // If no settings document exists yet, return schema defaults
    const preferences = settings?.notifications ?? {
      push: {
        enabled: true,
        orderUpdates: true,
        promotions: false,
        recommendations: true,
        priceAlerts: true,
        deliveryUpdates: true,
        paymentUpdates: true,
        securityAlerts: true,
        chatMessages: true,
      },
      email: {
        enabled: true,
        newsletters: false,
        orderReceipts: true,
        weeklyDigest: true,
        promotions: false,
        securityAlerts: true,
        accountUpdates: true,
      },
      sms: {
        enabled: true,
        orderUpdates: true,
        deliveryAlerts: true,
        paymentConfirmations: true,
        securityAlerts: true,
        otpMessages: true,
      },
      inApp: {
        enabled: true,
        showBadges: true,
        soundEnabled: true,
        vibrationEnabled: true,
        bannerStyle: 'BANNER',
      },
    };

    sendSuccess(res, { preferences });
  }),
);

// PATCH /notifications/preferences — update user notification preferences in UserSettings
router.patch(
  '/preferences',
  validate(
    Joi.object({
      push: Joi.object({
        enabled: Joi.boolean(),
        orderUpdates: Joi.boolean(),
        promotions: Joi.boolean(),
        recommendations: Joi.boolean(),
        priceAlerts: Joi.boolean(),
        deliveryUpdates: Joi.boolean(),
        paymentUpdates: Joi.boolean(),
        securityAlerts: Joi.boolean(),
        chatMessages: Joi.boolean(),
      }),
      email: Joi.object({
        enabled: Joi.boolean(),
        newsletters: Joi.boolean(),
        orderReceipts: Joi.boolean(),
        weeklyDigest: Joi.boolean(),
        promotions: Joi.boolean(),
        securityAlerts: Joi.boolean(),
        accountUpdates: Joi.boolean(),
      }),
      sms: Joi.object({
        enabled: Joi.boolean(),
        orderUpdates: Joi.boolean(),
        deliveryAlerts: Joi.boolean(),
        paymentConfirmations: Joi.boolean(),
        securityAlerts: Joi.boolean(),
        otpMessages: Joi.boolean(),
      }),
      inApp: Joi.object({
        enabled: Joi.boolean(),
        showBadges: Joi.boolean(),
        soundEnabled: Joi.boolean(),
        vibrationEnabled: Joi.boolean(),
        bannerStyle: Joi.string().valid('BANNER', 'ALERT', 'SILENT'),
      }),
    }),
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const updates = req.body;

    // Build a $set map with only the provided fields to avoid overwriting unrelated prefs
    const setPayload: Record<string, any> = {};
    for (const channel of ['push', 'email', 'sms', 'inApp'] as const) {
      if (updates[channel] && typeof updates[channel] === 'object') {
        for (const [key, value] of Object.entries(updates[channel])) {
          setPayload[`notifications.${channel}.${key}`] = value;
        }
      }
    }

    if (Object.keys(setPayload).length === 0) {
      return sendBadRequest(res, 'No preference fields provided');
    }

    const settings = await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: { ...setPayload, lastUpdated: new Date() } },
      { new: true, upsert: true, select: 'notifications' },
    ).lean();

    sendSuccess(res, { preferences: settings?.notifications }, 'Notification preferences updated');
  }),
);

// DELETE /notifications/bulk-delete — delete multiple notifications by IDs
router.delete(
  '/bulk-delete',
  validate(
    Joi.object({
      ids: Joi.array().items(commonSchemas.objectId()).min(1).max(100).required(),
    }),
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { ids } = req.body as { ids: string[] };

    const result = await Notification.updateMany(
      { _id: { $in: ids }, user: userId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
    );

    sendSuccess(res, { deleted: result.modifiedCount });
  }),
);

// PATCH /notifications/:id/unread — mark a single notification as unread
router.patch(
  '/:notificationId/unread',
  validateParams(
    Joi.object({
      notificationId: commonSchemas.objectId().required(),
    }),
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId, deletedAt: null },
      {
        $set: {
          isRead: false,
          readAt: null,
          'deliveryStatus.inApp.read': false,
          'deliveryStatus.inApp.readAt': null,
        },
      },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    sendSuccess(res, { notification });
  }),
);

// DELETE /notifications/clear-all — soft-delete all notifications for the authenticated user
router.delete(
  '/clear-all',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const result = await Notification.updateMany(
      { user: userId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
    );

    sendSuccess(res, { deleted: result.modifiedCount });
  }),
);

// Marketing inbox — messages pushed by rez-marketing-service via Redis
// Returns up to 50 recent broadcast messages for the current user
router.get(
  '/marketing-inbox',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    try {
      const redis = getRedis();
      const inboxKey = `user:inbox:${userId}`;
      const raw = await redis.lrange(inboxKey, 0, 49);
      const messages = raw
        .map((item) => {
          try {
            return JSON.parse(item);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      sendSuccess(res, { messages, total: messages.length });
    } catch {
      sendSuccess(res, { messages: [], total: 0 });
    }
  }),
);

// Mark a marketing inbox message as read (removes it from Redis inbox)
router.delete(
  '/marketing-inbox/:messageId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { messageId } = req.params;
    try {
      const redis = getRedis();
      const inboxKey = `user:inbox:${userId}`;
      const raw = await redis.lrange(inboxKey, 0, 49);
      for (const item of raw) {
        try {
          const msg = JSON.parse(item);
          if (msg.id === messageId) {
            await redis.lrem(inboxKey, 1, item);
            break;
          }
        } catch {
          /* skip malformed */
        }
      }
      sendSuccess(res, { removed: true });
    } catch {
      sendSuccess(res, { removed: false });
    }
  }),
);

// Send a test notification (dev/staging only)
router.post(
  '/test',
  asyncHandler(async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return sendBadRequest(res, 'Test notifications are not available in production');
    }

    const userId = req.userId!;
    const notification = await Notification.create({
      user: userId,
      title: req.body.title || 'Test Notification',
      message: req.body.message || 'This is a test notification',
      type: req.body.type || 'info',
      category: req.body.category || 'system',
      priority: req.body.priority || 'medium',
      deliveryChannels: req.body.deliveryChannels || ['in_app'],
      source: 'system',
      isRead: false,
      data: req.body.data || {
        metadata: { isTest: true, createdVia: 'test-endpoint' },
      },
    });

    sendSuccess(res, { notification }, 'Test notification created');
  }),
);

// Get single notification by ID — must be registered LAST so specific named routes above
// (e.g. /unread-count, /pinned, /archived, /marketing-inbox) are not shadowed by this wildcard.
router.get(
  '/:notificationId',
  validateParams(
    Joi.object({
      notificationId: commonSchemas.objectId().required(),
    }),
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
      deletedAt: { $exists: false },
    }).lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    sendSuccess(res, { notification });
  }),
);

export default router;
