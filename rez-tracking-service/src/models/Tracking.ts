import { v4 as uuidv4 } from 'uuid';
import {
  TrackingSession,
  GeoPoint,
  TrackingStatus,
  Geofence,
  GeofenceAlert,
  HistoricalTrack,
  RouteGeometry,
  Destination,
  ETACalculation,
  Coordinates
} from '../types';

/**
 * In-memory storage for tracking data
 * In production, replace with Redis or database
 */
class TrackingStore {
  private sessions: Map<string, TrackingSession> = new Map();
  private driverSessions: Map<string, string[]> = new Map(); // driverId -> sessionIds
  private geofences: Map<string, Geofence> = new Map();
  private historicalTracks: Map<string, HistoricalTrack> = new Map();
  private locationBuffer: Map<string, GeoPoint[]> = new Map();

  // Session management
  createSession(driverId: string, deliveryId?: string): TrackingSession {
    const sessionId = uuidv4();
    const now = Date.now();

    const session: TrackingSession = {
      id: sessionId,
      driverId,
      deliveryId,
      status: 'active',
      currentLocation: {
        latitude: 0,
        longitude: 0,
        timestamp: now
      },
      geofences: [],
      createdAt: now,
      updatedAt: now,
      startedAt: now
    };

    this.sessions.set(sessionId, session);

    // Track driver's sessions
    const driverSessionIds = this.driverSessions.get(driverId) || [];
    driverSessionIds.push(sessionId);
    this.driverSessions.set(driverId, driverSessionIds);

    return session;
  }

