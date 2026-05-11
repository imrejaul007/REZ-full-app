/**
 * Data Retention Cron Jobs
 * Scheduled cleanup for DPDP compliance
 */

import mongoose from 'mongoose';
import { getRetentionCutoff, RETENTION_CONFIG } from '../services/retentionService';

interface RetentionResult {
  collection: string;
  deleted: number;
  errors: string[];
}

/**
 * Generic collection cleanup
 */
async function cleanupCollection(
  collectionName: string,
  cutoffDate: Date,
  dateField: string = 'createdAt'
): Promise<RetentionResult> {
  const result: RetentionResult = {
    collection: collectionName,
    deleted: 0,
    errors: []
  };

  try {
    const collection = mongoose.connection.collection(collectionName);

    // Check if collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (!collections.find(c => c.name === collectionName)) {
      console.log(`Collection ${collectionName} does not exist, skipping`);
      return result;
    }

    // Build query for old records
    const query: Record<string, any> = {};
    query[dateField] = { $lt: cutoffDate };

    // Get count before deletion
    const count = await collection.countDocuments(query);
    result.deleted = count;

    if (count > 0) {
      // Perform soft delete or hard delete based on config
      const deleteResult = await collection.deleteMany(query);
      result.deleted = deleteResult.deletedCount;
      console.log(`Deleted ${deleteResult.deletedCount} old records from ${collectionName}`);
    }
  } catch (error) {
    result.errors.push(String(error));
    console.error(`Error cleaning ${collectionName}:`, error);
  }

  return result;
}

/**
 * Anonymize user data for inactive accounts
 */
async function anonymizeInactiveUsers(months: number): Promise<{ anonymized: number; errors: string[] }> {
  const result = { anonymized: 0, errors: [] as string[] };

  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    // Find users last active before cutoff
    const usersCollection = mongoose.connection.collection('users');
    const query = {
      lastActiveAt: { $lt: cutoffDate },
      isAnonymized: { $ne: true }
    };

    const users = await usersCollection.find(query).limit(1000).toArray();

    for (const user of users) {
      try {
        // Anonymize PII
        const anonymizedData = {
          phone: null,
          email: null,
          name: 'Anonymized User',
          profileImage: null,
          address: null,
          location: null,
          deviceId: null,
          isAnonymized: true,
          anonymizedAt: new Date(),
          originalUserId: user._id // Keep reference for legal requirements
        };

        await usersCollection.updateOne(
          { _id: user._id },
          { $set: anonymizedData }
        );
        result.anonymized++;
      } catch (error) {
        result.errors.push(`Failed to anonymize user ${user._id}: ${error}`);
      }
    }

    console.log(`Anonymized ${result.anonymized} inactive users`);
  } catch (error) {
    result.errors.push(String(error));
    console.error('Error in user anonymization:', error);
  }

  return result;
}

/**
 * Clean up intent signals (90 days)
 */
export async function cleanupIntentSignals(): Promise<RetentionResult[]> {
  console.log('Starting intent signals cleanup...');
  const cutoff = getRetentionCutoff('intentSignals');

  const results: RetentionResult[] = [];

  // Cleanup multiple collections that store intent data
  const collections = ['intentsignals', 'intent_signals', 'signals', 'events'];

  for (const collection of collections) {
    const result = await cleanupCollection(collection, cutoff, 'capturedAt');
    if (result.deleted > 0) {
      results.push(result);
    }
  }

  console.log(`Intent signals cleanup complete: ${results.length} collections processed`);
  return results;
}

/**
 * Clean up analytics events (90 days)
 */
export async function cleanupAnalytics(): Promise<RetentionResult[]> {
  console.log('Starting analytics cleanup...');
  const cutoff = getRetentionCutoff('analyticsEvents');

  const results: RetentionResult[] = [];
  const collections = ['analytics', 'pageviews', 'clicks', 'events'];

  for (const collection of collections) {
    const result = await cleanupCollection(collection, cutoff);
    if (result.deleted > 0) {
      results.push(result);
    }
  }

  console.log(`Analytics cleanup complete: ${results.length} collections processed`);
  return results;
}

/**
 * Clean up session data (7 days)
 */
export async function cleanupSessions(): Promise<RetentionResult[]> {
  console.log('Starting session cleanup...');
  const cutoff = getRetentionCutoff('sessionData');

  const results: RetentionResult[] = [];
  const collections = ['sessions', 'session_data', 'user_sessions'];

  for (const collection of collections) {
    const result = await cleanupCollection(collection, cutoff, 'expiresAt');
    if (result.deleted > 0) {
      results.push(result);
    }
  }

  console.log(`Session cleanup complete: ${results.length} collections processed`);
  return results;
}

/**
 * Clean up chat logs (30 days)
 */
export async function cleanupChatLogs(): Promise<RetentionResult[]> {
  console.log('Starting chat logs cleanup...');
  const cutoff = getRetentionCutoff('chatLogs');

  const results: RetentionResult[] = [];
  const collections = ['chatlogs', 'chat_logs', 'conversations', 'messages'];

  for (const collection of collections) {
    const result = await cleanupCollection(collection, cutoff);
    if (result.deleted > 0) {
      results.push(result);
    }
  }

  console.log(`Chat logs cleanup complete: ${results.length} collections processed`);
  return results;
}

/**
 * Clean up IP logs (30 days) - sensitive data
 */
export async function cleanupIpLogs(): Promise<RetentionResult[]> {
  console.log('Starting IP logs cleanup...');
  const cutoff = getRetentionCutoff('ipLogs');

  const results: RetentionResult[] = [];
  const collections = ['iplogs', 'ip_logs', 'access_logs', 'request_logs'];

  for (const collection of collections) {
    const result = await cleanupCollection(collection, cutoff);
    if (result.deleted > 0) {
      results.push(result);
    }
  }

  console.log(`IP logs cleanup complete: ${results.length} collections processed`);
  return results;
}

/**
 * Anonymize inactive users (24 months)
 */
export async function anonymizeInactiveUsersJob(): Promise<{ anonymized: number; errors: string[] }> {
  console.log('Starting inactive user anonymization...');
  const result = await anonymizeInactiveUsers(24);
  console.log(`User anonymization complete: ${result.anonymized} users processed`);
  return result;
}

/**
 * Run all retention jobs
 */
export async function runAllRetentionJobs(): Promise<{
  intentSignals: RetentionResult[];
  analytics: RetentionResult[];
  sessions: RetentionResult[];
  chatLogs: RetentionResult[];
  ipLogs: RetentionResult[];
  inactiveUsers: { anonymized: number; errors: string[] };
}> {
  console.log('Starting data retention jobs...');

  const results = {
    intentSignals: await cleanupIntentSignals(),
    analytics: await cleanupAnalytics(),
    sessions: await cleanupSessions(),
    chatLogs: await cleanupChatLogs(),
    ipLogs: await cleanupIpLogs(),
    inactiveUsers: await anonymizeInactiveUsersJob()
  };

  console.log('Data retention jobs complete');
  return results;
}
