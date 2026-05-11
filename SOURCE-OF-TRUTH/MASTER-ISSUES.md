# MASTER ISSUES LIST - REZ Ecosystem
**Date:** 2026-05-04
**Consolidated From:** 8 Domain Audits + 5 Audit Waves
**Total Issues:** 500+

---

## EXECUTIVE SUMMARY

| Priority | Count | Description |
|----------|-------|-------------|
| **CRITICAL** | 25 | Break production - immediate action required |
| **HIGH** | 45 | Should fix soon - within sprint |
| **MEDIUM** | 55 | Nice to fix - within release |
| **LOW** | 35+ | Cosmetic/technical debt |

---

## CRITICAL ISSUES (Break Production)

### SECURITY

#### CRIT-001: Production Secrets Committed to Git
| Field | Value |
|-------|-------|
| **File/Service** | 13+ services (rez-auth-service, rez-payment-service, rez-wallet-service, adsqr, Hotel PMS, etc.) |
| **Problem** | .env files with live credentials committed to repository |
| **Evidence** | JWT_SECRET, JWT_MERCHANT_SECRET, OTP_HMAC_SECRET exposed |
| **Impact** | Complete authentication bypass, JWT forgery, OTP compromise |
| **Recommended Fix** | 1. Rotate ALL exposed secrets immediately<br>2. Add .env to .gitignore<br>3. Use BFG Repo-Cleaner to remove from history<br>4. Implement HashiCorp Vault or AWS Secrets Manager |
| **Owner** | Security Team |

#### CRIT-002: Supabase Service Role Key Exposed
| Field | Value |
|-------|-------|
| **File/Service** | adsqr/.env.local |
| **Problem** | SUPABASE_SERVICE_ROLE_KEY committed - full database access |
| **Evidence** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| **Impact** | Complete database compromise, all tables accessible with admin privileges |
| **Recommended Fix** | 1. Rotate service role key in Supabase Dashboard<br>2. Review access logs for unauthorized activity<br>3. Implement proper env var management |
| **Owner** | Security Team |

#### CRIT-003: Third-Party API Credentials Exposed
| Field | Value |
|-------|-------|
| **File/Service** | Hotel OTA/hotel-pms/hotel-management.env |
| **Problem** | MongoDB, Redis, Stripe, SendGrid, Booking.com credentials in git |
| **Evidence** | MONGO_URI, REDIS_URL, STRIPE_SECRET_KEY, SMTP_PASS exposed |
| **Impact** | Full database access, Redis manipulation, payment processing, email compromise |
| **Recommended Fix** | 1. Rotate all credentials immediately<br>2. Move to secrets management<br>3. Add startup validation |
| **Owner** | Security Team |

#### CRIT-004: CorpPerks In-Memory Storage
| Field | Value |
|-------|-------|
| **File/Service** | rez-corpperks-service/src/routes/corpWalletRoutes.js |
| **Problem** | Uses Map() for wallet data - data lost on restart, cannot scale horizontally |
| **Evidence** | `const personalWallets = new Map();` |
| **Impact** | Complete data loss on restart, no horizontal scaling, production data in memory |
| **Recommended Fix** | Migrate to MongoDB models with proper schema validation |
| **Owner** | Backend Team |

#### CRIT-005: CorpPerks Auth Middleware Ineffective
| Field | Value |
|-------|-------|
| **File/Service** | rez-corpperks-service/src/routes/corpWalletRoutes.js:169-176 |
| **Problem** | Only checks Bearer token presence, no signature verification |
| **Evidence** | `if (!auth || !auth.startsWith('Bearer '))` |
| **Impact** | Anyone with any "Bearer xxx" token can access protected endpoints |
| **Recommended Fix** | Implement proper JWT validation with signature verification |
| **Owner** | Backend Team |

#### CRIT-006: Refund Webhook Lacks Tamper Protection
| Field | Value |
|-------|-------|
| **File/Service** | rez-payment-service/src/services/webhookService.ts:367-375 |
| **Problem** | Only logs when refund amount exceeds maximum, doesn't block processing |
| **Impact** | Fraud via inflated refund claims possible |
| **Recommended Fix** | Block processing on amount mismatch, require manual investigation |
| **Owner** | Payment Team |

#### CRIT-007: Redis KEYS Command Usage
| Field | Value |
|-------|-------|
| **File/Service** | rez-auth-service/src/routes/oauthPartnerRoutes.ts:587 |
| **Problem** | KEYS command blocks Redis and causes performance issues |
| **Impact** | Redis blocking, production outage under load |
| **Recommended Fix** | Use SCAN instead: `redis.scanStream({ match: pattern, count: 100 })` |
| **Owner** | Backend Team |

### ARCHITECTURE

#### CRIT-008: TypeScript Strict Mode Disabled
| Field | Value |
|-------|-------|
| **File/Service** | Multiple services (rez-app-admin, rez-merchant-service, rez-karma-service, rez-intelligence-hub, rez-targeting-engine) |
| **Problem** | strict: false in tsconfig.json, 788+ implicit any errors in rez-app-admin alone |
| **Impact** | Type safety bypassed, runtime errors, security vulnerabilities |
| **Recommended Fix** | 1. Create shared tsconfig.base.json with strict:true<br>2. Enable incrementally with `as any` suppression<br>3. Track and resolve remaining type errors |
| **Owner** | Frontend Team |

