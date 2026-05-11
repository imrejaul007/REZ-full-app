# E2E Testing

## Setup

```bash
# Install Playwright browsers
npx playwright install

# Or install with dependencies
npx playwright install --with-deps
```

## Run Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI (visual test runner)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

## Configuration

The Playwright configuration is in `playwright.config.ts`. Key settings:

- **Base URL**: `http://localhost:3000` (configured to auto-start dev server)
- **Browsers**: Chromium, Firefox, Webkit, Mobile Chrome, Mobile Safari
- **Retries**: 2 retries on CI, 0 locally
- **Reporters**: HTML report (opens automatically after test run)

## Writing Tests

Tests are located in the `e2e/` directory. See `e2e/example.spec.ts` for reference patterns:

- Use `page.goto('/path')` for navigation
- Use `expect()` assertions for validation
- Use `test.beforeEach()` for shared setup
- Use `test.describe()` to group related tests

## Troubleshooting

### Port 3000 already in use
The config auto-detects if dev server is already running. To force restart:
```bash
# Kill existing process
lsof -i :3000
kill <PID>
```

### Browser not installed
```bash
npx playwright install chromium
```
