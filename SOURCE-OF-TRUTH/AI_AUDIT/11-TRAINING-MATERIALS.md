# ReZ Ecosystem Training Materials

**Version:** 1.0.0
**Last Updated:** 2026-05-05
**Target Audience:** New Developers, Engineers onboarding to the ReZ Platform

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack Documentation](#2-tech-stack-documentation)
3. [Project Structure](#3-project-structure)
4. [Shared Types Package](#4-shared-types-package)
5. [Authentication Patterns](#5-authentication-patterns)
6. [Database Patterns](#6-database-patterns)
7. [API Conventions](#7-api-conventions)
8. [File Upload Patterns](#8-file-upload-patterns)
9. [Error Handling Patterns](#9-error-handling-patterns)
10. [FSM (Finite State Machine) Patterns](#10-fsm-finite-state-machine-patterns)
11. [Branded ID Types](#11-branded-id-types)
12. [Runtime Guards](#12-runtime-guards)
13. [Caching & Performance](#13-caching--performance)
14. [Testing Patterns](#14-testing-patterns)
15. [Deployment Patterns](#15-deployment-patterns)
16. [Best Practices](#16-best-practices)

---

## 1. Project Overview

### 1.1 The Three Core Projects

The ReZ ecosystem consists of three interconnected projects:

| Project | Location | Purpose |
|---------|----------|---------|
| **ReZ Full App** | `/Users/rejaulkarim/Documents/ReZ Full App` | Shared types, schemas, FSM helpers, and branded ID types used across all services |
| **rez-intent-graph** | `/Users/rejaulkarim/Documents/rez-intent-graph` | AI-powered commerce intelligence with intent tracking, dormant revival, and personalized nudges |
| **resturistan/backend** | `/Users/rejaulkarim/Documents/resturistan/backend` | Restaurant SaaS Backend API using NestJS with Prisma ORM |

### 1.2 Project Dependencies

```
@rez/shared-types (ReZ Full App)
    ├── Used by: rez-intent-graph, resturistan/backend, all microservices
    ├── Provides: TypeScript interfaces, Zod schemas, FSM helpers, branded IDs

rez-intent-graph
    ├── Uses: @rez/shared-types (imported as needed)
    ├── Databases: MongoDB (intents, dormant profiles), Redis (caching)
    └── Integrates with: All ReZ microservices via REST API

resturistan/backend
    ├── Uses: NestJS framework, Prisma ORM
    ├── Database: SQLite (dev), PostgreSQL (production)
    └── Integrates with: rez-intent-graph for intent capture
```

---

## 2. Tech Stack Documentation

### 2.1 ReZ Full App (Shared Types)

**Core Dependencies:**
- `typescript@^5.3.0` - TypeScript compiler
- `zod@^3.22.0` - Schema validation
- `mongoose@^8.23.1` - MongoDB ODM (for type references)

**Build Output:**
- CommonJS (`dist/index.js`)
- TypeScript declarations (`dist/index.d.ts`)

### 2.2 rez-intent-graph

**Runtime Dependencies:**
- `express@^4.21.0` - Web framework
- `mongoose@^8.8.3` - MongoDB ODM
- `ioredis@^5.4.1` - Redis client
- `jsonwebtoken@^9.0.3` - JWT handling
- `ws@^8.20.0` - WebSocket support
- `winston@^3.11.0` - Logging
- `@sentry/node@^7.88.0` - Error tracking
- `zod@^3.23.8` - Schema validation

**Dev Dependencies:**
- `jest@^29.7.0` - Testing framework
- `ts-jest@^29.1.0` - TypeScript Jest transformer
- `tsx@^4.19.0` - TypeScript execution

### 2.3 resturistan/backend

**Framework & Runtime:**
- `nestjs@^10.0.0` - Application framework
- `prisma@^5.7.1` - Database ORM
- `express@^5.1.0` - Underlying HTTP server

**Authentication:**
- `@nestjs/jwt@^10.2.0` - JWT handling
- `@nestjs/passport@^10.0.2` - Auth strategies
- `passport-jwt@^4.0.1` - JWT passport strategy
- `passport-local@^1.0.0` - Local auth strategy
- `bcryptjs@^2.4.3` - Password hashing

**Security:**
- `helmet@^7.1.0` - Security headers
- `compression@^1.7.4` - Response compression
- `@nestjs/throttler@^5.0.1` - Rate limiting

**File Handling:**
- `@aws-sdk/client-s3@^3.470.0` - S3 client
- `multer@^1.4.5-lts.1` - File upload handling

**Payments:**
- `razorpay@^2.9.2` - Payment gateway

**Documentation:**
- `@nestjs/swagger@^7.1.17` - OpenAPI documentation

---

## 3. Project Structure

### 3.1 ReZ Full App Structure

```
src/
├── index.ts                 # Main entry point - exports all public APIs
├── entities/                # TypeScript interfaces for domain objects
│   ├── user.ts             # User, UserProfile, UserAuth, etc.
│   ├── order.ts            # Order, OrderItem, OrderTotals, etc.
│   ├── payment.ts          # Payment, PaymentGatewayResponse, etc.
│   ├── wallet.ts           # Wallet, Coin, CoinTransaction, etc.
│   └── ...
├── enums/                   # Enum definitions
│   ├── index.ts            # Main exports
│   └── coinType.ts         # CoinType with normalization utilities
├── fsm/                     # Finite State Machine helpers
│   ├── index.ts            # Main exports
│   ├── paymentFsm.ts       # Payment state transitions
│   ├── orderFsm.ts         # Order state transitions
│   └── orderPaymentFsm.ts  # Order payment state transitions
├── branded/                # Branded ID types
│   └── ids.ts              # OrderId, UserId, PaymentId, etc.
├── guards/                  # Runtime type guards (no Zod dependency)
│   └── index.ts            # isOrderResponse, isPaymentResponse, etc.
├── validation/               # Zod schemas
│   ├── index.ts            # Main exports
│   ├── user.ts             # User validation schemas
│   └── common.ts           # Common schemas (pagination, etc.)
└── utils/
    └── AuditLogger.ts      # Audit logging utility
```

### 3.2 rez-intent-graph Structure

```
src/
├── index.ts                 # Main exports
├── server/                  # Express server setup
├── api/                     # API route definitions
│   ├── intent.routes.ts    # Intent capture endpoints
│   └── commerce-memory.routes.ts
├── agents/                  # Autonomous agent implementations
├── services/                # Business logic services
│   ├── IntentCaptureService.ts
│   ├── DormantIntentService.ts
│   ├── CrossAppAggregationService.ts
│   └── insightService.ts
├── models/                  # MongoDB schemas
│   ├── Intent.ts           # Intent tracking model
│   ├── DormantIntent.ts    # Dormant intent model
│   └── ...
├── middleware/              # Express middleware
│   ├── auth.ts             # Token verification
│   ├── rateLimit.ts        # Rate limiting
│   └── intentMiddleware.ts
├── integrations/            # External service integrations
├── jobs/                    # Background job definitions
├── monitoring/              # Health checks, metrics
├── websocket/               # WebSocket handlers
├── config/                  # Configuration
│   ├── index.ts            # Environment config
│   └── redis.ts            # Redis client setup
├── database/                # Database connections
│   └── mongodb.ts          # MongoDB connection
└── utils/                   # Utilities
    ├── logger.ts           # Winston logger setup
    └── ...
```

### 3.3 resturistan/backend Structure

```
src/
├── main.ts                  # Application bootstrap
├── app.module.ts           # Root module
├── prisma/                 # Prisma database layer
│   ├── prisma.service.ts   # Prisma service wrapper
│   └── prisma.module.ts
├── auth/                    # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/                 # Data transfer objects
│   │   ├── register.dto.ts
│   │   └── login.dto.ts
│   ├── strategies/          # Passport strategies
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   └── guards/              # Auth guards
│       ├── jwt-auth.guard.ts
│       └── local-auth.guard.ts
├── uploads/                 # File upload module
│   ├── uploads.controller.ts
│   └── uploads.service.ts
├── payments/                # Payment integration
├── restaurants/             # Restaurant management
├── employees/               # Employee management
├── notifications/            # Notification service
├── analytics/               # Analytics module
└── websockets/              # WebSocket support
```

---

## 4. Shared Types Package

### 4.1 Installation & Usage

```bash
# In any consuming project
npm install @rez/shared-types
```

```typescript
// Import types only (no runtime dependencies)
import type { IOrder, IUser } from '@rez/shared-types';
import { OrderStatus, CoinType } from '@rez/shared-types';

// Import Zod schemas (backend/admin)
import { CreateOrderSchema, WalletDebitSchema } from '@rez/shared-types';

// Import FSM helpers
import { isValidPaymentTransition, canOrderBeCancelled } from '@rez/shared-types';

// Import branded IDs
import { toOrderId, type OrderId } from '@rez/shared-types';
```

### 4.2 Entity Interfaces

All entities follow a consistent pattern with prefixed `I` for interfaces:

```typescript
// User entity structure
interface IUser {
  id: string;
  phoneNumber: string;
  profile: IUserProfile;
  auth: IUserAuth;
  referral: IUserReferral;
  wallet: IUserWallet;
  verifications: IUserVerifications;
  role: UserRole;
  accountStatus: UserAccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Order entity structure
interface IOrder {
  id: string;
  orderNumber: string;
  user: string;  // UserId
  items: IOrderItem[];
  totals: IOrderTotals;
  payment: IOrderPayment;
  delivery: IOrderDelivery;
  status: OrderStatus;
  timeline: IOrderTimelineEntry[];
  // ... more fields
}
```

### 4.3 Zod Schemas

All schemas are strict (no `.passthrough()`) with discriminated unions:

```typescript
// Order schemas
export const ORDER_STATUS = z.enum([
  'placed', 'confirmed', 'preparing', 'ready',
  'dispatched', 'out_for_delivery', 'delivered',
  'cancelled', 'cancelling', 'returned', 'refunded'
]);

export const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1),
  delivery: OrderDeliverySchema,
  paymentMethod: PaymentMethodSchema,
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

// Validation usage
const result = CreateOrderSchema.safeParse(requestBody);
if (!result.success) {
  // Handle validation error
}
```

---

## 5. Authentication Patterns

### 5.1 rez-intent-graph Authentication

Uses internal service tokens for server-to-server communication:

```typescript
// src/middleware/auth.ts

// Internal token verification (server-to-server)
export function verifyInternalToken(req: Request, res: Response, next: NextFunction): void {
  const internalToken = req.headers['x-internal-token'] as string;
  const token = process.env.INTERNAL_SERVICE_TOKEN;

  // Timing-safe comparison to prevent timing attacks
  if (!internalToken || !token || internalToken.length !== token.length) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(internalToken),
    Buffer.from(token)
  );

  if (valid) {
    next();
    return;
  }

  res.status(401).json({ error: 'Unauthorized' });
}

// JWT verification for user authentication
export async function verifyUserJWT(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  // In production, verify with auth service
  if (process.env.NODE_ENV === 'production') {
    const response = await fetch(`${authServiceUrl}/internal/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || '',
      },
      body: JSON.stringify({ token }),
      signal: AbortSignal.timeout(5000),
    });
    // ... verify response
  }

  next();
}

// Combined auth - accepts multiple auth methods
export function requireAnyAuth(req: Request, res: Response, next: NextFunction): void {
  const internalToken = req.headers['x-internal-token'] as string;
  const apiKey = req.headers['x-api-key'] as string;
  const cronSecret = req.headers['x-cron-secret'] as string;

  // Check each method
  if (internalToken && internalTokenEnv && internalToken === internalTokenEnv) { next(); return; }
  if (apiKey && apiKeyEnv && apiKey === apiKeyEnv) { next(); return; }
  if (cronSecret && cronSecretEnv && cronSecret === cronSecretEnv) { next(); return; }

  res.status(401).json({ error: 'Unauthorized' });
}
```

**Required Headers:**
- `x-internal-token` - For internal service-to-service calls
- `x-api-key` - For merchant API access
- `x-cron-secret` - For scheduled job endpoints
- `Authorization: Bearer <token>` - For user JWT verification

### 5.2 resturistan/backend Authentication (NestJS)

Uses Passport.js with JWT strategy:

```typescript
// JWT Strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.getUserById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
```

**JWT Guard Usage:**

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
@ApiBearerAuth()
async getProfile(@Request() req) {
  return this.authService.getProfile(req.user.id);
}
```

### 5.3 Password Hashing

Always use bcrypt with appropriate salt rounds:

```typescript
// Registration
const saltRounds = 12;
const passwordHash = await bcrypt.hash(password, saltRounds);

// Login verification
const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
```

---

## 6. Database Patterns

### 6.1 MongoDB (rez-intent-graph)

**Connection Pattern:**

```typescript
// src/database/mongodb.ts
import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
}
```

**Model Definition Pattern:**

```typescript
// src/models/Intent.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIntent extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  merchantId?: string;
  appType: string;
  category: string;
  intentKey: string;
  confidence: number;
  status: 'ACTIVE' | 'DORMANT' | 'FULFILLED' | 'EXPIRED';
  signals: IIntentSignal[];
  firstSeenAt: Date;
  lastSeenAt: Date;
}

const IntentSchema = new Schema<IIntent>({
  userId: { type: String, required: true, index: true },
  merchantId: { type: String, index: true },
  appType: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  intentKey: { type: String, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1, default: 0.5 },
  status: {
    type: String,
    enum: ['ACTIVE', 'DORMANT', 'FULFILLED', 'EXPIRED'],
    default: 'ACTIVE',
    index: true
  },
  signals: [IntentSignalSchema]
}, {
  timestamps: false,
  versionKey: false
});

// Compound indexes
IntentSchema.index({ userId: 1, appType: 1, intentKey: 1 }, { unique: true });
IntentSchema.index({ userId: 1, status: 1 });
IntentSchema.index({ status: 1, lastSeenAt: 1 });

export const Intent: Model<IIntent> = mongoose.model<IIntent>('Intent', IntentSchema);
```

### 6.2 Prisma (resturistan/backend)

**Schema Pattern:**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  phone        String?   @unique
  passwordHash String    @map("password_hash")
  role         String
  isActive     Boolean   @default(true) @map("is_active")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  // Relations
  restaurant  Restaurant?
  employee   Employee?
  vendor     Vendor?

  @@index([email])
  @@index([role])
  @@map("users")
}
```

**Service Pattern:**

```typescript
// src/prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  // Helper methods
  async getUserById(id: string) {
    return this.user.findUnique({
      where: { id },
      include: { restaurant: true, employee: true, vendor: true },
    });
  }
}
```

**Transaction Pattern:**

```typescript
// Using Prisma transactions
const result = await this.prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email, passwordHash, role },
  });

  if (role === 'restaurant') {
    await tx.restaurant.create({
      data: { userId: user.id, businessName, ownerName },
    });
  }

  return user;
});
```

---

## 7. API Conventions

### 7.1 Request/Response Format

**Success Response:**
```typescript
{
  success: true,
  data: { ... }
}
```

**Error Response:**
```typescript
{
  success: false,
  message: 'Error description',
  error: 'ERROR_CODE' // optional
}
```

### 7.2 Route Definition Pattern (Express)

```typescript
// src/api/intent.routes.ts
import { Router, Request, Response } from 'express';

const router = Router();

// POST endpoint
router.post('/capture', verifyInternalToken, captureLimiter, async (req: Request, res: Response) => {
  try {
    const { userId, appType, intentKey } = req.body;

    if (!userId || !appType || !intentKey) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const result = await intentCaptureService.capture({ userId, appType, intentKey, ... });
    res.json({ success: true, data: result });

  } catch (error) {
    console.error('[IntentAPI] Capture failed:', error);
    res.status(500).json({ success: false, message: 'Failed to capture intent' });
  }
});

// GET endpoint with params
router.get('/active/:userId', verifyInternalToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const intents = await intentCaptureService.getActiveIntents(userId);
    res.json({ success: true, data: intents });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get intents' });
  }
});

// Query parameters
router.get('/similar', verifyInternalToken, async (req: Request, res: Response) => {
  const { userId, intentKey, category, limit } = req.query;
  // ...
});

export default router;
```

### 7.3 NestJS Controller Pattern

```typescript
// src/auth/auth.controller.ts
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}
```

---

## 8. File Upload Patterns

### 8.1 S3 Upload Service

```typescript
// src/uploads/uploads.service.ts
@Injectable()
export class UploadsService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
  }

  async uploadFile(file: Express.Multer.File, folder: string, userId: string) {
    this.validateFile(file, folder);

    const filename = `${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname)}`;
    const key = `${folder}/${userId}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    await this.s3Client.send(command);

    const url = `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;

    return { url, key, filename: file.originalname, size: file.size, mimeType: file.mimetype };
  }

  private validateFile(file: Express.Multer.File, folder: string): void {
    const allowedTypes = {
      'profile-pictures': ['image/jpeg', 'image/png', 'image/webp'],
      'documents': ['application/pdf', 'image/jpeg', 'image/png'],
      'resumes': ['application/pdf', 'application/msword'],
    }[folder] || ['image/jpeg', 'image/png', 'application/pdf'];

    const maxSizes = {
      'profile-pictures': 5 * 1024 * 1024,  // 5MB
      'documents': 10 * 1024 * 1024,        // 10MB
      'resumes': 5 * 1024 * 1024,
    }[folder] || 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSizes) {
      throw new BadRequestException(`File too large. Max: ${maxSizes / 1024 / 1024}MB`);
    }
  }
}
```

---

## 9. Error Handling Patterns

### 9.1 Express Error Handling

```typescript
// Global error handler middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('[Error]', err);

  if (err instanceof ValidationError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors,
    });
    return;
  }

  if (err instanceof UnauthorizedError) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
