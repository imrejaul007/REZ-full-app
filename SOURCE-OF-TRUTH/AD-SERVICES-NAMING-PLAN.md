# AD SERVICES - NAMING & CONSOLIDATION PLAN

**Date:** May 5, 2026
**Status:** IN PROGRESS

---

## AUDIT FINDINGS

### 9 Ad Services Found

| Service | Type | Purpose | Tech | Action |
|---------|------|---------|------|--------|
| `adBazaar` | Next.js App | QR + offline ads | Next + Supabase | **KEEP** |
| `adsos` | Library | DOOH intelligence | Node.js | **MERGE into DOOH** |
| `ados` | Module | DOOH screens | Node.js | **MERGE into DOOH** |
| `adsqr` | Next.js App | Sampling QR | Next + Supabase | **KEEP** |
| `rez-adbazaar` | Express API | Intent marketplace | MongoDB | **DELETE** (legacy) |
| `rez-ad-platform` | Express API | Unified platform | Redis | **KEEP as UCE** |
| `rez-ad-copilot` | Express API | AI copilot | MongoDB | **MERGE** |
| `rez-ads-service` | Microservice | Ad campaigns | MongoDB + Redis | **KEEP** |
| `rez-marketing-service` | Microservice | Multi-channel | MongoDB + Redis | **KEEP** |

---

## CONFUSION MATRIX

| Confusion | Problem | Solution |
|-----------|---------|----------|
| `adBazaar` vs `rez-adbazaar` | Both do ad marketplace | `adBazaar` = frontend, `rez-adbazaar` = DELETE |
| `ados` vs `adsos` | Both DOOH-related | Merge into `rez-dooh` |
| `rez-ads-service` vs `rez-ad-platform` | Both ad platforms | `ads-service` = campaigns, `ad-platform` = UCE |
| `adsqr` vs `adBazaar` | Both QR campaigns | `adsqr` = sampling, `adBazaar` = marketplace |

---

## PROPOSED NAMING

### BEFORE → AFTER

| Current | Proposed | Action |
|---------|----------|--------|
| `adBazaar` | `rez-offline-ads` | **RENAME** |
| `adsos` | DELETE | Merge into rez-dooh |
| `ados` | DELETE | Merge into rez-dooh |
| `adsqr` | `rez-sampling` | **RENAME** |
| `rez-adbazaar` | DELETE | **DELETE** (legacy) |
| `rez-ad-platform` | `rez-uce` | **RENAME** |
| `rez-ad-copilot` | `rez-ad-ai` | **RENAME** |
| `rez-ads-service` | `rez-ad-campaigns` | **RENAME** |
| `rez-marketing-service` | `rez-marketing` | **RENAME** |

---

## FINAL STRUCTURE

```
REZ ADVERTISING SYSTEM
│
├── REZ-UCE (Unified Campaign Engine)
│   └── `rez-uce` (was rez-ad-platform)
│       - Campaign management
│       - Budget allocation
│       - Channel orchestration
│
├── REZ-RDE (Decision Engine)
│   └── `rez-decision-service`
│       - 18 engines built
│       - Attribution
│       - Smart coins
│
├── REZ-CHANNELS
│   ├── `rez-offline-ads` (was adBazaar)
│   │   - QR codes
│   │   - Offline placements
│   │   - GPS verification
│   │
│   ├── `rez-sampling` (was adsqr)
│   │   - Free samples
│   │   - Trial discovery
│   │   - Coin rewards
│   │
│   └── `rez-dooh` (NEW - merged)
│       - Screen network
│       - Playlist generation
│       - Real-time bidding
│
├── REZ-CAMPAIGNS
│   ├── `rez-ad-campaigns` (was rez-ads-service)
│   │   - Campaign CRUD
│   │   - Ad placements
│   │   - Fraud detection
│   │
│   └── `rez-marketing` (was rez-marketing-service)
│       - WhatsApp
│       - SMS
│       - Email
│       - Push
│
├── REZ-AI
│   └── `rez-ad-ai` (was rez-ad-copilot)
│       - AI campaign suggestions
│       - Auto-optimization
│
└── DELETE
    ├── `rez-adbazaar` (legacy)
    ├── `adsos` (merged into dooh)
    └── `ados` (merged into dooh)
```

---

## DELETE THESE (SAFE TO DELETE)

### 1. `rez-adbazaar` (Legacy)
```
Path: /ReZ Full App/rez-adbazaar
Status: Legacy, not in use
Size: Small
Action: DELETE
```

**Why:** Replaced by `rez-ads-service`. MongoDB-based, outdated architecture.

### 2. `adsos` (Merged into DOOH)
```
Path: /ReZ Full App/adsos
Status: Library, merged into dos
Action: DELETE after merge
```

**Why:** Contains duplicate code from `ados`. Merge features into `rez-dooh` first.

