# ReZ Backend Architecture - Developer Training Guide

**Project:** Restaurant SaaS Backend
**Location:** `/Users/rejaulkarim/Documents/resturistan/backend`
**Framework:** NestJS 10.x with TypeScript 5.x
**Database:** Prisma ORM with SQLite (dev) / PostgreSQL (prod)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [NestJS Module Structure](#2-nestjs-module-structure)
3. [Prisma Schema - Complete Entity Reference](#3-prisma-schema---complete-entity-reference)
4. [Authentication Flow](#4-authentication-flow)
5. [API Endpoints Reference](#5-api-endpoints-reference)
6. [Database Patterns](#6-database-patterns)
7. [Security Implementations](#7-security-implementations)
8. [File Upload to S3](#8-file-upload-to-s3)
9. [Error Handling Patterns](#9-error-handling-patterns)
10. [Environment Configuration](#10-environment-configuration)
11. [Docker Setup](#11-docker-setup)
12. [Interview Questions](#12-interview-questions)
13. [Common Issues & Debugging](#13-common-issues--debugging)

---

## 1. Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Node.js 18+ | Server runtime |
| Framework | NestJS 10.x | Application framework |
| Language | TypeScript 5.x | Type safety |
| ORM | Prisma 5.x | Database abstraction |
| Database | SQLite (dev) / PostgreSQL (prod) | Data persistence |
| Auth | JWT + Passport | Authentication |
| File Storage | AWS S3 | Media uploads |
| Payments | Razorpay | Payment processing |
| Real-time | Socket.io | WebSocket communication |
| API Docs | Swagger/OpenAPI | API documentation |
| Rate Limiting | @nestjs/throttler | API protection |

### Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── src/
│   ├── main.ts                # Application bootstrap
│   ├── app.module.ts          # Root module
│   ├── auth/                  # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── guards/            # Auth guards
│   │   ├── strategies/        # Passport strategies
│   │   ├── decorators/        # Custom decorators
│   │   └── dto/               # Auth DTOs
│   ├── restaurants/           # Restaurant management
│   ├── employees/             # Employee management
│   ├── jobs/                  # Job portal
│   ├── vendors/               # Vendor marketplace
│   ├── discussions/           # Community forum
│   ├── payments/              # Payment processing
│   ├── notifications/         # Notifications
│   ├── uploads/               # File uploads (S3)
│   ├── search/                # Search functionality
│   │   └── services/          # Search implementations
│   ├── websockets/             # Real-time features
│   ├── analytics/             # Analytics & tracking
│   └── prisma/                # Database service
├── Dockerfile
├── Dockerfile.prod
├── package.json
└── tsconfig.json
```

---

## 2. NestJS Module Structure

### Root Module (`app.module.ts`)

```typescript
@Module({
  imports: [
    // Environment configuration - global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting - 100 requests per minute
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Database service
    PrismaModule,

    // Feature modules (currently commented for basic server)
    // AuthModule,
    // RestaurantsModule,
    // EmployeesModule,
    // JobsModule,
    // VendorsModule,
    // DiscussionsModule,
    // PaymentsModule,
    // NotificationsModule,
    // UploadsModule,
    // AnalyticsModule,
  ],
})
export class AppModule {}
```

### Module Pattern

Each feature module follows the standard pattern:

```typescript
// Module Definition
@Module({
  controllers: [FeatureController],    // HTTP endpoints
  providers: [FeatureService],       // Business logic
  exports: [FeatureService],         // Shared if needed
})
export class FeatureModule {}
```

### Available Modules

| Module | Purpose | File |
|--------|---------|------|
| `PrismaModule` | Database access (Global) | `src/prisma/prisma.module.ts` |
| `AuthModule` | User authentication | `src/auth/auth.module.ts` |
| `RestaurantsModule` | Restaurant profiles | `src/restaurants/restaurants.module.ts` |
| `EmployeesModule` | Employee profiles | `src/employees/employees.module.ts` |
| `JobsModule` | Job postings | `src/jobs/jobs.module.ts` |
| `VendorsModule` | Vendor marketplace | `src/vendors/vendors.module.ts` |
| `DiscussionsModule` | Community forum | `src/discussions/discussions.module.ts` |
| `PaymentsModule` | Payment processing | `src/payments/payments.module.ts` |
| `NotificationsModule` | Push notifications | `src/notifications/notifications.module.ts` |
| `UploadsModule` | S3 file uploads | `src/uploads/uploads.module.ts` |
| `SearchModule` | Global search | `src/search/search.module.ts` |
| `WebSocketsModule` | Real-time messaging | `src/websockets/websockets.module.ts` |
| `AnalyticsModule` | Event tracking | `src/analytics/analytics.module.ts` |

---

## 3. Prisma Schema - Complete Entity Reference

### Entity Relationship Diagram

```
User (1) ──┬── (1) Restaurant
           ├── (1) Employee
           ├── (1) Vendor
           ├── (*) Job ────── (N) JobApplication ── (1) Employee
           ├── (*) Discussion ── (N) DiscussionComment
           ├── (*) DirectMessage
           ├── (*) Document
           ├── (*) Payment
           ├── (*) Notification
           ├── (*) MarketplaceOrder
           └── (*) CreditTransaction
                      │
                      └── (*) MarketplaceOrderItem ── (1) VendorOffering

Restaurant (1) ──┬── (*) RestaurantAddress
                 ├── (*) EmploymentHistory ── (1) Employee
                 ├── (*) EmployeeReview
                 └── (*) VendorReview ── (1) Vendor

Employee (1) ──┬── (*) EmployeeAddress
               ├── (*) EmploymentHistory ── (1) Restaurant
               ├── (*) EmployeeReview
               └── (*) JobApplication

Vendor (1) ──┬── (*) VendorAddress
             ├── (*) VendorOffering
             └── (*) VendorReview ── (1) Restaurant
```

### Core Entities

#### User Entity
```prisma
model User {
  id               String    @id @default(uuid())
  email            String    @unique
  phone            String?   @unique
  passwordHash     String    @map("password_hash")
  role             String    // 'restaurant', 'employee', 'vendor', 'admin'
  isEmailVerified  Boolean   @default(false)
  isPhoneVerified  Boolean   @default(false)
  isActive         Boolean   @default(true)
  lastLogin        DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // Relations
  restaurant         Restaurant?
  employee           Employee?
  vendor             Vendor?
  jobs               Job[]
  discussions        Discussion[]
  comments           DiscussionComment[]
  sentMessages       DirectMessage[]      @relation("SentMessages")
  receivedMessages   DirectMessage[]      @relation("ReceivedMessages")
  documents          Document[]
  verifiedDocs       Document[]
  payments           Payment[]
  notifications      Notification[]
  employeeReviews    EmployeeReview[]
  vendorReviews      VendorReview[]
  marketplaceOrders  MarketplaceOrder[]
  creditTransactions CreditTransaction[]

  @@index([email])
  @@index([role])
  @@index([isActive])
}
```

#### Restaurant Entity
```prisma
model Restaurant {
  id                   String              @id @default(uuid())
  userId               String              @unique
  businessName         String
  ownerName            String
  category             String              // 'fine_dining', 'qsr', 'cafe', etc.
  gstNumber            String?
  fssaiLicense         String?
  revenueRange         String?
  totalEmployees       Int                 @default(0)
  websiteUrl           String?
  description          String?
  logoUrl              String?
  isVerified           Boolean             @default(false)
  trustScore           Int                 @default(50)
  subscriptionPlan     String              @default("free")
  subscriptionStatus   String              @default("inactive")
  subscriptionExpiresAt DateTime?
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt

  // Relations
  user              User                 @relation(fields: [userId], references: [id])
  addresses         RestaurantAddress[]
  employmentHistory EmploymentHistory[]
  jobs              Job[]
  employeeReviews   EmployeeReview[]
  vendorReviews     VendorReview[]
}
```

#### Employee Entity
```prisma
model Employee {
  id                      String             @id @default(uuid())
  userId                  String             @unique
  aadhaarNumber           String?            @unique
  fullName                String
  dateOfBirth             DateTime?
  gender                  String?
  maritalStatus           String?
  totalExperienceMonths   Int                @default(0)
  education               String?
  certifications          String?
  skills                  String?            // JSON string array
  profilePictureUrl       String?
  resumeUrl               String?
  aadhaarVerificationStatus String           @default("pending")
  reliabilityScore        Int                @default(50)
  isProfileComplete       Boolean            @default(false)
  createdAt               DateTime           @default(now())
  updatedAt               DateTime           @updatedAt

  // Relations
  user              User                @relation(fields: [userId], references: [id])
  addresses         EmployeeAddress[]
  employmentHistory EmploymentHistory[]
  jobApplications   JobApplication[]
  reviews           EmployeeReview[]

  @@index([fullName])
  @@index([totalExperienceMonths])
  @@index([reliabilityScore])
}
```

#### Vendor Entity
```prisma
model Vendor {
  id           String    @id @default(uuid())
  userId       String    @unique
  businessName String
  ownerName    String
  category     String    // 'raw_materials', 'equipment', 'services'
  gstNumber    String?
  description  String?
  websiteUrl   String?
  logoUrl      String?
  isVerified   Boolean   @default(false)
  trustScore   Int       @default(50)
  isPremium    Boolean   @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // Relations
  user      User             @relation(fields: [userId], references: [id])
  addresses VendorAddress[]
  offerings VendorOffering[]
  reviews   VendorReview[]
}
```

### Job Portal Entities

#### Job Entity
```prisma
model Job {
  id             String           @id @default(uuid())
  restaurantId   String
  title          String
  description    String
  position       String
  department     String?
  employmentType String           // 'full_time', 'part_time', 'contract'
  salaryMin      Int?
  salaryMax      Int?
  experienceMin  Int              @default(0)
  experienceMax  Int?
  location       String
  requirements   String?          // JSON string
  benefits       String?          // JSON string
  status         String           @default("open")  // 'open', 'closed', 'filled'
  isPremium      Boolean          @default(false)
  expiresAt      DateTime?
  createdBy      String
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  // Relations
  restaurant   Restaurant       @relation(fields: [restaurantId], references: [id])
  creator      User             @relation(fields: [createdBy], references: [id])
  applications JobApplication[]

  @@index([status])
  @@index([location])
  @@index([position])
  @@index([status, location])
}
```

#### JobApplication Entity
```prisma
model JobApplication {
  id          String            @id @default(uuid())
  jobId       String
  employeeId  String
  coverLetter String?
  status      String            @default("pending")  // 'pending', 'shortlisted', 'rejected', 'hired'
  appliedAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  // Relations
  job      Job      @relation(fields: [jobId], references: [id])
  employee Employee @relation(fields: [employeeId], references: [id])

  @@unique([jobId, employeeId])
}
```

### Review System

#### EmployeeReview Entity
```prisma
model EmployeeReview {
  id                  String             @id @default(uuid())
  employeeId          String
  restaurantId        String
  employmentHistoryId String?
  tag                 String             // 'thief', 'misbehavior', 'reliable', 'star_employee'
  comment             String?
  isDisputed          Boolean            @default(false)
  employeeReply       String?
  createdBy           String
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  // Relations
  employee          Employee           @relation(fields: [employeeId], references: [id])
  restaurant        Restaurant         @relation(fields: [restaurantId], references: [id])
  employmentHistory EmploymentHistory? @relation(fields: [employmentHistoryId], references: [id])
  creator           User               @relation(fields: [createdBy], references: [id])
}
```

### Marketplace Entities

#### MarketplaceOrder Entity
```prisma
model MarketplaceOrder {
  id              String   @id @default(uuid())
  userId          String
  subtotal        Float
  gstAmount       Float
  deliveryFee     Float
  creditUsed      Float    @default(0)
  totalAmount     Float
  status          String   @default("pending")  // 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  paymentMethod   String
  paymentStatus   String   @default("pending")
  deliveryAddress String   // JSON string
  trackingNumber  String?
  estimatedDelivery DateTime?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  user              User                  @relation(fields: [userId], references: [id])
  items             MarketplaceOrderItem[]
  creditTransactions CreditTransaction[]

  @@index([userId])
  @@index([status])
}
```

#### MarketplaceOrderItem Entity
```prisma
model MarketplaceOrderItem {
  id         String  @id @default(uuid())
  orderId    String
  productId  String
  quantity   Int
  unitPrice  Float
  totalPrice Float

  // Relations
  order   MarketplaceOrder @relation(fields: [orderId], references: [id])
  product VendorOffering   @relation(fields: [productId], references: [id])
}
```

#### CreditTransaction Entity
```prisma
model CreditTransaction {
  id          String   @id @default(uuid())
  userId      String
  type        String   // 'credit', 'debit'
  amount      Float
  balance     Float
  description String
  orderId     String?
  createdAt   DateTime @default(now())

  // Relations
  user  User              @relation(fields: [userId], references: [id])
  order MarketplaceOrder? @relation(fields: [orderId], references: [id])

  @@index([userId])
  @@index([createdAt])
}
```

### Communication Entities

#### Discussion Entity
```prisma
model Discussion {
  id            String              @id @default(uuid())
  userId        String
  title         String
  content       String
  category      String              // 'staff_shortage', 'vendor_inquiry', 'business_offer'
  isPremium     Boolean             @default(false)
  likesCount    Int                 @default(0)
  commentsCount Int                 @default(0)
  isActive      Boolean             @default(true)
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  // Relations
  user     User                @relation(fields: [userId], references: [id])
  comments DiscussionComment[]
}
```

#### DiscussionComment Entity
```prisma
model DiscussionComment {
  id              String              @id @default(uuid())
  discussionId    String
  userId          String
  content         String
  parentCommentId String?
  likesCount      Int                 @default(0)
  isActive        Boolean             @default(true)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  // Relations
  discussion    Discussion           @relation(fields: [discussionId], references: [id])
  user          User                 @relation(fields: [userId], references: [id])
  parentComment DiscussionComment?   @relation("CommentReplies", fields: [parentCommentId])
  replies       DiscussionComment[]  @relation("CommentReplies")
}
```

#### DirectMessage Entity
```prisma
model DirectMessage {
  id         String   @id @default(uuid())
  senderId   String
  receiverId String
  content    String
  isPaid     Boolean  @default(false)
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())

  // Relations
  sender   User @relation("SentMessages", fields: [senderId], references: [id])
  receiver User @relation("ReceivedMessages", fields: [receiverId], references: [id])
}
```

### Payment Entities

#### Payment Entity
```prisma
model Payment {
  id                 String           @id @default(uuid())
  userId             String
  subscriptionPlanId String?
  amount             Int              // in paise (INR)
  currency           String           @default("INR")
  paymentGateway     String
  gatewayPaymentId   String?
  gatewayOrderId     String?
  status             String           @default("pending")  // 'pending', 'completed', 'failed'
  paymentDate        DateTime?
  createdAt          DateTime         @default(now())

  // Relations
  user             User              @relation(fields: [userId], references: [id])
  subscriptionPlan SubscriptionPlan? @relation(fields: [subscriptionPlanId], references: [id])
}
```

#### SubscriptionPlan Entity
```prisma
model SubscriptionPlan {
  id           String    @id @default(uuid())
  name         String
  price        Int       // in paise
  durationDays Int
  features     String    // JSON string
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())

  // Relations
  payments Payment[]
}
```

### Notification Entity
```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  title     String
  message   String
  type      String   // 'job_application', 'verification', 'payment', 'message'
  isRead    Boolean  @default(false)
  actionUrl String?
  createdAt DateTime @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id])

  @@index([userId, isRead])
  @@index([createdAt])
}
```

### Address Entities

#### RestaurantAddress
```prisma
model RestaurantAddress {
  id           String     @id @default(uuid())
  restaurantId String
  addressLine1 String
  addressLine2 String?
  city         String
  state        String
  pincode      String
  country      String     @default("India")
  isPrimary    Boolean    @default(false)
  latitude     Float?
  longitude    Float?
  createdAt    DateTime   @default(now())

  // Relations
  restaurant Restaurant @relation(fields: [restaurantId], references: [id])
}
```

---

## 4. Authentication Flow

### Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT                                    │
│  1. Register/Login → Receive JWT Token                           │
│  2. Include JWT in Authorization header                         │
│  3. Access protected endpoints                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NESTJS SERVER                              │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │ LocalAuthGuard │ → │ JwtStrategy │ → │ JwtAuthGuard │          │
│  │  (login)     │    │  (validate) │    │  (protect)   │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    AuthService                              ││
│  │  • register() - Create user + role profile                 ││
│  │  • login() - Validate credentials, return JWT              ││
│  │  • validateUser() - Passport callback                      ││
│  │  • getProfile() - Get current user                         ││
│  │  • changePassword() - Update password                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### User Roles

```typescript
enum UserRole {
  ADMIN = 'admin',
  RESTAURANT = 'restaurant',
  EMPLOYEE = 'employee',
  VENDOR = 'vendor'
}
```

### JWT Token Structure

```typescript
// Token Payload
{
  sub: string,    // User ID
  email: string,  // User email
  role: string,   // User role
}

// Token Options
{
  expiresIn: '7d'  // Configurable via JWT_EXPIRES_IN env
}
```

### Auth Guards

#### JwtAuthGuard
```typescript
// Used to protect endpoints requiring authentication
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile() { }
```

#### LocalAuthGuard
```typescript
// Used with Passport local strategy for login
@UseGuards(LocalAuthGuard)
@Post('login')
login() { }
```

#### RolesGuard
```typescript
// Used for role-based access control
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Get('admin-only')
adminEndpoint() { }
```

### Auth Decorators

```typescript
// Get current user from request
@GetProfile()
getProfile(@CurrentUser() user: any) {
  return user;
}

// Get specific field from user
@GetProfile()
getProfile(@CurrentUser('id') userId: string) {
  return userId;
}

// Set required roles
@Roles(UserRole.RESTAURANT, UserRole.ADMIN)
```

### Registration Flow

```typescript
async register(registerDto: RegisterDto) {
  // 1. Check if user exists
  const existingUser = await this.prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] }
  });

  // 2. Hash password (bcrypt with 12 rounds)
  const passwordHash = await bcrypt.hash(password, 12);

  // 3. Create user in transaction
  const user = await this.prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, phone, passwordHash, role }
    });

    // 4. Create role-specific profile
    switch (role) {
      case 'restaurant':
        await tx.restaurant.create({ data: { userId: user.id, ... } });
        break;
      case 'employee':
        await tx.employee.create({ data: { userId: user.id, ... } });
        break;
      case 'vendor':
        await tx.vendor.create({ data: { userId: user.id, ... } });
        break;
    }
    return user;
  });

  // 5. Generate JWT
  const token = this.generateJwtToken(user);

  return { user: this.sanitizeUser(user), token };
}
```

### Login Flow

```typescript
async login(loginDto: LoginDto) {
  // 1. Find user
  const user = await this.prisma.user.findUnique({
    where: { email },
    include: { restaurant: true, employee: true, vendor: true }
  });

  // 2. Check if user exists and is active
  if (!user || !user.isActive) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // 3. Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // 4. Update last login
  await this.prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  // 5. Generate JWT
  const token = this.generateJwtToken(user);

  return { user: this.sanitizeUser(user), token };
}
```

---

## 5. API Endpoints Reference

### API Prefix
All endpoints are prefixed with: `/api/v1`

### Authentication Endpoints

| Method | Endpoint | Description | Auth | Guard |
|--------|----------|-------------|------|-------|
| POST | `/auth/register` | Register new user | No | - |
| POST | `/auth/login` | Login user | No | LocalAuthGuard |
| GET | `/auth/profile` | Get current user profile | Yes | JwtAuthGuard |
| PUT | `/auth/profile` | Update profile | Yes | JwtAuthGuard |
| PUT | `/auth/change-password` | Change password | Yes | JwtAuthGuard |
| POST | `/auth/forgot-password` | Request password reset | No | - |

### Restaurant Endpoints

| Method | Endpoint | Description | Auth | Guard |
|--------|----------|-------------|------|-------|
| POST | `/restaurants` | Create restaurant profile | Yes | JwtAuthGuard |
| GET | `/restaurants` | List all restaurants | No | - |
| GET | `/restaurants/:id` | Get restaurant by ID | No | - |
| GET | `/restaurants/:id/private` | Get restaurant with private details | Yes | JwtAuthGuard |
| PATCH | `/restaurants/:id` | Update restaurant | Yes | JwtAuthGuard |
| DELETE | `/restaurants/:id` | Delete restaurant | Yes | JwtAuthGuard |
| GET | `/restaurants/:id/analytics` | Get restaurant analytics | Yes | JwtAuthGuard |
| PATCH | `/restaurants/:id/subscription` | Update subscription | Yes | JwtAuthGuard |

### Employee Endpoints

| Method | Endpoint | Description | Auth | Guard |
|--------|----------|-------------|------|-------|
| GET | `/employees` | List all employees | No | - |
| GET | `/employees/:id` | Get employee by ID | No | - |

### Job Endpoints

| Method | Endpoint | Description | Auth | Guard |
|--------|----------|-------------|------|-------|
| GET | `/jobs` | List all jobs | No | - |

### Vendor Endpoints

| Method | Endpoint | Description | Auth | Guard |
|--------|----------|-------------|------|-------|
| GET | `/vendors` | List all vendors | No | - |

### Discussion Endpoints

| Method | Endpoint | Description | Auth | Guard |
|--------|----------|-------------|------|-------|
| GET | `/discussions` | List all discussions | No | - |

### Search Endpoints

| Method | Endpoint | Description | Auth | Guard |
|--------|----------|-------------|------|-------|
| GET | `/search/jobs` | Search jobs | No | - |
| GET | `/search/employees` | Search employees | No | - |
| GET | `/search/products` | Search products | No | - |
| GET | `/search/restaurants` | Search restaurants | No | - |

### WebSocket Namespaces

| Namespace | Purpose |
|----------|---------|
| `/messaging` | Real-time messaging |
| `/notifications` | Real-time notifications |

---

## 6. Database Patterns

### Transactions

```typescript
// Single transaction with multiple operations
const result = await this.prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.restaurant.create({ data: { userId: user.id, ... } });
  return user;
});

