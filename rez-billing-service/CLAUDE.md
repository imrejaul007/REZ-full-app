# Claude Code Configuration - rez-billing-service

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- NEVER save working files, text/mds, or tests to the root folder
- Never continuously check status after spawning a swarm — wait for results
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## Project Overview

**Service Purpose:** Billing, invoicing, and payment tracking for ads platform
**Tech Stack:** Node.js, Express, MongoDB
**Database:** MongoDB collections: invoices, billing_events, payment_reconciliation

## Key Models

- **Invoice**: Billing invoices for merchants
  - Fields: invoiceId, merchantId, amount, status, lineItems, dueDate
- **BillingEvent**: Event log for billing operations
  - Fields: eventId, type, payload, metadata, timestamp

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/billing/events | Create billing event |
| POST | /api/billing/events/batch | Batch create events |
| GET | /api/billing/events | List events with filters |
| POST | /api/billing/invoices | Create invoice |
| GET | /api/billing/invoices/:invoiceId | Get invoice |
| PATCH | /api/billing/invoices/:invoiceId | Update invoice |
| GET | /api/billing/invoices/merchant/:merchantId | List merchant invoices |

## External Integrations

- **Twilio**: SMS notifications
- **WhatsApp**: WhatsApp notifications
- **Razorpay**: Payment gateway

## Build & Test

```bash
# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## Security Rules

- NEVER hardcode API keys, secrets, or credentials
- NEVER commit .env files
- Validate all user input at system boundaries
- Use `crypto.randomUUID()` for ID generation

## Validation

- Joi schemas for request validation
- Amount validation: positive number with upper bound
- Batch events: max 1000 per request
