import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cohortRoutes from './routes/cohort.routes';
import { authMiddleware, rateLimitMiddleware, requestIdMiddleware, errorHandler, ALLOWED_ORIGINS } from './middleware/auth';

const PORT = parseInt(process.env.PORT || '4027', 10);
const app: Application = express();

// Middleware
app.use(requestIdMiddleware);
app.use(helmet());
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Request-Id'],
  maxAge: 86400,
}));
app.use(rateLimitMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes - apply authentication
app.use('/api', authMiddleware, cohortRoutes);

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
    },
  });
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'cohort-service' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Cohort Service running on port ${PORT}`);
});

export default app;