// Transaction with isolation level (PostgreSQL only)
const result = await this.prisma.$transaction(async (tx) => {
  // operations
}, {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable
});
```

### Pagination Pattern

```typescript
async findAll(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    this.prisma.model.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.model.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
```

### Include Relations

```typescript
// Basic include
const user = await this.prisma.user.findUnique({
  where: { id },
  include: { restaurant: true, employee: true }
});

// Nested include
const job = await this.prisma.job.findUnique({
  where: { id },
  include: {
    restaurant: {
      include: {
        addresses: { where: { isPrimary: true }, take: 1 }
      }
    },
    applications: true
  }
});
```

### Select Specific Fields

```typescript
const user = await this.prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    role: true,
    restaurant: {
      select: { businessName: true, trustScore: true }
    }
  }
});
```

### Upsert Pattern

```typescript
await this.prisma.user.update({
  where: { email },
  data: { lastLogin: new Date() },
  create: { email, lastLogin: new Date() }  // Fallback if not exists
});
```

### Count with Conditions

```typescript
const stats = await this.prisma.job.aggregate({
  where: { restaurantId },
  _count: { id: true },
  _sum: { views: true },
  _avg: { salaryMax: true },
});
```

### Indexes in Schema

```prisma
model User {
  @@index([email])
  @@index([role])
  @@index([isActive])
  @@index([createdAt])
  @@index([role, isActive])  // Composite index
}
```

---

## 7. Security Implementations

### Rate Limiting

```typescript
// Configured in app.module.ts
ThrottlerModule.forRoot([{
  ttl: 60000,    // 1 minute
  limit: 100,    // 100 requests per minute
}]);

