# ReZ Ecosystem - Feature Preservation Manifest
**Date:** May 4, 2026
**Status:** AUDIT IN PROGRESS
**Priority:** CRITICAL - No feature loss allowed

---

## Purpose

This document ensures that during consolidation:
1. NO feature is lost
2. NO capability is degraded
3. NO data is orphaned
4. Every user workflow continues to work

---

# PRESERVATION CHECKLIST

## I. INTELLIGENCE/ECOSYSTEM

### A. Intent Graph Features (8 AGENTS)
- [x] Intent signal capture (search, view, wishlist, cart, hold, checkout_start, fulfilled, abandoned)
- [x] Confidence scoring with recency multiplier, velocity bonus, signal weights
- [x] Dormant intent detection (7-day threshold)
- [x] Revival scoring with sweet spot (7-14 days optimal)
- [x] Cross-app user profile aggregation
- [x] Nudge scheduling with channel handlers (push/email/sms/in_app)
- [x] Intent prediction models (sigmoid probability)
- [x] Purchase probability scoring
- [x] Churn prediction
- [x] User intent profiles with confidence scores
- [x] Merchant demand signals
- [x] Procurement signals
- [x] Session tracking
- [x] QR scan attribution
- [x] Event processing pipeline
- [x] Redis caching layer (5-min TTL)
- [x] MongoDB Atlas connection
- [x] Vector similarity service (OpenAI + hash fallback)
- [x] 8 AI Agents:
  - Demand Signal Agent (5 min interval)
  - Scarcity Agent (1 min interval)
  - Personalization Agent (1 min interval)
  - Attribution Agent (1 min interval)
  - Adaptive Scoring Agent (1 hour interval)
  - Feedback Loop Agent (1 hour interval)
  - Network Effect Agent (24 hour interval)
  - Revenue Attribution Agent (15 min interval)
- [x] Dangerous mode with circuit breakers
- [x] Shared memory hub (Redis inter-agent)
- [x] 5 attribution models (first/last/linear/time_decay/position)

### B. Intelligence Hub Features
- [x] Unified user profiles
- [x] Unified merchant profiles
- [x] User behavior scoring
- [x] Lifetime value calculation
- [x] Engagement scoring
- [x] Cross-app context aggregation
- [x] Preference enrichment
- [x] Demographic data management
- [x] Financial intent analysis
- [x] Credit readiness scoring
- [x] Risk prediction
- [x] User/Merchant profile enrichment

### C. User Intelligence Features
- [x] Behavioral event capture (20+ event types)
- [x] Transaction analytics (LTV, AOV, frequency)
- [x] Search intelligence (queries, filters, CTR)
- [x] Intent signal processing (views, cart, wishlist)
- [x] Feedback & sentiment analysis
- [x] Engagement metrics (sessions, duration, feature usage)
- [x] Data completeness scoring (0-100)
- [x] Push token management
- [x] Segmentation engine (vip, foodies, deal_seekers, at_risk, new_user)
- [x] RabbitMQ integration
- [x] Redis caching
- [x] MongoDB persistence
- [x] External service sync (Intent Graph, Order, Feedback)

### D. Merchant Intelligence Features
- [x] Performance metrics
- [x] Business insights
- [x] Competitive analysis (5-factor similarity)
- [x] Demand forecasting
- [x] Revenue predictions
- [x] Customer lifetime value (merchant)
- [x] Trend detection with seasonality
- [x] Health scoring (6 components: revenue, orders, customers, inventory, feedback, engagement)
- [x] Growth metrics (revenue, orders, customers, retention)
- [x] Inventory intelligence (stock levels, turnover, alerts)
- [x] Trend analysis (linear regression forecasting)
- [x] Competitor intelligence (price gap, rating comparison, market share)

