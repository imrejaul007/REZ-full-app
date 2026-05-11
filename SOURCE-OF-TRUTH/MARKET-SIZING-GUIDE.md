# How to Do Market Sizing (Like Airbnb, Stripe, Uber)

Based on analyzing successful pitch decks from billion-dollar companies.

---

## What VCs Actually Want to See

| Question | What They Mean |
|----------|---------------|
| "What's your TAM?" | "How big can this get if you win EVERYTHING?" |
| "What's your SAM?" | "How big is your actual reachable market?" |
| "What's your SOM?" | "How big is your realistic near-term market?" |
| "How did you calculate?" | "Are these real numbers or made up?" |

---

## The Famous Airbnb Market Sizing

When Airbnb pitched YC in 2009, they said:

```
TAM (Total Market): $600 Billion
├── Hotels: $450 Billion
├── Vacation Rentals: $100 Billion
└── Couchsurfing: $50 Billion

SAM (Serviceable): $30 Billion
├── Airbnb's addressable portion

SOM (Obtainable): $10 Million (Year 1)
├── Initial focus: NY, SF, LA
```

**Key insight:** They used TOP-DOWN for TAM (feels big) and BOTTOM-UP for SAM/SOM (shows execution).

---

## The Stripe Market Sizing (Example)

Stripe's pitch deck showed:

```
TAM: All Internet Commerce
├── Global e-commerce: $1.5 Trillion
└── Stripe's opportunity: $150 Billion

SAM: Online Payments (their actual target)
├── SMB + Enterprise online payments: $50 Billion
└── Stripe's obtainable: $2 Billion (Year 5)

SOM: Developers (near-term)
├── Global developers: 20 million
└── Stripe's target: 100,000 Year 1
```

---

## How to Calculate For ReZ

### STEP 1: Define Your Customer

```
Who pays you?
├── Merchant pays 2% transaction fee
├── Merchant pays ₹199/mo SaaS

Customer = SMB (restaurant, salon, retail) in India
```

### STEP 2: Top-Down (TAM)

```
Total Addressable Market (TAM)
├── India GDP: $3.5 Trillion
├── India Retail: $1.2 Trillion
└── India's SMB spending on software: $10 Billion (TAM)

This is your "if we win everything" number.
Don't over-inflate this. VCs will call it out.
```

### STEP 3: Bottom-Up (SAM) - THE REAL NUMBER

```
SAM = Total SMBs × Penetration × Revenue per SMB

Step 1: Count eligible SMBs
├── India restaurants: 7 million (NRAI data)
├── India salons: 2 million
├── India retail shops: 10 million
└── Total with physical presence: ~20 million

Step 2: Apply realistic penetration (Year 5)
├── Target cities (T2-T3): 100 cities
├── SMBs per city: ~50,000
├── Total target: 5 million SMBs
├── Realistic penetration: 10%
└── SAM: 500,000 merchants

Step 3: Revenue per merchant
├── Avg monthly GMV: ₹30,000
├── ReZ fee (2%): ₹600/month
├── SaaS (₹199): ₹2,388/year
└── Total annual: ₹9,588 per merchant

SAM = 500,000 × ₹9,588 = ₹480 Crore (Year 5)
```

### STEP 4: SOM (Near-Term - Year 1)

```
Serviceable Obtainable Market

City: Lucknow (pop: 3 million)
├── Restaurants: ~10,000
├── Salons: ~5,000
├── Small retail: ~15,000
└── Total: 30,000 SMBs

Year 1 targets:
├── Target: 2,000 merchants
├── Avg GMV: ₹25,000/month
├── Revenue: 2,000 × ₹25,000 × 12 × 2% = ₹1.2 Crore
└── SaaS: 1,000 × ₹199 × 12 = ₹24 Lakh

SOM Year 1: ₹1.44 Crore
```

---

## The Correct Numbers for ReZ

