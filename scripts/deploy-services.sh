#!/bin/bash
#
# REZ Ecosystem - Production Deployment to Render.com
# Deploys all 13 services to Render.com
#
# Usage: ./scripts/deploy-services.sh [--dry-run] [--service=<name>] [--all]
#
# Options:
#   --dry-run       Preview commands without executing
#   --service=NAME Deploy specific service only
#   --all          Deploy all services (default)
#   --check        Verify health checks only
#   --help         Show this help message
#
# Prerequisites:
#   - render-cli installed: npm install -g @render/cli
#   - render-cli authenticated: render login
#   - render.yaml files present in each service directory
#

set -euo pipefail

# ── Colors ─────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Log functions ─────────────────────────────────────────
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ── Configuration ────────────────────────────────────────
DRY_RUN=false
SPECIFIC_SERVICE=""
MODE="all"

# Services to deploy in order of dependencies (Tier 1 = foundation, higher = dependent)
TIER1_SERVICES=(
    "rez-feature-flags"
    "rez-observability"
    "rez-knowledge-base-service"
)

TIER2_SERVICES=(
    "rez-gamification-service"
    "rez-karma-service"
    "rez-profile-service"
    "rez-ads-service"
)

TIER3_SERVICES=(
    "rez-media-events"
    "rez-feedback-service"
    "rez-stayown-service"
)

TIER4_SERVICES=(
    "rez-corporate-service"
    "rez-travel-service"
    "rez-marketing-service"
    "rez-merchant-intelligence-service"
)

ALL_SERVICES=(
    "${TIER1_SERVICES[@]}"
    "${TIER2_SERVICES[@]}"
    "${TIER3_SERVICES[@]}"
    "${TIER4_SERVICES[@]}"
)

# Service URLs for health checks
declare -A SERVICE_URLS=(
    ["rez-feature-flags"]="https://rez-feature-flags.onrender.com"
    ["rez-observability"]="https://rez-observability.onrender.com"
    ["rez-knowledge-base-service"]="https://rez-knowledge-base-service.onrender.com"
    ["rez-gamification-service"]="https://rez-gamification-service.onrender.com"
    ["rez-karma-service"]="https://rez-karma-service.onrender.com"
    ["rez-profile-service"]="https://rez-profile-service.onrender.com"
    ["rez-ads-service"]="https://rez-ads-service.onrender.com"
    ["rez-media-events"]="https://rez-media-events.onrender.com"
    ["rez-feedback-service"]="https://rez-feedback-service.onrender.com"
    ["rez-stayown-service"]="https://rez-stayown-service.onrender.com"
    ["rez-corporate-service"]="https://rez-corporate-service.onrender.com"
    ["rez-travel-service"]="https://rez-travel-service.onrender.com"
    ["rez-marketing-service"]="https://rez-marketing-service.onrender.com"
    ["rez-merchant-intelligence-service"]="https://rez-merchant-intelligence.onrender.com"
)

# Health check endpoints per service
declare -A HEALTH_ENDPOINTS=(
    ["rez-gamification-service"]="/health"
    ["rez-ads-service"]="/health"
    ["rez-marketing-service"]="/health"
    ["rez-profile-service"]="/health"
    ["rez-feedback-service"]="/health/live"
    ["rez-media-events"]="/health"
    ["rez-corporate-service"]="/health"
    ["rez-karma-service"]="/health/live"
    ["rez-travel-service"]="/health"
    ["rez-knowledge-base-service"]="/health"
    ["rez-observability"]="/health"
    ["rez-feature-flags"]="/health"
    ["rez-stayown-service"]="/health"
    ["rez-merchant-intelligence-service"]="/health"
)

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_LOG="$BASE_DIR/deployment-$(date +%Y%m%d-%H%M%S).log"

# ── Parse arguments ──────────────────────────────────────
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --service=*)
                SPECIFIC_SERVICE="${1#*=}"
                MODE="single"
                shift
                ;;
            --all)
                MODE="all"
                shift
                ;;
            --check)
                MODE="check"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown argument: $1"
                exit 1
                ;;
        esac
    done
}

# ── Prerequisites ─────────────────────────────────────────
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if render-cli is installed
    if ! command -v render &> /dev/null; then
        log_warn "render-cli not found. Installing..."
        npm install -g @render/cli
    fi

    # Check if authenticated
    if ! render whoami &> /dev/null; then
        log_error "Not authenticated with Render. Please run: render login"
        exit 1
    fi

    log_success "Prerequisites OK"
}

# ── Verify render.yaml exists ─────────────────────────────
verify_render_yaml() {
    local service=$1
    local service_dir="$BASE_DIR/$service"

    if [[ ! -f "$service_dir/render.yaml" ]]; then
        log_error "Missing render.yaml in $service"
        return 1
    fi
    return 0
}

# ── Deploy a single service ───────────────────────────────
deploy_service() {
    local service=$1
    local service_dir="$BASE_DIR/$service"

    log_info "Deploying $service..."

    if [[ ! -d "$service_dir" ]]; then
        log_error "Service directory not found: $service_dir"
        return 1
    fi

    if ! verify_render_yaml "$service"; then
        return 1
    fi

    if $DRY_RUN; then
        log_info "[DRY-RUN] Would deploy: $service"
        log_info "[DRY-RUN] Command: cd $service_dir && render blueprint deploy"
        return 0
    fi

    cd "$service_dir"

    # Deploy using render CLI
    if render blueprint create --file=render.yaml 2>&1 | tee -a "$DEPLOY_LOG"; then
        log_success "$service deployed successfully"
        cd - > /dev/null
        return 0
    else
        log_error "Failed to deploy $service"
        cd - > /dev/null
        return 1
    fi
}

