"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRAUD_DECISIONS = exports.FRAUD_RULES = void 0;
exports.getFraudDecision = getFraudDecision;
exports.getSeverityFromScore = getSeverityFromScore;
exports.FRAUD_RULES = {
    VELOCITY: {
        id: 'VELOCITY',
        name: 'Scan Velocity',
        description: 'Same device scanning multiple products too quickly',
        enabled: true,
        weight: 0.30,
        threshold: 5,
        windowMs: 60 * 60 * 1000,
        action: 'FLAG',
        severity: 'MEDIUM',
    },
    IMPOSSIBLE_TRAVEL: {
        id: 'IMPOSSIBLE_TRAVEL',
        name: 'Impossible Travel',
        description: 'Serial scanned in distant locations within short time',
        enabled: true,
        weight: 0.40,
        threshold: 100,
        windowMs: 60 * 60 * 1000,
        action: 'BLOCK',
        severity: 'CRITICAL',
    },
    SERIAL_MULTI_USER: {
        id: 'SERIAL_MULTI_USER',
        name: 'Multi-User Serial',
        description: 'Same serial scanned by different users',
        enabled: true,
        weight: 0.20,
        threshold: 2,
        windowMs: 30 * 24 * 60 * 60 * 1000,
        action: 'FLAG',
        severity: 'MEDIUM',
    },
    VPN_DETECTED: {
        id: 'VPN_DETECTED',
        name: 'VPN/Proxy Detected',
        description: 'VPN or proxy connection detected',
        enabled: true,
        weight: 0.20,
        threshold: 1,
        windowMs: 0,
        action: 'FLAG',
        severity: 'LOW',
    },
    GPS_SPOOFING: {
        id: 'GPS_SPOOFING',
        name: 'GPS Spoofing',
        description: 'GPS location accuracy suspicious',
        enabled: true,
        weight: 0.15,
        threshold: 500,
        windowMs: 0,
        action: 'FLAG',
        severity: 'MEDIUM',
    },
    DEVICE_MISMATCH: {
        id: 'DEVICE_MISMATCH',
        name: 'Device Fingerprint Mismatch',
        description: 'Device fingerprint pattern suspicious',
        enabled: true,
        weight: 0.10,
        threshold: 3,
        windowMs: 24 * 60 * 60 * 1000,
        action: 'FLAG',
        severity: 'LOW',
    },
    IP_GEO_MISMATCH: {
        id: 'IP_GEO_MISMATCH',
        name: 'IP-Geolocation Mismatch',
        description: 'IP location does not match GPS location',
        enabled: true,
        weight: 0.15,
        threshold: 50,
        windowMs: 0,
        action: 'FLAG',
        severity: 'MEDIUM',
    },
    SERIAL_PATTERN: {
        id: 'SERIAL_PATTERN',
        name: 'Suspicious Serial Pattern',
        description: 'Serial number matches known attack patterns',
        enabled: true,
        weight: 0.25,
        threshold: 1,
        windowMs: 0,
        action: 'BLOCK',
        severity: 'HIGH',
    },
};
exports.FRAUD_DECISIONS = {
    ALLOW: 0.3,
    FLAG: 0.6,
    BLOCK: 1.0,
};
function getFraudDecision(score) {
    if (score < exports.FRAUD_DECISIONS.ALLOW)
        return 'ALLOW';
    if (score < exports.FRAUD_DECISIONS.FLAG)
        return 'FLAG';
    return 'BLOCK';
}
function getSeverityFromScore(score) {
    if (score < 0.2)
        return 'LOW';
    if (score < 0.4)
        return 'MEDIUM';
    if (score < 0.7)
        return 'HIGH';
    return 'CRITICAL';
}
//# sourceMappingURL=rules.js.map