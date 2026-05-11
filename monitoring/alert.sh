#!/bin/bash
# =============================================================================
# Alert Script - Multi-channel alert notifications
# =============================================================================
# Supports: Slack, PagerDuty, Email, Webhooks
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${SCRIPT_DIR}/config"

# =============================================================================
# Configuration
# =============================================================================

# Load environment variables from config
if [[ -f "${CONFIG_DIR}/alerting.env" ]]; then
    source "${CONFIG_DIR}/alerting.env"
fi

# Alert thresholds (can be overridden by env vars)
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
PAGERDUTY_ROUTING_KEY="${PAGERDUTY_ROUTING_KEY:-}"
EMAIL_TO="${EMAIL_TO:-}"
EMAIL_FROM="${EMAIL_FROM:-localhost}"
WEBHOOK_URL="${WEBHOOK_URL:-}"
FLOCK_WEBHOOK_URL="${FLOCK_WEBHOOK_URL:-}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"

# Alert settings
ALERT_COOLDOWN="${ALERT_COOLDOWN:-300}"  # Seconds before re-alerting for same issue
LOG_FILE="${SCRIPT_DIR}/logs/alerts.log"
STATE_DIR="${SCRIPT_DIR}/state"

# Severity levels
SEVERITY_CRITICAL="critical"
SEVERITY_WARNING="warning"
SEVERITY_INFO="info"

# =============================================================================
# Helper Functions
# =============================================================================

log_alert() {
    local severity="$1"
    local service="$2"
    local message="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[${timestamp}] [${severity}] [${service}] ${message}" >> "${LOG_FILE}"

    # Also log to stdout
    case "${severity}" in
        critical) echo -e "\033[0;31m[CRITICAL] [${service}] ${message}\033[0m" ;;
        warning)  echo -e "\033[1;33m[WARNING] [${service}] ${message}\033[0m" ;;
        info)     echo -e "\033[0;32m[INFO] [${service}] ${message}\033[0m" ;;
    esac
}

get_alert_state_key() {
    local service="$1"
    local alert_type="$2"
    echo "${STATE_DIR}/.alert_${service}_${alert_type}"
}

should_send_alert() {
    local service="$1"
    local alert_type="$2"
    local state_file
    state_file=$(get_alert_state_key "${service}" "${alert_type}")

    # Create state directory
    mkdir -p "${STATE_DIR}"

    # Check if we've alerted recently
    if [[ -f "${state_file}" ]]; then
        local last_alert
        last_alert=$(cat "${state_file}")
        local now
        now=$(date +%s)
        local elapsed=$((now - last_alert))

        if [[ ${elapsed} -lt ${ALERT_COOLDOWN} ]]; then
            log_alert "${SEVERITY_INFO}" "${service}" "Alert suppressed (cooldown: ${elapsed}s remaining)"
            return 1
        fi
    fi

    # Update state
    date +%s > "${state_file}"
    return 0
}

clear_alert_state() {
    local service="$1"
    local alert_type="$2"
    local state_file
    state_file=$(get_alert_state_key "${service}" "${alert_type}")
    rm -f "${state_file}"
}

# =============================================================================
# Slack Integration
# =============================================================================

send_slack() {
    local severity="$1"
    local service="$2"
    local message="$3"
    local details="${4:-}"
    local webhook_url="${5:-${SLACK_WEBHOOK_URL}}"

    if [[ -z "${webhook_url}" ]]; then
        log_alert "${SEVERITY_INFO}" "${service}" "Slack webhook not configured"
        return 0
    fi

    # Color based on severity
    local color
    case "${severity}" in
        critical) color="#FF0000" ;;
        warning)  color="#FFA500" ;;
        info)     color="#36A64F" ;;
    esac

    # Build Slack payload
    local payload
    payload=$(cat << EOF
{
    "attachments": [
        {
            "color": "${color}",
            "title": "${severity^^} Alert: ${service}",
            "text": "${message}",
            "fields": [
                {
                    "title": "Severity",
                    "value": "${severity}",
                    "short": true
                },
                {
                    "title": "Timestamp",
                    "value": "$(date '+%Y-%m-%d %H:%M:%S')",
                    "short": true
                }
            ],
            "footer": "ReZ Monitoring",
            "ts": $(date +%s)
        }
    ]
}
EOF
)

    # Add details if provided
    if [[ -n "${details}" ]]; then
        payload=$(echo "${payload}" | jq '.attachments[0].fields += [{"title": "Details", "value": $details, "short": false}]' --arg details "${details}")
    fi

    # Send to Slack
    local response
    response=$(curl -s -X POST \
        -H 'Content-Type: application/json' \
        -d "${payload}" \
        "${webhook_url}" 2>&1) || {
        log_alert "${SEVERITY_WARNING}" "${service}" "Failed to send Slack alert: ${response}"
        return 1
    }

    if echo "${response}" | grep -q '"ok":true'; then
        log_alert "${SEVERITY_INFO}" "${service}" "Slack alert sent successfully"
        return 0
    else
        log_alert "${SEVERITY_WARNING}" "${service}" "Slack alert failed: ${response}"
        return 1
    fi
}

