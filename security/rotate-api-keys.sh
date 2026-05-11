#!/bin/bash
#
# rotate-api-keys.sh - API key rotation script for ReZ Full App
# Rotates external API keys (payment gateways, cloud services, third-party APIs)
#
# Usage: ./rotate-api-keys.sh [--dry-run] [--provider=<provider>]
#   --dry-run     Preview changes without applying
#   --provider    Rotate specific provider (razorpay|stripe|cloudinary|aws|all)
#
# Cron setup (monthly rotation recommended for stable API keys):
#   0 3 1 * * /Users/rejaulkarim/Documents/ReZ\ Full\ App/security/rotate-api-keys.sh >> /var/log/api-key-rotation.log 2>&1
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="/Users/rejaulkarim/Documents/ReZ Full App"
LOG_FILE="$PROJECT_ROOT/security/api-key-rotation.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REQUEST_TIMEOUT=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Flags
DRY_RUN=false
PROVIDER="all"
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --provider=*)
            PROVIDER="${1#*=}"
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
            echo "  --provider=NAME    Target provider (razorpay|stripe|cloudinary|aws|all)"
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

# API key environment variables by provider
declare -A RAZORPAY_VARS=(
    ["RAZORPAY_KEY_ID"]=""
    ["RAZORPAY_KEY_SECRET"]=""
    ["RAZORPAY_WEBHOOK_SECRET"]=""
)

declare -A STRIPE_VARS=(
    ["STRIPE_PUBLISHABLE_KEY"]=""
    ["STRIPE_SECRET_KEY"]=""
    ["STRIPE_WEBHOOK_SECRET"]=""
    ["STRIPE_CLIENT_ID"]=""
)

declare -A CLOUDINARY_VARS=(
    ["CLOUDINARY_CLOUD_NAME"]=""
    ["CLOUDINARY_API_KEY"]=""
    ["CLOUDINARY_API_SECRET"]=""
    ["CLOUDINARY_UPLOAD_PRESET"]=""
)

declare -A AWS_VARS=(
    ["AWS_ACCESS_KEY_ID"]=""
    ["AWS_SECRET_ACCESS_KEY"]=""
    ["AWS_REGION"]=""
)

declare -A SENDGRID_VARS=(
    ["SENDGRID_API_KEY"]=""
    ["SENDGRID_FROM_EMAIL"]=""
)

# Service to env file mapping
get_env_file() {
    local service="$1"
    case "$service" in
        backend)
            echo "$PROJECT_ROOT/rezbackend/rez-backend-master/.env"
            ;;
        merchant)
            echo "$PROJECT_ROOT/rezmerchant/rez-merchant-master/.env"
            ;;
        admin)
            echo "$PROJECT_ROOT/rezadmin/rez-admin-main/.env"
            ;;
        gateway)
            echo "$PROJECT_ROOT/rez-api-gateway/.env"
            ;;
        *)
            echo "$PROJECT_ROOT/rezbackend/rez-backend-master/.env"
            ;;
    esac
}

# Find all env files containing API keys
find_api_key_files() {
    find "$PROJECT_ROOT" -maxdepth 3 -name ".env*" -type f 2>/dev/null | while read -r f; do
        if grep -qE "(RAZORPAY|STRIPE|CLOUDINARY|AWS|SENDGRID|SOCKET|JWT)" "$f" 2>/dev/null; then
            echo "$f"
        fi
    done
}

# Generate placeholder key (for documentation purposes)
generate_key_placeholder() {
    local key_type="$1"
    echo "REPLACE_WITH_${key_type}_KEY"
}

# Rotate Razorpay keys
rotate_razorpay() {
    info "Rotating Razorpay API keys..."

    local env_files=(
        "$PROJECT_ROOT/rezbackend/rez-backend-master/.env"
    )

    for env_file in "${env_files[@]}"; do
        if [[ ! -f "$env_file" ]]; then
            warn "Env file not found: $env_file"
            continue
        fi

        info "Processing: $env_file"

        # Check if Razorpay keys exist
        if ! grep -q "RAZORPAY_KEY" "$env_file"; then
            info "No Razorpay keys found in $env_file"
            continue
        fi

        if [[ "$DRY_RUN" == "true" ]]; then
            info "[DRY-RUN] Would rotate Razorpay keys in $env_file"
            info "  NOTE: Razorpay API keys cannot be auto-generated."
            info "  Please generate new keys from Razorpay Dashboard:"
            info "  1. Go to https://dashboard.razorpay.com/app/keys"
            info "  2. Generate new Key Id and Key Secret"
            info "  3. Update the values manually or via admin portal"
            continue
        fi

        # Backup
        cp "$env_file" "$env_file.razorpay_backup.$TIMESTAMP"

        # Create rotation request file
        local request_file="$PROJECT_ROOT/security/razorpay-rotation-${TIMESTAMP}.txt"
        cat > "$request_file" <<EOF
RAZORPAY KEY ROTATION REQUEST
Generated: $TIMESTAMP
Env File: $env_file
========================================

STEPS TO COMPLETE ROTATION:
1. Log into Razorpay Dashboard: https://dashboard.razorpay.com/app/keys
2. Generate new Key Id and Key Secret
3. Update these values in $env_file:
   - RAZORPAY_KEY_ID=<new_key_id>
   - RAZORPAY_KEY_SECRET=<new_key_secret>

4. Test payment flow after update

CURRENT VALUES (from backup):
$(grep "^RAZORPAY" "$env_file.razorpay_backup.$TIMESTAMP" 2>/dev/null || echo "Not found in backup")

BACKUP FILE: $env_file.razorpay_backup.$TIMESTAMP
EOF

        success "Created rotation request: $request_file"
        warn "Manual action required: Generate new Razorpay keys from dashboard"
    done
}

