# First Loop Monitoring Dashboard

**Purpose:** Real-time visibility into the inventory → reorder loop

---

## Dashboard Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FIRST LOOP MONITORING DASHBOARD                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │ EVENT SUCCESS    │  │ DUPLICATE       │  │ ACTION SUCCESS  │          │
│  │     99.8%       │  │     0          │  │     98.5%       │          │
│  │     ✅          │  │     ✅          │  │     ⚠️          │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │ FEEDBACK RATE   │  │ LOOP LATENCY    │  │ RELIABILITY     │          │
│  │     87.3%       │  │     1.2s       │  │     97.1%       │          │
│  │     ⚠️          │  │     ✅          │  │     ⚠️          │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  EVENT FLOW                                                             │
│  ────────                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ BizOS    │───►│ Platform │───►│ReZ Mind │───►│ Action   │      │
│  │ emit     │    │ route    │    │ decide   │    │ execute  │      │
│  │  1,234   │    │  1,230   │    │  1,228   │    │  1,225   │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│       │                                                   │             │
│       │           ┌──────────┐    ┌──────────┐          │             │
│       └─────────►│ NextaBiZ │◄───│ BizOS UI │◄─────────┘             │
│                   │ PO draft │    │ Merchant │                      │
│                   │  1,220   │    │  1,218   │                      │
│                   └──────────┘    └──────────┘                      │
│                        │                │                              │
│                        ▼                ▼                              │
│                   ┌──────────┐    ┌──────────┐                      │
│                   │ Feedback │    │ Learning │                      │
│                   │ captured │    │ updated  │                      │
│                   │  1,218   │    │  1,215   │                      │
│                   └──────────┘    └──────────┘                      │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ALERTS                                                                 │
│  ──────                                                                 │
│  ⚠️  FEEDBACK RATE LOW: 87.3% (target: 90%)                          │
│  ⚠️  ACTION FAILURES: 3 in last hour                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Metrics Definitions

### 1. Event Success Rate

```promql
# Percentage of events successfully processed
sum(rate(rez_events_processed_total[5m])) / 
sum(rate(rez_events_received_total[5m])) * 100
```

**Target:** > 99%
**Warning:** < 99%
**Critical:** < 95%

---

### 2. Duplicate Suppression

```promql
# Count of duplicate events detected and suppressed
sum(rate(rez_events_duplicates_suppressed_total[5m]))
```

**Target:** 0 duplicates
**Critical:** Any duplicates = idempotency broken

---

### 3. Action Success Rate

```promql
# Percentage of actions successfully completed
sum(rate(rez_actions_completed_total[5m])) / 
sum(rate(rez_actions_triggered_total[5m])) * 100
```

**Target:** > 99%
**Warning:** < 99%
**Critical:** < 95%

---

### 4. Feedback Capture Rate

```promql
# Percentage of completed actions with feedback
sum(rate(rez_feedback_captured_total[5m])) / 
sum(rate(rez_actions_completed_total[5m])) * 100
```

**Target:** > 90%
**Warning:** < 90%
**Critical:** < 80%

---

### 5. Loop Latency (p99)

```promql
# Time from event received to action completed
histogram_quantile(0.99, 
  sum(rate(rez_loop_duration_seconds_bucket[5m])) by (le))
```

**Target:** < 2s
**Warning:** < 5s
**Critical:** > 5s

---

### 6. Reliability Score

```promql
# Weighted reliability score
(
  (sum(rate(rez_events_processed_total[5m])) / 
   sum(rate(rez_events_received_total[5m])) * 0.20
) + (
  (1 - sum(rate(rez_events_duplicates_suppressed_total[5m])) / 
   sum(rate(rez_events_received_total[5m])) * 0.20
) + (
  sum(rate(rez_actions_completed_total[5m])) / 
   sum(rate(rez_actions_triggered_total[5m])) * 0.25
) + (
  sum(rate(rez_feedback_captured_total[5m])) / 
   sum(rate(rez_actions_completed_total[5m])) * 0.20
) + (
  sum(rate(rez_learning_updates_total[5m])) / 
   sum(rate(rez_feedback_captured_total[5m])) * 0.15
) * 100
```

