import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cohortRoutes from './routes/cohort.routes';

const PORT = 4027;
const app: Application = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api', cohortRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Cohort Analysis Service',
    version: '1.0.0',
    status: 'running',
    port: PORT,
    endpoints: {
      health: 'GET /api/health',
      cohorts: {
        list: 'GET /api/cohorts',
        summary: 'GET /api/cohorts/summary',
        get: 'GET /api/cohorts/:id',
        create: 'POST /api/cohorts',
        bulk: 'POST /api/cohorts/bulk',
        delete: 'DELETE /api/cohorts/:id',
      },
      retention: {
        analyze: 'GET /api/retention/:cohortId',
        trend: 'GET /api/retention/:cohortId/trend',
        health: 'GET /api/retention/:cohortId/health',
        multi: 'POST /api/retention/multi',
      },
      engagement: {
        metrics: 'GET /api/engagement/:cohortId',
        compare: 'POST /api/engagement/compare',
      },
      revenue: {
        cohort: 'GET /api/revenue/:cohortId',
        compare: 'POST /api/revenue/compare',
      },
      charts: {
        retention: 'POST /api/charts/retention',
        revenue: 'POST /api/charts/revenue',
        engagement: 'POST /api/charts/engagement',
      },
      compare: 'POST /api/compare',
      users: {
        create: 'POST /api/users',
        get: 'GET /api/users/:id',
        list: 'GET /api/users?signupMonth=YYYY-MM',
      },
      activities: {
        record: 'POST /api/activities',
        list: 'GET /api/activities/:userId',
      },
      transactions: {
        record: 'POST /api/transactions',
        list: 'GET /api/transactions/:userId',
      },
    },
    timestamp: new Date(),
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date(),
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date(),
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('  Cohort Analysis Service');
  console.log('='.repeat(60));
  console.log(`  Status:    RUNNING`);
  console.log(`  Port:      ${PORT}`);
  console.log(`  Base URL:  http://localhost:${PORT}`);
  console.log(`  API URL:   http://localhost:${PORT}/api`);
  console.log(`  Health:    http://localhost:${PORT}/api/health`);
  console.log('='.repeat(60));
  console.log('  Ready to accept connections');
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default app;
