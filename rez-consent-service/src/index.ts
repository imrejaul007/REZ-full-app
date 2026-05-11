/**
 * ReZ Consent & Privacy Service
 * DPDP-compliant consent management and user rights
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import consentRoutes from './routes/consentRoutes';
import userRightsRoutes from './routes/userRightsRoutes';
import { addPrivacyHeaders } from './middleware/privacyMiddleware';

config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://rez.money'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'consent-service',
    timestamp: new Date().toISOString(),
    version: '2.0'
  });
});

// Privacy headers on all routes
app.use(addPrivacyHeaders);

// Routes
app.use('/api/consent', consentRoutes);
app.use('/api/user-rights', userRightsRoutes);

// Consent summary (quick check)
app.get('/api/consent/summary/:userId', async (req, res) => {
  try {
    const { consentService } = await import('./services/consentService');
    const summary = await consentService.getUserConsentSummary(req.params.userId);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get consent summary' });
  }
});

// Privacy policy
app.get('/api/privacy', (req, res) => {
  res.json({
    success: true,
    data: {
      version: '2.0',
      lastUpdated: '2026-05-07',
      policyUrl: 'https://rez.money/privacy',
      rights: [
        'Right to access your data',
        'Right to correction',
        'Right to erasure',
        'Right to withdraw consent',
        'Right to data portability'
      ],
      retention: {
        events: '90 days',
        transactions: '7 years',
        inactiveAccounts: '24 months (anonymized)'
      }
    }
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_consent';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to consent database');
    const PORT = process.env.PORT || 4008;
    app.listen(PORT, () => {
      console.log(`Consent service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

export default app;
