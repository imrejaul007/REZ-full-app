#!/bin/bash
# ============================================================
# REZ Ecosystem — Deployment Script
# ============================================================
# Usage:
#   ./scripts/deploy.sh              # Full local deployment
#   ./scripts/deploy.sh --build      # Build only
#   ./scripts/deploy.sh --start      # Start only (assumes already built)
#   ./scripts/deploy.sh --stop       # Stop all services
#   ./scripts/deploy.sh --logs       # View logs
#   ./scripts/deploy.sh --status     # Check status
#   ./scripts/deploy.sh --push       # Push images to registry
#   ./scripts/deploy.sh --k8s        # Deploy to Kubernetes
#   ./scripts/deploy.sh --clean      # Clean up everything
# ============================================================

set -e

# ── Bash version check ────────────────────────────────────
# Requires bash 4+ for associative arrays, but provides fallback
BASH_MAJOR=$(echo $BASH_VERSION | cut -d. -f1)
BASH_MINOR=$(echo $BASH_VERSION | cut -d. -f2)
if [ "$BASH_MAJOR" -lt 4 ]; then
    echo "WARNING: bash 4+ recommended. Current: bash $BASH_VERSION"
    echo "Some features may not work correctly on macOS."
    echo "Consider upgrading: brew install bash"
fi

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
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# ── Project setup ─────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

COMPOSE_FILE="docker-compose.yml"
REGISTRY="${REGISTRY:-ghcr.io/rez-money}"
TAG="${TAG:-latest}"

# ── Service definitions (bash 3 compatible) ──────────────────
# Using parallel arrays instead of associative arrays for bash 3 compatibility
SERVICE_NAMES=(
    "auth-api"
    "merchant-api"
    "rendez-backend"
    "hotel-ota-api"
    "rez-intelligence-hub"
    "rez-intent-graph"
    "rez-personalization-engine"
    "rez-targeting-engine"
    "rez-action-engine"
    "rez-scheduler-service"
    "rez-automation-service"
    "rez-corporate-service"
    "rez-feedback-service"
    "nextabizz-web"
    "hotel-panel"
    "rez-now"
)

SERVICE_PORTS=(
    "4002"
    "4005"
    "4000"
    "3000"
    "4020"
    "3001"
    "4017"
    "3013"
    "3014"
    "3012"
    "3016"
    "4030"
    "4010"
    "3001"
    "3002"
    "3003"
)

K8S_NAMES=(
    "rez-auth-service"
    "rez-merchant-service"
    "rendez-backend"
    "hotel-ota-api"
    "rez-intelligence-hub"
    "rez-intent-graph"
    "rez-personalization-engine"
    "rez-targeting-engine"
    "rez-action-engine"
    "rez-scheduler-service"
    "rez-automation-service"
    "rez-corporate-service"
    "rez-feedback-service"
    "nextabizz-web"
    "hotel-panel"
    "rez-now"
)

BUILD_CONTEXTS_ARRAY=(
    "./rez-auth-service"
    "./rez-merchant-service"
    "./Rendez/rendez-backend"
    "./Hotel OTA/apps/api"
    "./rez-intelligence-hub"
    "./rez-intent-graph"
    "./rez-personalization-engine"
    "./rez-targeting-engine"
    "./rez-action-engine"
    "./rez-scheduler-service"
    "./rez-automation-service"
    "./rez-corporate-service"
    "./rez-feedback-service"
    "./nextabizz/apps/web"
    "./Hotel OTA/apps/hotel-panel"
    "./rez-now"
)

# ── Lookup functions (bash 3 compatible) ───────────────────
get_service_port() {
    local svc=$1
    for i in "${!SERVICE_NAMES[@]}"; do
        if [ "${SERVICE_NAMES[$i]}" = "$svc" ]; then
            echo "${SERVICE_PORTS[$i]}"
            return 0
        fi
    done
    return 1
}

get_k8s_name() {
    local svc=$1
    for i in "${!SERVICE_NAMES[@]}"; do
        if [ "${SERVICE_NAMES[$i]}" = "$svc" ]; then
            echo "${K8S_NAMES[$i]}"
            return 0
        fi
    done
    echo "$svc"
    return 1
}

get_build_context() {
    local svc=$1
    for i in "${!SERVICE_NAMES[@]}"; do
        if [ "${SERVICE_NAMES[$i]}" = "$svc" ]; then
            echo "${BUILD_CONTEXTS_ARRAY[$i]}"
            return 0
        fi
    done
    return 1
}

