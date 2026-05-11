# REZ Support Copilot

AI-powered customer support dashboard for REZ platform.

## Features

- Real-time ticket management
- AI-powered suggestions based on user history and sentiment
- Sentiment analysis for support tickets
- User history tracking
- Analytics and reporting

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/dashboard` | GET | Agent dashboard overview |
| `/user/:userId/history` | GET | User support history |
| `/ticket/:ticketId/suggestions` | GET | AI suggestions for ticket |
| `/webhook/ticket` | POST | Create/update ticket |
| `/ticket/:ticketId` | PATCH | Update ticket status |
| `/analytics` | GET | Support analytics |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Service port (default: 4033) |
| `MONGODB_URI` | MongoDB connection string |
| `REZ_MIND_URL` | REZ Mind Event Platform URL |

## Deploy

```bash
# Install dependencies
npm install

# Run locally
npm start
```

Deploy to Render:
1. Connect GitHub repo
2. Use render.yaml settings
3. Add environment variables
