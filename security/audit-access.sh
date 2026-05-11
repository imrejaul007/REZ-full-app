#!/bin/bash
#
# audit-access.sh - Secret access audit script for ReZ Full App
# Audits access patterns, detects anomalies, and generates compliance reports
#
# Usage: ./audit-access.sh [--report=<type>] [--days=<N>]
#   --report     Type of report (full|summary|compliance|anomaly)
#   --days       Number of days to look back (default: 30)
#   --output     Output format (text|json|html)
#
# Cron setup (daily audit recommended):
#   0 4 * * * /Users/rejaulkarim/Documents/ReZ\ Full\ App/security/audit-access.sh >> /var/log/secret-audit.log 2>&1
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="/Users/rejaulkarim/Documents/ReZ Full App"
LOG_FILE="$PROJECT_ROOT/security/audit.log"
AUDIT_DIR="$PROJECT_ROOT/security/audit-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAYS_BACK=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Flags
REPORT_TYPE="full"
OUTPUT_FORMAT="text"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --report=*)
            REPORT_TYPE="${1#*=}"
            shift
            ;;
        --days=*)
            DAYS_BACK="${1#*=}"
            shift
            ;;
        --output=*)
            OUTPUT_FORMAT="${1#*=}"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --report=TYPE   Report type (full|summary|compliance|anomaly)"
            echo "  --days=N        Days to look back (default: 30)"
            echo "  --output=FORMAT Output format (text|json|html)"
            echo "  --help, -h      Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message"
    echo -e "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

info() { log "INFO" "${BLUE}$1${NC}"; }
success() { log "SUCCESS" "${GREEN}$1${NC}"; }
warn() { log "WARN" "${YELLOW}$1${NC}"; }
error() { log "ERROR" "${RED}$1${NC}"; }

# ==========================================
# SECTION 1: Secret Inventory Audit
# ==========================================
audit_secret_inventory() {
    info "Auditing secret inventory..."

    local inventory=()
    local secret_count=0

    # Scan for .env files
    while IFS= read -r env_file; do
        if [[ -f "$env_file" ]]; then
            local service_name
            service_name=$(basename "$(dirname "$env_file")")

            local secrets_found
            secrets_found=$(grep -cE "^(JWT_|DB_|DB|PASSWORD|SECRET|KEY|TOKEN|API_|ENCRYPTION|REDIS_|RAZORPAY|STRIPE|CLOUDINARY|AWS|SOCKET)" "$env_file" 2>/dev/null || echo 0)

            inventory+=("{\"file\":\"$env_file\",\"service\":\"$service_name\",\"secrets\":$secrets_found}")

            if [[ "$secrets_found" -gt 0 ]]; then
                info "  Found $secrets_found secrets in $env_file"
                ((secret_count+=secrets_found))
            fi
        fi
    done < <(find "$PROJECT_ROOT" -maxdepth 4 -name ".env*" -type f 2>/dev/null)

    echo "$secret_count secrets found across all services"
    echo "${inventory[@]}" | jq -s '.' 2>/dev/null || echo "${inventory[@]}"
}