#### CRIT-009: Package Exports Mismatch
| Field | Value |
|-------|-------|
| **File/Service** | packages/rez-service-core/package.json |
| **Problem** | package.json declares exports (redis, mongodb, logger, health, gracefulShutdown) but only errorTracker.ts exists |
| **Impact** | Build failures, broken imports for services depending on non-existent modules |
| **Recommended Fix** | 1. Implement missing modules OR<br>2. Remove non-existent exports from package.json |
| **Owner** | Platform Team |

#### CRIT-010: Shared Packages Not Adopted
| Field | Value |
|-------|-------|
| **File/Service** | Most services |
| **Problem** | Only 5/27 services use shared packages, 22 maintain duplicate implementations |
| **Evidence** | 5 services use @rez/shared, 22+ have own errorResponse, logger, etc. |
| **Impact** | Code duplication, inconsistency, maintenance burden |
| **Recommended Fix** | 1. Mandate @rez/shared-types as dependency for all services<br>2. Migrate duplicate implementations<br>3. Add linting rule to prevent new duplicates |
| **Owner** | Platform Team |

### BUILD/DEPLOYMENT

#### CRIT-011: Missing Dependencies
| Field | Value |
|-------|-------|
| **File/Service** | REZ-support-copilot, rez-app-consumer, rez-admin-training-panel |
| **Problem** | Dependencies imported but not in package.json |
| **Evidence** | dotenv, axios, mongoose (support-copilot); axios (consumer); recharts (admin) |
| **Impact** | Build failures |
| **Recommended Fix** | Run `npm install` for missing packages |
| **Owner** | DevOps Team |

#### CRIT-012: TypeScript Errors in Merchant Copilot
| Field | Value |
|-------|-------|
| **File/Service** | REZ-merchant-copilot/src/services/liveDataService.ts |
| **Problem** | 'unknown' type not assignable errors on lines 79, 109, 132, 210 |
| **Impact** | Build fails |
| **Recommended Fix** | Add proper type assertions |
| **Owner** | Frontend Team |

#### CRIT-013: Empty Service Directories
| Field | Value |
|-------|-------|
| **File/Service** | rez-knowledge-base-service, REZ-support-copilot |
| **Problem** | src/controllers/, src/models/, src/routes/ are EMPTY |
| **Impact** | Services not functional |
| **Recommended Fix** | Implement required controllers, models, routes |
| **Owner** | Backend Team |

#### CRIT-014: Local Package References Missing
| Field | Value |
|-------|-------|
| **File/Service** | rez-app-merchant (@rez/shared), rez-app-consumer (@rez/shared-types) |
| **Problem** | References file:./packages/... that don't exist |
| **Impact** | Build failures, missing type definitions |
| **Recommended Fix** | Use workspace protocol: `"@rez/shared": "workspace:*"` |
| **Owner** | Platform Team |

### DEVOPS

#### CRIT-015: Deploy Pipeline Stub
| Field | Value |
|-------|-------|
| **File/Service** | .github/workflows/deploy.yml |
| **Problem** | Only contains echo statements, no actual deployment commands |
| **Evidence** | `# Add your deployment commands here` |
| **Impact** | No automated production deployments |
| **Recommended Fix** | Implement actual deployment using Render API |
| **Owner** | DevOps Team |

#### CRIT-016: Hardcoded PostgreSQL Password
| Field | Value |
|-------|-------|
| **File/Service** | docker-compose.yml:147-149 |
| **Problem** | POSTGRES_PASSWORD: rez_password hardcoded |
| **Impact** | Security risk if file committed |
| **Recommended Fix** | Use environment variables: `${POSTGRES_PASSWORD:?required}` |
| **Owner** | DevOps Team |

#### CRIT-017: No Multi-Stage Builds
| Field | Value |
|-------|-------|
| **File/Service** | rez-profile-service, rez-scheduler-service, rez-intelligence-hub, rez-action-engine |
| **Problem** | Dockerfiles lack multi-stage builds |
| **Impact** | Larger image sizes, security vulnerabilities from dev dependencies in production |
| **Recommended Fix** | Implement multi-stage builds following rez-auth-service pattern |
| **Owner** | DevOps Team |

#### CRIT-018: Alert Rules Reference Non-Existent Metrics
| Field | Value |
|-------|-------|
| **File/Service** | alert_rules.yml |
| **Problem** | `http_requests_total` metric may not exist in services |
| **Impact** | Alerts never fire, no visibility into service errors |
| **Recommended Fix** | Either instrument services with proper metrics or remove invalid alerts |
| **Owner** | DevOps Team |

#### CRIT-019: Migration Script References Non-Existent File
| Field | Value |
|-------|-------|
| **File/Service** | scripts/run-migrations.ts |
| **Problem** | References `2026050302_adsqr_tables` which may not exist |
| **Impact** | Silent migration failures |
| **Recommended Fix** | Add existence check before running migrations |
| **Owner** | Database Team |

---

## HIGH PRIORITY ISSUES

### SECURITY

