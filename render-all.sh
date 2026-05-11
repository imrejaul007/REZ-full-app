#!/usr/bin/env bash
#
# render-all.sh - Deploy all ReZ services to Render
# Usage: ./render-all.sh [options]
#
# Options:
#   --dry-run        Show what would be deployed without deploying
#   --service NAME   Deploy only the specified service
#   --group NAME     Deploy services in a specific group (core, media, intelligence, merchant, consumer, admin)
#   --env ENV        Target environment (staging, production)
#   --parallel N     Number of parallel deployments (default: 5)
#   --wait           Wait for deployments to complete
#   --status         Show deployment status only
#
# Environment Variables Required:
#   RENDER_API_KEY   Your Render API key
#   RENDER_YAML_ROOT Root directory containing render.yaml files
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
RENDER_API_KEY="${RENDER_API_KEY:-}"
RENDER_API_URL="https://api.render.com/v1"
DEPLOY_TIMEOUT=600  # 10 minutes per service
PARALLEL_DEPLOYMENTS=5
DRY_RUN=false
WAIT_FOR_DEPLOY=false
SHOW_STATUS_ONLY=false
TARGET_ENV="production"
FILTER_SERVICE=""
FILTER_GROUP=""

# Service Groups
declare -A SERVICE_GROUPS=(
    ["core"]="rez-api-gateway,rez-core-platform,rez-identity-graph"
    ["media"]="REZ-Media"
    ["intelligence"]="REZ-Intelligence"
    ["merchant"]="REZ-Merchant"
    ["consumer"]="REZ-Consumer"
    ["admin"]="RTNM-Group"
)

# Counters
TOTAL_SERVICES=0
SUCCESSFUL=0
FAILED=0
SKIPPED=0

# Arrays for tracking
DEPLOY_PIDS=()
SERVICE_STATUS=()

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo -e "${CYAN}[DEBUG]${NC} $1"
    fi
}

log_header() {
    echo ""
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                log_warn "DRY RUN MODE - No actual deployments will occur"
                shift
                ;;
            --service)
                FILTER_SERVICE="$2"
                shift 2
                ;;
            --group)
                FILTER_GROUP="$2"
                shift 2
                ;;
            --env)
                TARGET_ENV="$2"
                shift 2
                ;;
            --parallel)
                PARALLEL_DEPLOYMENTS="$2"
                shift 2
                ;;
            --wait)
                WAIT_FOR_DEPLOY=true
                shift
                ;;
            --status)
                SHOW_STATUS_ONLY=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
${BOLD}ReZ Render Deployment Script${NC}

${BOLD}USAGE:${NC}
    ./render-all.sh [OPTIONS]

${BOLD}OPTIONS:${NC}
    --dry-run          Show what would be deployed without deploying
    --service NAME     Deploy only the specified service
    --group NAME       Deploy services in a specific group:
                       core, media, intelligence, merchant, consumer, admin
    --env ENV          Target environment (staging, production) [default: production]
    --parallel N       Number of parallel deployments [default: 5]
    --wait             Wait for deployments to complete
    --status           Show deployment status only
    --help, -h         Show this help message

${BOLD}ENVIRONMENT VARIABLES:${NC}
    RENDER_API_KEY     Your Render API key (required)
    RENDER_YAML_ROOT   Root directory containing render.yaml files
                       [default: /Users/rejaulkarim/Documents/ReZ Full App]

${BOLD}EXAMPLES:${NC}
    # Deploy all services
    RENDER_API_KEY=your_key ./render-all.sh

    # Deploy only API Gateway
    RENDER_API_KEY=your_key ./render-all.sh --service rez-api-gateway

    # Deploy only core services
    RENDER_API_KEY=your_key ./render-all.sh --group core

    # Dry run to see what would be deployed
    RENDER_API_KEY=your_key ./render-all.sh --dry-run

    # Show deployment status
    RENDER_API_KEY=your_key ./render-all.sh --status

${BOLD}SERVICE GROUPS:${NC}
    core        - Core platform services
    media       - Marketing and media services
    intelligence - AI and analytics services
    merchant    - Merchant-facing services
    consumer   - Consumer-facing services
    admin      - Admin and management services

EOF
}

