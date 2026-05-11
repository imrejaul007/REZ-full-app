# REZ MIND - COMPLETE GUIDE

**Date:** May 6, 2026

## WHAT IS REZ MIND

ReZ Mind is the AI Brain - learns from user behavior and provides intelligence.

## SERVICES

| Service | Port | Purpose |
|---------|------|---------|
| Event Platform | 4008 | Capture events |
| Action Engine | 4009 | Execute actions |
| Feedback Service | 4010 | Learn from feedback |
| Intent Graph | 3001 | Understand intent |
| User Intelligence | 3004 | User profiles |
| Merchant Intelligence | 4012 | Merchant insights |

## CONNECTIONS

### Events Flow
App → Event Platform → Action Engine → Notifications/Marketing/AI

### User Flow
Search/View/Click → Intent Graph → Recommendations

## INTEGRATION

### Consumer App
```typescript
rezMind.consumer.sendSearch({ user_id, query, results_count });
rezMind.consumer.sendView({ user_id, item_id, merchant_id, duration_seconds });
```

### Merchant App
```typescript
rezMind.merchant.sendOrderCompleted({ order_id, items, total_amount });
rezMind.merchant.sendInventoryLow({ item_id, current_stock, threshold });
```

## PRODUCTION URL
https://rez-core-platform.onrender.com

## MONGODB
mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net
