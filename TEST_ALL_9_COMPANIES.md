# REZ PLATFORM - COMPLETE INTEGRATION TEST SUITE
**Date:** May 12, 2026
**Scope:** All 9 Companies | 150+ Services | 200+ Connections

---

## TEST EXECUTION PLAN

### Phase 1: Infrastructure Layer (RABTUL-Technologies)
### Phase 2: Intelligence Layer (REZ-Intelligence)
### Phase 3: Commerce Layer (REZ-Merchant + REZ-Consumer)
### Phase 4: Engagement Layer (REZ-Media)
### Phase 5: Trust Layer (RTNM-Group)
### Phase 6: Industry OS (StayOwn-Hospitality)
### Phase 7: Enterprise (CorpPerks)
### Phase 8: Operations (RTNM-Digital)
### Phase 9: Cross-Platform Integration Tests

---

## PHASE 1: RABTUL-TECHNOLOGIES (Infrastructure)

### Service: rez-auth-service
```
[ ] POST /api/auth/register - User registration
[ ] POST /api/auth/login - User login
[ ] POST /api/auth/refresh - Token refresh
[ ] POST /api/auth/verify - Token verification
[ ] POST /api/auth/mfa/setup - MFA setup
[ ] POST /api/auth/logout - Logout (blacklist token)
```

### Service: rez-wallet-service
```
[ ] POST /api/wallet/create - Create wallet
[ ] GET /api/wallet/:userId - Get wallet
[ ] POST /api/wallet/add - Add funds
[ ] POST /api/wallet/deduct - Deduct funds
[ ] POST /api/wallet/transfer - Transfer between users
[ ] GET /api/wallet/:userId/transactions - Transaction history
[ ] POST /api/wallet/earn - Earn rewards (external call)
```

### Service: rez-payment-service
```
[ ] POST /api/payments/create - Create payment
[ ] POST /api/payments/verify - Verify payment
[ ] GET /api/payments/:id - Get payment status
[ ] POST /api/payments/refund - Process refund
[ ] POST /api/webhooks/razorpay - Razorpay webhook
[ ] POST /api/webhooks/stripe - Stripe webhook
```

### Service: rez-order-service
```
[ ] POST /api/orders - Create order
[ ] GET /api/orders/:id - Get order
[ ] PUT /api/orders/:id/status - Update status
[ ] GET /api/orders/user/:userId - User orders
[ ] POST /api/orders/:id/cancel - Cancel order
[ ] POST /api/orders/:id/refund - Refund order
```

### Service: rez-notifications-service
```
[ ] POST /api/notifications/send - Send notification
[ ] POST /api/notifications/bulk - Bulk send
[ ] GET /api/notifications/:userId - User notifications
[ ] PUT /api/notifications/:id/read - Mark as read
[ ] POST /api/notifications/templates - Create template
```

### Service: REZ-privacy-layer
```
[ ] GET /api/privacy/settings/:userId - Get privacy settings
[ ] PUT /api/privacy/settings/:userId - Update settings
[ ] POST /api/privacy/mask-transaction - Mask transaction
[ ] POST /api/privacy/preview - Preview all levels
[ ] POST /api/privacy/whitelist/add - Add to whitelist
```

---

## PHASE 2: REZ-INTELLIGENCE (AI/ML)

### Service: REZ-MIND
```
[ ] POST /api/chat - AI chat
[ ] POST /api/complete - Text completion
[ ] POST /api/embed - Generate embeddings
[ ] POST /api/analyze - Sentiment analysis
[ ] GET /api/models - List available models
```

### Service: REZ-intent-graph
```
[ ] POST /api/intent/track - Track intent
[ ] GET /api/intent/:userId - Get user intents
[ ] POST /api/intent/predict - Predict next intent
[ ] GET /api/intent/stats - Intent statistics
[ ] DELETE /api/intent/:intentId - Delete intent
```

### Service: REZ-consumer-graph
```
[ ] POST /api/profile/create - Create profile
[ ] GET /api/profile/:userId - Get profile
[ ] PUT /api/profile/:userId - Update profile
[ ] POST /api/profile/merge - Merge profiles
[ ] GET /api/profile/:userId/timeline - Activity timeline
```

