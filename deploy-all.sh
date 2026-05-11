#!/bin/bash
# =============================================================================
# REZ Ecosystem - Master Deployment Script
# Deploys all 9 company repos to Render
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_LOG="${LOG_DIR}/deploy-all_${TIMESTAMP}.log"
RENDER_API_KEY="${RENDER_API_KEY:-}"

# Company repos to deploy
REPOS=(
    "RTNM-Group"
    "RABTUL-Technologies"
    "REZ-Intelligence"
    "REZ-Media"
    "REZ-Merchant"
    "REZ-Consumer"
    "StayOwn-Hospitality"
    "CorpPerks"
    "RTNM-Digital"
)

# Deployment statistics
declare -A START_TIMES
declare -A END_TIMES
declare -A DEPLOY_STATUS
TOTAL_SUCCESS=0
TOTAL_FAILED=0
TOTAL_SKIPPED=0

# =============================================================================
# Helper Functions
# =============================================================================

log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$DEPLOY_LOG"
}

log_header() {
    echo ""
    echo -e "${CYAN}=============================================================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}=============================================================================${NC}"
    echo ""
}

log_success() {
    log "${GREEN}SUCCESS${NC}" "$1"
}

log_error() {
    log "${RED}ERROR${NC}" "$1"
}

log_warning() {
    log "${YELLOW}WARNING${NC}" "$1"
}

log_info() {
    log "${BLUE}INFO${NC}" "$1"
}

# =============================================================================
# Pre-deployment Checks
# =============================================================================

check_prerequisites() {
    log_header "PRE-DEPLOYMENT CHECKS"

    # Check for Render CLI
    if ! command -v render &> /dev/null; then
        log_warning "Render CLI not found. Install from: https://render.com/docs/cli"
    else
        log_info "Render CLI found"
    fi

    # Check for curl
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi

    # Check for jq
    if ! command -v jq &> /dev/null; then
        log_warning "jq not found. Some features may be limited."
    fi

    # Check for Render API key
    if [ -z "$RENDER_API_KEY" ]; then
        if [ -f "${SCRIPT_DIR}/.env" ]; then
            export $(grep -v '^#' "${SCRIPT_DIR}/.env" | xargs)
            RENDER_API_KEY="${RENDER_API_KEY:-}"
        fi
    fi

    if [ -z "$RENDER_API_KEY" ]; then
        log_warning "RENDER_API_KEY not set. Some features may not work."
    fi

    log_success "Prerequisites check completed"
}

create_log_directory() {
    mkdir -p "$LOG_DIR"
    log_info "Log directory: $LOG_DIR"
}

# =============================================================================
# Repository Deployment Functions
# =============================================================================

deploy_repo() {
    local repo_name="$1"
    local repo_path="${SCRIPT_DIR}/${repo_name}"
    local deploy_script="${repo_path}/deploy.sh"

    START_TIMES["$repo_name"]=$(date +%s)

    if [ ! -d "$repo_path" ]; then
        log_error "Repository not found: $repo_path"
        DEPLOY_STATUS["$repo_name"]="NOT_FOUND"
        return 1
    fi

    if [ ! -f "$deploy_script" ]; then
        log_error "Deploy script not found: $deploy_script"
        DEPLOY_STATUS["$repo_name"]="NO_SCRIPT"
        return 1
    fi

    log_header "DEPLOYING ${repo_name}"

    # Run the deploy script
    if bash "$deploy_script" 2>&1 | tee -a "$DEPLOY_LOG"; then
        DEPLOY_STATUS["$repo_name"]="SUCCESS"
        ((TOTAL_SUCCESS++))
        log_success "${repo_name} deployed successfully"
    else
        DEPLOY_STATUS["$repo_name"]="FAILED"
        ((TOTAL_FAILED++))
        log_error "${repo_name} deployment failed"
    fi

    END_TIMES["$repo_name"]=$(date +%s)
    return 0
}

deploy_all_sequential() {
    log_header "SEQUENTIAL DEPLOYMENT"

    for repo in "${REPOS[@]}"; do
        deploy_repo "$repo" || true
        echo ""
    done
}

# =============================================================================
# Deployment Summary
# =============================================================================

print_summary() {
    log_header "DEPLOYMENT SUMMARY"

    printf "%-30s %-15s %-10s\n" "Repository" "Status" "Duration"
    echo "----------------------------------------------------------------"

    for repo in "${REPOS[@]}"; do
        local status="${DEPLOY_STATUS[$repo]:-UNKNOWN}"
        local start="${START_TIMES[$repo]:-0}"
        local end="${END_TIMES[$repo]:-$start}"
        local duration=$((end - start))

        # Color status
        case "$status" in
            SUCCESS)
                printf "${GREEN}%-30s %-15s %-10s${NC}\n" "$repo" "$status" "${duration}s"
                ;;
            FAILED)
                printf "${RED}%-30s %-15s %-10s${NC}\n" "$repo" "$status" "${duration}s"
                ;;
            *)
                printf "%-30s %-15s %-10s\n" "$repo" "$status" "${duration}s"
                ;;
        esac
    done

    echo "----------------------------------------------------------------"
    echo ""

    # Summary counts
    printf "${GREEN}Successful: %d${NC}\n" "$TOTAL_SUCCESS"
    printf "${RED}Failed: %d${NC}\n" "$TOTAL_FAILED"
    printf "${YELLOW}Skipped: %d${NC}\n" "$TOTAL_SKIPPED"
    echo ""

    if [ $TOTAL_FAILED -eq 0 ]; then
        log_success "All deployments completed successfully!"
        return 0
    else
        log_error "Some deployments failed. Check logs at: $DEPLOY_LOG"
        return 1
    fi
}

# =============================================================================
# Main Entry Point
# =============================================================================

show_usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

Deploy all REZ ecosystem services to Render.

OPTIONS:
    -h, --help          Show this help message
    -r, --repo NAME     Deploy only specific repo
    -l, --list          List all available repos
    -v, --verbose       Enable verbose output

EXAMPLES:
    $(basename "$0")                    # Deploy all repos sequentially
    $(basename "$0") --repo RTNM-Group # Deploy only RTNM-Group

ENVIRONMENT:
    RENDER_API_KEY    Your Render API key for authentication

EOF
}

list_repos() {
    echo "Available repositories:"
    for repo in "${REPOS[@]}"; do
        echo "  - $repo"
    done
}

# Parse arguments
DEPLOY_MODE="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -r|--repo)
            DEPLOY_MODE="single"
            SELECTED_REPO="$2"
            shift 2
            ;;
        -l|--list)
            list_repos
            exit 0
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║           REZ ECOSYSTEM - MASTER DEPLOYMENT SCRIPT            ║${NC}"
    echo -e "${CYAN}║                    All Company Repos                          ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Initialize
    create_log_directory
    check_prerequisites

    log_info "Deployment mode: $DEPLOY_MODE"
    log_info "Log file: $DEPLOY_LOG"

    case "$DEPLOY_MODE" in
        single)
            deploy_repo "$SELECTED_REPO"
            ;;
        all|*)
            deploy_all_sequential
            ;;
    esac

    # Print summary
    print_summary

    log_info "Full log available at: $DEPLOY_LOG"
}

# Run main
main "$@"
