import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { trackingStore } from '../models/Tracking';
import { locationService } from '../services/locationService';
import { notificationService } from '../services/notificationService';
import {
  TrackingSession,
  GeoPoint,
  Geofence,
  Destination,
  RouteGeometry,
  ApiResponse,
  PaginatedResponse,
  LocationUpdate,
  TrackingStats
} from '../types';

const router = Router();

/**
 * Validation middleware
 */
function validateCoordinates(req: Request, res: Response, next: NextFunction): void {
  const { latitude, longitude } = req.body;
  if (latitude !== undefined || longitude !== undefined) {
    if (
      (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) ||
      (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180))
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.'
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }
  }
  next();
}

/**
 * Create a new tracking session
 * POST /api/tracking/sessions
 */
router.post('/sessions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId, deliveryId } = req.body;

    if (!driverId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DRIVER_ID',
          message: 'driverId is required'
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    // Check if driver already has an active session
    const existingSession = trackingStore.getActiveSessionForDriver(driverId);
    if (existingSession) {
      res.status(409).json({
        success: false,
        error: {
          code: 'ACTIVE_SESSION_EXISTS',
          message: 'Driver already has an active tracking session',
          details: existingSession
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    const session = trackingStore.createSession(driverId, deliveryId);

    res.status(201).json({
      success: true,
      data: session,
      timestamp: Date.now()
    } as ApiResponse<TrackingSession>);
  } catch (error) {
    console.error('[TrackingRoutes] Error creating session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create tracking session'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Get tracking session by ID
 * GET /api/tracking/sessions/:sessionId
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const session = trackingStore.getSession(sessionId);

    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Tracking session ${sessionId} not found`
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: session,
      timestamp: Date.now()
    } as ApiResponse<TrackingSession>);
  } catch (error) {
    console.error('[TrackingRoutes] Error getting session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get tracking session'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Get active session for a driver
 * GET /api/tracking/drivers/:driverId/active
 */
router.get('/drivers/:driverId/active', async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;
    const session = trackingStore.getActiveSessionForDriver(driverId);

    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NO_ACTIVE_SESSION',
          message: `No active tracking session for driver ${driverId}`
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: session,
      timestamp: Date.now()
    } as ApiResponse<TrackingSession>);
  } catch (error) {
    console.error('[TrackingRoutes] Error getting active session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get active session'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Update location for a tracking session
 * PUT /api/tracking/sessions/:sessionId/location
 */
router.put('/sessions/:sessionId/location', validateCoordinates, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { latitude, longitude, accuracy, altitude, heading, speed, batteryLevel } = req.body;

    const session = trackingStore.getSession(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Tracking session ${sessionId} not found`
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    if (session.status !== 'active') {
      res.status(400).json({
        success: false,
        error: {
          code: 'SESSION_NOT_ACTIVE',
          message: 'Cannot update location for non-active session'
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    // Filter GPS noise
    let location: GeoPoint = {
      latitude,
      longitude,
      timestamp: Date.now(),
      accuracy,
      altitude,
      heading,
      speed
    };

    location = locationService.filterGpsNoise(location, session.currentLocation);

    // Process location update
    const { updatedSession, geofenceAlerts, eta } = locationService.processLocationUpdate(
      session,
      location
    );

    // Send geofence alerts
    for (const alert of geofenceAlerts) {
      notificationService.notifyGeofenceAlert(updatedSession, alert);
    }

    // Send ETA update if available
    if (eta) {
      notificationService.notifyETAUpdate(updatedSession, eta);
    }

    res.json({
      success: true,
      data: {
        session: updatedSession,
        geofenceAlerts,
        eta
      },
      timestamp: Date.now()
    } as ApiResponse);
  } catch (error) {
    console.error('[TrackingRoutes] Error updating location:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update location'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Batch location update (for high-frequency updates)
 * POST /api/tracking/locations/batch
 */
router.post('/locations/batch', validateCoordinates, async (req: Request, res: Response): Promise<void> => {
  try {
    const { locations } = req.body as { locations: LocationUpdate[] };

    if (!Array.isArray(locations) || locations.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'locations array is required'
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    const results: Array<{
      driverId: string;
      success: boolean;
      geofenceAlerts?: unknown[];
      error?: string;
    }> = [];

    for (const locUpdate of locations) {
      try {
        const session = trackingStore.getActiveSessionForDriver(locUpdate.driverId);
        if (!session) {
          results.push({
            driverId: locUpdate.driverId,
            success: false,
            error: 'No active session'
          });
          continue;
        }

        let location: GeoPoint = {
          ...locUpdate.location,
          timestamp: Date.now()
        };

        location = locationService.filterGpsNoise(location, session.currentLocation);

        const { geofenceAlerts } = locationService.processLocationUpdate(session, location);

        results.push({
          driverId: locUpdate.driverId,
          success: true,
          geofenceAlerts
        });

        // Send geofence alerts
        for (const alert of geofenceAlerts) {
          notificationService.notifyGeofenceAlert(session, alert);
        }
      } catch (err) {
        results.push({
          driverId: locUpdate.driverId,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    res.json({
      success: true,
      data: results,
      timestamp: Date.now()
    } as ApiResponse);
  } catch (error) {
    console.error('[TrackingRoutes] Error in batch update:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process batch location update'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Set destination for a tracking session
 * PUT /api/tracking/sessions/:sessionId/destination
 */
router.put('/sessions/:sessionId/destination', validateCoordinates, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { coordinates, address, radius } = req.body;

    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DESTINATION',
          message: 'Valid coordinates are required'
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    const session = trackingStore.getSession(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Tracking session ${sessionId} not found`
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    const destination: Destination = {
      coordinates: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      },
      address,
      radius: radius || 100 // Default 100m radius
    };

    // Create geofence for destination
    locationService.createDestinationGeofence(destination, 'dropoff');

    const updatedSession = trackingStore.setDestination(sessionId, destination);

    // Calculate initial ETA
    if (updatedSession) {
      const eta = locationService.calculateETA(
        updatedSession.currentLocation,
        destination
      );
      trackingStore.updateETA(sessionId, eta);
      notificationService.notifyETAUpdate(updatedSession, eta);
      notificationService.notifyRouteUpdate(updatedSession);
    }

    res.json({
      success: true,
      data: updatedSession,
      timestamp: Date.now()
    } as ApiResponse<TrackingSession>);
  } catch (error) {
    console.error('[TrackingRoutes] Error setting destination:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to set destination'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Set route for a tracking session
 * PUT /api/tracking/sessions/:sessionId/route
 */
router.put('/sessions/:sessionId/route', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { coordinates } = req.body;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROUTE',
          message: 'At least 2 waypoints are required'
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    const session = trackingStore.getSession(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Tracking session ${sessionId} not found`
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    // Validate and format coordinates
    const routeCoordinates: [number, number][] = coordinates
      .filter((c: unknown) => {
        const coord = c as { latitude?: number; longitude?: number };
        return (
          coord &&
          typeof coord.latitude === 'number' &&
          typeof coord.longitude === 'number' &&
          locationService.validateCoordinates(coord.latitude, coord.longitude)
        );
      })
      .map((c: { latitude: number; longitude: number }) => [c.longitude, c.latitude]);

    if (routeCoordinates.length < 2) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COORDINATES',
          message: 'At least 2 valid waypoints are required'
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    // Simplify route to reduce noise
    const simplifiedRoute = locationService.simplifyRoute(routeCoordinates, 0.00001);

    const route: RouteGeometry = {
      type: 'LineString',
      coordinates: simplifiedRoute
    };

    const updatedSession = trackingStore.setRoute(sessionId, route);

    // Recalculate ETA if destination is set
    if (updatedSession?.destination) {
      const eta = locationService.calculateETA(
        updatedSession.currentLocation,
        updatedSession.destination
      );
      trackingStore.updateETA(sessionId, eta);
      notificationService.notifyETAUpdate(updatedSession, eta);
    }

    notificationService.notifyRouteUpdate(updatedSession!);

    res.json({
      success: true,
      data: updatedSession,
      timestamp: Date.now()
    } as ApiResponse<TrackingSession>);
  } catch (error) {
    console.error('[TrackingRoutes] Error setting route:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to set route'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Complete a tracking session
 * POST /api/tracking/sessions/:sessionId/complete
 */
router.post('/sessions/:sessionId/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = trackingStore.getSession(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Tracking session ${sessionId} not found`
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    if (session.status !== 'active') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot complete session with status: ${session.status}`
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    // Create historical track before completing
    const historicalTrack = trackingStore.createHistoricalTrack(session);
    const completedSession = trackingStore.completeSession(sessionId);

    // Notify subscribers
    if (completedSession) {
      notificationService.notifySessionCompleted(completedSession);
    }

    res.json({
      success: true,
      data: {
        session: completedSession,
        historicalTrack
      },
      timestamp: Date.now()
    } as ApiResponse);
  } catch (error) {
    console.error('[TrackingRoutes] Error completing session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to complete tracking session'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Cancel a tracking session
 * POST /api/tracking/sessions/:sessionId/cancel
 */
router.post('/sessions/:sessionId/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const session = trackingStore.getSession(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Tracking session ${sessionId} not found`
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    if (session.status !== 'active') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot cancel session with status: ${session.status}`
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    // Create historical track before canceling
    const historicalTrack = trackingStore.createHistoricalTrack(session);
    const cancelledSession = trackingStore.cancelSession(sessionId, reason);

    res.json({
      success: true,
      data: {
        session: cancelledSession,
        historicalTrack,
        reason
      },
      timestamp: Date.now()
    } as ApiResponse);
  } catch (error) {
    console.error('[TrackingRoutes] Error cancelling session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to cancel tracking session'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Get historical track for a session
 * GET /api/tracking/sessions/:sessionId/history
 */
router.get('/sessions/:sessionId/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const historicalTrack = trackingStore.getHistoricalTrack(sessionId);

    if (!historicalTrack) {
      // Try to create from current buffer
      const session = trackingStore.getSession(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: `Tracking session ${sessionId} not found`
          },
          timestamp: Date.now()
        } as ApiResponse);
        return;
      }

      const newTrack = trackingStore.createHistoricalTrack(session);
      res.json({
        success: true,
        data: newTrack,
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: historicalTrack,
      timestamp: Date.now()
    } as ApiResponse);
  } catch (error) {
    console.error('[TrackingRoutes] Error getting history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get historical track'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Get historical tracks for a driver
 * GET /api/tracking/drivers/:driverId/history
 */
router.get('/drivers/:driverId/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));

    let tracks = trackingStore.getHistoricalTracksByDriver(
      driverId,
      startDate ? parseInt(startDate as string, 10) : undefined,
      endDate ? parseInt(endDate as string, 10) : undefined
    );

    // Sort by start time descending
    tracks.sort((a, b) => b.startTime - a.startTime);

    const total = tracks.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedTracks = tracks.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginatedTracks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: startIndex + limitNum < total
      },
      timestamp: Date.now()
    } as PaginatedResponse);
  } catch (error) {
    console.error('[TrackingRoutes] Error getting driver history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get driver history'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Get driver tracking stats
 * GET /api/tracking/drivers/:driverId/stats
 */
router.get('/drivers/:driverId/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;

    const tracks = trackingStore.getHistoricalTracksByDriver(driverId);

    // Calculate stats for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTracks = tracks.filter(t => t.startTime >= todayStart.getTime());

    const totalDistanceToday = todayTracks.reduce((sum, t) => sum + t.totalDistance, 0);
    const totalDeliveriesToday = todayTracks.length;
    const averageDeliveryTime = todayTracks.length > 0
      ? todayTracks.reduce((sum, t) => sum + (t.endTime - t.startTime), 0) / todayTracks.length / 1000
      : 0;

    const stats: TrackingStats = {
      driverId,
      totalDistanceToday,
      totalDeliveriesToday,
      averageDeliveryTime,
      lastUpdate: tracks.length > 0 ? tracks[0].endTime : Date.now()
    };

    res.json({
      success: true,
      data: stats,
      timestamp: Date.now()
    } as ApiResponse<TrackingStats>);
  } catch (error) {
    console.error('[TrackingRoutes] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get driver stats'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Create a geofence
 * POST /api/tracking/geofences
 */
router.post('/geofences', validateCoordinates, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, coordinates, radius } = req.body;

    if (!name || !type || !coordinates) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'name, type, and coordinates are required'
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    const geofence = trackingStore.createGeofence({
      name,
      type,
      coordinates: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      },
      radius: radius || 100,
      active: true
    });

    res.status(201).json({
      success: true,
      data: geofence,
      timestamp: Date.now()
    } as ApiResponse<Geofence>);
  } catch (error) {
    console.error('[TrackingRoutes] Error creating geofence:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create geofence'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Get all geofences
 * GET /api/tracking/geofences
 */
router.get('/geofences', async (req: Request, res: Response): Promise<void> => {
  try {
    const geofences = trackingStore.getAllGeofences();
    res.json({
      success: true,
      data: geofences,
      timestamp: Date.now()
    } as ApiResponse<Geofence[]>);
  } catch (error) {
    console.error('[TrackingRoutes] Error getting geofences:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get geofences'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Get geofence by ID
 * GET /api/tracking/geofences/:geofenceId
 */
router.get('/geofences/:geofenceId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { geofenceId } = req.params;
    const geofence = trackingStore.getGeofence(geofenceId);

    if (!geofence) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Geofence ${geofenceId} not found`
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: geofence,
      timestamp: Date.now()
    } as ApiResponse<Geofence>);
  } catch (error) {
    console.error('[TrackingRoutes] Error getting geofence:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get geofence'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Update geofence
 * PUT /api/tracking/geofences/:geofenceId
 */
router.put('/geofences/:geofenceId', validateCoordinates, async (req: Request, res: Response): Promise<void> => {
  try {
    const { geofenceId } = req.params;
    const updates = req.body;

    const geofence = trackingStore.updateGeofence(geofenceId, updates);

    if (!geofence) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Geofence ${geofenceId} not found`
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: geofence,
      timestamp: Date.now()
    } as ApiResponse<Geofence>);
  } catch (error) {
    console.error('[TrackingRoutes] Error updating geofence:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update geofence'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Delete geofence
 * DELETE /api/tracking/geofences/:geofenceId
 */
router.delete('/geofences/:geofenceId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { geofenceId } = req.params;
    const deleted = trackingStore.deleteGeofence(geofenceId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Geofence ${geofenceId} not found`
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: { deleted: true },
      timestamp: Date.now()
    } as ApiResponse);
  } catch (error) {
    console.error('[TrackingRoutes] Error deleting geofence:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete geofence'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Get all active sessions
 * GET /api/tracking/sessions
 */
router.get('/sessions', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessions = trackingStore.getActiveSessions();
    res.json({
      success: true,
      data: sessions,
      timestamp: Date.now()
    } as ApiResponse<TrackingSession[]>);
  } catch (error) {
    console.error('[TrackingRoutes] Error getting sessions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get active sessions'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Calculate route between waypoints
 * POST /api/tracking/routes/optimize
 */
router.post('/routes/optimize', validateCoordinates, async (req: Request, res: Response): Promise<void> => {
  try {
    const { waypoints } = req.body;

    if (!Array.isArray(waypoints) || waypoints.length < 2) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'At least 2 waypoints are required'
        },
        timestamp: Date.now()
      } as ApiResponse);
      return;
    }

    const coordinates = waypoints.map((w: { latitude: number; longitude: number }) => ({
      latitude: w.latitude,
      longitude: w.longitude
    }));

    const result = locationService.calculateOptimizedRoute(coordinates);

    res.json({
      success: true,
      data: result,
      timestamp: Date.now()
    } as ApiResponse);
  } catch (error) {
    console.error('[TrackingRoutes] Error optimizing route:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to optimize route'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

/**
 * Get service stats
 * GET /api/tracking/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionStats = trackingStore.getSessionCount();
    const connectionStats = notificationService.getStats();

    res.json({
      success: true,
      data: {
        sessions: sessionStats,
        connections: connectionStats
      },
      timestamp: Date.now()
    } as ApiResponse);
  } catch (error) {
    console.error('[TrackingRoutes] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get stats'
      },
      timestamp: Date.now()
    } as ApiResponse);
  }
});

export default router;