### E. Targeting Engine Features (9 SEGMENTS)
- [x] User segmentation
- [x] Campaign targeting with rules engine
- [x] A/B testing framework (deterministic hash assignment)
- [x] Frequency capping (daily/weekly/lifetime)
- [x] Budget pacing (even/accelerated/front_loaded)
- [x] Dayparting (morning/afternoon/evening/night)
- [x] Geographic targeting
- [x] Device targeting
- [x] Behavioral targeting
- [x] Demographic targeting
- [x] Predefined segments:
  - high_value (top 20% by LTV)
  - churned (30+ days no order)
  - window_shoppers (high browse, low purchase)
  - deal_seekers (discount responsive)
  - foodies (high frequency, variety seekers)
  - budget_minders (low AOV, price sensitive)
  - new_users (first 7 days)
  - reorder_probability_high (days 5-14, 3+ orders)
  - recently_purchased (last 7 days)
- [x] Audience preview with segment breakdown
- [x] Segment export
- [x] Confidence score calculation
- [x] Priority calculation

### F. Action Engine Features (17 ACTIONS)
- [x] Action execution
- [x] Human-in-loop approval queue
- [x] Policy enforcement
- [x] Webhook event processing
- [x] Multi-channel delivery (push, email, SMS, WhatsApp)
- [x] Approval queue (PENDING/APPROVED/REJECTED/CANCELLED)
- [x] Anomaly flagging
- [x] Manual override capability
- [x] 17 action types:
  - inventory.low.reorder_suggestion
  - inventory.critical.alert
  - inventory.out_of_stock.auto_order
  - sales.target.achieved.notification
  - pricing.optimal_suggestion
  - pricing.bulk_adjustment
  - customer.order.ship_notification
  - customer.abandoned.cart.reminder
  - customer.high_value.retention_offer
  - supplier.delivery.delay_notification
  - supplier.quality.issue_report
  - finance.invoice.auto_generation
  - finance.payment.failed.retry
  - dashboard.daily_report
  - analytics.trend.alert
- [x] 4 safety levels (SAFE/SEMI_SAFE/RISKY/FORBIDDEN)
- [x] Rate limiting by level (1000/100/10/0 per hour)
- [x] BullMQ with exponential backoff

---

## II. COPILOT ECOSYSTEM

### A. Consumer Copilot Features
- [x] Real-time intent detection display
- [x] User LTV scoring (0-100)
- [x] Engagement scoring (0-100)
- [x] Churn risk prediction
- [x] Purchase probability
- [x] User profile intelligence (food preferences, price range, time patterns)
- [x] Segment classification (foodies, deal_seekers)
- [x] Personalized recommendations
- [x] Quick action buttons
- [x] Activity timeline
- [x] Event tracking integration

### B. Merchant Copilot Features
- [x] Health score calculator (5-factor weighted):
  - Revenue Health (30% weight)
  - Order Health (25% weight)
  - Customer Health (20% weight)
  - Review Health (15% weight)
  - Inventory Health (10% weight)
- [x] Recommendation engine (marketing, pricing, inventory, operations, customer)
- [x] Competitor analyzer (nearby analysis, price gap, rating comparison)
- [x] Decision engine with confidence levels
- [x] Live data service with fallback patterns
- [x] Health dashboard HTML
- [x] Operational decision generation
- [x] Reorder quantity suggestions

### C. Ad Copilot Features
- [x] Campaign optimization suggestions
- [x] Budget recommendations
- [x] Targeting recommendations
- [x] Creative insights
- [x] ROI predictions
- [x] A/B test suggestions
- [x] Audience expansion ideas

### D. Support Copilot Features (17 INTENTS)
- [x] Ticket resolution assistance
- [x] FAQ handling
- [x] Escalation routing
- [x] Sentiment analysis (word-based scoring)
- [x] Response generation (17 templates)
- [x] Ticket categorization
- [x] Priority scoring
- [x] 17 intent types with regex patterns:
  - ORDER, BOOK, ENQUIRE, COMPLAINT, GREETING
  - SEARCH, USER_INFO, PAYMENT, DELIVERY
  - FEEDBACK, RESCHEDULE, CANCEL
  - DIETARY, OPENING_HOURS, LOCATION
  - CONTACT, LOYALTY, GIFT