# Rotate Stripe keys
rotate_stripe() {
    info "Rotating Stripe API keys..."

    local env_files=(
        "$PROJECT_ROOT/rezbackend/rez-backend-master/.env"
    )

    for env_file in "${env_files[@]}"; do
        if [[ ! -f "$env_file" ]]; then
            continue
        fi

        if ! grep -q "STRIPE" "$env_file"; then
            info "No Stripe keys found in $env_file"
            continue
        fi

        if [[ "$DRY_RUN" == "true" ]]; then
            info "[DRY-RUN] Would rotate Stripe keys in $env_file"
            info "  NOTE: Stripe secret keys cannot be auto-generated."
            info "  Please use Stripe Dashboard or API to generate new keys."
            continue
        fi

        cp "$env_file" "$env_file.stripe_backup.$TIMESTAMP"

        local request_file="$PROJECT_ROOT/security/stripe-rotation-${TIMESTAMP}.txt"
        cat > "$request_file" <<EOF
STRIPE KEY ROTATION REQUEST
Generated: $TIMESTAMP
Env File: $env_file
========================================

STEPS TO COMPLETE ROTATION:
1. Log into Stripe Dashboard: https://dashboard.stripe.com/apikeys
2. Use 'Create restricted key' for limited permissions
3. Or rotate existing key via API:
   curl https://api.stripe.com/v1/keys \
     -u sk_live_xxxx: \
     -d "_fields[]=id&fields[]=created"

4. Update values in $env_file:
   - STRIPE_SECRET_KEY=<new_secret_key>
   - STRIPE_PUBLISHABLE_KEY=<new_publishable_key>

BACKUP FILE: $env_file.stripe_backup.$TIMESTAMP
EOF

        success "Created rotation request: $request_file"
        warn "Manual action required: Generate new Stripe keys"
    done
}

# Rotate Cloudinary keys
rotate_cloudinary() {
    info "Rotating Cloudinary API keys..."

    local env_files=(
        "$PROJECT_ROOT/rezbackend/rez-backend-master/.env"
        "$PROJECT_ROOT/rezmerchant/rez-merchant-master/.env"
    )

    for env_file in "${env_files[@]}"; do
        if [[ ! -f "$env_file" ]]; then
            continue
        fi

        if ! grep -q "CLOUDINARY" "$env_file"; then
            continue
        fi

        if [[ "$DRY_RUN" == "true" ]]; then
            info "[DRY-RUN] Would rotate Cloudinary keys in $env_file"
            info "  NOTE: Cloudinary API secret cannot be auto-generated."
            continue
        fi

        cp "$env_file" "$env_file.cloudinary_backup.$TIMESTAMP"

        # Cloudinary allows regenerating API key from dashboard
        local request_file="$PROJECT_ROOT/security/cloudinary-rotation-${TIMESTAMP}.txt"
        cat > "$request_file" <<EOF
CLOUDINARY KEY ROTATION REQUEST
Generated: $TIMESTAMP
Env File: $env_file
========================================

STEPS TO COMPLETE ROTATION:
1. Log into Cloudinary Console: https://console.cloudinary.com/
2. Go to Settings > Security
3. Under 'API Keys', click 'Regenerate'
4. Update values in $env_file:
   - CLOUDINARY_API_KEY=<new_api_key>
   - CLOUDINARY_API_SECRET=<new_api_secret>

BACKUP FILE: $env_file.cloudinary_backup.$TIMESTAMP
EOF

        success "Created rotation request: $request_file"
        warn "Manual action required: Regenerate Cloudinary API key"
    done
}

