#!/bin/bash
# =============================================================================
# ReZ Platform - Production Core Services Deployment Script
# =============================================================================
# Deploys: API Gateway, Auth, Wallet, Payment, Merchant, Order, Finance, Search
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/deploy_$TIMESTAMP.log"

# Service configurations: name, port, docker_container, health_endpoint, dependencies
declare -A SERVICES=(
  [rez-auth-service]="4002:rez-auth-service:/health:[]"
  [rez-wallet-service]="4004:rez-wallet-service:/health:[\"rez-auth-service\"]"
  [rez-payment-service]="4001:rez-payment-service:/health:[\"rez-auth-service\",\"rez-wallet-service\"]"
  [rez-merchant-service]="4005:rez-merchant-service:/health:[\"rez-auth-service\"]"
  [rez-order-service]="3006:rez-order-service:/health:[\"rez-auth-service\",\"rez-merchant-service\",\"rez-payment-service\"]"
  [rez-finance-service]="4006:rez-finance-service:/health:[\"rez-auth-service\"]"
  [rez-search-service]="4003:rez-search-service:/health:[\"rez-auth-service\"]"
  [rez-api-gateway]="3001:rez-api-gateway:/health:[\"rez-auth-service\"]"
)

# =============================================================================
# Helper Functions
# =============================================================================

log() {
  local level=$1
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "${timestamp} [$level] $message" | tee -a "$LOG_FILE"
}

info() { log "INFO" "${CYAN}$@${NC}"; }
success() { log "SUCCESS" "${GREEN}$@${NC}"; }
warn() { log "WARN" "${YELLOW}$@${NC}"; }
error() { log "ERROR" "${RED}$@${NC}"; }