get_all_services() {
    echo "${SERVICE_NAMES[@]}"
}

# ── Pre-flight checks ─────────────────────────────────────

# ── Pre-flight checks ─────────────────────────────────────
check_docker() {
    log_step "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    docker version --format "Docker {{.Server.Version}}"
}

check_kubectl() {
    log_step "Checking kubectl..."
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    kubectl version --client --short 2>/dev/null || kubectl version --client
}

check_helm() {
    if command -v helm &> /dev/null; then
        helm version --short
        return 0
    else
        log_warn "helm not found. Some features may be limited."
        return 1
    fi
}

# ── Directory setup ────────────────────────────────────────
create_dirs() {
    log_info "Creating required directories..."
    mkdir -p nginx
    mkdir -p scripts
    mkdir -p docs
}

# ── Build functions ─────────────────────────────────────────
build_service() {
    local service=$1
    local context=$(get_build_context "$service")

    if [ -z "$context" ] || [ ! -d "$context" ]; then
        log_warn "Skipping $service (no context found)"
        return 0
    fi

    log_info "Building $service from $context..."
    docker build -t "$REGISTRY/$service:$TAG" "$context"
}

build_services() {
    log_step "Building Docker images..."

    # Build all services in parallel
    local pids=()
    for service in $(get_all_services); do
        build_service "$service" &
        pids+=($!)
    done

    # Wait for all builds
    local failed=0
    for pid in "${pids[@]}"; do
        if ! wait "$pid"; then
            failed=1
        fi
    done

    if [ $failed -eq 1 ]; then
        log_error "Some builds failed"
        exit 1
    fi

    log_success "All images built successfully!"
}

build_single_service() {
    local service=$1
    local port=$(get_service_port "$service")
    if [ -z "$port" ]; then
        log_error "Unknown service: $service"
        exit 1
    fi

    check_docker
    build_service "$service"
    log_success "$service built successfully!"
}

# ── Push functions ──────────────────────────────────────────
push_service() {
    local service=$1
    log_info "Pushing $service to registry..."
    docker push "$REGISTRY/$service:$TAG"
}

push_images() {
    log_step "Pushing images to registry..."

    if [ -z "$REGISTRY" ]; then
        log_error "REGISTRY not set. Set REGISTRY environment variable."
        exit 1
    fi

    for service in $(get_all_services); do
        push_service "$service" &
    done

    wait
    log_success "All images pushed!"
}

push_single_service() {
    local service=$1
    check_docker
    push_service "$service"
}

# ── Start/stop functions ─────────────────────────────────────
start_services() {
    log_step "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d

    # Wait for services to be healthy
    log_info "Waiting for services to become healthy..."
    local max_wait=120
    local elapsed=0

    while [ $elapsed -lt $max_wait ]; do
        local all_healthy=true
        for service in $(get_all_services); do
            local port=$(get_service_port "$service")
            if [ -n "$port" ] && ! curl -sf "http://localhost:$port/health" > /dev/null 2>&1 && \
               ! curl -sf "http://localhost:$port/api/v1/health" > /dev/null 2>&1 && \
               ! curl -sf "http://localhost:$port/_next/health" > /dev/null 2>&1; then
                all_healthy=false
                break
            fi
        done

        if $all_healthy; then
            break
        fi

        echo -n "."
        sleep 5
        elapsed=$((elapsed + 5))
    done
    echo ""

    check_status
}

stop_services() {
    log_step "Stopping services..."
    docker-compose -f "$COMPOSE_FILE" down
    log_success "All services stopped!"
}

# ── Logs ────────────────────────────────────────────────────
view_logs() {
    local service="${1:-}"
    if [ -n "$service" ]; then
        local port=$(get_service_port "$service")
        if [ -z "$port" ]; then
            log_error "Unknown service: $service"
            echo "Available services:"
            for s in $(get_all_services); do
                echo "  - $s"
            done
            exit 1
        fi
        log_info "Viewing logs for $service..."
        docker-compose -f "$COMPOSE_FILE" logs -f "$service"
    else
        log_info "Viewing logs for all services..."
        docker-compose -f "$COMPOSE_FILE" logs -f
    fi
}