#### HIGH-001: MongoDB Credentials Reused
| Field | Value |
|-------|-------|
| **File/Service** | 8+ services share same MongoDB credentials |
| **Problem** | Single credential compromise affects entire ecosystem |
| **Impact** | Complete data breach across all services |
| **Recommended Fix** | 1. Rotate shared MongoDB password<br>2. Implement per-service database users<br>3. Use least-privilege access |
| **Owner** | Security Team |

#### HIGH-002: Redis Credentials Reused
| Field | Value |
|-------|-------|
| **File/Service** | Multiple services |
| **Problem** | REDIS_URL without password across services |
| **Impact** | Session hijacking, OTP manipulation, rate limiting bypass |
| **Recommended Fix** | Enable Redis AUTH, rotate credentials, restrict network access |
| **Owner** | Security Team |

#### HIGH-003: Internal Service Tokens Shared
| Field | Value |
|-------|-------|
| **File/Service** | Multiple services |
| **Problem** | INTERNAL_SERVICE_TOKEN shared across services |
| **Impact** | Unauthorized internal service calls, service impersonation |
| **Recommended Fix** | Implement per-service scoped tokens |
| **Owner** | Security Team |

#### HIGH-004: Cloudinary API Secret Exposed
| Field | Value |
|-------|-------|
| **File/Service** | rez-media-events/.env |
| **Problem** | CLOUDINARY_API_SECRET committed |
| **Impact** | Unauthorized media upload/delete, potential malware distribution |
| **Recommended Fix** | Rotate Cloudinary API secret |
| **Owner** | Security Team |

#### HIGH-005: Encryption Key Hardcoded
| Field | Value |
|-------|-------|
| **File/Service** | Hotel OTA/hotel-pms/hotel-management.env |
| **Problem** | ENCRYPTION_KEY hardcoded |
| **Impact** | Encrypted data decryption, GDPR violation |
| **Recommended Fix** | Move to secrets management |
| **Owner** | Security Team |

#### HIGH-006: Consumer App Security Settings in AsyncStorage
| Field | Value |
|-------|-------|
| **File/Service** | rez-app-consumer/contexts/SecurityContext.tsx |
| **Problem** | Security settings stored in plaintext AsyncStorage |
| **Impact** | Security settings vulnerable to extraction |
| **Recommended Fix** | Use SecureStore (iOS Keychain / Android Keystore) |
| **Owner** | Mobile Team |

#### HIGH-007: Missing Certificate Pinning
| Field | Value |
|-------|-------|
| **File/Service** | rez-app-consumer/services/apiClient.ts |
| **Problem** | No certificate pinning implemented |
| **Impact** | Man-in-the-middle attacks possible |
| **Recommended Fix** | Implement via react-native-cert-pinning |
| **Owner** | Mobile Team |

#### HIGH-008: JWT Decoded Without Verification
| Field | Value |
|-------|-------|
| **File/Service** | rez-app-admin/contexts/AuthContext.tsx:271-277 |
| **Problem** | Client-side JWT decoding without verification |
| **Impact** | Token validity cannot be trusted |
| **Recommended Fix** | Backend should be authoritative for token validity |
| **Owner** | Mobile Team |

### ARCHITECTURE

#### HIGH-009: Duplicate Logger Implementations
| Field | Value |
|-------|-------|
| **File/Service** | 20+ services |
| **Problem** | Each service has own src/config/logger.ts with similar winston patterns |
| **Impact** | Maintenance burden, inconsistent log formats |
| **Recommended Fix** | Move to @rez/shared as `createLogger()` function |
| **Owner** | Platform Team |

#### HIGH-010: TypeScript Version Inconsistency
| Field | Value |
|-------|-------|
| **File/Service** | Multiple services |
| **Problem** | Mixing TypeScript 5.3, 5.8, 5.9 across ecosystem |
| **Impact** | Version-specific behavior differences |
| **Recommended Fix** | Centralize TypeScript version in root package.json, use workspace protocol |
| **Owner** | Platform Team |

#### HIGH-011: Zod Version Mixing
| Field | Value |
|-------|-------|
| **File/Service** | rez-payment-service (v4.3.6), others (v3.x) |
| **Problem** | Breaking changes between v3 and v4 may cause runtime issues |
| **Impact** | Potential runtime errors |
| **Recommended Fix** | Standardize on Zod v3 or v4 across all services |
| **Owner** | Platform Team |

#### HIGH-012: API Gateway Not Audited
| Field | Value |
|-------|-------|
| **File/Service** | rez-api-gateway/ |
| **Problem** | No package.json in expected location |
| **Impact** | Cannot verify build or dependencies |
| **Recommended Fix** | Locate or create proper package.json, add to build pipeline |
| **Owner** | Platform Team |

#### HIGH-013: Service Core Package Mismatch
| Field | Value |
|-------|-------|
| **File/Service** | packages/rez-service-core/ |
| **Problem** | Package declares pino but services use winston |
| **Impact** | Confusing package design, unused dependency |
| **Recommended Fix** | Either update to winston or remove and consolidate in rez-shared |
| **Owner** | Platform Team |

#### HIGH-014: Wallet Service Reduced Pool Size
| Field | Value |
|-------|-------|
| **File/Service** | rez-wallet-service/src/config/mongodb.ts |
| **Problem** | maxPoolSize: 10 vs standard 20 |
| **Impact** | Connection pool exhaustion under high concurrent wallet operations |
| **Recommended Fix** | Increase maxPoolSize to 20 for production |
| **Owner** | Backend Team |

