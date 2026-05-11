# Agent Swarm API Reference

## Base URL
```
http://localhost:3005
```

---

## Health Check

### GET /health

Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-27T10:00:00.000Z"
}
```

---

## Swarm Management

### GET /api/swarm/status

Get the status of all agents in the swarm.

**Response**:
```json
{
  "totalAgents": 8,
  "healthy": 7,
  "degraded": 1,
  "failed": 0,
  "agents": [
    {
      "agent": "demand-signal-agent",
      "status": "healthy",
      "lastRun": "2026-04-27T10:00:00.000Z",
      "lastSuccess": "2026-04-27T10:00:00.000Z",
      "consecutiveFailures": 0,
      "avgDurationMs": 45
    }
  ]
}
```

---

### POST /api/swarm/run/:agentName

Run a specific agent on-demand.

**Parameters**:
- `agentName` - Name of the agent to run

**Available Agents**:
- `demand-signal-agent`
- `scarcity-agent`
- `personalization-agent`
- `attribution-agent`
- `adaptive-scoring-agent`
- `feedback-loop-agent`
- `network-effect-agent`
- `revenue-attribution-agent`

**Response**:
```json
{
  "agent": "demand-signal-agent",
  "success": true,
  "durationMs": 45,
  "data": {
    "signalsGenerated": 150,
    "spikes": 3
  },
  "timestamp": "2026-04-27T10:00:00.000Z"
}
```

---

### POST /api/swarm/run-all

Run all agents sequentially.

**Response**:
```json
{
  "results": [
    {
      "agent": "demand-signal-agent",
      "success": true,
      "durationMs": 45
    },
    {
      "agent": "scarcity-agent",
      "success": true,
      "durationMs": 120
    }
  ]
}
```

---

## Memory Operations

### GET /api/memory/stats

Get memory hub statistics.

**Response**:
```json
{
  "keys": 1500,
  "memoryUsage": "~450 KB"
}
```

---

## Demand Signals

### GET /api/demand/:merchantId/:category

Get demand signal for a specific merchant and category.

**Parameters**:
- `merchantId` - Merchant identifier
- `category` - TRAVEL, DINING, RETAIL

**Response**:
```json
{
  "merchantId": "hotel_central",
  "category": "TRAVEL",
  "demandCount": 245,
  "unmetDemandPct": 35,
  "avgPriceExpectation": 150,
  "topCities": ["Mumbai", "Delhi", "Bangalore"],
  "trend": "rising",
  "spikeDetected": true,
  "spikeFactor": 3.2,
  "timestamp": "2026-04-27T10:00:00.000Z"
}
```

---

## Scarcity Signals

### GET /api/scarcity/:merchantId/:category

Get scarcity signal for a merchant.

**Parameters**:
- `merchantId` - Merchant identifier
- `category` - Category

**Response**:
```json
{
  "merchantId": "hotel_central",
  "category": "TRAVEL",
  "supplyCount": 25,
  "demandCount": 150,
  "scarcityScore": 85,
  "urgencyLevel": "high",
  "recommendations": [
    "Consider raising prices to balance demand",
    "Alert merchants to restock",
    "Send urgency nudges to high-intent users"
  ],
  "timestamp": "2026-04-27T10:00:00.000Z"
}
```

---

### GET /api/scarcity/critical

Get all critical scarcity signals.

**Response**:
```json
[
  {
    "merchantId": "hotel_central",
    "category": "TRAVEL",
    "supplyCount": 5,
    "demandCount": 200,
    "scarcityScore": 95,
    "urgencyLevel": "critical",
    "recommendations": [
      "CRITICAL: Notify all interested users immediately",
      "Consider implementing waitlist"
    ],
    "timestamp": "2026-04-27T10:00:00.000Z"
  }
]
```

---

## User Profiles

### GET /api/profiles/:userId

Get personalization profile for a user.

**Parameters**:
- `userId` - User identifier

**Response**:
```json
{
  "userId": "user_123",
  "openRates": {
    "push": 0.85,
    "email": 0.65,
    "sms": 0.45
  },
  "clickRates": {
    "push": 0.35,
    "email": 0.25,
    "sms": 0.15
  },
  "convertRates": {
    "push": 0.12,
    "email": 0.08,
    "sms": 0.05
  },
  "optimalSendTimes": ["09:00", "12:00", "19:00"],
  "preferredChannels": ["push", "email"],
  "tonePreferences": "casual",
  "avgSessionValue": 250,
  "lastUpdated": "2026-04-27T10:00:00.000Z"
}
```

---

## Revenue Reports

### GET /api/revenue/latest

Get the latest revenue report.

**Response**:
```json
{
  "period": {
    "start": "2026-04-26T00:00:00.000Z",
    "end": "2026-04-27T00:00:00.000Z"
  },
  "nudgeInfluencedGMV": 45000,
  "organicGMV": 120000,
  "totalGMV": 165000,
  "nudgeLiftPct": 27.3,
  "roiByChannel": {
    "push": 4.5,
    "email": 3.2,
    "sms": 2.1
  },
  "roiByMerchant": {
    "hotel_central": 5.2,
    "restaurant_xyz": 3.8
  },
  "conversionLift": 15.5,
  "topPerformingNudges": [
    {
      "nudgeId": "nudge_123",
      "revenue": 2500,
      "roi": 6.5
    }
  ],
  "underperformingNudges": [],
  "timestamp": "2026-04-27T10:00:00.000Z"
}
```

---

## Optimization Recommendations

### GET /api/optimizations

Get all optimization recommendations from feedback loop.

**Response**:
```json
[
  {
    "type": "threshold_adjust",
    "agent": "scarcity-agent",
    "currentValue": 70,
    "recommendedValue": 85,
    "confidence": 0.85,
    "reason": "Low scarcity alert accuracy - raising threshold",
    "expectedImpact": 20,
    "timestamp": "2026-04-27T10:00:00.000Z"
  }
]
```

---

## Trending Intents

### GET /api/trending/:category

Get trending intents for a category.

**Parameters**:
- `category` - Category (TRAVEL, DINING, RETAIL, GENERAL)

**Response**:
```json
[
  {
    "intentKey": "hotel_beach_resort",
    "count": 245
  },
  {
    "intentKey": "weekend_getaway",
    "count": 189
  },
  {
    "intentKey": "luxury_stay",
    "count": 156
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid parameters"
}
```

### 404 Not Found
```json
{
  "error": "Signal not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| GET /api/demand/* | 100/min |
| GET /api/scarcity/* | 100/min |
| GET /api/profiles/* | 200/min |
| POST /api/swarm/run/* | 10/min |
| POST /api/swarm/run-all | 2/min |

---

*Last Updated: 2026-04-27*
