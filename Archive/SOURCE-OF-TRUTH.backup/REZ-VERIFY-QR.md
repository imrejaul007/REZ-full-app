# REZ VERIFY QR - Product Authentication

**Service:** `verify-service`
**URL:** `verify.rez.money/s/{serial}`
**Last Updated:** 2026-05-05

---

## WHAT IS REZ VERIFY QR?

REZ Verify QR is a **product authentication platform** that enables consumers to verify product authenticity, trace supply chains, and report counterfeits using QR codes.

---

## PURPOSE

When consumers buy products with Verify QR codes, they can:

- **Verify authenticity** - Confirm product is genuine
- **Trace supply chain** - See product journey from manufacturer
- **Report counterfeits** - Flag suspicious products
- **Build brand trust** - Connect with authentic brands

---

## HOW IT WORKS

```
Consumer buys product
(with Verify QR on packaging)
        │
        ▼
┌─────────────────┐
│ Scan Verify QR  │
│ (verify.rez)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify Auth     │
│ Serial Number   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Show Result     │
│ Authentic/Fake  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Authentic│ │Counterfeit│
│Show Story│ │Report It │
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Supply │ │Fraud  │
│Chain  │ │Alert  │
└───────┘ └───────┘
```

---

## VERIFICATION LAYERS

| Layer | Description |
|-------|-------------|
| **Serial Number** | Cryptographic validation |
| **HMAC Signature** | Tamper-proof |
| **Supply Chain** | Manufacturer → Distributor → Retailer |
| **Hologram** | Physical anti-counterfeit |
| **NFC** | Embedded chip (optional) |

---

## FEATURES

| Feature | Description |
|---------|-------------|
| Serial Validation | Cryptographic verification |
| Supply Chain Tracking | End-to-end journey |
| Brand Storytelling | Product origin, journey |
| Hologram Matching | Multi-layer verification |
| NFC Support | NFC chip reading |
| Report Counterfeit | Consumer reports |
| Recall Alerts | Real-time notifications |
| Batch Verification | Multi-item scanning |
| Offline Verification | Works without internet |

---

## ATTRIBUTION WEIGHTS

| Event | Weight |
|-------|--------|
| Verification completed | 0.25 |
| Story viewed | 0.15 |
| Supply chain viewed | 0.20 |
| Report submitted | 0.30 |
| Brand followed | 0.40 |

---

## CONFIDENCE SCORING

### Signal Weights

| Signal | Weight | Description |
|--------|--------|-------------|
| `serial_valid` | 0.40 | Serial number verified |
| `hmac_valid` | 0.35 | Signature valid |
| `supply_chain` | 0.15 | Supply chain traced |
| `hologram_match` | 0.10 | Hologram verified |

### Score Formula

```
score = (serial_valid × 0.40) + (hmac_valid × 0.35) + (supply_chain × 0.15) + (hologram_match × 0.10)
```

### Approval Thresholds

| Score | Status | Action |
|-------|--------|--------|
| ≥ 0.60 | **verified** | Auto-approve, create EarnRecord |
| 0.40–0.59 | **partial** | Flag for NGO review |
| < 0.40 | **rejected** | Notify user, no karma |

---

## QR CODE FORMAT

### Payload Structure

```typescript
interface QRPayload {
  eventId: string;     // Event identifier
  type: 'check_in' | 'check_out';  // QR type
  ts: number;          // Timestamp (ms)
  sig: string;         // HMAC-SHA256 signature
}
```

### QR Generation

```typescript
// Generate signature
const sig = hmacSha256(`${eventId}:${type}:${ts}`, QR_SECRET).substring(0, 16);

// Create payload
const payload = base64(JSON.stringify({
  eventId,
  type,
  ts: Date.now(),
  sig
}));

// QR contains: payload
```

### Example QR Data

```
eyJldmVudElkIjoiZXZlbnRfMTIzIiwidHlwZSI6ImNoZWNrX2luIiwidHMiOjE3MDkzMzMzMzMsInNpZyI6ImFiY2RlZjEyMzQ1In0=
```

Decoded:
```json
{"eventId":"event_123","type":"check_in","ts":1709333333,"sig":"abcdef12345"}
```

---

## VERIFICATION FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHECK-IN VERIFICATION                           │
└─────────────────────────────────────────────────────────────────┘

User arrives at event
        │
        ▼
┌─────────────────┐
│ Scan QR Code     │
│ (Check-in QR)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Decode Payload   │
│ Verify HMAC     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Timestamp  │
│ (5-min window) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GPS Check       │
│ (Venue proximity)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Calculate Score  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Score≥0.6│ │Score<0.6│
│Verified│ │ Partial │
└───┬───┘ └───┬───┘
    │         │
    │         ▼
    │ ┌───────────────┐
    │ │ Flag for NGO  │
    │ │ Review        │
    │ └───────────────┘
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Credit │ │Pending│
│Karma  │ │Review │
└───────┘ └───────┘
```

---

## QR VALIDATION

### Validation Checks

| Check | Description |
|-------|-------------|
| 1. Base64 Decode | Valid base64 encoded payload |
| 2. JSON Parse | Valid JSON structure |
| 3. Required Fields | eventId, type, ts, sig present |
| 4. Type Match | QR type matches expected |
| 5. Event Match | Event ID matches expected |
| 6. Timestamp | Not older than 5 minutes |
| 7. HMAC Verify | Signature is valid |

### Error Messages

| Error | Cause |
|-------|-------|
| `Invalid QR code format` | Base64 decode failed |
| `QR code missing required fields` | Missing eventId/type/ts/sig |
| `QR code type mismatch` | Wrong QR type (check_in vs check_out) |
| `QR code does not belong to this event` | Event ID mismatch |
| `QR code has expired` | Timestamp > 5 minutes old |
| `QR code signature invalid` | HMAC verification failed |

---

## GPS VERIFICATION

### How It Works

```typescript
interface GPSCoords {
  lat: number;
  lng: number;
}

