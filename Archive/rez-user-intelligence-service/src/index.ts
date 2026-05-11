import express, { Application } from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import { connectDatabase } from './config/database';
import { getRabbitMQ } from './config/rabbitmq';
import { initSentry } from './config/sentry';
import routes from './routes';
import {
  requestIdMiddleware,
  requestLoggerMiddleware,
  errorHandlerMiddleware,
  notFoundHandlerMiddleware,
} from './middleware/errorHandler';
import {
  securityHeaders,
  corsConfig,
  apiRateLimiter,
  requestSizeLimiter,
} from './middleware/security';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize Sentry
initSentry();

class App {
  public app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3016', 10);
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Request ID and logging
    this.app.use(requestIdMiddleware);
    this.app.use(requestLoggerMiddleware);

    // Security
    this.app.use(securityHeaders);
    this.app.use(corsConfig);

    // Compression
    this.app.use(compression());

    // Body parsing with size limit
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Rate limiting
    this.app.use(apiRateLimiter);

    // Request size limit
    this.app.use(requestSizeLimiter('1mb'));

    // Trust proxy (for rate limiting behind load balancer)
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/', routes);

    // Metrics endpoint (for Prometheus)
    this.app.get('/metrics', (req, res) => {
      res.json({
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandlerMiddleware);

    // Global error handler
    this.app.use(errorHandlerMiddleware);
  }

  public async start(): Promise<void> {
    try {
      // Connect to MongoDB
      await connectDatabase();
      logger.info('Database connection established');

      // Connect to RabbitMQ (optional - service can run without it)
      try {
        const rabbitMQ = getRabbitMQ();
        await rabbitMQ.connect();
        logger.info('RabbitMQ connection established');
      } catch (error) {
        logger.warn('RabbitMQ connection failed - continuing without message queue', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Start HTTP server
      this.app.listen(this.port, () => {
        logger.info(`User Intelligence Service started`, {
          port: this.port,
          nodeEnv: process.env.NODE_ENV || 'development',
          pid: process.pid,
        });

        logger.info('Available endpoints:', {
          health: `GET /health`,
          captureEvent: `POST /user/event`,
          userProfile: `GET /user/:id/profile`,
          userPreferences: `GET /user/:id/preferences`,
          recommendations: `GET /user/:id/recommendations`,
          pushTokens: `GET /user/:id/push-tokens`,
          lifetimeValue: `GET /user/:id/lifetime-value`,
          submitFeedback: `POST /user/:id/feedback`,
        });
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`${signal} received, initiating graceful shutdown`);

        // Close RabbitMQ connection
        try {
          const rabbitMQ = getRabbitMQ();
          await rabbitMQ.close();
        } catch (error) {
          logger.error('Error closing RabbitMQ', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        // Close server
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason,
        promise,
      });
    });
  }
}

// Start the application
const app = new App();
app.start().catch((error) => {
  logger.error('Application startup failed', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exit(1);
});

export default App;