#### HIGH-015: Missing Projection in User Queries
| Field | Value |
|-------|-------|
| **File/Service** | rez-auth-service/src/routes/authRoutes.ts:1258 |
| **Problem** | Returns full document including password hashes |
| **Impact** | Larger payloads, potential data exposure |
| **Recommended Fix** | Add projection to exclude sensitive fields |
| **Owner** | Backend Team |

#### HIGH-016: In-Memory State in Search Service
| Field | Value |
|-------|-------|
| **File/Service** | rez-search-service/src/services/searchService.ts:518 |
| **Problem** | Trending cache is in-memory, not shared across replicas |
| **Impact** | Scaling limitation, inconsistent results |
| **Recommended Fix** | Document as single-replica limitation, migrate to Redis for multi-replica |
| **Owner** | Backend Team |

### FINANCE

#### HIGH-017: E-Invoice Is Stub Implementation
| Field | Value |
|-------|-------|
| **File/Service** | rez-finance-service/src/services/corpGSTService.ts:534-561 |
| **Problem** | Generates mock IRN with Math.random() |
| **Impact** | Non-compliance with GST e-invoice mandate for >5L transactions |
| **Recommended Fix** | Implement GST Suvidha Provider (GSP) integration |
| **Owner** | Finance Team |

#### HIGH-018: Recovery Only Looks Back 24 Hours
| Field | Value |
|-------|-------|
| **File/Service** | lostCoinsRecoveryWorker.ts:52 |
| **Problem** | MAX_RECOVERY_AGE_HOURS = 24 |
| **Impact** | Payments completed before 24h cutoff may be permanently lost |
| **Recommended Fix** | Extend to 168 (7 days) |
| **Owner** | Finance Team |

#### HIGH-019: Reconciliation Is Passive Only
| Field | Value |
|-------|-------|
| **File/Service** | reconciliationService.ts, lostCoinsRecoveryWorker.ts |
| **Problem** | Only runs when job scheduler triggers |
| **Impact** | Delay in detecting/recovering stuck transactions |
| **Recommended Fix** | Add API endpoint for manual reconciliation trigger |
| **Owner** | Finance Team |

### DEVOPS

#### HIGH-020: No Resource Limits in Docker
| Field | Value |
|-------|-------|
| **File/Service** | ALL Dockerfiles |
| **Problem** | No MEMORY_LIMIT, CPU_SHARES defined |
| **Impact** | Noisy neighbor problems, potential DoS from runaway containers |
| **Recommended Fix** | Add resource limits to Docker Compose and render.yaml |
| **Owner** | DevOps Team |

#### HIGH-021: No Rollback Capability
| Field | Value |
|-------|-------|
| **File/Service** | All GitHub Actions workflows |
| **Problem** | No mechanism to rollback to previous version |
| **Impact** | Cannot revert failed deployments |
| **Recommended Fix** | Add rollback workflow for each service |
| **Owner** | DevOps Team |

#### HIGH-022: Inconsistent CI Configuration
| Field | Value |
|-------|-------|
| **File/Service** | Multiple */.github/workflows/ci.yml |
| **Problem** | Each service has slightly different CI configuration |
| **Impact** | Maintenance burden, inconsistent quality gates |
| **Recommended Fix** | Create standardized template workflow |
| **Owner** | DevOps Team |

#### HIGH-023: No Image Scanning in Docker CI
| Field | Value |
|-------|-------|
| **File/Service** | .github/workflows/docker.yml |
| **Problem** | Trivy runs on filesystem but not built images |
| **Impact** | Known vulnerabilities in base images not detected |
| **Recommended Fix** | Add image scanning to docker.yml workflow |
| **Owner** | DevOps Team |

#### HIGH-024: Grafana Default Password
| Field | Value |
|-------|-------|
| **File/Service** | docker-compose.observability.yml |
| **Problem** | GF_SECURITY_ADMIN_PASSWORD=admin123 hardcoded |
| **Impact** | Security risk if container exposed |
| **Recommended Fix** | Use environment variable: `${GRAFANA_PASSWORD:?required}` |
| **Owner** | DevOps Team |

#### HIGH-025: Missing .env.example Files
| Field | Value |
|-------|-------|
| **File/Service** | rez-stayown-service, rez-profile-service, rez-merchant-service |
| **Problem** | No .env.example file |
| **Impact** | No documentation for required environment variables |
| **Recommended Fix** | Create comprehensive .env.example following rez-auth-service pattern |
| **Owner** | DevOps Team |

### DATABASE

#### HIGH-026: Enum Drift Across Services
| Field | Value |
|-------|-------|
| **File/Service** | Multiple services define enums locally |
| **Problem** | Services define enums locally instead of using @rez/shared-types |
| **Impact** | Risk of value mismatches between services |
| **Recommended Fix** | All services must import enums from @rez/shared-types/enums |
| **Owner** | Platform Team |

#### HIGH-027: Cascade Delete Not Configured
| Field | Value |
|-------|-------|
| **File/Service** | rez-merchant-intelligence-service/src/models/MerchantProfile.ts |
| **Problem** | If merchant deleted, orphaned MerchantProfile documents remain |
| **Recommended Fix** | Implement soft-delete pattern with deletedAt field |
| **Owner** | Backend Team |

