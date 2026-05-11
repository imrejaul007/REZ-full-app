# Karma API Documentation

## Overview

The Karma API enables users to earn karma points through social impact activities like volunteering, community service, and environmental initiatives. Karma points can be converted to REZ Coins for rewards. All endpoints are prefixed with `/karma`.

## Base URL

```
/api/karma
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### User Profile

#### GET /user/:userId

Get user's karma profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "lifetimeKarma": 2500,
    "activeKarma": 1800,
    "level": "L2",
    "conversionRate": 0.8,
    "eventsCompleted": 15,
    "totalHours": 48,
    "trustScore": 0.95,
    "badges": [
      {
        "id": "badge_1",
        "name": "First Volunteer",
        "icon": "volunteer-badge",
        "earnedAt": "2026-01-15T10:00:00Z"
      }
    ],
    "nextLevelAt": 5000,
    "decayWarning": null
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| userId | string | User identifier |
| lifetimeKarma | number | Total karma earned all time |
| activeKarma | number | Karma available for conversion |
| level | string | Current level (L1/L2/L3/L4) |
| conversionRate | number | Rate at which karma converts to coins (0-1) |
| eventsCompleted | number | Total events participated |
| totalHours | number | Total volunteer hours |
| trustScore | number | Trust score (0-1) |
| badges | Badge[] | Earned badges |
| nextLevelAt | number | Karma needed for next level |
| decayWarning | string/null | Warning if karma is about to decay |

---

#### GET /user/:userId/level

Get karma level information.

**Response:**
```json
{
  "success": true,
  "data": {
    "level": "L2",
    "activeKarma": 1800,
    "threshold": 1000,
    "nextLevelAt": 5000,
    "conversionRate": 0.8,
    "progressPercent": 64
  }
}
```

---

### Events

#### GET /events

Get list of available karma events.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| city | string | Filter by city |
| status | string | Filter by status |
| lat | number | Latitude for nearby events |
| lng | number | Longitude for nearby events |
| radius | number | Search radius in km |
| page | number | Page number |
| limit | number | Results per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "_id": "event_123",
        "name": "Beach Cleanup Drive",
        "description": "Join us for a community beach cleanup",
        "category": "environment",
        "status": "published",
        "image": "https://example.com/beach.jpg",
        "date": "2026-06-15",
        "time": {
          "start": "07:00",
          "end": "11:00"
        },
        "location": {
          "address": "Marina Beach, Chennai",
          "city": "Chennai",
          "coordinates": { "lat": 13.0827, "lng": 80.2707 }
        },
        "organizer": {
          "name": "Green Earth NGO",
          "logo": "https://example.com/logo.png",
          "ngoId": "ngo_123"
        },
        "baseKarmaPerHour": 50,
        "maxKarmaPerEvent": 200,
        "expectedDurationHours": 4,
        "impactUnit": "kg plastic collected",
        "impactMultiplier": 1.5,
        "difficulty": "easy",
        "capacity": { "goal": 100, "enrolled": 45 },
        "maxVolunteers": 100,
        "confirmedVolunteers": 40,
        "verificationMode": "gps",
        "gpsRadius": 100,
        "isJoined": false
      }
    ],
    "total": 25
  }
}
```

---

#### GET /event/:eventId

