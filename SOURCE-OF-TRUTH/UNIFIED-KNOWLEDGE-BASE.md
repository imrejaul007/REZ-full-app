# UNIFIED USER KNOWLEDGE BASE - COMPLETE
**Date:** May 8, 2026

---

# WHAT EXISTS

## REZ Knowledge Service

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-knowledge-service/`
**Port:** 4018

### Purpose
Single source of truth for ALL user data across ALL apps.

### Already Built

| Component | Status |
|-----------|--------|
| User Profile Model | ✅ |
| Preferences (all apps) | ✅ |
| Signal Collection | ✅ |
| History Tracking | ✅ |
| Personalization API | ✅ |
| REZ Mind Integration | ✅ |

---

# UNIFIED USER PROFILE

```typescript
interface UnifiedUserProfile {
  userId: string;
  
  // Basic Info
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  
  // Hotel Preferences (StayOwn)
  hotel: {
    preferredRoomTypes: string[];
    bedPreference: 'single' | 'double' | 'twin' | 'suite';
    floorPreference: 'low' | 'high' | 'any';
    requiredAmenities: string[];
    earlyCheckin: boolean;
    lateCheckout: boolean;
    frequentDestinations: string[];
    tripPurpose: ('business' | 'leisure' | 'medical' | 'wedding')[];
    budgetRange: { min: number; max: number };
  };
  
  // Restaurant Preferences
  restaurant: {
    preferredCuisines: string[];
    dietaryRestrictions: string[];
    deliveryVsDineIn: 'delivery' | 'dine-in' | 'takeaway';
    favoriteRestaurants: string[];
  };
  
  // Rendez Preferences (Couples)
  rendez: {
    couplePreferences: string[];
    dateIdeas: string[];
    specialOccasions: Date[];
    anniversaryDate?: Date;
    partnerName?: string;
  };
  
  // Corpspark Preferences (Corporate)
  corpspark: {
    company: string;
    department: string;
    travelPolicyCompliance: boolean;
    maxBudgetPerBooking: number;
  };
  
  // All History
  history: {
    totalBookings: number;
    totalSpent: number;
    avgRating: number;
    loyaltyTier: string;
    joinedDate: Date;
    lastActive: Date;
  };
  
  // All Signals
  signals: Signal[];
}
```

---

# APPS USING KNOWLEDGE BASE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ UNIFIED KNOWLEDGE BASE (Port 4018) │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ StayOwn │ │ Rendez │ │ Corpspark │ │ Consumer │ │
│ │ (Hotel) │ │ (Couples)│ │ (Corporate)│ │ App │ │
│ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ │
│ │ │ │ │ │ │
│ └──────┴───────────────┴───────────────┴───────────────┘ │
│ │ │
│ ┌──────┴──────────────────────────────────────────────┐ │
│ │ REZ KNOWLEDGE SERVICE │ │
│ │ │ │
│ │ - User Profile │ │
│ │ - Preferences (all apps) │ │
│ │ - Signal Collection │ │
│ │ - History Tracking │ │
│ │ - Personalization │ │
│ └────────────────────────────────────────────────────────┘ │
│ │ │
│ ┌──────┴──────┐ │
│ │ REZ MIND │ │
│ │ (AI Brain) │ │
│ └─────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# SIGNAL TYPES

## Hotel Signals (StayOwn)
| Signal | Description |
|--------|-------------|
| `hotel.search` | User searched hotels |
| `hotel.view` | User viewed hotel |
| `hotel.book` | User booked room |
| `hotel.cancel` | User cancelled booking |
| `hotel.checkin` | User checked in |
| `hotel.checkout` | User checked out |
| `hotel.review` | User submitted review |
| `hotel.service` | User ordered room service |
| `hotel.qr_scan` | User scanned room QR |

## Restaurant Signals
| Signal | Description |
|--------|-------------|
| `restaurant.search` | User searched restaurants |
| `restaurant.order` | User placed order |
| `restaurant.review` | User submitted review |

## Rendez Signals (Couples)
| Signal | Description |
|--------|-------------|
| `rendez.search` | User searched dates |
| `rendez.date` | User booked date |
| `rendez.moment` | User created moment |

## Corporate Signals (Corpspark)
| Signal | Description |
|--------|-------------|
| `corporate.book` | Corporate booking |
| `corporate.approve` | Booking approved |

---

# API ENDPOINTS

## Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/:userId` | Get user profile |
| PUT | `/api/profile/:userId` | Update profile |
| DELETE | `/api/profile/:userId` | Delete profile |

## Preferences
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/preferences/:userId` | Get preferences |
| PUT | `/api/preferences/:userId/:app` | Update app preferences |

## Signals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signals` | Add signal |
| GET | `/api/signals/:userId` | Get user signals |
| GET | `/api/signals/:userId/:type` | Get signals by type |

## History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history/:userId` | Get user history |
| GET | `/api/history/:userId/:app` | Get app history |

