import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import refundRoutes from './routes/refund.routes';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler';
import { logger } from './utils/logger';

/**
 * Refund Service Server
 * Express server for managing refund requests
 */
class Server {
  public app: Application;
  private readonly PORT: number;
  private readonly HOST: string;

  constructor() {
    this.app = express();
    this.PORT = parseInt(process.env.PORT || '4031', 10);
    this.HOST = process.env.HOST || '0.0.0.0';

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize Express middlewares
   */
  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use(requestLogger);
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // Health check at root
    this.app.get('/', (req, res) => {
      res.json({
        service: 'ReZ Refund Service',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date()
      });
    });

    // API health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        message: 'Refund service API is healthy',
        timestamp: new Date()
      });
    });

    // Mount refund routes
    this.app.use('/api/refunds', refundRoutes);

    // API info endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'ReZ Refund Service API',
        version: '1.0.0',
        endpoints: {
          refunds: {
            'POST /api/refunds': 'Create a new refund request',
            'GET /api/refunds': 'Get all refunds (with filters)',
            'GET /api/refunds/stats': 'Get refund statistics',
            'GET /api/refunds/:id': 'Get refund by ID',
            'GET /api/refunds/customer/:customerId': 'Get refunds by customer',
            'GET /api/refunds/order/:orderId': 'Get refunds by order',
            'GET /api/refunds/status/:status': 'Get refunds by status',
            'POST /api/refunds/:id/decision': 'Approve or reject a refund',
            'POST /api/refunds/:id/process': 'Process a refund',
            'POST /api/refunds/:id/cancel': 'Cancel a refund'
          }
        },
        refundStatuses: ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
        refundReasons: ['DUPLICATE_CHARGE', 'FRAUDULENT_TRANSACTION', 'PRODUCT_NOT_RECEIVED', 'PRODUCT_UNSATISFACTORY', 'SERVICE_NOT_RECEIVED', 'SUBSCRIPTION_CANCELLED', 'ORDER_CANCELLED', 'OTHER'],
        timestamp: new Date()
      });
    });
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public start(): void {
    this.app.listen(this.PORT, this.HOST, () => {
      logger.info(`========================================`);
      logger.info(`  Refund Service Started Successfully`);
      logger.info(`========================================`);
      logger.info(`  Server:  http://${this.HOST}:${this.PORT}`);
      logger.info(`  API:     http://${this.HOST}:${this.PORT}/api`);
      logger.info(`  Health:  http://${this.HOST}:${this.PORT}/api/health`);
      logger.info(`========================================`);
      logger.info(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`  Log Level: ${process.env.LOG_LEVEL || 'info'}`);
      logger.info(`========================================`);
    });
  }

  /**
   * Graceful shutdown
   */
  public shutdown(): void {
    logger.info('Shutting down Refund Service...');
    process.exit(0);
  }
}

// Create and start server
const server = new Server();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.shutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.shutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
  process.exit(1);
});

// Start the server
server.start();

// Export for testing
export default server;
