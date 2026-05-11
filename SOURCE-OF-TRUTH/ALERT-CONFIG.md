# Alert Configuration Guide

This document provides comprehensive instructions for setting up alerting infrastructure including PagerDuty, Slack webhooks, alert routing, and escalation policies for the ReZ platform.

## Table of Contents

1. [PagerDuty Setup](#1-pagerduty-setup)
2. [Slack Webhook Setup](#2-slack-webhook-setup)
3. [Alert Routing Rules](#3-alert-routing-rules)
4. [Escalation Policies](#4-escalation-policies)
5. [Integration Code](#5-integration-code)

---

## 1. PagerDuty Setup

### Prerequisites

- PagerDuty account with Admin or Manager permissions
- Service account for API access
- ReZ infrastructure access

### Step 1: Create PagerDuty Account and Access API Key

1. Log in to [PagerDuty](https://app.pagerduty.com)
2. Navigate to **Integrations** > **API Access**
3. Click **Create New API Key**
4. Enter a descriptive name: `rez-alerting-key`
5. Copy and securely store the API key

```
API Key Format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

### Step 2: Create Services in PagerDuty

Create separate services for each ReZ microservice domain:

| Service Name | Prefix | Description |
|--------------|--------|-------------|
| ReZ - Core API | `rez-core-api` | Main API gateway and core services |
| ReZ - ML Services | `rez-ml-services` | ML model registry and feature store |
| ReZ - Ad Platform | `rez-ad-platform` | Advertisement serving and targeting |
| ReZ - Order Services | `rez-order-services` | Order processing and management |
| ReZ - Payment Services | `rez-payment-services` | Payment processing and wallet |
| ReZ - Infrastructure | `rez-infra` | Kubernetes, databases, caches |

#### Screenshot Reference: Create Service

```
┌─────────────────────────────────────────────────────────────┐
│  PagerDuty Dashboard                                        │
│  ─────────────────────────────────────────────────────────  │
│  [Services] → [+ New Service]                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Service Name: [ReZ - Core API                    ]  │    │
│  │ Description:  [Core API Gateway Service         ]  │    │
│  │ Team:         [Platform Team                   ]  │    │
│  │ Escalation:   [ReZ Default Escalation Policy   ]  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Integration Settings:                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Integration Type: [Prometheus Alerting v2        ]  │    │
│  │ Integration Name: [rez-core-api-prometheus       ]  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Alert Filtering:                                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ □ Enable alert grouping by:                         │    │
│  │   [x] Service                                        │    │
│  │   [x] Alert priority                                 │    │
│  │ □ Suppress duplicate alerts within: [5 minutes]     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [Cancel]                              [Create Service]     │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Configure Alert Integration

For each service, set up the Prometheus Alerting integration:

1. Navigate to **Services** > **[Service Name]** > **Integrations**
2. Click **Add integration**
3. Select **Prometheus Alerting v2**
4. Configure the integration settings:

```
Integration Settings:
├── Integration Name: [service-specific-name]
├── Filter by: [severity]
│   ├── Critical: Trigger immediately
│   ├── Error: Trigger immediately
│   ├── Warning: Trigger after 5 minutes
│   └── Info: Do not page (log only)
└── Grouping: [Time-based - 5 minutes]
```

### Step 4: Create Service API Key

For each service, create a dedicated API key:

```bash
# Example: Create service-specific integration
curl -X POST https://api.pagerduty.com/api-keys \
  -H "Authorization: Token token=$PD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": {
      "description": "rez-core-api-integration",
      "scopes": ["read", "write"]
    }
  }'
```

### Step 5: Verify Integration

Test the integration by triggering a test alert:

```bash
# Send test incident to PagerDuty
curl -X POST https://events.pagerduty.com/v2/enqueue \
  -H "Content-Type: application/json" \
  -d '{
    "routing_key": "<INTEGRATION_KEY>",
    "event_action": "trigger",
    "dedup_key": "test-alert-$(date +%s)",
    "payload": {
      "summary": "[TEST] PagerDuty Integration Verification",
      "source": "rez-alert-config",
      "severity": "critical",
      "custom_details": {
        "service": "alert-config-test",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
      }
    }
  }'
```

---

## 2. Slack Webhook Setup

### Step 1: Create Slack App

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click **Create New App** > **From scratch**
3. Enter app name: `ReZ Alerts`
4. Select your workspace

### Step 2: Enable Incoming Webhooks

1. In the left sidebar, click **Features** > **Incoming Webhooks**
2. Toggle **Activate Incoming Webhooks** to ON
3. Click **Add New Webhook to Workspace**
4. Select the appropriate channel for each alert type

### Step 3: Configure Webhook Channels

Create separate channels and webhooks:

| Channel Name | Webhook URL Variable | Alert Type |
|--------------|---------------------|------------|
| `#rez-alerts-critical` | `SLACK_WEBHOOK_CRITICAL` | Critical incidents requiring immediate action |
| `#rez-alerts-warning` | `SLACK_WEBHOOK_WARNING` | Warnings and non-critical issues |
| `#rez-alerts-resolved` | `SLACK_WEBHOOK_RESOLVED` | Alert resolution notifications |
| `#rez-alerts-info` | `SLACK_WEBHOOK_INFO` | Informational logs and metrics |

### Step 4: Configure Webhook Settings

```
Webhook Configuration:
├── App Home Messages: [Enabled]
├── Message Permissions: [Only allow bots]
├── Socket Mode: [Disabled - use webhooks directly]
└── OAuth Scopes: [chat:write, channels:read]
```

### Step 5: Set Environment Variables

```bash
# Add to your environment configuration
export SLACK_WEBHOOK_CRITICAL="https://hooks.slack.com/services/XXX/YYY/ZZZ"
export SLACK_WEBHOOK_WARNING="https://hooks.slack.com/services/XXX/YYY/ZZZ"
export SLACK_WEBHOOK_RESOLVED="https://hooks.slack.com/services/XXX/YYY/ZZZ"
export SLACK_WEBHOOK_INFO="https://hooks.slack.com/services/XXX/YYY/ZZZ"
```

### Step 6: Test Webhook Integration

```bash
# Test Slack webhook
curl -X POST "$SLACK_WEBHOOK_CRITICAL" \
  -H 'Content-Type: application/json' \
  -d '{
    "text": ":rotating_light: *Test Alert* - Slack webhook integration verified",
    "blocks": [
      {
        "type": "header",
        "text": {"type": "plain_text", "text": "Test Alert", "emoji": true}
      },
      {
        "type": "section",
        "text": {"type": "mrkdwn", "text": "*Status:* Successful integration test"}
      }
    ]
  }'
```

---

## 3. Alert Routing Rules

### Overview

Alert routing determines how alerts flow through the system based on severity, service, and time of day.

### Routing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Alert Source                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Prometheus │  │   Logs      │  │   Custom    │              │
│  │ Metrics    │  │   (ELK)     │  │   Health    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          ▼                                       │
│              ┌───────────────────────┐                         │
│              │   Alert Manager       │                         │
│              │   (Central Router)    │                         │
│              └───────────┬───────────┘                         │
│                          │                                       │
│         ┌────────────────┼────────────────┐                    │
│         ▼                ▼                ▼                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │  Critical   │ │   Warning   │ │    Info     │              │
│  │   Route     │ │   Route     │ │   Route     │              │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘              │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │  PagerDuty  │ │   Slack     │ │   Slack     │              │
│  │  + Slack    │ │   Only      │ │   Info Ch   │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Routing Rules Configuration

Create `alert-routing-rules.yaml`:

```yaml
# alert-routing-rules.yaml
version: "1.0"

# Default routing configuration
default_routes:
  critical:
    - pagerduty: true
      slack_channel: "#rez-alerts-critical"
      snooze_duration: 0  # No snooze for critical
    - slack: true
      webhook: "${SLACK_WEBHOOK_CRITICAL}"
  warning:
    - pagerduty: false
    - slack: true
      webhook: "${SLACK_WEBHOOK_WARNING}"
      snooze_duration: 15m
  info:
    - slack: true
      webhook: "${SLACK_WEBHOOK_INFO}"
      snooze_duration: null

# Service-specific routing overrides
service_routes:
  rez-payment-services:
    critical:
      - pagerduty: true
        urgency: high
        assignee: "payment-oncall"
      - slack: true
        webhook: "${SLACK_WEBHOOK_CRITICAL}"
        mention: "@payment-team"
    warning:
      - slack: true
        webhook: "${SLACK_WEBHOOK_WARNING}"
        mention: "@payment-team"
    info:
      - slack: true
        webhook: "${SLACK_WEBHOOK_INFO}"

  rez-ml-services:
    critical:
      - pagerduty: true
        urgency: high
        assignee: "ml-platform-oncall"
    warning:
      - slack: true
        webhook: "${SLACK_WEBHOOK_WARNING}"
      - pagerduty: false
        auto_resolve: true

  rez-ad-platform:
    warning:
      - slack: true
        webhook: "${SLACK_WEBHOOK_WARNING}"
        threshold: 5  # Page if > 5 warnings in 5 minutes

# Time-based routing
time_based_routing:
  # Business hours (Mon-Fri, 9AM-6PM local time)
  business_hours:
    days: [1, 2, 3, 4, 5]
    hours: [9, 10, 11, 12, 13, 14, 15, 16, 17]
    timezone: "Asia/Kolkata"
    routes:
      critical:
        - pagerduty: true
          escalation_delay: 5m  # Wait 5 minutes before escalating
      warning:
        - slack: true
          webhook: "${SLACK_WEBHOOK_WARNING}"
        - pagerduty: false

  # After hours
  after_hours:
    routes:
      critical:
        - pagerduty: true
          urgency: high
          escalation_delay: 2m
      warning:
        - pagerduty: true
          urgency: low
          escalation_delay: 15m

# Alert deduplication rules
deduplication:
  window: 5m
  fields:
    - alertname
    - service
    - instance
  group_by:
    - service
    - severity
```

### Prometheus Alert Manager Integration

Configure `alertmanager.yml`:

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m
  slack_api_url: '${SLACK_WEBHOOK_CRITICAL}'

# PagerDuty integration
pagerduty_configs:
  - service_key: '${PAGERDUTY_SERVICE_KEY}'
    routing_key: '${PAGERDUTY_ROUTING_KEY}'
    severity_map:
      critical: critical
      error: error
      warning: warning
      info: info
    component_map:
      rez-core-api: Core API
      rez-ml-services: ML Services
      rez-ad-platform: Ad Platform
      rez-payment-services: Payment Services
    group_by: ['alertname', 'service', 'severity']

# Slack integration
slack_configs:
  - api_url: '${SLACK_WEBHOOK_CRITICAL}'
    channel: '#rez-alerts-critical'
    severity_config:
      critical: '#rez-alerts-critical'
      warning: '#rez-alerts-warning'
      info: '#rez-alerts-info'
    title: '{{ .GroupLabels.alertname }}'
    title_link: '{{ .GroupLabels.dashboard_url }}'
    text: >-
      {{ range .Alerts }}{{ if .Annotations.summary }}*{{ .Annotations.summary }}*
      {{ end }}
      Service: {{ .Labels.service }}
      Severity: {{ .Labels.severity }}
      {{ if .Annotations.description }}{{ .Annotations.description }}{{ end }}
    fields:
      - title: Status
        value: '{{ .Status }}'
        short: true
      - title: Service
        value: '{{ .Labels.service }}'
        short: true
      - title: Severity
        value: '{{ .Labels.severity }}'
        short: true
    footer: '{{ .GroupLabels.service }} | {{ now | printf "2006-01-02 15:04:05 MST" }}'
    color: >
      {{ if eq .Status "firing" }}danger{{ else }}good{{ end }}

# Inhibition rules
inhibit_rules:
  # Suppress info alerts when warning exists for same service
  - source_match:
      severity: 'warning'
    target_match:
      severity: 'info'
    source_match_re:
      service: '.*'
    target_match_re:
      service: '.*'

  # Suppress warning alerts when critical exists for same service
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    source_match_re:
      service: '.*'
    target_match_re:
      service: '.*'
```

---

## 4. Escalation Policies

### Escalation Policy Structure

```
┌─────────────────────────────────────────────────────────────┐
│                  Escalation Timeline                         │
│                                                              │
│  0 min    ──► Immediate notification                        │
│           │                                                 │
│           ▼                                                 │
│  5 min    ──► Level 1: Primary on-call                       │
│           │    (PagerDuty + Slack)                          │
│           ▼                                                 │
│  10 min   ──► Level 2: Secondary on-call                     │
│           │    (PagerDuty + Slack)                          │
│           ▼                                                 │
│  20 min   ──► Level 3: Team lead                            │
│           │    (PagerDuty + Slack + SMS)                    │
│           ▼                                                 │
│  30 min   ──► Level 4: Engineering manager                  │
│           │    (PagerDuty + Slack + SMS + Phone call)       │
│           ▼                                                 │
│  45 min   ──► Level 5: CTO                                  │
│           │    (PagerDuty + Slack + SMS + Phone call)       │
│           ▼                                                 │
│  60 min   ──► Resolve as unassigned                         │
│              (Generate post-mortem ticket)                   │
└─────────────────────────────────────────────────────────────┘
```

### PagerDuty Escalation Policy Configuration

#### Policy 1: ReZ Default Escalation

```yaml
# escalation-policy-default.yaml
name: "ReZ Default Escalation"
description: "Standard escalation for most services"
num_loops: 3  # Repeat cycle 3 times before resolving

levels:
  - level: 1
    name: "Primary On-Call"
    delay: 5m
    targets:
      - type: oncall
        id: "REZ_PRIMARY_ONCALL_SCHEDULE"
    notify:
      - pagerduty
      - slack
      - sms

  - level: 2
    name: "Secondary On-Call"
    delay: 5m
    targets:
      - type: oncall
        id: "REZ_SECONDARY_ONCALL_SCHEDULE"
    notify:
      - pagerduty
      - slack
      - sms

  - level: 3
    name: "Team Lead"
    delay: 10m
    targets:
      - type: user
        id: "team-lead"
    notify:
      - pagerduty
      - slack
      - sms
      - phone_call
```

#### Policy 2: ReZ Payment Services (Higher Urgency)

```yaml
# escalation-policy-payments.yaml
name: "ReZ Payment Services Escalation"
description: "Accelerated escalation for payment-critical incidents"
num_loops: 2
auto_resolve_delay: 30m

levels:
  - level: 1
    name: "Payment Primary On-Call"
    delay: 2m  # Faster response for payments
    targets:
      - type: oncall
        id: "REZ_PAYMENT_PRIMARY_ONCALL"
    notify:
      - pagerduty
      - slack
      - sms

  - level: 2
    name: "Payment Secondary On-Call"
    delay: 3m
    targets:
      - type: oncall
        id: "REZ_PAYMENT_SECONDARY_ONCALL"
    notify:
      - pagerduty
      - slack
      - sms
      - phone_call

  - level: 3
    name: "Payment Team Lead"
    delay: 5m
    targets:
      - type: user_group
        id: "payment-team-leads"
    notify:
      - pagerduty
      - slack
      - sms
      - phone_call

  - level: 4
    name: "Engineering Director"
    delay: 10m
    targets:
      - type: user
        id: "engineering-director"
    notify:
      - pagerduty
      - slack
      - sms
      - phone_call
```

#### Policy 3: ReZ Infrastructure (Critical Systems)

```yaml
# escalation-policy-infra.yaml
name: "ReZ Infrastructure Escalation"
description: "Immediate escalation for infrastructure issues"
num_loops: 1  # Don't repeat - always escalate
auto_resolve_delay: 15m

levels:
  - level: 1
    name: "Infra On-Call"
    delay: 1m
    targets:
      - type: oncall
        id: "REZ_INFRA_ONCALL"
    notify:
      - pagerduty
      - slack
      - sms
      - phone_call  # Phone call immediately for infra

  - level: 2
    name: "Infra Secondary"
    delay: 2m
    targets:
      - type: oncall
        id: "REZ_INFRA_SECONDARY"
    notify:
      - pagerduty
      - slack
      - sms
      - phone_call

  - level: 3
    name: "Site Reliability Lead"
    delay: 3m
    targets:
      - type: user
        id: "sre-lead"
    notify:
      - pagerduty
      - slack
      - sms
      - phone_call

  - level: 4
    name: "CTO"
    delay: 5m
    targets:
      - type: user
        id: "cto"
    notify:
      - pagerduty
      - slack
      - sms
      - phone_call
```

### On-Call Schedule Configuration

```yaml
# oncall-schedule.yaml
schedules:
  rez_primary_oncall:
    rotation:
      - period: 1 week
        users:
          - week1: "user-1@example.com"
          - week2: "user-2@example.com"
          - week3: "user-3@example.com"
          - week4: "user-4@example.com"
    handoff_day: monday
    handoff_time: "09:00 Asia/Kolkata"
    override_policy:
      max_consecutive_days: 2
      require_approval_from: "team-lead"

  rez_payment_oncall:
    rotation:
      - period: 3 days  # More frequent rotation for payments
        users:
          - day1: "payment-engineer-1@example.com"
          - day2: "payment-engineer-2@example.com"
          - day3: "payment-engineer-3@example.com"
    handoff_day: every_day
    handoff_time: "10:00 Asia/Kolkata"

  rez_infra_oncall:
    rotation:
      - period: 1 week
        users:
          - week1: "sre-1@example.com"
          - week2: "sre-2@example.com"
          - week3: "sre-3@example.com"
          - week4: "sre-4@example.com"
    handoff_day: monday
    handoff_time: "09:00 UTC"
```

---

## 5. Integration Code

### 5.1 Node.js Alert Client

```typescript
// packages/@rez/shared-types/src/alerts/alert-client.ts
import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';

export type AlertSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface AlertPayload {
  title: string;
  message: string;
  severity: AlertSeverity;
  service: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  source?: string;
}

export interface PagerDutyPayload {
  routing_key: string;
  event_action: 'trigger' | 'acknowledge' | 'resolve';
  dedup_key?: string;
  payload: {
    summary: string;
    source: string;
    severity: AlertSeverity;
    timestamp: string;
    component?: string;
    group?: string;
    class?: string;
    custom_details?: Record<string, unknown>;
  };
}

export interface SlackPayload {
  text: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: Array<{ type: string; text: string }>;
}

export interface SlackAttachment {
  color: string;
  title?: string;
  text?: string;
  fields?: Array<{ title: string; value: string; short: boolean }>;
  footer?: string;
  ts?: number;
}

export class AlertClient extends EventEmitter {
  private pagerdutyKey: string;
  private slackWebhooks: Record<AlertSeverity, string>;
  private httpClient: AxiosInstance;
  private serviceName: string;

  constructor(config: {
    pagerdutyKey: string;
    slackWebhooks: Partial<Record<AlertSeverity, string>>;
    serviceName: string;
  }) {
    super();
    this.pagerdutyKey = config.pagerdutyKey;
    this.slackWebhooks = {
      critical: config.slackWebhooks.critical || '',
      error: config.slackWebhooks.error || '',
      warning: config.slackWebhooks.warning || '',
      info: config.slackWebhooks.info || '',
    };
    this.serviceName = config.serviceName;
    this.httpClient = axios.create({ timeout: 5000 });
  }

  private getSlackWebhook(severity: AlertSeverity): string {
    // Map error to critical for routing
    if (severity === 'error') {
      return this.slackWebhooks.critical;
    }
    return this.slackWebhooks[severity];
  }

  private buildSlackMessage(alert: AlertPayload): SlackPayload {
    const severityEmoji = {
      critical: ':rotating_light:',
      error: ':x:',
      warning: ':warning:',
      info: ':information_source:',
    }[alert.severity];

    const severityColor = {
      critical: '#dc3545',
      error: '#fd7e14',
      warning: '#ffc107',
      info: '#17a2b8',
    }[alert.severity];

    return {
      text: `${severityEmoji} *${alert.title}*`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${severityEmoji} ${alert.title}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: alert.message,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Service:*\n${alert.service}` },
            { type: 'mrkdwn', text: `*Severity:*\n${alert.severity}` },
            {
              type: 'mrkdwn',
              text: `*Time:*\n${alert.timestamp || new Date().toISOString()}`,
            },
          ],
        },
        ...(alert.metadata ? [{ type: 'section', text: { type: 'mrkdwn', text: `*Details:*\n${JSON.stringify(alert.metadata, null, 2)}` } }] : []),
      ],
      attachments: [
        {
          color: severityColor,
          footer: `${this.serviceName} | ${new Date().toISOString()}`,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };
  }

  private buildPagerDutyPayload(alert: AlertPayload, dedupKey?: string): PagerDutyPayload {
    return {
      routing_key: this.pagerdutyKey,
      event_action: 'trigger',
      dedup_key: dedupKey || `${this.serviceName}-${alert.title}-${Date.now()}`,
      payload: {
        summary: `[${alert.severity.toUpperCase()}] ${alert.title} - ${alert.service}`,
        source: this.serviceName,
        severity: alert.severity,
        timestamp: alert.timestamp || new Date().toISOString(),
        component: alert.service,
        group: alert.service,
        class: 'alert',
        custom_details: {
          message: alert.message,
          ...alert.metadata,
        },
      },
    };
  }

  async sendAlert(alert: AlertPayload): Promise<{ success: boolean; errors?: string[] }> {
    const errors: string[] = [];
    const dedupKey = `${this.serviceName}-${alert.title}`;

    // Send to Slack
    const slackWebhook = this.getSlackWebhook(alert.severity);
    if (slackWebhook) {
      try {
        const slackPayload = this.buildSlackMessage(alert);
        await this.httpClient.post(slackWebhook, slackPayload);
        this.emit('slack:sent', alert);
      } catch (error) {
        const errorMsg = `Slack notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        this.emit('slack:error', error);
      }
    }

    // Send to PagerDuty for critical and error
    if (alert.severity === 'critical' || alert.severity === 'error') {
      if (this.pagerdutyKey) {
        try {
          const pdPayload = this.buildPagerDutyPayload(alert, dedupKey);
          await this.httpClient.post(
            'https://events.pagerduty.com/v2/enqueue',
            pdPayload
          );
          this.emit('pagerduty:sent', alert);
        } catch (error) {
          const errorMsg = `PagerDuty notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          this.emit('pagerduty:error', error);
        }
      }
    }

    this.emit('alert:sent', alert);
    return { success: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }

  async resolveAlert(alert: AlertPayload): Promise<void> {
    if (this.pagerdutyKey) {
      const dedupKey = `${this.serviceName}-${alert.title}`;
      try {
        await this.httpClient.post('https://events.pagerduty.com/v2/enqueue', {
          routing_key: this.pagerdutyKey,
          event_action: 'resolve',
          dedup_key: dedupKey,
          payload: {
            summary: `[RESOLVED] ${alert.title}`,
            source: this.serviceName,
            severity: 'info',
            timestamp: new Date().toISOString(),
          },
        });
        this.emit('pagerduty:resolved', alert);
      } catch (error) {
        this.emit('pagerduty:resolve_error', error);
      }
    }

    // Send resolution to Slack
    const slackWebhook = this.getSlackWebhook(alert.severity);
    if (slackWebhook) {
      try {
        await this.httpClient.post(slackWebhook, {
          text: `:white_check_mark: *RESOLVED:* ${alert.title}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `:white_check_mark: *Alert Resolved*\n\n*Service:* ${alert.service}\n*Summary:* ${alert.title}`,
              },
            },
          ],
        });
        this.emit('slack:resolved', alert);
      } catch (error) {
        this.emit('slack:resolve_error', error);
      }
    }
  }
}

// Factory function
export function createAlertClient(config: {
  pagerdutyKey: string;
  slackWebhooks: Partial<Record<AlertSeverity, string>>;
  serviceName: string;
}): AlertClient {
  return new AlertClient(config);
}
```

### 5.2 Express Middleware for Health Check Alerts

```typescript
// packages/@rez/shared-types/src/alerts/health-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AlertClient, AlertSeverity, AlertPayload } from './alert-client';

interface HealthCheckConfig {
  alertClient: AlertClient;
  checkInterval?: number;
  memoryThreshold?: number;
  cpuThreshold?: number;
}

export function createHealthAlertMiddleware(config: HealthCheckConfig) {
  const { alertClient, memoryThreshold = 0.85, cpuThreshold = 0.9 } = config;

  let lastAlertTime = 0;
  const alertCooldown = 5 * 60 * 1000; // 5 minutes between alerts

  return async (req: Request, res: Response, next: NextFunction) => {
    // Check memory usage
    const memUsage = process.memoryUsage();
    const heapUsedPercent = memUsage.heapUsed / memUsage.heapTotal;

    if (heapUsedPercent > memoryThreshold) {
      const now = Date.now();
      if (now - lastAlertTime > alertCooldown) {
        const alert: AlertPayload = {
          title: 'High Memory Usage Detected',
          message: `Memory usage at ${(heapUsedPercent * 100).toFixed(1)}%`,
          severity: heapUsedPercent > 0.9 ? 'critical' : 'warning',
          service: process.env.SERVICE_NAME || 'unknown',
          metadata: {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024),
            rss: Math.round(memUsage.rss / 1024 / 1024),
          },
        };

        await alertClient.sendAlert(alert);
        lastAlertTime = now;
      }
    }

    // Attach health info to request
    (req as any).healthInfo = {
      memory: {
        heapUsedPercent: Math.round(heapUsedPercent * 100) / 100,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    next();
  };
}
```

### 5.3 Kubernetes Deployment with Alert Sidecar

```yaml
# kubernetes/alert-sidecar.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rez-service-deployment
  labels:
    app: rez-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rez-service
  template:
    metadata:
      labels:
        app: rez-service
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
    spec:
      containers:
        # Main application container
        - name: rez-service
          image: rez/service:latest
          ports:
            - containerPort: 3000
          env:
            - name: PAGERDUTY_ROUTING_KEY
              valueFrom:
                secretKeyRef:
                  name: rez-alert-secrets
                  key: pagerduty-routing-key
            - name: SLACK_WEBHOOK_CRITICAL
              valueFrom:
                secretKeyRef:
                  name: rez-alert-secrets
                  key: slack-webhook-critical
            - name: SLACK_WEBHOOK_WARNING
              valueFrom:
                secretKeyRef:
                  name: rez-alert-secrets
                  key: slack-webhook-warning
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5

        # Alert sidecar container
        - name: alert-sidecar
          image: rez/alert-sidecar:latest
          env:
            - name: SERVICE_NAME
              value: "rez-service"
            - name: PAGERDUTY_ROUTING_KEY
              valueFrom:
                secretKeyRef:
                  name: rez-alert-secrets
                  key: pagerduty-routing-key
            - name: SLACK_WEBHOOK_CRITICAL
              valueFrom:
                secretKeyRef:
                  name: rez-alert-secrets
                  key: slack-webhook-critical
            - name: METRICS_ENDPOINT
              value: "http://localhost:3000/metrics"
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "200m"
```

### 5.4 Prometheus Alert Rules

```yaml
# prometheus/alerts/rez-services.yaml
groups:
  - name: rez-service-alerts
    interval: 30s
    rules:
      # Service availability
      - alert: RezServiceDown
        expr: up{job=~"rez-.*"} == 0
        for: 1m
        labels:
          severity: critical
          service: "{{ $labels.job }}"
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.job }} has been down for more than 1 minute"
          runbook_url: "https://runbooks.rez.com/service-down"

      # High error rate
      - alert: RezHighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
            /
            sum(rate(http_requests_total[5m])) by (service)
          ) > 0.05
        for: 2m
        labels:
          severity: critical
          service: "{{ $labels.service }}"
        annotations:
          summary: "High error rate in {{ $labels.service }}"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"

      # Latency alerts
      - alert: RezHighLatency
        expr: |
          histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)) > 2
        for: 5m
        labels:
          severity: warning
          service: "{{ $labels.service }}"
        annotations:
          summary: "High latency in {{ $labels.service }}"
          description: "p99 latency is {{ $value }}s (threshold: 2s)"

      # Memory usage
      - alert: RezHighMemoryUsage
        expr: |
          (
            container_memory_usage_bytes{container=~"rez-.*"}
            /
            container_spec_memory_limit_bytes{container=~"rez-.*"}
          ) > 0.85
        for: 5m
        labels:
          severity: warning
          service: "{{ $labels.container }}"
        annotations:
          summary: "High memory usage in {{ $labels.service }}"
          description: "Memory usage is {{ $value | humanizePercentage }} of limit"

      # CPU usage
      - alert: RezHighCPUUsage
        expr: |
          rate(container_cpu_usage_seconds_total{container=~"rez-.*"}[5m]) > 0.9
        for: 10m
        labels:
          severity: warning
          service: "{{ $labels.container }}"
        annotations:
          summary: "High CPU usage in {{ $labels.service }}"
          description: "CPU usage is {{ $value | humanizePercentage }}"

      # Database connection pool
      - alert: RezDatabaseConnectionPoolExhausted
        expr: |
          sum(db_pool_connections_used{job=~"rez-.*"}) by (job) 
          / 
          sum(db_pool_connections_total{job=~"rez-.*"}) by (job) > 0.9
        for: 2m
        labels:
          severity: critical
          service: "{{ $labels.job }}"
        annotations:
          summary: "Database connection pool exhausted"
          description: "{{ $labels.job }} connection pool at {{ $value | humanizePercentage }}"

      # Kafka consumer lag
      - alert: RezKafkaConsumerLag
        expr: |
          kafka_consumer_lag_seconds{job=~"rez-.*"} > 1000
        for: 5m
        labels:
          severity: warning
          service: "{{ $labels.job }}"
        annotations:
          summary: "Kafka consumer lag detected"
          description: "Consumer lag is {{ $value }} seconds"

      # ML model inference errors
      - alert: RezMLModelInferenceErrors
        expr: |
          (
            sum(rate(ml_inference_requests_total{status="error"}[5m])) by (model, service)
            /
            sum(rate(ml_inference_requests_total[5m])) by (model, service)
          ) > 0.01
        for: 2m
        labels:
          severity: critical
          service: "{{ $labels.service }}"
        annotations:
          summary: "ML model inference errors"
          description: "Model {{ $labels.model }} has {{ $value | humanizePercentage }} error rate"

      # Payment service specific
      - alert: RezPaymentServiceErrorRate
        expr: |
          (
            sum(rate(payment_transactions_total{status=~"failed|declined"}[5m])) by (service)
            /
            sum(rate(payment_transactions_total[5m])) by (service)
          ) > 0.02
        for: 1m
        labels:
          severity: critical
          service: "{{ $labels.service }}"
        annotations:
          summary: "High payment failure rate"
          description: "Payment failure rate is {{ $value | humanizePercentage }} (threshold: 2%)"
          runbook_url: "https://runbooks.rez.com/payment-failures"