// Applied globally via ThrottlerGuard
```

### Helmet.js

```typescript
// Applied in main.ts
app.use(helmet());

// Sets various HTTP headers:
// - X-Frame-Options
// - X-Content-Type-Options
// - X-XSS-Protection
// - Strict-Transport-Security
// - etc.
```

### CORS Configuration

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,  // Allow cookies/auth headers
});
```

### Validation Pipe

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip non-whitelisted properties
    forbidNonWhitelisted: true, // Throw error on non-whitelisted
    transform: true,           // Auto-transform types
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

### Input Validation DTOs

```typescript
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsPhoneNumber('IN')
  phone?: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
```

### Password Hashing

```typescript
// Using bcrypt with 12 rounds
const saltRounds = 12;
const passwordHash = await bcrypt.hash(password, saltRounds);

// Verification
const isValid = await bcrypt.compare(plainPassword, hash);
```

### JWT Security

```typescript
// JWT configuration
JwtModule.registerAsync({
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
    },
  }),
  inject: [ConfigService],
});
```

---

## 8. File Upload to S3

### UploadsService

```typescript
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
  }

  async uploadFile(file: Express.Multer.File, folder: string, userId: string) {
    // 1. Validate file
    this.validateFile(file, folder);

    // 2. Generate unique filename
    const filename = `${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname)}`;
    const key = `${folder}/${userId}/${filename}`;

    // 3. Upload to S3
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadedBy: userId,
      },
    });

    await this.s3Client.send(command);

    // 4. Return URL
    return {
      url: `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`,
      key,
      filename: file.originalname,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: this.bucketName, Key: key });
    await this.s3Client.send(command);
  }
}
```

