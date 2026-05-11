# REZ Fraud Detection Audit Report

**Date:** 2026-04-29  
**Scope:** Fraud Detection, Wallet Security, Order Fraud, Promo Abuse  
**Status:** RESEARCH ONLY - Analysis Complete

---

## Executive Summary

REZ has a multi-layered fraud detection system spanning consumer apps, merchant services, and backend infrastructure. The system employs velocity tracking, pattern recognition, device fingerprinting, and referral loop detection. However, there are critical gaps including a missing FraudFlag model (CRITICAL-007), inconsistent fail-open behavior in some services, and limited real-time anomaly detection.

---

## 1. Fraud Detection - Existing Patterns

### 1.1 Core Detection Services

| Service | Location | Primary Detection |
|---------|----------|-------------------|
| `fraudDetectionService` | `rezbackend/` | Bill upload fraud (duplicate, velocity, amount anomalies) |
| `rewardAbuseDetector` | `rezbackend/` | Coin velocity, device clustering, referral abuse |
| `fraudEngine` | `rez-economic-engine/` | Rule-based fraud evaluation |
| `fraudDetectionService` | `rez-app-consumer/` | Social media submission fraud |
| `fraudDetection` | `verify-service/` | Serial/QR scan fraud |
| `fraudDetection` | `rez-gamification/` | Check-in/achievement fraud |

### 1.2 Bill Upload Fraud Detection

**File:** `rezbackend/rez-backend-master/src/services/fraudDetectionService.ts`

Checks performed:
- **Duplicate Bill Detection**: Same user+merchant+amount within 24h window (+50 fraud score)
- **Duplicate Image**: SHA256 hash comparison of bill images (+60 score)
- **Upload Frequency**: >5 bills/hour (+30), >20/day (+20)
- **Amount Suspicion**: Round numbers, >5x user average (+15)
- **Bill Age**: Future-dated (+40), >30 days old (+30)
- **Multi-Merchant Velocity**: 5+ merchants in 1 hour (+25)
- **Merchant Self-Billing**: Store owner submitting own bill (+60 score)

```typescript
// Fraud score aggregation
const fraudThreshold = cashbackCfg?.riskScoreBlockThreshold ?? 70;
if (result.fraudScore > fraudThreshold) {
  result.isFraudulent = true;
}
```

### 1.3 Velocity-Based Fraud Rules

**File:** `rez-economic-engine/src/config/fraudRules.ts`

| Rule | Type | Threshold | Severity |
|------|------|-----------|----------|
| Rapid Scanning | velocity | 10 scans/30s | medium |
| IP Flooding | velocity | 10 requests/hour | high |
| Impossible Travel | impossible_travel | 500km/1hr | critical |
| Duplicate Bill Upload | pattern | 2x same bill/24hr | high |
| Duplicate Image | pattern | 2x same image/24hr | high |
| High Frequency Uploads | velocity | 5 uploads/hour | medium |
| Future Dated Bill | anomaly | >0 days future | high |
| Referral Loop | pattern | 5 referrals/7 days | medium |

### 1.4 Gamification Fraud Detection

**File:** `rez-gamification-service/dist/services/fraudDetection.d.ts`

Detects:
- **Velocity attacks**: Too many actions in short time
- **GPS spoofing**: Impossible travel speeds
- **Collusion**: Self-payment patterns

---

## 2. Wallet Security - Coin Abuse

### 2.1 Coin Velocity Tracking

**File:** `rezbackend/rez-backend-master/src/jobs/fraudDetection.ts`

Daily batch job using z-score anomaly detection:
- Aggregates coin earnings per user over 24h
- Computes mean and standard deviation
- Flags users where `z-score > 3` (earned > mean + 3*stdDev)
- Uses distributed lock (Redis) to ensure single execution

```typescript
const FRAUD_Z_SCORE_THRESHOLD = 3;
const LOOKBACK_HOURS = 24;

// Flagged users get fraudFlags.coinVelocity set on User model
```

### 2.2 Reward Abuse Detector

**File:** `rezbackend/rez-backend-master/src/services/rewardAbuseDetector.ts`

#### Velocity Thresholds
| Category | Limit | Time Window |
|----------|-------|-------------|
| Coins earned | 500 | per hour |
| Coins earned | 5,000 | per day |
| Earning events | 20 | per hour |
| Earning events | 50 | per day |