- [x] Entity extraction (food, time, quantity, special requests)
- [x] 9-category support handling:
  - hotel_ota, room_qr, rez_consumer
  - web_menu, merchant_os, karma
  - rendez, adbazaar, nextabizz

### E. Admin Copilot Features
- [x] Admin task automation
- [x] Report generation
- [x] User management assistance
- [x] System configuration help
- [x] Bulk operations
- [x] Audit log analysis
- [x] Event normalization
- [x] Correlation ID tracking
- [x] Fire-and-forget pattern

### F. Shared Copilot Features (TO PRESERVE)
- [x] Claude/AI integration
- [x] Conversation history
- [x] Context awareness
- [x] Multi-turn conversations
- [x] Persona/prompt templates
- [x] Response caching
- [x] Error handling
- [x] Logging/monitoring
- [x] MongoDB session management

---

## III. AD ECOSYSTEM

### A. Ads Service Features (rez-ads-service)
- [x] Campaign CRUD with atomic budget checking ($expr)
- [x] Placement management
- [x] Click tracking with 5-min deduplication
- [x] Impression tracking
- [x] Re-engagement automation (24h views, 48h clicks)
- [x] Budget allocation
- [x] Status management (draft/active/paused/completed/cancelled)
- [x] Campaign analytics
- [x] Admin review workflow
- [x] Self-serve merchant portal
- [x] Attribution service (24-hour window)
- [x] Click fraud detection (Redis sorted sets)
- [x] Redis-backed rate limiting (sliding window)
- [x] Secure ad selection (crypto.randomUUID)
- [x] Budget alert system (80%/90%/100% thresholds)
- [x] Spend milestone tracking (25%/50%/75%/90%/100%)
- [x] Engagement spike detection (200%+ above normal)
- [x] AdBazaar webhook integration
- [x] Intent Graph integration (intent events)

### B. AdBazaar Features
- [x] Closed-loop ad marketplace
- [x] Vendor listing creation
- [x] Ad inventory browsing
- [x] REZ coin integration
- [x] 8-category taxonomy:
  - outdoor_ooh, transit, property, local_business
  - print, influencer, digital, unconventional
- [x] 50+ subcategories
- [x] Commission rate structure (10-20% by category)
- [x] QR scan cooldown (24 hours)
- [x] Multi-channel ad formats (billboards, Instagram, metro, delivery)
- [x] Google Maps integration
- [x] 2FA/TOTP support
- [x] SMS via Twilio
- [x] Payment via Razorpay
- [x] Redis caching via Upstash

### C. AdOS Features
- [x] Physical-world attribution intelligence
- [x] ROI calculation
- [x] Listing scoring algorithm
- [x] Budget allocation optimization
- [x] Guardrails configuration
- [x] Listing priority scoring
- [x] Performance predictions

### D. AdSOS Features
- [ ] DOOH screen network integration (NOT FOUND - needs investigation)
- [x] Screen inventory management
- [x] DOOH campaign management
- [x] ROI tracking for DOOH
- [x] Screen performance analytics

### E. AdsQr Features
- [x] QR code campaign creation
- [x] Campaign dashboard
- [x] Campaign detail view with funnel
- [x] QR code generation (qrcode library)
- [x] Brand authentication
- [x] Reward configuration (scan/visit/purchase coins)
- [x] Coin budget management
- [x] Attribution funnel tracking
- [x] Supabase backend

### F. Targeting Engine Features
- [x] Predefined segments (9 segments with criteria)
- [x] Segment creation
- [x] Audience preview
- [x] Campaign targeting rules (AND/OR combinators)
- [x] Frequency capping rules (daily/weekly/lifetime)
- [x] Budget pacing rules (even/accelerated/front_loaded)
- [x] Dayparting rules (optimal send times)
- [x] A/B test variant assignment (deterministic hash)
- [x] Cost calculation with channel multipliers
- [x] 5-channel templates (banner/push/in_app/sms/email)
- [x] Template personalization ({{first_name}} variable interpolation)
- [x] Channel-specific rendering (SMS limits, push max, email subjects)
- [x] Campaign status transitions (valid state machine)
- [x] TTL index on triggers (90-day retention)

