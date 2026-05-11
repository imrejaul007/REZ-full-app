#!/bin/bash
#
# rotate-secrets.sh - Master secret rotation script for ReZ Full App
# Rotates all secrets including database passwords, API keys, JWT secrets, and encryption keys
#
# Usage: ./rotate-secrets.sh [--dry-run] [--component=<component>]
#   --dry-run     Preview changes without applying
#   --component   Rotate only specific component (database|jwt|api|encryption|all)
#
# Cron setup (weekly rotation recommended):
#   0 2 * * 0 /Users/rejaulkarim/Documents/ReZ\ Full\ App/security/rotate-secrets.sh >> /var/log/secret-rotation.log 2>&1
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="/Users/rejaulkarim/Documents/ReZ Full App"
BACKUP_DIR="$PROJECT_ROOT/security/backups"
LOG_FILE="$PROJECT_ROOT/security/rotation.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
DRY_RUN=false
COMPONENT="all"
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --component=*)
            COMPONENT="${1#*=}"
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
            echo "  --component=NAME   Rotate specific component (database|jwt|api|encryption|all)"
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

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Colored output functions
info() { log "INFO" "${BLUE}$1${NC}"; }
success() { log "SUCCESS" "${GREEN}$1${NC}"; }
warn() { log "WARN" "${YELLOW}$1${NC}"; }
error() { log "ERROR" "${RED}$1${NC}"; }

# Generate cryptographically secure secret
generate_secret() {
    local length="${1:-64}"
    if command -v openssl &> /dev/null; then
        openssl rand -hex "$length" 2>/dev/null || \
        openssl rand -base64 "$length" 2>/dev/null
    elif command -v node &> /dev/null; then
        node -e "console.log(require('crypto').randomBytes($length).toString('hex'))"
    else
        # Fallback to /dev/urandom
        head -c "$length" /dev/urandom | xxd -p | head -c "$((length * 2))"
    fi
}

# Backup existing secrets
backup_secrets() {
    local backup_name="secrets_backup_${TIMESTAMP}"
    local backup_path="$BACKUP_DIR/$backup_name"

    info "Creating backup at $backup_path"

    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY-RUN] Would backup secrets to $backup_path"
        return 0
    fi

    mkdir -p "$backup_path"

    # Backup .env files
    find "$PROJECT_ROOT" -maxdepth 3 -name ".env*" -type f 2>/dev/null | while read -r env_file; do
        local rel_path="${env_file#$PROJECT_ROOT/}"
        local dir="$backup_path/$(dirname "$rel_path")"
        mkdir -p "$dir"
        cp "$env_file" "$dir/"
        info "Backed up: $rel_path"
    done

    # Backup config files with secrets
    find "$PROJECT_ROOT" -maxdepth 4 \( -name "config*.json" -o -name "config*.ts" -o -name "*.config.*" \) -type f 2>/dev/null | while read -r config_file; do
        if grep -q -E "(password|secret|key|token|apiKey|api_key)" "$config_file" 2>/dev/null; then
            local rel_path="${config_file#$PROJECT_ROOT/}"
            local dir="$backup_path/$(dirname "$rel_path")"
            mkdir -p "$dir"
            cp "$config_file" "$dir/"
        fi
    done

    # Create backup manifest
    cat > "$backup_path/manifest.json" <<EOF
{
    "timestamp": "$TIMESTAMP",
    "backup_name": "$backup_name",
    "components_rotated": "$COMPONENT",
    "files_backed_up": $(find "$backup_path" -type f | wc -l),
    "created_by": "rotate-secrets.sh"
}
EOF

    success "Backup created: $backup_name"
    echo "$backup_path"
}

# Rotate database passwords
rotate_database_secrets() {
    info "Rotating database secrets..."

    local db_secrets=(
        "$PROJECT_ROOT/rezbackend/rez-backend-master/.env"
        "$PROJECT_ROOT/rez-api-gateway/.env"
    )

    for env_file in "${db_secrets[@]}"; do
        if [[ -f "$env_file" ]]; then
            info "Processing: $env_file"

            if [[ "$DRY_RUN" == "true" ]]; then
                info "[DRY-RUN] Would rotate database credentials in $env_file"
                continue
            fi

            # Generate new database password
            local new_db_password
            new_db_password=$(generate_secret 32)

            # Backup original
            cp "$env_file" "$env_file.backup.$TIMESTAMP"

            # Update MongoDB URI password
            if grep -q "MONGODB_URI" "$env_file"; then
                # Extract current password pattern and replace
                sed -i '' "s/:\/\/[^:]*:/:\/\/rez_user:$new_db_password@/g" "$env_file"
                info "Updated MONGODB_URI"
            fi

            # Update explicit DB password variables
            if grep -q "DB_PASSWORD\|MONGO_PASSWORD" "$env_file"; then
                sed -i '' -E "s/(DB_PASSWORD|MONGO_PASSWORD)=.*/\1=$new_db_password/g" "$env_file"
                info "Updated database password variables"
            fi

            success "Rotated secrets in $env_file"
        fi
    done
}

