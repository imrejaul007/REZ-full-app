/**
 * Migration Runner
 *
 * Supports both up (forward) and down (rollback) migration execution.
 * Manages migration state in a dedicated collection.
 *
 * Usage:
 *   # Run all pending up migrations
 *   npx ts-node src/scripts/migrations/migration-runner.ts
 *
 *   # Run specific migration
 *   npx ts-node src/scripts/migrations/migration-runner.ts --id 002
 *
 *   # Run down migration (rollback)
 *   npx ts-node src/scripts/migrations/migration-runner.ts --down
 *   npx ts-node src/scripts/migrations/migration-runner.ts --id 002 --down
 *
 *   # Rollback last N migrations
 *   npx ts-node src/scripts/migrations/migration-runner.ts --rollback 2
 *
 *   # Show migration status
 *   npx ts-node src/scripts/migrations/migration-runner.ts --status
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('[Runner] ERROR: MONGO_URI or MONGODB_URI environment variable is not set');
  process.exit(1);
}

const MIGRATION_STATE_COLLECTION = 'migration_state';

// Migration registry - maps migration ID to file and metadata
interface MigrationDefinition {
  id: string;
  name: string;
  file: string;
  description: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  reversible: boolean;
}

const MIGRATIONS: MigrationDefinition[] = [
  {
    id: '001',
    name: 'statusHistory-to-timeline',
    file: './001-statusHistory-to-timeline',
    description: 'Migrate order statusHistory to timeline field',
    risk: 'MEDIUM',
    reversible: true,
  },
  {
    id: '002',
    name: 'nuqta-to-rez-cointype',
    file: './002-nuqta-to-rez-cointype',
    description: 'Rename coinType nuqta to rez across collections',
    risk: 'LOW',
    reversible: true,
  },
  {
    id: '003',
    name: 'merchantwallet-merchantid-to-merchant',
    file: './003-merchantwallet-merchantid-to-merchant',
    description: 'Convert merchantId string to merchant ObjectId',
    risk: 'HIGH',
    reversible: true,
  },
  {
    id: '004',
    name: 'notification-read-to-isread',
    file: './004-notification-read-to-isread',
    description: 'Standardize read field to isRead',
    risk: 'LOW',
    reversible: true,
  },
  {
    id: '005',
    name: 'segment-casing-fix',
    file: './005-segment-casing-fix',
    description: 'Fix segment enum casing',
    risk: 'LOW',
    reversible: true,
  },
  {
    id: '006',
    name: 'finance-userid-validate',
    file: './006-finance-userid-validate',
    description: 'Validate finance userId values (read-only)',
    risk: 'LOW',
    reversible: false,
  },
  {
    id: '007',
    name: 'dead-fields-cleanup',
    file: './007-dead-fields-cleanup',
    description: 'Remove dead schema fields',
    risk: 'LOW',
    reversible: true,
  },
  {
    id: '008',
    name: 'remove-user-wallet-subdoc',
    file: './008-remove-user-wallet-subdoc',
    description: 'Remove User.wallet embedded sub-document',
    risk: 'MEDIUM',
    reversible: false,
  },
];

interface MigrationRecord {
  migrationId: string;
  name: string;
  direction: 'up' | 'down';
  appliedAt: Date;
  durationMs: number;
  success: boolean;
  error?: string;
}

async function getStateCollection(db: ReturnType<InstanceType<typeof MongoClient>['db']>) {
  // Ensure indexes
  const col = db.collection(MIGRATION_STATE_COLLECTION);
  await col.createIndex({ migrationId: 1, direction: 1 }, { unique: true });
  await col.createIndex({ appliedAt: 1 });
  return col;
}

async function getLastMigration(db: ReturnType<InstanceType<typeof MongoClient>['db']>): Promise<string | null> {
  const col = await getStateCollection(db);
  const last = await col.findOne(
    { success: true, direction: 'up' },
    { sort: { appliedAt: -1 } },
  );
  return last?.migrationId || null;
}

async function isMigrationApplied(
  db: ReturnType<InstanceType<typeof MongoClient>['db']>,
  migrationId: string,
): Promise<boolean> {
  const col = await getStateCollection(db);
  const record = await col.findOne({ migrationId, direction: 'up', success: true });
  return !!record;
}

async function runMigrationScript(
  migration: MigrationDefinition,
  direction: 'up' | 'down',
): Promise<{ success: boolean; error?: string }> {
  const directionArg = direction === 'down' ? 'down' : '';
  const migrationPath = path.join(__dirname, 'migrations', migration.file);

  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    const isTsNode = process.argv[0].includes('ts-node') || process.argv[1]?.includes('ts-node');

    let command: string;
    let args: string[];

    if (isTsNode || process.env.NODE_ENV === 'development') {
      command = 'npx';
      args = ['ts-node', migrationPath + '.ts', directionArg];
    } else {
      command = 'node';
      args = [migrationPath + '.js', directionArg];
    }

    const proc = spawn(command, args, {
      env: { ...process.env, MONGO_URI },
      stdio: 'inherit',
    });

    proc.on('close', (code: number | null) => {
      if (code === 0) {
        resolve({ success: true });
      } else if (code === 1) {
        resolve({ success: false, error: `Migration exited with code ${code}` });
      } else {
        resolve({ success: false, error: `Migration process terminated with code ${code}` });
      }
    });

    proc.on('error', (err: Error) => {
      resolve({ success: false, error: err.message });
    });

    // Timeout after 10 minutes
    setTimeout(() => {
      proc.kill();
      resolve({ success: false, error: 'Migration timed out after 10 minutes' });
    }, 10 * 60 * 1000);
  });
}

async function recordMigration(
  db: ReturnType<InstanceType<typeof MongoClient>['db']>,
  record: MigrationRecord,
): Promise<void> {
  const col = await getStateCollection(db);
  await col.insertOne(record);
}

async function showStatus(db: ReturnType<InstanceType<typeof MongoClient>['db']>): Promise<void> {
  const col = await getStateCollection(db);

  console.log('\n=== Migration Status ===\n');

  for (const migration of MIGRATIONS) {
    const upRecord = await col.findOne({ migrationId: migration.id, direction: 'up', success: true });
    const downRecord = await col.findOne({ migrationId: migration.id, direction: 'down', success: true });

    let status: string;
    if (upRecord && !downRecord) {
      status = '[APPLIED]';
    } else if (upRecord && downRecord) {
      status = '[ROLLED BACK]';
    } else {
      status = '[PENDING]';
    }

    const reversible = migration.reversible ? '(reversible)' : '(NOT reversible)';

    console.log(`${status} ${migration.id} - ${migration.name}`);
    console.log(`       ${migration.description}`);
    console.log(`       Risk: ${migration.risk} ${reversible}`);

    if (upRecord) {
      console.log(`       Applied: ${upRecord.appliedAt.toISOString()}`);
    }
    if (downRecord) {
      console.log(`       Rolled back: ${downRecord.appliedAt.toISOString()}`);
    }
    console.log('');
  }
}

async function run(): Promise<void> {
  const client = new MongoClient(MONGO_URI as string);

  try {
    await client.connect();
    const db = client.db();

    // Parse CLI arguments
    const args = process.argv.slice(2);
    const isDown = args.includes('--down') || args.includes('down');
    const isStatus = args.includes('--status');
    const rollbackArg = args.find((a) => a.startsWith('--rollback='));
    const idArg = args.find((a) => a.startsWith('--id='));

    if (isStatus) {
      await showStatus(db);
      return;
    }

    const direction: 'up' | 'down' = isDown ? 'down' : 'up';

    if (rollbackArg) {
      const count = parseInt(rollbackArg.split('=')[1], 10);
      if (isNaN(count) || count < 1) {
        console.error('[Runner] ERROR: Invalid rollback count');
        process.exit(1);
      }
      await rollbackLastN(db, count);
      return;
    }

    if (idArg) {
      const migrationId = idArg.split('=')[1];
      await runSpecificMigration(db, migrationId, direction);
      return;
    }

    // Run all migrations in order
    if (direction === 'up') {
      await runAllUp(db);
    } else {
      await rollbackLastN(db, 1);
    }
  } finally {
    await client.close();
  }
}

async function runAllUp(db: ReturnType<InstanceType<typeof MongoClient>['db']>): Promise<void> {
  const lastApplied = await getLastMigration(db);

  console.log(`\n=== Running Up Migrations ===\n`);

  let startIndex = 0;
  if (lastApplied) {
    const lastIndex = MIGRATIONS.findIndex((m) => m.id === lastApplied);
    if (lastIndex >= 0) {
      startIndex = lastIndex + 1;
      console.log(`Last applied migration: ${lastApplied} (${MIGRATIONS[lastIndex]?.name})`);
      console.log(`Starting from: ${MIGRATIONS[startIndex]?.id || 'none'} (all migrations complete)\n`);
    }
  }

  for (let i = startIndex; i < MIGRATIONS.length; i++) {
    const migration = MIGRATIONS[i];

    if (await isMigrationApplied(db, migration.id)) {
      console.log(`[${migration.id}] SKIP: Already applied`);
      continue;
    }

    console.log(`\n[${migration.id}] RUNNING: ${migration.name}`);
    console.log(`       ${migration.description}`);
    console.log(`       Risk: ${migration.risk}`);

    const startTime = Date.now();
    const result = await runMigrationScript(migration, 'up');
    const durationMs = Date.now() - startTime;

    await recordMigration(db, {
      migrationId: migration.id,
      name: migration.name,
      direction: 'up',
      appliedAt: new Date(),
      durationMs,
      success: result.success,
      error: result.error,
    });

    if (!result.success) {
      console.error(`\n[${migration.id}] FAILED: ${result.error}`);
      console.error('Stopping migration sequence. Run with --down to rollback.');
      process.exit(1);
    }

    console.log(`\n[${migration.id}] SUCCESS (${durationMs}ms)`);
  }

  console.log('\n=== All migrations complete ===\n');
}

async function runSpecificMigration(
  db: ReturnType<InstanceType<typeof MongoClient>['db']>,
  migrationId: string,
  direction: 'up' | 'down',
): Promise<void> {
  const migration = MIGRATIONS.find((m) => m.id === migrationId);

  if (!migration) {
    console.error(`[Runner] ERROR: Unknown migration ${migrationId}`);
    console.error(`Available: ${MIGRATIONS.map((m) => m.id).join(', ')}`);
    process.exit(1);
  }

  if (direction === 'down' && !migration.reversible) {
    console.error(`[Runner] ERROR: Migration ${migrationId} is NOT reversible`);
    console.error(`       ${migration.description}`);
    process.exit(1);
  }

  console.log(`\n=== Running Migration ${migration.id} (${direction}) ===\n`);

  const startTime = Date.now();
  const result = await runMigrationScript(migration, direction);
  const durationMs = Date.now() - startTime;

  await recordMigration(db, {
    migrationId: migration.id,
    name: migration.name,
    direction,
    appliedAt: new Date(),
    durationMs,
    success: result.success,
    error: result.error,
  });

  if (!result.success) {
    console.error(`\n[${migration.id}] FAILED: ${result.error}`);
    process.exit(1);
  }

  console.log(`\n[${migration.id}] SUCCESS (${durationMs}ms)\n`);
}

async function rollbackLastN(
  db: ReturnType<InstanceType<typeof MongoClient>['db']>,
  count: number,
): Promise<void> {
  const col = await getStateCollection(db);

  // Get the last N successful up migrations in reverse order
  const appliedMigrations = await col
    .find({ direction: 'up', success: true })
    .sort({ appliedAt: -1 })
    .limit(count)
    .toArray();

  if (appliedMigrations.length === 0) {
    console.log('\n[Runner] No migrations to rollback.\n');
    return;
  }

  console.log(`\n=== Rolling Back ${appliedMigrations.length} Migration(s) ===\n`);

  for (const applied of appliedMigrations) {
    const migration = MIGRATIONS.find((m) => m.id === applied.migrationId);

    if (!migration) {
      console.warn(`[Runner] WARNING: Migration ${applied.migrationId} not found in registry`);
      continue;
    }

    if (!migration.reversible) {
      console.error(`\n[Runner] ERROR: Migration ${applied.migrationId} is NOT reversible`);
      console.error(`       ${migration.description}`);
      console.error('       Skipping. Manual intervention required.');
      continue;
    }

    console.log(`\n[${migration.id}] ROLLING BACK: ${migration.name}`);
    console.log(`       Originally applied: ${applied.appliedAt.toISOString()}`);

    const startTime = Date.now();
    const result = await runMigrationScript(migration, 'down');
    const durationMs = Date.now() - startTime;

    await recordMigration(db, {
      migrationId: migration.id,
      name: migration.name,
      direction: 'down',
      appliedAt: new Date(),
      durationMs,
      success: result.success,
      error: result.error,
    });

    if (!result.success) {
      console.error(`\n[${migration.id}] ROLLBACK FAILED: ${result.error}`);
      console.error('Manual intervention required.');
      process.exit(1);
    }

    console.log(`\n[${migration.id}] ROLLED BACK (${durationMs}ms)`);
  }

  console.log('\n=== Rollback Complete ===\n');
}

run().catch((err) => {
  console.error('[Runner] FATAL:', err.message || err);
  process.exit(1);
});
