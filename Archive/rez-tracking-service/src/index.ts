import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer, Server as HttpServer } from 'http';
import trackingRoutes from './routes/tracking.routes';
import { notificationService } from './services/notificationService';
import { trackingStore } from './models/Tracking';
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  securityHeaders
} from './middleware/errorHandler';

/**
 * Tracking Service Configuration
 */
const CONFIG = {
  PORT: parseInt(process.env.PORT || '4032', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  CLEANUP_INTERVAL: parseInt(process.env.CLEANUP_INTERVAL || '3600000', 10), // 1 hour
};

/**
 * Create and configure Express application
 */
function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for WebSocket compatibility
  }));
  app.use(securityHeaders);

  // CORS configuration
  app.use(cors({
    origin: CONFIG.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // 24 hours
  }));

  // Compression
  app.use(compression());

  // Request logging
  app.use(morgan('combined'));
  app.use(requestLogger);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    const sessionStats = trackingStore.getSessionCount();
    const connectionStats = notificationService.getStats();

    res.json({
      status: 'healthy',
      service: 'rez-tracking-service',
      version: '1.0.0',
      timestamp: Date.now(),
      uptime: process.uptime(),
      stats: {
        sessions: sessionStats,
        connections: connectionStats,
      },
    });
  });

  // Readiness check endpoint
  app.get('/ready', (_req, res) => {
    res.json({
      ready: true,
      timestamp: Date.now(),
    });
  });

  // API routes
  app.use('/api/tracking', trackingRoutes);

  // API documentation endpoint
  app.get('/api', (_req, res) => {
    res.json({
      service: 'ReZ Tracking Service',
      version: '1.0.0',
      endpoints: {
        tracking: {
          sessions: {
            'POST /api/tracking/sessions': 'Create a new tracking session',
            'GET /api/tracking/sessions': 'Get all active sessions',
            'GET /api/tracking/sessions/:sessionId': 'Get session by ID',
            'PUT /api/tracking/sessions/:sessionId/location': 'Update driver location',
            'PUT /api/tracking/sessions/:sessionId/destination': 'Set destination',
            'PUT /api/tracking/sessions/:sessionId/route': 'Set route',
            'POST /api/tracking/sessions/:sessionId/complete': 'Complete session',
            'POST /api/tracking/sessions/:sessionId/cancel': 'Cancel session',
            'GET /api/tracking/sessions/:sessionId/history': 'Get session history',
          },
          drivers: {
            'GET /api/tracking/drivers/:driverId/active': 'Get active session for driver',
            'GET /api/tracking/drivers/:driverId/history': 'Get driver tracking history',
            'GET /api/tracking/drivers/:driverId/stats': 'Get driver stats',
          },
          geofences: {
            'POST /api/tracking/geofences': 'Create geofence',
            'GET /api/tracking/geofences': 'Get all geofences',
            'GET /api/tracking/geofences/:geofenceId': 'Get geofence by ID',
            'PUT /api/tracking/geofences/:geofenceId': 'Update geofence',
            'DELETE /api/tracking/geofences/:geofenceId': 'Delete geofence',
          },
          routes: {
            'POST /api/tracking/routes/optimize': 'Optimize route between waypoints',
          },
          misc: {
            'GET /api/tracking/stats': 'Get service statistics',
            'POST /api/tracking/locations/batch': 'Batch location update',
          },
        },
        webSocket: {
          connection: 'ws://host:port',
          events: {
            register_driver: 'Register driver connection',
            subscribe_delivery: 'Subscribe to delivery updates',
            subscribe_session: 'Subscribe to session updates',
            location_update: 'Receive location updates',
            geofence_alert: 'Receive geofence alerts',
            eta_update: 'Receive ETA updates',
            route_update: 'Receive route updates',
          },
        },
      },
      documentation: 'https://docs.example.com/tracking-service',
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Start the tracking service
 */
async function startServer(): Promise<HttpServer> {
  const app = createApp();

  // Create HTTP server
  const server = createServer(app);

  // Initialize WebSocket
  notificationService.initialize(server);

  // Start periodic cleanup
  const cleanupInterval = setInterval(() => {
    console.log('[Cleanup] Running periodic cleanup...');
    trackingStore.cleanup(24 * 60 * 60 * 1000); // Clean up data older than 24 hours
  }, CONFIG.CLEANUP_INTERVAL);

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
      console.log('[Server] HTTP server closed');
    });

    // Clear cleanup interval
    clearInterval(cleanupInterval);

    // Give time for WebSocket connections to close
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('[Server] Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught Exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Start listening
  return new Promise((resolve, reject) => {
    server.listen(CONFIG.PORT, () => {
      console.log('='.repeat(60));
      console.log('  ReZ Tracking Service');
      console.log('='.repeat(60));
      console.log(`  Status:     RUNNING`);
      console.log(`  Environment: ${CONFIG.NODE_ENV}`);
      console.log(`  Port:        ${CONFIG.PORT}`);
      console.log(`  API:         http://localhost:${CONFIG.PORT}/api`);
      console.log(`  Health:      http://localhost:${CONFIG.PORT}/health`);
      console.log(`  WebSocket:   ws://localhost:${CONFIG.PORT}`);
      console.log('='.repeat(60));
      console.log('');
      console.log('[Server] Ready to accept connections');
      console.log('');

      resolve(server);
    });

    server.on('error', (error: Error) => {
      console.error('[Server] Failed to start:', error);
      reject(error);
    });
  });
}

// Start the server
startServer().catch((error) => {
  console.error('[Server] Fatal error during startup:', error);
  process.exit(1);
});

export { createApp, startServer };
