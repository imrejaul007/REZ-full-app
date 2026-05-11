# REZ Platform — Master Plan (Deep-Scan Findings + Execution Roadmap)

**Generated:** 2026-04-19
**Based on:** day-long audit rounds across 3 frontend apps + deep scan of 17 backend services + frontend long-tail review
**Next action:** push the pending `ten-agent-round/20260418` branches, then execute P0 items below

---

## Executive summary

After one day of 30+ audit/fix rounds across the platform, the **frontend TSC is green (0 errors all 3 apps)** and **~235 bounded bugs were closed**. This master plan consolidates everything that remains open, ranked by severity, with owners and effort estimates.

**Counts at end of session (2026-04-18):**
- Active bounded bugs (frontend): ~40–50
- Active bounded bugs (backend): ~80 (newly surfaced in today's deep scan — most not previously tracked)
- Arch-fitness debt: 6,405 bare `as any` + 2,523 `console.*` — multi-session cleanup campaign
- Hardcoded strings (i18n blocker): ~6,630 across the 3 apps

**Truly launch-blocking items: ~15** — listed as P0 below. Everything else is post-launch work.

---

## P0 — Launch-blocking (must fix before `www.rez.money` goes public)

### Backend (your dev's queue)

| # | Service | Issue | Effort | Source |
|---|---|---|---|---|
| B1 | payment-service | Duplicate `startPaymentWorker()` at `src/index.ts:117-136` → double-processing of the payment queue | 5 min | backend deep scan |
| B2 | payment-service | Wallet credit fire-and-forget at `paymentRoutes.ts:336-374` — if wallet-service fetch fails, flag is still set, credit is lost | 2 h (transactional rewrite + reconciliation cron) | backend deep scan |
| B3 | payment-service | 10,000-coin silent cap on recharge at `paymentRoutes.ts:333` — large recharges truncated without error | 30 min | backend deep scan |
| B4 | order-service | SSE `/orders/stream?merchantId=X` has auth but NO ownership check — any authenticated user can watch any merchant's live order firehose (`httpServer.ts:476-536`) | 1 h | backend deep scan |
| B5 | order-service | PATCH `/orders/:id/status` has no caller-role ownership check — any authenticated user can transition any order's state (`httpServer.ts:580-670`) | 1 h | backend deep scan |
| B6 | media-events | Uploads stored on ephemeral local disk (`UPLOADS_DIR=cwd/uploads`) — Render has no persistent volume, uploads lost on redeploy | 2–4 h (migrate to Cloudinary direct or S3) | backend deep scan |
| B7 | media-events | No MIME sniffing — trusts client `file.mimetype` for uploads | 1 h (`file-type` sniff) | backend deep scan |
| B8 | wallet-service | Idempotency key enforced ONLY for `source === 'referral'` on `/internal/credit` — payment/order/gamification credits can be duplicated by caller retries (`internalRoutes.ts:43-93`) | 1 h | backend deep scan |
| B9 | analytics-events | Public unauthenticated `/api/analytics/web-events` + `/batch` with only in-memory per-IP rate limit (not cluster-safe) | 2 h (Redis-backed rate limit + HMAC sig) | backend deep scan |
| B10 | ads-service | `app.use(cors())` with NO origin allowlist — fully open CORS on ad-serving endpoints | 15 min | backend deep scan |
| B11 | gateway | Search/home/recommend paths (`/search/stores`, `/home/feed`, `/recommend/*`, `/search/history`) NOT routed in nginx — consumer calls fail | 30 min (add location blocks) | backend deep scan |
| B12 | gateway + SOT | **Contract drift**: SOT says `/api/payments/*` (plural), gateway has `/api/payment` (singular). SOT says `POST /orders`, order-service has no such route. SOT says `/auth/otp/request`, auth uses `/auth/otp/send`. Update SOT + fix any frontend callers. | 1 h | backend deep scan |

### Frontend

| # | App | Issue | Effort | Source |
|---|---|---|---|---|
| F1 | admin | `logger.error` called at module eval BEFORE `logger` is imported (TDZ) → ReferenceError crashes boot when Sentry DSN unset. **✓ FIXED in this session** — uses Sentry.captureMessage + stderr fallback. | done | frontend long-tail |
| F2 | consumer | Push-notification deep-link `router.push(data.route)` with no allowlist (`app/_layout.tsx:312-315`) — malicious push payload = route hijack | 1 h (allowlist + regex validation) | frontend long-tail |
| F3 | merchant | Same unvalidated push navigation: `router.push(screen as any)` at `hooks/usePushNotifications.ts:95-97` | 1 h | frontend long-tail |
| F4 | admin | Force-update `Linking.openURL(updateUrl)` with remote-controlled URL from `/config/app-status` (`app/_layout.tsx:239`) — open-redirect on compromised endpoint | 30 min | frontend long-tail |
| F5 | admin | **ZERO push-notification handlers registered** — `expo-notifications` in deps, no `setNotificationHandler`, no listener, no token registration. Admins never receive fraud/system alerts. | 3 h | frontend long-tail |
| F6 | merchant | Foreground notifications silently swallowed — handlers at `app/_layout.tsx:158-171` only `console.log`; no cache invalidation, no toast. POS/KDS miss real-time events. | 1 h | frontend long-tail |
| F7 | merchant | Deep-links registered (`rez-merchant://`, `applinks:merchant.rez.money`) but **no handler code anywhere**. Universal links open app to wrong screen. | 2 h | frontend long-tail |
| F8 | admin | Same deep-link gap — `rez-admin://` registered, no handler. | 2 h | frontend long-tail |

**Total P0 backend effort: ~12–16 hours (1 dev-day)**
**Total P0 frontend effort: ~10 hours (1 dev-day)**

---

## P1 — High-priority, fix within 2 weeks of launch

### Backend

- **Trust proxy missing in 14/17 services** — per-IP rate limiters effectively key on CF IP not client IP. Add `app.set('trust proxy', TRUST_PROXY_HOPS)` everywhere. Effort: 1 h total.
- **CORS regex over-permissive** in merchant-service (`[a-z0-9-]+\.vercel\.app` — any Vercel project). Tighten to explicit origins. Effort: 30 min.
- **`rez-backend/src/server.ts` is 791 lines** — violates <500-line rule. Extract middleware/routes/graceful-shutdown modules. Effort: 4 h.
- **No rate limiter on finance-service, search-service consumer routes, catalog-service read paths.** Add service-layer limits. Effort: 2 h.
- **Missing graceful HTTP-server shutdown in rez-marketing-service** (only closes workers + mongoose). Effort: 30 min.
- **Missing BullMQ drain in rez-ads-service graceful shutdown.** Effort: 30 min.
- **Health endpoint shape drift across 17 services** — k8s probes parse differently. Standardize `{status, checks, version}` shape. Effort: 3 h.
- **Single-tenant internal auth model** — any service can spoof `X-Internal-Service` header to access another service's token. Add mTLS or signed JWT per service. Effort: 1 week (major architecture).
- **Duplicate auth/compat routes** — auth service double-declares every route (`/auth/*` + `/api/user/auth/*`), wallet double-mounts. Pick one, deprecate other. Effort: 2 h.

### Frontend

- **Admin near-zero accessibility** — 2 `accessibility*` attributes across 2,807 touchables. WCAG AA failure. Effort: 1 week systematic.
- **Merchant ~3.7% accessibility** — 158/4,315. Hot paths (POS, KDS, payouts) mostly unlabeled. Effort: 1 week systematic.
- **Merchant dashboard `app/(dashboard)/index.tsx`: 3,762 lines / 133 KB** — violates 500-line rule 7.5×. Split into feature sections. Effort: 1 day.
- **Merchant POS `app/pos/index.tsx`: 2,324 lines** — same issue. Effort: 1 day.
- **Polling intervals ignore AppState** in merchant `web-orders.tsx`, `kds/*.tsx`, `aggregator-orders.tsx` — continue when backgrounded. Wrap in `AppState.addEventListener('change', …)`. Effort: 2 h.
- **Admin has zero NetInfo / OfflineBanner** across 135 screens. Admin actions fire blind offline. Effort: 4 h (add OfflineBanner + network-aware hook).
- **Error boundaries only at root** for merchant + admin. Hot paths (POS, KDS, floor-plan, settlements) need per-feature boundaries. Effort: 3 h.
- **Zero component/screen tests in admin**; only 1 e2e + 3 integration tests in merchant. Establish coverage for critical paths (auth, payment, refund, payout). Effort: 1 week.
- **Consumer Hotel OTA SSO fires on every cold-start** regardless of need — unnecessary startup dependency. Gate behind "has user ever used hotels?" flag. Effort: 1 h.
- **Consumer deep-link race** between `Linking.getInitialURL` and `router.replace('/onboarding')` in `_layout.tsx` startup. Serialize. Effort: 1 h.

---

## P2 — Medium / tech debt (fix ongoing)

- **6,405 bare `as any` casts** → staged codemod campaign. 371 admin + 728 merchant + 5,306 consumer.
- **2,523 `console.*` calls** → logger migration. 677 admin + 1,103 merchant + 743 consumer.
- **~6,630 hardcoded UI strings** across 3 apps → install `react-i18next`, extract to translation catalog. Currently blocked: `constants/strings.ts` exists in each app but no runtime integration.
- **Inline `onPress={() => …}` anti-pattern**: consumer 2,187 / merchant 1,543 / admin 1,198 sites. Breaks `React.memo`. Wrap in `useCallback`.
- **Inline `style={{…}}`**: consumer 1,026 / merchant 642 / admin 996. Defeats StyleSheet caching.
- **FlatList inline `renderItem`**: 66 sites total across 3 apps — full list re-mounts on parent re-render.
- **16 bare `fetch()` calls in merchant** bypass apiClient → no token refresh, no Sentry. Consumer has 40. Route through apiClient.
- **6 files in merchant disable `react-hooks/exhaustive-deps`** — latent stale-closure bugs.
- **Wallet credit atomicity missing across 3 paths** (payment-service, gamification, order). Shared `creditUserCoins(userId, amount, opts)` helper with transactional semantics.
- **`/metrics` unbounded `req.path` labels in wallet-service** — cardinality DoS risk.

---

## P3 — Nice-to-have / future

- Bundle-size analysis — `expo-doctor` + webpack-bundle-analyzer never run.
- Sentry PII scrubbing only covers `event.request.data`; breadcrumbs + contexts not scrubbed.
- SQLite migration path for offline POS queue — no version-upgrade test.
- Android back-button intercept parity with web modal stacks.
- Image pipeline — `expo-image` priority/caching optimization for large merchant grids.
- WebView XSS hygiene scan.

---

## Execution sequence

**Week 1 (pre-launch):**
1. Day 1–2: P0 backend (B1–B12) — your dev's focus
2. Day 3: P0 frontend (F2–F8) — adding push/deep-link handlers + validation
3. Day 4: Secret rotation + Render env cleanup (see `ENV-VARS.md` rotation checklist)
4. Day 5: P0 verification — re-run tsc, run all frontend flows, manual smoke on staging, production deploy gate

**Weeks 2–4 (post-launch hardening):**
5. P1 backend: trust proxy, rate limits, shutdown hygiene
6. P1 frontend: a11y systematic pass, ErrorBoundary coverage, AppState-aware polling
7. Split the merchant monolith screens (POS + dashboard)

**Month 2+:**
8. P2 cleanup campaigns — `as any`, `console.*`, i18n extraction
9. Architectural: shared retry policy consolidation (partially done), mutation hook rollout completion, single health-endpoint shape

---

## Already committed this session (pending push)

Local branch `ten-agent-round/20260418` on all 3 apps has:

- **Admin (7 commits):** 10-agent round, wave-2 retry+CSRF, PaymentStatus canonical, useAdminMutation rollout (19 hooks across 6 services), A10-C7 color consolidation, useAdminSettingsMutations wiring, Sentry-safe DSN-missing warning
- **Merchant (3 commits):** 10-agent round, wave-2 retry util, next-phase (G-MA-C02 offline coin + store-switch abort + socket rejoin)
- **Consumer (2 commits):** wave-2 (real 429 handling), next-phase (shared rewardsPreview + fraud fail-closed propagation)

Push from Mac:
```bash
cd "/path/to/ReZ Full App"
for repo in rez-app-admin rez-app-marchant rez-app-consumer; do
  cd "$repo" && git push -u origin ten-agent-round/20260418 && cd ..
done
cd SOURCE-OF-TRUTH && git push origin main && cd ..
```

---

## Cross-reference

- Backend deep scan raw findings: see agent output in session log (not committed separately — all consolidated here)
- Frontend long-tail raw findings: same
- Prior session summaries: `SOURCE-OF-TRUTH/LAUNCH-PREP-2026-04-18.md`
- Gap registry: `docs/gaps/00-INDEX.md`
- Rotation checklist: `SOURCE-OF-TRUTH/ENV-VARS.md` (Secret Rotation Checklist section)

## Owner matrix

| Area | Owner | Work-items |
|---|---|---|
| Backend P0 | @dev (Rejaul) | B1–B12 |
| Admin push/deep-link | frontend | F4, F5, F8 |
| Consumer push/deep-link | frontend | F2, F7 (partial — consumer already has deep-link handler, just needs push validation) |
| Merchant push/deep-link | frontend | F3, F6, F7 |
| a11y sweep | frontend + designer | all 3 apps |
| i18n implementation | frontend + localization | all 3 apps |
| Secret rotation | @dev (Rejaul) | Render dashboard |
| CI arch-fitness remediation | platform team | `as any` + `console.*` campaigns |