```

### 9.2 NestJS Exception Handling

```typescript
// NestJS uses built-in exceptions
throw new BadRequestException('Failed to create user account');
throw new UnauthorizedException('Invalid credentials');
throw new ConflictException('User already exists with this email or phone');
throw new NotFoundException('User not found');
```

### 9.3 Validation Pipes

```typescript
// src/main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip non-whitelisted properties
    forbidNonWhitelisted: true, // Throw on non-whitelisted
    transform: true,            // Auto-transform payloads to DTOs
  }),
);
```

---

## 10. FSM (Finite State Machine) Patterns

### 10.1 Payment FSM

```typescript
// src/fsm/paymentFsm.ts
export const PAYMENT_STATE_TRANSITIONS: Readonly<Record<PaymentStatus, readonly PaymentStatus[]>> = {
  [PaymentStatus.PENDING]: [PaymentStatus.PROCESSING, PaymentStatus.CANCELLED, PaymentStatus.EXPIRED],
  [PaymentStatus.PROCESSING]: [PaymentStatus.COMPLETED, PaymentStatus.FAILED],
  [PaymentStatus.COMPLETED]: [PaymentStatus.REFUND_INITIATED],
  [PaymentStatus.FAILED]: [PaymentStatus.PENDING], // retry path
  [PaymentStatus.CANCELLED]: [], // terminal
  [PaymentStatus.EXPIRED]: [], // terminal
  [PaymentStatus.REFUND_INITIATED]: [PaymentStatus.REFUND_PROCESSING],
  [PaymentStatus.REFUND_PROCESSING]: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED],
  [PaymentStatus.REFUNDED]: [], // terminal
  [PaymentStatus.REFUND_FAILED]: [PaymentStatus.REFUND_INITIATED],
  [PaymentStatus.PARTIALLY_REFUNDED]: [PaymentStatus.REFUND_INITIATED],
} as const;

