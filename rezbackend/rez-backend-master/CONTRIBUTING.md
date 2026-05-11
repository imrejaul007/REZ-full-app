# Contributing to REZ Backend

Thank you for contributing to REZ! This guide will walk you through the setup and development process.

## Prerequisites

- Node.js (v18.x or higher)
- MongoDB (local or Atlas connection)
- Redis (local or cloud instance)
- Git
- npm or yarn

## 5-Step Setup Guide

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/imrejaul007/rez-backend.git
cd rez-backend

# Install dependencies
npm install

# Or with yarn
yarn install
```

### Step 2: Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your local configuration
# Required variables:
# - MONGODB_URI: MongoDB connection string
# - REDIS_URL: Redis connection URL
# - JWT_SECRET: A secure random string (min 32 chars)
# - RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET: For payment testing
```

**Key Configuration Variables:**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/rez-app
MONGODB_TEST_URI=mongodb://localhost:27017/rez-app-test

# Redis Cache
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-32-char-secret-here
JWT_REFRESH_SECRET=your-32-char-secret-here
JWT_MERCHANT_SECRET=your-32-char-secret-here

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Feature Flags
BBPS_ENABLED=true
FEATURE_PRIVE_CAMPAIGNS=true
```

### Step 3: Start MongoDB and Redis

```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:6
docker run -d -p 6379:6379 --name redis redis:7

# Or locally (if installed)
mongod
redis-server
```

### Step 4: Seed Initial Data

```bash
# Seed bill providers (required for bill payment testing)
npm run seed:bill-providers

# Seed other initial data
npm run seed
```

### Step 5: Start Development Server

```bash
# Start with auto-reload
npm run dev

# Or with debugging
npm run dev:debug

# Production build
npm run build
npm start
```

The server will start on `http://localhost:5001` by default.

## Development Workflow

### Code Structure

```
src/
├── controllers/       # Request handlers
├── models/           # MongoDB schemas
├── routes/           # API route definitions
├── services/         # Business logic
├── middleware/       # Express middleware (auth, validation, etc.)
├── config/           # Configuration files
├── utils/            # Helper functions
├── jobs/             # Background job definitions
├── __tests__/        # Test files
└── types/            # TypeScript type definitions
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- billPayment.test.ts
```

### TypeScript Compilation

```bash
# Check for TypeScript errors (no build)
npm run type-check

# Build TypeScript
npm run build
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## Making Changes

### Creating a New Endpoint

1. **Create the Controller** (`src/controllers/featureController.ts`):
   - Define request handlers
   - Use `asyncHandler` for error handling
   - Return responses using `sendSuccess`/`sendError`

2. **Create the Model** (if needed, in `src/models/`):
   - Define MongoDB schema
   - Add indexes for performance
   - Include timestamps

3. **Create Routes** (`src/routes/featureRoutes.ts`):
   - Use Express Router
   - Apply auth middleware where needed
   - Validate request data with Joi

4. **Register Routes** (in `src/config/routes.ts`):
   - Import your routes
   - Register with `app.use()`

5. **Write Tests** (`src/__tests__/routes/feature.test.ts`):
   - Test success and error cases
   - Mock external services
   - Verify response structure

### Best Practices

- **Error Handling**: Always use `asyncHandler` and throw `AppError`
- **Validation**: Use Joi schemas for request validation
- **Logging**: Use `logger.info()`, `logger.error()` for debugging
- **Caching**: Use Redis for frequently accessed data (with TTL)
- **Database Indexes**: Add indexes on fields used in queries
- **Transactions**: Use MongoDB sessions for multi-document operations
- **Idempotency**: Include idempotency checks for financial operations
- **Streak Tracking**: For user engagement features, call `streakService.recordActivity()`

## Common Tasks

### Adding a New Bill Provider

```bash
npm run seed:bill-providers
```

### Updating Database Indexes

```bash
npm run add-indexes
```

### Checking for Type Errors

```bash
npm run type-check
```

### Debugging an Issue

```bash
# Enable debug output
DEBUG=* npm run dev

# Or for specific modules
DEBUG=billPayment:* npm run dev
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `docker ps | grep mongodb`
- Check MONGODB_URI in .env
- Verify network connectivity if using Atlas

### Redis Connection Error
- Ensure Redis is running: `docker ps | grep redis`
- Check REDIS_URL in .env

### Port Already in Use
```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill -9
```

### Duplicate Key Error
```bash
# Clear and reseed database
npm run seed:reset
npm run seed
```

## Git Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes, test locally
npm test
npm run type-check

# Commit with meaningful message
git commit -m "feat: add bill payment streak tracking"

# Push to remote
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

## Commit Message Convention

Use conventional commits:

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
test:     Tests
refactor: Code refactoring
perf:     Performance improvement
chore:    Maintenance
```

Example:
```
feat(bill-payment): add streak milestone rewards for utility payments
```

## Getting Help

- **Documentation**: Check the wiki at https://wiki.rez.money
- **Issues**: Report bugs on GitHub Issues
- **Slack**: Reach out in #backend-dev channel
- **Code Reviews**: Ask for feedback in PRs

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Joi Validation](https://joi.dev/api/)
- [Jest Testing](https://jestjs.io/docs/getting-started)

---

Happy Contributing! 🚀
