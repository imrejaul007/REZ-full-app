# WHAT'S MISSING - REZ MIND + FINANCE

## STATUS: MOSTLY COMPLETE

Finance Service already has intent tracking integrated. Here's what's there vs what's missing:

---

## ✅ ALREADY IMPLEMENTED

### Intent Tracking in Finance Service

| File | Events Tracked |
|------|---------------|
| `routes/borrowRoutes.ts` | `bnpl_eligibility_checked`, `bnpl_order_created` |
| `services/creditScoreService.ts` | `credit_score_checked` |
| `services/loanService.ts` | `loan_application_submitted` |
| `services/intentCaptureService.ts` | Central tracking service |

### Environment Variable

```bash
# Already in .env.example
INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com
```

---

## ❌ WHAT'S MISSING

### 1. Reverse Integration: ReZ Mind → Finance

ReZ Mind should push insights BACK to Finance:

```typescript
// MISSING: When ReZ Mind detects high financial intent,
// it should boost credit score or pre-approve loans

// In rez-intelligence-hub or action-engine:
async function analyzeFinancialIntent(userId: string) {
  // Get intent signals
  const intents = await getUserIntents(userId);
  
  // Check for financial signals
  const financialSignals = intents.filter(i => 
    i.category === 'GENERAL:rez-finance' || 
    i.intentKey.includes('loan') ||
    i.intentKey.includes('credit')
  );
  
  if (financialSignals.length > 5) {
    // Boost credit score
    await fetch(`${FINANCE_SERVICE}/api/credit/boost`, {
      body: { userId, boost: 50 }
    });
  }
}
```

### 2. Dormancy → Finance Outreach

```typescript
// MISSING: When dormant user shows finance intent,
// trigger re-engagement

// In action-engine:
async function handleDormantFinanceIntent(userId: string) {
  const dormant = await getDormantUser(userId);
  
  if (dormant.lastIntent.includes('loan') || 
      dormant.lastIntent.includes('credit')) {
    
    // Send targeted offer
    await sendPush({
      userId,
      title: "Your loan offer is waiting",
      body: `Based on your interest, you pre-qualify for ₹${dormant.qualifyingAmount}`
    });
  }
}
```

### 3. Finance Events Not Tracked

| Event | Status | Description |
|--------|--------|-------------|
| `loan_approved` | ❌ MISSING | When loan is approved |
| `loan_rejected` | ❌ MISSING | When loan is rejected |
| `loan_disbursed` | ❌ MISSING | When money is transferred |
| `loan_repaid` | ❌ MISSING | When EMI is paid |
| `credit_limit_changed` | ❌ MISSING | When BNPL limit changes |
| `payment_overdue` | ❌ MISSING | When payment is late |

### 4. Cross-Service Scoring

```typescript
// MISSING: ReZ Mind should factor finance behavior
// into personalization scores

// In personalization-engine:
const USER_PROFILE = {
  // ... existing signals
  
  finance: {
    rezekiScore: 650,           // From Finance service
    financialEngagement: 0.8,   // High intent signals
    riskAppetite: 'moderate',   // Derived from behavior
    creditWorthiness: 'good'     // From REZ Score
  }
};
```

### 5. Risk → Finance Feedback Loop

```typescript
// MISSING: Finance should report loan performance
// back to ReZ Mind for scoring optimization

// In Finance service:
async function reportLoanPerformance(data: {
  userId: string;
  loanId: string;
  disbursedAt: Date;
  repaidOnTime: boolean;
  overdueDays: number;
}) {
  await track({
    userId: data.userId,
    event: data.repaidOnTime ? 'loan_repaid_ontime' : 'loan_defaulted',
    intentKey: 'GENERAL:rez-finance',
    properties: {
      loanId: data.loanId,
      overdueDays: data.overdueDays
    }
  });
  
  // ReZ Mind learns: this scoring model worked/failed
}
```

---

## MISSING FILES TO CREATE

### 1. Finance → ReZ Mind Feedback

Create `rez-finance-service/src/services/intentFeedback.ts`:

