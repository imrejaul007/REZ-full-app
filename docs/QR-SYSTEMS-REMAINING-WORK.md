# QR Systems - Complete Remaining Work Audit

**Date:** May 3, 2026  
**Status:** In Progress

---

## EXECUTIVE SUMMARY

### What's Built (✅)
- Group Ordering APIs + Components
- Kitchen Display (KDS) APIs + Components
- Loyalty System (Package + APIs)
- Karma-Loyalty Engine
- Hotel Staff Dashboard (all pages)
- Room QR Enhancements
- Ads QR Enhancements
- WhatsApp + RAG Chatbot
- REZ Mind Integration

### What's Missing (❌)
- Database Migrations
- Environment Variables
- Integration Tests
- Socket.IO Setup
- Push Notifications
- LLM/RAG Setup

---

# 1. DATABASE MIGRATIONS

## Priority: HIGH

### rez-now (PostgreSQL)

```sql
-- loyalty_visits table
CREATE TABLE loyalty_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID NOT NULL,
  visit_type VARCHAR(50) DEFAULT 'dine_in',
  visit_date TIMESTAMP DEFAULT NOW(),
  coins_earned INTEGER DEFAULT 0,
  karma_level VARCHAR(20),
  loyalty_tier VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_loyalty_visits_user ON loyalty_visits(user_id);
CREATE INDEX idx_loyalty_visits_store ON loyalty_visits(store_id);
CREATE INDEX idx_loyalty_visits_date ON loyalty_visits(visit_date);

-- loyalty_streaks table
CREATE TABLE loyalty_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  streak_type VARCHAR(20) NOT NULL, -- login, order, review, savings, visit
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity TIMESTAMP,
  streak_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- loyalty_milestones table
CREATE TABLE loyalty_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  milestone_type VARCHAR(20) NOT NULL, -- visit, order, streak, spending
  milestone_id VARCHAR(50) NOT NULL,
  target INTEGER NOT NULL,
  current INTEGER DEFAULT 0,
  reached BOOLEAN DEFAULT FALSE,
  reached_at TIMESTAMP,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_loyalty_milestones_user_type ON loyalty_milestones(user_id, milestone_id);

-- loyalty_badges table
CREATE TABLE loyalty_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
  earned_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_loyalty_badges_user_badge ON loyalty_badges(user_id, badge_id);

-- group_sessions table
CREATE TABLE group_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code VARCHAR(6) UNIQUE NOT NULL,
  store_id UUID NOT NULL,
  host_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  settings JSONB DEFAULT '{}'
);

CREATE INDEX idx_group_sessions_code ON group_sessions(session_code);
CREATE INDEX idx_group_sessions_store ON group_sessions(store_id);

-- group_members table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES group_sessions(id),
  user_id UUID NOT NULL,
  user_name VARCHAR(100),
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  UNIQUE(session_id, user_id)
);

-- group_items table
CREATE TABLE group_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES group_sessions(id),
  user_id UUID NOT NULL,
  item_id UUID NOT NULL,
  item_name VARCHAR(200),
  price DECIMAL(10,2),
  quantity INTEGER DEFAULT 1,
  added_at TIMESTAMP DEFAULT NOW()
);

-- kds_orders table
CREATE TABLE kds_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  store_id UUID NOT NULL,
  table_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending', -- pending, preparing, ready, served
  created_at TIMESTAMP DEFAULT NOW(),
  estimated_ready_at TIMESTAMP
);

CREATE INDEX idx_kds_orders_store ON kds_orders(store_id);
CREATE INDEX idx_kds_orders_status ON kds_orders(status);

-- kds_order_items table
CREATE TABLE kds_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kds_order_id UUID REFERENCES kds_orders(id),
  item_id UUID NOT NULL,
  item_name VARCHAR(200) NOT NULL,
  quantity INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- room_bundles table
CREATE TABLE room_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL,
  bundle_name VARCHAR(100) NOT NULL,
  bundle_type VARCHAR(50) NOT NULL, -- romantic_dinner, spa_combo, late_checkout, etc.
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- pre_arrival_prefs table
CREATE TABLE pre_arrival_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  guest_id UUID NOT NULL,
  temperature INTEGER DEFAULT 24,
  lighting VARCHAR(20) DEFAULT 'medium',
  pillow_type VARCHAR(20) DEFAULT 'medium',
  dietary_restrictions JSONB DEFAULT '[]',
  allergies JSONB DEFAULT '[]',
  special_occasion VARCHAR(100),
  early_checkin BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### adsqr (Supabase/PostgreSQL)

```sql
-- fraud_checks table
CREATE TABLE fraud_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL,
  device_id VARCHAR(255),
  ip_address INET,
  location JSONB,
  risk_score DECIMAL(3,2) DEFAULT 0,
  checks_passed JSONB DEFAULT '[]',
  checks_failed JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'pass', -- pass, flag, block
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fraud_checks_device ON fraud_checks(device_id);
CREATE INDEX idx_fraud_checks_status ON fraud_checks(status);

-- brand_coins table
CREATE TABLE brand_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  coin_name VARCHAR(50) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  value_per_coin DECIMAL(10,2) DEFAULT 0.01,
  total_supply INTEGER,
  expiration_days INTEGER DEFAULT 365,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- brand_coin_balances table