**Target:** > 99%
**Warning:** < 99%
**Critical:** < 95%

---

## Event Flow Visualization

### Timeline View

```
inventory.low event received
        │
        ▼
    ┌─────────────────────────────────────────────┐
    │ 0ms     Event Platform                      │
    │          ├─ Validate schema ✓               │
    │          ├─ Store event ✓                  │
    │          └─ Route to consumers ✓           │
    └─────────────────────────────────────────────┘
        │
        ▼
    ┌─────────────────────────────────────────────┐
    │ 15ms    ReZ Mind                          │
    │          ├─ Process intent ✓               │
    │          ├─ Calculate confidence ✓          │
    │          ├─ Generate recommendation ✓        │
    │          └─ Return decision ✓              │
    └─────────────────────────────────────────────┘
        │
        ▼
    ┌─────────────────────────────────────────────┐
    │ 45ms    Action Engine                      │
    │          ├─ Check policy ✓                  │
    │          ├─ Determine action level ✓        │
    │          ├─ Create/queue action ✓          │
    │          └─ Log audit trail ✓               │
    └─────────────────────────────────────────────┘
        │
        ▼
    ┌─────────────────────────────────────────────┐
    │ 120ms   NextaBiZ                          │
    │          ├─ Create draft PO ✓               │
    │          ├─ Set status: pending ✓          │
    │          └─ Return PO reference ✓          │
    └─────────────────────────────────────────────┘
        │
        ▼
    ┌─────────────────────────────────────────────┐
    │ 150ms   BizOS UI                           │
    │          ├─ Display suggestion ✓             │
    │          └─ Wait for merchant ✓             │
    └─────────────────────────────────────────────┘
        │
        ▼
    ┌─────────────────────────────────────────────┐
    │ 2h      Merchant Action                     │
    │          ├─ Approve / Reject                │
    │          └─ Trigger feedback                │
    └─────────────────────────────────────────────┘
        │
        ▼
    ┌─────────────────────────────────────────────┐
    │ 2h      Feedback Service                    │
    │          ├─ Record feedback ✓               │
    │          └─ Update AdaptiveScoringAgent ✓   │
    └─────────────────────────────────────────────┘
```

---

## Alert Rules

### Prometheus Alert Rules

```yaml
groups:
  - name: first_loop_alerts
    rules:
      # Event Platform Down
      - alert: FirstLoopEventPlatformDown
        expr: rate(rez_events_received_total[5m]) > 0 and rate(rez_events_processed_total[5m]) == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Event Platform not processing events"
          
      # Duplicate Events
      - alert: FirstLoopDuplicateEvents
        expr: rate(rez_events_duplicates_suppressed_total[5m]) > 0
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Duplicate events detected - idempotency broken"
          
      # Action Failures
      - alert: FirstLoopActionFailures
        expr: |
          (rate(rez_actions_triggered_total[5m]) - rate(rez_actions_completed_total[5m])) /
          rate(rez_actions_triggered_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Action failure rate > 5%"
          
      # Feedback Rate Low
      - alert: FirstLoopFeedbackRateLow
        expr: |
          sum(rate(rez_feedback_captured_total[5m])) / 
          sum(rate(rez_actions_completed_total[5m])) < 0.80
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Feedback capture rate < 80%"
          
      # High Latency
      - alert: FirstLoopHighLatency
        expr: histogram_quantile(0.99, sum(rate(rez_loop_duration_seconds_bucket[5m])) by (le)) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Loop latency p99 > 5 seconds"
          
      # Reliability Score Low
      - alert: FirstLoopReliabilityLow
        expr: rez_reliability_score < 95
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "Loop reliability score < 95%"
```

---

## Grafana Dashboard JSON

**File:** `grafana/provisioning/dashboards/json/first-loop.json`

