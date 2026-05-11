/**
 * Karma-Loyalty Bridge Service
 *
 * Connects Karma to Loyalty - Convert karma actions to loyalty points
 * Port: 4029
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectMongoDB } from './config/mongodb';
import { KarmaLoyaltyBridge } from './services/KarmaLoyaltyBridge';
import { bridgeRoutes } from './routes/bridge.routes';
import { healthCheck } from './services/healthCheck';

const app = express();
const PORT = process.env.PORT || 4029;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  const status = await healthCheck();
  res.json({ service: 'karma-loyalty-bridge', ...status });
});

app.use('/api/v1/bridge', bridgeRoutes);

async function start() {
  try {
    await connectMongoDB();
    const bridge = new KarmaLoyaltyBridge();
    await bridge.initialize();

    app.locals.bridge = bridge;

    app.listen(PORT, () => {
      console.log(`Karma-Loyalty Bridge listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