```typescript
/**
 * Reports loan performance back to ReZ Mind
 * This closes the loop for ML model optimization
 */
export async function reportLoanPerformance(
  userId: string,
  loanId: string,
  outcome: 'repaid_ontime' | 'repaid_late' | 'defaulted'
): Promise<void> {
  await track({
    userId,
    event: outcome,
    intentKey: 'GENERAL:rez-finance',
    properties: { loanId }
  });
}
```

### 2. ReZ Mind → Finance Pre-Approval

Create `rez-intelligence-hub/src/services/financeInsights.ts`:

```typescript
/**
 * Analyzes user intent for financial products
 * Pushes insights to Finance service
 */
export async function analyzeFinanceIntent(userId: string) {
  const intents = await getUserIntents(userId);
  
  // Calculate financial engagement score
  const financialScore = calculateFinancialScore(intents);
  
  // If high engagement, suggest credit boost
  if (financialScore > 0.8) {
    await fetch(`${FINANCE_SERVICE}/api/credit/suggest-boost`, {
      method: 'POST',
      body: { userId, score: financialScore }
    });
  }
}
```

### 3. Action Engine - Finance Nudges

Create `rez-action-engine/src/nudges/finance.ts`:

```typescript
/**
 * Finance-specific nudge campaigns
 */
export const financeNudges = {
  // Nudge dormant users with finance intent
  dormantFinanceInterest: {
    trigger: 'user.became_dormant',
    condition: (user) => user.lastIntent.includes('loan'),
    action: 'send_push',
    template: {
      title: "Your loan offer awaits",
      body: "Complete your application - pre-approved offer ready"
    }
  },
  
  // Remind before EMI due
  emiReminder: {
    trigger: 'loan.emi_due_soon',
    condition: () => true,
    action: 'send_reminder',
    template: {
      title: "EMI due in 3 days",
      body: "Pay ₹{{amount}} before {{date}} to maintain score"
    }
  }
};
```

---

## MISSING ENV VARIABLES

### In rez-finance-service/.env.example

```bash
# MISSING - Add these:
FINANCE_SERVICE_URL=http://localhost:4006
INTELLIGENCE_HUB_URL=http://localhost:4020
ACTION_ENGINE_URL=http://localhost:3014
```

### In rez-intelligence-hub/.env.example

```bash
# MISSING - Add:
FINANCE_SERVICE_URL=http://localhost:4006
```

### In rez-action-engine/.env.example

```bash
# MISSING - Add:
FINANCE_SERVICE_URL=http://localhost:4006
```

---

## MISSING EVENTS TO ADD

### In rez-finance-service/src/routes/borrowRoutes.ts

```typescript
// MISSING - Add these:

// Loan approved
track({ 
  userId, 
  event: 'loan_approved', 
  intentKey: 'GENERAL:rez-finance',
  properties: { loanId, amount, partnerId }
});

// Loan rejected
track({ 
  userId, 
  event: 'loan_rejected', 
  intentKey: 'GENERAL:rez-finance',
  properties: { loanId, reason }
});

// Loan disbursed
track({ 
  userId, 
  event: 'loan_disbursed', 
  intentKey: 'GENERAL:rez-finance',
  properties: { loanId, amount, disbursedAt }
});
```

### In rez-finance-service/src/routes/payRoutes.ts

```typescript
// MISSING - Add:

// EMI paid
track({ 
  userId, 
  event: 'loan_repaid', 
  intentKey: 'GENERAL:rez-finance',
  properties: { loanId, emiAmount, paidAt }
});

// Payment overdue
track({ 
  userId, 
  event: 'payment_overdue', 
  intentKey: 'GENERAL:rez-finance',
  properties: { loanId, daysOverdue }
});
```

---

## SUMMARY

| Item | Status | Priority |
|------|--------|----------|
| Basic intent tracking | ✅ Done | - |
| ReZ Mind → Finance push | ❌ Missing | HIGH |
| Finance → ReZ Mind feedback | ❌ Missing | HIGH |
| Complete event coverage | ❌ Missing | MED |
| Action engine nudges | ❌ Missing | MED |
| Cross-service scoring | ❌ Missing | MED |

---

## NEXT STEPS

1. Add missing intent events to Finance routes
2. Create intentFeedback.ts for loan performance
3. Add financeNudges to action-engine
4. Add intelligence service for finance analysis
5. Update .env files with all service URLs

---

*Missing Integrations Report - May 3, 2026*
