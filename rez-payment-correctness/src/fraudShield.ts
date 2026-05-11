/**
 * REZ Fraud Shield - Velocity checks, device fingerprinting, abuse prevention
 * Simple rules-based fraud detection for initial launch.
 */

export interface FraudShieldConfig {
  maxTransactionsPerHour: number;
  maxTransactionsPerDay: number;
  maxCashbackPerDay: number;
  maxCashbackPerTransaction: number;
  minPhoneVerification: boolean;
  requireDeviceFingerprint: boolean;
  suspiciousIPThreshold: number;
  blockVelocityBurst: boolean;
  blockSameDeviceAccounts: boolean;
  enableIPTracking: boolean;
}

export const FRAUD_CONFIG: FraudShieldConfig = {
  maxTransactionsPerHour: 10,
  maxTransactionsPerDay: 50,
  maxCashbackPerDay: 5000,
  maxCashbackPerTransaction: 500,
  minPhoneVerification: true,
  requireDeviceFingerprint: true,
  suspiciousIPThreshold: 3,
  blockVelocityBurst: true,
  blockSameDeviceAccounts: true,
  enableIPTracking: true,
};

export interface FraudCheck {
  passed: boolean;
  reason?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface UserRisk {
  userId: string;
  transactionsToday: number;
  transactionsThisHour: number;
  cashbackToday: number;
  ipAddresses: Set<string>;
  deviceFingerprints: Set<string>;
  phoneVerified: boolean;
  accounts: number;
  riskScore: number;
  blocked: boolean;
  blockedReason?: string;
}

export class FraudShield {
  private userRisks: Map<string, UserRisk> = new Map();
  private ipTracking: Map<string, Set<string>> = new Map();
  private deviceTracking: Map<string, Set<string>> = new Map();
  private transactionTimestamps: Map<string, number[]> = new Map();
  private cashbackHistory: Map<string, { amount: number; timestamp: number }[]> = new Map();

  check(params: {
    userId: string;
    amount: number;
    cashbackAmount?: number;
    phone?: string;
    ip?: string;
    deviceFingerprint?: string;
    transactionType: string;
  }): FraudCheck {
    const { userId, amount, cashbackAmount = 0, phone, ip, deviceFingerprint, transactionType } = params;
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;

    // 1. Phone verification
    if (FRAUD_CONFIG.minPhoneVerification && !phone) {
      return {
        passed: false,
        reason: 'PHONE_NOT_VERIFIED',
        severity: 'CRITICAL',
      };
    }

    // 2. Device fingerprint required
    if (FRAUD_CONFIG.requireDeviceFingerprint && !deviceFingerprint) {
      return {
        passed: false,
        reason: 'DEVICE_FINGERPRINT_REQUIRED',
        severity: 'HIGH',
      };
    }

    // 3. Get/create user risk profile
    let risk = this.userRisks.get(userId);
    if (!risk) {
      risk = this.createUserRisk(userId);
      this.userRisks.set(userId, risk);
    }

    // 4. Check transactions per hour
    const hourTimestamps = this.transactionTimestamps.get(userId) || [];
    const recentHourTx = hourTimestamps.filter(t => t > oneHourAgo);

    if (recentHourTx.length >= FRAUD_CONFIG.maxTransactionsPerHour) {
      return {
        passed: false,
        reason: 'VELOCITY_HOUR_EXCEEDED',
        severity: 'CRITICAL',
      };
    }

    // 5. Check transactions per day
    const dayTimestamps = this.transactionTimestamps.get(userId) || [];
    const recentDayTx = dayTimestamps.filter(t => t > oneDayAgo);

    if (recentDayTx.length >= FRAUD_CONFIG.maxTransactionsPerDay) {
      return {
        passed: false,
        reason: 'VELOCITY_DAY_EXCEEDED',
        severity: 'CRITICAL',
      };
    }

    // 6. Check cashback limits
    const cashbackToday = this.getCashbackToday(userId);

    if (cashbackToday + (cashbackAmount || 0) > FRAUD_CONFIG.maxCashbackPerDay) {
      return {
        passed: false,
        reason: 'CASHBACK_DAY_LIMIT_EXCEEDED',
        severity: 'HIGH',
      };
    }

    if ((cashbackAmount || 0) > FRAUD_CONFIG.maxCashbackPerTransaction) {
      return {
        passed: false,
        reason: 'CASHBACK_TRANSACTION_LIMIT_EXCEEDED',
        severity: 'HIGH',
      };
    }

    // 7. IP-based fraud detection
    if (ip && FRAUD_CONFIG.enableIPTracking) {
      const usersOnIP = this.ipTracking.get(ip) || new Set();
      if (usersOnIP.size >= FRAUD_CONFIG.suspiciousIPThreshold) {
        return {
          passed: false,
          reason: 'SUSPICIOUS_IP_CLUSTER',
          severity: 'CRITICAL',
        };
      }
      usersOnIP.add(userId);
      this.ipTracking.set(ip, usersOnIP);
    }

    // 8. Device fingerprinting
    if (deviceFingerprint && FRAUD_CONFIG.blockSameDeviceAccounts) {
      const usersOnDevice = this.deviceTracking.get(deviceFingerprint) || new Set();
      if (usersOnDevice.size >= 2) {
        return {
          passed: false,
          reason: 'MULTIPLE_ACCOUNTS_SAME_DEVICE',
          severity: 'CRITICAL',
        };
      }
      usersOnDevice.add(userId);
      this.deviceTracking.set(deviceFingerprint, usersOnDevice);
    }

    // 9. Velocity burst detection
    if (FRAUD_CONFIG.blockVelocityBurst) {
      if (recentHourTx.length >= 5) {
        const burst = recentHourTx.every(t => t > now - 60000);
        if (burst) {
          return {
            passed: false,
            reason: 'VELOCITY_BURST_DETECTED',
            severity: 'HIGH',
          };
        }
      }
    }

    return { passed: true, severity: 'LOW' };
  }