  getSession(sessionId: string): TrackingSession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionByDriver(driverId: string, status?: TrackingStatus): TrackingSession | undefined {
    const sessionIds = this.driverSessions.get(driverId) || [];
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);
      if (session && (!status || session.status === status)) {
        return session;
      }
    }
    return undefined;
  }

  getActiveSessionForDriver(driverId: string): TrackingSession | undefined {
    return this.getSessionByDriver(driverId, 'active');
  }

  updateSession(sessionId: string, updates: Partial<TrackingSession>): TrackingSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const updatedSession: TrackingSession = {
      ...session,
      ...updates,
      updatedAt: Date.now()
    };

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  updateLocation(sessionId: string, location: GeoPoint): TrackingSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    // Add to location buffer for historical tracking
    this.addToLocationBuffer(sessionId, location);

    // Update session
    const updatedSession: TrackingSession = {
      ...session,
      currentLocation: location,
      updatedAt: Date.now()
    };

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  completeSession(sessionId: string): TrackingSession | undefined {
    return this.updateSession(sessionId, {
      status: 'completed',
      completedAt: Date.now()
    });
  }

  cancelSession(sessionId: string, reason?: string): TrackingSession | undefined {
    return this.updateSession(sessionId, {
      status: 'cancelled',
      completedAt: Date.now()
    });
  }

  // Route management
  setRoute(sessionId: string, route: RouteGeometry): TrackingSession | undefined {
    return this.updateSession(sessionId, { route });
  }

  setDestination(sessionId: string, destination: Destination): TrackingSession | undefined {
    return this.updateSession(sessionId, { destination });
  }

  updateETA(sessionId: string, eta: ETACalculation): TrackingSession | undefined {
    return this.updateSession(sessionId, { eta });
  }

  // Geofence management
  createGeofence(geofence: Omit<Geofence, 'id' | 'createdAt'>): Geofence {
    const id = uuidv4();
    const newGeofence: Geofence = {
      ...geofence,
      id,
      createdAt: Date.now()
    };
    this.geofences.set(id, newGeofence);
    return newGeofence;
  }

  getGeofence(id: string): Geofence | undefined {
    return this.geofences.get(id);
  }

  getAllGeofences(): Geofence[] {
    return Array.from(this.geofences.values()).filter(g => g.active);
  }

  getGeofencesNear(coordinates: Coordinates, radiusKm: number): Geofence[] {
    const radiusMeters = radiusKm * 1000;
    return this.getAllGeofences().filter(geofence => {
      const distance = this.calculateDistance(coordinates, geofence.coordinates);
      return distance <= radiusMeters;
    });
  }

  updateGeofence(id: string, updates: Partial<Geofence>): Geofence | undefined {
    const geofence = this.geofences.get(id);
    if (!geofence) return undefined;

    const updated: Geofence = { ...geofence, ...updates };
    this.geofences.set(id, updated);
    return updated;
  }

  deleteGeofence(id: string): boolean {
    return this.geofences.delete(id);
  }

  // Geofence alerts
  addGeofenceAlert(sessionId: string, alert: GeofenceAlert): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.geofences.push(alert);
      this.sessions.set(sessionId, session);
    }
  }

  getGeofenceAlerts(sessionId: string): GeofenceAlert[] {
    const session = this.sessions.get(sessionId);
    return session?.geofences || [];
  }

  // Location buffer for historical tracking
  addToLocationBuffer(sessionId: string, point: GeoPoint): void {
    const buffer = this.locationBuffer.get(sessionId) || [];
    buffer.push(point);
    // Keep only last 1000 points in memory
    if (buffer.length > 1000) {
      buffer.shift();
    }
    this.locationBuffer.set(sessionId, buffer);
  }

  getLocationBuffer(sessionId: string): GeoPoint[] {
    return this.locationBuffer.get(sessionId) || [];
  }

  // Historical tracking
  createHistoricalTrack(session: TrackingSession): HistoricalTrack {
    const points = this.getLocationBuffer(session.id);

    let totalDistance = 0;
    let maxSpeed = 0;

    for (let i = 1; i < points.length; i++) {
      const distance = this.calculateDistance(
        points[i - 1] as unknown as Coordinates,
        points[i] as unknown as Coordinates
      );
      totalDistance += distance;

      if (points[i].speed && points[i].speed > maxSpeed) {
        maxSpeed = points[i].speed;
      }
    }

    const duration = points.length > 1
      ? (points[points.length - 1].timestamp - points[0].timestamp) / 1000
      : 0;

    const averageSpeed = duration > 0 ? totalDistance / duration : 0;

    const track: HistoricalTrack = {
      sessionId: session.id,
      driverId: session.driverId,
      points,
      startTime: points[0]?.timestamp || Date.now(),
      endTime: points[points.length - 1]?.timestamp || Date.now(),
      totalDistance,
      averageSpeed,
      maxSpeed
    };

    this.historicalTracks.set(session.id, track);
    return track;
  }

  getHistoricalTrack(sessionId: string): HistoricalTrack | undefined {
    return this.historicalTracks.get(sessionId);
  }

  getHistoricalTracksByDriver(driverId: string, startDate?: number, endDate?: number): HistoricalTrack[] {
    return Array.from(this.historicalTracks.values()).filter(track => {
      if (track.driverId !== driverId) return false;
      if (startDate && track.startTime < startDate) return false;
      if (endDate && track.endTime > endDate) return false;
      return true;
    });
  }

  // Utility: Calculate distance between two coordinates using Haversine formula
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371000; // Earth's radius in meters
    const lat1 = this.toRadians(coord1.latitude);
    const lat2 = this.toRadians(coord2.latitude);
    const deltaLat = this.toRadians(coord2.latitude - coord1.latitude);
    const deltaLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Cleanup old data (call periodically)
  cleanup(oldThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - oldThanMs;

    for (const [sessionId, session] of this.sessions) {
      if (session.updatedAt < cutoff && session.status !== 'active') {
        this.sessions.delete(sessionId);
        this.locationBuffer.delete(sessionId);
      }
    }

    for (const [trackId, track] of this.historicalTracks) {
      if (track.endTime < cutoff) {
        this.historicalTracks.delete(trackId);
      }
    }
  }

  // Get all active sessions
  getActiveSessions(): TrackingSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active');
  }

  // Get session count
  getSessionCount(): { active: number; completed: number; total: number } {
    let active = 0;
    let completed = 0;

    for (const session of this.sessions.values()) {
      if (session.status === 'active') active++;
      if (session.status === 'completed') completed++;
    }

    return { active, completed, total: this.sessions.size };
  }
}

// Singleton instance
export const trackingStore = new TrackingStore();

// Export a factory function for dependency injection
export function createTrackingStore(): TrackingStore {
  return new TrackingStore();
}