Get single event details.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "event_123",
    "name": "Beach Cleanup Drive",
    "description": "Join us for a community beach cleanup",
    "category": "environment",
    "status": "published",
    "image": "https://example.com/beach.jpg",
    "date": "2026-06-15",
    "time": { "start": "07:00", "end": "11:00" },
    "location": {
      "address": "Marina Beach, Chennai",
      "city": "Chennai",
      "coordinates": { "lat": 13.0827, "lng": 80.2707 }
    },
    "organizer": {
      "name": "Green Earth NGO",
      "logo": "https://example.com/logo.png"
    },
    "baseKarmaPerHour": 50,
    "maxKarmaPerEvent": 200,
    "expectedDurationHours": 4,
    "difficulty": "easy",
    "maxVolunteers": 100,
    "confirmedVolunteers": 40,
    "verificationMode": "gps",
    "gpsRadius": 100,
    "qrCodes": {
      "checkIn": "qr_checkin_123",
      "checkOut": "qr_checkout_456"
    }
  }
}
```

---

#### POST /event/join

Join an event.

**Request:**
```json
{
  "eventId": "event_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "booking_789",
    "eventId": "event_123",
    "bookingReference": "KARMA-ABC123",
    "status": "confirmed",
    "qrCheckedIn": false,
    "qrCheckedOut": false,
    "ngoApproved": false,
    "confidenceScore": 0,
    "verificationStatus": "pending",
    "karmaEarned": 0,
    "createdAt": "2026-05-08T10:00:00Z"
  }
}
```

---

#### DELETE /event/:eventId/leave

Leave/cancel event booking.

**Response:**
```json
{
  "success": true,
  "data": null
}
```

---

### Check-in / Check-out

#### POST /verify/checkin

Check in to an event.

**Request:**
```json
{
  "userId": "user_123",
  "eventId": "event_123",
  "mode": "gps",
  "gpsCoords": {
    "lat": 13.0827,
    "lng": 80.2707
  }
}
```

Or for QR mode:
```json
{
  "userId": "user_123",
  "eventId": "event_123",
  "mode": "qr",
  "qrCode": "qr_checkin_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "booking": {
      "_id": "booking_789",
      "eventId": "event_123",
      "status": "checked_in",
      "qrCheckedIn": true,
      "qrCheckedInAt": "2026-06-15T07:05:00Z",
      "confidenceScore": 0.95
    },
    "confidenceScore": 0.95,
    "message": "Check-in successful! Keep up the great work.",
    "karmaEarned": 0
  }
}
```

---

#### POST /verify/checkout

Check out from an event.

**Request:**
```json
{
  "userId": "user_123",
  "eventId": "event_123",
  "mode": "gps",
  "gpsCoords": {
    "lat": 13.0827,
    "lng": 80.2707
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "booking": {
      "_id": "booking_789",
      "eventId": "event_123",
      "status": "completed",
      "qrCheckedOut": true,
      "qrCheckedOutAt": "2026-06-15T11:10:00Z",
      "ngoApproved": true,
      "confidenceScore": 0.92
    },
    "confidenceScore": 0.92,
    "message": "Check-out recorded! Your karma is being processed.",
    "karmaEarned": 200,
    "pendingApproval": false
  }
}
```

---

### History & Wallet

#### GET /user/:userId/history

Get karma earn history.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Results per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "_id": "record_123",
        "eventId": "event_123",
        "eventName": "Beach Cleanup Drive",
        "karmaEarned": 200,
        "activeLevelAtApproval": "L2",
        "conversionRateSnapshot": 0.8,
        "status": "CONVERTED",
        "verificationSignals": {
          "qr_in": true,
          "qr_out": true,
          "gps_match": 0.95,
          "ngo_approved": true,
          "photo_proof": false
        },
        "confidenceScore": 0.95,
        "createdAt": "2026-06-15T07:05:00Z",
        "approvedAt": "2026-06-15T12:00:00Z",
        "convertedAt": "2026-06-15T12:00:00Z",
        "rezCoinsEarned": 160
      }
    ],
    "total": 50,
    "page": 1,
    "pages": 5
  }
}
```

---

#### GET /wallet/balance

Get wallet balance for karma points and REZ coins.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| coinType | string | Filter by type: karma_points/rez_coins/all |

**Response:**
```json
{
  "success": true,
  "data": {
    "karmaPoints": 1800,
    "rezCoins": 1440,
    "brandedCoins": {
      "eco_coins": 50,
      "health_points": 100
    }
  }
}
```

---

#### GET /wallet/transactions

Get transaction history for karma/coins.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| coinType | string | Filter: karma_points/rez_coins/branded_coin/all |
| page | number | Page number |

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "txn_123",
        "type": "converted",
        "coinType": "rez_coins",
        "amount": 160,
        "description": "Converted from karma points",
        "eventId": "event_123",
        "batchId": "batch_456",
        "createdAt": "2026-06-15T12:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pages": 10
  }
}
```

---

#### GET /my-bookings

Get user's joined events (bookings).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter: upcoming/ongoing/past |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "booking_789",
      "eventId": "event_123",
      "bookingReference": "KARMA-ABC123",
      "status": "confirmed",
      "event": {
        "_id": "event_123",
        "name": "Beach Cleanup Drive",
        "date": "2026-06-15",
        "time": { "start": "07:00", "end": "11:00" },
        "location": { "address": "Marina Beach" }
      }
    }
  ]
}
```

