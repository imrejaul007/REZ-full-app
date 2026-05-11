# Communication Layer Responsibilities

## Layer 1: Redis
**Use Redis for:**
- Session storage
- API response caching (5-min TTL)
- Feature flags
- Rate limiting counters
- BullMQ persistence
- Pub/Sub messaging
- Simple counters/flags

**Don't use Redis for:**
- Background processing
- Job tracking
- Complex workflows

## Layer 2: BullMQ
**Use BullMQ for:**
- Email sending
- SMS sending
- Push notifications
- Webhook delivery
- Scheduled tasks
- Batch processing
- Image processing

**Don't use BullMQ for:**
- Real-time updates
- Session data
- Simple caching

## Layer 3: Socket.IO
**Use Socket.IO for:**
- Order status updates
- Chat messages
- Kitchen display updates
- Staff notifications
- Live data sync

**Don't use Socket.IO for:**
- Fire-and-forget events
- Batch operations
- Heavy payloads

## Examples

### Redis (Fast Cache)
```typescript
// GOOD: Caching API responses
await redis.setex(`user:${id}`, 300, JSON.stringify(data));

// BAD: Job processing in Redis
await redis.lpush('jobs', JSON.stringify(job));
// Use BullMQ instead
```

### BullMQ (Async Jobs)
```typescript
// GOOD: Email sending
await emailQueue.add('send-email', { to, template });
```

### Socket.IO (Real-time)
```typescript
// GOOD: Order status updates
io.to(`order:${id}`).emit('status', { status });
```

## Redis Keys Pattern
```
cache:{entity}:{id} - TTL 5min
rate:{service}:{userId} - Sliding window
feature:{flag} - No TTL
queue:{name}:{id} - BullMQ
session:{id} - Redis
```

## BullMQ Queue Names
```
email:default
sms:default
push:default
webhook:default
```

## Socket.IO Namespaces
```
/kitchen - Order updates
/staff - Staff notifications
/chat - Messages
```

---

# Feature Flags

## Enable New Services
```env
USE_NEW_INTENT_SERVICE=false
USE_NEW_COPILOT=false
USE_NEW_DECISION_SERVICE=false
USE_NEW_AD_PLATFORM=false
```

## Quick Toggle
```bash
# Enable new service
export USE_NEW_INTENT_SERVICE=true

# Instant rollback
export USE_NEW_INTENT_SERVICE=false
```

---

# Architecture Rules

## Redis
- Session storage
- Response caching
- Rate limiting
- Feature flags

## BullMQ
- Async email/SMS/push
- Webhooks
- Scheduled jobs

## Socket.IO
- Order updates
- Chat
- KDS
- Notifications
