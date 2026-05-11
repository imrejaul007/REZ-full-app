# ReZ Financial Model - Detailed Appendix

**Version:** 1.0
**Date:** May 2026
**Confidential**

---

## Executive Summary

| Metric | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|--------|--------|--------|--------|--------|--------|
| Merchants | 2,000 | 10,000 | 30,000 | 50,000 | 50,000 |
| GMV (Cr) | ₹2 | ₹30 | ₹100 | ₹160 | ₹180 |
| Revenue (Cr) | ₹0.5 | ₹7 | ₹23 | ₹37 | ₹50 |
| ARR (Cr) | ₹0.5 | ₹7 | ₹23 | ₹37 | ₹50 |
| Burn (Cr) | ₹3 | ₹6 | ₹8 | ₹6 | ₹4 |
| Runway | 18 mo | 24 mo | 36 mo | Profitable | Profitable |

---

## 1. Merchant Acquisition Model

### Sales Team Structure (Year 1)

| Role | Count | Salary | Total |
|------|-------|--------|-------|
| Field Sales Rep | 3 | ₹25,000/mo | ₹75,000/mo |
| City Manager | 1 | ₹50,000/mo | ₹50,000/mo |
| Sales Head | 0.5 | ₹100,000/mo | ₹50,000/mo |
| **Total** | | | **₹1,75,000/mo** |

### CAC Calculation

| Cost Item | Per Rep | Per Merchant |
|-----------|--------|-------------|
| Salary (6 months) | ₹1,50,000 | ₹4,500 |
| Travel + Transport | ₹30,000 | ₹900 |
| Equipment (phone, sim) | ₹10,000 | ₹300 |
| QR Stickers (printing) | ₹5,000 | ₹150 |
| Onboarding Support | ₹10,000 | ₹300 |
| **Total CAC** | ₹2,05,000 | **₹6,150** |

### Conversion Funnel

```
100 Outreach
    ↓ 30%
30 Demos Scheduled
    ↓ 60%
18 Demos Completed
    ↓ 50%
9 Merchants Activated

Effective Conversion: 9%
Merchants per Rep per Month: ~15
```

### Merchant Targets

| Phase | Month | Reps | Merchants | Cumulative |
|-------|-------|------|-----------|------------|
| Pilot | 1-3 | 1 | 20 | 20 |
| Scale | 4-6 | 3 | 120 | 140 |
| Full | 7-12 | 3 | 180 | 320 |

---

## 2. Revenue Model

### Revenue Streams

#### Stream 1: Transaction Fees (Primary)

| Year | Merchants | Avg GMV/mo | Annual GMV | Fee | Revenue |
|------|-----------|------------|------------|-----|---------|
| 1 | 2,000 | ₹25,000 | ₹60 Cr | 2% | ₹1.2 Cr |
| 2 | 10,000 | ₹30,000 | ₹360 Cr | 2% | ₹7.2 Cr |
| 3 | 30,000 | ₹35,000 | ₹1,260 Cr | 2% | ₹25.2 Cr |
| 4 | 50,000 | ₹40,000 | ₹2,400 Cr | 2% | ₹48 Cr |
| 5 | 50,000 | ₹45,000 | ₹2,700 Cr | 2% | ₹54 Cr |

**Assumptions:**
- GMV grows 15% YoY as merchants mature
- All merchants process payments via ReZ (100% attach rate)

#### Stream 2: SaaS Subscription (Recurring)

| Year | Paying Merchants | % Paying | Avg Price | Revenue |
|------|------------------|----------|-----------|---------|
| 1 | 2,000 | 60% | ₹199 | ₹28 L |
| 2 | 10,000 | 50% | ₹199 | ₹1.2 Cr |
| 3 | 30,000 | 40% | ₹199 | ₹2.9 Cr |
| 4 | 50,000 | 35% | ₹199 | ₹4.2 Cr |
| 5 | 50,000 | 35% | ₹199 | ₹4.2 Cr |