```

### 5.5 Environment Configuration Example

```bash
# .env.alerts.example

# PagerDuty Configuration
PAGERDUTY_ROUTING_KEY=your-pagerduty-integration-key
PAGERDUTY_SERVICE_ID=RXXXXXXXX

# Slack Webhooks
SLACK_WEBHOOK_CRITICAL=https://hooks.slack.com/services/XXX/YYY/ZZZ
SLACK_WEBHOOK_WARNING=https://hooks.slack.com/services/XXX/YYY/ZZZ
SLACK_WEBHOOK_RESOLVED=https://hooks.slack.com/services/XXX/YYY/ZZZ
SLACK_WEBHOOK_INFO=https://hooks.slack.com/services/XXX/YYY/ZZZ

# Alert Settings
ALERT_COOLDOWN_MINUTES=5
ALERT_BATCH_SIZE=10
ALERT_RETRY_ATTEMPTS=3
ALERT_RETRY_DELAY_MS=1000

# Service Metadata
SERVICE_NAME=rez-service-name
SERVICE_VERSION=1.0.0
DEPLOYMENT_ENV=production
```

---

## Appendix: Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| PagerDuty alerts not arriving | Wrong routing key | Verify integration key matches PagerDuty service |
| Slack webhook 404 | Webhook URL expired | Regenerate webhook from Slack app settings |
| Duplicate alerts | No deduplication key | Ensure consistent `dedup_key` is used |
| Alerts not escalating | Wrong escalation policy | Check service is assigned to correct policy |
| Phone calls not triggering | User not configured for phone | Add phone number to PagerDuty user profile |

### Verification Commands

```bash
# Test PagerDuty integration
curl -X POST https://events.pagerduty.com/v2/enqueue \
  -H "Content-Type: application/json" \
  -d '{"routing_key":"YOUR_KEY","event_action":"trigger","payload":{"summary":"Test"}}'

# Test Slack webhook
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test message"}'

# Check Prometheus alert rules syntax
promtool check rules /path/to/alerts.yaml

# Check AlertManager config syntax
amtool check-config /path/to/alertmanager.yml
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-04 | Claude | Initial alert configuration guide |

---

*Last Updated: 2026-05-04*