### Service: REZ-personalization-engine
```
[ ] POST /api/recommend/user/:userId - User recommendations
[ ] POST /api/recommend/product/:productId - Similar products
[ ] POST /api/recommend/feeds - Feed recommendations
[ ] GET /api/recommend/history/:userId - Recommendation history
[ ] POST /api/recommend/feedback - User feedback
```

### Service: REZ-attribution-system
```
[ ] POST /api/track - Track event
[ ] GET /api/attribution/:campaignId - Attribution report
[ ] GET /api/funnel/:campaignId - Conversion funnel
[ ] POST /api/conversion - Record conversion
[ ] GET /api/roi/:campaignId - ROI calculation
```

### Service: REZ-cdp-service
```
[ ] POST /api/profiles - Create profile
[ ] GET /api/profiles/:id - Get profile
[ ] PUT /api/profiles/:id - Update profile
[ ] POST /api/segments - Create segment
[ ] GET /api/segments/:id/members - Segment members
```

### Service: REZ-ab-testing-service
```
[ ] POST /api/experiments - Create experiment
[ ] GET /api/experiments/:id - Get experiment
[ ] POST /api/experiments/:id/variant - Assign variant
[ ] PUT /api/experiments/:id/result - Record result
[ ] GET /api/experiments/:id/stats - Experiment stats
```

---

## PHASE 3: REZ-MERCHANT + REZ-CONSUMER

### REZ-Merchant: rez-merchant-service
```
[ ] POST /api/auth/login - Merchant login
[ ] POST /api/products - Create product
[ ] GET /api/products/:id - Get product
[ ] PUT /api/products/:id - Update product
[ ] POST /api/products/serial/generate - Generate serials
[ ] GET /api/products/serial/:serial - Get by serial
[ ] POST /api/customers/link-warranty - Link warranty
[ ] POST /api/warranty/activated - Warranty activated
[ ] POST /api/warranty/claim-filed - Claim filed
[ ] GET /api/orders - Merchant orders
[ ] GET /api/analytics/summary - Analytics summary
```

### REZ-Consumer: verify-qr-service
```
[ ] POST /api/verify - Verify product
[ ] POST /api/activate-warranty - Activate warranty
[ ] GET /api/warranty/:serial - Get warranty
[ ] POST /api/claim - File claim
[ ] GET /api/claim/:id - Get claim status
[ ] POST /api/serial/generate - Generate serials (admin)
[ ] GET /api/service-centers - Find centers
[ ] POST /api/transfer - Ownership transfer
[ ] GET /api/ownership/:serial - Ownership history
```

### REZ-Consumer: REZ-scan
```
[ ] POST /api/scan - Scan QR
[ ] GET /api/scan/history/:userId - Scan history
[ ] GET /api/scan/stats/:userId - Scan statistics
[ ] GET /api/serial/:serial - Serial details
```

### REZ-Consumer: REZ-expense
```
[ ] POST /api/expense/add - Add expense
[ ] GET /api/expense/history/:userId - Expense history
[ ] GET /api/expense/summary/:userId - Expense summary
[ ] GET /api/serial/:serial - Serial info
```

### REZ-Consumer: REZ-bills
```
[ ] POST /api/bills/scan - Scan receipt
[ ] GET /api/bills/:userId - Get bills
[ ] POST /api/bills/:id/claim-cashback - Claim cashback
[ ] GET /api/tax/:userId - Tax records
[ ] POST /api/tax/generate - Generate tax report
```

### REZ-Consumer: REZ-assistant
```
[ ] POST /api/assistant/chat - AI chat
[ ] GET /api/assistant/preferences/:userId - Get preferences
[ ] POST /api/assistant/preferences/:userId - Update preferences
```

### REZ-Consumer: REZ-save
```
[ ] POST /api/save - Save item
[ ] GET /api/save/:userId - Get saved items
[ ] DELETE /api/save/:itemId - Remove saved item
[ ] POST /api/save/collection - Create collection
```

### REZ-Consumer: REZ-nearby
```
[ ] POST /api/request - Post request
[ ] GET /api/requests - Get requests
[ ] GET /api/request/:id - Get request
[ ] PUT /api/request/:id/fulfill - Fulfill request
```

