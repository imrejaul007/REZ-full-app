import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import posRoutes from './routes/pos.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Initialize Express application
const app: Application = express();

// Define port
const PORT = process.env.PORT || 4013;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

// API Routes
app.use('/api/pos', posRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'ReZ POS Service',
    version: '1.0.0',
    description: 'Restaurant Point of Sale Service',
    endpoints: {
      health: '/api/pos/health',
      orders: '/api/pos/orders',
      menu: '/api/pos/menu',
      stats: '/api/pos/stats',
      revenue: '/api/pos/revenue'
    }
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`POS Service started successfully`);
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/api/pos/health`);
  logger.info(`API base URL: http://localhost:${PORT}/api/pos`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