#### Device Clustering
- Max 3 accounts per device (allows family sharing)
- Flags if >3 accounts share same device hash

#### Referral Abuse
- Max 2 referral rewards per day per referrer
- Device overlap detection blocks self-referral
- Max 5 accounts referred from same device

#### Bill Upload Farming
- Min 72 hours between same merchant+amount bills
- Max 10 bill uploads per day
- Max 2 duplicate uploads per week

#### Challenge Farming
- 1 completion per challenge per day
- 2 challenge rewards per hour
- 10 challenges per day max

#### SIP Cancellation Abuse
- Min 30 days before SIP re-creation
- Max 3 cancellations per quarter

#### Web Order Abuse
- Min 30 minutes order-to-cancellation
- Max 2 cancellations per day
- Suspicious pattern: 3+ same-amount orders/day

### 2.3 Coin Type Architecture

**File:** `src/enums/coinType.ts`

6 canonical coin types with priority ordering:
```
PROMO > BRANDED > PRIVE > CASHBACK > REFERRAL > REZ
```

This ensures cheaper/constrained coins are consumed first during redemption.

---

## 3. Order Fraud Patterns

### 3.1 Order-Related Fraud Routes

**File:** `rezbackend/rez-backend-master/src/routes/admin/fraudReports.ts`

Admin fraud report categories:
- `unauthorized_transaction`
- `account_takeover`
- `phishing`
- `fake_merchant`
- `counterfeit_product`
- `other`

### 3.2 Order Fraud Actions

Available admin actions on flagged orders:
```typescript
type FraudActionType = 'freeze_wallet' | 'suspend_user' | 'hold_orders';
```

### 3.3 Web Order Abuse Detection

**File:** `rezbackend/rez-backend-master/src/services/rewardAbuseDetector.ts`

Patterns detected:
- Rapid order cancellations (farming loyalty points)
- Same-order-amount clustering (automated fraud)
- Min 30-minute hold before cancellation

### 3.4 Merchant Fraud Monitoring

**File:** `rez-merchant-service/src/routes/fraud.ts`

Merchant-accessible fraud endpoints:
- `GET /fraud/alerts` - Anomaly alerts scoped to merchant
- `GET /fraud/alerts/:id` - Single alert detail
- `GET /fraud/status` - 30-day fraud summary

Cashback fraud metrics tracked:
- Total requests
- Flagged requests (review pending)
- High-risk requests (risk score >= 70)
- Fraud rate percentage

---

## 4. Promo Abuse

### 4.1 Promo Coin Configuration

**File:** `src/entities/wallet.ts`

Promo coins have:
- Campaign-based expiry dates
- Max redemption percentage (default 20% per bill)
- `maxRedemptionPercentage: number`
- `expiryDate: Date`

### 4.2 Redemption Limits

**File:** `rez-app-admin/app/(dashboard)/fraud-config.tsx`

Configurable promo limits:
- `maxRedemptionPercent`: Max % of order payable using promo coins
- `cashbackHoldHours`: Hours before pending cashback auto-credits
- `reconciliationIntervalHours`: Cashback reconciliation frequency

### 4.3 Promo Abuse Patterns (Inferred Gaps)

Based on code analysis, potential promo abuse vectors:
- **Promo code stacking**: Multiple promo codes on single order
- **Promo expiry manipulation**: Delaying redemption near expiry
- **Promo threshold gaming**: Splitting orders to meet minimums
- **Expired promo usage**: Race conditions around expiry time

---

## 5. Current Protections Summary

### 5.1 Implemented Protections

| Protection | Coverage |
|------------|----------|
| Duplicate bill detection | Bill uploads |
| Image hash deduplication | Bill images |
| Upload velocity limiting | Bill service |
| Amount anomaly scoring | Bill service |
| Bill age validation | Bill service |
| Merchant self-billing detection | Bill service |
| Coin velocity tracking | Redis-based real-time |
| Z-score anomaly detection | Daily batch job |
| Device clustering detection | Multi-account farms |
| Referral loop prevention | BFS chain detection |
| Daily referral limits | Redis counters |
| Challenge farming prevention | Per-challenge daily limits |
| SIP abuse detection | Quarterly tracking |
| Web order abuse detection | Cancellation velocity |
| Future-dated bill blocking | Bill age check |
| Impossible travel detection | Location velocity |
| IP flooding blocking | Request rate limiting |
| Bot pattern detection | User agent analysis |