### File Validation Rules

```typescript
const allowedTypes = {
  'profile-pictures': ['image/jpeg', 'image/png', 'image/webp'],
  'documents': ['application/pdf', 'image/jpeg', 'image/png'],
  'resumes': ['application/pdf', 'application/msword'],
  'restaurant-images': ['image/jpeg', 'image/png', 'image/webp'],
  'product-images': ['image/jpeg', 'image/png', 'image/webp'],
};

const maxSizes = {
  'profile-pictures': 5 * 1024 * 1024,  // 5MB
  'documents': 10 * 1024 * 1024,         // 10MB
  'resumes': 5 * 1024 * 1024,
  'restaurant-images': 8 * 1024 * 1024,
  'product-images': 8 * 1024 * 1024,
};
```

### Multer Configuration

```typescript
// In controller
@UseInterceptors(FileInterceptor('file', {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      callback(null, uniqueSuffix + '-' + file.originalname);
    },
  }),
  fileFilter: (req, file, callback) => {
    // Filter logic
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}))
async uploadFile(@UploadedFile() file: Express.Multer.File) { }
```

---

## 9. Error Handling Patterns

### HTTP Exception Patterns

```typescript
// Bad Request - Client error with explanation
throw new BadRequestException('Invalid input data');

// Unauthorized - Authentication required
throw new UnauthorizedException('Invalid credentials');

// Forbidden - Authenticated but not authorized
throw new ForbiddenException('Access denied');

// Not Found - Resource doesn't exist
throw new NotFoundException('Restaurant not found');

// Conflict - Resource already exists
throw new ConflictException('User already exists');

// Custom error with details
throw new BadRequestException({
  statusCode: 400,
  message: 'Validation failed',
  errors: validationErrors,
});
```

