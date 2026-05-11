// @ts-nocheck
import mongoose from 'mongoose';
import { logger } from './logger';
import { metrics } from '../services/MetricsService';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertConfig {
  name: string;
  condition: () => boolean | Promise<boolean>;
  message: string;
  severity: AlertSeverity;
  cooldown?: number; // Minimum time between alerts (in seconds)
}

// Track when alerts were last fired
const lastAlertTime: Map<string, number> = new Map();

// Suppress alerts during graceful shutdown — prevents false-positive memory/DB
// alerts firing from a stale sample after SIGTERM has already been received.
let isShuttingDown = false;
export function markShuttingDown(): void {
  isShuttingDown = true;
}

const alerts: AlertConfig[] = [
  {
    name: 'High Error Rate',
    condition: () => {
      // Check if error rate > 1% in last 5 minutes
      const errorMetrics = metrics.getSummary('errors');
      const requestMetrics = metrics.getSummary('requests');

      if (!errorMetrics || !requestMetrics) return false;

      const errorRate = errorMetrics.count / requestMetrics.count;
      return errorRate > 0.01;
    },
    message: 'Error rate exceeds 1% threshold',
    severity: 'high',
    cooldown: 300, // 5 minutes
  },
  {
    name: 'High Response Time',
    condition: () => {
      // Check if p95 response time > 500ms
      const responseTime = metrics.getSummary('http_request_duration');
      if (!responseTime) return false;

      return responseTime.p95 > 500;
    },
    message: 'Response time p95 exceeds 500ms',
    severity: 'medium',
    cooldown: 300,
  },
  {
    name: 'Database Connection Lost',
    condition: () => {
      return mongoose.connection.readyState !== 1;
    },
    message: 'Database connection is not active',
    severity: 'critical',
    cooldown: 60, // 1 minute
  },
  {
    name: 'High Memory Usage',
    condition: () => {
      const memUsage = process.memoryUsage();
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      return heapUsedPercent > 90;
    },
    message: 'Memory usage exceeds 90%',
    severity: 'high',
    cooldown: 300,
  },
  {
    name: 'High CPU Usage',
    condition: () => {
      // Placeholder: in production, use a proper CPU monitoring library
      // process.cpuUsage() returns cumulative CPU time, not current usage %
      return false;
    },
    message: 'CPU usage is high',
    severity: 'medium',
    cooldown: 300,
  },
  {
    name: 'Slow Database Queries',
    condition: () => {
      const dbMetrics = metrics.getSummary('db_query_duration');
      if (!dbMetrics) return false;

      return dbMetrics.p95 > 1000; // 1 second
    },
    message: 'Database queries are slow (p95 > 1s)',
    severity: 'medium',
    cooldown: 300,
  },
];

// Check if alert should fire (respecting cooldown)
function shouldFireAlert(alert: AlertConfig): boolean {
  const now = Date.now();
  const lastFired = lastAlertTime.get(alert.name);

  if (!lastFired) return true;

  const cooldown = (alert.cooldown || 300) * 1000; // Convert to milliseconds
  return now - lastFired > cooldown;
}

// Send alert notification
async function sendAlert(alert: AlertConfig) {
  logger.error(`ALERT: ${alert.name}`, {
    message: alert.message,
    severity: alert.severity,
    timestamp: new Date().toISOString(),
  });

  // Update last alert time
  lastAlertTime.set(alert.name, Date.now());

  // Send notifications based on severity
  switch (alert.severity) {
    case 'critical':
      await sendPagerDutyAlert(alert);
      await sendSlackAlert(alert);
      await sendEmailAlert(alert);
      break;
    case 'high':
      await sendSlackAlert(alert);
      await sendEmailAlert(alert);
      break;
    case 'medium':
      await sendSlackAlert(alert);
      break;
    case 'low':
      // Just log, no external notifications
      break;
  }
}

// Send PagerDuty alert (implement based on your setup)
async function sendPagerDutyAlert(alert: AlertConfig) {
  // Implement PagerDuty integration
  logger.info('PagerDuty alert sent', { alert: alert.name });
}

// Send Slack alert (implement based on your setup)
async function sendSlackAlert(alert: AlertConfig) {
  // Implement Slack webhook integration
  logger.info('Slack alert sent', { alert: alert.name });
}