#### HIGH-028: Brand SecretKey Stored Plaintext
| Field | Value |
|-------|-------|
| **File/Service** | verify-service/prisma/schema.prisma |
| **Problem** | secretKey stored as plain text |
| **Impact** | Catastrophic if data breach occurs |
| **Recommended Fix** | Encrypt at application layer or use secrets manager |
| **Owner** | Security Team |

### API/INTEGRATION

#### HIGH-029: Delivery Webhooks Lack Signature Verification
| Field | Value |
|-------|-------|
| **File/Service** | rez-merchant-integrations/ |
| **Problem** | No HMAC verification for delivery partner webhooks |
| **Impact** | Security risk, webhook spoofing possible |
| **Recommended Fix** | Implement HMAC verification similar to Razorpay pattern |
| **Owner** | Backend Team |

#### HIGH-030: Payment Retries Disabled
| Field | Value |
|-------|-------|
| **File/Service** | rez-api-gateway/nginx.conf |
| **Problem** | proxy_next_upstream off for payment endpoints |
| **Impact** | Clients cannot distinguish network failures from actual payment failures |
| **Recommended Fix** | Implement idempotent payment endpoints with 202 Accepted responses |
| **Owner** | Backend Team |

---

## MEDIUM PRIORITY ISSUES

### ARCHITECTURE

#### MED-001: Consumer App Uses GitHub Fork
| Field | Value |
|-------|-------|
| **File/Service** | rez-app-consumer/package.json |
| **Problem** | References `github:imrejaul007/shared-types#2.0.0` instead of local |
| **Impact** | May not reflect latest local changes |
| **Recommended Fix** | Use workspace protocol: `"@rez/shared-types": "workspace:*"` |
| **Owner** | Frontend Team |

#### MED-002: Missing Path Aliases
| Field | Value |
|-------|-------|
| **File/Service** | Multiple services (e.g., rez-auth-service) |
| **Problem** | Services without path aliases require verbose relative imports |
| **Impact** | Harder refactoring |
| **Recommended Fix** | Add standard path aliases to all services' tsconfig.json |
| **Owner** | Platform Team |

#### MED-003: Build Scripts Inconsistency
| Field | Value |
|-------|-------|
| **File/Service** | Multiple services |
| **Problem** | Some services use `tsc`, others use `tsc --skipLibCheck` |
| **Impact** | Inconsistent build behavior, potential silent failures |
| **Recommended Fix** | Standardize build scripts across all services |
| **Owner** | Platform Team |

#### MED-004: Duplicate Health Check Patterns
| Field | Value |
|-------|-------|
| **File/Service** | Multiple services |
| **Problem** | Each service implements own health check logic |
| **Recommended Fix** | Move health check utilities to @rez/shared |
| **Owner** | Platform Team |

#### MED-005: No Consistent Test Framework
| Field | Value |
|-------|-------|
| **File/Service** | Multiple services |
| **Problem** | Some use Jest, some use node --test |
| **Recommended Fix** | Standardize on Jest for backend, Vitest for packages |
| **Owner** | Platform Team |

#### MED-006: Response Format Inconsistency
| Field | Value |
|-------|-------|
| **File/Service** | rez-auth-service |
| **Problem** | Mixed response formats (success wrapper vs direct data) |
| **Impact** | Client code must handle multiple response formats |
| **Recommended Fix** | Standardize all responses to `{ success: boolean, data?: T, error?: Error }` |
| **Owner** | Backend Team |

### PERFORMANCE

#### MED-007: Offset Pagination in Settlements
| Field | Value |
|-------|-------|
| **File/Service** | rez-payment-service/src/services/paymentService.ts:683-700 |
| **Problem** | Uses skip/limit pagination |
| **Impact** | O(n) performance for large offsets |
| **Recommended Fix** | Cursor-based pagination for large datasets |
| **Owner** | Backend Team |

#### MED-008: Socket.io 24h Timeout
| Field | Value |
|-------|-------|
| **File/Service** | rez-api-gateway/nginx.conf:896 |
| **Problem** | proxy_read_timeout 86400s unrealistic |
| **Impact** | Connection management issues |
| **Recommended Fix** | Reduce to 300s with client-side heartbeat |
| **Owner** | Backend Team |

#### MED-009: Profile Cache Missing Invalidation
| Field | Value |
|-------|-------|
| **File/Service** | rez-profile-service/src/services/profile.ts |
| **Problem** | No explicit cache invalidation for user profile updates |
| **Impact** | Stale profile data may be served |
| **Recommended Fix** | Add cache invalidation on profile mutations |
| **Owner** | Backend Team |

### DATABASE

#### MED-010: Missing Index on brandId
| Field | Value |
|-------|-------|
| **File/Service** | adsqr/prisma/schema.prisma |
| **Problem** | brandId used in queries but lacks index |
| **Recommended Fix** | Add `@@index([brandId])` to BrandCoin model |
| **Owner** | Backend Team |

#### MED-011: String Status Without Enum
| Field | Value |
|-------|-------|
| **File/Service** | rez-now/prisma/schema.prisma |
| **Problem** | Campaign status uses string literals |
| **Recommended Fix** | Create CampaignStatus enum |
| **Owner** | Backend Team |

