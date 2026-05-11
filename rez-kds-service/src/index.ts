import express, { Express } from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import {
  KDSConfigSchema,
  defaultConfig,
  StationType
} from './config';
import { KitchenOrder } from './models/KitchenOrder';
import { Station } from './models/Station';
import { orderDisplayService } from './services/OrderDisplayService';
import { stationRoutingService } from './services/StationRoutingService';
import { timingService } from './services/TimingService';
import ordersRoutes from './routes/orders.routes';
import stationsRoutes from './routes/stations.routes';
import {
  internalAuthMiddleware,
  requestLoggerMiddleware,
  kdsCorsMiddleware,
  errorHandlerMiddleware
} from './middleware';

class KDSServer {
  private app: Express;
  private httpServer: ReturnType<typeof createServer>;
  private io: SocketServer;
  private config: typeof defaultConfig;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketServer(this.httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    this.config = defaultConfig;
  }

  async initialize(): Promise<void> {
    // Validate environment variables
    const envConfig = {
      port: process.env.KDS_PORT ? parseInt(process.env.KDS_PORT, 10) : undefined,
      mongoUri: process.env.MONGODB_URI,
      redisUrl: process.env.REDIS_URL,
      audioEnabled: process.env.AUDIO_ENABLED,
      internalServiceToken: process.env.INTERNAL_SERVICE_TOKENS_JSON
    };

    const validation = KDSConfigSchema.safeParse(envConfig);
    if (!validation.success) {
      console.error('Configuration validation failed:', validation.error.errors);
      throw new Error('Invalid configuration');
    }

    this.config = { ...this.config, ...validation.data };

    // Connect to MongoDB
    await this.connectToMongo();

    // Initialize Socket.IO
    orderDisplayService.setSocketServer(this.io);
    this.setupSocketHandlers();

    // Initialize stations
    await stationRoutingService.initializeStations();

    // Start timing monitoring
    timingService.startMonitoring(15000); // Check every 15 seconds

    // Setup timing alerts
    timingService.onAlert((alert) => {
      console.warn(`[TIMING ALERT] ${alert.type.toUpperCase()}: Order ${alert.orderNumber} at ${alert.stations.join(', ')} - ${Math.floor(alert.elapsedSeconds / 60)}m ${alert.elapsedSeconds % 60}s elapsed`);
      this.io.emit('timing:alert', alert);
    });

    // Setup middleware
    this.setupMiddleware();

    // Setup routes
    this.setupRoutes();

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'rez-kds-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        connections: orderDisplayService.getActiveConnectionCount()
      });
    });

    // Metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      try {
        const report = await timingService.getKitchenTimingReport();
        res.json({
          timestamp: new Date().toISOString(),
          report
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to generate metrics' });
      }
    });

    console.log('KDS Service initialized successfully');
  }

  private async connectToMongo(): Promise<void> {
    try {
      await mongoose.connect(this.config.mongoUri);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`KDS Socket connected: ${socket.id}`);

      // Handle station subscriptions
      socket.on('subscribe', (data: { stations: StationType[] }) => {
        for (const station of data.stations) {
          socket.join(`station:${station}`);
        }
        console.log(`Socket ${socket.id} subscribed to stations: ${data.stations.join(', ')}`);
        socket.emit('subscribed', { stations: data.stations });
      });

      // Handle unsubscribing
      socket.on('unsubscribe', (data: { stations: StationType[] }) => {
        for (const station of data.stations) {
          socket.leave(`station:${station}`);
        }
        socket.emit('unsubscribed', { stations: data.stations });
      });

      // Handle ping for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('disconnect', () => {
        console.log(`KDS Socket disconnected: ${socket.id}`);
      });
    });
  }

  private setupMiddleware(): void {
    this.app.use(kdsCorsMiddleware);
    this.app.use(express.json());
    this.app.use(requestLoggerMiddleware);
  }

  private setupRoutes(): void {
    // API routes with internal auth
    this.app.use('/api/orders', internalAuthMiddleware, ordersRoutes);
    this.app.use('/api/stations', internalAuthMiddleware, stationsRoutes);
  }

  async start(): Promise<void> {
    await this.initialize();

    return new Promise((resolve) => {
      this.httpServer.listen(this.config.port, () => {
        console.log(`KDS Service listening on port ${this.config.port}`);
        console.log(`WebSocket server ready`);
        resolve();
      });
    });
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down KDS Service...');

    timingService.stopMonitoring();
    await mongoose.disconnect();
    this.httpServer.close();

    console.log('KDS Service shut down gracefully');
  }
}

// Start the server
const server = new KDSServer();

process.on('SIGTERM', async () => {
  await server.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await server.shutdown();
  process.exit(0);
});

server.start().catch((error) => {
  console.error('Failed to start KDS Service:', error);
  process.exit(1);
});

export { server };
