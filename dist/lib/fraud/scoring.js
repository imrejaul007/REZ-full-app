"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFraudScore = calculateFraudScore;
const rules_1 = require("./rules");
function calculateFraudScore(input, context) {
    const triggeredRules = [];
    const details = {};
    let totalWeight = 0;
    const velocityResult = checkVelocity(input, context);
    if (velocityResult.triggered) {
        triggeredRules.push(velocityResult.rule);
        details.velocity = velocityResult.details;
        totalWeight += velocityResult.rule.weight;
    }
    const travelResult = checkImpossibleTravel(input, context);
    if (travelResult.triggered) {
        triggeredRules.push(travelResult.rule);
        details.travel = travelResult.details;
        totalWeight += travelResult.rule.weight;
    }
    const multiUserResult = checkMultiUser(input, context);
    if (multiUserResult.triggered) {
        triggeredRules.push(multiUserResult.rule);
        details.multiUser = multiUserResult.details;
        totalWeight += multiUserResult.rule.weight;
    }
    const vpnResult = checkVPNProxy(input);
    if (vpnResult.triggered) {
        triggeredRules.push(vpnResult.rule);
        details.vpn = { detected: vpnResult.details.vpn };
        details.proxy = { detected: vpnResult.details.proxy };
        details.tor = { detected: vpnResult.details.tor };
        totalWeight += vpnResult.rule.weight;
    }
    const gpsResult = checkGPS(input);
    if (gpsResult.triggered) {
        triggeredRules.push(gpsResult.rule);
        details.gps = gpsResult.details;
        totalWeight += gpsResult.rule.weight;
    }
    const score = Math.min(totalWeight, 1.0);
    const decision = (0, rules_1.getFraudDecision)(score);
    return {
        score,
        decision,
        severity: getSeverityFromScore(score),
        triggeredRules,
        details,
    };
}
function checkVelocity(input, context) {
    const rule = rules_1.FRAUD_RULES.VELOCITY;
    if (!rule.enabled || !context.recentScansDevice || !input.deviceId) {
        return { triggered: false, rule: null, details: { scans: 0, windowHours: 0 } };
    }
    const windowStart = Date.now() - rule.windowMs;
    const recentScans = context.recentScansDevice.filter(s => s.timestamp.getTime() > windowStart);
    const scans = recentScans.length;
    const triggered = scans >= rule.threshold;
    return {
        triggered,
        rule: {
            ruleId: rule.id,
            ruleName: rule.name,
            weight: rule.weight,
            threshold: rule.threshold,
            actual: scans,
            action: rule.action,
            severity: rule.severity,
        },
        details: { scans, windowHours: 1 },
    };
}
function checkImpossibleTravel(input, context) {
    const rule = rules_1.FRAUD_RULES.IMPOSSIBLE_TRAVEL;
    if (!rule.enabled || !context.recentScansSerial || !input.location) {
        return { triggered: false, rule: null, details: undefined };
    }
    const lastScan = context.recentScansSerial[context.recentScansSerial.length - 1];
    if (!lastScan?.location) {
        return { triggered: false, rule: null, details: undefined };
    }
    const distance = calculateDistance(lastScan.location.lat, lastScan.location.lng, input.location.lat, input.location.lng);
    const timeMs = Date.now() - lastScan.timestamp.getTime();
    const timeHours = timeMs / (1000 * 60 * 60);
    const speed = distance / timeHours;
    const triggered = speed > rule.threshold;
    return {
        triggered,
        rule: {
            ruleId: rule.id,
            ruleName: rule.name,
            weight: rule.weight,
            threshold: rule.threshold,
            actual: speed,
            action: rule.action,
            severity: rule.severity,
        },
        details: {
            distanceKm: Math.round(distance),
            timeMinutes: Math.round(timeMs / (1000 * 60)),
            speedKmh: Math.round(speed),
            previousLocation: lastScan.location,
            currentLocation: input.location,
        },
    };
}
function checkMultiUser(input, context) {
    const rule = rules_1.FRAUD_RULES.SERIAL_MULTI_USER;
    if (!rule.enabled || !context.recentScansSerial || !input.userId) {
        return { triggered: false, rule: null, details: undefined };
    }
    const windowStart = Date.now() - rule.windowMs;
    const recentScans = context.recentScansSerial.filter(s => s.timestamp.getTime() > windowStart);
    const uniqueUsers = [...new Set(recentScans.map(s => s.userId))];
    const count = uniqueUsers.length;
    const triggered = count >= rule.threshold;
    return {
        triggered,
        rule: {
            ruleId: rule.id,
            ruleName: rule.name,
            weight: rule.weight,
            threshold: rule.threshold,
            actual: count,
            action: rule.action,
            severity: rule.severity,
        },
        details: { count, users: uniqueUsers },
    };
}
function checkVPNProxy(input) {
    const rule = rules_1.FRAUD_RULES.VPN_DETECTED;
    if (!rule.enabled) {
        return { triggered: false, rule: null, details: { vpn: false, proxy: false, tor: false } };
    }
    const triggered = !!(input.vpnDetected || input.proxyDetected || input.torDetected);
    return {
        triggered,
        rule: {
            ruleId: rule.id,
            ruleName: rule.name,
            weight: rule.weight,
            threshold: rule.threshold,
            actual: triggered ? 1 : 0,
            action: rule.action,
            severity: rule.severity,
        },
        details: {
            vpn: !!input.vpnDetected,
            proxy: !!input.proxyDetected,
            tor: !!input.torDetected,
        },
    };
}
function checkGPS(input) {
    const rule = rules_1.FRAUD_RULES.GPS_SPOOFING;
    if (!rule.enabled || !input.location?.accuracy) {
        return { triggered: false, rule: null, details: undefined };
    }
    const triggered = input.location.accuracy > rule.threshold;
    return {
        triggered,
        rule: {
            ruleId: rule.id,
            ruleName: rule.name,
            weight: rule.weight,
            threshold: rule.threshold,
            actual: input.location.accuracy,
            action: rule.action,
            severity: rule.severity,
        },
        details: {
            accuracy: input.location.accuracy,
            suspicious: triggered,
        },
    };
}
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRad(deg) {
    return deg * (Math.PI / 180);
}
//# sourceMappingURL=scoring.js.map