### Service-Level Error Handling

```typescript
async createUser(data: CreateUserDto) {
  try {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Create user
    return await this.prisma.user.create({ data });

  } catch (error) {
    // Log error
    this.logger.error('Failed to create user', error);

    // Re-throw known errors
    if (error instanceof ConflictException) {
      throw error;
    }

    // Convert unknown errors
    throw new InternalServerErrorException('Failed to create user');
  }
}
```

### Global Exception Filter (Recommended Addition)

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Log error
    this.logger.error(exception);

    // Determine status code
    let status = 500;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse() as string;
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

### Async Error Handling

```typescript
// Promise-based error handling
async processData(id: string) {
  try {
    const data = await this.prisma.model.findUnique({ where: { id } });
    if (!data) {
      throw new NotFoundException('Data not found');
    }
    return data;
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    throw new InternalServerErrorException('Processing failed');
  }
}
```

---

## 10. Environment Configuration

### Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_saas"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=8000
NODE_ENV="development"

# Frontend URL (CORS)
FRONTEND_URL="http://localhost:3000"

# AWS S3
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET_NAME="restaurant-saas-uploads"

# Razorpay
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# External Services
INTENT_CAPTURE_URL="https://rez-intent-graph.onrender.com"
INTERNAL_SERVICE_TOKEN="your-internal-service-token"
```

### Configuration Service Usage

```typescript
// In services
constructor(private configService: ConfigService) { }

