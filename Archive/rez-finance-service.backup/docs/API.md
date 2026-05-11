# Finance Service API Documentation

ReZ Finance Service provides credit scoring, loan applications, BNPL, bill payments, and risk management APIs.

**Base URL:** `https://api.rez.money`
**Authentication:** Bearer JWT token required for all endpoints

---

## Credit Score

### GET /api/finance/credit/score

Get user's ReZ credit score and eligibility.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "rezScore": 650,
    "grade": "good",
    "eligibility": {
      "loanAmount": 50000,
      "maxTenure": 12
    }
  }
}
```

**Error Responses:**
- `401` - Unauthorized (invalid or missing token)
- `429` - Rate limit exceeded (max 1 request per 10 seconds)
- `500` - Server error

---

### POST /api/finance/credit/score/check

Trigger credit score check and earn coins (once per day).

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "rezScore": 650,
  "coinsAwarded": 10
}
```

---

### POST /api/finance/credit/score/refresh

Force refresh credit score from bureau.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "rezScore": 655,
  "eligibility": {
    "loanAmount": 55000,
    "maxTenure": 12
  },
  "tips": [
    "Pay EMIs on time to improve your score"
  ]
}
```

---

## Loans & Borrow

### GET /api/finance/borrow/offers

Get active pre-approved loan/credit offers.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "offers": [
    {
      "id": "offer_123",
      "partnerName": "ABC Bank",
      "amount": 50000,
      "interestRate": 12.5,
      "tenure": 12
    }
  ]
}
```

---

### POST /api/finance/borrow/apply

Apply for a loan or credit card.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "partnerOfferId": "offer_123",
  "amount": 50000,
  "tenure": 12,
  "context": {
    "screen": "checkout",
    "orderId": "order_456"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "application": {
    "id": "app_789",
    "status": "pending",
    "redirectUrl": "https://partner.com/verify"
  },
  "redirectUrl": "https://partner.com/verify"
}
```

**Error Responses:**
- `400` - Invalid request, offer not found, or eligibility error
- `403` - Account inactive or frozen
- `500` - Server error

---

### GET /api/finance/borrow/applications

Get user's loan/credit applications.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "applications": [
    {
      "id": "app_789",
      "partnerName": "ABC Bank",
      "amount": 50000,
      "status": "approved",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET /api/finance/borrow/applications/:id

Get single application by ID.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "application": {
    "id": "app_789",
    "partnerName": "ABC Bank",
    "amount": 50000,
    "tenure": 12,
    "interestRate": 12.5,
    "status": "approved",
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

---

## BNPL (Buy Now Pay Later)

### POST /api/finance/borrow/bnpl/check

Check BNPL eligibility for checkout.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "amount": 5000,
  "orderId": "order_456"
}
```

**Response:**
```json
{
  "success": true,
  "eligible": true,
  "payLaterLimit": 25000,
  "remainingLimit": 20000
}
```

---

### POST /api/finance/borrow/bnpl/create

Create a Buy Now Pay Later order.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "amount": 5000,
  "orderId": "order_456",
  "merchantId": "merchant_123",
  "partnerId": "partner_abc"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "transaction": {
    "id": "tx_789",
    "amount": 5000,
    "status": "pending",
    "dueDate": "2026-02-15"
  }
}
```

**Rate Limit:** Maximum 5 orders per hour per user

**Error Responses:**
- `400` - Not eligible, exceeds pay later limit
- `429` - Rate limit exceeded
- `500` - Server error

---

## Payments

### GET /api/finance/pay/billers

Get supported billers for bill payment.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "billers": [
    { "id": "jio", "name": "Jio", "type": "mobile" },
    { "id": "airtel", "name": "Airtel", "type": "mobile" },
    { "id": "bsnl", "name": "BSNL", "type": "mobile" },
    { "id": "fastag", "name": "FASTag", "type": "fastag" },
    { "id": "bescom", "name": "BESCOM (Electricity)", "type": "electricity" },
    { "id": "bwssb", "name": "BWSSB (Water)", "type": "water" }
  ]
}
```

---

### POST /api/finance/pay/bill

