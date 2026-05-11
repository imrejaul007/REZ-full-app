# Payment & Financial Layer - Production Readiness Checklist

**Date:** 2026-05-06
**Status:** READY FOR REVIEW

---

## Critical Pre-Launch Requirements

### 1. Razorpay Production Keys
- [ ] Production Key ID configured in environment
- [ ] Production Key Secret configured in environment
- [ ] Webhook secret configured for production URL
- [ ] Test keys removed from all environments
- [ ] Keys stored in secure vault (not in code)

### 2. Settlement Flows
- [ ] Settlement calculation formula verified
- [ ] Settlement status tracking implemented
- [ ] Settlement reconciliation endpoint operational
- [ ] Settlement webhooks configured in Razorpay
- [ ] Settlement reports automated

### 3. Refund System
- [ ] Refund idempotency keys implemented
- [ ] Partial refund support verified
- [ ] Full refund flow tested end-to-end
- [ ] Refund recovery worker deployed
- [ ] Failed refund alerts configured

### 4. Ledger Correctness
- [ ] Double-entry bookkeeping verified
- [ ] Ledger entries for all payment flows
- [ ] Ledger entries for all refund flows
- [ ] Daily reconciliation automated
- [ ] Discrepancy alerts configured

### 5. Security
- [ ] Webhook signature verification tested
- [ ] Rate limiting configured
- [ ] IP whitelisting for Razorpay IPs
- [ ] Sensitive data encrypted
- [ ] Audit logging operational

### 6. Monitoring
- [ ] Payment success rate dashboard
- [ ] Refund rate dashboard
- [ ] Settlement lag alerts
- [ ] Ledger discrepancy alerts
- [ ] Failed payment alerts

### 7. Testing
- [ ] Payment creation tested
- [ ] Payment capture tested
- [ ] Full refund tested
- [ ] Partial refund tested
- [ ] Concurrent payment tested
- [ ] Webhook handling tested

### 8. Documentation
- [ ] API documentation updated
- [ ] Runbook created
- [ ] On-call procedures documented
- [ ] Emergency contacts listed

---

## Test Scenarios

### Payment Flow
1. Create order -> Initiate payment -> Capture -> Complete
2. Create order -> Initiate payment -> Cancel -> Expire
3. Concurrent payment attempts with same card

### Refund Flow
1. Full refund after capture
2. Partial refund after capture
3. Multiple partial refunds
4. Refund after settlement period

### Settlement Flow
1. Daily settlement calculation
2. Settlement to merchant wallet
3. Settlement reconciliation

---

## Emergency Procedures

### Payment Stuck
1. Check Redis locks
2. Check database status
3. Verify Razorpay status
4. Manual intervention if needed

### Duplicate Charge
1. Identify duplicate payment
2. Refund duplicate
3. Document incident

### Settlement Discrepancy
1. Run reconciliation report
2. Identify source of discrepancy
3. Adjust ledger if needed
4. Document and escalate
