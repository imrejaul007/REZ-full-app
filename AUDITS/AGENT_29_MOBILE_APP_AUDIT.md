# AGENT 29: MOBILE APP FEATURES AUDIT
**Date:** May 10, 2026

## SUMMARY

| Metric | Value |
|--------|-------|
| Total Screens | 100+ |
| Services | 45+ |
| CRITICAL Issues | 5 |
| HIGH Issues | 5 |
| Security Issues | 11 |

## CRITICAL GAPS

1. **App Check is a Stub** - `btoa(JSON.stringify(deviceInfo))` instead of real Firebase attestation
2. **WebSocket Pong Missing** - Cannot verify correct server connection
3. **Offline Banner No Sync Trigger** - Shows count but no retry button
4. **Camera Scanner Placeholder** - QR scanning only works in manual mode
5. **Session Timeout Not Integrated** - Socket stays connected after token expires

## HIGH PRIORITY

1. Socket reconnection attempts too low (3 → should be 10)
2. No background sync for POS offline queue
3. Missing Android runtime camera permission handling
4. No iOS notification categories
5. Biometric fallback not localized

## SECURITY ISSUES

1. App Check stub enables API replay attacks
2. Web: tokens in localStorage (XSS vulnerable)
3. Socket disconnect without token invalidation
4. No rate limiting on offline queue sync

## RECOMMENDATIONS

1. Replace App Check stub with real Firebase App Check
2. Increase socket reconnection to 10 attempts
3. Add manual retry button to OfflineBanner
4. Fix camera scanner placeholder

**Full report saved from agent output in this session.**