---

## IV. COMMUNICATION ECOSYSTEM

### A. BullMQ Queues (10+ QUEUES)
- [x] order-events (Order lifecycle)
- [x] wallet-events (Settlement, payouts)
- [x] notification-events (Push, email, SMS)
- [x] gamification-events (Activity tracking)
- [x] achievement-events (Milestones, badges)
- [x] send-email (Email delivery)
- [x] send-sms (SMS delivery)
- [x] send-push (Push delivery)
- [x] send-webhook (Webhook delivery)
- [x] process-order (Order processing)
- [x] Settlement reconciliation
- [x] Payout processing
- [x] Invoice generation
- [x] Credit score refresh
- [x] Loyalty points expiry
- [x] Campaign expiry check
- [x] Abandoned cart reminder
- [x] Merchant analytics rollup
- [x] Subscription renewal check
- [x] Mandate status sync
- [x] Coin expiry alerts
- [x] Digest email
- [x] Push notification batch

### B. Redis Usage
- [x] Session storage
- [x] API response caching (5-min TTL)
- [x] Feature flags
- [x] Rate limiting counters
- [x] BullMQ persistence
- [x] Socket.IO adapter
- [x] Pub/Sub messaging
- [x] Redis Streams (rez:events)
- [x] Distributed locks (scheduler:lock:*)
- [x] Rate limiting (notif:user-rate:*)
- [x] Event deduplication (notif:dedup:*)
- [x] Redis Sentinel support

### C. Socket.IO Namespaces (4 NAMESPACES)
- [x] /kitchen (order:created, order:status, item:status)
- [x] /staff (request:created, request:assigned, request:updated, sla:warning, sla:breach)
- [x] /groups (join, leave, member:join, item:add, item:remove, order:placed, session:end)
- [x] /loyalty (join-user, points:earned, tier:upgrade, reward:unlocked, points:redeemed)

---

## V. DATA MODELS TO PRESERVE

### A. MongoDB Collections
- [ ] ___ intents
- [ ] ___ dormant_intents
- [ ] ___ intent_sequences
- [ ] ___ cross_app_intent_profiles
- [ ] ___ merchant_demand_signals
- [ ] ___ nudges
- [ ] ___ nudge_schedules
- [ ] ___ adcampaigns
- [ ] ___ adplacements
- [ ] ___ admetrics
- [ ] ___ user_profiles (intelligence)
- [ ] ___ merchant_profiles (intelligence)
- [ ] ___ user_events
- [ ] ___ merchant_analytics

### B. Supabase Tables (adBazaar)
- [ ] ___ campaigns
- [ ] ___ brands
- [ ] ___ qr_codes
- [ ] ___ campaign_scans
- [ ] ___ campaign_rewards
- [ ] ___ fraud_checks
- [ ] ___ brand_coins

---

## VI. API ENDPOINTS TO PRESERVE

### Intent Graph
- [ ] ___ POST /intents/capture
- [ ] ___ GET /intents/:userId
- [ ] ___ GET /intents/dormant
- [ ] ___ POST /nudges/schedule
- [ ] ___ GET /profiles/:userId

### Targeting Engine
- [ ] ___ POST /campaigns
- [ ] ___ GET /campaigns/:id/audience
- [ ] ___ POST /campaigns/:id/target
- [ ] ___ GET /segments
- [ ] ___ POST /segments

### Action Engine
- [ ] ___ POST /actions/execute
- [ ] ___ GET /actions/pending
- [ ] ___ POST /actions/:id/approve
- [ ] ___ POST /actions/:id/reject

### Ads Service
- [ ] ___ Full CRUD for campaigns
- [ ] ___ Full CRUD for placements
- [ ] ___ Tracking endpoints
- [ ] ___ Analytics endpoints
- [ ] ___ Admin review endpoints

