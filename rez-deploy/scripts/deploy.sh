#!/usr/bin/env bash
# =============================================================================
# REZ Platform - Deployment Script
# =============================================================================
# Deploys all REZ microservices to the target environment
# Usage: ./deploy.sh [environment] [version] [service]
# Examples:
#   ./deploy.sh production latest
#   ./deploy.sh staging v1.2.3 rez-delivery-service
#   ./deploy.sh production v1.0.0 all
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_DIR="$PROJECT_ROOT"
ENV_FILE=".env.production"

# Default values
ENVIRONMENT="${1:-production}"
VERSION="${2:-latest}"
SERVICE="${3:-all}"
DRY_RUN="${DRY_RUN:-false}"
SKIP_TESTS="${SKIP_TESTS:-false}"
SKIP_BACKUP="${SKIP_BACKUP:-false}"
FORCE="${FORCE:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
# Prerequisites Check
# =============================================================================

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    # Check curl
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed or not in PATH"
        exit 1
    fi

    # Check jq
    if ! command -v jq &> /dev/null; then
        log_warning "jq is not installed. Some features may not work."
    fi

    log_success "All prerequisites met"
}

# =============================================================================
# Environment Validation
# =============================================================================

validate_environment() {
    log_info "Validating environment: $ENVIRONMENT"

    # Check if environment file exists
    if [[ -f "$DEPLOY_DIR/$ENV_FILE" ]]; then
        log_info "Loading environment from $ENV_FILE"
        set -a
        source "$DEPLOY_DIR/$ENV_FILE"
        set +a
    fi

    # Validate required environment variables
    if [[ -z "${DOCKER_REGISTRY:-}" ]]; then
        DOCKER_REGISTRY="registry.rez.app"
        log_warning "DOCKER_REGISTRY not set, using default: $DOCKER_REGISTRY"
    fi

    log_success "Environment validated"
}

# =============================================================================
# Pre-deployment Checks
# =============================================================================

pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi

    # Check disk space
    AVAILABLE_SPACE=$(df -BG "$DEPLOY_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ "$AVAILABLE_SPACE" -lt 10 ]]; then
        log_error "Insufficient disk space. Available: ${AVAILABLE_SPACE}G"
        exit 1
    fi

    log_success "Pre-deployment checks passed"
}

# =============================================================================
# Backup
# =============================================================================

create_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        log_info "Skipping backup as requested"
        return
    fi

    log_info "Creating backup..."

    BACKUP_DIR="$DEPLOY_DIR/backups/$(timestamp)"
    mkdir -p "$BACKUP_DIR"

    # Backup docker-compose files
    for service_entry in "${SERVICES[@]}"; do
        service_name=$(get_service_name "$service_entry")
        if [[ -f "$DEPLOY_DIR/${service_entry}/docker-compose.yml" ]]; then
            cp "$DEPLOY_DIR/${service_entry}/docker-compose.yml" "$BACKUP_DIR/"
        fi
    done

    # Backup .env files (excluding actual secrets)
    for service_entry in "${SERVICES[@]}"; do
        service_name=$(get_service_name "$service_entry")
        if [[ -f "$DEPLOY_DIR/${service_entry}/.env" ]]; then
            # Create a sanitized version without secrets
            grep -v "PASSWORD\|SECRET\|KEY\|TOKEN" "$DEPLOY_DIR/${service_entry}/.env" > "$BACKUP_DIR/${service_name}.env.example" 2>/dev/null || true
        fi
    done

    # Backup main docker-compose
    if [[ -f "$DEPLOY_DIR/docker-compose.prod.yml" ]]; then
        cp "$DEPLOY_DIR/docker-compose.prod.yml" "$BACKUP_DIR/"
    fi

    log_success "Backup created at $BACKUP_DIR"
}

# =============================================================================
# Health Check
# =============================================================================

check_service_health() {
    local service_name=$1
    local port=$2
    local timeout=${3:-60}
    local interval=${4:-5}

    log_info "Checking health for $service_name on port $port..."

    local elapsed=0
    while [[ $elapsed -lt $timeout ]]; do
        if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
            log_success "$service_name is healthy"
            return 0
        fi
        sleep $interval
        elapsed=$((elapsed + interval))
    done

    log_error "$service_name health check failed after ${timeout}s"
    return 1
}

# =============================================================================
# Deploy Single Service
# =============================================================================

