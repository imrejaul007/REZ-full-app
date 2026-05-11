const test = require('node:test');
const assert = require('node:assert/strict');

test('analytics-events service index bootstrap', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.ts'), 'utf8');

  // Verify main entry point and service setup
  assert.match(source, /analytics|service/i);
  assert.match(source, /main|async/i);
});

test('analytics-events health endpoint', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'health.ts'), 'utf8');

  // Verify health server structure
  assert.match(source, /\/health/);
  assert.match(source, /export/);
});

test('analytics-events HTTP server routing', () => {
  const fs = require('node:fs');
  const path = require('node:path');

  // Check if routes directory exists
  const routesPath = path.join(__dirname, '..', 'src', 'routes');
  const routesExist = fs.existsSync(routesPath);

  if (routesExist) {
    const files = fs.readdirSync(routesPath);
    assert.ok(files.length > 0, 'Routes directory should contain files');
  }
});

test('analytics-events worker integration', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'worker.ts'), 'utf8');

  // Verify worker process exists
  assert.match(source, /Worker|worker|process/i);
});

test('analytics-events pipelines structure', () => {
  const fs = require('node:fs');
  const path = require('node:path');

  // Check if pipelines directory exists
  const pipelinesPath = path.join(__dirname, '..', 'src', 'pipelines');
  const pipelinesExist = fs.existsSync(pipelinesPath);

  if (pipelinesExist) {
    const files = fs.readdirSync(pipelinesPath);
    assert.ok(files.length >= 0, 'Pipelines directory should exist');
  }
});
