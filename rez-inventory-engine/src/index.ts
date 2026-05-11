import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { skuRoutes, stockRoutes, barcodeRoutes, alertRoutes, transferRoutes, expiryRoutes } from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_inventory';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'rez-inventory-engine',
    version: '1.0.0',
  });
});

// API info endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'ReZ Inventory Engine API',
    version: '1.0.0',
    description: 'Retail inventory management system with SKU, stock, barcode, and alert management',
    endpoints: {
      sku: {
        'POST /api/sku': 'Create a new SKU',
        'GET /api/sku': 'Search and filter SKUs',
        'GET /api/sku/:id': 'Get SKU by ID',
        'GET /api/sku/code/:code': 'Get SKU by SKU code',
        'PUT /api/sku/:id': 'Update a SKU',
        'DELETE /api/sku/:id': 'Delete a SKU (soft delete)',
        'GET /api/sku/:id/with-stock': 'Get SKU with stock info',
        'GET /api/sku/store/:storeId': 'Get all SKUs in a store',
        'GET /api/sku/stats/:merchantId': 'Get SKU statistics',
        'POST /api/sku/bulk': 'Bulk create SKUs',
        'POST /api/sku/generate-barcode': 'Generate a unique barcode',
      },
      stock: {
        'POST /api/stock/add': 'Add stock to a SKU',
        'POST /api/stock/deduct': 'Deduct stock from a SKU',
        'POST /api/stock/reserve': 'Reserve stock for an order',
        'POST /api/stock/release': 'Release reserved stock',
        'GET /api/stock/:skuId': 'Get stock level for a SKU',
        'GET /api/stock/:skuId/batches': 'Get stock with batch info',
        'GET /api/stock/store/:storeId/levels': 'Get all stock levels in a store',
        'POST /api/stock/transfer': 'Transfer stock between stores',
        'GET /api/stock/alerts/low-stock': 'Get low stock items',
        'POST /api/stock/adjust': 'Adjust stock (inventory correction)',
      },
      barcode: {
        'GET /api/barcode/:barcode': 'Lookup a barcode',
        'POST /api/barcode/generate': 'Generate a unique barcode',
        'POST /api/barcode/validate': 'Validate barcode format',
        'POST /api/barcode/exists': 'Check if barcode exists',
        'POST /api/barcode/bulk-lookup': 'Bulk lookup barcodes',
        'GET /api/barcode/stats': 'Get barcode statistics',
        'GET /api/barcode/search/:partialCode': 'Find SKU by partial barcode',
      },
      alerts: {
        'GET /api/alerts': 'Get complete alert summary',
        'GET /api/alerts/low-stock': 'Get low stock alerts',
        'GET /api/alerts/expiry': 'Get expiry alerts',
        'GET /api/alerts/by-category': 'Get alerts by category',
        'POST /api/alerts/check/:skuId': 'Check if SKU is low on stock',
        'POST /api/alerts/refresh': 'Refresh alert statuses',
        'GET /api/alerts/forecast/:skuId': 'Get stock forecast',
        'POST /api/alerts/schedule-expiry': 'Schedule expiry alerts',
      },
      transfers: {
        'POST /api/transfers': 'Create a new transfer request',
        'GET /api/transfers': 'Get transfers with filters',
        'GET /api/transfers/pending': 'Get pending transfers for a store',
        'GET /api/transfers/:id': 'Get transfer by ID',
        'PUT /api/transfers/:id/approve': 'Approve a transfer',
        'PUT /api/transfers/:id/dispatch': 'Dispatch a transfer',
        'PUT /api/transfers/:id/receive': 'Receive a transfer',
        'PUT /api/transfers/:id/cancel': 'Cancel a transfer',
        'PUT /api/transfers/:id/items': 'Update transfer items',
      },
      expiry: {
        'GET /api/expiry/expiring': 'Get items expiring soon',
        'GET /api/expiry/expired': 'Get expired items',
        'POST /api/expiry/cleanup': 'Mark expired items as unavailable',
        'POST /api/expiry/alerts': 'Send expiry alerts',
        'GET /api/expiry/summary': 'Get expiry summary for a store',
        'POST /api/expiry/update-statuses': 'Update expiry statuses',
      },
    },
  });
});

// Routes
app.use('/api/sku', skuRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/expiry', expiryRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  mongoose.connection.close(false, () => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ReZ Inventory Engine API Server                         ║
║                                                           ║
║   Server running on: http://localhost:${PORT}               ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                           ║
║   Endpoints:                                              ║
║   - Health: http://localhost:${PORT}/health                 ║
║   - API Info: http://localhost:${PORT}/api                  ║
║   - SKU:     http://localhost:${PORT}/api/sku                ║
║   - Stock:   http://localhost:${PORT}/api/stock              ║
║   - Barcode: http://localhost:${PORT}/api/barcode            ║
║   - Alerts:  http://localhost:${PORT}/api/alerts            ║
║   - Transfers: http://localhost:${PORT}/api/transfers        ║
║   - Expiry: http://localhost:${PORT}/api/expiry             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