// Check if user is within venue radius
function checkGPSProximity(
  userLocation: GPSCoords,
  venueLocation: GPSCoords,
  radiusMeters: number = 100
): boolean {
  const distance = haversine(userLocation, venueLocation);
  return distance <= radiusMeters;
}
```

### Scoring

- **GPS matches**: `gps_match = 0.15` (full weight)
- **GPS doesn't match**: `gps_match = 0` (no weight)
- **Default radius**: 100 meters

---

## FRAUD DETECTION

### Anomaly Types

| Type | Severity | Description |
|------|----------|-------------|
| `rapid_checkout` | low | Check-out within 1 minute of check-in |
| `gps_mismatch` | medium | GPS far from venue |
| `duplicate_scan` | high | Same QR scanned twice |
| `expired_qr` | high | Expired QR code used |
| `signature_invalid` | critical | Tampered QR code |

### Fraud Alert Example

```typescript
interface FraudAlert {
  type: 'rapid_checkout' | 'gps_mismatch' | 'duplicate_scan';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}
```

---

## CHECK-IN/CHECK-OUT

### Check-In Flow

```typescript
interface CheckInResult {
  success: boolean;
  booking?: Record<string, unknown>;
  confidenceScore?: number;
  status?: 'verified' | 'partial' | 'rejected';
  error?: string;
  signals?: VerificationSignals;
}

async function checkIn(
  qrPayload: string,
  userId: string,
  eventId: string,
  gpsCoords?: GPSCoords
): Promise<CheckInResult>
```

### Check-Out Flow

```typescript
interface CheckOutResult {
  success: boolean;
  booking?: Record<string, unknown>;
  confidenceScore?: number;
  status?: 'verified' | 'partial' | 'rejected';
  earnRecord?: Record<string, unknown>;
  error?: string;
}

async function checkOut(
  qrPayload: string,
  userId: string,
  eventId: string,
  gpsCoords?: GPSCoords
): Promise<CheckOutResult>
```

---

## NGO APPROVAL

For partial verifications (score 0.40-0.59):

1. Event organizer/NGO reviews flagged check-ins
2. Can approve or reject
3. Approval adds `ngo_approved = 0.40` to score

### Approval Flow

```
Partial Score (0.40-0.59)
        │
        ▼
┌─────────────────┐
│ NGO Dashboard    │
│ Lists flagged   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Approve│ │Reject │
└───┬───┘ └───┬───┘
    │         │
    │ +0.40  │ Score stays
    ▼         ▼
┌───────┐ ┌───────┐
│ Verified│ │Rejected│
└───────┘ └───────┘
```

---

## API ENDPOINTS

### Check-In

```bash
POST /api/check-in
{
  "qrPayload": "base64_encoded_qr",
  "eventId": "event_123",
  "gps": { "lat": 12.9716, "lng": 77.5946 }
}
```

### Check-Out

```bash
POST /api/check-out
{
  "qrPayload": "base64_encoded_qr",
  "eventId": "event_123",
  "gps": { "lat": 12.9716, "lng": 77.5946 }
}
```

### Get Verification Status

```bash
GET /api/verification/:bookingId
```

### NGO Approval

```bash
POST /api/verification/:bookingId/approve
{
  "approved": true,
  "notes": "Confirmed attendance via photo"
}
```

---

## FILES REFERENCE

| File | Description |
|------|-------------|
| `rez-karma-service/src/engines/verificationEngine.ts` | Core verification logic |
| `rez-karma-service/src/routes/verifyRoutes.ts` | API routes |
| `rez-karma-service/src/__tests__/verifyRoutes.test.ts` | Tests |

---

## CONSTANTS

```typescript
export const SIGNAL_WEIGHTS = {
  qr_in: 0.30,
  qr_out: 0.30,
  gps_match: 0.15,
  ngo_approved: 0.40,
  photo_proof: 0.10,
} as const;

export const APPROVAL_THRESHOLD = 0.60;
export const PARTIAL_THRESHOLD = 0.40;
export const QR_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
export const DEFAULT_GPS_RADIUS_METERS = 100;
```

---

## SECURITY FEATURES

| Feature | Protection Against |
|---------|-------------------|
| HMAC-SHA256 signature | Tampered QR codes |
| 5-minute timestamp | Replay attacks |
| Event ID validation | Cross-event attacks |
| GPS proximity | Remote fraud |
| Rate limiting | Bulk scanning |
| Duplicate detection | Multi-use QR |

---

## STATUS

| Component | Status |
|-----------|--------|
| QR Validation | ✅ Production |
| GPS Check | ✅ Production |
| Fraud Detection | ✅ Production |
| NGO Approval | ✅ Production |
| Photo Proof | ✅ Production |
| Tests | ✅ Passing |

---

**Last Updated:** 2026-05-03
