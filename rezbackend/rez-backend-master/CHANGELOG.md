# REZ Backend Changelog

All notable changes to the REZ backend are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- Gold SIP (Systematic Investment Plan) feature with monthly auto-debit
- User product warranty and AMC (Annual Maintenance Contract) tracking
- Enhanced fraud detection with device fingerprinting
- Ledger audit service for transaction reconciliation
- Rate limiting on sensitive financial operations
- Merchant ROI analytics with peak hour detection
- Privé campaign management system
- BBPS (Bharat Bill Payment System) integration

### Fixed
- Contract drift in API response shapes — all endpoints now use standardized response helpers
- Field-level validation errors properly returned in errors array
- Pagination metadata consistent across all list endpoints
- Timestamp format standardized to ISO 8601 UTC

### Security
- Implement input sanitization for PAN, bank account, card numbers
- Rate limiting on referral claims and cashback operations
- Device fingerprint validation on sensitive transactions
- Webhook secret validation for all external integrations

### Performance
- Cache warming on startup for frequently-accessed categories
- Query optimization for leaderboard aggregations
- Connection pooling for external API calls

### Known Issues & TODOs

#### Infrastructure (High Priority)
- **Job Queue:** Currently using synchronous queue in `src/jobs/`. At scale (>10k users/day), migrate to Bee-Queue or Bull with dedicated worker pool
  - Affected: cashback processing, notifications, exports, campaign updates
  - Estimated effort: 2 sprints
- **Merchant Upload Processing:** Sharp image processing blocks request thread. Needs async job queue.
  - Location: `src/merchantroutes/uploads.ts`
  - Estimated effort: 1 sprint

#### Feature Gaps
- **Voucher Integration:** Currently stubbed in `voucherRedemptionService.ts`. Integrate real provider API.
  - Required for: Referral rewards, campaign prizes
  - Estimated effort: 1 sprint
- **Ledger Audit Gaps** (in `ledgerAuditService.ts`):
  - [ ] Balance reconciliation: Compare calculated wallet total vs. DB ledger sum
  - [ ] Exchange rate validation: Verify coin↔rupee conversions use historical rates
  - [ ] Payout verification: Ensure settlement amounts match source transactions
  - Estimated effort: 1.5 sprints
- **Notification Delivery:** Push/SMS/Email send confirmation not yet integrated
  - Location: `services/userProductService.ts`, `campaignProgressJob.ts`
  - Estimated effort: 1 sprint

#### Monitoring & Observability
- [ ] Push notification delivery tracking
- [ ] Voucher redemption success rate monitoring
- [ ] Ledger discrepancy alerts
- [ ] Device fingerprint failure rate tracking

#### Testing Coverage
- [ ] Regression coverage for refresh token security (see `src/__tests__/routes/auth.test.ts`)
- [ ] End-to-end payment flow tests with Razorpay webhooks
- [ ] Order placement → cashback distribution → settlement flow
- [ ] Merchant settlement calculation and payout edge cases

---

## [1.0.0] — 2026-03-23

### Initial Release
Complete backend for REZ consumer and merchant platforms with full auth, commerce, payments, and wallet features.

### Major Features
- **Authentication:** JWT tokens with refresh rotation, device fingerprinting
- **Commerce:** Product catalog, wishlists, carts, orders, returns
- **Payments:** Razorpay & Stripe integration with webhook processing
- **Wallet:** Ledger-based cashback, coins, referral rewards
- **Notifications:** Firebase FCM, Twilio SMS, SendGrid email
- **Merchant Tools:** Dashboard, product mgmt, settlement analytics, team management
- **Admin Dashboard:** User management, fraud detection, ROI tracking

### API Response Format
- Standardized: `{ success: boolean, data?, message?: string, errors?: [], meta? }`
- Pagination: `meta.pagination = { page, limit, total, pages }`
- Timestamps: ISO 8601 UTC format

### Database Schema
- Users, Merchants, Products, Orders, Transactions
- Wallet & Ledger entries (coin accounting)
- Campaign, Referral, and Reward management
- Audit logs for compliance

### Testing
- Unit tests for services (jest)
- Integration tests for API routes
- Placeholder E2E tests structure

### Documentation
- This CHANGELOG
- README with setup & API contract
- .env.example with all required variables
- Inline JSDoc for critical functions

---

## Notes for Release Engineering

### Contract Stability
- All 4 apps (Backend, Consumer, Merchant, Admin) use standardized API response format
- Frontend services have TypeScript return types matching backend responses
- Breaking changes require major version bump + deprecation notice (1 sprint min)

### Health Checks Pre-Release
- [ ] `npm run test` passes all suites
- [ ] No unhandled TODO comments in src/ (production code)
- [ ] .env.example documents all required variables
- [ ] Response shapes verified against frontend integration tests
- [ ] Merchant settlement calculations audited
- [ ] Payment webhook processing tested end-to-end

### Rollback Plan
- Git tag for all major releases: `v1.0.0`, etc.
- Database migrations logged in `MIGRATIONS.md` (TODO)
- Consumer app lockout: If backend API contract breaks, set `API_MIN_VERSION` env var
- Monitoring: Sentry alerts on 5xx+ 1% traffic, NewRelic alerts on P99 latency > 500ms

### Metrics to Track
- API response time distribution (P50, P95, P99)
- Error rate by endpoint (5xx, 4xx)
- Payment success/failure rate
- Webhook processing latency
- Ledger discrepancies (via audit service)
- Job queue backlog size

---

See REGRESSION_SAFETY.md for complete release checklist.
