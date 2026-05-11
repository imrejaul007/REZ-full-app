# SAFE CONSOLIDATION EXECUTION PLAN
## Zero Data Loss - Zero Downtime

**Date:** May 6, 2026
**Version:** 1.0
**Principle:** Safety First, No Rush

---

## PRE-CONSOLIDATION CHECKLIST

Before ANY change:

```
PRE-FLIGHT CHECKLIST:
□ All code in git
□ All branches pushed
□ All tests passing
□ Database backed up
□ Rollback plan documented
□ Team notified
□ Monitoring active
□ Communication sent
□ Time slot booked (non-peak hours)
□ Someone watching dashboards
□ Someone ready to rollback
```

---

## PHASE 1: SAFE DELETION (Week 1)

### Why First?
- Zero risk
- Zero downtime
- Immediate cleanup
- No code changes

### Repos to Delete (No Code Loss)

**DO NOT DELETE until verified:**
- [ ] `adsqr` - Is there any code inside? Check `./src/`, `./lib/`
- [ ] `adbazaar-creator` - Any shared code?
- [ ] `ados` - Any unique code? (Same as adsos)
- [ ] `analytics-events` - Any unique handlers?
- [ ] `REZ-mind-client` - Any custom logic?

**SAFE TO DELETE (Empty/Legacy):**
- [ ] `Rez_v-2` - Basic template
- [ ] `rez-app` - Basic template
- [ ] `rezprive` - Premium feature (check if in consumer app)
- [ ] `Karma` - Check if duplicate of rez-karma-service
- [ ] `REZ-adbazaar` - Check if same as adBazaar
- [ ] `REZ-consumer-copilot` - Static HTML only
- [ ] `REZ-feature-flags` - Check if used anywhere

### Verification Steps

```bash
# 1. Check for any code
ls -la <repo>/src/
ls -la <repo>/lib/

# 2. Check git history
git log --oneline -5

# 3. Check if used by other repos
grep -r "repo-name" /path/to/all/repos/

# 4. Archive instead of delete
gh api repos/imrejaul007/<repo-name> -X PATCH -f archived=true

# 5. Only delete if 100% sure
gh repo delete imrejaul007/<repo-name> --yes
```

### Action Plan

```bash
# Step 1: Archive all (don't delete yet)
for repo in adsqr adbazaar-creator ados analytics-events; do
  gh api repos/imrejaul007/$repo -X PATCH -f archived=true 2>/dev/null
  echo "Archived: $repo"
done

# Step 2: Review archived repos for 2 weeks
# If no issues found, then delete

# Step 3: Delete after 2 week review
for repo in adsqr adbazaar-creator ados analytics-events; do
  # Verify no one uses it
  grep -r "$repo" ../*/src/ 2>/dev/null || echo "Not used: $repo"
done

# Step 4: Only then delete
gh repo delete imrejaul007/<repo-name> --yes
```

---

## PHASE 2: BACKUP ALL SERVICES (Week 1)

### Before ANY merge

```bash
# For each service to be merged:
SERVICE="rez-lead-intelligence"

# 1. Create backup branch
git checkout -b backup/$(date +%Y%m%d)

# 2. Push to remote
git push origin backup/$(date +%Y%m%d)

# 3. Export service config
tar -czf ${SERVICE}-backup.tar.gz \
  .env.example \
  .env.example.local \
  render.yaml \
  docker-compose.yml \
  Dockerfile \
  README.md

# 4. Store backup in S3/GCS
aws s3 cp ${SERVICE}-backup.tar.gz s3://rez-backups/

# 5. Document all endpoints
cat > ${SERVICE}-endpoints.md << 'EOF'
# Service: $SERVICE
# Backup Date: $(date)
# Git Branch: backup/$(date +%Y%m%d)

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
EOF

# 6. Document all connections
grep -r "fetch\|axios\|http" src/ --include="*.ts" | \
  grep -E "localhost|process\.env" >> ${SERVICE}-connections.md
```

### Backup Template