---

#### GET /booking/:eventId

Get active booking for a specific event.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "booking_789",
    "eventId": "event_123",
    "bookingReference": "KARMA-ABC123",
    "status": "confirmed",
    "qrCheckedIn": false,
    "qrCheckedOut": false
  }
}
```

---

### Missions & Badges

#### GET /missions

Get active missions with progress.

**Response:**
```json
{
  "success": true,
  "data": {
    "missions": [
      {
        "id": "mission_1",
        "type": "ongoing",
        "name": "First Steps",
        "description": "Complete your first volunteer event",
        "requirement": 1,
        "progress": 0,
        "isComplete": false,
        "reward": {
          "karmaBonus": 100,
          "badgeId": "badge_first_volunteer"
        }
      }
    ]
  }
}
```

---

#### GET /badges

Get all earned badges.

**Response:**
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "id": "badge_1",
        "name": "First Volunteer",
        "icon": "volunteer-badge",
        "earnedAt": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### Micro-Actions

#### GET /micro-actions

Get available micro-actions.

**Response:**
```json
{
  "success": true,
  "data": {
    "available": [
      {
        "id": "micro_1",
        "key": "daily_share",
        "name": "Share Impact",
        "description": "Share your impact on social media",
        "karmaBonus": 10,
        "icon": "share",
        "category": "daily",
        "isAvailable": true,
        "isLocked": false
      }
    ],
    "completed": [
      {
        "id": "micro_done_1",
        "actionKey": "daily_share",
        "completedAt": "2026-05-07T14:00:00Z",
        "karmaEarned": 10
      }
    ],
    "earnedToday": 20,
    "totalAvailable": 5,
    "totalCompleted": 12
  }
}
```

---

#### POST /micro-actions/claim

Claim/complete a micro-action.

**Request:**
```json
{
  "actionKey": "daily_share"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "karmaEarned": 10,
    "totalEarnedToday": 20,
    "newBadge": null
  }
}
```

---

### Leaderboard

#### GET /leaderboard

Get karma leaderboard.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| scope | string | global/city/cause |
| period | string | all-time/monthly/weekly |
| limit | number | Number of entries (default: 50) |
| offset | number | Offset for pagination |

**Response:**
```json
{
  "success": true,
  "data": {
    "scope": "global",
    "period": "monthly",
    "entries": [
      {
        "rank": 1,
        "userId": "user_456",
        "displayName": "Jane Doe",
        "avatar": "https://example.com/avatar.jpg",
        "karmaScore": 2500,
        "level": "L3",
        "activeKarma": 2000,
        "eventsCompleted": 25,
        "percentile": 95
      }
    ],
    "userRank": 150,
    "totalParticipants": 10000,
    "updatedAt": "2026-05-08T10:00:00Z"
  }
}
```

---

#### GET /leaderboard/my-rank

Get authenticated user's rank.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| scope | string | global/city/cause |
| period | string | all-time/monthly/weekly |

**Response:**
```json
{
  "success": true,
  "data": {
    "rank": 150,
    "totalParticipants": 10000,
    "percentile": 85
  }
}
```

---

### Communities

#### GET /communities

Get all communities.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "community_123",
      "name": "Green Earth Warriors",
      "slug": "green-earth-warriors",
      "description": "Environmental enthusiasts committed to making a difference",
      "category": "environment",
      "coverImage": "https://example.com/cover.jpg",
      "icon": "leaf",
      "followerCount": 5000,
      "isFollowing": true,
      "stats": {
        "eventsHosted": 45,
        "totalVolunteers": 1200,
        "totalHours": 5000
      }
    }
  ]
}
```

---

#### GET /communities/:slug

Get community by slug.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "community_123",
    "name": "Green Earth Warriors",
    "slug": "green-earth-warriors",
    "description": "Environmental enthusiasts...",
    "category": "environment",
    "coverImage": "https://example.com/cover.jpg",
    "icon": "leaf",
    "followerCount": 5000,
    "isFollowing": true
  }
}
```

---

#### GET /communities/:slug/feed

Get community feed/posts.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Results per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "_id": "post_123",
        "communityId": "community_123",
        "authorId": "user_456",
        "authorType": "volunteer",
        "content": "Great event today!",
        "mediaUrls": ["https://example.com/photo.jpg"],
        "karmaEarned": 10,
        "likeCount": 25,
        "commentCount": 5,
        "tags": ["beachcleanup", "chennai"],
        "isPinned": false,
        "createdAt": "2026-06-15T12:00:00Z"
      }
    ],
    "page": 1,
    "limit": 20
  }
}
```

