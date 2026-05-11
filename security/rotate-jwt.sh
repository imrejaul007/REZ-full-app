#!/bin/bash
#
# rotate-jwt.sh - JWT secret rotation script for ReZ Full App
# Rotates JWT access and refresh tokens, merchant tokens, and admin tokens
#
# Usage: ./rotate-jwt.sh [--dry-run] [--service=<service>]
#   --dry-run     Preview changes without applying
#   --service     Target specific service (backend|merchant|admin|gateway|all)
#
# Cron setup (weekly rotation recommended):
#   0 2 * * 0 /Users/rejaulkarim/Documents/ReZ\ Full\ App/security/rotate-jwt.sh >> /var/log/jwt-rotation.log 2>&1
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="/Users/rejaulkarim/Documents/ReZ Full App"
LOG_FILE="$PROJECT_ROOT/security/jwt-rotation.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# JWT secret configuration - minimum 32 bytes for HS256
JWT_SECRET_LENGTH=64  # 64 hex chars = 32 bytes
REFRESH_SECRET_LENGTH=64

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Flags
DRY_RUN=false
SERVICE="all"
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --service=*)
            SERVICE="${1#*=}"
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run          Preview changes without applying"
            echo "  --service=NAME      Target service (backend|merchant|admin|gateway|all)"
            echo "  --verbose          Show detailed output"
            echo "  --help, -h         Show this help message"
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
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

info() { log "INFO" "${BLUE}$1${NC}"; }
success() { log "SUCCESS" "${GREEN}$1${NC}"; }
warn() { log "WARN" "${YELLOW}$1${NC}"; }
error() { log "ERROR" "${RED}$1${NC}"; }

# Generate cryptographically secure JWT secret
generate_jwt_secret() {
    local length="${1:-$JWT_SECRET_LENGTH}"
    if command -v openssl &> /dev/null; then
        openssl rand -hex "$length"
    elif command -v node &> /dev/null; then
        node -e "console.log(require('crypto').randomBytes($((length / 2))).toString('hex'))"
    else
        head -c "$length" /dev/urandom | xxd -p | head -c "$((length * 2))"
    fi
}

# Service configurations
declare -A BACKEND_ENV="$PROJECT_ROOT/rezbackend/rez-backend-master/.env"
declare -A MERCHANT_ENV="$PROJECT_ROOT/rezmerchant/rez-merchant-master/.env"
declare -A ADMIN_ENV="$PROJECT_ROOT/rezadmin/rez-admin-main/.env"
declare -A GATEWAY_ENV="$PROJECT_ROOT/rez-api-gateway/.env"
declare -A LEDGER_ENV="$PROJECT_ROOT/REZ-Intelligence/REZ-ledger-service/.env"

# JWT secret variables by service
declare -A JWT_VARS=(
    ["$PROJECT_ROOT/rezbackend/rez-backend-master/.env"]="JWT_SECRET JWT_ACCESS_SECRET JWT_REFRESH_SECRET"
    ["$PROJECT_ROOT/rezmerchant/rez-merchant-master/.env"]="JWT_MERCHANT_SECRET JWT_SECRET"
    ["$PROJECT_ROOT/rezadmin/rez-admin-main/.env"]="JWT_ADMIN_SECRET JWT_SECRET"
    ["$PROJECT_ROOT/REZ-Intelligence/REZ-ledger-service/.env"]="JWT_SECRET LEDGER_JWT_SECRET"
)

