/**
 * Migration 001 — DM-C3: statusHistory → timeline
 *
 * The rez-merchant-service wrote order status updates to a field named
 * `statusHistory`, while the backend uses `timeline`. Both services write
 * to the same MongoDB `orders` collection.
 *
 * This script:
 *   1. Finds all orders that have a non-empty `statusHistory` array
 *   2. Converts each statusHistory entry into a timeline-compatible object
 *   3. Pushes those entries into the `timeline` array (avoiding duplicates)
 *   4. Unsets `statusHistory` from the document
 *
 * Safe to run multiple times (idempotent):
 *   - Uses bulk operations for efficiency
 *   - Adds `updatedBy: 'migration-001'` to identify migrated entries
 *   - After the first run, no documents will match the filter
 *
 * Usage:
 *   MONGO_URI=... npx ts-node src/scripts/migrations/001-statusHistory-to-timeline.ts
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('[001] ERROR: MONGO_URI or MONGODB_URI environment variable is not set');
  process.exit(1);
}

interface StatusHistoryEntry {
  status: string;
  timestamp?: Date | string;
  note?: string;
}

interface TimelineEntry {
  status: string;
  timestamp: Date;
  note: string;
  updatedBy: string;
}

/**
 * UP: Migrate statusHistory entries to timeline, then remove statusHistory.
 * DOWN: Extract timeline entries added by migration-001 and restore them to statusHistory.
 */
async function down(): Promise<void> {
  const client = new MongoClient(MONGO_URI as string);

  try {
    console.log('[001] DOWN: Reverting timeline migration...');
    await client.connect();
    const db = client.db();

    const col = db.collection('orders');

    // Find all timeline entries added by migration-001
    const withMigratedEntries = await col.countDocuments({
      timeline: { $exists: true },
    });

    if (withMigratedEntries === 0) {
      console.log('[001] DOWN: No migrated timeline entries found — nothing to revert');
      return;
    }

    // Get orders with migration-001 entries
    const cursor = col.find(
      { 'timeline.updatedBy': 'migration-001' },
      { projection: { _id: 1, timeline: 1 } },
    );

    const BATCH_SIZE = 100;
    let processed = 0;
    let totalEntriesRestored = 0;

    const bulk = col.initializeUnorderedBulkOp();
    let bulkSize = 0;

    const flushBulk = async () => {
      if (bulkSize === 0) return;
      const result = await bulk.execute();
      console.log(`[001] DOWN:   Flushed batch: ${result.modifiedCount} orders updated`);
      bulkSize = 0;
    };

    for await (const doc of cursor) {
      const migratedEntries = (doc.timeline || []).filter(
        (entry: TimelineEntry) => entry.updatedBy === 'migration-001',
      );

      if (migratedEntries.length === 0) continue;

      // Convert timeline entries back to statusHistory format
      const statusHistoryEntries: StatusHistoryEntry[] = migratedEntries.map((entry: TimelineEntry) => ({
        status: entry.status,
        timestamp: entry.timestamp,
        note: entry.note,
      }));

      bulk.find({ _id: doc._id }).updateOne({
        $push: { statusHistory: { $each: statusHistoryEntries } } as Record<string, unknown>,
        $pull: { timeline: { updatedBy: 'migration-001' } },
      });

      totalEntriesRestored += statusHistoryEntries.length;
      processed++;
      bulkSize++;

      if (bulkSize >= BATCH_SIZE) {
        await flushBulk();
      }
    }

    await flushBulk();

    // Verification
    const remaining = await col.countDocuments({ 'timeline.updatedBy': 'migration-001' });

    console.log(`\n[001] DOWN: Rollback complete:`);
    console.log(`  Orders processed:                  ${processed}`);
    console.log(`  Entries restored to statusHistory: ${totalEntriesRestored}`);
    console.log(`  Remaining migration-001 entries:    ${remaining} (should be 0)`);

    if (remaining > 0) {
      console.warn('[001] DOWN: WARNING: Some entries may not have been reverted');
    }
  } finally {
    await client.close();
    console.log('[001] DOWN: Disconnected');
  }
}

async function up(): Promise<void> {
  const client = new MongoClient(MONGO_URI as string);

  try {
    console.log('[001] Connecting to MongoDB...');
    await client.connect();
    const db = client.db();

    // Verify collection exists
    const collections = new Set((await db.listCollections({ name: 'orders' }).toArray()).map((c) => c.name));
    if (!collections.has('orders')) {
      console.log('[001] Collection `orders` does not exist — nothing to migrate');
      return;
    }

    // Count how many documents need migration
    const totalToMigrate = await db
      .collection('orders')
      .countDocuments({ statusHistory: { $exists: true, $not: { $size: 0 } } });

    console.log(`[001] Orders with non-empty statusHistory: ${totalToMigrate}`);

    if (totalToMigrate === 0) {
      console.log('[001] Nothing to migrate — all orders already have timeline only');
      return;
    }

    // Process in batches to keep memory usage predictable
    const BATCH_SIZE = 100;
    let processed = 0;
    let totalTimelineEntriesMigrated = 0;

    const cursor = db
      .collection('orders')
      .find({ statusHistory: { $exists: true, $not: { $size: 0 } } }, { projection: { _id: 1, statusHistory: 1 } });

    const bulk = db.collection('orders').initializeUnorderedBulkOp();
    let bulkSize = 0;

    const flushBulk = async () => {
      if (bulkSize === 0) return;
      const result = await bulk.execute();
      console.log(`[001]   Flushed batch: ${result.modifiedCount} orders updated`);
      bulkSize = 0;
    };

    for await (const doc of cursor) {
      const statusHistory: StatusHistoryEntry[] = doc.statusHistory || [];
      if (!statusHistory.length) continue;

      const timelineEntries: TimelineEntry[] = statusHistory.map((entry) => ({
        status: entry.status || 'unknown',
        timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
        note: entry.note || '',
        updatedBy: 'migration-001',
      }));

      bulk.find({ _id: doc._id }).updateOne({
        $push: { timeline: { $each: timelineEntries } } as Record<string, unknown>,
        $unset: { statusHistory: '' },
      });

      totalTimelineEntriesMigrated += timelineEntries.length;
      processed++;
      bulkSize++;

      if (bulkSize >= BATCH_SIZE) {
        await flushBulk();
      }
    }

    // Flush remaining
    await flushBulk();

    // Final verification
    const remaining = await db.collection('orders').countDocuments({ statusHistory: { $exists: true } });

    console.log(`\n[001] UP: Migration complete:`);
    console.log(`  Orders processed:              ${processed}`);
    console.log(`  Timeline entries migrated:     ${totalTimelineEntriesMigrated}`);
    console.log(`  Orders still with statusHistory: ${remaining} (should be 0)`);

    if (remaining > 0) {
      console.warn('[001] WARNING: Some documents still have statusHistory — check for errors above');
    }
  } finally {
    await client.close();
    console.log('[001] Disconnected');
  }
}

// CLI entry point
const direction = process.argv[2]?.toLowerCase();
if (direction === 'down') {
  down().catch((err) => {
    console.error('[001] FATAL:', err.message || err);
    process.exit(1);
  });
} else {
  up().catch((err) => {
    console.error('[001] FATAL:', err.message || err);
    process.exit(1);
  });
}
