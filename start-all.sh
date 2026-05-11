#!/bin/bash
# ============================================================
# ReZ Ecosystem — Start All Services
# ============================================================
# Starts all services from 9 company repos:
#   1. REZ-Intelligence   6. CorpPerks
#   2. REZ-Media           7. StayOwn-Hospitality
#   3. REZ-Consumer        8. RTNM-Group
#   4. REZ-Merchant        9. RTNM-Digital
#   5. RABTUL-Technologies
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "============================================================"
echo "   ReZ Ecosystem — Starting All Services"
echo "============================================================"
echo ""

# Function to start docker-compose in a directory
start_docker_compose() {
    local dir="$1"
    local name="$2"
    local compose_file="${3:-docker-compose.yml}"

    if [ -f "$dir/$compose_file" ]; then
        log_info "Starting $name services..."
        cd "$dir"
        if docker compose -f "$compose_file" up -d 2>/dev/null || docker-compose -f "$compose_file" up -d 2>/dev/null; then
            log_success "$name services started"
        else
            log_warn "$name: No compose file or build required"
        fi
        cd "$SCRIPT_DIR"
    fi
}

# Function to start services from a repo with its own docker setup
start_repo_services() {
    local repo_path="$1"
    local repo_name="$2"
    local compose_file="${3:-docker-compose.yml}"

    if [ -d "$repo_path" ]; then
        if [ -f "$repo_path/$compose_file" ]; then
            log_info "Starting $repo_name services..."
            (cd "$repo_path" && docker compose -f "$compose_file" up -d 2>/dev/null || docker-compose -f "$compose_file" up -d 2>/dev/null) || true
            log_success "$repo_name started"
        else
            log_info "Checking for individual services in $repo_name..."
            # Check for package.json or other service definitions
            if [ -f "$repo_path/package.json" ]; then
                log_warn "$repo_name: No docker-compose.yml found, may need npm start"
            fi
        fi
    fi
}

# Start core infrastructure first
log_info "Starting Core Infrastructure (MongoDB, Redis, PostgreSQL)..."
docker compose -f docker-compose.yml up -d mongodb-primary mongodb-secondary-1 mongodb-secondary-2 redis postgres 2>/dev/null || \
docker-compose -f docker-compose.yml up -d mongodb-primary mongodb-secondary-1 mongodb-secondary-2 redis postgres 2>/dev/null || true
log_success "Core infrastructure started"
echo ""

# Initialize MongoDB Replica Set
log_info "Initializing MongoDB Replica Set..."
sleep 5
docker exec rez-mongodb-primary mongosh --eval '
    try {
        rs.initiate({
            _id: "rs0",
            members: [
                { _id: 0, host: "mongodb-primary:27017", priority: 2 },
                { _id: 1, host: "mongodb-secondary-1:27017", priority: 1 },
                { _id: 2, host: "mongodb-secondary-2:27017", priority: 1 }
            ]
        });
        print("Replica set initialized");
    } catch (e) {
        if (e.codeName === "AlreadyInitialized") {
            print("Replica set already initialized");
        } else {
            print("Error: " + e.message);
        }
    }
' >/dev/null 2>&1 || log_warn "Replica set init skipped (may already be configured)"
echo ""

# Start all 9 company repos
log_info "============================================================"
log_info "Starting 9 Company Repos"
log_info "============================================================"
echo ""

# 1. REZ-Intelligence
echo ""
log_info "[1/9] REZ-Intelligence..."
if [ -f "REZ-Intelligence/docker-compose.yml" ]; then
    (cd REZ-Intelligence && docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null) || true
fi

# 2. REZ-Media
echo ""
log_info "[2/9] REZ-Media..."
if [ -f "REZ-Media/docker-compose.yml" ]; then
    (cd REZ-Media && docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null) || true
fi

# 3. REZ-Consumer
echo ""
log_info "[3/9] REZ-Consumer..."
if [ -f "REZ-Consumer/docker-compose.yml" ]; then
    (cd REZ-Consumer && docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null) || true
fi

# 4. REZ-Merchant
echo ""
log_info "[4/9] REZ-Merchant..."
if [ -f "REZ-Merchant/docker-compose.yml" ]; then
    (cd REZ-Merchant && docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null) || true
fi

# 5. RABTUL-Technologies
echo ""
log_info "[5/9] RABTUL-Technologies..."
if [ -f "RABTUL-Technologies/docker-compose.yml" ]; then
    (cd RABTUL-Technologies && docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null) || true
fi

# 6. CorpPerks
echo ""
log_info "[6/9] CorpPerks..."
if [ -f "CorpPerks/docker-compose.yml" ]; then
    (cd CorpPerks && docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null) || true
fi

# 7. StayOwn-Hospitality
echo ""
log_info "[7/9] StayOwn-Hospitality..."
if [ -f "StayOwn-Hospitality/docker-compose.yml" ]; then
    (cd StayOwn-Hospitality && docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null) || true
fi

# 8. RTNM-Group
echo ""
log_info "[8/9] RTNM-Group..."
if [ -f "RTNM-Group/docker-compose.yml" ]; then
    (cd RTNM-Group && docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null) || true
fi

# 9. RTNM-Digital
echo ""
log_info "[9/9] RTNM-Digital..."
if [ -f "RTNM-Digital/docker-compose.yml" ]; then
    (cd RTNM-Digital && docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null) || true
fi

echo ""
echo "============================================================"
log_success "All services startup initiated!"
echo "============================================================"
echo ""
log_info "Run './status-all.sh' to check service status"
log_info "Run './logs-all.sh' to view service logs"
echo ""
