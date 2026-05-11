# ReZ User Intelligence Service

A comprehensive user intelligence service for the ReZ platform that captures, analyzes, and derives insights from user behavior across the entire ecosystem.

## Features

### User Profile Schema
- **Transactions**: Food orders, amounts, frequency, payment methods
- **Search Behavior**: Queries, results clicked, time of day, device type
- **Feedback**: Ratings, reviews, complaints, sentiment analysis
- **Preferences**: Cuisine, price range, location, dietary restrictions
- **Behavior Patterns**: Order timing, device usage, payment preferences
- **Intent Signals**: Browsing, cart actions, wishlist, price watching
- **Engagement Metrics**: App opens, sessions, feature usage, retention
- **Inferred Demographics**: Age range, location, interests, lifestyle
- **Life Events**: Birthdays, work schedule changes, location changes

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/user/event` | POST | Capture user behavior events |
| `/user/:id/profile` | GET | Full 360 user profile view |
| `/user/:id/preferences` | GET | User preferences |
| `/user/:id/recommendations` | GET | Personalized recommendations |
| `/user/:id/push-tokens` | GET | Push notification tokens |
| `/user/:id/lifetime-value` | GET | Lifetime value metrics |
| `/user/:id/feedback` | POST | Submit feedback |
| `/users/search` | GET | Search users by criteria |
| `/users/segments` | GET | User segment statistics |
| `/users/batch/events` | POST | Batch event capture |
| `/users/batch/push-tokens` | POST | Batch push token updates |

### Behavioral Scoring

The service calculates:

- **engagement_score** (0-100): Overall user engagement level
- **value_segment**: HIGH / MEDIUM / LOW
- **churn_risk**: LOW / MEDIUM / HIGH
- **upsell_opportunity**: Boolean flag
- **preferred_channels**: PUSH / EMAIL / SMS

### Integrations

- **Intent Graph Service**: For intent signal processing
- **Order Service**: For transaction synchronization
- **Feedback Service**: For review and rating synchronization

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas (or local MongoDB)
- Redis (optional, for caching)
- RabbitMQ (optional, for message queue)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Build TypeScript
npm run build

# Start the service
npm start
```

### Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3004 |
| `MONGODB_URI` | MongoDB connection string | - |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `RABBITMQ_URL` | RabbitMQ connection string | - |
| `INTENT_GRAPH_SERVICE_URL` | Intent graph service URL | - |
| `ORDER_SERVICE_URL` | Order service URL | - |
| `FEEDBACK_SERVICE_URL` | Feedback service URL | - |

## Event Types

### Transaction Events
- `order_placed`
- `order_completed`
- `order_cancelled`
- `order_refunded`

### Search Events
- `search_query`
- `search_result_clicked`
- `search_filter_applied`

### Feedback Events
- `rating_given`
- `review_written`
- `complaint_filed`

### Intent Signals
- `item_viewed`
- `item_added_to_cart`
- `item_removed_from_cart`
- `cart_abandoned`
- `item_added_to_wishlist`
- `item_removed_from_wishlist`

### Engagement Events
- `app_opened`
- `app_closed`
- `page_viewed`
- `feature_used`
- `session_started`
- `session_ended`

## Example Usage

### Capture an Event

```bash
curl -X POST http://localhost:3004/user/event \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "order_completed",
    "userId": "user123",
    "payload": {
      "orderId": "order456",
      "restaurantId": "rest789",
      "restaurantName": "Pizza Palace",
      "items": [
        {"itemId": "item1", "name": "Margherita", "quantity": 1, "price": 15.99, "category": "italian"}
      ],
      "totalAmount": 15.99,
      "finalAmount": 18.98,
      "paymentMethod": "card"
    },
    "source": "order-service"
  }'
```

### Get User Profile

```bash
curl http://localhost:3004/user/user123/profile
```

### Submit Feedback

```bash
curl -X POST http://localhost:3004/user/user123/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "type": "rating",
    "targetType": "order",
    "targetId": "order456",
    "rating": 5,
    "comment": "Great pizza!",
    "tags": ["fast-delivery", "hot-food"]
  }'
```

## License

MIT
