# PERFORMANCE AGENT - OPTIMIZATION AUDIT
**Generated:** 2026-05-05 18:30
**Agent:** Performance - Speed & Optimization
**Priority:** P0 - Fast, Efficient, Scalable

---

## PERFORMANCE TARGETS

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| API Latency p95 | <200ms | Unknown | ❌ |
| API Latency p99 | <500ms | Unknown | ❌ |
| First Contentful Paint | <1.5s | Unknown | ❌ |
| Time to Interactive | <3s | Unknown | ❌ |
| Error Rate | <0.1% | Unknown | ❌ |
| Uptime | >99.9% | Unknown | ❌ |

---

## KNOWN PERFORMANCE ISSUES

### 🔴 Critical Bottlenecks

1. **No caching strategy**
   - Impact: Repeated DB queries
   - Fix: Add Redis/in-memory cache

2. **No query optimization**
   - Impact: Slow DB responses
   - Fix: Add indexes, optimize queries

3. **No connection pooling**
   - Impact: DB connection exhaustion
   - Fix: Configure Prisma connection pool

4. **No lazy loading**
   - Impact: Slow initial page loads
   - Fix: Implement code splitting

---

## OPTIMIZATION ROADMAP

### Phase 1: Database (This Week)

#### Indexes Needed
```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created ON users(created_at);

-- Transactions table
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Coins table
CREATE INDEX idx_coins_user ON coins(user_id);
CREATE INDEX idx_coins_expires ON coins(expires_at);
```

#### Query Optimization
```typescript
// BAD: N+1 query
const users = await prisma.user.findMany();
for (const user of users) {
  user.orders = await prisma.order.findMany({ where: { userId: user.id }});
}

// GOOD: Single query with include
const users = await prisma.user.findMany({
  include: { orders: true }
});
```

### Phase 2: API (Next Week)

#### Caching Strategy
```typescript
// Layer 1: In-memory cache
const cache = new Map();

// Layer 2: Redis for distributed cache
const redis = new Redis();

// Cache patterns
async function getMenu(id: string) {
  const cacheKey = `menu:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const menu = await prisma.menu.findUnique({...});
  await redis.setex(cacheKey, 3600, JSON.stringify(menu)); // 1hr TTL
  return menu;
}
```

### Phase 3: Frontend (Week 3)

#### Bundle Optimization
```typescript
// Dynamic imports
const MenuPage = dynamic(() => import('./MenuPage'));
const PaymentPage = dynamic(() => import('./PaymentPage'));

// Image optimization
<Image src={src} loading="lazy" placeholder="blur" />
```

---

## LOAD TESTING PLAN

### Test Scenarios
```yaml
scenarios:
  - name: normal_load
    users: 100
    duration: 5m
    ramp: 10s
    
  - name: peak_load
    users: 1000
    duration: 5m
    ramp: 1m
    
  - name: stress_test
    users: 5000
    duration: 5m
    ramp: 30s
```

### Key Endpoints to Test
- `GET /api/menu/:id`
- `POST /api/orders`
- `POST /api/payments`
- `POST /api/coins/redeem`
- `POST /api/auth/login`

---

## MONITORING SETUP

### APM Integration
```typescript
// Add to all API routes
import { trace } from '@opentelemetry/api';

@Injectable()
export class PaymentService {
  async processPayment(orderId: string) {
    const span = trace.getTracer('rez').startSpan('processPayment');
    try {
      // ... payment logic
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.recordException(error);
    } finally {
      span.end();
    }
  }
}
```

### Performance Metrics to Track
```typescript
// Custom metrics
metrics.histogram('api_response_time', duration);
metrics.counter('api_requests_total', { status, endpoint });
metrics.gauge('active_connections', count);
metrics.gauge('queue_depth', depth);
```

---

## PERFORMANCE CHECKLIST

### Pre-Launch
- [ ] Load testing completed
- [x] API latency monitoring (Prometheus metrics)
- [ ] Database queries optimized
- [x] Redis caching implemented
- [ ] CDN configured
- [ ] Images optimized
- [ ] Bundle size <500KB

### Post-Launch
- [ ] Real-user monitoring
- [ ] Synthetic monitoring
- [ ] Alerting configured
- [ ] Dashboards created
- [ ] On-call runbook ready

---

**PERFORMANCE SIGN-OFF: Infrastructure IN PROGRESS - Monitoring active**