# Rotate encryption keys
rotate_encryption_keys() {
    info "Rotating encryption keys..."

    local encryption_secrets=(
        "$PROJECT_ROOT/rezbackend/rez-backend-master/.env"
        "$PROJECT_ROOT/REZ-Intelligence/REZ-ledger-service/.env"
    )

    for env_file in "${encryption_secrets[@]}"; do
        if [[ -f "$env_file" ]]; then
            info "Processing: $env_file"

            if [[ "$DRY_RUN" == "true" ]]; then
                info "[DRY-RUN] Would rotate encryption keys in $env_file"
                continue
            fi

            # Generate new encryption key (use 32 bytes for AES-256)
            local new_encryption_key
            new_encryption_key=$(generate_secret 32)

            # Backup original
            cp "$env_file" "$env_file.backup.$TIMESTAMP"

            # Update encryption key variables
            if grep -q "ENCRYPTION_KEY\|AES_KEY\|ENCRYPT_KEY" "$env_file"; then
                sed -i '' -E "s/(ENCRYPTION_KEY|AES_KEY|ENCRYPT_KEY)=.*/\1=$new_encryption_key/g" "$env_file"
                info "Updated encryption key"
            fi

            # Add if not exists
            if ! grep -q "ENCRYPTION_KEY" "$env_file"; then
                echo "" >> "$env_file"
                echo "ENCRYPTION_KEY=$new_encryption_key" >> "$env_file"
                info "Added ENCRYPTION_KEY"
            fi

            success "Rotated encryption key in $env_file"
        fi
    done
}

# Rotate Redis secrets
rotate_redis_secrets() {
    info "Rotating Redis secrets..."

    local redis_configs=(
        "$PROJECT_ROOT/rezbackend/rez-backend-master/.env"
        "$PROJECT_ROOT/REZ-Intelligence/REZ-ledger-service/.env"
    )

    for env_file in "${redis_configs[@]}"; do
        if [[ -f "$env_file" ]]; then
            if grep -q "REDIS_PASSWORD\|REDIS_AUTH" "$env_file" 2>/dev/null; then
                info "Processing: $env_file"

                if [[ "$DRY_RUN" == "true" ]]; then
                    info "[DRY-RUN] Would rotate Redis password in $env_file"
                    continue
                fi

                local new_redis_password
                new_redis_password=$(generate_secret 32)

                cp "$env_file" "$env_file.backup.$TIMESTAMP"
                sed -i '' -E "s/(REDIS_PASSWORD|REDIS_AUTH)=.*/\1=$new_redis_password/g" "$env_file"

                success "Rotated Redis password in $env_file"
            fi
        fi
    done
}