ngOnInit() {
  const jwtSecret = this.configService.get<string>('JWT_SECRET');
  const port = this.configService.get<number>('PORT', 8000);  // with default
}
```

### Environment-Specific Config

```typescript
// nest-cli.json or separate config files
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [
    `.env.${process.env.NODE_ENV}.local`,
    `.env.${process.env.NODE_ENV}`,
    '.env'
  ]
})
```

---

## 11. Docker Setup

### Development Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS dev
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .
EXPOSE 8000

# Start in watch mode
CMD ["npm", "run", "start:dev"]
```

### Production Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy built app
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

USER nestjs
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
```

### Docker Compose (Recommended Addition)

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/restaurant_saas
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=restaurant_saas
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## 12. Interview Questions

### NestJS Fundamentals

**Q1: How does NestJS handle dependency injection?**
A: NestJS uses a built-in IoC container. Classes declare dependencies via constructors, and NestJS automatically resolves and injects them at runtime. Providers are registered in modules and can be injected into services, controllers, or other providers.

**Q2: What is the difference between modules and services in NestJS?**
A: Modules organize related functionality (controllers, services, providers). Services contain business logic and are injectable. Modules wrap services/controllers, while services contain the actual implementation.

**Q3: How do you implement guards vs interceptors?**
A: Guards implement `CanActivate` and control access based on conditions (roles, auth state). Interceptors implement `NestInterceptor` and wrap the request/response for pre/post processing (logging, transformation, caching).

**Q4: Explain the request lifecycle in NestJS?**
A: Request -> Middleware -> Guard -> Interceptor (pre) -> Pipe -> Controller -> Service -> Interceptor (post) -> Exception Filter -> Response

**Q5: How do you make a service available globally?**
A: Mark the module as `@Global()`. The PrismaModule uses this pattern so PrismaService is available everywhere without importing in every module.

### Authentication & Security

**Q6: How does JWT authentication work in this codebase?**
A: 1) User logs in via `/auth/login` with LocalAuthGuard (Passport local strategy)
2) AuthService validates credentials and generates JWT token
3) Client stores token and includes in Authorization header for subsequent requests
4) JwtAuthGuard extracts and validates JWT using JwtStrategy
5) JwtStrategy fetches user from database and attaches to request

**Q7: What's the difference between LocalStrategy and JwtStrategy?**
A: LocalStrategy validates username/password credentials for login. JwtStrategy validates an existing JWT token for accessing protected routes.

**Q8: How do you implement role-based access control?**
A: Using `@Roles()` decorator with `RolesGuard`. RolesGuard checks if the user's role matches required roles from the decorator metadata.

**Q9: Why is password hashing done with bcrypt and 12 rounds?**
A: bcrypt is a adaptive hash function resistant to rainbow table attacks. 12 rounds provides good security vs. performance balance. Each round doubles the computation time.

**Q10: What is the purpose of helmet.js?**
A: Sets security-related HTTP headers (X-Frame-Options, X-Content-Type-Options, HSTS, etc.) to protect against common web vulnerabilities.

### Database & Prisma

**Q11: How do you handle database transactions in Prisma?**
A: Using `$transaction()` with async callback. All operations within the callback run atomically. Can specify isolation level for PostgreSQL.

**Q12: What's the difference between `findUnique` and `findFirst`?**
A: `findUnique` requires a unique field (or composite unique) and returns one record or null. `findFirst` returns the first record matching criteria, useful when there are multiple potential matches.

**Q13: How do you implement soft delete?**
A: Add `isDeleted` Boolean field to model. Update queries to filter `where: { isDeleted: false }`. Instead of `delete()`, use `update({ data: { isDeleted: true } })`.

**Q14: What's the purpose of indexes in Prisma?**
A: Indexes improve query performance for filtered/sorted fields. Use `@@index([field])` for single fields or `@@index([field1, field2])` for composite indexes.

**Q15: How do you handle one-to-many and many-to-many relations?**
A: One-to-many: Parent has `relation` field, child has `fieldId` + `@relation` annotation. Many-to-many: Let Prisma auto-generate join table, or manually define with explicit relations.

### Real-Time & WebSockets

**Q16: How does the WebSocket gateway authenticate users?**
A: On connection, extract token from `handshake.auth.token` or `handshake.headers.authorization`. Verify JWT and attach user info to socket object. Disconnect if invalid.

**Q17: What's the difference between `@WebSocketGateway` and regular HTTP controllers?**
A: WebSocket gateways handle persistent bidirectional connections. HTTP controllers handle stateless request-response cycles. Gateways use `@SubscribeMessage` for event handling.

**Q18: How do you emit events to specific users?**
A: Join user to a personal room (`client.join(\`user_${userId}\`)`), then emit to that room (`this.server.to(\`user_${userId}\`).emit('event', data)`).