### REZ-Consumer: rez-now
```
[ ] GET /api/profile/:userId - Get profile
[ ] PUT /api/profile/:userId - Update profile
[ ] GET /api/services - Hotel services
[ ] POST /api/orders - Place order
```

---

## PHASE 4: REZ-MEDIA (Engagement)

### Service: REZ-ads-service
```
[ ] POST /api/campaigns - Create campaign
[ ] GET /api/campaigns/:id - Get campaign
[ ] PUT /api/campaigns/:id - Update campaign
[ ] POST /api/campaigns/:id/target - Set targeting
[ ] GET /api/campaigns/:id/stats - Campaign stats
[ ] POST /api/campaigns/:id/pause - Pause campaign
[ ] POST /api/campaigns/:id/resume - Resume campaign
```

### Service: adsqr
```
[ ] POST /api/campaigns - Create QR campaign
[ ] GET /api/campaigns/:id - Get campaign
[ ] GET /api/qr/:code - Resolve QR
[ ] POST /api/track - Track scan
[ ] GET /api/analytics/:campaignId - Campaign analytics
```

### Service: creators
```
[ ] POST /api/creators/register - Register creator
[ ] GET /api/creators/:id - Get creator
[ ] PUT /api/creators/:id/profile - Update profile
[ ] GET /api/creators/:id/earnings - Creator earnings
[ ] POST /api/links - Create affiliate link
[ ] GET /api/links/:id/stats - Link stats
```

### Service: REZ-attribution-platform
```
[ ] POST /api/track/touchpoint - Track touchpoint
[ ] POST /api/track/conversion - Track conversion
[ ] GET /api/reports/attribution - Attribution report
[ ] GET /api/reports/funnel - Conversion funnel
[ ] GET /api/reports/roi - ROI report
```

### Service: REZ-referral-graph
```
[ ] POST /api/referral/create-code - Create referral code
[ ] POST /api/referral/invite - Send invite
[ ] POST /api/referral/activate - Activate referral
[ ] POST /api/referral/quality-score - Get quality score
[ ] GET /api/referral/stats/:userId - Referral stats
[ ] GET /api/referral/earnings/:userId - Earnings
[ ] GET /api/referral/network/:userId - Referral network
[ ] GET /api/referral/leaderboard - Leaderboard
```

### Service: REZ-gamification-service
```
[ ] POST /api/points/earn - Earn points
[ ] POST /api/points/redeem - Redeem points
[ ] GET /api/points/:userId - User points
[ ] GET /api/badges/:userId - User badges
[ ] POST /api/challenges/join - Join challenge
[ ] GET /api/challenges/:id - Challenge details
```

---

## PHASE 5: RTNM-GROUP (Trust + Financial)

### Service: REZ-access-control-service
```
[ ] POST /api/roles - Create role
[ ] GET /api/roles/:id - Get role
[ ] PUT /api/roles/:id/permissions - Update permissions
[ ] POST /api/check - Check permission
[ ] GET /api/users/:userId/roles - User roles
```

### Service: REZ-trust-service
```
[ ] GET /api/trust/:userId - Get trust score
[ ] POST /api/trust/:userId/calculate - Calculate score
[ ] GET /api/trust/:userId/history - Trust history
[ ] POST /api/trust/:userId/report - Report user
[ ] GET /api/trust/merchant/:merchantId - Merchant trust
```

### Service: REZ-bnpl-service
```
[ ] POST /api/orders/initialize - Initialize BNPL
[ ] GET /api/orders/:id - Get BNPL order
[ ] POST /api/orders/:id/repay - Repay
[ ] GET /api/orders/:userId - User orders
[ ] GET /api/limits/:userId - Credit limit
```

### Service: REZ-capital-service
```
[ ] POST /api/applications - Apply for capital
[ ] GET /api/applications/:id - Get application
[ ] POST /api/applications/:id/approve - Approve
[ ] GET /api/loans/:merchantId - Merchant loans
[ ] POST /api/repayments - Make repayment
```

### Service: REZ-compliance-platform
```
[ ] POST /api/consent - Record consent
[ ] GET /api/consent/:userId - User consents
[ ] POST /api/data-request - GDPR request
[ ] GET /api/data-request/:id - Request status
[ ] POST /api/audit/log - Create audit log
```