Pay a bill (electricity, water, etc.).

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "billerId": "bescom",
  "accountNumber": "1234567890",
  "amount": 1500
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "transaction": {
    "id": "tx_bill_123",
    "status": "success",
    "billerRef": " receipt_789"
  }
}
```

**Note:** This feature requires BBPS aggregator integration.

---

### POST /api/finance/pay/recharge

Mobile or FASTag recharge.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "operator": "jio",
  "accountNumber": "9876543210",
  "amount": 299
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "transaction": {
    "id": "tx_rech_123",
    "status": "success",
    "operatorRef": "JIO123456"
  }
}
```

**Note:** This feature requires recharge aggregator integration.

---

### GET /api/finance/pay/transactions

Get user's payment transactions with cursor-based pagination.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `before` (optional) - Cursor for pagination (ISO timestamp)
- `limit` (optional) - Number of results (max 100, default 30)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "tx_123",
      "type": "bill_payment",
      "billerId": "jio",
      "amount": 500,
      "status": "success",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "nextCursor": "2026-01-14T10:00:00Z",
  "limit": 30
}
```

---

### POST /api/finance/pay/repay

Process loan repayment (EMI).

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "loanId": "loan_123",
  "amount": 5000,
  "emiNumber": 3
}
```

**Response:**
```json
{
  "success": true,
  "repayment": {
    "loanId": "loan_123",
    "amount": 5000,
    "emiNumber": 3,
    "paidAt": "2026-01-15T10:00:00Z"
  }
}
```

---

### POST /api/finance/pay/overdue-check

Check loan overdue status.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "loanId": "loan_123"
}
```

**Response:**
```json
{
  "success": true,
  "overdue": {
    "loanId": "loan_123",
    "daysOverdue": 0,
    "amount": 0
  }
}
```

---

## Risk Engine

### GET /api/finance/risk/fraud/:userId

Detect fraud risk for user.

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 0.15,
    "level": "low",
    "flags": []
  }
}
```

---

### GET /api/finance/risk/default/:userId

Predict default probability for user.

**Response:**
```json
{
  "success": true,
  "data": {
    "probability": 0.08,
    "riskLevel": "low"
  }
}
```

---

### GET /api/finance/risk/anomaly/:userId

Detect anomalous behavior for user.

**Response:**
```json
{
  "success": true,
  "data": {
    "anomalies": [],
    "riskScore": 0.05
  }
}
```

---

## Credit Marketplace

### GET /api/finance/marketplace/compare/:userId

Compare credit offers from multiple partners.

**Response:**
```json
{
  "success": true,
  "data": {
    "offers": [
      {
        "partnerId": "partner_abc",
        "partnerName": "ABC Bank",
        "amount": 50000,
        "interestRate": 12.5,
        "tenure": 12,
        "processingFee": 500
      }
    ]
  }
}
```

---

### GET /api/finance/marketplace/best/:userId

Get best credit offer recommendation.

**Response:**
```json
{
  "success": true,
  "data": {
    "offer": {
      "partnerId": "partner_abc",
      "partnerName": "ABC Bank",
      "amount": 50000,
      "interestRate": 11.5,
      "tenure": 12,
      "reason": "lowest_interest_rate"
    }
  }
}
```

---

## Merchant Financing

### GET /api/finance/merchant/:merchantId/limit

Calculate merchant credit limit.

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "merchant_123",
    "creditLimit": 500000,
    "utilizedAmount": 100000,
    "availableLimit": 400000
  }
}
```

---

### POST /api/finance/merchant/loan

Apply for merchant financing loan.

**Request Body:**
```json
{
  "merchantId": "merchant_123",
  "amount": 100000,
  "purpose": "inventory"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "loanId": "mloan_123",
    "status": "pending",
    "approvedAmount": 100000,
    "interestRate": 15
  }
}
```

---

## Ecosystem Credit

### GET /api/finance/ecosystem/benefits/:userId

Get ecosystem credit benefits for user.

**Response:**
```json
{
  "success": true,
  "data": {
    "benefits": [
      {
        "type": "cashback",
        "partner": "Partner A",
        "amount": 500,
        "expiresAt": "2026-02-15"
      }
    ],
    "totalSavings": 1500
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `SRV_INTERNAL_ERROR` | Server-side error |
| `FEATURE_NOT_AVAILABLE` | Feature pending integration |
| `UNAUTHORIZED` | Invalid or missing authentication |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Credit Score | 1 request / 10 seconds |
| BNPL Create | 5 requests / hour |
| All other authenticated endpoints | Standard rate limits |
