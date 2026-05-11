# Order Webhooks Configuration

## Setup in rez-order-service

Add these environment variables to your order service:

```env
ORDER_SERVICE_WEBHOOK_URL=https://REZ-support-copilot.onrender.com/webhooks
ORDER_SERVICE_WEBHOOK_SECRET=your-secure-webhook-secret
```

## Events to configure:

| Event | Endpoint | Description |
|-------|----------|-------------|
| order.created | POST /webhooks/order/created | New order placed |
| order.status_changed | POST /webhooks/order/status | Order status updated |
| order.issue_reported | POST /webhooks/order/issue | Customer reported issue |
| order.refund_requested | POST /webhooks/order/refund | Refund requested |

## Webhook Payload Examples

### order.created

```json
{
  "orderId": "ORD-12345",
  "userId": "user_abc123",
  "merchantId": "merchant_xyz",
  "items": [
    { "name": "Pizza Margherita", "quantity": 2, "price": 299 },
    { "name": "Garlic Bread", "quantity": 1, "price": 99 }
  ],
  "total": 697
}
```

### order.status_changed

```json
{
  "orderId": "ORD-12345",
  "oldStatus": "preparing",
  "newStatus": "delivered",
  "userId": "user_abc123"
}
```

### order.issue_reported

```json
{
  "orderId": "ORD-12345",
  "userId": "user_abc123",
  "issueType": "food_quality",
  "description": "Pizza was cold and toppings were missing"
}
```

### order.refund_requested

```json
{
  "orderId": "ORD-12345",
  "userId": "user_abc123",
  "amount": 299,
  "reason": "Item missing from order"
}
```

## Authentication

All webhooks require the `X-Webhook-Signature` header with the value matching `WEBHOOK_SECRET`.

Example:
```bash
curl -X POST https://REZ-support-copilot.onrender.com/webhooks/order/created \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: your-secure-webhook-secret" \
  -d '{"orderId": "ORD-12345", ...}'
```

## Auto-Created Tickets

| Trigger | Ticket Type | Priority |
|---------|-------------|----------|
| order.created | order_tracking | low |
| order.status -> cancelled | order_cancellation | high |
| order.issue_reported | order_issue | high (food_quality) / medium |
| order.refund_requested | refund_request | high |

## Testing Webhooks Locally

Use ngrok or similar to expose local server:

```bash
ngrok http 4033

# Then configure your order service with:
ORDER_SERVICE_WEBHOOK_URL=https://<ngrok-id>.ngrok.io/webhooks
```
