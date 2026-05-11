# rez-devops-config

Centralized GitHub Actions CI/CD configuration for all REZ repositories.

## Purpose

All REZ repos reference these shared workflows instead of duplicating CI/CD logic.

## Usage

### 1. Add workflow references to your repo

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: CI
    uses: imrejaul007/rez-devops-config/.github/workflows/ci.yml@main
    with:
      service_name: my-service
      node_version: '20'
      run_tests: true
      run_lint: true
      run_typecheck: true
      run_build: true
      run_arch_fitness: true
    secrets:
      GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy
    uses: imrejaul007/rez-devops-config/.github/workflows/deploy.yml@main
    with:
      service_name: my-service
      service_type: node-service
      vercel_token: ${{ secrets.VERCEL_TOKEN }}
      vercel_org_id: ${{ secrets.VERCEL_ORG_ID }}
      vercel_project_id: ${{ secrets.VERCEL_PROJECT_ID }}
    secrets:
      GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

### 2. Required GitHub Secrets

Add these to each repo's Settings > Secrets:

| Secret | Description |
|--------|-------------|
| `GH_TOKEN` | GitHub Personal Access Token |
| `VERCEL_TOKEN` | Vercel API Token (for frontend deploys) |
| `VERCEL_ORG_ID` | Vercel Organization ID |
| `VERCEL_PROJECT_ID` | Vercel Project ID |
| `SLACK_BOT_TOKEN` | Slack bot token (optional, for deployment notifications) |

### 3. CI Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `service_name` | string | repo name | Name of the service |
| `node_version` | string | `'20'` | Node.js version |
| `service_type` | string | `'node-service'` | `node-service` \| `node-app` \| `nextjs` \| `react-native` \| `shared-package` |
| `run_tests` | boolean | `true` | Run test suite |
| `run_lint` | boolean | `true` | Run linter |
| `run_typecheck` | boolean | `true` | Run TypeScript compiler |
| `run_build` | boolean | `true` | Build the project |
| `run_arch_fitness` | boolean | `true` | Run arch fitness checks |
| `coverage_threshold` | number | `0` | Minimum coverage percentage |
| `mongodb_service` | boolean | `false` | Start MongoDB in CI |
| `redis_service` | boolean | `false` | Start Redis in CI |

## CI Pipeline Stages

1. **Quality Gates** — typecheck + lint
2. **Test** — unit tests + coverage upload
3. **Build** — production build verification
4. **Architecture Fitness** — bespoke buttons, console logs, Math.random, idempotency checks
5. **Security Audit** — npm audit at high severity
6. **CI Gate** — all-or-nothing success gate

## Deployment Types

| Type | Platform | Trigger |
|------|----------|---------|
| `nextjs` | Vercel | Push to main |
| `react-native` | EAS / Vercel | Push to main |
| `node-service` | Render / AWS | Push to main |

## Service Configuration Examples

### Next.js App (Merchant, Admin, Web Menu)

```yaml
ci:
  uses: rez-devops-config/.github/workflows/ci.yml@main
  with:
    service_name: rez-merchant
    node_version: '20'
    service_type: nextjs
    run_tests: true
    run_lint: true
    run_typecheck: true
    run_build: true
```

### Microservice (Auth, Wallet, Payment, etc.)

```yaml
ci:
  uses: rez-devops-config/.github/workflows/ci.yml@main
  with:
    service_name: rez-wallet-service
    node_version: '20'
    service_type: node-service
    run_tests: true
    run_lint: true
    run_typecheck: true
    run_build: true
    mongodb_service: true
    redis_service: true
```

### Shared Package (@karim4987498/shared)

```yaml
ci:
  uses: rez-devops-config/.github/workflows/ci.yml@main
  with:
    service_name: rez-shared
    node_version: '20'
    service_type: shared-package
    run_tests: true
    run_lint: true
    run_typecheck: true
    run_build: true
```

## Architecture Fitness Rules

These checks run on every PR:

1. **No bespoke buttons** — UI components must import from `@rez/rez-ui`
2. **No console.* logs** — Use `rez-shared/telemetry` logger
3. **No Math.random()** — Use `crypto.randomUUID()`
4. **No bespoke idempotency** — Use `rez-shared/idempotency`
5. **No bespoke enums** — Use `rez-shared/enums`

## Branch Protection (Applied via GitHub API)

All repos must have these rules on `main`:

- ✓ Require pull request reviews (1 approval)
- ✓ Require status checks to pass before merging
- ✓ Require branches to be up to date before merging
- ✓ Include administrators in protection rules
- ✓ Do not allow bypassing of the above rules

## Error Intelligence

When errors occur, document them in:
https://github.com/imrejaul007/rez-error-intelligence

See that repo for error tracking schema and workflow.
