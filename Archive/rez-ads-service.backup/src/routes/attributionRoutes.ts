/**
 * Attribution API Routes
 *
 * REST endpoints for attribution tracking:
 * - POST /api/attribution/session - Create new attribution session
 * - POST /api/attribution/track/qr - Track QR scan
 * - POST /api/attribution/track/ad - Track ad click
 * - POST /api/attribution/track/push - Track push notification
 * - POST /api/attribution/track/deeplink - Track deep link
 * - POST /api/attribution/conversion - Record conversion
 * - GET /api/attribution/report/:sessionId - Get attribution report
 */

import { Router, Request, Response } from 'express';
import {
  AttributionModel,
  TouchpointType,
  ConversionType,
} from '@rez/shared-types';
import { AttributionTracker } from '../services/AttributionTracker';
import { getAttributionConfig } from '../config/attributionConfig';

export interface AttributionRequest extends Request {
  attributionSessionId?: string;
  userId?: string;
  deviceId?: string;
}

export function createAttributionRouter(tracker: AttributionTracker): Router {
  const router = Router();
  const config = getAttributionConfig();

  /**
   * Create a new attribution session
   */
  router.post('/session', async (req: AttributionRequest, res: Response) => {
    try {
      const { userId, deviceId, sessionId, model, windowDays } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      const session = await tracker.createSession(
        {
          userId,
          deviceId,
          sessionId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
        {
          model: model || config.defaultModel,
          attributionWindowDays: windowDays || config.defaultWindowDays,
        }
      );

      return res.status(201).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          model: session.model,
          expiresAt: session.expiresAt,
        },
      });
    } catch (error) {
      console.error('Error creating attribution session:', error);
      return res.status(500).json({ error: 'Failed to create session' });
    }
  });

  /**
   * Track QR scan
   */
  router.post('/track/qr', async (req: AttributionRequest, res: Response) => {
    try {
      const { sessionId, userId, deviceId, qrCode, qrId, merchantId, storeId, latitude, longitude, ...utm } = req.body;

      if (!sessionId || !qrCode) {
        return res.status(400).json({ error: 'sessionId and qrCode are required' });
      }

      const session = await tracker.trackQRScan(
        {
          sessionId,
          userId,
          deviceId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
        { qrCode, qrId, merchantId, storeId, latitude, longitude },
        utm
      );

      return res.status(200).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          touchpointCount: session.touchpoints.length,
          firstTouchId: session.firstTouchId,
          lastTouchId: session.lastTouchId,
        },
      });
    } catch (error) {
      console.error('Error tracking QR scan:', error);
      return res.status(500).json({ error: 'Failed to track QR scan' });
    }
  });

  /**
   * Track ad click
   */
  router.post('/track/ad', async (req: AttributionRequest, res: Response) => {
    try {
      const {
        sessionId,
        userId,
        deviceId,
        adId,
        campaignId,
        adNetwork,
        placement,
        position,
        cost,
        cpc,
        ...utm
      } = req.body;

      if (!sessionId || !adId) {
        return res.status(400).json({ error: 'sessionId and adId are required' });
      }

      const session = await tracker.trackAdClick(
        {
          sessionId,
          userId,
          deviceId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
        { adId, campaignId, adNetwork, placement, position, cost, cpc },
        utm
      );

      return res.status(200).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          touchpointCount: session.touchpoints.length,
          firstTouchId: session.firstTouchId,
          lastTouchId: session.lastTouchId,
        },
      });
    } catch (error) {
      console.error('Error tracking ad click:', error);
      return res.status(500).json({ error: 'Failed to track ad click' });
    }
  });

  /**
   * Track push notification
   */
  router.post('/track/push', async (req: AttributionRequest, res: Response) => {
    try {
      const {
        sessionId,
        userId,
        deviceId,
        notificationId,
        campaignId,
        notificationType,
        opened,
        actionTaken,
        ...utm
      } = req.body;

      if (!sessionId || !notificationId) {
        return res.status(400).json({ error: 'sessionId and notificationId are required' });
      }

      const session = await tracker.trackPushNotification(
        {
          sessionId,
          userId,
          deviceId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
        { notificationId, campaignId, notificationType, opened, actionTaken },
        utm
      );

      return res.status(200).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          touchpointCount: session.touchpoints.length,
          firstTouchId: session.firstTouchId,
          lastTouchId: session.lastTouchId,
        },
      });
    } catch (error) {
      console.error('Error tracking push notification:', error);
      return res.status(500).json({ error: 'Failed to track push notification' });
    }
  });

  /**
   * Track deep link
   */
  router.post('/track/deeplink', async (req: AttributionRequest, res: Response) => {
    try {
      const {
        sessionId,
        userId,
        deviceId,
        deepLinkUrl,
        source,
        destination,
        referringApp,
        deferred,
        ...utm
      } = req.body;

      if (!sessionId || !deepLinkUrl) {
        return res.status(400).json({ error: 'sessionId and deepLinkUrl are required' });
      }

      const session = await tracker.trackDeepLink(
        {
          sessionId,
          userId,
          deviceId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
        { deepLinkUrl, source, destination, referringApp, deferred },
        utm
      );

      return res.status(200).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          touchpointCount: session.touchpoints.length,
          firstTouchId: session.firstTouchId,
          lastTouchId: session.lastTouchId,
        },
      });
    } catch (error) {
      console.error('Error tracking deep link:', error);
      return res.status(500).json({ error: 'Failed to track deep link' });
    }
  });

  /**
   * Record conversion
   */
  router.post('/conversion', async (req: Request, res: Response) => {
    try {
      const { sessionId, type, value, currency, orderId, transactionId } = req.body;

      if (!sessionId || !type) {
        return res.status(400).json({ error: 'sessionId and type are required' });
      }

      const conversion = await tracker.recordConversion(sessionId, {
        type,
        value,
        currency,
        orderId,
        transactionId,
      });

      if (!conversion) {
        return res.status(404).json({
          error: 'Conversion not recorded - session not found or window expired',
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          conversionId: conversion._id,
          sessionId: conversion.sessionId,
          type: conversion.type,
          value: conversion.value,
          model: conversion.model,
          totalAttributionScore: conversion.totalAttributionScore,
          attributedTouchpoints: conversion.attributedTouchpoints.map((tp) => ({
            type: tp.touchpointType,
            score: tp.score,
            percentage: tp.percentage,
            isFirstTouch: tp.isFirstTouch,
            isLastTouch: tp.isLastTouch,
          })),
        },
      });
    } catch (error) {
      console.error('Error recording conversion:', error);
      return res.status(500).json({ error: 'Failed to record conversion' });
    }
  });

  /**
   * Get attribution report
   */
  router.get('/report/:sessionId', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      const result = await tracker.getAttributionReport(sessionId);

      if (!result) {
        return res.status(404).json({ error: 'Session not found' });
      }

      return res.status(200).json({
        success: true,
        data: result.report,
      });
    } catch (error) {
      console.error('Error getting attribution report:', error);
      return res.status(500).json({ error: 'Failed to get report' });
    }
  });

  /**
   * Get service stats
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      return res.status(200).json({
        success: true,
        data: {
          activeSessions: tracker.getActiveSessionsCount(),
          config: {
            defaultWindowDays: config.defaultWindowDays,
            defaultModel: config.defaultModel,
            maxTouchpointsPerSession: config.maxTouchpointsPerSession,
            crossDeviceTracking: config.crossDeviceTracking,
          },
        },
      });
    } catch (error) {
      console.error('Error getting stats:', error);
      return res.status(500).json({ error: 'Failed to get stats' });
    }
  });

  return router;
}
