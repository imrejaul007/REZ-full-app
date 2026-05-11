# First Loop Stress Test Plan

**Date:** 2026-05-01
**Objective:** Validate the inventory → reorder loop under real failure conditions
**Loop:** `inventory.low → Event Platform → ReZ Mind → Action Engine → NextaBiZ → BizOS → Feedback → Learning`

---

## Table of Contents

1. [Failure Scenarios](#1-failure-scenarios)
2. [Edge Cases](#2-edge-cases)
3. [Test Scripts](#3-test-scripts)
4. [Monitoring Dashboard](#4-monitoring-dashboard)
5. [Loop Reliability Score](#5-loop-reliability-score)
6. [Acceptance Criteria](#6-acceptance-criteria)

---

## 1. Failure Scenarios

### A. Event Platform Failure

**Test:** Kill Event Platform for 30-60 seconds

**Setup:**
```bash
# Terminal 1: Monitor events
curl -s http://localhost:4008/events/stats

# Terminal 2: Kill Event Platform
pkill -f "rez-event-platform"

# Wait 30 seconds, restart
./start-event-platform.sh
```

**Expected Behavior:**
```
✅ Events queue locally (Redis buffer)
✅ No data loss
✅ System recovers and replays
✅ Events processed after restart
```

**Failure Indicators:**
```
❌ Lost events - Events disappeared
❌ Stuck flow - Events never processed
❌ Duplicate explosion - Too many retries
```

**Validation Script:** `tests/stress/event-platform-failure.test.ts`

---

### B. Duplicate Events (Idempotency)

**Test:** Send same event twice with same `correlation_id`

**Setup:**
```bash
curl -X POST http://localhost:4008/events/inventory.low \
  -H "Content-Type: application/json" \
  -d '{
    "event": "inventory.low",
    "version": "v1",
    "correlation_id": "test_dup_001",
    "source": "stress-test",
    "timestamp": 1714567890000,
    "data": {
      "merchant_id": "test_merchant",
      "store_id": "test_store",
      "item_id": "test_item",
      "item_name": "Test Item",
      "current_stock": 3,
      "threshold": 5,
      "unit": "units"
    }
  }'

# Send same event again
curl -X POST http://localhost:4008/events/inventory.low \
  -H "Content-Type: application/json" \
  -d '{...same payload...}'
```

**Expected Behavior:**
```
✅ Action Engine log: count = 1
✅ Only ONE action triggered
✅ No duplicate PO created
```

**Failure Indicators:**
```
❌ count = 2 - Idempotency broken
❌ 2 POs created - CRITICAL BUG
```

**Validation Script:** `tests/stress/duplicate-events.test.ts`

---

### C. ReZ Mind Timeout

**Test:** Delay or disable ReZ Mind response

**Setup:**
```bash
# Method 1: Add artificial delay
curl -X POST http://localhost:3001/api/intent/capture \
  --max-time 1  # 1 second timeout

# Method 2: Disable ReZ Mind
export ENABLE_REZ_MIND=false
```

**Expected Behavior:**
```
✅ System falls back safely
✅ "Recommendation pending" shown
✅ No blocking of flow
✅ No crash
```

**Failure Indicators:**
```
❌ Request hangs indefinitely
❌ Action Engine crashes
❌ No fallback response
```

**Validation Script:** `tests/stress/rez-mind-timeout.test.ts`

---

### D. Action Engine Failure

**Test:** Simulate failure during action execution

**Setup:**
```bash
# Kill Action Engine mid-execution
pkill -STOP node  # Pause process
# Send event
curl -X POST http://localhost:4008/events/inventory.low ...
pkill -CONT node  # Resume
```

**Expected Behavior:**
```
✅ Retry with idempotency
✅ No partial execution
✅ Audit log reflects failure + recovery
```

**Failure Indicators:**
```
❌ Partial execution (PO created but notification not sent)
❌ No retry
❌ Silent failure
```

**Validation Script:** `tests/stress/action-engine-failure.test.ts`

---

### E. NextaBiZ Unavailable

**Test:** Disable NextaBiZ service

**Setup:**
```bash
export NEXTABIZ_AVAILABLE=false
# Send inventory.low event
```

**Expected Behavior:**
```
✅ Suggestion still created
✅ Marked as "pending supplier"
✅ UI shows pending status
```

**Failure Indicators:**
```
❌ Complete failure
❌ Error thrown
```

**Validation Script:** `tests/stress/nextabizz-unavailable.test.ts`

---

### F. UI / BizOS Failure

**Test:** Block UI rendering or API

**Setup:**
```bash
# Disable BizOS API
export BIZOS_API_AVAILABLE=false
```

**Expected Behavior:**
```
✅ Action still logged
✅ Retry display later when restored
```

**Failure Indicators:**
```
❌ Action Engine crashes
❌ No logging
```

---

### G. Feedback Missing

**Test:** Merchant ignores suggestion for 48 hours

**Setup:**
```bash
# Create suggestion
# Wait 48 hours (or simulate with time machine)

# Check feedback
curl http://localhost:4010/feedback/stats/test_merchant
```

**Expected Behavior:**
```
✅ feedback = "ignored_after_48h"
✅ Implicit feedback captured
✅ Learning adjusted
```

**Failure Indicators:**
```
❌ No feedback recorded
❌ No implicit feedback
❌ Learning unchanged
```

**Validation Script:** `tests/stress/feedback-missing.test.ts`

---

## 2. Edge Cases

### 1. Rapid Fire Events

**Test:** Send `inventory.low` 10 times in 5 seconds

**Setup:**
```bash
for i in {1..10}; do
  curl -X POST http://localhost:4008/events/inventory.low \
    -H "Content-Type: application/json" \
    -d '{
      "event": "inventory.low",
      "correlation_id": "rapid_'$i'",
      "source": "stress-test",
      "timestamp": '$(date +%s)'000,
      "data": {
        "merchant_id": "test_merchant",
        "item_id": "test_item_'$i'",
        "item_name": "Test Item",
        "current_stock": 3,
        "threshold": 5,
        "unit": "units"
      }
    }'
done
```

**Expected Behavior:**
```
✅ Coalesced or deduplicated
✅ NOT 10 actions (unless 10 unique items)
```

**Failure Indicators:**
```
❌ 10 actions for same item
❌ Rate limit exceeded
```

---

### 2. Out-of-Order Events

**Test:** Send `inventory.updated` before `inventory.low`

**Setup:**
```bash
# Send update first
curl -X POST http://localhost:4008/events/inventory.updated ...
# Send low second
curl -X POST http://localhost:4008/events/inventory.low ...
```

**Expected Behavior:**
```
✅ System handles gracefully
✅ No stale decisions
✅ Latest state wins
```

**Failure Indicators:**
```
❌ Stale decision based on old data
❌ Inconsistent state
```

---

### 3. Partial Loop Completion

**Test:** Event → Decision → UI fails

**Setup:**
```bash
# Simulate: event processed, decision made, UI fails
# Then restart UI
```

**Expected Behavior:**
```
✅ Action logged with "pending_display"
✅ Retried when UI restores
✅ Complete audit trail
```

---

### 4. Long Latency (3-5 seconds)

**Test:** ReZ Mind takes 5 seconds

**Setup:**
```bash
# Configure latency simulation
export REZ_MIND_LATENCY_MS=5000
```

**Expected Behavior:**
```
✅ Async processing
✅ No UI blocking
✅ Timeout with fallback
```

**Failure Indicators:**
```
❌ UI hangs
❌ Request timeout
```

---

## 3. Test Scripts

### Location
```
rez-first-loop/tests/stress/
├── event-platform-failure.test.ts
├── duplicate-events.test.ts
├── rez-mind-timeout.test.ts
├── action-engine-failure.test.ts
├── nextabizz-unavailable.test.ts
├── rapid-fire-events.test.ts
├── out-of-order.test.ts
├── partial-completion.test.ts
├── long-latency.test.ts
└── feedback-missing.test.ts
```

### Run All Stress Tests

```bash
cd rez-first-loop
npm run test:stress
```

### Run Specific Test

```bash
npm run test:stress -- --testNamePattern="duplicate"
```

---

## 4. Monitoring Dashboard

### Metrics to Track

| Metric | Target | Alert |
|--------|--------|-------|
| Event Success Rate | > 99% | < 99% |
| Duplicate Suppression Rate | 100% | any duplicates |
| Action Success Rate | > 99% | < 99% |
| Feedback Capture Rate | > 90% | < 80% |
| Event → Action Latency | < 2s | > 5s |
| End-to-End Loop Time | < 10s | > 30s |

### Prometheus Queries

```promql
# Event Success Rate
sum(rate(rez_events_processed_total[5m])) / sum(rate(rez_events_received_total[5m])) * 100

# Duplicate Suppression
sum(rate(rez_events_duplicates_suppressed_total[5m]))

# Action Success Rate
sum(rate(rez_actions_success_total[5m])) / sum(rate(rez_actions_triggered_total[5m])) * 100

# Feedback Capture Rate
sum(rate(rez_feedback_captured_total[5m])) / sum(rate(rez_actions_completed_total[5m])) * 100

# Latency (p99)
histogram_quantile(0.99, sum(rate(rez_loop_duration_seconds_bucket[5m])) by (le))
```

### Dashboard JSON

**File:** `grafana/provisioning/dashboards/json/first-loop.json`

```json
{
  "dashboard": {
    "title": "First Loop - Stress Test",
    "panels": [
      {
        "title": "Event Success Rate",
        "type": "gauge",
        "targets": [{"expr": "rez_events_success_rate"}],
        "thresholds": {
          "low": 95,
          "medium": 99,
          "high": 100
        }
      },
      {
        "title": "Duplicate Events",
        "type": "stat",
        "targets": [{"expr": "rez_duplicates_total"}]
      },
      {
        "title": "Loop Latency (p99)",
        "type": "graph",
        "targets": [{"expr": "rez_loop_duration_p99"}]
      },
      {
        "title": "Feedback Capture Rate",
        "type": "gauge",
        "targets": [{"expr": "rez_feedback_rate"}]
      }
    ]
  }
}
```

---

## 5. Loop Reliability Score

### Formula

```
Loop Reliability Score = 
  (successful_loops / total_loops) * 100
```

### Components

| Component | Weight | Metric |
|-----------|--------|--------|
| Event Delivery | 20% | Events received / events processed |
| Idempotency | 20% | No duplicates / total events |
| Action Success | 25% | Actions completed / actions triggered |
| Feedback Capture | 20% | Feedback recorded / actions completed |
| Learning Loop | 15% | Model updates / feedback received |

### Target

```
Target Score: > 99% before scaling
Warning: < 95% - investigate immediately
Critical: < 90% - pause deployment
```

### Implementation

```typescript
// src/metrics/reliability-score.ts

interface LoopMetrics {
  eventsReceived: number;
  eventsProcessed: number;
  duplicatesSuppressed: number;
  actionsTriggered: number;
  actionsCompleted: number;
  feedbackCaptured: number;
  learningUpdates: number;
}

function calculateReliabilityScore(metrics: LoopMetrics): number {
  const eventDelivery = metrics.eventsProcessed / metrics.eventsReceived;
  const idempotency = 1 - (metrics.duplicatesSuppressed / metrics.eventsReceived);
  const actionSuccess = metrics.actionsCompleted / metrics.actionsTriggered;
  const feedbackCapture = metrics.feedbackCaptured / metrics.actionsCompleted;
  const learningLoop = metrics.learningUpdates / metrics.feedbackCaptured;

  return (
    eventDelivery * 0.20 +
    idempotency * 0.20 +
    actionSuccess * 0.25 +
    feedbackCapture * 0.20 +
    learningLoop * 0.15
  ) * 100;
}
```

---

## 6. Acceptance Criteria

### Must Pass (Go/No-Go)

| Test | Criteria |
|------|----------|
| Duplicate Events | 0 duplicates |
| Event Platform Failure | 100% recovery |
| Action Engine Failure | Retry succeeds |
| Feedback Capture | > 90% |

### Should Pass (Deploy with Warning)

| Test | Criteria |
|------|----------|
| ReZ Mind Timeout | Fallback < 5s |
| Rapid Fire | Coalesce to < 5 actions |
| Out-of-Order | Latest state wins |
| Long Latency | Async with timeout |

### Nice to Pass (Post-Deploy)

| Test | Criteria |
|------|----------|
| NextaBiZ Unavailable | Pending status shown |
| UI Failure | Retry display later |

---

## 7. Test Execution Checklist

```markdown
# Pre-Test
[ ] All services running
[ ] Prometheus metrics accessible
[ ] Grafana dashboard ready
[ ] Test data seeded

# Test A: Event Platform Failure
[ ] Kill Event Platform
[ ] Send 10 events
[ ] Restart Event Platform
[ ] Verify all 10 processed

# Test B: Duplicate Events
[ ] Send same correlation_id twice
[ ] Check Action Engine log
[ ] Verify count = 1

# Test C: ReZ Mind Timeout
[ ] Enable latency simulation
[ ] Send event
[ ] Verify fallback response

# Test D: Action Engine Failure
[ ] Pause Action Engine
[ ] Send event
[ ] Resume Action Engine
[ ] Verify retry succeeded

# Test E: NextaBiZ Unavailable
[ ] Disable NextaBiZ
[ ] Send event
[ ] Verify pending status

# Test F: Feedback Missing
[ ] Create suggestion
[ ] Wait/imply 48h timeout
[ ] Verify implicit feedback

# Test G: Rapid Fire
[ ] Send 10 events in 5s
[ ] Verify coalesced/deduplicated

# Post-Test
[ ] Calculate Reliability Score
[ ] Document failures
[ ] Create fix tickets
[ ] Re-test after fixes
```

---

## 8. Failure Escalation

| Issue | Severity | Action |
|-------|----------|--------|
| Duplicate PO created | CRITICAL | Pause loop, investigate immediately |
| Lost events | CRITICAL | Pause loop, check Event Platform |
| < 90% Reliability | CRITICAL | Do not scale |
| Feedback < 80% | HIGH | Investigate feedback service |
| Latency > 10s | MEDIUM | Optimize flow |

---

**Last Updated:** 2026-05-01
**Next Review:** After first stress test cycle