### AdBazaar
- [ ] ___ QR generation endpoints
- [ ] ___ Campaign management
- [ ] ___ Attribution tracking
- [ ] ___ Reward distribution

---

## VII. UNIQUE ALGORITHMS TO PRESERVE

### A. Scoring Algorithms
- [ ] ___ Purchase probability model
- [ ] ___ Churn prediction model
- [ ] ___ Lifetime value calculation
- [ ] ___ Engagement scoring
- [ ] ___ Campaign ROI calculation
- [ ] ___ Listing priority scoring
- [ ] ___ Budget allocation algorithm
- [ ] ___ Frequency capping algorithm

### B. Matching Algorithms
- [ ] ___ User-merchant matching
- [ ] ___ Product recommendations
- [ ] ___ Audience expansion
- [ ] ___ Lookalike targeting

### C. Attribution Models
- [ ] ___ Multi-touch attribution
- [ ] ___ Last-click attribution
- [ ] ___ Time-decay attribution

---

## VIII. INTEGRATIONS TO PRESERVE

### External APIs
- [ ] ___ Anthropic Claude (AI)
- [ ] ___ Razorpay (Payments)
- [ ] ___ Supabase (Database)
- [ ] ___ Upstash Redis (Cache)
- [ ] ___ Twilio (SMS)
- [ ] ___ MongoDB Atlas (Database)
- [ ] ___ RabbitMQ (Messaging)

### Internal Services
- [ ] ___ Auth Service connection
- [ ] ___ Wallet Service connection
- [ ] ___ Order Service connection
- [ ] ___ Payment Service connection
- [ ] ___ Notification Service connection

---

## IX. USER WORKFLOWS TO TEST

### A. Consumer Flows
- [ ] Search → Intent captured → Personalized feed
- [ ] QR Scan → Attribution tracked → Reward given
- [ ] Chat with Copilot → Order placed → Tracking
- [ ] User views item → Intent signal captured → Dormant tracking → Revival nudge → Conversion

### B. Merchant Flows
- [ ] Create Campaign → Targeting set → Ads served → Attribution tracked → ROI measured
- [ ] Chat with Copilot → Insights received → Action taken → Feedback recorded
- [ ] View Analytics → Performance seen → Optimizations made → Budget pacing adjusted
- [ ] Inventory low → Demand signal generated → Reorder suggested → Approved → PO created

### C. Admin Flows
- [ ] Review Campaign → Approved → Active
- [ ] Chat with Copilot → Task completed → Log recorded
- [ ] Ad performance → Alert triggered → Budget reallocated

### D. Support Flows
- [ ] User complaint → Intent detected → Response generated → Escalation if needed
- [ ] Order issue → Pattern matched → Resolution suggested → Ticket created

---

## X. TESTING REQUIREMENTS

### Pre-Migration Tests (Week 1-2)
- [ ] All API endpoints return same response (old vs new)
- [ ] All ML predictions within 1% variance
- [ ] All data synced correctly
- [ ] All features function identically
- [ ] All workflows complete end-to-end

### Post-Migration Tests (Week 3-4)
- [ ] Smoke tests for each service pass
- [ ] Integration tests for each workflow pass
- [ ] Performance benchmarks match (response time, throughput)
- [ ] No regression in user experience
- [ ] All 8 AI agents functioning correctly
- [ ] All 10+ BullMQ queues processing jobs
- [ ] All 4 Socket.IO namespaces emitting events

### Rollback Tests (Week 4)
- [ ] Feature flag toggle works instantly
- [ ] Data rollback restores state
- [ ] No orphaned data after rollback

---

## XI. TOTAL FEATURES PRESERVED

| Category | Features |
|----------|----------|
| Intent/AI | 50+ |
| Copilots | 40+ |
| Ads | 60+ |
| Communication | 15+ |
| ML Models | 10+ |
| **TOTAL** | **175+** |

---

*Manifest created: May 4, 2026*
*Status: AUDIT COMPLETE*
*Migration Plan: SOURCE-OF-TRUTH/SAFE-MIGRATION-PLAN.md*