## Personalization
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/personalization/:userId` | Get personalized data |

---

# REZ MIND INTEGRATION

The knowledge base is connected to REZ Mind for AI-powered personalization:

```
User Action → Knowledge Service → Signals → REZ Mind → AI Models → Recommendations
                                       ↓
                               User Profile Updated
```

## Data Flow to REZ Mind
1. User searches hotels → Signal stored
2. User books hotel → Signal + Profile updated
3. User scans Room QR → Signal stored
4. User orders room service → Signal stored
5. User gives feedback → Signal + Rating stored

## Data Flow From REZ Mind
1. REZ Mind analyzes signals
2. REZ Mind generates recommendations
3. REZ Mind updates user profile
4. StayOwn displays "For You"

---

# COMPLETE ECOSYSTEM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USER ACTIONS │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ User searches "hotels in Mumbai" │
│ User books "The Grand Mumbai" │
│ User checks in to Room 101 │
│ User orders breakfast via Room QR │
│ User checks out │
│ User gives 5-star review │
│ │
└──────────────────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ UNIFIED KNOWLEDGE BASE (Port 4018) │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ Signals: [
│   { type: 'hotel.search', city: 'Mumbai', timestamp },
│   { type: 'hotel.book', hotelId: 'H001', amount: 5500, timestamp },
│   { type: 'hotel.checkin', roomId: 'R101', timestamp },
│   { type: 'hotel.service', category: 'food', items: ['breakfast'], timestamp },
│   { type: 'hotel.checkout', timestamp },
│   { type: 'hotel.review', rating: 5, timestamp }
│ ] │
│ │
│ Profile: {
│   preferences: {
│     hotel: { preferredCity: 'Mumbai', avgSpend: 5500 }
│   },
│   history: { totalBookings: 1, avgRating: 5 }
│ } │
│ │
└──────────────────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ REZ MIND (Port 4017) │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ Models: [
│   - Dynamic Pricing Engine
│   - Recommendations Engine
│   - Satisfaction Predictor
│   - Demand Forecaster
│ ] │
│ │
│ Outputs: [
│   - "User prefers Mumbai hotels"
│   - "Suggest similar hotels in Mumbai"
│   - "Dynamic price for next booking: ₹5,800"
│   - "High satisfaction predicted: 95%"
│ ] │
│ │
└──────────────────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAYOWN (Port 4015) │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ Shows: [
│   - "For You: Hotels in Mumbai"
│   - "Similar to The Grand Mumbai"
│   - "Today's price: ₹5,800 (dynamic)"
│   - "You might also like: Spa packages"
│ ] │
│ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# FILES STRUCTURE

```
rez-knowledge-service/
├── src/
│   ├── index.ts                    # Main entry
│   ├── types/
│   │   └── index.ts              # Unified types
│   ├── models/
│   │   └── UserProfile.ts         # Mongoose model
│   ├── routes/
│   │   ├── profileRoutes.ts        # Profile endpoints
│   │   ├── preferencesRoutes.ts    # Preferences
│   │   ├── signalRoutes.ts         # Signals
│   │   ├── historyRoutes.ts       # History
│   │   └── personalizationRoutes.ts # Personalization
│   ├── services/
│   │   ├── profileService.ts      # Profile logic
│   │   └── rezMindService.ts       # REZ Mind connection
│   ├── middleware/
│   │   ├── serviceAuth.ts          # Service authentication
│   │   └── errorHandler.ts         # Error handling
│   ├── config/
│   │   └── index.ts               # Configuration
│   └── utils/
│       ├── database.ts             # MongoDB connection
│       └── logger.ts              # Logging

rez-mind-hotel-service/
├── src/
│   └── services/
│       ├── signal-collector.ts     # Collect hotel signals
│       ├── signal-store.ts         # Store signals
│       ├── user-knowledge.service.ts # Connect to knowledge base
│       ├── dynamic-pricing-engine.ts # AI pricing
│       ├── recommendations-engine.ts # AI recommendations
│       └── event-calendar.service.ts # Local events

rez-stayown-service/
├── src/
│   └── services/
│       ├── rez-mind-client.ts      # Client to REZ Mind
│       └── rez-mind-integration.ts  # Integration layer
```

---

# SUMMARY

## Knowledge Base Status
| Component | Status |
|-----------|--------|
| User Profile Model | ✅ Built |
| Hotel Preferences | ✅ Built |
| Restaurant Preferences | ✅ Built |
| Rendez Preferences | ✅ Built |
| Corpspark Preferences | ✅ Built |
| Signal Collection | ✅ Built |
| REZ Mind Connection | ✅ Built |
| All App Integration | ✅ Built |

## Connected Apps
| App | Connection |
|-----|------------|
| StayOwn | ✅ Connected |
| Rendez | ✅ Connected |
| Corpspark | ✅ Connected |
| Consumer App | ✅ Connected |
| REZ Mind | ✅ Connected |

## Data Flow
```
User Action → App → Knowledge Service → REZ Mind → AI → Recommendations → App
```

---

**Unified Knowledge Base is the single source of truth for ALL user data across ALL apps!**</parameter>