# =============================================================================
# PagerDuty Integration
# =============================================================================

send_pagerduty() {
    local severity="$1"
    local service="$2"
    local message="$3"
    local details="${4:-}"
    local routing_key="${5:-${PAGERDUTY_ROUTING_KEY}}"

    if [[ -z "${routing_key}" ]]; then
        log_alert "${SEVERITY_INFO}" "${service}" "PagerDuty routing key not configured"
        return 0
    fi

    # Map severity to PagerDuty urgency
    local urgency
    local dedup_key="rez-${service}-$(date +%Y%m%d)"
    case "${severity}" in
        critical) urgency="high" ;;
        warning)  urgency="low" ;;
        info)     urgency="low" ;;
    esac

    # Build PagerDuty payload
    local payload
    payload=$(cat << EOF
{
    "routing_key": "${routing_key}",
    "event_action": "trigger",
    "dedup_key": "${dedup_key}",
    "payload": {
        "summary": "[${severity^^}] ${service}: ${message}",
        "source": "rez-monitoring",
        "severity": "${severity}",
        "custom_details": {
            "service": "${service}",
            "message": "${message}",
            "details": "${details}",
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
        }
    },
    "links": [
        {
            "href": "https://rez-monitoring.example.com/services/${service}",
            "text": "View in Monitoring Dashboard"
        }
    ]
}
EOF
)

    # Send to PagerDuty Events API v2
    local response
    response=$(curl -s -X POST \
        -H 'Content-Type: application/json' \
        -d "${payload}" \
        'https://events.pagerduty.com/v2/enqueue' 2>&1) || {
        log_alert "${SEVERITY_WARNING}" "${service}" "Failed to send PagerDuty alert: ${response}"
        return 1
    }

    if echo "${response}" | grep -q '"status":"success"'; then
        log_alert "${SEVERITY_INFO}" "${service}" "PagerDuty alert sent successfully"
        return 0
    else
        log_alert "${SEVERITY_WARNING}" "${service}" "PagerDuty alert failed: ${response}"
        return 1
    fi
}

# =============================================================================
# Email Integration
# =============================================================================

send_email() {
    local severity="$1"
    local service="$2"
    local message="$3"
    local details="${4:-}"
    local to_email="${5:-${EMAIL_TO}}"

    if [[ -z "${to_email}" ]]; then
        log_alert "${SEVERITY_INFO}" "${service}" "Email recipient not configured"
        return 0
    fi

    local subject="[${severity^^}] ReZ Alert: ${service}"

    local body=$(cat << EOF
ReZ Monitoring Alert
====================

Severity: ${severity^^}
Service: ${service}
Time: $(date '+%Y-%m-%d %H:%M:%S %Z')

Message:
${message}

${details:+Details:
${details}}

---
This alert was generated automatically by ReZ Monitoring.
To configure alert preferences, edit the alerting configuration.
EOF
)

    # Try different mail sending methods
    if command -v sendmail &> /dev/null; then
        echo -e "${body}" | sendmail -f "${EMAIL_FROM}" "${to_email}"
    elif command -v mail &> /dev/null; then
        echo -e "${body}" | mail -s "${subject}" "${to_email}"
    elif command -v mutt &> /dev/null; then
        echo -e "${body}" | mutt -s "${subject}" "${to_email}"
    else
        log_alert "${SEVERITY_WARNING}" "${service}" "No mail sending tool available (sendmail/mail/mutt)"
        return 1
    fi

    log_alert "${SEVERITY_INFO}" "${service}" "Email alert sent to ${to_email}"
    return 0
}

# =============================================================================
# Generic Webhook Integration
# =============================================================================