#### MED-012: maxRetriesPerRequest: null
| Field | Value |
|-------|-------|
| **File/Service** | rez-scheduler-service/rez-scheduler-service/src/config/redis.ts |
| **Problem** | Disables timeout, causes infinite hangs |
| **Recommended Fix** | Set to 3 with proper error handling |
| **Owner** | Backend Team |

#### MED-013: Manual SQL Instead of Prisma Migrations
| Field | Value |
|-------|-------|
| **File/Service** | rez-now/prisma/migrations/ |
| **Problem** | Not tracked by Prisma migration history |
| **Recommended Fix** | Convert to Prisma migration format |
| **Owner** | Backend Team |

#### MED-014: No Rollback Strategy
| Field | Value |
|-------|-------|
| **File/Service** | All migrations |
| **Problem** | No rollback migrations found |
| **Recommended Fix** | Document rollback procedures for each critical migration |
| **Owner** | Database Team |

#### MED-015: Currency Normalization Issues
| Field | Value |
|-------|-------|
| **File/Service** | rez-wallet-service/src/models/Wallet.ts:106-108 |
| **Problem** | 4 different currency values (REZ_COIN, RC, NC, INR) |
| **Recommended Fix** | Standardize to single currency format |
| **Owner** | Finance Team |

### UX/ACCESSIBILITY

#### MED-016: Color Fragmentation
| Field | Value |
|-------|-------|
| **File/Service** | rez-app-consumer/constants/Colors.ts |
| **Problem** | Multiple color definitions (RezColors, SharedBrandColors, Colors) |
| **Impact** | Confusion, potential inconsistent styling |
| **Recommended Fix** | Consolidate to SharedBrandColors as canonical |
| **Owner** | Design Team |

#### MED-017: Touch Target Inconsistency
| Field | Value |
|-------|-------|
| **File/Service** | Multiple apps |
| **Problem** | PrimaryButton sizes 40, 48, 56 - only 'large' meets 44px standard |
| **Impact** | Touch targets too small on small/medium buttons |
| **Recommended Fix** | Increase minimum touch target to 48x48px |
| **Owner** | Design Team |

#### MED-018: Missing Focus Indicators
| Field | Value |
|-------|-------|
| **File/Service** | Multiple components |
| **Problem** | `focus:outline-none` found in many places |
| **Impact** | Keyboard users cannot see focus state |
| **Recommended Fix** | Replace with visible focus styles, add :focus-visible globally |
| **Owner** | Design Team |

#### MED-019: No Skeleton Screens
| Field | Value |
|-------|-------|
| **File/Service** | All apps |
| **Problem** | No skeleton loading components |
| **Impact** | Jarring load transitions |
| **Recommended Fix** | Add skeleton screens for all data-fetching views |
| **Owner** | Frontend Team |

#### MED-020: Hardcoded Colors in Alert
| Field | Value |
|-------|-------|
| **File/Service** | rez-app-merchant/components/ui/Alert.tsx |
| **Problem** | Colors not theme-aware, no dark mode |
| **Recommended Fix** | Reference Colors from design tokens |
| **Owner** | Design Team |

### FINANCE

#### MED-021: Bureau Score Integration Pending
| Field | Value |
|-------|-------|
| **File/Service** | rez-finance-service/src/services/creditScoreService.ts:105-113 |
| **Problem** | Phase 2 - Experian/CRIF not implemented |
| **Impact** | Credit decisions rely solely on REZ behavioral data |
| **Recommended Fix** | Prioritize bureau integration |
| **Owner** | Finance Team |

#### MED-022: Interest Config Hardcoded
| Field | Value |
|-------|-------|
| **File/Service** | rez-finance-service/src/interestConfig.ts |
| **Problem** | Default values hardcoded, env var override only |
| **Impact** | Changing rates requires deployment |
| **Recommended Fix** | Database-backed configuration with admin panel |
| **Owner** | Finance Team |

#### MED-023: HSN Codes Need Tax Consultant
| Field | Value |
|-------|-------|
| **File/Service** | rez-finance-service/src/services/corpGSTService.ts:26-28 |
| **Problem** | Hotel uses same HSN as dining (both 9963) |
| **Recommended Fix** | Verify correct HSN codes with tax consultant |
| **Owner** | Finance Team |

#### MED-024: Fraud Detection Uses Heuristics Only
| Field | Value |
|-------|-------|
| **File/Service** | rez-finance-service/src/engines/riskEngine.ts:28-52 |
| **Problem** | Simple threshold-based rules, no ML |
| **Impact** | Sophisticated fraud may bypass detection |
| **Recommended Fix** | Implement ML-based anomaly detection |
| **Owner** | Finance Team |

#### MED-025: Floating Point in Tax Calculation
| Field | Value |
|-------|-------|
| **File/Service** | rez-finance-service/src/services/corpGSTService.ts:224 |
| **Problem** | Math.round for floating point |
| **Impact** | Rounding errors accumulate on large volumes |
| **Recommended Fix** | Work in paise throughout calculations |
| **Owner** | Finance Team |

### DEVOPS

#### MED-026: Missing Health Checks
| Field | Value |
|-------|-------|
| **File/Service** | rez-gamification-service, rez-ads-service, rez-merchant-service |
| **Problem** | No HEALTHCHECK directive in Dockerfiles |
| **Recommended Fix** | Add health check to each Dockerfile |
| **Owner** | DevOps Team |