// Usage
export function isValidPaymentTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  const allowed = PAYMENT_STATE_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function assertValidPaymentTransition(from: PaymentStatus, to: PaymentStatus): void {
  if (!isValidPaymentTransition(from, to)) {
    throw new Error(
      `Invalid payment status transition: ${from} -> ${to}. ` +
      `Allowed from ${from}: [${allowed.join(', ')}]`
    );
  }
}
```

### 10.2 Order FSM

```typescript
// src/fsm/orderFsm.ts
export const ORDER_STATE_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  [OrderStatus.PLACED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLING, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLING],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLING],
  [OrderStatus.READY]: [OrderStatus.DISPATCHED, OrderStatus.DELIVERED, OrderStatus.CANCELLING],
  [OrderStatus.DISPATCHED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLING],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLING],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURNED, OrderStatus.REFUNDED],
  [OrderStatus.CANCELLING]: [OrderStatus.CANCELLED],
  [OrderStatus.CANCELLED]: [], // terminal
  [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [], // terminal
} as const;

// Convenience helpers
export const ORDER_ACTIVE_STATES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.PLACED,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DISPATCHED,
  OrderStatus.OUT_FOR_DELIVERY,
]);

export const ORDER_CANCELLABLE_STATES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.PLACED,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DISPATCHED,
  OrderStatus.OUT_FOR_DELIVERY,
]);

