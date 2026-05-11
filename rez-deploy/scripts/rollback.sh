#!/usr/bin/env bash
# =============================================================================
# REZ Platform - Rollback Script
# =============================================================================
# Rolls back REZ microservices to a previous version
# Usage: ./rollback.sh [service] [version] [--dry-run]
# Examples:
#   ./rollback.sh rez-delivery-service
#   ./rollback.sh all v1.0.0
#   ./rollback.sh rez-websocket-hub v0.9.5 --dry-run
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_DIR="$PROJECT_ROOT"

# Default values
SERVICE="${1:-}"
TARGET_VERSION="${2:-}"
DRY_RUN="${DRY_RUN:-false}"
KEEP_BACKUP="${KEEP_BACKUP:-true}"
HEALTH_CHECK_TIMEOUT=60
HEALTH_CHECK_INTERVAL=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Docker registry
DOCKER_REGISTRY="${DOCKER_REGISTRY:-registry.rez.app}"

# Service list
SERVICES=(
    "rez-delivery-service:3000"
    "rez-analytics-service:3001"
    "rez-payment-links-service:3002"
    "rez-journey-service:3003"
    "rez-automation-service:3004"
    "rez-gdpr-service:3005"
    "rez-validation-service:3006"
    "rez-cohort-service:3007"
    "rez-currency-service:3008"
    "rez-invoice-service:3009"
    "rez-menu-service:3010"
    "rez-refund-service:3011"
    "rez-tracking-service:3012"
    "rez-websocket-hub:3013"
    "rez-rate-limit:3014"
)

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

timestamp() {
    date "+%Y%m%d-%H%M%S"
}

get_service_name() {
    echo "$1" | cut -d':' -f1
}

get_service_port() {
    echo "$1" | cut -d':' -f2
}

# =============================================================================
# Show Help
# =============================================================================

show_help() {
    cat << EOF
REZ Platform Rollback Script

Usage: ./rollback.sh [service] [version] [options]

Arguments:
  service       Service name to rollback (or 'all' for all services)
  version       Target version to rollback to

Options:
  --dry-run     Show what would be done without executing
  --help, -h    Show this help message

Examples:
  ./rollback.sh rez-delivery-service
  ./rollback.sh all v1.0.0
  ./rollback.sh rez-websocket-hub v0.9.5

EOF
}

# =============================================================================
# Prerequisites Check
# =============================================================================

check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed or not in PATH"
        exit 1
    fi

    log_success "Prerequisites met"
}

# =============================================================================
# Validate Arguments
# =============================================================================

validate_arguments() {
    if [[ -z "$SERVICE" ]]; then
        log_error "Service name is required"
        show_help
        exit 1
    fi

    if [[ "$SERVICE" != "all" ]]; then
        local valid_service=false
        for service_entry in "${SERVICES[@]}"; do
            if [[ "$(get_service_name "$service_entry")" == "$SERVICE" ]]; then
                valid_service=true
                break
            fi
        done

        if [[ "$valid_service" == "false" ]]; then
            log_error "Invalid service name: $SERVICE"
            echo "Valid services:"
            for service_entry in "${SERVICES[@]}"; do
                echo "  - $(get_service_name "$service_entry")"
            done
            exit 1
        fi
    fi

    if [[ -z "$TARGET_VERSION" ]]; then
        log_warning "Target version not specified, will attempt to find previous version"
    fi
}

# =============================================================================
# Get Available Versions
# =============================================================================

get_available_versions() {
    local service_name=$1

    log_info "Fetching available versions for $service_name..."

    # Get all tags for the service image
    docker images "${DOCKER_REGISTRY}/${service_name}" --format "{{.Tag}}" 2>/dev/null | sort -V || echo ""
}

# =============================================================================
# Get Previous Version
# =============================================================================