# Rotate AWS credentials
rotate_aws() {
    info "Rotating AWS credentials..."

    local env_files=(
        "$PROJECT_ROOT/rezbackend/rez-backend-master/.env"
        "$PROJECT_ROOT/REZ-Media/rez-automation-service/.env"
    )

    for env_file in "${env_files[@]}"; do
        if [[ ! -f "$env_file" ]]; then
            continue
        fi

        if ! grep -q "AWS_ACCESS_KEY_ID\|AWS_SECRET" "$env_file"; then
            continue
        fi

        if [[ "$DRY_RUN" == "true" ]]; then
            info "[DRY-RUN] Would rotate AWS credentials in $env_file"
            info "  NOTE: AWS access keys require manual generation via IAM."
            continue
        fi

        cp "$env_file" "$env_file.aws_backup.$TIMESTAMP"

        local request_file="$PROJECT_ROOT/security/aws-rotation-${TIMESTAMP}.txt"
        cat > "$request_file" <<EOF
AWS CREDENTIAL ROTATION REQUEST
Generated: $TIMESTAMP
Env File: $env_file
========================================

STEPS TO COMPLETE ROTATION:
1. Log into AWS Console: https://console.aws.amazon.com/iam/
2. Go to Users > Security credentials
3. Create new access key:
   aws iam create-access-key --user-name <username>

4. Update values in $env_file:
   - AWS_ACCESS_KEY_ID=<new_access_key_id>
   - AWS_SECRET_ACCESS_KEY=<new_secret_access_key>

5. Verify new credentials work before disabling old key

BACKUP FILE: $env_file.aws_backup.$TIMESTAMP
EOF

        success "Created rotation request: $request_file"
        warn "Manual action required: Generate new AWS access keys"
    done
}

# Rotate Socket.IO secrets
rotate_socket_secrets() {
    info "Rotating Socket.IO secrets..."

    local socket_secrets=(
        "$PROJECT_ROOT/rezbackend/rez-backend-master/.env"
        "$PROJECT_ROOT/rezmerchant/rez-merchant-master/.env"
        "$PROJECT_ROOT/rezadmin/rez-admin-main/.env"
    )

    for env_file in "${socket_secrets[@]}"; do
        if [[ ! -f "$env_file" ]]; then
            continue
        fi

        if ! grep -q "SOCKET_SECRET\|SOCKET_IO_SECRET" "$env_file"; then
            continue
        fi

        if [[ "$DRY_RUN" == "true" ]]; then
            info "[DRY-RUN] Would rotate Socket.IO secret in $env_file"
            continue
        fi

        local new_socket_secret
        new_socket_secret=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p)

        cp "$env_file" "$env_file.socket_backup.$TIMESTAMP"
        sed -i '' -E "s/(SOCKET_SECRET|SOCKET_IO_SECRET)=.*/\1=$new_socket_secret/" "$env_file"

        success "Rotated Socket.IO secret in $env_file"
    done
}

