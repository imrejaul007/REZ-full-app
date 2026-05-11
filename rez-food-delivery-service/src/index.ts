import express from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import Redis from 'ioredis';
import { config } from './config';
import { OrderService } from './services/OrderService';
import { DeliveryAssignmentService } from './services/DeliveryAssignmentService';
import { TrackingService } from './services/TrackingService';
import { RoutingService } from './services/RoutingService';
import { createOrderRoutes } from './routes/orders.routes';
import { createTrackingRoutes } from './routes/tracking.routes';
import { createDeliveryRoutes } from './routes/delivery.routes';
import {
  internalAuth,
  rateLimiter,
  errorHandler,
  requestLogger,
  sanitizeInput,
} from './middleware';

async function bootstrap(): Promise<void> {
  const app = express();
  const httpServer = createServer(app);

  // Initialize Socket.IO
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Initialize Redis
  const redis = new Redis(config.redisUrl);
  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
  redis.on('connect', () => {
    console.log('Connected to Redis');
  });

  // Initialize MongoDB
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }

  // Initialize services
  const orderService = new OrderService(redis);
  const routingService = new RoutingService(redis);
  const assignmentService = new DeliveryAssignmentService(redis, orderService, routingService);
  const trackingService = new TrackingService(redis);
  trackingService.setSocketServer(io);

  // Middleware
  app.use(express.json());
  app.use(requestLogger);
  app.use(sanitizeInput);
  app.use(rateLimiter(100, 60000)); // 100 requests per minute

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'food-delivery-service',
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        redis: redis.status === 'ready' ? 'connected' : 'disconnected',
      },
    });
  });

  // API routes
  app.use('/api/orders', createOrderRoutes(orderService));
  app.use('/api/tracking', createTrackingRoutes(trackingService));
  app.use('/api/delivery', createDeliveryRoutes(assignmentService));

  // Internal routes (require service token)
  app.use('/internal/orders', internalAuth, createOrderRoutes(orderService));
  app.use('/internal/delivery', internalAuth, createDeliveryRoutes(assignmentService));

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Handle order tracking room joining
    socket.on('join:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`Socket ${socket.id} joined order room: ${orderId}`);
    });

    // Handle customer room joining
    socket.on('join:customer', (customerId: string) => {
      socket.join(`customer:${customerId}`);
      console.log(`Socket ${socket.id} joined customer room: ${customerId}`);
    });

    // Handle driver room joining and location updates
    socket.on('join:driver', async (data: { driverId: string; orderId?: string }) => {
      socket.join(`driver:${data.driverId}`);

      if (data.orderId) {
        socket.join(`order:${data.orderId}`);
      }

      console.log(`Socket ${socket.id} joined driver room: ${data.driverId}`);
    });

    // Handle location updates from drivers
    socket.on('location:update', async (data: {
      driverId: string;
      lat: number;
      lng: number;
      orderId?: string;
    }) => {
      await trackingService.updateDriverLocation({
        ...data,
        timestamp: new Date(),
      });
    });

    // Handle order status updates
    socket.on('order:status', async (data: { orderId: string; status: string; note?: string }) => {
      // Emit to all subscribers
      io.to(`order:${data.orderId}`).emit('order:status_update', data);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not found',
    });
  });

  // Start server
  httpServer.listen(config.port, () => {
    console.log(`Food Delivery Service running on port ${config.port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`MongoDB URI: ${config.mongodbUri}`);
    console.log(`Redis URL: ${config.redisUrl}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    httpServer.close(() => {
      console.log('HTTP server closed');
    });
    await mongoose.connection.close();
    await redis.quit();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down gracefully...');
    httpServer.close(() => {
      console.log('HTTP server closed');
    });
    await mongoose.connection.close();
    await redis.quit();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start service:', error);
  process.exit(1);
});