export function canOrderBeCancelled(status: OrderStatus): boolean {
  return ORDER_CANCELLABLE_STATES.has(status);
}
```

---

## 11. Branded ID Types

Branded IDs provide compile-time type safety for ID types:

```typescript
// src/branded/ids.ts

/** Generic brand helper */
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type OrderId = Brand<string, 'OrderId'>;
export type UserId = Brand<string, 'UserId'>;
export type MerchantId = Brand<string, 'MerchantId'>;
export type StoreId = Brand<string, 'StoreId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type PaymentId = Brand<string, 'PaymentId'>;
export type WalletId = Brand<string, 'WalletId'>;
export type CategoryId = Brand<string, 'CategoryId'>;
export type CampaignId = Brand<string, 'CampaignId'>;
export type CouponId = Brand<string, 'CouponId'>;
export type RefundId = Brand<string, 'RefundId'>;

/** Validation regex for MongoDB ObjectIds */
const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

export function isObjectIdLike(s: unknown): s is string {
  return typeof s === 'string' && OBJECT_ID_REGEX.test(s);
}

/** Constructor functions that validate and brand */
export const toOrderId = (s: unknown): OrderId => {
  if (!isObjectIdLike(s)) {
    throw new Error(`OrderId must be a 24-char hex ObjectId, got: ${JSON.stringify(s)}`);
  }
  return s as OrderId;
};