# Validate prerequisites
validate_prerequisites() {
    log_info "Validating prerequisites..."

    if [[ -z "$RENDER_API_KEY" ]]; then
        log_error "RENDER_API_KEY environment variable is not set"
        log_info "Get your API key from: https://dashboard.render.com/account/api-keys"
        exit 1
    fi

    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        log_warn "jq is not installed. JSON parsing will be limited"
        log_info "Install with: brew install jq (macOS) or apt install jq (Ubuntu)"
    fi

    # Test API connectivity
    log_info "Testing Render API connectivity..."
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        "$RENDER_API_URL/services" 2>/dev/null || echo "000")

    if [[ "$response" == "401" ]]; then
        log_error "Invalid Render API key"
        exit 1
    elif [[ "$response" == "000" ]]; then
        log_error "Cannot connect to Render API"
        exit 1
    elif [[ "$response" != "200" ]]; then
        log_error "Render API returned status: $response"
        exit 1
    fi

    log_success "Prerequisites validated"
}

# Find all render.yaml files
find_render_configs() {
    local root_dir="${RENDER_YAML_ROOT:-/Users/rejaulkarim/Documents/ReZ Full App}"
    local configs=()

    if [[ -n "$FILTER_SERVICE" ]]; then
        # Find specific service
        local service_path=$(find "$root_dir" -name "render.yaml" -path "*$FILTER_SERVICE*" 2>/dev/null | head -5)
        if [[ -z "$service_path" ]]; then
            log_error "Service not found: $FILTER_SERVICE"
            exit 1
        fi
        echo "$service_path"
        return
    fi

    if [[ -n "$FILTER_GROUP" ]]; then
        # Find services in group
        local group_pattern="${SERVICE_GROUPS[$FILTER_GROUP]:-}"
        if [[ -z "$group_pattern" ]]; then
            log_error "Unknown group: $FILTER_GROUP"
            log_info "Available groups: ${!SERVICE_GROUPS[*]}"
            exit 1
        fi

        # Handle special directory groups
        if [[ "$FILTER_GROUP" == "media" ]]; then
            find "$root_dir/REZ-Media" -name "render.yaml" 2>/dev/null
        elif [[ "$FILTER_GROUP" == "intelligence" ]]; then
            find "$root_dir/REZ-Intelligence" -name "render.yaml" 2>/dev/null
        elif [[ "$FILTER_GROUP" == "merchant" ]]; then
            find "$root_dir/REZ-Merchant" -name "render.yaml" 2>/dev/null
        elif [[ "$FILTER_GROUP" == "consumer" ]]; then
            find "$root_dir/REZ-Consumer" -name "render.yaml" 2>/dev/null
        elif [[ "$FILTER_GROUP" == "admin" ]]; then
            find "$root_dir/RTNM-Group" -name "render.yaml" 2>/dev/null
        else
            # Handle comma-separated service names
            IFS=',' read -ra SERVICES <<< "$group_pattern"
            for service in "${SERVICES[@]}"; do
                find "$root_dir" -name "render.yaml" -path "*$service*" 2>/dev/null
            done
        fi
        return
    fi

    # Default: find all render.yaml files excluding Archive and backup directories
    find "$root_dir" -name "render.yaml" \
        ! -path "*Archive*" \
        ! -path "*backup*" \
        ! -path "*DELETED*" \
        ! -path "*node_modules*" \
        2>/dev/null
}

# Extract service name from render.yaml
get_service_name() {
    local render_yaml="$1"
    # Try to get name from render.yaml
    local name=$(grep -E "^\s+name:\s+" "$render_yaml" 2>/dev/null | head -1 | sed 's/.*name:\s*//' | tr -d '"' | tr -d "'" || echo "")

    if [[ -z "$name" ]]; then
        # Fallback: use directory name
        name=$(basename "$(dirname "$render_yaml")")
    fi

    echo "$name"
}

# Extract service type from render.yaml
get_service_type() {
    local render_yaml="$1"
    local type=$(grep -E "^\s+type:\s+" "$render_yaml" 2>/dev/null | head -1 | sed 's/.*type:\s*//' || echo "web")
    echo "$type"
}

# Extract region from render.yaml
get_service_region() {
    local render_yaml="$1"
    local region=$(grep -E "^\s+region:\s+" "$render_yaml" 2>/dev/null | head -1 | sed 's/.*region:\s*//' || echo "oregon")
    echo "$region"
}

# Extract plan from render.yaml
get_service_plan() {
    local render_yaml="$1"
    local plan=$(grep -E "^\s+plan:\s+" "$render.yaml" 2>/dev/null | head -1 | sed 's/.*plan:\s*//' || echo "free")
    echo "$plan"
}