### Service: REZ-financial-ledger
```
[ ] POST /api/transactions - Record transaction
[ ] GET /api/transactions/:id - Get transaction
[ ] GET /api/balance/:entityId - Entity balance
[ ] GET /api/reports/revenue - Revenue report
[ ] POST /api/settlements - Create settlement
```

---

## PHASE 6: STAYOWN-HOSPITALITY

### Service: Hotel OTA
```
[ ] GET /api/hotels - List hotels
[ ] GET /api/hotels/:id - Hotel details
[ ] GET /api/hotels/:id/rooms - Available rooms
[ ] POST /api/bookings - Create booking
[ ] GET /api/bookings/:id - Booking details
[ ] PUT /api/bookings/:id - Update booking
[ ] POST /api/bookings/:id/cancel - Cancel booking
```

### Service: verify-service (Room Access)
```
[ ] POST /api/verify - Verify room access
[ ] GET /api/room/:id/access - Get room access
[ ] POST /api/room/:id/unlock - Unlock room
[ ] GET /api/guest/:id/qr - Guest QR code
[ ] POST /api/checkin - Digital check-in
[ ] POST /api/checkout - Digital checkout
```

### Service: rez-stayown-service
```
[ ] GET /api/orders - Guest orders
[ ] POST /api/orders - Place order
[ ] GET /api/orders/:id - Order details
[ ] PUT /api/orders/:id/status - Update status
[ ] GET /api/services - Hotel services
```

### Service: rez-channel-manager
```
[ ] GET /api/channels - Connected channels
[ ] POST /api/channels/connect - Connect channel
[ ] GET /api/inventory/sync - Sync inventory
[ ] POST /api/bookings/:channelId - Channel booking
```

---

## PHASE 7: CORPPERKS (Enterprise)

### Service: rez-corpperks-service
```
[ ] POST /api/companies - Register company
[ ] GET /api/companies/:id - Company details
[ ] POST /api/employees - Add employee
[ ] GET /api/employees/:id - Employee details
[ ] POST /api/benefits - Create benefit
[ ] GET /api/benefits/:employeeId - Employee benefits
```

### Service: rez-corporate-service
```
[ ] GET /api/perks - Available perks
[ ] POST /api/redemptions - Redeem perk
[ ] GET /api/redemptions/:id - Redemption status
[ ] GET /api/analytics/usage - Usage analytics
```

---

## PHASE 8: RTNM-DIGITAL

### Service: REZ-trust-platform
```
[ ] GET /api/fraud/score/:userId - Fraud score
[ ] POST /api/fraud/report - Report fraud
[ ] GET /api/risk/:userId - Risk assessment
[ ] GET /api/compliance/:userId - Compliance status
```

### Service: REZ-ops-center
```
[ ] GET /api/escalations - Get escalations
[ ] POST /api/escalations - Create escalation
[ ] PUT /api/escalations/:id - Update escalation
[ ] GET /api/refunds - Refund requests
[ ] POST /api/refunds - Create refund
```

---

## PHASE 9: CROSS-PLATFORM INTEGRATION TESTS

### Test 1: User Registration → Wallet → Order Flow
```
1. POST /api/auth/register (RABTUL)
2. POST /api/wallet/create (RABTUL)
3. POST /api/products (REZ-Merchant)
4. POST /api/orders (REZ-Consumer)
5. POST /api/payments (RABTUL)
[ ] Full flow works
```

### Test 2: QR Scan → Intent → Attribution
```
1. POST /api/scan (REZ-Consumer)
2. POST /api/intent/track (REZ-Intelligence)
3. POST /api/track/conversion (REZ-Media Attribution)
4. GET /api/reports/attribution (REZ-Media)
[ ] Full attribution works
```

### Test 3: Warranty Activation → Trust → BNPL
```
1. POST /api/verify (REZ-Consumer)
2. POST /api/activate-warranty (REZ-Consumer)
3. GET /api/trust/:userId (RTNM-Group)
4. POST /api/orders/initialize (RTNM-Group BNPL)
[ ] Full BNPL eligibility works
```

### Test 4: Referral → Reward → Wallet
```
1. POST /api/referral/create-code (REZ-Media)
2. POST /api/referral/activate (REZ-Media)
3. POST /api/earn (RABTUL Wallet)
4. GET /api/wallet/:userId (RABTUL)
[ ] Full referral reward works
```