```bash
#!/bin/bash
# backup-service.sh

SERVICE=$1
BACKUP_BRANCH="backup/$(date +%Y%m%d%H%M)"

echo "Backing up $SERVICE..."

# 1. Git backup
git checkout -b $BACKUP_BRANCH
git push origin $BACKUP_BRANCH

# 2. Export configs
cp .env.example .env.backup 2>/dev/null
cp render.yaml render.yaml.backup 2>/dev/null

# 3. Export to cloud
tar -czf /tmp/${SERVICE}.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  .

# 4. Upload to backup storage
# (configure your backup storage)

# 5. Create recovery document
cat > /tmp/${SERVICE}-recovery.md << 'EOF'
# Recovery Instructions for $SERVICE

## To Restore
1. Clone from: git@github.com:imrejaul007/${SERVICE}.git
2. Checkout: git checkout $BACKUP_BRANCH
3. Restore configs from backup.tar.gz
4. Deploy

## Service Info
- Port: [from render.yaml]
- Env vars: [list from .env.example]
- Dependencies: [from package.json]
- Database: [MongoDB connection]
- External APIs: [list all external calls]
EOF

echo "Backup complete for $SERVICE"
```

---

## PHASE 3: MONOREPO ORGANIZATION (Week 2)

### Strategy: Group, Don't Merge

**Instead of merging code, organize into workspaces**

#### Example: Marketing Platform

```json
// packages/marketing-platform/package.json
{
  "name": "@rez/marketing-platform",
  "private": true,
  "workspaces": [
    "services/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspaces",
    "build": "npm run build --workspaces",
    "deploy": "npm run deploy --workspaces"
  }
}
```

```yaml
# packages/marketing-platform/render.yaml
services:
  - type: web
    name: rez-marketing-service
    path: services/rez-marketing-service
  
  - type: web
    name: rez-lead-intelligence
    path: services/rez-lead-intelligence
  
  - type: web
    name: rez-abandonment-tracker
    path: services/rez-abandonment-tracker
```

### Migration Steps

```bash
# 1. Create monorepo structure
mkdir -p packages/marketing-platform/services
cd packages/marketing-platform/services

# 2. Clone existing services (NOT MOVE)
git clone https://github.com/imrejaul007/rez-marketing-service.git
git clone https://github.com/imrejaul007/rez-lead-intelligence.git
git clone https://github.com/imrejaul007/rez-abandonment-tracker.git

# 3. Create package.json
cd ../..
cat > package.json << 'EOF'
{
  "name": "@rez/marketing-platform",
  "private": true,
  "workspaces": ["services/*"],
  "scripts": {
    "dev": "npm run dev --workspaces --if-present",
    "test": "npm run test --workspaces"
  }
}
EOF

# 4. Create render.yaml for each service
# (keep existing config, just organize)

# 5. Update CI/CD
# (can deploy individually or together)
```

### Benefits of Monorepo

| Aspect | Before | After |
|--------|--------|--------|
| Code sharing | Copy-paste | Shared imports |
| Dependencies | Duplicated | Single source |
| Testing | Separate | Cross-service |
| Deployment | Separate | Separate or combined |
| Risk | High (moving code) | Low (no code moves) |

---

## PHASE 4: SHARED PACKAGES (Week 3)

### Extract, Don't Duplicate

```typescript
// Before: Each service has its own implementation
// rez-service-a/src/utils/validation.ts
export function validatePhone(phone: string) { ... }

// rez-service-b/src/utils/validation.ts
export function validatePhone(phone: string) { ... } // DUPLICATE!

// After: Shared package
// packages/@rez/shared/src/validation.ts
export function validatePhone(phone: string) { ... }

// rez-service-a/src/index.ts
import { validatePhone } from '@rez/shared';

// rez-service-b/src/index.ts
import { validatePhone } from '@rez/shared';
```

### Package Structure

```
packages/
├── @rez/shared/           # Utils, types, constants
├── @rez/contracts/        # Zod schemas
├── @rez/feature-flags/   # Flag management
├── @rez/intelligence-client/  # Intelligence patterns
└── @rez/copilot-intents/    # Intent handlers
```

### Migration Steps

```bash
# 1. Create package
mkdir -p packages/@rez/shared
cd packages/@rez/shared

# 2. Initialize
npm init -y

# 3. Extract common code
cp ../../rez-service-a/src/utils/*.ts src/
cp ../../rez-service-b/src/utils/*.ts src/
# ... merge duplicates

# 4. Publish to npm (private scoped)
npm publish --access restricted

# 5. Update services to use package
# In each service:
npm install @rez/shared

# 6. Update imports
# FROM: import { validate } from '../utils/validation'
# TO: import { validate } from '@rez/shared'
```

---

## PHASE 5: STRATEGIC MERGES (Week 4-8)

### Only Merge When:

1. **Same database** (no cross-service queries)
2. **Same external APIs** (same dependencies)
3. **70%+ identical code** (copy-paste situation)
4. **Same team owns both** (responsibility clear)
5. **No breaking changes** (all tests pass)

### Merge Decision Matrix