```json
{
  "dashboard": {
    "title": "First Loop - Real Time Monitoring",
    "uid": "first-loop-monitor",
    "panels": [
      {
        "id": 1,
        "title": "Event Success Rate",
        "type": "gauge",
        "gridPos": {"x": 0, "y": 0, "w": 6, "h": 4},
        "targets": [
          {
            "expr": "sum(rate(rez_events_processed_total[5m])) / sum(rate(rez_events_received_total[5m])) * 100",
            "legendFormat": "Success Rate %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "red", "value": null},
                {"color": "yellow", "value": 95},
                {"color": "green", "value": 99}
              ]
            },
            "unit": "percent",
            "min": 0,
            "max": 100
          }
        }
      },
      {
        "id": 2,
        "title": "Duplicates Detected",
        "type": "stat",
        "gridPos": {"x": 6, "y": 0, "w": 6, "h": 4},
        "targets": [
          {
            "expr": "sum(increase(rez_events_duplicates_suppressed_total[24h]))",
            "legendFormat": "Duplicates (24h)"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "red", "value": 1}
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "title": "Action Success Rate",
        "type": "gauge",
        "gridPos": {"x": 12, "y": 0, "w": 6, "h": 4},
        "targets": [
          {
            "expr": "sum(rate(rez_actions_completed_total[5m])) / sum(rate(rez_actions_triggered_total[5m])) * 100",
            "legendFormat": "Success Rate %"
          }
        ]
      },
      {
        "id": 4,
        "title": "Feedback Capture Rate",
        "type": "gauge",
        "gridPos": {"x": 0, "y": 4, "w": 6, "h": 4},
        "targets": [
          {
            "expr": "sum(rate(rez_feedback_captured_total[5m])) / sum(rate(rez_actions_completed_total[5m])) * 100",
            "legendFormat": "Feedback Rate %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "red", "value": null},
                {"color": "yellow", "value": 80},
                {"color": "green", "value": 90}
              ]
            }
          }
        }
      },
      {
        "id": 5,
        "title": "Loop Latency (p99)",
        "type": "gauge",
        "gridPos": {"x": 6, "y": 4, "w": 6, "h": 4},
        "targets": [
          {
            "expr": "histogram_quantile(0.99, sum(rate(rez_loop_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p99 Latency"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 2},
                {"color": "red", "value": 5}
              ]
            }
          }
        }
      },
      {
        "id": 6,
        "title": "Reliability Score",
        "type": "gauge",
        "gridPos": {"x": 12, "y": 4, "w": 6, "h": 4},
        "targets": [
          {
            "expr": "rez_reliability_score",
            "legendFormat": "Score %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "red", "value": null},
                {"color": "yellow", "value": 95},
                {"color": "green", "value": 99}
              ]
            }
          }
        }
      },
      {
        "id": 7,
        "title": "Event Flow",
        "type": "timeseries",
        "gridPos": {"x": 0, "y": 8, "w": 24, "h": 8},
        "targets": [
          {"expr": "sum(rate(rez_events_received_total[5m]))", "legendFormat": "Received"},
          {"expr": "sum(rate(rez_events_processed_total[5m]))", "legendFormat": "Processed"},
          {"expr": "sum(rate(rez_actions_triggered_total[5m]))", "legendFormat": "Actions Triggered"},
          {"expr": "sum(rate(rez_feedback_captured_total[5m]))", "legendFormat": "Feedback"}
        ]
      }
    ]
  }
}
```

---

## Log Queries

### Loki Log Queries

```logql
# All events in the loop
{service=~"event-platform|action-engine|feedback-service"}
  |= "inventory.low"

# Failed actions
{service="action-engine"} 
  |= "action failed"
  |= "retry"

# Missing feedback
{service="feedback-service"}
  |= "timeout"
  |= "ignored"

# Slow events (> 5s)
{service=~".*"}
  |= "duration_ms"
  | json
  | duration_ms > 5000
```

---

## Runbook Links

| Alert | Runbook |
|-------|---------|
| EventPlatformDown | [Runbook: Event Platform Down](runbooks/event-platform-down.md) |
| DuplicateEvents | [Runbook: Idempotency Broken](runbooks/idempotency-broken.md) |
| ActionFailures | [Runbook: Action Failures](runbooks/action-failures.md) |
| FeedbackRateLow | [Runbook: Low Feedback Rate](runbooks/low-feedback.md) |
| HighLatency | [Runbook: High Latency](runbooks/high-latency.md) |

---

**Dashboard URL:** `http://localhost:3000/d/first-loop-monitor`
**Refresh:** 10 seconds
**Time Range:** Last 1 hour