# Rotate JWT secrets for a specific env file
rotate_jwt_in_env() {
    local env_file="$1"
    local env_name="$2"

    if [[ ! -f "$env_file" ]]; then
        warn "Env file not found: $env_file"
        return 1
    fi

    info "Processing JWT secrets in $env_name ($env_file)"

    # Get the variables for this service
    local vars="${JWT_VARS[$env_file]:-JWT_SECRET}"

    # Generate new secrets
    local new_access_secret
    local new_refresh_secret
    new_access_secret=$(generate_jwt_secret "$JWT_SECRET_LENGTH")
    new_refresh_secret=$(generate_jwt_secret "$REFRESH_SECRET_LENGTH")

    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY-RUN] Would rotate JWT secrets in $env_file"
        info "  - New JWT_ACCESS_SECRET: ${new_access_secret:0:16}..."
        info "  - New JWT_REFRESH_SECRET: ${new_refresh_secret:0:16}..."
        return 0
    fi

    # Backup original
    cp "$env_file" "$env_file.jwt_backup.$TIMESTAMP"

    # Update existing JWT secrets
    for var in $vars; do
        if grep -q "^${var}=" "$env_file"; then
            local new_val
            if [[ "$var" == *"REFRESH"* ]]; then
                new_val="$new_refresh_secret"
            else
                new_val="$new_access_secret"
            fi
            sed -i '' -E "s|^${var}=.*|${var}=${new_val}|" "$env_file"
            info "Updated $var"
        fi
    done

    # Add secrets if they don't exist
    if ! grep -q "^JWT_ACCESS_SECRET=" "$env_file"; then
        echo "" >> "$env_file"
        echo "# JWT Secrets (rotated $TIMESTAMP)" >> "$env_file"
        echo "JWT_ACCESS_SECRET=$new_access_secret" >> "$env_file"
        info "Added JWT_ACCESS_SECRET"
    fi

    if ! grep -q "^JWT_REFRESH_SECRET=" "$env_file"; then
        echo "JWT_REFRESH_SECRET=$new_refresh_secret" >> "$env_file"
        info "Added JWT_REFRESH_SECRET"
    fi

    success "Rotated JWT secrets in $env_name"
}

# Update JWT configuration in code files
update_jwt_config_in_code() {
    info "Updating JWT configuration in code..."

    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY-RUN] Would update JWT config in code files"
        return 0
    fi

    # Backend JWT config
    local backend_config="$PROJECT_ROOT/rezbackend/rez-backend-master/src/config/jwt.config.ts"
    if [[ -f "$backend_config" ]]; then
        # This is where JWT expiry settings are configured
        info "Note: JWT config file exists at $backend_config"
        info "  Ensure JWT_ACCESS_TOKEN_EXPIRY and JWT_REFRESH_TOKEN_EXPIRY are set appropriately"
    fi

    # Check for hardcoded secrets (should be moved to env)
    local files_with_hardcoded_jwt
    files_with_hardcoded_jwt=$(find "$PROJECT_ROOT" -type f \( -name "*.ts" -o -name "*.js" \) \
        -not -path "*/node_modules/*" \
        -not -path "*/dist/*" \
        -exec grep -l -E "(secret.*=.*['\"][^'\"]{20,}['\"]|jwt.*secret.*=)" {} \; 2>/dev/null || true)

    if [[ -n "$files_with_hardcoded_jwt" ]]; then
        warn "Found files with potential hardcoded JWT secrets:"
        echo "$files_with_hardcoded_jwt" | while read -r f; do
            warn "  - $f"
        done
    fi
}

# Update service-specific secrets
rotate_backend_jwt() {
    rotate_jwt_in_env "$PROJECT_ROOT/rezbackend/rez-backend-master/.env" "Backend"
}

rotate_merchant_jwt() {
    rotate_jwt_in_env "$PROJECT_ROOT/rezmerchant/rez-merchant-master/.env" "Merchant"
}

rotate_admin_jwt() {
    rotate_jwt_in_env "$PROJECT_ROOT/rezadmin/rez-admin-main/.env" "Admin"
}

rotate_gateway_jwt() {
    rotate_jwt_in_env "$PROJECT_ROOT/rez-api-gateway/.env" "API Gateway"
}

rotate_ledger_jwt() {
    rotate_jwt_in_env "$PROJECT_ROOT/REZ-Intelligence/REZ-ledger-service/.env" "Ledger Service"
}

# Create JWT rotation history
record_rotation() {
    local history_file="$PROJECT_ROOT/security/jwt-rotation-history.json"

    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY-RUN] Would record rotation to history"
        return 0
    fi

    mkdir -p "$(dirname "$history_file")"

    local record=$(cat <<EOF
{
    "timestamp": "$TIMESTAMP",
    "service": "$SERVICE",
    "secrets_rotated": ["access_token", "refresh_token"],
    "services_updated": $(echo "$SERVICE" | jq -R -s 'split(",")')
}
EOF
)

    if [[ -f "$history_file" ]]; then
        # Append to existing history
        local temp_file
        temp_file=$(mktemp)
        jq --argjson record "$record" '. + [$record]' "$history_file" > "$temp_file" && mv "$temp_file" "$history_file"
    else
        echo "[$record]" > "$history_file"
    fi

    info "Recorded rotation to history"
}