| Service A | Service B | Merge? | Reason |
|-----------|-----------|---------|--------|
| `adsos` | `rez-dooh-service` | **YES** | DOOH is subset, same purpose |
| `REZ-user-intelligence` | `REZ-merchant-intelligence` | **NO** | Different DBs, different purpose |
| `REZ-personalization` | `REZ-recommendation` | **CONDITIONAL** | Similar algorithms, check overlap |
| `REZ-feature-flags` | `rez-shared` | **YES** | Utility package, no external deps |
| `rez-lead-intelligence` | `rez-marketing` | **CONDITIONAL** | Same DB? Same team? |

### Safe Merge Procedure

```bash
#!/bin/bash
# merge-services.sh

SOURCE="rez-source-service"   # To be merged FROM
TARGET="rez-target-service"   # To be merged INTO
BACKUP_BRANCH="backup/before-${SOURCE}-merge"

echo "Merging $SOURCE into $TARGET"

# 1. BACKUP EVERYTHING
echo "Creating backups..."
git clone https://github.com/imrejaul007/${SOURCE}.git /tmp/${SOURCE}-backup
git clone https://github.com/imrejaul007/${TARGET}.git /tmp/${TARGET}-backup

# 2. Verify tests pass
echo "Running tests on $SOURCE..."
cd /tmp/${SOURCE}
npm test || { echo "TESTS FAILED - ABORT"; exit 1; }

# 3. Verify tests pass on target
echo "Running tests on $TARGET..."
cd /tmp/${TARGET}
npm test || { echo "TESTS FAILED - ABORT"; exit 1; }

# 4. Create merge branch on TARGET
git checkout -b merge/${SOURCE}

# 5. Copy code from SOURCE
cp -r /tmp/${SOURCE}/src/* src/
# OR copy specific modules:
# cp -r /tmp/${SOURCE}/src/modules/* src/modules/

# 6. Resolve conflicts (if any)
# Manual review required!

# 7. Run tests again
npm test || { echo "TESTS FAILED - ROLLBACK"; git checkout main; exit 1; }

# 8. Deploy to staging
npm run deploy:staging

# 9. Run integration tests
npm run test:integration || { echo "INTEGRATION FAILED - ROLLBACK"; exit 1; }

# 10. Deploy to production
npm run deploy:production

# 11. Monitor for 24 hours
# If issues, rollback:
# git checkout main && git branch -D merge/${SOURCE}

# 12. Archive SOURCE repo (don't delete yet)
gh api repos/imrejaul007/${SOURCE} -X PATCH -f archived=true

echo "Merge complete! Archived $SOURCE"
```

### Rollback Procedure

```bash
#!/bin/bash
# rollback.sh

SOURCE="rez-source-service"
BACKUP_BRANCH="backup/before-${SOURCE}-merge"

# 1. Stop traffic to merged code
# (update load balancer / gateway)

# 2. Restore TARGET to previous state
cd /path/to/${TARGET}
git checkout main
git branch -D merge/${SOURCE}

# 3. Verify TARGET is working
npm test
npm run deploy:production

# 4. Monitor for 24 hours

# 5. Unarchive SOURCE if rollback needed long-term
gh api repos/imrejaul007/${SOURCE} -X PATCH -f archived=false
```

---

## PHASE 6: TESTING PROTOCOL

### Before Any Change

```typescript
// test-safety-check.ts

interface SafetyCheck {
  service: string;
  checks: {
    allCodeInGit: boolean;
    testsPassing: boolean;
    backupCreated: boolean;
    teamNotified: boolean;
    rollbackPlanReady: boolean;
    monitoringActive: boolean;
    timeSlotNonPeak: boolean;
  };
  approved: boolean;
  approver: string;
}

async function preFlightCheck(service: string): Promise<boolean> {
  const checks: SafetyCheck = {
    service,
    checks: {
      allCodeInGit: await gitStatus() === 'clean',
      testsPassing: await runTests() === 0,
      backupCreated: await backupExists(service),
      teamNotified: await sentNotification(service),
      rollbackPlanReady: await rollbackDocExists(service),
      monitoringActive: await dashboardsHealthy(),
      timeSlotNonPeak: await isNonPeakHour(),
    },
    approved: false,
    approver: ''
  };

  // All checks must pass
  const allPassed = Object.values(checks.checks).every(v => v === true);

  if (!allPassed) {
    console.error('Safety checks failed:');
    Object.entries(checks.checks)
      .filter(([_, passed]) => !passed)
      .forEach(([check]) => console.error(`  - ${check}`));
    return false;
  }

  return true;
}
```

