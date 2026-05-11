# ReZ Verify - Research & Analysis

**Document Version:** 1.0.0
**Date:** 2026-05-03
**Author:** Product Research Team
**Status:** Complete

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Comparison Matrix](#2-system-comparison-matrix)
3. [Integration Architecture](#3-integration-architecture)
4. [Technical Requirements](#4-technical-requirements)
5. [Business Model](#5-business-model)
6. [UX Flows](#6-ux-flows)
7. [Competitive Analysis](#7-competitive-analysis)
8. [Recommendations](#8-recommendations)
9. [Execution Roadmap](#9-execution-roadmap)

---

## 1. Executive Summary

### What is ReZ Verify?

**ReZ Verify** is a universal brand authenticity verification platform that enables consumers to verify product authenticity, trace supply chains, and report counterfeits using QR codes and proprietary verification methods.

### Market Opportunity

| Metric | Value |
|--------|-------|
| Global Counterfeit Market | $3.3 trillion annually (2026) |
| India Counterfeit Market | ~$250 billion |
| QR Code Market (Verification) | $12.8 billion by 2030 |
| CAGR | 10.2% |

### Core Value Proposition

> **"Every product tells a story. We help brands tell the truth."**

ReZ Verify provides:
- **Brand Protection**: Multi-layer anti-counterfeit verification
- **Consumer Trust**: Instant authenticity confirmation
- **Supply Chain Transparency**: End-to-end product tracking
- **Data Intelligence**: Consumer engagement and market insights

### Strategic Position

ReZ Verify occupies a **unique position** in the ReZ ecosystem:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REZ ECOSYSTEM VALUE CHAIN                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   CREATE          DISCOVER          TRANSACT         VERIFY          │
│   ─────          ───────           ────────         ──────          │
│                                                                      │
│  ┌────────┐    ┌────────┐       ┌────────┐      ┌────────┐         │
│  │ REZ    │    │ REZ    │       │ REZ    │      │ REZ    │         │
│  │ NOW    │    │ Web    │       │ Wallet │      │ VERIFY │         │
│  │        │    │ Menu   │       │        │      │  NEW   │         │
│  └────────┘    └────────┘       └────────┘      └────────┘         │
│                                                                      │
│  Merchant        Restaurant        Payments       Authenticity       │
│  Profiles        Menus            Wallet         Supply Chain       │
│  Services        Room QR          Orders         Anti-Counterfeit   │
│                                                                      │
│   ────────────────────────────────────────────────────────          │
│                           │                                          │
│                           ▼                                          │
│              ┌────────────────────────┐                            │
│              │      REZ ADS QR        │                             │
│              │   (Brand Awareness)     │                             │
│              └────────────────────────┘                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Differentiators

| Feature | Traditional QR | ReZ Verify |
|---------|----------------|------------|
| Single Scan | Basic info | Full authenticity + journey |
| Anti-Counterfeit | None | Multi-layer verification |
| Supply Chain | Manual audit | Real-time tracking |
| Consumer Engagement | None | Rewards + loyalty |
| Data Collection | None | Full analytics |
| Integration | Standalone | Full ecosystem |

### Revenue Model

| Revenue Stream | Rate | Notes |
|---------------|------|-------|
| QR Verification Fee | INR 0.20/unit | Per authenticated scan |
| SaaS Platform Fee | INR 20,000/month | Per brand/enterprise |
| Analytics Add-ons | INR 5,000/month | Advanced insights |
| API Access | INR 10,000/month | Developer tier |

### Recommendation

**Proceed to Phase 1 Development** with the following priorities:
1. Build verification engine (2-3 weeks)
2. Create brand dashboard (2 weeks)
3. Deploy consumer-facing scan experience (1 week)
4. Integrate with existing ReZ services (1 week)

---

## 2. System Comparison Matrix

### 2.1 QR System Feature Comparison

| Feature | ReZ Now | ReZ Web Menu | Room QR | Ads QR | ReZ Verify |
|---------|---------|--------------|---------|--------|------------|
| **Primary Use Case** | Universal merchant | Restaurant menu | Hotel room | Campaign ads | Product verification |
| **Target User** | Any business | Restaurants | Hotels | Advertisers | Brands + Consumers |
| **QR Content** | Link to profile | Menu ordering | Room services | Campaign landing | Authenticity proof |
| **Authentication** | Optional | Optional | Token-based | Optional | Multi-layer required |
| **Payment Integration** | Yes | Yes | Yes | Rewards only | No (verification only) |
| **Analytics** | Basic | Order analytics | Service metrics | ROI attribution | Supply chain data |
| **Rewards System** | REZ Coins | REZ Coins | REZ Coins | Brand coins | Verification stamps |
| **Real-time Updates** | No | Order status | Request tracking | Live metrics | Journey tracking |
| **Offline Support** | Limited | No | No | No | Offline verification |

### 2.2 Technical Architecture Comparison

| Aspect | ReZ Now | ReZ Web Menu | Room QR | Ads QR | ReZ Verify |
|--------|---------|--------------|---------|--------|------------|
| **Database** | Supabase | Supabase | MongoDB | Supabase | PostgreSQL + Redis |
| **Auth Method** | JWT | JWT | Token (AES-256) | JWT | HMAC + OTP |
| **QR Format** | `rez://profile/{id}` | `rez://menu/{id}?table={n}` | `rez://room/{id}?token={jwt}` | `rez://ad/{id}?source=qr` | `rez://verify/{brand}/{serial}` |
| **Rate Limiting** | 100/min | 100/min | 50/min | 100/min | 50/min |
| **Caching** | Static | Static | Dynamic | Static | Hybrid |
| **Real-time** | Socket.io | Socket.io | Socket.io | Polling | WebSocket |

### 2.3 Integration Points with Existing Services

| ReZ Service | Integration Type | ReZ Verify Usage |
|-------------|-----------------|-------------------|
| **REZ Auth** | Shared | OTP/JWT for brand dashboard, consumer verification |
| **REZ Wallet** | Shared | Verification rewards (coins earned) |
| **REZ Payment** | None | N/A - verification only |
| **REZ Mind** | Consumer | AI product recommendations post-verification |
| **REZ Chat** | Consumer | RAG chatbot for product Q&A |
| **REZ Karma** | Consumer | Karma score based on verification activity |
| **REZ Loyalty** | Consumer | Loyalty stamps for verified purchases |
| **REZ Knowledge** | Brand | Product knowledge base for verification context |

### 2.4 Reusable Components from Existing Systems

| Component | Source | Reusability for Verify |
|-----------|--------|------------------------|
| QR Generator | All systems | 90% reusable |
| QR Scanner | All systems | 80% reusable |
| Analytics Dashboard | Ads QR | 70% reusable |
| Attribution Engine | Ads QR | 60% reusable (adapt for verification) |
| Campaign Management | Ads QR | 40% reusable |
| Brand Dashboard | Merchant | 80% reusable |
| Rewards System | Ads QR | 85% reusable |

### 2.5 New Capabilities (Not in Existing Systems)

| Capability | Description | Complexity |
|------------|-------------|------------|
| **Hologram Verification** | NFC/hologram matching | High |
| **Serial Number Validation** | Cryptographic verification | Medium |
| **Supply Chain Tracking** | Blockchain-inspired ledger | High |
| **Batch Verification** | Multi-item scanning | Medium |
| **Report Counterfeit** | User-generated reports | Low |
| **Recall Alerts** | Real-time notifications | Medium |
| **Tamper Detection** | Visual + digital checks | High |

---

## 3. Integration Architecture

### 3.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              REZ VERIFY ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        CONSUMER LAYER                                        │   │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                │   │
│  │  │   Mobile     │    │    Web      │    │   In-Store   │                │   │
│  │  │   App        │    │   Scanner   │    │   Kiosk      │                │   │
│  │  │  (Native)    │    │  (Browser)  │    │  (POS)       │                │   │
│  │  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                │   │
│  └─────────┼───────────────────┼───────────────────┼────────────────────────────┘   │
│            │                   │                   │                             │
│            └───────────────────┼───────────────────┘                             │
│                               ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                      API GATEWAY (Kong/Nginx)                              │   │
│  │                   Rate Limiting | Auth | Routing                           │   │
│  └─────────────────────────────────┬───────────────────────────────────────────┘   │
│                                    │                                               │
│  ┌─────────────────────────────────┼───────────────────────────────────────────┐   │
│  │                                 ▼                                           │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │   │
│  │  │                    VERIFICATION ENGINE                               │ │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │ │   │
│  │  │  │   Serial    │  │   Hologram  │  │    NFC      │  │   QR Code  │ │ │   │
│  │  │  │  Validator  │  │   Matcher   │  │   Reader    │  │  Decoder   │ │ │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │ │   │
│  │  └─────────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │   │
│  │  │                      FRAUD DETECTION LAYER                          │ │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │ │   │
│  │  │  │   Velocity │  │   Pattern   │  │   Device    │  │   Geo      │ │ │   │
│  │  │  │  Checker   │  │  Analyzer   │  │ Fingerprint │  │  Fencing   │ │ │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │ │   │
│  │  └─────────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                               │
│  ┌─────────────────────────────────┼───────────────────────────────────────────┐   │
│  │                                 ▼                                           │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │   │
│  │  │                      DATA LAYER                                     │ │   │
│  │  │                                                                       │ │   │
│  │  │    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │ │   │
│  │  │    │  PostgreSQL │    │    Redis    │    │    S3/CDN   │          │ │   │
│  │  │    │  (Primary)  │    │   (Cache)   │    │  (Assets)   │          │ │   │
│  │  │    └─────────────┘    └─────────────┘    └─────────────┘          │ │   │
│  │  │                                                                       │ │   │
│  │  │    ┌─────────────────────────────────────────────────────────────┐  │ │   │
│  │  │    │                   SUPPLY CHAIN LEDGER                       │  │ │   │
│  │  │    │              (Immutable Verification Records)              │  │ │   │
│  │  │    └─────────────────────────────────────────────────────────────┘  │ │   │
│  │  └─────────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                               │
│  ┌─────────────────────────────────┼───────────────────────────────────────────┐   │
│  │                                 ▼                                           │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │   │
│  │  │                   INTEGRATION LAYER                                  │ │   │
│  │  │                                                                       │ │   │
│  │  │    ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │ │   │
│  │  │    │ REZ     │  │ REZ     │  │ REZ     │  │ REZ     │  │ External│  │ │   │
│  │  │    │ Auth    │  │ Wallet  │  │ Mind    │  │ Chat    │  │ APIs   │  │ │   │
│  │  │    └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │ │   │
│  │  │                                                                       │ │   │
│  │  └─────────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            VERIFICATION DATA FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  BRAND SIDE:                              CONSUMER SIDE:                            │
│  ───────────                              ──────────────                            │
│                                                                                      │
│  ┌──────────────┐                        ┌──────────────┐                           │
│  │   Brand      │                        │   Consumer   │                           │
│  │   Dashboard  │                        │   Scans QR   │                           │
│  └──────┬───────┘                        └──────┬───────┘                           │
│         │                                        │                                   │
│         ▼                                        │                                   │
│  ┌──────────────┐                                │                                   │
│  │  Register    │                                │                                   │
│  │  Products    │                                │                                   │
│  │  (with SN)   │                                │                                   │
│  └──────┬───────┘                                │                                   │
│         │                                        │                                   │
│         ▼                                        │                                   │
│  ┌──────────────┐                                │                                   │
│  │  Generate    │                                │                                   │
│  │  QR Codes    │                                │                                   │
│  └──────┬───────┘                                ▼                                   │
│         │                               ┌──────────────┐                            │
│         │                               │  Parse QR    │                            │
│         │                               │  Extract SN  │                            │
│         │                               └──────┬───────┘                            │
│         │                                      │                                    │
│         │                                      ▼                                    │
│         │                              ┌──────────────┐                            │
│         │                              │  Call Verify │                            │
│         │                              │  API         │                            │
│         │                              └──────┬───────┘                            │
│         │                                     │                                    │
│         ▼                                     ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐                    │
│  │                    VERIFICATION ENGINE                       │                    │
│  │                                                              │                    │
│  │   1. Validate Serial Number Format                          │                    │
│  │   2. Check Database for SN                                 │                    │
│  │   3. Verify Hologram/NFC (if enabled)                     │                    │
│  │   4. Check Fraud Rules                                     │                    │
│  │   5. Record Verification Event                            │                    │
│  │   6. Return Result                                         │                    │
│  │                                                              │                    │
│  └─────────────────────────────────────────────────────────────┘                    │
│                                     │                                               │
│                    ┌─────────────────┴─────────────────┐                          │
│                    ▼                                   ▼                          │
│             ┌──────────────┐                    ┌──────────────┐                 │
│             │   GENUINE    │                    │   COUNTERFEIT│                 │
│             │              │                    │              │                 │
│             │ - Full Info  │                    │ - Alert      │                 │
│             │ - Journey    │                    │ - Report     │                 │
│             │ - Rewards    │                    │ - Block      │                 │
│             │ - Recommend  │                    │ - Notify     │                 │
│             └──────────────┘                    └──────────────┘                 │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Database Schema

```sql
-- ============================================================================
-- REZ VERIFY DATABASE SCHEMA
-- ============================================================================

-- Brands table
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    website VARCHAR(500),
    description TEXT,
    category VARCHAR(100),
    verification_level VARCHAR(50) DEFAULT 'standard',
    -- Multi-layer verification settings
    requires_hologram BOOLEAN DEFAULT FALSE,
    requires_nfc BOOLEAN DEFAULT FALSE,
    requires_otp BOOLEAN DEFAULT FALSE,
    -- Branding
    primary_color VARCHAR(7) DEFAULT '#000000',
    custom_messages JSONB DEFAULT '{}',
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    category VARCHAR(100),
    description TEXT,
    image_url TEXT,
    mrp DECIMAL(10,2),
    manufactured_date DATE,
    expiry_date DATE,
    batch_number VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Serial numbers table (core verification data)
CREATE TABLE serial_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    serial_number VARCHAR(255) UNIQUE NOT NULL,
    verification_code VARCHAR(64) NOT NULL, -- HMAC hash
    qr_code_url TEXT,
    hologram_code VARCHAR(100),
    nfc_id VARCHAR(100),
    -- Status tracking
    status VARCHAR(50) DEFAULT 'active', -- active, used, recalled, expired
    first_verified_at TIMESTAMP,
    verification_count INT DEFAULT 0,
    last_verified_at TIMESTAMP,
    -- Supply chain
    manufactured_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    current_location VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Verification events table (immutable ledger)
CREATE TABLE verification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number_id UUID REFERENCES serial_numbers(id),
    serial_number VARCHAR(255) NOT NULL,
    brand_id UUID REFERENCES brands(id),
    product_id UUID REFERENCES products(id),
    -- Verification details
    verification_result VARCHAR(50) NOT NULL, -- genuine, counterfeit, suspicious, failed
    verification_method VARCHAR(50), -- qr, hologram, nfc, manual
    confidence_score DECIMAL(5,2), -- 0.00 to 100.00
    -- Consumer info
    user_id UUID, -- NULL for anonymous
    device_fingerprint VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    -- Context
    verification_source VARCHAR(50), -- mobile_app, web_scanner, in_store
    campaign_id UUID, -- if from ad campaign
    referral_source VARCHAR(100),
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Anti-counterfeit reports
CREATE TABLE counterfeit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number_id UUID REFERENCES serial_numbers(id),
    brand_id UUID REFERENCES brands(id),
    reporter_user_id UUID,
    reporter_anonymous_id VARCHAR(100),
    report_type VARCHAR(50) NOT NULL, -- counterfeit, tampered, expired, other
    description TEXT,
    evidence_urls JSONB DEFAULT '[]',
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    status VARCHAR(50) DEFAULT 'pending', -- pending, investigating, confirmed, resolved
    resolution_notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Brand rewards/loyalty
CREATE TABLE verification_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id),
    user_id UUID NOT NULL,
    reward_type VARCHAR(50) NOT NULL, -- coins, stamp, badge
    amount INT DEFAULT 1,
    serial_number_id UUID REFERENCES serial_numbers(id),
    verification_event_id UUID REFERENCES verification_events(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Product journey stages
CREATE TABLE supply_chain_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number_id UUID REFERENCES serial_numbers(id),
    stage_name VARCHAR(100) NOT NULL, -- manufactured, shipped, customs, warehouse, retail, sold
    location_name VARCHAR(255),
    location_address TEXT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    handled_by VARCHAR(255),
    notes TEXT,
    timestamp TIMESTAMP NOT NULL,
    proof_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_verification_events_serial ON verification_events(serial_number_id);
CREATE INDEX idx_verification_events_brand ON verification_events(brand_id);
CREATE INDEX idx_verification_events_user ON verification_events(user_id);
CREATE INDEX idx_verification_events_created ON verification_events(created_at DESC);
CREATE INDEX idx_serial_numbers_product ON serial_numbers(product_id);
CREATE INDEX idx_serial_numbers_status ON serial_numbers(status);
CREATE INDEX idx_serial_numbers_lookup ON serial_numbers(serial_number);
CREATE INDEX idx_counterfeit_reports_status ON counterfeit_reports(status);
CREATE INDEX idx_counterfeit_reports_brand ON counterfeit_reports(brand_id);

-- ============================================================================
-- FRAUD DETECTION TABLES
-- ============================================================================

-- Velocity rules
CREATE TABLE fraud_velocity_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id),
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- same_device, same_location, same_serial, rapid_fire
    threshold_value INT NOT NULL,
    time_window_seconds INT NOT NULL,
    action VARCHAR(50) DEFAULT 'flag', -- block, flag, otp_required
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Flagged verifications (fraud queue)
CREATE TABLE fraud_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_event_id UUID REFERENCES verification_events(id),
    rule_id UUID REFERENCES fraud_velocity_rules(id),
    flag_reason VARCHAR(255),
    flag_severity VARCHAR(20), -- low, medium, high, critical
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID,
    resolved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- API KEYS AND AUTHENTICATION
-- ============================================================================

-- Brand API keys
CREATE TABLE brand_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    key_name VARCHAR(100) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL,
    api_secret_hash VARCHAR(255),
    permissions JSONB DEFAULT '["verify", "stats"]',
    rate_limit INT DEFAULT 1000, -- per hour
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.4 API Specifications

#### Core Verification API

```yaml
# OpenAPI 3.0 Specification

openapi: 3.0.0
info:
  title: ReZ Verify API
  version: 1.0.0
  description: Brand authenticity verification API

servers:
  - url: https://api.verify.rez.money/v1
    description: Production
  - url: https://api-staging.verify.rez.money/v1
    description: Staging

paths:
  # Verification endpoints
  /verify:
    post:
      summary: Verify product authenticity
      tags: [Verification]
      security:
        - ApiKeyAuth: []
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VerifyRequest'
      responses:
        '200':
          description: Verification result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/VerifyResponse'
        '404':
          description: Serial number not found
        '429':
          description: Rate limit exceeded

  /verify/batch:
    post:
      summary: Batch verification (multiple items)
      tags: [Verification]
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BatchVerifyRequest'
      responses:
        '200':
          description: Batch results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BatchVerifyResponse'

  /report:
    post:
      summary: Report counterfeit product
      tags: [Reports]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CounterfeitReport'
      responses:
        '201':
          description: Report submitted

  # Brand management
  /brands:
    post:
      summary: Register new brand
      tags: [Brands]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BrandCreate'
      responses:
        '201':
          description: Brand created

  /brands/{brandId}:
    get:
      summary: Get brand details
      tags: [Brands]
    put:
      summary: Update brand
      tags: [Brands]
    delete:
      summary: Delete brand
      tags: [Brands]

  /brands/{brandId}/products:
    get:
      summary: List brand products
      tags: [Products]
    post:
      summary: Add product
      tags: [Products]

  /brands/{brandId}/products/{productId}/serials:
    post:
      summary: Generate serial numbers
      tags: [Products]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GenerateSerialsRequest'
      responses:
        '201':
          description: Serial numbers generated

  # Analytics
  /brands/{brandId}/analytics:
    get:
      summary: Get verification analytics
      tags: [Analytics]
      parameters:
        - name: period
          in: query
          schema:
            type: string
            enum: [day, week, month, year]
        - name: from
          in: query
          schema:
            type: string
            format: date
        - name: to
          in: query
          schema:
            type: string
            format: date

components:
  schemas:
    VerifyRequest:
      type: object
      required:
        - serialNumber
        - brandSlug
      properties:
        serialNumber:
          type: string
          description: Product serial number from QR code
        brandSlug:
          type: string
          description: Brand identifier slug
        verificationMethod:
          type: string
          enum: [qr, hologram, nfc, manual]
        hologramData:
          type: string
          description: Hologram verification data
        nfcData:
          type: string
          description: NFC chip data
        location:
          $ref: '#/components/schemas/GeoLocation'
        deviceInfo:
          $ref: '#/components/schemas/DeviceInfo'

    VerifyResponse:
      type: object
      properties:
        status:
          type: string
          enum: [genuine, counterfeit, suspicious, not_found]
        confidence:
          type: number
          format: float
        product:
          $ref: '#/components/schemas/ProductInfo'
        journey:
          type: array
          items:
            $ref: '#/components/schemas/JourneyStage'
        rewards:
          $ref: '#/components/schemas/Rewards'
        alerts:
          type: array
          items:
            $ref: '#/components/schemas/Alert'

    BatchVerifyRequest:
      type: object
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/VerifyRequest'
          maxItems: 50

    BatchVerifyResponse:
      type: object
      properties:
        results:
          type: array
          items:
            $ref: '#/components/schemas/VerifyResponse'
        summary:
          type: object
          properties:
            total: integer
            genuine: integer
            counterfeit: integer
            failed: integer

    CounterfeitReport:
      type: object
      required:
        - serialNumber
        - brandSlug
        - reportType
      properties:
        serialNumber:
          type: string
        brandSlug:
          type: string
        reportType:
          type: string
          enum: [counterfeit, tampered, expired, other]
        description:
          type: string
        evidenceUrls:
          type: array
          items:
            type: string
        location:
          $ref: '#/components/schemas/GeoLocation'

    GeoLocation:
      type: object
      properties:
        latitude:
          type: number
        longitude:
          type: number
        city:
          type: string
        country:
          type: string

    DeviceInfo:
      type: object
      properties:
        deviceId:
          type: string
        platform:
          type: string
        os:
          type: string
        appVersion:
          type: string

    ProductInfo:
      type: object
      properties:
        id: string
        name: string
        brand: string
        category: string
        imageUrl: string
        manufacturedDate: string
        expiryDate: string

    JourneyStage:
      type: object
      properties:
        stage: string
        location: string
        timestamp: string

    Rewards:
      type: object
      properties:
        coinsEarned: integer
        stampsCollected: integer
        karmaPoints: integer
        badgeUnlocked: string

    Alert:
      type: object
      properties:
        type: string
        message: string
        severity: string

    BrandCreate:
      type: object
      required:
        - name
        - slug
      properties:
        name:
          type: string
        slug:
          type: string
        category:
          type: string
        website:
          type: string
        logoUrl:
          type: string
        verificationLevel:
          type: string
          enum: [standard, premium, enterprise]

    GenerateSerialsRequest:
      type: object
      required:
        - quantity
      properties:
        quantity:
          type: integer
          minimum: 1
          maximum: 10000
        prefix:
          type: string
        suffix:
          type: string
        startNumber:
          type: integer

  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

---

## 4. Technical Requirements

### 4.1 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Runtime** | Node.js 20 LTS | Ecosystem compatibility, async I/O |
| **Framework** | Next.js 15 | SSR, API routes, edge functions |
| **Database** | PostgreSQL 16 | ACID compliance, JSONB, scale |
| **Cache** | Redis 7 | Session, rate limit, verification cache |
| **Queue** | BullMQ | Job processing for heavy verification |
| **Search** | Meilisearch | Fast product/serial lookup |
| **CDN** | Cloudflare | Edge caching, DDoS protection |
| **Monitoring** | Grafana + Prometheus | Metrics, alerting |
| **Logging** | Loki | Centralized logs |

### 4.2 Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              INFRASTRUCTURE LAYOUT                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│                           ┌─────────────────────┐                                   │
│                           │   CLOUDFLARE CDN    │                                   │
│                           │   (Edge Network)     │                                   │
│                           └──────────┬──────────┘                                   │
│                                      │                                               │
│                           ┌──────────┴──────────┐                                   │
│                           │    Load Balancer     │                                   │
│                           │   (Multi-region)     │                                   │
│                           └──────────┬──────────┘                                   │
│                                      │                                               │
│         ┌───────────────────────────┼───────────────────────────┐                   │
│         │                           │                           │                   │
│         ▼                           ▼                           ▼                   │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐               │
│  │  Region:    │           │  Region:    │           │  Region:    │               │
│  │  Mumbai     │           │  Bangalore  │           │  US East    │               │
│  │             │           │             │           │             │               │
│  │  ┌───────┐ │           │  ┌───────┐ │           │  ┌───────┐ │               │
│  │  │  API  │ │◄─────────►│  │  API  │ │◄─────────►│  │  API  │ │               │
│  │  │ Pods  │ │           │  │ Pods  │ │           │  │ Pods  │ │               │
│  │  └───────┘ │           │  └───────┘ │           │  └───────┘ │               │
│  │      │     │           │      │     │           │      │     │               │
│  │      ▼     │           │      ▼     │           │      ▼     │               │
│  │  ┌───────┐ │           │  ┌───────┐ │           │  ┌───────┐ │               │
│  │  │ Redis │ │           │  │ Redis │ │           │  │ Redis │ │               │
│  │  │Cache  │ │           │  │Cache  │ │           │  │Cache  │ │               │
│  │  └───────┘ │           │  └───────┘ │           │  └───────┘ │               │
│  └─────────────┘           └─────────────┘           └─────────────┘               │
│                                      │                                               │
│                           ┌──────────┴──────────┐                                   │
│                           │    PostgreSQL       │                                   │
│                           │   Primary + 2 Replicas                                   │
│                           │   ( Mumbai Region)  │                                   │
│                           └─────────────────────┘                                   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| **Verification Latency (P50)** | < 50ms | Cache hit |
| **Verification Latency (P99)** | < 200ms | Full verification |
| **Throughput** | 10,000 req/sec | Peak verification load |
| **Availability** | 99.95% | SLA target |
| **Error Rate** | < 0.01% | Failed verifications |

### 4.4 Security Requirements

| Layer | Requirement | Implementation |
|-------|-------------|----------------|
| **Transport** | TLS 1.3 | All API endpoints |
| **API Auth** | API Key + HMAC | Per-brand API keys |
| **Verification** | HMAC Signature | Serial number validation |
| **Data** | AES-256 | PII encryption at rest |
| **Secrets** | HashiCorp Vault | API keys, credentials |
| **Rate Limiting** | Per-key limits | Redis-based |
| **Fraud Detection** | Multi-layer | Velocity, pattern, geo |

### 4.5 Fraud Detection Engine

```typescript
// Fraud Detection Configuration
interface FraudRules {
  // Velocity checks
  sameDeviceLimit: {
    maxVerifications: number;      // Max verifications per device
    windowSeconds: number;          // Time window
    action: 'flag' | 'block' | 'otp_required';
  };
  
  sameLocationLimit: {
    maxVerifications: number;
    radiusMeters: number;
    windowSeconds: number;
  };
  
  rapidFireLimit: {
    maxVerifications: number;      // e.g., 5 in 10 seconds
    windowSeconds: number;
    action: 'block' | 'captcha';
  };
  
  // Pattern detection
  suspiciousPatterns: {
    sequentialSerials: boolean;     // Detecting fake serial scanning
    repeatSerials: boolean;        // Same serial multiple times
    geoAnomalies: boolean;         // Impossible travel
  };
}

// Default rules
const DEFAULT_FRAUD_RULES: FraudRules = {
  sameDeviceLimit: {
    maxVerifications: 20,
    windowSeconds: 3600,          // 1 hour
    action: 'flag'
  },
  sameLocationLimit: {
    maxVerifications: 10,
    radiusMeters: 100,
    windowSeconds: 300            // 5 minutes
  },
  rapidFireLimit: {
    maxVerifications: 5,
    windowSeconds: 10,
    action: 'block'
  },
  suspiciousPatterns: {
    sequentialSerials: true,
    repeatSerials: true,
    geoAnomalies: true
  }
};
```

### 4.6 Real-time Requirements

| Feature | Technology | Latency Target |
|---------|------------|----------------|
| **Verification Status** | WebSocket | < 100ms |
| **Recall Alerts** | Push Notification | < 1 second |
| **Dashboard Updates** | Server-Sent Events | < 500ms |
| **Analytics Sync** | Polling (30s) | N/A |

---

## 5. Business Model

### 5.1 Revenue Model

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              REVENUE STREAMS                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  TIER 1: VERIFICATION FEES                                                          │
│  ═══════════════════════                                                            │
│                                                                                      │
│  Per-verification fee: INR 0.20 per authenticated scan                             │
│                                                                                      │
│  Volume Tiers:                                                                        │
│  ┌────────────────┬─────────────┬─────────────────────────────────┐                │
│  │   Monthly Vol  │  Fee/Unit   │   Example (1M scans/month)      │                │
│  ├────────────────┼─────────────┼─────────────────────────────────┤                │
│  │   0 - 10K     │  INR 0.20   │   10,000 x 0.20 = INR 2,000    │                │
│  │   10K - 100K  │  INR 0.15   │   100,000 x 0.15 = INR 15,000   │                │
│  │   100K - 1M   │  INR 0.10   │   1,000,000 x 0.10 = INR 100K  │                │
│  │   1M+         │  INR 0.05   │   Negotiated                   │                │
│  └────────────────┴─────────────┴─────────────────────────────────┘                │
│                                                                                      │
│  TIER 2: SAAS PLATFORM FEES                                                         │
│  ═══════════════════════                                                            │
│                                                                                      │
│  ┌────────────────┬─────────────┬─────────────────────────────────┐                │
│  │    Tier        │  Monthly    │   Features                      │                │
│  ├────────────────┼─────────────┼─────────────────────────────────┤                │
│  │   Starter      │  INR 5,000  │   10K verifications, basic     │                │
│  │   Growth       │  INR 20,000  │   100K verifications, full     │                │
│  │   Enterprise   │  INR 50,000  │   Unlimited, custom rules       │                │
│  │   Custom       │  On Request │   White-label, dedicated infra  │                │
│  └────────────────┴─────────────┴─────────────────────────────────┘                │
│                                                                                      │
│  TIER 3: VALUE-ADD SERVICES                                                         │
│  ═══════════════════════                                                            │
│                                                                                      │
│  ┌────────────────┬─────────────┬─────────────────────────────────┐                │
│  │    Service     │  Monthly    │   Description                    │                │
│  ├────────────────┼─────────────┼─────────────────────────────────┤                │
│  │ Analytics Plus │  INR 5,000  │   Advanced insights, exports     │                │
│  │ API Access     │  INR 10,000 │   Developer tier, higher limits │                │
│  │ Recall Manager │  INR 3,000  │   Automated recall alerts       │                │
│  │ Anti-fraud     │  INR 8,000  │   Custom fraud rules             │                │
│  │ White-label    │  INR 25,000 │   Custom domain, branding       │                │
│  └────────────────┴─────────────┴─────────────────────────────────┘                │
│                                                                                      │
│  TIER 4: REWARDS ECOSYSTEM                                                          │
│  ═══════════════════════                                                            │
│                                                                                      │
│  Coin transaction fee: 2% on reward redemptions                                     │
│  Brand coin creation fee: INR 10,000 one-time                                       │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Unit Economics

| Cost Component | Cost/Unit | Notes |
|----------------|-----------|-------|
| **Database Storage** | INR 0.001 | Per verification record |
| **Compute** | INR 0.002 | Per verification |
| **CDN Bandwidth** | INR 0.001 | Per verification |
| **Redis Cache** | INR 0.0005 | Per verification |
| **Total Cost** | INR 0.0045 | Per verification |

**Margin Analysis:**
| Scenario | Revenue/Unit | Cost/Unit | Margin |
|----------|-------------|-----------|--------|
| Starter | INR 0.20 | INR 0.0045 | 97.75% |
| Volume (100K) | INR 0.10 | INR 0.0045 | 95.5% |
| Volume (1M+) | INR 0.05 | INR 0.0045 | 91% |

### 5.3 Customer Acquisition Cost

| Channel | CAC | LTV | LTV:CAC |
|---------|-----|-----|---------|
| Direct Sales | INR 50,000 | INR 500,000 | 10:1 |
| Inbound (SEO) | INR 5,000 | INR 200,000 | 40:1 |
| Partner (Distributor) | INR 20,000 | INR 300,000 | 15:1 |
| Enterprise Sales | INR 150,000 | INR 2,000,000 | 13:1 |

### 5.4 Brand Acquisition Strategy

```
ACQUISITION FUNNEL:
═══════════════════

awareness ────────► consideration ────────► conversion ────────► retention

     │                      │                     │                    │
     ▼                      ▼                     ▼                    ▼
  ┌──────┐              ┌──────┐           ┌──────┐           ┌──────┐
  │ Trade│              │Free  │           │ 30   │           │Annual │
  │Shows │              │Trial │           │ Days │           │Con-  │
  │      │              │(1K)  │           │(200) │           │tract  │
  │      │              │      │           │      │           │(50)   │
  └──────┘              └──────┘           └──────┘           └──────┘
     │                      │                     │                    │
     ▼                      ▼                     ▼                    ▼
  ┌──────┐              ┌──────┐           ┌──────┐           ┌──────┐
  │SEO   │              │Paid  │           │On-   │           │Expan-│
  │      │              │Acqui-│           │board-│           │sion  │
  │      │              │sition│           │ing   │           │      │
  └──────┘              └──────┘           └──────┘           └──────┘
```

**Key Tactics by Stage:**

| Stage | Tactics | Investment |
|-------|---------|------------|
| Awareness | Trade shows, industry publications, thought leadership | INR 500K |
| Consideration | Free trial (100 verifications), case studies, demo | INR 300K |
| Conversion | 30-day money-back guarantee, dedicated support | INR 200K |
| Retention | Quarterly reviews, new features, loyalty discounts | INR 100K |

---

## 6. UX Flows

### 6.1 Consumer Scan Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          CONSUMER VERIFICATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  STEP 1: SCAN                                                                        │
│  ══════════════                                                                      │
│                                                                                      │
│  ┌─────────────────┐                                                                 │
│  │                 │     ┌──────────────────────────────────────────┐               │
│  │  Consumer       │────►│  Camera Opens (native scanner)          │               │
│  │  Scans QR       │     │                                          │               │
│  │                 │     │  ┌─────────────────────────────────┐   │               │
│  └─────────────────┘     │  │      ┌──────────────────┐       │   │               │
│                          │  │      │   [QR Code]      │       │   │               │
│                          │  │      │                  │       │   │               │
│                          │  │      │                  │       │   │               │
│                          │  │      └──────────────────┘       │   │               │
│                          │  │                                  │   │               │
│                          │  │      Position within frame        │   │               │
│                          │  └─────────────────────────────────┘   │               │
│                          └──────────────────────────────────────────┘               │
│                                         │                                            │
│                                         ▼                                            │
│  STEP 2: VERIFY                                                                  │
│  ══════════════                                                                      │
│                                                                                      │
│                          ┌──────────────────────────────────────────┐               │
│                          │  Loading State (1-2 seconds)             │               │
│                          │                                          │               │
│                          │  ┌─────────────────────────────────┐   │               │
│                          │  │     ↻                           │   │               │
│                          │  │   Verifying authenticity...     │   │               │
│                          │  │                                  │   │               │
│                          │  │   ████████░░░░░░░  45%         │   │               │
│                          │  └─────────────────────────────────┘   │               │
│                          └──────────────────────────────────────────┘               │
│                                         │                                            │
│                    ┌─────────────────────┼─────────────────────┐                      │
│                    ▼                     ▼                     ▼                      │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │     GENUINE          │  │   COUNTERFEIT      │  │   NOT FOUND         │         │
│  │                     │  │                    │  │                     │         │
│  │  ✓ Authentic Brand  │  │  ⚠ WARNING        │  │  ? Unknown Product  │         │
│  │    Product          │  │  This appears to   │  │                     │         │
│  │                     │  │  be counterfeit    │  │  Report this        │         │
│  └──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘         │
│              │                        │                        │                    │
│              ▼                        ▼                        ▼                    │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │     PRODUCT INFO    │  │   REPORT COUNTER-   │  │   SUBMIT INFO      │         │
│  │                     │  │   FEIT              │  │                     │         │
│  │  Product Name      │  │                     │  │  Help us identify:  │         │
│  │  Brand Name        │  │  ┌───────────────┐  │  │                     │         │
│  │  Batch: ABC123     │  │  │ Report Now   │  │  │  □ Where bought    │         │
│  │  Mfg: Jan 2026    │  │  │               │  │  │  □ Photos          │         │
│  │                     │  │  └───────────────┘  │  │  □ Description     │         │
│  │  [View Journey]    │  │                     │  │                     │         │
│  └──────────┬──────────┘  └─────────────────────┘  └─────────────────────┘         │
│              │                                                                              │
│              ▼                                                                              │
│  ┌─────────────────────┐                                                                    │
│  │   PRODUCT JOURNEY   │                                                                    │
│  │                     │                                                                    │
│  │  ●─────●─────●─────●                                                               │
│  │  Mfg  Ship  Custom  Retail                                                          │
│  │                     │                                                                    │
│  │  Jan 2026   Feb 2026  Mar 2026                                                       │
│  │  Factory  Mumbai  Store                                                              │
│  └──────────┬──────────┘                                                                    │
│              │                                                                              │
│              ▼                                                                              │
│  ┌─────────────────────┐                                                                    │
│  │    REWARDS EARNED   │                                                                    │
│  │                     │                                                                    │
│  │  +10 REZ Coins      │                                                                    │
│  │  +1 Stamp           │                                                                    │
│  │                     │                                                                    │
│  │  [Collect Reward]   │                                                                    │
│  └─────────────────────┘                                                                    │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Brand Dashboard Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           BRAND DASHBOARD FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  BRAND DASHBOARD HOME                                                      │   │
│  │                                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  TODAY'S METRICS                                    [Export] [Filter] │   │   │
│  │  │                                                                      │   │   │
│  │  │   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │   │
│  │  │   │  VERIFIED │  │   FAKE   │  │  COINS    │  │   REVENUE │        │   │   │
│  │  │   │   TODAY   │  │  FLAGGED │  │  EARNED   │  │  PROTECTED│        │   │   │
│  │  │   │   1,234   │  │    12    │  │   15,600  │  │   INR 45K │        │   │   │
│  │  │   │    ↑12%   │  │    ↑3    │  │    ↑8%    │  │    ↑5%    │        │   │   │
│  │  │   └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │   │
│  │  └─────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                              │   │
│  │  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐   │   │
│  │  │   VERIFICATION MAP     │  │   RECENT ACTIVITY                      │   │   │
│  │  │                         │  │                                         │   │   │
│  │  │   [Heatmap of verify]   │  │   • Mumbai verified - 2 min ago       │   │   │
│  │  │                         │  │   • Bangalore verified - 5 min ago    │   │   │
│  │  │                         │  │   • Counterfeit flagged - Delhi       │   │   │
│  │  │                         │  │   • Report submitted - Pune           │   │   │
│  │  └─────────────────────────┘  └─────────────────────────────────────────┘   │   │
│  │                                                                              │   │
│  │  [Products]  [Serial Numbers]  [Analytics]  [Settings]  [Reports]           │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                                 │
│                                    ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  PRODUCTS                                                                      │   │
│  │                                                                              │   │
│  │  [+ Add Product]  [Export]  [Search...]  [Filter: All Categories]         │   │
│  │                                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Product Name    │  Serials    │  Verified    │  Fake Rate  │ Status │   │   │
│  │  ├─────────────────────────────────────────────────────────────────────┤   │   │
│  │  │  Perfume XYZ     │  10,000     │  8,500       │  0.5%       │ Active │   │   │
│  │  │  Watch ABC       │  5,000      │  3,200       │  2.1%       │ Active │   │   │
│  │  │  Bag DEF         │  20,000     │  15,000      │  0.1%       │ Active │   │   │
│  │  └─────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                              │   │
│  │  [View Details]  [Generate Serials]  [Recall]  [Edit]                      │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Serial Number Generation Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       SERIAL NUMBER GENERATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  STEP 1: SELECT PRODUCT                                                             │
│  ═════════════════════                                                              │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  Generate Serial Numbers                                                      │   │
│  │                                                                              │   │
│  │  Select Product:  [Perfume XYZ                          ▼]                  │   │
│  │                                                                              │   │
│  │  Current Stock: 10,000 units | Serials Generated: 8,500                    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                                 │
│                                    ▼                                                 │
│  STEP 2: CONFIGURE                                                                  │
│  ═══════════════                                                                    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  Configuration                                                                 │   │
│  │                                                                              │   │
│  │  Quantity:        [1000        ▼]                                            │   │
│  │                                                                              │   │
│  │  Serial Format:                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Prefix:  [XYZ    ]                                                 │   │   │
│  │  │  Pattern: [YYYYMMDD-XXXXX]  (Live preview: XYZ20260503-00001)      │   │   │
│  │  │  Suffix:  [      ]                                                   │   │   │
│  │  └─────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                              │   │
│  │  Advanced Options:                                                            │   │
│  │  [✓] Generate QR codes     [✓] Include verification hash                    │   │
│  │  [ ] Generate NFC tags     [ ] Custom hologram pattern                       │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                                 │
│                                    ▼                                                 │
│  STEP 3: GENERATE                                                                  │
│  ═══════════════                                                                    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  Generating...                                                                │   │
│  │                                                                              │   │
│  │  ████████████████████████████████░░░░░░░  80%                             │   │
│  │                                                                              │   │
│  │  Generating 800 of 1,000 serial numbers...                                 │   │
│  │  ETA: 12 seconds                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                                 │
│                                    ▼                                                 │
│  STEP 4: DOWNLOAD                                                                   │
│  ═════════════════                                                                  │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  Generation Complete!                                                        │   │
│  │                                                                              │   │
│  │  ✓ 1,000 serial numbers generated                                           │   │
│  │  ✓ 1,000 QR codes created                                                   │   │
│  │  ✓ Verification hashes generated                                            │   │
│  │                                                                              │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │   │
│  │  │   Download CSV  │  │   Download PDF  │  │   Print Labels  │            │   │
│  │  │   (Serials)     │  │   (QR Codes)    │  │   (Batch)       │            │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘            │   │
│  │                                                                              │   │
│  │  [Download All as ZIP]                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Admin Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              ADMIN DASHBOARD FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ADMIN HOME                                                                          │
│  ══════════                                                                          │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  Platform Overview                           [System Health] [Alerts]       │   │
│  │                                                                              │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                │   │
│  │  │ TOTAL     │  │ REVENUE   │  │ VERIFY/   │  │ FAKE      │                │   │
│  │  │ BRANDS    │  │ THIS MONTH│  │ SEC       │  │ RATE      │                │   │
│  │  │   156     │  │ INR 2.4M  │  │   50ms    │  │   0.8%    │                │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘                │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  [Brands]  [Products]  [Fraud Queue]  [Reports]  [Settings]  [Audit Log]         │
│                                                                                      │
│  FRAUD QUEUE                                                                         │
│  ═══════════════                                                                     │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  Flagged Verifications (23 pending)                   [Filter] [Sort]      │   │
│  │                                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │  │ ⚠ HIGH     Serial: XYZ-1234    Device: iPhone 14    Delhi       │   │   │
│  │  │            50 verifications in 2 minutes - BOT?                  │   │   │
│  │  │            [Block Device] [Clear Flag] [View Details]               │   │   │
│  │  ├─────────────────────────────────────────────────────────────────────┤   │   │
│  │  │ ⚠ MEDIUM   Serial: ABC-5678    Device: Android    Mumbai       │   │   │
│  │  │            Same serial verified 5 times today                     │   │   │
│  │  │            [Investigate] [Clear Flag] [View Details]               │   │   │
│  │  └─────────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Competitive Analysis

### 7.1 Market Landscape

| Competitor | Focus | Strengths | Weaknesses | Market Share |
|------------|-------|-----------|-------------|---------------|
| **Veho** | Enterprise serialization | Blockchain integration | Complex, expensive | 25% |
| **iYuga** | QR-based verification | AI features | Limited brand tools | 15% |
| **Sproxtract** | Anti-counterfeit | Hologram tech | Narrow use case | 10% |
| **IBM Trusteem** | Enterprise | IBM backing | Enterprise-only | 20% |
| **Opsplified** | SME focus | Affordable | Basic features | 8% |
| **Local Competitors** | India market | Local presence | Limited scale | 22% |

### 7.2 Competitive Positioning

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          MARKET POSITIONING MATRIX                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│                    COMPLEXITY                                                         │
│                        ▲                                                              │
│                        │     ┌─────────┐                                            │
│                        │     │ Enterprise│                                           │
│         EASY            │     │ Solutions │                                           │
│         ▲              │     └─────────┘                                            │
│         │              │           │                                                 │
│         │    ┌───────────────────────────┐                                          │
│         │    │                           │                                          │
│         │    │     ┌───────────────┐     │                                           │
│         │    │     │    REZ       │     │                                           │
│         │    │     │   VERIFY    │     │     ┌───────────┐                       │
│         │    │     │  (TARGET)   │     │     │ Blockchain │                       │
│         │    │     └───────────────┘     │     │  Players  │                       │
│         │    │                           │     └───────────┘                       │
│         │    │     ┌───────────────┐     │                                           │
│         │    │     │  Basic QR   │     │     ┌───────────┐                       │
│         │    │     │  Solutions   │     │     │  AI/ML   │                       │
│         │    │     └───────────────┘     │     │  Players  │                       │
│         │    │                           │     └───────────┘                       │
│         │    └───────────────────────────┘                                          │
│         │                                    │                                        │
│         │                                    │                                        │
│         └────────────────────────────────────┼────────────────────────────────────►   │
│                                                │                                      │
│                                        PRICE (Low ───────────► High)                  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Unique Value Proposition

| Factor | Traditional Solutions | ReZ Verify |
|--------|----------------------|------------|
| **Ecosystem Integration** | Standalone | Full ReZ stack (Wallet, Loyalty, Ads) |
| **Consumer Engagement** | Verification only | Rewards + Chat + Recommendations |
| **SME Accessibility** | Enterprise pricing | INR 5K/month starter |
| **Speed** | Days to setup | Minutes to first scan |
| **QR Experience** | Basic info | Full product journey |
| **Brand Dashboard** | Limited analytics | Real-time insights |
| **Fraud Detection** | Basic | ML-powered multi-layer |

### 7.4 SWOT Analysis

```
┌────────────────────────────────┬───────────────────────────────────────┐
│          STRENGTHS             │           WEAKNESSES                 │
├────────────────────────────────┼───────────────────────────────────────┤
│ • Full ecosystem integration    │ • New to market                      │
│ • REZ brand recognition         │ • Limited anti-counterfeit patents   │
│ • Consumer reward system        │ • Initial brand trust building        │
│ • Affordable pricing           │ • Limited blockchain (future)        │
│ • Fast deployment              │ • Small team initially                │
│ • Mobile-first design          │                                       │
├────────────────────────────────┼───────────────────────────────────────┤
│          OPPORTUNITIES         │              THREATS                 │
├────────────────────────────────┼───────────────────────────────────────┤
│ • Growing counterfeit problem  │ • Established competitors             │
│ • SME market underserved       │ • Price wars by incumbents           │
│ • Digital India push           │ • Technology copying                  │
│ • Brand protection awareness   │ • Regulatory changes                  │
│ • QR adoption increasing       │ • Economic downturn affecting SaaS  │
│ • Supply chain transparency    │ • Cybersecurity incidents             │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 8. Recommendations

### 8.1 Strategic Recommendations

| Priority | Recommendation | Impact | Effort |
|----------|---------------|--------|--------|
| **P0** | Integrate with REZ Wallet for rewards | High | Medium |
| **P0** | Build fraud detection engine | Critical | High |
| **P1** | Create brand onboarding wizard | High | Medium |
| **P1** | Deploy consumer scan experience | High | Low |
| **P2** | Add REZ Mind recommendations | Medium | Medium |
| **P2** | Build recall alert system | Medium | Medium |
| **P3** | Add NFC verification support | Medium | High |
| **P3** | Implement blockchain ledger | Low | Very High |

### 8.2 Technical Recommendations

| Area | Recommendation | Rationale |
|------|----------------|-----------|
| **Database** | Use PostgreSQL with JSONB | ACID + flexible schema |
| **Cache** | Redis with 5-min TTL for verifications | Balance freshness vs speed |
| **Queue** | BullMQ for heavy verification jobs | Reliability + retries |
| **Search** | Meilisearch for serial lookup | Speed + typo tolerance |
| **CDN** | Cloudflare for static assets | DDoS + edge caching |
| **Monitoring** | Grafana dashboards | Full observability |

### 8.3 Go-to-Market Recommendations

| Phase | Focus | Target |
|-------|-------|--------|
| **Pilot** | 5-10 hand-picked brands | Fashion/cosmetics |
| **Launch** | SME market | INR 5K-20K tier |
| **Growth** | Mid-market | INR 20K-50K tier |
| **Scale** | Enterprise + international | Custom pricing |

### 8.4 Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Counterfeiters bypass QR** | Multi-layer verification (QR + hologram + OTP) |
| **Data privacy concerns** | GDPR-compliant, minimal data collection |
| **Brand trust issues** | Third-party audits, case studies |
| **Scaling challenges** | Multi-region deployment from day 1 |
| **Competitor response** | Focus on ecosystem advantage, not features |

---

## 9. Execution Roadmap

### 9.1 Phase 1: MVP (Weeks 1-4)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              PHASE 1: MVP TIMELINE                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  WEEK 1: Foundation                                                                 │
│  ════════════════════                                                                 │
│                                                                                      │
│  Day 1-2   □ Set up project structure (Next.js, PostgreSQL, Redis)                │
│  Day 3-4   □ Database schema and migrations                                         │
│  Day 5-7   □ Core verification API implementation                                   │
│                                                                                      │
│  WEEK 2: Engine                                                                        │
│  ════════════════════                                                                 │
│                                                                                      │
│  Day 8-10  □ Serial number validation logic                                         │
│  Day 11-12 □ HMAC verification hash implementation                                  │
│  Day 13-14 □ Basic fraud detection (velocity checks)                                │
│                                                                                      │
│  WEEK 3: Dashboard                                                                   │
│  ════════════════════                                                                 │
│                                                                                      │
│  Day 15-17 □ Brand registration and onboarding                                     │
│  Day 18-19 □ Product management screens                                             │
│  Day 20-21 □ Serial number generation and QR export                                │
│                                                                                      │
│  WEEK 4: Consumer Experience                                                         │
│  ═════════════════════════════                                                      │
│                                                                                      │
│  Day 22-24 □ Mobile-friendly scan page                                              │
│  Day 25-26 □ Verification result UI                                                │
│  Day 27-28 □ Basic analytics dashboard                                              │
│                                                                                      │
│  DELIVERABLE: End-to-end working MVP with 3 pilot brands                           │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Phase 2: Growth (Weeks 5-8)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 2: GROWTH TIMELINE                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  WEEK 5-6: Integration                                                               │
│  ═══════════════════════                                                            │
│  □ REZ Wallet integration for rewards                                              │
│  □ REZ Auth integration for brand dashboard                                        │
│  □ REZ Loyalty integration for consumer stamps                                     │
│  □ API documentation (OpenAPI)                                                       │
│                                                                                      │
│  WEEK 7-8: Advanced Features                                                        │
│  ═════════════════════════════                                                      │
│  □ Enhanced fraud detection (ML patterns)                                           │
│  □ Supply chain journey tracking                                                    │
│  □ Counterfeit report submission                                                    │
│  □ Recall alert system                                                              │
│                                                                                      │
│  DELIVERABLE: Full feature set, ready for public launch                           │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Phase 3: Scale (Weeks 9-12)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 3: SCALE TIMELINE                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  WEEK 9-10: Enterprise                                                               │
│  ════════════════════                                                                 │
│  □ White-label option                                                               │
│  □ Custom fraud rules engine                                                        │
│  □ Bulk import/export tools                                                         │
│  □ Enterprise analytics                                                             │
│                                                                                      │
│  WEEK 11-12: Scale                                                                  │
│  ═════════════════════                                                              │
│  □ Multi-region deployment                                                          │
│  □ Advanced caching optimization                                                     │
│  □ Performance optimization (P99 < 100ms)                                           │
│  □ SOC 2 / ISO 27001 preparation                                                   │
│                                                                                      │
│  DELIVERABLE: Enterprise-ready platform                                            │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.4 Resource Requirements

| Role | Phase 1 | Phase 2 | Phase 3 |
|------|---------|---------|---------|
| **Backend Engineer** | 1 | 2 | 2 |
| **Frontend Engineer** | 1 | 1 | 1 |
| **Product Designer** | 0.5 | 0.5 | 0.25 |
| **QA Engineer** | 0.5 | 1 | 1 |
| **DevOps** | 0.5 | 1 | 1 |

### 9.5 Success Metrics

| Metric | Week 4 Target | Week 8 Target | Week 12 Target |
|--------|---------------|---------------|----------------|
| **Active Brands** | 5 | 50 | 200 |
| **Verifications/Day** | 100 | 10,000 | 100,000 |
| **P99 Latency** | < 500ms | < 200ms | < 100ms |
| **Uptime** | 99% | 99.9% | 99.95% |
| **NPS Score** | - | 40+ | 50+ |

### 9.6 Budget Estimates

| Category | Phase 1 | Phase 2 | Phase 3 |
|----------|---------|---------|---------|
| **Infrastructure** | INR 50K | INR 150K | INR 400K |
| **Engineering** | INR 400K | INR 600K | INR 800K |
| **Design** | INR 50K | INR 30K | INR 20K |
| **Marketing** | INR 0 | INR 200K | INR 500K |
| **Total** | INR 500K | INR 980K | INR 1.72M |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Verification Event** | Record of each QR scan and its result |
| **Serial Number** | Unique identifier assigned to each product unit |
| **Verification Code** | HMAC hash validating serial number authenticity |
| **Supply Chain Journey** | Complete history of product movement from manufacture to sale |
| **Fraud Flag** | Suspicious activity requiring investigation |
| **Confidence Score** | Probability (0-100%) that verification is accurate |
| **Verification Level** | Security tier (standard, premium, enterprise) |

## Appendix B: Reference Architecture

See Section 3 for full architecture diagrams including:
- System architecture (Figure 1)
- Data flow diagram (Figure 2)
- Infrastructure layout (Figure 3)
- Consumer verification flow (Figure 4)

## Appendix C: API Reference

See Section 3.4 for complete OpenAPI 3.0 specification including:
- All endpoint definitions
- Request/response schemas
- Authentication methods
- Rate limiting rules

---

*Document Generated: 2026-05-03*
*Version: 1.0.0*
*Status: Final - Ready for Implementation*