# Get existing service from Render
get_render_service() {
    local service_name="$1"
    local response

    response=$(curl -s -X GET \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        "$RENDER_API_URL/services?limit=100" 2>/dev/null)

    if [[ -n "$response" ]] && command -v jq &> /dev/null; then
        echo "$response" | jq -r ".[] | select(.service.name == \"$service_name\") | .service.id" 2>/dev/null || echo ""
    else
        echo ""
    fi
}

# Check if service exists
service_exists() {
    local service_name="$1"
    local service_id=$(get_render_service "$service_name")
    [[ -n "$service_id" ]]
}

# Get service deployment status
get_deploy_status() {
    local service_id="$1"
    local response

    response=$(curl -s -X GET \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        "$RENDER_API_URL/services/$service_id/deploys?limit=1" 2>/dev/null)

    if command -v jq &> /dev/null && [[ -n "$response" ]]; then
        local status=$(echo "$response" | jq -r '.[0].deploy.status' 2>/dev/null || echo "unknown")
        local created=$(echo "$response" | jq -r '.[0].deploy.createdAt' 2>/dev/null || echo "")
        echo "$status|$created"
    else
        echo "unknown|"
    fi
}

# Show deployment status
show_deployment_status() {
    log_header "DEPLOYMENT STATUS"

    local services=$(curl -s -X GET \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        "$RENDER_API_URL/services?limit=100" 2>/dev/null)

    if [[ -z "$services" ]] || [[ "$services" == "[]" ]]; then
        log_warn "No services found or unable to fetch services"
        return
    fi

    if ! command -v jq &> /dev/null; then
        log_error "jq is required for status display"
        echo "$services"
        return
    fi

    echo -e "${BOLD}Service Name                    | Status     | Region   | Plan${NC}"
    echo "-------------------------------------------------------------------"

    echo "$services" | jq -r '.[] | "\(.service.name) | \(.service.region) | \(.service.plan // "free")"' 2>/dev/null | while IFS='|' read -r name region plan; do
        local deploy_info=$(get_deploy_status "$(echo "$services" | jq -r ".[] | select(.service.name == \"$name\") | .service.id")")
        local status=$(echo "$deploy_info" | cut -d'|' -f1)
        printf "%-30s | %-10s | %-8s | %s\n" "$name" "$status" "$region" "$plan"
    done
}

# Create or update service on Render
deploy_service() {
    local render_yaml="$1"
    local service_dir
    service_dir=$(dirname "$render_yaml")
    local service_name
    service_name=$(get_service_name "$render_yaml")
    local service_type
    service_type=$(get_service_type "$render_yaml")

    log_info "Deploying: $service_name (type: $service_type)"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy: $service_name"
        ((SKIPPED++))
        return 0
    fi

    # Check if service exists
    local existing_id
    existing_id=$(get_render_service "$service_name")

    if [[ -n "$existing_id" ]]; then
        log_info "Service exists: $service_name (ID: $existing_id)"
        # For existing services, trigger manual deploy via Render Dashboard
        # or use render deploy --service <name>
        log_info "Use Render Dashboard or 'render deploy' CLI to update existing services"
        ((SKIPPED++))
        return 0
    fi

    # Create new service via Render Blueprint
    # Note: This uses the Render API to create services from blueprints
    local blueprint_yaml
    blueprint_yaml=$(mktemp "/tmp/render-blueprint-${service_name}.XXXXXX.yaml")

    # Copy render.yaml to blueprint with environment-specific adjustments
    sed "s/production/$TARGET_ENV/g" "$render_yaml" > "$blueprint_yaml"

    local response
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/x-yaml" \
        -d "@$blueprint_yaml" \
        "$RENDER_API_URL/blueprints" 2>/dev/null)

    rm -f "$blueprint_yaml"

    if [[ $? -eq 0 ]] && command -v jq &> /dev/null; then
        local error=$(echo "$response" | jq -r '.error // empty')
        if [[ -n "$error" ]]; then
            log_error "Failed to deploy $service_name: $error"
            ((FAILED++))
            return 1
        fi
    fi

    log_success "Deployment initiated: $service_name"
    ((SUCCESSFUL++))
    return 0
}

# Deploy services in parallel
deploy_parallel() {
    local pids=()
    local services=("$@")
    local index=0

    for service in "${services[@]}"; do
        # Rate limiting for parallel deployments
        while [[ ${#pids[@]} -ge $PARALLEL_DEPLOYMENTS ]]; do
            for i in "${!pids[@]}"; do
                if ! kill -0 "${pids[$i]}" 2>/dev/null; then
                    unset 'pids[i]'
                fi
            done
            pids=("${pids[@]}")
            sleep 1
        done

        deploy_service "$service" &
        pids+=($!)

        # Small delay between initiating services
        sleep 0.5
    done

    # Wait for all remaining processes
    for pid in "${pids[@]}"; do
        wait "$pid" 2>/dev/null || true
    done
}

# Wait for all deployments
wait_for_deployments() {
    if [[ "$WAIT_FOR_DEPLOY" != "true" ]]; then
        return
    fi

    log_header "WAITING FOR DEPLOYMENTS"

    local max_wait=600  # 10 minutes
    local elapsed=0
    local check_interval=10

    while [[ $elapsed -lt $max_wait ]]; do
        local pending=0
        local completed=0
        local failed=0

        # Check each service deployment status
        for service_yaml in "${DEPLOYED_SERVICES[@]:-}"; do
            local name=$(get_service_name "$service_yaml")
            local id=$(get_render_service "$name")

            if [[ -n "$id" ]]; then
                local status_info
                status_info=$(get_deploy_status "$id")
                local status
                status=$(echo "$status_info" | cut -d'|' -f1)

                case "$status" in
                    "live"|"deactivated")
                        ((completed++))
                        ;;
                    "build_failed"|"canceled")
                        ((failed++))
                        ;;
                    *)
                        ((pending++))
                        ;;
                esac
            fi
        done

        echo -ne "Progress: completed=$completed pending=$pending failed=$failed elapsed=${elapsed}s\r"

        if [[ $pending -eq 0 ]]; then
            echo ""
            break
        fi

        sleep $check_interval
        ((elapsed+=check_interval))
    done

    echo ""
}

# Show deployment summary
show_summary() {
    log_header "DEPLOYMENT SUMMARY"

    echo -e "${BOLD}Total Services:${NC} $TOTAL_SERVICES"
    echo -e "${GREEN}Successful:${NC}  $SUCCESSFUL"
    echo -e "${RED}Failed:${NC}       $FAILED"
    echo -e "${YELLOW}Skipped:${NC}     $SKIPPED"

    if [[ $FAILED -gt 0 ]]; then
        echo ""
        log_error "Some deployments failed. Check the Render Dashboard for details."
        return 1
    fi

    if [[ $SUCCESSFUL -gt 0 ]]; then
        echo ""
        log_success "All deployments initiated successfully!"
        log_info "Monitor deployments at: https://dashboard.render.com"
    fi
}

# Main execution
main() {
    parse_args "$@"

    if [[ "$SHOW_STATUS_ONLY" == "true" ]]; then
        validate_prerequisites
        show_deployment_status
        exit 0
    fi

    validate_prerequisites

    log_header "ReZ RENDER DEPLOYMENT"
    echo "Target Environment: $TARGET_ENV"
    echo "Parallel Deployments: $PARALLEL_DEPLOYMENTS"
    echo "Dry Run: $DRY_RUN"
    echo ""

    # Find all render.yaml files
    log_info "Scanning for services..."
    local render_configs
    render_configs=$(find_render_configs)

    if [[ -z "$render_configs" ]]; then
        log_error "No render.yaml files found"
        exit 1
    fi

    # Convert to array
    mapfile -t config_array <<< "$render_configs"
    TOTAL_SERVICES=${#config_array[@]}

    log_success "Found $TOTAL_SERVICES services to deploy"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo ""
        echo -e "${BOLD}Services to deploy:${NC}"
        for config in "${config_array[@]}"; do
            local name=$(get_service_name "$config")
            local type=$(get_service_type "$config")
            local region=$(get_service_region "$config")
            printf "  - %-40s (type: %-8s region: %s)\n" "$name" "$type" "$region"
        done
        echo ""
        exit 0
    fi

    # Deploy services
    log_info "Starting deployment..."
    DEPLOYED_SERVICES=("${config_array[@]}")

    if [[ $PARALLEL_DEPLOYMENTS -eq 1 ]]; then
        for config in "${config_array[@]}"; do
            deploy_service "$config"
        done
    else
        deploy_parallel "${config_array[@]}"
    fi

    wait_for_deployments
    show_summary
}

# Trap for cleanup
trap 'log_error "Interrupted"; exit 130' INT TERM

# Run main
main "$@"
