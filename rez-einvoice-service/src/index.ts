import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Logger } from './services/logger.service';
import einvoiceRoutes from './routes/einvoice.routes';
import gstRoutes from './routes/gstroutes';

// Load environment variables
dotenv.config();

const logger = new Logger('App');

// Initialize Express app
const app: Application = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// CORS middleware - restricts origins to configured allowed domains
const ALLOWED_ORIGINS = (process.env.ALLOWED_CORS_ORIGINS || 'https://reznow.app,https://admin.reznow.app').split(',');

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'rez-einvoice-service',
    version: '1.0.0'
  });
});

// API info endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'ReZ E-Invoice Service',
    version: '1.0.0',
    description: 'E-Invoice service for GST compliance',
    endpoints: {
      e_invoice: {
        'POST /api/einvoice': 'Create a new e-invoice',
        'GET /api/einvoice/:irn': 'Get e-invoice by IRN',
        'GET /api/einvoice/number/:gstin/:invoiceNumber': 'Get e-invoice by number',
        'POST /api/einvoice/submit/:irn': 'Submit e-invoice to GST',
        'POST /api/einvoice/accept/:irn': 'Accept e-invoice',
        'POST /api/einvoice/reject/:irn': 'Reject e-invoice',
        'POST /api/einvoice/cancel': 'Cancel e-invoice',
        'POST /api/einvoice/modify': 'Modify e-invoice',
        'POST /api/einvoice/ewaybill': 'Generate e-waybill',
        'DELETE /api/einvoice/ewaybill/:irn': 'Cancel e-waybill',
        'GET /api/einvoice/seller/:gstin': 'Get e-invoices by seller',
        'GET /api/einvoice/buyer/:gstin': 'Get e-invoices by buyer',
        'GET /api/einvoice/verify/:irn': 'Verify IRN checksum'
      },
      gst: {
        'POST /api/gst/calculate': 'Calculate GST for item',
        'POST /api/gst/invoice-value': 'Calculate invoice value',
        'POST /api/gst/validate-gstin': 'Validate GSTIN format',
        'GET /api/gst/is-interstate': 'Check if inter-state',
        'GET /api/gst/states': 'Get state codes',
        'GET /api/gst/rates': 'Get GST rates',
        'POST /api/gst/hsn-summary': 'Calculate HSN summary',
        'POST /api/gst/number-to-words': 'Convert number to words'
      }
    }
  });
});

// Routes
app.use('/api/einvoice', einvoiceRoutes);
app.use('/api/gst', gstRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database connection
const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-einvoice';

  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection failed', error);
    throw error;
  }
};

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API info: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;