**Assumptions:**
- 60% attach rate initially (we push SaaS hard)
- Decreases to 35% as we scale (some merchants don't need dashboard)

#### Stream 3: Premium Tier (Upsell)

| Year | Premium Merchants | Avg Price | Revenue |
|------|-------------------|-----------|---------|
| 1 | 50 | ₹999 | ₹6 L |
| 2 | 400 | ₹999 | ₹48 L |
| 3 | 1,500 | ₹999 | ₹1.8 Cr |
| 4 | 3,000 | ₹999 | ₹3.6 Cr |
| 5 | 5,000 | ₹999 | ₹6 Cr |

**Assumptions:**
- 3% → 10% of merchants upgrade to premium
- Premium includes: advanced analytics, API access, white-label

---

## 3. P&L Model

### Year 1 P&L

| Item | Monthly | Annual |
|------|---------|--------|
| **Revenue** | | |
| Transaction Fees | ₹10,00,000 | ₹1,20,00,000 |
| SaaS | ₹2,33,333 | ₹28,00,000 |
| Premium | ₹4,995 | ₹60,000 |
| **Total Revenue** | **₹12,38,328** | **₹1,48,60,000** |
| **COGS** | | |
| Payment Gateway | ₹1,50,000 | ₹18,00,000 |
| SMS/Notifications | ₹20,000 | ₹2,40,000 |
| Cloud Infrastructure | ₹30,000 | ₹3,60,000 |
| **Total COGS** | **₹2,00,000** | **₹24,00,000** |
| **Gross Profit** | **₹10,38,328** | **₹1,24,60,000** |
| **Gross Margin** | **83.8%** | **83.8%** |
| **OpEx** | | |
| Salaries | ₹5,00,000 | ₹60,00,000 |
| Sales (Variable) | ₹1,75,000 | ₹21,00,000 |
| Marketing | ₹50,000 | ₹6,00,000 |
| Admin | ₹50,000 | ₹6,00,000 |
| **Total OpEx** | **₹7,75,000** | **₹93,00,000** |
| **EBITDA** | **₹2,63,328** | **₹31,60,000** |
| **EBITDA Margin** | **21.3%** | **21.3%** |

### Year 5 P&L

| Item | Monthly | Annual |
|------|---------|--------|
| **Revenue** | **₹4,20,00,000** | **₹50,40,00,000** |
| **COGS** | **₹40,00,000** | **₹4,80,00,000** |
| **Gross Profit** | **₹3,80,00,000** | **₹45,60,00,000** |
| **Gross Margin** | **90.5%** | **90.5%** |
| **OpEx** | **₹1,50,00,000** | **₹18,00,00,000** |
| **EBITDA** | **₹2,30,00,000** | **₹27,60,00,000** |
| **EBITDA Margin** | **54.8%** | **54.8%** |

---

## 4. Unit Economics Deep Dive

### Per Merchant Economics (Year 1)

```
ACQUISITION
├── CAC: ₹6,150
└── Payback: 6 months

REVENUE (Annual)
├── Transaction: ₹6,000
├── SaaS: ₹1,194
├── Premium: ₹30
└── Total: ₹7,224

COSTS (Annual)
├── COGS: ₹1,200 (16.6%)
├── Support: ₹500 (6.9%)
└── Gross Cost: ₹1,700 (23.5%)

PROFIT (Annual)
├── Gross Profit: ₹5,524
├── OpEx Allocation: ₹4,000
└── Net: ₹1,524 per year

LTV
├── Retention: 85% YoY
├── Lifetime: 3 years
└── LTV: ₹4,572 (vs ₹6,150 CAC = 0.74x)
```

**Note:** Year 1 is not profitable per merchant due to high CAC. Breakeven at Year 2.

### Per Merchant Economics (Year 3+)

```
ACQUISITION
├── CAC: ₹4,500 (optimized)
└── Payback: 3 months

REVENUE (Annual)
├── Transaction: ₹8,400
├── SaaS: ₹797
├── Premium: ₹60
└── Total: ₹9,257

COSTS (Annual)
├── COGS: ₹1,600 (17.3%)
├── Support: ₹300 (3.2%)
└── Gross Cost: ₹1,900 (20.5%)

PROFIT (Annual)
├── Gross Profit: ₹7,357
├── OpEx Allocation: ₹2,000
└── Net: ₹5,357 per year

LTV
├── Retention: 90% YoY
├── Lifetime: 5 years
└── LTV: ₹26,785 (vs ₹4,500 CAC = 5.95x)
```

---

## 5. Cash Flow Model

### Funding Requirements

| Round | Amount | Timing | Runway | Milestone |
|-------|--------|--------|--------|-----------|
| Pre-Seed | ₹2 Cr | Now | 18 mo | PMF in Lucknow |
| Seed | ₹10 Cr | Month 18 | 24 mo | 10K merchants |
| Series A | ₹50 Cr | Month 42 | 36 mo | 50K merchants, profitable |

### Monthly Cash Flow (Year 1)

| Month | Revenue | OpEx | Burn | Cumulative |
|-------|---------|------|------|------------|
| 1 | ₹0 | ₹8L | ₹8L | ₹2 Cr |
| 3 | ₹2L | ₹10L | ₹8L | ₹1.76 Cr |
| 6 | ₹8L | ₹12L | ₹4L | ₹1.52 Cr |
| 9 | ₹15L | ₹14L | ₹0 | ₹1.44 Cr |
| 12 | ₹20L | ₹15L | ₹0 | ₹1.52 Cr |

**Note:** Revenue ramps slowly as merchant acquisition takes time.

---

## 6. Key Assumptions

### Conservative (Base Case)

| Assumption | Value | Notes |
|-----------|-------|-------|
| Merchant growth | 5x YoY | Year 1: 2K, Y2: 10K, Y3: 30K |
| GMV growth | 15% YoY | Increases as merchants mature |
| SaaS attach rate | 40% | 60% → 40% over time |
| Premium attach rate | 3% | 10% at scale |
| Retention | 85% YoY | Industry standard for SaaS |
| CAC | ₹6,150 | Optimizes to ₹4,500 by Y3 |

### Optimistic Case

| Assumption | Value | Notes |
|-----------|-------|-------|
| Merchant growth | 8x YoY | Viral/word-of-mouth |
| GMV growth | 25% YoY | Higher engagement |
| SaaS attach rate | 60% | Stronger sales push |
| Premium attach rate | 10% | More premium features |
| Retention | 90% YoY | Better product |
| CAC | ₹4,000 | Better efficiency |

### Pessimistic Case

| Assumption | Value | Notes |
|-----------|-------|-------|
| Merchant growth | 3x YoY | Slower adoption |
| GMV growth | 10% YoY | Lower engagement |
| SaaS attach rate | 25% | Weak sales |
| Premium attach rate | 1% | No premium demand |
| Retention | 75% YoY | Higher churn |
| CAC | ₹8,000 | Inefficient sales |

---

## 7. Sensitivity Analysis

### Year 5 ARR (₹ Cr)

| Retention \ GMV Growth | 10% | 15% | 20% | 25% |
|------------------------|------|------|------|------|
| **75%** | ₹32 | ₹38 | ₹44 | ₹52 |
| **85%** | ₹36 | ₹44 | ₹52 | ₹61 |
| **90%** | ₹40 | ₹50 | ₹60 | ₹70 |
| **95%** | ₹45 | ₹57 | ₹70 | ₹82 |

### Key Takeaway

> Even in pessimistic case (75% retention, 10% GMV growth), we hit ₹32 Cr ARR.
> In base case (85% retention, 15% GMV growth), we hit ₹50 Cr ARR.

---

## 8. Path to Profitability

### Timeline

| Milestone | Timeline | Revenue | Status |
|-----------|----------|--------|--------|
| Cash break-even | Month 18 | ₹20L/mo | Depends on burn control |
| EBITDA positive | Month 36 | ₹4 Cr/mo | Year 3 |
| Net profitable | Month 48 | ₹6 Cr/mo | Year 4 |

### Why EBITDA First?

1. **Sustainable growth** — don't burn cash to grow
2. **Investor confidence** — shows unit economics work
3. **Better fundraising** — profitable companies get better terms
4. **Acquisition optionality** — can be acquired anytime

---

## 9. Financial Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Slow merchant acquisition | Revenue miss 50% | Focus on product-led growth, referrals |
| Low SaaS attach rate | Revenue miss 30% | Invest in sales team, product demos |
| High churn | Revenue miss 40% | Coin system creates stickiness, invest in CS |
| Payment fraud | Brand damage | 2-layer verification, ML fraud detection |
| Competition | Margin pressure | Stay focused on T2-T3, don't compete on price |

---

## 10. Use of Funds (₹2 Cr)

| Category | Amount | Allocation |
|----------|--------|------------|
| Product Development | ₹50,00,000 | 25% |
| Sales & Marketing | ₹60,00,000 | 30% |
| Operations | ₹40,00,000 | 20% |
| Infrastructure | ₹30,00,000 | 15% |
| Legal & Compliance | ₹20,00,000 | 10% |
| **Total** | **₹2,00,00,000** | 100% |

### Milestone-Based Allocation

| Milestone | Amount | Expected Outcome |
|-----------|--------|-----------------|
| MVP complete (M2) | ₹40L | Basic ordering + coins working |
| 100 merchants (M3) | ₹30L | PMF signal |
| 500 merchants (M6) | ₹80L | Scale playbook validated |
| 5K orders/month (M6) | ₹30L | Transaction revenue working |
| 10% repeat rate (M6) | ₹20L | Coin system validated |

---

## 11. Appendix: Assumptions Reference

### Industry Benchmarks Used

| Metric | Benchmark | Source |
|--------|-----------|--------|
| SMB SaaS churn | 5-7% monthly | Pacific Crest Survey |
| SaaS gross margin | 75-85% | Public company data |
| Sales cycle (SMB) | 2-4 weeks | Internal data |
| Demo-to-close | 50-60% | Industry standard |
| UPI success rate | 99.5% | NPCI data |

### Data Sources

| Source | Data Used |
|--------|----------|
| NASSCOM | SMB count (63M) |
| NRAI | Restaurant count (7M) |
| NPCI | UPI transaction volume |
| BCG Reports | SMB digital adoption (80%) |
| Pacific Crest | SaaS benchmarks |
| Public company filings | Cost benchmarks |

---

*This financial model is based on reasonable assumptions and industry benchmarks. Actual results may vary. This document is confidential.*
