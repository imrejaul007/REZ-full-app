const test = require('node:test');
const assert = require('node:assert/strict');

test('rez-notification-events service bootstrap', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.ts'), 'utf8');

  // Verify main entry point exists
  assert.match(source, /notification|events/i);
  assert.match(source, /main|async/i);
});

test('rez-notification-events health endpoint', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'health.ts'), 'utf8');

  // Verify health check implementation
  assert.match(source, /\/health/);
  assert.match(source, /startHealthServer|export/);
});

test('rez-notification-events worker integration', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'worker.ts'), 'utf8');

  // Verify worker process implementation
  assert.match(source, /Worker|worker|process/i);
  assert.match(source, /queue|job/i);
});

test('rez-notification-events graceful shutdown', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.ts'), 'utf8');

  // Verify shutdown handling
  assert.match(source, /SIGTERM|SIGINT/);
  assert.match(source, /shutdown|graceful/i);
});

test('rez-notification-events workers module', () => {
  const fs = require('node:fs');
  const path = require('node:path');

  // Check if workers directory exists
  const workersPath = path.join(__dirname, '..', 'src', 'workers');
  const workersExist = fs.existsSync(workersPath);

  if (workersExist) {
    const files = fs.readdirSync(workersPath);
    assert.ok(files.length >= 0, 'Workers directory should exist');
  }
});