deploy_service() {
    local service_entry=$1
    local service_name=$(get_service_name "$service_entry")
    local port=$(get_service_port "$service_entry")

    log_info "Deploying $service_name (port: $port)..."

    local image="${DOCKER_REGISTRY}/${service_name}:${VERSION}"

    # Pull the image
    log_info "Pulling image: $image"
    if ! docker pull "$image"; then
        log_error "Failed to pull image for $service_name"
        return 1
    fi

    # Stop existing container
    if docker ps -a --filter "name=$service_name" --format "{{.Names}}" | grep -q "^${service_name}$"; then
        log_info "Stopping existing container: $service_name"
        docker stop "$service_name" || true
        docker rm "$service_name" || true
    fi

    # Start new container
    log_info "Starting container: $service_name"

    # Determine resource limits based on service
    local cpu_limit="500m"
    local memory_limit="512Mi"

    case "$service_name" in
        "rez-analytics-service"|"rez-websocket-hub")
            cpu_limit="1000m"
            memory_limit="1Gi"
            ;;
        "rez-currency-service"|"rez-rate-limit")
            cpu_limit="250m"
            memory_limit="256Mi"
            ;;
    esac

    # Determine replicas based on service
    local replicas=1
    case "$service_name" in
        "rez-delivery-service"|"rez-payment-links-service"|"rez-validation-service"|"rez-menu-service"|"rez-tracking-service"|"rez-websocket-hub"|"rez-rate-limit")
            replicas=2
            ;;
        "rez-websocket-hub")
            replicas=3
            ;;
    esac

    # Start the container
    docker run -d \
        --name "$service_name" \
        --restart unless-stopped \
        --network rez-network \
        -p "${port}:${port}" \
        --memory "$memory_limit" \
        --cpus "$cpu_limit" \
        --health-cmd "curl -f http://localhost:${port}/health" \
        --health-interval 30s \
        --health-timeout 10s \
        --health-retries 3 \
        --health-start-period 30s \
        -e "NODE_ENV=production" \
        -e "PORT=${port}" \
        -e "APP_NAME=${service_name}" \
        -e "VERSION=${VERSION}" \
        -e "ENVIRONMENT=${ENVIRONMENT}" \
        "$image"

    # Wait for container to start
    sleep 5

    # Check health
    if ! check_service_health "$service_name" "$port"; then
        log_error "Health check failed for $service_name"
        docker logs "$service_name" --tail 50
        return 1
    fi

    log_success "Successfully deployed $service_name"
    return 0
}

# =============================================================================
# Deploy All Services
# =============================================================================

deploy_all_services() {
    log_info "Deploying all services..."

    local failed_services=()

    for service_entry in "${SERVICES[@]}"; do
        if ! deploy_service "$service_entry"; then
            failed_services+=("$service_entry")
        fi
    done

    if [[ ${#failed_services[@]} -gt 0 ]]; then
        log_error "Failed to deploy: ${failed_services[*]}"
        return 1
    fi

    return 0
}

# =============================================================================
# Docker Network Setup
# =============================================================================

setup_network() {
    log_info "Setting up Docker network..."

    if ! docker network ls | grep -q "rez-network"; then
        docker network create --driver bridge rez-network
        log_success "Created rez-network"
    else
        log_info "rez-network already exists"
    fi
}

# =============================================================================
# Post-deployment Verification
# =============================================================================

post_deployment_verification() {
    log_info "Running post-deployment verification..."

    local failed_checks=()

    for service_entry in "${SERVICES[@]}"; do
        service_name=$(get_service_name "$service_entry")
        port=$(get_service_port "$service_entry")

        if ! check_service_health "$service_name" "$port" 30 3; then
            failed_checks+=("$service_name")
        fi
    done

    if [[ ${#failed_checks[@]} -gt 0 ]]; then
        log_error "Health checks failed for: ${failed_checks[*]}"
        return 1
    fi

    log_success "All health checks passed"
    return 0
}

# =============================================================================
# Display Deployment Status
# =============================================================================

display_status() {
    echo ""
    echo "================================================================================"
    echo "REZ Platform Deployment Summary"
    echo "================================================================================"
    echo "Environment: $ENVIRONMENT"
    echo "Version: $VERSION"
    echo "Service: $SERVICE"
    echo "Timestamp: $(timestamp)"
    echo ""
    echo "Service Status:"
    echo "--------------------------------------------------------------------------------"

    for service_entry in "${SERVICES[@]}"; do
        service_name=$(get_service_name "$service_entry")
        port=$(get_service_port "$service_entry")

        if docker ps --filter "name=$service_name" --format "{{.Names}}" | grep -q "^${service_name}$"; then
            status=$(curl -sf "http://localhost:$port/health" > /dev/null 2>&1 && echo -e "${GREEN}healthy${NC}" || echo -e "${RED}unhealthy${NC}")
            echo -e "  $service_name:$port - $status"
        else
            echo -e "  $service_name:$port - ${RED}not running${NC}"
        fi
    done

    echo "================================================================================"
    echo ""
}

# =============================================================================
# Main Deployment Flow
# =============================================================================

main() {
    echo ""
    echo "================================================================================"
    echo "REZ Platform Deployment"
    echo "================================================================================"
    echo "Environment: $ENVIRONMENT"
    echo "Version: $VERSION"
    echo "Service: $SERVICE"
    echo "Dry Run: $DRY_RUN"
    echo "================================================================================"
    echo ""

    # Check if running in dry-run mode
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "Running in DRY-RUN mode. No actual deployment will occur."
        exit 0
    fi

    # Run deployment steps
    check_prerequisites
    validate_environment
    pre_deployment_checks

    if [[ "$SKIP_BACKUP" != "true" ]]; then
        create_backup
    fi

    setup_network

    if [[ "$SERVICE" == "all" ]]; then
        deploy_all_services
    else
        # Find the service entry
        for service_entry in "${SERVICES[@]}"; do
            if [[ "$(get_service_name "$service_entry")" == "$SERVICE" ]]; then
                deploy_service "$service_entry"
                break
            fi
        done
    fi

    if post_deployment_verification; then
        log_success "Deployment completed successfully"
        display_status
        exit 0
    else
        log_error "Deployment completed with errors"
        display_status
        exit 1
    fi
}

# Run main function
main "$@"