send_webhook() {
    local severity="$1"
    local service="$2"
    local message="$3"
    local details="${4:-}"
    local webhook="${5:-${WEBHOOK_URL}}"

    if [[ -z "${webhook}" ]]; then
        log_alert "${SEVERITY_INFO}" "${service}" "Webhook URL not configured"
        return 0
    fi

    local payload=$(cat << EOF
{
    "alert": {
        "severity": "${severity}",
        "service": "${service}",
        "message": "${message}",
        "details": "${details}",
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    }
}
EOF
)

    local response
    response=$(curl -s -X POST \
        -H 'Content-Type: application/json' \
        -d "${payload}" \
        "${webhook}" 2>&1) || {
        log_alert "${SEVERITY_WARNING}" "${service}" "Failed to send webhook: ${response}"
        return 1
    }

    log_alert "${SEVERITY_INFO}" "${service}" "Webhook alert sent"
    return 0
}

# =============================================================================
# Discord Integration
# =============================================================================

send_discord() {
    local severity="$1"
    local service="$2"
    local message="$3"
    local details="${4:-}"
    local webhook_url="${5:-${DISCORD_WEBHOOK_URL}}"

    if [[ -z "${webhook_url}" ]]; then
        log_alert "${SEVERITY_INFO}" "${service}" "Discord webhook not configured"
        return 0
    fi

    local color
    case "${severity}" in
        critical) color=15158332 ;;  # Red
        warning)  color=15105570 ;;  # Orange
        info)     color=3066993  ;;  # Green
    esac

    local payload=$(cat << EOF
{
    "embeds": [
        {
            "title": "${severity^^} Alert: ${service}",
            "description": "${message}",
            "color": ${color},
            "fields": [
                {
                    "name": "Severity",
                    "value": "${severity}",
                    "inline": true
                },
                {
                    "name": "Time",
                    "value": "$(date '+%Y-%m-%d %H:%M:%S')",
                    "inline": true
                }
            ],
            "footer": {
                "text": "ReZ Monitoring"
            },
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
        }
    ]
}
EOF
)

    if [[ -n "${details}" ]]; then
        payload=$(echo "${payload}" | jq ".embeds[0].fields += [{\"name\": \"Details\", \"value\": \"${details}\", \"inline\": false}]")
    fi

    curl -s -X POST \
        -H 'Content-Type: application/json' \
        -d "${payload}" \
        "${webhook_url}" > /dev/null 2>&1

    log_alert "${SEVERITY_INFO}" "${service}" "Discord alert sent"
    return 0
}

# =============================================================================
# Flock Integration
# =============================================================================

send_flock() {
    local severity="$1"
    local service="$2"
    local message="$3"
    local details="${4:-}"
    local webhook_url="${5:-${FLOCK_WEBHOOK_URL}}"

    if [[ -z "${webhook_url}" ]]; then
        log_alert "${SEVERITY_INFO}" "${service}" "Flock webhook not configured"
        return 0
    fi

    local emoji
    case "${severity}" in
        critical) emoji=" :rotating_light: " ;;
        warning)  emoji=" :warning: " ;;
        info)     emoji=" :information_source: " ;;
    esac

    local flock_message="${emoji} *${service}* - ${message}"

    if [[ -n "${details}" ]]; then
        flock_message="${flock_message}\n\n${details}"
    fi

    local payload=$(cat << EOF
{
    "text": "${flock_message}",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)

    curl -s -X POST \
        -H 'Content-Type: application/json' \
        -d "${payload}" \
        "${webhook_url}" > /dev/null 2>&1

    log_alert "${SEVERITY_INFO}" "${service}" "Flock alert sent"
    return 0
}

# =============================================================================
# Resolve Alert (PagerDuty)
# =============================================================================

resolve_pagerduty() {
    local service="$1"
    local routing_key="${2:-${PAGERDUTY_ROUTING_KEY}}"

    if [[ -z "${routing_key}" ]]; then
        return 0
    fi

    local dedup_key="rez-${service}-$(date +%Y%m%d)"

    local payload=$(cat << EOF
{
    "routing_key": "${routing_key}",
    "event_action": "resolve",
    "dedup_key": "${dedup_key}"
}
EOF
)

    curl -s -X POST \
        -H 'Content-Type: application/json' \
        -d "${payload}" \
        'https://events.pagerduty.com/v2/enqueue' > /dev/null 2>&1

    clear_alert_state "${service}" "pagerduty"
    log_alert "${SEVERITY_INFO}" "${service}" "PagerDuty alert resolved"
    return 0
}

# =============================================================================
# Main Alert Function
# =============================================================================