### After Any Change

```typescript
async function postFlightCheck(service: string): Promise<boolean> {
  const checks = {
    serviceHealth: await checkServiceHealth(service),
    errorRate: await getErrorRate(service),
    latencyP99: await getLatency(service),
    databaseHealthy: await checkDatabase(service),
    cacheHealthy: await checkRedis(service),
  };

  // Alert if any issues
  for (const [check, result] of Object.entries(checks)) {
    if (!result) {
      await sendAlert(`${service}: ${check} failed`);
      await triggerRollback(service);
      return false;
    }
  }

  return true;
}
```

---

## VALIDATION GATES

### Gate 1: Pre-Merge
- [ ] All code in git
- [ ] Tests pass (100%)
- [ ] Backup created
- [ ] Team approved
- [ ] Rollback plan ready

### Gate 2: Post-Merge
- [ ] Service starts
- [ ] Health check passes
- [ ] Basic functionality works
- [ ] Error rate < 1%
- [ ] Latency P99 < 500ms

### Gate 3: 24 Hours Post-Merge
- [ ] No increase in errors
- [ ] No performance degradation
- [ ] Monitoring looks healthy
- [ ] User reports: none

### Gate 4: 1 Week Post-Merge
- [ ] All metrics normal
- [ ] Source repo archived
- [ ] Documentation updated
- [ ] SOURCE-OF-TRUTH updated
- [ ] Can safely delete source

---

## COMMUNICATION TEMPLATES

### Before Change

```markdown
# Scheduled Maintenance: [Service Name]

**When:** [Date], [Time] - [Duration]
**Impact:** [None/Low/Medium/High]

**What:** [Brief description]
**Why:** [Brief reason]

**Affected Services:**
- [Service A]
- [Service B]

**Rollback Plan:**
1. [Step 1]
2. [Step 2]

**Contacts:**
- Primary: [Name]
- Secondary: [Name]

Reply to confirm or raise concerns.
```

### After Change

```markdown
# Maintenance Complete: [Service Name]

**Status:** ✅ SUCCESS / ❌ FAILED

**Duration:** [X minutes]
**Issues:** [None / Describe if any]

**Next Steps:**
- [ ] Monitor for 24 hours
- [ ] Archive source repo after 1 week
- [ ] Update documentation

**If Issues:**
- Rollback command: [Command]
- Contact: [Name]
```

---

## QUICK REFERENCE

### Safe Actions
- ✅ Archive empty/legacy repos
- ✅ Organize into monorepos
- ✅ Extract shared packages
- ✅ Copy code, don't move

### Risky Actions (Require Extra Care)
- ⚠️ Merge services with different databases
- ⚠️ Merge services with different external APIs
- ⚠️ Delete any service with code
- ⚠️ Change database connections
- ⚠️ Update shared packages (affects all users)

### Dangerous Actions (Never Without Approval)
- ❌ Force push to main
- ❌ Delete branches
- ❌ Modify production databases
- ❌ Change secrets
- ❌ Remove replication

---

## EMERGENCY CONTACTS

| Role | Name | Contact |
|------|------|---------|
| Primary Dev | [You] | [Your contact] |
| DBA | [DBA Name] | [Contact] |
| DevOps | [Ops Name] | [Contact] |
| On-call | PagerDuty | [Link] |

---

## ROLLBACK SCRIPTS

### Quick Rollback

```bash
#!/bin/bash
# quick-rollback.sh

SERVICE=$1

# 1. Revert to previous deployment
kubectl rollout undo deployment/${SERVICE}

# 2. Verify
kubectl rollout status deployment/${SERVICE}

# 3. Check logs
kubectl logs -l app=${SERVICE} --tail=100

# 4. Alert
curl -X POST [slack-webhook] -d "Rollback triggered for ${SERVICE}"
```

### Full Rollback

```bash
#!/bin/bash
# full-rollback.sh

SERVICE=$1
SOURCE_BRANCH="backup/$(date +%Y%m%d)"

# 1. Stop service
kubectl scale deployment/${SERVICE} --replicas=0

# 2. Restore from backup
git checkout ${SOURCE_BRANCH}
git push origin main --force

# 3. Redeploy
kubectl scale deployment/${SERVICE} --replicas=2

# 4. Verify
sleep 30
curl -f https://${SERVICE}.rez.money/health

# 5. Alert
curl -X POST [pagerduty-webhook] -d "Full rollback for ${SERVICE}"
```

---

**Safety First - No Rush - Zero Data Loss**
