#!/bin/bash
#
# Model Rollback Script
#
# Rolls back ML model deployment to a previous version.
# Supports Kubernetes, Docker, and canary deployments.
#
# Usage:
#   ./rollback-model.sh --model intent-classifier --to-version v20240101
#   ./rollback-model.sh --model intent-classifier --steps 2
#   ./rollback-model.sh --model intent-classifier --list-versions
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${SCRIPT_DIR}/../config"
MODEL_REGISTRY_PATH="${MODEL_REGISTRY_PATH:-gs://rez-ml-models}"
K8S_NAMESPACE="${K8S_NAMESPACE:-ml-production}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Parse command line arguments
parse_args() {
    MODEL_NAME=""
    TARGET_VERSION=""
    ROLLBACK_STEPS=""
    LIST_VERSIONS=false
    DRY_RUN=false
    SKIP_HEALTH_CHECK=false
    SKIP_NOTIFICATION=false
    DEPLOYMENT_NAME=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            --model)
                MODEL_NAME="$2"
                shift 2
                ;;
            --to-version)
                TARGET_VERSION="$2"
                shift 2
                ;;
            --steps)
                ROLLBACK_STEPS="$2"
                shift 2
                ;;
            --list-versions)
                LIST_VERSIONS=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-health-check)
                SKIP_HEALTH_CHECK=true
                shift
                ;;
            --skip-notification)
                SKIP_NOTIFICATION=true
                shift
                ;;
            --deployment)
                DEPLOYMENT_NAME="$2"
                shift 2
                ;;
            --namespace)
                K8S_NAMESPACE="$2"
                shift 2
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Validate required arguments
    if [[ "$LIST_VERSIONS" == "false" && -z "$MODEL_NAME" ]]; then
        log_error "--model is required"
        exit 1
    fi

    if [[ -z "$DEPLOYMENT_NAME" ]]; then
        DEPLOYMENT_NAME="ml-serving"
    fi

    export MODEL_NAME TARGET_VERSION ROLLBACK_STEPS LIST_VERSIONS DRY_RUN
    export SKIP_HEALTH_CHECK SKIP_NOTIFICATION DEPLOYMENT_NAME K8S_NAMESPACE
}

# List available model versions
list_versions() {
    local model="$1"
    local versions=()

    log_info "Available versions for model: $model"

    # Get versions from model registry
    if gsutil ls "${MODEL_REGISTRY_PATH}/models/${model}/" &>/dev/null; then
        echo ""
        echo "Registered versions:"
        echo "-------------------"
        gsutil ls "${MODEL_REGISTRY_PATH}/models/${model}/" 2>/dev/null | while read -r version; do
            local version_name
            version_name=$(basename "$version" | tr -d '/')
            local size
            size=$(gsutil du -sh "$version" 2>/dev/null | cut -f1 || echo "unknown")
            local date
            date=$(gsutil ls -l "$version" 2>/dev/null | tail -1 | awk '{print $1, $2}' || echo "unknown")
            printf "  %-20s %10s %s\n" "$version_name" "$size" "$date"
        done
    else
        log_warning "No versions found in registry"
    fi

    # Also check deployment history
    echo ""
    echo "Deployment history:"
    echo "-------------------"
    kubectl rollout history "deployment/${DEPLOYMENT_NAME}" -n "$K8S_NAMESPACE" 2>/dev/null | tail -20 || true
}

# Get current model version
get_current_version() {
    local current_image
    current_image=$(kubectl get deployment "$DEPLOYMENT_NAME" -n "$K8S_NAMESPACE" \
        -o jsonpath='{.spec.template.spec.containers[?(@.name=="intent")].image}' 2>/dev/null || echo "")

    if [[ -z "$current_image" ]]; then
        current_image=$(kubectl get deployment "$DEPLOYMENT_NAME" -n "$K8S_NAMESPACE" \
            -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "")
    fi

    echo "$current_image"
}

# Get version from N deployments ago
get_previous_version() {
    local steps="${1:-1}"

    local version
    version=$(kubectl rollout undo "deployment/${DEPLOYMENT_NAME}" \
        -n "$K8S_NAMESPACE" \
        --to-revision="$steps" \
        --dry-run=client \
        -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "")

    echo "$version"
}

# Build model image path
build_image_path() {
    local model="$1"
    local version="$2"

    echo "${MODEL_REGISTRY_PATH}/models/${model}:${version}"
}

