/**
 * Access guard tests for high-risk internal routes
 *
 * These are source-level guards — they verify the route files wire the
 * correct middleware without needing a running server. They catch
 * accidental removal of auth checks during refactors.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '..', 'src', rel), 'utf8');
}

// ── Internal routes ──────────────────────────────────────────────────────────

test('internalRoutes: requireInternalToken is applied before any handler', () => {
  const src = read('routes/internalRoutes.ts');
  // Match router.use() call, not the import line or comments
  const tokenPos = src.indexOf('router.use(requireInternalToken)');
  // Match router.post() registrations, not comments
  const bnplPos = src.indexOf("router.post('/bnpl/settle'");
  const emiPos = src.indexOf("router.post('/emi/paid'");
  const scorePos = src.indexOf("router.post('/score/refresh'");

  assert.ok(tokenPos !== -1, 'router.use(requireInternalToken) must be present');
  assert.ok(tokenPos < bnplPos, 'requireInternalToken must appear before /bnpl/settle handler');
  assert.ok(tokenPos < emiPos, 'requireInternalToken must appear before /emi/paid handler');
  assert.ok(tokenPos < scorePos, 'requireInternalToken must appear before /score/refresh handler');
});

test('internalRoutes: all high-risk mutations emit audit logs', () => {
  const src = read('routes/internalRoutes.ts');
  assert.match(src, /auditLog\(req, 'bnpl\.settle'/, 'bnpl.settle must be audited');
  assert.match(src, /auditLog\(req, 'emi\.paid'/, 'emi.paid must be audited');
  assert.match(src, /auditLog\(req, 'score\.refresh'/, 'score.refresh must be audited');
});

// ── Partner webhook routes ───────────────────────────────────────────────────

test('partnerRoutes: signature verification runs before application status handler', () => {
  const src = read('routes/partnerRoutes.ts');
  const sigPos = src.indexOf('verifyPartnerSignature');
  const appPos = src.indexOf("'/:partnerId/application'");
  const disbursePos = src.indexOf("'/:partnerId/disbursal'");

  assert.ok(sigPos !== -1, 'verifyPartnerSignature must be present');
  assert.ok(sigPos < appPos, 'signature verification must appear before application handler');
  assert.ok(sigPos < disbursePos, 'signature verification must appear before disbursal handler');
});

test('partnerRoutes: no shared internal token used for partner webhooks', () => {
  const src = read('routes/partnerRoutes.ts');
  assert.doesNotMatch(src, /requireInternalToken/, 'partner routes must NOT use shared internal token');
});

test('partnerRoutes: both webhook handlers emit audit logs', () => {
  const src = read('routes/partnerRoutes.ts');
  assert.match(src, /auditLog\(req, 'application\.status_update'/, 'status_update must be audited');
  assert.match(src, /auditLog\(req, 'application\.disbursal'/, 'disbursal must be audited');
});

// ── Consumer routes ──────────────────────────────────────────────────────────

test('borrowRoutes: authenticateUser applied to all borrow routes', () => {
  const src = read('routes/borrowRoutes.ts');
  const authPos = src.indexOf('authenticateUser');
  const offersPos = src.indexOf("'/offers'");
  const applyPos = src.indexOf("'/apply'");
  const bnplPos = src.indexOf("'/bnpl/check'");

  assert.ok(authPos !== -1, 'authenticateUser must be present');
  assert.ok(authPos < offersPos, 'auth must appear before /offers');
  assert.ok(authPos < applyPos, 'auth must appear before /apply');
  assert.ok(authPos < bnplPos, 'auth must appear before /bnpl/check');
});

test('creditRoutes: authenticateUser applied before score endpoints', () => {
  const src = read('routes/creditRoutes.ts');
  const authPos = src.indexOf('authenticateUser');
  const scorePos = src.indexOf("'/score'");
  const checkPos = src.indexOf("'/score/check'");

  assert.ok(authPos !== -1, 'authenticateUser must be present');
  assert.ok(authPos < scorePos, 'auth must appear before /score');
  assert.ok(authPos < checkPos, 'auth must appear before /score/check');
});

// ── Auth middleware itself ───────────────────────────────────────────────────

test('auth middleware: requireInternalToken uses timingSafeEqual', () => {
  const src = read('middleware/auth.ts');
  assert.match(src, /timingSafeEqual/, 'must use timing-safe comparison');
  assert.match(src, /createHash/, 'must hash both sides before comparing');
});

test('auth middleware: requireInternalToken fails closed when env var missing', () => {
  const src = read('middleware/auth.ts');
  assert.match(src, /if \(!scopedTokens\)/, 'must fail closed when env var missing');
  assert.match(src, /503|Forbidden|not configured/, 'must return error when not configured');
});

test('auth middleware: supports per-service credentials via INTERNAL_SERVICE_TOKENS_JSON', () => {
  const src = read('middleware/auth.ts');
  assert.match(src, /INTERNAL_SERVICE_TOKENS_JSON/, 'must support per-service credentials');
  assert.match(src, /resolveExpectedInternalToken/, 'must use resolver function');
});
