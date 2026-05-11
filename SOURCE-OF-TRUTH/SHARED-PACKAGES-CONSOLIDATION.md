# Shared Packages Consolidation Plan
**Date:** 2026-04-25
**Status:** PLANNING

---

## Current State Analysis

### Package Usage Map

```
@karim4987498/shared (rez-shared/) - 14 services depend on this
├── rez-auth-service
├── rez-merchant-service
├── rez-wallet-service
├── rez-payment-service
├── rez-order-service
├── rez-catalog-service
├── rez-search-service
├── rez-gamification-service
├── rez-ads-service
├── rez-marketing-service
├── rez-media-events
├── rez-notification-events
├── rez-finance-service
├── rez-karma-service
└── Hotel OTA

@rez/shared-types (packages/) - 1 service uses this (local file reference)
└── rez-app-marchant (via file:../packages/shared-types)

@rez/ui (packages/rez-ui/) - Used by apps for UI components
└── Imported in consumer/merchant apps

@rez/shared-enums (packages/shared-enums/) - Minimal, likely unused
└── Unknown usage
```

### Problems Identified

| Problem | Severity | Description |
|---------|----------|-------------|
| Duplicate enums | HIGH | `enums.ts` exists in both `rez-shared` and `packages/shared-types` |
| Dead code | MEDIUM | `packages/shared-types` only used by 1 app via local file path |
| Confusing structure | MEDIUM | 4 separate shared packages, unclear which is canonical |
| Version mismatch | LOW | `packages/shared-types` v2.0, `rez-shared` has no version (git-based) |
| Private npm org | LOW | Using `@karim4987498` instead of `@rez` |

---

## Recommended Architecture

### Single Canonical Package: `@rez/shared`

```
@rez/shared (canonical)
├── src/
│ ├── enums/           # OrderStatus, PaymentStatus, UserRole, etc.
│ ├── types/           # Interfaces, branded types
│ ├── schemas/         # Zod validation schemas
│ ├── constants/       # Loyalty tiers, coin rates, etc.
│ ├── utils/           # Helper functions
│ ├── middleware/      # Idempotency, auth helpers
│ └── index.ts        # Barrel export
└── dist/             # Built output
```

### Keep Separate: `@rez/ui`

```
@rez/ui
├── src/
│ ├── Button.tsx
│ ├── Card.tsx
│ ├── Input.tsx
│ ├── Modal.tsx
│ └── List.tsx
└── (React Native UI components)
```

### Archive/Delete

| Package | Action | Reason |
|---------|--------|--------|
| `packages/shared-types/` | Archive | Dead code, only 1 local consumer |
| `packages/shared-enums/` | Delete | Subset of `rez-shared` |
| `@karim4987498/shared` | Rename to `@rez/shared` | Better branding |

---

## Migration Phases

### Phase 1: Inventory & Cleanup (Day 1)
**Goal:** Understand exactly what's in each package

```bash
# 1. List all exports from each package
node -e "console.log(Object.keys(require('./packages/shared-types/src')))"
node -e "console.log(Object.keys(require('./rez-shared/src')))"

# 2. Find all consumers of each export
grep -r "from.*shared-types" --include="*.ts" rez-*/
grep -r "from.*rez-shared" --include="*.ts" rez-*/
```

### Phase 2: Merge Shared-Types into Rez-Shared (Day 2)
**Goal:** Consolidate duplicate types

```bash
# Move types from packages/shared-types/src to rez-shared/src/types
mv packages/shared-types/src/types/* rez-shared/src/types/
mv packages/shared-types/src/schemas/* rez-shared/src/schemas/
mv packages/shared-types/src/entities/* rez-shared/src/types/

# Update barrel exports in rez-shared/src/index.ts
```

### Phase 3: Publish as @rez/shared (Day 3)
**Goal:** Standardize npm package naming

```bash
cd rez-shared

# Update package.json
# 1. Rename: "@karim4987498/shared" → "@rez/shared"
# 2. Set version to "2.0.0" (breaking change)
# 3. Publish to npm

npm publish --access public
```

### Phase 4: Update All Consumers (Day 4-5)
**Goal:** Update 14 services to use new package name

```bash
# Update all package.json files
for service in rez-*/; do
  sed -i '' 's/@karim4987498\/shared/@rez\/shared/g' "$service/package.json"
done

# Update all import statements
grep -rl "@karim4987498/shared" rez-*/src | xargs sed -i '' 's/@karim4987498\/shared/@rez\/shared/g'
```

### Phase 5: Archive Dead Packages (Day 6)

```bash
# Archive packages/shared-types (move to archives/)
mv packages/shared-types /tmp/shared-types-archive-$(date +%Y%m%d)

# Archive packages/shared-enums
mv packages/shared-enums /tmp/shared-enums-archive-$(date +%Y%m%d)

# Commit
git add -A
git commit -m "chore: archive dead shared packages"
```

---

## Rollback Plan

If something goes wrong:

```bash
# 1. Revert the npm package (if published)
npm unpublish @rez/shared@2.0.0

# 2. Revert git changes
git revert HEAD

# 3. Reinstall old packages
for service in rez-*/; do
  sed -i '' 's/@rez\/shared/@karim4987498\/shared/g' "$service/package.json"
done
```

---

## Verification Checklist

After migration, verify:

```bash
# 1. All services build
for service in rez-*/; do
  cd "$service"
  npm run build || echo "FAILED: $service"
  cd ..
done

# 2. No more @karim4987498 references
grep -r "@karim4987498" rez-*/src rez-*/package.json || echo "Clean!"

# 3. All exports work
cd rez-shared && npm run build && node -e "require('./dist')"
```

---

## Estimated Timeline

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1: Inventory | 1 hour | Low |
| Phase 2: Merge | 2 hours | Medium |
| Phase 3: Publish | 1 hour | Low |
| Phase 4: Update consumers | 3 hours | High |
| Phase 5: Archive | 30 min | Low |
| **Total** | ~8 hours | - |

---

## Decision Points

Before proceeding, confirm:

1. [ ] Which npm org should we use? `@rez/shared` or keep `@karim4987498`?
2. [ ] Should we keep `@rez/ui` separate or merge into consumer app?
3. [ ] Do we need to support both old and new package names during transition?
4. [ ] What's the version bump strategy? (major: 1.x → 2.0)

---

## Files to Modify

### Must Update (14 files):
```
rez-auth-service/package.json
rez-merchant-service/package.json
rez-wallet-service/package.json
rez-payment-service/package.json
rez-order-service/package.json
rez-catalog-service/package.json
rez-search-service/package.json
rez-gamification-service/package.json
rez-ads-service/package.json
rez-marketing-service/package.json
rez-media-events/package.json
rez-notification-events/package.json
rez-finance-service/package.json
rez-karma-service/package.json
Hotel OTA/package.json
rez-app-marchant/package.json
```

### Must Update (source imports):
All files importing from `@karim4987498/shared` or `@rez/shared-types`

---

## Last Updated: 2026-04-25