# Rotate JWT secrets
rotate_jwt_secrets() {
    info "Rotating JWT secrets..."

    if [[ -f "$SCRIPT_DIR/rotate-jwt.sh" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            info "[DRY-RUN] Delegating to rotate-jwt.sh --dry-run"
            bash "$SCRIPT_DIR/rotate-jwt.sh" --dry-run
        else
            bash "$SCRIPT_DIR/rotate-jwt.sh"
        fi
    else
        warn "rotate-jwt.sh not found, skipping JWT rotation"
    fi
}

# Rotate API keys
rotate_api_keys() {
    info "Rotating API keys..."

    if [[ -f "$SCRIPT_DIR/rotate-api-keys.sh" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            info "[DRY-RUN] Delegating to rotate-api-keys.sh --dry-run"
            bash "$SCRIPT_DIR/rotate-api-keys.sh" --dry-run
        else
            bash "$SCRIPT_DIR/rotate-api-keys.sh"
        fi
    else
        warn "rotate-api-keys.sh not found, skipping API key rotation"
    fi
}

# Verify rotated secrets
verify_rotation() {
    info "Verifying secret rotation..."

    local failures=0

    # Check .env files exist and are readable
    while IFS= read -r env_file; do
        if [[ -f "$env_file" ]]; then
            if [[ ! -r "$env_file" ]]; then
                error "Cannot read $env_file"
                ((failures++))
            fi

            # Check for common secret patterns
            if grep -qE "(password|secret|key|token).*=.*''" "$env_file" 2>/dev/null; then
                error "Empty secret found in $env_file"
                ((failures++))
            fi
        fi
    done < <(find "$PROJECT_ROOT" -maxdepth 3 -name ".env*" -type f 2>/dev/null)

    # Verify no old backups with same timestamp remain (except for the ones we just created)
    local orphan_backups
    orphan_backups=$(find "$PROJECT_ROOT" -name ".env.backup.*" -type f 2>/dev/null | wc -l)
    if [[ "$orphan_backups" -gt 10 ]]; then
        warn "Found $orphan_backups backup files. Consider cleaning up old backups."
    fi

    if [[ $failures -eq 0 ]]; then
        success "All secrets verified successfully"
        return 0
    else
        error "Verification failed with $failures errors"
        return 1
    fi
}

# Cleanup old backups (keep last 10)
cleanup_old_backups() {
    info "Cleaning up old backups..."

    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY-RUN] Would remove backup files older than 10 rotations"
        return 0
    fi

    # Keep only the 10 most recent backups per type
    find "$BACKUP_DIR" -type d -name "secrets_backup_*" -printf '%T+ %p\n' 2>/dev/null | \
        sort | head -n -10 | \
        awk '{print $2}' | \
        xargs rm -rf 2>/dev/null || true

    # Remove .env.backup.* files older than 7 days
    find "$PROJECT_ROOT" -name ".env.backup.*" -type f -mtime +7 -delete 2>/dev/null || true

    success "Cleanup complete"
}

# Print summary
print_summary() {
    echo ""
    echo "========================================"
    echo "       SECRET ROTATION SUMMARY         "
    echo "========================================"
    echo "Timestamp:    $TIMESTAMP"
    echo "Component:    $COMPONENT"
    echo "Dry Run:      $DRY_RUN"
    echo "Log File:     $LOG_FILE"
    echo "Backup Dir:   $BACKUP_DIR"
    echo "========================================"
    echo ""
    echo "Next steps:"
    echo "  1. Review the rotation log at $LOG_FILE"
    echo "  2. Test services to ensure they start with new secrets"
    echo "  3. Deploy updated configurations"
    echo "  4. Run: ./audit-access.sh to verify access patterns"
    echo ""
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "NOTE: This was a dry run. No changes were made."
        echo "      Run without --dry-run to apply changes."
    fi
    echo "========================================"
}

# Rollback function
rollback() {
    local backup_path="$1"

    if [[ ! -d "$backup_path" ]]; then
        error "Backup not found: $backup_path"
        return 1
    fi

    warn "Rolling back to: $backup_path"
    info "Restoring files from backup..."

    # Restore .env files
    find "$backup_path" -name ".env*" -type f 2>/dev/null | while read -r backed_up_file; do
        local rel_path="${backed_up_file#$backup_path/}"
        local target_file="$PROJECT_ROOT/$rel_path"
        local target_dir="$(dirname "$target_file")"

        mkdir -p "$target_dir"
        cp "$backed_up_file" "$target_file"
        info "Restored: $rel_path"
    done

    success "Rollback complete"
    info "Restart services to use restored secrets"
}

# Main execution
main() {
    # Ensure backup directory exists
    mkdir -p "$BACKUP_DIR"

    info "========================================="
    info "  SECRET ROTATION STARTED"
    info "========================================="
    info "Component: $COMPONENT"
    info "Dry Run: $DRY_RUN"
    info "Timestamp: $TIMESTAMP"

    # Create backup first
    local backup_path
    backup_path=$(backup_secrets)

    # Trap for rollback on error
    trap 'error "Rotation failed. Run: rollback $backup_path"; exit 1' ERR

    # Rotate based on component
    case "$COMPONENT" in
        database)
            rotate_database_secrets
            ;;
        jwt)
            rotate_jwt_secrets
            ;;
        api)
            rotate_api_keys
            ;;
        encryption)
            rotate_encryption_keys
            rotate_redis_secrets
            ;;
        all)
            rotate_database_secrets
            rotate_encryption_keys
            rotate_redis_secrets
            rotate_jwt_secrets
            rotate_api_keys
            ;;
        *)
            error "Unknown component: $COMPONENT"
            exit 1
            ;;
    esac

    # Cleanup old backups
    cleanup_old_backups

    # Verify rotation
    if [[ "$DRY_RUN" == "false" ]]; then
        verify_rotation || true
    fi

    # Remove trap
    trap - ERR

    print_summary

    success "Secret rotation completed successfully"
}

# Export functions for use by other scripts
export -f generate_secret
export -f backup_secrets
export -f rollback

# Run main
main