get_previous_version() {
    local service_name=$1
    local current_version=$2

    # Get all available versions
    local versions=($(get_available_versions "$service_name"))

    if [[ ${#versions[@]} -eq 0 ]]; then
        log_error "No available versions found for $service_name"
        return 1
    fi

    # Find current version index
    local current_index=-1
    for i in "${!versions[@]}"; do
        if [[ "${versions[$i]}" == "$current_version" ]]; then
            current_index=$i
            break
        fi
    done

    if [[ $current_index -eq -1 ]]; then
        # Current version not found, use second to last
        if [[ ${#versions[@]} -ge 2 ]]; then
            echo "${versions[-2]}"
        else
            echo "${versions[0]}"
        fi
    elif [[ $current_index -gt 0 ]]; then
        # Use previous version
        echo "${versions[$((current_index - 1))]}"
    else
        # Already at the oldest version
        echo "${versions[0]}"
    fi
}

# =============================================================================
# Get Current Version
# =============================================================================

get_current_version() {
    local service_name=$1

    docker ps --filter "name=$service_name" --format "{{.Image}}" 2>/dev/null | \
        awk -F: '{print $NF}' | head -1 || echo "unknown"
}

# =============================================================================
# Create Rollback Backup
# =============================================================================

create_rollback_backup() {
    local service_name=$1

    log_info "Creating rollback backup for $service_name..."

    local backup_tag="rollback-$(timestamp)"
    local container_id=$(docker ps -q --filter "name=$service_name" 2>/dev/null)

    if [[ -n "$container_id" ]]; then
        docker commit "$container_id" "${DOCKER_REGISTRY}/${service_name}:${backup_tag}" >/dev/null 2>&1
        log_success "Created backup: ${DOCKER_REGISTRY}/${service_name}:${backup_tag}"

        # Store backup tag for potential restoration
        echo "$backup_tag" >> "$DEPLOY_DIR/.rollback_backups"
    else
        log_warning "No running container found for $service_name"
    fi
}

# =============================================================================
# Rollback Single Service
# =============================================================================

rollback_service() {
    local service_entry=$1
    local service_name=$(get_service_name "$service_entry")
    local port=$(get_service_port "$service_entry")
    local version=${2:-}

    log_info "Rolling back $service_name..."

    # Get current version if not specified
    if [[ -z "$version" ]]; then
        local current_version=$(get_current_version "$service_name")
        log_info "Current version: $current_version"
        version=$(get_previous_version "$service_name" "$current_version")

        if [[ -z "$version" ]]; then
            log_error "Could not determine previous version for $service_name"
            return 1
        fi
    fi

    log_info "Target version: $version"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "[DRY-RUN] Would rollback $service_name to $version"
        return 0
    fi

    # Create backup before rollback
    create_rollback_backup "$service_name"

    # Stop current container
    log_info "Stopping current container..."
    docker stop "$service_name" 2>/dev/null || true
    docker rm "$service_name" 2>/dev/null || true

    # Pull target version
    local image="${DOCKER_REGISTRY}/${service_name}:${version}"
    log_info "Pulling image: $image"

    if ! docker pull "$image"; then
        log_error "Failed to pull image: $image"
        return 1
    fi

    # Start container with target version
    log_info "Starting container with version $version..."

    docker run -d \
        --name "$service_name" \
        --restart unless-stopped \
        --network rez-network \
        -p "${port}:${port}" \
        --memory "512Mi" \
        --cpus "500m" \
        --health-cmd "curl -f http://localhost:${port}/health" \
        --health-interval 30s \
        --health-timeout 10s \
        --health-retries 3 \
        --health-start-period 30s \
        -e "NODE_ENV=production" \
        -e "PORT=${port}" \
        -e "APP_NAME=${service_name}" \
        -e "VERSION=${version}" \
        "$image"

    # Wait for container to start
    sleep 5

    # Check health
    local elapsed=0
    while [[ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]]; do
        if curl -sf --max-time 5 "http://localhost:$port/health" > /dev/null 2>&1; then
            log_success "$service_name is healthy after rollback"
            return 0
        fi
        sleep $HEALTH_CHECK_INTERVAL
        elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
    done

    log_error "$service_name health check failed after rollback"
    docker logs "$service_name" --tail 20
    return 1
}

# =============================================================================
# Rollback All Services
# =============================================================================

rollback_all_services() {
    log_info "Rolling back all services..."

    local failed_services=()

    for service_entry in "${SERVICES[@]}"; do
        service_name=$(get_service_name "$service_entry")

        if ! rollback_service "$service_entry" "$TARGET_VERSION"; then
            failed_services+=("$service_name")
        fi
    done

    if [[ ${#failed_services[@]} -gt 0 ]]; then
        log_error "Failed to rollback: ${failed_services[*]}"
        return 1
    fi

    return 0
}

# =============================================================================
# Main Rollback Flow
# =============================================================================

main() {
    # Parse --dry-run and --help flags
    for arg in "$@"; do
        case $arg in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
        esac
    done

    echo ""
    echo "================================================================================"
    echo "REZ Platform Rollback"
    echo "================================================================================"
    echo "Service: ${SERVICE:-all}"
    echo "Target Version: ${TARGET_VERSION:-previous}"
    echo "Dry Run: $DRY_RUN"
    echo "================================================================================"
    echo ""

    check_prerequisites
    validate_arguments

    if [[ "$SERVICE" == "all" ]]; then
        rollback_all_services
    else
        # Find the service entry
        for service_entry in "${SERVICES[@]}"; do
            if [[ "$(get_service_name "$service_entry")" == "$SERVICE" ]]; then
                rollback_service "$service_entry" "$TARGET_VERSION"
                break
            fi
        done
    fi

    if [[ $? -eq 0 ]]; then
        log_success "Rollback completed successfully"
        exit 0
    else
        log_error "Rollback completed with errors"
        exit 1
    fi
}

# Run main function
main "$@"