export const toPaymentId = (s: unknown): PaymentId => {
  if (typeof s !== 'string' || s.trim().length === 0) {
    throw new Error(`PaymentId must be a non-empty string`);
  }
  return s as PaymentId;
};
```

**Usage:**

```typescript
// TypeScript will prevent passing OrderId where UserId is expected
import { OrderId, toOrderId, type UserId } from '@rez/shared-types/branded';

// Valid usage
const orderId: OrderId = toOrderId(req.params.orderId);

// Compile error: Type 'OrderId' is not assignable to type 'UserId'
const userId: UserId = orderId; // ERROR!
```

---

## 12. Runtime Guards

Runtime guards validate data without Zod dependency (for consumer apps):

```typescript
// src/guards/index.ts

const OBJECT_ID = /^[a-fA-F0-9]{24}$/;

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

const ORDER_STATUS_SET: ReadonlySet<string> = new Set(Object.values(OrderStatus));

/** Minimal Order-shape guard */
export function isOrderResponse(value: unknown): value is IOrder {
  if (!isObj(value)) return false;
  if (!isNonEmptyString(value.orderNumber)) return false;
  if (typeof value.status !== 'string' || !ORDER_STATUS_SET.has(value.status)) return false;
  if (!Array.isArray(value.items) || value.items.length === 0) return false;
  const totals = value.totals;
  if (!isObj(totals) || !isFiniteNumber(totals.total)) return false;
  return true;
}

