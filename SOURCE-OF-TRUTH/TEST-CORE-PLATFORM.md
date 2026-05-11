# ReZ Core Platform API Health Test Report

**Test Date:** 2026-05-06
**Test Environment:** Render.com Deployment

---

## Summary

| Status | Count |
|--------|-------|
| Healthy (200) | 8 |
| Not Healthy (502/500/503) | 5 |
| No Health Endpoint (404/307) | 7 |
| Suspended | 4 |

---

## Health Test Results

### Healthy Services (200 OK)

| Service | URL | Status | Details |
|---------|-----|--------|---------|
| rez-merchant-integrations | https://rez-merchant-integrations.onrender.com | **HEALTHY** | `{"status":"healthy","service":"merchant-integrations","version":"1.0.0"}` |
| rez-corporate-service | https://rez-corporate-service.onrender.com | **HEALTHY** | MongoDB connected, version 1.0.0 |
| rez-student-service | https://rez-student-service.onrender.com | **HEALTHY** | MongoDB connected, version 1.0.0 |
| corpperks-hotel | https://corpperks-hotel.onrender.com | **HEALTHY** | Service: rez-stayown-service |
| corpperks-api | https://corpperks-api.onrender.com | **HEALTHY** | Service running |
| rez-finance-service | https://rez-finance-service.onrender.com | **HEALTHY** | DB connected, Redis connected |
| rez-insights-service | https://rez-insights-service.onrender.com | **HEALTHY** | MongoDB connected, Redis connected, Uptime: 121.9s |
| rez-automation-service | https://rez-automation-service.onrender.com | **HEALTHY** | Version 1.0.0 |

### Unhealthy Services

| Service | URL | HTTP Code | Issue |
|---------|-----|-----------|-------|
| hotel-ota-api | https://hotel-ota-api.onrender.com | **502** | Bad Gateway - Service unavailable |
| corpperks-admin | https://corpperks-admin.onrender.com | **502** | Bad Gateway - Service unavailable |
| adbazaar | https://adbazaar.onrender.com | **500** | Internal Server Error |
| rez-automation-service | https://rez-automation-service.onrender.com | **503** | Service unavailable (previously healthy) |

### Services Without Health Endpoints

| Service | URL | HTTP Code | Notes |
|---------|-----|-----------|-------|
| hotel-ota-web | https://hotel-ota-web.onrender.com | 307 | Redirects to homepage (frontend only) |
| hotel-ota-hotel-panel | https://hotel-ota-hotel-panel.onrender.com | 307 | Redirects to homepage (frontend only) |
| hotel-ota-admin | https://hotel-ota-admin.onrender.com | 307 | Redirects to homepage (frontend only) |
| rendez-entv | https://rendez-entv.onrender.com | 307 | Redirects to homepage (frontend only) |
| rez-scheduler-service | https://rez-scheduler-service.onrender.com | 404 | No /health endpoint defined |
| nextabizz | https://nextabizz.onrender.com | 503 | Service suspended |
| rez-karma-app | https://rez-karma-app.onrender.com | 503 | Service suspended |
| REZ-support-copilot | https://rez-support-copilot.onrender.com | 503 | Service suspended |
| rez-ad-copilot | https://rez-ad-copilot.onrender.com | 503 | Service suspended |

---

## Requested Core Platform Services - Not Found

The following services were requested but **not found** in the Render deployment:

| Service Name | Status |
|--------------|--------|
| event-platform | **NOT DEPLOYED** |
| action-engine | **NOT DEPLOYED** |
| feedback-service | **NOT DEPLOYED** |
| intent-graph | **NOT DEPLOYED** |
| intelligence-hub | **NOT DEPLOYED** |
| user-intelligence | **NOT DEPLOYED** |
| merchant-intelligence | **NOT DEPLOYED** (closest match: rez-merchant-integrations) |

---

## Action Items

### Critical
1. **hotel-ota-api** - 502 Bad Gateway - Investigate backend service crash
2. **corpperks-admin** - 502 Bad Gateway - Investigate service availability
3. **adbazaar** - 500 Internal Server Error - Check application logs

### Medium Priority
4. **rez-automation-service** - 503 Service Unavailable - Restart service if needed
5. Deploy missing core platform services if required

### Low Priority
6. Add health endpoints to services missing them (rez-scheduler-service)

---

## Deployment Inventory

**Total Services:** 20
- **Active & Healthy:** 8
- **Active & Unhealthy:** 4
- **Suspended:** 4
- **Frontend Only (no API):** 4

---

*Report generated automatically via Render API health checks*
