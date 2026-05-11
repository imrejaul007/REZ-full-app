// Core types for the tracking service

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoPoint extends Coordinates {
  timestamp: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface TrackingSession {
  id: string;
  driverId: string;
  deliveryId?: string;
  status: TrackingStatus;
  currentLocation: GeoPoint;
  route?: RouteGeometry;
  destination?: Destination;
  eta?: ETACalculation;
  geofences: GeofenceAlert[];
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
}

export type TrackingStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'out_of_range';

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface Destination {
  coordinates: Coordinates;
  address?: string;
  radius: number; // meters
  estimatedArrival?: number;
}

export interface ETACalculation {
  estimatedArrival: number;
  distanceRemaining: number; // meters
  durationRemaining: number; // seconds
  trafficCondition: 'low' | 'moderate' | 'high' | 'severe';
  lastCalculated: number;
}

export interface Geofence {
  id: string;
  name: string;
  type: GeofenceType;
  coordinates: Coordinates;
  radius: number;
  active: boolean;
  createdAt: number;
}

export type GeofenceType = 'pickup' | 'dropoff' | 'waypoint' | 'restricted' | 'custom';

export interface GeofenceAlert {
  geofenceId: string;
  geofenceName: string;
  type: 'enter' | 'exit';
  triggeredAt: number;
  location: GeoPoint;
}

export interface HistoricalTrack {
  sessionId: string;
  driverId: string;
  points: GeoPoint[];
  startTime: number;
  endTime: number;
  totalDistance: number; // meters
  averageSpeed: number; // m/s
  maxSpeed: number; // m/s
}

export interface LocationUpdate {
  driverId: string;
  deliveryId?: string;
  location: GeoPoint;
  batteryLevel?: number;
  isMoving: boolean;
}

export interface TrackingStats {
  driverId: string;
  totalDistanceToday: number;
  totalDeliveriesToday: number;
  averageDeliveryTime: number;
  lastUpdate: number;
}

// WebSocket event types
export interface WSClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'location_update' | 'status_change';
  payload: unknown;
}

export interface WSServerMessage {
  type: 'location_update' | 'geofence_alert' | 'eta_update' | 'route_update' | 'error';
  payload: unknown;
  timestamp: number;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