### 5.2 Admin Controls

**Fraud Config UI:** `rez-app-admin/app/(dashboard)/fraud-config.tsx`

Live-configurable thresholds:
- Min order value
- Max cashback per order/user/merchant/day
- Cooldown minutes
- Risk score block threshold
- Risk score hold threshold
- Max devices per user
- Reconciliation interval

---

## 6. Critical Gaps

### 6.1 CRITICAL-007: FraudFlag Model Missing

**Severity:** P0 - All fraud events silently dropped

**Issue:** Code references `FraudFlag` model throughout but it's never registered with Mongoose.

**Impact:**
- All fraud flags silently lost
- No audit trail
- No fraud analytics possible
- Repeat offenders undetectable
- Payment fraud untracked
- Compliance requirements unmet

**Affected:**
- `rez-backend` (monolith)
- `rez-payment-service`
- `rez-finance-service`

**Fix Required:**
```typescript
// Create and register FraudFlag model
const FraudFlagSchema = new Schema({
  userId: { type: String, index: true },
  type: { type: String, enum: [...], index: true },
  severity: { type: String, enum: [...], index: true },
  metadata: { type: Schema.Types.Mixed },
  resolved: { type: Boolean, default: false },
  resolvedBy: { type: String },
  resolvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});
```

### 6.2 Fail-Open Behavior in Some Services

**Location:** `rewardAbuseDetector.ts`

Redis errors cause fail-open in several checks:
```typescript
// checkCoinVelocity fails open
} catch (error) {
  logger.error('[AbuseDetector] Velocity check error', { error });
  return { allowed: true, ... };  // FAIL-OPEN
}
```

This allows fraud during Redis outages.

### 6.3 Missing Real-Time Fraud Event Streaming

No event bus integration for:
- Real-time fraud flag aggregation
- Cross-service fraud correlation
- ML model feature updates

### 6.4 Limited Promo/Order Correlation

No cross-checking between:
- Promo usage patterns and order values
- Promo code sharing networks
- Cross-merchant promo abuse

### 6.5 No ML-Based Anomaly Detection

Current detection is purely rule-based:
- No behavioral baseline learning
- No unsupervised anomaly detection
- No fraud ring identification

### 6.6 Gap: Crypto-Based Bill Verification

Bill images use SHA256 hashing only:
- No perceptual hashing for similar images
- No OCR verification of amounts
- No merchant verification against bill data

---

## 7. Improvement Ideas

### 7.1 Immediate Priority

1. **Implement FraudFlag Model** (CRITICAL-007)
   - Register model with Mongoose
   - Add error handling around create() calls
   - Set up alerting for high-severity flags

2. **Change Fail-Open to Fail-Closed**
   ```typescript
   // Current: return { allowed: true };
   // Recommended: return { allowed: false, reason: 'Service unavailable' };
   ```

3. **Add Perceptual Image Hashing**
   - Implement pHash/dHash for bill images
   - Detect modified but similar images
   - Flag rotation/cropping attempts

### 7.2 Short-Term (1-3 months)

4. **Real-Time Fraud Event Bus**
   - Integrate with existing event queue
   - Stream fraud events to analytics
   - Enable cross-service correlation

5. **Behavioral Baseline Learning**
   - Track per-user historical patterns
   - Detect deviations from baseline
   - Implement adaptive thresholds

6. **Merchant Collusion Detection**
   - Cross-reference merchant cashback rates
   - Detect coordinated fake bill uploads
   - Identify merchant ring networks

7. **Promo Code Sharing Network Detection**
   - Track promo code propagation patterns
   - Identify sharing networks
   - Block mass promo exploitation

### 7.3 Medium-Term (3-6 months)

8. **ML-Based Fraud Detection**
   - Train models on historical fraud patterns
   - Implement unsupervised anomaly detection
   - Deploy fraud ring identification

9. **Graph-Based Fraud Analysis**
   - Model user/device/merchant relationships
   - Implement graph neural networks
   - Detect fraud rings and collusions

10. **Automated Response Playbooks**
    - Auto-freeze suspicious wallets
    - Auto-hold orders for review
    - Auto-escalate to fraud team