  private createUserRisk(userId: string): UserRisk {
    return {
      userId,
      transactionsToday: 0,
      transactionsThisHour: 0,
      cashbackToday: 0,
      ipAddresses: new Set(),
      deviceFingerprints: new Set(),
      phoneVerified: false,
      accounts: 0,
      riskScore: 0,
      blocked: false,
    };
  }

  private getCashbackToday(userId: string): number {
    const history = this.cashbackHistory.get(userId) || [];
    const oneDayAgo = Date.now() - 86400000;
    return history
      .filter(e => e.timestamp > oneDayAgo)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  recordTransaction(params: {
    userId: string;
    cashbackAmount?: number;
    ip?: string;
    deviceFingerprint?: string;
    phone?: string;
  }): void {
    const { userId, cashbackAmount = 0, ip, deviceFingerprint, phone } = params;
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;

    let risk = this.userRisks.get(userId);
    if (!risk) {
      risk = this.createUserRisk(userId);
      this.userRisks.set(userId, risk);
    }

    // Record transaction timestamp
    const timestamps = this.transactionTimestamps.get(userId) || [];
    timestamps.push(now);
    this.transactionTimestamps.set(userId, timestamps.filter(t => t > oneHourAgo));

    // Record cashback
    if (cashbackAmount > 0) {
      const cashbackHist = this.cashbackHistory.get(userId) || [];
      cashbackHist.push({ amount: cashbackAmount, timestamp: now });
      this.cashbackHistory.set(userId, cashbackHist.filter(e => e.timestamp > oneDayAgo));
    }

    // Track IP
    if (ip) risk.ipAddresses.add(ip);
    if (deviceFingerprint) risk.deviceFingerprints.add(deviceFingerprint);
    if (phone) risk.phoneVerified = true;
  }

  getUserRisk(userId: string): UserRisk | undefined {
    return this.userRisks.get(userId);
  }

  getAllRisks(): UserRisk[] {
    return Array.from(this.userRisks.values());
  }

  getBlockedUsers(): UserRisk[] {
    return Array.from(this.userRisks.values()).filter(r => r.blocked);
  }

  blockUser(userId: string, reason: string): void {
    const risk = this.userRisks.get(userId);
    if (risk) {
      risk.blocked = true;
      risk.blockedReason = reason;
      risk.riskScore = 100;
    }
  }

  unblockUser(userId: string): void {
    const risk = this.userRisks.get(userId);
    if (risk) {
      risk.blocked = false;
      risk.blockedReason = undefined;
      risk.riskScore = 0;
    }
  }
}

export const fraudShield = new FraudShield();
export default fraudShield;
