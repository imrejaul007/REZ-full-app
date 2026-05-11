# REZ Ecosystem Package Version Registry

This document establishes the canonical versions for packages across the REZ ecosystem. All services should use these versions for consistency.

## Standardized Versions

| Package | Standard Version | Rationale |
|---------|-----------------|-----------|
| zod | ^3.23.0 | Latest stable with schema evolution support |
| mongoose | ^8.8.0 | Latest stable with connection pooling fixes |
| express | ^4.21.0 | Latest stable in v4 series |
| typescript | ^5.4.0 | Consistent across ecosystem |
| @sentry/node | ^8.0.0 | Latest v8 with ESM support |
| bullmq | ^5.10.0 | Latest stable with Redis 7 support |
| ioredis | ^5.4.0 | Latest stable |
| winston | ^3.14.0 | Latest stable with ESM support |
| prom-client | ^15.1.0 | Latest stable for metrics |
| jsonwebtoken | ^9.0.2 | Latest stable |
| helmet | ^7.1.0 | Latest stable |
| cors | ^2.8.5 | Latest stable |
| dotenv | ^16.4.0 | Latest stable |

## @sentry/node Version Policy

**Important**: @sentry/node has major version changes with breaking API changes. Services should follow this policy:

| Service | Sentry Version | Notes |
|---------|---------------|-------|
| @rez/service-core | ^8.0.0 | Core package, use v8 |
| rez-karma-service | ^8.0.0 | Use v8 |
| All other services | ^8.0.0 | Migrate to v8 |

## Version Conflicts Found

### zod
- `packages/shared-types`: ^3.22.0 (OUTDATED)
- `packages/rez-service-core`: Not used
- `rez-notification-events`: ^3.23.8 (NEWER)
- `rez-shared`: ^3.22.4 (OUTDATED)
- `rez-karma-service`: ^3.22.4 (OUTDATED)
- All other services: ^3.23.6 (CONSOLIDATE)

### mongoose
- `packages/rez-service-core`: ^8.0.0 (OUTDATED)
- All other services: ^8.17.2 (CONSOLIDATE)

### express
- `rez-notification-events`: ^4.19.2 (OUTDATED)
- All other services: ^4.21.x (CONSOLIDATE)

### @sentry/node
- `packages/rez-service-core`: ^8.0.0 (STANDARD)
- `rez-karma-service`: ^8.0.0 (STANDARD)
- All other services: Mixed ^7.119-120 (MIGRATE TO v8)

### typescript
- `packages/shared-types`: ^5.3.0 (OUTDATED)
- `packages/rez-service-core`: ^5.3.0 (OUTDATED)
- `rez-notification-events`: ^5.4.5 (SLIGHTLY OUTDATED)
- All other services: ^5.9.3 (CONSOLIDATE)

## Migration Guide

### Update zod
```bash
# In each package, run:
npm install zod@^3.23.0
```

### Update mongoose
```bash
# In each package, run:
npm install mongoose@^8.8.0
```

### Update @sentry/node to v8
```bash
# In each package, run:
npm install @sentry/node@^8.0.0
```

Note: @sentry/node v8 has breaking changes. See [Sentry v8 Migration Guide](https://docs.sentry.io/platforms/node/migration/v7-to-v8/).

## Override Patterns

For monorepo projects, add to root `package.json`:

```json
{
  "overrides": {
    "zod": "^3.23.0",
    "mongoose": "^8.8.0",
    "@sentry/node": "^8.0.0",
    "typescript": "^5.4.0"
  }
}
```

## Last Updated

- **Date**: 2026-04-30
- **Version**: 1.0.0