### Architecture Patterns

**Q19: What is the repository pattern in NestJS?**
A: Services act as repositories, abstracting database access. All data operations go through services, keeping controllers thin and business logic centralized.

**Q20: How do you structure large NestJS applications?**
A: Use feature modules to organize by domain (restaurants, employees, etc.). Use shared modules for common functionality. Keep PrismaService global. Use DTOs for validation. Implement proper error handling with exception filters.

**Q21: When would you use `@Inject()` decorator vs constructor injection?**
A: Constructor injection is preferred for standard dependencies. `@Inject()` is needed for string tokens, optional dependencies, or when the dependency isn't class-based.

**Q22: How do you implement caching?**
A: Use Redis with `@nestjs/cache-manager` or implement custom caching in services. For database queries, consider `select` to limit fields, or use Prisma's `include` wisely to avoid N+1 queries.

### Testing

**Q23: How do you unit test NestJS services?**
A: Mock dependencies using `jest.fn()` or `jest.spyOn()`. Create service instance with mocked providers. Assert expected behavior and interactions.

**Q24: What's the purpose of e2e tests in NestJS?**
A: End-to-end tests verify the entire application stack works together. Use supertest to make HTTP requests to running app and verify responses.

---

## 13. Common Issues & Debugging

### Database Issues