# ── Health check a service ────────────────────────────────
health_check() {
    local service=$1
    local url="${SERVICE_URLS[$service]}"
    local endpoint="${HEALTH_ENDPOINTS[$service]:-/health}"
    local full_url="${url}${endpoint}"

    log_info "Health check: $full_url"

    if $DRY_RUN; then
        log_info "[DRY-RUN] Would check: curl -sf $full_url"
        return 0
    fi

    local response
    local max_attempts=3
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        response=$(curl -sf --max-time 30 "$full_url" 2>&1) && break
        log_warn "Attempt $attempt/$max_attempts failed for $service"
        sleep 5
        ((attempt++))
    done

    if [[ -z "$response" ]]; then
        log_error "Health check failed for $service"
        return 1
    fi

    if echo "$response" | grep -q "status"; then
        log_success "$service is healthy: $response"
        return 0
    else
        log_warn "Unexpected health check response for $service: $response"
        return 1
    fi
}

# ── Deploy all services ───────────────────────────────────
deploy_all() {
    local failed=0
    local deployed=0
    local tier_num=1

    log_info "Starting deployment of ${#ALL_SERVICES[@]} services..."
    log_info "Log file: $DEPLOY_LOG"
    echo "" > "$DEPLOY_LOG"

    # Deploy in tiers
    for tier in TIER1_SERVICES TIER2_SERVICES TIER3_SERVICES TIER4_SERVICES; do
        echo ""
        log_info "=========================================="
        log_info "Deploying Tier $tier_num services"
        log_info "=========================================="

        # Get array content
        local tier_services=("${!tier}")

        for service in "${tier_services[@]}"; do
            echo ""
            log_info "----------------------------------------"
            log_info "Deploying: $service"
            log_info "----------------------------------------"

            if deploy_service "$service"; then
                ((deployed++))
            else
                ((failed++))
                log_error "Deployment failed for $service"
            fi

            # Small delay between deployments
            sleep 2
        done

        ((tier_num++))
    done

    echo ""
    log_info "=========================================="
    log_info "Deployment Summary"
    log_info "=========================================="
    log_success "Deployed: $deployed/${#ALL_SERVICES[@]}"
    [[ $failed -gt 0 ]] && log_error "Failed: $failed" || true
    log_info "Full log: $DEPLOY_LOG"

    return $failed
}

# ── Deploy specific service ───────────────────────────────
deploy_specific() {
    local service="$SPECIFIC_SERVICE"

    # Check if service exists
    if [[ ! -d "$BASE_DIR/$service" ]]; then
        log_error "Service not found: $service"
        echo "Available services:"
        for s in "${ALL_SERVICES[@]}"; do
            echo "  - $s"
        done
        exit 1
    fi

    if deploy_service "$service"; then
        log_info "Running health check..."
        health_check "$service"
    fi
}

# ── Run all health checks ─────────────────────────────────
run_health_checks() {
    log_info "Running health checks for all ${#ALL_SERVICES[@]} services..."
    echo ""

    local failed=0
    local healthy=0

    for service in "${ALL_SERVICES[@]}"; do
        if health_check "$service"; then
            ((healthy++))
        else
            ((failed++))
        fi
    done

    echo ""
    log_info "=========================================="
    log_info "Health Check Summary"
    log_info "=========================================="
    log_success "Healthy: $healthy/${#ALL_SERVICES[@]}"
    [[ $failed -gt 0 ]] && log_error "Failed: $failed" || true

    return $failed
}

# ── Show help ─────────────────────────────────────────────
show_help() {
    cat << EOF
REZ Ecosystem - Production Deployment Script

Usage: $0 [OPTIONS]

Options:
  --dry-run           Preview commands without executing
  --service=NAME     Deploy specific service only
  --all              Deploy all services (default)
  --check            Verify health checks only
  --help, -h         Show this help message

Services Available:
  Tier 1 (Foundation):
    - rez-feature-flags
    - rez-observability
    - rez-knowledge-base-service

  Tier 2 (Core Business):
    - rez-gamification-service
    - rez-karma-service
    - rez-profile-service
    - rez-ads-service

  Tier 3 (Integration):
    - rez-media-events
    - rez-feedback-service
    - rez-stayown-service

  Tier 4 (External Integration):
    - rez-corporate-service
    - rez-travel-service
    - rez-marketing-service
    - rez-merchant-intelligence-service

Prerequisites:
  - npm install -g @render/cli
  - render login

Examples:
  $0 --dry-run                    # Preview all deployments
  $0 --service=rez-karma-service  # Deploy single service
  $0 --all                        # Deploy all services
  $0 --check                      # Health check all services

EOF
}

# ── Main function ─────────────────────────────────────────
main() {
    echo ""
    echo "=========================================="
    echo "  REZ Ecosystem - Render Deployment"
    echo "  Date: $(date)"
    echo "=========================================="
    echo ""

    parse_args "$@"

    check_prerequisites

    case $MODE in
        all)
            deploy_all
            ;;
        single)
            deploy_specific
            ;;
        check)
            run_health_checks
            ;;
    esac
}

# Run main
main "$@"