CREATE TABLE brand_coin_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  balance INTEGER DEFAULT 0,
  earned_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(user_id, brand_id)
);

-- brand_coin_transactions table
CREATE TABLE brand_coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL, -- earned, spent, expired
  source VARCHAR(50),
  campaign_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_brand_transactions_user ON brand_coin_transactions(user_id);
CREATE INDEX idx_brand_transactions_brand ON brand_coin_transactions(brand_id);

-- sample_requests table
CREATE TABLE sample_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  user_id UUID NOT NULL,
  sample_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, fulfilled, claimed, expired
  pickup_code VARCHAR(10),
  pickup_expires_at TIMESTAMP,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sample_requests_user ON sample_requests(user_id);
CREATE INDEX idx_sample_requests_status ON sample_requests(status);
CREATE UNIQUE INDEX idx_sample_requests_code ON sample_requests(pickup_code);
```

---

# 2. ENVIRONMENT VARIABLES

## Priority: HIGH

### rez-now/.env.example

```bash
# API URLs
NEXT_PUBLIC_API_URL=https://api.rez.money
NEXT_PUBLIC_APP_URL=https://rez.money

# Authentication
AUTH_TOKEN=xxx
AUTH_REFRESH_TOKEN=xxx

# REZ Services
REZ_AUTH_URL=https://auth.rez.money
REZ_WALLET_URL=https://wallet.rez.money
REZ_PAYMENT_URL=https://payment.rez.money
REZ_MIND_URL=https://mind.rez.money
REZ_CHAT_URL=https://chat.rez.money

# WhatsApp Business API
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_ACCESS_TOKEN=xxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xxx

# LLM for RAG Chatbot
LLM_API_URL=https://api.anthropic.com/v1/messages
LLM_API_KEY=xxx
LLM_MODEL=claude-3-sonnet

# Push Notifications
FCM_SERVER_KEY=xxx

# Database
DATABASE_URL=postgresql://xxx
```

### adsqr/.env.example

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Fraud Detection
FRAUD_CHECK_API_URL=https://fraud-api.rez.money
FRAUD_API_KEY=xxx

# Brand Coins
BRAND_COIN_ISSUER=xxx
BRAND_COIN_SECRET=xxx
```

### Hotel OTA/.env.example

```bash
# API
HOTEL_API_URL=https://hotel-api.rez.money
MAKCORPS_API_KEY=xxx
STAYOWN_API_URL=https://stayown.rez.money
STAYOWN_API_KEY=xxx

# WebSocket
SOCKET_URL=wss://socket.rez.money
```

---

# 3. INTEGRATION TESTS

## Priority: MEDIUM

### Test Files to Create

```typescript
// rez-now/__tests__/loyalty-flow.test.ts
describe('Loyalty Flow', () => {
  it('should record visit after order', async () => {
    // 1. Place order
    // 2. Record visit
    // 3. Award coins
    // 4. Check milestone
    // 5. Verify database
  });

  it('should upgrade tier after threshold', async () => {
    // Spend enough to upgrade tier
    // Verify tier upgrade
  });
});

// rez-now/__tests__/group-ordering.test.ts
describe('Group Ordering', () => {
  it('should create session and share items', async () => {
    // Create session
    // Add items
    // Share session
    // Verify items shared
  });
});

// adsqr/__tests__/fraud-detection.test.ts
describe('Fraud Detection', () => {
  it('should block suspicious scan', async () => {
    // Simulate VPN/proxy scan
    // Verify blocked
  });
});
```

---

# 4. SOCKET.IO SETUP

## Priority: MEDIUM

### Tasks
1. Configure Socket.IO server
2. Connect KDS to kitchen displays
3. Connect staff dashboard to real-time
4. Connect group ordering

### Socket Events

```typescript
// Kitchen events
'order:created'
'order:updated'
'item:status_changed'

// Staff events
'request:new'
'request:assigned'
'request:completed'
'sla:warning'
'sla:breach'

// Group ordering events
'session:created'
'session:member_joined'
'item:shared'
'order:ready'
```

---

# 5. PUSH NOTIFICATIONS

## Priority: LOW

### Tasks
1. Firebase Cloud Messaging setup
2. Staff push tokens
3. Guest push tokens
4. Notification templates

### Templates

```typescript
const templates = {
  new_order: 'New order #{{orderId}} received',
  sla_warning: 'Request #{{requestId}} is taking longer than expected',
  milestone_reached: 'Congratulations! You reached {{milestone}}!',
  streak_at_risk: 'Your streak is at risk! Check in today to keep it alive',
  offer_unlocked: 'You unlocked {{offerName}}! Claim before {{expires}}'
};
```

---

# 6. LLM/RAG SETUP

## Priority: LOW

### Tasks
1. Anthropic API key setup
2. Vector database (Pinecone/Supabase)
3. RAG knowledge base indexing
4. Chat widget integration

---

# IMPLEMENTATION ORDER

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 1 | Database migrations | HIGH | 4 hours |
| 2 | Environment variables | HIGH | 1 hour |
| 3 | Socket.IO setup | MEDIUM | 4 hours |
| 4 | Integration tests | MEDIUM | 4 hours |
| 5 | Push notifications | LOW | 4 hours |
| 6 | LLM/RAG setup | LOW | 4 hours |

**Total: ~21 hours**

---

*Document Generated: May 3, 2026*
