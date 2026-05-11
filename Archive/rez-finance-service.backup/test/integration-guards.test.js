const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('finance rewards hook matches the wallet internal credit contract', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'rewardsHookService.ts');
  const source = fs.readFileSync(filePath, 'utf8');

  assert.match(source, /\/internal\/credit/);
  assert.match(source, /coinType: 'rez'/);
  assert.match(source, /idempotencyKey = buildIdempotencyKey\(userId, event, referenceId\)/);
  assert.match(source, /referenceModel: resolveReferenceModel\(event\)/);
});

test('finance credit intelligence uses the current wallet and order summary contracts', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'creditIntelligenceService.ts');
  const source = fs.readFileSync(filePath, 'utf8');

  assert.match(source, /\/internal\/balance\/\$\{userId\}/);
  assert.match(source, /const data = res\.data\?\.data \?\? res\.data \?\? \{\};/);
  assert.match(source, /\/internal\/orders\/summary\/\$\{userId\}/);
  assert.match(source, /const summary = res\.data\?\.data \?\? res\.data;/);
});

test('finance approval stats update partner offers by partnerId', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'loanService.ts');
  const source = fs.readFileSync(filePath, 'utf8');

  assert.match(source, /PartnerOffer\.updateMany\(\{ userId: application\.userId, partnerId: application\.partnerId \}/);
});

test('finance partner webhooks use partner-specific HMAC verification instead of shared internal token auth', () => {
  const routePath = path.join(__dirname, '..', 'src', 'routes', 'partnerRoutes.ts');
  const indexPath = path.join(__dirname, '..', 'src', 'index.ts');
  const routeSource = fs.readFileSync(routePath, 'utf8');
  const indexSource = fs.readFileSync(indexPath, 'utf8');

  assert.doesNotMatch(routeSource, /requireInternalToken/);
  assert.match(routeSource, /createHmac/);
  assert.match(routeSource, /x-partner-signature/);
  assert.match(routeSource, /PARTNER_WEBHOOK_SECRET_/);
  assert.match(indexSource, /req\.originalUrl\??\.startsWith\('\/finance\/partner\/webhook'\)/);
  assert.match(indexSource, /rawBody\?: Buffer/);
});