| Market | Inflated (My #) | Correct (Bottom-Up) |
|--------|-----------------|---------------------|
| **TAM** | ₹12,000 Cr | ₹10,000 Cr (all India SMB software) |
| **SAM** | ₹12,000 Cr | ₹500 Cr (Year 5, realistic) |
| **SOM** | ₹300 Cr | ₹1.5 Cr (Year 1, Lucknow) |

---

## How Famous Decks Show Market Sizing

### Format 1: Funnel (Most Common)

```
                    ┌─────────────────────┐
                    │        TAM           │
                    │   $600 Billion      │
                    │ All Hotels Worldwide│
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │        SAM           │
                    │   $30 Billion       │
                    │ Vacation Rentals    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │        SOM          │
                    │   $10 Million       │
                    │   Year 1 Target     │
                    └─────────────────────┘
```

### Format 2: Stacked Bar

```
TAM: ₹10,000 Cr
├── SMB Software: ₹10,000 Cr
└── [████████░░] 2% = ₹200 Cr

SAM: ₹500 Cr
├── Target market: ₹500 Cr
└── [██████████] 100%

SOM: ₹1.5 Cr
├── Year 1: ₹1.5 Cr
└── [█░░░░░░░░░] 0.3%
```

### Format 3: Table (YC Preferred)

| Market | Definition | Size | Year |
|--------|-----------|------|------|
| TAM | All India SMBs | ₹10,000 Cr | All time |
| SAM | T2-T3 SMBs | ₹500 Cr | Year 5 |
| SOM | Lucknow first | ₹1.5 Cr | Year 1 |

---

## What NOT to Do

### ❌ DON'T: Inflated Numbers
```
TAM: ₹1 Lakh Crore (made up)
├── This is ridiculous
└── VCs will laugh you out

SAM: ₹50,000 Crore (not defensible)
├── Why would you claim 50% of TAM?
└── Shows you don't understand your market
```

### ❌ DON'T: No Methodology
```
TAM: ₹12,000 Cr (because we said so)
├── No calculation
├── No sources
└── Red flag for due diligence
```

### ❌ DON'T: Confusing SAM/TAM
```
TAM: Restaurants
SAM: Lucknow restaurants
SOM: My restaurant

This is backwards.
```

---

## What TO Do

### ✅ DO: Show Your Math

```
Market Sizing Methodology:

1. Starting Point:
   - India has 7 million restaurants (NRAI 2024)

2. Our Target:
   - Focus: T2-T3 cities
   - 100 cities × 50,000 SMBs = 5 million

3. Realistic Penetration:
   - Year 5: 10% = 500,000 merchants

4. Revenue per Merchant:
   - Monthly GMV: ₹30,000
   - ReZ fee: 2% = ₹600
   - SaaS: ₹199/mo = ₹2,388/yr
   - Total: ₹9,588/year

5. SAM = 500,000 × ₹9,588 = ₹480 Crore
```

### ✅ DO: Cite Sources

```
- "According to NRAI, India has 7M restaurants"
- "Zomato annual report: ₹50,000 Cr GMV processed"
- "RBI: UPI processed ₹18 Lakh Cr in FY2024"
- "NASSCOM: India has 63M SMBs"
```

### ✅ DO: Show Conservative Assumptions

```
"Even if we only capture 0.1% of TAM..."
"Conservative estimate based on..."
"We're being conservative here..."
```

---

## Updated Market Slide for ReZ

Here's what your slide should look like:

```
┌─────────────────────────────────────────────────────────┐
│                    THE MARKET                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   TAM: ₹10,000 Cr                                      │
│   All India SMB software & services                     │
│                                                         │
│   SAM: ₹500 Cr (Year 5)                               │
│   T2-T3 SMBs we can realistically reach                │
│                                                         │
│   SOM: ₹1.5 Cr (Year 1)                               │
│   Lucknow first, prove, expand                          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   How we calculated:                                    │
│   • 5M SMBs × 10% penetration = 500K merchants        │
│   • ₹9,588 annual revenue per merchant                 │
│   • 500K × ₹9,588 = ₹480 Crore SAM                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Pro Tip: The 5-Second Rule

When an investor looks at your market slide, they should be able to answer in 5 seconds:

1. Is the market big enough? (TAM)
2. Can they reach it? (SAM)
3. Can they win it soon? (SOM)

If they can't, your slide is too complex.

---

## Source Links to Bookmark

For India-specific data:

| Source | What to Find |
|--------|-------------|
| NRAI (National Restaurant Association of India) | Restaurant count, market size |
| NASSCOM | SMB statistics |
| RBI | UPI/Payment statistics |
| Zomato Annual Report | Food delivery market data |
| YourStory/Device Atlas | Mobile/internet penetration |

---

## Summary

| What | Old # | New # |
|------|-------|-------|
| TAM | ₹12,000 Cr | ₹10,000 Cr |
| SAM | ₹12,000 Cr | ₹500 Cr |
| SOM | ₹300 Cr | ₹1.5 Cr |

**Key insight:** Better to show conservative/defensible numbers than inflated ones. VCs will respect the honesty and methodology.

---

Shall I update the pitch deck with these corrected numbers?
