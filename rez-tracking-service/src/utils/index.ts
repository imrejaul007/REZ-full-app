import { Coordinates, GeoPoint } from '../types';

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (minutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${minutes} min`;
}

/**
 * Format ETA timestamp to readable string
 */
export function formatETA(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  // If same day, show time only
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // If tomorrow, show "Tomorrow at HH:MM"
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  }

  // Otherwise, show full date and time
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format coordinates as string
 */
export function formatCoordinates(coord: Coordinates, precision: number = 6): string {
  return `${coord.latitude.toFixed(precision)}, ${coord.longitude.toFixed(precision)}`;
}

/**
 * Format speed for display
 */
export function formatSpeed(metersPerSecond: number): string {
  const kmh = metersPerSecond * 3.6;
  if (kmh < 1) {
    const mph = metersPerSecond * 2.237;
    return `${mph.toFixed(1)} mph`;
  }
  return `${kmh.toFixed(1)} km/h`;
}

/**
 * Calculate bearing direction as compass point
 */
export function bearingToCompass(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((bearing % 360) + 360) / 45) % 8;
  return directions[index];
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Calculate centroid of multiple coordinates
 */
export function calculateCentroid(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate centroid of empty array');
  }

  let sumLat = 0;
  let sumLon = 0;

  for (const coord of coordinates) {
    sumLat += coord.latitude;
    sumLon += coord.longitude;
  }

  return {
    latitude: sumLat / coordinates.length,
    longitude: sumLon / coordinates.length
  };
}

/**
 * Calculate bounding box for coordinates
 */
export function calculateBoundingBox(
  coordinates: Coordinates[]
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate bounding box of empty array');
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const coord of coordinates) {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLon = Math.min(minLon, coord.longitude);
    maxLon = Math.max(maxLon, coord.longitude);
  }

  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Check if timestamp is recent (within given milliseconds)
 */
export function isRecent(timestamp: number, withinMs: number = 60000): boolean {
  return Date.now() - timestamp <= withinMs;
}

/**
 * Get time ago string
 */
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Normalize coordinates to valid range
 */
export function normalizeCoordinates(coord: Coordinates): Coordinates {
  return {
    latitude: clamp(coord.latitude, -90, 90),
    longitude: ((coord.longitude % 360) + 540) % 360 - 180
  };
}

/**
 * Merge GeoPoint arrays, removing duplicates based on timestamp
 */
export function mergeLocationHistory(
  existing: GeoPoint[],
  newPoints: GeoPoint[]
): GeoPoint[] {
  const allPoints = [...existing, ...newPoints];

  // Sort by timestamp
  allPoints.sort((a, b) => a.timestamp - b.timestamp);

  // Remove duplicates (same timestamp)
  const unique: GeoPoint[] = [];
  let lastTimestamp = 0;

  for (const point of allPoints) {
    if (point.timestamp !== lastTimestamp) {
      unique.push(point);
      lastTimestamp = point.timestamp;
    }
  }

  return unique;
}

/**
 * Calculate the Haversine distance between two points
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate GeoJSON feature collection from tracking session
 */
export function toGeoJSON(
  coordinates: Coordinates[],
  properties: Record<string, unknown> = {}
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: coordinates.map((coord, index) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [coord.longitude, coord.latitude]
      },
      properties: {
        ...properties,
        index,
        ...('timestamp' in coord ? { timestamp: (coord as GeoPoint).timestamp } : {})
      }
    }))
  };
}