# ── Status ──────────────────────────────────────────────────
check_status() {
    log_info "Service Status:"
    echo ""
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""

    log_info "Service Endpoints:"
    local healthy=0
    local total=0
    for service in $(get_all_services); do
        local port=$(get_service_port "$service")
        if [ -z "$port" ]; then
            continue
        fi
        total=$((total + 1))
        if curl -sf "http://localhost:$port/health" > /dev/null 2>&1 || \
           curl -sf "http://localhost:$port/api/v1/health" > /dev/null 2>&1 || \
           curl -sf "http://localhost:$port/_next/health" > /dev/null 2>&1; then
            echo -e "  ${GREEN}[OK]${NC}   $service: http://localhost:$port"
            healthy=$((healthy + 1))
        else
            echo -e "  ${RED}[FAIL]${NC} $service: http://localhost:$port"
        fi
    done
    echo ""
    echo "Health: $healthy/$total services responding"
}

# ── Migrations ──────────────────────────────────────────────
run_migrations() {
    log_step "Running database migrations..."

    # Create databases if they don't exist
    docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U rez -c "CREATE DATABASE rez_now;" 2>/dev/null || true
    docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U rez -c "CREATE DATABASE verify_db;" 2>/dev/null || true
    docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U rez -c "CREATE DATABASE rez_try;" 2>/dev/null || true
    docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U rez -c "CREATE DATABASE rendez_dev;" 2>/dev/null || true
    docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U rez -c "CREATE DATABASE hotel_ota_dev;" 2>/dev/null || true

    # Run Prisma migrations
    for service in rendez-backend hotel-ota-api; do
        log_info "Running Prisma migrations for $service..."
        docker-compose -f "$COMPOSE_FILE" exec -T "$service" sh -c "npx prisma migrate deploy" 2>/dev/null || \
            log_warn "Migration failed or not needed for $service"
    done

    # MongoDB migrations (if using mongoose)
    for service in auth-api merchant-api rez-intent-graph; do
        if docker-compose -f "$COMPOSE_FILE" exec -T "$service" sh -c "test -f /app/src/migrations/run.js" 2>/dev/null; then
            log_info "Running MongoDB migrations for $service..."
            docker-compose -f "$COMPOSE_FILE" exec -T "$service" node /app/src/migrations/run.js 2>/dev/null || \
                log_warn "Migration failed or not needed for $service"
        fi
    done

    log_success "Migrations complete!"
}

# ── Kubernetes deployment ───────────────────────────────────
deploy_to_k8s() {
    local namespace="${1:-rez-staging}"
    local tag="${2:-$TAG}"

    check_kubectl

    log_step "Deploying to Kubernetes namespace: $namespace"

    # Check cluster connectivity
    if ! kubectl cluster-info &>/dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Create namespace if not exists
    kubectl create namespace "$namespace" --dry-run=client -o yaml | kubectl apply -f -

    # Deploy each service
    local failed=0
    for service in $(get_all_services); do
        local k8s_name=$(get_k8s_name "$service")
        log_info "Deploying $service as $k8s_name..."

        # Use the image from registry
        local image="$REGISTRY/$service:$tag"

        # Check if deployment exists
        if kubectl get deployment "$k8s_name" -n "$namespace" &>/dev/null; then
            kubectl set image deployment/"$k8s_name" "$k8s_name"="$image" -n "$namespace"
        else
            log_warn "Deployment $k8s_name not found. Create it first with kubectl."
        fi
    done

    # Wait for rollouts
    log_info "Waiting for deployments..."
    for service in $(get_all_services); do
        local k8s_name=$(get_k8s_name "$service")
        kubectl rollout status deployment/"$k8s_name" -n "$namespace" --timeout=300s || failed=1
    done

    if [ $failed -eq 1 ]; then
        log_error "Some deployments failed"
        exit 1
    fi

    log_success "Deployed to $namespace!"
    kubectl get pods -n "$namespace"
}

k8s_rollback() {
    local service="${1:-}"
    local namespace="${2:-rez-staging}"

    check_kubectl

    if [ -n "$service" ]; then
        local k8s_name=$(get_k8s_name "$service")
        log_info "Rolling back $k8s_name..."
        kubectl rollout undo deployment/"$k8s_name" -n "$namespace"
        kubectl rollout status deployment/"$k8s_name" -n "$namespace"
    else
        log_info "Rolling back all services in $namespace..."
        for service in $(get_all_services); do
            local k8s_name=$(get_k8s_name "$service")
            kubectl rollout undo deployment/"$k8s_name" -n "$namespace" 2>/dev/null || true
        done
    fi

    log_success "Rollback complete!"
}

k8s_status() {
    local namespace="${1:-rez-staging}"

    check_kubectl

    log_info "Kubernetes Status for namespace: $namespace"
    echo ""
    kubectl get pods -n "$namespace"
    echo ""
    kubectl get services -n "$namespace"
    echo ""
    kubectl get deployments -n "$namespace"
}