# ==========================================
# SECTION 2: Secret Age Audit
# ==========================================
audit_secret_age() {
    info "Auditing secret age..."

    local max_age_days=90
    local old_secrets=()

    while IFS= read -r env_file; do
        if [[ -f "$env_file" ]]; then
            local file_age_days
            file_age_days=$(find "$env_file" -type f -mtime +1 2>/dev/null | head -1 | xargs -I{} stat -f "%Sm" {} 2>/dev/null | xargs -I{} python3 -c "from datetime import datetime; print((datetime.now() - datetime.strptime('{}', '%b %d %H:%M:%S %Y')).days)" 2>/dev/null || echo "0")

            # Check backup age
            local backup_age=0
            local backup_file="${env_file}.backup."*
            if ls "${env_file}.backup."* &>/dev/null; then
                backup_age=$(find "${env_file}.backup."* -type f -mtime +1 2>/dev/null | head -1 | xargs -I{} stat -f "%Sm" {} 2>/dev/null | xargs -I{} python3 -c "from datetime import datetime; print((datetime.now() - datetime.strptime('{}', '%b %d %H:%M:%S %Y')).days)" 2>/dev/null || echo "0")
            fi

            if [[ $file_age_days -gt $max_age_days ]]; then
                old_secrets+=("{\"file\":\"$env_file\",\"age_days\":$file_age_days,\"type\":\"env_file\"}")
                warn "  OLD: $env_file (age: $file_age_days days)"
            fi

            if [[ $backup_age -gt 30 ]]; then
                warn "  OLD BACKUP: $env_file backup (age: $backup_age days)"
            fi
        fi
    done < <(find "$PROJECT_ROOT" -maxdepth 4 -name ".env*" -type f 2>/dev/null)

    if [[ ${#old_secrets[@]} -gt 0 ]]; then
        warn "Found ${#old_secrets[@]} secrets older than $max_age_days days"
        echo "${old_secrets[@]}" | jq -s '.' 2>/dev/null || true
    else
        success "All secrets are within rotation policy ($max_age_days days)"
    fi
}

# ==========================================
# SECTION 3: Access Pattern Audit
# ==========================================
audit_access_patterns() {
    info "Auditing access patterns..."

    local access_log="$AUDIT_DIR/access-log-${TIMESTAMP}.json"

    # Create access log entry
    cat > "$access_log" <<EOF
{
    "timestamp": "$TIMESTAMP",
    "audited_by": "audit-access.sh",
    "days_back": $DAYS_BACK,
    "access_events": []
}
EOF

    # Check git history for secret-related commits
    local secret_commits
    secret_commits=$(cd "$PROJECT_ROOT" && git log --since="${DAYS_BACK} days ago" --oneline --all -- "*secret*" "*password*" "*key*" "*token*" 2>/dev/null | wc -l || echo "0")

    info "  Git commits mentioning secrets in last $DAYS_BACK days: $secret_commits"

    # Check for recent secret rotations
    if [[ -d "$PROJECT_ROOT/security/backups" ]]; then
        local recent_rotations
        recent_rotations=$(find "$PROJECT_ROOT/security/backups" -type d -mtime -"$DAYS_BACK" 2>/dev/null | wc -l || echo "0")
        info "  Secret rotations in last $DAYS_BACK days: $recent_rotations"
    fi

    success "Access patterns audited"
}

# ==========================================
# SECTION 4: Configuration Security Audit
# ==========================================
audit_configuration() {
    info "Auditing configuration security..."

    local issues=()

    # Check for hardcoded secrets in code
    local hardcoded_secrets
    hardcoded_secrets=$(find "$PROJECT_ROOT" -type f \( -name "*.ts" -o -name "*.js" \) \
        -not -path "*/node_modules/*" \
        -not -path "*/dist/*" \
        -exec grep -l -E "(password|secret|api_key).*=.*['\"][a-zA-Z0-9]{20,}['\"]" {} \; 2>/dev/null || true)

    if [[ -n "$hardcoded_secrets" ]]; then
        issues+=("{\"type\":\"hardcoded_secret\",\"files\":$(echo "$hardcoded_secrets" | jq -R -s 'split("\n")[:-1]')}")
        warn "Found files with potential hardcoded secrets:"
        echo "$hardcoded_secrets" | while read -r f; do
            warn "  - $f"
        done
    fi

    # Check .env files for staging/production configs
    while IFS= read -r env_file; do
        if grep -qE "(localhost|127\.0\.0\.1|stage|staging)" "$env_file" 2>/dev/null; then
            if [[ "$env_file" == *"/.env" ]] || [[ "$env_file" == *"/.env.production"* ]]; then
                issues+=("{\"type\":\"dev_config_in_prod\",\"file\":\"$env_file\"}")
                warn "  Development config found in: $env_file"
            fi
        fi
    done < <(find "$PROJECT_ROOT" -maxdepth 3 -name ".env*" -type f 2>/dev/null)

    # Check for missing HTTPS enforcement
    local backend_env="$PROJECT_ROOT/rezbackend/rez-backend-master/.env"
    if [[ -f "$backend_env" ]]; then
        if ! grep -qE "(FORCE_HTTPS|HTTPS_ONLY|SECURE_COOKIE)" "$backend_env" 2>/dev/null; then
            issues+=("{\"type\":\"missing_https_enforcement\",\"file\":\"$backend_env\"}")
            warn "  HTTPS enforcement not configured in backend"
        fi
    fi

    # Check JWT expiry settings
    if grep -qE "(JWT_EXPIRY|JWT_ACCESS_EXPIRY).*=.*[0-9]{2,}[dhm]" "$backend_env" 2>/dev/null; then
        local jwt_expiry
        jwt_expiry=$(grep -E "JWT.*EXPIRY" "$backend_env" | head -1)
        info "  JWT expiry config: $jwt_expiry"

        # Warn if expiry is too long
        if echo "$jwt_expiry" | grep -qE "[0-9]{1,2}d"; then
            issues+=("{\"type\":\"jwt_expiry_too_long\",\"value\":\"$jwt_expiry\"}")
            warn "  JWT expiry is in days - consider using shorter expiry for production"
        fi
    fi

    echo "${issues[@]}" | jq -s '.' 2>/dev/null || echo "Configuration audit complete"
}

# ==========================================
# SECTION 5: Compliance Report
# ==========================================
generate_compliance_report() {
    info "Generating compliance report..."

    local report_file="$AUDIT_DIR/compliance-report-${TIMESTAMP}.${OUTPUT_FORMAT}"
    mkdir -p "$AUDIT_DIR"

    case "$OUTPUT_FORMAT" in
        json)
            cat > "$report_file" <<EOF
{
    "report_type": "security_compliance",
    "generated": "$TIMESTAMP",
    "period_days": $DAYS_BACK,
    "findings": {
        "secret_inventory": $(audit_secret_inventory 2>/dev/null || echo "{}"),
        "secret_age_issues": [],
        "access_pattern_issues": [],
        "configuration_issues": []
    },
    "compliance_status": "REVIEW_REQUIRED",
    "next_steps": [
        "Review all findings",
        "Address critical issues within 24 hours",
        "Schedule secret rotation if needed",
        "Update documentation"
    ]
}
EOF
            ;;
        html)
            cat > "$report_file" <<'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
    <title>Security Compliance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #2c3e50; color: white; padding: 20px; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #3498db; }
        .warning { background: #fff3cd; border-color: #ffc107; }
        .error { background: #f8d7da; border-color: #dc3545; }
        .success { background: #d4edda; border-color: #28a745; }
        h2 { color: #2c3e50; }
        .meta { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Security Compliance Report</h1>
        <p class="meta">Generated: TIMESTAMP_PLACEHOLDER</p>
    </div>
HTMLEOF
            sed -i '' "s/TIMESTAMP_PLACEHOLDER/$TIMESTAMP/" "$report_file"
            cat >> "$report_file" <<'HTMLEOF'
    <div class="section">
        <h2>Audit Summary</h2>
        <p>Run this script with --report=full for detailed findings.</p>
    </div>
</body>
</html>
HTMLEOF
            ;;
        *)
            cat > "$report_file" <<EOF
========================================
SECURITY COMPLIANCE REPORT
========================================
Generated:      $TIMESTAMP
Period:         Last $DAYS_BACK days
Report Type:    $REPORT_TYPE
========================================

SECTION 1: SECRET INVENTORY
----------------------------
$(audit_secret_inventory 2>/dev/null || echo "Audit complete")

SECTION 2: SECRET AGE AUDIT
----------------------------
$(audit_secret_age 2>/dev/null || echo "Audit complete")

SECTION 3: ACCESS PATTERNS
--------------------------
$(audit_access_patterns 2>/dev/null || echo "Audit complete")

SECTION 4: CONFIGURATION SECURITY
----------------------------------
$(audit_configuration 2>/dev/null || echo "Audit complete")

========================================
COMPLIANCE STATUS: REVIEW_REQUIRED
========================================

NEXT STEPS:
1. Review all findings above
2. Address critical issues within 24 hours
3. Run secret rotation if needed
4. Update documentation

========================================
EOF
            ;;
    esac

    success "Report generated: $report_file"
    echo "$report_file"
}

# ==========================================
# SECTION 6: Anomaly Detection
# ==========================================
detect_anomalies() {
    info "Detecting access anomalies..."

    local anomalies=()

    # Check for new/unknown .env files
    local new_env_files
    new_env_files=$(find "$PROJECT_ROOT" -maxdepth 3 -name ".env*" -type f -mtime -"$DAYS_BACK" 2>/dev/null || true)

    if [[ -n "$new_env_files" ]]; then
        warn "New .env files detected in last $DAYS_BACK days:"
        echo "$new_env_files" | while read -r f; do
            warn "  - $f (NEW)"
            anomalies+=("{\"type\":\"new_env_file\",\"file\":\"$f\"}")
        done
    fi

    # Check for unexpected access to secret directories
    if [[ -d "$PROJECT_ROOT/security" ]]; then
        local unusual_access
        unusual_access=$(find "$PROJECT_ROOT/security" -type f -mtime -"$DAYS_BACK" ! -name "*.md" ! -name "*.sh" 2>/dev/null | wc -l || echo "0")

        if [[ "$unusual_access" -gt 0 ]]; then
            info "  Unusual files in security directory: $unusual_access"
        fi
    fi

    # Check for failed backup restorations
    local failed_backups
    failed_backups=$(find "$PROJECT_ROOT" -name "*.backup.failed" -type f 2>/dev/null | wc -l || echo "0")

    if [[ "$failed_backups" -gt 0 ]]; then
        anomalies+=("{\"type\":\"failed_backups\",\"count\":$failed_backups}")
        error "Found $failed_backups failed backup restoration attempts"
    fi

    # Check for suspicious git activity
    local suspicious_commits
    suspicious_commits=$(cd "$PROJECT_ROOT" && git log --since="${DAYS_BACK} days ago" --all --oneline 2>/dev/null | grep -iE "(bypass|remove.*auth|disable.*security| temp.*fix|test.*commit)" | wc -l || echo "0")

    if [[ "$suspicious_commits" -gt 0 ]]; then
        anomalies+=("{\"type\":\"suspicious_commits\",\"count\":$suspicious_commits}")
        warn "Found $suspicious_commits potentially suspicious commits"
    fi

    # Summary
    if [[ ${#anomalies[@]} -eq 0 ]]; then
        success "No anomalies detected"
    else
        warn "Detected ${#anomalies[@]} anomalies"
        echo "${anomalies[@]}" | jq -s '.' 2>/dev/null || true
    fi
}

# ==========================================
# SECTION 7: Risk Assessment
# ==========================================
assess_risk() {
    info "Performing risk assessment..."

    local risk_score=0
    local risk_factors=()

    # Check secret rotation status
    if [[ -d "$PROJECT_ROOT/security/backups" ]]; then
        local last_rotation
        last_rotation=$(find "$PROJECT_ROOT/security/backups" -type d -mtime -90 2>/dev/null | wc -l || echo "0")

        if [[ "$last_rotation" -eq 0 ]]; then
            risk_score=$((risk_score + 30))
            risk_factors+=("No secret rotation in 90+ days")
        fi
    fi

    # Check for exposed secrets in git history
    local exposed_history
    exposed_history=$(cd "$PROJECT_ROOT" && git log --all -S "password\s*=" --oneline 2>/dev/null | wc -l || echo "0")

    if [[ "$exposed_history" -gt 0 ]]; then
        risk_score=$((risk_score + 25))
        risk_factors+=("Secrets found in git history ($exposed_history commits)")
    fi

    # Check environment file permissions
    while IFS= read -r env_file; do
        local perms
        perms=$(stat -f "%Lp" "$env_file" 2>/dev/null || echo "640")
        if [[ "${perms: -3}" -gt 600 ]]; then
            risk_score=$((risk_score + 10))
            risk_factors+=("Loose permissions on $env_file ($perms)")
        fi
    done < <(find "$PROJECT_ROOT" -maxdepth 3 -name ".env*" -type f 2>/dev/null)

    # Check for missing .gitignore entries
    if [[ -f "$PROJECT_ROOT/.gitignore" ]]; then
        if ! grep -q "\.env" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
            risk_score=$((risk_score + 15))
            risk_factors+=(".env files not in .gitignore")
        fi
    fi

    # Risk level determination
    local risk_level
    if [[ $risk_score -ge 70 ]]; then
        risk_level="CRITICAL"
    elif [[ $risk_score -ge 40 ]]; then
        risk_level="HIGH"
    elif [[ $risk_score -ge 20 ]]; then
        risk_level="MEDIUM"
    else
        risk_level="LOW"
    fi

    echo ""
    info "========================================="
    info "  RISK ASSESSMENT RESULTS"
    info "========================================="
    info "Risk Score:  $risk_score/100"
    info "Risk Level:  $risk_level"

    if [[ ${#risk_factors[@]} -gt 0 ]]; then
        info "Risk Factors:"
        for factor in "${risk_factors[@]}"; do
            warn "  - $factor"
        done
    fi

    echo ""
}

# ==========================================
# MAIN EXECUTION
# ==========================================
main() {
    info "========================================="
    info "  SECRET ACCESS AUDIT STARTED"
    info "========================================="
    info "Report Type: $REPORT_TYPE"
    info "Days Back:   $DAYS_BACK"
    info "Timestamp:    $TIMESTAMP"

    mkdir -p "$AUDIT_DIR"

    case "$REPORT_TYPE" in
        summary)
            echo ""
            audit_secret_inventory
            echo ""
            audit_secret_age
            echo ""
            assess_risk
            ;;
        compliance)
            generate_compliance_report
            ;;
        anomaly)
            detect_anomalies
            ;;
        full|*)
            echo ""
            info "=== SECRET INVENTORY ==="
            audit_secret_inventory
            echo ""

            info "=== SECRET AGE ==="
            audit_secret_age
            echo ""

            info "=== ACCESS PATTERNS ==="
            audit_access_patterns
            echo ""

            info "=== CONFIGURATION SECURITY ==="
            audit_configuration
            echo ""

            info "=== ANOMALY DETECTION ==="
            detect_anomalies
            echo ""

            assess_risk

            echo ""
            info "=== COMPLIANCE REPORT ==="
            generate_compliance_report
            ;;
    esac

    echo ""
    success "Audit completed successfully"
    info "Reports saved to: $AUDIT_DIR"
    echo ""
    echo "Recommended Actions:"
    echo "  1. Review all findings above"
    echo "  2. Address HIGH/CRITICAL risks immediately"
    echo "  3. Schedule secret rotation if needed: ./rotate-secrets.sh"
    echo "  4. Share compliance report with security team"
    echo ""
}

# Export for use by other scripts
export -f audit_secret_inventory
export -f audit_configuration

# Run
main
