/**
 * REZ Webhook Service
 *
 * Webhook management for loyalty events
 * Port: 4034
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { connectRedis, redis } from './config/redis';
import { webhookRoutes } from './routes/webhook.routes';
import { deliveryRoutes } from './routes/delivery.routes';
import { WebhookService } from './services/WebhookService';

const app = express();
const PORT = process.env.PORT || 4034;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize service
const webhookService = new WebhookService();

// Health check
app.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    service: 'webhook-service',
    status: 'healthy',
    mongodb: mongoStatus,
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (req, res) => {
  try {
    await mongoose.connection.db?.admin().ping();
    res.json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

// Routes
app.use('/api/webhooks', webhookRoutes);
app.use('/api/deliveries', deliveryRoutes);

// Stats
app.get('/api/stats', async (req, res) => {
  const stats = await webhookService.getStats();
  res.json(stats);
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Webhook Service Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_webhooks';
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');

    // Connect to Redis
    await connectRedis();

    // Initialize service
    await webhookService.initialize();

    // Start server
    app.listen(PORT, () => {
      console.log(`Webhook Service listening on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