/** Array guard helper */
export function isArrayOf<T>(
  value: unknown,
  itemGuard: (x: unknown) => x is T,
): value is T[] {
  return Array.isArray(value) && value.every(itemGuard);
}
```

**Usage:**

```typescript
import { isOrderResponse, isArrayOf } from '@rez/shared-types';

const data = await fetchOrder();
if (isOrderResponse(data)) {
  // TypeScript knows data is IOrder here
  console.log(data.orderNumber);
}

// For arrays
const orders = await fetchOrders();
if (isArrayOf(orders, isOrderResponse)) {
  // TypeScript knows orders is IOrder[] here
  orders.forEach(order => console.log(order.orderNumber));
}
```

---

## 13. Caching & Performance

### 13.1 Redis Caching Pattern (rez-intent-graph)

```typescript
// src/services/IntentCacheService.ts
import Redis from 'ioredis';
import { log } from '../utils/logger.js';

const CACHE_TTL = 300; // 5 minutes

export class IntentCacheService {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, { data: any; expiry: number }>();

  constructor() {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
    }
  }

  async get(key: string): Promise<any | null> {
    if (this.redis) {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    }
    // Fallback to memory cache
    const entry = this.memoryCache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.data;
    }
    this.memoryCache.delete(key);
    return null;
  }

  async set(key: string, data: any, ttl = CACHE_TTL): Promise<void> {
    if (this.redis) {
      await this.redis.setex(key, ttl, JSON.stringify(data));
      return;
    }
    // Fallback to memory cache
    this.memoryCache.set(key, { data, expiry: Date.now() + ttl * 1000 });
  }

  async invalidate(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(key);
      return;
    }
    this.memoryCache.delete(key);
  }
}