### Test 5: Bill Scan → Cashback → Wallet
```
1. POST /api/bills/scan (REZ-Consumer)
2. POST /api/bills/:id/claim-cashback (REZ-Consumer)
3. POST /api/earn (RABTUL Wallet)
4. GET /api/wallet/:userId (RABTUL)
[ ] Full cashback works
```

### Test 6: Hotel Booking → Room Access → Service
```
1. POST /api/bookings (StayOwn)
2. POST /api/checkin (StayOwn)
3. POST /api/verify (Room Access)
4. POST /api/orders (Room Service)
[ ] Full hotel flow works
```

### Test 7: Ad Campaign → Attribution → ROI
```
1. POST /api/campaigns (REZ-Media)
2. POST /api/track/touchpoint (REZ-Media Attribution)
3. POST /api/orders (REZ-Consumer)
4. GET /api/reports/roi (REZ-Media)
[ ] Full ad attribution works
```

### Test 8: Loyalty → Points → Redeem
```
1. POST /api/points/earn (REZ-Media)
2. GET /api/points/:userId (REZ-Media)
3. POST /api/points/redeem (REZ-Media)
4. POST /api/wallet/deduct (RABTUL)
[ ] Full loyalty works
```

---

## ENVIRONMENT VARIABLES

```env
# RABTUL-Technologies
AUTH_API=https://rez-auth.onrender.com
WALLET_API=https://rez-wallet.onrender.com
PAYMENT_API=https://rez-payment.onrender.com
NOTIF_API=https://rez-notifications.onrender.com
PRIVACY_API=https://rez-privacy.onrender.com

# REZ-Intelligence
MIND_API=https://REZ-mind.onrender.com
INTENT_API=https://rez-intent-graph.onrender.com
CDP_API=https://rez-cdp.onrender.com

# REZ-Merchant
MERCHANT_API=https://rez-merchant.onrender.com

# REZ-Consumer
VERIFY_API=https://rez-verify-qr.onrender.com
SCAN_API=https://rez-scan.onrender.com
EXPENSE_API=https://rez-expense.onrender.com
BILLS_API=https://rez-bills.onrender.com

# REZ-Media
ADS_API=https://rez-ads.onrender.com
ATTR_API=https://rez-attribution.onrender.com
REFERRAL_API=https://rez-referral.onrender.com

# RTNM-Group
TRUST_API=https://rez-trust.onrender.com
BNPL_API=https://rez-bnpl.onrender.com

# StayOwn
HOTEL_API=https://hotel-ota-api.onrender.com
STAYOWN_API=https://rez-stayown.onrender.com
```

---

## EXECUTION TIMELINE

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: RABTUL | 30 min | ⏳ |
| Phase 2: REZ-Intelligence | 30 min | ⏳ |
| Phase 3: Merchant + Consumer | 45 min | ⏳ |
| Phase 4: REZ-Media | 30 min | ⏳ |
| Phase 5: RTNM-Group | 30 min | ⏳ |
| Phase 6: StayOwn | 20 min | ⏳ |
| Phase 7: CorpPerks | 15 min | ⏳ |
| Phase 8: RTNM-Digital | 15 min | ⏳ |
| Phase 9: Cross-Platform | 45 min | ⏳ |

**Total Estimated Time: 4 hours**

---

## TEST RESULTS

| Phase | Tests | Passed | Failed | Pending |
|-------|-------|--------|--------|---------|
| 1. RABTUL | 35 | __ | __ | 35 |
| 2. Intelligence | 30 | __ | __ | 30 |
| 3. Merchant+Consumer | 45 | __ | __ | 45 |
| 4. REZ-Media | 40 | __ | __ | 40 |
| 5. RTNM-Group | 30 | __ | __ | 30 |
| 6. StayOwn | 25 | __ | __ | 25 |
| 7. CorpPerks | 15 | __ | __ | 15 |
| 8. RTNM-Digital | 15 | __ | __ | 15 |
| 9. Cross-Platform | 8 | __ | __ | 8 |
| **TOTAL** | **243** | **__** | **__** | **243** |

---

## LAST UPDATED

May 12, 2026