// Send email alert (implement based on your setup)
async function sendEmailAlert(alert: AlertConfig) {
  // Implement email notification
  logger.info('Email alert sent', { alert: alert.name });
}

// Check all alerts
export async function checkAlerts() {
  if (isShuttingDown) return;

  for (const alert of alerts) {
    try {
      const shouldAlert = await alert.condition();

      if (shouldAlert && shouldFireAlert(alert)) {
        await sendAlert(alert);
      }
    } catch (error: any) {
      logger.error(`Error checking alert: ${alert.name}`, {
        error: error.message,
      });
    }
  }
}

// Add custom alert
export function addAlert(alert: AlertConfig) {
  alerts.push(alert);
}

// Remove alert by name
export function removeAlert(name: string) {
  const index = alerts.findIndex((a) => a.name === name);
  if (index !== -1) {
    alerts.splice(index, 1);
  }
}

// Get all alerts
export function getAlerts(): AlertConfig[] {
  return [...alerts];
}

// Start alert monitoring (check every minute)
let alertInterval: NodeJS.Timeout | null = null;

export function startAlertMonitoring() {
  if (alertInterval) return;

  alertInterval = setInterval(async () => {
    await checkAlerts();
  }, 60 * 1000); // Check every minute

  logger.info('Alert monitoring started');
}

export function stopAlertMonitoring() {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
    logger.info('Alert monitoring stopped');
  }
}

// ── Financial Alert Functions ────────────────────────────────────────────────
// These are called from reconciliation jobs, queue failure handlers,
// and cashback violation detection.

/**
 * Alert for critical wallet balance drift.
 * Called from walletLedgerReconciliationJob when drift > CRITICAL_THRESHOLD.
 */
export async function alertCriticalWalletDrift(
  userId: string,
  expected: number,
  actual: number,
  drift: number,
): Promise<void> {
  const message = [
    'CRITICAL WALLET DRIFT DETECTED',
    `User: ${userId}`,
    `Expected balance: ${expected} NC`,
    `Actual balance: ${actual} NC`,
    `Drift: ${drift} NC`,
    `Time: ${new Date().toISOString()}`,
    'ACTION REQUIRED: Wallet locked pending manual review',
  ].join('\n');

  logger.error('[FINANCIAL ALERT] Critical wallet drift', { userId, expected, actual, drift });

  // Send to Slack ops channel if SLACK_OPS_WEBHOOK_URL is set
  const slackUrl = process.env.SLACK_OPS_WEBHOOK_URL;
  if (slackUrl) {
    try {
      await fetch(slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          username: 'REZ FinOps Alert',
          icon_emoji: ':rotating_light:',
        }),
      });
    } catch (err: any) {
      logger.error('[ALERT] Failed to send Slack alert', { error: err.message });
    }
  }
}

/**
 * Alert when a payment BullMQ job permanently fails after all retries.
 */
export async function alertPaymentJobFailed(
  jobId: string,
  jobName: string,
  failedReason: string,
  jobData: Record<string, any>,
): Promise<void> {
  logger.error('[FINANCIAL ALERT] Payment job permanently failed', {
    jobId,
    jobName,
    failedReason,
    jobData,
  });

  const slackUrl = process.env.SLACK_OPS_WEBHOOK_URL;
  if (slackUrl) {
    try {
      await fetch(slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `PAYMENT JOB FAILED: ${jobName} (${jobId})\nReason: ${failedReason}`,
          username: 'REZ FinOps Alert',
        }),
      });
    } catch {
      /* best effort */
    }
  }
}

/**
 * Alert when cashback daily cap Redis check is bypassed (Redis unavailable).
 * Called when fail-open path is taken in cashbackService.
 */
export async function alertCashbackCapBypassed(userId: string, amount: number): Promise<void> {
  logger.warn('[SECURITY ALERT] Cashback cap check bypassed — Redis unavailable', {
    userId,
    amount,
  });
  // In production, fire to security channel
}

/**
 * Alert on webhook signature failures (potential attack).
 */
export async function alertWebhookSignatureFailure(ip: string, endpoint: string): Promise<void> {
  logger.warn('[SECURITY ALERT] Webhook signature validation failed', { ip, endpoint });
}