export const intentCacheService = new IntentCacheService();
```

### 13.2 Cache Usage in Services

```typescript
async getActiveIntents(userId: string): Promise<IIntent[]> {
  // Try cache first
  const cached = await intentCacheService.getActiveIntents(userId);
  if (cached) {
    return cached as unknown as IIntent[];
  }

  // Fall back to MongoDB
  const intents = await Intent.find({ userId, status: 'ACTIVE' })
    .sort({ lastSeenAt: -1 })
    .limit(50);

  // Cache for next request
  if (intents.length > 0) {
    await intentCacheService.setActiveIntents(userId, intents.map(i => ({
      id: i._id.toString(),
      userId: i.userId,
      intentKey: i.intentKey,
      confidence: i.confidence,
      lastSeenAt: i.lastSeenAt.toISOString(),
    })));
  }

  return intents;
}
```

---

## 14. Testing Patterns

### 14.1 Jest Configuration (rez-intent-graph)

```javascript
// jest.config.ts
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};
```

### 14.2 Unit Test Example

```typescript
// src/__tests__/unit/middleware/circuitBreaker/circuitBreaker.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
    });
  });

  it('should allow requests when circuit is closed', async () => {
    const result = await circuitBreaker.execute(async () => 'success');
    expect(result).toBe('success');
  });

  it('should open circuit after threshold failures', async () => {
    const failingFn = vi.fn().mockRejectedValue(new Error('fail'));

    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingFn)).rejects.toThrow('fail');
    }

    // Circuit should now be open
    expect(circuitBreaker.state).toBe('OPEN');
  });
});
```

### 14.3 Integration Test Pattern

```typescript
// src/__tests__/integration/intentCapture.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDB, disconnectDB } from '../../database/mongodb.js';
import { IntentCaptureService } from '../../services/IntentCaptureService.js';