send_alert() {
    local severity="$1"
    local service="$2"
    local message="$3"
    local details="${4:-}"

    # Ensure log directory exists
    mkdir -p "${SCRIPT_DIR}/logs"

    log_alert "${severity}" "${service}" "${message}"

    # Check cooldown
    if ! should_send_alert "${service}" "${severity}"; then
        return 0
    fi

    # Send to all configured channels
    local failed_channels=()
    local success_channels=()

    # Slack
    if [[ -n "${SLACK_WEBHOOK_URL}" ]]; then
        send_slack "${severity}" "${service}" "${message}" "${details}" && \
            success_channels+=("Slack") || \
            failed_channels+=("Slack")
    fi

    # PagerDuty (only for critical/warning)
    if [[ -n "${PAGERDUTY_ROUTING_KEY}" ]] && \
       [[ "${severity}" == "${SEVERITY_CRITICAL}" || "${severity}" == "${SEVERITY_WARNING}" ]]; then
        send_pagerduty "${severity}" "${service}" "${message}" "${details}" && \
            success_channels+=("PagerDuty") || \
            failed_channels+=("PagerDuty")
    fi

    # Email
    if [[ -n "${EMAIL_TO}" ]]; then
        send_email "${severity}" "${service}" "${message}" "${details}" && \
            success_channels+=("Email") || \
            failed_channels+=("Email")
    fi

    # Generic Webhook
    if [[ -n "${WEBHOOK_URL}" ]]; then
        send_webhook "${severity}" "${service}" "${message}" "${details}" && \
            success_channels+=("Webhook") || \
            failed_channels+=("Webhook")
    fi

    # Discord
    if [[ -n "${DISCORD_WEBHOOK_URL}" ]]; then
        send_discord "${severity}" "${service}" "${message}" "${details}" && \
            success_channels+=("Discord") || \
            failed_channels+=("Discord")
    fi

    # Flock
    if [[ -n "${FLOCK_WEBHOOK_URL}" ]]; then
        send_flock "${severity}" "${service}" "${message}" "${details}" && \
            success_channels+=("Flock") || \
            failed_channels+=("Flock")
    fi

    # Summary
    if [[ ${#success_channels[@]} -gt 0 ]]; then
        log_alert "${SEVERITY_INFO}" "${service}" "Alert sent via: ${success_channels[*]}"
    fi

    if [[ ${#failed_channels[@]} -gt 0 ]]; then
        log_alert "${SEVERITY_WARNING}" "${service}" "Failed to send via: ${failed_channels[*]}"
    fi

    # Return error if all channels failed
    if [[ ${#success_channels[@]} -eq 0 && ${#failed_channels[@]} -gt 0 ]]; then
        return 1
    fi

    return 0
}

# =============================================================================
# Usage
# =============================================================================

usage() {
    cat << EOF
Usage: $(basename "$0") <severity> <service> <message> [details]

Send alerts to configured notification channels.

ARGUMENTS:
    severity    Alert severity: critical, warning, info
    service     Name of the service being alerted
    message     Brief description of the alert
    details     Additional details (optional)

ENVIRONMENT VARIABLES:
    SLACK_WEBHOOK_URL       Slack webhook URL
    PAGERDUTY_ROUTING_KEY   PagerDuty Integration Key
    EMAIL_TO                Email recipient address
    EMAIL_FROM              Email sender address
    WEBHOOK_URL             Generic webhook URL
    DISCORD_WEBHOOK_URL     Discord webhook URL
    FLOCK_WEBHOOK_URL       Flock webhook URL
    ALERT_COOLDOWN          Seconds between repeated alerts (default: 300)

EXAMPLES:
    $(basename "$0") critical api-service "API is down" "Connection timeout after 30s"
    $(basename "$0") warning database "High latency" "Avg response: 2000ms"

EOF
}

# =============================================================================
# Main
# =============================================================================

main() {
    local severity="${1:-}"
    local service="${2:-}"
    local message="${3:-}"
    local details="${4:-}"

    if [[ -z "${severity}" ]] || [[ -z "${service}" ]] || [[ -z "${message}" ]]; then
        usage
        exit 1
    fi

    # Validate severity
    case "${severity}" in
        critical|warning|info) ;;
        *)
            echo "Error: Invalid severity '${severity}'"
            echo "Valid values: critical, warning, info"
            exit 1
            ;;
    esac

    send_alert "${severity}" "${service}" "${message}" "${details}"
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