### 3. `ados` (Merged into DOOH)
```
Path: /ReZ Full App/ados
Status: DOOH module, merge into rez-dooh
Action: MERGE into rez-dooh then DELETE
```

**Why:** Similar to `adsos`, can be consolidated into single DOOH service.

---

## RENAME THESE

### 1. `adBazaar` → `rez-offline-ads`
```
Path: /ReZ Full App/adBazaar → /ReZ Full App/rez-offline-ads
```

**Changes:**
- Rename directory
- Update package.json name
- Update git remote

### 2. `adsqr` → `rez-sampling`
```
Path: /ReZ Full App/adsqr → /ReZ Full App/rez-sampling
```

**Changes:**
- Rename directory
- Update package.json name
- Update git remote

### 3. `rez-ad-platform` → `rez-uce`
```
Path: /ReZ Full App/rez-ad-platform → /ReZ Full App/rez-uce
```

**Changes:**
- Rename directory
- Update port reference (4028 stays)
- Update all imports

### 4. `rez-ad-copilot` → `rez-ad-ai`
```
Path: /ReZ Full App/rez-ad-copilot → /ReZ Full App/rez-ad-ai
```

**Changes:**
- Rename directory
- Update port (4026 stays)

### 5. `rez-ads-service` → `rez-ad-campaigns`
```
Path: /ReZ Full App/rez-ads-service → /ReZ Full App/rez-ad-campaigns
```

**Changes:**
- Rename directory
- Update port (4007 stays)

### 6. `rez-marketing-service` → `rez-marketing`
```
Path: /ReZ Full App/rez-marketing-service → /ReZ Full App/rez-marketing
```

**Changes:**
- Rename directory
- Update port (4000 stays)

---

## MERGE THESE INTO `rez-dooh`

### Features from `ados` to merge:
- Screen management
- Playlist generation
- Delivery engine

### Features from `adsos` to merge:
- ROI engine
- Scoring engine
- Allocation engine

### Create: `rez-dooh`
```
New path: /ReZ Full App/rez-dooh
Contains:
- Screen network management
- DOOH intelligence (from adsos)
- Screen types (from ados)
- Playlist generation
- Real-time bidding
```

---

## BEFORE & AFTER COMPARISON

### BEFORE (Confusing)

```
adBazaar/
adsos/
ados/
adsqr/
rez-adbazaar/
rez-ad-platform/
rez-ad-copilot/
rez-ads-service/
rez-marketing-service/
```

### AFTER (Clear)

```
rez-offline-ads/     (was adBazaar)
rez-sampling/         (was adsqr)
rez-uce/              (was rez-ad-platform)
rez-ad-ai/            (was rez-ad-copilot)
rez-ad-campaigns/      (was rez-ads-service)
rez-marketing/         (was rez-marketing-service)
rez-dooh/             (NEW - merged from ados + adsos)
```

---

## ACTION STEPS

### Phase 1: Delete Legacy
1. Backup `rez-adbazaar`
2. Delete `rez-adbazaar`
3. Commit

### Phase 2: Merge DOOH
1. Create `rez-dooh` directory
2. Copy features from `ados`
3. Merge features from `adsos`
4. Test `rez-dooh`
5. Delete `ados` and `adsos`
6. Commit

### Phase 3: Rename Services
1. Rename `adBazaar` → `rez-offline-ads`
2. Rename `adsqr` → `rez-sampling`
3. Rename `rez-ad-platform` → `rez-uce`
4. Rename `rez-ad-copilot` → `rez-ad-ai`
5. Rename `rez-ads-service` → `rez-ad-campaigns`
6. Rename `rez-marketing-service` → `rez-marketing`
7. Update all imports
8. Test all services
9. Commit

### Phase 4: Update Documentation
1. Update SOURCE-OF-TRUTH.md
2. Update all README files
3. Update integration points

---

## FILES TO UPDATE

| File | Changes |
|------|---------|
| `SOURCE-OF-TRUTH.md` | Update service names |
| `docs/PHASE*.md` | Update references |
| Integration configs | Update service names |
| Git remotes | Update for renamed repos |

---

## RISK ASSESSMENT

| Action | Risk | Mitigation |
|--------|------|-------------|
| Delete `rez-adbazaar` | Low | Legacy, not in use |
| Delete `ados`/`adsos` | Medium | Merge first |
| Rename services | High | Update imports, test thoroughly |

---

## TIMELINE

| Phase | Task | Time |
|-------|------|------|
| 1 | Delete legacy | 10 min |
| 2 | Merge DOOH | 30 min |
| 3 | Rename services | 60 min |
| 4 | Update docs | 20 min |
| **Total** | | **2 hours** |

---

## APPROVAL NEEDED

Before I proceed, confirm:

1. Delete `rez-adbazaar`?
2. Merge `ados` + `adsos` into `rez-dooh`?
3. Rename all services?
4. Update SOURCE-OF-TRUTH?

**Reply with "YES" to proceed.**