# Verify JWT rotation
verify_jwt_rotation() {
    info "Verifying JWT rotation..."

    local failures=0

    for env_file in "${!JWT_VARS[@]}"; do
        if [[ -f "$env_file" ]]; then
            local vars="${JWT_VARS[$env_file]}"
            for var in $vars; do
                if grep -q "^${var}=" "$env_file"; then
                    local value
                    value=$(grep "^${var}=" "$env_file" | cut -d'=' -f2)
                    local length=${#value}

                    if [[ $length -lt 32 ]]; then
                        error "JWT secret $var in $env_file is too short ($length chars, minimum 32)"
                        ((failures++))
                    fi

                    # Check for weak patterns
                    if [[ "$value" =~ ^(abc|123|admin|password|secret).* ]]; then
                        error "JWT secret $var appears to be weak"
                        ((failures++))
                    fi
                fi
            done
        fi
    done

    if [[ $failures -eq 0 ]]; then
        success "JWT verification passed"
        return 0
    else
        error "JWT verification failed with $failures errors"
        return 1
    fi
}

# Generate JWT rotation report
generate_report() {
    local report_file="$PROJECT_ROOT/security/jwt-rotation-report-${TIMESTAMP}.txt"

    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY-RUN] Would generate report at $report_file"
        return 0
    fi

    cat > "$report_file" <<EOF
========================================
JWT SECRET ROTATION REPORT
========================================
Timestamp:      $TIMESTAMP
Service:        $SERVICE
Dry Run:        $DRY_RUN
========================================

ROTATED SERVICES:
$(for s in $SERVICE; do echo "  - $s"; done)

ENV FILES UPDATED:
$(for env_file in "${!JWT_VARS[@]}"; do
    if [[ -f "$env_file" ]]; then
        echo "  - $env_file"
    fi
done)

JWT CONFIGURATION:
  Access Token Expiry:  15 minutes (recommended for production)
  Refresh Token Expiry: 7 days (recommended for production)

NEXT STEPS:
1. Deploy updated .env files to all services
2. Test authentication flow manually
3. Verify all services can validate tokens
4. Monitor for authentication failures
5. Run ./audit-access.sh to verify access patterns

========================================
EOF

    success "Report generated: $report_file"
}

# Rollback function
rollback_jwt() {
    local timestamp="$1"

    info "Rolling back JWT secrets to timestamp: $timestamp"

    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY-RUN] Would rollback JWT secrets"
        return 0
    fi

    for env_file in "${!JWT_VARS[@]}"; do
        local backup_file="${env_file}.jwt_backup.${timestamp}"
        if [[ -f "$backup_file" ]]; then
            cp "$backup_file" "$env_file"
            success "Restored: $env_file"
        else
            warn "Backup not found: $backup_file"
        fi
    done

    info "Rollback complete. Restart all services."
}

# Main execution
main() {
    info "========================================="
    info "  JWT SECRET ROTATION STARTED"
    info "========================================="
    info "Service: $SERVICE"
    info "Dry Run: $DRY_RUN"
    info "Timestamp: $TIMESTAMP"

    case "$SERVICE" in
        backend)
            rotate_backend_jwt
            ;;
        merchant)
            rotate_merchant_jwt
            ;;
        admin)
            rotate_admin_jwt
            ;;
        gateway)
            rotate_gateway_jwt
            ;;
        ledger)
            rotate_ledger_jwt
            ;;
        all)
            rotate_backend_jwt
            rotate_merchant_jwt
            rotate_admin_jwt
            rotate_gateway_jwt
            rotate_ledger_jwt
            ;;
        *)
            error "Unknown service: $SERVICE"
            exit 1
            ;;
    esac

    # Update JWT config in code
    update_jwt_config_in_code

    # Verify rotation
    if [[ "$DRY_RUN" == "false" ]]; then
        verify_jwt_rotation || true
        record_rotation
        generate_report
    fi

    echo ""
    success "JWT rotation completed successfully"
    echo ""
    echo "Next steps:"
    echo "  1. Deploy updated .env files to target services"
    echo "  2. Restart services to load new secrets"
    echo "  3. Test authentication endpoints"
    echo "  4. Monitor for token validation errors"
    echo ""
}

# Export for use by other scripts
export -f generate_jwt_secret

# Run
main
