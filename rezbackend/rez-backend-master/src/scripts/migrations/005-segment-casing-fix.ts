/**
 * Migration 005 — DM-M3: User.segment enum casing normalization
 *
 * The User model's `segment` field has 'verified_differentlyAbled'
 * (camelCase mid-word) while all other values use snake_case:
 *   verified_student, verified_employee, verified_senior, etc.
 *
 * This is a single-value rename:
 *   'verified_differentlyAbled' → 'verified_differently_abled'
 *
 * Idempotent: after the first run, no documents match the old value.
 *
 * Usage:
 *   MONGO_URI=... npx ts-node src/scripts/migrations/005-segment-casing-fix.ts [up|down]
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('[005] ERROR: MONGO_URI or MONGODB_URI environment variable is not set');
  process.exit(1);
}

const OLD_VALUE = 'verified_differentlyAbled';
const NEW_VALUE = 'verified_differently_abled';

async function down(): Promise<void> {
  const client = new MongoClient(MONGO_URI as string);

  try {
    console.log('[005] DOWN: Reverting segment value...');
    await client.connect();
    const db = client.db();

    const exists = (await db.listCollections({ name: 'users' }).toArray()).length > 0;
    if (!exists) {
      console.log('[005] Collection `users` does not exist — nothing to revert');
      return;
    }

    const col = db.collection('users');

    const countBefore = await col.countDocuments({ segment: NEW_VALUE });
    console.log(`[005] DOWN: Users with segment='${NEW_VALUE}': ${countBefore}`);

    if (countBefore === 0) {
      console.log('[005] DOWN: No documents to revert — already at original value');
      return;
    }

    const result = await col.updateMany({ segment: NEW_VALUE }, { $set: { segment: OLD_VALUE } });

    console.log(`[005] DOWN: Reverted: ${result.modifiedCount} documents`);

    // Verification
    const countAfter = await col.countDocuments({ segment: OLD_VALUE });
    console.log(`\n[005] DOWN: Rollback complete:`);
    console.log(`  Docs now with '${OLD_VALUE}': ${countAfter}`);
  } finally {
    await client.close();
    console.log('[005] DOWN: Disconnected');
  }
}

async function up(): Promise<void> {
  const client = new MongoClient(MONGO_URI as string);

  try {
    console.log('[005] Connecting to MongoDB...');
    await client.connect();
    const db = client.db();

    const exists = (await db.listCollections({ name: 'users' }).toArray()).length > 0;
    if (!exists) {
      console.log('[005] Collection `users` does not exist — nothing to migrate');
      return;
    }

    const col = db.collection('users');

    const countBefore = await col.countDocuments({ segment: OLD_VALUE });
    console.log(`[005] Users with segment='${OLD_VALUE}': ${countBefore}`);

    if (countBefore === 0) {
      console.log('[005] No documents to update — already migrated or value never existed');
      return;
    }

    const result = await col.updateMany({ segment: OLD_VALUE }, { $set: { segment: NEW_VALUE } });

    console.log(`[005] Updated: ${result.modifiedCount} documents`);

    // Verification
    const countAfterOld = await col.countDocuments({ segment: OLD_VALUE });
    const countAfterNew = await col.countDocuments({ segment: NEW_VALUE });

    console.log(`\n[005] UP: Migration complete:`);
    console.log(`  Docs still with '${OLD_VALUE}': ${countAfterOld} (should be 0)`);
    console.log(`  Docs now with '${NEW_VALUE}':  ${countAfterNew}`);

    if (countAfterOld > 0) {
      console.warn('[005] WARNING: Old segment value still present — migration incomplete');
    }

    console.log('\n[005] Post-migration action required:');
    console.log(`  Update User.ts segment enum: replace '${OLD_VALUE}' with '${NEW_VALUE}'`);
    console.log('  File: rezbackend/rez-backend-master/src/models/User.ts, line ~743');
  } finally {
    await client.close();
    console.log('[005] Disconnected');
  }
}

// CLI entry point
const direction = process.argv[2]?.toLowerCase();
if (direction === 'down') {
  down().catch((err) => {
    console.error('[005] FATAL:', err.message || err);
    process.exit(1);
  });
} else {
  up().catch((err) => {
    console.error('[005] FATAL:', err.message || err);
    process.exit(1);
  });
}
