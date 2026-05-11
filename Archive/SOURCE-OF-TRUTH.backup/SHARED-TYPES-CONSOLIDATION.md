# Shared Types Consolidation Guide

**Issue:** H14 - Shared Types Divergence
**Status:** In Progress
**Date:** 2026-04-29

---

## Problem

The REZ ecosystem has three different sources for shared types:

| Source | Used By | Risk |
|--------|---------|------|
| GitHub fork (`@rez/shared-types`) | consumer-app | Uncontrolled, stale |
| Local path (`file:../rez-shared`) | admin-app | Monorepo only |
| Published npm (`@rez/shared`) | backend services | ✅ Preferred |

### Current State

**Consumer App (consumer-app):**
```json
"@rez/shared-types": "github:ruvnet/rez-shared-types#v1.0.0"
```

**Admin App (admin-app):**
```json
"@rez/shared": "file:../rez-shared"
```

**Backend Services:**
```json
"@rez/shared": "^1.0.0"
```

---

## Solution

Consolidate to a single source: `@rez/shared` published to npm.

### Step 1: Publish rez-shared to npm

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-shared
npm version patch
npm publish --access public
```

### Step 2: Update consumer-app

```bash
# Remove GitHub fork
npm uninstall @rez/shared-types

# Install published package
npm install @rez/shared@latest
```

### Step 3: Update admin-app

```bash
# Remove local path
npm uninstall @rez/shared

# Install published package
npm install @rez/shared@latest
```

### Step 4: Verify no type divergence

```bash
# Run type checking on all apps
npm run type-check
```

---

## Type Export Standards

All shared types should be exported from `rez-shared/src/index.ts`:

```typescript
// Types
export * from './types/api';
export * from './types/order';
export * from './types/payment';
export * from './types/user';

// Enums
export * from './enums/orderStatus';
export * from './enums/paymentStatus';
export * from './enums/userRole';

// Validation schemas
export * from './schemas/order';
export * from './schemas/payment';
```

---

## Breaking Changes Policy

1. **Major version** (2.0.0): Breaking changes, 6-week deprecation notice
2. **Minor version** (2.1.0): New types, backward compatible
3. **Patch version** (2.1.1): Bug fixes, backward compatible

---

## Migration Checklist

- [ ] Publish rez-shared to npm
- [ ] Update consumer-app to use @rez/shared from npm
- [ ] Update admin-app to use @rez/shared from npm
- [ ] Run type checking on all apps
- [ ] Update documentation

---

## References

- [rez-shared package](https://www.npmjs.com/package/@rez/shared)
- [Publishing npm packages](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages)
