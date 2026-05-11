# Events & Notifications Audit Report

**Audited:** May 7, 2026
**Services:** analytics-events, REZ-notification-events

---

## Table of Contents

1. [Notification Service Events](#notification-service-events)
2. [Analytics Service Events](#analytics-service-events)
3. [Marketing Notification Events](#marketing-notification-events)
4. [Intent Events (ReZ Mind)](#intent-events-rez-mind)
5. [Event Platform Consumer Events](#event-platform-consumer-events)
6. [Scheduler/Internal Events](#schedulerinternal-events)
7. [Notification Channels](#notification-channels)
8. [Issues Found](#issues-found)

---

## Notification Service Events

**Service:** `REZ-notification-events`
**Queue:** `notification-events`
**File:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-notification-events/src/worker.ts`

### Event Types

| Event Name | Trigger | Action | Channels | Schema |
|-------------|---------|--------|----------|--------|
| `coin_earned` | User earns coins from transaction | Push + Email notification about coins earned | push, email, sms, whatsapp, in_app | `coinEarnedEventSchema` |
| `streak_at_risk` | User's daily streak about to expire | Remind user to visit store to maintain streak | push, email, sms, whatsapp, in_app | `streakAtRiskEventSchema` |
| `streak_milestone` | User reaches streak milestone | Celebrate achievement, award bonus coins | push, email, sms, whatsapp, in_app | `streakMilestoneEventSchema` |
| `payment_received` | Payment successfully processed | Confirm payment receipt | push, email, sms, whatsapp, in_app | `paymentReceivedEventSchema` |
| `order_update` | Order status changes | Update user on order status | push, email, sms, whatsapp, in_app | `orderUpdateEventSchema` |
| `marketing_campaign` | Campaign launched | Send campaign notification to users | push, email, sms, whatsapp, in_app | `CampaignEvent` |
| `marketing_voucher` | Voucher generated | Deliver voucher code to user | push, email, sms, whatsapp, in_app | `VoucherEvent` |
| `marketing_broadcast` | Broadcast to audience segment | Send broadcast to all users in segment | push, email, sms, whatsapp, in_app | `BroadcastEvent` |
| `streak_at_risk` (scheduler) | Daily at 7pm UTC | Find at-risk users, send notifications | push, in_app | `streakAtRiskEventSchema` |
| `digest_email` | Weekly/Monthly scheduler | Send digest summary to opted-in users | email, in_app | N/A (internal) |
| Generic Event | Unknown event type | Process with base structural validation | push, email, sms, whatsapp, in_app | `genericEventSchema` |

---

## Analytics Service Events

**Service:** `analytics-events`
**Queue:** `analytics-events`
**File:** `/Users/rejaulkarim/Documents/ReZ Full App/analytics-events/src/worker.ts`

### Event Types

| Event Name | Trigger | Action | Storage |
|------------|---------|--------|---------|
| Any custom analytics event | Published via API | Store in `analyticsevents` collection | MongoDB |
| Daily metrics aggregation | After event processing | Aggregate counts by date/eventType in `dailymetrics` | MongoDB |

### Web Event Ingestion

| Endpoint | Event | Storage |
|----------|-------|---------|
| `POST /api/analytics/web-events` | Custom web events | `webevents` collection |
| `POST /api/analytics/batch` | App events batch | `appevents` collection |

**Batch Consent Requirement:** Events require `consentGranted: true` at top level or per-event.

---

## Marketing Notification Events

**Service:** `REZ-notification-events`
**Routes:** `/api/marketing/*`
**File:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-notification-events/src/routes/marketing.ts`

### Campaign Notification

| Field | Description |
|-------|-------------|
| **Event Name** | `marketing_campaign` |
| **Trigger** | `POST /api/marketing/campaign` |
| **Action** | Enqueue individual notification jobs for each target user |
| **Channels** | push, email, sms, whatsapp, in_app |
| **Channels Support** | All 5 channels configurable |
| **Payload Fields** | title, body, campaignId, merchantId, audienceType, audienceCount, imageUrl, ctaUrl, ctaText, targetUserIds |

### Voucher Notification

| Field | Description |
|-------|-------------|
| **Event Name** | `marketing_voucher` |
| **Trigger** | `POST /api/marketing/voucher` |
| **Action** | Enqueue voucher notification with code delivery |
| **Channels** | push, email, sms, whatsapp, in_app |
| **Channels Support** | All 5 channels configurable |
| **Payload Fields** | title, body, voucherId, voucherCode, voucherType, voucherValue, merchantId, validUntil, email, phone, smsMessage, emailSubject, emailHtml |

### Broadcast Notification

| Field | Description |
|-------|-------------|
| **Event Name** | `marketing_broadcast` |
| **Trigger** | `POST /api/marketing/broadcast` |
| **Action** | Enqueue batch notifications to userIds array (batches of 100) |
| **Channels** | push, email, sms, whatsapp, in_app |
| **Channels Support** | All 5 channels configurable |
| **Payload Fields** | title, body, broadcastId, merchantId, audienceSegment, targetUserCount, scheduledAt |

### Audience Sync

| Field | Description |
|-------|-------------|
| **Endpoint** | `POST /api/marketing/audience/sync` |
| **Trigger** | Audience segment updated |
| **Action** | Bulk update `notification_preferences` collection |
| **Channels** | N/A (data sync only) |

---

## Intent Events (ReZ Mind)

**Service:** `REZ-notification-events`
**Subscriber:** Redis channel `rez-mind`
**File:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-notification-events/src/services/intentEventSubscriber.ts`

### Event Types

| Event Name | Trigger | Action | Status |
|------------|---------|--------|--------|
| `intent.dormant_user_signals` | Lapsed user shows purchase intent | Log + TODO: trigger re-engagement notification | **TODO** |
| `intent.purchase_intent` | High-confidence purchase intent detected | Log + TODO: trigger promotional notification | **TODO** |
| `intent.abandoned_cart` | Cart abandonment detected | Log + TODO: trigger cart recovery notification | **TODO** |
| `insight.dormancy_alert` | Cross-app dormancy aggregation | Log + TODO: trigger win-back campaign | **TODO** |

---

## Event Platform Consumer Events

**Service:** `analytics-events`
**Consumer:** 10 BullMQ workers for shared queues
**File:** `/Users/rejaulkarim/Documents/ReZ Full App/analytics-events/src/workers/eventPlatformConsumer.ts`

### Event Types

| Event Name | Trigger | Storage | Growth Events |
|------------|---------|---------|--------------|
| `order.completed` | Order successfully completed | `appevents` | No |
| `payment.success` | Payment processed successfully | `appevents` | No |
| `inventory.low` | Product inventory below threshold | `appevents` | No |
| `ad.impression` | Ad displayed to user | `appevents` | Yes |
| `ad.click` | User clicked on ad | `appevents` | Yes |
| `conversion` | User completed conversion | `appevents` | Yes |
| `campaign.created` | Marketing campaign created | `appevents` | Yes |
| `voucher.issued` | Voucher generated for user | `appevents` | Yes |
| `notification.sent` | Notification delivered | `appevents` | Yes |
| `notification.opened` | User opened notification | `appevents` | Yes |

### Queue Names

| Queue Name | Event Type |
|------------|-----------|
| `events-order-completed` | order.completed |
| `events-payment-success` | payment.success |
| `events-inventory-low` | inventory.low |
| `events-ad-impression` | ad.impression |
| `events-ad-click` | ad.click |
| `events-conversion` | conversion |
| `events-campaign-created` | campaign.created |
| `events-voucher-issued` | voucher.issued |
| `events-notification-sent` | notification.sent |
| `events-notification-opened` | notification.opened |

---

## Scheduler/Internal Events

### Streak At Risk Scheduler

**File:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-notification-events/src/workers/streakAtRiskWorker.ts`

| Field | Description |
|-------|-------------|
| **Schedule** | Daily at 7pm UTC (`0 19 * * *`) |
| **Query** | Users with `store_visit` streak active yesterday but no visit today |
| **Action** | Enqueue `streak_at_risk` notifications |
| **Channels** | push, in_app |
| **Priority** | high |
| **Job Options** | 3 attempts, exponential backoff (5s) |

### Merchant Aggregation Scheduler

**File:** `/Users/rejaulkarim/Documents/ReZ Full App/analytics-events/src/workers/merchantAggregationWorker.ts`

| Field | Description |
|-------|-------------|
| **Schedule** | Daily at 2am UTC (`0 2 * * *`) |
| **Action** | Aggregate merchant analytics for previous day |
| **Metrics** | Daily revenue, unique visitors, new/returning customers, top products |
| **Output** | `merchantanalytics` collection |

### Digest Email Scheduler

**File:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-notification-events/src/routes/internalRoutes.ts`

| Field | Description |
|-------|-------------|
| **Endpoint** | `POST /api/internal/digest/send` |
| **Trigger** | Called by `rez-scheduler-service` (weekly Monday 9am) |
| **Action** | Enqueue digest emails for users with `emailDigestEnabled: true` |
| **Types** | weekly, monthly, custom |
| **Channels** | email, in_app |
| **Batch Size** | 100 per bulk add |

### Push Batch Processor

**File:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-notification-events/src/routes/internalRoutes.ts`

| Field | Description |
|-------|-------------|
| **Endpoint** | `POST /api/internal/push/batch` |
| **Trigger** | Called by `rez-scheduler-service` (every 5 minutes) |
| **Action** | Process pending push notifications from queue |

---

## Notification Channels

**Service:** `REZ-notification-events`
**Supported Channels:** push, email, sms, whatsapp, in_app

### Channel Implementation Details

| Channel | Provider | Implementation | File |
|---------|----------|----------------|------|
| **push** | Expo Push Notifications | `sendPush()` - Looks up user devices from `userdevices` collection, sends via Expo SDK | `worker.ts` |
| **email** | SendGrid | `sendEmail()` - Requires `emailSubject`, resolves email from payload/User lookup | `worker.ts` |
| **sms** | MSG91 | `sendSms()` - Direct MSG91 API call with flow_id | `worker.ts` |
| **whatsapp** | Twilio WhatsApp / Meta WhatsApp Business | `sendWhatsApp()` - Twilio preferred, Meta fallback | `worker.ts` |
| **in_app** | MongoDB | `handleInApp()` - Direct write to `notifications` collection | `worker.ts` |

### Channel Priority

| Channel | Priority | Failure Behavior |
|---------|----------|------------------|
| **push** | critical | Job fails, routes to DLQ |
| **email** | critical | Job fails, routes to DLQ |
| **sms** | optional | Logged, job continues |
| **whatsapp** | optional | Logged, job continues |
| **in_app** | optional | Logged, job continues |

### Rate Limiting

| Limit | Window | Scope |
|-------|--------|-------|
| 50 notifications | 1 hour | Per user, per eventType |
| 200 jobs | 1 second | Global queue limiter |
| 3 concurrent jobs | N/A | Worker concurrency |

### Deduplication

| Key | TTL | Purpose |
|-----|-----|---------|
| `notif:dedup:{eventId}` | 24 hours | Prevent duplicate event processing |

---

## Issues Found

### Critical Issues

| Issue ID | Description | Severity | File |
|----------|-------------|----------|------|
| BE-EVT-002 | Push token missing alerts not reaching monitoring | critical | `worker.ts:129-138` |
| BE-EVT-003 | Email resolution failure causes job to fail silently | critical | `worker.ts:231-245` |
| BAK-NOTIF-001 | Dedup Redis failure - fail-open policy may cause duplicates | critical | `worker.ts:543-552` |
| BAK-NOTIF-002 | SENDGRID_FROM_EMAIL not configured in production | critical | `worker.ts:266-275` |

### High Priority Issues

| Issue ID | Description | Severity | File |
|----------|-------------|----------|------|
| BE-EVT-030 | Channel priority not consistently applied across all paths | high | `worker.ts` |
| BE-EVT-009 | Invalid ObjectId format causes in-app notification failure | high | `worker.ts:404-418` |
| BE-EVT-010 | Critical channel errors not consistently handled | high | `worker.ts:588-630` |
| NTF-012 | Worker concurrency reduced to 3 (may cause throughput issues) | high | `worker.ts:681-683` |

### Medium Priority Issues

| Issue ID | Description | Severity | File |
|----------|-------------|----------|------|
| BE-EVT-016 | Email resolution fallback chain may be incomplete | medium | `worker.ts:199-229` |
| BAK-MEDIA-003 | WhatsApp API version hardcoded (v18.0 will deprecate) | medium | `worker.ts:356-359` |
| NTF-013 | Per-user rate limit (50/hour) may be too restrictive | medium | `worker.ts:497-516` |

### TODO Items

| Location | Description | File |
|----------|-------------|------|
| `intentEventSubscriber.ts:81-83` | Dormant user re-engagement notification not implemented | `services/intentEventSubscriber.ts` |
| `intentEventSubscriber.ts:101-103` | Purchase intent promotional notification not implemented | `services/intentEventSubscriber.ts` |
| `intentEventSubscriber.ts:119-121` | Abandoned cart recovery notification not implemented | `services/intentEventSubscriber.ts` |
| `intentEventSubscriber.ts:138-139` | Win-back campaign notification not implemented | `services/intentEventSubscriber.ts` |

### Known Issues

| Issue ID | Description |
|----------|-------------|
| BAK-CROSS-020 | Queue name mismatch between monolith and standalone service (now resolved by removing suffix) |
| NE-02 | MongoDB connection not confirmed before marking ready (now fixed with ping) |
| C-28 | Job timeout enforcement (lockDuration, stalledInterval) now configured |
| NTF-014 | BullMQ worker defaultJobOptions not inherited (now explicitly passed) |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Total Notification Event Types** | 11 |
| **Total Analytics Event Types** | 10 |
| **Total Intent Event Types** | 4 (0 implemented) |
| **Total Marketing Event Types** | 3 |
| **Total Scheduler Events** | 2 |
| **Total Internal Endpoints** | 2 |
| **Notification Channels** | 5 (push, email, sms, whatsapp, in_app) |
| **Critical Issues** | 4 |
| **High Priority Issues** | 4 |
| **Medium Priority Issues** | 3 |
| **TODO Notifications** | 4 |

---

## Files Audited

### analytics-events

| File | Purpose |
|------|---------|
| `src/index.ts` | Main entry, HTTP API, batch event ingestion |
| `src/worker.ts` | Analytics event queue worker |
| `src/workers/eventPlatformConsumer.ts` | Event platform queue consumers |
| `src/workers/merchantAggregationWorker.ts` | Nightly merchant analytics aggregation |
| `src/routes/eventFlowRoutes.ts` | Event flow monitoring endpoints |
| `src/routes/merchantAnalyticsRoutes.ts` | Merchant analytics API |
| `src/routes/unifiedAnalyticsRoutes.ts` | Unified analytics API |
| `src/routes/benchmarks.ts` | Benchmark data endpoints |
| `src/config/eventPlatform.ts` | Event platform configuration |

### REZ-notification-events

| File | Purpose |
|------|---------|
| `src/index.ts` | Main entry, worker startup, health checks |
| `src/worker.ts` | Notification queue worker, channel handlers |
| `src/schemas/eventSchemas.ts` | Zod schemas for event validation |
| `src/routes/marketing.ts` | Marketing notification endpoints |
| `src/routes/internalRoutes.ts` | Internal scheduler endpoints |
| `src/workers/streakAtRiskWorker.ts` | Streak reminder scheduler |
| `src/workers/dlqWorker.ts` | Dead letter queue handler |
| `src/services/intentEventSubscriber.ts` | ReZ Mind intent subscriber |

---

**Report Generated:** May 7, 2026
**Auditor:** Claude Code