# Scan for exposed API keys
scan_exposed_keys() {
    info "Scanning for potentially exposed API keys..."

    local exposed_count=0
    local scan_results="$PROJECT_ROOT/security/exposed-keys-scan-${TIMESTAMP}.txt"

    echo "API KEY EXPOSURE SCAN REPORT" > "$scan_results"
    echo "Generated: $TIMESTAMP" >> "$scan_results"
    echo "========================================" >> "$scan_results"
    echo "" >> "$scan_results"

    # Scan for patterns that shouldn't be committed
    local patterns=(
        "sk_live_[a-zA-Z0-9]\{24,\}"
        "rk_live_[a-zA-Z0-9]\{24,\}"
        "AIza[a-zA-Z0-9_-]\{35,\}"
        "AKIA[0-9A-Z]\{16\}"
        "sq0csp-[a-zA-Z0-9_-]\{43,\}"
        "SG\.[a-zA-Z0-9_-]\{22,\}\.[a-zA-Z0-9_-]\{43,\}"
    )

    for pattern in "${patterns[@]}"; do
        local matches
        matches=$(find "$PROJECT_ROOT" -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.env" \) \
            -not -path "*/node_modules/*" \
            -not -path "*/.git/*" \
            -not -path "*/dist/*" \
            -exec grep -l -E "$pattern" {} \; 2>/dev/null || true)

        if [[ -n "$matches" ]]; then
            echo "PATTERN: $pattern" >> "$scan_results"
            echo "FOUND IN:" >> "$scan_results"
            echo "$matches" | while read -r f; do
                echo "  - $f" >> "$scan_results"
            done
            echo "" >> "$scan_results"
            ((exposed_count++))
        fi
    done

    if [[ $exposed_count -gt 0 ]]; then
        warn "Found $exposed_count potential key exposures!"
        warn "Review: $scan_results"
    else
        success "No obvious API key exposures detected"
    fi

    success "Scan report: $scan_results"
}

# Generate API key inventory
generate_inventory() {
    local inventory_file="$PROJECT_ROOT/security/api-key-inventory-${TIMESTAMP}.json"

    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY-RUN] Would generate API key inventory"
        return 0
    fi

    local inventory
    inventory=$(cat <<EOF
{
    "generated": "$TIMESTAMP",
    "providers": {
        "razorpay": {
            "keys": ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"],
            "rotation_method": "manual_dashboard",
            "rotation_url": "https://dashboard.razorpay.com/app/keys"
        },
        "stripe": {
            "keys": ["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
            "rotation_method": "manual_dashboard",
            "rotation_url": "https://dashboard.stripe.com/apikeys"
        },
        "cloudinary": {
            "keys": ["CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
            "rotation_method": "manual_console",
            "rotation_url": "https://console.cloudinary.com/settings/security"
        },
        "aws": {
            "keys": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
            "rotation_method": "iam_console",
            "rotation_url": "https://console.aws.amazon.com/iam/"
        },
        "socket": {
            "keys": ["SOCKET_SECRET", "SOCKET_IO_SECRET"],
            "rotation_method": "auto",
            "auto_generated": true
        }
    },
    "env_files": [
        "$PROJECT_ROOT/rezbackend/rez-backend-master/.env",
        "$PROJECT_ROOT/rezmerchant/rez-merchant-master/.env",
        "$PROJECT_ROOT/rezadmin/rez-admin-main/.env",
        "$PROJECT_ROOT/REZ-Media/rez-automation-service/.env"
    ]
}
EOF
)

    echo "$inventory" | jq '.' > "$inventory_file"
    success "Generated inventory: $inventory_file"
}

# Verify API keys
verify_api_keys() {
    info "Verifying API key configuration..."

    local failures=0

    # Check backend env
    local backend_env="$PROJECT_ROOT/rezbackend/rez-backend-master/.env"
    if [[ -f "$backend_env" ]]; then
        # Check Razorpay
        if grep -q "RAZORPAY_KEY_ID" "$backend_env"; then
            local key_id
            key_id=$(grep "^RAZORPAY_KEY_ID=" "$backend_env" | cut -d'=' -f2)
            if [[ "$key_id" == "your_razorpay_key"* ]] || [[ -z "$key_id" ]]; then
                error "Razorpay key not configured in $backend_env"
                ((failures++))
            fi
        fi

        # Check Stripe
        if grep -q "STRIPE_SECRET_KEY" "$backend_env"; then
            local stripe_key
            stripe_key=$(grep "^STRIPE_SECRET_KEY=" "$backend_env" | cut -d'=' -f2)
            if [[ "$stripe_key" == "sk_test_"* ]] || [[ "$stripe_key" == "sk_live_"* ]]; then
                info "Stripe key configured: ${stripe_key:0:12}..."
            fi
        fi
    fi

    if [[ $failures -eq 0 ]]; then
        success "API key verification passed"
        return 0
    else
        error "API key verification failed with $failures issues"
        return 1
    fi
}

# Main execution
main() {
    info "========================================="
    info "  API KEY ROTATION STARTED"
    info "========================================="
    info "Provider: $PROVIDER"
    info "Dry Run: $DRY_RUN"
    info "Timestamp: $TIMESTAMP"

    case "$PROVIDER" in
        razorpay)
            rotate_razorpay
            ;;
        stripe)
            rotate_stripe
            ;;
        cloudinary)
            rotate_cloudinary
            ;;
        aws)
            rotate_aws
            ;;
        socket)
            rotate_socket_secrets
            ;;
        all)
            rotate_razorpay
            rotate_stripe
            rotate_cloudinary
            rotate_aws
            rotate_socket_secrets
            ;;
        *)
            error "Unknown provider: $PROVIDER"
            exit 1
            ;;
    esac

    # Always scan for exposed keys
    scan_exposed_keys

    # Generate inventory
    generate_inventory

    # Verify
    if [[ "$DRY_RUN" == "false" ]]; then
        verify_api_keys || true
    fi

    echo ""
    success "API key rotation completed"
    echo ""
    echo "IMPORTANT NOTES:"
    echo "  - Some API keys (Razorpay, Stripe, AWS) require manual rotation via provider dashboards"
    echo "  - Review any rotation request files created in $PROJECT_ROOT/security/"
    echo "  - After manual rotation, deploy updated .env files to all services"
    echo "  - Test integrations after rotation"
    echo ""
}

# Export for use by other scripts
export -f scan_exposed_keys

# Run
main
