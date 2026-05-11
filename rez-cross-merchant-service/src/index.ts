/**
 * Cross-Merchant Service
 *
 * City-wide badges and cross-merchant rewards
 * Port: 4027
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectMongoDB } from './config/mongodb';
import { CrossMerchantService } from './services/CrossMerchantService';
import { crossMerchantRoutes } from './routes/crossMerchant.routes';
import { healthCheck } from './services/healthCheck';

const app = express();
const PORT = process.env.PORT || 4027;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  const status = await healthCheck();
  res.json({ service: 'cross-merchant', ...status });
});

app.use('/api/v1/cross-merchant', crossMerchantRoutes);

async function start() {
  try {
    await connectMongoDB();
    const service = new CrossMerchantService();
    await service.initialize();

    app.locals.service = service;

    app.listen(PORT, () => {
      console.log(`Cross-Merchant Service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