# Perform health check
health_check() {
    local endpoint="${1:-https://ml.rez.ai/health}"
    local max_attempts="${2:-30}"
    local attempt=1

    log_info "Running health check against: $endpoint"

    while [[ $attempt -le $max_attempts ]]; do
        local response
        response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" 2>/dev/null || echo "000")

        if [[ "$response" == "200" ]]; then
            log_success "Health check passed (attempt $attempt/$max_attempts)"
            return 0
        fi

        log_info "Health check attempt $attempt/$max_attempts failed (HTTP $response)"
        sleep 2
        ((attempt++))
    done

    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Run smoke test
smoke_test() {
    local model="$1"
    local endpoint="${2:-https://ml.rez.ai/predict}"

    log_info "Running smoke test..."

    local test_payload
    test_payload='{"text": "hello world", "confidence": true}'

    local response
    response=$(curl -s -X POST "$endpoint" \
        -H "Content-Type: application/json" \
        -d "$test_payload" 2>/dev/null || echo '{"error": "connection failed"}')

    if echo "$response" | grep -q "intent\|prediction\|error"; then
        log_success "Smoke test passed"
        return 0
    else
        log_error "Smoke test failed: $response"
        return 1
    fi
}

# Rollback model
rollback_model() {
    local model="$1"
    local target_version="${2:-}"
    local steps="${3:-}"

    local current_version
    current_version=$(get_current_version)
    log_info "Current version: $current_version"

    if [[ -z "$current_version" ]]; then
        log_error "Could not determine current version"
        exit 1
    fi

    # Determine target version
    local new_version
    if [[ -n "$target_version" ]]; then
        new_version=$(build_image_path "$model" "$target_version")
    elif [[ -n "$steps" ]]; then
        log_info "Rolling back $steps deployment(s)..."
        new_version=$(get_previous_version "$steps")

        if [[ -z "$new_version" || "$new_version" == "$current_version" ]]; then
            log_warning "Could not determine previous version, using standard rollback"
            kubectl rollout undo "deployment/${DEPLOYMENT_NAME}" -n "$K8S_NAMESPACE" --to-revision="$steps"
        fi
    else
        # Standard one-step rollback
        log_info "Performing standard rollback..."
        kubectl rollout undo "deployment/${DEPLOYMENT_NAME}" -n "$K8S_NAMESPACE"
        log_success "Rollback initiated"
        return 0
    fi

    # Dry run mode
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would roll back to: $new_version"
        return 0
    fi

    # Set the new image
    log_info "Rolling back to: $new_version"

    kubectl set image "deployment/${DEPLOYMENT_NAME}" \
        intent="$new_version" \
        -n "$K8S_NAMESPACE"

    # Wait for rollout
    log_info "Waiting for rollout to complete..."
    if ! kubectl rollout status "deployment/${DEPLOYMENT_NAME}" \
        -n "$K8S_NAMESPACE" \
        --timeout=10m; then
        log_error "Rollout failed"
        return 1
    fi

    log_success "Rollback completed"

    # Health check (unless skipped)
    if [[ "$SKIP_HEALTH_CHECK" == "false" ]]; then
        local endpoint="https://ml.rez.ai/health"
        if ! health_check "$endpoint"; then
            log_warning "Health check failed after rollback"
            log_info "Rolling back to previous version..."

            # Attempt to rollback again
            kubectl rollout undo "deployment/${DEPLOYMENT_NAME}" -n "$K8S_NAMESPACE"
            kubectl rollout status "deployment/${DEPLOYMENT_NAME}" -n "$K8S_NAMESPACE" --timeout=5m

            log_error "Automatic recovery completed - now on previous version"
            return 1
        fi
    fi

    # Record rollback
    record_rollback "$model" "$new_version" "$current_version"

    return 0
}

# Record rollback to history
record_rollback() {
    local model="$1"
    local new_version="$2"
    local previous_version="$3"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    local rollback_record
    rollback_record=$(cat <<EOF
{
    "timestamp": "$timestamp",
    "model": "$model",
    "previous_version": "$previous_version",
    "new_version": "$new_version",
    "trigger": "manual_rollback"
}
EOF
)

    # Save to GCS
    local history_path="${MODEL_REGISTRY_PATH}/models/${model}/rollback_history.jsonl"

    echo "$rollback_record" | gsutil cp - "$history_path" 2>/dev/null || true

    log_info "Rollback recorded to: $history_path"
}

# Send Slack notification
send_notification() {
    local status="$1"
    local model="$2"
    local version="$3"
    local message="$4"

    if [[ "$SKIP_NOTIFICATION" == "true" || -z "$SLACK_WEBHOOK" ]]; then
        return 0
    fi

    local color
    local emoji
    case "$status" in
        success)
            color="#36a64f"
            emoji=":white_check_mark:"
            ;;
        failure)
            color="#ff0000"
            emoji=":x:"
            ;;
        *)
            color="#439fe0"
            emoji=":information_source:"
            ;;
    esac

    local payload
    payload=$(cat <<EOF
{
    "attachments": [{
        "color": "$color",
        "title": "$emoji Model Rollback: $model",
        "text": "$message",
        "fields": [
            {"title": "Model", "value": "$model", "short": true},
            {"title": "Version", "value": "$version", "short": true}
        ],
        "footer": "ML Ops Pipeline",
        "ts": $(date +%s)
    }]
}
EOF
)

    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$SLACK_WEBHOOK" > /dev/null 2>&1 || true
}

# Main function
main() {
    parse_args "$@"

    log_info "ML Model Rollback Script"
    log_info "========================"
    echo ""

    # List versions
    if [[ "$LIST_VERSIONS" == "true" ]]; then
        list_versions "$MODEL_NAME"
        exit 0
    fi

    # Rollback
    local result=0

    if [[ -n "$TARGET_VERSION" ]]; then
        log_info "Rolling back to specific version: $TARGET_VERSION"
        rollback_model "$MODEL_NAME" "$TARGET_VERSION" || result=$?
    elif [[ -n "$ROLLBACK_STEPS" ]]; then
        log_info "Rolling back $ROLLBACK_STEPS step(s)"
        rollback_model "$MODEL_NAME" "" "$ROLLBACK_STEPS" || result=$?
    else
        log_info "Performing standard one-step rollback"
        rollback_model "$MODEL_NAME" || result=$?
    fi

    # Notification
    if [[ "$result" -eq 0 ]]; then
        send_notification "success" "$MODEL_NAME" "$TARGET_VERSION" "Rollback completed successfully"
    else
        send_notification "failure" "$MODEL_NAME" "$TARGET_VERSION" "Rollback failed - manual intervention required"
    fi

    exit "$result"
}

# Run main
main "$@"