#### MED-027: Incomplete Nginx Configuration
| Field | Value |
|-------|-------|
| **File/Service** | nginx/nginx.conf |
| **Problem** | No SSL termination, no rate limiting |
| **Recommended Fix** | Complete configuration with SSL, rate limiting, health checks |
| **Owner** | DevOps Team |

#### MED-028: No Database Migration in CI/CD
| Field | Value |
|-------|-------|
| **File/Service** | GitHub Actions workflows |
| **Problem** | No automated migration execution |
| **Recommended Fix** | Add migration step to deploy workflow |
| **Owner** | DevOps Team |

#### MED-029: Missing Security Headers in Vercel
| Field | Value |
|-------|-------|
| **File/Service** | adsqr/vercel.json |
| **Problem** | Only cron configuration, no security headers |
| **Recommended Fix** | Add headers from rez-now/vercel.json |
| **Owner** | DevOps Team |

#### MED-030: Prometheus Alert Rules
| Field | Value |
|-------|-------|
| **File/Service** | alert_rules.yml |
| **Problem** | Reference non-existent http_requests_total metric |
| **Impact** | Alerts never fire |
| **Recommended Fix** | Instrument services with proper metrics or fix alerts |
| **Owner** | DevOps Team |

---

## LOW PRIORITY ISSUES

### ARCHITECTURE

#### LOW-001: Documentation Duplication
| Field | Value |
|-------|-------|
| **File/Service** | 20+ services have nearly identical CLAUDE.md files |
| **Recommended Fix** | Create shared CLAUDE.md template |

#### LOW-002: ESLint Configuration Not Centralized
| Field | Value |
|-------|-------|
| **File/Service** | Root .eslintrc.yml and individual services |
| **Recommended Fix** | Ensure all services extend root ESLint config |

#### LOW-003: Prettier Configuration Duplication
| Field | Value |
|-------|-------|
| **File/Service** | .prettierrc, .prettierrc.yml, and service-specific |
| **Recommended Fix** | Single source of truth at root |

#### LOW-004: Engine Version Not Enforced
| Field | Value |
|-------|-------|
| **File/Service** | Most services |
| **Problem** | `"engines": { "node": ">=20.0.0" }` declared but not verified in CI |
| **Recommended Fix** | Add Node version check to CI pipeline |

#### LOW-005: Dockerfiles Not Audited
| Field | Value |
|-------|-------|
| **File/Service** | Multiple services |
| **Recommended Fix** | Audit for base image consistency and build optimization |

### DATABASE

#### LOW-006: Mixed Date Types
| Field | Value |
|-------|-------|
| **File/Service** | Multiple files |
| **Problem** | Date | string throughout codebase |
| **Recommended Fix** | Standardize to ISO string |

#### LOW-007: Large Monolithic Interfaces
| Field | Value |
|-------|-------|
| **File/Service** | src/entities/product.ts (285 lines, 50+ fields) |
| **Recommended Fix** | Split into sub-interfaces |

#### LOW-008: Unused Index
| Field | Value |
|-------|-------|
| **File/Service** | rez-merchant-intelligence-service/src/models/MerchantProfile.ts:456 |
| **Problem** | updatedAt index not used in queries |
| **Recommended Fix** | Remove if no queries rely on it |

#### LOW-009: Missing Compound Index for Login
| Field | Value |
|-------|-------|
| **File/Service** | rez-profile-service/src/models/index.ts:50-51 |
| **Recommended Fix** | Consider { email: 1, phone: 1 } compound index |

### FINANCE

#### LOW-010: Cashback Expiry Not Tracked
| Field | Value |
|-------|-------|
| **File/Service** | rez-wallet-service/src/services/walletService.ts:1322-1327 |
| **Problem** | Cashback is scalar with no expiry tracking |
| **Recommended Fix** | Add TODO clarifying non-expiring by design |

#### LOW-011: No Cap on Late Fees
| Field | Value |
|-------|-------|
| **File/Service** | rez-finance-service/src/interestConfig.ts:59 |
| **Problem** | No maximum late fee cap |
| **Recommended Fix** | Add configurable maximum late fee for regulatory compliance |

### UX

#### LOW-012: Limited Component Library
| Field | Value |
|-------|-------|
| **File/Service** | rez-admin-training-panel |
| **Problem** | No centralized design system |
| **Recommended Fix** | Create shared component library |

#### LOW-013: HTML Dashboards Not Responsive
| Field | Value |
|-------|-------|
| **File/Service** | REZ-dashboard/ree-admin.html, REZ-admin-dashboard/ |
| **Problem** | Static HTML, not responsive, no accessibility |
| **Recommended Fix** | Migrate to React/Vue components |

### DEVOPS

#### LOW-014: No Blue-Green Deployment
| Field | Value |
|-------|-------|
| **File/Service** | All services |
| **Problem** | Direct replacement deployment |
| **Recommended Fix** | Implement blue-green or canary deployment |

#### LOW-015: Hardcoded Service URLs
| Field | Value |
|-------|-------|
| **File/Service** | render.yaml files |
| **Recommended Fix** | Use environment-specific configuration |

---

## ISSUES FIXED (Previous Waves)