section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${CYAN}  $@${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

spinner() {
  local pid=$1
  local delay=0.1
  local spinstr='|/-\'
  while kill -0 $pid 2>/dev/null; do
    local temp=${spinstr#?}
    printf " [%c] " "${spinstr}" | tee -a "$LOG_FILE"
    spinstr=${temp}${spinstr%"$temp"}
    sleep $delay
    printf "\b\b\b\b\b" | tee -a "$LOG_FILE"
  done
  printf "    \b\b\b\b" | tee -a "$LOG_FILE"
}

# =============================================================================
# Setup
# =============================================================================

setup() {
  # Create log directory
  mkdir -p "$LOG_DIR"

  # Check prerequisites
  info "Checking prerequisites..."

  # Check Node.js
  if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
    exit 1
  fi
  info "Node.js $(node -v)"

  # Check npm
  if ! command -v npm &> /dev/null; then
    error "npm is not installed"
    exit 1
  fi
  info "npm $(npm -v)"

  # Check MongoDB
  if ! nc -z localhost 27017 2>/dev/null; then
    error "MongoDB is not running on port 27017"
    exit 1
  fi
  info "MongoDB is running"

  # Check Redis
  if ! nc -z localhost 6379 2>/dev/null; then
    error "Redis is not running on port 6379"
    exit 1
  fi
  info "Redis is running"

  success "All prerequisites met"
}

# =============================================================================
# Service Deployment Functions
# =============================================================================

build_service() {
  local service_name=$1
  local service_dir="$SCRIPT_DIR/$service_name"

  info "Building $service_name..."

  cd "$service_dir"

  # Install dependencies if node_modules doesn't exist
  if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    info "Installing dependencies for $service_name..."
    npm install --legacy-peer-deps 2>&1 | tee -a "$LOG_FILE"
  fi

  # Build TypeScript
  if [ -f "package.json" ] && grep -q '"build"' "package.json"; then
    info "Building TypeScript for $service_name..."
    npm run build 2>&1 | tee -a "$LOG_FILE"
  fi

  success "Built $service_name"
  cd "$SCRIPT_DIR"
}

start_service() {
  local service_name=$1
  local port=$2
  local health_endpoint=$3
  local service_dir="$SCRIPT_DIR/$service_name"

  info "Starting $service_name on port $port..."

  # Check if already running
  if curl -s -f "http://localhost:$port$health_endpoint" > /dev/null 2>&1; then
    warn "$service_name is already running on port $port"
    return 0
  fi

  cd "$service_dir"

  # Create .env from .env.example if needed
  if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    warn "Creating .env from .env.example for $service_name"
    cp .env.example .env
  fi

  # Stop any existing process on the port
  local existing_pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$existing_pid" ]; then
    warn "Stopping existing process on port $port (PID: $existing_pid)"
    kill $existing_pid 2>/dev/null || true
    sleep 2
  fi

  # Start the service
  PORT=$port npm run start > "$LOG_DIR/${service_name}_${TIMESTAMP}.log" 2>&1 &
  local pid=$!

  info "Started $service_name with PID $pid"

  # Wait for service to be ready
  local max_wait=60
  local waited=0
  while [ $waited -lt $max_wait ]; do
    if curl -s -f "http://localhost:$port$health_endpoint" > /dev/null 2>&1; then
      success "$service_name is ready (took ${waited}s)"
      cd "$SCRIPT_DIR"
      return 0
    fi
    sleep 1
    ((waited++))
  done

  error "$service_name failed to start after ${max_wait}s"
  error "Check logs: $LOG_DIR/${service_name}_${TIMESTAMP}.log"
  cd "$SCRIPT_DIR"
  return 1
}

stop_service() {
  local service_name=$1
  local port=$2

  info "Stopping $service_name..."

  # Find and kill process on port
  local pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    kill $pid 2>/dev/null || true
    sleep 2

    # Force kill if still running
    if kill -0 $pid 2>/dev/null; then
      kill -9 $pid 2>/dev/null || true
    fi
    success "Stopped $service_name"
  else
    warn "$service_name was not running on port $port"
  fi
}

# =============================================================================
# Health Check Functions
# =============================================================================

check_service_health() {
  local service_name=$1
  local port=$2
  local health_endpoint=$3

  local response=$(curl -s -w "\n%{http_code}" "http://localhost:$port$health_endpoint" 2>/dev/null)
  local http_code=$(echo "$response" | tail -1)
  local body=$(echo "$response" | head -n -1)

  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓${NC} $service_name (port $port): HEALTHY"
    return 0
  else
    echo -e "${RED}✗${NC} $service_name (port $port): HTTP $http_code"
    return 1
  fi
}

run_health_checks() {
  section "Running Health Checks"

  local all_healthy=true

  for service in "${!SERVICES[@]}"; do
    IFS=':' read -r port container health_endpoint deps <<< "${SERVICES[$service]}"
    if ! check_service_health "$service" "$port" "$health_endpoint"; then
      all_healthy=false
    fi
  done

  echo ""
  if $all_healthy; then
    success "All services are healthy!"
    return 0
  else
    error "Some services are unhealthy"
    return 1
  fi
}

# =============================================================================
# Docker Deployment Functions
# =============================================================================

docker_build_service() {
  local service_name=$1

  info "Building Docker image for $service_name..."
  docker build -t "rez/$service_name:latest" "./$service_name" 2>&1 | tee -a "$LOG_FILE"
}

docker_start_service() {
  local service_name=$1
  local port=$2
  local container_name=$3

  info "Starting Docker container for $service_name..."

  # Stop existing container
  docker stop "$container_name" 2>/dev/null || true
  docker rm "$container_name" 2>/dev/null || true

  # Run container
  docker run -d \
    --name "$container_name" \
    --restart unless-stopped \
    -p "$port:$port" \
    -e NODE_ENV=production \
    -e PORT="$port" \
    -e MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017}" \
    -e REDIS_URL="${REDIS_URL:-redis://localhost:6379}" \
    -e JWT_SECRET="${JWT_SECRET:-}" \
    "rez/$service_name:latest" 2>&1 | tee -a "$LOG_FILE"

  success "Started $service_name as container $container_name"
}

# =============================================================================
# Main Deployment Functions
# =============================================================================

deploy_all_services() {
  section "Deploying All Core Services"

  local failed=0

  for service in "${!SERVICES[@]}"; do
    IFS=':' read -r port container health_endpoint deps <<< "${SERVICES[$service]}"

    echo ""
    info "━━━ $service (port $port) ━━━"

    # Build service
    if ! build_service "$service"; then
      error "Failed to build $service"
      ((failed++))
      continue
    fi

    # Start service
    if ! start_service "$service" "$port" "$health_endpoint"; then
      error "Failed to start $service"
      ((failed++))
    fi
  done

  return $failed
}

stop_all_services() {
  section "Stopping All Services"

  for service in "${!SERVICES[@]}"; do
    IFS=':' read -r port container health_endpoint deps <<< "${SERVICES[$service]}"
    stop_service "$service" "$port"
  done

  success "All services stopped"
}

deploy_docker() {
  section "Deploying with Docker"

  local failed=0

  for service in "${!SERVICES[@]}"; do
    IFS=':' read -r port container health_endpoint deps <<< "${SERVICES[$service]}"

    echo ""
    info "━━━ $service (port $port) ━━━"

    # Build Docker image
    if ! docker_build_service "$service"; then
      error "Failed to build Docker image for $service"
      ((failed++))
      continue
    fi

    # Start container
    if ! docker_start_service "$service" "$port" "$container"; then
      error "Failed to start Docker container for $service"
      ((failed++))
    fi
  done

  return $failed
}

status_all_services() {
  section "Service Status"

  echo ""
  printf "${BOLD}%-25s %-10s %-15s %s${NC}\n" "Service" "Port" "Status" "PID"
  echo "------------------------------------------------------------------------"

  for service in "${!SERVICES[@]}"; do
    IFS=':' read -r port container health_endpoint deps <<< "${SERVICES[$service]}"

    local pid=$(lsof -ti:$port 2>/dev/null || echo "-")
    local status="STOPPED"
    local status_color="${RED}"

    if curl -s -f "http://localhost:$port$health_endpoint" > /dev/null 2>&1; then
      status="RUNNING"
      status_color="${GREEN}"
    fi

    printf "%-25s %-10s ${status_color}%-15s${NC} %s\n" "$service" "$port" "$status" "$pid"
  done

  echo ""
}

show_usage() {
  echo "Usage: $0 [command] [options]"
  echo ""
  echo "Commands:"
  echo "  deploy          Deploy all core services"
  echo "  deploy-docker   Deploy all services using Docker"
  echo "  stop            Stop all services"
  echo "  restart         Restart all services"
  echo "  status          Show status of all services"
  echo "  health          Run health checks"
  echo "  logs [service] Show logs for a service"
  echo ""
  echo "Options:"
  echo "  --no-build      Skip building, just start services"
  echo "  --force         Force restart even if running"
}

# =============================================================================
# Main Entry Point
# =============================================================================

main() {
  local command=${1:-deploy}
  shift || true

  echo ""
  echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║     ReZ Platform - Core Services Production Deployment     ║${NC}"
  echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  # Run setup
  setup

  case "$command" in
    deploy)
      deploy_all_services
      local result=$?
      if [ $result -eq 0 ]; then
        run_health_checks
      fi
      ;;
    deploy-docker)
      deploy_docker
      local result=$?
      if [ $result -eq 0 ]; then
        run_health_checks
      fi
      ;;
    stop)
      stop_all_services
      ;;
    restart)
      stop_all_services
      sleep 3
      deploy_all_services
      ;;
    status)
      status_all_services
      ;;
    health)
      run_health_checks
      ;;
    logs)
      local service=${1:-}
      if [ -n "$service" ]; then
        tail -f "$LOG_DIR/${service}_${TIMESTAMP}.log" 2>/dev/null || \
          error "No logs found for $service"
      else
        tail -f "$LOG_FILE"
      fi
      ;;
    *)
      show_usage
      exit 1
      ;;
  esac

  echo ""
  status_all_services
  echo ""
}

# Run main
main "$@"