k8s_logs() {
    local service="${1:-}"
    local namespace="${2:-rez-staging}"
    local lines="${3:-100}"

    check_kubectl

    if [ -n "$service" ]; then
        local k8s_name=$(get_k8s_name "$service")
        log_info "Logs for $k8s_name (last $lines lines)..."
        kubectl logs -n "$namespace" -l "app=$k8s_name" --tail="$lines" -f
    else
        log_info "Logs for all pods in $namespace..."
        kubectl logs -n "$namespace" --tail="$lines" -f --all-containers
    fi
}

# ── Cleanup ──────────────────────────────────────────────────
cleanup() {
    log_step "Cleaning up..."
    docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans
    docker system prune -f
    log_success "Cleanup complete!"
}

clean_images() {
    log_step "Cleaning up Docker images..."
    read -p "Remove all REZ images? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker images | grep "$REGISTRY" | awk '{print $3}' | xargs -r docker rmi -f || true
        docker system prune -f
        log_success "Images cleaned!"
    else
        log_info "Aborted"
    fi
}

# ── Help ────────────────────────────────────────────────────
show_help() {
    cat << EOF
REZ Ecosystem Deployment Script

Usage: ./scripts/deploy.sh [command] [options]

Commands:
  --build              Build all Docker images
  --build <service>    Build single service
  --push               Push all images to registry
  --push <service>     Push single service image
  --start              Start all services
  --stop               Stop all services
  --restart            Restart all services
  --logs [service]     View logs (all or specific service)
  --status             Check service status
  --migrate            Run database migrations
  --k8s [namespace]    Deploy to Kubernetes
  --k8s-rollback [svc] Rollback Kubernetes deployment
  --k8s-status [ns]    Show K8s status
  --k8s-logs [svc]    Show K8s logs
  --clean              Full cleanup (containers + volumes)
  --clean-images       Remove all images (interactive)
  --help               Show this help

Environment Variables:
  REGISTRY             Container registry (default: ghcr.io/rez-money)
  TAG                  Image tag (default: latest)
  KUBECONFIG           Path to kubeconfig for K8s commands

Examples:
  ./scripts/deploy.sh                    # Full deployment
  ./scripts/deploy.sh --build            # Build all images
  ./scripts/deploy.sh --build auth-api   # Build single service
  ./scripts/deploy.sh --push            # Push to registry
  ./scripts/deploy.sh --k8s production   # Deploy to K8s
  ./scripts/deploy.sh --k8s-rollback auth-api staging

EOF
}

# ── Main ────────────────────────────────────────────────────
main() {
    case "${1:-}" in
        --build)
            if [ -n "${2:-}" ]; then
                build_single_service "$2"
            else
                check_docker
                create_dirs
                build_services
            fi
            ;;
        --push)
            if [ -n "${2:-}" ]; then
                push_single_service "$2"
            else
                push_images
            fi
            ;;
        --start)
            check_docker
            start_services
            ;;
        --stop)
            stop_services
            ;;
        --restart)
            check_docker
            stop_services
            sleep 2
            start_services
            ;;
        --logs)
            view_logs "${2:-}"
            ;;
        --status)
            check_status
            ;;
        --migrate)
            check_docker
            run_migrations
            ;;
        --k8s)
            deploy_to_k8s "${2:-rez-staging}" "${3:-$TAG}"
            ;;
        --k8s-rollback)
            k8s_rollback "${2:-}" "${3:-rez-staging}"
            ;;
        --k8s-status)
            k8s_status "${2:-rez-staging}"
            ;;
        --k8s-logs)
            k8s_logs "${2:-}" "${3:-rez-staging}" "${4:-100}"
            ;;
        --clean)
            cleanup
            ;;
        --clean-images)
            clean_images
            ;;
        --help|-h)
            show_help
            ;;
        *)
            check_docker
            create_dirs
            build_services
            start_services
            run_migrations
            echo ""
            log_success "Deployment complete!"
            echo ""
            echo "Service Endpoints:"
            for service in $(get_all_services); do
                local port=$(get_service_port "$service")
                echo "  - $service: http://localhost:$port"
            done
            echo ""
            echo "View logs: ./scripts/deploy.sh --logs"
            echo "Check status: ./scripts/deploy.sh --status"
            echo "Deploy to K8s: REGISTRY=your-registry ./scripts/deploy.sh --k8s"
            ;;
    esac
}

main "$@"