**Issue: Prisma Client not generated**
```bash
# Solution
npx prisma generate
# Then restart the server
```

**Issue: Database connection refused**
```bash
# Check DATABASE_URL format
# For PostgreSQL: postgresql://user:password@host:5432/db
# For SQLite: file:./dev.db
# Ensure database server is running
```

**Issue: Migration conflicts**
```bash
# Reset migrations in development
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name add_new_field
```

**Issue: N+1 query problem**
```typescript
// BAD: N+1 queries
const users = await prisma.user.findMany();
for (const user of users) {
  user.restaurant = await prisma.restaurant.findUnique({ where: { userId: user.id } });
}

// GOOD: Single query with include
const users = await prisma.user.findMany({
  include: { restaurant: true }
});
```

### Authentication Issues

**Issue: JWT token expired**
```
// Response: 401 Unauthorized
// Solution: Client needs to re-authenticate and get new token
```

**Issue: Invalid token signature**
```
// Check JWT_SECRET matches between environments
// Ensure token wasn't tampered with
// Verify token format (Bearer prefix)
```

**Issue: User not found after token validation**
```
// JwtStrategy.validate() fetches user from DB
// If user deleted but token still valid, validation fails
// Solution: Clear tokens on user deletion or use blacklisting
```

### File Upload Issues

**Issue: S3 upload fails**
```
// Check: AWS credentials are correct
// Check: Bucket name and region match
// Check: IAM permissions (PutObject, DeleteObject)
// Check: File size within limits
```

**Issue: Multer file not received**
```
// Check: Form field name matches controller parameter
// Check: Content-Type is multipart/form-data
// Check: File size within express body-parser limits
```

### WebSocket Issues

**Issue: WebSocket connection refused**
```
// Check: Namespace matches client connection
// /messaging vs /notifications
// Check: CORS settings allow WebSocket connections
```

**Issue: User not receiving messages**
```
// Verify user has joined their personal room
// Check: connectedUsers map has correct socket ID
// Check: User is online (not disconnected)
```

### Performance Issues

**Issue: Slow API responses**
```typescript
// Use pagination for large datasets
// Add database indexes for filtered fields
// Use Promise.all() for parallel queries
// Consider caching frequently accessed data
```

**Issue: Memory leaks in WebSocket connections**
```typescript
// Clean up in handleDisconnect
// Don't store large objects in socket data
// Limit number of rooms per connection
```

### Development Issues

**Issue: Module not found**
```
// Check: Module is imported in AppModule
// Check: Module file path is correct
// Check: Module is exported from library
```

**Issue: Circular dependency**
```
// Solution: Use forwardRef()
@Inject(forwardRef(() => AuthModule))
// Better: Restructure to avoid circular imports
```

### Debugging Tips

1. **Enable Prisma query logging:**
```typescript
// In PrismaService constructor
super({
  log: ['query', 'info', 'warn', 'error'],
});
```

2. **Use Swagger for API testing:**
```
Navigate to: http://localhost:8000/api/docs
```

3. **Prisma Studio for database inspection:**
```bash
npx prisma studio
```

4. **Check environment variables:**
```typescript
// Add to main.ts for debugging
console.log('ENV:', process.env);
```

---

## Quick Reference Commands

```bash
# Development
npm run start:dev          # Start with hot reload
npm run build              # Build for production
npm run start:prod         # Run production build

# Database
npx prisma studio          # Visual database editor
npx prisma migrate dev     # Apply migrations
npx prisma generate        # Generate Prisma client
npm run db:seed            # Seed database

# Testing
npm run test               # Unit tests
npm run test:watch         # Watch mode
npm run test:cov           # Coverage report
npm run test:e2e           # E2E tests

# Code Quality
npm run lint               # Lint code
npm run format             # Format with Prettier
```

---

*Document Version: 1.0*
*Last Updated: 2026-05-05*
*Project: Restaurant SaaS Backend*