### 7.4 Long-Term (6-12 months)

11. **Multi-Modal Bill Verification**
    - Combine OCR with merchant API verification
    - Cross-reference GST/tax records
    - Implement merchant reputation scoring

12. **Real-Time Risk Scoring API**
    - Expose fraud scores to all services
    - Enable real-time decisions
    - Implement scoring feedback loop

13. **Cross-Platform Fraud Intelligence**
    - Share fraud intelligence with partners
    - Implement consortium fraud detection
    - Build fraud data marketplace

---

## 8. Testing Coverage

### 8.1 Existing Tests

| Test File | Coverage |
|-----------|----------|
| `fraudDetection.test.ts` | Device clustering, bill duplication, referral abuse |
| `referral.fraud.test.ts` | Circular referral detection, rate limits |
| `fraudDetectionService.test.ts` | Bill fraud checks |
| `fraud.test.ts` (verify-service) | Serial/QR scan fraud |

### 8.2 Test Gaps

- No tests for promo abuse patterns
- No tests for order manipulation scenarios
- No tests for merchant self-billing
- No tests for fail-open behavior

---

## 9. Monitoring Recommendations

### 9.1 Key Metrics to Track

```
- Fraud detection hit rate (flags / total transactions)
- False positive rate (legitimate flagged)
- False negative rate (fraudulent passed)
- Fraud detection latency (P95, P99)
- FraudFlag write success rate
- Coin velocity threshold breach rate
- Device clustering detection rate
- Referral loop prevention count
```

### 9.2 Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| FraudFlag write failures | >5/hour | >1/minute |
| False positive rate | >10% | >25% |
| Fail-open occurrences | >10/hour | >1/minute |
| Velocity threshold breaches | >100/hour | >10/minute |

---

## 10. File Reference Map

### Core Fraud Detection
- `/rezbackend/rez-backend-master/src/services/fraudDetectionService.ts`
- `/rezbackend/rez-backend-master/src/services/rewardAbuseDetector.ts`
- `/rezbackend/rez-backend-master/src/jobs/fraudDetection.ts`
- `/rez-economic-engine/src/engines/fraudEngine.ts`
- `/rez-economic-engine/src/config/fraudRules.ts`

### Consumer Apps
- `/rez-app-consumer/services/fraudDetectionService.ts`
- `/rez-app-consumer/types/fraud-detection.types.ts`

### Merchant Services
- `/rez-merchant-service/src/routes/fraud.ts`
- `/rez-app-merchant/services/api/fraud.ts`

### Admin Interface
- `/rez-app-admin/app/(dashboard)/fraud-config.tsx`
- `/rez-app-admin/app/(dashboard)/fraud-queue.tsx`
- `/rez-app-admin/app/(dashboard)/fraud-reports.tsx`
- `/rez-app-admin/services/api/fraudReports.ts`

### Supporting Services
- `/verify-service/src/types/fraud.ts`
- `/rez-gamification-service/dist/services/fraudDetection.d.ts`

### Tests
- `/rezbackend/rez-backend-master/src/__tests__/fraudDetection.test.ts`
- `/rezbackend/rez-backend-master/src/__tests__/referral.fraud.test.ts`

---

## Appendix A: Fraud Score Reference

| Score Range | Risk Level | Action |
|------------|------------|--------|
| 0-29 | Low | Allow |
| 30-59 | Medium | Flag for review |
| 60-69 | High | Hold for manual review |
| 70-100 | Critical | Block |

## Appendix B: Redis Keys Used

```
velocity:coins:{userId}:hourly:{hour}:{day}
velocity:coins:{userId}:daily:{date}
velocity:events:{userId}:hourly:{hour}:{day}
velocity:events:{userId}:daily:{date}
referral:rewards:{userId}:daily:{date}
bills:{userId}:daily:{date}
challenge:{challengeId}:{userId}:daily:{date}
challenge:rewards:{userId}:hourly:{hour}:{date}
sip:cancellations:{userId}:quarter
orders:cancellations:{userId}:daily:{date}
orders:amount:{userId}:daily:{date}:{amount}
cron:fraud-detection:daily (distributed lock)
```

---

*Report generated: 2026-04-29*  
*Next review: 2026-07-29*