describe('IntentCaptureService Integration', () => {
  let service: IntentCaptureService;

  beforeAll(async () => {
    await connectDB();
    service = new IntentCaptureService();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('should capture and retrieve intents', async () => {
    const result = await service.capture({
      userId: 'test-user-123',
      appType: 'restaurant',
      eventType: 'search',
      category: 'DINING',
      intentKey: 'pizza',
    });

    expect(result.isNew).toBe(true);
    expect(result.intent.userId).toBe('test-user-123');

    const intents = await service.getUserIntents('test-user-123');
    expect(intents).toHaveLength(1);
  });
});
```

---

## 15. Deployment Patterns

### 15.1 Environment Variables

**Required for rez-intent-graph:**
```bash
# Core
NODE_ENV=production
PORT=3001

# MongoDB
MONGODB_URI=mongodb+srv://...

# Redis (optional)
REDIS_URL=redis://...

# Authentication
INTERNAL_SERVICE_TOKEN=<secure-random-string>
INTENT_CRON_SECRET=<secure-random-string>

# External Services
AUTH_SERVICE_URL=https://rez-auth-service...
ORDER_SERVICE_URL=https://rez-order-service...
```

**Required for resturistan/backend:**
```bash
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=<secure-random-string>
JWT_EXPIRES_IN=7d

# AWS S3
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...

# Payment
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

### 15.2 Docker Compose Pattern

```yaml
# docker-compose.yml (simplified)
version: '3.8'

services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  intent-graph:
    build: ./rez-intent-graph
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/rez_intent
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis

volumes:
  mongodb_data:
```

### 15.3 Health Checks

```typescript
// src/health/health.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';

export async function healthCheck(req: Request, res: Response) {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';

  const checks = {
    status: mongoStatus === 'healthy' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoStatus,
    },
  };

  res.status(checks.status === 'ok' ? 200 : 503).json(checks);
}

// Detailed health check with auth
export async function detailedHealthCheck(req: Request, res: Response) {
  const secret = req.headers['x-health-secret'];
  if (secret !== process.env.HEALTH_CHECK_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Include detailed metrics
  const metrics = await getDetailedMetrics();
  res.json(metrics);
}
```

---

## 16. Best Practices

### 16.1 Type Safety

1. **Always use branded IDs for type safety:**
   ```typescript
   // Bad
   function getOrder(orderId: string) { ... }

   // Good
   function getOrder(orderId: OrderId) { ... }
   ```

2. **Use discriminated unions for complex states:**
   ```typescript
   type Result =
     | { success: true; data: Order }
     | { success: false; error: string };
   ```

3. **Prefer interfaces for external data (API responses):**
   ```typescript
   interface IOrder { ... }  // External data
   type Order = IOrder & { /* internal-only methods */ }
   ```

### 16.2 Error Handling

1. **Never swallow errors silently:**
   ```typescript
   // Bad
   try {
     await doSomething();
   } catch (e) {}

   // Good
   try {
     await doSomething();
   } catch (error) {
     log.error('Operation failed', { error, context });
     throw new OperationError('Failed to do something', { cause: error });
   }
   ```

2. **Use specific error types:**
   ```typescript
   class ValidationError extends Error { ... }
   class NotFoundError extends Error { ... }
   class UnauthorizedError extends Error { ... }
   ```

3. **Include context in errors:**
   ```typescript
   throw new Error(`Failed to process order ${orderId} for user ${userId}`);
   ```

### 16.3 Performance

1. **Use database indexes wisely:**
   ```typescript
   // Compound indexes for common queries
   schema.index({ userId: 1, status: 1 });

   // Index for sorting
   schema.index({ lastSeenAt: -1 });
   ```

2. **Implement caching for expensive operations:**
   ```typescript
   // Cache hot data
   const cached = await cache.get(key);
   if (cached) return cached;
   ```

3. **Use pagination for large datasets:**
   ```typescript
   const page = parseInt(req.query.page as string) || 1;
   const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
   const skip = (page - 1) * limit;

   const results = await Model.find(query).skip(skip).limit(limit);
   ```

### 16.4 Security

1. **Always hash passwords with bcrypt:**
   ```typescript
   const hash = await bcrypt.hash(password, 12);
   ```

2. **Use timing-safe comparisons for secrets:**
   ```typescript
   const valid = crypto.timingSafeEqual(
     Buffer.from(input),
     Buffer.from(expected)
   );
   ```

3. **Validate and sanitize all inputs:**
   ```typescript
   const schema = z.object({
     email: z.string().email(),
     amount: z.number().positive().max(1000000),
   });
   ```

4. **Never expose internal details in errors:**
   ```typescript
   // Bad
   res.status(500).json({ error: err.stack });

   // Good
   res.status(500).json({ error: 'Internal server error' });
   ```

### 16.5 Code Organization

1. **Follow single responsibility:**
   ```typescript
   // Bad
   class UserService {
     createUser() { ... }
     sendEmail() { ... }
     processPayment() { ... }
   }

   // Good
   class UserService { createUser() { ... } }
   class EmailService { sendEmail() { ... } }
   class PaymentService { processPayment() { ... } }
   ```

2. **Use dependency injection:**
   ```typescript
   // NestJS style
   @Injectable()
   export class OrderService {
     constructor(
       private prisma: PrismaService,
       private eventBus: EventBus,
     ) {}
   }
   ```

3. **Centralize configuration:**
   ```typescript
   // config/index.ts
   export const config = {
     mongodb: process.env.MONGODB_URI,
     redis: process.env.REDIS_URL,
     // ...
   };
   ```

---

## Appendix A: Quick Reference

### Import Patterns

```typescript
// Shared types (backend/consumer)
import type { IOrder, IUser } from '@rez/shared-types';
import { OrderStatus, CoinType } from '@rez/shared-types';
import { CreateOrderSchema } from '@rez/shared-types';
import { isValidPaymentTransition } from '@rez/shared-types/fsm';
import { toOrderId, type OrderId } from '@rez/shared-types/branded';
import { isOrderResponse } from '@rez/shared-types/guards';
```

### Environment Variable Checklist

| Variable | Project | Required |
|----------|---------|----------|
| `MONGODB_URI` | rez-intent-graph | Yes |
| `REDIS_URL` | rez-intent-graph | No |
| `INTERNAL_SERVICE_TOKEN` | All | Yes |
| `DATABASE_URL` | resturistan | Yes |
| `JWT_SECRET` | resturistan | Yes |
| `AWS_*` | resturistan | Yes (if using uploads) |

### Common Enum Values

**OrderStatus:**
```
placed, confirmed, preparing, ready, dispatched,
out_for_delivery, delivered, cancelled, cancelling, returned, refunded
```

**PaymentStatus:**
```
pending, processing, completed, failed, cancelled, expired,
refund_initiated, refund_processing, refunded, refund_failed, partially_refunded
```

**UserRole:**
```
user, consumer, merchant, admin, support, operator, super_admin
```

---

## Appendix B: Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check `MONGODB_URI` format: `mongodb+srv://user:pass@host/?options`
   - Verify network access to MongoDB Atlas
   - Check username/password are URL-encoded if special characters

2. **Prisma Client Not Generated**
   - Run `npx prisma generate` after schema changes
   - Verify `DATABASE_URL` is set correctly

3. **JWT Validation Fails**
   - Check `JWT_SECRET` matches between services
   - Verify token hasn't expired
   - Check clock synchronization between servers

4. **Rate Limiting Issues**
   - Check `ThrottlerModule` configuration
   - Verify Redis is accessible (if using distributed rate limiting)

---

*Document Version: 1.0.0 | Last Updated: 2026-05-05*