The following issues were identified and fixed in previous audit waves:

| Wave | Issues Fixed | Status |
|------|--------------|--------|
| Wave 9 | 84 issues (C1-C19, OPS-003) | COMPLETE |
| Wave 10 | Build verification, npm audit fixes | COMPLETE |
| Wave 11 | Hardcoded URLs, silent errors, pagination | COMPLETE |
| Wave 12 | Kong CORS, start.sh eval, intent capture | COMPLETE |
| Wave 13 | Redis fallbacks, anonymization salt, API fallbacks | COMPLETE |

### Key Fixes Applied
- timingSafeEqual implemented in auth services
- Fail-closed rate limiting added
- Unified internal auth middleware
- Centralized logging with W3C traceparent
- Kong Gateway configured with JWT, CORS, rate limiting
- Health checks added
- Cursor pagination utilities created
- RBAC enforced on sensitive operations

---

## ACTION ITEMS BY OWNER

### Security Team
1. [CRIT] Rotate all exposed credentials (URGENT)
2. [CRIT] Remove secrets from git history
3. [HIGH] Implement HashiCorp Vault or AWS Secrets Manager
4. [HIGH] Implement per-service scoped tokens
5. [HIGH] Enable Redis AUTH
6. [HIGH] Encrypt Brand secretKey

### Platform Team
1. [CRIT] Enable TypeScript strict mode
2. [CRIT] Fix rez-service-core exports
3. [CRIT] Mandate shared-types dependency
4. [HIGH] Move logger to @rez/shared
5. [HIGH] Standardize TypeScript version
6. [HIGH] Standardize Zod version
7. [HIGH] Audit API gateway
8. [MED] Add path aliases to all services
9. [MED] Standardize test framework

### Backend Team
1. [CRIT] Migrate CorpPerks to MongoDB
2. [CRIT] Fix CorpPerks auth middleware
3. [CRIT] Add refund webhook tamper protection
4. [CRIT] Replace Redis KEYS with SCAN
5. [HIGH] Fix payment retries disabled
6. [HIGH] Add delivery webhook signature verification
7. [HIGH] Increase wallet service pool size
8. [HIGH] Add projection to user queries
9. [MED] Fix offset pagination
10. [MED] Reduce socket.io timeout
11. [MED] Add profile cache invalidation

### Frontend Team
1. [CRIT] Fix TypeScript errors in merchant copilot
2. [CRIT] Install missing dependencies
3. [CRIT] Fix local package references
4. [MED] Consolidate color tokens
5. [MED] Fix touch targets
6. [MED] Add focus indicators
7. [MED] Add skeleton screens
8. [MED] Fix hardcoded colors in Alert

### Mobile Team
1. [HIGH] Move security settings to SecureStore
2. [HIGH] Implement certificate pinning
3. [HIGH] Fix JWT verification

### Finance Team
1. [CRIT] Add refund webhook tamper protection
2. [HIGH] Implement GST e-invoice integration
3. [HIGH] Extend recovery lookback to 7 days
4. [HIGH] Add manual reconciliation trigger
5. [MED] Implement bureau score integration
6. [MED] Database-back interest rates
7. [MED] Add ML-based fraud detection

### DevOps Team
1. [CRIT] Implement actual deployment commands
2. [CRIT] Fix hardcoded PostgreSQL password
3. [CRIT] Implement multi-stage builds
4. [HIGH] Add resource limits to Docker
5. [HIGH] Add rollback workflow
6. [HIGH] Add image scanning
7. [HIGH] Fix Grafana password
8. [MED] Add health checks to Dockerfiles
9. [MED] Complete nginx configuration
10. [MED] Add migration to CI/CD
11. [MED] Fix Prometheus alert rules

### Database Team
1. [CRIT] Add migration existence check
2. [MED] Add missing indexes
3. [MED] Create rollback strategy
4. [MED] Standardize currency format

### Design Team
1. [MED] Consolidate color tokens
2. [MED] Standardize touch targets (48x48)
3. [MED] Add visible focus indicators
4. [MED] Add skeleton screens
5. [MED] Make Alert component theme-aware

---

## METRICS SUMMARY

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Security | 8 | 8 | 2 | 0 | 18 |
| Architecture | 3 | 6 | 6 | 5 | 20 |
| Performance | 0 | 3 | 3 | 0 | 6 |
| Finance | 3 | 3 | 5 | 2 | 13 |
| Database | 1 | 3 | 6 | 4 | 14 |
| DevOps | 4 | 5 | 5 | 2 | 16 |
| Build/Deploy | 4 | 0 | 0 | 0 | 4 |
| UX/Accessibility | 0 | 0 | 5 | 2 | 7 |
| **TOTAL** | **23** | **25** | **32** | **15** | **95** |

*Note: This excludes issues already fixed in previous waves (84+ issues resolved)*

---

## NEXT AUDIT

**Scheduled:** 2026-06-04

**Focus Areas:**
1. Verify credential rotation completed
2. Check CorpPerks MongoDB migration
3. Review TypeScript strict mode adoption
4. Assess deployment pipeline status

---

*Master Issues List Generated: 2026-05-04*
*Consolidated from: AUDIT-1 through AUDIT-8, AUDIT-WAVE-9 through AUDIT-WAVE-15*