---

#### POST /communities/:slug/follow

Follow a community.

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

---

#### DELETE /communities/:slug/follow

Unfollow a community.

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

---

#### POST /communities/:slug/posts

Create a new post in a community.

**Request:**
```json
{
  "content": "Sharing my experience from today's beach cleanup!",
  "mediaUrls": ["https://example.com/photo.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "post_456",
    "communityId": "community_123",
    "authorId": "user_123",
    "authorType": "volunteer",
    "content": "Sharing my experience...",
    "mediaUrls": ["https://example.com/photo.jpg"],
    "karmaEarned": 0,
    "likeCount": 0,
    "commentCount": 0,
    "createdAt": "2026-06-15T14:00:00Z"
  }
}
```

---

#### GET /communities/recommended

Get recommended communities for the user.

---

#### GET /communities/my

Get communities the user is following.

---

### Impact Report

#### GET /report

Download user's Impact Report as PDF.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| name | string | User's name for the report |

**Response:** Binary PDF file

---

## Types

### KarmaProfile
```typescript
interface KarmaProfile {
  userId: string;
  lifetimeKarma: number;
  activeKarma: number;
  level: 'L1' | 'L2' | 'L3' | 'L4';
  conversionRate: number;
  eventsCompleted: number;
  totalHours: number;
  trustScore: number;
  badges: KarmaBadge[];
  nextLevelAt: number;
  decayWarning: string | null;
}
```

### KarmaEvent
```typescript
interface KarmaEvent {
  _id: string;
  name: string;
  description: string;
  category: 'environment' | 'food' | 'health' | 'education' | 'community';
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  image?: string;
  date: string;
  time?: { start: string; end: string };
  location: {
    address: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  organizer: { name: string; logo?: string; ngoId?: string };
  baseKarmaPerHour: number;
  maxKarmaPerEvent: number;
  expectedDurationHours: number;
  difficulty: 'easy' | 'medium' | 'hard';
  maxVolunteers: number;
  confirmedVolunteers: number;
  verificationMode: 'qr' | 'gps' | 'manual';
  gpsRadius?: number;
}
```

### Booking
```typescript
interface Booking {
  _id: string;
  eventId: string;
  bookingReference: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
  qrCheckedIn: boolean;
  qrCheckedInAt?: string;
  qrCheckedOut: boolean;
  qrCheckedOutAt?: string;
  ngoApproved: boolean;
  confidenceScore: number;
  verificationStatus: 'pending' | 'partial' | 'verified' | 'rejected';
  karmaEarned: number;
}
```

### Community
```typescript
interface Community {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: 'environment' | 'food' | 'health' | 'education' | 'community';
  coverImage: string;
  icon: string;
  followerCount: number;
  isFollowing: boolean;
  stats: { eventsHosted: number; totalVolunteers: number; totalHours: number };
}
```

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Event not accessible |
| 404 | Not Found - Event/resource not found |
| 409 | Conflict - Already joined event |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Profile/History**: 100 requests/minute
- **Event Operations**: 30 requests/minute
- **Check-in/Check-out**: 10 requests/minute
- **Micro-actions**: 60 requests/minute

---

## Caching

| Endpoint | Cache Duration |
|----------|----------------|
| /events | 5 minutes |
| /event/:id | 10 minutes |
| /communities | 15 minutes |
| /leaderboard | 5 minutes |
| /user/:id/profile | 2 minutes |

---

## Conversion Rules

- Karma points convert to REZ Coins at the user's conversion rate
- Conversion rate varies by level:
  - L1: 0.5 (50%)
  - L2: 0.8 (80%)
  - L3: 0.9 (90%)
  - L4: 1.0 (100%)
- Karma decays at 10% per year if inactive
- Karma must be converted within 365 days

---

## Versioning

Current version: v1

All endpoints are versioned under `/api/v1/karma`.
